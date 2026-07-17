/**
 * MemoryVault 长效规则机制（声明式契约 + 自检）
 *
 * 这是"心虫记忆持久化与实时管理"的权威规则集。它既是文档化的规则，
 * 也是可执行的自检：运行 `node memory-rules.js` 会在临时沙箱里实跑
 * MemoryVault，断言 R1–R8 全部成立。CI / 启动健康检查可直接复用 assertRules()。
 *
 * 规则清单：
 *   R1  独立性    记忆是独立组件，init() 后立即可用，不依赖调用方单体。
 *   R2  格式      JSON 系列（jsonl 追加 + memory-index.json 快读）。
 *   R3  用户输入   完整保存，content 原样，绝不裁剪/截断。
 *   R4  LLM输出   提炼后保存：仅结构化重要字段（decision/confidence/insight），无冗余原文。
 *   R5  容量      总条数 ≤ maxEntries(默认1000)；超限按 (重要性↓, 新近度↓) 整条淘汰。
 *   R6  实时      每次写入同步落盘；退出前 flush + fsync，保证"前一秒状态"不丢。
 *   R7  继承      启动 init() 加载永久记忆；getInheritedContext('full') 让新对话继承全部。
 *   R8  强制      规则可自检：validate() 不变量 + 自检脚本，违规即报错。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { MemoryVault } = require('./memory-vault.js');

const RULES = {
  R1_independent_component: true,
  R2_json_format: true,
  R3_user_input_full: true,
  R4_llm_output_refined: true,
  R5_max_entries: 1000,
  R6_realtime_persist: true,
  R7_inherit_all: true,
  R8_enforceable: true,
};

function assert(cond, msg) {
  if (!cond) throw new Error('RULE VIOLATION: ' + msg);
}

/**
 * 在临时目录实跑 MemoryVault，逐条断言规则。
 * @returns {{passed:string[], failed:string[]}}
 */
function assertRules() {
  const passed = [];
  const failed = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mvault-'));

  try {
    const v = new MemoryVault({ dataDir: tmp, rules: { maxEntries: 50 } }); // 用小上限便于测淘汰

    // R1：init 后立即可用
    const idx = v.init();
    assert(idx && typeof idx === 'object', 'R1 init() should return index');
    passed.push('R1 独立组件：init() 返回索引且可用');

    // R3 + R2：用户输入完整保存（含超长原文，不被截断）
    const longInput = 'x'.repeat(5000);
    const uid = v.recordUser(longInput, { emotion: '喜悦', importance: 9 });
    assert(uid, 'R3 recordUser should return id');
    const userRaw = fs.readFileSync(path.join(tmp, 'user-memories.jsonl'), 'utf8');
    assert(userRaw.includes(longInput), 'R3 user content must be stored FULL, no truncation');
    assert(v._index.counts.user === 1, 'R2/R3 user count should be 1');
    passed.push('R2/R3 用户输入完整保存（5000字原样落盘，JSON格式）');

    // R4：LLM 输出提炼——只存结构化字段，不存冗余原文
    const fakeThink = { decision: { type: 'act', confidence: 0.82 } };
    const sid = v.recordSelf(fakeThink, { insight: '用户偏好简洁回答', emotion: '平静', thinkCount: 3 });
    assert(sid, 'R4 recordSelf should return id');
    const selfRaw = fs.readFileSync(path.join(tmp, 'self-memories.jsonl'), 'utf8');
    const selfEntry = JSON.parse(selfRaw.trim().split('\n').pop());
    assert('content' in selfEntry === false, 'R4 LLM output must NOT store raw `content` field');
    assert(selfEntry.decision === 'act' && selfEntry.confidence === 0.82, 'R4 structured fields retained');
    assert(selfEntry.insight === '用户偏好简洁回答', 'R4 refined insight retained');
    passed.push('R4 LLM输出提炼：仅存结构化字段 + 提炼洞察，无冗余原文');

    // R6：实时落盘——写入后未 flush 前文件已含数据
    assert(fs.existsSync(path.join(tmp, 'user-memories.jsonl')), 'R6 write should be synchronous/durable');
    v.flush();
    const indexAfterFlush = JSON.parse(fs.readFileSync(path.join(tmp, 'memory-index.json'), 'utf8'));
    assert(indexAfterFlush.savedAt, 'R6 flush should write memory-index.json');
    passed.push('R6 实时落盘 + flush：写入即耐久，索引已落盘');

    // R5：容量上限 + 整条淘汰（不裁剪单条内容）
    for (let i = 0; i < 80; i++) {
      v.recordUser('low-value-' + i, { importance: 1 }); // 大量低价值，应被淘汰
    }
    v.flush();
    const total = v._index.counts.user + v._index.counts.self;
    assert(total <= 50, `R5 total ${total} must be <= maxEntries 50`);
    // 验证高价值的 5000 字用户输入（importance 9）未被裁剪内容
    const users = v.getInheritedContext('full').filter((e) => e.source === 'user');
    const highVal = users.find((e) => e.content === longInput);
    assert(highVal && highVal.content.length === 5000, 'R5 eviction must drop LOW-value entries, never truncate HIGH-value content');
    passed.push('R5 容量上限1000(测试用50)：超限按价值整条淘汰，高价值内容不被裁剪');

    // R7：新对话继承所有记忆
    const fresh = new MemoryVault({ dataDir: tmp });
    fresh.init(); // 模拟"新对话/重启"
    const inherited = fresh.getInheritedContext('full');
    assert(inherited.length > 0, 'R7 new conversation should inherit memories');
    assert(inherited.some((e) => e.content === longInput), 'R7 inherited should include prior user memory');
    passed.push('R7 启动加载 + 新对话继承：重启后仍能读到前一秒的全部永久记忆');

    // R8：规则自检返回 ok
    const vd = v.validate();
    assert(vd.ok, 'R8 validate() should report ok: ' + JSON.stringify(vd.violations));
    passed.push('R8 规则可强制执行：validate() 自检通过');
  } catch (e) {
    failed.push(e.message);
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }

  return { passed, failed };
}

// 直接运行：打印自检报告
if (require.main === module) {
  const { passed, failed } = assertRules();
  console.log('\n=== MemoryVault 长效规则机制自检 ===');
  for (const p of passed) console.log('  ✓ ' + p);
  for (const f of failed) console.log('  ✗ ' + f);
  console.log(`\n结果：${passed.length} 通过 / ${failed.length} 失败`);
  process.exit(failed.length === 0 ? 0 : 1);
}

module.exports = { RULES, assertRules, MemoryVault };
