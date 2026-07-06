# Cron 增量升级实录：claim-extractor.js v2.0.43

**执行时间**：2026-06-04
**目标模块**：`src/core/claim-extractor.js`
**版本**：v2.0.42 → v2.0.43

## 升级前状态

- 大小：2,472 字节 (82 行)
- 功能：仅用正则提取声明，无置信度、无来源追踪、无矛盾检测
- `extractAll()` 返回纯字符串数组，无元数据
- `categorize()` 简单分三桶（verified/uncertain/needsCheck）

## 升级后状态

- 大小：20,086 字节 (586 行)
- 新增 ~504 行实际逻辑代码
- 全部 8 项功能增强（见下文）

## 新增功能

### 1. ConfidenceLevel 枚举

```js
ConfidenceLevel: {
  HIGH:    { name: 'high',    threshold: 0.8, label: '[high]', color: '🟢' },
  MEDIUM:  { name: 'medium',  threshold: 0.5, label: '[medium]', color: '🟡' },
  LOW:     { name: 'low',     threshold: 0.0, label: '[low]', color: '🔴' },
  UNVERIFIED: { name: 'unverified', threshold: -1, label: '[unverified]', color: '⚪' }
}
```

### 2. ClaimCategory 枚举

```js
ClaimCategory: { FACT, OPINION, STATISTIC, CITATION, COMPARISON, CAUSATION, TEMPORAL, PREDICTION }
```

### 3. ErrorCategory 枚举

```js
ErrorCategory: { NONE, UNVERIFIED, CONTRADICTORY, IMPRECISE, OUTDATED, MISATTRIBUTED }
```

### 4. 置信度计算逻辑（`_assessClaimConfidence`）

8 种信号影响置信度：
| 信号 | 分值变化 | 检测条件 |
|------|---------|---------|
| 学术格式 | +0.35 | `[@xxx]` 或 `(Author, yyyy)` 格式 |
| 来源标注 | +0.20 | 包含 according to/据/来源/引自 |
| 大数字 | -0.10 | 数字 > 10000 |
| 确定性措辞 | -0.15 | 一定/必然/绝对/永远/always/never/must |
| 模糊措辞 | -0.10 | 可能/大概/也许/约/approximately |
| 年份可验证 | +0.10 | 含 20xx 年份 |
| 因果声明 | -0.15 | 因果模式（导致/引起） |
| 统计声明 | -0.10 | 含百分比 |

### 5. 来源追踪

每个声明返回：
```js
{
  value: "42%",
  category: "statistic",
  confidenceScore: 0.42,
  confidenceLevel: "medium",
  positions: [
    { offset: 123, line: 5, snippet: "研究显示 42% 的参与者..." }
  ],
  sourceContext: "research-paper-2024",
  extractedAt: "2026-06-04T12:00:00.000Z"
}
```

### 6. 矛盾检测（4种类型）

| 类型 | 检测规则 | 置信度 |
|------|---------|--------|
| numeric_proximity | 相近但不相同（差<5）的数值 | 0.4 |
| percentage_overflow | 两百分比之和>100% | 0.7 |
| causal_conflict | "A导致B" + "A不影响B" | 0.6 |
| confidence_mismatch | 相同声明在不同上下文置信度不一致 | 0.5 |

### 7. 优先验证排序

```js
getPriorityVerifications(claims)
// 返回按 priority 降序排列的声明列表
// 评分：统计/因果+2, 低置信度(<0.4)+3或(<0.6)+1, 大数字(>100000)+1
```

### 8. 验证报告

```js
generateReport(claims) → {
  totalClaims,           // 总声明数
  confidenceDistribution, // { high, medium, low, unverified }
  categoryDistribution,   // { fact, statistic, citation, ... }
  contradictionCount,    // 矛盾数
  contradictions,        // 严重矛盾列表
  warnings,              // 警告级矛盾
  priorityVerifications, // 需要优先验证的声明数
  summary                // 人类可读摘要
}
```

## 向后兼容

- `formatAnnotations(text)` — 保持旧接口签名，内部调用新 `extractAll()`
- `categorize(claims)` — 同时兼容旧格式（纯字符串数组）和新格式（带 confidenceLevel 的对象数组）

## 同步文件

- `VERSION`: 2.0.42 → 2.0.43
- `SKILL.md`: frontmatter + H1 + 版本标记行 同步
- `CHANGELOG.md`: 在 CHANGELOG.head.md 段最上方添加条目
- `UPGRADE_REPORT.txt`: 记录模块名、原大小、新大小、新增功能摘要
