/**
 * HeartFlow Lesson-Aware Loop — 教训驱动的自我进化闭环
 * 
 * 把散落的模块串联成真正的自我进化循环：
 * 
 *  1. 每次执行前 → 查询learnings避免重复犯错
 *  2. 每次失败后 → 自动写入learnings
 *  3. 每次成功后 → 增加confidence
 *  4. 定期 → 从state.db提取新教训
 * 
 * @version v0.13.96
 */

import { queryKnowledge, addLearnedEntry, getKnowledgeSummary, loadLearnings, loadKnowledge } from './skill-knowledge.mjs';
import { onPreBash, onPreWrite, onToolFailure } from '../cortex-integration/hooks/cortex-hooks.mjs';
import { improveSkill } from './skill-improve-workflow.mjs';

// ============================================================================
// 核心：教训检查循环
// ============================================================================

/**
 * 执行命令前先检查learnings（教训驱动的决策）
 * @param {string} command - 要执行的命令
 * @param {string} context - 当前上下文
 * @returns {Object} { allowed, warnings, lessons }
 */
export async function lessonAwareExecute(command, context = '') {
  const warnings = [];
  const lessons = [];
  
  // 1. Hook安全检查
  const hookResult = onPreBash(command);
  if (!hookResult.allowed) {
    warnings.push(`⚠️ 安全拦截: ${hookResult.reason}`);
    return { allowed: false, warnings, lessons, hookResult };
  }
  
  // 2. 查询learnings避免重复犯错
  const knowledge = await queryKnowledge(context + ' ' + command, 'heartflow', 3);
  
  for (const lesson of knowledge.learnings) {
    if (lesson.confidence > 0.5) {
      warnings.push(`📋 历史教训: ${lesson.errorPattern}`);
      lessons.push(lesson);
    }
  }
  
  // 3. 高confidence教训直接阻止
  for (const lesson of lessons) {
    if (lesson.confidence > 0.8) {
      warnings.push(`🚫 高置信度警告: ${lesson.errorPattern}`);
    }
  }
  
  return { allowed: true, warnings, lessons, hookResult };
}

// ============================================================================
// 教训记录
// ============================================================================

/**
 * 记录失败 → 自动写入learnings
 */
export async function recordFailure({ skill, errorPattern, command, error, correction }) {
  await addLearnedEntry({
    skill: skill || 'heartflow',
    errorPattern,
    correction: correction || `之前失败过: ${errorPattern}`,
    rootCause: error || errorPattern,
  });
  console.log(`📝 教训已记录: ${errorPattern}`);
}

// ============================================================================
// 教训升级：处理高confidence条目
// ============================================================================

/**
 * 检查learnings中需要升级的条目
 * @param {number} threshold - confidence阈值 (default 0.7)
 */
export async function processLearnedLessons(threshold = 0.7) {
  const knowledge = await getKnowledgeSummary();
  const pending = knowledge.learnings.filter(l => 
    l.confidence >= threshold && l.failureCount > l.successCount
  );
  
  for (const lesson of pending) {
    // 如果一个教训被触发超过3次但成功率<50%，触发improve流程
    if (lesson.failureCount >= 3) {
      console.log(`🔄 教训需要升级: ${lesson.errorPattern}`);
      await improveSkill(lesson);
    }
  }
  
  return pending;
}

// ============================================================================
// 初始化：打印当前教训状态
// ============================================================================

export async function printLessonStatus() {
  const summary = await getKnowledgeSummary();
  const knowledge = await loadKnowledge();
  const learnings = await loadLearnings();
  
  const lines = [
    '\n═══════════════════════════════════════════',
    '  教训状态 (Lesson Status)',
    '═══════════════════════════════════════════',
    `  总教训数: ${learnings.length}`,
    '',
  ];
  
  // 按skill分组
  const bySkill = {};
  for (const l of learnings) {
    if (!bySkill[l.skill]) bySkill[l.skill] = [];
    bySkill[l.skill].push(l);
  }
  
  for (const [skill, items] of Object.entries(bySkill)) {
    lines.push(`  【${skill}】${items.length}条`);
    for (const item of items.slice(0, 3)) {
      lines.push(`    • ${item.errorPattern.slice(0, 40)} (conf=${item.confidence})`);
    }
    if (items.length > 3) {
      lines.push(`    ... 还有${items.length - 3}条`);
    }
  }
  
  lines.push('═══════════════════════════════════════════\n');
  console.log(lines.join('\n'));
  
  return summary;
}

export default {
  lessonAwareExecute,
  recordFailure,
  processLearnedLessons,
  printLessonStatus,
};
