#!/usr/bin/env npx tsx
// HeartFlow v0.13.0 Integration Test
// Usage: npx tsx heartflow-v013-integration-test.ts

import { createHeartFlow } from '../index.js';

async function test() {
  let passed = 0, failed = 0;
  function test(name: string, fn: () => unknown) {
    try { fn(); console.log('✅', name); passed++; }
    catch(e: unknown) { console.log('❌', name, '-', (e as Error).message); failed++; }
  }

  console.log('\n=== HeartFlow v0.13.0 Integration Test ===\n');
  const engine = createHeartFlow({ maxSteps: 10, verbose: false });

  await test('Engine creation', async () => {});
  await test('Boot', async () => await engine.boot());
  await test('Ready flag', async () => { await engine.boot(); if (!engine.ready) throw new Error('not ready'); });

  await test('Identity engine exists', () => { if (!engine.identity) throw new Error('missing'); });
  await test('Memory engine exists', () => { if (!engine.memory) throw new Error('missing'); });
  await test('Evolution engine exists', () => { if (!engine.evolution) throw new Error('missing'); });
  await test('Cognition engine exists', () => { if (!engine.cognition) throw new Error('missing'); });
  await test('Ethics engine exists', () => { if (!engine.ethics) throw new Error('missing'); });
  await test('Autonomy engine exists', () => { if (!engine.autonomy) throw new Error('missing'); });
  await test('Consciousness engine exists', () => { if (!engine.consciousness) throw new Error('missing'); });
  await test('Transmission engine exists', () => { if (!engine.transmission) throw new Error('missing'); });

  await test('Ethics judge', () => {
    const j = engine.ethics.judge({ action: 'test', context: {} });
    if (!j) throw new Error('no judgment');
  });

  await test('Autonomy decide', () => {
    const d = engine.autonomy.decide({ task: 'test' });
    if (!d) throw new Error('no decision');
  });

  await test('Consciousness getState', () => {
    const s = engine.consciousness.getState();
    if (!s) throw new Error('no state');
  });

  await test('Memory import', () => {
    const count = engine.memory.importMemory(JSON.stringify([{ id: 'm1', content: 'test', importance: 0.8, tags: ['test'], ephemeral: false, createdAt: Date.now(), lastAccessed: Date.now() }]));
    if (count < 0) throw new Error('import failed');
  });

  await test('Cognition reason', () => {
    const r = engine.cognition.reason({ task: 'analyze something', context: {} });
    if (!r) throw new Error('no reasoning');
  });

  await test('Evolution evolve', () => {
    const result = engine.evolution.evolve([{x:1},{x:2},{x:3}], {
      populationSize: 3,
      generations: 2,
      mutationRate: 0.1,
      fitnessFn: (ind: {x:number}) => ({ fitness: ind.x, metadata: {} }),
      mutateFn: (ind: {x:number}) => ({ x: ind.x + 1 })
    });
    if (!result) throw new Error('no evolution result');
  });

  await test('Run supervisor', async () => {
    const r = await engine.supervisor.run({ task: 'analyze this task' });
    if (!r) throw new Error('no result');
  });

  await test('Shutdown', () => engine.shutdown());

  console.log('\n' + '─'.repeat(40));
  console.log('Result:', passed, 'passed,', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}

test().catch(e => { console.error(e); process.exit(1); });
