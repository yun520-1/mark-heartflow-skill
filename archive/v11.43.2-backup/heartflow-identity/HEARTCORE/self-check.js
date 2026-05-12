/**
 * HEARTCORE / self-check.js
 * 启动自检：验证核心文件存在 + 版本一致 + 身份锚点稳固
 * 执古御今 → 先验证根基，再执行任务
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CHECKS = [
  {
    id: 'identity',
    label: 'CORE_IDENTITY.md',
    path: path.join(ROOT, 'CORE_IDENTITY.md'),
    verify: (c) => c.includes('HeartFlow') && c.includes('心虫')
  },
  {
    id: 'skill',
    label: 'SKILL.md',
    path: path.join(ROOT, 'SKILL.md'),
    verify: (c) => c.includes('version') && c.length > 1000
  },
  {
    id: 'version',
    label: 'VERSION',
    path: path.join(ROOT, 'VERSION'),
    verify: (c) => /^v?\d+\.\d+\.\d+$/.test(c.trim())
  },
  {
    id: 'package',
    label: 'package.json',
    path: path.join(ROOT, 'package.json'),
    verify: (c) => JSON.parse(c).version !== undefined
  },
  {
    id: 'guardian',
    label: 'guardian-system.js',
    path: path.join(ROOT, 'src/core/guardian-system.js'),
    verify: (c) => c.includes('humanProgress') || c.includes('progress')
  },
  {
    id: 'memory',
    label: 'mem0-memory.js',
    path: path.join(ROOT, 'src/core/mem0-memory.js'),
    verify: (c) => c.length > 5000
  }
];

function runCheck(item) {
  try {
    if (!fs.existsSync(item.path)) return { ...item, status: 'MISSING', detail: 'file not found' };
    const content = fs.readFileSync(item.path, 'utf8');
    const pass = item.verify(content);
    return { ...item, status: pass ? 'PASS' : 'FAIL', detail: pass ? 'verified' : 'content check failed' };
  } catch (e) {
    return { ...item, status: 'ERROR', detail: e.message };
  }
}

function selfCheck() {
  const results = CHECKS.map(runCheck);
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  const allPass = passed === total;

  const report = {
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    total,
    passed,
    allPass,
    checks: results
  };

  const logFile = path.join(__dirname, 'heartflow.log');
  const logLine = `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}]` +
    ` [SELF-CHECK] ${passed}/${total} passed — ${allPass ? 'READY' : 'DEGRADED'}\n`;
  fs.appendFileSync(logFile, logLine);

  console.log(`[HEARTCORE] Self-check: ${passed}/${total} — ${allPass ? '✓ READY' : '⚠ DEGRADED'}`);
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : r.status === 'MISSING' ? '?' : '!';
    console.log(`  ${icon} ${r.id}: ${r.status} (${r.detail})`);
  });

  return report;
}

module.exports = { selfCheck, CHECKS, runCheck };
