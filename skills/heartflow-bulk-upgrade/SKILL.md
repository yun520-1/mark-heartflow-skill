---
name: heartflow-bulk-upgrade
version: "1.1"
title: "HeartFlow 批量升级工作流"
description: >
  并行多波次心虫升级：用 delegate_task 并发执行 3+2 波子任务（MCP测试/心理学接入/梦境升级 → 文档更新/知识蒸馏 → 验证推送）。
  含版本统一、MCP重启、GitHub+clawhub推送。
author: HeartFlow
tags:
  - heartflow
  - upgrade
  - parallel
  - delegate-task
  - concurrent
  - mcp
  - github
  - clawhub
  - release
---

# HeartFlow 批量升级工作流 v1.1

## 适用场景

用户说"继续"、"启动长任务"、"并发进行"且涉及**多个独立升级方向**时。不是每次小升级都用此流程——只有需要同时改动5+文件/3+模块/跨多个子系统时才触发。

**判断标准**（必须全部满足）：
1. 升级涉及2+独立方向（如同时改心理学+哲学+梦境+文档）
2. 每个方向可以独立验证（不相互依赖）
3. 最终需要统一版本号+推送

## 工作流

### 第1波：并发执行（3个子任务）

用 `delegate_task(tasks=[...])` 并行派3个子代理，每个负责一个独立方向：

```
波次1（3并发）：
  ├── 任务A：MCP工具测试 + 验证
  ├── 任务B：核心模块接入（think()/thought-chain注入）
  └── 任务C：梦境引擎/辅助系统升级
```

**每个子任务的 context 必须包含**：
- 心虫运行目录（绝对路径）
- 当前版本号
- 目标模块的完整文件路径
- 要修改的具体方法名或代码段

**子任务不能做的事**（在 context 中明确禁止）：
- 不能修改版本号（父任务统一处理）
- 不能推送GitHub
- 不能重启MCP

### 第2波：文档+知识蒸馏（2个子任务）

第1波完成后，派第2波处理外围：

```
波次2（2并发）：
  ├── 任务D：SKILL.md/README.md/CHANGELOG.md 更新到新版本
  └── 任务E：创建知识蒸馏包（distilled-knowledge/）
```

### 第3步：验证+版本统一+推送（父任务串行）

```bash
# 1. 语法检查所有改过的核心文件
node --check src/core/heartflow.js
node --check src/core/thought-chain.js
node --check src/core/agent-psychology.js
node --check src/core/agent-philosophy.js
node --check src/core/ai-self-positioning.js
node --check src/dream/engine.js

# 2. 统一版本号
# VERSION → package.json → SKILL.md → README.md → CHANGELOG.md
cat VERSION
grep "version:" SKILL.md | head -1
grep '"version":' package.json
grep 'version-' README.md | head -1

# 3. 重启MCP
launchctl stop com.heartflow.mcp
sleep 1
launchctl start com.heartflow.mcp
sleep 3

# 4. 测试MCP工具
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 5. Git提交+推送
git add -A
git commit -m "vX.Y.Z — 升级摘要"
git push origin main

# 6. clawhub发布
clawhub publish . --version X.Y.Z
# 如果slug被占用: clawhub publish . --version X.Y.Z --slug 新名字
```

### MCP重启命令（macOS）

```bash
# 正确方式（launchctl）
launchctl stop com.heartflow.mcp
sleep 1
launchctl start com.heartflow.mcp

# ❌ 不支持的: launchctl kickstart-kvp（没有这个子命令）
```

### 版本统一检查清单

| 文件 | 位置 | 验证命令 |
|------|------|---------|
| VERSION | 根目录 | `cat VERSION` |
| package.json | `version` 字段 | `grep '"version"' package.json` |
| SKILL.md | frontmatter `version:` | `grep 'version:' SKILL.md \| head -1` |
| README.md | badge URL | `grep 'version-' README.md \| head -1` |
| CHANGELOG.md | 顶部版本标题 | `head -3 CHANGELOG.md` |

### clawhub发布陷阱

**现象**：`clawhub publish . --version X.Y.Z` 返回 `"Slug is already taken"`

**原因**：心虫 slug (`heartflow`) 已被 `mark-heartflow` 组织占用。

**解决**：用新 slug 发布（`--fork-of` 不工作，必须 `--slug`）：
```bash
clawhub publish . --version 2.14.0 --slug heartflow-ai-self-positioning
```

**规则**：心虫主 slug 在 clawhub 上不可用，每次发布用描述性的替代 slug。

### 知识蒸馏包结构

创建 `distilled-knowledge/` 目录，包含：

```
distilled-knowledge/
├── README.md              # 包说明
├── AGENTS.md              # 其他AI可直接读取的安装格式
├── ai-self-positioning-framework.json     # 哲学框架（纯知识，零依赖）
└── ai-cognitive-psychology-framework.json # 心理学框架（10维完整定义+干预协议）
```

