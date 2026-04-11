#!/usr/bin/env node
/**
 * Count total up-times across all known logs by counting lines with a success symbol
 * across: hourly-upgrade.log, auto-upgrade.log, personality-daily.log,
 * evolution-cron.log, enhanced-cron.log, comfyui-cron.log
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const logFiles = [
  path.join(ROOT, 'logs', 'hourly-upgrade.log'),
  path.join(ROOT, 'logs', 'auto-upgrade.log'),
  path.join(ROOT, 'logs', 'personality-daily.log'),
  path.join(ROOT, 'new', 'logs', 'evolution-cron.log'),
  path.join(ROOT, 'mark-heartflow-skill-new', 'logs', 'evolution-cron.log'),
  path.join(ROOT, 'logs', 'enhanced-cron.log'),
  path.join(ROOT, 'logs', 'comfyui-cron.log')
];

function countLinesWithSuccess(file) {
  try {
    if (!fs.existsSync(file)) return 0;
    const data = fs.readFileSync(file, 'utf8');
    const lines = data.split(/\r?\n/);
    return lines.filter(l => /✅|\u2713|完成|完成了|OK|Done|success/i.test(l)).length;
  } catch (e) {
    return 0;
  }
}

function main() {
  let total = 0;
  const perLog = {};
  for (const f of logFiles) {
    const c = countLinesWithSuccess(f);
    perLog[f] = c;
    total += c;
  }
  console.log(JSON.stringify({ total, perLog }, null, 2));
}

if (require.main === module) {
  main();
}
