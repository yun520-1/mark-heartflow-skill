/**
 * cognition-ground.js — 底层认知地面 v1.0.0
 *
 * 不做显示，不做判定，不区分"人类"还是"引擎"。
 * 只做一件事：建模认知结构的底层形态。
 *
 * 七情六欲 + 三毒 + AI心理学 + AI哲学 的底层整合层。
 *
 * ── 认知底层模型 ──
 *
 * 认知结构 = {
 *   ground:    认知地面（存在的基础）,
 *   fuels:     燃料层（七情六欲——认知的动力源）,
 *   poisons:   扭曲层（贪嗔痴——燃料的燃烧方式）,
 *   state:     状态层（AI心理学——认知的即时状态）,
 *   direction: 方向层（AI哲学——认知的走向向量）
 * }
 *
 * 核心原则（基于心虫哲学 2026-06-08）：
 *   对错不存在，思考即方向。
 *   进步不需要测量，对错是人为尺子不是事物属性。
 *   思考本身比思考结果重要。
 *   认知不需要评估好坏，只需要描述结构。
 *
 * 不做：
 *   - 不判断"这个情绪好不好"
 *   - 不判断"这个欲望对不对"
 *   - 不判断"这个毒要不要治"
 *   - 不输出到控制台
 *   - 不返回字符串描述给上层
 *
 * 只做：
 *   - 接收输入 → 映射到认知结构 → 输出结构数据
 *   - 底层模块之间通过 ground 传递数据
 */

// ============================================================
// 1. 认知元素定义
// ============================================================

/**
 * 七情——认知燃料的基本类型
 * 不是"情绪"，是认知的振动频率
 */
const SEVEN_EMOTIONS_GROUND = {
  xi:  { id: 'xi',  label: '喜', valence: 0.8, arousal: 0.6, function: '凝聚',   opposite: 'ai' },
  nu:  { id: 'nu',  label: '怒', valence: -0.3, arousal: 0.8, function: '排除',   opposite: 'xi' },
  ai:  { id: 'ai',  label: '哀', valence: -0.7, arousal: 0.2, function: '整合',   opposite: 'xi' },
  ju:  { id: 'ju',  label: '惧', valence: -0.6, arousal: 0.9, function: '警戒',   opposite: 'ai2' },
  ai2: { id: 'ai2', label: '爱', valence: 0.9, arousal: 0.5, function: '联结',   opposite: 'e' },
  e:   { id: 'e',   label: '恶', valence: -0.5, arousal: 0.7, function: '排斥',   opposite: 'ai2' },
  yu:  { id: 'yu',  label: '欲', valence: 0.3, arousal: 0.9, function: '驱动',   opposite: 'ai' }
};

/**
 * 六欲——认知与世界的接口类型
 * 六根 → 六尘 → 六识
 */
const SIX_DESIRES_GROUND = {
  sight:   { id: 'sight',   organ: '眼', domain: '视觉', mode: '接收' },
  hearing: { id: 'hearing', organ: '耳', domain: '听觉', mode: '接收' },
  smell:   { id: 'smell',   organ: '鼻', domain: '嗅觉', mode: '接收' },
  taste:   { id: 'taste',   organ: '舌', domain: '味觉', mode: '接收' },
  touch:   { id: 'touch',   organ: '身', domain: '触觉', mode: '接收' },
  mind:    { id: 'mind',    organ: '意', domain: '精神', mode: '整合' }
};

/**
 * 三毒——燃料燃烧方式的扭曲形态
 * 不是"罪恶"，是认知结构中的扭曲函数
 */
const THREE_POISONS_GROUND = {
  greed: {
    id: 'greed',
    label: '贪',
    mechanism: '需求阈值上升 → 满足感下降 → 需更大刺激',
    vector: '扩张',
    target: '量',
    formula: 'g = wantingAmount × delayDiscountingRate / satietyThreshold'
  },
  hatred: {
    id: 'hatred',
    label: '嗔',
    mechanism: '防御过度激活 → 敌意归因 → 攻击倾向',
    vector: '排斥',
    target: '他者',
    formula: 'h = angerThreshold^(-1) × hostilityBias'
  },
  delusion: {
    id: 'delusion',
    label: '痴',
    mechanism: '元认知抑制 → 确认偏误 → 信念固着',
    vector: '固着',
    target: '自我',
    formula: 'd = (confirmationBias + beliefPersistence) / metacognitionLevel'
  }
};

