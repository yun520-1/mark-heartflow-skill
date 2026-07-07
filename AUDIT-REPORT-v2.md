# 心虫（HeartFlow）v5.8.3 全面安全与代码质量审计报告

**审计日期**: 2026-07-07  
**审计范围**: `src/` 全部 333 个 JS 文件，162,511 行代码 + `mcp/` 服务器  
**审计框架**: OWASP Top 10 (2021) + 五轴代码质量审查  
**审计方法**: 静态代码分析 + 沙箱逃逸实机验证 + 模式匹配扫描  

---

## 执行摘要

| 严重级别 | 数量 | 说明 |
|----------|------|------|
| 🔴 **BLOCKING** | 4 | 必须立即修复，存在可被利用的安全漏洞 |
| 🟠 **REQUIRED** | 8 | 应在下一版本修复，存在安全风险或严重质量问题 |
| 🟡 **SUGGESTION** | 7 | 建议改进，提升代码质量和可维护性 |
| 🟢 **POSITIVE** | 6 | 已正确实施的安全措施 |

**总体评估**: 心虫引擎在 MCP 服务器认证、错误信息过滤、速率限制等方面做得较好，但在**代码执行沙箱**和**内存增长防护**方面存在严重缺陷。沙箱隔离可被原型链逃逸完全绕过，`execSync` 直接执行用户代码构成命令注入风险。

---

## 🔴 BLOCKING 级别发现

### B-01: code-executor.js execSync Shell 注入 (OWASP A03: Injection)

**文件**: `src/code/code-executor.js:648-651`  
**严重性**: 🔴 CRITICAL  
**OWASP 分类**: A03:2021 – Injection

**问题**: 
```javascript
const execSync = require('child_process').execSync;
const result = execSync(code, {
  timeout,
  encoding: 'utf-8',
  maxBuffer: MAX_OUTPUT_LIMIT,
  shell: '/bin/bash'
});
```

`code` 参数被直接传入 `execSync` 并通过 `/bin/bash` 执行。虽然存在 `DANGEROUS_COMMANDS` 黑名单（第84-93行），但黑名单方式本质上不可靠：

**绕过向量**:
1. **变量间接**: `a="rm"; b="-rf"; $a $b /` — 变量拼接绕过正则
2. **十六进制编码**: `\x72\x6d\x20\x2d\x72\x66\x20\x2f` — 编码绕过
3. **子字符串**: `r''m -r''f /` — 空字符串拼接
4. **函数间接**: `declare -f evil_func; evil_func` — 函数定义绕过
5. **进程替换**: `<(echo rm -rf /)` — 进程替换绕过

**修复建议**:
- 方案A（推荐）: 完全移除 `shell: '/bin/bash'` 模式，所有 shell 执行改为 `execFileSync` + 数组参数
- 方案B: 如必须保留 shell 模式，改用**白名单**机制（只允许特定命令+参数组合）
- 方案C: 引入系统级沙箱（Docker/namespace/seccomp）隔离执行环境

**缓解因素**: 需 `HEARTFLOW_CODE_EXECUTOR_ENABLED=true` 才启用

---

### B-02: executable-reasoning.js 沙箱原型链逃逸 (OWASP A03: Injection)

**文件**: `src/reasoning/executable-reasoning.js:105-124`  
**严重性**: 🔴 CRITICAL  
**OWASP 分类**: A03:2021 – Injection

**问题**: `__safeGlobals` 沙箱通过将危险全局变量设为 `undefined` 参数来"屏蔽"，但**未阻止原型链访问**。

**实机验证结果**（全部成功逃逸）:
```
原型链逃逸: 成功（可访问全局 this）
arguments.callee 逃逸: 成功
this 绑定: 可访问 global
__safeGlobals 构造器逃逸: 成功获取 require
```

**具体逃逸代码**:
```javascript
// 逃逸1: 获取 require
({}).constructor.constructor('return require')()

// 逃逸2: 获取 process
this.process

// 逃逸3: 通过 __safeGlobals 自身
__safeGlobals.constructor.constructor('return process')()
```

