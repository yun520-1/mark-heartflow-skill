#!/usr/bin/env node
/**
 * HeartFlow CLI — 心虫命令行接口
 * heartflow-memory 插件通过这个调用心虫
 * 
 * 用法: node cli.js <command> [args...]
 * 
 * 命令:
 *   analyze <text>     — 心理分析
 *   status            — 状态统计
 * 
 * 输出: 单行JSON对象
 */

const path = require('path');

// 动态加载，避免启动时加载全部模块
function loadEngine() {
    const hfDir = path.dirname(__dirname); // = skill根目录
    const { HeartFlow } = require(path.join(hfDir, 'src', 'core', 'heartflow.js'));
    const hf = new HeartFlow({ rootPath: hfDir });
    hf.start();
    return hf;
}

const command = process.argv[2];
const args = process.argv.slice(3);

function respond(data) {
    // 只输出JSON，不输出日志
    process.stdout.write(JSON.stringify(data) + '\n');
    process.exit(0);
}

function respondError(msg) {
    process.stdout.write(JSON.stringify({ error: msg }) + '\n');
    process.exit(1);
}

try {
    switch (command) {
        case 'analyze': {
            const text = args.join(' ').trim();
            if (!text) {
                respondError('analyze: text is required');
            }
            const hf = loadEngine();
            const result = hf.dispatch('psychology.analyzePsychology', text);
            respond(result || { error: 'no result' });
            break;
        }
        case 'status': {
            const hf = loadEngine();
            const result = hf.dispatch('identityCore.getMemoryStats');
            respond(result || { status: 'ok', loaded: Object.keys(hf._modules || {}).length });
            break;
        }
        default: {
            respondError(`unknown command: ${command}. Use: analyze <text> | status`);
        }
    }
} catch (err) {
    respondError(err.message);
}