#!/usr/bin/env node
/**
 * 保守拆分：提取 engine-memory 方法为独立模块
 * 修复：使用原始行数组计算缩进，避免修改后索引错乱
 */

const fs = require('fs');
const path = require('path');

const SOURCE = 'src/core/heartflow.js';
const TARGET = 'src/core/engine-memory.js';
const BACKUP = SOURCE + '.bak.before-memory-extract';

const MEMORY_METHODS = [
  '_checkMemoryEnabled', '_getMemoryDir', '_initMemoryVault',
  '_shouldRecordUserMemory', '_saveUserMemory', '_extractTopics',
  '_extractKeyPoints', '_archiveUserMemories', '_searchUserMemories',
  '_memorySimilarity', '_findRelatedMemories', '_scoreMemoryImportance',
  '_saveSelfMemory', '_compactSelfMemories', '_updateContextMemory',
  '_loadContextMemory', '_getContextSummary', '_saveAllMemories',
  '_flushMemoryWrites', '_restoreLastSession', '_topK'
];

const originalContent = fs.readFileSync(SOURCE, 'utf8');
const originalLines = originalContent.split('\n');

function findMethodBounds(methodName) {
  const startLine = originalLines.findIndex(l => l.trim().startsWith(methodName + '('));
  if (startLine === -1) return null;
  
  let depth = 0;
  let foundOpen = false;
  
  for (let i = startLine; i < originalLines.length; i++) {
    for (const ch of originalLines[i]) {
      if (ch === '{') { depth++; foundOpen = true; }
      if (ch === '}') depth--;
    }
    if (foundOpen && depth === 0) {
      return { startLine, endLine: i };
    }
  }
  return null;
}

const methodBlocks = {};
for (const methodName of MEMORY_METHODS) {
  const bounds = findMethodBounds(methodName);
  if (!bounds) {
    console.log(`WARNING: ${methodName} not found`);
    continue;
  }
  
  const body = originalLines.slice(bounds.startLine + 1, bounds.endLine).join('\n');
  methodBlocks[methodName] = { 
    startLine: bounds.startLine, 
    endLine: bounds.endLine, 
    body,
    signature: originalLines[bounds.startLine].trim()
  };
  console.log(`Found ${methodName}: lines ${bounds.startLine+1}-${bounds.endLine+1} (${bounds.endLine-bounds.startLine} lines)`);
}

if (Object.keys(methodBlocks).length === 0) {
  console.error('No methods found, aborting');
  process.exit(1);
}

// 生成 engine-memory.js
const engineMemoryContent = `#!/usr/bin/env node
/**
 * engineMemory — HeartFlow 记忆子系统
 * 从 heartflow.js 提取的独立模块 (v6.0.1)
 */

const fs = require('fs');
const path = require('path');

// 记忆相关方法提取
${Object.entries(methodBlocks).map(([name, block]) => {
  return `${name}(hf${name.includes('(') ? '' : '(...args)'}) {
${block.body}
}`;
}).join('\n\n')}

module.exports = {
  ${Object.keys(methodBlocks).join(',\n  ')}
};
`;

fs.writeFileSync(TARGET, engineMemoryContent);
console.log(`\nCreated ${TARGET} (${engineMemoryContent.split('\n').length} lines)`);

// 备份原文件
fs.copyFileSync(SOURCE, BACKUP);

// 替换 heartflow.js 中的方法为 delegator
// 关键修复：使用 originalLines 计算缩进，从后往前替换避免索引偏移
const sortedMethods = Object.entries(methodBlocks).sort((a, b) => b[1].startLine - a[1].startLine);

for (const [methodName, block] of sortedMethods) {
  const paramMatch = block.signature.match(/\(([^)]*)\)/);
  const params = paramMatch ? paramMatch[1] : '';
  
  // 从原始行计算缩进
  const startIndent = originalLines[block.startLine].search(/\S/);
  const indent = ' '.repeat(startIndent);
  
  const delegator = `${indent}${methodName}(${params}) { return require('./engine-memory').${methodName}(this${params ? ', ' + params : ''}); }`;
  
  // 替换
  originalLines.splice(block.startLine, block.endLine - block.startLine + 1, delegator);
}

fs.writeFileSync(SOURCE, originalLines.join('\n'));
console.log(`Updated ${SOURCE} (${originalLines.length} lines)`);
console.log('\nDone. Run tests to verify.');
