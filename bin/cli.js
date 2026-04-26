#!/usr/bin/env node
/**
 * HeartFlow v10.16.0 CLI - Hermes 系统集成启动入口
 * 
 * 安装位置：~/.hermes/skills/ai/heartflow-v10.16.0
 * 源代码位置：~/mark-heartflow-skill (开发版本)
 * 
 * 启动流程：
 * 1. 优先使用 Hermes 系统安装版本（生产环境）
 * 2. 回退到开发版本（开发环境）
 */

const path = require('path');
const fs = require('fs');

// 尝试加载 Hermes 系统安装版本
let heartflowRoot = path.join(process.env.HOME, '.hermes/skills/ai/heartflow-v10.16.0');
let binPath = path.join(heartflowRoot, 'bin/cli.js');

// 如果 Hermes 版本不存在，回退到开发版本
if (!fs.existsSync(binPath)) {
  heartflowRoot = path.join(process.env.HOME, 'mark-heartflow-skill');
  binPath = path.join(heartflowRoot, 'bin/cli.js');
}

// 最后的检查
if (!fs.existsSync(binPath)) {
  console.error('❌ HeartFlow v10.16.0 未找到');
  console.error('   期望位置 1: ~/.hermes/skills/ai/heartflow-v10.16.0/bin/cli.js');
  console.error('   期望位置 2: ~/mark-heartflow-skill/bin/cli.js');
  process.exit(1);
}

// 加载 CLI
require(binPath);
