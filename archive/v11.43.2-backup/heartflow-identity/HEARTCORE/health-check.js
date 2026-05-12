/**
 * HEARTCORE / health-check.js
 * 独立健康检查：验证 HEARTCORE 模块完整性
 * 不依赖外部文件结构，只检查自己
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

const MODULES = [
  'heartcore.js',
  'heartbeat.js',
  'self-check.js',
  'safety-check.js',
  'sleep-wake.js'
];

function check(name) {
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) {
    return { name, status: 'MISSING', detail: 'file not found' };
  }
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.length < 10) {
      return { name, status: 'EMPTY', detail: 'file is empty' };
    }
    // Basic JS syntax check
    new Function(content);
    return { name, status: 'OK', detail: `${content.length} bytes, syntax valid` };
  } catch (e) {
    return { name, status: 'ERROR', detail: e.message };
  }
}

const results = MODULES.map(m => check(m));
const allOk = results.every(r => r.status === 'OK');

console.log('\n[HEARTCORE Health Check]');
results.forEach(r => {
  const icon = r.status === 'OK' ? '✅' : r.status === 'MISSING' ? '❌' : '⚠️';
  console.log(`  ${icon} ${r.name}: ${r.detail}`);
});

console.log(`\nResult: ${allOk ? '✅ ALL PASS' : '❌ ISSUES FOUND'}`);

process.exit(allOk ? 0 : 1);
