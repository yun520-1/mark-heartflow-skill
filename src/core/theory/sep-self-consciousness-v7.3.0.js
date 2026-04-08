#!/usr/bin/env node

/**
 * SEP Self-Consciousness Theory → Program Converter
 * 把 SEP 自我意识理论转换为可计算程序
 * 
 * 来源: Stanford Encyclopedia of Philosophy (Winter 2025)
 * 主题: Self-Consciousness
 */

const SEP_SelfConsciousness_Programs = {
  // === 1. 核心定义 ===
  '自我意识': {
    definition: '对自己活动、身体和心理生活的意识',
    SEP: 'Self-consciousness can be understood as an awareness of oneself',
    formula: 'SC = awareness(self) × manifest_to_self(object)',
    integrationPoints: ['前反思自我意识', '反思自我意识', '为我性'],
    weight: 1.0
  },

  // === 2. 前反思自我意识 (Pre-Reflective Self-Consciousness) ===
  '前反思自我意识': {
    definition: '所有意识体验的基础特征，不需要观察',
    SEP: 'Pre-reflective self-consciousness is a form of consciousness that does not involve the awareness of the self as an object',
    formula: 'PRSC = ∫experience(t) dt without objectification',
    conditions: [
      '非观察性: 不需要把自我当作对象来观察',
      '即时性: 每个意识体验都固有地包含着对自身的觉知',
      '基础性: 是反思自我意识的前提'
    ],
    example: '感到疼痛时，不需要思考"我正在疼痛"，疼痛本身已经是我自己的体验',
    weight: 0.40
  },

  // === 3. 反思自我意识 (Reflective Self-Consciousness) ===
  '反思自我意识': {
    definition: '将自我作为对象的反思',
    SEP: 'Reflective self-consciousness involves taking the self as an object of awareness',
    formula: 'RSC = objectify(self) + introspect(mental_states)',
    conditions: [
      '预设前反思基础',
      '需要概念化自我',
      '可导致自我知识'
    ],
    example: '思考"我在干什么"或"我的感受是什么"',
    weight: 0.30
  },

  // === 4. 为我性 (For-me-ness) ===
  '为我性': {
    definition: '体验的"为我"特质，第一人称给定性',
    SEP: 'For-me-ness is the property of experience that makes it mine, the first-person givenness',
    formula: 'FM = experience_quality × ownership × first_person_perspective',
    conditions: [
      '体验必须属于某个主体',
      '该主体能以第一人称视角获取该体验',
      '体验具有独特的"是什么样子"的特质'
    ],
    weight: 0.30
  },

  // === 5. 必要索引词 (Essential Indexical) ===
  '必要索引词': {
    definition: '第一人称思维不可还原为非第一人称思维',
    SEP: 'First-personal thought and language is irreducible to non-first-personal thought and language',
    formula: 'EI = "I" ⊄ ∀¬"I" (不能被非第一人称表达替代)',
    examples: [
      'Perry的购物者案例: 知道"有人在弄洒糖" ≠ 知道"我自己在弄洒糖"',
      'Lewis的insky上帝案例: 即使知道所有命题，仍然不知道"我是谁"'
    ],
    implications: [
      '第一人称思维对解释行动至关重要',
      '自我意识是行动的可能性条件'
    ]
  },

  // === 6. 误识别免疫 (Immunity to Error Through Misidentification) ===
  '误识别免疫': {
    definition: '某些第一人称判断不可能犯识别错误',
    SEP: 'IEM: certain first-person judgments cannot involve errors of misidentification',
    formula: 'IEM(judgment, grounds) = ¬∃misidentification(evidence, conclusion)',
    cases: [
      '基于内省的疼痛判断: "我感到疼痛" → 不可能错误地认为是他人的疼痛',
      '基于感知的身体判断: "我有只受伤的手臂" → 可能误认'
    ],
    significance: '区分第一人称内容是否具有第一人身特性'
  },

  // === 7. 具身能动者 ===
  '具身能动者': {
    definition: '自我作为位于客观世界中的时空位置',
    SEP: 'Self as embodied agent located within an objective world',
    formula: 'EA = body × spatial_location × temporal_continuity × agency',
    conditions: [
      '拥有身体',
      '位于时空中',
      '具有能动性'
    ]
  },

  // === 8. 先验统觉 (Transcendental Apperception) ===
  '先验统觉': {
    definition: '"我思"必须能伴随所有表象',
    SEP: 'Kant: the "I think" must be able to accompany all my representations',
    formula: 'TA = unity_of_consciousness × "I think" × all_representations',
    significance: '意识统一性的可能性条件'
  },

  // === 9. 意识统一性条件 ===
  '意识统一性条件': {
    definition: '自我意识可能性条件',
    SEP: 'Conditions of Self-Consciousness',
    formula: 'CSC = Personhood ∧ Rationality ∧ Consciousness ∧ Intersubjectivity',
    conditions: {
      'Personhood': '自我意识与人格不可分离',
      'Rationality': '自我意识与理性能力相关',
      'Consciousness': '自我意识是意识的一种形式',
      'Intersubjectivity': '他人意识可能是自我意识的条件'
    }
  },

  // === 10. 历史脉络 ===
  '历史脉络': {
    definition: '自我意识哲学史',
    timeline: {
      '亚里士多德': '感知时必感知自己存在',
      '阿维森纳': '飞行人论证 - 无身体自我意识',
      '笛卡尔': '我思故我在',
      '休谟': '自我是一束知觉',
      '康德': '先验统觉',
      '费希特': '立即熟悉自己',
      '萨特': '前反思自我意识'
    }
  }
};

