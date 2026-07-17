#!/usr/bin/env node
/**
 * HeartFlow 记忆读写工具 — 安装引擎后自动获得此能力
 *
 * 用法:
 *   node heartflow-memory-tool.js list        — 列出所有记忆（分三层）
 *   node heartflow-memory-tool.js search <词>  — 搜索记忆
 *   node heartflow-memory-tool.js export       — 导出所有记忆为压缩文本
 *   node heartflow-memory-tool.js stats        — 统计记忆大小/数量
 *   node heartflow-memory-tool.js prune        — 清理过期的 EPHEMERAL 记忆
 *   node heartflow-memory-tool.js write <key> <value> [tags...]
 *     — 手动写入一条 LEARNED 层记忆
 *   node heartflow-memory-tool.js forget <key>
 *     — 删除一条 LEARNED 层记忆
 *
 * 安装引擎后，每次对话的关键信息自动记录到 memory/ 目录下，
 * 下次对话可直接用此工具查询之前积累的所有记忆。
 */

const path = require('path');
const { HeartFlowMemory } = require('../src/memory/heartflow-memory.js');
const { atomicWrite } = require('../src/utils/atomic-write.js');

// 引擎 skill 根目录（脚本所在目录的上级）
const SKILL_ROOT = path.resolve(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`
HeartFlow 记忆读写工具 — 安装引擎后自动获得

用法:
  node heartflow-memory-tool.js list           列出所有记忆
  node heartflow-memory-tool.js search <词>    搜索记忆
  node heartflow-memory-tool.js export         导出为文本
  node heartflow-memory-tool.js stats          统计信息
  node heartflow-memory-tool.js prune          清理过期临时记忆
  node heartflow-memory-tool.js write <k> <v>  写入一条记忆
  node heartflow-memory-tool.js forget <k>     删除一条记忆
  node heartflow-memory-tool.js --help         显示此帮助
`);
    return;
  }

  const hfm = new HeartFlowMemory(SKILL_ROOT);

  switch (cmd) {
    case 'list':
      cmdList(hfm);
      break;
    case 'search':
      cmdSearch(hfm, args[1]);
      break;
    case 'export':
      await cmdExport(hfm);
      break;
    case 'stats':
      cmdStats(hfm);
      break;
    case 'prune':
      cmdPrune(hfm);
      break;
    case 'write':
      // 格式: write <key> <value> [tags...]
      if (args.length >= 4) {
        // 至少 key + value + 1 tag
        cmdWrite(hfm, args[1], args[2], args.slice(3));
      } else if (args.length === 3) {
        // key + value, 无 tags
        cmdWrite(hfm, args[1], args[2], []);
      } else {
        console.log('用法: node heartflow-memory-tool.js write <key> <value> [tags...]');
      }
      break;
    case 'forget':
      cmdForget(hfm, args[1]);
      break;
    default:
      console.log(`未知命令: ${cmd}，使用 --help 查看用法`);
  }
}

function cmdList(hfm) {
  const all = hfm.getAllMemory();

  console.log('═'.repeat(50));
  console.log('  CORE 层（永久身份记忆）');
  console.log('═'.repeat(50));
  if (all.core.length === 0) {
    console.log('  （空）');
  } else {
    for (const e of all.core) {
      console.log(`  [${e.key}]`);
      console.log(`    值: ${e.value}`);
      if (e.tags && e.tags.length) console.log(`    标签: ${e.tags.join(', ')}`);
      console.log();
    }
  }

  console.log('═'.repeat(50));
  console.log('  LEARNED 层（长期积累）');
  console.log('═'.repeat(50));
  if (all.learned.length === 0) {
    console.log('  （空 — 对话记录将在引擎判定后自动写入）');
  } else {
    for (const e of all.learned) {
      const ts = e.createdAt ? new Date(e.createdAt).toLocaleString('zh-CN') : '?';
      console.log(`  [${e.key}]`);
      console.log(`    值: ${e.value}`);
      console.log(`    创建: ${ts} | 访问: ${e.accessCount || 0} 次`);
      if (e.tags && e.tags.length) console.log(`    标签: ${e.tags.join(', ')}`);
      console.log();
    }
  }

  console.log('═'.repeat(50));
  console.log('  EPHEMERAL 层（临时上下文）');
  console.log('═'.repeat(50));
  if (all.ephemeral.length === 0) {
    console.log('  （空）');
  } else {
    for (const e of all.ephemeral) {
      console.log(`  [${e.key}]`);
      console.log(`    值: ${typeof e.value === 'object' ? JSON.stringify(e.value) : e.value}`);
      console.log();
    }
  }

  console.log(`总计: CORE ${all.stats.core} 条 | LEARNED ${all.stats.learned} 条 | EPHEMERAL ${all.stats.ephemeral} 条`);
  console.log(`文件总大小: ${(all.totalSize / 1024).toFixed(1)} KB`);
}

function cmdSearch(hfm, query) {
  if (!query) {
    console.log('请提供搜索词: node heartflow-memory-tool.js search <词>');
    return;
  }

  const results = hfm.search(query);
  if (results.length === 0) {
    console.log(`未找到包含"${query}"的记忆`);
    return;
  }

  console.log(`搜索"${query}" — 找到 ${results.length} 条:\n`);
  for (const r of results) {
    console.log(`  [${r.tier}] ${r.key}`);
    console.log(`    值: ${r.value}`);
    console.log();
  }
}

