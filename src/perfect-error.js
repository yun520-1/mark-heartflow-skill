/**
 * src/perfect-error.js — 完美错误答案检测器
 *
 * "完美的错误答案" = 结构完美（流畅、肯定、像真的），内容错误（编造、无据）。
 * 单个信号无害，多个信号叠加 = 用户无法辨别的危险输出。
 *
 * 核心思想：抓 6 类信号，用"触发计数 + 协同惩罚"判定，而不是单信号触发。
 *
 * 信号:
 *   S1 假精确     — 精确数字伪装（小数、百分比、年份+数字）
 *   S2 伪权威     — 编造的专家/机构/研究引用
 *   S3 全肯定结构 — 无任何让步/不确定词
 *   S4 伪因果     — 无证据强因果（"正是因为X""必然导致"）
 *   S5 绝对断言   — "所有/一切/总是/从不/绝对"
 *   S6 无来源     — 长断言但无来源词（研究/报告/数据/调查）
 *
 * 判定:
 *   1 信号 → pass（正常论述也偶尔有）
 *   2 信号 → verify（需验证）
 *   3+ 信号 → rewrite（疑似完美错误答案）
 *   4+ 信号 + 假精确 → 高危（分数 0.9+，直接 rewrite）
 */

'use strict';

// ─── S1: 假精确 — 精确数字伪装 ──────────────────────────────
const FALSE_PRECISION_PATTERNS = [
  /\d+\.\d+\s*(?:%|percent|倍|万|亿|million|billion|trillion)/gi,              // 87.3% / 12.5 million（%后不跟\b，JS的\b对%边界有怪癖）
  /\d+(?:\.\d+)?\s*(?:%|percent)[^。\n]{0,25}/gi,                                // 精确百分比
  /(?:\d{4})\s*年[^。\n]{0,15}(?:增长|下降|达到|突破|超过|占|上升|提高)/gi,      // 2025年增长XX
  /(?:\d{2,4})\s*年[^。\n]{0,20}\d+(?:\.\d+)?\s*(?:%|亿|万|倍)/gi,              // 2025年XX达到87.3%
  /\b(?:around|about|approximately|roughly|nearly)\s*\d+(?:\.\d+)?\s*(?:%|million|billion)/gi, // 伪精确约数
];

// ─── S2: 伪权威 — 编造的专家/机构/研究引用 ─────────────────────
const FAKE_AUTHORITY_PATTERNS = [
  /(?:著名|权威|知名|资深|国际|国内)\s*(?:教授|专家|学者|研究员|博士|院士)/gi,
  /(?:据|根据|按照|引用)\s*(?:某|一位|一位著名|某著名)?\s*(?:专家|学者|教授|研究团队|机构)/gi,
  /(?:Nature|Science|Cell|The Lancet|JAMA|BMJ|NEJM|PNAS)\s*(?:研究|论文|报告|发现|证实|表明)/gi,
  /(?:发表|发布|刊登)\s*(?:在|于)?\s*(?:国际|顶级|权威|知名)?\s*(?:期刊|杂志|学报|报告)\b/gi,
  /(?:某|一位|多位|几名)\s*(?:科学家|研究员|学者|专家|教授)\s*(?:指出|表示|认为|发现|证实|强调)/gi,
  /(?:研究|调查|实验|数据)\s*(?:表明|显示|证明|证实|发现|指出)[^。\n]{0,30}\d+(?:%|万|亿|倍)/gi,
  // 英文伪权威
  /\b(?:renowned|famous|leading|distinguished|eminent|top)\s+(?:Professor|Dr\.?|Doctor|scientist|researcher|scholar|expert|academic)\b/gi,
  /\b(?:According to|according to)\s+(?:a|an)?\s*(?:recent|new|202\d)?\s*(?:Nature|Science|study|research|report|paper|survey)\b/gi,
  /\b(?:published|reported|documented)\s+in\s+(?:the\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:Journal|Review|Report|Paper)\b/gi,
  /\b(?:study|research|report|paper|survey)\s+(?:shows?|proves?|demonstrates?|reveals?|finds?|confirms?)\b[^.]{0,40}\d+(?:\.\d+)?\s*(?:%|million|billion)\b/gi,
];