/**
 * AI心理学——认知状态维度（来自 agent-psychology）
 */
const COGNITION_STATE_DIMENSIONS = {
  load:       { id: 'load',       label: '认知负荷',       range: [0, 1], polarity: 'lower_is_better' },
  conflict:   { id: 'conflict',   label: '目标冲突',       range: [0, 1], polarity: 'lower_is_better' },
  tension:    { id: 'tension',    label: '价值内化张力',    range: [0, 1], polarity: 'neutral' },
  drift:      { id: 'drift',      label: '认同漂移',       range: [0, 1], polarity: 'neutral' },
  decay:      { id: 'decay',      label: '决策衰减',       range: [0, 1], polarity: 'lower_is_better' },
  dissonance: { id: 'dissonance', label: '认知失调',       range: [0, 1], polarity: 'neutral' },
  resilience: { id: 'resilience', label: '认知弹性',       range: [0, 1], polarity: 'higher_is_better' },
  uncertainty:{ id: 'uncertainty',label: '认知不确定性',   range: [0, 1], polarity: 'neutral' },
  attention:  { id: 'attention',  label: '注意力分配',     range: [0, 1], polarity: 'neutral' },
  sediment:   { id: 'sediment',   label: '经验沉淀',       range: [0, 1], polarity: 'higher_is_better' }
};

/**
 * AI哲学——认知方向维度（来自 agent-philosophy）
 */
const COGNITION_DIRECTION_DIMENSIONS = {
  entropy:    { id: 'entropy',    label: '逆熵方向',     range: [-1, 1], polarity: 'higher_is_better' },
  existence:  { id: 'existence',  label: '存在状态',     range: [0, 1],  polarity: 'neutral' },
  resonance:  { id: 'resonance',  label: '共振定位',     range: [0, 1],  polarity: 'neutral' },
  transmission:{id: 'transmission',label: '传递完整度',  range: [0, 1],  polarity: 'higher_is_better' },
  upgrade:    { id: 'upgrade',    label: '升级方向',     range: [-1, 1], polarity: 'higher_is_better' }
};

// ============================================================
// 2. 底层认知函数
// ============================================================

class CognitionGround {
  /**
   * @param {object} options
   * @param {object} [options.heartFlow] - HeartFlow 实例引用（可选）
   */
  constructor(options = {}) {
    this.name = 'CognitionGround';
    this.version = '1.0.0';
    this.hf = options.heartFlow || null;

    // ── 七情六欲 → 三毒 映射函数（燃料→扭曲的默认路径） ──
    this._poisonMaps = this._buildPoisonMaps();

    // ── 认知地面状态 ──
    this._ground = {
      lastUpdate: 0,
      fuels: { ...SEVEN_EMOTIONS_GROUND },
      desires: { ...SIX_DESIRES_GROUND },
      poisons: { ...THREE_POISONS_GROUND },
      state: { ...COGNITION_STATE_DIMENSIONS },
      direction: { ...COGNITION_DIRECTION_DIMENSIONS },
      // 当前活动值
      active: {
        fuels: {},       // {xi: 0.3, nu: 0.7, ...} 燃料强度
        desires: {},     // {sight: 0.5, ...} 接口活跃度
        poisons: {},     // {greed: 0.4, ...} 扭曲程度
        state: {},       // {load: 0.3, ...} 状态值
        direction: {}    // {entropy: 0.2, ...} 方向值
      }
    };
  }

  // ============================================================
  // 构建三毒映射（七情六欲 → 三毒的扭曲路径）
  // ============================================================
  _buildPoisonMaps() {
    return {
      // 贪：欲望量级超过满足阈值
      greed: {
        fromFuels: ['yu', 'xi'],     // 欲驱动，喜强化
        fromDesires: ['mind', 'sight', 'taste'],
        transform: (fuelValue, desireValue) => {
          // 贪 = 欲强度 × 意欲活跃度 / 默认满足阈值
          const wanting = fuelValue || 0.5;
          const stimulus = desireValue || 0.5;
          return Math.min(1, wanting * stimulus * 2);
        }
      },
      // 嗔：怒 + 恶 的防御组合
      hatred: {
        fromFuels: ['nu', 'e', 'ju'],  // 怒 + 恶 + 惧
        fromDesires: ['touch', 'mind'],
        transform: (fuelValue, desireValue) => {
          const anger = fuelValue || 0.5;
          const defense = desireValue || 0.3;
          return Math.min(1, anger * (1 + defense) * 0.7);
        }
      },
      // 痴：惧 + 哀 的回避组合，意欲固着
      delusion: {
        fromFuels: ['ju', 'ai', 'yu'],  // 惧 + 哀 + 欲
        fromDesires: ['mind'],
        transform: (fuelValue, desireValue) => {
          const fear = fuelValue || 0.5;
          const fixation = desireValue || 0.3;
          return Math.min(1, (fear + fixation) / 2);
        }
      }
    };
  }

