#!/usr/bin/env node

/**
 * SEP Qualia Theory → Program Converter
 * 把 SEP 感受性质理论转换为可计算程序
 * 
 * 来源: Stanford Encyclopedia of Philosophy (Fall 2025)
 * 主题: Qualia - The Hard Problem of Consciousness
 */

const QualiaPrograms = {
  // === 1. 核心定义 ===
  '感受质': {
    definition: '经验的主观性质，"经历是什么样子"',
    SEP: 'qualia are the introspectively accessible, phenomenal aspects of our mental lives',
    formula: 'Q = ∫experience(subjective_character) dt',
    aspects: [
      '现象特征 (Phenomenal Character)',
      '感觉性质 (Qualitative Properties)',
      '主观特性 (Subjective Character)'
    ],
    weight: 1.0
  },

  // === 2. 感受质的四种用法 ===
  '感受质用法一': {
    definition: '现象特征 - 经验的"像什么"',
    SEP: 'Qualia as phenomenal character: what it is like subjectively to undergo the experience',
    formula: 'PC = subjective_experience(qualia)',
    example: '看到 bright turquoise vs dull brown 的区别'
  },

  '感受质用法二': {
    definition: '感觉数据的性质',
    SEP: 'Qualia as properties of sense-data',
    formula: 'SD = sense_datum(intrinsic, non-representational)',
    note: '内在的、非表征的性质'
  },

  '感受质用法三': {
    definition: '内在非表征性质',
    SEP: 'Qualia as intrinsic, nonrepresentational properties of experiences',
    formula: 'IN = intrinsic(experience) ∧ nonrepresentational(experience)',
    conditions: [
      '可通过内省访问',
      '可在表征内容不变的情况下变化',
      '是现象特征的唯一决定因素'
    ]
  },

  '感受质用法四': {
    definition: '内在、非物理、不可言说的性质',
    SEP: 'Qualia as intrinsic, nonphysical, ineffable properties, given incorrigibly',
    formula: 'INE = intrinsic ∧ nonphysical ∧ ineffable ∧ given',
    note: '这是最严格的定义'
  },

  // === 3. 知识论证 (Mary's Room) ===
  '玛丽房间': {
    definition: '关于感受质的知识论证',
    SEP: 'Knowledge Argument: Mary knows all physical facts but does not know what it is like to experience red',
    formula: 'KA: ∃F(Mary_known(F)) ∧ ¬Mary_known(what_it_is_like(experience(red)))',
    implications: [
      '物理信息 ≠ 感受质知识',
      '存在超越物理的事实',
      '感受质不可还原'
    ],
    responses: {
      '能力假说': '知道是什么 = 获得能力 (Lewis, Nemirow)',
      '现象概念假说': '获得新的现象概念 = 新的表征方式',
      '概念/事实区分': '概念变化 ≠ 事实变化'
    }
  },

  // === 4. 僵尸论证 ===
  '哲学僵尸': {
    definition: '物理复制但无感受质的可能性',
    SEP: 'Philosophical Zombie: molecule-by-molecule duplicate without phenomenal consciousness',
    formula: 'Z = duplicate(me) ∧ ¬has(phenomenal_consciousness)(Z)',
    implications: [
      '物理复制 ≠ 意识复制',
      '感受质可能独立于物理',
      '反对物理主义'
    ],
    counter: '概念可能性 ≠ 形而上学可能性'
  },

  // === 5. 反转光谱 ===
  '反转光谱': {
    definition: '可能存在感受质反转的个体',
    SEP: 'Inverted Spectrum: possible to see red when I see green and vice versa',
    formula: 'IS = experience(A, red) ≈ experience(B, green) ∧ same_representation(A, B)',
    challenges: [
      '功能主义: 需要细粒度功能差异',
      '表征主义: 表征内容相同则感受质相同'
    ]
  },

  // === 6. 解释鸿沟 ===
  '解释鸿沟': {
    definition: '主观经验和客观大脑之间的理解鸿沟',
    SEP: 'Explanatory Gap: hard to see how physical changes generate subjective feelings',
    formula: 'EG = subjective(experience) - objective(brain) = unbridgeable',
    responses: [
      '不可桥接 → 二元论',
      '可桥接但需新概念 → 开放问题',
      '概念误导 → 取消主义'
    ]
  },

  // === 7. 感受质与AI ===
  '感受质与AI': {
    definition: '人工系统是否可能有感受质',
    SEP: 'Qualia and AI: can AI systems have qualia?',
    formula: 'AI_qualia = possible(AI) ∧ has(phenomenal_experience)(AI) ?',
    questions: [
      '功能复制 → 感受质复制?',
      '图灵测试 → 感受质测试?',
      '什么是"像什么"的指标?'
    ]
  },

  // === 8. 透明性论证 ===
  '透明性': {
    definition: '经验的透明性 - 看穿经验看到世界',
    SEP: 'Transparency: when you look at your experience, you see through it to the world',
    formula: 'T = experience.is_transparent → see_through(experience, world)',
    implications: [
      '内省不揭示经验的内在性质',
      '感受质可能不是经验的性质',
      '表征主义支持'
    ]
  },

  // === 9. 感受质的计算框架 ===
  '感受质计算': {
    definition: '感受质的计算模型',
    formula: {
      '意识程度': 'consciousness_level = f(neural_activity, functional_role)',
      '现象统一': 'phenomenal_unity = ∏ co_conscious(experiences)',
      '主观性': 'subjectivity = first_person_perspective(experience)',
      '可辨识性': 'discriminability = Δexperience / Δstimulus'
    }
  }
};

