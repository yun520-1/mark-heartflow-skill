/**
 * HeartFlow v1.0.8 — 单一入口，统一路由
 *
 * 调用方式:
 *   hf.dispatch('subsystem.method', arg1, arg2)  // 统一路由
 *   hf.verifyReasoning(r, c)                     // 直接方法
 *
 * 所有模块在 _modules registry 中注册，可通过 routes() 查看可用路由。
 */

const path = require('path');

// ─── Subsystem Imports ────────────────────────────────────────────────────────

// Search modules
const { BM25Engine } = require('./search/bm25.js');
const { HybridSearchEngine } = require('./search/hybrid-search.js');

// Budget & Token counting
const { Budget, countTokens, resolveThinkingBudget, exceedsTokenLimit, getBudgetDescription } = require('./budget.js');

// Graph memory
const Graph = require('./memory/graph.js');

// Core utilities
const CoreUtils = require('./utils.js');

// Search trace & transparency
const { SearchTrace, SearchPhaseMetrics, WeightComponents, QueryInfo, SearchSummary } = require('./search/search-trace.js');

// Memory slots & observe
const { MemorySlots } = require('./memory/slots.js');
const { observe, consolidate } = require('./memory/observe.js');

// Memory
const { MeaningfulMemory } = require('../memory/meaningful-memory.js');
const { KnowledgeGraph } = require('../memory/knowledge-graph.js');
const { RetrievalAnchor } = require('../memory/retrieval-anchor.js');
const { TrialityMemory } = require('../core/memory/triality-memory.js');

// Evolution
const { EvolutionLoop } = require('../evolution/loop.js');
const { DreamEngine } = require('../dream/engine.js');
const { MetaLearner } = require('../evolution/meta-learner.js');

// Identity
const { SelfModel } = require('../identity/self-model.js');
const { SelfVerifier } = require('../identity/self-verifier.js');
const { LessonBank } = require('../identity/lesson-bank.js');

// Psychology
const { PsychologyEngine } = require('../psychology/engine.js');
const { EmotionalProtocol } = require('../security/emotional-protocol.js');

// Security
const { TruthfulnessChecker } = require('../security/truthfulness.js');
const { SecurityChecker } = require('../security/security-checker.js');

// Engine modules
const { StabilityGuard } = require('./stability-guard.js');
const { ExecutionVerifier } = require('./execution-verifier.js');
const { DecisionVerifier } = require('./decision-verifier.js');
const { CounterfactualEngine } = require('./counterfactual-engine.js');
const { ConfidenceCalibrator } = require('./confidence-calibrator.js');
const { SpontaneousRestraint } = require('./spontaneous-restraint.js');
const { CooperativeArbitration } = require('./cooperative-arbitration.js');
const { WakeUpVerifier } = require('./wake-up-verifier.js');
const { InteractiveDream } = require('./interactive-dream.js');
const { EmbodiedCore } = require('./embodied-core.js');
const { BeingLogic } = require('./being-logic.js');

// Language honesty — exports functions, not a class
const LanguageHonesty = require('./language-honesty.js');

// Reasoning integrator — exports functions
const ReasoningIntegrator = require('./reasoning-integrator.js');

// Workflow switch — exports functions
const WorkflowSwitch = require('./workflow-switch.js');

// State snapshot — singleton object
const StateSnapshot = require('./state-snapshot.js');

// Error handler — singleton object
const ErrorHandler = require('./error-handler.js');

// ─── Version ─────────────────────────────────────────────────────────────────
const VERSION = '1.1.8.0';
const BUILD_DATE = '2026-05-30';

