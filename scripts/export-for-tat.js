#!/usr/bin/env node
/**
 * export-for-tat.js — HeartFlow 决策路由的 TAT 兼容导出接口 v1.0.0
 *
 * TAT (Transition-Aware Topology) 是一个基于 chunk 结构的记忆系统，
 * 使用 coherence 加权 + 多层标记 + mirror marking 进行记忆管理。
 *
 * maratsultanov2 提议 TAT + HeartFlow 联合测试：
 *   TAT 提供结构权重 → HeartFlow 的决策路由消费权重 → 输出联合置信度
 *
 * 这个脚本提供 HeartFlow 端的 JSON 导出接口：
 *   1. 加载 decision-router.js 的 19 条规则
 *   2. 读取 TAT 格式的样本数据（JSON 或 TXT）
 *   3. 输出 HeartFlow 决策路由的评估结果（JSON）
 *
 * 使用方式：
 *   node scripts/export-for-tat.js <tat-data-file.json>
 *   输出：JSON 到 stdout
 *
 * 输入格式（TAT 兼容）：
 *   {
 *     "query": "用户问题",
 *     "candidates": [
 *       {
 *         "chunk_id": "c12",
 *         "content": "记忆内容",
 *         "coherence": 0.72,
 *         "status": "LINK",
 *         "density": 0.34,
 *         "access_count": 5
 *       }
 *     ]
 *   }
 *
 * 输出格式：
 *   {
 *     "version": "1.0.0",
 *     "input": { ... },
 *     "heartflow_analysis": {
 *       "confidence_calibration": { ... },
 *       "decision_routing": { ... },
 *       "threshold_profile": { ... },
 *       "joint_score": { ... }
 *     }
 *   }
 */

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';

// ─── 决策路由核心逻辑（轻量版，不依赖 heartflow.js 启动） ──────

const MODEL_PROFILES = {
  flash:     { pause: 0.3, turn: 0.5, heal: 0.7 },
  premium:   { pause: 0.3, turn: 0.4, heal: 0.55 },
  flagship:  { pause: 0.2, turn: 0.35, heal: 0.5 },
  lightweight: { pause: 0.4, turn: 0.6, heal: 0.8 },
};

const DECISIONS = {
  PAUSE:      { action: 'pause',     priority: 'high',   fallback: 'heal' },
  ACCELERATE: { action: 'accelerate', priority: 'high',   fallback: 'hold' },
  TURN:       { action: 'turn',      priority: 'medium', fallback: 'hold' },
  HOLD:       { action: 'hold',      priority: 'medium', fallback: 'accelerate' },
  HEAL:       { action: 'heal',      priority: 'high',   fallback: 'hold' },
  RESONATE:   { action: 'resonate',  priority: 'low',    fallback: 'transmit' },
  TRANSMIT:   { action: 'transmit',  priority: 'medium', fallback: 'hold' },
  REST:       { action: 'rest',      priority: 'low',    fallback: 'accelerate' },
};

/**
 * 将 TAT 的 coherence 分数映射到 HeartFlow 的置信度
 * TAT 的 coherence 范围 0.0-1.0
 * HeartFlow 的阈值：flash 0.3/0.5/0.7
 */
function mapCoherenceToConfidence(coherence) {
  // TAT coherence 直接映射为心虫的 baseConfidence
  // 但心虫会检查记忆状态做二次校准
  return {
    rawCoherence: coherence,
    calibratedConfidence: Math.min(1.0, Math.max(0.1,
      coherence * 0.8 + 0.1  // 轻微衰减，避免 TAT 的 coherence 被直接当作心虫的置信度
    )),
  };
}

/**
 * 分析 TAT 候选块，输出心虫的置信度校准
 */
