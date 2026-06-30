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

// 1. Node.js 版本
check('Node.js >= 18', () => {
  const v = process.version.slice(1).split('.')[0];
  if (parseInt(v) < 18) throw new Error(`当前 v${process.version}，需要 >= 18`);
});

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

// 3. 核心模块 require（不启动引擎，只检查能否加载）
check('heartflow.js 模块可加载', () => {
  const { HeartFlow } = require(path.join(HF_DIR, 'src/core/heartflow.js'));
  if (typeof HeartFlow !== 'function') throw new Error('HeartFlow 不是构造函数');
});

// 4. 启动引擎并检查状态
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

check('think() 可用', async () => {
  if (!engine) throw new Error('引擎未启动');
  try {
    const r = await engine.think('你好');
    if (!r || !r.type) throw new Error('think() 返回异常');
  } catch (e) {
    throw new Error(`think() 失败: ${e.message}`);
  }
});

// 5. 停止引擎
if (engine) {
  try { engine.stop(); } catch(e) {}
}

// 6. npm 依赖检查（只检查必选依赖，optionalDependencies 如 @xenova/transformers 是可选功能）

check('npm 必选依赖为空', () => {
  const pkg = require(path.join(HF_DIR, 'package.json'));
  const deps = Object.keys(pkg.dependencies || {}).length;
  if (deps > 0) throw new Error(`dependencies 中有 ${deps} 个包`);
  
  // YEH LINE ADD KAREIN (optDeps define karo)
  const optDeps = Object.keys(pkg.optionalDependencies || {}).length;
  if (optDeps > 0) {
    console.log(`  ⚠️  optionalDependencies 中有 ${optDeps} 个包 (ignored)`);
  }
});

console.log(RESULTS.join('\n'));
console.log(`\n=== ${hasError ? '❌ 验证失败' : '✅ 全部通过'} ===`);
process.exit(hasError ? 1 : 0);