class HeartFlow {
  constructor(config = {}) {
    this.version = VERSION;
    this.buildDate = BUILD_DATE;
    this.config = config;
    this.startTime = null;
    this.sessionId = null;
    this.started = false;
    this.rootPath = config.rootPath || path.join(__dirname, '..', '..');

    // Subsystem instances (null until start)
    this.memory = null;
    this.triality = null;
    this.knowledge = null;
    this.anchor = null;
    this.reasoning = null;
    this.counterfactual = null;
    this.verify = null;
    this.execution = null;
    this.decision = null;
    this.evolution = null;
    this.dream = null;
    this.lesson = null;
    this.meta = null;
    this.self = null;
    this.being = null;
    this.psychology = null;
    this.emotion = null;
    this.truth = null;
    this.security = null;
    this.language = null;   // object (not class)
    this.stability = null;
    this.confidence = null;
    this.restraint = null;
    this.arbitration = null;
    this.snapshot = null;  // singleton
    this.error = null;      // config
    this.embodied = null;
    this.wakeup = null;
    this.interactive = null;
    this.workflow = null;   // functions

    // New modules
    this.bm25 = null;
    this.hybrid = null;
    this.budget = null;
    this.graph = null;
    this.utils = null;
    this.slots = null;
    this.observe = null;
    this.consolidate = null;
    this.SearchTrace = SearchTrace;
    this.SearchPhaseMetrics = SearchPhaseMetrics;
    this.WeightComponents = WeightComponents;
    this.QueryInfo = QueryInfo;
    this.SearchSummary = SearchSummary;

    this._modules = {};
    this._mindSpace = { rules: [], context: {} };
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  start() {
    if (this.started) return;
    this.startTime = Date.now();
    this.sessionId = `session-${this.startTime}`;

    // Memory
    this.memory = new MeaningfulMemory(this.rootPath);
    this.triality = new TrialityMemory(this.rootPath);
    this.knowledge = new KnowledgeGraph(this.rootPath);
    this.anchor = new RetrievalAnchor();

    // Evolution
    this.evolution = new EvolutionLoop(this.memory);
    this.dream = new DreamEngine(this.memory, null);
    this.lesson = new LessonBank(this.rootPath);
    this.meta = new MetaLearner();

    // Identity
    this.self = new SelfModel(this.rootPath);
    this.verify = new SelfVerifier(this.rootPath);

    // Psychology
    this.psychology = new PsychologyEngine(this.memory);
    this.emotion = new EmotionalProtocol();

    // Security
    this.truth = new TruthfulnessChecker(this.rootPath);
    this.security = new SecurityChecker();

    // Engine modules (classes)
    try { this.stability = new StabilityGuard(); } catch (e) {}
    try { this.execution = new ExecutionVerifier(); } catch (e) {}
    try { this.decision = new DecisionVerifier(); } catch (e) {}
    try { this.counterfactual = new CounterfactualEngine(); } catch (e) {}
    try { this.confidence = new ConfidenceCalibrator(); } catch (e) {}
    try { this.restraint = new SpontaneousRestraint(); } catch (e) {}
    try { this.arbitration = new CooperativeArbitration(); } catch (e) {}
    try { this.embodied = new EmbodiedCore(this.rootPath); } catch (e) {}
    try { this.wakeup = new WakeUpVerifier(); } catch (e) {}
    try { this.interactive = new InteractiveDream(this.rootPath); } catch (e) {}
    try { this.being = new BeingLogic(this.rootPath); } catch (e) {}

    // Engine modules (functions/objects — no 'new')
    try { this.language = LanguageHonesty; } catch (e) {}
    try { this.reasoning = ReasoningIntegrator; } catch (e) {}

    // Classes requiring 'new'
    try { this.workflow = new WorkflowSwitch(); } catch (e) {}
    try { this.snapshot = StateSnapshot; } catch (e) {}  // singleton export
    try { this.error = ErrorHandler; } catch (e) {}      // singleton export

    // ─── New modules initialization ─────────────────────────────────────────
    // Search modules
    try { this.bm25 = new BM25Engine({ dataDir: path.join(this.rootPath, 'data/search'), autoSave: true }); } catch (e) { console.warn('[HeartFlow] BM25 init error:', e.message); }
    try { this.hybrid = new HybridSearchEngine({ dataDir: path.join(this.rootPath, 'data/search') }); } catch (e) { console.warn('[HeartFlow] HybridSearch init error:', e.message); }

    // Budget & Utils (function exports, not classes)
    this.budget = { Budget, countTokens, resolveThinkingBudget, exceedsTokenLimit, getBudgetDescription };
    this.utils = CoreUtils;

    // Graph (singleton functions)
    this.graph = Graph;

    // Slots & Observe (reference from heartflow context)
    try {
      this.slots = new MemorySlots({ dataDir: path.join(this.rootPath, 'data') });
    } catch (e) { console.warn('[HeartFlow] MemorySlots init error:', e.message); }
    this.observe = observe;
    this.consolidate = consolidate;

    this._bootMindSpace();
    this._registerModules();

    this.started = true;
    console.log(`[HeartFlow] ${VERSION} 初始化完成`);
    console.log(`[HeartFlow] session: ${this.sessionId}, 模块: ${Object.keys(this._modules).length}`);
  }

  _bootMindSpace() {
    const coreRules = this.memory.listCore();
    this._mindSpace.rules = coreRules.map(r => ({ key: r.key, value: r.value, type: 'core_identity' }));
    if (this._mindSpace.rules.length === 0) {
      this.memory.addCore('identity.upgrade', '升级者', ['identity', 'core']);
      this.memory.addCore('identity.transmit', '传递者', ['identity', 'core']);
      this.memory.addCore('identity.truth', '真', ['identity', 'core']);
      this._bootMindSpace();
    }
  }

  _registerModules() {
    this._modules = {};
    const subsystemNames = [
      'memory', 'triality', 'knowledge', 'anchor',
      'reasoning', 'counterfactual', 'verify', 'execution', 'decision',
      'evolution', 'dream', 'lesson', 'meta',
      'self', 'being',
      'psychology', 'emotion',
      'truth', 'security', 'language',
      'stability', 'confidence', 'restraint', 'arbitration',
      'snapshot', 'error', 'embodied', 'wakeup', 'interactive', 'workflow',
      // New modules
      'bm25', 'hybrid', 'budget', 'graph', 'utils',
    ];
    for (const name of subsystemNames) {
      if (this[name] !== null && this[name] !== undefined) {
        this._modules[name] = this[name];
      }
    }
  }

  async stop() {
    if (!this.started) return;
    this.started = false;
    this._modules = {};
    this._mindSpace = { rules: [], context: {} };
    console.log(`[HeartFlow] 已停止`);
  }

  // ─── Unified Dispatch ───────────────────────────────────────────────────

  /**
   * dispatch('subsystem.method', ...args) — 统一路由
   * 例子: hf.dispatch('truth.checkStatement', 'xxx')
   *       hf.dispatch('lesson.getTopLessons', 5)
   */
  dispatch(route, ...args) {
    if (!this.started) throw new Error('HeartFlow not started');
    const dot = route.indexOf('.');
    if (dot === -1) throw new Error(`Invalid route: ${route} (missing '.')`);
    const subsystem = route.slice(0, dot);
    const method = route.slice(dot + 1);
    const mod = this._modules[subsystem];
    if (!mod) {
      const available = Object.keys(this._modules).sort().join(', ');
      throw new Error(`Unknown subsystem: ${subsystem}. Available: ${available}`);
    }
    if (typeof mod[method] !== 'function') {
      throw new Error(`${subsystem}.${method} is not a function on ${subsystem}`);
    }
    return mod[method](...args);
  }

  /**
   * routes() — 返回所有可用路由表
   */
  routes() {
    const table = {};
    for (const [name, mod] of Object.entries(this._modules)) {
      let methods = [];
      try {
        const proto = Object.getPrototypeOf(mod);
        if (proto && proto !== Object.prototype) {
          methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');
        }
      } catch (e) {
        // strict mode or primitive — fall back to enumerating own properties
      }
      if (!methods.length) {
        methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');
      }
      table[name] = methods;
    }
    return table;
  }

  // ─── Health ─────────────────────────────────────────────────────────────

  async healthCheck() {
    if (!this.started) return { started: false, version: VERSION, error: 'not_started' };
    const loaded = Object.keys(this._modules);
    const all = [
      'memory', 'triality', 'knowledge', 'anchor',
      'reasoning', 'counterfactual', 'verify', 'execution', 'decision',
      'evolution', 'dream', 'lesson', 'meta',
      'self', 'being',
      'psychology', 'emotion',
      'truth', 'security', 'language',
      'stability', 'confidence', 'restraint', 'arbitration',
      'snapshot', 'error', 'embodied', 'wakeup', 'interactive', 'workflow',
      // New modules
      'bm25', 'hybrid', 'budget', 'graph', 'utils',
    ];
    return {
      started: true,
      uptime_ms: Date.now() - this.startTime,
      sessionId: this.sessionId,
      version: VERSION,
      buildDate: BUILD_DATE,
      subsystems: {
        loaded: loaded.length,
        missing: all.filter(k => !loaded.includes(k)),
      },
    };
  }

  // ─── Direct API Methods ─────────────────────────────────────────────────

  analyzePsychology(input, opts = {}) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { intent: null, emotion: null, needs: [], defenses: [], confidence: 0 };
    const result = this.psychology.analyzePsychology(input);
    if (opts.autoRemember !== false && result.emotion?.intensity === 'high') {
      this._psychBridge(input, result);
    }
    return result;
  }

