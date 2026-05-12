#!/usr/bin/env python3
"""
HeartFlow Self-Test v11.17.3
独立验证：不依赖HeartFlow自身代码，用外部标准验证

运行方式:
  python3 self_verify.py [--skip-git] [--verbose]

退出码:
  0 = 全部通过
  1 = 有失败
"""

import subprocess
import json
import sys
import os
import re
from pathlib import Path

# 心虫根目录
REPO_ROOT = Path(__file__).parent.parent.resolve()

RED   = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
NC   = '\033[0m'

def run(cmd, cwd=None, capture=True):
    """执行shell命令，返回 (success, stdout, stderr)"""
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd or REPO_ROOT,
            capture_output=capture, text=True, timeout=60
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return False, '', str(e)

def check(name, condition, details=''):
    """记录检查结果"""
    status = f"{GREEN}✓ PASS{NC}" if condition else f"{RED}✗ FAIL{NC}"
    print(f"  {status} {name}")
    if details and not condition:
        print(f"         {details}")
    return condition

# ── 1. 基础文件完整性 ──────────────────────────────────

def verify_files():
    print("\n📦 基础文件完整性")
    checks = []
    
    # VERSION 文件存在且非空
    vfile = REPO_ROOT / "VERSION"
    checks.append(check("VERSION 存在", vfile.exists()))
    if vfile.exists():
        version = vfile.read_text().strip()
        checks.append(check("VERSION 非空", len(version) > 0, f"内容: {version}"))
        checks.append(check("VERSION 格式正确 (v11.x.x)", re.match(r'v11\.\d+\.\d+', version), f"内容: {version}"))
    
    # SKILL.md 存在
    skill = REPO_ROOT / "SKILL.md"
    checks.append(check("SKILL.md 存在", skill.exists()))
    
    # README.md 存在
    readme = REPO_ROOT / "README.md"
    checks.append(check("README.md 存在", readme.exists()))
    
    # package.json 存在
    pkg = REPO_ROOT / "package.json"
    checks.append(check("package.json 存在", pkg.exists()))
    
    return all(checks)

# ── 2. stateful-agent.js 核心自测 ──────────────────────

def verify_stateful_agent():
    print("\n🧠 StatefulAgent 核心自测")
    checks = []
    
    sa_path = REPO_ROOT / "src/core/stateful-agent.js"
    checks.append(check("stateful-agent.js 存在", sa_path.exists()))
    
    # 用 node 运行官方自测
    test_code = '''
const { StatefulAgent } = require('./src/core/stateful-agent.js');
const agent = new StatefulAgent({ name: 'VerifyTest' });
agent.saveCoreMemory('verify-me');
const result = agent.recall('verify');
const ok = result[0]?.content === 'verify-me';
process.stdout.write(ok ? 'PASS' : 'FAIL:' + JSON.stringify(result));
process.exit(ok ? 0 : 1);
'''
    
    success, stdout, stderr = run(f'node -e "{test_code}"', cwd=REPO_ROOT)
    checks.append(check("StatefulAgent recall 自测", success, stdout[:100]))
    
    return all(checks)

# ── 3. goal-tracker.js 独立自测 ────────────────────────

def verify_goal_tracker():
    print("\n🎯 goal-tracker.js 独立自测")
    checks = []
    
    gt_path = REPO_ROOT / "src/core/goal-tracker.js"
    checks.append(check("goal-tracker.js 存在", gt_path.exists()))
    
    # 运行 goal-tracker report
    success, stdout, stderr = run('node src/core/goal-tracker.js report', cwd=REPO_ROOT)
    checks.append(check("goal-tracker.js 能运行", success, stderr[:80]))
    checks.append(check("goal-tracker 有输出", '目标' in stdout or 'goal' in stdout.lower(), stdout[:60]))
    
    return all(checks)

# ── 4. DecisionVerifier 独立测试 ─────────────────────

def verify_decision_verifier():
    print("\n⚖️  DecisionVerifier 独立测试")
    checks = []

    dv_path = REPO_ROOT / "src/core/decision-verify-cli.js"
    checks.append(check("decision-verify-cli.js 存在", dv_path.exists()))

    # 测试1：低质量决策应被拒绝
    success1, out1, _ = run(
        'node src/core/decision-verify-cli.js "投资" --reason "看起来有前景" --confidence 0.5',
        cwd=REPO_ROOT
    )
    checks.append(check("低质量决策被拒绝", not success1, out1[:80]))

    # 测试2：有证据的决策应通过
    success2, out2, _ = run(
        'node src/core/decision-verify-cli.js "投资AI" --reason "市场增长" --evidence "报告:增长50%" --confidence 0.8',
        cwd=REPO_ROOT
    )
    checks.append(check("有证据决策通过", success2 and '通过' in out2, out2[:80]))

    return all(checks)

