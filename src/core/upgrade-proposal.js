/**
 * HeartFlow Upgrade Proposal Engine v1.2.8
 * Safe incremental upgrade module.
 *
 * Goals:
 * - capture a lightweight environment snapshot
 * - generate a prioritized upgrade proposal
 * - keep the core engine untouched
 * 
 * 吸收来源: self-improving-agent v1.0.2
 * 吸收时间: 2026-05-30
 */

const os = require('os');

/**
 * 捕获环境快照
 * @returns {Object} 环境信息
 */
function captureEnvironmentSnapshot() {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    hour: now.getHours(),
    platform: process.platform,
    node: process.version,
    cpuCount: os.cpus().length,
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
  };
}

/**
 * 排名升级目标
 * @returns {Array} 优先级的升级目标列表
 */
function rankUpgradeTargets() {
  return [
    {
      target: 'auto-compaction-engine',
      reason: '新增上下文窗口压缩，防止token溢出',
      priority: 1,
    },
    {
      target: 'self-verification',
      reason: '减少升级期间的静默回归',
      priority: 2,
    },
    {
      target: 'decision-execution-loop',
      reason: '闭合决策、执行和反馈之间的差距',
      priority: 3,
    },
  ];
}

/**
 * 构建升级建议
 * @returns {Object} 完整的升级建议
 */
function buildUpgradeProposal() {
  const env = captureEnvironmentSnapshot();
  const targets = rankUpgradeTargets();
  return {
    version: '1.2.8',
    env,
    targets,
    summary: 'Safe incremental upgrade: preserve current core, add auto-compaction for context management.',
  };
}

module.exports = {
  captureEnvironmentSnapshot,
  rankUpgradeTargets,
  buildUpgradeProposal,
};
