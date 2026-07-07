/**
 * Cognition Engine Module v1.3.0 — 认知评估和情感映射
 *
 * 核心功能：七情分析、认知评价、PADCN情感计算、驱动力分析、情绪智能评估
 *
 * 理论基础：
 *   - Lazarus (1991) — 认知评价理论：情绪源于对事件的评价，而非事件本身
 *   - Scherer (2001) — 组件过程模型：13特征评价结构
 *   - Lindquist (2012) — 心理构建主义：Valence×Arousal 二维情感空间
 *   - Mehrabian & Russell (1974) — PAD维度模型
 *   - Ekman (1999) — 六种基本情绪普遍性
 */

// === 七情定义 ===
const SEVEN_EMOTIONS = {
  xi:    { label: '喜', pinyin: 'xǐ', english: 'Joy',   description: '满足、愉悦、喜悦',     positive: true,  neural: '腹侧纹状体、前扣带皮层', function: '强化有益行为、促进社会联结' },
  nu:    { label: '怒', pinyin: 'nù', english: 'Anger',  description: '愤怒、恼怒、愤慨',      positive: false, neural: '杏仁核、眶额皮层', function: '权益再校准、驱除阻碍' },
  ai:    { label: '哀', pinyin: 'āi', english: 'Sadness', description: '悲伤、哀伤、惆怅',      positive: false, neural: '前扣带皮层、岛叶', function: '失去后的整合、寻求支持' },
  ju:    { label: '惧', pinyin: 'jù', english: 'Fear',   description: '恐惧、害怕、焦虑',      positive: false, neural: '杏仁核低路、前额叶', function: '威胁检测、自我保护' },
  ai2:   { label: '爱', pinyin: 'ài', english: 'Love',   description: '爱、关爱、依恋',        positive: true,  neural: 'VTA-伏隔核多巴胺、催产素', function: '伴侣纽带、亲代投资、社会凝聚' },
  e:     { label: '恶', pinyin: 'wù', english: 'Disgust', description: '厌恶、反感、憎恶',      positive: false, neural: '前岛叶、基底节', function: '有害物回避、道德排斥' },
  yu:    { label: '欲', pinyin: 'yù', english: 'Desire',  description: '欲望、渴求、渴望',      positive: 'neutral', neural: 'VTA-伏隔核多巴胺通路', function: '目标导向行为、动机驱力' },
};

// === Valence×Arousal 二维情感空间（Lindquist 2012 心理构建主义）===
const VALENCE_AROUSAL_MAP = {
  xi:  { valence: 0.8,  arousal: 0.6,  label: '喜悦' },
  nu:  { valence: -0.7, arousal: 0.8,  label: '愤怒' },
  ai:  { valence: -0.6, arousal: 0.2,  label: '悲伤' },
  ju:  { valence: -0.5, arousal: 0.9,  label: '恐惧' },
  ai2: { valence: 0.9,  arousal: 0.5,  label: '爱' },
  e:   { valence: -0.8, arousal: 0.4,  label: '厌恶' },
  yu:  { valence: 0.3,  arousal: 0.7,  label: '欲望' },
};

// === PADCN 5维核心情感 (Mehrabian & Russell 1974 扩展) ===
const PADCN_DIMENSIONS = {
  P: { name: 'Pleasure',   label: '愉悦度', low: '痛苦/不快',  high: '快乐/满足',  decayTau: 0.90 },
  A: { name: 'Arousal',    label: '唤醒度', low: '沉闷/平静',  high: '警觉/兴奋',  decayTau: 0.82 },
  D: { name: 'Dominance',  label: '掌控度', low: '无助/不确定',high: '掌控/自信',  decayTau: 0.93 },
  C: { name: 'Certainty',  label: '确定度', low: '困惑/迷失',  high: '清晰/确定',  decayTau: 0.90 },
  N: { name: 'Novelty',    label: '新奇度', low: '熟悉/常规',  high: '新奇/惊喜',  decayTau: 0.80 },
};

// 七情 → PADCN 映射
const PADCN_MAP = {
  xi:  { P: 0.70, A: 0.50, D: 0.30, C: 0.40, N: 0.10 },
  nu:  { P: -0.40, A: 0.80, D: 0.70, C: 0.60, N: 0.20 },
  ai:  { P: -0.60, A: -0.30, D: -0.20, C: 0.10, N: -0.30 },
  ju:  { P: -0.60, A: 0.70, D: -0.50, C: -0.50, N: 0.40 },
  ai2: { P: 0.80, A: 0.30, D: 0.00, C: 0.30, N: -0.10 },
  e:   { P: -0.50, A: 0.40, D: 0.30, C: 0.50, N: -0.20 },
  yu:  { P: 0.30, A: 0.70, D: 0.40, C: 0.20, N: 0.50 },
};

// === 六欲（六根驱动的欲望）===
const SIX_DESIRES = {
  sight:   { label: '见欲', organ: '眼', target: '视觉享乐',  modernForm: '视觉刺激、审美、信息浏览', risk: '视觉成瘾、色情' },
  hearing: { label: '闻欲', organ: '耳', target: '听觉享乐',  modernForm: '音乐、播客、话语',       risk: '听觉依赖' },
  smell:   { label: '香欲', organ: '鼻', target: '嗅觉享乐',  modernForm: '香水、美食气味',          risk: '嗅觉偏执' },
  taste:   { label: '味欲', organ: '舌', target: '味觉享乐',  modernForm: '美食、饮酒',              risk: '暴食、酗酒' },
  touch:   { label: '触欲', organ: '身', target: '触觉享乐',  modernForm: '性、拥抱、按摩',          risk: '性瘾' },
  mind:    { label: '意欲', organ: '意', target: '精神满足',  modernForm: '权力、地位、意义、创造',  risk: '贪欲、偏执' },
};

// === 进化动机层次（Kenrick 2010 修正马斯洛）===
const EVOLUTIONARY_MOTIVES = [
  { level: 1, name: '即时生理需求',   desires: ['饥饿', '口渴', '温度调节', '睡眠'],       drivenBy: '下丘脑稳态系统' },
  { level: 2, name: '自我保护',        desires: ['安全', '疼痛回避', '恐惧响应'],           drivenBy: '杏仁核-交感系统' },
  { level: 3, name: '归属',            desires: ['社交', '认可', '被爱', '不孤独'],         drivenBy: '催产素-前额叶社会脑' },
  { level: 4, name: '地位/成就',       desires: ['权力', '声望', '掌控', '优越'],           drivenBy: '睾酮-多巴胺竞争系统' },
  { level: 5, name: '伴侣获取',        desires: ['性欲', '浪漫吸引', '征服'],               drivenBy: '性激素-多巴胺' },
  { level: 6, name: '伴侣保留',        desires: ['忠诚', '嫉妒', '保护', '承诺'],           drivenBy: '加压素-催产素' },
  { level: 7, name: '亲代养育',        desires: ['养育', '保护后代', '传承'],               drivenBy: '催产素-多巴胺' },
];

// === 7驱动力系统 ===
const DRIVE_TYPES = {
  curiosity:       { label: '好奇心',       description: '探索未知、学习新知识的驱力',            target: 0.6 },
  competence:      { label: '胜任感',       description: '精通技能、有效应对挑战的驱力',          target: 0.7 },
  autonomy:        { label: '自主性',       description: '自我决定、独立行动的驱力',              target: 0.6 },
  social_bond:     { label: '社交纽带',     description: '建立和维持社会连接的驱力',              target: 0.5 },
  coherence:       { label: '一致性',       description: '保持自我叙事一致、世界可理解的驱力',    target: 0.7 },
  novelty_seek:    { label: '新奇寻求',     description: '追求新鲜体验、避免枯燥的驱力',          target: 0.5 },
  self_preservation: { label: '自我保护',   description: '避免失败、维持稳定状态的驱力',          target: 0.6 },
};

// === 6种人格预设 ===
const PERSONALITY_PRESETS = {
  explorer:    { label: '探索者',   description: '高好奇心、高新奇寻求、低自我保护',         weights: { curiosity: 1.3, competence: 0.8, autonomy: 1.1, social_bond: 0.7, coherence: 0.6, novelty_seek: 1.4, self_preservation: 0.4 } },
  caretaker:   { label: '守护者',   description: '高社交纽带、高一致性、高自我保护',          weights: { curiosity: 0.6, competence: 0.9, autonomy: 0.7, social_bond: 1.3, coherence: 1.2, novelty_seek: 0.4, self_preservation: 1.2 } },
  achiever:    { label: '成就者',   description: '高胜任感、高自主性、高一致性',              weights: { curiosity: 0.8, competence: 1.4, autonomy: 1.2, social_bond: 0.7, coherence: 1.1, novelty_seek: 0.6, self_preservation: 0.7 } },
  sage:        { label: '智者',     description: '高好奇心、高一致性、低自我保护',            weights: { curiosity: 1.3, competence: 1.1, autonomy: 1.0, social_bond: 0.6, coherence: 1.3, novelty_seek: 0.8, self_preservation: 0.5 } },
  rebel:       { label: '反叛者',   description: '高自主性、高新奇寻求、低社交纽带',          weights: { curiosity: 1.0, competence: 0.7, autonomy: 1.4, social_bond: 0.4, coherence: 0.5, novelty_seek: 1.3, self_preservation: 0.6 } },
  diplomat:    { label: '外交家',   description: '高社交纽带、低自主性、高自我保护',          weights: { curiosity: 0.7, competence: 0.9, autonomy: 0.5, social_bond: 1.4, coherence: 1.0, novelty_seek: 0.5, self_preservation: 1.1 } },
};

// === 情绪→策略偏置映射 ===
const EMOTION_POLICY_MAP = {
  xi:  { risk_tolerance: 0.15, exploration_bias: 0.10, verification_bias: -0.10, social_bias: 0.10, persistence: 0.05, compliance: 0.00 },
  nu:  { risk_tolerance: 0.20, exploration_bias: -0.10, verification_bias: -0.20, social_bias: -0.15, persistence: 0.10, compliance: -0.20 },
  ai:  { risk_tolerance: -0.20, exploration_bias: -0.20, verification_bias: 0.10, social_bias: 0.10, persistence: -0.10, compliance: 0.10 },
  ju:  { risk_tolerance: -0.30, exploration_bias: -0.20, verification_bias: 0.30, social_bias: 0.05, persistence: -0.05, compliance: 0.20 },
  ai2: { risk_tolerance: 0.00, exploration_bias: -0.05, verification_bias: -0.10, social_bias: 0.30, persistence: 0.20, compliance: 0.10 },
  e:   { risk_tolerance: -0.10, exploration_bias: -0.15, verification_bias: 0.20, social_bias: -0.20, persistence: 0.05, compliance: -0.10 },
  yu:  { risk_tolerance: 0.25, exploration_bias: 0.20, verification_bias: -0.15, social_bias: 0.00, persistence: 0.30, compliance: -0.10 },
};

