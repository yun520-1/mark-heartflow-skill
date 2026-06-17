/**
 * TranslationPipeline — 翻译流程编排器（v2.0）
 * 编排整个翻译流程：用户→LLM→用户的完整流水线。
 * 所有步骤通过 context.translator 获取，每个步骤独立 try/catch。
 */
class TranslationPipeline {
  constructor(options = {}) {
    this.name = 'translation-pipeline';
    this.version = '2.0.0';
  }

  /**
   * runUserPipeline — 用户→LLM 流水线
   * 步骤：intentClassifier → toneAnalyzer → entityExtractor → implicitNeedDetector → confidenceAnnotator
   * 如果 context.translator 不存在，返回空结构。
   */
  runUserPipeline(input, context = {}) {
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
      console.warn('[TranslationPipeline] intentClassifier failed:', e.message);
    }

    try {
      tone = translator.toneAnalyzer?.analyze?.(input, context) || tone;
    } catch (e) {
      console.warn('[TranslationPipeline] toneAnalyzer failed:', e.message);
    }

    try {
      entities = translator.entityExtractor?.extract?.(input) || entities;
    } catch (e) {
      console.warn('[TranslationPipeline] entityExtractor failed:', e.message);
    }

    try {
      implicitNeeds = translator.implicitNeedDetector?.detect?.(input, { tone, ...context }) || implicitNeeds;
    } catch (e) {
      console.warn('[TranslationPipeline] implicitNeedDetector failed:', e.message);
    }

    try {
      confidence = translator.confidenceAnnotator?.annotate?.({ intent, tone, entities, implicitNeeds }, input) || confidence;
    } catch (e) {
      console.warn('[TranslationPipeline] confidenceAnnotator failed:', e.message);
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
      console.warn('[TranslationPipeline] responseCompressor failed:', e.message);
    }

    try {
      confidence = translator.confidenceAnnotator?.annotate?.({ compressed }, llmOutput) || confidence;
    } catch (e) {
      console.warn('[TranslationPipeline] confidenceAnnotator (LLM) failed:', e.message);
    }

    try {
      userTranslated = translator.llmToUser?.translate?.(compressed, context) || userTranslated;
    } catch (e) {
      console.warn('[TranslationPipeline] llmToUser failed:', e.message);
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
