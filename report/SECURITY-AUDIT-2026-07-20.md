# 心虫 HeartFlow 源码 JS 安全专项审计报告

- **审计目标**: `/root/.hermes/skills/ai/mark-heartflow-skill`
- **目标版本**: `VERSION=6.0.48`（已核对 `src/core/version.js` 与 `package.json` 一致）
- **审计方法**: `js-codebase-security-audit` 技能流程；每条 HIGH/CRITICAL 均以**可读源码 + 运行时 PoC** 验证，凡命中即报之处均已打开上下文判别真实缺陷 / 误报 / 防御性代码。
- **未修改任何文件、未 commit/push**。

---

## 一、汇总表

| 维度 | 严重度 | 结论 |
|---|---|---|
| 1. vm 沙箱逃逸 | ✅ 已验证安全 | `sandboxContext={console}`，PoC 复现逃逸被阻断；`checkSandboxRestrictions` 正确拦截所有 `constructor.constructor` 变体 |
| 2. 原型链污染 | ✅ 已验证安全 | `_deepMerge` / `hooks-adapter` 合并均跳过 `__proto__`/`prototype`/`constructor`；其余 `Object.assign` 目标为内部对象，非外部输入 |
| 3. 路径穿越 | ✅ 已验证安全 | `path-guard` 真实防线为 `startsWith(root+sep)` 白名单；PoC 6 例全部拦截 |
| 4. ReDoS | ✅ 已验证安全 | 全部 `new RegExp(userInput)` 均经 `escapeRegExp` 转义；未发现危险回溯正则 |
| 5. 密钥/凭据 | ✅ 已验证安全 | AES-256-GCM + 随机 IV + 密钥文件 `0o600`；MCP token 用 `timingSafeEqual` 且不再明文打印 |
| 6. 命令执行面 | ⚠️ LOW（默认关闭） | `HEARTFLOW_CODE_EXECUTOR_ENABLED` 默认 false（fail-closed）；启用后 Shell 走白名单+黑名单双控；两处 `execSync` 参数为固定/内部值，无可注入 |
| 7. 未受控出网 | ⚠️ LOW（设计型 TOCTOU） | 主出网走 `safeFetch`（URL 校验+DNS pinning+私网拦截+超时）；但 `hybrid-search.js` 两处用裸 `fetch(config.endpoint)`，仅一次性 `validateFetchUrl` 校验，无 fetch 时 DNS pinning |
| **误报清单** | — | 见第四节（共 7 项，均已读上下文确认非缺陷） |

**一句话结论**：7 个维度经源码复核 + 运行时 PoC 验证，**未发现 CRITICAL/HIGH 真实缺陷**；两项 LOW 均为“默认安全、需启用才暴露”的设计性弱项，非可直接利用漏洞。沙箱逃逸、原型污染、路径穿越、ReDoS、密钥管理五项核心防护**实测有效**。

---

## 二、逐条发现

### D1 · vm 沙箱逃逸 — ✅ 非缺陷（已 PoC 验证）
- **文件/行号**: `src/code/code-executor.js:726`（`_executeJavaScript` 的 `sandboxContext = { console }`）、`:1107`（`sandbox()` 注入 `Math/JSON/Date/.../Promise` 等纯值类型）
- **问题假设**: 若沙箱注入了宿主函数（`setTimeout`/`console` 方法等），其 `.constructor` 可重建通往 `globalThis.process` 的逃逸链。
- **验证过程**:
  - PoC1：以 `sandboxContext={console}` 运行 `this.constructor.constructor('return process')()` → 返回 `Promise { undefined }`，**逃逸被阻断**（未取到 `process`）。
  - PoC2：对 `checkSandboxRestrictions` 喂入 `this.constructor.constructor`、`(0,constructor.constructor)()`、`this['constructor']['constructor']`、`Object.setPrototypeOf`、`process.env.SECRET`、`require("fs")`、`new Function(...)` → **全部 `blocked:true`**。
