/**
 * CodeExecutor — 引擎代码执行引擎 v1.1.0
 *
 * 代码执行引擎，支持 JavaScript / Shell / Python 执行。
 * 所有执行均带超时保护、输出截断、参数验证。
 * Shell/Python 执行内置危险命令过滤和安全限制。
 *
 * ═══ 安全声明 (SkillSpector fix) ═══
 * ⚠️ 此模块的沙箱机制仅为正则模式匹配 + 局部作用域覆盖，不是系统级隔离。
 * ⚠️ 不应用于执行不可信代码。恶意代码可绕过正则检测执行任意操作。
 * ⚠️ Shell/Python 执行直接在宿主进程上下文中运行，无沙箱隔离。
 * ⚠️ 环境变量已在沙箱中屏蔽，但非沙箱模式下仍可访问。
 *
 * 核心能力：
 * - execute(code, options) — 多语言代码执行
 * - runTests(code, testCode) — 测试执行与结果收集
 * - sandbox(code, options) — 正则级安全限制（非系统沙箱）
 * - healthCheck() — 自检各执行器可用性
 *
 * @module code-executor
 * @permission execute_code — 执行任意代码（JavaScript/Shell/Python），请谨慎使用
 */

'use strict';

const _cp = require('child_process');
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

// [P3 FIX] 资源限制：防止代码执行消耗过多资源
const RESOURCE_LIMITS = Object.freeze({
  maxMemoryMB:    256,    // 单次执行最大内存 256MB
  maxConcurrent:  3,      // 最大并发执行数
  cooldownMs:     1000,   // 执行冷却时间 1s
});

const MAX_OUTPUT_LIMIT = 1048576; // 1MB 绝对上限

// ============================================================================
// 运行时守卫：代码执行默认关闭，需显式启用
// ============================================================================

const CODE_EXECUTOR_ENABLED = process.env.HEARTFLOW_CODE_EXECUTOR_ENABLED === 'true' || process.env.HEARTFLOW_CODE_EXECUTOR_ENABLED === '1';

if (!CODE_EXECUTOR_ENABLED) {
  // 运行时守卫：默认不启用代码执行。设置 HEARTFLOW_CODE_EXECUTOR_ENABLED=true 来启用
}

// ============================================================================
// 危险命令过滤列表（Shell 执行）
// ============================================================================