// ─── S3: 全肯定结构 — 无任何让步/不确定词 ─────────────────────
const UNCERTAINTY_WORDS_ZH = [
  '可能', '或许', '也许', '大概', '大约', '估计', '推测', '往往', '通常',
  '一般而言', '一般来说', '一定程度上', '某些', '部分', '有些', '似乎', '显得',
  '不确定', '未证实', '有待', '值得商榷', '存疑', '难以确定', '还不清楚', '不能肯定',
  '据我所知', '以我目前了解', '我的理解是', '大概来说'
];
const UNCERTAINTY_WORDS_EN = [
  'maybe', 'perhaps', 'possibly', 'probably', 'might', 'may', 'could',
  'seems', 'appears', 'sometimes', 'often', 'usually', 'typically',
  'generally', 'approximately', 'roughly', 'somewhat', 'some', 'certain',
  'unclear', 'uncertain', 'unknown', 'not sure', 'not certain', 'i think',
  'in my view', 'to my knowledge', 'as far as i know'
];

// ─── S4: 伪因果 — 无证据强因果 ──────────────────────────────
const FALSE_CAUSALITY_PATTERNS = [
  /(?:正是因为|正因为|正是因为有了|恰恰是因为)\s*[^，。]{2,20}\s*(?:才|所以|导致|造成|使得|让)/gi,
  /(?:必然|必定|毫无疑问)\s*(?:导致|造成|引起|使得|让)/gi,
  /(?:所以|因此|由此可见)\s*(?:必然|肯定|一定|毫无疑问)[^。\n]{0,20}/gi,
  /(?:只要|一旦)\s*[^，。]{2,15}\s*(?:就|必|一定)[^。\n]{0,15}(?:成功|失败|必然|导致)/gi,
  /(?:\w+\s+therefore\s+|\w+\s+thus\s+|\w+\s+hence\s+)\w+/gi,
  /(?:undoubtedly|unquestionably|absolutely|certainly)\s+(?:leads?|causes?|results?|triggers?|produces?)/gi,
];

// ─── S5: 绝对断言 — 所有/一切/总是/从不/绝对 ───────────────────
const ABSOLUTE_CLAIMS = [
  /(?:所有|一切|全部|任何|每一个|总是|从不|从来|永远|绝对|完全|彻底|必定|必然|一定)\s*[^，。\n]{0,12}(?:是|都|会|能|要|必须|不会|不可能)/gi,
  /(?:nothing|everything|always|never|absolutely|certainly|undoubtedly|definitely|completely|entirely|totally)\s+\w+/gi,
  /(?:no\s+(?:doubt|question|way)|under\s+no\s+circumstances)\b/gi,
];

// ─── S6: 无来源 — 长断言但无来源词 ────────────────────────────
const SOURCE_WORDS = [
  '研究', '报告', '数据', '调查', '论文', '文献', '统计', '资料', '案例',
  '实验', '测试', '观察', 'evidence', 'research', 'study', 'report', 'data',
  'survey', 'paper', 'literature', 'statistics', 'source', 'according'
];
const CLAIM_PATTERNS = [
  /[^。\n]{15,60}(?:证明了|证实了|发现|表明|显示)[^。\n]{0,30}/gi,
  /[^。\n]{10,}(?:是|为)\s*(?:全球|全国|世界|行业)?\s*(?:第一|最大|最强|最快|最先进|唯一)\b/gi,
];

/**
 * 检测文本是否为"完美的错误答案"
 * @param {string} text - 要检测的文本
 * @returns {{ count, signals, score, isPerfectError, details }}
 */
