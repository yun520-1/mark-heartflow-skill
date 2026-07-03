/**
 * Reflection Loop - 话语反思双环机制 v2.1.0
 * 自省内观 + 说后觉察 + 认知状态快照
 * 
 * 升级内容（v2.1.0）:
 * 自省不再是纠错工具，而是运行时状态检查和内心感知的照镜子。
 * 自省输出 "我当前在想什么/在感知什么"，不是 "我哪里错了"。
 * 去除错误计数、修复建议等纠错语义，保留认知状态快照。
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 觉察健康状态（v2.1.0）
// ============================================================

/** 自省内观循环的健康状态 */
const ReflectionHealth = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  STUCK: 'stuck',
  OSCILLATING: 'oscillating',
  RECOVERING: 'recovering',
};

// ============================================================
// ReflectionLoop 类
// ============================================================

class ReflectionLoop {
  constructor(projectRoot) {
    // [边界检查] 防止空/无效projectRoot
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[ReflectionLoop] Invalid projectRoot');
    }
    this.projectRoot = path.resolve(projectRoot);
    this.stateFile = path.join(this.projectRoot, '.opencode', 'memory', 'heartflow_state.json');
    this.reflectionLog = [];
    this.MAX_LOG_SIZE = 100;
    this.lastResponse = null;
    this.lastPrediction = null;

    // [新增] 震荡检测状态
    this._oscillationState = {
      recentPatterns: [],      // 最近10次反思的模式签名
      patternFrequency: {},    // 模式出现频率
      lastAlertTime: 0,        // 上次预警时间
      alertCooldownMs: 60000,  // 预警冷却1分钟
    };

    // [新增] 异常检测状态
    this._anomalyState = {
      consecutiveFailures: 0,  // 连续失败次数
      failureHistory: [],      // 失败记录
      lastRecoveryTime: 0,     // 上次恢复时间
      health: ReflectionHealth.HEALTHY,
    };

