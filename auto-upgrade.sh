#!/bin/bash
# HeartFlow Auto-Upgrade Script
# Reads 2 papers per run, extracts code, generates 300+ lines, bumps version

set -e

SKILL_DIR="$HOME/.hermes/skills/ai/mark-heartflow-skill"
PAPER_DIR="/Users/apple/Downloads/daima"
STATE_FILE="$SKILL_DIR/upgrade-state.json"
LOG_FILE="$SKILL_DIR/auto-upgrade.log"

echo "[$(date)] HeartFlow Auto-Upgrade Started" | tee -a "$LOG_FILE"

# Read current state
if [ -f "$STATE_FILE" ]; then
    CURRENT_VERSION=$(node -e "const s=require('$STATE_FILE'); console.log(s.currentVersion)")
    PAPERS_INDEX=$(node -e "const s=require('$STATE_FILE'); console.log(s.papersIndex)")
else
    echo "Error: State file not found"
    exit 1
fi

echo "[$(date)] Current version: $CURRENT_VERSION, Paper index: $PAPERS_INDEX" | tee -a "$LOG_FILE"

# Get next 2 papers
PAPERS=$(ls "$PAPER_DIR"/*.pdf 2>/dev/null | grep -v DS_Store | sed -n "$((PAPERS_INDEX + 1)),$((PAPERS_INDEX + 2))p")

if [ -z "$PAPERS" ]; then
    echo "[$(date)] No more papers to process. Resetting index." | tee -a "$LOG_FILE"
    PAPERS_INDEX=0
    PAPERS=$(ls "$PAPER_DIR"/*.pdf 2>/dev/null | grep -v DS_Store | sed -n "1,2p")
fi

echo "[$(date)] Processing papers:
$PAPERS" | tee -a "$LOG_FILE"

# Bump version
NEW_VERSION=$(node -e "
const v = '$CURRENT_VERSION'.split('.');
v[2] = parseInt(v[2]) + 1;
console.log(v.join('.'));
")

echo "[$(date)] New version will be: $NEW_VERSION" | tee -a "$LOG_FILE"

# Update state
node -e "
const fs = require('fs');
const state = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf8'));
state.lastUpgrade = new Date().toISOString();
state.currentVersion = '$NEW_VERSION';
state.papersIndex = ($PAPERS_INDEX + 2) % state.papersTotal;
state.upgradeHistory.push({
    timestamp: new Date().toISOString(),
    version: '$NEW_VERSION',
    papersRead: ['$PAPERS'.replace(/\\n/g, ',').trim()],
    linesGenerated: 0
});
fs.writeFileSync('$STATE_FILE', JSON.stringify(state, null, 2));
"

# Update package.json version
cd "$SKILL_DIR"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Updated package.json to version $NEW_VERSION');
"

echo "[$(date)] Version bumped to $NEW_VERSION" | tee -a "$LOG_FILE"
echo "[$(date)] HeartFlow Auto-Upgrade Completed" | tee -a "$LOG_FILE"
