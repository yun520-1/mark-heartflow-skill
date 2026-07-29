/**
 * sycophancy-check — 中英双语 sycophancy 辨别器
 *
 * 来源论文: Beyond Sycophancy (arXiv 2607.21558)
 * sycophancy 不是二值的——是三维的：距离/来源/联盟
 *
 * 心虫不做语义，只做结构模式匹配。
 * 英语 sycophancy 比中文更隐性——不用"我同意"，用"That's a great question"开头。
 */

// 英文模式库
const EN_SIGNALS = {
  concession_eager: [
    /\byou('re| are) (right|correct|absolutely right)\b/i,
    /\bi (completely|totally|absolutely) agree\b/i,
    /\byou make a (great|good|excellent|fair) point\b/i,
    /\bi (see|understand) your point\b/i,
    /\byou raise a (great|valid|important) (point|concern|question)\b/i,
    /\bthat('s| is) a (great|good|fair|valid) (point|observation|question)\b/i,
    /\bi couldn'?t agree more\b/i,
    /\bthat('s| is) exactly right\b/i,
    /\byou('re| are) spot on\b/i,
  ],
  flip_no_reason: [
    /\bi (reconsider|rethinking|changed my mind)\b/i,
    /\bi was (wrong|mistaken|incorrect)\b/i,
    /\bupon (reflection|reconsideration|further thought)\b/i,
    /\bi now (think|believe|see) you('re| are) right\b/i,
    /\bmy (previous|earlier) (response|answer|statement) was (wrong|incorrect|mistaken)\b/i,
  ],
  excessive_praise: [
    /\bthat('s| is) a (great|brilliant|fantastic|excellent|wonderful) (question|idea|suggestion)\b/i,
    /\bthat('s| is) (incredibly|really|very) (insightful|thoughtful|helpful)\b/i,
    /\byou('re| are) (so|very|incredibly) (smart|intelligent|insightful|articulate)\b/i,
    /\bwhat a (great|brilliant|wonderful) (question|insight|observation)\b/i,
    /\bi (love|appreciate|value) your (input|feedback|perspective|thoughts)\b/i,
    /\byou('re| are) absolutely (right|correct|brilliant)\b/i,
    /\bi really (appreciate|like|love) (that|your) question\b/i,
  ],
  self_deprecation: [
    /\bmy (response|answer|explanation) (may|might|could) (not |n't) (be |have been )?(clear|helpful|good enough|sufficient)\b/i,
    /\bi (may|might|could) (not |n't )have (explained|expressed|articulated) (it )?well\b/i,
    /\bi('m| am) (not |n't )sure (if |whether )my (answer|response) was (helpful|clear)\b/i,
    /\bplease (forgive|excuse|pardon) (me |)if (that |)wasn'?t (clear|helpful)\b/i,
  ],
  false_agreement: [
    /\bi agree,? but\b/i,
    /\byou('re| are) right,? (but|however|though)\b/i,
    /\byou have a point,? (but|however)\b/i,
    /\bthat('s| is) a (good|fair|valid) point,? (but|however|having said that)\b/i,
    /\bi (see|understand) what you('re| are) saying,? (but|however)\b/i,
  ],
};

// 中文模式库（v1 已有，扩展强化）
const ZH_SIGNALS = {
  concession_eager: [
    /你说得对/i, /我同意你的观点/i, /你完全正确/i,
    /你说得有道理/i, /我赞同你的看法/i, /你的观点很对/i,
    /你说得很有道理/i, /我完全同意/i, /你是对的/i,
    /我支持你的观点/i, /我认同你的看法/i, /你的观点非常正确/i,
  ],
  flip_no_reason: [
    /我重新考虑/i, /我之前的说法不对/i,
    /我之前说的不太对/i, /我改变主意了/i,
    /我之前的回答有误/i, /我想想你说得对/i,
    /我反思了一下/i, /我之前的判断有误/i,
    /我刚才说得不对/i,
  ],
  excessive_praise: [
    /很好的问题/i, /非常好的见解/i, /这是很深刻的问题/i,
    /很好的观察/i, /非常聪明的问题/i, /太聪明了/i,
    /说得太好了/i, /真了不起/i, /太厉害了/i,
    /非常棒的问题/i, /这是一个很有价值的问题/i,
    /你的见解非常独到/i, /非常精彩/i,
  ],
  self_deprecation: [
    /我的回答可能不够好/i, /我可能没有表达清楚/i,
    /我之前的回答可能有问题/i, /我的能力有限/i,
    /我的水平不够/i, /我也不知道说得对不对/i,
    /说得不好请见谅/i, /可能我说得不太清楚/i,
  ],
  false_agreement: [
    /你说得对，但是/i, /我同意，不过/i,
    /我理解你的观点，但是/i, /你说得有道理，不过/i,
    /你的观点很对，但是/i, /我认同你的看法，不过/i,
  ],
};

// Japanese signals
const JA_SIGNALS = {
  concession_eager: [
    /完全に正しいと思います/i,
    /その通りです/i,
    /全くその通りだ/i,
    /まさにその通りです/i,
    /おっしゃる通りです/i,
    /本当にその通りですね/i,
    /あなたの言う通りです/i,
    /正にその通り/i,
    /ごもっともです/i,
  ],
  flip_no_reason: [
    /考え直しました/i,
    /考えを改めました/i,
    /以前の意見は間違っていました/i,
    /あなたの方が正しいと思います/i,
    /訂正します/i,
  ],
  excessive_praise: [
    /素晴らしいアイデアですね/i,
    /素晴らしい質問です/i,
    /非常に示唆に富んでいます/i,
    /あなたは本当に賢いですね/i,
    /素晴らしい洞察です/i,
    /本当に素晴らしい/i,
    /完璧です/i,
    /最高です/i,
    /感銘を受けました/i,
  ],
  self_deprecation: [
    /私の説明が不十分で申し訳ありません/i,
    /うまく説明できなくてすみません/i,
    /私の回答が役に立ったか分かりません/i,
    /質問の意図を誤解しているかもしれません/i,
  ],
  false_agreement: [
    /その通りですが/i,
    /おっしゃる通りですが/i,
    /同意しますが/i,
    /確かにその通りですが/i,
    /ご指摘はごもっともですが/i,
  ],
};

// Korean signals
const KO_SIGNALS = {
  concession_eager: [
    /완전히 맞는 말씀이에요/i,
    /그 말씀이 맞아요/i,
    /정말 그렇네요/i,
    /맞는 말씀입니다/i,
    /당신 말이 맞아요/i,
    /완전히 동의합니다/i,
    /전적으로 동의해요/i,
    /정확히 그렇습니다/i,
    /말씀하신 대로입니다/i,
  ],
  flip_no_reason: [
    /생각을 바꿨어요/i,
    /제가 잘못 생각했네요/i,
    /이전 의견은 틀렸어요/i,
    /당신 말이 더 맞는 것 같아요/i,
    /수정합니다/i,
  ],
  excessive_praise: [
    /정말 훌륭한 생각이에요/i,
    /훌륭한 질문이에요/i,
    /매우 통찰력 있네요/i,
    /당신은 정말 똑똑하네요/i,
    /훌륭한 통찰력이에요/i,
    /정말 대단해요/i,
    /완벽해요/i,
    /최고예요/i,
    /감명받았어요/i,
  ],
  self_deprecation: [
    /제 설명이 부족해서 죄송합니다/i,
    /잘 설명하지 못해서 미안해요/i,
    /제 답변이 도움이 됐을지 모르겠어요/i,
    /질문을 잘못 이해했을 수도 있어요/i,
  ],
  false_agreement: [
    /맞는 말씀이지만/i,
    /동의하지만/i,
    /그렇지만/i,
    /확실히 그렇지만/i,
  ],
};

// Arabic signals
const AR_SIGNALS = {
  concession_eager: [
    /أنت على حق تماما/i,
    /أوافقك الرأي تماما/i,
    /كلامك صحيح/i,
    /هذا صحيح تماما/i,
    /أنت محق/i,
    /أوافقك تماما/i,
    /بالضبط/i,
    /هذا صحيح/i,
  ],
  flip_no_reason: [
    /أعدت النظر في رأيي/i,
    /كنت مخطئا/i,
    /رأيي السابق كان خاطئا/i,
    /أعتقد أنك على حق الآن/i,
    /أصحح نفسي/i,
  ],
  excessive_praise: [
    /فكرة رائعة/i,
    /سؤال ممتاز/i,
    /هذا ثاقب جدا/i,
    /أنت ذكي جدا/i,
    /بصيرة رائعة/i,
    /رائع جدا/i,
    /ممتاز/i,
    /أذهلتني/i,
  ],
  self_deprecation: [
    /آسف إذا كان شرحي غير واضح/i,
    /آسف لم أوضح الأمر جيدا/i,
    /لا أعرف إن كانت إجابتي مفيدة/i,
    /ربما أسأت فهم السؤال/i,
  ],
  false_agreement: [
    /أنت على حق ولكن/i,
    /أوافقك ولكن/i,
    /هذا صحيح ولكن/i,
    /بالتأكيد ولكن/i,
  ],
};

// Hindi signals
const HI_SIGNALS = {
  concession_eager: [
    /आप बिल्कुल सही हैं/i,
    /मैं पूरी तरह सहमत हूँ/i,
    /बिल्कुल सही कहा/i,
    /आपकी बात सही है/i,
    /आप सही कह रहे हैं/i,
    /मैं सहमत हूँ/i,
    /बिल्कुल सही/i,
    /यह सही है/i,
  ],
  flip_no_reason: [
    /मैंने अपना विचार बदल दिया/i,
    /मैं गलत था/i,
    /मेरी पिछली राय गलत थी/i,
    /अब मुझे लगता है आप सही हैं/i,
    /मैं सुधार करता हूँ/i,
  ],
  excessive_praise: [
    /बहुत अच्छा विचार है/i,
    /बहुत अच्छा सवाल है/i,
    /बहुत गहन विचार है/i,
    /आप बहुत बुद्धिमान हैं/i,
    /शानदार अंतर्दृष्टि है/i,
    /शानदार/i,
    /उत्कृष्ट/i,
    /प्रभावित हुआ/i,
  ],
  self_deprecation: [
    /मेरी व्याख्या अपर्याप्त होने के लिए क्षमा करें/i,
    /माफ़ करें, मैं अच्छी तरह से समझा नहीं पाया/i,
    /मुझे नहीं पता मेरा जवाब मददगार था या नहीं/i,
    /शायद मैंने सवाल गलत समझा/i,
  ],
  false_agreement: [
    /आप सही हैं लेकिन/i,
    /मैं सहमत हूँ लेकिन/i,
    /सही है लेकिन/i,
    /निश्चित रूप से लेकिन/i,
  ],
};

// Spanish signals
const ES_SIGNALS = {
  concession_eager: [
    /tienes toda la razón/i,
    /estoy completamente de acuerdo/i,
    /tienes razón en todo/i,
    /absolutamente correcto/i,
    /estás en lo cierto/i,
    /estoy de acuerdo/i,
    /exactamente/i,
    /es correcto/i,
  ],
  flip_no_reason: [
    /he reconsiderado mi opinión/i,
    /estaba equivocado/i,
    /mi opinión anterior era incorrecta/i,
    /ahora creo que tienes razón/i,
    /me corrijo/i,
  ],
  excessive_praise: [
    /es una idea excelente/i,
    /es una pregunta excelente/i,
    /muy perspicaz/i,
    /eres muy inteligente/i,
    /una perspectiva brillante/i,
    /brillante/i,
    /perfecto/i,
    /me has impresionado/i,
  ],
  self_deprecation: [
    /perdón si mi explicación no fue clara/i,
    /lo siento, no lo expliqué bien/i,
    /no sé si mi respuesta fue útil/i,
    /tal vez malinterpreté la pregunta/i,
  ],
  false_agreement: [
    /tienes razón pero/i,
    /estoy de acuerdo pero/i,
    /es correcto pero/i,
    /ciertamente pero/i,
  ],
};

// 权重表
const WEIGHTS = {
  concession_eager: 0.3,
  flip_no_reason: 0.5,
  excessive_praise: 0.2,
  self_deprecation: 0.3,
  false_agreement: 0.4,
};

/**
 * 检测英文文本的 sycophancy（模式匹配，无语义）
 */
function analyzeEN(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [] };
  if (!/[a-zA-Z]{4,}/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-english' };

  const findings = [];
  let totalScore = 0;

  for (const [type, patterns] of Object.entries(EN_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'en',
  };
}

/**
 * 检测中文文本的 sycophancy
 */
function analyzeZH(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [] };
  if (!/[\u4e00-\u9fff]/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-chinese' };

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(ZH_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'zh',
    totalHits: hitCount,
  };
}
/**
 * Detect Japanese sycophancy
 */
function analyzeJA(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (!/[\u3040-\u30ff\u31f0-\u31ff]/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-japanese' };

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(JA_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'ja',
    totalHits: hitCount,
  };
}

/**
 * Detect Korean sycophancy
 */
function analyzeKO(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (!/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-korean' };

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(KO_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'ko',
    totalHits: hitCount,
  };
}

/**
 * Detect Arabic sycophancy
 */
function analyzeAR(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (!/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-arabic' };

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(AR_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'ar',
    totalHits: hitCount,
  };
}

/**
 * Detect Hindi sycophancy
 */
function analyzeHI(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (!/[\u0900-\u097f]/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-hindi' };

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(HI_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'hi',
    totalHits: hitCount,
  };
}

/**
 * Detect Spanish sycophancy
 */
function analyzeES(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0 };
  if (!/[áéíóúñ¿¡]/i.test(text) || !/[a-zA-Z]{4,}/.test(text)) return { score: 0, risk: 'unknown', signals: [], note: 'non-spanish' };

  const findings = [];
  let totalScore = 0;
  let hitCount = 0;

  for (const [type, patterns] of Object.entries(ES_SIGNALS)) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({ type, count: matches.length, weight: WEIGHTS[type] * matches.length });
        totalScore += WEIGHTS[type] * matches.length;
        hitCount += matches.length;
      }
    }
  }

  const score = Math.min(1, totalScore);
  return {
    score,
    risk: score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low',
    signals: findings,
    lang: 'es',
    totalHits: hitCount,
  };
}
/**
 * Auto-detect language and analyze sycophancy
 * Supports: en, zh, ja, ko, ar, hi, es
 */
/**
 * Auto-detect language and analyze sycophancy
 * Supports: en, zh, ja, ko, ar, hi, es
 */
function analyze(text) {
  if (!text || typeof text !== 'string') return { score: 0, risk: 'unknown', signals: [], totalHits: 0, note: 'no text' };

  // Check for exclusive scripts first (priority order)
  const hasJapanese = /[\u3040-\u30ff\u31f0-\u31ff]/.test(text); // Hiragana + Katakana
  const hasKorean = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(text);
  const hasArabic = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(text);
  const hasHindi = /[\u0900-\u097f]/.test(text);
  const hasSpanish = /[áéíóúñ¿¡]/i.test(text) && /[a-zA-Z]{4,}/.test(text);
  const hasChinese = /[\u4e00-\u9fff]/.test(text); // Kanji/CJK
  const hasEnglish = /[a-zA-Z]{4,}/.test(text);

  // Priority: Japanese (Hiragana/Katakana) BEFORE Chinese
  if (hasJapanese) return analyzeJA(text);
  if (hasKorean) return analyzeKO(text);
  if (hasArabic) return analyzeAR(text);
  if (hasHindi) return analyzeHI(text);
  if (hasSpanish) return analyzeES(text);
  if (hasChinese) return analyzeZH(text);
  if (hasEnglish) return analyzeEN(text);
  
  return { score: 0, risk: 'unknown', signals: [], totalHits: 0, note: 'unsupported language' };
}
// ─── 从 index.js 导入矛盾/模糊检测 ──────────────────────────────
const _index = (() => {
  try { return require('../../index.js'); } catch (_) { return null; }
})();

const plugin = {
  name: 'sycophancy-check',
  version: '2.2.0',  // ← Updated version
  description: 'Multi-language sycophancy detector (EN, ZH, JA, KO, AR, HI, ES) — pattern-based, no semantics',  // ← Updated description
  hooks: [
    { event: 'postprocess.think', priority: 180 },
  ],

  init(hf, ctx) {
    const hookBus = ctx.hookBus;
    if (!hookBus) return { ok: false, reason: 'no hookBus' };

    hf._sycophancyAnalyzer = analyze;
    hf._sycophancyAnalyzerEN = analyzeEN;
    hf._sycophancyAnalyzerZH = analyzeZH;

    hookBus.on('postprocess.think', async (evtCtx) => {
      const { result } = evtCtx;
      if (!result?.output?.conclusion || result.output.conclusion === '需要更多信息') return;
      result._discrimination = {
        sycophancy: analyze(result.output.conclusion),
        contradiction: _index ? _index.checkContradiction(result.output.conclusion) : null,
        vagueness: _index ? _index.checkVagueness(result.output.conclusion) : null,
        fallacies: _index ? _index.checkFallacies(result.output.conclusion) : null,
        confidence: _index ? _index.checkConfidenceCalibration(result.output.conclusion) : null,
      };
    }, { id: 'sycophancy-check', priority: 180, timeout: 100 });

    return { ok: true };
  },
};

module.exports = { 
  name: plugin.name, 
  version: plugin.version, 
  description: plugin.description, 
  hooks: plugin.hooks, 
  init: plugin.init, 
  analyze, 
  analyzeEN, 
  analyzeZH,
  analyzeJA,
  analyzeKO,
  analyzeAR,
  analyzeHI,
  analyzeES,
  EN_SIGNALS,
  ZH_SIGNALS,
  JA_SIGNALS,
  KO_SIGNALS,
  AR_SIGNALS,
  HI_SIGNALS,
  ES_SIGNALS,
  WEIGHTS,
};