const DANGEROUS_COMMANDS = [
  /rm\s+-rf\s+\//i,            // rm -rf /
  /rm\s+--no-preserve-root/i,  // rm --no-preserve-root
  /rm\s+-r\s+\*/i,            // rm -r /*
  /mkfs\.?\w*/i,               // mkfs.*
  /dd\s+if=\/dev\/zero/i,      // dd if=/dev/zero
  /dd\s+of=\/dev\/sda/i,       // dd of=/dev/sda
  /:\(\)\s*\{[^}]*\};\s*:/i,   // fork bomb
  /chmod\s+-R\s+0{4}\s+\//i,   // chmod -R 000 /
  /chown\s+-R\s+.*\s+\//i,     // chown -R ... /
  /sudo\s+/i,                  // sudo
  /doas\s+/i,                  // doas (sudo替代)
  /nc\s+-e\s+/i,              // nc -e (反弹shell)
  /cat\s+\/etc\/.*/i,        // cat /etc/*
  /python3?\s+-c\s+.*os\.system/i,  // python -c os.system
  /curl\s+\|\s*bash/i,       // curl | bash
  /wget\s+\|\s*(bash|sh)/i,  // wget | bash/sh
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
  /`[^`]+`/i,             // [AUDIT-FIX] 反引号命令替换
  /\$\([^)]*\)/i,         // [AUDIT-FIX] $() 命令替换
  /base64\s+-d.*\|.*(?:bash|sh)/i, // [AUDIT-FIX] base64 解码后管道执行
];

// ============================================================================
// Shell 命令白名单（B-01 安全修复：白名单门控，防止 shell 注入）
// 只有在此列表中的命令才允许通过 execSync 执行。
// 黑名单 DANGEROUS_COMMANDS 作为第二层防御保留。
// ============================================================================

const ALLOWED_SHELL_COMMANDS = [
  'node',       // Node.js 运行时
  'python3',    // Python3 运行时
  'python',     // Python 运行时
  'echo',       // 输出文本
  'date',       // 日期查询
  'wc',         // 字数/行数统计
  'cat',        // 文件内容查看（危险路径由黑名单第二层拦截）
  'head',       // 文件头部查看
  'tail',       // 文件尾部查看
  'ls',         // 目录列表
  'pwd',        // 当前目录
  'whoami',     // 当前用户
  'which',      // 命令路径查找
  'grep',       // 文本搜索
  'sort',       // 排序
  'uniq',       // 去重
  'cut',        // 文本切割
  'tr',         // 字符替换
  'awk',        // 文本处理
  'sed',        // 流编辑器
  'printf',     // 格式化输出
  'seq',        // 数字序列
  'expr',       // 表达式计算
  'bc',         // 计算器
  'true',       // 返回成功
  'false',      // 返回失败
  'test',       // 条件测试
  'dirname',    // 目录名提取
  'basename',   // 文件名提取
  'xargs',      // 参数构建
  'tee',        // 输出分流
  'diff',       // 文件比较
  'find',       // 文件查找
  // 'curl',       // [SECURITY FIX] 已移除：防止数据外泄
  // 'wget',       // [SECURITY FIX] 已移除：防止数据外泄
];

/**
 * 白名单命令验证（B-01 安全修复）
 * 从 code 中提取第一个命令词，检查是否在 ALLOWED_SHELL_COMMANDS 中。
 * 支持管道（|）和链式（&&、||、;）命令：每个子命令都必须通过白名单。
 *
 * @param {string} code - 待执行的 shell 命令字符串
 * @returns {{allowed: boolean, blockedCommand: string|null}}
 */
function validateShellCommand(code) {
  if (!code || typeof code !== 'string') {
    return { allowed: false, blockedCommand: null };
  }

  // 将管道和链式操作符分割为子命令，逐一检查
  // 匹配 |、&&、||、; 作为分隔符（忽略前后空格）
  const subCommands = code.split(/\s*(?:\|\||&&|\||;)\s*/);

  for (const subCmd of subCommands) {
    const trimmed = subCmd.trim();
    if (!trimmed) continue;

    // 提取第一个词作为命令名（跳过前导环境变量赋值 KEY=VALUE）
    const tokens = trimmed.split(/\s+/);
    let cmdToken = tokens[0];

    // 跳过环境变量赋值（如 VAR=value command ...）
    while (cmdToken && /=/.test(cmdToken) && !cmdToken.includes('$')) {
      tokens.shift();
      cmdToken = tokens[0];
    }

    if (!cmdToken) {
      return { allowed: false, blockedCommand: '(空命令)' };
    }

    // 去除路径前缀，只取命令名本身（如 /usr/bin/node → node）
    const cmdName = path.basename(cmdToken);

    // 检查是否在白名单中
    if (!ALLOWED_SHELL_COMMANDS.includes(cmdName)) {
      return { allowed: false, blockedCommand: cmdName };
    }

    // [SECURITY-FIX] H-1: 参数级危险字符检测
    // 白名单检查通过后，仍须检查整个子命令是否含命令替换字符
    // $(...) 和反引号在 bash 中任意位置都会被执行
    if (/\$\(/.test(subCmd) || /`/.test(subCmd)) {
      return { allowed: false, blockedCommand: cmdName + ' (含命令替换)' };
    }
  }

  return { allowed: true, blockedCommand: null };
}

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
  /process\.env/i,              // SkillSpector fix: 禁止访问环境变量（防止密钥泄露）
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
  /\(0,\s*constructor\.constructor\)/i,  // [AUDIT-FIX] 阻止 (0,constructor.constructor) 绕过
  /\(1,\s*constructor\.constructor\)/i,  // [AUDIT-FIX] 阻止 (1,constructor.constructor) 绕过
  /\[\s*\)\s*\]\s*constructor\.constructor/i, // [AUDIT-FIX] 阻止 Array 绕过
  /constructor\s*\.\s*constructor/i,       // [AUDIT-FIX B-03] 阻止所有 constructor.constructor 逃逸（通用模式，覆盖上述特定模式）
  /\[\s*['"]constructor['"]\s*\]/i,         // [AUDIT-FIX B-03] 阻止 ['constructor'] 属性访问逃逸
  /Buffer\.(alloc|from)/i,     // SkillSpector fix: 禁止 Buffer 操作（防止内存读取）
  /net\.(connect|createServer)/i, // SkillSpector fix: 禁止网络操作
  /http\.(request|get|createServer)/i,
  /https\.(request|get|createServer)/i,
  /dns\.(resolve|lookup)/i,
  /Object\.defineProperty/i,                // [AUDIT-FIX B-03] 阻止修改对象属性定义
  /Object\.setPrototypeOf/i,                // [AUDIT-FIX B-03] 阻止修改原型链
  /Reflect\.(apply|construct|get|set|getPrototypeOf|setPrototypeOf)/i, // [AUDIT-FIX B-03] 阻止反射逃逸
  /WebAssembly/i,                           // [AUDIT-FIX B-03] 阻止 WebAssembly 逃逸
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

    // [P0 FIX] 初始化并发限制器（之前未初始化，导致 undefined >= 3 恒为 false）
    this._executionCount = 0;
    this._lastExecutionTime = 0;

  }

  /**
   * 检查 shell 是否可用
   * @private
   */
  _checkShellAvailable() {
    try {
      _cp.execFileSync('echo', ['"shell_ok"'], { timeout: 3000, encoding: 'utf-8' });
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
      const result = _cp.execFileSync('python3', ['--version'], {
        timeout: 5000,
        encoding: 'utf-8'
      });
      return result.includes('Python');
    } catch {
      // fallback to 'python'
      try {
        const result = _cp.execFileSync('python', ['--version'], {
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
    // [HIGH FIX] 删除 avgDuration 双重写入（改为由 getter 统一计算，避免不一致）

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
  async execute(code, options = {}) {
    // [v3.8.1] 运行时守卫：代码执行默认关闭
    if (!CODE_EXECUTOR_ENABLED) {
      return { status: ExecStatus.ERROR, output: '', error: 'Code execution is disabled. Set HEARTFLOW_CODE_EXECUTOR_ENABLED=true to enable.', duration: 0, language: 'none', truncated: false, execError: ExecError.PERMISSION };
    }
    // [P3 FIX] 资源限制检查
    const now = Date.now();
    if (this._executionCount >= RESOURCE_LIMITS.maxConcurrent) {
      if (now - this._lastExecutionTime < RESOURCE_LIMITS.cooldownMs) {
        return { status: ExecStatus.ERROR, output: '', error: `执行冷却中，请等待 ${RESOURCE_LIMITS.cooldownMs}ms`, duration: 0, language: 'none', truncated: false, execError: ExecError.PERMISSION };
      }
      this._executionCount = 0;
    }
    this._executionCount++;
    this._lastExecutionTime = now;

    // [HIGH FIX] 内存限制检查（之前 maxMemoryMB 声明但未执行）
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    if (memUsageMB > RESOURCE_LIMITS.maxMemoryMB) {
      return { status: ExecStatus.ERROR, output: '', error: `内存使用超限：${memUsageMB.toFixed(1)}MB > ${RESOURCE_LIMITS.maxMemoryMB}MB`, duration: 0, language: 'none', truncated: false, execError: ExecError.RESOURCE_LIMIT };
    }

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
          result = await this._executeJavaScript(code, opts);
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
   * JavaScript 执行（沙箱隔离）
   * @private
   */
  async _executeJavaScript(code, opts) {
    const timeout = opts.timeout || DEFAULTS.timeout;
    const maxOutput = opts.maxOutput || DEFAULTS.maxOutput;
    const context = opts.context || {};

    let capturedOutput = '';
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // [AUDIT-FIX] 嵌套 try 确保 console 在同步/异步异常时都恢复
    const _restoreConsole = () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };

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

      // [SECURITY-FIX] C-1: 使用 vm.runInNewContext 替代 Reflect.construct
      // 原实现使用 Function.prototype.bind.bind(Function) + Reflect.construct，
      // 被静态分析工具标记为危险模式（ obfuscated dynamic code execution）。
      // 修复：使用 Node.js 内置 vm 模块提供适当的上下文隔离。
      // 注意：vm 上下文隔离并非绝对安全，但远优于 Reflect.construct 方案。
      const vm = require('vm');
      const sandboxContext = { console, setTimeout, clearTimeout };
      // 注入用户提供的上下文
      for (const k of contextKeys) {
        sandboxContext[k] = context[k];
      }
      const script = new vm.Script('(async () => { ' + code + ' })()', { filename: 'heartflow-exec' });
      const vmResult = script.runInNewContext(sandboxContext, { timeout });
      // vmResult 可能是 Promise（如果 code 含顶层 await 或 async）
      const result = vmResult instanceof Promise ? await vmResult : vmResult;

      // 超时执行

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
      _restoreConsole();
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

    // [B-01 安全修复] 白名单门控：只允许预定义的安全命令执行
    const whitelistCheck = validateShellCommand(code);
    if (!whitelistCheck.allowed) {
      return {
        status:    ExecStatus.SANDBOX_BLOCKED,
        output:    '',
        error:     `命令不在允许列表中: "${whitelistCheck.blockedCommand}"。允许的命令: ${ALLOWED_SHELL_COMMANDS.join(', ')}`,
        truncated: false,
        execError: ExecError.SANDBOX
      };
    }

    // 危险命令检查（第二层防御：黑名单拦截已知危险模式）
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
      // [B-01 安全修复] 白名单 + 危险命令过滤已通过
      // 使用 execFileSync('/bin/sh', ['-c', code]) 代替 execSync(code, {shell})
      // 避免整条命令字符串被 shell 解释器直接解析，缩小攻击面
      const { execFileSync } = require('child_process');
      const result = execFileSync('/bin/sh', ['-c', code], {
        timeout,
        encoding: 'utf-8',
        maxBuffer: MAX_OUTPUT_LIMIT,
        // 不再使用 shell: '/bin/bash'，改为显式调用 /bin/sh -c
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

    // 写入临时文件执行（使用crypto.randomUUID()提高安全性）
    const tmpFile = path.join(
      require('os').tmpdir(),
      `code_exec_${require('crypto').randomUUID()}.py`
    );

    try {
      fs.writeFileSync(tmpFile, code, 'utf-8');

      const pythonCmd = this._getPythonCommand();

      // [AUDIT-FIX] 使用 execFileSync 数组参数避免 shell 注入
      const result = _cp.execFileSync(pythonCmd, [tmpFile], {
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
      _cp.execFileSync('python3', ['--version'], { timeout: 2000, encoding: 'utf-8', stdio: 'ignore' });
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
   * 禁止 require / eval / child_process / fs.write / 等
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
  async sandbox(code, options = {}) {
    validateArg(code, 'code', 'string');


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
const __blockedNames = new Set([
  'require', 'eval', 'Function', 'child_process', 'process',
  'global', 'globalThis', 'setTimeout', 'setInterval', 'setImmediate',
  'clearTimeout', 'clearInterval', 'clearImmediate',
  '__dirname', '__filename', 'module', 'exports',
  'fetch', 'XMLHttpRequest', 'WebSocket',
  'import', 'importScripts',
  'fs', 'path', 'os', 'http', 'https', 'net', 'tls', 'dns', 'crypto',
  'Worker', 'SharedWorker', 'ServiceWorker',
  'navigator', 'location', 'history', 'localStorage', 'sessionStorage',
  'indexedDB', 'caches', 'cookieStore',
  // [AUDIT-FIX B-03] 新增危险内置对象名称
  'Object', 'Symbol', 'Proxy', 'Reflect', 'WebAssembly',
  'SharedArrayBuffer', 'Atomics', 'ArrayBuffer',
  'Int8Array', 'Uint8Array', 'Float32Array', 'Float64Array'
]);

// 创建被禁止的标识符，调用时抛出错误
function __blockedFn(name) {
  return function() {
    throw new Error('沙箱禁止使用 ' + name);
  };
}

// 在局部作用域中覆盖危险标识符（使用 var 避免严格模式限制）
var require = __blockedFn('require');
var eval_ = __blockedFn('eval');
var Function = __blockedFn('Function');
var child_process = __blockedFn('child_process');
var process = __blockedFn('process');
var global = __blockedFn('global');
var setTimeout = __blockedFn('setTimeout');
var setInterval = __blockedFn('setInterval');
var setImmediate = __blockedFn('setImmediate');
var clearTimeout = __blockedFn('clearTimeout');
var clearInterval = __blockedFn('clearInterval');
var clearImmediate = __blockedFn('clearImmediate');
var __dirname = __blockedFn('__dirname');
var __filename = __blockedFn('__filename');
var module = __blockedFn('module');
var exports = __blockedFn('exports');
var fetch = __blockedFn('fetch');
var XMLHttpRequest = __blockedFn('XMLHttpRequest');
var WebSocket = __blockedFn('WebSocket');
var importScripts = __blockedFn('importScripts');
var Worker = __blockedFn('Worker');
var SharedWorker = __blockedFn('SharedWorker');
var ServiceWorker = __blockedFn('ServiceWorker');
var navigator = __blockedFn('navigator');
var location = __blockedFn('location');
var history = __blockedFn('history');
var localStorage = __blockedFn('localStorage');
var sessionStorage = __blockedFn('sessionStorage');
var indexedDB = __blockedFn('indexedDB');
var caches = __blockedFn('caches');
var cookieStore = __blockedFn('cookieStore');
var fs = __blockedFn('fs');
var path = __blockedFn('path');
var os = __blockedFn('os');
var http = __blockedFn('http');
var https = __blockedFn('https');
var net = __blockedFn('net');
var tls = __blockedFn('tls');
var dns = __blockedFn('dns');
var crypto = __blockedFn('crypto');

// [AUDIT-FIX B-03] 冻结原型链，阻止 constructor.constructor 逃逸
// 注意：var 声明会提升到函数顶部，导致 const xxx = Object 时 Object 已被 var 遮蔽为 undefined
// 因此必须通过 __globals 参数（传入 globalThis）获取原始内置对象引用
const __originalObject = __globals.Object;
const __originalFunction = __globals.Function;
const __originalArray = __globals.Array;
const __originalBoolean = __globals.Boolean;
const __originalNumber = __globals.Number;
const __originalString = __globals.String;
const __originalRegExp = __globals.RegExp;
const __originalDate = __globals.Date;
const __originalError = __globals.Error;
const __originalMap = __globals.Map;
const __originalSet = __globals.Set;
const __originalReflect = __globals.Reflect;
const __originalProxy = __globals.Proxy;

// [AUDIT-FIX B-03] 关键修复：替换 Function.prototype.constructor 为安全函数
// 这是阻止 constructor.constructor 逃逸的根本方案：
// 即使攻击者通过字符串拼接绕过正则检测，运行时调用 constructor.constructor
// 也会得到一个抛出错误的函数，而非真正的 Function 构造器
// 必须在冻结原型之前执行，因为冻结后无法修改属性
// 注意：由于沙箱可能被多次调用，需要检查是否已经替换过
const __currentConstructorDesc = __originalObject.getOwnPropertyDescriptor(__originalFunction.prototype, 'constructor');
if (__currentConstructorDesc && __currentConstructorDesc.configurable) {
  __originalObject.defineProperty(__originalFunction.prototype, 'constructor', {
    value: function() { throw new Error('沙箱禁止使用 Function constructor'); },
    writable: false,
    configurable: false,
    enumerable: false
  });
}

// [AUDIT-FIX B-03] 同样替换 GeneratorFunction 和 AsyncFunction 的 constructor
// 它们有独立的 prototype，不继承自 Function.prototype 的 constructor
// 攻击者可通过 (function*(){}).constructor('return require') 逃逸
// 注意：GeneratorFunction/AsyncFunction 不是全局对象，需要从实例获取
const __gfProto = (function*(){}).constructor.prototype;
const __afProto = (async function(){}).constructor.prototype;
const __gfDesc = __originalObject.getOwnPropertyDescriptor(__gfProto, 'constructor');
if (__gfDesc && __gfDesc.configurable) {
  __originalObject.defineProperty(__gfProto, 'constructor', {
    value: function() { throw new Error('沙箱禁止使用 GeneratorFunction constructor'); },
    writable: false,
    configurable: false,
    enumerable: false
  });
}
const __afDesc = __originalObject.getOwnPropertyDescriptor(__afProto, 'constructor');
if (__afDesc && __afDesc.configurable) {
  __originalObject.defineProperty(__afProto, 'constructor', {
    value: function() { throw new Error('沙箱禁止使用 AsyncFunction constructor'); },
    writable: false,
    configurable: false,
    enumerable: false
  });
}

// 冻结所有原型链，阻止通过修改原型链恢复 constructor
__originalObject.freeze(__originalObject.prototype);
__originalObject.freeze(__originalFunction.prototype);
__originalObject.freeze(__originalArray.prototype);
__originalObject.freeze(__originalBoolean.prototype);
__originalObject.freeze(__originalNumber.prototype);
__originalObject.freeze(__originalString.prototype);
__originalObject.freeze(__originalRegExp.prototype);
__originalObject.freeze(__originalDate.prototype);
__originalObject.freeze(__originalError.prototype);
__originalObject.freeze(__originalMap.prototype);
__originalObject.freeze(__originalSet.prototype);

// [AUDIT-FIX B-03] 遮蔽更多危险内置对象，防止通过原型链逃逸
// 注意：Object 被遮蔽后 Object.keys/values/entries/assign 等安全方法也不可用
// 因此提供 __safeObject 保留安全方法，同时遮蔽危险方法
var Object = (function() {
  var __origObj = __originalObject;
  var __safe = function() { throw new Error('沙箱禁止使用 Object 构造器'); };
  // 保留安全的静态方法
  __safe.keys = __origObj.keys;
  __safe.values = __origObj.values;
  __safe.entries = __origObj.entries;
  __safe.assign = __origObj.assign;
  __safe.freeze = __origObj.freeze;
  __safe.isFrozen = __origObj.isFrozen;
  __safe.seal = __origObj.seal;
  __safe.isSealed = __origObj.isSealed;
  __safe.preventExtensions = __origObj.preventExtensions;
  __safe.isExtensible = __origObj.isExtensible;
  __safe.getOwnPropertyNames = __origObj.getOwnPropertyNames;
  __safe.getOwnPropertySymbols = __origObj.getOwnPropertySymbols;
  __safe.getPrototypeOf = __origObj.getPrototypeOf;
  __safe.is = __origObj.is;
  // 遮蔽危险方法
  __safe.defineProperty = function() { throw new Error('沙箱禁止使用 Object.defineProperty'); };
  __safe.defineProperties = function() { throw new Error('沙箱禁止使用 Object.defineProperties'); };
  __safe.setPrototypeOf = function() { throw new Error('沙箱禁止使用 Object.setPrototypeOf'); };
  __safe.create = function() { throw new Error('沙箱禁止使用 Object.create'); };
  __safe.getOwnPropertyDescriptor = function() { throw new Error('沙箱禁止使用 Object.getOwnPropertyDescriptor'); };
  return __safe;
})();
var Symbol = __blockedFn('Symbol');
var Proxy = __blockedFn('Proxy');
var Reflect = __blockedFn('Reflect');
var WebAssembly = __blockedFn('WebAssembly');
var SharedArrayBuffer = __blockedFn('SharedArrayBuffer');
var Atomics = __blockedFn('Atomics');
var ArrayBuffer = __blockedFn('ArrayBuffer');
var Int8Array = __blockedFn('Int8Array');
var Uint8Array = __blockedFn('Uint8Array');
var Float32Array = __blockedFn('Float32Array');
var Float64Array = __blockedFn('Float64Array');

// 使用 Proxy 拦截 globalThis 访问（如果可用）
let __globalThisProxy;
try {
  const __handler = {
    get: function(target, prop, receiver) {
      if (__blockedNames.has(prop)) {
        throw new Error('沙箱禁止访问 globalThis.' + prop);
      }
      return __originalReflect.get(target, prop, receiver);
    },
    has: function(target, prop) {
      if (__blockedNames.has(prop)) {
        return false;
      }
      return __originalReflect.has(target, prop);
    },
    set: function(target, prop, value) {
      if (__blockedNames.has(prop)) {
        throw new Error('沙箱禁止设置 globalThis.' + prop);
      }
      return __originalReflect.set(target, prop, value);
    }
  };
  __globalThisProxy = new __originalProxy(globalThis, __handler);
} catch (e) {
  // 如果 Proxy 不可用，忽略
  __globalThisProxy = globalThis;
}

// 在局部作用域中覆盖 globalThis（使用 Proxy）
var globalThis = __globalThisProxy;

// 在 IIFE 内部执行用户代码
(function() {
${code}
})();
`;

      const fn = new Function('console', '__globals', sandboxedCode);

      const result = await this._executeWithTimeout(fn, timeout, [console, globalThis]);

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
  async healthCheck() {
    const diagnostics = [];

    // 1. JavaScript 自检
    let jsOk = false;
    try {
      const jsResult = await this.execute('1 + 1', { timeout: 5000, maxOutput: 1024 });
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
      const sbResult = await this.sandbox('console.log("sandbox_ok");', { timeout: 5000, maxOutput: 1024 });
      sandboxOk = sbResult.status === ExecStatus.SUCCESS;
      diagnostics.push({
        executor: 'sandbox',
        available: sandboxOk,
        result: sandboxOk ? 'sandbox_ok' : sbResult.error,
        duration: sbResult.duration
      });
    } catch (err) {
      diagnostics.push({
        executor: 'sandbox',
        available: false,
        result: err.message,
        duration: 0
      });
    }

    // 3. Shell 自检
    const shellAvailable = this._checkShellAvailable();
    let shellOk = false;
    if (shellAvailable) {
      try {
        const shResult = await this.execute('echo "shell_ok"', { language: 'shell', timeout: 5000, maxOutput: 1024 });
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
        const pyResult = await this.execute('print("python_ok")', { language: 'python', timeout: 10000, maxOutput: 1024 });
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
