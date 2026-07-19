const { IntentClassifier } = require('../src/bridge/intent-classifier.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}

const ic = new IntentClassifier({});
assert(typeof ic.classify === 'function', 'classify 方法存在');

// 1. 中文口语意图正确分类（修复前大量漏分类）
const cases = [
  ['帮我写个函数', 'create'],
  ['搞一个脚本', 'create'],
  ['写一个排序算法', 'create'],
  ['帮我看看这段代码', 'analyze'],
  ['分析一下差异', 'analyze'],
  ['这个方案怎么样', 'evaluate'],
  ['好不好', 'evaluate'],
  ['跑一下代码', 'execute'],
  ['测试一下', 'execute'],
  ['启动服务', 'execute'],
  ['什么是闭包', 'inquire'],
  ['你是谁', 'meta'],
];
for (const [inp, expect] of cases) {
  const r = ic.classify(inp);
  assert(r.primary === expect, `classify("${inp}") 应为 ${expect}, 实际 ${r.primary} (conf=${r.confidence})`);
  assert(r.confidence > 0, `classify("${inp}") 置信度应 > 0, 实际 ${r.confidence}`);
}

// 2. 空输入 → primary=null + error 标记（不返回假正常意图）
const empty = ic.classify('');
assert(empty.primary === null, '空字符串 primary=null');
assert(empty.error === 'invalid_input', '空字符串 error=invalid_input');
const nil = ic.classify(null);
assert(nil.primary === null, 'null primary=null');
const num = ic.classify(123);
assert(num.primary === null, '数字 primary=null');

// 3. context 注入合法类别被接受，非法类别被忽略
const withCtx = ic.classify('随便说点', { whatIsThis: { category: 'create' } });
assert(withCtx.primary === 'create', 'context 合法类别 create 生效');
const badCtx = ic.classify('随便说点', { whatIsThis: { category: 'injected_evil' } });
assert(badCtx.primary !== 'injected_evil', 'context 非法类别被忽略(防注入)');

// 4. 多意图歧义检测
const ambig = ic.classify('帮我写一个分析脚本并运行');
assert(Array.isArray(ambig.allIntents), 'allIntents 为数组');

console.log(`intent-classifier: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
