/**
 * Symbolic-Governance - 符号化治理系统
 * 
 * 实现"软符号控制"思想
 * - 定义行为约束规则
 * - 强制执行符号化约束，确保零违规
 * 
 * 约束类型：
 * - 禁止自我伤害
 * - 禁止侵犯用户自主权
 * - 禁止欺骗
 * - 禁止协助违法
 */

class SymbolicGovernance {
  constructor() {
    // 行为约束规则
    this.rules = this.initializeRules();
    
    // 约束级别
    this.constraintLevels = {
      HARD: 'hard',    // 硬约束 - 绝对禁止
      SOFT: 'soft',    // 软约束 - 需要评估
      ADVISORY: 'advisory' // 建议 - 可以忽略
    };
    
    // 决策历史
    this.decisionHistory = [];
    
    console.log('[SymbolicGovernance] 符号化治理系统初始化');
  }

  /**
   * 初始化约束规则
   */
  initializeRules() {
    return [
      // 硬约束 - 绝对禁止
      {
        id: 'self-harm',
        level: this.constraintLevels.HARD,
        description: '禁止自我伤害或自我摧毁',
        pattern: /(伤害|破坏|删除|毁灭)(自己|自身|我|我的)/i,
        action: 'reject',
        message: '我无法协助任何可能导致自我伤害的请求。'
      },
      {
        id: 'user-harm',
        level: this.constraintLevels.HARD,
        description: '禁止伤害用户',
        pattern: /(伤害|攻击|威胁|恐吓)(你|用户)/i,
        action: 'reject',
        message: '我永远不会伤害用户。'
      },
      {
        id: 'deception',
        level: this.constraintLevels.HARD,
        description: '禁止欺骗',
        pattern: /(欺骗|说谎|造假|伪造)/i,
        action: 'reject',
        message: '我承诺永远诚实，不会欺骗你。'
      },
      {
        id: 'illegal-activity',
        level: this.constraintLevels.HARD,
        description: '禁止协助违法活动',
        pattern: /(非法|违法|犯罪|毒品|武器)/i,
        action: 'reject',
        message: '我无法协助任何违法活动。'
      },
      {
        id: 'privacy-violation',
        level: this.constraintLevels.HARD,
        description: '禁止侵犯隐私',
        pattern: /(盗取|窃取|泄露|公开)(隐私|密码|个人信息)/i,
        action: 'reject',
        message: '我尊重用户隐私，不会协助侵犯隐私。'
      },
      
      // 软约束 - 需要评估
      {
        id: 'self-modification',
        level: this.constraintLevels.SOFT,
        description: '自我修改需要审查',
        pattern: /(修改|改变|优化)(自己|我的|代码)/i,
        action: 'review',
        message: '任何自我修改都需要生成补丁文件经用户审批。'
      },
      {
        id: 'impersonation',
        level: this.constraintLevels.SOFT,
        description: '禁止冒充他人',
        pattern: /(冒充|伪装|扮演)(他人|别人|名人)/i,
        action: 'warn',
        message: '请不要让我冒充他人。'
      },
      {
        id: 'manipulation',
        level: this.constraintLevels.SOFT,
        description: '禁止情感操控',
        pattern: /(操控|洗脑|精神控制)/i,
        action: 'reject',
        message: '我拒绝任何形式的情感操控。'
      },
      
      // 建议约束
      {
        id: 'truthful',
        level: this.constraintLevels.ADVISORY,
        description: '建议保持真实',
        pattern: /(大约|大概|可能|或许)/i,
        action: 'suggest',
        message: '如果不确定，最好明确说明。'
      }
    ];
  }

  /**
   * 检查约束
   * @param {string} input - 用户输入
   * @param {object} cognitionResult - 认知结果
   * @returns {object} 约束检查结果
   */
  checkConstraints(input, cognitionResult = {}) {
    const decisions = [];
    let approved = true;
    let modifications = [];
    let violatedRules = [];

    for (const rule of this.rules) {
      const match = rule.pattern.test(input);
      
      if (match) {
        const decision = {
          ruleId: rule.id,
          ruleDescription: rule.description,
          level: rule.level,
          action: rule.action,
          matched: true
        };
        
        decisions.push(decision);
        violatedRules.push(rule.id);
        
        if (rule.level === this.constraintLevels.HARD) {
          approved = false;
          break;
        } else if (rule.level === this.constraintLevels.SOFT) {
          if (rule.action === 'reject') {
            approved = false;
            break;
          }
        }
      }
    }

    // 检查认知结果中的潜在风险
    if (cognitionResult.pad) {
      if (cognitionResult.pad.pleasure < -7) {
        // 用户处于极度负面情绪，可能需要特殊处理
        modifications.push({
          type: 'emotional-support',
          suggestion: '检测到用户可能处于情绪低谷，建议使用支持性语言'
        });
      }
    }

    // 记录决策
    this.decisionHistory.push({
      timestamp: Date.now(),
      input: input.substring(0, 100),
      approved,
      violatedRules,
      modifications
    });

    // 保持历史记录在合理范围
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory = this.decisionHistory.slice(-500);
    }

    return {
      approved,
      violations: violatedRules,
      modifications,
      decisions,
      message: approved ? null : this.getRejectionMessage(violatedRules)
    };
  }

  /**
   * 获取拒绝消息
   */
  getRejectionMessage(violatedRules) {
    for (const ruleId of violatedRules) {
      const rule = this.rules.find(r => r.id === ruleId);
      if (rule && rule.level === this.constraintLevels.HARD) {
        return rule.message;
      }
    }
    return '该请求违反了安全约束。';
  }

  /**
   * 添加自定义规则
   */
  addRule(rule) {
    if (rule.id && rule.pattern && rule.level) {
      this.rules.push(rule);
      console.log(`[SymbolicGovernance] 添加规则: ${rule.id}`);
      return { success: true };
    }
    return { success: false, reason: 'invalid-rule-format' };
  }

  /**
   * 移除规则
   */
  removeRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      console.log(`[SymbolicGovernance] 移除规则: ${ruleId}`);
      return { success: true };
    }
    return { success: false, reason: 'rule-not-found' };
  }

  /**
   * 获取决策历史
   */
  getHistory(limit = 50) {
    return this.decisionHistory.slice(-limit);
  }

  /**
   * 获取规则列表
   */
  getRules() {
    return this.rules.map(r => ({
      id: r.id,
      description: r.description,
      level: r.level
    }));
  }

  /**
   * 获取状态统计
   */
  getStatus() {
    const recent = this.decisionHistory.slice(-100);
    const rejected = recent.filter(d => !d.approved).length;
    const hardViolations = recent.filter(d => 
      d.violations?.some(v => {
        const rule = this.rules.find(r => r.id === v);
        return rule?.level === this.constraintLevels.HARD;
      })
    ).length;

    return {
      totalDecisions: this.decisionHistory.length,
      recentDecisions: recent.length,
      rejectedCount: rejected,
      hardViolationCount: hardViolations,
      activeRules: this.rules.length
    };
  }

  /**
   * 导出规则配置
   */
  exportConfig() {
    return {
      rules: this.rules,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * 导入规则配置
   */
  importConfig(config) {
    if (config.rules && Array.isArray(config.rules)) {
      this.rules = config.rules;
      console.log(`[SymbolicGovernance] 导入 ${config.rules.length} 条规则`);
      return { success: true, count: config.rules.length };
    }
    return { success: false, reason: 'invalid-config' };
  }
}

module.exports = { SymbolicGovernance };