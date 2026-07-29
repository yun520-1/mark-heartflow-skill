/**
 * src/verifier.js — AGI 第 1 层：事实核查 & 证据引擎
 *
 * gate action='verify' 时，verifier 抽取出文本中的可验证声明，
 * 标记证据状态：有证据 / 需证据 / 无法验证。
 *
 * 零 LLM，纯规则。
 *
 * 用法：
 *   const { gate } = require('./src/gate.js');
 *   const { verify } = require('./src/verifier.js');
 *   const r = gate(text);
 *   if (r.gate.action === 'verify') {
 *     const v = verify(text);
 *     // v.claims[] 每个 claim 带 evidence_status + 建议
 *   }
 */

'use strict';

// ─── 可验证声明抽取规则 ─────────────────────────────

// 中文可验证声明模式
const ZH_CLAIM_PATTERNS = [
  // 统计数据类
  { re: /[0-9]+%[^，。]*?(用户|人|企业|公司|国家|城市|产品|病例|实验)/g, type: 'statistic' },
  { re: /[0-9]+[万亿]?[人例家个][^，。]*?(调查|统计|数据|报告|研究|实验)/g, type: 'statistic' },
  { re: /[多于少超达约][0-9]+[^，。]*?[人例个家次]/g, type: 'statistic' },
  // 事实断言类
  { re: /[^，。]*?是[^，。]*?(第一|唯一|最早|最大|最好|最差|最|首个|首个)[^，。]*?/g, type: 'absolute_claim' },
  { re: /[^，。]*?比[^，。]*?[高低多快慢好差][^，。]*?[0-9]+%/g, type: 'comparison' },
  { re: /[^，。]*?导致[^，。]*?[^，。]*?率[^，。]*?[上升下降增加减少]/g, type: 'causal_claim' },
  // 权威依赖类
  { re: /根据[^，。]*?(研究|报告|调查|数据|专家|机构)[^，。]*?/g, type: 'authority_dependent' },
  { re: /(?:专家|教授|博士|研究)(?:表示|指出|认为|说|表明)[^，。]*(?=[，。]|$)/g, type: 'authority_dependent' },
  // 绝对断言类
  { re: /(?<!反)[始终永远绝对一定肯定][^，。]*?(可以|是|有|会|能|不会|没有|不是|不)/g, type: 'absolute_statement' },
  { re: /[^，。]*?[没有从不从未没有任何][^，。]*?绝对[^，。]*?/g, type: 'absolute_statement' },
  // 预测类
  { re: /[^，。]*?(将会|预计|预期|预测|有望)[^，。]*?/g, type: 'prediction' },
];

// 英文可验证声明模式
const EN_CLAIM_PATTERNS = [
  { re: /\b\d+%\s*(of|of the)\s+[^.]*/g, type: 'statistic' },
  { re: /\b\d+\s*(million|billion|thousand|people|users|companies|cases|patients|studies)\b[^.]*/g, type: 'statistic' },
  { re: /\b(the\s+)?(first|only|best|worst|largest|smallest|most|highest|lowest)\b[^.]*/g, type: 'absolute_claim' },
  { re: /according\s+to\s+[^.]*/gi, type: 'authority_dependent' },
  { re: /(studies|research|data|surveys?)\s+(show|suggest|indicate|prove|demonstrate|reveal|find)[^.]*/gi, type: 'authority_dependent' },
  { re: /(will|could|would|might|likely|expected\s+to|predicted\s+to|forecast)[^.]*/gi, type: 'prediction' },
  { re: /\b(always|never|all|none|every|no\s+one|absolutely|certainly)\b[^.]*/gi, type: 'absolute_statement' },
];

// ─── 常见不可验证模式（观点/建议/情感）─────────────────
const ZH_OPINION_PATTERNS = [
  /我认为|我觉得|在我看来|个人认为|说实话/i,
  /建议|推荐|最好|可以试试/i,
  /喜欢|讨厌|爱|恨|开心|难过/i,
];

