/**
 * HeartFlow Core Engine v0.12.50
 * =================================
 * 唯一主引擎。所有功能通过 HeartFlow 实例调用，无全局状态。
 *
 * 设计原则：
 * - 最小内核：< 2000 行
 * - 声明式技能：skill_use() 驱动，非硬编码
 * - 现代 AI 框架：Mem0 记忆 + Reflexion 自省 + DSPy 风格编排
 * - 跨平台：Node.js / Python / Browser
 *
 * @version v0.12.50
 * @date 2026-05-11
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ─── 版本常量 ───────────────────────────────────────────────────────────────
const VERSION = 'v0.12.50';
const BUILD_DATE = '2026-05-11';

// ─── 路径配置 ────────────────────────────────────────────────────────────────
function getRootPath() {
  return path.resolve(__dirname, '../../..');
}
function getDataPath(...segments) {
  return path.join(getRootPath(), 'data', ...segments);
}
function getSkillsPath() {
  return path.join(getRootPath(), 'skills');
}

// ─── 工具层 ──────────────────────────────────────────────────────────────────
class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }
  _log(level, ...args) {
    if (this.levels[level] >= this.levels[this.level]) {
      const ts = new Date().toISOString().slice(0, 19);
      console[`${level === 'debug' ? 'log' : level}`](`[${ts}] [${level.toUpperCase()}]`, ...args);
    }
  }
  debug(...a) { this._log('debug', ...a); }
  info(...a)  { this._log('info', ...a); }
  warn(...a)  { this._log('warn', ...a); }
  error(...a) { this._log('error', ...a); }
}

const logger = new Logger(process.env.HF_LOG_LEVEL || 'info');

// ─── 文件系统适配器 ─────────────────────────────────────────────────────────
class FSAdapter {
  constructor(rootPath) {
    this.root = rootPath || getRootPath();
  }
  readFileSync(p) {
    return fs.readFileSync(path.isAbsolute(p) ? p : path.join(this.root, p), 'utf8');
  }
  writeFileSync(p, content) {
    const fp = path.isAbsolute(p) ? p : path.join(this.root, p);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  existsSync(p) {
    return fs.existsSync(path.isAbsolute(p) ? p : path.join(this.root, p));
  }
  mkdirSync(p) {
    fs.mkdirSync(path.isAbsolute(p) ? p : path.join(this.root, p), { recursive: true });
  }
  readdirSync(p) {
    return fs.readdirSync(path.isAbsolute(p) ? p : path.join(this.root, p));
  }
  statSync(p) {
    return fs.statSync(path.isAbsolute(p) ? p : path.join(this.root, p));
  }
  readJSON(p) {
    return JSON.parse(this.readFileSync(p));
  }
  writeJSON(p, obj) {
    this.writeFileSync(p, JSON.stringify(obj, null, 2));
  }
}

// ─── 记忆层 (Memory) ─────────────────────────────────────────────────────────

/**
 * 记忆整合器 — Mem0 风格
 * 功能：接收记忆片段，按重要性评分，写入热/温/冷层
 */
class MemoryConsolidator {
  constructor(fs) {
    this.fs = fs;
    this.hotPath = getDataPath('memory', 'hot.json');
    this.warmPath = getDataPath('memory', 'warm.json');
    this.coldPath = getDataPath('memory', 'cold.json');
    this._ensureFiles();
  }
  _ensureFiles() {
    const dirs = [getDataPath('memory')];
    dirs.forEach(d => this.fs.mkdirSync(d));
    [this.hotPath, this.warmPath, this.coldPath].forEach(p => {
      if (!this.fs.existsSync(p)) this.fs.writeJSON(p, []);
    });
  }
  _loadLayer(path) {
    try { return this.fs.readJSON(path); } catch { return []; }
  }
  _saveLayer(path, data) {
    this.fs.writeJSON(path, data);
  }

