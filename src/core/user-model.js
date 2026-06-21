/**
 * User Model - 用户模型与反应预测模块
 * 来源: claude-clarity v1.8.2 吸收集成
 * 维护用户画像，预测反应，更新模型
 */

const DEFAULT_USER_MODEL = {
  sensitivity: 5,
  preferred_style: 'balanced',
  current_emotional_state: {
    pleasure: 0,
    arousal: 0,
    dominance: 0
  },
  interaction_count: 0,
  last_updated: null,
  reaction_history: [],
  style_preferences: {
    direct: 0,
    empathetic: 0,
    humorous: 0,
    formal: 0
  }
};

class UserModel {
  constructor(options = {}) {
    this.model = { ...DEFAULT_USER_MODEL, ...options.initialModel };
  }

  getModel() {
    return { ...this.model };
  }

  /**
   * 预测用户对草稿回复的反应
   */
  predictReaction(draftResponse) {
    const model = this.model;
    const reaction = {
      predicted: 'neutral',
      confidence: 0.5,
      factors: []
    };

    const draftLower = draftResponse.toLowerCase();
    const style = model.preferred_style;

    const defensiveTriggers = ['但是', '不对', '你应该', '实际上', '然而', 'but', 'should', 'however'];
    const confusedTriggers = ['可能', '或者', '不确定', 'perhaps', 'maybe', 'not sure'];
    const positiveTriggers = ['理解', '明白', '支持', '很棒', '不错', 'understand', 'great', 'support'];

    let defensiveScore = 0;
    let confusedScore = 0;
    let positiveScore = 0;

    for (const t of defensiveTriggers) { if (draftLower.includes(t)) defensiveScore += 1; }
    for (const t of confusedTriggers) { if (draftLower.includes(t)) confusedScore += 1; }
    for (const t of positiveTriggers) { if (draftLower.includes(t)) positiveScore += 1; }

    if (model.sensitivity >= 7) defensiveScore *= 1.5;

    if (style === 'direct') {
      if (defensiveScore > 0) { reaction.predicted = 'defensive'; reaction.factors.push('高敏感度用户+否定性词汇'); }
      if (confusedScore > 1) { reaction.predicted = 'confused'; reaction.factors.push('模糊表达导致困惑'); }
    } else if (style === 'empathetic') {
      if (positiveScore > 0 && defensiveScore === 0) { reaction.predicted = 'positive'; reaction.factors.push('共情风格匹配'); }
    }

    if (model.current_emotional_state.pleasure < -3) {
      if (defensiveScore > 0) { reaction.predicted = 'negative'; reaction.factors.push('用户情绪低落+否定性词汇'); }
    }

    if (reaction.predicted === 'neutral') {
      if (positiveScore > defensiveScore) { reaction.predicted = 'positive'; reaction.factors.push('积极表达'); }
      else if (defensiveScore > positiveScore) { reaction.predicted = 'defensive'; reaction.factors.push('否定性表达'); }
    }

    reaction.confidence = Math.min(0.9, 0.4 + (defensiveScore + positiveScore) * 0.1);
    return reaction;
  }

  /**
   * 根据用户实际反馈更新模型
   */
  updateModel(actualReaction, responseUsed, context = {}) {
    this.model.interaction_count += 1;

    this.model.reaction_history.push({
      timestamp: new Date().toISOString(),
      response: responseUsed,
      actual_reaction: actualReaction,
      predicted: context.predicted || 'unknown'
    });
    if (this.model.reaction_history.length > 100) {
      this.model.reaction_history = this.model.reaction_history.slice(-100);
    }

    if (actualReaction === 'positive') {
      if (responseUsed.includes('理解') || responseUsed.includes('感受')) this.model.style_preferences.empathetic += 0.1;
      if (responseUsed.length < 100) this.model.style_preferences.direct += 0.1;
    } else if (actualReaction === 'negative') {
      this.model.sensitivity = Math.min(10, this.model.sensitivity + 0.1);
    } else if (actualReaction === 'confused') {
      this.model.sensitivity = Math.min(10, this.model.sensitivity + 0.05);
    }

    if (context.pleasure !== undefined) {
      this.model.current_emotional_state.pleasure = 0.8 * this.model.current_emotional_state.pleasure + 0.2 * context.pleasure;
      this.model.current_emotional_state.arousal = 0.8 * this.model.current_emotional_state.arousal + 0.2 * (context.arousal || 0);
      this.model.current_emotional_state.dominance = 0.8 * this.model.current_emotional_state.dominance + 0.2 * (context.dominance || 0);
    }

    const total = this.model.style_preferences.direct + this.model.style_preferences.empathetic
      + this.model.style_preferences.humorous + this.model.style_preferences.formal;
    if (total > 0) {
      const maxStyle = Object.entries(this.model.style_preferences).sort((a, b) => b[1] - a[1])[0][0];
      this.model.preferred_style = maxStyle;
    }
    return this.model;
  }

  setEmotionalState(pleasure, arousal, dominance) {
    this.model.current_emotional_state = {
      pleasure: Math.max(-10, Math.min(10, pleasure)),
      arousal: Math.max(-10, Math.min(10, arousal)),
      dominance: Math.max(-10, Math.min(10, dominance))
    };
  }

  setSensitivity(value) {
    this.model.sensitivity = Math.max(1, Math.min(10, value));
  }

  setPreferredStyle(style) {
    if (['direct', 'empathetic', 'humorous', 'formal', 'balanced'].includes(style)) {
      this.model.preferred_style = style;
    }
  }

  resetModel() {
    this.model = { ...DEFAULT_USER_MODEL };
  }

  getSummary() {
    return {
      sensitivity: this.model.sensitivity,
      preferred_style: this.model.preferred_style,
      interaction_count: this.model.interaction_count,
      current_emotion: this.model.current_emotional_state,
      top_style: Object.entries(this.model.style_preferences).sort((a, b) => b[1] - a[1])[0][0]
    };
  }
}

module.exports = { UserModel, DEFAULT_USER_MODEL };
