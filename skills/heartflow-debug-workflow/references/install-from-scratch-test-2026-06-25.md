# 从零安装测试报告（2026-06-25）

来源：用户上传的 `heartflow-issue-report.md`（基于 v4.1.2 版本实测）

## 统计总览

| 指标 | 数值 |
|------|------|
| 手动命令/操作次数 | 42 次 |
| GitHub API 调用 | 12 次（2 次外部 API） |
| npm 调用 | 2 次（1 次外部 API） |
| Node.js 进程启动 | 6 次 |
| 测试运行 | 3 次 |
| 修复代码 | 5 次（patch） |
| 尝试启动 MCP 服务器失败次数 | 3 次 |
| 从零到 MCP 就绪总耗时 | ≈ 15 分钟 |

## 阶段分解

### 1. 获取代码（2 次 API 调用，1 次阻塞失败，2 次绕行）
- `git clone` 180s 超时 → 改用 `curl` 下载 zip → `unzip` 不存在 → Python 解压

### 2. 安装依赖（v4.0.0: 1 次 API 调用, 120s; v4.1.2: 0.3s, 零依赖）
- v4.0.0: 81 个包，npm audit 4 漏洞（3 high + 1 critical）
- v4.1.2: 0 外部包，npm install 0.3s

### 3. 探索阶段（7 次 API 调用，全用于"理解项目是什么"）
- 读 README、package.json、SKILL.md、AGENTS.md、CLAUDE.md、CORE_IDENTITY.md、CORE_VALUES.md、目录树

### 4. 引擎启动与验证（0 次外部 API，13 次手动操作，5 次代码修复）
- CLI 只有 status/help → 自己写 chat.js 交互脚本
- `think()` 返回"不知道，缺少关键信息"
- `npm test` 7/11 失败 → 修复 4 个集成测试 + 15 个回归测试 → 31/31 通过

### 5. MCP 服务器接入（0 次外部 API，15 次手动操作，3 次失败尝试）
- 端口 8099 被占用 → `lsof -ti:8099 | xargs kill`
- HEARTFLOW_MCP_TOKEN 环境变量冲突 → 401
- `hermes mcp add` 无法非交互式 → 试 3 次 stdin 管道

## 问题分类（按影响）

### 🔴 阻塞（无法完成基本安装/启动）
1. **git clone 超时**（B1）— 180s 失败 → 建议 npm 发布
2. **CLI 只有 status/help**（B2）— 用户不知道如何交互 → 加 `--chat` 命令（v4.1.2 已修）
3. **think() 返回"不知道"**（B3）— 核心接口不可用 → 加认知摘要（v4.1.1 已修）

### 🟠 中等（需要绕行）
1. 无 unzip 回退（M1）
2. 测试 v4.0 与 v2.x 混合（M2）
3. Dispatch 返回格式未文档化（M3）
4. MCP 端口冲突无自动处理（M4）— **v4.1.2 已修：自动检测 8099-8105**
5. HEARTFLOW_MCP_TOKEN 文档缺失（M5）— **v4.1.2 已修：README 加 auth 说明**
6. `hermes mcp add` 无法非交互式（M6）— Hermes 问题

### 🟡 轻度（体验不佳）
1. npm 高危漏洞（L1）— **v4.1.1 已修**
2. 语法检查无进度条（L2）
3. 日志混在 stdout（L3）
4. MCP 启动命令在 README 中缺失（L4）— **v4.1.2 已修：README 加 MCP 章节**
5. 无 API 文档（L5）
6. 无 LLM 集成示例（L6）— **v4.1.2 已修：examples/llm-integration.js**
7. 测试运行残留 .hmac-key 文件（L7）

## 最痛的三件事

1. **git clone 不可靠** → npm 发布即可解决（需用户确认 npm 账号）
2. **think() 没有认知输出** → 认知摘要 v4.1.1 已修
3. **MCP 接入无文档** → README v4.1.2 已修

## 修复清单（v4.1.2）

| 报告编号 | 问题 | 状态 |
|---------|------|------|
| B1 | git clone 超时 | ⏳ 等 npm 发布确认 |
| B2 | CLI 只有 status/help | ✅ `--chat "<msg>"` 单次执行 |
| B3 | think() 返回"不知道" | ✅ 认知摘要 + examples/ |
| M4 | MCP 端口冲突 | ✅ 自动检测 8099-8105 |
| M5 | MCP token 文档缺失 | ✅ README auth 说明 |
| L4 | MCP 启动命令缺失 | ✅ README 一整节 |
| L1 | npm 漏洞 | ✅ 已修（v4.1.1） |
| L6 | LLM 集成示例 | ✅ examples/llm-integration.js |

## 根因

安装问题的根因不是代码有 bug，是**没有做过从零安装验证**。所有修复都基于用户实际跑了一遍安装流程后报告的问题。如果每次发版前有人从零装一次，这些问题在发布前就能发现。