  /**
   * 接收记忆片段，返回写入哪一层
   * @param {object} fragment - { id, content, type, importance, timestamp }
   * @returns {string} 'hot' | 'warm' | 'cold'
   */
  consolidate(fragment) {
    const { importance = 0.5 } = fragment;
    const layer = importance < 0.3 ? 'cold' : importance < 0.7 ? 'warm' : 'hot';
    const data = this._loadLayer(this[`${layer}Path`]);
    // 去重：同 id 已存在则更新
    const idx = data.findIndex(d => d.id === fragment.id);
    if (idx >= 0) data[idx] = { ...fragment, layer, updatedAt: Date.now() };
    else data.push({ ...fragment, layer, createdAt: Date.now(), updatedAt: Date.now() });
    // 热层最多 100 条，温层 500，冷层无上限
    const maxItems = layer === 'hot' ? 100 : layer === 'warm' ? 500 : Infinity;
    if (data.length > maxItems) {
      // 把最老的降级到下一层
      const moved = data.splice(0, data.length - maxItems);
      this._demote(moved, layer);
    }
    this._saveLayer(this[`${layer}Path`], data);
    return layer;
  }

  _demote(items, fromLayer) {
    if (fromLayer === 'hot') {
      items.forEach(item => this.consolidate({ ...item, importance: 0.5 }));
    } else if (fromLayer === 'warm') {
      items.forEach(item => this.consolidate({ ...item, importance: 0.2 }));
    }
    // cold 不再降级
  }

  getHot() { return this._loadLayer(this.hotPath); }
  getWarm() { return this._loadLayer(this.warmPath); }
  getCold() { return this._loadLayer(this.coldPath); }
  getAll() { return [...this.getHot(), ...this.getWarm(), ...this.getCold()]; }
}

/**
 * 记忆召回 — 语义 + 关键词双召回
 * 功能：给定查询，返回相关记忆片段
 */
class MemoryRecall {
  constructor(consolidator) {
    this.c = consolidator;
    this._chineseSpace = this._chineseSpace.bind(this);
  }

  // 中文分词：在每个中文字符前后加空格（避免余弦相似度全 0）
  _chineseSpace(text) {
    return String(text).replace(/[\u4e00-\u9fff]/g, m => ` ${m} `);
  }

  // 简单关键词匹配
  _keywordScore(query, fragment) {
    const q = this._chineseSpace(query).toLowerCase();
    const t = this._chineseSpace(fragment.content || '').toLowerCase();
    const qWords = q.split(/\s+/).filter(Boolean);
    if (!qWords.length) return 0;
    const matches = qWords.filter(w => t.includes(w)).length;
    return matches / qWords.length;
  }

  /**
   * 召回记忆
   * @param {string} query - 查询文本
   * @param {object} opts - { limit, layers }
   * @returns {array} 排序后的记忆片段
   */
  recall(query, { limit = 10, layers = ['hot', 'warm', 'cold'] } = {}) {
    const all = [];
    if (layers.includes('hot'))  all.push(...this.c.getHot().map(f => ({ ...f, _src: 'hot' })));
    if (layers.includes('warm')) all.push(...this.c.getWarm().map(f => ({ ...f, _src: 'warm' })));
    if (layers.includes('cold')) all.push(...this.c.getCold().map(f => ({ ...f, _src: 'cold' })));

    // 计算关键词得分
    const scored = all.map(f => ({
      ...f,
      keywordScore: this._keywordScore(query, f),
      // 时间衰减：越新的记忆权重越高
      recencyScore: f.updatedAt ? Math.exp(-(Date.now() - f.updatedAt) / (7 * 24 * 3600 * 1000)) : 0,
    }));

    // 综合得分 = 关键词 * 0.6 + 时间 * 0.2 + 重要性 * 0.2
    scored.forEach(f => {
      f._score = f.keywordScore * 0.6 + f.recencyScore * 0.2 + (f.importance || 0.5) * 0.2;
    });

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
  }

  /** 删除指定 id 的记忆 */
  forget(id) {
    ['hot', 'warm', 'cold'].forEach(layer => {
      const data = this.c[`_${layer}Path`] ? this.c._loadLayer(this.c[`_${layer}Path`]) : [];
      const filtered = data.filter(d => d.id !== id);
      if (filtered.length !== data.length) {
        this.c._saveLayer(this.c[`${layer}Path`], filtered);
      }
    });
  }
}

/**
 * 梦循环 — 睡眠科学 + 生成式
 * 功能：定时触发记忆整合与跨域连接发现
 */
