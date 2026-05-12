/**
 * HeartFlow Core Engine v0.13.9
 * =================================
 * 唯一主引擎。所有功能通过 HeartFlow 实例调用，无全局状态。
 *
 * 设计原则：
 * - 最小内核：< 2000 行
 * - 声明式技能：skill_use() 驱动，非硬编码
 * - 现代 AI 框架：Mem0 记忆 + Reflexion 自省 + DSPy 风格编排
 * - 跨平台：Node.js / Python / Browser
 * - v0.13.9: 新增 WAL + 文件锁 + 异步 MemoryConsolidator
 * @version v0.13.9
 * @date 2026-05-12
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ─── HEARTCORE v2（来自 ~/.heartflow/）────────────────────────────
const {
  HeartbeatCore, getHeartbeat,
  SleepWake, getSleepWake,
  globalEventBus,
  globalStateStore,
  StartupCheck, getStartupCheck,
  HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth,
  globalToolRegistry,
} = require('./heartcore/index.js');

// ─── v11.43.2 引擎变量声明（严格模式必须先声明才能赋值）──────────────────
var IdentityEngine, ContextManager, MeaningfulMemory, LearningEngine;
var DreamLoopModule, EmotionEngine, SelfHealing, CognitiveEngine;
var ExperienceReplay, KnowledgeGraph, TrialityMemory;
var Agents, Autonomy, Consciousness, Ethics;
var Reflexion, SelfRefine, IdentitySystem, MemoryConsolidator;
var MemoryRecall, EthicsGuard;

// 具身认知与情感类 (Top-level require for constructor)
const { EmbodiedCore } = require('./embodied/embodied-core.js');
const { DeepEmotion } = require('./emotion/deep-emotion.js');
const FlowPredictor = require('./autonomy/flow-predictor.js');

// ─── 工具层（v11.43.2）────────────────────────────────────────────────────
const { FSAdapter } = require('./utils/fs-adapter.js');
const { Logger } = require('./utils/logger.js');
const logger = new Logger(process.env.HF_LOG_LEVEL || 'info');

// ─── v11.43.2 引擎初始化函数 ───────────────────────────────────────────────
function _initV11432() {
  IdentityEngine = require('./identity/identity-engine.js');
  ContextManager = require('./context/context-manager.js');
  var mmMod = require('./memory/meaningful-memory.js');
  MeaningfulMemory = new mmMod.MeaningfulMemory();
  LearningEngine = require('./learning/learning-engine.js');
  DreamLoopModule = require('./dream/dream-loop.js');
  var ee = require('./emotion/emotion-engine.js');
  EmotionEngine = ee.EmotionEngine;
  var sh = require('./self-healing/self-healing.js');
  SelfHealing = sh.SelfHealing;
  CognitiveEngine = require('./cognition/cognitive-engine.js');
  ExperienceReplay = require('./learning/experience-replay.js');
  var kg = require('./knowledge/knowledge-graph.js');
  KnowledgeGraph = kg.KnowledgeGraph;
  TrialityMemory = require('./memory/triality-memory.js');
  Agents = require('./agents/base-agents.js');
  Autonomy = require('./autonomy/pdca-engine.js');
  Consciousness = require('./consciousness/global-workspace.js');
  Ethics = require('./ethics/sage-guardian.js');
  Reflexion = require('./self-evolution/reflexion.js');
  SelfRefine = require('./self-evolution/self-refine.js');
  IdentitySystem = require('./identity/identity.js');
  MemoryConsolidator = require('./memory/consolidator.js').MemoryConsolidator;
  var mr = require('./memory/recall.js');
  MemoryRecall = mr.recallMemories || mr.recallMemoriesEnhanced || mr;
  EthicsGuard = require('./ethics/guard.js');
  _v11432Ready = true;
  logger.info('[HeartFlow] v11.43.2 引擎已加载');
}

// 延迟加载 v11.43.2 引擎（在第一次 boot 时初始化）
var _v11432Ready = false;
function _ensureV11432() {
  if (!_v11432Ready) {
    _initV11432();
  }
}

// ─── 版本常量 ───────────────────────────────────────────────────────────────
const VERSION = 'v0.13.9';
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

// ─── HeartFlow 总线 ──────────────────────────────────────────────────────────
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

    // 初始化核心子系统（直接 require，避免延迟初始化的时序问题）

    // 记忆系统（异步初始化）
    const { MemoryConsolidator: MC } = require('./memory/consolidator.js');
    this._consolidator = new MC(this.fs);
    this.recall = null;  // 延迟到 start() 后通过 _initV11432 初始化
    // DreamLoop（v11.43.2 函数式，直接用 generateDream）
    const DreamFns = require('./dream/dream-loop.js');
    this.dream = { generate: DreamFns.generateDream, enabled: false, lastDreamAt: null };

    // 自进化系统
    const { Reflexion: RX } = require('./self-evolution/reflexion.js');
    const { SelfRefine: SR } = require('./self-evolution/self-refine.js');
    this.reflexion = new RX(this.fs);
    this.selfRefine = new SR(this.reflexion);

    // 身份系统
    const { IdentitySystem: IS } = require('./identity/identity.js');
    this.identity = new IS(this.fs);

    // 安全护栏
    const { EthicsGuard: EG } = require('./ethics/guard.js');
    this.guard = new EG(this.fs);

    // 技能系统
    const { SkillRegistry } = require('./skills/skill-registry.js');
    const { SkillLoader } = require('./skills/skill-loader.js');
    this.registry = new SkillRegistry(this.fs);
    this.skillLoader = new SkillLoader(this.fs, this.registry);

    // 状态
    this.bus = new HeartFlowBus();
    this._started = false;
    this._sessionId = `session-${Date.now()}`;

    // ─── HEARTCORE v2 初始化 ───────────────────────────────────
    this.heartbeat = getHeartbeat({ interval: 5000, timeout: 15000 });
    this.sleepWake = getSleepWake({ idleTimeoutMs: 30 * 60 * 1000, enableAutoSleep: true });
    this.startupCheck = getStartupCheck();
    this.healthMonitor = getHealthCheck();
    this.healthMonitor.register('memory', builtinMemoryHealth);
    this._startedAt = null;

    // 具身认知与情感
    this.embodied = new EmbodiedCore(this.fs.root);
    this.deepEmotion = new DeepEmotion(this.fs.root);
    this.flowPredictor = FlowPredictor.flowPredictor;

    logger.info(`[HeartFlow] ${VERSION} 初始化完成`);
  }

  /** 启动引擎 */
  start() {
    if (this._started) { logger.warn('[HeartFlow] 已启动，无需重复'); return; }
    this._started = true;
    this._startedAt = Date.now();
    // 异步初始化记忆系统（不阻塞启动）
    this._consolidator.init().catch(err => {
      logger.error('[HeartFlow] 记忆系统初始化失败', { err: err.message });
    });
    _ensureV11432();  // 初始化 v11.43.2 引擎
    // 将 v11.43.2 引擎绑定到实例
    this.recall = MemoryRecall;
    this.identityEngine = IdentityEngine;
    this.contextManager = ContextManager;
    this.meaningfulMemory = MeaningfulMemory;
    this.learningEngine = LearningEngine;
    this.emotionEngine = EmotionEngine;
    this.selfHealing = SelfHealing;
    this.cognitiveEngine = CognitiveEngine;
    this.experienceReplay = ExperienceReplay;
    this.knowledgeGraph = KnowledgeGraph;
    this.trialityMemory = TrialityMemory;
    this.agents = Agents;
    this.autonomy = Autonomy;
    this.consciousness = Consciousness;
    this.ethics = Ethics;
    this.dream.enabled = true;
    this.dream.lastDreamAt = Date.now();
    // ─── HEARTCORE v2 启动 ───────────────────────────────────
    this.heartbeat.start();
    this.sleepWake.start();
    this.bus.emit('start', { version: VERSION, sessionId: this._sessionId });
    logger.info(`[HeartFlow] 启动成功，session: ${this._sessionId}`);
  }

  /** 停止引擎 */
  stop() {
    this.dream.enabled = false;
    this._started = false;
    // ─── HEARTCORE v2 停止 ───────────────────────────────────
    this.heartbeat.stop();
    this.sleepWake.stop();
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
  dreamNow() { return this.dream.generate(this.consolidator.getAll()); }

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
  async healthCheck() {
    const memHealth = builtinMemoryHealth();
    const uptimeHealth = builtinUptimeHealth(this._startedAt || Date.now());
    const heartbeatMetrics = this.heartbeat.metrics;
    return {
      version: VERSION,
      started: this._started,
      sessionId: this._sessionId,
      heartbeat: heartbeatMetrics,
      sleepWake: {
        phase: this.sleepWake.phase,
        lastActivity: this.sleepWake.lastActivity,
      },
      memory: {
        hot: this.consolidator.getHot().length,
        warm: this.consolidator.getWarm().length,
        cold: this.consolidator.getCold().length,
      },
      subsystems: {
        memory: memHealth,
        uptime: uptimeHealth,
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
