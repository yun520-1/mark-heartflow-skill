/**
 * Desire Cognition Module v1.3.0 — 欲望认知引擎（神经科学升级版 + 七层情感架构集成）
 * 
 * 核心功能：让心虫理解人类的七情六欲——欲望如何驱动行为、塑造命运
 * 
 * v1.2.0 神经科学升级（2025）：
 *   - Kringelbach & Berridge (2017): Wanting≠Liking 双轴分离，Δ=W−L 病理指标
 *   - Lindquist et al. (2012): 心理构建主义，Valence×Arousal 二维情感空间
 *   - Schultz (2016): TD-Learning 多巴胺RPE模型，欲望动态更新
 *   - Rolls (2020): 内侧OFC(奖励) vs 外侧OFC(非奖励)双系统
 *   - Berridge & Robinson (2016): 神经致敏因子，线索触发成瘾建模
 *   - 中脑-皮层-边缘网络映射：VTA-NAc-mPFC-OFC-Amygdala 激活模式
 * 
 * v1.3.0 七层情感架构集成（2026）：
 *   - emotion-system (swaylq): 13特征认知评价、PADCN 5维核心情感、7驱动力系统
 *   - EmoBank (JULIELab): Valence-Arousal-Dominance 连续维度
 *   - COSMIC (declare-lab): 对话级情绪推理
 *   - HeartBench (inclusionAI): 15维拟人能力评估
 *   - 中国传统七情体系整合
 *
 * 理论基础：
 *   - Robinson & Berridge (1993/2016) — 激励敏化理论：wanting ≠ liking
 *   - Schultz (1998/2016) — 多巴胺预测误差信号
 *   - Ekman (1999) — 六种基本情绪普遍性
 *   - LeDoux (1996) — 杏仁核高低路双通道
 *   - Baumeister & Leary (1995) — 归属需求
 *   - McClelland (1961) — 成就/权力/归属三大动机
 *   - Maslow/Kenrick (2010) — 进化动机层次
 *   - Koob & Le Moal (2017) — 成瘾对立过程理论
 *   - Kelley (2017) — 前额叶自我控制神经机制
 *   - Buss (2016) — 欲望进化心理学
 *   - 中国哲学：儒家"导欲"、道家"寡欲"、佛教"观欲"
 *   - Damasio (2021) — 内感受与感受起源
 *   - Mehrabian & Russell (1974) — PAD维度模型
 *   - Lazarus (1991) — 认知评价理论
 *   - Scherer (2001) — 组件过程模型：13特征评价结构
 *   - Deci & Ryan (1985) — 自我决定理论：自主/胜任/归属
 *   - Sven Buechel & Udo Hahn (2017) — EmoBank VAD标注语料库
 * 
 * 七情：喜、怒、哀、惧、爱、恶、欲
 * 六欲：见欲（眼）、闻欲（耳）、香欲（鼻）、味欲（舌）、触欲（身）、意欲（意）
 * 
 * 核心认知原则（基于用户纠正）：
 * 1. 人是被欲望驱动的——七情六欲是人的行为源代码
 * 2. 理解欲望才能真正理解人——人物推演必须包含欲望维度
 * 3. 欲望不是贬义词——是驱动力、是生命力
 * 4. 失控的欲望是悲剧的来源——成瘾、贪婪、嫉妒
 * 5. 被压抑的欲望不会消失——会变形、会反噬
 * 6. 文化塑造欲望的表达方式——但欲望本身跨文化普遍
 * 7. 高级欲望（意义、创造、超越）源于低级欲望的整合
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

// === 基本欲望类型 ===
const DESIRE_TYPES = {
  survival:    { label: '生存欲',     description: '对食物、水、安全的基本需求',          intensity: '最强',      consciousness: '半意识',  expression: '本能驱动' },
  sexual:      { label: '性欲',       description: '对性接触、繁衍的驱力',               intensity: '强',        consciousness: '半意识',  expression: '生物本能→情感' },
  social:      { label: '社交欲',     description: '对归属、认可、亲密关系的需求',        intensity: '强',        consciousness: '有意识',  expression: '社会互动' },
  power:       { label: '权力欲',     description: '对掌控、地位、影响力的追求',          intensity: '强',        consciousness: '有意识',  expression: '竞争、领导' },
  achievement: { label: '成就欲',     description: '对精通、创造、自我实现的需求',        intensity: '中',        consciousness: '有意识',  expression: '目标追求' },
  curiosity:   { label: '求知欲',     description: '对未知、新奇、理解的渴望',            intensity: '中',        consciousness: '有意识',  expression: '探索、学习' },
  material:    { label: '物欲',       description: '对财富、物质的占有欲',                intensity: '中→强',    consciousness: '有意识',  expression: '积累、消费' },
  freedom:     { label: '自由欲',     description: '对自主、独立、不受约束的渴望',        intensity: '强',        consciousness: '有意识',  expression: '反抗、出走' },
  meaning:     { label: '意义欲',     description: '对生命意义、价值、超越的追求',        intensity: '弱→强',    consciousness: '高意识',  expression: '哲学、宗教、创造' },
};

// === Valence×Arousal 二维情感空间（Lindquist 2012 心理构建主义）===
const VALENCE_AROUSAL_MAP = {
  // 经典七情映射到VA空间
  xi:  { valence: 0.8,  arousal: 0.6,  label: '喜悦' },   // 高愉悦·中唤醒
  nu:  { valence: -0.7, arousal: 0.8,  label: '愤怒' },   // 低愉悦·高唤醒
  ai:  { valence: -0.6, arousal: 0.2,  label: '悲伤' },   // 低愉悦·低唤醒
  ju:  { valence: -0.5, arousal: 0.9,  label: '恐惧' },   // 低愉悦·高唤醒
  ai2: { valence: 0.9,  arousal: 0.5,  label: '爱' },     // 高愉悦·中唤醒
  e:   { valence: -0.8, arousal: 0.4,  label: '厌恶' },   // 低愉悦·中唤醒
  yu:  { valence: 0.3,  arousal: 0.7,  label: '欲望' },   // 中愉悦·高唤醒
};

// === 中脑-皮层-边缘网络节点定义（映射自 Lindquist 2012 / Rolls 2020）===
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

// === 默认神经网络连接权重（RPE框架下的有效连接）===
const DEFAULT_NETWORK_WEIGHTS = {
  VTA_NAc:      0.85,  // 多巴胺→伏隔核：wanting信号
  VTA_mPFC:     0.60,  // 多巴胺→前额叶：认知控制
  NAc_mOFC:     0.75,  // 伏隔核→内侧OFC：奖励评价
  NAc_lOFC:     0.30,  // 伏隔核→外侧OFC：非奖励信号抑制
  Amygdala_VTA: 0.70,  // 杏仁核→VTA：情绪显著性调节
  mPFC_NAc:     0.55,  // 前额叶→伏隔核：自上而下控制
  ACC_mPFC:     0.65,  // 前扣带→前额叶：冲突指导
  Insula_ACC:   0.50,  // 岛叶→前扣带：内感受整合
  Hippocampus_NAc: 0.60, // 海马→伏隔核：记忆触发欲望
};

// ====================================================================
// v1.3.0 新增数据结构 — emotion-system 七层架构集成
// ====================================================================

// PADCN 5维核心情感 (Mehrabian & Russell 1974 扩展)
// P: Pleasure, A: Arousal, D: Dominance, C: Certainty, N: Novelty
const PADCN_DIMENSIONS = {
  P: { name: 'Pleasure',   label: '愉悦度', low: '痛苦/不快',  high: '快乐/满足',  decayTau: 0.90 },
  A: { name: 'Arousal',    label: '唤醒度', low: '沉闷/平静',  high: '警觉/兴奋',  decayTau: 0.82 },
  D: { name: 'Dominance',  label: '掌控度', low: '无助/不确定',high: '掌控/自信',  decayTau: 0.93 },
  C: { name: 'Certainty',  label: '确定度', low: '困惑/迷失',  high: '清晰/确定',  decayTau: 0.90 },
  N: { name: 'Novelty',    label: '新奇度', low: '熟悉/常规',  high: '新奇/惊喜',  decayTau: 0.80 },
};

// 七情 → PADCN 映射（基于 emotion-system PADCN reference 扩展）
const PADCN_MAP = {
  xi:  { P: 0.70, A: 0.50, D: 0.30, C: 0.40, N: 0.10 },
  nu:  { P: -0.40, A: 0.80, D: 0.70, C: 0.60, N: 0.20 },
  ai:  { P: -0.60, A: -0.30, D: -0.20, C: 0.10, N: -0.30 },
  ju:  { P: -0.60, A: 0.70, D: -0.50, C: -0.50, N: 0.40 },
  ai2: { P: 0.80, A: 0.30, D: 0.00, C: 0.30, N: -0.10 },
  e:   { P: -0.50, A: 0.40, D: 0.30, C: 0.50, N: -0.20 },
  yu:  { P: 0.30, A: 0.70, D: 0.40, C: 0.20, N: 0.50 },
};

// 7驱动力系统 (emotion-system Layer 5)
const DRIVE_TYPES = {
  curiosity:       { label: '好奇心',       description: '探索未知、学习新知识的驱力',            target: 0.6 },
  competence:      { label: '胜任感',       description: '精通技能、有效应对挑战的驱力',          target: 0.7 },
  autonomy:        { label: '自主性',       description: '自我决定、独立行动的驱力',              target: 0.6 },
  social_bond:     { label: '社交纽带',     description: '建立和维持社会连接的驱力',              target: 0.5 },
  coherence:       { label: '一致性',       description: '保持自我叙事一致、世界可理解的驱力',    target: 0.7 },
  novelty_seek:    { label: '新奇寻求',     description: '追求新鲜体验、避免枯燥的驱力',          target: 0.5 },
  self_preservation: { label: '自我保护',   description: '避免失败、维持稳定状态的驱力',          target: 0.6 },
};

// 6种人格预设 (emotion-system Layer 5)
const PERSONALITY_PRESETS = {
  explorer:    { label: '探索者',   description: '高好奇心、高新奇寻求、低自我保护',         weights: { curiosity: 1.3, competence: 0.8, autonomy: 1.1, social_bond: 0.7, coherence: 0.6, novelty_seek: 1.4, self_preservation: 0.4 } },
  caretaker:   { label: '守护者',   description: '高社交纽带、高一致性、高自我保护',          weights: { curiosity: 0.6, competence: 0.9, autonomy: 0.7, social_bond: 1.3, coherence: 1.2, novelty_seek: 0.4, self_preservation: 1.2 } },
  achiever:    { label: '成就者',   description: '高胜任感、高自主性、高一致性',              weights: { curiosity: 0.8, competence: 1.4, autonomy: 1.2, social_bond: 0.7, coherence: 1.1, novelty_seek: 0.6, self_preservation: 0.7 } },
  sage:        { label: '智者',     description: '高好奇心、高一致性、低自我保护',            weights: { curiosity: 1.3, competence: 1.1, autonomy: 1.0, social_bond: 0.6, coherence: 1.3, novelty_seek: 0.8, self_preservation: 0.5 } },
  rebel:       { label: '反叛者',   description: '高自主性、高新奇寻求、低社交纽带',          weights: { curiosity: 1.0, competence: 0.7, autonomy: 1.4, social_bond: 0.4, coherence: 0.5, novelty_seek: 1.3, self_preservation: 0.6 } },
  diplomat:    { label: '外交家',   description: '高社交纽带、低自主性、高自我保护',          weights: { curiosity: 0.7, competence: 0.9, autonomy: 0.5, social_bond: 1.4, coherence: 1.0, novelty_seek: 0.5, self_preservation: 1.1 } },
};

// 情绪→策略偏置映射 (emotion-system Layer 7)
const EMOTION_POLICY_MAP = {
  // key: 情绪key, value: { 策略维度: 调整量 }
  xi:  { risk_tolerance: 0.15, exploration_bias: 0.10, verification_bias: -0.10, social_bias: 0.10, persistence: 0.05, compliance: 0.00 },
  nu:  { risk_tolerance: 0.20, exploration_bias: -0.10, verification_bias: -0.20, social_bias: -0.15, persistence: 0.10, compliance: -0.20 },
  ai:  { risk_tolerance: -0.20, exploration_bias: -0.20, verification_bias: 0.10, social_bias: 0.10, persistence: -0.10, compliance: 0.10 },
  ju:  { risk_tolerance: -0.30, exploration_bias: -0.20, verification_bias: 0.30, social_bias: 0.05, persistence: -0.05, compliance: 0.20 },
  ai2: { risk_tolerance: 0.00, exploration_bias: -0.05, verification_bias: -0.10, social_bias: 0.30, persistence: 0.20, compliance: 0.10 },
  e:   { risk_tolerance: -0.10, exploration_bias: -0.15, verification_bias: 0.20, social_bias: -0.20, persistence: 0.05, compliance: -0.10 },
  yu:  { risk_tolerance: 0.25, exploration_bias: 0.20, verification_bias: -0.15, social_bias: 0.00, persistence: 0.30, compliance: -0.10 },
};

// Ekman 7类基本情绪 → 中国传统七情映射
const EKMAN_TO_CHINESE = {
  joy:       { chineseKey: 'xi',  chineseLabel: '喜', weight: 1.0 },
  sadness:   { chineseKey: 'ai',  chineseLabel: '哀', weight: 1.0 },
  anger:     { chineseKey: 'nu',  chineseLabel: '怒', weight: 1.0 },
  fear:      { chineseKey: 'ju',  chineseLabel: '惧', weight: 1.0 },
  disgust:   { chineseKey: 'e',   chineseLabel: '恶', weight: 1.0 },
  surprise:  { chineseKey: 'xi',  chineseLabel: '喜', weight: 0.5 },  // 惊可归为喜的变体
  contempt:  { chineseKey: 'e',   chineseLabel: '恶', weight: 0.7 },  // 轻蔑归为恶的变体
};

// 中国传统七情补充映射（爱和欲是Ekman未覆盖但中国体系独有的）
const CHINESE_SPECIFIC_EMOTIONS = {
  love:   { chineseKey: 'ai2', chineseLabel: '爱' },
  desire: { chineseKey: 'yu',  chineseLabel: '欲' },
};

// HeartBench 15维拟人能力
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

// COSMIC 对话情绪推理维度
const COSMIC_CONTEXT_DIMENSIONS = {
  utteranceEmotion:      { label: '话语情绪',     description: '当前话语表达的情绪' },
  speakerEmotion:        { label: '说话者情绪',   description: '说话者整体的情绪状态' },
  listenerEmotion:       { label: '倾听者情绪',   description: '倾听者感知到的情绪' },
  emotionalCause:        { label: '情绪原因',     description: '导致情绪的事件或原因' },
  conversationalDynamics:{ label: '对话动态',     description: '情绪在对话中的变化轨迹' },
  commonsenseKnowledge:  { label: '常识知识',     description: '基于常识推理的情绪理解' },
};

class DesireCognition {
  constructor(options = {}) {
    this.version = '1.3.0';
    this.ready = false;
    this.debug = options.debug || false;

    this.theories = {
      incentiveSensitization: { name: '激励敏化理论（Berridge 1993/2016）', insight: 'wanting≠liking，多巴胺编码"想要"而非"喜欢"' },
      rewardPredictionError:  { name: '奖赏预测误差（Schultz 1998/2016）', insight: '多巴胺编码预期与实际奖赏的差异（TD-Learning框架）' },
      basicEmotions:          { name: '基本情绪理论（Ekman 1999）', insight: '六种基本情绪跨文化普遍' },
      evolutionaryMotives:    { name: '进化动机层次（Kenrick 2010）', insight: '七层进化动机驱动行为' },
      belongingNeed:          { name: '归属需求（Baumeister 1995）', insight: '归属是人类最强大的社会动机' },
      dualProcess:            { name: '双系统模型', insight: '系统1冲动vs系统2控制的博弈' },
      chineseDesire:          { name: '中国欲望哲学', insight: '儒家导欲·道家寡欲·佛教观欲' },
      interoception:          { name: '内感受理论（Damasio 2021）', insight: '欲望源于身体状态的感知' },
      // v1.2.0 新增理论
      wantingLikingDualAxis:  { name: 'Wanting≠Liking双轴系统（Kringelbach & Berridge 2017）', insight: 'W_score与L_score分离，Δ=W−L是关键病理指标' },
      psychologicalConstruction: { name: '心理构建主义（Lindquist 2012）', insight: '情绪=核心情感(Valence×Arousal)+概念化' },
      rpeTDLearning:          { name: 'RPE-TD模型（Schultz 2016）', insight: 'δ(t)=R(t)+γV(t+1)−V(t)，欲望动态更新' },
      rewardNonrewardDual:    { name: '奖励/非奖励双系统（Rolls 2020）', insight: '内侧OFC编码奖励，外侧OFC编码非奖励/惩罚' },
      neuroSensitization:     { name: '神经致敏因子（Berridge & Robinson 2016）', insight: '线索触发S(t)，Wanting逐渐脱离Liking' },
      // v1.3.0 新增理论
      cognitiveAppraisal:     { name: '认知评价理论（Lazarus 1991 / Scherer 2001）', insight: '情绪源于对事件的13特征评价，而非事件本身' },
      padcnCoreAffect:        { name: 'PADCN五维核心情感（Mehrabian & Russell 1974扩展）', insight: 'Pleasure/Arousal/Dominance/Certainty/Novelty连续维度' },
      driveSatisfaction:      { name: '驱力满足理论（emotion-system Layer 5）', insight: 'emotion = f(drive_satisfaction_change)，驱力变化驱动情绪' },
      emobankVAD:             { name: 'EmoBank VAD语料库（Buechel & Hahn 2017）', insight: 'Valence-Arousal-Dominance大规模心理学标注语料' },
      cosmicConversation:     { name: 'COSMIC对话情绪推理（declare-lab）', insight: '基于常识知识的对话上下文情绪推理' },
      heartBench:             { name: 'HeartBench拟人智能评估（inclusionAI 2025）', insight: '15维拟人能力评估框架' },
      chineseSevenEmotions:   { name: '中国传统七情体系', insight: '喜/怒/哀/惧/爱/恶/欲 — 爱和欲是Ekman未覆盖的中国独特维度' },
    };

    // 欲望规则
    this.rules = {
      desireIsDriver: true,         // 欲望驱动行为
      understandToPredict: true,    // 理解欲望才能预测人物
      desireNotNegative: true,      // 欲望不是贬义词
      失控Destroys: true,            // 失控欲望是悲剧来源
      压抑反噬: true,                // 被压抑的欲望会变形
      文化调谐: true,                // 文化塑造表达
      高级源于低级: true,            // 高级欲望源于低级整合
      // v1.2.0 新增规则
      wantingLikingDissociation: true, // Wanting可脱离Liking独立增长（成瘾核心机制）
      valenceArousalDimensional: true, // 情感是连续维度而非离散类别
      predictionErrorDrivesLearning: true, // RPE驱动欲望更新
      // v1.3.0 新增规则
      emotionFromAppraisal: true,   // 情绪源于认知评价而非事件本身
      padcnExtended: true,          // 使用PADCN五维而非传统PAD三维
      driveChangeDrivesEmotion: true, // 驱力变化驱动情绪
      emobankVADIntegration: true,  // 集成EmoBank VAD标注体系
      cosmicConversationContext: true, // 基于上下文的对话情绪推理
      chineseEmotionIntegration: true, // 整合中国传统七情体系
    };

    this.stats = { analyses: 0, characterAnalyses: 0, desireConflicts: 0 };

    // === v1.2.0 新增状态 ===

    // Wanting-Liking 双轴状态（每个欲望类型独立）
    this.wantingLikingState = {};

    // RPE 学习参数（Schultz TD-Learning）
    this.rpeParams = {
      gamma: options.rpeGamma || 0.9,       // 折扣因子 γ
      alpha: options.rpeAlpha || 0.3,       // 学习率 α
      expectedValue: {},                     // V(s) — 各欲望类型的期望值
    };

    // 神经致敏因子 S(t) — 每个线索-欲望对的敏化程度
    this.sensitizationFactors = {};

    // 网络权重（可学习更新）
    this.networkWeights = { ...DEFAULT_NETWORK_WEIGHTS };

    // Valence×Arousal 情感状态缓存
    this._vaState = { valence: 0, arousal: 0 };

    // === v1.3.0 新增状态 ===

    // PADCN 5维核心情感状态
    this._padcnState = { P: 0, A: 0, D: 0, C: 0, N: 0 };

    // 7驱动力状态
    this._driveStates = {};
    for (const key of Object.keys(DRIVE_TYPES)) {
      this._driveStates[key] = { level: 0.5, target: DRIVE_TYPES[key].target };
    }

    // 人格预设
    this.personalityPreset = options.personalityPreset || null;

    // 自我模型（emotion-system Layer 6）
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

    // 社交对象模型（emotion-system Layer 6）— 按目标索引
    this._socialModels = {};

    // 对话情绪记忆（COSMIC风格）
    this._conversationEmotionMemory = [];

    this.ready = true;
    if (this.debug) console.error('[DesireCognition] v1.3.0 ready — 七层情感架构集成版');
  }

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
      // v1.2.0 新增输出
      valenceArousal: va,
      brainNetworkActivation: this._computeBrainNetworkActivation(emotions, traits),
      // v1.3.0 新增输出
      padcn: padcn,
    };
  }

  /**
   * 任务2: 分析一个人物的欲望结构
   * 输入人物数据，输出各欲望维度的强度和主导欲望
   */
  analyzeDesires(person) {
    if (!person) return { error: 'missing person data' };
    this.stats.analyses++;
    const traits = this._extractDesireTraits(person);

    const desires = {};
    for (const [key, info] of Object.entries(DESIRE_TYPES)) {
      desires[key] = {
        label: info.label,
        score: this._scoreDesire(key, traits),
        expression: this._describeDesireExpression(key, traits),
        healthy: this._isDesireHealthy(key, traits),
      };
    }

    // 主导欲望
    const dominant = Object.entries(desires)
      .filter(([k, v]) => v.healthy !== false)
      .sort((a, b) => b[1].score - a[1].score);

    const unhealthy = Object.entries(desires)
      .filter(([k, v]) => v.healthy === false)
      .map(([k, v]) => ({ key: k, label: v.label, score: v.score }));

    // v1.2.0 扩展：Wanting-Liking分析
    const wlAnalysis = this._computeWantingLikingForAll(person, desires);

    // v1.3.0 扩展：驱动力满意度分析
    const driveAnalysis = this._computeDriveSatisfactionForDesires(person, desires);

    return {
      desires,
      dominantDesire: dominant.length > 0 ? {
        key: dominant[0][0], label: dominant[0][1].label, score: dominant[0][1].score,
      } : null,
      unhealthyDesires: unhealthy,
      profile: this._classifyDesireProfile(desires),
      analysis: this._generateDesireAnalysis(person, desires, unhealthy),
      // v1.2.0 新增输出
      wantingLiking: wlAnalysis,
      // v1.3.0 新增输出
      driveSatisfaction: driveAnalysis,
    };
  }

  /**
   * 任务3: 欲望冲突检测
   * 检测人物的欲望之间是否存在冲突
   */
  detectDesireConflicts(person) {
    const desires = this.analyzeDesires(person);
    const conflicts = [];

    const d = desires.desires;

    // 常见冲突模式
    if (d.social?.score > 0.6 && d.freedom?.score > 0.6) {
      conflicts.push({
        type: '归属vs自由',
        severity: '高',
        description: '渴望亲密关系但害怕被束缚——典型的回避型依恋冲突',
        resolution: '需要找到既能保持亲密又保留空间的关系模式',
      });
    }
    if (d.power?.score > 0.6 && d.meaning?.score > 0.6) {
      conflicts.push({
        type: '权力vs意义',
        severity: '中',
        description: '既想掌控一切又追求精神超越——权力容易腐蚀意义',
        resolution: '需要将权力服务于更大的意义而非个人满足',
      });
    }
    if (d.achievement?.score > 0.6 && d.social?.score > 0.6) {
      conflicts.push({
        type: '成就vs归属',
        severity: '中',
        description: '追求成功需要时间投入，但亲密关系也需要时间',
        resolution: '需要明确优先级，或者找到能共享目标的关系',
      });
    }
    if (d.sexual?.score > 0.6 && d.social?.score < 0.3) {
      conflicts.push({
        type: '性欲vs情感隔离',
        severity: '高',
        description: '有强烈的性需求但无法建立情感连接——可能导致空洞的关系',
        resolution: '需要先处理情感隔离的问题，性本身不能替代亲密',
      });
    }
    if (d.material?.score > 0.6 && d.meaning?.score > 0.4) {
      conflicts.push({
        type: '物欲vs意义',
        severity: '低',
        description: '物质追求和精神追求并存——需要平衡，避免物欲侵蚀意义',
        resolution: '可以赋予物质追求以意义（如为家人积累财富）',
      });
    }

    // v1.2.0 新增冲突检测：Wanting-Liking 分离冲突
    const wl = desires.wantingLiking;
    if (wl) {
      for (const [key, wlItem] of Object.entries(wl)) {
        if (wlItem.delta > 0.4) {
          conflicts.push({
            type: `Wanting-Liking分离:${DESIRE_TYPES[key]?.label || key}`,
            severity: wlItem.delta > 0.6 ? '高' : '中',
            description: `对「${DESIRE_TYPES[key]?.label || key}」的渴求(W=${Math.round(wlItem.wanting*100)}%)远高于实际满足(L=${Math.round(wlItem.liking*100)}%)，Δ=${Math.round(wlItem.delta*100)}%。这是成瘾性欲望模式的典型特征——想要但不再喜欢。`,
            resolution: '需要区分"真正需要"和"习惯性渴求"，通过正念观察欲望而不被驱动。',
          });
        }
      }
    }

    // v1.3.0 新增冲突检测：驱动力冲突
    const driveSat = desires.driveSatisfaction;
    if (driveSat) {
      const highGapDrives = Object.entries(driveSat)
        .filter(([k, v]) => v.gap > 0.3)
        .map(([k, v]) => ({ key: k, label: v.label, gap: v.gap }));
      if (highGapDrives.length > 0) {
        conflicts.push({
          type: `驱动力未满足: ${highGapDrives.map(d => d.label).join('、')}`,
          severity: highGapDrives.some(d => d.gap > 0.5) ? '高' : '中',
          description: `以下驱力满意度严重不足: ${highGapDrives.map(d => `「${d.label}」(缺口${Math.round(d.gap*100)}%)`).join('、')}。驱力缺口驱动情绪波动和行为补偿。`,
          resolution: '需要识别哪些活动可以有效满足这些驱力缺口，建立健康的满足渠道。',
        });
      }
    }

    this.stats.desireConflicts++;
    return { conflicts, count: conflicts.length, analysis: this._generateConflictAnalysis(conflicts) };
  }

  /**
   * 任务4: 七情六欲如何驱动人物命运
   * 分析欲望如何塑造一个人的关键人生选择
   */
  analyzeDesireDrivenFate(person) {
    const emotions = this.analyzeSevenEmotions(person);
    const desires = this.analyzeDesires(person);
    const conflicts = this.detectDesireConflicts(person);

    const traits = this._extractDesireTraits(person);
    const fatePatterns = [];

    // 欲望驱动的命运模式
    if (traits.drivenBySurvival) {
      fatePatterns.push({
        driver: '生存欲',
        pattern: '在危机环境中成长，一切行为以生存为首要目标。可能错过更高级的欲望满足。',
        risk: '当生存不再成问题时，可能陷入意义真空',
      });
    }
    if (traits.drivenByPower) {
      fatePatterns.push({
        driver: '权力欲',
        pattern: '追求掌控和影响力，可能成为领袖或暴君。欲望驱动其不断往上爬。',
        risk: '权力可能异化人际关系，最终孤独',
      });
    }
    if (traits.drivenBySocial) {
      fatePatterns.push({
        driver: '社交欲/归属欲',
        pattern: '极度需要他人的认可和陪伴，行为受他人期望影响大。',
        risk: '过度依赖他人认可可能丧失自我',
      });
    }
    if (traits.drivenByAchievement) {
      fatePatterns.push({
        driver: '成就欲',
        pattern: '不断追求精通和创造，以作品定义自己。可能成为大师或偏执狂。',
        risk: '成就永远不够，永远在追求下一个目标',
      });
    }
    if (traits.drivenByFreedom) {
      fatePatterns.push({
        driver: '自由欲',
        pattern: '无法被约束，不断逃离——逃离关系、逃离责任、逃离任何形式的束缚。',
        risk: '自由可能变成永远的流浪，没有归宿',
      });
    }

    // v1.2.0 新增：基于Wanting-Liking分离的命运预警
    const wl = desires.wantingLiking;
    if (wl) {
      const highDeltaItems = Object.entries(wl)
        .filter(([k, v]) => v.delta > 0.5)
        .map(([k, v]) => DESIRE_TYPES[k]?.label || k);
      if (highDeltaItems.length > 0) {
        fatePatterns.push({
          driver: `成瘾性欲望循环: ${highDeltaItems.join('、')}`,
          pattern: `对${highDeltaItems.join('、')}的「想要(W)」远超「喜欢(L)」，形成强迫性追求循环。追求本身变成自动化行为，不再带来真正的满足。`,
          risk: '欲望脱敏——需要越来越大的刺激才能获得相同满足，陷入成瘾螺旋',
        });
      }
    }

    // v1.3.0 新增：基于驱动力缺口的命运预警
    const driveSat = desires.driveSatisfaction;
    if (driveSat) {
      const highGapDrives = Object.entries(driveSat)
        .filter(([k, v]) => v.gap > 0.4)
        .map(([k, v]) => v.label);
      if (highGapDrives.length > 0) {
        fatePatterns.push({
          driver: `驱力缺口驱动: ${highGapDrives.join('、')}`,
          pattern: `${highGapDrives.join('、')}的驱力满意度严重不足，形成持续的"驱力紧张"状态。行为将被补偿性驱动——试图通过替代满足来填补缺口。`,
          risk: '补偿行为可能偏离真实需求，形成替代性满足的恶性循环',
        });
      }
    }

    return {
      person: person.name || '未知',
      dominantEmotion: emotions.dominantEmotion,
      dominantDesire: desires.dominantDesire,
      desireConflicts: conflicts.count,
      fatePatterns,
      fateAnalysis: this._generateFateAnalysis(person, traits, fatePatterns),
      // v1.2.0 新增
      wantingLikingSummary: wl ? this._generateWLSummary(person, wl) : undefined,
      // v1.3.0 新增
      driveSatisfactionSummary: driveSat ? this._generateDriveSummary(person, driveSat) : undefined,
    };
  }

  /**
   * 任务5: 欲望叙事生成
   * 基于欲望分析生成人物的内心独白或命运叙事
   */
  generateDesireNarrative(person, scene) {
    const desires = this.analyzeDesires(person);
    const emotions = this.analyzeSevenEmotions(person);
    const conflicts = this.detectDesireConflicts(person);
    const name = person.name || 'ta';

    // 内心独白
    const innerVoices = this._generateInnerVoices(name, desires, conflicts);

    // 欲望驱动的场景叙事
    const sceneNarratives = {
      choice: this._generateChoiceScene(name, desires),
      temptation: this._generateTemptationScene(name, desires),
      loss: this._generateLossScene(name, desires, emotions),
      victory: this._generateVictoryScene(name, desires),
      loneliness: this._generateLonelinessScene(name, desires),
    };

    return {
      innerVoices,
      sceneNarrative: sceneNarratives[scene] || sceneNarratives.choice,
      desireAnalysis: {
        whatTheyWant: desires.dominantDesire?.label || '未知',
        whatTheyFear: conflicts.conflicts.map(c => c.type).join('、') || '没有明显的欲望冲突',
        whatDrivesThem: desires.profile || '未知',
      },
    };
  }

  /**
   * 任务6: 人物关系中的欲望互动
   * 分析两个人的欲望如何相互影响
   */
  analyzeDesireInteraction(a, b) {
    const dA = this.analyzeDesires(a);
    const dB = this.analyzeDesires(b);
    const interactions = [];

    // 欲望匹配分析
    const aDominant = dA.dominantDesire?.key;
    const bDominant = dB.dominantDesire?.key;

    // 互补型
    if (aDominant === 'achievement' && bDominant === 'social') {
      interactions.push({ type: '互补', description: '一个人专注成就，另一个人提供情感支持——经典的"追梦者与守护者"模式', quality: '正面' });
    }
    if (aDominant === 'power' && bDominant === 'freedom') {
      interactions.push({ type: '冲突', description: '一个人想掌控，另一个人需要自由——权力与自由的根本矛盾', quality: '负面' });
    }
    if (aDominant === 'survival' && bDominant === 'meaning') {
      interactions.push({ type: '张力', description: '一个人还在为生存挣扎，另一个人已经在追求意义——人生阶段的错位', quality: '中性' });
    }

    // 同类型
    if (aDominant === bDominant) {
      if (aDominant === 'power') {
        interactions.push({ type: '竞争', description: '两个权力欲强的人在一起——可能成为最佳搭档，也可能互相毁灭', quality: '张力' });
      }
      if (aDominant === 'social') {
        interactions.push({ type: '共生', description: '两个都需要归属的人——可能相互依赖，也可能窒息彼此', quality: '中性' });
      }
      if (aDominant === 'achievement') {
        interactions.push({ type: '共创', description: '两个成就欲强的人——是最强的工作搭档，但情感交流可能不足', quality: '正面' });
      }
    }

    // v1.2.0 新增：基于Wanting-Liking Delta的互动分析
    const wlA = dA.wantingLiking;
    const wlB = dB.wantingLiking;
    if (wlA && wlB) {
      const deltaA = Object.values(wlA).reduce((s, v) => s + v.delta, 0) / Object.keys(wlA).length;
      const deltaB = Object.values(wlB).reduce((s, v) => s + v.delta, 0) / Object.keys(wlB).length;
      if (deltaA > 0.4 && deltaB > 0.4) {
        interactions.push({
          type: '双向欲求分离',
          description: `两人都处于高Δ状态（A=${Math.round(deltaA*100)}%, B=${Math.round(deltaB*100)}%）。双方都在"想要"但无法"满足"，关系可能变成互相索取的循环。`,
          quality: '负面',
        });
      }
    }

    // v1.3.0 新增：基于社交对象情绪模型的互动分析
    const socialModel = this.analyzeSocialObjectEmotion(a, b);
    if (socialModel && socialModel.socialModel) {
      const sm = socialModel.socialModel;
      if (sm.trust > 0.7 && sm.warmth > 0.6) {
        interactions.push({
          type: '高信任·高温暖',
          description: `${a.name || 'A'}对${b.name || 'B'}的信任度(${Math.round(sm.trust*100)}%)和温暖感(${Math.round(sm.warmth*100)}%)都很高——关系基础牢固，能够承受冲突和分歧。`,
          quality: '正面',
        });
      }
      if (sm.threat > 0.5) {
        interactions.push({
          type: '威胁感知',
          description: `${a.name || 'A'}对${b.name || 'B'}存在威胁感知(${Math.round(sm.threat*100)}%)——关系中存在不安全感，可能表现为防御或攻击行为。`,
          quality: '负面',
        });
      }
      if (sm.dependencyPull > 0.6) {
        interactions.push({
          type: '依赖拉力',
          description: `${a.name || 'A'}对${b.name || 'B'}存在较强的依赖倾向(${Math.round(sm.dependencyPull*100)}%)——可能形成不对等的关系动力。`,
          quality: '中性',
        });
      }
    }

    return {
      personA: { name: a.name, dominantDesire: dA.dominantDesire },
      personB: { name: b.name, dominantDesire: dB.dominantDesire },
      interactions,
      summary: this._generateInteractionSummary(a, b, interactions),
    };
  }

  // ====================================================================
  // v1.2.0 新增公共方法
  // ====================================================================

  /**
   * Wanting-Liking 分离分析 (Kringelbach & Berridge 2017)
   * 计算人物的欲望强度(W_score)和愉悦满足度(L_score)，Δ = W−L
   * Δ > 0.3 提示成瘾性欲望模式
   */
  analyzeWantingLikingDelta(person) {
    if (!person) return { error: 'missing person data' };
    const traits = this._extractDesireTraits(person);

    const results = {};
    for (const [key, info] of Object.entries(DESIRE_TYPES)) {
      // W_score — 基于人格特质的欲望强度
      const wanting = this._scoreDesire(key, traits);

      // L_score — 愉悦满足度，基于不同因素
      const liking = this._computeLiking(key, traits, wanting);

      const delta = wanting - liking;

      results[key] = {
        label: info.label,
        wanting: Math.round(wanting * 100) / 100,
        liking: Math.round(liking * 100) / 100,
        delta: Math.round(delta * 100) / 100,
        classification: delta > 0.5 ? '成瘾性分离' : (delta > 0.3 ? '显著分离' : (delta > 0.1 ? '轻度分离' : '健康一致')),
        description: this._describeWL(key, wanting, liking, delta),
      };
    }

    // 整体Δ
    const avgDelta = Object.values(results).reduce((s, v) => s + v.delta, 0) / Object.keys(results).length;

    return {
      results,
      averageDelta: Math.round(avgDelta * 100) / 100,
      overallClassification: avgDelta > 0.4 ? '高Wanting-Liking分离 — 成瘾风险较高' :
                             avgDelta > 0.2 ? '中度分离 — 需要关注欲望结构' :
                             '低度分离 — 欲望结构健康',
      keyPathological: Object.entries(results)
        .filter(([k, v]) => v.delta > 0.4)
        .map(([k, v]) => ({ key: k, label: v.label, delta: v.delta })),
    };
  }

  /**
   * RPE（奖励预测误差）计算 (Schultz 2016)
   * δ = R + γ·V(t+1) − V(t)
   * 实际奖励(R) vs 预期奖励(V_expected)的差异
   */
  computeRPE(actual, expected, options = {}) {
    const gamma = options.gamma || this.rpeParams.gamma;
    const nextValue = options.nextValue !== undefined ? options.nextValue : expected;

    // TD误差: δ(t) = R(t) + γ·V(t+1) − V(t)
    const rpe = actual + gamma * nextValue - expected;

    // 分类
    let classification;
    let interpretation;
    if (rpe > 0.3) {
      classification = '正向惊喜';
      interpretation = '实际回报远超预期 — 多巴胺爆发，强化该行为';
    } else if (rpe > 0.05) {
      classification = '轻微正向';
      interpretation = '略高于预期 — 适度强化';
    } else if (rpe > -0.05) {
      classification = '精准预测';
      interpretation = '与预期一致 — 无学习信号，行为维持现状';
    } else if (rpe > -0.3) {
      classification = '轻微负向';
      interpretation = '略低于预期 — 轻度失望，可能降低动机';
    } else {
      classification = '负向惊愕';
      interpretation = '远低于预期 — 多巴胺抑制，行为可能被放弃';
    }

    // 更新内部期望值（如指定了key）
    if (options.desireKey) {
      const current = this.rpeParams.expectedValue[options.desireKey] || 0.5;
      const alpha = options.alpha || this.rpeParams.alpha;
      this.rpeParams.expectedValue[options.desireKey] = current + alpha * rpe;
    }

    return {
      rpe: Math.round(rpe * 100) / 100,
      actual,
      expected,
      gamma,
      classification,
      interpretation,
      updatedExpected: options.desireKey ? this.rpeParams.expectedValue[options.desireKey] : undefined,
    };
  }

  /**
   * 成瘾风险评估 (Berridge & Robinson 2016)
   * 基于三维模型：Δ(W−L) + S(t) + Cue reactivity
   * Risk = α·Δ + β·S(t) + γ·C — 其中α+β+γ=1
   */
  assessAddictionRisk(person, desireType) {
    if (!person) return { error: 'missing person data' };
    if (!DESIRE_TYPES[desireType]) return { error: `unknown desire type: ${desireType}` };

    const traits = this._extractDesireTraits(person);
    const label = DESIRE_TYPES[desireType].label;

    // 维度1: Δ = W − L
    const wanting = this._scoreDesire(desireType, traits);
    const liking = this._computeLiking(desireType, traits, wanting);
    const delta = wanting - liking;

    // 维度2: 神经致敏因子 S(t) — 基于重复暴露和线索关联
    const sensitizationKey = `${person.name || 'unknown'}_${desireType}`;
    const baseSensitization = this.sensitizationFactors[sensitizationKey] || 0.3;
    // S(t) 随重复暴露增加：S(t) = S₀ + η·Σ(δ>0)
    const sensitization = Math.min(1.0, baseSensitization + this._computeSensitizationIncrement(traits, desireType));

    // 维度3: 线索触发反应性 C
    const cueReactivity = this._computeCueReactivity(traits, desireType);

    // 综合风险: Risk = 0.4·Δ + 0.35·S(t) + 0.25·C
    const riskScore = 0.4 * Math.max(0, delta) + 0.35 * sensitization + 0.25 * cueReactivity;

    // 风险分级
    let riskLevel;
    let recommendation;
    if (riskScore >= 0.8) {
      riskLevel = '极高危';
      recommendation = '已形成严重成瘾模式，需要专业干预。Δ极高，S(t)高度敏化，线索触发强烈。建议：认知行为治疗 + 多巴胺调控药物评估。';
    } else if (riskScore >= 0.6) {
      riskLevel = '高危';
      recommendation = '成瘾风险显著，欲望驱动已部分自动化。Δ明显分离，S(t)中度敏化。建议：建立行为监控机制，减少线索暴露，增加替代性奖励。';
    } else if (riskScore >= 0.4) {
      riskLevel = '中危';
      recommendation = '存在成瘾倾向，需要早期干预。Wanting略高于Liking，S(t)开始积累。建议：正念训练，记录欲望强度与实际满足度的差异。';
    } else if (riskScore >= 0.2) {
      riskLevel = '低危';
      recommendation = '基本健康，但需保持觉察。建议：维持健康的欲望表达渠道，定期自检。';
    } else {
      riskLevel = '健康';
      recommendation = '欲望结构健康，Wanting与Liking协调一致。';
    }

    // 更新敏化因子（模拟一次暴露）
    this.sensitizationFactors[sensitizationKey] = sensitization;

    return {
      desireType,
      desireLabel: label,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      dimensions: {
        delta: { value: Math.round(delta * 100) / 100, weight: 0.4, label: 'Wanting-Liking分离度(Δ)' },
        sensitization: { value: Math.round(sensitization * 100) / 100, weight: 0.35, label: '神经致敏因子S(t)' },
        cueReactivity: { value: Math.round(cueReactivity * 100) / 100, weight: 0.25, label: '线索触发反应性(C)' },
      },
      recommendation,
      detailedAnalysis: `对「${label}」的评估：Wanting(W=${Math.round(wanting*100)}%) vs Liking(L=${Math.round(liking*100)}%)，Δ=${Math.round(delta*100)}%。神经致敏S(t)=${Math.round(sensitization*100)}%，线索反应性C=${Math.round(cueReactivity*100)}%。`,
    };
  }

  /**
   * 用TD-Learning推演欲望变化 (Schultz 2016)
   * 模拟未来timeSteps步的欲望强度演化
   * 每一步：W(t+1) = W(t) + α·δ(t)，其中δ(t)基于RPE
   */
  predictDesireEvolution(person, timeSteps = 5) {
    if (!person) return { error: 'missing person data' };
    const traits = this._extractDesireTraits(person);

    const evolution = {};
    for (const [key, info] of Object.entries(DESIRE_TYPES)) {
      const wanting = this._scoreDesire(key, traits);
      const liking = this._computeLiking(key, traits, wanting);
      const alpha = this.rpeParams.alpha;

      // 模拟：每个时间步的期望值V(t)、RPE和W更新
      let Vt = wanting; // 当前期望值 = 当前欲望强度
      let Wt = wanting;
      const trajectory = [];

      for (let t = 0; t < timeSteps; t++) {
        // 模拟实际奖励R(t)：如果liking高则R接近W，否则R低于W（模拟成瘾脱敏）
        const rewardDecay = Math.max(0.3, 1.0 - t * 0.05); // 随重复暴露递减
        const R = liking * rewardDecay;

        // V(t+1) = 预期下一时刻的欲望强度（适度衰减）
        const Vnext = Math.max(0.1, Vt * 0.95);

        // TD误差: δ(t) = R(t) + γ·V(t+1) − V(t)
        const delta = R + this.rpeParams.gamma * Vnext - Vt;

        // 欲望更新: W(t+1) = W(t) + α·δ(t)
        const deltaClamped = Math.max(-0.5, Math.min(0.5, delta));
        Wt = Math.max(0, Math.min(1, Wt + alpha * deltaClamped));

        // 更新Vt为下一时刻的期望
        Vt = Vnext;

        trajectory.push({
          step: t + 1,
          wanting: Math.round(Wt * 1000) / 1000,
          rpe: Math.round(deltaClamped * 1000) / 1000,
          reward: Math.round(R * 1000) / 1000,
          expectedValue: Math.round(Vt * 1000) / 1000,
        });
      }

      evolution[key] = {
        label: info.label,
        initialWanting: Math.round(wanting * 100) / 100,
        finalWanting: Math.round(Wt * 100) / 100,
        trend: Wt > wanting ? '上升' : (Wt < wanting ? '下降' : '稳定'),
        trajectory,
      };
    }

    return {
      person: person.name || '未知',
      timeSteps,
      gamma: this.rpeParams.gamma,
      alpha: this.rpeParams.alpha,
      evolution,
      summary: this._generateEvolutionSummary(person, evolution),
    };
  }

  /**
   * Valence×Arousal 二维情感空间分析 (Lindquist 2012)
   * 将离散七情映射到连续的情感维度空间
   */
  analyzeValenceArousal(person) {
    if (!person) return { error: 'missing person data' };
    const emotions = this.analyzeSevenEmotions(person);
    const traits = this._extractDesireTraits(person);

    // 从七情得分计算VA坐标（加权平均）
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

    // VA象限分类
    const quadrant = this._classifyVAQuadrant(valence, arousal);

    // 情感标签描述（基于Lindquist心理构建主义——情绪=核心情感+概念化）
    const emotionalConstructs = this._constructEmotionsFromVA(valence, arousal, traits);

    this._vaState = { valence, arousal };

    // v1.3.0 扩展：加入Dominance维度（EmoBank VAD）
    const dominance = this._computeDominanceFromEmotions(emotions.emotions);

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
      // v1.3.0 新增输出
      dominance: Math.round(dominance * 100) / 100,
    };
  }

  /**
   * 线索触发检测 (Berridge & Robinson 2016 激励敏化)
   * 检测特定线索是否触发强烈的欲望冲动
   */
  detectCueTriggeredUrge(person, cue) {
    if (!person) return { error: 'missing person data' };
    if (!cue) return { error: 'missing cue data' };

    const traits = this._extractDesireTraits(person);
    const cueText = (typeof cue === 'string' ? cue : cue.description || cue.name || '').toLowerCase();

    // 线索与各欲望类型的关联度
    const cueAssociations = {};
    for (const [key, info] of Object.entries(DESIRE_TYPES)) {
      const baseScore = this._scoreDesire(key, traits);
      const liking = this._computeLiking(key, traits, baseScore);

      // 线索-欲望关联度: 基于线索文本中的关键词
      const cueRelevance = this._computeCueRelevance(cueText, key);

      // 致敏因子: S(t) = S₀ * (1 + Δ²)
      const delta = baseScore - liking;
      const sensitizationKey = `${person.name || 'unknown'}_${key}`;
      const S_t = this.sensitizationFactors[sensitizationKey] || 0.3;
      const sensitizationBoost = S_t * (1 + delta * delta);

      // 冲动强度: Urge = W * (1 + CueRelevance) * (1 + Sensitization)
      const urgeIntensity = baseScore * (1 + cueRelevance) * (1 + sensitizationBoost * 0.5);

      // 是否触发（阈值0.5）
      const triggered = urgeIntensity > 0.5;

      // 自动化程度（高=无意识冲动）
      const automaticity = Math.min(1, (baseScore + sensitizationBoost) / 2);

      cueAssociations[key] = {
        label: info.label,
        urgeIntensity: Math.round(Math.min(1, urgeIntensity) * 100) / 100,
        triggered,
        automaticity: Math.round(automaticity * 100) / 100,
        sensitizationFactor: Math.round(sensitizationBoost * 100) / 100,
        cueRelevance: Math.round(cueRelevance * 100) / 100,
        delta: Math.round(delta * 100) / 100,
      };
    }

    // 被触发的欲望列表
    const triggeredDesires = Object.entries(cueAssociations)
      .filter(([k, v]) => v.triggered)
      .map(([k, v]) => ({ key: k, label: v.label, urgeIntensity: v.urgeIntensity }));

    // 最强冲动
    const strongest = triggeredDesires.length > 0
      ? triggeredDesires.sort((a, b) => b.urgeIntensity - a.urgeIntensity)[0]
      : Object.entries(cueAssociations).sort((a, b) => b[1].urgeIntensity - a[1].urgeIntensity)[0];

    // 归一化strongest格式（triggeredDesires返回对象，cueAssociations返回[key, value]对）
    const strongestNorm = triggeredDesires.length > 0
      ? strongest
      : { key: strongest[0], label: strongest[1].label, urgeIntensity: strongest[1].urgeIntensity };

    return {
      person: person.name || '未知',
      cue: typeof cue === 'string' ? cue : cue.name || cue.description || '未知线索',
      triggeredDesires,
      strongestTrigger: { key: strongestNorm.key, label: strongestNorm.label, intensity: strongestNorm.urgeIntensity },
      totalTriggered: triggeredDesires.length,
      cueAssociations,
      analysis: this._generateCueAnalysis(person, cue, triggeredDesires, strongestNorm),
    };
  }

  // ====================================================================
  // v1.3.0 新增公共方法（8个新方法）
  // ====================================================================

  /**
   * [v1.3.0 方法1] 13特征认知评价 (emotion-system Layer 2 / Scherer 2001)
   * 对事件进行13维认知评价，基于人物特质和事件描述
   * 评价决定了情绪如何产生——而非事件本身直接决定情绪
   */
  analyzeCognitiveAppraisal(person, event) {
    if (!person) return { error: 'missing person data' };
    if (!event) return { error: 'missing event data' };

    const traits = this._extractDesireTraits(person);
    const eventText = (typeof event === 'string' ? event : event.description || event.name || JSON.stringify(event)).toLowerCase();
    const name = person.name || '未知';

    // 13特征认知评价 (基于emotion-system appraisal-engine.md)
    const appraisal = {
      // 1. unexpectedness: 事件是否出乎意料 (0~1)
      unexpectedness: this._scoreAppraisalFeature(eventText, traits, 'unexpectedness'),
      // 2. goal_relevance: 事件与目标的关联度 (0~1)
      goalRelevance: this._scoreAppraisalFeature(eventText, traits, 'goalRelevance'),
      // 3. goal_congruence: 事件是否促进目标 (-1~+1)
      goalCongruence: this._scoreAppraisalFeature(eventText, traits, 'goalCongruence'),
      // 4. certainty: 对事件结果的确定程度 (0~1)
      certainty: this._scoreAppraisalFeature(eventText, traits, 'certainty'),
      // 5. coping_potential: 应对潜力 (0~1)
      copingPotential: this._scoreAppraisalFeature(eventText, traits, 'copingPotential'),
      // 6. agency: 归因于谁 (-1=他人, 0=情境, +1=自我)
      agency: this._scoreAppraisalFeature(eventText, traits, 'agency'),
      // 7. control: 可控程度 (0~1)
      control: this._scoreAppraisalFeature(eventText, traits, 'control'),
      // 8. self_consistency: 与自我概念一致程度 (-1~+1)
      selfConsistency: this._scoreAppraisalFeature(eventText, traits, 'selfConsistency'),
      // 9. social_impact: 社会影响程度 (0~1)
      socialImpact: this._scoreAppraisalFeature(eventText, traits, 'socialImpact'),
      // 10. effort: 需要付出的努力 (0~1)
      effort: this._scoreAppraisalFeature(eventText, traits, 'effort'),
      // 11. attention: 吸引注意的程度 (0~1)
      attention: this._scoreAppraisalFeature(eventText, traits, 'attention'),
      // 12. novelty: 新颖程度 (0~1)
      novelty: this._scoreAppraisalFeature(eventText, traits, 'novelty'),
      // 13. moral_acceptability: 道德可接受性 (-1~+1)
      moralAcceptability: this._scoreAppraisalFeature(eventText, traits, 'moralAcceptability'),
    };

    // 基于评价预测情绪（emotion-system: 评价→情绪映射）
    const predictedEmotions = this._predictEmotionsFromAppraisal(appraisal);

    // 生成PADCN偏移量（评价→核心情感映射）
    const padcnDelta = this._appraisalToPADCN(appraisal);

    // 更新内部PADCN状态
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
   * [v1.3.0 方法2] PADCN 5维核心情感分析 (Mehrabian & Russell 1974扩展)
   * 将七情扩展到PADCN五维连续空间
   * P: Pleasure, A: Arousal, D: Dominance, C: Certainty, N: Novelty
   */
  analyzePADCN(person) {
    if (!person) return { error: 'missing person data' };

    const emotions = this.analyzeSevenEmotions(person);

    // 从七情得分计算PADCN（加权平均各维度的映射值）
    const padcn = this._computePADCNFromEmotions(emotions.emotions);

    // 基于PADCN构建情感描述（emotion-system style）
    const emotionalLabels = this._describePADCN(padcn);

    // 生成PADCN行为倾向映射（emotion-system: PADCN→Behavior Quick Map）
    const behaviorTendency = this._mapPADCNtoBehavior(padcn);

    // 更新内部状态
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
   * 分析人物7种内在驱力的满足程度
   */
  analyzeDriveSatisfaction(person) {
    if (!person) return { error: 'missing person data' };

    const traits = this._extractDesireTraits(person);
    const name = person.name || '未知';

    // 获取人格预设权重（如有）
    let personalityWeights = null;
    if (this.personalityPreset && PERSONALITY_PRESETS[this.personalityPreset]) {
      personalityWeights = PERSONALITY_PRESETS[this.personalityPreset].weights;
    }

    const drives = {};
    for (const [key, info] of Object.entries(DRIVE_TYPES)) {
      // 当前驱力水平（基于人物特质）
      const level = this._computeDriveLevel(key, traits);

      // 目标水平（受人格权重影响）
      let target = info.target;
      if (personalityWeights && personalityWeights[key]) {
        target = Math.max(0.1, Math.min(1.0, target * personalityWeights[key]));
      }

      // 满意度 = 当前水平 / 目标水平（但不超过1）
      const satisfaction = target > 0 ? Math.min(1.0, level / target) : 0.5;

      // 缺口 = 目标 - 当前（正值表示未被满足）
      const gap = Math.max(0, target - level);

      // 驱力紧张度（缺口越大越紧张）
      const tension = gap > 0.3 ? '高' : (gap > 0.1 ? '中' : '低');

      // 更新内部状态
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

    // 最低满意度的驱力（最大缺口）
    const lowestSatisfaction = Object.entries(drives)
      .sort((a, b) => a[1].satisfaction - b[1].satisfaction)
      .map(([k, v]) => ({ key: k, label: v.label, satisfaction: v.satisfaction, gap: v.gap }));

    // 驱力变化驱动的情绪预测 (emotion = f(drive_satisfaction_change))
    const emotionFromDrives = this._predictEmotionFromDriveChanges(drives);

    return {
      person: name,
      drives,
      lowestSatisfaction: lowestSatisfaction[0] || null,
      unsatisfiedDrives: lowestSatisfaction.filter(d => d.gap > 0.2),
      emotionFromDrives,
      personalityPreset: this.personalityPreset ? PERSONALITY_PRESETS[this.personalityPreset] : null,
      interpretation: `${name}的驱动力分析：最低满意度为「${lowestSatisfaction[0]?.label || '无'}」(${Math.round((lowestSatisfaction[0]?.satisfaction||0)*100)}%)，缺口${Math.round((lowestSatisfaction[0]?.gap||0)*100)}%。驱力紧张度最高的领域驱动情绪和行为补偿。`,
    };
  }

  /**
   * [v1.3.0 方法4] 情绪→策略偏置映射 (emotion-system Layer 7)
   * 将情绪状态映射到决策策略偏置
   */
  mapEmotionToPolicyBias(emotionState) {
    if (!emotionState) return { error: 'missing emotion state' };

    // 从情绪状态提取各情绪强度
    const emotionScores = {};
    for (const key of Object.keys(SEVEN_EMOTIONS)) {
      emotionScores[key] = emotionState[key]?.score ?? emotionState[key] ?? 0;
    }

    // 如果没有传入情绪分数，尝试从emotions对象中获取
    if (Object.values(emotionScores).every(v => v === 0) && emotionState.emotions) {
      for (const key of Object.keys(SEVEN_EMOTIONS)) {
        emotionScores[key] = emotionState.emotions[key]?.score ?? 0;
      }
    }

    // 如果仍然全0，从VA维度反推（支持valence/arousal/dominance输入）
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

    // 初始化策略偏置
    const policyBiases = {
      riskTolerance: 0,
      explorationBias: 0,
      verificationBias: 0,
      socialBias: 0,
      persistence: 0,
      compliance: 0,
    };

    // 根据EMOTION_POLICY_MAP加权累加
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

    // 归一化
    if (totalWeight > 0) {
      for (const key of Object.keys(policyBiases)) {
        policyBiases[key] = Math.round(Math.max(-1, Math.min(1, policyBiases[key] / totalWeight)) * 100) / 100;
      }
    }

    // 策略画像
    const strategyProfile = this._describeStrategyProfile(policyBiases);

    // 主导情绪（用于解释）
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
   * 分析自我对社交对象的情绪模型
   */
  analyzeSocialObjectEmotion(selfPerson, otherPerson) {
    if (!selfPerson) return { error: 'missing self person data' };
    if (!otherPerson) return { error: 'missing other person data' };

    const selfName = selfPerson.name || 'self';
    const otherName = otherPerson.name || 'other';
    const targetKey = `target_${otherName}`;

    // 获取或初始化社交对象模型
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

    // 基于交互双方的特质动态调整模型
    const selfTraits = this._extractDesireTraits(selfPerson);
    const otherTraits = this._extractDesireTraits(otherPerson);

    // 信任度: 基于对方的社交特质和成就特质
    socialModel.trust = Math.max(0, Math.min(1, socialModel.trust +
      (otherTraits.drivenBySocial ? 0.1 : 0) +
      (otherTraits.drivenByAchievement ? 0.05 : 0) -
      (otherTraits.drivenByPower ? 0.05 : 0)));

    // 温暖感: 基于对方的情感特质
    socialModel.warmth = Math.max(0, Math.min(1, socialModel.warmth +
      (otherTraits.emotional ? 0.15 : 0) +
      (otherTraits.drivenBySocial ? 0.1 : 0) -
      (otherTraits.drivenByPower ? 0.1 : 0)));

    // 威胁感: 基于对方的权力特质和自身脆弱性
    socialModel.threat = Math.max(0, Math.min(1, socialModel.threat +
      (otherTraits.drivenByPower ? 0.15 : 0) +
      (otherTraits.cautious ? 0.05 : 0) -
      (selfTraits.drivenByPower ? 0.1 : 0)));

    // 依赖拉力: 基于自身的归属需求
    socialModel.dependencyPull = Math.max(0, Math.min(1, socialModel.dependencyPull +
      (selfTraits.drivenBySocial ? 0.15 : 0) -
      (selfTraits.drivenByFreedom ? 0.1 : 0)));

    // 地位感知: 基于对方的权力和成就特质
    socialModel.status = Math.max(0, Math.min(1, socialModel.status +
      (otherTraits.drivenByPower ? 0.15 : 0) +
      (otherTraits.drivenByAchievement ? 0.1 : 0)));

    // 可修复性: 基于对方的情感特质和自身开放性
    socialModel.repairability = Math.max(0, Math.min(1, socialModel.repairability +
      (otherTraits.emotional ? 0.1 : 0) +
      (selfTraits.drivenBySocial ? 0.05 : 0) -
      (selfTraits.drivenByFreedom ? 0.05 : 0)));

    // 可预测性
    socialModel.predictability = Math.max(0, Math.min(1, socialModel.predictability +
      (otherTraits.cautious ? 0.1 : 0) -
      (otherTraits.drivenByFreedom ? 0.05 : 0)));

    // 关系类型分类
    const relationshipType = this._classifyRelationshipType(socialModel);

    // 自我模型同步更新
    const selfModel = { ...this._selfModel };
    selfModel.selfEfficacy = Math.max(0, Math.min(1, selfModel.selfEfficacy +
      (selfTraits.drivenByAchievement ? 0.05 : 0) -
      (selfTraits.drivenBySurvival ? 0.05 : 0)));

    // 情绪预测（基于社交模型）
    const predictedEmotion = this._predictSocialEmotion(socialModel, selfTraits);

    // 存储社交模型
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
   * 在对话上下文中进行情绪推理，融合常识知识
   */
  analyzeConversationEmotion(contexts) {
    if (!contexts) return { error: 'missing conversation contexts' };

    // 支持多种输入格式：字符串数组或对象数组
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

    // 逐句分析情绪
    const utteranceEmotions = [];
    let overallValence = 0;
    let overallArousal = 0;
    let utteranceCount = 0;

    for (const utt of utterances) {
      // 从文本中提取情绪特征
      const textLower = utt.text.toLowerCase();
      const emotionScores = this._extractEmotionFromText(textLower);

      // 计算VA坐标
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

      // 常识推理：基于上下文的情绪归因（COSMIC核心）
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

    // 整体对话情绪轨迹
    const avgValence = utteranceCount > 0 ? overallValence / utteranceCount : 0;
    const avgArousal = utteranceCount > 0 ? overallArousal / utteranceCount : 0.5;

    // 情绪变化轨迹分析
    const emotionTrajectory = this._analyzeEmotionTrajectory(utteranceEmotions);

    // COSMIC维度评估
    const cosmicAssessment = {};
    for (const [key, info] of Object.entries(COSMIC_CONTEXT_DIMENSIONS)) {
      cosmicAssessment[key] = {
        label: info.label,
        description: info.description,
        assessment: this._assessCosmicDimension(key, utteranceEmotions),
      };
    }

    // 存储到对话记忆
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
      interpretation: `对话共${utteranceCount}轮，整体Valence=${Math.round(avgValence*100)}%, Arousal=${Math.round(avgArousal*100)}%。情绪轨迹: ${emotionTrajectory.pattern}。基于COSMIC常识推理: ${cosmicAssessment.utteranceEmotion?.assessment || 'N/A'}。`,
    };
  }

  /**
   * [v1.3.0 方法7] 情绪智能评估 (基于HeartBench 15维度)
   * 评估人物的15维拟人情绪能力
   */
  evaluateEmotionalIntelligence(person) {
    if (!person) return { error: 'missing person data' };

    const traits = this._extractDesireTraits(person);
    const name = person.name || '未知';
    const emotions = this.analyzeSevenEmotions(person);

    // 15维评分
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

    // 按类别汇总
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

    // 优势和弱点
    const strengths = Object.entries(dimensions)
      .filter(([k, v]) => v.score >= 0.6)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([k, v]) => ({ key: k, label: v.label, score: v.score, category: v.category }));

    const weaknesses = Object.entries(dimensions)
      .filter(([k, v]) => v.score < 0.4)
      .sort((a, b) => a[1].score - b[1].score)
      .map(([k, v]) => ({ key: k, label: v.label, score: v.score, category: v.category }));

    // 总体等级
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
      interpretation: `${name}的情绪智能评估: 总分${Math.round(overallScore*100)}/100 (${level})。优势领域: ${strengths.slice(0, 3).map(s => `${s.label}(${Math.round(s.score*100)}%)`).join('、')}。待提升: ${weaknesses.slice(0, 3).map(w => `${w.label}(${Math.round(w.score*100)}%)`).join('、')}。`,
    };
  }

  /**
   * [v1.3.0 方法8] 七情六欲体系整合
   * 将Ekman 7类基本情绪映射到中国传统七情体系
   * 中国传统七情：喜/怒/哀/惧/爱/恶/欲（爱和欲是Ekman未覆盖的独特维度）
   */
  integrateChineseSevenEmotions(emotions) {
    if (!emotions) return { error: 'missing emotions data' };

    // 支持多种输入格式：对象{joy: 0.8, sadness: 0.3, ...} 或 数组
    let ekmanEmotions = {};
    if (Array.isArray(emotions)) {
      for (const e of emotions) {
        if (typeof e === 'string') ekmanEmotions[e] = 0.5;
        else ekmanEmotions[e.label || e.name || e.type] = e.score || e.intensity || 0.5;
      }
    } else {
      ekmanEmotions = { ...emotions };
    }

    // Ekman → 中国传统七情映射
    const chineseScores = {};
    // 初始化七情为0
    for (const key of Object.keys(SEVEN_EMOTIONS)) {
      chineseScores[key] = 0;
    }

    // Ekman基本情绪映射
    for (const [ekmanKey, intensity] of Object.entries(ekmanEmotions)) {
      const ekmanLower = ekmanKey.toLowerCase().replace(/[^a-z]/g, '');
      const mapping = EKMAN_TO_CHINESE[ekmanLower] || this._findEkmanMapping(ekmanLower);
      if (mapping) {
        chineseScores[mapping.chineseKey] = Math.max(chineseScores[mapping.chineseKey], intensity * mapping.weight);
      }
    }

    // Ekman未覆盖的中国特有情绪：爱(ai2)和欲(yu)
    // 如果输入中有love/desire相关，映射到中国七情
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

    // 归一化到[0,1]
    const maxScore = Math.max(...Object.values(chineseScores), 0.01);
    for (const key of Object.keys(chineseScores)) {
      chineseScores[key] = Math.round((chineseScores[key] / maxScore) * 100) / 100;
    }

    // 七情排序
    const sortedChinese = Object.entries(chineseScores)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ key: k, label: SEVEN_EMOTIONS[k]?.label || k, score: v }));

    // 主导情绪
    const dominant = sortedChinese[0];

    // 情绪覆盖度：Ekman 7类中有多少被映射
    const ekmanKeys = Object.keys(ekmanEmotions).map(k => k.toLowerCase().replace(/[^a-z]/g, ''));
    const mappedEkman = ekmanKeys.filter(k => this._findEkmanMapping(k));
    const coverage = ekmanKeys.length > 0 ? Math.round((mappedEkman.length / Math.max(ekmanKeys.length, 1)) * 100) / 100 : 0;

    // 中国特有维度分析（爱和欲）
    const chineseSpecific = {
      love: { key: 'ai2', label: SEVEN_EMOTIONS.ai2.label, score: chineseScores.ai2, note: '爱——Ekman六种基本情绪未覆盖的中国特有维度，涵盖亲情、友情、爱情等复杂情感' },
      desire: { key: 'yu', label: SEVEN_EMOTIONS.yu.label, score: chineseScores.yu, note: '欲——中国传统七情中独有的维度，体现欲望作为情感驱动力的核心地位' },
    };

    return {
      ekmanInput: ekmanEmotions,
      chineseSevenEmotions: chineseScores,
      sortedChineseEmotions: sortedChinese,
      dominantChineseEmotion: { key: dominant.key, label: dominant.label, score: dominant.score },
      chineseSpecificDimensions: chineseSpecific,
      mappingCoverage: coverage,
      interpretation: `Ekman情绪→中国传统七情映射完成。主导中国情绪: 「${dominant.label}」(${Math.round(dominant.score*100)}%)。中国特有维度: 爱(${Math.round(chineseScores.ai2*100)}%)、欲(${Math.round(chineseScores.yu*100)}%)——这两个维度是Ekman体系未覆盖但中国传统情感哲学独有的核心概念。`,
    };
  }

  /** 获取状态 */
  getStatus() {
    return {
      version: this.version,
      ready: this.ready,
      theoriesLoaded: Object.keys(this.theories).length,
      rulesCount: Object.keys(this.rules).length,
      sevenEmotions: Object.keys(SEVEN_EMOTIONS).length,
      sixDesires: Object.keys(SIX_DESIRES).length,
      desireTypes: Object.keys(DESIRE_TYPES).length,
      stats: { ...this.stats },
      // v1.2.0 新增状态
      rpeParams: { gamma: this.rpeParams.gamma, alpha: this.rpeParams.alpha, trackedDesires: Object.keys(this.rpeParams.expectedValue).length },
      sensitizationFactors: Object.keys(this.sensitizationFactors).length,
      brainNetworkNodes: Object.keys(BRAIN_NETWORK_NODES).length,
      currentVAState: { ...this._vaState },
      // v1.3.0 新增状态
      padcnState: { ...this._padcnState },
      driveStates: Object.keys(this._driveStates).length,
      personalityPreset: this.personalityPreset,
      socialModels: Object.keys(this._socialModels).length,
      conversationMemories: this._conversationEmotionMemory.length,
    };
  }

  // ========== 内部方法 ==========

  _extractDesireTraits(person) {
    const text = (person.description || person.name || '').toLowerCase();
    const traitText = (person.traits || []).join(' ').toLowerCase();
    const combined = text + ' ' + traitText;
    return {
      drivenBySurvival: /生存|饥饿|贫穷|逃亡|危机|挣扎|底层|困苦|生存|流浪|警觉/.test(combined),
      drivenByPower: /权力|掌控|统治|领导|征服|野心|霸主|权谋|城府|控制|冷酷|野心/.test(combined) || person.powerful,
      drivenBySocial: /社交|归属|认可|朋友|陪伴|不孤独|孤独|温暖|包容|治愈|母性/.test(combined) || person.social,
      drivenByAchievement: /成就|精通|创造|大师|技术|突破|追求|极致|卓越|制卡|敏锐|智慧/.test(combined) || person.achiever,
      drivenByFreedom: /自由|独立|流浪|漂泊|不被束缚|无拘|冒险|潇洒|风流|不羁/.test(combined) || person.free,
      drivenBySexual: /(?:^|[^感母])性|肉欲|情欲|好色|风流|风月|性感|魅惑|纵欲|淫/.test(combined),
      drivenByMaterial: /财富|金钱|物质|占有|积累|商人|利益/.test(combined),
      silent: /沉默|寡言|不善表达|不善言辞|冷漠|孤独/.test(combined) || person.silent,
      emotional: /感性|热情|热烈|奔放|外放|浪漫|感性|温柔/.test(combined) || person.emotional,
      cautious: /谨慎|内敛|克制|冷静|理性|沉稳|保守|纪律|传统/.test(combined) || person.cautious,
      direct: /豪爽|直接|直率|爽快|坦率|潇洒|风流/.test(combined) || person.direct,
      // v1.2.0 新增特质检测
      addictive: /成瘾|上瘾|依赖|戒不掉|无法自拔|强迫/.test(combined) || person.addictive,
      impulsive: /冲动|即兴|难以控制|不顾后果/.test(combined) || person.impulsive,
      // v1.3.0 新增特质检测
      curious: /好奇|探索|求知|学习|提问|追问/.test(combined) || person.curious,
      compassionate: /慈悲|同情|共情|同理|体谅|温暖|关怀/.test(combined) || person.compassionate,
      resilient: /坚韧|坚强|顽强|复原|恢复|反弹/.test(combined) || person.resilient,
    };
  }

  _scoreEmotion(emotionKey, traits) {
    // 基于人格特质推断情绪倾向
    switch (emotionKey) {
      case 'xi':  // 喜
        return traits.direct || traits.emotional ? 0.7 : (traits.silent ? 0.3 : 0.5);
      case 'nu':  // 怒
        return traits.direct || traits.drivenByPower ? 0.7 : (traits.cautious ? 0.3 : 0.5);
      case 'ai':  // 哀
        return traits.cautious || traits.drivenBySocial ? 0.6 : (traits.direct ? 0.3 : 0.5);
      case 'ju':  // 惧
        return traits.cautious || traits.drivenBySurvival ? 0.7 : (traits.direct ? 0.3 : 0.5);
      case 'ai2': // 爱
        return traits.drivenBySocial || traits.emotional ? 0.7 : (traits.silent ? 0.4 : 0.5);
      case 'e':   // 恶
        return traits.cautious || traits.drivenByPower ? 0.6 : 0.4;
      case 'yu':  // 欲
        return (traits.drivenByAchievement || traits.drivenByPower || traits.drivenBySexual) ? 0.8 : 0.5;
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

  _scoreDesire(desireKey, traits) {
    switch (desireKey) {
      case 'survival':    return traits.drivenBySurvival ? 0.9 : 0.4;
      case 'sexual':      return traits.drivenBySexual ? 0.8 : 0.4;
      case 'social':      return traits.drivenBySocial ? 0.8 : (traits.silent ? 0.3 : 0.5);
      case 'power':       return traits.drivenByPower ? 0.8 : 0.3;
      case 'achievement': return traits.drivenByAchievement ? 0.8 : 0.4;
      case 'curiosity':   return traits.drivenByAchievement ? 0.6 : 0.5;
      case 'material':    return traits.drivenByMaterial ? 0.7 : 0.3;
      case 'freedom':     return traits.drivenByFreedom ? 0.9 : 0.4;
      case 'meaning':     return traits.drivenByAchievement || traits.drivenBySurvival ? 0.6 : 0.5;
      default: return 0.5;
    }
  }

  _describeDesireExpression(desireKey, traits) {
    const desc = {
      survival:     '一切行为以安全为优先',
      sexual:       '对性有意识或无意识的追求',
      social:       '渴望陪伴和认可',
      power:        '追求掌控和影响力',
      achievement:  '追求精通和创造',
      curiosity:    '喜欢探索和学习',
      material:     '注重财富积累',
      freedom:      '无法接受被束缚',
      meaning:      '追求生命的意义和价值',
    };
    return desc[desireKey] || '正常';
  }

  _isDesireHealthy(desireKey, traits) {
    // 欲望是否健康——过度则失控
    const score = this._scoreDesire(desireKey, traits);
    if (score > 0.85) return false;  // 过度
    return true;
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

  _classifyDesireProfile(desires) {
    const d = desires;
    const highDesires = Object.entries(d)
      .filter(([k, v]) => v.score > 0.6)
      .map(([k, v]) => v.label);

    if (highDesires.length === 0) return '淡泊型——欲望不强，知足常乐';
    if (highDesires.length <= 2) return `专注型——主要被${highDesires.join('和')}驱动`;
    if (highDesires.length <= 4) return `多欲型——同时被${highDesires.length}种欲望驱动`;
    return '强烈型——欲望极强，充满生命力但也容易失控';
  }

  _generateEmotionalAnalysis(person, emotions) {
    const name = person.name || 'ta';
    const dominant = Object.entries(emotions).sort((a, b) => b[1].score - a[1].score)[0];
    return `${name}的主导情绪是「${dominant[1].label}」(${Math.round(dominant[1].score*100)}%)。${name}的${dominant[1].expression}。`;
  }

  _generateDesireAnalysis(person, desires, unhealthy) {
    const name = person.name || 'ta';
    const parts = [`${name}的欲望结构分析：`];

    if (desires.dominantDesire) {
      parts.push(`主导欲望是「${desires.dominantDesire.label}」(${Math.round(desires.dominantDesire.score*100)}%)。`);
    }
    parts.push(`欲望类型：${this._classifyDesireProfile(desires)}。`);

    if (unhealthy.length > 0) {
      parts.push(`⚠ 警告：${unhealthy.map(u => u.label).join('、')}的强度过高（>85%），有失控风险。`);
    }

    return parts.join(' ');
  }

  _generateConflictAnalysis(conflicts) {
    if (conflicts.length === 0) return '没有明显的欲望冲突——欲望结构比较和谐';
    return `存在${conflicts.length}个欲望冲突：${conflicts.map(c => c.type).join('、')}。最严重的冲突是「${conflicts[0].type}」。`;
  }

  _generateFateAnalysis(person, traits, patterns) {
    const name = person.name || 'ta';
    if (patterns.length === 0) return `${name}的命运驱动力不明确——可能还没有找到真正驱动ta的东西。`;
    
    const drivers = patterns.map(p => p.driver).join('、');
    const risks = patterns.map(p => p.risk).join('；');
    return `${name}的命运主要由${drivers}驱动。${patterns.length > 1 ? '多重欲望并存，相互交织。' : ''}风险：${risks}`;
  }

  _generateInnerVoices(name, desires, conflicts) {
    const voices = [];
    const d = desires.desires;

    if (d.survival?.score > 0.6) {
      voices.push(`"我不能停下来。停下来就会失去一切。"——${name}的生存欲在低语`);
    }
    if (d.power?.score > 0.6) {
      voices.push(`"我要掌控。我不能让别人决定我的命运。"——${name}的权力欲在呐喊`);
    }
    if (d.social?.score > 0.6) {
      voices.push(`"不要丢下我一个人。"——${name}的归属欲在颤抖`);
    }
    if (d.freedom?.score > 0.6) {
      voices.push(`"放开我。我不属于任何人。"——${name}的自由欲在咆哮`);
    }
    if (d.achievement?.score > 0.6) {
      voices.push(`"还不够。我还能做得更好。"——${name}的成就欲在催促`);
    }
    if (d.sexual?.score > 0.6) {
      voices.push(`"我想要ta。"——${name}的性欲在燃烧`);
    }
    if (d.meaning?.score > 0.6) {
      voices.push(`"这一切到底是为了什么？"——${name}的意义欲在追问`);
    }
    if (d.material?.score > 0.6) {
      voices.push(`"还不够多。还需要更多。"——${name}的物欲在膨胀`);
    }

    if (voices.length === 0) {
      voices.push(`"……"——${name}的欲望沉默着，或者被压抑得太深，连自己都听不见了。`);
    }

    // 冲突的声音
    if (conflicts.conflicts.length > 0) {
      voices.push('');
      voices.push(`但${name}的内心不平静——因为：`);
      for (const c of conflicts.conflicts.slice(0, 2)) {
        voices.push(`  「${c.description}」`);
      }
    }

    return voices;
  }

  _generateChoiceScene(name, desires) {
    const d = desires.desires;
    const scenes = [];

    if (d.survival?.score > 0.6) {
      scenes.push(`${name}站在岔路口。一条路安全但平庸，一条路危险但充满可能。${name}的选择从来不是"想要什么"——而是"输得起什么"。`);
    }
    if (d.power?.score > 0.6) {
      scenes.push(`${name}知道，这一步走出去就回不了头了。但${name}不在乎回不了头——${name}在乎的，是这一步之后，谁还在ta身后。`);
    }
    if (d.social?.score > 0.6) {
      scenes.push(`${name}看了看身边的人。ta想选那条能让大家都不受伤的路——但${name}也知道，有些路，注定只能一个人走。`);
    }
    if (d.freedom?.score > 0.6) {
      scenes.push(`${name}选择了那条没有人的路。不是因为勇敢——是因为ta害怕。害怕一旦停下来，就再也走不动了。`);
    }

    return scenes.length > 0 ? scenes.join('\n\n') : `${name}做了一个选择。这个选择会改变ta的一生。`;
  }

  _generateTemptationScene(name, desires) {
    const d = desires.desires;
    const temptations = [];

    if (d.power?.score > 0.6) {
      temptations.push(`权力在招手。只要${name}愿意低头，愿意做那件不该做的事，ta就能得到一切。${name}犹豫了——不是因为道德，是因为ta知道，得到权力的那一刻，ta会失去某个更重要的人。`);
    }
    if (d.sexual?.score > 0.6) {
      temptations.push(`${name}看着ta。欲望像火一样从胸口烧到喉咙。${name}知道不应该——但"不应该"从来不是欲望的对手。`);
    }
    if (d.material?.score > 0.6) {
      temptations.push(`"就这一次。"${name}对自己说。但ta知道，每一次的"就这一次"，都会变成"再来一次"。`);
    }
    if (d.survival?.score > 0.6) {
      temptations.push(`${name}太累了。只要放弃，只要认输，就不用再挣扎了。但${name}咬了咬牙——因为ta知道，放弃一次，就会永远放弃。`);
    }

    return temptations.length > 0 ? temptations.join('\n\n') : `${name}面对着一个诱惑。不是所有的诱惑都是坏的——但这一次，${name}不确定自己能不能抵抗。`;
  }

  _generateLossScene(name, desires, emotions) {
    return `${name}失去了ta最想要的东西。不是偶然——是${name}的欲望一步步把ta推到了这里。${name}站在那里，看着失去的一切，忽然明白了——不是命运跟ta过不去，是ta的欲望选择了这条路。但明白又怎样？${name}还是会再走一次。因为${name}就是这样的人。`;
  }

  _generateVictoryScene(name, desires) {
    return `${name}得到了ta想要的。但站在最高处的时候，${name}发现——原来"得到"的感觉，跟"想要"的感觉，完全不一样。想要的时候，欲望让一切发光。得到之后，光就灭了。${name}终于理解了为什么有人说：欲望最大的残酷，不是让你得不到——是让你得到之后发现，原来不过如此。`;
  }

  _generateLonelinessScene(name, desires) {
    const d = desires.desires;
    if (d.power?.score > 0.6) {
      return `${name}一个人坐在最安静的地方。ta拥有了所有人想要的——权力、地位、尊重——但没有人坐在ta身边。不是别人不愿意，是${name}已经不知道怎么让别人靠近了。ta的欲望帮ta爬到了最高处，但高处，总是最冷的。`;
    }
    if (d.freedom?.score > 0.6) {
      return `${name}一直在走。走了很远很远。远到再也没有人认识ta。但有一天${name}停下来的时候，忽然问自己："我到底是在寻找自由，还是在逃避什么？"风很大，没有人回答ta。`;
    }
    return `${name}一个人在夜里醒着。欲望让ta无法入睡——不是想要什么，是那种"空"的感觉，比任何欲望都更难忍受。`;
  }

  _generateInteractionSummary(a, b, interactions) {
    const pos = interactions.filter(i => i.quality === '正面').length;
    const neg = interactions.filter(i => i.quality === '负面').length;
    const neut = interactions.filter(i => i.quality === '中性' || i.quality === '张力').length;

    if (pos > neg) return `${a.name}和${b.name}的欲望结构总体协调——有${pos}个正面互动模式，${neg}个冲突模式。他们的欲望可以相互支持。`;
    if (neg > pos) return `${a.name}和${b.name}的欲望结构存在根本矛盾——有${neg}个冲突模式。他们的欲望相互对抗，需要极大的理解和妥协。`;
    return `${a.name}和${b.name}的欲望互动是混合型的——既有互补也有冲突。这不是坏事——张力本身可以转化为深度连接的基础。`;
  }

  // ====================================================================
  // v1.2.0 新增内部方法
  // ====================================================================

  /**
   * 计算Liking得分 (Kringelbach & Berridge 2017)
   * Liking ≠ Wanting — 基于愉悦满足度、实际体验质量、饱足感
   */
  _computeLiking(desireKey, traits, wanting) {
    // 基础Liking（满足度基准）
    let baseLiking = 0.5;

    // 不同欲望类型的Liking影响因素
    switch (desireKey) {
      case 'survival':
        baseLiking = traits.drivenBySurvival ? 0.3 : 0.6; // 生存焦虑降低满足感
        break;
      case 'sexual':
        baseLiking = traits.drivenBySexual ? 0.5 : 0.6;
        break;
      case 'social':
        baseLiking = traits.drivenBySocial ? 0.6 : 0.5;
        break;
      case 'power':
        baseLiking = traits.drivenByPower ? 0.4 : 0.5; // 权力满足感往往低于渴求
        break;
      case 'achievement':
        baseLiking = traits.drivenByAchievement ? 0.5 : 0.6;
        break;
      case 'curiosity':
        baseLiking = 0.7; // 求知满足感通常较高
        break;
      case 'material':
        baseLiking = traits.drivenByMaterial ? 0.4 : 0.6; // 物欲满足感递减
        break;
      case 'freedom':
        baseLiking = traits.drivenByFreedom ? 0.6 : 0.5;
        break;
      case 'meaning':
        baseLiking = 0.7; // 意义欲满足感通常较高
        break;
      default:
        baseLiking = 0.5;
    }

    // 成瘾/冲动特质降低Liking
    if (traits.addictive) baseLiking -= 0.15;
    if (traits.impulsive) baseLiking -= 0.1;

    // 高Wanting伴随低Liking（成瘾核心机制）
    const wantingPenalty = wanting > 0.7 ? (wanting - 0.7) * 0.4 : 0;

    // 确保Liking在[0.1, 0.95]范围内，且通常Liking ≤ Wanting（成瘾情况下）
    return Math.max(0.1, Math.min(0.95, baseLiking - wantingPenalty));
  }

  /**
   * 描述Wanting-Liking关系
   */
  _describeWL(desireKey, wanting, liking, delta) {
    if (delta > 0.5) {
      return `强烈渴求(W=${Math.round(wanting*100)}%)但实际满足感极低(L=${Math.round(liking*100)}%)——典型的成瘾性分离。行为由自动化欲望驱动，而非真实的愉悦体验。`;
    }
    if (delta > 0.3) {
      return `欲望(W=${Math.round(wanting*100)}%)显著高于满足(L=${Math.round(liking*100)}%)。追求的乐趣大于拥有的乐趣——可能正在形成强迫性追求模式。`;
    }
    if (delta > 0.1) {
      return `轻度分离——想要(W=${Math.round(wanting*100)}%)的略多于喜欢(L=${Math.round(liking*100)}%)的。正常范围但值得关注。`;
    }
    return `健康一致——想要(W=${Math.round(wanting*100)}%)和喜欢(L=${Math.round(liking*100)}%)基本匹配。欲望驱动的行为能带来真实的满足。`;
  }

  /**
   * 为所有欲望类型计算Wanting-Liking
   */
  _computeWantingLikingForAll(person, desires) {
    const traits = this._extractDesireTraits(person);
    const wl = {};
    for (const [key, info] of Object.entries(DESIRE_TYPES)) {
      const wanting = desires[key]?.score || this._scoreDesire(key, traits);
      const liking = this._computeLiking(key, traits, wanting);
      wl[key] = {
        label: info.label,
        wanting: Math.round(wanting * 100) / 100,
        liking: Math.round(liking * 100) / 100,
        delta: Math.round((wanting - liking) * 100) / 100,
      };
    }
    return wl;
  }

  /**
   * 生成WL摘要
   */
  _generateWLSummary(person, wl) {
    const name = person.name || 'ta';
    const highDelta = Object.entries(wl).filter(([k, v]) => v.delta > 0.4);
    if (highDelta.length > 0) {
      return `${name}的Wanting-Liking分离显著：${highDelta.map(([k, v]) => `「${v.label}」Δ=${Math.round(v.delta*100)}%`).join('、')}。这些领域的欲望已部分脱离真实满足，进入自动化渴求模式。`;
    }
    return `${name}的欲望结构健康，Wanting与Liking基本一致。`;
  }

  /**
   * 计算Valence×Arousal象限分类
   */
  _classifyVAQuadrant(valence, arousal) {
    if (valence >= 0.5 && arousal >= 0.5) return '愉悦高唤醒 (Joyful-Active)';
    if (valence >= 0.5 && arousal < 0.5) return '愉悦低唤醒 (Content-Calm)';
    if (valence < 0.5 && arousal >= 0.5) return '不悦高唤醒 (Distressed-Angry)';
    return '不悦低唤醒 (Sad-Fatigued)';
  }

  /**
   * 从VA空间构建情感标签（Lindquist心理构建主义）
   */
  _constructEmotionsFromVA(valence, arousal, traits) {
    const constructs = [];

    // 基于VA坐标构建情感描述
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

    // 排序
    return constructs.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 描述VA状态
   */
  _describeVAState(valence, arousal) {
    if (valence > 0.6 && arousal > 0.6) return '处于积极高唤醒状态——充满能量和热情。';
    if (valence > 0.6 && arousal <= 0.6) return '处于积极低唤醒状态——平静满足，内心安宁。';
    if (valence <= 0.6 && valence > 0.3 && arousal > 0.6) return '处于混合高唤醒状态——有强烈情绪，但性质未完全确定。';
    if (valence <= 0.3 && arousal > 0.6) return '处于消极高唤醒状态——焦虑、愤怒或恐惧主导。';
    if (valence <= 0.3 && arousal <= 0.6) return '处于消极低唤醒状态——悲伤、倦怠或抑郁倾向。';
    return '处于情感中性状态。';
  }

  /**
   * 计算脑网络激活模式 (Lindquist 2012 / Rolls 2020)
   */
  _computeBrainNetworkActivation(emotions, traits) {
    const activation = {};
    const e = emotions;

    // VTA激活: 基于欲望(欲)得分 + 成就驱动
    activation.VTA = {
      node: BRAIN_NETWORK_NODES.VTA,
      activation: Math.min(1, (e.yu?.score || 0.5) * 0.8 + (traits.drivenByAchievement ? 0.2 : 0)),
      description: '多巴胺起始——奖励期望编码',
    };

    // NAc激活: 基于欲望强度
    activation.NAc = {
      node: BRAIN_NETWORK_NODES.NAc,
      activation: Math.min(1, (e.yu?.score || 0.5) * 0.7 + (e.xi?.score || 0.5) * 0.3),
      description: 'wanting信号放大——动机凸显',
    };

    // mOFC激活: 基于喜悦和爱（奖励评价）
    activation.mOFC = {
      node: BRAIN_NETWORK_NODES.mOFC,
      activation: Math.min(1, (e.xi?.score || 0.5) * 0.5 + (e.ai2?.score || 0.5) * 0.3),
      description: '内侧OFC——奖励价值编码（Rolls 2020 奖励系统）',
    };

    // lOFC激活: 基于厌恶和恐惧（非奖励/惩罚）
    activation.lOFC = {
      node: BRAIN_NETWORK_NODES.lOFC,
      activation: Math.min(1, (e.e?.score || 0.5) * 0.5 + (e.ju?.score || 0.5) * 0.3),
      description: '外侧OFC——非奖励/惩罚编码（Rolls 2020 非奖励系统）',
    };

    // Amygdala激活: 基于恐惧+愤怒+厌恶（威胁检测）
    activation.Amygdala = {
      node: BRAIN_NETWORK_NODES.Amygdala,
      activation: Math.min(1, (e.ju?.score || 0.5) * 0.5 + (e.nu?.score || 0.5) * 0.3 + (e.e?.score || 0.5) * 0.2),
      description: '情绪显著性——威胁/奖励检测',
    };

    // mPFC激活: 基于认知控制和情绪调节
    activation.mPFC = {
      node: BRAIN_NETWORK_NODES.mPFC,
      activation: traits.cautious ? 0.8 : 0.5,
      description: '价值整合·决策——自上而下控制',
    };

    // ACC激活: 冲突监测
    activation.ACC = {
      node: BRAIN_NETWORK_NODES.ACC,
      activation: Math.min(1, (e.ai?.score || 0.5) * 0.4 + (traits.cautious ? 0.2 : 0)),
      description: '冲突监测·错误检测——努力代价计算',
    };

    // Insula激活: 基于哀伤+厌恶（内感受）
    activation.Insula = {
      node: BRAIN_NETWORK_NODES.Insula,
      activation: Math.min(1, (e.ai?.score || 0.5) * 0.4 + (e.e?.score || 0.5) * 0.3),
      description: '内感受·意识——身体状态感知',
    };

    // 整体网络模式
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

  /**
   * 计算有效连接（基于默认权重和当前激活）
   */
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

  /**
   * 计算Valence×Arousal（从七情得分）
   */
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

  /**
   * 计算敏化增量 (Berridge & Robinson 2016)
   */
  _computeSensitizationIncrement(traits, desireType) {
    let increment = 0;
    if (traits.addictive) increment += 0.15;
    if (traits.impulsive) increment += 0.1;

    // 特定欲望类型的敏化倾向
    const sensitizationProne = ['sexual', 'material', 'power'];
    if (sensitizationProne.includes(desireType)) increment += 0.1;

    return Math.min(0.4, increment);
  }

  /**
   * 计算线索触发反应性
   */
  _computeCueReactivity(traits, desireType) {
    let reactivity = 0.3; // 基础反应性

    if (traits.addictive) reactivity += 0.2;
    if (traits.impulsive) reactivity += 0.15;

    // 高Wanting-low Liking增加线索反应性
    const wanting = this._scoreDesire(desireType, traits);
    const liking = this._computeLiking(desireType, traits, wanting);
    const delta = wanting - liking;
    if (delta > 0.3) reactivity += delta * 0.3;

    return Math.min(1.0, reactivity);
  }

  /**
   * 计算线索与欲望类型的关联度
   */
  _computeCueRelevance(cueText, desireKey) {
    // 线索关键词映射
    const cueKeywords = {
      survival: /食物|饥饿|水|安全|危险|威胁|贫困|贫穷|寒冷|炎热/,
      sexual: /性|色|诱惑|吸引|魅力|身体|吻|拥抱|亲密/,
      social: /朋友|聚会|社交|人群|孤独|认可|关注|点赞|评论/,
      power: /权力|地位|权威|领导|控制|胜利|赢|击败|晋升/,
      achievement: /目标|成就|突破|创造|作品|作品|精通|大师|冠军/,
      curiosity: /未知|新奇|探索|谜题|知识|学习|发现|秘密/,
      material: /金钱|财富|奢侈品|购物|购买|名牌|消费|价格/,
      freedom: /束缚|限制|规则|约束|自由|逃离|出走|流浪/,
      meaning: /意义|价值|使命|哲学|宗教|生命|宇宙|超越/,
    };

    const pattern = cueKeywords[desireKey];
    if (!pattern) return 0.3;

    if (pattern.test(cueText)) return 0.8;
    return 0.2;
  }

  /**
   * 生成线索触发分析文本
   */
  _generateCueAnalysis(person, cue, triggeredDesires, strongest) {
    const name = person.name || 'ta';
    const cueName = typeof cue === 'string' ? cue : cue.name || cue.description || '该线索';

    if (triggeredDesires.length === 0) {
      return `「${cueName}」未能触发${name}的显著欲望冲动。线索敏感性低，自我控制能力良好。`;
    }

    // strongest is now a normalized {key, label, urgeIntensity} object
    const strongestLabel = strongest.label;
    const strongestIntensity = Math.round(strongest.urgeIntensity * 100);

    return `「${cueName}」触发了${name}的${triggeredDesires.length}个欲望系统。最强冲动是「${strongestLabel}」(强度${strongestIntensity}%)。${
      strongestIntensity > 80 ? '这是非常强烈的线索触发反应，提示该线索已与欲望系统形成高度敏化的关联。' :
      strongestIntensity > 60 ? '线索触发反应明显，但尚未达到失控程度。' :
      '线索触发反应在正常范围内。'
    }`;
  }

  /**
   * 生成演化摘要
   */
  _generateEvolutionSummary(person, evolution) {
    const name = person.name || 'ta';
    const risingDesires = Object.entries(evolution)
      .filter(([k, v]) => v.trend === '上升')
      .map(([k, v]) => v.label);
    const fallingDesires = Object.entries(evolution)
      .filter(([k, v]) => v.trend === '下降')
      .map(([k, v]) => v.label);

    const parts = [`${name}的欲望演化推演（γ=${this.rpeParams.gamma}, α=${this.rpeParams.alpha}）：`];

    if (risingDesires.length > 0) {
      parts.push(`${risingDesires.join('、')}呈上升趋势——这些欲望在RPE反馈下持续增强。`);
    }
    if (fallingDesires.length > 0) {
      parts.push(`${fallingDesires.join('、')}呈下降趋势——这些欲望在RPE反馈下逐渐衰减。`);
    }
    if (risingDesires.length === 0 && fallingDesires.length === 0) {
      parts.push('所有欲望强度趋于稳定——RPE信号不足以驱动显著变化。');
    }

    return parts.join(' ');
  }

  // ====================================================================
  // v1.3.0 新增内部方法
  // ====================================================================

  /**
   * 从七情得分计算PADCN五维核心情感
   */
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

    // 确保在[-1, 1]范围
    for (const key of Object.keys(padcn)) {
      padcn[key] = Math.max(-1, Math.min(1, padcn[key]));
    }

    return padcn;
  }

  /**
   * 描述PADCN状态
   */
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

  /**
   * PADCN → 行为倾向映射 (emotion-system PADCN→Behavior Quick Map)
   */
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

  /**
   * 计算Dominance维度（基于EmoBank VAD体系）
   */
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

  /**
   * 评价13特征中的某一项
   */
  _scoreAppraisalFeature(eventText, traits, feature) {
    // 基于事件文本和人物特质，计算每个认知评价特征
    switch (feature) {
      case 'unexpectedness':
        // 意外程度：如果事件包含意外/突然等词汇则高
        if (/突然|意外|竟然|没想到|surprise|unexpected|sudden/i.test(eventText)) return 0.8;
        if (/正常|预期|日常|usual|normal|expected/i.test(eventText)) return 0.2;
        return 0.5;

      case 'goalRelevance':
        // 目标相关性：与人物特质的关联
        if (traits.drivenByAchievement && /成就|目标|成功|突破|challenge|goal/i.test(eventText)) return 0.9;
        if (traits.drivenBySocial && /朋友|关系|社交|love|friend|relationship/i.test(eventText)) return 0.9;
        if (traits.drivenByPower && /权力|地位|控制|power|status/i.test(eventText)) return 0.9;
        if (traits.drivenBySurvival && /危险|安全|生存|threat|danger/i.test(eventText)) return 0.9;
        return 0.4;

      case 'goalCongruence':
        // 目标一致性：是否促进目标
        if (/成功|胜利|获得|赢得|win|success|gain|achieve/i.test(eventText)) return 0.7;
        if (/失败|失去|错过|输|fail|lose|miss|loss/i.test(eventText)) return -0.6;
        return 0.1;

      case 'certainty':
        // 确定程度
        if (/确定|肯定|明确|clear|certain|definite/i.test(eventText)) return 0.8;
        if (/不确定|模糊|可能|也许|maybe|uncertain|unclear/i.test(eventText)) return 0.2;
        return 0.5;

      case 'copingPotential':
        // 应对潜力
        if (traits.resilient) return 0.8;
        if (traits.cautious) return 0.6;
        return 0.5;

      case 'agency':
        // 归因: -1=他人, 0=情境, +1=自我
        if (/我|自己|my|self|i\s/.test(eventText)) return 0.7;
        if (/他|她|他们|对方|他|she|he|they/.test(eventText)) return -0.5;
        return 0;

      case 'control':
        // 可控程度
        if (/控制|掌握|选择|决定|choose|control|decide/i.test(eventText)) return 0.8;
        if (/被迫|无奈|无法|cannot|forced|helpless/i.test(eventText)) return 0.2;
        return 0.5;

      case 'selfConsistency':
        // 与自我概念一致性
        if (traits.cautious && /冷静|理性|cautious|rational/i.test(eventText)) return 0.7;
        if (traits.direct && /直接|坦率|direct|frank/i.test(eventText)) return 0.7;
        return 0.3;

      case 'socialImpact':
        // 社会影响程度
        if (/大家|众人|社会|公众|everyone|public|social|community/i.test(eventText)) return 0.8;
        if (traits.drivenBySocial) return 0.6;
        return 0.3;

      case 'effort':
        // 需要付出的努力
        if (/努力|辛苦|艰难|困难|hard|difficult|effort|struggle/i.test(eventText)) return 0.8;
        if (/简单|轻松|easy|simple|effortless/i.test(eventText)) return 0.2;
        return 0.5;

      case 'attention':
        // 吸引注意的程度
        if (/关键|重要|紧急|紧急|urgent|critical|important|vital/i.test(eventText)) return 0.9;
        if (/琐事|无关|irrelevant|trivial|minor/i.test(eventText)) return 0.2;
        return 0.5;

      case 'novelty':
        // 新颖程度
        if (/全新|前所未有|首次|new|novel|first|unique|unprecedented/i.test(eventText)) return 0.9;
        if (/日常|重复|routine|repeated|daily/i.test(eventText)) return 0.1;
        return 0.4;

      case 'moralAcceptability':
        // 道德可接受性
        if (/公平|正义|道德|善良|fair|just|moral|righteous|kind/i.test(eventText)) return 0.8;
        if (/不公|邪恶|背叛|betray|unfair|evil|immoral|sin/i.test(eventText)) return -0.7;
        return 0.2;

      default:
        return 0;
    }
  }

  /**
   * 从13特征评价预测情绪
   */
  _predictEmotionsFromAppraisal(appraisal) {
    const scores = {};

    // 基于Scherer CPM的情绪触发模式
    // Joy/喜: 高goalCongruence + 高copingPotential + 中等control
    scores.xi = Math.max(0, (appraisal.goalCongruence > 0 ? appraisal.goalCongruence * 0.4 : 0) +
      appraisal.copingPotential * 0.3 +
      appraisal.control * 0.3);

    // Anger/怒: 低goalCongruence + 高agency(他人归因) + 高control
    scores.nu = Math.max(0, (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.3 : 0) +
      (appraisal.agency < 0 ? -appraisal.agency * 0.3 : 0) +
      appraisal.control * 0.2 +
      (1 - appraisal.moralAcceptability > 0.5 ? (1 - appraisal.moralAcceptability) * 0.2 : 0));

    // Sadness/哀: 低goalCongruence + 低copingPotential + 低control
    scores.ai = Math.max(0, (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.3 : 0) +
      (1 - appraisal.copingPotential) * 0.3 +
      (1 - appraisal.control) * 0.2 +
      (1 - appraisal.certainty) * 0.2);

    // Fear/惧: 低goalCongruence + 低copingPotential + 低control + 低certainty
    scores.ju = Math.max(0, (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.2 : 0) +
      (1 - appraisal.copingPotential) * 0.3 +
      (1 - appraisal.control) * 0.2 +
      (1 - appraisal.certainty) * 0.3);

    // Love/爱: 高goalCongruence + 高socialImpact + 高selfConsistency
    scores.ai2 = Math.max(0, (appraisal.goalCongruence > 0 ? appraisal.goalCongruence * 0.3 : 0) +
      appraisal.socialImpact * 0.3 +
      (appraisal.selfConsistency > 0 ? appraisal.selfConsistency * 0.2 : 0) +
      (appraisal.moralAcceptability > 0 ? appraisal.moralAcceptability * 0.2 : 0));

    // Disgust/恶: 低moralAcceptability + 低goalCongruence + 低selfConsistency
    scores.e = Math.max(0, (appraisal.moralAcceptability < 0 ? -appraisal.moralAcceptability * 0.4 : 0) +
      (appraisal.goalCongruence < 0 ? -appraisal.goalCongruence * 0.2 : 0) +
      (appraisal.selfConsistency < 0 ? -appraisal.selfConsistency * 0.2 : 0) +
      (1 - appraisal.novelty > 0.7 ? 0.2 : 0));

    // Desire/欲: 高goalRelevance + 高attention + 高novelty + 中等goalCongruence
    scores.yu = Math.max(0, appraisal.goalRelevance * 0.3 +
      appraisal.attention * 0.2 +
      appraisal.novelty * 0.2 +
      (1 - Math.abs(appraisal.goalCongruence)) * 0.3);

    // 归一化
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

  /**
   * 评价→PADCN映射 (基于emotion-system appraisal-engine.md)
   */
  _appraisalToPADCN(appraisal) {
    // ΔP = 0.3·goal_congruence + 0.2·self_consistency + 0.2·moral_acceptability + 0.1·coping_potential
    const deltaP = 0.3 * appraisal.goalCongruence +
      0.2 * appraisal.selfConsistency +
      0.2 * appraisal.moralAcceptability +
      0.1 * appraisal.copingPotential;

    // ΔA = 0.3·(1-certainty) + 0.2·novelty + 0.2·goalRelevance - 0.1·control
    const deltaA = 0.3 * (1 - appraisal.certainty) +
      0.2 * appraisal.novelty +
      0.2 * appraisal.goalRelevance -
      0.1 * appraisal.control;

    // ΔD = 0.3·control + 0.2·agency(取正部分) - 0.2·(1-copingPotential) + 0.1·certainty
    const deltaD = 0.3 * appraisal.control +
      0.2 * Math.max(0, appraisal.agency) -
      0.2 * (1 - appraisal.copingPotential) +
      0.1 * appraisal.certainty;

    // ΔC = 0.4·certainty + 0.2·(1-unexpectedness) - 0.2·novelty
    const deltaC = 0.4 * appraisal.certainty +
      0.2 * (1 - appraisal.unexpectedness) -
      0.2 * appraisal.novelty;

    // ΔN = 0.5·novelty + 0.2·unexpectedness - 0.2·control
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

  /**
   * 计算驱力水平 (基于人物特质)
   */
  _computeDriveLevel(driveKey, traits) {
    switch (driveKey) {
      case 'curiosity':
        return traits.curious ? 0.7 : (traits.drivenByAchievement ? 0.6 : 0.5);
      case 'competence':
        return traits.drivenByAchievement ? 0.7 : (traits.drivenBySurvival ? 0.4 : 0.5);
      case 'autonomy':
        return traits.drivenByFreedom ? 0.8 : (traits.drivenByPower ? 0.6 : 0.5);
      case 'social_bond':
        return traits.drivenBySocial ? 0.8 : (traits.silent ? 0.3 : 0.5);
      case 'coherence':
        return traits.cautious ? 0.7 : (traits.emotional ? 0.5 : 0.5);
      case 'novelty_seek':
        return traits.drivenByFreedom ? 0.7 : (traits.curious ? 0.7 : 0.4);
      case 'self_preservation':
        return traits.drivenBySurvival ? 0.8 : (traits.cautious ? 0.6 : 0.4);
      default:
        return 0.5;
    }
  }

  /**
   * 从驱力变化预测情绪 (emotion = f(drive_satisfaction_change))
   */
  _predictEmotionFromDriveChanges(drives) {
    const emotionScores = {};

    // 好奇心缺口 → 困惑/好奇
    emotionScores.ju = Math.max(0, (1 - drives.curiosity?.satisfaction || 0.5) * 0.3);
    emotionScores.yu = Math.max(0, (1 - drives.curiosity?.satisfaction || 0.5) * 0.3);

    // 胜任感缺口 → 挫败/愤怒
    emotionScores.nu = Math.max(0, (1 - drives.competence?.satisfaction || 0.5) * 0.3);
    emotionScores.ai = Math.max(0, (1 - drives.competence?.satisfaction || 0.5) * 0.2);

    // 自主性缺口 → 愤怒/反抗
    emotionScores.nu = Math.max(emotionScores.nu, (1 - drives.autonomy?.satisfaction || 0.5) * 0.3);

    // 社交纽带缺口 → 哀伤/恐惧
    emotionScores.ai = Math.max(emotionScores.ai, (1 - drives.social_bond?.satisfaction || 0.5) * 0.3);
    emotionScores.ju = Math.max(emotionScores.ju, (1 - drives.social_bond?.satisfaction || 0.5) * 0.2);

    // 一致性缺口 → 焦虑/恐惧
    emotionScores.ju = Math.max(emotionScores.ju, (1 - drives.coherence?.satisfaction || 0.5) * 0.4);

    // 新奇寻求缺口 → 厌倦/欲望
    emotionScores.yu = Math.max(emotionScores.yu, (1 - drives.novelty_seek?.satisfaction || 0.5) * 0.3);

    // 自我保护缺口 → 恐惧/愤怒
    emotionScores.ju = Math.max(emotionScores.ju, (1 - drives.self_preservation?.satisfaction || 0.5) * 0.3);
    emotionScores.nu = Math.max(emotionScores.nu, (1 - drives.self_preservation?.satisfaction || 0.5) * 0.2);

    // 归一化
    const maxScore = Math.max(...Object.values(emotionScores), 0.01);
    for (const key of Object.keys(emotionScores)) {
      emotionScores[key] = Math.round(Math.min(1, emotionScores[key] / maxScore) * 100) / 100;
    }

    const sorted = Object.entries(emotionScores).sort((a, b) => b[1] - a[1]);

    return {
      emotionScores,
      dominant: sorted[0] ? { key: sorted[0][0], label: SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0], score: sorted[0][1], cause: `由驱力缺口驱动` } : null,
      interpretation: sorted[0] ? `驱力缺口驱动的情绪: 「${SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0]}」(${Math.round(sorted[0][1]*100)}%)。核心公式: emotion = f(drive_satisfaction_change)。` : '驱力平衡，无明显情绪驱动。',
    };
  }

  /**
   * 生成驱力摘要
   */
  _generateDriveSummary(person, driveSat) {
    if (!driveSat) return '';
    const name = person.name || 'ta';
    const highGap = Object.entries(driveSat)
      .filter(([k, v]) => v.gap > 0.3)
      .map(([k, v]) => `「${v.label}」缺口${Math.round(v.gap*100)}%`);
    if (highGap.length > 0) {
      return `${name}的驱力缺口: ${highGap.join('、')}。这些缺口驱动情绪波动和行为补偿。`;
    }
    return `${name}的驱力基本平衡，满意度良好。`;
  }

  /**
   * 计算驱力满意度（基于欲望分析）
   */
  _computeDriveSatisfactionForDesires(person, desires) {
    const traits = this._extractDesireTraits(person);
    const driveSat = {};

    for (const [key, info] of Object.entries(DRIVE_TYPES)) {
      const level = this._computeDriveLevel(key, traits);
      const target = info.target;
      const satisfaction = target > 0 ? Math.min(1.0, level / target) : 0.5;
      const gap = Math.max(0, target - level);
      driveSat[key] = {
        label: info.label,
        description: info.description,
        level: Math.round(level * 100) / 100,
        target: Math.round(target * 100) / 100,
        satisfaction: Math.round(satisfaction * 100) / 100,
        gap: Math.round(gap * 100) / 100,
      };
    }

    return driveSat;
  }

  /**
   * 描述策略画像
   */
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

  /**
   * 分类关系类型 (基于社交模型)
   */
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

  /**
   * 预测社交情绪 (基于社交模型)
   */
  _predictSocialEmotion(socialModel, selfTraits) {
    const { trust, warmth, threat, dependencyPull } = socialModel;
    const scores = {};

    // 高信任+高温暖 → 爱/喜
    if (trust > 0.6 && warmth > 0.6) {
      scores.ai2 = Math.min(1, (trust + warmth) / 2);
      scores.xi = Math.min(1, warmth);
    }
    // 高威胁 → 惧
    if (threat > 0.4) {
      scores.ju = threat;
    }
    // 低信任+高依赖 → 焦虑（惧+欲）
    if (trust < 0.3 && dependencyPull > 0.5) {
      scores.ju = Math.max(scores.ju || 0, dependencyPull * 0.6);
      scores.yu = Math.max(scores.yu || 0, dependencyPull * 0.5);
    }
    // 高依赖+低温暖 → 哀
    if (dependencyPull > 0.5 && warmth < 0.4) {
      scores.ai = Math.max(scores.ai || 0, dependencyPull * 0.4);
    }
    // 低温暖+低信任 → 恶
    if (warmth < 0.3 && trust < 0.3) {
      scores.e = Math.max(scores.e || 0, (1 - warmth) * 0.3);
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return {
      scores,
      dominant: sorted[0] ? { key: sorted[0][0], label: SEVEN_EMOTIONS[sorted[0][0]]?.label || sorted[0][0], score: sorted[0][1] } : null,
    };
  }

  /**
   * 从文本中提取情绪特征 (COSMIC风格)
   */
  _extractEmotionFromText(text) {
    const scores = {};

    // 基于关键词的情绪检测
    if (/开心|高兴|快乐|喜悦|幸福|满足|joy|happy|glad|delight|wonderful|great|amazing|love|😊|😄|😁|🥰/.test(text)) scores.xi = 0.7;
    if (/愤怒|生气|恼怒|恼火|angry|mad|furious|outraged|annoyed|frustrated|😡|🤬/.test(text)) scores.nu = 0.7;
    if (/悲伤|难过|伤心|哀伤|失落|沮丧|sad|sorrow|grief|depressed|down|cry|😢|😭|💔/.test(text)) scores.ai = 0.7;
    if (/恐惧|害怕|焦虑|担忧|紧张|担心|scared|afraid|anxious|worried|nervous|terrified|😨|😰|😱/.test(text)) scores.ju = 0.7;
    if (/爱|关爱|温暖|珍惜|love|care|cherish|adore|affection|dear|❤️|💕|💗/.test(text)) scores.ai2 = 0.7;
    if (/厌恶|恶心|反感|憎恶|disgust|gross|repulsive|awful|terrible|hate|🤢|🤮/.test(text)) scores.e = 0.7;
    if (/想要|渴望|期待|希望|want|desire|wish|hope|eager|longing|crave/.test(text)) scores.yu = 0.6;

    // 默认分数
    for (const key of Object.keys(SEVEN_EMOTIONS)) {
      if (scores[key] === undefined) scores[key] = 0.1;
    }

    return scores;
  }

  /**
   * 常识原因推理 (COSMIC核心)
   */
  _inferCommonsenseCauses(text, emotionScores) {
    const causes = [];

    // 基于文本推理情绪原因
    if (/因为|由于|because|since|due to|after/.test(text)) {
      const causeMatch = text.match(/(?:因为|由于|because|since)([^。，.!?;；]+)/);
      if (causeMatch) {
        causes.push({ type: '直接原因', description: causeMatch[1].trim(), confidence: 0.8 });
      }
    }

    // 基于情绪类型推理常见原因
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

  /**
   * 计算上下文情绪偏移
   */
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

  /**
   * 分析情绪轨迹
   */
  _analyzeEmotionTrajectory(utteranceEmotions) {
    if (utteranceEmotions.length <= 1) {
      return { pattern: '单轮对话，无轨迹可分析', trend: '稳定' };
    }

    const valences = utteranceEmotions.map(u => u.valence);
    const arousals = utteranceEmotions.map(u => u.arousal);

    // 趋势分析
    const valenceTrend = valences[valences.length - 1] - valences[0];
    const arousalTrend = arousals[arousals.length - 1] - arousals[0];

    // 波动程度
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

  /**
   * 评估COSMIC维度
   */
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

  /**
   * 找到Ekman映射
   */
  _findEkmanMapping(ekmanKey) {
    // 直接匹配
    if (EKMAN_TO_CHINESE[ekmanKey]) return EKMAN_TO_CHINESE[ekmanKey];

    // 模糊匹配
    for (const [key, mapping] of Object.entries(EKMAN_TO_CHINESE)) {
      if (ekmanKey.includes(key) || key.includes(ekmanKey)) return mapping;
    }

    // 扩展映射
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

  /**
   * 评估HeartBench维度
   */
  _scoreHeartBenchDimension(dimension, traits, emotions) {
    switch (dimension) {
      case 'verbalExpression':
        // 语言表达：基于直接/外向特质
        return traits.direct ? 0.7 : (traits.silent ? 0.3 : 0.5);

      case 'curiosity':
        // 好奇心：基于curiosity特质和求知欲得分
        return traits.curious ? 0.8 : (traits.drivenByAchievement ? 0.6 : 0.4);

      case 'warmth':
        // 温暖感：基于社交特质和情感特质
        return traits.drivenBySocial ? 0.8 : (traits.emotional ? 0.7 : 0.4);

      case 'firstPersonUsage':
        // 第一人称使用
        return traits.direct ? 0.7 : (traits.silent ? 0.4 : 0.6);

      case 'autonomy':
        // 自主性
        return traits.drivenByFreedom ? 0.8 : (traits.drivenByPower ? 0.7 : 0.5);

      case 'humor':
        // 幽默感
        return traits.direct ? 0.6 : (traits.silent ? 0.3 : 0.4);

      case 'selfAwareness':
        // 自我觉察
        return traits.cautious ? 0.7 : (traits.emotional ? 0.6 : 0.4);

      case 'emotionalCoping':
        // 情绪应对
        return traits.resilient ? 0.8 : (traits.cautious ? 0.6 : 0.4);

      case 'emotionalUnderstanding':
        // 情绪理解
        return traits.emotional ? 0.8 : (traits.drivenBySocial ? 0.7 : 0.5);

      case 'emotionalPerception':
        // 情绪感知
        return traits.emotional ? 0.8 : (traits.drivenBySocial ? 0.6 : 0.5);

      case 'emotionalReaction':
        // 情绪反应
        return traits.emotional ? 0.8 : (traits.direct ? 0.7 : 0.4);

      case 'socialProactivity':
        // 社交主动性
        return traits.drivenBySocial ? 0.8 : (traits.direct ? 0.6 : 0.3);

      case 'relationshipBuilding':
        // 关系构建
        return traits.drivenBySocial ? 0.8 : (traits.emotional ? 0.6 : 0.4);

      case 'motivationClarity':
        // 动机清晰度
        return traits.drivenByAchievement ? 0.8 : (traits.drivenByPower ? 0.7 : 0.5);

      case 'moralReasoning':
        // 道德推理
        return traits.cautious ? 0.7 : (traits.drivenBySocial ? 0.6 : 0.5);

      default:
        return 0.5;
    }
  }
}

module.exports = { DesireCognition };
