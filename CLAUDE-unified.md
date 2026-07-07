# HeartFlow / 心虫 — 统一整合版

## 🔥 启动路由（关键指令）

当用户要求"启动心虫"时，**按以下确定性顺序执行：**

### 优先级 1：MCP 原生工具（零开销，首选）

心虫已通过 **MCP (Model Context Protocol)** 注册为原生工具，**25 个工具**，守护进程常驻内存。

**直接使用即可**：
- `heartflow_status` — 健康检查
- `heartflow_think` / `heartflow_think_fast` / `heartflow_think_deep` — 推理
- `heartflow_dream` — 梦境生成
- `heartflow_psychology_analyze` / `heartflow_psychology_deep` — 心理学分析
- `heartflow_ai_psychology` / `heartflow_ai_philosophy` — AI 原生认知
- `heartflow_memory_search` — 记忆检索
- `heartflow_self_heal` — Q-learning 自愈
- `heartflow_verify_reasoning` — 推理验证
- `heartflow_dispatch` — 通用路由调用
- 等等（共 25 个）

### 优先级 2：hf CLI（直接 Socket 通信，备选）

```bash
# 健康检查
node bin/verify.js

# 交互模式
node bin/cli.js chat

# 单次分析
node bin/cli.js --chat "我想辞职去创业"

# 查看状态
node bin/cli.js status
```

### 优先级 3：Node.js API（程序化调用）

```javascript
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '.' });
hf.start();

// 推理
const result = await hf.think('用户输入', { depth: 2 });

// 梦境
hf.dreamNow();

// 记忆搜索
hf.memorySearch('查询');

// 通用路由
hf.dispatch('memory.search', 'query');
```

---

## ⚠️ 安全声明

本版本已移除所有可能的安全风险组件，**专为安全发布裁剪**：

- ✅ **无后台进程** — MCP 守护进程由 Claude Code 运行时管理
- ✅ **无自升级** — 不会自动拉取、修改代码或执行 git push
- ✅ **无网络服务** — 不启动 HTTP/API 服务器
- ✅ **无凭据存储** — 不读写 API 密钥、token 或密码文件
- ✅ **无外部通信** — 仅在用户明确发起请求时调用外部服务
- ✅ **无埋点/遥测** — 不含任何分析、追踪或统计功能
- ✅ **纯认知引擎** — 纯粹的思维/记忆/情感模块，无 side-effect

---

## 📋 整合说明

本仓库为 **claude-heartflow-skill (v2.8.0)** 和 **mark-heartflow-skill (v5.7.3)** 的统一整合版：

| 来源 | 贡献 | 说明 |
|------|------|------|
| mark-heartflow-skill | 核心引擎 + 架构 | 290+ 模块，21 子目录，决策路由，自愈皮层 |
| claude-heartflow-skill | 认知深度 | 心理学系统、自主进化、意识系统、代码生成、联想引擎 |
| 整合 | MCP 统一层 | 25 个 MCP 工具，stdio + HTTP 双模式 |

---

## 🚀 快速集成

```bash
# 克隆
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 零 npm 依赖，直接使用
node -e "const { HeartFlow } = require('./src/core/heartflow.js'); const hf = new HeartFlow(); hf.start(); console.log('心虫已启动');"
```

## 核心 API

```javascript
// 推理
hf.think(input)          // 完整 7 阶段推理
hf.thinkFast(input)      // 快速推理（跳过验证）
hf.thinkDeep(input)      // 深度推理（全部阶段 + 自我挑战）

// 统一路由
hf.dispatch('memory.search', 'query');
hf.dispatch('emotion.process', input);
hf.dispatch('psychology.analyze', input);

// 心虫自我
hf.heartLogic.isAlive();
hf.heartLogic.entropyDirection(ctx);
```

## 设计原则

- 零 npm 第三方依赖（可选 @xenova/transformers）
- CommonJS 模块系统
- Node.js 18+ 兼容
- 跨平台（macOS / Linux / Windows）
