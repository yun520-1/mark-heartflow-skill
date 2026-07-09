/**
 * 心虫 v5.9.8 公式审计扩展集成测试
 * 验证 27 个新审计公式的原语可调用 + matcher 匹配 + 无回归
 */
let pass = 0, fail = 0;
function ok(name, cond, extra='') {
  if (cond) { pass++; console.log(`  ✅ ${name} ${extra}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}

const { getFormulaBridge } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-bridge.js');
const { getFormulaRegistry } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-registry.js');
const { getFormulaMatcher } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/formula/formula-matcher.js');

// 1. Bridge 新方法可用
console.log('=== Bridge 新公式 ===');
const b = getFormulaBridge();
ok('prospectValue 损失厌恶', b.prospectValue(-10) < 0 && Math.abs(b.prospectValue(-10) - (-2.25*Math.pow(10,0.88))) < 0.1);
ok('prospectWeight 次线性', b.prospectWeight(0.1) > 0.1, 'w(0.1)='+b.prospectWeight(0.1).toFixed(3));
ok('subjectiveUtility', Math.abs(b.subjectiveUtility([0.5,0.5],[10,2]) - 6) < 1e-9, '=6');
ok('bayesFactor', Math.abs(b.bayesFactor(0.8,0.2) - 4) < 1e-9);
ok('posteriorOdds', isFinite(b.posteriorOdds(0.3, 4)));
ok('predictiveCodingFreeEnergy 有限', isFinite(b.predictiveCodingFreeEnergy(1, 0.8, 0.2)));
ok('activeInferenceEFE 熵项', b.activeInferenceEFE([0.5,0.5]) > 0);
ok('precisionWeight', Math.abs(b.precisionWeight(0.5) - 4) < 1e-9);
ok('gwtWinner', b.gwtWinner([0.1,0.9,0.3]) === 1);
ok('iitPhi 非负', b.iitPhi(2, [0.5,0.5]) === 1);
ok('clarionACS 归一化', Math.abs(b.clarionACS([1,2,3]).reduce((a,c)=>a+c,0) - 1) < 1e-9);
ok('actrNoise 探索', Array.isArray(b.actrNoise([1,2,3])));
ok('experienceReplay 返回批', b.experienceReplay([1,2,3,4,5], 3).length === 3);
ok('cognitiveDissonance', b.cognitiveDissonance([1,0],[0,1],[1,1]) === 2);
ok('socialInfluence 收敛', Array.isArray(b.socialInfluence([0.5,0.5],[[0,1],[1,0]])));
ok('vygotskyZPD', JSON.stringify(b.vygotskyZPD(0.5,0.8)) === JSON.stringify([0.5,0.8]));
ok('irtInformation', b.irtInformation(0,1,0,0,1) > 0);
ok('irtSEM 有限', isFinite(b.irtSEM(0,1,0,0,1)));
ok('semFitRMSEA', b.semFitRMSEA(10,5,100) >= 0);
ok('semFitSRMR', b.semFitSRMR([0.1,0.2,-0.1]) > 0);
ok('factorCovariance passthru', Array.isArray(b.factorCovariance([1,2])));

// 2. Registry 新原语注册可用
console.log('=== Registry 新原语 ===');
const reg = getFormulaRegistry();
const sum = reg.summary();
const total = Object.values(sum).reduce((a, c) => a + c, 0);
ok('注册表原语总数 >= 38', total >= 38, 'total=' + total);
const stages = ['memory_activation','emotion_arousal','decision_utility','confidence_aggr','personality_measure','belief_update','calibration'];
const allIn = stages.every(s => sum[s] > 0);
ok('7 环节均有原语', allIn);
// 直接 call 新注册的原语
const clarion = reg.call('decision_utility','clarion_acs',[1,2,3]);
ok('reg.call clarion_acs', clarion && Math.abs(clarion.reduce((a,c)=>a+c,0)-1) < 1e-9);
const gwt = reg.call('decision_utility','gwt_winner',[0.1,0.9,0.3]);
ok('reg.call gwt_winner', gwt === 1);
const bf = reg.call('belief_update','bayes_factor',0.8,0.2);
ok('reg.call bayes_factor', Math.abs(bf-4) < 1e-9);

// 3. Matcher 能匹配到新公式
console.log('=== Matcher 新匹配 ===');
const m = getFormulaMatcher();
const t1 = m.matchFromText('前景理论下我对损失更敏感');
ok('匹配 前景理论', t1.some(x => x.ref==='prospect_value'||x.ref==='prospect_weight'));
const t2 = m.matchFromText('我的意识进入全局工作空间，注意被赢家占据');
ok('匹配 意识/GWT', t2.some(x => x.ref==='iit_phi'||x.ref==='gwt_winner'));
const t3 = m.matchFromText('用贝叶斯因子比较两个假设的证据');
ok('匹配 贝叶斯因子', t3.some(x => x.ref==='bayes_factor'));
const t4 = m.matchFromText('预测编码最小化自由能，提高精确度权重');
ok('匹配 主动推断', t4.some(x => x.ref==='predictive_coding_free_energy'||x.ref==='precision_weight'));
const t5 = m.matchFromText('社会影响让群体从众，最近发展区决定学习');
ok('匹配 社会/发展', t5.some(x => x.ref==='social_influence'||x.ref==='vygotsky_zpd'));

// 4. 回归
console.log('=== 回归 ===');
const { HeartFlow } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '/root/.hermes/skills/ai/mark-heartflow-skill' });
hf.start();
ok('matchFormulas 仍工作', hf.matchFormulas('我感到不确定').length > 0);
ok('registry 7 环节', Object.keys(getFormulaRegistry().summary()).length === 7);

console.log(`\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);
process.exit(fail > 0 ? 1 : 0);
setTimeout(()=>{ console.log('timeout'); process.exit(fail>0?1:0); }, 15000);
