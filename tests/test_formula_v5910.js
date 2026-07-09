/**
 * 心虫 v5.9.10 全面优化集成测试
 * B3: 第三批 8 公式  A2: 模块深度接入  + 回归
 */
let pass = 0, fail = 0;
function ok(name, cond, extra='') {
  if (cond) { pass++; console.log(`  ✅ ${name} ${extra}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}

const { getFormulaRegistry } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-registry.js');
const { getFormulaBridge } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-bridge.js');
const { getFormulaMatcher } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-matcher.js');

console.log('=== B3. 第三批 8 公式 ===');
const b = getFormulaBridge();
let bp = 0;
function chk(n, c) { if (c) bp++; else ok('B3:'+n, false); }
chk('irt4pl', Math.abs(b.irt4pl(0,1,0,0,1) - 0.5) < 1e-9);
chk('irt4pl 上限', b.irt4pl(3,1,0,1,0) > 0.95);
chk('irtTestInformation', b.irtTestInformation(0, [{a:1,b:0},{a:1.2,b:0.5}]) > 0);
chk('pca_variance', b.pcaVarianceContribution([0.5,0.3,0.2], 1) > 0.4 && b.pcaVarianceContribution([0.5,0.3,0.2],1) <= 0.51);
chk('kmo_test', Math.abs(b.kmoTest(0.8,0.2) - 0.8) < 1e-9);
chk('bartlett_test', b.bartlettTest(100,5,0.5) > 0);
chk('carnap_confirmation', Math.abs(b.carnapConfirmation(0.8,0.3) - 0.5) < 1e-9);
chk('matching_pennies', b.matchingPenniesEquilibrium() === 0.5);
chk('brain_network_modularity', typeof b.brainNetworkModularity(5,10,2) === 'number');
ok('B3 批量 9/9', bp === 9, 'pass='+bp);

// registry 调用
const reg = getFormulaRegistry();
ok('reg.call irt4pl', Math.abs(reg.call('personality_measure','irt_4pl',0,1,0,0,1) - 0.5) < 1e-9);
ok('reg.call kmo_test', reg.call('memory_activation','kmo_test',0.8,0.2) === 0.8);
ok('reg.call matching_pennies', reg.call('decision_utility','matching_pennies') === 0.5);
const sum = reg.summary();
const total = Object.values(sum).reduce((a,c)=>a+c,0);
ok('registry 原语 >= 68', total >= 68, 'total='+total);

console.log('=== A2. 模块深度接入 ===');
// 心理引擎 PHQ-9/GAD-7
const { AIPsychologyEngine } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/psychology/ai-psychology-engine.js');
const psy = new AIPsychologyEngine();
const mh = psy.assessMentalHealth({ depression: [2,1,3,0,2,1,0,1,2], anxiety: [1,2,0,1,3,0,1] });
ok('心理自评 PHQ-9 总分', mh.phq9 === 12, 'phq9='+mh.phq9+' level='+mh.phq9Level);
ok('心理自评 GAD-7 总分', mh.gad7 === 8, 'gad7='+mh.gad7+' level='+mh.gad7Level);
const mh2 = psy.assessMentalHealth({ depression: [0.5,-0.3,0.8], anxiety: [-0.2,0.6] });  // -1..1 强度
ok('心理自评 强度映射', mh2.phq9 >= 0 && mh2.phq9 <= 9 && mh2.available === true, 'phq9='+mh2.phq9);

// 辩论 shapley 归因
const { DebateConductor } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reasoning/debate-conductor.js');
const dc = new DebateConductor();
dc.addAgent('optimist', '乐观'); dc.addAgent('skeptic', '怀疑'); dc.addAgent('pragmatist', '务实');
const contrib = dc.attributeContributions(['optimist','skeptic','pragmatist'], (subset) => subset.length * 0.3);
ok('辩论 shapley 归因返回3角色', Object.keys(contrib).length === 3, JSON.stringify(contrib));
ok('辩论 shapley 归因归一', Math.abs(Object.values(contrib).reduce((a,c)=>a+c,0) - 1) < 1e-3);

// 走神 flow 监测
const { MindWanderer } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/consciousness/mind-wanderer.js');
const mw = new MindWanderer('/root/.hermes/skills/ai/mark-heartflow-skill');
const flow = mw.measureFlow(1.1, 1, 0.6);
ok('走神 flow 监测', flow.flow > 0.9 && Math.abs(flow.optimalChallenge - 1.1) < 1e-9, JSON.stringify(flow));
ok('走神 flow 唤醒', typeof flow.optimalArousal === 'number', 'arousal='+flow.optimalArousal);

console.log('=== Matcher B3 匹配 ===');
const m = getFormulaMatcher();
ok('匹配 IRT/测验', m.matchFromText('用 IRT 四参数模型做测验信息分析', {limit: 20}).some(x=>x.ref==='irt_4pl'||x.ref==='irt_test_information'));
ok('匹配 卡尔纳普确认', m.matchFromText('卡尔纳普确认函数评估证据', {limit: 20}).some(x=>x.ref==='carnap_confirmation'));
ok('匹配 脑网络模块度', m.matchFromText('脑网络模块度分析社区结构', {limit: 20}).some(x=>x.ref==='brain_network_modularity'));
ok('匹配 博弈均衡', m.matchFromText('匹配 pennies 博弈的纳什均衡', {limit: 20}).some(x=>x.ref==='matching_pennies'));

console.log('=== 回归（v5.9.9 及更早）===');
const { HeartFlow } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '/root/.hermes/skills/ai/mark-heartflow-skill' });
hf.start();
ok('matchFormulas 仍工作', hf.matchFormulas('我感到不确定').length > 0);
ok('registry 7 环节', Object.keys(getFormulaRegistry().summary()).length === 7);
ok('GWT 注入仍工作', (()=>{ const { GlobalWorkspace } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/consciousness/global-workspace.js'); const w = new GlobalWorkspace().determineWinner([{agent:'a',attention:0.8,confidence:0.9},{agent:'b',attention:0.5,confidence:0.6}]); return w.agent==='a' && w.gwt; })());
ok('IIT 注入仍工作', (()=>{ const { PhenomenologyEngine } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/consciousness/phenomenology-engine.js'); const p = new PhenomenologyEngine(); const i = p.analyzeIntentionality('x', {partitions:[{mi:0.5}]}); return i.integratedInformation !== undefined; })());

console.log(`\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);
process.exit(fail > 0 ? 1 : 0);
setTimeout(()=>process.exit(fail>0?1:0), 20000);
