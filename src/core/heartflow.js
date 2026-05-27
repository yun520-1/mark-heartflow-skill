/**
 * HeartFlow — AI Psychological Perception System v0.16.2
 * 
 * A minimal, production-ready AI psychology engine for agents.
 * 
 * Architecture:
 *   MeaningfulMemory  ←  Three-tier memory (CORE/LEARNED/EPHEMERAL)
 *   PsychologyEngine ←  Intent/emotion/needs/defenses perception
 *   SelfEvolution   ←  Reflexion-style self-improvement
 *   DreamEngine     ←  Sleep consolidation
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

// Version
const VERSION = 'v0.16.2';
const BUILD_DATE = '2026-05-28';

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
   */
  analyzePsychology(input) {
    if (!this.started) throw new Error('HeartFlow not started');
    if (!input) return { intent: null, emotion: null, needs: [], defenses: [], confidence: 0 };
    return this.psychology.analyzePsychology(input);
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
