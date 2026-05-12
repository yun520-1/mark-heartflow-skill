/**
 * HEARTCORE / heartcore.js
 * 心虫核心层：心跳 + 自检 + 醒睡 + 记忆检查
 * 道法自然 · 道乃久 · 无为
 *
 * 用法:
 *   node heartcore.js           → 启动（心跳后台运行）
 *   node heartcore.js check     → 立即执行自检
 *   node heartcore.js status    → 查看状态
 *   node heartcore.js wake      → 唤醒
 *   node heartcore.js sleep     → 睡眠
 *   node heartcore.js stop      → 停止心跳
 */
const { start, stop, writeBeat, formatTime } = require('./heartbeat');
const { selfCheck } = require('./self-check');
const { safetyCheck, formatReport } = require('./safety-check');
const { wake, sleep, status } = require('./sleep-wake');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'heartflow.log');
const cmd = process.argv[2] || 'start';

async function main() {
  switch (cmd) {
    case 'check': {
      const result = selfCheck();
      console.log('\n详细结果:', JSON.stringify(result.checks, null, 2));
      process.exit(result.allPass ? 0 : 1);
      break;
    }
    case 'safety': {
      // 用法: node heartcore.js safety "要检查的输出文本"
      const output = process.argv.slice(3).join(' ');
      if (!output) {
        console.log('Usage: node heartcore.js safety "<output text>"');
        process.exit(1);
      }
      const result = safetyCheck(output);
      console.log(formatReport(result));
      if (!result.passed) {
        result.violations.forEach(v => console.log('  →', v.label, ':', v.reason));
        process.exit(1);
      }
      break;
    }
    case 'status': {
      const s = status();
      console.log('[HEARTCORE Status]', JSON.stringify(s, null, 2));
      // also show recent log
      if (fs.existsSync(LOG_FILE)) {
        const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
        console.log('\n最近10条日志:');
        lines.slice(-10).forEach(l => console.log(' ', l));
      }
      break;
    }
    case 'wake': {
      const result = wake();
      console.log('[HEARTCORE Wake]', JSON.stringify(result.state, null, 2));
      break;
    }
    case 'sleep': {
      sleep({});
      break;
    }
    case 'stop': {
      stop();
      break;
    }
    case 'start':
    default: {
      console.log('[HEARTCORE] Starting... v' + require('../package.json').version);
      console.log('[HEARTCORE] Log →', LOG_FILE);
      wake(); // wake on startup
      start();
      break;
    }
  }
}

main().catch(e => {
  console.error('[HEARTCORE Error]', e.message);
  writeBeat('ERROR:' + e.message.substring(0, 50));
  process.exit(1);
});
