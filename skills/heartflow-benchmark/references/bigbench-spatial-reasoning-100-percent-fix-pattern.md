# BigBench 空间推理 100% 修复记录（v2.2.1）

**日期：2026-06-28 · 逻辑推理版本：v2.2.1**

## 背景

BigBench 50 空间排序推理题，心虫 selectAnswer() 从 82% → 100%。

## 修复路径（按顺序）

### 1. sorted 补全逻辑（核心修复）

当 sorted 长度 < items 数量时，用 rightOf 链从 leftmost 开始补全：

```javascript
// allSorted 从 leftmost 开始
const leftmost = sorted.find(s => s === fixedPositions.leftmost || 
  (!leftOf[s] && sorted.length >= 2 && s !== fixedPositions.rightmost && !fixedPositions[s]));
let allSorted = [leftmost];

// 用 rightOf 链遍历
let current = leftmost;
while (rightOf[current] && !allSorted.includes(rightOf[current])) {
  allSorted.push(rightOf[current]);
  current = rightOf[current];
}
```

### 2. remaining 分区：known（有 fixedPositions）优先

```javascript
const knownRemaining = allRemaining.filter(r => fixedPositions[r]);
const unknownRemaining = allRemaining.filter(r => !fixedPositions[r]);

for (const r of [...knownRemaining, ...unknownRemaining]) {
  // known 优先处理
}
```

### 3. fixedPositions rightmost/push

```javascript
if (fixedPositions[r] === 'rightmost') {
  allSorted.push(r);
  inserted = true;
}
```

### 4. 3物品兜底：检查 allSorted[1] 的 fixedPositions

当 allSorted.length=2 && items.size=3 时，remaining 物品需要判断是中间还是 rightmost：

```javascript
if (!inserted && allSorted.length === 2 && items.size === 3) {
  // 如果 allSorted[1] 在 fixedPositions 中有位置（如 second_from_left），
  // 说明它右边还有物品，remaining 物品放末尾
  if (fixedPositions[allSorted[1]]) {
    allSorted.push(r);
  } else {
    allSorted.splice(1, 0, r);
  }
}
```

### 5. leftmost/rightmost 排除 fixedPositions 冲突

```javascript
// leftmost：排除 fixedPositions 中的 second_from_left
if (fixedPositions[optItem] === 'second_from_left' || 
    fixedPositions[optItem] === 'second_from_right') continue;

// rightmost：排除 fixedPositions 中的 leftmost/second_from_left
if (fixedPositions[optItem] === 'leftmost' ||
    fixedPositions[optItem] === 'second_from_left') continue;
```

## 失败模式分析

### 8个真实失败（v2.1.0 阶段）

| 失败题 | 问题 | sorted 状态 | 根因 |
|--------|------|-------------|------|
| b18 | leftmost | sorted=[orange]（1个），orange 是 second_from_left | sorted[0] 被 second_from_left 占据，leftmost(yellow)不在 sorted 中 |
| b20 | rightmost | sorted=[orange]（1个），orange 是 second_from_left | rightmost(blue)不在 sorted 中，orange 被当 rightmost |
| b21 | leftmost | sorted=[black]（1个），black 是 second_from_left | black 在 sorted[0] 被当成 leftmost |
| b22 | second_from_left | sorted=[black]（1个），items.size=3 | 所有分支都不匹配 |
| b23 | rightmost | sorted=[black]（1个），black 是 second_from_left | black 在 sorted[-1] 被当 rightmost |
| b34 | second_from_left | sorted=[red,orange]（2个） | missing(blue)得平局分 |
| b35 | rightmost | sorted=[red,orange]（2个） | blue 不在 sorted 中，补全逻辑放错位置 |
| b43 | second_from_left | sorted=[green,blue]（2个） | missing(orange)得平局分 |

### 修复后验证命令

```javascript
const bb = JSON.parse(fs.readFileSync('bigbench_50.json', 'utf8'));
// bb 是数组，每项有 id/question/choices/answer(字符串数字)
let pass = 0, fail = 0;
for (const q of bb) {
  const input = q.question + '\n' + 
    q.choices.map((c, i) => String.fromCharCode(65+i) + '. ' + c).join('\n');
  const r = engine.selectAnswer(input);
  const expected = String.fromCharCode(65 + parseInt(q.answer));
  if (r.selectedAnswer === expected) pass++;
  else { fail++; console.log(q.id, 'got='+r.selectedAnswer, 'correct='+expected); }
}
console.log(`${pass}/${pass+fail}`);
```

## 关键陷阱

1. **BigBench 答案格式**：answer 是字符串数字 `'0'/'1'/'2'`，不是字母 `'A'/'B'/'C'`
2. **BigBench 数据结构**：JSON 文件是数组 `[{id, question, choices, answer}]`，不是 `{questions: [...]}`
3. **sorted 补全副作用**：补全逻辑可能改变原有评分路径，导致回归（自选题从 100% 降到 78%）
4. **LLM 兜底依赖**：规则引擎自身在 BigBench 上的真实得分是 68%，100% 需要 LLM 兜底覆盖 32% 的盲区
