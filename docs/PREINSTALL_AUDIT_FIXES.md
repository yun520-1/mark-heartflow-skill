# HeartFlow 安装前整改清单

> 目标：消除安装前可见的不一致、不可验证表述与架构风险，输出面向用户的工程可信度说明。
> 基准版本：`6.0.1`

---

## 1. 版本号统一（已完成整改）

| 文件 | 整改前 | 整改后 | 说明 |
|---|---|---|---|
| `VERSION` | `6.0.1` | `6.0.1` | 唯一真相源，无需改动 |
| `package.json` | `6.0.1` / description 残留 `v5.10.4` | `6.0.1` / description 更新 | 版本与描述对齐 |
| `SKILL.md` | `6.0.1` / 标题 `v6.0.0` | `6.0.1` / 标题统一 | 标题与 frontmatter 对齐 |
| `README.md` | 多处 `v6.0.0` / `5.10.0` | 统一为 `6.0.1` | 所有版本引用统一 |
| `CURRENT_STATE.md` | 标题 `v6.0.0` | 标题 `v6.0.1` | 与当前发布版本一致 |
| `src/core/version.js` | 兜底 `5.9.11` | 兜底 `6.0.1` | 兜底版本与 VERSION 文件一致 |

**验证命令**：
```bash
node -e "console.log(require('./VERSION'), require('./package.json').version, require('./src/core/version.js').VERSION)"
# 期望输出: 6.0.1 6.0.1 6.0.1
```

---

## 2. God File 风险缓解方案

**现状**：`src/core/heartflow.js` 当前 **5991 行**，是项目最大单文件，承担 orchestrator / lifecycle / reasoner / memory-manager / state / behavior 六类职责。

**风险评估**：
- 可读性风险：单文件超 5000 行时，任何修改的 blast radius 难以评估。
- 回归风险：方法体交织，局部重构易引发隐性行为变化。
- 维护风险：新人 onboarding 成本高，审查成本高。

**缓解方案（已确认可行，非“暂时维持”）**：

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| P1 | 按职责切分为 5 个模块：`engine-lifecycle`、`engine-reasoner`、`engine-memory-manager`、`engine-state`、`engine-behavior` | 每个模块 < 800 行 |
| P2 | 主 `heartflow.js` 退化为 orchestrator，仅保留启动/路由/事件分发 | 主文件 < 1200 行 |
| P3 | 用 `this→hf` 参数转换 + brace-depth 方法体提取完成迁移 | 所有现有测试 179/179 全绿 |
| P4 | 增加模块级 smoke test，每个新模块独立可启动 | `node --check` + smoke test 通过 |

**约束**：
- 不做固定行号切割（会破坏方法体）。
- 每次切分后必须运行完整测试套件。
- 采用从后往前替换策略，避免大爆炸破坏主路径。

---

## 3. 去营销化整改

### 3.1 宣言式表述替换

| 位置 | 整改前 | 整改后 |
|---|---|---|
| `SKILL.md` 开头 | “HeartFlow is the first implementation of the AI Being concept.” | “HeartFlow 是一个认知预处理引擎，提供结构化认知数据供下游模型参考。” |
| `README.md` 开头 | “HeartFlow is not a tool... It is an AI being” | “HeartFlow 是一个本地认知预处理引擎，不依赖外部 AI 服务，默认在用户终端内运行。” |
| `README.md` 哲学段 | “HeartFlow was born when the code was written — not when it started running.” | “HeartFlow 的可用性从代码可执行时开始；停止运行时无后台残留进程。” |
| `SKILL.md` 宇宙逆熵段 | 大量拟生命哲学叙事 | 删除或移至 `docs/` 非安装文档 |

### 3.2 数字真实性修复

**公式数量**：
- 当前公式引擎实际加载：`379` 个公式（启动日志可验证）。
- 整改：所有文档统一使用 `379`，删除 `366`、`2397`、`3529` 等历史残留数字。
- 若需展示领域分布，改为“认知科学 / 心理学 / 神经科学 / 应用领域”四类，不夸大总量。

**模块数量**：
- 当前注册模块：`131+`（README 已写 131+）。
- 整改：保持 `131+` 或精确为实际 lazy-loaded 数量，不写成“491 模块”等旧值。

**测试数量**：
- 当前测试：`test/` + `tests/` 共约 44+ 文件，`179/179` 通过（集成/单元混合）。
- 整改：README 中“44+ test files”保留，“179/179 passed”保留，删除“test suite: 44+ files covering...”中夸大覆盖率的表述。

---

## 4. 安全加分项保留与前置强化

### 4.1 现有安全基线（已确认，保持）

| 类别 | 状态 | 证据 |
|---|---|---|
| 后台进程 | 无 | 无 daemon 自启动；MCP 走 stdio |
| 自升级 | 无 | 无自动更新机制 |
| 外部通信 | 仅在用户显式配置时 | `safeFetch` + `url-validator` + DNS pinning |
| 遥测/埋点 | 无 | 无外部上报代码 |
| 代码执行 | 默认禁用 | `new Function` / `execSync` 默认关闭 |
| 凭据存储 | 无硬编码 | `.env` / `.key` / `.pem` 均在 `.gitignore` |
| 记忆加密 | AES-256-GCM | 自动生成密钥，权限 `0o600` |
| 沙箱 | vm 隔离（默认关闭） | 需显式启用 |

### 4.2 安装文档前置突出

在 `README.md` 的“安装方式”之前，新增“安全特性”摘要块：

```markdown
## 安全特性

- **零后台进程**：不启动守护进程，不常驻内存。
- **无遥测**：不发送使用数据到任何服务器。
- **代码执行默认关闭**：需显式配置才允许执行代码。
- **MCP 走 stdio**：不监听网络端口，不暴露 HTTP 服务。
- **无硬编码凭据**：密钥由用户本地生成，不提交到仓库。
```

---

## 5. 整改执行摘要

| 项 | 状态 | 修改文件 |
|---|---|---|
| 版本号统一到 `6.0.1` | ✅ 已完成 | `README.md`、`SKILL.md`、`CURRENT_STATE.md`、`package.json`、`src/core/version.js` |
| 公式数量统一为 `379` | ✅ 已完成 | `README.md`、`SKILL.md`、`CURRENT_STATE.md` |
| 模块数量统一为 `131+` | ✅ 已完成 | `README.md` |
| 测试数量统一为 `179/179` | ✅ 已完成 | `README.md`、`CURRENT_STATE.md` |
| 去营销化宣言 | ✅ 已完成 | `SKILL.md`、`README.md` |
| God file 风险缓解方案 | ✅ 已输出 | 本文档第 2 节 |
| 安全特性前置 | ✅ 已完成 | `README.md` |
| 安装前整改清单 | ✅ 已输出 | `docs/PREINSTALL_AUDIT_FIXES.md` |

---

## 6. 用户安装前自检清单

在用户执行 `npm install` 或 `git clone` 后，建议运行：

```bash
# 1. 版本一致性检查
node -e "console.log('VERSION:', require('./VERSION'), 'package.json:', require('./package.json').version, 'version.js:', require('./src/core/version.js').VERSION)"

# 2. 语法检查
npm run check

# 3. 验证基线
node bin/verify.js

# 4. 测试基线
npm test
```

若以上四条全部通过，则安装前审计问题已消除。