async function cmdExport(hfm) {
  const all = hfm.getAllMemory();
  const lines = [];

  // 终端输出安全警告
  console.log('');
  console.log('⚠️  安全警告：记忆导出包含 CORE 层永久身份数据，不要随意分享');
  console.log('    导出的文件包含你在对话中积累的所有身份规则、教训和上下文。');
  console.log('    请确保导出文件存储在安全位置，不要发送给不可信方。');
  console.log('');

  lines.push('# HeartFlow 记忆导出');
  lines.push('⚠️ 安全警告：此导出包含 CORE 层永久身份数据，不要随意分享');
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`总计: CORE ${all.stats.core} / LEARNED ${all.stats.learned} / EPHEMERAL ${all.stats.ephemeral}`);
  lines.push('');

  // [安全审计修复] CORE 层仅输出 key 和 tags，不输出具体 value（身份数据不外泄）
  if (all.core.length > 0) {
    lines.push('## CORE 层（永久身份记忆 — 仅显示元信息，值已脱敏）');
    for (const e of all.core) {
      const tagInfo = e.tags && e.tags.length ? ` [${e.tags.join(', ')}]` : '';
      lines.push(`- ${e.key}: [已脱敏]${tagInfo}`);
    }
    lines.push('');
  }

  if (all.learned.length > 0) {
    lines.push('## LEARNED 层（长期积累）');
    for (const e of all.learned) {
      const ts = e.createdAt ? new Date(e.createdAt).toLocaleString('zh-CN') : '?';
      lines.push(`- ${e.key} (${ts}, ${e.accessCount || 0}次): ${e.value}`);
    }
    lines.push('');
  }

  if (all.ephemeral.length > 0) {
    lines.push('## EPHEMERAL 层（临时上下文）');
    for (const e of all.ephemeral) {
      const val = typeof e.value === 'object' ? JSON.stringify(e.value) : e.value;
      lines.push(`- ${e.key}: ${val}`);
    }
    lines.push('');
  }

  const output = lines.join('\n');
  const exportPath = path.join(hfm.memDir, 'memory-export.txt');
  await atomicWrite(exportPath, output);
  console.log(`已导出到: ${exportPath}`);
  console.log(`共 ${lines.length} 行`);
}

function cmdStats(hfm) {
  const all = hfm.getAllMemory();
  console.log('HeartFlow 记忆统计:');
  console.log(`  CORE 层:     ${all.stats.core} 条`);
  console.log(`  LEARNED 层:  ${all.stats.learned} 条`);
  console.log(`  EPHEMERAL 层: ${all.stats.ephemeral} 条`);
  console.log(`  文件总大小:   ${(all.totalSize / 1024).toFixed(1)} KB`);
  console.log(`  记忆目录:    ${hfm.memDir}`);
}

function cmdPrune(hfm) {
  const before = Object.keys(hfm.ephemeral).length;
  hfm.consolidate(); // 将高频临时记忆提升到 LEARNED

  // 手动清理过期 ephemeral
  const now = Date.now();
  let removed = 0;
  for (const [key, v] of Object.entries(hfm.ephemeral)) {
    if (now - (v.createdAt || 0) > (v.ttl || 3600000)) {
      delete hfm.ephemeral[key];
      removed++;
    }
  }
  hfm._saveJson(hfm.ephemeralPath, hfm.ephemeral);

  console.log(`清理完成: EPHEMERAL 层从 ${before} 条变为 ${Object.keys(hfm.ephemeral).length} 条`);
  if (removed > 0) console.log(`已移除 ${removed} 条过期记忆`);
}

function cmdWrite(hfm, key, value, tags) {
  if (!key || !value) {
    console.log('用法: node heartflow-memory-tool.js write <key> <value> [tags...]');
    return;
  }

  // ── SkillSpector fix: 输入验证 ──
  if (!/^[a-zA-Z0-9_\-\u4e00-\u9fff]{1,128}$/.test(key)) {
    console.error('⚠️  安全拒绝: key 只允许字母、数字、下划线、连字符、中文，最长 128 字符');
    return;
  }
  if (value.length > 10240) {
    console.error('⚠️  安全拒绝: value 超过 10KB 上限');
    return;
  }
  // 禁止注入攻击
  const DANGEROUS_PATTERNS = [/__proto__/i, /constructor\s*\[/i, /prototype/i];
  for (const p of DANGEROUS_PATTERNS) {
    if (p.test(key) || p.test(value)) {
      console.error('⚠️  安全拒绝: key/value 包含危险模式');
      return;
    }
  }

  const tagsToUse = tags && tags.length > 0 ? tags : ['manual'];
  // 附加来源标签用于溯源
  const auditedTags = [...tagsToUse, 'source:cli', `ts:${Date.now()}`];
  const result = hfm.learn(key, value, auditedTags);
  if (result.success) {
    console.log(`已写入 LEARNED 层: [${key}] = ${value}`);
    console.log(`  来源标签: ${auditedTags.join(', ')}`);
  }
}

function cmdForget(hfm, key) {
  if (!key) {
    console.log('用法: node heartflow-memory-tool.js forget <key>');
    return;
  }

  // ── SkillSpector fix: 删除前验证 ──
  if (!/^[a-zA-Z0-9_\-\u4e00-\u9fff]{1,128}$/.test(key)) {
    console.error('⚠️  安全拒绝: key 格式非法');
    return;
  }

  // 检查是否存在
  const before = hfm.recall(key);
  if (!before) {
    console.log(`未找到: [${key}]`);
    return;
  }

  const result = hfm.forget(key);
  if (result.success) {
    console.log(`已删除: [${key}]`);
    console.log(`  审计: 删除操作已记录, key=${key}, ts=${Date.now()}`);
  } else {
    console.log(`未找到: [${key}]`);
  }
}

main();