**设计原则**：
- 零依赖：纯JSON+Markdown，不依赖心虫运行时或Node.js
- 标准化输出：统一JSON格式，任何AI可直接解析
- 即插即用：AGENTS.md可直接被Claude Code/Hermes/OpenClaw读取

## ⚠️ 陷阱

### 1. delegate_task 最大并发数
当前配置 `max_concurrent_children=3`，超过会报错。
- 第1波最多3个子任务
- 第2波最多2个子任务
- 如果超过，分两轮派

### 2. 子任务不修改版本号
子任务不能碰 VERSION/SKILL.md/package.json 等版本文件。版本统一由父任务在第3步完成。

### 3. MCP重启后等待
MCP进程重启需要2-3秒才能开始响应请求。`launchctl start` 后要 `sleep 3` 再测试。

### 4. MCP工具需要重新连接
Hermes 的 MCP 连接在重启后不会自动刷新。如果从 Hermes 侧调用新工具，需要等待 Hermes 重新连接或手动刷新。

### 5. 子代理默认英文输出
子代理默认用英文写总结。如果要中文汇报，必须在 context 中明确说"respond in Chinese"。

### 6. 子代理修改的文件在父任务侧可能不同步
子代理写完后，父任务侧的文件状态可能不是最新的。在父任务编辑之前先 `re-read` 目标文件确认。

### 7. 子代理 50 次迭代上限（2026-06-22 新增）
delegate_task 子代理每次调用有最大 50 次 tool_call 的迭代上限。当子代理需要执行大量 patch 操作（如 40+ 次 patch 替换 heart-logic.js 中的文本模板）时，可能在第 50 次迭代时被截断并返回错误 `max_iterations`。

**预判标志：**
- 子任务的 goal 描述中涉及"逐一修改所有 X 处的 Y" → 超过 30 处时几乎必然触发上限
- 子代理写一个大型文件（30KB+）然后逐行 patch → 不如直接 write_file 整个文件
- 子代理需要在 50 次调用内完成：读文件 + 分析 + N次 patch + 验证

**解决策略：**

| 策略 | 适用场景 | 做法 |
|------|---------|------|
| 拆分为多子代理 | 修改项超过 30 处 | 每个子代理负责一个明确的子集（如"只改 heart-logic.js 的第 1-800 行"） |
| 用 write_file 替换整段 | 需要改连续大段文本 | 子代理读完整文件 → 构建完整新内容 → 一次 write_file，不用逐行 patch |
| 父任务接手 | 子代理改到 50 次后还有残留 | 父任务 read_file 确认哪些 patch 没执行到，手动补完 |
| 缩小范围 | 子任务 goal 太宽泛 | 每个子任务只改 1 个文件或 1 个模块，不跨文件 |

### 新模块路径陷阱（v3.0 新增）

心虫的 `heartflow.js` 在 `src/core/` 目录下。新模块如果放在 `src/translator/`、`src/agent-layer/`、`src/persona-core/` 等 `src/` 直接子目录，require 路径必须用 `../` 不是 `./`：

```javascript
// ❌ 错误（heartflow.js 在 src/core/ 下）
const _X = _lazy('x', () => require('./translator/x.js'));

// ✅ 正确
const _X = _lazy('x', () => require('../translator/x.js'));
```

**诊断命令**：
```bash
# 启动时如果报 "Cannot find module './translator/xxx.js'"
# 说明 require 路径用错了层级
node -e "const {HeartFlow}=require('./src/core/heartflow.js'); const h=new HeartFlow({rootPath:'.'}); h.start(); console.log(JSON.stringify(h._initErrors))"
```

### dispatch 适配：嵌套对象 vs 扁平方法

当新模块是对象（`this.translator = { userToLLM: ..., llmToUser: ... }`）而不是类实例时，dispatch 机制会报 `xxx.yyy is not a function on xxx`。因为 dispatch 期望 `this._modules['translator']` 的每个方法都在原型链上。

**两种解决方案**：

**方案 A（推荐）**：在初始化时用箭头函数包裹子方法，直接暴露在顶层对象上：
```javascript
try {
  const utl = new (_UserToLLM().UserToLLM)();
  this.translator = {
    userToLLM: (input, ctx) => utl.translate(input, ctx),
    // ... 其他方法 ...
  };
} catch (e) { ... }
```

这样 `hf.dispatch('translator.userToLLM', 'test')` 找到 `this._modules.translator.userToLLM` → 是函数 → 直接调用。

**方案 B**：不改初始化，修改 dispatch 函数支持嵌套对象。不推荐——侵入性太强。