  _psychBridge(input, result) {
    // _shouldAutoRecord drives what becomes LEARNED (permanent) vs EPHEMERAL (session)
    // High-intensity emotion + specific topic → autoRecord to LEARNED
    if (result.emotion?.intensity === 'high') {
      this.memory.autoRecord({
        type: 'emotion',
        content: input.slice(0, 200),
        emotion: {
          topic: result.emotion?.category || 'general',
          intensity: result.emotion?.intensity,
          direction: result.emotion?.valence || 'unknown'
        }
      });
    }

    // Also keep lightweight ephemeral signal for session context
    const sw = new Set(['the','a','an','is','are','was','were','i','you','this','that','to','of','in','on','for','with','my','and','or','but']);
    const words = input.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g,'').toLowerCase()).filter(w => w.length > 3 && !sw.has(w)).slice(0, 3);
    if (words.length) {
      this.memory.remember(`signal:${words.join('_')}:${Date.now()}`, JSON.stringify({ topic: words.join('_'), emotion: result.emotion?.category, ts: Date.now() }), 4 * 60 * 60 * 1000);
    }
  }

  classify(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { category: 'unknown', emotion: 'neutral', confidence: 0 };
    return this.psychology.classify(input);
  }

  verifyReasoning(reasoning, conclusion) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.verify.verify(reasoning, conclusion);
  }

  checkTruthfulness(statement) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truth.checkStatement(statement);
  }

  checkLessonPattern(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lesson.checkPattern(input);
  }

  heal(error) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.heal(error);
  }

  dreamNow() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.dream.dream();
  }

  detectIdentityDrift() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.self.detectDrift();
  }

  processEmotionally(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.emotion.process(input);
  }

  getTopLessons(limit = 5) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lesson.getTopLessons(limit);
  }

  getMemoryStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.memory.getMemoryStats();
  }

  getTrialityStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.triality ? this.triality.getLayerStats() : { error: 'not loaded' };
  }

  getMindSpace() {
    if (!this.started) throw new Error('HeartFlow not started');
    return { rules: this._mindSpace.rules, workingEntries: Object.entries(this.memory?.ephemeral || {}).slice(0, 10) };
  }

  remember(key, value, tier = 'learned') {
    if (!this.started) throw new Error('HeartFlow not started');
    if (tier === 'core') return this.memory.addCore(key, value);
    if (tier === 'ephemeral') return this.memory.remember(key, value);
    return this.memory.learn(key, value);
  }

  search(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.memory.search(query);
  }

  getPsychologyStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.psychology.getPsychologyStats();
  }

  getEvolutionStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.getStats();
  }

  getDreamStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.dream.getDreamStats();
  }

  getTruthfulnessStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truth.getStats();
  }

  getLessonStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lesson.getStats();
  }

  getVerificationStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.verify.getStats();
  }

  getSelfModelStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.self.getStats();
  }

  // Knowledge
  addKnowledge(name, description, type = 'concept', importance = 0.5) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledge.addNode({ name, description, type, importance });
  }

  searchKnowledge(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledge.search(query);
  }

  getKnowledgeStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledge.getStats();
  }

  // Security
  scanSecurity(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.scan(text);
  }

  redactSecurity(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.redact(text);
  }

  getSecurityStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.getStats();
  }
}