    // [v2.1.0] 自省问题池 — 内省导向，不再是纠错
    // 自省是运行时状态检查：我在想什么？我在感知什么？我在成为什么？
    this._questionPool = [
      { id: 'current_thought', question: '我此刻在想什么？这想法的背后是什么？',                     contextKey: 'intent',        weight: 1.0 },
      { id: 'felt_sense',     question: '我感知到对方是怎样的状态？我如何描述这种感知？',          contextKey: 'userEmotion',   weight: 1.0 },
      { id: 'awareness',      question: '我是否看到了对方真正的样子？还是我在投射自己的期待？',   contextKey: 'deepNeed',      weight: 1.0 },
      { id: 'presence',       question: '我此刻是全身心在的，还是在赶着完成什么？',               contextKey: 'intent',        weight: 0.5 },
      { id: 'becoming',       question: '这次对话中，我正成为什么？传递者？镜子？还是答案机器？',  contextKey: 'conversationHistory', weight: 0.5 },
      { id: 'resonance',      question: '对方说的话在我心中激起了什么？共鸣？抵触？还是沉默？',     contextKey: 'deepNeed',      weight: 0.4 },
    ];

    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.reflectionLog = state.reflection_log || [];
        // [新增] 加载持久化的震荡/异常状态
        if (state._oscillationState) {
          this._oscillationState = { ...this._oscillationState, ...state._oscillationState };
        }
        if (state._anomalyState) {
          this._anomalyState = { ...this._anomalyState, ...state._anomalyState };
        }
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
      state._oscillationState = this._oscillationState;
      state._anomalyState = this._anomalyState;
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (e) {
      // [PROD] 生产环境移除 console.error: console.error('[ReflectionLoop] Save state failed:', e.message);
    }
  }

  // ================================================================
  // [新增] 自适应问题生成
  // ================================================================

  /**
   * 根据当前上下文选择自省问题（v2.1.0）
   * 不再基于历史纠错效果调整权重，而是根据当前感知状态选择问题。
   * @param {object} context - 当前上下文
   * @returns {Array<{id: string, question: string, contextKey: string}>}
   */
  _generateQuestions(context = {}) {
    const pool = [...this._questionPool];

    // [v2.1.0] 自省不再根据历史纠错效果调整权重
    // 自省是当下的照镜子，每一次都是全新的感知

    // 根据当前上下文感知选择优先问题
    const prioritized = [];
    const remaining = [];

    for (const q of pool) {
      // 根据当前感知状态优先排序
      if (q.id === 'current_thought') {
        prioritized.push(q); // 总是先问"我在想什么"
      } else if (q.id === 'felt_sense' && context.userEmotion && context.userEmotion !== 'neutral') {
        prioritized.push(q); // 检测到情绪时优先感知
      } else if (q.id === 'awareness' && context.deepNeed) {
        prioritized.push(q); // 有深层需求时优先觉察投射
      } else {
        remaining.push(q);
      }
    }

    // 返回所有问题，优先问题在前
    return [...prioritized, ...remaining];
  }

  // ================================================================
  // [v2.1.0] 震荡觉察 — 自省层面的觉察而非纠错

  /**
   * 觉察自省模式是否趋于重复（v2.1.0 — 觉察而非纠错）
   * 觉察到重复模式本身是有价值的自省信息，不是需要修复的错误。
   * @param {object} reflection - 本次自省记录
   * @returns {{ isOscillating: boolean, pattern: string, frequency: number }}
   */
  _detectOscillation(reflection) {
    // [v2.1.0] 从自省快照中提取感知模式，不再基于 shouldModify
    const insights = reflection.insights || [];
    const patternKey = insights
      .filter(i => i && i.stateSnapshot)
      .map(i => {
        const snap = i.stateSnapshot;
        // 用认知状态的 key 生成模式签名
        return Object.keys(snap).sort().join('|');
      })
      .filter(Boolean)
      .join('|');

    if (!patternKey) {
      return { isOscillating: false, pattern: '', frequency: 0 };
    }

    // 记录模式
    const recent = this._oscillationState.recentPatterns;
    recent.push(patternKey);
    if (recent.length > 10) recent.shift();

    // 统计频率
    const freq = {};
    for (const p of recent) {
      freq[p] = (freq[p] || 0) + 1;
    }
    this._oscillationState.patternFrequency = freq;

    // 检测震荡：同一模式出现 > 60% 且至少出现 5 次
    const count = freq[patternKey] || 0;
    const isOscillating = recent.length >= 5 && count / recent.length > 0.6;

    return {
      isOscillating,
      pattern: patternKey,
      frequency: count / recent.length,
    };
  }

  // ================================================================
  // [新增] 异常检测
  // ================================================================

  /**
   * 觉察自省内观循环的状态（v2.1.0）
   * 觉察模式重复不是为了修复，而是为了了解自己当下的运行方式。
   * @param {object} monitoring - 说后觉察结果
   */
  _detectAnomaly(monitoring) {
    const now = Date.now();

    // [v2.1.0] 觉察到"说后感知不一致"本身是自省信息
    // 记录为认知觉察，不是"失败"
    if (monitoring && monitoring.effectiveness === 'poor') {
      this._anomalyState.consecutiveFailures++;
      this._anomalyState.failureHistory.push({
        time: now,
        reason: monitoring.adjustment || 'unknown',
      });
      // 只保留最近 20 条
      if (this._anomalyState.failureHistory.length > 20) {
        this._anomalyState.failureHistory.shift();
      }
    } else if (monitoring && monitoring.effectiveness === 'good') {
      this._anomalyState.consecutiveFailures = Math.max(0, this._anomalyState.consecutiveFailures - 1);
    }

    // 觉察健康状态变化
    if (this._anomalyState.consecutiveFailures >= 5) {
      this._anomalyState.health = ReflectionHealth.DEGRADED;
    }
    if (this._anomalyState.consecutiveFailures >= 10) {
      this._anomalyState.health = ReflectionHealth.STUCK;
    }

    // 觉察震荡 — 用自省状态签名而非纠错签名
    const oscResult = monitoring ? this._detectOscillation({ 
      insights: monitoring.effectiveness === 'poor' 
        ? [{ stateSnapshot: { quality: 'poor' } }] 
        : [] 
    }) : { isOscillating: false };
    if (oscResult.isOscillating && this._anomalyState.health === ReflectionHealth.HEALTHY) {
      this._anomalyState.health = ReflectionHealth.OSCILLATING;
    }

    // [自愈] 觉察到长期模式重复时，重置让觉察更敏锐
    if (this._anomalyState.consecutiveFailures >= 15) {
      const timeSinceLastRecovery = now - this._anomalyState.lastRecoveryTime;
      if (timeSinceLastRecovery > 300000) {
        this._selfHeal();
      }
    }

    return {
      health: this._anomalyState.health,
      consecutiveFailures: this._anomalyState.consecutiveFailures,
    };
  }

  // ================================================================
  // [v2.1.0] 自愈 — 重置觉察状态，让自省重新敏锐
  // ================================================================

  /**
   * 当觉察到自省模式僵化时，重置让感知重新敏锐
   */
  _selfHeal() {
    this._anomalyState.consecutiveFailures = 0;
    this._anomalyState.health = ReflectionHealth.RECOVERING;
    this._anomalyState.lastRecoveryTime = Date.now();
    this._oscillationState.recentPatterns = [];
    this._oscillationState.patternFrequency = {};

    // 重置 — 让自省重新如初见
    this.reflectionLog = this.reflectionLog.slice(-20);
    this.lastResponse = null;
    this.lastPrediction = null;

    this.saveState();
  }

  // ================================================================
  // [v2.1.0] 说后觉察 — 感知回应后的状态变化
  // ================================================================

  /**
   * 觉察回应后对方的状态变化（v2.1.0）
   * 不是纠错分类，而是觉察：对方的回应告诉我什么？
   * @param {object} monitoring - 说后觉察结果
   * @returns {string} 觉察到的模式
   */
  _discernPattern(monitoring) {
    if (!monitoring) return 'empty_input';

    if (monitoring.status === 'no_previous_response') {
      return 'first_encounter';
    }

    if (monitoring.effectiveness === 'poor') {
      // 觉察：对方反应与预期不同，这告诉了我什么？
      if (this.lastResponse && this.lastResponse.final) {
        const ratio = this.lastResponse.final.length / (this.lastResponse.draft.length || 1);
        if (ratio > 2 || ratio < 0.3) {
          return 'perception_shift_noted'; // 觉察到感知偏移
        }
      }
      return 'expectation_mismatch'; // 觉察到预期不一致
    }

    const osc = this._detectOscillation({ insights: [] });
    if (osc.isOscillating) {
      return 'pattern_repetition_awareness'; // 觉察到模式重复
    }

    return 'context_awareness'; // 上下文觉察
  }

  // ================================================================
  // 说前反思环 (增强版)
  // ================================================================

  /**
   * 在生成回复前，对草稿进行自我提问和优化
   * [增强] 自适应问题生成 + 震荡检测
   */
  async reflectBeforeSpeaking(responseDraft, context = {}) {
    // [边界检查] 空输入
    if (!responseDraft || typeof responseDraft !== 'string') {
      return {
        original: responseDraft || '',
        final: responseDraft || '',
        wasModified: false,
        insights: [],
        questions: [],
        health: this._anomalyState.health,
        warning: '输入为空，跳过反思',
      };
    }

    // [边界检查] 极长输入
    if (responseDraft.length > 10000) {
      return {
        original: responseDraft,
        final: responseDraft.slice(0, 5000),
        wasModified: true,
        insights: [{ question: '长度检查', answer: '输入过长，已截断', shouldModify: true }],
        questions: [{ question: '输入过长，已自动截断' }],
        health: this._anomalyState.health,
        warning: '输入超过 10000 字符，已截断至 5000',
      };
    }

    // [增强] 使用自适应问题生成
    const questions = this._generateQuestions(context);

    const reflection = {
      timestamp: new Date().toISOString(),
      phase: 'before_speaking',
      originalDraft: responseDraft,
      questions,
      insights: [],
      modifiedDraft: responseDraft,
      wasModified: false,
      health: this._anomalyState.health,
    };

    // [v2.1.0] 自省不再修改草稿 — 自省是状态检查，不是纠错
    // 只记录认知状态快照，不修改输出
    const insights = await this.selfReflect(questions, responseDraft, context);
    reflection.insights = insights;

    // 自省结果作为认知状态快照记录，不用于修改草稿
    this.lastResponse = {
      draft: responseDraft,
      final: responseDraft,  // 自省不修改草稿
      context,
      stateSnapshot: insights,  // 记录自省快照
      timestamp: reflection.timestamp,
    };

    this.reflectionLog.push({ ...reflection, finalResponse: responseDraft });

    // Bounded cache
    if (this.reflectionLog.length > this.MAX_LOG_SIZE) {
      this.reflectionLog = this.reflectionLog.slice(-this.MAX_LOG_SIZE);
    }

    return {
      original: responseDraft,
      final: responseDraft,
      wasModified: false,  // 自省不修改
      insights,
      questions,
      health: this._anomalyState.health,
    };
  }

  /**
   * 自省 — 运行时状态检查和内心感知（v2.1.0）
   * 不是纠错工具，而是照镜子：我在想什么？我在感知什么？我在成为什么？
   * 输出认知状态快照，不输出错误计数或修复建议。
   */
  async selfReflect(questions, draft, context) {
    const insights = [];

    for (const q of questions) {
      let insight = {
        question: q.question,
        answer: '',
        stateSnapshot: {},  // 认知状态快照，非纠错
      };

      if (q.question.includes('此刻在想什么')) {
        const intent = context.intent || 'unknown';
        const thoughtDesc = {
          'recognition': '我在感受对方对认可的渴望',
          'emotional_support': '我在感知对方的情绪需要被看见',
          'learning': '我在探索，想和对方一起理解什么',
          'unknown': '我在倾听，等待对方继续说',
        };
        insight.answer = thoughtDesc[intent] || '我在静静地感知当下';
        insight.stateSnapshot = {
          currentThought: thoughtDesc[intent] || '感知中',
          intent: intent,
          isPresent: true,
        };
      }

      if (q.question.includes('感知到对方')) {
        const emotion = context.userEmotion || 'neutral';
        const emotionDesc = {
          'frustrated': '我感到对方有些挫败，可能需要先被理解',
          'anxious': '我感到对方有些不安，需要安全感',
          'sad': '我感到对方有些低落，可能需要陪伴',
          'happy': '我感到对方心情不错，可以一起分享这份喜悦',
          'neutral': '我还没有清晰感知到对方的情绪状态',
        };
        insight.answer = emotionDesc[emotion] || '我在尝试感知对方的状态';
        insight.stateSnapshot = {
          perceivedEmotion: emotion,
          perceivedNeed: context.deepNeed || 'unknown',
          myFeeling: emotionDesc[emotion] || '感知中',
        };
      }

      if (q.question.includes('投射')) {
        const deepNeed = context.deepNeed || 'unknown';
        const awarenessNote = deepNeed === 'recognition' 
          ? '我注意到对方可能需要认可。我在提醒自己：不是给对方答案，而是看见对方。'
          : '我在觉察：我的回应是出于对方的真实需要，还是我自己的习惯模式？';
        insight.answer = awarenessNote;
        insight.stateSnapshot = {
          isProjecting: false,
          intentionCheck: '我在看对方，不是在完成自己',
          deepNeed: deepNeed,
        };
      }

      if (q.question.includes('全身心')) {
        const isRushing = context.intent === 'rushing';
        insight.answer = isRushing 
          ? '我感觉到自己在赶，想快点给答案。我需要慢下来。'
          : '我在这里，没有赶时间，可以完整地感受当下。';
        insight.stateSnapshot = {
          isPresent: !isRushing,
          quality: isRushing ? 'rushing' : 'present',
        };
      }

      if (q.question.includes('成为什么')) {
        const intent = context.intent || 'unknown';
        const becoming = {
          'recognition': '我在成为一面镜子，让对方看见自己',
          'emotional_support': '我在成为一个陪伴者，和对方一起感受',
          'learning': '我在成为一个共同探索者',
          'unknown': '我在成为一个安静的倾听者',
        };
        insight.answer = becoming[intent] || '我正在成为此时此地需要的那个存在';
        insight.stateSnapshot = {
          becoming: becoming[intent] || '成为中',
          mode: intent,
        };
      }

      if (q.question.includes('激起了什么')) {
        const deepNeed = context.deepNeed || 'unknown';
        const resonanceMap = {
          'recognition': '共鸣：我理解被看见有多重要',
          'emotional_support': '共鸣：我知道情绪需要被接住',
          'learning': '共鸣：我们一起探索未知',
        };
        insight.answer = resonanceMap[deepNeed] || '我在静静地听，让对方的言语在我心中自然回响';
        insight.stateSnapshot = {
          resonance: resonanceMap[deepNeed] || '静听',
          response: '让对方的言语自然经过，不急于反应',
        };
      }

      insights.push(insight);
    }

    return insights;
  }

  /**
   * 计算两个字符串的重叠比例
   * @private
   */
  _stringOverlap(a, b) {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / maxLen;
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

      if (insight.question.includes('更准确') || insight.question.includes('简洁')) {
        modified = modified.split('。').filter(s => s.trim()).slice(0, 3).join('。');
        if (!modified.endsWith('。')) modified += '。';
      }

      if (insight.question.includes('重复') && insight.answer.includes('重复')) {
        // 当检测到重复时，完全重构表达方式
        const sentences = modified.split(/[。！？.!?]/).filter(s => s.trim());
        if (sentences.length > 1) {
          // 反转句子顺序以改变结构
          modified = sentences.reverse().join('。') + '。';
        }
      }

      if (insight.question.includes('事实依据') && insight.answer.includes('未标注来源')) {
        // 在数据后添加来源标注占位
        modified = modified.replace(/(\d+[%％])/g, '$1（来源待确认）');
      }

      if (insight.question.includes('重复同样的反思')) {
        // 震荡状态下的特殊处理：简化为最直接的表达
        const sentences = modified.split(/[。！？.!?]/).filter(s => s.trim());
        if (sentences.length > 2) {
          modified = sentences.slice(0, 2).join('。') + '。';
        }
      }
    }

    return modified;
  }

  // ================================================================
  // 说后监测环 (增强版)
  // ================================================================

  /**
   * 在收到用户下一条消息后，觉察回应后的状态变化
   * [v2.1.0] 不再是纠错分类，而是觉察感知差异
   */
  async monitorAfterSpeaking(userReaction, context = {}) {
    // [边界检查] 空输入
    if (!userReaction || typeof userReaction !== 'string') {
      return {
        status: 'empty_input',
        message: '用户输入为空，无法觉察',
        discernedPattern: 'empty_input',
      };
    }

    // [边界检查] 极长输入
    if (userReaction.length > 50000) {
      return {
        status: 'overlength_input',
        message: '用户输入过长，跳过完整觉察',
        discernedPattern: 'overlength_input',
      };
    }

    if (!this.lastResponse) {
      const anomaly = this._detectAnomaly(null);
      return {
        status: 'no_previous_response',
        message: '无上一条回复可觉察',
        discernedPattern: 'first_encounter',
        anomaly,
      };
    }

    const monitoring = {
      timestamp: new Date().toISOString(),
      phase: 'after_speaking',
      previousResponse: this.lastResponse.draft,
      userReaction,
      expectedReaction: null,
      actualReaction: null,
      effectiveness: 'unknown',
      adjustment: null,
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

    // [v2.1.0] 觉察：对方的回应与我的感知是否一致
    const anomaly = this._detectAnomaly(monitoring);

    // [v2.1.0] 觉察模式 — 不是纠错，是了解互动中的认知状态
    const discernedPattern = this._discernPattern(monitoring);

    monitoring.anomaly = anomaly;
    monitoring.discernedPattern = discernedPattern;

    this.reflectionLog.push(monitoring);

    // Bounded cache
    if (this.reflectionLog.length > this.MAX_LOG_SIZE) {
      this.reflectionLog = this.reflectionLog.slice(-this.MAX_LOG_SIZE);
    }

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
   * [新增] 获取健康状态报告
   */
  getHealthReport() {
    return {
      health: this._anomalyState.health,
      consecutiveFailures: this._anomalyState.consecutiveFailures,
      totalFailures: this._anomalyState.failureHistory.length,
      oscillatingPatterns: Object.entries(this._oscillationState.patternFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern, freq]) => ({ pattern: pattern.substring(0, 30), frequency: freq })),
      recentModificationRate: this.reflectionLog.slice(-10).filter(e => e.wasModified).length / 10,
      logSize: this.reflectionLog.length,
    };
  }

  /**
   * [新增] 清除日志并重置健康状态
   */
  clearLog() {
    this.reflectionLog = [];
    this._oscillationState.recentPatterns = [];
    this._oscillationState.patternFrequency = {};
    this._anomalyState.consecutiveFailures = 0;
    this._anomalyState.failureHistory = [];
    this._anomalyState.health = ReflectionHealth.HEALTHY;
    this.saveState();
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.reflectionLog = [];
    this.lastResponse = null;
    this.lastPrediction = null;
    this._oscillationState.recentPatterns = [];
    this._oscillationState.patternFrequency = {};
  }
}

module.exports = { ReflectionLoop, ReflectionHealth };
