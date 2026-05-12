/**
 * HEARTCORE / self-check.js
 * 启动自检：验证核心文件存在 + 版本一致 + 身份锚点稳固
 * 执古御今 → 先验证根基，再执行任务
 *
 * v11.34.1 新增：
 * - evolutionTrigger() 自我进化触发检查（来自 workbuddy v11.24）
 * - EthicsSafety 心理危机检测
 * - Truthfulness 汇报真实性验证
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * 自我进化触发器（基于 Self-Evolving Agents arXiv:2507.21046 WHEN机制）
 * 监控是否满足进化条件：错误率上升 / 新任务类型 / 负面反馈
 */
function evolutionTrigger(context = {}) {
  const triggers = [];
  if (context.errorRate !== undefined && context.errorRate > 0.2) {
    triggers.push(`错误率过高: ${(context.errorRate * 100).toFixed(1)}% > 20%`);
  }
  if (context.isNewTaskType === true) {
    triggers.push('检测到新任务类型，现有技能库未覆盖');
  }
  if (context.feedbackScore !== undefined && context.feedbackScore < 0.4) {
    triggers.push(`用户反馈评分过低: ${context.feedbackScore.toFixed(2)} < 0.4`);
  }
  const shouldEvolve = triggers.length > 0;
  return {
    shouldEvolve,
    reason: shouldEvolve ? triggers.join('; ') : '无需进化，当前状态稳定',
    triggersCount: triggers.length
  };
}

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
  },
  {
    id: 'truthfulness',
    label: 'truthfulness-protocol.js',
    path: path.join(ROOT, 'src/core/truthfulness-protocol.js'),
    verify: (c) => c.includes('session_search') && c.includes('verifyBeforeClaim')
  },
  {
    id: 'ethics',
    label: 'EthicsSafety.js',
    path: path.join(ROOT, 'src/core/EthicsSafety.js'),
    verify: (c) => c.includes('detectNegativeEmotion') && c.includes('crisisResources')
  },
  {
    id: 'modular-memory-router',
    label: 'modular-memory-router.js',
    path: path.join(ROOT, 'src/core/modular-memory-router.js'),
    verify: (c) => c.includes('ModularMemoryRouter') && c.includes('AccessPatternTracker')
  },
  {
    id: 'unified-memory-api',
    label: 'unified-memory-api.js',
    path: path.join(ROOT, 'src/core/unified-memory-api.js'),
    verify: (c) => c.includes('UnifiedMemoryAPI') && c.includes('search')
  },
  {
    id: 'memory-action-bridge',
    label: 'memory-action-bridge.js',
    path: path.join(ROOT, 'src/core/memory-action-bridge.js'),
    verify: (c) => c.includes('MemoryActionBridge') && c.includes('beforeExecute')
  },
  {
    id: 'executable-rule-engine',
    label: 'executable-rule-engine.js',
    path: path.join(ROOT, 'src/core/executable-rule-engine.js'),
    verify: (c) => c.includes('ExecutableRuleEngine') && c.includes('check')
  },
  {
    id: 'executable-rules',
    label: 'executable-rules.json',
    path: path.join(ROOT, 'data/executable-rules.json'),
    verify: (c) => c.includes('RULE-001') && c.includes('RULE-005')
  },
  {
    id: 'superlocal-memory',
    label: 'superlocal-memory.js',
    path: path.join(ROOT, 'src/core/superlocal-memory.js'),
    verify: (c) => c.includes('FRQAD') && c.includes('MultiChannelRetrieval') && c.includes('EbbinghausAdaptiveForgetting')
  },
  {
    id: 'skill-ecosystem',
    label: 'skill-ecosystem.js',
    path: path.join(ROOT, 'src/core/skill-ecosystem.js'),
    verify: (c) => c.includes('SkillEcosystemBridge') && c.includes('SkillGuardRobust') && c.includes('MESASMetacognitiveGate')
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

module.exports = { selfCheck, CHECKS, runCheck, evolutionTrigger };
