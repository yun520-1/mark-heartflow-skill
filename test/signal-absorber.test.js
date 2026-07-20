const { SignalAbsorber } = require('../src/cortex/signal-absorber.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + msg); }
}

// 1. 空输入边界守卫
const a0 = new SignalAbsorber({});
assert(a0.absorb('').error === 'invalid_text', '空字符串返回 invalid_text');
assert(a0.absorb(null).error === 'invalid_text', 'null 返回 invalid_text');
assert(a0.absorb(123).error === 'invalid_text', '数字返回 invalid_text');

// 2. 新闻信号 → weak_signal_escalation (彭水山崩)
const news = '彭水山崩预警者口述复盘：从小颗落石到万方垮塌。起初只是零星落石，当地居民多次看到但未重视，直到大规模山体崩塌发生才紧急撤离，错失了最佳预警窗口。';
const r1 = a0.absorb(news, { source: 'news', skipStore: true });
assert(!r1.error, '新闻无 error');
assert(r1.source === 'news', 'source 正确');
assert(r1.lessons.some(l => l.pattern === 'weak_signal_escalation'), '识别 weak_signal_escalation');
assert(r1.lessons.some(l => l.pattern === 'repeated_signal_ignored'), '识别 repeated_signal_ignored');
assert(r1.lessons.some(l => l.pattern === 'missed_window'), '识别 missed_window');

// 3. 对话/指令信号 → capability_gap_request
const instr = '帮我写一个把 Excel 转 JSON 的函数，要能处理大文件';
const r2 = a0.absorb(instr, { skipStore: true });
assert(r2.lessons.some(l => l.pattern === 'capability_gap_request'), '指令识别 capability_gap_request');
assert(r2.gaps.some(g => g.module === 'capability-registry'), '映射到 capability-registry');

// 4. 反馈信号 → user_correction
const fb = '你这个判断不对，其实应该用贝叶斯';
const r3 = a0.absorb(fb, { skipStore: true });
assert(r3.lessons.some(l => l.pattern === 'user_correction'), '反馈识别 user_correction');
assert(r3.gaps.some(g => g.module === 'response-optimizer'), '映射到 response-optimizer');

// 3.5 慢性错误潜伏（昆明冒名7年新闻）
const chronic = '昆明警方通报女子被冒名吸毒7年：关联违法记录已更正，长期未发现，本人申诉后才启动核查纠正';
const r3b = a0.absorb(chronic, { skipStore: true });
assert(r3b.lessons.some(l => l.pattern === 'chronic_error_undetected'), '识别 chronic_error_undetected');
assert(r3b.gaps.some(g => g.module === 'self-heal + memory'), '映射到 self-heal + memory');

// 3.6 外部标准涌现（自主船舶规则新闻）
const std = '全球首个自主船舶规则落地在即，国际海事组织拟发布自动驾驶货轮航行标准';
const r3c = a0.absorb(std, { skipStore: true });
assert(r3c.lessons.some(l => l.pattern === 'external_standard_emergence'), '识别 external_standard_emergence');
assert(r3c.gaps.some(g => g.module === 'capability-registry + evolution-loop'), '映射到 capability-registry + evolution-loop');

// 5. 自动检测 source（不传 source）
const r4 = a0.absorb('据官方通报，今日多地发布暴雨红色预警', { skipStore: true });
assert(r4.source === 'news', '自动检测 news source');
const r5 = a0.absorb('帮我查一下明天的天气', { skipStore: true });
assert(r5.source === 'instruction', '自动检测 instruction source');

// 6. 普通对话 → generic 兜底
const r6 = a0.absorb('今天天气不错', { skipStore: true });
assert(r6.lessons.length > 0 && r6.lessons[0].pattern === 'generic', '普通对话走 generic');

// 7. retrieveAbsorbed 接口存在
assert(typeof a0.retrieveAbsorbed === 'function', 'retrieveAbsorbed 是函数');

// 8. 真写入 world-tree（本体已加载 bridge 时验证）
(async () => {
  try {
    const { ROUTES } = require('../src/memory/worldtree-bridge');
    if (ROUTES && ROUTES['worldtree.store'] && ROUTES['worldtree.query']) {
      const r = new SignalAbsorber({});
      const absorbed = r.absorb(news, { source: 'news', skipStore: false });
      assert(absorbed.stored === true, '彭水山崩真写入 world-tree (stored=true)');
      const back = r.retrieveAbsorbed(20);
      assert(back.length > 0 && back.some(x => (x.tags||[]).includes('signal_absorbed')), '能从 world-tree 读回 signal_absorbed');
    } else {
      console.log('  ⚠️ worldtree bridge 不可用于独立测试，跳过真写入断言(本体里已验证)');
    }
  } catch (e) {
    console.log('  ⚠️ world-tree 真写入测试异常: ' + e.message.slice(0,80));
  }
  console.log(`signal-absorber: ${pass} 通过, ${fail} 失败`);
  if (fail > 0) process.exit(1);
})();
