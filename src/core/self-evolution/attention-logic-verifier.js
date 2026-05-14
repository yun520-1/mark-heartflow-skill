/**
 * HeartFlow Attention Logic Verifier v0.13.115
 * 
 * Paper: Attention Is All You Need (arXiv:1706.03762)
 * Core idea: important tokens should get more weight than decorative tokens.
 * 
 * 功能:
 * - 用attention权重聚焦证据词
 * - 检测矛盾表述
 * - 评估可执行性
 * - 输出修复建议
 */

const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','to','of','and','or','in','on','for','with','that','this',
  '我','你','他','她','它','我们','你们','他们','的','了','是','在','和','与','就','也','都','而','但','如果','那么','因为','所以'
]);
const NEGATIONS = new Set(['not','no','never','none','cannot','cant','wont','不要','不是','不能','不会','无']);
const ACTION_WORDS = new Set(['fix','check','verify','test','run','measure','repair','update','compare','减少','修复','检查','验证','测试','更新','测量','比较']);
const EVIDENCE_WORDS = new Set(['because','evidence','result','data','log','trace','measure','proof','由于','证据','结果','数据','日志','报错','原因','证明']);

const CONTRADICTION_PAIRS = [
  ['通过','失败'],['成功','错误'],['存在','不存在'],
  ['improve','worse'],['pass','fail']
];

class VerificationResult {
  constructor(data) {
    this.version = data.version || '0.13.115';
    this.focusTokens = data.focusTokens || [];
    this.supportScore = data.supportScore || 0;
    this.contradictionScore = data.contradictionScore || 0;
    this.actionabilityScore = data.actionabilityScore || 0;
    this.logicScore = data.logicScore || 0;
    this.verdict = data.verdict || 'needs_revision';
    this.reasons = data.reasons || [];
    this.repairHints = data.repairHints || [];
  }

  toJSON() {
    return {
      version: this.version,
      focusTokens: this.focusTokens,
      supportScore: this.supportScore,
      contradictionScore: this.contradictionScore,
      actionabilityScore: this.actionabilityScore,
      logicScore: this.logicScore,
      verdict: this.verdict,
      reasons: this.reasons,
      repairHints: this.repairHints,
    };
  }
}

class AttentionLogicVerifier {
  constructor() {
    this.version = '0.13.115';
  }

  tokenize(text) {
    if (!text) return [];
    text = text.toLowerCase();
    const parts = text.match(/[a-zA-Z_]+|[\u4e00-\u9fff]+|\d+\.\d+|\d+/g) || [];
    return parts.filter(p => p.trim());
  }

  attentionWeights(tokens) {
    const counts = {};
    for (const t of tokens) counts[t] = (counts[t] || 0) + 1;
    
    const weights = {};
    for (const t of tokens) {
      let base = 1.0;
      if (STOPWORDS.has(t)) base *= 0.2;
      if (ACTION_WORDS.has(t)) base *= 1.8;
      if (EVIDENCE_WORDS.has(t)) base *= 2.0;
      if (/\d/.test(t)) base *= 1.4;
      base *= 1.0 + Math.min(counts[t] - 1, 3) * 0.15;
      weights[t] = Math.round(base * 1000) / 1000;
    }
    return weights;
  }

  topFocusTokens(weights, topk = 8) {
    return Object.entries(weights)
      .sort((a, b) => b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0]))
      .slice(0, topk)
      .map(([k]) => k);
  }

  supportScore(tokens, weights) {
    if (!tokens.length) return 0;
    let score = 0;
    if (tokens.some(t => EVIDENCE_WORDS.has(t))) score += 0.35;
    if (tokens.some(t => ACTION_WORDS.has(t))) score += 0.25;
    if (tokens.some(t => /\d/.test(t))) score += 0.15;
    const focused = this.topFocusTokens(weights, 6);
    const nonStop = focused.filter(t => !STOPWORDS.has(t));
    score += Math.min(nonStop.length / 6.0, 1.0) * 0.25;
    return Math.min(Math.round(score * 1000) / 1000, 1.0);
  }

  contradictionScore(text, tokens) {
    let score = 0;
    if (tokens.some(t => NEGATIONS.has(t))) score += 0.2;
    for (const [a, b] of CONTRADICTION_PAIRS) {
      if (text.includes(a) && text.includes(b)) score += 0.35;
    }
    if (text.includes('但是') && text.includes('所以')) score += 0.15;
    return Math.min(Math.round(score * 1000) / 1000, 1.0);
  }

  actionabilityScore(tokens) {
    const acts = tokens.filter(t => ACTION_WORDS.has(t)).length;
    return Math.min(Math.round(acts / 4.0 * 1000) / 1000, 1.0);
  }

  verify(text) {
    const tokens = this.tokenize(text);
    const weights = this.attentionWeights(tokens);
    const support = this.supportScore(tokens, weights);
    const contradiction = this.contradictionScore(text, tokens);
    const actionability = this.actionabilityScore(tokens);
    const logic = Math.max(0, Math.min(
      Math.round((0.5 * support + 0.3 * actionability - 0.4 * contradiction + 0.3) * 1000) / 1000,
      1.0
    ));

    const reasons = [];
    const repairHints = [];
    if (support < 0.45) {
      reasons.push('证据支撑不足');
      repairHints.push('补充数据、日志、结果或明确因果说明');
    }
    if (contradiction > 0.3) {
      reasons.push('存在潜在自相矛盾');
      repairHints.push('拆分结论与证据，检查是否同时出现互斥表述');
    }
    if (actionability < 0.25) {
      reasons.push('缺少可执行动作');
      repairHints.push('增加检查、验证、修复、测试等明确动作');
    }
    if (!reasons.length) {
      reasons.push('证据、动作与表述基本一致');
      repairHints.push('可继续增加可测量结果以进一步减少逻辑错误');
    }

    const verdict = logic >= 0.65 && contradiction < 0.35 ? 'pass' : 'needs_revision';
    return new VerificationResult({
      version: this.version,
      focusTokens: this.topFocusTokens(weights),
      supportScore: support,
      contradictionScore: contradiction,
      actionabilityScore: actionability,
      logicScore: logic,
      verdict,
      reasons,
      repairHints,
    });
  }
}

module.exports = { AttentionLogicVerifier, VerificationResult };

// Demo
if (require.main === module) {
  const v = new AttentionLogicVerifier();
  const tests = [
    '请先检查日志和结果，验证版本11.0.0为什么回退，再修复配置并测试。',
    '我觉得可能大概是这样吧，我也不太确定。',
    '成功修复了所有bug，测试通过，达到了目标。',
  ];
  for (const t of tests) {
    const r = v.verify(t);
    console.log(`"${t}"`);
    console.log(`  → verdict=${r.verdict} logic=${r.logicScore} support=${r.supportScore} contradiction=${r.contradictionScore} action=${r.actionabilityScore}`);
    console.log(`  → reasons: ${r.reasons.join(', ')}`);
  }
}
