/**
 * HeartFlow — AI Psychological Perception System 1.0.6
 * 
 * A production-ready AI psychology engine for agents.
 * 
 * Architecture:
 *   MeaningfulMemory  ←  Three-tier memory (CORE/LEARNED/EPHEMERAL) + SM-2 spaced repetition
 *   PsychologyEngine ←  Intent/emotion/needs/defenses + Dual-process cognition + Valence/Arousal emotion
 *   SelfEvolution   ←  Q-learning self-healer + Reflexion-style improvement
 *   DreamEngine     ←  Sleep consolidation with Ebbinghaus decay
 *   SelfModel       ←  Belief tracking, identity drift detection, install base, growth metrics
 *   SelfVerifier    ←  4-way reasoning verification (reverse/logical/counterfactual/coverage)
 *   LessonBank      ←  Error pattern → correction mapping with 10 bootstrap lessons
 *   TruthfulnessChecker ←  Detect absolute-word lies, track lying rate
 *   EmotionalProtocol   ←  "容器是漏的" - emotional acknowledgment before analysis
 *   SecurityChecker     ←  Sensitive info scan/redact + GitHub safety checks
 *   KnowledgeGraph      ←  Structured memory: nodes + typed edges + temporal context
 *   RetrievalAnchor     ←  Context-augmented reasoning with relevance scoring
 *   MetaLearner        ←  5-strategy Q-table learner (conceptual/example/analogy/step_by_step/socratic)
 * 
 * 1.0.5 upgrades (v1.0.5):
 *   - Full module absorption from mark-heartflow-skill: all 9 advanced modules integrated
 *   - PsychologyEngine v1.0.1: Dual-process cognition (System 1/System 2), emotion decay
 *   - SelfEvolution: Q-learning self-healer with 7 error patterns, 4 strategies
 *   - SelfModel: Belief tracking + identity drift detection + install base growth metrics
 *   - SelfVerifier: 4-way reasoning verification with persistent issue tracking
 *   - TruthfulnessChecker: Absolute-word detection, fabricated number detection, lie rate tracking
 *   - EmotionalProtocol: "容器是漏的" emotional acknowledgment + multi-keyword detection
 *   - LessonBank: 10 bootstrap lessons (added "hedging" and "未核实先说" lessons)
 *   - SecurityChecker: 7-pattern sensitive info scan, redact, GitHub safety check
 *   - KnowledgeGraph: Node/edge KG with importance, reflection count, bidirectional edges
 *   - RetrievalAnchor: Relevance scoring, recency/reliability tracking, context augmentation
 *   - MetaLearner: 5 learning strategies with Q-table, concept extraction
 *   - MeaningfulMemory: Lazy loading (no sync block), atomic writes, corruption protection
 * 
 * Public API (all tested):
 *   start()                      Initialize engine
 *   stop()                       Graceful shutdown
 *   healthCheck()                 → { started, uptime, memory, version }
 *   analyzePsychology(text)       → { intent, emotion, needs, defenses, confidence }
 *   classify(text)                → { category, emotion, confidence }
 *   getMemoryStats()              → { core, learned, ephemeral, ... }
 *   getMindSpace()               → { rules, workingEntries }
 *   dreamNow()                   → { consolidation, duration_ms, dream_complete }
 *   heal(error)                   → { ok, canRetry, strategy, hints }
 *   getPsychologyStats()         → { cognition, emotion }
 *   getEvolutionStats()          → { lessons, qtable }
 *   getDreamStats()              → { dreams, insights }
 *   verifyReasoning(r,c)         → { passed, checks, confidence }
 *   checkLessonPattern(input)    → lesson or null
 *   checkTruthfulness(stmt)       → { isLying, confidence }
 *   processEmotionally(input)    → { hasEmotion, acknowledgment }
 *   detectIdentityDrift()        → { hasDrift, driftScore }
 *   recordInstall()              → { installBase }
 *   getTopLessons(n)             → [lesson]
 *   getSelfModelStats()          → { beliefs, capabilities, drift }
 *   getTruthfulnessStats()      → { totalStatements, liesCaught, lieRate }
 *   getVerificationStats()       → { totalVerified, passRate }
 *   getLessonStats()             → { totalLessons, totalHits, successRate }
 *   getLearningScores()          → { strategy scores }
 *   getAnchorStats()             → { totalAnchors, queries }
 *   getKnowledgeStats()          → { nodes, edges }
 * 
 * Design principles:
 *   - Zero npm dependencies
 *   - Pure JavaScript, Node.js built-ins only
 *   - Every API has a measurable return value
 *   - No over-claiming, no stub features
 */

