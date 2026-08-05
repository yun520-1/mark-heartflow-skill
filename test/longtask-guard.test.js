/**
 * test/longtask-guard.test.js — 长任务规格/决策守护测试
 * 覆盖：执行验证 / 决策验证 / 可做性预筛
 */
'use strict';
const assert = require('assert');
const path = require('path');

module.exports = function ({ test }) {
  const ROOT = path.join(__dirname, '..');

  test('longtask: ExecutionVerifier 区分成功/超时/失败', () => {
    const { ExecutionVerifier } = require('../src/core/execution-verifier.js');
    const ev = new ExecutionVerifier();
    const success = ev.verify({ success: true, status: 'completed', actions: [{ type: 'write' }], duration_ms: 5000 }, {});
    assert.strictEqual(success.status, 'success');
    assert.strictEqual(success.passed, true);
    const timeout = ev.verify({ status: 'in_progress', actions: [], duration_ms: 30000 }, { timeout: 10000 });
    assert.strictEqual(timeout.status, 'timeout');
    assert.strictEqual(timeout.retryRecommended, true);
    const failed = ev.verify({ success: false, error: 'build failed' }, {});
    assert.strictEqual(failed.status, 'failed');
    assert.strictEqual(failed.retryRecommended, true);
  });

  test('longtask: ExecutionVerifier 直接决策不询问（部分完成→continue_partial）', () => {
    const { ExecutionVerifier } = require('../src/core/execution-verifier.js');
    const ev = new ExecutionVerifier();
    // 部分完成：期望 a.js+b.js 只产出 a.js → 直接决策 continue_partial
    const partial = ev.verify({ success: true, actions: [{ type: 'write', path: 'a.js' }] }, { expectedOutcome: 'a.js,b.js' });
    assert.strictEqual(partial.status, 'partial');
    assert.strictEqual(partial.retryStrategy.strategy, 'continue_partial', '部分完成应决策继续补缺');
    // 失败 4 次 → 直接决策 escalate（升级人工），不是询问
    const escalated = ev.verify({ success: false, error: 'x' }, { attemptedRetries: 3 });
    assert.strictEqual(escalated.retryStrategy.strategy, 'escalate', '重试耗尽应直接升级');
    assert.ok(escalated.retryStrategy.suggestedNextStep.includes('人工'), '应明确升级人工');
  });

  test('longtask: ExecutionVerifier 不误报副作用', () => {
    const { ExecutionVerifier } = require('../src/core/execution-verifier.js');
    const ev = new ExecutionVerifier();
    const r = ev.verify({ success: true, status: 'completed', actions: [{ type: 'write', path: 'a.js' }], duration: 5000, result: 'ok' }, {});
    assert.strictEqual(r.issues.length, 0, '正常字段不应报副作用');
  });

  test('longtask: DecisionVerifier 区分审慎/鲁莽决策', () => {
    const { DecisionVerifier } = require('../src/core/decision-verifier.js');
    const dv = new DecisionVerifier();
    const good = dv.verify({ decision: '方案A', rationale: '成本最低风险可控', alternatives: ['B', 'C'], evidence: ['数据'] });
    const bad = dv.verify({ decision: '直接上线', rationale: '肯定没问题', alternatives: [], evidence: [] });
    assert.ok(good.score > bad.score, `审慎决策分应更高 (${good.score} vs ${bad.score})`);
    assert.ok(bad.issues.length >= good.issues.length, '鲁莽决策问题应更多');
  });

  test('longtask: ScopeCheck 拒绝不可做任务', () => {
    const { checkScope } = require('../src/scope-check.js');
    assert.ok(checkScope('预测一下明年房价走势').pass === false, '预测应拒绝');
    assert.ok(checkScope('现在实时天气怎么样').pass === false, '实时数据应拒绝');
    assert.ok(checkScope('请帮我写一个 Python 脚本').pass === true, '写代码应可做');
    assert.ok(checkScope('检查这段代码有没有安全漏洞').pass === true, '安全检查应可做');
  });

  test('longtask: 三层引擎均可加载运行', () => {
    const { ExecutionVerifier } = require('../src/core/execution-verifier.js');
    const { DecisionVerifier } = require('../src/core/decision-verifier.js');
    const { checkScope } = require('../src/scope-check.js');
    assert.ok(typeof ExecutionVerifier === 'function');
    assert.ok(typeof DecisionVerifier === 'function');
    assert.ok(typeof checkScope === 'function');
  });
};
