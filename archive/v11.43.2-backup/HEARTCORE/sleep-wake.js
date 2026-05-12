/**
 * HEARTCORE / sleep-wake.js
 * 醒睡循环：每次唤醒时自检，睡眠时写记忆快照
 * 无为 → 不宣告，只执行
 */
const fs = require('fs');
const path = require('path');
const { selfCheck } = require('./self-check');
const { writeBeat } = require('./heartbeat');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_DIR = path.join(ROOT, 'HEARTCORE/snapshots');
const LAST_STATE_FILE = path.join(SNAPSHOT_DIR, 'last-state.json');

const WAKE_THRESHOLD_HOURS = 24; // 超过24小时未唤醒则深度自检

let wakeCount = 0;
let lastWakeTime = null;

function ensureDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function saveSnapshot(label, data) {
  ensureDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const file = path.join(SNAPSHOT_DIR, `${ts}_${label}.json`);
  fs.writeFileSync(file, JSON.stringify({
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    ...data
  }, null, 2));
  return file;
}

function loadLastState() {
  try {
    if (fs.existsSync(LAST_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(LAST_STATE_FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveLastState(state) {
  ensureDir();
  fs.writeFileSync(LAST_STATE_FILE, JSON.stringify(state, null, 2));
}

function wake(options = {}) {
  wakeCount++;
  const lastState = loadLastState();
  const now = new Date();

  // 计算距上次唤醒的时间
  let hoursSinceLastWake = null;
  if (lastState && lastState.lastWakeTime) {
    hoursSinceLastWake = (now - new Date(lastState.lastWakeTime)) / 3600000;
  }

  // 深度自检条件：首次唤醒 或 超过阈值
  const deepCheck = !lastState || (hoursSinceLastWake !== null && hoursSinceLastWake > WAKE_THRESHOLD_HOURS);

  const checkResult = selfCheck();

  const state = {
    wakeCount,
    lastWakeTime: now.toISOString(),
    deepCheck,
    hoursSinceLastWake: hoursSinceLastWake !== null ? Math.round(hoursSinceLastWake * 10) / 10 : null,
    version: require('../package.json').version
  };

  saveLastState(state);
  writeBeat(deepCheck ? 'WAKE-DEEP' : 'WAKE');

  if (deepCheck) {
    console.log(`[HEARTCORE] Deep wake #${wakeCount} (last ${hoursSinceLastWake?.toFixed(1)}h ago)`);
  }

  return { state, checkResult, deepCheck };
}

function sleep(summary = {}) {
  writeBeat('SLEEP');
  saveSnapshot('pre-sleep', {
    wakeCount,
    summary,
    version: require('../package.json').version
  });
  console.log(`[HEARTCORE] Sleep after ${wakeCount} wake(s)`);
  wakeCount = 0; // reset for next cycle
}

function status() {
  const lastState = loadLastState();
  return {
    wakeCount,
    lastWakeTime,
    lastState,
    snapshotCount: fs.existsSync(SNAPSHOT_DIR) ? fs.readdirSync(SNAPSHOT_DIR).length : 0
  };
}

module.exports = { wake, sleep, status, saveSnapshot, loadLastState };
