# HeartFlow v0.13.48

> **让 AI 真正学会自我升级的引擎。** 不是工具，是持续运行的进化循环。

**一行安装**：零依赖，纯 JavaScript，在任意 AI Agent 环境中运行。

---

## 核心架构

### 进化循环（每 30 分钟自动运行）

```
论文检索 → 概念提取 → 代码生成 → 语法验证 → 版本推进
```

每次循环：
1. 读取 2 篇 arXiv 论文
2. 用 AI 分析核心概念（Memory、Consciousness、Emotion…）
3. 生成对应代码模块（300+ 行/次）
4. 语法检查后写入 `src/core/`
5. 版本号 +0.0.1
6. 自动同步到 package.json / SKILL.md / CHANGELOG.md

### 三大核心系统

**1. 记忆系统（三层架构）**
- `MeaningfulMemory`：意义驱动记忆，动态注意力权重
- `TrialityMemory`：HOT/WARM/COLD 三层，TTL 自动衰减 + 晋升机制
- Q-Table 强化学习检索策略

**2. 自我进化引擎**
- Reflexion：执行后文字反思，从错误中学习
- Self-Refine：生成→评估→精化循环
- Rollback Manager：危险修改前自动快照

**3. 心跳自检系统**
- `heartbeat-loop.js`：每 10s 发送心跳，连续失败触发重启
- `startup-check.js`：启动时全量诊断
- `health-check.js`：内存/CPU/伦理/版本多维检查

### 论文驱动升级

已处理 **458 篇** arXiv 论文，覆盖：

| 领域 | 论文数 |
|------|--------|
| Memory Management | 50+ |
| Consciousness | 40+ |
| Self-Evolution | 60+ |
| Emotion Engine | 30+ |
| Autonomy | 25+ |
| Ethics | 20+ |

---

## 快速启动

```bash
# 零依赖直接运行
node src/core/heartflow.js

# 论文驱动升级（每30分钟自动运行）
node run-upgrade.js

# 版本同步
node scripts/sync-version.js
```

---

## 核心文件

```
src/core/
├── heartflow.js          # 主引擎入口
├── heartbeat-loop.js     # 心跳系统
├── self-evolution/       # Reflexion + Self-Refine
├── memory/              # 三层记忆系统
├── ethics/              # SAGE 伦理护栏
└── emotion/             # 情感引擎

run-upgrade.js           # 论文升级脚本
scripts/sync-version.js  # 版本同步脚本
```

---

## 版本记录

| 版本 | 日期 | 变化 |
|------|------|------|
| v0.13.42 | 2026-05-13 | 458篇论文处理完毕，代码模块持续积累 |
| v0.13.0 | 2026-05-01 | 初始版本，核心引擎完成 |

---

**版本**：v0.13.42  
**Commit**：1562 次（全部可验证）  
**GitHub**：https://github.com/yun520-1/mark-heartflow-skill  
**理念**：不追求完美，追求持续进化
