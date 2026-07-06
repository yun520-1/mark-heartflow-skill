# Cron 增量升级实录：hypothesis-tester.js v2.0.49

**执行时间**：2026-06-04
**目标模块**：`src/core/hypothesis-tester.js`
**版本**：v2.0.48 → v2.0.49

## 升级前状态

- 大小：2,762 字节 (92 行)
- 功能：仅用正则提取声明（citations/percentages/numbers/dates/techTerms），简单的固定权重置信度评分（3个if-else），一个 trivially simple 的 `markUnverified()` 返回 `⚠️[未核实]` 或无
- `assessConfidence()` 只有 5 个硬编码 +/- 权重，无分类感知
- 无声明分类、无矛盾检测、无时间有效性、无来源可信度、无重要性排序、无指纹去重
- `extractClaims()` 返回扁平字符串数组，无元数据、无分类

## 升级后状态

- 大小：15,901 字节 (458 行)
- 新增 ~366 行实际逻辑代码
- 全部 11 项功能增强

## 新增功能详解

### 1. ClaimCategory 枚举（8种类型）

```js
ClaimCategory: {
  FACTUAL: 'factual',         // 事实性声明（有可验证真值）
  OPINION: 'opinion',         // 观点性声明（主观判断）
  PREDICTION: 'prediction',   // 预测性声明（未来事件）
  COMPARISON: 'comparison',   // 比较性声明（A比B更好/更大/更快）
  STATISTICAL: 'statistical', // 统计性声明（百分比/均值/概率）
  TEMPORAL: 'temporal',       // 时间性声明（日期/时间段/顺序）
  CAUSAL: 'causal',           // 因果性声明（因为X所以Y）
  DEFINITIONAL: 'definitional' // 定义性声明（X是什么）
}
```

### 2. VerificationStatus 枚举（6种状态）

```js
VerificationStatus: {
  UNVERIFIED: 'unverified',
  VERIFIED_TRUE: 'verified_true',
  VERIFIED_FALSE: 'verified_false',
  UNVERIFIABLE: 'unverifiable',
  EXPIRED: 'expired',
  PENDING: 'pending'
}
```

### 3. 高级声明提取 — 新增3种模式检测

原有：citations / percentages / numbers / dates / techTerms（纯正则）

新增：
- **因果声明检测**：`/[^。！？]*?(?:因为|所以|因此|导致|引起|造成|促使|使得)[^。！？]*[。！？]/g`
- **比较声明检测**：`/[^。！？]*?(?:比|更|最|优于|超过|领先|不如|相当于)[^。！？]*[。！？]/g`
- **预测声明检测**：`/[^。！？]*?(?:预计|预期|将(?:会|要)|有望|可能(?:性)?会|估计)[^。！？]*[。！？]/g`

每个匹配的声明现在带 `{ text, category, subtype }` 元数据三元组，不再是纯字符串。

### 4. 模糊去重 — `_deduplicateClaims()` + `_textSimilarity()`

```js
// 基于字符集交并比的文本相似度
_textSimilarity(a, b) {
  const aChars = new Set(aNorm.split(''));
  const bChars = new Set(bNorm.split(''));
  // intersection / union
  return union > 0 ? intersection / union : 0;
}
// 阈值 > 0.7 视为重复
```

**为什么用字符集相似度而不是 Levenshtein/Jaccard**：字符集交并比 O(n) 时间，比编辑距离 O(n²) 快，适合 cron job 场景的批量去重。对于中文文本（每个字符≈一个词）效果足够好。

### 5. 增强置信度评估 — 9个影响因素

| 因素 | delta | 条件 |
|------|-------|------|
| academic_citations | +0.30 | 有学术引用 |
| percentages | +0.10 | 含百分比 |
| temporal | +0.05 | 含日期 |
| user_verified | +0.20 | 用户确认 |
| external_source | +0.20 | 有外部来源 |
| source_credibility | +0~0.30 | context.sourceCredibility (0~1) |
| uncertainty_language | -0.20 | 含不确定词（大概/可能/也许/或许/似乎/推测/猜测） |
| subjective_language | -0.15 | 含主观表达（我觉得/我认为/我个人/在我看来） |
| has_predictions | -0.10 | 含预测性声明 |
| unverified_comparison | -0.10 | 比较声明但无外部来源 |

