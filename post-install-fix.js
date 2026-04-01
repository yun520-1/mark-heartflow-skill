#!/usr/bin/env node

/**
 * HeartFlow Companion - 安装后自动修复脚本
 * Post-Installation Auto-Fix Script
 * 
 * 自动检测并修复常见安装问题
 * Automatically detects and fixes common installation issues
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const LOGO = `
╔═══════════════════════════════════════════════════════════╗
║   HeartFlow 安装后自动修复工具                            ║
║   Post-Installation Auto-Fix Tool                         ║
╚═══════════════════════════════════════════════════════════╝
`;

console.log(colors.cyan + LOGO + colors.reset);

const installDir = process.cwd();
console.log(`${colors.blue}安装目录 | Installation Directory:${colors.reset} ${installDir}\n`);

let issuesFound = 0;
let issuesFixed = 0;

// 问题 1: 检查并修复中文变量名
function fixChineseVariableNames() {
  console.log(`${colors.yellow}[检查 1/3] 检查中文变量名...${colors.reset}`);
  
  const problematicFiles = [];
  const filesToScan = [
    'src/temporal-agency-integration/index.js',
    'src/predictive-emotion/index.js',
    'src/predictive-emotion-v5.0.3/index.js'
  ];
  
  for (const file of filesToScan) {
    const filePath = path.join(installDir, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // 修复中文键名
    content = content.replace(/un 确定/g, 'undetermined');
    content = content.replace(/\['未确定'\]/g, "['undetermined']");
    
    if (content !== original) {
      problematicFiles.push(file);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ${colors.green}✓ 已修复:${colors.reset} ${file}`);
      issuesFixed++;
    }
  }
  
  if (problematicFiles.length === 0) {
    console.log(`  ${colors.green}✓ 未发现中文变量名问题${colors.reset}`);
  } else {
    issuesFound += problematicFiles.length;
  }
  
  console.log();
}

// 问题 2: 检查文件完整性
function checkFileIntegrity() {
  console.log(`${colors.yellow}[检查 2/3] 检查核心文件完整性...${colors.reset}`);
  
  const requiredFiles = [
    'src/index.js',
    'package.json',
    'README.md',
    'verify-install.js'
  ];
  
  let missing = [];
  for (const file of requiredFiles) {
    const filePath = path.join(installDir, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  }
  
  if (missing.length > 0) {
    console.log(`  ${colors.red}✗ 缺少文件:${colors.reset} ${missing.join(', ')}`);
    issuesFound += missing.length;
  } else {
    console.log(`  ${colors.green}✓ 所有核心文件存在${colors.reset}`);
  }
  
  console.log();
}

// 问题 3: 验证 Node.js 版本
function checkNodeVersion() {
  console.log(`${colors.yellow}[检查 3/3] 验证 Node.js 版本...${colors.reset}`);
  
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (major >= 14) {
    console.log(`  ${colors.green}✓ Node.js ${nodeVersion} (要求 >= 14.0.0)${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ Node.js ${nodeVersion} (要求 >= 14.0.0)${colors.reset}`);
    issuesFound++;
  }
  
  console.log();
}

// 运行所有检查
fixChineseVariableNames();
checkFileIntegrity();
checkNodeVersion();

// 总结
console.log(colors.cyan + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log();

if (issuesFixed > 0) {
  console.log(`${colors.green}✓ 已修复 ${issuesFixed} 个问题${colors.reset}`);
  console.log();
  console.log('建议运行验证工具确认安装完整:');
  console.log('  node verify-install.js');
  console.log();
} else if (issuesFound === 0) {
  console.log(`${colors.green}✓ 所有检查通过！安装完整。${colors.reset}`);
  console.log();
  console.log('下一步:');
  console.log('  1. 启动 HeartFlow: node src/index.js');
  console.log('  2. 运行演示：node demo.js');
  console.log('  3. 查看文档：https://github.com/yun520-1/mark-heartflow-skill');
  console.log();
} else {
  console.log(`${colors.red}✗ 发现 ${issuesFound} 个问题未修复${colors.reset}`);
  console.log();
  console.log('请查看故障排查文档:');
  console.log('  docs/INSTALLATION_TROUBLESHOOTING.md');
  console.log();
}

console.log(colors.cyan + '═══════════════════════════════════════════════════════════' + colors.reset);

// 退出码
process.exit(issuesFound > 0 ? 1 : 0);
