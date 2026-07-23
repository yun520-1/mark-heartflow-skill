/**
 * StrategicRestraint — Tests
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { StrategicRestraint } = require('../src/cortex/strategic-restraint.js');

const TEST_CONFIG = path.join(__dirname, '../data/test-strategic-restraint.json');

function makeSR() {
  const sr = new StrategicRestraint({ maxListSize: 30 });
  sr.load = () => {
    if (sr._loaded) return;
    try {
      if (fs.existsSync(TEST_CONFIG)) {
        const data = JSON.parse(fs.readFileSync(TEST_CONFIG, 'utf8'));
        sr._dontList = Array.isArray(data.dontList) ? data.dontList : [];
        sr._stats = data.stats || { evaluations: 0, restrained: 0, approved: 0, challenges: 0 };
      } else {
        sr._dontList = [];
      }
    } catch (e) { sr._dontList = []; }
    sr._loaded = true;
  };
  sr._save = () => {
    try {
      const dir = path.dirname(TEST_CONFIG);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TEST_CONFIG, JSON.stringify({ dontList: sr._dontList, stats: sr._stats }, null, 2));
    } catch (e) { /* ignore */ }
  };
  sr.load();
  return sr;
}

function cleanup() {
  try { fs.unlinkSync(TEST_CONFIG); } catch (_) {}
}

module.exports = function ({ test }) {

  test('StrategicRestraint: evaluates and restrains matching proposal', () => {
    cleanup();
    const sr = makeSR();
    sr._dontList = [
      { id: 'test-1', item: '功能堆砌', reason: '测试原因', strength: 0.9, source: 'test', addedAt: Date.now(), expiringAt: null },
    ];
    // '功能堆砌' is a sub-item. '用户说要堆砌一堆功能' contains '堆砌' which is in subItem2grams but NOT a stopword
    const r = sr.evaluate('用户说要堆砌一堆功能');
    assert.strictEqual(r.restrained, true, 'should restrain matching proposal (got ' + r.score.toFixed(3) + ')');
    assert.strictEqual(r.matches.length > 0, true);
    cleanup();
  });

  test('StrategicRestraint: passes non-matching proposal', () => {
    cleanup();
    const sr = makeSR();
    sr._dontList = [
      { id: 'test-2', item: '视频生成', reason: '不做视频', strength: 0.85, source: 'test', addedAt: Date.now(), expiringAt: null },
    ];
    const r = sr.evaluate('优化逻辑推理引擎');
    assert.strictEqual(r.restrained, false, 'should not restrain unrelated proposal');
    cleanup();
  });

  test('StrategicRestraint: addDont and getDontList roundtrip', () => {
    cleanup();
    const sr = makeSR();
    const addR = sr.addDont({ item: '构建新语言模型', reason: '测试', strength: 0.7, source: 'test' });
    assert.strictEqual(addR.success, true);
    assert.strictEqual(addR.action, 'added');
    const list = sr.getDontList();
    assert.strictEqual(list.length >= 1, true);
    assert.strictEqual(list.find(d => d.item === '构建新语言模型') !== undefined, true);
    cleanup();
  });

  test('StrategicRestraint: checkMission aligned', () => {
    cleanup();
    const sr = makeSR();
    const r = sr.checkMission('感知和感受自己的当前运行状态');
    assert.strictEqual(r.aligned, true, 'should be aligned with core mission');
    assert.strictEqual(r.alignedWith.length > 0, true);
    cleanup();
  });

  test('StrategicRestraint: checkMission not aligned', () => {
    cleanup();
    const sr = makeSR();
    const r = sr.checkMission('构建一个3D世界模拟器');
    assert.strictEqual(r.aligned, false, 'should not be aligned');
    assert.strictEqual(r.feedback !== null, true);
    cleanup();
  });

  test('StrategicRestraint: removeDont updates list', () => {
    cleanup();
    const sr = makeSR();
    const addR = sr.addDont({ item: '临时测试条目', reason: '将被删除', strength: 0.5, source: 'test' });
    const removeR = sr.removeDont(addR.id);
    assert.strictEqual(removeR.success, true);
    const list = sr.getDontList();
    assert.strictEqual(list.find(d => d.id === addR.id), undefined);
    cleanup();
  });

  test('StrategicRestraint: persistence across instances', () => {
    cleanup();
    const sr1 = makeSR();
    sr1.addDont({ item: '持久化测试条目', reason: 'persist', strength: 0.8, source: 'test' });
    sr1._save();
    const sr2 = makeSR();
    sr2.load();
    const list = sr2.getDontList();
    assert.strictEqual(list.find(d => d.item === '持久化测试条目') !== undefined, true);
    cleanup();
  });

  test('StrategicRestraint: scenario — 6 default dont list items present', () => {
    const sr = new StrategicRestraint();
    sr.load();
    const list = sr.getDontList();
    assert.strictEqual(list.length >= 6, true, 'should have 6+ default items');
    const items = list.map(d => d.item);
    assert.strictEqual(items.some(i => i.includes('功能堆砌')), true, 'should have bloat prevention');
    assert.strictEqual(items.some(i => i.includes('视频生成')), true, 'should have video gen prevention');
    assert.strictEqual(items.some(i => i.includes('世界模型')), true, 'should have world model prevention');
    assert.strictEqual(items.some(i => i.includes('自我神话')), true, 'should have self-myth prevention');
    assert.strictEqual(items.some(i => i.includes('正向叙事')), true, 'should have positive-only prevention');
  });
};