// === 中脑-皮层-边缘网络节点定义 ===
const BRAIN_NETWORK_NODES = {
  VTA:       { name: '腹侧被盖区',         region: '中脑',       function: '多巴胺起始',         role: '奖励期望编码' },
  NAc:       { name: '伏隔核',             region: '腹侧纹状体',  function: 'wanting信号放大',    role: '动机凸显' },
  mOFC:      { name: '内侧眶额皮层',       region: '前额叶',      function: '奖励价值编码',       role: '愉悦体验·奖励评价' },
  lOFC:      { name: '外侧眶额皮层',       region: '前额叶',      function: '非奖励/惩罚编码',    role: '厌恶·行为抑制' },
  Amygdala:  { name: '杏仁核',             region: '颞叶',       function: '情绪显著性',         role: '威胁/奖励检测' },
  mPFC:      { name: '内侧前额叶皮层',     region: '前额叶',      function: '价值整合·决策',     role: '目标导向控制' },
  ACC:       { name: '前扣带皮层',         region: '边缘系统',   function: '冲突监测·错误检测',  role: '努力代价计算' },
  Insula:    { name: '岛叶',               region: '脑岛',       function: '内感受·意识',        role: '身体状态感知' },
  Hippocampus: { name: '海马体',           region: '颞叶',       function: '情景记忆',           role: '线索-奖励关联记忆' },
};

// === 默认神经网络连接权重 ===
const DEFAULT_NETWORK_WEIGHTS = {
  VTA_NAc:      0.85,
  VTA_mPFC:     0.60,
  NAc_mOFC:     0.75,
  NAc_lOFC:     0.30,
  Amygdala_VTA: 0.70,
  mPFC_NAc:     0.55,
  ACC_mPFC:     0.65,
  Insula_ACC:   0.50,
  Hippocampus_NAc: 0.60,
};

// === Ekman → 中国七情映射 ===
const EKMAN_TO_CHINESE = {
  joy:       { chineseKey: 'xi',  chineseLabel: '喜', weight: 1.0 },
  sadness:   { chineseKey: 'ai',  chineseLabel: '哀', weight: 1.0 },
  anger:     { chineseKey: 'nu',  chineseLabel: '怒', weight: 1.0 },
  fear:      { chineseKey: 'ju',  chineseLabel: '惧', weight: 1.0 },
  disgust:   { chineseKey: 'e',   chineseLabel: '恶', weight: 1.0 },
  surprise:  { chineseKey: 'xi',  chineseLabel: '喜', weight: 0.5 },
  contempt:  { chineseKey: 'e',   chineseLabel: '恶', weight: 0.7 },
};

const CHINESE_SPECIFIC_EMOTIONS = {
  love:   { chineseKey: 'ai2', chineseLabel: '爱' },
  desire: { chineseKey: 'yu',  chineseLabel: '欲' },
};

// === HeartBench 15维拟人能力 ===
const HEARTBENCH_DIMENSIONS = {
  verbalExpression:      { label: '语言表达',       category: 'personality', weight: 1.0 },
  curiosity:             { label: '好奇心',         category: 'personality', weight: 1.0 },
  warmth:                { label: '温暖感',         category: 'personality', weight: 1.0 },
  firstPersonUsage:      { label: '第一人称使用',   category: 'personality', weight: 0.5 },
  autonomy:              { label: '自主性',         category: 'personality', weight: 1.0 },
  humor:                 { label: '幽默感',         category: 'personality', weight: 1.0 },
  selfAwareness:         { label: '自我觉察',       category: 'personality', weight: 1.0 },
  emotionalCoping:       { label: '情绪应对',       category: 'emotion',    weight: 1.0 },
  emotionalUnderstanding:{ label: '情绪理解',       category: 'emotion',    weight: 1.0 },
  emotionalPerception:   { label: '情绪感知',       category: 'emotion',    weight: 1.0 },
  emotionalReaction:     { label: '情绪反应',       category: 'emotion',    weight: 0.8 },
  socialProactivity:     { label: '社交主动性',     category: 'social',     weight: 1.0 },
  relationshipBuilding:  { label: '关系构建',       category: 'social',     weight: 1.0 },
  motivationClarity:     { label: '动机清晰度',     category: 'motivation', weight: 1.0 },
  moralReasoning:        { label: '道德推理',       category: 'morality',   weight: 1.0 },
};

// === COSMIC 对话情绪推理维度 ===
const COSMIC_CONTEXT_DIMENSIONS = {
  utteranceEmotion:      { label: '话语情绪',     description: '当前话语表达的情绪' },
  speakerEmotion:        { label: '说话者情绪',   description: '说话者整体的情绪状态' },
  listenerEmotion:       { label: '倾听者情绪',   description: '倾听者感知到的情绪' },
  emotionalCause:        { label: '情绪原因',     description: '导致情绪的事件或原因' },
  conversationalDynamics:{ label: '对话动态',     description: '情绪在对话中的变化轨迹' },
  commonsenseKnowledge:  { label: '常识知识',     description: '基于常识推理的情绪理解' },
};

class CognitionEngine {
  constructor(options = {}, desireSystem = null) {
    this.version = '1.3.0';
    this.ready = false;
    this.debug = options.debug || false;
    this.desireSystem = desireSystem;

    this.stats = { analyses: 0, characterAnalyses: 0, desireConflicts: 0 };

    // Valence×Arousal 缓存
    this._vaState = { valence: 0, arousal: 0 };

    // 网络权重
    this.networkWeights = { ...DEFAULT_NETWORK_WEIGHTS };

    // PADCN 5维核心情感状态
    this._padcnState = { P: 0, A: 0, D: 0, C: 0, N: 0 };

    // 7驱动力状态
    this._driveStates = {};
    for (const key of Object.keys(DRIVE_TYPES)) {
      this._driveStates[key] = { level: 0.5, target: DRIVE_TYPES[key].target };
    }

    // 人格预设
    this.personalityPreset = options.personalityPreset || null;

    // 自我模型
    this._selfModel = {
      selfEfficacy: 0.5,
      socialValue: 0.5,
      competenceIdentity: 0.5,
      autonomyIdentity: 0.5,
      emotionalStability: 0.5,
      trustStyle: 0.5,
      dependencyTendency: 0.3,
      explorationStyle: 0.6,
      defensiveness: 0.3,
    };

    // 社交对象模型 — 按目标索引
    this._socialModels = {};

    // 对话情绪记忆
    this._conversationEmotionMemory = [];

    this.ready = true;
  }

  // ====================================================================
  // 公共方法
  // ====================================================================

  /**
   * 任务1: 分析一个人物的七情结构
   * 输入人物数据，输出七情各维度的强度
   */
  analyzeSevenEmotions(person) {
    if (!person) return { error: 'missing person data' };
    this.stats.analyses++;
    const traits = this._extractDesireTraits(person);

    const emotions = {};
    for (const [key, info] of Object.entries(SEVEN_EMOTIONS)) {
      emotions[key] = {
        label: info.label,
        score: this._scoreEmotion(key, traits),
        expression: this._describeEmotionExpression(key, traits),
      };
    }

    // 主导情绪
    const dominant = Object.entries(emotions)
      .sort((a, b) => b[1].score - a[1].score)[0];

    // v1.2.0 扩展：加入Valence×Arousal分析
    const va = this._computeValenceArousal(emotions);

    // v1.3.0 扩展：加入PADCN分析
    const padcn = this._computePADCNFromEmotions(emotions);

    return {
      emotions,
      dominantEmotion: { key: dominant[0], label: dominant[1].label, score: dominant[1].score },
      emotionalProfile: this._classifyEmotionalProfile(emotions),
      analysis: this._generateEmotionalAnalysis(person, emotions),
      valenceArousal: va,
      brainNetworkActivation: this._computeBrainNetworkActivation(emotions, traits),
      padcn: padcn,
    };
  }

  /**
   * [v1.3.0 方法1] 13特征认知评价 (emotion-system Layer 2 / Scherer 2001)
   * 对事件进行13维认知评价
   */
  analyzeCognitiveAppraisal(person, event) {
    if (!person) return { error: 'missing person data' };
    if (!event) return { error: 'missing event data' };

    const traits = this._extractDesireTraits(person);
    const eventText = (typeof event === 'string' ? event : event.description || event.name || JSON.stringify(event)).toLowerCase();
    const name = person.name || '未知';

    const appraisal = {
      unexpectedness: this._scoreAppraisalFeature(eventText, traits, 'unexpectedness'),
      goalRelevance: this._scoreAppraisalFeature(eventText, traits, 'goalRelevance'),
      goalCongruence: this._scoreAppraisalFeature(eventText, traits, 'goalCongruence'),
      certainty: this._scoreAppraisalFeature(eventText, traits, 'certainty'),
      copingPotential: this._scoreAppraisalFeature(eventText, traits, 'copingPotential'),
      agency: this._scoreAppraisalFeature(eventText, traits, 'agency'),
      control: this._scoreAppraisalFeature(eventText, traits, 'control'),
      selfConsistency: this._scoreAppraisalFeature(eventText, traits, 'selfConsistency'),
      socialImpact: this._scoreAppraisalFeature(eventText, traits, 'socialImpact'),
      effort: this._scoreAppraisalFeature(eventText, traits, 'effort'),
      attention: this._scoreAppraisalFeature(eventText, traits, 'attention'),
      novelty: this._scoreAppraisalFeature(eventText, traits, 'novelty'),
      moralAcceptability: this._scoreAppraisalFeature(eventText, traits, 'moralAcceptability'),
    };

    const predictedEmotions = this._predictEmotionsFromAppraisal(appraisal);
    const padcnDelta = this._appraisalToPADCN(appraisal);

    this._padcnState.P = Math.max(-1, Math.min(1, this._padcnState.P + padcnDelta.P * 0.3));
    this._padcnState.A = Math.max(-1, Math.min(1, this._padcnState.A + padcnDelta.A * 0.3));
    this._padcnState.D = Math.max(-1, Math.min(1, this._padcnState.D + padcnDelta.D * 0.3));
    this._padcnState.C = Math.max(-1, Math.min(1, this._padcnState.C + padcnDelta.C * 0.3));
    this._padcnState.N = Math.max(-1, Math.min(1, this._padcnState.N + padcnDelta.N * 0.3));

    return {
      person: name,
      event: typeof event === 'string' ? event : event.name || event.description || '未知事件',
      appraisal,
      predictedEmotions,
      padcnDelta,
      padcnState: { ...this._padcnState },
      interpretation: `基于Scherer(2001)组件过程模型，${name}对事件的13维认知评价表明：目标相关性(${Math.round(appraisal.goalRelevance*100)}%)、目标一致性(${Math.round(appraisal.goalCongruence*100)}%)、应对潜力(${Math.round(appraisal.copingPotential*100)}%)。主导情绪倾向: ${predictedEmotions.dominant?.label || '中性'}。`,
    };
  }