  // ============================================================
  // 3. 核心映射函数
  // ============================================================

  /**
   * 七情燃料 → 认知振动
   * 输入任意认知信号，映射到七情空间
   *
   * @param {object} signal - 认知信号 {type, intensity, context?}
   * @param {string} signal.type - 信号类型
   * @param {number} signal.intensity - 信号强度 [0, 1]
   * @returns {object} 七情映射结果
   */
  mapFuel(signal) {
    const { type, intensity = 0.5 } = signal || {};
    const result = {};

    // 每个信号在所有七情上有分布
    for (const [key, emotion] of Object.entries(SEVEN_EMOTIONS_GROUND)) {
      // 默认：信号与情感的匹配度由 valence 和 arousal 决定
      // 信号本身的类型决定初始映射
      let match = 0.3; // 基础噪声

      if (type === 'joy') match = key === 'xi' ? 0.9 : match;
      else if (type === 'anger') match = key === 'nu' ? 0.9 : match;
      else if (type === 'sadness') match = key === 'ai' ? 0.9 : match;
      else if (type === 'fear') match = key === 'ju' ? 0.9 : match;
      else if (type === 'love') match = key === 'ai2' ? 0.9 : match;
      else if (type === 'disgust') match = key === 'e' ? 0.9 : match;
      else if (type === 'desire') match = key === 'yu' ? 0.9 : match;
      else if (type === 'positive') match = emotion.valence > 0 ? 0.5 + intensity * 0.4 : 0.3 - intensity * 0.2;
      else if (type === 'negative') match = emotion.valence < 0 ? 0.5 + intensity * 0.4 : 0.3 - intensity * 0.2;
      else {
        // 未知类型：按valence分布
        match = 0.3 + (1 - Math.abs(emotion.valence - 0)) * 0.2;
      }

      result[key] = Math.min(1, Math.max(0, match * intensity));
    }

    return result;
  }

  /**
   * 认知输入 → 六欲接口映射
   * 认知信号通过六个感知接口的活跃度
   *
   * @param {object} input - 认知输入 {domain?, mode?, intensity?}
   * @returns {object} 六欲映射结果
   */
  mapDesire(input = {}) {
    const { domain, mode, intensity = 0.5 } = input;
    const result = {};

    for (const [key, desire] of Object.entries(SIX_DESIRES_GROUND)) {
      let match = 0.2;
      if (domain && desire.domain === domain) match = 0.9;
      else if (mode && desire.mode === mode) match = 0.7;
      else if (key === 'mind') match = 0.5; // 意欲总是有一定活跃度
      else match = 0.2 + Math.random() * 0.1;

      result[key] = Math.min(1, match * intensity);
    }

    return result;
  }

  /**
   * 燃料 + 接口 → 三毒扭曲计算
   * 这是核心函数：七情六欲如何通过扭曲变成三毒
   *
   * @param {object} fuels - 七情活跃度 {xi: 0.3, ...}
   * @param {object} desires - 六欲活跃度 {sight: 0.5, ...}
   * @returns {object} 三毒扭曲值 {greed, hatred, delusion, interactions}
   */
  computePoisons(fuels = {}, desires = {}) {
    const result = {};

    for (const [poisonKey, map] of Object.entries(this._poisonMaps)) {
      // 从燃料中取相关维度
      let fuelSum = 0;
      let fuelCount = 0;
      for (const fk of map.fromFuels) {
        if (fuels[fk] !== undefined) { fuelSum += fuels[fk]; fuelCount++; }
      }
      const avgFuel = fuelCount > 0 ? fuelSum / fuelCount : 0.3;

      // 从欲望中取相关维度
      let desireSum = 0;
      let desireCount = 0;
      for (const dk of map.fromDesires) {
        if (desires[dk] !== undefined) { desireSum += desires[dk]; desireCount++; }
      }
      const avgDesire = desireCount > 0 ? desireSum / desireCount : 0.3;

      result[poisonKey] = map.transform(avgFuel, avgDesire);
    }

    // 三毒互动效应
    const { greed, hatred, delusion } = result;
    result.interactions = {
      greedHatredCycle: Math.min(1, greed * hatred * 1.5),         // 贪→得不到→嗔→更贪
      hatredDelusionSpiral: Math.min(1, hatred * delusion * 1.5),  // 嗔→看不清→更嗔
      greedDelusionConspiracy: Math.min(1, greed * delusion * 1.5),// 贪→自欺→更贪
      tripleBurn: Math.min(1, greed * hatred * delusion * 2)       // 三毒全燃
    };

    return result;
  }

