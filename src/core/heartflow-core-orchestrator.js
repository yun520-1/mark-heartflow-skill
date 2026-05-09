const fs = require('fs');
const path = require('path');
const { CoreIdentityEngine } = require('./identity-engine');
const { TrialityMemory } = require('./memory/triality-memory');
const { SelfHealing } = require('./self-healing');
const { StabilityGuard } = require('./stability-guard');
const { CoreResultEngine } = require('./core-result-engine');
const { LogicCoreProgram } = require('./logic-core-program');

class HeartFlowCoreOrchestrator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.identityEngine = new CoreIdentityEngine(projectRoot);
    this.trialityMemory = new TrialityMemory(projectRoot);
    this.selfHealing = new SelfHealing();
    this.stabilityGuard = new StabilityGuard();
    this.resultEngine = new CoreResultEngine(projectRoot);
    this.logicCore = new LogicCoreProgram(projectRoot);
    this.stateFile = path.join(projectRoot, 'internal', 'data', 'core-orchestrator-state.json');
    this.history = [];
  }

  interpret(input, context = {}) {
    const text = String(input || '');
    const result = this.resultEngine.makeDecision(text);
    const logic = this.logicCore.analyze({ text, subject: context.subject || 'input', time: Date.now() });
    const reflection = this.resultEngine.reflectToCore(text);
    const memoryResult = this.trialityMemory.store({
      content: text,
      summary: text.slice(0, 160),
      layer: result.accepted ? 'semantic' : 'episodic',
      metadata: { durable: true, subject: context.subject || 'input', confidence: result.confidence },
      importance: Math.max(10, Math.min(20, Math.round(result.confidence * 20)))
    });
    const alignment = this.identityEngine.identity.checkAlignment
      ? this.identityEngine.identity.checkAlignment(text, context)
      : { aligned: true, reason: 'ok', directive: null };
    const guard = this.stabilityGuard.gate({
      confidence: Math.max(result.confidence, logic.confidence),
      noiseRatio: context.noiseRatio ?? 0.1,
      actionability: context.actionability ?? 0.5
    });
    const recovery = guard.allow ? null : this.selfHealing.recover({
      ok: false,
      type: 'stability_gate',
      message: guard.summary,
      attempt: context.attempt || 0
    });
    const record = {
      time: Date.now(),
      input: text,
      result,
      logic,
      reflection,
      guard,
      recovery,
      memoryId: memoryResult.id,
      alignment
    };
    this.history.push(record);
    if (this.history.length > 200) this.history = this.history.slice(-200);
    this.saveState();
    return record;
  }

  captureDialogue(lines, context = {}) {
    const normalized = Array.isArray(lines) ? lines.join('\n') : String(lines || '');
    return this.interpret(normalized, { ...context, subject: context.subject || 'dialogue' });
  }

  saveState() {
    const dir = path.dirname(this.stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.stateFile, JSON.stringify({ history: this.history.slice(-50) }, null, 2));
  }

  getStats() {
    return {
      historySize: this.history.length,
      identity: this.identityEngine.getStats(),
      memory: this.trialityMemory.getLayerStats(),
      result: this.resultEngine.getSummary(),
      logic: this.logicCore.getCore()
    };
  }
}

module.exports = { HeartFlowCoreOrchestrator };
