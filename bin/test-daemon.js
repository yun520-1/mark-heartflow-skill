#!/usr/bin/env node
/**
 * 测试 HeartFlow Daemon 启动和响应
 * 
 * 用法: node test-daemon.js
 */

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const DAEMON_JS = path.join(__dirname, 'daemon.js');
const SOCKET_PATH = '/tmp/heartflow-daemon.sock';
const TEST_TIMEOUT = 20000;

async function testDaemon() {
    console.log('=== HeartFlow Daemon 测试 ===');
    console.log('');

    // 1. 启动 daemon
    console.log('[1/4] 启动 daemon...');
    const daemon = spawn('node', [DAEMON_JS, '--forever'], {
        cwd: path.dirname(DAEMON_JS),
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { ...process.env }
    });

    let daemonStderr = '';
    daemon.stderr.on('data', (data) => {
        daemonStderr += data.toString();
    });

    // 等待 daemon 启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (daemon.killed) {
        console.error('❌ Daemon 启动失败');
        console.error('stderr:', daemonStderr);
        process.exit(1);
    }
    console.log('✅ Daemon 已启动 (PID:', daemon.pid, ')');

    // 2. ping 测试
    console.log('');
    console.log('[2/4] ping 测试...');
    try {
        const pong = await sendRequest({ cmd: 'ping' });
        if (pong.status === 'ok' && pong.pong) {
            console.log('✅ ping 成功, 版本:', pong.version);
        } else {
            console.error('❌ ping 失败:', JSON.stringify(pong));
        }
    } catch(e) {
        console.error('❌ ping 异常:', e.message);
    }

    // 3. bundle 测试
    console.log('');
    console.log('[3/4] bundle 测试 (空文本)...');
    try {
        const result = await sendRequest({ cmd: 'bundle', text: '' });
        if (result.status === 'ok') {
            console.log('✅ bundle 成功');
            console.log('   版本:', result.version);
            console.log('   psychology keys:', Object.keys(result.psychology || {}).slice(0, 5));
            console.log('   judgment keys:', Object.keys(result.judgment || {}).slice(0, 5));
            console.log('   inject length:', (result.inject || '').length);
        } else {
            console.error('❌ bundle 失败:', JSON.stringify(result));
        }
    } catch(e) {
        console.error('❌ bundle 异常:', e.message);
    }

    // 4. bundle 测试 (有文本)
    console.log('');
    console.log('[4/4] bundle 测试 (有文本 "今天心情很好")...');
    try {
        const result = await sendRequest({ cmd: 'bundle', text: '今天心情很好' });
        if (result.status === 'ok') {
            console.log('✅ bundle(有文本) 成功');
            console.log('   版本:', result.version);
            const psy = result.psychology || {};
            console.log('   psychology:', JSON.stringify(psy).substring(0, 200));
            const jud = result.judgment || {};
            console.log('   judgment:', JSON.stringify(jud).substring(0, 200));
        } else {
            console.error('❌ bundle(有文本) 失败:', JSON.stringify(result));
        }
    } catch(e) {
        console.error('❌ bundle(有文本) 异常:', e.message);
    }

    // 清理
    console.log('');
    console.log('--- 清理 ---');
    daemon.kill('SIGTERM');
    console.log('✅ Daemon 已停止');

    // 总结果
    console.log('');
    console.log('=== 测试完成 ===');
}

function sendRequest(request, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let buffer = '';
        let timer = null;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            client.destroy();
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error('timeout'));
        }, timeout);

        client.connect(SOCKET_PATH, () => {
            client.write(JSON.stringify(request));
        });

        client.on('data', (data) => {
            buffer += data.toString('utf8');
            try {
                const response = JSON.parse(buffer);
                cleanup();
                resolve(response);
            } catch(e) {}
        });

        client.on('error', (err) => {
            cleanup();
            reject(err);
        });

        client.on('close', () => {
            if (timer) {
                cleanup();
                if (buffer) {
                    try {
                        resolve(JSON.parse(buffer));
                    } catch(e) {
                        reject(new Error('connection closed'));
                    }
                } else {
                    reject(new Error('connection closed'));
                }
            }
        });
    });
}

testDaemon().catch(e => {
    console.error('测试异常:', e);
    process.exit(1);
});
