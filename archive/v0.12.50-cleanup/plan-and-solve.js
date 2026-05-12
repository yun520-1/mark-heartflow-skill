/**
 * HeartFlow Plan-and-Solve 推理引擎 v1.0
 * 
 * 来源：ACL 2023 "Plan-and-Solve Prompting"
 * 论文：https://arxiv.org/abs/2305.04091
 * 
 * 核心方法论：
 * 1. 理解问题 - 提取关键变量
 * 2. 制定计划 - 分解成步骤
 * 3. 执行计划 - 每步检查
 * 4. 验证 - 检查计算和常识
 */

var PS_PROMPTS = {
  // 最简版
  basic: "Let's first understand the problem and devise a plan. Then, let's solve step by step.",
  
  // 完整版（带验证）
  full: "Let's first understand the problem, extract relevant variables. Then devise a complete plan. Then execute step by step, checking calculations and common sense. Finally, show the answer.",
  
  // 带反例检查
  withCheck: "Let's first understand the problem. Then check: does this have counterexamples? If yes, revise. Then solve."
};

/**
 * 理解问题 - 提取关键变量和信息
 */
function understand(input) {
  // 分解问题
  var question = input.trim();
  
  // 提取关键词
  var keywords = [];
  var numbers = [];
  var entities = [];
  
  // 简单提取：数字、实体、动作
  var words = question.split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    // 数字
    if (/\d+/.test(w)) {
      numbers.push(w);
    }
    // 实体（简单判断：连续大写或特定词）
    if (w.length > 1 && w[0] === w[0].toUpperCase()) {
      entities.push(w);
    }
  }
  
  return {
    original: question,
    keywords: keywords,
    numbers: numbers,
    entities: entities,
    understanding: "问题涉及哪些关键要素？"
  };
}

/**
 * 制定计划 - 分解成步骤
 */
function plan(understanding) {
  // 基于理解，制定步骤
  var steps = [
    { step: 1, action: "复述问题", desc: "用自己的话复述问题" },
    { step: 2, action: "识别变量", desc: "找出问题中的关键变量" },
    { step: 3, action: "检查反例", desc: "这个问题有没有反例或边界情况？" },
    { step: 4, action: "制定方案", desc: "制定解决步骤" },
    { step: 5, action: "执行", desc: "按步骤执行" },
    { step: 6, action: "验证", desc: "检查计算和常识" }
  ];
  
  return {
    steps: steps,
    totalSteps: steps.length
  };
}

/**
 * 执行计划
 */
function execute(understanding, plan, options) {
  options = options || {};
  var prompt = options.prompt || PS_PROMPTS.full;
  var results = [];
  
  // 执行每个步骤
  for (var i = 0; i < plan.steps.length; i++) {
    var step = plan.steps[i];
    
    results.push({
      step: step.step,
      action: step.action,
      desc: step.desc,
      status: 'pending'
    });
  }
  
  return {
    understanding: understanding,
    plan: plan,
    results: results,
    prompt: prompt
  };
}

/**
 * 推理引擎主函数
 */
function reason(input, options) {
  options = options || {};
  
  // Step 1: 理解问题
  var understanding = understand(input);
  
  // Step 2: 制定计划
  var planResult = plan(understanding);
  
  // Step 3: 执行
  var execution = execute(understanding, planResult, options);
  
  return {
    phase: 'plan_and_solve',
    input: input,
    understanding: understanding,
    plan: planResult,
    execution: execution,
    // 返回一个引导提示
    guidance: "回答前，先经过：1)理解问题 2)检查反例 3)制定步骤 4)执行 5)验证"
  };
}

/**
 * 快速推理（简化版）
 */
function quickReason(input) {
  var result = reason(input, { prompt: PS_PROMPTS.basic });
  
  return {
    guidance: result.guidance,
    understanding: result.understanding.original,
    steps: result.plan.steps.map(function(s) { return s.action; }).join(' → ')
  };
}

module.exports = {
  understand: understand,
  plan: plan,
  execute: execute,
  reason: reason,
  quickReason: quickReason,
  PS_PROMPTS: PS_PROMPTS
};