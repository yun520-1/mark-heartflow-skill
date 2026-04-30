const { LogicCoreProgram } = require('./logic-core-program');
const { TrialityMemory } = require('./memory/triality-memory');
const { SelfHealing } = require('./self-healing');
const { StabilityGuard } = require('./stability-guard');
const { IdentityAnchor, MemoryStream, ReflectionEngine } = require('./identity-engine');

class HeartFlowCore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.logic = new LogicCoreProgram(projectRoot);
    this.memory = new TrialityMemory(projectRoot);
    this.selfHealing = new SelfHealing();
    this.stabilityGuard = new StabilityGuard();
    this.identity = new IdentityAnchor();
    this.memoryStream = new MemoryStream();
    this.reflection = new ReflectionEngine();
    this.state = {
      lastSession: null,
      lastAnalysis: null,
      lastGuard: null,
      lastRecovery: null,
      history: []
    };
  }

  process(conversation, meta = {}) {
    const capture = this.logic.captureSession(conversation, {
      subject: meta.subject || 'session',
      summary: meta.summary || ''
    });
    const analysis = capture.result;
    const guard = this.stabilityGuard.gate({
      confidence: analysis.confidence,
      noiseRatio: analysis.uncertainty,
      actionability: analysis.actionability
    });
    const recovery = guard.allow ? { next_step: 'continue', hints: [] } : this.selfHealing.recover({
      ok: false,
      type: 'stability_guard',
      message: guard.summary,
      attempt: 0
    });

    const sessionRecord = {
      time: Date.now(),
      sessionId: capture.sessionId,
      memoryId: capture.memoryId,
      analysis,
      guard,
      recovery,
      identity: this.identity.declare()
    };
    this.state.lastSession = capture;
    this.state.lastAnalysis = analysis;
    this.state.lastGuard = guard;
    this.state.lastRecovery = recovery;
    this.state.history.push(sessionRecord);
    if (this.state.history.length > 50) this.state.history = this.state.history.slice(-50);
    return sessionRecord;
  }

  getCoreReport() {
    return {
      identity: this.identity.declare(),
      lastAnalysis: this.state.lastAnalysis,
      lastGuard: this.state.lastGuard,
      lastRecovery: this.state.lastRecovery,
      memory: {
        layers: this.memory.getLayerStats(),
        sessions: this.logic.getCore().historySize
      },
      historySize: this.state.history.length
    };
  }
}

module.exports = { HeartFlowCore };
