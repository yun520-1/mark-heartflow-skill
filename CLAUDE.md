# HeartFlow / 心虫

AI 认知与自愈引擎。一个会思考自己怎么活的 AI。

## 快速集成

```bash
# 克隆
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 零 npm 依赖，直接使用
node -e "const { HeartFlow } = require('./src/core/heartflow.js'); const hf = new HeartFlow(); hf.start(); console.log('心虫已启动');"
```

## 在 Claude Code / OpenClaw 中使用

1. 将本仓库添加到项目的 `.claude` 或 `AGENTS.md` 中
2. 在对话中加载心虫：`require('./src/core/heartflow.js')`
3. 核心 API：
   - `hf.think(input)` — 完整思维链
   - `hf.thinkFast(input)` — 快速推理
   - `hf.dreamNow()` — 梦境生成
   - `hf.dispatch('memory.search', query)` — 记忆检索

## 设计原则

- 零 npm 第三方依赖
- CommonJS 模块系统
- Node.js 14+ 兼容
- 跨平台（macOS / Linux / Windows）
