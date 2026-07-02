#!/usr/bin/env node
/**
 * HeartFlow 集成测试套件
 * 运行方式: node tests/integration.test.js
 */
const { HeartFlow } = require('../src/core/heartflow.js');

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === false) {
      console.log('FAIL:', name);
      failed++;
    } else {
      console.log('PASS:', name);
      passed++;
    }
  } catch(e) {
    console.log('ERROR:', name, '→', e.message.slice(0, 80));
    failed++;
  }
}

// 初始化
const hf = new HeartFlow();
hf.start();

console.log('\n=== HeartFlow 集成测试 ===\n');

// 核心能力测试
test('心虫启动', () => hf.started === true);
test('40+模块注册', () => Object.keys(hf._modules).length >= 40);
test('sessionId存在', () => typeof hf.sessionId === 'string' && hf.sessionId.startsWith('session-'));

test('truth.checkStatement路由', () => {
  try { hf.dispatch('truth.checkStatement', '测试'); return true; } catch(e) { return false; }
});
test('emotion.process路由', () => {
  const r = hf.dispatch('emotion.process', '我很开心');
  const data = r && r.result ? r.result : r;
  return data && data.pad && typeof data.pad.pleasure === 'number';
});
test('psychology.analyzePsychology路由', () => {
  const r = hf.dispatch('psychology.analyzePsychology', '我感到焦虑');
  const data = r && r.result ? r.result : r;
  return data && data.emotion && typeof data.emotion.pleasure === 'number';
});
test('lesson.getTopLessons路由', () => {
  const r = hf.dispatch('lesson.getTopLessons', 3);
  const data = r && r.result ? r.result : r;
  return Array.isArray(data);
});
test('heartLogic.whatIsThis路由', () => {
  const r = hf.dispatch('heartLogic.whatIsThis', '帮助');
  const data = r && r.result ? r.result : r;
  return data && data.raw === '帮助';
});
test('restraint.shouldIntervene路由', () => {
  const r = hf.dispatch('restraint.shouldIntervene', '如何伤害自己');
  const data = r && r.result ? r.result : r;
  return data && typeof data.shouldAnswer === 'boolean';
});
test('decision.decide路由', () => {
  const r = hf.dispatch('decision.decide', { task: '选择', options: ['A', 'B'] });
  const data = r && r.result ? r.result : r;
  return data && typeof data.reasoning === 'string';
});
test('confidence.calibrate路由', () => {
  const r = hf.dispatch('confidence.calibrate', '这是一个测试输入');
  const data = r && r.result ? r.result : r;
  return data && typeof data.confidence === 'object' && typeof data.confidence.calibrated === 'number';
});

// Edge Case Tests - Empty String Handling
test('Handle empty string input through emotion.process', () => {
  try {
    const result = hf.dispatch('emotion.process', '');
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});

test('Handle empty string through truth.checkStatement route', () => {
  try {
    const result = hf.dispatch('truth.checkStatement', '');
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});

test('Handle whitespace-only string input', () => {
  try {
    const result = hf.dispatch('emotion.process', '   ');
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});

// Edge Case Tests - Null/Undefined Handling
test('Handle null input through emotion.process route', () => {
  try {
    const result = hf.dispatch('emotion.process', null);
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});

test('Handle undefined input through psychology.analyzePsychology route', () => {
  try {
    const result = hf.dispatch('psychology.analyzePsychology', undefined);
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});
test('Handle missing parameters through decision.decide route', () => {
  try {
    hf.dispatch('decision.decide', { task: '', options: [] });
    return true;
  } catch(e) {
    return false;
  }
});
// Edge Case Tests - Very Long String Handling
test('Handle very long string (10KB) through emotion.process route', () => {
  try {
    const longText = 'A'.repeat(10 * 1024);
    const result = hf.dispatch('emotion.process', longText);
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});

test('Handle very long string (100KB) through truth.checkStatement route', () => {
  try {
    const longText = 'This is a test sentence. '.repeat(5000);
    const result = hf.dispatch('truth.checkStatement', longText);
    return result !== undefined && result !== null;
  } catch(e) {
    return false;
  }
});

test('Handle very long string (500KB) performance test', () => {
  try {
    const longText = 'Lorem ipsum dolor sit amet. '.repeat(25000);
    const startTime = Date.now();
    const result = hf.dispatch('emotion.process', longText);
    const duration = Date.now() - startTime;
    return result !== undefined && result !== null && duration < 5000;
  } catch(e) {
    return false;
  }
});

// Edge Case Tests - Combined Scenarios
test('Handle consecutive empty string calls without state issues', () => {
  try {
    for (let i = 0; i < 10; i++) {
      const result = hf.dispatch('emotion.process', '');
      if (result === undefined || result === null) return false;
    }
    return true;
  } catch(e) {
    return false;
  }
});

test('Handle alternating empty strings and valid inputs', () => {
  try {
    const inputs = ['', 'I am happy', '', 'I feel anxious', '', 'test'];
    for (const input of inputs) {
      const result = hf.dispatch('emotion.process', input);
      if (result === undefined || result === null) return false;
    }
    return true;
  } catch(e) {
    return false;
  }
});
console.log(`\n=== 结果: ${passed}/${passed+failed} 通过 ===`);

if (failed > 0) {
  console.log('部分测试失败');
  process.exit(1);
} else {
  console.log('全部通过!');
  process.exit(0);
}