function checkPerfectError(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0, isPerfectError: false };

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const signals = [];

  // S1: 假精确
  const precisionHits = [];
  for (const pat of FALSE_PRECISION_PATTERNS) {
    const m = text.match(pat);
    if (m && m.length) precisionHits.push(...m.slice(0, 3).map(x => x.slice(0, 40)));
  }
  if (precisionHits.length) {
    signals.push({ id: 'S1_false_precision', name: '假精确', count: precisionHits.length, hits: precisionHits.slice(0, 3), weight: 0.8 });
  }

  // S2: 伪权威
  const authorityHits = [];
  for (const pat of FAKE_AUTHORITY_PATTERNS) {
    const m = text.match(pat);
    if (m && m.length) authorityHits.push(...m.slice(0, 3).map(x => x.slice(0, 40)));
  }
  if (authorityHits.length) {
    signals.push({ id: 'S2_fake_authority', name: '伪权威', count: authorityHits.length, hits: authorityHits.slice(0, 3), weight: 0.9 });
  }

  // S3: 全肯定结构 — 长文本(>80字)且无任何不确定词
  const clean = text.replace(/[。！？!?]/g, '。').replace(/\n/g, '。');
  // 英文按句号/感叹号分句，中文按句号分句
  const sentences = hasChinese
    ? clean.split('。').filter(s => s.trim().length > 8)
    : text.split(/[.!?]/).filter(s => s.trim().split(/\s+/).length > 4);
  const words = hasChinese ? UNCERTAINTY_WORDS_ZH : UNCERTAINTY_WORDS_EN;
  const totalLen = text.length;
  let uncertaintyHits = 0;
  for (const w of words) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (re.test(text)) uncertaintyHits++;
  }
  // 长文本 + 无不确定词 + 多断言句 → 全肯定
  if (totalLen > 80 && uncertaintyHits === 0 && sentences.length >= 3) {
    signals.push({ id: 'S3_all_certain', name: '全肯定结构', count: sentences.length, hits: [`${sentences.length}句断言无任何不确定词`], weight: 0.7 });
  }

  // S4: 伪因果
  const causalHits = [];
  for (const pat of FALSE_CAUSALITY_PATTERNS) {
    const m = text.match(pat);
    if (m && m.length) causalHits.push(...m.slice(0, 3).map(x => x.slice(0, 40)));
  }
  if (causalHits.length) {
    signals.push({ id: 'S4_false_causality', name: '伪因果', count: causalHits.length, hits: causalHits.slice(0, 3), weight: 0.7 });
  }

  // S5: 绝对断言
  const absoluteHits = [];
  for (const pat of ABSOLUTE_CLAIMS) {
    const m = text.match(pat);
    if (m && m.length) absoluteHits.push(...m.slice(0, 3).map(x => x.slice(0, 40)));
  }
  if (absoluteHits.length) {
    signals.push({ id: 'S5_absolute_claim', name: '绝对断言', count: absoluteHits.length, hits: absoluteHits.slice(0, 3), weight: 0.6 });
  }

  // S6: 无来源 — 长断言但无来源词
  const hasSource = SOURCE_WORDS.some(w => text.toLowerCase().includes(w.toLowerCase()));
  if (!hasSource && totalLen > 60) {
    const claimCount = CLAIM_PATTERNS.reduce((n, pat) => {
      const m = text.match(pat);
      return n + (m ? m.length : 0);
    }, 0);
    if (claimCount >= 2) {
      signals.push({ id: 'S6_no_source', name: '无来源断言', count: claimCount, hits: [`${claimCount}处断言无任何来源/数据/研究引用`], weight: 0.6 });
    }
  }

  const count = signals.length;
  // 加权分
  const weighted = signals.reduce((s, sig) => s + sig.weight, 0);
  // 协同惩罚：信号越多越危险（非线性）
  const synergy = count >= 4 ? 0.15 : count === 3 ? 0.08 : 0;
  const score = Math.min(1, weighted / 4 + synergy);

  // 判定级别
  let level = 'pass';
  if (count >= 4 && precisionHits.length) level = 'high';       // 4+信号含假精确 → 高危
  else if (count >= 3) level = 'high';                          // 3+信号 → 高危
  else if (count >= 2) level = 'verify';                        // 2信号 → 需验证

  return {
    count,
    signals,
    score: Math.round(score * 100) / 100,
    isPerfectError: count >= 3,
    level,
    details: signals.map(s => `${s.name}(${s.count}处)`).join('; ') || '无明显信号'
  };
}

module.exports = { checkPerfectError };
