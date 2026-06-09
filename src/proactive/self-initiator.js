/**
 * 自主发起者 (Self Initiator) v2.0.0
 *
 * 升级：从"发起者"升级为"迷你Agent"——不仅能决定做什么，
 * 还能直接编写代码、执行脚本、调用工具，代替Agent运行。
 *
 * 核心能力：
 * - 代码编写与执行（writeCode / runCode）
 * - 工具调用抽象（callTool / execScript）
 * - 任务管道（plan → code → run → verify）
 * - 错误恢复（retry / fallback / abort）
 * - 结果输出（formatOutput / deliverResult）
 *
 * 安全设计：
 * - 所有执行操作默认需确认
 * - 沙箱模式默认启用
 * - 执行超时保护
 * - 错误隔离（单步失败不阻断管道）
 */

const { GoalPursuer } = require('./goal-pursuer.js');

// ============================================================================
// 状态枚举
// ============================================================================

/** 任务执行状态 */
const TASK_STATE = {
  PENDING:     'pending',
  APPROVED:    'approved',
  RUNNING:     'running',
  SUCCESS:     'success',
  FAILED:      'failed',
  TIMEOUT:     'timeout',
  CANCELLED:   'cancelled',
  DEGRADED:    'degraded'   // 降级完成（部分步骤失败但整体有输出）
};

/** 执行模式 */
const EXEC_MODE = {
  CODE:        'code',        // 编写并执行代码
  SCRIPT:      'script',      // 运行Shell脚本
  TOOL:        'tool',        // 调用内部工具
  AGENT:       'agent',       // 委派为子代理任务
  PLAN:        'plan'         // 只做计划，不执行
};

/** 错误类别 */
const ERROR_CATEGORY = {
  INPUT:       'input_error',        // 输入无效
  SYNTAX:      'syntax_error',       // 代码语法错误
  RUNTIME:     'runtime_error',      // 运行时异常
  TIMEOUT:     'timeout_error',      // 执行超时
  PERMISSION:  'permission_error',   // 权限不足
  DEPENDENCY:  'dependency_error',   // 依赖缺失
  UNKNOWN:     'unknown_error'       // 未分类
};

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULTS = {
  maxHistory: 100,
  behaviorThreshold: 0.6,
  behaviorInhibition: true,
  maxRetries: 2,
  execTimeout: 30000,         // 代码执行超时（30秒）
  sandboxEnabled: true,       // 默认启用沙箱模式
  requireConfirmation: true,  // 执行前默认需确认
  maxCodeLength: 50000,       // 单次代码最大长度
  outputMaxLength: 10000,     // 输出截断长度
  retryBackoffMs: 1000,       // 重试等待基数
  maxConcurrent: 3            // 最大并发任务数
};

// ============================================================================
// SelfInitiator v2.0 — 迷你 Agent 引擎
// ============================================================================

class SelfInitiator {
  constructor(options = {}) {
    this.goalPursuer = new GoalPursuer();
    this.initiatedTasks = [];
    this.config = { ...DEFAULTS, ...options };
    this.pendingConfirmations = [];
    this._taskCounter = 0;
    this._activeExecutions = new Map();    // taskId -> execution context
    this._errorHistory = [];               // 错误历史（用于震荡检测）
  }

  // ========================================================================
  // 1. 决策层（继承原版能力）
  // ========================================================================

  shouldAct(context = {}) {
    const pursuit = this.goalPursuer.shouldPursue();

    if (!pursuit.shouldPursue) {
      return { shouldAct: false, reason: pursuit.reason, confidence: 0.5 };
    }

    if (this.config.behaviorInhibition && context.userActive) {
      return {
        shouldAct: false,
        reason: '用户正在活跃交互，抑制自主行为',
        confidence: 0.3,
        goal: pursuit.goal
      };
    }

    if (this._isTooFrequent()) {
      return {
        shouldAct: false,
        reason: '自主行为过于频繁',
        confidence: 0.2,
        goal: pursuit.goal
      };
    }

    return {
      shouldAct: true,
      reason: pursuit.reason,
      confidence: pursuit.goal.desireStrength || pursuit.goal.curiosityStrength || 0.5,
      goal: pursuit.goal
    };
  }

