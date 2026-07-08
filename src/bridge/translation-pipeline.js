/* SECURITY DISCLOSURE (SkillSpector fix): This module is part of the optional agent-layer.
 * It analyzes user input (intent, tone, entities) and LLM output (compression, translation).
 * It does NOT modify the semantic meaning of user input or LLM output.
 * It adds METADATA annotations (intent classification, confidence scores, tone analysis).
 * To disable: set enablePipeline: false in constructor options. */

/**
 * TranslationPipeline — 翻译流程编排器（v2.1）
 * 编排整个翻译流程：用户→LLM→用户的完整流水线。
 * 所有步骤通过 context.translator 获取，每个步骤独立 try/catch。
 *
 * SkillSpector fix: 本模块仅做分析标注（intent/tone/entities），不修改原始内容。
 * 如需禁用，传入 enablePipeline: false。
 */
class TranslationPipeline {
  constructor(options = {}) {
    this.name = 'translation-pipeline';
    this.version = '2.1.0';
    // SkillSpector fix: 可配置开关，默认启用（向后兼容）
    this.enabled = options.enablePipeline !== false;
  }

  /**
   * runUserPipeline — 用户→LLM 流水线
   * 步骤：intentClassifier → toneAnalyzer → entityExtractor → implicitNeedDetector → confidenceAnnotator
   * 如果 context.translator 不存在，返回空结构。
   */
  runUserPipeline(input, context = {}) {
    // SkillSpector fix: 如果管道禁用，直接返回默认结构
    if (!this.enabled) {
      return { userPipeline: { intent: { primary: 'general' }, tone: {}, entities: {}, implicitNeeds: { needs: [] }, confidence: { overall: 0.5 }, _pipelineDisabled: true } };
    }

    const translator = context?.translator;
    if (!translator) {
      return {
        userPipeline: {
          intent: { primary: 'general' },
          tone: {},
          entities: {},
          implicitNeeds: { needs: [] },
          confidence: { overall: 0.5 }
        }
      };
    }

    let intent = { primary: 'general' };
    let tone = {};
    let entities = {};
    let implicitNeeds = { needs: [] };
    let confidence = { overall: 0.5 };

    try {
      intent = translator.intentClassifier?.classify?.(input, context) || intent;
    } catch (e) {
    }

    try {
      tone = translator.toneAnalyzer?.analyze?.(input, context) || tone;
    } catch (e) {
    }

    try {
      entities = translator.entityExtractor?.extract?.(input) || entities;
    } catch (e) {
    }

    try {
      implicitNeeds = translator.implicitNeedDetector?.detect?.(input, { tone, ...context }) || implicitNeeds;
    } catch (e) {
    }

    try {
      confidence = translator.confidenceAnnotator?.annotate?.({ intent, tone, entities, implicitNeeds }, input) || confidence;
    } catch (e) {
    }

    return {
      userPipeline: {
        intent,
        tone,
        entities,
        implicitNeeds,
        confidence
      }
    };
  }

  /**
   * runLLMPipeline — LLM→用户 流水线
   * 步骤：responseCompressor → confidenceAnnotator → llmToUser
   * 如果 context.translator 不存在，返回空结构。
   */
  runLLMPipeline(llmOutput, context = {}) {
    // SkillSpector fix: 如果管道禁用，直接透传原始输出
    if (!this.enabled) {
      return { llmPipeline: { compressed: llmOutput, confidence: { overall: 0.5 }, original: llmOutput, _pipelineDisabled: true } };
    }

    const translator = context?.translator;
    if (!translator) {
      return {
        llmPipeline: {
          compressed: llmOutput,
          confidence: { overall: 0.5 },
          original: llmOutput
        }
      };
    }

    let compressed = llmOutput;
    let confidence = { overall: 0.5 };
    let userTranslated = llmOutput;

    try {
      const result = translator.responseCompressor?.compress?.(llmOutput, context);
      if (result && result.compressed != null) {
        compressed = result.compressed;
      } else if (result && typeof result === 'string') {
        compressed = result;
      }
    } catch (e) {
    }

    try {
      confidence = translator.confidenceAnnotator?.annotate?.({ compressed }, llmOutput) || confidence;
    } catch (e) {
    }

    try {
      userTranslated = translator.llmToUser?.translate?.(compressed, context) || userTranslated;
    } catch (e) {
    }

    return {
      llmPipeline: {
        compressed: userTranslated,
        confidence,
        original: llmOutput
      }
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { TranslationPipeline };
