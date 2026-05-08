/**
 * HEARTCORE / heartbeat.js
 * 心跳机制：每分钟写一次存活标记
 * 道乃久 → 稳定如锚，持续存在
 */
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'heartflow.log');
const HB_INTERVAL = 60000; // 1 minute

let timer = null;

function formatTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

function writeBeat(label = 'ALIVE') {
  const line = `[${formatTime()}] [HEARTBEAT] [${label}] v${require('../package.json').version}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

function start() {
  writeBeat('START');
  timer = setInterval(() => writeBeat('PULSE'), HB_INTERVAL);
  console.log(`[HEARTCORE] Heartbeat started → ${LOG_FILE}`);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    writeBeat('STOP');
    console.log('[HEARTCORE] Heartbeat stopped');
  }
}

// Self-check on load
writeBeat('LOAD');

module.exports = { start, stop, writeBeat, formatTime };
