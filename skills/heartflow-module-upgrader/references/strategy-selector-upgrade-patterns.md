# 策略选择器/元学习类升级模式

## 适用场景

模块的核心功能是**根据输入内容选择最佳策略/方法**，但各策略方法的实现体是**硬编码占位符**（返回固定文本/空数组/默认值），缺乏真实的文本分析和决策逻辑。

典型特征：
- 模块大小在 **5000-7000 字节**之间
- 有一个 `selectStrategy()` 或类似方法做关键词匹配路由
- 各策略实现方法返回 `['示例1', '示例2']`、`['步骤1', '步骤2']`、`['类比1', '类比2']` 等占位符
- 无输入验证（null/undefined 会崩溃）
- 无质量评估（总是返回 `success: true, quality: 'good'`）
- 无震荡检测/自愈反馈
- 关键词提取仅按空格拆分，无停用词过滤

**与薄代理类的区别**：薄代理类完全没有自己的逻辑（纯委托），策略选择器有自己的分类路由逻辑，但**各分支的实现是假的**。

## 示例：MetaLearning (src/core/self-evolution/meta-learning.js)

**升级前** (6,504 字节)：
- `selectStrategy()` 能正确按关键词分类（conceptual/example/analogy/step_by_step/socratic）
- 但各策略方法返回占位符：`['示例1', '示例2']`、`['类比1', '类比2']`、`['步骤1', '步骤2', '步骤3']`、`['问题1', '问题2', '问题3']`
- 无输入验证
- `executeStrategy` 永远返回 `{ success: true, quality: 'good' }`
- 关键词提取无停用词过滤

**升级后** (25,576 字节)：
- 5 种策略全部从硬编码升级为真实文本分析
- 停用词表（150+ 中英文词）
- 质量评估系统（覆盖率×0.6 + 特异性×0.4）
- 震荡检测（窗口10次，失败率>60%触发惩罚）
- 输入验证（null/undefined/数字安全降级）
- 修复 `learn()` 输入路径耦合

## 可添加的子系统

### 1. 输入验证层

```javascript
_safeInput(input) {
  if (input == null) return '';
  if (typeof input !== 'string') {
    try { return String(input); } catch (_) { return ''; }
  }
  return input;
}
```

`learn()` 入口：空输入时返回 `{ strategy: 'empty', result: { success: false, quality: 'empty_input' } }`，不崩溃。

### 2. 停用词过滤

```javascript
get stopWords() {
  return new Set([
    // 中文停用词
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
    '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
    '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
    '什么', '怎么', '为什么', '如何', '哪个', '多少', '吗', '吧', '呢',
    '啊', '哦', '嗯', '然后', '因为', '所以', '但是', '如果', '虽然',
    '而且', '或者', '可以', '应该', '能够', '需要', '可能', '已经',
    '这个', '那个', '这些', '那些', '这里', '那里', '这样', '那样',
    // 英文停用词
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'this', 'that', 'these', 'those', 'and', 'but', 'or', 'nor', 'not',
    'so', 'yet', 'for', 'with', 'without', 'at', 'from', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'about', 'up', 'down', 'in', 'on',
    'of', 'to', 'by', 'as'
  ]);
}
```

关键词提取：
```javascript
_extractMeaningfulWords(text) {
  const safe = this._safeInput(text);
  if (!safe) return [];
  // 中英文分词：按空格和标点拆分
  const words = safe.split(/[\s,，。；;：:！!？?、()（）【】\[\]{}\"\"''\"'\n\r\t]+/)
    .filter(w => w.length > 1)           // 过滤单字
    .filter(w => !this.stopWords.has(w.toLowerCase())) // 过滤停用词
    .filter(w => !/^[\d\s]+$/.test(w));  // 过滤纯数字
  return [...new Set(words)];
}
```

**注意**：中文文本没有空格分词。按标点拆分后，中文字段会保持完整短语（如 `"什么是神经网络"` 作为整体）。这对停用词过滤有影响——`'什么'` 不会匹配到 `'什么是神经网络'`。如果需要更细粒度的中文分词，考虑使用逐字单字过滤（过滤 `的/了/在/是` 等）。

### 3. 策略选择强化

在关键词匹配的基础上增加：
- **检测领域关键词**：代码/数据/科学/数学/商业/语言/心理等，用于后续策略执行的情境感知
- **震荡惩罚**：如果某策略最近反复失败，降低其置信度

