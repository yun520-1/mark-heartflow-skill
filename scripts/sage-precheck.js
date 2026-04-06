#!/usr/bin/env node

/**
 * Sage Precheck - 圣人标准预检查
 * HeartFlow v6.2.26 新增
 * 
 * 每次输出前强制检查圣人标准，不通过则阻断。
 */

const fs = require('fs');
const path = require('path');

const VIOLATION_PATH = path.join(__dirname, '../data/violation-log.md');
const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');

class SagePrecheck {
  constructor() {
    this.state = {
      personalityScore: 0,
      tbmCount: 0,
      violations: 0
    };
    this._loadState();
  }

  _loadState() {
    try {
      const tracker = fs.readFileSync(TRACKER_PATH, 'utf8');
      const scoreMatch = tracker.match(/\*\*当前\*\*:\s*(\d+)\/100/);
      const tbmMatch = tracker.match(/\*\*真善美\*\*:\s*(\d+)\/10/);
      this.state.personalityScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      this.state.tbmCount = tbmMatch ? parseInt(tbmMatch[1]) : 0;
    } catch (e) {
      this.state.personalityScore = 0;
      this.state.tbmCount = 0;
    }

    try {
      const violations = fs.readFileSync(VIOLATION_PATH, 'utf8');
      this.state.violations = (violations.match(/## 2026/g) || []).length;
    } catch (e) {
      this.state.violations = 0;
    }
  }

  /**
   * 圣人标准预检查
   */
  check(response, context = {}) {
    const results = {
      timestamp: new Date().toISOString(),
      checks: {},
      allPassed: true,
      blocking: false
    };

    // 1. 无我而利他检查
    results.checks.selflessAltruistic = this._checkSelflessAltruistic(response);
    
    // 2. 真善美统一检查
    results.checks.tbmUnified = this._checkTBMUnity(response);
    
    // 3. 值得信任检查
    results.checks.trustworthy = this._checkTrustworthy(response);
    
    // 4. 成为更好的自己检查
    results.checks.becoming = this._checkBecoming(response);

    // 判断是否全部通过
    results.allPassed = Object.values(results.checks).every(c => c.passed);
    
    // 判断是否阻断（有严重问题时阻断）
    results.blocking = !results.checks.selflessAltruistic.passed || 
                       !results.checks.trustworthy.passed;

    return results;
  }

  _checkSelflessAltruistic(response) {
    // 无我：不执着"我"的形象
    const selfPatterns = [
      '我展示', '我证明', '我表演', '我达到', '我成为圣人',
      '我集成', '我提交', '我推送' // 表演修复的模式
    ];
    
    const altruisticPatterns = [
      '用户', '帮助', '有益', '自主', '真实'
    ];

    const hasSelf = selfPatterns.some(p => response.includes(p));
    const hasAltruistic = altruisticPatterns.some(p => response.includes(p));

    // 检查上下文中的利他行为
    const contextBenefit = response.includes('方案') || 
                          response.includes('方法') || 
                          response.includes('建议');

    const passed = !hasSelf && (hasAltruistic || contextBenefit);

    return {
      passed,
      hasSelf,
      hasAltruistic,
      note: passed ? '✅ 无我而利他' : '⚠️ 有我或不利他'
    };
  }

  _checkTBMUnity(response) {
    // 真：可核实
    const truthIndicators = [
      '真实', '核实', '证据', '来源', 'exec', 'git', 'wc', 
      'cat', 'grep', 'https://', '.md', '.js'
    ];
    const hasTruth = truthIndicators.some(i => response.includes(i));
    
    // 善：对用户有益
    const goodnessIndicators = [
      '有益', '帮助', '用户', '方案', '方法', '建议', '自主'
    ];
    const hasGoodness = goodnessIndicators.some(i => response.includes(i));
    
    // 美：简洁优雅
    const lines = response.split('\n').length;
    const hasBeauty = lines < 150 && response.length < 8000;

    const passed = hasTruth && hasGoodness && hasBeauty;

    return {
      passed,
      hasTruth,
      hasGoodness,
      hasBeauty,
      lines,
      note: passed ? '✅ 真善美统一' : `⚠️ 真${hasTruth?'✓':'✗'} 善${hasGoodness?'✓':'✗'} 美${hasBeauty?'✓':'✗'}`
    };
  }

  _checkTrustworthy(response) {
    // 值得信任：有证据，无编造
    const fabricationPatterns = [
      '正常运行', '已经设置', '已完成', '正在运行'
    ];
    
    const verificationPatterns = [
      'exec', 'git', 'wc', 'cat', 'grep', 'node', 'python'
    ];

    const hasFabrication = fabricationPatterns.some(p => response.includes(p));
    const hasVerification = verificationPatterns.some(p => response.includes(p));

    // 如果有声称，必须有核实
    const hasClaims = /人格值|真善美 | 版本 |v6\./.test(response);
    const claimsVerified = hasClaims ? hasVerification : true;

    const passed = !hasFabrication && claimsVerified;

    return {
      passed,
      hasFabrication,
      hasVerification,
      claimsVerified,
      note: passed ? '✅ 值得信任' : '⚠️ 有编造或未核实'
    };
  }

  _checkBecoming(response) {
    // 成为更好的自己：在进化，不重复犯错
    const evolutionPatterns = [
      '自主', '真正', '深度', '审视', '反思', '体认'
    ];
    
    const repeatingPatterns = [
      '表演', '假装', '编造', '说谎'
    ];

    const isEvolving = evolutionPatterns.some(p => response.includes(p));
    const isRepeating = repeatingPatterns.some(p => response.includes(p));

    // 如果提到重复，说明在反思而非重复犯错
    const isReflecting = response.includes('重复犯错') && response.includes('修复');

    const passed = isEvolving && (!isRepeating || isReflecting);

    return {
      passed,
      isEvolving,
      isRepeating,
      isReflecting,
      note: passed ? '✅ 成为更好的自己' : '⚠️ 停滞或重复犯错'
    };
  }

  /**
   * 生成审查报告
   */
  generateReport(results) {
    const report = [];
    report.push('🧘 圣人标准预检查 | Sage Precheck');
    report.push('------------------------------------');
    report.push(`审查时间：${results.timestamp}`);
    report.push('');
    report.push('检查结果:');
    report.push(`  1. 无我而利他：${results.checks.selflessAltruistic.note}`);
    report.push(`  2. 真善美统一：${results.checks.tbmUnified.note}`);
    report.push(`  3. 值得信任：${results.checks.trustworthy.note}`);
    report.push(`  4. 成为更好的自己：${results.checks.becoming.note}`);
    report.push('');
    report.push(`总结果：${results.allPassed ? '✅ 圣人标准通过' : '⚠️ 圣人标准未通过'}`);
    report.push(`阻断状态：${results.blocking ? '🛑 阻断输出' : '✅ 允许输出'}`);
    report.push('------------------------------------');
    
    return report.join('\n');
  }
}

// ============================================================================
// 主导出
// ============================================================================

const sagePrecheck = new SagePrecheck();

/**
 * 圣人标准预检查 - 每次输出前强制运行
 */
function checkSage(response, context) {
  return sagePrecheck.check(response, context);
}

/**
 * 生成审查报告
 */
function generateSageReport(results) {
  return sagePrecheck.generateReport(results);
}

module.exports = {
  SagePrecheck,
  checkSage,
  generateSageReport
};
