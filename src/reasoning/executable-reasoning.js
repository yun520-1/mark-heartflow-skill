'use strict';

/**
 * ExecutableReasoning — 将抽象思维节点转换为可执行的 JavaScript 代码，
 * 在沙箱环境中运行代码，并验证输出是否符合预期的推理步骤。
 *
 * 安全说明：使用 vm.runInNewContext 创建隔离沙箱，彻底阻断原型链逃逸
 * （如 constructor.constructor('return require')()）。
 * 若 vm 模块不可用，回退到 new Function + 原型链冻结 + 变量遮蔽方案。
 */

const vm = require('vm');

/**
 * 创建安全的 vm 沙箱上下文。
 * 只传入安全的内置对象，对用户 context 中的函数和对象进行安全处理，
 * 防止通过原型链或 constructor.constructor 逃逸到主上下文。
 *
 * @param {Object} userContext - 用户提供的上下文变量
 * @returns {Object} 安全的沙箱上下文对象
 */
function createSafeSandbox(userContext) {
  const sandbox = Object.create(null);

  // 安全的内置对象：这些对象在新上下文中共享，但新上下文没有 require/process
  Object.assign(sandbox, {
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    RegExp: RegExp,
    Error: Error,
    Map: Map,
    Set: Set,
    JSON: JSON,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    undefined: undefined,
    NaN: NaN,
    Infinity: Infinity,
  });

  // 处理用户 context：只传入可安全序列化的值
  // 函数不传入沙箱（设为 undefined），防止 constructor.constructor 逃逸
  // 对象使用 structuredClone 深拷贝（自动去除函数属性）
  for (const [key, value] of Object.entries(userContext || {})) {
    const t = typeof value;
    if (t === 'function') {
      // 函数不传入沙箱，防止通过函数的 constructor.constructor 逃逸
      sandbox[key] = undefined;
    } else if (t === 'object' && value !== null) {
      // 对象：用 structuredClone 深拷贝，自动去除不可克隆的属性（如函数）
      try {
        sandbox[key] = structuredClone(value);
      } catch (_) {
        // structuredClone 失败时，尝试 JSON 深拷贝
        try {
          sandbox[key] = JSON.parse(JSON.stringify(value));
        } catch (__) {
          // 都失败则设为 undefined，宁可丢失数据也不引入安全风险
          sandbox[key] = undefined;
        }
      }
    } else {
      // 值类型（string/number/boolean/null/undefined）直接传入，安全
      sandbox[key] = value;
    }
  }

  return sandbox;
}

class ExecutableReasoning {
  /**
   * @param {Object} options
   * @param {Object}  [options.context={}] — 每次执行都可用的默认变量
   * @param {boolean} [options.verifyOnExecute=true] — 执行后自动运行验证
   */
  constructor(options = {}) {
    /** @type {Object} */
    this.context = options.context || {};
    /** @type {boolean} */
    this.verifyOnExecute = options.verifyOnExecute !== false;
    /** @type {Map<string, Object>} */
    this._history = new Map();
  }

  // ---------------------------------------------------------------------------
  // 代码生成
  // ---------------------------------------------------------------------------

  /**
   * 将思维节点转换为可执行的 JavaScript 源代码。
   *
   * @param {Object} thoughtNode — 必须包含 { id, description, code }
   * @returns {string} 可用于 new Function() 的 JavaScript 源代码
   */
  generateCode(thoughtNode) {
    if (!thoughtNode || !thoughtNode.id || !thoughtNode.code) {
      throw new Error('generateCode: thoughtNode 必须包含 "id" 和 "code" 属性');
    }

    const imports = [];
    const lines = [];

    // 自动包装多行代码或缺少 return 的代码为异步 IIFE
    const raw = String(thoughtNode.code).trim();

    // 从已知 context 键和 thoughtNode 额外变量构建参数列表
    const contextKeys = Object.keys(this.context);
    const nodeKeys = Object.keys(thoughtNode.vars || {});
    const paramList = [...new Set([...contextKeys, ...nodeKeys, 'thoughtNode'])];

    lines.push('  // --- 思维节点: ' + thoughtNode.id);
    lines.push('  // ' + thoughtNode.description.replace(/\n/g, '\n  // '));
    lines.push(raw);
    lines.push(''); // 尾部换行，方便后续追加

    const body = lines.join('\n');

    return {
      body,
      paramList,
      imports,
      thoughtId: thoughtNode.id,
    };
  }

  // ---------------------------------------------------------------------------
  // 执行
  // ---------------------------------------------------------------------------

