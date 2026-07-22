// [v6.0.71] 从 desire-cognition.js 提取常量定义（零副作用）
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




module.exports = {
  SEVEN_EMOTIONS,
  SIX_DESIRES,
  EVOLUTIONARY_MOTIVES,
  DESIRE_TYPES,
  VALENCE_AROUSAL_MAP,
  BRAIN_NETWORK_NODES,
  DEFAULT_NETWORK_WEIGHTS,
  PADCN_DIMENSIONS,
  PADCN_MAP,
  DRIVE_TYPES,
  PERSONALITY_PRESETS,
  EMOTION_POLICY_MAP,
  EKMAN_TO_CHINESE,
  CHINESE_SPECIFIC_EMOTIONS,
  HEARTBENCH_DIMENSIONS,
  COSMIC_CONTEXT_DIMENSIONS,
};
