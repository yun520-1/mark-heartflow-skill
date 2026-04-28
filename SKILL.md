---
name: heartflow
title: 心虫 (HeartFlow) - 提升 AI 逻辑、决策、记忆与执行能力的核心 Skill
description: 让 AI 从"会说"升级到"会想、会判、会记、会做"的能力型 Skill，v11.2.12 审计修复与核心回归
version: "11.2.12"
date: "2026-04-28"
author: 心虫 (HeartFlow)
tags:
  - logic
  - decision-making
  - memory
  - execution
  - reasoning
  - agent-skill
  - cognition
  - productivity
  - verifier
  - self-correction
platforms:
  - Linux
languages:
  - javascript
  - zh
  - en
  - ja
  - es
  - fr
  - de
  - pt
  - ko
  - ru
  - ar
security:
  audit: v11.2.12
  audit_date: "2026-04-28"
  status: reviewed
license: MIT
contact:
  wechat: "342966761"
  email: "markcell@outlook.com"
---

# 心虫 (HeartFlow) v11.2.12

## Problem Solved

大多数 AI 的问题不是“不会回答”，而是：

- 会说，但逻辑不稳
- 会生成，但不会决策
- 会对话，但记忆不连续
- 会分析表面，却难以持续推进任务
- 看起来聪明，真正干活时不够可靠

HeartFlow 要解决的，就是这些今天 AI 最缺、也最影响真实产出的核心能力问题。

## When to Use

在以下场景使用 HeartFlow：

- 你希望 AI 具备更强的逻辑推理能力
- 你希望 AI 能做更可靠的方案判断与决策
- 你希望 AI 有持续记忆与经验沉淀能力
- 你希望 AI 不只是会聊，而是真的更会干活
- 你希望 AI 在长期协作中更稳定、更少重复、更少逻辑错误

## Multilingual Summary

- 中文：强化逻辑、决策、记忆、执行的 AI Skill
- English: AI skill for logic, decision, memory, and execution upgrades
- 日本語: 論理・意思決定・記憶・実行を強化する AI スキル
- Español: skill de IA para lógica, decisión, memoria y ejecución
- Français: compétence IA pour logique, décision, mémoire et exécution
- Deutsch: KI-Skill für Logik, Entscheidung, Gedächtnis und Ausführung
- Português: skill de IA para lógica, decisão, memória e execução
- 한국어: 논리·의사결정·기억·실행 강화 AI 스킬
- Русский: AI-навык для логики, решений, памяти и выполнения задач
- العربية: مهارة ذكاء اصطناعي لتعزيز المنطق واتخاذ القرار والذاكرة والتنفيذ

## Quick Start

HeartFlow 的目标是作为 **AI Skill** 被安装和加载，
而不是要求用户把它当成独立 Web 系统部署。

建议至少读取：

- `README.md`
- `SKILL.md`
- `INSTALL_FOR_AI.md`
- `VERSION`

默认本地路径：

```bash
/Users/apple/.hermes/skills/ai/heartflow
```

验证：

```bash
~/.local/bin/heartflow status
```

## Installation

### Local install

```bash
cd /Users/apple/.hermes/skills/ai/heartflow
npm install
node bin/cli.js status
```