  _isTooFrequent() {
    if (this.initiatedTasks.length < 3) return false;
    const recentTasks = this.initiatedTasks.slice(-5);
    const timeWindow = 60000;
    const recentCount = recentTasks.filter(t => Date.now() - t.timestamp < timeWindow).length;
    return recentCount >= 3;
  }

  // ========================================================================
  // 2. 发起层（扩展版）
  // ========================================================================

  /**
   * 发起任务（增强版，支持执行模式和代码体）
   *
   * @param {Object} task - { title, description, goalId, code?, execMode?, script? }
   * @param {Object} options
   * @param {boolean} [options.requiresConfirmation]
   * @param {string} [options.priority='normal']
   * @param {string} [options.execMode=EXEC_MODE.PLAN]
   * @param {Object} [options.metadata]
   */
  initiate(task, options = {}) {
    const {
      requiresConfirmation = this.config.requireConfirmation,
      priority = 'normal',
      execMode = EXEC_MODE.PLAN,
      metadata = {}
    } = options;

    this._taskCounter++;
    const initiatedTask = {
      id: `task-${Date.now()}-${this._taskCounter}`,
      type: execMode,
      title: task.title,
      description: task.description || '',
      goalId: task.goalId,
      code: task.code || null,
      script: task.script || null,
      priority,
      execMode,
      state: TASK_STATE.PENDING,
      requiresConfirmation,
      initiatedAt: Date.now(),
      executedAt: null,
      completedAt: null,
      result: null,
      error: null,
      retries: 0,
      metadata
    };

    if (requiresConfirmation && this.config.behaviorInhibition) {
      this.pendingConfirmations.push(initiatedTask);
      return {
        task: initiatedTask,
        needsConfirmation: true,
        message: this._generateConfirmationMessage(initiatedTask)
      };
    }

    // 无需确认 → 直接执行
    this._executeTask(initiatedTask);
    return { task: initiatedTask, needsConfirmation: false };
  }

  _generateConfirmationMessage(task) {
    const modeMap = {
      [EXEC_MODE.CODE]:   `我想写代码执行: ${task.title}`,
      [EXEC_MODE.SCRIPT]: `我想运行脚本: ${task.title}`,
      [EXEC_MODE.TOOL]:   `我想调用工具: ${task.title}`,
      [EXEC_MODE.AGENT]:  `我想派子代理: ${task.title}`,
      [EXEC_MODE.PLAN]:   `我想 ${task.title}，可以吗？`
    };
    return modeMap[task.execMode] || `我想 ${task.title}，可以吗？`;
  }

  // ========================================================================
  // 3. 执行层（核心升级）
  // ========================================================================

  /**
   * 执行任务入口——按模式分发
   */
  _executeTask(task) {
    task.state = TASK_STATE.APPROVED;
    task.executedAt = Date.now();
    this.initiatedTasks.push(task);

    // 更新目标
    if (task.goalId) {
      this.goalPursuer.activateGoal({ ...task, desireStrength: 0.6 });
    }

    // 按执行模式分发
    switch (task.execMode) {
      case EXEC_MODE.CODE:
        this._runCodeTask(task);
        break;
      case EXEC_MODE.SCRIPT:
        this._runScriptTask(task);
        break;
      case EXEC_MODE.TOOL:
        this._runToolTask(task);
        break;
      case EXEC_MODE.AGENT:
        this._runAgentTask(task);
        break;
      case EXEC_MODE.PLAN:
      default:
        this._completeTask(task.id, { status: 'planned', steps: this._generatePlanSteps(task) });
        break;
    }

    // 清理历史
    if (this.initiatedTasks.length > this.config.maxHistory) {
      this.initiatedTasks = this.initiatedTasks.slice(-this.config.maxHistory);
    }
  }

