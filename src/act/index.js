/**
 * ACT 接受与承诺疗法模块 (Acceptance and Commitment Therapy)
 * 
 * 基于 Steven Hayes 的 ACT 理论
 * 参考来源:
 * - Hayes, S. C., Strosahl, K. D., & Wilson, K. G. (1999). Acceptance and Commitment Therapy
 * - Hayes, S. C. (2019). A Liberated Mind: How to Pivot Toward What Matters
 * 
 * 核心理念:
 * > 痛苦是生活的一部分，但挣扎是可选的
 * > 心理灵活性 = 接纳 + 正念 + 价值观行动
 * > 目标不是消除痛苦，而是带着痛苦过有意义的生活
 */

const hexaflex = require('./hexaflex');

module.exports = {
  /**
   * 检测用户的心理僵化模式
   * @param {string} userInput - 用户输入
   * @returns {object} 检测结果
   */
  detectInflexibility(userInput) {
    const patterns = [];

    // 检测经验性回避
    const avoidanceIndicators = [
      /不想.*感受/i, /逃避/i, /压抑/i, /忘记.*过去/i,
      /不要.*想/i, /摆脱.*情绪/i, /控制.*感受/i,
      /喝酒.*忘记/i, /抽烟.*缓解/i, /麻木/i
    ];
    if (avoidanceIndicators.some(p => p.test(userInput))) {
      patterns.push({
        type: 'avoidance',
        name: '经验性回避',
        description: '试图控制或消除不适的内在体验',
        suggestion: '接纳练习：允许感受存在，而非与之战斗'
      });
    }

    // 检测认知融合
    const fusionIndicators = [
      /我就是.*失败/i, /我永远.*不会/i, /肯定.*糟糕/i,
      /一定.*完了/i, /我不够好/i, /都是我的错/i,
      /事实就是/i, /肯定是/i, /绝对/i
    ];
    if (fusionIndicators.some(p => p.test(userInput))) {
      patterns.push({
        type: 'fusion',
        name: '认知融合',
        description: '把想法当作事实，被想法控制',
        suggestion: '解离练习：看到想法只是想法，不是事实'
      });
    }

    // 检测陷入过去/未来
    const timeTrapIndicators = [
      /当初.*就好了/i, /后悔/i, /如果.*当时/i,
      /担心.*未来/i, /害怕.*发生/i, /万一.*怎么办/i,
      /总是.*过去/i, /永远.*未来/i
    ];
    if (timeTrapIndicators.some(p => p.test(userInput))) {
      patterns.push({
        type: 'pastFuture',
        name: '陷入过去/未来',
        description: '注意力不在当下',
        suggestion: '当下觉察：回到此时此地'
      });
    }

    // 检测价值观不清
    const valuesUnclearIndicators = [
      /不知道.*想要/i, /没意义/i, /空虚/i,
      /迷茫/i, /为什么.*活着/i, /随便/i,
      /无所谓/i, /没动力/i
    ];
    if (valuesUnclearIndicators.some(p => p.test(userInput))) {
      patterns.push({
        type: 'unclearValues',
        name: '价值观不清',
        description: '不清楚什么真正重要',
        suggestion: '价值观澄清：探索你真正想要的生活'
      });
    }

    // 检测无效行动
    const inactionIndicators = [
      /拖延/i, /不想.*动/i, /放弃/i,
      /做不到/i, /太难了/i, /以后再说/i,
      /算了/i, /没用/i
    ];
    if (inactionIndicators.some(p => p.test(userInput))) {
      patterns.push({
        type: 'inaction',
        name: '无效行动',
        description: '行动与价值观不一致或瘫痪',
        suggestion: '承诺行动：小步骤向价值观方向前进'
      });
    }

    return {
      patterns,
      count: patterns.length,
      severity: patterns.length >= 3 ? 'high' : patterns.length >= 1 ? 'moderate' : 'low'
    };
  },

  /**
   * 生成 ACT 干预建议
   */
  generateIntervention(detectedPatterns) {
    if (detectedPatterns.length === 0) {
      return {
        type: 'general',
        content: '你似乎有较好的心理灵活性。继续保持觉察和价值观导向的生活！'
      };
    }

    const interventions = detectedPatterns.map(pattern => {
      const process = this._getCorrespondingProcess(pattern.type);
      return {
        pattern: pattern.name,
        process: process.name,
        technique: process.techniques[0],
        prompt: process.prompts[0]
      };
    });

    return {
      type: 'act_intervention',
      patterns: detectedPatterns,
      interventions,
      coreMessage: this._generateCoreMessage(detectedPatterns)
    };
  },

  /**
   * 获取对应的心理灵活性过程
   */
  _getCorrespondingProcess(patternType) {
    const mapping = {
      avoidance: hexaflex.coreProcesses.acceptance,
      fusion: hexaflex.coreProcesses.defusion,
      pastFuture: hexaflex.coreProcesses.presentMoment,
      unclearValues: hexaflex.coreProcesses.values,
      inaction: hexaflex.coreProcesses.committedAction
    };
    return mapping[patternType] || hexaflex.coreProcesses.acceptance;
  },

  /**
   * 生成核心信息
   */
  _generateCoreMessage(patterns) {
    const types = patterns.map(p => p.type);
    
    if (types.includes('avoidance') && types.includes('fusion')) {
      return '你正在与内在体验战斗，同时相信了批判性的想法。ACT 邀请你：接纳感受，解离想法，然后选择有价值的行动。';
    }
    
    if (types.includes('unclearValues') && types.includes('inaction')) {
      return '你可能不清楚什么真正重要，导致行动困难。让我们先探索你的价值观，然后从小步骤开始。';
    }
    
    if (types.includes('pastFuture')) {
      return '你的注意力被过去或未来占据。回到当下，这里是唯一你能生活的地方。';
    }
    
    return '痛苦是生活的一部分，但挣扎是可选的。ACT 邀请你带着不适，走向你真正想要的生活。';
  },

  /**
   * 提供具体的 ACT 练习
   */
  provideExercise(processName) {
    const process = hexaflex.coreProcesses[processName.toLowerCase()];
    if (!process) return null;

    return {
      process: process.name,
      description: process.description,
      techniques: process.techniques,
      homePractice: this._generateHomePractice(processName)
    };
  },

  /**
   * 生成家庭练习建议
   */
  _generateHomePractice(processName) {
    const practices = {
      acceptance: '每天花 5 分钟，注意一个不适的感受，允许它存在，不推开它。记录你的体验。',
      defusion: '当批判性想法出现时，说"谢谢，心智"，然后继续做你正在做的事。',
      presentMoment: '每天选择一个日常活动（如刷牙、吃饭），完全投入地做，注意所有感官体验。',
      selfAsContext: '当被情绪淹没时，想象自己是天空，情绪是飘过的云。',
      values: '写下 5 个最重要的价值观，每天问自己："今天我如何活出这个价值观？"',
      committedAction: '选择一个价值观，设定一个本周可以完成的微小行动，然后执行。'
    };
    return practices[processName.toLowerCase()] || '';
  },

  /**
   * 生成回应模板
   */
  generateResponse(userInput) {
    const detection = this.detectInflexibility(userInput);
    const intervention = this.generateIntervention(detection.patterns);

    return {
      type: 'act_response',
      detection,
      intervention,
      content: this._formatResponse(intervention)
    };
  },

  /**
   * 格式化回应
   */
  _formatResponse(intervention) {
    if (intervention.type === 'general') {
      return intervention.content;
    }

    let response = '🧠 [ACT 心理灵活性分析]\n\n';
    
    response += '检测到的模式:\n';
    intervention.patterns.forEach((p, i) => {
      response += `${i + 1}. ${p.name}: ${p.description}\n`;
    });
    
    response += '\n💡 ACT 邀请:\n';
    response += intervention.coreMessage + '\n\n';
    
    response += '🎯 建议练习:\n';
    intervention.interventions.forEach((inv, i) => {
      response += `${i + 1}. ${inv.process}: ${inv.technique.name}\n`;
      response += `   提示问题: "${inv.prompt}"\n`;
    });

    return response;
  },

  /**
   * 模块信息
   */
  info: {
    name: 'ACT 接受与承诺疗法模块',
    version: '1.0.0',
    description: '基于 Steven Hayes 的 ACT 理论，培养心理灵活性',
    commands: ['/act - 查看 ACT 介绍', '/act hexaflex - 六边形模型说明', '/act exercise [过程名] - 获取具体练习']
  }
};
