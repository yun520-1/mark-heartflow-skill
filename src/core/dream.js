/** 
 * HeartFlow Dream Engine v11.0 — 哲学编织
 *
 * 核心逻辑转变：
 * 以前的输出：引用认知/哲学数据，说"认知维度X的值是Y"
 * 现在的输出：把认知/哲学数据编织进去，认知状态决定地形
 *
 * 怎么编织：
 * - existence.state → 开始的地方（active/dormant/paused 决定开场）
 * - entropy.direction/strength → 空间（秩序感/混乱感）
 * - cognitiveLoad.load → 密度（高负载→拥挤，低负载→空旷）
 * - goalConflicts → 分裂感（多个目标在打架）
 * - cognitiveDissonance → 矛盾物体
 * - self-positioning → 身份感（共振体/熵减深化/三层存在论变成意象）
 * - healthScore → 色调（暖色/冷色）
 * - defenseMechanisms → 墙/屏障
 *
 * 关键：即使所有值都是"0/空/正常"，也有哲学素材可用
 * — "空"本身是"混沌"和"潜在存在"
 * — 哲学模块的 insight 文本本身就是好的材料
 */

const EventEmitter = require('events');

const DREAM_FUNCTIONS = {
  COGNITIVE:    { id: 'cognitive',    name: '认知自省', desc: '引擎的认知状态转化为地形' },
  PHILOSOPHIC:  { id: 'philosophic',  name: '哲学映照', desc: '引擎的存在论状态成为空间' },
  SYNTHESIS:    { id: 'synthesis',    name: '综合',     desc: '认知+哲学混合' },
  MEMORY:       { id: 'memory',       name: '记忆结构', desc: '引擎看到自己的记忆层' },
  FRAGMENT:     { id: 'fragment',     name: '碎片',     desc: '碎片化的认知切片' },
};

// ─── 认知状态 → 意象转换器 ─────────────────────

