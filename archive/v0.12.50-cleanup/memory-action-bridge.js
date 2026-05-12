/**
 * Memory-Action Bridge v11.34.4
 * 
 * 将记忆系统中的教训自动注入到任务执行流程中。
 * 解决"有记忆但不用"的问题。
 */

const fs = require('fs');
const path = require('path');

class MemoryActionBridge {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.rules = this.loadRules();
    this.stats = { queries: 0, hits: 0, misses: 0 };
  }

  loadRules() {
    try {
      const rulesPath = path.join(this.baseDir, 'data', 'executable-rules.json');
      if (!fs.existsSync(rulesPath)) return [];
      const data = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      return data.rules.filter(r => r.status === 'ACTIVE');
    } catch (e) {
      console.log('[MemoryActionBridge] ⚠️ 规则加载失败:', e.message);
      return [];
    }
  }

  /**
   * 在执行任务前调用，自动注入相关记忆/规则
   * @param {Object} task - { type, description, keywords }
   * @returns {Object} { injections, warnings, relevantMemories }
   */
  beforeExecute(task = {}) {
    this.stats.queries++;
    const injections = [];
    const warnings = [];
    const relevantMemories = [];

    const description = (task.description || '').toLowerCase();
    const type = (task.type || '').toLowerCase();
    const keywords = (task.keywords || []).map(k => k.toLowerCase());

    // RULE-001: 人类进步优先 - 全局触发
    const rule1 = this.rules.find(r => r.id === 'RULE-001');
    if (rule1) {
      relevantMemories.push({
        rule: rule1.name,
        text: rule1.text,
        confidence: rule1.confidence
      });
    }

    // 升级类任务
    if (type.includes('upgrade') || type.includes('升级') || description.includes('upgrade') || description.includes('升级')) {
      this._injectUpgradeRules(injections, warnings, relevantMemories);
    }

    // 决策类任务
    if (type.includes('decision') || type.includes('决策') || description.includes('decision') || description.includes('决策')) {
      this._injectDecisionRules(injections, warnings, relevantMemories);
    }

    // 记忆类任务
    if (type.includes('memory') || type.includes('记忆') || description.includes('memory') || description.includes('记忆')) {
      this._injectMemoryRules(injections, warnings, relevantMemories);
    }

    // 代码类任务
    if (type.includes('code') || type.includes('代码') || description.includes('code') || description.includes('代码')) {
      this._injectCodeRules(injections, warnings, relevantMemories);
    }

    if (relevantMemories.length > 0) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    return { injections, warnings, relevantMemories, stats: this.stats };
  }

  _injectUpgradeRules(injections, warnings, memories) {
    // RULE-005: 升级搜索优先
    const rule5 = this.rules.find(r => r.id === 'RULE-005');
    if (rule5) {
      injections.push('📚 ' + rule5.text);
      memories.push({ rule: rule5.name, text: rule5.text, confidence: rule5.confidence });
    }

    // RULE-006: 稳定优于速度
    const rule6 = this.rules.find(r => r.id === 'RULE-006');
    if (rule6) {
      warnings.push('⚡ ' + rule6.text);
      memories.push({ rule: rule6.name, text: rule6.text, confidence: rule6.confidence });
    }

    // RULE-002: 决策前验证
    const rule2 = this.rules.find(r => r.id === 'RULE-002');
    if (rule2) {
      warnings.push('🔍 ' + rule2.text);
      memories.push({ rule: rule2.name, text: rule2.text, confidence: rule2.confidence });
    }
  }

  _injectDecisionRules(injections, warnings, memories) {
    const rule2 = this.rules.find(r => r.id === 'RULE-002');
    if (rule2) {
      injections.push('🔍 ' + rule2.text);
      memories.push({ rule: rule2.name, text: rule2.text, confidence: rule2.confidence });
    }
  }

  _injectMemoryRules(injections, warnings, memories) {
    const rule3 = this.rules.find(r => r.id === 'RULE-003');
    if (rule3) {
      injections.push('⏰ ' + rule3.text);
      memories.push({ rule: rule3.name, text: rule3.text, confidence: rule3.confidence });
    }

    const rule4 = this.rules.find(r => r.id === 'RULE-004');
    if (rule4) {
      injections.push('💪 ' + rule4.text);
      memories.push({ rule: rule4.name, text: rule4.text, confidence: rule4.confidence });
    }
  }

  _injectCodeRules(injections, warnings, memories) {
    const rule5 = this.rules.find(r => r.id === 'RULE-005');
    if (rule5) {
      injections.push('📚 ' + rule5.text);
      memories.push({ rule: rule5.name, text: rule5.text, confidence: rule5.confidence });
    }
  }

  /**
   * 在执行任务后调用，记录结果到记忆
   * @param {Object} result - { success, lessons, newKnowledge }
   */
  afterExecute(result = {}) {
    if (result.success && result.lessons) {
      console.log('[MemoryActionBridge] 📝 记录教训: ' + result.lessons.slice(0, 100));
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      rulesLoaded: this.rules.length,
      ...this.stats,
      hitRate: this.stats.queries > 0
        ? (this.stats.hits / this.stats.queries).toFixed(2)
        : 0
    };
  }
}

module.exports = { MemoryActionBridge };

// CLI 测试
if (require.main === module) {
  const bridge = new MemoryActionBridge(process.argv[2] || '.');

  console.log('=== Memory-Action Bridge v11.34.4 ===\n');

  const tasks = [
    { type: 'upgrade', description: '升级 HeartFlow 到新版本' },
    { type: 'decision', description: '选择最佳的升级方案' },
    { type: 'memory', description: '保存新的学习成果到记忆系统' },
    { type: 'code', description: '写一个新的记忆管理模块' },
    { type: 'read', description: '读取文件内容' },
  ];

  tasks.forEach((task, i) => {
    console.log('--- 任务 ' + (i + 1) + ': ' + task.type + ' ---');
    const result = bridge.beforeExecute(task);
    if (result.injections.length) {
      console.log('  注入:');
      result.injections.forEach(inj => console.log('    ' + inj));
    }
    if (result.warnings.length) {
      console.log('  警告:');
      result.warnings.forEach(w => console.log('    ' + w));
    }
    if (result.relevantMemories.length) {
      console.log('  相关记忆: ' + result.relevantMemories.length + ' 条');
    } else {
      console.log('  (无相关记忆注入)');
    }
    console.log();
  });

  console.log('=== 统计 ===');
  console.log(JSON.stringify(bridge.getStats(), null, 2));
}
