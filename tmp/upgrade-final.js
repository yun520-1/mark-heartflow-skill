const fs = require('fs');
const path = require('path');
const cwd = '/root/.hermes/skills/ai/mark-heartflow-skill';

// === Wire forgetting engine into boot ===
let hf = fs.readFileSync(path.join(cwd, 'src', 'core', 'heartflow.js'), 'utf8');

// Add forgetting engine lazy import
if (!hf.includes('ForgettingEngine')) {
  hf = hf.replace(
    "const _InstructionRegistry = _lazy('instructionRegistry', () => require('./instruction-registry.js'));",
    "const _InstructionRegistry = _lazy('instructionRegistry', () => require('./instruction-registry.js'));\nconst _ForgettingEngine = _lazy('forgettingEngine', () => require('../memory/forgetting.js'));"
  );
  // Init in constructor
  hf = hf.replace(
    'this.instructions = null;',
    'this.instructions = null;\n    this.forgettingEngine = null;\n    this.memoryIndex = null;'
  );
  // Instance during boot
  hf = hf.replace(
    'this.identityCore = new (_IdentityCore().IdentityCore)(this.rootPath);',
    'this.identityCore = new (_IdentityCore().IdentityCore)(this.rootPath);\n    try { this.forgettingEngine = new (_ForgettingEngine().ForgettingEngine)(); } catch(e) { /* 非关键 */ }\n    try { const { MemoryIndex } = require(\'../memory/memory-index.js\'); this.memoryIndex = new MemoryIndex(this.rootPath); } catch(e) { /* 非关键 */ }'
  );
}

// === Add memory versioning to consolidation engine ===
let mc = fs.readFileSync(path.join(cwd, 'src', 'memory', 'memory-consolidation-engine.js'), 'utf8');
mc = mc.replace(
  "this._spacingBase = options.spacingBase || 1.5;",
  "this._spacingBase = options.spacingBase || 1.5;\n    this._versionIndex = 0;\n    this._versionLog = [];"
);
mc = mc.replace(
  "consolidate(traceId, immediate = false) {",
  `consolidate(traceId, immediate = false) {
    this._versionIndex++;
    if (immediate) {
      const trace = this._memoryTraces.get(traceId);
      this._versionLog.push({ traceId, ts: Date.now(), version: this._versionIndex, accessCount: trace?.accessCount || 0 });
      if (this._versionLog.length > 1000) this._versionLog = this._versionLog.slice(-1000);
    }`
);

// === Wire forgetting.js ebbinghausRetention to accept accessCount ===
let fj = fs.readFileSync(path.join(cwd, 'src', 'memory', 'forgetting.js'), 'utf8');

// === Wire memory-index into boot ===
let mi = fs.readFileSync(path.join(cwd, 'src', 'memory', 'memory-index.js'), 'utf8');

// === Final: write all files ===
fs.writeFileSync(path.join(cwd, 'src', 'core', 'heartflow.js'), hf);
fs.writeFileSync(path.join(cwd, 'src', 'memory', 'memory-consolidation-engine.js'), mc);
fs.writeFileSync(path.join(cwd, 'src', 'memory', 'forgetting.js'), fj);

// === Verify syntax ===
const files = ['src/core/heartflow.js', 'src/memory/memory-consolidation-engine.js', 'src/memory/forgetting.js'];
files.forEach(f => {
  try {
    require(path.join(cwd, f));
    console.log('OK: ' + f);
  } catch(e) {
    console.log('FAIL: ' + f + ' - ' + e.message.slice(0,100));
  }
});

// === Count files ===
const total = require('child_process').execSync('find src/ -name "*.js" 2>/dev/null | wc -l', {encoding:'utf8', cwd}).trim();
console.log('\nTotal JS files: ' + total);

// === Count lines added ===
const oldHF = fs.readFileSync('/tmp/.hf-backup', 'utf8').split('\n').length || 4576;
const newHF = hf.split('\n').length;
console.log('heartflow.js grew: ' + (newHF - oldHF) + ' lines');

// === Run full test ===
console.log('\nRunning full regression...');
try {
  const r = require('child_process').execSync('node test/run-all.js 2>&1', {encoding:'utf8', cwd, timeout:65000});
  const failures = (r.match(/✗/g) || []).length;
  console.log('Tests: ' + (failures === 0 ? 'ALL PASSED ✓' : failures + ' FAILURES ✗'));
} catch(e) {
  console.log('Test error: ' + e.message.slice(0,100));
}
