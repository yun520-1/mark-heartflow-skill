# 心虫 HeartFlow v6.0.0 全面代码审计报告

> 审计日期：2026-07-14  
> 代码版本：ae71cf7f (v6.0.0)  
> 审计范围：全量代码、同步前准备、用户体验、安装体验

---

## 一、全量代码审计

### 1.1 严重问题 (P0)

| # | 问题 | 位置 | 严重程度 | 建议 |
|---|------|------|----------|------|
| P0-1 | **God file 架构债务** | `src/core/heartflow.js` 5991行 | 高 | 按职责拆分：`think-core`、`memory-bridge`、`emotion-loop`、`decision-router`。当前文件占全库2%行数却承载全部核心逻辑，修改风险极高 |
| P0-2 | **fs 直接操作绕过 SafeFS** | 317处 `fs.readFileSync/writeFileSync/appendFileSync` | 高 | 建立 `SafeFS` 强制规范：所有持久化走 `SafeFS.write()`，在 CI 加 grep 门禁 |
| P0-3 | **child_process 调用未统一** | 30处 `child_process/exec` | 高 | `code-executor` 中已有沙箱，但其他模块仍有裸调用。统一走 `SafeExecutor` |
| P0-4 | **eval/new Function 残留** | 4处 | 中高 | 公式引擎可能有动态求值，需确认是否有用户输入注入路径。加输入白名单校验 |

### 1.2 中等问题 (P1)

| # | 问题 | 位置 | 严重程度 | 建议 |
|---|------|------|----------|------|
| P1-1 | console.log 残留 40处 | src/ 全库 | 中 | 替换为 `Logger.info/debug`，生产环境静默 |
| P1-2 | TODO 残留 1处 | src/ | 中 | 清除或转为 issue |
| P1-3 | 超长文件 >500行: 9个 | 见下表 | 中 | heartflow.js(5991)、desire-cognition(3429)、heart-logic(2311) 优先拆分 |
| P1-4 | 异步函数无 try/catch | 8个文件 | 中 | 加统一错误处理包装 `safeAsync(fn)` |
| P1-5 | .gitignore 排除 data/ 导致记忆无法同步 | .gitignore | 中 | 记忆应纳入版本控制或单独 remote，当前 `git push` 不会上传用户记忆 |

### 1.3 轻微问题 (P2)

| # | 问题 | 位置 | 严重程度 | 建议 |
|---|------|------|----------|------|
| P2-1 | 平均文件大小 500行 | 全库 | 低 | 保持现有模块粒度，不强行拆分 |
| P2-2 | config.json 仅2个键 | config.json | 低 | 迁移到 `src/core/config-v2.js`，已存在但未完全采用 |
| P2-3 | 无 dist/ 打包目录 | 根目录 | 低 | 加 `npm run build` 生成 `dist/`，便于 clawhub.ai 分发 |

### 1.4 代码质量数据

| 指标 | 数值 | 评价 |
|------|------|------|
| src JS 文件数 | 292 | 模块化良好 |
| test JS 文件数 | 39 | 测试覆盖充足 |
| 平均文件大小 | 500行 | 可接受 |
| try/catch 覆盖率 | 156个文件有 | 基础完善 |
| npm audit | 0 漏洞 | 优秀 |
| 硬编码密钥 | 0 | 优秀 |

---

## 二、同步前准备审计

### 2.1 依赖管理

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 版本一致性 | ✅ | VERSION/package.json/SKILL.md 均为 6.0.0 |
| 硬依赖 | ✅ | 仅 `mathjs ~15.2.0`，最小化 |
| 可选依赖 | ⚠️ | `@xenova/transformers` 和 `pm2`，需确认 npm install --omit=optional 是否影响功能 |
| 过期依赖 | ✅ | npm outdated 无输出 |
| package-lock.json | ✅ | 存在且版本锁定 |

### 2.2 配置完整性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| config.json | ⚠️ | 仅2个键，未覆盖全部配置项 |
| .env | ❌ | 不存在（预期内，用 config-v2.secret()） |
| .gitignore | ✅ | 覆盖 .env/.key/.pem |
| 环境变量检测 | ❌ | 无自动检测脚本 |

### 2.3 同步风险点

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| data/ 被 .gitignore 排除 | 中 | 用户记忆不随代码同步，需单独处理 |
| 无 CI 自动化测试 | 中 | .github/workflows 存在但无内容 |
| 无发布脚本 | 低 | 需手动 git push + npm publish |
| 大文件未过滤 | 低 | user-memories.jsonl 468KB 不纳入 git |