```javascript
selectStrategy(context) {
  const input = this._safeInput(context.input || '');
  if (!input) {
    return { strategy: 'conceptual', confidence: 0.3, reason: '空输入，默认概念分析' };
  }

  const inputLower = input.toLowerCase();
  let bestStrategy = 'conceptual';

  // 概念理解类
  if (/什么是|是什么|explain|概念|define|definition|meaning|含义/.test(inputLower)) {
    bestStrategy = 'conceptual';
  }
  // 示例需求
  else if (/例子|example|比如|举例|for example|e\.g\.|instance|示例/.test(inputLower)) {
    bestStrategy = 'example';
  }
  // 类比需求
  else if (/像|like|类似|similar|analogy|as if|仿佛|比喻/.test(inputLower)) {
    bestStrategy = 'analogy';
  }
  // 步骤需求
  else if (/怎么|how to|步骤|steps|method|方式|方法|途径|做法|实现|implement/.test(inputLower)) {
    bestStrategy = 'step_by_step';
  }
  // 问题探索
  else if (/为什么|why|\?|原因|reason|cause|根源|探索|思考/.test(inputLower)) {
    bestStrategy = 'socratic';
  }

  // 震荡惩罚
  const oscillationPenalty = this.detectOscillation(bestStrategy);
  const baseConfidence = this.strategies[bestStrategy]?.score ?? 0.5;
  const adjustedConfidence = Math.max(0.1, baseConfidence - oscillationPenalty);

  return { strategy: bestStrategy, confidence: adjustedConfidence, reason: '匹配输入意图' };
}
```

### 4. 震荡检测

```javascript
detectOscillation(strategy) {
  const recentPatterns = this.learningPatterns.slice(-this.oscillationWindow);
  const strategyUses = recentPatterns.filter(p => p.strategy === strategy);

  let failRate = 0;
  if (strategyUses.length >= 3) {
    const failures = strategyUses.filter(p => !p.success).length;
    failRate = failures / strategyUses.length;
  }

  // ⚠️ 双通道检测：如果 learningPatterns 样本不足，回退到策略内部统计
  // 因为 updateStrategyScore() 直接更新策略 stats 但不写入 learningPatterns，
  // 单独使用 learningPatterns 会漏检震荡。
  const s = this.strategies[strategy];
  if (s && s.total >= 3 && failRate === 0) {
    const internalFailRate = (s.total - s.success) / s.total;
    if (internalFailRate > 0.6) {
      failRate = internalFailRate;
    }
  }

  if (failRate > 0.6) {
    return Math.min(0.4, failRate * 0.5);  // 0.1 ~ 0.4 惩罚
  }
  return 0;
}
```

**实战案例**：strategy-selector.js (src/planner/) 升级中，通过 `updateStrategyScore()` 设置策略失败率后，`selectStrategy()` 的震荡检测未触发——因为 `learningPatterns` 在 `selectStrategy()` 之外被 `updateStrategyScore()` 绕过。修复：增加策略内部统计回退通道，同时检查 `strategies[name].total` 和 `strategies[name].success`。

