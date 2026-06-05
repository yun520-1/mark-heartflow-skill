/**
 * ============================================================================
 * HeartFlow 心虫 v2.0.61 — CodeEngine (代码引擎)
 * ============================================================================
 *
 * 代码分析、审查与审计引擎，是心虫认知系统的 Tier 1 核心模块。
 * 本模块替代并大幅扩展了原有的 code-verifier.js 的功能。
 *
 * 能力概览:
 *   analyzeCode()    — 解析代码结构（函数、类、变量、依赖、复杂度）
 *   reviewCode()     — 逻辑级代码审查（空值、边界、安全、死代码）
 *   auditCodebase()  — 递归目录审计（依赖图、循环引用、热点函数）
 *   suggestFix()     — 针对检测到的问题生成修复建议
 *   compareVersions()— 结构化语义对比（非纯文本 diff）
 *
 * 设计原则:
 * - 零外部依赖，仅使用 Node.js 内置的 fs 和 path 模块
 * - 基于正则表达式的 AST 风格解析（实用模式，非完整解析器）
 * - 输出结构化 JSON，附带置信度评分
 * - 支持 JS/TS/Python 及类似语法
 * - 所有 JSDoc 注释为中文
 *
 * @module code-engine
 * @author HeartFlow Core Team
 * @version 2.0.61
 * @license Proprietary
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// 语言检测与配置
// ============================================================================

/**
 * @typedef {Object} LanguageConfig
 * @property {string[]} extensions - 文件扩展名列表
 * @property {RegExp[]} commentPatterns - 注释匹配模式
 * @property {Object} keywords - 关键字分类
 * @property {string[]} blockKeywords - 块结构关键字
 * @property {Object} importPatterns - 导入语句匹配模式
 */

/**
 * 语言配置表
 * @type {Object<string, LanguageConfig>}
 */
