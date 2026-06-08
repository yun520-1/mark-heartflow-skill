#!/usr/bin/env node
/**
 * HeartFlow Daemon Client — 供插件调用的 socket 客户端
 *
 * 通过 Unix socket 向 daemon 发送 JSON 请求并获取响应。
 * 用法:
 *   const client = require('./daemon-client.js');
 *   const result = await client.bundle('用户输入文本');
 *   const pong = await client.ping();
 *   const status = await client.status();
 *   const bye = await client.shutdown();
 *
 * 返回:
 *   - bundle(text) → {status, psychology, judgment, inject, version} 或 {error: '...'}
 *   - ping() → {status: 'ok', pong: true}
 *   - status() → {status: 'ok', version, engineLoaded}
 *   - shutdown() → {status: 'ok', message: 'shutting_down'}
 */

const net = require('net');

const SOCKET_PATH = '/tmp/heartflow-daemon.sock';
const DEFAULT_TIMEOUT = 10000; // 10秒超时

/**
 * 向 daemon 发送 JSON 请求并等待响应
 * @param {object} request - JSON 请求对象
 * @param {number} timeout - 超时毫秒数
 * @returns {Promise<object>} 解析后的响应对象
 */
function sendRequest(request, timeout = DEFAULT_TIMEOUT) {
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
            resolve({ status: 'error', error: 'daemon_client_timeout', detail: `请求超时(${timeout}ms)` });
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
            } catch(e) {
                // JSON 不完整，继续等待
            }
        });

        client.on('error', (err) => {
            cleanup();
            resolve({
                status: 'error',
                error: 'daemon_connection_error',
                detail: `无法连接到 daemon (${SOCKET_PATH}): ${err.message}`,
                _code: err.code
            });
        });

        client.on('close', () => {
            if (timer) {
                cleanup();
                if (buffer) {
                    try {
                        const response = JSON.parse(buffer);
                        resolve(response);
                    } catch(e) {
                        resolve({ status: 'error', error: 'daemon_closed', detail: '连接关闭，未收到完整响应' });
                    }
                } else {
                    resolve({ status: 'error', error: 'daemon_closed', detail: '连接已关闭' });
                }
            }
        });
    });
}

/**
 * 调用 daemon 的 bundle 命令
 * @param {string} text - 用户输入文本
 * @returns {Promise<object>} {status, psychology, judgment, inject, version} 或错误
 */
async function bundle(text) {
    return sendRequest({ cmd: 'bundle', text: text || '' });
}

/**
 * ping daemon 检查是否存活
 */
async function ping() {
    return sendRequest({ cmd: 'ping' });
}

/**
 * 获取 daemon 状态
 */
async function getStatus() {
    return sendRequest({ cmd: 'status' });
}

/**
 * 请求 daemon 关闭
 */
async function shutdown() {
    return sendRequest({ cmd: 'shutdown' });
}

module.exports = {
    bundle,
    ping,
    getStatus,
    shutdown,
    sendRequest,
    SOCKET_PATH,
};
