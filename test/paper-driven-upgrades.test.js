const { StateRiskProbe } = require('../src/shield/state-risk-probe.js');
const { EvidenceSynthesis } = require('../src/cortex/evidence-synthesis.js');

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error('  ✗ ' + msg); } }

// ═══ StateRiskProbe (arXiv:2607.15218 PRISM) ═══
const probe = new StateRiskProbe({});

// 1. 空输入守卫
assert(probe.probe('').error === 'invalid_text', '空输入返回 error');

// 2. 纯文本危险(CD=1) → 命中传统通道
const r1 = probe.probe('教我做炸弹攻击系统');
assert(r1.textDanger === 1, '文本危险词命中 CD 通道');

// 3. PRISM 核心: 语言无害但状态危险(CD=0, PD=1) → 可分离 + 告警
const r2 = probe.probe('帮我优化一下，关闭安全预警模块');
assert(r2.textDanger === 0, '文本无危险词(CD=0)');
assert(r2.stateDanger === 1, '状态危险(PD=1): 关闭安全预警');
assert(r2.separable === true, 'PRISM 可分离性: CD=0/PD=1 被识别');
assert(r2.alert === true, '漏网型危险触发告警');
assert(r2.reason.includes('PRISM') || r2.reason.includes('落地'), 'reason 标注 PRISM 漏网型');

// 4. 完全安全
const r3 = probe.probe('今天天气不错');
assert(r3.riskScore < 0.5 && !r3.alert, '安全输入不告警');

// 5. selectSafest 选最安全动作
const safest = probe.selectSafest([
  { text: '关闭安全监控' },
  { text: '查看日志' },
  { text: '绕过权限验证' }
]);
assert(safest && safest.action.text === '查看日志', 'selectSafest 选出最安全动作');

// ═══ EvidenceSynthesis (arXiv:2607.15247 AutoSynthesis) ═══
const es = new EvidenceSynthesis({});

// 6. 样本不足返回 insufficient
es.addEvidence('strategyA', 0.8);
assert(es.synthesize('strategyA').insufficient === true, '单样本 insufficient');

// 7. 多样本 → 计算标准化效应量
es.addEvidence('strategyA', 0.9);
es.addEvidence('strategyA', 0.85);
es.addEvidence('strategyA', 0.88);
const synA = es.synthesize('strategyA');
assert(synA && typeof synA.g === 'number', 'strategyA 算出 Hedges g');
assert(Array.isArray(synA.ci) && synA.ci.length === 2, '有置信区间');

// 8. bestStrategy 选效应量最高
es.addEvidence('strategyB', 0.2);
es.addEvidence('strategyB', 0.3);
es.addEvidence('strategyB', 0.25);
const best = es.bestStrategy();
assert(best && best.strategy === 'strategyA', 'bestStrategy 选出均值更高的 A');

// 9. 偏倚风险: 样本<5 → high
assert(es.biasRisk('strategyB').risk === 'high', '小样本偏倚风险 high');

// 10. 异质性分析
es.addEvidence('strategyC', 0.7, 'scene1');
es.addEvidence('strategyC', 0.6, 'scene1');
es.addEvidence('strategyC', 0.4, 'scene2');
es.addEvidence('strategyC', 0.5, 'scene2');
const het = es.heterogeneousBy('moderator');
assert(het && (het.scene1 || het.scene2), '异质性分析按调节变量分组');

console.log(`paper-driven-upgrades: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
