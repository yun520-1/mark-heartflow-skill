/**
 * Safe RegExp utility — escapes user input before creating dynamic regex
 * Prevents ReDoS and regex injection attacks.
 *
 * Usage:
 *   const { escapeRegExp } = require('../utils/safe-regex.js');
 *   const re = new RegExp(escapeRegExp(userInput), 'gi');
 *
 * Escapes these special characters: . * + ? ^ $ { } ( ) [ ] \ |
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 检测正则是否含 ReDoS 风险模式
 * 来源: archive v5.18.0 regex-safe.js
 * 规则：嵌套量词 + 交替重叠组
 * @param {RegExp} regex
 * @returns {{ safe: boolean, risk: string|null }}
 */
function checkRegexSafe(regex) {
  const src = regex.source;
  if (/\([^)]*[+*][^)]*\)[+*]/.test(src)) {
    return { safe: false, risk: 'nested quantifiers (ReDoS)' };
  }
  if (/\([^)]*\|[^)]*\)[+*]/.test(src)) {
    const inner = src.match(/\(([^)]*)\)[+*]/g);
    if (inner) {
      for (const m of inner) {
        const parts = m.match(/\(([^)]*)\)/);
        if (parts && parts[1].includes('|')) {
          const alternatives = parts[1].split('|');
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
 */
function safeMatch(regex, input, maxLength = 10000) {
  if (!input || input.length > maxLength) return null;
  return input.match(regex);
}

module.exports = { escapeRegExp, checkRegexSafe, safeMatch };
