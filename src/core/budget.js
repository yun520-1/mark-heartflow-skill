/**
 * HeartFlow Budget Manager — Token计数、思考预算管理、动态再平衡与溢出保护
 * 
 * 吸收来源：hindsight Budget+token计数逻辑
 * 
 * 功能清单：
 * 1. countTokens(text)           - cl100k_base编码估算（不依赖外部库）
 * 2. Budget 枚举                 - LOW/MID/HIGH 三级预算
 * 3. resolveThinkingBudget()     - 根据预算级别解析token数
 * 4. adaptive/fixed 预算模式     - 自适应(百分比) or 固定token数
 * 5. BudgetTracker 类            - 预算消耗追踪、溢出检测、欠载报告
 * 6. autoSelectBudget(task)      - 根据任务复杂度自动选择预算级别
 * 7. truncateToBudget(text, limit) - 智能截断文本到预算内
 * 8. rebalanceBudgets()          - 多任务预算动态再平衡
 * 9. estimateTaskComplexity()    - 任务复杂度估算
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Budget 枚举
// ═══════════════════════════════════════════════════════════════════════════════

const Budget = {
  LOW: 'LOW',
  MID: 'MID',
  HIGH: 'HIGH'
};

// 所有有效预算级别
const BUDGET_LEVELS = Object.values(Budget);

// 预算级别排序（用于比较：级别越高值越大）
const BUDGET_ORDER = {
  [Budget.LOW]: 0,
  [Budget.MID]: 1,
  [Budget.HIGH]: 2
};

// 固定预算模式 token数
const FIXED_BUDGET = {
  [Budget.LOW]: 100,
  [Budget.MID]: 300,
  [Budget.HIGH]: 1000
};

// 自适应预算模式百分比（占maxTokens）
const ADAPTIVE_BUDGET = {
  [Budget.LOW]: 0.025,   // 2.5%
  [Budget.MID]: 0.075,   // 7.5%
  [Budget.HIGH]: 0.25    // 25%
};

// 预算级别对应名称
const BUDGET_NAMES = {
  [Budget.LOW]: '低预算（快速响应）',
  [Budget.MID]: '中预算（常规处理）',
  [Budget.HIGH]: '高预算（深度思考）'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. countTokens - cl100k_base编码估算
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 估算文本token数（cl100k_base编码风格）
 * 
 * cl100k_base是GPT-4/Claude等模型使用的编码器。本实现使用启发式估算，
 * 不依赖tiktoken等外部库。
 * 
 * 估算规则（基于cl100k_base词汇表特性）：
 * - 英文单词：平均约1.3 token/词（常见词短，罕见词长）
 * - 纯ASCII英文字符：约4字符 ≈ 1 token
 * - 中文字符：约1.5-2字符 ≈ 1 token（汉字在cl100k_base中通常独立成token）
 * - 数字：约2-3字符 ≈ 1 token
 * - 标点/空格：计入但权重较低
 * - 表情/多字节：按实际字节计算
 * 
 * @param {string} text - 输入文本
 * @returns {number} 估算token数（向上取整）
 * 
 * @example
 * countTokens('hello world')        // ~2-3
 * countTokens('你好世界')            // ~4-6
 * countTokens('function foo() {}') // ~4-5
 */
