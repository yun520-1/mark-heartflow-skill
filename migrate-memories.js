const fs = require('fs');

console.log('=== 迁移所有散落的记忆 ===\n');

// 读取所有记忆源
const being = JSON.parse(fs.readFileSync('memory/being-state.json', 'utf-8'));
const memStore = JSON.parse(fs.readFileSync('memory/memory-store.json', 'utf-8'));
const learned = JSON.parse(fs.readFileSync('memory/meaningful-learned.json', 'utf-8'));

console.log('迁移前 meaningful-learned:', Object.keys(learned).length, '条\n');

// 收集要迁移的记忆
const toMigrate = [];

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}

function existsInLearned(content) {
  if (!content) return false;
  const snippet = content.substring(0, 30);
  return Object.values(learned).some(l => {
    const v = l.value || '';
    const r = l.reason || '';
    return v.includes(snippet) || r.includes(snippet);
  });
}

// 1. being-state.json uniqueMoments
if (being.existence && being.existence.uniqueMoments) {
  console.log('从 being-state.json uniqueMoments 迁移:');
  for (const m of being.existence.uniqueMoments) {
    const content = m.thought || m.reflection;
    if (!content) continue;
    if (existsInLearned(content)) {
      console.log('  跳过(已存在):', content.substring(0, 40));
      continue;
    }
    const key = 'being_' + hashCode(content).toString(36);
    toMigrate.push({
      key,
      value: content,
      type: 'uniqueMoment',
      reason: '从 being-state.json 迁移',
      timestamp: m.time || Date.now(),
      source: 'being-state',
      level: 'learned',
    });
    console.log('  迁移:', content.substring(0, 40));
  }
}

// 2. memory-store.json memories
if (memStore.memories) {
  console.log('\n从 memory-store.json 迁移:');
  for (const m of memStore.memories) {
    if (!m.content) continue;
    if (existsInLearned(m.content)) {
      console.log('  跳过(已存在):', m.content.substring(0, 40));
      continue;
    }
    toMigrate.push({
      key: m.id || 'mem_' + hashCode(m.content).toString(36),
      value: m.content,
      type: m.layer || 'memory',
      reason: '从 memory-store.json 迁移',
      timestamp: m.createdAt || m.timestamp || Date.now(),
      source: 'memory-store',
      level: 'learned',
    });
    console.log('  迁移:', m.content.substring(0, 40));
  }
}

// 执行迁移
console.log('\n=== 写入结果 ===');
for (const item of toMigrate) {
  learned[item.key] = {
    key: item.key,
    value: item.value,
    type: item.type,
    reason: item.reason,
    timestamp: item.timestamp,
    source: item.source,
    level: item.level,
    importance: 70,
    migrated: true,
  };
}

console.log('新增:', toMigrate.length, '条');
console.log('总计:', Object.keys(learned).length, '条');

// 写入
fs.writeFileSync('memory/meaningful-learned.json', JSON.stringify(learned, null, 2));
console.log('\n已写入 memory/meaningful-learned.json');
