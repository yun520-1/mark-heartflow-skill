/**
 * HeartFlow 断言库 - 常用验证函数集合
 * 用于：代码验证、技能文档验证、假设核查、类型检查、内容校验
 * v2.1.0 — 扩展：近似比较、异常断言、性能断言、Schema验证、断言计数、链式Expect API
 */

// 断言计数器（全局跟踪所有断言执行结果）
const _assertCounts = { total: 0, passed: 0, failed: 0, warnings: 0 };

/**
 * 内部：生成断言结果并更新计数器
 */
function _result(ok, error, extras = {}) {
  _assertCounts.total++;
  if (ok) _assertCounts.passed++;
  else if (extras.severity === 'warning') _assertCounts.warnings++;
  else _assertCounts.failed++;
  return { ok, error: ok ? null : error, ...extras };
}

/**
 * 内部：获取错误类型名称
 */
function _typeName(fn) {
  if (typeof fn === 'string') return fn;
  if (fn && fn.name) return fn.name;
  return 'Error';
}

const assert = {
  // ========== 类型断言 ==========

  // 是否为字符串
  isString(val, name = 'value') {
    const ok = typeof val === 'string';
    return _result(ok, `${name} 应为字符串, 实际为 ${typeof val}`);
  },

  // 是否为数字
  isNumber(val, name = 'value') {
    const ok = typeof val === 'number' && !Number.isNaN(val);
    return _result(ok, `${name} 应为数字, 实际为 ${typeof val}`);
  },

  // 是否为布尔值
  isBoolean(val, name = 'value') {
    const ok = typeof val === 'boolean';
    return _result(ok, `${name} 应为布尔值, 实际为 ${typeof val}`);
  },

  // 是否为对象 (非 null, 非数组)
  isObject(val, name = 'value') {
    const ok = val !== null && typeof val === 'object' && !Array.isArray(val);
    return _result(ok, `${name} 应为对象`);
  },

  // 是否为数组
  isArray(val, name = 'value') {
    const ok = Array.isArray(val);
    return _result(ok, `${name} 应为数组`);
  },

  // 是否为函数
  isFunction(val, name = 'value') {
    const ok = typeof val === 'function';
    return _result(ok, `${name} 应为函数`);
  },

  // 是否为整数
  isInteger(val, name = 'value') {
    const ok = Number.isInteger(val);
    return _result(ok, `${name} 应为整数, 实际为 ${val}`);
  },

  // 是否为正数
  isPositive(val, name = 'value') {
    const num = Number(val);
    const ok = !Number.isNaN(num) && num > 0;
    return _result(ok, `${name} 应为正数, 实际为 ${val}`);
  },

  // ========== 格式验证 ==========

  // 是否为有效JSON
  isJSON(str) {
    try { JSON.parse(str); return _result(true); }
    catch (e) { return _result(false, e.message); }
  },

  // URL 验证
  isURL(str, opts = {}) {
    if (typeof str !== 'string') return _result(false, 'URL 应为字符串');
    try {
      const url = new URL(str);
      const allowedProtocols = opts.allowedProtocols || ['http:', 'https:'];
      if (!allowedProtocols.includes(url.protocol)) {
        return _result(false, `不允许的协议: ${url.protocol}`);
      }
      if (!url.hostname || url.hostname.length < 3) {
        return _result(false, 'URL 缺少有效主机名');
      }
      return _result(true);
    } catch (e) {
      return _result(false, `URL 格式无效: ${e.message}`);
    }
  },

  // Email 验证
  isEmail(str) {
    if (typeof str !== 'string') return _result(false, 'Email 应为字符串');
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    const ok = emailRegex.test(str);
    return _result(ok, `Email 格式无效: ${str}`);
  },

  // 字符串非空
  notEmpty(str, name = 'string') {
    const ok = !!(str && str.trim().length > 0);
    return _result(ok, `${name}不能为空`);
  },

  // 版本号格式 (x.y.z)
  version(str) {
    const ok = /^\d+\.\d+\.\d+$/.test(String(str).trim());
    return _result(ok, `版本号格式错误: ${str}`);
  },

  // 正则匹配验证
  matchesPattern(str, pattern, name = 'value') {
    if (typeof str !== 'string') return _result(false, `${name} 应为字符串`);
    const ok = pattern.test(str);
    return _result(ok, `${name} 不符合格式要求: ${str}`);
  },

  // ========== 长度和范围 ==========

  // 最小长度
  minLength(val, min, name = 'value') {
    const len = typeof val === 'string' ? val.length : (Array.isArray(val) ? val.length : -1);
    if (len === -1) return _result(false, `${name} 无法计算长度`);
    const ok = len >= min;
    return _result(ok, `${name} 长度 ${len} 小于最小值 ${min}`);
  },

  // 最大长度
  maxLength(val, max, name = 'value') {
    const len = typeof val === 'string' ? val.length : (Array.isArray(val) ? val.length : -1);
    if (len === -1) return _result(false, `${name} 无法计算长度`);
    const ok = len <= max;
    return _result(ok, `${name} 长度 ${len} 超过最大值 ${max}`);
  },

  // 精确长度
  exactLength(val, exact, name = 'value') {
    const len = typeof val === 'string' ? val.length : (Array.isArray(val) ? val.length : -1);
    if (len === -1) return _result(false, `${name} 无法计算长度`);
    const ok = len === exact;
    return _result(ok, `${name} 长度 ${len} 不等于 ${exact}`);
  },

  // 数字在范围内
  inRange(n, min, max) {
    const ok = Number(n) >= min && Number(n) <= max;
    return _result(ok, `${n} 不在范围 [${min}, ${max}]`);
  },

  // 数值比较
  gt(a, b, nameA = 'a', nameB = 'b') {
    return _result(a > b, `${nameA}(${a}) 不大于 ${nameB}(${b})`);
  },

  gte(a, b, nameA = 'a', nameB = 'b') {
    return _result(a >= b, `${nameA}(${a}) 小于 ${nameB}(${b})`);
  },

  lt(a, b, nameA = 'a', nameB = 'b') {
    return _result(a < b, `${nameA}(${a}) 不小于 ${nameB}(${b})`);
  },

  lte(a, b, nameA = 'a', nameB = 'b') {
    return _result(a <= b, `${nameA}(${a}) 大于 ${nameB}(${b})`);
  },

  // ========== 集合验证 ==========

  // 数组非空
  nonEmptyArray(arr, name = 'array') {
    return _result(Array.isArray(arr) && arr.length > 0, `${name}不能为空`);
  },

  // 对象有关键字段
  hasKeys(obj, keys) {
    const missing = keys.filter(k => !Object.prototype.hasOwnProperty.call(obj, k));
    const ok = missing.length === 0;
    return _result(ok, `缺少字段: ${missing.join(', ')}`);
  },

  // 数组包含元素
  contains(arr, item, name = 'array') {
    if (!Array.isArray(arr)) return _result(false, `${name} 不是数组`);
    const ok = arr.includes(item);
    return _result(ok, `${name} 不包含 ${item}`);
  },

  // 所有元素满足条件
  allMatch(arr, predicate, name = 'array') {
    if (!Array.isArray(arr)) return _result(false, `${name} 不是数组`);
    const failing = arr.filter(item => !predicate(item));
    return _result(failing.length === 0, `${failing.length} 个元素未通过检查`);
  },

  // 集合中不包含重复项
  unique(arr, name = 'array') {
    if (!Array.isArray(arr)) return _result(false, `${name} 不是数组`);
    const dups = arr.filter((item, idx) => arr.indexOf(item) !== idx);
    return _result(dups.length === 0, `包含重复项: ${[...new Set(dups)].slice(0, 5).join(', ')}`);
  },

  // ========== 深度比较与近似比较 ==========

  // 深度相等
  deepEqual(a, b, path = '') {
    if (a === b) return _result(true);
    if (a === null || b === null || typeof a !== typeof b) {
      return _result(false, `${path || '值'} 类型不同: ${typeof a} vs ${typeof b}`);
    }
    if (typeof a !== 'object') {
      return _result(false, `${path || '值'} 不等: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
    }
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) {
        return _result(false, `${path || '值'} 数组/对象类型不一致`);
      }
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) {
        return _result(false, `${path || '对象'} 键数量不同: ${keysA.length} vs ${keysB.length}`);
      }
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
          return _result(false, `${path}.${key} 在b中缺失`);
        }
        const result = this.deepEqual(a[key], b[key], path ? `${path}.${key}` : key);
        if (!result.ok) return result;
      }
    }
    return _result(true);
  },

  /**
   * 近似相等比较（浮点数容差）
   * @param {number} actual - 实际值
   * @param {number} expected - 期望值
   * @param {number} [tolerance=0.001] - 容差范围
   * @param {string} [name] - 可选名称
   * @returns {{ok, error, actual, expected, tolerance, delta}}
   */
  approxEqual(actual, expected, tolerance = 0.001, name = 'value') {
    const delta = Math.abs(actual - expected);
    const ok = delta <= tolerance;
    return _result(ok, `${name} 近似不相等: ${actual} vs ${expected} (delta=${delta.toExponential(3)}, tol=${tolerance})`, { actual, expected, tolerance, delta });
  },

  /**
   * 对象深度近似比较（使用容差比较所有数值字段）
   * @param {object} actual - 实际对象
   * @param {object} expected - 期望对象
   * @param {number} [tolerance=0.001] - 数值容差
   * @param {string} [path=''] - 递归路径
   * @returns {{ok, error, failures: Array}}
   */
  deepApproxEqual(actual, expected, tolerance = 0.001, path = '') {
    if (actual === expected) return _result(true);
    if (typeof actual !== typeof expected || actual === null || expected === null) {
      return _result(false, `${path || '值'} 类型不同: ${typeof actual} vs ${typeof expected}`);
    }
    if (typeof actual === 'number' && typeof expected === 'number') {
      const delta = Math.abs(actual - expected);
      if (delta <= tolerance) return _result(true);
      return _result(false, `${path || '值'} 近似不相等: ${actual} vs ${expected} (delta=${delta.toExponential(3)})`, { actual, expected, delta });
    }
    if (typeof actual !== 'object') {
      return _result(actual === expected, `${path || '值'} 不等: ${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`);
    }
    if (Array.isArray(actual) !== Array.isArray(expected)) {
      return _result(false, `${path || '值'} 数组/对象类型不一致`);
    }
    const keysA = Object.keys(actual);
    const keysB = Object.keys(expected);
    if (keysA.length !== keysB.length) {
      return _result(false, `${path || '对象'} 键数量不同: ${keysA.length} vs ${keysB.length}`);
    }
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(expected, key)) {
        return _result(false, `${path}.${key} 在期望值中缺失`);
      }
      const result = this.deepApproxEqual(actual[key], expected[key], tolerance, path ? `${path}.${key}` : key);
      if (!result.ok) return result;
    }
    return _result(true);
  },

  // ========== 异常断言 ==========

  /**
   * 断言函数抛出指定类型的错误
   * @param {Function} fn - 要执行的函数
   * @param {Function|string} [expectedError] - 期望的错误类型或错误消息子串
   * @returns {{ok, error, thrown: Error|null}}
   */
  throws(fn, expectedError) {
    if (typeof fn !== 'function') {
      return _result(false, 'throws 的第一个参数必须是函数');
    }
    try {
      fn();
      return _result(false, '期望抛出异常但未抛出');
    } catch (e) {
      if (expectedError === undefined) {
        return _result(true, undefined, { thrown: e, message: e.message });
      }
      if (typeof expectedError === 'function' && expectedError.prototype instanceof Error) {
        const ok = e instanceof expectedError;
        return _result(ok, `期望抛出 ${_typeName(expectedError)} 但实际抛出 ${_typeName(e.constructor)}`, { thrown: e, expectedType: _typeName(expectedError) });
      }
      if (typeof expectedError === 'string') {
        const ok = e.message.includes(expectedError);
        return _result(ok, `期望错误消息包含 "${expectedError}" 但实际为 "${e.message}"`, { thrown: e, expectedSubstring: expectedError });
      }
      if (expectedError instanceof RegExp) {
        const ok = expectedError.test(e.message);
        return _result(ok, `期望错误消息匹配 ${expectedError} 但实际为 "${e.message}"`, { thrown: e, expectedPattern: expectedError.source });
      }
      return _result(true, undefined, { thrown: e });
    }
  },

  /**
   * 断言异步函数抛出指定类型的错误
   * @param {Function|Promise} asyncFn - 异步函数或 Promise
   * @param {Function|string} [expectedError] - 期望的错误类型或消息子串
   * @param {number} [timeoutMs=5000] - 超时时间
   * @returns {Promise<{ok, error, thrown: Error|null}>}
   */
  async throwsAsync(asyncFn, expectedError, timeoutMs = 5000) {
    let promise;
    if (asyncFn instanceof Promise) {
      promise = asyncFn;
    } else if (typeof asyncFn === 'function') {
      promise = asyncFn();
    } else {
      return _result(false, 'throwsAsync 的第一个参数必须是函数或 Promise');
    }
    try {
      await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('断言超时')), timeoutMs))
      ]);
      return _result(false, '期望抛出异常但未抛出');
    } catch (e) {
      if (e.message === '断言超时') {
        return _result(false, '异步函数在超时内未抛出异常');
      }
      if (expectedError === undefined) {
        return _result(true, undefined, { thrown: e, message: e.message });
      }
      if (typeof expectedError === 'function' && expectedError.prototype instanceof Error) {
        const ok = e instanceof expectedError;
        return _result(ok, `期望抛出 ${_typeName(expectedError)} 但实际抛出 ${_typeName(e.constructor)}`, { thrown: e, expectedType: _typeName(expectedError) });
      }
      if (typeof expectedError === 'string') {
        const ok = e.message.includes(expectedError);
        return _result(ok, `期望错误消息包含 "${expectedError}" 但实际为 "${e.message}"`, { thrown: e, expectedSubstring: expectedError });
      }
      return _result(true, undefined, { thrown: e });
    }
  },

  /**
   * 断言函数不抛出任何异常
   * @param {Function} fn - 要执行的函数
   * @returns {{ok, error, returned: *}}
   */
  doesNotThrow(fn) {
    if (typeof fn !== 'function') {
      return _result(false, 'doesNotThrow 的第一个参数必须是函数');
    }
    try {
      const result = fn();
      return _result(true, undefined, { returned: result });
    } catch (e) {
      return _result(false, `不应抛出异常但抛出了: ${e.message}`, { thrown: e });
    }
  },

  // ========== 性能/超时断言 ==========

  /**
   * 断言函数在指定时间内完成
   * @param {Function} fn - 要执行的函数
   * @param {number} maxMs - 最大毫秒数
   * @param {string} [name] - 可选名称
   * @returns {{ok, error, elapsedMs: number}}
   */
  completesIn(fn, maxMs, name = 'operation') {
    if (typeof fn !== 'function') {
      return _result(false, 'completesIn 的第一个参数必须是函数');
    }
    const start = Date.now();
    try {
      fn();
      const elapsed = Date.now() - start;
      const ok = elapsed <= maxMs;
      return _result(ok, `${name} 耗时 ${elapsed}ms, 超过限制 ${maxMs}ms`, { elapsedMs: elapsed, maxMs });
    } catch (e) {
      const elapsed = Date.now() - start;
      return _result(false, `${name} 执行异常: ${e.message}`, { elapsedMs: elapsed, error: e.message });
    }
  },

  /**
   * 断言异步函数在指定时间内完成
   * @param {Function|Promise} asyncFn - 异步函数或 Promise
   * @param {number} maxMs - 最大毫秒数
   * @param {string} [name] - 可选名称
   * @returns {Promise<{ok, error, elapsedMs: number}>}
   */
  async completesInAsync(asyncFn, maxMs, name = 'async operation') {
    let promise;
    if (asyncFn instanceof Promise) {
      promise = asyncFn;
    } else if (typeof asyncFn === 'function') {
      promise = asyncFn();
    } else {
      return _result(false, 'completesInAsync 的第一个参数必须是函数或 Promise');
    }
    const start = Date.now();
    try {
      const result = await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), maxMs))
      ]);
      const elapsed = Date.now() - start;
      return _result(true, undefined, { elapsedMs: elapsed, maxMs, value: result });
    } catch (e) {
      const elapsed = Date.now() - start;
      return _result(false, `${name} 超时或异常: ${e.message}`, { elapsedMs: elapsed, maxMs });
    }
  },

  // ========== Schema 验证 ==========

  /**
   * 验证对象是否符合 Schema 定义
   * Schema 格式: { fieldName: { type, required, min, max, pattern, validator, message } }
   * @param {object} obj - 待验证对象
   * @param {object} schema - Schema 定义
   * @returns {{ok, error, failures: Array}}
   */
  matchSchema(obj, schema) {
    if (!obj || typeof obj !== 'object') {
      return _result(false, '待验证值不是对象');
    }
    const failures = [];
    const fields = Object.keys(schema);

    for (const field of fields) {
      const rules = schema[field];
      const value = obj[field];
      const hasValue = Object.prototype.hasOwnProperty.call(obj, field);

      // required 检查
      if (rules.required && !hasValue) {
        failures.push({ field, rule: 'required', message: `缺少必填字段: ${field}` });
        continue;
      }
      if (!hasValue) continue;

      // type 检查
      if (rules.type) {
        let typeOk = false;
        const types = Array.isArray(rules.type) ? rules.type : [rules.type];
        for (const t of types) {
          if (t === 'array') typeOk = typeOk || Array.isArray(value);
          else if (t === 'object') typeOk = typeOk || (value !== null && typeof value === 'object' && !Array.isArray(value));
          else if (t === 'null') typeOk = typeOk || value === null;
          else typeOk = typeOk || typeof value === t;
        }
        if (!typeOk) {
          failures.push({ field, rule: 'type', message: `字段 ${field} 类型应为 ${types.join('|')}, 实际为 ${typeof value}` });
          continue;
        }
      }

      // min/max (字符串长度或数值)
      if (rules.min !== undefined) {
        const val = typeof value === 'string' ? value.length : Number(value);
        if (val < rules.min) {
          failures.push({ field, rule: 'min', message: `字段 ${field} 最小值 ${rules.min}, 实际 ${val}` });
        }
      }
      if (rules.max !== undefined) {
        const val = typeof value === 'string' ? value.length : Number(value);
        if (val > rules.max) {
          failures.push({ field, rule: 'max', message: `字段 ${field} 最大值 ${rules.max}, 实际 ${val}` });
        }
      }

      // pattern 检查（仅字符串）
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        failures.push({ field, rule: 'pattern', message: `字段 ${field} 不匹配格式: ${rules.pattern}` });
      }

      // 自定义 validator
      if (typeof rules.validator === 'function') {
        try {
          const valid = rules.validator(value, obj);
          if (!valid) {
            failures.push({ field, rule: 'validator', message: rules.message || `字段 ${field} 自定义验证失败` });
          }
        } catch (e) {
          failures.push({ field, rule: 'validator', message: `字段 ${field} 验证异常: ${e.message}` });
        }
      }
    }

    const ok = failures.length === 0;
    return _result(ok, `${failures.length} 个 Schema 验证失败`, { failures, schemaFields: fields.length });
  },

  // ========== 安全验证 ==========

  // 文件路径安全性 (禁止绝对路径外泄)
  safePath(path) {
    const bad = ['/etc/', '/usr/', '/home/', '~/.ssh/', '/root/', '/private/'];
    const ok = !bad.some(b => String(path).includes(b));
    return _result(ok, `路径不安全: ${path}`);
  },

  // 代码括号平衡检测
  balancedBrackets(code) {
    const open = (code.match(/\{/g) || []).length;
    const close = (code.match(/\}/g) || []).length;
    const ok = open === close;
    return _result(ok, `括号不匹配: 开${open} vs 闭${close}`);
  },

  // 检查是否有危险字符 (注入防护)
  noDangerousChars(str, name = 'input') {
    if (typeof str !== 'string') return _result(false, `${name} 应为字符串`);
    const dangerous = /[<>"'`;()&|$]/g;
    const matches = str.match(dangerous);
    const ok = !matches;
    return _result(ok, `${name} 包含危险字符: ${[...new Set(matches)].join(' ')}`);
  },

  // ========== SKILL.md 验证 ==========

  // SKILL.md frontmatter 完整性
  skillFrontmatter(content) {
    const hasName = /^name:\s*.+$/m.test(content);
    const hasVersion = /^version:\s*v?[\d.]+$/m.test(content);
    const hasDesc = /^description:\s*.+$/m.test(content);
    if (!hasName) return _result(false, '缺少 name 字段');
    if (!hasVersion) return _result(false, '缺少 version 字段');
    if (!hasDesc) return _result(false, '缺少 description 字段');
    return _result(true);
  },

  // Markdown 标题层级检查 (禁止跳级)
  mdHeadersOrder(content) {
    const lines = content.split('\n');
    const issues = [];
    let lastLevel = 0;
    lines.forEach((line, i) => {
      const m = line.match(/^(#{1,6})\s/);
      if (m) {
        const level = m[1].length;
        if (level > lastLevel + 1 && lastLevel > 0) {
          issues.push(`行 ${i + 1}: 标题跳级 (h${lastLevel} → h${level})`);
        }
        lastLevel = level;
      }
    });
    return _result(issues.length === 0, issues.join('; '), { errors: issues });
  },

  // Markdown 链接检查 (格式有效性)
  mdLinksValid(content) {
    const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g;
    const issues = [];
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [full, text, url] = match;
      if (!text.trim()) {
        issues.push(`空链接文本: ${full}`);
      }
      if (!url || url.trim() === '') {
        issues.push(`空链接目标: ${full}`);
      }
    }
    return _result(issues.length === 0, issues.join('; '), { errors: issues });
  },

  // ========== 组合与断言管理 ==========

  // 执行所有断言，返回所有失败
  all(...checks) {
    const failures = checks.filter(c => !c.ok);
    return _result(failures.length === 0, '', { failures, totalChecks: checks.length });
  },

  // 只要有一个通过
  any(...checks) {
    const passed = checks.filter(c => c.ok);
    return _result(passed.length > 0, '', { passed, totalChecks: checks.length });
  },

  // 带标签的分组断言
  group(label, ...checks) {
    const failures = checks.filter(c => !c.ok);
    return _result(failures.length === 0, '', {
      label,
      failures,
      summary: failures.length === 0
        ? `✅ [${label}] 全部通过`
        : `❌ [${label}] ${failures.length} 个失败`,
      totalChecks: checks.length
    });
  },

  // 带严重级别的断言 (warning 级别不导致整体失败)
  withWarning(check, warningMessage) {
    if (!check.ok) {
      return { ...check, severity: 'warning', warning: warningMessage || check.error };
    }
    return { ...check, severity: 'ok' };
  },

  // ========== 异步断言 ==========

  // 断言 Promise 成功解析
  async resolves(promise, timeoutMs = 5000) {
    try {
      const result = await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), timeoutMs))
      ]);
      return _result(true, undefined, { value: result });
    } catch (e) {
      return _result(false, `Promise 未成功解析: ${e.message}`);
    }
  },

  // 断言 Promise 被拒绝
  async rejects(promise, timeoutMs = 5000) {
    try {
      await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), timeoutMs))
      ]);
      return _result(false, 'Promise 应被拒绝但已解析');
    } catch (e) {
      return _result(true, undefined, { error: e.message });
    }
  },

  // ========== 链式 Expect API ==========

  /**
   * 创建链式断言 Expect 对象
   * 用法: assert.expect(actual).toBe(expected)
   *        .not.toBe(bad)
   *        .toEqual({ a: 1 })
   *        .toBeGreaterThan(0)
   *        .toBeType('string')
   *        .toMatch(/pattern/)
   *        .toBeTruthy()
   */
  expect(actual) {
    const self = this;
    let invert = false;
    const chain = {
      get not() { invert = true; return chain; },

      toBe(expected) {
        const result = self.deepEqual(actual, expected);
        if (invert) return _result(!result.ok, `期望不等于 ${JSON.stringify(expected)}`);
        return _result(result.ok, `期望等于 ${JSON.stringify(expected)} 但实际为 ${JSON.stringify(actual)}`);
      },

      toEqual(expected) {
        return this.toBe(expected);
      },

      toBeGreaterThan(n) {
        const ok = typeof actual === 'number' && actual > n;
        if (invert) return _result(!ok, `期望不大于 ${n}`);
        return _result(ok, `期望大于 ${n} 但实际为 ${actual}`);
      },

      toBeLessThan(n) {
        const ok = typeof actual === 'number' && actual < n;
        if (invert) return _result(!ok, `期望不小于 ${n}`);
        return _result(ok, `期望小于 ${n} 但实际为 ${actual}`);
      },

      toBeGreaterThanOrEqual(n) {
        const ok = typeof actual === 'number' && actual >= n;
        if (invert) return _result(!ok, `期望小于 ${n}`);
        return _result(ok, `期望 >= ${n} 但实际为 ${actual}`);
      },

      toBeLessThanOrEqual(n) {
        const ok = typeof actual === 'number' && actual <= n;
        if (invert) return _result(!ok, `期望大于 ${n}`);
        return _result(ok, `期望 <= ${n} 但实际为 ${actual}`);
      },

      toBeTruthy() {
        const ok = !!actual;
        if (invert) return _result(!ok, '期望为 falsy');
        return _result(ok, '期望为 truthy');
      },

      toBeFalsy() {
        const ok = !actual;
        if (invert) return _result(!ok, '期望为 truthy');
        return _result(ok, '期望为 falsy');
      },

      toBeNull() {
        const ok = actual === null;
        if (invert) return _result(!ok, '期望不为 null');
        return _result(ok, `期望为 null 但实际为 ${typeof actual}`);
      },

      toBeUndefined() {
        const ok = actual === undefined;
        if (invert) return _result(!ok, '期望不为 undefined');
        return _result(ok, `期望为 undefined 但实际为 ${typeof actual}`);
      },

      toBeDefined() {
        const ok = actual !== undefined;
        if (invert) return _result(!ok, '期望为 undefined');
        return _result(ok, '期望被定义但实际为 undefined');
      },

      toBeNaN() {
        const ok = typeof actual === 'number' && Number.isNaN(actual);
        if (invert) return _result(!ok, '期望不是 NaN');
        return _result(ok, `期望为 NaN 但实际为 ${actual}`);
      },

      toBeType(type) {
        let ok = false;
        if (type === 'array') ok = Array.isArray(actual);
        else ok = typeof actual === type;
        if (invert) return _result(!ok, `期望类型不为 ${type}`);
        return _result(ok, `期望类型为 ${type} 但实际为 ${typeof actual}`);
      },

      toBeInstanceOf(cls) {
        const ok = actual instanceof cls;
        if (invert) return _result(!ok, `期望不是 ${cls.name} 的实例`);
        return _result(ok, `期望是 ${cls.name} 的实例但实际不是`);
      },

      toContain(item) {
        const ok = Array.isArray(actual) ? actual.includes(item) : (typeof actual === 'string' ? actual.includes(item) : false);
        if (invert) return _result(!ok, `期望不包含 ${item}`);
        return _result(ok, `期望包含 ${item}`);
      },

      toMatch(pattern) {
        const str = String(actual);
        const ok = pattern instanceof RegExp ? pattern.test(str) : str.includes(String(pattern));
        if (invert) return _result(!ok, `期望不匹配 ${pattern}`);
        return _result(ok, `期望匹配 ${pattern} 但实际为 "${str}"`);
      },

      toHaveLength(len) {
        const length = actual?.length;
        const ok = length === len;
        if (invert) return _result(!ok, `期望长度不为 ${len}`);
        return _result(ok, `期望长度为 ${len} 但实际为 ${length}`);
      },

      toHaveProperty(key, value) {
        if (!actual || typeof actual !== 'object') {
          return _result(false, '期望值不是对象');
        }
        const has = Object.prototype.hasOwnProperty.call(actual, key);
        if (value !== undefined) {
          const ok = has && actual[key] === value;
          if (invert) return _result(!ok, `期望属性 ${key} 的值不等于 ${value}`);
          return _result(ok, `期望属性 ${key}=${value} 但实际 ${has ? actual[key] : '缺失'}`);
        }
        if (invert) return _result(!has, `期望不包含属性 ${key}`);
        return _result(has, `期望包含属性 ${key}`);
      },

      toBeApproxEqual(expected, tolerance = 0.001) {
        const result = self.approxEqual(actual, expected, tolerance);
        if (invert) return _result(!result.ok, `期望不近似等于 ${expected}`);
        return result;
      },

      toSatisfy(predicate) {
        const ok = typeof predicate === 'function' ? predicate(actual) : false;
        if (invert) return _result(!ok, '期望不满足条件');
        return _result(ok, '期望满足条件但未通过');
      }
    };
    return chain;
  },

  // ========== 断言统计与报告 ==========

  /**
   * 重置断言计数器
   */
  resetCounts() {
    _assertCounts.total = 0;
    _assertCounts.passed = 0;
    _assertCounts.failed = 0;
    _assertCounts.warnings = 0;
  },

  /**
   * 获取断言统计报告
   * @returns {{ total, passed, failed, warnings, passRate: string }}
   */
  getReport() {
    const rate = _assertCounts.total > 0
      ? `${Math.round((_assertCounts.passed / _assertCounts.total) * 100)}%`
      : '0%';
    return {
      ..._assertCounts,
      passRate: rate,
      summary: `总计 ${_assertCounts.total} 断言: ${_assertCounts.passed} 通过, ${_assertCounts.failed} 失败, ${_assertCounts.warnings} 警告 (通过率 ${rate})`
    };
  }
};

module.exports = { assert };
