# 心虫路由增强层 — Python 移植版

**文件位置：** `~/.hermes/skills/fu-mu-gong-ke/scripts/heartflow_routing_upgrade.py`
**版本：** 1.0.0
**创建时间：** 2026-06-05

## 概述

将 HeartFlow 的 `whatIsThis()` 元认知先行判断、`TopicScope` 话题隔离、以及 fu-mu-gong-ke 的 3 层路由决策树融合为统一的 4 层路由架构，用纯 Python 实现（无外部依赖）。

## 架构（6 层管道）

```
UserInput
  │
  ▼
Layer 0: whatIsThis 元认知先行判断  (移植 heart-logic.js)
  │  对话类型: 育儿咨询/情感支持/危机干预/知识查询/任务执行/通用对话
  │  情绪: 四维检测 (基调/强度/可命名/变化)
  │  特征: 急躁/亲子/痛感
  ▼
@task_classify 任务分类门  (新增)
  │  new_task / continuation / casual_reply
  ▼
TopicScope 话题隔离  (移植 topic-scope.js + psychology.js)
  │  TF-IDF + n-gram cosine similarity 语义检测
  │  push/pop 话题栈 + store/context 隔离
  ▼
Layer 1: 危机检测  (原 fu-mu-gong-ke 第1层)
  │  关键词 + 隐喻 + 四级信任度
  ▼
Layer 2: 用户身份  (原 fu-mu-gong-ke 第2层)
  │  parent / child / intermediary / unknown
  ▼
Layer 3: 场景匹配  (原 fu-mu-gong-ke 第3层)
  │  14 个场景关键词匹配
  ▼
综合决策引擎  (新增)
  危机短路 → casual → continuation → new_task 完整路由
```

## 核心类/函数

| 函数/类 | 源 | 说明 |
|---------|-----|------|
| `what_is_this(input)` | heart-logic.js `whatIsThis()` + `whatDoIFeel()` | 元认知先行判断 |
| `classify_task(input, what_is_this_result)` | **新增** | 任务分类门 |
| `TopicScope` | topic-scope.js | 话题隔离类（push/pop/store/get/setContext/clearAll） |
| `detect_topic(text)` | psychology.js `detectTopic()` | 语义级话题检测（TF-IDF + cosine） |
| `ensure_topic_isolation(text, scope, task_cls)` | psychology.js `ensureTopicIsolation()` | 话题切换执行器 |
| `route_pipeline(input, scope)` | **新增** | 完整 4 层路由管道 |
| `_detect_crisis(input)` | fu-mu-gong-ke | 危机信号检测 |
| `_detect_identity(input)` | fu-mu-gong-ke | 用户身份识别 |
| `_match_scenario(input)` | fu-mu-gong-ke | 场景匹配 |

## 话题检测域（8 个）

育儿教育、情感支持、危机干预、代际创伤、自我成长、心虫开发、通用对话

## 与 JS 版的差异

1. **无 lazy loading** — Python 版直接导入所有模块
2. **话题中心词库扩展** — 加入了 fu-mu-gong-ke 特有的词（代际创伤、危机干预）
3. **新增 @task_classify** — JS 版只有 detectTopic 的 isMetaContinue，Python 版增加了 casual_reply 和新任务检测
4. **综合决策引擎** — 基于 6 层结果生成 action 建议（危机短路 → casual → continue → full routing）

## 兼容性

- 与 `fu-mu-gong-ke/system_integrator.py` 兼容
- 可作为前置过滤器调用：`route_pipeline(input)` → 返回决策结果
- 纯本地推理，无外部 API 依赖
- Python 3.8+ 标准库
