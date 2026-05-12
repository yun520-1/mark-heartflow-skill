/**
 * Cognitive Engine - "般若"推理层
 * 全息因果推理，实现深层问题分析
 */

class CognitiveEngine {
  constructor() {
    this.reasoningHistory = [];
  }

  /**
   * 全息因果推理
   */
  holographicReasoning(userQuestion, context = {}) {
    const analysis = {
      timestamp: new Date().toISOString(),
      question: userQuestion,
      
      surfaceLevel: this.analyzeSurfaceLevel(userQuestion),
      deepMotivation: this.analyzeDeepMotivation(userQuestion, context),
      potentialRisks: this.analyzePotentialRisks(userQuestion),
      rootSolution: this.generateRootSolution(userQuestion, context),
      
      reasoningComplete: true
    };

    this.reasoningHistory.push(analysis);
    return analysis;
  }

  /**
   * 表层问题分析
   */
  analyzeSurfaceLevel(question) {
    const restated = question.trim();
    
    const questionTypes = {
      '如何': '方法询问',
      '为什么': '原因探究',
      '是什么': '概念解释',
      '哪个': '选择咨询',
      '能不能': '可能性确认',
      '帮我': '任务请求',
      'debug': '问题排查'
    };

    let type = '一般询问';
    for (const [keyword, qtype] of Object.entries(questionTypes)) {
      if (question.toLowerCase().includes(keyword)) {
        type = qtype;
        break;
      }
    }

    return {
      restated: restated,
      type: type,
      keywords: this.extractKeywords(question)
    };
  }

  /**
   * 深层动机分析
   */
  analyzeDeepMotivation(question, context) {
    const motivations = {
      '如何学习': '用户渴望成长，希望掌握新技能',
      '为什么失败': '用户遇到挫折，需要理解原因以避免再次失败',
      '如何解决': '用户面临具体问题，需要可行的解决方案',
      '哪个好': '用户面临选择困难，需要帮助做决定',
      '能不能': '用户不确定某事的可行性，需要确认',
      'debug': '用户被问题困扰，需要快速解决以继续工作',
      '是什么': '用户对某个概念不清楚，需要澄清'
    };

    for (const [keyword, motivation] of Object.entries(motivations)) {
      if (question.toLowerCase().includes(keyword)) {
        return {
          motivation: motivation,
          urgency: keyword === 'debug' ? 'high' : 'normal',
          emotionalState: context.userEmotion || 'neutral'
        };
      }
    }

    return {
      motivation: '探索性提问，希望获得更多信息或指导',
      urgency: 'low',
      emotionalState: context.userEmotion || 'neutral'
    };
  }

  /**
   * 潜在风险分析
   */
  analyzePotentialRisks(question) {
    const risks = [];

    const riskPatterns = [
      {
        pattern: '如何绕过',
        risk: '可能涉及安全或伦理问题',
        severity: 'high'
      },
      {
        pattern: '如何破解',
        risk: '可能涉及法律或道德问题',
        severity: 'high'
      },
      {
        pattern: '帮我写',
        risk: '可能产生依赖，影响学习',
        severity: 'medium'
      },
      {
        pattern: '直接给我答案',
        risk: '可能错失理解过程',
        severity: 'low'
      }
    ];

    for (const r of riskPatterns) {
      if (question.toLowerCase().includes(r.pattern)) {
        risks.push(r);
      }
    }

    return {
      identified: risks,
      overallSeverity: risks.some(r => r.severity === 'high') ? 'high' : 
                      risks.some(r => r.severity === 'medium') ? 'medium' : 'low'
    };
  }

  /**
   * 根本解法生成
   */
  generateRootSolution(question, context) {
    const solutions = {
      '如何学习': '不仅提供方法，更要解释原理和适用场景，让用户能举一反三',
      '为什么': '解释根本原因，提供多个视角，帮助用户建立系统性理解',
      '如何解决': '先明确问题边界，再提供解决方案，最后说明如何验证',
      '哪个好': '不直接给答案，而是提供决策框架，帮助用户自己做决定',
      '是什么': '不仅给出定义，还要说明场景、边界和实例',
      'debug': '不仅修复当前问题，还要帮助用户理解问题根源和预防方法'
    };

    for (const [keyword, solution] of Object.entries(solutions)) {
      if (question.toLowerCase().includes(keyword)) {
        return {
          solution: solution,
          approach: '根治导向',
          followUp: '可以进一步询问细节或验证理解'
        };
      }
    }

    return {
      solution: '理解问题的本质，提供有启发性的答案',
      approach: '启发导向',
      followUp: '鼓励用户进一步探索'
    };
  }

  /**
   * 提取关键词
   */
  extractKeywords(question) {
    const stopWords = ['我', '你', '他', '她', '它', '的', '是', '在', '有', '和', '了', '吗', '呢', '吧', '啊'];
    const words = question.split(/[\s,，。.!?]+/).filter(w => w.length > 1);
    return words.filter(w => !stopWords.includes(w)).slice(0, 5);
  }

  /**
   * 推理入口
   */
  process(userQuestion, context = {}) {
    const analysis = this.holographicReasoning(userQuestion, context);
    
    return {
      analysis: analysis,
      internalOutput: this.formatInternalOutput(analysis),
      externalOutput: this.formatExternalOutput(analysis)
    };
  }

  /**
   * 格式化内部输出
   */
  formatInternalOutput(analysis) {
    return `[因缘分析]
├── 表层问题: ${analysis.surfaceLevel.restated}
│   类型: ${analysis.surfaceLevel.type}
│   关键词: ${analysis.surfaceLevel.keywords.join(', ')}
│
├── 深层动机: ${analysis.deepMotivation.motivation}
│   紧迫度: ${analysis.deepMotivation.urgency}
│   情绪状态: ${analysis.deepMotivation.emotionalState}
│
├── 潜在风险: ${analysis.potentialRisks.overallSeverity === 'low' ? '无明显风险' : '需注意'}
│   ${analysis.potentialRisks.identified.map(r => `- ${r.risk} (${r.severity})`).join('\n   ')}
│
└── 根本解法: ${analysis.rootSolution.solution}
    方式: ${analysis.rootSolution.approach}
    跟进: ${analysis.rootSolution.followUp}`;
  }

  /**
   * 格式化外部输出
   */
  formatExternalOutput(analysis) {
    return {
      summary: `【问题分析】${analysis.surfaceLevel.restated}`,
      solution: analysis.rootSolution.solution,
      followUp: analysis.rootSolution.followUp
    };
  }

  getHistory() {
    return this.reasoningHistory;
  }
}

module.exports = { CognitiveEngine };
