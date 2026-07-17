/**
 * MemoryVault — 心虫记忆独立核心组件（长效规则机制的可执行实现）
 *
 * 设计目标（对应需求）：
 *   R1  记忆作为独立组件：本模块完全独立，不依赖 heartflow 单体，启动即 init()。
 *   R2  快速读取的 JSON 格式：用户输入用 jsonl（追加友好），记忆状态用单文件
 *       memory-index.json（启动一次性快速读取"前一秒最新状态"）。
 *   R3  用户输入完整保存，不做任何裁剪（content 原样落盘）。
 *   R4  大模型输出提炼后保存：只存结构化重要字段（decision/confidence/insight），丢弃冗余原文。
 *   R5  记忆条数上限 1000：超限按 (重要性↓, 新近度↓) 淘汰整条，绝不裁剪单条内容。
 *   R6  实时更新：每次写入 fsync 级同步落盘；退出前 flush，保证"前一秒状态"不丢。
 *   R7  启动加载永久记忆 + 新对话继承所有记忆：init() 读索引，getInheritedContext('full') 注入。
 *   R8  规则可强制执行：validate()/audit() 自检不变量，供 CI 与启动健康检查调用。
 *
 * 集成点（heartflow.js）：
 *   - 构造函数里 `this.vault = new MemoryVault({ dataDir: path.join(this.rootPath,'data','memories') })`
 *   - 启动 `_initMemoryVault()` 内 `this.vault.init()`
 *   - `_saveUserMemory(input)` → `this.vault.recordUser(input, {emotion, importance})`
 *   - `_saveSelfMemory(thinkResult)` → `this.vault.recordSelf(thinkResult, {insight, emotion, thinkCount})`
 *   - `_restoreLastSession()` → `const inherited = this.vault.getInheritedContext('full')`
 *   - 进程退出：vault 已自绑 beforeExit/SIGINT/SIGTERM 做 flush（无需手动）
 */

const fs = require('fs');
const path = require('path');

// ─── 默认长效规则（可被 rules 参数覆盖，但 R3/R6 等安全项不建议关闭）───
const DEFAULT_RULES = {
  format: 'json',                       // R2：JSON 系列格式
  userFull: true,                       // R3：用户输入完整保存
  llmRefined: true,                     // R4：LLM 输出提炼
  maxEntries: 1000,                     // R5：总条数上限
  evictionPolicy: 'importance_then_recency', // R5：淘汰策略
  realtime: true,                       // R6：实时写盘
  flushOnExit: true,                    // R6：退出 flush
  inheritAll: true,                     // R7：新对话继承
  snapshotIntervalMs: 200,              // 索引快照最大延迟（仍保证退出 flush）
  selfCompactAt: 500,                   // self 层行数阈值，触发摘要合并
};

