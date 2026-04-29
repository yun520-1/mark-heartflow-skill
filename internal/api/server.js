const http = require('http');
const url = require('url');
const heartflow = require('../skill/index');

// API 配置
const CONFIG = {
  port: process.env.HEARTFLOW_PORT || 3800,
  host: process.env.HEARTFLOW_HOST || 'localhost',
  cors: process.env.HEARTFLOW_CORS !== 'false'
};

function isLocalOrigin(origin) {
  return origin === 'http://localhost' ||
    origin === 'http://127.0.0.1' ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');
}

function setCorsHeaders(req, res) {
  if (!CONFIG.cors) return;
  const origin = req.headers.origin || '';
  if (isLocalOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
}

// 请求处理
const handlers = {
  'GET /health': async () => ({ status: 'ok', timestamp: new Date().toISOString() }),
  'GET /status': async () => heartflow.getState(),
  'GET /history': async (req) => {
    const query = url.parse(req.url, true).query;
    const limit = parseInt(query.limit) || 10;
    return heartflow.getHistory(limit);
  },
  'GET /stats': async () => heartflow.getStats(),
  'GET /report': async (req) => {
    const query = url.parse(req.url, true).query;
    const index = parseInt(query.index) || -1;
    return heartflow.getReport(index);
  },
  'POST /chat': async (req, res, body) => {
    const { message } = body;
    if (!message) throw new Error('缺少 message 参数');
    return heartflow.chat(message);
  },
  'POST /rest': async (req, res, body) => {
    const { minutes } = body;
    return heartflow.rest(minutes || 10);
  },
  'POST /reset': async () => heartflow.reset(),
  'GET /export': async () => heartflow.exportSession(),
  'POST /end': async () => heartflow.endSession(),
  'GET /emotions': async () => {
    const { EmotionDefinitions, getAllEmotionTypes } = require('../src/emotion/states');
    return {
      emotions: getAllEmotionTypes(),
      definitions: EmotionDefinitions
    };
  }
};

const server = http.createServer(async (req, res) => {
  const method = req.method;
  const pathname = url.parse(req.url).pathname;
  const key = `${method} ${pathname}`;

  if (method === 'OPTIONS' && CONFIG.cors) {
    setCorsHeaders(req, res);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(200);
    res.end();
    return;
  }

  const handler = handlers[key];
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: key }));
    return;
  }

  try {
    let body = {};
    if (method === 'POST') body = await parseBody(req);
    const result = await handler(req, res, body);
    res.setHeader('Content-Type', 'application/json');
    setCorsHeaders(req, res);
    res.writeHead(200);
    res.end(JSON.stringify(result, null, 2));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(400);
    res.end(JSON.stringify({ error: error.message }));
  }
});

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('无效的 JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function startServer() {
  await heartflow.init();
  return new Promise((resolve, reject) => {
    server.listen(CONFIG.port, CONFIG.host, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`
╔════════════════════════════════════════════════════════╗
║         HeartFlow API Server 已启动                     ║
╠════════════════════════════════════════════════════════╣
║  地址：http://${CONFIG.host}:${CONFIG.port}
║  端点：                                                 ║
║    GET  /health     - 健康检查                         ║
║    GET  /status     - 获取情感状态                     ║
║    GET  /history    - 获取情感历史                     ║
║    GET  /stats      - 获取情感统计                     ║
║    GET  /report     - 获取情感报告                     ║
║    GET  /emotions   - 获取情感类型定义                 ║
║    GET  /export     - 导出会话数据                     ║
║    POST /chat       - 发送消息                         ║
║    POST /rest       - 休息恢复能量                     ║
║    POST /reset      - 重置情感状态                     ║
║    POST /end        - 结束会话                         ║
╚════════════════════════════════════════════════════════╝
      `);
      resolve(server);
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('HeartFlow API Server 已停止');
      resolve();
    });
  });
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { startServer, stopServer, server };