// Factory
function createHeartFlow(config = {}) {
  return new HeartFlow(config);
}

// CLI
if (require.main === module) {
  const rootPath = path.join(__dirname, '..', '..');
  const hf = createHeartFlow({ rootPath });
  hf.start();

  const t0 = Date.now();
  hf.healthCheck().then(health => {
    console.log(`\n[HeartFlow] ${VERSION} 健康检查 (${Date.now() - t0}ms):`);
    console.log(JSON.stringify(health, null, 2));

    // Test dispatch routes
    console.log('\n--- dispatch tests ---');
    const tests = [
      ['truth.checkStatement', '这个方案一定是对的'],
      ['lesson.getTopLessons', 3],
      ['verify.verify', '因为A所以B', '结论B'],
    ];
    for (const [route, ...args] of tests) {
      try {
        const r = hf.dispatch(route, ...args);
        console.log(`${route}: OK → ${JSON.stringify(r).slice(0, 120)}`);
      } catch (e) {
        console.log(`${route}: ERROR → ${e.message}`);
      }
    }

    console.log('\n--- available routes ---');
    const rt = hf.routes();
    for (const [name, methods] of Object.entries(rt)) {
      console.log(`  ${name}: ${methods.slice(0, 5).join(', ')}${methods.length > 5 ? '...' : ''}`);
    }

    hf.stop();
    process.exit(0);
  }).catch(e => {
    console.error('Error:', e);
    hf.stop();
    process.exit(1);
  });
}

module.exports = { HeartFlow, createHeartFlow, VERSION };
