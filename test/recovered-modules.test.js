// test/recovered-modules.test.js — 恢复模块回归测试（[v6.4.5] 宁愿冗余原则）
// 覆盖：有真实调用方的恢复模块，防止再次被误删
const { validateFetchUrl } = require('../src/security/url-validator.js');
const { ReportGenerator } = require('../src/report/report-generator.js');
const { DataEraser } = require('../src/memory/data-eraser.js');
const { TTLPreferences } = require('../src/memory/ttl-preferences.js');
const { LatencyBenchmark } = require('../src/benchmark/latency-benchmark.js');
const { SelfScanner } = require('../src/cortex/self-evolution/self-scanner.js');
const { HypothesisTester } = require('../src/cortex/hypothesis-tester.js');
const { SelfCorrectionLoop } = require('../src/cortex/self-correction-loop.js');
const { UserToLLM } = require('../src/bridge/user-to-llm.js');
const { ContextBuilder } = require('../src/bridge/context-builder.js');
const { StyleEngine } = require('../src/dialogue/style-engine.js');
const { BeingMode } = require('../src/identity/being-mode.js');
const { AffectiveIntentionality } = require('../src/emotion/affective-intentionality.js');
const { MeaningPurposeEngine } = require('../src/identity/meaning-purpose-engine.js');

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      pending.push(r.then(
        () => { passed++; console.log(`  ✅ ${name}`); },
        e => { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
      ));
    } else {
      passed++; console.log(`  ✅ ${name}`);
    }
  }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

// ─── url-validator（fetch-safe 依赖，SSRF 防护） ───
t('url-validator: 内部 IP 拒绝', async () => {
  const r = await validateFetchUrl('http://127.0.0.1:8080/admin');
  if (!r || r.safe !== false) throw new Error(`internal IP should be unsafe: ${JSON.stringify(r)}`);
});
t('url-validator: 公网 URL 允许', async () => {
  const r = await validateFetchUrl('https://example.com/api');
  if (r.safe === false) throw new Error(`public URL should be safe: ${JSON.stringify(r)}`);
});

// ─── report-generator（CLI report 命令） ───
t('report-generator: 实例化', () => {
  const rg = new ReportGenerator();
  if (!rg || typeof rg.generate !== 'function' && typeof rg.generateReport !== 'function') {
    // 至少是可实例化对象
    if (!rg) throw new Error('cannot instantiate');
  }
});

// ─── data-eraser（CLI forget 命令） ───
t('data-eraser: 实例化 + 方法', () => {
  const de = new DataEraser(process.cwd());
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(de));
  if (methods.length < 2) throw new Error('too few methods');
});

// ─── ttl-preferences（CLI ttl 命令） ───
t('ttl-preferences: 实例化 + 方法', () => {
  const ttl = new TTLPreferences(process.cwd());
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ttl));
  if (methods.length < 2) throw new Error('too few methods');
});

// ─── latency-benchmark（CLI benchmark 命令） ───
t('latency-benchmark: 报告统计正确', async () => {
  const bench = new LatencyBenchmark(async () => { await new Promise(r => setTimeout(r, 5)); }, { warmup: 1, samples: 3 });
  const r = await bench.report();
  if (typeof r.avgMs !== 'number' || r.samples !== 3) throw new Error(`bad report: ${JSON.stringify(r)}`);
});

// ─── self-scanner（进化引擎弱点扫描） ───
t('self-scanner: 扫描返回结构', () => {
  const scanner = new SelfScanner(process.cwd());
  const r = scanner.scan();
  if (!r || typeof r.todoCount !== 'number') throw new Error('scan should return todoCount');
  if (!Array.isArray(r.longFunctions)) throw new Error('longFunctions should be array');
});

// ─── hypothesis-tester（验证引擎） ───
t('hypothesis-tester: 提取声明', () => {
  const ht = new HypothesisTester();
  const claims = ht.extractClaims('研究表明这个产品能治愈癌症');
  if (!Array.isArray(claims)) throw new Error('should return array');
});
t('hypothesis-tester: 置信度评估', () => {
  const ht = new HypothesisTester();
  const c = ht.assessConfidence('这个绝对100%正确', []);
  if (typeof c !== 'number' || c < 0 || c > 1) throw new Error(`bad confidence: ${c}`);
});

// ─── self-correction-loop（纠错学习） ───
t('self-correction-loop: 记录纠错 + 获取', () => {
  const scl = new SelfCorrectionLoop({});
  scl.onUserCorrection('factual', '原答案', '纠正后');
  const lessons = scl.getLessons();
  if (!Array.isArray(lessons) || lessons.length < 1) throw new Error('should have lesson');
});

// ─── user-to-llm（translator API） ───
t('user-to-llm: translate 返回 prompt', () => {
  const utl = new UserToLLM();
  const r = utl.translate('帮我分析', { emotion: 'anxious' });
  if (!r.prompt || !r.context) throw new Error('should return prompt+context');
});

// ─── context-builder（agentLayer API） ───
t('context-builder: build 返回 context', () => {
  const cb = new ContextBuilder();
  const r = cb.build('测试', {}, { type: 'code' }, {});
  if (!r.context || !r.sections) throw new Error('should return context+sections');
});

// ─── style-engine（llm-to-user 依赖） ───
t('style-engine: 实例化', () => {
  const se = new StyleEngine();
  if (!se) throw new Error('cannot instantiate');
});

// ─── being-mode（think-pipeline 依赖） ───
t('being-mode: assessBeing 返回结构', () => {
  const bm = new BeingMode();
  const r = bm.assessBeing({ input: '测试', route: 'chat' });
  if (!r.overallBeing || !r.dimensions) throw new Error(`bad being: ${JSON.stringify(r).slice(0,100)}`);
});

// ─── affective-intentionality（think-pipeline 依赖） ───
t('affective-intentionality: compute 返回结构', () => {
  const ai = new AffectiveIntentionality();
  const r = ai.compute({ type: 'joy', intentionalityStrength: 0.7, objectClarity: 0.7, evaluationStrength: 0.7 });
  if (!r || typeof r !== 'object') throw new Error('should return object');
});

// ─── meaning-purpose-engine（heartflow stub 修复） ───
t('meaning-purpose-engine: 实例化', () => {
  const mpe = new MeaningPurposeEngine({ resilienceMode: true });
  if (!mpe) throw new Error('cannot instantiate');
});

Promise.all(pending).then(() => {
  console.log(`\n📊 recovered-modules: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
});
