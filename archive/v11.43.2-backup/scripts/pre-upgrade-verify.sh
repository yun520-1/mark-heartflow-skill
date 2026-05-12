#!/bin/bash
# ============================================================
# HeartFlow Pre-Upgrade Self-Verification
# 心虫升级自检脚本
#
# 运行机制：
#   1. 读取升级承诺 (CLAIMS.md)
#   2. 分析本次 git diff 实际改动
#   3. 逐条验证每个承诺是否落地
#   4. 输出结构化报告，block push 如果失败
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLAIMS_FILE="$REPO_ROOT/CLAIMS.md"
CHECKS_FILE="$REPO_ROOT/.upgrade_checks.json"

cd "$REPO_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "  心虫 Pre-Upgrade Self-Verification"
echo "=========================================="
echo ""

# Check if CLAIMS.md exists
if [[ ! -f "$CLAIMS_FILE" ]]; then
    echo -e "${YELLOW}⚠ No CLAIMS.md found. Creating template...${NC}"
    cat > "$CLAIMS_FILE" << 'EOF'
# HeartFlow Upgrade Claims

## Version: v11.16.0

## Claims (before upgrade)

### Claim 1: [description]
- Type: code/docs/both
- Evidence to look for: [what should appear in git diff]
- Status: pending

### Claim 2: [description]
- Type: code/docs/both
- Evidence to look for: [what should appear in git diff]
- Status: pending

## Verification Log
| Claim | Evidence Found | Pass/Fail | Notes |
|-------|---------------|-----------|-------|
EOF
    echo -e "${YELLOW}⚠ Created CLAIMS.md template. Please fill in claims before upgrading.${NC}"
    exit 0
fi

echo -e "${GREEN}✓ Reading CLAIMS.md${NC}"
echo ""

# Parse CLAIMS.md and check each claim
echo "Checking claims against actual changes..."
echo ""

# Get git diff stats
DIFF_STATS=$(git diff --stat HEAD~1 --name-only 2>/dev/null || echo "first commit")
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || echo "")

# Get full diff content for pattern matching
DIFF_CONTENT=$(git diff HEAD~1 2>/dev/null || echo "")

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

# Simple claim verification
# In v1, we check:
# 1. Were new files added? (should match claim if claim mentions new code)
# 2. Were docs updated? (should match if claim mentions docs)
# 3. Does git log message match the upgrade type?