**根本原因**: `new Function()` 创建的函数仍可访问 JavaScript 原型链，`Object.constructor` 即 `Function` 构造器，可重建任意全局引用。

**修复建议**:
- 方案A（推荐）: 使用 `vm2` 或 `isolated-vm` 替代 `new Function()`，提供真正的进程级隔离
- 方案B: 在函数体前注入原型链冻结代码：
  ```javascript
  Object.freeze(Object.prototype);
  Object.freeze(Function.prototype);
  Object.freeze(Array.prototype);
  ```
- 方案C: 使用 `with({}){} + Proxy` 创建无原型作用域

---

### B-03: code-executor.js sandbox var 遮蔽可绕过 (OWASP A03: Injection)

**文件**: `src/code/code-executor.js:872-920`  
**严重性**: 🔴 CRITICAL  
**OWASP 分类**: A03:2021 – Injection

**问题**: sandbox() 方法使用 `var` 声明遮蔽危险全局变量，但**未遮蔽 Object/Array/Symbol/Proxy/Reflect/JSON/Math/Date/RegExp/Promise/Error** 等内置对象。

**实机验证结果**:
```
绕过1 Object.constructor: function  ← 成功获取 Function 构造器
绕过2 this: 被阻止（undefined）     ← this 在严格模式下为 undefined
绕过3 arguments.callee: 被阻止（严格模式） ← 严格模式阻止
绕过4 Array.constructor: object     ← 成功获取 process
```

虽然 `SANDBOX_BLOCKED_PATTERNS` 包含了 `constructor.constructor` 和 `Proxy` 的正则检测，但：
1. 正则检测可被编码/混淆绕过
2. `Object.constructor.constructor` 不在检测范围内（只检测了 `(0,constructor.constructor)` 和 `(1,constructor.constructor)` 和 `[]).constructor.constructor`）
3. `Reflect.construct` 虽在检测列表，但 `Reflect.get` 不在

**修复建议**: 同 B-02，需要进程级隔离而非词法级遮蔽

---

### B-04: logic-reasoning.js 硬编码用户绝对路径 (OWASP A01: Broken Access Control)

**文件**: `src/reasoning/logic-reasoning.js:1535`  
**严重性**: 🔴 HIGH  
**OWASP 分类**: A01:2021 – Broken Access Control

**问题**:
```javascript
try { apiKey = fs.readFileSync('/Users/apple/.hermes/skills/ai/mark-heartflow-skill/data/api-key.txt', 'utf-8').trim(); } catch(e) {}
```

1. **硬编码绝对路径** `/Users/apple/` — 在其他用户机器上必然失败
2. **API 密钥从文件读取后无校验** — 直接用于 curl 命令
3. **catch 块吞掉错误** — `catch(e) {}` 完全静默，无法诊断问题
4. **API 密钥通过 Python 子进程传递给 curl** — 可能出现在 `/proc/PID/cmdline` 中被其他用户读取

**修复建议**:
- 使用 `process.env.HOME` 或 `os.homedir()` 替代硬编码路径
- API 密钥应通过环境变量 `HEARTFLOW_API_KEY` 传入
- catch 块至少记录警告日志
- 使用 Node.js 原生 `https.request` 替代 curl 子进程

---

## 🟠 REQUIRED 级别发现

### R-01: 30+ 处未保护的 Map.set 调用 (OWASP A05: Security Misconfiguration)

**文件**: 多个 cortex/shield 模块  
**严重性**: 🟠 HIGH

**问题**: `heartflow.js` 已引入 `_boundedSet()` 辅助函数（带 LRU 淘汰和容量限制），但以下模块仍直接使用 `.set()` 无容量保护：

