/**
 * HeartFlow 大模型推理集成器 v3.0
 * 
 * 来源：
 * - ACL 2023 "Plan-and-Solve Prompting" (arxiv:2305.04091)
 * - Chain-of-Thought 推理
 * - Meta-Cognitive 监控
 * 
 * 核心方法：
 * 1. 预搜索阶段 - 收集相关背景知识
 * 2. 理解问题 - 提取关键变量
 * 3. 显式计划 - 分解成可执行步骤
 * 4. 检查反例 - 防止逻辑漏洞
 * 5. 执行 - 按计划
 * 6. 验证 - 检查计算和常识
 */

/**
 * Plan-and-Solve Prompt 模板 (ACL 2023 增强版)
 * 论文核心：先制定完整计划，再执行，减少推理错误
 */
var PS_PROMPTS = {
  // 基础版：理解+计划+执行
  basic: "Let's first understand the problem and devise a plan. Then, let's solve step by step.",
  
  // 完整版：理解→变量提取→计划→执行→验证
  full: "Let's first understand the problem, extract relevant variables and their relationships. Then devise a complete step-by-step plan. Then execute the plan systematically, checking each calculation and common sense assumption. Finally, verify the answer.",
  
  // 含反例检查版：理解→检查反例→计划→执行
  withCheck: "Let's first understand the problem. Then check: does this have counterexamples or edge cases? If yes, revise the approach. Then devise a plan and solve step by step.",
  
  // PS-PROMPT v2 增强版：强调计划的重要性和执行检查
  psV2: "Let's first understand the problem carefully by identifying what is being asked, what information is given, and what the constraints are. Then, let's devise a clear plan with specific sub-steps. Next, execute each step systematically while checking for calculation errors and logical consistency. Finally, verify the answer makes sense.",
  
  // 零样本Plan-and-Solve (论文推荐)
  zeroShot: "Carefully read and understand the problem. Then create a detailed plan with numbered steps to solve it. Execute the plan step by step, verifying each step before moving to the next. Check the final answer for reasonableness.",
  
  // 强调变量提取的计划
  variableFocus: "First, let's extract all relevant variables and constants from the problem. Second, let's devise a plan that uses these variables systematically. Third, let's execute the plan step by step. Fourth, let's verify the solution by plugging values back.",
  
  // 强调自我验证的计划
  selfVerify: "Let's understand the problem. Now let's plan our approach: list the steps needed. Execute each step carefully. After obtaining the answer, let's verify it by an alternative method or by checking if it satisfies the original problem constraints.",
  
  // 多角度分析计划
  multiPerspective: "First, let's restate the problem in our own words to ensure understanding. Second, let's consider multiple perspectives or methods to solve it. Third, let's choose the most promising approach and create a plan. Fourth, execute and verify."
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
 * Chain-of-thought 推理 (增强版 - Plan-and-Solve)
 * 每次给答案前，先经过这个流程
 * 
 * ACL 2023 Plan-and-Solve 核心：在执行前先制定显式计划
 */
function think(input, options) {
  options = options || {};
  options.enablePlan = options.enablePlan !== false; // 默认启用计划阶段
  
  var result = {
    input: input,
    steps: [],
    evidence: [],
    uncertainties: [],
    answer: null
  };
  
  // Step 0: 预搜索阶段 (如果启用)
  if (options.enablePlan) {
    var preSearchResult = _presearchPhase(input, options);
    if (preSearchResult) {
      result.steps.push(preSearchResult);
    }
  }
  
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
  
  // Step 2.5: 显式计划阶段 (ACL 2023 Plan-and-Solve 核心)
  if (options.enablePlan) {
    var planResult = _explicitPlan(input, options);
    if (planResult) {
      result.steps.push(planResult);
    }
  }
  
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
 * 预搜索阶段 (Pre-search Phase)
 * 
 * ACL 2023 Plan-and-Solve 关键改进：
 * 在制定计划前，先收集相关背景知识，帮助更好地理解问题
 * 
 * @private
 * @param {string} input - 用户输入
 * @param {object} options - 配置选项
 * @returns {object} 预搜索结果
 */
function _presearchPhase(input, options) {
  options = options || {};
  
  var question = input.trim();
  
  // 识别问题类型
  var questionTypes = _classifyQuestion(question);
  
  // 提取需要搜索的关键词
  var searchKeywords = _extractSearchKeywords(question);
  
  // 确定相关领域
  var relevantDomains = _identifyRelevantDomains(question);
  
  return {
    step: '预搜索阶段',
    phase: 'presearch',
    content: '收集相关背景知识',
    detail: {
      questionType: questionTypes,
      keywords: searchKeywords,
      domains: relevantDomains,
      actions: [
        '收集问题相关的背景信息',
        '回忆该领域的基本概念',
        '确认是否有公式或框架可用'
      ]
    }
  };
}

/**
 * 显式计划阶段 (Explicit Planning Phase)
 * 
 * ACL 2023 Plan-and-Solve 论文核心贡献：
 * 不是边想边做，而是先制定完整的计划，再执行
 * 这样可以：
 * 1. 减少推理过程中的遗漏
 * 2. 提高解题步骤的完整性
 * 3. 便于后续验证和检查
 * 
 * @private
 * @param {string} input - 用户输入
 * @param {object} options - 配置选项
 * @returns {object} 计划结果
 */
function _explicitPlan(input, options) {
  options = options || {};
  
  var question = input.trim();
  
  // 提取变量
  var variables = extractVariables(question);
  
  // 识别问题类型和适用的解题策略
  var problemType = _classifyQuestion(question);
  
  // 生成具体步骤
  var steps = _generatePlanSteps(question, variables, problemType);
  
  // 识别潜在难点和易错点
  var pitfalls = _identifyPotentialPitfalls(question, problemType);
  
  return {
    step: '制定计划',
    phase: 'planning',
    content: '制定显式执行计划',
    detail: {
      variables: variables,
      problemType: problemType,
      subSteps: steps,
      expectedOutcome: '通过计划减少推理遗漏',
      pitfalls: pitfalls,
      checkpoints: [
        '计划是否完整覆盖了问题的各个方面？',
        '每个步骤是否都有明确的输入输出？',
        '是否有可能遗漏关键变量或条件？'
      ]
    }
  };
}

/**
 * 问题分类
 * 
 * @private
 */
function _classifyQuestion(question) {
  var q = question.toLowerCase();
  
  if (q.match(/多少|计算|求|等于|数字|总和|平均|概率|统计/i)) {
    return '计算类';
  } else if (q.match(/为什么|原因|解释|原理|机制/i)) {
    return '解释类';
  } else if (q.match(/是什么|定义|概念|什么是|指什么/i)) {
    return '定义类';
  } else if (q.match(/对不对|是否|正确|真假|判断/i)) {
    return '判断类';
  } else if (q.match(/如何|怎么|方法|步骤|过程/i)) {
    return '方法类';
  } else if (q.match(/比较|对比|差异|区别|相同|不同/i)) {
    return '比较类';
  } else {
    return '综合类';
  }
}

/**
 * 提取搜索关键词
 * 
 * @private
 */
function _extractSearchKeywords(question) {
  var words = question.split(/[\s,，。！？、；：""''（）()]+/);
  var keywords = [];
  
  // 过滤停用词
  var stopWords = ['的', '是', '在', '了', '和', '与', '或', '一个', '这个', '那个', '我', '你', '他', '她', '它', '什么', '怎么', '如何', '为什么', '多少', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'];
  var stopSet = {};
  for (var i = 0; i < stopWords.length; i++) {
    stopSet[stopWords[i]] = true;
  }
  
  for (var i = 0; i < words.length; i++) {
    if (words[i].length > 1 && !stopSet[words[i]] && !stopSet[words[i].toLowerCase()]) {
      keywords.push(words[i]);
    }
  }
  
  return keywords.slice(0, 10); // 最多返回10个关键词
}

/**
 * 识别相关领域
 * 
 * @private
 */
function _identifyRelevantDomains(question) {
  var q = question.toLowerCase();
  var domains = [];
  
  if (q.match(/数学|计算|数字|概率|统计|几何|代数/i)) {
    domains.push('数学');
  }
  if (q.match(/物理|力学|电磁|热|光学|量子/i)) {
    domains.push('物理');
  }
  if (q.match(/化学|反应|分子|原子|元素|化合物/i)) {
    domains.push('化学');
  }
  if (q.match(/生物|细胞|基因|进化|生态/i)) {
    domains.push('生物');
  }
  if (q.match(/经济|市场|价格|成本|利润|投资/i)) {
    domains.push('经济');
  }
  if (q.match(/法律|权利|义务|责任|违法|犯罪/i)) {
    domains.push('法律');
  }
  if (q.match(/心理|情绪|认知|行为|意识/i)) {
    domains.push('心理学');
  }
  if (q.match(/哲学|存在|认识|价值|伦理|道德/i)) {
    domains.push('哲学');
  }
  
  if (domains.length === 0) {
    domains.push('通用');
  }
  
  return domains;
}

/**
 * 生成计划步骤
 * 
 * @private
 */
function _generatePlanSteps(question, variables, problemType) {
  var steps = [];
  
  // 基础步骤：理解问题
  steps.push('1. 复述问题：用简洁的话概括问题本质');
  
  // 根据问题类型添加特定步骤
  if (problemType === '计算类') {
    steps.push('2. 提取数据：识别所有数值和单位');
    steps.push('3. 确定公式：选择适用的计算公式');
    steps.push('4. 执行计算：按步骤进行运算');
    steps.push('5. 验证结果：检查计算过程和答案合理性');
  } else if (problemType === '解释类') {
    steps.push('2. 明确因果：识别原因和结果');
    steps.push('3. 收集证据：查找支持解释的论据');
    steps.push('4. 构建解释：形成连贯的推理链条');
    steps.push('5. 检验边界：确认适用范围和限制');
  } else if (problemType === '定义类') {
    steps.push('2. 查找定义：回忆或查询标准定义');
    steps.push('3. 分析特征：列出该概念的关键属性');
    steps.push('4. 举例说明：提供正例和反例');
    steps.push('5. 明确边界：说明不是什么');
  } else if (problemType === '判断类') {
    steps.push('2. 明确标准：确定判断的依据');
    steps.push('3. 分析证据：逐项检查条件是否满足');
    steps.push('4. 考虑反例：寻找可能的例外情况');
    steps.push('5. 给出判断：基于分析得出结论');
  } else if (problemType === '比较类') {
    steps.push('2. 识别对象：确定要比较的各方');
    steps.push('3. 确定维度：列出比较的方面');
    steps.push('4. 逐项比较：各维度逐一对比');
    steps.push('5. 综合结论：权衡得出总体评价');
  } else {
    // 综合类问题的通用步骤
    steps.push('2. 多角度分析：从不同视角审视问题');
    steps.push('3. 收集信息：获取必要的背景知识');
    steps.push('4. 形成观点：综合分析得出结论');
    steps.push('5. 检验完善：检查是否有遗漏或错误');
  }
  
  return steps;
}

/**
 * 识别潜在难点和易错点
 * 
 * @private
 */
function _identifyPotentialPitfalls(question, problemType) {
  var q = question.toLowerCase();
  var pitfalls = [];
  
  // 通用陷阱
  pitfalls.push('假设过多：不要假设未明确给出的条件');
  pitfalls.push('范围忽略：注意问题是否有人群/时间/空间限制');
  pitfalls.push('语言歧义：关键术语是否有多重含义');
  
  // 特定类型陷阱
  if (problemType === '计算类') {
    pitfalls.push('单位混乱：注意单位是否统一');
    pitfalls.push('计算错误：仔细复核算术步骤');
    pitfalls.push('四舍五入：确定精确度要求');
  }
  if (q.match(/如果|假如|假设/i)) {
    pitfalls.push('条件依赖：明确假设条件下的结论');
  }
  if (q.match(/所有|全部|每个|总是|永远/i)) {
    pitfalls.push('绝对化陷阱：注意极端表述可能不成立');
  }
  if (q.match(/有些|一些|部分|有时|可能/i)) {
    pitfalls.push('弱化陷阱：注意结论的适用范围');
  }
  
  return pitfalls;
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