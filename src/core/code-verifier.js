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
      const errors = [];
      if (!content.includes('#!/bin/bash') && !content.includes('#!/bin/sh')) {
        errors.push('缺少 shebang (#!/bin/bash)');
      }
      return { ok: errors.length === 0, errors };
    } catch (e) {
      return { ok: false, errors: [e.message] };
    }
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
      const lang = match[1] || 'text';
      const code = match[2];
      if (['js', 'javascript', 'python', 'py', 'sh', 'bash', 'shell'].includes(lang.toLowerCase())) {
        const result = lang.startsWith('py') ? this.verifyPyContent(code) : this.verifyJSContent(code);
        blocks.push({ lang, code, result });
      }
    }
    return blocks;
  }
};

module.exports = { codeVerifier };
