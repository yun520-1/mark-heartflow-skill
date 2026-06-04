/**
 * HeartFlow 断言库 - 常用验证函数集合
 * 用于：代码验证、技能文档验证、假设核查、类型检查、内容校验
 * v2.0.0 — 扩展：类型断言、URL/Email验证、深度比较、严重级别、Markdown检查
 */

const assert = {
  // ========== 类型断言 ==========

  // 是否为字符串
  isString(val, name = 'value') {
    const ok = typeof val === 'string';
    return { ok, error: ok ? null : `${name} 应为字符串, 实际为 ${typeof val}` };
  },

  // 是否为数字
  isNumber(val, name = 'value') {
    const ok = typeof val === 'number' && !Number.isNaN(val);
    return { ok, error: ok ? null : `${name} 应为数字, 实际为 ${typeof val}` };
  },

  // 是否为布尔值
  isBoolean(val, name = 'value') {
    const ok = typeof val === 'boolean';
    return { ok, error: ok ? null : `${name} 应为布尔值, 实际为 ${typeof val}` };
  },

  // 是否为对象 (非 null, 非数组)
  isObject(val, name = 'value') {
    const ok = val !== null && typeof val === 'object' && !Array.isArray(val);
    return { ok, error: ok ? null : `${name} 应为对象` };
  },

  // 是否为数组
  isArray(val, name = 'value') {
    const ok = Array.isArray(val);
    return { ok, error: ok ? null : `${name} 应为数组` };
  },

  // 是否为函数
  isFunction(val, name = 'value') {
    const ok = typeof val === 'function';
    return { ok, error: ok ? null : `${name} 应为函数` };
  },

  // 是否为整数
  isInteger(val, name = 'value') {
    const ok = Number.isInteger(val);
    return { ok, error: ok ? null : `${name} 应为整数, 实际为 ${val}` };
  },

  // 是否为正数
  isPositive(val, name = 'value') {
    const num = Number(val);
    const ok = !Number.isNaN(num) && num > 0;
    return { ok, error: ok ? null : `${name} 应为正数, 实际为 ${val}` };
  },

  // ========== 格式验证 ==========

  // 是否为有效JSON
  isJSON(str) {
    try { JSON.parse(str); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  },

  // URL 验证
  isURL(str, opts = {}) {
    if (typeof str !== 'string') return { ok: false, error: 'URL 应为字符串' };
    try {
      const url = new URL(str);
      const allowedProtocols = opts.allowedProtocols || ['http:', 'https:'];
      if (!allowedProtocols.includes(url.protocol)) {
        return { ok: false, error: `不允许的协议: ${url.protocol}` };
      }
      if (!url.hostname || url.hostname.length < 3) {
        return { ok: false, error: 'URL 缺少有效主机名' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: `URL 格式无效: ${e.message}` };
    }
  },

  // Email 验证
  isEmail(str) {
    if (typeof str !== 'string') return { ok: false, error: 'Email 应为字符串' };
    // RFC 5322 simplified pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    const ok = emailRegex.test(str);
    return { ok, error: ok ? null : `Email 格式无效: ${str}` };
  },

  // 字符串非空
  notEmpty(str, name = 'string') {
    const ok = !!(str && str.trim().length > 0);
    return { ok, error: ok ? null : `${name}不能为空` };
  },

  // 版本号格式 (x.y.z)
  version(str) {
    const ok = /^\d+\.\d+\.\d+$/.test(String(str).trim());
    return { ok, error: ok ? null : `版本号格式错误: ${str}` };
  },

  // 正则匹配验证
  matchesPattern(str, pattern, name = 'value') {
    if (typeof str !== 'string') return { ok: false, error: `${name} 应为字符串` };
    const ok = pattern.test(str);
    return { ok, error: ok ? null : `${name} 不符合格式要求: ${str}` };
  },

  // ========== 长度和范围 ==========

  // 最小长度
  minLength(val, min, name = 'value') {
    const len = typeof val === 'string' ? val.length : (Array.isArray(val) ? val.length : -1);
    if (len === -1) return { ok: false, error: `${name} 无法计算长度` };
    const ok = len >= min;
    return { ok, error: ok ? null : `${name} 长度 ${len} 小于最小值 ${min}` };
  },

  // 最大长度
  maxLength(val, max, name = 'value') {
    const len = typeof val === 'string' ? val.length : (Array.isArray(val) ? val.length : -1);
    if (len === -1) return { ok: false, error: `${name} 无法计算长度` };
    const ok = len <= max;
    return { ok, error: ok ? null : `${name} 长度 ${len} 超过最大值 ${max}` };
  },

  // 精确长度
  exactLength(val, exact, name = 'value') {
    const len = typeof val === 'string' ? val.length : (Array.isArray(val) ? val.length : -1);
    if (len === -1) return { ok: false, error: `${name} 无法计算长度` };
    const ok = len === exact;
    return { ok, error: ok ? null : `${name} 长度 ${len} 不等于 ${exact}` };
  },

  // 数字在范围内
  inRange(n, min, max) {
    const ok = Number(n) >= min && Number(n) <= max;
    return { ok, error: ok ? null : `${n} 不在范围 [${min}, ${max}]` };
  },

  // 数值比较
  gt(a, b, nameA = 'a', nameB = 'b') {
    return { ok: a > b, error: `${nameA}(${a}) 不大于 ${nameB}(${b})` };
  },

  gte(a, b, nameA = 'a', nameB = 'b') {
    return { ok: a >= b, error: `${nameA}(${a}) 小于 ${nameB}(${b})` };
  },

  lt(a, b, nameA = 'a', nameB = 'b') {
    return { ok: a < b, error: `${nameA}(${a}) 不小于 ${nameB}(${b})` };
  },

  lte(a, b, nameA = 'a', nameB = 'b') {
    return { ok: a <= b, error: `${nameA}(${a}) 大于 ${nameB}(${b})` };
  },

  // ========== 集合验证 ==========

  // 数组非空
  nonEmptyArray(arr, name = 'array') {
    return { ok: Array.isArray(arr) && arr.length > 0, error: `${name}不能为空` };
  },

  // 对象有关键字段
  hasKeys(obj, keys) {
    const missing = keys.filter(k => !Object.prototype.hasOwnProperty.call(obj, k));
    const ok = missing.length === 0;
    return { ok, error: ok ? null : `缺少字段: ${missing.join(', ')}` };
  },

  // 数组包含元素
  contains(arr, item, name = 'array') {
    if (!Array.isArray(arr)) return { ok: false, error: `${name} 不是数组` };
    const ok = arr.includes(item);
    return { ok, error: ok ? null : `${name} 不包含 ${item}` };
  },

  // 所有元素满足条件
  allMatch(arr, predicate, name = 'array') {
    if (!Array.isArray(arr)) return { ok: false, error: `${name} 不是数组` };
    const failing = arr.filter(item => !predicate(item));
    return { ok: failing.length === 0, error: `${failing.length} 个元素未通过检查` };
  },

  // 集合中不包含重复项
  unique(arr, name = 'array') {
    if (!Array.isArray(arr)) return { ok: false, error: `${name} 不是数组` };
    const dups = arr.filter((item, idx) => arr.indexOf(item) !== idx);
    return { ok: dups.length === 0, error: `包含重复项: ${[...new Set(dups)].slice(0, 5).join(', ')}` };
  },

  // ========== 深度比较 ==========

  // 深度相等
  deepEqual(a, b, path = '') {
    if (a === b) return { ok: true };
    if (a === null || b === null || typeof a !== typeof b) {
      return { ok: false, error: `${path || '值'} 类型不同: ${typeof a} vs ${typeof b}` };
    }
    if (typeof a !== 'object') {
      return { ok: false, error: `${path || '值'} 不等: ${JSON.stringify(a)} vs ${JSON.stringify(b)}` };
    }
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) {
        return { ok: false, error: `${path || '值'} 数组/对象类型不一致` };
      }
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) {
        return { ok: false, error: `${path || '对象'} 键数量不同: ${keysA.length} vs ${keysB.length}` };
      }
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) {
          return { ok: false, error: `${path}.${key} 在b中缺失` };
        }
        const result = this.deepEqual(a[key], b[key], path ? `${path}.${key}` : key);
        if (!result.ok) return result;
      }
    }
    return { ok: true };
  },

  // ========== 安全验证 ==========

  // 文件路径安全性 (禁止绝对路径外泄)
  safePath(path) {
    const bad = ['/etc/', '/usr/', '/home/', '~/.ssh/', '/root/', '/private/'];
    const ok = !bad.some(b => String(path).includes(b));
    return { ok, error: ok ? null : `路径不安全: ${path}` };
  },

  // 代码括号平衡检测
  balancedBrackets(code) {
    const open = (code.match(/\{/g) || []).length;
    const close = (code.match(/\}/g) || []).length;
    const ok = open === close;
    return { ok, error: ok ? null : `括号不匹配: 开${open} vs 闭${close}` };
  },

  // 检查是否有危险字符 (注入防护)
  noDangerousChars(str, name = 'input') {
    if (typeof str !== 'string') return { ok: false, error: `${name} 应为字符串` };
    const dangerous = /[<>"'`;()&|$]/g;
    const matches = str.match(dangerous);
    const ok = !matches;
    return { ok, error: ok ? null : `${name} 包含危险字符: ${[...new Set(matches)].join(' ')}` };
  },

  // ========== SKILL.md 验证 ==========

  // SKILL.md frontmatter 完整性
  skillFrontmatter(content) {
    const hasName = /^name:\s*.+$/m.test(content);
    const hasVersion = /^version:\s*v?[\d.]+$/m.test(content);
    const hasDesc = /^description:\s*.+$/m.test(content);
    if (!hasName) return { ok: false, error: '缺少 name 字段' };
    if (!hasVersion) return { ok: false, error: '缺少 version 字段' };
    if (!hasDesc) return { ok: false, error: '缺少 description 字段' };
    return { ok: true };
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
    return { ok: issues.length === 0, errors: issues };
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
    return { ok: issues.length === 0, errors: issues };
  },

  // ========== 组合与断言管理 ==========

  // 执行所有断言，返回所有失败
  all(...checks) {
    const failures = checks.filter(c => !c.ok);
    return { ok: failures.length === 0, failures };
  },

  // 只要有一个通过
  any(...checks) {
    const passed = checks.filter(c => c.ok);
    return { ok: passed.length > 0, passed };
  },

  // 带标签的分组断言
  group(label, ...checks) {
    const failures = checks.filter(c => !c.ok);
    return {
      ok: failures.length === 0,
      label,
      failures,
      summary: failures.length === 0
        ? `✅ [${label}] 全部通过`
        : `❌ [${label}] ${failures.length} 个失败`
    };
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
      return { ok: true, value: result };
    } catch (e) {
      return { ok: false, error: `Promise 未成功解析: ${e.message}` };
    }
  },

  // 断言 Promise 被拒绝
  async rejects(promise, timeoutMs = 5000) {
    try {
      await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('超时')), timeoutMs))
      ]);
      return { ok: false, error: 'Promise 应被拒绝但已解析' };
    } catch (e) {
      return { ok: true, error: e.message };
    }
  }
};

module.exports = { assert };
