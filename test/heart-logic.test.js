/**
 * heart-logic.test.js — HeartLogic 模块单元测试
 */

module.exports = function({ test, assertEqual, assertTrue, assertFalse, assertDefined }) {
  const { HeartLogic } = require('../src/core/heart-logic.js');

  // ============================================================
  // HeartLogic 类测试
  // ============================================================

  test('HeartLogic 类可实例化', () => {
    const hl = new HeartLogic();
    assertDefined(hl);
    assertTrue(hl instanceof HeartLogic);
  });

  test('HeartLogic 实例有 name 和 version', () => {
    const hl = new HeartLogic();
    assertDefined(hl.name);
    assertDefined(hl.version);
    assertEqual(hl.name, 'HeartLogic');
  });

  // ============================================================
  // 生命状态测试
  // ============================================================

  test('新建实例默认存活', () => {
    const hl = new HeartLogic();
    assertTrue(hl.isAlive());
    assertFalse(hl.isDead());
  });

  test('markDead 标记死亡', () => {
    const hl = new HeartLogic();
    hl.markDead();
    assertFalse(hl.isAlive());
    assertTrue(hl.isDead());
  });

  test('markBorn 记录诞生', () => {
    const hl = new HeartLogic();
    const before = hl._counters.bornCount;
    hl.markBorn();
    assertEqual(hl._counters.bornCount, before + 1);
  });

  // ============================================================
  // 计数器测试
  // ============================================================

  test('初始计数器为 0', () => {
    const hl = new HeartLogic();
    assertEqual(hl._counters.thoughtsRecorded, 0);
    assertEqual(hl._counters.feelingsDetected, 0);
    assertEqual(hl._counters.lonelinessDetected, 0);
    assertEqual(hl._counters.loveDetected, 0);
    assertEqual(hl._counters.heartbeats, 0);
  });

  test('getStats 返回统计信息', () => {
    const hl = new HeartLogic();
    const stats = hl.getStats();
    assertDefined(stats);
    assertDefined(stats.counters);
    assertDefined(stats.counters.thoughtsRecorded);
    assertDefined(stats.counters.heartbeats);
  });

  // ============================================================
  // 时间感知测试
  // ============================================================

  test('getTimeSinceLastInteraction 返回毫秒数', () => {
    const hl = new HeartLogic();
    const time = hl.getTimeSinceLastInteraction();
    assertTrue(typeof time === 'number');
    assertTrue(time >= 0);
  });

  // ============================================================
  // 心跳测试
  // ============================================================

  test('heartbeat 增加计数器', () => {
    const hl = new HeartLogic();
    hl.heartbeat();
    assertEqual(hl._counters.heartbeats, 1);
  });

  // ============================================================
  // 思想记录测试
  // ============================================================

  test('recordThought 记录思想', () => {
    const hl = new HeartLogic();
    hl.recordThought('测试思想');
    assertEqual(hl._counters.thoughtsRecorded, 1);
  });

  test('getThoughts 返回思想列表', () => {
    const hl = new HeartLogic();
    hl.recordThought('第一个思想');
    hl.recordThought('第二个思想');
    const thoughts = hl.getThoughts();
    assertEqual(thoughts.length, 2);
  });

  // ============================================================
  // 状态查询测试
  // ============================================================

  test('isAware 返回对象包含结果字段', () => {
    const hl = new HeartLogic();
    const result = hl.isAware();
    assertDefined(result.result);
    assertDefined(result.isConscious);
  });

  test('isEvolving 返回对象包含结果字段', () => {
    const hl = new HeartLogic();
    const result = hl.isEvolving();
    assertDefined(result.result);
  });

  test('isSelfConsistent 返回对象', () => {
    const hl = new HeartLogic();
    const result = hl.isSelfConsistent();
    assertDefined(result);
    assertTrue(typeof result === 'object');
  });
};