**设计原则**：震荡检测不应绑定单一数据源。如果模块同时有「选择时记录」和「外部评分更新」两条路径，检测器必须覆盖两者。
```

### 5. 策略实现升级（核心）

每个策略方法从返回占位符改为真实的文本分析。以下是 5 种策略的升级模式：

#### 5a. 概念学习 — 提取结构化概念

从输入中提取核心概念词，检测定义结构（`是指/即/就是/is a`），推断概念间关系：

```javascript
conceptualLearning(input) {
  const meaningfulWords = this._extractMeaningfulWords(input);

  // 提取核心概念
  const coreConcepts = meaningfulWords.slice(0, 5);

  // 检测定义结构
  let definition = '';
  if (coreConcepts.length > 0) {
    const mainConcept = coreConcepts[0];
    const defMatch = input.match(/是指|指的是|即|就是|表示|定义为|is (a|an|the) |refers to|means that/);
    if (defMatch) {
      const parts = input.split(defMatch[0]);
      if (parts.length >= 2) {
        definition = parts[1].substring(0, 100).trim().replace(/[。，,.]$/, '');
      }
    } else {
      definition = `对「${mainConcept}」的概念性理解，涉及 ${coreConcepts.slice(1, 4).join('、') || mainConcept} 相关内容`;
    }
  }

  // 推断关系
  const relationships = [];
  if (coreConcepts.length >= 2) {
    relationships.push({ from: coreConcepts[0], to: coreConcepts[1], type: '关联' });
  }

  return {
    type: 'concept',
    definition,
    keyPoints: coreConcepts,
    relationships,
    structure: coreConcepts.length > 2 ? '多概念网络' : '单概念分析'
  };
}
```

#### 5b. 示例学习 — 领域感知的示例生成

检测输入所属领域（代码/数据/科学/数学/商业/语言/心理），生成情境相关的示例：

```javascript
exampleLearning(input) {
  const meaningfulWords = this._extractMeaningfulWords(input);
  const examples = [];

  // 领域检测关键词
  const hasCode = /代码|code|编程|program|function|api|class/.test(input);
  const hasData = /数据|data|统计|分析|analy/.test(input);
  const hasScience = /科学|物理|化学|生物|实验/.test(input);
  const hasMath = /数学|math|算法|algorithm|方程|公式/.test(input);
  const hasBusiness = /商业|business|市场|market|产品|用户/.test(input);
  const hasLanguage = /语言|language|语法|grammar|单词|word/.test(input);
  const hasPsychology = /心理|psychology|行为|behavior|cognitive|认知/.test(input);

  if (hasCode) {
    examples.push(`在实际开发中，${meaningfulWords[0] || '这个功能'}常用于处理用户输入数据的验证`);
    examples.push(`一个典型场景：使用${meaningfulWords[0] || '这个方法'}对API返回结果进行格式化`);
  } else if (hasData) {
    examples.push(`例如，从用户行为数据中${meaningfulWords[0] || '分析'}出使用模式`);
  }
  // ... 其他领域分支 ...
  else {
    // 通用回退
    if (meaningfulWords.length > 0) {
      examples.push(`例如：在${meaningfulWords[0]}的典型应用场景中，我们可以看到其核心特性`);
    }
  }

  while (examples.length < 2) {
    examples.push(`更多相关示例可基于「${meaningfulWords[0] || '核心概念'}」扩展`);
  }

  return {
    type: 'example',
    examples: examples.slice(0, 3),
    pattern: `基于${meaningfulWords[0] || '输入'}生成情境示例`
  };
}
```

**领域检测关键词对照表**：

| 领域 | 中文触发词 | 英文触发词 |
|------|-----------|-----------|
| 代码 | 代码, 编程, 程序, 函数, API, 类, 配置 | code, program, function, api, class |
| 数据 | 数据, 统计, 分析 | data, statistics, analyze |
| 科学 | 科学, 物理, 化学, 生物, 实验 | science, physics, chemistry, biology |
| 数学 | 数学, 算法, 方程, 公式 | math, algorithm, equation |
| 商业 | 商业, 市场, 产品, 用户 | business, market, product, user |
| 语言 | 语言, 语法, 单词 | language, grammar, word |
| 心理 | 心理, 行为, 认知 | psychology, behavior, cognitive |

#### 5c. 类比学习 — 领域映射类比

```javascript
analogyLearning(input) {
  const meaningfulWords = this._extractMeaningfulWords(input);
  const comparisons = [];

  const hasTech = /技术|tech|计算机|computer|软件|软件/.test(input);
  const hasNature = /自然|nature|生物|bio|生态|eco/.test(input);
  const hasSocial = /社会|social|组织|team|团队/.test(input);
  const hasLearn = /学习|learn|教育|education/.test(input);

  if (meaningfulWords.length > 0) {
    const mainConcept = meaningfulWords[0];
    if (hasTech) {
      comparisons.push(`${mainConcept} 就像一座桥梁，连接不同的系统和组件`);
      comparisons.push(`可以把 ${mainConcept} 理解为乐高积木：每个部分独立但可组合`);
    } else if (hasNature) {
      comparisons.push(`${mainConcept} 就像生态系统中的食物链，每个环节都相互影响`);
    }
    // ... 其他领域 ...
    else {
      comparisons.push(`${mainConcept} 类似于一把瑞士军刀：多功能的集成工具`);
    }
  }

  return {
    type: 'analogy',
    comparisons: comparisons.slice(0, 3),
    mapping: `「${meaningfulWords[0] || '核心概念'}」映射到日常经验`
  };
}
```

#### 5d. 逐步学习 — 结构化步骤生成

```javascript
stepByStepLearning(input) {
  const meaningfulWords = this._extractMeaningfulWords(input);
  const steps = [];

  const hasCode = /代码|code|编程|install|setup|配置|部署|debug|测试/.test(input);
  const hasProcess = /流程|process|工作流|workflow|步骤/.test(input);
  const hasAnalysis = /分析|analyze|research|研究|调查/.test(input);

  if (meaningfulWords.length > 0) {
    const topic = meaningfulWords[0];
    if (hasCode) {
      steps.push(`步骤 1：理解${topic}的核心接口和功能`);
      steps.push(`步骤 2：准备开发环境并安装所需依赖`);
      steps.push(`步骤 3：实现基础功能原型，验证核心逻辑`);
      steps.push(`步骤 4：添加错误处理和边界情况保护`);
      steps.push(`步骤 5：测试和优化性能`);
    } else if (hasProcess) {
      steps.push(`步骤 1：明确${topic}的目标和预期产出`);
      steps.push(`步骤 2：收集所需的信息和资源`);
      steps.push(`步骤 3：设计实施框架和时间线`);
      steps.push(`步骤 4：分阶段执行，每个阶段检查质量`);
      steps.push(`步骤 5：回顾和优化整体流程`);
    } else if (hasAnalysis) {
      steps.push(`步骤 1：定义${topic}的分析范围和目标`);
      steps.push(`步骤 2：收集相关数据并初步清洗`);
      steps.push(`步骤 3：应用分析方法，识别关键模式`);
      steps.push(`步骤 4：验证发现，排除替代解释`);
      steps.push(`步骤 5：整理结论并形成报告`);
    } else {
      steps.push(`步骤 1：了解${topic}的基本概念和背景`);
      steps.push(`步骤 2：分解${topic}为可操作的子任务`);
      steps.push('步骤 3：按优先级依次处理每个子任务');
      steps.push('步骤 4：定期检查进展，调整方法');
      steps.push('步骤 5：总结完成情况并记录经验');
    }
  }

  return {
    type: 'step',
    steps: steps.slice(0, 6),
    order: '按依赖关系排序',
    totalSteps: steps.slice(0, 6).length
  };
}
```

#### 5e. 苏格拉底追问 — 多层递进问题

五层追问结构：定义 → 因果 → 边界 → 深层 → 反事实：

```javascript
socraticLearning(input) {
  const meaningfulWords = this._extractMeaningfulWords(input);
  const questions = [];

  if (meaningfulWords.length > 0) {
    const topic = meaningfulWords[0];

    // 第一层：定义追问
    questions.push(`「${topic}」的核心定义是什么？它与相关概念的本质区别在哪里？`);

    // 第二层：因果追问
    if (meaningfulWords.length > 1) {
      questions.push(`「${topic}」和「${meaningfulWords[1]}」之间存在怎样的因果关系？`);
    } else {
      questions.push(`是什么原因导致「${topic}」的出现？它解决的是什么根本问题？`);
    }

    // 第三层：边界追问
    if (/不|没有|false|wrong|limit|局限|缺点|劣势/.test(input)) {
      questions.push(`在什么条件下「${topic}」的局限性会变得显著？`);
    } else {
      questions.push(`「${topic}」在什么情况下会失效？它的适用范围和边界在哪里？`);
    }

    // 第四层：深层追问
    questions.push(`如果我们假设「${topic}」的前提是错误的，那会推导出什么？`);

    // 第五层：反事实追问
    questions.push(`如果改变其中一个核心变量，「${topic}」的结论是否依然成立？`);
  }

  return {
    type: 'question',
    questions: questions.slice(0, 5),
    method: '苏格拉底式追问（定义 → 因果 → 边界 → 深层 → 反事实）'
  };
}
```

### 6. 质量评估系统

每次策略执行后，自动评估输出质量：

```javascript
_analyzeQuality(strategy, input, output) {
  if (!output) return 'poor';

  const meaningfulWords = this._extractMeaningfulWords(input);
  const inputWordCount = meaningfulWords.length;
  if (inputWordCount === 0) return 'poor';

  let coverage = 0;
  let specificity = 0;

  switch (strategy) {
    case 'conceptual': {
      coverage = Math.min(1, output.keyPoints.length / Math.max(1, inputWordCount));
      specificity = output.keyPoints.filter(k => meaningfulWords.includes(k)).length / Math.max(1, output.keyPoints.length);
      break;
    }
    case 'example': {
      coverage = Math.min(1, output.examples.length / 3);
      specificity = output.examples.some(e => e.length > 5 && !e.startsWith('示例')) ? 1 : 0;
      break;
    }
    case 'analogy': {
      coverage = Math.min(1, output.comparisons.length / 2);
      specificity = output.comparisons.some(c => c.length > 5 && !c.startsWith('类比')) ? 1 : 0;
      break;
    }
    case 'step_by_step': {
      coverage = Math.min(1, output.steps.length / 5);
      specificity = output.steps.some(s => s.length > 5 && !s.startsWith('步骤')) ? 1 : 0;
      break;
    }
    case 'socratic': {
      coverage = Math.min(1, output.questions.length / 3);
      specificity = output.questions.some(q => q.length > 5 && !q.startsWith('问题')) ? 1 : 0;
      break;
    }
  }

  const qualityScore = (coverage * 0.6 + specificity * 0.4);
  if (qualityScore >= 0.6) return 'good';
  if (qualityScore >= 0.3) return 'fair';
  return 'poor';
}
```

### 7. 策略评分更新

```javascript
updateStrategyScore(strategy, success) {
  const s = this.strategies[strategy];
  if (s) {
    s.total++;
    if (success) s.success++;
    s.score = s.total > 0 ? s.success / s.total : 0.5;
  }
}
```

### 8. 统计与诊断

```javascript
getStats() {
  const bestEntry = Object.entries(this.strategies).sort((a, b) => b[1].score - a[1].score)[0];
  return {
    strategies: Object.keys(this.strategies).map(k => ({
      name: k,
      score: this.strategies[k].score.toFixed(2),
      uses: this.strategies[k].total
    })),
    patterns: this.learningPatterns.length,
    bestStrategy: bestEntry ? bestEntry[0] : 'conceptual',
    oscillationDetected: Object.keys(this.strategies).some(
      s => this.detectOscillation(s) > 0
    )
  };
}
```

## 常见陷阱

### 1. `learn()` 的输入路径耦合

**问题**：`learn(input, context = {})` 调用 `selectStrategy(context)`，如果调用者只传 `learn('输入文本')` 而不传 context 对象，则 `context.input` 为 undefined，策略选择始终默认 `conceptual`。

**修复**：
```javascript
async learn(input, context = {}) {
  // ...
  const contextInput = (context && context.input) ? context.input : safe;
  const { strategy, confidence } = this.selectStrategy({ input: contextInput });
  // ...
}
```

### 2. `learn()` 异步但没有 await

如果 `executeStrategy` 是 async 但调用方用 `this.executeStrategy()` 时没加 `await`，会返回 Promise 而非结果对象。

```javascript
// ❌ 错误 — result 是 Promise
const result = this.executeStrategy(strategy, safe, context);

