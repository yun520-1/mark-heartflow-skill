#!/usr/bin/env node
/**
 * HeartFlow API Server
 * 
 * HTTP API for HeartFlow cognitive engine
 * 
 * Start: node bin/api-server.js
 * Port: 3456 (or PORT env variable)
 */

const http = require('http');
const url = require('url');
const path = require('path');

const PORT = process.env.PORT || 3456;

// Load HeartFlow
let heartflow;
try {
  heartflow = require('../src/core/heartflow-engine.js');
  console.log('[API] HeartFlow engine loaded');
} catch (e) {
  console.error('[API] Failed to load HeartFlow:', e.message);
  process.exit(1);
}

let systemInit = null;

function initialize() {
  if (!systemInit) {
    systemInit = heartflow.initialize();
    console.log('[API] System initialized');
  }
  return systemInit;
}

// Request handler
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');

  try {
    // Route: Health check
    if (pathname === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // Route: System status
    if (pathname === '/api/status' && req.method === 'GET') {
      const init = initialize();
      res.writeHead(200);
      res.end(JSON.stringify({
        modules: init.modules,
        instances: init.instances ? Object.keys(init.instances) : [],
        status: 'running'
      }));
      return;
    }

    // Route: Emotion detection
    if (pathname === '/api/emotion' && req.method === 'POST') {
      let body = await readBody(req);
      const { text } = body;
      
      if (!text) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing "text" field' }));
        return;
      }

      const result = heartflow.detectEmotionFromText(text);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // Route: Flow state calculation
    if (pathname === '/api/flow' && req.method === 'POST') {
      let body = await readBody(req);
      const { pleasure = 5, arousal = 5, dominance = 5, challenge = 5, skill = 5 } = body;

      const result = heartflow.calculateFlowState(pleasure, arousal, dominance, challenge, skill);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // Route: Memory operations
    if (pathname === '/api/memory' && req.method === 'POST') {
      const init = initialize();
      let body = await readBody(req);
      const { action, content, query: memQuery } = body;

      if (action === 'store') {
        if (!content) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing "content" field' }));
          return;
        }
        const id = init.instances.memory.store({ content });
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, id }));
      } 
      else if (action === 'search') {
        if (!memQuery) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing "query" field' }));
          return;
        }
        const emb = init.instances.memory.generateMockEmbedding(memQuery);
        const results = init.instances.memory.semanticSearch(emb, 10);
        res.writeHead(200);
        res.end(JSON.stringify({ results }));
      }
      else {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid action. Use "store" or "search"' }));
      }
      return;
    }

    // Route: Cognitive planning
    if (pathname === '/api/plan' && req.method === 'POST') {
      const init = initialize();
      let body = await readBody(req);
      const { description, type = 'general' } = body;

      if (!description) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing "description" field' }));
        return;
      }

      const result = init.instances.embodied.cognitivePlan({ description, type });
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // Route: Execution mapping
    if (pathname === '/api/execute' && req.method === 'POST') {
      const init = initialize();
      let body = await readBody(req);
      const { planId, context = {} } = body;

      if (!planId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing "planId" field' }));
        return;
      }

      // Simple execution (would need plan storage in real impl)
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'executed', planId }));
      return;
    }

    // 404 for other routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', availableRoutes: [
      'GET /api/health',
      'GET /api/status',
      'POST /api/emotion',
      'POST /api/flow',
      'POST /api/memory',
      'POST /api/plan',
      'POST /api/execute'
    ]}));

  } catch (error) {
    console.error('[API] Error:', error.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Helper: Read request body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║         HeartFlow API Server             ║
║═══════════════════════════════════════════║
║  Server running at http://localhost:${PORT}   ║
║                                           ║
║  Endpoints:                               ║
║  GET  /api/health     Health check       ║
║  GET  /api/status     System status      ║
║  POST /api/emotion    Detect emotion      ║
║  POST /api/flow       Calculate flow     ║
║  POST /api/memory     Store/search       ║
║  POST /api/plan       Cognitive plan     ║
║  POST /api/execute    Execute plan        ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[API] Shutting down...');
  server.close(() => {
    console.log('[API] Server stopped');
    process.exit(0);
  });
});