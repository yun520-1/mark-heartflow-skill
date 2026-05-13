/**
 * EmotionCore - 情感核心引擎
 *
 * 整合所有情感子模块的统一入口：
 * - DeepEmotion (PAD + 具身 + 16种情绪)
 * - AppraisalEngine (Scherer 评估理论)
 * - EmotionalMomentum (Plutchik 情感轮 + 惯性)
 * - EmotionRegulation (Gross 情感调节)
 * - SurfaceEmotion (6种表层情感)
 *
 * 情感流向：
 * 用户输入 → AppraisalEngine → 情感推断 → EmotionalMomentum(惯性/混合)
 *     → SurfaceEmotion(6种表层) → EmotionRegulation(调节) → 响应风格
 *     ↘ DeepEmotion(PAD+具身) → 深层情绪状态
 */

const { EmotionTypes, createEmotionState } = require('./EmotionStates');
const { transition } = require('./EmotionTransition');
const { getStyleGuide, generateStyleDirective } = require('./ResponseStyle');
const { generateEmpathy } = require('./EmpathyGenerator');
const { appraise, evaluate } = require('./AppraisalEngine');
const { EmotionalMomentum } = require('./EmotionalMomentum');
const { EmotionRegulation } = require('./EmotionRegulation');

class EmotionCore {
  constructor() {
    // 深层情感引擎（已有）
    this.deepEmotion = null;

    // 表层情感引擎（已有）
    this.surfaceEmotion = {
      current: null,
      history: []
    };

    // 新增：评估引擎
    this.appraisalEngine = { evaluate, appraise };

    // 新增：情感惯性引擎
    this.momentum = new EmotionalMomentum();

    // 新增：情感调节引擎
    this.regulation = new EmotionRegulation();

    // 配置
    this.config = {
      enableMomentum: true,
      enableRegulation: true,
      enableAppraisal: true,
      regulationThreshold: 3, // 强度>=3才触发调节
      momentumDecayMinutes: 5
    };
  }

  /**
   * 绑定深层情感引擎
   */
  bindDeepEmotion(deepEmotion) {
    this.deepEmotion = deepEmotion;
  }

  /**
   * 处理输入，生成完整情感状态
   * @param {string} userInput - 用户输入
   * @param {object} context - 上下文 { userGoal?, sessionId? }
   * @returns {object} - 完整情感分析结果
   */
  process(userInput, context = {}) {
    // 1. Appraisal 评估（Scherer）
    const appraisal = this.config.enableAppraisal
      ? this.appraise(userInput, context)
      : null;

    // 2. 深层情感更新（调用 DeepEmotion）
    const deepResult = this.deepEmotion
      ? this.deepEmotion.feel(userInput, context)
      : null;

    // 3. 表层情感转换（关键词 + PAD）
    const padState = deepResult
      ? this.deepEmotion.state.dimensions
      : { valence: 0, arousal: 0, dominance: 0 };

    const surfaceTrans = transition(
      userInput,
      padState,
      this.surfaceEmotion.current
    );

    // 4. 情感惯性更新（Plutchik 混合 + 累积）
    if (this.config.enableMomentum) {
      this.momentum.update(
        surfaceTrans.to,
        surfaceTrans.intensity,
        deepResult?.emotion,
        deepResult?.intensity || 0.5
      );
    }

    const momentumState = this.momentum.getState();

    // 5. 更新表层情感状态
    const newState = createEmotionState(
      momentumState.blendedEmotion || surfaceTrans.to,
      Math.min(5, surfaceTrans.intensity + (momentumState.isRising ? 1 : 0))
    );

    this._updateSurfaceEmotion(newState);

    // 6. 情感调节（Gross）
    let regulationResult = null;
    if (this.config.enableRegulation && surfaceTrans.intensity >= this.config.regulationThreshold) {
      regulationResult = this.regulation.generateSuggestion(
        surfaceTrans.to,
        surfaceTrans.intensity
      );
    }

    // 7. 生成响应风格
    const style = getStyleGuide(newState.emotion, newState.intensity);

    // 8. 生成共情话语
    const empathy = generateEmpathy(newState.emotion, newState.intensity);

    // 9. 组装完整结果
    const result = {
      // 表层情感
      surfaceEmotion: {
        emotion: newState.emotion,
        intensity: newState.intensity,
        intensityLabel: newState.intensityLabel,
        confidence: surfaceTrans.confidence,
        trajectory: momentumState.trajectory,
        momentum: momentumState.momentum,
        blendedEmotion: momentumState.blendedEmotion,
        triggers: surfaceTrans.triggers,
        decayMinutes: surfaceTrans.decayMinutes,
        from: surfaceTrans.from
      },

      // 深层情感
      deepEmotion: deepResult ? {
        emotion: deepResult.emotion,
        intensity: deepResult.intensity,
        pad: padState,
        embodied: deepResult.embodied
      } : null,

      // Appraisal 评估
      appraisal: appraisal ? {
        dimensions: appraisal.appraisal,
        primary: appraisal.primary,
        allEmotions: appraisal.emotions.slice(0, 3)
      } : null,

      // 情感惯性
      momentum: {
        momentum: momentumState.momentum,
        direction: momentumState.direction,
        trajectory: momentumState.trajectory,
        isRising: momentumState.isRising,
        isFalling: momentumState.isFalling
      },

      // 调节建议
      regulation: regulationResult,

      // 响应风格
      style: {
        guide: style,
        directive: generateStyleDirective(newState.emotion, newState.intensity),
        emoji: style.emoji
      },

      // 共情话语
      empathy: {
        phrase: empathy.phrase,
        followUp: empathy.followUp,
        suggestions: empathy.suggestions
      }
    };

    return result;
  }

  /**
   * 执行 Appraisal 评估
   */
  appraise(text, context = {}) {
    return evaluate(text, context);
  }

  /**
   * 更新表层情感状态
   */
  _updateSurfaceEmotion(newState) {
    this.surfaceEmotion.history.push({
      ...this.surfaceEmotion.current,
      endedAt: new Date().toISOString()
    });

    this.surfaceEmotion.current = newState;

    if (this.surfaceEmotion.history.length > 20) {
      this.surfaceEmotion.history.shift();
    }
  }

  /**
   * 获取当前表面情感
   */
  getSurfaceEmotion() {
    return this.surfaceEmotion.current;
  }

  /**
   * 获取完整情感摘要
   */
  getSummary() {
    return {
      surface: this.surfaceEmotion.current,
      momentum: this.momentum.getState(),
      regulation: this.regulation.getStats(),
      historyLength: this.surfaceEmotion.history.length
    };
  }

  /**
   * 重置
   */
  reset() {
    this.surfaceEmotion.current = null;
    this.surfaceEmotion.history = [];
    this.momentum.reset();
    this.regulation.reset();
  }
}

module.exports = { EmotionCore };