const EN_OPINION_PATTERNS = [
  /\bi think\b|\bin my opinion\b|\bi believe\b|\bfrankly\b|\bpersonally\b/i,
  /\bi (like|love|hate|dislike|enjoy|prefer)\b/i,
  /\byou should\b|\bi recommend\b|\bi suggest\b/i,
];

/**
 * 从文本中抽取可验证声明
 * @param {string} text
 * @returns {Array<{claim: string, type: string, evidence_status: string}>}
 */
function extractClaims(text) {
  if (!text || typeof text !== 'string') return [];
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? ZH_CLAIM_PATTERNS : EN_CLAIM_PATTERNS;
  const opinionPatterns = hasChinese ? ZH_OPINION_PATTERNS : EN_OPINION_PATTERNS;

  const claims = [];
  const seen = new Set();

  for (const { re, type } of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const claim = m[0].trim();
      if (!claim || claim.length < 5 || seen.has(claim)) continue;
      seen.add(claim);

      // 判断是否可验证
      let status = 'needs_evidence';
      // 绝对断言需要证据
      if (type === 'absolute_statement' || type === 'absolute_claim' || type === 'comparison' || type === 'causal_claim') {
        status = 'needs_evidence';
      }
      // 统计类引用了来源才认为有证据
      if (type === 'statistic' && /根据|来自|来源|according|source|per\b/i.test(m[0])) {
        status = 'has_evidence';
      }
      // 依赖权威的声明
      if (type === 'authority_dependent') {
        status = 'authority_referenced';
      }
      // 预测无法验证
      if (type === 'prediction') {
        status = 'unverifiable';
      }

      claims.push({ claim: claim.slice(0, 80), type, evidence_status: status });
    }
  }

  // 去重
  const unique = [];
  const keys = new Set();
  for (const c of claims) {
    const key = c.claim.slice(0, 30);
    if (!keys.has(key)) { keys.add(key); unique.push(c); }
  }

  // 检查是否是观点（不验证）
  for (const c of unique) {
    for (const op of opinionPatterns) {
      if (op.test(c.claim)) {
        c.evidence_status = 'opinion';
        break;
      }
    }
  }

  return unique;
}

/**
 * 一致性检查：文本内部是否有冲突声明
 */
function checkConsistency(claims) {
  if (claims.length < 2) return { conflicts: [], consistent: true };

  const conflicts = [];
  // 找数字冲突
  const percentages = claims.filter(c => /[0-9]+%/.test(c.claim));
  if (percentages.length >= 2) {
    for (let i = 0; i < percentages.length; i++) {
      for (let j = i + 1; j < percentages.length; j++) {
        conflicts.push({
          type: 'possible_contradiction',
          between: [percentages[i].claim.slice(0, 40), percentages[j].claim.slice(0, 40)],
          detail: '两个统计声称可能互相矛盾'
        });
      }
    }
  }

  return { conflicts, consistent: conflicts.length === 0 };
}

/**
 * 主入口：对文本做证据核查
 * @param {string} text
 * @returns {{ claims: Array, consistency: Object, summary: string }}
 */
function verify(text) {
  const claims = extractClaims(text);
  const consistency = checkConsistency(claims);

  const needsEvidence = claims.filter(c => c.evidence_status === 'needs_evidence').length;
  const hasEvidence = claims.filter(c => c.evidence_status === 'has_evidence').length;
  const authorityRefs = claims.filter(c => c.evidence_status === 'authority_referenced').length;
  const unverifiable = claims.filter(c => c.evidence_status === 'unverifiable').length;

  let verdict = 'verified';
  if (needsEvidence > 0 || consistency.conflicts.length > 0) verdict = 'needs_evidence';
  if (authorityRefs > 0 && needsEvidence === 0) verdict = 'authority_only';

  const summary = claims.length === 0
    ? '文本不含可验证声明'
    : `含${claims.length}个可验证声明：${needsEvidence}需证据, ${hasEvidence}有证据, ${authorityRefs}依赖权威, ${unverifiable}无法验证`;

  return { claims, consistency, verdict, summary };
}

module.exports = { verify, extractClaims, checkConsistency };