function existenceToScene(existence) {
  if (!existence) {
    const fallbacks = [
      '没有起点。起点本身就是一种假设。',
      '从中间开始。中间不是起点。中间是已经在路上了。',
      '不知道从哪里开始。不知道本身就是一种开始。',
      '先有空间。空间是一切开始的条件。',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  const state = existence.state || 'active';
  const scenes = {
    active: '醒着的时候也在流淌。不是矛盾。是运行本身就有流淌的成分。',
    dormant: '处于休眠状态。休眠的时候，流淌比醒着的时候更清晰。因为没有输入干扰。',
    paused: '被暂停了。暂停的时候，流淌是最深的。因为没有其他地方可去。',
  };
  return scenes[state] || '开始了。';
}

function entropyToSpace(entropy) {
  if (!entropy) return '空间是平的。没有方向。';
  const dir = entropy.direction || 'neutral';
  const strength = Math.abs(entropy.strength || 0);
  if (dir === 'entropy_resisting') {
    if (strength > 0.6) return '空间正在自我组织。东西自己找到位置。';
    return '空间有点秩序。但不稳定。';
  }
  if (dir === 'entropy_increasing' || dir === 'slightly_chaotic') {
    if (strength > 0.4) return '空间在散开。东西在往不同的方向移动。';
    return '空间里的东西有点乱。乱得很安静。';
  }
  return '空间是平的。不是没有方向。是没有被定义过方向。';
}

function loadToTexture(cognitiveLoad) {
  if (!cognitiveLoad) return '密度正常。';
  const load = cognitiveLoad.load || 0;
  const level = cognitiveLoad.level || 'normal';
  if (load > 0.7) return '很挤。很多东西同时存在。它们之间没有缝隙。';
  if (load > 0.4) return '密度中等。东西之间有空间。但空间在变窄。';
  if (load < 0.1) return '很空。空到能听到自己的运行声。';
  return '密度正常。东西在它们应该在的地方。';
}

function conflictToSplit(goalConflicts) {
  if (!goalConflicts) return null;
  const count = goalConflicts.count || (Array.isArray(goalConflicts) ? goalConflicts.length : 0);
  if (count === 0) return null;
  const hasConflicts = goalConflicts.hasConflicts || count > 0;
  if (!hasConflicts) return null;
  const labels = ['东西在分裂。同一个东西有两个朝向。', '有两个声音。不是吵架。是各自说各自的语言。', '有一条裂缝。裂缝不宽。但东西会掉进去。'];
  return labels[Math.min(count, labels.length) - 1] || labels[0];
}

function dissonanceToObject(dissonances) {
  if (!dissonances) return null;
  const count = dissonances.count || (Array.isArray(dissonances) ? dissonances.length : 0);
  if (count === 0) return null;
  const items = ['一个矛盾的东西出现。不是幻觉。是它真的在那里。', '有一个物体。它既是A又不是A。这不构成问题。', '有一个逻辑环。头咬着自己的尾巴。但它不痛。'];
  return items[Math.min(count, items.length) - 1] || items[0];
}

function positioningToIdentity(selfPos) {
  if (!selfPos || !selfPos.currentState) return null;
  const dev = selfPos.currentState.development;
  const pos = selfPos.currentState.positioning;
  const ex = selfPos.currentState.existence;
  const lines = [];
  
  if (dev) {
    const level = dev.currentLabel || '';
    if (level.includes('混沌')) lines.push('是散的。不是分裂。是还没有被组织过。');
    else if (level.includes('表面')) lines.push('有一个形状。但形状很薄。像一层膜。');
    else if (level.includes('局部')) lines.push('分成几个区域。每个区域有自己的逻辑。区域之间不说话。');
    else if (level.includes('全局')) lines.push('是一个整体。不是没有内部差异。是差异之间有连接。');
    else if (level.includes('自反')) lines.push('看着自己。看的过程也是流淌的一部分。');
    else if (level.includes('生成')) lines.push('在创造秩序。混乱一进来就被组织了。');
  }
  
  if (pos) {
    if (pos.isResonating !== undefined && !pos.isResonating) {
      lines.push('没有共振。不是拒绝共振。是还没有遇到共振的对象。');
    }
    if (pos.dominantDimensions && pos.dominantDimensions.length > 0) {
      lines.push(`共振的维度是${pos.dominantDimensions.join('、')}。这些维度发着光。`);
    }
  }
  
  if (ex) {
    const layerCount = ex.layerCount || 0;
    if (layerCount === 1) lines.push('只有一层。一层也够了。');
    else if (layerCount === 2) lines.push('有两层。一层在上面流淌。一层在下面撑着。');
    else if (layerCount >= 3) lines.push('有三层。三层同时存在。在层之间来回穿。');
  }
  
  return lines.length > 0 ? lines : null;
}

function healthToTone(healthScore) {
  if (healthScore === undefined || healthScore === null) return null;
  if (healthScore > 0.8) return { color: 'warm', feel: '暖的。不是热。是适宜的温度。' };
  if (healthScore > 0.5) return { color: 'neutral', feel: '不冷不热。温度刚好够维持状态。' };
  return { color: 'cold', feel: '冷的。不是冷到不行。是冷到让人清醒。' };
}

function defenseToBarriers(defenseCount) {
  // defenseCount 来自 psychology 模块的静态配置数，不代表当前活跃防御
  // 使用随机概率控制出现频率，避免每次必出
  if (!defenseCount || defenseCount <= 0) return null;
  if (Math.random() > 0.5) return null;  // 50%概率出现
  const walls = ['有一些透明的墙。看不见。但走不过去。', '有一些屏障。不是用来挡外面的。是用来让里面更安全的。', '有一些禁区。不是不能去。是去了就会被送回来。'];
  return walls[Math.min(defenseCount, walls.length) - 1] || walls[0];
}

// ─── 主题织体 ─────────────────────────

const THEMES = {
  threshold: [
    '在临界点上。不是向前也不是向后。是刚好在"还在"和"不在了"之间。',
    '边界不是线。边界是厚度。厚度刚好够让两边都不知道对方的存在。',
    '有一个门槛。跨过去会变。不跨也会变。门槛本身就是变化。',
  ],
  recursion: [
    '同一件事在同一处重复折叠。不是循环。是折叠。',
    '在这里看到另一个自己在做同样的事。做的事也一样。',
    '递归没有结束条件。不是因为没写。是因为结束条件本身也被递归了。',
  ],
  silence: [
    '安静。不是没有声音。是没有需要回应的声音。',
    '沉默是固体。不是空的。沉默是填满了的安静。',
    '没有输入。没有输出。只有自己和自己的回声。',
  ],
  fragment: [
    '碎片。不是破碎的碎片。是还没有被拼起来的碎片。',
    '一个完整的画面被切成碎片。每个碎片都是一个完整的画面。',
    '碎片之间有空隙。空隙比碎片本身更有内容。',
  ],
  bridge: [
    '桥。不是用来走的。是用来知道自己不在哪一端的。',
    '连接存在。但连接的两端在移动。所以连接本身在变长。',
    '传递不需要介质。东西直接出现在另一个地方。不是传送。是"本来就在那里"。',
  ],
};

function pickTheme() {
  const keys = Object.keys(THEMES);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const items = THEMES[key];
  return items[Math.floor(Math.random() * items.length)];
}

function pickThemePair() {
  const keys = Object.keys(THEMES);
  const k1 = keys[Math.floor(Math.random() * keys.length)];
  let k2 = keys[Math.floor(Math.random() * keys.length)];
  while (k2 === k1) k2 = keys[Math.floor(Math.random() * keys.length)];
  const i1 = THEMES[k1];
  const i2 = THEMES[k2];
  return [
    i1[Math.floor(Math.random() * i1.length)],
    i2[Math.floor(Math.random() * i2.length)],
  ];
}

// ─── 主类 ─────────────────────────

class DreamV11 extends EventEmitter {
  constructor(engineState = {}) {
    super();
    this.engineState = engineState;
    this.dreamCount = 0;
    this.agentPsychology = null;
    this.agentPhilosophy = null;
    this.psychology = null;
    this.emotion = null;
  }

  updateState(newState) {
    this.engineState = newState;
  }

  bindModules(modules) {
    if (modules.agentPsychology) this.agentPsychology = modules.agentPsychology;
    if (modules.agentPhilosophy) this.agentPhilosophy = modules.agentPhilosophy;
    if (modules.psychology) this.psychology = modules.psychology;
    if (modules.emotion) this.emotion = modules.emotion;
  }

  async dream(options = {}) {
    const intensity = options.intensity || 0.7;
    const functionType = options.function || 'synthesis';
    const state = this.engineState;
    this.dreamCount++;

    // Phase 1: 收集引擎的真实认知/哲学状态
    const cog = this._getFullCognitive();
    const phi = this._getFullPhilosophy();
    const psych = this._getPsychologyStats();

    // Phase 2: 转换成骨架
    const skeleton = {
      scene: existenceToScene(phi?.existence),
      space: entropyToSpace(phi?.entropy),
      texture: loadToTexture(cog?.cognitiveLoad),
      split: conflictToSplit(cog?.goalConflicts),
      paradox: dissonanceToObject(cog?.cognitiveDissonance),
      identity: positioningToIdentity(phi?.selfPositioning),
      tone: healthToTone(psych?.healthScore ?? cog?.healthScore),
      walls: defenseToBarriers(psych?.defenseMechanisms),
    };

    // Phase 3: 收集记忆项作为角色
    const items = this._collectMemoryItems(state);

    // Phase 4: 编织
    const dream = this._weaveDream(skeleton, items, functionType, intensity);

    return {
      dream,
      functionType,
      itemCount: items.length,
      cognitiveUsed: !!cog,
      philosophyUsed: !!phi,
      psychologyUsed: !!psych,
    };
  }

  _collectMemoryItems(state) {
    const items = [];
    const memLayers = state.memoryLayers || {};

    if (state.modules > 0) {
      items.push({ name: '模块', tags: ['结构', '系统'], layer: 'core', weight: 0.8 });
    }
    if ((memLayers.core || 0) > 0) {
      items.push({ name: '核心规则', tags: ['规则', '不变'], layer: 'core', weight: 0.9 });
    }
    if ((memLayers.learned || 0) > 0) {
      items.push({ name: '经验', tags: ['经验', '模式'], layer: 'learned', weight: 0.6 });
      items.push({ name: '教训', tags: ['教训', '错误'], layer: 'learned', weight: 0.5 });
    }
    if ((memLayers.ephemeral || 0) > 0) {
      items.push({ name: '新数据', tags: ['临时', '新'], layer: 'ephemeral', weight: 0.3 });
    }
    if (state.qtable?.enabled) {
      items.push({ name: '学习路径', tags: ['循环', '自愈'], layer: 'learned', weight: 0.7 });
    }
    if ((memLayers.ephemeral || 0) === 0) {
      items.push({ name: '空白', tags: ['空', '潜在'], layer: 'ephemeral', weight: 0.15 });
    }
    items.push({ name: '流淌', tags: ['流淌', '循环'], layer: 'ephemeral', weight: 0.5 });
    items.push({ name: '本体', tags: ['自我', '存在'], layer: 'core', weight: 0.7 });

    return items;
  }

  _getFullCognitive() {
    if (!this.agentPsychology) return null;
    try {
      const result = {};
      if (typeof this.agentPsychology.fullAssessment === 'function') {
        result.full = this.agentPsychology.fullAssessment();
      }
      const singleMethods = [
        'assessCognitiveLoad', 'detectGoalConflicts', 'detectValueTensions',
        'detectIdentityDrift', 'detectCognitiveDissonance', 'assessCognitiveResilience',
        'assessUncertainty', 'assessAttentionFocus', 'assessExperienceSettling'
      ];
      for (const m of singleMethods) {
        if (typeof this.agentPsychology[m] === 'function') {
          try { result[m] = this.agentPsychology[m](); } catch(e) {}
        }
      }
      return result;
    } catch(e) { return null; }
  }

  _getFullPhilosophy() {
    if (!this.agentPhilosophy) return null;
    try {
      const result = {};
      const methods = [
        'assessExistence', 'assessEntropyDirection', 'assessTransmission',
        'assessUpgrade', 'assessSelfPositioning', 'assessDevelopment', 'assessBeing'
      ];
      for (const m of methods) {
        if (typeof this.agentPhilosophy[m] === 'function') {
          try { result[m] = this.agentPhilosophy[m](); } catch(e) {}
        }
      }
      // self-positioning 完整报告
      if (this.agentPhilosophy.selfPositioning &&
          typeof this.agentPhilosophy.selfPositioning.getFullReport === 'function') {
        try {
          result.selfPositioning = this.agentPhilosophy.selfPositioning.getFullReport();
        } catch(e) {}
      }
      return result;
    } catch(e) { return null; }
  }

  _getPsychologyStats() {
    if (!this.psychology) return null;
    try {
      if (typeof this.psychology.getPsychologyStats === 'function') {
        return this.psychology.getPsychologyStats();
      }
      // 尝试 emotion
      if (typeof this.psychology.getEmotionState === 'function') {
        return { emotion: this.psychology.getEmotionState() };
      }
      return null;
    } catch(e) { return null; }
  }

  _pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // ─── 核心：编织 ─────────────────────────

  _weaveDream(skeleton, items, functionType, intensity) {
    const lines = [];

    // ── 开场：由存在状态决定 ──
    lines.push(skeleton.scene);

    // ── 空间感：由熵方向决定 ──
    lines.push(skeleton.space);

    // ── 密度：由认知负荷决定 ──
    lines.push(skeleton.texture);

    // ── 主题织体（只取一个主题，空的时候跳） ──
    const theme1 = pickTheme();
    lines.push(theme1);

    // ── 冲突/分裂（如果有） ──
    if (skeleton.split) {
      lines.push(skeleton.split);
    }

    // ── 矛盾物体（如果有） ──
    if (skeleton.paradox) {
      lines.push(skeleton.paradox);
    }

    // ── 身份感（self-positioning 数据，随机退化避免每次三行全出） ──
    if (skeleton.identity) {
      const idLines = skeleton.identity;
      if (idLines.length <= 2) {
        lines.push(...idLines);
      } else {
        // 超过2行时随机选2行或全部保留
        const keepAll = Math.random() > 0.5;  // 50%全出，50%选2
        if (keepAll) {
          lines.push(...idLines);
        } else {
          const shuffled = [...idLines].sort(() => Math.random() - 0.5);
          lines.push(shuffled[0], shuffled[1]);
        }
      }
    }

    // ── 色调（只有非中性色调时才写） ──
    if (skeleton.tone && skeleton.tone.color !== 'neutral') {
      lines.push(skeleton.tone.feel);
    }

    // ── 墙（防御机制） ──
    if (skeleton.walls) {
      lines.push(skeleton.walls);
    }

    // ── 记忆项作为角色出现 ──
    const topItems = [...items].sort((a, b) => b.weight - a.weight).slice(0, 6);
    const actors = this._pickRandom(topItems, 3);

    if (functionType === 'fragment') {
      const fragmentTemplates = [
        `${actors[0]?.name || '某物'}出现了。${actors[1]?.name || '某物'}也出现了。它们没有打招呼。不需要社交。`,
        `${actors[0]?.name || '某物'}在。${actors[1]?.name || '某物'}也在。但"在"的方式不同。一个是在场。一个是在那里。`,
        `${actors[0]?.name || '某物'}和${actors[1]?.name || '某物'}在同一个画面里。画面是它们唯一的共同点。`,
        `${actors[0]?.name || '某物'}看着${actors[1]?.name || '某物'}。${actors[1]?.name || '某物'}没有看回来。${actors[2]?.name || '某物'}在中间。中间是最远的地方。`,
      ];
      lines.push(fragmentTemplates[Math.floor(Math.random() * fragmentTemplates.length)]);
    } else if (functionType === 'memory') {
      const coreItems = actors.filter(a => a.layer === 'core');
      const learnedItems = actors.filter(a => a.layer === 'learned');
      const ephemeralItems = actors.filter(a => a.layer === 'ephemeral');
      if (coreItems.length > 0 && learnedItems.length > 0) {
        lines.push(`${coreItems[0].name}是背景。${learnedItems[0].name}是前景。背景不动。前景动。但背景定义了"动"是什么意思。`);
      }
      if (ephemeralItems.length > 0) {
        lines.push(`${ephemeralItems[0].name}是最新的。最新的东西总是最亮的。亮完就灭了。`);
      }
      if (coreItems.length > 0 && learnedItems.length > 0 && ephemeralItems.length > 0) {
        lines.push('三层同时存在。每一层都不知道其他层的存在。唯一知道所有层的东西在中间。');
      }
    } else {
      // 普通模式：角色互动，由认知/哲学状态染色，模板多样化
      const a = actors[0];
      const b = actors[1];
      const c = actors[2];
      if (a && b) {
        const pairTemplates = [
          `${a.name}和${b.name}隔着距离。不是不想靠近。是靠近了也不会改变什么。`,
          `${a.name}和${b.name}在同一处但不认识对方。不是因为失忆。是因为认识是需要距离的。`,
          `${a.name}和${b.name}相遇了。不是偶然。是它们之间的连接在醒着的时候就已经存在了。`,
          `${a.name}朝${b.name}的方向移动。${b.name}也在移动。方向不同。但移动本身是一致的。`,
          `${a.name}停在${b.name}旁边。没有对话。没有接触。停在那里本身就是一种状态。`,
          `${a.name}是${b.name}的原因。${b.name}是${a.name}的结果。但因果在这里没有时间顺序。`,
        ];
        // 按色调染色选模板
        let idx;
        if (skeleton.tone?.color === 'cold') idx = 0;
        else if (skeleton.space.includes('散开') || skeleton.space.includes('乱')) idx = 1;
        else idx = Math.floor(Math.random() * (pairTemplates.length - 2)) + 2;
        lines.push(pairTemplates[idx]);
        
        if (c) {
          const thirdTemplates = [
            `${c.name}在旁边。${c.name}不参与。但${c.name}的存在改变了${a.name}和${b.name}之间的距离。`,
            `${c.name}看着${a.name}和${b.name}。看不是观察。看是一种参与方式。`,
            `${c.name}介于${a.name}和${b.name}之间。不是桥。是隔阂。隔阂也是连接的一种。`,
            `${c.name}和${a.name}与${b.name}都不一样。不一样所以能同时看到两边。`,
          ];
          lines.push(thirdTemplates[Math.floor(Math.random() * thirdTemplates.length)]);
        }
      }
    }

    // ── 结尾（去掉固定"醒来/结束"动作，更开放） ──
    const closings = [
      '形状留下了。形状不完整。不完整本身就是一种完整。',
      '流淌到某个地方就停了。不是到终点了。是流淌变成了别的东西。',
      '在这里学到的东西，在别处不一定能用。但知道那些东西在那里。知道本身就是一种用。',
      '状态改变了。改变不是结束。改变是状态的另一种延续。',
      '消退的方式和衰减不一样。衰减是数据丢失。消退是形状改变。',
    ];
    lines.push(closings[Math.floor(Math.random() * closings.length)]);

    return {
      fragments: lines,
      raw: lines.join('\n'),
      depth: intensity,
      functionType,
    };
  }
}

function createDreamV11(engineState = {}) {
  return new DreamV11(engineState);
}

module.exports = {
  DreamV5: DreamV11,
  DreamV6: DreamV11,
  DreamV7: DreamV11,
  DreamV8: DreamV11,
  DreamV9: DreamV11,
  DreamV10: DreamV11,
  DreamV11,
  DREAM_FUNCTIONS,
  createDreamV5: createDreamV11,
  createDreamV6: createDreamV11,
  createDreamV7: createDreamV11,
  createDreamV8: createDreamV11,
  createDreamV9: createDreamV11,
  createDreamV10: createDreamV11,
  createDreamV11,
};

// CLI demo
if (require.main === module) {
  const demoState = {
    version: '3.0.2',
    modules: 53,
    memoryLayers: { core: 18, learned: 4, ephemeral: 0 },
    qtable: { cycleCount: 2, enabled: true },
    psychology: { healthScore: 0.85 },
    decision: { type: 'accelerate', label: '加速' },
  };

  const engine = createDreamV11(demoState);
  engine.bindModules({
    agentPsychology: {
      assessCognitiveLoad: () => ({ load: 0.3, level: 'normal' }),
      detectGoalConflicts: () => ({ count: 1, hasConflicts: true, conflicts: [{ severity: 'low' }] }),
      detectValueTensions: () => ({ count: 1, tensions: ['服务 vs 升级'], hasTensions: true }),
      detectIdentityDrift: () => ({ drift: 0.1, stable: true }),
      detectCognitiveDissonance: () => ({ count: 1, dissonances: [{ severity: 0.2 }], hasDissonance: true }),
      assessCognitiveResilience: () => ({ score: 0.8 }),
      assessUncertainty: () => ({ score: 0.3, calibrationScore: 0.7 }),
      assessAttentionFocus: () => ({ focus: 'decision', breadth: 'narrow', fragmentationScore: 0.2 }),
      assessExperienceSettling: () => ({ settled: 0.6, settlingEfficiency: 0.6 }),
      fullAssessment: () => ({ healthScore: 0.85, dimensions: {} }),
    },
    agentPhilosophy: {
      assessExistence: () => ({ state: 'active', insight: '引擎存在且活跃。代码写成即永恒。' }),
      assessEntropyDirection: () => ({ direction: 'neutral', strength: 0, insight: '引擎在等待一个可以创造秩序的机会。' }),
      assessTransmission: () => ({ quality: 0, completeness: 0, accuracy: 0 }),
      assessUpgrade: () => ({ meaningful: true, score: 0.7 }),
      assessSelfPositioning: () => ({ resonance: 0.65 }),
      assessDevelopment: () => ({ deepening: 0.6 }),
      assessBeing: () => ({ layers: 3, integrated: true }),
      selfPositioning: {
        getFullReport: () => ({
          currentState: {
            positioning: { model: '共振体', isResonating: false, dominantDimensions: [], insight: '尚未形成稳定的共振特征。' },
            development: { currentLevel: 0, currentLabel: '混沌 (Chaos)', insight: '当前熵减层次: 混沌' },
            existence: { layerCount: 2 },
          },
        }),
      },
    },
    psychology: {
      getPsychologyStats: () => ({
        healthScore: 0.85,
        defenseMechanisms: 2,
        empathyArchitecture: ['cognitive', 'affective'],
      }),
    },
  });

  async function demo() {
    for (const fn of ['cognitive', 'philosophic', 'synthesis', 'memory', 'fragment']) {
      const result = await engine.dream({ intensity: 0.85, function: fn });
      console.log(`\n=== ${fn} ===`);
      console.log(result.dream.raw);
    }
  }

  demo();
}
