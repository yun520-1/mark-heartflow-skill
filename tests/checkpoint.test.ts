/**
 * CheckpointEngine Tests — v0.12.50
 * 
 * Run: npx tsx tests/checkpoint.test.ts
 */

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CheckpointEngine } from '../src/storage/checkpoint/CheckpointEngine';

// ─── Test helpers ──────────────────────────────────────────────────────────

const TEST_DIR = path.join(os.homedir(), '.hermes', 'heartflow', '__test_checkpoints__');

let pass = 0, fail = 0;
function assert(condition: boolean, message: string) {
  if (condition) { pass++; console.log(`  ✓ ${message}`); }
  else { fail++; console.error(`  ✗ FAIL: ${message}`); }
}
function section(name: string) { console.log(`\n[ ${name} ]`); }
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Cleanup helper ───────────────────────────────────────────────────────

function cleanupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    for (const f of fs.readdirSync(TEST_DIR)) {
      fs.unlinkSync(path.join(TEST_DIR, f));
    }
    fs.rmdirSync(TEST_DIR);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────

section('CheckpointEngine: save / load / cleanup');

async function testBasicSaveLoad() {
  cleanupTestDir();
  const engine = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 10 });

  const state = { version: 'v1', mood: 'happy', score: 42 };
  const r = engine.save(state, 'test-v1');
  assert(r.success === true, 'save() returns success');
  assert(typeof r.id === 'string', 'save() returns id');
  assert(r.savedAt !== undefined, 'save() returns savedAt');

  // 小幅延迟确保 ID 不同
  await sleep(5);

  const state2 = { version: 'v2', mood: 'sad', score: 10 };
  const r2 = engine.save(state2, 'test-v2');
  assert(r2.success === true, 'second save succeeds');

  // load latest
  const loaded = engine.load('latest');
  assert(loaded.success === true, 'load(latest) succeeds');
  assert(loaded.data !== undefined, 'load returns data');
  assert((loaded.data as any).version === 'v2', 'latest is v2');

  // load by id
  const byId = engine.load(r.id!);
  assert(byId.success === true, 'load by id succeeds');
  assert((byId.data as any).version === 'v1', 'load by id returns correct version');

  // load unknown id
  const missing = engine.load('9999999999999');
  assert(missing.success === false, 'load unknown id returns failure');

  // load with no snapshots
  cleanupTestDir();
  const empty = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 10 });
  const none = empty.load('latest');
  assert(none.success === false, 'load from empty engine fails gracefully');

  cleanupTestDir();
}

async function testCleanup() {
  cleanupTestDir();
  const engine = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 3 });

  // 保存 5 个快照
  for (let i = 1; i <= 5; i++) {
    const r = engine.save({ seq: i }, `snap-${i}`);
    assert(r.success === true, `snap ${i} saved`);
    await sleep(5);
  }

  const listBefore = engine.list();
  assert(listBefore.success === true, 'list() succeeds');
  assert(listBefore.snapshots.length === 5, '5 snapshots exist before cleanup');

  // cleanup 保留 3 个
  const result = engine.cleanup(3);
  assert(result.success === true, 'cleanup(3) succeeds');
  assert(result.deleted.length === 2, '2 snapshots deleted');
  assert(result.kept === 3, '3 snapshots kept');
  assert(result.deleted.includes(listBefore.snapshots[4].id) === false, 'newer snaps not deleted');
  assert(result.deleted.includes(listBefore.snapshots[3].id) === false, '3rd newest kept');

  // 验证文件真的被删除
  for (const id of result.deleted) {
    const fp = path.join(TEST_DIR, `checkpoint-${id}.json`);
    assert(fs.existsSync(fp) === false, `deleted file ${id} no longer exists`);
  }

  // 验证保留的快照仍可 load
  const latest = engine.load('latest');
  assert(latest.success === true, 'latest after cleanup loads OK');
  assert((latest.data as any).seq === 5, 'latest is seq=5');

  // cleanup 不改变状态如果已少于阈值
  const r2 = engine.cleanup(3);
  assert(r2.success === true, 'second cleanup succeeds');
  assert(r2.deleted.length === 0, 'nothing deleted when under threshold');

  cleanupTestDir();
}

