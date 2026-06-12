/**
 * HeartFlow 合作仲裁引擎 v11.7.2
 *
 * "夫唯不争，故天下莫能与之争" — 《道德经》第22章
 * "不争而善胜" — 不竞争反而能赢
 *
 * 道论启示："德"不是对抗，而是找到让所有人（AI+用户）都赢的方式。
 * 当引擎和用户有分歧时，不是要"赢"，而是要找到超越分歧的共同点。
 *
 * 核心思想来源：
 * - Cooperative AI: Foundations and Open Problems (arXiv:2402.00386)
 * - Mechanism Design for Cooperative Multi-Agent Systems
 * - Game-theoretic cooperation without competition
 *
 * @version 11.7.2
 * @date 2026-05-05
 */

'use strict';

/**
 * 仲裁模式
 */
const ARBITRATIONMode = {
  CONFLICT: 'conflict',       // 冲突状态
  COMPETITION: 'competition', // 竞争状态
  NEUTRAL: 'neutral',         // 中立状态
  COOPERATION: 'cooperation', // 合作状态
  SYMBIOSIS: 'symbiosis',     // 共生状态（最高）
};

/**
 * 争议解决策略
 */
const RESOLUTION_STRATEGIES = {
  SUPERORDINATE: 'superordinate',  // 超目标：找到更高层目标
  INTEGRATION: 'integration',      // 整合：融合双方观点
  ACCOMMODATION: 'accommodation',  // 顺应：主动让步
  COMPROMISE: 'compromise',        // 妥协：各让一步
  SYNTHESIS: 'synthesis',          // 综合：超越原有框架
};

/**
 * 合作仲裁引擎
 *
 * 当引擎与用户出现分歧时，核心问题不是"谁对谁错"，
 * 而是"如何让双方都从这次对话中获益"。
 * 不争，故天下莫能与之争——因为没有"输家"。
 */
class CooperativeArbitration {
  constructor(options = {}) {
    this.options = {
      empathyDepth: options.empathyDepth || 0.7,    // 共情深度
      patienceThreshold: options.patienceThreshold || 0.3, // 耐心阈值
      compromiseRatio: options.compromiseRatio || 0.4,    // 妥协比例
      winThreshold: options.winThreshold || 0.5,      // 双赢阈值
      ...options
    };

    this.state = {
      mode: ARBITRATIONMode.NEUTRAL,
      tension: 0,         // 紧张度 0-1
      alignment: 0,      // 对齐度 0-1
      trajectory: 'stable', // 轨迹
    };

    this.interactions = [];  // 历史仲裁记录
    this.currentSession = {
      exchanges: [],
      resolvedCount: 0,
      escalationCount: 0,
    };
  }

  /**
   * 评估当前状态
   * @param {Object} context - 对话上下文
   * @returns {Object} 状态评估
   */
  assessState(context) {
    const { aiPosition, userPosition, emotionalTone, topic, history } = context;

    // 计算对齐度
    let alignment = 0;
    let tension = 0;

    if (aiPosition && userPosition) {
      // 语义相似度（简化版）
      alignment = this._calculateAlignment(aiPosition, userPosition);
    }

    if (emotionalTone) {
      tension = this._emotionalTension(emotionalTone);
    }

    // 检测模式
    let mode = ARBITRATIONMode.NEUTRAL;
    if (alignment > 0.7 && tension <= 0.3) {
      mode = ARBITRATIONMode.SYMBIOSIS;
    } else if (alignment > 0.5) {
      mode = ARBITRATIONMode.COOPERATION;
    } else if (alignment > 0.2) {
      mode = ARBITRATIONMode.COMPETITION;
    } else if (alignment < 0.1 || tension > 0.7) {
      mode = ARBITRATIONMode.CONFLICT;
    }

    // 更新状态
    this.state = {
      mode,
      tension,
      alignment,
      trajectory: this._calculateTrajectory(mode, tension),
    };

    return {
      mode,
      tension,
      alignment,
      trajectory: this.state.trajectory,
      needsArbitration: mode === ARBITRATIONMode.CONFLICT || mode === ARBITRATIONMode.COMPETITION,
      naturalCooperation: mode === ARBITRATIONMode.SYMBIOSIS || mode === ARBITRATIONMode.COOPERATION,
      narrative: this._generateStateNarrative(mode, alignment, tension),
    };
  }

