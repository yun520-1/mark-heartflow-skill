# 薄代理/委托类升级模式

## 适用场景

模块是一个纯委托代理层，所有方法直接转发给核心类，自身**零独立逻辑**。

典型特征：
- 模块大小在 **700-1500 字节**之间（甚至更小）
- 每个方法体不超过 3 行：`if (core && core.method) return core.method(...)` + 空降级回退
- 构造函数仅存根引用 + 初始化
- `shutdown()` 是空函数
- `getStats()` 返回 `{ enabled: !!core, version: 'v1.0.0' }` 硬编码版本
- 无独立状态、无指标、无错误处理、无任何判断逻辑

**与包装器/调度器类的区别**：包装器至少有队列/速率限制等骨架结构；薄代理类连骨架都没有——完全是 `{ enabled: true/false }` 级别的存在。

## 示例：MetaLearner (src/evolution/meta-learner.js)

**原模块** (785 字节)：纯委托代理，全部 4 个方法：
- `boot()` → `this.core = new MetaLearning(rootPath)` 
- `learn(lesson)` → `if (core.learn) return core.learn(lesson)` 否则 `{ learned: true, lesson }`
- `getStats()` → `{ enabled: !!core, version: 'v1.0.0' }`
- `shutdown()` → `{}`

**升级后** (~20KB)：独立元学习引擎，6 大子系统。

## 可添加的子系统

### 1. 质量评分系统

```javascript
// 4维度加权评分 (0-1)
const QUALITY_PATTERNS = {
  completeness: { keywords: ['因为','所以','导致','解决','after','because','result'], weight: 0.3 },
  specificity:  { keywords: ['场景','当','遇到','in','when','at','during'],           weight: 0.3 },
  actionability:{ keywords: ['应该','可以','需要','建议','should','must','next'],       weight: 0.25 },
  measurability:{ keywords: ['秒','分钟','次','%','ms','sec','times','rate'],           weight: 0.15 }
};
```

- 遍历维度，对每个关键词做 `lower.includes(kw)` 计数
- `dimScore = Math.min(matchCount / 3, 1.0)` 最多 3 个匹配满分
- `totalScore = Σ(dimScore × dimWeight) + lengthBonus`
- 4 级品质：`EXCELLENT(≥0.7) / GOOD(≥0.5) / FAIR(≥0.3) / POOR(<0.3)`

### 2. 类别枚举 + 关键词分类

```javascript
const LessonCategory = {
  TECHNICAL: 'technical',      // api/function/code/bug/error/crash/类型/函数/接口/报错
  BEHAVIORAL: 'behavioral',    // respond/reply/reaction/behavior/习惯/反应/行为
  STRATEGIC: 'strategic',      // strategy/approach/method/plan/方向/策略/方法/方案
  ARCHITECTURAL: 'architectural', // architecture/design/structure/架构/设计/结构
  PROCESS: 'process',          // workflow/step/flow/pipeline/流程/步骤/工作流
  SECURITY: 'security',        // security/auth/password/vulnerability/安全/权限/漏洞
  COMMUNICATION: 'communication', // clarify/explain/communicate/沟通/说明/询问/确认
  GENERAL: 'general'           // 回退
};
```

- 按类别权重评分：`score = matchCount / keywords.length`
- 阈值保护：`bestScore >= 0.05` 才确认分类，否则回退 `GENERAL`

### 3. 模式提取系统

从教训内容中检测 8 种可复用模式：

| 模式 | 检测正则 | 示例触发文本 |
|------|---------|------------|
| `conditional-rule` | `当.*时` / `when.*should` | "当API返回429时，应该等待" |
| `causal-chain` | `因为.*所以` / `because.*result` | "因为超时导致连接断开" |
| `prevention` | `避免\|不要\|never\|avoid` | "避免同时请求多个接口" |
| `verification` | `检查\|确认\|verify\|check` | "部署前检查索引是否存在" |
| `ordered-steps` | `先.*再\|first.*then\|step\s*\d` | "先备份数据库再升级" |
| `error-handling` | `失败\|异常\|error\|fail` | "当查询失败时降级到缓存" |
| `recommendation` | `推荐\|建议\|recommend\|suggest` | "建议使用指数退避策略" |
| `comparison` | `优于\|better.*than\|instead of` | "异步优于同步处理" |

### 4. 置信度计算

```javascript
_computeConfidence(qualityScore, patternCount, category) {
  const qualityFactor = qualityScore;                    // 0-1
  const patternFactor = Math.min(patternCount / 4, 1.0); // 每类模式贡献 0.25
  const categoryFactor = category === GENERAL ? 0.5 : 0.9; // 有具体类别更高置信
  return qualityFactor * 0.5 + patternFactor * 0.3 + categoryFactor * 0.2;
}
```

