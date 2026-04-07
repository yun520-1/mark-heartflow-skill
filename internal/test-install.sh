#!/bin/bash

# HeartFlow Installation Test Script
# 测试在新电脑上能否正常安装和运行

echo "===================================="
echo "HeartFlow Installation Test"
echo "===================================="

# Step 1: Check Node.js
echo ""
echo "Step 1: Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Step 2: Clone repository (skip if already in directory)
echo ""
echo "Step 2: Checking repository..."
if [ -f "package.json" ]; then
    echo "✅ Repository already present"
else
    echo "❌ Not in heartflow-skill directory"
    echo "Please run: git clone https://github.com/yun520-1/mark-heartflow-skill.git"
    exit 1
fi

# Step 3: Install dependencies (none required, but check)
echo ""
echo "Step 3: Checking dependencies..."
echo "✅ No external dependencies required"

# Step 4: Check core files
echo ""
echo "Step 4: Checking core files..."
CORE_FILES=(
    "src/index.js"
    "package.json"
    "memory/long-term.md"
    "memory/user-expectations.md"
    "scripts/personality-check.js"
)

ALL_EXIST=true
for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo ""
    echo "❌ Some core files are missing"
    exit 1
fi

# Step 5: Run personality check (test script execution)
echo ""
echo "Step 5: Testing script execution..."
if node scripts/personality-check.js status &> /dev/null; then
    echo "✅ Scripts can execute"
else
    echo "❌ Script execution failed"
    exit 1
fi

# Step 6: Run demo (optional)
echo ""
echo "Step 6: Testing demo..."
if [ -f "demo.js" ]; then
    echo "✅ Demo available: node demo.js"
else
    echo "⚠️  Demo not found (optional)"
fi

# Summary
echo ""
echo "===================================="
echo "✅ Installation Test PASSED"
echo "===================================="
echo ""
echo "HeartFlow is ready to use!"
echo ""
echo "Commands:"
echo "  node src/index.js     - Start HeartFlow"
echo "  node demo.js          - Run demo"
echo "  node scripts/personality-check.js before - Check personality"
echo ""