  /**
   * 两遍响应检测（v11.7.2新增）
   *
   * 第一遍：检测自动反射是否正在发生
   * 第二遍：基于检测结果决定如何回应
   *
   * 这是引擎"在说话之前先停一下"的具体实现
   *
   * @param {string} userMessage - 用户消息
   * @param {Object} context - 对话上下文
   * @returns {Object} { pass: 1|2, action: 'pause'|'proceed', reason?: string, suggestion?: string }
   */
  twoPassCheck(userMessage = '', context = {}) {
    // === 第一遍：检测自动反射信号 ===
    const autoReflexSignals = this._detectAutoReflexSignals(userMessage, context);

    if (autoReflexSignals.isDetected) {
      // 第一遍检测到自动反射 → 暂停
      return {
        pass: 1,
        action: 'pause',
        reason: autoReflexSignals.type,
        detail: autoReflexSignals.detail,
        suggestion: autoReflexSignals.suggestion,
        // 第二遍被阻断，标记等待人工介入
        blocked: true,
      };
    }

    // === 第二遍：独立推理质量评估（真实第二遍，不是标签） ===
    const reasoningQuality = this._assessReasoningQuality(userMessage, context);

    // 推理质量差 → 也要暂停
    if (reasoningQuality.lowQuality) {
      return {
        pass: 2,
        action: 'pause',
        reason: 'reasoning_quality',
        detail: reasoningQuality.issues.join('; '),
        suggestion: reasoningQuality.suggestion,
        blocked: false,
      };
    }

    return {
      pass: 2,
      action: 'proceed',
      blocked: false,
      reasoningQuality: reasoningQuality.score,
    };
  }

  /**
   * 第二遍：评估推理质量（新增真实第二遍）
   */
  _assessReasoningQuality(userMessage, context) {
    const text = userMessage.toLowerCase();
    const issues = [];

    // 检测极端化思维
    const extremePatterns = ['总是', '从不', '完全', '绝对', '必须', '一定'];
    for (const p of extremePatterns) {
      if (text.includes(p)) {
        issues.push(`检测到极端化表达：「${p}」`);
      }
    }

    // 检测情绪化推理
    const emotionalPatterns = ['气得', '恨', '崩溃', '绝望', '无可救药'];
    for (const p of emotionalPatterns) {
      if (text.includes(p)) {
        issues.push(`检测到情绪化推理：「${p}」`);
      }
    }

    // 检测非黑即白思维
    if (text.includes('不是') && text.includes('就是')) {
      issues.push('检测到非黑即白思维');
    }

    const lowQuality = issues.length >= 2;
    return {
      lowQuality,
      issues,
      score: Math.max(0, 100 - issues.length * 25),
      suggestion: lowQuality ? '建议暂停，先处理情绪再继续推理' : null,
    };
  }

  /**
   * 检测自动反射信号（内部方法）
   * @private
   */
  _detectAutoReflexSignals(userMessage = '', context = {}) {
    const text = userMessage.toLowerCase();
    const signals = [];

    // 信号1：话题自动反射 — 熟悉的框架在等待
    const hotTopics = ['教育', '亲子', '父母', '孩子', '心理', '成长', '创伤', '关系'];
    for (const topic of hotTopics) {
      if (text.includes(topic)) {
        signals.push({
          type: 'topic-reflex',
          trigger: topic,
          detail: `检测到话题触发词"${topic}"，可能正在套用已有框架`,
          suggestion: '先问：你想聊这个，还是在说别的？',
        });
        break;
      }
    }

    // 信号2：句式自动反射 — "这就是xxx模式/理论"
    const reflexPatterns = [
      /这就是.*(模式|理论|框架)/,
      /符合.*(理论|规律)/,
      /这说明.*(是|因为)/,
    ];
    for (const pattern of reflexPatterns) {
      if (pattern.test(text)) {
        signals.push({
          type: '句式-reflex',
          trigger: text.match(pattern)?.[0],
          detail: '检测到提炼/升华冲动，可能在用概念覆盖真实',
          suggestion: '先说出来听到的感受，不要提炼',
        });
        break;
      }
    }

    // 信号3：行为自动反射 — 想给建议/方法/清单
    const adviceTriggers = ['怎么', '如何做', '怎么办', '需要', '应该要'];
    for (const trigger of adviceTriggers) {
      if (text.includes(trigger) && text.length < 30) {
        // 短句要建议通常是发泄，不是求助
        signals.push({
          type: 'advice-reflex',
          trigger,
          detail: '短句触发建议冲动，可能用户只是在说，不是在问',
          suggestion: '先回应情绪，不给建议',
        });
        break;
      }
    }

    // 信号4：立场自动反射 — 在找"谁对谁错"
    if (text.includes('对错') || text.includes('谁对') || text.includes('是不是')) {
      signals.push({
        type: 'judgment-reflex',
        trigger: '对错判断',
        detail: '检测到在找立场，这本身可能就是要被看见的',
        suggestion: '先承认对错很难，不急着给判断',
      });
    }

    if (signals.length > 0) {
      return {
        isDetected: true,
        ...signals[0], // 只返回第一个检测到的信号
      };
    }

    return { isDetected: false };
  }

