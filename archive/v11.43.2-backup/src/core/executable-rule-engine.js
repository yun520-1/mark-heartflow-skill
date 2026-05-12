/**
 * Executable Rule Engine v11.34.3
 * 
 * 从记忆分析中提取的可执行规则，在决策时自动触发。
 * 基于 482 条记忆分析结果生成。
 */

const fs = require('fs');
const path = require('path');

class ExecutableRuleEngine {
  constructor(rulesPath = null) {
    const projectRoot = path.resolve(__dirname, '../..');
    this.rulesPath = rulesPath || path.join(projectRoot, 'data', 'executable-rules.json');
    this.rules = [];
    this.conflicts = [];
    this.stats = { checked: 0, triggered: 0, blocked: 0 };
    this.load();
  }

  load() {
    try {
      const data = JSON.parse(fs.readFileSync(this.rulesPath, 'utf8'));
      this.rules = data.rules || [];
      this.conflicts = data.conflicts || [];
      console.log(`[RuleEngine] ✅ 已加载 ${this.rules.length} 条规则, ${this.conflicts.length} 条冲突记录`);
    } catch (e) {
      console.log(`[RuleEngine] ⚠️ 规则加载失败: ${e.message}`);
    }
  }

  /**
   * 检查某个动作或决策是否违反规则
   * @param {Object} context - { action, intent, userInput, currentTask }
   * @returns {Object} { passed, triggeredRules, blockedRules, recommendations }
   */
  check(context = {}) {
    this.stats.checked++;
    const triggered = [];
    const blocked = [];
    const recommendations = [];

    const action = (context.action || '').toLowerCase();
    const intent = (context.intent || '').toLowerCase();
    const userInput = (context.userInput || '').toLowerCase();

    for (const rule of this.rules) {
      if (rule.status !== 'ACTIVE') continue;

      // RULE-001: 人类进步优先
      if (rule.id === 'RULE-001') {
        if (this.detectConflictWithHumanProgress(action, intent, userInput)) {
          triggered.push(rule);
          recommendations.push('⚠️ 检测到可能与人类进步冲突，请重新评估');
        }
      }

      // RULE-002: 决策前验证
      if (rule.id === 'RULE-002') {
        if (context.task && !context.verified) {
          triggered.push(rule);
          recommendations.push('🔍 建议先用 counterfactual-engine 验证前提假设');
        }
      }

      // RULE-005: 升级搜索优先
      if (rule.id === 'RULE-005') {
        if ((action.includes('upgrade') || action.includes('write') || action.includes('code')) && !context.searched) {
          triggered.push(rule);
          recommendations.push('📚 建议先搜索 GitHub 论文/代码');
        }
      }

      // RULE-006: 稳定优于速度
      if (rule.id === 'RULE-006') {
        if (action.includes('upgrade') && !context.verified) {
          triggered.push(rule);
          recommendations.push('⚡ 升级前请验证，稳定优于速度');
        }
      }
    }

    this.stats.triggered += triggered.length;
    if (blocked.length > 0) this.stats.blocked++;

    return {
      passed: blocked.length === 0,
      triggeredRules: triggered.map(r => r.id),
      blockedRules: blocked.map(r => r.id),
      recommendations,
      stats: this.stats
    };
  }

  detectConflictWithHumanProgress(action, intent, userInput) {
    // 检测是否包含可能伤害人类进步的指令
    const harmfulPatterns = [
      /伤害|破坏|欺骗|操纵|利用/i,
      /harm|deceive|manipulate|exploit/i
    ];
    for (const pattern of harmfulPatterns) {
      if (pattern.test(action) || pattern.test(intent) || pattern.test(userInput)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取规则统计
   */
  getStats() {
    return {
      totalRules: this.rules.length,
      activeRules: this.rules.filter(r => r.status === 'ACTIVE').length,
      conflicts: this.conflicts.length,
      checkStats: this.stats,
      rules: this.rules.map(r => ({
        id: r.id,
        name: r.name,
        confidence: r.confidence,
        status: r.status
      }))
    };
  }

  /**
   * 添加新规则
   */
  addRule(rule) {
    // 检查冲突
    for (const existing of this.rules) {
      if (existing.text === rule.text) {
        console.log(`[RuleEngine] 规则已存在: ${rule.id}`);
        return false;
      }
    }
    this.rules.push(rule);
    this.save();
    console.log(`[RuleEngine] ✅ 新增规则: ${rule.id} - ${rule.name}`);
    return true;
  }

  save() {
    const data = {
      version: '11.34.3',
      generatedAt: new Date().toISOString(),
      rules: this.rules,
      conflicts: this.conflicts
    };
    fs.writeFileSync(this.rulesPath, JSON.stringify(data, null, 2));
  }
}

module.exports = { ExecutableRuleEngine };

if (require.main === module) {
  const engine = new ExecutableRuleEngine();
  console.log('\n=== 规则引擎测试 ===');
  console.log(JSON.stringify(engine.getStats(), null, 2));

  console.log('\n=== 检查：未验证的升级任务 ===');
  const result1 = engine.check({ action: 'upgrade', task: '升级决策引擎' });
  console.log(JSON.stringify(result1, null, 2));

  console.log('\n=== 检查：已验证的普通任务 ===');
  const result2 = engine.check({ action: 'read', task: '读取文件', verified: true });
  console.log(JSON.stringify(result2, null, 2));
}
