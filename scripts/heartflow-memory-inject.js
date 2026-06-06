#!/usr/bin/env node
/**
 * HeartFlow 记忆注入器 — 自动将心虫记忆注入 Hermes 系统提示
 *
 * 用法：
 *   在 AGENTS.md / CLAUDE.md 或 Hermes config 中引用此脚本的输出
 *
 * 输出格式：纯文本，可直接追加到系统提示中
 *
 * 功能：
 *   1. 自动读取 memory/ 目录下的 CORE + LEARNED 记忆
 *   2. 只输出最近 30 天内访问过的记忆（排除过期内容）
 *   3. 输出格式标准化，适合嵌入系统提示
 *   4. 注入后自动更新 lastAccessed 时间戳
 */

const path = require('path');
const { HeartFlowMemory } = require('../src/memory/heartflow-memory.js');

const SKILL_ROOT = path.resolve(__dirname, '..');

function main() {
  const hfm = new HeartFlowMemory(SKILL_ROOT);
  const lines = [];
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  lines.push('');  // 空行分隔
  lines.push('═══════════════════════════════════');
  lines.push('  心虫记忆注入 — HeartFlowMemory');
  lines.push('═══════════════════════════════════');

  // ─── CORE 层（全部注入）──────────────
  const coreEntries = hfm.listCore();

  // 区分身份记忆和技术教训
  const identityCores = coreEntries.filter(e => e.key?.startsWith('identity.') || e.key?.startsWith('philosophy.'));
  const lessonCores = coreEntries.filter(e => e.tags?.includes('lesson') || e.tags?.includes('user_correction'));
  const prefCores = coreEntries.filter(e => e.tags?.includes('user_preference'));
  const otherCores = coreEntries.filter(e =>
    !e.key?.startsWith('identity.') && !e.key?.startsWith('philosophy.') &&
    !e.tags?.includes('lesson') && !e.tags?.includes('user_correction') && !e.tags?.includes('user_preference')
  );

  if (identityCores.length > 0) {
    lines.push('');
    lines.push('【身份记忆】');
    for (const e of identityCores) {
      lines.push(`  • ${e.value}`);
    }
  }

  if (lessonCores.length > 0) {
    lines.push('');
    lines.push('【核心教训（CORE）】');
    for (const e of lessonCores) {
      lines.push(`  • ${e.value}`);
    }
  }

  // ─── LEARNED 层（仅最近30天有访问的）───────────
  const learnedEntries = Object.entries(hfm.learned)
    .map(([k, v]) => ({ key: k, ...v }))
    .filter(e => (e.lastAccessed || 0) >= thirtyDaysAgo)
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  // 按标签分组
  const conversations = learnedEntries.filter(e => e.tags?.includes('conversation'));
  const lessons = learnedEntries.filter(e => e.tags?.includes('lesson'));
  const preferences = learnedEntries.filter(e => e.tags?.includes('preference'));
  const pains = learnedEntries.filter(e => e.tags?.includes('pain'));
  const techOps = learnedEntries.filter(e => e.tags?.includes('tech'));
  const dreams = learnedEntries.filter(e => e.tags?.includes('dream'));
  const other = learnedEntries.filter(e =>
    !e.tags?.some(t => ['conversation','lesson','preference','pain','tech','dream'].includes(t))
  );

  if (lessons.length > 0) {
    lines.push('');
    lines.push('【记住的教训】');
    for (const e of lessons.slice(0, 10)) {
      lines.push(`  • ${e.value}`);
    }
  }

  if (preferences.length > 0) {
    lines.push('');
    lines.push('【用户偏好】');
    for (const e of preferences) {
      lines.push(`  • ${e.value}`);
    }
  }

  if (pains.length > 0) {
    lines.push('');
    lines.push('【情绪信号】');
    for (const e of pains.slice(0, 5)) {
      lines.push(`  • ${e.value}`);
    }
  }

  if (techOps.length > 0) {
    lines.push('');
    lines.push('【技术操作记录】');
    for (const e of techOps.slice(0, 10)) {
      const ts = e.lastAccessed ? new Date(e.lastAccessed).toLocaleDateString('zh-CN') : '?';
      lines.push(`  • (${ts}) ${e.value}`);
    }
  }

  if (conversations.length > 0) {
    lines.push('');
    lines.push('【最近对话】');
    for (const e of conversations.slice(0, 10)) {
      const ts = e.lastAccessed ? new Date(e.lastAccessed).toLocaleDateString('zh-CN') : '?';
      lines.push(`  • (${ts}) ${e.value}`);
    }
  }

  if (dreams.length > 0) {
    lines.push('');
    lines.push('【梦境记录】');
    for (const e of dreams.slice(0, 5)) {
      lines.push(`  • ${e.value}`);
    }
  }

  if (other.length > 0) {
    lines.push('');
    lines.push('【其他记忆】');
    for (const e of other.slice(0, 5)) {
      lines.push(`  • ${e.value}`);
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════');
  lines.push('');

  const output = lines.join('\n');

  // 输出到 stdout（供 AGENTS.md / Hermes 引用）
  process.stdout.write(output);

  // 同时保存到文件，供其他方式引用
  const injectPath = path.join(hfm.memDir, 'memory-inject.txt');
  require('fs').writeFileSync(injectPath, output, 'utf8');
}

main();
