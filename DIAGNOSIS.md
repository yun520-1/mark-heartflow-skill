# HeartFlow 安装与运行诊断

## 当前状态 (2026-07-25)

### 在 Hermes 上

| 组件 | 状态 | 问题 |
|------|------|------|
| 技能目录 | ✅ `~/.hermes/skills/ai/mark-heartflow-skill/` | 存在 |
| MCP 配置 | 🟡 `config.yaml` 配了 URL | URL 正确，但 token 未正确传递 |
| MCP 进程 | ✅ v6 MCP 在 8588 运行 | 刚刚修复，之前被 v7 替代占端口 |
| MCP 端点 | ✅ `/mcp` SSE 返回 401（需要 token） | ✅ 不是 404，服务正常 |
| **Hermes 能调工具** | ❌ **不能** | Bearer token 没配通 |

### 在其他 Agent 上安装的效果

如果原样在另一个 Hermes/Claude Code/OpenClaw 上装：

```
agent clone 技能 → 启动 MCP → 啥也不通
                               ↓
                   原因1: MCP 服务没自动启动
                   原因2: Bearer token 没自动生成
                   原因3: 端口 8588 可能被占用
                   原因4: 2882 行的 MCP 服务器一挂整个技能不能用
```

### 三个导致运行 bug 的根因

**1. MCP 需要手动启动，没有守护进程**

现在每次 Hermes 重启或 session 切换，MCP 不会自动拉起。用户必须手动跑 `node src/mcp-server.js --port 8588`——普通人不知道这个。

**2. Token 需要手动设置**

服务启动时如果 `HEARTFLOW_MCP_TOKEN` 没设，自动生成一个随机 token 但**不打印**（安全策略）。config.yaml 引用了 `${MCP_...KEY}` 但这个变量在 `.env` 里不存在。

**3. 2882 行的 MCP 服务器 = 132 模块的耦合炸弹**

`src/mcp-server.js` 一开始就加载 `heartflow.js`，而这个文件依赖 132 个模块的初始化。任何一个模块的 `require` 失败（文件缺失、语法错误、依赖不满足），整个 MCP 服务启动崩溃。没有降级。

## 要正常运行必须满足

```
1. Node.js (≥18) — 心虫不是纯技能，依赖 JS 运行时
2. 所有 132 个模块文件完整 — 任何空壳文件破损都会炸
3. HEARTFLOW_MCP_TOKEN 在 .env 里 — 否则 config.yaml 连不上
4. 端口 8588 可用 — 否则 MCP 启动失败
5. src/heartflow/ 下的 v7 代码不干扰 v6 — 刚刚修了
```

## 怎么修

不是大改动，就三件小事：

1. **MCP 自动启动脚本** → Hermes 启动时自动检测 MCP 是否在跑，不在就拉起
2. **Token 自动同步** → MCP 启动时就写入 `.env`，config.yaml 自动读取
3. **MCP 崩溃恢复** → 2882 行的 http server 加个 `on('error')` 重启逻辑

每件不超过 10 行。
