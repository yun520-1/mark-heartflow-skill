/**
 * test-runner.js — 简易测试运行器（无外部依赖）
 *
 * 用法：
 *   node test/run-all.js
 */

const fs = require('fs');
const path = require('path');

const TEST_DIR = __dirname;

// 统计
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failures.push({ name, error: err.message });
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`期望 ${expected}，实际 ${actual}。${msg}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`期望 truthy，实际 ${value}。${msg}`);
  }
}

function assertFalse(value, msg = '') {
  if (value) {
    throw new Error(`期望 falsy，实际 ${value}。${msg}`);
  }
}

function assertDefined(value, msg = '') {
  if (value === undefined || value === null) {
    throw new Error(`期望有值，实际 ${value}。${msg}`);
  }
}

function assertThrows(fn, msg = '') {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) {
    throw new Error(`期望抛出异常。${msg}`);
  }
}

// ============================================================
// 测试套件
// ============================================================

async function runAllTests() {
  console.log('\n🧪 HeartFlow 模块测试\n');
  console.log('='.repeat(50));

  // 1. CodeWriter 测试
  console.log('\n📝 CodeWriter (code-writer.js)');
  require('./code-writer.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });

  // 2. CodeGenerator 测试
  console.log('\n🔧 CodeGenerator (code-generator.js)');
  require('./code-generator.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });

  // 3. HeartLogic 测试
  console.log('\n❤️ HeartLogic (heart-logic.js)');
  require('./heart-logic.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });

  // 4. DesireCognition 测试
  console.log('\n💭 DesireCognition (desire-cognition.js)');
  require('./desire-cognition.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });

  // 汇总
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);

  if (failures.length > 0) {
    console.log('\n❌ 失败的测试:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
    process.exitCode = 1;
  } else {
    console.log('\n✅ 全部通过！');
  }
}

runAllTests().catch(err => {
  console.error('测试运行器错误:', err);
  process.exit(1);
});