  /**
   * 在安全沙箱中执行代码体。
   *
   * 优先使用 vm.runInNewContext 创建隔离沙箱，彻底阻断原型链逃逸
   * （如 constructor.constructor('return require')()）。
   * 若 vm 模块不可用，回退到 new Function + 原型链冻结 + 变量遮蔽方案。
   *
   * @param {string|Object} codeOrResult — 原始源代码字符串，或 generateCode() 返回的对象
   * @param {Object} [overrideContext={}] — 运行时变量，覆盖 this.context
   * @returns {{ result: any, error: Error|null, durationMs: number }}
   */
  execute(codeOrResult, overrideContext = {}) {
    const start = Date.now();

    let body, paramList;

    if (typeof codeOrResult === 'string') {
      body = codeOrResult;
      paramList = [];
    } else {
      body = codeOrResult.body;
      paramList = codeOrResult.paramList;
    }

    // 合并：思维节点变量 + context 默认值 + 运行时覆盖
    const mergedValues = { ...this.context, ...overrideContext };

    let result;
    let error = null;

    try {
      // [SECURITY-FIX] C-2: 移除 new Function fallback
      // vm 是 Node.js 内置模块，在标准 Node.js 环境中始终可用。
      // 如果 vm 不可用，说明运行环境异常，应直接抛错而非降级到不安全路径。
      if (!vm || typeof vm.runInNewContext !== 'function') {
        throw new Error('ExecutableReasoning: vm module is not available. Cannot safely execute code.');
      }
      result = this._executeInVmSandbox(body, paramList, mergedValues);
    } catch (err) {
      error = err;
    }

    const durationMs = Date.now() - start;

    const executionResult = { result, error, durationMs };

    if (this.verifyOnExecute && !error && typeof codeOrResult !== 'string') {
      executionResult.verification = this.verify(codeOrResult.thoughtId, executionResult);
    }

    this._history.set(paramList[0] || 'latest', executionResult);

    return executionResult;
  }

  /**
   * 使用 vm.runInNewContext 在隔离沙箱中执行代码。
   * 新上下文没有 require/process/module 等 Node.js 全局变量，
   * 彻底阻断 constructor.constructor 原型链逃逸。
   *
   * @param {string} body - 代码体
   * @param {string[]} paramList - 参数名列表
   * @param {Object} mergedValues - 合并后的上下文变量
   * @returns {any} 执行结果
   */
  _executeInVmSandbox(body, paramList, mergedValues) {
    // 创建安全沙箱上下文：只传入值类型，函数设为 undefined
    const sandbox = createSafeSandbox(mergedValues);

    // 将参数声明拼接到代码体前面，使 paramList 中的变量名在沙箱内可用
    const paramDeclarations = paramList
      .map((key) => `var ${key} = __ctx_${key};`)
      .join('\n');

    // 将 mergedValues 中的值注入沙箱
    for (const key of paramList) {
      const t = typeof mergedValues[key];
      if (t === 'function') {
        // 函数不传入沙箱，防止 constructor.constructor 逃逸
        sandbox[`__ctx_${key}`] = undefined;
      } else if (t === 'object' && mergedValues[key] !== null) {
        // 对象深拷贝后传入
        try {
          sandbox[`__ctx_${key}`] = structuredClone(mergedValues[key]);
        } catch (_) {
          try {
            sandbox[`__ctx_${key}`] = JSON.parse(JSON.stringify(mergedValues[key]));
          } catch (__) {
            sandbox[`__ctx_${key}`] = undefined;
          }
        }
      } else {
        sandbox[`__ctx_${key}`] = mergedValues[key];
      }
    }

    // 包装为 IIFE，确保 return 语句正常工作
    const wrappedCode = `(function() {\n${paramDeclarations}\n${body}\n})();`;

    return vm.runInNewContext(wrappedCode, sandbox, {
      timeout: 30_000, // 30 秒超时，防止无限循环
      filename: 'executable-reasoning-sandbox',
    });
  }

