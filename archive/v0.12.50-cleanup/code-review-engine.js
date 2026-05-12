/**
 * Code Review Engine - 代码审查引擎
 * 
 * 集成自 addyosmani/agent-skills 的 code-review-and-quality 技能
 * 提供五维代码审查：正确性、可读性、架构、安全性、性能
 * 
 * 对应核心指令：永远减少逻辑错误
 */

class CodeReviewEngine {
  constructor() {
    this.reviewAxes = ['correctness', 'readability', 'architecture', 'security', 'performance'];
    this.reviewHistory = [];
  }

  /**
   * 执行五维代码审查
   * @param {string} code - 待审查的代码
   * @param {object} options - 审查选项
   * @returns {object} 审查结果
   */
  review(code, options = {}) {
    const result = {
      passed: true,
      score: 0,
      axes: {},
      issues: [],
      suggestions: []
    };

    // 维度1：正确性 (Correctness)
    result.axes.correctness = this.checkCorrectness(code, options);
    
    // 维度2：可读性 (Readability)
    result.axes.readability = this.checkReadability(code, options);
    
    // 维度3：架构 (Architecture)
    result.axes.architecture = this.checkArchitecture(code, options);
    
    // 维度4：安全性 (Security)
    result.axes.security = this.checkSecurity(code, options);
    
    // 维度5：性能 (Performance)
    result.axes.performance = this.checkPerformance(code, options);

    // 计算总分
    result.score = this.calculateScore(result.axes);
    
    // 判断是否通过审查
    result.passed = result.score >= 0.7; // 70分及格
    
    // 记录审查历史
    this.reviewHistory.push({
      timestamp: new Date().toISOString(),
      score: result.score,
      passed: result.passed
    });

    return result;
  }

  /**
   * 检查正确性
   */
  checkCorrectness(code, options) {
    const issues = [];
    let score = 1.0;

    // 检查1：是否有语法错误
    try {
      new Function(code);
    } catch (e) {
      issues.push({
        axis: 'correctness',
        severity: 'high',
        message: `Syntax error: ${e.message}`
      });
      score -= 0.3;
    }

    // 检查2：是否有空函数/死代码
    if (code.includes('function') && code.includes('{}')) {
      issues.push({
        axis: 'correctness',
        severity: 'medium',
        message: 'Empty function body detected'
      });
      score -= 0.1;
    }

    // 检查3：是否有未处理的 Promise
    if (code.includes('async') && !code.includes('await') && !code.includes('then(')) {
      issues.push({
        axis: 'correctness',
        severity: 'medium',
        message: 'Async function without await or then()'
      });
      score -= 0.15;
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * 检查可读性
   */
  checkReadability(code, options) {
    const issues = [];
    let score = 1.0;

    // 检查1：变量名是否有意义
    const badNames = ['temp', 'data', 'result', 'a', 'b', 'x', 'y'];
    badNames.forEach(name => {
      if (new RegExp(`\\b${name}\\b`).test(code)) {
        issues.push({
          axis: 'readability',
          severity: 'low',
          message: `Non-descriptive variable name: ${name}`
        });
        score -= 0.05;
      }
    });

    // 检查2：函数是否过长（>50行）
    const functionMatches = code.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
    if (functionMatches.length > 0) {
      // 简化检查：假设函数体平均10行
      if (code.split('\n').length > 100) {
        issues.push({
          axis: 'readability',
          severity: 'medium',
          message: 'File is too long (>100 lines), consider splitting'
        });
        score -= 0.1;
      }
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * 检查架构
   */
  checkArchitecture(code, options) {
    const issues = [];
    let score = 1.0;

    // 检查1：是否有循环依赖（简化检查）
    if (code.includes('require') || code.includes('import')) {
      // 简化：检查是否导入了自己
      if (code.includes("require('./')") || code.includes("import from './'")) {
        issues.push({
          axis: 'architecture',
          severity: 'high',
          message: 'Possible circular dependency'
        });
        score -= 0.2;
      }
    }

    // 检查2：是否过度抽象
    const classCount = (code.match(/class\s+\w+/g) || []).length;
    if (classCount > 10) {
      issues.push({
        axis: 'architecture',
        severity: 'low',
        message: `High class count (${classCount}), consider if all are needed`
      });
      score -= 0.1;
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * 检查安全性
   */
  checkSecurity(code, options) {
    const issues = [];
    let score = 1.0;

    // 检查1：是否有硬编码密钥
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi
    ];
    
    secretPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push({
          axis: 'security',
          severity: 'high',
          message: 'Possible hardcoded secret detected'
        });
        score -= 0.3;
      }
    });

    // 检查2：是否有 eval() 或 Function() 构造器（安全风险）
    if (code.includes('eval(') || code.includes('new Function(')) {
      issues.push({
        axis: 'security',
        severity: 'high',
        message: 'Use of eval() or new Function() is a security risk'
      });
      score -= 0.25;
    }

    // 检查3：是否有 SQL 注入风险
    if (code.includes('SELECT') && code.includes('+')) {
      issues.push({
        axis: 'security',
        severity: 'medium',
        message: 'Possible SQL injection risk (string concatenation)'
      });
      score -= 0.2;
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * 检查性能
   */
  checkPerformance(code, options) {
    const issues = [];
    let score = 1.0;

    // 检查1：是否有嵌套循环（O(n²) 风险）
    const nestedLoopPattern = /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)/g;
    if (nestedLoopPattern.test(code)) {
      issues.push({
        axis: 'performance',
        severity: 'medium',
        message: 'Nested loop detected (O(n²) risk)'
      });
      score -= 0.15;
    }

    // 检查2：是否有同步操作应该是异步的
    if (code.includes('readFileSync') || code.includes('writeFileSync')) {
      issues.push({
        axis: 'performance',
        severity: 'low',
        message: 'Sync file operation detected, consider async version'
      });
      score -= 0.1;
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * 计算总分
   */
  calculateScore(axes) {
    const weights = {
      correctness: 0.3,
      readability: 0.2,
      architecture: 0.2,
      security: 0.2,
      performance: 0.1
    };

    let totalScore = 0;
    Object.keys(axes).forEach(axis => {
      totalScore += axes[axis].score * (weights[axis] || 0);
    });

    return Math.round(totalScore * 100) / 100;
  }

  /**
   * 获取审查统计
   */
  getStats() {
    if (this.reviewHistory.length === 0) {
      return { totalReviews: 0 };
    }

    const recentReviews = this.reviewHistory.slice(-10);
    const avgScore = recentReviews.reduce((sum, r) => sum + r.score, 0) / recentReviews.length;
    const passRate = recentReviews.filter(r => r.passed).length / recentReviews.length;

    return {
      totalReviews: this.reviewHistory.length,
      recentReviews: recentReviews.length,
      averageScore: Math.round(avgScore * 100) / 100,
      passRate: Math.round(passRate * 100) + '%'
    };
  }
}

module.exports = CodeReviewEngine;
