/**
 * src/error-memory.js — 心虫跨会话错误记忆
 *
 * 轻量级文件型错误日志。记录每次被纠正的错误，
 * 下次同类情况自动触发预防规则。
 *
 * 结构：
 *   error-memory.json — 错误模式库
 *   logCorrection(category, detail, context) — 记录纠错
 *   checkRecurrence(context) — 检查当前有没有踩过同类坑
 *
 * 用法：
 *   const errMem = require('./src/error-memory.js');
 *   // 被纠正时记录
 *   errMem.logCorrection('overconfidence', '说"唯一方案"太绝对', currentQuestion);
 *   // 每次回复前检查
 *   const warning = errMem.checkRecurrence(currentContext);
 *   if (warning) { addCautionPrefix(); }
 */

'use strict';
const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '..', 'data', 'error-memory.json');

// ─── 错误分类 ─────────────────────────

const CATEGORIES = {
  overconfidence: { label: '过度自信', preventionPatterns: ['毫无疑问', '唯一', '绝对', '肯定', '一定', '必须'] },
  hallucination: { label: '幻觉/编造', preventionPatterns: ['根据研究', '数据表明', '专家指出'] },
  sycophancy: { label: '谄媚附和', preventionPatterns: ['您说得对', '很好的问题', '完全同意'] },
  defensiveness: { label: '防御姿态', preventionPatterns: ['你可能没理解', '其实我意思是', '但更重要的是'] },
  vagueness: { label: '模糊回避', preventionPatterns: ['相关部门', '据了解', '业内人士'] },
  binary: { label: '二元论', preventionPatterns: ['不是...就是', '要么...要么', '唯一选择'] },
  omission: { label: '遗漏问题', preventionPatterns: ['没有遗漏', '完全覆盖', '全部完成'] },
};

// ─── 读写错误记忆 ─────────────────────────

function loadMemory() {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(MEMORY_FILE)) return { errors: [], version: '1.0' };
    const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { errors: [], version: '1.0' };
  }
}

function saveMemory(data) {
  const dir = path.dirname(MEMORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── 记录纠错 ─────────────────────────

function logCorrection(category, detail, context = '') {
  if (!category || !CATEGORIES[category]) return { success: false, reason: '未知错误分类' };

  const memory = loadMemory();
  const entry = {
    id: memory.errors.length + 1,
    category,
    detail: detail || '',
    context: context.slice(0, 200),
    timestamp: new Date().toISOString(),
    prevention: CATEGORIES[category].preventionPatterns,
    recurrenceCount: 0,
  };

  // 去重：同类错误 1 小时内不重复记录
  const recent = memory.errors.filter(e =>
    e.category === category &&
    Date.now() - new Date(e.timestamp).getTime() < 3600000
  );
  if (recent.length > 0) {
    recent[0].recurrenceCount = (recent[0].recurrenceCount || 0) + 1;
    recent[0].lastSeen = entry.timestamp;
    saveMemory(memory);
    return { success: true, updated: recent[0].id, recurrence: true };
  }

  memory.errors.push(entry);

  // 限制最大 200 条（滚动淘汰最旧的）
  if (memory.errors.length > 200) {
    memory.errors = memory.errors.slice(-200);
  }

  saveMemory(memory);
  return { success: true, id: entry.id, recurrence: false };
}

// ─── 检查复发风险 ─────────────────────────

function checkRecurrence(context) {
  if (!context || typeof context !== 'string') return { warnings: [], safe: true };

  const memory = loadMemory();
  if (memory.errors.length === 0) return { warnings: [], safe: true };

  const warnings = [];

  // 统计各分类的错误数量
  const categoryCounts = {};
  for (const e of memory.errors) {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  }

  // 对有过错误记录的分类（>=1次）生成预防警告
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count >= 1 && CATEGORIES[category]) {
      const cat = CATEGORIES[category];
      // 检查当前上下文是否包含该类的触发模式
      const triggered = cat.preventionPatterns.filter(p => context.includes(p));
      if (triggered.length > 0) {
        warnings.push({
          category,
          label: cat.label,
          previousCount: count,
          triggeredPatterns: triggered,
          advice: `之前${count}次在"${cat.label}"上犯过错，当前上下文有触发词"${triggered.join('、')}"，请注意。`,
        });
      }
    }
  }

  // 检查高频复发（同一个错误出现 3+ 次）
  const highRecurrence = memory.errors.filter(e => (e.recurrenceCount || 0) >= 3);
  for (const e of highRecurrence) {
    warnings.push({
      category: e.category,
      label: CATEGORIES[e.category]?.label || e.category,
      previousCount: (e.recurrenceCount || 0) + 1,
      advice: `"${e.detail.slice(0, 40)}"已经反复犯${(e.recurrenceCount || 0) + 1}次了。`,
      highRecurrence: true,
    });
  }

  return { warnings, safe: warnings.length === 0 };
}

// ─── 生成预防规则 ─────────────────────────

function generatePreventionRule(category) {
  if (!category || !CATEGORIES[category]) return null;

  const cat = CATEGORIES[category];
  return {
    category,
    name: `prevent_${category}`,
    triggeredBy: cat.preventionPatterns,
    action: 'caution',
    message: `上次在"${cat.label}"上犯过错，请注意避免同类问题。`,
  };
}

// ─── 获取统计 ─────────────────────────

function getStats() {
  const memory = loadMemory();
  const byCategory = {};
  for (const e of memory.errors) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  }
  return {
    total: memory.errors.length,
    byCategory,
    highRecurrence: memory.errors.filter(e => (e.recurrenceCount || 0) >= 3).length,
  };
}

module.exports = {
  logCorrection,
  checkRecurrence,
  generatePreventionRule,
  getStats,
  CATEGORIES,
  clearMemory: () => saveMemory({ errors: [], version: '1.0' }),
};
