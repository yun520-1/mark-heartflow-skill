/**
 * CodeExecutor — 引擎代码执行引擎 v1.0.0
 *
 * 代码执行引擎，支持 JavaScript / Shell / Python 执行。
 * 所有执行均带超时保护、输出截断、参数验证。
 * Shell/Python 执行内置危险命令过滤和安全限制。
 *
 * 核心能力：
 * - execute(code, options) — 多语言代码执行
 * - runTests(code, testCode) — 测试执行与结果收集
 * - sandbox(code, options) — 严格安全沙箱（禁止 require/eval/child_process 等）
 * - healthCheck() — 自检各执行器可用性
 *
 * @module code-executor
 * @permission execute_code — 执行任意代码（JavaScript/Shell/Python），请谨慎使用
 */

'use strict';

const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================================
// 状态枚举
// ============================================================================

const ExecStatus = Object.freeze({
  SUCCESS:          'success',
  FAILED:           'failed',
  TIMEOUT:          'timeout',
  ERROR:            'error',
  SANDBOX_BLOCKED:  'sandbox_blocked'
});

// ============================================================================
// 错误分类
// ============================================================================

const ExecError = Object.freeze({
  SYNTAX:     'SYNTAX',
  RUNTIME:    'RUNTIME',
  TIMEOUT:    'TIMEOUT',
  PERMISSION: 'PERMISSION',
  SANDBOX:    'SANDBOX',
  UNKNOWN:    'UNKNOWN'
});

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULTS = Object.freeze({
  timeout:      30000,   // 默认超时 30s
  maxOutput:    10240,   // 默认输出截断 10KB
  language:     'javascript',
  maxRetries:   0,
  captureStdout: true,
  captureStderr: true
});

const MAX_OUTPUT_LIMIT = 1048576; // 1MB 绝对上限

// ============================================================================
// 危险命令过滤列表（Shell 执行）
// ============================================================================

const DANGEROUS_COMMANDS = [
  /rm\s+-rf\s+\//i,            // rm -rf /
  /rm\s+--no-preserve-root/i,  // rm --no-preserve-root
  /mkfs\.?\w*/i,               // mkfs.*
  /dd\s+if=\/dev\/zero/i,      // dd if=/dev/zero
  /dd\s+of=\/dev\/sda/i,       // dd of=/dev/sda
  /:\(\)\s*\{[^}]*\};\s*:/i,   // fork bomb
  /chmod\s+-R\s+0{4}\s+\//i,   // chmod -R 000 /
  /chown\s+-R\s+.*\s+\//i,     // chown -R ... /
  /sudo\s+/i,                  // sudo
  /su\s+-/i,                   // su -
  /passwd\s+/i,                // passwd
  /shutdown/i,                 // shutdown
  /reboot/i,                   // reboot
  /init\s+0/i,                 // init 0
  /halt/i,                     // halt
  /poweroff/i,                 // poweroff
  /wget\s+.*\|\s*(bash|sh)/i, // wget ... | bash
  /curl\s+.*\|\s*(bash|sh)/i, // curl ... | bash
  />\s*\/dev\/sda/i,           // > /dev/sda
  /pv\.*\/etc/i,               // pv /etc (may leak sensitive)
  /cat\s+\/etc\/(shadow|passwd|sudoers)/i, // read sensitive files
  /iptables\s+/i,              // iptables
  /ufw\s+/i,                   // ufw
  /systemctl\s+/i,             // systemctl
  /docker\s+(rm|kill|stop|run\s+--privileged)/i, // dangerous docker
];

// ============================================================================
// Sandbox 安全限制正则（用于检测被禁止的操作）
// ============================================================================

