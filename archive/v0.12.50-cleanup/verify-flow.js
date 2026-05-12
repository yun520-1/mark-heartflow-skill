/**
 * HeartFlow 完整流程验证脚本
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  HeartFlow 记忆系统整体验证');
console.log('========================================\n');

// 加载各模块
const { ImportanceScorer, ImportanceAwareStrategy, AutoCompactionEngine } = require('./auto-compaction-engine.js');
const { PermanentMemoryArchiver } = require('./permanent-memory-archiver.js');
const { RecallTrigger } = require('./recall-trigger.js');

// 1. 重要性评分
console.log('【1】ImportanceScorer 评分验证');
const scorer = new ImportanceScorer();
const testMemories = [
  { key: 'test1', source: 'user_correction', importance: 100 },
  { key: 'test2', source: 'system' },
  { key: 'test3', source: 'assistant', accessCount: 5, selfVerifyScore: 0.9 },
  { key: 'test4', source: 'error_pattern', timestamp: Date.now() - 3600000 },
];
const scored = scorer.scoreBatch(testMemories);
console.log('  评分结果:');
scored.forEach(item => {
  console.log('    ' + item.memory.key + ': ' + item.score);
});

// 2. ImportanceAwareStrategy 压缩
console.log('\n【2】ImportanceAwareStrategy 压缩验证');
const ace = new AutoCompactionEngine();
const tokenizer = ace.tokenizer;
const strategy = new ImportanceAwareStrategy({ keepLatest: 2, keepMinScore: 80 });

const messages = [
  { role: 'system', content: '系统提示' },
  { role: 'user', content: '重要消息1：高优先级内容' },
  { role: 'user', content: '重要消息2：高优先级' },
  { role: 'user', content: '普通消息1：低分内容哈哈哈嘻嘻嘻' },
  { role: 'user', content: '普通消息2：低分内容啦啦啦' },
  { role: 'user', content: '普通消息3：低分内容呵呵呵' },
  { role: 'user', content: '普通消息4：低分内容哦哦哦' },
  { role: 'user', content: '普通消息5：低分内容嗯嗯嗯' },
  { role: 'user', content: '最近消息1（应该保留）' },
  { role: 'user', content: '最近消息2（应该保留）' },
];

const result = strategy.compress(messages, 300, tokenizer);
console.log('  压缩结果:');
console.log('    compacted:', result.compacted.length, '条');
console.log('    dropped:', result.dropped);
console.log('    droppedMessages:', result.droppedMessages?.length || 0);
console.log('    summary:', result.summary.substring(0, 60));

// 3. 归档到永久记忆
console.log('\n【3】PermanentMemoryArchiver 归档验证');
const archiver = new PermanentMemoryArchiver();
let archiveResult = { stored: 0, keys: [] };

if (result.droppedMessages && result.droppedMessages.length > 0) {
  archiveResult = archiver.archive(result.droppedMessages, {
    level: 'learned',
    source: 'verification-test',
  });
  console.log('  归档结果:');
  console.log('    stored:', archiveResult.stored, '条');
  console.log('    keys:', archiveResult.keys.slice(0, 3).join(', '), '...');

  // 召回验证
  console.log('\n  召回验证:');
  const recalled = archiver.recall(archiveResult.keys[0]);
  console.log('    召回成功:', !!recalled);
  console.log('    key:', recalled?.key);
  console.log('    type:', recalled?.type);

  // 搜索验证
  const searchResults = archiver.search('高优先级', 5);
  console.log('    搜索"高优先级"结果:', searchResults.length, '条');
}

// 4. RecallTrigger 触发验证
console.log('\n【4】RecallTrigger 触发验证');
const trigger = new RecallTrigger();
const check = trigger.check({
  userMessage: '高优先级内容如何处理？',
  currentTokens: 85000,
  maxTokens: 100000,
  archivedTopics: ['高优先级', 'Git', 'deepseek'],
});
console.log('  话题触发检测:');
console.log('    shouldRecall:', check.shouldRecall);
console.log('    matchedTopics:', check.triggers[0]?.matchedTopics);
console.log('    recallQuery:', check.recallQuery);

if (check.shouldRecall) {
  const recall = trigger.executeRecall({ query: check.recallQuery, topK: 3 });
  console.log('  召回结果:');
  console.log('    成功:', recall.success);
  console.log('    找到:', recall.totalFound, '条');

  const injection = trigger.formatForInjection(recall);
  console.log('  注入文本预览:', injection.substring(0, 100));
}

// 5. 端到端流程
console.log('\n【5】端到端流程验证');
const e2eMessages = [
  { role: 'system', content: '你是HeartFlow助手' },
  { role: 'user', content: '用户问题：deepseek的API key无效了怎么办？' },
  { role: 'assistant', content: '改用cn-web-search搜索论文，不需要API key' },
  { role: 'user', content: '普通消息1呵呵呵' },
  { role: 'user', content: '普通消息2哈哈哈' },
  { role: 'user', content: '普通消息3嘻嘻嘻' },
  { role: 'user', content: '普通消息4喔喔喔' },
  { role: 'user', content: '最近消息1' },
  { role: 'user', content: '最近消息2' },
];

// Step 1: 压缩
const ias = new ImportanceAwareStrategy({ keepLatest: 2, keepMinScore: 80 });
const e2eResult = ias.compress(e2eMessages, 200, tokenizer);
console.log('  压缩: dropped=' + e2eResult.dropped + ', droppedMessages=' + (e2eResult.droppedMessages?.length || 0));

// Step 2: 归档
let e2eArchive = { stored: 0, keys: [] };
if (e2eResult.droppedMessages?.length > 0) {
  e2eArchive = archiver.archive(e2eResult.droppedMessages, { level: 'learned', source: 'e2e-test' });
  console.log('  归档: stored=' + e2eArchive.stored);
}

// Step 3: 召回
const e2eTrigger = new RecallTrigger();
const e2eCheck = e2eTrigger.check({
  userMessage: 'deepseek key无效了怎么办？',
  archivedTopics: ['deepseek', 'cn-web-search', 'API'],
});
console.log('  触发: shouldRecall=' + e2eCheck.shouldRecall + ', query=' + e2eCheck.recallQuery);

let e2eRecall = { success: false, totalFound: 0, memories: [] };
if (e2eCheck.shouldRecall) {
  e2eRecall = e2eTrigger.executeRecall({ query: e2eCheck.recallQuery, topK: 5 });
  console.log('  召回: found=' + e2eRecall.totalFound);
}

// 6. 版本一致性
console.log('\n【6】版本一致性检查');
const heartflowRoot = path.join(__dirname, '..', '..');
const versionFile = path.join(heartflowRoot, 'VERSION');
const pkgFile = path.join(heartflowRoot, 'package.json');
const skillFile = path.join(heartflowRoot, 'SKILL.md');

const version = fs.readFileSync(versionFile, 'utf-8').trim();
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
const skill = fs.readFileSync(skillFile, 'utf-8');
const skillVersion = skill.match(/version:\s*v?([\d.]+)/)?.[1] || '未找到';

console.log('  VERSION:', version);
console.log('  package.json:', pkg.version);
console.log('  SKILL.md:', skillVersion);
console.log('  ' + (version === pkg.version && version === skillVersion ? '✅ 版本一致' : '❌ 版本不一致'));

// 汇总
console.log('\n========================================');
console.log('  验证结果汇总');
console.log('========================================');
const passed =
  scored.length === 4 &&
  result.dropped > 0 &&
  archiveResult.stored > 0 &&
  e2eCheck.shouldRecall &&
  e2eRecall.totalFound > 0 &&
  version === pkg.version &&
  version === skillVersion;

if (passed) {
  console.log('  ✅ 全部验证通过！');
} else {
  console.log('  ⚠️ 部分验证未通过:');
  console.log('    评分:', scored.length === 4 ? '✅' : '❌');
  console.log('    压缩:', result.dropped > 0 ? '✅' : '❌');
  console.log('    归档:', archiveResult.stored > 0 ? '✅' : '❌');
  console.log('    触发:', e2eCheck.shouldRecall ? '✅' : '❌');
  console.log('    召回:', e2eRecall.totalFound > 0 ? '✅' : '❌');
  console.log('    版本:', version === pkg.version && version === skillVersion ? '✅' : '❌');
}
