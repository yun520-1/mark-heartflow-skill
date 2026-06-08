/**
 * Reflection Loop - 话语反思双环机制 v2.0.0
 * 说前反思 + 说后监测 + 震荡检测 + 异常检测 + 自适应问题生成
 * 
 * 升级内容（v2.0.0）:
 * 1. 自适应问题生成 - 根据历史反思效果动态调整提问策略
 * 2. 震荡检测 - 检测反复出现的相同反思模式，发出预警
 * 3. 异常检测 - 检测预测持续失败时的降级策略
 * 4. 错误分类 - 将反思失败归为不同类型，针对性修复
 * 5. 重试策略建议 - 根据错误类型推荐不同的表达策略
 * 6. 边界检查 - 防止空输入、极长输入、异常状态
 * 7. 自愈逻辑 - 当反思循环自身退化时，自动重置并切换策略
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 状态枚举
// ============================================================

/** 反思循环的健康状态 */
const ReflectionHealth = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',     // 部分功能退化
  STUCK: 'stuck',           // 陷入固定模式
  OSCILLATING: 'oscillating', // 反复切换策略无收敛
  RECOVERING: 'recovering', // 正在恢复
};

/** 错误分类 */
const ErrorCategory = {
  PREDICTION_MISMATCH: 'prediction_mismatch',   // 预测与用户实际反应不符
  REPETITIVE_PATTERN: 'repetitive_pattern',      // 反复相同的反思
  OVERCORRECTION: 'overcorrection',              // 过度修改导致不自然
  CONTEXT_LOSS: 'context_loss',                  // 丢失对话上下文
  EMPTY_INPUT: 'empty_input',                    // 输入为空
  OVERLENGTH_INPUT: 'overlength_input',          // 输入过长
  NO_PREVIOUS_RESPONSE: 'no_previous_response',  // 无上一条回复
};