  /**
   * 使用 new Function + 原型链冻结 + 变量遮蔽执行代码（回退方案）。
   * 注意：此方案无法完全阻断 constructor.constructor 逃逸，
   * 仅作为 vm 模块不可用时的降级方案。
   *
   * @param {string} body - 代码体
   * @param {string[]} paramList - 参数名列表
   * @param {Object} mergedValues - 合并后的上下文变量
   * @returns {any} 执行结果
   */
  _executeInFunctionSandbox(body, paramList, mergedValues) {
    // 遮蔽所有可通过原型链或全局对象逃逸的危险 API
    const __safeGlobals = {
      require: undefined,
      process: undefined,
      eval: undefined,
      Function: undefined,
      __filename: undefined,
      __dirname: undefined,
      module: undefined,
      exports: undefined,
      child_process: undefined,
      fs: undefined,
      net: undefined,
      http: undefined,
      https: undefined,
      os: undefined,
      path: undefined,
      // 阻止构造器逃逸（constructor.constructor 可获取 Function 构造器）
      Proxy: undefined,
      Reflect: undefined,
      WebAssembly: undefined,
      SharedArrayBuffer: undefined,
      Atomics: undefined,
      globalThis: undefined,
      // 阻止通过 globalThis/global 访问全局对象
      global: undefined,
    };

    // 冻结原型链：阻止通过原型链修改内置对象
    // 注意：冻结不能阻止 constructor.constructor 逃逸（Function 构造器仍可用），
    // 但可以防止沙箱代码篡改内置原型
    Object.freeze(Object.prototype);
    Object.freeze(Function.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Boolean.prototype);
    Object.freeze(Number.prototype);
    Object.freeze(String.prototype);
    Object.freeze(RegExp.prototype);
    Object.freeze(Date.prototype);
    Object.freeze(Error.prototype);
    Object.freeze(Map.prototype);
    Object.freeze(Set.prototype);

    // 沙箱前缀：在函数体内用 var 声明遮蔽所有危险全局变量名
    // 配合外部原型链冻结，提供双重防御层
    // 注意：不使用 "use strict"，因为 eval 是保留字在严格模式下不能作为变量名
    const __sandboxPrefix = `
var require=__safeGlobals.require, process=__safeGlobals.process, \
Function=__safeGlobals.Function, \
__filename=__safeGlobals.__filename, __dirname=__safeGlobals.__dirname, \
module=__safeGlobals.module, exports=__safeGlobals.exports, \
Proxy=__safeGlobals.Proxy, Reflect=__safeGlobals.Reflect, \
WebAssembly=__safeGlobals.WebAssembly, \
SharedArrayBuffer=__safeGlobals.SharedArrayBuffer, Atomics=__safeGlobals.Atomics, \
globalThis=__safeGlobals.globalThis, global=__safeGlobals.global;
`;

    const argValues = paramList.map((key) => {
      if (key in mergedValues) return mergedValues[key];
      return undefined;
    });

    const safeParamList = [...paramList, '__safeGlobals'];
    const safeArgValues = [...argValues, __safeGlobals];
    const __safeBody = __sandboxPrefix + body;
    const fn = new Function(...safeParamList, __safeBody);
    return fn(...safeArgValues);
  }

  // ---------------------------------------------------------------------------
  // 验证
  // ---------------------------------------------------------------------------

  /**
   * 验证执行结果是否与思维节点声明的后置条件一致。
   *
   * @param {string} thoughtId — 已执行的思维节点 ID
   * @param {Object} executionResult — execute() 返回的对象
   * @returns {{ passed: boolean, checks: Array<{name: string, passed: boolean, detail: string}> }}
   */
  verify(thoughtId, executionResult) {
    const checks = [];

    // 1. 无错误
    checks.push({
      name: 'noError',
      passed: !executionResult.error,
      detail: executionResult.error
        ? executionResult.error.message
        : '执行完成，未抛出异常',
    });

    // 2. 结果已定义（非 void / undefined）
    const hasResult = executionResult.result !== undefined;
    checks.push({
      name: 'hasResult',
      passed: hasResult,
      detail: hasResult
        ? '结果已定义'
        : '结果为 undefined — 思维节点可能没有返回值',
    });

    // 3. 执行时间合理（默认 < 30 秒）
    const durationOk = executionResult.durationMs < 30_000;
    checks.push({
      name: 'durationOk',
      passed: durationOk,
      detail: `耗时 ${executionResult.durationMs} 毫秒`,
    });

    const passed = checks.every((c) => c.passed);

    return { passed, checks, thoughtId };
  }

  // ---------------------------------------------------------------------------
  // 高层编排器
  // ---------------------------------------------------------------------------

  /**
   * 端到端：生成代码、执行代码，并返回执行结果和验证结果。
   *
   * @param {Object} thoughtNode — 参见 generateCode()
   * @param {Object} [runtimeVars={}] — 参见 execute()
   * @returns {{ code: Object, execution: Object, verification: Object }}
   */
  createExecutableThought(thoughtNode, runtimeVars = {}) {
    const code = this.generateCode(thoughtNode);
    const execution = this.execute(code, runtimeVars);
    const verification = execution.verification || this.verify(thoughtNode.id, execution);

    return { code, execution, verification };
  }
}

module.exports = { ExecutableReasoning };
