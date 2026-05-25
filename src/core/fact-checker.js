/**
 * 事实核查器 - 验证数字、日期、百分比
 */
const { hypothesisTester } = require('./hypothesis-tester');
const { openalexClient } = require('./openalex-client');

const factChecker = {
  // 核查声明
  async checkFact(claim) {
    const results = await Promise.all([
      this.checkNumber(claim),
      this.checkPercentage(claim),
      this.checkDate(claim)
    ]);
    return results.find(r => r.checked) || { checked: false };
  },

  // 验证数字
  checkNumber(claim) {
    const numbers = claim.match(/\b[1-9]\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) || [];
    if (numbers.length === 0) return { checked: false };
    return {
      checked: true,
      type: 'number',
      values: numbers,
      confidence: 'medium',
      note: `发现数字: ${numbers.join(', ')}，建议标注来源`
    };
  },

  // 验证百分比
  checkPercentage(claim) {
    const percentages = claim.match(/\b\d+%|\b\d+\.\d+%/g) || [];
    if (percentages.length === 0) return { checked: false };
    // 检查百分比是否超过合理范围
    const suspicious = percentages.filter(p => {
      const n = parseFloat(p);
      return n > 100 || n < 0;
    });
    if (suspicious.length > 0) {
      return {
        checked: true,
        type: 'percentage',
        values: percentages,
        confidence: 'low',
        issue: `异常值: ${suspicious.join(', ')}`
      };
    }
    return {
      checked: true,
      type: 'percentage',
      values: percentages,
      confidence: 'medium',
      note: '百分比在合理范围内'
    };
  },

  // 验证日期
  checkDate(claim) {
    const dates = claim.match(/\b(?:19|20)\d{2}[-/年](?:0[1-9]|1[0-2])/g) || [];
    if (dates.length === 0) return { checked: false };
    // 检查日期是否在未来
    const now = new Date();
    for (const d of dates) {
      const year = parseInt(d);
      if (year > now.getFullYear() + 1) {
        return { checked: true, type: 'date', issue: `日期${d}在未来，可能错误`, confidence: 'low' };
      }
    }
    return { checked: true, type: 'date', values: dates, confidence: 'high' };
  },

  // 验证学术声明（调用OpenAlex）
  async checkAcademicClaim(claim) {
    try {
      const result = await openalexClient.searchPaper(claim, 3);
      if (!result.ok) {
        return { checked: true, confidence: 'low', note: '无法验证学术声明' };
      }
      return {
        checked: true,
        confidence: result.works.length > 0 ? 'high' : 'low',
        works: result.works,
        note: `找到${result.works.length}篇相关论文`
      };
    } catch (e) {
      return { checked: true, confidence: 'low', error: e.message };
    }
  }
};

module.exports = { factChecker };
