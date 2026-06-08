#!/usr/bin/env node
/**
 * HeartFlow CLI — 心虫命令行接口
 * heartflow-memory 插件通过这个调用心虫
 * 
 * 用法: node cli.js <command> [args...]
 * 
 * 命令:
 *   bundle <text>     — [推荐] 合并调用：一次返回 status+psychology+judgment+inject
 *   analyze <text>    — 心理分析（已合并到 bundle）
 *   think <text>      — 心虫判定（已合并到 bundle）
 *   status            — 状态统计
 * 
 * 输出: 单行JSON对象
 */

const path = require('path');
const fs = require('fs');

// 动态加载，避免启动时加载全部模块
function loadEngine() {
    const hfDir = path.dirname(__dirname); // = skill根目录
    const { HeartFlow } = require(path.join(hfDir, 'src', 'core', 'heartflow.js'));
    const hf = new HeartFlow({ rootPath: hfDir });
    hf.start();
    return hf;
}

function getVersion(hfDir) {
    try {
        return fs.readFileSync(path.join(hfDir, 'VERSION'), 'utf8').trim();
    } catch(e) {
        return 'unknown';
    }
}

function getMemoryInject(hfDir) {
    try {
        const injectPath = path.join(hfDir, 'scripts', 'heartflow-memory-inject.js');
        if (fs.existsSync(injectPath)) {
            const result = require('child_process').execFileSync('node', [injectPath], {
                cwd: hfDir, timeout: 8000, encoding: 'utf8', maxBuffer: 10240
            });
            return result.trim();
        }
    } catch(e) {}
    return '';
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
        case 'think': {
            const text = args.join(' ').trim();
            if (!text) {
                respondError('think: text is required');
            }
            const hf = loadEngine();
            hf.think(text).then(result => {
                respond(result || { error: 'no result' });
            }).catch(err => {
                respondError(err.message);
            });
            break;
        }
        case 'bundle': {
            // 合并命令：一次引擎加载，返回 status + psychology + judgment + inject
            const text = args.join(' ').trim();
            const hfDir = path.dirname(__dirname);
            const version = getVersion(hfDir);

            // 先取 status（不需要文本）
            const hf = loadEngine();
            let statusData = {};
            try {
                const stats = hf.dispatch('identityCore.getMemoryStats');
                statusData = stats || { loaded: Object.keys(hf._modules || {}).length };
            } catch(e) {
                statusData = { error: e.message, loaded: Object.keys(hf._modules || {}).length };
            }

            // psychology + judgment（需要文本）
            let psychology = {};
            let judgment = {};
            if (text) {
                try {
                    psychology = hf.dispatch('psychology.analyzePsychology', text) || {};
                } catch(e) {
                    psychology = { error: e.message };
                }
                try {
                    judgment = hf.dispatch('truth.checkStatement', text) || {};
                } catch(e) {
                    judgment = { error: e.message };
                }
            }

            // inject（子进程，但走缓存可复用）
            const inject = getMemoryInject(hfDir);

            respond({
                status: { version, ...statusData },
                psychology,
                judgment: { judgment, decision: { shouldRespond: true } },
                inject
            });
            break;
        }
        default: {
            respondError(`unknown command: ${command}. Use: bundle <text> | status`);
        }
    }
} catch (err) {
    respondError(err.message);
}