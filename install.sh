#!/bin/bash
# HeartFlow v0.16.0 Install Script
# No dependencies required — pure Node.js

set -e

HF_VERSION="v0.16.0"
echo "Installing HeartFlow $HF_VERSION..."

# Verify Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Option 1: npm install
echo ""
echo "Option 1: npm install (recommended)"
echo "  npm install @yun520-1/heartflow"
echo ""

# Option 2: git clone
echo "Option 2: git clone"
echo "  git clone https://github.com/yun520-1/heartflow.git"
echo "  cd heartflow && node src/core/heartflow.js"
echo ""

# Verify installation
if [ -d "node_modules/@yun520-1/heartflow" ]; then
    echo "✅ HeartFlow installed successfully"
    node -e "const {createHeartFlow}=require('@yun520-1/heartflow/src/core/heartflow.js');const hf=createHeartFlow();hf.start();hf.healthCheck().then(h=>{console.log('✅ HeartFlow',h.version,'ready');hf.stop();}).catch(e=>{console.error('❌',e.message);process.exit(1)})"
else
    echo "To verify: node src/core/heartflow.js"
fi