### 5. 关键词提取

```javascript
_extractKeywords(content) {
  const stopWords = new Set(['the','and','for','but','的','了','在','是','我', ...]);
  const words = content.split(/[\s,，。！？、；：""''（）\(\)\[\]{}]+/);
  for (const w of words) {
    const clean = w.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '').toLowerCase();
    if (clean.length >= 2 && !stopWords.has(clean) && !/^\d+$/.test(clean)) {
      unique.add(clean);
    }
  }
  return Array.from(unique).slice(0, 10);
}
```

### 6. 相关性召回

```javascript
_computeRelevance(entry, queryLower) {
  if (!queryLower) return 0.5;
  // 关键词重叠率 (60%)
  const overlap = matchCount / queryWords.length;
  // 类别匹配加分 (15%)
  const categoryBoost = entry.keywords.some(k => queryLower.includes(k)) ? 0.15 : 0;
  // 模式匹配加分 (10%)
  const patternBoost = entry.patterns.some(p => queryLower.includes(p)) ? 0.1 : 0;
  // 质量加权 (10%)
  const qualityBoost = entry.qualityScore * 0.1;
  return Math.min(overlap + categoryBoost + patternBoost + qualityBoost, 1.0);
}
```

召回流程：`computeRelevance → score = 0.6×relevance + 0.3×confidence + 0.1×quality → filter → sort → topN`

### 7. 统计追踪

```javascript
this._stats = {
  totalLessons: 0,
  highQualityLessons: 0,
  byCategory: {},           // { technical: 5, security: 3, ... }
  byQuality: {},            // { excellent: 2, good: 4, ... }
  lastLearnedAt: null,
  averageQuality: 0,
  qualitySum: 0
};
```

### 8. 自我诊断

```javascript
getDiagnostics() {
  // 质量趋势：recent5 vs older5 的平均值比较
  // 类别多样性：categories > 2 才健康
  // 低质量比例：POOR/(total) > 30% → 告警
  // 容量预警：history >= maxHistory × 90% → 警告
  return {
    healthy: boolean,
    qualityTrend: 'improving' | 'stable' | 'declining',
    dominantCategory: string,
    lowQualityRatio: number,
    recommendations: string[]
  };
}
```

### 9. 自动修剪

超过阈值时按 `(qualityScore + confidence)` 排序保留最优，再按时间重排。

## 关键实现细节

### 向后兼容
薄代理类升级的关键约束：
- 原有方法签名完全不变（`learn`, `getStats`, `shutdown`, `boot`）
- 原有返回值格式扩展但不破坏（`getStats()` 返回多了 `lessons` 等字段）
- 构造函数参数结构不变

```javascript
// 原构造：new MetaLearner({ rootPath, memory })
// 新构造：同样签名的 super set
constructor(hf = {}) {
  this.hf = hf;
  this.projectRoot = hf.rootPath || hf.projectRoot || process.cwd();
  this.core = null;
  this._history = [];
  this._stats = { ... };
  this._config = { ... };
}
```

### 输入解析防御
```javascript
_parseLesson(lesson) {
  if (typeof lesson === 'string') return { content: lesson, context: '', source: 'direct' };
  if (lesson && typeof lesson === 'object') return {
    content: String(lesson.content || lesson.lesson || ''),
    context: String(lesson.context || ''),
    source: String(lesson.source || 'unknown')
  };
  return { content: String(lesson), context: '', source: 'unknown' };
}
```

### 核心委托保留
即使新增了独立逻辑，仍应委托核心引擎（如果可用）：
```javascript
learn(lesson) {
  // ...独立质量评分、分类、模式提取...
  if (this.core && typeof this.core.learn === 'function') {
    try {
      coreResult = this.core.learn(input, { category, patterns, quality });
    } catch (e) {
      coreResult = { learned: true, lesson, error: e.message };
    }
  }
  // ...返回合并结果...
}
```

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 原有 4 个方法签名不变（boot/learn/getStats/shutdown）
- [ ] 构造不报错
- [ ] 空输入/短输入不崩溃
- [ ] 所有枚举导出（`const { MetaLearner, LessonCategory, LessonQuality } = require(...)`）
- [ ] 关键词匹配支持中英文混合
- [ ] 自动修剪不丢失所有教训
- [ ] 召回支持空查询（返回中间分 0.5）
- [ ] `getStats()` 返回同时包含独立统计和核心委托统计
- [ ] 42 项功能测试全部通过
