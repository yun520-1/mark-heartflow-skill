#!/usr/bin/env node
/**
 * auto-verify.js - HeartFlow 升级后自动验证
 * 
 * 在每次升级推送前自动运行，确保记忆系统正常工作
 * 
 * 使用方式: node auto-verify.js [--no-push]
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'context-manager');
const CTX_PATH = path.join(__dirname, 'context-manager.js');

const args = process.argv.slice(2);
const NO_PUSH = args.includes('--no-push');

let passed = 0;
let failed = 0;

function log(msg, type = 'info') {
  const icons = { pass: '✅', fail: '❌', info: '  ', warn: '⚠️' };
  console.log(`${icons[type] || '  '} ${msg}`);
}

function assert(condition, msg) {
  if (condition) {
    log(msg, 'pass');
    passed++;
  } else {
    log(msg, 'fail');
    failed++;
  }
}

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  HeartFlow 自动验证');
  console.log('══════════════════════════════════════════\n');

  // 1. 清理测试数据
  console.log('[1/6] 清理测试数据...');
  ['messages.jsonl','sessions.jsonl','longterm-memory.jsonl','meta.json'].forEach(f => {
    try { fs.unlinkSync(path.join(DATA_DIR, f)); } catch {}
  });
  log('清理完成', 'info');

  // 2. 加载模块
  console.log('\n[2/6] 加载 context-manager.js...');
  delete require.cache[require.resolve(CTX_PATH)];
  const ctx = require(CTX_PATH);
  log('模块加载成功', 'pass');

  // 3. 保存对话
  console.log('\n[3/6] 保存测试对话...');
  ctx.saveUserMessage('我想升级到 HeartFlow v11.22.7');
  ctx.saveAssistantMessage('好的，开始升级到 v11.22.7');
  ctx.saveUserMessage('升级完成了吗？');
  ctx.saveAssistantMessage('升级完成');
  ctx.flushBuffer();
  
  const stats = ctx.getStats();
  assert(stats.totalMessages === 4, `对话保存: ${stats.totalMessages} 条`);
  assert(stats.bufferSize === 0, '缓冲已 flush');

  // 4. 触发 idle 保存
  console.log('\n[4/6] 触发 idle 保存...');
  const sessionBefore = stats.currentSession;
  const snapshot = ctx.saveAndDistill();
  const sessionAfter = ctx.getStats().currentSession;
  
  assert(snapshot !== null, '快照已保存');
  assert(snapshot?.messageCount === 4, '快照消息数正确');
  assert(snapshot?.keyContent?.versions?.includes('v11.22.7'), '版本号正确提取');
  assert(sessionBefore !== sessionAfter, 'Session 已切换');

  // 5. 重启验证
  console.log('\n[5/6] 重启并加载上下文...');
  delete require.cache[require.resolve(CTX_PATH)];
  const ctx2 = require(CTX_PATH);
  const startup = ctx2.buildStartupContext();
  
  assert(startup !== null, '启动上下文存在');
  assert(startup.context.includes('v11.22.7'), '上下文包含版本号');
  
  const ltm = ctx2.loadLongTermMemories(10);
  assert(ltm.length > 0, '长期记忆存在');
  assert(ltm[0].content === 'v11.22.7', '长期记忆内容正确');

  // 6. 新对话延续
  console.log('\n[6/6] 新对话延续...');
  ctx2.saveUserMessage('测试消息');
  ctx2.flushBuffer();
  const msgs = ctx2.loadRecentMessages(10);
  assert(msgs.length === 5, '新对话正常延续');

  // 结果
  console.log('\n══════════════════════════════════════════');
  console.log(`  验证结果: ${passed} 通过, ${failed} 失败`);
  console.log('══════════════════════════════════════════');

  if (failed > 0) {
    console.log('\n❌ 验证失败，禁止推送！\n');
    process.exit(1);
  }

  console.log('\n✅ 全部验证通过！\n');
  
  // 如果需要推送到 GitHub（由 upgrade-and-push.js 统一处理）
  // 此脚本只负责验证，返回 0 表示成功
  
  process.exit(0);
}

main().catch(e => {
  console.error('验证出错:', e.message);
  process.exit(1);
});