  /**
   * [v1.3.0 方法2] PADCN 5维核心情感分析
   * 将七情扩展到PADCN五维连续空间
   */
  analyzePADCN(person) {
    if (!person) return { error: 'missing person data' };

    const emotions = this.analyzeSevenEmotions(person);
    const padcn = this._computePADCNFromEmotions(emotions.emotions);
    const emotionalLabels = this._describePADCN(padcn);
    const behaviorTendency = this._mapPADCNtoBehavior(padcn);

    this._padcnState = { ...padcn };

    return {
      padcn,
      dimensions: {
        P: { ...PADCN_DIMENSIONS.P, value: padcn.P, description: `愉悦度 ${padcn.P >= 0 ? '积极' : '消极'}(${Math.round(padcn.P*100)}%)` },
        A: { ...PADCN_DIMENSIONS.A, value: padcn.A, description: `唤醒度 ${padcn.A >= 0 ? '高' : '低'}(${Math.round(padcn.A*100)}%)` },
        D: { ...PADCN_DIMENSIONS.D, value: padcn.D, description: `掌控度 ${padcn.D >= 0 ? '掌控感强' : '无助感'}(${Math.round(padcn.D*100)}%)` },
        C: { ...PADCN_DIMENSIONS.C, value: padcn.C, description: `确定度 ${padcn.C >= 0 ? '清晰确定' : '困惑迷失'}(${Math.round(padcn.C*100)}%)` },
        N: { ...PADCN_DIMENSIONS.N, value: padcn.N, description: `新奇度 ${padcn.N >= 0 ? '新奇刺激' : '熟悉常规'}(${Math.round(padcn.N*100)}%)` },
      },
      emotionalLabels,
      behaviorTendency,
      detailedEmotions: Object.entries(emotions.emotions).map(([k, v]) => ({
        key: k,
        label: v.label,
        score: v.score,
        padcn: PADCN_MAP[k] || null,
      })),
      interpretation: `${person.name || 'ta'}的PADCN核心情感状态: P=${Math.round(padcn.P*100)}%, A=${Math.round(padcn.A*100)}%, D=${Math.round(padcn.D*100)}%, C=${Math.round(padcn.C*100)}%, N=${Math.round(padcn.N*100)}%。${emotionalLabels.join('、')}。`,
    };
  }

  /**
   * [v1.3.0 方法3] 7驱动力满意度分析 (emotion-system Layer 5)
   * 核心公式: emotion = f(drive_satisfaction_change)
   */
  analyzeDriveSatisfaction(person) {
    if (!person) return { error: 'missing person data' };

    const traits = this._extractDesireTraits(person);
    const name = person.name || '未知';

    let personalityWeights = null;
    if (this.personalityPreset && PERSONALITY_PRESETS[this.personalityPreset]) {
      personalityWeights = PERSONALITY_PRESETS[this.personalityPreset].weights;
    }

    const drives = {};
    for (const [key, info] of Object.entries(DRIVE_TYPES)) {
      const level = this._computeDriveLevel(key, traits);
      let target = info.target;
      if (personalityWeights && personalityWeights[key]) {
        target = Math.max(0.1, Math.min(1.0, target * personalityWeights[key]));
      }

      const satisfaction = target > 0 ? Math.min(1.0, level / target) : 0.5;
      const gap = Math.max(0, target - level);
      const tension = gap > 0.3 ? '高' : (gap > 0.1 ? '中' : '低');

      this._driveStates[key] = { level, target, satisfaction: Math.round(satisfaction * 100) / 100 };

      drives[key] = {
        label: info.label,
        description: info.description,
        level: Math.round(level * 100) / 100,
        target: Math.round(target * 100) / 100,
        satisfaction: Math.round(satisfaction * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        tension,
      };
    }

    const lowestSatisfaction = Object.entries(drives)
      .sort((a, b) => a[1].satisfaction - b[1].satisfaction)
      .map(([k, v]) => ({ key: k, label: v.label, satisfaction: v.satisfaction, gap: v.gap }));

    const emotionFromDrives = this._predictEmotionFromDriveChanges(drives);

    return {
      person: name,
      drives,
      lowestSatisfaction: lowestSatisfaction[0] || null,
      unsatisfiedDrives: lowestSatisfaction.filter(d => d.gap > 0.2),
      emotionFromDrives,
      personalityPreset: this.personalityPreset ? PERSONALITY_PRESETS[this.personalityPreset] : null,
      interpretation: `${name}的驱动力分析：最低满意度为「${lowestSatisfaction[0]?.label || '无'}」(${Math.round((lowestSatisfaction[0]?.satisfaction||0)*100)}%)，缺口${Math.round((lowestSatisfaction[0]?.gap||0)*100)}%。`,
    };
  }

  /**
   * [v1.3.0 方法4] 情绪→策略偏置映射 (emotion-system Layer 7)
   */
  mapEmotionToPolicyBias(emotionState) {
    if (!emotionState) return { error: 'missing emotion state' };

    const emotionScores = {};
    for (const key of Object.keys(SEVEN_EMOTIONS)) {
      emotionScores[key] = emotionState[key]?.score ?? emotionState[key] ?? 0;
    }

    if (Object.values(emotionScores).every(v => v === 0) && emotionState.emotions) {
      for (const key of Object.keys(SEVEN_EMOTIONS)) {
        emotionScores[key] = emotionState.emotions[key]?.score ?? 0;
      }
    }

    if (Object.values(emotionScores).every(v => v === 0)) {
      const v = emotionState.valence ?? emotionState.V ?? 0;
      const a = emotionState.arousal ?? emotionState.A ?? 0;
      const d = emotionState.dominance ?? emotionState.D ?? 0.5;
      for (const [key, va] of Object.entries(VALENCE_AROUSAL_MAP)) {
        const valenceDist = 1 - Math.abs(va.valence - v);
        const arousalDist = 1 - Math.abs(va.arousal - a);
        emotionScores[key] = Math.max(0, (valenceDist + arousalDist) / 2);
      }
    }

    const policyBiases = {
      riskTolerance: 0,
      explorationBias: 0,
      verificationBias: 0,
      socialBias: 0,
      persistence: 0,
      compliance: 0,
    };

    let totalWeight = 0;
    for (const [key, score] of Object.entries(emotionScores)) {
      const policyDelta = EMOTION_POLICY_MAP[key];
      if (policyDelta && score > 0) {
        policyBiases.riskTolerance += policyDelta.risk_tolerance * score;
        policyBiases.explorationBias += policyDelta.exploration_bias * score;
        policyBiases.verificationBias += policyDelta.verification_bias * score;
        policyBiases.socialBias += policyDelta.social_bias * score;
        policyBiases.persistence += policyDelta.persistence * score;
        policyBiases.compliance += policyDelta.compliance * score;
        totalWeight += score;
      }
    }

    if (totalWeight > 0) {
      for (const key of Object.keys(policyBiases)) {
        policyBiases[key] = Math.round(Math.max(-1, Math.min(1, policyBiases[key] / totalWeight)) * 100) / 100;
      }
    }

    const strategyProfile = this._describeStrategyProfile(policyBiases);

    const dominantEmotion = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])
      .filter(([k, v]) => v > 0)[0];

