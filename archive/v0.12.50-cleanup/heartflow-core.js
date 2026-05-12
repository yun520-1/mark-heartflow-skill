const { LogicCoreProgram } = require('./logic-core-program');
const { TrialityMemory } = require('./memory/triality-memory');
const { SelfHealing } = require('./self-healing');
const { StabilityGuard } = require('./stability-guard');
const { IdentityAnchor, MemoryStream, ReflectionEngine } = require('./identity-engine');
const { HeartFlowCoreOrchestrator } = require('./heartflow-core-orchestrator');
const { CoreResultEngine } = require('./core-result-engine');
const { HeartFlowUpgradeSyncGuard } = require('./heartflow-upgrade-sync-guard');

class HeartFlowCore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.logic = new LogicCoreProgram(projectRoot);
    this.memory = new TrialityMemory(projectRoot);
    this.selfHealing = new SelfHealing();
    this.stabilityGuard = new StabilityGuard();
    this.identity = new IdentityAnchor();
    this.memoryStream = new MemoryStream();
    this.reflection = new ReflectionEngine(this.memoryStream, this.identity);
    this.orchestrator = new HeartFlowCoreOrchestrator(projectRoot);
    this.resultEngine = new CoreResultEngine(projectRoot);
    this.upgradeSyncGuard = new HeartFlowUpgradeSyncGuard();
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
    const orchestrated = this.orchestrator.interpret(Array.isArray(conversation) ? conversation.join('\n') : String(conversation || ''), meta);
    const result = this.resultEngine.makeDecision(Array.isArray(conversation) ? conversation.join('\n') : String(conversation || ''));

    const sessionRecord = {
      time: Date.now(),
      sessionId: capture.sessionId,
      memoryId: capture.memoryId,
      analysis,
      guard,
      recovery,
      result,
      orchestrated,
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

  planUpgradeSync(context = {}) {
    return this.upgradeSyncGuard.plan(context);
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
      orchestrator: this.orchestrator.getStats(),
      historySize: this.state.history.length
    };
  }
}

module.exports = { HeartFlowCore };
