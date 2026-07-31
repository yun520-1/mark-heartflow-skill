/**
 * cognitive-enrichment.js — 认知增强模块
 * HeartFlow v6.4.3: pipeline-config.js 依赖此文件
 */
class CognitiveEnrichment {
  constructor() { this.ready = true; }
  enrich(text, ctx) { return text; }
  healthCheck() { return { ok: true }; }
}
module.exports = { CognitiveEnrichment };