| 文件 | 未保护 .set() 数量 |
|------|-------------------|
| src/cortex/self-healing.js | 5 |
| src/cortex/world-model.js | 2 |
| src/cortex/reflexion-engine.js | 2 |
| src/cortex/self-healing-rl.js | 5 (qTable) |
| src/cortex/experience-collector.js | 3 |
| src/cortex/smart-upgrade-engine.js | 1 |
| src/cortex/skill-evolution-engine.js | 2 |
| src/cortex/self-correction-loop.js | 1 |
| src/cortex/self-evolution-core.js | 1 |
| src/shield/memory-integrity.js | 1 |
| src/shield/hooks-adapter.js | 3 |

**风险**: 长时间运行后 Map 无限增长，导致内存泄漏和 OOM

**修复建议**: 将所有 `.set()` 调用替换为 `_boundedSet()`，或为每个模块添加独立的容量常量

---

### R-02: 3365+ 处未保护的 Array.push 调用 (OWASP A05: Security Misconfiguration)

**文件**: 全代码库  
**严重性**: 🟠 HIGH

**问题**: `heartflow.js` 已引入 `_boundedPush()` 辅助函数（带 MAX_HISTORY_SIZE 限制），但全代码库仍有 3365 处直接 `.push()` 调用无容量保护。

**高风险 .push() 场景**:
- 错误历史数组（`_errors`、`_history`）
- 日志缓冲区
- 事件队列
- 搜索结果缓存

**修复建议**: 优先修复持续增长的数组（历史/日志/缓存），为每类数组设定合理容量上限

---

### R-03: 16 处动态 require() 调用 (OWASP A08: Software and Data Integrity Failures)

**文件**: 多个模块  
**严重性**: 🟠 MEDIUM

**问题**: 16 处非相对路径的 `require()` 调用，其中 2 处使用变量拼接：

```javascript
// heartflow.js:369-370
hf.strategySelector = new (require(baseDir + '/strategy-selector.js').StrategySelector)();
hf.replanTrigger = new (require(baseDir + '/replan-trigger.js').ReplanTrigger)();
```

**风险**: 如果 `baseDir` 可被外部控制，则可加载任意模块

**修复建议**: 
- 验证 `baseDir` 来源（应为 `__dirname` 或固定配置）
- 对拼接路径做 `path.resolve()` + 白名单校验

---

### R-04: 19 处 new RegExp() 动态正则 — ReDoS 风险 (OWASP A05: Security Misconfiguration)

**文件**: 多个模块  
**严重性**: 🟠 MEDIUM

**问题**: 19 处使用 `new RegExp(userInput)` 构造正则表达式，其中部分已做转义（如 `heart-logic.js:224` 使用 `p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`），但以下位置**未转义**：

- `src/shield/language-honesty.js:82,103` — `new RegExp(word, 'g')` 未转义
- `src/cortex/feedback-functions.js:313,331` — `new RegExp('\\b' + word + '\\b', 'gi')` 未转义
- `src/core/confidence-calibrator.js:317` — `new RegExp(word, 'gi')` 未转义
- `src/psychology/ai-psychology-engine.js:646,803` — `new RegExp(signal, 'gi')` 未转义

**风险**: 恶意构造的输入可触发正则回溯爆炸，导致 CPU 100% 和 DoS

**修复建议**: 所有 `new RegExp(dynamicInput)` 必须先转义特殊字符

---

### R-05: 6 处 fetch() 调用无 SSRF 防护 (OWASP A10: Server-Side Request Forgery)

**文件**: 
- `src/planner/self-initiator.js:697`
- `src/code/prompt-factory.js:360`
- `src/code/language-adapters/javascript-adapter.js:168`
- `src/search/hybrid-search.js:258,286`

**严重性**: 🟠 MEDIUM

**问题**: fetch 调用的 URL 来自配置对象或参数，未验证目标地址是否为内网地址。如果配置可被外部修改，攻击者可发起 SSRF 攻击访问内网服务。

**修复建议**:
- 对 fetch URL 做白名单校验（只允许特定域名）
- 阻止访问内网 IP（10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8）
- 阻止访问云元数据服务（169.254.169.254）

