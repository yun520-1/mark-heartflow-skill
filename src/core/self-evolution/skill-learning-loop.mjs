#!/usr/bin/env node
/**
 * Skill Learning Loop - 定期从错误中学习
 * 
 * 设计：这是一个定期运行的"学习者"，从以下来源收集错误：
 * 1. Hermes cron output 中的错误日志
 * 2. 手动标记的错误
 * 3. 会话结束时的反馈
 * 
 * 运行方式：
 *   node skill-learning-loop.mjs --learn-from-errors
 *   node skill-learning-loop.mjs --decay
 *   node skill-learning-loop.mjs --summary
 * 
 * @version v0.13.93
 */

import { improveSkill, getImprovementSummary } from './skill-improve-workflow.mjs';
import { decayOldEntries } from './skill-knowledge.mjs';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DATA_DIR = join(homedir(), '.hermes', 'data', 'skill-knowledge');
const ERROR_LOG = join(DATA_DIR, 'error-log.json');

// ============================================================================
// Error Log Management
// ============================================================================

/**
 * Load error log
 */
async function loadErrorLog() {
  try {
    const raw = await fs.readFile(ERROR_LOG, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save error log
 */
async function saveErrorLog(logs) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ERROR_LOG, JSON.stringify(logs, null, 2));
}

/**
 * Add an error to the log (call this after each failure)
 */
export async function logError({ skillName, errorPattern, errorOutput, taskType }) {
  const log = await loadErrorLog();
  log.push({
    skillName,
    errorPattern,
    errorOutput,
    taskType: taskType || 'general',
    timestamp: new Date().toISOString(),
    processed: false,
  });
  await saveErrorLog(log);
  return { logged: true, totalErrors: log.length };
}

/**
 * Get unprocessed errors
 */
async function getUnprocessedErrors() {
  const log = await loadErrorLog();
  return log.filter(e => !e.processed);
}

/**
 * Mark errors as processed
 */
async function markProcessed(ids) {
  const log = await loadErrorLog();
  for (const e of log) {
    if (ids.includes(`${e.skillName}:${e.errorPattern}:${e.timestamp}`)) {
      e.processed = true;
    }
  }
  await saveErrorLog(log);
}

// ============================================================================
// Main Learning Loop
// ============================================================================

/**
 * Process unprocessed errors through the improvement workflow
 */
async function learnFromErrors() {
  const errors = await getUnprocessedErrors();
  
  if (errors.length === 0) {
    console.log('[LearningLoop] No new errors to process');
    return { processed: 0 };
  }

  console.log(`[LearningLoop] Processing ${errors.length} errors...`);
  
  const results = [];
  for (const error of errors) {
    try {
      const result = await improveSkill({
        skillName: error.skillName,
        errorPattern: error.errorPattern,
        errorOutput: error.errorOutput,
        taskType: error.taskType,
      });
      results.push(result);
    } catch (err) {
      console.error(`[LearningLoop] Failed to process: ${error.errorPattern.slice(0, 50)} — ${err.message}`);
    }
  }

  // Mark as processed
  const ids = errors.map(e => `${e.skillName}:${e.errorPattern}:${e.timestamp}`);
  await markProcessed(ids);

  console.log(`[LearningLoop] Processed ${results.length} errors`);
  return { processed: results.length, results };
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case '--learn-from-errors':
    case '-l': {
      const result = await learnFromErrors();
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case '--decay':
    case '-d': {
      const result = await decayOldEntries(30);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case '--summary':
    case '-s': {
      const summary = await getImprovementSummary();
      console.log(JSON.stringify(summary, null, 2));
      break;
    }

    case '--log-error': {
      // Usage: node skill-learning-loop.mjs --log-error "heartflow" "pattern" "error output"
      const skillName = args[1] || 'general';
      const errorPattern = args[2] || 'unknown';
      const errorOutput = args[3] || 'no output';
      const taskType = args[4] || 'general';
      const result = await logError({ skillName, errorPattern, errorOutput, taskType });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.log(`Usage:
  node skill-learning-loop.mjs --learn-from-errors   Learn from unprocessed errors
  node skill-learning-loop.mjs --decay               Decay old entries (30+ days)
  node skill-learning-loop.mjs --summary             Show knowledge summary
  node skill-learning-loop.mjs --log-error <skill> <pattern> <output> [taskType]
`);
  }
}

main().catch(console.error);
