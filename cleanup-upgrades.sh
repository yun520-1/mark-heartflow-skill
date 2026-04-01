#!/bin/bash

# ============================================================================
# HeartFlow Upgrade Files Cleanup Script
# 升级文件清理脚本
# ============================================================================
# 保留策略 | Retention Policy:
# 1. 最近 3 次小版本升级记录 (Latest 3 minor version upgrades)
# 2. 所有重大版本升级记录 (All major version upgrades: v5.0.x, v5.1.0, v5.2.0, etc.)
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   HeartFlow 升级文件清理工具                              ║"
echo "║   Upgrade Files Cleanup Tool                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 获取当前版本
CURRENT_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
echo "当前版本 | Current Version: ${CURRENT_VERSION}"
echo ""

# 提取主版本和次版本
MAJOR_MINOR=$(echo "$CURRENT_VERSION" | cut -d'.' -f1,2)
echo "主版本 | Major Version: ${MAJOR_MINOR}.x"
echo ""

# 文件类型
FILE_TYPES=(
    "self-evolution-state"
    "theory-update-summary"
    "UPGRADE_COMPLETE"
    "upgrade-report"
)

# 统计
TOTAL_BEFORE=0
TOTAL_AFTER=0
DELETED_COUNT=0

# 计算清理前文件数
for type in "${FILE_TYPES[@]}"; do
    count=$(ls -1 ${type}-*.md 2>/dev/null | wc -l)
    TOTAL_BEFORE=$((TOTAL_BEFORE + count))
done

echo "清理前文件数 | Files before cleanup: ${TOTAL_BEFORE}"
echo ""

# 处理每种文件类型
for type in "${FILE_TYPES[@]}"; do
    echo -e "${YELLOW}处理文件类型 | Processing: ${type}-*.md${NC}"
    
    # 获取所有版本号文件（排序，最新在前）
    versions=($(ls -1 ${type}-*.md 2>/dev/null | \
        sed 's/.*-v\([0-9.]*\)\.md/\1/' | \
        sort -t. -k1,1nr -k2,2nr -k3,3nr))
    
    # 保留的文件
    keep_files=()
    
    # 1. 保留最近 3 次小版本
    for i in "${!versions[@]}"; do
        if [ $i -lt 3 ]; then
            keep_files+=("${versions[$i]}")
        fi
    done
    
    # 2. 保留所有重大版本 (x.0.x 或 x.x.0)
    for version in "${versions[@]}"; do
        minor=$(echo "$version" | cut -d'.' -f2)
        patch=$(echo "$version" | cut -d'.' -f3)
        
        # 保留 major.0.x (主版本发布)
        if [ "$minor" = "0" ]; then
            if [[ ! " ${keep_files[@]} " =~ " ${version} " ]]; then
                keep_files+=("$version")
            fi
        fi
        
        # 保留 major.minor.0 (次版本发布)
        if [ "$patch" = "0" ]; then
            if [[ ! " ${keep_files[@]} " =~ " ${version} " ]]; then
                keep_files+=("$version")
            fi
        fi
    done
    
    echo "  保留版本 | Keep versions: ${keep_files[*]}"
    
    # 删除不需要的文件
    for file in ${type}-*.md; do
        [ -f "$file" ] || continue
        
        version=$(echo "$file" | sed 's/.*-v\([0-9.]*\)\.md/\1/')
        
        if [[ ! " ${keep_files[@]} " =~ " ${version} " ]]; then
            echo -e "  ${RED}删除 | Delete:${NC} $file"
            rm -f "$file"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            echo -e "  ${GREEN}保留 | Keep:${NC} $file"
        fi
    done
    
    echo ""
done

# 计算清理后文件数
for type in "${FILE_TYPES[@]}"; do
    count=$(ls -1 ${type}-*.md 2>/dev/null | wc -l)
    TOTAL_AFTER=$((TOTAL_AFTER + count))
done

# 创建清理报告
cat > UPGRADE_FILES_CLEANUP_REPORT.md << EOF
# HeartFlow 升级文件清理报告
# HeartFlow Upgrade Files Cleanup Report

**执行时间 | Execution Time**: $(date '+%Y-%m-%d %H:%M:%S') (Asia/Shanghai)
**当前版本 | Current Version**: ${CURRENT_VERSION}

---

## 清理统计 | Cleanup Statistics

| 项目 | 数量 |
|------|------|
| 清理前文件数 | ${TOTAL_BEFORE} |
| 清理后文件数 | ${TOTAL_AFTER} |
| 删除文件数 | ${DELETED_COUNT} |
| 保留率 | $(echo "scale=1; ${TOTAL_AFTER}*100/${TOTAL_BEFORE}" | bc)% |

---

## 保留策略 | Retention Policy

1. ✅ 最近 3 次小版本升级记录 (Latest 3 minor version upgrades)
2. ✅ 所有重大版本升级记录 (All major version upgrades: v5.0.x, v5.1.0, v5.2.0, etc.)

---

## 保留的文件 | Retained Files

EOF

# 列出保留的文件
echo "### 当前保留的升级文件 | Currently Retained Upgrade Files" >> UPGRADE_FILES_CLEANUP_REPORT.md
echo "" >> UPGRADE_FILES_CLEANUP_REPORT.md
echo '```' >> UPGRADE_FILES_CLEANUP_REPORT.md
for type in "${FILE_TYPES[@]}"; do
    ls -1 ${type}-*.md 2>/dev/null | while read file; do
        echo "$file" >> UPGRADE_FILES_CLEANUP_REPORT.md
    done
done
echo '```' >> UPGRADE_FILES_CLEANUP_REPORT.md

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✓ 清理完成 | Cleanup Complete${NC}"
echo ""
echo "统计 | Statistics:"
echo "  清理前 | Before: ${TOTAL_BEFORE} 文件"
echo "  清理后 | After:  ${TOTAL_AFTER} 文件"
echo "  删除 | Deleted: ${DELETED_COUNT} 文件"
echo "  保留率 | Retention: $(echo "scale=1; ${TOTAL_AFTER}*100/${TOTAL_BEFORE}" | bc)%"
echo ""
echo "清理报告已保存 | Cleanup report saved to:"
echo "  UPGRADE_FILES_CLEANUP_REPORT.md"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"