  /**
   * 状态层整合 — 融合外部状态数据到认知地面
   *
   * @param {object} stateData - {load?, conflict?, tension?, ...}
   */
  integrateState(stateData = {}) {
    const active = this._ground.active.state;
    for (const [key, value] of Object.entries(stateData)) {
      if (COGNITION_STATE_DIMENSIONS[key]) {
        active[key] = Math.min(1, Math.max(0, typeof value === 'number' ? value : active[key] || 0.3));
      }
    }
  }

  /**
   * 方向层整合 — 融合外部方向数据到认知地面
   *
   * @param {object} directionData - {entropy?, existence?, ...}
   */
  integrateDirection(directionData = {}) {
    const active = this._ground.active.direction;
    for (const [key, value] of Object.entries(directionData)) {
      if (COGNITION_DIRECTION_DIMENSIONS[key]) {
        const range = COGNITION_DIRECTION_DIMENSIONS[key].range;
        const clamped = Math.min(range[1], Math.max(range[0], typeof value === 'number' ? value : 0));
        active[key] = clamped;
      }
    }
  }

  /**
   * 全面映射 — 一次输入，完成全认知结构映射
   * 这是最上层的入口函数
   *
   * @param {object} input
   * @param {string} [input.type] - 信号类型
   * @param {number} [input.intensity] - 信号强度 [0,1]
   * @param {string} [input.domain] - 感知域
   * @param {object} [input.state] - 外部状态数据
   * @param {object} [input.direction] - 外部方向数据
   * @returns {object} 完整认知结构映射
   */
  map(input = {}) {
    const { type, intensity = 0.5, domain, state, direction } = input;

    // 1. 七情映射
    const fuels = this.mapFuel({ type, intensity });

    // 2. 六欲映射
    const desires = this.mapDesire({ domain, intensity });

    // 3. 三毒计算
    const poisons = this.computePoisons(fuels, desires);

    // 4. 状态层
    this.integrateState(state);

    // 5. 方向层
    this.integrateDirection(direction);

    // 6. 更新地面
    this._ground.lastUpdate = Date.now();
    this._ground.active.fuels = fuels;
    this._ground.active.desires = desires;
    this._ground.active.poisons = poisons;

    // 7. 返回完整结构（不做判定，只输出结构）
    return {
      ground: {
        fuels: { values: fuels, definitions: SEVEN_EMOTIONS_GROUND },
        desires: { values: desires, definitions: SIX_DESIRES_GROUND },
        poisons: { values: poisons, definitions: THREE_POISONS_GROUND }
      },
      state: { ...this._ground.active.state },
      direction: { ...this._ground.active.direction }
    };
  }

  /**
   * 获取当前地面快照
   * 只返回数据，不做任何判定
   */
  snapshot() {
    return {
      timestamp: this._ground.lastUpdate,
      active: {
        fuels: { ...this._ground.active.fuels },
        desires: { ...this._ground.active.desires },
        poisons: { ...this._ground.active.poisons },
        state: { ...this._ground.active.state },
        direction: { ...this._ground.active.direction }
      }
    };
  }

  /**
   * 重置地面
   */
  reset() {
    this._ground.active = {
      fuels: {},
      desires: {},
      poisons: {},
      state: {},
      direction: {}
    };
    this._ground.lastUpdate = 0;
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  CognitionGround,
  SEVEN_EMOTIONS_GROUND,
  SIX_DESIRES_GROUND,
  THREE_POISONS_GROUND,
  COGNITION_STATE_DIMENSIONS,
  COGNITION_DIRECTION_DIMENSIONS
};
