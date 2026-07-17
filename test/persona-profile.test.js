#!/usr/bin/env node
/** test/persona-profile.test.js */
const { validateProfile, sanitize, DEFAULT_PROFILE, loadProfileFromJsonFile } = require('../src/persona/persona-profile.js');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }
function assertEqual(actual, expected, msg) { assert(actual === expected, `${msg} 期望 ${expected} 实际 ${actual}`); }

console.log('=== PersonaProfile 单元测试 ===\n');

assert(DEFAULT_PROFILE && DEFAULT_PROFILE.id === 'default', 'DEFAULT_PROFILE 含 default id');

const valid = validateProfile(DEFAULT_PROFILE);
assert(valid.valid === true, 'DEFAULT_PROFILE 校验通过');

const bad = validateProfile({ id: '', name: '' });
assert(bad.valid === false, '空 id/name 校验失败');

const s = sanitize({ id: 'p1', name: '测试', preset: 'p1', tone: { warmth: 0.8 }, values: { honesty: 0.9, kindness: 0.8, autonomy: 0.7, growth: 0.8, truth: 0.9 }, styleHints: { primary: 'neutral', secondaries: [] }, safety: { allowUnsafeMeta: false, allowedOverrides: [], forbidDirectives: [] } });
assert(s.id === 'p1', 'sanitize 保留 id');
assert(s.tone.warmth === 0.8, 'sanitize 保留 tone');

const tmpPath = '/tmp/hf-test-persona-profile.json';
fs.writeFileSync(tmpPath, JSON.stringify(s, null, 2));
const loaded = loadProfileFromJsonFile(tmpPath);
assert(loaded && loaded.id === 'p1', 'loadProfileFromJsonFile 成功');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed > 0 ? 1 : 0);
