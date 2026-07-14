const { spawn } = require('child_process');
const path = require('path');

const HF_DIR = path.resolve('/root/.hermes/skills/ai/mark-heartflow-skill');
const STDIO = path.join(HF_DIR, 'mcp', 'mcp-server-stdio.js');
const NODE = '/root/.local/bin/node';

const child = spawn(NODE, [STDIO], {
  cwd: HF_DIR,
  env: { ...process.env, HEARTFLOW_MCP_TOKEN: 'test' },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';

function send(method, params, id, expectResponse = true) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    if (!expectResponse) {
      child.stdin.write(msg + '\n');
      resolve(null);
      return;
    }
    const onData = (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            child.stdout.off('data', onData);
            child.stdout.off('error', onError);
            resolve(parsed);
            return;
          }
        } catch (_) {}
      }
    };
    const onError = (err) => {
      child.stdout.off('data', onData);
      child.stderr.off('error', onError);
      reject(err);
    };
    child.stdout.once('error', onError);
    child.stdout.on('data', onData);
    child.stdin.write(msg + '\n');
  });
}

(async () => {
  try {
    child.stderr.on('data', (chunk) => { process.stderr.write(chunk); });
    await send('initialize', {}, 1);
    await send('notifications/initialized', {}, 2, false);

    const list = await send('tools/list', {}, 3);
    const tools = list.result?.tools || [];
    const newTools = [
      'heartflow_knowledge_query',
      'heartflow_knowledge_add_node',
      'heartflow_knowledge_stats',
      'heartflow_persona_bridge_identity',
      'heartflow_persona_value_aligner',
      'heartflow_persona_stance_detector',
      'heartflow_evolution_stats',
      'heartflow_evolution_evolve',
    ];

    console.log('=== tools/list count:', tools.length);
    const missing = newTools.filter(n => !tools.some(t => t.name === n));
    if (missing.length) {
      console.error('MISSING TOOLS:', missing);
      process.exitCode = 1;
    } else {
      console.log('All 8 new tools registered in TOOLS list.');
    }

    const calls = [
      ['heartflow_knowledge_query', { subject: 'heartflow' }],
      ['heartflow_knowledge_add_node', { name: 'mcp-test', description: 'test node', type: 'concept', importance: 0.8 }],
      ['heartflow_knowledge_stats', {}],
      ['heartflow_persona_bridge_identity', {}],
      ['heartflow_persona_value_aligner', { userInput: '你好' }],
      ['heartflow_persona_stance_detector', { input: '测试立场输入' }],
      ['heartflow_evolution_stats', {}],
      ['heartflow_evolution_evolve', { input: 'mcp evolution test' }],
    ];

    let id = 10;
    for (const [name, args] of calls) {
      const res = await send('tools/call', { name, arguments: args }, id++);
      const text = res.result?.content?.[0]?.text || '';
      let parsed;
      try { parsed = JSON.parse(text); } catch (_) { parsed = text; }
      const hasError = parsed && parsed.error;
      console.log(`--- ${name} ---`);
      console.log(JSON.stringify(parsed, null, 2));
      if (hasError) {
        console.error(`Tool ${name} returned error result`);
        process.exitCode = 1;
      }
    }
  } catch (e) {
    console.error('VERIFY ERROR:', e);
    process.exitCode = 1;
  } finally {
    child.stdin.end();
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  }
})();
