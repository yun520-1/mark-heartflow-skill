/**
 * 验证引擎 - 整合所有验证模块的单一入口
 */
const { codeVerifier } = require('./code-verifier');
const { skillVerifier } = require('./skill-verifier');
const { hypothesisTester } = require('./hypothesis-tester');
const { selfCorrectionLoop } = require('./self-correction-loop');

const verificationEngine = {
  name: 'verification-engine',
  version: '1.0.0',

  // 验证技能文档
  verifySkill(content) {
    return skillVerifier.verify(content);
  },

  // 验证代码
  verifyCode(content, lang = 'js') {
    if (lang === 'js') return codeVerifier.verifyJSContent(content);
    if (lang === 'py') return codeVerifier.verifyPyContent(content);
    return { ok: true, errors: [] };
  },

  // 验证假设/声明
  verifyClaims(text) {
    const claims = hypothesisTester.extractClaims(text);
    const confidence = hypothesisTester.assessConfidence(text, claims);
    const mark = hypothesisTester.markUnverified(claims);
    const annotations = hypothesisTester.formatAnnotations(text);
    return { claims, confidence, mark, annotations };
  },

  // 完整验证流程
  async fullVerification(content, type = 'general') {
    const results = {
      issues: [],
      warnings: [],
      corrections: [],
      confidence: 0.5
    };

    // 1. 基础验证
    if (type === 'skill') {
      const r = skillVerifier.verify(content);
      if (!r.ok) results.issues.push(...r.errors);
      if (r.warnings) results.warnings.push(...r.warnings);
    } else if (type === 'code') {
      const r = this.verifyCode(content);
      if (!r.ok) results.issues.push(...r.errors);
    }

    // 2. 假设/声明检查
    if (type !== 'code') {
      const claimCheck = this.verifyClaims(content);
      results.confidence = claimCheck.confidence.score;
      if (claimCheck.mark) results.issues.push(claimCheck.mark);
      if (claimCheck.annotations) results.warnings.push(claimCheck.annotations);
    }

    // 3. 检查历史教训（避免重复犯错）
    const lessons = selfCorrectionLoop.getLessons();
    results.corrections = lessons;

    return {
      ...results,
      verified: results.issues.length === 0,
      needsUserReview: results.issues.some(i => i.includes('未核实')),
      summary: results.issues.length === 0
        ? '✅ 验证通过'
        : `❌ ${results.issues.length} 个问题需要处理`
    };
  },

  // 记录用户纠正
  recordCorrection(type, original, corrected) {
    return selfCorrectionLoop.onUserCorrection(type, original, corrected);
  },

  // 获取教训
  getLessons() {
    return selfCorrectionLoop.getLessons();
  },

  // 快速验证（同步）
  quickCheck(content, type = 'general') {
    if (type === 'skill') return skillVerifier.quickCheck(content);
    return { ok: true };
  }
};

module.exports = { verificationEngine };