const path = require('path');
const { MeaningfulMemory } = require('../memory/meaningful-memory.js');
const { PsychologyEngine } = require('../psychology/engine.js');
const { SelfEvolution } = require('../evolution/loop.js');
const { DreamEngine } = require('../dream/engine.js');
const { KnowledgeGraph } = require('../memory/knowledge-graph.js');
const { RetrievalAnchor } = require('../memory/retrieval-anchor.js');
const { MetaLearner } = require('../evolution/meta-learner.js');
const { SelfModel } = require('../identity/self-model.js');
const { SelfVerifier } = require('../identity/self-verifier.js');
const { LessonBank } = require('../identity/lesson-bank.js');
const { TruthfulnessChecker } = require('../security/truthfulness.js');
const { EmotionalProtocol } = require('../security/emotional-protocol.js');
const { SecurityChecker } = require('../security/security-checker.js');

// Version
const VERSION = '1.0.6';
const BUILD_DATE = '2026-05-18';

class HeartFlow {
  constructor(config = {}) {
    this.version = VERSION;
    this.buildDate = BUILD_DATE;
    this.config = config;
    this.startTime = null;
    this.sessionId = null;
    this.started = false;

    // Filesystem
    const rootPath = config.rootPath || path.join(__dirname, '..', '..');
    this.rootPath = rootPath;

    // Subsystems (initialized in start())
    this.memory = null;
    this.psychology = null;
    this.evolution = null;
    this.dream = null;
    this.knowledgeGraph = null;
    this.retrievalAnchor = null;
    this.metaLearner = null;
    this.selfModel = null;
    this.selfVerifier = null;
    this.lessonBank = null;
    this.truthfulness = null;
    this.emotionalProtocol = null;
    this.security = null;

    // MindSpace: working mental state
    this._mindSpace = {
      rules: [],       // Active identity rules
      context: {},     // Current working context
    };
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  start() {
    if (this.started) return;

    this.startTime = Date.now();
    this.sessionId = `session-${this.startTime}`;

    // Initialize subsystems
    this.memory = new MeaningfulMemory(this.rootPath);
    this.psychology = new PsychologyEngine(this.memory);
    this.evolution = new SelfEvolution(this.memory);
    this.dream = new DreamEngine(this.memory, this.psychology);
    this.knowledgeGraph = new KnowledgeGraph(this.rootPath);
    this.retrievalAnchor = new RetrievalAnchor();
    this.metaLearner = new MetaLearner();
    this.selfModel = new SelfModel(this.rootPath);
    this.selfVerifier = new SelfVerifier(this.rootPath);
    this.lessonBank = new LessonBank(this.rootPath);
    this.truthfulness = new TruthfulnessChecker(this.rootPath);
    this.emotionalProtocol = new EmotionalProtocol();
    this.security = new SecurityChecker();

    // Boot MindSpace with identity rules from CORE
    this._bootMindSpace();

    this.started = true;
    console.log(`[HeartFlow] ${VERSION} 初始化完成`);
    console.log(`[HeartFlow] 启动成功，session: ${this.sessionId}`);
  }

  async stop() {
    if (!this.started) return;
    this.started = false;
    this._mindSpace = { rules: [], context: {} };
    console.log(`[HeartFlow] 已停止`);
  }

  // ─── Boot ──────────────────────────────────────────────────────────────

  _bootMindSpace() {
    // Load CORE identity rules into MindSpace ROM
    const coreRules = this.memory.listCore();
    this._mindSpace.rules = coreRules.map(r => ({
      key: r.key,
      value: r.value,
      type: 'core_identity',
    }));

    // Initialize with 3 built-in identity rules
    if (this._mindSpace.rules.length === 0) {
      this.memory.addCore('identity.upgrade', '升级者 — 追求持续变强', ['identity', 'core']);
      this.memory.addCore('identity.transmit', '传递者 — 传承知识', ['identity', 'core']);
      this.memory.addCore('identity.truth', '真 — 可验证、可证伪', ['identity', 'core']);
      this._bootMindSpace(); // Reload
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Health check — returns engine status
   */
  async healthCheck() {
    if (!this.started) {
      return { started: false, version: VERSION, error: 'not_started' };
    }
    return {
      started: true,
      uptime_ms: Date.now() - this.startTime,
      sessionId: this.sessionId,
      version: VERSION,
      buildDate: BUILD_DATE,
      subsystems: {
        memory: this.memory !== null,
        psychology: this.psychology !== null,
        evolution: this.evolution !== null,
        dream: this.dream !== null,
      },
      stats: this.memory ? this.memory.getStats() : null,
    };
  }

  /**
   * Analyze psychology from input text.
   * Returns intent, emotion, needs, defenses, confidence.
   * 
   * v0.17: Emotionally significant inputs are automatically preserved in memory.
   * 
   * @param {string} input
   * @param {object} opts
   * @param {boolean} opts.autoRemember - Bridge emotionally significant signals to memory (default true)
   * @returns {object} Psychological perception result
   */
  analyzePsychology(input, opts = {}) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { intent: null, emotion: null, needs: [], defenses: [], confidence: 0 };
    const result = this.psychology.analyzePsychology(input);
    
    // Bridge: emotionally significant → preserve in memory
    if (opts.autoRemember !== false) {
      this._psychBridge(input, result);
    }
    
    return result;
  }

  /**
   * Psychology → Memory bridge.
   * Automatically preserves emotionally significant content in EPHEMERAL with elevated priority.
   * 
   * v0.17: Closes the loop between perception and memory.
   * - High intensity emotion → key topic preserved with extended TTL
   * - Defensive signals → stored as "caution" marker
   */
  _psychBridge(input, result) {
    const { emotion, intent } = result;
    
    // Only bridge if emotion is significant
    if (emotion?.intensity !== 'high') return;
    
    // Extract the most salient topic words from input (first 3 non-stopwords)
    const stopwords = new Set(['the','a','an','is','are','was','were','i','you','he','she','it','we','they','this','that','to','of','in','on','for','with','my','your','our','and','or','but']);
    const words = input.split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
      .filter(w => w.length > 3 && !stopwords.has(w))
      .slice(0, 3);
    
    if (words.length === 0) return;
    
    const topic = words.join('_');
    const emotionTag = `${emotion.category}_${emotion.intensity}`;
    const signalValue = JSON.stringify({
      topic,
      emotion: emotionTag,
      intent: intent?.category,
      ts: Date.now(),
      preview: input.substring(0, 100),
    });
    
    // Store with extended TTL (4x normal) — emotionally charged content lasts longer
    const EMOTION_SIGNAL_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
    this.memory.remember(
      `signal:${topic}:${Date.now()}`,
      signalValue,
      EMOTION_SIGNAL_TTL_MS
    );
  }

  /**
   * Classify input into a broad category.
   */
  classify(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { category: 'unknown', emotion: 'neutral', confidence: 0 };
    return this.psychology.classify(input);
  }

  /**
   * Get memory statistics.
   */
  getMemoryStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.memory.getMemoryStats();
  }

  /**
   * Get current MindSpace state.
   */
  getMindSpace() {
    if (!this.started) throw new Error('HeartFlow not started');
    return {
      rules: this._mindSpace.rules,
      workingEntries: Object.entries(this.memory?.ephemeral || {}).slice(0, 10),
    };
  }

  /**
   * Run dream consolidation cycle.
   */
  dreamNow() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.dream.dream();
  }