**关键设计点**：`factors[]` 数组记录每个因素对最终得分的贡献及原因，使置信度可解释、可审计。

### 6. 矛盾检测 — `detectContradictions()`

两种矛盾类型：

| 类型 | 触发条件 | 严重度 |
|------|---------|--------|
| numeric_discrepancy | 两个statistical声明的数值差 > 50% (ratio=0.5) → medium, > 90% → high | medium/high |
| date_discrepancy | 两个temporal声明的年份差 > 50年 | medium |

**O(n²) 的遍历**：对少于 20 个声明的场景（心虫通常处理段落级别文本）足够快。如果以后需要处理全文，需要优化。

### 7. 声明重要性评分 — `assessClaimImportance()`

```js
// 评分规则
带数字 → +2
因果声明 → +3
比较声明 → +2
预测声明 → +2
长文本(>50 chars) → +1

// 优先级阈值
score >= 4 → 'high'
score >= 2 → 'medium'
else → 'low'
```

### 8. 时间有效性评估 — `assessTemporalValidity()`

```js
// 日期声明：距今 >10年 → invalid
// 距今 5-10年 → valid但建议核实
// 预测声明：始终 invalid（已过期或待验证）
```

### 9. 声明指纹 — `generateClaimFingerprint()`

```js
// 归一化 + MD5 前 8 位
const normalized = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '').slice(0, 50);
const hash = createHash('md5').update(normalized).digest('hex').slice(0, 8);
```

**用途**：跨会话去重追踪。同一声明在不同对话中被提取时产生相同指纹，可用于统计声明出现频率。

### 10. 批量评估 — `batchAssess()`

```js
batchAssess(claimsArray) → sorted by importance desc, then confidence desc
```

对每个声明计算：confidence + importance + temporalValidity + fingerprint，然后排序。

### 11. 完整分析报告 — `generateReport()`

```js
generateReport(text) → {
  summary: {
    totalClaims,
    verified,
    hasUnverified,
    contradictions,
    overallConfidence: { score, level, factors }
  },
  categoryBreakdown: { factual: 3, statistical: 5, ... },
  contradictions: [{ type, severity, claimA, claimB, description }],
  claimsByPriority: { high: [...], medium: [...], low: [...] },
  annotation: "学术引用 2 处 [high] | 声明分类 factual:3, statistical:5 | 存在未核实数据 ⚠️[unverified]"
}
```

## 升级模式总结

这是"**简易提取器 → 全功能分析引擎**"升级模式的又一个实例。该模式在 heartflow-debug-workflow 中被列为「可复用升级模式库」的第 9 类，但实际执行中发现了新的子模式：

### 发现的子模式：分类型枚举 + 元数据管道

```
输入文本
  → regex提取（保留原功能）
  → 分类标记（category + subtype 元数据）
  → 模糊去重（字符集相似度）
  → 置信度评估（多因素加权）
  → 矛盾检测（O(n²) pairwise）
  → 重要性排序（可配置权重）
  → 时间有效性检查（可配置过期阈值）
  → 指纹生成（MD5归一化）
  → 聚合报告（summary + breakdown）
```

这个管道是模块化的：每一步可以独立启用/禁用，且每一步的输出格式是标准化的 `{text, category, subtype, confidenceScore, confidenceLevel, importance, fingerprint, temporalValidity}`。

## 向后兼容

- `extractClaims(text)` — 保持旧接口，返回值中新增 `categorizedClaims`, `claimCount`, `categoryBreakdown` 字段（不破坏已有字段）
- `assessConfidence(text, context)` — 返回值新增 `factors` 和 `claimCount` 字段
- `markUnverified(claims)` — 现在基于 categoryBreakdown 生成更具体的未核实标记（如 `⚠️[未核实(数据/比较)]`）
- `formatAnnotations(text)` — 新增声明分类信息

## 同步文件

- `VERSION`: 2.0.48 → 2.0.49
- `SKILL.md`: frontmatter + description + 版本标记行 同步
- `UPGRADE_REPORT.txt`: 记录模块名、原大小、新大小、新增功能摘要
