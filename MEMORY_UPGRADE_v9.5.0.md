# 记忆宫殿向量化升级 - HeartFlow v9.5.0

## 概述

将记忆宫殿从 JSON 文件存储升级为**向量数据库**存储，并在消息通道添加**记忆检索钩子**和**记忆存储钩子**，实现：

1. **语义检索** - 基于向量相似度，而非关键词匹配
2. **自动记忆** - 收到消息自动检索，回复后自动存储
3. **情感过滤** - 支持情感标签、强度、时间衰减
4. **独立模块** - 不依赖 xinchong_guardian 本地插件

---

## 核心组件

### 1. memory_palace_v2.py - 向量版记忆宫殿

**存储后端：**
- **ChromaDB** (首选) - 持久化向量数据库
- **SimpleVectorStore** (回退) - 内存向量模拟（无依赖）

**房间结构（保持 Method of Loci）：**
| 房间 | 用途 | 容量 |
|-----|------|------|
| 客厅 (living) | 日常对话、最近记忆 | 9 |
| 书房 (study) | 知识、技能、概念 | 9 |
| 厨房 (kitchen) | 情感、感受、人际关系 | 9 |
| 花园 (garden) | 创造性想法、顿悟、梦想 | 9 |
| 地下室 (basement) | 深层记忆、习惯、模式 | 9 |

**核心方法：**
```python
palace = MemoryPalace()

# 存储记忆（向量化）
palace.store(
    content="记忆内容",
    room="living",
    emotion="joy",
    intensity=7,
    themes=["工作", "成就"]
)

# 检索记忆（语义搜索）
memories = palace.recall(
    query="工作压力大",
    room=None,
    emotion=None,
    limit=5,
    time_window=7  # 天
)

# 行走宫殿
walk = palace.walk()
```

---

### 2. memory_hooks.py - 记忆钩子系统

**独立模块**，不依赖任何插件，直接集成到 HeartFlow 核心。

**两个钩子：**

#### on_message_received - 收到消息后检索记忆

```python
hooks = MemoryHooks()

context = hooks.on_message_received("用户消息")

# 返回:
{
    "user_input": "用户消息",
    "memories_retrieved": [...],  # 检索到的记忆
    "context_enhanced": "【相关记忆】...",
    "recall_stats": {...}
}
```

#### on_response_sent - LLM 回复后存储记忆

```python
result = hooks.on_response_sent(
    user_input="用户消息",
    llm_response="LLM 回复",
    emotion="sadness",
    intensity=6,
    themes=["情感", "压力"]
)

# 自动判断是否需要存储
# 自动选择房间
# 自动计算优先级
```

**配置：**
```python
hooks = MemoryHooks(
    auto_recall=True,   # 自动检索
    auto_store=True,    # 自动存储
    config={
        "recall_limit": 5,       # 检索数量
        "time_window": 7,        # 时间窗口（天）
        "min_intensity": 3,      # 最小存储强度
        "auto_connect": True,    # 自动连接相关记忆
        "emotion_threshold": 6   # 情感强度阈值
    }
)
```

---

### 3. heartflow_core.py - HeartFlow 核心集成

**v9.5.0 新增：**
- 导入 `MemoryHooks`
- 初始化 `self.memory_hooks`
- 在 `process()` 中调用两个钩子

**流程：**
```
用户输入
  ↓
on_message_received (检索记忆)
  ↓
添加到上下文 → 所有引擎处理
  ↓
生成决策
  ↓
on_response_sent (存储记忆)
  ↓
返回结果
```

**代码示例：**
```python
from heartflow_core import HeartFlow

hf = HeartFlow()

# 处理消息（自动检索 + 存储记忆）
result = hf.process("工作压力好大")

# 记忆系统自动工作
stats = hf.memory_hooks.stats()
```

---

## 使用方式

### 方式 1: 通过 HeartFlow 核心

```python
from heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("今天心情不错")

# 查看记忆统计
stats = hf.memory_hooks.stats()
print(f"总记忆数：{stats['total_memories']}")
```

### 方式 2: 直接使用记忆钩子

```python
from memory_hooks import MemoryHooks

hooks = MemoryHooks()

# 收到消息
context = hooks.on_message_received("用户消息")
print(f"检索到 {len(context['memories_retrieved'])} 条记忆")

# 回复后
result = hooks.on_response_sent(
    "用户消息",
    "LLM 回复",
    emotion="joy",
    intensity=8
)
print(f"存储成功：{result['stored']}")
```

### 方式 3: CLI 命令