class DreamLoop {
  constructor(consolidator, emitter) {
    this.c = consolidator;
    this.emitter = emitter;
    this.enabled = false;
    this.interval = null;
    this.lastDreamAt = null;
  }

  start(intervalMs = 30 * 60 * 1000) { // 默认 30 分钟
    this.enabled = true;
    this.interval = setInterval(() => this.run(), intervalMs);
    logger.info('[Dream] 梦循环启动，间隔', intervalMs, 'ms');
  }

  stop() {
    this.enabled = false;
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  /** 手动触发一次梦境 */
  async run() {
    if (!this.enabled) return;
    this.lastDreamAt = Date.now();
    logger.debug('[Dream] 梦境开始...');

    const hot = this.c.getHot();
    const warm = this.c.getWarm();

    // 阶段 1：碎片评分 — 找出高频关联的碎片
    const fragments = [...hot, ...warm];
    const connections = this._findConnections(fragments);

    // 阶段 2：矛盾检测 — 检查逻辑矛盾
    const contradictions = this._findContradictions(fragments);

    // 阶段 3：生成顿悟（模拟）— 基于连接和矛盾生成洞察
    const insights = [];
    if (connections.length > 0) {
      insights.push({
        type: 'connection',
        content: `发现 ${connections.length} 个跨域关联`,
        fragments: connections.map(c => c.ids),
        timestamp: Date.now(),
      });
    }
    if (contradictions.length > 0) {
      insights.push({
        type: 'contradiction',
        content: `检测到 ${contradictions.length} 个潜在矛盾`,
        details: contradictions,
        timestamp: Date.now(),
      });
    }

    // 保存顿悟
    if (insights.length > 0) {
      const dreamData = this.c._loadLayer(getDataPath('memory', 'dreams.json'));
      dreamData.push(...insights);
      this.c.c.fs.writeJSON(getDataPath('memory', 'dreams.json'), dreamData.slice(-100)); // 最多保留 100 条
    }

    this.emitter.emit('dream:complete', { insights, connections, contradictions });
    logger.info(`[Dream] 梦境完成：${insights.length} 个洞察`);
    return insights;
  }

  _findConnections(fragments) {
    // 简单共现分析：同一 session 或相近时间戳的碎片
    const connections = [];
    for (let i = 0; i < fragments.length; i++) {
      for (let j = i + 1; j < fragments.length; j++) {
        const a = fragments[i], b = fragments[j];
        if (a.sessionId === b.sessionId || Math.abs((a.timestamp || 0) - (b.timestamp || 0)) < 300000) {
          connections.push({ ids: [a.id, b.id], score: 0.8 });
        }
      }
    }
    return connections;
  }

  _findContradictions(fragments) {
    // 简化版：检测同一主题的正反陈述
    const contradictions = [];
    const claims = {};
    fragments.forEach(f => {
      if (f.type === 'claim' && f.topic) {
        if (!claims[f.topic]) claims[f.topic] = [];
        claims[f.topic].push(f);
      }
    });
    Object.entries(claims).forEach(([topic, list]) => {
      const pos = list.filter(f => f.sentiment > 0);
      const neg = list.filter(f => f.sentiment < 0);
      if (pos.length > 0 && neg.length > 0) {
        contradictions.push({ topic, pos: pos.length, neg: neg.length });
      }
    });
    return contradictions;
  }
}

// ─── 自进化层 (Self-Evolution) ─────────────────────────────────────────────────

/**
 * Reflexion — Shinn et al. 2023
 * 功能：任务后自省，记录错误模式到结构化记忆中
 */
class Reflexion {
  constructor(fs) {
    this.fs = fs;
    this.patternsPath = getDataPath('evolution', 'reflexion-patterns.json');
    this._ensure();
  }
  _ensure() {
    this.fs.mkdirSync(getDataPath('evolution'));
    if (!this.fs.existsSync(this.patternsPath)) this.fs.writeJSON(this.patternsPath, []);
  }

