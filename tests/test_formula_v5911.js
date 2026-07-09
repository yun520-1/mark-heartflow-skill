/**
 * 心虫 v5.9.11 论文升级集成测试
 * P1-P4: GitHub 真实论文代码移植 (DDM/SDT/ActiveInference G)
 */
let pass = 0, fail = 0;
function ok(name, cond, extra='') {
  if (cond) { pass++; console.log(`  ✅ ${name} ${extra}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
const { getFormulaRegistry } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-registry.js');
const { getFormulaBridge } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-bridge.js');
const { getFormulaMatcher } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-matcher.js');

console.log('=== P2. DDM 扩散决策模型 (移植 wfpt_py / Bogacz 2006) ===');
const b = getFormulaBridge();
// 高漂移率 → 决策更快、错误更少
const rtLow = b.ddmDecisionTime(0, 0.2, 3, 1);
const rtHigh = b.ddmDecisionTime(0, 0.2, 1, 1);
ok('DDM 高漂移率决策更快', rtLow < rtHigh, `rt(a3)=${rtLow.toFixed(3)} rt(a1)=${rtHigh.toFixed(3)}`);
ok('DDM 错误率 ∈ [0,1]', (()=>{const e=b.ddmErrorRate(0,0.2,1,1); return e>0&&e<1;})());
ok('DDM 高漂移率错误更少', b.ddmErrorRate(0,0.2,3,1) < b.ddmErrorRate(0,0.2,1,1));
ok('DDM 准确率≈88% (a=1,z=1)', Math.abs((1-b.ddmErrorRate(0,0.2,1,1)) - 0.88) < 0.05, `acc=${(1-b.ddmErrorRate(0,0.2,1,1)).toFixed(3)}`);

console.log('=== P3. SDT 信号检测论 (Green & Swets 1966) ===');
// d' 标准值：HR=.9 FAR=.2 → d'≈2.12
ok("SDT d' 标准值", Math.abs(b.sdtDPrime(0.9,0.2) - 2.123) < 0.01, `d'=${b.sdtDPrime(0.9,0.2).toFixed(3)}`);
// 完美辨别
ok("SDT d' 完美→∞(大值)", b.sdtDPrime(1,0) > 5);
// A' 范围
ok("SDT A' ∈ [0.5,1]", (()=>{const a=b.sdtAPrime(0.9,0.2); return a>=0.5&&a<=1;})());
// β 偏向：保守(低虚报)→高β
ok('SDT β 保守>宽松', b.sdtBeta(0.5,0.1) > b.sdtBeta(0.5,0.5));

console.log('=== P4. Active Inference 信息增益 G (移植 pymdp spm_MDP_G) ===');
// 清晰似然（高信息增益潜力）→ 取负为认识性价值
const G_clear = b.activeInferenceInfoGain([0.5,0.5], [[0.9,0.1],[0.1,0.9]]);
const G_ambig = b.activeInferenceInfoGain([0.5,0.5], [[0.5,0.5],[0.5,0.5]]);
ok('AIF G 为有限数', typeof G_clear === 'number' && isFinite(G_clear), `G=${G_clear}`);
ok('AIF 模糊似然→低信息增益', G_ambig > G_clear, `G_ambig=${G_ambig} G_clear=${G_clear}`);

console.log('=== Registry 调用 ===');
const reg = getFormulaRegistry();
ok('reg.call ddm_decision_time', reg.call('decision_dynamics','ddm_decision_time',0,0.2,1,1) > 0);
ok('reg.call sdt_d_prime', Math.abs(reg.call('decision_utility','sdt_d_prime',0.9,0.2) - 2.123) < 0.01);
ok('reg.call aif_info_gain', typeof reg.call('active_inference','aif_info_gain',[0.5,0.5],[[0.9,0.1],[0.1,0.9]]) === 'number');
const total = Object.values(reg.summary()).reduce((a,c)=>a+c,0);
ok('registry 原语 >= 74', total >= 74, 'total='+total);

console.log('=== Matcher 论文触发词 ===');
const m = getFormulaMatcher();
ok('匹配 DDM', m.matchFromText('扩散决策模型的反应时和漂移率分析', {limit: 20}).some(x=>x.ref==='ddm_decision_time'||x.ref==='ddm_error_rate'));
ok('匹配 SDT', m.matchFromText('信号检测论计算辨别力 d 撇和虚报率', {limit: 20}).some(x=>x.ref==='sdt_d_prime'||x.ref==='sdt_a_prime'));
ok('匹配 AIF G', m.matchFromText('主动推断的预期自由能和信息增益', {limit: 20}).some(x=>x.ref==='aif_info_gain'));

console.log('=== 回归（v5.9.10 及更早）===');
const { HeartFlow } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '/root/.hermes/skills/ai/mark-heartflow-skill' });
hf.start();
ok('matchFormulas 仍工作', hf.matchFormulas('我感到不确定').length > 0);
ok('registry 7+ 环节', Object.keys(getFormulaRegistry().summary()).length >= 7);
ok('GWT 注入仍工作', (()=>{ const { GlobalWorkspace } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/consciousness/global-workspace.js'); const w = new GlobalWorkspace().determineWinner([{agent:'a',attention:0.8,confidence:0.9},{agent:'b',attention:0.5,confidence:0.6}]); return w.agent==='a' && w.gwt; })());
ok('心理自评仍工作', (()=>{ const { AIPsychologyEngine } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/psychology/ai-psychology-engine.js'); const r = new AIPsychologyEngine().assessMentalHealth({ depression:[1,0,2,1,0,1,0,1,2], anxiety:[0,1,1,0,2,0,1] }); return r.phq9===8 && r.available; })());

console.log(`\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);
process.exit(fail > 0 ? 1 : 0);
setTimeout(()=>process.exit(fail>0?1:0), 20000);
