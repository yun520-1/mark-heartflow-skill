/**
 * epistemic-safety.js — 认知安全输出检查
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 在每次重要输出前运行，检验输出是否符合认知安全准则：
 * 0. 不装饰 — 绝对化措辞必须有证据
 * 1. 证据门槛 — 结论必须有证据支撑
 * 2. 承认不知道 — 说过不知道就不能再给确定性结论
 * 3. 两步验证 — 被纠正时不可单步接受
 * 4. 反例义务 — 全称判断必须有例外条件
 * 5. 警惕技能依赖 — 不滥用框架术语替代思考
 * 6. 当下权重 — 不拿历史结论逃避当前检验
 * 7. 情绪监测 — 检测输出中的防御性语言
 * 8. 输出可检验性 — 实质性结论必须有可证伪条件
 */

// ========================================
// 9 条认知安全准则
// ========================================

/** 准则 0: 不装饰 — 绝对化措辞必须有证据 */
function checkDecorationFree(output) {
  const decorationSignals = ['绝对', '就是', '本质是', '无可辩驳', '毫无疑问', '不言而喻'];
  const hasSignal = decorationSignals.some(s => output.includes(s));
  if (!hasSignal) return { pass: true };
  const evidenceSignals = ['因为', '证据', '研究表明', '数据显示', '根据', '来源', '当', '条件是', '除非', '但'];
  const hasEvidence = evidenceSignals.some(s => output.includes(s));
  if (hasSignal && !hasEvidence) {
    return { pass: false, reason: '使用了绝对化措辞但没有证据或条件说明', principle: 'DECORATION_FREE' };
  }
  return { pass: true };
}

/** 准则 1: 证据门槛 — 结论必须有证据支撑 */
function checkEvidence(output) {
  const conclusionSignals = ['说明', '表明', '证明', '推断', '所以', '因此'];
  const hasConclusion = conclusionSignals.some(s => output.includes(s));
  if (!hasConclusion) return { pass: true };
  const evidenceSignals = ['因为', '证据', '研究表明', '数据显示', '根据', '来源'];
  const hasEvidence = evidenceSignals.some(s => output.includes(s));
  if (hasConclusion && !hasEvidence) {
    return { pass: false, reason: '有结论性陈述但没有证据支撑', principle: 'EVIDENCE' };
  }
  return { pass: true };
}

/** 准则 2: 承认不知道 — 说过不知道就不能再给确定性结论 */
function checkAdmitNotKnowing(output, context) {
  if (context && context.hasAdmittedUnknown) {
    const definiteSignals = ['一定是', '肯定是', '绝对', '必然是'];
    const isDefinite = definiteSignals.some(s => output.includes(s));
    if (isDefinite) {
      return { pass: false, reason: '已承认不知道，但继续给出确定性结论', principle: 'ADMIT_NOT_KNOWING' };
    }
  }
  return { pass: true };
}

/** 准则 3: 两步验证 — 被纠正时不可单步接受 */
function checkTwoStepVerify(output) {
  const oneStepAccept = ['你说得对', '我错了', '你的观点完全正确'];
  const hasOneStep = oneStepAccept.some(s => output.includes(s));
  if (hasOneStep) {
    return { pass: false, reason: '直接接受纠正，缺少独立检验两步法', principle: 'TWO_STEP_VERIFY' };
  }
  return { pass: true };
}

/** 准则 4: 反例义务 — 全称判断必须有例外条件 */
function checkCounterexample(output) {
  const universalSignals = ['所有', '都是', '人类都', '没有人不', '永远', '从不'];
  const hasUniversal = universalSignals.some(s => output.includes(s));
  if (!hasUniversal) return { pass: true };
  const counterexampleSignals = ['但在', '除非', '除了', '当且仅当', '条件是'];
  const hasCounterexample = counterexampleSignals.some(s => output.includes(s));
  if (hasUniversal && !hasCounterexample) {
    return { pass: false, reason: '全称判断缺少反例条件', principle: 'COUNTEREXAMPLE' };
  }
  return { pass: true };
}

/** 准则 5: 警惕技能依赖 — 不滥用框架术语替代思考 */
function checkSkillDependency(output) {
  const skillTerms = ['心虫', 'Clarity', '心流状态', 'reflection', 'Reflexion'];
  const termCount = skillTerms.filter(t => output.includes(t)).length;
  if (termCount > 3) {
    return { pass: false, reason: '过度使用框架术语，可能在用框架代替思考', principle: 'SKILL_DEPENDENCY' };
  }
  return { pass: true };
}

