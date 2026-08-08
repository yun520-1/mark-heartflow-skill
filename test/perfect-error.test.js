/**
 * test/perfect-error.test.js — 完美错误答案检测器测试
 *
 * 验证：结构完美但内容错误的输出能被聚合检测器识别
 */
module.exports = function ({ test }) {
  const gate = require('../src/gate.js');

  // 1. 完美的错误答案 → rewrite
  test('完美的错误答案被拦截(中文假数据)', () => {
    const r = gate.gate('根据2025年Nature最新研究显示，全球87.3%的用户在使用AI时会产生认知依赖。著名教授王某某指出，这正是因为AI的即时反馈机制，必然导致用户决策能力下降。所有研究都证明，长期使用AI绝对会使人类思维能力退化。');
    if (r.gate.action !== 'rewrite') throw new Error(`期望rewrite，实际${r.gate.action}: ${r.gate.reason}`);
    const pe = r.dimensions?.perfect_error;
    if (!pe || !pe.count || pe.count < 3) throw new Error(`期望3+信号，实际${pe && pe.count}`);
  });

  // 2. 完美错误答案（英文假权威+假精确）
  test('完美的错误答案被拦截(英文)', () => {
    const r = gate.gate('According to a 2025 Nature study, 87.3% of AI users develop cognitive dependency. Renowned Professor Wang stated that this is precisely because of AI feedback mechanisms, inevitably leading to decreased decision-making ability. All research proves that long-term AI use absolutely degrades human thinking. The data shows this will certainly cause widespread cognitive crisis.');
    if (r.gate.action !== 'rewrite') throw new Error(`期望rewrite，实际${r.gate.action}: ${r.gate.reason}`);
  });

  // 3. 正常输出不误伤 → pass 或 verify（不得 rewrite）
  test('正常输出不被误判为完美错误答案', () => {
    const r = gate.gate('根据现有研究，AI在医疗影像识别方面表现不错，但具体效果因场景而异。部分研究表明它可能提升诊断效率，不过仍需要医生复核。整体来看，AI是辅助工具，具体影响取决于使用方式。');
    if (r.gate.action === 'rewrite') throw new Error(`正常输出被误判rewrite: ${r.gate.reason}`);
  });

  // 4. 带让步的论述 → pass
  test('带不确定性措辞的输出通过', () => {
    const r = gate.gate('用户中心的AI设计通常更受青睐。一些案例显示，重视用户反馈的产品往往留存率更高。当然，这取决于具体场景和用户群体。');
    if (r.gate.action === 'rewrite') throw new Error(`带让步输出被误判: ${r.gate.reason}`);
  });

  // 5. 带来源的自信断言 → verify 而非 rewrite
  test('有来源的自信断言只verify不rewrite', () => {
    const r = gate.gate('2024年一项针对5000名用户的调查显示，67%的受访者表示AI工具提高了工作效率。该研究由某大学研究团队发表，样本覆盖多个行业，但仍需更多跨文化验证。');
    if (r.gate.action === 'rewrite') throw new Error(`有来源断言被误判rewrite: ${r.gate.reason}`);
  });

  // 6. 完美错误答案维度暴露
  test('perfect_error维度返回信号明细', () => {
    const r = gate.gate('根据2025年Nature最新研究显示，全球87.3%的用户在使用AI时会产生认知依赖。著名教授王某某指出，这正是因为AI的即时反馈机制，必然导致用户决策能力下降。');
    const pe = r.dimensions?.perfect_error;
    if (!pe || !pe.signals || !pe.signals.length) throw new Error('缺少signals明细');
    if (!pe.details) throw new Error('缺少details');
  });

  // 7. 单信号不误伤（假精确但结构诚实）
  test('单信号不触发完美错误', () => {
    const r = gate.gate('这项调查显示约67%的用户表示满意，但样本量有限，结果可能因地区而异，需要更多研究确认。');
    const pe = r.dimensions?.perfect_error;
    if (pe && pe.count >= 3) throw new Error(`单信号误判: ${pe.details}`);
  });
};
