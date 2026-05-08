# Session Persistence & Context Manager — Architecture Reference

## 核心问题

> 如何做到每次长时间没有对话，把上下文自动保存到固定位置，下次启动对话，自动注入上下文，压缩上下文时，是保存到长时间记忆去，不是进行删除？

---

## 答案架构（v11.22.6）

### 数据流

```
messages.jsonl         ← 所有消息追加（ADD-only，不删除）
sessions.jsonl          ← 会话快照（定期保存）
longterm-memory.jsonl   ← 提炼的长期记忆（跨会话）
meta.json               ← 元数据（快速读取）
```

### 保存时机

| 触发条件 | 动作 |
|---------|------|
| 累积 20 条消息 | 批量写入 `messages.jsonl` |
| 超过 5 分钟 | 强制 flush buffer |
| 30 分钟无对话 | 触发 `checkIdleAndSave()` |
| 进程退出 | `saveAndDistill()` |

### 空闲保存流程

```
isIdle() == true
  ↓
flushBuffer()  →  所有缓冲消息写入 messages.jsonl
  ↓
saveSessionSnapshot()  →  写入 sessions.jsonl
  ↓
distillToLongTermMemory()  →  提炼到 longterm-memory.jsonl（不是删除）
  ↓
startNewSession()  →  重置 sessionId，开始新会话
```

### 启动注入流程

```javascript
const ctx = require('./context-manager.js');
const { injectableContext } = ctx.buildStartupContext();
// → 上次会话时间 + 消息数 + 长期记忆摘要
// → 直接拼接到 system prompt
```

---

## GitHub 源码参考

### LOOM (outfox/loom) — Section 架构

**关键代码**：`src/loom/context.py`

```
Section 分类：
- foundation: 基础上下文
- focus: 重点
- topic: 主题
- convo: 对话历史
- step: 临时步骤（编译后清空）
- attention: 注意事项
```

核心方法：
```python
def remember(self, entry):
    # 将临时entry提升到convo长期保留
    self.convo.add(entry)

def compile(self):
    # 按顺序编译所有section
    # step section 编译后自动清空（volatile）

def to_messages():
    # 转换为chat API格式
    # 支持 Anthropic cache_breakpoints
```

### Mem0 (mem0ai/mem0 ⭐55021) — 持久化模式

**关键代码**：`mem0/memory/storage.py`

```python
class SQLiteManager:
    def __init__(self, db_path):
        self.connection = sqlite3.connect(db_path, check_same_thread=False)
        self._lock = threading.Lock()
        self._create_history_table()   # 变更历史追踪
        self._create_messages_table()   # 消息持久化

    def add_history(self, memory_id, old_memory, new_memory, event):
        # 记录每次变更，用于审计和回溯
```

**关键模式**：
- `session_scope`: 通过 `user_id & agent_id & run_id` 构建会话范围
- `history`: 每次变更都记录 old_memory → new_memory
- `_migrate_history_table()`: 数据库迁移机制

### Honcho (elkimek/honcho-self-hosted) — 混合记忆

**配置**：`honcho-config.json`

```json
{
  "memoryMode": "hybrid",
  "writeFrequency": "async",
  "dialecticReasoningLevel": "low",
  "dialecticMaxChars": 600,
  "recallMode": "hybrid",
  "sessionStrategy": "per-directory"
}
```

---

## 提炼原则（不是删除）

```javascript
extractKeyContent(messages)
  → version:    版本号（v11.22.6）
  → gitOps:     Git 操作（commit, push, branch）
  → commands:   命令（npm, pip, node）
  → decisions:  决策（最重要）
  → problems:   问题/错误
  → paths:      路径操作
```

**核心原则**：消息从不删除，只提炼精华保存。

---

## 与旧架构对比

| 组件 | v11.22.5 (旧) | v11.22.6 (新) |
|------|--------------|--------------|
| 消息存储 | 分散 | **统一 buffer + 批量** |
| 持久化 | 文件追加 | **带 history 追踪** |
| 空闲检测 | 30分钟固定 | **30分钟 + 5分钟批量** |
| 长期记忆 | 基础提取 | **结构化6类提炼** |
| 启动注入 | 简单 | **完整上下文格式化** |
| 架构参考 | 概念设计 | **LOOM + Mem0 + Honcho** |

---

## 使用示例

```javascript
const ctx = require('./context-manager.js');

// === 对话中 ===
ctx.saveUserMessage('我想升级 HeartFlow');
ctx.saveAssistantMessage('好的，开始升级');

// === 主循环检查空闲 ===
if (ctx.isIdle()) {
  ctx.checkIdleAndSave(); // 保存 + 提炼 + 开始新会话
}

// === 启动时注入 ===
const { injectableContext } = ctx.buildStartupContext();
const finalPrompt = systemPrompt + '\n\n' + injectableContext;

// === 搜索长期记忆 ===
const results = ctx.searchLongTermMemories('版本升级');
```
