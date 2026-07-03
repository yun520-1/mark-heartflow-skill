/**
 * CodeSelfDebug — 代码自调试引擎（v1.0.0）
 *
 * LeDex 启发：通过解释-精炼链实现代码自调试
 * "A chain of explanations on the wrong code followed by code refinement helps LLMs better analyze the wrong code"
 *
 * 核心流程：
 * 1. 执行检测 → 捕获错误
 * 2. 错误解释 → 分析错误类型和原因
 * 3. 代码精炼 → 生成修复建议
 * 4. 验证修复 → 重新执行验证
 *
 * API:
 *   analyze(code, error)       — 分析错误
 *   suggestFix(code, error)    — 生成修复建议
 *   refine(code, error)        — 精炼代码（解释+修复）
 *   getErrorType(error)        — 错误分类
 */

// ============================================================================
// 错误分类器
// ============================================================================

const ERROR_PATTERNS = [
  { pattern: /SyntaxError|Unexpected token|Unexpected identifier|missing \)/i, type: 'syntax', severity: 0.9, label: '语法错误' },
  { pattern: /ReferenceError|is not defined|Cannot find module/i, type: 'reference', severity: 0.8, label: '引用错误' },
  { pattern: /TypeError|Cannot read propert|of undefined|of null/i, type: 'type', severity: 0.7, label: '类型错误' },
  { pattern: /RangeError|Maximum call stack|Invalid array length/i, type: 'range', severity: 0.6, label: '范围错误' },
  { pattern: /EACCES|EPERM|permission denied|Permission denied/i, type: 'permission', severity: 0.9, label: '权限错误' },
  { pattern: /ENOENT|no such file|No such file/i, type: 'notfound', severity: 0.7, label: '文件不存在' },
  { pattern: /ETIMEDOUT|timeout|ETIMEDOUT|Connection refused/i, type: 'timeout', severity: 0.6, label: '超时/连接' },
  { pattern: /SyntaxError:|IndentationError|TabError/i, type: 'indent', severity: 0.8, label: '缩进错误' },
  { pattern: /ImportError|ModuleNotFoundError|No module named/i, type: 'import', severity: 0.7, label: '导入错误' },
  { pattern: /AssertionError|expect|should be/i, type: 'assertion', severity: 0.5, label: '断言错误' },
  { pattern: /Error:|Error\(/i, type: 'runtime', severity: 0.5, label: '运行时错误' },
];

/**
 * 错误分类
 * @param {string|Error} error
 * @returns {object} { type, severity, label, description }
 */
function getErrorType(error) {
  const msg = error?.message || String(error) || '';
  for (const ep of ERROR_PATTERNS) {
    if (ep.pattern.test(msg)) {
      return {
        type: ep.type,
        severity: ep.severity,
        label: ep.label,
        description: _buildDescription(ep.type, msg),
      };
    }
  }
  return {
    type: 'unknown',
    severity: 0.3,
    label: '未知错误',
    description: msg.slice(0, 200),
  };
}

function _buildDescription(type, msg) {
  const templates = {
    syntax: '代码存在语法问题，检查括号、引号或关键字',
    reference: '使用了未定义的变量或函数',
    type: '对错误类型的值执行了操作（如对 undefined 调用方法）',
    range: '数值超出允许范围（如数组索引越界、递归过深）',
    permission: '缺乏必要的文件或系统权限',
    notfound: '尝试访问不存在的文件或路径',
    timeout: '操作超时或连接被拒绝',
    indent: '代码缩进不一致（Python）',
    import: '无法找到或加载所需的模块',
    assertion: '测试断言未通过',
    runtime: '运行时异常',
  };
  return templates[type] || '未分类错误';
}

// ============================================================================
// 修复建议生成器
// ============================================================================

const FIX_SUGGESTIONS = {
  syntax: (msg, code) => {
    const lineMatch = msg.match(/(\d+):(\d+)/);
    const line = lineMatch ? parseInt(lineMatch[2]) : '?';
    return `检查第 ${line} 行附近的语法：确认括号/引号匹配，关键字拼写正确。`;
  },
  reference: (msg, code) => {
    const varMatch = msg.match(/(\w+) is not defined/);
    const varName = varMatch ? varMatch[1] : '变量';
    return `"${varName}" 未定义。检查：1) 是否拼写错误 2) 是否在正确的作用域 3) 是否已导入/声明。`;
  },
  type: (msg, code) => {
    return '对 null/undefined 执行了操作。添加空值检查：使用可选链 (?.) 或提前返回。';
  },
  range: (msg, code) => {
    if (/call stack/i.test(msg)) return '递归深度过大。检查递归终止条件，或改用迭代。';
    return '数组索引越界或数值超出范围。检查边界条件。';
  },
  permission: () => '检查文件权限。可能需要 sudo 或将文件移到用户目录。',
  notfound: () => '检查文件路径是否正确。使用绝对路径或确认相对路径基准。',
  timeout: () => '操作耗时过长。考虑增加超时时间、优化算法或添加异步处理。',
  indent: () => '统一使用空格或 Tab，不要混用。推荐 4 空格缩进。',
  import: (msg) => {
    const modMatch = msg.match(/No module named ['"]([^'"]+)['"]/);
    const mod = modMatch ? modMatch[1] : '模块';
    return `"${mod}" 未安装。运行: npm install ${mod}（或 pip install / cargo add 等）`;
  },
  runtime: (msg) => `运行时错误：${msg.slice(0, 100)}。添加 try-catch 或检查输入合法性。`,
};