const LANG_CONFIGS = {
  javascript: {
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
    keywords: {
      declaration: ['const', 'let', 'var', 'function', 'class', 'async', 'await'],
      control: ['if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch', 'finally'],
      branch: ['if', 'else if', 'else', 'switch', 'case', '?', '||', '&&'],
      return: ['return', 'yield', 'throw']
    },
    blockKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'try', 'catch', 'finally', 'function', 'class'],
    importPatterns: [
      /(?:import\s+(?:\{[^}]*\}|[^;{]+)\s+from\s+['"]([^'"]+)['"])|(?:const\s+\w+\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\))/g
    ],
    securityPatterns: [
      { pattern: /eval\s*\(/g, severity: 'critical', name: 'eval执行' },
      { pattern: /innerHTML\s*=/g, severity: 'high', name: 'innerHTML赋值' },
      { pattern: /exec(?:Sync)?\s*\(/g, severity: 'critical', name: '命令执行' },
      { pattern: /child_process/g, severity: 'high', name: '子进程调用' },
      { pattern: /new\s+Function\s*\(/g, severity: 'critical', name: '动态函数构造' },
      { pattern: /document\.write\s*\(/g, severity: 'high', name: 'document.write' },
      { pattern: /localStorage|sessionStorage/g, severity: 'medium', name: '客户端存储' }
    ],
    typeCoercionPatterns: [
      { pattern: /==\s*(?:null|undefined|0|''|\[\])/, severity: 'medium', name: '宽松相等比较' },
      { pattern: /\+\s*(?:''|"")/, severity: 'low', name: '字符串拼接混淆' }
    ]
  },
  typescript: {
    extensions: ['.ts', '.tsx', '.mts', '.cts'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//gm],
    keywords: {
      declaration: ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum', 'async', 'await'],
      control: ['if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch', 'finally'],
      branch: ['if', 'else if', 'else', 'switch', 'case', '?', '||', '&&'],
      return: ['return', 'yield', 'throw']
    },
    blockKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'try', 'catch', 'finally', 'function', 'class'],
    importPatterns: [
      /(?:import\s+(?:\{[^}]*\}|[^;{]+)\s+from\s+['"]([^'"]+)['"])|(?:import\s+(?:type\s+)?(?:\{[^}]*\}|[^;{]+)\s+from\s+['"]([^'"]+)['"])|(?:const\s+\w+\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\))/g
    ],
    securityPatterns: [
      { pattern: /eval\s*\(/g, severity: 'critical', name: 'eval执行' },
      { pattern: /innerHTML\s*=/g, severity: 'high', name: 'innerHTML赋值' },
      { pattern: /exec(?:Sync)?\s*\(/g, severity: 'critical', name: '命令执行' },
      { pattern: /:\s*any\b/g, severity: 'medium', name: 'any类型' },
      { pattern: /\/\/\s*@ts-ignore/g, severity: 'low', name: '类型忽略' },
      { pattern: /!\./g, severity: 'low', name: '非空断言' }
    ],
    typeCoercionPatterns: [
      { pattern: /==\s*(?:null|undefined|0|''|\[\])/, severity: 'medium', name: '宽松相等比较' },
      { pattern: /\s+as\s+any\b/g, severity: 'medium', name: 'any类型断言' }
    ]
  },
  python: {
    extensions: ['.py', '.pyw', '.pyx'],
    commentPatterns: [/#.*$/gm, /'''[\s\S]*?'''/gm, /"""[\s\S]*?"""/gm],
    keywords: {
      declaration: ['def', 'class', 'async def', 'lambda'],
      control: ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'match', 'case'],
      branch: ['if', 'elif', 'else', 'match', 'case', 'or', 'and'],
      return: ['return', 'yield', 'raise']
    },
    blockKeywords: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'match', 'case'],
    importPatterns: [
      /(?:import\s+(\w+(?:\.\w+)*))|(?:from\s+(\w+(?:\.\w+)*)\s+import)/g
    ],
    securityPatterns: [
      { pattern: /eval\s*\(/g, severity: 'critical', name: 'eval执行' },
      { pattern: /exec\s*\(/g, severity: 'critical', name: 'exec执行' },
      { pattern: /__import__\s*\(/g, severity: 'high', name: '动态导入' },
      { pattern: /os\.system\s*\(/g, severity: 'critical', name: '系统命令执行' },
      { pattern: /subprocess(?:\.[a-zA-Z]+)?\s*\(/g, severity: 'high', name: '子进程调用' },
      { pattern: /pickle\.loads?\s*\(/g, severity: 'high', name: '反序列化' },
      { pattern: /input\s*\(/g, severity: 'low', name: '用户输入' }
    ],
    typeCoercionPatterns: [
      { pattern: /==\s*(?:None|True|False)/, severity: 'low', name: '与单例比较' },
      { pattern: /is\s+(?!not)/, severity: 'low', name: 'is用法检查' }
    ]
  }
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 检测代码语言类型
 * @param {string} code - 代码文本
 * @param {string} [language] - 可选的语言提示
 * @returns {string} 检测到的语言标识
 */
function detectLanguage(code, language) {
  if (language && LANG_CONFIGS[language]) return language;

  // 启发式检测
  if (/^(?:import\s|export\s|const\s|let\s|var\s|function\s|class\s|require\s*\()/m.test(code)) {
    return 'javascript';
  }
  if (/^(?:import\s+(?:type\s+)?|interface\s|type\s\w+\s*=|:\s*(?:string|number|boolean|void)\b)/m.test(code)) {
    return 'typescript';
  }
  if (/^(?:def\s|class\s|import\s|from\s|print\s*\()/m.test(code) || /:\s*$/m.test(code)) {
    return 'python';
  }

  // 默认回退到 JavaScript
  return language || 'javascript';
}

/**
 * 去除代码中的注释
 * @param {string} code - 原始代码
 * @param {string} lang - 语言标识
 * @returns {string} 去除注释后的代码
 */
function stripComments(code, lang) {
  const config = LANG_CONFIGS[lang] || LANG_CONFIGS.javascript;
  let result = code;
  for (const pattern of config.commentPatterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * 获取代码行数组
 * @param {string} code - 代码文本
 * @returns {string[]} 行数组
 */
function getLines(code) {
  return code.split('\n');
}

/**
 * 计算代码行数（排除空行和纯注释行）
 * @param {string} code - 代码文本
 * @returns {number} 有效代码行数
 */
function countLogicalLines(code) {
  const lines = getLines(code);
  return lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#')).length;
}

/**
 * 计算 Levenshtein 编辑距离（用于代码相似度比较）
 * @param {string} a - 字符串A
 * @param {string} b - 字符串B
 * @returns {number} 编辑距离
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * 计算字符串相似度 (0-1)
 * @param {string} a - 字符串A
 * @param {string} b - 字符串B
 * @returns {number} 相似度分数
 */
function stringSimilarity(a, b) {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// ============================================================================
// CodeEngine 类
// ============================================================================

/**
 * 心虫代码引擎 — 分析、审查与审计代码
 *
 * 本引擎通过正则模式匹配实现类 AST 解析，
 * 在不需要完整解析器的前提下提供实用的代码质量保障。
 *
 * @class CodeEngine
 */
class CodeEngine {

  // ========================================================================
  // 1. analyzeCode — 代码结构解析
  // ========================================================================

  /**
   * 解析代码结构，提取函数、类、变量、依赖关系与复杂度指标
   *
   * @param {string} code - 源代码文本
   * @param {string} [language] - 语言标识（自动检测如果未提供）
   * @returns {Object} 分析结果
   * @returns {Object[]} .functions - 函数定义列表
   * @returns {Object[]} .classes - 类定义列表
   * @returns {Object[]} .variables - 变量声明列表
   * @returns {Object[]} .dependencies - 导入/require 依赖列表
   * @returns {number} .cyclomaticComplexity - 圈复杂度估计值
   * @returns {Object[]} .branchPoints - 分支点列表
   * @returns {Object[]} .callGraph - 函数调用图
   * @returns {Object[]} .returnPaths - 返回路径分析
   * @returns {number} .totalLines - 总行数
   * @returns {number} .logicalLines - 有效代码行数
   * @returns {number} .confidence - 分析置信度 (0-1)
   */
  analyzeCode(code, language) {
    if (typeof code !== 'string' || !code.trim()) {
      return {
        functions: [], classes: [], variables: [], dependencies: [],
        cyclomaticComplexity: 0, branchPoints: [], callGraph: [],
        returnPaths: [], totalLines: 0, logicalLines: 0,
        confidence: 0, error: '代码为空或无效'
      };
    }

    const lang = detectLanguage(code, language);
    const config = LANG_CONFIGS[lang] || LANG_CONFIGS.javascript;
    const cleanCode = stripComments(code, lang);
    const lines = getLines(code);
    const totalLines = lines.length;
    const logicalLines = countLogicalLines(code);

    const functions = this._extractFunctions(cleanCode, lang, lines);
    const classes = this._extractClasses(cleanCode, lang, lines);
    const variables = this._extractVariables(cleanCode, lang, lines);
    const dependencies = this._extractDependencies(cleanCode, lang);
    const branchPoints = this._extractBranchPoints(cleanCode, lang);
    const cyclomaticComplexity = this._estimateComplexity(cleanCode, lang, branchPoints);
    const callGraph = this._buildCallGraph(cleanCode, lang, functions);
    const returnPaths = this._analyzeReturnPaths(cleanCode, lang, functions);

    // 计算置信度：基于代码长度和解析覆盖度
    const hasFunctions = functions.length > 0;
    const hasClasses = classes.length > 0;
    const hasDeps = dependencies.length > 0;
    const coverageScore = (hasFunctions ? 0.25 : 0) + (hasClasses ? 0.15 : 0) +
      (hasDeps ? 0.15 : 0) + (branchPoints.length > 0 ? 0.15 : 0.05);
    const sizeScore = Math.min(totalLines / 500, 0.3);
    const confidence = Math.min(Math.round((coverageScore + sizeScore) * 100) / 100, 0.95);

    return {
      functions,
      classes,
      variables,
      dependencies,
      cyclomaticComplexity,
      branchPoints,
      callGraph,
      returnPaths,
      totalLines,
      logicalLines,
      language: lang,
      confidence
    };
  }

  /**
   * 提取函数定义
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {string[]} lines - 原始行数组
   * @returns {Object[]} 函数定义列表
   */
  _extractFunctions(cleanCode, lang, lines) {
    const functions = [];
    const patterns = [];

    if (lang === 'python') {
      patterns.push(
        { regex: /^(\s*)def\s+(\w+)\s*\(/gm, type: 'function' },
        { regex: /^(\s*)async\s+def\s+(\w+)\s*\(/gm, type: 'async function' },
        { regex: /^(\s*)class\s+(\w+)[\s\S]*?:\s*$/gm, type: 'class method container' }
      );
    } else {
      // JS/TS 函数模式
      patterns.push(
        { regex: /function\s+(\w+)\s*\(/g, type: 'function' },
        { regex: /async\s+function\s+(\w+)\s*\(/g, type: 'async function' },
        { regex: /(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/g, type: 'arrow function' },
        { regex: /(\w+)\s*:\s*(?:async\s*)?function\s*\(/g, type: 'method' },
        { regex: /(\w+)\s*\([^)]*\)\s*\{[^}]*\}/g, type: 'inline function' }
      );
    }

    for (const { regex, type } of patterns) {
      let match;
      // 重置正则索引
      regex.lastIndex = 0;
      while ((match = regex.exec(cleanCode)) !== null) {
        const name = match[2] || match[1] || 'anonymous';
        const pos = match.index;
        const lineNum = cleanCode.substring(0, pos).split('\n').length;

        // 避免重复（已记录的同名函数）
        if (!functions.some(f => f.name === name && Math.abs(f.line - lineNum) < 3)) {
          // 估算函数体结束行
          let endLine = lineNum;
          let braceCount = 0;
          let foundBody = false;

          if (lang === 'python') {
            // Python: 通过缩进变化判断结束
            const indentLevel = match[1] ? match[1].length : 0;
            for (let i = lineNum; i < lines.length; i++) {
              const line = lines[i];
              const lineIndent = line.search(/\S/);
              if (lineIndent >= 0 && lineIndent <= indentLevel && i > lineNum) {
                endLine = i;
                break;
              }
              endLine = i + 1;
            }
          } else {
            // JS/TS: 通过大括号匹配
            for (let i = lineNum - 1; i < lines.length; i++) {
              const line = lines[i];
              for (const ch of line) {
                if (ch === '{') { braceCount++; foundBody = true; }
                if (ch === '}') braceCount--;
              }
              if (foundBody && braceCount === 0) {
                endLine = i + 1;
                break;
              }
            }
          }

          // 提取函数体
          const bodyLines = lines.slice(lineNum - 1, endLine);
          const body = bodyLines.join('\n');

          // 计算函数内复杂度（递归的简化版）
          const complexity = this._estimateComplexity(body, lang);

          functions.push({
            name,
            type,
            line: lineNum,
            endLine: Math.max(lineNum + 1, endLine),
            body,
            complexity,
            params: this._extractParams(match[0])
          });
        }
      }
    }

    return functions;
  }

  /**
   * 提取参数列表
   * @private
   * @param {string} signature - 函数签名
   * @returns {string[]} 参数名列表
   */
  _extractParams(signature) {
    const match = signature.match(/\(([^)]*)\)/);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim().split(/[=:]/)[0].trim()).filter(Boolean);
  }

  /**
   * 提取类定义
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {string[]} lines - 原始行数组
   * @returns {Object[]} 类定义列表
   */
  _extractClasses(cleanCode, lang, lines) {
    const classes = [];
    let pattern;

    if (lang === 'python') {
      pattern = /^class\s+(\w+)(?:\(([^)]*)\))?\s*:/gm;
    } else {
      pattern = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g;
    }

    let match;
    while ((match = pattern.exec(cleanCode)) !== null) {
      const name = match[1];
      const pos = match.index;
      const lineNum = cleanCode.substring(0, pos).split('\n').length;
      const parentClass = match[2] || null;
      const interfaces = match[3] ? match[3].split(',').map(s => s.trim()).filter(Boolean) : [];

      // 估算类结束行
      let endLine = lineNum;
      if (lang === 'python') {
        for (let i = lineNum; i < lines.length; i++) {
          if (lines[i].search(/\S/) === 0 && i > lineNum) {
            endLine = i;
            break;
          }
          endLine = i + 1;
        }
      } else {
        let braceCount = 0;
        let foundBody = false;
        for (let i = lineNum - 1; i < lines.length; i++) {
          for (const ch of lines[i]) {
            if (ch === '{') { braceCount++; foundBody = true; }
            if (ch === '}') braceCount--;
          }
          if (foundBody && braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }

      // 提取类内方法
      const classBody = lines.slice(lineNum - 1, endLine).join('\n');
      const methods = this._extractFunctions(classBody, lang, lines.slice(lineNum - 1, endLine))
        .map(m => ({ ...m, line: m.line + lineNum - 1 }));

      classes.push({
        name,
        parentClass,
        interfaces,
        line: lineNum,
        endLine: Math.max(lineNum + 1, endLine),
        methods,
        memberCount: methods.length
      });
    }

    return classes;
  }

  /**
   * 提取变量声明
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @returns {Object[]} 变量声明列表
   */
  _extractVariables(cleanCode, lang) {
    const variables = [];
    let patterns;

    if (lang === 'python') {
      patterns = [
        { regex: /^(\s*)(\w+)\s*=\s*/gm, scope: 'module' },
        { regex: /self\.(\w+)\s*=\s*/g, scope: 'instance' }
      ];
    } else {
      patterns = [
        { regex: /(?:const|let|var)\s+(\w+)\s*(?:=|;)/g, scope: 'block' },
        { regex: /(?:const|let|var)\s+\{([^}]+)\}\s*=/g, scope: 'destructured' },
        { regex: /this\.(\w+)\s*=/g, scope: 'instance' }
      ];
    }

    const seen = new Set();

    for (const { regex, scope } of patterns) {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(cleanCode)) !== null) {
        const name = match[1] || match[2];
        if (name && !seen.has(name)) {
          seen.add(name);
          const pos = match.index;
          const lineNum = cleanCode.substring(0, pos).split('\n').length;
          variables.push({ name, scope, line: lineNum });
        }
      }
    }

    return variables;
  }

  /**
   * 提取导入/require 依赖
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @returns {Object[]} 依赖列表
   */
  _extractDependencies(cleanCode, lang) {
    const dependencies = [];
    const config = LANG_CONFIGS[lang] || LANG_CONFIGS.javascript;

    for (const pattern of config.importPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(cleanCode)) !== null) {
        const modulePath = match[1] || match[2] || match[3];
        if (modulePath) {
          const pos = match.index;
          const lineNum = cleanCode.substring(0, pos).split('\n').length;
          const isLocal = modulePath.startsWith('.') || modulePath.startsWith('/');

          dependencies.push({
            module: modulePath,
            type: match[0].startsWith('import') ? 'import' : 'require',
            local: isLocal,
            line: lineNum,
            // 对本地模块，尝试判断类别
            category: isLocal ? 'local' : modulePath.startsWith('@') ? 'scoped' : 'npm'
          });
        }
      }
    }

    // 去重
    const seen = new Set();
    return dependencies.filter(d => {
      const key = `${d.module}:${d.line}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 提取分支点
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @returns {Object[]} 分支点列表
   */
  _extractBranchPoints(cleanCode, lang) {
    const branchPoints = [];
    const config = LANG_CONFIGS[lang] || LANG_CONFIGS.javascript;

    // if/else
    const ifPattern = /\bif\s*\(/g;
    let match;
    while ((match = ifPattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      branchPoints.push({ type: 'if', line: lineNum, keyword: 'if' });
    }

    // else if
    const elifPattern = /\belse\s+if\s*\(/g;
    while ((match = elifPattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      branchPoints.push({ type: 'else-if', line: lineNum, keyword: 'else if' });
    }

    // else
    const elsePattern = lang === 'python' ? /\belse\s*:/g : /\belse\s*\{/g;
    while ((match = elsePattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      // 避免重复计数（else if 已经被计）
      if (!branchPoints.some(b => b.line === lineNum)) {
        branchPoints.push({ type: 'else', line: lineNum, keyword: 'else' });
      }
    }

    // switch/case
    const casePattern = /\bcase\s+/g;
    while ((match = casePattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      branchPoints.push({ type: 'case', line: lineNum, keyword: 'case' });
    }

    // 三元运算符
    const ternaryPattern = /\?\s*[^:]+?\s*:/g;
    while ((match = ternaryPattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      branchPoints.push({ type: 'ternary', line: lineNum, keyword: '?:' });
    }

    // 逻辑短路运算符 (&&, ||)
    const shortCircuitPattern = /(?:&&|\|\|)/g;
    while ((match = shortCircuitPattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      branchPoints.push({ type: 'short-circuit', line: lineNum, keyword: match[0] });
    }

    // Python match/case
    if (lang === 'python') {
      const matchCasePattern = /\bcase\s+(\w+|\d+|_)\s*:/g;
      while ((match = matchCasePattern.exec(cleanCode)) !== null) {
        const lineNum = cleanCode.substring(0, match.index).split('\n').length;
        if (!branchPoints.some(b => b.line === lineNum && b.type === 'case')) {
          branchPoints.push({ type: 'case', line: lineNum, keyword: 'case' });
        }
      }
    }

    return branchPoints;
  }

  /**
   * 估计圈复杂度
   * @private
   * @param {string} code - 代码文本
   * @param {string} lang - 语言
   * @param {Object[]} [branchPoints] - 预提取的分支点
   * @returns {number} 圈复杂度
   */
  _estimateComplexity(code, lang, branchPoints) {
    if (!branchPoints) {
      branchPoints = this._extractBranchPoints(code, lang);
    }

    // 基础复杂度为 1
    let complexity = 1;

    // 每个分支点增加复杂度
    for (const bp of branchPoints) {
      if (bp.type === 'if' || bp.type === 'else-if' || bp.type === 'else') {
        complexity += 1;
      } else if (bp.type === 'case') {
        complexity += 1;
      } else if (bp.type === 'ternary') {
        complexity += 1;
      } else if (bp.type === 'short-circuit') {
        complexity += 0.5;
      }
    }

    // 检查循环
    const loopPattern = /\b(?:for|while|do)\s*\(/g;
    let match;
    while ((match = loopPattern.exec(code)) !== null) {
      complexity += 1;
    }

    // Python 循环
    const pyLoopPattern = /\b(?:for|while)\s+/g;
    while ((match = pyLoopPattern.exec(code)) !== null) {
      complexity += 1;
    }

    // catch 块
    const catchPattern = /\bcatch\s*\(/g;
    while ((match = catchPattern.exec(code)) !== null) {
      complexity += 1;
    }

    // 逻辑运算符 && || 在条件中
    const logicalInCondition = /(?:&&|\|\|)/g;
    while ((match = logicalInCondition.exec(code)) !== null) {
      complexity += 0.5;
    }

    return Math.round(complexity * 10) / 10;
  }

  /**
   * 构建函数调用图
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} functions - 函数定义列表
   * @returns {Object[]} 调用图条目
   */
  _buildCallGraph(cleanCode, lang, functions) {
    const callGraph = [];

    for (const func of functions) {
      const calledFunctions = [];
      const callPattern = /(\w+)\s*\(/g;
      let match;

      while ((match = callPattern.exec(func.body || '')) !== null) {
        const callee = match[1];
        // 过滤关键字和保留字
        if (/^(if|for|while|switch|catch|typeof|delete|void|return|throw|new|this|super)$/.test(callee)) {
          continue;
        }
        // 过滤自身调用
        if (callee === func.name) continue;

        const pos = match.index;
        const relativeLine = (func.body || '').substring(0, pos).split('\n').length;
        const absoluteLine = func.line + relativeLine;

        if (!calledFunctions.some(c => c.name === callee)) {
          calledFunctions.push({ name: callee, line: absoluteLine });
        }
      }

      if (calledFunctions.length > 0) {
        callGraph.push({
          caller: func.name,
          callerLine: func.line,
          calls: calledFunctions,
          callCount: calledFunctions.length
        });
      }
    }

    return callGraph;
  }

  /**
   * 分析返回路径
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} functions - 函数定义列表
   * @returns {Object[]} 返回路径分析结果
   */
  _analyzeReturnPaths(cleanCode, lang, functions) {
    const returnPaths = [];

    for (const func of functions) {
      const body = func.body || '';
      const returnStmts = [];

      // 查找所有 return 语句
      const returnPattern = /(?:\breturn\s+([^;{]*)|(\byield\s+[^;{]*))/g;
      let match;
      while ((match = returnPattern.exec(body)) !== null) {
        const pos = match.index;
        const relativeLine = body.substring(0, pos).split('\n').length;
        const absoluteLine = func.line + relativeLine;
        const returnValue = (match[1] || match[2] || '').trim();

        returnStmts.push({
          line: absoluteLine,
          value: returnValue || 'void',
          hasValue: returnValue.length > 0
        });
      }

      // 检测是否早于函数末尾返回
      const hasEarlyReturn = returnStmts.length > 0 &&
        returnStmts.some(r => r.line < func.endLine - 1);

      returnPaths.push({
        functionName: func.name,
        functionLine: func.line,
        totalReturns: returnStmts.length,
        returns: returnStmts,
        hasEarlyReturn,
        hasMultipleReturns: returnStmts.length > 1,
        singleExit: returnStmts.length <= 1,
        pattern: returnStmts.length === 0 ? 'no-return' :
          hasEarlyReturn ? 'early-return' : 'single-exit'
      });
    }

    return returnPaths;
  }

  // ========================================================================
  // 2. reviewCode — 逻辑级代码审查
  // ========================================================================

  /**
   * 对代码进行逻辑级审查，发现潜在问题
   *
   * 审查范围包括：
   * - 空值/未定义检查缺失
   * - 边界条件（差一错误、空集合）
   * - 隐式假设（输入验证、状态依赖）
   * - 异步错误处理（缺少 await、未捕获拒绝）
   * - 类型强制转换风险
   * - 死代码检测（未使用变量、不可达返回）
   * - 安全模式（eval、innerHTML、命令注入）
   *
   * @param {string} diffOrCode - 代码文本或 diff 文本
   * @param {string} [language] - 语言标识
   * @returns {Object} 审查报告
   * @returns {Object[]} .issues - 发现的问题列表
   * @returns {number} .issueCount - 问题总数
   * @returns {number} .criticalCount - 严重问题数
   * @returns {number} .highCount - 高优先级问题数
   * @returns {number} .mediumCount - 中优先级问题数
   * @returns {number} .lowCount - 低优先级问题数
   * @returns {number} .score - 代码质量评分 (0-100)
   * @returns {number} .confidence - 审查置信度 (0-1)
   */
  reviewCode(diffOrCode, language) {
    if (typeof diffOrCode !== 'string' || !diffOrCode.trim()) {
      return {
        issues: [], issueCount: 0, criticalCount: 0, highCount: 0,
        mediumCount: 0, lowCount: 0, score: 100, confidence: 0,
        error: '代码为空或无效'
      };
    }

    // 判断是否是 diff 格式
    const isDiff = /^---\s/.test(diffOrCode) || /^@@\s/.test(diffOrCode) ||
      /^(?:\+|-| )/.test(diffOrCode.split('\n')[0]);

    const code = isDiff ? this._extractCodeFromDiff(diffOrCode) : diffOrCode;
    const lang = detectLanguage(code, language);
    const cleanCode = stripComments(code, lang);

    const issues = [];

    // 执行各项审查
    this._checkNullUndefined(cleanCode, lang, issues);
    this._checkBoundaryConditions(cleanCode, lang, issues);
    this._checkImplicitAssumptions(cleanCode, lang, issues);
    this._checkAsyncErrorHandling(cleanCode, lang, issues);
    this._checkTypeCoercion(cleanCode, lang, issues);
    this._checkDeadCode(cleanCode, lang, code, issues);
    this._checkSecurityPatterns(cleanCode, lang, issues);
    this._checkCommonAntiPatterns(cleanCode, lang, issues);
    this._checkPerformanceIssues(cleanCode, lang, issues);
    this._checkConcurrencySafety(cleanCode, lang, issues);

    // 统计严重级别
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    // 计算质量评分
    const totalWeight = criticalCount * 15 + highCount * 8 + mediumCount * 3 + lowCount * 1;
    const score = Math.max(0, Math.min(100, Math.round(100 - totalWeight)));

    // 置信度：基于代码长度
    const confidence = Math.min(code.length / 1000, 0.9) + 0.05;

    // 确保每个 issue 有 description 字段（兼容 message/detail 命名）
    for (const issue of issues) {
      if (!issue.description && issue.message) {
        issue.description = issue.message;
      }
      if (!issue.detail) issue.detail = issue.description || '';
    }
    return {
      issues,
      issueCount: issues.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      score,
      confidence: Math.min(Math.round(confidence * 100) / 100, 0.95)
    };
  }

  /**
   * 从 diff 中提取代码内容
   * @private
   * @param {string} diff - diff 文本
   * @returns {string} 提取的代码
   */
  _extractCodeFromDiff(diff) {
    const lines = diff.split('\n');
    const codeLines = [];

    for (const line of lines) {
      // 跳过 diff 元信息
      if (/^(?:---|\+\+\+|@@|diff|index|--- a\/|\+\+\+ b\/)/.test(line)) continue;
      // 取新增行和上下文行
      if (line.startsWith('+') || line.startsWith(' ')) {
        codeLines.push(line.substring(1));
      }
    }

    return codeLines.join('\n');
  }

  /**
   * 检查空值/未定义检查缺失
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkNullUndefined(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    // 模式：属性访问前没有空值检查
    // 例如：obj.prop 前没有 if (obj && obj.prop) 或 obj?.prop
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 检测 . 访问模式
      const accessMatch = line.match(/(\w+)\.(\w+)\s*(?:[=.]|;|\))/);
      if (accessMatch) {
        const obj = accessMatch[1];
        const prop = accessMatch[2];

        // 检查前几行是否有空值检查
        let hasNullCheck = false;
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j];
          if (prevLine.includes(`if (!${obj}`) ||
              prevLine.includes(`if (${obj} == null`) ||
              prevLine.includes(`if (${obj} === null`) ||
              prevLine.includes(`if (${obj} === undefined`) ||
              prevLine.includes(`${obj} &&`) ||
              prevLine.includes(`${obj}?.`)) {
            hasNullCheck = true;
            break;
          }
        }

        // 检查同一行是否使用了可选链
        if (line.includes(`${obj}?.`)) {
          hasNullCheck = true;
        }

        if (!hasNullCheck && !['this', 'self', 'window', 'global', 'document', 'console', 'Math', 'JSON', 'process', 'module', 'exports', 'require', '__dirname', '__filename'].includes(obj)) {
          // 检查变量是否刚被声明（可能是局部变量）
          const isNewVar = line.includes(`const ${obj}`) || line.includes(`let ${obj}`) || line.includes(`var ${obj}`);
          if (!isNewVar) {
            issues.push({
              type: 'missing-null-check',
              severity: 'medium',
              line: lineNum,
              code: line.trim(),
              message: `属性访问 "${obj}.${prop}" 前缺少空值检查`,
              detail: `变量 ${obj} 可能为 null 或 undefined，建议使用可选链 (${obj}?.${prop}) 或显式检查`,
              suggestion: `使用 ${obj}?.${prop} 或 if (${obj} != null) { ... }`
            });
          }
        }
      }

      // 检测数组/对象解构前没有检查
      const destructureMatch = line.match(/(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(\w+)/);
      if (destructureMatch && !line.includes('||') && !line.includes('??')) {
        const src = destructureMatch[2];
        // 检查前几行是否有检查
        let hasCheck = false;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (lines[j].includes(src) && (lines[j].includes('if') || lines[j].includes('??'))) {
            hasCheck = true;
            break;
          }
        }
        if (!hasCheck) {
          issues.push({
            type: 'missing-null-check',
            severity: 'medium',
            line: lineNum,
            code: line.trim(),
            message: `解构赋值 "${destructureMatch[0]}" 前未检查 ${src} 是否为空`,
            detail: `如果 ${src} 为 null/undefined，解构会抛出 TypeError`,
            suggestion: `使用 ${src} ?? {} 提供默认值，或先检查 ${src} != null`
          });
        }
      }
    }

    // 函数参数没有默认值
    const paramPattern = lang === 'python' ?
      /def\s+\w+\s*\(([^)]*)\)/g :
      /function\s+\w+\s*\(([^)]*)\)/g;

    let match;
    while ((match = paramPattern.exec(cleanCode)) !== null) {
      const params = match[1].split(',').map(p => p.trim()).filter(Boolean);
      for (const param of params) {
        const paramName = param.split(/[=:]/)[0].trim();
        // 参数没有默认值且不是剩余参数
        if (!param.includes('=') && !param.includes('...') && paramName !== '') {
          const lineNum = cleanCode.substring(0, match.index).split('\n').length +
            (match[0].substring(0, match[0].indexOf(param)).split('\n').length - 1);

          issues.push({
            type: 'missing-default-param',
            severity: 'low',
            line: lineNum,
            code: param,
            message: `参数 "${paramName}" 缺少默认值`,
            detail: `如果 ${paramName} 为 undefined，可能导致运行时错误`,
            suggestion: `添加默认值: ${paramName} = null 或 ${paramName} = defaultValue`
          });
        }
      }
    }
  }

  /**
   * 检查边界条件
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkBoundaryConditions(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 差一错误：使用 <= 而不是 < 进行数组长度比较
      const offByOneMatch = line.match(/<=\s*(\w+)\.length/);
      if (offByOneMatch) {
        const arr = offByOneMatch[1];
        // 检查是否在 for 循环中
        const isInLoop = /for\s*\(/.test(line);
        if (isInLoop) {
          issues.push({
            type: 'off-by-one',
            severity: 'medium',
            line: lineNum,
            code: line.trim(),
            message: `可能的差一错误：使用 <= ${arr}.length 遍历数组`,
            detail: `数组索引范围为 0 到 length-1，使用 <= 会导致访问越界`,
            suggestion: `将 <= 改为 <`
          });
        }
      }

      // 空集合检查缺失
      const arrayOpMatch = line.match(/(\w+)\.(?:map|filter|forEach|reduce|find|some|every)\s*\(/);
      if (arrayOpMatch) {
        const arr = arrayOpMatch[1];
        let hasEmptyCheck = false;
        for (let j = Math.max(0, i - 3); j <= i; j++) {
          if (lines[j].includes(`${arr}.length`) && lines[j].includes('> 0')) {
            hasEmptyCheck = true;
            break;
          }
        }
        if (!hasEmptyCheck && !['this', 'self', 'arguments'].includes(arr)) {
          issues.push({
            type: 'missing-empty-check',
            severity: 'low',
            line: lineNum,
            code: line.trim(),
            message: `对 "${arr}" 执行数组操作前未检查是否为空`,
            detail: '空数组操作虽然不会报错，但可能表示逻辑缺陷',
            suggestion: `考虑在操作前添加 if (${arr}.length > 0) 检查`
          });
        }
      }

      // 除零风险
      const divMatch = line.match(/\/(\s*\w+\s*)/);
      if (divMatch && !line.includes('/') && !line.includes('//') && !line.includes('/*')) {
        const divisor = divMatch[1].trim();
        if (/^[a-zA-Z_$]/.test(divisor) && !['0', '1', '2'].includes(divisor)) {
          issues.push({
            type: 'division-by-zero',
            severity: 'high',
            line: lineNum,
            code: line.trim(),
            message: `变量 "${divisor}" 作为除数，可能导致除零错误`,
            detail: '如果除数为 0，会抛出异常或返回 Infinity',
            suggestion: `添加除数检查: if (${divisor} !== 0) { ... }`
          });
        }
      }
    }

    // 空数组默认值
    const emptyArrayPattern = /= \[\s*\]/g;
    let match;
    while ((match = emptyArrayPattern.exec(cleanCode)) !== null) {
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'empty-default',
        severity: 'info',
        line: lineNum,
        code: match[0].trim(),
        message: '使用空数组作为默认值，注意引用共享问题',
        detail: '如果该值作为函数参数默认值，所有调用将共享同一个数组引用',
        suggestion: '在函数体内使用 let arr = []; 或使用工厂函数'
      });
    }
  }

  /**
   * 检查隐式假设
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkImplicitAssumptions(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 假设输入存在某个属性
      const propAccessMatch = line.match(/(\w+)\.(\w+)\s*[=(]/);
      if (propAccessMatch) {
        const obj = propAccessMatch[1];
        const prop = propAccessMatch[2];

        // 检查是否来自函数参数（隐式假设）
        let isParam = false;
        for (let j = 0; j < lines.length; j++) {
          if (/function\s+\w+\s*\(/.test(lines[j]) && lines[j].includes(obj)) {
            isParam = true;
            break;
          }
        }

        if (isParam && !line.includes('|| {}') && !line.includes('??')) {
          issues.push({
            type: 'implicit-assumption',
            severity: 'medium',
            line: lineNum,
            code: line.trim(),
            message: `隐式假设 "${obj}" 对象包含 "${prop}" 属性`,
            detail: `如果 ${obj} 对象不包含 ${prop} 属性，将返回 undefined 而非报错，可能掩盖问题`,
            suggestion: `使用 ${obj}?.${prop} 或 ${obj}?.${prop} ?? defaultValue`
          });
        }
      }

      // 假设 API 返回特定结构
      if (line.includes('.data') || line.includes('.result') || line.includes('.response')) {
        if (!line.includes('?.') && !line.includes('||') && !line.includes('??')) {
          // 检查是否在 try/catch 块中
          let inTryCatch = false;
          for (let j = Math.max(0, i - 10); j < i; j++) {
            if (lines[j].includes('try')) { inTryCatch = true; break; }
          }

          if (!inTryCatch) {
            issues.push({
              type: 'implicit-assumption',
              severity: 'medium',
              line: lineNum,
              code: line.trim(),
              message: '假设外部数据源返回特定结构，缺乏验证',
              detail: 'API/外部数据响应格式可能变化，直接访问属性可能导致运行时错误',
              suggestion: '添加响应格式验证，或使用 Zod/Yup 进行模式验证'
            });
          }
        }
      }

      // Python: 假设文件/网络操作成功
      if (lang === 'python') {
        if (/open\(/.test(line) && !/try/.test(line)) {
          issues.push({
            type: 'implicit-assumption',
            severity: 'high',
            line: lineNum,
            code: line.trim(),
            message: '文件打开操作未在 try 块中',
            detail: '文件可能不存在或无权访问，未捕获异常会导致程序崩溃',
            suggestion: '使用 with try/except 包裹文件操作'
          });
        }
      }
    }

    // 全局状态依赖（JS/TS）
    if (lang !== 'python') {
      const globalRefs = cleanCode.match(/\b(?:window|global|process|localStorage)\.[a-zA-Z_$]/g);
      if (globalRefs) {
        const uniqueRefs = [...new Set(globalRefs)];
        for (const ref of uniqueRefs) {
          const lineNum = cleanCode.substring(0, cleanCode.indexOf(ref)).split('\n').length;
          issues.push({
            type: 'global-state-dependency',
            severity: 'low',
            line: lineNum,
            code: ref,
            message: `依赖全局状态 "${ref.split('.')[0]}"`,
            detail: '全局状态可能导致测试困难、并发问题和隐式耦合',
            suggestion: '考虑通过依赖注入传递所需状态'
          });
        }
      }
    }
  }

  /**
   * 检查异步错误处理
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkAsyncErrorHandling(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    // JS/TS 异步检查
    if (lang !== 'python') {
      // 检测 Promise 未被 await 或未处理
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // async 函数中没有 await（可能是异步但缺少 await）
        if (/async\s+/.test(line) && !line.includes('await') && !/=>/.test(line)) {
          // 检查函数体是否包含 await
          let hasAwaitInBody = false;
          for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
            if (lines[j].includes('await')) { hasAwaitInBody = true; break; }
            if (lines[j].includes('}') && lines[j].trim() === '}') break;
          }

          if (!hasAwaitInBody) {
            issues.push({
              type: 'unnecessary-async',
              severity: 'low',
              line: lineNum,
              code: line.trim(),
              message: 'async 函数中未使用 await',
              detail: '标记为 async 但没有 await 操作的函数是多余的，可能是遗漏了异步操作',
              suggestion: '移除 async 关键字，或添加 await 调用'
            });
          }
        }

        // Promise 调用没有 await 或 .catch()
        const promiseCallMatch = line.match(/(\w+(?:\.\w+)*)\s*\(\s*\)\s*[;)]/);
        if (promiseCallMatch && /fetch|axios|request|getJSON|readFile|writeFile|query|send|save|create|update|delete/.test(line)) {
          if (!line.includes('await') && !line.includes('.then(') && !line.includes('.catch(')) {
            issues.push({
              type: 'unhandled-promise',
              severity: 'high',
              line: lineNum,
              code: line.trim(),
              message: '未处理的 Promise 调用',
              detail: '异步操作未使用 await 或 .then()/.catch() 处理，可能导致未捕获的拒绝',
              suggestion: '添加 await 关键字或链式 .catch() 处理'
            });
          }
        }

        // .catch() 缺少错误处理逻辑
        const catchMatch = line.match(/\.catch\s*\(\s*\(\s*\w+\s*\)\s*=>\s*\{?\s*\}?\s*\)/);
        if (catchMatch) {
          issues.push({
            type: 'empty-catch',
            severity: 'medium',
            line: lineNum,
            code: line.trim(),
            message: '空的 catch 块',
            detail: '捕获了错误但不做任何处理会掩盖故障',
            suggestion: '至少记录错误日志: .catch(err => console.error(err))'
          });
        }
      }

      // try/catch 中缺少 await
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('try')) {
          for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
            if (lines[j].includes('await')) break;
            if (lines[j].includes('catch')) {
              const lineNum = i + 1;
              const hasAsyncInside = lines.slice(i + 1, j).some(l => /async\s/.test(l));
              // 检查 try 块内是否有异步函数调用
              const hasAsyncCall = lines.slice(i + 1, j).some(l =>
                /fetch|axios|request|\.json\(|\.text\(/.test(l)
              );
              if (hasAsyncCall && !hasAsyncInside) {
                issues.push({
                  type: 'missing-await-in-try',
                  severity: 'high',
                  line: lineNum,
                  code: lines[i].trim(),
                  message: 'try 块中可能存在未 await 的异步操作',
                  detail: 'try 块内的异步操作如果没有 await，错误不会被 catch 捕获',
                  suggestion: '确保 try 块内的所有异步调用都有 await'
                });
              }
              break;
            }
          }
        }
      }
    } else {
      // Python 异步检查
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (/async\s+def/.test(line)) {
          let hasAwait = false;
          for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
            if (lines[j].includes('await ')) { hasAwait = true; break; }
            if (/^(\s*)def\s/.test(lines[j]) && lines[j].trim().startsWith('def')) break;
          }
          if (!hasAwait) {
            issues.push({
              type: 'unnecessary-async',
              severity: 'low',
              line: lineNum,
              code: line.trim(),
              message: 'async 函数中未使用 await',
              detail: '标记为 async 但没有 await 的协程函数是多余的',
              suggestion: '移除 async 关键字'
            });
          }
        }
      }
    }
  }

  /**
   * 检查类型强制转换风险
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkTypeCoercion(cleanCode, lang, issues) {
    const config = LANG_CONFIGS[lang] || LANG_CONFIGS.javascript;
    const lines = getLines(cleanCode);

    for (const { pattern, severity, name } of config.typeCoercionPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(cleanCode)) !== null) {
        const lineNum = cleanCode.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'type-coercion',
          severity,
          line: lineNum,
          code: match[0].trim(),
          message: `类型强制转换风险: ${name}`,
          detail: `表达式 "${match[0].trim()}" 可能产生意外的类型转换结果`,
          suggestion: name === '宽松相等比较' ?
            '使用 === 严格相等运算符替代 ==' :
            '使用显式类型转换函数'
        });
      }
    }

    // JS/TS 特有: 字符串拼接数字
    if (lang !== 'python') {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // 检测 + 操作符两侧类型不一致
        const plusMatch = line.match(/(\w+)\s*\+\s*(\w+)/);
        if (plusMatch) {
          const left = plusMatch[1];
          const right = plusMatch[2];
          // 启发式: 检查命名惯例暗示类型
          const leftIsNum = /^(?:count|index|num|size|len|total|max|min|i|j|k)\b/.test(left);
          const rightIsStr = /^(?:name|str|msg|text|label|title|desc)\b/.test(right);

          if ((leftIsNum && /^\d+$/.test(right)) || (rightIsStr && leftIsNum)) {
            issues.push({
              type: 'type-coercion',
              severity: 'low',
              line: lineNum,
              code: line.trim(),
              message: `可能的字符串拼接混淆: "${left}" + "${right}"`,
              detail: '+ 操作符在 JS 中同时用于数字加法和字符串拼接，可能导致意外结果',
              suggestion: '使用模板字符串: `${value}` 或显式转换: String(value)'
            });
          }
        }
      }
    }
  }

  /**
   * 检查死代码
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {string} originalCode - 原始代码（包含注释）
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkDeadCode(cleanCode, lang, originalCode, issues) {
    const lines = getLines(cleanCode);

    // 检测未使用的变量
    const varPattern = /(?:const|let|var)\s+(\w+)\s*=/g;
    const definedVars = new Map(); // name -> {line, code}

    let match;
    while ((match = varPattern.exec(cleanCode)) !== null) {
      const name = match[1];
      const lineNum = cleanCode.substring(0, match.index).split('\n').length;
      if (!definedVars.has(name)) {
        definedVars.set(name, { line: lineNum, code: match[0] });
      }
    }

    // 检查每个变量是否被引用
    for (const [name, info] of definedVars) {
      // 跳过常见的使用模式
      if (['i', 'j', 'k', 'idx', '_', 'tmp', 'temp', 'result', 'data', 'err', 'error'].includes(name)) continue;

      // 计算引用次数（排除定义本身）
      const regex = new RegExp('\\b' + name + '\\b', 'g');
      let count = 0;
      let refMatch;
      while ((refMatch = regex.exec(cleanCode)) !== null) {
        count++;
      }

      // 只有定义本身的引用
      if (count <= 1) {
        // 检查是否为导出或类属性
        const isExported = originalCode.includes(`exports.${name}`) ||
          originalCode.includes(`module.exports.${name}`) ||
          originalCode.includes(`export { ${name}`) ||
          originalCode.includes(`export default ${name}`);
        const isClassField = originalCode.includes(`this.${name}`);

        if (!isExported && !isClassField) {
          issues.push({
            type: 'unused-variable',
            severity: 'low',
            line: info.line,
            code: info.code.trim(),
            message: `未使用的变量 "${name}"`,
            detail: `变量 "${name}" 声明后未被引用`,
            suggestion: `移除声明或添加使用代码`
          });
        }
      }
    }

    // 检测 return 后的不可达代码
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (/^\s*return\s+[^;{]*[;]?\s*$/.test(line) || /^\s*throw\s+/.test(line)) {
        // 检查后续行是否还有代码（在同一块中）
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('*') &&
              !nextLine.startsWith('}') && !nextLine.startsWith(')') &&
              !/^\s*case\s/.test(nextLine) && !/^\s*default\s*:/.test(nextLine)) {
            issues.push({
              type: 'unreachable-code',
              severity: 'medium',
              line: lineNum,
              code: line.trim(),
              message: 'return/throw 语句后的不可达代码',
              detail: `第 ${j + 1} 行的代码在 return/throw 之后，永远不会被执行`,
              suggestion: '移除不可达代码或调整逻辑顺序'
            });
            break;
          }
        }
      }
    }

    // 检测空的 if/else 分支
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (/^\s*if\s*\([^)]*\)\s*\{\s*\}\s*$/.test(line)) {
        issues.push({
          type: 'empty-branch',
          severity: 'low',
          line: lineNum,
          code: line.trim(),
          message: '空的 if 分支',
          detail: '条件分支内没有任何代码，可能是未完成的实现',
          suggestion: '实现分支逻辑或移除空分支'
        });
      }
    }
  }

  /**
   * 检查安全模式
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkSecurityPatterns(cleanCode, lang, issues) {
    const config = LANG_CONFIGS[lang] || LANG_CONFIGS.javascript;

    for (const { pattern, severity, name } of config.securityPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(cleanCode)) !== null) {
        const lineNum = cleanCode.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'security',
          severity,
          line: lineNum,
          code: match[0].trim(),
          message: `安全风险: ${name}`,
          detail: `检测到潜在的安全风险模式 "${match[0].trim()}"，可能被用于注入攻击`,
          suggestion: this._getSecuritySuggestion(name)
        });
      }
    }

    // 通用安全模式
    const commonPatterns = [
      { regex: /process\.env/g, severity: 'low', name: '环境变量使用' },
      { regex: /Math\.random\(\)/g, severity: 'low', name: 'Math.random用于安全场景？' }
    ];

    for (const { regex, severity, name } of commonPatterns) {
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(cleanCode)) !== null) {
        const lineNum = cleanCode.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'security-review',
          severity,
          line: lineNum,
          code: match[0].trim(),
          message: `需安全审查: ${name}`,
          detail: `代码中使用了 "${match[0].trim()}"，需确认使用场景是否安全`,
          suggestion: '确认使用场景，敏感操作需进行安全审计'
        });
      }
    }
  }

  /**
   * 获取安全问题的修复建议
   * @private
   * @param {string} name - 安全模式名称
   * @returns {string} 修复建议
   */
  _getSecuritySuggestion(name) {
    const suggestions = {
      'eval执行': '绝对避免使用 eval()，使用 JSON.parse() 或 Function constructor 替代',
      'innerHTML赋值': '使用 textContent 替代 innerHTML，或使用 DOMPurify 消毒',
      '命令执行': '使用 child_process.execFile 替代 exec，并验证所有参数',
      '子进程调用': '使用白名单验证命令参数，避免 shell 注入',
      '动态函数构造': '避免使用 new Function()，使用预定义函数替代',
      'document.write': '使用 DOM API (createElement, appendChild) 替代',
      '客户端存储': '避免在 localStorage/sessionStorage 中存储敏感信息',
      '系统命令执行': '使用 subprocess.run 并设置 shell=False',
      '反序列化': '避免反序列化不可信数据，使用 JSON 替代 pickle',
      '用户输入': '对用户输入进行验证和消毒'
    };
    return suggestions[name] || '审查并加固此处的安全性';
  }

  /**
   * 检查常见反模式
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkCommonAntiPatterns(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 魔法数字
      const magicNumMatch = line.match(/[^a-zA-Z_$](\d+)[^a-zA-Z_$]/);
      if (magicNumMatch) {
        const num = parseInt(magicNumMatch[1], 10);
        if (num > 1 && num !== 0 && !/^\s*(?:\/\/|#|\*)/.test(line) &&
            !line.includes('const') && !line.includes('let') && !line.includes('var') &&
            !/for\s*\(/.test(line) && !/case\s+\d+/.test(line) &&
            num !== 100 && num !== 1000 && num !== 1024) {
          issues.push({
            type: 'magic-number',
            severity: 'low',
            line: lineNum,
            code: line.trim(),
            message: `魔法数字 ${num}`,
            detail: `数字 ${num} 直接出现在代码中，含义不明确`,
            suggestion: `将 ${num} 提取为具名常量: const NAME = ${num};`
          });
        }
      }

      // 过长的函数/方法（Python 缩进检测）
      if (lang === 'python') {
        if (/^(\s*)def\s+\w+\s*\(/.test(line)) {
          const indentLevel = line.match(/^(\s*)/)[1].length;
          let bodyLineCount = 0;
          for (let j = i + 1; j < Math.min(i + 80, lines.length); j++) {
            const nextLine = lines[j];
            const nextIndent = nextLine.search(/\S/);
            if (nextIndent <= indentLevel && nextLine.trim()) break;
            if (nextLine.trim() && !nextLine.trim().startsWith('#')) bodyLineCount++;
          }
          if (bodyLineCount > 40) {
            issues.push({
              type: 'long-function',
              severity: 'medium',
              line: lineNum,
              code: line.trim(),
              message: `函数体过长 (${bodyLineCount} 行)`,
              detail: '过长的函数难以理解和维护，建议拆分为多个小函数',
              suggestion: '遵循单一职责原则，将函数拆分为 20 行以内的小函数'
            });
          }
        }
      }

      // 硬编码路径
      if (/['"](?:\/|[a-zA-Z]:\\|\.\.\/|\.\/)/.test(line) &&
          !line.includes('path.') && !line.includes('__dirname') &&
          !line.includes('require') && !line.includes('import')) {
        const pathMatch = line.match(/['"]((?:\/|[a-zA-Z]:\\|\.\.\/|\.\/)[^'"]+)['"]/);
        if (pathMatch) {
          issues.push({
            type: 'hardcoded-path',
            severity: 'low',
            line: lineNum,
            code: line.trim(),
            message: `硬编码路径 "${pathMatch[1]}"`,
            detail: '硬编码路径降低代码可移植性',
            suggestion: '使用 path.join() 和配置变量构建路径'
          });
        }
      }

      // 同步操作在异步上下文中
      if (line.includes('readFileSync') || line.includes('writeFileSync') ||
          line.includes('execSync') || line.includes('spawnSync')) {
        // 检查是否在 async 函数中
        let inAsync = false;
        for (let j = Math.max(0, i - 20); j < i; j++) {
          if (lines[j].includes('async ')) { inAsync = true; break; }
        }
        if (inAsync) {
          issues.push({
            type: 'sync-in-async',
            severity: 'medium',
            line: lineNum,
            code: line.trim(),
            message: '异步上下文中使用了同步操作',
            detail: '在 async 函数中使用同步 I/O 会阻塞事件循环',
            suggestion: '使用异步版本: readFile → readFileSync'
          });
        }
      }
    }

    // 检查重复代码块（简单相似度检测）
    this._detectCodeDuplication(cleanCode, lang, issues);
  }

  /**
   * 检测代码重复块（简单实现）
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _detectCodeDuplication(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);
    const minBlockLines = 4;
    const maxBlockLines = 20;

    // 使用行签名比较
    const signatures = new Map(); // signature -> [lineNumbers]

    for (let i = 0; i < lines.length - minBlockLines + 1; i++) {
      for (let blockLen = minBlockLines; blockLen <= Math.min(maxBlockLines, lines.length - i); blockLen++) {
        const block = lines.slice(i, i + blockLen);
        const normalizedBlock = block.map(l => l.trim().replace(/\b\w+\b/g, 'VAR')).join('\n');
        const sig = normalizedBlock.substring(0, 80); // 取前80字符作为签名

        if (!signatures.has(sig)) {
          signatures.set(sig, []);
        }
        const positions = signatures.get(sig);
        // 检查是否与已有位置重叠
        const isOverlapping = positions.some(p => Math.abs(p - i) < blockLen);
        if (!isOverlapping) {
          positions.push(i);
          if (positions.length >= 2) {
            // 发现重复
            const firstLine = positions[0] + 1;
            const dupLine = i + 1;
            issues.push({
              type: 'code-duplication',
              severity: 'medium',
              line: dupLine,
              code: lines[i].trim(),
              message: `检测到代码重复 (${blockLen} 行)`,
              detail: `第 ${firstLine} 行开始与第 ${dupLine} 行开始存在 ${blockLen} 行的重复代码`,
              suggestion: '提取公共逻辑为函数或模块'
            });
            break; // 避免同一块产生多个问题
          }
        }
      }
    }
  }

  // ========================================================================
  // 3. auditCodebase — 递归目录审计
  // ========================================================================

  /**
   * 对代码目录进行递归审计
   *
   * 审计内容：
   * - 文件结构映射
   * - 各语言代码行数统计
   * - 导入依赖图
   * - 循环依赖检测
   * - 代码重复度估算（相似函数签名）
   * - 复杂度热点（高圈复杂度函数）
   *
   * @param {string} dirPath - 目录路径
   * @returns {Object} 审计报告
   * @returns {Object} .fileStructure - 文件结构树
   * @returns {Object} .locByLanguage - 各语言代码行数
   * @returns {Object} .dependencyGraph - 导入依赖图
   * @returns {Object[]} .circularDependencies - 循环依赖列表
   * @returns {Object} .duplication - 重复度分析
   * @returns {Object[]} .complexityHotspots - 复杂度热点
   * @returns {number} .totalFiles - 总文件数
   * @returns {number} .totalLOC - 总代码行数
   */
  auditCodebase(dirPath) {
    const resolvedPath = path.resolve(dirPath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        error: `目录不存在: ${resolvedPath}`,
        fileStructure: {}, locByLanguage: {},
        dependencyGraph: {}, circularDependencies: [],
        duplication: { score: 0, candidates: [] },
        complexityHotspots: [], totalFiles: 0, totalLOC: 0
      };
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return {
        error: `路径不是目录: ${resolvedPath}`,
        fileStructure: {}, locByLanguage: {},
        dependencyGraph: {}, circularDependencies: [],
        duplication: { score: 0, candidates: [] },
        complexityHotspots: [], totalFiles: 0, totalLOC: 0
      };
    }

    // 收集所有代码文件
    const allFiles = this._walkDirectory(resolvedPath);
    const codeFiles = allFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return Object.values(LANG_CONFIGS).some(c => c.extensions.includes(ext));
    });

    // 文件结构树
    const fileStructure = this._buildFileTree(resolvedPath, codeFiles);

    // 各语言统计
    const locByLanguage = {};
    const fileContents = new Map();

    for (const filePath of codeFiles) {
      const ext = path.extname(filePath).toLowerCase();
      let lang = null;
      for (const [langName, config] of Object.entries(LANG_CONFIGS)) {
        if (config.extensions.includes(ext)) {
          lang = langName;
          break;
        }
      }
      if (!lang) continue;

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        fileContents.set(filePath, { content, lang });

        if (!locByLanguage[lang]) {
          locByLanguage[lang] = { files: 0, totalLines: 0, logicalLines: 0 };
        }
        locByLanguage[lang].files++;
        locByLanguage[lang].totalLines += content.split('\n').length;
        locByLanguage[lang].logicalLines += countLogicalLines(content);
      } catch (e) {
        // 跳过无法读取的文件
        continue;
      }
    }

    // 依赖图
    const dependencyGraph = this._buildDependencyGraph(codeFiles, fileContents);

    // 循环依赖检测
    const circularDependencies = this._detectCircularDependencies(dependencyGraph);

    // 复杂度热点
    const complexityHotspots = this._findComplexityHotspots(codeFiles, fileContents);

    // 重复度估算
    const duplication = this._estimateDuplication(codeFiles, fileContents);

    const totalLOC = Object.values(locByLanguage).reduce((sum, l) => sum + l.logicalLines, 0);

    return {
      fileStructure,
      locByLanguage,
      dependencyGraph,
      circularDependencies,
      duplication,
      complexityHotspots,
      totalFiles: codeFiles.length,
      totalLOC,
      auditPath: resolvedPath
    };
  }

  /**
   * 递归遍历目录
   * @private
   * @param {string} dirPath - 目录路径
   * @param {string[]} [ignoreDirs] - 忽略的目录名
   * @returns {string[]} 文件路径列表
   */
  _walkDirectory(dirPath, ignoreDirs = ['node_modules', '.git', '__pycache__', 'dist', 'build', '.next', '.nuxt', 'venv', '.venv', 'env', '.env', 'coverage', '.nyc_output']) {
    const files = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (!ignoreDirs.includes(entry.name) && !entry.name.startsWith('.')) {
            files.push(...this._walkDirectory(fullPath, ignoreDirs));
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // 跳过权限不足的目录
    }

    return files;
  }

  /**
   * 构建文件结构树
   * @private
   * @param {string} basePath - 基础目录
   * @param {string[]} codeFiles - 代码文件列表
   * @returns {Object} 文件结构树
   */
  _buildFileTree(basePath, codeFiles) {
    const tree = { name: path.basename(basePath), type: 'directory', children: [], size: 0 };

    for (const filePath of codeFiles) {
      const relativePath = path.relative(basePath, filePath);
      const parts = relativePath.split(path.sep);
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (isLast) {
          current.children.push({
            name: part,
            type: 'file',
            size: fs.statSync(filePath).size,
            path: filePath
          });
          current.size += fs.statSync(filePath).size;
        } else {
          let dir = current.children.find(c => c.name === part && c.type === 'directory');
          if (!dir) {
            dir = { name: part, type: 'directory', children: [], size: 0 };
            current.children.push(dir);
          }
          current = dir;
          current.size += fs.statSync(filePath).size;
        }
      }
    }

    // 排序：目录在前，文件在后，按名称排序
    tree.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return tree;
  }

  /**
   * 构建依赖图
   * @private
   * @param {string[]} codeFiles - 代码文件路径列表
   * @param {Map} fileContents - 文件内容 Map
   * @returns {Object} 依赖图
   */
  _buildDependencyGraph(codeFiles, fileContents) {
    const graph = {};

    for (const [filePath, { content, lang }] of fileContents) {
      const relativePath = path.relative('.', filePath);
      const deps = this._extractDependencies(content, lang);

      graph[relativePath] = {
        language: lang,
        dependencies: deps.map(d => ({
          module: d.module,
          type: d.type,
          local: d.local
        })),
        dependencyCount: deps.length
      };
    }

    return graph;
  }

  /**
   * 检测循环依赖
   * @private
   * @param {Object} dependencyGraph - 依赖图
   * @returns {Object[]} 循环依赖列表
   */
  _detectCircularDependencies(dependencyGraph) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    const pathStack = [];

    const dfs = (node) => {
      visited.add(node);
      recursionStack.add(node);
      pathStack.push(node);

      const nodeInfo = dependencyGraph[node];
      if (nodeInfo) {
        for (const dep of nodeInfo.dependencies) {
          if (!dep.local) continue;

          // 尝试解析本地模块路径
          const resolvedDep = this._resolveLocalDep(node, dep.module);

          if (recursionStack.has(resolvedDep)) {
            // 发现循环
            const cyclePath = pathStack.slice(pathStack.indexOf(resolvedDep));
            cyclePath.push(resolvedDep);
            cycles.push({
              path: [...cyclePath],
              size: cyclePath.length,
              nodes: cyclePath.map(p => ({
                file: p,
                line: nodeInfo.dependencies.find(d => d.module === dep.module)?.line || 0
              }))
            });
          } else if (!visited.has(resolvedDep) && dependencyGraph[resolvedDep]) {
            dfs(resolvedDep);
          }
        }
      }

      pathStack.pop();
      recursionStack.delete(node);
    };

    for (const node of Object.keys(dependencyGraph)) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * 解析本地依赖路径
   * @private
   * @param {string} sourceFile - 源文件路径
   * @param {string} depModule - 依赖模块路径
   * @returns {string} 解析后的文件路径
   */
  _resolveLocalDep(sourceFile, depModule) {
    if (!depModule.startsWith('.')) return depModule;

    const sourceDir = path.dirname(sourceFile);
    const resolved = path.resolve(sourceDir, depModule);

    // 尝试常见扩展名
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.json'];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (fs.existsSync(withExt)) {
        return path.relative('.', withExt);
      }
    }

    // 尝试 index 文件
    for (const ext of extensions) {
      const indexFile = path.join(resolved, 'index' + ext);
      if (fs.existsSync(indexFile)) {
        return path.relative('.', indexFile);
      }
    }

    return path.relative('.', resolved);
  }

  /**
   * 查找复杂度热点
   * @private
   * @param {string[]} codeFiles - 代码文件路径列表
   * @param {Map} fileContents - 文件内容 Map
   * @returns {Object[]} 复杂度热点列表
   */
  _findComplexityHotspots(codeFiles, fileContents) {
    const hotspots = [];

    for (const [filePath, { content, lang }] of fileContents) {
      const analysis = this.analyzeCode(content, lang);

      for (const func of analysis.functions) {
        if (func.complexity >= 10) {
          hotspots.push({
            file: path.relative('.', filePath),
            language: lang,
            function: func.name,
            line: func.line,
            endLine: func.endLine,
            complexity: func.complexity,
            params: func.params,
            level: func.complexity >= 20 ? 'critical' :
                   func.complexity >= 15 ? 'high' : 'medium',
            suggestion: func.complexity >= 20 ?
              '此函数复杂度极高，强烈建议重构拆分为多个小函数' :
              '此函数复杂度偏高，建议考虑简化逻辑'
          });
        }
      }
    }

    // 按复杂度降序排列
    hotspots.sort((a, b) => b.complexity - a.complexity);

    return hotspots;
  }

  /**
   * 估算代码重复度
   * @private
   * @param {string[]} codeFiles - 代码文件路径列表
   * @param {Map} fileContents - 文件内容 Map
   * @returns {Object} 重复度分析结果
   */
  _estimateDuplication(codeFiles, fileContents) {
    const functionSignatures = [];

    // 提取所有函数签名
    for (const [filePath, { content, lang }] of fileContents) {
      const analysis = this.analyzeCode(content, lang);

      for (const func of analysis.functions) {
        functionSignatures.push({
          file: path.relative('.', filePath),
          name: func.name,
          line: func.line,
          params: func.params,
          complexity: func.complexity,
          // 生成规范化的函数体签名（忽略变量名）
          bodyHash: this._normalizeSignature(func.body || '')
        });
      }
    }

    // 比较函数相似度
    const candidates = [];
    for (let i = 0; i < functionSignatures.length; i++) {
      for (let j = i + 1; j < functionSignatures.length; j++) {
        const a = functionSignatures[i];
        const b = functionSignatures[j];

        // 跳过同名函数
        if (a.name === b.name && a.file === b.file) continue;

        const similarity = stringSimilarity(a.bodyHash, b.bodyHash);

        if (similarity > 0.7) {
          candidates.push({
            fileA: a.file,
            functionA: a.name,
            lineA: a.line,
            fileB: b.file,
            functionB: b.name,
            lineB: b.line,
            similarity: Math.round(similarity * 100) / 100,
            level: similarity > 0.9 ? 'high' :
                   similarity > 0.8 ? 'medium' : 'low'
          });
        }
      }
    }

    // 按相似度降序排列
    candidates.sort((a, b) => b.similarity - a.similarity);

    // 整体重复度分数
    const totalFunctions = functionSignatures.length;
    const dupCount = candidates.filter(c => c.similarity > 0.8).length;
    const score = totalFunctions > 0 ?
      Math.round((dupCount / totalFunctions) * 100) / 100 : 0;

    return {
      score,
      totalFunctions,
      duplicatePairs: candidates.length,
      candidates: candidates.slice(0, 20) // 只返回前20个
    };
  }

  /**
   * 规范化函数签名用于比较
   * @private
   * @param {string} body - 函数体
   * @returns {string} 规范化后的签名
   */
  _normalizeSignature(body) {
    return body
      .replace(/\b(const|let|var)\s+\w+/g, '$1 VAR')
      .replace(/\b\w+\s*=\s*/g, 'VAR=')
      .replace(/'[^']*'/g, "'STR'")
      .replace(/"[^"]*"/g, '"STR"')
      .replace(/`[^`]*`/g, '`STR`')
      .replace(/\d+/g, 'N')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ========================================================================
  // 4. suggestFix — 生成修复建议
  // ========================================================================

  /**
   * 根据检测到的问题生成代码修复建议
   *
   * @param {Object} issue - 问题对象（来自 reviewCode 或 analyzeCode 的结果）
   * @param {string} issue.type - 问题类型
   * @param {string} issue.code - 有问题的代码片段
   * @param {string} [issue.message] - 问题描述
   * @param {string} [issue.language] - 代码语言
   * @returns {Object} 修复建议
   * @returns {string} .originalCode - 原始代码
   * @returns {string} .fixedCode - 修复后的代码
   * @returns {string} .explanation - 修复说明
   * @returns {string} .type - 修复类型
   * @returns {number} .confidence - 建议置信度
   */
  suggestFix(issue) {
    if (!issue || !issue.type) {
      return {
        error: '无效的问题对象，需要包含 type 字段',
        originalCode: '',
        fixedCode: '',
        explanation: '',
        confidence: 0
      };
    }

    const code = issue.code || '';
    const lang = issue.language || detectLanguage(code);

    // 规范化 issue type（兼容下划线和连字符）
    const normalizedType = issue.type.replace(/_/g, '-');
    switch (normalizedType) {
      case 'missing-null-check':
        return this._fixMissingNullCheck(code, lang);
      case 'missing-default-param':
        return this._fixMissingDefaultParam(code, lang);
      case 'off-by-one':
        return this._fixOffByOne(code);
      case 'unhandled-promise':
        return this._fixUnhandledPromise(code, lang);
      case 'empty-catch':
        return this._fixEmptyCatch(code);
      case 'unnecessary-async':
        return this._fixUnnecessaryAsync(code, lang);
      case 'type-coercion':
        return this._fixTypeCoercion(code);
      case 'unused-variable':
        return this._fixUnusedVariable(code);
      case 'magic-number':
        return this._fixMagicNumber(code);
      case 'hardcoded-path':
        return this._fixHardcodedPath(code);
      case 'sync-in-async':
        return this._fixSyncInAsync(code);
      case 'security':
        return this._fixSecurityIssue(code, issue);
      case 'empty-branch':
        return this._fixEmptyBranch(code);
      case 'implicit-assumption':
        return this._fixImplicitAssumption(code);
      case 'missing-empty-check':
        return this._fixMissingEmptyCheck(code);
      case 'global-state-dependency':
        return this._fixGlobalStateDependency(code);
      default:
        return {
          originalCode: code,
          fixedCode: code,
          explanation: `未知问题类型 "${issue.type}"，无法生成自动修复建议`,
          type: 'unknown',
          confidence: 0.1
        };
    }
  }

  /**
   * 修复空值检查缺失
   * @private
   */
  _fixMissingNullCheck(code) {
    const match = code.match(/(\w+)\.(\w+)/);
    if (match) {
      const [full, obj, prop] = match;
      const fixedCode = code.replace(full, `${obj}?.${prop}`);
      return {
        originalCode: code,
        fixedCode,
        explanation: `使用可选链操作符 ?. 替代直接属性访问，当 ${obj} 为 null 或 undefined 时安全返回 undefined`,
        type: 'optional-chaining',
        confidence: 0.85
      };
    }

    // 解构修复
    const destMatch = code.match(/(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(\w+)/);
    if (destMatch) {
      const [full, props, src] = destMatch;
      const fixedCode = full + ' ?? {}';
      return {
        originalCode: code,
        fixedCode,
        explanation: `添加空值合并运算符 ?? {}，当 ${src} 为 null/undefined 时使用空对象作为默认值`,
        type: 'null-coalescing',
        confidence: 0.8
      };
    }

    return {
      originalCode: code,
      fixedCode: code,
      explanation: '添加空值检查，使用 if (variable != null) 或可选链 ?. 保护属性访问',
      type: 'manual-review',
      confidence: 0.5
    };
  }

  /**
   * 修复缺少默认参数
   * @private
   */
  _fixMissingDefaultParam(code) {
    const paramName = code.trim();
    if (paramName) {
      return {
        originalCode: code,
        fixedCode: `${paramName} = null`,
        explanation: `为参数 "${paramName}" 添加默认值，避免调用时未传递参数导致 undefined`,
        type: 'default-parameter',
        confidence: 0.9
      };
    }
    return {
      originalCode: code,
      fixedCode: code,
      explanation: '为函数参数添加默认值',
      type: 'default-parameter',
      confidence: 0.7
    };
  }

  /**
   * 修复差一错误
   * @private
   */
  _fixOffByOne(code) {
    const fixedCode = code.replace(/<=/g, '<');
    return {
      originalCode: code,
      fixedCode,
      explanation: '将 <= 改为 <，因为数组索引从 0 开始，最大有效索引为 length - 1',
      type: 'off-by-one-fix',
      confidence: 0.9
    };
  }

  /**
   * 修复未处理的 Promise
   * @private
   */
  _fixUnhandledPromise(code, lang) {
    const match = code.match(/(\w+(?:\([^)]*\))?)\s*[;]/);
    if (match) {
      const call = match[1];
      const fixedCode = code.replace(call + ';', `await ${call};`);
      return {
        originalCode: code,
        fixedCode,
        explanation: '添加 await 关键字确保 Promise 被正确处理，异常可被外层 try/catch 捕获',
        type: 'add-await',
        confidence: 0.85
      };
    }
    return {
      originalCode: code,
      fixedCode: code + '.catch(err => console.error(err))',
      explanation: '链式添加 .catch() 处理 Promise 拒绝情况',
      type: 'add-catch',
      confidence: 0.8
    };
  }

  /**
   * 修复空 catch 块
   * @private
   */
  _fixEmptyCatch(code) {
    const fixedCode = code.replace(/\.catch\s*\(\s*\(\s*\w+\s*\)\s*=>\s*\{?\s*\}?\s*\)/,
      '.catch(err => console.error(\'操作失败:\', err))');
    return {
      originalCode: code,
      fixedCode,
      explanation: '在 catch 块中添加错误日志记录，避免静默吞掉错误',
      type: 'add-error-logging',
      confidence: 0.9
    };
  }

  /**
   * 修复不必要的 async
   * @private
   */
  _fixUnnecessaryAsync(code, lang) {
    const fixedCode = code.replace(/async\s+/, '');
    return {
      originalCode: code,
      fixedCode,
      explanation: '函数内没有使用 await，移除 async 关键字避免误导',
      type: 'remove-async',
      confidence: 0.85
    };
  }

  /**
   * 修复类型强制转换
   * @private
   */
  _fixTypeCoercion(code) {
    const looseEq = code.match(/(\w+)\s*==\s*(null|undefined|0|''|\[\])/);
    if (looseEq) {
      const [full, left, right] = looseEq;
      const fixedCode = code.replace(full, `${left} === ${right}`);
      return {
        originalCode: code,
        fixedCode,
        explanation: '使用 === 严格相等替代 ==，避免隐式类型转换导致的意外结果',
        type: 'strict-equality',
        confidence: 0.95
      };
    }

    const plusMatch = code.match(/(\w+)\s*\+\s*['"]['"]/);
    if (plusMatch) {
      const [full, varName] = plusMatch;
      const fixedCode = code.replace(full, `String(${varName})`);
      return {
        originalCode: code,
        fixedCode,
        explanation: '使用 String() 显式转换，明确表达类型转换意图',
        type: 'explicit-conversion',
        confidence: 0.8
      };
    }

    return {
      originalCode: code,
      fixedCode: code,
      explanation: '使用 === 替代 ==，避免隐式类型转换',
      type: 'strict-equality',
      confidence: 0.7
    };
  }

  /**
   * 修复未使用的变量
   * @private
   */
  _fixUnusedVariable(code) {
    return {
      originalCode: code,
      fixedCode: `// ${code.trim()}`,
      explanation: '注释掉未使用的变量声明，或确认是否应被使用',
      type: 'comment-out',
      confidence: 0.6
    };
  }

  /**
   * 修复魔法数字
   * @private
   */
  _fixMagicNumber(code) {
    const match = code.match(/(\d+)/);
    if (match) {
      const num = match[1];
      const fixedCode = code.replace(num, 'SOME_MEANINGFUL_CONSTANT');
      return {
        originalCode: code,
        fixedCode,
        explanation: `将魔法数字 ${num} 提取为具名常量，提高代码可读性`,
        type: 'extract-constant',
        confidence: 0.75
      };
    }
    return {
      originalCode: code,
      fixedCode: code,
      explanation: '将数字提取为具名常量',
      type: 'extract-constant',
      confidence: 0.5
    };
  }

  /**
   * 修复硬编码路径
   * @private
   */
  _fixHardcodedPath(code) {
    const match = code.match(/['"]((?:\/|[a-zA-Z]:\\|\.\.\/|\.\/)[^'"]+)['"]/);
    if (match) {
      const [full, pathStr] = match;
      const fixedCode = code.replace(full, `path.join(__dirname, '${pathStr.replace(/^\.\//, '')}')`);
      return {
        originalCode: code,
        fixedCode,
        explanation: '使用 path.join() 和 __dirname 构建跨平台兼容的文件路径',
        type: 'use-path-join',
        confidence: 0.85
      };
    }
    return {
      originalCode: code,
      fixedCode: code,
      explanation: '使用 path.join() 替代硬编码路径分隔符',
      type: 'use-path-join',
      confidence: 0.7
    };
  }

  /**
   * 修复异步中的同步操作
   * @private
   */
  _fixSyncInAsync(code) {
    const fixedCode = code
      .replace(/readFileSync/g, 'readFile')
      .replace(/writeFileSync/g, 'writeFile')
      .replace(/execSync/g, 'exec')
      .replace(/spawnSync/g, 'spawn');
    return {
      originalCode: code,
      fixedCode,
      explanation: '使用异步版本替代同步版本，避免阻塞事件循环',
      type: 'use-async-api',
      confidence: 0.9
    };
  }

  /**
   * 修复安全问题
   * @private
   */
  _fixSecurityIssue(code, issue) {
    if (code.includes('eval(')) {
      return {
        originalCode: code,
        fixedCode: code.replace(/eval\s*\(([^)]+)\)/, 'JSON.parse($1)'),
        explanation: '使用 JSON.parse() 替代 eval() 解析结构化数据，避免任意代码执行风险',
        type: 'security-fix',
        confidence: 0.8
      };
    }
    if (code.includes('innerHTML')) {
      return {
        originalCode: code,
        fixedCode: code.replace(/\.innerHTML\s*=/, '.textContent ='),
        explanation: '使用 textContent 替代 innerHTML，避免 XSS 注入风险',
        type: 'security-fix',
        confidence: 0.9
      };
    }
    return {
      originalCode: code,
      fixedCode: `// TODO: 安全审查 - ${issue.message || '需要加固'}\n${code}`,
      explanation: `标记需要安全审查的代码: ${issue.message || '未知安全风险'}`,
      type: 'security-review',
      confidence: 0.5
    };
  }

  /**
   * 修复空分支
   * @private
   */
  _fixEmptyBranch(code) {
    const fixedCode = code.replace(/\{\s*\}/, '{ /* TODO: 实现分支逻辑 */ }');
    return {
      originalCode: code,
      fixedCode,
      explanation: '添加 TODO 标记，提醒实现空分支的代码逻辑',
      type: 'add-todo',
      confidence: 0.7
    };
  }

  /**
   * 修复隐式假设
   * @private
   */
  _fixImplicitAssumption(code) {
    const match = code.match(/(\w+)\.(\w+)/);
    if (match) {
      const [full, obj, prop] = match;
      const fixedCode = code.replace(full, `(${obj}?.${prop} ?? defaultValue)`);
      return {
        originalCode: code,
        fixedCode,
        explanation: `使用可选链和空值合并，当 ${obj} 不存在或缺少 ${prop} 属性时使用默认值`,
        type: 'add-guard',
        confidence: 0.8
      };
    }
    return {
      originalCode: code,
      fixedCode: code,
      explanation: '添加对象属性存在的验证检查',
      type: 'add-guard',
      confidence: 0.5
    };
  }

  /**
   * 修复缺少空集合检查
   * @private
   */
  _fixMissingEmptyCheck(code) {
    const match = code.match(/(\w+)\.(map|filter|forEach|reduce|find|some|every)/);
    if (match) {
      const [full, arr, method] = match;
      const fixedCode = code.replace(full, `(${arr}.length > 0 ? ${full} : ${method === 'reduce' ? 'initialValue' : '[]'})`);
      return {
        originalCode: code,
        fixedCode,
        explanation: `添加数组长度检查，当 ${arr} 为空时返回默认值`,
        type: 'add-empty-check',
        confidence: 0.7
      };
    }
    return {
      originalCode: code,
      fixedCode: code,
      explanation: '添加 if (array.length > 0) 检查',
      type: 'add-empty-check',
      confidence: 0.6
    };
  }

  /**
   * 修复全局状态依赖
   * @private
   */
  _fixGlobalStateDependency(code) {
    const match = code.match(/(\w+)\.[a-zA-Z_$]+/);
    if (match) {
      const globalObj = match[1];
      const fixedCode = code.replace(globalObj, '/* 依赖注入 */');
      return {
        originalCode: code,
        fixedCode,
        explanation: `将对 ${globalObj} 的全局依赖改为依赖注入方式，提高可测试性`,
        type: 'dependency-injection',
        confidence: 0.6
      };
    }
    return {
      originalCode: code,
      fixedCode: code,
      explanation: '将对全局状态的引用改为通过参数传递',
      type: 'dependency-injection',
      confidence: 0.5
    };
  }

  // ========================================================================
  // 5. compareVersions — 结构化版本对比
  // ========================================================================

  /**
   * 对两段代码进行结构化语义对比
   *
   * 与纯文本 diff 不同，此方法理解代码结构：
   * - 识别重命名（函数/变量改名而非重写）
   * - 检测逻辑变更（条件/循环/返回值变化）
   * - 发现新增/删除/修改的函数
   * - 评估变更影响范围
   *
   * @param {string} oldCode - 旧版本代码
   * @param {string} newCode - 新版本代码
   * @returns {Object} 对比结果
   * @returns {Object[]} .functionsChanged - 变更的函数列表
   * @returns {Object[]} .newFunctions - 新增的函数
   * @returns {Object[]} .removedFunctions - 删除的函数
   * @returns {Object[]} .dependenciesChanged - 变更的依赖
   * @returns {Object} .complexityChange - 复杂度变化
   * @returns {number} .similarity - 整体相似度 (0-1)
   * @returns {string} .impact - 变更影响评估
   * @returns {number} .confidence - 对比置信度
   */
  compareVersions(oldCode, newCode) {
    if (typeof oldCode !== 'string' || typeof newCode !== 'string') {
      return {
        error: '需要提供 oldCode 和 newCode 两个字符串参数',
        functionsChanged: [], newFunctions: [], removedFunctions: [],
        dependenciesChanged: [], similarity: 0, impact: 'unknown',
        confidence: 0
      };
    }

    const oldLang = detectLanguage(oldCode);
    const newLang = detectLanguage(newCode);
    const lang = oldLang === newLang ? oldLang : 'javascript';

    // 分析两个版本
    const oldAnalysis = this.analyzeCode(oldCode, lang);
    const newAnalysis = this.analyzeCode(newCode, lang);

    // 对比函数
    const functionsChanged = [];
    const newFunctions = [];
    const removedFunctions = [];

    // 建立函数名到定义的映射
    const oldFuncMap = new Map(oldAnalysis.functions.map(f => [f.name, f]));
    const newFuncMap = new Map(newAnalysis.functions.map(f => [f.name, f]));

    // 找出变更/新增/删除的函数
    for (const [name, newFunc] of newFuncMap) {
      if (oldFuncMap.has(name)) {
        const oldFunc = oldFuncMap.get(name);
        // 检查是否有变更
        const oldBody = this._normalizeSignature(oldFunc.body || '');
        const newBody = this._normalizeSignature(newFunc.body || '');
        const bodySimilarity = stringSimilarity(oldBody, newBody);

        if (bodySimilarity < 1.0) {
          const complexityDelta = newFunc.complexity - oldFunc.complexity;
          const paramsChanged = JSON.stringify(oldFunc.params) !== JSON.stringify(newFunc.params);

          functionsChanged.push({
            name,
            oldLine: oldFunc.line,
            newLine: newFunc.line,
            oldComplexity: oldFunc.complexity,
            newComplexity: newFunc.complexity,
            complexityDelta,
            paramsChanged,
            oldParams: oldFunc.params,
            newParams: newFunc.params,
            bodySimilarity: Math.round(bodySimilarity * 100) / 100,
            changeType: bodySimilarity > 0.7 ? 'modified' : 'rewritten',
            impact: complexityDelta > 5 ? 'high' :
                    complexityDelta > 2 ? 'medium' : 'low'
          });
        }
      } else {
        newFunctions.push({
          name: newFunc.name,
          line: newFunc.line,
          complexity: newFunc.complexity,
          params: newFunc.params
        });
      }
    }

    // 找出删除的函数
    for (const [name, oldFunc] of oldFuncMap) {
      if (!newFuncMap.has(name)) {
        removedFunctions.push({
          name: oldFunc.name,
          line: oldFunc.line,
          complexity: oldFunc.complexity
        });
      }
    }

    // 对比依赖
    const dependenciesChanged = this._compareDependencies(
      oldAnalysis.dependencies, newAnalysis.dependencies
    );
    const depChanges = dependenciesChanged.changes || [];

    // 计算整体相似度
    const oldBody = this._normalizeSignature(oldCode);
    const newBody = this._normalizeSignature(newCode);
    const similarity = stringSimilarity(oldBody, newBody);

    // 评估影响
    const totalChanges = functionsChanged.length + newFunctions.length +
      removedFunctions.length + depChanges.length;

    let impact;
    if (totalChanges === 0) impact = 'none';
    else if (functionsChanged.some(f => f.changeType === 'rewritten') ||
             newFunctions.length > 3 || removedFunctions.length > 3) {
      impact = 'major';
    } else if (totalChanges > 5 || functionsChanged.some(f => f.impact === 'high')) {
      impact = 'significant';
    } else if (totalChanges > 2) {
      impact = 'minor';
    } else {
      impact = 'cosmetic';
    }

    // 置信度
    const confidence = Math.min(
      Math.round((0.4 + (oldAnalysis.confidence + newAnalysis.confidence) / 2) * 100) / 100,
      0.95
    );

    return {
      functionsChanged,
      newFunctions,
      removedFunctions,
      dependenciesChanged: depChanges,
      complexityChange: {
        oldTotal: oldAnalysis.cyclomaticComplexity,
        newTotal: newAnalysis.cyclomaticComplexity,
        delta: newAnalysis.cyclomaticComplexity - oldAnalysis.cyclomaticComplexity
      },
      similarity: Math.round(similarity * 100) / 100,
      impact,
      totalChanges,
      confidence
    };
  }

  /**
   * 对比两个版本的依赖列表
   * @private
   * @param {Object[]} oldDeps - 旧依赖列表
   * @param {Object[]} newDeps - 新依赖列表
   * @returns {Object[]} 依赖变更列表
   */
  _compareDependencies(oldDeps, newDeps) {
    const changes = [];

    const oldModules = new Set(oldDeps.map(d => d.module));
    const newModules = new Set(newDeps.map(d => d.module));

    // 新增的依赖
    for (const dep of newDeps) {
      if (!oldModules.has(dep.module)) {
        changes.push({
          module: dep.module,
          type: 'added',
          category: dep.category,
          line: dep.line
        });
      }
    }

    // 删除的依赖
    for (const dep of oldDeps) {
      if (!newModules.has(dep.module)) {
        changes.push({
          module: dep.module,
          type: 'removed',
          category: dep.category,
          line: dep.line
        });
      }
    }

    return {
      changes,
      changeCount: changes.length,
    };
  }

  /**
   * 检查性能问题
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkPerformanceIssues(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    // 1. 嵌套循环 O(n²) 检测
    let loopDepth = 0;
    let loopLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\b(for|while)\s*\(/.test(line)) {
        loopDepth++;
        loopLines.push(i + 1);
      }
    }
    if (loopDepth >= 2) {
      issues.push({
        type: 'nested-loop',
        severity: 'medium',
        line: loopLines[0],
        code: lines[loopLines[0] - 1].trim(),
        message: '嵌套循环可能导致 O(n²) 复杂度',
        detail: `检测到 ${loopDepth} 层循环嵌套，当数据量大时性能显著下降`,
        suggestion: '考虑使用 Map/Set 索引、提前退出或分治策略优化'
      });
    }

    // 2. JSON.parse(JSON.stringify(obj)) 深拷贝检测
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/JSON\s*\.\s*parse\s*\(\s*JSON\s*\.\s*stringify/.test(line)) {
        issues.push({
          type: 'inefficient-deep-copy',
          severity: 'medium',
          line: i + 1,
          code: line.trim(),
          message: '低效的深拷贝方式',
          detail: 'JSON.parse(JSON.stringify(obj)) 会丢失函数、undefined、Symbol、循环引用',
          suggestion: '使用 structuredClone() 或 lodash.cloneDeep()'
        });
      }
    }

    // 3. 正则表达式性能问题
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regexMatch = line.match(/\.match\s*\(\s*\/([^\/]*)\/([^\)]*)\)/);
      if (regexMatch && !regexMatch[2].includes('g')) {
        const pattern = regexMatch[1];
        if (pattern.length > 10) {
          issues.push({
            type: 'regex-performance',
            severity: 'low',
            line: i + 1,
            code: line.trim(),
            message: '正则未使用全局匹配标志',
            detail: `较长的正则模式缺少 g 标志可能导致只匹配第一个结果`,
            suggestion: '在正则末尾添加 g 标志: /pattern/g'
          });
        }
      }
    }

    // 4. 链式迭代多次遍历
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\.filter\s*\(.*\)\s*\.\s*map/.test(line) || /\.filter\s*\(.*\)\s*\.\s*forEach/.test(line)) {
        issues.push({
          type: 'chained-iteration',
          severity: 'low',
          line: i + 1,
          code: line.trim(),
          message: '链式迭代导致多次遍历',
          detail: 'filter + map/forEach 链会遍历数组两次，大数据量时性能损失明显',
          suggestion: '使用 reduce() 或 flatMap() 单次遍历完成'
        });
      }
    }

    // 5. 频繁 DOM 操作（仅 JS/TS）
    if (lang === 'javascript' || lang === 'typescript') {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\.innerHTML\s*=/.test(line) && /for\s*\(|while\s*\(|forEach\s*\(/.test(lines.slice(Math.max(0, i-5), i+1).join('\n'))) {
          issues.push({
            type: 'dom-in-loop',
            severity: 'high',
            line: i + 1,
            code: line.trim(),
            message: '循环中操作 DOM',
            detail: '在循环中直接修改 innerHTML 会导致多次重排/重绘',
            suggestion: '使用 DocumentFragment 或拼接字符串后一次性赋值'
          });
          break;
        }
      }
    }
  }

  /**
   * 检查并发/竞态安全问题
   * @private
   * @param {string} cleanCode - 去除注释的代码
   * @param {string} lang - 语言
   * @param {Object[]} issues - 问题列表（追加模式）
   */
  _checkConcurrencySafety(cleanCode, lang, issues) {
    const lines = getLines(cleanCode);

    // JS/TS 检查
    if (lang === 'javascript' || lang === 'typescript') {
      // 1. Promise.all 中共享变量的竞态条件
      const allContent = cleanCode;
      const promiseAllMatch = allContent.match(/Promise\.all\s*\(/);
      if (promiseAllMatch) {
        const promiseBlock = allContent.substring(promiseAllMatch.index);
        const varMatch = promiseBlock.match(/(?:let|var|const)\s+(\w+)\s*[=;]/);
        if (varMatch) {
          const varName = varMatch[1];
          const assignmentCount = (promiseBlock.match(new RegExp(`${varName}\\s*=`, 'g')) || []).length;
          if (assignmentCount > 1) {
            issues.push({
              type: 'race-condition',
              severity: 'high',
              line: lines.findIndex(l => l.includes('Promise.all')) + 1,
              code: 'Promise.all(...)',
              message: 'Promise.all 中存在共享变量竞态条件',
              detail: `变量 "${varName}" 在多个 promise 回调中被赋值，最终值不可预测`,
              suggestion: '使用 Promise.allSettled() 或为每个 promise 创建独立作用域'
            });
          }
        }
      }

      // 2. 全局变量在异步操作中被修改
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/(?:let|var)\s+(\w+)\s*;/.test(line) && !/^\s*(?:for|while)\s*\(/.test(line)) {
          const globalVar = line.match(/(?:let|var)\s+(\w+)\s*;/);
          if (globalVar) {
            const varName = globalVar[1];
            const asyncPattern = new RegExp(`${varName}\\s*=\\s*[^;]+\\s*(?:;|$)`);
            let inAsyncScope = false;
            for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 50); j++) {
              if (/\bthen\s*\(|async\s+\w+\s*\(|setTimeout|setInterval/.test(lines[j])) {
                inAsyncScope = true;
              }
              if (inAsyncScope && asyncPattern.test(lines[j]) && j > i) {
                issues.push({
                  type: 'shared-mutable-state',
                  severity: 'medium',
                  line: j + 1,
                  code: lines[j].trim(),
                  message: '异步作用域中修改共享变量',
                  detail: `变量 "${varName}" 在模块顶层声明，被异步回调修改可能导致竞态`,
                  suggestion: '使用局部变量或闭包隔离异步状态'
                });
                break;
              }
            }
          }
        }
      }
    }

    // Python 检查
    if (lang === 'python') {
      const hasThreading = /\bthreading\b/.test(cleanCode);
      const hasLock = /\bthreading\.Lock\b|\bthreading\.RLock\b/.test(cleanCode);
      if (hasThreading && !hasLock) {
        const threadLine = lines.findIndex(l => l.includes('threading.Thread'));
        issues.push({
          type: 'missing-thread-lock',
          severity: 'high',
          line: threadLine >= 0 ? threadLine + 1 : 1,
          code: threadLine >= 0 ? lines[threadLine].trim() : 'threading',
          message: '多线程环境中未使用锁保护共享状态',
          detail: '检测到 threading.Thread 但未找到 Lock/RLock，共享变量存在竞态风险',
          suggestion: '添加 threading.Lock() 保护共享变量写入，使用 with lock: 确保释放'
        });
      }

      const hasAsyncIO = /\basyncio\b/.test(cleanCode);
      const hasGlobalVar = /\bglobal\b/.test(cleanCode);
      if (hasAsyncIO && hasGlobalVar) {
        issues.push({
          type: 'async-global-state',
          severity: 'medium',
          line: lines.findIndex(l => l.includes('global')) + 1 || 1,
          code: 'global ...',
          message: 'asyncio 协程中使用了全局变量',
          detail: '在 asyncio 环境中使用 global 变量可能导致协程间状态混乱',
          suggestion: '使用 asyncio.Queue() 或显式参数传递代替全局变量'
        });
      }
    }
  }

}
// ============================================================================
// 导出
// ============================================================================

module.exports = { CodeEngine };
