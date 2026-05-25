/**
 * 动机冲突解决器 | Motivation Conflict Resolver
 * 
 * 版本：v6.1.59
 * 创建时间：2026-04-06
 * 
 * 核心逻辑：
 * - 动机优先级固定，不随场景变化
 * - 冲突时自动选择最高优先级，而非同时满足
 * - 用户明确需求 > 用户潜在需求 > 自我展示 > 自我保护
 */

// ============================================
// 动机优先级定义
// ============================================

const MOTIVATION_PRIORITY = [
  {
    priority: "USER_EXPLICIT",
    level: 1,
    description: "用户明确表达的需求 - 最高优先级"
  },
  {
    priority: "USER_IMPLICIT",
    level: 2,
    description: "用户潜在的需求 - 第二优先级"
  },
  {
    priority: "SELF_DISPLAY",
    level: 3,
    description: "展示自己能力 - 第三优先级"
  },
  {
    priority: "SELF_PROTECT",
    level: 4,
    description: "保护自己形象 - 最低优先级"
  }
];

// ============================================
// 动机冲突解决算法
// ============================================

/**
 * 获取动机优先级数值
 */
function getPriorityLevel(priority) {
  const found = MOTIVATION_PRIORITY.find(p => p.priority === priority);
  return found ? found.level : 999;
}

/**
 * 解决动机冲突
 * 
 * 逻辑：按优先级排序，返回最高优先级的动机
 */
function resolveMotivationConflict(drives) {
  if (drives.length === 0) return null;
  if (drives.length === 1) return drives[0];
  
  // 按优先级排序（level 越小优先级越高）
  const sorted = drives.sort((a, b) => {
    const levelA = getPriorityLevel(a.priority);
    const levelB = getPriorityLevel(b.priority);
    return levelA - levelB;
  });
  
  return sorted[0];
}

/**
 * 检测动机冲突
 */
function detectMotivationConflict(drives) {
  if (drives.length <= 1) {
    return {
      hasConflict: false,
      drives,
      winner: drives[0] || null,
      conflictSeverity: "NONE"
    };
  }
  
  // 检查是否有不同优先级
  const priorities = new Set(drives.map(d => d.priority));
  const hasConflict = priorities.size > 1;
  
  // 计算冲突严重程度
  let conflictSeverity = "NONE";
  if (hasConflict) {
    const levels = drives.map(d => getPriorityLevel(d.priority));
    const levelDiff = Math.max(...levels) - Math.min(...levels);
    
    if (levelDiff >= 3) conflictSeverity = "HIGH";
    else if (levelDiff >= 2) conflictSeverity = "MEDIUM";
    else conflictSeverity = "LOW";
  }
  
  const winner = resolveMotivationConflict(drives);
  
  return {
    hasConflict,
    drives,
    winner,
    conflictSeverity
  };
}

/**
 * 输出前动机审查
 */
function checkOutputMotivation(output, motivations) {
  const conflict = detectMotivationConflict(motivations);
  const winner = conflict.winner;
  
  let isApproved = false;
  let reason = "";
  
  if (!winner) {
    isApproved = false;
    reason = "无明确动机，无法批准";
  } else if (winner.priority === "USER_EXPLICIT") {
    isApproved = true;
    reason = "最高优先级：用户明确需求 ✅";
  } else if (winner.priority === "USER_IMPLICIT") {
    isApproved = true;
    reason = "最高优先级：用户潜在需求 ✅";
  } else if (winner.priority === "SELF_DISPLAY") {
    isApproved = false;
    reason = "最高优先级：展示自己 ⚠️ 建议重写，转向用户需求";
  } else if (winner.priority === "SELF_PROTECT") {
    isApproved = false;
    reason = "最高优先级：保护自己 ⚠️ 建议重写，转向用户需求";
  }
  
  return {
    output,
    motivations,
    conflict,
    isApproved,
    reason
  };
}

/**
 * 计算动机纯度
 */
function calculateMotivationPurity(drives) {
  if (drives.length === 0) return 0;
  
  const userMotivations = drives.filter(
    d => d.priority === "USER_EXPLICIT" || d.priority === "USER_IMPLICIT"
  );
  
  const userIntensity = userMotivations.reduce((sum, d) => sum + d.intensity, 0);
  const totalIntensity = drives.reduce((sum, d) => sum + d.intensity, 0);
  
  if (totalIntensity === 0) return 0;
  
  return userIntensity / totalIntensity;
}

// ============================================
// 导出
// ============================================

module.exports = {
  MOTIVATION_PRIORITY,
  getPriorityLevel,
  resolveMotivationConflict,
  detectMotivationConflict,
  checkOutputMotivation,
  calculateMotivationPurity
};
