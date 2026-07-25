#!/usr/bin/env node
/**
 * HeartFlow v7 MCP Server — AGI Error Memory & Decision Audit
 *
 * 5 tools exposed to any LLM via MCP:
 *   heartflow_memory_store / query / verify / check_alignment / diagnose / status
 *
 * Usage:
 *   node src/heartflow/mcp-server.js [--port 8588]
 */

const http = require('http');
const { HeartFlow, MCP_TOOLS, createMCPHandlers } = require('./index.js');

const PORT = parseInt(process.argv.find((_, i) => process.argv[i - 1] === '--port') || '8588', 10);

const hf = new HeartFlow().start();
const handlers = createMCPHandlers(hf);

const TOOL_LOOKUP = {};
for (const t of MCP_TOOLS) TOOL_LOOKUP[t.name] = t;

const server = http.createServer((req, res) => {
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') return send(200, {});

  // GET /health or /tools
  if (req.method === 'GET') {
    if (req.url === '/health') return send(200, { ok: true, version: '7.0.0' });
    if (req.url === '/tools') return send(200, { tools: MCP_TOOLS });
    return send(404, { error: 'not found' });
  }

  // POST /call
  if (req.method === 'POST' && req.url === '/call') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { tool, args } = JSON.parse(body);
        const handler = handlers[tool];
        if (!handler) return send(400, { error: `unknown tool: ${tool}`, available: Object.keys(handlers) });
        const result = await handler(args || {});
        send(200, { result });
      } catch (e) {
        send(400, { error: e.message });
      }
    });
    return;
  }

  send(404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`[HeartFlow v7] MCP server running on port ${PORT}`);
  console.log(`[HeartFlow v7] Tools: ${MCP_TOOLS.map(t => t.name).join(', ')}`);
});
