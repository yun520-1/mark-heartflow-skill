#!/usr/bin/env node
/**
 * HeartFlow CLI - 心虫引擎命令行接口
 * 支持 status/help 命令，供 heartflow CLI 脚本调用
 */
const path = require('path');
const fs = require('fs');

// 查找引擎根目录
let hfDir = __dirname;
while (hfDir !== '/' && !fs.existsSync(path.join(hfDir, 'src/core/heartflow.js'))) {
  hfDir = path.dirname(hfDir);
}
if (!fs.existsSync(path.join(hfDir, 'src/core/heartflow.js'))) {
  console.error(JSON.stringify({ error: 'HeartFlow engine not found' }));
  process.exit(1);
}

const cmd = process.argv[2] || 'status';

switch (cmd) {
  case 'status': {
    let engine = null;
    try {
      const { HeartFlow } = require(path.join(hfDir, 'src/core/heartflow.js'));
      engine = new HeartFlow({ dataDir: path.join(hfDir, 'data'), silent: true });
      engine.start();
      const version = (() => {
        try { return require(path.join(hfDir, 'package.json')).version || 'unknown'; } catch(e) { return 'unknown'; }
      })();
      const result = {
        version,
        modules: engine._modules ? Object.keys(engine._modules).length : 0,
        status: 'running',
        memory: engine.identityCore ? engine.identityCore.getMemoryStats() : null
      };
      console.log(JSON.stringify(result, null, 2));
      engine.shutdown();
      process.exit(0);
    } catch (e) {
      if (engine) { try { engine.shutdown(); } catch (_) {} }
      console.error(JSON.stringify({ error: e.message }));
      process.exit(1);
    }
    break;
  }
  case 'help':
    console.log(`HeartFlow CLI
Usage: node cli.js <command>
Commands:
  status  显示引擎状态（版本、模块数、记忆统计）
  help    显示此帮助信息`);
    process.exit(0);
    break;
  default:
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
}
