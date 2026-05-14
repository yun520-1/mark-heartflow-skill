/**
 * HeartFlow Core Engine v0.13.10
 * =================================
 * 唯一主引擎。所有功能通过 HeartFlow 实例调用，无全局状态。
 *
 * 设计原则：
 * - 最小内核：< 2000 行
 * - 声明式技能：skill_use() 驱动，非硬编码
 * - 现代 AI 框架：Mem0 记忆 + Reflexion 自省 + DSPy 风格编排
 * - 跨平台：Node.js / Python / Browser
 * - v0.13.10: 新增 WAL + 文件锁 + 异步 MemoryConsolidator
 * @version v0.13.10
 * @date 2026-05-12
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ─── HEARTCORE v2（来自 ~/.heartflow/）────────────────────────────
const {
  SleepWake, getSleepWake,
  globalEventBus,
  globalStateStore,
  StartupCheck, getStartupCheck,
  HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth,
  globalToolRegistry,
} = require('./heartcore/index.js');

// ─── HeartFlow Engine Variables ──────────────────────────────────────────────
var IdentityEngine, ContextManager, MeaningfulMemory, LearningEngine;
var DreamLoopModule, EmotionEngine, SelfHealing, CognitiveEngine;
var ExperienceReplay, KnowledgeGraph, TrialityMemory;
var Agents, Autonomy, Consciousness, Ethics;
var Reflexion, SelfRefine, IdentitySystem, MemoryConsolidator;
var MemoryRecall, EthicsGuard, PapersBridge;

// 具身认知与情感类 (Top-level require for constructor)
const { EmbodiedCore } = require('./embodied/embodied-core.js');
const { DeepEmotion } = require('./emotion/deep-emotion.js');
const { EmotionStates, createEmotionState } = require('./emotion/EmotionStates.js');
const { transition, padToEmotion } = require('./emotion/EmotionTransition.js');
const { getStyleGuide, generateStyleDirective, generateResponseHint } = require('./emotion/ResponseStyle.js');
const { detectEmotionNeed } = require('./emotion/EmotionTrigger.js');
const { generateEmpathy } = require('./emotion/EmpathyGenerator.js');
const FlowPredictor = require('./autonomy/flow-predictor.js');

// ─── Utility Layer ──────────────────────────────────────────────────────────
const { FSAdapter } = require('./utils/fs-adapter.js');
const { Logger } = require('./utils/logger.js');
const logger = new Logger(process.env.HF_LOG_LEVEL || 'info');

// ─── HeartFlow Engine Init ──────────────────────────────────────────────────
function _initV11432() {
  IdentityEngine = require('./identity/identity-engine.js');
  ContextManager = require('./context/context-manager.js');
  var mmMod = require('./memory/meaningful-memory.js');
  MeaningfulMemory = new mmMod.MeaningfulMemory();
  MeaningfulMemory.boot(); // v0.13.12: 启动时恢复永久记忆（之前漏掉了）
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

  // ─── Papers Bridge（8个Python模块的Node.js桥接）────────────
  let PapersBridge;
  try {
    PapersBridge = require('./papers/papers-index.js');
    PapersBridge.probeAll();
  } catch(e) {
    PapersBridge = null;
    logger.warn('[HeartFlow] PapersBridge 不可用:', e.message);
  }
  _v11432Ready = true;
  logger.info(`[HeartFlow] ${VERSION} 引擎已加载`);
}

// 延迟加载 HeartFlow Engine（在第一次 start 时初始化）
var _v11432Ready = false;
function _ensureV11432() {
  if (!_v11432Ready) {
    _initV11432();
  }
}

// ─── 版本常量 ───────────────────────────────────────────────────────────────
let VERSION = 'v0.13.127';
let BUILD_DATE = '2026-05-11';
try {
  const root = path.resolve(__dirname, '..', '..');
  const verFile = path.join(root, 'VERSION');
  if (fs.existsSync(verFile)) {
    const verContent = fs.readFileSync(verFile, 'utf8').trim();
    if (verContent) {
      VERSION = verContent;
      const stats = fs.statSync(verFile);
      BUILD_DATE = stats.mtime.toISOString().split('T')[0];
    }
  }
} catch(e) { /* keep defaults */ }

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
    // DreamLoop（函数式，直接用 generateDream）
    const DreamFns = require('./dream/dream-loop.js');
    this.dream = { generate: DreamFns.generateDream, enabled: false, lastDreamAt: null };

    // 自进化系统
    const { Reflexion: RX } = require('./self-evolution/reflexion.js');
    const { SelfRefine: SR } = require('./self-evolution/self-refine.js');
    this.reflexion = new RX(this.fs);
    this.selfRefine = new SR(this.reflexion);

    // MemOS 三层记忆系统（容错：模块不存在则跳过）
    try {
      const MemOS = require('./memory/mem-os.js');
      this.memos = new MemOS({ autoReflect: false });
      this.memos.start();
    } catch(e) {
      this.memos = null;
      logger.warn('[HeartFlow] MemOS 未安装，三层记忆功能不可用');
    }

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
    this.sleepWake = getSleepWake({ idleTimeoutMs: 30 * 60 * 1000, enableAutoSleep: true });
    this.startupCheck = getStartupCheck();
    this.healthMonitor = getHealthCheck();
    this.healthMonitor.register('memory', builtinMemoryHealth);
    this._startedAt = null;

    // 具身认知与情感
    this.embodied = new EmbodiedCore(this.fs.root);
    this.deepEmotion = new DeepEmotion(this.fs.root);
    this.flowPredictor = FlowPredictor.flowPredictor;

    // 表层情感系统（与 DeepEmotion 共存）
    this.surfaceEmotion = {
      current: null,
      history: []
    };

    logger.info(`[HeartFlow] ${VERSION} 初始化完成`);
  }

  /** 获取运行状态 */
  getStatus() {
    return {
      version: this.version,
      started: this._started,
      uptime: this._startedAt ? Date.now() - this._startedAt : 0,
      deepEmotion: !!this.deepEmotion,
      dream: !!this.dream,
      identity: !!this.identity,
      guard: !!this.guard,
      memos: this.memos === null ? 'unavailable' : 'available',
      sleepWake: {
        phase: this.sleepWake.phase,
        lastActivity: this.sleepWake.lastActivity,
      },
    };
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
    _ensureV11432();  // 初始化 v11.43.2 引擎（MeaningfulMemory 在此被赋值）
    // 将 v11.43.2 引擎绑定到实例
    this.recall = MemoryRecall;
    this.identityEngine = IdentityEngine;
    this.contextManager = ContextManager;
    this.meaningfulMemory = MeaningfulMemory; // _initV11432() 已创建实例，直接引用
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

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778760723292 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Language Model","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Julie","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Animals","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778760723292 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"canbespecifiedindifferentwaystoaccommodate that strategically explores the space of reasoning","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"are given in Appendix A and","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"can find a successful plan 42% of the","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"asetoffactsandlogicalrules,andamodelisre-","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778760723292 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778760726676 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Productions","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Soar","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Retrieval","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Voyager","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778760726676 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"implements division-with-remainder by converting a number written as strokes | into","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"halts after executing the rule","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"without return values, as","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"is to use reasoning (and optionally retrieval) to sample one (Huang et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to enable global exploration as well as local backtrack and foresight","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"uses a separate image-to-","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"projects images directly into the language model’s representation space (Bavishi et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"consists of proposal and evaluation prompts (Yao et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"provides a path towards developing more general and more human-like","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to active reward learning","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778760726676 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"recall","value":null,"source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778760118239 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778760118239 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"Nowlet’sapplythedifferentiablephysicsideaasmentionedabovetofind :we’lldirectlyincludeourdiscretizedmo","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Ashintedatabove,wecandoevenbetterwithstateoftheartAItechniques: wecanlearnthefulldistributionofthe","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"actually resolves both “modes” of the solution in the form of points above and below the","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778760118239 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778760120186 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"That","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Ifadifferentfunctionf","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Thesignalc","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Theclosertheinputgatei","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778760120186 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"nets: the difficulty of learning long-term dependencies, fortemporalpatternrecognition","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778758912520 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Transformer","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"},{"term":"That","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"},{"term":"These","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778758914823 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"It","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Weclarify","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Big Five\nYou","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"You","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Both","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"They","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"You","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778758914823 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"uatingthecurrentitemwithinamulti-turnstructure issimilartoLIWC+SVM,butitextractsfeatures","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"traits, namely Agreeableness, Conscientiousness,","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"firstly extracts psycholinguistic features","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"DDGCN by a non-negligible","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"surpasses the single-turn","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"that directly requests the LLM to infer","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778758914823 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"f1score","value":null,"source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778758309029 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"Prominentrecentworkinthis","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"Samples","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778757104216 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Language Model","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Julie","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Animals","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778757104216 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"canbespecifiedindifferentwaystoaccommodate that strategically explores the space of reasoning","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"are given in Appendix A and","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"can find a successful plan 42% of the","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"asetoffactsandlogicalrules,andamodelisre-","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778757104216 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778757106854 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Productions","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Soar","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Retrieval","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Voyager","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778757106854 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"implements division-with-remainder by converting a number written as strokes | into","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"halts after executing the rule","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"without return values, as","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"is to use reasoning (and optionally retrieval) to sample one (Huang et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to enable global exploration as well as local backtrack and foresight","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"uses a separate image-to-","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"projects images directly into the language model’s representation space (Bavishi et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"consists of proposal and evaluation prompts (Yao et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"provides a path towards developing more general and more human-like","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to active reward learning","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778757106854 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"recall","value":null,"source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778756499833 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778756499833 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"Nowlet’sapplythedifferentiablephysicsideaasmentionedabovetofind :we’lldirectlyincludeourdiscretizedmo","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Ashintedatabove,wecandoevenbetterwithstateoftheartAItechniques: wecanlearnthefulldistributionofthe","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"actually resolves both “modes” of the solution in the form of points above and below the","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778756499833 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778756501696 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"That","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Ifadifferentfunctionf","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Thesignalc","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Theclosertheinputgatei","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778756501696 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"nets: the difficulty of learning long-term dependencies, fortemporalpatternrecognition","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778755294285 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Transformer","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"},{"term":"That","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"},{"term":"These","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778755296758 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"It","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Weclarify","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Big Five\nYou","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"You","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Both","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"They","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"You","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778755296758 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"uatingthecurrentitemwithinamulti-turnstructure issimilartoLIWC+SVM,butitextractsfeatures","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"traits, namely Agreeableness, Conscientiousness,","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"firstly extracts psycholinguistic features","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"DDGCN by a non-negligible","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"surpasses the single-turn","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"that directly requests the LLM to infer","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778755296758 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"f1score","value":null,"source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778754690852 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"Prominentrecentworkinthis","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"Samples","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778753485943 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Language Model","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Julie","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Animals","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778753485943 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"canbespecifiedindifferentwaystoaccommodate that strategically explores the space of reasoning","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"are given in Appendix A and","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"can find a successful plan 42% of the","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"asetoffactsandlogicalrules,andamodelisre-","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778753485943 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778753488718 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Productions","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Soar","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Retrieval","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Voyager","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778753488718 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"implements division-with-remainder by converting a number written as strokes | into","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"halts after executing the rule","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"without return values, as","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"is to use reasoning (and optionally retrieval) to sample one (Huang et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to enable global exploration as well as local backtrack and foresight","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"uses a separate image-to-","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"projects images directly into the language model’s representation space (Bavishi et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"consists of proposal and evaluation prompts (Yao et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"provides a path towards developing more general and more human-like","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to active reward learning","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778753488718 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"recall","value":null,"source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778752881955 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778752881955 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"Nowlet’sapplythedifferentiablephysicsideaasmentionedabovetofind :we’lldirectlyincludeourdiscretizedmo","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Ashintedatabove,wecandoevenbetterwithstateoftheartAItechniques: wecanlearnthefulldistributionofthe","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"actually resolves both “modes” of the solution in the form of points above and below the","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778752881955 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778752883475 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"That","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Ifadifferentfunctionf","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Thesignalc","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Theclosertheinputgatei","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778752883475 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"nets: the difficulty of learning long-term dependencies, fortemporalpatternrecognition","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778751676685 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Transformer","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"},{"term":"That","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"},{"term":"These","definition":"","source":"psychology-philosophy-ai/1706.03762v7.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778751679177 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"It","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Weclarify","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Big Five\nYou","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"You","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"Both","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"They","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"term":"You","definition":"","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778751679177 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"uatingthecurrentitemwithinamulti-turnstructure issimilartoLIWC+SVM,butitextractsfeatures","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"traits, namely Agreeableness, Conscientiousness,","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"firstly extracts psycholinguistic features","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"DDGCN by a non-negligible","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"surpasses the single-turn","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"},{"description":"that directly requests the LLM to infer","source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778751679177 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"f1score","value":null,"source":"psychology-philosophy-ai/2023.findings-emnlp.216.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778751073120 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"Prominentrecentworkinthis","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"Samples","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/1406.2661v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778749868618 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Language Model","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Julie","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Animals","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Carnivores","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"term":"Fae","definition":"","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778749868618 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"canbespecifiedindifferentwaystoaccommodate that strategically explores the space of reasoning","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"are given in Appendix A and","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"can find a successful plan 42% of the","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"},{"description":"asetoffactsandlogicalrules,andamodelisre-","source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778749868618 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2305.14992_LLM_Reasoning_World_Model.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778749871227 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"Productions","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Soar","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"It","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Retrieval","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Ms","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"Voyager","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778749871227 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"implements division-with-remainder by converting a number written as strokes | into","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"halts after executing the rule","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"without return values, as","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"is to use reasoning (and optionally retrieval) to sample one (Huang et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to enable global exploration as well as local backtrack and foresight","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"uses a separate image-to-","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"projects images directly into the language model’s representation space (Bavishi et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"consists of proposal and evaluation prompts (Yao et al","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"provides a path towards developing more general and more human-like","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"},{"description":"to active reward learning","source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778749871227 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"recall","value":null,"source":"psychology-philosophy-ai/2309.02427_CoALA_Cognitive_Architectures.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };


  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778749264951 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"There","definition":"","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778749264951 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"Nowlet’sapplythedifferentiablephysicsideaasmentionedabovetofind :we’lldirectlyincludeourdiscretizedmo","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Ashintedatabove,wecandoevenbetterwithstateoftheartAItechniques: wecanlearnthefulldistributionofthe","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"actually resolves both “modes” of the solution in the form of points above and below the","source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"description":"Physics-basedDeepLearning","source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

  // Metric Tracker from papers
  this.metricTracker_1778749264951 = {
    name: 'metricTracker',
    type: 'metrics',
    
    metrics: [{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"},{"name":"accuracy","value":null,"source":"psychology-philosophy-ai/2109.05237v4.pdf"}],
    history: [],
    
    track(value) {
      this.history.push({ value, timestamp: Date.now() });
      return this.history[this.history.length - 1];
    },
    
    getStats() {
      if (this.history.length === 0) return null;
      const values = this.history.map(h => h.value);
      return {
        current: values[values.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  };

  // Concept Engine from papers (Knowledge Distillation)
  this.conceptEngine_1778749266373 = {
    name: 'conceptEngine',
    type: 'knowledge',
    
    concepts: [{"term":"That","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Ifadifferentfunctionf","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"This","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Thesignalc","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Theclosertheinputgatei","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"},{"term":"Rp","definition":"","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    understand(text) {
      return this.concepts
        .map(c => ({
          term: c.term,
          match: text.toLowerCase().includes(c.term.toLowerCase()),
          definition: c.definition
        }))
        .filter(c => c.match);
    },
    
    explain(term) {
      const concept = this.concepts.find(c => 
        c.term.toLowerCase() === term.toLowerCase()
      );
      return concept ? concept.definition : '未知概念';
    }
  };

  // Algorithm Library from papers
  this.algoLib_1778749266373 = {
    name: 'algorithmLibrary',
    type: 'algorithms',
    
    algorithms: [{"description":"nets: the difficulty of learning long-term dependencies, fortemporalpatternrecognition","source":"psychology-philosophy-ai/2304.11461v1.pdf"}],
    
    // 执行算法步骤
    execute(steps, context = {}) {
      const results = [];
      steps.forEach((step, i) => {
        results.push({
          step: i + 1,
          action: step.description || step,
          status: 'completed'
        });
      });
      return results;
    },
    
    // 获取建议
    suggest(context) {
      return this.algorithms.slice(0, 3);
    }
  };

    // ─── HEARTCORE v2 启动 ───────────────────────────────────
    this.sleepWake.start();
    this.bus.emit('start', { version: VERSION, sessionId: this._sessionId });
    logger.info(`[HeartFlow] 启动成功，session: ${this._sessionId}`);
  }

  /** 停止引擎（异步，等待所有写操作完成） */
  async stop() {
    this.dream.enabled = false;
    this._started = false;
    // 等待记忆系统所有 pending writes 完成
    await this._consolidator.drain();
    // 停止 MeaningfulMemory（auto-save + 持久化）
    if (this.meaningfulMemory && typeof this.meaningfulMemory.shutdown === 'function') {
      await this.meaningfulMemory.shutdown();
    }
    // ─── HEARTCORE v2 停止 ───────────────────────────────────
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

    // 5. 表层情感检测与响应风格注入
    const padState = this.deepEmotion.state.dimensions;
    const emotionNeed = detectEmotionNeed(input, padState);
    if (emotionNeed.needsEmotion || this.surfaceEmotion.current) {
      const trans = transition(input, padState, this.surfaceEmotion.current);
      const newState = createEmotionState(trans.to, trans.intensity);
      this._updateSurfaceEmotion(newState);
      const style = getStyleGuide(trans.to, trans.intensity, trans.trajectory);
      result.surfaceEmotion = {
        emotion: trans.to,
        intensity: trans.intensity,
        confidence: trans.confidence,
        trajectory: trans.trajectory,
        styleGuide: style,
        styleDirective: generateStyleDirective(trans.to, trans.intensity),
        from: trans.from,
        triggers: trans.triggers,
        decayed: trans.decayed || false,
        textAnalysis: emotionNeed.textAnalysis
      };

      // 6. 共情注入：基于情感生成共情话语
      if (emotionNeed.needsEmotion || trans.confidence > 0.3) {
        const empathy = generateEmpathy(trans.to, trans.intensity);
        result.empathy = {
          phrase: empathy.phrase,
          followUp: empathy.followUp,
          suggestions: empathy.suggestions,
          responseHint: generateResponseHint(trans.to, trans.intensity, trans.trajectory)
        };
      }
    }

    // 6. 技能路由（声明式）
    const skillResults = await this._routeSkills(input);
    if (skillResults.length > 0) result.skills = skillResults;

    result.latency = Date.now() - start;
    return result;
  }

  /**
   * 更新表层情感状态（含历史记录）
   */
  _updateSurfaceEmotion(newState) {
    this.surfaceEmotion.history.push({
      ...this.surfaceEmotion.current,
      endedAt: new Date().toISOString()
    });
    this.surfaceEmotion.current = newState;
    if (this.surfaceEmotion.history.length > 20) {
      this.surfaceEmotion.history.shift();
    }
  }

  /**
   * 获取表层情感状态
   */
  getSurfaceEmotion() {
    return this.surfaceEmotion.current;
  }

  /**
   * 存储记忆
   * @param {object} fragment - { content, type, importance, metadata? }
   */
  remember(fragment) {
    if (!fragment.id) fragment.id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    if (!fragment.timestamp) fragment.timestamp = Date.now();
    if (!fragment.sessionId) fragment.sessionId = this._sessionId;
    const layer = this._consolidator.consolidate(fragment);
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
  async dreamNow() { return this.dream.generate(await this._consolidator.getAll()); }

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
    return {
      version: VERSION,
      started: this._started,
      sessionId: this._sessionId,
      sleepWake: {
        phase: this.sleepWake.phase,
        lastActivity: this.sleepWake.lastActivity,
      },
      memory: {
        hot: (await this._consolidator.getHot()).length,
        warm: (await this._consolidator.getWarm()).length,
        cold: (await this._consolidator.getCold()).length,
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
      papers: {
        bridge: 'papers-index.js',
        modules: this.papers ? Object.fromEntries(
          Object.entries(this.papers).filter(([k]) => k !== 'bridge').map(([k, v]) => [k, v ? 'OK' : 'FAIL'])
        ) : {},
      },
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
