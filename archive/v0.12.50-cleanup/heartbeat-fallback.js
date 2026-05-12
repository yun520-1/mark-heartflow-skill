class HeartbeatFallback {
  constructor({ interval = 5000, maxMissed = 2 } = {}) {
    this.interval = interval;
    this.maxMissed = maxMissed;
    this.lastBeat = Date.now();
    this.degraded = false;
  }
  beat() { this.lastBeat = Date.now(); this.degraded = false; }
  check() {
    const missed = Date.now() - this.lastBeat > this.interval * this.maxMissed;
    this.degraded = missed;
    return { degraded: this.degraded, missed, interval: this.interval, maxMissed: this.maxMissed };
  }
}
module.exports = { HeartbeatFallback };