```bash
# 存储记忆
python3 memory_hooks.py store \
  --input "工作压力大" \
  --response "建议休息" \
  --emotion "sadness" \
  --intensity 6

# 检索记忆
python3 memory_hooks.py recall \
  --query "工作压力"

# 行走宫殿
python3 memory_hooks.py walk

# 统计
python3 memory_hooks.py stats
```

---

## 向量数据库依赖

### 安装 ChromaDB（推荐）

```bash
pip install chromadb
```

### 无 ChromaDB（自动回退）

如果不安装 ChromaDB，系统自动使用 `SimpleVectorStore`（基于文本哈希的模拟向量）。

**区别：**
| 特性 | ChromaDB | SimpleVectorStore |
|-----|----------|-------------------|
| 语义搜索 | ✅ 真向量 | ⚠️ 词重叠模拟 |
| 持久化 | ✅ 磁盘 | ✅ JSON 索引 |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 依赖 | chromadb | 无 |

---

## 记忆存储策略

### 自动判断是否存储

满足以下任一条件即存储：
1. 有明确情感标签
2. 情感强度 ≥ 6
3. 包含关键词（记住、重要、决定、目标等）
4. 回复长度 > 200 字符

### 自动选择房间

| 情感/内容 | 房间 |
|---------|------|
| joy, love, gratitude | 厨房 (kitchen) |
| sadness, anger, fear | 地下室 (basement) |
| surprise, curiosity | 花园 (garden) |
| 知识、学习、技能 | 书房 (study) |
| 创意、想法、灵感 | 花园 (garden) |
| 其他 | 客厅 (living) |

### 时间衰减

```python
decay = 0.5 ** (days / 7)  # 每 7 天衰减 50%
```

### 最终分数

```python
final_score = (1.0 - distance) * decay * (intensity / 10)
# 向量相似度 × 时间衰减 × 情感强度
```

---

## 文件结构

```
~/.hermes/skills/mark-heartflow/scripts/
├── heartflow_core.py       # HeartFlow 核心（已集成记忆钩子）
├── memory_hooks.py         # 记忆钩子系统（新增）
├── memory_palace_v2.py     # 向量版记忆宫殿（新增）
└── memory_palace.py        # 旧版 JSON 记忆宫殿（保留兼容）

~/.hermes/skills/mark-heartflow/memory/palace/
├── chroma_db/              # ChromaDB 持久化数据（如果安装）
├── metadata_index.json     # 元数据索引
└── export_*.json           # 导出文件
```

---

## 测试

```bash
cd ~/.hermes/skills/mark-heartflow/scripts

# 运行完整测试
python3 << 'EOF'
from heartflow_core import HeartFlow

hf = HeartFlow()

# 测试对话
result = hf.process("工作压力好大，感觉好累")
print(f"决策：{result.decision}")

# 查看记忆统计
stats = hf.memory_hooks.stats()
print(f"总记忆：{stats['total_memories']}")
print(f"会话消息：{stats['current_session']['message_count']}")
EOF
```

---

## 版本历史

- **v9.5.0** (2026-04-18) - 向量化升级
  - ✅ 向量数据库存储（ChromaDB）
  - ✅ 消息通道记忆钩子
  - ✅ 语义检索 + 情感过滤
  - ✅ 时间衰减 + 自动连接
  - ✅ 独立模块（不依赖本地插件）

- **v9.4.7** - 上一版本（JSON 文件存储）

---

## 常见问题

### Q: 为什么不使用 xinchong_guardian 插件？

A: xinchong_guardian 是本地自定义插件，GitHub 用户安装时没有。记忆钩子作为独立模块，直接集成到 HeartFlow 核心，所有用户都能使用。

### Q: ChromaDB 安装失败怎么办？

A: 系统自动回退到 `SimpleVectorStore`，无需额外依赖。建议安装 ChromaDB 以获得更好的语义搜索效果。

### Q: 记忆数据存储在哪里？

A: `~/.hermes/skills/mark-heartflow/memory/palace/`
- ChromaDB: `chroma_db/` 目录
- 元数据索引：`metadata_index.json`

### Q: 如何导出记忆？

A: 
```python
from memory_palace_v2 import MemoryPalace

palace = MemoryPalace()
path = palace.export()  # 导出到 JSON
print(f"已导出到：{path}")
```

### Q: 如何清空记忆？

A:
```python
# 清空特定房间
palace.clear_room("living")

# 清空所有
import shutil
shutil.rmtree("~/.hermes/skills/mark-heartflow/memory/palace")
```

---

## 下一步

- [ ] 支持批量导入记忆
- [ ] 记忆可视化（宫殿地图）
- [ ] 跨会话记忆共享
- [ ] 记忆压缩（定期归档）
- [ ] 多用户记忆隔离

---

> "记忆不是存储，是检索。不是记住一切，是记住重要的。"
