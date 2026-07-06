# 心虫自审计模块设计模式（self-audit.js）

## 概述

`self-audit.js` 是基于 `code-engine.js` 封装的 6 维度自审计引擎，v2.2.0 引入。支持全库审计和单模块审计两种模式。

## 审计维度

| # | 维度 | 函数 | 核心逻辑 |
|---|------|------|----------|
| 1 | 模块复杂度 | `auditComplexity()` | 圈复杂度 5 级分布（low/moderate/high/veryHigh/critical），标记热点函数 |
| 2 | 代码质量 | `auditCodeQuality()` | 调用 `reviewCode()` 汇总空值检查/边界条件/安全漏洞/死代码/反模式，计算 0-100 质量评分 |
| 3 | 版本一致性 | `auditVersionConsistency()` | 对比 VERSION/package.json/SKILL.md/version.js/heartflow.js 中的版本号，列出不一致 |
| 4 | 模块依赖 | `auditDependencies()` | 调用 `auditCodebase()` 获取依赖图，检测循环依赖，计算耦合度 |
| 5 | 函数大小 | `auditFunctionSize()` | 按 tiny/small/medium/large/huge 统计函数行数分布，标记 >50 行超大函数 |
| 6 | 死代码 | `auditDeadCode()` | 扫描所有 export，检查外部引用次数，标记可疑未使用导出 |

## 报告结构

```json
{
  "meta": { "engine": "HeartFlow SelfAudit v2.2.0", "timestamp": "...", "mode": "full|single" },
  "summary": {
    "overallHealth": "healthy|warning|critical",
    "dimensionsPassed": 5, "dimensionsWarned": 1, "dimensionsFailed": 0,
    "totalIssues": 12, "criticalCount": 0
  },
  "dimensions": {
    "complexity": { "name": "模块复杂度", "status": "passed|warn|fail", "summary": "...", "distribution": {...}, "hotspots": [...] },
    "codeQuality": { ... },
    "versionConsistency": { ... },
    "dependencies": { ... },
    "functionSize": { ... },
    "deadCode": { ... }
  }
}
```

## 导出接口

- `runAudit(opts)` — 主入口，支持 `mode: 'full'|'single'` 和 `includeRaw` 选项
- `auditFullCodebase(opts)` — 全库审计别名，便于 cron 直接调用
- `auditSingleModule(filePath, opts)` — 单模块审计
- 6 个独立维度审计函数
- `formatAuditSummary(report)` — 生成可读文本报告
- `evaluateDimensionStatus(dimension, data)` — 阈值判断

## 集成方式（heartflow.js）

```js
// lazy load
const _SelfAudit = _lazy('selfAudit', () => require('./self-audit.js'));

// start() 中实例化
this.selfAudit = _SelfAudit();  // 函数对象模块，非 class

// dispatch 路由（10个注册在 ALLOWED_ROUTES）
selfAudit.runAudit
selfAudit.auditFullCodebase
selfAudit.auditSingleModule
selfAudit.auditComplexity
selfAudit.auditCodeQuality
selfAudit.auditVersionConsistency
selfAudit.auditDependencies
selfAudit.auditFunctionSize
selfAudit.auditDeadCode
selfAudit.formatAuditSummary

// 便捷方法
hf.auditCodebase(options)   // 调用 + 打印报告
hf.runAudit(options)        // 静默模式，返回 JSON
```

## 已知 Bug 与修复

### 1. Map.entries() 缺失（3处）

**症状**：`TypeError: fileContents is not iterable`  
**根因**：`auditComplexity()`、`auditCodeQuality()`、`auditFunctionSize()` 中用 `for...of` 遍历 `Map` 对象时没有调用 `.entries()`  
**修复**：`for (const [filePath, { content, lang }] of fileContents.entries())`  
**位置**：self-audit.js 第 218、273、502 行

### 2. 全库审计性能问题

**症状**：`auditFullCodebase()` 超时（>30秒）  
**根因**：code-engine.js 的 `auditCodebase()` 递归扫描 88 个模块，每个都做 analyzeCode + reviewCode  
**临时方案**：单模块审计代替全库审计  
**改进方向**：为审计增加缓存/增量模式

## 使用场景

### cron 审计任务调用

```js
node -e "const {runAudit} = require('./src/core/self-audit.js');
const r = runAudit({mode:'full'});
console.log(JSON.stringify(r.summary, null, 2));
// 只在 CRITICAL/HIGH 问题时输出详细报告
if (r.summary.criticalCount > 0 || r.summary.dimensionsFailed > 0) {
  console.log(JSON.stringify(r, null, 2));
}
```

### 升级前审计验证

```js
node -e "const {runAudit} = require('./src/core/self-audit.js');
// 先审计，确认哪些模块最需要升级
const r = runAudit({mode:'full'});
const hotspots = r.dimensions.complexity.hotspots;
const largeFns = r.dimensions.functionSize.largeFunctions;
console.log('热点:', hotspots.length, '超大函数:', largeFns.length);
// 选复杂度最低、功能最不完整的模块做升级
"
```
