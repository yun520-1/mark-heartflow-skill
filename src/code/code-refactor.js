/**
 * CodeRefactor — 代码重构引擎
 *
 * 三层能力：
 *   检测（Detect） → 发现重构机会
 *   变换（Transform） → 安全应用已知重构模式
 *   学习（Learn） → 追踪重构历史，优化建议
 *
 * 深度集成 HeartFlow code 子系统，与 CodeKnowledge / CodeEngine / CodeVerifier 互补。
 * 重构变换聚焦 JS/TS/Python，不依赖外部 parser，使用正则 + 结构分析。
 *
 * @author HeartFlow
 * @version 2.0.0
 */

const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// 重构模式定义
// ═══════════════════════════════════════════════════════════════════════════════

const REFACTORING_PATTERNS = {
  // ─── 提取常量 ──────────────────────────────────────────────
  'extract-constant': {
    name: '提取常量',
    description: '将魔法数字/字符串替换为命名常量',
    severity: 'info',
    languages: ['javascript', 'typescript', 'python'],
    confidence: 'medium',
  },
  // ─── var → let/const ──────────────────────────────────────
  'var-to-let': {
    name: 'var → let/const',
    description: '将 var 声明替换为 let 或 const（按是否重新赋值）',
    severity: 'low',
    languages: ['javascript', 'typescript'],
    confidence: 'high',
  },
  // ─── 匿名函数命名化 ──────────────────────────────────────
  'name-anonymous': {
    name: '匿名函数命名',
    description: '为回调/事件处理器中的匿名函数添加名称，改善堆栈追踪',
    severity: 'info',
    languages: ['javascript', 'typescript'],
    confidence: 'medium',
  },
  // ─── 简化三元表达式 ──────────────────────────────────────────
  'simplify-ternary': {
    name: '简化三元表达式',
    description: '将适合 if/else 的三元表达式转为可读性更好的分支',
    severity: 'info',
    languages: ['javascript', 'typescript', 'python'],
    confidence: 'low',  // 三元的可读性取决于上下文，低置信度
  },
  // ─── 提取重复表达式 ──────────────────────────────────────────
  'extract-expression': {
    name: '提取重复表达式',
    description: '将重复出现的复杂表达式提取为中间变量',
    severity: 'medium',
    languages: ['javascript', 'typescript', 'python'],
    confidence: 'medium',
  },
  // ─── 箭头函数转换 ────────────────────────────────────────
  'arrow-function': {
    name: '函数表达式 → 箭头函数',
    description: '将 function() {} 表达式转换为箭头函数 () => {}',
    severity: 'info',
    languages: ['javascript', 'typescript'],
    confidence: 'medium',
  },
  // ─── 解构赋值 ────────────────────────────────────────────
  'destructure': {
    name: '解构赋值',
    description: '将连续 obj.prop 访问替换为解构赋值',
    severity: 'info',
    languages: ['javascript', 'typescript'],
    confidence: 'medium',
  },
  // ─── 模板字面量 ──────────────────────────────────────────
  'template-literal': {
    name: '字符串拼接 → 模板字面量',
    description: '将 "a" + expr + "b" 替换为模板字面量 `a${expr}b`',
    severity: 'info',
    languages: ['javascript', 'typescript'],
    confidence: 'medium',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CodeRefactor 类
// ═══════════════════════════════════════════════════════════════════════════════

class CodeRefactor {

  /**
   * @param {Object} opts
   * @param {Object} opts.hf - HeartFlow 实例（可选）
   */
  constructor({ hf } = {}) {
    this.hf = hf;
    /** @type {Array<{id, type, code, language, before, after, timestamp, success}>} */
    this.history = [];
    this._dirty = false;
    this.historyFile = null;

    if (hf && hf.rootPath) {
      this.dataDir = path.join(hf.rootPath, 'data/code-refactor');
      this.historyFile = path.join(this.dataDir, 'history.json');
      this._loadHistory();
    }
  }

  // ─── 内部工具 ─────────────────────────────────────────────────

  _loadHistory() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.historyFile)) {
        this.history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      }
    } catch (e) {
      this.history = [];
    }
  }

  _saveHistory() {
    if (!this.historyFile) return;
    try {
      const fs = require('fs');
      fs.mkdirSync(path.dirname(this.historyFile), { recursive: true });
      const tmp = this.historyFile + '.tmp.' + Date.now();
      fs.writeFileSync(tmp, JSON.stringify(this.history, null, 2), 'utf8');
      fs.renameSync(tmp, this.historyFile);
    } catch (e) { /* 历史记录写入失败不影响主流程 */ }
  }

  _record({ type, code, language, before, after, success, note }) {
    const entry = {
      id: `refactor-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type,
      language,
      code: code.slice(0, 500),
      beforeLen: before ? before.length : 0,
      afterLen: after ? after.length : 0,
      timestamp: new Date().toISOString(),
      success,
      note: note || '',
    };
    this.history.push(entry);
    this._saveHistory();
    return entry;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. 重构机会检测
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 检测代码中的重构机会
   *
   * @param {string} code - 源代码
   * @param {string} [language='javascript'] - 编程语言
   * @param {Object} [opts={}]
   * @param {boolean} [opts.includeAutoFixable] - 是否标记可自动修复项
   * @returns {{ opportunities: Array<{type, name, severity, line, message, suggestion, autoFixable?}>, summary: Object }}
   */
  detect(code, language = 'javascript', opts = {}) {
    if (!code || typeof code !== 'string') {
      return { opportunities: [], summary: { total: 0, bySeverity: {} } };
    }

    const lang = language.toLowerCase();
    const opportunities = [];
    const lines = code.split('\n');
    const lineCount = lines.length;

    // ─── 检测 1: 魔法数字/字符串 ──────────────────────────────
    this._detectMagicNumbers(code, lines, lang, opportunities);

    // ─── 检测 2: var 声明（JS/TS） ──────────────────────────────
    if (lang === 'javascript' || lang === 'typescript') {
      this._detectVarDeclarations(code, lines, opportunities);
    }

    // ─── 检测 3: 长度超标函数 ────────────────────────────────
    this._detectLongFunctions(code, lines, lang, opportunities);

    // ─── 检测 4: 深层嵌套 ──────────────────────────────────────
    this._detectDeepNesting(code, lines, opportunities);

    // ─── 检测 5: 参数过多的函数 ──────────────────────────────────
    this._detectLongParams(code, lines, lang, opportunities);

    // ─── 检测 6: 重复代码块（简单近似） ──────────────────────────
    this._detectDuplicates(code, lines, opportunities);

    // ─── 检测 7: 复杂条件式 ────────────────────────────────────
    this._detectComplexConditions(code, lines, lang, opportunities);

    // ─── 构建摘要 ──────────────────────────────────────────────
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const opp of opportunities) {
      bySeverity[opp.severity] = (bySeverity[opp.severity] || 0) + 1;
      if (opts.includeAutoFixable && this._isAutoFixable(opp.type, lang)) {
        opp.autoFixable = true;
      }
    }

    return {
      opportunities,
      summary: {
        total: opportunities.length,
        bySeverity,
        score: this._calculateRefactorScore(opportunities, lineCount),
      },
      meta: { language: lang, lineCount },
    };
  }

  // ─── 各检测函数 ─────────────────────────────────────────────

  /**
   * 检测魔法数字（未命名的字面量数值/字符串）
   */
  _detectMagicNumbers(code, lines, lang, opportunities) {
    // 仅检测函数体外的顶层字面量，排除 0/1/-1/null/true/false/空字符串
    const magicNumberPattern = /(?<!=)\s(-?\d+(?:\.\d+)?)(?!=)\s*[;,\n\r)]/g;
    const magicStringPattern = /['"]([^'"]{3,})['"]\s*[;]/g;

    let match;
    const seenNumbers = new Set();
    while ((match = magicNumberPattern.exec(code)) !== null) {
      const val = match[1];
      // 排除常见的"合法"魔法数字
      if (['0', '1', '-1', '1.0', '0.5', '100', '1000'].includes(val)) continue;
      if (seenNumbers.has(val)) continue;
      seenNumbers.add(val);

      const lineNo = code.slice(0, match.index).split('\n').length;
      // 只在声明/计算表达式中标记，不在 return/条件中
      const context = code.slice(Math.max(0, match.index - 60), match.index + 20);
      if (/const\s+|let\s+|\+\s*|=|===/.test(context)) {
        opportunities.push({
          type: 'magic-number',
          name: '魔法数字',
          severity: 'low',
          line: lineNo,
          code: val,
          message: `未命名的字面量 "${val}"，建议提取为命名常量`,
          pattern: 'extract-constant',
          suggestion: `const ${this._suggestConstantName(val, lang)} = ${val};`,
        });
      }
    }
  }

  /**
   * 检测 var 声明
   */
  _detectVarDeclarations(code, lines, opportunities) {
    const pattern = /\bvar\s+(\w+)\s*=/g;
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const lineNo = code.slice(0, match.index).split('\n').length;
      opportunities.push({
        type: 'var-declaration',
        name: 'var 声明',
        severity: 'low',
        line: lineNo,
        code: match[0],
        message: `var 声明 "${match[1]}" 建议替换为 let 或 const`,
        pattern: 'var-to-let',
        suggestion: `const ${match[1]} = `,
      });
    }
  }

  /**
   * 检测过长函数
   */
  _detectLongFunctions(code, lines, lang, opportunities) {
    const fnStartPatterns = {
      javascript: /(?:async\s+)?function\s+\w*\s*\(|=>\s*\{|const\s+\w+\s*=\s*(?:async\s+)?\(/g,
      typescript: /(?:async\s+)?function\s+\w*\s*\(|=>\s*\{|const\s+\w+\s*=\s*(?:async\s+)?\(/g,
      python: /def\s+\w+\s*\(/gm,
    };

    const fnPattern = fnStartPatterns[lang] || fnStartPatterns.javascript;
    const regex = new RegExp(fnPattern.source, fnPattern.flags);
    let match;

    while ((match = regex.exec(code)) !== null) {
      const startLine = code.slice(0, match.index).split('\n').length;
      const rest = code.slice(match.index);
      let depth = 0;
      let endIdx = -1;

      // 找到函数体开始
      const bodyStart = rest.indexOf('{');
      if (bodyStart === -1) continue;

      for (let i = bodyStart; i < rest.length; i++) {
        if (rest[i] === '{') depth++;
        if (rest[i] === '}') {
          depth--;
          if (depth === 0) { endIdx = i; break; }
        }
      }

      if (endIdx > 0) {
        const fnBody = rest.slice(0, endIdx + 1);
        const fnLines = fnBody.split('\n').length;
        if (fnLines > 50) {
          const fnName = match[0].replace('async ', '').replace('function ', '').replace('const ', '').replace('=', '').trim() || '匿名函数';
          opportunities.push({
            type: 'long-function',
            name: '函数过长',
            severity: 'medium',
            line: startLine,
            code: fnName,
            message: `函数 "${fnName}" 共 ${fnLines} 行（建议 ≤50 行）`,
            pattern: null,
            suggestion: `考虑将 ${fnName} 拆分为多个职责单一的子函数`,
            fnLines,
          });
        }
      }
    }
  }

  /**
   * 检测深层嵌套
   */
  _detectDeepNesting(code, lines, opportunities) {
    let maxDepth = 0;
    let maxDepthLine = 0;
    let currentDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/{$|\({$|\($/.test(trimmed) || /^\s*(if|for|while|switch|try|catch|function)\b/.test(trimmed)) {
        currentDepth++;
        if (currentDepth > maxDepth) {
          maxDepth = currentDepth;
          maxDepthLine = i + 1;
        }
      } else if (/^\s*\}\s*\)?\s*$|^\s*\)\s*$/.test(trimmed)) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    if (maxDepth > 4) {
      opportunities.push({
        type: 'deep-nesting',
        name: '嵌套过深',
        severity: 'high',
        line: maxDepthLine,
        code: `嵌套深度 ${maxDepth} 层`,
        message: `代码嵌套深度 ${maxDepth} 层（建议 ≤4 层）`,
        pattern: null,
        suggestion: '使用提前返回（guard clause）或提取子函数减少嵌套',
        depth: maxDepth,
      });
    }
  }

  /**
   * 检测参数过多的函数
   */
  _detectLongParams(code, lines, lang, opportunities) {
    const paramPattern = /(?:function|def|fn)\s+\w+\s*\(([^)]+)\)/g;
    let match;
    while ((match = paramPattern.exec(code)) !== null) {
      const params = match[1].split(',').filter(p => p.trim());
      if (params.length > 5) {
        const lineNo = code.slice(0, match.index).split('\n').length;
        opportunities.push({
          type: 'too-many-params',
          name: '参数过多',
          severity: 'medium',
          line: lineNo,
          code: `(${params.map(p => p.trim().split(':')[0].split('=')[0].trim()).join(', ')})`,
          message: `函数有 ${params.length} 个参数（建议 ≤5 个）`,
          pattern: null,
          suggestion: '考虑将相关参数封装为对象/配置参数',
          paramCount: params.length,
        });
      }
    }
  }

  /**
   * 检测重复代码块（简单 N-gram 近似）
   */
  _detectDuplicates(code, lines, opportunities) {
    // 跳过短代码
    if (lines.length < 10) return;

    // 查找 4 行以上完全相同的代码块（去空白后）
    const normalized = lines.map(l => l.trim());
    const seen = new Map(); // lineText → [firstLineNo]

    for (let i = 0; i < normalized.length; i++) {
      const line = normalized[i];
      if (line === '' || /^[{}]\s*$/.test(line) || /^\s*\/\//.test(lines[i]) || /^\s*\/\*/.test(lines[i])) continue;

      if (seen.has(line)) {
        seen.get(line).push(i);
      } else {
        seen.set(line, [i]);
      }
    }

    // 报告至少重复 3 次且非空的行
    for (const [lineText, occ] of seen) {
      if (occ.length >= 3 && lineText.length > 15 && !lineText.includes('import') && !lineText.includes('require')) {
        opportunities.push({
          type: 'duplicate-code',
          name: '重复代码',
          severity: 'medium',
          line: occ[0] + 1,
          code: lineText.slice(0, 60),
          message: `代码行在 ${occ.length} 个位置重复（行 ${occ.map(i => i + 1).join(', ')}）`,
          pattern: null,
          suggestion: '提取重复代码为可复用的函数或变量',
          occurrences: occ.length,
        });
      }
    }
  }

  /**
   * 检测复杂条件式
   */
  _detectComplexConditions(code, lines, lang, opportunities) {
    // 检测超过 3 个子条件的 if/else if 链
    const complexIf = /^\s*(?:if|elif|else if)\s*\(([^)]{80,})\)/gm;
    let match;
    while ((match = complexIf.exec(code)) !== null) {
      const lineNo = code.slice(0, match.index).split('\n').length;
      const condLen = match[1].length;
      opportunities.push({
        type: 'complex-condition',
        name: '条件过于复杂',
        severity: 'medium',
        line: lineNo,
        code: match[1].slice(0, 60) + '...',
        message: `条件表达式 ${condLen} 字符过长，包含多个逻辑运算符`,
        pattern: null,
        suggestion: '将复杂条件拆分为多个命名布尔变量（如 isExpired, isEligible）',
        conditionLength: condLen,
      });
    }
  }

  /**
   * 判断是否可自动修复
   */
  _isAutoFixable(type, lang) {
    const autoFixableTypes = [
      'magic-number', 'var-declaration',
      'arrow-function', 'destructure', 'template-literal',
    ];
    return autoFixableTypes.includes(type);
  }

  /**
   * 生成代码重构得分（0-100，越高越需要重构）
   */
  _calculateRefactorScore(opportunities, lineCount) {
    if (opportunities.length === 0) return 0;
    const weight = { critical: 10, high: 6, medium: 3, low: 1, info: 0.5 };
    let score = 0;
    for (const opp of opportunities) {
      score += weight[opp.severity] || 1;
    }
    // 归一化到 0-100
    const normalized = Math.min(100, Math.round((score / Math.max(lineCount, 1)) * 100));
    return normalized;
  }

  /**
   * 为魔法值建议常量名
   */
  _suggestConstantName(value, lang) {
    const clean = value.replace(/[^a-zA-Z0-9_]/g, '_');
    if (lang === 'python') {
      return clean.toUpperCase();
    }
    // JS/TS: MAX_RETRIES, DEFAULT_TIMEOUT 等
    return clean.toUpperCase();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. 代码变换执行
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 应用重构变换到代码
   *
   * @param {string} code - 源代码
   * @param {string} type - 变换类型（见 apply 方法列表）
   * @param {Object} [options={}]
   * @param {string} [options.language='javascript']
   * @param {number} [options.line] - 要变换的行号（可选，不指定则全局变换）
   * @returns {{ success: boolean, code: string, changes: Array, error?: string }}
   */
  transform(code, type, options = {}) {
    const lang = (options.language || 'javascript').toLowerCase();
    const transformers = {
      'var-to-let': () => this._transformVarToLet(code, lang),
      'extract-constant': () => this._transformExtractConstant(code, lang, options),
      'arrow-function': () => this._transformArrowFunction(code, lang),
      'destructure': () => this._transformDestructure(code, lang),
      'template-literal': () => this._transformTemplateLiteral(code, lang),
    };

    const transformer = transformers[type];
    if (!transformer) {
      return {
        success: false,
        code,
        changes: [],
        error: `不支持的变换类型: "${type}"`,
      };
    }

    try {
      const result = transformer();
      this._record({
        type,
        code,
        language: lang,
        before: code,
        after: result.code,
        success: result.success,
        note: `${result.changes.length} 处变更`,
      });
      return result;
    } catch (e) {
      return {
        success: false,
        code,
        changes: [],
        error: e.message,
      };
    }
  }

  /**
   * 变换: var → let/const
   */
  _transformVarToLet(code, lang) {
    const changes = [];
    const varPattern = /\bvar\s+(\w+)\s*=/g;

    // 查找所有 var 声明，检查是否重新赋值
    const vars = [];
    let match;
    while ((match = varPattern.exec(code)) !== null) {
      const name = match[1];
      const line = code.slice(0, match.index).split('\n').length;
      vars.push({ name, index: match.index, line, match: match[0] });
    }

    if (vars.length === 0) {
      return { success: true, code, changes: [] };
    }

    let result = code;
    for (const v of vars) {
      // 检查该变量是否被重新赋值
      const reassignPattern = new RegExp('\\b' + v.name + '\\s*=(?!=)', 'g');
      let reassignCount = 0;
      let rm;
      while ((rm = reassignPattern.exec(code)) !== null) {
        // 排除声明本身
        if (rm.index !== v.index) reassignCount++;
      }

      const replacement = reassignCount > 0 ? 'let' : 'const';
      // 替换第一个 var → replacement
      result = result.slice(0, v.index) + result.slice(v.index).replace(/\bvar\b/, replacement);
      changes.push({
        type: 'var-to-let',
        name: v.name,
        line: v.line,
        replacement,
      });
    }

    return { success: true, code: result, changes };
  }

  /**
   * 变换: 提取常量（按行号提取指定的魔法数字）
   */
  _transformExtractConstant(code, lang, options) {
    if (!options.line) {
      return { success: false, code, changes: [], error: '提取常量需要指定行号' };
    }

    const lines = code.split('\n');
    const targetIdx = options.line - 1;
    if (targetIdx < 0 || targetIdx >= lines.length) {
      return { success: false, code, changes: [], error: `行号越界: ${options.line}` };
    }

    const line = lines[targetIdx];
    const match = line.match(/(?<!=)\s*(-?\d+(?:\.\d+)?)(?!=)\s*[;,\n\r)]/);

    if (!match) {
      return { success: false, code, changes: [], error: `第 ${options.line} 行未发现可提取的魔法数字` };
    }

    const value = match[1];
    const constName = this._suggestConstantName(value, lang);
    const indent = line.match(/^\s*/)[0];
    const constLine = `${indent}const ${constName} = ${value};`;
    const replacedLine = line.replace(new RegExp(value.replace('.', '\\.')), constName);

    lines[targetIdx] = replacedLine;
    // 在行上方插入常量声明
    lines.splice(targetIdx, 0, constLine);

    return {
      success: true,
      code: lines.join('\n'),
      changes: [{
        type: 'extract-constant',
        line: options.line,
        constName,
        value,
      }],
    };
  }

  /**
   * 变换: 函数表达式 → 箭头函数
   * 将 `function() { ... }` 转换为 `() => { ... }`
   * 注意到函数内如果使用了 this/arguments，跳过转换
   */
  _transformArrowFunction(code, lang) {
    if (lang !== 'javascript' && lang !== 'typescript') {
      return { success: false, code, changes: [], error: `箭头函数变换不支持语言: ${lang}` };
    }

    const changes = [];
    const fnExprPattern = /(?<!=)\b(function)\s*\(([^)]*)\)\s*\{/g;
    let result = code;
    let offset = 0;

    let match;
    while ((match = fnExprPattern.exec(code)) !== null) {
      const fullMatch = match[0];
      const startIdx = match.index;

      // 排除 async function 和 function 声明（行首开始）
      const lineStart = code.lastIndexOf('\n', startIdx - 1) + 1;
      const beforeText = code.slice(lineStart, startIdx).trim();

      // 跳过已命中 async 的 function
      if (beforeText.endsWith('async ')) continue;

      // 检查是否是函数声明（以 function 开头或前面有 export）
      if (beforeText === '' || /^\s*(export\s+)?(async\s+)?function\s+\w/.test(code.slice(lineStart, startIdx + match[1].length + 15))) {
        continue;
      }

      // 找到函数体范围
      let depth = 0;
      let bodyEnd = -1;
      const bodyStart = startIdx + fullMatch.indexOf('{');
      for (let i = bodyStart; i < code.length; i++) {
        if (code[i] === '{') depth++;
        if (code[i] === '}') {
          depth--;
          if (depth === 0) { bodyEnd = i + 1; break; }
        }
      }
      if (bodyEnd === -1) continue;

      const body = code.slice(bodyStart, bodyEnd);

      // 检查是否使用了 this/arguments（需要绑定则不转换）
      const bodyWithoutStr = body.replace(/['"`].*?['"`]/g, '');
      if (/\bthis\b/.test(bodyWithoutStr) || /\barguments\b/.test(bodyWithoutStr)) continue;

      // 获取参数列表
      const params = match[2].trim();

      // 构建箭头函数
      const indent = body.match(/^(\s*)/)[1];
      const arrowFn = params
        ? `(${params}) => ${body}`
        : `() => ${body}`;

      // 替换原代码中的函数表达式部分
      const beforeReplacement = result.slice(0, startIdx + offset);
      const afterReplacement = result.slice(bodyEnd + offset);
      result = beforeReplacement + arrowFn + afterReplacement;
      offset += arrowFn.length - (bodyEnd - startIdx);

      const lineNo = code.slice(0, startIdx).split('\n').length;
      changes.push({
        type: 'arrow-function',
        line: lineNo,
        params: params || 'none',
      });
    }

    return { success: true, code: result, changes };
  }

  /**
   * 变换: 解构赋值
   * 将连续出现的 `obj.prop1`, `obj.prop2` 转换为 `const { prop1, prop2 } = obj;`
   */
  _transformDestructure(code, lang) {
    const changes = [];
    const lines = code.split('\n');

    // 检测同一对象连续属性访问模式
    // 模式: const foo = obj.a; const bar = obj.b; ...
    const pattern = /^\s*(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\.(\w+)\s*;?\s*$/;
    const grouped = []; // [{ base, props: [{varName, propName, lineIdx}] }]

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(pattern);
      if (!m) continue;

      const varName = m[1];
      const baseObj = m[2];
      const propName = m[3];

      if (baseObj === 'this') continue;

      // 检查上一次分组是否是同一对象
      const lastGroup = grouped[grouped.length - 1];
      if (lastGroup && lastGroup.base === baseObj && i - lastGroup.lastLineIdx <= 2) {
        lastGroup.props.push({ varName, propName, lineIdx: i });
        lastGroup.lastLineIdx = i;
      } else {
        grouped.push({ base: baseObj, props: [{ varName, propName, lineIdx: i }], lastLineIdx: i, firstLineIdx: i });
      }
    }

    // 只处理连续 3 个以上属性访问的分组
    const eligible = grouped.filter(g => g.props.length >= 3);
    if (eligible.length === 0) {
      return { success: true, code, changes: [] };
    }

    let result = code;
    // 从后往前替换，避免行号偏移
    for (const group of eligible.reverse()) {
      const firstIdx = group.firstLineIdx;
      const linesArr = result.split('\n');

      // 标记这些行为空
      for (const prop of group.props) {
        linesArr[prop.lineIdx] = '';
      }

      const indent = lines[firstIdx].match(/^\s*/)[0];
      const propNames = group.props.map(p => p.propName);
      const varNames = group.props.map(p => p.varName);

      const destLine = `${indent}const { ${propNames.join(', ')} } = ${group.base};`;
      linesArr[firstIdx] = destLine;

      result = linesArr.filter(l => l !== '').join('\n');
      changes.push({
        type: 'destructure',
        line: firstIdx + 1,
        base: group.base,
        props: propNames,
        variables: varNames,
      });
    }

    // 只保留原始 lines 用于 line number 报告
    return { success: true, code: result, changes };
  }

  /**
   * 变换: 字符串拼接 → 模板字面量
   * 将 'a' + var + 'b' 转换为 `a${var}b`
   */
  _transformTemplateLiteral(code, lang) {
    if (lang !== 'javascript' && lang !== 'typescript') {
      return { success: false, code, changes: [], error: `模板字面量变换不支持语言: ${lang}` };
    }

    const changes = [];
    const concatPattern = /(['"`])((?:(?!\1).)*)\1\s*\+(\s*(['"`])((?:(?!\4).)*)\4\s*(?:\+|$))+/g;

    // 简化处理：查找单行中的字符串拼接模式
    const lines = code.split('\n');
    let result = '';
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 跳过已用模板字面量的行和注释行
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) {
        result += line + '\n';
        continue;
      }

      // 检测字符串拼接模式：至少包含一个字符串+变量+字符串的模式
      const templateCandidate = line.match(/(['"])((?:[^'"]|\\.)*)\1\s*\+\s*(\w[\w.]*)\s*\+\s*(['"])((?:[^'"]|\\.)*)\4/);
      if (!templateCandidate) {
        result += line + '\n';
        continue;
      }

      // 使用正则将整个拼接表达式替换为模板字面量
      // 策略：逐段解析拼接链
      let transformed = line;
      const concatChain = /(?:'[^']*'|"[^"]*"|\w[\w.]*(?:\s*\([^)]*\))?)\s*\+\s*(?:(?:'[^']*'|"[^"]*"|\w[\w.]*(?:\s*\([^)]*\))?)\s*\+?\s*)+/g;

      transformed = transformed.replace(concatChain, (matchChain) => {
        // 将 "a" + b + "c" 转换成 `a${b}c`
        const parts = [];
        let remaining = matchChain;
        const partPattern = /(['"])((?:(?!\1).)*)\1|(\w[\w.]*(?:\s*\([^)]*\))?)\s*/g;
        let partMatch;
        while ((partMatch = partPattern.exec(remaining)) !== null) {
          if (partMatch[1] !== undefined) {
            // 字符串字面量
            parts.push({ type: 'string', value: partMatch[2] });
          } else if (partMatch[3] !== undefined && partMatch[3] !== '+') {
            // 变量/表达式
            parts.push({ type: 'expr', value: partMatch[3].trim() });
          }
        }

        // 跳过纯字符串的拼接（无需模板化）
        if (parts.every(p => p.type === 'string')) return matchChain;

        // 构建模板字面量
        let template = '`';
        for (let p = 0; p < parts.length; p++) {
          const part = parts[p];
          if (part.type === 'string') {
            // 字符串内容中需要转义 `${` 和 ``
            const escaped = part.value
              .replace(/`/g, '\\`')
              .replace(/\$\{/g, '\\${');
            template += escaped;
          } else {
            template += `${part.value}`;
          }
        }
        template += '`';

        // 验证模板与原始表达式计算结果不同时才转换（避免 $${ 误转）
        // 简化处理：直接返回
        return template;
      });

      if (transformed !== line) {
        changed = true;
        changes.push({
          type: 'template-literal',
          line: i + 1,
          before: line.trim(),
          after: transformed.trim(),
        });
      }
      result += transformed + '\n';
    }

    return {
      success: true,
      code: result.replace(/\n$/, ''),
      changes,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. 重构建议（用于需要 LLM 参与的复杂重构）
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 生成详细的重构建议
   *
   * 对检测结果进行排名，按严重程度 + 可操作性排序，
   * 并为每一条生成可执行的重构策略文本。
   *
   * @param {string} code - 源代码
   * @param {string} [language='javascript']
   * @param {Object} [opts={}]
   * @returns {{ suggestions: Array, priority: string, score: number }}
   */
  suggest(code, language = 'javascript', opts = {}) {
    const { opportunities, summary } = this.detect(code, language, { includeAutoFixable: true });

    // 按严重性权重 + 行号排序
    const severityWeight = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
    const sorted = [...opportunities].sort((a, b) => {
      const wa = severityWeight[a.severity] || 0;
      const wb = severityWeight[b.severity] || 0;
      if (wa !== wb) return wb - wa;
      return (a.line || 0) - (b.line || 0);
    });

    // 生成优先级标签
    const hasCriticalOrHigh = sorted.some(o => o.severity === 'critical' || o.severity === 'high');
    const priority = hasCriticalOrHigh ? 'high' : summary.total > 5 ? 'medium' : 'low';

    return {
      suggestions: sorted,
      priority,
      score: summary.score,
      total: summary.total,
      autoFixableCount: sorted.filter(o => o.autoFixable).length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. 重构质量度量 & 追踪
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 计算代码质量指数
   *
   * 结合检测结果和重构历史计算综合质量评分 0-100。
   *
   * @param {string} code - 源代码
   * @param {string} language
   * @returns {{ score: number, dimensions: Object }}
   */
  qualityScore(code, language = 'javascript') {
    const { summary, opportunities } = this.detect(code, language);

    const dimensions = {
      // 函数长度质量（基于 long-function 检测）
      functionSize: Math.max(0, 100 - (opportunities.filter(o => o.type === 'long-function').length * 15)),
      // 嵌套质量
      nesting: Math.max(0, 100 - (opportunities.filter(o => o.type === 'deep-nesting').length * 25)),
      // 命名质量（基于 magic-number）
      naming: Math.max(0, 100 - (opportunities.filter(o => o.type === 'magic-number').length * 8)),
      // 重复度
      duplication: Math.max(0, 100 - (opportunities.filter(o => o.type === 'duplicate-code').length * 10)),
    };

    const score = Math.round(
      (dimensions.functionSize * 0.3 +
        dimensions.nesting * 0.25 +
        dimensions.naming * 0.25 +
        dimensions.duplication * 0.2)
    );

    return {
      score: Math.min(100, Math.max(0, score)),
      dimensions,
      refactoringUrgency: score < 50 ? 'high' : score < 75 ? 'medium' : 'low',
    };
  }

  /**
   * 获取重构历史统计
   */
  getHistory({ limit = 20, type, language } = {}) {
    let entries = [...this.history];

    if (type) entries = entries.filter(e => e.type === type);
    if (language) entries = entries.filter(e => e.language === language);

    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const stats = {
      total: this.history.length,
      successCount: this.history.filter(e => e.success).length,
      failCount: this.history.filter(e => !e.success).length,
      byType: {},
      totalLinesChanged: this.history.reduce((sum, e) => sum + Math.abs((e.afterLen || 0) - (e.beforeLen || 0)), 0),
    };

    for (const e of this.history) {
      stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
    }

    return {
      stats,
      recent: entries.slice(0, limit),
    };
  }

  /**
   * 获取支持的变换类型列表
   */
  getTransformers() {
    return Object.entries(REFACTORING_PATTERNS).map(([id, p]) => ({
      id,
      name: p.name,
      description: p.description,
      severity: p.severity,
      languages: p.languages,
      confidence: p.confidence,
    }));
  }

  /**
   * 获取模块统计信息
   */
  getStats() {
    const history = this.getHistory();
    return {
      transformCount: this.history.length,
      transformTypes: Object.keys(history.stats.byType).length,
      successRate: history.stats.total > 0
        ? Math.round((history.stats.successCount / history.stats.total) * 100) + '%'
        : 'N/A',
      availableTransformers: Object.keys(REFACTORING_PATTERNS).length,
    };
  }

  /**
   * 统一路由分发（与 heartflow.js dispatch 协议一致）
   */
  dispatch(action, ...args) {
    switch (action) {
      case 'detect':
        return this.detect(...args);
      case 'suggest':
        return this.suggest(...args);
      case 'transform':
        return this.transform(...args);
      case 'qualityScore':
        return this.qualityScore(...args);
      case 'getHistory':
        return this.getHistory(...args);
      case 'getTransformers':
        return this.getTransformers();
      case 'getStats':
        return this.getStats();
      default:
        throw new Error(`CodeRefactor: unknown action "${action}"`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = { CodeRefactor };