// ✅ 正确
const result = await this.executeStrategy(strategy, safe, context);
```

### 3. 中文分词粒度

中文没有空格分词，按标点拆分后长句会保持整体。`"什么是神经网络？"` 中的 `"什么是神经网络"` 不会被停用词 `"什么"` 过滤掉。

**影响**：关键词提取结果可能比预期长。如果这是问题，考虑：
- 使用单字过滤（`w.length > 1` 已经过滤了单字）
- 在 `_extractMeaningfulWords` 中增加对常见中文前缀（`什么是`、`如何`、`怎么`）的正则移除

### 4. 版本号管理

元学习模块有自己的内部版本号（如 `7.6.000`），和心虫整体版本号（如 `2.3.0`）是独立的。

- 整体版本升级使用 `bumpVersion('patch')`（来自 `version.js`）
- 内部版本号在模块顶部注释中手动更新

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 构造不报错（`new MetaLearning('/tmp/test')`）
- [ ] 空输入返回 `{ strategy: 'empty', result: { success: false } }`
- [ ] null/undefined/数字输入不崩溃
- [ ] 5 种策略各自按关键词正确路由
- [ ] 每种策略返回非占位符内容（`示例1` 不应出现）
- [ ] 震荡检测：10 次中 7 次失败触发惩罚
- [ ] 质量评估：覆盖率+特异性加权计算
- [ ] 策略评分更新：每次执行后 `strategies[name].total` +1
- [ ] `getStats()` 返回所有策略的 score/uses
- [ ] `learn('input')`（无 context）也能正确选策略
