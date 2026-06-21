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
 *   4. 注入后自动更新 LEARNED 层条目的 lastAccessed 时间戳
 */

const path = require('path');
const { HeartFlowMemory } = require('../src/memory/heartflow-memory.js');
const { atomicWrite } = require('../src/utils/atomic-write.js');

const SKILL_ROOT = path.resolve(__dirname, '..');

// SkillSpector fix: 敏感内容过滤器，与 Python 插件保持一致
const SENSITIVE_PATTERNS = [
  /自杀|自残|抑郁|焦虑|心理|精神|治疗|住院|手术|癌症|肿瘤/,
  /离婚|去世|死亡|丧|葬礼|悲痛|创伤/,
  /虐待|性侵|暴力|欺凌/,
  /suicide|self[- ]harm|depression|anxiety|therapy|hospital|surgery|cancer|tumor/i,
  /divorce|deceased|death|funeral|grief|trauma/i,
  /abuse|assault|violence|bullying/i,
];

function filterSensitive(text) {
  if (!text) return text;
  const lines = text.split('\n');
  return lines.filter(line =>
    !SENSITIVE_PATTERNS.some(pattern => pattern.test(line))
  ).join('\n');
}

function main() {
  const hfm = new HeartFlowMemory(SKILL_ROOT);
  const lines = [];
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  lines.push('');  // 空行分隔
  // ─── CORE 层（全部注入）──────────────
  const coreEntries = hfm.listCore();

  // 只注入教训和偏好，不注入身份/哲学（通过 key 前缀过滤 identity./philosophy.）
  const lessonCores = coreEntries.filter(e => (e.tags?.includes('lesson') || e.tags?.includes('user_correction')) && !e.key?.startsWith('identity.') && !e.key?.startsWith('philosophy.'));
  const prefCores = coreEntries.filter(e => e.tags?.includes('user_preference') && !e.key?.startsWith('identity.') && !e.key?.startsWith('philosophy.'));
  // 注意：前缀过滤与 tag 过滤共同作用，identity./philosophy. 开头的条目即使有 lesson/user_preference 标签也不会注入

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

  const output = filterSensitive(lines.join('\n'));

  // 4. 更新 LEARNED 层注入条目的 lastAccessed 时间戳（仅调试模式）
  // [安全审计修复] 仅在 HEARTFLOW_DEBUG 环境变量存在时才更新 lastAccessed，
  // 避免每次读取记忆都产生写持久状态的副作用，保持"只读注入"的语义。
  if (process.env.HEARTFLOW_DEBUG) {
    const allInjected = [...lessonCores, ...prefCores, ...lessons, ...preferences, ...pains, ...techOps];
    for (const entry of allInjected) {
      if (entry.key && hfm.learned[entry.key]) {
        hfm.learned[entry.key].lastAccessed = Date.now();
      }
    }
    // 保存更新后的 learned 层
    if (allInjected.length > 0 && hfm.learned) {
      hfm._saveJson(hfm.learnedPath, hfm.learned);
    }
  }

  // 输出到 stdout（供 AGENTS.md / Hermes 引用）
  process.stdout.write(output);

  // SkillSpector fix: 仅在 DEBUG 模式下写入文件，避免将敏感记忆数据持久化到磁盘
  if (process.env.HEARTFLOW_DEBUG) {
    const injectPath = path.join(hfm.memDir, 'memory-inject.txt');
    atomicWrite(injectPath, output).catch(e => {
      console.error(`[memory-inject] 写入失败: ${e.message}`);
    });
  }
}

main();
