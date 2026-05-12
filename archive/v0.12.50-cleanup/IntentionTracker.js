/**
 * IntentionTracker - 意图追踪器
 * 基于用户初始设定的意图进行追踪和干预
 */

class IntentionTracker {
  constructor() {
    this.primaryGoal = null;
    this.subGoals = [];
    this.goalProgress = { completed: 0, total: 0, percentage: 0 };
    this.deviationHistory = [];
    this.nudgeConfig = {
      enabled: true,
      sensitivity: 'medium',
      maxNudgesPerSession: 5,
      nudgeCount: 0,
      coolDownMinutes: 5
    };
    
    // 领域相关词库
    this.domainKeywords = {
      development: ['开发', '代码', '编程', '实现', '功能', '模块', 'API', '接口', '后端', '前端'],
      design: ['设计', 'UI', '界面', '表单', '样式', '布局', '视觉'],
      testing: ['测试', '调试', 'bug', '问题', '验证'],
      documentation: ['文档', '说明', '手册', '注释', 'README'],
      login: ['登录', '注册', '用户', '认证', '权限', '密码', '账号']
    };
  }

  setPrimaryGoal(goal, subGoals = []) {
    // 检测目标所属领域
    const domain = this.detectDomain(goal);
    
    this.primaryGoal = {
      description: goal,
      setAt: new Date().toISOString(),
      keywords: this.extractKeywords(goal),
      domain,
      completed: false
    };
    
    this.subGoals = subGoals.map(g => ({
      description: g,
      keywords: this.extractKeywords(g),
      completed: false
    }));
    
    this.goalProgress.total = subGoals.length > 0 ? subGoals.length : 1;
    this.goalProgress.completed = 0;
    this.goalProgress.percentage = 0;
    this.nudgeConfig.nudgeCount = 0;
    
    return {
      success: true,
      goal: this.primaryGoal.description,
      subGoalsCount: this.subGoals.length,
      domain: this.primaryGoal.domain
    };
  }

