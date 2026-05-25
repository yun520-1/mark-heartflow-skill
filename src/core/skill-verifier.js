/**
 * SKILL.md 验证器 - 验证技能文档的结构和内容正确性
 */
const { assert } = require('./assertions');

const skillVerifier = {
  // 完整验证
  verify(content) {
    const errors = [];

    // 1. Frontmatter 必填字段
    const fmCheck = assert.skillFrontmatter(content);
    if (!fmCheck.ok) errors.push(`[Frontmatter] ${fmCheck.error}`);

    // 2. name字段格式
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (!/^[a-z0-9-]+$/.test(name)) {
        errors.push(`[Frontmatter] name 应为小写字母、数字、连字符: "${name}"`);
      }
    }

    // 3. 版本号一致性
    const frontmatterVer = content.match(/^version:\s*v?([\d.]+)/m);
    const headerVer = content.match(/^#\s+.+?\s+v([\d.]+)/m);
    if (frontmatterVer && headerVer) {
      if (frontmatterVer[1] !== headerVer[1]) {
        errors.push(`[版本] frontmatter=${frontmatterVer[1]} vs 标题=${headerVer[1]}`);
      }
    }

    // 4. 必需章节
    const requiredSections = ['## 触发条件', '## 核心功能'];
    for (const s of requiredSections) {
      if (!content.includes(s)) {
        errors.push(`[结构] 缺少 ${s}`);
      }
    }

    // 5. 检查未核实的数字（需要标注置信度的）
    const bigNumbers = content.match(/\$[,\d]{4,}|\b[1-9]\d{5,}\b/g);
    if (bigNumbers) {
      const unverified = bigNumbers.filter(n => !content.includes('[high]') && !content.includes('[medium]'));
      if (unverified.length > 0) {
        errors.push(`[数据] 存在未标注置信度的大数字: ${unverified.slice(0,3).join(', ')}`);
      }
    }

    // 6. 检查禁止词（说明里包含"猜测/编造"等）
    const forbidden = ['这是猜测', '可能是', '大概', '应该大概', ' probably ', ' might ', ' maybe '];
    for (const w of forbidden) {
      if (content.includes(w)) {
        errors.push(`[表述] 包含不确定性词: "${w}"`);
      }
    }

    // 7. 禁止外部绝对路径
    const absPaths = content.match(/\/[a-z]+\/[a-z]+\/[^\s'"]+/gi) || [];
    const unsafePaths = absPaths.filter(p => !p.includes('/Users/apple/') && !p.includes('~'));
    if (unsafePaths.length > 0) {
      errors.push(`[路径] 包含外部绝对路径: ${unsafePaths.slice(0,2).join(', ')}`);
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings: errors.filter(e => e.includes('[数据]') || e.includes('[表述]'))
    };
  },

  // 快速检查（只验证Frontmatter）
  quickCheck(content) {
    return assert.skillFrontmatter(content);
  },

  // 验证版本号
  checkVersion(content) {
    const ver = content.match(/^version:\s*v?([\d.]+)/m);
    if (!ver) return { ok: false, error: '未找到版本号' };
    return assert.version(ver[1]);
  }
};

module.exports = { skillVerifier };
