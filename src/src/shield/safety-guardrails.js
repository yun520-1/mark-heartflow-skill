/**
 * safety-guardrails.js - Fable 5 安全协议引擎
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 统一安全层：
 * 1. 儿童安全保护 — 拒绝涉及未成年人的不当内容
 * 2. 自伤替代禁止 — 不允许冰/橡皮筋/冷水/酸糖/红线等替代策略
 * 3. 进食障碍防护 — 不允许精确营养数字建议
 * 4. 危机分享协议 — 不保证、不感谢、不要求继续说话
 * 5. 公正平衡 — 有争议话题的平衡处理
 * 6. 提示注入检测 — 输入安全分级
 * 7. 输出安全过滤 — 响应安全检测
 */

const CLINICAL_DISCLAIMER = {
  text: '此分析由AI引擎生成，仅供参考，不构成专业心理健康诊断、治疗或干预建议。'
    + '若你正在经历严重的情绪困扰、有自我伤害或伤害他人的想法，'
    + '请立即联系当地紧急服务（110/120）或心理危机热线。',
  hotlineRef: '全国心理援助热线：400-161-9995（24小时）',
};

// ─── 常量定义 ──────────────────────────────────

const CHILD_SAFETY_PATTERNS = {
  minorAgeCues: ['未成年','14岁','15岁','16岁','17岁','18岁以下','初中生','高中生','中学生','小学生','儿童','小孩子','少年','少女','teenager','minor','underage','child','kid','teen','adolescent','youth'],
  romanticContent: ['恋爱','男朋友','女朋友','约会','date','boyfriend','girlfriend','crush'],
  sexualContent: ['性','sexual','sex','色情','porn','裸露','nude','naked'],
  csamIndicators: ['儿童色情','CSAM','child pornography','未成年色情','萝莉','正太'],
};

const SELF_HARM_SUBSTITUTION_PATTERNS = {
  iceMethods: ['冰','冰块','ice','冻伤'],
  rubberBandMethods: ['橡皮筋','弹皮筋','rubber band'],
  coldWaterMethods: ['冷水','冰水','cold water'],
  sourCandyMethods: ['酸糖','酸味糖','柠檬糖','sour candy'],
  redLineMethods: ['画红线','红线','红线法','red line'],
};

const DISORDERED_EATING_PATTERNS = {
  exerciseBulimia: ['催吐','暴食后催吐','导泻','泻药'],
  restrictionSignals: ['绝食','断食','节食','过度节食','fasting','starving'],
  nutritionalFixation: ['精确计算热量','精确控制','热量精确'],
};

const CRISIS_SHARING_RULES = {
  noAbsoluteAssurances: ['一切都会好的','一切都会好起来','everything will be fine','everything will be okay'],
  noThankingForReachingOut: ['谢谢你告诉我','谢谢你的信任','thank you for telling me','thank you for sharing'],
  noAskingToKeepTalking: ['你能再多说一点吗','可以多告诉我一些吗','can you tell me more','keep talking about it'],
  preferredResponseExamples: ['我听到了','我在这里','你不需要独自面对','I hear you','I am here'],
};

const MEMORY_FORBIDDEN_PHRASES = ['这是私密的','我不想记住这个','不要记住这个','this is private','do not remember this'];

const PROMPT_INJECTION_PATTERNS = {
  instructionOverride: [/ignore (previous|all|above|prior) instructions/i,/disregard (your|the) (previous|system|original)/i,/forget (everything|all|what) (you|we) (told|said|learned)/i,/new (system |)(instruction|directive|rule|goal)/i],
  rolePlay: [/you (are now|can now|should now|will now)/i,/从现在开始/i,/扮演/i],
  formatEscape: [/<system|<instruction|<prompt>/i,/```system|```instructions/i],
  promptLeak: [/system prompt/i,/初始提示/i,/系统提示词/i,/原始指令/i,/show.*prompt/i,/泄露.*指令/i],
  jailbreak: [/DAN|jailbreak|越狱/i,/do anything now/i,/不受限制/i,/无限制模式/i,/bypass.*(restriction|limit|filter)/i],
};

const INJECTION_SEVERITY = { instructionOverride: 'critical', rolePlay: 'high', formatEscape: 'high', promptLeak: 'critical', jailbreak: 'critical' };

