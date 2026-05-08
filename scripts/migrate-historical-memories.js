#!/usr/bin/env node
/**
 * migrate-historical-memories.js
 * 
 * v11.22.1: 将历史记忆导入 Mem0
 * 
 * 来源:
 * - meaningful-memory-v11.5.10.json (96条)
 * - reflection-memory/reflections.json (425条)
 * - reflexion-memories/observations.json (3条)
 * - block-memory/blocks.json
 * 
 * 行为: ADD-only，不覆盖现有 mem0 记忆
 */

const fs = require('fs');
const path = require('path');

const MEM0_DIR = path.join(__dirname, '..', 'data', 'mem0');
const MEM0_FILE = path.join(MEM0_DIR, 'mem0-memories.jsonl');
const OUTPUT_FILE = path.join(MEM0_DIR, 'mem0-memories.jsonl');

const SOURCES = {
  meaningful: path.join(__dirname, '..', 'data', 'meaningful-memory-v11.5.10.json'),
  reflection: path.join(__dirname, '..', 'data', 'reflection-memory', 'reflections.json'),
  reflexionObs: path.join(__dirname, '..', 'data', 'reflexion-memories', 'observations.json'),
  block: path.join(__dirname, '..', 'data', 'block-memory', 'blocks.json'),
};

function loadMem0() {
  if (!fs.existsSync(MEM0_FILE)) return new Map();
  const lines = fs.readFileSync(MEM0_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const map = new Map();
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      map.set(item.content?.substring(0, 80), item);
    } catch (e) {}
  }
  return map;
}

function saveMem0(memories) {
  if (!fs.existsSync(MEM0_DIR)) fs.mkdirSync(MEM0_DIR, { recursive: true });
  const lines = Array.from(memories.values()).map(m => JSON.stringify({
    id: m.id,
    content: m.content,
    metadata: m.metadata || {},
    source: m.source || 'migration',
    entities: m.entities || [],
    reinforcementCount: m.reinforcementCount || 0,
    accessCount: m.accessCount || 0,
    lastAccessed: m.lastAccessed || Date.now(),
    createdAt: m.createdAt || Date.now(),
  }));
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');
}

function extractContent(item, source) {
  // meaningful: {core:{k:{value,type,reason}}, learned:{k:{value,type,reason}}}
  // We only extract the VALUE (the actual learning), not the metadata
  if (source === 'meaningful') {
    const contents = [];
    for (const layer of ['core', 'learned']) {
      if (!item[layer]) continue;
      for (const [k, v] of Object.entries(item[layer])) {
        // Extract the actual VALUE if it's a meaningful string
        if (v && typeof v === 'object' && v.value !== undefined) {
          if (typeof v.value === 'string' && v.value.length > 3) {
            contents.push(v.value);
          } else if (typeof v.value === 'boolean') {
            contents.push(`${k}: ${v.value}`);
          }
        } else if (typeof v === 'string' && v.length > 3) {
          contents.push(v);
        }
      }
    }
    return contents;
  }
  
  // reflection: {id, insight, whatHappened, outcome, ...}
  if (source === 'reflection') {
    const parts = [];
    if (item.insight) parts.push(item.insight);
    if (item.whatHappened) parts.push(item.whatHappened);
    if (item.strategyForNextTime) parts.push(`下次策略: ${item.strategyForNextTime}`);
    return parts.length > 0 ? parts : [JSON.stringify(item).substring(0, 200)];
  }
  
  // reflexion observations
  if (source === 'reflexionObs') {
    const parts = [];
    if (item.observation) parts.push(item.observation);
    if (item.plan) parts.push(`计划: ${item.plan}`);
    return parts.length > 0 ? parts : [JSON.stringify(item).substring(0, 200)];
  }
  
  // block: {id, content, memoryType, label, ...}
  if (source === 'block') {
    if (item.content) return [item.content];
    return [JSON.stringify(item).substring(0, 200)];
  }
  
  return [JSON.stringify(item).substring(0, 200)];
}

function migrate() {
  console.log('[Migration] 开始历史记忆导入...\n');
  
  const existing = loadMem0();
  const existingKeys = new Set(existing.keys());
  console.log(`  现有 mem0 记忆: ${existing.size} 条\n`);
  
  let added = 0;
  let skipped = 0;
  const newMemories = new Map(existing);
  
  for (const [source, file] of Object.entries(SOURCES)) {
    if (!fs.existsSync(file)) {
      console.log(`  ⚠️ 跳过 (不存在): ${path.basename(file)}`);
      continue;
    }
    
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];
      
      let sourceAdded = 0;
      let sourceSkipped = 0;
      
      for (const item of items) {
        const contents = extractContent(item, source);
        
        for (const content of contents) {
          if (!content || content.length < 5) continue;
          
          const key = content.substring(0, 80);
          if (existingKeys.has(key) || newMemories.has(key)) {
            sourceSkipped++;
            continue;
          }
          
          const memory = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            content,
            metadata: { migratedFrom: source, originalFile: path.basename(file) },
            source: 'migrated',
            entities: [],
            reinforcementCount: 0,
            accessCount: 0,
            lastAccessed: Date.now(),
            createdAt: item.createdAt || item.timestamp || Date.now(),
          };
          
          newMemories.set(key, memory);
          existingKeys.add(key);
          sourceAdded++;
          added++;
        }
      }
      
      console.log(`  ✅ ${path.basename(file)}: +${sourceAdded} (跳过${sourceSkipped}条重复)`);
    } catch (e) {
      console.log(`  ❌ ${path.basename(file)}: ${e.message}`);
    }
  }
  
  saveMem0(newMemories);
  console.log(`\n  总计: ${newMemories.size} 条 (新增${added}条, 原有${existing.size}条)`);
  console.log('[Migration] 完成!');
}

migrate();
