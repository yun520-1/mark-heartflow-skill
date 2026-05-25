/**
 * HeartFlow Budget Manager — Token计数与思考预算管理
 * 
 * 吸收来源：hindsight Budget+token计数逻辑
 * 
 * 功能清单：
 * 1. countTokens(text)           - cl100k_base编码估算（不依赖外部库）
 * 2. Budget 枚举                 - LOW/MID/HIGH 三级预算
 * 3. resolveThinkingBudget()     - 根据预算级别解析token数
 * 4. adaptive/fixed 预算模式     - 自适应(百分比) or 固定token数
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Budget 枚举
// ═══════════════════════════════════════════════════════════════════════════════

const Budget = {
  LOW: 'LOW',
  MID: 'MID',
  HIGH: 'HIGH'
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
// 3. resolveThinkingBudget - 根据预算级别解析token数
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 根据预算级别和模式解析思考预算token数
 * 
 * @param {string} budget - Budget枚举值：Budget.LOW | Budget.MID | Budget.HIGH
 * @param {Object} options - 配置选项
 * @param {number} options.maxTokens - 最大token数（自适应模式用）
 * @param {boolean} options.adaptive - true=自适应模式(百分比), false=固定模式
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
  const { maxTokens = 4096, adaptive = true } = options;

  if (!Object.values(Budget).includes(budget)) {
    throw new Error(`Invalid budget level: ${budget}. Expected one of: ${Object.values(Budget).join(', ')}`);
  }

  if (adaptive) {
    // 自适应模式：按百分比
    const ratio = ADAPTIVE_BUDGET[budget];
    return Math.ceil(maxTokens * ratio);
  } else {
    // 固定模式
    return FIXED_BUDGET[budget];
  }
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

// ═══════════════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Budget 枚举
  Budget,
  
  // 固定/自适应预算映射
  FIXED_BUDGET,
  ADAPTIVE_BUDGET,
  
  // 核心函数
  countTokens,
  resolveThinkingBudget,
  
  // 辅助函数
  exceedsTokenLimit,
  getBudgetDescription
};
