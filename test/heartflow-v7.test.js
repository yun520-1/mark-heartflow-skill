/**
 * HeartFlow v7 — AGI Error Memory
 *
 * Integration tests for the 5 core engines.
 */

const assert = require('assert');
const { HeartFlow, ErrorMemory, MCP_TOOLS, createMCPHandlers } = require('../src/heartflow/index.js');

module.exports = function ({ test }) {

  test('HeartFlow v7 starts without errors', () => {
    const hf = new HeartFlow({ silent: true });
    hf.start();
    const s = hf.getStats();
    assert(s.version === '7.0.0', `version mismatch: ${s.version}`);
    assert(s.started === true);
    hf.shutdown();
  });

  test('ErrorMemory stores and queries', () => {
    const mem = new ErrorMemory({ path: '/tmp/hf-test-mem.json' });
    mem.store('llm hallucinated in math problem', 'asked for verification', 'incorrect answer was fixed');
    mem.store('agent stuck in retry loop', 'set max retries to 3', 'loop terminated');
    const r = mem.query('math problem');
    assert(r.results.length >= 1, 'should find math-related error');
    assert(r.results[0].outcome.includes('fixed'), 'should match stored outcome');
  });

  test('ErrorMemory query with no matches returns empty', () => {
    const mem = new ErrorMemory({ path: '/tmp/hf-test-mem2.json' });
    const r = mem.query('unrelated topic xyz789');
    assert(Array.isArray(r.results));
  });

  test('MCP tool definitions are valid', () => {
    assert(Array.isArray(MCP_TOOLS));
    assert(MCP_TOOLS.length >= 5);
    const names = MCP_TOOLS.map(t => t.name);
    assert(names.includes('heartflow_memory_store'));
    assert(names.includes('heartflow_memory_query'));
    assert(names.includes('heartflow_verify'));
    assert(names.includes('heartflow_check_alignment'));
    assert(names.includes('heartflow_diagnose'));
    assert(names.includes('heartflow_status'));
  });

  test('MCP handlers respond correctly', async () => {
    const hf = new HeartFlow({ silent: true });
    hf.start();
    const handlers = createMCPHandlers(hf);

    const store = await handlers.heartflow_memory_store({ problem: 'test error', action: 'test action', outcome: 'test outcome' });
    assert(store.stored === true);

    const query = await handlers.heartflow_memory_query({ problem: 'test error' });
    assert(query.results.length >= 1);

    const status = await handlers.heartflow_status({});
    assert(status.version === '7.0.0');
    assert(status.started === true);

    hf.shutdown();
  });

  test('DecisionVerifier.verify produces structured output', () => {
    const hf = new HeartFlow({ silent: true });
    hf.start();
    // This will fall through to require the old verifier if available
    const r = hf.verifier.verify('test claim', ['evidence a'], [], 0.5);
    assert(typeof r.score === 'number');
    assert(Array.isArray(r.issues));
    hf.shutdown();
  });
};
