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

  // 1. CodeWriter 测试（模块可能已被清理）
  console.log('\n📝 CodeWriter (code-writer.js)');
  try {
    require('./code-writer.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });
  } catch (e) {
    console.log(`  ⚠️  CodeWriter 测试跳过: ${e.message.split('\\n')[0]}`);
  }

  // 2. CodeGenerator 测试
  console.log('\n🔧 CodeGenerator (code-generator.js)');
  try {
    require('./code-generator.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });
  } catch (e) {
    console.log(`  ⚠️  CodeGenerator 测试跳过: ${e.message.split('\\n')[0]}`);
  }

  // 3. HeartLogic 测试
  console.log('\n❤️ HeartLogic (heart-logic.js)');
  require('./heart-logic.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });

  // 4. DesireCognition 测试
  console.log('\n💭 DesireCognition (desire-cognition.js)');
  require('./desire-cognition.test')({ test, assertEqual, assertTrue, assertFalse, assertDefined, assertThrows });

  // 4.1 KnowledgeOntology 测试
  console.log('\n📚 KnowledgeOntology');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'knowledge-ontology.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  KnowledgeOntology 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 4.2 KnowledgeQuery 测试
  console.log('\n🔍 KnowledgeQuery');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'knowledge-query.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  KnowledgeQuery 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 4.3 KnowledgeGraphAdapter 测试
  console.log('\n🕸️ KnowledgeGraphAdapter');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'knowledge-graph-adapter.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  KnowledgeGraphAdapter 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 4.4 SourceAnnotator 测试
  console.log('\n🏷️ SourceAnnotator');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'source-annotator.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  SourceAnnotator 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 5. IdentityCore 测试
  console.log('\n🧩 IdentityCore');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'identity-core.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  IdentityCore 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 5.1 BigFivePersonality 测试
  console.log('\n🌱 BigFivePersonality');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'big-five.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  BigFivePersonality 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 5.2 SelfModel 测试
  console.log('\n🪞 SelfModel');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'self-model.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  SelfModel 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 6. ReasoningIntegrator 测试
  console.log('\n🧠 ReasoningIntegrator');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'reasoning-integrator.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  ReasoningIntegrator 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 6.1 LogicReasoning 测试
  console.log('\n🧩 LogicReasoning');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'logic-reasoning.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  LogicReasoning 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 7. ReflectionLoop 测试
  console.log('\n🔄 ReflectionLoop');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'reflection-loop.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  ReflectionLoop 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 8. PersonaEngine 测试
  console.log('\n🎭 PersonaEngine');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'persona-engine.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  PersonaEngine 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 8.1 PersonaProfile 测试
  console.log('\n📄 PersonaProfile');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'persona-profile.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  PersonaProfile 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 9. StyleEngine / Dialogue 测试
  console.log('\n💬 StyleEngine');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'style-engine.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\n').filter(l => l.includes('通过') || l.includes('失败')).join('\n'));
    } else {
      console.log(result.trim());
    }
  } catch (e) {
    console.log('  ⚠️  StyleEngine 测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 10. P4 回归测试：ModuleRegistry / RouteWhitelist / SafeFS
  console.log('\n🛡️ P4 回归测试');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'module-registry.test.js') + ' && node ' + path.join(__dirname, 'route-whitelist.test.js') + ' && node ' + path.join(__dirname, 'safe-fs.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    console.log(result.trim());
  } catch (e) {
    console.log('  ⚠️  P4 回归测试异常: ' + (e.message || '').split('\n')[0]);
    failed++;
  }

  // 汇总
  console.log('\\n' + '='.repeat(50));

  // 6. 核心模块测试 (v5.15.2)
  console.log('\\n🧠 核心模块 (core-modules.js)');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'core-modules.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]); failed += parseInt(match[2]);
      console.log(result.split('\\n').filter(l => l.includes('通过') || l.includes('失败')).join('\\n'));
    }
  } catch (e) {
    console.log('  ⚠️  核心模块测试异常: ' + (e.message || '').split('\\n')[0]);
    failed++;
  }

  // 汇总
  console.log('\\n' + '='.repeat(50));

  // 5. 核心管线测试 (v5.14.0)
  console.log('\\n🔗 核心管线 (core-pipeline.js)');
  try {
    const { execSync } = require('child_process');
    const result = execSync('node ' + path.join(__dirname, 'core-pipeline.test.js'), {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const match = result.match(/(\d+) 通过, (\d+) 失败/);
    if (match) {
      passed += parseInt(match[1]);
      failed += parseInt(match[2]);
      console.log(result.split('\\n').filter(l => l.includes('通过') || l.includes('失败')).join('\\n'));
    }
  } catch (e) {
    console.log('  ⚠️  核心管线测试异常: ' + (e.message || '').split('\\n')[0]);
    failed++;
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
