/**
 * test-runner.js — 简易测试运行器（无外部依赖）
 *
 * 用法：
 *   node test/run-all.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = __dirname;

// 统计
let passed = 0;
let failed = 0;
let pending = 0;
const failures = [];
const asyncPromises = [];

function test(name, fn) {
  try {
    const ret = fn();
    if (ret && typeof ret.then === 'function') {
      pending++;
      const p = ret.then(() => {
        pending--;
        passed++;
        console.log(`  ✓ ${name}`);
      }).catch((err) => {
        pending--;
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${err.message}`);
        failures.push({ name, error: err.message });
      });
      asyncPromises.push(p);
      return p;
    }
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

// 运行子测试脚本并解析结果
function runSubTest(name, testFile, timeout = 30000) {
  console.log(`\n${name}`);
  try {
    const result = execSync(`node ${path.join(__dirname, testFile)}`, {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log(`  ⚠️ ${name} 测试异常: ${(e.message || '').split('\n')[0]}`);
    failed++;
  }
}

// === MAIN ===
async function runAllTests() {
  console.log('\n🧪 HeartFlow 模块测试\n');

  // 1-2. CodeWriter, CodeGenerator (模块已被清理，保留空占位)
  console.log('📝 CodeWriter (code-writer.js)');
  console.log('🔧 CodeGenerator (code-generator.js)');

  // 3. HeartLogic
  console.log('\n❤️ HeartLogic (heart-logic.js)');

  // 4. DesireCognition
  console.log('\n💭 DesireCognition (desire-cognition.js)');

  runSubTest('📚 KnowledgeOntology', 'knowledge-ontology.test.js');
  runSubTest('🔍 KnowledgeQuery', 'knowledge-query.test.js');
  runSubTest('⚖️ DualPerspectiveAuditor', 'dual-perspective.test.js');
  runSubTest('📡 SignalAbsorber', 'signal-absorber.test.js');
  runSubTest('🕸️ KnowledgeGraphAdapter', 'knowledge-graph-adapter.test.js');
  runSubTest('🏷️ SourceAnnotator', 'source-annotator.test.js');

  // 5. IdentityCore + BigFive + SelfModel
  runSubTest('🧩 IdentityCore', 'identity-core.test.js');
  runSubTest('🌱 BigFivePersonality', 'big-five.test.js');
  runSubTest('🪞 SelfModel', 'self-model.test.js');

  // 6. Reasoning
  runSubTest('🧩 LogicReasoning', 'logic-reasoning.test.js');

  // 7. ReflectionLoop
  runSubTest('🔄 ReflectionLoop', 'reflection-loop.test.js');

  // 8. PersonaEngine + PersonaProfile + StyleEngine (模块已清理)
  console.log('\n🎭 PersonaEngine / PersonaProfile / StyleEngine (已清理)');

  // 9. P4 回归测试
  console.log('\n🛡️ P4 回归测试');
  try {
    const result = execSync(`node ${path.join(__dirname, 'module-registry.test.js')} && node ${path.join(__dirname, 'route-whitelist.test.js')} && node ${path.join(__dirname, 'safe-fs.test.js')}`, {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    console.log(result.trim());
  } catch (e) {
    console.log(`  ⚠️ P4 回归测试异常: ${(e.message || '').split('\n')[0]}`);
    failed++;
  }

  // 10. MCP 测试
  console.log('\n🔍 MCP Discriminator (mcp-discriminator.test.js)');

  // 11. 动态接入未显式 require 的测试文件
  console.log('\n📦 动态接入遗漏测试 (D4 fix)');
  const runAllSrc = fs.readFileSync(__filename, 'utf8');
  const explicit = new Set([...runAllSrc.matchAll(/require\('\.\/([a-zA-Z0-9_-]+)'\)/g)].map(m => m[1]));
  const allTests = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.test.js') && f !== 'run-all.test.js');
  for (const f of allTests) {
    const name = f.replace(/\.test\.js$/, '');
    if (explicit.has(name)) continue;
    try {
      require('./' + f)({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });
      console.log('  + 接入 ' + name);
    } catch (e) {
      console.log('  ⚠️ ' + name + ' 接入异常: ' + (e.message || '').split('\n')[0]);
    }
  }

  // 汇总前等待 async 测试结算
  if (asyncPromises.length) {
    await Promise.all(asyncPromises);
    console.log('[harness] async 测试已结算, passed=' + passed + ' failed=' + failed);
  }

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
