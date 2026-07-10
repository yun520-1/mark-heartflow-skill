---
name: heartflow-security-audit-2026
title: HeartFlow v5.9.x 安全审计与修复
version: 1.0.0
date: "2026-07-10"
description: >
  HeartFlow v5.9.13~v5.9.15 安全审计发现与修复记录。
  包含：6个审计技能并发审计方法、CRITICAL/HIGH/MEDIUM修复、新增安全工具模块、
  叙事体检测修复、git合并冲突残留修复、dispatch undefined检测。
triggers:
  - 审计心虫安全
  - 心虫安全修复
  - 心虫dispatch undefined
  - 心虫叙事体检测
  - 心虫git合并冲突
---

# HeartFlow v5.9.x 安全审计与修复

## 审计技能安装（6个）

| 技能 | 来源 | ⭐ | 安装路径 |
|------|------|-----|----------|
| security-audit-cloudflare | Cloudflare | 2377 | `~/.hermes/skills/security-audit-cloudflare` |
| vibe-security | raroque | 840 | `~/.hermes/skills/vibe-security` |
| tob-sharp-edges | Trail of Bits | 6051 | `~/.hermes/skills/tob-sharp-edges` |
| tob-insecure-defaults | Trail of Bits | 6051 | `~/.hermes/skills/tob-insecure-defaults` |
| tob-entry-point-analyzer | Trail of Bits | 6051 | `~/.hermes/skills/tob-entry-point-analyzer` |
| tob-agentic-actions-auditor | Trail of Bits | 6051 | `~/.hermes/skills/tob-agentic-actions-auditor` |

### 安装命令

```bash
# Cloudflare
cd /tmp && git clone --depth 1 https://github.com/cloudflare/security-audit-skill.git
cp -r security-audit-skill/skills/security-audit ~/.hermes/skills/security-audit-cloudflare

# Vibe Security
git clone --depth 1 https://github.com/raroque/vibe-security-skill.git
cp -r vibe-security-skill/vibe-security ~/.hermes/skills/vibe-security

# Trail of Bits 子技能
git clone --depth 1 https://github.com/trailofbits/skills.git trailofbits-skills
for skill in sharp-edges insecure-defaults entry-point-analyzer agentic-actions-auditor supply-chain-risk-auditor; do
  cp -r trailofbits-skills/plugins/$skill/skills/$skill ~/.hermes/skills/tob-$skill
done
for sub in sarif-parsing semgrep codeql; do
  cp -r trailofbits-skills/plugins/static-analysis/skills/$sub ~/.hermes/skills/tob-$sub
done
```

### 并发审计执行方式

用 `delegate_task` 的 `tasks` 数组启动 3 个子代理并行审计：
1. **子代理1**：Cloudflare 安全审计（沙箱逃逸、注入、密钥、认证、路径遍历、网络）
2. **子代理2**：Vibe Security AI代码审计（API Key暴露、客户端信任、认证缺失）
3. **子代理3**：效率+质量审计（同步阻塞、内存泄漏、未捕获Promise、dispatch undefined）

本地补充扫描（子代理运行期间同步执行）：
```bash
# 入口点分析
grep -rn 'module.exports\|router\|createServer' src/ --include='*.js'
# 不安全默认值
grep -rn '= {}\|= []\|= null' src/ --include='*.js' | grep options
# 过长函数检测（>100行）
# 未捕获Promise
grep -rn '.then(' src/ --include='*.js' | grep -v '.catch' | wc -l
# console.log泄露
grep -rn 'console.log(' src/ --include='*.js' | wc -l
```

## 审计发现与修复（v5.9.13→v5.9.15）

### CRITICAL

| ID | 问题 | 文件 | 修复 |
|----|------|------|------|
| C-01 | 沙箱 constructor.constructor 逃逸 | code-executor.js | 已有B-03修复（defineProperty冻结） |
| C-02 | mathjs evaluate 可执行任意代码 | formula-calculator.js | 禁用 import/createUnit 危险函数 |

### HIGH