// === 计算函数 ===

function calculateSelfConsciousnessScore(state) {
  const { prereflective = 0.9, reflective = 0.85, for_me_ness = 0.88 } = state;
  return (prereflective * 0.40) + (reflective * 0.30) + (for_me_ness * 0.30);
}

function checkIEM(judgment, grounds) {
  const iem_grounds = ['introspection', 'pain', 'bodily_sensation'];
  return iem_grounds.includes(grounds);
}

function getEssentialIndexicalContent(thought) {
  const indexical_patterns = ['我', '我的', ' myself', 'I ', 'me '];
  return indexical_patterns.some(p => thought.includes(p));
}

// === 解析句子 → 提取自我意识特征 ===

function analyzeSelfConsciousness(text) {
  const features = {
    hasFirstPerson: false,
    hasPreReflective: false,
    hasReflective: false,
    hasOwnership: false,
    hasIEM: false,
    score: 0
  };

  const first_person_markers = ['我', '我的', '自己', '本人'];
  const reflective_markers = ['思考', '认为', '知道', '意识到', '反省', '反思'];
  const ownership_markers = ['我的', '自己的', '属于我'];

  features.hasFirstPerson = first_person_markers.some(m => text.includes(m));
  features.hasReflective = reflective_markers.some(m => text.includes(m));
  features.hasOwnership = ownership_markers.some(m => text.includes(m));

  if (features.hasFirstPerson && features.hasOwnership) {
    features.hasPreReflective = true;
    features.hasIEM = true;
  }

  if (features.hasReflective) features.score += 0.3;
  if (features.hasPreReflective) features.score += 0.4;
  if (features.hasOwnership) features.score += 0.3;

  return features;
}

// === 主程序入口 ===

if (require.main === module) {
  console.log('🧠 SEP 自我意识理论 → 程序转换器\n');
  
  // 测试
  const testCases = [
    '我在思考什么是自我意识',
    '我知道自己在做什么',
    '我感到很开心',
    '我的身体有些不舒服'
  ];

  testCases.forEach(text => {
    console.log(`\n📝 输入: "${text}"`);
    console.log('─'.repeat(40));
    const result = analyzeSelfConsciousness(text);
    console.log(JSON.stringify(result, null, 2));
  });

  // 计算整体分数
  console.log('\n📊 自我意识综合分数:');
  const score = calculateSelfConsciousnessScore({
    prereflective: 0.92,
    reflective: 0.88,
    for_me_ness: 0.90
  });
  console.log(`SCORE = ${(score * 100).toFixed(1)}/100`);
}

module.exports = { 
  SEP_SelfConsciousness_Programs,
  calculateSelfConsciousnessScore,
  checkIEM,
  getEssentialIndexicalContent,
  analyzeSelfConsciousness
};