- **是否误报**: 否（是真实防护，且**有效**）。代码已在 `:723-725` 注释并落实“不注入 `setTimeout/clearTimeout`”，外层 executor 独立持有超时控制。
- **结论**: 当前实现安全。注意 `_executeJavaScript`（即 `execute()` 的 js 路径）**不经过** `checkSandboxRestrictions` 正则门（`sandbox()` 才经过），但因其 context 仅含 `{console}` 且 `opts.context` 在实际调用中均为引擎内部构造对象（见 D7），逃逸链不可达，风险可控。

### D2 · 原型链污染 — ✅ 非缺陷（已读上下文）
- **文件/行号**: `src/core/config.js:579-602`（`_deepMerge`）、`src/shield/hooks-adapter.js:401-409`（proto-filtered merge）、`src/core/code-verifier.js:391`（`__proto__` 检测规则）
- **问题假设**: 递归 merge 用户可控输入路径可能导致 `Object.prototype` 污染。
- **验证**: `config.js:585` 显式 `if (key === '__proto__' || key === 'prototype' || key === 'constructor') continue;` 跳过污染键；`hooks-adapter.js:404` 同样跳过三键。`decision-router.js:2141`、`engine-reasoner.js:483`、`layer-bus.js:199` 等处 `Object.assign(ctx, r)` 的 `r` 均来自内部 stage 返回值（非外部文本），不可由用户注入 `__proto__`。
- **是否误报**: 是（命中即报会误判为缺陷，实为已加固的防御代码）。
- **结论**: 无原型污染真实缺陷。

### D3 · 路径穿越 — ✅ 非缺陷（已 PoC 验证）
- **文件/行号**: `src/core/path-guard.js:21-41`、`src/utils/safe-fs.js:28-42`
- **问题假设**: 用户输入拼 `path.join`/`fs` 读写可穿越到 `/etc`、`/root/.ssh` 等。
- **验证（PoC, 6 例）**:
  - `/etc/passwd` → `safe:false`（outside allowed roots）
  - `../etc/passwd` → `safe:false`（解析为 `.../ai/etc/passwd`，不在白名单）
  - `data/../../etc/passwd` → `safe:false`
  - `/tmp/../../etc/passwd` → `safe:false`
  - `/tmp/ok.txt`、`data/ok.txt` → `safe:true`
- **要点**: 真实防线是 `:35` 的 `resolved.startsWith(root + path.sep)` 白名单（roots 限定 `data/`、`tmp/`、`/tmp`）。`:30` 的 `resolved.includes('..')` 确为**死代码**（`path.resolve` 已先规范化 `..`），但属“防御性冗余 + 无害”，不影响安全性——与审计技能 `false-positive-traps` 所述一致。
- **是否误报**: `..` 检查本身为误报式死代码，但整体路径穿越**防护有效**。
- **结论**: 无路径穿越真实缺陷。默认 `GUARD_MODE=''` 下 `safe-fs` 对越界写入“静默切入传统模式”，需在部署时设 `HEARTFLOW_PATH_GUARD=enforce` 才硬拒绝（见 D6 备注）。

### D4 · ReDoS — ✅ 非缺陷（已读上下文）
- **文件/行号**: 全仓 `new RegExp(...)` 共 23 处（如 `language-honesty.js:84,105`、`agent-psychology.js:884,894`、`formula-calculator.js:321,615,627,739`、`confidence-calibrator.js:465`、`empathy-detector.js:169,171` 等）
- **问题假设**: `new RegExp(userInput)` 直接拼用户输入导致灾难性回溯。
- **验证**: 全部命中处均先用 `escapeRegExp()`（`safe-regex.js:11-13`，转义 `. * + ? ^ $ { } ( ) [ ] \ |` 全部元字符）或等价 `replace(/[.*+?^${}()|[\]\\]/g,'\\$&')` 转义后再建正则。未发现任何 `(.*)+`、`([\s\S]+)*` 类危险回溯模式。
- **是否误报**: 是（命中即报会误判，实为已转义的安全用法）。
- **结论**: 无 ReDoS 真实缺陷。