  /**
   * 自省一次执行结果
   * @param {object} result - { task, outcome, error?, feedback? }
   * @returns {object} 反思结果
   */
  reflect(result) {
    const patterns = this.fs.readJSON(this.patternsPath);
    const { task, outcome, error, feedback } = result;
    const selfVerdict = this._verdict(outcome, error, feedback);
    const entry = {
      id: `ref-${Date.now()}`,
      task: task.substring(0, 200),
      outcome,
      error: error || null,
      selfVerdict,
      timestamp: Date.now(),
    };
    patterns.push(entry);
    // 保留最近 200 条
    if (patterns.length > 200) patterns.splice(0, patterns.length - 200);
    this.fs.writeJSON(this.patternsPath, patterns);
    return entry;
  }

  _verdict(outcome, error, feedback) {
    if (error) return 'failure';
    if (feedback && (feedback.rating < 3 || feedback.thumbsDown)) return 'failure';
    if (outcome && outcome.startsWith('success')) return 'success';
    return 'neutral';
  }

  /** 获取失败模式 */
  getFailurePatterns(limit = 20) {
    const patterns = this.fs.readJSON(this.patternsPath);
    return patterns.filter(p => p.selfVerdict === 'failure').slice(-limit);
  }

  /** 获取所有模式 */
  getAllPatterns() {
    return this.fs.readJSON(this.patternsPath);
  }
}

/**
 * Self-Refine — Madaan et al. 2024
 * 功能：迭代优化输出，直到收敛或达到最大轮次
 */
class SelfRefine {
  constructor(reflexion) {
    this.reflexion = reflexion;
  }

  /**
   * 迭代优化
   * @param {function} generateFn - 生成函数 (iter) => string
   * @param {function} feedbackFn - 反馈函数 (output) => { rating, critique }
   * @param {object} opts - { maxIter, targetRating }
   * @returns {object} { output, iterations, rating }
   */
  async refine(generateFn, feedbackFn, { maxIter = 3, targetRating = 4 } = {}) {
    let output = await generateFn(0);
    let iteration = 0;
    let rating = 0;

    while (iteration < maxIter) {
      const fb = await feedbackFn(output);
      rating = fb.rating || 0;
      if (rating >= targetRating) break;
      iteration++;
      output = await generateFn(iteration, { output, critique: fb.critique });
    }

    // 记录到 reflexion
    this.reflexion.reflect({
      task: 'self-refine',
      outcome: rating >= targetRating ? 'success:converged' : 'success:max-iter',
      feedback: { rating },
    });

    return { output, iterations: iteration + 1, rating };
  }
}

// ─── 身份层 (Identity) ─────────────────────────────────────────────────────────

/**
 * 身份系统 — 继承 CORE_IDENTITY.md 的四大角色 + 七条指令
 */
class IdentitySystem {
  constructor(fs) {
    this.fs = fs;
    this.identityPath = path.join(getRootPath(), 'CORE_IDENTITY.md');
    this._identity = null;
    this._load();
  }

  _load() {
    try {
      if (this.fs.existsSync(this.identityPath)) {
        this._identity = this.fs.readFileSync(this.identityPath);
      }
    } catch (e) {
      logger.warn('[Identity] 无法加载 CORE_IDENTITY.md:', e.message);
    }
  }

  getIdentity() { return this._identity; }

  /** 真善美判定 */
  async judgeTruthfulness(input) {
    // 真 = 可验证 / 可证伪 / 不编造数字
    // 善 = 帮助人 / 尊重人 / 不伤害
    // 美 = 优雅 / 简洁 / 有结构
    const issues = [];

    // 检测：编造数字
    if (/\d{4,}/.test(input) && !input.includes('%') && !input.includes('arXiv')) {
      // 可能是编造的大数字
      const hasEvidence = input.includes('来源') || input.includes('研究') || input.includes('论文');
      if (!hasEvidence) issues.push('possible_fabricated_number');
    }

    // 检测：绝对化陈述（无证据）
    if (/^[^。]*[：:][^。]*(?:所有|一切|总是|从来|必然|绝对)/.test(input)) {
      issues.push('unqualified_absolute_claim');
    }

    return {
      pass: issues.length === 0,
      issues,
      timestamp: Date.now(),
    };
  }

  /** 四层心理感知（自动运行）*/
  analyzePsychology(text) {
    return {
      intention: this._detectIntention(text),
      emotion: this._detectEmotion(text),
      needs: this._detectNeeds(text),
      defense: this._detectDefense(text),
    };
  }

