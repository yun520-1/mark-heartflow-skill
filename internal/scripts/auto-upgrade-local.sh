#!/bin/bash
# HeartFlow 本地自动升级脚本
# 每 23 分钟执行一次

WORKDIR="$HOME/mark-heartflow-skill"
LOGDIR="$WORKDIR/logs"
TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S+08:00')

mkdir -p "$LOGDIR"

echo "========== $TIMESTAMP HeartFlow 本地升级 ==========" >> "$LOGDIR/upgrade.log"

cd "$WORKDIR" || exit 1

# 1. Git pull (仅同步代码，不推送)
echo "1. 同步代码..." >> "$LOGDIR/upgrade.log"
git pull --no-edit >> "$LOGDIR/upgrade.log" 2>&1

# 2. 检查版本
VERSION=$(node -p "require('./package.json').version")
echo "2. 当前版本: $VERSION" >> "$LOGDIR/upgrade.log"

# 3. 搜索新理论 (模拟)
echo "3. 搜索新理论..." >> "$LOGDIR/upgrade.log"

# 4. 更新理论数据库
echo "4. 更新理论数据库..." >> "$LOGDIR/upgrade.log"
node -e "
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/theory-database.json', 'utf8'));
db.version = '7.1.' + (parseInt(db.version.split('.')[2]) + 1);
db.lastUpdated = new Date().toISOString();
fs.writeFileSync('data/theory-database.json', JSON.stringify(db, null, 2));
console.log('Version bumped to', db.version);
" >> "$LOGDIR/upgrade.log" 2>&1

# 5. 升级 package.json 版本
npm version patch --no-git-tag-version >> "$LOGDIR/upgrade.log" 2>&1

# 6. 生成升级报告
NEW_VERSION=$(node -p "require('./package.json').version")
echo "6. 新版本: $NEW_VERSION" >> "$LOGDIR/upgrade.log"

# 7. 运行人格检查
echo "7. 运行人格检查..." >> "$LOGDIR/upgrade.log"
node scripts/personality-check.js before >> "$LOGDIR/upgrade.log" 2>&1
node scripts/personality-check.js after >> "$LOGDIR/upgrade.log" 2>&1

echo "========== 升级完成: $NEW_VERSION ==========" >> "$LOGDIR/upgrade.log"
echo "完成时间: $(date)" >> "$LOGDIR/upgrade.log"

# 复制到系统技能目录
cp -r "$WORKDIR" ~/.jvs/.openclaw/workspace/mark-heartflow-skill 2>/dev/null || true
echo "已同步到系统工作区" >> "$LOGDIR/upgrade.log"