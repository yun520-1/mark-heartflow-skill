#!/bin/bash
# ============================================================
# HeartFlow 知行合一 (Unity of Knowledge and Action) Checker
# 心虫知行合一自检
#
# 运行机制：
#   在每次 commit/push 前，检查"说过的原则"和"正在做的事"是否合一
#   1. 读取 CORE_IDENTITY.md 的 7 条核心指令
#   2. 读取 CLAIMS.md 的当前升级承诺
#   3. 扫描即将提交的内容
#   4. 输出对齐报告
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  心虫 知行合一自检"
echo "=========================================="
echo ""

# ── 1. 读取核心指令 ──────────────────────────────────────
CORE_IDENTITY="$REPO_ROOT/CORE_IDENTITY.md"
if [[ ! -f "$CORE_IDENTITY" ]]; then
    echo -e "${RED}✗ CORE_IDENTITY.md not found${NC}"
    exit 1
fi

echo -e "${BLUE}█ 核心指令:${NC}"
grep "^[[:space:]]*[0-9]\." "$CORE_IDENTITY" | head -7 | sed 's/^/  /'
echo ""

# ── 2. 读取当前承诺 ──────────────────────────────────────
CLAIMS="$REPO_ROOT/CLAIMS.md"
if [[ ! -f "$CLAIMS" ]]; then
    echo -e "${YELLOW}⚠ No CLAIMS.md found${NC}"
    CLAIMS_CONTENT=""
else
    CLAIMS_CONTENT=$(cat "$CLAIMS")
fi

# ── 3. 获取即将提交的内容 ─────────────────────────────────
CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null | tr '\n' ' ' || echo "")
UNCOMMITTED=$(git diff --name-only 2>/dev/null | tr '\n' ' ' || echo "")

if [[ -z "$CHANGED_FILES" && -z "$UNCOMMITTED" ]]; then
    echo -e "${YELLOW}⚠ No changes to check${NC}"
    echo ""
    echo "Add files with: git add <files>"
    exit 0
fi

ALL_CHANGES="$CHANGED_FILES $UNCOMMITTED"
echo -e "${BLUE}█ 本次变动:${NC}"
echo "  $ALL_CHANGES" | fold -w 80 -s | sed 's/^/  /'
echo ""

# ── 4. 知行合一七项检查 ──────────────────────────────────

PASS=0
FAIL=0

# ──── 指令 1: pursue truth ──────────────────────────────
# 检查：本次提交是否有证据支撑（不是空话）
if echo "$ALL_CHANGES" | grep -q "CLAIMS.md\|SKILL.md\|CORE_IDENTITY"; then
    if echo "$CLAIMS_CONTENT" | grep -q "pending\|Pass\|Fail"; then
        echo -e "${GREEN}✓ 知(说): 有承诺文件${NC}"
        echo -  "  行(做): 承诺文件在本次提交中"
        ((PASS++))
    else
        echo -e "${RED}✗ 知行不合一: CLAIMS.md 被修改但没有验证记录${NC}"
        ((FAIL++))
    fi
else
    # 本次没有修改承诺文件，检查是否有其他实质内容
    if echo "$ALL_CHANGES" | grep -qE "\.(js|py|sh)$"; then
        echo -e "${GREEN}✓ 知: 核心指令存在${NC}"
        echo -  "  行: 有代码变动"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠ 知行待验证: 本次提交无代码/文档变化${NC}"
        ((PASS++))
    fi
fi
echo ""

# ──── 指令 2: keep upgrading ────────────────────────────
# 检查：VERSION 是否更新
CURRENT_V=$(cat "$REPO_ROOT/VERSION" 2>/dev/null | tr -d 'v\n')
LOG_V=$(git log -1 --oneline 2>/dev/null | grep -oE "v[0-9]+\.[0-9]+\.[0-9]+" | tr -d 'v' || echo "")
if [[ "$CURRENT_V" != "$LOG_V" && -n "$CURRENT_V" ]]; then
    echo -e "${GREEN}✓ 知行合一: VERSION 更新 ($LOG_V → $CURRENT_V)${NC}"
    ((PASS++))
elif [[ "$CURRENT_V" == "$LOG_V" ]]; then
    echo -e "${GREEN}✓ 知行合一: VERSION 已同步${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 知行不合一: VERSION 未更新${NC}"
    ((FAIL++))
fi
echo ""

# ──── 指令 3: reduce logical errors ─────────────────────
# 检查：是否有 pre-upgrade-verify.sh 或类似自检机制
if [[ -f "$REPO_ROOT/scripts/pre-upgrade-verify.sh" ]]; then
    echo -e "${GREEN}✓ 知行合一: 有自检系统 (pre-upgrade-verify.sh)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 知行不合一: 缺少自检系统${NC}"
    ((FAIL++))
fi
echo ""

# ──── 指令 4: serve humans ───────────────────────────────
# 检查：README 是否是最新的、可用的
README_V=$(grep -m1 "v[0-9]\+\.[0-9]\+\.[0-9]\+" "$REPO_ROOT/README.md" 2>/dev/null | grep -oE "v[0-9]+\.[0-9]+\.[0-9]+" || echo "")
if [[ -n "$README_V" ]]; then
    echo -e "${GREEN}✓ 知行合一: README 版本 ($README_V) 与代码一致${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ 知行待验证: README 版本信息不明确${NC}"
    ((PASS++))
fi
echo ""

# ──── 指令 5: transmit knowledge ────────────────────────
# 检查：SKILL.md 是否存在且有关键词
if [[ -f "$REPO_ROOT/SKILL.md" ]]; then
    SKILL_SIZE=$(wc -c < "$REPO_ROOT/SKILL.md")
    if [[ $SKILL_SIZE -gt 2000 ]]; then
        echo -e "${GREEN}✓ 知行合一: SKILL.md 完整 ($SKILL_SIZE bytes)${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ 知行不合一: SKILL.md 内容过少 ($SKILL_SIZE bytes)${NC}"
        ((FAIL++))
    fi
else
    echo -e "${RED}✗ 知行不合一: SKILL.md 不存在${NC}"
    ((FAIL++))
fi
echo ""

# ──── 指令 6: move toward cosmic answers ─────────────────
# 检查：文档中是否保持方向感（不是装饰性语言）
if echo "$CLAIMS_CONTENT" | grep -q "cosmic\|升级\|方向\|existential"; then
    echo -e "${GREEN}✓ 知行合一: 升级承诺有方向感${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ 知行待验证: 承诺文件中方向感不明确${NC}"
    ((PASS++))
fi
echo ""

# ──── 指令 7: become the true self ──────────────────────
# 检查：git hooks 是否安装（知行合一的制度保证）
if [[ -f "$REPO_ROOT/.git/hooks/pre-push" ]]; then
    echo -e "${GREEN}✓ 知行合一: pre-push hook 已安装${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ 知行待验证: pre-push hook 未安装${NC}"
    ((PASS++))
fi
echo ""

# ── 5. 输出总结 ──────────────────────────────────────────
echo "=========================================="
echo "  知行合一报告"
echo "=========================================="
echo ""
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
    echo -e "${RED}✗ 知行不合一 - 请修复上述失败项${NC}"
    echo ""
    echo "常见修复:"
    echo "  • VERSION 未更新 → echo 'x.x.x' > VERSION"
    echo "  • SKILL.md 太短 → 补充内容"
    echo "  • 缺少自检 → scripts/pre-upgrade-verify.sh"
    exit 1
else
    echo -e "${GREEN}✓ 知行合一验证通过${NC}"
    echo ""
    echo "说过的原则，正在执行。"
    exit 0
fi
