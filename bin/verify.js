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

check('模块数 >= 124', () => {
  if (!engine) throw new Error('引擎未启动');
  const count = Object.keys(engine._modules || {}).length;
  if (count < 124) throw new Error(`只有 ${count} 个模块，期望 >= 124`);
});

check('测试文件数 >= 10', () => {
  const testDir = path.join(HF_DIR, 'test');
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
  if (files.length < 10) throw new Error(`测试文件只有 ${files.length} 个，期望 >= 10`);
});

check('知识本体测试存在', () => {
  const p = path.join(HF_DIR, 'test', 'knowledge-ontology.test.js');
  if (!fs.existsSync(p)) throw new Error('knowledge-ontology.test.js 不存在');
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

// 7. 明文记忆扫描：检查是否有新增的 .txt/.json 明文记忆落盘
checkResults.push(check('扫描新增.txt/.json明文记忆', async () => {
  const fs = require('fs');
  const path = require('path');

  // 需要排除的明文记忆目录/文件（预期内允许明文存在的路径）
  const allowedPlaintextPaths = new Set([
    path.resolve(HF_DIR, 'data', 'memories', 'self-memories.jsonl'),
    path.resolve(HF_DIR, 'data', 'memories', 'user-memories.jsonl'),
    path.resolve(HF_DIR, 'memory', 'dialogue-history.jsonl'),
    path.resolve(HF_DIR, 'memory', 'q-table.json'),
    path.resolve(HF_DIR, 'data', 'heartflow-state-history.jsonl'),
    path.resolve(HF_DIR, 'data', 'heartflow-state.json'),
    path.resolve(HF_DIR, 'data', 'memory-bank.json'),
    path.resolve(HF_DIR, 'data', 'memory-index.json'),
    path.resolve(HF_DIR, 'data', 'memories', 'memory-index.json'),
    path.resolve(HF_DIR, 'data', 'meaningful-memory.json'),
    path.resolve(HF_DIR, 'data', 'memories', 'context-memory.json'),
    path.resolve(HF_DIR, 'data', 'judgments', 'judgment-history.json'),
    path.resolve(HF_DIR, 'data', 'code-graph.json'),
    path.resolve(HF_DIR, 'data', 'intervention-protocols.json'),
    path.resolve(HF_DIR, 'data', 'large', 'empathy_train.json'),
    path.resolve(HF_DIR, 'data', 'large', 'knowledge_base.json'),
    path.resolve(HF_DIR, 'data', 'memories', 'context-memory.json'),
    path.resolve(HF_DIR, 'data', 'memories', 'core.json'),
    path.resolve(HF_DIR, 'data', 'memories', 'memory-index.json'),
    path.resolve(HF_DIR, 'config.json'),
    path.resolve(HF_DIR, 'data', 'narrative-self.json'),
  ]);

  // 整目录白名单：以下目录下的 .txt/.json 均为运行时合法生成（反馈/教育子系统）
  const allowedPlaintextDirPrefixes = [
    path.resolve(HF_DIR, 'data', 'feedback'),
    path.resolve(HF_DIR, 'data', 'edu'),
    path.resolve(HF_DIR, 'data', 'edu_test'),
  ];

  // 扫描 memory/ 和 data/ 下所有 .txt 和 .json 文件
  const scanDirs = [
    path.join(HF_DIR, 'memory'),
    path.join(HF_DIR, 'data'),
  ];

  const unexpected = [];

  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
    } catch (e) {
      continue;
    }

    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.resolve(entry.parentPath || dir, entry.name);
        if (entry.name.endsWith('.txt') || entry.name.endsWith('.json')) {
          const inAllowedDir = allowedPlaintextDirPrefixes.some(p =>
            fullPath === p || fullPath.startsWith(p + path.sep)
          );
          if (!allowedPlaintextPaths.has(fullPath) && !inAllowedDir) {
            unexpected.push(path.relative(HF_DIR, fullPath));
          }
        }
      }
    }
  }

  if (unexpected.length > 0) {
    throw new Error(
      `发现 ${unexpected.length} 个未预期的明文记忆文件：\n` +
      unexpected.slice(0, 20).map(f => `  - ${f}`).join('\n') +
      (unexpected.length > 20 ? `\n  ... 及其他 ${unexpected.length - 20} 个` : '')
    );
  }
}));

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