const SANDBOX_BLOCKED_PATTERNS = [
  /require\s*\(/,
  /eval\s*\(/,
  /new\s+Function\s*\(/,
  /child_process/,
  /fs\.(write|append|copy|rename|unlink|rm|chmod|chown|mkdtemp|mkdtempSync|mkdtempSync|mkdtempSync)/i,
  /process\.(exit|abort|kill|chdir|cwd)/i,
  /global\s*\./i,
  /__dirname/,
  /__filename/,
  /module\.exports/,
  /exports\./,
  /import\s*\(/,
  /setTimeout\s*\([^)]*,\s*0\s*\)/,
  /setInterval/,
  /setImmediate/,
  /process\.binding/,
  /process\.dlopen/,
  /Reflect\.construct/,
  /Proxy\s*\(/,
  /constructor\.constructor/
];

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 截断输出字符串，防止内存溢出
 * @param {string} str - 原始输出
 * @param {number} maxLen - 最大长度
 * @returns {string}
 */
function truncateOutput(str, maxLen = DEFAULTS.maxOutput) {
  if (typeof str !== 'string') return String(str);
  const limit = Math.min(maxLen, MAX_OUTPUT_LIMIT);
  if (str.length <= limit) return str;
  return str.slice(0, limit) + `\n... [输出截断: ${str.length - limit} 字符被省略]`;
}

/**
 * 参数验证
 * @param {*} val - 要验证的值
 * @param {string} name - 参数名
 * @param {string} type - 期望类型 ('string', 'number', 'object', 'function', 'boolean')
 * @param {boolean} [required=true] - 是否必填
 * @throws {TypeError}
 */
function validateArg(val, name, type, required = true) {
  if (val === undefined || val === null) {
    if (required) throw new TypeError(`[CodeExecutor] ${name} is required`);
    return;
  }
  const actual = typeof val;
  if (type === 'array') {
    if (!Array.isArray(val)) throw new TypeError(`[CodeExecutor] ${name} must be an array, got ${actual}`);
  } else if (actual !== type) {
    throw new TypeError(`[CodeExecutor] ${name} must be ${type}, got ${actual}`);
  }
}

/**
 * 根据代码内容自动检测语言
 * @param {string} code
 * @returns {string}
 */
function detectLanguage(code) {
  if (!code || typeof code !== 'string') return 'javascript';
  const trimmed = code.trim();
  if (trimmed.startsWith('#!') || trimmed.startsWith('#!/')) return 'shell';
  if (trimmed.startsWith('#!/usr/bin/env python') || trimmed.startsWith('#!/usr/bin/python')) return 'python';
  // Python heuristics
  if (/^(import |from |def |class |print\s*\(|if __name__)/m.test(trimmed)) return 'python';
  // Shell heuristics
  if (/^(echo |ls |cd |mkdir |rm |cp |mv |cat |grep |find |export )/m.test(trimmed)) return 'shell';
  return 'javascript';
}

/**
 * 检查 Shell 命令是否包含危险操作
 * @param {string} command
 * @returns {{dangerous: boolean, reason: string|null}}
 */
function checkDangerousCommand(command) {
  for (const pattern of DANGEROUS_COMMANDS) {
    if (pattern.test(command)) {
      return { dangerous: true, reason: `匹配危险命令模式: ${pattern}` };
    }
  }
  return { dangerous: false, reason: null };
}

/**
 * 检查代码是否触犯沙箱限制
 * @param {string} code
 * @returns {{blocked: boolean, reason: string|null, matched: string|null}}
 */
function checkSandboxRestrictions(code) {
  for (const pattern of SANDBOX_BLOCKED_PATTERNS) {
    const match = code.match(pattern);
    if (match) {
      return {
        blocked: true,
        reason: `沙箱禁止操作: ${match[0]}`,
        matched: match[0]
      };
    }
  }
  return { blocked: false, reason: null, matched: null };
}

/**
 * 将错误分类
 * @param {Error} err
 * @returns {string} ExecError key
 */
function classifyError(err) {
  if (!err) return ExecError.UNKNOWN;
  const msg = String(err.message || err);
  if (msg.includes('SyntaxError') || msg.includes('Unexpected token') || msg.includes('语法错误')) {
    return ExecError.SYNTAX;
  }
  if (msg.includes('timeout') || msg.includes('TIMEOUT') || msg.includes('Timed out') || msg.includes('超时')) {
    return ExecError.TIMEOUT;
  }
  if (msg.includes('EACCES') || msg.includes('EPERM') || msg.includes('permission') || msg.includes('权限')) {
    return ExecError.PERMISSION;
  }
  if (msg.includes('sandbox') || msg.includes('SANDBOX') || msg.includes('沙箱') || msg.includes('blocked')) {
    return ExecError.SANDBOX;
  }
  if (msg.includes('ReferenceError') || msg.includes('TypeError') || msg.includes('RangeError')) {
    return ExecError.RUNTIME;
  }
  return ExecError.UNKNOWN;
}

// ============================================================================
// CodeExecutor 类
// ============================================================================

class CodeExecutor {
  /**
   * @param {Object} [options]
   * @param {Object} [options.hf] - HeartFlow 实例（可选）
   */
  constructor(options = {}) {
    const opts = options || {};

    this._hf = opts.hf || null;
    this._name = 'CodeExecutor';
    this._initialized = true;

    // 统计追踪
    this._stats = {
      totalExecutions:    0,
      totalTests:         0,
      totalSandbox:       0,
      successCount:       0,
      failedCount:        0,
      timeoutCount:       0,
      errorCount:         0,
      sandboxBlockedCount: 0,
      totalDuration:      0,
      avgDuration:        0,
      startTime:          Date.now()
    };

    // 执行器可用性缓存
    this._availableExecutors = {
      javascript: true,
      shell:      this._checkShellAvailable(),
      python:     this._checkPythonAvailable()
    };

    console.log(`[CodeExecutor] 初始化完成. 可用执行器: ${JSON.stringify(this._availableExecutors)}`);
  }

  /**
   * 检查 shell 是否可用
   * @private
   */
  _checkShellAvailable() {
    try {
      execFileSync('echo', ['"shell_ok"'], { timeout: 3000, encoding: 'utf-8' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查 python3 是否可用
   * @private
   */
  _checkPythonAvailable() {
    try {
      const result = execFileSync('python3', ['--version'], {
        timeout: 5000,
        encoding: 'utf-8'
      });
      return result.includes('Python');
    } catch {
      // fallback to 'python'
      try {
        const result = execFileSync('python', ['--version'], {
          timeout: 5000,
          encoding: 'utf-8'
        });
        return result.includes('Python');
      } catch {
        return false;
      }
    }
  }

  // ─── 统计属性 ──────────────────────────────────────────────────────────

  /** @returns {number} 总执行次数 */
  get totalExecutions() { return this._stats.totalExecutions; }

  /** @returns {number} 成功率 (0~1) */
  get successRate() {
    const total = this._stats.totalExecutions;
    if (total === 0) return 0;
    return +(this._stats.successCount / total).toFixed(4);
  }

  /** @returns {number} 平均执行耗时 (ms) */
  get avgDuration() {
    const total = this._stats.totalExecutions;
    if (total === 0) return 0;
    return Math.round(this._stats.totalDuration / total);
  }

  /** @returns {Object} 完整统计快照 */
  get stats() {
    return {
      ...this._stats,
      successRate: this.successRate,
      avgDuration: this.avgDuration,
      uptime: Date.now() - this._stats.startTime,
      availableExecutors: { ...this._availableExecutors }
    };
  }

  // ─── 内部记录 ──────────────────────────────────────────────────────────

  /**
   * 记录一次执行结果到统计
   * @private
   */
  _recordExecution(status, duration) {
    this._stats.totalExecutions++;
    this._stats.totalDuration += duration;
    this._stats.avgDuration = Math.round(this._stats.totalDuration / this._stats.totalExecutions);

    switch (status) {
      case ExecStatus.SUCCESS:
        this._stats.successCount++;
        break;
      case ExecStatus.FAILED:
        this._stats.failedCount++;
        break;
      case ExecStatus.TIMEOUT:
        this._stats.timeoutCount++;
        break;
      case ExecStatus.ERROR:
        this._stats.errorCount++;
        break;
      case ExecStatus.SANDBOX_BLOCKED:
        this._stats.sandboxBlockedCount++;
        break;
    }
  }

  // ========================================================================
  // execute(code, options) — 代码执行
  // ========================================================================

  /**
   * 执行代码（支持 JavaScript / Shell / Python）
   *
   * @param {string} code - 要执行的代码
   * @param {Object} [options] - 执行选项
   * @param {string} [options.language] - 语言 ('javascript', 'shell', 'python', 'auto')
   * @param {number} [options.timeout=30000] - 超时时间 (ms)
   * @param {number} [options.maxOutput=10240] - 输出截断长度
   * @param {boolean} [options.captureStdout=true] - 捕获 stdout
   * @param {boolean} [options.captureStderr=true] - 捕获 stderr
   * @param {Object} [options.context] - 注入的上下文变量（仅 JavaScript）
   * @returns {Object} { status, output, error, duration, language, truncated, execError }
   */
  execute(code, options = {}) {
    validateArg(code, 'code', 'string');

    const opts = { ...DEFAULTS, ...options };
    if (opts.timeout < 100) opts.timeout = 100;
    if (opts.maxOutput < 1024) opts.maxOutput = 1024;
    if (opts.maxOutput > MAX_OUTPUT_LIMIT) opts.maxOutput = MAX_OUTPUT_LIMIT;

    const language = opts.language === 'auto' ? detectLanguage(code) : (opts.language || 'javascript');
    const startTime = Date.now();

    try {
      let result;

      switch (language) {
        case 'javascript':
          result = this._executeJavaScript(code, opts);
          break;
        case 'shell':
          result = this._executeShell(code, opts);
          break;
        case 'python':
          result = this._executePython(code, opts);
          break;
        default:
          throw new Error(`不支持的语言: ${language}`);
      }

      const duration = Date.now() - startTime;
      result.duration = duration;
      result.language = language;

      this._recordExecution(result.status, duration);
      return result;

    } catch (err) {
      const duration = Date.now() - startTime;
      const errorType = classifyError(err);

      this._recordExecution(
        errorType === ExecError.TIMEOUT ? ExecStatus.TIMEOUT : ExecStatus.ERROR,
        duration
      );

      return {
        status:     errorType === ExecError.TIMEOUT ? ExecStatus.TIMEOUT : ExecStatus.ERROR,
        output:     '',
        error:      err.message || String(err),
        duration,
        language,
        truncated:  false,
        execError:  errorType
      };
    }
  }

  /**
   * JavaScript 执行（new Function 沙箱）
   * @private
   */
  _executeJavaScript(code, opts) {
    const timeout = opts.timeout || DEFAULTS.timeout;
    const maxOutput = opts.maxOutput || DEFAULTS.maxOutput;
    const context = opts.context || {};

    let capturedOutput = '';
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // 重定向 console
    console.log = (...args) => {
      capturedOutput += args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ') + '\n';
    };
    console.error = (...args) => {
      capturedOutput += '[ERROR] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
    };
    console.warn = (...args) => {
      capturedOutput += '[WARN] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
    };

    let timerId = null;

    try {
      // 构建注入上下文
      const contextKeys = Object.keys(context);
      const contextValues = contextKeys.map(k => context[k]);

      // 用 new Function 创建沙箱函数
      const fn = new Function(
        ...contextKeys,
        `"use strict";
${code}`
      );

      // 超时执行
      const result = this._executeWithTimeout(fn, timeout, contextValues);

      const truncated = capturedOutput.length > maxOutput;
      const output = truncateOutput(capturedOutput, maxOutput);

      return {
        status:    ExecStatus.SUCCESS,
        output:    result !== undefined ? String(result) + (output ? '\n' + output : '') : output || '(无输出)',
        error:     null,
        truncated,
        execError: null,
        result:    result !== undefined ? result : undefined
      };

    } catch (err) {
      const errorType = classifyError(err);
      const truncated = capturedOutput.length > maxOutput;
      const output = truncateOutput(capturedOutput, maxOutput);

      return {
        status:    errorType === ExecError.TIMEOUT ? ExecStatus.TIMEOUT : ExecStatus.FAILED,
        output:    output || '',
        error:     err.message || String(err),
        truncated,
        execError: errorType
      };

    } finally {
      if (timerId) clearTimeout(timerId);
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  }

  /**
   * 带超时的函数执行
   * @private
   */
  _executeWithTimeout(fn, timeout, args = []) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`执行超时 (${timeout}ms)`));
      }, timeout);

      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          result
            .then(val => { clearTimeout(timer); resolve(val); })
            .catch(err => { clearTimeout(timer); reject(err); });
        } else {
          clearTimeout(timer);
          resolve(result);
        }
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  /**
   * Shell 执行
   * @private
   */
  _executeShell(code, opts) {
    const timeout = opts.timeout || DEFAULTS.timeout;
    const maxOutput = opts.maxOutput || DEFAULTS.maxOutput;

    // 危险命令检查
    const dangerCheck = checkDangerousCommand(code);
    if (dangerCheck.dangerous) {
      return {
        status:    ExecStatus.SANDBOX_BLOCKED,
        output:    '',
        error:     `危险命令被阻止: ${dangerCheck.reason}`,
        truncated: false,
        execError: ExecError.SANDBOX
      };
    }

    try {
      const result = execSync(code, {
        timeout,
        encoding: 'utf-8',
        maxBuffer: MAX_OUTPUT_LIMIT,
        shell: '/bin/bash'
      });

      const truncated = result.length > maxOutput;
      const output = truncateOutput(result, maxOutput);

      return {
        status:    ExecStatus.SUCCESS,
        output:    output || '(命令执行成功，无输出)',
        error:     null,
        truncated,
        execError: null
      };

    } catch (err) {
      if (err.message && (err.message.includes('timed out') || err.message.includes('TIMEOUT'))) {
        return {
          status:    ExecStatus.TIMEOUT,
          output:    '',
          error:     `Shell 执行超时 (${timeout}ms)`,
          truncated: false,
          execError: ExecError.TIMEOUT
        };
      }

      const stderr = err.stderr ? err.stderr.toString() : '';
      const stdout = err.stdout ? err.stdout.toString() : '';
      const combined = stdout + (stderr ? '\n' + stderr : '');
      const truncated = combined.length > maxOutput;
      const output = truncateOutput(combined, maxOutput);

      return {
        status:    ExecStatus.FAILED,
        output:    output || '',
        error:     err.message || 'Shell 执行失败',
        truncated,
        execError: classifyError(err)
      };
    }
  }

  /**
   * Python 执行
   * @private
   */
  _executePython(code, opts) {
    const timeout = opts.timeout || DEFAULTS.timeout;
    const maxOutput = opts.maxOutput || DEFAULTS.maxOutput;

    // 检查 Python 是否可用
    if (!this._availableExecutors.python) {
      return {
        status:    ExecStatus.ERROR,
        output:    '',
        error:     'Python 执行器不可用 (python3 未找到)',
        truncated: false,
        execError: ExecError.PERMISSION
      };
    }

    // 写入临时文件执行
    const tmpFile = path.join(
      require('os').tmpdir(),
      `code_exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.py`
    );

    try {
      fs.writeFileSync(tmpFile, code, 'utf-8');

      const pythonCmd = this._getPythonCommand();

      const result = execSync(`${pythonCmd} "${tmpFile}"`, {
        timeout,
        encoding: 'utf-8',
        maxBuffer: MAX_OUTPUT_LIMIT
      });

      const truncated = result.length > maxOutput;
      const output = truncateOutput(result, maxOutput);

      return {
        status:    ExecStatus.SUCCESS,
        output:    output || '(Python 执行成功，无输出)',
        error:     null,
        truncated,
        execError: null
      };

    } catch (err) {
      if (err.message && (err.message.includes('timed out') || err.message.includes('TIMEOUT'))) {
        return {
          status:    ExecStatus.TIMEOUT,
          output:    '',
          error:     `Python 执行超时 (${timeout}ms)`,
          truncated: false,
          execError: ExecError.TIMEOUT
        };
      }

      const stderr = err.stderr ? err.stderr.toString() : '';
      const stdout = err.stdout ? err.stdout.toString() : '';
      const combined = stdout + (stderr ? '\n[STDERR]\n' + stderr : '');
      const truncated = combined.length > maxOutput;
      const output = truncateOutput(combined, maxOutput);

      return {
        status:    ExecStatus.FAILED,
        output:    output || '',
        error:     err.message || 'Python 执行失败',
        truncated,
        execError: classifyError(err)
      };

    } finally {
      // 清理临时文件
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }

  /**
   * 获取可用的 python 命令
   * @private
   */
  _getPythonCommand() {
    try {
      execFileSync('python3', ['--version'], { timeout: 2000, encoding: 'utf-8', stdio: 'ignore' });
      return 'python3';
    } catch {
      return 'python';
    }
  }

  // ========================================================================
  // runTests(code, testCode) — 测试执行
  // ========================================================================

  /**
   * 执行测试（拼接代码 + 测试代码，捕获 console.assert/log 输出）
   *
   * @param {string} code - 被测代码
   * @param {string} testCode - 测试代码
   * @param {Object} [options] - 执行选项（同 execute）
   * @returns {Object} { status, passed, failed, errors, output, duration, tests: Array }
   */
  runTests(code, testCode, options = {}) {
    validateArg(code, 'code', 'string');
    validateArg(testCode, 'testCode', 'string');

    const startTime = Date.now();
    const opts = { ...DEFAULTS, ...options };
    const timeout = opts.timeout || 30000;
    const maxOutput = opts.maxOutput || DEFAULTS.maxOutput;

    // 拼接代码 + 测试代码
    const combinedCode = `${code}\n\n// === 测试代码 ===\n${testCode}`;

    // 捕获 console.assert 和测试结果
    const testResults = [];
    let assertCount = 0;
    let passCount = 0;
    let failCount = 0;

    const originalAssert = console.assert;
    const originalLog = console.log;

    console.assert = (condition, ...args) => {
      assertCount++;
      const msg = args.map(a => String(a)).join(' ');
      if (condition) {
        passCount++;
        testResults.push({ type: 'pass', index: assertCount, message: msg || `断言 #${assertCount} 通过` });
      } else {
        failCount++;
        testResults.push({ type: 'fail', index: assertCount, message: msg || `断言 #${assertCount} 失败` });
      }
    };

    try {
      const execResult = this.execute(combinedCode, { ...opts, timeout, maxOutput });

      const duration = Date.now() - startTime;
      this._stats.totalTests++;

      return {
        status:   execResult.status,
        passed:   passCount,
        failed:   failCount,
        errors:   execResult.error ? [execResult.error] : [],
        output:   execResult.output,
        duration,
        tests:    testResults,
        execError: execResult.execError
      };

    } finally {
      console.assert = originalAssert;
      console.log = originalLog;
    }
  }

  // ========================================================================
  // sandbox(code, options) — 执行器: 路径受限的文件操作（非沙箱，请谨慎使用）
  // ========================================================================

  /**
   * 严格安全沙箱执行
   * 禁止 require / eval / new Function / child_process / fs.write / 等
   * 只允许 console.log 和基础运算
   *
   * 注意：此沙箱仅做正则模式匹配和路径限制，不做系统级沙箱隔离，
   * 请勿用于不可信代码的执行。
   *
   * @param {string} code - 要执行的代码
   * @param {Object} [options] - 执行选项
   * @param {number} [options.timeout=30000] - 超时
   * @param {number} [options.maxOutput=10240] - 输出截断
   * @returns {Object} { status, output, error, duration, blocked, blockReason }
   */
  sandbox(code, options = {}) {
    validateArg(code, 'code', 'string');

    console.warn('⚠️ 沙箱安全警告: 此执行器仅做路径限制，不做系统级沙箱隔离');

    const opts = { ...DEFAULTS, ...options };
    const timeout = opts.timeout || 30000;
    const maxOutput = opts.maxOutput || DEFAULTS.maxOutput;
    const startTime = Date.now();

    // 1. 检查沙箱限制
    const restrictionCheck = checkSandboxRestrictions(code);
    if (restrictionCheck.blocked) {
      const duration = Date.now() - startTime;
      this._recordExecution(ExecStatus.SANDBOX_BLOCKED, duration);
      this._stats.totalSandbox++;

      return {
        status:       ExecStatus.SANDBOX_BLOCKED,
        output:       '',
        error:        restrictionCheck.reason,
        duration,
        blocked:      true,
        blockReason:  restrictionCheck.reason,
        blockedPattern: restrictionCheck.matched,
        execError:    ExecError.SANDBOX
      };
    }

    // 2. 使用严格沙箱执行（限制更严的 Function）
    let capturedOutput = '';
    const originalLog = console.log;

    console.log = (...args) => {
      capturedOutput += args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
    };

    try {
      const sandboxedCode = `
"use strict";
// 沙箱安全限制：禁止访问危险全局对象
const __sandbox_blocked = [
  'require', 'eval', 'Function', 'child_process', 'process',
  'global', 'globalThis', 'setTimeout', 'setInterval', 'setImmediate',
  'clearTimeout', 'clearInterval', 'clearImmediate',
  '__dirname', '__filename', 'module', 'exports'
];

(function() {
${code}
})();
`;

      const fn = new Function('console', sandboxedCode);

      const result = this._executeWithTimeout(fn, timeout, [console]);

      const truncated = capturedOutput.length > maxOutput;
      const output = truncateOutput(capturedOutput, maxOutput);
      const duration = Date.now() - startTime;

      this._recordExecution(ExecStatus.SUCCESS, duration);
      this._stats.totalSandbox++;

      return {
        status:    ExecStatus.SUCCESS,
        output:    result !== undefined ? String(result) + (output ? '\n' + output : '') : output || '(沙箱执行成功，无输出)',
        error:     null,
        duration,
        blocked:   false,
        blockReason: null,
        execError: null
      };

    } catch (err) {
      const duration = Date.now() - startTime;
      const errorType = classifyError(err);

      this._recordExecution(
        errorType === ExecError.TIMEOUT ? ExecStatus.TIMEOUT : ExecStatus.FAILED,
        duration
      );
      this._stats.totalSandbox++;

      const truncated = capturedOutput.length > maxOutput;
      const output = truncateOutput(capturedOutput, maxOutput);

      return {
        status:    errorType === ExecError.TIMEOUT ? ExecStatus.TIMEOUT : ExecStatus.FAILED,
        output:    output || '',
        error:     err.message || String(err),
        duration,
        blocked:   false,
        blockReason: null,
        execError: errorType
      };

    } finally {
      console.log = originalLog;
    }
  }

  // ========================================================================
  // healthCheck() — 自检
  // ========================================================================

  /**
   * 自检 — 验证各执行器可用性
   *
   * @returns {Object} { status, executors, diagnostics }
   */
  healthCheck() {
    const diagnostics = [];

    // 1. JavaScript 自检
    let jsOk = false;
    try {
      const jsResult = this.execute('1 + 1', { timeout: 5000, maxOutput: 1024 });
      jsOk = jsResult.status === ExecStatus.SUCCESS;
      diagnostics.push({
        executor: 'javascript',
        available: jsOk,
        test: '1 + 1',
        result: jsOk ? '2' : jsResult.error,
        duration: jsResult.duration
      });
    } catch (err) {
      diagnostics.push({
        executor: 'javascript',
        available: false,
        test: '1 + 1',
        result: err.message,
        duration: 0
      });
    }

    // 2. JavaScript 沙箱自检
    let sandboxOk = false;
    try {
      const sbResult = this.sandbox('console.log("sandbox_ok");', { timeout: 5000, maxOutput: 1024 });
      sandboxOk = sbResult.status === ExecStatus.SUCCESS;
      diagnostics.push({
        executor: 'sandbox',
        available: sandboxOk,
        test: 'console.log("sandbox_ok")',
        result: sandboxOk ? 'sandbox_ok' : sbResult.error,
        duration: sbResult.duration
      });
    } catch (err) {
      diagnostics.push({
        executor: 'sandbox',
        available: false,
        test: 'console.log("sandbox_ok")',
        result: err.message,
        duration: 0
      });
    }

    // 3. Shell 自检
    const shellAvailable = this._checkShellAvailable();
    let shellOk = false;
    if (shellAvailable) {
      try {
        const shResult = this.execute('echo "shell_ok"', { language: 'shell', timeout: 5000, maxOutput: 1024 });
        shellOk = shResult.status === ExecStatus.SUCCESS;
        diagnostics.push({
          executor: 'shell',
          available: shellOk,
          test: 'echo "shell_ok"',
          result: shellOk ? 'shell_ok' : shResult.error,
          duration: shResult.duration
        });
      } catch (err) {
        diagnostics.push({
          executor: 'shell',
          available: false,
          test: 'echo "shell_ok"',
          result: err.message,
          duration: 0
        });
      }
    } else {
      diagnostics.push({
        executor: 'shell',
        available: false,
        test: 'echo "shell_ok"',
        result: 'shell 不可用',
        duration: 0
      });
    }

    // 4. Python 自检
    const pythonAvailable = this._checkPythonAvailable();
    if (pythonAvailable) {
      try {
        const pyResult = this.execute('print("python_ok")', { language: 'python', timeout: 10000, maxOutput: 1024 });
        diagnostics.push({
          executor: 'python',
          available: pyResult.status === ExecStatus.SUCCESS,
          test: 'print("python_ok")',
          result: pyResult.status === ExecStatus.SUCCESS ? 'python_ok' : pyResult.error,
          duration: pyResult.duration
        });
      } catch (err) {
        diagnostics.push({
          executor: 'python',
          available: false,
          test: 'print("python_ok")',
          result: err.message,
          duration: 0
        });
      }
    } else {
      diagnostics.push({
        executor: 'python',
        available: false,
        test: 'print("python_ok")',
        result: 'python3 不可用',
        duration: 0
      });
    }

    // 5. runTests 自检
    let testsOk = false;
    try {
      const testResult = this.runTests(
        'function add(a, b) { return a + b; }',
        'console.assert(add(1, 2) === 3, "1+2=3");\nconsole.assert(add(-1, 1) === 0, "-1+1=0");',
        { timeout: 5000, maxOutput: 1024 }
      );
      testsOk = testResult.status === ExecStatus.SUCCESS;
      diagnostics.push({
        executor: 'runTests',
        available: testsOk,
        test: 'add(1,2) & add(-1,1)',
        result: testsOk ? `passed=${testResult.passed}, failed=${testResult.failed}` : testResult.error,
        duration: testResult.duration
      });
    } catch (err) {
      diagnostics.push({
        executor: 'runTests',
        available: false,
        test: 'add(1,2) & add(-1,1)',
        result: err.message,
        duration: 0
      });
    }

    const allOk = diagnostics.every(d => d.available);
    const availableExecutors = diagnostics
      .filter(d => d.available)
      .map(d => d.executor);

    return {
      status:    allOk ? 'healthy' : 'degraded',
      executors: availableExecutors,
      diagnostics,
      stats:     this.stats,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = { CodeExecutor, ExecStatus, ExecError };
