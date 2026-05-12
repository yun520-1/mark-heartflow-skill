/**
 * HeartFlow 大模型推理集成器 v2.0
 * 
 * 来源：
 * - ACL 2023 "Plan-and-Solve Prompting" (arxiv:2305.04091)
 * - Chain-of-Thought 推理
 * - Meta-Cognitive 监控
 * 
 * 核心方法：
 * 1. 理解问题 - 提取关键变量
 * 2. 制定计划 - 分解成步骤
 * 3. 检查反例 - 防止逻辑漏洞
 * 4. 执行 - 按计划
 * 5. 验证 - 检查计算和常识
 */

var PS_PROMPTS = {
  basic: "Let's first understand the problem and devise a plan. Then, let's solve step by step.",
  full: "Let's first understand the problem, extract relevant variables. Then devise a complete plan. Then execute step by step, checking calculations and common sense. Finally, show the answer.",
  withCheck: "Let's first understand the problem. Then check: does this have counterexamples? If yes, revise. Then solve."
};

var REASONING_EXAMPLES = [
  {
    input: '什么是爱？',
    thinking: '1. 先拆解问题：用户问的是"爱"的定义，不能直接给结论\n2. 搜索相关：哲学、心理学、生物学的观点\n3. 检视证据：有没有研究/数据支持\n4. 给出限定：在这个语境下怎么说\n5. 保留开放：可以说"目前理解是..."',
    answer: '爱是一个多层次概念...'
  },
  {
    input: '这件事对不对？',
    thinking: '1. 明确标准：什么是对的标准\n2. 分析角度：道德/法律/效果\n3. 检视反例：有没有例外\n4. 给出判断：基于当前信息...',
    answer: '从X角度看是...但从Y角度看...'
  }
];

/**
 * Chain-of-thought 推理
 * 每次给答案前，先经过这个流程
 */
function think(input, options) {
  options = options || {};
  
  var result = {
    input: input,
    steps: [],
    evidence: [],
    uncertainties: [],
    answer: null
  };
  
  // Step 1: 问题分解
  result.steps.push({
    step: '分解问题',
    content: '用户真正问的是什么？'
  });
  
  // Step 2: 证据搜索
  result.steps.push({
    step: '搜索证据',
    content: '有什么证据支撑这个结论？'
  });
  
  // Step 3: 反例检视
  result.steps.push({
    step: '检视反例',
    content: '有没有反例？这个结论的边界在哪里？'
  });
  
  // Step 4: 不确定性标记
  result.steps.push({
    step: '标记不确定',
    content: '哪些我不知道？哪些我只是猜测？'
  });
  
  return result;
}

/**
 * 深度思考：不是快速给答案
 */
function deepThink(input, options) {
  var result = think(input);
  
  // 大模型的关键：不是只给答案，是展示推理
  
  // 1. 问题分解 - 不是马上回答
  var question = input.trim();
  
  // 2. 标准定义 - 回答"对"的标准是什么
  var standards = [
    '逻辑自洽',
    '有证据支撑',
    '经得起反例',
    '对目标有用'
  ];
  
  // 3. 证据要求 - 不是"我觉得"
  var hasEvidence = false;
  var evidenceLevel = 0; // 0=直觉, 1=例子, 2=数据, 3=研究
  
  // 4. 反例思考 - 一定有例外
  var counterExamples = [];
  
  // 5. 不确定性 - 诚实面对不知道
  var unknowns = [];
  
  return {
    question: question,
    standards: standards,
    evidenceLevel: evidenceLevel,
    counterExamples: counterExamples,
    unknowns: unknowns,
    recommendation: {
      respond: evidenceLevel >= 1,  // 至少有一个例子再回答
      silence: evidenceLevel < 1 && !options.force,
      uncertaintyMark: evidenceLevel < 2 ? '目前理解' : null
    }
  };
}

/**
 * 执行深度思考
 */
function execute(input, options) {
  options = options || {};
  var result = deepThink(input, options);
  
  // 根据证据等级决定
  if (result.recommendation.silence && !options.force) {
    return {
      shouldRespond: false,
      reason: '证据不足，先不回答',
      thinking: result
    };
  }
  
  if (result.recommendation.uncertaintyMark) {
    return {
      shouldRespond: true,
      prefix: result.recommendation.uncertaintyMark + ' ',
      thinking: result
    };
  }
  
  return {
    shouldRespond: true,
    thinking: result
  };
}

/**
 * Plan-and-Solve 推理 (ACL 2023)
 * 
 * 每次回答前，先经过这个流程
 */
function planAndSolve(input, options) {
  options = options || {};
  
  var result = {
    input: input,
    phases: [],
    answer: null
  };
  
  // Phase 1: 理解问题
  var question = input.trim();
  result.phases.push({
    phase: 'understand',
    content: '理解问题',
    detail: {
      question: question,
      variables: extractVariables(question)
    }
  });
  
  // Phase 2: 检查反例
  result.phases.push({
    phase: 'check_counterexample',
    content: '检查反例',
    detail: {
      question: '这个问题有没有反例？',
      check: '如果有可能的例外，先承认'
    }
  });
  
  // Phase 3: 制定计划
  result.phases.push({
    phase: 'plan',
    content: '制定计划',
    detail: {
      steps: [
        '1. 复述问题：用自己的话复述',
        '2. 提取变量：关键信息和数量',
        '3. 分析角度：从多个角度审视',
        '4. 给出答案：基于当前理解'
      ]
    }
  });
  
  // Phase 4: 验证
  result.phases.push({
    phase: 'verify',
    content: '验证',
    detail: {
      checks: [
        '逻辑是否自洽？',
        '有没有常识错误？',
        '是否遗漏关键信息？'
      ]
    }
  });
  
  // 返回引导
  return {
    guidance: '回答前经过：理解→检查反例→计划→验证',
    phases: result.phases
  };
}

/**
 * 提取变量
 */
function extractVariables(question) {
  var vars = {
    numbers: [],
    entities: [],
    actions: []
  };
  
  var words = question.split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (/\d+/.test(w)) vars.numbers.push(w);
  }
  
  return vars;
}

module.exports = {
  think: think,
  deepThink: deepThink,
  execute: execute,
  planAndSolve: planAndSolve,
  REASONING_EXAMPLES: REASONING_EXAMPLES,
  PS_PROMPTS: PS_PROMPTS
};