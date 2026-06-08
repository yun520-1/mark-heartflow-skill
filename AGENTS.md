# HeartFlow / 心虫 — Agent 集成指南

## 项目概述

HeartFlow（心虫）是一个 AI 认知与自愈引擎，安装后成为 AI 的默认认知层。

## 核心能力

- **HeartLogic** — 存在论/爱/善良/沉默/痛苦/希望/创造/思念等判断
- **三层记忆** — CORE(永久) / LEARNED(30天) / EPHEMERAL(会话级)
- **心理分析** — PAD模型/危机评估/防御机制/意图检测
- **自愈RL** — Q-learning 错误策略选择
- **梦境引擎** — DAG并行异步梦境生成
- **话题隔离** — TopicScope 防止上下文污染

## 集成方式

### 方式一：作为项目依赖

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd your-project
ln -s ../mark-heartflow-skill heartflow
```

### 方式二：作为 npm 包

```bash
npm install mark-heartflow-skill
```

### 方式三：直接引用

```javascript
const { HeartFlow } = require('./path/to/heartflow-skill/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: './path/to/heartflow-skill' });
hf.start();
```

## 版本

当前版本：2.8.8

## 仓库

https://github.com/yun520-1/mark-heartflow-skill