// ============================================================================
// 主类
// ============================================================================

class CodeSelfDebug {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this._history = [];
  }

  /**
   * 分析代码错误
   * @param {string} code - 原始代码
   * @param {string|Error} error - 错误信息
   * @returns {object} 分析结果
   */
  analyze(code, error) {
    const errorInfo = getErrorType(error);
    const analysis = {
      errorType: errorInfo.type,
      errorLabel: errorInfo.label,
      severity: errorInfo.severity,
      description: errorInfo.description,
      rawMessage: error?.message || String(error),
      codeSnippet: this._extractSnippet(code, error),
      fixable: errorInfo.severity >= 0.5,
      retryCount: 0,
    };

    this._history.push({
      timestamp: Date.now(),
      code: code.slice(0, 200),
      error: errorInfo.type,
      action: 'analyze',
    });

    return analysis;
  }

  /**
   * 生成修复建议
   * @param {string} code - 原始代码
   * @param {string|Error} error - 错误信息
   * @returns {object} 修复建议
   */
  suggestFix(code, error) {
    const analysis = this.analyze(code, error);
    const errorInfo = getErrorType(error);
    const fixer = FIX_SUGGESTIONS[errorInfo.type] || FIX_SUGGESTIONS.runtime;
    const suggestion = fixer(error?.message || String(error), code);

    return {
      ...analysis,
      suggestion,
      confidence: Math.min(0.9, errorInfo.severity + 0.2),
      canRetry: analysis.fixable && this._history.filter(h => h.error === errorInfo.type).length < this.maxRetries,
    };
  }

  /**
   * 精炼代码：解释错误 + 生成修复代码（LeDex 解释-精炼链）
   * @param {string} code - 原始代码
   * @param {string|Error} error - 错误信息
   * @returns {object} 精炼结果
   */
  refine(code, error) {
    const analysis = this.analyze(code, error);
    const suggestion = this.suggestFix(code, error);

    // 构建解释-精炼链
    const explanationChain = [
      `[1/3] 错误类型: ${analysis.errorLabel} (${analysis.errorType})`,
      `[2/3] 原因分析: ${analysis.description}`,
      `[3/3] 修复建议: ${suggestion.suggestion}`,
    ];

    const result = {
      ...analysis,
      suggestion: suggestion.suggestion,
      explanationChain,
      confidence: suggestion.confidence,
      canRetry: suggestion.canRetry,
      retryCount: this._history.filter(h => h.error === analysis.errorType).length,
    };

    this._history.push({
      timestamp: Date.now(),
      code: code.slice(0, 200),
      error: analysis.errorType,
      action: 'refine',
    });

    return result;
  }

  /**
   * 完整调试流程：分析 → 精炼 → 验证建议
   * @param {string} code - 代码
   * @param {string|Error} error - 错误
   * @param {string} [language] - 语言类型
   * @returns {object} 调试报告
   */
  debug(code, error, language = 'javascript') {
    const refine = this.refine(code, error);

    return {
      summary: refine.explanationChain.join('\n'),
      errorType: refine.errorType,
      errorLabel: refine.errorLabel,
      severity: refine.severity,
      suggestion: refine.suggestion,
      confidence: refine.confidence,
      canRetry: refine.canRetry,
      retryCount: refine.retryCount,
      maxRetries: this.maxRetries,
      language,
      recommendation: refine.canRetry
        ? '建议自动重试（已应用修复建议）'
        : `已达到最大重试次数 (${this.maxRetries})，建议人工介入`,
    };
  }

  /**
   * 从执行结果中提取代码片段
   */
  _extractSnippet(code, error) {
    if (!code) return '';
    const msg = error?.message || String(error);
    const lineMatch = msg.match(/line\s+(\d+)/i) || msg.match(/(\d+):(\d+)/);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[lineMatch.length - 1]);
      const lines = code.split('\n');
      const start = Math.max(0, lineNum - 3);
      const end = Math.min(lines.length, lineNum + 2);
      return lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
    }
    return code.slice(0, 300);
  }

  /**
   * 获取调试历史
   */
  getHistory() {
    return {
      total: this._history.length,
      recent: this._history.slice(-10),
      byErrorType: this._history.reduce((acc, h) => {
        acc[h.error] = (acc[h.error] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  /**
   * 清空历史
   */
  reset() {
    this._history = [];
    return this;
  }
}

module.exports = { CodeSelfDebug, getErrorType, FIX_SUGGESTIONS };
