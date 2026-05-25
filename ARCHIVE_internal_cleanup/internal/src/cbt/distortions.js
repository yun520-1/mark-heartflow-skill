/**
 * 认知扭曲识别器
 * 基于 CBT 理论，识别 10 种常见认知扭曲
 */

const CognitiveDistortions = {
  // 1. 非黑即白思维
  ALL_OR_NOTHING: 'all_or_nothing',
  // 2. 灾难化
  CATASTROPHIZING: 'catastrophizing',
  // 3. 过度概括
  OVERGENERALIZATION: 'overgeneralization',
  // 4. 心理过滤
  MENTAL_FILTER: 'mental_filter',
  // 5. 否定正面
  DISCOUNTING_POSITIVE: 'discounting_positive',
  // 6. 读心术
  MIND_READING: 'mind_reading',
  // 7. 预测未来
  FORTUNE_TELLING: 'fortune_telling',
  // 8. 情绪推理
  EMOTIONAL_REASONING: 'emotional_reasoning',
  // 9. "应该"陈述
  SHOULD_STATEMENTS: 'should_statements',
  // 10. 贴标签
  LABELING: 'labeling'
};

// 认知扭曲定义
const DistortionDefinitions = {
  [CognitiveDistortions.ALL_OR_NOTHING]: {
    name: '非黑即白思维',
    description: '用极端的方式看待事物，没有中间地带',
    keywords: ['总是', '从不', '完全', '绝对', '所有', '每个', '没有', '要么...要么', '不是...就是'],
    examples: ['我总是搞砸', '从来没有人喜欢我', '这完全是浪费时间'],
    intervention: '寻找中间地带和例外情况'
  },
  
  [CognitiveDistortions.CATASTROPHIZING]: {
    name: '灾难化',
    description: '预期最坏的结果，夸大负面后果',
    keywords: ['完了', '糟糕', '灾难', '毁了一', '再也', '永远不', '最坏'],
    examples: ['这次考试失败，我的人生就完了', '他说那句话，肯定是要和我分手'],
    intervention: '评估实际可能性和应对能力'
  },
  
  [CognitiveDistortions.OVERGENERALIZATION]: {
    name: '过度概括',
    description: '从单一事件得出普遍结论',
    keywords: ['总是', '每次', '所有', '到处', '人人', '没人', '整个'],
    examples: ['这次面试失败，我永远找不到工作了', '他拒绝了我，没人会喜欢我'],
    intervention: '区分单一事件和普遍模式'
  },
  
  [CognitiveDistortions.MENTAL_FILTER]: {
    name: '心理过滤',
    description: '只关注负面细节，忽略整体',
    keywords: ['但是', '可惜', '就是', '唯一', '问题'],
    examples: ['演讲很成功，但是有个地方卡了一下', '项目完成了，可惜有个小错误'],
    intervention: '平衡关注正面和负面信息'
  },
  
  [CognitiveDistortions.DISCOUNTING_POSITIVE]: {
    name: '否定正面',
    description: '忽视或贬低积极经历',
    keywords: ['只是', '不过', '运气', '偶然', '不算', '没什么'],
    examples: ['那只是运气好', '这不算什么，谁都能做到'],
    intervention: '承认和接受积极体验'
  },
  
  [CognitiveDistortions.MIND_READING]: {
    name: '读心术',
    description: '武断地认为知道别人的想法',
    keywords: ['肯定', '一定', '觉得我', '认为我', '心里想', '意思'],
    examples: ['他肯定觉得我很蠢', '她一定是讨厌我'],
    intervention: '寻求证据，考虑其他可能性'
  },
  
  [CognitiveDistortions.FORTUNE_TELLING]: {
    name: '预测未来',
    description: '预测事情会变糟，并认为是既定事实',
    keywords: ['会', '将会', '肯定', '一定', '注定', '不可能'],
    examples: ['我肯定会失败', '去了也没用', '他不会同意的'],
    intervention: '区分预测和事实，保持开放'
  },
  
  [CognitiveDistortions.EMOTIONAL_REASONING]: {
    name: '情绪推理',
    description: '认为感受就是事实',
    keywords: ['感觉', '觉得', '直觉', '内心', '情绪'],
    examples: ['我感觉自己很失败，所以我一定是个失败者', '我觉得害怕，所以这一定很危险'],
    intervention: '区分感受和事实'
  },
  
  [CognitiveDistortions.SHOULD_STATEMENTS]: {
    name: '"应该"陈述',
    description: '用严格规则要求自己或他人',
    keywords: ['应该', '必须', '一定', '得', '不得不', '理应'],
    examples: ['我应该更努力', '他必须理解我', '我不该犯这种错误'],
    intervention: '用更灵活的期望替代绝对规则'
  },
  
  [CognitiveDistortions.LABELING]: {
    name: '贴标签',
    description: '用单一负面标签定义自己或他人',
    keywords: ['我是', '他是', '就是个', '失败者', 'loser', '废物', '蠢货'],
    examples: ['我是个失败者', '他就是个自私的人', '我真是个蠢货'],
    intervention: '描述行为而非定义身份'
  }
};

class CognitiveDistortionDetector {
  /**
   * 检测用户输入中的认知扭曲
   * @param {string} userInput - 用户输入
   * @returns {Array} 检测到的认知扭曲列表
   */
  detect(userInput) {
    const detected = [];
    const text = userInput.toLowerCase();

    for (const [distortionType, definition] of Object.entries(DistortionDefinitions)) {
      const result = this._checkDistortion(text, distortionType, definition);
      if (result) {
        detected.push(result);
      }
    }

    // 按置信度排序
    detected.sort((a, b) => b.confidence - a.confidence);

    return detected;
  }