---

### R-06: 2 处 MD5 弱哈希使用 (OWASP A02: Cryptographic Failures)

**文件**:
- `src/cortex/hypothesis-tester.js:362` — `createHash('md5')`
- `src/memory/retrieval-anchor.js:42` — `createHash('md5')`

**严重性**: 🟠 LOW（用于去重/指纹，非安全场景）

**问题**: MD5 已知存在碰撞攻击，虽然此处仅用于去重指纹而非安全验证，但使用 SHA-256 是更好的实践。

**修复建议**: 替换为 `createHash('sha256')`，性能影响可忽略

---

### R-07: 15+ 处 Math.random() 用于 ID 生成 (OWASP A02: Cryptographic Failures)

**文件**: behavior-tracker.js, boundary-negotiation.js, meta-learner.js 等

**严重性**: 🟠 LOW

**问题**: `Math.random()` 不是密码学安全的随机数生成器，生成的 ID 可被预测。部分模块已正确使用 `crypto.randomBytes()`（如 self-correction-loop.js:88），但多数仍用 `Math.random()`。

**修复建议**: ID 生成统一使用 `crypto.randomBytes()` 或 `crypto.randomUUID()`

---

### R-08: 183 处 console.log/info 残留 (OWASP A05: Security Misconfiguration)

**文件**: 全代码库  
**严重性**: 🟠 LOW

**问题**: 183 处 `console.log`/`console.info` 调用残留，可能泄露敏感信息到日志中。

**修复建议**: 
- 生产环境使用统一日志系统（已有 `src/utils/logger.js`）
- 添加 PostToolUse hook 自动检测新增 console.log

---

## 🟡 SUGGESTION 级别发现

### S-01: 20 个文件超过 800 行 — God Object 模式

**最严重文件**:

| 文件 | 行数 | 建议拆分方向 |
|------|------|-------------|
| heartflow.js | 4347 | 拆为 engine-core + module-loader + lifecycle + dispatch |
| desire-cognition.js | 3168 | 拆为 desire-core + desire-evaluator + desire-resolver |
| prompt-factory.js | 2495 | 拆为 factory-core + template-engine + provider-adapter |
| heart-logic.js | 2305 | 拆为 logic-core + pattern-matcher + rule-engine |
| cognition-engine.js | 1641 | 拆为 cognition-core + state-manager + processor |
| decision-router.js | 1606 | 拆为 router-core + strategy-selector + fallback-handler |
| logic-reasoning.js | 1590 | 拆为 reasoning-core + llm-adapter + rule-engine |

**风险**: 大文件难以维护、测试和审查，变更容易引入回归

---

### S-02: setInterval 定时器清理不完整

**文件**: `mcp/mcp-server-http.js:137`  
**问题**: MCP 服务器中的 `setInterval` 清理定时器无对应的 `clearInterval` 调用（服务器关闭时不会清理）

**修复建议**: 在服务器 shutdown 钩子中清理所有 setInterval

---

### S-03: JSON.parse 无 schema 校验

**文件**: 20+ 处 `JSON.parse(fs.readFileSync(...))`  
**问题**: 从文件读取的 JSON 数据未做 schema 校验，损坏的文件可能导致运行时异常

**修复建议**: 对关键配置文件添加 schema 校验（如使用 ajv 或简单的字段存在性检查）

---

### S-04: try-catch 吞错误

**文件**: behavior-tracker.js, logic-reasoning.js 等  
**问题**: 多处 `catch(e) {}` 完全静默吞掉错误，无法诊断问题

**修复建议**: 至少记录 `console.warn` 或使用 logger

---

### S-05: 硬编码 /tmp 路径

**文件**: 
- `src/shield/thinkcheck-logger.js:47-48` — `/tmp/heartflow-thinkcheck.log`
- `src/shield/thinkcheck-logger.js:48` — `/tmp/heartflow-cot.log`

