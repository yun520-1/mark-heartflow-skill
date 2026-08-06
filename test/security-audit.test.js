// test/security-audit.test.js — 2026-08-06 深度安全审计修复回归测试
// 保护：S-1 guardPath 路径约束 / S-2 execFileSync 参数化 / I-4 fuser 无藏错 + PORT 守卫
const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── S-1: guardPath 越界拦截 ───
t('S1: guardPath 拒绝 /etc/passwd', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath('/etc/passwd');
  if (r.safe !== false) throw new Error(`expected safe=false, got ${r.safe}`);
});

t('S1: guardPath 拒绝 ~/.ssh 密钥', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath('/Users/apple/.ssh/id_rsa');
  if (r.safe !== false) throw new Error('ssh key path should be rejected');
});

t('S1: guardPath 放行内部 data/benchmark', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath(path.join(PROJECT_ROOT, 'data', 'benchmark'));
  if (r.safe !== true) throw new Error(`internal path should pass: ${r.reason}`);
});

t('S1: guardPath 放行项目内 src 文件', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'));
  if (r.safe !== true) throw new Error(`src path should pass: ${r.reason}`);
});

t('S1: guardPath 拒绝路径穿越 ..', () => {
  const { guardPath } = require('../src/core/path-guard.js');
  const r = guardPath(path.join(PROJECT_ROOT, 'data', '..', '..', 'etc', 'passwd'));
  // path.resolve 已规范化，最终落在 /etc/passwd → 应被拒
  if (r.safe !== false) throw new Error(`traversal should be rejected, got safe=${r.safe}`);
});

// ─── S-1: MCP 三个 benchmark handler 均含 guardPath 调用 ───
t('S1: 3 个 benchmark handler 都含 guardPath 约束', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const handlers = ['handleBenchmarkStatus', 'handleBenchmarkRun', 'handleBenchmarkImportFailures'];
  for (const h of handlers) {
    const idx = src.indexOf('function ' + h);
    if (idx < 0) throw new Error(`handler ${h} not found`);
    const block = src.slice(idx, idx + 1500);
    if (!block.includes('guardPath')) throw new Error(`${h} 缺少 guardPath 约束`);
  }
});

// ─── S-2: smart-upgrade 参数化（无 shell 字符串拼接） ───
t('S2: smart-upgrade-engine 不再用 execSync shell 拼接', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'cortex', 'smart-upgrade-engine.js'), 'utf-8');
  if (src.includes('execSync(`git')) throw new Error('仍存在 execSync shell 拼接');
  if (!src.includes('execFileSync')) throw new Error('未使用 execFileSync 参数化');
});

t('S2: _verifyGitCommit 真实工作（参数化后仍命中版本）', () => {
  const pkg = require('../package.json');
  const { execFileSync } = require('child_process');
  const out = execFileSync('git', ['-C', PROJECT_ROOT, 'log', '--oneline', '--all'], { stdio: ['ignore', 'pipe', 'ignore'] });
  const matches = out.toString().split('\n').filter(l => l.includes('v' + pkg.version)).length;
  if (matches < 1) throw new Error(`git log 未命中 v${pkg.version}`);
});

// ─── I-4: fuser 无 2>/dev/null 藏错 + PORT 数字守卫 ───
t('I4: fuser 命令不再含 2>/dev/null 藏错', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const fuserIdx = src.indexOf('fuser -k');
  if (fuserIdx < 0) throw new Error('fuser 命令未找到');
  const block = src.slice(fuserIdx - 200, fuserIdx + 300);
  if (block.includes('2>/dev/null')) throw new Error('fuser 仍藏错 2>/dev/null');
});

t('I4: fuser 前有 PORT 数字守卫', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const fuserIdx = src.indexOf('fuser -k');
  const block = src.slice(fuserIdx - 500, fuserIdx);
  if (!block.includes('/^\\d+$/.test(String(PORT))')) throw new Error('PORT 数字守卫缺失');
});

// ─── I-5: 文档与代码一致性 ───
t('I5: SKILL.md 版本与 package.json 对齐', () => {
  const skill = fs.readFileSync(path.join(PROJECT_ROOT, 'SKILL.md'), 'utf-8');
  const pkg = require('../package.json');
  const m = skill.match(/version:\s*"([^"]+)"/);
  if (!m || m[1] !== pkg.version) throw new Error(`SKILL.md ${m?.[1]} != package.json ${pkg.version}`);
});

t('I5: SECURITY.md 不再描述不存在的代码沙箱', () => {
  const sec = fs.readFileSync(path.join(PROJECT_ROOT, 'SECURITY.md'), 'utf-8');
  if (sec.includes('code-executor.js')) throw new Error('SECURITY.md 仍引用不存在的 code-executor.js');
  if (!sec.includes('discrimination')) throw new Error('SECURITY.md 未描述辨别引擎定位');
});

// ─── I-2: tools/call 中央参数校验 ───
t('I2: tools/call 含中央参数 schema 校验', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  if (!src.includes('[AUDIT-FIX I-2]')) throw new Error('I-2 校验标记缺失');
  if (!src.includes('let { name, arguments: args = {} }')) throw new Error('args 未改为 let 可重赋值');
});

t('I2: TOOLS 工具定义均含 inputSchema.properties', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  const toolsStart = src.indexOf('const TOOLS = [');
  const toolsEnd = src.indexOf('];', toolsStart);
  const block = src.slice(toolsStart, toolsEnd);
  if (!block.includes('inputSchema')) throw new Error('TOOLS 缺 inputSchema');
  if (!block.includes('properties')) throw new Error('TOOLS 缺 properties');
});

// ─── P1-4: 错误信息收敛 ───
t('P14: 错误返回含路径收敛标记', () => {
  const src = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'mcp-server.js'), 'utf-8');
  if (!src.includes('[AUDIT-FIX P1-4]')) throw new Error('P1-4 收敛逻辑缺失');
  if (!src.includes('[path]')) throw new Error('路径收敛替换缺失');
});

console.log(`\n安全审计回归: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
