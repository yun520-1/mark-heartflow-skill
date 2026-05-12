# HeartFlow 记忆压缩哲学 v11.27.0

> 来源: 2026-05-09 记忆增强升级会话

## 核心原则

### 1. 不要人为分层，用重要性评分

**错误思路**: 创建 hot/warm/cold 物理分层目录
**正确思路**: 用多维度评分决定记忆去留

```javascript
score = sourceWeight    // user_correction=100, decision_verified=85, error_pattern=80...
             + recencyBonus   // 越新越高
             + accessBonus    // 访问次数
             + verificationBonus  // selfVerify × 20
```

分层是人为规则，重要性评分才是本质。

### 2. 压缩不是删除，是归档

**错误思路**: 压缩 → dropped → 生成摘要 → 丢弃 ❌
**正确思路**: 压缩 → dropped → 提取关键信息 → 存入 permanent memory → 可召回 ✅

```
meaningful-memory 应该是压缩输出的接收者，而不是垃圾桶
```

### 3. 压缩必须返回 droppedMessages

`ImportanceAwareStrategy.compress()` 必须返回 `droppedMessages` 数组，
供 `PermanentMemoryArchiver.archive()` 处理。

```javascript
// ImportanceAwareStrategy 返回值必须包含
{
  compacted,
  summary,
  dropped,           // 数量
  droppedMessages,   // 实际消息数组，供归档
  stats: { ... }
}
```

## 技术教训

### `undefined < N === false` — JavaScript 比较陷阱

当消息没有 `metadata._importanceScore` 时，分数为 `undefined`：
- `undefined < 60` → `false`
- 结果：所有没有显式 metadata 的消息都被判定为"高分"，永不压缩

**修复**: 在 `ImportanceScorer.score()` 中处理 `undefined`：
```javascript
// 确保 undefined 转为 0
const score = this.score({
  ...memoryData,
  importanceScore: memoryData.importanceScore ?? 0,
  accessCount: memoryData.accessCount ?? 0,
  selfVerifyScore: memoryData.selfVerifyScore ?? null,
});
```

### keepMinScore 阈值设置

默认值 `keepMinScore=60` 对于 `recencyBonus=30` 的消息永远不够低。
大部分消息会落在 60-90 分范围。

**调整策略**:
- 要压缩大部分消息: `keepMinScore=95`
- 要保留大部分消息: `keepMinScore=50`

## 架构位置

```
src/core/
  importance-scorer.js          # 多维度评分
  importance-aware-strategy.js  # 基于评分的压缩
  permanent-memory-archiver.js # 归档到 permanent memory
  auto-compaction-engine.js     # 集成上述模块
```

## 相关文件

- `memory/meaningful-learned.json` — 归档记忆存储
- `memory/index.md` — 记忆索引（按 importance 排序）
