/**
 * regex-safe.js — [AUDIT-FIX M-02] 正则安全工具
 * 检测 ReDoS 风险正则，限制用户输入长度
 */

/**
 * 检测正则是否含 ReDoS 风险模式
 * 规则：嵌套量词 + 交替组
 * @param {RegExp} regex
 * @returns {{ safe: boolean, risk: string|null }}
 */
function checkRegexSafe(regex) {
  const src = regex.source;
  
  // 嵌套量词：(a+)+, (a*)*, (a+)*, (a*)+
  if (/\([^)]*[+*][^)]*\)[+*]/.test(src)) {
    return { safe: false, risk: 'nested quantifiers (ReDoS)' };
  }
  
  // 交替重叠：(a|a)+, (ab|a)+
  if (/\([^)]*\|[^)]*\)[+*]/.test(src)) {
    const inner = src.match(/\(([^)]*)\)[+*]/g);
    if (inner) {
      for (const m of inner) {
        const parts = m.match(/\(([^)]*)\)/);
        if (parts && parts[1].includes('|')) {
          const alternatives = parts[1].split('|');
          // 简单检查：两个分支有公共前缀
          for (let i = 0; i < alternatives.length; i++) {
            for (let j = i + 1; j < alternatives.length; j++) {
              if (alternatives[i].startsWith(alternatives[j]) || alternatives[j].startsWith(alternatives[i])) {
                return { safe: false, risk: 'overlapping alternatives (ReDoS)' };
              }
            }
          }
        }
      }
    }
  }
  
  return { safe: true, risk: null };
}

/**
 * 安全的正则执行：限制输入长度
 * @param {RegExp} regex
 * @param {string} input
 * @param {number} [maxLength=10000]
 * @returns {RegExpMatchArray|null}
 */
function safeMatch(regex, input, maxLength = 10000) {
  if (!input || input.length > maxLength) return null;
  return input.match(regex);
}

/**
 * 安全的正则替换：限制输入长度
 */
function safeReplace(regex, replacement, input, maxLength = 10000) {
  if (!input || input.length > maxLength) return input || '';
  return input.replace(regex, replacement);
}

module.exports = { checkRegexSafe, safeMatch, safeReplace };
