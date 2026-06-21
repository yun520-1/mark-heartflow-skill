/**
 * IntentionTracker - 意图追踪器
 * 来源: claude-clarity v1.8.2 吸收集成
 * 基于用户初始设定的意图进行追踪和干预
 */
class IntentionTracker {
  constructor() {
    this.primaryGoal = null;
    this.subGoals = [];
    this.goalProgress = { completed: 0, total: 0, percentage: 0 };
    this.deviationHistory = [];
    this.nudgeConfig = { enabled: true, sensitivity: 'medium', maxNudgesPerSession: 5, nudgeCount: 0, coolDownMinutes: 5 };
    this.domainKeywords = {
      development: ['开发', '代码', '编程', '实现', '功能', '模块', 'API', '接口', '后端', '前端'],
      design: ['设计', 'UI', '界面', '表单', '样式', '布局', '视觉'],
      testing: ['测试', '调试', 'bug', '问题', '验证'],
      documentation: ['文档', '说明', '手册', '注释', 'README'],
      login: ['登录', '注册', '用户', '认证', '权限', '密码', '账号']
    };
  }

  setPrimaryGoal(goal, subGoals = []) {
    const domain = this.detectDomain(goal);
    this.primaryGoal = { description: goal, setAt: new Date().toISOString(), keywords: this.extractKeywords(goal), domain, completed: false };
    this.subGoals = subGoals.map(g => ({ description: g, keywords: this.extractKeywords(g), completed: false }));
    this.goalProgress.total = subGoals.length > 0 ? subGoals.length : 1;
    this.goalProgress.completed = 0;
    this.goalProgress.percentage = 0;
    this.nudgeConfig.nudgeCount = 0;
    return { success: true, goal: this.primaryGoal.description, subGoalsCount: this.subGoals.length, domain: this.primaryGoal.domain };
  }

  detectDomain(text) {
    const textLower = text.toLowerCase();
    const domains = [];
    Object.entries(this.domainKeywords).forEach(([domain, keywords]) => {
      const matchCount = keywords.filter(k => textLower.includes(k)).length;
      if (matchCount > 0) domains.push({ domain, count: matchCount });
    });
    domains.sort((a, b) => b.count - a.count);
    return domains.length > 0 ? domains[0].domain : 'general';
  }

  extractKeywords(text) {
    if (!text) return [];
    const allKeywords = [];
    Object.values(this.domainKeywords).forEach(keywords => allKeywords.push(...keywords));
    const textLower = text.toLowerCase();
    const matched = allKeywords.filter(term => textLower.includes(term));
    if (matched.length === 0) {
      const words = text.replace(/[，。！？、；：""''（）()【】\[\]《》<>]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
      return [...new Set(words)];
    }
    return [...new Set(matched)];
  }

  checkDeviation(userInput) {
    if (!this.primaryGoal) return { isDeviation: false, confidence: 0, message: '未设定目标' };
    const inputKeywords = this.extractKeywords(userInput);
    const inputDomain = this.detectDomain(userInput);
    const goalKeywords = this.primaryGoal.keywords;
    const goalDomain = this.primaryGoal.domain;
    const overlap = inputKeywords.filter(k => goalKeywords.includes(k));
    const overlapRatio = inputKeywords.length > 0 ? overlap.length / inputKeywords.length : 0;
    const sameDomain = inputDomain === goalDomain || goalDomain === 'general';
    const isDeviation = overlapRatio < 0.5 && !sameDomain;
    if (isDeviation) this.deviationHistory.push({ input: userInput.substring(0, 50), overlapRatio, inputDomain, goalDomain, timestamp: new Date().toISOString() });
    return { isDeviation, isRelated: overlapRatio > 0.3 || sameDomain, confidence: Math.round(overlapRatio * 100), sameDomain, inputDomain, goalDomain, overlap: overlap.length, totalKeywords: inputKeywords.length };
  }

  generateNudge(deviationResult) {
    if (!this.nudgeConfig.enabled || this.nudgeConfig.nudgeCount >= this.nudgeConfig.maxNudgesPerSession || !deviationResult.isDeviation) return null;
    const c = deviationResult.confidence;
    let nudge = null;
    if (c < 20) nudge = `我们现在的目标是「${this.primaryGoal.description}」，当前讨论似乎与目标关系不大。是否要先完成主要目标？`;
    else if (c < 50) nudge = `提醒：主要目标是「${this.primaryGoal.description}」。当前话题要继续吗，还是先回到主任务？`;
    else nudge = `当前目标：「${this.primaryGoal.description}」。需要我帮你继续推进吗？`;
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

  getProgress() { return { primaryGoal: this.primaryGoal?.description || null, progress: this.goalProgress, subGoals: this.subGoals, deviationCount: this.deviationHistory.length, nudgeCount: this.nudgeConfig.nudgeCount }; }
  reset() { this.primaryGoal = null; this.subGoals = []; this.goalProgress = { completed: 0, total: 0, percentage: 0 }; this.deviationHistory = []; this.nudgeConfig.nudgeCount = 0; return { success: true }; }
}

module.exports = { IntentionTracker };