  /**
   * 检查特定类型的认知扭曲
   */
  _checkDistortion(text, type, definition) {
    let matchCount = 0;
    let matchedKeywords = [];

    // 检查关键词
    for (const keyword of definition.keywords) {
      if (text.includes(keyword)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }

    // 检查示例模式
    for (const example of definition.examples) {
      if (text.includes(example)) {
        matchCount += 2; // 示例匹配权重更高
        matchedKeywords.push(`示例："${example}"`);
      }
    }

    // 计算置信度
    const confidence = this._calculateConfidence(matchCount, type, text);

    if (confidence >= 0.5) {
      return {
        type: type,
        name: definition.name,
        description: definition.description,
        confidence: confidence,
        matchedKeywords: matchedKeywords,
        intervention: definition.intervention,
        examples: definition.examples
      };
    }

    return null;
  }

  /**
   * 计算置信度
   */
  _calculateConfidence(matchCount, type, text) {
    // 基础置信度
    let confidence = 0;

    if (matchCount === 0) return 0;
    if (matchCount === 1) confidence = 0.5;
    if (matchCount === 2) confidence = 0.7;
    if (matchCount >= 3) confidence = 0.85;

    // 某些扭曲类型需要更高的证据
    if (type === CognitiveDistortions.LABELING && matchCount === 1) {
      // 贴标签需要更强的证据
      confidence = 0.4;
    }

    // 句子长度调整（短句子可能误判）
    if (text.length < 10 && confidence > 0.6) {
      confidence = 0.6;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * 生成针对认知扭曲的干预回应
   * @param {Array} distortions - 检测到的认知扭曲
   * @returns {Array} 干预回应列表
   */
  generateInterventions(distortions) {
    const interventions = [];

    for (const distortion of distortions) {
      const intervention = this._createIntervention(distortion);
      if (intervention) {
        interventions.push(intervention);
      }
    }

    return interventions;
  }

  /**
   * 创建单个干预回应
   */
  _createIntervention(distortion) {
    const templates = {
      all_or_nothing: [
        '我注意到你可能在用比较绝对的方式看待这件事。现实生活中，事情往往不是非黑即白的，有没有可能存在一些中间地带？',
        '用"总是"或"从不"这样的词时，我们可以问问自己：真的每一次都是这样吗？有没有例外的时候？'
      ],
      
      catastrophizing: [
        '听起来你在预期最坏的结果。让我们一起来看看：这种情况发生的实际可能性有多大？即使发生了，你有能力应对吗？',
        '我理解你的担心，同时我们也可以问问自己：这个担忧是基于事实，还是基于恐惧？'
      ],
      
      overgeneralization: [
        '从一次经历得出普遍结论是很自然的，但这次的情况真的能代表所有情况吗？',
        '这次的经历确实不容易，但它能定义你所有的经历吗？有没有过不同的时候？'
      ],
      
      mental_filter: [
        '我注意到你关注到了那个不完美的地方。同时，整体来看，有没有也发生一些好的方面？',
        '当我们只关注负面细节时，很容易忽略整体画面。能说说这次经历中好的部分吗？'
      ],
      
      discounting_positive: [
        '你提到那是"只是运气"。即使有运气成分，你的努力和贡献在哪里？',
        '接受积极体验有时候比面对负面更难。可以试着承认：这确实是一个好的结果吗？'
      ],
      
      mind_reading: [
        '你似乎很确定别人的想法。有什么具体的证据支持这个判断吗？有没有其他可能的解释？',
        '我们常常以为自己知道别人在想什么，但实际上我们并不能读心。有没有其他方式来看待这个情况？'
      ],
      
      fortune_telling: [
        '你预测事情会变糟，但这个预测是基于事实还是基于担心？在结果出来之前，我们能否保持一些开放？',
        '预测未来是很困难的。即使过去有过不好的经历，这一定意味着未来也会如此吗？'
      ],
      
      emotional_reasoning: [
        '感受是真实的，但感受不一定等于事实。有没有可能感觉糟糕，但实际情况并没有那么糟？',
        '情绪像天气，会变化。此刻的感受很重要，但它能完全定义现实吗？'
      ],
      
      should_statements: [
        '你用了"应该"这个词。这个标准是谁设定的？它对你来说合理吗？有没有可能更灵活一些？',
        '"应该"常常带来压力。如果把这个"应该"换成"我希望"或"我选择"，感觉会有什么不同？'
      ],
      
      labeling: [
        '用标签定义自己（或他人）会让我们忽略复杂性和变化的可能。能描述具体的行为或情况，而不给整体下定义吗？',
        '一个行为或一次经历不能定义一个人的全部价值。你（或他）比任何标签都要复杂和丰富。'
      ]
    };

    const typeKey = distortion.type.toLowerCase();
    const options = templates[typeKey] || [];
    
    if (options.length > 0) {
      // 随机选择一个模板
      const template = options[Math.floor(Math.random() * options.length)];
      
      return {
        distortionType: distortion.type,
        distortionName: distortion.name,
        intervention: template,
        confidence: distortion.confidence,
        technique: distortion.intervention
      };
    }

    return null;
  }

  /**
   * 获取所有认知扭曲类型的说明
   */
  getAllDefinitions() {
    return Object.entries(DistortionDefinitions).map(([type, def]) => ({
      type: type,
      name: def.name,
      description: def.description,
      examples: def.examples,
      intervention: def.intervention
    }));
  }
}

module.exports = {
  CognitiveDistortions,
  DistortionDefinitions,
  CognitiveDistortionDetector
};
