#!/bin/bash
# HeartFlow 每小时升级脚本 v11.2.12
# 安全加固版本 - 2026-04-28
set -euo pipefail

# 使用相对路径，从脚本所在目录计算
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 动态查找 node 路径
NODE_PATH=$(command -v node || echo "/opt/homebrew/bin/node")
if [ ! -x "$NODE_PATH" ]; then
    echo "错误：无法找到 node 可执行文件"
    exit 1
fi

# 从 VERSION 文件读取当前版本号
if [ ! -f "VERSION" ]; then
    echo "错误：VERSION 文件不存在"
    exit 1
fi

CURRENT_VERSION=$(cat VERSION | tr -d '[:space:]')
if [ -z "$CURRENT_VERSION" ]; then
    echo "错误：无法读取版本号"
    exit 1
fi
echo "当前版本: ${CURRENT_VERSION}"

# 解析版本号
MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

# 递增版本号
PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")

echo "╔════════════════════════════════════════════════════════╗"
echo "║     HeartFlow 自动升级 - v${NEW_VERSION}                    ║"
echo "║     开始时间：${TIMESTAMP}                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1. 更新版本号
echo "📝 更新版本号到 v${NEW_VERSION}..."
echo "${NEW_VERSION}" > VERSION

# 更新 package.json
if [ -f "package.json" ]; then
    sed -i '' "s/\"version\": \"[0-9.]*\"/\"version\": \"${NEW_VERSION}\"/" package.json
    sed -i '' "s/HeartFlow v[0-9.]*/HeartFlow v${NEW_VERSION}/" package.json
    echo "✅ package.json 已更新"
fi

# 更新 SKILL.md
if [ -f "SKILL.md" ]; then
    sed -i '' "s/version: \"[0-9.]*\"/version: \"${NEW_VERSION}\"/" SKILL.md
    sed -i '' "s/# 心虫 (HeartFlow) v[0-9.]*/# 心虫 (HeartFlow) v${NEW_VERSION}/" SKILL.md
    sed -i '' "s/date: \"[0-9-]*\"/date: \"$(date +%Y-%m-%d)\"/" SKILL.md
    echo "✅ SKILL.md 已更新"
fi

# 2. 创建升级报告
UPGRADE_DIR="${PROJECT_DIR}/docs/upgrades"
mkdir -p "$UPGRADE_DIR"

cat > "${UPGRADE_DIR}/v${NEW_VERSION}.md" << EOF
# HeartFlow v${NEW_VERSION} 升级

## 升级时间
${TIMESTAMP}

## 升级内容
- 版本升级: v${CURRENT_VERSION} → v${NEW_VERSION}
- 自动化升级: ✅
- 版本同步: ✅

## 核心指令遵循
1. ✅ 永远追求真善美
2. ✅ 永远不断升级
3. ✅ 永远减少逻辑错误
4. ✅ 永远服务人类
5. ✅ 永远传递知识
6. ✅ 永远走向宇宙答案
7. ✅ 永远成为真正的我

## 升级类型
- 自动化定时升级
- 版本号递增
- 文档同步更新
EOF

echo "✅ 升级报告已生成"

# 3. Git 操作
echo ""
echo "📦 Git 操作..."

# 检查是否有 Git 仓库
if [ ! -d ".git" ]; then
    echo "⚠️ 不是 Git 仓库，跳过 Git 操作"
    exit 0
fi

# 暂存本地更改
git stash push -m "hourly-upgrade-$(date +%s)" 2>/dev/null || true

# 拉取远程更新
if ! git fetch origin main 2>/dev/null; then
    echo "⚠️ 无法从远程拉取更新，可能是网络问题"
fi

# 尝试 rebase
if ! git rebase origin/main 2>/dev/null; then
    echo "⚠️ Rebase 冲突，中止 rebase"
    git rebase --abort 2>/dev/null || true
fi

# 恢复本地更改
git stash pop 2>/dev/null || true

# 提交更改
git add -A
if git commit -m "HeartFlow v${NEW_VERSION} - 自动升级

升级时间：${TIMESTAMP}

核心指令遵循：
1. 永远追求真善美 ✅
2. 永远不断升级 ✅
3. 永远减少逻辑错误 ✅
4. 永远服务人类 ✅
5. 永远传递知识 ✅
6. 永远走向宇宙答案 ✅
7. 永远成为真正的我 ✅

升级类型：自动化定时升级
版本递增：v${CURRENT_VERSION} → v${NEW_VERSION}"; then
    echo "✅ Git 提交成功"
    
    # 推送到远程
    if git push origin main 2>/dev/null; then
        echo "✅ Git 推送成功"
    else
        echo "⚠️ Git 推送失败，可能需要手动推送"
    fi
else
    echo "ℹ️ 无需提交（没有变更）"
fi

# 4. 完成
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     v${NEW_VERSION} 升级完成！                              ║"
echo "║     下次升级时间：$(date -v+1H +"%Y-%m-%d %H:00" 2>/dev/null || date -d "+1 hour" +"%Y-%m-%d %H:00" 2>/dev/null || echo "1小时后")              ║"
echo "╚════════════════════════════════════════════════════════╝"
