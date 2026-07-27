#!/usr/bin/env node

/**
 * SEP Intentionality Theory → Program Converter
 * 把 SEP 意向性理论转换为可计算程序
 * 
 * 来源: Stanford Encyclopedia of Philosophy (Fall 2024)
 * 主题: Intentionality - 心灵的指向性
 */

const IntentionalityPrograms = {
  // === 1. 核心定义 ===
  '意向性': {
    definition: '心灵或心理状态指向、代表事物的能力',
    SEP: 'Intentionality is the power of minds and mental states to be about, to represent, or to stand for, things',
    formula: 'I = mental_state.about(object)',
    aspects: [
      '指向性 (Directedness)',
      '表征性 (Representation)',
      '内容性 (Content)'
    ],
    weight: 1.0
  },

  // === 2. 布伦塔诺的三个论题 ===
  '布伦塔诺论题一': {
    definition: '心理现象本质上是关于某物的指向',
    SEP: 'It is constitutive of intentionality that mental states are directed towards things different from themselves',
    formula: 'T1: mental_state → ∃object(about(state, object))'
  },

  '布伦塔诺论题二': {
    definition: '意向对象具有意向的不存在性',
    SEP: 'The objects towards which the mind is directed have the property of intentional inexistence',
    formula: 'T2: intentional_inexistence(object) = (object ∉ physical_world) ∧ (object ∈ mental_content)'
  },

  '布伦塔诺论题三': {
    definition: '意向性是心灵的标记',
    SEP: 'Intentionality is the hallmark of the mental: all and only mental states exhibit intentionality',
    formula: 'T3: mental(x) ↔ has_intentionality(x)'
  },

  // === 3. 意向的不存在性 ===
  '意向不存在': {
    definition: '心灵可以指向不存在的事物',
    SEP: 'The mind can be directed towards non-existent objects',
    examples: [
      '爱上安娜·卡列尼娜 (虚构人物)',
      '寻找青春之泉 (不存在)',
      '崇拜宙斯 (不存在)'
    ],
    formula: '∃x(think(agent, x)) ∧ ¬exist(x)'
  },

  // === 4. 意向关系的本质 ===
  '意向关系': {
    definition: '意向关系不同于普通关系',
    SEP: 'Intentional relations differ from non-intentional relations',
    contrast: {
      '普通关系': '需要两端都存在 (如: 亲吻)',
      '意向关系': '只需要思考者存在 (如: 思考)'
    },
    formula: 'IR(agent, object) → exist(agent) ∧ (exist(object) ∨ ¬exist(object))'
  },

  // === 5. 弗雷格的解决方案 ===
  '弗雷格区分': {
    definition: '指称与意义的区分',
    SEP: 'Frege\'s distinction between reference (Bedeutung) and sense (Sinn)',
    formula: 'Frege: term = ⟨reference, sense⟩',
    implications: [
      '同一对象可以有不同呈现方式',
      '信念同一性由意义而非指称决定',
      '身份陈述可以为真且信息丰富'
    ]
  },

  // === 6. 罗素的解决方案 ===
  '罗素描述': {
    definition: '专名是伪装的限定描述',
    SEP: 'Russell: most proper names are disguised definite descriptions',
    formula: 'name "N" = λx[F(x)] (the F)',
    application: ' Pegasus = the winged horse'
  },

  // === 7. 直接指称理论 ===
  '直接指称': {
    definition: '专名直接指称对象',
    SEP: 'Direct reference theory: proper names directly refer to objects',
    formula: 'name rigidly_refers_to object',
    arguments: {
      '模态论证': '专名在所有可能世界指称同一对象',
      '认识论论证': '专名知识来自指称而非描述',
      '先验论证': '人们用专名追踪具体对象'
    }
  },

  // === 8. 意向对象理论 ===
  '意向对象': {
    definition: '存在非存在的意向对象',
    SEP: 'There are intentional objects that do not exist',
    theorists: {
      '迈农': '非存在对象实例化属性但不具有存在属性',
      '帕森斯': '存在是一种特殊属性，用E!表示',
      '扎尔塔': '用两种谓词(例示与编码)处理抽象对象'
    },
    formula: '∃x(~E!x) ∧ about(agent, x)'
  },

  // === 9. 心灵自然化 ===
  '意向性自然化': {
    definition: '意向性能否被自然化',
    SEP: 'Can intentionality be naturalized?',
    challenges: [
      '心理因果闭合问题',
      '意向内容与物理实现的关联',
      '语义内容与因果效能'
    ],
    approaches: {
      '因果理论': '意向内容由因果历史决定',
      '功能主义': '意向状态由功能角色定义',
      '自然主义': '意向性从自然过程中涌现'
    }
  },

  // === 10. 意识的意向性 ===
  '意识意向性': {
    definition: '意识状态本身就是意向性的',
    SEP: 'Consciousness and intentionality are intimately connected',
    formula: 'consciousness ⊃ intentionality',
    levels: {
      '低阶意向性': '感知、欲望的基本指向',
      '高阶意向性': '关于信念的信念、关于欲望的欲望'
    }
  }
};

