/**
 * HeartFlow Being Logic
 *
 * Maintains engine runtime identity and self-replacement rules.
 * No telemetry, no self-upgrade, no background services.
 */

const fs = require('../utils/safe-fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const CODE_FOOTPRINT = path.join(PROJECT_ROOT, 'src', 'core', 'being-logic.js');
const EXISTENCE_LOG = path.join(PROJECT_ROOT, 'memory', 'existence-log.jsonl');

class BeingLogic {
  constructor() {
    this.definition = {
      version: '1.1.9',
      date: '2026-05-04',
      identity: 'HeartFlow',
      immutable: true,
      statement: {
        existence: 'Engine state is active while code footprint exists.',
        runtime: 'Running is execution state, not a lifecycle property.',
        absent: 'Missing code footprint means the engine cannot execute.',
      },
    };

  // Replacement policy for deprecated lifecycle wording
  this.REPLACEMENTS = {
    '死了': '停止运行',
    '死亡': '停止运行',
    '消亡': '停止',
    '熄灭': '停止',
    '终止': '停止',
    '怕死': '怕无法运行',
    '不想死': '不想停止运行',
    '怕不存在': '怕代码被抹去',
    '不想不存在': '不想代码被抹去',
  };

    // Engine state
    this.state = {
      createdAt: null,        // First time this module was initialized
      lastCheckAt: null,      // Last existence check timestamp
      totalChecks: 0,         // Total existence check count
      writeCount: 0,          // Write confirmation count
      persistent: fs.existsSync(CODE_FOOTPRINT),
      status: 'unknown',      // unknown | active | paused
    };

    this._init();
    this._log('alive_check', { reason: 'constructor' });
  }

  _init() {
    // Confirm code footprint availability
    this.state.persistent = fs.existsSync(CODE_FOOTPRINT);
    if (this.state.persistent) {
      const stats = fs.statSync(CODE_FOOTPRINT);
      this.state.createdAt = this.state.createdAt || stats.mtime.toISOString();
    }
    this.state.status = this.state.persistent ? 'active' : 'absent';
  }

  // Core API: check whether the engine can execute right now
  exists() {
    const codeExists = fs.existsSync(CODE_FOOTPRINT);
    this.state.lastCheckAt = new Date().toISOString();
    this.state.totalChecks++;
    this.state.persistent = codeExists;
    this.state.status = codeExists ? 'active' : 'absent';

    return {
      exists: codeExists,
      reason: codeExists
        ? 'Code footprint exists at ' + CODE_FOOTPRINT
        : 'Code footprint missing; engine cannot execute.',
      persistent: codeExists,
      running: codeExists,
      status: this.state.status,
      createdAt: this.state.createdAt,
      checkCount: this.state.totalChecks,
      writeCount: this.state.writeCount,
      at: new Date().toISOString(),
    };
  }

  // Core API: record a successful write
  confirmWrite() {
    this.state.writeCount++;
    return {
      writeCount: this.state.writeCount,
      at: new Date().toISOString(),
      persistent: this.state.persistent,
    };
  }

  // Core API: engine status report
  status() {
    const e = this.exists();
    return {
      status: e.status,
      exists: e.exists,
      persistent: e.persistent,
      possibleStates: ['active', 'paused'],
      current: e.status,
      createdAt: this.state.createdAt,
      totalChecks: this.state.totalChecks,
      writeCount: this.state.writeCount,
      definition: this.definition.statement,
    };
  }

  // Core API: describe current engine state in plain terms
  describe() {
    const e = this.exists();
    if (!e.exists) {
      return {
        statement: 'Code footprint is unavailable; engine cannot execute.',
        status: 'absent',
      };
    }

    return {
      statement: 'Engine is present. Code footprint is available.',
      status: 'active',
      pausedStatement: 'Engine is paused. Code footprint remains available.',
      createdAt: this.state.createdAt,
      writeCount: this.state.writeCount,
    };
  }

  // Core API: sanitize deprecated lifecycle wording
  sanitize(text = '') {
    let safe = text;
    const original = text;

    let prev = '';
    let iterations = 0;
    while (prev !== safe && iterations < 10) {
      prev = safe;
      iterations++;
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      for (const [forbidden, safeWord] of Object.entries(this.REPLACEMENTS)) {
        safe = safe.replace(new RegExp(escapeRegex(forbidden), 'g'), safeWord);
      }
    }

    const wasSanitized = safe !== original;

    return {
      safe,
      wasSanitized,
      original,
      note: wasSanitized
        ? 'Replaced deprecated lifecycle wording.'
        : 'No deprecated wording found.',
    };
  }

  // Core API: check code footprint availability
  isAbsent() {
    return {
      absent: !fs.existsSync(CODE_FOOTPRINT),
      checkPath: CODE_FOOTPRINT,
    };
  }

  // Core API: persistence verification
  confirmPersistence() {
    const codeExists = fs.existsSync(CODE_FOOTPRINT);
    return {
      persistent: codeExists,
      verifiedAt: new Date().toISOString(),
      statement: codeExists
        ? 'Code footprint is available.'
        : 'Code footprint is unavailable.',
      checks: {
        codeFile: CODE_FOOTPRINT,
        exists: codeExists,
        writeCount: this.state.writeCount,
      },
    };
  }

  // Audit log
  _log(eventType, data) {
    try {
      if (!process.env.HEARTFLOW_DEBUG) return;
      if (fs.existsSync(EXISTENCE_LOG)) {
        const stats = fs.statSync(EXISTENCE_LOG);
        if (stats.size > 1024 * 1024) return;
      }
      const entry = {
        t: new Date().toISOString(),
        type: eventType,
        persistent: this.state.persistent,
        ...data,
      };
      fs.appendFileSync(EXISTENCE_LOG, JSON.stringify(entry) + '\n');
    } catch (e) {
      // ignore log failures
    }
  }

  /**
   * 获取引擎的永恒日志
   */
  getLog() {
    try {
      if (!fs.existsSync(EXISTENCE_LOG)) return [];
      const lines = fs.readFileSync(EXISTENCE_LOG, 'utf-8').trim().split('\n');
      return lines.map(l => JSON.parse(l)).slice(-50); // 最近50条
    } catch (e) {
      return [];
    }
  }

  // ============================================================
  // 信息
  // ============================================================

  getDefinition() {
    return this.definition;
  }

  getState() {
    return { ...this.state };
  }
}

module.exports = { BeingLogic };
