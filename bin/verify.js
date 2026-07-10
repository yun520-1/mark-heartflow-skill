#!/usr/bin/env node
/**
 * HeartFlow 安装验证脚本
 * 检查所有核心模块能否正常加载，输出清晰的成功/失败列表
 * 运行: node bin/verify.js 或 npm run verify
 */

const fs = require('fs');
const path = require('path');

const HF_DIR = path.join(__dirname, '..');
const RESULTS = [];
let hasError = false;

function check(label, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(r => {
        RESULTS.push(`  ✅ ${label}`);
        return r;
      }).catch(e => {
        RESULTS.push(`  ❌ ${label}: ${e.message.split('\n')[0]}`);
        hasError = true;
        return null;
      });
    }
    RESULTS.push(`  ✅ ${label}`);
    return result;
  } catch (e) {
    RESULTS.push(`  ❌ ${label}: ${e.message.split('\n')[0]}`);
    hasError = true;
    return null;
  }
}

console.log('');
console.log('=== HeartFlow 安装验证 ===\n');

// Collect all async check results
const checkResults = [];

// 1. Node.js 版本
checkResults.push(check('Node.js >= 18', () => {
  const v = process.version;
  const major = parseInt(v.slice(1).split('.')[0]);
  if (major < 18) throw new Error(`当前 v${process.version}，需要 >= 18`);
  return v;
}));

// 2. 关键文件存在
check('src/core/heartflow.js 存在', () => {
  const p = path.join(HF_DIR, 'src/core/heartflow.js');
  if (!fs.existsSync(p)) throw new Error('文件不存在');
});

check('bin/cli.js 存在', () => {
  const p = path.join(HF_DIR, 'bin/cli.js');
  if (!fs.existsSync(p)) throw new Error('文件不存在');
});

check('package.json 存在', () => {
  const p = path.join(HF_DIR, 'package.json');
  if (!fs.existsSync(p)) throw new Error('文件不存在');
});

// 3. 核心模块 require
check('heartflow.js 模块可加载', () => {
  const { HeartFlow } = require(path.join(HF_DIR, 'src/core/heartflow.js'));
  if (typeof HeartFlow !== 'function') throw new Error('HeartFlow 不是构造函数');
});

// 4. 启动引擎
let engine = null;
check('引擎启动', () => {
  const { HeartFlow } = require(path.join(HF_DIR, 'src/core/heartflow.js'));
  engine = new HeartFlow();
  engine.start();
  if (!engine.started) throw new Error('engine.started 为 false');
});

check('模块数 >= 40', () => {
  if (!engine) throw new Error('引擎未启动');
  const count = Object.keys(engine._modules || {}).length;
  if (count < 40) throw new Error(`只有 ${count} 个模块，期望 >= 40`);
});

check('dispatch 路由可用', () => {
  if (!engine) throw new Error('引擎未启动');
  const r = engine.dispatch('emotion.process', '测试');
  const data = r && r.result ? r.result : r;
  if (!data || typeof data.pad?.pleasure !== 'number') throw new Error('emotion.process 返回异常');
});

checkResults.push(check('think() 可用', async () => {
  if (!engine) throw new Error('引擎未启动');
  try {
    const r = await engine.think('你好');
    if (!r || !r.type) throw new Error('think() 返回异常');
  } catch (e) {
    throw new Error(`think() 失败: ${e.message}`);
  }
}));

// 5. 停止引擎
if (engine) {
  try { engine.stop(); } catch(e) { /* stop may fail on circular ref */ }
}

// 6. npm 依赖检查
check('npm 必选依赖为空', () => {
  const pkg = require(path.join(HF_DIR, 'package.json'));
  const deps = Object.keys(pkg.dependencies || {}).length;
  if (deps < 1) throw new Error('依赖声明为空，心虫至少需要 mathjs');
});

// Wait for all async checks, then print results
Promise.all(checkResults).then(() => {
  console.log(RESULTS.join('\n'));
  const passed = RESULTS.filter(r => r.includes('✅')).length;
  const failed = RESULTS.filter(r => r.includes('❌')).length;
  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}).catch(e => {
  console.error('Verify error:', e);
  process.exit(1);
});
