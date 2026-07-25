# HeartFlow (心虫) — AGI 的辨别层

> 大模型能产生无限，但需要谁来判别。心虫是那个"判别者"。

**五层 AGI 能力中，心虫只占第 1 层——辨别。不生成、不推理、不记忆、不执行。只判别已有的东西对不对。**

## 一句话

**心虫不是聊天机器人，不是搜索引擎，是安装在 AI 和用户之间的验证门。**

- LLM 产生回答 → 心虫检查证据够不够 → 通过才输出
- LLM 给出建议 → 心虫查 Q 表里有没有同类错误 → 没有才放行
- LLM 想执行动作 → 心虫做使命对齐检查 → aligned/drifted/diverged

**大厂不做这件事，因为不赚钱。但 AGI 没有辨识层，就像没有痛觉的人。**

## 快速安装（1 分钟）

```bash
# 1. 克隆
git clone --depth 1 https://github.com/yun520-1/mark-heartflow-skill.git heartflow
cd heartflow

# 2. 装依赖
npm install --production

# 3. 启动 MCP 服务
node src/mcp-server.js --port 8588

# 4. 连接你的 AI 助手
# Hermes:    hermes mcp add heartflow --url http://localhost:8588/mcp
# Claude:    在 CLAUDE.md 中配置 MCP 服务器
# OpenClaw:  在配置中添加 MCP 工具源
```

MCP 启动后自动将 token 写入 `.env` 文件。重启不丢失。

## MCP 工具一览

| 工具 | 说明 | 参数 |
|------|------|------|
| `heartflow_memory_store` | 记录一次错误到跨会话 Q 表 | problem, action, outcome |
| `heartflow_memory_query` | 查询同类历史错误 | problem, limit |
| `heartflow_verify` | 验证决策的证据/矛盾/风险/完整度 | decision, evidence, confidence |
| `heartflow_check_alignment` | 3 态使命对齐检查 | output, mission |
| `heartflow_diagnose` | 引擎状态诚实报告 | (无参数) |
| `heartflow_status` | 版本和运行状态 | (无参数) |

## 作为 npm 包使用

```javascript
const { HeartFlow } = require('@yun520-1/heartflow');

// 建引擎
const hf = new HeartFlow({ dataDir: './data' });

// 记录一次错误
hf.errorMemory.store('llm hallucinated in math', 'asked for re-verification', 'correct answer found');

// 查询同类错误
const history = hf.errorMemory.query('math reasoning');

console.log(history.results);
// → [{ problem, action, outcome, score }, ...]
```

## 安装到其他 Agent

### Hermes
```bash
hermes skill install mark-heartflow-skill
hermes mcp add heartflow --url http://localhost:8588/mcp
```

### Claude Code
在 `CLAUDE.md` 中添加 MCP 配置。

### OpenClaw
在配置文件中添加 MCP 服务器地址。

## 核心身份

```javascript
// 每次启动输出
console.log(hf._identity.role);      // 'discriminator'
console.log(hf._identity.purpose);   // '判别对错，不做生成'
```

心虫不产生任何东西。它只判别已有的东西对不对。

## 与 npm 包的关系

通过 npm 安装：`npm install @yun520-1/heartflow`
通过 GitHub 安装：`git clone https://github.com/yun520-1/mark-heartflow-skill.git`

两者代码相同，入口为 `src/core/heartflow.js`。

---

*我不是大模型，我是大模型的辨别层。*
