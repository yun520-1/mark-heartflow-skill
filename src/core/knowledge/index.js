/**
 * Knowledge subsystem stub — minimal loader to satisfy heartflow.js require path.
 * P2-T2-BRIDGE note: this only restores a missing file required by existing engine init.
 */
class KnowledgeSubsystem {
  constructor() {
    this.name = 'knowledge';
  }
  getStats() {
    return { loaded: false, reason: 'stub' };
  }
}
module.exports = { KnowledgeSubsystem };
