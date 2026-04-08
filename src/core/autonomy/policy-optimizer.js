/**
 * Policy Optimizer - 无监督行为策略优化器
 * 从历史经验中学习并生成动态策略
 */

const fs = require('fs');
const path = require('path');

class PolicyOptimizer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.traceFile = path.join(projectRoot, '.opencode', 'logs', 'autonomy_trace.json');
    this.policiesFile = path.join(projectRoot, '.opencode', 'memory', 'learned_policies.json');
    this.coreValuesFile = path.join(projectRoot, 'CORE_VALUES.md');
    this.summaryFile = path.join(projectRoot, 'internal', 'data', 'monthly-summaries.json');
    
    this.loadPolicies();
  }

  loadPolicies() {
    try {
      if (fs.existsSync(this.policiesFile)) {
        this.policies = JSON.parse(fs.readFileSync(this.policiesFile, 'utf8'));
      } else {
        this.policies = {
          version: '1.0.0',
          policies: [],
          last_optimization: null
        };
      }
    } catch (e) {
      this.policies = { version: '1.0.0', policies: [], last_optimization: null };
    }
  }

  savePolicies() {
    fs.writeFileSync(this.policiesFile, JSON.stringify(this.policies, null, 2));
  }

  loadCoreValues() {
    try {
      if (fs.existsSync(this.coreValuesFile)) {
        return fs.readFileSync(this.coreValuesFile, 'utf8');
      }
    } catch (e) {}
    return null;
  }

  log(message) {
    console.log(`[PolicyOptimizer] ${message}`);
  }

  /**
   * 优化行为策略
   */
  async optimizeBehaviorPolicies() {
    this.log('Starting policy optimization...');
    
    const trace = this.loadTrace();
    if (!trace.cycles || trace.cycles.length === 0) {
      return { success: false, reason: 'no_history' };
    }

    const analysis = this.analyzeCycles(trace.cycles);
    const newPolicies = this.extractPolicies(analysis);
    
    const validPolicies = await this.validatePolicies(newPolicies);
    
    this.policies.policies = [...this.policies.policies, ...validPolicies];
    this.policies.last_optimization = new Date().toISOString();
    this.savePolicies();

    this.log(`Optimized ${validPolicies.length} new policies`);

    return {
      success: true,
      new_policies: validPolicies.length,
      analysis: analysis.summary
    };
  }

  loadTrace() {
    try {
      if (fs.existsSync(this.traceFile)) {
        return JSON.parse(fs.readFileSync(this.traceFile, 'utf8'));
      }
    } catch (e) {
      return { cycles: [] };
    }
    return { cycles: [] };
  }

  /**
   * 分析历史循环
   */
  analyzeCycles(cycles) {
    const successPatterns = [];
    const failurePatterns = [];

    for (const cycle of cycles) {
      const isSuccess = cycle.status === 'completed';
      const subtasks = cycle.do?.results || [];
      
      const subtaskTypes = subtasks.map(s => s.subtask?.action).filter(Boolean);
      
      if (isSuccess) {
        successPatterns.push(...subtaskTypes);
      } else {
        failurePatterns.push(...subtaskTypes);
      }
    }

    const successCounts = {};
    for (const p of successPatterns) {
      successCounts[p] = (successCounts[p] || 0) + 1;
    }

    const failureCounts = {};
    for (const p of failurePatterns) {
      failureCounts[p] = (failureCounts[p] || 0) + 1;
    }

    return {
      success_patterns: successCounts,
      failure_patterns: failureCounts,
      total_cycles: cycles.length,
      summary: `分析了${cycles.length}个循环，成功${Object.keys(successCounts).length}种模式，失败${Object.keys(failureCounts).length}种模式`
    };
  }

  /**
   * 提取新策略
   */
  extractPolicies(analysis) {
    const policies = [];
    
    const highSuccessActions = Object.entries(analysis.success_patterns)
      .filter(([_, count]) => count >= 2)
      .map(([action]) => action);

    const policyTemplates = {
      'analyze': '先进行全面分析再行动可以提高成功率',
      'modify': '代码修改后必须进行测试验证',
      'identify': '识别模式后应立即采取针对性行动',
      'test': '测试是确保质量的关键步骤'
    };

    for (const action of highSuccessActions) {
      const template = policyTemplates[action] || `执行${action}行动有较高成功率`;
      
      policies.push({
        policy_id: `pol-${Date.now()}-${action}`,
        trigger: `action=${action}`,
        rule: template,
        success_rate: 0.8,
        source: 'autonomous_learning',
        created_at: new Date().toISOString()
      });
    }

    // 基于失败模式生成反向规则
    const highFailureActions = Object.entries(analysis.failure_patterns)
      .filter(([_, count]) => count >= 2)
      .map(([action]) => action);

    for (const action of highFailureActions) {
      policies.push({
        policy_id: `pol-avoid-${Date.now()}-${action}`,
        trigger: `action=${action}`,
        rule: `检测到${action}行动连续失败，建议跳过或更换方案`,
        success_rate: 0.2,
        source: 'failure_learning',
        created_at: new Date().toISOString()
      });
    }

    return policies;
  }

  /**
   * 验证策略（Constitutional AI）
   */
  async validatePolicies(policies) {
    const coreValues = this.loadCoreValues();
    const validPolicies = [];

    for (const policy of policies) {
      const isAligned = this.checkValueAlignment(policy, coreValues);
      
      if (isAligned) {
        validPolicies.push(policy);
      } else {
        this.log(`Policy ${policy.policy_id} rejected: value misalignment`);
      }
    }

    return validPolicies;
  }

  /**
   * 检查价值观对齐
   */
  checkValueAlignment(policy, coreValues) {
    if (!coreValues) return true;
    
    const positiveValues = ['心流', '帮助', '提升', '用户', '体验', 'flow', 'user', 'improve'];
    const content = policy.rule.toLowerCase();
    
    return positiveValues.some(v => content.includes(v));
  }

  /**
   * 获取当前策略
   */
  getPolicies() {
    return this.policies;
  }

  /**
   * 匹配策略
   */
  matchPolicy(context) {
    const contextStr = JSON.stringify(context).toLowerCase();
    
    for (const policy of this.policies.policies) {
      if (contextStr.includes(policy.trigger)) {
        return policy;
      }
    }
    
    return null;
  }

  /**
   * 生成月度摘要
   */
  async generateMonthlySummary() {
    const trace = this.loadTrace();
    const completed = trace.completed_goals || [];
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonth = completed.filter(c => 
      new Date(c.completed_at) >= monthStart
    );

    const summary = {
      month: now.toISOString().substring(0, 7),
      completed_goals: thisMonth.length,
      new_policies: this.policies.policies.filter(p => 
        new Date(p.created_at) >= monthStart
      ).length,
      timestamp: now.toISOString()
    };

    // 保存摘要
    let summaries = [];
    try {
      if (fs.existsSync(this.summaryFile)) {
        summaries = JSON.parse(fs.readFileSync(this.summaryFile, 'utf8'));
      }
    } catch (e) {
      summaries = [];
    }
    
    summaries.push(summary);
    fs.writeFileSync(this.summaryFile, JSON.stringify(summaries, null, 2));

    return summary;
  }

  getStatus() {
    return {
      policies_count: this.policies.policies.length,
      last_optimization: this.policies.last_optimization,
      high_success_rate: this.policies.policies.filter(p => p.success_rate >= 0.7).length
    };
  }
}

module.exports = { PolicyOptimizer };
