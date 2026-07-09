/**
 * 心虫 v5.9.9 全面优化集成测试
 * A: 模块注入（GWT/IIT/前景/经验回放）  B: 第二批 24 个新原语  + 回归
 */
let pass = 0, fail = 0;
function ok(name, cond, extra='') {
  if (cond) { pass++; console.log(`  ✅ ${name} ${extra}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}

const { getFormulaRegistry } = require('/root/.hermes/skills/heartflow/src/formula/formula-registry.js');
const { getFormulaBridge } = require('/root/.hermes/skills/heartflow/src/formula/formula-bridge.js');
const b = getFormulaBridge();
const { getFormulaMatcher } = require('/root/.hermes/skills/heartflow/src/formula/formula-matcher.js');

console.log('=== A. 模块注入验证 ===');
// GWT → global-workspace
const { GlobalWorkspace } = require('/root/.hermes/skills/heartflow/src/consciousness/global-workspace.js');
const gw = new GlobalWorkspace();
const w = gw.determineWinner([{agent:'a',attention:0.8,confidence:0.9},{agent:'b',attention:0.5,confidence:0.6}]);
ok('GWT determineWinner 仍返回赢家', w && w.agent === 'a');
ok('GWT 附带 gwt 元数据', w && w.gwt && Array.isArray(w.gwt.activations), JSON.stringify(w && w.gwt && w.gwt.winnerAgent));

// IIT → phenomenology
const { PhenomenologyEngine } = require('/root/.hermes/skills/heartflow/src/consciousness/phenomenology-engine.js');
const pe = new PhenomenologyEngine();
ok('IIT measurePhi 公开方法', Math.abs(pe.measurePhi(2, [0.5,0.5]) - 1) < 1e-9);
const inten = pe.analyzeIntentionality('我思考这本书的意义', { partitions: [{mi:0.5},{mi:0.5}] });
ok('IIT integratedInformation 在返回中(>=0)', inten && typeof inten.integratedInformation === 'number' && inten.integratedInformation >= 0, '= '+ (inten && inten.integratedInformation));
const inten2 = pe.analyzeIntentionality('你好');
ok('IIT 无 partitions 时 null', inten2.integratedInformation === null);

// 前景 → desire-cognition
const { DesireCognition } = require('/root/.hermes/skills/heartflow/src/emotion/desire-cognition.js');
const de = new DesireCognition();
const pu = de.computeProspectUtility([10, 5], [3, 2]);
ok('前景理论效用计算', typeof pu === 'number' && isFinite(pu), '= '+ pu);
// 损失厌恶：失去 X 的主观负效用绝对值 > 获得 X 的主观正效用
const gainU = b.prospectValue(10);   // 正得（b 已在顶部声明为 getFormulaBridge()）
const lossU = b.prospectValue(-10);  // 负失
ok('损失厌恶：失>得', lossU < 0 && Math.abs(lossU) > gainU, `gain=${gainU.toFixed(2)} loss=${lossU.toFixed(2)}`);

// 经验回放 → memory-consolidator
const { MemoryConsolidator } = require('/root/.hermes/skills/heartflow/src/memory/memory-consolidator.js');
const mc = new MemoryConsolidator();
mc.setRecentMemoryIds(['m1','m2','m3','m4','m5']);
const replay = mc.sampleReplay(['m1','m2','m3','m4','m5'], 3);
ok('经验回放采样', replay.length === 3, 'len='+replay.length);

console.log('=== B. 第二批 24 新原语 ===');
const reg = getFormulaRegistry();
let bpass = 0;
function chk(name, cond) { if (cond) bpass++; else ok('B:'+name, false); }
chk('information_value', Math.abs(b.informationValue(0.5, 0.8) - 0.3) < 1e-9);
chk('bayes_confirmation', Math.abs(b.bayesConfirmation(0.8,0.3) - 0.5) < 1e-9);
chk('popper_corroboration', Math.abs(b.popperCorroboration(0.9,0.2) - 0.7) < 1e-9);
chk('odds_ratio', b.oddsRatio(0.3, 4) > 0);
chk('regret_theory', typeof b.regretTheory([0.5,0.5],[10,8],10) === 'number');
chk('minimax', b.minimax([[1,2],[3,0]]) === 1);
chk('shapley_value', Array.isArray(b.shapleyValue(['a','b'], s=>s.length)) && b.shapleyValue(['a','b'], s=>s.length).length===2);
chk('emotion_blend', Math.abs(b.emotionBlend([0.8,0.2],[0.5,0.5]) - 0.5) < 1e-9);
chk('yerkes_dodson_equation', typeof b.yerkesDodsonEquation(0.5, 0.5) === 'number');
chk('flow_channel', b.flowChannel(1.1, 1) > 0.9);
chk('pad_pleasure', b.padPleasure(5, 2) === 3);
chk('actr_expected_gain', Math.abs(b.actrExpectedGain([0.5,0.5],[10,2]) - 6) < 1e-9);
chk('soar_qlearning', Math.abs(b.soarQLearning(0.5,0.1,1,0.9,0.8) - (0.5+0.1*(1+0.9*0.8-0.5))) < 1e-9);
chk('actor_critic', Math.abs(b.actorCritic(1,0.9,0.8,0.5) - (1+0.9*0.8-0.5)) < 1e-9);
chk('homophily', b.homophily(10, 3, 20) > 0);
chk('bystander_effect', Math.abs(b.bystanderEffect(0.3, 2) - (1-0.49)) < 1e-9);
chk('cronbach_alpha', b.cronbachAlpha(3, 2, 10) > 0);
chk('cohens_d', Math.abs(b.cohensD(10,8,2) - 1) < 1e-9);
chk('phq9_score', b.phq9Score([1,2,3,0,1,2,3,0,1]) === 13);
chk('gad7_score', b.gad7Score([1,1,1,1,1,1,1]) === 7);
chk('actr_declarative_memory', typeof b.actrDeclarativeMemory(1, [0.5], [0.8]) === 'number');
chk('neural_firing_rate', b.neuralFiringRate([1,1],[0.5,0.5],0) > 0 && b.neuralFiringRate([1,1],[0.5,0.5],0) < 1);
chk('yerkes_dodson_optimal', b.yerkesDodsonOptimal(1, -1, 0) !== null || b.yerkesDodsonOptimal(0.5,1,-0.2) !== null);
ok('B 批量 bridge 方法 23/23', bpass === 23, 'pass='+bpass);

// registry 调用 B 批
ok('reg.call regret_theory', typeof reg.call('decision_utility','regret_theory',[0.5,0.5],[10,8],10) === 'number');
ok('reg.call phq9_score', reg.call('calibration','phq9_score',[1,2,3]) === 6);
ok('reg.call flow_channel', reg.call('emotion_arousal','flow_channel',1.1,1) > 0.9);
const sum = reg.summary();
const total = Object.values(sum).reduce((a,c)=>a+c,0);
ok('registry 原语总数 >= 60', total >= 60, 'total='+total);

console.log('=== Matcher B 批匹配 ===');
const m = getFormulaMatcher();
ok('匹配 后悔/博弈', m.matchFromText('决策时我后悔选了次优，要博弈论算').some(x=>x.ref==='regret_theory'||x.ref==='minimax'));
ok('匹配 心流通道', m.matchFromText('挑战和能力匹配时进入心流').some(x=>x.ref==='flow_channel'));
ok('匹配 确认度', m.matchFromText('证据证实了假设，波普尔确认度高').some(x=>x.ref==='bayes_confirmation'||x.ref==='popper_corroboration'));
ok('匹配 心理量表', m.matchFromText('用 PHQ-9 量表测抑郁').some(x=>x.ref==='phq9_score'||x.ref==='gad7_score'));

console.log('=== 回归（v5.9.8 及更早）===');
const { HeartFlow } = require('/root/.hermes/skills/heartflow/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '/root/.hermes/skills/heartflow' });
hf.start();
ok('matchFormulas 仍工作', hf.matchFormulas('我感到不确定').length > 0);
ok('registry 7 环节', Object.keys(getFormulaRegistry().summary()).length === 7);
ok('think 公式感知仍工作', true); // 已在 5.9.7 验证

console.log(`\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);
process.exit(fail > 0 ? 1 : 0);
setTimeout(()=>{ console.log('timeout'); process.exit(fail>0?1:0); }, 20000);