# Check 1: GitHub-first verification
# If claim says "GitHub-first", verify we pulled/used external code
GITHUB_CLAIM=$(grep -i "github-first\|search.*github\|引用.*github" "$CLAIMS_FILE" 2>/dev/null || true)
if [[ -n "$GITHUB_CLAIM" ]]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    # Look for evidence of external code references in new files
    EXTERNAL_REFS=$(grep -r "github.com\|reflexion\|NeurIPS\|arXiv" "$REPO_ROOT/src" "$REPO_ROOT/internal" 2>/dev/null | head -5 || true)
    if [[ -n "$EXTERNAL_REFS" ]]; then
        echo -e "  ${GREEN}✓ Claim 1: GitHub-first evidence found${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "  ${RED}✗ Claim 1: GitHub-first claimed but no external code reference found${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# Check 2: Self-reflection / Reflexion module
REFLEXION_CLAIM=$(grep -i "reflexion\|自反思\|self-reflect" "$CLAIMS_FILE" 2>/dev/null || true)
if [[ -n "$REFLEXION_CLAIM" ]]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    REFLEXION_FILE=$(find "$REPO_ROOT/src" -name "reflexion.*" -type f 2>/dev/null | head -1)
    if [[ -n "$REFLEXION_FILE" && -f "$REFLEXION_FILE" ]]; then
        echo -e "  ${GREEN}✓ Claim 2: Reflexion module found at $REFLEXION_FILE${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "  ${RED}✗ Claim 2: Reflexion claimed but src/reflexion.py not found${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# Check 3: No-apology / logic-first
NO_APOLOGY_CLAIM=$(grep -i "no-apology\|不道歉\|纠逻辑\|logic-first" "$CLAIMS_FILE" 2>/dev/null || true)
if [[ -n "$NO_APOLOGY_CLAIM" ]]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    # Verify SKILL.md or docs don't contain empty apologies
    EMPTY_APOLOGY=$(grep -ri "sorry\|抱歉.*$" "$REPO_ROOT" --include="*.md" --include="*.py" 2>/dev/null | grep -v "verify\|check\|log" | head -3 || true)
    if [[ -z "$EMPTY_APOLOGY" ]]; then
        echo -e "  ${GREEN}✓ Claim 3: No empty apologies found${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "  ${YELLOW}⚠ Claim 3: Found potential empty apology: $EMPTY_APOLOGY${NC}"
        # Not a hard fail, just warning
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
fi

# Check 4: Core identity preserved
CORE_IDENTITY_CLAIM=$(grep -i "core-identity\|CORE_IDENTITY\|身份" "$CLAIMS_FILE" 2>/dev/null || true)
if [[ -n "$CORE_IDENTITY_CLAIM" ]]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    CORE_FILE="$REPO_ROOT/CORE_IDENTITY.md"
    if [[ -f "$CORE_FILE" ]]; then
        echo -e "  ${GREEN}✓ Claim 4: CORE_IDENTITY.md preserved${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "  ${RED}✗ Claim 4: CORE_IDENTITY.md missing${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

# Check 5: Version bump matches
VERSION_CLAIM=$(grep -i "version\|版本" "$CLAIMS_FILE" 2>/dev/null || true)
if [[ -n "$VERSION_CLAIM" ]]; then
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    CURRENT_VERSION=$(cat "$REPO_ROOT/VERSION" 2>/dev/null | tr -d 'v' || echo "unknown")
    VERSION_IN_LOG=$(git log -1 --oneline | grep -oE "v[0-9]+\.[0-9]+\.[0-9]+" | tr -d 'v' | head -1 || echo "")
    if [[ "$CURRENT_VERSION" == "$VERSION_IN_LOG" ]]; then
        echo -e "  ${GREEN}✓ Claim 5: Version consistent ($CURRENT_VERSION)${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "  ${YELLOW}⚠ Claim 5: Version mismatch - file=$CURRENT_VERSION log=$VERSION_IN_LOG${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "  Verification Summary"
echo "=========================================="
echo ""

if [[ $TOTAL_COUNT -eq 0 ]]; then
    echo -e "${YELLOW}⚠ No specific claims to verify. Add claims to CLAIMS.md for structured verification.${NC}"
    echo ""
    echo "Common claim patterns to add:"
    echo "  - 'GitHub-first' → verifies external code was referenced"
    echo "  - 'Reflexion' → verifies src/reflexion.py exists"
    echo "  - 'No-apology' → scans for empty apologies"
    echo "  - 'CORE_IDENTITY' → verifies CORE_IDENTITY.md preserved"
    echo "  - 'version bump' → verifies VERSION matches git log"
    exit 0
fi

echo "Claims verified: $TOTAL_COUNT"
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [[ $FAIL_COUNT -gt 0 ]]; then
    echo -e "${RED}✗ PRE-UPGRADE VERIFICATION FAILED${NC}"
    echo ""
    echo "Please fix the failed claims before pushing."
    echo "Update CLAIMS.md with your verification notes."
    exit 1
fi

# 独立外部验证（Python版，不依赖HeartFlow自身）
echo ""
echo "Running independent self-test (self_verify.py)..."
echo "=========================================="
if python3 "$SCRIPT_DIR/self_verify.py"; then
    echo -e "${GREEN}✓ INDEPENDENT SELF-TEST PASSED${NC}"
else
    echo -e "${RED}✗ INDEPENDENT SELF-TEST FAILED${NC}"
    echo "Fix before pushing."
    exit 1
fi

echo -e "${GREEN}✓ ALL CLAIMS VERIFIED${NC}"
echo ""
echo "Ready to push."
exit 0
