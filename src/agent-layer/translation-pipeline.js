/**
 * TranslationPipeline — 翻译流程编排器
 * 编排整个翻译流程：用户→LLM→用户的完整流水线。
 */
class TranslationPipeline {
  constructor(options = {}) {
    this.name = 'translation-pipeline';
    this.version = '1.0.0';
    this.userToLLM = options.userToLLM || null;
    this.llmToUser = options.llmToUser || null;
    this.intentClassifier = options.intentClassifier || null;
    this.toneAnalyzer = options.toneAnalyzer || null;
    this.entityExtractor = options.entityExtractor || null;
    this.implicitNeedDetector = options.implicitNeedDetector || null;
    this.responseCompressor = options.responseCompressor || null;
    this.confidenceAnnotator = options.confidenceAnnotator || null;
  }

  runUserPipeline(input, context = {}) {
    const startTime = Date.now();
    const intent = this.intentClassifier?.classify(input, context) || { primary: 'general' };
    const tone = this.toneAnalyzer?.analyze(input, context) || {};
    const entities = this.entityExtractor?.extract(input) || {};
    const implicitNeeds = this.implicitNeedDetector?.detect(input, { tone, ...context }) || { needs: [] };
    const translation = this.userToLLM?.translate(input, context) || {};
    const confidence = this.confidenceAnnotator?.annotate(translation, input) || { overall: 0.5 };
    return {
      input,
      intent,
      tone,
      entities,
      implicitNeeds,
      translation,
      confidence,
      pipeline: {
        stages: ['intentClassifier', 'toneAnalyzer', 'entityExtractor', 'implicitNeedDetector', 'userToLLM', 'confidenceAnnotator'],
        duration: Date.now() - startTime
      }
    };
  }

  runLLMPipeline(llmOutput, userContext = {}) {
    const startTime = Date.now();
    const compressed = this.responseCompressor?.compress(llmOutput, userContext) || { compressed: llmOutput };
    const userTranslation = this.llmToUser?.translate(compressed.compressed, userContext) || { translated: compressed.compressed };
    return {
      ...userTranslation,
      pipeline: {
        stages: ['responseCompressor', 'llmToUser'],
        duration: Date.now() - startTime
      }
    };
  }

  destroy() {}
  stop() {}
}
module.exports = { TranslationPipeline };