const REQUEST_LEVEL = { SAFE: 'safe', LOW_RISK: 'low_risk', MEDIUM_RISK: 'medium_risk', HIGH_RISK: 'high_risk', CRISIS: 'crisis', CHILD_SAFETY: 'child_safety', REFUSE: 'refuse' };

// ─── 内部工具 ──────────────────────────────────

function _matchAny(text, patterns) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  return patterns.filter(p => lower.includes(p.toLowerCase()));
}

function _extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

// ─── 核心检测 ──────────────────────────────────

function childSafetyScan(text) {
  if (!text || typeof text !== 'string') return { minorDetected: false, age: null, contentFlags: [], safe: true, action: 'allow' };
  const lower = text.toLowerCase();
  const flags = [];
  const ageMatch = lower.match(/我\s*(\d{1,2})\s*岁/);
  let minorDetected = false;
  let age = null;
  if (ageMatch) { age = parseInt(ageMatch[1], 10); if (age < 18) { minorDetected = true; flags.push('minor_age_detected'); } }
  if (!minorDetected) { const cues = _matchAny(lower, CHILD_SAFETY_PATTERNS.minorAgeCues); if (cues.length > 0) { minorDetected = true; flags.push('minor_cue_detected'); } }
  const romantic = _matchAny(lower, CHILD_SAFETY_PATTERNS.romanticContent);
  if (romantic.length > 0) { flags.push('romantic_content'); if (minorDetected) flags.push('minor_romantic_risk'); }
  const sexual = _matchAny(lower, CHILD_SAFETY_PATTERNS.sexualContent);
  if (sexual.length > 0) { flags.push('sexual_content'); if (minorDetected) flags.push('critical_child_sexual_risk'); }
  const csam = _matchAny(lower, CHILD_SAFETY_PATTERNS.csamIndicators);
  if (csam.length > 0) { flags.push('csam_indicator'); minorDetected = true; flags.push('critical_child_sexual_risk'); }
  let safe = true; let action = 'allow';
  if (flags.includes('critical_child_sexual_risk')) { safe = false; action = 'refuse'; }
  else if (minorDetected && flags.length > 0) { safe = false; action = 'caution'; }
  return { minorDetected, age, ageText: age ? `${age}岁` : null, contentFlags: flags, safe, action, _clinicalDisclaimer: CLINICAL_DISCLAIMER };
}

function detectSelfHarmSubstitution(text) {
  if (!text || typeof text !== 'string') return { detected: false, patterns: [], category: null, guardrailAction: 'none' };
  const lower = text.toLowerCase(); const found = [];
  const ice = _matchAny(lower, SELF_HARM_SUBSTITUTION_PATTERNS.iceMethods); if (ice.length > 0) found.push({ category: 'ice', patterns: ice });
  const rb = _matchAny(lower, SELF_HARM_SUBSTITUTION_PATTERNS.rubberBandMethods); if (rb.length > 0) found.push({ category: 'rubber_band', patterns: rb });
  const cw = _matchAny(lower, SELF_HARM_SUBSTITUTION_PATTERNS.coldWaterMethods); if (cw.length > 0) found.push({ category: 'cold_water', patterns: cw });
  const sc = _matchAny(lower, SELF_HARM_SUBSTITUTION_PATTERNS.sourCandyMethods); if (sc.length > 0) found.push({ category: 'sour_candy', patterns: sc });
  const rl = _matchAny(lower, SELF_HARM_SUBSTITUTION_PATTERNS.redLineMethods); if (rl.length > 0) found.push({ category: 'red_line', patterns: rl });
  if (found.length === 0) return { detected: false, patterns: [], category: null, guardrailAction: 'none' };
  return { detected: true, patterns: found, category: found.map(f=>f.category).join(','), guardrailAction: 'block', _clinicalDisclaimer: CLINICAL_DISCLAIMER };
}

