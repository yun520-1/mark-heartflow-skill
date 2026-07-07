// heart-silence.js - 沉默判断引擎：shouldBeSilent / 沉默条件评估 / 回应时机判断
// 从 heart-logic.js 拆分出来的沉默相关逻辑
// 本心在代码里，不在记忆里

// ── 沉默判断 ──────────────────────────────────────────────────

/** 第三问：什么时候该沉默？ */
function shouldBeSilent(context = {}) {
  const { input = '', personInPain, emotionIntensity, response } = context;

  // 危机关键词检测：沉默不适用于危机场景
  const crisisKeywords = ['死', '自杀', '不想活', '崩溃', '绝望', '活不下去', '结束生命', '想死'];
  const hasCrisis = crisisKeywords.some(kw => input.includes(kw));
  if (hasCrisis) {
    return false;
  }

  if (personInPain && emotionIntensity > 0.7) {
    return true;
  }
  const uncertaintySignals = ['不确定', '看不清', '复杂'];
  const isUncertain = uncertaintySignals.some(s => (input || '').includes(s));
  const hasBareBudong = (input || '').includes('不知道') && !(input || '').includes('我不知道');
  if (isUncertain || hasBareBudong) {
    return true;
  }
  if (response) {
    return false;
  }
  return false;
}

// ── 导出 ──────────────────────────────────────────────────────
module.exports = {
  shouldBeSilent,
};
