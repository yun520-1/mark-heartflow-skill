/**
 * HeartFlow API Server
 * 提供 RESTful API 接口
 */

const http = require('http');
const url = require('url');
const heartflow = require('../skill/index');

// API 配置
const CONFIG = {
  port: process.env.HEARTFLOW_PORT || 3800,
  host: process.env.HEARTFLOW_HOST || 'localhost',
  cors: process.env.HEARTFLOW_CORS !== 'false'
};

// 请求处理
const handlers = {
  // GET /health - 健康检查
  'GET /health': async (req, res) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  },
  
  // GET /status - 获取情感状态
  'GET /status': async (req, res) => {
    return heartflow.getState();
  },
  
  // GET /history - 获取情感历史
  'GET /history': async (req, res) => {
    const query = url.parse(req.url, true).query;
    const limit = parseInt(query.limit) || 10;
    return heartflow.getHistory(limit);
  },
  
  // GET /stats - 获取情感统计
  'GET /stats': async (req, res) => {
    return heartflow.getStats();
  },
  
  // GET /report - 获取情感报告
  'GET /report': async (req, res) => {
    const query = url.parse(req.url, true).query;
    const index = parseInt(query.index) || -1;
    return heartflow.getReport(index);
  },
  
  // POST /chat - 发送消息
  'POST /chat': async (req, res, body) => {
    const { message } = body;
    if (!message) {
      throw new Error('缺少 message 参数');
    }
    return heartflow.chat(message);
  },
  
  // POST /rest - 休息
  'POST /rest': async (req, res, body) => {
    const { minutes } = body;
    return heartflow.rest(minutes || 10);
  },
  
  // POST /reset - 重置
  'POST /reset': async (req, res) => {
    return heartflow.reset();
  },
  
  // GET /export - 导出会话
  'GET /export': async (req, res) => {
    return heartflow.exportSession();
  },
  
  // POST /end - 结束会话
  'POST /end': async (req, res) => {
    return heartflow.endSession();
  },
  
  // GET /emotions - 获取情感类型定义
  'GET /emotions': async (req, res) => {
    const { EmotionDefinitions, getAllEmotionTypes } = require('../src/emotion/states');
    return {
      emotions: getAllEmotionTypes(),
      definitions: EmotionDefinitions
    };
  }
};

// 创建服务器
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const pathname = url.parse(req.url).pathname;
  const key = `${method} ${pathname}`;
  
  // CORS 预检请求
  if (method === 'OPTIONS' && CONFIG.cors) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 查找处理器
  const handler = handlers[key];
  
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: key }));
    return;
  }
  
  try {
    // 解析请求体
    let body = {};
    if (method === 'POST') {
      body = await parseBody(req);
    }
    
    // 调用处理器
    const result = await handler(req, res, body);
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    if (CONFIG.cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.writeHead(200);
    res.end(JSON.stringify(result, null, 2));
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(400);
    res.end(JSON.stringify({ error: error.message }));
  }
});

// 解析请求体
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

// 启动服务器
async function startServer() {
  // 初始化 HeartFlow
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

// 停止服务器
function stopServer() {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('HeartFlow API Server 已停止');
      resolve();
    });
  });
}

// 命令行启动
if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { startServer, stopServer, server };