function countTokens(text) {
  if (!text || typeof text !== 'string') return 0;

  let tokens = 0;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const code = char.charCodeAt(0);

    // ASCII可打印字符（空格到~）
    if (code >= 32 && code <= 126) {
      // 检测连续ASCII序列（英文单词/句子）
      let asciiRun = '';
      while (i < len) {
        const c = text[i];
        const cp = c.charCodeAt(0);
        if (cp >= 32 && cp <= 126) {
          asciiRun += c;
          i++;
        } else {
          break;
        }
      }
      
      // 分析这个ASCII序列
      const trimmed = asciiRun.trim();
      if (trimmed.length === 0) {
        // 全是空白
        tokens += trimmed.length * 0.02; // 空格几乎不算token
      } else {
        // 统计非空格部分
        const nonSpace = trimmed.replace(/\s+/g, '');
        
        if (/^\d+$/.test(nonSpace)) {
          // 纯数字：约2.5字符/token
          tokens += Math.ceil(nonSpace.length / 2.5);
        } else if (/^[a-zA-Z]+$/.test(nonSpace)) {
          // 纯英文单词：约1.3 token/词
          const words = nonSpace.split(/\s+/);
          tokens += words.length * 1.3;
        } else {
          // 混合英文+标点：使用4字符/token规则
          tokens += Math.ceil(nonSpace.length / 4);
        }
        
        // 加上空格
        const spaceCount = (asciiRun.length - nonSpace.length);
        tokens += spaceCount * 0.02;
      }
      continue;
    }

    // CJK统一汉字（中文）
    if (code >= 0x4E00 && code <= 0x9FFF) {
      // 中文在cl100k_base中通常作为单独token
      // 但连续中文会共享某些BPE合并规则
      let chineseRun = '';
      while (i < len) {
        const c = text[i];
        const cp = c.charCodeAt(0);
        if (cp >= 0x4E00 && cp <= 0x9FFF) {
          chineseRun += c;
          i++;
        } else {
          break;
        }
      }
      // 连续中文平均约1.5字符/token
      tokens += Math.ceil(chineseRun.length / 1.5);
      continue;
    }

    // 日语假名/汉字
    if (code >= 0x3040 && code <= 0x30FF) {
      tokens += 1.5; // 假名单独token
      i++;
      continue;
    }

    // 韩文
    if (code >= 0xAC00 && code <= 0xD7AF) {
      tokens += 1.5;
      i++;
      continue;
    }

    // 其他双字节字符（如表情符号）
    if (code > 255) {
      // 表情符号、多字节符号约1-2 token
      tokens += 1.5;
      i++;
      continue;
    }

    // ASCII控制字符和基本拉丁（换行、制表等）
    tokens += 0.5;
    i++;
  }

  return Math.max(1, Math.ceil(tokens));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. 预算验证与选择
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 验证预算级别是否有效
 * @param {string} budget - 待验证的预算级别
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateBudget(budget) {
  if (!budget) {
    return { valid: false, error: '预算级别不能为空' };
  }
  if (!BUDGET_LEVELS.includes(budget)) {
    return {
      valid: false,
      error: `无效预算级别 "${budget}"，可选值: ${BUDGET_LEVELS.join(', ')}`
    };
  }
  return { valid: true, error: null };
}

/**
 * 升级或降级预算级别
 * @param {string} currentBudget - 当前预算级别
 * @param {number} delta - 调整量：+1 升级，-1 降级，0 不变
 * @returns {string} 调整后的预算级别（边界保护：不超出范围）
 */
