/**
 * SelfScanner TDD 测试
 * 验证：进化引擎能基于真实代码库产出具体弱点（用户定义的真·自我升级）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-scan-'));
  // 造一个有弱点的 mini 工程
  const srcDir = path.join(root, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'big.js'),
    '// TODO: refactor\nfunction huge() {\n' + '  let x=1;\n'.repeat(350) + '}\n');
  fs.writeFileSync(path.join(srcDir, 'quiet.js'),
    'function f(){ try{ doThing(); } catch(e){} }\n');
  // 有测试覆盖的模块
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.writeFileSync(path.join(root, 'test', 'big.test.js'), '// test for big\n');
  return root;
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('扫描出 TODO 计数', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    assertTrue(r.todoCount >= 1);
  });

  test('扫描出超长函数', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    assertTrue(r.longFunctions.length >= 1);
    assertTrue(r.longFunctions[0].length > 300);
  });

  test('扫描出沉默空 catch', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    assertTrue(r.silentCatches >= 1);
  });

  test('识别已测试模块不报未测试', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    // big.js 有 big.test.js 覆盖 -> 不应在 untestedModules
    assertFalse(r.untestedModules.some(m => m.includes('big.js')));
  });

  test('只读扫描不改文件', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const root = tmpRoot();
    const before = fs.readFileSync(path.join(root, 'src', 'quiet.js'), 'utf8');
    new SelfScanner(root).scan();
    const after = fs.readFileSync(path.join(root, 'src', 'quiet.js'), 'utf8');
    assertEqual(before, after);
  });
}

module.exports = run;
