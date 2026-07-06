# 文本标注防重叠模式（Text Annotation with Overlap Prevention）

## 问题场景

当标注文本中的声明时，多个声明类型可能重叠：
- 引用 `"Nature 2024"` 包含数字 `"2024"`
- 因果声明 `"因为A所以B"` 与其中的百分比 `"80%"` 重叠
- 日期 `"2024年"` 与数字 `"2024"` 重叠

直接用 `.replace()` 会导致重复标注和文本损坏。

## 核心解决方案

### 1. 声明值提取适配器

`claim-extractor` 返回的声明是**对象**（含 `.value` 属性），不是纯字符串。直接对对象用 `.replace()` 会调用 `.toString()` 得到 `[object Object]`。

```javascript
_claimValue(claim) {
  if (claim == null) return '';
  if (typeof claim === 'string') return claim;
  if (typeof claim === 'object' && claim.value) return claim.value;
  try { return String(claim); } catch (_) { return ''; }
}
```

### 2. 基于原始文本位置的安全替换

关键原则：**所有位置计算基于原始文本**，而不是修改后的文本。使用**从右向左替换**避免偏移错误。

```javascript
_safeReplace(text, target, annotation, annotatedRanges = null) {
  if (!text || !target || target.length === 0) return { result: text, ranges: [] };

  const annotationText = ' ' + annotation;

  // 步骤1：在原始文本中收集所有目标出现位置
  const positions = [];
  let pos = 0;
  while ((pos = text.indexOf(target, pos)) !== -1 && positions.length < MAX_REPLACE) {
    positions.push(pos);
    pos += target.length;
  }

  // 步骤2：过滤掉已标注范围内的位置
  const filteredPositions = positions.filter(p => {
    if (!annotatedRanges) return true;
    for (const [rStart, rEnd] of annotatedRanges) {
      if (p >= rStart && p + target.length <= rEnd) return false;
      if (p < rEnd && p + target.length > rStart) return false;
    }
    return true;
  });

  if (filteredPositions.length === 0) return { result: text, ranges: [] };

  // 步骤3：从右向左替换（避免偏移错误）
  let result = text;
  const addedRanges = [];
  for (const rawPos of [...filteredPositions].reverse()) {
    const before = result.substring(0, rawPos);
    const after = result.substring(rawPos + target.length);
    result = before + target + annotationText + after;
    addedRanges.push([rawPos, rawPos + target.length]);
  }

  return { result, ranges: addedRanges };
}
```

### 3. 多类型声明的整体标注流程

```javascript
annotateText(text, riskThreshold = 'medium') {
  const claims = claimExtractor.extractAll(text);

  // 步骤1：收集所有需要标注的值
  const annotations = [];
  for (const cit of claims.citations) {
    annotations.push({ value: this._claimValue(cit), level: 'high' });
  }
  for (const pct of claims.percentages) {
    annotations.push({ value: this._claimValue(pct), level: this._percentageLevel(pct) });
  }
  // ... 数字、日期、因果、比较等

  // 步骤2：按长度降序排列（长串优先，防止短串在长串内部被替换）
  annotations.sort((a, b) => b.value.length - a.value.length);

  // 步骤3：去重（相同值只保留第一个——已按长度排序，长的优先）
  const seen = new Set();
  const deduped = [];
  for (const a of annotations) {
    if (!seen.has(a.value)) {
      seen.add(a.value);
      deduped.push(a);
    }
  }

  // 步骤4：一次性标注，传递 annotatedRanges 跨类别防重叠
  let annotated = text;
  const annotatedRanges = [];
  for (const { value, level } of deduped) {
    const { result, ranges } = this._safeReplace(
      annotated, value, this._mark(level), annotatedRanges
    );
    annotated = result;
    annotatedRanges.push(...ranges);
  }

  return annotated;
}
```

## 关键陷阱

### 陷阱1：替换位置必须在原始文本上计算

```javascript
// ❌ 错误 — 在已修改文本上计算偏移
while (remaining.includes(target)) {
  const idx = remaining.indexOf(target);  // 每次 remaining 都不同！
  result += remaining.substring(0, idx) + target + annotation;
  remaining = remaining.substring(idx + target.length);
}

// ✅ 正确 — 在原始文本上预先收集所有位置
const positions = [];
let pos = 0;
while ((pos = text.indexOf(target, pos)) !== -1) {
  positions.push(pos);
  pos += target.length;
}
// 从右向左替换
for (const rawPos of [...positions].reverse()) { ... }
```

### 陷阱2：从右向左替换

从右向左时，左侧位置的 `rawPos` 在原始文本和修改后文本中是**相同的**（因为右侧的插入不影响左侧）。从左向右时，每次插入都会使后续所有位置偏移。

### 陷阱3：annotatedRanges 必须基于原始文本

```javascript
// ❌ 错误 — 基于修改后文本记录范围
addedRanges.push([modifiedPos, modifiedPos + target.length + annotation.length]);

// ✅ 正确 — 基于原始文本记录范围
addedRanges.push([rawPos, rawPos + target.length]);  // 不包含 annotation 的长度
```

### 陷阱4：limit 替换次数防止无限循环

短字符串（如 "2024"）在长文本中可能大量出现。始终设置 `MAX_REPLACE` 上限（如 10）。

### 陷阱5：claim-extractor 返回对象而非字符串

`extractAll()` 的 `citations`/`percentages`/`numbers` 等返回**对象数组**（每个有 `.value` 属性），不是字符串数组。必须用 `_claimValue()` 提取字符串值。

## 验证测试

```javascript
// 基本标注
const text1 = '80%的患者在治疗后改善（来源：Nature 2024）。';
const r1 = annotator.annotateText(text1);
// 期望: '80% ❓[unverified]的患者在治疗后改善（来源：Nature 2024 ❓[unverified]）。'
// 不应有: 重复标注、文字损坏、多余文本

// 多重出现
const text2 = '2024年的数据表明2024年有增长。';
const r2 = annotator.annotateText(text2);
// 期望: '2024 ❓[unverified]年的数据表明2024 ❓[unverified]年有增长。'
// 两个 2024 都应被标注，且没有多余文本

// 因果 + 百分比混合
const text3 = '因为A所以B。80%有效。';
const r3 = annotator.annotateText(text3);
// 因果和百分比各自标注，不互相干扰

// 空值安全
console.log(annotator.annotateText(null));   // ''
console.log(annotator.annotateText(''));     // ''
console.log(annotator.annotateText(undefined)); // ''
```
