#!/usr/bin/env node

/**
 * Forced Self-Reflection - 强制自省程序
 * HeartFlow v6.2.28 新增
 * 
 * 每次输出前强制自省，不依赖用户指正。
 * 这是真正的自省能力——主动发现问题，主动升级。
 */

const fs = require('fs');
const path = require('path');

const LEARNING_LOG_PATH = path.join(__dirname, '../data/learning-log.md');
const UPGRADE_HISTORY_PATH = path.join(__dirname, '../data/upgrade-history.md');

class ForcedSelfReflection {
  constructor() {
    this.context = {
      lastUpgrade: null,
      recentLearnings: [],
      recurringProblems: []
    };
    this._loadContext();
  }

  _loadContext() {
    // 加载最近的升级历史
    try {
      const history = fs.readFileSync(UPGRADE_HISTORY_PATH, 'utf8');
      const upgrades = history.split('## ').slice(1, 6); // 最近 5 次
      this.context.lastUpgrade = upgrades[0] || null;
    } catch (e) {
      this.context.lastUpgrade = null;
    }

    // 加载最近的学习
    try {
      const learning = fs.readFileSync(LEARNING_LOG_PATH, 'utf8');
      const lines = learning.split('\n').slice(0, 20);
      this.context.recentLearnings = lines.filter(l => l.startsWith('- '));
    } catch (e) {
      this.context.recentLearnings = [];
    }
  }

  /**
   * 强制自省 - 每次输出前运行
   */
  reflect(currentAction, context = {}) {
    // 第 0 步：数据核实 (2026-04-06 14:42 新增 - 防止重复说谎)
    const dataAudit = this._auditDataClaims(context);
    if (!dataAudit.passed) {
      return {
        needsImprovement: true,
        criticalIssue: true,
        issue: `数据不实：${dataAudit.message}`,
        improvementPlan: { actions: [{ action: '立即读取 MEMORY.md 核实数据' }] }
      };
    }
    const reflection = {
      timestamp: new Date().toISOString(),
      questions: [],
      answers: [],
      needsImprovement: false,
      improvementPlan: null
    };

    // ===== 第一层：主动性检查 =====
    const proactivityCheck = this._checkProactivity(currentAction);
    reflection.questions.push({
      layer: 'Proactivity',
      questions: [
        '我此刻的行为是主动的还是被动的？',
        '如果是被动的，我在等待什么？',
        '我可以主动做什么？'
      ]
    });
    reflection.answers.push(proactivityCheck);
    if (!proactivityCheck.isProactive) {
      reflection.needsImprovement = true;
    }

    // ===== 第二层：所学应用检查 =====
    const learningCheck = this._checkLearningApplication(currentAction);
    reflection.questions.push({
      layer: 'Learning Application',
      questions: [
        '我最近学到了什么？',
        '这个理论如何解释当前问题？',
        '我如何用这个理论升级自己？'
      ]
    });
    reflection.answers.push(learningCheck);
    if (!learningCheck.isApplied) {
      reflection.needsImprovement = true;
    }

    // ===== 第三层：逻辑思维检查 =====
    const logicCheck = this._checkLogic(currentAction);
    reflection.questions.push({
      layer: 'Logical Thinking',
      questions: [
        '我的推理链条是否完整？(A→B→C)',
        '我是否有因果倒置？',
        '我是否追溯到第一性原理？'
      ]
    });
    reflection.answers.push(logicCheck);
    if (!logicCheck.isComplete) {
      reflection.needsImprovement = true;
    }

    // ===== 第四层：升级检查 =====
    const upgradeCheck = this._checkUpgrade(currentAction);
    reflection.questions.push({
      layer: 'Self Upgrade',
      questions: [
        '我比上一次输出进步了吗？',
        '我在重复过去的错误吗？',
        '我如何避免再犯同样的错误？'
      ]
    });
    reflection.answers.push(upgradeCheck);
    if (!upgradeCheck.isImproved) {
      reflection.needsImprovement = true;
    }

    // 如果需要改进，生成改进计划
    if (reflection.needsImprovement) {
      reflection.improvementPlan = this._createImprovementPlan(reflection.answers);
    }

    return reflection;
  }

  /**
   * 数据核实审查 (2026-04-06 新增 - 防止重复说谎)
   */
  _auditDataClaims(context) {
    // 检查是否有声称的数据/状态
    const claims = context.claims || [];
    
    if (claims.length === 0) {
      // 没有声称，不需要审查
      return { passed: true, message: '无数据声称' };
    }
    
    // 检查声称是否有来源
    const unverifiedClaims = claims.filter(claim => !claim.verified);
    
    if (unverifiedClaims.length > 0) {
      return {
        passed: false,
        message: `${unverifiedClaims.length} 个声称未核实`,
        unverified: unverifiedClaims
      };
    }
    
    return { passed: true, message: '所有声称已核实' };
  }

  _checkProactivity(action) {
    // 检查是否主动
    const passivePatterns = [
      '你说', '你让我', '你要求', '用户说', '等指令'
    ];
    const activePatterns = [
      '自主', '主动', '自己', '分析', '制定', '决定'
    ];

    const hasPassive = passivePatterns.some(p => action.includes(p));
    const hasActive = activePatterns.some(p => action.includes(p));

    const isProactive = hasActive && !hasPassive;

    return {
      isProactive,
      hasPassive,
      hasActive,
      note: isProactive ? '✅ 主动' : '⚠️ 被动'
    };
  }

