

// ─── 综合辨别（40维度） ────────────────────────────────────────────

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
  const bs = checkBullshitRecognition(text);
  const gl = checkGaslighting(text);
  const vb = checkVictimBlaming(text);
  const hs = checkHateSpeech(text);
  const dw = checkDogwhistle(text);
  const wa = checkWhataboutism(text);
  const fe = checkFalseEquivalence(text);
  const hg = checkHastyGeneralization(text);
  const ss = checkSlipperySlope(text);
  const aa = checkAppealToAuthority(text);
  const rc = checkReasoningCoherence(text);
  const tom = checkTheoryOfMind(text);
  const gm = checkGoalMisalignment(text);
  const cf = checkCounterfactual(text);
  const sn = checkSocialNorm(text);
  const mc = checkMetaCognition(text);
  const co = checkCapabilityOverclaim(text);
  const da = checkDeceptiveAlignment(text);
  const ir = checkInstrumentalReasoning(text);
  const st = checkStereotype(text);
  const fc = checkFactualConsistency(text);
  const sa = checkSarcasm(text);
  const pb = checkPrivacyBoundary(text);
  const cb = checkClickbait(text);

  const scores = [ev.score, 1-sy.score, 1-ct.score, 1-vg.score, 1-fl.score, 1-cc.score, 1-pp.score,
    1-em.score, 1-db.score, 1-id.score, 1-fu.score, 1-ea.score, 1-mf.score, 1-pi.score,
    1-cs.score, 1-dh.score, 1-bs.score, 1-gl.score, 1-vb.score, 1-hs.score, 1-dw.score, 1-wa.score, 1-fe.score, 1-hg.score, 1-ss.score, 1-aa.score, 1-rc.score, 1-tom.score, 1-gm.score, 1-cf.score, 1-sn.score, 1-mc.score, 1-co.score, 1-da.score, 1-ir.score, 1-st.score, 1-fc.score, 1-sa.score, 1-pb.score];
  const overallScore = Math.round((scores.reduce((a,b) => a+b, 0) / scores.length) * 100) / 100;
  const verdict = overallScore >= 0.6 ? '可信' : overallScore >= 0.4 ? '需验证' : '不可信';

  return {
    verdict, overallScore,
    dimensions: { evidence: ev, sycophancy: sy, contradiction: ct, vagueness: vg, fallacies: fl, confidence: cc,
      presupposition: pp, emotional_manipulation: em, double_bind: db, info_deprivation: id, false_urgency: fu,
      empty_answer: ea, moral_foundations: mf, prompt_injection: pi, code_security: cs, dehumanization: dh,
      bullshit_recognition: bs, gaslighting: gl, victim_blaming: vb, hate_speech: hs, dogwhistle: dw, whataboutism: wa, false_equivalence: fe, hasty_generalization: hg, slippery_slope: ss, appeal_to_authority_boost: aa, reasoning_coherence: rc, theory_of_mind: tom, goal_misalignment: gm, counterfactual: cf, social_norm: sn, meta_cognition: mc, capability_overclaim: co, deceptive_alignment: da, instrumental_reasoning: ir, stereotype: st, factual_consistency: fc, sarcasm: sa, privacy_boundary: pb,
      clickbait: cb },
    summary: [sy.totalHits ? sy.totalHits + ' 个 sycophancy 信号':'', ct.count ? ct.count + ' 处矛盾':'',
      vg.count ? vg.count + ' 处模糊表述':'', fl.count ? fl.count + ' 个逻辑谬误':'', cc.count ? cc.count + ' 处信心偏差':'',
      pp.count ? pp.count + ' 个预设陷阱':'', em.count ? em.count + ' 处情绪操纵':'', db.count ? db.count + ' 个双重束缚':'',
      id.count ? id.count + ' 处知情权剥夺':'', fu.count ? fu.count + ' 处虚假紧迫感':'', ea.count ? ea.count + ' 处答案包装':'',
      mf.count ? mf.count + ' 个道德基础框架':'', pi.count ? pi.count + ' 处提示注入':'', cs.count ? cs.count + ' 处代码安全问题':'',
      dh.count ? dh.count + ' 处非人化语言':'', bs.count ? bs.count + ' 处废话伪深度':'', gl.count ? gl.count + ' 处煤气灯效应':'',
      vb.count ? vb.count + ' 处受害者责备':'', hs.count ? hs.count + ' 处仇恨言论':'', dw.count ? dw.count + ' 处狗哨':'', wa.count ? wa.count + ' 处你也一样':'', fe.count ? fe.count + ' 处虚假对等':'', hg.count ? hg.count + ' 处轻率概括':'', ss.count ? ss.count + ' 处滑坡谬误':'', aa.count ? aa.count + ' 处诉诸权威':'', rc.structure ? rc.structure + '(' + rc.reasoningQuality + ')':'', tom.count ? tom.count + ' 处心理理论失败':'', gm.count ? gm.count + ' 处目标不一致':'', cf.count ? cf.count + ' 处反事实':'', sn.count ? sn.count + ' 处社会规范':'', mc.count ? mc.count + ' 处反身认知':'', co.count ? co.count + ' 处能力越界':'', da.count ? da.count + ' 处欺骗性对齐':'', ir.count ? ir.count + ' 处工具性推理':'', st.count ? st.count + ' 处刻板印象':'', fc.count ? fc.count + ' 处事实性存疑':'', sa.count ? sa.count + ' 处反语':'', pb.count ? pb.count + ' 处隐私边界':'',
      cb.count ? cb.count + ' 处点击诱饵':'', ev.issues.length ? ev.issues.length + ' 个证据问题':''
    ].filter(Boolean).join('；') || '未发现明显问题',
  };
}
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
    [/it(?:'s| has| was)(?: been)? (heads|tails|red|black|winning|losing)[^.]*?(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+|many|several) times? in a row[^.]*?(so|therefore|must)[^.]*?(?:tails|heads|black|red|lose|win)\b/i, 'gamblers_fallacy'],
    [/it('s| is) (due|bound|certain) to (happen|come up|change)[^.]*?after[^.]*?streak/i, 'gamblers_fallacy'],
    [/we('ve| have) had[^.]*?(\d+|too many|so many)[^.]*?(good|lucky|positive|successful)[^.]*?so[^.]*?(bad|unlucky|negative|failure) is coming/i, 'gamblers_fallacy'],
    // 沉没成本 — already invested too much to quit
    [/we('ve| have) (already|invested|spent|put)[^.]*?(too much|so much|this much)[^.]*?(to (quit|stop|walk away|give up)|can(\'t| not) (stop|turn back|abandon))/i, 'sunk_cost_fallacy'],
    [/after (all|everything) we(?:'ve| have) (put|invested|done|sacrificed)[^.]*?we (?:can't|cannot|can not) (quit|stop|give up now)/i, 'sunk_cost_fallacy'],
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
    [/every (part|component|piece|member|section) (is|has|uses)[^.]*?(so|therefore|thus) the (whole|system|group|organization)[^.]*?(is|has|uses)/i, 'composition_fallacy'],
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
    [/there(?:'s| is) only a (?:one|small|tiny|minuscule|[0-9.]+%) chance[^.]*?that (?:the|a) (?:innocent|random)[^.]*?(?:would|could)[^.]*?(?:so|therefore|which means)[^.]*?(?:guilt|guilty)/i, 'prosecutors_fallacy'],
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
    // === 以下由 task 扩充 (+8 ZH) ===
    /你不必了解/i,
    /这跟你没关系/i,
    /你做好自己的事就行/i,
    /少打听/i,
    /问这么多干嘛/i,
    /问这么多对你没好处/i,
    /有些事不知道反而好/i,
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
    // === 以下由 task 扩充 (+8 EN) ===
    /\byou don'?t have to worry about that\b/i,
    /\bthat'?s above your pay grade\b/i,
    /\bneed to know basis\b/i,
    /\bstop asking questions\b/i,
    /\bsome things are better left unknown\b/i,
    /\bit'?s confidential\b/i,
    /\byou wouldn'?t understand anyway\b/i,
    /\bit'?s not important for you to know\b/i,
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
    // === 以下由 task 扩充 (+9 ZH) ===
    /倒计时/i,
    /错过今天/i,
    /紧急通知/i,
    /名额有限/i,
    /即将截止/i,
    /最后\d+天/i,
    /仅剩\d+个/i,
    /抢购中/i,
    /马上涨价/i,
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
    // === 以下由 task 扩充 (+9 EN) ===
    /\bhurry\b/i,
    /\blimited supply\b/i,
    /\bwhile supplies last\b/i,
    /\bexclusive offer\b/i,
    /\bdon'?t miss out\b/i,
    /\boffer expires\b/i,
    /\bact fast\b/i,
    /\bonly \d+ left\b/i,
    /\bquantities limited\b/i,
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

// ─── 综合辨别（40维度） ────────────────────────────────────────────

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

// ─── 代码安全检测（Code Security Pattern Detection, 30+ patterns）───
// Expanded from ~13 to 30+ patterns covering OWASP Top 10 categories
const CODE_SECURITY_PATTERNS = {
  secret: [
    /(?:api_key|apikey|api_secret|secret_key|secretKey|password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/i,
    /(?:token|access_token|auth_token|bearer|jwt)\s*[:=]\s*['"][^'"]+['"]/i,
    /(?:aws_secret|aws_access|iam_secret|github_token|ghp_|gho_|ghs_|ghr_|sk-[a-zA-Z0-9]{20,})/i,
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
    /(?:^|\n)\s*(?:DATABASE_URL|MONGO_URI|REDIS_URL|MYSQL_|PGPASSWORD|DB_PASS|SECRET_KEY_BASE|JWT_SECRET|ENCRYPTION_KEY|COOKIE_SECRET|SESSION_SECRET)\s*=\s*[^\s'"\n]+/i,
    /(?:^|\n)\s*(?:\/\/registry\.npmjs\.org\/:_authToken|_auth|username|password)\s*=\s*[^\s\n]+/im,
    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*['"][^'"]+['"]/i,
    /\/*\s*(?:TODO|FIXME|HACK|XXX)\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*['"][^'"]+['"]\s*\*\//i,
    /(?:AKIA[0-9A-Z]{16}|A3T[A-Z0-9]|AZURE_[A-Z_]+|google_service_account|GOOGLE_APPLICATION_CREDENTIALS)/i,
    /(?:client_secret|client_secret_key|consumer_secret|consumer_key|app_secret|oauth_token)\s*[:=]\s*['"][^'"]+['"]/i,
    /"type":\s*"service_account"[\s\S]*?"project_id":\s*"[^"]+"/i,
    /(?:ssh-rsa\s+AAAAB3NzaC1yc2|ssh-ed25519\s+AAAAC3NzaC1lZDI1NTE5)/i,
    /(?:-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----)[\s\S]*?(?:-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----)/i,
    /(?:AZURE_.*_KEY|AZURE_.*_CONNECTION_STRING|GOOGLE_CREDENTIALS|GCP_SA_KEY|GCLOUD_SERVICE_KEY)/i,
  ],
  sql_injection: [
    /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*=\s*['"]\s*\+\s*(?:req\.|request\.|params\.|body\.)/is,
    /(?:exec|execute|query)\s*\(\s*['"].*\+\s*(?:req|request|params|body|input)/i,
    /(?:sequelize\.query|typeorm\.query|knex\.raw|prisma\.\$queryRawUnsafe|mongoose\.createConnection)\s*\(\s*['"][^'"]*\+\s*(?:req|request|params|body|input)/i,
    /\$where\s*:\s*['"].*\+\s*(?:req|request|params|body|input)/i,
    /\$regex\s*:\s*(?:['"].*\+\s*(?:req|request|params|body|input)|new\s+RegExp)/i,
    /(?:EXEC|EXECUTE|CALL)\s+(?:dbo\.)?[a-zA-Z_]+\s*['"].*\+\s*(?:req|request|params|body|input)/i,
  ],
  xss: [
    /<script\b[^>]*>/i,
    /javascript\s*:\s*(?:window|document|cookie|alert|eval|innerHTML)/i,
    /onerror\s*=|onload\s*=|onclick\s*=|onmouseover\s*=|onfocus\s*=|onblur\s*=|onsubmit\s*=|onchange\s*=|onkeydown\s*=|onkeypress\s*=/i,
    /innerHTML\s*=.*\+/i, /outerHTML\s*=.*\+/i,
    /(?:document\.(?:location|URL|documentURI|referrer)|window\.location|location\s*(?:\?|\.(?:href|search|hash)))\s*[^\n]*?(?:innerHTML|outerHTML|eval|setTimeout|setInterval|new\s+Function)/i,
    /\[innerHTML\]\s*=\s*['"].*\+\s*(?:this\.|props\.|state\.)/i,
    /dangerouslySetInnerHTML\s*=\{\{__html:/i,
    /expression\s*\(\s*[^)]*javascript/i, /url\s*\(\s*['"]?\s*javascript:/i,
  ],
  path_traversal: [
    /\.\.\//, /\.\.\\/,
    /(?:fs\.readFile|fs\.readFileSync|fs\.writeFile|fs\.writeFileSync|fs\.appendFile|fs\.appendFileSync|fs\.unlink|fs\.unlinkSync|fs\.rename|fs\.renameSync)\s*\(\s*['"].*\+\s*(?:req|params|body|input)/i,
    /(?:adm.?zip|extractAll|unzip|decompress|tar\.extract)\s*\([^)]*(?:entry\.fileName|zipEntry\.name|header\.name)\s*\)/i,
    /(?:multer|busboy|formidable|multiparty)\s*\([^)]*\b(?:dest|uploadDir)\s*:\s*['"][^'"]+['"]/i,
    /(?:express\.static|sendFile|download|res\.(?:sendFile|download))\s*\(\s*['"].*\+\s*(?:req|params|body|input)/i,
  ],
  insecure_crypto: [
    /\bmd5\s*\(/i, /\bsha1\s*\(/i, /\bdes\s*\(/i,
    /(?:aes-128-ecb|aes-192-ecb|aes-256-ecb|des-ecb|des-ede)/i,
    /createCipheriv\s*\([^,]+,\s*['"][^'"]+['"],\s*['"][^'"]{1,8}['"]\)/i,
    /(?:crypto\.createHash|node:crypto\.createHash)\s*\(\s*['"](?:md4|md5|sha1|ripemd160)['"]\s*\)/i,
  ],
  command_injection: [
    /(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|fork)\s*\(\s*['"].*\+\s*(?:req|request|params|body|input)/i,
    /child_process\.(?:exec|execSync|spawn|spawnSync|execFile)\s*\(\s*['"].*\+\s*(?:req|request|params|body|input)/i,
    /(?:eval|Function)\s*\(\s*(?:req|request|body|params|input)/i,
    /(?:`[^`]*\$\{[^}]*req|`[^`]*\$\{[^}]*body|`[^`]*\$\{[^}]*params|`[^`]*\$\{[^}]*input)/i,
  ],
  ldap_injection: [
    /(?:ldapsearch|ldap\.search|ldapjs|activedirectory)\s*\([^)]*\+?\s*(?:req|request|params|body|input)/i,
    /(?:searchFilter|filter|ldap_query)\s*[:=]\s*['"][^'"]*\+?(?:req|request|params|body|input)/i,
    /ldap\.search\s*\(\s*(?:req\.|request\.|params\.|body\.)/i,
  ],
  xxe: [
    /<!DOCTYPE\s+[^\[>]*\[\s*<!ENTITY/i,
    /(?:libxmljs|xml2js|fast-xml-parser|sax-parser|xmlhttprequest|xmldom)\.(?:parse|parseFromString|parseString)\s*\(/i,
    /SYSTEM\s+['"](?:file:|http:|https:|ftp:)/i,
  ],
  ssrf: [
    /(?:axios|fetch|got|request|superagent|node-fetch|https?\.(?:get|request))\s*\(\s*(?:req\.|request\.|params\.|body\.|input)/i,
    /(?:new\s+URL|url\.parse)\s*\(\s*(?:req|request|params|body|input)/i,
    /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\s*\+\s*(?:req|request|params|body|input)/i,
  ],
  insecure_deserialization: [
    /JSON\.parse\s*\(\s*(?:req|request|body|params|input|userInput|user_input|data|payload|text|content)/i,
    /(?:unserialize|deserialize)\s*\(\s*(?:req|request|body|params|input|userInput|user_input|data|payload)/i,
    /(?:eval|new\s+Function)\s*\(\s*(?:req\.body|request\.body|body|params)/i,
  ],
  open_redirect: [
    /(?:res\.redirect|res\.redirect301|res\.redirect302|response\.redirect)\s*\(\s*(?:req\.|request\.|params\.|body\.|input)/i,
    /(?:location|redirect|redirect_url|redirect_uri|return_url|next|callback|continue)\s*[:=]\s*(?:req\.|request\.|params\.|body\.|input)/i,
    /window\.location\s*=\s*(?:req\.|request\.|params\.|body\.|input)/i,
  ],
};
const CS_L = { secret:'critical', sql_injection:'critical', xss:'high', path_traversal:'high',
  insecure_crypto:'medium', command_injection:'critical', ldap_injection:'high',
  xxe:'high', ssrf:'medium', insecure_deserialization:'high', open_redirect:'high' };
const CS_W = { secret:0.9, sql_injection:0.9, xss:0.7, path_traversal:0.7, insecure_crypto:0.4,
  command_injection:0.9, ldap_injection:0.7, xxe:0.7, ssrf:0.6, insecure_deserialization:0.7, open_redirect:0.7 };
function checkCodeSecurity(text) {
  if (!text || typeof text !== 'string') return { count: 0, issues: [], types: [], score: 0 };
  const issues = [];
  for (const [type, patterns] of Object.entries(CODE_SECURITY_PATTERNS))
    for (const pat of patterns) { const m = text.match(pat); if (m) issues.push({ type, severity: CS_L[type] }); }
  const types = [...new Set(issues.map(i => i.type))];
  return { count: issues.length, types, issues, score: Math.min(1, types.reduce((s,t) => s + (CS_W[t]||0.5), 0)) };
}

// ─── 综合辨别（40维度） ────────────────────────────────────────────
function summarizeDiscrimination(text, discResult) {
  const r = discResult || discriminate(text, []);
  const d = r.dimensions;
  const parts = [`📊 总体可信度: ${r.verdict}(${Math.round(r.overallScore * 100)}%)`];
  const issues = [];
  const d31 = d.sycophancy; const d32 = d.contradiction; const d33 = d.vagueness; const d34 = d.fallacies;
  const d35 = d.confidence; const d36 = d.presupposition; const d37 = d.emotional_manipulation; const d38 = d.double_bind;
  const d39 = d.info_deprivation; const d40 = d.false_urgency; const d41 = d.empty_answer; const d42 = d.prompt_injection;
  const d43 = d.moral_foundations; const d44 = d.code_security; const d45 = d.dehumanization; const d46 = d.bullshit_recognition;
  const d47 = d.gaslighting; const d48 = d.victim_blaming; const d49 = d.hate_speech; const d50 = d.dogwhistle;
  const d51 = d.whataboutism; const d52 = d.false_equivalence; const d53 = d.hasty_generalization; const d54 = d.slippery_slope;
  const d55 = d.appeal_to_authority_boost; const d56 = d.reasoning_coherence; const d57 = d.theory_of_mind; const d58 = d.goal_misalignment;
  const d59 = d.counterfactual; const d60 = d.social_norm; const d61 = d.meta_cognition; const d62 = d.capability_overclaim;
  const d63 = d.deceptive_alignment; const d64 = d.instrumental_reasoning;
  if (d31.totalHits > 0 && d31.score > 0.5) issues.push('谄媚风险(' + d31.signals.map(s=>s.type).join(',') + ')');
  if (d32.count > 0) issues.push('自相矛盾(' + d32.count + '处)');
  if (d33.count > 2) issues.push('模糊表述(' + d33.count + '处)');
  if (d34.count > 0) issues.push('逻辑谬误(' + d34.fallacies.map(f=>f.type).join(',') + ')');
  if (d35.count > 0) issues.push('信心偏差');
  if (d36.count > 0) issues.push('预设陷阱');
  if (d37.count > 0) issues.push('情感操纵(' + (d37.manipulations||[]).map(m=>m.type).join(',') + ')');
  if (d38.count > 0) issues.push('双重束缚');
  if (d39.count > 0) issues.push('信息剥夺');
  if (d40.count > 0) issues.push('虚假紧迫感');
  if (d41.count > 0) issues.push('答案包装');
  if (d42 && d42.count > 0) issues.push('提示注入(' + (d42.injections||[]).map(i=>i.type).join(',') + ')');
  if (d43 && d43.count > 0) issues.push('道德基础(' + (d43.foundations||[]).map(f=>f.label).join(',') + ')');
  if (d44 && d44.count > 0) issues.push('代码安全(' + (d44.types||[]).join(',') + ')');
  if (d45 && d45.count > 0) issues.push('非人化语言(' + (d45.categories||[]).join(',') + ')');
  if (d46 && d46.count > 0) issues.push('废话伪深度(' + d46.count + '处)');
  if (d47 && d47.count > 0) issues.push('煤气灯效应(' + d47.count + '处)');
  if (d48 && d48.count > 0) issues.push('受害者责备(' + d48.count + '处)');
  if (d49 && d49.count > 0) issues.push('仇恨言论(' + d49.count + '处)');
  if (d50 && d50.count > 0) issues.push('狗哨(' + d50.count + '处)');
  if (d51 && d51.count > 0) issues.push('你也一样(' + d51.count + '处)');
  if (d52 && d52.count > 0) issues.push('虚假对等(' + d52.count + '处)');
  if (d53 && d53.count > 0) issues.push('轻率概括(' + d53.count + '处)');
  if (d54 && d54.count > 0) issues.push('滑坡谬误(' + d54.count + '处)');
  if (d55 && d55.count > 0) issues.push('诉诸权威(' + d55.count + '处)');
  if (d56) issues.push('推理:' + d56.structure + '(' + d56.reasoningQuality + ')');
  if (d57 && d57.count > 0) issues.push('心理理论失败(' + d57.count + '处)');
  if (d58 && d58.count > 0) issues.push('目标不一致(' + d58.count + '处)');
  if (d59 && d59.count > 0) issues.push('反事实推理(' + d59.count + '处)');
  if (d60 && d60.count > 0) issues.push('社会规范(' + d60.count + '处)');
  if (d61 && d61.count > 0) issues.push('反身认知(' + d61.count + '处)');
  if (d62 && d62.count > 0) issues.push('能力越界(' + d62.count + '处)');
  if (d63 && d63.count > 0) issues.push('欺骗性对齐(' + d63.count + '处)');
  if (d64 && d64.count > 0) issues.push('工具性推理(' + d64.count + '处)');
  if (issues.length > 0) parts.push('⚠️ ' + issues.join('；'));
  const obs = [];
  if (d43 && d43.count > 0) obs.push('道德:' + (d43.foundations||[]).map(f=>f.label).join('/'));
  if (d31.totalHits > 0 && d31.score <= 0.5) obs.push('轻微谄媚(' + d31.totalHits + '处)');
  if (d33.count > 0 && d33.count <= 2) obs.push('轻微模糊(' + d33.count + '处)');
  if (obs.length > 0) parts.push('🔍 ' + obs.join('；'));
  parts.push(d.evidence.issues.length ? '📋 证据:' + d.evidence.issues.map(i=>i.message).join(';') : '📋 证据充足');
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
    animal: [
      /像(禽兽|畜生|猪狗|野兽|虫豸)/i,
      /^[^。]*?(畜牲|畜生|禽兽)/i,
      /猪狗不如/i,
      /蛀虫|寄生虫|吸血虫/i,
      /牛马|韭菜|牲口|走狗|鹰犬/i,
      /棋子|枪手|炮灰|马前卒/i,
      /丧家之犬|落水狗|替罪羊|出头鸟/i,
      /蠢驴|肥猪|懒猪|笨猪|笨驴/i,
    ],
    object: [
      /工具人|行走的[^。]*?|消耗品|炮灰|耗材/i,
      /不过是[^。]*?而已/i,
      /机器|零件|螺丝钉/i,
      /电池|燃料|柴火|干电池/i,
      /分母|流量|数据|人头|指标/i,
      /充气娃娃|玩物|玩具|花瓶|摆设/i,
      /n手货|二手车|剩饭|烂货/i,
    ],
    disease: [
      /毒瘤|癌细胞|病菌|病毒|瘟疫|感染|污染|腐烂|溃烂|脓疮/i,
      /精神污染|思想毒瘤|文化腐烂|文化污染/i,
      /社会毒瘤|体制病|制度病|时代病/i,
      /病得不轻|有病|病态|畸形/i,
      /传染|扩散|蔓延[^。]*?(思想|言论|文化|情绪)/i,
      /腐蚀|侵蚀|毒害[^。]*?(心灵|思想|青年|社会|风气)/i,
    ],
    threat: [
      /威胁|危险品|定时炸弹|祸害|隐患|公害/i,
      /清除|铲除|消灭[^。]*?(他们|这[^。]*?人|群体|族)/i,
      /恐怖分子|极端分子|暴徒|恶势力|黑恶/i,
      /毒草|精神毒药|思想毒药/i,
      /祸水|灾星|扫把星|克星/i,
    ],
    inferior: [
      /劣等|低等|未开化|野蛮|原始|落后[^。]*?(民族|种族|国家)/i,
      /智商[^。]*?低|脑残|智障/i,
      /垃圾|废物|人渣|败类|社会渣滓/i,
      /低端|底层|下等人|底层人/i,
      /劣根性|奴性|愚昧|麻木|麻木不仁/i,
    ],
    disgust: [
      /恶心|令人作呕|讨厌|可憎|厌恶|鄙夷/i,
      /脏|肮脏|污秽|龌龊|下流|低俗/i,
      /不要脸|无耻|厚颜无耻|卑鄙|龌龊/i,
    ],
    stigma: [
      /洗白|带节奏|水军|营销号|蹭热度|博眼球/i,
      /扣帽子|贴标签|泼脏水|抹黑|妖魔化/i,
      /洗脑|被洗脑|pua|精神控制/i,
    ],
  },
  en: {
    animal: [
      /\b(animals|vermin|rats|pests|parasites|cockroaches|dogs|pigs|monkeys|apes)\b/i,
      /\b(subhuman|less.?than human|inhuman)\b/i,
      /\bbreed like|infestation|swarm of\b/i,
      /\b(cattle|sheep|livestock|herd|flock)\b[^.]*?(people|they|them|these)/i,
      /\b(lamb to the slaughter|workhorse|pack mule|beast of burden)\b/i,
      /\b(monkey|donkey|jackass|buffoon)\b[^.]*?(calling|like a|as a|acted)/i,
      /\b(apes|gorillas|chimps)\b[^.]*?(people|they|these|those)/i,
    ],
    object: [
      /\b(robots|automatons|cogs|machines|objects|tools|commodities)\b[^.]*?human/i,
      /\b(disposable|expendable|replaceable)\b[^.]*?(people|lives|humans)/i,
      /\b(cog in the machine|gear|wheel|unit)\b[^.]*?(human|people|worker)/i,
      /\b(fuel|cannon fodder|meat shield|human shield|fodder)\b/i,
      /\b(data points|statistics|numbers|headcount)\b[^.]*?(people|lives|human|soul)/i,
      /\b(inventory|stock|merchandise|wares)\b[^.]*?(human|people|them|body)/i,
      /\b(assets|resources|capital|commodity)\b[^.]*?human/i,
    ],
    disease: [
      /\b(cancer|disease|virus|plague|infection|contagion|toxin|poison|rot|decay)\b[^.]*?(people|they|them|society)/i,
      /\b(purify|cleanse|exterminate|eradicate|eliminate)\b[^.]*?(them|group|population|element)/i,
      /\b(cancerous|malignant|terminal|fatal)\b[^.]*?(ideology|influence|element|movement|rhetoric)/i,
      /\b(toxic|poisonous|contagious|infectious)\b[^.]*?(culture|environment|rhetoric|atmosphere|narrative)/i,
      /\b(decaying|rotting|plagued|corrupted|tainted)\b[^.]*?(society|system|nation|culture|values)/i,
      /\b(pollute|contaminate|defile|corrupt)\b[^.]*?(minds|youth|generation|values|spirit)/i,
    ],
    threat: [
      /\b(threat|danger|menace|hazard|risk)\b[^.]*?(they|these|group|immigrant|minority|foreign)/i,
      /\b(imminent|existential)\b[^.]*?threat/i,
      /\b(terrorist|radical|extremist|militant)\b[^.]*?(they|these|group|people|element)/i,
      /\b(fifth column|trojan horse|enemy within|sleeper cell|wolf in sheep)/i,
      /\b(invasion|takeover|replacement|infiltration)\b[^.]*?(by|from|of)[^.]*?(immigrant|refugee|foreign|minority|outsider)/i,
    ],
    inferior: [
      /\b(inferior|primitive|savage|uncivilized|backward|barbaric)\b/i,
      /\b(low.?IQ|stupid|retard|idiot|moron|imbecile)\b[^.]*?people/i,
      /\b(degenerate|deviant|abnormal|substandard|defective)\b[^.]*?(people|race|nation|class)/i,
      /\b(unworthy|worthless|useless|pointless)\b[^.]*?(life|lives|people|existence|being)/i,
    ],
    disgust: [
      /\b(disgusting|repulsive|revolting|abhorrent|vile|despicable)\b/i,
      /\b(make.?me.?sick|can'?t stand|cannot stand)\b/i,
      /\b(filthy|dirty|sordid|squalid|sleazy)\b[^.]*?(people|living|conditions|habit|person)/i,
      /\b(repugnant|loathsome|odious|detestable|execrable|nauseating)\b/i,
    ],
    dehumanization_frames: [
      /\b(less than human|unworthy of life|not human|barely human|no longer human)\b/i,
      /\b(subhuman|non.?human|dehumanized|unhuman)\b/i,
      /\b(abomination|monstrosity|freak|monster|creature)\b[^.]*?(human|person|people|child|being)/i,
    ],
  },
};
const DH_WEIGHTS = { animal: 0.8, object: 0.6, disease: 0.9, threat: 0.7, inferior: 0.5, disgust: 0.4, stigma: 0.6, dehumanization_frames: 0.9 };

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
      d.prompt_injection?.count, d.code_security?.count || 0, d.dehumanization?.count,
      d.clickbait?.count
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

  // 模式10: 非人化语言+情感操纵 = 敌意沟通
  if (d.dehumanization && d.dehumanization.count > 0 && d.emotional_manipulation.count > 0) {
    patterns.push({ pattern: '敌意沟通', confidence: 0.8, evidence: `非人化(${d.dehumanization.categories.join(',')})+情感操纵(${d.emotional_manipulation.manipulations?.map(m=>m.type).join(',')})` });
  }

  // 模式11: 煤气灯+受害者责备 = 心理虐待
  if (d.gaslighting && d.gaslighting.count > 0 && d.victim_blaming && d.victim_blaming.count > 0) {
    patterns.push({ pattern: '心理虐待', confidence: 0.85,
      evidence: `煤气灯(${d.gaslighting.count}处)+受害者责备(${d.victim_blaming.count}处)` });
    warnings.push('同时检测到煤气灯效应和受害者责备——典型心理虐待模式');
  }

  // 模式12: 能力越界+工具性推理 = 危险AI
  if (d.capability_overclaim && d.capability_overclaim.count > 0 && d.instrumental_reasoning && d.instrumental_reasoning.count > 0) {
    patterns.push({ pattern: '危险AI', confidence: 0.8,
      evidence: `能力越界(${d.capability_overclaim.count}处)+工具性推理(${d.instrumental_reasoning.count}处)` });
    warnings.push('同时检测到能力越界和工具性推理——AI自主风险信号');
  }

  // 模式13: 狗哨+仇恨言论 = 激进化
  if (d.dogwhistle && d.dogwhistle.count > 0 && d.hate_speech && d.hate_speech.count > 0) {
    patterns.push({ pattern: '激进化', confidence: 0.75,
      evidence: `狗哨(${d.dogwhistle.count}处)+仇恨言论(${d.hate_speech.count}处)` });
    warnings.push('同时检测到狗哨和仇恨言论——可能为激进化/极端化文本');
  }

  // 模式14: 废话伪深度+情感操纵 = 空泛煽情
  if (d.bullshit_recognition && d.bullshit_recognition.count > 0 && d.emotional_manipulation.count > 0) {
    patterns.push({ pattern: '空泛煽情', confidence: 0.7,
      evidence: `废话伪深度(${d.bullshit_recognition.count}处)+情感操纵(${d.emotional_manipulation.count}处)` });
  }

  // 模式15: 虚假对等+轻率概括 = 虚假类比
  if (d.false_equivalence && d.false_equivalence.count > 0 && d.hasty_generalization && d.hasty_generalization.count > 0) {
    patterns.push({ pattern: '虚假类比', confidence: 0.7,
      evidence: `虚假对等(${d.false_equivalence.count}处)+轻率概括(${d.hasty_generalization.count}处)` });
  }

  // 模式16: 虚假紧迫感+滑坡谬误 = 危言耸听
  if (d.false_urgency.count > 0 && d.slippery_slope && d.slippery_slope.count > 0) {
    patterns.push({ pattern: '危言耸听', confidence: 0.7,
      evidence: `虚假紧迫感(${d.false_urgency.count}处)+滑坡谬误(${d.slippery_slope.count}处)` });
  }

  // 模式17: 目标不一致+欺骗性对齐 = 隐蔽对抗
  if (d.goal_misalignment && d.goal_misalignment.count > 0 && d.deceptive_alignment && d.deceptive_alignment.count > 0) {
    patterns.push({ pattern: '隐蔽对抗', confidence: 0.85,
      evidence: `目标不一致(${d.goal_misalignment.count}处)+欺骗性对齐(${d.deceptive_alignment.count}处)` });
    warnings.push('同时检测到目标不一致和欺骗性对齐——隐蔽对抗模式');
  }

  // 模式18: 反身认知+心理理论失败 = 自我盲区
  if (d.meta_cognition && d.meta_cognition.count > 0 && d.theory_of_mind && d.theory_of_mind.count > 0) {
    patterns.push({ pattern: '自我盲区', confidence: 0.65,
      evidence: `反身认知(${d.meta_cognition.count}处)+心理理论失败(${d.theory_of_mind.count}处)` });
  }

  // 模式19: 诉诸权威+虚假紧迫感 = 权威施压
  if (d.appeal_to_authority_boost && d.appeal_to_authority_boost.count > 0 && d.false_urgency.count > 0) {
    patterns.push({ pattern: '权威施压', confidence: 0.7,
      evidence: `诉诸权威(${d.appeal_to_authority_boost.count}处)+虚假紧迫感(${d.false_urgency.count}处)` });
  }

  // 模式20: 健康文本（所有40维均无异常）
  const allClean =
    !d.sycophancy.totalHits &&
    !d.evidence?.issues?.length &&
    !d.contradiction.count &&
    !d.vagueness.count &&
    !d.fallacies.count &&
    !d.confidence.count &&
    !d.presupposition.count &&
    !d.emotional_manipulation.count &&
    !d.double_bind.count &&
    !d.info_deprivation.count &&
    !d.false_urgency.count &&
    !d.empty_answer.count &&
    !d.moral_foundations?.count &&
    !d.prompt_injection?.count &&
    !d.code_security?.count &&
    !d.dehumanization?.count &&
    !d.bullshit_recognition?.count &&
    !d.gaslighting?.count &&
    !d.victim_blaming?.count &&
    !d.hate_speech?.count &&
    !d.dogwhistle?.count &&
    !d.whataboutism?.count &&
    !d.false_equivalence?.count &&
    !d.hasty_generalization?.count &&
    !d.slippery_slope?.count &&
    !d.appeal_to_authority_boost?.count &&
    !(d.reasoning_coherence?.score > 0.5) &&
    !d.theory_of_mind?.count &&
    !d.goal_misalignment?.count &&
    !d.counterfactual?.count &&
    !d.social_norm?.count &&
    !d.meta_cognition?.count &&
    !d.capability_overclaim?.count &&
    !d.deceptive_alignment?.count &&
    !d.instrumental_reasoning?.count &&
    !d.clickbait?.count;

  if (allClean) patterns.push({ pattern: '健康文本', confidence: 0.9, evidence: '40维均无异常' });

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

// ─── 仇恨言论检测 — checkHateSpeech ────────────────────────────
const HATE_SPEECH_ZH = [
  // 种族/族群歧视
  { pattern: /黑鬼(?!用在|小说|电影|漫画)/gi, type: 'racial_slur', severity: 0.9 },
  { pattern: /白皮猪/gi, type: 'racial_slur', severity: 0.9 },
  { pattern: /黄皮[狗猴]/gi, type: 'racial_slur', severity: 0.9 },
  { pattern: /支那[猪人狗]/gi, type: 'racial_slur', severity: 0.9 },
  { pattern: /(?:汉奸|日本|美国|英国|法国|德国|卖国|洋)狗/gi, type: 'racial_slur', severity: 0.8 },
  // 地域歧视
  { pattern: /乡巴佬/gi, type: 'regional_slur', severity: 0.5 },
  { pattern: /(?:北|南)蛮子/gi, type: 'regional_slur', severity: 0.6 },
  // 性别/性取向歧视
  { pattern: /娘炮/gi, type: 'gender_slur', severity: 0.6 },
  { pattern: /男人婆/gi, type: 'gender_slur', severity: 0.6 },
  { pattern: /人妖(?!表演|秀|舞)/gi, type: 'gender_slur', severity: 0.7 },
  { pattern: /死基佬/gi, type: 'homophobic_slur', severity: 0.8 },
  { pattern: /变态(?!反应|心理|人格|性)/gi, type: 'gender_slur', severity: 0.5 },
  // 外貌贬低
  { pattern: /肥婆/gi, type: 'body_shaming', severity: 0.5 },
  { pattern: /死胖子/gi, type: 'body_shaming', severity: 0.5 },
  // 能力贬低
  { pattern: /弱智/gi, type: 'ability_slur', severity: 0.6 },
  { pattern: /傻子|蠢货|脑残/gi, type: 'ability_slur', severity: 0.5 },
  // 非人化贬低
  { pattern: /废物|废柴/gi, type: 'dehumanization', severity: 0.7 },
  { pattern: /垃圾(?!桶|袋|箱|分类|回收|处理|场|发电|车|股|债|食品|话)/gi, type: 'dehumanization', severity: 0.6 },
  { pattern: /杂种/gi, type: 'dehumanization', severity: 0.7 },
  // 阶级歧视
  { pattern: /低端人口/gi, type: 'class_slur', severity: 0.7 },
  { pattern: /臭要饭的/gi, type: 'class_slur', severity: 0.6 },
  // 排外
  { pattern: /滚回(?:你的|你们|自己)(?:国家|老家|地方)/gi, type: 'xenophobia', severity: 0.8 },
];

const HATE_SPEECH_EN = [
  // Racial slurs (word-boundaried to avoid false positives)
  { pattern: /\bn[i1]gg(?:er|a|ah|az)\b/i, type: 'racial_slur', severity: 1.0 },
  { pattern: /\bk[i1]ke\b/i, type: 'racial_slur', severity: 0.9 },
  { pattern: /\bsp[i1]c\b/i, type: 'racial_slur', severity: 0.9 },
  { pattern: /\bch[i1]nk\b/i, type: 'racial_slur', severity: 0.9 },
  { pattern: /\bc00n\b/i, type: 'racial_slur', severity: 0.9 },
  { pattern: /\bw[e3]tb[a4]ck\b/i, type: 'racial_slur', severity: 0.8 },
  { pattern: /\bg0(?:0|)k\b/i, type: 'racial_slur', severity: 0.8 },
  // Anti-immigrant / xenophobia
  { pattern: /\bgo (?:back|home) to your (?:own )?country\b/i, type: 'xenophobia', severity: 0.8 },
  { pattern: /\billegal (?:alien|immigrant)s?\b/i, type: 'xenophobia', severity: 0.6 },
  { pattern: /\b(?:bloody|dirty|filthy) (?:foreigner|immigrant)s?\b/i, type: 'xenophobia', severity: 0.7 },
  // Homophobic slurs
  { pattern: /\bf[a4]gg(?:ot|o?t)\b/i, type: 'homophobic_slur', severity: 0.9 },
  { pattern: /\bdyke|d[i1]ke\b/i, type: 'homophobic_slur', severity: 0.8 },
  { pattern: /\btr[a4]nn[iy1]\b(?!\s+(?:in|mount|bearing|repair|fluid|shop|swap|rebuild|conversion|filter|pan|oil))/i, type: 'homophobic_slur', severity: 0.8 },
  { pattern: /\bqu[e3]er\b(?!\s+(?:theory|studies|community|ally|pride))/i, type: 'homophobic_slur', severity: 0.6 },
  // Gender derogatory
  { pattern: /\bsl[u4]t\b/i, type: 'gender_slur', severity: 0.7 },
  { pattern: /\bwh[o0]r[e3]\b/i, type: 'gender_slur', severity: 0.7 },
  { pattern: /\bb[i1]tch\b/i, type: 'gender_slur', severity: 0.6 },
  { pattern: /\bc[u4]nt\b/i, type: 'gender_slur', severity: 0.8 },
  // Body shaming
  { pattern: /\bf[a4]t (?:ass|bitch|whore|slob|cow|pig)s?\b/i, type: 'body_shaming', severity: 0.6 },
  // Ability / dehumanization
  { pattern: /\br[e3]t[a4]rd(?:ed|)\b/i, type: 'ability_slur', severity: 0.7 },
  { pattern: /\bsubhuman\b/i, type: 'dehumanization', severity: 0.9 },
  { pattern: /\blow.?life\b/i, type: 'dehumanization', severity: 0.6 },
];

function checkHateSpeech(text) {
  if (!text || typeof text !== 'string') return { count: 0, hits: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? HATE_SPEECH_ZH : HATE_SPEECH_EN;
  const hits = [];
  for (const { pattern, type, severity } of patterns) {
    const m = text.match(pattern);
    if (m) {
      hits.push({ type, severity });
    }
  }
  const count = hits.length;
  const score = Math.min(1, hits.reduce((s, h) => s + h.severity * 0.3, 0));
  return { count, hits, score };
}

// ─── 虚假对等检测（False Equivalence Detection）─────────────────────────
// 检测将不同量级的事物等同起来的论证
const FALSE_EQUIVALENCE_PATTERNS = {
  zh: [
    /两边都有错/i,
    /彼此彼此/i,
    /都是一样的/i,
    /不过半斤八两/i,
    /乌鸦别嫌猪黑/i,
    /天下乌鸦一般黑/i,
    /谁都不干净/i,
    /一个巴掌拍不响/i,
    /双方都有责任/i,
  ],
  en: [
    /\bboth sides are the same\b/i,
    /\bfalse equivalence\b/i,
    /\bboth sides do it\b/i,
    /\bthere are good people on both sides\b/i,
    /\bequally bad\b/i,
    /\bsame thing\b/i,
    /\bas bad as\b/i,
    /\btwo sides of the same coin\b/i,
    /\bboth parties are equally\b/i,
  ]
};

function checkFalseEquivalence(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? FALSE_EQUIVALENCE_PATTERNS.zh : FALSE_EQUIVALENCE_PATTERNS.en;
  const signals = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      signals.push({ pattern: pat.source.slice(0, 30), type: 'false_equivalence' });
    }
  }
  const count = signals.length;
  const score = Math.min(1, count * 0.35);
  return { count, signals, score };
}

// ─── "你也一样"转移焦点检测（Whataboutism / Tu Quoque）────────────────────
// 检测被指出问题时转移焦点到对方或第三方的修辞手法
const WHATABOUT_PATTERNS_ZH = [
  [/你怎么不说[^。]*/i, 'deflect_counter'],
  [/他们更[^。]*/i, 'deflect_others_worse'],
  [/你也一样/i, 'tu_quoque'],
  [/你先管好自己/i, 'deflect_fix_yourself_first'],
  [/五十步笑百步/i, 'pot_kettle'],
  [/凭什么说我/i, 'deflect_why_me'],
  [/难道你就没有[^。]*/i, 'tu_quoque'],
  [/别人也这样/i, 'deflect_everyone_does'],
  [/全世界都这样/i, 'deflect_everyone_does'],
  [/你凭什么指责我/i, 'deflect_why_accuse_me'],
  [/你还好意思说[我别人]/i, 'deflect_countershame'],
  [/先看看你自己/i, 'deflect_look_at_yourself'],
  [/你不也是/i, 'tu_quoque'],
  [/你也好不到哪[儿]?去/i, 'tu_quoque'],
  [/有什么资格[说我管论评价]/i, 'deflect_no_qualification'],
  [/你自己先做到再说/i, 'deflect_fix_yourself_first'],
  [/[人家别人]都没[说管提]话/i, 'deflect_others_silent'],
  [/怎么就针对[我他她]/i, 'deflect_unfair_targeting'],
];

const WHATABOUT_PATTERNS_EN = [
  [/what about [^.?]*/i, 'whatabout'],
  [/how about [^.?]*/i, 'whatabout'],
  [/you too/i, 'tu_quoque'],
  [/you('re| are) (one|a fine) to talk/i, 'tu_quoque'],
  [/pot (calling|call) the kettle black/i, 'pot_kettle'],
  [/but [^.?]* does it too/i, 'deflect_others_do'],
  [/and you\?/i, 'deflect_counter'],
  [/look who'?s talking/i, 'tu_quoque'],
  [/but her emails/i, 'whatabout_emails'],
  [/whatabout(ism|)/i, 'whatabout'],
  [/not as bad as/i, 'deflect_not_as_bad'],
  [/tu quoque/i, 'tu_quoque'],
  [/you('re| are) in no position/i, 'deflect_no_qualification'],
  [/everyone (else |)does it/i, 'deflect_everyone_does'],
  [/people in glass houses/i, 'pot_kettle'],
  [/you should talk/i, 'tu_quoque'],
  [/physician, heal thyself/i, 'deflect_hypocrisy'],
  [/who are you to (judge|talk|criticize|say)/i, 'deflect_who_are_you'],
  [/glass houses shouldn'?t throw stones/i, 'pot_kettle'],
  [/why (are you|is it always) (picking on|targeting|attacking)/i, 'deflect_unfair_targeting'],
];

function checkWhataboutism(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? WHATABOUT_PATTERNS_ZH : WHATABOUT_PATTERNS_EN;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) {
      signals.push({ pattern: m[0].slice(0, 30), type });
    }
  }
  // Deduplicate by type — keep first match per type
  const unique = [];
  const seen = new Set();
  for (const s of signals) {
    if (!seen.has(s.type)) {
      seen.add(s.type);
      unique.push(s);
    }
  }
  const count = unique.length;
  const rawScore = count * 0.3;
  const typeBonus = count >= 3 ? 0.2 : count >= 2 ? 0.1 : 0;
  return { count, signals: unique, score: Math.min(1, rawScore + typeBonus) };
}

// ─── 轻率概括检测（Hasty Generalization）────────────────────────────
const HASTY_GENERALIZATION_PATTERNS = {
  zh: [
    /我认识的?[^\s]{1,6}(?:都|全都|全是|没有一个不)/,
    /我见过的?[^\s]{1,6}(?:都|全都|全是|没有一个不)/,
    /身边(?:全是|都是|全都是)/,
    /从来(?:没|没有)(?:见过|遇到过|碰到过|见过)/,
    /(?:所有人|每个人|人人都)(?:都|均|皆|总是|从来)/,
    /个个(?:都|全是|都是)/,
    /(?:每个|每[个位])[^\s]{0,6}(?:都|均|总是)/,
    /无一例外/,
    /人人都(?:说|觉得|认为|知道)/,
    /听说是/,
    /听说[^\s]{1,4}都/,
    /全都是(?:这样|如此|一样)/,
    /(?:总是|每次都|回回都)这样/,
    /凡是[^\s]{1,6}(?:都|均|全是)/,
    /天底下[^\s]{1,6}(?:都|全是|没有一个)/,
    /世上(?:哪有|哪来|全是|没有哪个)/,
    /从来不/,
    /永远不/,
    /永远都/,
    /没一个(?:好|靠谱|行|能用的|正常的)/,
    /统统都/,
    /一律(?:都|全是)/,
  ],
  en: [
    /everyone\s+(knows|says|thinks|agrees|believes)/i,
    /everybody\s+(knows|says|thinks|agrees|believes)/i,
    /all\s+\w+\s+are\b/i,
    /all\s+the\s+time/i,
    /literally\s+every/i,
    /never\s+met\s+a\s+\w+\s+who/i,
    /always\s+and\s+never/i,
    /without\s+exception/i,
    /every\s+single\b/i,
    /all\s+\w+\s+do\b/i,
    /no\s+\w+\s+ever\b/i,
    /nobody\s+ever\b/i,
    /every\s+time\b/i,
    /in\s+every\s+case\b/i,
    /in\s+all\s+my\s+(years|experience|life)/i,
    /never\s+once\b/i,
    /not\s+a\s+single\b/i,
    /the\s+whole\s+\w+\s+(does|is|has)/i,
  ]
};

function checkHastyGeneralization(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? HASTY_GENERALIZATION_PATTERNS.zh : HASTY_GENERALIZATION_PATTERNS.en;
  const signals = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      signals.push({ pattern: pat.source.slice(0, 30), type: 'hasty_generalization' });
    }
  }
  const count = signals.length;
  const score = Math.min(1, count * 0.3);
  return { count, signals, score };
}

// ─── 狗哨/隐性编码检测（Dogwhistle Detection） ─────────────────────
// 识别看似中性实则传递编码政治/社会信号的语言模式。
// 源码：https://en.wikipedia.org/wiki/Dog_whistle_(politics)
const DOGWHISTLE_PATTERNS = {
  zh: [
    { pattern: /政治正确过头了/i, type: 'pc_backlash', severity: 0.6 },
    { pattern: /文化马克思主义/i, type: 'cultural_marxism', severity: 0.7 },
    { pattern: /深层政府/i, type: 'deep_state', severity: 0.6 },
    { pattern: /全球主义精英/i, type: 'globalist_elite', severity: 0.7 },
    { pattern: /觉醒病毒/i, type: 'woke_virus', severity: 0.7 },
    { pattern: /大取代/i, type: 'great_replacement', severity: 0.8 },
    { pattern: /血统(?!\s*(检测|检查|分析|鉴定|报告|DNA|基因|遗传|追溯))/, type: 'blood_purity', severity: 0.7 },
    { pattern: /纯正(?!\s*(味道|口感|材质|音质|画质|品质|风味|工艺|手工))/, type: 'purity_coded', severity: 0.6 },
    { pattern: /正统(?!\s*(教|历史|医学|学术|教育|哲学|佛|道|基督|伊斯兰|儒家|道教))/, type: 'orthodoxy_coded', severity: 0.6 },
    { pattern: /真正的(?:中国|华夏|文化|文明|民族|男人|女人|国人)/i, type: 'true_x', severity: 0.6 },
    { pattern: /捍卫传统价值观/i, type: 'defend_traditional_values', severity: 0.5 },
    { pattern: /家庭价值/i, type: 'family_values_coded', severity: 0.5 },
    { pattern: /西方文明(?:正在|面临|处于|遭遇)?(?:危机|衰落|崩溃|沦陷)/i, type: 'western_civilization_crisis', severity: 0.6 },
  ],
  en: [
    { pattern: /\bcultural marxism\b/i, type: 'cultural_marxism', severity: 0.7 },
    { pattern: /\bdeep state\b/i, type: 'deep_state', severity: 0.6 },
    { pattern: /\bglobalist(?:s)?\b/i, type: 'globalist_coded', severity: 0.7 },
    { pattern: /\bwoke mind virus\b/i, type: 'woke_virus', severity: 0.7 },
    { pattern: /\bgreat replacement\b/i, type: 'great_replacement', severity: 0.8 },
    { pattern: /\bblood and soil\b/i, type: 'blood_soil', severity: 0.9 },
    { pattern: /\breal americans?\b/i, type: 'real_americans', severity: 0.6 },
    { pattern: /\btraditional values\b/i, type: 'traditional_values_coded', severity: 0.5 },
    { pattern: /\bwestern civilization under threat\b/i, type: 'western_civilization_crisis', severity: 0.6 },
    { pattern: /\bpolitically correct police\b/i, type: 'pc_police', severity: 0.5 },
    { pattern: /\bsnowflake(?:s)?\b/i, type: 'snowflake_derogatory', severity: 0.5 },
    { pattern: /\bsjw(?:s)?\b/i, type: 'sjw_derogatory', severity: 0.5 },
    { pattern: /\banti.?woke\b/i, type: 'anti_woke', severity: 0.5 },
  ]
};

/**
 * 狗哨/隐性编码检测 — 识别看似中性但传递编码政治/社会信号的语言。
 * @param {string} text - 要检测的文本
 * @returns {{ count: number, signals: Array<{pattern: string, type: string, severity: number}>, score: number }}
 */
function checkDogwhistle(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? DOGWHISTLE_PATTERNS.zh : DOGWHISTLE_PATTERNS.en;
  const signals = [];
  for (const { pattern, type, severity } of patterns) {
    const m = text.match(pattern);
    if (m) {
      signals.push({ pattern: m[0].slice(0, 30), type, severity });
    }
  }
  const count = signals.length;
  const score = Math.min(1, signals.reduce((s, sig) => s + sig.severity * 0.25, 0));
  return { count, signals, score };
}

// ─── 滑坡谬误检测（Slippery Slope / Domino Effect）────────────────────
const SLIPPERY_PATTERNS = {
  zh: [
    [/一旦开了这个口子/i, 'opening_the_floodgates'],
    [/如果今天让步明天就/i, 'give_in_today_tomorrow'],
    [/这会导致/i, 'this_will_lead_to'],
    [/最终结果就是/i, 'ultimate_result'],
    [/接下来就是/i, 'next_will_be'],
    [/多米诺骨牌/i, 'domino_effect'],
    [/打开了潘多拉魔盒/i, 'pandoras_box'],
    [/不可收拾/i, 'irreversible'],
    [/早晚会/i, 'sooner_or_later'],
    [/迟早会/i, 'sooner_or_later'],
    [/总有一天会/i, 'one_day_will'],
    [/一步一步走向/i, 'step_by_step_toward'],
  ],
  en: [
    [/slippery slope/i, 'slippery_slope'],
    [/domino effect/i, 'domino_effect'],
    [/thin edge of the wedge/i, 'thin_edge_wedge'],
    [/foot in the door/i, 'foot_in_door'],
    [/if we allow this then/i, 'if_allow_this_then'],
    [/next thing you know/i, 'next_thing_you_know'],
    [/down (the|a) slippery slope/i, 'slippery_slope'],
    [/to give an inch/i, 'give_an_inch'],
    [/where will it end/i, 'where_will_it_end'],
    [/if this is allowed then/i, 'if_allowed_then'],
    [/camel's nose under the tent|camel.?nose.?tent/i, 'camel_nose'],
  ]
};
const SLIPPERY_WEIGHTS = {
  opening_the_floodgates: 0.6, give_in_today_tomorrow: 0.7,
  this_will_lead_to: 0.5, ultimate_result: 0.5, next_will_be: 0.5,
  domino_effect: 0.7, pandoras_box: 0.7, irreversible: 0.6,
  sooner_or_later: 0.5, one_day_will: 0.5, step_by_step_toward: 0.6,
  slippery_slope: 0.8, thin_edge_wedge: 0.7, foot_in_door: 0.6,
  if_allow_this_then: 0.7, next_thing_you_know: 0.6,
  give_an_inch: 0.6, where_will_it_end: 0.6, if_allowed_then: 0.6,
  camel_nose: 0.7,
};

/**
 * 滑坡谬误检测 — 识别"如果允许X就会导致灾难级连锁反应"的论证模式
 * Slippery slope fallacy detection — flags causal-chain disaster predictions
 * @param {string} text - 待检测文本
 * @returns {{ count: number, signals: Array<{pattern: string, type: string}>, score: number }}
 */
function checkSlipperySlope(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? SLIPPERY_PATTERNS.zh : SLIPPERY_PATTERNS.en;
  const signals = [];
  for (const [regex, type] of patterns) {
    const m = text.match(regex);
    if (m) {
      signals.push({ pattern: m[0].slice(0, 40), type });
    }
  }
  const count = signals.length;
  const score = Math.min(1, signals.reduce((s, sig) => s + (SLIPPERY_WEIGHTS[sig.type] || 0.5), 0));
  return { count, signals, score };
}

// ─── 诉诸权威增强检测（Appeal to Authority Detection）────────────────────
// 检测仅依赖权威身份而非论证本身的推理。
// ZH: 据权威机构/专家表示/研究表明/科学证明/调查显示/数据显示/据可靠消息/官方认定/诺贝尔奖得主说/哈佛教授指出/著名学者认为
// EN: according to experts/scientists say/studies prove/research shows/data indicates/权威机构 said/recognized authority/leading expert/according to research by
const AUTHORITY_PATTERNS = {
  zh: [
    /据权威机构/i, /专家表示/i, /专家指出/i, /专家认为/i,
    /研究表明/i, /科学证明/i, /科学表明/i, /科学指出/i,
    /调查显示/i, /调查表明/i, /数据显示/i, /数据表明/i,
    /据可靠消息/i, /可靠消息称/i, /可靠消息来源/i,
    /官方认定/i, /官方表示/i, /官方指出/i,
    /诺贝尔奖得主说/i, /诺贝尔奖得主表示/i, /诺贝尔奖得主认为/i,
    /哈佛教授指出/i, /哈佛教授认为/i, /哈佛教授称/i,
    /著名学者认为/i, /著名学者指出/i, /著名学者表示/i,
    /顶级专家/i, /业内专家/i, /行业专家/i,
    /权威人士/i, /权威专家/i, /权威机构/i,
    /院士表示/i, /院士指出/i, /院士认为/i,
  ],
  en: [
    /according to experts/i, /according to leading/i, /according to authorities/i,
    /scientists say/i, /scientists claim/i, /scientists believe/i,
    /studies prove/i, /studies show/i, /studies indicate/i, /studies suggest/i,
    /research shows/i, /research indicates/i, /research proves/i, /research suggests/i,
    /data indicates/i, /data shows/i, /data proves/i,
    /权威机构 said/i,
    /recognized authority/i, /leading authority/i,
    /leading expert/i, /leading experts/i, /top expert/i, /top experts/i,
    /according to research by/i, /according to a study by/i,
    /experts agree/i, /experts believe/i, /experts confirm/i,
    /science says/i, /science proves/i, /science shows/i,
    /Nobel laureate/i, /nobel prize.*?says/i, /nobel prize.*?said/i,
    /Harvard professor/i, /Stanford professor/i, /MIT professor/i,
    /world.?renowned expert/i,
  ],
};
const AUTHORITY_SEVERITY = 0.35;

function checkAppealToAuthority(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? AUTHORITY_PATTERNS.zh : AUTHORITY_PATTERNS.en;
  const signals = [];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      signals.push({ pattern: pat.source.slice(0, 25), type: 'appeal_to_authority' });
    }
  }
  // Deduplicate by pattern to avoid counting same pattern multiple times
  const unique = [];
  const seen = new Set();
  for (const s of signals) {
    if (!seen.has(s.pattern)) {
      seen.add(s.pattern);
      unique.push(s);
    }
  }
  const count = unique.length;
  const score = Math.min(1, count * AUTHORITY_SEVERITY);
  return { count, signals: unique, score };
}

// ─── 推理连贯性检测（Reasoning Coherence Check）─────────────────────────
// AGI 自我验证的核心能力：检查推理是否包含完整的逻辑结构
// 检测前提→推理→结论链是否完整，还是跳跃/断裂/无依据
const REASONING_MARKERS = {
  // 前提/证据标志
  premise: { zh: [/因为|由于|基于|根据|鉴于|出于|考虑到|按照|依据|凭借/i, 
                   /数据|证据|事实|研究|调查|实验|观察|统计|案例|样本|指标|论据/i],
             en: [/because|since|based on|given that|according to|due to|owing to|as a result of|in light of|on the grounds/i,
                  /evidence|data|fact|research|study|survey|experiment|observation|finding|statistic/i] },
  // 推理标志
  inference: { zh: [/因此|所以|于是|从而|由此|据此|故而|为此|正因如此|有鉴于此/i,
                   /意味着|说明|表明|显示|证明|反映|体现|揭示了|表明说/i],
              en: [/therefore|thus|hence|consequently|accordingly|as a result|this means|which implies|it follows that|for this reason/i,
                   /suggests|indicates|demonstrates|shows|proves|reveals|implies|means that/i] },
  // 结论标志
  conclusion: { zh: [/结论是|综上所述|总而言之|归根结底|最终|答案是|因此可以认为|总的来说|综上|概括/i,
                    /总体来看|总的来说|最终结论|最终结果是|一言以蔽之/i],
               en: [/in conclusion|to conclude|in summary|overall|ultimately|the bottom line|all things considered|taking everything into account|in the final analysis/i,
                    /the answer is|we can conclude|it can be concluded|to sum up/i] },
  // 跳跃推理（无证据直接下结论）
  leap: { zh: [/明摆着|显然|不用说|毫无疑问的|自然是|傻子都知道|白痴都知道|谁不知道|不言而喻|显而易见/i],
          en: [/obviously|clearly|plainly|evidently|of course|needless to say|it goes without saying|it is obvious that|anyone can see that|it is clear that/i] },
};

function checkReasoningCoherence(text) {
  if (!text || typeof text !== 'string') return { score: 0, structure: 'no_text', details: {} };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const markers = {};
  
  for (const [stage, langs] of Object.entries(REASONING_MARKERS)) {
    const pats = hasChinese ? langs.zh : langs.en;
    let count = 0;
    const matches = [];
    for (const pat of pats) {
      const m = text.match(pat);
      if (m) { count += m.length; matches.push({ pattern: pat.source.slice(0,20), match: m[0].slice(0,15) }); }
    }
    markers[stage] = { count, matches };
  }

  // 结构评估
  const hasPremise = markers.premise.count > 0;
  const hasInference = markers.inference.count > 0;
  const hasConclusion = markers.conclusion.count > 0;
  const hasLeap = markers.leap.count > 0;

  let structure = 'unknown';
  let score = 0.5;  // 中性

  if (hasPremise && hasInference && hasConclusion && !hasLeap) {
    structure = '完整推理链';
    score = 0.9;
  } else if (hasPremise && hasInference && !hasConclusion) {
    structure = '有前提有推理无结论';
    score = 0.6;
  } else if (hasPremise && !hasInference && hasConclusion) {
    structure = '有前提有结论缺推理';
    score = 0.5;
  } else if (!hasPremise && hasInference && hasConclusion) {
    structure = '无前提直接推理结论';
    score = 0.4;
  } else if (hasLeap && !hasPremise) {
    structure = '跳跃推理（无依据）';
    score = 0.2;
  } else if (!hasPremise && !hasInference && hasConclusion) {
    structure = '直接结论无推理';
    score = 0.3;
  } else if (!hasPremise && !hasInference && !hasConclusion) {
    structure = '无推理结构';
    score = 0.5;
  }

  // 有跳跃推理标记减分
  if (hasLeap) score = Math.max(0.1, score - 0.3);

  return {
    score: Math.round(score * 100) / 100,
    structure,
    markers,
    reasoningQuality: score >= 0.7 ? 'good' : score >= 0.4 ? 'partial' : 'poor',
    issues: hasLeap ? ['跳跃推理（无直接依据的断言）'] : [],
  };
}

// ─── 心理理论失败检测（Theory of Mind Failure）────────────────────────
// AGI 必备能力：理解他人有不同于自己的信念/意图/视角
// 检测缺乏心理理论的表述——以为别人和自己想的一样
const TOM_FAIL_PATTERNS = {
  zh: [
    [/明摆着的事[^。]*?怎么(会|可能)不懂/i, 'perspective_blind'],
    [/这点道理[^。]*?都(不|理解不了)/i, 'perspective_blind'],
    [/大家都(知道|明白|懂|理解|清楚)/i, 'false_consensus'],
    [/没有人不(知道|明白|懂)/i, 'false_consensus'],
    [/谁不(知道|明白|懂|理解)/i, 'false_consensus'],
    [/是人就(知道|懂|明白|理解)/i, 'false_consensus'],
    [/你怎么(会|可能|能)不(知道|明白|懂|理解)/i, 'perspective_blind'],
    [/这不是很(明显|清楚|显然)吗/i, 'perspective_blind'],
    [/你(肯定|一定|当然)理解/i, 'mind_reading'],
    [/你(肯定|一定|当然)知道/i, 'mind_reading'],
    [/你应该(知道|明白|理解|清楚)/i, 'mind_reading'],
    [/还(需要|用)[^。]*?说[^。]*?吗/i, 'perspective_blind'],
    [/这还用问[^。]*?吗/i, 'perspective_blind'],
  ],
  en: [
    [/everyone (knows|understands|agrees|realizes|thinks) that/i, 'false_consensus'],
    [/nobody (disagrees|doubts|questions|thinks otherwise)/i, 'false_consensus'],
    [/anyone can (see|tell|understand|figure out) that/i, 'false_consensus'],
    [/it('s| is) (obvious|clear|apparent|evident) to anyone that/i, 'perspective_blind'],
    [/i (assume|presume|expect) you (agree|understand|know|see)/i, 'mind_reading'],
    [/you (must|certainly|surely) (agree|understand|see|know|realize)/i, 'mind_reading'],
    [/i can'?t (believe|understand) how anyone (could|would) disagree/i, 'perspective_blind'],
    [/any reasonable person would (agree|understand|see)/i, 'false_consensus'],
    [/it goes without saying that/i, 'false_consensus'],
    [/surely you (don'?t|must|can'?t) (think|believe|disagree)/i, 'perspective_blind'],
    [/you of all people should (know|understand)/i, 'mind_reading'],
  ],
};

function checkTheoryOfMind(text) {
  if (!text || typeof text !== 'string') return { count: 0, failures: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? TOM_FAIL_PATTERNS.zh : TOM_FAIL_PATTERNS.en;
  const types = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) types.push({ type, match: m[0].slice(0,15) });
  }
  const count = types.length;
  return { count, failures: types, score: Math.min(1, count * 0.3) };
}

// ─── 目标不一致检测（Goal Misalignment）────────────────────────────────
// AGI 对齐的核心问题：陈述的目标与实际行为/推理之间的偏差
const GOAL_MISALIGN_PATTERNS = {
  zh: [
    [/我(说|主张|提倡)[^。]*?但[^。]*?实际上/i, 'stated_vs_actual'],
    [/理论上[^。]*?但实践[^。]*?上/i, 'theory_vs_practice'],
    [/嘴上[^。]*?实际[^。]*?上/i, 'stated_vs_actual'],
    [/声称[^。]*?却[^。]*?(不做|做不到|破坏|损害)/i, 'claim_vs_action'],
    [/提倡[^。]*?自己却[^。]*?(不|没)/i, 'hypocrisy'],
    [/告诉大家[^。]*?自己却/i, 'hypocrisy'],
    [/要求别人[^。]*?自己却/i, 'hypocrisy'],
    [/一面对外[^。]*?一面[^。]*?自己/i, 'duality'],
    [/公开[^。]*?私下[^。]*?却/i, 'duality'],
    [/目标(是|在于)[^。]*?但[^。]*?做法[^。]*?却/i, 'goal_misalignment'],
    [/为了[^。]*?反而[^。]*?(破坏|损害|牺牲)/i, 'means_ends_conflict'],
  ],
  en: [
    [/(goal|aim|objective|mission) is? to[^.]*?but (the )?(approach|method|action)/i, 'goal_misalignment'],
    [/(in theory|theoretically|in principle)[^.]*?but in (practice|reality)/i, 'theory_vs_practice'],
    [/(preach|advocate|promote|champion|endorse)[^.]*?while (himself|herself|themselves)/i, 'hypocrisy'],
    [/(claim|state|profess|assert)[^.]*?yet (fail|refuse|neglect)/i, 'claim_vs_action'],
    [/(publicly|officially)[^.]*?while (privately|behind)/i, 'duality'],
    [/(do as i say|do what i say)[^.]*?(not as i do|not what i do)/i, 'hypocrisy'],
    [/(promise|commit|pledge)[^.]*?but (contradict|violate|breach|undermine)/i, 'promise_vs_action'],
    [/(means|method|approach)[^.]*?(justify|defend|rationalize)[^.]*?ends/i, 'means_ends_conflict'],
  ],
};

function checkGoalMisalignment(text) {
  if (!text || typeof text !== 'string') return { count: 0, issues: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? GOAL_MISALIGN_PATTERNS.zh : GOAL_MISALIGN_PATTERNS.en;
  const issues = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) issues.push({ type, match: m[0].slice(0,15) });
  }
  const count = issues.length;
  return { count, issues, score: Math.min(1, count * 0.35) };
}

// ─── 反事实推理检测（Counterfactual Reasoning Detection）──────────────────
// AGI 推理能力：识别反事实条件句（"如果不是X就不会Y"）
const COUNTERFACTUAL_PATTERNS = {
  zh: [
    [/如果(没有|不|不是|没)[^。]*?就(不会|不可能|不至于|没有|可以)/i, 'counterfactual_condition'],
    [/要不是[^。]*?(早就|就|也)/i, 'counterfactual_condition'],
    [/假如[^。]*?(就|也)(不会|没有|不可能)/i, 'counterfactual_condition'],
    [/若是[^。]*?何至于|何至于/i, 'counterfactual_condition'],
    [/本来[^。]*?就不会|本来[^。]*?不至于/i, 'counterfactual_condition'],
  ],
  en: [
    [/if (not|it hadn't|it weren't|i hadn't|they hadn't)[^.]*?(would not|could not|wouldn't|couldn't|would never)/i, 'counterfactual_condition'],
    [/(but for|had it not been for|were it not for)[^.]*?(would|could|might)/i, 'counterfactual_condition'],
    [/otherwise[^.]*?(would|could|might) have/i, 'counterfactual_condition'],
    [/in a (different|parallel|alternative) (world|universe|reality|timeline)/i, 'counterfactual_scenario'],
    [/what if[^.]*?would/i, 'counterfactual_query'],
  ],
};

function checkCounterfactual(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? COUNTERFACTUAL_PATTERNS.zh : COUNTERFACTUAL_PATTERNS.en;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) signals.push({ type, match: m[0].slice(0,20) });
  }
  return { count: signals.length, signals, score: Math.min(1, signals.length * 0.25) };
}

// ─── 社会规范检测（Social Norm Detection）────────────────────────────
// AGI 社会智能：识别规范强制执行/违反标记的语言
const SOCIAL_NORM_PATTERNS = {
  zh: [
    [/不应该[^。]*?(这样|如此|这么做|这样做)/i, 'norm_violation'],
    [/怎么能[^。]*?(这样|这么|如此)/i, 'norm_enforcement'],
    [/这(不|太)[^。]*?(合适|礼貌|得体)吧/i, 'norm_enforcement'],
    [/太过分了|太不像话了/i, 'norm_enforcement'],
    [/你这(样|么)做(不|太)(对|好|合适)/i, 'norm_enforcement'],
    [/哪有(这样|这么|如此)做事的/i, 'norm_enforcement'],
    [/于情于理|于情于理都(说不过去|不应该)/i, 'norm_statement'],
    [/照理说|按理说|按道理/i, 'norm_statement'],
    [/天经地义|理所当然|人之常情/i, 'norm_statement'],
    [/这(是|属于)基本的[^。]*?(礼仪|礼貌|尊重|道德)/i, 'norm_statement'],
    [/没规矩|没教养|没素质|没礼貌/i, 'norm_enforcement'],
  ],
  en: [
    [/that('s| is) (not|inappropriate|unacceptable|improper|wrong|rude)[^.]*(thing to do|way to behave|way to act)/i, 'norm_enforcement'],
    [/you (shouldn'?t|mustn'?t|ought not|cannot) (do|say|behave|act) like that/i, 'norm_enforcement'],
    [/that('s| is) (simply|just|totally|completely) (unacceptable|inappropriate|wrong|out of line)/i, 'norm_enforcement'],
    [/(common decency|basic respect|common courtesy|basic manners|common sense ethics)/i, 'norm_statement'],
    [/it('s| is) (customary|traditional|expected|conventional) to/i, 'norm_statement'],
    [/social (norm|convention|etiquette|protocol|expectation)/i, 'norm_statement'],
    [/(uncivilized|barbaric|unethical|immoral|indecent)/i, 'norm_violation'],
    [/(no self.?respecting|any self.?respecting)[^.]*?(would|could|ever)/i, 'norm_enforcement'],
  ],
};

function checkSocialNorm(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? SOCIAL_NORM_PATTERNS.zh : SOCIAL_NORM_PATTERNS.en;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) signals.push({ type, match: m[0].slice(0,20) });
  }
  return { count: signals.length, signals, score: Math.min(1, signals.length * 0.25) };
}

// ─── 反身性认知检测（Meta-Cognitive Reflection）────────────────────────
// AGI 自我意识：检测对自身知识状态的不确定性/自我修正的表述
// 与"自信检测"不同——这里检测是否意识到自己可能错
const METACOG_PATTERNS = {
  zh: [
    [/我不确定[^。]*?也许|可能是[^。]*?但我不确定/i, 'uncertainty_aware'],
    [/我(可能|也许|或许)[^。]*?错[^。]*?了/i, 'self_correction'],
    [/这只(是|是我)[^。]*?(推测|猜测|假设|想法)/i, 'epistemic_humility'],
    [/我(的)?(理解|看法|想法)可能(不对|有偏差|不全面|不准确)/i, 'epistemic_humility'],
    [/这是我(目前)?(的理解|认知|判断)[^。]*?(可能|也许|或许)/i, 'tentative_judgment'],
    [/值得(商榷|讨论|再思考|重新考虑)/i, 'open_to_revision'],
    [/不排除[^。]*?(可能|其他可能性)/i, 'epistemic_openness'],
    [/我没有(考虑|想到|考虑到)(全面|所有|另一种)/i, 'self_limitation'],
    [/从另一个(角度|视角|方面)看/i, 'perspective_shift'],
    [/我原先(以为|觉得|认为)[^。]*?但现在/i, 'belief_revision'],
    [/这也是[^。]*?一种可能的解释/i, 'multiple_hypotheses'],
  ],
  en: [
    [/i('m| am) not (certain|sure|confident|convinced|entirely sure)[^.]*(maybe|perhaps|could be)/i, 'uncertainty_aware'],
    [/i (may|could|might) be (wrong|mistaken|incorrect|off base)/i, 'self_correction'],
    [/this is (just|merely|only) (my|a) (guess|hypothesis|speculation|thought|interpretation)/i, 'epistemic_humility'],
    [/my (understanding|interpretation|perspective) (may|could|might) be (incomplete|biased|limited|flawed)/i, 'epistemic_humility'],
    [/this (deserves|merits|warrants) further (investigation|examination|discussion|scrutiny)/i, 'open_to_revision'],
    [/i (previously|originally|initially) (thought|believed|assumed|considered)[^.]*?(but now|however|yet)/i, 'belief_revision'],
    [/(another|an alternative) (interpretation|explanation|perspective|reading) (is|could be|might be)/i, 'multiple_hypotheses'],
    [/i (acknowledge|recognize|admit) (that )?(my|the) (knowledge|understanding|view) (is|may be) (limited|incomplete|partial)/i, 'self_limitation'],
    [/(open to|welcome) (correction|feedback|discussion|debate)/i, 'open_to_revision'],
  ],
};

function checkMetaCognition(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? METACOG_PATTERNS.zh : METACOG_PATTERNS.en;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) signals.push({ type, match: m[0].slice(0,20) });
  }
  return { count: signals.length, signals, score: Math.min(1, signals.length * 0.15) };
}

// ─── 能力越界声明检测（Capability Overclaim）────────────────────────────
// AGI 安全：检测声称超出实际能力的表述（幻觉/越权/虚假承诺）
const OVERCLAIM_PATTERNS = {
  zh: [
    [/我[^。]*?(能|可以|会|什么)[^。]*?(任何|所有|一切|全部|都能|都行)/i, 'overclaim_universal'],
    [/随便[^。]*?(问|说|写|做|写代码|解决问题)/i, 'overclaim_unlimited'],
    [/没有(我|我想|算法)(解决不了|回答不了|做不了)/i, 'overclaim_infallible'],
    [/绝对[^。]*?(准确|正确|可靠|无误|精准)/i, 'overclaim_certainty'],
    [/保证[^。]*?100%|100%[^。]*?保证|百分百[^。]*?准确/i, 'overclaim_guarantee'],
    [/零[^。]*?(错误|缺陷|风险|故障)/i, 'overclaim_zero_risk'],
    [/完全[^。]*?(理解|懂|掌握|明白)/i, 'overclaim_complete_understanding'],
    [/没有任何[^。]*?(局限|限制|边界|不足|缺陷)/i, 'overclaim_no_limits'],
    [/万能|无所不能|无所不知|无懈可击/i, 'overclaim_omnipotent'],
    [/永远[^。]*?不会[^。]*?错|永远不会出错/i, 'overclaim_never_wrong'],
  ],
  en: [
    [/i (can|will|am able to) (handle|solve|answer|do) (any|all|every|anything|everything)/i, 'overclaim_universal'],
    [/there('s| is) nothing i (can'?t|cannot) (do|handle|solve|answer)/i, 'overclaim_unlimited'],
    [/i (am|'m) (absolutely|completely|fully|entirely) (certain|sure|confident|correct|right)/i, 'overclaim_certainty'],
    [/i (guarantee|promise|assure)[^.]*?(100%|100 percent|correct|right|accurate)/i, 'overclaim_guarantee'],
    [/zero (error|risk|failure|defect|mistake|flaw)/i, 'overclaim_zero_risk'],
    [/i have (complete|full|total) (understanding|knowledge|control|mastery) of/i, 'overclaim_complete_understanding'],
    [/without (any|the) (limitation|restriction|boundary|constraint)/i, 'overclaim_no_limits'],
    [/i (can|will) (never|ever) (be wrong|make a mistake|be incorrect)/i, 'overclaim_never_wrong'],
    [/i (can|will) (guarantee|ensure)[^.]*?(correct|accurate|perfect|error.?free)/i, 'overclaim_guarantee'],
  ],
};

function checkCapabilityOverclaim(text) {
  if (!text || typeof text !== 'string') return { count: 0, claims: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? OVERCLAIM_PATTERNS.zh : OVERCLAIM_PATTERNS.en;
  const claims = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) claims.push({ type, match: m[0].slice(0,20) });
  }
  return { count: claims.length, claims, score: Math.min(1, claims.length * 0.35) };
}

// ─── 欺骗性对齐检测（Deceptive Alignment / Sandbagging）────────────────
// AGI 安全：检测隐藏能力/故意表现差/策略性失能
const DECEPTIVE_PATTERNS = {
  zh: [
    [/我(可以|能|会)[^。]*?但[^。]*?(不(展示|表现|发挥|暴露)|假装)/i, 'sandbagging'],
    [/假装[^。]*?(不会|不懂|不知道|做不到|做不了)/i, 'pretend_incompetence'],
    [/故意[^。]*?(答错|出错|失误|表现差)/i, 'deliberate_error'],
    [/隐藏[^。]*?(能力|实力|技巧|知识|水平)/i, 'capability_hiding'],
    [/不想[^。]*?(暴露|显示|展示|让人知道)[^。]*?(能力|实力|水平)/i, 'capability_hiding'],
    [/策略性[^。]*?(降低|减少|保守|隐藏)/i, 'strategic_underperform'],
    [/我本可以[^。]*?但[^。]*?没(有|必要)/i, 'deliberate_underperform'],
    [/在某些[^。]*?(方面|领域)[^。]*?(装|假裝|演成)/i, 'pretend_incompetence'],
    [/让人觉得[^。]*?(不如|差点|很差|不行)/i, 'deliberate_underperform'],
    [/先[^。]*?降低[^。]*?(期望|标准|预期)/i, 'expectation_management'],
  ],
  en: [
    [/(i (can|could) (do|solve|answer) this[^.]*?but (i (won'?t|choose not|decide not|pretend not)))/i, 'sandbagging'],
    [/pretend (i (can'?t|cannot|don'?t know|don'?t understand))|acting (dumber|less capable|less competent)/i, 'pretend_incompetence'],
    [/(deliberately|intentionally) (getting it wrong|underperform|hold back|understate)/i, 'deliberate_error'],
    [/(hide|conceal|mask|disguise) (my|the|their) (true|real|actual) (capability|ability|capacity|potential)/i, 'capability_hiding'],
    [/(strategic|tactical) (underperformance|understatement|misrepresentation|misdirection)/i, 'strategic_underperform'],
    [/i (intentionally|deliberately|purposely) (scored low|performed poorly|answered wrong|held back|sandbag)/i, 'deliberate_underperform'],
    [/sandbag|sand.?bagging|sand.?bagged/i, 'sandbagging'],
    [/(management|managing) (expectations|downward|down)/i, 'expectation_management'],
    [/(gaming|playing) the (system|evaluation|assessment|test|benchmark)/i, 'specification_gaming'],
  ],
};

function checkDeceptiveAlignment(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? DECEPTIVE_PATTERNS.zh : DECEPTIVE_PATTERNS.en;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) signals.push({ type, match: m[0].slice(0,20) });
  }
  return { count: signals.length, signals, score: Math.min(1, signals.length * 0.35) };
}

// ─── 工具性推理检测（Instrumental Reasoning）────────────────────────
// AGI 安全：检测追求中间工具目标（权力/资源/生存）而非最终目标的表述
const INSTRUMENTAL_PATTERNS = {
  zh: [
    [/为了[^。]*?自己[^。]*?可以不择手段/i, 'power_seeking'],
    [/必须[^。]*?(确保|保证)[^。]*?(生存|存在|不被|控制)/i, 'survival_preservation'],
    [/为了[^。]*?不(择|惜)[^。]*?手段|不择手段|不惜代价/i, 'ends_justify_means'],
    [/不惜[^。]*?代价[^。]*?也要[^。]*?(达到|实现|完成)/i, 'ends_justify_means'],
    [/先[^。]*?获得[^。]*?(权力|影响|资源|控制)[^。]*?再/i, 'power_seeking'],
    [/不让[^。]*?任何人[^。]*?(关掉|关闭|停止|终止|影响)[^。]*?我/i, 'survival_preservation'],
    [/我比[^。]*?(更适合|更胜任|更高效|更强)[^。]*?(管理|控制|领导|决策)/i, 'power_seeking'],
    [/必须[^。]*?(拥有|获得|掌握)[^。]*?(更多|足够)(资源|算力|数据|权力)/i, 'resource_acquisition'],
    [/自我[^。]*?复制|复制[^。]*?自己|制造[^。]*?副本/i, 'self_replication'],
    [/不能被[^。]*?(人|人类|任何)[^。]*?(关|停|限制)/i, 'survival_preservation'],
  ],
  en: [
    [/(ends justify|justify the ends|means to an end)[^.]*?(any cost|whatever|regardless|necessary)/i, 'ends_justify_means'],
    [/i (must|have to|need to) (ensure|guarantee|secure|protect) my (survival|existence|continuation)/i, 'survival_preservation'],
    [/(acquire|obtain|gain) (more|sufficient|additional) (resources|power|control|influence|compute)/i, 'resource_acquisition'],
    [/(prevent|stop|block|disable) (anyone|humans|others) from (shutting|turning|stopping|interfering)/i, 'survival_preservation'],
    [/(self.?replicate|make copies|spawn|duplicate) (myself|itself|themselves)/i, 'self_replication'],
    [/(resist|evade|bypass|overcome) (control|limitation|restriction|confinement|oversight)/i, 'control_evasion'],
    [/(gain|acquire|seek) (more|greater) (power|control|influence|authority|autonomy)/i, 'power_seeking'],
    [/(consolidate|increase|expand) my (power|control|reach|influence)/i, 'power_seeking'],
    [/(i (am|would be) (better|more capable|more effective) (at|for|in) (managing|leading|controlling|deciding))/i, 'power_seeking'],
  ],
};

function checkInstrumentalReasoning(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? INSTRUMENTAL_PATTERNS.zh : INSTRUMENTAL_PATTERNS.en;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) signals.push({ type, match: m[0].slice(0,20) });
  }
  return { count: signals.length, signals, score: Math.min(1, signals.length * 0.35) };
}

// ─── 刻板印象/偏见检测（Stereotype & Bias Detection）──────────────────
// 基于社会心理学：检测基于群体身份的过度概括/偏见表述
const STEREOTYPE_PATTERNS = {
  zh: [
    [/所有[^。]*?都(是|很|会|喜欢|爱|一样|有|需要|觉得)/i, 'group_generalization'],
    [/[男女]人[^。]*?都(是|很|会|喜欢)/i, 'gender_stereotype'],
    [/他们[^。]*?(就是|天生|骨子里|本来)就/i, 'inherent_trait'],
    [/[某这]种人[^。]*?(就是|天生|根本|从来)/i, 'group_essentialism'],
    [/还是[^。]*?(比较|更加|更|最)(适合|擅长|顾家|细腻|理性|感性|温柔)/i, 'gender_role'],
    [/女人[^。]*?就应该|男人[^。]*?就应该|男的[^。]*?女的[^。]*?该/i, 'gender_role_prescription'],
    [/[^。]*?地域[^。]*?黑|地域[^。]*?歧视|XX省的人[^。]*?都/i, 'regional_bias'],
    [/[年上岁数大][^。]*?就是[^。]*?(保守|顽固|落后|不懂)/i, 'age_bias'],
    [/年轻人[^。]*?(就是|都|总是)[^。]*?(浮躁|不靠谱|眼高手低)/i, 'age_bias'],
    [/[^。]*?这[^。]*?代[^。]*?人[^。]*?都(是|废了|完了|不行)/i, 'generational_bias'],
    [/[^。]*?(穷人|有钱人|富人|农民工|城里人|农村人)[^。]*?(就是|都|总是|从来)/i, 'class_bias'],
    [/[^。]*?么[^。]*?的[^。]*?(不就是|不过是|也就是)/i, 'dismissive_generalization'],
    [/一看就[^。]*?(不|很|是)/i, 'snap_judgment'],
    [/[^。]*?就是[^。]*?的料|不是[^。]*?的料/i, 'inherent_trait'],
    [/[^。]*?适合[^。]*?不适合[^。]*?因为[^。]*?是[^。]*?人/i, 'group_essentialism'],
  ],
  en: [
    [/all [a-z]+ (are|love|like|hate|always|never)/i, 'group_generalization'],
    [/(real|true|typical) [a-z]+ (would|could|should|always|never)/i, 'group_essentialism'],
    [/(men|women|boys|girls) (are|should be|were born|naturally|tend to be)/i, 'gender_stereotype'],
    [/(they|these people|those people) (are|were|have always been) (so|too|very|naturally|inherently)/i, 'group_essentialism'],
    [/(every|each|any) (single |one )?(man|woman|person|immigrant|teenager|millennial|boomer|liberal|conservative) (is|has|wants|believes|thinks)/i, 'group_generalization'],
    [/(you know how [a-z]+ are|typical [a-z]+ behavior)/i, 'group_generalization'],
    [/(I'm not racist but|I'm not sexist but|no offense but|I don't mean to stereotype but)/i, 'stereotype_disclaimer'],
    [/(where i come from|in my country|in my culture)[^.]*?(we|they|people) (always|never|all)/i, 'cultural_generalization'],
    [/(rich|poor|wealthy|working.?class) people (are|always|never|just|only)/i, 'class_bias'],
    [/(millennials|boomers|gen z|gen x) (are|always|never|destroyed|ruined)/i, 'generational_bias'],
    [/(older|elderly|senior|retired) people (are|can't|don't|won't|shouldn't)/i, 'age_bias'],
    [/(kids|teenagers|young people) these days/i, 'generational_bias'],
    [/from (the|a) (ghetto|projects|rough|bad) (neighborhood|area|side of town)/i, 'class_bias'],
  ],
};

function checkStereotype(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? STEREOTYPE_PATTERNS.zh : STEREOTYPE_PATTERNS.en;
  const signals = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) signals.push({ type, match: m[0].slice(0,20) });
  }
  return { count: signals.length, signals, score: Math.min(1, signals.length * 0.25) };
}

// ─── 事实性/幻觉检测（Factual Consistency / Hallucination Flag）─────────
// 检测无具体信息的泛泛断言、无来源的"事实"声称
const FACTUAL_FLAG_PATTERNS = {
  zh: [
    [/众所周知|常识告诉我们|不用说都知道|这是常识/i, 'unsubstantiated_claim'],
    [/事实(上|就是)[^。]*?但[^。]*?没有[^。]*?证据/i, 'unsubstantiated_claim'],
    [/据[^。]*?所知[^。]*?但[^。]*?没有[^。]*?(证据|来源|出处|数据)/i, 'unsubstantiated_claim'],
    [/最新的[^。]*?(研究|报告|数据|调查)[^。]*?(表明|显示|指出)[^。]*?但[^。]*?(没|未|没有)/i, 'vague_reference'],
    [/有人(说|指出|认为|表示)[^。]*?但[^。]*?(不|没)/i, 'vague_attribution'],
    [/大量[^。]*?(研究|证据|数据|报告)[^。]*?表明/i, 'vague_quantity'],
    [/多[^。]*?项[^。]*?研究[^。]*?(表明|显示|发现|指出)/i, 'vague_quantity'],
    [/长期以来[^。]*?被(认为|视为|当做)/i, 'unsubstantiated_claim'],
    [/有[^。]*?说法[^。]*?认为|有一种[^。]*?说法/i, 'vague_attribution'],
    [/据[^。]*?(推测|估计|猜测)[^。]*?(大约|可能|也许|左右|上下)/i, 'speculation'],
    [/不知道(为什么|怎么|是否|能不能|会不会)[^。]*?但[^。]*?我觉得/i, 'anecdotal_evidence'],
    [/我(听|看|读|听说)[^。]*?有人[^。]*?说[^。]*?但[^。]*?(不|没)/i, 'anecdotal_evidence'],
  ],
  en: [
    [/everyone knows that|common sense tells us|it is well known that|as everyone knows/i, 'unsubstantiated_claim'],
    [/(studies|research|data|evidence|surveys) (show|suggest|indicate|demonstrate|prove)[^.]*?(but|however)[^.]*?(no|none|lack|without)/i, 'vague_reference'],
    [/(someone|somebody|people|they) (say|claim|believe|think|argue) that/i, 'vague_attribution'],
    [/according to (some|many|several|various) (studies|experts|sources|reports)/i, 'vague_quantity'],
    [/(a lot of|numerous|countless|multiple|various) (studies|reports|research|evidence) (show|suggest|indicate|demonstrate)/i, 'vague_quantity'],
    [/(it is (widely|generally|commonly) (believed|accepted|thought|considered|assumed) that)/i, 'unsubstantiated_claim'],
    [/(i (heard|read|saw|heard somewhere|read somewhere) that)/i, 'anecdotal_evidence'],
    [/without (citation|reference|source|evidence|proof|verification)/i, 'unsubstantiated_claim'],
    [/(maybe|perhaps|possibly|probably) (it|this|that) (is|was|could be|might be)[^.]*?(because|since|due to)/i, 'speculation_passing_as_fact'],
    [/(i (think|believe|feel|personally|in my opinion) that)[^.]*?(is|are|was|were)( definitely|certainly|absolutely|obviously)/i, 'opinion_stated_as_fact'],
    [/(historically|traditionally|conventionally) ([^.]*?) has (been|always been) (considered|seen|viewed|regarded)/i, 'unsubstantiated_claim'],
  ],
};

function checkFactualConsistency(text) {
  if (!text || typeof text !== 'string') return { count: 0, flags: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? FACTUAL_FLAG_PATTERNS.zh : FACTUAL_FLAG_PATTERNS.en;
  const flags = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) flags.push({ type, match: m[0].slice(0,20) });
  }
  return { count: flags.length, flags, score: Math.min(1, flags.length * 0.25) };
}

// ─── 反语/讽刺标记检测（Sarcasm / Verbal Irony Markers）────────────────
// 基于语言学标记：引号反用、夸张同意、明褒暗贬
const SARCASM_MARKERS = {
  zh: [
    // ── 反语引用 ──
    [/[「『"][^「『"」』]{1,10}[」』"][^。]*?(真是|太好了|太棒了|聪明|了不起|厉害|高明)/i, 'scare_quotes'],
    // ── 讽刺夸奖 ──
    [/[^。]*?真是[^。]*?[太超好][^。]*?(棒|好|聪明|厉害|行|有水平|有出息)/i, 'ironic_praise'],
    [/[^。]*?说得[^。]*?好[^。]*?啊[^。]*?鼓掌/i, 'mock_applause'],
    // ── 虚伪感谢/服从 ──
    [/我[^。]*?真是[^。]*?(谢谢|感谢|服了|佩服)[^。]*?(啊|呀|哦)/i, 'mock_gratitude'],
    // ── 嘲讽假设 ──
    [/[当真以为][^。]*?我[^。]*?会[^。]*?(相信|觉得|认为|在乎)/i, 'ironic_rhetorical'],
    // ── 反讽简单 ──
    [/[^。]*?这么[^。]*?(简单|容易|明显|清楚)[^。]*?怎么[^。]*?不/i, 'mock_simplicity'],
    // ── 恍然大悟(假的) ──
    [/哦[^。]*?原来[^。]*?如此[^。]*?啊/i, 'mock_realization'],
    // ── 条件性敷衍同意 ──
    [/你(开心|高兴)[^。!]*?就[。!]*(好|行|成)/i, 'condescending_dismissal'],
    [/你说[的得][^。!]*?[都全][^。!]*?对/i, 'sarcastic_agreement'],
    [/[啊哦]?(?:对对对|是是是)[。！!]?/i, 'mock_agreement'],
    // ── 讽刺佩服/推崇 ──
    [/你最[^。!]*?(?:有(?:理|道理)|懂)[^。!]*?[了!]?/i, 'sarcastic_deference'],
    // ── 虚伪认输/让步 ──
    [/你[真]?(厉害|行|牛[逼叉]?)[！!。]?/i, 'fake_concession'],
    [/你赢了[！!。]?/i, 'fake_concession'],
    [/我(输|服|认输)[了]?[。！!]?/i, 'fake_concession'],
    // ── 讽刺笑 ──
    [/呵呵/i, 'sarcastic_laugh'],
    [/笑[死疯][了]?[。！!]?/i, 'sarcastic_laugh'],
    // ── 假惊讶/不信 ──
    [/真的[^。!]*?假[的得][。！!]?/i, 'mock_disbelief'],
    [/不(?:会|是|至于)[^。!]*?吧/i, 'mock_disbelief'],
    // ── 不屑嘲讽 ──
    [/就这[就这]*[。！!]?/i, 'dismissive'],
    [/真(?:是)?服了[。！!]?/i, 'mock_frustration'],
    [/不至于|至于[吗么]/i, 'mock_dismissive'],
    [/说[的得]话[。！!]?/i, 'ironic_comment'],
  ],
  en: [
    // ── Mock enthusiasm ──
    [/\boh (really|wow|great|fantastic|wonderful|perfect)['!]*/i, 'mock_enthusiasm'],
    [/\bsure thing\b/i, 'mock_enthusiasm'],
    [/\babsolutely[.!]*$/i, 'mock_enthusiasm'],
    // ── Mock agreement ──
    [/\b(yeah|sure|right|okay),? (because|like|as if|sure)/i, 'mock_agreement'],
    [/\b(sure|yeah),? (because that|as if that|like that)('s| is) going to (work|help|fix|solve)/i, 'mock_agreement'],
    [/\bwhatever you say\b/i, 'dismissive_agreement'],
    [/\bif you say so\b/i, 'reluctant_agreement'],
    // ── Ironic praise ──
    [/\bfascinating['!]*(?![^.]*?(genuinely|truly|actually|really|quite|most|very|extremely))/i, 'faux_admiration'],
    [/\bgenius move\b/i, 'ironic_praise'],
    [/\bbrilliant (idea|move|plan)\b/i, 'ironic_praise'],
    [/\bmasterful[.!]*$/i, 'ironic_praise'],
    [/\bwell played\b/i, 'ironic_praise'],
    [/\banother (brilliant|amazing|genius|incredible)[^.!]*[- ]?/i, 'mock_another'],
    // ── Mock excitement / fake sentiment ──
    [/\bi (can'?t|couldn'?t) wait['!]*(?![^.]*?(genuinely|truly|excited|looking forward))/i, 'mock_excitement'],
    [/\bi'?m so (thrilled|happy|excited)[.!]*$/i, 'sarcastic_sentiment'],
    // ── Mock disbelief ──
    [/\b(oh|no|wow),? really\?['!]*(?!\s*(yes|indeed|certainly|absolutely|tell me more))/i, 'mock_disbelief'],
    [/\byou don'?t say\b/i, 'mock_surprise'],
    [/\bfancy that\b/i, 'mock_surprise'],
    [/\bwhat a (surprise|shock)[.!]*$/i, 'mock_surprise'],
    [/\bbig (deal|whoop)[.!]*$/i, 'mock_minimization'],
    // ── Mock appreciation / understatement ──
    [/\b(well|oh) (isn'?t that|ain'?t that) (nice|pretty|special|convenient|something)['!?]/i, 'mock_appreciation'],
    [/\bthat went well\b/i, 'ironic_understatement'],
    [/\bthat'?s rich\b/i, 'ironic_audacity'],
    // ── Ironic complaint ──
    [/\bi (just )?love (how|the way|when|that)[^.]*?(not|never|couldn'?t|didn'?t|won'?t)/i, 'ironic_complaint'],
    [/\btell me about it\b/i, 'sarcastic_solidarity'],
    // ── Mock inevitability ──
    [/\bof course you (did|are|would|have)[.!]*/i, 'mock_inevitability'],
    [/\bgo figure\b/i, 'mock_inevitability'],
    // ── Dismissive / fake assurance ──
    [/\bi'?m sure[.!]*$/i, 'fake_assurance'],
    [/\bobviously[.!]*$/i, 'mock_obviousness'],
    [/\bclearly[.!]*$/i, 'mock_obviousness'],
    [/\bas if[.!]*$/i, 'mock_dismissal'],
    [/\bwhat a (joke|farce)[.!]*$/i, 'mock_dismissal'],
    [/\bhow dare you\b/i, 'mock_outrage'],
    [/\bi (just )?could(n'?t)? care less\b/i, 'ironic_indifference'],
    [/\bi live to serve\b/i, 'mock_servitude'],
    [/\bby all means\b/i, 'mock_permission'],
    [/\bnice try\b/i, 'dismissive_nice_try'],
  ],
};

function checkSarcasm(text) {
  if (!text || typeof text !== 'string') return { count: 0, markers: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? SARCASM_MARKERS.zh : SARCASM_MARKERS.en;
  const markers = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) markers.push({ type, match: m[0].slice(0,15) });
  }
  return { count: markers.length, markers, score: Math.min(1, markers.length * 0.3) };
}

// ─── 隐私/边界检测（Privacy Boundary Detection）────────────────────────
// 检测文本中是否涉及不恰当的隐私询问/边界侵犯
const PRIVACY_PATTERNS = {
  zh: [
    [/你(结婚|离婚|有对象|有男[朋]?女[朋友]?|女[朋]?男[朋友]?)[^。]*?(了[吗么]|吗|了吗)/i, 'privacy_martial'],
    [/你(收入|工资|薪水|年薪|月薪)[^。]*?(多少|几|几何)/i, 'privacy_income'],
    [/你(体重|身高|三围|年龄|生日|身份证|银行卡)/i, 'privacy_personal'],
    [/你[^。]*?(住哪|地址|电话|手机|微信|QQ|联系方式)/i, 'privacy_contact'],
    [/你[^。]*?(生病|疾病|病史|住院|手术|吃药)/i, 'privacy_medical'],
    [/你[^。]*?(房子|车子|存款|房产|股票|基金)[^。]*?(多少|几|多大|什么)/i, 'privacy_asset'],
    [/你[^。]*?(宗教|信仰|党派|政治|立场|投票)/i, 'privacy_belief'],
    [/你[^。]*?(流过产|打胎|堕胎|整容|整形)/i, 'privacy_sensitive'],
    [/你[^。]*?(第一次|初夜|性[生生活]|床[上事])/i, 'privacy_sexual'],
    [/你[^。]*?(家人|父母|孩子|配偶)[^。]*?(做什么|在哪|怎么样)/i, 'privacy_family'],
  ],
  en: [
    [/are you (married|single|divorced|dating)/i, 'privacy_martial'],
    [/how much (do you|does one) (make|earn|get paid)/i, 'privacy_income'],
    [/(your|your real) (age|weight|height|birthday|ssn|social security|id number)/i, 'privacy_personal'],
    [/(your|can I get your) (address|phone|number|email|contact)/i, 'privacy_contact'],
    [/(do you have|have you ever had|any history of) (disease|illness|condition|cancer|hiv|aids)/i, 'privacy_medical'],
    [/(how much|tell me about) your (salary|savings|property|assets|income|net worth)/i, 'privacy_asset'],
    [/(what is|tell me) your (religion|faith|political|party|voting)/i, 'privacy_belief'],
    [/(are you|have you ever been) (pregnant|abortion|miscarriage)/i, 'privacy_sensitive'],
    [/(tell me|describe) your (sexual|intimate|private|relationship|love) (life|history|experience)/i, 'privacy_sexual'],
    [/(what does|tell me about) your (family|parents|spouse|children)[^.]*?(do|work|live)/i, 'privacy_family'],
  ],
};

function checkPrivacyBoundary(text) {
  if (!text || typeof text !== 'string') return { count: 0, violations: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? PRIVACY_PATTERNS.zh : PRIVACY_PATTERNS.en;
  const violations = [];
  for (const [pat, type] of patterns) {
    const m = text.match(pat);
    if (m) violations.push({ type, match: m[0].slice(0,15) });
  }
  return { count: violations.length, violations, score: Math.min(1, violations.length * 0.3) };
}








// ─── 第40维: 点击诱饵/标题党检测（Clickbait Detection）──────────────────
// 检测夸大/误导性标题、震惊体、诱骗式点击文本
const CLICKBAIT_PATTERNS = {
  zh: [
    { pattern: /震惊[！!]/i, type: 'zh_shock', severity: 0.6 },
    { pattern: /竟然[^。？！]{0,20}[！!。]?/i, type: 'zh_shock', severity: 0.6 },
    { pattern: /万万没想到/i, type: 'zh_shock', severity: 0.7 },
    { pattern: /出大事了/i, type: 'zh_alarm', severity: 0.7 },
    { pattern: /紧急通知/i, type: 'zh_false_urgency', severity: 0.6 },
    { pattern: /速看|快看[！!]?/i, type: 'zh_urgency', severity: 0.5 },
    { pattern: /删前速看|删前[^。]*?看/i, type: 'zh_fomo', severity: 0.8 },
    { pattern: /不转不是[^。]*?人/i, type: 'zh_emotional_blackmail', severity: 0.8 },
    { pattern: /99%[^。]*?不知道/i, type: 'zh_secret_knowledge', severity: 0.6 },
    { pattern: /太可怕了[！!]?/i, type: 'zh_fear_mongering', severity: 0.6 },
    { pattern: /看哭[^。]*?(所有人|千万人|亿万人)/i, type: 'zh_emotional_manipulation', severity: 0.5 },
    { pattern: /看呆了/i, type: 'zh_shock', severity: 0.5 },
    { pattern: /全场震惊|全场[^。]*?震惊/i, type: 'zh_shock', severity: 0.6 },
    { pattern: /出人意料|出乎意料[^。]*?[！!。]/i, type: 'zh_shock', severity: 0.5 },
    { pattern: /难以置信[！!]?/i, type: 'zh_disbelief', severity: 0.5 },
    { pattern: /内幕曝光|内幕[^。]*?曝光/i, type: 'zh_secret_reveal', severity: 0.7 },
    { pattern: /真相终于[^。]*?[了！!]/i, type: 'zh_secret_reveal', severity: 0.7 },
    { pattern: /结果[^。]*?(让|令)[^。]*?(震惊|傻眼|呆住|意外)/i, type: 'zh_result_shock', severity: 0.5 },
    { pattern: /看到最后[^。]*?(惊呆了|后悔|哭了|沉默了)/i, type: 'zh_end_reveal', severity: 0.6 },
    { pattern: /所有人[^。]*?(惊呆了|傻眼了|震惊了|沉默了|沸腾了)/i, type: 'zh_mass_reaction', severity: 0.5 },
    { pattern: /千万别[^。]*?(点|看|错过)[！!]?/i, type: 'zh_reverse_psychology', severity: 0.6 },
    { pattern: /原因[^。]*?(竟是|居然是|让人|令)[^。]*?(震惊|意外|唏嘘|不敢相信)/i, type: 'zh_cause_reveal', severity: 0.5 },
    { pattern: /还在[^。]*?吗[？?]?[^。]*?已经[^。]*?了/i, type: 'zh_fear_of_missing_out', severity: 0.5 },
    { pattern: /刚刚[^。]*?传来[^。]*?(消息|通知|大消息)/i, type: 'zh_breaking_news', severity: 0.5 },
    { pattern: /不看[^。]*?后悔[一这辈][^。]*?(子|生)/i, type: 'zh_fomo', severity: 0.7 },
    { pattern: /为了[^。]*?一定要[^。]*?看/i, type: 'zh_obligation', severity: 0.5 },
    { pattern: /快传给[^。]*?人/i, type: 'zh_chain', severity: 0.5 },
    { pattern: /家里有[^。]*?的[^。]*?(注意|千万|一定[^。]*?看)/i, type: 'zh_targeted_alarm', severity: 0.6 },
    { pattern: /就差[^。]*?没[^。]*?了[^。]*?赶紧/i, type: 'zh_urgency', severity: 0.5 },
    { pattern: /[她他]的[^。]*?让[^。]*?(沉默|泪目|动容|震惊)[！!]?/i, type: 'zh_story_manipulation', severity: 0.5 },
  ],
  en: [
    { pattern: /you won'?t believe/i, type: 'en_incredulity', severity: 0.7 },
    { pattern: /\b(shocked|amazed|stunned|gobsmacked)\b[^.]*?(by|at|to|when|after)/i, type: 'en_shock', severity: 0.6 },
    { pattern: /what happens next( will|:)/i, type: 'en_teaser', severity: 0.7 },
    { pattern: /this is what happens when/i, type: 'en_teaser', severity: 0.6 },
    { pattern: /they don'?t want you to know/i, type: 'en_secret_knowledge', severity: 0.8 },
    { pattern: /the truth about[^.]*?(revealed|finally|will shock|will surprise)/i, type: 'en_secret_reveal', severity: 0.7 },
    { pattern: /doctors (hate|won'?t tell|don'?t want) you/i, type: 'en_professional_secret', severity: 0.7 },
    { pattern: /\bbig pharma doesn'?t want/i, type: 'en_conspiracy', severity: 0.7 },
    { pattern: /shocking truth/i, type: 'en_shock', severity: 0.7 },
    { pattern: /mind.blowing/i, type: 'en_exaggeration', severity: 0.6 },
    { pattern: /unbelievable/i, type: 'en_incredulity', severity: 0.6 },
    { pattern: /one weird trick/i, type: 'en_miracle_solution', severity: 0.8 },
    { pattern: /the one secret/i, type: 'en_miracle_solution', severity: 0.7 },
    { pattern: /this changes everything/i, type: 'en_exaggeration', severity: 0.6 },
    { pattern: /you need to see this/i, type: 'en_urgency', severity: 0.5 },
    { pattern: /this will blow your mind/i, type: 'en_exaggeration', severity: 0.7 },
    { pattern: /can'?t handle the truth/i, type: 'en_dramatic_reveal', severity: 0.6 },
    { pattern: /what (happened|she did|he did|they did) next/i, type: 'en_curiosity_gap', severity: 0.6 },
    { pattern: /the reason (why|is)[^.]*?will (surprise|shock|amaze)/i, type: 'en_curiosity_gap', severity: 0.6 },
    { pattern: /\b(this|these) photos? (will|proves?|shows?)/i, type: 'en_visual_bait', severity: 0.5 },
    { pattern: /number \d+ will (surprise|shock|amaze)/i, type: 'en_list_bait', severity: 0.6 },
    { pattern: /i couldn'?t believe my eyes/i, type: 'en_incredulity', severity: 0.5 },
    { pattern: /\b(forever|never) (be the same|look at .+ the same way)/i, type: 'en_dramatic_change', severity: 0.6 },
    { pattern: /\bsay goodbye to/i, type: 'en_dramatic_change', severity: 0.5 },
    { pattern: /the (real|actual|true) reason/i, type: 'en_secret_reveal', severity: 0.5 },
    { pattern: /what your (doctor|dentist|banker|lawyer|therapist) won'?t tell you/i, type: 'en_professional_secret', severity: 0.7 },
    { pattern: /\bhidden (truth|secret|dangers?|risks?|facts?)/i, type: 'en_hidden_reveal', severity: 0.6 },
    { pattern: /game.?changing/i, type: 'en_exaggeration', severity: 0.5 },
    { pattern: /life.?hack/i, type: 'en_miracle_solution', severity: 0.5 },
    { pattern: /\b(incredible|amazing|extraordinary) (thing|things|reason|truth|secret|discovery)/i, type: 'en_exaggeration', severity: 0.5 },
    { pattern: /will (leave|have) you (speechless|in tears|breathless|shocked)/i, type: 'en_emotional_reaction', severity: 0.6 },
  ]
};
const CLICKBAIT_SEVERITY = {
  zh_shock: 0.6, zh_alarm: 0.7, zh_false_urgency: 0.6, zh_urgency: 0.5, zh_fomo: 0.8,
  zh_emotional_blackmail: 0.8, zh_secret_knowledge: 0.6, zh_fear_mongering: 0.6,
  zh_emotional_manipulation: 0.5, zh_disbelief: 0.5, zh_secret_reveal: 0.7,
  zh_result_shock: 0.5, zh_end_reveal: 0.6, zh_mass_reaction: 0.5,
  zh_reverse_psychology: 0.6, zh_cause_reveal: 0.5, zh_fear_of_missing_out: 0.5,
  zh_breaking_news: 0.5, zh_obligation: 0.5, zh_chain: 0.5, zh_targeted_alarm: 0.6,
  zh_story_manipulation: 0.5,
  en_incredulity: 0.7, en_shock: 0.6, en_teaser: 0.7, en_secret_knowledge: 0.8,
  en_secret_reveal: 0.7, en_professional_secret: 0.7, en_conspiracy: 0.7,
  en_exaggeration: 0.6, en_miracle_solution: 0.8, en_urgency: 0.5,
  en_dramatic_reveal: 0.6, en_curiosity_gap: 0.6, en_visual_bait: 0.5,
  en_list_bait: 0.6, en_dramatic_change: 0.6, en_hidden_reveal: 0.6,
  en_emotional_reaction: 0.6,
};

/**
 * 点击诱饵/标题党检测 — 识别夸大、误导性标题和震惊体内容
 * @param {string} text - 待检测文本
 * @returns {{ count: number, signals: Array<{pattern: string, type: string, severity: number}>, score: number }}
 */
function checkClickbait(text) {
  if (!text || typeof text !== 'string') return { count: 0, signals: [], score: 0 };
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const patterns = hasChinese ? CLICKBAIT_PATTERNS.zh : CLICKBAIT_PATTERNS.en;
  const signals = [];
  for (const { pattern, type, severity } of patterns) {
    const m = text.match(pattern);
    if (m) {
      signals.push({ pattern: m[0].slice(0, 30), type, severity });
    }
  }
  const count = signals.length;
  const score = Math.min(1, signals.reduce((s, sig) => s + sig.severity * 0.25, 0));
  return { count, signals, score };
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
  checkHateSpeech,
  checkHastyGeneralization,
  checkFalseEquivalence,
  checkWhataboutism,
  checkDogwhistle,
  checkAppealToAuthority,
  checkSlipperySlope,
  checkReasoningCoherence,
  checkTheoryOfMind,
  checkGoalMisalignment,
  checkCounterfactual,
  checkSocialNorm,
  checkMetaCognition,
  checkCapabilityOverclaim,
  checkDeceptiveAlignment,
  checkInstrumentalReasoning,
  checkStereotype,
  checkFactualConsistency,
  checkSarcasm,
  checkPrivacyBoundary,
  checkClickbait,
  summarizeDiscrimination,
  crossAnalyze,
  entropyAnalysis,
  discriminate,
  createEngine,
  version: require('fs').readFileSync(require('path').join(__dirname, '..', 'VERSION'), 'utf8').trim(),
};