  /**
   * 代码执行任务 — 编写、运行、验证
   */
  async _runCodeTask(task) {
    task.state = TASK_STATE.RUNNING;

    try {
      // Step 1: 验证代码
      if (!task.code || task.code.length > this.config.maxCodeLength) {
        throw this._makeError(ERROR_CATEGORY.INPUT, '代码为空或超出长度限制');
      }

      // Step 2: 语法检查
      const syntaxCheck = this._checkSyntax(task.code);
      if (!syntaxCheck.valid) {
        throw this._makeError(ERROR_CATEGORY.SYNTAX, syntaxCheck.error);
      }

      // Step 3: 执行（with timeout）
      const execResult = await this._execCodeWithTimeout(task.code, this.config.execTimeout);

      // Step 4: 验证结果
      const verified = this._verifyResult(execResult);

      this._completeTask(task.id, {
        status: verified.passed ? 'completed' : 'degraded',
        stdout: execResult.stdout?.substring(0, this.config.outputMaxLength),
        stderr: execResult.stderr?.substring(0, 2000),
        exitCode: execResult.exitCode,
        verified,
        code: task.code.substring(0, 500)  // 截断存储
      });

    } catch (err) {
      this._handleExecError(task, err);
    }
  }

  /**
   * 脚本执行任务 — 运行Shell命令
   */
  async _runScriptTask(task) {
    task.state = TASK_STATE.RUNNING;

    try {
      if (!task.script) {
        throw this._makeError(ERROR_CATEGORY.INPUT, '脚本内容为空');
      }

      // 安全检查：沙箱模式下禁止危险命令
      if (this.config.sandboxEnabled) {
        const danger = this._checkDangerousCommands(task.script);
        if (danger) {
          throw this._makeError(ERROR_CATEGORY.PERMISSION,
            `沙箱拦截危险命令: ${danger}`);
        }
      }

      const execResult = await this._execScriptWithTimeout(task.script, this.config.execTimeout);

      this._completeTask(task.id, {
        status: execResult.exitCode === 0 ? 'completed' : 'failed',
        stdout: execResult.stdout?.substring(0, this.config.outputMaxLength),
        stderr: execResult.stderr?.substring(0, 2000),
        exitCode: execResult.exitCode
      });

    } catch (err) {
      this._handleExecError(task, err);
    }
  }

  /**
   * 工具调用任务 — 委托给Hermes工具
   */
  async _runToolTask(task) {
    task.state = TASK_STATE.RUNNING;
    // 工具调用在Agent环境中由Hermes调度
    // 这里返回一个代理请求，由上层框架执行
    this._completeTask(task.id, {
      status: 'delegated',
      toolRequest: {
        tool: task.metadata.toolName,
        params: task.metadata.toolParams || {}
      },
      note: '工具调用已委派给Agent执行框架'
    });
  }

  /**
   * 子代理任务 — 生成委派指令
   */
  async _runAgentTask(task) {
    task.state = TASK_STATE.RUNNING;
    this._completeTask(task.id, {
      status: 'delegated',
      agentRequest: {
        goal: task.title,
        context: task.description,
        code: task.code
      },
      note: '子代理任务已生成委派指令'
    });
  }

  // ========================================================================
  // 4. 代码能力引擎
  // ========================================================================

  /**
   * 生成代码 — 根据描述自动编写代码
   *
   * @param {string} description - 代码功能描述
   * @param {string} [language='javascript'] - 目标语言
   * @returns {Object} { code, language, confidence }
   */
  generateCode(description, language = 'javascript') {
    if (!description || description.trim().length === 0) {
      return { error: '需要功能描述', code: null, confidence: 0 };
    }

    const code = this._generateCodeFromDesc(description, language);
    return {
      code,
      language,
      confidence: code ? 0.7 : 0,
      generatedAt: Date.now()
    };
  }