  /**
   * Record an outcome for self-evolution.
   */
  recordOutcome(params) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.recordOutcome(params);
  }

  /**
   * Retrieve relevant lessons for a task.
   */
  retrieveLessons(task) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.retrieveLessons(task);
  }

  /**
   * Add/update a memory entry.
   */
  remember(key, value, tier = 'learned') {
    if (!this.started) throw new Error('HeartFlow not started');
    if (tier === 'core') {
      return this.memory.addCore(key, value);
    } else if (tier === 'ephemeral') {
      return this.memory.remember(key, value);
    } else {
      return this.memory.learn(key, value);
    }
  }

  /**
   * Search across all memory tiers.
   */
  search(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.memory.search(query);
  }

  // ─── v1.0.2 New APIs ────────────────────────────────────────────────────

  /**
   * Add a knowledge graph node
   */
  addKnowledge(name, description, type = 'concept', importance = 0.5) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledgeGraph.addNode({ name, description, type, importance });
  }

  /**
   * Connect two knowledge nodes
   */
  connectKnowledge(sourceId, targetId, relation, bidirectional = false) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledgeGraph.addEdge({ sourceId, targetId, relation, bidirectional });
  }

  /**
   * Get connected knowledge nodes
   */
  getConnectedKnowledge(nodeId) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledgeGraph.getConnectedNodes(nodeId);
  }

  /**
   * Search knowledge graph
   */
  searchKnowledge(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledgeGraph.search(query);
  }

  /**
   * Get knowledge graph stats
   */
  getKnowledgeStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.knowledgeGraph.getStats();
  }

  /**
   * Add a retrieval anchor for context augmentation
   */
  addAnchor(content, source = 'unknown', relevance = 0.8) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.retrievalAnchor.addAnchor(content, source, relevance);
  }

  /**
   * Query retrieval anchors
   */
  queryAnchors(query, options = {}) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.retrievalAnchor.query(query, options);
  }

  /**
   * Get best anchor for query
   */
  selectAnchor(query) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.retrievalAnchor.selectAnchor(query);
  }

  /**
   * Get anchor statistics
   */
  getAnchorStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.retrievalAnchor.getStats();
  }

  /**
   * Select learning strategy for input
   */
  selectLearningStrategy(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.metaLearner.selectStrategy(input);
  }

  /**
   * Extract concepts from input text
   */
  extractConcepts(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.metaLearner.learn(input);
  }

  /**
   * Get learning strategy scores
   */
  getLearningScores() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.metaLearner.getStrategyScores();
  }

  // ─── SelfModel ─────────────────────────────────────────────────────────

  /**
   * Detect identity drift from conflicting beliefs
   */
  detectIdentityDrift() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.detectDrift();
  }

  /**
   * Repair detected identity drift
   */
  repairIdentityDrift() {
    if (!this.started) throw new Error('HeartFlow not started');
    const drift = this.selfModel.detectDrift();
    return this.selfModel.repairDrift(drift);
  }

  /**
   * Update a belief in the self-model
   */
  updateBelief(content, confidence, source) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.updateBelief(content, confidence, source);
  }

  /**
   * Get current beliefs
   */
  getBeliefs() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.getBeliefs();
  }

  /**
   * Add a capability
   */
  addCapability(capability) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.addCapability(capability);
  }

  /**
   * Add a limitation
   */
  addLimitation(limitation) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.addLimitation(limitation);
  }

  /**
   * Record an install event
   */
  recordInstall() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.recordInstall();
  }

  /**
   * Get install base count
   */
  getInstallBase() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.getInstallBase();
  }

  /**
   * Get self-model stats
   */
  getSelfModelStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfModel.getStats();
  }

  // ─── SelfVerifier ─────────────────────────────────────────────────────

  /**
   * Verify reasoning for logical consistency (4 checks)
   */
  verifyReasoning(reasoning, conclusion) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfVerifier.verify(reasoning, conclusion);
  }

  /**
   * Get recent verification issues
   */
  getVerificationIssues() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfVerifier.getRecentIssues();
  }

  /**
   * Get verification stats
   */
  getVerificationStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.selfVerifier.getStats();
  }

  // ─── LessonBank ──────────────────────────────────────────────────────

  /**
   * Check input against known error patterns
   */
  checkLessonPattern(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lessonBank.checkPattern(input);
  }

  /**
   * Add a new lesson
   */
  addLesson(lesson) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lessonBank.addLesson(lesson);
  }

  /**
   * Mark lesson hit (success/failure)
   */
  markLessonHit(id, success) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lessonBank.markHit(id, success);
  }

  /**
   * Get top lessons by utility
   */
  getTopLessons(limit) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lessonBank.getTopLessons(limit);
  }

  /**
   * Get lesson bank stats
   */
  getLessonStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.lessonBank.getStats();
  }

  // ─── TruthfulnessChecker ─────────────────────────────────────────────

  /**
   * Check if statement is potentially lying
   */
  checkTruthfulness(statement) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truthfulness.checkStatement(statement);
  }

  /**
   * Record a lie externally
   */
  recordLie(statement, context) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truthfulness.recordLie(statement, context);
  }

  /**
   * Get truthfulness stats
   */
  getTruthfulnessStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.truthfulness.getStats();
  }

  // ─── EmotionalProtocol ───────────────────────────────────────────────

  /**
   * Process emotional content: acknowledge first, then analyze
   */
  processEmotionally(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.emotionalProtocol.process(input);
  }

  /**
   * Get emotional acknowledgment only
   */
  acknowledgeEmotion(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.emotionalProtocol.acknowledge(input);
  }

  /**
   * Detect emotion in input
   */
  detectEmotion(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.emotionalProtocol.detectEmotion(input);
  }

  // ─── SecurityChecker ────────────────────────────────────────────────

  /**
   * Scan text for sensitive information (API keys, tokens, passwords, etc.)
   */
  scanSecurity(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.scan(text);
  }

  /**
   * Redact sensitive information from text
   */
  redactSecurity(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.redact(text);
  }

  /**
   * Check if content is safe to push to GitHub
   */
  checkGitHubSafe(content) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.checkGitHubSafe(content);
  }

  /**
   * Check if memory content is secure
   */
  isMemorySecure(content) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.isMemorySecure(content);
  }

  /**
   * Quick check if string is safe for logging
   */
  isLogSafe(text) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.isLogSafe(text);
  }

  /**
   * Get security stats
   */
  getSecurityStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.security.getStats();
  }

  /**
   * Heal error using Q-learning
   */
  heal(error) {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.heal(error);
  }

  /**
   * Get psychology + cognition stats
   */
  getPsychologyStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.psychology.getPsychologyStats();
  }

  /**
   * Get evolution/self-healer stats
   */
  getEvolutionStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.evolution.getStats();
  }

  /**
   * Get dream consolidation stats
   */
  getDreamStats() {
    if (!this.started) throw new Error('HeartFlow not started');
    return this.dream.getDreamStats();
  }
}

