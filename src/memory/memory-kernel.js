/**
 * MemoryKernel — 心虫记忆核心组件（v6.0.0，补齐 R1-R8）
 *
 * 职责：
 * 1. 启动时读取 core.json + memory-index.json，恢复最新记忆状态
 * 2. 提供统一写入接口，保证分级保存
 * 3. 管理1000条容量上限，超限自动淘汰（按重要性+新近度）
 * 4. 持久化进度与成长信号
 * 5. 噪声过滤：不写入日志/错误/测试/重复内容
 * 6. 实时落盘：每次写入同步 appendFileSync
 * 7. 退出 flush：beforeExit/SIGINT/SIGTERM 触发 fsync
 * 8. 新对话继承：getInheritedContext('full') 返回全部永久记忆
 * 9. 规则自检：validate()/audit() 供启动健康检查调用
 */

const fs = require('../utils/safe-fs');
const path = require('path');

class MemoryKernel {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.memDir = path.join(rootPath, 'data', 'memories');
    this.corePath = path.join(this.memDir, 'core.json');
    this.userMemPath = path.join(this.memDir, 'user-memories.jsonl');
    this.selfMemPath = path.join(this.memDir, 'self-memories.jsonl');
    this.ctxPath = path.join(this.memDir, 'context-memory.json');
    this.indexPath = path.join(this.memDir, 'memory-index.json');

    // 默认规则（R1-R8）
    this.rules = {
      maxEntries: 1000,
      evictionPolicy: 'importance_then_recency',
      realtime: true,
      flushOnExit: true,
      inheritAll: true,
      snapshotIntervalMs: 200,
      selfCompactAt: 500,
      // [L-5] 文件轮转：单个记忆文件超过此字节数时轮转
      rotateBytes: 10 * 1024 * 1024, // 10MB
      maxRotatedFiles: 5,
    };

    // 状态
    this.state = {
      learningCount: 0,
      topicsExplored: [],
      correctionsApplied: 0,
      growthSignal: 'neutral',
      lastUserInput: null,
      lastSelfOutput: null,
      lastTs: null,
    };

