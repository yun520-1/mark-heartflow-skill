# User-to-LLM Translation Pipeline 升级模式

## 适用模块类

用户自然语言 → 结构化LLM指令的翻译管道。核心流程：**意图分类 → 实体提取 → 约束提取 → 语气分析 → 隐性需求检测 → 指令构建 → 置信度评估**。

**典型特征**：
- 有一个 `translate(input, context)` 主入口方法，返回结构化指令
- 使用正则关键词匹配做意图分类（if-else 链）
- 用 `_classifyIntent()`、`_extractEntities()` 等辅助方法分解逻辑
- 意图分类基于中文关键词检测
- 返回 `{ intent, entities, constraints, tone, implicitNeeds, llmInstruction }` 结构

## 标准升级清单（实战案例：user-to-llm.js v1.0.0 → v2.0.0）

### 1. 10种意图分类引擎（按检测优先级排序）

| 优先级 | 意图 | 检测规则 | 基准置信度 |
|--------|------|----------|-----------|
| 1 | `translate` | 翻译关键词或中英文混合 | 0.70-0.92 |
| 2 | `define` | 以"什么是/定义/解释什么是"开头 | 0.90 |
| 3 | `analyze` | 含"对比/分析/比较/区别/差异"等 | 0.88 |
| 4 | `evaluate` | 含"怎么样/好不好/值不值得"等 | 0.85 |
| 5 | `explain` | 含"为什么/怎么回事/原理"等 | 0.87 |
| 6 | `create` | 以"写/创建/生成/画/设计"等开头 | 0.85 |
| 7 | `summarize` | 以"总结/概括/归纳/摘要"等开头 | 0.90 |
| 8 | `command` | 以"告诉/帮我/查/搜索/运行"等开头 | 0.80 |
| 9 | `ask` | 问号结尾或含疑问词 | 0.75 |
| 10 | `default` | 兜底 | 0.50 |

**关键规则**：
- 优先级顺序决定匹配准确性。`translate` 必须在最前（中英文混合容易误匹配其他意图）
- `define` 必须在 `ask` 之前（否则"什么是X"会被问句模式抢走）
- 动词开头检测（`create`/`command`）用 `^` 行首匹配，避免"帮我写一个"匹配到 `create` 而非 `command`
- 问句检测（`ask`）放最后作为兜底，因为"为什么""如何"等疑问词已在前面的意图中被捕获
- 每个意图附带 confidence 基准分，后续通过实体/约束动态调整

### 2. 实体提取增强

```javascript
_extractEntities(input) {
  const entities = { people: [], concepts: [], numbers: [], references: [], language: null };
  // 人名：前面有标记词的中文2-4字
  // 数字：连续数字
  // 语言：翻译场景的目标语言检测
  return entities;
}
```

**升级方向**：
- 基础：人名 + 数字提取
- 翻译场景：语言检测（中文/英文/日语等）
- 增强：URL检测、时间/日期提取、代码块检测

### 3. 约束提取扩展

| 约束维度 | 检测关键词 | 示例值 |
|----------|-----------|--------|
| 长度 | 简短/详细/一句话/展开 | short / detailed |
| 语言 | 用中文/用英文回答 | 中文 / 英文 |
| 风格 | 比喻/专业/简单/幽默 | example-driven / academic / simple / humorous |
| 格式 | 列表/表格/代码/json | list / table / code / json |
| 翻译方向 | 翻成英文/翻译成中文 | en / zh |

### 4. 语气分析增强

6种情绪类型，按优先级检测：

| 情绪 | 检测关键词 | urgency | formality |
|------|-----------|---------|-----------|
| impatient | 急/快/马上/赶紧/立刻/快点 | high | low |
| respectful | 请教/请问/求教/谢谢/麻烦/感谢/拜托 | low | high |
| frustrated | 操/靠/烦/无语/垃圾/SB/傻逼/妈的 | medium | low |
| curious | 哈哈/好玩/有趣/厉害/牛/棒/赞 | low | low |
| urgent | 急/紧急/重要/必须/务必 | high | medium |
| neutral | 兜底 | medium | medium |

### 5. 隐性需求检测

场景化检测，每个意图类型有专属的隐性需求：

