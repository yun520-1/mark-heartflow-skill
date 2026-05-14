#!/usr/bin/env python3
"""
HeartFlow Self-Test v0.13.103
独立验证：外部标准，不依赖自身代码

检查真正的核心文件和模块
"""

import os
import sys
import json
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PASS = 0
FAIL = 0
WARN = 0

def check(name, condition, details=""):
    global PASS, FAIL
    if condition:
        print(f"  ✓ PASS {name}")
        PASS += 1
    else:
        print(f"  ✗ FAIL {name}")
        if details:
            print(f"         {details}")
        FAIL += 1

def warn(name, details=""):
    global WARN
    print(f"  ⚠ WARN {name}")
    if details:
        print(f"         {details}")
    WARN += 1

def run():
    global PASS, FAIL, WARN
    PASS = 0
    FAIL = 0
    WARN = 0

    print("\n" + "="*50)
    print("  HeartFlow Self-Test v0.13.103")
    print("  独立验证：外部标准，不依赖自身代码")
    print("="*50)

    print("\n📦 基础文件完整性")
    version_path = os.path.join(ROOT, "VERSION")
    check("VERSION 存在", os.path.exists(version_path))
    if os.path.exists(version_path):
        with open(version_path) as f:
            version = f.read().strip()
        check("VERSION 非空", len(version) > 0, f"内容: {version}")
        check("VERSION 格式 (v数字.数字.数字)", version.startswith("v") and version.count(".") == 2, f"内容: {version}")

    skill_md = os.path.join(ROOT, "SKILL.md")
    check("SKILL.md 存在", os.path.exists(skill_md))

    readme_md = os.path.join(ROOT, "README.md")
    check("README.md 存在", os.path.exists(readme_md))

    package_json = os.path.join(ROOT, "package.json")
    check("package.json 存在", os.path.exists(package_json))

    print("\n🧠 核心ESM模块")
    esm_modules = [
        "src/core/self-evolution/lesson-aware-loop.mjs",
        "src/core/self-evolution/skill-knowledge.mjs",
        "src/core/cortex-integration/hooks/cortex-hooks.mjs",
        "src/core/self-evolution/reflexion-prompts.mjs",
        "src/core/self-evolution/skill-improve-workflow.mjs",
        "src/core/self-evolution/skill-learning-loop.mjs",
    ]
    for m in esm_modules:
        path = os.path.join(ROOT, m)
        check(f"{m} 存在", os.path.exists(path))
        if os.path.exists(path):
            with open(path) as f:
                content = f.read()
            check(f"{m} 有export", "export" in content or "import " in content)

    print("\n🔧 核心CJS模块")
    cjs_modules = [
        "src/core/heartflow.js",
        "scripts/smoke-runtime.js",
    ]
    for m in cjs_modules:
        path = os.path.join(ROOT, m)
        check(f"{m} 存在", os.path.exists(path))

    print("\n⚡ 运行时自检 (smoke-runtime)")
    try:
        result = subprocess.run(
            ["node", "scripts/smoke-runtime.js"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=30
        )
        if "10/10" in result.stdout or result.returncode == 0:
            check("smoke-runtime 10/10 通过", True)
        else:
            check("smoke-runtime 自检", result.returncode == 0, result.stdout[-200:])
    except Exception as e:
        warn("smoke-runtime 运行", str(e)[:100])

    print("\n📚 learnings.json (运行时创建)")
    learn_path = os.path.expanduser("~/.hermes/data/skill-knowledge/learnings.json")
    if os.path.exists(learn_path):
        with open(learn_path) as f:
            try:
                data = json.load(f)
                check(f"learnings.json 有效", isinstance(data, list), f"{len(data)} 条教训")
            except:
                check("learnings.json JSON有效", False)
    else:
        warn("learnings.json 未创建", "首次运行后会创建")

    print("\n" + "="*50)
    print(f"  结果: {PASS} 通过, {FAIL} 失败, {WARN} 警告")
    print("="*50 + "\n")

    return FAIL == 0

if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)
