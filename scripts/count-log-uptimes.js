#!/usr/bin/env node
// Count log entries that indicate task executions within the last 30 days
// Logs considered:
// - logs/hourly-upgrade.log
// - logs/auto-upgrade.log
// - logs/personality-daily.log
// - logs/evolution-cron.log
// - logs/enhanced-cron.log
// - logs/comfyui-cron.log
// Paths can be extended if needed.

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const logs = [
  path.join(projectRoot, 'logs', 'hourly-upgrade.log'),
  path.join(projectRoot, 'logs', 'auto-upgrade.log'),
  path.join(projectRoot, 'logs', 'personality-daily.log'),
  path.join(projectRoot, 'new', 'logs', 'evolution-cron.log'),
  path.join(projectRoot, 'mark-heartflow-skill-new', 'logs', 'evolution-cron.log'),
  path.join(projectRoot, 'logs', 'enhanced-cron.log'),
  path.join(projectRoot, 'logs', 'comfyui-cron.log')
];

function parseDateFromLine(line) {
  // Try to extract an ISO timestamp like 2026-04-06T10:48:35.665Z
  const m = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
  if (m) {
    const dateStr = m[0].endsWith('Z') ? m[0] : m[0] + 'Z';
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
  }
  // Fallback: try to parse Chinese timestamps like 2026-04-06T10:48:35.665Z present elsewhere
  return null;
}

function countInLastDays(filePath, days) {
  try {
    if (!fs.existsSync(filePath)) return { path: filePath, count: 0 };
    const data = fs.readFileSync(filePath, 'utf8').toString();
    const lines = data.split(/\n/);
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    let count = 0;
    for (const line of lines) {
      const d = parseDateFromLine(line);
      if (d && d.getTime() >= since) count++;
    }
    return { path: filePath, count };
  } catch (e) {
    return { path: filePath, count: 0 };
  }
}

function main() {
  const days = 30;
  const results = logs.map(lp => countInLastDays(lp, days));
  console.log(JSON.stringify({ windowDays: days, results }, null, 2));
}

if (require.main === module) {
  main();
}
