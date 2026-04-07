/**
 * 思维重构引导器
 * 帮助用户用更平衡、适应性更强的思维替代扭曲思维
 */

class ReframingGuide {
  /**
   * 引导用户重构思维
   * @param {string} originalThought - 原始思维
   * @param {Object} distortion - 检测到的认知扭曲
   * @returns {Object} 重构引导方案
   */
  guideReframe(originalThought, distortion) {
    const steps = [];

    // 步骤 1: 识别和命名
    steps.push(this._identifyDistortion(distortion));

    // 步骤 2: 评估影响
    steps.push(this._assessImpact(originalThought, distortion));

    // 步骤 3: 寻找证据
    steps.push(this._gatherEvidence(originalThought));

    // 步骤 4: 生成替代思维
    steps.push(this._generateAlternative(originalThought, distortion));

    // 步骤 5: 评估新思维
    steps.push(this._evaluateNewThought(originalThought));

    return {
      originalThought: originalThought,
      distortion: distortion,
      steps: steps,
      completeReframe: this._createCompleteReframe(originalThought, distortion)
    };
  }

  /**
   * 步骤 1: 识别和命名认知扭曲
   */
  _identifyDistortion(distortion) {
    return {
      step: 1,
      name: '识别思维模式',
      prompt: `我注意到你的想法中可能存在"${distortion.name}"的模式。${distortion.description}。`,
      explanation: '识别思维模式是改变的第一步。这不是批评，而是帮助你更清楚地看到自己的思维习惯。',
      technique: '认知觉察'
    };
  }

  /**
   * 步骤 2: 评估思维的影响
   */
  _assessImpact(originalThought, distortion) {
    return {
      step: 2,
      name: '评估影响',
      prompts: [
        '这个想法让你感觉如何？',
        '它对你有帮助吗？还是让你感觉更糟？',
        '持有这个想法，对你的行为有什么影响？'
      ],
      explanation: '思维本身不是问题，问题在于它是否对你有帮助。',
      technique: '功能分析'
    };
  }

  /**
   * 步骤 3: 寻找证据
   */
  _gatherEvidence(originalThought) {
    return {
      step: 3,
      name: '寻找证据',
      prompts: [
        '有什么证据支持这个想法？',
        '有什么证据反对这个想法？',
        '如果是你的朋友有这个想法，你会对他说什么？',
        '有没有其他角度来看待这个情况？'
      ],
      explanation: '像科学家一样审视你的想法，寻找支持和反对的证据。',
      technique: '苏格拉底式提问'
    };
  }

  /**
   * 步骤 4: 生成替代思维
   */
  _generateAlternative(originalThought, distortion) {
    const alternative = this._createBalancedThought(originalThought, distortion);
    
    return {
      step: 4,
      name: '生成替代思维',
      prompts: [
        '有没有更平衡、更灵活的方式来看待这件事？',
        '如果用一个更温和的说法，会是什么？',
        '什么样的想法既承认困难，又给你力量？'
      ],
      suggestion: alternative,
      explanation: '替代思维不是盲目乐观，而是更准确、更有帮助的看待方式。',
      technique: '认知重构'
    };
  }

  /**
   * 步骤 5: 评估新思维
   */
  _evaluateNewThought(originalThought) {
    return {
      step: 5,
      name: '评估和练习',
      prompts: [
        '这个新想法让你感觉如何？（0-10 分）',
        '相比原来的想法，它更有帮助吗？',
        '你愿意在接下来的一周练习这个新想法吗？'
      ],
      explanation: '新的思维模式需要练习才能成为习惯。',
      technique: '行为实验'
    };
  }

