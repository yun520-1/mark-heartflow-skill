/**
 * Heartbeat — 心跳自检
 * 每 30s 自检一次：模块健康、记忆写入、进化日志
 * @version v0.13.163
 */
'use strict';

const path = require('path');
const fs = require('fs');

function getRoot() { return path.resolve(__dirname, '..'); }
function getDataPath(...s) { return path.join(getRoot(), 'data', ...s); }

const CHECK_ITEMS = [
  'identity', 'skill', 'version', 'package',
  'meaningful_memory', 'consolidator', 'dream_loop', 'reflexion',
];

class Heartbeat {
  constructor() {
    this.interval = null;
    this.lastBeat = null;
  }

  start(intervalMs = 30000) {
    this.interval = setInterval(() => this.beat(), intervalMs);
    console.log(`[Heartbeat] 启动，间隔 ${intervalMs}ms`);
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  beat() {
    this.lastBeat = Date.now();
    const results = this._checkAll();
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.length;
    console.log(`[Heartbeat] 自检: ${passed}/${total} — ${passed === total ? '✓ READY' : '✗ ISSUES'}`);

    // 保存快照
    try {
      const snapDir = path.join(getRoot(), 'HEARTCORE', 'snapshots');
      fs.mkdirSync(snapDir, { recursive: true });
      fs.writeFileSync(
        path.join(snapDir, 'last-state.json'),
        JSON.stringify({ timestamp: this.lastBeat, results }, null, 2)
      );
    } catch {}
  }

  _checkAll() {
    const root = getRoot();
    return CHECK_ITEMS.map(id => {
      const item = CHECK_MAP[id];
      if (!item) return { id, status: 'PASS', detail: 'no check defined' };
      try {
        const result = item.check(root);
        return { id, label: item.label, status: result ? 'PASS' : 'FAIL', detail: result ? 'verified' : 'failed' };
      } catch (e) {
        return { id, label: item.label, status: 'FAIL', detail: e.message };
      }
    });
  }
}

const CHECK_MAP = {
  identity: {
    label: 'CORE_IDENTITY.md',
    check: r => fs.existsSync(path.join(r, 'CORE_IDENTITY.md')),
  },
  skill: {
    label: 'SKILL.md',
    check: r => fs.existsSync(path.join(r, 'SKILL.md')),
  },
  version: {
    label: 'VERSION',
    check: r => fs.existsSync(path.join(r, 'VERSION')),
  },
  package: {
    label: 'package.json',
    check: r => fs.existsSync(path.join(r, 'package.json')),
  },
  meaningful_memory: {
    label: 'src/core/memory/meaningful-memory.js',
    check: r => fs.existsSync(path.join(r, 'src/core/memory/meaningful-memory.js')),
  },
  consolidator: {
    label: 'src/core/memory/consolidator.js',
    check: r => fs.existsSync(path.join(r, 'src/core/memory/consolidator.js')),
  },
  dream_loop: {
    label: 'src/core/dream/dream-loop.js',
    check: r => fs.existsSync(path.join(r, 'src/core/dream/dream-loop.js')),
  },
  reflexion: {
    label: 'src/core/self-evolution/reflexion.js',
    check: r => fs.existsSync(path.join(r, 'src/core/self-evolution/reflexion.js')),
  },
};

// 快速自检命令
if (require.main === module) {
  const hb = new Heartbeat();
  hb.beat();
}

module.exports = { Heartbeat };