  /**
   * 检测目标所属领域
   */
  detectDomain(text) {
    const textLower = text.toLowerCase();
    const domains = [];
    
    Object.entries(this.domainKeywords).forEach(([domain, keywords]) => {
      const matchCount = keywords.filter(k => textLower.includes(k)).length;
      if (matchCount > 0) {
        domains.push({ domain, count: matchCount });
      }
    });
    
    // 返回匹配最多的领域
    domains.sort((a, b) => b.count - a.count);
    return domains.length > 0 ? domains[0].domain : 'general';
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    if (!text) return [];
    
    const allKeywords = [];
    Object.values(this.domainKeywords).forEach(keywords => {
      allKeywords.push(...keywords);
    });
    
    const textLower = text.toLowerCase();
    const matched = allKeywords.filter(term => textLower.includes(term));
    
    if (matched.length === 0) {
      const words = text.replace(/[，。！？、；："'""''（）()【】\[\]《》<>]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2);
      return [...new Set(words)];
    }
    
    return [...new Set(matched)];
  }

  /**
   * 检查偏离
   */
  checkDeviation(userInput) {
    if (!this.primaryGoal) {
      return { isDeviation: false, confidence: 0, message: '未设定目标' };
    }
    
    const inputKeywords = this.extractKeywords(userInput);
    const inputDomain = this.detectDomain(userInput);
    const goalKeywords = this.primaryGoal.keywords;
    const goalDomain = this.primaryGoal.domain;
    
    // 计算关键词重叠
    const overlap = inputKeywords.filter(k => goalKeywords.includes(k));
    const overlapRatio = inputKeywords.length > 0 ? overlap.length / inputKeywords.length : 0;
    
    // 领域一致性
    const sameDomain = inputDomain === goalDomain || goalDomain === 'general';
    
    // 综合判断
    const isRelated = overlapRatio > 0.3 || sameDomain;
    const isDeviation = overlapRatio < 0.5 && !sameDomain;
    
    if (isDeviation) {
      this.deviationHistory.push({
        input: userInput.substring(0, 50),
        overlapRatio,
        inputDomain,
        goalDomain,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      isDeviation,
      isRelated,
      confidence: Math.round(overlapRatio * 100),
      sameDomain,
      inputDomain,
      goalDomain,
      overlap: overlap.length,
      totalKeywords: inputKeywords.length
    };
  }

  /**
   * 生成干预
   */
  generateNudge(deviationResult) {
    if (!this.nudgeConfig.enabled) return null;
    if (this.nudgeConfig.nudgeCount >= this.nudgeConfig.maxNudgesPerSession) return null;
    if (!deviationResult.isDeviation) return null;
    
    const confidence = deviationResult.confidence;
    let nudge = null;
    
    if (confidence < 20) {
      nudge = `💭 我们现在的目标是「${this.primaryGoal.description}」，当前讨论似乎与目标关系不大。是否要先完成主要目标？`;
    } else if (confidence < 50) {
      nudge = `🎯 提醒：主要目标是「${this.primaryGoal.description}」。当前话题要继续吗，还是先回到主任务？`;
    } else {
      nudge = `📌 当前目标：「${this.primaryGoal.description}」。需要我帮你继续推进吗？`;
    }
    
    this.nudgeConfig.nudgeCount += 1;
    return nudge;
  }

  updateSubGoal(index, completed) {
    if (index >= 0 && index < this.subGoals.length) {
      this.subGoals[index].completed = completed;
      this.goalProgress.completed = this.subGoals.filter(g => g.completed).length;
      this.goalProgress.percentage = Math.round((this.goalProgress.completed / this.goalProgress.total) * 100);
      return true;
    }
    return false;
  }

  getProgress() {
    return {
      primaryGoal: this.primaryGoal?.description || null,
      progress: this.goalProgress,
      subGoals: this.subGoals,
      deviationCount: this.deviationHistory.length,
      nudgeCount: this.nudgeConfig.nudgeCount
    };
  }

  generateProgressReport() {
    if (!this.primaryGoal) {
      return '📋 尚未设定目标\n\n请告诉我你今天的主要目标是什么？';
    }
    
    let report = '📋 目标追踪报告\n\n';
    report += '═'.repeat(40) + '\n\n';
    report += `主要目标：${this.primaryGoal.description}\n`;
    report += `设定时间：${this.primaryGoal.setAt}\n\n`;
    
    if (this.subGoals.length > 0) {
      report += '子目标进度:\n';
      this.subGoals.forEach((g, i) => {
        const icon = g.completed ? '✅' : '⏳';
        report += `  ${icon} ${i + 1}. ${g.description}\n`;
      });
      report += `\n总进度：${this.goalProgress.percentage}%\n\n`;
    }
    
    report += `偏离次数：${this.deviationHistory.length} 次\n`;
    report += `干预次数：${this.nudgeConfig.nudgeCount}/${this.nudgeConfig.maxNudgesPerSession}\n`;
    report += '\n' + '═'.repeat(40) + '\n';
    
    return report;
  }

  reset() {
    this.primaryGoal = null;
    this.subGoals = [];
    this.goalProgress = { completed: 0, total: 0, percentage: 0 };
    this.deviationHistory = [];
    this.nudgeConfig.nudgeCount = 0;
    return { success: true, message: '意图追踪器已重置' };
  }

  setNudgeConfig(config) {
    if (config.enabled !== undefined) this.nudgeConfig.enabled = config.enabled;
    if (config.sensitivity !== undefined) this.nudgeConfig.sensitivity = config.sensitivity;
    if (config.maxNudgesPerSession !== undefined) this.nudgeConfig.maxNudgesPerSession = config.maxNudgesPerSession;
    return { success: true, config: this.nudgeConfig };
  }
}

const intentionTracker = new IntentionTracker();

module.exports = IntentionTracker;
module.exports.intentionTracker = intentionTracker;
module.exports.setPrimaryGoal = (goal, subGoals) => intentionTracker.setPrimaryGoal(goal, subGoals);
module.exports.checkDeviation = (input) => intentionTracker.checkDeviation(input);
module.exports.generateNudge = (deviationResult) => intentionTracker.generateNudge(deviationResult);
module.exports.getProgress = () => intentionTracker.getProgress();
module.exports.generateProgressReport = () => intentionTracker.generateProgressReport();
