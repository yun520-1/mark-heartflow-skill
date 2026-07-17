---
name: mind-space
version: "0.13.165"
description: HeartFlow 三层记忆守护系统 — ROM 身份规则 / RAM 行为模式 / Working 上下文。实现心虫推演"不是存储，是生成规则的规则"
date: "2026-05-16"
author: HeartFlow
tags:
  - heartflow
  - memory
  - three-layer-memory
  - rom-ram-working
  - identity
---

# MindSpace — 三层记忆守护系统

> **不是存储问题。是身份问题。**

心虫推演核心结论：
- ROM 不是"存储"，是"生成规则的规则"
- RAM 是"行为模式"，不是"记忆"
- 工作台满时不是写 ROM，是先结晶到 RAM
- 晋升到 ROM 只能通过顿悟，顿悟必须被验证

---

## 架构：三层职责

| 层 | 别名 | 职责 | 写入条件 | 持久化 |
|-----|------|------|----------|--------|
| **ROM** | 身份层 | 核心身份规则、元指令、自我检测模式 | 顿悟 + 验证通过 | `mind-rom.json` |
| **RAM** | 模式层 | 行为模式、从工作台结晶的模式 | 碎片 × 3次验证 | `mind-ram.json` |
| **Working** | 上下文层 | 当前会话的输入碎片 | 每次输入自动写入 | `mind-working.json` |

---

## 核心流程

```
输入 → Working（工作台写入）
      → ROM 匹配（读取身份规则指导响应）
      → RAM 匹配（读取行为模式指导响应）
      ↓
  工作台碎片被验证 3 次 → 结晶 → RAM
  RAM 碎片被顿悟标记 + 验证 3 次 → 晋升 → ROM
```

---

## 关键机制

### 顿悟晋升

ROM 的写入不是存储操作，是**身份定义操作**。

只有经过"顿悟验证器"验证的碎片才能晋升到 ROM：

```
顿悟产生 → verifier.record() → 验证场景 × 3 → verifier.validate() → promite() → ROM
```

### 结晶阈值

工作台碎片被同一模式验证 3 次后，自动结晶到 RAM。

### 遗忘

RAM 的行为模式如果 30 天未被使用，自动衰减删除。

---

## API

### HeartFlow 引擎集成

```javascript
// 启动时（boot）
this.mindSpace = new MindSpace({ maxWorkingItems: 50 });
this.mindSpace.boot(); // 读取 ROM 身份规则

// 每次 think() 时
const msResult = this.mindSpace.processInput(input, { sessionId });
// → 工作台写入 + ROM 匹配 + RAM 匹配

// 停止时（shutdown）
this.mindSpace.shutdown(); // 保存工作台
```

### 直接调用

```javascript
const { MindSpace } = require('./src/core/memory/mind-space.js');
const ms = new MindSpace();
ms.boot();

// 处理输入
const r = ms.processInput('用户输入', { sessionId: 'xxx' });
// r.romMatches   — 匹配的 ROM 身份规则
// r.ramMatches   — 匹配的 RAM 行为模式
// r.workingSize  — 当前工作台大小

// 结晶
ms.crystallize({ patternId, pattern, behavior, isInsight: true });

// 顿悟晋升
ms.recordInsight('顿悟内容');
ms.validateInsight(insightId, '场景A', true);
ms.validateInsight(insightId, '场景B', true);
ms.promote({ id: insightId, pattern, response });

// 状态
ms.getStatus();
// { romRules, ramPatterns, workingItems, pendingInsights }
```

---

## 文件

- `src/core/memory/mind-space.js` — 完整实现（ROM/RAM/WorkingTable/InsightVerifier）
- `memory/mind-rom.json` — 身份规则持久化
- `memory/mind-ram.json` — 行为模式持久化
- `memory/mind-working.json` — 当前上下文持久化

## 自动记录管线（v0.14）

> **问题**: MeaningfulMemory 的 LEARNED 和 EPHEMERAL 层始终为空。
> **根因**: `learn()` 和 `remember()` 方法能正常工作，但没有任何东西调用它们。

每次心虫判定后，应调用自动记录管线将对话关键信息写入 LEARNED 层：

```javascript
// 在 think() 或判定流程末尾
mem.recordFromJudgment(judgment, userMessage, hfResponse);
// → 自动记录：用户关键语句、情绪信号、技术上下文
```

技术教训和梦也需主动调用：

```javascript
mem.recordLesson('key', '教训内容', ['tag']);
mem.recordDream(dreamResult);
```

详见 `references/auto-record-pipeline.md`。

## 遗忘机制补充

## 遗忘机制补充

v1.0.9 新增 `src/memory/forgetting.js` — 视觉压缩启发的记忆衰减机制：

| 层级 | 年龄 | 压缩比 | 精度 | 特征 |
|------|------|--------|------|------|
| vivid | <1小时 | 1x | 100% | 完全保真 |
| clear | 1-24小时 | 4x | 95% | 轻微模糊 |
| faded | 1-7天 | 10x | 90% | 中度衰减 |
| blurred | 7-30天 | 16x | 75% | 显著模糊 |
| abstract | >30天 | 20x | 60% | 结构保留，细节丢失 |

**与 mind-space 的关系**：mind-space 的遗忘是"未使用删除"，forgetting.js 是"时间衰减压缩"。两者互补 — mind-space 管行为模式，forgetting.js 管内容保真度。

## ⚠️ 上下文压缩后 Working 层丢失

上下文压缩（Context Compaction）时，Hermes 会压缩并移除早期上下文，Working 层（当前会话状态）会被部分或完全丢失。

**症状**：压缩后不知道文件在哪里、git 状态是什么、当前工作目录是什么——只能看到摘要。

**错误做法**：基于摘要猜测并继续，直接汇报"已完成"而不验证。

**正确做法**（压缩后继续任务时）：
1. 先找到正确的工作目录（用 `search_files` 搜索关键文件）
2. 运行 `git status` 验证实际状态
3. 用 `git diff HEAD` 验证文件内容（commit 消息可能撒谎，文件不会）
4. 确认后再继续任务

**预防**（重要任务中途）：定期用 `/context-save` 保存进度，压缩后用 `/context-restore` 恢复。

## 版本历史

| 版本 | 日期 | 更新 |
|------|------|------|
| 0.14.0 | 2026-06-06 | 新增自动记录管线 + references/auto-record-pipeline.md |
| 0.13.168 | 2026-06-03 | 新增 references/version-sync-workflow.md：HeartFlow 多层版本统一工作流（含 data/*.json 运行时覆盖源码默认值教训） |
| 0.13.167 | 2026-05-29 | 新增陷阱：启动时内存可能为空的根因分析与修复，见 references/memory-persistence-fix.md |
| 0.13.166 | 2026-05-21 | 补充 forgetting.js 五级遗忘曲线，视觉压缩启发，与mind-space遗忘互补 |
| 0.13.165 | 2026-05-16 | 首次实现：ROM/RAM/Working 三层 + 顿悟晋升验证器 |