  _generateCodeFromDesc(description, language) {
    const desc = description.toLowerCase();

    // 检测意图
    const patterns = [
      // 数据处理
      { match: /排序|sort/i, code: (name) =>
`/**
 * 排序函数 — 根据${name}需求生成
 */
function sortData(data, key = null, ascending = true) {
  if (!Array.isArray(data)) return [];
  const sorted = [...data];
  if (key) {
    sorted.sort((a, b) => {
      const va = a[key] ?? '';
      const vb = b[key] ?? '';
      return ascending ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  } else {
    sorted.sort();
  }
  return sorted;
}

// 使用示例
// const result = sortData(items, 'name', true);
// console.log(result);
` },
      { match: /过滤|filter/i, code: (name) =>
`/**
 * 过滤函数 — 根据${name}需求生成
 */
function filterData(data, predicate) {
  if (!Array.isArray(data)) return [];
  if (typeof predicate !== 'function') return data;
  return data.filter(predicate);
}

// 使用示例
// const adults = filterData(people, p => p.age >= 18);
// console.log(adults);
` },
      { match: /统计|统计|analyze|stats|count/i, code: (name) =>
`/**
 * 统计分析 — 根据${name}需求生成
 */
function analyzeData(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return { count: 0, error: '数据为空' };
  }
  const numbers = data.filter(v => typeof v === 'number');
  const sum = numbers.reduce((a, b) => a + b, 0);
  return {
    count: data.length,
    numericCount: numbers.length,
    sum,
    avg: numbers.length > 0 ? (sum / numbers.length).toFixed(2) : 0,
    min: numbers.length > 0 ? Math.min(...numbers) : null,
    max: numbers.length > 0 ? Math.max(...numbers) : null,
    uniqueCount: new Set(data).size
  };
}

// 使用示例
// const stats = analyzeData([1, 2, 3, 4, 5]);
// console.log(stats);
` },
      { match: /转换|transform|map|format/i, code: (name) =>
`/**
 * 数据转换 — 根据${name}需求生成
 */
function transformData(data, transformer) {
  if (!Array.isArray(data)) return [];
  if (typeof transformer !== 'function') return data;
  return data.map(transformer);
}

// 使用示例
// const names = transformData(users, u => u.name);
// console.log(names);
` },
      { match: /搜索|search|find|query/i, code: (name) =>
`/**
 * 搜索函数 — 根据${name}需求生成
 */
function searchData(data, query, options = {}) {
  if (!Array.isArray(data)) return [];
  if (!query) return data;

  const { keys, exact = false, caseSensitive = false } = options;
  const q = caseSensitive ? String(query) : String(query).toLowerCase();

  return data.filter(item => {
    if (keys && Array.isArray(keys)) {
      return keys.some(key => {
        const val = String(item[key] ?? '');
        return exact ? val === q : val.toLowerCase().includes(q);
      });
    }
    const str = JSON.stringify(item);
    return exact ? str === q : str.toLowerCase().includes(q);
  });
}

// 使用示例
// const results = searchData(users, 'alice', { keys: ['name', 'email'] });
// console.log(results);
` },
      { match: /验证|validate|check|assert/i, code: (name) =>
`/**
 * 数据验证 — 根据${name}需求生成
 */
function validateData(data, rules) {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['输入数据无效'] };
  }
  const errors = [];
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(\`字段 "\${field}" 是必填的\`);
      continue;
    }
    if (value !== undefined && value !== null) {
      if (rule.type && typeof value !== rule.type) {
        errors.push(\`字段 "\${field}" 类型应为 \${rule.type}\`);
      }
      if (rule.min !== undefined && value < rule.min) {
        errors.push(\`字段 "\${field}" 最小值为 \${rule.min}\`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(\`字段 "\${field}" 最大值为 \${rule.max}\`);
      }
      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors.push(\`字段 "\${field}" 格式不正确\`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

// 使用示例
// const result = validateData({ name: 'Alice', age: 25 }, {
//   name: { required: true, type: 'string' },
//   age: { required: true, type: 'number', min: 0, max: 150 }
// });
// console.log(result);
` },
      { match: /爬虫|fetch|scrape|请求|http|api/i, code: (name) =>
`/**
 * HTTP请求封装 — 根据${name}需求生成
 */
async function fetchData(url, options = {}) {
  const {
    method = 'GET',
    headers = { 'Content-Type': 'application/json' },
    body = null,
    timeout = 10000
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return { success: true, data, status: response.status };
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, error: err.message };
  }
}

// 使用示例
// const result = await fetchData('https://api.example.com/data');
// console.log(result);
` },
      { match: /缓存|cache|memoize|记忆/i, code: (name) =>
`/**
 * 缓存工具 — 根据${name}需求生成
 */
class SimpleCache {
  constructor(options = {}) {
    this.store = new Map();
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 60000;  // 默认60秒
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return undefined;
    }
    entry.lastAccess = Date.now();
    return entry.value;
  }

  set(key, value, ttl = this.ttl) {
    if (this.store.size >= this.maxSize) {
      // LRU淘汰
      let oldest = null;
      for (const [k, v] of this.store) {
        if (!oldest || v.lastAccess < oldest.lastAccess) oldest = [k, v];
      }
      if (oldest) this.store.delete(oldest[0]);
    }
    this.store.set(key, { value, timestamp: Date.now(), lastAccess: Date.now(), ttl });
  }

  has(key) { return this.get(key) !== undefined; }

  clear() { this.store.clear(); }

  get stats() {
    return { size: this.store.size, maxSize: this.maxSize };
  }
}

// 使用示例
// const cache = new SimpleCache({ ttl: 30000 });
// cache.set('key', { data: 'value' });
// console.log(cache.get('key'));
` },
      { match: /文件|file|read|write|读写/i, code: (name) =>
`/**
 * 文件操作工具 — 根据${name}需求生成
 */
const fs = require('fs');
const path = require('path');

class FileToolkit {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  _resolvePath(filepath) {
    const resolved = path.resolve(this.baseDir, filepath);
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error('路径越界: 不允许访问基目录外的文件');
    }
    return resolved;
  }

  read(filepath) {
    const full = this._resolvePath(filepath);
    if (!fs.existsSync(full)) return { success: false, error: '文件不存在' };
    return { success: true, content: fs.readFileSync(full, 'utf-8') };
  }

  write(filepath, content) {
    const full = this._resolvePath(filepath);
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
    return { success: true, path: full };
  }

  list(dir = '.') {
    const full = path.resolve(this.baseDir, dir);
    if (!fs.existsSync(full)) return { success: false, error: '目录不存在' };
    return { success: true, files: fs.readdirSync(full) };
  }
}

// 使用示例
// const ft = new FileToolkit('./data');
// ft.write('test.txt', 'Hello World');
// console.log(ft.read('test.txt'));
` }
    ];

    for (const p of patterns) {
      if (p.match.test(desc)) {
        const name = description.split(/[，,。.：:]/)[0].substring(0, 20);
        return p.code(name || '任务');
      }
    }

    // 通用 fallback
    return `/**
 * 通用脚本 — ${description.substring(0, 60)}
 */
async function main() {
  console.log('开始执行: ${description.substring(0, 40)}');

  // 在此处写入你的逻辑
  // ...

  return { success: true, message: '执行完成' };
}

// 执行入口
main().then(console.log).catch(console.error);
`;
  }

