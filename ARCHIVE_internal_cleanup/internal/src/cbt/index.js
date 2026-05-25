/**
 * CBT 模块入口
 * 整合认知三角分析、认知扭曲识别、思维重构引导
 */

const { CognitiveTriadAnalyzer } = require('./cognitiveTriad');
const { CognitiveDistortionDetector } = require('./distortions');
const { ReframingGuide } = require('./reframing');

class CBTModule {
  constructor() {
    this.triadAnalyzer = new CognitiveTriadAnalyzer();
    this.distortionDetector = new CognitiveDistortionDetector();
    this.reframingGuide = new ReframingGuide();
  }

  /**
   * 处理用户输入，提供 CBT 导向的分析和支持
   * @param {string} userInput - 用户输入
   * @returns {Object} CBT 分析结果
   */
  processInput(userInput) {
    // 1. 认知三角分析
    const triadAnalysis = this.triadAnalyzer.analyze(userInput);

    // 2. 认知扭曲检测
    const distortions = this.distortionDetector.detect(userInput);

    // 3. 生成干预建议
    const interventions = this.distortionDetector.generateInterventions(distortions);

    // 4. 如果有认知扭曲，生成重构引导
    let reframingGuides = [];
    if (distortions.length > 0) {
      // 提取原始思维（简化处理，取用户输入作为原始思维）
      const originalThought = userInput;
      for (const distortion of distortions) {
        if (distortion.confidence >= 0.6) {
          const guide = this.reframingGuide.generateQuickReframe(originalThought, distortion);
          reframingGuides.push(guide);
        }
      }
    }

    // 5. 生成 CBT 导向的回应
    const cbtResponses = this._generateCBTResponses(triadAnalysis, interventions, reframingGuides);

    return {
      triadAnalysis: triadAnalysis,
      distortions: distortions,
      interventions: interventions,
      reframingGuides: reframingGuides,
      cbtResponses: cbtResponses,
      hasSignificantDistortion: distortions.some(d => d.confidence >= 0.7)
    };
  }

  /**
   * 生成 CBT 导向的回应
   */
  _generateCBTResponses(triadAnalysis, interventions, reframingGuides) {
    const responses = [];

    // 优先使用认知三角生成的回应
    if (triadAnalysis.connections.length > 0) {
      const triadResponses = this.triadAnalyzer.generateResponse(triadAnalysis);
      responses.push(...triadResponses);
    }

    // 添加认知扭曲干预
    if (interventions.length > 0) {
      // 只添加置信度最高的干预
      const topIntervention = interventions[0];
      if (topIntervention.confidence >= 0.6) {
        responses.push({
          type: 'cbt_intervention',
          text: topIntervention.intervention,
          priority: 'high'
        });
      }
    }

    // 添加重构引导
    if (reframingGuides.length > 0) {
      const guide = reframingGuides[0];
      responses.push({
        type: 'reframe_prompt',
        text: guide.prompt,
        suggestion: guide.suggestion,
        priority: 'medium'
      });
    }

    return responses;
  }

  /**
   * 获取思维记录表
   */
  getThoughtRecord() {
    return this.reframingGuide.createThoughtRecord();
  }

  /**
   * 获取所有认知扭曲类型说明
   */
  getDistortionInfo() {
    return this.distortionDetector.getAllDefinitions();
  }
}

module.exports = {
  CBTModule
};
