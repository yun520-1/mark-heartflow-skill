/**
 * HeartFlow Memory Stats — 真实记忆统计
 * 
 * 问题：state.db 显示 38,180 条消息，但其中 84% 是噪音：
 * - 17,885 条工具输出（不是对话）
 * - 135 条上下文压缩摘要
 * - 73 条技能调用系统消息
 * 
 * 真实记忆：约 6,005 条对话消息（15.7%）
 * 
 * @version v0.13.95
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DB_PATH = process.env.HERMES_DB || join(homedir(), '.hermes', 'state.db');
const KNOWLEDGE_DIR = process.env.HERMES_DATA_DIR
  ? join(process.env.HERMES_DATA_DIR, 'skill-knowledge')
  : join(homedir(), '.hermes', 'data', 'skill-knowledge');

/**
 * Get true memory stats (excluding noise)
 */
export async function getMemoryStats() {
  const stats = {
    //真实对话 (true conversation)
    trueConversation: {
      userMessages: 0,
      assistantMessages: 0,
      total: 0,
    },
    //噪音 (noise)
    noise: {
      toolOutputs: 0,
      contextCompaction: 0,
      skillInvocations: 0,
      sessionMeta: 0,
      total: 0,
    },
    //Sessions
    sessions: {
      total: 0,
      bySource: {},
    },
    //知识库
    knowledge: {
      curated: 0,
      learned: 0,
    },
    //DB大小
    dbSize: 0,
  };

  // Try to read from state.db if available
  try {
    const sqlite3 = await import('sqlite3');
    const db = new sqlite3.Database(DB_PATH);
    
    // True user messages
    const userRow = db.prepare(`
      SELECT COUNT(*) FROM messages 
      WHERE role = 'user' 
      AND content NOT LIKE '%CONTEXT COMPACTION%'
      AND content NOT LIKE '%[IMPORTANT: The user has invoked%'
      AND content NOT LIKE '%[SYSTEM: The user has invoked%'
      AND tool_call_id IS NULL
      AND length(content) > 5
      AND length(content) < 4000
    `).get();
    stats.trueConversation.userMessages = userRow['COUNT(*)'];

    // True assistant messages
    const asstRow = db.prepare(`
      SELECT COUNT(*) FROM messages 
      WHERE role = 'assistant' 
      AND content NOT LIKE '%CONTEXT COMPACTION%'
      AND content NOT LIKE '%[IMPORTANT: The user has invoked%'
      AND length(content) > 10
      AND length(content) < 5000
    `).get();
    stats.trueConversation.assistantMessages = asstRow['COUNT(*)'];
    stats.trueConversation.total = stats.trueConversation.userMessages + stats.trueConversation.assistantMessages;

    // Noise breakdown
    const toolRow = db.prepare(`SELECT COUNT(*) FROM messages WHERE tool_call_id IS NOT NULL`).get();
    stats.noise.toolOutputs = toolRow['COUNT(*)'];

    const compactionRow = db.prepare(`SELECT COUNT(*) FROM messages WHERE content LIKE '%CONTEXT COMPACTION%'`).get();
    stats.noise.contextCompaction = compactionRow['COUNT(*)'];

    const skillRow = db.prepare(`SELECT COUNT(*) FROM messages WHERE content LIKE '%[IMPORTANT: The user has invoked%' OR content LIKE '%[SYSTEM: The user has invoked%'`).get();
    stats.noise.skillInvocations = skillRow['COUNT(*)'];

    // Sessions
    const sessRow = db.prepare(`SELECT COUNT(*) FROM sessions`).get();
    stats.sessions.total = sessRow['COUNT(*)'];

    // DB size
    const fstat = await fs.stat(DB_PATH);
    stats.dbSize = fstat.size;

    db.close();
  } catch (err) {
    // DB not available, use estimates
    stats.error = err.message;
  }

  // Knowledge base
  try {
    const learnPath = join(KNOWLEDGE_DIR, 'learnings.json');
    const knowPath = join(KNOWLEDGE_DIR, 'knowledge.json');
    
    const learnRaw = await fs.readFile(learnPath, 'utf8');
    const learnData = JSON.parse(learnRaw);
    stats.knowledge.learned = Array.isArray(learnData) ? learnData.length : 0;

    const knowRaw = await fs.readFile(knowPath, 'utf8');
    const knowData = JSON.parse(knowRaw);
    stats.knowledge.curated = Array.isArray(knowData) ? knowData.length : 0;
  } catch {
    // Knowledge files may not exist yet
  }

  return stats;
}

/**
 * Print memory stats in human-readable format
 */
export async function printMemoryStats() {
  const stats = await getMemoryStats();
  
  const lines = [
    '═══════════════════════════════════════════',
    '  HeartFlow 真实记忆统计',
    '═══════════════════════════════════════════',
    '',
    '  【真实对话】',
    `  用户消息:   ${stats.trueConversation.userMessages.toLocaleString()} 条`,
    `  助手消息:   ${stats.trueConversation.assistantMessages.toLocaleString()} 条`,
    `  对话总计:   ${stats.trueConversation.total.toLocaleString()} 条`,
    '',
    '  【噪音统计】(不计入对话)',
    `  工具输出:   ${stats.noise.toolOutputs.toLocaleString()} 条`,
    `  压缩摘要:   ${stats.noise.contextCompaction.toLocaleString()} 条`,
    `  技能调用:   ${stats.noise.skillInvocations.toLocaleString()} 条`,
    `  噪音总计:   ${(stats.noise.toolOutputs + stats.noise.contextCompaction + stats.noise.skillInvocations).toLocaleString()} 条`,
    '',
    '  【知识库】',
    `  Curated规则: ${stats.knowledge.curated} 条`,
    `  Learned规则: ${stats.knowledge.learned} 条`,
    '',
    '  【Sessions】',
    `  总数: ${stats.sessions.total}`,
    '',
  ];

  if (stats.dbSize > 0) {
    const mb = (stats.dbSize / 1024 / 1024).toFixed(0);
    lines.push(`  【数据库】`);
    lines.push(`  DB大小: ${mb} MB`);
  }

  lines.push('═══════════════════════════════════════════');
  console.log(lines.join('\n'));
  
  return stats;
}

export default { getMemoryStats, printMemoryStats };
