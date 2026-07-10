---
name: heartflow-release
title: "HeartFlow 发布审计工作流"
version: "1.0.0"
description: |
  HeartFlow 升级发布、审计修复、版本同步的标准化工作流。
  由 heartflow-audit-workflow 的分支实例化而来。
triggers:
  - 升级心虫版本
  - 审计心虫
  - 发布HeartFlow
  - 同步三目录
---

# HeartFlow 发布审计工作流

## 版本三源统一（每次发布前必做）

```bash
cd /root/.hermes/skills/heartflow

# 1. VERSION文件
echo "X.Y.Z" > VERSION
cat VERSION

# 2. package.json
node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8'));p.version='X.Y.Z';require('fs').writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"

# 3. BUILD_DATE
sed -i "s/BUILD_DATE = '[^']*'/BUILD_DATE = '$(date +%Y-%m-%d)-vX.Y.Z'/" src/core/heartflow.js
grep "BUILD_DATE" src/core/heartflow.js | head -1
```

## 三目录同步

```bash
VER=$(cat VERSION)
for dir in /root/.claude/skills/heartflow /root/.hermes/skills/ai/mark-heartflow-skill; do
  cd "$dir" && git fetch origin && git reset --hard origin/main && cat VERSION
done
```

## 关键陷阱

### 陷阱1: formulas.json 合并冲突
每次 git pull/reset 后必须验证 JSON 完整性：
```bash
python3 -c "import json; json.load(open('formulas/formulas.json'))"
```
清理冲突标记：去除 `<<<<<<< HEAD` / `=======` / `>>>>>>>` 行。

### 陷阱2: var→let 不能批量替换
`var` 只应在函数内部（有缩进的）替换为 `let`。顶层 `var` 替换会破坏闭包和重复声明检查。

### 陷阱3: 删除模块后 _lazy 引用必须兜底
删除 src/ 下的模块后在 heartflow.js 中对应的 `_lazy()` 引用会因 require 失败而崩溃。
方案：改为 `try { return require('./deleted.js'); } catch(e) { return { Stub: class {} }; }`

### 陷阱4: dispatch 返回 undefined 是静默失败
`mod[method](...args)` 返回 undefined 时应该 warn 而非静默返回。
修复：在 dispatch 返回值前加 `if (rawResult === undefined) { console.warn(...); return { _dispatchWarning: true, route }; }`

## 公式库管理

- 保留原则：只保留 cognitive_science / psychology / neuroscience / CS(信息论) / philosophy / physics(热力学+熵) / mathematics(概率+优化+线性代数)
- 删除：earth_science / engineering / quantum_computing / chemistry / economics / biology(除神经相关) / 初中数学
- 重复去重：按 name.toLowerCase() 去重

## 联系方式
markcell@qq.com
