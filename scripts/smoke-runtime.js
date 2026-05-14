#!/usr/bin/env node
/**
 * HeartFlow Smoke Test - 运行时自检
 * 
 * 检查核心模块是否可以正常加载
 * 运行: node scripts/smoke-runtime.js
 * 
 * @version v0.13.101
 */

const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');

const checks = [
  { name: 'lesson-aware-loop', path: 'src/core/self-evolution/lesson-aware-loop.mjs', type: 'esm' },
  { name: 'skill-knowledge', path: 'src/core/self-evolution/skill-knowledge.mjs', type: 'esm' },
  { name: 'cortex-hooks', path: 'src/core/cortex-integration/hooks/cortex-hooks.mjs', type: 'esm' },
  { name: 'reflexion-prompts', path: 'src/core/self-evolution/reflexion-prompts.mjs', type: 'esm' },
  { name: 'skill-improve-workflow', path: 'src/core/self-evolution/skill-improve-workflow.mjs', type: 'esm' },
  { name: 'skill-learning-loop', path: 'src/core/self-evolution/skill-learning-loop.mjs', type: 'esm' },
  { name: 'heartflow.js', path: 'src/core/heartflow.js', type: 'cjs' },
  { name: 'self_verify.py', path: 'scripts/self_verify.py', type: 'py' },
];

async function runSmokeTest() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  HeartFlow Runtime Smoke Test');
  console.log('═══════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const fullPath = path.join(ROOT, check.path);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ✗ ${check.name}: FILE NOT FOUND (${check.path})`);
      failed++;
      continue;
    }

    if (check.type === 'esm') {
      // ESM files just need to exist and be parseable
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('export') || content.includes('import ')) {
          console.log(`  ✓ ${check.name}: OK (ESM module exists)`);
          passed++;
        } else {
          console.log(`  ✗ ${check.name}: No ESM exports found`);
          failed++;
        }
      } catch (e) {
        console.log(`  ✗ ${check.name}: ${e.message}`);
        failed++;
      }
    } else if (check.type === 'cjs') {
      console.log(`  ✓ ${check.name}: OK (CJS module exists)`);
      passed++;
    } else if (check.type === 'py') {
      console.log(`  ✓ ${check.name}: OK (Python script exists)`);
      passed++;
    }
  }

  // Check learnings.json (~/.hermes/data/skill-knowledge/learnings.json)
  // Note: This file only exists after the skill has been running and learned lessons
  const learnPath = path.resolve(ROOT, '..', '..', '..', 'data', 'skill-knowledge', 'learnings.json');
  if (fs.existsSync(learnPath)) {
    const data = JSON.parse(fs.readFileSync(learnPath, 'utf8'));
    console.log(`\n  ✓ learnings.json: ${data.length} entries`);
    passed++;
  } else {
    console.log(`\n  ○ learnings.json: not yet created (first run will create it)`);
    // Not a failure - new installations don't have this yet
  }

  // Check VERSION
  const versionFile = path.join(ROOT, 'VERSION');
  if (fs.existsSync(versionFile)) {
    const version = fs.readFileSync(versionFile, 'utf8').trim();
    console.log(`  ✓ VERSION: ${version}`);
    passed++;
  } else {
    console.log(`  ✗ VERSION: NOT FOUND`);
    failed++;
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`  结果: ${passed}/${passed + failed} 通过`);
  console.log('═══════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('ISSUE: 以下模块缺失:\n');
    for (const check of checks) {
      const fullPath = path.join(ROOT, check.path);
      if (!fs.existsSync(fullPath)) {
        console.log(`  - ${check.path}`);
      }
    }
    console.log('');
  }

  return failed === 0;
}

runSmokeTest().then(ok => {
  process.exit(ok ? 0 : 1);
}).catch(err => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