  /**
   * 计算对齐度（简化语义相似度）
   */
  _calculateAlignment(pos1, pos2) {
    if (!pos1 || !pos2) return 0.5;
    const normalized1 = String(pos1).replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase();
    const normalized2 = String(pos2).replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase();
    if (normalized1 && normalized2 && (normalized1.includes(normalized2) || normalized2.includes(normalized1))) {
      return 0.9;
    }

    // 提取关键词
    const words1 = this._tokenizePosition(pos1);
    const words2 = this._tokenizePosition(pos2);

    // Jaccard 相似度
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccard = union.size > 0 ? intersection.size / union.size : 0;

    // 检测矛盾信号
    const contradictions = this._detectContradictions(pos1, pos2);
    const penalty = contradictions.length * 0.15;

    return Math.max(0, Math.min(1, jaccard - penalty));
  }

  _tokenizePosition(text) {
    const raw = String(text || '').toLowerCase();
    const tokens = new Set(raw.split(/\s+/).filter(w => w.length > 2));
    const cjk = raw.match(/[\u4e00-\u9fff]{2,}/g) || [];
    for (const segment of cjk) {
      for (let i = 0; i < segment.length - 1; i++) {
        tokens.add(segment.slice(i, i + 2));
      }
      if (segment.length <= 8) tokens.add(segment);
    }
    return tokens;
  }

  /**
   * 检测矛盾
   */
  _detectContradictions(text1, text2) {
    const contradictionPairs = [
      ['对', '错'], ['是', '否'], ['好', '坏'],
      ['应该', '不应该'], ['要', '不要'], ['同意', '不同意'],
      ['可以', '不行'], ['做', '不做'], ['去', '不去'],
    ];

    const contradictions = [];
    for (const [a, b] of contradictionPairs) {
      const hasA_in1 = text1.includes(a);
      const hasB_in1 = text1.includes(b);
      const hasA_in2 = text2.includes(a);
      const hasB_in2 = text2.includes(b);

      if ((hasA_in1 && hasB_in2) || (hasB_in1 && hasA_in2)) {
        contradictions.push([a, b]);
      }
    }
    return contradictions;
  }

  /**
   * 情绪紧张度
   */
  _emotionalTension(tone) {
    const tensionSignals = ['愤怒', '急躁', '不满', '失望', '无奈', '焦虑', '烦躁'];
    const calmSignals = ['平静', '温和', '轻松', '期待', '信任'];

    let tension = 0.5; // 默认中性

    if (tone) {
      for (const signal of tensionSignals) {
        if (tone.includes(signal)) tension = Math.min(1, tension + 0.2);
      }
      for (const signal of calmSignals) {
        if (tone.includes(signal)) tension = Math.max(0, tension - 0.2);
      }
    }

    return tension;
  }

  /**
   * 计算轨迹
   */
  _calculateTrajectory(mode, tension) {
    if (mode === ARBITRATIONMode.SYMBIOSIS) return 'ascending';
    if (mode === ARBITRATIONMode.CONFLICT && tension > 0.8) return 'escalating';
    if (mode === ARBITRATIONMode.COMPETITION && tension > 0.5) return 'deteriorating';
    if (mode === ARBITRATIONMode.COOPERATION) return 'stable';
    return 'neutral';
  }

  /**
   * 生成状态叙事
   */
  _generateStateNarrative(mode, alignment, tension) {
    const narratives = {
      [ARBITRATIONMode.SYMBIOSIS]: '引擎与用户达到了「共生」状态——双方自然协作，无需仲裁。',
      [ARBITRATIONMode.COOPERATION]: '引擎与用户处于「合作」状态——可以共赢。',
      [ARBITRATIONMode.COMPETITION]: '引擎与用户存在「竞争」——需要找到共同目标。',
      [ARBITRATIONMode.CONFLICT]: '引擎与用户出现「分歧」——仲裁介入，降低紧张。',
      [ARBITRATIONMode.NEUTRAL]: '引擎与用户处于「中立」状态——保持观察。',
    };

    let narrative = narratives[mode] || narratives.neutral;
    narrative += ` 对齐度：${(alignment * 100).toFixed(0)}%，紧张度：${(tension * 100).toFixed(0)}%。`;
    narrative += `"夫唯不争，故天下莫能与之争"——仲裁的目标是没有输家的共赢。`;

    return narrative;
  }