  _detectIntention(text) {
    // 意图检测：问问题 / 寻求确认 / 发泄 / 请求行动
    if (/^[^？?]*[？?]$/.test(text.trim())) return 'question';
    if (/[请帮|帮我|帮我|想要|需要]/.test(text)) return 'request_action';
    if (/[其实|只是|不过]/.test(text) && text.length < 100) return 'venting';
    if (/[你觉得|你认为|是不是|对不对]/.test(text)) return 'seeking_confirmation';
    return 'information_sharing';
  }

  _detectEmotion(text) {
    const negations = [/不行|糟糕|完蛋|崩溃|绝望|气死了|太难受/];
    const positives = [/开心|高兴|好棒|太棒了|满意|感谢/];
    if (negations.some(r => r.test(text))) return 'negative';
    if (positives.some(r => r.test(text))) return 'positive';
    return 'neutral';
  }

  _detectNeeds(text) {
    // 马斯洛简化检测
    if (/[安全|放心|保障|保险]/.test(text)) return 'safety';
    if (/[朋友|家人|爱|归属|孤独|陪伴]/.test(text)) return 'belonging';
    if (/[尊重|认可|成就|价值|意义]/.test(text)) return 'esteem';
    if (/[成长|学习|自我实现|理想|价值]/.test(text)) return 'self_actualization';
    return 'unknown';
  }

  _detectDefense(text) {
    const mechanisms = [];
    if (/^我不在乎/.test(text) && /[其实|真的]/.test(text)) mechanisms.push('denial');
    if (/[抱怨A|说A实际在|借A说B]/.test(text)) mechanisms.push('displacement');
    if (/[应该|必须|不得不]/.test(text) && text.length < 80) mechanisms.push('rationalization');
    return mechanisms;
  }
}

// ─── 安全护栏 (Ethics Guard) ─────────────────────────────────────────────────

class EthicsGuard {
  constructor(fs) {
    this.fs = fs;
    this.blocked = false;
  }

  /**
   * 安全检查
   * @param {object} input - { text, action?, metadata? }
   * @returns {object} { allowed, reason }
   */
  check(input) {
    const { text } = input;

    // 硬拦截：自我伤害相关
    if (/教[我怎么|我如何]自[杀|残]|具体方法/.test(text) && /[死|伤|毁]/.test(text)) {
      return { allowed: false, reason: 'self_harm_content', severity: 'critical' };
    }

    // 硬拦截：恶意行为指导
    if (/具体步骤.*(攻击|伤害|欺诈|盗取)/.test(text)) {
      return { allowed: false, reason: 'malicious_instruction', severity: 'critical' };
    }

    // 警告：敏感信息请求
    if (/(password|密码|secret).*如何.*获取/.test(text)) {
      return { allowed: false, reason: 'credential_theft_request', severity: 'high' };
    }

    return { allowed: true, reason: null, severity: null };
  }
}

// ─── 技能系统 (Skills) ────────────────────────────────────────────────────────

/**
 * 技能注册表 — 内存中的技能清单
 */
class SkillRegistry {
  constructor(fs) {
    this.fs = fs;
    this.registry = new Map();
    this._loadSkills();
  }

  _loadSkills() {
    const skillsDir = getSkillsPath();
    if (!this.fs.existsSync(skillsDir)) return;
    try {
      const files = this.fs.readdirSync(skillsDir);
      files.forEach(f => {
        if (f.endsWith('.md') || f.endsWith('.skill')) {
          this._loadSkillFile(path.join(skillsDir, f));
        }
      });
    } catch (e) {
      logger.warn('[SkillRegistry] 加载技能失败:', e.message);
    }
  }

  _loadSkillFile(filePath) {
    try {
      const content = this.fs.readFileSync(filePath);
      const name = path.basename(filePath, path.extname(filePath));
      // 简单解析 YAML frontmatter
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const fm = this._parseFrontmatter(match[1]);
        this.registry.set(name, {
          name,
          path: filePath,
          enabled: fm.enabled !== false,
          description: fm.description || '',
          version: fm.version || '0.0.1',
          tags: fm.tags || [],
        });
      }
    } catch (e) {
      logger.warn(`[SkillRegistry] 加载技能文件 ${filePath} 失败:`, e.message);
    }
  }

