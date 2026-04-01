#!/usr/bin/env node

/**
 * HeartFlow Companion - 安装验证工具
 * Installation Verification Tool
 * 
 * 检查安装是否完整，OpenClaw 集成是否正确
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色定义
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
║                                                           ║
║   🌊  HeartFlow Companion  安装验证工具                  ║
║       Installation Verification Tool                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

// 检查项
const checks = [
  {
    name: 'Node.js 环境',
    check: () => {
      try {
        const version = execSync('node -v', { encoding: 'utf8' }).trim();
        const major = parseInt(version.slice(1).split('.')[0]);
        return {
          pass: major >= 14,
          message: `Node.js ${version} ${major >= 14 ? '✓' : '(需要 >= 14.0.0)'}`
        };
      } catch (e) {
        return { pass: false, message: 'Node.js 未安装' };
      }
    }
  },
  {
    name: 'npm 环境',
    check: () => {
      try {
        const version = execSync('npm -v', { encoding: 'utf8' }).trim();
        return { pass: true, message: `npm ${version}` };
      } catch (e) {
        return { pass: false, message: 'npm 未安装' };
      }
    }
  },
  {
    name: 'Git 环境',
    check: () => {
      try {
        const version = execSync('git --version', { encoding: 'utf8' }).trim();
        return { pass: true, message: version };
      } catch (e) {
        return { pass: false, message: 'Git 未安装' };
      }
    }
  },
  {
    name: '核心文件结构',
    check: () => {
      const requiredFiles = [
        'src/index.js',
        'package.json',
        'README.md',
        'clawhub.json',
        'openclaw-integration.json'
      ];
      
      const missing = [];
      requiredFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
          missing.push(file);
        }
      });
      
      if (missing.length > 0) {
        return { pass: false, message: `缺少文件：${missing.join(', ')}` };
      }
      return { pass: true, message: '所有核心文件存在' };
    }
  },
  {
    name: '依赖包安装',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      const deps = Object.keys(packageJson.dependencies || {});
      
      if (deps.length === 0) {
        return { pass: true, message: '无外部依赖（纯 Node.js 实现）' };
      }
      
      const nodeModules = path.join(__dirname, 'node_modules');
      if (!fs.existsSync(nodeModules)) {
        return { pass: false, message: 'node_modules 不存在，请运行 npm install' };
      }
      
      const missing = [];
      deps.forEach(dep => {
        if (!fs.existsSync(path.join(nodeModules, dep))) {
          missing.push(dep);
        }
      });
      
      if (missing.length > 0) {
        return { pass: false, message: `缺少依赖：${missing.join(', ')}` };
      }
      return { pass: true, message: `所有依赖已安装 (${deps.length} 个)` };
    }
  },
  {
    name: 'OpenClaw 集成',
    check: () => {
      const openclawDir = path.join(process.env.HOME, '.jvs', '.openclaw', 'workspace');
      
      if (!fs.existsSync(openclawDir)) {
        return { pass: false, message: 'OpenClaw 工作区不存在' };
      }
      
      const linkPath = path.join(openclawDir, 'heartflow-companion');
      
      if (fs.existsSync(linkPath)) {
        const stats = fs.lstatSync(linkPath);
        if (stats.isSymbolicLink()) {
          const target = fs.readlinkSync(linkPath);
          return { pass: true, message: `符号链接已配置：${linkPath} → ${target}` };
        } else {
          return { pass: true, message: `目录已存在：${linkPath}` };
        }
      }
      
      return { 
        pass: false, 
        message: 'OpenClaw 集成未配置',
        suggestion: `运行：ln -s ${__dirname} ${linkPath}`
      };
    }
  },
  {
    name: '模块导入测试',
    check: () => {
      try {
        // 只测试文件存在和可访问性，不实际加载（避免副作用）
        const fs = require('fs');
        const indexPath = require.resolve('./src/index.js');
        const stats = fs.statSync(indexPath);
        if (stats.size > 0) {
          return { pass: true, message: '主模块文件可访问' };
        }
        return { pass: false, message: '主模块文件为空' };
      } catch (e) {
        return { pass: false, message: `模块访问失败：${e.message}` };
      }
    }
  }
];

// 打印函数
function printLogo() {
  console.log(colors.cyan + LOGO + colors.reset);
}

function printCheck(name, result) {
  const icon = result.pass ? '✓' : '✗';
  const color = result.pass ? colors.green : colors.red;
  
  console.log(`${color}${icon} ${name}${colors.reset}`);
  console.log(`  ${result.message}`);
  
  if (result.suggestion) {
    console.log(`  ${colors.yellow}建议：${result.suggestion}${colors.reset}`);
  }
  console.log();
}

function printSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log();
  
  if (failed === 0) {
    console.log(`${colors.green}✓ 所有检查通过！HeartFlow 已正确安装${colors.reset}`);
    console.log();
    console.log('下一步:');
    console.log('  1. 启动 HeartFlow:  node src/index.js');
    console.log('  2. 运行演示：node demo.js');
    console.log('  3. 查看文档：https://github.com/yun520-1/mark-heartflow-skill');
    console.log();
  } else {
    console.log(`${colors.red}✗ ${failed} 项检查失败${colors.reset}`);
    console.log();
    console.log('请根据上述建议修复问题后重新运行验证');
    console.log();
  }
  
  console.log('═══════════════════════════════════════════════════════════');
}

// 主函数
function main() {
  printLogo();
  
  console.log(`安装目录：${__dirname}`);
  console.log(`验证时间：${new Date().toLocaleString('zh-CN')}`);
  console.log();
  console.log('开始检查...\n');
  
  const results = [];
  
  checks.forEach(check => {
    const result = check.check();
    results.push(result);
    printCheck(check.name, result);
  });
  
  printSummary(results);
  
  // 退出码
  const failed = results.filter(r => !r.pass).length;
  process.exit(failed > 0 ? 1 : 0);
}

// 运行
main();