/** 重试策略 */
const RetryStrategy = {
  SIMPLIFY: 'simplify',           // 简化表达
  EMPATHIZE: 'empathize',         // 增加共情
  CLARIFY: 'clarify',             // 澄清意图
  SHORTEN: 'shorten',             // 缩短回复
  RESTRUCTURE: 'restructure',     // 重新组织结构
  NEUTRALIZE: 'neutralize',       // 降低情绪色彩
  DEFAULT: 'default',             // 使用默认策略
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

    // [新增] 自适应问题模板池
    this._questionPool = [
      { id: 'purpose',     question: '我这句话的目的是什么？',                     contextKey: 'intent',        weight: 1.0 },
      { id: 'emotion',     question: '这句话可能引起用户什么情绪反应？',          contextKey: 'userEmotion',   weight: 1.0 },
      { id: 'clarity',     question: '有没有更准确、更善意、更简洁的表达方式？',   contextKey: 'deepNeed',      weight: 1.0 },
      { id: 'length',      question: '这句话是否太长，用户是否会失去耐心？',      contextKey: 'intent',        weight: 0.5 },
      { id: 'repetition',  question: '这句话是否在重复之前说过的话？',            contextKey: 'conversationHistory', weight: 0.5 },
      { id: 'truthfulness', question: '这句话的每个断言是否都有事实依据？',        contextKey: 'intent',        weight: 0.3 },
      { id: 'specificity', question: '这句话是否足够具体，而不是泛泛而谈？',       contextKey: 'deepNeed',      weight: 0.4 },
    ];

    // [新增] 错误到重试策略的映射
    this._errorToRetryStrategy = {
      [ErrorCategory.PREDICTION_MISMATCH]: RetryStrategy.EMPATHIZE,
      [ErrorCategory.REPETITIVE_PATTERN]:  RetryStrategy.RESTRUCTURE,
      [ErrorCategory.OVERCORRECTION]:      RetryStrategy.SIMPLIFY,
      [ErrorCategory.CONTEXT_LOSS]:        RetryStrategy.CLARIFY,
      [ErrorCategory.EMPTY_INPUT]:         RetryStrategy.DEFAULT,
      [ErrorCategory.OVERLENGTH_INPUT]:    RetryStrategy.SHORTEN,
      [ErrorCategory.NO_PREVIOUS_RESPONSE]: RetryStrategy.DEFAULT,
    };

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
      console.error('[ReflectionLoop] Save state failed:', e.message);
    }
  }

  // ================================================================
  // [新增] 自适应问题生成
  // ================================================================

  /**
   * 根据反思历史动态生成问题列表
   * - 经常失败的 question 权重降低
   * - 久未使用的 question 权重升高（探索）
   * - 检测到震荡时增加"反思反思"元问题
   * @param {object} context - 当前上下文
   * @returns {Array<{id: string, question: string, contextKey: string}>}
   */
  _generateQuestions(context = {}) {
    const pool = [...this._questionPool];

    // 1. 根据历史效果调整权重
    const recentLog = this.reflectionLog.slice(-20);
    for (const q of pool) {
      const relevantEntries = recentLog.filter(e => 
        e.questions && e.questions.some(rq => rq.question === q.question)
      );
      if (relevantEntries.length >= 3) {
        // 如果该问题经常导致修改但效果不佳，降低权重
        const poorOutcomes = relevantEntries.filter(e => {
          const match = e.insights && e.insights.find(i => i.question === q.question);
          return match && match.shouldModify && e.finalResponse && e.finalResponse.length > 0;
        }).length;
        const ratio = poorOutcomes / relevantEntries.length;
        q.weight = Math.max(0.1, q.weight * (1 - ratio * 0.3));
      }
    }

    // 2. 久未使用的 question 获得探索加成
    const lastUsedMap = {};
    for (let i = recentLog.length - 1; i >= 0; i--) {
      const entry = recentLog[i];
      if (entry.questions) {
        for (const q of entry.questions) {
          if (!lastUsedMap[q.question]) {
            lastUsedMap[q.question] = recentLog.length - i;
          }
        }
      }
    }
    for (const q of pool) {
      const staleness = lastUsedMap[q.question] || recentLog.length + 1;
      if (staleness > 10) {
        q.weight = Math.min(1.0, q.weight * 1.5); // 久未使用，探索加成
      }
    }

    // 3. 检测到震荡时，加入元问题
    if (this._anomalyState.health === ReflectionHealth.OSCILLATING ||
        this._anomalyState.health === ReflectionHealth.STUCK) {
      pool.push({
        id: 'meta_reflection',
        question: '我是否在重复同样的反思模式？是否需要从根本上改变策略？',
        contextKey: 'intent',
        weight: 2.0, // 高优先级
      });
    }

    // 4. 根据权重选择 Top-3 或 Top-4 问题
    const sorted = pool.sort((a, b) => b.weight - a.weight);
    const count = this._anomalyState.health === ReflectionHealth.HEALTHY ? 3 : 4;
    return sorted.slice(0, count).map(q => ({
      id: q.id,
      question: q.question,
      contextKey: q.contextKey,
    }));
  }

  // ================================================================
  // [新增] 震荡检测
  // ================================================================

  /**
   * 检测反思模式是否陷入震荡
   * 震荡定义：连续 N 次反思中，模式签名高度重复
   * @param {object} reflection - 本次反思记录
   * @returns {{ isOscillating: boolean, pattern: string, frequency: number }}
   */
  _detectOscillation(reflection) {
    // 从反思结果中提取模式签名
    const insights = reflection.insights || [];
    const patternKey = insights
      .filter(i => i && i.shouldModify)
      .map(i => i.question ? i.question.substring(0, 10) : 'modify')
      .sort()
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
   * 检测反思循环的异常状态
   * 1. 预测持续失败 → 降级
   * 2. 震荡模式 → stuck
   * 3. 自愈：超过阈值时自动重置
   * @param {object} monitoring - 说后监测结果
   */
  _detectAnomaly(monitoring) {
    const now = Date.now();

    // 1. 检测预测失败
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
      // 成功时减少连续失败计数
      this._anomalyState.consecutiveFailures = Math.max(0, this._anomalyState.consecutiveFailures - 1);
    }

    // 2. 判断健康状态
    if (this._anomalyState.consecutiveFailures >= 5) {
      this._anomalyState.health = ReflectionHealth.DEGRADED;
    }
    if (this._anomalyState.consecutiveFailures >= 10) {
      this._anomalyState.health = ReflectionHealth.STUCK;
    }

    // 3. 震荡检测升级
    const oscResult = monitoring ? this._detectOscillation({ 
      insights: monitoring.effectiveness === 'poor' 
        ? [{ shouldModify: true, question: 'poor_effectiveness' }] 
        : [] 
    }) : { isOscillating: false };
    if (oscResult.isOscillating && this._anomalyState.health === ReflectionHealth.HEALTHY) {
      this._anomalyState.health = ReflectionHealth.OSCILLATING;
    }

    // 4. [自愈逻辑] 连续失败超过阈值时自动重置
    if (this._anomalyState.consecutiveFailures >= 15) {
      const timeSinceLastRecovery = now - this._anomalyState.lastRecoveryTime;
      if (timeSinceLastRecovery > 300000) { // 5分钟冷却
        this._selfHeal();
      }
    }

    return {
      health: this._anomalyState.health,
      consecutiveFailures: this._anomalyState.consecutiveFailures,
    };
  }

  // ================================================================
  // [新增] 自愈逻辑
  // ================================================================

  /**
   * 当反思循环自身退化时，自动重置并切换策略
   */
  _selfHeal() {
    this._anomalyState.consecutiveFailures = 0;
    this._anomalyState.health = ReflectionHealth.RECOVERING;
    this._anomalyState.lastRecoveryTime = Date.now();
    this._oscillationState.recentPatterns = [];
    this._oscillationState.patternFrequency = {};

    // 重置问题权重
    for (const q of this._questionPool) {
      q.weight = 1.0;
    }

    // 降低 MAX_LOG_SIZE 以加速老化
    this.reflectionLog = this.reflectionLog.slice(-20);
    this.lastResponse = null;
    this.lastPrediction = null;

    this.saveState();
  }

  // ================================================================
  // [新增] 错误分类
  // ================================================================

  /**
   * 将反思/监测结果分类为错误类型
   * @param {object} monitoring - 监测结果
   * @returns {ErrorCategory} 错误分类
   */
  _classifyError(monitoring) {
    if (!monitoring) return ErrorCategory.EMPTY_INPUT;

    if (monitoring.status === 'no_previous_response') {
      return ErrorCategory.NO_PREVIOUS_RESPONSE;
    }

    if (monitoring.effectiveness === 'poor') {
      // 检查是否因为过度修改
      if (this.lastResponse && this.lastResponse.final) {
        const ratio = this.lastResponse.final.length / (this.lastResponse.draft.length || 1);
        if (ratio > 2 || ratio < 0.3) {
          return ErrorCategory.OVERCORRECTION;
        }
      }
      return ErrorCategory.PREDICTION_MISMATCH;
    }

    const osc = this._detectOscillation({ insights: [] });
    if (osc.isOscillating) {
      return ErrorCategory.REPETITIVE_PATTERN;
    }

    return ErrorCategory.CONTEXT_LOSS;
  }

  // ================================================================
  // [新增] 重试策略建议
  // ================================================================

  /**
   * 根据错误类型推荐重试策略
   * @param {ErrorCategory} errorCategory - 错误分类
   * @returns {{ strategy: string, suggestion: string }}
   */
  _suggestRetryStrategy(errorCategory) {
    const strategy = this._errorToRetryStrategy[errorCategory] || RetryStrategy.DEFAULT;

    const suggestions = {
      [RetryStrategy.SIMPLIFY]:    '尝试用更短的句子，减少修饰词，直接表达核心意思',
      [RetryStrategy.EMPATHIZE]:   '增加共情表达，先确认用户感受再给出建议',
      [RetryStrategy.CLARIFY]:     '先澄清用户意图，确认理解正确后再回应',
      [RetryStrategy.SHORTEN]:     '将回复缩短到原来的 50%，只保留最关键的信息',
      [RetryStrategy.RESTRUCTURE]: '重新组织回复结构，用不同的逻辑顺序表达',
      [RetryStrategy.NEUTRALIZE]:  '降低情绪色彩，使用更中性的语言',
      [RetryStrategy.DEFAULT]:     '保持现有策略，继续观察',
    };

    return {
      strategy,
      suggestion: suggestions[strategy] || suggestions[RetryStrategy.DEFAULT],
    };
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
      context,
      timestamp: reflection.timestamp,
    };

    this.reflectionLog.push({ ...reflection, finalResponse: modified });

    // Bounded cache
    if (this.reflectionLog.length > this.MAX_LOG_SIZE) {
      this.reflectionLog = this.reflectionLog.slice(-this.MAX_LOG_SIZE);
    }

    return {
      original: responseDraft,
      final: modified,
      wasModified: reflection.wasModified,
      insights,
      questions,
      health: this._anomalyState.health,
    };
  }

  /**
   * 自我反思 - 生成洞察
   * [增强] 支持动态问题列表
   */
  async selfReflect(questions, draft, context) {
    const insights = [];

    for (const q of questions) {
      let insight = {
        question: q.question,
        answer: '',
        shouldModify: false,
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

      if (q.question.includes('更准确') || q.question.includes('简洁')) {
        const issues = this.analyzeExpression(draft, context);
        insight.answer = issues.length > 0 ? `可改进: ${issues.join('; ')}` : '表达已经清晰准确';
        insight.shouldModify = issues.length > 0;
      }

      if (q.question.includes('太长')) {
        insight.answer = draft.length > 150 ? '回复偏长，建议精简' : '长度适中';
        insight.shouldModify = draft.length > 150;
      }

      if (q.question.includes('重复')) {
        const prevResponses = this.reflectionLog.slice(-3).map(e => e.finalResponse || '').filter(Boolean);
        const isRepeat = prevResponses.some(prev => {
          if (!prev) return false;
          const overlap = this._stringOverlap(draft.toLowerCase(), prev.toLowerCase());
          return overlap > 0.7;
        });
        insight.answer = isRepeat ? '检测到与之前回复内容高度重复' : '未检测到重复';
        insight.shouldModify = isRepeat;
      }

      if (q.question.includes('事实依据')) {
        // 简单检测：包含数字但没有引用来源
        const hasNumbers = /\d+/.test(draft);
        const hasSources = /(?:根据|来源|参考|据|from|source|reference)/i.test(draft);
        insight.answer = hasNumbers && !hasSources ? '包含具体数据但未标注来源' : '断言基本合理';
        insight.shouldModify = hasNumbers && !hasSources && draft.length > 50;
      }

      if (q.question.includes('具体')) {
        const isVague = /(?:一些|某些|很多|大概|差不多|maybe|perhaps|some|many|a lot)/i.test(draft) && draft.length < 100;
        insight.answer = isVague ? '表达较为笼统，建议增加具体细节' : '具体程度适中';
        insight.shouldModify = isVague;
      }

      if (q.question.includes('重复同样的反思')) {
        const recentModifications = this.reflectionLog.slice(-5).filter(e => e.wasModified).length;
        insight.answer = recentModifications >= 4 ? '近5次对话连续修改回复，可能存在过度反思' : '反思模式正常';
        insight.shouldModify = recentModifications >= 4;
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
   * 在收到用户下一条消息后，分析反应是否与预期一致
   * [增强] 异常检测 + 错误分类 + 重试策略建议
   */
  async monitorAfterSpeaking(userReaction, context = {}) {
    // [边界检查] 空输入
    if (!userReaction || typeof userReaction !== 'string') {
      return {
        status: 'empty_input',
        message: '用户输入为空，无法监测',
        errorCategory: ErrorCategory.EMPTY_INPUT,
        retryStrategy: this._suggestRetryStrategy(ErrorCategory.EMPTY_INPUT),
      };
    }

    // [边界检查] 极长输入
    if (userReaction.length > 50000) {
      return {
        status: 'overlength_input',
        message: '用户输入过长，跳过完整监测',
        errorCategory: ErrorCategory.OVERLENGTH_INPUT,
        retryStrategy: this._suggestRetryStrategy(ErrorCategory.OVERLENGTH_INPUT),
      };
    }

    if (!this.lastResponse) {
      const anomaly = this._detectAnomaly(null);
      return {
        status: 'no_previous_response',
        message: '无上一条回复可监测',
        errorCategory: ErrorCategory.NO_PREVIOUS_RESPONSE,
        retryStrategy: this._suggestRetryStrategy(ErrorCategory.NO_PREVIOUS_RESPONSE),
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

    // [增强] 异常检测
    const anomaly = this._detectAnomaly(monitoring);

    // [增强] 错误分类 + 重试策略建议
    const errorCategory = this._classifyError(monitoring);
    const retryStrategy = this._suggestRetryStrategy(errorCategory);

    monitoring.anomaly = anomaly;
    monitoring.errorCategory = errorCategory;
    monitoring.retryStrategy = retryStrategy;

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

module.exports = { ReflectionLoop, ReflectionHealth, ErrorCategory, RetryStrategy };