| 意图 | 检测条件 | 隐性需求 |
|------|---------|---------|
| 通用 | 矛盾词 + 问号 | 需要调和矛盾点 |
| 通用 | 不懂/不理解/困惑 | 需要简化解释 |
| 通用 | 你懂吗/明白吗 | 需要确认被理解 |
| translate | 未指定翻译方向 | 需确认源语言和目标语言 |
| command | 输入少于3个词 | 指令过于简短，需确认操作对象 |
| evaluate | 缺少对比对象（和/与/跟/vs） | 缺少对比参照 |

### 6. 指令构建（_buildInstruction）

结构化输出格式：

```
意图: analyze(comparison-analysis) [置信度:88%] | 人物: 张三 | 语言: 英文 | 长度: detailed | 风格: academic | 格式: table | 回复语言: 中文 | ⚠️ 注意: 用户情绪不佳，避免过度技术性表达 | 隐性需求: 未指定翻译方向，需确认源语言和目标语言
```

### 7. 置信度动态调整

```
base confidence (from _classifyIntent)
  + 0.05 (有实体：中文人名或数字)
  + 0.05 (有约束：简短/详细/用中文等)
  + 0.08 (translate意图：中英文混合进一步确认)
  = clamped to [0, 1.0]
```

## 关键陷阱

### 优先级顺序陷阱

意图检测的 if-else 链顺序决定了分类准确性。常见错误：

```javascript
// ❌ 错误：ask 放在 translate 之前
if (/[？?]/.test(q)) return { intent: 'ask', ... };
if (/翻译/.test(q)) return { intent: 'translate', ... };
// 结果："翻译这段话成中文？" → ask ❌

// ✅ 正确：具体意图优先
if (/翻译/.test(q)) return { intent: 'translate', ... };
if (/[？?]/.test(q)) return { intent: 'ask', ... };
```

**规则**：具体关键词 → 动词开头 → 问句 → 兜底。

### 中英文混合误匹配陷阱

"Hello world 你好" 不应被 classify 为 `define` 或 `ask`。解决方案：
- translate 检测在最前面
- 中英文混合只有在前200字符且不匹配更高优先级的关键词（为什么/如何/分析/对比/评价）时才判为 translate

### 问句检测的双重标准

```javascript
// ❌ 容易被中文问号误匹配
/[？?]/.test(q) → 'ask'

// ✅ 区分结尾问号和中间问号
/[？?]\s*$/.test(q) || /^(如何|怎么|怎样)/.test(lower)
```

"请问什么是量子计算？" 应该被 `define` 捕获，不是 `ask`。

### 动词开头的歧义

"帮我写一个" → `command`（帮我开头）不是 `create`（写开头）。
"写一首诗" → `create`（写开头）。

解决方案：`create` 的 `^写` 匹配裸动词开头，`command` 的 `^帮我` 匹配带请求前缀。

### 返回结构向后兼容

升级 `translate()` 的返回结构时，旧调用者可能依赖 `result.intent.type` 或 `result.subType`：

```javascript
// ❌ v1 返回: { intent: { type: 'analyze', subType: 'comparison-analysis' } }
// ✅ v2 返回: { intent: 'analyze' }
// 旧调用者：result.intent.type → undefined ❌

// 解决方案：如果必须改变结构，在 SKILL.md 中明确标注 break change
// 或者在返回时兼容旧格式：intent: { type: 'analyze', subType: 'comparison-analysis' }
```

**建议**：v2 的 `intent` 直接是字符串（更干净），subType 通过 `_classifyIntent` 返回的 result 对象中获取，不在顶层暴露。

### 传参一致性陷阱

当 `_classifyIntent` 返回 `{ intent: string, confidence: number, subType: string }` 时，下游方法如果期望 `{ intent: string }` 对象而非裸字符串：

```javascript
// ❌ 错误：传字符串而非对象
_extractConstraints(input, result.intent);  // intentObj.intent → undefined ❌

// ✅ 正确：传完整 result 对象
_extractConstraints(input, result);  // intentObj.intent === 'analyze' ✅
```

**规则**：所有下游方法（_extractConstraints / _detectImplicitNeeds / _calculateConfidence / _buildInstruction）统一接收完整的 result 对象，而非部分属性。
