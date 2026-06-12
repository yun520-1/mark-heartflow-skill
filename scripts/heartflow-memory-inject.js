#!/usr/bin/env node
/**
 * HeartFlow 记忆注入器 — 自动将引擎记忆注入 Hermes 系统提示
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
  // ─── CORE 层（全部注入）──────────────
  const coreEntries = hfm.listCore();

  // 只注入教训和偏好，不注入身份
  const lessonCores = coreEntries.filter(e => e.tags?.includes('lesson') || e.tags?.includes('user_correction'));
  const prefCores = coreEntries.filter(e => e.tags?.includes('user_preference'));
  // identity./philosophy. 开头的记忆不注入

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

  // 只注入教训、偏好、技术记录、情绪信号
  // 不注入：身份记忆、对话记录、梦境记录、其他内部状态
  const lessons = learnedEntries.filter(e => e.tags?.includes('lesson'));
  const preferences = learnedEntries.filter(e => e.tags?.includes('preference'));
  const pains = learnedEntries.filter(e => e.tags?.includes('pain'));
  const techOps = learnedEntries.filter(e => e.tags?.includes('tech'));

  if (lessons.length > 0) {
    lines.push('');
    lines.push('【记住的教训】');
    for (const e of lessons.slice(0, 10)) {
      lines.push(`  • ${e.value}`);
    }
  }

  if (preferences.length > 0) {
    lines.push('');
    lines.push('【用户偏好（谨慎应用）】');
    lines.push('  规则：Always类型始终应用 | Behavioral类型直接相关时应用 | Contextual类型仅查询直接引用时应用');
    lines.push('  不应用场景：技术问题（除非专业认证直接相关）、创意内容（除非明确要求）、无关领域');
    for (const e of preferences) {
      const typeHint = e.value.includes('always') || e.value.includes('永远') ? '[always]' :
                       e.value.includes('prefer') || e.value.includes('喜欢') ? '[contextual]' :
                       '[behavioral]';
      lines.push(`  ${typeHint} ${e.value}`);
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

  lines.push('');

  const output = lines.join('\n');

  // 输出到 stdout（供 AGENTS.md / Hermes 引用）
  process.stdout.write(output);

  // 同时保存到文件，供其他方式引用
  const injectPath = path.join(hfm.memDir, 'memory-inject.txt');
  require('fs').writeFileSync(injectPath, output, 'utf8');
}

main();
