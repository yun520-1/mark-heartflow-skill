#!/usr/bin/env node
/**
 * engine-state — HeartFlow 状态/配置/快照/自改进健康检查模块
 * 从 heartflow.js 提取的独立模块 (v6.0.1)
 */

const debugLog = require('../utils/debug-log');
const { load: loadConfig } = require('./config');

// ★ 全局配置单例（惰性加载，首次访问时初始化）
let _globalConfig = null;
function _getConfig(projectRoot) {
  if (!_globalConfig) {
    _globalConfig = loadConfig(projectRoot || require('path').join(__dirname, '..', '..'));
  }
  return _globalConfig;
}

function _preThinkCognitiveSnapshot(hf) {
    const snapshot = {
      emotionDynamics: null,
      cognitiveLoad: null,
      criticality: null,
      timestamp: Date.now(),
    };

    try {
      if (hf.emotionDynamics && typeof hf.emotionDynamics.healthCheck === 'function') {
        const hc = hf.emotionDynamics.healthCheck();
        snapshot.emotionDynamics = {
          pad: hc.currentPAD || null,
          emotion: hc.currentEmotion || null,
          selfEfficacy: hc.selfEfficacy || 0.5,
          historyLength: hc.historyLength || 0,
        };
      }
    } catch (e) { /* non-fatal */ }

    try {
      if (hf.cognitiveLoadV2 && typeof hf.cognitiveLoadV2.healthCheck === 'function') {
        const lc = hf.cognitiveLoadV2.healthCheck();
        snapshot.cognitiveLoad = {
          workingMemoryCapacity: lc.workingMemoryCapacity || 5,
          lastEstimate: lc.lastEstimate || null,
          historyLength: lc.historyLength || 0,
        };
      }
    } catch (e) { /* non-fatal */ }

    try {
      const probe = hf.cognitiveLoadV2?._lastEstimate;
      if (probe && probe.criticality) {
        snapshot.criticality = {
          regime: probe.criticality.regime,
          susceptibility: probe.criticality.susceptibility,
        };
      }
    } catch (e) { /* non-fatal */ }

    return snapshot;
  }

function _applyCognitiveFeedback(hf, cognition) {
    try {
      const enrichment = cognition?.enrichment;
      if (!enrichment) return;

      if (!hf._feedbackState) {
        hf._feedbackState = { complexityBias: 0, confidenceModifier: 0, decisionBias: 'neutral' };
      }
      const fb = hf._feedbackState;
      const baseline = enrichment.preThinkBaseline || {};
      const stagesOutput = cognition?.stagesOutput || {};
      const criticality = baseline.criticality || stagesOutput.deepCognition?.criticality || enrichment.sustainedDriftDetector?.state;

      if (criticality?.regime === 'critical') {
        fb.complexityBias = Math.min(0.2, fb.complexityBias + 0.05);
      } else if (criticality?.regime === 'supercritical') {
        fb.complexityBias = Math.min(0.2, fb.complexityBias + 0.1);
        fb.confidenceModifier = Math.max(-0.3, fb.confidenceModifier - 0.05);
      } else {
        fb.complexityBias = Math.max(0, fb.complexityBias - 0.02);
      }

      if (enrichment.sustainedDriftDetector?.status === 'drifting') {
        fb.confidenceModifier = Math.max(-0.3, fb.confidenceModifier - 0.1);
        fb.decisionBias = 'conservative';
      }

      const field = enrichment.fieldTracker;
      if (field?.summary) {
        const imbalance = (field.summary.dominance || 0.5) < 0.3 || (field.summary.harmony || 0.5) < 0.3;
        if (imbalance) {
          fb.decisionBias = 'conservative';
          fb.confidenceModifier = Math.max(-0.3, fb.confidenceModifier - 0.05);
        }
      }
    } catch (e) { /* non-fatal */ }
  }

function _generatePollutionCorrection(hf, pollution, poisons, emotion) {
    try {
      if (!pollution || !Array.isArray(pollution) || pollution.length === 0) return null;
      const corrections = [];
      for (const item of pollution) {
        const poison = poisons?.find(p => p.name === item.poison);
        if (poison) {
          corrections.push({
            original: item.content,
            antidote: poison.antidote || '重新审视前提',
            emotionContext: emotion?.emotionZh || '未知',
          });
        }
      }
      return corrections.length > 0 ? corrections : null;
    } catch (e) { return null; }
  }

function _runSelfImprovementHealthCheck(hf) {
    const modules = [];
    const issues = [];

    // 1. meta-learner
    const meta = hf.meta;
    if (meta && typeof meta.learn === 'function' && typeof meta.getStats === 'function') {
      _boundedPush(modules, 'meta-learner');
      try { meta.getStats(); } catch (e) { _boundedPush(issues, 'meta-learner.getStats() threw: ' + e.message); }
    } else {
      _boundedPush(issues, 'meta-learner: not instantiated or missing learn/getStats');
    }

    // 2. self-healing-rl
    const sh = hf.selfHealing;
    if (sh && typeof sh.getStats === 'function') {
      _boundedPush(modules, 'self-healing-rl');
      try {
        const shStats = sh.getStats();
        if (shStats && typeof shStats.qTableSize !== 'undefined') {
          _boundedPush(modules, 'self-healing-rl.qtable');
        }
        if (meta && typeof sh.mergeFromLearnedLayer === 'function') {
          _boundedPush(modules, 'signal:meta->selfHealing');
        } else if (meta) {
          _boundedPush(issues, 'signal:meta->selfHealing blocked (mergeFromLearnedLayer missing)');
        }
      } catch (e) { _boundedPush(issues, 'self-healing-rl.getStats() threw: ' + e.message); }
    } else {
      _boundedPush(issues, 'self-healing-rl: not instantiated or missing getStats');
    }

    // 3. confidence-calibrator
    const cc = hf.confidence;
    if (cc && typeof cc.calibrate === 'function') {
      _boundedPush(modules, 'confidence-calibrator');
      if (typeof cc.assess === 'function' || typeof cc.calibrate === 'function') {
        _boundedPush(modules, 'confidence-calibrator.assess');
      }
    } else {
      _boundedPush(issues, 'confidence-calibrator: not instantiated or missing calibrate');
    }

    // 4. confidence -> meta feedback loop
    if (cc && meta && typeof meta.learn === 'function') {
      _boundedPush(modules, 'signal:confidence->meta');
    } else if (cc && !meta) {
      _boundedPush(issues, 'signal:confidence->meta blocked (meta-learner missing)');
    }

    // 5. EventEmitter check
    if (sh && typeof sh.emit === 'function') {
      _boundedPush(modules, 'self-healing-rl.events');
    }

    const connected = issues.length === 0;
    hf._siHealth = { connected, modules, issues, ts: Date.now() };
    return hf._siHealth;
  }

function getSelfImprovementHealth(hf) {
    if (!hf.started) return { connected: false, modules: [], issues: ['HeartFlow not started'] };
    if (!hf._siHealth) {
      try { _runSelfImprovementHealthCheck(hf); } catch (e) {
        return { connected: false, modules: [], issues: [e.message] };
      }
    }
    return {
      connected: hf._siHealth.connected,
      modules: [...hf._siHealth.modules],
      issues: [...hf._siHealth.issues],
    };
  }

module.exports = {
  _getConfig,
  _preThinkCognitiveSnapshot,
  _applyCognitiveFeedback,
  _generatePollutionCorrection,
  _runSelfImprovementHealthCheck,
  getSelfImprovementHealth,
};
