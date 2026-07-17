/**
 * v5.16.0 Cognitive Enrichment Stage
 * 
 * 提取自 pipeline.js DEFAULT_PIPELINE 的 cognitiveEnrichment 阶段。
 * 将20个认知模块的状态快照聚合到enrichment对象中。
 * 
 * 每个模块调用包裹在 try/catch 中 — 单个模块失败不影响管线。
 */

function cognitiveEnrichmentRun(ctx, hf) {
  const enrichment = {};

  // ── 核心10模块 (v5.12.0) ──
  try { if (hf.fieldTracker) enrichment.fieldTracker = hf.fieldTracker.getFieldHealthSummary ? hf.fieldTracker.getFieldHealthSummary() : null; } catch (e) { enrichment.fieldTracker = { error: 'unavailable' }; }
  try { if (hf.cognitiveLoad) enrichment.cognitiveLoad = { load: hf.cognitiveLoad.getLoad ? hf.cognitiveLoad.getLoad() : null, state: hf.cognitiveLoad.getState ? hf.cognitiveLoad.getState() : null }; } catch (e) { enrichment.cognitiveLoad = { error: 'unavailable' }; }
  try { if (hf.metacognitiveFeedback) enrichment.metacognitiveFeedback = hf.metacognitiveFeedback.getStats ? hf.metacognitiveFeedback.getStats() : null; } catch (e) { enrichment.metacognitiveFeedback = { error: 'unavailable' }; }
  try { if (hf.sustainedDriftDetector) enrichment.sustainedDriftDetector = { status: hf.sustainedDriftDetector.getStatus ? hf.sustainedDriftDetector.getStatus() : null, state: hf.sustainedDriftDetector.getState ? hf.sustainedDriftDetector.getState() : null }; } catch (e) { enrichment.sustainedDriftDetector = { error: 'unavailable' }; }
  try { if (hf.semanticClusterer) enrichment.semanticClusterer = { groups: hf.semanticClusterer.getGroupSummaries ? hf.semanticClusterer.getGroupSummaries() : null, clusters: hf.semanticClusterer.getClusters ? hf.semanticClusterer.getClusters() : null }; } catch (e) { enrichment.semanticClusterer = { error: 'unavailable' }; }
  try { if (hf.worldModel) enrichment.worldModel = { state: hf.worldModel.getState ? hf.worldModel.getState() : null, summary: hf.worldModel.getSummary ? hf.worldModel.getSummary() : null }; } catch (e) { enrichment.worldModel = { error: 'unavailable' }; }
  try { if (hf.selfHealing) enrichment.selfHealing = { stats: hf.selfHealing.getStats ? hf.selfHealing.getStats() : null, state: hf.selfHealing.getState ? hf.selfHealing.getState() : null, rlMetrics: hf.selfHealing.getRLMetrics ? hf.selfHealing.getRLMetrics() : null }; } catch (e) { enrichment.selfHealing = { error: 'unavailable' }; }
  try { if (hf.phenomenology) enrichment.phenomenology = hf.phenomenology.analyze ? hf.phenomenology.analyze(ctx.input, {}) : null; } catch (e) { enrichment.phenomenology = { error: 'unavailable' }; }
  try { if (hf.globalWorkspace) enrichment.globalWorkspace = { agentCount: hf.globalWorkspace._agents ? hf.globalWorkspace._agents.size : 0, cycleCount: hf.globalWorkspace._cycleCount || 0 }; } catch (e) { enrichment.globalWorkspace = { error: 'unavailable' }; }
  try { if (hf.mindWanderer) enrichment.mindWanderer = { isActive: hf.mindWanderer.isActive ? hf.mindWanderer.isActive() : false, shouldWander: hf.mindWanderer.shouldEnterWandering ? hf.mindWanderer.shouldEnterWandering(ctx.input) : false }; } catch (e) { enrichment.mindWanderer = { error: 'unavailable' }; }
  
  // ── 扩展10模块 (v5.14.2) ──
  try { if (hf.confidenceCalibrator) enrichment.confidenceCalibrator = hf.confidenceCalibrator.getStats ? hf.confidenceCalibrator.getStats() : (hf.confidenceCalibrator.assess ? hf.confidenceCalibrator.assess(ctx.input) : null); } catch (e) { enrichment.confidenceCalibrator = { error: 'unavailable' }; }
  try { if (hf.desireCognition) enrichment.desireCognitionHealth = hf.desireCognition.getStatus ? hf.desireCognition.getStatus() : (hf.desireCognition.healthCheck ? hf.desireCognition.healthCheck() : null); } catch (e) { enrichment.desireCognitionHealth = { error: 'unavailable' }; }
  try { if (hf.threePoisons) enrichment.threePoisonsHealth = hf.threePoisons.getStatus ? hf.threePoisons.getStatus() : (hf.threePoisons.healthCheck ? hf.threePoisons.healthCheck() : null); } catch (e) { enrichment.threePoisonsHealth = { error: 'unavailable' }; }
  try { if (hf.logicReasoning) enrichment.logicReasoningMetrics = hf.logicReasoning.getStats ? hf.logicReasoning.getStats() : (hf.logicReasoning.healthCheck ? hf.logicReasoning.healthCheck() : null); } catch (e) { enrichment.logicReasoningMetrics = { error: 'unavailable' }; }
  try { if (hf.decisionFeedback) enrichment.decisionFeedback = hf.decisionFeedback.getStats ? hf.decisionFeedback.getStats() : null; } catch (e) { enrichment.decisionFeedback = { error: 'unavailable' }; }
  try { if (hf.decisionVerifier) enrichment.decisionVerifier = hf.decisionVerifier.getStats ? hf.decisionVerifier.getStats() : null; } catch (e) { enrichment.decisionVerifier = { error: 'unavailable' }; }
  try { if (hf.loveCognition) enrichment.loveCognition = hf.loveCognition.getStatus ? hf.loveCognition.getStatus() : null; } catch (e) { enrichment.loveCognition = { error: 'unavailable' }; }
  try { if (hf.cognitionGround) enrichment.cognitionGround = hf.cognitionGround.getStats ? hf.cognitionGround.getStats() : null; } catch (e) { enrichment.cognitionGround = { error: 'unavailable' }; }
  try { if (hf.debateConductor) enrichment.debateConductor = hf.debateConductor.getStatus ? hf.debateConductor.getStatus() : null; } catch (e) { enrichment.debateConductor = { error: 'unavailable' }; }
  try { if (hf.dreamEngineV2) enrichment.dreamEngineV2 = hf.dreamEngineV2.healthCheck ? hf.dreamEngineV2.healthCheck() : null; } catch (e) { enrichment.dreamEngineV2 = { error: 'unavailable' }; }

  // ── 离线认知模块 (v5.17.2) ──
  try { if (hf.identityCore) enrichment.identityCore = hf.identityCore.getIdentitySummary ? hf.identityCore.getIdentitySummary() : null; } catch (e) { enrichment.identityCore = { error: 'unavailable' }; }
  try { if (hf.memoryBank) enrichment.memoryBank = hf.memoryBank.getStats ? hf.memoryBank.getStats() : null; } catch (e) { enrichment.memoryBank = { error: 'unavailable' }; }
  try { if (hf.dream) enrichment.dream = hf.dream.getRecentDreamSummary ? hf.dream.getRecentDreamSummary() : null; } catch (e) { enrichment.dream = { error: 'unavailable' }; }
  try { if (hf.psychologyDialogue) enrichment.psychologyDialogue = hf.psychologyDialogue.getSessionStats ? hf.psychologyDialogue.getSessionStats() : null; } catch (e) { enrichment.psychologyDialogue = { error: 'unavailable' }; }
  try { if (hf.metaMemory) enrichment.metaMemory = hf.metaMemory.getStats ? hf.metaMemory.getStats() : null; } catch (e) { enrichment.metaMemory = { error: 'unavailable' }; }
  try { if (hf.consciousnessSelf) enrichment.consciousnessSelf = hf.consciousnessSelf.getState ? hf.consciousnessSelf.getState() : null; } catch (e) { enrichment.consciousnessSelf = { error: 'unavailable' }; }
  try { if (hf.memoryIntegrity) enrichment.memoryIntegrity = hf.memoryIntegrity.getIntegrityReport ? hf.memoryIntegrity.getIntegrityReport() : null; } catch (e) { enrichment.memoryIntegrity = { error: 'unavailable' }; }

  return enrichment;
}

module.exports = { cognitiveEnrichmentRun };