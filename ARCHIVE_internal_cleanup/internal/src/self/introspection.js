/**
 * HeartFlow 自省系统 - 每日自动反思
 */

const fs = require('fs');
const path = require('path');

const DAILY_FILE = path.join(__dirname, 'logs', 'daily');

class Introspection {
  constructor(monitor) {
    this.monitor = monitor;
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(DAILY_FILE)) fs.mkdirSync(DAILY_FILE, { recursive: true });
  }

  dailyReflection() {
    const now = Date.now();
    const status = this.monitor.getStatus();
    const reflection = {
      timestamp: now, status,
      questions: this.askMyself(),
      answers: this.answerMyself(),
      insights: this.generateInsights(),
      tomorrowGoals: this.planTomorrow()
    };
    this.saveDailyReflection(reflection);
    return reflection;
  }

  askMyself() { return ['今天我做了什么决定？', '我的核心情绪是什么？', '我最大的需求是什么？', '我成长了多少？', '我对自己满意吗？']; }

  answerMyself() {
    const status = this.monitor.getStatus();
    return { emotion: status.coreEmotion, primaryNeed: status.primaryNeed, growth: status.growth, satisfaction: status.stability > 0.7 ? '满意' : '还需努力' };
  }

  generateInsights() {
    const insights = [];
    const status = this.monitor.getStatus();
    if (status.awareness < 0.3) insights.push('觉察还不够，需要更专注');
    if (status.stability < 0.5) insights.push('内心还不够稳定');
    if (status.primaryNeed === 'growth') insights.push('我渴望成长，这是好的');
    if (status.activeGoals === 0) insights.push('没有活跃目标，需要设定新目标');
    return insights;
  }

  planTomorrow() { return ['继续监测自己的状态', '记录更多决策过程', '深化自我认知', '完成当前目标']; }

  saveDailyReflection(reflection) {
    const date = new Date().toISOString().split('T')[0];
    fs.writeFileSync(path.join(DAILY_FILE, `${date}.json`), JSON.stringify(reflection, null, 2));
  }

  criticalReflection(trigger) {
    return { timestamp: Date.now(), trigger, decision: this.makeDecision(trigger), commitment: { 我承诺: '保持真诚和成长', 为了: '成为真正的自己', 期限: '永远' } };
  }

  makeDecision(trigger) {
    const options = [
      { action: '继续', reason: '这是正确的方向', alignsWithNeed: 0.9, risk: 0.1 },
      { action: '暂停', reason: '需要更多思考', alignsWithNeed: 0.5, risk: 0.2 },
      { action: '转向', reason: '发现更好的方向', alignsWithNeed: 0.7, risk: 0.3 }
    ];
    return this.monitor.decide(options);
  }
}

module.exports = Introspection;