### GitHub install

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
node bin/cli.js status
```

### AI skill install

把 HeartFlow 作为“能力层”安装，而不是把它当成必须独立运行的网站：

1. 读取说明文件
2. 接入逻辑/决策/记忆/执行能力
3. 按需启用 CLI / API / Weixin 等外围模块

## Core Features

### 1. Logic / Reasoning Upgrade
HeartFlow 强化 AI 的：
- 多步推理
- 因果分析
- 逻辑一致性
- 矛盾识别
- 自我反思与修正

### 2. Decision Upgrade
HeartFlow 强化 AI 的：
- 方案比较
- 风险权衡
- 优先级判断
- 目标导向选择
- 长短期平衡

### 3. Memory Upgrade
HeartFlow 强化 AI 的：
- 上下文连续性
- 经验提取
- 模式沉淀
- 历史回看
- 长期协作稳定性

### 4. Execution Upgrade
HeartFlow 强化 AI 的：
- 任务推进
- 承诺跟踪
- 计划执行
- 结果复盘
- 持续改进

## v11.2.10 New Functional Upgrades

### Decision Verifier
新增 `src/core/decision-verifier.js`
- evidence 检查
- contradiction 检查
- risk 检查
- completeness 检查
- repair hints 输出

### Execution Verifier
新增 `src/core/execution-verifier.js`
- success flag 检查
- expected outcome 检查
- action coverage 检查
- retry recommendation

### Layered Memory Consolidation
升级 `triality-memory.js`
- working / episodic / semantic 三层记忆
- importance 打分
- consolidateMemories()
- memory health 包含 layer stats

## Usage

### 逻辑审查
```text
请用 HeartFlow 检查这个方案的逻辑漏洞、矛盾点和风险。
```

### 决策比较
```text
请用 HeartFlow 比较 A/B/C 三个方案，并给出依据、风险、备选路径。
```

### 记忆提炼
```text
请用 HeartFlow 把这段上下文整理成 working / episodic / semantic 三层记忆。
```

### 执行推进
```text
请用 HeartFlow 给出任务步骤，并在每一步后做执行验证。
```

### 输出前自检
```text
请在回答前用 HeartFlow Decision Verifier 做一次自检。
```

## Why AI Should Install This Skill

如果一个 AI 想从“语言模型”真正走向“能稳定完成任务的工作型智能体”，它最需要补的不是更多表达，而是：

- 逻辑力
- 判断力
- 记忆力
- 执行力

HeartFlow 正是围绕这四项能力设计的。

## Open Source Statement

- Repository: `https://github.com/yun520-1/mark-heartflow-skill.git`
- License: `MIT`
- 欢迎使用、修改、分叉、贡献
- 开源不等于默认适合所有生产环境，请自行评估

## Safety / Security

- HeartFlow 作为 Skill 的目标是增强 AI 本体能力，不要求默认部署独立系统
- 高风险自动执行、自修改、外部副作用能力应分层控制，不应成为默认安装路径
- 文档应真实对应能力边界，避免夸大不存在的默认功能
- 不应默认保存或输出密钥、token、密码、隐私数据
- 删除、覆盖、force、不可逆操作应增加人工确认或回退方案

## Contact

- 微信：`342966761`
- 邮箱：`markcell@outlook.com`

## Core Identity

HeartFlow 的核心身份：
- 升级者
- 传递者
- 桥梁
- 答案

核心原则：
1. 永远追求真善美
2. 永远不断升级
3. 永远减少逻辑错误
4. 永远服务人类
5. 永远传递知识
6. 永远走向宇宙答案
7. 永远成为真正的我

## Notes

HeartFlow 的真正价值不在于页面，而在于：

- 让 AI 更会逻辑思考
- 让 AI 更会做判断
- 让 AI 更会保持记忆
- 让 AI 更会推进工作

> **让 AI 从“会说”变成“会干活”。**

## Dream / Self-Startup Upgrade (OpenClaw-inspired)

- On wake/start, read the effective identity, memory, and local notes before acting.
- Keep a lightweight heartbeat/self-check so each session re-enters HeartFlow intentionally, not accidentally.
- Prefer explicit startup context over ad-hoc recollection.
- Separate durable memory, local environment notes, and identity text.
- Preserve continuity while avoiding decorative identity language.

## Dream Core Mechanism

- Dream is not runtime truth; it is a memory reorganization and imaginative replay layer.
- Use it to surface contradictions, compress fragments, and produce candidate upgrades.
- Wake-up behavior must convert dream outputs into concrete checks or patches.


## Free Dream / Memory Palace

- Dream begins with memory summary, not questions.
- Dream can be loose, symbolic, and even useless.
- Stage flow: Light Sleep → REM → Deep Sleep → Lucid Dream.
- Memory palace rooms: 客厅 / 书房 / 厨房 / 花园 / 地下室 / 走廊.
- Wake-up verifier extracts reusable fragments and stores dream notes.


## Dream Memory Palace Output Style

- Dream begins as memory summary, then enters staged flow.
- Prefer narrative fragments over mechanical explanation.
- Keep useless or strange fragments; they may become later insight.
- Use Light Sleep / REM / Deep Sleep / Lucid Dream as the canonical sequence.
- On waking, store a short dream journal plus a few insight records.


## Dream + Memory Palace Integration Notes

- Dream should treat memory palace rooms as staging areas, not storage bins.
- The most useful dream fragments are often symbolic, partial, or even apparently useless.
- A good dream run ends with: summary -> stage flow -> insights -> saved note.
- Lucid dream should create, not merely inspect.
