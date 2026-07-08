// ═══════════════════════════════════════════════════════════════════════
// HeartFlow 版本号 — 唯一真相源 (Single Source of Truth)
//
// 修改版本号 ONLY 在这里。其他所有文件从此文件或运行时读取。
// ═══════════════════════════════════════════════════════════════════════

// 同步策略：
//   package.json  → 由 scripts/sync-version.js 在 publish 前同步
//   VERSION 文件  → 由 scripts/sync-version.js 同步
//   SKILL.md      → 动态读取或无需硬编码
//   README.md     → 动态读取或无需硬编码
//   CHANGELOG.md  → 历史记录，不需要同步

'use strict';

const fs = require('fs');
const path = require('path');

// 从 VERSION 文件读取版本号（唯一真相源）
let VERSION = '5.8.5';  // 兜底版本

try {
  const versionPath = path.join(__dirname, '..', '..', 'VERSION');
  const versionContent = fs.readFileSync(versionPath, 'utf-8');
  VERSION = versionContent.trim();
} catch (e) {
  console.warn('[version.js] 无法读取 VERSION 文件，使用兜底版本:', VERSION);
}

module.exports = { VERSION };