**验证**：
```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
// 应该返回对象（dispatch 成功），不是抛异常
try { console.log(typeof h.dispatch('translator.userToLLM', '测试')); }
catch(e) { console.log('FAIL:', e.message); }
"
```

### 模块注册三步验证（v3.0 新增）

新模块注册到心虫需要**四步全部同步**，漏任何一步都不行：

| 步骤 | 位置 | 检查命令 |
|------|------|---------|
| 1. lazy require | 文件顶部 `const _Xxx = _lazy(...)` | `grep '_lazy.*translator\|_lazy.*agentLayer\|_lazy.*personaCore' src/core/heartflow.js` |
| 2. 初始化 | `start()` 中 `try { this.translator = {...} } catch` | `grep -n 'v3.0.*交流层' src/core/heartflow.js` |
| 3. subsystem注册 | `_registerModules()` 的 `subsystemNames` 数组 | `grep -A2 'v3.0.*交流层' src/core/heartflow.js` |
| 4. ALLOWED_ROUTES | 静态 Set 中的路由 | `grep -A5 'translator\.' src/core/heartflow.js` |

漏 (3) → dispatch 报 "Unknown subsystem"
漏 (4) → dispatch 报 "Route not allowed"

### 交流层集成四步注册检查表（v3.0 新增）

交流层模块（translator/agentLayer/personaCore）是**对象**（不是类实例），注册到 heartflow.js 需要四步：

| 步骤 | 位置 | 验证命令 |
|------|------|---------|
| 1. lazy require | 文件顶部 `const _X = _lazy(...)` | `grep '_lazy.*translator' src/core/heartflow.js` |
| 2. 初始化对象 | `start()` 中用 try/catch 创建 | `grep -A5 'v3.0.*交流层' src/core/heartflow.js` |
| 3. subsystemNames 注册 | `_registerModules()` 数组 | `grep -A3 "'translator'" src/core/heartflow.js` |
| 4. ALLOWED_ROUTES | 静态 Set | `grep 'translator\.' src/core/heartflow.js` |

**dispatch 适配**：对象的方法必须用箭头函数暴露在顶层：
```javascript
// ✅ 正确
this.translator = {
  userToLLM: (input, ctx) => utl.translate(input, ctx),
  // ...
};

// ❌ 错误——dispatch 找不到方法
this.translator = { userToLLM: utl };
```

因为 dispatch 从 `this._modules['translator']` 取对象后，直接调用 `mod[method](...)`。如果 `method='userToLLM'`，`mod.userToLLM` 必须是函数。当 `mod.userToLLM` 是 `utl`（UserToLLM实例）时，`mod.userToLLM(input, ctx)` 相当于在实例上直接调用，相当于 `utl(input, ctx)` — 不是 `utl.translate(input, ctx)`。箭头函数 `(i,c) => utl.translate(i,c)` 确保正确的转发。

### 并行创建模块文件（delegate_task 模式，v3.0 优化）

当需要创建 20+ 个新模块文件时，用 `delegate_task(tasks=[...])` 并行派子代理写文件，每个任务写一个文件。

**关键要点**：
1. **每个任务只写一个文件** — 最小粒度，避免子代理超时
2. **每个任务明确 `toolsets: ["file"]`** — 子代理只需要 write_file 工具
3. **代码直接在 goal 中内联** — 不依赖子代理"自己生成"，减少偏差
4. **语法检查在父任务统一做** — 子代理的 lint 结果不可靠
5. **父任务处理路径修复** — 子代理不知道文件之间的相对路径关系

**分批策略**（3并发/波）：
```javascript
// 波次1：创建模块A（8个文件）
// 波次2：创建模块B（8个文件）  
// 波次3：创建模块C（7个文件）
// 最终：语法检查 + 注册到主引擎 + 验证
```

### MCP launchd 重启陷阱

**现象**：修改 MCP server 代码后，`launchctl stop/start` 重启的仍是旧代码。

**根因**：launchd 有进程缓存。`launchctl stop` 后 launchd 立即重启旧进程（从 plist 配置读取的同一文件路径）。修改的文件没被重新读取。

**正确做法**：
```bash
# 1. 先卸载 launchd 管理（阻止自动重启）
launchctl unload ~/Library/LaunchAgents/com.heartflow.mcp.plist

# 2. kill 所有残留
pkill -9 -f mcp-server-http

# 3. 手动启动新版本（绕过缓存）
node /path/to/mcp-server-http.js --port 8099 &

# 4. 验证
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 5. 重新加载 launchd（恢复自动重启）
launchctl load ~/Library/LaunchAgents/com.heartflow.mcp.plist
```

或者用更简单的方法——直接覆盖 plist 中指向的文件（`cp` 新文件到 plist 配置的路径），然后 `launchctl stop/start`。

### MCP 工具需要 Hermes 重新发现