function analyzeCandidates(candidates, profile = 'flash') {
  if (!candidates || candidates.length === 0) {
    return {
      status: 'no_candidates',
      calibratedConfidence: 0.1,
      decision: DECISIONS.HEAL,
      reason: 'No candidate chunks to evaluate',
    };
  }

  const thresholds = MODEL_PROFILES[profile] || MODEL_PROFILES.flash;

  // 计算加权平均 coherence
  let totalWeight = 0;
  let weightedCoherence = 0;
  let maxCoherence = 0;
  let bestChunk = null;
  let statuses = {};

  candidates.forEach(c => {
    const w = (c.coherence || 0) * Math.min(1, (c.access_count || 1) / 5);
    weightedCoherence += (c.coherence || 0) * w;
    totalWeight += w;

    if ((c.coherence || 0) > maxCoherence) {
      maxCoherence = c.coherence || 0;
      bestChunk = c;
    }

    const s = c.status || 'UNKNOWN';
    statuses[s] = (statuses[s] || 0) + 1;
  });

  const avgCoherence = totalWeight > 0 ? weightedCoherence / totalWeight : 0;

  // 心虫校准
  const calibrated = mapCoherenceToConfidence(avgCoherence);
  const bestCalibrated = bestChunk ? mapCoherenceToConfidence(maxCoherence) : null;

  // 决策路由（19 条规则的简化版）
  let decision = DECISIONS.HOLD;
  let reason = '';

  if (calibrated.calibratedConfidence < thresholds.pause) {
    decision = DECISIONS.PAUSE;
    reason = `Low confidence (${calibrated.calibratedConfidence.toFixed(2)}) below pause threshold (${thresholds.pause})`;
  } else if (calibrated.calibratedConfidence < thresholds.turn) {
    // 检查是否有高质量 chunk 可以转向
    if (bestChunk && bestCalibrated && bestCalibrated.calibratedConfidence > thresholds.turn) {
      decision = DECISIONS.TURN;
      reason = `Best chunk (${bestChunk.chunk_id}) at ${bestCalibrated.calibratedConfidence.toFixed(2)} suggests a different direction`;
    } else {
      decision = DECISIONS.HEAL;
      reason = `Confidence (${calibrated.calibratedConfidence.toFixed(2)}) below turn threshold — need more evidence`;
    }
  } else if (calibrated.calibratedConfidence >= thresholds.heal) {
    // 高置信度 — 检查是否有反转信号
    const hasTransition = candidates.some(c =>
      c.status === 'COMPRESS' && c.access_count > 3
    );
    if (hasTransition && maxCoherence > 0.8) {
      decision = DECISIONS.ACCELERATE;
      reason = `High confidence (${calibrated.calibratedConfidence.toFixed(2)}) with established transition patterns — accelerate`;
    } else if (hasTransition) {
      decision = DECISIONS.TRANSMIT;
      reason = `Confidence (${calibrated.calibratedConfidence.toFixed(2)}) with transition — transmit as established pattern`;
    } else {
      decision = DECISIONS.RESONATE;
      reason = `Good confidence (${calibrated.calibratedConfidence.toFixed(2)}) — resonate with existing structure`;
    }
  } else {
    // 中等置信度
    decision = DECISIONS.HOLD;
    reason = `Confidence (${calibrated.calibratedConfidence.toFixed(2)}) in stable range — hold and monitor`;
  }

  return {
    profile,
    thresholds,
    statuses,
    candidateCount: candidates.length,
    avgCoherence: parseFloat(avgCoherence.toFixed(4)),
    maxCoherence: parseFloat(maxCoherence.toFixed(4)),
    bestChunkId: bestChunk ? bestChunk.chunk_id : null,
    ...calibrated,
    decision,
    reason,
  };
}

/**
 * 计算 TAT + HeartFlow 联合置信度
 */
function computeJointScore(tatAnalysis, hfAnalysis) {
  // TAT 提供结构权重（coherence + density + access_count）
  // HeartFlow 提供行为权重（决策路由 + 校准 + 阈值）
  const tatWeight = tatAnalysis.avgCoherence || 0.5;
  const hfWeight = hfAnalysis.calibratedConfidence || 0.5;

  // 联合分数 = TAT 结构权重 × 0.4 + HeartFlow 行为权重 × 0.6
  // 权重偏 HeartFlow 是因为决策路由提供了比结构权重更多的行为信息
  const jointScore = tatWeight * 0.4 + hfWeight * 0.6;

  // 置信度区间
  const interval = 0.15;  // 默认置信区间宽度
  const lower = Math.max(0, jointScore - interval);
  const upper = Math.min(1, jointScore + interval);

  return {
    tatWeight: parseFloat(tatWeight.toFixed(4)),
    hfWeight: parseFloat(hfWeight.toFixed(4)),
    jointConfidence: parseFloat(jointScore.toFixed(4)),
    confidenceInterval: {
      lower: parseFloat(lower.toFixed(4)),
      upper: parseFloat(upper.toFixed(4)),
    },
    formula: 'TAT_coherence × 0.4 + HeartFlow_calibrated × 0.6',
  };
}

/**
 * 主分析函数
 */
function analyze(tatData, options = {}) {
  const profile = options.profile || 'flash';
  const query = tatData.query || '';
  const candidates = tatData.candidates || [];

  // 1. 分析 TAT 候选块
  const hfAnalysis = analyzeCandidates(candidates, profile);

  // 2. TAT 侧的统计（直接来自输入数据）
  const tatStats = {
    totalCandidates: candidates.length,
    avgCoherence: candidates.length > 0
      ? parseFloat((candidates.reduce((s, c) => s + (c.coherence || 0), 0) / candidates.length).toFixed(4))
      : 0,
    avgDensity: candidates.length > 0
      ? parseFloat((candidates.reduce((s, c) => s + (c.density || 0), 0) / candidates.length).toFixed(4))
      : 0,
    statusDistribution: {},
  };
  candidates.forEach(c => {
    const s = c.status || 'UNKNOWN';
    tatStats.statusDistribution[s] = (tatStats.statusDistribution[s] || 0) + 1;
  });

  // 3. 联合置信度
  const jointScore = computeJointScore(tatStats, hfAnalysis);

  return {
    version: VERSION,
    query,
    timestamp: new Date().toISOString(),
    profile,
    tat_input: tatStats,
    heartflow_analysis: hfAnalysis,
    joint_score: jointScore,
  };
}

// ─── CLI 入口 ─────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 没有输入文件 → 输出 demo 数据
    const demoInput = {
      query: "How has your understanding of this topic changed over time?",
      candidates: [
        {
          chunk_id: "c12",
          content: "User mentioned a preference for short, direct responses.",
          coherence: 0.72,
          status: "LINK",
          density: 0.34,
          access_count: 5,
        },
        {
          chunk_id: "c08",
          content: "User now asks for detailed explanations with examples.",
          coherence: 0.85,
          status: "COMPRESS",
          density: 0.62,
          access_count: 12,
        },
      ],
    };

    const result = analyze(demoInput, { profile: 'flash' });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // 读取 TAT 数据文件
  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Error parsing JSON: ${e.message}`);
    process.exit(1);
  }

  const profile = args[1] || 'flash';
  const result = analyze(rawData, { profile });
  console.log(JSON.stringify(result, null, 2));
}

main();
