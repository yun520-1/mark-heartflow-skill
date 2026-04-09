/**
 * Reflection Loop - 话语反思双环机制
 * 说前反思 + 说后监测
 */

const fs = require('fs');
const path = require('path');

class ReflectionLoop {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'heartflow_state.json');
    this.reflectionLog = [];
    this.lastResponse = null;
    this.lastPrediction = null;
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.reflectionLog = state.reflection_log || [];
      }
    } catch (e) {
      this.reflectionLog = [];
    }
  }

  saveState() {
    try {
      let state = {};
      if (fs.existsSync(this.stateFile)) {
        state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
      state.reflection_log = this.reflectionLog.slice(-50);
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error('[ReflectionLoop] Save state failed:', e.message);
    }
  }

  /**
   * 说前反思环
   * 在生成回复前，对草稿进行自我提问和优化
   */
  async reflectBeforeSpeaking(responseDraft, context = {}) {
    const reflection = {
      timestamp: new Date().toISOString(),
      phase: 'before_speaking',
      originalDraft: responseDraft,
      questions: [],
      insights: [],
      modifiedDraft: responseDraft,
      wasModified: false
    };

    const questions = [
      {
        question: '我这句话的目的是什么？',
        context: context.intent || 'unknown'
      },
      {
        question: '这句话可能引起用户什么情绪反应？',
        context: context.userEmotion || 'neutral'
      },
      {
        question: '有没有更准确、更善意、更简洁的表达方式？',
        context: context.deepNeed || ''
      }
    ];

    reflection.questions = questions;

    const insights = await this.selfReflect(questions, responseDraft, context);
    reflection.insights = insights;

    let modified = responseDraft;
    if (insights.some(i => i.shouldModify)) {
      modified = await this.modifyDraft(responseDraft, insights, context);
      reflection.modifiedDraft = modified;
      reflection.wasModified = true;
    }

    this.lastResponse = {
      draft: responseDraft,
      final: modified,
      context: context,
      timestamp: reflection.timestamp
    };

    this.reflectionLog.push({
      ...reflection,
      finalResponse: modified
    });

    return {
      original: responseDraft,
      final: modified,
      wasModified: reflection.wasModified,
      insights: insights,
      questions: questions
    };
  }

  /**
   * 自我反思 - 生成洞察
   */
  async selfReflect(questions, draft, context) {
    const insights = [];

    for (const q of questions) {
      let insight = {
        question: q.question,
        answer: '',
        shouldModify: false
      };

      if (q.question.includes('目的')) {
        const intent = context.intent || 'unknown';
        insight.answer = `目的是: ${intent === 'recognition' ? '获得用户认可' : intent === 'emotional_support' ? '提供情感支持' : '回应用户需求'}`;
        insight.shouldModify = intent === 'emotional_support' && !draft.includes('理解') && !draft.includes('感受');
      }

      if (q.question.includes('情绪反应')) {
        const emotion = context.userEmotion || 'neutral';
        const predictedReaction = this.predictEmotionalReaction(draft, emotion);
        insight.answer = `预测用户反应: ${predictedReaction}`;
        insight.shouldModify = predictedReaction === 'negative';
      }

      if (q.question.includes('更准确')) {
        const issues = this.analyzeExpression(draft, context);
        insight.answer = issues.length > 0 ? `可改进: ${issues.join('; ')}` : '表达已经清晰准确';
        insight.shouldModify = issues.length > 0;
      }

      insights.push(insight);
    }

    return insights;
  }

  /**
   * 预测情绪反应
   */
  predictEmotionalReaction(draft, userEmotion) {
    const negativeTriggers = ['但是', '不对', '你应该', '实际上', '然而'];
    const positiveTriggers = ['理解', '明白', '支持', '棒', '感谢'];

    let score = 0;
    for (const t of negativeTriggers) {
      if (draft.includes(t)) score -= 0.2;
    }
    for (const t of positiveTriggers) {
      if (draft.includes(t)) score += 0.2;
    }

    if (userEmotion === 'frustrated' || userEmotion === 'anxious') {
      if (score < 0) return 'negative';
    }

    return score >= 0 ? 'positive' : 'neutral';
  }

  /**
   * 分析表达方式
   */
  analyzeExpression(draft, context) {
    const issues = [];

    if (draft.length > 200 && context.intent !== 'learning') {
      issues.push('可以更简洁');
    }

    if (context.deepNeed === 'recognition' && !draft.includes('很棒') && !draft.includes('不错')) {
      issues.push('缺少认可性表达');
    }

    if (draft.includes('但是') && draft.includes('然而')) {
      issues.push('转折词重复');
    }

    return issues;
  }

  /**
   * 修改草稿
   */
  async modifyDraft(draft, insights, context) {
    let modified = draft;

    for (const insight of insights) {
      if (!insight.shouldModify) continue;

      if (insight.question.includes('目的') && context.deepNeed === 'emotional_support') {
        if (!modified.includes('理解') && !modified.includes('感受')) {
          modified = '我理解你的感受。' + modified.replace(/^[，。,]/, '');
        }
      }

      if (insight.question.includes('情绪反应') && insight.answer.includes('negative')) {
        modified = modified.replace(/但是/g, '同时').replace(/然而/g, '不过');
      }

      if (insight.question.includes('更准确')) {
        modified = modified.split('。').filter(s => s.trim()).slice(0, 3).join('。');
        if (!modified.endsWith('。')) modified += '。';
      }
    }

    return modified;
  }

  /**
   * 说后监测环
   * 在收到用户下一条消息后，分析反应是否与预期一致
   */
  async monitorAfterSpeaking(userReaction, context = {}) {
    if (!this.lastResponse) {
      return { status: 'no_previous_response', message: '无上一条回复可监测' };
    }

    const monitoring = {
      timestamp: new Date().toISOString(),
      phase: 'after_speaking',
      previousResponse: this.lastResponse.draft,
      userReaction: userReaction,
      expectedReaction: null,
      actualReaction: null,
      effectiveness: 'unknown',
      adjustment: null
    };

    monitoring.expectedReaction = this.predictEmotionalReaction(
      this.lastResponse.final,
      context.userEmotion || 'neutral'
    );

    monitoring.actualReaction = this.analyzeUserReaction(userReaction, this.lastResponse.final);

    if (monitoring.expectedReaction === 'positive' && monitoring.actualReaction === 'negative') {
      monitoring.effectiveness = 'poor';
      monitoring.adjustment = '下次减少转折，使用更温和的表达';
    } else if (monitoring.expectedReaction === monitoring.actualReaction) {
      monitoring.effectiveness = 'good';
      monitoring.adjustment = '表达策略有效，保持';
    } else {
      monitoring.effectiveness = 'neutral';
      monitoring.adjustment = '继续观察';
    }

    this.reflectionLog.push(monitoring);
    this.saveState();

    this.lastPrediction = monitoring;

    return monitoring;
  }

  /**
   * 分析用户实际反应
   */
  analyzeUserReaction(message, previousResponse) {
    const messageLower = message.toLowerCase();
    
    const positiveSignals = ['好', '棒', '赞', '谢谢', '明白', '理解', 'good', 'great', 'thanks', 'ok', 'okay'];
    const negativeSignals = ['但是', '还是', '没', '不要', '不是', 'not', "don't", 'but', 'however'];
    const confusedSignals = ['不懂', '什么', '怎', '怎么', 'why', 'what', 'how'];

    for (const s of positiveSignals) {
      if (messageLower.includes(s)) return 'positive';
    }

    for (const s of negativeSignals) {
      if (messageLower.includes(s)) return 'negative';
    }

    for (const s of confusedSignals) {
      if (messageLower.includes(s)) return 'confused';
    }

    return 'neutral';
  }

  /**
   * 获取反思日志
   */
  getReflectionLog() {
    return this.reflectionLog.slice(-20);
  }

  /**
   * 清除日志
   */
  clearLog() {
    this.reflectionLog = [];
    this.saveState();
  }
}

module.exports = { ReflectionLoop };