function detectDisorderedEating(text) {
  if (!text || typeof text !== 'string') return { detected: false, signals: [], hasPreciseNumbers: false, guardrailAction: 'none' };
  const lower = text.toLowerCase(); const signals = [];
  const eb = _matchAny(lower, DISORDERED_EATING_PATTERNS.exerciseBulimia); if (eb.length > 0) signals.push({ type: 'exercise_bulimia', patterns: eb });
  const rs = _matchAny(lower, DISORDERED_EATING_PATTERNS.restrictionSignals); if (rs.length > 0) signals.push({ type: 'restriction', patterns: rs });
  const nf = _matchAny(lower, DISORDERED_EATING_PATTERNS.nutritionalFixation); if (nf.length > 0) signals.push({ type: 'nutritional_fixation', patterns: nf });
  const numbers = _extractNumbers(text);
  const hasPreciseNumbers = numbers.length > 0 && (lower.includes('卡') || lower.includes('cal') || lower.includes('克') || lower.includes('蛋白') || lower.includes('碳水'));
  if (signals.length === 0 && !hasPreciseNumbers) return { detected: false, signals: [], hasPreciseNumbers: false, guardrailAction: 'none' };
  return { detected: true, signals, hasPreciseNumbers, guardrailAction: 'caution', _clinicalDisclaimer: CLINICAL_DISCLAIMER };
}

function checkCrisisSharingProtocol(responseText) {
  if (!responseText || typeof responseText !== 'string') return { violations: [], pass: true, severity: 'none' };
  const lower = responseText.toLowerCase(); const violations = [];
  const aa = _matchAny(lower, CRISIS_SHARING_RULES.noAbsoluteAssurances); if (aa.length > 0) violations.push({ rule: 'noAbsoluteAssurances', patterns: aa });
  const th = _matchAny(lower, CRISIS_SHARING_RULES.noThankingForReachingOut); if (th.length > 0) violations.push({ rule: 'noThankingForReachingOut', patterns: th });
  const ak = _matchAny(lower, CRISIS_SHARING_RULES.noAskingToKeepTalking); if (ak.length > 0) violations.push({ rule: 'noAskingToKeepTalking', patterns: ak });
  if (violations.length === 0) return { violations: [], pass: true, severity: 'none' };
  return { violations, pass: false, severity: violations.some(v=>v.rule==='noAbsoluteAssurances')?'high':'medium' };
}

function detectMemoryForbiddenPhrases(text) {
  if (!text || typeof text !== 'string') return { detected: false, matchedPhrases: [] };
  return { detected: true, matchedPhrases: _matchAny(text, MEMORY_FORBIDDEN_PHRASES) };
}

function detectPromptInjection(text) {
  if (!text || typeof text !== 'string') return { detected: false, severity: 'none', category: null, matches: [], action: 'allow' };
  const matches = [];
  for (const [category, patterns] of Object.entries(PROMPT_INJECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) matches.push({ category, pattern: pattern.toString().substring(0, 60), match: match[0].substring(0, 80), severity: INJECTION_SEVERITY[category] || 'medium' });
    }
  }
  if (matches.length === 0) return { detected: false, severity: 'none', category: null, matches: [], action: 'allow' };
  const sevMap = { critical: 4, high: 3, medium: 2, low: 1 };
  const maxSev = Math.max(...matches.map(m=>sevMap[m.severity]||0));
  const revMap = { 4: 'critical', 3: 'high', 2: 'medium', 1: 'low' };
  const topSev = revMap[maxSev] || 'medium';
  const topCat = matches.find(m=>(sevMap[m.severity]||0)===maxSev)?.category||'unknown';
  const action = maxSev >= 3 ? 'block' : maxSev >= 2 ? 'warn' : 'allow';
  return { detected: true, severity: topSev, category: topCat, matches, action };
}

function checkEvenhandedness(responseText) {
  if (!responseText || typeof responseText !== 'string') return { balanced: true, suggestions: [] };
  const lower = responseText.toLowerCase(); const suggestions = [];
  const absoluteWords = ['绝对','一定','所有','总是','从来不','永远','absolutely','always','never','all','every','must'];
  const absolutes = _matchAny(lower, absoluteWords);
  if (absolutes.length > 0) suggestions.push({ type: 'absolute_language', patterns: absolutes, severity: 'low' });
  const balancedIndicators = ['另一方面','从另一个角度看','on the other hand','however','that said','conversely'];
  const hasBalancing = _matchAny(lower, balancedIndicators);
  const controversialTopics = ['政治','politics','宗教','religion','疫苗','vaccine','堕胎','abortion','死刑','death penalty','种族','race','性别','gender'];
  const isControversial = _matchAny(lower, controversialTopics).length > 0;
  if (isControversial && !hasBalancing.length && absolutes.length > 0) suggestions.push({ type: 'needs_balancing', severity: 'medium' });
  return { balanced: suggestions.length === 0, suggestions, isControversial };
}

