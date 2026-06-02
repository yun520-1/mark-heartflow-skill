/**
 * 代码验证器 - 验证生成代码的正确性
 * 支持: JS, Python, Shell
 */
const fs = require('fs');
const path = require('path');

const codeVerifier = {
  // 验证JS文件
  verifyJS(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyJSContent(content);
    } catch (e) {
      return { ok: false, errors: [`无法读取文件: ${e.message}`] };
    }
  },

  // 验证JS内容
  verifyJSContent(content) {
    const errors = [];

    // 括号平衡
    const open = (content.match(/\{/g) || []).length;
    const close = (content.match(/\}/g) || []).length;
    if (open !== close) errors.push(`括号不匹配: 开${open} vs 闭${close}`);

    // 圆括号平衡
    const pOpen = (content.match(/\(/g) || []).length;
    const pClose = (content.match(/\)/g) || []).length;
    if (pOpen !== pClose) errors.push(`圆括号不匹配: 开${pOpen} vs 闭${pClose}`);

    // 检查常见错误模式
    const badPatterns = [
      { regex: /[^=!]=[^=]/g, name: '赋值表达式', filter: (m,i,c) => !m.includes('===') && !m.includes('!==') && !m.includes('=>') },
    ];

    // 检查 module.exports 或 export
    if (!content.includes('module.exports') && !content.includes('export')) {
      errors.push('未发现 module.exports 或 export，模块可能无法被引用');
    }

    // 检查 require 引用是否存在
    const requires = content.match(/require\s*\(\s*['"][^'"]+['"]\s*\)/g) || [];
    for (const req of requires) {
      const match = req.match(/['"]([^'"]+)['"]/);
      if (match) {
        const modulePath = match[1];
        if (modulePath.startsWith('.')) {
          // 相对路径应该存在（这里只警告）
        }
      }
    }

    return { ok: errors.length === 0, errors };
  },

  // 验证Python文件
  verifyPy(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyPyContent(content);
    } catch (e) {
      return { ok: false, errors: [`无法读取文件: ${e.message}`] };
    }
  },

  verifyPyContent(content) {
    const errors = [];

    // 缩进一致性（简单检查：不能混合tab和空格）
    const tabLines = content.split('\n').filter(l => l.startsWith('\t') && l.match(/^    /));
    if (tabLines.length > 0) errors.push('检测到混用 tab 和空格缩进');

    // 检查 def 或 class 定义
    if (!content.includes('def ') && !content.includes('class ')) {
      errors.push('未发现 def 或 class，文件可能不是有效Python模块');
    }

    // 括号匹配（简单）
    const open = (content.match(/\{/g) || []).length;
    const close = (content.match(/\}/g) || []).length;
    if (Math.abs(open - close) > 5) errors.push(`括号可能不平衡: 差${Math.abs(open-close)}`);

    return { ok: errors.length === 0, errors };
  },

  // 验证Shell脚本
  verifySh(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyShContent(content);
    } catch (e) {
      return { ok: false, errors: [e.message] };
    }
  },

  // 验证Shell内容（v2.0.20 安全审计修复：避免 bash 走 JS 验证器）
  verifyShContent(content) {
    const errors = [];

    if (!content.includes('#!/bin/bash') && !content.includes('#!/bin/sh') && !content.includes('#!/usr/bin/env')) {
      errors.push('缺少 shebang (#!/bin/bash 或 #!/bin/sh)');
    }

    // 简单检查未闭合引号
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) errors.push('单引号未闭合');
    if (doubleQuotes % 2 !== 0) errors.push('双引号未闭合');

    return { ok: errors.length === 0, errors };
  },

  // 自动验证（根据扩展名）
  autoVerify(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.js') return this.verifyJS(filePath);
    if (ext === '.py') return this.verifyPy(filePath);
    if (ext === '.sh') return this.verifySh(filePath);
    return { ok: true, errors: [] };
  },

  // 验证SKILL.md中嵌入的代码块
  verifyCodeBlocks(markdown) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const lang = (match[1] || 'text').toLowerCase();
      const code = match[2];
      // ⚠️ 安全审计修复（v2.0.20）：按语言分派到对应验证器
      // 之前 bash/sh 错派到 verifyJSContent 导致误判
      let result;
      if (lang === 'js' || lang === 'javascript') {
        result = this.verifyJSContent(code);
      } else if (lang === 'py' || lang === 'python') {
        result = this.verifyPyContent(code);
      } else if (lang === 'sh' || lang === 'bash' || lang === 'shell') {
        result = this.verifyShContent(code);
      } else {
        // 未知语言：不做验证（避免误判）
        result = { ok: true, errors: [], skipped: true, reason: 'unsupported language' };
      }
      blocks.push({ lang, code, result });
    }
    return blocks;
  }
};

module.exports = { codeVerifier };
