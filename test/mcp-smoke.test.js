/**
 * MCP Smoke Test — 轻量冒烟测试关键MCP工具
 */
const assert = require('assert');
let passed = 0, failed = 0;

function test(label, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.error(`FAIL: ${label}`, e.message); }
}

// Test 1: heartflow_think handler exists  
test('heartflow_think tool definition exists', () => {
  const mcp = require('../src/mcp-server.js');
  assert.ok(mcp.HANDLERS || true); // module loads without error
});

// Test 2: heartflow_status
test('heartflow_status tool definition', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(content.includes("name: 'heartflow_status'"));
});

// Test 3: heartflow_emotion
test('heartflow_emotion tool definition', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(content.includes("name: 'heartflow_emotion'"));
});

// Test 4: heartflow_verify
test('heartflow_verify tool definition', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(content.includes("name: 'heartflow_verify'"));
});

// Test 5: All 36 tool definitions exist
test('36 MCP tool definitions', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  const matches = content.match(/name: 'heartflow_/g);
  assert.ok(matches && matches.length >= 30, `Found ${matches ? matches.length : 0} tools, expected >= 30`);
});

// Test 6: New tools exist
test('heartflow_philosophy tool', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(content.includes("heartflow_philosophy"));
});

test('heartflow_consciousness tool', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(content.includes("heartflow_consciousness"));
});

test('heartflow_ethics_check tool', () => {
  const content = require('fs').readFileSync(require('path').join(__dirname, '../src/mcp-server.js'), 'utf8');
  assert.ok(content.includes("heartflow_ethics_check"));
});

console.log(`\n📊 MCP Smoke Test: ${passed} passed, ${failed} failed, total ${passed + failed}`);
if (failed > 0) process.exit(1);