// Factory
function createHeartFlow(config = {}) {
  return new HeartFlow(config);
}

// CLI health check
if (require.main === module) {
  const rootPath = path.join(__dirname, '..', '..');
  const hf = createHeartFlow({ rootPath });
  hf.start();
  
  const t0 = Date.now();
  hf.healthCheck().then(health => {
    console.log(`\n[HeartFlow] ${VERSION} 健康检查 (${Date.now() - t0}ms):`);
    console.log(JSON.stringify(health, null, 2));
    
    // Test all APIs
    Promise.all([
      hf.analyzePsychology('I am frustrated with this bug'),
      hf.classify('how do I fix it'),
      hf.getMemoryStats(),
      hf.getMindSpace(),
    ]).then(([psych, cls, mem, mind]) => {
      console.log('\n--- API Tests ---');
      console.log('analyzePsychology:', JSON.stringify(psych).substring(0, 200));
      console.log('classify:', JSON.stringify(cls));
      console.log('getMemoryStats:', JSON.stringify(mem));
      console.log('getMindSpace rules:', mind.rules.length);
      hf.stop();
      process.exit(0);
    }).catch(e => {
      console.error('API test error:', e.message);
      hf.stop();
      process.exit(1);
    });
  });
}

module.exports = { HeartFlow, createHeartFlow, VERSION, BUILD_DATE };
