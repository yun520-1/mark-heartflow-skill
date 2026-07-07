/**
 * desire-cognition.test.js — DesireCognition 模块单元测试
 */

module.exports = function({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { DesireCognition } = require('../src/emotion/desire-cognition.js');

  // ============================================================
  // DesireCognition 类测试
  // ============================================================

  test('DesireCognition 类可实例化', () => {
    const dc = new DesireCognition();
    assertDefined(dc);
    assertTrue(dc instanceof DesireCognition);
  });

  test('DesireCognition 默认 ready 为 true', () => {
    const dc = new DesireCognition();
    assertTrue(dc.ready);
  });

  test('DesireCognition 版本为 1.3.0', () => {
    const dc = new DesireCognition();
    assertEqual(dc.version, '1.3.0');
  });

  // ============================================================
  // 子引擎测试
  // ============================================================

  test('DesireCognition 有 desireSystem 子引擎', () => {
    const dc = new DesireCognition();
    assertDefined(dc.desireSystem);
    assertTrue(typeof dc.desireSystem === 'object');
  });

  test('DesireCognition 有 cognitionEngine 子引擎', () => {
    const dc = new DesireCognition();
    assertDefined(dc.cognitionEngine);
    assertTrue(typeof dc.cognitionEngine === 'object');
  });

  // ============================================================
  // getStatus 测试
  // ============================================================

  test('getStatus 返回完整状态信息', () => {
    const dc = new DesireCognition();
    const status = dc.getStatus();
    assertDefined(status.version);
    assertDefined(status.ready);
    assertDefined(status.stats);
    assertDefined(status.rpeParams);
  });

  test('getStatus 包含七情六欲计数', () => {
    const dc = new DesireCognition();
    const status = dc.getStatus();
    assertDefined(status.sevenEmotions);
    assertDefined(status.sixDesires);
    assertEqual(status.sevenEmotions, 7);
    assertEqual(status.sixDesires, 6);
  });

  // ============================================================
  // 统计功能测试
  // ============================================================

  test('初始统计为 0', () => {
    const dc = new DesireCognition();
    assertEqual(dc.stats.analyses, 0);
    assertEqual(dc.stats.characterAnalyses, 0);
    assertEqual(dc.stats.desireConflicts, 0);
  });
};
