#!/usr/bin/env node
/** test/style-engine.test.js */
const { StyleEngine } = require('../src/dialogue/style-engine.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== StyleEngine 单元测试 ===\n');

const engine = new StyleEngine({ defaultMode: 'neutral' });
assert(engine, 'StyleEngine 实例化');
assert(engine.currentMode === 'neutral', 'currentMode 为 neutral');
assert(engine.availableModes.includes('empathy'), 'availableModes 含 empathy');

const auto1 = engine.autoSelect({ input: '安慰一下我', tone: '关怀' });
assert(auto1 === 'empathy', 'autoSelect 选中 empathy: ' + auto1);

const auto2 = engine.autoSelect({ input: 'normal chat' });
assert(auto2 === 'neutral', 'autoSelect 默认 neutral: ' + auto2);

const applied = engine.apply('这是一个事实陈述。', 'critical');
assert(applied.mode === 'critical', 'apply mode 正确');
assert(applied.preserveFacts === true, 'preserveFacts 为 true');
assert(typeof applied.wrappedText === 'string', 'wrappedText 为字符串');

const safety = engine.verifyStyleSafety('原始文本', applied);
assert(safety && typeof safety.passed === 'boolean', 'verifyStyleSafety 返回 passed');

const setOk = engine.setMode('humor');
assert(setOk === true, 'setMode humor 成功');
assert(engine.currentMode === 'humor', 'currentMode 切换为 humor');

engine.setMode('neutral');
const personaOverride = { styleMode: 'empathy' };
engine.setPersona(personaOverride);
assert(engine.currentMode === 'empathy', 'persona override 生效');

engine.reset();
assert(engine.currentMode === 'neutral', 'reset 恢复默认');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
