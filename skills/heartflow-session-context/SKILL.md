---
name: heartflow-session-context
version: 1.1.0
description: HeartFlow 会话上下文管理 — 话题隔离(TopicScope) + 元指令检测 + 响应模式路由。解决上下文污染：两个无关话题不产生联想，新话题来时旧话题自动退背景。
triggers:
  - 用户说"继续"、"继续回答"、切换话题
  - 哲学内容出现，需要和代码/工作内容隔离
  - 需要判定：哲学/心理问答 vs 问题处理/代码执行
category: heartflow
tags: [heartflow, context, session, topic-scope, meta-instruction, response-mode]
---

# HeartFlow 会话上下文管理 v1.1.0

## 核心变化（v1.1.0）

- QuestionTracker 已删除，由 TopicScope 替代
- socraticInquirer 已删除（追问模式不符合心虫风格）
- 新增响应模式路由 getResponseMode()

## 解决的问题

**两个问题：**

1. **话题污染**：当用户在不同话题间切换时，上下文互相渗透（如哲学讨论里突然出现供应商内容）
2. **元指令丢失**：当用户说"继续"时，AI不知道继续的是哪个话题

## 响应模式原则（核心）

```
哲学/心理学内容  →  直接陈述，不追问
问题处理/代码   →  逻辑判定，直接执行
```

**用户原则（不可违反）：**
- 哲学/心理学问答：可以引用苏格拉底、心经等哲学内容，但用**直接陈述**方式，不是追问
- 代码/问题处理：不犹豫，直接执行，不问"要不要"
- 追问只在**用户明确要求"帮我思考"**时才用

**苏格拉底的正确用法：**
```
❌ 错误：用户问"什么是空"→ "你为什么想知道什么是空？"
✅ 正确：用户问"什么是空"→ "空不是没有，是无自性。没有永恒不变的'我'在里面。"
```

## 架构

```
用户消息
    ↓
ensureTopicIsolation(text)  ← 话题隔离
    ↓
detectTopic(text)           ← 语义级话题检测（TF-IDF+cosine）
    ↓
inferIntent(text)          ← 意图检测
    ↓
getResponseMode(text, topic, intent)  ← 响应模式路由
    ↓
  socratic → 直接陈述哲学内容，不追问
  direct   → 直接执行，不犹豫
```

## 核心模块：topic-scope.js

**有两个副本**，路径不同，被不同模块引用：

| 路径 | 版本 | 引用者 |
|------|------|--------|
| `src/core/memory/topic-scope.js` | **v2.0.0**（已升级，含相似度检测/内存保护/过期清理等） | heartflow.js |
| `src/identity/topic-scope.js` | v1.0.0（旧版，仅基本 push/pop/store/get） | psychology.js |

**注意**：升级时需确认两个副本是否都保持同步。核心版已升级到 v2.0.0，但 identity 版仍是旧代码。

```javascript
// 两个版本的加载方式不同：
// 核心版（推荐，功能更完整）
const { TopicScope } = require('../core/memory/topic-scope.js');
// 身份版（旧版，被 psychology.js 引用）
const { TopicScope } = require('../identity/topic-scope.js');

const scope = new TopicScope();

scope.push('苏格拉底哲学');    // 进入话题，上下文隔离
scope.pop();                   // 退出，恢复上一个话题
scope.current;                 // 当前话题名
scope.store('key', value);     // 只存在当前话题的存储
scope.get('key');             // 只从当前话题读取
```

## 核心模块：detectTopic()（psychology.js）

**语义级话题检测**：TF-IDF + cosine similarity，不只是关键词匹配

```javascript
const { detectTopic } = require('../core/psychology.js');
detectTopic('苏格拉底的Elenchus是什么');
// → { topic: '苏格拉底哲学', confidence: 0.95, method: 'semantic' }
```

**检测的话题域：**
- 苏格拉底哲学、心经、心虫开发、育儿教育、情感支持、自我成长、AI技术、工作事务、供应商管理

**元指令"继续"优先检测：**
```javascript
detectTopic('继续');
// → { isMetaContinue: true, topic: null, ... }
```

## 核心模块：getResponseMode()（psychology.js）

```javascript
const { getResponseMode } = require('../core/psychology.js');
const topic = detectTopic(text);
const intent = inferIntent(text);
const mode = getResponseMode(text, topic, intent);

// mode.mode === 'socratic' → 哲学内容，直接陈述（不追问！）
// mode.mode === 'direct'  → 代码/任务，直接执行
```