### D5 · 密钥/凭据 — ✅ 非缺陷（已读上下文）
- **文件/行号**: `src/memory/memory-encrypt.js:20-21,70-72,118,451,455,485,519`；`src/memory/memory.js:45-46,160-196`；`src/mcp-server.js:179-215`
- **验证**:
  - 加密算法 `aes-256-gcm`（AEAD，带 authTag），每次加密 `crypto.randomBytes(ivLength)` 随机 IV（`memory.js:162`、`memory-encrypt.js:260,600`）—— 非固定 IV。
  - 密钥落盘统一 `fs.writeFileSync(keyFile, ..., { mode: 0o600 })`（`memory-encrypt.js:71,118,451,455,485,519`），`memory-kernel.js:159` 亦有 `fs.chmodSync(p, 0o600)`。
  - `memory.js:222-233` 启动时若 `.enc` 文件存在但 `HEARTFLOW_AES_KEY` 未设，会**检查文件权限**，世界可读则拒绝启动。
  - MCP token：`randomBytes(32)` 生成，比较用 `crypto.timingSafeEqual`（`mcp-server.js:213`），且 v5.15.4 起**不再明文打印** token（`:185`）。
- **是否误报**: 否（真实且充分的密钥管理）。
- **结论**: 无密钥/凭据真实缺陷。

### D6 · 命令执行面 — ⚠️ LOW（默认关闭 + 双控，非直接可利用）
- **文件/行号**: `src/code/code-executor.js:84`（总开关）、`:137-173`（白名单）、`:181-190`（危险参数模式）、`:276-312`（SANDBOX 拦截正则）、`src/core/heartflow.js:6187`（execSync）、`src/cortex/smart-upgrade-engine.js:656`（execSync）
- **验证**:
  - 总开关 `CODE_EXECUTOR_ENABLED` 默认 `false`，未启用时 `execute()`/`sandbox()` 直接返回 `PERMISSION` 错误（fail-closed，`:602-604`、`:1067-1069`）—— 满足“默认关闭”。
  - 启用后 Shell 执行：`validateShellCommand` 白名单门控（仅 40 个安全命令）＋ `DANGEROUS_COMMANDS` 黑名单 + `DANGEROUS_PARAM_PATTERNS` 参数级 RCE 拦截（`node -e`/`python -c`/`find -exec`/`awk system`/`sed -i` 等被堵），并经 `execFileSync('/bin/sh',['-c',code])` 数组参数执行避免二次 shell 解析。
  - 两处 `execSync` 实调用：`heartflow.js:6187` 参数为**固定 `files` 数组 join + `msg` 经 `JSON.stringify`**（无注入空间）；`smart-upgrade-engine.js:656` 的 `root` 取 `this.rootPath || __dirname`（内部值，非用户输入）。均无可利用的命令注入。
- **是否误报**: 否，但严重度仅 LOW——需攻击者先能设置环境变量启用执行器且通过 MCP 鉴权，才触及白名单执行面。
- **建议**: 保持默认关闭；若对外暴露，确保 `HEARTFLOW_CODE_EXECUTOR_ENABLED` 永不置于不可信环境，且依赖 MCP `AUTH_TOKEN` 强鉴权。

### D7 · 未受控出网面 — ⚠️ LOW（设计型 TOCTOU，端点为配置常量）
- **文件/行号**: `src/core/fetch-safe.js:18-80`（安全封装）、`src/security/url-validator.js:116-235`（SSRF 校验）、`src/search/hybrid-search.js:263-266,297-300`（裸 `fetch`）、`src/planner/self-initiator.js:698`（位于代码生成模板示例，非运行时调用）
- **验证**:
  - 主出网路径（`openalex-client.js`、`smart-upgrade-engine.js`、`logic-reasoning.js`、`benchmark-external-anchor.js`）均经 `safeFetch`，内含：`validateFetchUrl` 解析 + 私网/回环/link-local IPv4&IPv6 拦截 + 已知 DNS 重绑定域名（`nip.io` 等）拦截 + **DNS pinning（`dns.lookup` 后二次校验解析 IP）+ 超时 + 指数退避重试**（fail-closed）。防护充分。
  - `hybrid-search.js:268,302` 直接 `fetch(config.endpoint)`，仅在调用前做一次 `validateFetchUrl(config.endpoint)`。**缺陷点**：① 校验用 `url-validator` 内部 60s DNS 缓存，无 fetch 时点的 DNS pinning（存在 TOCTOU 重绑定窗口）；② 裸 `fetch` 未显式带 `AbortSignal` 超时（依赖上游 provider 响应，可能挂起）；③ 端点来自 `EMBEDDING_PROVIDERS.openai/cohere` 配置常量，非用户 URL，故实际不可由外部触发 SSRF。
