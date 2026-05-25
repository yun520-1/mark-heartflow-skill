/**
 * HeartFlow 断言库 - 常用验证函数集合
 * 用于：代码验证、技能文档验证、假设核查
 */

const assert = {
  // 是否为有效JSON
  isJSON(str) {
    try { JSON.parse(str); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
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

  // 数字在范围内
  inRange(n, min, max) {
    const ok = Number(n) >= min && Number(n) <= max;
    return { ok, error: ok ? null : `${n} 不在范围 [${min}, ${max}]` };
  },

  // 数组非空
  nonEmptyArray(arr, name = 'array') {
    return { ok: Array.isArray(arr) && arr.length > 0, error: `${name}不能为空` };
  },

  // 对象有关键字段
  hasKeys(obj, keys) {
    const missing = keys.filter(k => !obj.hasOwnProperty(k));
    const ok = missing.length === 0;
    return { ok, error: ok ? null : `缺少字段: ${missing.join(', ')}` };
  },

  // 执行所有断言，返回所有失败
  all(...checks) {
    const failures = checks.filter(c => !c.ok);
    return { ok: failures.length === 0, failures };
  },

  // 只要有一个通过
  any(...checks) {
    const passed = checks.filter(c => c.ok);
    return { ok: passed.length > 0, passed };
  }
};

module.exports = { assert };
