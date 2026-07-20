/**
 * SelfScanner TDD 测试
 * 验证：进化引擎能基于真实代码库产出具体弱点（用户定义的真·自我升级）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-scan-'));
  const srcDir = path.join(root, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'big.js'),
    '// TODO: refactor\nfunction huge() {\n' + '  let x=1;\n'.repeat(350) + '}\n');
  fs.writeFileSync(path.join(srcDir, 'quiet.js'),
    'function f(){ try{ doThing(); } catch(e){} }\n');
  // 防御性 + 注释行样例
  fs.writeFileSync(path.join(srcDir, 'defensive.js'),
    'try { x(); } catch(e){} // 防御性: 模块加载失败不阻断主流程\n' +
    'function g(){ try{ y(); } catch(e){} /* 普通沉默 */ }\n' +
    '// catch(e){} 这是注释不是代码\n');
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

  test('排除防御性注释的沉默 catch', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    assertTrue(r.defensiveCatches >= 1); // defensive.js 的防御性 catch 计入
  });

  test('普通沉默 catch 计入 silentCatches', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    // quiet.js 1 + defensive.js 普通 1 = 2
    assertTrue(r.silentCatches >= 2);
  });

  test('注释行中的 catch 描述不算', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
    // 注释行 "// catch(e){} 这是注释" 不计入 silentCatches
    assertFalse(r.silentCatches >= 3); // 不会因注释行虚高
  });

  test('识别已测试模块不报未测试', () => {
    const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
    const s = new SelfScanner(tmpRoot());
    const r = s.scan();
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