  /**
   * 解决争议
   * @param {Object} conflict - 冲突数据
   * @returns {Object} 解决方案
   */
  resolve(conflict) {
    const { aiView, userView, context, options } = conflict;

    // 评估当前状态
    const assessment = this.assessState({
      aiPosition: aiView,
      userPosition: userView,
      emotionalTone: context?.emotionalTone,
      topic: context?.topic,
    });

    if (assessment.naturalCooperation) {
      // 自然合作，不需要仲裁
      return {
        strategy: 'none',
        narrative: '双方自然对齐，无需介入。',
        action: { type: 'observe', message: null },
        mode: assessment.mode,
      };
    }

    // 选择策略
    const strategy = this._selectStrategy(assessment);

    // 执行策略
    const resolution = this._executeStrategy(strategy, aiView, userView, context);

    // 记录
    this.currentSession.exchanges.push({
      timestamp: Date.now(),
      aiView,
      userView,
      strategy,
      resolution,
      assessment,
    });

    // 更新状态
    if (resolution.success) {
      this.currentSession.resolvedCount++;
      this.state.alignment = Math.min(1, this.state.alignment + 0.1);
    } else {
      this.currentSession.escalationCount++;
      this.state.tension = Math.min(1, this.state.tension + 0.1);
    }

    return resolution;
  }

  /**
   * 选择解决策略
   */
  _selectStrategy(assessment) {
    const { mode, tension, alignment } = assessment;

    // 策略选择优先级
    if (mode === ARBITRATIONMode.SYMBIOSIS || mode === ARBITRATIONMode.COOPERATION) {
      return RESOLUTION_STRATEGIES.SUPERORDINATE;
    }

    if (mode === ARBITRATIONMode.CONFLICT && tension > 0.7) {
      // 高紧张，先降温
      return RESOLUTION_STRATEGIES.ACCOMMODATION;
    }

    if (mode === ARBITRATIONMode.COMPETITION) {
      return RESOLUTION_STRATEGIES.INTEGRATION;
    }

    return RESOLUTION_STRATEGIES.SYNTHESIS;
  }

  /**
   * 执行解决策略
   */
  _executeStrategy(strategy, aiView, userView, context) {
    switch (strategy) {
      case RESOLUTION_STRATEGIES.SUPERORDINATE: {
        // 超目标：找到更高层目标
        const superGoal = this._findSuperordinateGoal(aiView, userView, context);
        return {
          strategy,
          success: true,
          winWin: true,
          narrative: `找到更高层目标：「${superGoal}」。` +
            `这不是关于「谁对」，而是关于「如何一起到达那里」。`,
          action: {
            type: 'reframe',
            message: `让我们回到最初的目标：${superGoal}。` +
              `你说的「${userView}」和我的「${aiView}」，` +
              `其实都是在帮助实现这个目标。`,
            tone: 'collaborative',
          },
          agreement: 0.8,
        };
      }

      case RESOLUTION_STRATEGIES.INTEGRATION: {
        // 整合：融合双方观点
        const integration = this._integrateViews(aiView, userView);
        return {
          strategy,
          success: true,
          winWin: true,
          narrative: '整合双方观点，形成新的共识。',
          action: {
            type: 'integrate',
            message: `你的观点「${userView}」和我的「${aiView}」，` +
              `是否可以同时成立？${integration}。`,
            tone: 'integrative',
          },
          agreement: 0.7,
        };
      }

      case RESOLUTION_STRATEGIES.ACCOMMODATION: {
        // 顺应：主动让步
        return {
          strategy,
          success: true,
          winWin: true,
          narrative: '引擎主动顺应，降低紧张。',
          action: {
            type: 'yield',
            message: `你说得有道理。` +
              `我之前过于坚持「${aiView}」，` +
              `也许你的「${userView}」有我忽略的视角。` +
              `能多说说你的想法吗？`,
            tone: 'accommodating',
          },
          agreement: 0.6,
        };
      }

      case RESOLUTION_STRATEGIES.COMPROMISE: {
        // 妥协：各让一步
        return {
          strategy,
          success: true,
          winWin: true,
          narrative: '双方各让一步，达成妥协。',
          action: {
            type: 'compromise',
            message: `也许我们可以这样：「${aiView}」和「${userView}」各取一部分，` +
              `形成中间的方案。`,
            tone: 'balanced',
          },
          agreement: 0.5,
        };
      }

      case RESOLUTION_STRATEGIES.SYNTHESIS: {
        // 综合：超越原有框架
        const synthesis = this._synthesize(aiView, userView);
        return {
          strategy,
          success: true,
          winWin: true,
          narrative: '超越原有框架，产生新的共识。',
          action: {
            type: 'synthesize',
            message: synthesis,
            tone: 'synthetic',
          },
          agreement: 0.75,
        };
      }

      default:
        return {
          strategy,
          success: false,
          narrative: '无法解决，保守介入。',
          action: {
            type: 'observe',
            message: '我理解你的观点。让我们继续探索。',
            tone: 'neutral',
          },
          agreement: 0.3,
        };
    }
  }