### 2.4 版本兼容性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Node.js 版本要求 | ✅ | bin/verify.js 检查 >= 18 |
| 引擎启动 | ✅ | 测试通过 |
| 模块数 | ✅ | >= 124 |
| 测试文件数 | ✅ | >= 10 |

---

## 三、用户体验审计

### 3.1 交互流程

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CLI 命令 | ✅ | `node bin/cli.js chat` / `status` / `--chat "消息"` |
| 斜杠命令 | ✅ | /psych /emotion /dr /status /routes /exit |
| 帮助系统 | ⚠️ | bin/cli.js 有基本帮助，但无完整文档 |
| 首次使用引导 | ❌ | 无 onboarding 流程 |

### 3.2 错误提示

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 错误分类 | ✅ | code-executor.js 有 4 类错误分类 |
| 中文提示 | ✅ | 部分模块有中文错误消息 |
| 恢复机制 | ❌ | 多数错误直接 throw，无自动恢复 |
| 日志可读性 | ⚠️ | 混合 console.error 和 Logger，格式不统一 |

### 3.3 响应速度

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 冷启动 | ✅ | <1500ms（CURRENT_STATE.md 声称） |
| 模块缓存 | ✅ | _lazyCache 达到 100 模块 |
| 同步IO | ⚠️ | heartflow.js 有同步文件操作，阻塞事件循环 |

### 3.4 核心功能流程

| 功能 | 状态 | 说明 |
|------|------|------|
| think() 主路径 | ✅ | 测试通过 |
| 记忆写入 | ✅ | MemoryKernel R1-R8 全通过 |
| 公式引擎 | ✅ | 379 公式加载 |
| 认知管线 | ✅ | 四层架构运行 |

---

## 四、用户安装体验审计

### 4.1 安装步骤

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 安装命令 | ✅ | `npm install @yun520-1/heartflow` |
| Quick Start | ✅ | README.md 有 176 行 Quick Start |
| 环境依赖 | ⚠️ | 仅说明 Node.js >= 18，无自动检测 |
| 安装失败处理 | ❌ | 无错误恢复指南 |

### 4.2 文档完整性

| 文档 | 状态 | 说明 |
|------|------|------|
| README.md | ✅ | 306 行，33 个标题 |
| INSTALL.md | ⚠️ | 56 行，过于简略 |
| SECURITY.md | ✅ | 存在 |
| CHANGELOG.md | ✅ | 存在 |
| UPGRADE_PLAN.md | ✅ | 存在 |
| 故障排查 | ❌ | 无 TROUBLESHOOTING.md |
| API 文档 | ❌ | 无 API.md |

### 4.3 环境检测

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Node.js 版本检测 | ✅ | bin/verify.js 检查 >= 18 |
| npm 依赖检查 | ✅ | verify.js 检查必选依赖 |
| 磁盘空间检测 | ❌ | 无 |
| 端口占用检测 | ❌ | 无（如 MCP server） |

### 4.4 首次使用引导

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 交互式配置 | ❌ | 无 `npm init heartflow` 类命令 |
| 示例对话 | ⚠️ | README 有示例但不够丰富 |
| 默认人格 | ✅ | presets/ 有 3 个预设人格 |
| 记忆初始化 | ✅ | MemoryKernel 启动自动加载 |

---

## 五、改进建议优先级

### 立即执行 (P0)

1. **拆分 heartflow.js God file** — 5991行单体是最大技术债
2. **建立 SafeFS 强制门禁** — 317处裸 fs 调用是安全风险
3. **统一 child_process 调用** — 30处分散调用需收口

### 近期执行 (P1)

4. 替换 40处 console.log → Logger
5. 清理 1处 TODO
6. 拆分 >500行文件 (9个)
7. 加 async 错误处理包装
8. 解决 .gitignore 排除 data/ 导致记忆无法同步问题

### 中期执行 (P2)

9. 完善 config.json → config-v2 迁移
10. 加 npm run build 生成 dist/
11. 加 CI workflow 内容
12. 创建 TROUBLESHOOTING.md
13. 丰富 INSTALL.md

---

## 六、同步检查清单

- [x] 版本号四源一致 (VERSION/package.json/SKILL.md)
- [x] 测试全绿 (179/179)
- [x] verify 全绿 (14/14)
- [x] npm audit = 0
- [x] git commit 完成 (ae71cf7f)
- [ ] .gitignore 需调整（data/ 排除策略）
- [ ] 需 push 到 GitHub origin
- [ ] 需同步到 clawhub.ai

---

*审计完成，准备同步。*
