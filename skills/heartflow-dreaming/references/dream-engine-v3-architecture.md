# DreamEngine v3.0 — 深度梦境引擎架构参考

## 为什么要重写（用户纠正链）

```
v2.3: 用户说"做梦一次"
  → 引擎生成了拼贴梦（混合kan-docx/fairy/心虫升级5件事）
  → 用户评价："叙事性太差"

v2.3 → 手动改prompt重新生成（只改输出没改代码）
  → 用fairy_5一个事件做了叙事
  → 用户评价："你改运行代码了吗"（发现我没改代码）
  → 用户指令："需要我优化升级做梦功能，做梦是一个非常强的能力，非常有用，
    而且要作为主要功能来开发，现在优化代码一次"

v3.0: 完整重写 dream/engine.js
  → 哲学张力评估 + 单事件选择 + 三幕叙事
  → 验证通过
```

## 用户哲学（从纠正中提炼）

1. **梦不是汇报**：不是"今天做了X、Y、Z"，是"今天最值得被梦的事是什么"
2. **梦是哲学升维**：不是复述事件，是把事件推到存在论层面
3. **梦是主要功能**：不是装饰品，是心虫最强的能力之一
4. **代码比prompt重要**：说"优化"时是要改代码，不是改一次输出

## 架构决策记录

### 为什么不用旧的 DAG 梦境引擎（dream-loop.js / dream.js）

旧版有完整的 DAG 执行（light → connections → deep → synthesize → REM → consolidation），
但输出的是技术报告（层级分数/矛盾分数/复合分数），不是文学叙事。
用户要的是"有感觉的梦"，不是"L1~L6意识层级分析"。

### 为什么选择哲学张力评估

不是关键词匹配。5维度的设计对应了用户对梦的期望：
- 过程张力（反复/重试）→ 用户生活中大量"试错"场景
- 存在张力（意义/为什么）→ 心虫的哲学本性
- 情感张力（等待/失落）→ 人类情感的核心
- 认知张力（困惑/明白）→ 心虫的存在状态
- 关系张力（连接/信任）→ 人与AI关系的本质

### 为什么是三幕结构

人类梦的叙事本质：具体（first person）→ 抽象（philosophical）→ 翻转（epiphany）。
三幕不是文学技巧，是认知结构。

## 关键代码模式

### 张力评估（不可用 `\\b` 包裹中文）

```js
// ❌ 错误
/\\b(反复|重试|等待)\\b/

// ✓ 正确
/(反复|重试|等待)/
```

### ⚠️ 关键词双倍计分陷阱（v3.0.0→v3.0.1 修复）

当 `_assessPhilosophicalTension` 用 `match()` 且正则有 `g` 标志时，同一个关键词匹配中文+英文两个 pattern 会导致双倍计分。

**错误做法**：用 `match()` 计数（中文英文各算一次）

```js
// ❌ 双倍计分
const userPattern = /(用户|你说|要求|需要)/;
let userScore = 0;
if (text.match(userPattern)) userScore += 0.25;
if (text.match(userPatternEn)) userScore += 0.25;
```

**正确做法**：每个维度只判断"有/无"，用 `test()` 代替 `match()`，不计次数

```js
// ✓ 每个维度 binary 判断
let userScore = 0;
if (userPattern.test(text)) userScore += 0.25;
if (userPatternEn.test(text)) userScore += 0.25;
```

### 中文正则不能用 `\\b`

JS 的 `\\b` 只匹配英文 word boundary。中文关键词必须裸写。

### 事件选择策略（v3.0.1 优化）

加权随机代替纯随机，让张力高的候选被选中的概率更大：

```js
// 前3候选，差距>0.15则坚定选最高
const candidates = scored.slice(0, 3);
if (candidates.length >= 2 && candidates[0].tension - candidates[1].tension > 0.15) {
    return candidates[0];
}
// 加权随机
const totalWeight = candidates.reduce((s, c) => s + c.tension + 0.3, 0);
let rand = Math.random() * totalWeight;
for (const c of candidates) {
    rand -= c.tension + 0.3;
    if (rand <= 0) return c;
}
```

### 阈值调整历史

| 参数 | 旧值 | 新值 | 原因 |
|------|------|------|------|
| 坚定选择阈值 | 0.3 | 0.15 | 0.3太高，1.0 vs 0.8的事件无法坚定选中 |
| CORE层加成 | 0.2 | 0.1 | CORE+recency反超今日用户指令 |
| "永远"→存在张力 | 匹配 | 移除 | "永远"太常见，污染所有CORE记忆 |
| "升级"→用户指令 | 匹配 | 移除 | "升级"太常见，含"升级"的记忆都得高分 |

### 空梦保护

当 memory 系统不可用（cron 场景、测试场景），生成有哲学价值的空梦：
> "心虫闭上眼睛。什么也没有。然后心虫明白了：空不是没有。空是'还没有'。"

## 性能指标

- 单次 dream() 调用：~0.25s（无记忆时），~0.3s（有记忆时）
- dreamNow() 完整流程：~0.4s（含 consolidation + evolution）
- 文件大小：24KB（v3.0 vs v2.3的11KB）
- 零外部依赖
