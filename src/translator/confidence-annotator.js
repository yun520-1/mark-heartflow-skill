/**
 * ConfidenceAnnotator — 置信度标注器
 * 为翻译结果添加置信度标注，标注哪些部分是确定的、哪些是推测的。
 */
class ConfidenceAnnotator {
  constructor() {
    this.name = 'confidence-annotator';
    this.version = '1.0.0';
  }
  annotate(translation, source = '') {
    const annotations = [];
    // 基于翻译结构的置信度
    if (translation.intent && translation.intent.type !== 'general') {
      annotations.push({ field: 'intent', confidence: 0.8, label: '意图明确' });
    } else {
      annotations.push({ field: 'intent', confidence: 0.4, label: '意图模糊，需确认' });
    }
    if (translation.entities && translation.entities.count > 0) {
      annotations.push({ field: 'entities', confidence: 0.7, label: `提取到${translation.entities.count}个实体` });
    }
    if (translation.constraints && Object.keys(translation.constraints).length > 0) {
      annotations.push({ field: 'constraints', confidence: 0.75, label: '有明确约束条件' });
    }
    // 基于原文的不确定性
    if (source && /可能|大概|也许|或许|不一定|不确定/.test(source)) {
      annotations.push({ field: 'source_certainty', confidence: 0.5, label: '原文含不确定性表述' });
    }
    const overallConfidence = annotations.length > 0
      ? (annotations.reduce((sum, a) => sum + a.confidence, 0) / annotations.length)
      : 0.5;
    return {
      annotations,
      overall: Math.round(overallConfidence * 100) / 100,
      needsConfirmation: overallConfidence < 0.6,
      summary: annotations.map(a => a.label).join('; ')
    };
  }
  destroy() {}
  stop() {}
}
module.exports = { ConfidenceAnnotator };