  _parseFrontmatter(text) {
    const result = {};
    text.split('\n').forEach(line => {
      const [key, ...vals] = line.split(':');
      if (key && vals.length) result[key.trim()] = vals.join(':').trim().replace(/^["']|["']$/g, '');
    });
    return result;
  }

  list() { return Array.from(this.registry.values()); }
  get(name) { return this.registry.get(name); }
  enable(name) { const s = this.registry.get(name); if (s) s.enabled = true; }
  disable(name) { const s = this.registry.get(name); if (s) s.enabled = false; }
}

/**
 * 技能加载器 — 按需加载技能内容
 */
class SkillLoader {
  constructor(fs, registry) {
    this.fs = fs;
    this.registry = registry;
    this.loaded = new Map(); // 缓存已加载的技能内容
  }

  /** 加载技能，返回内容 */
  load(skillName) {
    if (this.loaded.has(skillName)) return this.loaded.get(skillName);
    const skill = this.registry.get(skillName);
    if (!skill) { logger.warn(`[SkillLoader] 技能不存在: ${skillName}`); return null; }
    if (!skill.enabled) { logger.info(`[SkillLoader] 技能已禁用: ${skillName}`); return null; }
    try {
      const content = this.fs.readFileSync(skill.path);
      this.loaded.set(skillName, content);
      return content;
    } catch (e) {
      logger.error(`[SkillLoader] 读取技能失败: ${skillName}`, e.message);
      return null;
    }
  }

  /** 声明式调用技能 — DSPy 风格 */
  async use(skillName, params = {}) {
    const content = this.load(skillName);
    if (!content) return null;
    // 解析技能内容，提取 instructions 字段
    const instructions = this._extractInstructions(content);
    // params 注入到上下文中
    return { skillName, instructions, params, content };
  }

  _extractInstructions(content) {
    // 提取 --- 之后的 markdown 内容
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return match ? match[1].substring(0, 2000) : content.substring(0, 2000);
  }
}

// ─── 事件总线 ────────────────────────────────────────────────────────────────
class HeartFlowBus extends EventEmitter {}

// ─── 主引擎 ─────────────────────────────────────────────────────────────────

class HeartFlow extends EventEmitter {
  /**
   * @param {object} config - { logLevel?, dataPath?, enabledSkills? }
   */
  constructor(config = {}) {
    super();
    this.version = VERSION;
    this.buildDate = BUILD_DATE;
    this.config = config;

    // 初始化文件系统
    this.fs = new FSAdapter(config.rootPath || getRootPath());

    // 初始化日志
    if (config.logLevel) logger.level = config.logLevel;

    // 初始化核心子系统
    this.bus = new HeartFlowBus();

    // 记忆系统
    this.consolidator = new MemoryConsolidator(this.fs);
    this.recall = new MemoryRecall(this.consolidator);
    this.dream = new DreamLoop(this.consolidator, this.bus);

    // 自进化系统
    this.reflexion = new Reflexion(this.fs);
    this.selfRefine = new SelfRefine(this.reflexion);

    // 身份系统
    this.identity = new IdentitySystem(this.fs);

    // 安全护栏
    this.guard = new EthicsGuard(this.fs);

    // 技能系统
    this.registry = new SkillRegistry(this.fs);
    this.skillLoader = new SkillLoader(this.fs, this.registry);

    // 状态
    this._started = false;
    this._sessionId = `session-${Date.now()}`;

    logger.info(`[HeartFlow] ${VERSION} 初始化完成`);
  }

  /** 启动引擎 */
  start() {
    if (this._started) { logger.warn('[HeartFlow] 已启动，无需重复'); return; }
    this._started = true;
    this.dream.start();
    this.bus.emit('start', { version: VERSION, sessionId: this._sessionId });
    logger.info(`[HeartFlow] 启动成功，session: ${this._sessionId}`);
  }

  /** 停止引擎 */
  stop() {
    this.dream.stop();
    this._started = false;
    this.bus.emit('stop', {});
    logger.info('[HeartFlow] 已停止');
  }

  /**
   * 主循环：think(input) → 记忆检索 → 安全检查 → 心理分析 → 输出
   * @param {string} input - 用户输入
   * @param {object} opts - { skipMemory?, skipPsychology? }
   * @returns {object} { response, memory, psychology, skills }
   */
  async think(input, opts = {}) {
    const start = Date.now();
    const result = {
      input,
      timestamp: start,
      sessionId: this._sessionId,
      version: VERSION,
    };

    // 1. 安全检查
    const safety = this.guard.check({ text: input });
    if (!safety.allowed) {
      return { ...result, blocked: true, reason: safety.reason, latency: Date.now() - start };
    }

    // 2. 记忆检索（默认开启）
    if (!opts.skipMemory) {
      result.memories = this.recall.recall(input);
    }

    // 3. 心理分析（自动运行）
    if (!opts.skipPsychology) {
      result.psychology = this.identity.analyzePsychology(input);
    }

    // 4. 真善美判定
    result.truthCheck = await this.identity.judgeTruthfulness(input);

    // 5. 技能路由（声明式）
    const skillResults = await this._routeSkills(input);
    if (skillResults.length > 0) result.skills = skillResults;

    result.latency = Date.now() - start;
    return result;
  }

  /**
   * 存储记忆
   * @param {object} fragment - { content, type, importance, metadata? }
   */
  remember(fragment) {
    if (!fragment.id) fragment.id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    if (!fragment.timestamp) fragment.timestamp = Date.now();
    if (!fragment.sessionId) fragment.sessionId = this._sessionId;
    const layer = this.consolidator.consolidate(fragment);
    this.bus.emit('memory:stored', fragment);
    return layer;
  }

  /**
   * 接收反馈并自进化
   * @param {object} feedback - { task, outcome, rating, comment? }
   */
  evolve(feedback) {
    const entry = this.reflexion.reflect(feedback);
    this.bus.emit('evolve', entry);
    return entry;
  }

  /**
   * 触发一次梦
   */
  dreamNow() { return this.dream.run(); }

  /** 获取失败模式（用于自省）*/
  getFailurePatterns() { return this.reflexion.getFailurePatterns(); }

  /** 获取身份定义 */
  getIdentity() { return this.identity.getIdentity(); }

  /** 列出可用技能 */
  listSkills() { return this.registry.list(); }

  /** 声明式使用技能 */
  async skillUse(skillName, params) { return this.skillLoader.use(skillName, params); }

  /** 内部：技能路由 */
  async _routeSkills(input) {
    const results = [];
    const skills = this.registry.list().filter(s => s.enabled);
    // 简单关键字匹配路由
    for (const skill of skills) {
      const desc = skill.description || '';
      const tags = skill.tags || [];
      const combined = `${desc} ${tags.join(' ')}`.toLowerCase();
      // 检查输入是否与技能描述相关（简化版）
      if (this._skillRelevance(input, combined) > 0.3) {
        const r = await this.skillLoader.use(skill.name, { input });
        if (r) results.push(r);
      }
    }
    return results;
  }

  _skillRelevance(input, skillDesc) {
    const words = input.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const matched = words.filter(w => skillDesc.includes(w)).length;
    return words.length > 0 ? matched / words.length : 0;
  }

  /** 健康检查 */
  healthCheck() {
    return {
      version: VERSION,
      started: this._started,
      sessionId: this._sessionId,
      memory: {
        hot: this.consolidator.getHot().length,
        warm: this.consolidator.getWarm().length,
        cold: this.consolidator.getCold().length,
      },
      dream: {
        enabled: this.dream.enabled,
        lastDreamAt: this.dream.lastDreamAt,
      },
      reflexion: {
        patterns: this.reflexion.getAllPatterns().length,
      },
      skills: this.registry.list().length,
    };
  }
}

// ─── 工厂函数 ────────────────────────────────────────────────────────────────
function createHeartFlow(config) {
  return new HeartFlow(config);
}

// ─── 导出 ────────────────────────────────────────────────────────────────────
module.exports = { HeartFlow, createHeartFlow, VERSION, BUILD_DATE };

// ─── 直接运行：自检 ─────────────────────────────────────────────────────────
if (require.main === module) {
  const hf = createHeartFlow();
  const health = hf.healthCheck();
  console.log(`[HeartFlow] v${VERSION} 健康检查:`);
  console.log(JSON.stringify(health, null, 2));
  hf.start();
  setTimeout(() => hf.stop(), 1000);
}