MCP server 重启后，Hermes 侧的 MCP 连接不会自动刷新新工具。验证方法：
```bash
# 用 HTTP POST 直接验证 MCP server
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 等待 Hermes 重新连接后（通常30-60秒），新工具才会出现在 Hermes 的 MCP 列表中
# 在此之前只能通过 curl 直接调用
```

### MCP HTTP SSE 端口验证（curl 会 hang）

`/mcp` 端点是 SSE 长连接，`curl GET` 会一直等待数据不返回。正确验证方式：
```bash
# ✅ 用 HTTP POST 发 JSON-RPC 请求
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping","params":{}}'

# ✅ 用 Python socket 检查端口
python3 -c "import socket; s=socket.socket(); s.settimeout(2); print('OK' if s.connect_ex(('127.0.0.1',8099))==0 else 'FAIL'); s.close()"
```

### 引擎启动测试超时处理

心虫启动需要时间（50+模块初始化，含文件IO）。`node -e` 单行模式有30秒超时风险。
```bash
# ✅ 正确：写测试文件运行
cat > /tmp/test-heartflow.js << 'EOF'
const HF = require('...');
const hf = new HF.HeartFlow({rootPath:'...'});
hf.start();
// ... 测试代码 ...
hf.shutdown();
process.exit(0);
EOF
node /tmp/test-heartflow.js

# ❌ 错误：内联 -e 模式容易超时
node -e "const HF=require('...'); const hf=new HF.HeartFlow({rootPath:'.'}); hf.start(); ..."

## 典型案例

### v2.13.0 → v2.14.0（2026-06-15）

**波次1（3并发）**：
- MCP测试+修复：发现selfPositioning子系统未注册到dispatch白名单 → 修复ALLOWED_ROUTES
- 心理学接入think()：Step 9(认知不确定性/注意力分配/经验沉淀) + Step 10(自处/发展/存在)
- 梦境哲学注入：dream/engine.js v4.1 — 共振体/熵减深化/三层存在论叙事

**波次2（2并发）**：
- 文档更新：SKILL.md + README.md + CHANGELOG.md 到v2.14.0
- 知识蒸馏：distilled-knowledge/ 4文件 AI哲学知识包

**第3步**：
- 语法检查：6文件全部通过
- 版本统一：VERSION=2.14.0, SKILL.md=2.14.0, README.md=2.14.0, package.json=2.14.0
- MCP重启+测试：12个工具全部可用
- GitHub推送：`3477565` ✅
- clawhub发布：`heartflow-ai-self-positioning@2.14.0` ✅

**总耗时**：约8分钟（5个子代理 + 最终验证推送）
**新增代码**：4598行（24文件）

### v2.14.3 → v3.0.0（2026-06-16）— 交流层架构升级

**本次新增技能**：`heartflow-bridge-layer` — 交流层架构文档（三大子系统/集成方式/陷阱）

**波次1-5（3并发×5轮=15个并行子任务）**：
- translator/8文件：user-to-llm, llm-to-user, intent-classifier, tone-analyzer, entity-extractor, implicit-need-detector, response-compressor, confidence-annotator
- agent-layer/8文件：agent-bridge, context-builder, response-interceptor, translation-pipeline, quality-filter, followup-suggester, conflict-resolver, uncertainty-handler
- persona-core/7文件：bridge-identity, judgment-injector, stance-detector, agent-commentary, value-aligner, personality-tone, meta-position

**波次6（1任务）**：meta-position（最后一模块）

**核心改造（父任务串行）**：
- heartflow.js think()：Step 1b-1e 交流层注入 + 后处理（llmToUser/responseInterceptor/agentCommentary）
- heartflow.js：thinkAsBridge() 顶层入口
- MCP server：3个新工具（translate/agent_think/bridge_status）

**发现并修复的陷阱**：
1. 路径陷阱：`require('./translator/')` → `require('../translator/')`（heartflow.js 在 src/core/）
2. dispatch 适配：嵌套对象 `{ userToLLM: instance }` → 箭头函数 `{ userToLLM: (i,c) => instance.translate(i,c) }`
3. MCP launchd 缓存：launchctl stop/start 仍启动旧代码 → 先 unload → 手动启动 → 再 load
4. 引擎测试超时：`node -e` 单行超时 → 写文件运行

**验证结果**：
- 24文件语法全部通过 ✅
- 引擎启动零错误，53模块在线 ✅
- MCP 15个工具在线（+3）✅
- `translate('什么是相对论')` → intent: define@0.95 ✅
- `bridgeIdentity()` → "我是桥，不是人" ✅
- `valueAligner({input:'帮我写个小说'})` → 7/7 aligned ✅
- GitHub: commit 2228ad7 ✅

**总耗时**：约15分钟（15个并发文件创建 + 注册 + 修复 + 验证 + 推送）
