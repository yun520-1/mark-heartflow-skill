# 独立函数模块现代化升级模式

## 适用场景

模块由一组独立导出的函数组成（非 class），使用 `var` 旧语法，缺少结构化分析和上下文感知能力。

典型特征：
- 使用 `var` 而非 `const`/`let`
- 函数是独立导出的，没有类封装
- 核心验证函数返回单一结论而非优先级排序
- 没有置信度评分或严重等级概念
- 修复函数做无上下文的盲替换

## 示例：language-honesty.js (7,824B → 13,519B)

**原模块**：266行，使用 `var`，一组独立函数（checkCertainty/checkQuestions/checkTuringRoute/checkPzombieBoundary/soften/reduceQuestions/validateOutput），`validateOutput()` 返回单一 `suggestion`。

**升级后**：5个新功能 + 语法现代化。

## 可添加的子系统

### 1. 置信度评分

```javascript
const CONFIDENCE_MAP = {
  certainty: { safe: 0.90, caution: 0.60, over: 0.30 },
  questions: { safe: 0.85, caution: 0.55, over: 0.25 },
  turingRoute: { safe: 0.95, caution: 0.50, over: 0.20 },
  pzombieBoundary: { safe: 0.95, caution: 0.40, over: 0.15 },
};

function checkConfidence(checkName, level) {
  const checkMap = CONFIDENCE_MAP[checkName];
  return checkMap && checkMap[level] !== undefined ? checkMap[level] : 0.5;
}
```

**关键设计**：
- `safe` 等级置信度高（0.85-0.95）— 检测结果可靠
- `over` 等级置信度低（0.15-0.30）— 检测结果值得警惕
- 未知 check/level 回退到 0.5（中性）

### 2. 严重等级映射

```javascript
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

const SEVERITY_MAP = {
  certainty: { safe: 'info', caution: 'medium', over: 'high' },
  questions: { safe: 'info', caution: 'low', over: 'medium' },
  turingRoute: { safe: 'info', caution: 'medium', over: 'critical' },
  pzombieBoundary: { safe: 'info', caution: 'high', over: 'critical' },
};

function getSeverity(checkName, level) {
  const checkMap = SEVERITY_MAP[checkName];
  return checkMap && checkMap[level] !== undefined ? checkMap[level] : 'info';
}
```

**严重等级设计原则**：
- `critical`：违反核心哲学/安全原则（图灵路线、p-zombie边界）
- `high`：严重质量问题（绝对判断比例过高）
- `medium`：可改进的问题（反问过多、一致性振荡）
- `low`：小问题（轻微反问）
- `info`：无问题

### 3. 优先级排序的修复建议

```javascript
function generateFixRecommendations(results) {
  const recommendations = [];

  if (results.certainty.level === 'over') {
    recommendations.push({
      severity: 'high', check: 'certainty',
      message: '绝对判断比例超过30%。',
      action: '使用 soften() 自动替换',
      urgency: '尽快处理',
    });
  }
  // ... 更多检查 ...

  // 按严重等级排序
  recommendations.sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );
  return recommendations;
}
```

**关键设计**：
- 严重等级降序排列（critical 在最前）
- 每条建议包含 severity/check/message/action/urgency 5个字段
- 兼容旧版：`suggestion = fixRecommendations[0]?.message`

### 4. 振荡检测（跨句子模式分析）

```javascript
function detectOscillation(text) {
  if (!text || typeof text !== 'string') {
    return { hasOscillation: false, oscillationCount: 0, segments: [] };
  }

  const rawSentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 5);
  if (rawSentences.length < 3) {
    return { hasOscillation: false, oscillationCount: 0, segments: [] };
  }

  const segments = rawSentences.map((sentence, idx) => {
    let issueCount = 0;
    if (checkCertainty(sentence).level === 'over') issueCount++;
    if (checkQuestions(sentence).level === 'over') issueCount++;
    if (checkTuringRoute(sentence).level === 'over') issueCount++;
    if (checkPzombieBoundary(sentence).level === 'over') issueCount++;
    return { index: idx, text: sentence.slice(0, 80), issueCount };
  });

  // 检测振荡：问题→没问题→问题 或 没问题→问题→没问题
  let oscillationCount = 0;
  for (let i = 1; i < segments.length - 1; i++) {
    const prev = segments[i - 1], curr = segments[i], next = segments[i + 1];
    if (curr.issueCount > 0 && prev.issueCount === 0 && next.issueCount === 0) oscillationCount++;
    if (curr.issueCount === 0 && prev.issueCount > 0 && next.issueCount > 0) oscillationCount++;
  }

  return { hasOscillation: oscillationCount > 0, oscillationCount, segments: segments.slice(0, 20) };
}
```

**关键设计**：
- 需要至少3个句子（每句>5字符）才能检测振荡
- 短文本直接返回无振荡（避免误报）
- 最多返回20个分段（防止输出过长）

### 5. 双重标准检测

```javascript
function detectDualStandard(text) {
  if (!text || typeof text !== 'string') {
    return { hasDualStandard: false, patterns: [] };
  }

  const patterns = [];

  // 自我vs他人双重标准
  if (/我.*(?:错了|不对|糟糕|失败).*你.*(?:没关系|没事|别担心)/.test(text))
    patterns.push('self-strict-other-lenient');
  if (/你.*(?:错了|不对|糟糕|失败).*我.*(?:没关系|没事|别担心)/.test(text))
    patterns.push('self-lenient-other-strict');

  // 不同主题不同标准
  const topicPattern = /(?:关于|对于|针对|说到|提到)([^，。；]{2,10})/g;
  const topics = new Set();
  let topicMatch;
  while ((topicMatch = topicPattern.exec(text)) !== null) {
    topics.add(topicMatch[1].trim());
  }
  if (topics.size >= 2) {
    patterns.push('different-topics-different-standards');
  }

  return { hasDualStandard: patterns.length > 0, patterns };
}
```

## 验证清单
- [ ] `node --check` 语法通过
- [ ] 所有旧函数签名不变（向后兼容）
- [ ] 新函数被 `module.exports` 暴露
- [ ] `validateOutput()` 返回的新字段（oscillation/dualStandard/confidence/overallConfidence/fixRecommendations）都是可选的（旧代码不依赖它们）
- [ ] `var` → `const`/`let` 全部替换
- [ ] 空输入不崩溃（所有函数首行防御）
- [ ] 置信度映射表覆盖所有 check+level 组合
- [ ] 严重等级映射表覆盖所有 check+level 组合
- [ ] 修复建议按 severity 降序排列
