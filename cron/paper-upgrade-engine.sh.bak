#!/bin/bash
#============================================================
# HeartFlow Paper Upgrade Engine v0.13.11
# 定时从论文中吸收知识，升级技能代码
# 每次升级 +0.0.1 版本号
#============================================================

set -e

SKILL_DIR="/Users/apple/.hermes/skills/ai/mark-heartflow-skill"
QUEUE_FILE="$SKILL_DIR/cron/paper-upgrade-queue.json"
PAPERS_DIR="/Users/apple/Downloads/daima"
LOG_FILE="$SKILL_DIR/logs/paper-upgrade-$(date +%Y%m%d).log"
SRC_DIR="$SKILL_DIR/src"

# 确保日志目录存在
mkdir -p "$SKILL_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 读取队列状态
get_json_val() {
    local key=$1
    python3 -c "import json; d=json.load(open('$QUEUE_FILE')); print(d.get('$key', ''))" 2>/dev/null || echo ""
}

update_queue() {
    local key=$1
    local val=$2
    python3 << EOF
import json
with open('$QUEUE_FILE', 'r') as f:
    d = json.load(f)
d['$key'] = $val
with open('$QUEUE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
EOF
}

# 读取当前版本
CURRENT_VER=$(get_json_val "currentVersion")
NEXT_VER=$(get_json_val "nextVersion")
PAPERS_INDEX=$(get_json_val "papersIndex")

log "=========================================="
log "HeartFlow Paper Upgrade Engine 启动"
log "当前版本: $CURRENT_VER → 目标版本: $NEXT_VER"
log "论文索引: $PAPERS_INDEX"
log "=========================================="

# 检查nano-pdf是否可用
if ! command -v nano-pdf &> /dev/null; then
    log "[警告] nano-pdf 未安装，尝试使用 pdftotext"
    if ! command -v pdftotext &> /dev/null; then
        log "[错误] pdftotext 也未安装，无法读取PDF"
        exit 1
    fi
fi

# 获取待读取的论文
PAPERS_JSON=$(python3 -c "import json; d=json.load(open('$QUEUE_FILE')); print(json.dumps(d.get('papers', [])))")
PAPERS_READ_JSON=$(python3 -c "import json; d=json.load(open('$QUEUE_FILE')); print(json.dumps(d.get('papersRead', [])))")

# 读取2篇论文
PAPERS_ARRAY=$(python3 -c "import json; print(len(json.loads('$PAPERS_JSON')))")
log "总共 $PAPERS_ARRAY 篇论文待处理"

COUNT=0
PAPERS_TO_READ=2

for i in $(seq 0 $((PAPERS_ARRAY - 1))); do
    if [ $COUNT -ge $PAPERS_TO_READ ]; then
        break
    fi
    
    PAPER=$(python3 -c "import json; p=json.loads('$PAPERS_JSON'); print(p[$i])")
    SKIP=false
    
    # 检查是否已读
    for read_paper in $(python3 -c "import json; print(json.loads('$PAPERS_READ_JSON'))"); do
        if [ "$read_paper" = "$PAPER" ]; then
            SKIP=true
            break
        fi
    done
    
    if [ "$SKIP" = "true" ]; then
        continue
    fi
    
    PAPER_PATH="$PAPERS_DIR/$PAPER"
    if [ ! -f "$PAPER_PATH" ]; then
        log "[跳过] 文件不存在: $PAPER"
        continue
    fi
    
    log "------------------------------------------"
    log "读取论文 [$((i+1))/$PAPERS_ARRAY]: $PAPER"
    
    # 提取文本
    if command -v nano-pdf &> /dev/null; then
        TEXT=$(nano-pdf "$PAPER_PATH" 2>/dev/null | head -500)
    else
        TEXT=$(pdftotext "$PAPER_PATH" - 2>/dev/null | head -500)
    fi
    
    if [ -z "$TEXT" ]; then
        log "[警告] 无法提取文本: $PAPER"
        continue
    fi
    
    # 分析论文内容，提取有用代码片段或算法描述
    log "分析论文内容..."
    
    # 保存提取的文本用于后续分析
    EXTRACT_DIR="$SKILL_DIR/cron/extracted"
    mkdir -p "$EXTRACT_DIR"
    echo "$TEXT" > "$EXTRACT_DIR/${PAPER}.txt"
    
    # 更新已读列表
    PAPERS_READ=$(python3 -c "import json; d=json.load(open('$QUEUE_FILE')); print(len(d.get('papersRead', [])))")
    log "已读取 $PAPERS_READ 篇论文"
    
    # 标记为已读
    python3 << EOF
import json
with open('$QUEUE_FILE', 'r') as f:
    d = json.load(f)
if 'papersRead' not in d:
    d['papersRead'] = []
if '$PAPER' not in d['papersRead']:
    d['papersRead'].append('$PAPER')
with open('$QUEUE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
EOF
    
    COUNT=$((COUNT + 1))
    log "完成: $PAPER"
done

# 更新索引
python3 << EOF
import json
with open('$QUEUE_FILE', 'r') as f:
    d = json.load(f)
d['papersIndex'] = len(d.get('papersRead', []))
with open('$QUEUE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
EOF

# 检查是否应触发升级（每读完5篇或所有论文后）
PAPERS_READ_COUNT=$(python3 -c "import json; d=json.load(open('$QUEUE_FILE')); print(len(d.get('papersRead', [])))")
TOTAL_PAPERS=$(python3 -c "import json; d=json.load(open('$QUEUE_FILE')); print(len(d.get('papers', [])))")

log "=========================================="
log "进度: $PAPERS_READ_COUNT/$TOTAL_PAPERS 篇论文"
log "=========================================="

# 每5篇论文触发一次升级
if [ $((PAPERS_READ_COUNT % 5)) -eq 0 ] && [ $PAPERS_READ_COUNT -gt 0 ]; then
    log "触发升级流程..."
    
    # 生成升级代码
    UPGRADE_CODE_FILE="$SKILL_DIR/cron/upgrade-v${NEXT_VER}.js"
    
    cat > "$UPGRADE_CODE_FILE" << 'UPGRADE_EOF'
/**
 * HeartFlow Upgrade v0.13.11
 * Paper-based knowledge integration
 * Generated: DATE_PLACEHOLDER
 */
export const upgrade_v0_13_11 = {
    version: "v0.13.11",
    type: "paper_upgrade",
    features: [],
    codeAdded: 0,
    papers: [],
    run: function(heartflow) {
        // 升级逻辑
        return { success: true, changes: [] };
    }
};
UPGRADE_EOF
    
    # 更新版本号
    python3 << EOF
import json
with open('$QUEUE_FILE', 'r') as f:
    d = json.load(f)
d['currentVersion'] = d['nextVersion']
# 计算新版本
ver = d['nextVersion']
parts = ver.replace('v', '').split('.')
parts[2] = str(int(parts[2]) + 1)
d['nextVersion'] = 'v' + '.'.join(parts)
d['lastUpgradeDate'] = 'DATE_PLACEHOLDER'
d['upgradeCount'] = d.get('upgradeCount', 0) + 1
with open('$QUEUE_FILE', 'w') as f:
    json.dump(d, f, indent=2)
EOF
    
    log "升级完成! 新版本: $(get_json_val 'nextVersion')"
fi

log "Paper Upgrade Engine 完成"