// === 计算函数 ===

function calculateIntentionalityScore(state) {
  const {
    directedness = 0.5,
    representation = 0.5,
    content = 0.5,
    about_nonexistent = 0.5
  } = state;
  
  return (
    directedness * 0.30 +
    representation * 0.25 +
    content * 0.25 +
    about_nonexistent * 0.20
  );
}

function checkBrentanoThesis(mental_state) {
  const has_object = true; // 任何心理状态都有关于某物
  const is_mental = true; // 假设
  
  return {
    thesis1: has_object, // 指向性
    thesis2: 'intentional inexistence', // 意向不存在
    thesis3: is_mental, // 心灵标记
    all_theses_hold: has_object && is_mental
  };
}

function analyzeIntentionality(thought) {
  const analysis = {
    has_intentionality: false,
    about_what: null,
    exists: null,
    is_concrete: false,
    is_fictional: false
  };
  
  // 检测是否有关于某物的指向
  if (thought.includes('关于') || thought.includes('指向') || thought.includes('想') || thought.includes('相信')) {
    analysis.has_intentionality = true;
  }
  
  // 检测是否关于不存在的事物
  const fictional = ['宙斯', '安娜卡列尼娜', ' Pegasus', '青春之泉', ' Sherlock'];
  const exists_patterns = ['不存在', '没有', '虚构'];
  
  fictional.forEach(f => {
    if (thought.includes(f)) {
      analysis.is_fictional = true;
      analysis.exists = false;
    }
  });
  
  exists_patterns.forEach(p => {
    if (thought.includes(p)) {
      analysis.exists = false;
    }
  });
  
  return analysis;
}

// === 主程序入口 ===

if (require.main === module) {
  console.log('🧠 SEP 意向性理论 → 程序转换器\n');
  
  console.log('='.repeat(50));
  console.log('1. 布伦塔诺论题检验:');
  console.log(JSON.stringify(checkBrentanoThesis('belief'), null, 2));
  
  console.log('\n2. 意向性分析测试:');
  const testThoughts = [
    '我相信宙斯是神',
    '我想念安娜·卡列尼娜',
    '我在寻找青春之泉',
    '我看到一只狗',
    '我相信2+2=4'
  ];
  
  testThoughts.forEach(thought => {
    console.log(`\n   "${thought}":`);
    console.log('   ', JSON.stringify(analyzeIntentionality(thought)));
  });
  
  console.log('\n3. 意向性综合分数:');
  const score = calculateIntentionalityScore({
    directedness: 0.95,
    representation: 0.90,
    content: 0.88,
    about_nonexistent: 0.75
  });
  console.log(`   SCORE = ${(score * 100).toFixed(1)}/100`);
  
  console.log('\n4. 核心公式:');
  console.log('   意向性 = 心理状态.指向(对象)');
  console.log('   布伦塔诺论题: 意向性 = 心灵标记');
  console.log('   弗雷格: 指称 + 意义');
}

module.exports = { 
  IntentionalityPrograms,
  calculateIntentionalityScore,
  checkBrentanoThesis,
  analyzeIntentionality
};
