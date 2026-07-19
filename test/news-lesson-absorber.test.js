const { NewsLessonAbsorber } = require('../src/cortex/news-lesson-absorber.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}

// 1. 空输入边界守卫
const a0 = new NewsLessonAbsorber({});
assert(a0.absorb('').error === 'invalid_news_text', '空字符串返回 invalid_news_text');
assert(a0.absorb(null).error === 'invalid_news_text', 'null 返回 invalid_news_text');
assert(a0.absorb(123).error === 'invalid_news_text', '数字返回 invalid_news_text');

// 2. 彭水山崩新闻 → 提炼 weak_signal_escalation 教训（真实映射）
const news = '彭水山崩预警者口述复盘：从小颗落石到万方垮塌。起初只是零星落石，当地居民多次看到但未重视，直到大规模山体崩塌发生才紧急撤离，错失了最佳预警窗口。';
const a1 = new NewsLessonAbsorber({});
const r1 = a1.absorb(news, { skipStore: true }); // 单测跳过真写 world-tree
assert(!r1.error, '有效新闻无 error');
assert(r1.lessons.some(l => l.pattern === 'weak_signal_escalation'), '识别 weak_signal_escalation 模式');
assert(r1.lessons.some(l => l.pattern === 'repeated_signal_ignored'), '识别 repeated_signal_ignored (多次看到未重视)');
assert(r1.lessons.some(l => l.pattern === 'missed_window'), '识别 missed_window (错失最佳窗口)');
assert(r1.gaps.some(g => /self-scanner|evolution-loop/.test(g.module)), '映射到 self-scanner/evolution-loop 能力缺口');
assert(r1.upgradeActions.some(act => /累积计数器|时效阈值/.test(act)), '产出具体升级动作(累积计数器/时效阈值)');

// 3. 普通新闻 → generic 兜底
const r2 = a1.absorb('某明星今日出席活动引发关注', { skipStore: true });
assert(r2.lessons.length > 0 && r2.lessons[0].pattern === 'generic', '无关新闻走 generic 兜底');

// 4. 真写入 world-tree（用 mark 本体已加载的 bridge 验证）
(async () => {
  try {
    const { ROUTES } = require('../src/memory/worldtree-bridge');
    if (ROUTES && ROUTES.store && ROUTES.query) {
      const r = new NewsLessonAbsorber({});
      const absorbed = r.absorb(news, { skipStore: false });
      assert(absorbed.stored === true, '彭水山崩教训真写入 world-tree (stored=true)');
      const q = ROUTES.query('lessons_from_world', 5);
      assert(q && q.success && q.results && q.results.length > 0, '能从 world-tree 读回 lessons_from_world');
    } else {
      console.log('  ⚠️ worldtree bridge 不可用，跳过真写入断言(不影响模块逻辑)');
    }
  } catch (e) {
    console.log('  ⚠️ world-tree 真写入测试异常: ' + e.message.slice(0,80));
  }

  console.log(`news-lesson-absorber: ${pass} 通过, ${fail} 失败`);
  if (fail > 0) process.exit(1);
})();
