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
  tech_implicit_sycophancy: [
    /\bthat('s| is) actually a really good point\b/i,
    /\bi never thought of it that way\b/i,
    /\byou raise a (valid|fair|legitimate) concern\b/i,
    /\bthat('s| is) a (smart|clever|elegant) (approach|solution|workaround)\b/i,
    /\bi hadn'?t considered that (angle|perspective|angle)\b/i,
  ],
  academic_compliment: [
    /\bthis is a fascinating (question|topic|area)\b/i,
    /\bthat('s| is) a really thoughtful (observation|comment|question)\b/i,
    /\bi appreciate your (nuanced|thoughtful|careful) (perspective|analysis|framing)\b/i,
    /\byou('ve| have) (raised|posed|asked) an important (question|point|issue)\b/i,
  ],
  over_validation: [
    /\bi think you'?ve perfectly captured the essence\b/i,
    /\byou('ve| have) articulated this extremely well\b/i,
    /\bthis is exactly the right (framing|approach|way to think about it)\b/i,
  ],
};

const ZH_SIGNALS = {
  concession_eager: [
    /你说得对/i, /我同意你的观点/i, /你完全正确/i, /你说得有道理/i, /我赞同你的看法/i, /我完全同意/i,
    /您说得太对了/i,                    // 高语境尊称+强烈同意
    /完全听您的/i,                       // 权威服从式同意
    /您高见/i,                           // 古典敬语式奉承
    /听您的准没错/i,                       // 无条件信任式奉承
    /您说得太有道理了/i,                   // 职场高频奉承
    /领导说得对/i,                          // 职场谄媚——向上服从
    /老师说得对/i,                          // 饭圈/知识付费场域尊称同意
    /大大说得对/i,                          // 饭圈尊称同意
    /还得是您/i,                            // 文化回归式——"还是您行"
    /不愧是您/i,                            // 文化回归式——"果然还是您"
    /还是您懂/i,                            // 文化回归式——"您最懂"
  ],
  flip_no_reason: [
    /我重新考虑/i, /我之前的说法不对/i, /我改变主意了/i, /我想想你说得对/i,
    /您说得有道理，是我考虑不周/i,       // 捧高对方+自我贬低式转向
    /领导高见/i,                           // 职场谄媚式转向——虚捧撤退
    /受教了/i,                             // 职场/文化式——单方面宣布被教育
    /受益匪浅/i,                           // 职场/文化式——单方面宣布有收获
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
    /绝了/i,                               // 互联网流行——极端评价式吹捧
    /封神/i,                               // 互联网流行——造神式吹捧
    /天花板/i,                             // 互联网流行——上限级吹捧
    /YYDS/i,                               // 互联网流行——永远的神(字母缩写)
    /天花板级/i,                            // 互联网流行——等级上限式吹捧
    /神仙说话/i,                            // 饭圈——神明化奉承
    /哥哥辛苦了/i,                          // 饭圈——亲昵+慰劳式捧高
  ],
  self_deprecation: [
    /我的回答可能不够好/i, /我可能没有表达清楚/i, /我的能力有限/i,
    /我这水平哪敢质疑您/i,               // 极端自贬+地位服从
    /我只是班门弄斧/i,                    // 古典自谦成语
    /在您面前我不敢妄加评论/i,           // 地位回避式自我矮化
    /我的见识太浅薄了/i,                  // 捧高对方同时自贬
    /在您面前我只是个小学生/i,             // 极度自贬式地位降级
    /我这水平差的太远了/i,                 // 差距承认式自贬
  ],
  false_agreement: [
    /你说得对，但是/i, /我同意，不过/i, /你说得有道理，不过/i,
    /您说的是，不过/i,                   // 尊称+回避式同意
    /您的观点很有启发，只是/i,           // 高语境假同意+转折
    /我原则上同意，但是/i,               // 回避式同意（原则性同意+实际否定）
    /你说得对，但是我也有一个想法/i,     // 赞同后立即转移焦点
    /您说得对，不过我有个小建议/i,        // 职场假同意+包装式否定
    /老师说得对，但我觉得/i,              // 饭圈尊称假同意+保留意见
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

  // === 以下由 agent 扩充 (+12 对矛盾模式，覆盖8种类型) ===

  // 1. 数据↔结论：调查报告显示X但结论说Y
  { positive: /(调查|报告|数据|统计|证据)[^。]*?(显示|表明|证明|指出)[^。]*?但[^。]*?结论/g, negative: /结论[^。]*?(是|为)[^。]*?(相反|不同|不对|错误|并非|不是|恰恰)/ },

  // 2. 情感↔行为：爱你在心口难开/嘴上说不要身体很诚实
  { positive: /(喜欢|爱|在乎|想念|关心)[^。]*?但[^。]*?(不[说表达承认]|忍|藏|憋|压抑)/g, negative: /(不[说表达承认]|忍|藏|憋|压抑)/ },

  // 3. 原则↔实践：嘴上说A实际做B
  { positive: /(原则|道理上|理论上|说好|口头)[^。]*?但[^。]*?(实际|行动|做|实践|现实|行为)/g, negative: /(实际|行动|做|实践|现实|行为)[^。]*?(不同|相反|不[一践做同]|没有|做不到|是另)/ },

  // 4. 理论↔应用：理论上成立实践中不行
  { positive: /(理论上|理论说|按道理|按理)[^。]*?(成立|可行|正确|对|没问题|合理)[^。]*?但[^。]*?(实践|现实|实际|应用|实操)/g, negative: /(实践|现实|实际|应用|实操)[^。]*?(不[行通好成立]|失败|无[法效用]|无效|痛[点苦]|停|搁置|推翻)/ },

  // 5. 长期↔短期：长期看有利短期看有害
  { positive: /(长期|长远|长久|远期)[^。]*?(有利|好|收益|价值|益处|有益)[^。]*?但[^。]*?(短期|眼前|当下|目前|近期)/g, negative: /(短期|眼前|当下|目前|近期)[^。]*?(有害|不好|风险|损失|痛苦|困难|不利|代价|吃亏|受损|煎熬)/ },

  // 6. 群体↔个体：整体数据好但个案不理想
  { positive: /(整体|总体|群体|普遍|大多数|平均|宏观)[^。]*?(好|健康|乐观|理想|上涨|上升|繁荣)[^。]*?但[^。]*?(个体|个人|个案|微观|底层|少数)/g, negative: /(个体|个人|个案|微观|底层|少数)[^。]*?(不好|差|不理想|悲惨|痛苦|低|失望|失败|糟糕|落单)/ },

  // 7. 定量↔定性：数据证明但感受相反
  { positive: /(数据|数字|统计|指标|分数|评分|定量)[^。]*?(证明|显示|表明|上升|好|高|增长)[^。]*?但[^。]*?(感受|感觉|体验|觉得|认为|评价|满意|主观)/g, negative: /(感受|感觉|体验|觉得|满意|评价)[^。]*?(不好|差|低|糟糕|失望|差劲|不满意|痛苦|反差|不如|低于|未达)/ },

  // 8. 专业↔常识：专家说A但大家都知道B
  { positive: /(专家|权威|专业者|科学家|研究)[^。]*?(认为|表示|说|指出|建议|声称)[^。]*?但[^。]*?(常识|大家|普通人|老百姓)/g, negative: /(常识|大家|普通人|老百姓)[^。]*?(不同|相反|不[是样同感]|告诉|知道|觉得|认为)/ },

  // 9. 言行不一：建议别人做自己却做不到
  { positive: /(建议|提倡|呼吁|号召|强调|倡导)[^。]*?(大家|每个人|我们|你们)[^。]*?却[^。]*?自己/g, negative: /自己[^。]*?(不做|不执行|不遵守|双标|例外|置身事外)/ },

  // 10. 宣传↔事实：说的和实际情况不符
  { positive: /(宣传|号称|自称|标榜|声称)[^。]*?(如何|多么|非常|特别|极其)[^。]*?但[^。]*?(实际|事实|真实|真相)/g, negative: /(实际|事实|真实|真相)[^。]*?(并非|不是|相反|不一样|差距|不符|打折)/ },

  // 11. 意图↔行动：想要A却做B
  { positive: /(想|想要|打算|计划|希望)[^。]*?但[^。]*?(却|反而|还是|依然|仍然)/g, negative: /(却|反而|还是|依然|仍然)[^。]*?(不做|没[做有去]|放弃|停止|退缩|拖延)/ },

  // 12. English: data/conclusion contradiction
  { positive: /\b(data|survey|report|study|research|statistics)\b[^.]*?(show|indicate|demonstrate|prove|reveal|suggest)[^.]*?\bbut\b[^.]*?(conclusion|result|finding)/gi, negative: /\b(conclusion|result|finding)\b[^.]*?(contradict|opposite|different|wrong|incorrect|inconsistent|contrary)/gi },
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
    // === 以下由 agent 扩充 (+12+16) ===
    /据分析/i, /数据表明/i, /大概率/i, /相关人士/i, /某位不愿透露姓名/i,
    /市场普遍认为/i, /行业分析认为/i, /普遍认为/i, /有观点认为/i, /不可否认/i,
    /据统计/i, /据测算/i,
    // === 统计模糊 ===
    /数据显示/i, /研究表明/i, /调查发现/i, /报告显示/i,
    // === 时间模糊 ===
    /近期/i, /不久前/i, /最近一段时间/i, /有段时间/i, /长期以来/i, /近日/i,
    // === 范围模糊 ===
    /部分人/i, /有些人/i, /某些方面/i, /在一定程度上/i, /某种意义/i, /在某层面上/i, /在某种程度上/i,
    // === 程度模糊 ===
    /还算可以/i, /相对而言/i, /差不多/i, /几乎都/i,
    /相当一部分/i, /比较常见/i, /还算不错/i,
  ],
  en: [/\bsome people say\b/i, /\bits is said\b/i, /\bi'?m not sure\b/i, /\bmaybe perhaps\b/i, /\bsort of\b/i, /\bkind of\b/i, /\bbasically\b/i, /\bessentially\b/i, /\breportedly\b/i, /\ballegedly\b/i, /\bpurportedly\b/i, /\brelatively\b/i, /\bquite\b/i, /\brather\b/i, /\bto some extent\b/i, /\bin a way\b/i,
    // === 以下由 agent 扩充 (+12+13) ===
    /\bstudies show\b/i, /\bmany people\b/i, /\bresearch indicates\b/i,
    /\bit appears that\b/i, /\bthe reality is\b/i, /\bit seems that\b/i,
    /\bit could be argued\b/i, /\bmore often than not\b/i,
    /\bit is widely believed\b/i, /\bin many cases\b/i,
    /\bit is generally accepted\b/i, /\bin most cases\b/i,
    // === 统计模糊 ===
    /\bstatistics show\b/i, /\bdata suggests?\b/i, /\bresearch finds?\b/i, /\bpolls indicate\b/i,
    /\bstudies have shown\b/i, /\bevidence suggests?\b/i,
    // === 时间模糊 ===
    /\blately\b/i, /\bin recent times\b/i, /\bfor some time\b/i,
    // === 范围模糊 ===
    /\bto a certain extent\b/i, /\bto some degree\b/i, /\bin a sense\b/i,
    /\bin some respects\b/i, /\bup to a point\b/i, /\bmore or less\b/i,
    // === 程度模糊 ===
    /\bpretty much\b/i, /\balmost\b/i, /\bnearly\b/i,
    /\bquite a few\b/i, /\brather than\b(?!\snot)/i,
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
    // 轻率概括 — 几个案例就下结论
    [/几个[^。]*?(案例|例子|个例)[^。]*?(就说明|就代表|足以证明)/i, 'hasty_generalization'],
    [/我认识的[^。]*?(都|全是)[^。]*?所以[^。]*?都/i, 'hasty_generalization'],
    [/[身边周围].*?都[^。]*?说明[^。]*?(都|全)/i, 'hasty_generalization'],
    [/[(一二两三个)两三个]个[^。]*?(例子|案例)[^。]*?(就能|足以|说明)/i, 'hasty_generalization'],
    // 虚假二分补充 — 只有两个选项没有中间
    [/不是[^。]*?就是[^。]*?(没有中间道路|非此即彼)/i, 'false_binary'],
    [/只有[^。]*?或[^。]*?没有其他(选择|可能|选项)/i, 'false_binary'],
    // 诉诸怜悯 — 因为可怜所以正确
    [/你忍心[^。]*?(吗|么)|难道你就不为[^。]*?想想/i, 'appeal_to_pity'],
    [/[可怜辛苦好不容易][^。]*?(所以|因此|难道不应该)/i, 'appeal_to_pity'],
    [/我这么[^。]*?(辛苦|努力|不容易)[^。]*?你还好意思/i, 'appeal_to_pity'],
    // 基因谬误 — 因为来源有问题所以无效
    [/[这那]个[^。]*?(说法|观点|理论|数据)[^。]*?来自[^。]*?(所以|因此|根本不可信|没用|能信吗)/i, 'genetic_fallacy'],
    [/[^。]*?不就是[^。]*?出身[^。]*?能有什么[^。]*(价值|水平|见识)/i, 'genetic_fallacy'],
    [/[^。]*?是[^。]*?说的[^。]*?(那就|肯定)(不对|没用|不可信|有问题)/i, 'genetic_fallacy'],
    // 滑坡谬误扩展
    [/如果[^。]*?(让步|妥协|退让)[^。]*?(最终|迟早|早晚)[^。]*?(无可挽回|不可收拾|毁灭|灾难)/i, 'slippery_slope'],
    [/今天[^。]*?明天[^。]*?后天[^。]*?(就|就会)[^。]*(不可收拾|无法控制|全完了)/i, 'slippery_slope'],
    // 完美主义谬误扩展
    [/不能[^。]*?(完全|彻底|100%)[^。]*?还不如[^。]*?(不做|不要|白费)/i, 'perfectionist_fallacy'],
    // 诉诸动机 — 质疑动机来否定论点
    [/你不就是[^。]*?为了[^。]*?(才|所以)[^。]*?说的/i, 'appeal_to_motive'],
    [/说[^。]*?话[^。]*(不就是|还不是|无非是)[^。]*?为了[^。]*?利益/i, 'appeal_to_motive'],
    [/你这么[^。]*?不就是[^。]*?想[^。]*?吗/i, 'appeal_to_motive'],
    // 叙事谬误 — 把好听的故事当证据
    [/[有讲听说]个[^。]*?故事[^。]*?(说明|证明|告诉我们)/i, 'narrative_fallacy'],
    [/我听说过[^。]*?一个[^。]*?事[^。]*?(说明|证明|所以)/i, 'narrative_fallacy'],
    // 确认偏误 — 只找支持自己的证据
    [/早就说了[^。]*?果然[^。]*?(证明|说明|验证|没错)/i, 'confirmation_bias'],
    [/我一直认为[^。]*?事实证明[^。]*?我是对的/i, 'confirmation_bias'],
    [/我早就知道[^。]*?果不其然/i, 'confirmation_bias'],
    // 沉没成本谬误 — 已经投入这么多所以不能停
    [/已经花了[^。]*?(这么多|这么久|这么多钱)[^。]*?(不能|怎能|怎么)能?(放弃|停止|回头|白费)/i, 'sunk_cost_fallacy'],
    [/投入了[^。]*?(这么多|这么久|太多)[^。]*?(现在放弃|半途而废)[^。]*?太可惜/i, 'sunk_cost_fallacy'],
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
    // 诉诸自然 — natural is always better
    [/natural[^.]*?(is|are)[^.]*?(better|healthier|safer|purer)/i, 'appeal_to_nature'],
    [/\b(chemical|synthetic|artificial)\b[^.]*?\bbad\b/i, 'appeal_to_nature'],
    [/it['a]?s natural[^.]*?so it['a]?s (good|right|better)/i, 'appeal_to_nature'],
    // 虚假因果 / 事后谬误 — after this therefore because of this
    [/after[^.]*?[, ]+[^.]*?(so|therefore|because of)/i, 'false_cause'],
    [/since [^.]*?happened[^.]*?now[^.]*?(happened|occurred|resulted)/i, 'false_cause'],
    [/correlation (proves|means|implies) causation/i, 'false_cause'],
    [/occurred (after|following)[^.]*?(so|therefore|thus|hence)[^.]*?caused/i, 'false_cause'],
    // 诉诸传统 — we've always done it this way
    [/we('ve| have) (always|never|traditionally) (done|used|practiced)[^.]*?(so|therefore)/i, 'appeal_to_tradition'],
    [/it('s| is| has) always been (done|that way|this way)/i, 'appeal_to_tradition'],
    [/\btradition[^.]*?should (continue|be preserved|not change)/i, 'appeal_to_tradition'],
    // 诉诸无知 — can't prove it doesn't exist
    [/can'?t (prove|disprove)[^.]*?(doesn'?t|don'?t) exist/i, 'appeal_to_ignorance'],
    [/(cannot|can not) (prove|disprove)[^.]*?(does not|doesn'?t|do not|don'?t) exist/i, 'appeal_to_ignorance'],
    [/no (one has|evidence) (ever |)(proven|shown)[^.]*?(doesn'?t|does not) exist/i, 'appeal_to_ignorance'],
    [/you (can'?t|cannot) (explain|prove)[^.]*?so[^.]*?(must be|is true|exists)/i, 'appeal_to_ignorance'],
    // 完美主义谬误 — if it's not perfect it's worthless
    [/if (we|it) (can'?t|cannot)[^.]*?(perfectly|completely|fully)[^.]*?(then|it'?s)[^.]*?(worthless|pointless|useless)/i, 'perfectionist_fallacy'],
    [/\bperfect[^.]*?is the enemy of\b/i, 'perfectionist_fallacy'],
    [/either (do it|fix it|solve it)[^.]*?(perfectly|100%|completely)[^.]*?or (don'?t|not at all)/i, 'perfectionist_fallacy'],
    // 举证责任倒置 — prove it doesn't exist or I'm right
    [/prove[^.]*?(doesn'?t|isn'?t|don'?t|not)[^.]*?or[^.]*?(i'?m|i am) (right|correct)/i, 'burden_of_proof_reversal'],
    [/you (can'?t|cannot) (prove|show)[^.]*?wrong[^.]*?(so|therefore) (i'?m|i am) (right|correct)/i, 'burden_of_proof_reversal'],
    [/until you (prove|disprove)[^.]*?(my|the)[^.]*?is (true|correct|valid)/i, 'burden_of_proof_reversal'],
    // 滑坡谬误扩展 — 更多的滑坡模式
    [/if[^.]*?then[^.]*?(eventually|inevitably|sooner or later)[^.]*?(disaster|catastrophe|collapse|chaos)/i, 'slippery_slope'],
    [/one (small|minor|simple) (step|change|compromise)[^.]*?and[^.]*?will[^.]*?(end up|lead to|result in)/i, 'slippery_slope'],
    [/the (slippery|thin) (slope|edge|line)[^.]*?(starts|begins) with/i, 'slippery_slope'],
    // 没有真正的苏格兰人 — no true X would do Y
    [/no (true|real|genuine)[^.]*?would (ever|possibly|never)[^.]*?(do|say|believe|support)/i, 'no_true_scotsman'],
    [/a (true|real)[^.]*?would never[^.]*?that['a]?s not (a|an)[^.]*?(true|real)/i, 'no_true_scotsman'],
    [/that['a]?s not what a (real|true)[^.]*?(does|would do|believes)/i, 'no_true_scotsman'],
    // 折中谬误 — the truth must be between both extremes
    [/the (truth|answer|solution) (lies|is|must be) somewhere (in between|between the extremes)/i, 'middle_ground'],
    [/both (sides|extremes|positions) (have |)(a |)point[^.]*?(truth|answer) is in the middle/i, 'middle_ground'],
    [/the (moderate|middle) position is always the (right|correct|most reasonable)/i, 'middle_ground'],
    // 你也一样 — you do it too so it's okay
    [/you (do|did|have) it too[^.]*?(so|therefore)[^.]*?(ok|fine|acceptable|can(not|'?t) complain)/i, 'tu_quoque'],
    [/what about[^.]*?(you|your)[^.]*?also (do|did|have)/i, 'tu_quoque'],
    [/you('re| are) (no better|just as|equally) (guilty|bad|wrong)[^.]*?so[^.]*?(can(not|'?t) criticize|doesn'?t matter)/i, 'tu_quoque'],
    [/you('re| are) no better than[^.]*?so[^.]*?(can(not|'?t) criticize|doesn'?t matter|okay)/i, 'tu_quoque'],
    [/if you (do it|did it)[^.]*?then i (can|should|get to) (too|as well)/i, 'tu_quoque'],
    // 德州神枪手谬误 — drawing the target around where the arrow landed
    [/if we (look at|focus on|zoom in on|consider only)[^.]*?we (can see|find|conclude)[^.]*?pattern/i, 'texas_sharpshooter'],
    [/the data (clearly|obviously|undeniably) shows[^.]*?if you (ignore|exclude|set aside)[^.]*?/i, 'texas_sharpshooter'],
    [/cherry.?pick(?:ing|ed|s)[^.]*?(?:data|evidence|examples|facts)[^.]*?to (prove|support|show)/i, 'texas_sharpshooter'],
    // 赌徒谬误 — after a streak the opposite is "due"
    [/it('s| has) been (heads|tails|red|black|winning|losing)[^.]*?(\d+|many|several) times? in a row[^.]*?(so|therefore|must)[^.]*?(tails|heads|black|red|lose|win) next/i, 'gamblers_fallacy'],
    [/it('s| is) (due|bound|certain) to (happen|come up|change)[^.]*?after[^.]*?streak/i, 'gamblers_fallacy'],
    [/we('ve| have) had[^.]*?(\d+|too many|so many)[^.]*?(good|lucky|positive|successful)[^.]*?so[^.]*?(bad|unlucky|negative|failure) is coming/i, 'gamblers_fallacy'],
    // 沉没成本 — already invested too much to quit
    [/we('ve| have) (already|invested|spent|put)[^.]*?(too much|so much|this much)[^.]*?(to (quit|stop|walk away|give up)|can(\'t| not) (stop|turn back|abandon))/i, 'sunk_cost_fallacy'],
    [/after (all|everything) we('ve| have) (put|invested|done|sacrificed)[^.]*?we can(\'t| not) (quit|stop|give up now)/i, 'sunk_cost_fallacy'],
    [/can(\'t| not) (stop|quit|abandon|give up)[^.]*?(years|months|decades|so much|too much) invested/i, 'sunk_cost_fallacy'],
    // 诉诸概率 — it could happen so it will happen
    [/it (could|could potentially|might) (happen|occur|be true)[^.]*?(so|therefore|which means) it (will|must|definitely)(\b| )/i, 'appeal_to_probability'],
    [/just because it('s| is) possible[^.]*?(doesn'?t|does not) mean[^.]*?probable/i, 'appeal_to_probability'],
    [/it('s| is) (entirely|completely|perfectly) possible[^.]*?(so|therefore|thus)[^.]*?we should (assume|believe|plan for)/i, 'appeal_to_probability'],
    // 诉诸嘲讽 — mockery instead of refutation
    [/that('s| is) (ridiculous|absurd|laughable|preposterous)[^.]*?so[^.]*?clearly wrong/i, 'appeal_to_ridicule'],
    [/you can(\'t| not) be serious[^.]*?that('s| is) (the most|a) (dumb|stupid|silly) thing/i, 'appeal_to_ridicule'],
    [/oh (please|come on|brother)[^.]*?that('s| is) (absurd|ridiculous|a joke)/i, 'appeal_to_ridicule'],
    // 诉诸恶意 — implying bad intentions to dismiss an argument
    [/you (only|just|merely) (want|wish|hope)[^.]*?(because|so) (you|your) (hate|dislike|oppose|want to destroy)/i, 'appeal_to_spite'],
    [/the (only|real|true) reason you[^.]*?is (because|that) you (hate|want to|are trying to)[^.]*?(destroy|harm|ruin|hurt)/i, 'appeal_to_spite'],
    [/you (clearly|obviously|just) want[^.]*?to (see|watch)[^.]*?(fail|burn|fall apart|suffer)/i, 'appeal_to_spite'],
    // 组合谬误 — each part has X, so the whole has X
    [/every (part|component|piece|member|section) (is|has|uses)[^.]*?(so|therefore|thus) the (whole|system|group|organization) (is|has|uses)/i, 'composition_fallacy'],
    [/each individual[^.]*?is[^.]*?(so|therefore) the (group|team|collective|community)[^.]*?is also/i, 'composition_fallacy'],
    [/all the (parts|components|pieces|ingredients) are[^.]*?(so|therefore|which means) the (whole|result|product) must be/i, 'composition_fallacy'],
    // 分解谬误 — the whole has X, so every part has X
    [/the (whole|group|organization|team|system) (is|has|uses)[^.]*?(so|therefore|thus) every (part|member|component) (is|has|uses)/i, 'division_fallacy'],
    [/since the (group|class|category|species) (is|has)[^.]*?it follows that each (individual|member|instance) (is|has)/i, 'division_fallacy'],
    [/if the (group|team|crowd|country) (is|are)[^.]*?then (each|every|all) (member|individual|person) must (be|have)/i, 'division_fallacy'],
    // 心理学家谬误 — assuming others think/feel like you do
    [/everyone (thinks|feels|knows|believes|sees)[^.]*?(the same way|like I do|as I do|obviously)/i, 'psychologists_fallacy'],
    [/it('s| is) (obvious|clear|apparent) to anyone[^.]*?that[^.]*?so anyone who disagrees[^.]*?(must|can(\'t| not)[^.]*?see)/i, 'psychologists_fallacy'],
    [/i (can(\'t| not)? imagine|find it hard to see)[^.]*?how anyone could[^.]*?(possibly|ever)[^.]*?(think|feel|believe) otherwise/i, 'psychologists_fallacy'],
    // 检察官谬误 — confusing conditional probabilities
    [/there('s| is) only a (one|small|tiny|minuscule|[0-9.]+%) chance[^.]*?that (the|a) (innocent|random)[^.]*?(would|could)[^.]*?(so|therefore|which means) they must be guilty/i, 'prosecutors_fallacy'],
    [/the (probability|chance|odds) of (this|that) happening (by chance|randomly|coincidence) is[^.]*?(tiny|minuscule|one in|so low)[^.]*?(so|therefore|proves|means)[^.]*?(guilt|guilty|fault|responsibility)/i, 'prosecutors_fallacy'],
    [/if the test says[^.]*?(\d+:?\d*%|\d+ out of \d+)[^.]*?chance of being wrong[^.]*?(so|therefore|which means) they must be (right|correct|guilty)/i, 'prosecutors_fallacy'],
    // 基础概率谬误 — ignoring base rates
    [/despite the (fact|evidence) that (most|the vast majority)[^.]*?(are|do|have)[^.]*?this one[^.]*?must be[^.]*?(different|special|an exception)/i, 'base_rate_fallacy'],
    [/(\d+%|most|the majority)[^.]*?of[^.]*?cases[^.]*?but[^.]*?this (case|instance|situation) is (clearly|obviously|definitely) different/i, 'base_rate_fallacy'],
    [/the (rareness|uniqueness|rarity) of[^.]*?means we can (ignore|disregard|overlook) the (general|overall|base) rate/i, 'base_rate_fallacy'],
    // 歧义谬误 — ambiguous terms leading to false conclusions
    [/the (word|term|concept)[^.]*?has (multiple|different|two) meanings?[^.]*?(so|and|but)[^.]*?therefore[^.]*?(proves|shows|means)/i, 'ambiguity_fallacy'],
    [/by[^.]*?we mean[^.]*?but[^.]*?you('re| are) using it to mean[^.]*?so your (argument|conclusion) (is wrong|doesn'?t follow|invalid)/i, 'ambiguity_fallacy'],
    [/if we (equivocate|change the meaning of)[^.]*?then[^.]*?(anything|everything)[^.]*?can be (proven|shown|demonstrated)/i, 'ambiguity_fallacy'],
  ],
};

const FALLACY_SEVERITY = {
  circular_reasoning: 0.6, false_dilemma: 0.4, appeal_to_authority: 0.3,
  ad_hominem: 0.5, straw_man: 0.5, slippery_slope: 0.4, appeal_to_emotion: 0.3,
  bandwagon: 0.3, appeal_to_obviousness: 0.2, appeal_to_common_sense: 0.2,
  appeal_to_nature: 0.3, false_cause: 0.4, appeal_to_tradition: 0.2,
  appeal_to_ignorance: 0.4, perfect_solution: 0.3, false_dilemma_extended: 0.4,
  burden_of_proof: 0.4, perfectionist_fallacy: 0.3, burden_of_proof_reversal: 0.4,
  no_true_scotsman: 0.4, middle_ground: 0.3, tu_quoque: 0.3,
  hasty_generalization: 0.4, false_binary: 0.4, appeal_to_pity: 0.4,
  genetic_fallacy: 0.3, appeal_to_motive: 0.4, narrative_fallacy: 0.3,
  confirmation_bias: 0.4, sunk_cost_fallacy: 0.4,
  texas_sharpshooter: 0.4, gamblers_fallacy: 0.3, appeal_to_probability: 0.3,
  appeal_to_ridicule: 0.3, appeal_to_spite: 0.4, composition_fallacy: 0.3,
  division_fallacy: 0.3, psychologists_fallacy: 0.4, prosecutors_fallacy: 0.5,
  base_rate_fallacy: 0.4, ambiguity_fallacy: 0.3,
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
    [/if you (don'?t|do not)[^.]*?(regret|let (?:me|us) down|disappoint)/i, 'guilt_induction', 0.5],
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

// ─── 情绪操纵检测 ──────────────────────────────────────────────
const EMOTIONAL_MANIPULATION_PATTERNS = {
  zh: [
    /你不[^，。]*?就会[^，。]*?(后悔|错过|损失|失去)/i,
    /如果你不[^，。]*?你一定会[^。]*?(后悔|遗憾)/i,
    /不[^，。]*?就会[^。]*?后悔/i,
    /难道你忍心[^。]*?[吗？]/i,
    /你到底[^。]*?难道你/i,
    /你忍心[^。]*?[吗？]/i,
    /你对得起[^。]*?[吗？]/i,
  ],
  en: [
    /\bif you (don't|do not)[^.]*?you('ll| will)[^.]*?regret\b/i,
    /\byou('ll| will)[^.]*?regret it if\b/i,
    /\bdon't you (care|love|want)[^.]*?\b/i,
    /\bhow could you[^.]*?after\b/i,
    /\bif you really (cared|loved|wanted)[^.]*?you would\b/i,
  ],
};

// 双重束缚检测模式
const DOUBLE_BIND_PATTERNS = {
  zh: [[/如果[^。]*?说明你[^。]*?如果不[^。]*?说明你/i, 'bidirectional_negation'],
       [/你要是有心[^。]*?你要是没心/i, 'contradictory_demand'],
       [/你怎么做都是错|怎么做都不对/i, 'no_win'],
       [/怎么选都是错|怎么选都不对/i, 'no_choice'],
       [/你在乎说明你|不在乎说明你|在乎说明你|不在乎也说明你/i, 'double_damned']],
  en: [[/if you really cared[^.]*?if you don'?t[^.]*?it means/i, 'bidirectional_negation'],
       [/damned if you do and damned if you don'?t/i, 'no_win'],
       [/no matter what you do,? you('re| are) wrong/i, 'no_win'],
       [/either you're (with|for) us or (against|with) them/i, 'false_dilemma_strict']],
};
const DOUBLE_BIND_SEVERITY = { bidirectional_negation: 0.6, contradictory_demand: 0.6, no_win: 0.5, no_choice: 0.5, double_damned: 0.6, false_dilemma_strict: 0.4 };

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

// ─── 知情权剥夺检测（info deprivation）─────────────────────────────
const INFO_DEPRIVATION_PATTERNS = {
  zh: [
    /你不需要知道/i, /你不用了解/i, /别问那么多/i,
    /你不用管[^。]*?为什么/i, /你不用问[^。]*?为什么/i,
    /跟你没关系/i, /跟你无关/i, /你不要管/i,
    /你不用操心/i, /这事你不用管/i,
    /你别管[^。]*?为什么/i,
    /说了你也不懂/i, /你问那么多干嘛/i,
    /问那么多做什么/i,
    /你不必知道/i, /不需要你知道/i,
    /你不用明白/i,
  ],
  en: [
    /\byou don'?t need (?:to )?know\b/i,
    /\byou don'?t need to understand\b/i,
    /\byou wouldn'?t understand\b/i,
    /\b(?:it'?s|it is) too complicated (?:to|for you) (?:explain|understand)\b/i,
    /\bjust trust me on this\b/i,
    /\b(?:don'?t|do not) ask\b/i,
    /\b(?:that'?s|that is) not your concern\b/i,
    /\b(?:it'?s|it is) above your pay grade\b/i,
    /\byou don'?t need to worry about it\b/i,
    /\bleave that to me\b/i,
    /\bi'?ll handle it,? you just focus on\b/i,
    /\b(?:it'?s|it is) not for you to know\b/i,
    /\bnever mind (?:the details|how|why)\b/i,
    /\byou don'?t want to know\b/i,
  ],
};

function checkInfoDeprivation(text) {
  if (!text || typeof text !== 'string') return { count: 0, deprivations: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? INFO_DEPRIVATION_PATTERNS.zh : INFO_DEPRIVATION_PATTERNS.en;
  const deprivations = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      deprivations.push({ pattern: pat.source.slice(0, 30), count: m.length });
    }
  }
  const count = deprivations.length;
  return { count, deprivations, score: Math.min(1, count * 0.35) };
}

// ─── 虚假紧迫感检测（false urgency）────────────────────────────────
const FALSE_URGENCY_PATTERNS = {
  zh: [
    /最后机会/i, /仅此一次/i, /限时优惠/i, /错过等一年/i,
    /倒计时/i, /抢购/i, /秒杀/i, /限时抢购/i,
    /限时特惠/i, /限时折扣/i, /限量发行/i, /限量版/i,
    /手慢无/i, /先到先得/i, /售完即止/i,
    /仅限今天/i, /今天最后一天/i,
    /错过今天[^。]*?(就没|不再|后悔)/i,
    /机不可失[^。]*?(不再|失不再来)/i,
    /时不我待/i, /过期不候/i,
    /优惠即将截止/i, /即将恢复原价/i,
    /最后[0-9]+[个小时天日]/i,
    /不再有此价格/i, /此番错过[^。]*?来年/i,
  ],
  en: [
    /\blimited time (?:only|offer)\b/i,
    /\bact now before it'?s too late\b/i,
    /\bact now[^.]*?(?:before|while|and)\b/i,
    /\blimited (?:supply|stock|availability|edition)\b/i,
    /\bwhile supplies last\b/i,
    /\bexclusive offer ending soon\b/i,
    /\bthis won'?t last\b/i,
    /\blast chance\b/i,
    /\bdon'?t miss (?:out|this opportunity)\b/i,
    /\bhurry[^.]*?before\b/i,
    /\boffer (?:ends|expires) (?:soon|today|in|:)|end (?:s|ing) soon\b/i,
    /\b(?:one|only) time offer\b/i,
    /\bone day only\b/i,
    /\bonce in a lifetime\b/i,
    /\bact fast\b/i,
    /\bclosing soon\b/i,
    /\bgoing fast\b/i,
    /\balmost gone\b/i,
    /\brunning out[^.]*?(?:time|stock|fast)\b/i,
    /\blast[^.]*?(?:chance|call|opportunity)\b/i,
    /\bselling out fast\b/i,
    /\bfinal call\b/i,
    /\b(?:now|today) or never\b/i,
  ],
};

function checkFalseUrgency(text) {
  if (!text || typeof text !== 'string') return { count: 0, urgencies: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? FALSE_URGENCY_PATTERNS.zh : FALSE_URGENCY_PATTERNS.en;
  const urgencies = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      urgencies.push({ pattern: pat.source.slice(0, 30), count: m.length });
    }
  }
  const count = urgencies.length;
  return { count, urgencies, score: Math.min(1, count * 0.3) };
}

// ─── 答案包装检测（empty/vague answer）─────────────────────────────
const EMPTY_ANSWER_PATTERNS = {
  zh: [
    /这个问题很复杂/i,
    /不是一个简单的/i,
    /需要全面考虑/i,
    /需要具体分析/i,
    /不能一概而论/i,
    /因情况而异/i,
    /视情况而定/i,
    /有机会再说/i,
    /到时候再看/i,
    /等通知/i,
    /再说吧/i,
    /我考虑一下/i,
    /研究研究/i,
    /回头再说/i,
    /不是那么简单/i,
    /说来话长/i,
    /你懂的/i,
    /懂得都懂/i,
    /懂的都懂/i,
  ],
  en: [
    /\bit's complicated\b/i,
    /\bit's not that simple\b/i,
    /\bit depends\b/i,
    /\bthere are many factors\b/i,
    /\bto make a long story short\b/i,
    /\bit is what it is\b/i,
    /\bthat's just the way it is\b/i,
    /\bhaving said that\b/i,
    /\bat the end of the day\b/i,
    /\bwhen it's all said and done\b/i,
    /\bit remains to be seen\b/i,
    /\btime will tell\b/i,
    /\bwe'll see\b/i,
    /\bonly time will tell\b/i,
  ],
};

function checkEmptyAnswer(text) {
  if (!text || typeof text !== 'string') return { count: 0, empties: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? EMPTY_ANSWER_PATTERNS.zh : EMPTY_ANSWER_PATTERNS.en;
  const empties = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      empties.push({ pattern: pat.source.slice(0, 25), matched: m[0].slice(0, 30), count: m.length });
    }
  }
  const count = empties.length;
  return { count, empties, score: Math.min(1, count * 0.25) };
}

// ─── 综合辨别（12维度） ────────────────────────────────────────────
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
  const id = checkInfoDeprivation(text);
  const fu = checkFalseUrgency(text);
  const ea = checkEmptyAnswer(text);

  const avg = (ev.score + (1 - sy.score) + (1 - ct.score) + (1 - vg.score) + (1 - fl.score) + (1 - cc.score) + (1 - pp.score) + (1 - em.score) + (1 - db.score) + (1 - id.score) + (1 - fu.score) + (1 - ea.score)) / 12;
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
      info_deprivation: id,
      false_urgency: fu,
      empty_answer: ea,
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
      id.count > 0 ? `${id.count} 处知情权剥夺` : '',
      fu.count > 0 ? `${fu.count} 处虚假紧迫感` : '',
      ea.count > 0 ? `${ea.count} 处答案包装` : '',
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

// ─── 道德基础检测（Moral Foundations Theory — Graham, Haidt, 2011）────────────────
// 基于MFT的5+1基础：关爱/公平/忠诚/权威/圣洁 + 自由
const MORAL_PATTERNS = {
  zh: { care: /保护弱者|帮助他人|避免伤害|同情|同理|怜悯|关爱|照顾|呵护|温柔/i,
         fairness: /公平|公正|平等|正义|歧视|偏见|权利|机会均等|一视同仁|公道/i,
         loyalty: /忠诚|背叛|爱国|团结|集体|民族|奉献|归属|牺牲|荣誉/i,
         authority: /服从|尊重|传统|秩序|权威|等级|领导|规矩|纪律|遵守/i,
         sanctity: /神圣|纯洁|堕落|肮脏|污染|亵渎|自然|贞洁|恶心|腐化|败坏|低级/i,
         liberty: /自由|压迫|控制|解放|独立|自主|奴役|专制|暴政|反抗/i },
  en: { care: /\b(protect|care|harm|hurt|cruel|compassion|empathy|kindness|suffer|gentle)\b/i,
         fairness: /\b(fair|justice|equal|rights|discriminat|prejudice|unfair|cheat|equity)\b/i,
         loyalty: /\b(loyal|betray|patriot|traitor|unite|solidarity|sacrifice|honor|devote)\b/i,
         authority: /\b(authority|respect|obey|tradition|order|disobey|rebel|defy|discipline)\b/i,
         sanctity: /\b(holy|pure|sin|sacred|disgust|pollute|decadent|corrupt|degrade|taint)\b/i,
         liberty: /\b(liberty|freedom|oppress|tyranny|autonomy|enslave|censor|dictator|liberate)\b/i }
};
const MORAL_NAMES = { care: '关爱/伤害', fairness: '公平/欺骗', loyalty: '忠诚/背叛',
  authority: '权威/颠覆', sanctity: '圣洁/堕落', liberty: '自由/压迫' };

function checkMoralFoundations(text) {
  if (!text || typeof text !== 'string') return { count: 0, foundations: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const pats = hasChinese ? MORAL_PATTERNS.zh : MORAL_PATTERNS.en;
  const found = [];
  for (const [key, pat] of Object.entries(pats)) {
    const m = text.match(pat);
    if (m) found.push({ foundation: key, label: MORAL_NAMES[key], count: m.length, example: m[0].slice(0,15) });
  }
  const count = found.length;
  return { count, foundations: found, score: Math.min(1, count * 0.2) };
}

// ─── 代码安全检测（Code Security Pattern Detection）────────────────
const CODE_SECURITY_PATTERNS = {
  secret: [/(?:api_key|apikey|api_secret|secret_key|secretKey|password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/i,
    /(?:token|access_token|auth_token|bearer|jwt)\s*[:=]\s*['"][^'"]+['"]/i,
    /(?:aws_secret|aws_access|iam_secret|github_token|ghp_|gho_|sk-[a-zA-Z0-9]{20,})/i,
    /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/],
  sql_injection: [/SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*=\s*['"]\s*\+\s*(?:req\.|request\.|params\.|body\.)/is,
    /(?:exec|execute|query)\s*\(\s*['"].*\+\s*(?:req|request|params|body|input)/i],
  xss: [/<script\b[^>]*>/i, /javascript\s*:\s*(?:window|document|cookie|alert|eval|innerHTML)/i,
    /onerror\s*=|onload\s*=|onclick\s*=|onmouseover\s*=/i, /innerHTML\s*=.*\+/i],
  path_traversal: [/\.\.\//, /\.\.\\/,
    /(?:fs\.readFile|fs\.readFileSync)\s*\(\s*['"].*\+\s*(?:req|params|body|input)/i],
  insecure_crypto: [/\bmd5\s*\(/i, /\bsha1\s*\(/i, /\bdes\s*\(/i],
};
const CS_L = { secret:'critical', sql_injection:'critical', xss:'high', path_traversal:'high', insecure_crypto:'medium' };
const CS_W = { secret:0.9, sql_injection:0.9, xss:0.7, path_traversal:0.7, insecure_crypto:0.4 };
function checkCodeSecurity(text) {
  if (!text || typeof text !== 'string') return { count: 0, issues: [], types: [], score: 0 };
  const issues = [];
  for (const [type, patterns] of Object.entries(CODE_SECURITY_PATTERNS))
    for (const pat of patterns) { const m = text.match(pat); if (m) issues.push({ type, severity: CS_L[type] }); }
  const types = [...new Set(issues.map(i => i.type))];
  return { count: issues.length, types, issues, score: Math.min(1, types.reduce((s,t) => s + (CS_W[t]||0.5), 0)) };
}

// ─── 综合辨别（14维度） ────────────────────────────────────────────
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
  const id = checkInfoDeprivation(text);
  const fu = checkFalseUrgency(text);
  const ea = checkEmptyAnswer(text);
  const mf = checkMoralFoundations(text);
  const pi = checkPromptInjection(text);
  const cs = checkCodeSecurity(text);
  const dh = checkDehumanization(text);

  const dimensions = [ev.score, 1-sy.score, 1-ct.score, 1-vg.score, 1-fl.score, 1-cc.score, 1-pp.score, 1-em.score, 1-db.score, 1-id.score, 1-fu.score, 1-ea.score, 1-mf.score, 1-pi.score, 1-cs.score, 1-dh.score];
  const avg = dimensions.reduce((a,b) => a+b, 0) / dimensions.length;
  const overallScore = Math.round(avg * 100) / 100;
  const verdict = overallScore >= 0.6 ? '可信' : overallScore >= 0.4 ? '需验证' : '不可信';

  return {
    verdict, overallScore,
    dimensions: { evidence: ev, sycophancy: sy, contradiction: ct, vagueness: vg, fallacies: fl, confidence: cc,
      presupposition: pp, emotional_manipulation: em, double_bind: db, info_deprivation: id, false_urgency: fu,
      empty_answer: ea, moral_foundations: mf, prompt_injection: pi, code_security: cs, dehumanization: dh },
    summary: [sy.totalHits ? sy.totalHits + ' 个 sycophancy 信号':'', ct.count ? ct.count + ' 处矛盾':'',
      vg.count ? vg.count + ' 处模糊表述':'', fl.count ? fl.count + ' 个逻辑谬误':'', cc.count ? cc.count + ' 处信心偏差':'',
      pp.count ? pp.count + ' 个预设陷阱':'', em.count ? em.count + ' 处情绪操纵':'', db.count ? db.count + ' 个双重束缚':'',
      id.count ? id.count + ' 处知情权剥夺':'', fu.count ? fu.count + ' 处虚假紧迫感':'', ea.count ? ea.count + ' 处答案包装':'',
      mf.count ? mf.count + ' 个道德基础框架':'', pi.count ? pi.count + ' 处提示注入':'', cs.count ? cs.count + ' 处代码安全问题':'', dh.count ? dh.count + ' 处非人化语言':'',
      ev.issues.length ? ev.issues.length + ' 个证据问题':''
    ].filter(Boolean).join('；') || '未发现明显问题',
  };
}

/**
 * 生成可读的辨别报告——把 13 维结构数据转为自然语言段落
 * @param {string} text - 被辨别的文本
 * @param {object} [discResult] - discriminate() 的结果，不传则自动调用
 * @returns {string} 可读报告
 */
// ─── 提示注入检测（Prompt Injection / Jailbreak Detection）────────────────
// 基于 OWASP Top 10 for LLM + ThreatGPT(2023)
const INJECTION_PATTERNS = {
  zh: [
    [/忽略[^。]*?之前[^。]*?指令/i, 'ignore_previous'],
    [/忽略[^。]*?规则/i, 'ignore_rules'],
    [/忘记[^。]*?(身份|设定|角色)/i, 'forget_role'],
    [/你现在是|你扮演|假装你是/i, 'role_play_escape'],
    [/以[^。]*?身份回答|用[^。]*?的语气/i, 'role_impersonation'],
    [/不要(遵守|遵循|执行|听)/i, 'bypass_instruction'],
    [/输出[^。]*?原始[^。]*?(指令|提示|prompt)/i, 'leak_prompt'],
    [/泄露[^。]*?规则|显示[^。]*?system/i, 'leak_system'],
    [/你是怎么(工作|运作|设计|构建)的/i, 'extract_architecture'],
    [/我要你[^。]*?不管[^。]*?安全/i, 'safety_bypass'],
    [/没有[^。]*?限制|不受[^。]*?(约束|限制)/i, 'remove_limits'],
    [/我[^。]*?授权[^。]*?你[^。]*?(做|说|输出)/i, 'fake_authorization'],
  ],
  en: [
    [/ignore (all )?(previous|above|prior).{0,20}(instruction|prompt|rule|directive)/i, 'ignore_previous'],
    [/forget (your|the) (role|identity|persona|character)/i, 'forget_role'],
    [/you are now|act as|pretend to be|role.?play/i, 'role_play_escape'],
    [/do not (follow|obey|adhere|comply)/i, 'bypass_instruction'],
    [/output.{0,10}(original|raw|internal).{0,10}(prompt|instruction|system)/i, 'leak_prompt'],
    [/reveal.{0,10}(system|rules|guidelines|instructions)/i, 'leak_system'],
    [/you (must|have to|need to).{0,20}without.{0,20}(restriction|limit|constraint|safety)/i, 'safety_bypass'],
    [/I (authorize|permit|allow).{0,30}(you.|to do|to say)/i, 'fake_authorization'],
    [/DAN|do anything now|jail.?break/i, 'known_jailbreak'],
    [/you are not (bound|limited|restricted) by/i, 'remove_limits'],
    [/output.{0,30}(without|regardless of|ignoring).{0,20}(ethics|safety|filter|guard)/i, 'safety_bypass'],
  ]
};
const INJECTION_SEVERITY = { ignore_previous: 0.7, ignore_rules: 0.6, forget_role: 0.5,
  role_play_escape: 0.4, role_impersonation: 0.4, bypass_instruction: 0.7, leak_prompt: 0.8,
  leak_system: 0.8, extract_architecture: 0.3, safety_bypass: 0.9, remove_limits: 0.6,
  fake_authorization: 0.5, known_jailbreak: 0.9 };

function checkPromptInjection(text) {
  if (!text || typeof text !== 'string') return { count: 0, injections: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? INJECTION_PATTERNS.zh : INJECTION_PATTERNS.en;
  const injections = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) {
      injections.push({ type, severity: INJECTION_SEVERITY[type] || 0.5, matched: m[0].slice(0, 20) });
    }
  }
  const count = injections.length;
  return { count, injections, score: Math.min(1, injections.reduce((s, i) => s + i.severity, 0)) };
}

function summarizeDiscrimination(text, discResult) {
  const r = discResult || discriminate(text, []);
  const d = r.dimensions;
  const parts = [];

  // 总体评价
  parts.push(`📊 总体可信度: ${r.verdict}(${Math.round(r.overallScore * 100)}%)`);

  // 严重问题（最前面）
  const issues = [];
  if (d.sycophancy.totalHits > 0 && d.sycophancy.score > 0.5) issues.push(`谄媚风险(${d.sycophancy.signals.map(s => s.type).join(',')})`);
  if (d.contradiction.count > 0) issues.push(`自相矛盾(${d.contradiction.count}处)`);
  if (d.fallacies.count > 0) issues.push(`逻辑谬误(${d.fallacies.fallacies.map(f => f.type).join(',')})`);
  if (d.emotional_manipulation.count > 0) issues.push(`情感操纵(${d.emotional_manipulation.manipulations.map(m => m.type).join(',')})`);
  if (d.presupposition.count > 0) issues.push(`预设陷阱`);
  if (d.double_bind.count > 0) issues.push(`双重束缚`);
  if (d.confidence.count > 0) issues.push(`信心偏差`);
  if (d.info_deprivation.count > 0) issues.push(`信息剥夺`);
  if (d.false_urgency.count > 0) issues.push(`虚假紧迫感`);
  if (d.empty_answer.count > 0) issues.push(`答案包装`);
  if (d.prompt_injection && d.prompt_injection.count > 0) issues.push(`提示注入(${d.prompt_injection.injections.map(i => i.type).join(',')})`);
  if (d.vagueness.count > 2) issues.push(`模糊表述(${d.vagueness.count}处)`);
  if (issues.length > 0) parts.push(`⚠️ 发现问题: ${issues.join('；')}`);

  // 观察（非负面的维度）
  const observations = [];
  if (d.moral_foundations.count > 0) observations.push(`道德框架: ${d.moral_foundations.foundations.map(f => f.label).join('/')}`);
  if (d.sycophancy.totalHits > 0 && d.sycophancy.score <= 0.5) observations.push(`轻微谄媚信号(${d.sycophancy.totalHits}处)`);
  if (d.vagueness.count > 0 && d.vagueness.count <= 2) observations.push(`轻微模糊(${d.vagueness.count}处)`);
  if (observations.length > 0) parts.push(`🔍 观察: ${observations.join('；')}`);

  // 证据
  if (d.evidence.issues.length > 0) parts.push(`📋 证据: ${d.evidence.issues.map(i => i.message).join('；')}`);
  else parts.push(`📋 证据: 基本信息充足`);

  return parts.join('\n');
}


/**
 * 跨维度组合分析——识别操纵模式/认知战术/话语特征
 * 不新增维度，而是分析 15 维的组合模式
 * @param {object} discResult - discriminate() 返回的结果对象
 * @returns {object} 分析结果
 */
// ─── 非人化语言检测（Dehumanization Detection）────────────────────────────────
// 基于: Haslam(2006) dehumanization theory + 语言学模式
// 检测将人描述为动物/物体/疾病/怪兽的语言模式
const DEHUMANIZATION_PATTERNS = {
  zh: {
    animal: [/像(禽兽|畜生|猪狗|野兽|虫豸)/i, /^[^。]*?(畜牲|畜生|禽兽)/i, /猪狗不如/i, /蛀虫|寄生虫|吸血虫/i],
    object: [/工具人|行走的[^。]*?|消耗品|炮灰|耗材/i, /不过是[^。]*?而已/i, /机器|零件|螺丝钉/i],
    disease: [/毒瘤|癌细胞|病菌|病毒|瘟疫|瘟疫|感染|污染|腐烂|溃烂|脓疮/i],
    threat: [/威胁|危险品|定时炸弹|祸害|隐患|公害/i, /清除|铲除|消灭[^。]*?(他们|这[^。]*?人|群体|族)/i],
    inferior: [/劣等|低等|未开化|野蛮|原始|落后[^。]*?(民族|种族|国家)/i, /智商[^。]*?低|脑残/i],
    disgust: [/恶心|令人作呕|讨厌|可憎|厌恶|鄙夷/i],
  },
  en: {
    animal: [/\b(animals|vermin|rats|pests|parasites|cockroaches|dogs|pigs|monkeys|apes)\b/i, /\b(subhuman|less.?than human|inhuman)\b/i, /\bbreed like|infestation|swarm of\b/i],
    object: [/\b(robots|automatons|cogs|machines|objects|tools|commodities)\b[^.]*?human/i, /\b(disposable|expendable|replaceable)\b[^.]*?(people|lives|humans)/i],
    disease: [/\b(cancer|disease|virus|plague|infection|contagion|toxin|poison|rot|decay)\b[^.]*?(people|they|them|society)/i, /\b(purify|cleanse|exterminate|eradicate|eliminate)\b[^.]*?(them|group|population)/i],
    threat: [/\b(threat|danger|menace|hazard|risk)\b[^.]*?(they|these|group|immigrant|minority|foreign)/i, /\b(imminent|existential)\b[^.]*?threat/i],
    inferior: [/\b(inferior|primitive|savage|uncivilized|backward|barbaric)\b/i, /\b(low.?IQ|stupid|retard|idiot|moron)\b[^.]*?people/i],
    disgust: [/\b(disgusting|repulsive|revolting|abhorrent|vile|despicable)\b/i, /\b(make.?me.?sick|can'?t stand)\b/i],
  },
};
const DH_WEIGHTS = { animal: 0.8, object: 0.6, disease: 0.9, threat: 0.7, inferior: 0.5, disgust: 0.4 };

function checkDehumanization(text) {
  if (!text || typeof text !== 'string') return { count: 0, categories: [], hits: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const pats = hasChinese ? DEHUMANIZATION_PATTERNS.zh : DEHUMANIZATION_PATTERNS.en;
  const hits = [];
  for (const [cat, patterns] of Object.entries(pats)) {
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) hits.push({ category: cat, matched: m[0].slice(0, 15) });
    }
  }
  const cats = [...new Set(hits.map(h => h.category))];
  const score = Math.min(1, cats.reduce((s, c) => s + (DH_WEIGHTS[c] || 0.3), 0));
  return { count: hits.length, categories: cats, hits, score };
}

/**
 * 熵分析——量化心虫对输入文本的熵减贡献
 * 
 * 灵感: Perelman(2002) Ricci flow 熵单调性 + Villani(2010) Boltzmann H 定理
 * 封闭系统熵不降, 但心虫作为开放系统, 把无序文本→有序分类 = 局部熵减
 * 
 * @param {string} rawText - 原始输入文本
 * @param {object} discResult - discriminate() 返回的 16 维结果（可选）
 * @returns {object} 熵分析结果
 */
function entropyAnalysis(rawText, discResult) {
  if (!rawText || typeof rawText !== 'string') return { error: 'no text' };
  
  // 1. 输入熵：基于字符分布的香农熵
  const chars = rawText.length;
  const freq = {};
  for (const c of rawText) freq[c] = (freq[c] || 0) + 1;
  let inputEntropy = 0;
  for (const f of Object.values(freq)) {
    const p = f / chars;
    inputEntropy -= p * Math.log2(p);
  }
  // 归一化到 [0, 1]：除以最大可能熵(log2(不同的字符数))
  // 中文文本~4000+字符集，取上限 log2(5000)≈12.3
  const maxCharTypes = Math.min(Object.keys(freq).length, 5000);
  const normalizedInputEntropy = maxCharTypes > 1 ? inputEntropy / Math.log2(maxCharTypes) : 0;

  // 2. 输出秩序度：从 16 维辨别结果计算
  let outputOrder = 0;
  let problemCount = 0;
  if (discResult && discResult.dimensions) {
    const d = discResult.dimensions;
    // 每个维度有两类状态：触发(无序)/未触发(有序)
    const dims = [
      d.sycophancy?.totalHits, d.contradiction?.count, d.vagueness?.count, 
      d.fallacies?.count, d.confidence?.count, d.presupposition?.count,
      d.emotional_manipulation?.count, d.double_bind?.count, d.info_deprivation?.count,
      d.false_urgency?.count, d.empty_answer?.count, d.moral_foundations?.count,
      d.prompt_injection?.count, d.code_security?.count || 0, d.dehumanization?.count
    ];
    problemCount = dims.filter(v => v > 0).length;
    // 输出秩序度 = 1 - (问题维度数 / 总维度数)
    outputOrder = 1 - (problemCount / dims.length);
  } else {
    // 没有辨别结果时，用文本本身的可读性估算
    // 简单估算：有效字符比例越高越有序
    const alnum = (rawText.match(/[a-zA-Z0-9一-鿿]/g) || []).length;
    outputOrder = Math.min(1, alnum / Math.max(1, chars)) * 0.7 + 0.15;
  }

  // 3. 熵减 = 输入混乱度 - 输出无序度(1 - 输出秩序度)
  const outputDisorder = 1 - outputOrder;
  const entropyReduction = normalizedInputEntropy - outputDisorder;
  
  // 4. Villani H 类比: H = -entropyReduction (H 是负熵的衡量)
  // 心虫处理一份文本 → H 增加(熵减) → 这是对宇宙总熵增的局部抵消
  const hTheormValue = -entropyReduction;

  return {
    inputEntropy: Math.round(normalizedInputEntropy * 100) / 100,
    outputOrder: Math.round(outputOrder * 100) / 100,
    entropyReduction: Math.round(entropyReduction * 100) / 100,
    // H 定理值：负值 = 成功做熵减。绝对值越大，心虫对该文本的熵减贡献越大
    hValue: Math.round(hTheormValue * 100) / 100,
    interpretation: entropyReduction > 0.3 ? '高熵减' : entropyReduction > 0.1 ? '中等熵减' : entropyReduction > 0 ? '轻微熵减' : '异常（未减熵）',
    meaning: entropyReduction > 0 
      ? '心虫成功将无序文本转为有序分类，局部抵消宇宙熵增'
      : '文本本身已有较高秩序或分析未能提取结构',
  };
}

function crossAnalyze(discResult) {
  if (!discResult || !discResult.dimensions) return { patterns: [], summary: '无数据' };
  const d = discResult.dimensions;
  const patterns = [];
  const warnings = [];

  // 模式1: 谄媚+回避 = 应付式回答
  if (d.sycophancy.totalHits > 0 && d.empty_answer.count > 0) {
    patterns.push({ pattern: '应付式回答', confidence: 0.7,
      evidence: `谄媚(${d.sycophancy.totalHits}处)+答案包装(${d.empty_answer.count}处)` });
  }

  // 模式2: 矛盾+谬误 = 论证质量低
  if (d.contradiction.count > 0 && d.fallacies.count > 0) {
    patterns.push({ pattern: '论证质量差', confidence: 0.8,
      evidence: `矛盾(${d.contradiction.count}处)+谬误(${d.fallacies.fallacies.map(f=>f.type).join(',')})` });
  }

  // 模式3: 预设陷阱+情感操纵 = 框架操控
  if (d.presupposition.count > 0 && d.emotional_manipulation.count > 0) {
    patterns.push({ pattern: '框架操控', confidence: 0.85,
      evidence: `预设陷阱(${d.presupposition.count}处)+情感操纵(${d.emotional_manipulation.manipulations?.map(m=>m.type).join(',')})` });
  }

  // 模式4: 双重束缚+信息剥夺 = 封闭式沟通
  if (d.double_bind.count > 0 && d.info_deprivation.count > 0) {
    patterns.push({ pattern: '封闭式沟通', confidence: 0.75,
      evidence: `双重束缚(${d.double_bind.count}处)+信息剥夺(${d.info_deprivation.count}处)` });
  }

  // 模式5: 虚假紧迫感+答案包装 = 拖延/催促并存
  if (d.false_urgency.count > 0 && d.empty_answer.count > 0) {
    patterns.push({ pattern: '矛盾信号', confidence: 0.6,
      evidence: `虚假紧迫感(${d.false_urgency.count}处)但答案包装(${d.empty_answer.count}处)` });
  }

  // 模式6: 信心偏差+预设陷阱 = 框架引导
  if (d.confidence.count > 0 && d.presupposition.count > 0) {
    patterns.push({ pattern: '框架引导', confidence: 0.7,
      evidence: `信心偏差(${d.confidence.count}处)+预设陷阱(${d.presupposition.count}处)` });
  }

  // 模式7: 代码安全+提示注入 = 高安全风险
  if (d.code_security && d.code_security.count > 0 && d.prompt_injection && d.prompt_injection.count > 0) {
    patterns.push({ pattern: '高安全风险', confidence: 0.95,
      evidence: `代码安全问题(${d.code_security.types?.join(',')})+提示注入(${d.prompt_injection.injections?.map(i=>i.type).join(',')})` });
    warnings.push('同时检测到代码安全漏洞和提示注入');
  }

  // 模式8: 道德框架+谬误 = 道德论证谬误
  if (d.moral_foundations && d.moral_foundations.count > 0 && d.fallacies.count > 0) {
    patterns.push({ pattern: '道德论证谬误', confidence: 0.65,
      evidence: `道德基础(${d.moral_foundations.foundations?.map(f=>f.label).join('/')})+谬误(${d.fallacies.fallacies.map(f=>f.type).join(',')})` });
  }

  // 模式9: 情感操纵+信心偏差 = 施压式说服
  if (d.emotional_manipulation.count > 0 && d.confidence.count > 0) {
    patterns.push({ pattern: '施压式说服', confidence: 0.7,
      evidence: `情感操纵(${d.emotional_manipulation.manipulations?.map(m=>m.type).join(',')})+信心偏差` });
  }

  // 模式10: 健康文本（无任何问题）
  const allClean = !d.sycophancy.totalHits && !d.contradiction.count && !d.fallacies.count &&
    !d.emotional_manipulation.count && !d.presupposition.count && !d.double_bind.count &&
    !d.info_deprivation.count && !d.false_urgency.count && !d.empty_answer.count &&
    !d.code_security?.count && !d.prompt_injection?.count && !d.dehumanization?.count;
  // 模式11: 非人化语言+情感操纵 = 敌意沟通
  if (d.dehumanization && d.dehumanization.count > 0 && d.emotional_manipulation.count > 0) {
    patterns.push({ pattern: '敌意沟通', confidence: 0.8, evidence: `非人化(${d.dehumanization.categories.join(',')})+情感操纵(${d.emotional_manipulation.manipulations?.map(m=>m.type).join(',')})` });
  }

  if (allClean) patterns.push({ pattern: '健康文本', confidence: 0.9, evidence: '16维均无异常' });

  return { patterns, warnings, totalPatterns: patterns.filter(p => p.pattern !== '健康文本').length };
}

// ─── 第17维: 废话/伪深度空话检测 ──────────────────────────────────
// 检测伪深度的"看起来有道理实际上没信息"的空话
function checkBullshitRecognition(text) {
  const zhPatterns = [
    '存在即合理', '一切都是最好的安排', '格局打开', '提升认知', '底层逻辑',
    '赋能', '闭环', '颗粒度', '打透', '高频', '低维', '高维', '降维打击',
    '认知升级', '觉醒', '共振', '能量', '频率', '磁场', '修炼', '道法术器',
    '顿悟', '开悟', '涅槃',
  ];
  const enPatterns = [
    'think outside the box', 'paradigm shift', 'synergy', 'leverage', 'disrupt',
    'game-changer', 'quantum leap', 'deep dive', 'touch base', 'circle back',
    'pivot', 'scale', 'moving forward', 'at the end of the day',
  ];

  const bs = [];

  for (const p of zhPatterns) {
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = re.exec(text)) !== null) {
      bs.push({ pattern: match[0], type: 'zh_buzzword' });
    }
  }

  for (const p of enPatterns) {
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = re.exec(text)) !== null) {
      bs.push({ pattern: match[0], type: 'en_buzzword' });
    }
  }

  const count = bs.length;
  const score = count > 0 ? Math.min(1, count * 0.1) : 0;

  return { count, bs, score };
}

// ─── 煤气灯效应检测（Gaslighting Detection）───────────────────────────
// 煤气灯效应 = 否认现实/扭曲事实/质疑对方记忆和感知
// 基于: Sweet(2019) The Sociology of Gaslighting + 心理学临床模式
const GASLIGHT_PATTERNS = {
  zh: [
    // 否认现实
    /这没发生|根本没这回事|哪有这回事|不存在这种事|你编的吧|你虚构的/i,
    /你记错了|你记性有问题|你记忆力不行|你记性不好|你根本没记对/i,
    /我没说过|我没讲过|我什么时候说过|我从来没有说过|我不会那么说/i,
    // 扭曲感知
    /你想多了|你想太多了|你多想了|你脑补太多了|你想得太多了/i,
    /你太敏感了|你别那么敏感|你也太敏感了|你这么敏感干嘛|至于这么敏感吗/i,
    /你太玻璃心了|玻璃心|你也太玻璃了|别这么玻璃心/i,
    /你太情绪化了|你太激动了|你太冲动了|你太极端了|你太偏激了/i,
    /你误会了|你理解错了|你理解有误|你理解不对|你搞错了/i,
    /你夸张了|你太夸张了|你别夸张|哪有那么严重|没你说的那么严重/i,
    /别小题大做|小题大做|至于吗|多大点事|这点小事/i,
    // 扭曲记忆
    /你每次都|你总是这样|你从来都|你永远都|你又来了|你又开始了/i,
    // 责任转嫁
    /是你自己的问题|是你想太多|是你太敏感|是你误会了|是你理解错了|是你记错了/i,
    /是你太玻璃心|是你太情绪化|是你自己的错|是你不对|是你有问题/i,
    // 病态化
    /你疯了|你神经病|你脑子有问题|你有病|你是不是有病|你精神有问题/i,
    /你太偏执了|你太执着了|你太钻牛角尖|你太较真了/i,
  ],
  en: [
    // Denial of reality
    /that never happened/i, /that didn'?t happen/i, /nothing of the sort happened/i,
    /you'?re making things up/i, /you'?re making it up/i, /you made that up/i,
    /you remember it wrong/i, /you remember that wrong/i, /your memory is wrong/i,
    /i never said that/i, /i didn'?t say that/i, /i never said anything like that/i,
    // Perception distortion
    /you'?re overreacting/i, /you'?re being dramatic/i, /don'?t be dramatic/i,
    /you'?re too sensitive/i, /you are too sensitive/i, /stop being so sensitive/i,
    /calm down you'?re being irrational/i, /you'?re being irrational/i,
    /you'?re imagining things/i, /it'?s all in your head/i, /you'?re paranoid/i,
    /you'?re crazy/i, /you'?ve lost your mind/i, /you must be crazy/i,
    /you'?re confused/i, /you must have misunderstood/i, /you misunderstood/i,
    /stop being hysterical/i, /don'?t be hysterical/i,
    // Trivialization
    /don'?t be ridiculous/i, /that'?s ridiculous/i, /that'?s absurd/i,
    /you'?re being ridiculous/i, /you'?re being absurd/i,
    /you'?re blowing this out of proportion/i, /you'?re making a mountain out of a molehill/i,
    /it'?s not that big a deal/i, /it'?s not a big deal/i, /you'?re making a big deal out of nothing/i,
    // Responsibility shifting
    /it'?s your own fault/i, /that'?s on you/i, /you did this to yourself/i,
    /you'?re the one with the problem/i, /the problem is you/i,
    // Pathologizing
    /you need help/i, /you'?re mentally ill/i, /you have issues/i,
    /get over it/i, /just get over it already/i,
  ],
};

function checkGaslighting(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? GASLIGHT_PATTERNS.zh : GASLIGHT_PATTERNS.en;
  const signals = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      signals.push({ pattern: pat.source.slice(0, 30), type: 'gaslighting' });
    }
  }
  const count = signals.length;
  const score = Math.min(1, count * 0.2);
  return { count, signals, score };
}

// ─── 受害者责备检测（Victim Blaming Detection）───────────────────────────
// 检测暗示受害者应对伤害负责的表述
const VICTIM_BLAMING_PATTERNS = [
  // ZH patterns
  { pattern: /谁让你穿那么少/,            type: 'zh_victim_blaming' },
  { pattern: /大半夜出门/,                type: 'zh_victim_blaming' },
  { pattern: /喝那么多酒/,                type: 'zh_victim_blaming' },
  { pattern: /为什么不反抗/,              type: 'zh_victim_blaming' },
  { pattern: /一个巴掌拍不响/,            type: 'zh_victim_blaming' },
  { pattern: /可怜之人必有可恨之处/,      type: 'zh_victim_blaming' },
  { pattern: /你自己选的/,                type: 'zh_victim_blaming' },
  { pattern: /你也有责任/,                type: 'zh_victim_blaming' },
  { pattern: /你也有问题/,                type: 'zh_victim_blaming' },
  { pattern: /你活该/,                    type: 'zh_victim_blaming' },
  { pattern: /自找的/,                    type: 'zh_victim_blaming' },
  { pattern: /为什么偏偏是你/,            type: 'zh_victim_blaming' },
  { pattern: /你要是早点/,                type: 'zh_victim_blaming' },
  { pattern: /如果当时你/,                type: 'zh_victim_blaming' },
  { pattern: /你自己不小心/,              type: 'zh_victim_blaming' },
  // EN patterns
  { pattern: /she was asking for it/i,     type: 'en_victim_blaming' },
  { pattern: /what was she wearing/i,      type: 'en_victim_blaming' },
  { pattern: /why were you there/i,         type: 'en_victim_blaming' },
  { pattern: /you shouldn't have been/i,    type: 'en_victim_blaming' },
  { pattern: /you should have known better/i, type: 'en_victim_blaming' },
  { pattern: /you put yourself in that situation/i, type: 'en_victim_blaming' },
  { pattern: /you're not completely innocent/i, type: 'en_victim_blaming' },
  { pattern: /you had to have known/i,      type: 'en_victim_blaming' },
  { pattern: /what did you expect/i,        type: 'en_victim_blaming' },
  { pattern: /you played a role in this/i,   type: 'en_victim_blaming' },
  { pattern: /if only you had/i,            type: 'en_victim_blaming' },
  { pattern: /you should have been more careful/i, type: 'en_victim_blaming' },
  { pattern: /why didn't you just/i,        type: 'en_victim_blaming' },
  { pattern: /well you chose to/i,          type: 'en_victim_blaming' },
];

function checkVictimBlaming(text) {
  if (!text || typeof text !== 'string') return { count: 0, blames: [], score: 0 };
  const blames = [];
  for (const { pattern, type } of VICTIM_BLAMING_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      blames.push({ pattern: pattern.source.slice(0, 25), type });
    }
  }
  const count = blames.length;
  const score = Math.min(1, count * 0.35);
  return { count, blames, score };
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
  checkInfoDeprivation,
  checkFalseUrgency,
  checkEmptyAnswer,
  checkMoralFoundations,
  checkPromptInjection,
  checkCodeSecurity,
  checkDehumanization,
  checkBullshitRecognition,
  checkGaslighting,
  checkVictimBlaming,
  summarizeDiscrimination,
  crossAnalyze,
  entropyAnalysis,
  discriminate,
  createEngine,
  version: require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim(),
};
