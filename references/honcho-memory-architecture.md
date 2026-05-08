# Honcho Memory Architecture — Reference

**来源**: elkimek/honcho-self-hosted (⭐216), Hermes Agent 中文社区微信群
**日期**: 2026-05-08
**用途**: HeartFlow 记忆系统升级参照

---

## 核心架构

```
Hermes Agent → Honcho API (localhost:8000)
                   ├── PostgreSQL + pgvector (本地)
                   ├── Redis cache (本地)
                   └── Workers:
                       ├── Deriver  — 每条消息 LLM 提取观察
                       ├── Dialectic — 多级推理召回 (5层)
                       ├── Summary   — 会话压缩
                       └── Dream     — 8小时记忆整合
```

---

## 四大组件

| 组件 | 功能 | 模型 | 频率 |
|------|------|------|------|
| **Deriver** | 提取用户观察 ("prefers Python", "privacy-focused") | `z-ai/glm-4.7-flash` | 每条消息 |
| **Dialectic** | 多级推理召回 (minimal→max 5层) | GLM-4.7-flash / Grok-4.1 / GLM-5 | 按需 |
| **Summary** | 会话压缩 | `z-ai/glm-4.7-flash` | 每20/60消息 |
| **Dream** | 记忆整合、删除冗余、推断高层模式 | `z-ai/glm-5` | ~8小时 |

---

## Neuromancer XR — 专用记忆模型

Plastic Labs 的 Neuromancer XR (8B, Qwen3-8B 微调):
- **LoCoMo 记忆基准**: 86.9% vs 通用 LLM 69.6% vs Claude 4 Sonnet 80.0%
- 训练数据: ~10,000 条社会推理轨迹
- 专用目标: 从对话中提取逻辑结论（显性事实 + 演绎推论）

**不用它的代价**: 通用模型 + Honcho 的 prompt 和 tool-calling 管道可以弥补大部分差距。
主要优势是数据主权，不是精确匹配 Neuromancer 的推理质量。

---

## HeartFlow 集成状态

| Honcho 组件 | HeartFlow 实现 | 状态 |
|-------------|---------------|------|
| Deriver (LLM提取) | `add_messages()` 原始捕获 | ✅ v11.22.1 |
| Summary | `session-summarizer.js` 关键词提取 | ✅ v11.22.2 |
| Dialectic | `recallFromMem0()` 扁平检索 | ⚠️ 需升级多级推理 |
| Dream | `DreamLoop` 部分整合 | ⚠️ 深度不够 |
| Neuromancer XR | 无专用模型 | ❌ 依赖通用 LLM |

---

## Honcho 关键配置 (config.toml)

```toml
[llm]
provider = "openrouter"

[deriver]
model = "z-ai/glm-4.7-flash"  # 每条消息

[dialectic]
model_light  = "z-ai/glm-4.7-flash"
model_medium = "x-ai/grok-4.1-fast"
model_heavy  = "z-ai/glm-5"

[dream]
model = "z-ai/glm-5"  # 每8小时

[summary]
model = "z-ai/glm-4.7-flash"
session_threshold = 20
long_session_threshold = 60
```

---

## 部署要点

1. Docker + PostgreSQL + pgvector + Redis
2. 任何 OpenAI-compatible API 都可接入（OpenRouter/Venice/Together/Ollama）
3. `setup.sh` ~3分钟完成
4. Hermes 配置: `~/.honcho/config.json` → 指向 localhost:8000

---

## 微信群其他相关建议

- **Item 18**: memory.md 膨胀处理策略
  - 仅保留核心记忆，详细内容放外部笔记
  - 设计联想记忆机制控制上下文大小
  - Hermes Curator 机制会自动处理 Skill 清理