**问题**: `/tmp` 路径在多用户系统上存在符号链接攻击和权限问题

**修复建议**: 使用 `os.tmpdir()` + 应用专属子目录

---

### S-06: 未捕获异常/拒绝处理缺失

**文件**: 全局  
**问题**: 未找到 `process.on('uncaughtException')` 或 `process.on('unhandledRejection')` 处理器

**修复建议**: 在入口文件添加全局异常处理器，防止进程静默崩溃

---

### S-07: prompt-factory.js 中的 eval 风险代码

**文件**: `src/code/prompt-factory.js:1384`  
**问题**: 生成的 bash 脚本中包含 `eval "$CMD"` 模式，虽然这是生成给用户使用的代码模板，但 eval 模式本身不安全

**修复建议**: 改为直接执行命令而非 eval

---

## 🟢 POSITIVE — 已正确实施的安全措施

### P-01: MCP 服务器强制认证 ✅
- `HEARTFLOW_MCP_TOKEN` 未设置时拒绝启动（`mcp/mcp-server-http.js:81-84`）
- 时间安全比较防止 timing attack（第86-88行）

### P-02: MCP 速率限制 ✅
- IP 维度 + Token 维度双重速率限制
- 定期清理过期记录（120秒间隔）

### P-03: CORS 严格限制 ✅
- `Access-Control-Allow-Origin: http://localhost`（仅本地）
- `Access-Control-Allow-Credentials: false`

### P-04: 生产模式错误信息过滤 ✅
- `error-handler.js:470` — 生产模式 stack trace 设为 `[REDACTED_IN_PRODUCTION]`
- 敏感信息正则过滤（PASSWORD/SECRET/TOKEN/AUTH）

### P-05: 代码执行器运行时守卫 ✅
- `HEARTFLOW_CODE_EXECUTOR_ENABLED` 默认 false
- Python 执行使用 `execFileSync` + 数组参数（安全）

### P-06: 沙箱正则检测部分覆盖 ✅
- `SANDBOX_BLOCKED_PATTERNS` 包含 constructor.constructor、Proxy、Buffer、net/http 等模式
- 反引号和 `$()` 命令替换已被阻止

---

## OWASP Top 10 映射总结

| OWASP 编号 | 分类 | 发现数 | 严重级别 |
|------------|------|--------|---------|
| A01:2021 | Broken Access Control | 1 | 🔴 B-04 |
| A02:2021 | Cryptographic Failures | 2 | 🟠 R-06, R-07 |
| A03:2021 | Injection | 3 | 🔴 B-01, B-02, B-03 |
| A05:2021 | Security Misconfiguration | 4 | 🟠 R-01, R-02, R-04, R-08 |
| A08:2021 | Software and Data Integrity Failures | 1 | 🟠 R-03 |
| A10:2021 | Server-Side Request Forgery | 1 | 🟠 R-05 |

---

## 修复优先级路线图

### 第一阶段：紧急修复（1-3 天）
1. **B-01**: 移除 `execSync(code, { shell })` 模式，改用 `execFileSync` + 白名单
2. **B-02 + B-03**: 引入 `isolated-vm` 或冻结原型链，修复沙箱逃逸
3. **B-04**: 移除硬编码路径，改用环境变量

### 第二阶段：重要修复（1-2 周）
4. **R-01**: 为所有 Map.set 添加容量保护
5. **R-02**: 为高风险 Array.push 添加容量保护
6. **R-04**: 修复所有未转义的动态正则
7. **R-05**: 添加 fetch URL 白名单校验

### 第三阶段：质量改进（持续）
8. **S-01**: 拆分 God Object 文件
9. **R-06/R-07**: 升级哈希算法和随机数生成器
10. **R-08/S-04**: 清理 console.log 和吞错误

---

**审计人**: Claude Code Security Auditor  
**审计工具**: 静态分析 + 实机沙箱逃逸验证 + OWASP Top 10 框架  
**下次审计建议**: 修复 BLOCKING 级别问题后进行复审计
