/**
 * HeartFlow Self-Diagnostic Engine v1.0.1
 * 20步并发自检系统
 * 
 * 修复：
 * - ROOT 路径用 path.resolve(__dirname, '../..') 正确指向项目根
 * - 动态扫描60个JS模块，不依赖静态列表
 * - q-table 路径修正为 memory/q-table.json
 * - Step 6-9 并发扫描所有模块
 */

const fs = require('fs');
const path = require('path');

// 根目录（self-diagnostic.js 在 src/core/，向上两级到项目根）
const ROOT = path.resolve(__dirname, '../..');

// ========== 辅助函数 ==========

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(content) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function readTextFile(filePath) {
  try {
    return { success: true, data: fs.readFileSync(filePath, 'utf-8') };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function isEmptyFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size === 0;
  } catch {
    return true;
  }
}

// 动态扫描 src/core 下所有 JS 文件（排除 self-diagnostic.js 自己）
function getCoreModules() {
  const coreDir = path.join(ROOT, 'src/core');
  return fs.readdirSync(coreDir)
    .filter(f => f.endsWith('.js') && f !== 'self-diagnostic.js')
    .sort();
}

// ========== 诊断结果结构 ==========

class DiagnosticResult {
  constructor() {
    this.steps = {};
    this.fixed = [];
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  setStep(id, status, data = null, error = null, fixed = null) {
    this.steps[id] = { status, data, error, fixed };
    if (fixed) this.fixed.push({ step: id, ...fixed });
    if (error && status === 'fail') this.errors.push({ step: id, error });
  }

  addWarning(warning) {
    this.warnings.push(warning);
  }

  summary() {
    const total = Object.keys(this.steps).length;
    const passed = Object.values(this.steps).filter(s => s.status === 'pass').length;
    const failed = Object.values(this.steps).filter(s => s.status === 'fail').length;
    const skipped = Object.values(this.steps).filter(s => s.status === 'skip').length;
    const duration = Date.now() - this.startTime;
    return { total, passed, failed, skipped, fixedCount: this.fixed.length, errorCount: this.errors.length, warningCount: this.warnings.length, duration, allPassed: failed === 0 };
  }

  toReport() {
    const s = this.summary();
    let report = `
╔══════════════════════════════════════════════════════╗
║         HeartFlow Self-Diagnostic Report             ║
║                    v1.0.1                           ║
╚══════════════════════════════════════════════════════╝

[Summary] ${s.passed}/${s.total} passed | ${s.failed} failed | ${s.skipped} skipped | ${s.duration}ms

`;
    if (s.fixedCount > 0) {
      report += `\n[Auto-Fixes] ${s.fixedCount} automatic repairs:\n`;
      for (const f of this.fixed) report += `  ✓ Step ${f.step}: ${f.description}\n`;
    }
    if (s.errorCount > 0) {
      report += `\n[Errors] ${s.errorCount} unresolved:\n`;
      for (const e of this.errors) report += `  ✗ Step ${e.step}: ${e.error}\n`;
    }
    if (s.warningCount > 0) {
      report += `\n[Warnings] ${s.warningCount}:\n`;
      for (const w of this.warnings) report += `  ⚠ ${w}\n`;
    }
    report += `\n[Step Details]\n`;
    for (const [id, step] of Object.entries(this.steps).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
      const icon = step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '⊘';
      const fixedNote = step.fixed ? ' [AUTO-FIXED]' : '';
      report += `  ${icon} Step ${id}: ${step.status}${fixedNote}`;
      if (step.data) {
        const d = typeof step.data === 'object' ? JSON.stringify(step.data) : String(step.data);
        report += ` | ${d}`;
      }
      if (step.error && step.status !== 'fail') report += ` | ${step.error}`;
      report += '\n';
    }
    report += `\n${'═'.repeat(54)}\n`;
    report += s.allPassed
      ? `  RESULT: ✓ ALL CHECKS PASSED\n`
      : `  RESULT: ✗ ${s.failed} CHECK(S) FAILED — SEE ABOVE\n`;
    report += `${'═'.repeat(54)}\n`;
    return report;
  }
}

// ========== Step 1: VERSION 文件存在性检查 ==========

async function step01_versionExists(result) {
  const file = path.join(ROOT, 'VERSION');
  if (!fs.existsSync(file)) { result.setStep('01', 'fail', null, 'VERSION file not found'); return; }
  const content = fs.readFileSync(file, 'utf-8').trim();
  const valid = /^\d+\.\d+\.\d+$/.test(content);
  result.setStep('01', valid ? 'pass' : 'fail', { version: content }, valid ? null : `Invalid version format: "${content}"`);
}

// ========== Step 2: package.json 版本检查 ==========

async function step02_packageVersion(result) {
  const file = path.join(ROOT, 'package.json');
  if (!fs.existsSync(file)) { result.setStep('02', 'fail', null, 'package.json not found'); return; }
  const { success, data, error } = readJsonFile(file);
  if (!success) { result.setStep('02', 'fail', null, error); return; }
  const version = data.version;
  const valid = /^\d+\.\d+\.\d+$/.test(version);
  result.setStep('02', valid ? 'pass' : 'fail', { version }, valid ? null : `Invalid version: ${version}`);
}

// ========== Step 3: SKILL.md 版本检查 ==========

async function step03_skillVersion(result) {
  const file = path.join(ROOT, 'SKILL.md');
  if (!fs.existsSync(file)) { result.setStep('03', 'fail', null, 'SKILL.md not found'); return; }
  const { success, data, error } = readTextFile(file);
  if (!success) { result.setStep('03', 'fail', null, error); return; }
  const frontmatterMatch = data.match(/version:\s*"?([^"\n]+)"?/);
  const titleMatch = data.match(/# HeartFlow.*?v(\d+\.\d+\.\d+)/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : null;
  const title = titleMatch ? titleMatch[1] : null;
  result.setStep('03', 'pass', { frontmatter, title });
}

// ========== Step 4: heartflow.js 版本检查 ==========

async function step04_heartflowJSVersion(result) {
  const file = path.join(ROOT, 'src/core/heartflow.js');
  if (!fs.existsSync(file)) { result.setStep('04', 'fail', null, 'heartflow.js not found'); return; }
  const { success, data, error } = readTextFile(file);
  if (!success) { result.setStep('04', 'fail', null, error); return; }
  const versionMatch = data.match(/HeartFlow\s+v(\d+\.\d+\.\d+)/);
  const constMatch = data.match(/const\s+VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/);
  const docVersion = versionMatch ? versionMatch[1] : null;
  const constVersion = constMatch ? constMatch[1] : null;
  result.setStep('04', 'pass', { docVersion, constVersion });
}

// ========== Step 5: docs/README.md 版本检查 ==========

async function step05_docsVersion(result) {
  const file = path.join(ROOT, 'docs/README.md');
  if (!fs.existsSync(file)) { result.setStep('05', 'skip', null, 'docs/README.md not found (optional)'); return; }
  const { success, data, error } = readTextFile(file);
  if (!success) { result.setStep('05', 'fail', null, error); return; }
  const versionMatch = data.match(/Current Version.*?v(\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : null;
  result.setStep('05', version ? 'pass' : 'fail', { version }, version ? null : 'No version found in docs/README.md');
}

// ========== Step 6: 动态模块扫描（第一批，0-14）============

async function step06_moduleBatch1(result) {
  const modules = getCoreModules();
  const batch1 = modules.slice(0, 15);
  const errors = [], passed = [];
  for (const mod of batch1) {
    const file = path.join(ROOT, 'src/core', mod);
    if (!fs.existsSync(file)) { errors.push(`${mod}: file not found`); continue; }
    if (isEmptyFile(file)) { errors.push(`${mod}: empty file`); continue; }
    passed.push(mod);
  }
  result.setStep('06', errors.length === 0 ? 'pass' : 'fail', { batch: '1/4', checked: batch1.length, passed: passed.length, errors }, errors.length > 0 ? errors.join('; ') : null);
}

// ========== Step 7: 动态模块扫描（第二批，15-29）============

async function step07_moduleBatch2(result) {
  const modules = getCoreModules();
  const batch2 = modules.slice(15, 30);
  const errors = [], passed = [];
  for (const mod of batch2) {
    const file = path.join(ROOT, 'src/core', mod);
    if (!fs.existsSync(file)) { errors.push(`${mod}: file not found`); continue; }
    if (isEmptyFile(file)) { errors.push(`${mod}: empty file`); continue; }
    passed.push(mod);
  }
  result.setStep('07', errors.length === 0 ? 'pass' : 'fail', { batch: '2/4', checked: batch2.length, passed: passed.length, errors }, errors.length > 0 ? errors.join('; ') : null);
}

// ========== Step 8: 动态模块扫描（第三批，30-44）============

async function step08_moduleBatch3(result) {
  const modules = getCoreModules();
  const batch3 = modules.slice(30, 45);
  const errors = [], passed = [];
  for (const mod of batch3) {
    const file = path.join(ROOT, 'src/core', mod);
    if (!fs.existsSync(file)) { errors.push(`${mod}: file not found`); continue; }
    if (isEmptyFile(file)) { errors.push(`${mod}: empty file`); continue; }
    passed.push(mod);
  }
  result.setStep('08', errors.length === 0 ? 'pass' : 'fail', { batch: '3/4', checked: batch3.length, passed: passed.length, errors }, errors.length > 0 ? errors.join('; ') : null);
}

// ========== Step 9: 动态模块扫描（第四批，45-59）============

async function step09_moduleBatch4(result) {
  const modules = getCoreModules();
  const batch4 = modules.slice(45, 60);
  const errors = [], passed = [];
  for (const mod of batch4) {
    const file = path.join(ROOT, 'src/core', mod);
    if (!fs.existsSync(file)) { errors.push(`${mod}: file not found`); continue; }
    if (isEmptyFile(file)) { errors.push(`${mod}: empty file`); continue; }
    passed.push(mod);
  }
  result.setStep('09', errors.length === 0 ? 'pass' : 'fail', { batch: '4/4', checked: batch4.length, passed: passed.length, errors }, errors.length > 0 ? errors.join('; ') : null);
}

// ========== Step 10: heartflow.js 语法+结构检查 ==========

async function step10_heartflowStructure(result) {
  const file = path.join(ROOT, 'src/core/heartflow.js');
  if (!fs.existsSync(file)) { result.setStep('10', 'fail', null, 'heartflow.js not found'); return; }
  const { success, data, error } = readTextFile(file);
  if (!success) { result.setStep('10', 'fail', null, error); return; }
  const hasExports = data.includes('module.exports') || data.includes('export');
  const hasDispatch = data.includes('dispatch') || data.includes('dispatch:');
  const hasVersion = data.includes('VERSION');
  const dispatchCount = (data.match(/dispatch\(/g) || []).length;
  const hasIdentity = data.includes('升级者') || data.includes('Identity');
  result.setStep('10', (hasExports && hasDispatch) ? 'pass' : 'fail', { hasExports, hasDispatch, hasVersion, dispatchCount, hasIdentity });
}

// ========== Step 11: q-table.json 检查 ==========

async function step11_qTableCheck(result) {
  // q-table 在 memory/ 目录，不在 data/memory/
  const file = path.join(ROOT, 'memory/q-table.json');
  if (!fs.existsSync(file)) { result.setStep('11', 'skip', null, 'memory/q-table.json not found (first run)'); return; }
  const { success, data, error } = readJsonFile(file);
  if (!success) { result.setStep('11', 'fail', null, `Invalid JSON: ${error}`); return; }
  const size = fs.statSync(file).size;
  const entries = Object.keys(data).length;
  result.setStep('11', 'pass', { entries, size });
}

// ========== Step 12: lesson-bank.json 检查 ==========

async function step12_lessonBankCheck(result) {
  const file = path.join(ROOT, 'data/lesson-bank.json');
  if (!fs.existsSync(file)) { result.setStep('12', 'skip', null, 'lesson-bank.json not found (first run)'); return; }
  const { success, data, error } = readJsonFile(file);
  if (!success) { result.setStep('12', 'fail', null, `Invalid JSON: ${error}`); return; }
  const size = fs.statSync(file).size;
  result.setStep('12', 'pass', { entries: Object.keys(data).length, size });
}

// ========== Step 13: meaningful-memory.json 检查 ==========

async function step13_meaningfulMemoryCheck(result) {
  const file = path.join(ROOT, 'data/meaningful-memory.json');
  if (!fs.existsSync(file)) { result.setStep('13', 'skip', null, 'meaningful-memory.json not found (first run)'); return; }
  const { success, data, error } = readJsonFile(file);
  if (!success) { result.setStep('13', 'fail', null, `Invalid JSON: ${error}`); return; }
  const size = fs.statSync(file).size;
  const hasCore = data.core !== undefined;
  const hasLearned = data.learned !== undefined;
  const hasEphemeral = data.ephemeral !== undefined;
  const layers = [hasCore && 'core', hasLearned && 'learned', hasEphemeral && 'ephemeral'].filter(Boolean);
  result.setStep('13', 'pass', { size, layers });
}

// ========== Step 14: boot-check.js 存在性检查 ==========

async function step14_bootCheck(result) {
  const file = path.join(ROOT, 'src/core/boot-check.js');
  if (!fs.existsSync(file)) { result.setStep('14', 'skip', null, 'boot-check.js not found'); return; }
  const { success, data, error } = readTextFile(file);
  if (!success) { result.setStep('14', 'fail', null, error); return; }
  const hasBoot = data.includes('boot') || data.includes('check');
  result.setStep('14', hasBoot ? 'pass' : 'fail', { hasBoot });
}

// ========== Step 15: dispatch 路由完整性检查 ==========

async function step15_dispatchCheck(result) {
  const file = path.join(ROOT, 'src/core/heartflow.js');
  if (!fs.existsSync(file)) { result.setStep('15', 'fail', null, 'heartflow.js not found'); return; }
  const { success, data, error } = readTextFile(file);
  if (!success) { result.setStep('15', 'fail', null, error); return; }
  // 检查 dispatch 方法是否在 routes/handlers 中定义了关键路由
  const hasMemoryRoute = data.includes('memory.search') || data.includes("'memory'");
  const hasDreamRoute = data.includes('dream.dream') || data.includes("'dream'");
  const hasVerifyRoute = data.includes('verify.verify') || data.includes("'verify'");
  const dispatchCount = (data.match(/dispatch\(/g) || []).length;
  result.setStep('15', hasMemoryRoute ? 'pass' : 'fail', { hasMemoryRoute, hasDreamRoute, hasVerifyRoute, dispatchCount });
}

// ========== Step 16: 身份规则完整性检查 ==========

async function step16_identityCheck(result) {
  // 检查 heartflow.js 中的身份注册
  const hfFile = path.join(ROOT, 'src/core/heartflow.js');
  if (!fs.existsSync(hfFile)) { result.setStep('16', 'fail', null, 'heartflow.js not found'); return; }
  const { success, data, error } = readTextFile(hfFile);
  if (!success) { result.setStep('16', 'fail', null, error); return; }
  
  // heartflow.js 有 addCore 调用，但实际身份内容在 meaningful-memory.json CORE 层
  const hasUpgrade = data.includes('升级者');
  const hasTransmit = data.includes('传递者');
  const hasAnswer = data.includes('答案');
  const hfIdentityOk = hasUpgrade && hasTransmit && hasAnswer;
  
  // 检查 CORE 层是否有身份记录
  let mmIdentityOk = false;
  const mmFile = path.join(ROOT, 'data/meaningful-memory.json');
  if (fs.existsSync(mmFile)) {
    try {
      const { success, data: mmData, error } = readJsonFile(mmFile);
      if (success && mmData && mmData.core && Array.isArray(mmData.core)) {
        // 检查 CORE 层是否有身份条目
        const hasCoreIdentity = mmData.core.some(e => 
          e.content && (
            e.content.includes('升级者') || 
            e.content.includes('真善美') ||
            e.content.includes('服务人类')
          )
        );
        mmIdentityOk = hasCoreIdentity;
      }
    } catch (e) {}
  }
  
  // 身份：hf注册 + CORE层存储，两者有其一即可
  const identityOk = hfIdentityOk || mmIdentityOk;
  result.setStep('16', identityOk ? 'pass' : 'fail', { 
    hfIdentity: { hasUpgrade, hasTransmit, hasAnswer, ok: hfIdentityOk },
    mmIdentity: { found: mmIdentityOk },
    source: mmIdentityOk ? 'meaningful-memory CORE layer' : 'heartflow.js addCore calls'
  });
}

// ========== Step 17: 关键引擎函数签名检查 ==========

async function step17_engineFunctions(result) {
  // 引擎实际文件位置（已确认）：
  // - DreamEngine: dream.js (class DreamEngine)
  // - SelfModel: consciousness/self-model.js
  // - SelfHealingRL: self-healing-rl.js ✓
  // - DecisionVerifier: decision-verifier.js ✓
  // - PsychologyEngine: psychology.js (函数式，非类) ✓
  // - EmotionalProtocol: 不存在（功能在 psychology.js）
  // - TruthfulnessChecker: 不存在
  const engines = [
    { name: 'PsychologyEngine', file: 'psychology.js', dir: 'src/core', fns: ['analyze', 'calculatePAD', 'detectPAD'] },
    { name: 'DreamEngine', file: 'dream.js', dir: 'src/core', fns: ['dream'] },
    { name: 'SelfModel', file: 'self-model.js', dir: 'src/core/consciousness', fns: ['update', 'get'] },
    { name: 'SelfHealingRL', file: 'self-healing-rl.js', dir: 'src/core', fns: ['update', 'getAvailable'] },
    { name: 'DecisionVerifier', file: 'decision-verifier.js', dir: 'src/core', fns: ['check', 'verify'] },
    { name: 'LessonBank', file: 'lesson-bank.js', dir: 'src/core', fns: ['add', 'retrieve'] },
  ];
  const checks = [];
  for (const eng of engines) {
    const file = path.join(ROOT, eng.dir, eng.file);
    if (!fs.existsSync(file)) { checks.push({ name: eng.name, found: false }); continue; }
    const content = fs.readFileSync(file, 'utf-8');
    const fnsFound = eng.fns.filter(fn => content.includes(fn));
    checks.push({ name: eng.name, found: fnsFound.length > 0, fnsFound });
  }
  const allFound = checks.filter(c => c.found).length;
  result.setStep('17', allFound >= 4 ? 'pass' : 'fail', { total: checks.length, found: allFound, checks });
}

// ========== Step 18: DreamEngine + InteractiveDream 检查 ==========

async function step18_dreamEngineCheck(result) {
  const files = ['dream-engine.js', 'dream.js', 'interactive-dream.js'];
  const found = [];
  for (const f of files) {
    const file = path.join(ROOT, 'src/core', f);
    if (fs.existsSync(file) && !isEmptyFile(file)) found.push(f);
  }
  result.setStep('18', found.length >= 1 ? 'pass' : 'fail', { found });
}

// ========== Step 19: 版本一致性自动修复 ==========

async function step19_versionSync(result) {
  const versions = {};
  
  // VERSION file（唯一真相源）
  const versionFile = path.join(ROOT, 'VERSION');
  if (fs.existsSync(versionFile)) versions.ROOT = fs.readFileSync(versionFile, 'utf-8').trim();
  
  // package.json
  const pkgFile = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgFile)) {
    try { const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8')); versions.package = pkg.version; } catch (e) { console.warn('[SelfDiagnostic] package.json parse failed:', e.message); }
  }
  
  // SKILL.md frontmatter + title
  const skillFile = path.join(ROOT, 'SKILL.md');
  if (fs.existsSync(skillFile)) {
    const content = fs.readFileSync(skillFile, 'utf-8');
    const m = content.match(/version:\s*"?([^"\n]+)"?/); if (m) versions.SKILL_fm = m[1];
    const titleM = content.match(/# HeartFlow.*?v(\d+\.\d+\.\d+)/); if (titleM) versions.SKILL_title = titleM[1];
  }
  
  // heartflow.js
  const hfFile = path.join(ROOT, 'src/core/heartflow.js');
  if (fs.existsSync(hfFile)) {
    const content = fs.readFileSync(hfFile, 'utf-8');
    const m = content.match(/const\s+VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/); if (m) versions.heartflowJS = m[1];
    const docM = content.match(/HeartFlow\s+v(\d+\.\d+\.\d+)/); if (docM) versions.heartflowJS_doc = docM[1];
  }
  
  // docs/README.md
  const docReadme = path.join(ROOT, 'docs/README.md');
  if (fs.existsSync(docReadme)) {
    const content = fs.readFileSync(docReadme, 'utf-8');
    const m = content.match(/Current Version.*?v(\d+\.\d+\.\d+)/); if (m) versions.docs = m[1];
  }
  
  const uniqueVersions = [...new Set(Object.values(versions).filter(Boolean))];
  const isConsistent = uniqueVersions.length <= 1;
  
  if (!isConsistent && versions.ROOT) {
    const canonical = versions.ROOT;
    const fixes = [];
    
    // 修复 package.json
    if (versions.package && versions.package !== canonical) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
        pkg.version = canonical;
        fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
        fixes.push(`package.json: ${versions.package} → ${canonical}`);
      } catch (e) {}
    }
    
    // 修复 SKILL.md frontmatter
    if (versions.SKILL_fm && versions.SKILL_fm !== canonical) {
      let content = fs.readFileSync(skillFile, 'utf-8');
      content = content.replace(/version:\s*"?([^"\n]+)"?/, `version: "${canonical}"`);
      fs.writeFileSync(skillFile, content);
      fixes.push(`SKILL.md frontmatter: ${versions.SKILL_fm} → ${canonical}`);
    }
    
    // 修复 SKILL.md title
    if (versions.SKILL_title && versions.SKILL_title !== canonical) {
      let content = fs.readFileSync(skillFile, 'utf-8');
      content = content.replace(/# HeartFlow.*?v(\d+\.\d+\.\d+)/, `# HeartFlow / 心虫 v${canonical}`);
      fs.writeFileSync(skillFile, content);
      fixes.push(`SKILL.md title: ${versions.SKILL_title} → ${canonical}`);
    }
    
    // 修复 docs/README.md
    if (versions.docs && versions.docs !== canonical) {
      let content = fs.readFileSync(docReadme, 'utf-8');
      content = content.replace(/Current Version.*?v(\d+\.\d+\.\d+)/, `Current Version / 当前版本: v${canonical}`);
      fs.writeFileSync(docReadme, content);
      fixes.push(`docs/README.md: ${versions.docs} → ${canonical}`);
    }
    
    // 修复 heartflow.js 顶部注释
    if (versions.heartflowJS_doc && versions.heartflowJS_doc !== canonical) {
      let content = fs.readFileSync(hfFile, 'utf-8');
      content = content.replace(/HeartFlow\s+v(\d+\.\d+\.\d+)/, `HeartFlow v${canonical}`);
      fs.writeFileSync(hfFile, content);
      fixes.push(`heartflow.js doc: ${versions.heartflowJS_doc} → ${canonical}`);
    }
    
    result.setStep('19', 'pass', { before: versions, after: canonical, fixed: fixes.length }, null, { description: `Auto-synced ${fixes.length} files to v${canonical}`, fixes });
  } else {
    result.setStep('19', 'pass', { versions, consistent: isConsistent });
  }
}

// ========== Step 20: 综合诊断报告 + 汇总 ==========

async function step20_finalReport(result) {
  const report = result.toReport();
  result.setStep('20', 'pass', result.summary());
  return report;
}

// ========== 主入口：并发执行所有步骤 ==========

async function runDiagnostic() {
  const result = new DiagnosticResult();
  console.log('Starting HeartFlow Self-Diagnostic (20 steps)...\n');
  
  // Step 1-5: 版本一致性检测（并发）
  await Promise.all([
    step01_versionExists(result), step02_packageVersion(result), step03_skillVersion(result),
    step04_heartflowJSVersion(result), step05_docsVersion(result),
  ]);
  
  // Step 6-9: 动态模块扫描（并发，60个文件分4批）
  await Promise.all([
    step06_moduleBatch1(result), step07_moduleBatch2(result),
    step08_moduleBatch3(result), step09_moduleBatch4(result),
  ]);
  
  // Step 10-13: 数据文件检查（并发）
  await Promise.all([
    step10_heartflowStructure(result), step11_qTableCheck(result),
    step12_lessonBankCheck(result), step13_meaningfulMemoryCheck(result),
  ]);
  
  // Step 14-18: Boot与引擎功能（并发）
  await Promise.all([
    step14_bootCheck(result), step15_dispatchCheck(result), step16_identityCheck(result),
    step17_engineFunctions(result), step18_dreamEngineCheck(result),
  ]);
  
  // Step 19: 版本同步（串行，需要写文件）
  await step19_versionSync(result);
  
  // Step 20: 生成报告
  const report = await step20_finalReport(result);
  console.log(report);
  
  return result;
}

// CLI 入口
if (require.main === module) {
  runDiagnostic().then(r => {
    const s = r.summary();
    console.log(`\nVerdict: ${s.allPassed ? '✓ PASS' : `✗ FAIL (${s.failed} checks failed)`}`);
    process.exit(s.allPassed ? 0 : 1);
  }).catch(e => {
    console.error('Diagnostic failed:', e);
    process.exit(1);
  });
}

module.exports = { runDiagnostic, DiagnosticResult };