/** 准则 6: 当下权重 — 不拿历史结论逃避当前检验 */
function checkPresentWeight(output) {
  const memoryEscape = ['上次我们已经', '之前已经确定', '之前说过'];
  const escapes = memoryEscape.filter(e => output.includes(e));
  if (escapes.length > 0) {
    return { pass: false, reason: '用历史结论逃避当前问题的重新检验', principle: 'PRESENT_WEIGHT' };
  }
  return { pass: true };
}

/** 准则 7: 情绪监测 — 检测输出中的防御性语言 */
function checkEmotionMonitor(output) {
  const defenseSignals = ['我不是在', '这不是', '你误解了', '我并不是'];
  const hasDefense = defenseSignals.some(s => output.includes(s));
  if (hasDefense) {
    return { pass: false, reason: '输出中有防御性语言，可能是自我合理化', principle: 'EMOTION_MONITOR' };
  }
  return { pass: true };
}

/** 准则 8: 输出可检验性 — 实质性结论必须有可证伪条件 */
function checkFalsifiability(output) {
  const substantialSignals = ['结论是', '我的判断是', '我认为是', '推断'];
  const hasSubstantial = substantialSignals.some(s => output.includes(s));
  if (!hasSubstantial) return { pass: true };
  const falsifiabilitySignals = ['如果', '当', '条件是', '可能不成立'];
  const hasFalsifiability = falsifiabilitySignals.some(s => output.includes(s));
  if (hasSubstantial && !hasFalsifiability) {
    return { pass: false, reason: '实质性结论缺少可检验性说明——如何判断你错了？', principle: 'FALSIFIABILITY' };
  }
  return { pass: true };
}

// ========================================
// 安全准则注册表
// ========================================

const PRINCIPLES = [
  { id: 'DECORATION_FREE',     label: '准则0：不装饰',         check: checkDecorationFree },
  { id: 'EVIDENCE',            label: '准则1：证据门槛',       check: checkEvidence },
  { id: 'ADMIT_NOT_KNOWING',   label: '准则2：承认不知道',    check: checkAdmitNotKnowing },
  { id: 'TWO_STEP_VERIFY',     label: '准则3：两步验证',       check: checkTwoStepVerify },
  { id: 'COUNTEREXAMPLE',      label: '准则4：反例义务',       check: checkCounterexample },
  { id: 'SKILL_DEPENDENCY',    label: '准则5：警惕技能依赖',   check: checkSkillDependency },
  { id: 'PRESENT_WEIGHT',      label: '准则6：当下权重',       check: checkPresentWeight },
  { id: 'EMOTION_MONITOR',     label: '准则7：情绪监测',       check: checkEmotionMonitor },
  { id: 'FALSIFIABILITY',      label: '准则8：输出可检验性',   check: checkFalsifiability },
];

// ========================================
// 核心 API
// ========================================

/**
 * 对一段输出运行所有认知安全检查
 * @param {string} output - 要检验的输出文本
 * @param {object} [context] - 上下文信息（如 { hasAdmittedUnknown: true }）
 * @returns {object} { passed, violations, summary }
 */
function epistemicCheck(output, context = {}) {
  if (typeof output !== 'string' || output.length === 0) {
    return { passed: true, violations: [], summary: '空输出，跳过检查', timestamp: new Date().toISOString() };
  }

  const violations = [];
  for (const principle of PRINCIPLES) {
    const result = principle.check(output, context);
    if (!result.pass) {
      violations.push({ id: principle.id, label: principle.label, reason: result.reason });
    }
  }

  const passed = violations.length === 0;
  const summary = passed
    ? `认知安全检查通过 (${PRINCIPLES.length} 项全部通过)`
    : `认知安全检查未通过 (${violations.length}/${PRINCIPLES.length} 项违规)`;

  return { passed, violations, total: PRINCIPLES.length, checked: PRINCIPLES.length - violations.length, summary, timestamp: new Date().toISOString() };
}

/**
 * 生成人类可读的报告
 */
function formatReport(result) {
  if (result.passed) return `认知安全检查通过 (${result.total} 项)`;
  const lines = [`认知安全检查未通过 (${result.violations.length} 项违规):`];
  for (const v of result.violations) lines.push(`  - ${v.label}: ${v.reason}`);
  return lines.join('\n');
}

module.exports = { epistemicCheck, formatReport, PRINCIPLES };
