#!/usr/bin/env node
/**
 * HeartFlow CLI — v0.13.161
 * Commands: setup | start | diagnose | upgrade | check
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'VERSION');
const PKG_FILE = path.join(ROOT, 'package.json');

function log(msg) { console.log(`[CLI] ${msg}`); }
function err(msg) { console.error(`[CLI] ERROR: ${msg}`); process.exit(1); }

function cmdSetup() {
  log('开始安装 HeartFlow v0.13.10...');

  // 1. 创建 data 目录
  const dirs = ['data/memory', 'data/evolution', 'data/snapshots'];
  dirs.forEach(d => {
    const fp = path.join(ROOT, d);
    if (!fs.existsSync(fp)) {
      fs.mkdirSync(fp, { recursive: true });
      log(`  创建: ${d}`);
    }
  });

  // 2. 初始化记忆文件
  ['hot', 'warm', 'cold'].forEach(f => {
    const fp = path.join(ROOT, 'data/memory', `${f}.json`);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
  });

  // 3. 初始化进化文件
  const evoDir = path.join(ROOT, 'data/evolution');
  const refFile = path.join(evoDir, 'reflexion-patterns.json');
  if (!fs.existsSync(refFile)) fs.writeFileSync(refFile, '[]');

  // 4. 写入 VERSION
  fs.writeFileSync(VERSION_FILE, 'v0.13.10\n');
  // 5. 写入 package.json
  const pkg = {
    name: 'heartflow',
    version: '0.13.10',
    description: 'AI identity framework for self-improving AI agents',
    main: 'src/core/heartflow.js',
    bin: { heartflow: 'bin/cli.js' },
    scripts: {
      start: 'node bin/cli.js start',
      diagnose: 'node bin/cli.js diagnose',
      check: 'node HEARTCORE/heartbeat.js',
    },
    keywords: ['heartflow', 'identity', 'self-improvement'],
    license: 'MIT',
  };
  fs.writeFileSync(PKG_FILE, JSON.stringify(pkg, null, 2));

  log('安装完成！');
  cmdDiagnose();
}

function cmdStart() {
  log('启动 HeartFlow...');
  try {
    const { HeartFlow } = require('../src/core/heartflow.js');
    const hf = new HeartFlow({ rootPath: ROOT });
    hf.start();
    log('HeartFlow 已启动。按 Ctrl+C 停止。');
    process.on('SIGINT', () => { hf.stop(); process.exit(0); });
  } catch (e) {
    err(`启动失败: ${e.message}`);
  }
}

function cmdDiagnose() {
  log('运行诊断...');
  try {
    const { StartupCheck } = require('../HEARTCORE/startup-check.js');
    const result = StartupCheck.run();
    if (result.status === 'READY') {
      log(`状态: ✓ READY (${result.info.version})`);
    } else {
      log(`状态: ✗ ISSUES (${result.issues.length} 个问题)`);
      result.issues.forEach(i => log(`  - ${i.item}: ${i.issue}`));
    }
    log(`Node.js: ${result.info.nodeVersion}`);
    log(`数据目录: ${result.info.dataWritable ? '可写' : '不可写'}`);
    log(`记忆系统: ${result.info.memoryReady ? '就绪' : '未就绪'}`);
  } catch (e) {
    err(`诊断失败: ${e.message}`);
  }
}

function cmdCheck() {
  try {
    execSync(`node "${path.join(ROOT, 'HEARTCORE/heartbeat.js')}"`, { stdio: 'inherit' });
  } catch (e) {
    err('自检失败');
  }
}

function cmdUpgrade() {
  log('检查升级...');
  const current = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  log(`当前版本: ${current}`);

  // 从本地 CHANGELOG.md 提取最新版本
  let latest = current;
  try {
    const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
    const match = changelog.match(/^#+\s+HeartFlow\s+v?(\d+\.\d+\.\d+)/m);
    if (match) latest = 'v' + match[1];
  } catch {}

  log(`最新版本: ${latest}`);
  if (current !== latest) {
    log('有新版本！请查看 CHANGELOG.md');
  } else {
    log('已是最新版本。');
  }
}

function usage() {
  console.log(`
HeartFlow CLI v0.13.10

用法: heartflow <命令>

命令:
  setup     安装 HeartFlow（初始化数据目录和配置文件）
  start     启动 HeartFlow 引擎
  diagnose  运行启动诊断
  check     运行心跳自检
  upgrade   检查新版本

示例:
  node bin/cli.js setup
  node bin/cli.js start
  node bin/cli.js diagnose
`);
}

// 主入口
function cmdREPL() {
  log('启动 HeartFlow REPL...');
  try {
    const { runREPL } = require('../src/cli/commands/repl');
    runREPL();
  } catch (e) {
    err(`REPL 启动失败: ${e.message}`);
  }
}

const cmd = process.argv[2];
switch (cmd) {
  case 'setup':    cmdSetup(); break;
  case 'start':    cmdStart(); break;
  case 'diagnose': cmdDiagnose(); break;
  case 'check':    cmdCheck(); break;
  case 'upgrade':  cmdUpgrade(); break;
  case 'repl':     cmdREPL(); break;
  default:         usage(); process.exit(cmd ? 1 : 0);
}