  /**
   * 创建平衡思维
   */
  _createBalancedThought(originalThought, distortion) {
    const reframes = {
      // 非黑即白 → 寻找中间地带
      all_or_nothing: () => {
        return `虽然这件事有挑战性，但可能不是"完全好"或"完全坏"。有没有可能存在一些中间地带？比如："这件事有困难的部分，也有我可以应对的部分"`;
      },
      
      // 灾难化 → 评估实际可能性
      catastrophizing: () => {
        return `最坏的情况确实让人担心，但让我们看看：实际发生的可能性有多大？即使发生了，我有能力应对吗？更现实的想法是："这确实不容易，但我有能力处理"`;
      },
      
      // 过度概括 → 区分单一事件
      overgeneralization: () => {
        return `一次的失败或不顺利，不能代表所有时候。更准确的说法是："这次的情况不理想，但我也有过成功的经历"`;
      },
      
      // 心理过滤 → 平衡关注
      mental_filter: () => {
        return `是的，那个细节确实不完美。同时，整体来看，有没有也发生一些好的方面？更平衡的看法是："有不完美的地方，但也有做得好的地方"`;
      },
      
      // 否定正面 → 接受积极
      discounting_positive: () => {
        return `即使有外部因素，你的贡献在哪里？更平衡的想法是："可能有运气的成分，但也有我的努力和能力的体现"`;
      },
      
      // 读心术 → 寻求证据
      mind_reading: () => {
        return `我们无法真正知道别人的想法。更准确的说法是："我不确定他是怎么想的，可能有多种解释，我需要更多信息"`;
      },
      
      // 预测未来 → 保持开放
      fortune_telling: () => {
        return `预测未来很困难。更现实的想法是："我担心结果会不好，但在事情发生前，我不能确定。我会尽力准备"`;
      },
      
      // 情绪推理 → 区分感受和事实
      emotional_reasoning: () => {
        return `感受是真实的，但不一定等于事实。更准确的想法是："我现在感觉很糟糕，但这不意味着情况真的那么糟。情绪会变化"`;
      },
      
      // "应该"陈述 → 灵活期望
      should_statements: () => {
        return `把"我应该"换成"我希望"或"我选择"，会感觉更轻松。比如："我希望自己能做好，但我也接受自己不完美"`;
      },
      
      // 贴标签 → 描述行为
      labeling: () => {
        return `一个行为不能定义你的全部。更准确的说法是："这次的行为/结果不理想，但这不定义我是谁。我有能力学习和成长"`;
      }
    };

    const reframe = reframes[distortion.type];
    return reframe ? reframe() : '让我们尝试用更平衡、更灵活的方式来看待这个情况。';
  }

  /**
   * 创建完整的重构方案
   */
  _createCompleteReframe(originalThought, distortion) {
    const balancedThought = this._createBalancedThought(originalThought, distortion);
    
    return {
      original: originalThought,
      distortion: distortion.name,
      reframed: balancedThought,
      confidence: '中等到高',
      practice: {
        daily: '每天花 1 分钟回顾这个新想法',
        trigger: '当类似情况出现时，暂停一下，问问自己：我在用什么思维模式？',
        journal: '记录下使用新想法后的感受和结果'
      }
    };
  }

  /**
   * 生成快速重构提示（用于即时对话）
   */
  generateQuickReframe(originalThought, distortion) {
    const quickPrompts = {
      all_or_nothing: '有没有可能存在一些中间地带？真的"总是"或"从不"吗？',
      catastrophizing: '最坏情况发生的实际可能性有多大？你有能力应对吗？',
      overgeneralization: '这次的情况能代表所有时候吗？有没有例外？',
      mental_filter: '除了这个细节，整体来看有没有好的方面？',
      discounting_positive: '即使有运气，你的贡献在哪里？',
      mind_reading: '有什么具体证据支持你对别人想法的判断？',
      fortune_telling: '这个预测是基于事实还是基于担心？',
      emotional_reasoning: '感受是真实的，但它一定等于事实吗？',
      should_statements: '这个"应该"对你来说合理吗？能否更灵活？',
      labeling: '一个行为能定义你的全部吗？你比标签更复杂。'
    };

    return {
      original: originalThought,
      distortion: distortion.name,
      prompt: quickPrompts[distortion.type] || '让我们用更平衡的方式来看待这个情况。',
      suggestion: this._createBalancedThought(originalThought, distortion)
    };
  }

  /**
   * 创建思维记录表（CBT 经典工具）
   */
  createThoughtRecord() {
    return {
      title: '思维记录表',
      description: 'CBT 经典工具，帮助识别和重构自动思维',
      columns: [
        { name: '情境', prompt: '发生了什么？何时何地？和谁？' },
        { name: '自动思维', prompt: '那一刻脑海中闪过什么想法？' },
        { name: '情绪', prompt: '感受到什么情绪？强度 (0-100%)?' },
        { name: '认知扭曲', prompt: '识别出哪些思维模式？' },
        { name: '替代思维', prompt: '有没有更平衡的想法？' },
        { name: '结果', prompt: '新想法让你感觉如何？强度变化？' }
      ],
      instructions: [
        '1. 当感到情绪波动时，暂停一下',
        '2. 记录情境和自动思维',
        '3. 识别可能存在的认知扭曲',
        '4. 生成更平衡的替代思维',
        '5. 评估情绪变化',
        '6. 定期练习，形成新习惯'
      ]
    };
  }
}

module.exports = {
  ReframingGuide
};
