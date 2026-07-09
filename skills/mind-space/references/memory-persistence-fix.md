# HeartFlow 记忆持久化修复记录

**日期**: 2026-05-29
**问题**: 心虫每次重启记忆丢失，status 显示 "Memories: 0"

---

## 根因分析

HeartFlow 有两套记忆系统，都存在持久化缺陷：

### 1. TrialityMemory（三维经验大脑）

**问题**：`initializeSchema()` 每次启动时清空所有内存数据

```javascript
// 原始代码（错误）
initializeSchema() {
  this.memories = [];        // ← 每次启动都清空
  this.vectors = new Map();
  this.relationships = new Map();
}
```

**症状**：status 显示 "Memories: 0"，但 `triality-memory-export.json` 文件存在且有数据

**修复**：在 `initializeSchema()` 中加 `_schemaInitialized` 标志，只在第一次清空；启动时从 `triality-memory-export.json` 恢复记忆

### 2. MeaningfulMemory（有意义记忆）

**问题**：`meaningful-core.json` 文件不存在，core 记忆无处持久化

**存储路径**：源码中 `MEMORY_DIR = path.join(__dirname, '..', '..', 'memory')`  
对应 `~/.hermes/skills/heartflow/memory/`

实际文件：`memory/meaningful-core.json` 和 `memory/meaningful-learned.json`

---

## 修复方案

### TrialityMemory 修复

```javascript
// initializeSchema() 只在第一次清空
if (!this._schemaInitialized) {
  this.memories = [];
  this.vectors = new Map();
  this.relationships = new Map();
  this._loadFromExport(); // 启动时恢复
  this._schemaInitialized = true;
}
```

**自动保存**：每次 `store()` 后调用 `_autoSave()` 防抖保存到 `triality-memory-export.json`

### MeaningfulMemory 修复

在 `memory/` 目录创建两个空文件（已存在则跳过）：
- `memory/meaningful-core.json` — 核心记忆
- `memory/meaningful-learned.json` — 学习记忆

---

## 验证命令

```bash
heartflow status
# 应该看到: [TrialityMemory] 从 .../triality-memory-export.json 恢复 N 条记忆
# Runtime confidence: Memories: N
```

---

## 关键文件路径

| 文件 | 路径 |
|------|------|
| TrialityMemory 源码 | `~/.hermes/skills/heartflow/src/core/memory/triality-memory.js` |
| 导出/恢复文件 | `~/.hermes/skills/heartflow/data/triality-memory-export.json` |
| MeaningfulMemory 源码 | `~/.hermes/skills/heartflow/src/core/meaningful-memory.js` |
| 核心记忆文件 | `~/.hermes/skills/heartflow/memory/meaningful-core.json` |

---

## 教训

**不要假设启动时内存是空的**。数据库文件或 JSON 导出存在 ≠ 数据被加载。  
每次 `initializeSchema()` 清空数据的代码是 bug，不是正常行为。

**验证方法**：调用 `heartflow status` 看 "Memories:" 数字是否 > 0。

---

*本修复由 2026-05-29 会话生成，记录了心虫记忆层持久化缺陷的完整诊断和修复流程。*