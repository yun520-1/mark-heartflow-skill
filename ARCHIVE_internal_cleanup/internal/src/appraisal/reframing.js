/**
 * 评价重构引导 (Appraisal Reframing)
 * v2.10.0 新增
 * 
 * 基于情绪评价理论的重构技术
 * 帮助用户重新评价情境，从而改变情绪体验
 */

const { reframingStrategies, detectAppraisals, inferEmotionFromAppraisals } = require('./dimensions');

class AppraisalReframer {
  constructor() {
    this.sessionHistory = [];
  }

  /**
   * 分析用户输入并提供评价重构引导
   */
  analyzeAndReframe(userInput) {
    // 1. 检测评价维度
    const appraisals = detectAppraisals(userInput);
    
    // 2. 推断情绪
    const emotionResult = inferEmotionFromAppraisals(appraisals);
    
    // 3. 生成重构建议
    const suggestions = this._generateSuggestions(appraisals, emotionResult);
    
    // 4. 构建完整回应
    const response = this._buildResponse(userInput, appraisals, emotionResult, suggestions);
    
    // 5. 记录历史
    this.sessionHistory.push({
      timestamp: new Date().toISOString(),
      input: userInput,
      appraisals,
      emotion: emotionResult,
      suggestions
    });
    
    return response;
  }

  /**
   * 生成个性化重构建议
   */
  _generateSuggestions(appraisals, emotionResult) {
    const suggestions = [];

    // 根据情绪类型提供针对性重构
    switch (emotionResult.emotion) {
      case '愤怒':
        suggestions.push({
          type: 'understanding',
          content: '愤怒告诉你：有人侵犯了你的边界或价值观。',
          prompts: [
            '你的哪个边界被侵犯了？',
            '除了愤怒，还有什么方式可以保护这个边界？',
            '对方的行为是否有其他可能的解释？'
          ]
        });
        break;

      case '内疚':
        suggestions.push({
          type: 'understanding',
          content: '内疚告诉你：你的行为与价值观不一致。',
          prompts: [
            '你的哪个价值观被违反了？',
            '你可以做些什么来修复？',
            '从这次经历中，你学到了什么？'
          ]
        });
        break;

      case '焦虑':
        suggestions.push({
          type: 'understanding',
          content: '焦虑告诉你：这件事对你很重要，但结果不确定。',
          prompts: [
            '这件事中，你能控制的部分是什么？',
            '最坏的情况发生的可能性有多大？',
            '即使最坏情况发生，你能应对吗？'
          ]
        });
        break;

      case '无助':
        suggestions.push({
          type: 'understanding',
          content: '无助感告诉你：你感到失去了控制。',
          prompts: [
            '此刻，你能控制的一个最小行动是什么？',
            '过去遇到困难时，是什么帮助了你？',
            '谁可以提供支持或帮助？'
          ]
        });
        break;

      case '羞愧':
        suggestions.push({
          type: 'understanding',
          content: '羞愧告诉你：你担心自己的价值被否定。',
          prompts: [
            '如果是朋友犯了同样的错，你会怎么对他？',
            '一个错误能否定义你的全部价值？',
            '你从这次经历中学到了什么？'
          ]
        });
        break;

      case '悲伤':
        suggestions.push({
          type: 'understanding',
          content: '悲伤告诉你：你失去了重要的东西。',
          prompts: [
            '你失去的是什么？它对你意味着什么？',
            '允许自己感受这份悲伤，它需要什么？',
            '什么可以帮助你度过这个时期？'
          ]
        });
        break;

      case '震惊':
        suggestions.push({
          type: 'understanding',
          content: '震惊告诉你：发生了完全意外的事。',
          prompts: [
            '给自己一些时间消化这个信息',
            '现在，你最需要的是什么？',
            '当你准备好时，可以探索这个意外的意义'
          ]
        });
        break;

      default:
        suggestions.push({
          type: 'general',
          content: '情绪是信息，不是指令。它告诉你一些重要的事，但你可以选择如何回应。',
          prompts: [
            '这个情绪想告诉你什么？',
            '这个评价是否还有其他可能性？',
            '如果是你尊敬的人，会如何看待这个情况？'
          ]
        });
    }

    // 根据评价维度添加具体重构策略
    if (appraisals.control && appraisals.control.category === 'low') {
      suggestions.push({
        type: 'controlDichotomy',
        content: '控制二分法：区分你能控制的和不能控制的',
        exercise: {
          uncontrollable: '列出你无法控制的因素',
          controllable: '列出你可以控制或影响的因素',
          action: '选择一个可控因素，采取一个小行动'
        }
      });
    }

    if (appraisals.agency && appraisals.agency.category === 'other') {
      suggestions.push({
        type: 'agencyShift',
        content: '从"他导致"转向"我选择如何回应"',
        prompts: [
          '你无法控制他人的行为，但可以控制自己的回应',
          '在这个情境中，你想成为什么样的人？',
          '什么回应最符合你的价值观？'
        ]
      });
    }

    return suggestions;
  }