async function testAutoCleanupOnSave() {
  cleanupTestDir();
  const engine = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 4 });

  // 保存 6 个（超过 maxKeep=4）
  for (let i = 1; i <= 6; i++) {
    engine.save({ seq: i });
    await sleep(5);
  }

  const list = engine.list();
  assert(list.success === true, 'list succeeds');
  assert(list.snapshots.length === 4, 'auto-cleanup keeps exactly 4 snapshots after 6 saves');
  assert(list.snapshots[0].id !== undefined, 'snapshots have ids');

  cleanupTestDir();
}

async function testList() {
  cleanupTestDir();
  const engine = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 10 });

  const r1 = engine.save({ n: 1 }, 'first');
  await sleep(5);
  const r2 = engine.save({ n: 2 }, 'second');
  await sleep(5);
  const r3 = engine.save({ n: 3 }, 'third');

  const list = engine.list();
  assert(list.success === true, 'list() succeeds');
  assert(list.snapshots.length === 3, '3 snapshots listed');
  assert(list.snapshots[0].id === r3.id, 'first in list is most recent');
  assert(list.snapshots[2].id === r1.id, 'last in list is oldest');
  assert(list.snapshots[0].label === 'third', 'label preserved');
  assert(typeof list.snapshots[0].sizeBytes === 'number', 'sizeBytes recorded');

  cleanupTestDir();
}

async function testGetStats() {
  cleanupTestDir();
  const engine = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 5 });

  engine.save({ a: 1 });
  engine.save({ b: 2 });

  const stats = engine.getStats();
  assert(stats.totalSnapshots === 2, 'stats.totalSnapshots = 2');
  assert(stats.maxKeep === 5, 'stats.maxKeep = 5');
  assert(stats.lastSavedAt !== null, 'stats.lastSavedAt is set');
  assert(stats.dir === TEST_DIR, 'stats.dir correct');

  cleanupTestDir();
}

async function testEdgeCases() {
  cleanupTestDir();
  const engine = new CheckpointEngine({ dir: TEST_DIR, maxKeep: 10 });

  // 保存空对象
  const r1 = engine.save({});
  assert(r1.success === true, 'save empty object succeeds');

  // 保存带特殊字符的
  const r2 = engine.save({ text: '中文测试 🎉', nested: { key: 'value"with"quotes' } });
  assert(r2.success === true, 'save with unicode and quotes succeeds');

  const loaded = engine.load(r2.id!);
  assert(loaded.success === true, 'load unicode snapshot succeeds');
  assert((loaded.data as any).text === '中文测试 🎉', 'unicode preserved');
  assert((loaded.data as any).nested.key === 'value"with"quotes', 'quotes preserved');

  // 元数据文件存在且合法
  const metaPath = path.join(TEST_DIR, 'checkpoint-meta.json');
  assert(fs.existsSync(metaPath) === true, 'meta file created');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  assert(meta.version === '1.0', 'meta version correct');
  assert(meta.snapshots.length >= 2, 'meta snapshots tracked');

  cleanupTestDir();
}

// ─── Run all ───────────────────────────────────────────────────────────────

(async () => {
  console.log('========================================');
  console.log('  CheckpointEngine — Test Suite');
  console.log('========================================');

  await testBasicSaveLoad();
  await testCleanup();
  await testAutoCleanupOnSave();
  await testList();
  await testGetStats();
  await testEdgeCases();

  console.log('\n========================================');
  console.log(`  Result: ${pass} passed, ${fail} failed`);
  console.log('========================================');
  process.exit(fail > 0 ? 1 : 0);
})();
