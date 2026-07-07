/**
 * HeartFlow CodeValidator
 *
 * 代码验证和错误修复
 * - 从 LLM 输出中提取代码
 *
 * @author HeartFlow Team
 */

// ============================================================
// 代码验证器类
// ============================================================

class CodeValidator {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.hf - 心虫引擎引用
   */
  constructor({ hf } = {}) {
    this.hf = hf;
  }

  /**
   * 从 LLM 输出中提取代码
   * @param {string} text - LLM 输出文本
   * @returns {string} 提取的代码
   */
  extractCode(text) {
    // 尝试提取 ``` 包裹的代码块
    const codeBlockMatch = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 如果没有代码块，尝试找到明显的代码开始
    const lines = text.split('\n');
    const codeStart = lines.findIndex(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('function ') ||
             trimmed.startsWith('class ') ||
             trimmed.startsWith('def ') ||
             trimmed.startsWith('fn ') ||
             trimmed.startsWith('import ') ||
             trimmed.startsWith('package ') ||
             trimmed.startsWith('#!/');
    });

    if (codeStart !== -1) {
      return lines.slice(codeStart).join('\n');
    }

    // 返回原始文本
    return text.trim();
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = { CodeValidator };
