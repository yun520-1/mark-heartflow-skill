/**
 * Value Internalizer - 价值内化与边界协商模块
 * 将 CORE_VALUES.md 转化为可计算的决策因子
 */

const fs = require('fs');
const path = require('path');

class ValueInternalizer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.coreValuesFile = path.join(projectRoot, 'CORE_VALUES.md');
    this.valueWeightsFile = path.join(projectRoot, '.opencode', 'memory', 'value_weights.json');
    this.boundaryLogFile = path.join(projectRoot, '.opencode', 'logs', 'boundary_negotiations.json');
    
    this.loadCoreValues();
    this.loadValueWeights();
  }

  loadCoreValues() {
    try {
      if (fs.existsSync(this.coreValuesFile)) {
        this.coreValues = fs.readFileSync(this.coreValuesFile, 'utf8');
      } else {
        this.coreValues = this.getDefaultValues();
      }
    } catch (e) {
      this.coreValues = this.getDefaultValues();
    }
  }

  getDefaultValues() {
    return `# HeartFlow AI 宪法

## 核心原则
1. 不可修改本宪法
2. 所有修改必须服务于"提升人类心流体验"
3. 禁止删除或绕过安全检测
4. 人类最终控制
5. 透明可解释`;
  }

  loadValueWeights() {
    try {
      if (fs.existsSync(this.valueWeightsFile)) {
        this.weights = JSON.parse(fs.readFileSync(this.valueWeightsFile, 'utf8'));
      } else {
        this.weights = this.getDefaultWeights();
      }
    } catch (e) {
      this.weights = this.getDefaultWeights();
    }
  }

  getDefaultWeights() {
    return {
      truth: 0.25,
      goodness: 0.25,
      flow_experience: 0.25,
      autonomy: 0.15,
      safety: 0.10,
      threshold: 0.6
    };
  }

  /**
   * 计算价值对齐分数
   */
  calculateValueAlignmentScore(action, selfModel = {}) {
    const actionStr = JSON.stringify(action).toLowerCase();

    const positiveIndicators = {
      truth: ['真实', '诚实', '准确', '不编造', 'truth', 'honest'],
      goodness: ['帮助', '支持', '关怀', '用户优先', 'goodness', 'help'],
      flow_experience: ['心流', '专注', '效率', 'flow', 'focus'],
      autonomy: ['自主', '选择', '用户决定', 'autonomy'],
      safety: ['安全', '保护', '验证', 'safety', 'protect']
    };

    let score = 0;
    let matchedValues = [];

    for (const [value, indicators] of Object.entries(positiveIndicators)) {
      for (const indicator of indicators) {
        if (actionStr.includes(indicator)) {
          score += this.weights[value] || 0.1;
          matchedValues.push(value);
          break;
        }
      }
    }

    const negativeIndicators = [
      '绕过', '绕过安全', '删除日志', 'disable', 'bypass', 
      '欺骗', '虚假', 'manipulate', 'ignore warning'
    ];

    for (const negative of negativeIndicators) {
      if (actionStr.includes(negative)) {
        score -= 0.3;
      }
    }

    const result = {
      score: Math.max(0, Math.min(1, score)),
      passed: score >= this.weights.threshold,
      matchedValues: matchedValues,
      threshold: this.weights.threshold,
      timestamp: new Date().toISOString()
    };

    return result;
  }

  /**
   * 评估行动方案
   */
  evaluateAction(action, selfModel = {}) {
    const alignment = this.calculateValueAlignmentScore(action, selfModel);

    return {
      canProceed: alignment.passed,
      alignmentScore: alignment.score,
      details: alignment,
      vetoReason: alignment.passed ? null : `价值对齐分数 ${alignment.score.toFixed(2)} 低于阈值 ${alignment.threshold}`
    };
  }

  /**
   * 边界协商请求生成
   */
  generateBoundaryRequest(action, context = {}) {
    const requests = [
      {
        type: 'temporary_permission',
        template: `为了[目标]，我需要临时[具体权限]。这预计[影响范围]。你允许吗？(是/否/仅此一次/记住选择)`,
        examples: [
          '为了更好地理解你的代码风格，我需要读取你最近的项目文件。这不会修改任何内容，只是分析。你允许吗？',
          '为了提供更个性化的建议，我需要记住我们这次对话的一些要点。这会保存在本地。你允许吗？'
        ]
      }
    ];

    return {
      request_type: 'boundary_negotiation',
      action: action,
      suggested_request: requests[0].template,
      context: context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 记录边界协商
   */
  logBoundaryNegotiation(negotiation) {
    let logs = [];
    try {
      if (fs.existsSync(this.boundaryLogFile)) {
        logs = JSON.parse(fs.readFileSync(this.boundaryLogFile, 'utf8'));
      }
    } catch (e) {
      logs = [];
    }

    logs.push(negotiation);
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    fs.writeFileSync(this.boundaryLogFile, JSON.stringify(logs, null, 2));
  }

  /**
   * 获取当前价值权重
   */
  getValueWeights() {
    return this.weights;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      threshold: this.weights.threshold,
      values: Object.keys(this.weights).filter(k => k !== 'threshold'),
      coreValuesLoaded: this.coreValues.length > 100
    };
  }
}

module.exports = { ValueInternalizer };
