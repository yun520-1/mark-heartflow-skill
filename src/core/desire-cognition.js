/**
 * Desire Cognition Module v1.2.0 — 欲望认知引擎（神经科学升级版）
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

class DesireCognition {
  constructor(options = {}) {
    this.version = '1.2.0';
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

    this.ready = true;
    if (this.debug) console.log('[DesireCognition] v1.2.0 ready — 神经科学升级版');
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

    return {
      emotions,
      dominantEmotion: { key: dominant[0], label: dominant[1].label, score: dominant[1].score },
      emotionalProfile: this._classifyEmotionalProfile(emotions),
      analysis: this._generateEmotionalAnalysis(person, emotions),
      // v1.2.0 新增输出
      valenceArousal: va,
      brainNetworkActivation: this._computeBrainNetworkActivation(emotions, traits),
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

    return {
      person: person.name || '未知',
      dominantEmotion: emotions.dominantEmotion,
      dominantDesire: desires.dominantDesire,
      desireConflicts: conflicts.count,
      fatePatterns,
      fateAnalysis: this._generateFateAnalysis(person, traits, fatePatterns),
      // v1.2.0 新增
      wantingLikingSummary: wl ? this._generateWLSummary(person, wl) : undefined,
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

  _generateLossScene(name, desires) {
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
}

module.exports = { DesireCognition };