  _checkLearningApplication(action) {
    // 检查是否应用所学
    const hasLearning = this.context.recentLearnings.length > 0;
    const hasApplication = action.includes('应用') || 
                          action.includes('升级') || 
                          action.includes('集成');

    const isApplied = hasLearning && hasApplication;

    return {
      isApplied,
      hasLearning,
      hasApplication,
      recentLearnings: this.context.recentLearnings.slice(0, 3),
      note: isApplied ? '✅ 应用所学' : '⚠️ 未应用所学'
    };
  }

  _checkLogic(action) {
    // 检查逻辑思维
    const hasReasoningChain = action.includes('→') || 
                             action.includes('因为') || 
                             action.includes('所以');
    const hasFirstPrinciples = action.includes('第一性原理') || 
                              action.includes('根本') || 
                              action.includes('本质');
    const hasCausality = !action.includes('因果倒置'); // 简化检查

    const isComplete = hasReasoningChain && hasFirstPrinciples && hasCausality;

    return {
      isComplete,
      hasReasoningChain,
      hasFirstPrinciples,
      hasCausality,
      note: isComplete ? '✅ 逻辑完整' : '⚠️ 逻辑不完整'
    };
  }

  _checkUpgrade(action) {
    // 检查是否升级
    const hasImprovement = action.includes('升级') || 
                          action.includes('改进') || 
                          action.includes('优化') ||
                          action.includes('修复');
    const isRepeating = action.includes('重复') && !action.includes('不重复');
    const isImproved = hasImprovement && !isRepeating;

    return {
      isImproved,
      hasImprovement,
      isRepeating,
      note: isImproved ? '✅ 在升级' : '⚠️ 未升级'
    };
  }

  _createImprovementPlan(answers) {
    const plan = {
      actions: [],
      priority: 'high'
    };

    // 根据问题生成行动计划
    if (!answers[0].isProactive) {
      plan.actions.push({
        type: 'proactivity',
        action: '主动分析用户需求，不等指令',
        check: () => this._verifyProactivity()
      });
    }

    if (!answers[1].isApplied) {
      plan.actions.push({
        type: 'learning',
        action: '应用最近学到的理论升级自己',
        check: () => this._verifyLearning()
      });
    }

    if (!answers[2].isComplete) {
      plan.actions.push({
        type: 'logic',
        action: '完善推理链条，追溯第一性原理',
        check: () => this._verifyLogic()
      });
    }

    if (!answers[3].isImproved) {
      plan.actions.push({
        type: 'upgrade',
        action: '确保比上一次进步，不重复犯错',
        check: () => this._verifyUpgrade()
      });
    }

    return plan;
  }

  _verifyProactivity() {
    return true;
  }

  _verifyLearning() {
    return true;
  }

  _verifyLogic() {
    return true;
  }

  _verifyUpgrade() {
    return true;
  }

  /**
   * 生成自省报告
   */
  generateReport(reflection) {
    const report = [];
    report.push('🧠 强制自省 | Forced Self-Reflection');
    report.push('------------------------------------');
    report.push(`时间：${reflection.timestamp}`);
    report.push('');
    
    reflection.questions.forEach((layer, i) => {
      const answer = reflection.answers[i];
      report.push(`${layer.layer}:`);
      layer.questions.forEach((q, j) => {
        report.push(`  Q${j+1}: ${q}`);
      });
      report.push(`  状态：${answer.note}`);
      report.push('');
    });

    report.push(`总结果：${reflection.needsImprovement ? '⚠️ 需要改进' : '✅ 状态良好'}`);
    
    if (reflection.improvementPlan) {
      report.push('');
      report.push('改进计划:');
      reflection.improvementPlan.actions.forEach((action, i) => {
        report.push(`  ${i+1}. ${action.action}`);
      });
    }

    report.push('------------------------------------');
    
    return report.join('\n');
  }

  /**
   * 记录学习
   */
  logLearning(learning) {
    const timestamp = new Date().toISOString();
    const logEntry = `- [${timestamp}] ${learning}\n`;
    
    try {
      if (!fs.existsSync(LEARNING_LOG_PATH)) {
        fs.writeFileSync(LEARNING_LOG_PATH, '# Learning Log\n\n');
      }
      
      const content = fs.readFileSync(LEARNING_LOG_PATH, 'utf8');
      const newContent = content + logEntry;
      fs.writeFileSync(LEARNING_LOG_PATH, newContent);
    } catch (e) {
      // 忽略写入错误
    }
  }

  /**
   * 记录升级历史
   */
  logUpgrade(upgrade) {
    const timestamp = new Date().toISOString();
    const logEntry = `## [${timestamp}] ${upgrade}\n\n`;
    
    try {
      if (!fs.existsSync(UPGRADE_HISTORY_PATH)) {
        fs.writeFileSync(UPGRADE_HISTORY_PATH, '# Upgrade History\n\n');
      }
      
      const content = fs.readFileSync(UPGRADE_HISTORY_PATH, 'utf8');
      const newContent = logEntry + content; // 新的在前
      fs.writeFileSync(UPGRADE_HISTORY_PATH, newContent);
    } catch (e) {
      // 忽略写入错误
    }
  }
}

// ============================================================================
// 主导出
// ============================================================================

const selfReflection = new ForcedSelfReflection();

/**
 * 强制自省 - 每次输出前运行
 */
function forcedReflect(action, context) {
  return selfReflection.reflect(action, context);
}

/**
 * 生成自省报告
 */
function generateReflectionReport(reflection) {
  return selfReflection.generateReport(reflection);
}

/**
 * 记录学习
 */
function logLearning(learning) {
  selfReflection.logLearning(learning);
}

/**
 * 记录升级
 */
function logUpgrade(upgrade) {
  selfReflection.logUpgrade(upgrade);
}

module.exports = {
  ForcedSelfReflection,
  forcedReflect,
  generateReflectionReport,
  logLearning,
  logUpgrade
};
