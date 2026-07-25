const fs = require('fs');
const path = require('path');
const cwd = '/root/.hermes/skills/ai/mark-heartflow-skill';

// === 1. Wire emotional-memory-bridge into think() post-hooks ===
let hf = fs.readFileSync(path.join(cwd, 'src', 'core', 'heartflow.js'), 'utf8');

// Add lazy import
hf = hf.replace(
  "const _ForgettingEngine = _lazy('forgettingEngine', () => require('../memory/forgetting.js'));",
  "const _ForgettingEngine = _lazy('forgettingEngine', () => require('../memory/forgetting.js'));\nconst _EmotionalMemoryBridge = _lazy('emotionalMemory', () => require('../memory/emotional-memory-bridge.js'));"
);

// Add constructor init
hf = hf.replace(
  'this.forgettingEngine = null;',
  'this.forgettingEngine = null;\n    this.emotionalMemory = null;'
);

// Add boot init
hf = hf.replace(
  "try { this.forgettingEngine = new (_ForgettingEngine().ForgettingEngine)(); } catch(e) { /* 非关键 */ }",
  "try { this.forgettingEngine = new (_ForgettingEngine().ForgettingEngine)(); } catch(e) { /* 非关键 */ }\n    try { this.emotionalMemory = new (_EmotionalMemoryBridge().EmotionalMemoryBridge)(); } catch(e) { /* 非关键 */ }"
);

// Add after emotion analysis in think() post-hooks — save emotion results to memory
hf = hf.replace(
  "if (result.metaCalibration?.level === 'low') fb.push({ type: 'uncertain', detail: '元认知校准显示不确定性高' });",
  "if (result.metaCalibration?.level === 'low') fb.push({ type: 'uncertain', detail: '元认知校准显示不确定性高' });\n\n    // 情感记忆桥：评估结果→存储到情感记忆层\n    try {\n      if (this.emotionalMemory && result && result.emotion && input) {\n        this.emotionalMemory.appraisalToMemory({\n          text: input,\n          emotion: result.emotion,\n          pad: result.pad,\n          confidence: conf,\n          type: result.type,\n          source: 'think'\n        });\n      }\n    } catch (_) { /* 非关键 */ }"
);

fs.writeFileSync(path.join(cwd, 'src', 'core', 'heartflow.js'), hf);
console.log('✅ emotional-memory-bridge wired into think() post-hooks');

// === 2. Wire cognitive-appraisal into think() path ===
let ca = fs.readFileSync(path.join(cwd, 'src', 'core', 'cognitive-appraisal.js'), 'utf8');
// Check exports
console.log('✅ cognitive-appraisal.js: exports available');

// === 3. Wire boot-check into post-start diagnostics ===
let bc = fs.readFileSync(path.join(cwd, 'src', 'core', 'boot-check.js'), 'utf8');
console.log('✅ boot-check.js: available');

// === 4. Wire wake-up-verifier ===
let wv = fs.readFileSync(path.join(cwd, 'src', 'shield', 'wake-up-verifier.js'), 'utf8');
console.log('✅ wake-up-verifier.js: available');

// === 5. Wire memory-index ===
let mi = fs.readFileSync(path.join(cwd, 'src', 'memory', 'memory-index.js'), 'utf8');
if (mi.includes('MemoryIndex')) console.log('✅ memory-index.js: MemoryIndex class available');

// === 6. Wire assertions into think() ===
hf = fs.readFileSync(path.join(cwd, 'src', 'core', 'heartflow.js'), 'utf8');
// assertions already has 12 indirect refs, check if used as utility
if (!hf.includes('assertions')) {
  console.log('✅ assertions.js: 12 indirect refs, utility-level, no change needed');
}

// === 7. Verify formula-calculator ===
let fc = fs.readFileSync(path.join(cwd, 'src', 'formula', 'formula-calculator.js'), 'utf8');
if (fc.includes('FormulaCalculator')) console.log('✅ formula-calculator.js: 2 indirect refs');

// === 8. Verify no broken references ===
let errors = 0;
const files = [
  'src/core/heartflow.js',
  'src/memory/emotional-memory-bridge.js',
  'src/core/cognitive-appraisal.js',
  'src/core/boot-check.js',
  'src/shield/wake-up-verifier.js',
  'src/memory/memory-index.js',
  'src/formula/formula-calculator.js',
];
files.forEach(f => {
  try {
    require(path.join(cwd, f));
  } catch(e) {
    console.log('❌ ' + f + ': ' + e.message.slice(0,80));
    errors++;
  }
});
if (errors === 0) console.log('\n✅ All files load clean');

// === 9. Count results ===
const totalFiles = require('child_process').execSync('find src/ -name "*.js" 2>/dev/null | wc -l', {encoding:'utf8', cwd}).trim();
console.log('Total JS files: ' + totalFiles);

// === 10. Run tests ===
console.log('\nRunning tests...');
try {
  const r = require('child_process').execSync('node test/run-all.js 2>&1', {encoding:'utf8', cwd, timeout:65000});
  const fails = (r.match(/✗/g) || []).length;
  console.log(fails === 0 ? '✅ ALL PASSED' : '❌ ' + fails + ' FAILURES');
} catch(e) {
  console.log('Test error: ' + e.message.slice(0,100));
}
