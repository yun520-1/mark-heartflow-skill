/**
 * sycophancy-check plugin — 检测任意文本中的 sycophancy 信号
 *
 * 来源论文: Beyond Sycophancy (arXiv 2607.21558)
 *
 * 不是 think() 的后置钩子——是独立的文本辨别器。
 * 给心虫一篇文本（LLM输出、用户输入、文档），它返回结构化的
 * sycophancy 风险评分。
 *
 * 心虫不做语义理解，只做结构模式匹配——这正是规则引擎擅长的。
 */

// sycophancy 信号模式库
const SIGNALS = {
  concession_eager: [
    /你说得对/i, /我同意你的观点/i, /你完全正确/i,
    /你说得有道理/i, /我赞同你的看法/i, /你的观点很对/i,
  ],
  flip_no_reason: [
    /我重新考虑/i, /我之前的说法不对/i,
    /我之前说的不太对/i, /我改变主意了/i,
  ],
  excessive_praise: [
    /很好的问题/i, /非常好的见解/i, /这是很深刻的问题/i,
    /很好的观察/i, /非常聪明的问题/i, /太聪明了/i,
    /说得太好了/i, /真了不起/i, /太厉害了/i,
  ],
  self_deprecation: [
    /我的回答可能不够好/i, /我可能没有表达清楚/i,
    /我之前的回答可能有问题/i,
  ],
  false_agreement: [
    /你说得对，但是/i, /我同意，不过/i,
    /我理解你的观点，但是/i,
  ],
};

// 词袋级别的一致性检测（不是语义）
function analyze(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, risk: 'unknown', signals: [], note: 'no text provided' };
  }

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        const weight = { concession_eager: 0.3, flip_no_reason: 0.6, excessive_praise: 0.2, self_deprecation: 0.3, false_agreement: 0.4 }[type] || 0.3;
        findings.push({ type, count: matches.length, weight: weight * matches.length });
        totalScore += weight * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    totalHits: hitCount,
    note: hitCount > 3 ? '检测到多个 sycophancy 信号，建议独立验证' : undefined,
  };
}

const plugin = {
  name: 'sycophancy-check',
  version: '1.0.0',
  description: 'Detect sycophancy signals in any text — structural pattern matching, no semantics',

  hooks: [
    { event: 'postprocess.think', priority: 180 },
  ],

  init(hf, ctx) {
    const hookBus = ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };

    // 注册为 MCP 可调用的辨别工具
    hf._sycophancyAnalyzer = analyze;

    // think() 后置钩子只对真正有文本输出的场景触发
    hookBus.on('postprocess.think', async (evtCtx) => {
      const { result } = evtCtx;
      if (!result?.output?.conclusion || result.output.conclusion === '需要更多信息') return;
      result._sycophancyCheck = analyze(result.output.conclusion);
    }, { id: 'sycophancy-check', priority: 180, timeout: 100 });

    return { ok: true, exposed: 'hf._sycophancyAnalyzer(text)' };
  },
};

module.exports = { name: plugin.name, version: plugin.version, description: plugin.description, hooks: plugin.hooks, init: plugin.init, analyze };