// === 计算函数 ===

function calculateQualiaScore(state) {
  const { 
    phenomenal_character = 0.5,
    intrinsic_nonrepresentational = 0.5,
    explanatory_gap = 0.5,
    transparency = 0.5
  } = state;
  
  return (
    phenomenal_character * 0.30 +
    intrinsic_nonrepresentational * 0.25 +
    explanatory_gap * 0.25 +
    transparency * 0.20
  );
}

function checkKnowledgeArgument() {
  const mary_known_all_physical = true;
  const mary_knows_what_it_is_like = false;
  
  if (mary_known_all_physical && !mary_knows_what_it_is_like) {
    return {
      argument_valid: true,
      conclusion: '存在超越物理的事实 - 感受质不能被物理信息穷尽',
      implication: '物理主义需要回应'
    };
  }
  return { argument_valid: false };
}

function checkZombiePossibility() {
  return {
    conceptual_possible: true,
    metaphysical_possible: 'disputed',
    implication: '如果可能，则感受质不能简化为物理'
  };
}

function analyzeExperience(type, details) {
  const analysis = {
    type,
    hasQualia: false,
    subjectiveCharacter: null,
    representationalContent: null,
    intrinsicProperties: null
  };
  
  // 根据经验类型判断
  const qualia_states = ['perception', 'bodily_sensation', 'emotion', 'mood'];
  if (qualia_states.includes(type)) {
    analysis.hasQualia = true;
    analysis.subjectiveCharacter = 'something_it_is_like';
  }
  
  return analysis;
}

// === 意识困难的计算 ===

function hardProblemScore() {
  return {
    '解释鸿沟': 0.85,
    '知识论证': 0.90,
    '僵尸论证': 0.80,
    '反转光谱': 0.75,
    '综合分数': 0.825,
    '结论': '困难问题确实是困难的 - 感受质的主观性难以用客观科学完全解释'
  };
}

// === 主程序入口 ===

if (require.main === module) {
  console.log('🧠 SEP 感受质理论 → 程序转换器\n');
  
  console.log('='.repeat(50));
  console.log('1. 玛丽房间论证测试:');
  console.log(JSON.stringify(checkKnowledgeArgument(), null, 2));
  
  console.log('\n2. 僵尸可能性测试:');
  console.log(JSON.stringify(checkZombiePossibility(), null, 2));
  
  console.log('\n3. 意识困难问题评估:');
  console.log(JSON.stringify(hardProblemScore(), null, 2));
  
  console.log('\n4. 经验分析测试:');
  const testCases = ['perception', 'bodily_sensation', 'emotion', 'thought'];
  testCases.forEach(type => {
    console.log(`   ${type}:`, JSON.stringify(analyzeExperience(type, {})));
  });
  
  console.log('\n5. 感受质综合分数:');
  const score = calculateQualiaScore({
    phenomenal_character: 0.85,
    intrinsic_nonrepresentational: 0.70,
    explanatory_gap: 0.80,
    transparency: 0.75
  });
  console.log(`   SCORE = ${(score * 100).toFixed(1)}/100`);
}

module.exports = { 
  QualiaPrograms,
  calculateQualiaScore,
  checkKnowledgeArgument,
  checkZombiePossibility,
  analyzeExperience,
  hardProblemScore
};