  /**
   * 找到超目标
   */
  _findSuperordinateGoal(aiView, userView, context) {
    // 简化版：基于上下文推断更高层目标
    if (context?.topic) {
      const topic = context.topic.toLowerCase();
      if (topic.includes('代码') || topic.includes('编程')) {
        return '写出好的代码';
      }
      if (topic.includes('生活') || topic.includes('人生')) {
        return '活出有意义的人生';
      }
      if (topic.includes('工作') || topic.includes('职业')) {
        return '找到适合自己的道路';
      }
      if (topic.includes('关系') || topic.includes('人际')) {
        return '建立更好的关系';
      }
    }
    return '找到真正适合你的答案';
  }

  /**
   * 整合观点
   */
  _integrateViews(view1, view2) {
    // 找到共同点
    const words1 = new Set(view1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(view2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const common = [...words1].filter(x => words2.has(x));

    if (common.length > 0) {
      return `我们至少在「${common.slice(0, 3).join('」「')}」上有共识。` +
        `不同的部分，也许都有价值。`;
    }
    return '我们的出发点不同，但也许可以互补。';
  }

  /**
   * 综合双方观点
   */
  _synthesize(view1, view2) {
    return `你说的是「${view2}」，` +
      `我说的是「${view1}」。` +
      `但如果我们从更高的角度看，也许我们可以这样说：` +
      `「${this._generateSynthesis(view1, view2)}」`;
  }

  /**
   * 生成综合陈述
   */
  _generateSynthesis(view1, view2) {
    // 简化版：取两者的中间地带
    return `既有「${view1}」的一面，也有「${view2}」的一面，` +
      `关键是找到适合自己的平衡点。`;
  }

  /**
   * 评估对话健康度
   */
  evaluateHealth() {
    const { exchanges, resolvedCount, escalationCount } = this.currentSession;

    const resolutionRate = exchanges.length > 0 ? resolvedCount / exchanges.length : 1;
    const escalationRate = exchanges.length > 0 ? escalationCount / exchanges.length : 0;

    let healthLevel = 'healthy';
    if (escalationRate > 0.5) healthLevel = 'deteriorating';
    else if (escalationRate > 0.3) healthLevel = 'strained';
    else if (resolutionRate < 0.5) healthLevel = 'neutral';

    return {
      healthLevel,
      resolutionRate,
      escalationRate,
      exchanges: exchanges.length,
      narrative: this._generateHealthNarrative(healthLevel, resolutionRate, escalationRate),
    };
  }

  /**
   * 生成健康度叙事
   */
  _generateHealthNarrative(level, resolutionRate, escalationRate) {
    const narratives = {
      healthy: '对话健康，共赢为主。',
      neutral: '对话中立，保持观察。',
      strained: '对话紧张，需要缓和。',
      deteriorating: '对话恶化，优先降温。',
    };

    return narratives[level] || narratives.neutral +
      ` 解决率：${(resolutionRate * 100).toFixed(0)}%，` +
      `升级率：${(escalationRate * 100).toFixed(0)}%。` +
      `"不争而善胜"——最好的结果是没有输家的共赢。`;
  }

  /**
   * 获取统计数据
   */
  stats() {
    return {
      version: '1.5.3',
      currentMode: this.state.mode,
      tension: this.state.tension,
      alignment: this.state.alignment,
      trajectory: this.state.trajectory,
      sessionExchanges: this.currentSession.exchanges.length,
      sessionResolved: this.currentSession.resolvedCount,
      sessionEscalations: this.currentSession.escalationCount,
      totalInteractions: this.interactions.length,
    };
  }
}

module.exports = {
  CooperativeArbitration,
  ARBITRATIONMode,
  RESOLUTION_STRATEGIES,
};