    // 索引（R2：memory-index.json）
    this._index = null;
    this._loaded = false;
    this._seenContent = new Set();
    this._snapshotTimer = null;
    this._exitBound = false;
    this._initErrors = [];
  }

  // ── R1：启动即加载永久记忆 ─────────────────────────────────────────
  init() {
    if (!fs.existsSync(this.memDir)) fs.mkdirSync(this.memDir, { recursive: true });
    this._loadCore();
    this._loadIndex();
    if (this.rules.flushOnExit) this._bindExitHandlers();
    this._loaded = true;
    // [M-1] 收紧记忆文件权限：仅所有者可读写
    this._tightenPermissions();
    return this._index;
  }

  _tightenPermissions() {
    try {
      const targets = [this.corePath, this.userMemPath, this.selfMemPath, this.indexPath];
      for (const p of targets) {
        if (fs.existsSync(p)) {
          try { fs.chmodSync(p, 0o600); } catch (e) { /* best-effort */ }
        }
      }
    } catch (e) { /* best-effort */ }
  }

  // ── 内部加载 ──────────────────────────────────────────────────────
  _loadCore() {
    try {
      if (fs.existsSync(this.corePath)) {
        const raw = fs.readFileSync(this.corePath, 'utf8');
        const core = JSON.parse(raw);
        if (core.state) {
          this.state = Object.assign(this.state, core.state);
        }
      }
    } catch (e) {
      // [M-4] 不再完全静默：记录初始化错误
      this._appendInitError('core-load', { message: e.message });
      _log.warn('memory-kernel', 'core_load_failed', { message: e.message });
    }
  }

  _loadIndex() {
    try {
      this._index = fs.existsSync(this.indexPath)
        ? JSON.parse(fs.readFileSync(this.indexPath, 'utf8'))
        : this._buildEmptyIndex();
    } catch (e) {
      this._index = this._buildEmptyIndex();
      // [M-4] 记录索引加载失败，便于诊断
      this._appendInitError('index-load', { message: e.message });
      _log.warn('memory-kernel', 'index_load_failed', { message: e.message });
    }
    // 防御：以真实文件行数校正计数
    this._index.counts.user = this._countLines(this.userMemPath);
    this._index.counts.self = this._countLines(this.selfMemPath);
    this._index.counts.total = this._index.counts.user + this._index.counts.self;
  }

  _buildEmptyIndex() {
    return {
      version: 1,
      savedAt: null,
      lastWriteTs: null,
      counts: { user: 0, self: 0, total: 0 },
      rules: { ...this.rules },
      workingSet: [],
    };
  }

  _countLines(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    const s = fs.readFileSync(filePath, 'utf8').trim();
    return s ? s.split('\n').filter((l) => l.trim()).length : 0;
  }

  // ── R6：实时写盘 ──────────────────────────────────────────────────
  _appendLine(filePath, entry) {
    try {
      // [L-5] 大文件轮转后再写入
      this._rotateIfNeeded(filePath);
    } catch (e) { /* best-effort */ }
    const line = JSON.stringify(entry) + '\n';
    try {
      fs.appendFileSync(filePath, line, 'utf8');
      // [M-5] 立即校验刚写入的行，防止磁盘/IO异常导致 JSONL 行损坏
      this._verifyLastLine(filePath, line);
    } catch (e) {
      // [M-4] 不再静默丢弃：记录到 initErrors 并结构化告警
      this._appendInitError('memory-append', { filePath, message: e.message });
      _log.warn('memory-kernel', 'append_failed', { filePath, message: e.message });
    }
  }

  _verifyLastLine(filePath, expectedLine) {
    try {
      const fd = fs.openSync(filePath, 'r');
      let stat;
      try { stat = fs.fstatSync(fd); } catch (e) { fs.closeSync(fd); return; }
      if (stat.size === 0) { fs.closeSync(fd); return; }
      const buf = Buffer.alloc(Math.min(stat.size, 4096));
      fs.readSync(fd, buf, 0, buf.length, Math.max(0, stat.size - buf.length));
      fs.closeSync(fd);
      const last = buf.toString('utf8').split('\n').filter(Boolean).pop() || '';
      if (last !== expectedLine.trim()) {
        this._appendInitError('memory-corruption', { filePath, reason: 'last_line_mismatch' });
        _log.warn('memory-kernel', 'corruption_detected', { filePath, reason: 'last_line_mismatch' });
      }
    } catch (e) { /* best-effort */ }
  }

  _writeIndex() {
    this._index.savedAt = new Date().toISOString();
    this._index.counts.total = this._index.counts.user + this._index.counts.self;
    this._index.workingSet = this._buildWorkingSet(50);
    const tmp = this.indexPath + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(this._index, null, 2), 'utf8');
    fs.renameSync(tmp, this.indexPath);
  }

  _scheduleSnapshot() {
    if (!this.rules.realtime) { this._writeIndex(); return; }
    if (this._snapshotTimer) return;
    this._snapshotTimer = setTimeout(() => {
      this._snapshotTimer = null;
      this._writeIndex();
    }, this.rules.snapshotIntervalMs);
    if (this._snapshotTimer.unref) this._snapshotTimer.unref();
  }

  // ── R5：1000条上限 + 整条淘汰 ────────────────────────────────────
  _enforceCap() {
    const total = this._index.counts.user + this._index.counts.self;
    if (total <= this.rules.maxEntries) return;
    const all = [...this._readAll('user'), ...this._readAll('self')];
    all.sort((a, b) => (b.importance - a.importance) || (new Date(b.ts) - new Date(a.ts)));
    const keep = new Set(all.slice(0, this.rules.maxEntries).map((e) => e.id));
    this._rewriteLayer('user', (e) => keep.has(e.id));
    this._rewriteLayer('self', (e) => keep.has(e.id));
    this._index.counts.user = this._countLines(this.userMemPath);
    this._index.counts.self = this._countLines(this.selfMemPath);
    this._index.counts.total = this._index.counts.user + this._index.counts.self;
  }

  _rewriteLayer(layer, keepFn) {
    const filePath = layer === 'user' ? this.userMemPath : this.selfMemPath;
    if (!fs.existsSync(filePath)) return;
    const kept = this._readAll(layer).filter(keepFn);
    const tmp = filePath + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, kept.map((e) => JSON.stringify(e)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
    fs.renameSync(tmp, filePath);
  }

  // ── R7：新对话继承全部记忆 ───────────────────────────────────────
  getInheritedContext(mode = 'working', limit = 50) {
    this._ensureLoaded();
    if (mode === 'full') {
      const all = [...this._readAll('user'), ...this._readAll('self')];
      return all.map((e) => this._project(e));
    }
    return this._buildWorkingSet(limit).map((e) => this._project(e));
  }

  _buildWorkingSet(limit = 50) {
    const all = [...this._readAll('user'), ...this._readAll('self')];
    all.sort((a, b) => (b.importance - a.importance) || (new Date(b.ts) - new Date(a.ts)));
    return all.slice(0, limit);
  }

  _project(e) {
    return {
      id: e.id,
      source: e.source,
      ts: e.ts,
      importance: e.importance,
      content: e.source === 'user' ? e.content : (e.insight || e.decision || ''),
    };
  }

  // ── R6：退出前 flush ──────────────────────────────────────────────
  flush() {
    try {
      if (this._snapshotTimer) { clearTimeout(this._snapshotTimer); this._snapshotTimer = null; }
      this._writeIndex();
      for (const p of [this.userMemPath, this.selfMemPath, this.indexPath]) {
        if (!fs.existsSync(p)) continue;
        let fd = -1;
        try { fd = fs.openSync(p, 'r'); fs.fsyncSync(fd); }
        catch (e) { /* best-effort */ }
        finally { if (fd >= 0) fs.closeSync(fd); }
      }
    } catch (e) { /* 退出兜底 */ }
  }

  _bindExitHandlers() {
    if (this._exitBound) return;
    this._exitBound = true;
    const flush = () => this.flush();
    process.once('beforeExit', flush);
    process.once('SIGINT', flush);
    process.once('SIGTERM', flush);
  }

  // ── R8：规则自检 ──────────────────────────────────────────────────
  validate() {
    const violations = [];
    if (this.rules.maxEntries <= 0) violations.push('R5: maxEntries must be > 0');
    const total = this._index.counts.user + this._index.counts.self;
    if (total > this.rules.maxEntries) {
      violations.push(`R5: total ${total} exceeds maxEntries ${this.rules.maxEntries}`);
    }
    return { ok: violations.length === 0, violations };
  }

  audit() {
    return {
      rules: this.rules,
      counts: this._index.counts,
      lastWriteTs: this._index.lastWriteTs,
      savedAt: this._index.savedAt,
      validate: this.validate(),
    };
  }

  // ── 读取全部条目（跳过 _summary 行） ─────────────────────────────
  _readAll(layer) {
    const filePath = layer === 'user' ? this.userMemPath : this.selfMemPath;
    if (!fs.existsSync(filePath)) return [];
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter((l) => l.trim());
    const out = [];
    for (const l of lines) {
      try { const e = JSON.parse(l); if (!e._summary) out.push(e); }
      catch (e) { /* skip corrupt */ }
    }
    return out;
  }

  // ── 生成唯一 ID ──────────────────────────────────────────────────
  _genId(prefix) {
    return `${prefix}-${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}`;
  }

  // ── 内部：_ensureLoaded ───────────────────────────────────────────
  _ensureLoaded() {
    if (!this._loaded) this.init();
  }

  _appendInitError(type, payload) {
    if (!Array.isArray(this._initErrors)) this._initErrors = [];
    this._initErrors.push({ type, payload, ts: new Date().toISOString() });
    if (this._initErrors.length > 200) this._initErrors.splice(0, this._initErrors.length - 200);
  }

  getInitErrors() {
    return Array.isArray(this._initErrors) ? [...this._initErrors] : [];
  }

  // ── 新 API：R3 用户输入完整保存 ──────────────────────────────────
  recordUser(input, meta = {}) {
    this._ensureLoaded();
    const text = input == null ? '' : String(input);
    if (!text.trim()) return null;
    const entry = {
      id: this._genId('u'),
      ts: new Date().toISOString(),
      content: text,
      emotion: meta.emotion ?? null,
      importance: meta.importance ?? 5,
      source: 'user',
    };
    this._appendLine(this.userMemPath, entry);
    this._index.counts.user++;
    this._index.lastWriteTs = entry.ts;
    this._enforceCap();
    this._scheduleSnapshot();
    return entry.id;
  }

  // ── 新 API：R4 大模型输出提炼保存 ───────────────────────────────
  recordSelf(thinkResult, meta = {}) {
    this._ensureLoaded();
    const refined = this._refineOutput(thinkResult, meta);
    const entry = {
      id: this._genId('s'),
      ts: new Date().toISOString(),
      ...refined,
      importance: meta.importance ?? this._defaultSelfImportance(refined),
      source: 'llm',
    };
    this._appendLine(this.selfMemPath, entry);
    this._index.counts.self++;
    this._index.lastWriteTs = entry.ts;
    this._maybeCompactSelf();
    this._enforceCap();
    this._scheduleSnapshot();
    return entry.id;
  }

  _refineOutput(thinkResult, meta) {
    const d = (thinkResult && thinkResult.decision) || {};
    return {
      decision: d.type || null,
      confidence: typeof d.confidence === 'number' ? +d.confidence.toFixed(2) : null,
      emotion: meta.emotion ?? null,
      insight: meta.insight ? String(meta.insight).slice(0, 500) : null,
      thinkCount: meta.thinkCount ?? null,
    };
  }

  _defaultSelfImportance(refined) {
    if (refined.decision && refined.confidence != null && refined.confidence >= 0.7) return 8;
    if (refined.insight) return 7;
    return 4;
  }

  // ── 旧 API 兼容：writeUserMemory / writeSelfMemory ────────────────
  writeUserMemory(content, emotion, decision) {
    if (!this._loaded) return;
    if (this._isNoise(content)) return;
    if (this._seenContent.has(content)) return;
    this._seenContent.add(content);
    try {
      const importance = this._scoreImportance(content);
      const entry = {
        ts: new Date().toISOString(),
        content: content.slice(0, 500),
        emotion: emotion || '中性',
        decision: decision || null,
        importance,
      };
      fs.appendFileSync(this.userMemPath, JSON.stringify(entry) + '\n', 'utf8');
      this.state.lastUserInput = content.slice(0, 200);
      this.state.lastTs = entry.ts;
      this._index.counts.user = this._countLines(this.userMemPath);
      this._index.counts.total = this._index.counts.user + this._index.counts.self;
      this._enforceCap();
      this._scheduleSnapshot();
      this.save();
    } catch (e) { /* 静默 */ }
  }

  writeSelfMemory(summary, keyPoints, decision, confidence, emotion) {
    if (!this._loaded) return;
    try {
      const entry = {
        ts: new Date().toISOString(),
        think: (this.state.learningCount || 0) + 1,
        decision: decision || 'analyze',
        confidence: confidence || '0.60',
        emotion: emotion || '中性',
        summary: summary || '',
        keyPoints: keyPoints || [],
        progress: {
          learningCount: this.state.learningCount || 0,
          topicsExplored: (this.state.topicsExplored || []).slice(-10),
          correctionsApplied: this.state.correctionsApplied || 0,
          growthSignal: this.state.growthSignal || 'neutral',
        },
      };
      fs.appendFileSync(this.selfMemPath, JSON.stringify(entry) + '\n', 'utf8');
      this.state.lastSelfOutput = summary ? summary.slice(0, 200) : null;
      this.state.lastTs = entry.ts;
      this._index.counts.self = this._countLines(this.selfMemPath);
      this._index.counts.total = this._index.counts.user + this._index.counts.self;
      this._maybeCompactSelf();
      this._enforceCap();
      this._scheduleSnapshot();
      this.save();
    } catch (e) { /* 静默 */ }
  }

  // ── 旧 API 兼容：load / save / updateProgress ─────────────────────
  load() {
    return this.init();
  }

  save() {
    try {
      const payload = {
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        state: Object.assign({}, this.state),
      };
      try {
        if (fs.existsSync(this.corePath)) {
          fs.copyFileSync(this.corePath, this.corePath + '.bak');
        }
      } catch (e) { /* 静默 */ }
      fs.writeFileSync(this.corePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) { /* 静默 */ }
  }

  updateProgress(opts = {}) {
    if (!this._loaded) return;
    this.state.learningCount = (this.state.learningCount || 0) + 1;
    this.state.lastTs = new Date().toISOString();
    if (opts.topics && Array.isArray(opts.topics)) {
      const current = this.state.topicsExplored || [];
      for (const topic of opts.topics) {
        if (!current.includes(topic)) current.push(topic);
      }
      this.state.topicsExplored = current.slice(-50);
    }
    if (opts.correction) {
      this.state.correctionsApplied = (this.state.correctionsApplied || 0) + 1;
    }
    if (opts.confidence && typeof opts.confidence === 'number') {
      const prev = this._prevConfidence || 0.5;
      const curr = opts.confidence;
      if (curr > prev + 0.1) this.state.growthSignal = 'growing';
      else if (curr < prev - 0.1) this.state.growthSignal = 'drifting';
      else this.state.growthSignal = 'stable';
      this._prevConfidence = curr;
    }
    this.save();
  }

  // ── 旧 API：extractTopics / _scoreImportance / _isNoise ───────────
  extractTopics(text) {
    const topics = [];
    try {
      const tokens = text.split(/[\s,，。！？；：""''、\.\-\\+（）\(\)\[\]【】\n\r\t]+/).filter((t) => t.length >= 2);
      const stopWords = new Set(['这个', '那个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '而且', '或者', '如果', '虽然', '已经', '可以', '需要', '应该', '不会', '不能', '不要', '还有', '没有', '不是', '只是', '这样', '那样', '一下', '一些', '这些', '那些']);
      for (const token of tokens) {
        if (!stopWords.has(token) && !/^\d+$/.test(token)) topics.push(token);
      }
      return topics.slice(0, 5);
    } catch (e) { return []; }
  }

  _scoreImportance(content) {
    let score = 0.5;
    const len = content.length;
    if (len > 10 && len < 200) score += 0.2;
    else if (len >= 200) score += 0.1;
    const keywords = ['心虫', 'HeartFlow', '记忆', '认知', '升级', '公式', '思考', '决策', '情感', '分析'];
    const hits = keywords.filter((k) => content.includes(k)).length;
    score += Math.min(hits * 0.1, 0.3);
    if (/[？?]/.test(content)) score += 0.1;
    if (/^(请|帮|如何|为什么|怎么|能否)/.test(content)) score += 0.1;
    return Math.min(score, 1.0);
  }

  _isNoise(content) {
    if (!content || !content.trim()) return true;
    const text = content.trim();
    const NOISE_PATTERNS = [
      /^\[存在日志\]/,
      /^\[自进化日志\]/,
      /^\[会话\]/,
      /^\[旧记忆\]/,
      /^\[CORE记忆\]/,
      /^\[ERROR\]/,
      /RuntimeError/,
      /Permission denied/,
      /Response interrupted/,
      /Tool execution failed/,
      /Docker/,
      /^test\s*\d*$/i,
      /^test$/i,
      /^继续$/,
      /^你好$/,
      /^你好，心虫$/,
      /^1\+1等于几$/,
      /^测试核心管线$/,
      /^深度分析：评估认知引擎的元认知状态和漂移趋势$/,
      /^用心虫思考决策/,
      /^请心虫自己决策/,
      /^记忆诊断/,
      /^用心虫思考/,
    ];
    if (NOISE_PATTERNS.some((p) => p.test(text))) return true;
    if (text.length <= 4 && !/[，。！？、；：""''？]/.test(text)) return true;
    return false;
  }

  // ── self 层摘要合并 ──────────────────────────────────────────────
  _maybeCompactSelf() {
    const lines = this._readAll('self');
    if (lines.length < this.rules.selfCompactAt) return;
    const recent = lines.slice(-100);
    const older = lines.slice(0, -100);
    if (older.length === 0) return;
    const _topK = (arr, k) => {
      const c = {};
      for (const v of arr) if (v) c[v] = (c[v] || 0) + 1;
      return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, k).map(([v]) => v);
    };
    const summary = {
      _summary: true,
      ts: new Date().toISOString(),
      count: older.length,
      topDecisions: _topK(older.map((o) => o.decision).filter(Boolean), 3),
      topEmotions: _topK(older.map((o) => o.emotion).filter(Boolean), 3),
      avgConfidence: +(older.reduce((s, o) => s + (parseFloat(o.confidence) || 0), 0) / older.length).toFixed(2),
    };
    const all = [summary, ...recent];
    const tmp = this.selfMemPath + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, all.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
    fs.renameSync(tmp, this.selfMemPath);
  }

  // [L-5] 文件轮转：文件过大时重命名为 .1, .2, ... 并保持最多 maxRotatedFiles
  _rotateIfNeeded(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      const stat = fs.statSync(filePath);
      if (stat.size < this.rules.rotateBytes) return;
      const base = filePath + '.';
      for (let i = this.rules.maxRotatedFiles; i >= 1; i--) {
        const src = base + (i - 1);
        const dst = base + i;
        if (fs.existsSync(src)) {
          if (i === this.rules.maxRotatedFiles) {
            try { fs.unlinkSync(dst); } catch (e) { /* ignore */ }
          }
          try { fs.renameSync(src, dst); } catch (e) { /* ignore */ }
        }
      }
      fs.renameSync(filePath, base + '0');
    } catch (e) { /* best-effort */ }
  }

  // ── 状态访问 ─────────────────────────────────────────────────────
  getState() {
    return Object.assign({}, this.state);
  }

  get loaded() {
    return this._loaded;
  }
}

module.exports = { MemoryKernel };