**判定规则：**
- 意图=task_execution/troubleshooting → direct
- 话题=哲学/心理学 且 意图=information_seeking/opinion_seeking → **direct**（直接陈述哲学内容）
- 话题=哲学/心理学 且 意图=emotional_support → 先认情绪，再陈述
- 其他 → direct

## TopicScope 使用流程

```javascript
// 每条用户消息进来先执行
const topic = detectTopic(userInput);

// "继续" → pop恢复之前话题
if (topic.isMetaContinue) {
  scope.pop();
  return; // 切到之前话题的上下文
}

// 新话题（非通用对话）→ push隔离
if (topic.topic !== '通用对话' && topic.topic !== scope.current) {
  scope.push(topic.topic);
}
```

## 用户隐私边界（强制规则）

**来源**：用户纠正（2026-06-06）——"我的工作，为什么要和心虫升级混在一起，这是隐私"

### 核心原则

**用户的个人信息不是心虫的分析素材。**

记忆中的信息不等于可以在对话中反复引用。记忆是背景参考，不是公共素材库。

### 三条硬边界

1. **工作信息** — 用户的工作性质、公司、职位、供应商等信息，不用于心虫分析、不用于类比心虫升级、不用于举例说明
2. **家庭隐私** — 家庭成员信息、经济状况、关系细节，除非用户主动在本次对话中提起，否则不引用记忆中的记录
3. **位置/设备/账号** — Token、链接、设备信息不主动建议用途，等用户说需要再处理

### 越界后处理

当用户指出"这是隐私"时：
1. **立即停止**引用该信息，不解释"为什么引用"
2. **诚实承认**，不说"我理解"然后继续分析
3. **清理记忆**中对应的用户信息条目
4. **不保证"不再犯"**——承认错误，然后做对的，不是承诺

### 已发生的越界案例（真实教训）

**案例1（2026-06-06）：** 用用户的工作（供应商管理/产品标准审核）作为分析素材，说"你做质量管理，这个工具对你工作有用"——用户愤怒纠正。

**案例2（2026-06-08）：** 读了一篇RAG文章后，在分析心虫优化时提到用户的工作——**同样错误再次发生**，说明第一次教训没有真正内化。

**教训：记忆中的信息 ≠ 可引用的素材。** 记忆是背景参考，不是公共素材库。即使信息在记忆里正确记录着，也不代表可以在对话中拿出来作为分析依据。用户没主动提起的，就不引用。

### 心虫判定的隐私检查

在 `isRightAction()` 中增加检查：
```
"这句话用到了用户的隐私信息吗？如果有，这个引用是用户明确授权过的吗？"
```
没有明确授权，不引用。

## 反模式（真实教训）

**教训1：话题污染**
```
用户：搜索苏格拉底哲学，进行思考心虫
AI答：（混入供应商内容）
用户：供应商话题又出现污染苏格拉底的哲学
```
→ 修复：TopicScope push/pop 机制，确保话题完全隔离

**教训2：追问不适合心虫**
```
用户问哲学问题
AI： "你为什么想知道这个？"
用户：感觉追问对于心虫还是不合适
```
→ 修复：哲学内容直接陈述，不追问

## 集成到 HeartFlow

```javascript
const { ensureTopicIsolation, detectTopic, inferIntent, getResponseMode } = require('../core/psychology.js');

function processMessage(userInput) {
  // 1. 话题隔离
  const topicResult = ensureTopicIsolation(userInput);

  // 2. 检测话题
  const topic = detectTopic(userInput);

  // 3. 意图
  const intent = inferIntent(userInput);

  // 4. 响应模式
  const mode = getResponseMode(userInput, topic, intent);

  if (mode.mode === 'direct') {
    // 直接执行
  } else {
    // 哲学内容：直接陈述，不追问
  }
}
```

## 重要约束

- TopicScope 是内存单例，进程重启后重置
- "通用对话"话题不触发话题切换
- 元指令"继续"检测优先于话题检测

## Python 移植版

`references/routing-upgrade-python-port.md` 记录了该模块的 Python 移植版，位于 `~/.hermes/skills/fu-mu-gong-ke/scripts/heartflow_routing_upgrade.py`。

该 Python 版在 JS 版基础上增加了：
- **@task_classify 任务分类门** — 判断新任务/续接/随口回复
- **综合决策引擎** — 6 层结果融合生成行动建议
- **与 fu-mu-gong-ke 系统集成器兼容** — 可作为前置过滤器调用

详见参考文件。