# ── 4. LanguageHonesty 集成检测 ────────────────────────

def verify_language_honesty():
    print("\n💬 LanguageHonesty 集成检测")
    checks = []
    
    # 检查 engine 里有没有 require language-honesty
    engine_path = REPO_ROOT / "src/core/heartflow-engine.js"
    if engine_path.exists():
        content = engine_path.read_text()
        has_require = "language-honesty" in content.lower()
        checks.append(check("heartflow-engine.js require LanguageHonesty", has_require))
        
        # 检查有没有 validateOutput 调用
        has_call = "validateOutput" in content
        checks.append(check("LanguageHonesty.validateOutput 被调用", has_call))
    
    # 实际测试
    test_code = '''
const h = require('./src/core/heartflow-engine.js');
h.initialize();
(async () => {
  const r = await h.processInput('我认为这就是本质，你绝对应该这样做');
  const lh = r.stages?.languageHonesty;
  if (!lh) { console.log('NO_INTEGRATION'); process.exit(1); }
  if (lh.passed === false) { console.log('DETECTION_WORKS:' + lh.certaintyLevel); process.exit(0); }
  console.log('UNEXPECTED:' + JSON.stringify(lh));
  process.exit(1);
})();
'''
    success, stdout, stderr = run(f'node -e "{test_code}"', cwd=REPO_ROOT)
    if 'DETECTION_WORKS' in stdout:
        checks.append(check("绝对判断词检测生效", True, stdout[:60]))
    elif 'NO_INTEGRATION' in stdout:
        checks.append(check("LanguageHonesty 集成到 processInput", False, "stages.languageHonesty 不存在"))
    else:
        checks.append(check("LanguageHonesty 集成到 processInput", False, stdout[:80]))
    
    return all(checks)

# ── 5. CLAIMS.md 版本一致性 ─────────────────────────────

def verify_claims():
    print("\n📋 CLAIMS.md 版本一致性")
    checks = []
    
    claims_file = REPO_ROOT / "CLAIMS.md"
    checks.append(check("CLAIMS.md 存在", claims_file.exists()))
    
    if claims_file.exists():
        content = claims_file.read_text()
        
        # VERSION 文件内容
        vfile = REPO_ROOT / "VERSION"
        version = vfile.read_text().strip() if vfile.exists() else ''
        
        # CLAIMS.md 里的版本
        claim_versions = re.findall(r'## Version: (v11\.\d+\.\d+)', content)
        if claim_versions:
            cv = claim_versions[0]
            checks.append(check("CLAIMS.md 版本 == VERSION 文件", cv == version, f"CLAIMS={cv}, VERSION={version}"))
        else:
            checks.append(check("CLAIMS.md 有版本声明", False, "找不到 ## Version: v11.x.x"))
    
    return all(checks)

# ── 6. 最近的 git 提交有文件变化 ──────────────────────

def verify_git_changes():
    print("\n📡 Git 提交有实际变化")
    checks = []
    
    success, stdout, stderr = run('git diff --stat HEAD~1', cwd=REPO_ROOT)
    if success and stdout:
        lines = [l for l in stdout.strip().split('\n') if l]
        files_changed = len(lines)
        checks.append(check("上次提交有文件变化", files_changed > 0, f"{files_changed} 个文件"))
        if files_changed > 0:
            print(f"         变化: {', '.join(l.split()[1] if len(l.split())>1 else l for l in lines[:5])}")
    else:
        checks.append(check("git diff HEAD~1 能执行", False, stderr[:60]))
    
    return all(checks)

# ── 主流程 ───────────────────────────────────────────

def main():
    print("=" * 50)
    print("  HeartFlow Self-Test v11.17.3")
    print("  独立验证：外部标准，不依赖自身代码")
    print("=" * 50)
    
    results = []
    results.append(("文件完整性", verify_files()))
    results.append(("StatefulAgent", verify_stateful_agent()))
    results.append(("GoalTracker", verify_goal_tracker()))
    results.append(("DecisionVerifier", verify_decision_verifier()))
    results.append(("LanguageHonesty", verify_language_honesty()))
    results.append(("CLAIMS一致性", verify_claims()))
    results.append(("Git变化", verify_git_changes()))
    
    print("\n" + "=" * 50)
    print("  测试总结")
    print("=" * 50)
    
    total_pass = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, passed in results:
        status = f"{GREEN}✓{NC}" if passed else f"{RED}✗{NC}"
        print(f"  {status} {name}")
    
    print()
    if total_pass == total:
        print(f"{GREEN}✓ 全部通过 ({total_pass}/{total}){NC}")
        print("  Ready to push.")
        sys.exit(0)
    else:
        print(f"{RED}✗ 有 {total - total_pass} 项失败 ({total_pass}/{total}){NC}")
        print("  Please fix before pushing.")
        sys.exit(1)

if __name__ == "__main__":
    main()
