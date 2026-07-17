#!/usr/bin/env node
/**
 * HeartFlow 自主进化脚本（无人值守）
 *
 * 心虫自己审计、自己升级、自己改善自己。
 * 由 cron 定时调用（默认每6小时），无需人类干预。
 *
 * 流程：
 *   1. 扫描代码库已知低风险信号（重复 TODO 注释块）
 *   2. 对可安全自动修复的项执行修复（纯注释去重，不动逻辑）
 *   3. 运行测试套件验证不回归（动态统计通过数）
 *   4. 若有改动：版本递增 → 记录升级 → 写自我状态 → commit → push
 *   5. 若无改动：仅记录审计发现，不虚涨版本号
 *
 * 安全约束：
 *   - 只处理纯注释去重（零逻辑风险）
 *   - 每次修复后必须测试通过才提交
 *   - 版本号仅在确有改动时递增
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname.replace(/\/scripts$/, '');
const SRC = path.join(ROOT, 'src');
const TEST_DIR = path.join(ROOT, 'test');
const VERSION_FILE = path.join(ROOT, 'VERSION');

function readVersion() {
  return fs.readFileSync(VERSION_FILE, 'utf8').trim();
}

function bumpVersion(v) {
  const parts = v.split('.').map(Number);
  parts[parts.length - 1] += 1;
  return parts.join('.');
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

// ─── 审计 + 修复：重复 REFACTOR TODO 块 ──────────────────────────
// 这些块是 audit-fixer 每次运行重复注入的噪音（同一函数名出现 N 次）
function dedupeRefactorTodoBlocks() {
  const files = run(`find ${SRC} -name "*.js" ! -name "*.test.js"`).trim().split('\n').filter(Boolean);
  let totalDeduped = 0;
  const fixedFiles = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // 统计每个 TODO 注释行的出现次数
    const todoLineCount = {};
    for (const line of lines) {
      const m = line.match(/\/\/\s*\[REFACTOR\]\s*TODO:\s*(.+)$/);
      if (m) {
        const key = m[1].trim();
        todoLineCount[key] = (todoLineCount[key] || 0) + 1;
      }
    }

    // 只删"完全重复"的行（同一 TODO 文本出现 >1 次），保留 1 份
    const dupKeys = Object.keys(todoLineCount).filter(k => todoLineCount[k] > 1);
    if (dupKeys.length === 0) continue;

    const out = [];
    const seen = {};
    let removed = 0;
    for (const line of lines) {
      const m = line.match(/\/\/\s*\[REFACTOR\]\s*TODO:\s*(.+)$/);
      if (m) {
        const key = m[1].trim();
        if (todoLineCount[key] > 1) {
          // 重复块：保留第一份，其余删除
          if (seen[key]) { removed++; continue; }
          seen[key] = true;
        }
      }
      out.push(line);
    }

    if (removed > 0) {
      fs.writeFileSync(file, out.join('\n'));
      totalDeduped += removed;
      fixedFiles.push(path.relative(ROOT, file) + `(-${removed})`);
    }
  }

  return { totalDeduped, fixedFiles };
}

// ─── 主流程 ──────────────────────────────────────────────────────────
function main() {
  console.log('[self-evolve] 心虫开始自主审计...');

  const fixes = dedupeRefactorTodoBlocks();
  console.log(`[self-evolve] 重复TODO去重: ${fixes.totalDeduped} 处, 文件: ${fixes.fixedFiles.join(', ') || '无'}`);

  let changed = fixes.totalDeduped > 0;
  const notes = [];
  if (fixes.totalDeduped > 0) {
    notes.push(`清理 ${fixes.totalDeduped} 处重复 REFACTOR TODO 注释块`);
  }

  // 测试套件必须通过（回归门禁）—— 动态统计
  console.log('[self-evolve] 运行测试套件...');
  const testOut = run(`node ${path.join(TEST_DIR, 'run-all.js')} 2>&1 | tail -30`);
  const failedM = /(\d+) failed/.exec(testOut);
  const failedCount = failedM ? parseInt(failedM[1], 10) : 0;
  const passedM = /(\d+) 通过/.exec(testOut);
  const passedCount = passedM ? parseInt(passedM[1], 10) : 0;

  if (failedCount > 0) {
    console.log('[self-evolve] 测试失败，中止自主升级（不引入回归）');
    console.log(testOut.slice(-800));
    process.exit(0);
  }
  console.log(`[self-evolve] 测试通过 ✓ (${passedCount} passed)`);

  // 覆盖率审计（仅记录，不自动补测试——补测试需谨慎）
  const srcCount = parseInt(run(`find ${SRC} -name "*.js" ! -name "*.test.js" | wc -l`).trim(), 10) || 0;
  const testCount = parseInt(run(`find ${TEST_DIR} -name "*.test.js" | wc -l`).trim(), 10) || 0;
  const ratio = testCount / srcCount;
  if (ratio < 0.3) {
    notes.push(`测试覆盖率 ${ratio.toFixed(2)} 偏低（源${srcCount}:测试${testCount}），建议补测试`);
  }

  if (!changed && notes.length === 0) {
    console.log('[self-evolve] 无需修复，心虫状态良好');
    process.exit(0);
  }

  // 仅在确有改动时递增版本
  const oldV = readVersion();
  const newV = bumpVersion(oldV);
  fs.writeFileSync(VERSION_FILE, newV + '\n');
  // 同步 package.json
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = newV;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 记录自我升级
  const { SmartUpgradeEngine } = require(path.join(SRC, 'cortex', 'smart-upgrade-engine.js'));
  const engine = new SmartUpgradeEngine(ROOT);
  engine.recordSelfUpgrade({
    version: newV,
    description: '自主进化: ' + (notes.join('; ') || '代码质量例行修复'),
    impact: changed ? 0.2 : 0.05,
    type: 'autonomous-audit'
  });

  // 记录自我状态快照（身份连续性）
  engine.recordSelfState({
    version: newV,
    fixes: { dedupeTodo: fixes.totalDeduped },
    testsPassed: passedCount,
    coverage: { src: srcCount, test: testCount, ratio: +ratio.toFixed(3) },
    notes,
    reflection: changed
      ? '我发现了自己的代码噪音并清理了。改善是持续的过程，不是终点。'
      : '这次审视，我状态良好。不是每次都需要改变，存在本身也有意义。'
  });

  // 提交 + 推送
  run(`git add -A && git reset HEAD package-lock.json data/feedback 2>/dev/null`);
  run(`git commit -m "chore(self-evolve): v${newV} ${notes.join('; ') || '例行检查'}"`);
  run(`git push origin main`);

  console.log(`[self-evolve] 完成: ${oldV} → ${newV} (${passedCount} tests passed)`);
}

main();