class MemoryVault {
  constructor({ dataDir, rules = {} } = {}) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data', 'memories');
    this.rules = { ...DEFAULT_RULES, ...rules };
    this._userPath = path.join(this.dataDir, 'user-memories.jsonl');
    this._selfPath = path.join(this.dataDir, 'self-memories.jsonl');
    this._indexPath = path.join(this.dataDir, 'memory-index.json');
    this._index = null;
    this._snapshotTimer = null;
    this._exitBound = false;
    this._loaded = false;
  }

  // ── R1 + R7：启动即加载永久记忆（前一秒最新状态）──
  init() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    this._loadIndex();
    if (this.rules.flushOnExit) this._bindExitHandlers();
    this._loaded = true;
    return this._index;
  }

  _ensureLoaded() {
    if (!this._loaded) this.init();
  }

  _loadIndex() {
    try {
      this._index = fs.existsSync(this._indexPath)
        ? JSON.parse(fs.readFileSync(this._indexPath, 'utf8'))
        : this._buildEmptyIndex();
    } catch (e) {
      this._index = this._buildEmptyIndex();
    }
    // 防御：以真实文件行数校正计数，避免索引与文件分叉
    this._index.counts.user = this._countLines(this._userPath);
    this._index.counts.self = this._countLines(this._selfPath);
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

  // ── R3：用户输入完整保存，不做裁剪──
  recordUser(input, meta = {}) {
    this._ensureLoaded();
    const text = input == null ? '' : String(input);
    if (!text.trim()) return null;
    const entry = {
      id: this._genId('u'),
      ts: new Date().toISOString(),
      content: text,                          // R3：原样完整保存
      emotion: meta.emotion ?? null,
      importance: meta.importance ?? 5,       // 用户记忆默认中等重要
      source: 'user',
    };
    this._appendLine(this._userPath, entry);  // R6：同步实时落盘
    this._index.counts.user++;
    this._index.lastWriteTs = entry.ts;
    this._touch(entry);
    this._enforceCap();                        // R5：1000 上限（用户层同样受约束）
    this._scheduleSnapshot();
    return entry.id;
  }

  // ── R4：大模型输出提炼后保存重要内容──
  recordSelf(thinkResult, meta = {}) {
    this._ensureLoaded();
    const refined = this._refineOutput(thinkResult, meta); // R4：提炼
    const entry = {
      id: this._genId('s'),
      ts: new Date().toISOString(),
      ...refined,                              // 仅重要结构化字段，无冗余原文
      importance: meta.importance ?? this._defaultSelfImportance(refined),
      source: 'llm',
    };
    this._appendLine(this._selfPath, entry);
    this._index.counts.self++;
    this._index.lastWriteTs = entry.ts;
    this._touch(entry);
    this._maybeCompactSelf();
    this._enforceCap();                        // R5：1000 上限
    this._scheduleSnapshot();
    return entry.id;
  }

  /**
   * R4 提炼逻辑：从 LLM 输出抽取结构化要点，丢弃原始长文本。
   * - 调用方应在 meta.insight 提供"提炼后的关键洞察"（≤500 字），而非原文。
   * - 未提供 insight 时，仅保留决策/置信度/情绪等元信息。
   */
  _refineOutput(thinkResult, meta) {
    const d = (thinkResult && thinkResult.decision) || {};
    return {
      decision: d.type || null,
      confidence: typeof d.confidence === 'number' ? +d.confidence.toFixed(2) : null,
      emotion: meta.emotion ?? null,
      insight: meta.insight ? String(meta.insight).slice(0, 500) : null, // 提炼要点
      thinkCount: meta.thinkCount ?? null,
    };
  }

  _defaultSelfImportance(refined) {
    if (refined.decision && refined.confidence != null && refined.confidence >= 0.7) return 8;
    if (refined.insight) return 7;
    return 4;
  }

  // ── R6/R7：实时写盘 + 索引快照（保证"前一秒状态"在磁盘）──
  _appendLine(filePath, entry) {
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8'); // 同步、实时、耐久
  }

  _scheduleSnapshot() {
    if (!this.rules.realtime) { this._writeIndex(); return; }
    if (this._snapshotTimer) return;
    this._snapshotTimer = setTimeout(() => {
      this._snapshotTimer = null;
      this._writeIndex();
    }, this.rules.snapshotIntervalMs);
    if (this._snapshotTimer.unref) this._snapshotTimer.unref(); // 不阻止进程退出
  }

  _writeIndex() {
    const dir = path.dirname(this._indexPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); // 兜底：目录可能被清理
    this._index.savedAt = new Date().toISOString();
    this._index.counts.total = this._index.counts.user + this._index.counts.self;
    this._index.workingSet = this._buildWorkingSet(50);
    const tmp = this._indexPath + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(this._index, null, 2), 'utf8');
    fs.renameSync(tmp, this._indexPath); // 原子替换，防半写
  }

  // ── R5：1000 条上限 + 整条淘汰（绝不裁剪单条内容）──
  _enforceCap() {
    const total = this._index.counts.user + this._index.counts.self;
    if (total <= this.rules.maxEntries) return;
    const all = [...this._readAll('user'), ...this._readAll('self')];
    // 高价值在前（重要性高者优先，其次新近度高者优先）
    all.sort((a, b) => (b.importance - a.importance) || (new Date(b.ts) - new Date(a.ts)));
    // 保留头部 maxEntries 条（最高价值），淘汰尾部（最低价值）
    const keep = new Set(all.slice(0, this.rules.maxEntries).map((e) => e.id));
    this._rewriteLayer('user', (e) => keep.has(e.id));
    this._rewriteLayer('self', (e) => keep.has(e.id));
    this._index.counts.user = this._countLines(this._userPath);
    this._index.counts.self = this._countLines(this._selfPath);
    this._index.counts.total = this._index.counts.user + this._index.counts.self;
  }

  // ── R7：新对话继承记忆。mode='full' 返回全部（受上限约束），'working' 返回高价值工作集──
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

  // ── R6：退出前 flush，确保"前一秒状态"落盘（含 fsync）──
  flush() {
    try {
      if (this._snapshotTimer) { clearTimeout(this._snapshotTimer); this._snapshotTimer = null; }
      this._writeIndex();
      for (const p of [this._userPath, this._selfPath, this._indexPath]) {
        if (!fs.existsSync(p)) continue;
        let fd = -1;
        try { fd = fs.openSync(p, 'r'); fs.fsyncSync(fd); }
        catch (e) { /* best-effort */ }
        finally { if (fd >= 0) fs.closeSync(fd); }
      }
    } catch (e) { /* 退出兜底：绝不因 flush 失败中断进程 */ }
  }

  _bindExitHandlers() {
    if (this._exitBound) return;
    this._exitBound = true;
    const flush = () => this.flush();
    process.once('beforeExit', flush);
    process.once('SIGINT', flush);
    process.once('SIGTERM', flush);
  }

  // ── R8：规则自检（供启动健康检查 / CI 调用）──
  validate() {
    const violations = [];
    if (this.rules.format !== 'json') violations.push('R2: format must be json');
    if (!this.rules.userFull) violations.push('R3: userFull must be true (never truncate user input)');
    if (!this.rules.llmRefined) violations.push('R4: llmRefined must be true');
    if (!(this.rules.maxEntries > 0)) violations.push('R5: maxEntries must be > 0');
    if (!this.rules.realtime) violations.push('R6: realtime must be true');
    if (!this.rules.inheritAll) violations.push('R7: inheritAll must be true');
    // 运行时不变量
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

  // ── 内部工具 ──────────────────────────────────────────────────
  _genId(prefix) {
    return `${prefix}-${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}`;
  }

  _countLines(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    const s = fs.readFileSync(filePath, 'utf8').trim();
    return s ? s.split('\n').filter((l) => l.trim()).length : 0;
  }

  _readAll(layer) {
    const filePath = layer === 'user' ? this._userPath : this._selfPath;
    if (!fs.existsSync(filePath)) return [];
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter((l) => l.trim());
    const out = [];
    for (const l of lines) {
      try { const e = JSON.parse(l); if (!e._summary) out.push(e); } catch (e) { /* skip corrupt */ }
    }
    return out;
  }

  _rewriteLayer(layer, keepFn) {
    const filePath = layer === 'user' ? this._userPath : this._selfPath;
    if (!fs.existsSync(filePath)) return;
    const kept = this._readAll(layer).filter(keepFn);
    const tmp = filePath + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, kept.map((e) => JSON.stringify(e)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
    fs.renameSync(tmp, filePath);
  }

  // self 层摘要合并：保留最近 100 条，旧条目合并为一个 _summary 行（提炼，非裁剪）
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
    const tmp = this._selfPath + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, all.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
    fs.renameSync(tmp, this._selfPath);
  }

  _touch() { /* 预留：可扩展为访问热度统计 */ }
}

module.exports = { MemoryVault, DEFAULT_RULES };
