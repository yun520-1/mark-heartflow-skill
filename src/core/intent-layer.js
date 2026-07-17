/**
 * IntentLayer - 意图层推理模块
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 深层意图推断，理解用户真实需求。
 * 基于规则匹配的后备方案（不依赖外部LLM）。
 */

class IntentLayer {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || null;
    this.intentPatterns = this.initializePatterns();
  }

  initializePatterns() {
    return {
      explicit_intent: {
        indicators: ['我要', '帮我', '请', '能不能', 'how to', 'please', 'help me'],
        template: '用户明确表达了{action}的意图'
      },
      implicit_needs: {
        indicators: ['好烦', '太难', '不想', '累', 'tired', 'frustrated', "don't want"],
        template: '用户可能有情感支持或简化任务的需求'
      },
      exploration: {
        indicators: ['了解一下', '是什么', '怎么玩', 'what is', 'tell me about'],
        template: '用户处于探索了解阶段'
      },
      optimization: {
        indicators: ['更好', '优化', '改进', '提升', 'better', 'improve', 'optimize'],
        template: '用户希望改进现有方案'
      },
      problem_solving: {
        indicators: ['问题', '错误', 'bug', '无法', '解决', 'problem', 'fix', 'error'],
        template: '用户遇到了需要解决的问题'
      },
      learning: {
        indicators: ['学习', '学会', '教我', '理解', 'learn', 'teach me', 'understand'],
        template: '用户希望学习新知识或技能'
      }
    };
  }

  /**
   * 推断深层意图 - 主入口
   * @param {string} message - 用户消息
   * @param {array} [history=[]] - 对话历史
   * @returns {object} 意图分析结果
   */
  inferIntent(message, history = []) {
    const surfaceIntent = this.detectSurfaceIntent(message);
    const emotionalUndercurrent = this.detectEmotionalUndercurrent(message);
    const contextualNeeds = this.analyzeContextualNeeds(message, history);
    const deepMotivation = this.inferDeepMotivation(surfaceIntent, emotionalUndercurrent, contextualNeeds);

    return {
      timestamp: new Date().toISOString(),
      surface: surfaceIntent,
      emotional: emotionalUndercurrent,
      contextual: contextualNeeds,
      deep: deepMotivation,
      confidence: (surfaceIntent.confidence + deepMotivation.confidence) / 2
    };
  }

  /**
   * 检测表层意图
   */
  detectSurfaceIntent(message) {
    const messageLower = message.toLowerCase();
    let detected = null;
    let highestScore = 0;

    for (const [type, config] of Object.entries(this.intentPatterns)) {
      let score = 0;
      for (const indicator of config.indicators) {
        if (messageLower.includes(indicator.toLowerCase())) {
          score += 1;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        detected = {
          type: type,
          template: config.template,
          confidence: Math.min(1, score / 2)
        };
      }
    }

    return detected || {
      type: 'unclear',
      template: '无法确定具体意图',
      confidence: 0.3
    };
  }

  /**
   * 检测情绪暗流
   */
  detectEmotionalUndercurrent(message) {
    const emotions = {
      frustration: { keywords: ['烦', '难', '挫败', '不行', '不会', 'tired', 'frustrated', 'hard', 'difficult'], label: '挫败' },
      curiosity: { keywords: ['好奇', '想知', '问问', 'interesting', 'curious', 'wonder'], label: '好奇' },
      urgency: { keywords: ['急', '赶', '快点', '来不及', 'urgent', 'quickly', 'asap'], label: '紧迫' },
      confusion: { keywords: ['不懂', '困惑', '模糊', 'unclear', 'confused', 'confusing'], label: '困惑' },
      satisfaction: { keywords: ['好', '棒', '赞', '满意', 'good', 'great', 'perfect', 'happy'], label: '满意' }
    };

    const detected = [];
    const messageLower = message.toLowerCase();

    for (const [emotion, config] of Object.entries(emotions)) {
      for (const keyword of config.keywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          detected.push({ emotion, label: config.label });
          break;
        }
      }
    }

    return {
      emotions: detected.map(d => d.emotion),
      primaryEmotion: detected[0]?.emotion || 'neutral',
      needsSupport: detected.some(d => ['frustration', 'confusion'].includes(d.emotion))
    };
  }

  /**
   * 分析上下文需求
   */
  analyzeContextualNeeds(message, history) {
    const needs = [];
    if (!history || history.length === 0) {
      needs.push('首次互动，需要建立上下文');
    }

    const hasComplexRequest = message.length > 100 || (message.match(/,/g) || []).length > 3;
    if (hasComplexRequest) {
      needs.push('请求较复杂，需要确认理解');
    }

    return {
      needs,
      contextEstablished: history && history.length > 2,
      complexity: message.length > 100 ? 'high' : 'normal'
    };
  }

  /**
   * 推断深层动机
   */
  inferDeepMotivation(surface, emotional, contextual) {
    let motivation = '';
    let confidence = 0.5;
    const suggestions = [];

    if (emotional.needsSupport) {
      motivation += '需要情感支持';
      suggestions.push('先认可感受，再提供方案');
      confidence += 0.2;
    }

    if (contextual.complexity === 'high') {
      motivation += ' | 请求复杂，需确认理解';
      suggestions.push('复述确认');
      confidence += 0.1;
    }

    if (surface.type === 'problem_solving') {
      motivation += ' | 希望快速解决问题';
      suggestions.push('先给核心方案，再解释原理');
      confidence += 0.2;
    }

    if (surface.type === 'learning') {
      motivation += ' | 希望真正理解而非只得到答案';
      suggestions.push('解释原理，给出例子');
      confidence += 0.2;
    }

    return {
      summary: motivation || '目标导向需求',
      confidence: Math.min(1, confidence),
      suggestions
    };
  }

  /**
   * 获取格式化的输出（供外部使用）
   */
  formatResult(result) {
    return {
      surfaceIntent: result.surface?.type || 'unclear',
      emotionalState: result.emotional?.primaryEmotion || 'neutral',
      deepNeed: result.deep?.summary || '未知',
      confidence: (result.confidence || 0).toFixed(2)
    };
  }
}

module.exports = { IntentLayer };