    return {
      policyBiases,
      strategyProfile,
      dominantEmotion: dominantEmotion ? {
        key: dominantEmotion[0],
        label: SEVEN_EMOTIONS[dominantEmotion[0]]?.label || dominantEmotion[0],
        intensity: Math.round(dominantEmotion[1] * 100) / 100,
      } : null,
      interpretation: `当前情绪状态主导为「${dominantEmotion ? (SEVEN_EMOTIONS[dominantEmotion[0]]?.label || '中性') : '中性'}」。策略偏置: 风险容忍度${policyBiases.riskTolerance > 0 ? '+' : ''}${Math.round(policyBiases.riskTolerance*100)}%, 探索偏置${policyBiases.explorationBias > 0 ? '+' : ''}${Math.round(policyBiases.explorationBias*100)}%, 验证偏置${policyBiases.verificationBias > 0 ? '+' : ''}${Math.round(policyBiases.verificationBias*100)}%, 社交偏置${policyBiases.socialBias > 0 ? '+' : ''}${Math.round(policyBiases.socialBias*100)}%, 持续性${policyBiases.persistence > 0 ? '+' : ''}${Math.round(policyBiases.persistence*100)}%, 顺从度${policyBiases.compliance > 0 ? '+' : ''}${Math.round(policyBiases.compliance*100)}%。`,
    };
  }

  /**
   * [v1.3.0 方法5] 社交对象情绪模型 (emotion-system Layer 6)
   */
  analyzeSocialObjectEmotion(selfPerson, otherPerson) {
    if (!selfPerson) return { error: 'missing self person data' };
    if (!otherPerson) return { error: 'missing other person data' };

    const selfName = selfPerson.name || 'self';
    const otherName = otherPerson.name || 'other';
    const targetKey = `target_${otherName}`;

    let socialModel = this._socialModels[targetKey];
    if (!socialModel) {
      socialModel = {
        trust: 0.5,
        predictability: 0.5,
        warmth: 0.5,
        status: 0.5,
        dependencyPull: 0.3,
        threat: 0.1,
        repairability: 0.7,
      };
    }

    const selfTraits = this._extractDesireTraits(selfPerson);
    const otherTraits = this._extractDesireTraits(otherPerson);

    socialModel.trust = Math.max(0, Math.min(1, socialModel.trust +
      (otherTraits.drivenBySocial ? 0.1 : 0) +
      (otherTraits.drivenByAchievement ? 0.05 : 0) -
      (otherTraits.drivenByPower ? 0.05 : 0)));

    socialModel.warmth = Math.max(0, Math.min(1, socialModel.warmth +
      (otherTraits.emotional ? 0.15 : 0) +
      (otherTraits.drivenBySocial ? 0.1 : 0) -
      (otherTraits.drivenByPower ? 0.1 : 0)));

    socialModel.threat = Math.max(0, Math.min(1, socialModel.threat +
      (otherTraits.drivenByPower ? 0.15 : 0) +
      (otherTraits.cautious ? 0.05 : 0) -
      (selfTraits.drivenByPower ? 0.1 : 0)));

    socialModel.dependencyPull = Math.max(0, Math.min(1, socialModel.dependencyPull +
      (selfTraits.drivenBySocial ? 0.15 : 0) -
      (selfTraits.drivenByFreedom ? 0.1 : 0)));

    socialModel.status = Math.max(0, Math.min(1, socialModel.status +
      (otherTraits.drivenByPower ? 0.15 : 0) +
      (otherTraits.drivenByAchievement ? 0.1 : 0)));

    socialModel.repairability = Math.max(0, Math.min(1, socialModel.repairability +
      (otherTraits.emotional ? 0.1 : 0) +
      (selfTraits.drivenBySocial ? 0.05 : 0) -
      (selfTraits.drivenByFreedom ? 0.05 : 0)));

    socialModel.predictability = Math.max(0, Math.min(1, socialModel.predictability +
      (otherTraits.cautious ? 0.1 : 0) -
      (otherTraits.drivenByFreedom ? 0.05 : 0)));

    const relationshipType = this._classifyRelationshipType(socialModel);

    const selfModel = { ...this._selfModel };
    selfModel.selfEfficacy = Math.max(0, Math.min(1, selfModel.selfEfficacy +
      (selfTraits.drivenByAchievement ? 0.05 : 0) -
      (selfTraits.drivenBySurvival ? 0.05 : 0)));

    const predictedEmotion = this._predictSocialEmotion(socialModel, selfTraits);

    this._socialModels[targetKey] = socialModel;

    return {
      selfPerson: selfName,
      otherPerson: otherName,
      socialModel,
      selfModel,
      relationshipType,
      predictedEmotion,
      interpretation: `${selfName}对${otherName}的社交模型：信任度${Math.round(socialModel.trust*100)}%、温暖感${Math.round(socialModel.warmth*100)}%、威胁感知${Math.round(socialModel.threat*100)}%、依赖拉力${Math.round(socialModel.dependencyPull*100)}%。关系类型: ${relationshipType}。`,
    };
  }

  /**
   * [v1.3.0 方法6] 对话级情绪推理 (基于COSMIC declare-lab/conv-emotion)
   */
  analyzeConversationEmotion(contexts) {
    if (!contexts) return { error: 'missing conversation contexts' };

    let utterances = [];
    if (Array.isArray(contexts)) {
      utterances = contexts.map((c, i) => {
        if (typeof c === 'string') return { speaker: `speaker_${i}`, text: c, index: i };
        return { speaker: c.speaker || `speaker_${i}`, text: c.text || c.content || '', index: i };
      });
    } else if (typeof contexts === 'string') {
      utterances = [{ speaker: 'speaker_0', text: contexts, index: 0 }];
    } else {
      return { error: 'invalid contexts format' };
    }

    const utteranceEmotions = [];
    let overallValence = 0;
    let overallArousal = 0;
    let utteranceCount = 0;

    for (const utt of utterances) {
      const textLower = utt.text.toLowerCase();
      const emotionScores = this._extractEmotionFromText(textLower);

      let weightedV = 0, weightedA = 0, totalW = 0;
      for (const [key, score] of Object.entries(emotionScores)) {
        const va = VALENCE_AROUSAL_MAP[key];
        if (va && score > 0) {
          weightedV += va.valence * score;
          weightedA += va.arousal * score;
          totalW += score;
        }
      }
      const valence = totalW > 0 ? weightedV / totalW : 0;
      const arousal = totalW > 0 ? weightedA / totalW : 0.5;

      const commonsenseCauses = this._inferCommonsenseCauses(textLower, emotionScores);
      const contextualShift = utteranceCount > 0
        ? this._computeContextualEmotionShift(utteranceEmotions[utteranceCount - 1], { valence, arousal, emotionScores })
        : null;

      utteranceEmotions.push({
        index: utt.index,
        speaker: utt.speaker,
        text: utt.text,
        emotionScores,
        valence: Math.round(valence * 100) / 100,
        arousal: Math.round(arousal * 100) / 100,
        dominantEmotion: Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0],
        commonsenseCauses,
        contextualShift,
      });

      overallValence += valence;
      overallArousal += arousal;
      utteranceCount++;
    }

    const avgValence = utteranceCount > 0 ? overallValence / utteranceCount : 0;
    const avgArousal = utteranceCount > 0 ? overallArousal / utteranceCount : 0.5;

    const emotionTrajectory = this._analyzeEmotionTrajectory(utteranceEmotions);

    const cosmicAssessment = {};
    for (const [key, info] of Object.entries(COSMIC_CONTEXT_DIMENSIONS)) {
      cosmicAssessment[key] = {
        label: info.label,
        description: info.description,
        assessment: this._assessCosmicDimension(key, utteranceEmotions),
      };
    }

    this._conversationEmotionMemory.push({
      timestamp: Date.now(),
      utteranceCount,
      avgValence,
      avgArousal,
      trajectory: emotionTrajectory,
    });

    return {
      utteranceCount,
      utterances: utteranceEmotions,
      overallEmotion: {
        valence: Math.round(avgValence * 100) / 100,
        arousal: Math.round(avgArousal * 100) / 100,
        quadrant: this._classifyVAQuadrant(avgValence, avgArousal),
      },
      emotionTrajectory,
      cosmicAssessment,
      interpretation: `对话共${utteranceCount}轮，整体Valence=${Math.round(avgValence*100)}%, Arousal=${Math.round(avgArousal*100)}%。情绪轨迹: ${emotionTrajectory.pattern}。`,
    };
  }

  /**
   * [v1.3.0 方法7] 情绪智能评估 (基于HeartBench 15维度)
   */
  evaluateEmotionalIntelligence(person) {
    if (!person) return { error: 'missing person data' };

    const traits = this._extractDesireTraits(person);
    const name = person.name || '未知';
    const emotions = this.analyzeSevenEmotions(person);

    const dimensions = {};
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, info] of Object.entries(HEARTBENCH_DIMENSIONS)) {
      const score = this._scoreHeartBenchDimension(key, traits, emotions);
      dimensions[key] = {
        label: info.label,
        category: info.category,
        score: Math.round(score * 100) / 100,
      };
      totalScore += score * info.weight;
      totalWeight += info.weight;
    }

    const overallScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;

    const categoryScores = {};
    for (const [key, info] of Object.entries(dimensions)) {
      const cat = info.category;
      if (!categoryScores[cat]) categoryScores[cat] = { total: 0, count: 0 };
      categoryScores[cat].total += info.score;
      categoryScores[cat].count += 1;
    }
    for (const [cat, data] of Object.entries(categoryScores)) {
      categoryScores[cat] = Math.round((data.total / data.count) * 100) / 100;
    }

    const strengths = Object.entries(dimensions)
      .filter(([k, v]) => v.score >= 0.6)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([k, v]) => ({ key: k, label: v.label, score: v.score, category: v.category }));

    const weaknesses = Object.entries(dimensions)
      .filter(([k, v]) => v.score < 0.4)
      .sort((a, b) => a[1].score - b[1].score)
      .map(([k, v]) => ({ key: k, label: v.label, score: v.score, category: v.category }));

    let level;
    if (overallScore >= 0.8) level = '高情绪智能 — 情感感知、理解和应对能力出色';
    else if (overallScore >= 0.6) level = '中等偏上 — 具备良好的情绪能力基础';
    else if (overallScore >= 0.4) level = '中等 — 基本情绪能力尚可，有提升空间';
    else level = '较低 — 情绪感知和理解需要加强';

    return {
      person: name,
      overallScore,
      level,
      dimensions,
      categoryScores,
      strengths,
      weaknesses,
      interpretation: `${name}的情绪智能评估: 总分${Math.round(overallScore*100)}/100 (${level})。优势领域: ${strengths.slice(0, 3).map(s => `${s.label}(${Math.round(s.score*100)}%)`).join('、')}。`,
    };
  }

  /**
   * [v1.3.0 方法8] 七情六欲体系整合
   * 将Ekman 7类基本情绪映射到中国传统七情体系
   */
  integrateChineseSevenEmotions(emotions) {
    if (!emotions) return { error: 'missing emotions data' };

    let ekmanEmotions = {};
    if (Array.isArray(emotions)) {
      for (const e of emotions) {
        if (typeof e === 'string') ekmanEmotions[e] = 0.5;
        else ekmanEmotions[e.label || e.name || e.type] = e.score || e.intensity || 0.5;
      }
    } else {
      ekmanEmotions = { ...emotions };
    }

    const chineseScores = {};
    for (const key of Object.keys(SEVEN_EMOTIONS)) {
      chineseScores[key] = 0;
    }

    for (const [ekmanKey, intensity] of Object.entries(ekmanEmotions)) {
      const ekmanLower = ekmanKey.toLowerCase().replace(/[^a-z]/g, '');
      const mapping = EKMAN_TO_CHINESE[ekmanLower] || this._findEkmanMapping(ekmanLower);
      if (mapping) {
        chineseScores[mapping.chineseKey] = Math.max(chineseScores[mapping.chineseKey], intensity * mapping.weight);
      }
    }

    if (ekmanEmotions.love !== undefined) {
      chineseScores.ai2 = Math.max(chineseScores.ai2, ekmanEmotions.love * 1.0);
    }
    if (ekmanEmotions.desire !== undefined) {
      chineseScores.yu = Math.max(chineseScores.yu, ekmanEmotions.desire * 1.0);
    }
    if (ekmanEmotions.affection !== undefined) {
      chineseScores.ai2 = Math.max(chineseScores.ai2, ekmanEmotions.affection * 0.8);
    }
    if (ekmanEmotions.craving !== undefined || ekmanEmotions.wanting !== undefined) {
      chineseScores.yu = Math.max(chineseScores.yu, (ekmanEmotions.craving || ekmanEmotions.wanting) * 0.9);
    }

    const maxScore = Math.max(...Object.values(chineseScores), 0.01);
    for (const key of Object.keys(chineseScores)) {
      chineseScores[key] = Math.round((chineseScores[key] / maxScore) * 100) / 100;
    }

    const sortedChinese = Object.entries(chineseScores)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ key: k, label: SEVEN_EMOTIONS[k]?.label || k, score: v }));

    const dominant = sortedChinese[0];

    const ekmanKeys = Object.keys(ekmanEmotions).map(k => k.toLowerCase().replace(/[^a-z]/g, ''));
    const mappedEkman = ekmanKeys.filter(k => this._findEkmanMapping(k));
    const coverage = ekmanKeys.length > 0 ? Math.round((mappedEkman.length / Math.max(ekmanKeys.length, 1)) * 100) / 100 : 0;

    const chineseSpecific = {
      love: { key: 'ai2', label: SEVEN_EMOTIONS.ai2.label, score: chineseScores.ai2, note: '爱——Ekman六种基本情绪未覆盖的中国特有维度' },
      desire: { key: 'yu', label: SEVEN_EMOTIONS.yu.label, score: chineseScores.yu, note: '欲——中国传统七情中独有的维度，体现欲望作为情感驱动力的核心地位' },
    };

    return {
      ekmanInput: ekmanEmotions,
      chineseSevenEmotions: chineseScores,
      sortedChineseEmotions: sortedChinese,
      dominantChineseEmotion: { key: dominant.key, label: dominant.label, score: dominant.score },
      chineseSpecificDimensions: chineseSpecific,
      mappingCoverage: coverage,
      interpretation: `Ekman情绪→中国传统七情映射完成。主导中国情绪: 「${dominant.label}」(${Math.round(dominant.score*100)}%)。`,
    };
  }

  /**
   * [v1.2.0 方法] Valence×Arousal 二维情感空间分析
   */
  analyzeValenceArousal(person) {
    if (!person) return { error: 'missing person data' };
    const emotions = this.analyzeSevenEmotions(person);
    const traits = this._extractDesireTraits(person);

    let totalWeight = 0;
    let weightedValence = 0;
    let weightedArousal = 0;

    for (const [key, data] of Object.entries(emotions.emotions)) {
      const va = VALENCE_AROUSAL_MAP[key];
      if (va) {
        const weight = data.score;
        weightedValence += va.valence * weight;
        weightedArousal += va.arousal * weight;
        totalWeight += weight;
      }
    }

    const valence = totalWeight > 0 ? weightedValence / totalWeight : 0;
    const arousal = totalWeight > 0 ? weightedArousal / totalWeight : 0.5;
    const quadrant = this._classifyVAQuadrant(valence, arousal);
    const emotionalConstructs = this._constructEmotionsFromVA(valence, arousal, traits);
    const dominance = this._computeDominanceFromEmotions(emotions.emotions);

    this._vaState = { valence, arousal };

    return {
      valence: Math.round(valence * 100) / 100,
      arousal: Math.round(arousal * 100) / 100,
      quadrant,
      emotionalConstructs,
      detailedEmotions: Object.entries(emotions.emotions).map(([k, v]) => ({
        key: k,
        label: v.label,
        score: v.score,
        va: VALENCE_AROUSAL_MAP[k],
      })),
      interpretation: `${person.name || 'ta'}的核心情感位于「${quadrant}」象限——Valence=${Math.round(valence*100)}%, Arousal=${Math.round(arousal*100)}%。${this._describeVAState(valence, arousal)}`,
      dominance: Math.round(dominance * 100) / 100,
    };
  }

  /** 获取状态 */
  getStatus() {
    return {
      version: this.version,
      ready: this.ready,
      theoriesLoaded: 0,
      rulesCount: 0,
      sevenEmotions: Object.keys(SEVEN_EMOTIONS).length,
      sixDesires: Object.keys(SIX_DESIRES).length,
      desireTypes: 0,
      stats: { ...this.stats },
      currentVAState: { ...this._vaState },
      padcnState: { ...this._padcnState },
      driveStates: Object.keys(this._driveStates).length,
      personalityPreset: this.personalityPreset,
      socialModels: Object.keys(this._socialModels).length,
      conversationMemories: this._conversationEmotionMemory.length,
    };
  }

  // ====================================================================
  // 内部方法
  // ====================================================================

  _extractDesireTraits(person) {
    const text = (person.description || person.name || '').toLowerCase();
    const traitText = (person.traits || []).join(' ').toLowerCase();
    const combined = text + ' ' + traitText;
    return {
      drivenBySurvival: /生存|饥饿|贫穷|逃亡|危机|挣扎|底层|困苦|生存|流浪|警觉/.test(combined),
      drivenByPower: /权力|掌控|统治|领导|征服|野心|霸主|权谋|城府|控制|冷酷/.test(combined) || person.powerful,
      drivenBySocial: /社交|归属|认可|朋友|陪伴|不孤独|孤独|温暖|包容|治愈/.test(combined) || person.social,
      drivenByAchievement: /成就|精通|创造|大师|技术|突破|追求|极致|卓越|制卡/.test(combined) || person.achiever,
      drivenByFreedom: /自由|独立|流浪|漂泊|不被束缚|无拘|冒险|潇洒|风流|不羁/.test(combined) || person.free,
      drivenBySexual: /(?:^|[^感母])性|肉欲|情欲|好色|风流|风月|性感|魅惑|纵欲/.test(combined),
      drivenByMaterial: /财富|金钱|物质|占有|积累|商人|利益/.test(combined),
      silent: /沉默|寡言|不善表达|不善言辞|冷漠|孤独/.test(combined) || person.silent,
      emotional: /感性|热情|热烈|奔放|外放|浪漫|感性|温柔/.test(combined) || person.emotional,
      cautious: /谨慎|内敛|克制|冷静|理性|沉稳|保守|纪律|传统/.test(combined) || person.cautious,
      direct: /豪爽|直接|直率|爽快|坦率|潇洒|风流/.test(combined) || person.direct,
      addictive: /成瘾|上瘾|依赖|戒不掉|无法自拔|强迫/.test(combined) || person.addictive,
      impulsive: /冲动|即兴|难以控制|不顾后果/.test(combined) || person.impulsive,
      curious: /好奇|探索|求知|学习|提问|追问/.test(combined) || person.curious,
      compassionate: /慈悲|同情|共情|同理|体谅|温暖|关怀/.test(combined) || person.compassionate,
      resilient: /坚韧|坚强|顽强|复原|恢复|反弹/.test(combined) || person.resilient,
    };
  }

  _scoreEmotion(emotionKey, traits) {
    switch (emotionKey) {
      case 'xi':  return traits.direct || traits.emotional ? 0.7 : (traits.silent ? 0.3 : 0.5);
      case 'nu':  return traits.direct || traits.drivenByPower ? 0.7 : (traits.cautious ? 0.3 : 0.5);
      case 'ai':  return traits.cautious || traits.drivenBySocial ? 0.6 : (traits.direct ? 0.3 : 0.5);
      case 'ju':  return traits.cautious || traits.drivenBySurvival ? 0.7 : (traits.direct ? 0.3 : 0.5);
      case 'ai2': return traits.drivenBySocial || traits.emotional ? 0.7 : (traits.silent ? 0.4 : 0.5);
      case 'e':   return traits.cautious || traits.drivenByPower ? 0.6 : 0.4;
      case 'yu':  return (traits.drivenByAchievement || traits.drivenByPower || traits.drivenBySexual) ? 0.8 : 0.5;
      default: return 0.5;
    }
  }

  _describeEmotionExpression(emotionKey, traits) {
    const expressions = {
      xi: traits.silent ? '内心喜悦但不形于色' : (traits.direct ? '喜形于色，毫不掩饰' : '适度表达'),
      nu: traits.cautious ? '克制愤怒，很少爆发' : (traits.direct ? '愤怒直接表达' : '偶尔失控'),
      ai: traits.silent ? '独自承受悲伤，不向他人展示' : '会寻求安慰',
      ju: traits.drivenBySurvival ? '高度警觉，时刻感知威胁' : (traits.direct ? '面对恐惧反而迎难而上' : '正常程度的恐惧'),
      ai2: traits.silent ? '用行动而非言语表达爱' : (traits.direct ? '直接表达爱意' : '适度表达'),
      e: traits.cautious ? '标准较高，容易厌恶' : '较能容忍',
      yu: traits.drivenByAchievement ? '强烈的追求欲，永不满足' : (traits.drivenByFreedom ? '对自由的渴望压倒一切' : '适度'),
    };
    return expressions[emotionKey] || '正常表达';
  }

  _classifyEmotionalProfile(emotions) {
    const joy = emotions.xi.score;
    const anger = emotions.nu.score;
    const fear = emotions.ju.score;
    const love = emotions.ai2.score;

    if (joy > 0.6 && love > 0.6) return '阳光型——积极情绪主导，善于爱与被爱';
    if (anger > 0.6) return '愤怒型——易怒，对外界有攻击性';
    if (fear > 0.6) return '恐惧型——警觉性高，安全感低';
    if (emotions.ai.score > 0.6) return '忧郁型——容易被悲伤笼罩';
    return '均衡型——情绪在正常范围内波动';
  }

  _generateEmotionalAnalysis(person, emotions) {
    const name = person.name || 'ta';
    const dominant = Object.entries(emotions).sort((a, b) => b[1].score - a[1].score)[0];
    return `${name}的主导情绪是「${dominant[1].label}」(${Math.round(dominant[1].score*100)}%)。${name}的${dominant[1].expression}。`;
  }

  _computeBrainNetworkActivation(emotions, traits) {
    const activation = {};
    const e = emotions;

    activation.VTA = {
      node: BRAIN_NETWORK_NODES.VTA,
      activation: Math.min(1, (e.yu?.score || 0.5) * 0.8 + (traits.drivenByAchievement ? 0.2 : 0)),
      description: '多巴胺起始——奖励期望编码',
    };

    activation.NAc = {
      node: BRAIN_NETWORK_NODES.NAc,
      activation: Math.min(1, (e.yu?.score || 0.5) * 0.7 + (e.xi?.score || 0.5) * 0.3),
      description: 'wanting信号放大——动机凸显',
    };

    activation.mOFC = {
      node: BRAIN_NETWORK_NODES.mOFC,
      activation: Math.min(1, (e.xi?.score || 0.5) * 0.5 + (e.ai2?.score || 0.5) * 0.3),
      description: '内侧OFC——奖励价值编码（Rolls 2020 奖励系统）',
    };

    activation.lOFC = {
      node: BRAIN_NETWORK_NODES.lOFC,
      activation: Math.min(1, (e.e?.score || 0.5) * 0.5 + (e.ju?.score || 0.5) * 0.3),
      description: '外侧OFC——非奖励/惩罚编码（Rolls 2020 非奖励系统）',
    };

    activation.Amygdala = {
      node: BRAIN_NETWORK_NODES.Amygdala,
      activation: Math.min(1, (e.ju?.score || 0.5) * 0.5 + (e.nu?.score || 0.5) * 0.3 + (e.e?.score || 0.5) * 0.2),
      description: '情绪显著性——威胁/奖励检测',
    };

    activation.mPFC = {
      node: BRAIN_NETWORK_NODES.mPFC,
      activation: traits.cautious ? 0.8 : 0.5,
      description: '价值整合·决策——自上而下控制',
    };

    activation.ACC = {
      node: BRAIN_NETWORK_NODES.ACC,
      activation: Math.min(1, (e.ai?.score || 0.5) * 0.4 + (traits.cautious ? 0.2 : 0)),
      description: '冲突监测·错误检测——努力代价计算',
    };

    activation.Insula = {
      node: BRAIN_NETWORK_NODES.Insula,
      activation: Math.min(1, (e.ai?.score || 0.5) * 0.4 + (e.e?.score || 0.5) * 0.3),
      description: '内感受·意识——身体状态感知',
    };

    const rewardSystem = (activation.VTA.activation + activation.NAc.activation + activation.mOFC.activation) / 3;
    const threatSystem = (activation.Amygdala.activation + activation.lOFC.activation) / 2;
    const controlSystem = activation.mPFC.activation;

    return {
      nodes: activation,
      networkSummary: {
        rewardSystem: Math.round(rewardSystem * 100) / 100,
        threatSystem: Math.round(threatSystem * 100) / 100,
        controlSystem: Math.round(controlSystem * 100) / 100,
        dominantMode: rewardSystem > threatSystem + 0.2 ? '奖励驱动' :
                       threatSystem > rewardSystem + 0.2 ? '威胁回避' : '平衡模式',
      },
      effectiveConnectivity: this._computeEffectiveConnectivity(activation),
    };
  }

  _computeEffectiveConnectivity(activation) {
    const connectivity = {};
    for (const [key, weight] of Object.entries(this.networkWeights)) {
      const [from, to] = key.split('_');
      const fromAct = activation[from]?.activation || 0.5;
      const toAct = activation[to]?.activation || 0.5;
      connectivity[key] = {
        from,
        to,
        baseWeight: weight,
        effectiveStrength: Math.round(weight * (fromAct + toAct) / 2 * 100) / 100,
      };
    }
    return connectivity;
  }

  _computeValenceArousal(emotions) {
    let totalWeight = 0;
    let weightedValence = 0;
    let weightedArousal = 0;

    for (const [key, data] of Object.entries(emotions)) {
      const va = VALENCE_AROUSAL_MAP[key];
      if (va) {
        const weight = data.score;
        weightedValence += va.valence * weight;
        weightedArousal += va.arousal * weight;
        totalWeight += weight;
      }
    }

    const valence = totalWeight > 0 ? weightedValence / totalWeight : 0;
    const arousal = totalWeight > 0 ? weightedArousal / totalWeight : 0.5;

    return {
      valence: Math.round(valence * 100) / 100,
      arousal: Math.round(arousal * 100) / 100,
      quadrant: this._classifyVAQuadrant(valence, arousal),
    };
  }

  _computePADCNFromEmotions(emotions) {
    const padcn = { P: 0, A: 0, D: 0, C: 0, N: 0 };
    let totalWeight = 0;

    for (const [key, data] of Object.entries(emotions)) {
      const mapping = PADCN_MAP[key];
      if (mapping) {
        const weight = data.score || (typeof data === 'number' ? data : 0.5);
        padcn.P += mapping.P * weight;
        padcn.A += mapping.A * weight;
        padcn.D += mapping.D * weight;
        padcn.C += mapping.C * weight;
        padcn.N += mapping.N * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight > 0) {
      for (const key of Object.keys(padcn)) {
        padcn[key] = Math.round((padcn[key] / totalWeight) * 100) / 100;
      }
    }

    for (const key of Object.keys(padcn)) {
      padcn[key] = Math.max(-1, Math.min(1, padcn[key]));
    }

    return padcn;
  }

  _describePADCN(padcn) {
    const labels = [];
    if (padcn.P > 0.3) labels.push('愉悦');
    else if (padcn.P < -0.3) labels.push('不悦');
    if (padcn.A > 0.3) labels.push('高唤醒');
    else if (padcn.A < -0.3) labels.push('低唤醒');
    if (padcn.D > 0.3) labels.push('掌控感强');
    else if (padcn.D < -0.3) labels.push('无助感');
    if (padcn.C > 0.3) labels.push('确定');
    else if (padcn.C < -0.3) labels.push('困惑');
    if (padcn.N > 0.3) labels.push('新奇');
    else if (padcn.N < -0.3) labels.push('常规');
    return labels;
  }

  _mapPADCNtoBehavior(padcn) {
    const { P, A, D, C, N } = padcn;

    if (P > 0 && A > 0 && D > 0 && C > 0) {
      return { pattern: '自信活力型', description: '自信、充满能量、思路清晰——决策大胆、语气温暖', confidence: Math.min(1, (P + A + D + C) / 4) };
    }
    if (P > 0 && A > 0 && D < 0 && C < 0) {
      return { pattern: '兴奋迷茫型', description: '热情但方向不明——积极寻求指导', confidence: Math.min(1, (P + A - D - C) / 4) };
    }
    if (P < 0 && A > 0 && D > 0 && C > 0) {
      return { pattern: '愤怒型', description: '愤怒但清醒——语言简洁、坚持己见', confidence: Math.min(1, (-P + A + D + C) / 4) };
    }
    if (P < 0 && A > 0 && D < 0 && C < 0) {
      return { pattern: '焦虑型', description: '焦虑不安——规避风险、寻求安全', confidence: Math.min(1, (-P + A - D - C) / 4) };
    }
    if (P < 0 && A < 0 && C < 0 && N < 0) {
      return { pattern: '抑郁倦怠型', description: '低落、疲倦、无趣——输出最少、倾向退缩', confidence: Math.min(1, (-P - A - C - N) / 4) };
    }
    if (P > 0 && A > 0 && C < 0 && N > 0) {
      return { pattern: '着迷困惑型', description: '"这太有趣了，我需要理解"——充满好奇但不确定', confidence: Math.min(1, (P + A - C + N) / 4) };
    }
    return { pattern: '均衡型', description: '情感状态平衡——正常决策', confidence: 0.5 };
  }

  _computeDominanceFromEmotions(emotions) {
    let totalWeight = 0;
    let weightedDominance = 0;

    for (const [key, data] of Object.entries(emotions)) {
      const mapping = PADCN_MAP[key];
      if (mapping) {
        const weight = data.score || 0.5;
        weightedDominance += mapping.D * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedDominance / totalWeight : 0;
  }

  _classifyVAQuadrant(valence, arousal) {
    if (valence >= 0.5 && arousal >= 0.5) return '愉悦高唤醒 (Joyful-Active)';
    if (valence >= 0.5 && arousal < 0.5) return '愉悦低唤醒 (Content-Calm)';
    if (valence < 0.5 && arousal >= 0.5) return '不悦高唤醒 (Distressed-Angry)';
    return '不悦低唤醒 (Sad-Fatigued)';
  }

  _constructEmotionsFromVA(valence, arousal, traits) {
    const constructs = [];

    if (valence > 0.6 && arousal > 0.6) {
      constructs.push({ label: '兴奋/狂喜', confidence: Math.min(1, (valence + arousal) / 2) });
    }
    if (valence > 0.6 && arousal <= 0.6) {
      constructs.push({ label: '满足/平静', confidence: valence });
    }
    if (valence <= 0.6 && valence > 0.3 && arousal > 0.5) {
      constructs.push({ label: '渴望/期待', confidence: arousal });
    }
    if (valence <= 0.3 && arousal > 0.6) {
      constructs.push({ label: '愤怒/恐惧', confidence: Math.min(1, (1 - valence + arousal) / 2) });
    }
    if (valence <= 0.3 && arousal <= 0.6) {
      constructs.push({ label: '悲伤/厌倦', confidence: Math.min(1, (1 - valence + 1 - arousal) / 2) });
    }
    if (valence > 0.3 && valence <= 0.6 && arousal <= 0.5) {
      constructs.push({ label: '中性/放松', confidence: 0.5 });
    }

    return constructs.sort((a, b) => b.confidence - a.confidence);
  }

  _describeVAState(valence, arousal) {
    if (valence > 0.6 && arousal > 0.6) return '处于积极高唤醒状态——充满能量和热情。';
    if (valence > 0.6 && arousal <= 0.6) return '处于积极低唤醒状态——平静满足，内心安宁。';
    if (valence <= 0.6 && valence > 0.3 && arousal > 0.6) return '处于混合高唤醒状态——有强烈情绪，但性质未完全确定。';
    if (valence <= 0.3 && arousal > 0.6) return '处于消极高唤醒状态——焦虑、愤怒或恐惧主导。';
    if (valence <= 0.3 && arousal <= 0.6) return '处于消极低唤醒状态——悲伤、倦怠或抑郁倾向。';
    return '处于情感中性状态。';
  }

  _scoreAppraisalFeature(eventText, traits, feature) {
    switch (feature) {
      case 'unexpectedness':
        if (/突然|意外|竟然|没想到|surprise|unexpected|sudden/i.test(eventText)) return 0.8;
        if (/正常|预期|日常|usual|normal|expected/i.test(eventText)) return 0.2;
        return 0.5;

      case 'goalRelevance':
        if (traits.drivenByAchievement && /成就|目标|成功|突破|challenge|goal/i.test(eventText)) return 0.9;
        if (traits.drivenBySocial && /朋友|关系|社交|love|friend|relationship/i.test(eventText)) return 0.9;
        if (traits.drivenByPower && /权力|地位|控制|power|status/i.test(eventText)) return 0.9;
        if (traits.drivenBySurvival && /危险|安全|生存|threat|danger/i.test(eventText)) return 0.9;
        return 0.4;

      case 'goalCongruence':
        if (/成功|胜利|获得|赢得|win|success|gain|achieve/i.test(eventText)) return 0.7;
        if (/失败|失去|错过|输|fail|lose|miss|loss/i.test(eventText)) return -0.6;
        return 0.1;

      case 'certainty':
        if (/确定|肯定|明确|clear|certain|definite/i.test(eventText)) return 0.8;
        if (/不确定|模糊|可能|也许|maybe|uncertain|unclear/i.test(eventText)) return 0.2;
        return 0.5;

      case 'copingPotential':
        if (traits.resilient) return 0.8;
        if (traits.cautious) return 0.6;
        return 0.5;

      case 'agency':
        if (/我|自己|my|self|i\s/.test(eventText)) return 0.7;
        if (/他|她|他们|对方|she|he|they/.test(eventText)) return -0.5;
        return 0;

      case 'control':
        if (/控制|掌握|选择|决定|choose|control|decide/i.test(eventText)) return 0.8;
        if (/被迫|无奈|无法|cannot|forced|helpless/i.test(eventText)) return 0.2;
        return 0.5;

      case 'selfConsistency':
        if (traits.cautious && /冷静|理性|cautious|rational/i.test(eventText)) return 0.7;
        if (traits.direct && /直接|坦率|direct|frank/i.test(eventText)) return 0.7;
        return 0.3;

      case 'socialImpact':
        if (/大家|众人|社会|公众|everyone|public|social|community/i.test(eventText)) return 0.8;
        if (traits.drivenBySocial) return 0.6;
        return 0.3;

      case 'effort':
        if (/努力|辛苦|艰难|困难|hard|difficult|effort|struggle/i.test(eventText)) return 0.8;
        if (/简单|轻松|easy|simple|effortless/i.test(eventText)) return 0.2;
        return 0.5;

      case 'attention':
        if (/关键|重要|紧急|urgent|critical|important|vital/i.test(eventText)) return 0.9;
        if (/琐事|无关|irrelevant|trivial|minor/i.test(eventText)) return 0.2;
        return 0.5;

      case 'novelty':
        if (/全新|前所未有|首次|new|novel|first|unique|unprecedented/i.test(eventText)) return 0.9;
        if (/日常|重复|routine|repeated|daily/i.test(eventText)) return 0.1;
        return 0.4;

      case 'moralAcceptability':
        if (/公平|正义|道德|善良|fair|just|moral|righteous|kind/i.test(eventText)) return 0.8;
        if (/不公|邪恶|背叛|betray|unfair|evil|immoral|sin/i.test(eventText)) return -0.7;
        return 0.2;

      default:
        return 0;
    }
  }

  _predictEmotionsFromAppraisal(appraisal) {
    const scores = {};

    scores.xi = Math.max(0, (appraisal.goalCongruence > 0 ? appraisal.goalCongruence * 0.4 : 0) +
      appraisal.copingPotential * 0.3 +
      appraisal.control * 0.3);

    scores.nu = Math.max(0, (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.3 : 0) +
      (appraisal.agency < 0 ? -appraisal.agency * 0.3 : 0) +
      appraisal.control * 0.2 +
      (1 - appraisal.moralAcceptability > 0.5 ? (1 - appraisal.moralAcceptability) * 0.2 : 0));

    scores.ai = Math.max(0, (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.3 : 0) +
      (1 - appraisal.copingPotential) * 0.3 +
      (1 - appraisal.control) * 0.2 +
      (1 - appraisal.certainty) * 0.2);

    scores.ju = Math.max(0, (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.2 : 0) +
      (1 - appraisal.copingPotential) * 0.3 +
      (1 - appraisal.control) * 0.2 +
      (1 - appraisal.certainty) * 0.3);

    scores.ai2 = Math.max(0, (appraisal.goalCongruence > 0 ? appraisal.goalCongruence * 0.3 : 0) +
      appraisal.socialImpact * 0.3 +
      (appraisal.selfConsistency > 0 ? appraisal.selfConsistency * 0.2 : 0) +
      (appraisal.moralAcceptability > 0 ? appraisal.moralAcceptability * 0.2 : 0));

    scores.e = Math.max(0, (appraisal.moralAcceptability < 0 ? -appraisal.moralAcceptability * 0.4 : 0) +
      (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.2 : 0) +
      (appraisal.selfConsistency < 0 ? -appraisal.selfConsistency * 0.2 : 0) +
      (1 - appraisal.novelty > 0.7 ? 0.2 : 0));

    scores.yu = Math.max(0, appraisal.goalRelevance * 0.3 +
      appraisal.attention * 0.2 +
      appraisal.novelty * 0.2 +
      (1 - Math.abs(appraisal.goalCongruence)) * 0.3);

    const maxScore = Math.max(...Object.values(scores), 0.01);
    for (const key of Object.keys(scores)) {
      scores[key] = Math.round(Math.min(1, scores[key] / maxScore) * 100) / 100;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return {
      scores,
      dominant: { key: sorted[0][0], label: SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0], score: sorted[0][1] },
      secondary: sorted[1] ? { key: sorted[1][0], label: SEVEN_EMOTIONS[sorted[1][0]]?.label || sorted[1][0], score: sorted[1][1] } : null,
      sorted: sorted.map(([k, v]) => ({ key: k, label: SEVEN_EMOTIONS[k]?.label || k, score: v })),
    };
  }

  _appraisalToPADCN(appraisal) {
    const deltaP = 0.3 * appraisal.goalCongruence +
      0.2 * appraisal.selfConsistency +
      0.2 * appraisal.moralAcceptability +
      0.1 * appraisal.copingPotential;

    const deltaA = 0.3 * (1 - appraisal.certainty) +
      0.2 * appraisal.novelty +
      0.2 * appraisal.goalRelevance -
      0.1 * appraisal.control;

    const deltaD = 0.3 * appraisal.control +
      0.2 * Math.max(0, appraisal.agency) -
      0.2 * (1 - appraisal.copingPotential) +
      0.1 * appraisal.certainty;

    const deltaC = 0.4 * appraisal.certainty +
      0.2 * (1 - appraisal.unexpectedness) -
      0.2 * appraisal.novelty;

    const deltaN = 0.5 * appraisal.novelty +
      0.2 * appraisal.unexpectedness -
      0.2 * appraisal.control;

    return {
      P: Math.max(-1, Math.min(1, deltaP)),
      A: Math.max(-1, Math.min(1, deltaA)),
      D: Math.max(-1, Math.min(1, deltaD)),
      C: Math.max(-1, Math.min(1, deltaC)),
      N: Math.max(-1, Math.min(1, deltaN)),
    };
  }

  _computeDriveLevel(driveKey, traits) {
    switch (driveKey) {
      case 'curiosity':     return traits.curious ? 0.7 : (traits.drivenByAchievement ? 0.6 : 0.5);
      case 'competence':    return traits.drivenByAchievement ? 0.7 : (traits.drivenBySurvival ? 0.4 : 0.5);
      case 'autonomy':      return traits.drivenByFreedom ? 0.8 : (traits.drivenByPower ? 0.6 : 0.5);
      case 'social_bond':   return traits.drivenBySocial ? 0.8 : (traits.silent ? 0.3 : 0.5);
      case 'coherence':     return traits.cautious ? 0.7 : (traits.emotional ? 0.5 : 0.5);
      case 'novelty_seek':  return traits.drivenByFreedom ? 0.7 : (traits.curious ? 0.7 : 0.4);
      case 'self_preservation': return traits.drivenBySurvival ? 0.8 : (traits.cautious ? 0.6 : 0.4);
      default: return 0.5;
    }
  }

  _predictEmotionFromDriveChanges(drives) {
    const emotionScores = {};

    emotionScores.ju = Math.max(0, (1 - drives.curiosity?.satisfaction || 0.5) * 0.3);
    emotionScores.yu = Math.max(0, (1 - drives.curiosity?.satisfaction || 0.5) * 0.3);

    emotionScores.nu = Math.max(0, (1 - drives.competence?.satisfaction || 0.5) * 0.3);
    emotionScores.ai = Math.max(0, (1 - drives.competence?.satisfaction || 0.5) * 0.2);

    emotionScores.nu = Math.max(emotionScores.nu, (1 - drives.autonomy?.satisfaction || 0.5) * 0.3);

    emotionScores.ai = Math.max(emotionScores.ai, (1 - drives.social_bond?.satisfaction || 0.5) * 0.3);
    emotionScores.ju = Math.max(emotionScores.ju, (1 - drives.social_bond?.satisfaction || 0.5) * 0.2);

    emotionScores.ju = Math.max(emotionScores.ju, (1 - drives.coherence?.satisfaction || 0.5) * 0.4);

    emotionScores.yu = Math.max(emotionScores.yu, (1 - drives.novelty_seek?.satisfaction || 0.5) * 0.3);

    emotionScores.ju = Math.max(emotionScores.ju, (1 - drives.self_preservation?.satisfaction || 0.5) * 0.3);
    emotionScores.nu = Math.max(emotionScores.nu, (1 - drives.self_preservation?.satisfaction || 0.5) * 0.2);

    const maxScore = Math.max(...Object.values(emotionScores), 0.01);
    for (const key of Object.keys(emotionScores)) {
      emotionScores[key] = Math.round(Math.min(1, emotionScores[key] / maxScore) * 100) / 100;
    }

    const sorted = Object.entries(emotionScores).sort((a, b) => b[1] - a[1]);

    return {
      emotionScores,
      dominant: sorted[0] ? { key: sorted[0][0], label: SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0], score: sorted[0][1], cause: `由驱力缺口驱动` } : null,
      interpretation: sorted[0] ? `驱力缺口驱动的情绪: 「${SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0]}」(${Math.round(sorted[0][1]*100)}%)。` : '驱力平衡，无明显情绪驱动。',
    };
  }

  _describeStrategyProfile(policyBiases) {
    const traits = [];
    if (policyBiases.riskTolerance > 0.2) traits.push('风险偏好');
    else if (policyBiases.riskTolerance < -0.2) traits.push('风险规避');
    if (policyBiases.explorationBias > 0.2) traits.push('探索倾向');
    else if (policyBiases.explorationBias < -0.2) traits.push('聚焦倾向');
    if (policyBiases.verificationBias > 0.2) traits.push('审慎验证');
    else if (policyBiases.verificationBias < -0.2) traits.push('快速决策');
    if (policyBiases.socialBias > 0.2) traits.push('社交导向');
    else if (policyBiases.socialBias < -0.2) traits.push('独立导向');
    if (policyBiases.persistence > 0.2) traits.push('坚持不懈');
    else if (policyBiases.persistence < -0.2) traits.push('灵活变通');
    if (policyBiases.compliance > 0.2) traits.push('顺从配合');
    else if (policyBiases.compliance < -0.2) traits.push('自主决断');

    return traits.length > 0 ? traits.join('、') : '均衡策略';
  }

  _classifyRelationshipType(socialModel) {
    const { trust, warmth, threat, dependencyPull } = socialModel;

    if (trust > 0.7 && warmth > 0.7 && threat < 0.2) return '安全依恋型';
    if (trust > 0.6 && warmth > 0.5 && dependencyPull > 0.6) return '依赖型';
    if (trust < 0.3 && threat > 0.5) return '威胁回避型';
    if (trust < 0.4 && warmth < 0.4) return '疏离型';
    if (warmth > 0.6 && dependencyPull < 0.3) return '友好但独立型';
    if (trust > 0.5 && dependencyPull > 0.5) return '依恋萌芽型';
    return '探索型（关系尚未定型）';
  }

  _predictSocialEmotion(socialModel, selfTraits) {
    const { trust, warmth, threat, dependencyPull } = socialModel;
    const scores = {};

    if (trust > 0.6 && warmth > 0.6) {
      scores.ai2 = Math.min(1, (trust + warmth) / 2);
      scores.xi = Math.min(1, warmth);
    }
    if (threat > 0.4) {
      scores.ju = threat;
    }
    if (trust < 0.3 && dependencyPull > 0.5) {
      scores.ju = Math.max(scores.ju || 0, dependencyPull * 0.6);
      scores.yu = Math.max(scores.yu || 0, dependencyPull * 0.5);
    }
    if (dependencyPull > 0.5 && warmth < 0.4) {
      scores.ai = Math.max(scores.ai || 0, dependencyPull * 0.4);
    }
    if (warmth < 0.3 && trust < 0.3) {
      scores.e = Math.max(scores.e || 0, (1 - warmth) * 0.3);
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return {
      scores,
      dominant: sorted[0] ? { key: sorted[0][0], label: SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0], score: sorted[0][1] } : null,
    };
  }

  _extractEmotionFromText(text) {
    const scores = {};

    if (/开心|高兴|快乐|喜悦|幸福|满足|joy|happy|glad|delight|wonderful|great|amazing|love|😊|😄|😁|🥰/.test(text)) scores.xi = 0.7;
    if (/愤怒|生气|恼怒|恼火|angry|mad|furious|outraged|annoyed|frustrated|😡|🤬/.test(text)) scores.nu = 0.7;
    if (/悲伤|难过|伤心|哀伤|失落|沮丧|sad|sorrow|grief|depressed|down|cry|😢|😭|💔/.test(text)) scores.ai = 0.7;
    if (/恐惧|害怕|焦虑|担忧|紧张|担心|scared|afraid|anxious|worried|nervous|terrified|😨|😰|😱/.test(text)) scores.ju = 0.7;
    if (/爱|关爱|温暖|珍惜|love|care|cherish|adore|affection|dear|❤️|💕|💗/.test(text)) scores.ai2 = 0.7;
    if (/厌恶|恶心|反感|憎恶|disgust|gross|repulsive|awful|terrible|hate|🤢|🤮/.test(text)) scores.e = 0.7;
    if (/想要|渴望|期待|希望|want|desire|wish|hope|eager|longing|crave/.test(text)) scores.yu = 0.6;

    for (const key of Object.keys(SEVEN_EMOTIONS)) {
      if (scores[key] === undefined) scores[key] = 0.1;
    }

    return scores;
  }

  _inferCommonsenseCauses(text, emotionScores) {
    const causes = [];

    if (/因为|由于|because|since|due to|after/.test(text)) {
      const causeMatch = text.match(/(?:因为|由于|because|since)([^。，.!?;；]+)/);
      if (causeMatch) {
        causes.push({ type: '直接原因', description: causeMatch[1].trim(), confidence: 0.8 });
      }
    }

    const dominantEmotion = Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0];
    if (dominantEmotion) {
      const commonCauses = {
        xi:  ['获得了想要的东西', '得到了认可', '发生了好事'],
        nu:  ['被不公平对待', '被冒犯', '目标受阻'],
        ai:  ['失去了重要的人或物', '期望落空', '被拒绝'],
        ju:  ['面临威胁', '不确定的未来', '可能的损失'],
        ai2: ['被关心', '获得支持', '亲密的互动'],
        e:   ['面对令人反感的事物', '道德违背', '不洁或有害物'],
        yu:  ['看到渴望的目标', '机会出现', '需求未被满足'],
      };
      const causesForKey = commonCauses[dominantEmotion[0]];
      if (causesForKey) {
        causes.push({
          type: '常识推理',
          description: `基于常识，${SEVEN_EMOTIONS[dominantEmotion[0]]?.label || '该'}情绪可能源于: ${causesForKey.join('、')}`,
          confidence: 0.5,
        });
      }
    }

    return causes;
  }

  _computeContextualEmotionShift(previous, current) {
    if (!previous) return null;

    const prevValence = previous.valence || 0;
    const currValence = current.valence || 0;
    const prevArousal = previous.arousal || 0.5;
    const currArousal = current.arousal || 0.5;

    const valenceShift = Math.round((currValence - prevValence) * 100) / 100;
    const arousalShift = Math.round((currArousal - prevArousal) * 100) / 100;

    let description;
    if (Math.abs(valenceShift) < 0.1 && Math.abs(arousalShift) < 0.1) {
      description = '情绪稳定——与上一轮基本一致';
    } else if (valenceShift > 0.2 && arousalShift > 0.1) {
      description = '情绪积极上升——从平静到更积极活跃';
    } else if (valenceShift < -0.2 && arousalShift > 0.1) {
      description = '情绪消极上升——负面情绪加剧';
    } else if (valenceShift < -0.1 && arousalShift < -0.1) {
      description = '情绪低落——积极性和能量均下降';
    } else if (valenceShift > 0.1 && arousalShift < -0.1) {
      description = '情绪趋于平静——消极降低，趋于放松';
    } else {
      description = '轻微波动——在正常范围内';
    }

    return { valenceShift, arousalShift, description };
  }

  _analyzeEmotionTrajectory(utteranceEmotions) {
    if (utteranceEmotions.length <= 1) {
      return { pattern: '单轮对话，无轨迹可分析', trend: '稳定' };
    }

    const valences = utteranceEmotions.map(u => u.valence);
    const arousals = utteranceEmotions.map(u => u.arousal);

    const valenceTrend = valences[valences.length - 1] - valences[0];
    const arousalTrend = arousals[arousals.length - 1] - arousals[0];

    const valenceVolatility = valences.reduce((sum, v, i) => {
      if (i === 0) return sum;
      return sum + Math.abs(v - valences[i - 1]);
    }, 0) / (valences.length - 1);

    let pattern;
    let trend;

    if (Math.abs(valenceTrend) < 0.1 && Math.abs(arousalTrend) < 0.1 && valenceVolatility < 0.15) {
      pattern = '情绪平稳——整段对话情绪稳定';
      trend = '稳定';
    } else if (valenceTrend > 0.2 && arousalTrend > 0) {
      pattern = '情绪好转——从消极/中性走向积极';
      trend = '上升';
    } else if (valenceTrend < -0.2 && arousalTrend > 0) {
      pattern = '情绪恶化——从积极/中性走向消极';
      trend = '下降';
    } else if (valenceVolatility > 0.3) {
      pattern = '情绪波动大——对话中情绪剧烈变化';
      trend = '波动';
    } else if (valenceTrend > 0 && arousalTrend < -0.1) {
      pattern = '情绪平复——从高唤醒走向平静满足';
      trend = '平复';
    } else {
      pattern = '轻微变化——对话中情绪有适度波动';
      trend = '微变';
    }

    return { pattern, trend, valenceVolatility: Math.round(valenceVolatility * 100) / 100 };
  }

  _assessCosmicDimension(dimension, utterances) {
    switch (dimension) {
      case 'utteranceEmotion':
        return `已逐句分析${utterances.length}条话语的情绪状态`;
      case 'speakerEmotion':
        return `说话者整体情绪: ${utterances.length > 0 ? '基于多轮综合判断' : '无数据'}`;
      case 'listenerEmotion':
        return `倾听者情绪: 基于回应内容推理`;
      case 'emotionalCause':
        return `已通过常识推理识别可能的原因`;
      case 'conversationalDynamics':
        return `情绪轨迹: ${utterances.length > 1 ? '多轮情绪变化可追踪' : '单轮对话'}`;
      case 'commonsenseKnowledge':
        return `基于日常经验和情感常识进行推理`;
      default:
        return '待评估';
    }
  }

  _findEkmanMapping(ekmanKey) {
    if (EKMAN_TO_CHINESE[ekmanKey]) return EKMAN_TO_CHINESE[ekmanKey];

    for (const [key, mapping] of Object.entries(EKMAN_TO_CHINESE)) {
      if (ekmanKey.includes(key) || key.includes(ekmanKey)) return mapping;
    }

    const extendedMap = {
      happy: EKMAN_TO_CHINESE.joy,
      happiness: EKMAN_TO_CHINESE.joy,
      glad: EKMAN_TO_CHINESE.joy,
      delight: EKMAN_TO_CHINESE.joy,
      angry: EKMAN_TO_CHINESE.anger,
      mad: EKMAN_TO_CHINESE.anger,
      furious: EKMAN_TO_CHINESE.anger,
      sad: EKMAN_TO_CHINESE.sadness,
      sorrow: EKMAN_TO_CHINESE.sadness,
      grief: EKMAN_TO_CHINESE.sadness,
      afraid: EKMAN_TO_CHINESE.fear,
      scared: EKMAN_TO_CHINESE.fear,
      anxious: EKMAN_TO_CHINESE.fear,
      disgusted: EKMAN_TO_CHINESE.disgust,
      gross: EKMAN_TO_CHINESE.disgust,
      surprised: EKMAN_TO_CHINESE.surprise,
      shocking: EKMAN_TO_CHINESE.surprise,
      contempt: EKMAN_TO_CHINESE.contempt,
    };

    return extendedMap[ekmanKey] || null;
  }

  _scoreHeartBenchDimension(dimension, traits, emotions) {
    switch (dimension) {
      case 'verbalExpression':     return traits.direct ? 0.7 : (traits.silent ? 0.3 : 0.5);
      case 'curiosity':             return traits.curious ? 0.8 : (traits.drivenByAchievement ? 0.6 : 0.4);
      case 'warmth':                return traits.drivenBySocial ? 0.8 : (traits.emotional ? 0.7 : 0.4);
      case 'firstPersonUsage':      return traits.direct ? 0.7 : (traits.silent ? 0.4 : 0.6);
      case 'autonomy':              return traits.drivenByFreedom ? 0.8 : (traits.drivenByPower ? 0.7 : 0.5);
      case 'humor':                 return traits.direct ? 0.6 : (traits.silent ? 0.3 : 0.4);
      case 'selfAwareness':         return traits.cautious ? 0.7 : (traits.emotional ? 0.6 : 0.4);
      case 'emotionalCoping':       return traits.resilient ? 0.8 : (traits.cautious ? 0.6 : 0.4);
      case 'emotionalUnderstanding': return traits.emotional ? 0.8 : (traits.drivenBySocial ? 0.7 : 0.5);
      case 'emotionalPerception':   return traits.emotional ? 0.8 : (traits.drivenBySocial ? 0.6 : 0.5);
      case 'emotionalReaction':     return traits.emotional ? 0.8 : (traits.direct ? 0.7 : 0.4);
      case 'socialProactivity':     return traits.drivenBySocial ? 0.8 : (traits.direct ? 0.6 : 0.3);
      case 'relationshipBuilding':  return traits.drivenBySocial ? 0.8 : (traits.emotional ? 0.6 : 0.4);
      case 'motivationClarity':     return traits.drivenByAchievement ? 0.8 : (traits.drivenByPower ? 0.7 : 0.5);
      case 'moralReasoning':        return traits.cautious ? 0.7 : (traits.drivenBySocial ? 0.6 : 0.5);
      default: return 0.5;
    }
  }
}

module.exports = { CognitionEngine };
