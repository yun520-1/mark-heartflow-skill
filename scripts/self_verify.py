#!/usr/bin/env python3
"""
HeartFlow self verification script.
Minimal executable verification for current Node.js core.
"""

import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def exists(rel):
    return (ROOT / rel).exists()


def run_node(script: str):
    proc = subprocess.run(
        ["node", "-e", script],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def check_files():
    required = [
        "CAPABILITY.md",
        "CORE_IDENTITY.md",
        "src/core/heartflow-engine.js",
        "src/core/identity-engine.js",
        "src/core/self-healing.js",
        "src/core/stability-guard.js",
        "src/core/execution-verifier.js",
    ]
    missing = [item for item in required if not exists(item)]
    return len(missing) == 0, {"missing": missing}


def check_runtime_load():
    script = r'''
const hf = require('./src/core/heartflow-engine.js');
require('./src/core/identity-engine.js');
require('./src/core/self-healing.js');
require('./src/core/stability-guard.js');
require('./src/core/execution-verifier.js');
const res = hf.runRuntimeReliabilityLoop(
  { success: true, actions: ['verify'], notes: 'verify runtime stability' },
  {
    plan: { actions: ['verify'], expectedOutcome: 'verify' },
    confidence: 0.82,
    noiseRatio: 0.1,
    actionability: 0.9,
  }
);
console.log(JSON.stringify({
  allow: res.allow,
  stable: res.stable,
  hasGuard: !!res.guard,
  hasRecovery: !!res.recovery,
  hasVerification: !!res.verification,
  hints: Array.isArray(res.hints) ? res.hints.length : -1
}));
'''
    code, stdout, stderr = run_node(script)
    if code != 0:
        return False, {"error": stderr or stdout}
    try:
        last_line = stdout.splitlines()[-1]
        payload = json.loads(last_line)
        ok = all([
            payload.get("allow") is True,
            payload.get("stable") is True,
            payload.get("hasGuard") is True,
            payload.get("hasRecovery") is True,
            payload.get("hasVerification") is True,
        ])
        return ok, payload
    except Exception as exc:
        return False, {"error": f"parse_failed: {exc}", "stdout": stdout, "stderr": stderr}


def main():
    checks = {
        "required_files": check_files(),
        "runtime_load": check_runtime_load(),
    }

    all_passed = all(ok for ok, _ in checks.values())
    print("=" * 50)
    print("HeartFlow Self Verification")
    print("=" * 50)
    for name, (ok, detail) in checks.items():
        print(f"{'✅' if ok else '❌'} {name}: {json.dumps(detail, ensure_ascii=False)}")
    print("✅ 所有检查通过" if all_passed else "⚠️ 部分检查未通过")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