| ID | 问题 | 文件 | 修复 |
|----|------|------|------|
| H-02 | Promise 未捕获（16处） | mcp-server.js | 加 `.catch(e => ({error: e.message}))` |
| H-03 | MCP Token 速率限制过宽 | mcp-server.js | 30→5次/分钟 |
| H-04 | child_process 直接使用 | code-executor.js | 已有命令白名单 |

### MEDIUM

| ID | 问题 | 文件 | 修复 |
|----|------|------|------|
| M-01 | console.log 敏感信息泄露（61处） | utils.js | 新增 safeLog（自动脱敏） |
| M-02 | 正则 DoS 风险（33处 RegExp） | regex-safe.js | 新增安全正则工具模块 |
| M-03 | fs 写入无路径校验（132处） | path-guard.js | 新增路径安全校验模块 |
| M-04 | 网络请求无超时（8处） | fetch-safe.js | 新增安全 fetch 模块（10s超时+2次重试） |

### 其他修复

| 问题 | 文件 | 修复 |
|------|------|------|
| dispatch 返回 undefined（502处） | heartflow.js | 结果验证+警告返回 |
| 叙事体 PAD 全 0 误导 | psychology.js + 4文件 | outOfScope + narrative_analysis 类型 |
| 叙事体阈值过高 | 5个文件 | 200→30字符（中文叙事文本实际很短） |
| formulas.json git 合并冲突 | formulas/ | Python 冲突清理脚本 |
| VERSION git 合并冲突 | VERSION | echo '5.9.15' > VERSION |

## 新增安全工具模块

### path-guard.js — 文件路径安全校验

```javascript
const { guardPath, safeWriteSync, safeReadSync } = require('./core/path-guard.js');

// 校验路径安全性
const { safe, resolved, reason } = guardPath(filePath, extraRoots);
// safe=true → 允许, safe=false → 拒绝（路径遍历/超出允许目录）

// 安全写入
safeWriteSync('data/test.json', content); // 路径不在 data/ 或 /tmp/ 下则抛错
```

### fetch-safe.js — 安全网络请求

```javascript
const { safeFetch } = require('./core/fetch-safe.js');
const response = await safeFetch(url, { timeout: 10000, maxRetries: 2 });
```

### regex-safe.js — 正则 DoS 防护

```javascript
const { checkRegexSafe, safeMatch } = require('./core/regex-safe.js');
const { safe, risk } = checkRegexSafe(new RegExp(userPattern));
const match = safeMatch(regex, userInput, 10000); // 限制输入长度
```

### safeLog — 安全日志（utils.js）

```javascript
const { safeLog } = require('./core/utils.js');
safeLog('info', 'user action', { apiKey: 'sk-xxx' }); // apiKey → [REDACTED]
// 生产环境（NODE_ENV=production）自动跳过 debug 级别
```

## 关键教训

### 1. git 合并冲突标记残留在 JSON/VERSION 文件中

`git reset --hard origin/main` 只恢复到含冲突标记的 commit，不会自动解决冲突内容。每次 `git pull` 或 `git reset` 后必须检查：

```bash
cat VERSION  # 不应包含 <<<<<<< HEAD
python3 -c "import json; json.load(open('formulas/formulas.json')); print('OK')"
```

### 2. 中文叙事文本字符数远短于预期

"受害者被凶手杀害，尸体藏在墙壁中"仅52字符。阈值从 200 降到 30 才能触发叙事体检测。

### 3. 心虫能力边界原则

心虫是规则引擎，对第三人称叙事长文做结构化拆解不会比 LLM 直接分析更好。正确做法：返回 `{outOfScope: true, suggestion: 'narrative_emotion_modeling'}`。

### 4. dispatch 返回 undefined 的根因

`mod[method](...args)` 返回 undefined 时，调用者得到 undefined 而非有意义的错误。v5.9.14 新增检测：返回 `{_dispatchWarning: true, route, hint}`。

### 5. mathjs evaluate 安全

`mathjs.evaluate()` 可执行任意 JS。修复：用 `math.create()` + `math.import({import: throw, createUnit: throw}, {override: true})` 禁用危险函数。

## 相关技能

- `heartflow-audit-workflow` — 完整审计工作流（S/V/T/F/M-Series）
- `heartflow-truthfulness` — 防止汇报类任务中的记忆错乱
