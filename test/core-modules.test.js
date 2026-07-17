/**
 * v5.15.2 核心模块单元测试
 * 覆盖: emotion-dynamics-engine, confidence-calibrator, cognitive-load-v2
 */
const { EmotionDynamicsEngine } = require('../src/emotion/emotion-dynamics-engine.js');
const { ConfidenceCalibrator } = require('../src/core/confidence-calibrator.js');
const { CognitiveLoadEngineV2 } = require('../src/cognitive/cognitive-load-v2.js');

let passed = 0, failed = 0;
function assert(cond, msg) { cond ? passed++ : (console.error('FAIL:', msg), failed++); }

console.log('=== v5.15.2 核心模块测试 ===\n');

// ── 1. EmotionDynamics ──
const ed = new EmotionDynamicsEngine();
assert(ed, 'EmotionDynamicsEngine 实例化');
assert(typeof ed.updatePAD === 'function', 'updatePAD 方法存在');
assert(typeof ed.regulate === 'function', 'regulate 方法存在');
assert(typeof ed.healthCheck === 'function', 'healthCheck 方法存在');
assert(typeof ed.yerkesDodsonAnalysis === 'function', 'yerkesDodsonAnalysis 方法存在');

// PAD 更新
const r1 = ed.updatePAD({ pleasureDelta: 0.3, arousalDelta: 0.2 });
assert(r1 && r1.pad, 'updatePAD 返回 PAD 状态');
assert(typeof r1.emotionLabel === 'string', 'updatePAD 返回情绪标签: ' + r1.emotionLabel);

// 情绪调节
const r2 = ed.regulate('reappraisal', 0.5);
assert(r2 && r2.effectiveness > 0, 'regulate 有效: ' + r2.effectiveness);

// Yerkes-Dodson
const r3 = ed.yerkesDodsonAnalysis('moderate');
assert(r3 && typeof r3.optimalArousal === 'number', 'yerkesDodson 返回最优唤醒: ' + r3.optimalArousal);

// 健康检查
const hc = ed.healthCheck();
assert(hc && hc.status === 'ok', 'healthCheck 正常');
assert(hc.currentEmotion, 'healthCheck 返回当前情绪: ' + hc.currentEmotion);

// ── 2. ConfidenceCalibrator ──
const cc = new ConfidenceCalibrator();
assert(cc, 'ConfidenceCalibrator 实例化');
assert(typeof cc.assess === 'function', 'assess 方法存在');
assert(typeof cc.applyCalibration === 'function', 'applyCalibration 方法存在');

// 评估
const ar = cc.assess('这是一个需要评估的测试文本，包含足够的信息来进行置信度判断', { hasEvidence: true });
assert(ar && typeof ar.raw === 'number', 'assess 返回原始分: ' + ar.raw);
assert(ar.level, 'assess 返回置信度等级: ' + ar.level);
assert(ar.scores, 'assess 返回维度分数');

// 校准
const cal = cc.applyCalibration(0.85, { evidenceCoverage: 0.8, consistency: 0.7, specificity: 0.6, sourceReliability: 0.9, complexityFit: 0.7 });
assert(typeof cal === 'number', 'applyCalibration 返回数值: ' + cal);

// ── 3. CognitiveLoadV2 ──
const cl = new CognitiveLoadEngineV2();
assert(cl, 'CognitiveLoadEngineV2 实例化');
assert(typeof cl.estimate === 'function', 'estimate 方法存在');
assert(typeof cl.healthCheck === 'function', 'healthCheck 方法存在');

// 认知负载评估
const est = cl.estimate('复杂的量子力学方程推导和矩阵运算，涉及微分几何和拓扑学概念', { domain: 'math', priorKnowledge: 0.3 });
assert(est && typeof est.cl === 'number', 'estimate 返回认知负载: ' + est.cl);
assert(est.loadLevel, 'estimate 返回负载等级: ' + est.loadLevel);
assert(typeof est.workingMemoryCapacity === 'number', 'estimate 返回工作记忆容量: ' + est.workingMemoryCapacity);

// 健康检查
const clHc = cl.healthCheck();
assert(clHc && clHc.status === 'ok', 'cognitiveLoad healthCheck 正常');

console.log(`\n测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) { console.log('有测试失败'); process.exit(1); }
else { console.log('全部通过！'); }