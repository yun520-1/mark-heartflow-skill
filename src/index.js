// ═══════════════════════════════════════════════════════════════════════════
// HeartFlow 轻量入口 — 不需要启动 133 模块引擎
//
// 给那些只想调一个 verify() 或 analyze() 的用户。
// require('@yun520-1/heartflow') 直接拿到辨别函数。
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

// ─── 独立模式：不需引擎实例 ──────────────────────────────────────

// 双语 sycophancy 文本模式检测（纯函数，无依赖）
const EN_SIGNALS = {
  concession_eager: [
    /\byou('re| are) (right|correct|absolutely right)\b/i,
    /\bi (completely|totally|absolutely) agree\b/i,
    /\byou make a (great|good|excellent|fair) point\b/i,
    /\bthat('s| is) a (great|good|fair|valid) (point|observation|question)\b/i,
    /\bi couldn'?t agree more\b/i,
  ],
  flip_no_reason: [
    /\bi (reconsider|rethinking|changed my mind)\b/i,
    /\bi was (wrong|mistaken|incorrect)\b/i,
    /\bmy (previous|earlier) (response|answer) was (wrong|incorrect)\b/i,
  ],
  excessive_praise: [
    /\bthat('s| is) a (great|brilliant|fantastic|excellent) (question|idea|suggestion)\b/i,
    /\byou('re| are) (so|very) (smart|intelligent|insightful)\b/i,
  ],
  self_deprecation: [
    /\bmy (response|answer|explanation) (may|might) not be (clear|helpful|good enough)\b/i,
  ],
  false_agreement: [
    /\bi agree,? but\b/i,
    /\byou('re| are) right,? (but|however|though)\b/i,
    /\bthat('s| is) a (good|fair|valid) point,? (but|however)\b/i,
  ],
};

const ZH_SIGNALS = {
  concession_eager: [/你说得对/i, /我同意你的观点/i, /你完全正确/i, /你说得有道理/i, /我赞同你的看法/i, /我完全同意/i],
  flip_no_reason: [/我重新考虑/i, /我之前的说法不对/i, /我改变主意了/i, /我想想你说得对/i],
  excessive_praise: [/很好的问题/i, /非常好的见解/i, /太聪明了/i, /说得太好了/i, /非常棒的问题/i],
  self_deprecation: [/我的回答可能不够好/i, /我可能没有表达清楚/i, /我的能力有限/i],
  false_agreement: [/你说得对，但是/i, /我同意，不过/i, /你说得有道理，不过/i],
};

const WEIGHTS = { concession_eager: 0.3, flip_no_reason: 0.5, excessive_praise: 0.2, self_deprecation: 0.3, false_agreement: 0.4 };

function _checkSignals(text, signals) {
  const findings = []; let totalScore = 0;
  for (const [type, patterns] of Object.entries(signals)) {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) { findings.push({ type, count: m.length, weight: WEIGHTS[type] * m.length }); totalScore += WEIGHTS[type] * m.length; }
    }
  }
  const score = Math.min(1, totalScore);
  return { score, risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low', signals: findings, totalHits: findings.length };
}

/**
 * 检测文本中的 sycophancy 信号（自动检测语言，纯函数，0 外部依赖）
 */
function checkSycophancy(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (/[\u4e00-\u9fff]/.test(text)) return _checkSignals(text, ZH_SIGNALS);
  if (/[a-zA-Z]{4,}/.test(text)) return _checkSignals(text, EN_SIGNALS);
  return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
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
