# HeartFlow 记忆系统架构（v11.34.1）

## 核心问题

**三个引擎写同一个文件，数据格式完全不同，导致文件损坏：**

| 引擎 | 期望格式 | 写入文件 |
|---|---|---|
| `meaningful-memory.js` | `{key → record}` 对象 | `meaningful-learned.json` |
| `mem0-memory.js` | `[{id,content...}]` 数组 | `meaningful-learned.json` |
| `UnifiedMemoryStore` | `[{...}]` 数组 | `meaningful-learned.json` |

v11.34.1 修复：每个引擎用独立文件，完全隔离。

## 修复后的文件分布

```
memory/
├── meaningful-core.json          ← MeaningfulMemory CORE（对象格式）
├── meaningful-learned.json       ← MeaningfulMemory LEARNED（对象格式）
├── meaningful-ephemeral.json     ← MeaningfulMemory EPHEMERAL（对象格式）
└── stores/
    ├── unified-core.json         ← UnifiedMemoryStore CORE（数组格式）
    ├── unified-learned.json       ← UnifiedMemoryStore LEARNED（数组格式）
    ├── unified-ephemeral.json    ← UnifiedMemoryStore EPHEMERAL（数组格式）
    └── unified-index.json         ← 索引追踪
```

## 修复措施

1. **UnifiedMemoryStore**（`memory-manager.js`）→ 改用 `unified-*.json` 文件
2. **MeaningfulMemory**（`meaningful-memory.js`）→ 已有 `meaningful-*.json` 文件（已在正确位置）
3. **Mem0Memory**（`mem0-memory.js`）→ 独立文件，无冲突

## 验证命令

```javascript
// 验证 MeaningfulMemory
node -e "
const mm = require('./src/core/meaningful-memory.js');
const mem = new mm.MeaningfulMemory();
console.log('CORE:', Object.keys(mem.core).length);
console.log('LEARNED:', Object.keys(mem.learned).length);
console.log('EPHEMERAL:', Object.keys(mem.ephemeral).length);
"

// 验证 UnifiedMemoryStore
node -e "
const { getMemoryStore } = require('./src/core/memory-manager.js');
const ms = getMemoryStore();
console.log(JSON.stringify(ms.getStats()));
"
```

## 教训

记忆系统隔离原则：
- **每个引擎用独立文件路径**，不能用共享文件
- **文件格式必须匹配期望**，不能混用
- 迁移前先查文件实际格式，再决定目标格式
