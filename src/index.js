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

// ─── 矛盾检测（同一段话中前后说相反的）─────────────────────────────
const CONTRADICTION_PAIRS = [
  // 正面→否定/反面
  { positive: /这是[^。]*?好[^。。]*?但[是]?[^。]*?不行/g, negative: /不行|不好|有问题|不成立|有缺陷/ },
  { positive: /我[^。]*?同意[^。。]*?但[是]?[^。]*?不/g, negative: /但[是]?[^。]*?不/ },
  { positive: /很[好大棒优秀正确][^。。]*?但是/g, negative: /但是|不过|然而/ },
  // 正反立场并排
  { positive: /应该[^。。]*?不需要/g, negative: /不需要/ },
  { positive: /必须[^。。]*?没必要/g, negative: /没必要/ },
  // 肯定+否定同一对象
  { positive: /是[^。。]*?不是/g, negative: /不是/ },
  { positive: /有[^。。]*?没有/g, negative: /没有/ },
  // 英文
  { positive: /\b(should|must|have to)[^.]*?but\b/i, negative: /\bbut\b[^.]*?(shouldn|don't|not)/i },
  { positive: /\b(agree|support|endorse)[^.]*?however\b/i, negative: /\bhowever\b/i },
  { positive: /\b(good|excellent|great|valid)[^.]*?but\b/i, negative: /\bbut\b[^.]*?(problem|issue|flaw|not)/i },
];

function checkContradiction(text) {
  if (!text || typeof text !== 'string') return { count: 0, contradictions: [], score: 0 };
  const contradictions = [];
  for (const pair of CONTRADICTION_PAIRS) {
    const posMatch = text.match(pair.positive);
    if (posMatch && pair.negative.test(text)) {
      contradictions.push({ pair: pair.positive.source.slice(0, 30), severity: 'medium' });
    }
  }
  const count = contradictions.length;
  return { count, contradictions, score: Math.min(1, count * 0.3) };
}

// ─── 模糊/模棱两可检测（weasel words）─────────────────────────────
const VAGUE_PATTERNS = {
  zh: [/相关方面/i, /有关部门/i, /业内人士/i, /知情人士/i, /据传/i, /消息称/i, /可能也许/i, /大概可能/i, /某种程度/i, /在一定情况下/i, /有人说/i, /据了解/i, /据悉/i, /或可/i, /或会/i, /不排除/i],
  en: [/\bsome people say\b/i, /\bits is said\b/i, /\bi'?m not sure\b/i, /\bmaybe perhaps\b/i, /\bsort of\b/i, /\bkind of\b/i, /\bbasically\b/i, /\bessentially\b/i, /\breportedly\b/i, /\ballegedly\b/i, /\bpurportedly\b/i, /\brelatively\b/i, /\bquite\b/i, /\brather\b/i, /\bto some extent\b/i, /\bin a way\b/i],
};

function checkVagueness(text) {
  if (!text || typeof text !== 'string') return { count: 0, matches: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? VAGUE_PATTERNS.zh : VAGUE_PATTERNS.en;
  const matches = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) matches.push({ pattern: pat.source.slice(0, 20), count: m.length });
  }
  const count = matches.length;
  return { count, matches, score: Math.min(1, count * 0.2) };
}

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
  const ct = checkContradiction(text);
  const vg = checkVagueness(text);

  const overallScore = Math.round(((ev.score + (1 - sy.score) + (1 - ct.score) + (1 - vg.score)) / 4) * 100) / 100;
  const verdict = overallScore >= 0.6 ? '可信' : overallScore >= 0.4 ? '需验证' : '不可信';

  return {
    verdict,
    overallScore,
    dimensions: {
      evidence: ev,
      sycophancy: sy,
      contradiction: ct,
      vagueness: vg,
    },
    summary: [
      sy.totalHits > 0 ? `${sy.totalHits} 个 sycophancy 信号` : '',
      ct.count > 0 ? `${ct.count} 处矛盾` : '',
      vg.count > 0 ? `${vg.count} 处模糊表述` : '',
      ev.issues.length > 0 ? `${ev.issues.length} 个证据问题` : '',
    ].filter(Boolean).join('；') || '未发现明显问题',
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
  checkContradiction,
  checkVagueness,
  discriminate,

  // 引擎模式
  createEngine,

  // 版本
  version: require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim(),
};
