# HeartFlow 安装指南

## 系统要求

- **Node.js >= 18**（[下载](https://nodejs.org/)）
- 操作系统：macOS / Linux / Windows
- **零外部依赖** — 无需 API key、无需模型文件、无需网络

## 安装（2分钟）

### 方式一：git clone（推荐）

```bash
git clone --depth 1 https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
```

### 方式二：curl 下载

```bash
curl -L https://api.github.com/repos/yun520-1/mark-heartflow-skill/zipball/main -o heartflow.zip
unzip heartflow.zip && cd yun520-1-mark-heartflow-skill-*
npm install
```

## 验证

```bash
node bin/verify.js
```

看到 `✅ 全部通过` 即安装成功。

## 快速使用

### 交互式控制台

```bash
node bin/cli.js chat
# 或
npm start
```

输入任意内容，心虫会自动分析情绪、心理状态、哲学立场，输出结构化认知分析。

### 单次分析

```bash
node bin/cli.js --chat "我想辞职去创业"
```

### 查看引擎状态

```bash
node bin/cli.js status
# 或
npm run status
```

## 集成到 AI Agent

### MCP 服务器（推荐）

```bash
# 启动 MCP HTTP 服务
node mcp/mcp-server-http.js --port 8099 &

# 注册到 Hermes Agent
hermes mcp add heartflow --url http://localhost:8099/mcp

# 验证
hermes mcp test heartflow
```

MCP 提供 16 个工具：think、emotion、memory、decision router、dream、psychology 等。

### Node.js API

```javascript
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow();
hf.start();

// 全量认知分析
const result = await hf.think("你的输入");
console.log(result.cognition.emotion);   // PAD 情绪向量
console.log(result.cognition.judgment);  // 多路径判断
console.log(result.cognition.decision);  // 决策策略
```

## 遇到问题？

| 问题 | 解决方法 |
|------|---------|
| `npm install` 报错 | 确认 Node.js >= 18：`node --version` |
| `node bin/cli.js` 报 "engine not found" | 确保在项目根目录执行 |
| MCP 端口被占用 | `node mcp/mcp-server-http.js --port 8100` |
| 其他问题 | [提 Issue](https://github.com/yun520-1/mark-heartflow-skill/issues) |

## 更新

```bash
git pull
npm install
node bin/verify.js
```
