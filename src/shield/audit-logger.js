/**
 * AuditLogger — 决策审计日志引擎 v1.0.0
 *
 * 记录每次 gate 决策的完整证据链，支持事后合规审查。
 * 关键设计：记录"什么被拒绝过"（negative space），不是只记"什么执行了"
 *
 * 集成: require('./audit-logger.js')
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), 'data', 'audit');
    this.maxEntries = options.maxEntries || 10000;
    this.entries = [];
    this._init();
  }

  _init() {
    try {
      if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
    } catch (e) { /* dir init silent */ }
  }

  /**
   * 记录授权决策
   * @param {string} actionType - granted|denied|escalated|conditional
   * @param {Object} decision - 决策详情
   */
  record(actionType, decision) {
    const entry = {
      id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      ts: Date.now(),
      actionType,
      decision: {
        action: decision.action,
        riskScore: decision.risk_score || decision.riskScore || 0,
        reason: decision.reason || '',
        tool: decision.tool || '',
        agent: decision.agent || 'unknown',
        sessionId: decision.sessionId || '',
        conditions: decision.conditions || [],
        provenance: decision.provenance || [],
      },
      snapshot: {
        contextHash: crypto.createHash('sha256').update(JSON.stringify({
          tool: decision.tool, reason: decision.reason, riskScore: decision.risk_score
        })).digest('hex').slice(0, 12),
      },
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.shift();

    // 落盘
    this._persist(entry);
    return entry.id;
  }

  /** 记录被拒绝的操作（negative space） */
  recordDenied(decision) {
    return this.record('denied', decision);
  }

  /** 记录被授权的操作 */
  recordGranted(decision) {
    return this.record('granted', decision);
  }

  /** 获取审计报告 */
  getReport(options = {}) {
    const entries = options.lastN ? this.entries.slice(-options.lastN) : this.entries;
    const denied = entries.filter(e => e.actionType === 'denied');
    const granted = entries.filter(e => e.actionType === 'granted');

    return {
      totalEntries: this.entries.length,
      granted: granted.length,
      denied: denied.length,
      escalated: entries.filter(e => e.actionType === 'escalated').length,
      conditional: entries.filter(e => e.actionType === 'conditional').length,
      recentDenied: denied.slice(-5).map(e => ({
        reason: e.decision.reason,
        tool: e.decision.tool,
        agent: e.decision.agent,
        ts: e.ts,
      })),
      recentGranted: granted.slice(-5).map(e => ({
        reason: e.decision.reason,
        tool: e.decision.tool,
        ts: e.ts,
      })),
    };
  }

  _persist(entry) {
    try {
      const logFile = path.join(this.logDir, `audit-${new Date().toISOString().slice(0, 10)}.jsonl`);
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    } catch (e) { /* persist silent */ }
  }

  reset() {
    this.entries = [];
  }
}

module.exports = { AuditLogger };
