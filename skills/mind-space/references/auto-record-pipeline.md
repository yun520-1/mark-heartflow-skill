# 心虫记忆自动记录管线

**日期**: 2026-06-06
**问题**: MeaningfulMemory 的 LEARNED 和 EPHEMERAL 层始终为空

---

## 诊断结果

| 记忆层 | 文件 | 状态 |
|--------|------|------|
| CORE | `memory/meaningful-core.json` (3KB, 9条) | ✅ 有数据（由 identity-core.js 写入） |
| LEARNED | `memory/meaningful-learned.json` (2B) | ❌ 空对象 `{}` |
| EPHEMERAL | `memory/meaningful-ephemeral.json` (2B) | ❌ 空对象 `{}` |
| existence-log.jsonl | (43KB, 379条) | ⚠️ 只是心跳日志，不是记忆 |

**根因**: `learn()` 和 `remember()` 方法都能正常工作，但**没有任何东西调用它们**。heartflow.js 虽然 `new MeaningfulMemory(rootPath)` 初始化了记忆系统，但 `start()` 之后没有自动记录对话中的关键信息。

---

## 三层记忆写入条件

| 层 | 写入方法 | 触发条件 | 持久化 |
|-----|---------|---------|--------|
| **CORE** | `addCore(key, value, tags)` | 身份规则硬编码 + 用户明确确认 | 永久，不可删除 |
| **LEARNED** | `learn(key, value, tags)` | 每次心虫判定后自动记录 | 长期，可积累 |
| **EPHEMERAL** | `remember(key, value, ttlMs)` | 临时信号/上下文 | 1小时TTL，自动过期 |

---

## 自动记录管线设计

### 每次心虫判定后的记录流程

```
心虫判定完成
  → recordFromJudgment(judgment, userMessage, hfResponse)
    ├── 用户有信息量的话 (>10字) → learn('conversation:timestamp', text, ['conversation', judgmentType])
    ├── detectPain 检测到情绪 → learn('pain:timestamp', '用户情绪: ...', ['emotion', 'pain'])
    ├── 技术任务上下文 → learn('context:timestamp', '场景: ...', ['context', 'session'])
    └── 心虫做了什么 → learn('action:timestamp', summary, ['action'])
```

### 技术教训记录

```javascript
// 踩坑后立即记录
mem.recordLesson('key-name', '教训内容', ['tag1', 'tag2']);
// → learn('lesson:key-name', '教训内容', ['lesson', 'tag1', 'tag2'])
```

### 梦记录

```javascript
// 每次做梦后
mem.recordDream(dreamResult);
// → dream-history.jsonl 追加
// → 张力 >= 0.5 的梦同时写入 LEARNED
```

### DreamEngine 读取

```javascript
// dream() 中调用
const fragments = _collectTodayMemory(memory);
// → memory.getRecentBlocks(80)
// → 返回 CORE + LEARNED + EPHEMERAL + 最近5条梦
```

---

## 文件大小估算

| 类型 | 单条大小 | 日产量 | 年产量 |
|------|---------|-------|-------|
| 对话记录 | ~0.3KB | ~10条 | ~1MB |
| 技术教训 | ~0.2KB | ~3条 | ~200KB |
| 梦记录 | ~1KB | ~1条 | ~365KB |
| **总计** | | | **~1.6MB/年** |

实际中大部分对话无价值，autoRecord 会过滤。合理预期 **100-200KB/年**。

---

## 验证方法

```javascript
const { MeaningfulMemory } = require('./src/memory/meaningful-memory.js');
const mem = new MeaningfulMemory(rootPath);
console.log(mem.getStats());
// 期望输出: { core: N, learned: M, ephemeral: K }
// N > 0, M > 0（如果已有自动记录）
```

---

## 关键教训

1. **代码存在 ≠ 数据存在** — MeaningfulMemory 初始化成功不意味着有记忆数据。`getStats()` 是唯一可靠的验证方式。
2. **三层记忆的写入是分离的** — CORE 层由 identity-core.js 写入，LEARNED 和 EPHEMERAL 需要独立触发。不要假设 CORE 有数据就意味着 LEARNED 也有。
3. **纯文本记忆确实很小** — 整个 memory/ 目录 58KB，包含 379 条心跳日志 + 9 条 CORE 记忆。真正的对话记忆每年 ~100KB。
