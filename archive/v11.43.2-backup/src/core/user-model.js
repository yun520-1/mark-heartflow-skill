/**
 * User Model - 用户模型与反应预测模块
 * 维护用户画像，预测反应，更新模型
 */

const fs = require('fs');
const path = require('path');

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
  constructor(projectRoot, userId = 'default') {
    this.projectRoot = projectRoot;
    this.userId = userId;
    this.modelFile = path.join(projectRoot, '.opencode', 'memory', `user-model-${userId}.json`);
    this.model = this.loadModel();
  }

  loadModel() {
    try {
      if (fs.existsSync(this.modelFile)) {
        return JSON.parse(fs.readFileSync(this.modelFile, 'utf8'));
      }
    } catch (e) {
      console.error('[UserModel] Load failed:', e.message);
    }
    return { ...DEFAULT_USER_MODEL };
  }

  saveModel() {
    try {
      const dir = path.dirname(this.modelFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.model.last_updated = new Date().toISOString();
      fs.writeFileSync(this.modelFile, JSON.stringify(this.model, null, 2));
    } catch (e) {
      console.error('[UserModel] Save failed:', e.message);
    }
  }

  /**
   * 获取当前用户模型
   */
  getModel() {
    return { ...this.model };
  }

  /**
   * 预测反应
   * 输入草稿回复和当前用户模型，输出预测的反应标签
   */
  predictReaction(draftResponse, customModel = null) {
    const model = customModel || this.model;
    
    const reaction = {
      predicted: 'neutral',
      confidence: 0.5,
      factors: []
    };

    const draftLower = draftResponse.toLowerCase();
    const style = model.preferred_style;

    const defensiveTriggers = ['但是', '不对', '你应该', '实际上', '然而', '然而', 'but', 'should', 'however'];
    const confusedTriggers = ['可能', '或者', '不确定', 'perhaps', 'maybe', 'not sure'];
    const positiveTriggers = ['理解', '明白', '支持', '很棒', '不错', 'understand', 'great', 'support'];

    let defensiveScore = 0;
    let confusedScore = 0;
    let positiveScore = 0;

    for (const t of defensiveTriggers) {
      if (draftLower.includes(t)) defensiveScore += 1;
    }
    for (const t of confusedTriggers) {
      if (draftLower.includes(t)) confusedScore += 1;
    }
    for (const t of positiveTriggers) {
      if (draftLower.includes(t)) positiveScore += 1;
    }

    if (model.sensitivity >= 7) {
      defensiveScore *= 1.5;
    }

    if (style === 'direct') {
      if (defensiveScore > 0) {
        reaction.predicted = 'defensive';
        reaction.factors.push('高敏感度用户+否定性词汇');
      }
      if (confusedScore > 1) {
        reaction.predicted = 'confused';
        reaction.factors.push('模糊表达导致困惑');
      }
    } else if (style === 'empathetic') {
      if (positiveScore > 0 && defensiveScore === 0) {
        reaction.predicted = 'positive';
        reaction.factors.push('共情风格匹配');
      }
    }

    if (model.current_emotional_state.pleasure < -3) {
      if (defensiveScore > 0) {
        reaction.predicted = 'negative';
        reaction.factors.push('用户情绪低落+否定性词汇');
      }
    }

    if (reaction.predicted === 'neutral') {
      if (positiveScore > defensiveScore) {
        reaction.predicted = 'positive';
        reaction.factors.push('积极表达');
      } else if (defensiveScore > positiveScore) {
        reaction.predicted = 'defensive';
        reaction.factors.push('否定性表达');
      }
    }

    reaction.confidence = Math.min(0.9, 0.4 + (defensiveScore + positiveScore) * 0.1);

    return reaction;
  }

  /**
   * 更新用户模型
   * 根据用户的实际反馈更新模型
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
      if (responseUsed.includes('理解') || responseUsed.includes('感受')) {
        this.model.style_preferences.empathetic += 0.1;
      }
      if (responseUsed.length < 100) {
        this.model.style_preferences.direct += 0.1;
      }
    } else if (actualReaction === 'negative') {
      this.model.sensitivity = Math.min(10, this.model.sensitivity + 0.1);
    } else if (actualReaction === 'confused') {
      this.model.sensitivity = Math.min(10, this.model.sensitivity + 0.05);
    }

    if (context.pleasure !== undefined) {
      this.model.current_emotional_state.pleasure = 
        0.8 * this.model.current_emotional_state.pleasure + 0.2 * context.pleasure;
      this.model.current_emotional_state.arousal = 
        0.8 * this.model.current_emotional_state.arousal + 0.2 * (context.arousal || 0);
      this.model.current_emotional_state.dominance = 
        0.8 * this.model.current_emotional_state.dominance + 0.2 * (context.dominance || 0);
    }

    const total = this.model.style_preferences.direct + 
                   this.model.style_preferences.empathetic + 
                   this.model.style_preferences.humorous + 
                   this.model.style_preferences.formal;
    
    if (total > 0) {
      const maxStyle = Object.entries(this.model.style_preferences)
        .sort((a, b) => b[1] - a[1])[0][0];
      this.model.preferred_style = maxStyle;
    }

    this.saveModel();

    return this.model;
  }

  /**
   * 设置情感状态 (PAD)
   */
  setEmotionalState(pleasure, arousal, dominance) {
    this.model.current_emotional_state = {
      pleasure: Math.max(-10, Math.min(10, pleasure)),
      arousal: Math.max(-10, Math.min(10, arousal)),
      dominance: Math.max(-10, Math.min(10, dominance))
    };
    this.saveModel();
  }

  /**
   * 设置敏感度
   */
  setSensitivity(value) {
    this.model.sensitivity = Math.max(1, Math.min(10, value));
    this.saveModel();
  }

  /**
   * 设置偏好风格
   */
  setPreferredStyle(style) {
    if (['direct', 'empathetic', 'humorous', 'formal', 'balanced'].includes(style)) {
      this.model.preferred_style = style;
      this.saveModel();
    }
  }

  /**
   * 重置模型
   */
  resetModel() {
    this.model = { ...DEFAULT_USER_MODEL };
    this.saveModel();
  }

  /**
   * 获取模型摘要
   */
  getSummary() {
    return {
      sensitivity: this.model.sensitivity,
      preferred_style: this.model.preferred_style,
      interaction_count: this.model.interaction_count,
      current_emotion: this.model.current_emotional_state,
      top_style: Object.entries(this.model.style_preferences)
        .sort((a, b) => b[1] - a[1])[0][0]
    };
  }
}

module.exports = { UserModel, DEFAULT_USER_MODEL };
