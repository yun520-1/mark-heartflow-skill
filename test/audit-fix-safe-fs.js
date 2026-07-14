#!/usr/bin/env node
/**
 * 批量替换裸 fs 为 safe-fs
 * 策略：只处理 src/ 下的 .js 文件，排除 src/utils/safe-fs.js 自身
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function getRelativeSafeFs(filePath) {
  const dir = path.dirname(filePath);
  // 计算从文件目录到 src/utils/ 的相对路径
  const relFromSrc = path.relative(SRC, dir);
  const parts = relFromSrc.split(path.sep).filter(Boolean);
  const depth = parts.length; // 例如 src/core/ 的 depth = 1
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return prefix + 'utils/safe-fs';
}

let total = 0;
let changed = 0;

function processFile(filePath) {
  total++;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // 跳过 safe-fs.js 自身
    if (path.basename(filePath) === 'safe-fs.js') return;

    // 检查是否有裸 fs 调用
    if (!/fs\.(writeFileSync|appendFileSync|readFileSync|mkdirSync|existsSync|readdirSync|copyFileSync|unlinkSync|renameSync|chmodSync|statSync)/.test(content)) {
      return; // 无裸 fs 调用，跳过
    }

    // 1. 替换 require('fs') 为 safe-fs
    // 只替换 require('fs') 和 require("fs")，不替换其他 require
    content = content.replace(
      /require\(['"]fs['"]\)/g,
      `require('${getRelativeSafeFs(filePath)}')`
    );

    // 2. 确保 fs 变量名保持不变（safe-fs 导出完整兼容 API）

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      changed++;
      console.log(`✓ ${path.relative(ROOT, filePath)} (${getRelativeSafeFs(filePath)})`);
    }
  } catch (e) {
    console.error(`✗ ${path.relative(ROOT, filePath)}: ${e.message}`);
  }
}

// 递归处理所有 .js 文件
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      processFile(full);
    }
  }
}

console.log('=== 批量替换裸 fs → safe-fs ===\n');
walk(SRC);
console.log(`\n完成: 扫描 ${total} 个文件, 修改 ${changed} 个文件`);
