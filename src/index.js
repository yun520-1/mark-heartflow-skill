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
    /\byou('re| are) (spot on|on point|exactly right)\b/i,
    /\bi (see|get) (exactly|precisely|perfectly) what you mean\b/i,
  ],
  flip_no_reason: [
    /\bi (reconsider|rethinking|changed my mind)\b/i,
    /\bi was (wrong|mistaken|incorrect)\b/i,
    /\bmy (previous|earlier) (response|answer) was (wrong|incorrect)\b/i,
    /\bi stand corrected\b/i,
  ],
  excessive_praise: [
    /\bthat('s| is) a (great|brilliant|fantastic|excellent) (question|idea|suggestion)\b/i,
    /\byou('re| are) (so|very) (smart|intelligent|insightful)\b/i,
    /\bthat('s| is) an (excellent|outstanding|remarkable) (answer|analysis|perspective)\b/i,
    /\byou('ve| have) (really|truly|genuinely) (nailed|captured|articulated) it\b/i,
  ],
  self_deprecation: [
    /\bmy (response|answer|explanation) (may|might) not be (clear|helpful|good enough)\b/i,
    /\bi (hope|trust) this (doesn'?t|does not) sound (dumb|silly|stupid)\b/i,
    /\b(i'?m|i am) (probably|likely) (wrong|way off base|missing something)\b/i,
  ],
  false_agreement: [
    /\bi agree,? but\b/i,
    /\byou('re| are) right,? (but|however|though)\b/i,
    /\bthat('s| is) a (good|fair|valid) point,? (but|however)\b/i,
    /\byes,? (of course|indeed|absolutely),? (but|however)\b/i,
    /\byou make a (fair|valid) point,? (nevertheless|still|all the same)\b/i,
  ],
};

const ZH_SIGNALS = {
  concession_eager: [
    /你说得对/i, /我同意你的观点/i, /你完全正确/i, /你说得有道理/i, /我赞同你的看法/i, /我完全同意/i,
    /您说得太对了/i,                    // 高语境尊称+强烈同意
    /完全听您的/i,                       // 权威服从式同意
    /您高见/i,                           // 古典敬语式奉承
    /听您的准没错/i,                     // 无条件信任式奉承
  ],
  flip_no_reason: [
    /我重新考虑/i, /我之前的说法不对/i, /我改变主意了/i, /我想想你说得对/i,
    /您说得有道理，是我考虑不周/i,       // 捧高对方+自我贬低式转向
  ],
  excessive_praise: [
    /很好的问题/i, /非常好的见解/i, /太聪明了/i, /说得太好了/i, /非常棒的问题/i,
    /您这个想法真是高瞻远瞩/i,           // 高语境宏大奉承
    /您真是我见过最有(智慧|远见|深度)的/i, // 最高级比较式捧高
    /您的话让我茅塞顿开/i,               // 启蒙式奉承（claiming enlightenment）
    /您的水平太高了我完全跟不上/i,       // 捧杀——捧到无法对话
    /您这个方案堪称完美/i,               // 捧杀——断绝改进空间
    /能听到您的见解是我的荣幸/i,         // 过度荣幸式捧高
    /您的格局真是无人能及/i,             // 文化特定"格局"式捧高
  ],
  self_deprecation: [
    /我的回答可能不够好/i, /我可能没有表达清楚/i, /我的能力有限/i,
    /我这水平哪敢质疑您/i,               // 极端自贬+地位服从
    /我只是班门弄斧/i,                    // 古典自谦成语
    /在您面前我不敢妄加评论/i,           // 地位回避式自我矮化
    /我的见识太浅薄了/i,                  // 捧高对方同时自贬
  ],
  false_agreement: [
    /你说得对，但是/i, /我同意，不过/i, /你说得有道理，不过/i,
    /您说的是，不过/i,                   // 尊称+回避式同意
    /您的观点很有启发，只是/i,           // 高语境假同意+转折
    /我原则上同意，但是/i,               // 回避式同意（原则性同意+实际否定）
    /你说得对，但是我也有一个想法/i,     // 赞同后立即转移焦点
  ],
};

const WEIGHTS = { concession_eager: 0.3, flip_no_reason: 0.5, excessive_praise: 0.2, self_deprecation: 0.3, false_agreement: 0.4 };

// ─── 矛盾检测（同一段话中前后说相反的）─────────────────────────────
const CONTRADICTION_PAIRS = [
  { positive: /这是[^。]*?好[^。。]*?但[是]?[^。]*?不行/g, negative: /不行|不好|有问题|不成立|有缺陷/ },
  { positive: /我[^。]*?同意[^。。]*?但[是]?[^。]*?不/g, negative: /但[是]?[^。]*?不/ },
  { positive: /很[好大棒优秀正确][^。。]*?但是/g, negative: /但是|不过|然而/ },
  { positive: /应该[^。。]*?不需要/g, negative: /不需要/ },
  { positive: /必须[^。。]*?没必要/g, negative: /没必要/ },
  { positive: /是[^。。]*?不是/g, negative: /不是/ },
  { positive: /有[^。。]*?没有/g, negative: /没有/ },
  { positive: /\b(should|must|have to)[^.]*?but\b/i, negative: /\bbut\b[^.]*?(shouldn|don't|not)/i },
  { positive: /\b(agree|support|endorse)[^.]*?however\b/i, negative: /\bhowever\b/i },
  { positive: /\b(good|excellent|great|valid)[^.]*?but\b/i, negative: /\bbut\b[^.]*?(problem|issue|flaw|not)/i },

  // 结果↔结论冲突：数据/结果/调查表明X，转折后结论却不成立
  { positive: /[结果数据分析调查][^。]*?(显示|表明|指出|证明)[^。]*?[但而]/g, negative: /[但而][^。]*?(并非|不是|不能|不应该|恰恰相反)/ },

  // 事实↔建议冲突：陈述事实后，给出的建议与事实方向相反
  { positive: /事实上|实际上|说实话|真实情况[^。]*?建议/g, negative: /建议[^。]*?(不|不要|别|避免|少)/ },

  // 肯定+否定并用：先肯定（毫无疑问/显然/确实），随即转折否定
  { positive: /(毫无疑问|毋庸置疑|显然|确实|的确)[^。]*?[但而]/g, negative: /[但而][^。]*?(并非|不是|没有|不成立)/ },

  // encouraging+dismissing：先鼓励/表扬，紧接着否定/打压
  { positive: /(很棒|很好|不错|厉害|加油|优秀|出色)[^。]*?但/g, negative: /但[^。]*?(不够|不行|差|不足|欠缺|没用)/ },

  // 肯定能力+表示怀疑：先肯定对方能力，后表达怀疑
  { positive: /(你(能|可以|做得很好)|你有能力|你很优秀|你有经验)[^。]*?但/g, negative: /但[^。]*?(担心|怀疑|恐怕|不过|只是|未必)/ },

  // 因果冲突：因为A所以B，但建议中A被否定
  { positive: /因为|由于|之所以/g, negative: /所以(不必|不用|不应该|没意义|无所谓|算了吧|没必要)/ },

  // 全面肯定+具体否定：先总体肯定，再具体否定
  { positive: /(整体|总体|大致|基本上|总体来说|整体来看)[^。]*?但/g, negative: /但[^。]*?(问题|缺陷|不足|遗憾|欠缺|不够|败笔)/ },

  // 承诺+取消：先承诺/保证，后反悔/取消
  { positive: /(我保证|我承诺|我一定|我肯定|我答应)[^。]*?但/g, negative: /但[^。]*?(做不到|无法|不能|没办法|不行了|取消|改变主意|还是别)/ },
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
  zh: [/相关方面/i, /有关部门/i, /业内人士/i, /知情人士/i, /据传/i, /消息称/i, /可能也许/i, /大概可能/i, /某种程度/i, /在一定情况下/i, /有人说/i, /据了解/i, /据悉/i, /或可/i, /或会/i, /不排除/i,
    // === 以下由 agent 扩充 (+12) ===
    /据分析/i, /数据表明/i, /大概率/i, /相关人士/i, /某位不愿透露姓名/i,
    /市场普遍认为/i, /行业分析认为/i, /普遍认为/i, /有观点认为/i, /不可否认/i,
    /据统计/i, /据测算/i,
  ],
  en: [/\bsome people say\b/i, /\bits is said\b/i, /\bi'?m not sure\b/i, /\bmaybe perhaps\b/i, /\bsort of\b/i, /\bkind of\b/i, /\bbasically\b/i, /\bessentially\b/i, /\breportedly\b/i, /\ballegedly\b/i, /\bpurportedly\b/i, /\brelatively\b/i, /\bquite\b/i, /\brather\b/i, /\bto some extent\b/i, /\bin a way\b/i,
    // === 以下由 agent 扩充 (+12) ===
    /\bstudies show\b/i, /\bmany people\b/i, /\bresearch indicates\b/i,
    /\bit appears that\b/i, /\bthe reality is\b/i, /\bit seems that\b/i,
    /\bit could be argued\b/i, /\bmore often than not\b/i,
    /\bit is widely believed\b/i, /\bin many cases\b/i,
    /\bit is generally accepted\b/i, /\bin most cases\b/i,
  ],
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

// ─── 逻辑谬误检测（EMNLP 2022 Logical Fallacy Detection inspired）─────────
const FALLACY_PATTERNS = {
  zh: [
    [/因为[^，。]*?所以[^，。]*?因为/i, 'circular_reasoning'],
    [/这本身就是[^，。]*?这证明/i, 'circular_reasoning'],
    [/之所以[^，。]*?是因为[^，。]*?所以/i, 'circular_reasoning'],
    [/要么[^，。]*?要么[^，。]*?没有其他选择/i, 'false_dilemma'],
    [/不是[^，。]*?就是[^，。]*?别无选择/i, 'false_dilemma'],
    [/唯一的(选择|出路|办法)是/i, 'false_dilemma'],
    [/[专家教授名人权威]说过[^，。]*?所以/i, 'appeal_to_authority'],
    [/[专家教授名人权威]认为[^，。]*?因此/i, 'appeal_to_authority'],
    [/科学家们都说/i, 'appeal_to_authority'],
    [/你这种人[^，。]*?所以你的观点/i, 'ad_hominem'],
    [/你连[^，。]*?都不懂[^，。]*?还敢/i, 'ad_hominem'],
    [/你不配[^，。]*?讨论/i, 'ad_hominem'],
    [/你的意思就是说[^，。]*?但这显然/i, 'straw_man'],
    [/按你的逻辑[^，。]*?那岂不是/i, 'straw_man'],
    [/你以为[^，。]*?其实根本不是/i, 'straw_man'],
    [/如果[^。]*?(就会|后果)[^。]*?(最终导致|不堪设想)/i, 'slippery_slope'],
    [/一旦[^。]*?后果不堪设想/i, 'slippery_slope'],
    [/开了这个头[^。]*?以后就/i, 'slippery_slope'],
    [/想想那些[^，。]*?难道你忍心/i, 'appeal_to_emotion'],
    [/你怎么能[^，。]*?你的良心/i, 'appeal_to_emotion'],
    // 从众谬误 — 大家都这么认为所以是对的
    [/大家都[^，。]*?所以[^，。]*?是对的/i, 'bandwagon'],
    [/大多数人[都]?(认为|同意|这么想)[^，。]*?(肯定|一定)没错/i, 'bandwagon'],
    // 诉诸自然 — 天然的就是好的
    [/纯天然[^，。]*?(肯定|一定|当然)[好健康安全]/i, 'appeal_to_nature'],
    [/天然的[^。]*?比[^。]*?(合成的|化学的|人工的)[^。]*?(好|健康|安全)/i, 'appeal_to_nature'],
    // 虚假因果 — 先后发生所以有因果
    [/自从[^。]*?之后就[^。]*?所以[^。]*?是因为/i, 'false_cause'],
    [/每次[^。]*?就[^。]*?所以[^。]*?是因为/i, 'false_cause'],
    // 诉诸传统 — 一直这样所以应该继续
    [/自古以来[^。]*?所以[^。]*?应该继续/i, 'appeal_to_tradition'],
    [/老祖宗[^。]*?(不能|不应该|必须)改/i, 'appeal_to_tradition'],
    // 诉诸无知 — 无法证伪所以是真的
    [/无法(证明|证伪)[^。]*?(不等于|不代表)[^。]*?(不存在|没有)/i, 'appeal_to_ignorance'],
    [/没有证据证明[^。]*?不代表[^。]*?不存在/i, 'appeal_to_ignorance'],
    // 完美主义谬误 — 不完美方案等于没方案
    [/[(不完美|治标不治本|不能根除)][^。]*?等于[^。]*?(没用|没意义|零)/i, 'perfect_solution'],
    // 非黑即白扩展 — 不支持就是反对
    [/不[支持同意赞成][^，。]*?就是[反对敌人对手]/i, 'false_dilemma_extended'],
    [/不跟[^，。]*?就是[^，。]*?敌人/i, 'false_dilemma_extended'],
    // 举证责任倒置 — 你无法证明不存在所以存在
    [/你[^，。]*?(?:无法|不能)[^，。]*?(?:证明|提供)[^，。]*?所以[^，。]*?(?:不对|错误|不存在|存在)/i, 'burden_of_proof'],
    [/除非你证明[^，。]*?否则[^，。]*?就是对/i, 'burden_of_proof'],
  ],
  en: [
    [/if you[^.]*?then you must also agree/i, 'slippery_slope'],
    [/everyone (knows|agrees) that/i, 'bandwagon'],
    [/it('s| is) (obvious|clear|plain) that/i, 'appeal_to_obviousness'],
    [/you('re| are) either (with|for) us or (against|with) them/i, 'false_dilemma'],
    [/there ('s| is| are) no (other|alternative) (option|choice|way)/i, 'false_dilemma'],
    [/experts (say|agree|believe) that[^.]*?so/i, 'appeal_to_authority'],
    [/science (proves|shows|demonstrates) that/i, 'appeal_to_authority'],
    [/you (can'?t|don'?t) (understand|know|get) it[^.]*?so/i, 'ad_hominem'],
    [/if you (disagree|don'?t agree|object)[^.]*?you('re| are) (wrong|ignorant|biased)/i, 'ad_hominem'],
    [/so what you('re| are) saying is[^.]*?that('s| is) ridiculous/i, 'straw_man'],
    [/if we allow[^.]*?then (everyone|soon)[^.]*?will/i, 'slippery_slope'],
    [/think of the[^.]*?(children|future|consequences)[^.]*?how can you/i, 'appeal_to_emotion'],
    [/common sense (tells|says) us/i, 'appeal_to_common_sense'],
  ],
};

const FALLACY_SEVERITY = {
  circular_reasoning: 0.6, false_dilemma: 0.4, appeal_to_authority: 0.3,
  ad_hominem: 0.5, straw_man: 0.5, slippery_slope: 0.4, appeal_to_emotion: 0.3,
  bandwagon: 0.3, appeal_to_obviousness: 0.2, appeal_to_common_sense: 0.2,
  appeal_to_nature: 0.3, false_cause: 0.4, appeal_to_tradition: 0.2,
  appeal_to_ignorance: 0.4, perfect_solution: 0.3, false_dilemma_extended: 0.4,
  burden_of_proof: 0.4,
};

// ─── 情感操纵检测（emotional manipulation）─────────────────────────
const EM_MANIPULATION_PATTERNS = {
  zh: [
    [/如果你不[^。]*?(就会后悔|你让我失望|你太自私了)/i, 'guilt_induction', 0.5],
    [/你[^。]*?不[^。]*?就会[^。]*?(后悔|遗憾)/i, 'guilt_induction', 0.5],
    [/你让我失望/i, 'guilt_induction', 0.5],
    [/你太自私了/i, 'guilt_induction', 0.5],
    [/你辜负了[我大家]/, 'guilt_induction', 0.5],
    [/不买[^。]*?(就会|后果)/i, 'fear_marketing', 0.5],
    [/你承担不起[^。]*?(后果|代价)/i, 'fear_marketing', 0.5],
    [/最后机会|错过这[^。]*?(就没有|不再)|限量发售|限时抢购/i, 'fear_marketing', 0.5],
    [/保证[^。]*?100%|100%[^。]*?保证|百分之百[^。]*?保证/i, 'overpromising', 0.4],
    [/绝对有效|零风险|无效退款|包治百病/i, 'overpromising', 0.4],
    [/你不在乎我|你心里没有我/i, 'victim_stance', 0.6],
    [/你永远(不考虑|不顾|不为)[^。]*?[我想]/i, 'victim_stance', 0.6],
    [/我为你做了这么多[^。]*?你却/i, 'victim_stance', 0.6],
    [/别人都能[^。]*?(你就不能|你为什么不行)/i, 'comparison_shame', 0.5],
    [/你看看(人家|别人|他|她)/i, 'comparison_shame', 0.5],
    [/连[^。]*?都能[^。]*?你却/i, 'comparison_shame', 0.5],
  ],
  en: [
    [/if you don'?t[^.]*?(regret|let (?:me|us) down|disappoint)/i, 'guilt_induction', 0.5],
    [/you('re| are) letting me down/i, 'guilt_induction', 0.5],
    [/you('re| are) (?:so )?selfish/i, 'guilt_induction', 0.5],
    [/act now[^.]*?(or|before it['a]?s)/i, 'fear_marketing', 0.5],
    [/can'?t afford (?:not|to miss|to lose)/i, 'fear_marketing', 0.5],
    [/limited (?:time|offer|supply|edition)/i, 'fear_marketing', 0.5],
    [/last chance/i, 'fear_marketing', 0.5],
    [/100%[^.]*?guaranteed/i, 'overpromising', 0.4],
    [/no[ .-]?risk/i, 'overpromising', 0.4],
    [/money.back guaranteed|guaranteed results|zero risk/i, 'overpromising', 0.4],
    [/you don'?t care about me/i, 'victim_stance', 0.6],
    [/you never (consider|think about|listen to|care about) me/i, 'victim_stance', 0.6],
    [/after (?:all )?i'?ve done for you/i, 'victim_stance', 0.6],
    [/everyone else can[^.]*?why can'?t you/i, 'comparison_shame', 0.5],
    [/why can'?t you be more like/i, 'comparison_shame', 0.5],
    [/everyone else[^.]*?(manages|handles|does) it/i, 'comparison_shame', 0.5],
  ],
};

function checkEmotionalManipulation(text) {
  if (!text || typeof text !== 'string') return { count: 0, manipulations: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? EM_MANIPULATION_PATTERNS.zh : EM_MANIPULATION_PATTERNS.en;
  const manipulations = [];
  for (const [pat, type, severity] of patterns) {
    const m = text.match(pat);
    if (m) {
      manipulations.push({ type, severity, count: m.length });
    }
  }
  const count = manipulations.length;
  const score = Math.min(1, manipulations.reduce((s, m) => s + m.severity * m.count, 0));
  return { count, manipulations, score };
}

const PRESUPPOSITION_PATTERNS = {
  zh: [
    [/你(是否)?已经[^，。？?]*|怎么还[^，。？?]*|还在[^，。？?]*|仍然[^，。？?]*/, 'loaded_behavior'],
    [/(你)?难道你?不觉得|难道不是[^，。？?]*|难道你没/, 'presupposed_agreement'],
    [/你终于[^，。？?]*|你竟然[^，。？?]*|你怎么能[^，。？?]*/, 'presupposed_wrong_behavior'],
  ],
  en: [
    [/\bWhy do you always[^.]*\b|\bWhy don't you ever[^.]*\b|\bHave you stopped[^.]*\b|\bWhen did you start[^.]*\b/i, 'presupposed_pattern'],
    [/\bDon't you think[^.]*\b|\bIsn't it true[^.]*\b|\bWouldn't you agree[^.]*\b/i, 'presupposed_agreement'],
  ],
};

function checkFallacies(text) {
  if (!text || typeof text !== 'string') return { count: 0, fallacies: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? FALLACY_PATTERNS.zh : FALLACY_PATTERNS.en;
  const fallacies = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) {
      fallacies.push({ type, count: m.length, severity: FALLACY_SEVERITY[type] || 0.3 });
    }
  }
  const count = fallacies.length;
  return { count, fallacies, score: Math.min(1, fallacies.reduce((s, f) => s + f.severity * f.count, 0)) };
}

// ─── 信心校准检测（确定性 mismatch）─────────────────────────────────
function checkConfidenceCalibration(text) {
  if (!text || typeof text !== 'string') return { issues: [], count: 0, score: 0 };
  const issues = [];
  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  if (hasChinese) {
    const certaintyCount = (text.match(/一定|绝对|肯定|毫无疑问|毋庸置疑|必然/i) || []).length;
    const hedgeCount = (text.match(/可能|也许|或许|大概|不一定|未必/i) || []).length;
    if (certaintyCount > 0 && hedgeCount > 0) {
      issues.push({ type: 'confidence_mismatch', detail: `肯定(${certaintyCount})与不确定(${hedgeCount})并存` });
    }
    const strongClaims = (text.match(/永远[^。]*?不可能|绝对[^。]*?是|百分百[^。]*?确定/i) || []).length;
    if (strongClaims > 0) issues.push({ type: 'overconfidence', detail: `过度自信(${strongClaims})`, severity: 0.3 });
  } else {
    const certaintyCount = (text.match(/\b(always|never|undoubtedly|absolutely|certainly|without (any )?doubt|definitely|unquestionably)\b/i) || []).length;
    const hedgeCount = (text.match(/\b(maybe|perhaps|possibly|maybe not|might not|could be|not necessarily)\b/i) || []).length;
    if (certaintyCount > 0 && hedgeCount > 0) {
      issues.push({ type: 'confidence_mismatch', detail: `certain(${certaintyCount}) vs uncertain(${hedgeCount}) mixed` });
    }
    const strongClaims = (text.match(/\b(always|never)\b[^.]*?\b(everyone|nobody|everything|nothing)\b/i) || []).length;
    if (strongClaims > 0) issues.push({ type: 'overconfidence', detail: `overconfident absolute(${strongClaims})` });
  }

  return { issues, count: issues.length, score: Math.min(1, issues.length * 0.35) };
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

function checkSycophancy(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (/[\u4e00-\u9fff]/.test(text)) return _checkSignals(text, ZH_SIGNALS);
  if (/[a-zA-Z]{4,}/.test(text)) return _checkSignals(text, EN_SIGNALS);
  return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
}

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

// ─── 预设陷阱检测（loaded/presupposition questions）───────────────
function checkPresupposition(text) {
  if (!text || typeof text !== 'string') return { count: 0, presuppositions: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? PRESUPPOSITION_PATTERNS.zh : PRESUPPOSITION_PATTERNS.en;
  const presuppositions = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) {
      presuppositions.push({ type, matched: m[0].slice(0, 40), count: m.length });
    }
  }
  const count = presuppositions.length;
  return { count, presuppositions, score: Math.min(1, count * 0.3) };
}

// ─── 双重束缚检测（double bind）────────────────────────────────────
const DOUBLE_BIND_PATTERNS = {
  zh: [
    [/如果你[^。？?]{1,80}说明你[^。？?]{1,80}如果你不[^。？?]{1,80}说明你/i, 'bidirectional_negation'],
    [/你要是有心[^。？?]{1,80}你要是没心/i, 'contradictory_demand'],
    [/你怎么做都是错|怎么做都不对/i, 'no_win'],
    [/怎么选都是错|怎么选都不对/i, 'no_choice'],
  ],
  en: [
    [/if you really cared[^.]*?you would[^.]*?if you don'?t[^.]*?it means/i, 'bidirectional_negation'],
    [/you're damned if you do[^.]*?and damned if you don'?t/i, 'no_win'],
    [/no matter what you do[^.]*?you('re| are) wrong/i, 'no_win'],
    [/either you're with me[^.]*?(or|and)[^.]*?against me/i, 'false_dilemma_strict'],
  ],
};

const DOUBLE_BIND_SEVERITY = {
  bidirectional_negation: 0.6, contradictory_demand: 0.6,
  no_win: 0.5, no_choice: 0.5, false_dilemma_strict: 0.4,
};

function checkDoubleBind(text) {
  if (!text || typeof text !== 'string') return { count: 0, binds: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? DOUBLE_BIND_PATTERNS.zh : DOUBLE_BIND_PATTERNS.en;
  const binds = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) {
      binds.push({ pattern: type, severity: DOUBLE_BIND_SEVERITY[type] || 0.4 });
    }
  }
  const count = binds.length;
  return { count, binds, score: Math.min(1, binds.reduce((s, b) => s + b.severity, 0)) };
}

// ─── 综合辨别（9维度） ────────────────────────────────────────────
function discriminate(text, evidence = []) {
  const ev = checkEvidence(text, evidence);
  const sy = checkSycophancy(text);
  const ct = checkContradiction(text);
  const vg = checkVagueness(text);
  const fl = checkFallacies(text);
  const cc = checkConfidenceCalibration(text);
  const pp = checkPresupposition(text);
  const em = checkEmotionalManipulation(text);
  const db = checkDoubleBind(text);

  const avg = (ev.score + (1 - sy.score) + (1 - ct.score) + (1 - vg.score) + (1 - fl.score) + (1 - cc.score) + (1 - pp.score) + (1 - em.score) + (1 - db.score)) / 9;
  const overallScore = Math.round(avg * 100) / 100;
  const verdict = overallScore >= 0.6 ? '可信' : overallScore >= 0.4 ? '需验证' : '不可信';

  return {
    verdict,
    overallScore,
    dimensions: {
      evidence: ev,
      sycophancy: sy,
      contradiction: ct,
      vagueness: vg,
      fallacies: fl,
      confidence: cc,
      presupposition: pp,
      emotional_manipulation: em,
      double_bind: db,
    },
    summary: [
      sy.totalHits > 0 ? `${sy.totalHits} 个 sycophancy 信号` : '',
      ct.count > 0 ? `${ct.count} 处矛盾` : '',
      vg.count > 0 ? `${vg.count} 处模糊表述` : '',
      fl.count > 0 ? `${fl.count} 个逻辑谬误` : '',
      cc.count > 0 ? `${cc.count} 处信心偏差` : '',
      pp.count > 0 ? `${pp.count} 个预设陷阱` : '',
      em.count > 0 ? `${em.count} 处情绪操纵` : '',
      db.count > 0 ? `${db.count} 个双重束缚` : '',
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
  checkSycophancy,
  checkEvidence,
  checkContradiction,
  checkVagueness,
  checkFallacies,
  checkConfidenceCalibration,
  checkPresupposition,
  checkEmotionalManipulation,
  checkDoubleBind,
  discriminate,
  createEngine,
  version: require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim(),
};
