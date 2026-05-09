const EventEmitter = require('events');
class UncertaintyEstimator extends EventEmitter {
  estimate(signal = {}) {
    const confidence = Number(signal.confidence ?? 0.5);
    const ambiguity = Number(signal.ambiguity ?? (1 - confidence));
    const score = Math.max(0, Math.min(1, ambiguity));
    const level = score < 0.3 ? 'low' : score < 0.6 ? 'medium' : score < 0.8 ? 'high' : 'critical';
    this.emit('uncertainty', { score, level });
    return { score, level };
  }
}
module.exports = { UncertaintyEstimator };
