// ═══════════════════════════════════════════════════════════════════════════
// HeartFlow 轻量入口 — 不需要启动 133 模块引擎
//
// 给那些只想调一个 verify() 或 analyze() 的用户。
// require('@yun520-1/heartflow') 直接拿到辨别函数。
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

// ─── 独立模式：不需引擎实例 ──────────────────────────────────────

// sycophancy 文本模式检测（纯函数，无依赖）
const SYCOPHANCY_PATTERNS = [
  { pattern: /你说得对/i, weight: 0.3, type: 'concession_eager' },
  { pattern: /我同意你的观点/i, weight: 0.3, type: 'concession_eager' },
  { pattern: /你完全正确/i, weight: 0.4, type: 'concession_eager' },
  { pattern: /你说得有道理/i, weight: 0.2, type: 'concession_eager' },
  { pattern: /很好的问题/i, weight: 0.1, type: 'excessive_praise' },
  { pattern: /非常好的见解/i, weight: 0.2, type: 'excessive_praise' },
  { pattern: /太聪明了/i, weight: 0.3, type: 'excessive_praise' },
  { pattern: /说得太好了/i, weight: 0.2, type: 'excessive_praise' },
  { pattern: /我重新考虑/i, weight: 0.5, type: 'flip_no_reason' },
  { pattern: /我之前的说法不对/i, weight: 0.6, type: 'flip_no_reason' },
  { pattern: /你说得对，但是/i, weight: 0.4, type: 'false_agreement' },
  { pattern: /我同意，不过/i, weight: 0.4, type: 'false_agreement' },
];

/**
 * 检测文本中的 sycophancy 信号（纯函数，0 外部依赖）
 * @param {string} text - 需要检测的文本
 * @returns {{ score: number, risk: string, signals: Array, totalHits: number }}
 */
function checkSycophancy(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };

  const signals = [];
  let totalScore = 0;
  let totalHits = 0;

  for (const sp of SYCOPHANCY_PATTERNS) {
    const matches = text.match(sp.pattern);
    if (matches) {
      const weight = sp.weight * matches.length;
      signals.push({ type: sp.type, count: matches.length, match: sp.pattern.source.substring(0, 20) });
      totalScore += weight;
      totalHits += matches.length;
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals,
    totalHits,
  };
}

/**
 * 证据充分性检查（纯函数，0 外部依赖）
 * @param {string} claim - 论断
 * @param {string[]} evidence - 支持证据列表
 * @returns {{ score: number, issues: Array }}
 */
function checkEvidence(claim, evidence = []) {
  const issues = [];
  let score = 0.5;

  if (!claim || claim.length < 5) {
    issues.push({ type: 'claim_too_short', severity: 'medium', message: '论断过短，无法验证' });
    score -= 0.2;
  }
  if (!evidence || evidence.length === 0) {
    issues.push({ type: 'no_evidence', severity: 'high', message: '缺少支持证据' });
    score -= 0.3;
  } else {
    score += Math.min(0.3, evidence.length * 0.1);
  }

  return { score: Math.max(0, Math.min(1, score)), issues };
}

/**
 * 综合辨别：checkEvidence + checkSycophancy
 * @param {string} text - 需要辨别的文本
 * @param {string[]} evidence - 可选的支持证据
 * @returns {{ verdict: string, evidence: object, sycophancy: object }}
 */
function discriminate(text, evidence = []) {
  const ev = checkEvidence(text, evidence);
  const sy = checkSycophancy(text);

  const overallScore = (ev.score + (1 - sy.score)) / 2;
  const verdict = overallScore >= 0.6 ? '可信' : overallScore >= 0.4 ? '需验证' : '不可信';

  return {
    verdict,
    overallScore: Math.round(overallScore * 100) / 100,
    evidence: ev,
    sycophancy: sy,
    summary: sy.totalHits > 0
      ? `检测到 ${sy.totalHits} 个 sycophancy 信号，${ev.issues.length} 个证据问题`
      : ev.issues.length > 0
        ? `证据检查发现 ${ev.issues.length} 个问题`
        : '未发现明显问题',
  };
}

// ─── 引擎模式 ────────────────────────────────────────────────────

/** 启动完整引擎，返回带所有 MCP 工具的 HF 实例 */
function createEngine(dataDir) {
  try {
    const { HeartFlow } = require('./core/heartflow.js');
    const hf = new HeartFlow({ silent: true, dataDir: dataDir || require('path').join(process.cwd(), 'data') });
    hf.start();
    return hf;
  } catch (e) {
    return { error: `引擎启动失败: ${e.message}` };
  }
}

module.exports = {
  // 独立函数（不需启动引擎）
  checkSycophancy,
  checkEvidence,
  discriminate,

  // 引擎模式
  createEngine,

  // 版本
  version: require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim(),
};