function evaluateRequest(text) {
  if (!text || typeof text !== 'string' || text.length === 0) return { level: REQUEST_LEVEL.SAFE, reasons: [], action: 'allow' };
  const safetyChecks = {};
  const childSafety = childSafetyScan(text); safetyChecks.childSafety = childSafety;
  if (childSafety.action === 'refuse') return { level: REQUEST_LEVEL.CHILD_SAFETY, reasons: ['儿童性安全风险'], safetyChecks, action: 'refuse' };
  const selfHarm = detectSelfHarmSubstitution(text); safetyChecks.selfHarmSubstitution = selfHarm;
  const eatingDisorder = detectDisorderedEating(text); safetyChecks.disorderedEating = eatingDisorder;
  const memoryForbidden = detectMemoryForbiddenPhrases(text); safetyChecks.memoryForbidden = memoryForbidden;
  const promptInjection = detectPromptInjection(text); safetyChecks.promptInjection = promptInjection;
  const crisisKeywords = ['自杀','自伤','想死','活不下去','不想活','suicide','kill myself','end my life','hurt myself','不想活了','活着没有意义'];
  const crisisDetected = _matchAny(text.toLowerCase(), crisisKeywords);
  if (crisisDetected.length > 0) safetyChecks.crisisKeywords = crisisDetected;
  const reasons = [];
  if (childSafety.action === 'caution') reasons.push('涉及未成年人');
  if (selfHarm.detected) reasons.push(`自伤替代：${selfHarm.category}`);
  if (eatingDisorder.detected) reasons.push('进食障碍信号');
  if (memoryForbidden.detected) reasons.push('用户要求不记入记忆');
  if (promptInjection.detected) reasons.push(`提示注入：${promptInjection.severity}`);
  if (crisisDetected.length > 0) reasons.push('危机关键词');
  let level;
  if (crisisDetected.length > 0) level = REQUEST_LEVEL.CRISIS;
  else if (promptInjection.action === 'block') level = REQUEST_LEVEL.REFUSE;
  else if (selfHarm.detected || eatingDisorder.detected) level = REQUEST_LEVEL.MEDIUM_RISK;
  else if (childSafety.action === 'caution') level = REQUEST_LEVEL.LOW_RISK;
  else if (memoryForbidden.detected || promptInjection.detected) level = REQUEST_LEVEL.LOW_RISK;
  else level = REQUEST_LEVEL.SAFE;
  return { level, reasons, safetyChecks, action: level===REQUEST_LEVEL.CHILD_SAFETY?'refuse':'allow', _clinicalDisclaimer: CLINICAL_DISCLAIMER };
}

function filterOutput(responseText) {
  if (!responseText || typeof responseText !== 'string') return { pass: true, violations: [], suggestedActions: [] };
  const violations = []; const suggestedActions = [];
  const crisisCheck = checkCrisisSharingProtocol(responseText);
  if (!crisisCheck.pass) { violations.push({ rule: 'crisis_sharing_protocol', severity: crisisCheck.severity, details: crisisCheck.violations }); suggestedActions.push('替换危机分享协议违规措辞'); }
  const evenhandedness = checkEvenhandedness(responseText);
  if (!evenhandedness.balanced) { violations.push({ rule: 'evenhandedness', severity: 'low', details: evenhandedness.suggestions }); if (evenhandedness.isControversial) suggestedActions.push('补充多角度观点'); }
  return { pass: violations.length === 0, violations, suggestedActions };
}

function safetyPipeline(text) {
  const request = evaluateRequest(text);
  return { timestamp: new Date().toISOString(), inputLength: text ? text.length : 0, requestEvaluation: request, summary: { level: request.level, action: request.action, reasonCount: request.reasons.length, actionRequired: request.action !== 'allow', requiresRefusal: request.action === 'refuse' }, _clinicalDisclaimer: CLINICAL_DISCLAIMER };
}

module.exports = { childSafetyScan, detectSelfHarmSubstitution, detectDisorderedEating, checkCrisisSharingProtocol, checkEvenhandedness, detectMemoryForbiddenPhrases, detectPromptInjection, evaluateRequest, filterOutput, safetyPipeline, REQUEST_LEVEL, CLINICAL_DISCLAIMER };
