#!/bin/bash
# HeartFlow Auto-Push Script | 自动推送脚本
# Runs every 2 hours | 每 2 小时运行

set -e

WORKSPACE="/Users/apple/.jvs/.openclaw/workspace/mark-heartflow-skill"
PUSH_LOG="$WORKSPACE/docs/GITHUB_PUSH_LOG.md"

echo "========================================"
echo "HeartFlow Auto-Push | 自动推送"
echo "Timestamp | 时间戳: $(date -Iseconds)"
echo "========================================"

cd "$WORKSPACE"

# Check git status
echo "Checking git status... | 检查 git 状态..."
STATUS=$(git status --porcelain)

if [ -z "$STATUS" ]; then
    echo "✅ Working tree clean | 工作区干净"
else
    echo "📝 Uncommitted changes found | 发现未提交变更"
    git add -A
    git commit -m "chore: Auto-commit before push ($(date '+%Y-%m-%d %H:%M'))"
    echo "✅ Changes committed | 变更已提交"
fi

# Check if we're ahead of origin
AHEAD=$(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "0")

if [ "$AHEAD" -eq 0 ]; then
    echo "✅ Already synced with origin | 已与远程同步"
else
    echo "📤 $AHEAD commit(s) to push | 待推送 $AHEAD 个提交"
    
    # Try to push with retry
    MAX_RETRIES=5
    RETRY_INTERVAL=30  # seconds
    
    for i in $(seq 1 $MAX_RETRIES); do
        echo "Push attempt $i/$MAX_RETRIES | 推送尝试 $i/$MAX_RETRIES"
        
        if git push origin main 2>&1; then
            echo "✅ Push successful | 推送成功"
            
            # Log successful push
            echo "" >> "$PUSH_LOG"
            echo "## $(date '+%Y-%m-%d %H:%M:%S') - Success | 成功" >> "$PUSH_LOG"
            echo "- Commits pushed: $AHEAD" >> "$PUSH_LOG"
            echo "- Status: ✅ Success" >> "$PUSH_LOG"
            
            exit 0
        else
            echo "❌ Push failed | 推送失败"
            
            if [ $i -lt $MAX_RETRIES ]; then
                echo "Retrying in $RETRY_INTERVAL seconds... | $RETRY_INTERVAL 秒后重试..."
                sleep $RETRY_INTERVAL
            fi
        fi
    done
    
    echo "❌ All push attempts failed | 所有推送尝试失败"
    
    # Log failed push
    echo "" >> "$PUSH_LOG"
    echo "## $(date '+%Y-%m-%d %H:%M:%S') - Failed | 失败" >> "$PUSH_LOG"
    echo "- Commits to push: $AHEAD" >> "$PUSH_LOG"
    echo "- Status: ❌ Failed after $MAX_RETRIES attempts" >> "$PUSH_LOG"
    echo "- Error: Network issue | 网络问题" >> "$PUSH_LOG"
    
    exit 1
fi

echo "========================================"
echo "Auto-Push Complete | 自动推送完成"
echo "========================================"