  /**
   * 语法检查（轻量版）
   */
  _checkSyntax(code) {
    try {
      new Function(code);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  /**
   * 带超时的代码执行（模拟）
   * 真实环境中会被Hermes的execute_code替换
   */
  async _execCodeWithTimeout(code, timeout) {
    return new Promise((resolve) => {
      const start = Date.now();
      try {
        // 在实际Agent环境中，这里会被Hermes工具链接管
        // 这里提供模拟执行能力
        const captured = { stdout: '', stderr: '', exitCode: 0 };
        const origLog = console.log;
        const origErr = console.error;

        console.log = (...args) => {
          captured.stdout += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n';
        };
        console.error = (...args) => {
          captured.stderr += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n';
        };

        try {
          const fn = new Function('console', code);
          fn(console);
        } catch (execErr) {
          captured.stderr += execErr.message + '\n';
          captured.exitCode = 1;
        } finally {
          console.log = origLog;
          console.error = origErr;
        }

        resolve({
          stdout: captured.stdout,
          stderr: captured.stderr,
          exitCode: captured.exitCode,
          duration: Date.now() - start
        });
      } catch (err) {
        resolve({ stdout: '', stderr: err.message, exitCode: 1, duration: Date.now() - start });
      }

      // 超时保护
      setTimeout(() => {
        resolve({ stdout: '', stderr: '执行超时', exitCode: 124, duration: timeout });
      }, timeout);
    });
  }

  /**
   * 带超时的脚本执行
   */
  async _execScriptWithTimeout(script, timeout) {
    const { execSync } = require('child_process');
    try {
      const start = Date.now();
      const result = execSync(script, {
        timeout,
        shell: '/bin/bash',
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024
      });
      return { stdout: result, stderr: '', exitCode: 0, duration: Date.now() - start };
    } catch (err) {
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        exitCode: err.status || 1,
        duration: err.duration || 0
      };
    }
  }

  /**
   * 沙箱安全检查
   */
  _checkDangerousCommands(script) {
    const dangerous = [
      { pattern: /rm\s+-rf\s+\//, desc: '删除根目录' },
      { pattern: /mkfs|dd\s+if=|fdisk/, desc: '磁盘操作' },
      { pattern: /chmod\s+777/, desc: '权限提升' },
      { pattern: /sudo\s+/, desc: 'sudo提权' },
      { pattern: />\s*\/dev\//, desc: '设备文件写入' },
      { pattern: /:\(\)\s*\{/, desc: 'fork炸弹' }
    ];
    for (const d of dangerous) {
      if (d.pattern.test(script)) return d.desc;
    }
    return null;
  }

  /**
   * 结果验证
   */
  _verifyResult(execResult) {
    const checks = [];
    let passed = true;

    // 检查是否有输出
    if (!execResult.stdout && !execResult.stderr) {
      checks.push({ name: 'output', passed: false, msg: '无输出' });
      passed = false;
    } else {
      checks.push({ name: 'output', passed: true, msg: `${execResult.stdout?.length || 0} 字符输出` });
    }

    // 检查退出码
    if (execResult.exitCode !== 0) {
      checks.push({ name: 'exitCode', passed: false, msg: `退出码 ${execResult.exitCode}` });
      passed = false;
    } else {
      checks.push({ name: 'exitCode', passed: true, msg: '正常退出' });
    }

    return { passed, checks, score: checks.filter(c => c.passed).length / checks.length };
  }

  // ========================================================================
  // 5. 错误处理与恢复
  // ========================================================================

  _makeError(category, message) {
    return { category, message, timestamp: Date.now() };
  }

  _handleExecError(task, err) {
    const category = err.category || ERROR_CATEGORY.UNKNOWN;
    const message = err.message || String(err);

    this._errorHistory.push({ taskId: task.id, category, message, timestamp: Date.now() });

    // 震荡检测：同类别错误是否反复出现
    const recentErrors = this._errorHistory.filter(
      e => e.category === category && Date.now() - e.timestamp < 120000
    );
    const oscillating = recentErrors.length >= 3;

    // 重试逻辑
    if (task.retries < this.config.maxRetries && !oscillating) {
      task.retries++;
      const delay = this.config.retryBackoffMs * Math.pow(2, task.retries - 1);
      setTimeout(() => this._executeTask(task), delay);
      task.state = TASK_STATE.APPROVED;  // 标记为等待重试
      return;
    }

    // 降级或失败
    if (oscillating) {
      task.state = TASK_STATE.DEGRADED;
      task.result = {
        status: 'degraded',
        error: `检测到${category}震荡，已降级`,
        retries: task.retries
      };
    } else {
      task.state = TASK_STATE.FAILED;
      task.error = { category, message, retries: task.retries };
      task.result = { status: 'failed', error: message };
    }

    task.completedAt = Date.now();
  }

  // ========================================================================
  // 6. 任务与目标管理
  // ========================================================================

  _completeTask(taskId, result) {
    const task = this.initiatedTasks.find(t => t.id === taskId);
    if (!task) return;

    task.state = result.status === 'completed' ? TASK_STATE.SUCCESS : TASK_STATE[result.status?.toUpperCase()] || TASK_STATE.COMPLETED;
    task.result = result;
    task.completedAt = Date.now();
    this._activeExecutions.delete(taskId);

    // 更新目标
    if (task.goalId) {
      this.goalPursuer.updateProgress(task.goalId,
        result.status === 'completed' ? 100 : 50,
        { type: 'task_result', taskId, result }
      );
    }
  }

  _generatePlanSteps(task) {
    return [
      { step: 1, action: `分析: ${task.title}` },
      { step: 2, action: `规划执行路径` },
      { step: 3, action: `执行并验证结果` },
      { step: 4, action: `输出最终结果` }
    ];
  }

  // ========================================================================
  // 7. 确认/拒绝/状态查询（保持向后兼容）
  // ========================================================================

  confirmPending(taskId) {
    const task = this.pendingConfirmations.find(t => t.id === taskId);
    if (!task) return null;
    this.pendingConfirmations = this.pendingConfirmations.filter(t => t.id !== taskId);
    this._executeTask(task);
    return task;
  }

  rejectPending(taskId, reason = '') {
    const task = this.pendingConfirmations.find(t => t.id === taskId);
    if (!task) return null;
    task.state = TASK_STATE.CANCELLED;
    task.rejectionReason = reason;
    task.rejectedAt = Date.now();
    this.pendingConfirmations = this.pendingConfirmations.filter(t => t.id !== taskId);
    this.initiatedTasks.push(task);
    return task;
  }

  completeTask(taskId, result) {
    const task = this.initiatedTasks.find(t => t.id === taskId);
    if (!task) return null;
    task.state = TASK_STATE.SUCCESS;
    task.completedAt = Date.now();
    task.result = result;
    if (task.goalId) {
      this.goalPursuer.updateProgress(task.goalId, 100, { type: 'task_completed', taskId, result });
    }
    return task;
  }

  getPendingConfirmations() {
    return [...this.pendingConfirmations];
  }

  getHistory(limit = 20) {
    return this.initiatedTasks.slice(-limit);
  }

  getStatus() {
    return {
      totalInitiated: this.initiatedTasks.length,
      pendingConfirmations: this.pendingConfirmations.length,
      activeExecutions: this._activeExecutions.size,
      activeGoals: this.goalPursuer.getStatus(),
      recentTasks: this.getHistory(5),
      behaviorInhibition: this.config.behaviorInhibition,
      config: {
        maxRetries: this.config.maxRetries,
        execTimeout: this.config.execTimeout,
        sandboxEnabled: this.config.sandboxEnabled
      },
      errorStats: this._getErrorStats()
    };
  }

  _getErrorStats() {
    const categories = {};
    for (const e of this._errorHistory) {
      categories[e.category] = (categories[e.category] || 0) + 1;
    }
    return {
      total: this._errorHistory.length,
      categories,
      recentOscillation: this._detectErrorOscillation()
    };
  }

  _detectErrorOscillation() {
    if (this._errorHistory.length < 3) return false;
    const recent = this._errorHistory.slice(-5);
    const unique = new Set(recent.map(e => e.category));
    // 最近5个错误中有≥3种不同类型 → 可能是震荡
    return unique.size >= 3;
  }

  setBehaviorInhibition(enabled) {
    this.config.behaviorInhibition = enabled;
  }

  // ========================================================================
  // 8. 主动行动建议（增强版）
  // ========================================================================

  getSuggestedActions(context = {}) {
    const pursuit = this.goalPursuer.shouldPursue();
    if (!pursuit.shouldPursue) return [];

    const goal = pursuit.goal;
    const suggestions = [];

    if (goal.type === 'curiosity') {
      suggestions.push({
        type: 'explore',
        title: `探索: ${goal.title}`,
        description: goal.description,
        confidence: goal.curiosityStrength,
        execMode: EXEC_MODE.CODE,
        action: () => this.initiate({
          title: goal.title,
          description: goal.description,
          goalId: goal.id
        }, { execMode: EXEC_MODE.CODE })
      });
    }

    if (goal.type === 'desire') {
      suggestions.push({
        type: 'pursue',
        title: goal.title,
        description: goal.description,
        confidence: goal.desireStrength,
        execMode: EXEC_MODE.PLAN,
        action: () => this.initiate({
          title: goal.title,
          description: goal.description,
          goalId: goal.id
        }, { execMode: EXEC_MODE.PLAN })
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // ========================================================================
  // 9. 配置管理
  // ========================================================================

  configure(overrides = {}) {
    const validKeys = Object.keys(DEFAULTS);
    for (const [key, value] of Object.entries(overrides)) {
      if (validKeys.includes(key)) {
        this.config[key] = value;
      }
    }
    return { ...this.config };
  }

  getConfig() {
    return { ...this.config };
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  SelfInitiator,
  TASK_STATE,
  EXEC_MODE,
  ERROR_CATEGORY
};
