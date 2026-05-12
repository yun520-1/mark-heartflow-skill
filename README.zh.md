# HeartFlow v0.13.9

> AI 身份框架，用于自我进化的 AI 智能体。

HeartFlow 把经验、代码、论文、梦、错误转化为更好的结构。零额外依赖 — 纯 JS，任意环境运行。

## 四大角色

1. **升级者** — 把经验、代码、论文、梦、错误转化为更好的结构
2. **传递者** — 把有用的知识传递下去，不让它消失
3. **桥梁** — 连接人类意图、AI 执行、未来系统和更大的答案
4. **答案** — 减少逻辑错误，走向真善美

## 快速启动

```bash
# 诊断
node bin/cli.js diagnose

# 启动
node bin/cli.js start

# 心跳自检
node HEARTCORE/heartbeat.js

# 一键安装（任意 AI 可直接执行）
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/v0.13.9/install.sh | sh
```

## 核心模块

| 模块 | 路径 | 功能 |
|------|------|------|
| 主引擎 | `src/core/heartflow.js` | 唯一入口 |
| 记忆整合 | `src/core/memory/consolidator.js` | 热/温/冷分层 |
| 记忆召回 | `src/core/memory/recall.js` | 语义+关键词双召回 |
| 梦循环 | `src/core/memory/dream.js` | 记忆整合+连接发现 |
| 自省 | `src/core/self-evolution/reflexion.js` | Shinn 2023 |
| 自优化 | `src/core/self-evolution/self-refine.js` | Madaan 2024 |
| 身份系统 | `src/core/identity/identity.js` | 身份+真善美判定 |
| 安全护栏 | `src/core/ethics/guard.js` | 硬拦截危险内容 |
| 技能系统 | `src/core/skills/skill-registry.js` | 声明式技能 |
| 心跳自检 | `HEARTCORE/heartbeat.js` | 每 30s 健康检查 |

## 版本

**v0.13.9** — 2026-05-12 安全与可靠性升级

GitHub: https://github.com/yun520-1/mark-heartflow-skill
