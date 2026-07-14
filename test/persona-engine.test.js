#!/usr/bin/env node
/** test/persona-engine.test.js */
const { PersonaEngine } = require('../src/persona/persona-engine.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== PersonaEngine 单元测试 ===\n');

const engine = new PersonaEngine();
assert(engine, 'PersonaEngine 实例化');
assert(engine.name === 'persona', 'name 正确');

const socraticProfile = {
  id: 'socratic',
  name: '苏格拉底',
  preset: 'socratic',
  tone: { warmth: 0.6, directness: 0.8, formality: 0.5, playfulness: 0.3, verbosity: 'rich' },
  values: { honesty: 0.95, kindness: 0.75, autonomy: 0.9, growth: 0.95, truth: 0.95 },
  styleHints: { primary: 'critical', secondaries: ['neutral'] },
  safety: { allowUnsafeMeta: false, allowedOverrides: [], forbidDirectives: [] },
  bigFiveOverrides: { O: 9, C: 7, E: 5, A: 6, N: 3 },
  philosophyBias: { utilitarian: 0.25, deontological: 0.35, virtue: 0.25, care: 0.15 }
};

const loaded = engine.load(socraticProfile);
assert(loaded && loaded.loaded === true, 'load profile 成功');
assert(loaded.profile && loaded.profile.id === 'socratic', 'profile id 正确');

const current = engine.getCurrent();
assert(current && current.id === 'socratic', 'getCurrent 返回当前档');

const history = engine.getHistory();
assert(Array.isArray(history), 'getHistory 是数组');

const gentleProfile = {
  id: 'gentleCompanion',
  name: '温柔陪伴',
  preset: 'gentleCompanion',
  tone: { warmth: 0.95, directness: 0.35, formality: 0.25, playfulness: 0.4, verbosity: 'balanced' },
  values: { honesty: 0.9, kindness: 0.98, autonomy: 0.7, growth: 0.75, truth: 0.85 },
  styleHints: { primary: 'empathy', secondaries: ['neutral'] },
  safety: { allowUnsafeMeta: false, allowedOverrides: [], forbidDirectives: [] },
  bigFiveOverrides: { O: 6, C: 6, E: 4, A: 9, N: 4 },
  philosophyBias: { utilitarian: 0.15, deontological: 0.15, virtue: 0.3, care: 0.4 }
};

const switched = engine.switch('gentleCompanion', { tone: { warmth: 0.9 } });
assert(switched && switched.loaded === true, 'switch 成功');
assert(switched.profile.tone.warmth === 0.9, 'overrides 生效');

const desc = engine.describe();
assert(desc && desc.name === 'persona', 'describe 返回 name');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
