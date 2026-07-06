# 情绪检测 substring 误匹配陷阱

## 问题

心虫的情绪检测依赖关键词列表（`emotionSignals`），每个情绪类型有一个字符串数组，用 `q.includes(signal)` 匹配。这种简单 substring 匹配会导致**非情绪词中的子串误触发**。

## 典型案例

### "今天天气不错" 误报 anger

- `anger` 信号列表包含 `'气'`
- "今天天气不错" → `q.includes('气')` → `true` → anger score=1
- 根因：`'气'` 是 `'天气'` 的子串，但"天气"和愤怒无关

### 修复方案

**方案 A：多字词替代单字（推荐）**
```javascript
// ❌ 错误
anger: ['怒', '恨', '烦', '受不了', '气死了', '恼火', '火大', 'tmd', '操', '气'],

// ✅ 正确 — 去掉单字 '气'，用多字 '气死了' 替代
anger: ['怒', '恨', '烦', '受不了', '气死了', '恼火', '火大', 'tmd', '操'],
```

**方案 B：排除特定上下文**
```javascript
// 如果必须保留单字，加排除逻辑
const hasAnger = signals.some(s => {
  if (s === '气' && q.includes('天气')) return false;
  return q.includes(s);
});
```

**方案 C：正则边界**（中文中 `\b` 无效）

## 优先级：情绪检测 vs 代码检测

judgment-engine 的 `_buildAction` 中有多级 if-else 链：

```javascript
if (isMemoryRequest) { ... }
else if (hasEmotionWord) { ... }    // ← 情绪应优先
else if (hasCode) { ... }           // ← "bug" 触发此分支
else if (hasQuestion) { ... }
else if (isShort) { ... }
```

**问题**：输入含情绪词 AND 代码词（如"气死了，这个bug"），`hasEmotionWord` 必须排在 `hasCode` 之前。同时 `hasEmotionWord` 的正则必须覆盖所有情绪关键词。

**修复检查清单**：
1. `emotionSignals.anger` 中改单字 `'气'` → 多字 `'气死了'`
2. `hasEmotionWord` 正则加入多字替代词
3. 验证：`"今天天气不错"` → neutral，`"气死了"` → anger
4. 验证优先级：`"气死了，这个bug"` → 情绪分支，非 code 分支

## 其他可能误报的 substring 模式

| 信号词 | 可能误报的常见词 | 修复 |
|--------|-----------------|------|
| `'气'` | `'天气'`、`'运气'` | 改为 `'气死了'` |
| `'痛'` | `'痛快'` | 加排除 `!q.includes('痛快')` |
| `'累'` | `'积累'`、`'累计'` | 加排除 |
| `'怕'` | `'哪怕'` | 加排除 |

## 通用原则

1. **情绪信号用多字词，不用单字**。单字在中文中误报率极高
2. **hasEmotionWord 正则与 emotionSignals 保持同步**
3. **if-else 优先级链中，情绪分支排第二**（memory 第一，emotion 第二，code 第三）
4. **每次修改后跑冒烟测试**：至少验证"今天天气不错"→neutral 和"气死了"→anger