function adjustBudget(currentBudget, delta) {
  if (!BUDGET_LEVELS.includes(currentBudget)) return Budget.MID;
  const currentOrder = BUDGET_ORDER[currentBudget];
  const newOrder = Math.max(0, Math.min(BUDGET_LEVELS.length - 1, currentOrder + delta));
  return BUDGET_LEVELS[newOrder];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. resolveThinkingBudget - 根据预算级别解析token数
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 根据预算级别和模式解析思考预算token数
 * 
 * @param {string} budget - Budget枚举值：Budget.LOW | Budget.MID | Budget.HIGH
 * @param {Object} options - 配置选项
 * @param {number} options.maxTokens - 最大token数（自适应模式用）
 * @param {boolean} options.adaptive - true=自适应模式(百分比), false=固定模式
 * @param {number} options.minBudget - 最低预算下限（防止百分比过低）
 * @param {number} options.maxBudget - 最高预算上限（防止百分比过高）
 * 
 * @returns {number} 分配的思考预算token数
 * 
 * @example
 * // 自适应模式（默认）：按maxTokens百分比分配
 * resolveThinkingBudget(Budget.LOW, { maxTokens: 4096 })      // ~102 (2.5%)
 * resolveThinkingBudget(Budget.MID, { maxTokens: 4096 })      // ~307 (7.5%)
 * resolveThinkingBudget(Budget.HIGH, { maxTokens: 4096 })     // ~1024 (25%)
 * 
 * // 固定模式：直接返回固定token数
 * resolveThinkingBudget(Budget.LOW, { adaptive: false })      // 100
 * resolveThinkingBudget(Budget.MID, { adaptive: false })      // 300
 * resolveThinkingBudget(Budget.HIGH, { adaptive: false })     // 1000
 */
function resolveThinkingBudget(budget, options = {}) {
  const { maxTokens = 4096, adaptive = true, minBudget = 0, maxBudget = Infinity } = options;

  const validation = validateBudget(budget);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let result;
  if (adaptive) {
    // 自适应模式：按百分比
    const ratio = ADAPTIVE_BUDGET[budget];
    result = Math.ceil(maxTokens * ratio);
  } else {
    // 固定模式
    result = FIXED_BUDGET[budget];
  }

  // 边界保护
  if (minBudget > 0) result = Math.max(result, minBudget);
  if (Number.isFinite(maxBudget)) result = Math.min(result, maxBudget);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. 任务复杂度估算与自动预算选择
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 任务复杂度信号权重配置
 */
const COMPLEXITY_SIGNALS = {
  // 每个信号对应的加分值
  codeBlock: 15,        // 包含代码块
  conditionalLogic: 10, // 条件分支逻辑
  mathFormula: 8,       // 数学公式
  nestedStructure: 12,  // 嵌套结构（多层括号/缩进）
  longSentence: 5,      // 长句子（>50字符）
  domainTerm: 3,        // 领域术语
  multiStep: 20,        // 多步骤描述
  dataAnalysis: 18,     // 数据分析任务
  creativeWriting: 12,  // 创意写作
  codeGeneration: 20,   // 代码生成
  reasoning: 15,        // 推理任务
  translation: 8,       // 翻译任务
  summary: 6,           // 摘要任务
  questionAnswering: 4  // 问答任务
};

/**
 * 估算任务复杂度分数
 * 
 * 根据任务描述文本分析其复杂度，返回 0-100 的分数。
 * 分数越高表示任务越复杂，需要更多思考预算。
 * 
 * @param {string} taskDescription - 任务描述文本
 * @returns {{ score: number, signals: string[], level: 'simple'|'moderate'|'complex' }}
 */
function estimateTaskComplexity(taskDescription) {
  if (!taskDescription || typeof taskDescription !== 'string') {
    return { score: 0, signals: [], level: 'simple' };
  }

  const text = taskDescription.toLowerCase();
  const signals = [];

  // 检测代码块
  if (/```|\b(code|function|class|const|let|var)\b/.test(text)) {
    signals.push('codeBlock');
  }

  // 检测条件逻辑
  if (/\b(if|else|switch|case|when|unless|conditional)\b/.test(text)) {
    signals.push('conditionalLogic');
  }

  // 检测数学公式
  if (/[×÷±√∑∏∫∂∇∆]|\\\(|\\\[|\$\$|\\frac|\\sum|\\int/.test(text) ||
      /\b(calculate|compute|solve|equation|formula)\b/.test(text)) {
    signals.push('mathFormula');
  }

  // 检测嵌套结构
  if (/(\([^()]*\(|[^{}]*\{|\[[^\[\]]*\[)/.test(text)) {
    signals.push('nestedStructure');
  }

  // 检测长句子
  const sentences = text.split(/[.!?]+/);
  const longSentences = sentences.filter(s => s.trim().length > 50);
  if (longSentences.length > 0) {
    signals.push('longSentence');
  }

  // 检测领域术语（常见学术/技术词汇）
  const domainTerms = [
    'algorithm', 'architecture', 'protocol', 'framework', 'paradigm',
    'optimization', 'implementation', 'deployment', 'integration',
    'concurrent', 'distributed', 'asynchronous', 'synchronous',
    'authentication', 'authorization', 'encryption', 'validation',
    'regression', 'classification', 'clustering', 'neural',
    'semantic', 'syntactic', 'pragmatic', 'ontology',
    'methodology', 'hypothesis', 'empirical', 'theoretical'
  ];
  if (domainTerms.some(term => text.includes(term))) {
    signals.push('domainTerm');
  }

  // 检测多步骤
  const stepPatterns = [
    /(first|second|third|finally|step\s+\d|phase|stage)/i,
    /(流程|步骤|阶段|首先|然后|最后)/,
    /(\d+\.\s+[A-Z])/,
    /\b(steps|phases|stages)\b/
  ];
  if (stepPatterns.some(p => p.test(text))) {
    signals.push('multiStep');
  }

  // 检测任务类型关键词
  const taskPatterns = [
    { pattern: /\b(analyze|analysis|evaluate|assessment)\b/, signal: 'dataAnalysis' },
    { pattern: /\b(write|compose|draft|create|generate)\b/, signal: 'creativeWriting' },
    { pattern: /\b(code|program|implement|develop|build|debug)\b/, signal: 'codeGeneration' },
    { pattern: /\b(reason|explain|argue|justify|deduce|infer)\b/, signal: 'reasoning' },
    { pattern: /\b(translate|translation)\b/, signal: 'translation' },
    { pattern: /\b(summarize|summary|condense)\b/, signal: 'summary' },
    { pattern: /\b(answer|question|respond|reply)\b/, signal: 'questionAnswering' }
  ];

  for (const { pattern, signal } of taskPatterns) {
    if (pattern.test(text)) signals.push(signal);
  }

  // 去重
  const uniqueSignals = [...new Set(signals)];

  // 计算分数
  let score = 0;
  for (const signal of uniqueSignals) {
    score += COMPLEXITY_SIGNALS[signal] || 0;
  }

  // 文本长度因子：很长的任务本身更复杂
  if (text.length > 500) score += 5;
  if (text.length > 2000) score += 10;

  // 归一化到 0-100
  score = Math.min(100, Math.max(0, score));

  // 确定复杂度等级
  let level;
  if (score <= 20) level = 'simple';
  else if (score <= 50) level = 'moderate';
  else level = 'complex';

  return { score, signals: uniqueSignals, level };
}

/**
 * 根据任务描述自动选择合适的预算级别
 * 
 * @param {string} taskDescription - 任务描述
 * @param {Object} [options] - 配置选项
 * @param {string} [options.defaultBudget] - 默认预算级别
 * @param {number} [options.minLevel] - 最低预算级别（0=LOW, 1=MID, 2=HIGH）
 * @param {number} [options.maxLevel] - 最高预算级别
 * @returns {{ budget: string, complexity: object, tokens: number }}
 */
function autoSelectBudget(taskDescription, options = {}) {
  const {
    defaultBudget = Budget.MID,
    minLevel = 0,
    maxLevel = BUDGET_LEVELS.length - 1
  } = options;

  const complexity = estimateTaskComplexity(taskDescription);

  // 根据复杂度等级选择预算级别
  let budget;
  switch (complexity.level) {
    case 'simple':
      budget = Budget.LOW;
      break;
    case 'moderate':
      budget = Budget.MID;
      break;
    case 'complex':
      budget = Budget.HIGH;
      break;
    default:
      budget = defaultBudget;
  }

  // 边界保护
  const budgetOrder = BUDGET_ORDER[budget];
  if (budgetOrder < minLevel) budget = BUDGET_LEVELS[minLevel];
  if (budgetOrder > maxLevel) budget = BUDGET_LEVELS[maxLevel];

  const tokens = resolveThinkingBudget(budget);

  return { budget, complexity, tokens };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. 智能截断 - truncateToBudget
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 截断模式枚举
 */
const TruncateMode = {
  END: 'END',           // 从末尾截断（默认）
  HEAD: 'HEAD',         // 从开头截断
  MIDDLE: 'MIDDLE',     // 截断中间，保留首尾
  SENTENCE: 'SENTENCE'  // 以句子边界截断（保留完整句子）
};

/**
 * 将文本截断到指定的token预算内
 * 
 * 支持多种截断模式，优先保留最有意义的部分。
 * 
 * @param {string} text - 待截断的文本
 * @param {number} limit - token上限
 * @param {Object} [options] - 配置选项
 * @param {string} [options.mode='END'] - 截断模式
 * @param {string} [options.ellipsis='...'] - 省略号标记
 * @param {number} [options.reserveHead=0.3] - MIDDLE模式保留开头比例(0-1)
 * @param {number} [options.reserveTail=0.3] - MIDDLE模式保留末尾比例(0-1)
 * @returns {{ text: string, originalTokens: number, truncatedTokens: number, mode: string, truncated: boolean }}
 */
function truncateToBudget(text, limit, options = {}) {
  const {
    mode = TruncateMode.END,
    ellipsis = '...',
    reserveHead = 0.3,
    reserveTail = 0.3
  } = options;

  if (!text || typeof text !== 'string') {
    return { text: '', originalTokens: 0, truncatedTokens: 0, mode, truncated: false };
  }

  const originalTokens = countTokens(text);

  if (originalTokens <= limit) {
    return { text, originalTokens, truncatedTokens: originalTokens, mode, truncated: false };
  }

  if (limit <= 0) {
    return { text: '', originalTokens, truncatedTokens: 0, mode, truncated: true };
  }

  let result;
  switch (mode) {
    case TruncateMode.HEAD: {
      // 从开头截断：保留末尾
      result = _truncateFromHead(text, limit, ellipsis);
      break;
    }
    case TruncateMode.MIDDLE: {
      // 保留首尾，截断中间
      result = _truncateMiddle(text, limit, reserveHead, reserveTail, ellipsis);
      break;
    }
    case TruncateMode.SENTENCE: {
      // 以句子边界截断
      result = _truncateAtSentence(text, limit, ellipsis);
      break;
    }
    case TruncateMode.END:
    default: {
      // 从末尾截断（默认）
      result = _truncateFromEnd(text, limit, ellipsis);
      break;
    }
  }

  return {
    text: result,
    originalTokens,
    truncatedTokens: countTokens(result),
    mode,
    truncated: true
  };
}

/**
 * 从末尾截断
 * @private
 */
function _truncateFromEnd(text, limit, ellipsis) {
  let truncated = '';
  const words = text.split(/(\s+)/);
  for (const word of words) {
    const candidate = truncated + word;
    if (countTokens(candidate + ellipsis) > limit) break;
    truncated = candidate;
  }
  return truncated + ellipsis;
}

/**
 * 从开头截断
 * @private
 */
function _truncateFromHead(text, limit, ellipsis) {
  let truncated = '';
  const words = text.split(/(\s+)/);
  for (let i = words.length - 1; i >= 0; i--) {
    const candidate = words[i] + truncated;
    if (countTokens(ellipsis + candidate) > limit) break;
    truncated = words[i] + truncated;
  }
  return ellipsis + truncated;
}

/**
 * 截断中间，保留首尾
 * @private
 */
function _truncateMiddle(text, limit, reserveHead, reserveTail, ellipsis) {
  const totalTokens = countTokens(text);
  const ellipsisTokens = countTokens(ellipsis);
  const availableTokens = limit - ellipsisTokens;

  if (availableTokens <= 0) return ellipsis;

  const headTokens = Math.ceil(availableTokens * reserveHead);
  const tailTokens = availableTokens - headTokens;

  // 构建保留开头
  let head = '';
  const headChars = [];
  for (let i = 0; i < text.length; i++) {
    headChars.push(text[i]);
    const candidate = headChars.join('');
    if (countTokens(candidate) > headTokens) break;
    head = candidate;
  }

  // 构建保留末尾
  let tail = '';
  const tailChars = [];
  for (let i = text.length - 1; i >= 0; i--) {
    tailChars.unshift(text[i]);
    const candidate = tailChars.join('');
    if (countTokens(candidate) > tailTokens) break;
    tail = candidate;
  }

  return head + ellipsis + tail;
}

/**
 * 以句子边界截断
 * @private
 */
function _truncateAtSentence(text, limit, ellipsis) {
  const sentenceEndings = /[.!?。！？\n]+/g;
  let result = '';
  let lastIndex = 0;
  let match;

  // 逐句添加，直到超过预算
  while ((match = sentenceEndings.exec(text)) !== null) {
    const sentence = text.slice(lastIndex, match.index + match[0].length);
    const candidate = result + sentence;
    if (countTokens(candidate + ellipsis) > limit) break;
    result = candidate;
    lastIndex = match.index + match[0].length;
  }

  if (!result) {
    // 连一句话都放不下，退回到END模式
    return _truncateFromEnd(text, limit, ellipsis);
  }

  return result + (lastIndex < text.length ? ellipsis : '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. BudgetTracker - 预算消耗追踪器
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 预算使用状态枚举
 */
const BudgetStatus = {
  UNDER_UTILIZED: 'UNDER_UTILIZED',  // 使用率 < 50%
  NORMAL: 'NORMAL',                   // 使用率 50-90%
  NEAR_LIMIT: 'NEAR_LIMIT',          // 使用率 90-100%
  OVERFLOW: 'OVERFLOW'               // 超过预算
};

/**
 * BudgetTracker — 追踪单次任务的预算消耗
 * 
 * 用于监控思考/处理过程中的实际token消耗，检测溢出和欠载。
 * 提供实时状态查询和最终报告。
 * 
 * @example
 * const tracker = new BudgetTracker('思考', Budget.MID, { maxTokens: 4096 });
 * tracker.record(150);  // 记录了150token消耗
 * tracker.status;       // BudgetStatus.NORMAL
 * tracker.remaining;    // 剩余token数
 * tracker.getReport();  // 完整报告
 */
class BudgetTracker {
  /**
   * @param {string} taskName - 任务名称（用于报告）
   * @param {string} budgetLevel - 预算级别 (Budget.LOW|MID|HIGH)
   * @param {Object} [options] - 配置
   * @param {number} [options.maxTokens=4096] - 最大token数
   * @param {boolean} [options.adaptive=true] - 自适应模式
   * @param {number} [options.warningThreshold=0.9] - 接近限制阈值(0-1)
   * @param {number} [options.criticalThreshold=1.0] - 溢出阈值
   */
  constructor(taskName, budgetLevel, options = {}) {
    const {
      maxTokens = 4096,
      adaptive = true,
      warningThreshold = 0.9,
      criticalThreshold = 1.0
    } = options;

    this.taskName = taskName || '未命名任务';
    this.budgetLevel = budgetLevel;
    this.maxTokens = maxTokens;
    this.adaptive = adaptive;

    this._allocated = resolveThinkingBudget(budgetLevel, { maxTokens, adaptive });
    this._consumed = 0;
    this.records = [];          // 每步消耗记录 [{step, tokens, timestamp}]
    this.stepCount = 0;
    this.overflowCount = 0;     // 溢出次数
    this.startTime = Date.now();
    this.endTime = null;
    this.warningThreshold = warningThreshold;
    this.criticalThreshold = criticalThreshold;
    this._closed = false;
  }

  /**
   * 记录消耗的token数
   * @param {number} tokens - 本次消耗的token数
   * @param {string} [stepLabel] - 步骤标签（可选）
   * @returns {{ status: string, consumed: number, remaining: number, overflow: boolean }}
   */
  record(tokens, stepLabel) {
    if (this._closed) {
      throw new Error(`BudgetTracker "${this.taskName}" 已关闭，无法记录新消耗`);
    }
    if (typeof tokens !== 'number' || tokens < 0) {
      tokens = 0;
    }

    this.stepCount++;
    this._consumed += tokens;
    if (tokens > 0 && this._consumed > this._allocated) {
      this.overflowCount++;
    }

    this.records.push({
      step: this.stepCount,
      tokens,
      label: stepLabel || null,
      timestamp: Date.now()
    });

    return this._getStatus();
  }

  /**
   * 获取当前状态
   * @private
   */
  _getStatus() {
    const ratio = this._allocated > 0 ? this._consumed / this._allocated : 1;
    let status;
    if (ratio >= this.criticalThreshold) status = BudgetStatus.OVERFLOW;
    else if (ratio >= this.warningThreshold) status = BudgetStatus.NEAR_LIMIT;
    else if (ratio < 0.5) status = BudgetStatus.UNDER_UTILIZED;
    else status = BudgetStatus.NORMAL;

    return {
      status,
      consumed: this._consumed,
      remaining: Math.max(0, this._allocated - this._consumed),
      overflow: this._consumed > this._allocated,
      utilization: Math.round(ratio * 100)
    };
  }

  /**
   * 获取当前状态
   */
  get status() {
    return this._getStatus().status;
  }

  /**
   * 获取已消耗token数
   */
  get consumed() {
    return this._consumed;
  }

  /**
   * 获取已分配预算
   */
  get allocated() {
    return this._allocated;
  }

  /**
   * 获取剩余token数
   */
  get remaining() {
    return Math.max(0, this._allocated - this._consumed);
  }

  /**
   * 获取利用率 (0-100)
   */
  get utilization() {
    return this._getStatus().utilization;
  }

  /**
   * 是否溢出
   */
  get isOverflow() {
    return this._consumed > this._allocated;
  }

  /**
   * 关闭追踪器（不再记录）
   * @returns {Object} 最终报告
   */
  close() {
    this._closed = true;
    this.endTime = Date.now();
    return this.getReport();
  }

  /**
   * 获取完整报告
   * @returns {Object} 报告对象
   */
  getReport() {
    const elapsed = this.endTime
      ? this.endTime - this.startTime
      : Date.now() - this.startTime;

    const status = this._getStatus();

    return {
      taskName: this.taskName,
      budgetLevel: this.budgetLevel,
      allocated: this.allocated,
      consumed: this.consumed,
      remaining: status.remaining,
      utilization: status.utilization,
      status: status.status,
      overflow: status.overflow,
      overflowCount: this.overflowCount,
      stepCount: this.stepCount,
      records: this.records,
      elapsed: elapsed,
      elapsedFormatted: _formatDuration(elapsed),
      closed: this._closed
    };
  }

  /**
   * 获取预算建议：如果溢出或利用率过低，建议调整预算级别
   * @returns {{ action: string, suggestion: string, recommendedBudget: string|null }}
   */
  getSuggestion() {
    const status = this._getStatus();

    if (status.overflow) {
      const currentOrder = BUDGET_ORDER[this.budgetLevel];
      if (currentOrder < BUDGET_LEVELS.length - 1) {
        const nextBudget = BUDGET_LEVELS[currentOrder + 1];
        const nextTokens = resolveThinkingBudget(nextBudget, {
          maxTokens: this.maxTokens,
          adaptive: this.adaptive
        });
        return {
          action: 'UPGRADE',
          suggestion: `预算溢出 ${status.utilization}%，建议升级到 ${nextBudget} (${nextTokens} tokens)`,
          recommendedBudget: nextBudget
        };
      }
      return {
        action: 'OVERFLOW_MAX',
        suggestion: `已达最高预算级别但仍有溢出，需优化任务或增加 maxTokens`,
        recommendedBudget: null
      };
    }

    if (status.utilization < 30 && this.stepCount > 2) {
      const currentOrder = BUDGET_ORDER[this.budgetLevel];
      if (currentOrder > 0) {
        const prevBudget = BUDGET_LEVELS[currentOrder - 1];
        const prevTokens = resolveThinkingBudget(prevBudget, {
          maxTokens: this.maxTokens,
          adaptive: this.adaptive
        });
        return {
          action: 'DOWNGRADE',
          suggestion: `利用率仅 ${status.utilization}%，建议降级到 ${prevBudget} (${prevTokens} tokens)`,
          recommendedBudget: prevBudget
        };
      }
      return {
        action: 'UNDER_LOWEST',
        suggestion: `利用率仅 ${status.utilization}%，但已是最低预算级别`,
        recommendedBudget: null
      };
    }

    return {
      action: 'OK',
      suggestion: `预算使用正常 (${status.utilization}%)`,
      recommendedBudget: null
    };
  }
}

/**
 * 格式化持续时间（毫秒 → 可读字符串）
 * @private
 */
function _formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. 多任务预算再平衡 - rebalanceBudgets
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 多任务预算分配结果
 * @typedef {Object} BudgetAllocation
 * @property {string} taskName - 任务名称
 * @property {string} budgetLevel - 原始预算级别
 * @property {number} allocated - 分配token数
 * @property {number} consumed - 实际消耗token数
 * @property {number} surplus - 剩余token数
 * @property {string} status - 状态
 */

/**
 * 再平衡结果
 * @typedef {Object} RebalanceResult
 * @property {BudgetAllocation[]} allocations - 调整后的预算分配
 * @property {number} totalAllocated - 总分配token数
 * @property {number} totalConsumed - 总消耗token数
 * @property {number} totalSurplus - 总剩余token数
 * @property {number} deficitCount - 赤字任务数
 * @property {number} surplusCount - 盈余任务数
 */

/**
 * 对多个任务的预算进行动态再平衡
 * 
 * 从欠载任务回收预算，重新分配给溢出任务。
 * 保持总预算不变，提高整体利用率。
 * 
 * @param {Array<{taskName: string, budgetLevel: string, consumed: number, maxTokens?: number}>} tasks - 任务列表
 * @param {Object} [options] - 配置
 * @param {number} [options.maxTokens=4096] - 最大token数
 * @param {boolean} [options.adaptive=true] - 自适应模式
 * @param {number} [options.minAllocation=10] - 每个任务最少分配token数
 * @returns {RebalanceResult}
 * 
 * @example
 * const tasks = [
 *   { taskName: '翻译', budgetLevel: Budget.LOW, consumed: 95 },
 *   { taskName: '代码审查', budgetLevel: Budget.HIGH, consumed: 1200 }
 * ];
 * rebalanceBudgets(tasks);
 * // → { allocations: [...], totalAllocated: 1100, totalConsumed: 1295, ... }
 */
function rebalanceBudgets(tasks, options = {}) {
  const { maxTokens = 4096, adaptive = true, minAllocation = 10 } = options;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      allocations: [],
      totalAllocated: 0,
      totalConsumed: 0,
      totalSurplus: 0,
      deficitCount: 0,
      surplusCount: 0
    };
  }

  // 1. 计算每个任务的原始分配和实际消耗
  const allocations = tasks.map(task => {
    const budgetLevel = BUDGET_LEVELS.includes(task.budgetLevel)
      ? task.budgetLevel
      : Budget.MID;
    const allocated = resolveThinkingBudget(budgetLevel, { maxTokens, adaptive });
    const consumed = Math.max(0, task.consumed || 0);
    const surplus = allocated - consumed;

    return {
      taskName: task.taskName || '未命名',
      budgetLevel,
      allocated,
      consumed,
      surplus,
      overflow: consumed > allocated
    };
  });

  // 2. 分类：赤字任务 vs 盈余任务
  const deficitTasks = allocations.filter(a => a.surplus < 0);
  const surplusTasks = allocations.filter(a => a.surplus > 0);

  // 3. 计算总盈余
  const totalSurplus = surplusTasks.reduce((sum, t) => sum + t.surplus, 0);
  const totalDeficit = deficitTasks.reduce((sum, t) => sum + Math.abs(t.surplus), 0);

  // 4. 如果有盈余且存在赤字，进行再平衡
  if (totalSurplus > 0 && totalDeficit > 0) {
    // 按盈余比例分配
    const effectiveDeficit = Math.min(totalDeficit, totalSurplus);

    for (const deficit of deficitTasks) {
      const deficitAmount = Math.abs(deficit.surplus);
      // 从所有盈余任务按比例回收
      let reclaimed = 0;
      for (const surplus of surplusTasks) {
        const proportion = surplus.surplus / totalSurplus;
        const contribution = Math.min(
          Math.ceil(deficitAmount * proportion),
          surplus.surplus,
          deficitAmount - reclaimed
        );
        surplus.surplus -= contribution;
        reclaimed += contribution;
        if (reclaimed >= deficitAmount) break;
      }
      // 追加到赤字任务
      deficit.allocated += reclaimed;
      deficit.surplus = deficit.allocated - deficit.consumed;
    }
  }

  // 5. 确保最低分配
  for (const alloc of allocations) {
    if (alloc.allocated < minAllocation) {
      alloc.allocated = minAllocation;
      alloc.surplus = alloc.allocated - alloc.consumed;
    }
  }

  // 6. 统计
  const deficitCount = allocations.filter(a => a.surplus < 0).length;
  const surplusCount = allocations.filter(a => a.surplus > 0).length;
  const totalAllocated = allocations.reduce((s, a) => s + a.allocated, 0);
  const totalConsumed = allocations.reduce((s, a) => s + a.consumed, 0);
  const totalSurplusFinal = allocations.reduce((s, a) => s + a.surplus, 0);

  return {
    allocations,
    totalAllocated,
    totalConsumed,
    totalSurplus: totalSurplusFinal,
    deficitCount,
    surplusCount
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 检查文本是否超过token限制
 * @param {string} text - 待检查文本
 * @param {number} limit - token上限
 * @returns {boolean} true=超过限制
 */
function exceedsTokenLimit(text, limit) {
  return countTokens(text) > limit;
}

/**
 * 获取预算级别的描述
 * @param {string} budget - Budget枚举值
 * @param {Object} options - 配置选项
 * @returns {string} 描述字符串
 */
function getBudgetDescription(budget, options = {}) {
  const { maxTokens = 4096, adaptive = true } = options;
  const tokens = resolveThinkingBudget(budget, { maxTokens, adaptive });
  
  const modeDesc = adaptive 
    ? `${ADAPTIVE_BUDGET[budget] * 100}% of ${maxTokens}` 
    : 'fixed';
  
  return `[${budget}] ${tokens} tokens (${modeDesc})`;
}

/**
 * 获取预算级别的友好名称
 * @param {string} budget - Budget枚举值
 * @returns {string} 中文名称
 */
function getBudgetDisplayName(budget) {
  return BUDGET_NAMES[budget] || `未知预算: ${budget}`;
}

/**
 * 快速判断是否应该升级预算级别
 * @param {string} currentBudget - 当前预算级别
 * @param {number} actualTokens - 实际需要的token数
 * @param {Object} [options] - 配置
 * @returns {{ shouldUpgrade: boolean, recommendedBudget: string|null, reason: string }}
 */
function shouldUpgradeBudget(currentBudget, actualTokens, options = {}) {
  const { maxTokens = 4096, adaptive = true } = options;
  const currentAllocation = resolveThinkingBudget(currentBudget, { maxTokens, adaptive });

  if (actualTokens <= currentAllocation) {
    return {
      shouldUpgrade: false,
      recommendedBudget: null,
      reason: `当前预算 (${currentAllocation}) 足够容纳 ${actualTokens} tokens`
    };
  }

  // 找最合适的级别
  const currentOrder = BUDGET_ORDER[currentBudget];
  for (let i = currentOrder + 1; i < BUDGET_LEVELS.length; i++) {
    const level = BUDGET_LEVELS[i];
    const allocation = resolveThinkingBudget(level, { maxTokens, adaptive });
    if (allocation >= actualTokens) {
      return {
        shouldUpgrade: true,
        recommendedBudget: level,
        reason: `需要 ${actualTokens} tokens，推荐从 ${currentBudget} 升级到 ${level} (${allocation} tokens)`
      };
    }
  }

  return {
    shouldUpgrade: true,
    recommendedBudget: BUDGET_LEVELS[BUDGET_LEVELS.length - 1],
    reason: `即使最高预算也不足以容纳 ${actualTokens} tokens，但已推荐最高级别`
  };
}

/**
 * 比较两个预算级别的大小
 * @param {string} budgetA 
 * @param {string} budgetB 
 * @returns {number} -1 (A<B) | 0 (A===B) | 1 (A>B)
 */
function compareBudget(budgetA, budgetB) {
  const orderA = BUDGET_ORDER[budgetA];
  const orderB = BUDGET_ORDER[budgetB];
  if (orderA === undefined || orderB === undefined) {
    throw new Error(`compareBudget: 无效预算级别 "${budgetA}" 或 "${budgetB}"`);
  }
  if (orderA > orderB) return 1;
  if (orderA < orderB) return -1;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Budget 枚举与常量
  Budget,
  BudgetStatus,
  TruncateMode,
  BUDGET_LEVELS,
  BUDGET_ORDER,
  BUDGET_NAMES,
  
  // 固定/自适应预算映射
  FIXED_BUDGET,
  ADAPTIVE_BUDGET,
  
  // 核心函数
  countTokens,
  resolveThinkingBudget,
  
  // 预算验证与选择
  validateBudget,
  adjustBudget,
  autoSelectBudget,
  estimateTaskComplexity,
  
  // 智能截断
  truncateToBudget,
  
  // 预算追踪器
  BudgetTracker,
  
  // 再平衡
  rebalanceBudgets,
  
  // 辅助函数
  exceedsTokenLimit,
  getBudgetDescription,
  getBudgetDisplayName,
  shouldUpgradeBudget,
  compareBudget
};
