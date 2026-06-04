/**
 * 代码验证器 v2.1.0 - 验证生成代码的正确性、安全性、质量
 * 支持: JS, TS, Python, Shell, JSON
 * 
 * 功能升级 (v2.0.61 → v2.1.0):
 * - TypeScript/TSX 验证 (类型注解、接口、泛型检查)
 * - JSON 有效性验证 (语法/结构/必需字段/类型约束)
 * - 安全漏洞扫描 (XSS/注入/路径遍历/原型污染/不安全eval)
 * - 异步错误检测 (未捕获Promise拒绝/未await异步函数)
 * - 复杂度分析 (圈复杂度/函数长度/嵌套深度/代码行统计)
 * - 导入解析验证 (相对路径/本地模块存在性检查)
 * - 综合质量评分 (0-100, 多维度加权)
 */
const fs = require('fs');
const path = require('path');

const codeVerifier = {
  // ===== JS 验证 =====

  // 验证JS文件
  verifyJS(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyJSContent(content);
    } catch (e) {
      return { ok: false, errors: [`无法读取文件: ${e.message}`] };
    }
  },

  // 验证JS内容
  verifyJSContent(content) {
    const errors = [];
    const warnings = [];

    // 括号平衡
    const open = (content.match(/\{/g) || []).length;
    const close = (content.match(/\}/g) || []).length;
    if (open !== close) errors.push(`括号不匹配: 开${open} vs 闭${close}`);

    // 圆括号平衡
    const pOpen = (content.match(/\(/g) || []).length;
    const pClose = (content.match(/\)/g) || []).length;
    if (pOpen !== pClose) errors.push(`圆括号不匹配: 开${pOpen} vs 闭${pClose}`);

    // 方括号平衡
    const bOpen = (content.match(/\[/g) || []).length;
    const bClose = (content.match(/\]/g) || []).length;
    if (bOpen !== bClose) errors.push(`方括号不匹配: 开${bOpen} vs 闭${bClose}`);

    // 检查 module.exports 或 export
    if (!content.includes('module.exports') && !content.includes('export ')) {
      warnings.push('未发现 module.exports 或 export，模块可能无法被引用');
    }

    // 检查 require 引用是否存在
    const requires = content.match(/require\s*\(\s*['"][^'"]+['"]\s*\)/g) || [];
    for (const req of requires) {
      const match = req.match(/['"]([^'"]+)['"]/);
      if (match) {
        const modulePath = match[1];
        if (modulePath.startsWith('.')) {
          // 相对路径存在性检查（仅警告）
        }
      }
    }

    return { ok: errors.length === 0, errors, warnings };
  },

  // ===== TypeScript 验证 =====

  /**
   * 验证 TypeScript/TSX 文件
   */
  verifyTS(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyTSContent(content);
    } catch (e) {
      return { ok: false, errors: [`无法读取文件: ${e.message}`] };
    }
  },

  /**
   * 验证 TypeScript 内容
   * 检查: 类型注解完整性、接口/类型定义、泛型使用
   */
  verifyTSContent(content) {
    const errors = [];
    const warnings = [];

    // 基础括号平衡
    const open = (content.match(/\{/g) || []).length;
    const close = (content.match(/\}/g) || []).length;
    if (open !== close) errors.push(`括号不匹配: 开${open} vs 闭${close}`);

    const pOpen = (content.match(/\(/g) || []).length;
    const pClose = (content.match(/\)/g) || []).length;
    if (pOpen !== pClose) errors.push(`圆括号不匹配: 开${pOpen} vs 闭${pClose}`);

    const aOpen = (content.match(/</g) || []).length;
    const aClose = (content.match(/>/g) || []).length;
    // 粗略泛型括号检查：当数量相差很大时报错
    if (Math.abs(aOpen - aClose) > 5) {
      warnings.push(`泛型尖括号可能不平衡: 差${Math.abs(aOpen - aClose)}`);
    }

    // 检查接口定义中的属性类型完整性
    const interfaceDecls = content.match(/interface\s+\w+\s*\{/g) || [];
    if (interfaceDecls.length > 0 && !content.includes(':')) {
      warnings.push('存在 interface 定义但未检测到类型注解(:)，可能缺少类型标注');
    }

    // 检查函数返回值类型注解
    const functionDecls = content.match(/(?:function|=>)\s*[^:{]*\{/g) || [];
    const typedReturns = content.match(/\)\s*:\s*\w+/g) || [];
    if (functionDecls.length > typedReturns.length + 3) {
      warnings.push(`${functionDecls.length - typedReturns.length} 个函数缺少返回值类型注解`);
    }

    // 检查 export/import
    if (!content.includes('export ') && !content.includes('export default')) {
      warnings.push('未发现 export，模块可能无法被外部引用');
    }

    // 检查 any 类型滥用
    const anyCount = (content.match(/: any/g) || []).length;
    if (anyCount > 5) {
      warnings.push(`过度使用 any 类型(${anyCount}次)，建议使用更具体的类型`);
    }

    // 检查 interface vs type 使用
    if (interfaceDecls.length === 0) {
      const typeAliases = content.match(/type\s+\w+\s*=/g) || [];
      if (typeAliases.length > 0) {
        warnings.push('使用了 type 别名定义复杂类型，部分场景建议使用 interface（更好的类型合并）');
      }
    }

    // 检查严格 null 检查相关
    if (content.includes('null') && !content.includes('| null') && !content.includes('?.')) {
      warnings.push('使用了 null 值但未在类型中声明 | null，可能触发严格空检查');
    }

    // 检查可选链使用（推荐）
    if (content.includes('&&') && content.includes('.')) {
      const optionalChains = (content.match(/\?\./g) || []).length;
      if (optionalChains === 0 && content.includes('&&')) {
        warnings.push('深层属性访问建议使用可选链(?.)替代 && 链式检查');
      }
    }

    return { ok: errors.length === 0, errors, warnings };
  },

  // ===== JSON 验证 =====

  /**
   * 验证 JSON 文件
   */
  verifyJSON(filePath, schema = null) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyJSONContent(content, schema);
    } catch (e) {
      return { ok: false, errors: [`无法读取文件: ${e.message}`] };
    }
  },

  /**
   * 验证 JSON 内容
   * 检查: 语法正确性、必需字段、值类型约束
   * @param {string} content - JSON 字符串
   * @param {object} [schema] - 可选的结构描述 { required: string[], types: { [key]: string } }
   */
  verifyJSONContent(content, schema = null) {
    const errors = [];
    const warnings = [];

    // 1. 语法检查
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      errors.push(`JSON 语法错误: ${e.message}`);
      return { ok: false, errors, warnings, syntaxValid: false };
    }

    // 2. 非对象/数组警告
    if (typeof parsed !== 'object' || parsed === null) {
      warnings.push('JSON 顶层不是对象或数组，请确认是否符合预期');
    }

    // 3. 必需字段检查
    if (schema && schema.required && Array.isArray(schema.required)) {
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        for (const field of schema.required) {
          if (!(field in parsed)) {
            errors.push(`缺少必需字段: "${field}"`);
          }
        }
      }
    }

    // 4. 值类型检查
    if (schema && schema.types && typeof parsed === 'object' && parsed !== null) {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        if (field in parsed) {
          const actualType = Array.isArray(parsed[field]) ? 'array' : typeof parsed[field];
          if (actualType !== expectedType) {
            warnings.push(`字段 "${field}" 期望类型 ${expectedType}，实际为 ${actualType}`);
          }
        }
      }
    }

    // 5. 尾随逗号警告（JSON 不允许）
    if (/,(\s*[\]}])/g.test(content)) {
      warnings.push('JSON 中不允许尾随逗号');
    }

    // 6. 注释检查（JSON 不允许注释）
    if (/\/\/|\/\*/g.test(content)) {
      warnings.push('JSON 中不允许注释(// 或 /* */)');
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      syntaxValid: true,
      parsedType: Array.isArray(parsed) ? 'array' : typeof parsed,
      keyCount: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0
    };
  },

  // ===== Python 验证 =====

  // 验证Python文件
  verifyPy(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyPyContent(content);
    } catch (e) {
      return { ok: false, errors: [`无法读取文件: ${e.message}`] };
    }
  },

  verifyPyContent(content) {
    const errors = [];
    const warnings = [];

    // 缩进一致性（简单检查：不能混合tab和空格）
    const tabLines = content.split('\n').filter(l => l.startsWith('\t') && l.match(/^    /));
    if (tabLines.length > 0) errors.push('检测到混用 tab 和空格缩进');

    // 检查 def 或 class 定义
    if (!content.includes('def ') && !content.includes('class ')) {
      warnings.push('未发现 def 或 class，文件可能不是有效Python模块');
    }

    // 括号匹配（简单）
    const open = (content.match(/\{/g) || []).length;
    const close = (content.match(/\}/g) || []).length;
    if (Math.abs(open - close) > 5) errors.push(`括号可能不平衡: 差${Math.abs(open-close)}`);

    // Python 特有的缩进问题
    const lines = content.split('\n');
    let prevIndent = 0;
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      const indent = line.length - trimmed.length;
      if (indent > prevIndent + 4 && prevIndent > 0) {
        warnings.push(`第${i+1}行缩进跳跃过大(${indent})，可能是 tab/空格混合`);
        break;
      }
      if (trimmed.endsWith(':') || trimmed.endsWith('\\')) {
        prevIndent = indent;
      } else if (trimmed.startsWith('return') || trimmed.startsWith('raise') || trimmed.startsWith('break') || trimmed.startsWith('continue')) {
        prevIndent = indent;
      } else {
        prevIndent = indent;
      }
    }

    // 检查 import 顺序（标准库优先）
    const imports = [];
    for (const line of lines) {
      const match = line.match(/^(?:from\s+\S+\s+)?import\s+/);
      if (match) imports.push(line.trim());
    }
    if (imports.length > 3) {
      warnings.push(`${imports.length} 个 import 语句，建议分组排序（标准库/第三方/本地）`);
    }

    return { ok: errors.length === 0, errors, warnings };
  },

  // ===== Shell 验证 =====

  // 验证Shell脚本
  verifySh(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyShContent(content);
    } catch (e) {
      return { ok: false, errors: [e.message] };
    }
  },

  // 验证Shell内容（v2.0.20 安全审计修复：避免 bash 走 JS 验证器）
  verifyShContent(content) {
    const errors = [];
    const warnings = [];

    if (!content.includes('#!/bin/bash') && !content.includes('#!/bin/sh') && !content.includes('#!/usr/bin/env')) {
      warnings.push('缺少 shebang (#!/bin/bash 或 #!/bin/sh)');
    }

    // 简单检查未闭合引号
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) errors.push('单引号未闭合');
    if (doubleQuotes % 2 !== 0) errors.push('双引号未闭合');

    // 检查潜在危险的 shell 模式
    const dangerousPatterns = [
      { regex: /rm\s+-rf\s+(\/\s*|\$\{.*?\}|\$\(.*?\))/, msg: '危险: rm -rf 使用绝对路径或变量，可能导致数据丢失' },
      { regex: />\s*\/dev\/sda/, msg: '危险: 直接写入块设备' },
      { regex: /eval\s/, msg: '警告: 使用 eval 执行动态代码，可能有注入风险' },
      { regex: /curl\s+.*?\|\s*bash/, msg: '警告: 直接管道 curl 到 bash 执行，有安全风险' },
    ];
    for (const { regex, msg } of dangerousPatterns) {
      if (regex.test(content)) {
        warnings.push(msg);
      }
    }

    // 检查 set -e 设置
    if (!content.includes('set -e') && !content.includes('set -o errexit')) {
      warnings.push('建议添加 set -e 确保脚本在出错时立即退出');
    }

    return { ok: errors.length === 0, errors, warnings };
  },

  // ===== 安全漏洞扫描 =====

  /**
   * 安全漏洞扫描 — 跨语言安全模式检测
   * @param {string} content - 代码内容
   * @param {string} lang - 语言标识 (js/py/sh)
   * @returns {{ safe: boolean, findings: Array<{ type: string, severity: string, message: string, line?: number }> }}
   */
  scanSecurity(content, lang = 'js') {
    const findings = [];

    // 跨语言安全模式
    const crossLangPatterns = [
      // XSS 相关
      { regex: /innerHTML\s*=/, severity: 'high', msg: '直接设置 innerHTML 可能导致 XSS 攻击，建议使用 textContent 或 sanitize', lang: 'js' },
      { regex: /dangerouslySetInnerHTML/, severity: 'high', msg: 'React dangerouslySetInnerHTML 需确保 HTML 已消毒', lang: 'js' },
      { regex: /document\.write\s*\(/, severity: 'medium', msg: 'document.write 可能导致 XSS，建议使用 DOM API', lang: 'js' },
      { regex: /eval\s*\(/, severity: 'critical', msg: 'eval() 执行任意代码，存在严重安全风险', lang: 'js' },

      // 注入相关
      { regex: /exec\s*\(/, severity: 'high', msg: 'child_process.exec 可能导致命令注入，建议使用 execFile', lang: 'js' },
      { regex: /spawn\s*\(.*?\b(?:sh|bash|cmd)\b/, severity: 'medium', msg: 'spawn 中使用 shell 可能导致命令注入', lang: 'js' },

      // 路径遍历
      { regex: /readFileSync\s*\(\s*['"`]\//, severity: 'low', msg: '硬编码绝对路径可能在不同环境中不可用', lang: 'js' },
      { regex: /fs\.readFileSync\s*\(/, severity: 'info', msg: '检查文件读取路径是否经过验证，防止路径遍历', lang: 'js' },

      // 原型污染
      { regex: /Object\.assign\s*\([^,]+,\s*(?:req|body|query|params)/, severity: 'high', msg: '将用户输入直接 Object.assign 可能导致原型污染', lang: 'js' },
      { regex: /__proto__/, severity: 'critical', msg: '操作 __proto__ 可能导致原型污染攻击', lang: 'js' },

      // 不安全比较
      { regex: /==\s*['"](?:admin|root|true)['"]/, severity: 'medium', msg: '弱类型比较(==)可能导致认证绕过', lang: 'js' },

      // Python 安全模式
      { regex: /eval\s*\(/, severity: 'critical', msg: 'eval() 执行任意 Python 代码，存在严重安全风险', lang: 'py' },
      { regex: /exec\s*\(/, severity: 'critical', msg: 'exec() 执行任意 Python 代码，存在严重安全风险', lang: 'py' },
      { regex: /pickle\.loads?\s*\(/, severity: 'high', msg: '反序列化不可信数据可能导致远程代码执行', lang: 'py' },
      { regex: /os\.system\s*\(/, severity: 'high', msg: 'os.system 可能导致命令注入', lang: 'py' },
      { regex: /subprocess\.(?:call|Popen|run)\s*\(.*?shell\s*=\s*True/, severity: 'high', msg: 'shell=True 可能导致命令注入', lang: 'py' },
      { regex: /sqlite3|execute\s*\(.*?['\"].*?%/, severity: 'high', msg: 'SQL 字符串拼接可能导致 SQL 注入，建议使用参数化查询', lang: 'py' },

      // 不安全密码/密钥存储
      { regex: /password\s*=\s*['"][^'"]+['"]/, severity: 'medium', msg: '密码硬编码在代码中，建议使用环境变量', lang: '' },
      { regex: /secret\s*=\s*['"][^'"]+['"]/, severity: 'medium', msg: '密钥硬编码在代码中，建议使用环境变量', lang: '' },
      { regex: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, severity: 'medium', msg: 'API 密钥硬编码在代码中，建议使用环境变量', lang: '' },
    ];

    const lines = content.split('\n');
    for (const { regex, severity, msg, lang: patternLang } of crossLangPatterns) {
      if (patternLang && patternLang !== lang) continue;
      const match = content.match(regex);
      if (match) {
        // 找到匹配行号
        let lineNum = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(match[0].trim()) || lines[i].match(regex)) {
            lineNum = i + 1;
            break;
          }
        }
        findings.push({
          type: 'security',
          severity,
          message: msg,
          line: lineNum > 0 ? lineNum : undefined
        });
      }
    }

    return {
      safe: findings.filter(f => f.severity === 'critical' || f.severity === 'high').length === 0,
      findings
    };
  },

  // ===== 异步错误检测 =====

  /**
   * 检测异步代码中的常见错误
   * @param {string} content - JS/TS 代码内容
   * @returns {{ safe: boolean, issues: Array<{ type: string, message: string, line?: number }> }}
   */
  detectAsyncIssues(content) {
    const issues = [];
    const lines = content.split('\n');

    // 1. 检测 async 函数中未 await 的 Promise
    const asyncFuncLines = [];
    let inAsyncFunc = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('async ') || line.includes('async(') || line.match(/=>\s*\{/)) {
        if (line.includes('async')) {
          inAsyncFunc = true;
          asyncFuncLines.push(i + 1);
        }
      }
    }

    // 2. 检测 Promise 未被 await
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 检测 .then() 但没有 await 或 return
      if (line.includes('.then(') && !line.trim().startsWith('return ') && !line.trim().startsWith('await ')) {
        // 检查是否在 async 函数中
        issues.push({
          type: 'unhandled_promise',
          message: `第${i+1}行: Promise.then() 未在链中处理（未 return 或 await），可能导致未捕获错误`,
          line: i + 1
        });
      }

      // 检测 new Promise() 但没有被返回或等待
      if (line.includes('new Promise(') && !line.trim().startsWith('return ') && !line.trim().startsWith('await ')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('const ') && !trimmed.startsWith('let ') && !trimmed.startsWith('var ')) {
          issues.push({
            type: 'unhandled_promise',
            message: `第${i+1}行: 创建的 Promise 未赋值/返回/await，可能丢失`,
            line: i + 1
          });
        }
      }

      // 检测 async 回调没有 catch
      if (line.includes('async (') || line.includes('async(')) {
        if (line.includes('.catch(')) continue;
        // 检查后续行是否有 catch
        let hasCatch = false;
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          if (lines[j].includes('.catch(') || lines[j].includes('.then(')) {
            if (lines[j].includes('.catch(')) hasCatch = true;
            break;
          }
        }
        if (!hasCatch) {
          issues.push({
            type: 'missing_catch',
            message: `第${i+1}行附近: async 回调缺少 .catch() 错误处理`,
            line: i + 1
          });
        }
      }
    }

    // 3. 检测 .catch() 中空处理
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('.catch(') && (line.includes('() => {}') || line.includes('()=>{}') || line.includes('(e) => {}') || line.includes('(err) => {}'))) {
        issues.push({
          type: 'empty_catch',
          message: `第${i+1}行: 空的 catch 块会静默吞掉错误，建议至少记录日志`,
          line: i + 1
        });
      }
    }

    return {
      safe: issues.filter(i => i.type === 'unhandled_promise').length === 0,
      issues
    };
  },

  // ===== 复杂度分析 =====

  /**
   * 分析代码复杂度
   * @param {string} content - 代码内容
   * @returns {object} 复杂度指标
   */
  analyzeComplexity(content) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    const codeLines = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('#'));

    // 圈复杂度：if/else/for/while/case/&&/||/catch/ternary
    const cyclomaticFactors = [
      /\bif\s*\(/g, /\belse\s+if\b/g, /\bfor\s*\(/g, /\bwhile\s*\(/g,
      /\bcase\s+/g, /\bcatch\s*\(/g, /\?\s*[^:]+:/g,
      /\|\|/g, /&&/g
    ];
    let cyclomatic = 1; // 基础复杂度
    for (const pattern of cyclomaticFactors) {
      const matches = content.match(pattern);
      if (matches) cyclomatic += matches.length;
    }

    // 函数数量
    const functionDecls = (content.match(/(?:function\s+\w*|=>\s*\{|=>\s*[^(])/g) || []).length;
    const methodDecls = (content.match(/\w+\s*\([^)]*\)\s*\{/g) || []).length;

    // 嵌套深度估算（最大缩进）
    let maxIndent = 0;
    let currentIndent = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      const indent = line.length - trimmed.length;
      // 缩进减少时降低深度
      if (trimmed === '}' || trimmed === ']);' || trimmed === '});' || trimmed.startsWith('}') || trimmed.startsWith('])')) {
        currentIndent = Math.max(0, indent - 2);
      }
      const bracketOpen = (trimmed.match(/\{/g) || []).length;
      const bracketClose = (trimmed.match(/\}/g) || []).length;
      currentIndent += (bracketOpen - bracketClose) * 2;
      maxIndent = Math.max(maxIndent, currentIndent);
    }

    // 每行最大长度
    const lineLengths = lines.map(l => l.length);
    const maxLineLength = Math.max(...lineLengths);
    const longLines = lines.filter(l => l.length > 120).length;

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      nonEmptyLines: nonEmptyLines.length,
      blankLines: lines.length - nonEmptyLines.length,
      commentLines: lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('#')).length,
      cyclomaticComplexity: cyclomatic,
      functionCount: functionDecls + methodDecls,
      maxNestingDepth: Math.ceil(maxIndent / 2),
      maxLineLength,
      longLinesCount: longLines,
      complexityLevel: cyclomatic <= 10 ? 'low' : (cyclomatic <= 20 ? 'moderate' : (cyclomatic <= 40 ? 'high' : 'very_high')),
      lineLengthLevel: longLines > 10 ? 'warning' : (maxLineLength > 150 ? 'warning' : 'ok')
    };
  },

  // ===== 导入解析验证 =====

  /**
   * 验证导入路径是否存在
   * @param {string} content - 代码内容
   * @param {string} baseDir - 基准目录（用于解析相对路径）
   * @returns {{ allResolved: boolean, issues: Array<{ importPath: string, resolved: boolean, message: string }> }}
   */
  verifyImports(content, baseDir = process.cwd()) {
    const issues = [];

    // 匹配 require 和 import 语句
    const requirePattern = /require\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
    const importPattern = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

    const allPatterns = [...content.matchAll(requirePattern), ...content.matchAll(importPattern)];

    for (const match of allPatterns) {
      const importPath = match[1];
      // 尝试解析相对路径
      const resolvedPath = path.resolve(baseDir, importPath);

      // 尝试多种扩展名
      const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.json', '.mjs', '.cjs'];
      let resolved = false;
      for (const ext of extensions) {
        const testPath = ext ? resolvedPath + ext : resolvedPath;
        if (fs.existsSync(testPath)) {
          // 检查是否是目录（需要 index.js）
          if (fs.statSync(testPath).isDirectory()) {
            for (const indexExt of ['/index.js', '/index.ts', '/index.json']) {
              if (fs.existsSync(testPath + indexExt)) {
                resolved = true;
                break;
              }
            }
            if (resolved) break;
          } else {
            resolved = true;
            break;
          }
        }
        // 检查目录名（去掉扩展名部分）
        if (!ext) {
          const dirPath = resolvedPath;
          if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            for (const indexExt of ['/index.js', '/index.ts', '/index.json', '/index.mjs', '/index.cjs']) {
              if (fs.existsSync(dirPath + indexExt)) {
                resolved = true;
                break;
              }
            }
            if (resolved) break;
          }
        }
      }

      issues.push({
        importPath,
        resolved,
        message: resolved
          ? `导入 "${importPath}" 已解析`
          : `导入 "${importPath}" 未找到（在 ${resolvedPath} 及其扩展名中搜索）`
      });
    }

    return {
      allResolved: issues.every(i => i.resolved),
      issues
    };
  },

  // ===== 综合质量评分 =====

  /**
   * 综合代码质量评分 (0-100)
   * @param {string} content - 代码内容
   * @param {string} lang - 语言标识 (js/ts/py/sh)
   * @returns {{ score: number, dimensions: object, level: string }}
   */
  qualityScore(content, lang = 'js') {
    const complexity = this.analyzeComplexity(content);
    const asyncIssues = (lang === 'js' || lang === 'ts') ? this.detectAsyncIssues(content) : { safe: true, issues: [] };
    const security = this.scanSecurity(content, lang);

    // 各维度评分 (0-100)
    const dimensions = {};

    // 1. 语法健康度 (30%)
    dimensions.syntax = 100;
    const bracketOpen = (content.match(/\{/g) || []).length;
    const bracketClose = (content.match(/\}/g) || []).length;
    if (bracketOpen !== bracketClose) dimensions.syntax -= 30;
    const parenOpen = (content.match(/\(/g) || []).length;
    const parenClose = (content.match(/\)/g) || []).length;
    if (parenOpen !== parenClose) dimensions.syntax -= 30;
    dimensions.syntax = Math.max(0, dimensions.syntax);

    // 2. 安全评分 (25%)
    dimensions.security = 100;
    for (const f of security.findings) {
      if (f.severity === 'critical') dimensions.security -= 40;
      else if (f.severity === 'high') dimensions.security -= 20;
      else if (f.severity === 'medium') dimensions.security -= 10;
    }
    dimensions.security = Math.max(0, dimensions.security);

    // 3. 复杂度评分 (20%)
    dimensions.complexity = 100;
    if (complexity.cyclomaticComplexity > 10) dimensions.complexity -= Math.min(50, (complexity.cyclomaticComplexity - 10) * 3);
    if (complexity.maxNestingDepth > 5) dimensions.complexity -= Math.min(30, (complexity.maxNestingDepth - 5) * 6);
    dimensions.complexity = Math.max(0, dimensions.complexity);

    // 4. 异步健康度 (15%)
    dimensions.async = 100;
    for (const issue of asyncIssues.issues) {
      if (issue.type === 'unhandled_promise') dimensions.async -= 25;
      else if (issue.type === 'empty_catch') dimensions.async -= 15;
      else if (issue.type === 'missing_catch') dimensions.async -= 10;
    }
    dimensions.async = Math.max(0, dimensions.async);

    // 5. 代码规范 (10%)
    dimensions.style = 100;
    if (complexity.longLinesCount > 5) dimensions.style -= Math.min(30, complexity.longLinesCount * 3);
    if (complexity.commentLines < 5 && complexity.codeLines > 50) dimensions.style -= 15;
    dimensions.style = Math.max(0, dimensions.style);

    // 加权总分
    const weights = { syntax: 0.30, security: 0.25, complexity: 0.20, async: 0.15, style: 0.10 };
    let totalScore = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      totalScore += dimensions[dim] * weight;
    }

    const score = Math.round(totalScore);
    return {
      score,
      dimensions,
      level: score >= 90 ? 'excellent' : (score >= 75 ? 'good' : (score >= 55 ? 'fair' : 'poor')),
      securityFindings: security.findings.length,
      asyncIssuesCount: asyncIssues.issues.length,
      weights
    };
  },

  // ===== 自动验证（根据扩展名） =====

  autoVerify(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return this.verifyJS(filePath);
    if (ext === '.ts' || ext === '.tsx') return this.verifyTS(filePath);
    if (ext === '.py') return this.verifyPy(filePath);
    if (ext === '.sh') return this.verifySh(filePath);
    if (ext === '.json') return this.verifyJSON(filePath);
    return { ok: true, errors: [] };
  },

  // ===== 验证代码块（嵌入在 Markdown 中） =====

  verifyCodeBlocks(markdown) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const lang = (match[1] || 'text').toLowerCase();
      const code = match[2];
      // ⚠️ 安全审计修复（v2.0.20）：按语言分派到对应验证器
      let result;
      if (lang === 'js' || lang === 'javascript' || lang === 'mjs') {
        result = this.verifyJSContent(code);
      } else if (lang === 'ts' || lang === 'typescript' || lang === 'tsx') {
        result = this.verifyTSContent(code);
      } else if (lang === 'py' || lang === 'python') {
        result = this.verifyPyContent(code);
      } else if (lang === 'sh' || lang === 'bash' || lang === 'shell' || lang === 'zsh') {
        result = this.verifyShContent(code);
      } else if (lang === 'json') {
        result = this.verifyJSONContent(code);
      } else {
        // 未知语言：不做验证（避免误判）
        result = { ok: true, errors: [], warnings: [], skipped: true, reason: 'unsupported language' };
      }
      blocks.push({ lang, code, result });
    }
    return blocks;
  }
};

module.exports = { codeVerifier };