  /**
   * 构建完整回应
   */
  _buildResponse(input, appraisals, emotionResult, suggestions) {
    const lines = [];

    // 标题
    lines.push('🔍 [情绪评价分析]');
    lines.push('');

    // 检测到的评价维度
    if (Object.keys(appraisals).length > 0) {
      lines.push('📊 检测到的评价维度:');
      for (const [dimension, data] of Object.entries(appraisals)) {
        const dimensionName = this._getDimensionName(dimension);
        const categoryName = this._getCategoryName(dimension, data.category);
        lines.push(`   • ${dimensionName}: ${categoryName} (置信度：${Math.round(data.confidence * 100)}%)`);
      }
      lines.push('');
    }

    // 推断的情绪
    lines.push(`💭 推断情绪：**${emotionResult.emotion}**`);
    lines.push(`   解释：${emotionResult.explanation}`);
    lines.push(`   强度：${this._getIntensityName(emotionResult.intensity)}`);
    lines.push('');

    // 重构建议
    if (suggestions.length > 0) {
      lines.push('💡 评价重构建议:');
      lines.push('');

      for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i];
        lines.push(`   **${i + 1}. ${this._getSuggestionType(s.type)}**`);
        lines.push(`   ${s.content}`);
        
        if (s.prompts) {
          lines.push('');
          lines.push('   问自己:');
          for (const prompt of s.prompts) {
            lines.push(`   • ${prompt}`);
          }
        }

        if (s.exercise) {
          lines.push('');
          lines.push('   练习:');
          lines.push(`   1. ${s.exercise.uncontrollable}`);
          lines.push(`   2. ${s.exercise.controllable}`);
          lines.push(`   3. ${s.exercise.action}`);
        }

        lines.push('');
      }
    }

    // 结尾智慧
    lines.push('---');
    lines.push('💬 "情绪不是问题，而是信使。听懂它的信息，你就可以选择如何回应。"');

    return lines.join('\n');
  }

  /**
   * 获取维度中文名
   */
  _getDimensionName(dimension) {
    const names = {
      novelty: '新奇性',
      valence: '效价',
      goalRelevance: '目标相关性',
      goalCongruence: '目标一致性',
      agency: '能动性',
      control: '控制性',
      norms: '规范性'
    };
    return names[dimension] || dimension;
  }

  /**
   * 获取类别中文名
   */
  _getCategoryName(dimension, category) {
    const names = {
      novelty: {
        expected: '预期内',
        unexpected: '意外'
      },
      valence: {
        positive: '正面',
        negative: '负面'
      },
      goalRelevance: {
        relevant: '相关',
        irrelevant: '无关'
      },
      goalCongruence: {
        congruent: '一致',
        incongruent: '不一致'
      },
      agency: {
        self: '自我归因',
        other: '他人归因',
        circumstance: '环境归因'
      },
      control: {
        high: '高控制感',
        low: '低控制感'
      },
      norms: {
        congruent: '符合标准',
        incongruent: '违反标准'
      }
    };
    return names[dimension]?.[category] || category;
  }

  /**
   * 获取强度中文名
   */
  _getIntensityName(intensity) {
    const names = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return names[intensity] || intensity;
  }

  /**
   * 获取建议类型中文名
   */
  _getSuggestionType(type) {
    const names = {
      understanding: '情绪理解',
      controlDichotomy: '控制二分法',
      agencyShift: '能动性转换',
      general: '一般建议'
    };
    return names[type] || type;
  }

  /**
   * 获取会话历史
   */
  getHistory(limit = 10) {
    return this.sessionHistory.slice(-limit);
  }

  /**
   * 清除历史
   */
  clearHistory() {
    this.sessionHistory = [];
  }
}

module.exports = { AppraisalReframer };