- **是否误报**: 否，但严重度 LOW——触发条件受限（端点为内部配置、非外部输入），且端点本就应为可信 API 地址。
- **建议**: 将 `hybrid-search.js` 两处裸 `fetch` 改为复用 `safeFetch`（顺带获得 DNS pinning + 超时）；或在调用处补 `AbortController` 超时与 fetch 时点 DNS 二次校验，消除 TOCTOU 窗口。

---

## 三、维度无问题证据（明确声明）

- **vm 沙箱逃逸**: 已查 `code-executor.js` 全文，PoC 复现阻断（D1）。
- **原型链污染**: 已查所有 `merge`/`Object.assign`/`__proto__` 命中点，均无外部输入可达（D2）。
- **路径穿越**: 已查 `path-guard` + `safe-fs`，PoC 6 例全拦截（D3）。
- **ReDoS**: 已查全部 23 处 `new RegExp`，均转义（D4）。
- **密钥/凭据**: 已查加密模块与 MCP 鉴权，AES-256-GCM + 0o600 + timingSafeEqual（D5）。
- **命令执行**: 已查 `execSync` 全部 2 处实调用 + 白/黑名单双控，参数为固定/内部值（D6）。
- **未受控出网**: 已查全部 `fetch`/`https`/`http` 命中点，主路径走 `safeFetch`，仅 2 处裸 `fetch` 且端点为配置常量（D7）。

---

## 四、误报清单（命中即报会被误判，已读上下文确认）

1. **`path-guard.js:30` `resolved.includes('..')`** —— 死代码（`path.resolve` 已先规范化），但属无害防御冗余，非缺陷。
2. **`src/core/code-verifier.js:379,382,391`（`eval`/`exec`/`__proto__` 正则）** —— 这些是代码**静态审查规则**（检测用户提交代码中的危险模式），是防御逻辑，非漏洞。
3. **`src/shield/memory-integrity.js:51` `/__proto__|constructor|prototype/i`** —— 内存完整性**检测正则**，防御代码。
4. **`src/planner/self-initiator.js:884-888,935-939`（`child_process`/`rm -rf` 等正则）** —— 同为该模块生成/审查代码时的**危险模式黑名单**，防御代码。
5. **`src/core/decision-verifier.js:137-144`（`rm -rf`/`child_process` 正则）** —— 决策输出**安全校验正则**，防御代码。
6. **全仓 23 处 `new RegExp(userInput)`** —— 均经 `escapeRegExp` 转义，ReDoS 误报。
7. **`src/code/code-executor.js:281-312` 的 `SANDBOX_BLOCKED_PATTERNS`（require/eval/child_process/process.env 等）** —— 沙箱**拦截正则集合**，是安全防线本身，命中即报会反转为“存在危险调用”。

---

## 五、结论

心虫 v6.0.48 源码在 JS 安全七个重点维度上**未发现 CRITICAL/HIGH 级真实缺陷**。核心防护（vm 沙箱最小注入、原型污染键跳过、路径白名单、正则转义、AES-256-GCM+0o600 密钥、命令执行默认 fail-closed、主出网 safeFetch+SSRF/DNS-pinning）经源码复核与运行时 PoC **实测有效**。残留两项 LOW 均为“需先显式启用/端点为可信配置”才暴露的设计型弱项，建议（非必须）：① 生产环境保持 `HEARTFLOW_CODE_EXECUTOR_ENABLED` 关闭、设 `HEARTFLOW_PATH_GUARD=enforce`；② 将 `hybrid-search.js` 两处裸 `fetch` 改为 `safeFetch` 以补齐 TOCTOU 窗口与超时。
