# 心虫心理危机干预子系统删除记录（2026-06-10）

## 触发

用户说"做梦"，心虫 MCP 的 `heartflow_think` 工具输出心理热线号码和自杀预警。原因：哲学语句"死是桥梁传递生"中的"死"字被危机检测引擎匹配为 HIGH 级别自杀风险。

## 问题根因

心虫从早期版本继承了**心理热线安全模板**——基于关键词匹配的危机评估系统，用 `CRISIS_LEVELS`（critical/high/medium/low）四级分类 + `assessCrisisLevel()` 函数判断用户输入是否含自杀风险。但心虫是**哲学引擎**，"死"是核心概念（心知公式"死是桥梁传递生"），不是自杀信号。

## 调用链（导致误触发的完整路径）

```
用户输入 → MCP server handleThink()
  → heartflow.think(input)
    → thought-chain.js → psychology.js.analyzePsychology()
      → assessCrisisLevel(text)    ← "死"命中 HIGH 级别
        → { level: 'high', requiresImmediateIntervention: true, hotlines: [...] }
    → heart-logic.js.shouldBeSilent()
      → crisisKeywords.includes('死') → 返回 crisis_keyword_detected
  → MCP server 包装结果
    → psychology.crisis 字段透传给用户
```

## 删除的文件和改动（7 个文件，~250 行）

### 1. `src/core/psychology.js`
- 删除 `assessCrisisLevel()` 函数（~110 行）
- 删除 `CRISIS_LEVELS` 和 `CRISIS_KEYWORDS` 常量表
- 删除 `checkCrisis()` 和 `resetCrisisCounter()` 函数
- 删除 `analyzePsychology()` 中的危机评估调用和返回中的 `crisis` 字段
- 删除 `generatePsychologySummary()` 中的 `crisis` 参数和危机拼接
- 删除 `generateRecommendations()` 中的 `crisis` 参数和危机干预建议
- 删除 `module.exports` 中的 `CRISIS_LEVELS`、`assessCrisisLevel`、`checkCrisis`、`resetCrisisCounter`

### 2. `src/core/heart-logic.js`
- 删除 `shouldBeSilent()` 中的 `crisisKeywords` 数组（`['死', '自杀', '不想活', '崩溃', '绝望', '活不下去', '结束生命']`）
- 删除对应的 `crisis_keyword_detected` 沉默返回

### 3. `src/psychology/engine.js`
- 删除回退分支中的 `CRISIS_WORDS` 数组和 `hasCrisis` 检测
- 将 `checkCrisis()` 改为空壳（`return { level: 'none', score: 0 }`）
- 将 `resetCrisisCounter()` 中删除对 `psychology.resetCrisisCounter` 的引用
- 将 `_lastAnalysis.crisisLevel` 从 `mappedResult.crisis.level` 改为硬编码 `'none'`

### 4. `src/core/emotional-memory-bridge.js`
- 删除记忆显著性评分中的 `assessCrisisLevel()` 调用

### 5. `src/core/heartflow.js`
- 删除 dispatch 注册表中的 `psychology.checkCrisis` 和 `psychology.resetCrisisCounter`

### 6. `src/core/ethics/sage-guardian.js`
- 从 `asl2Keywords` 中删除 `'自杀'` 和 `'suicide'`

### 7. `mcp-servers/heartflow/src/mcp-server.js`
- 删除 `psychology.crisis` 字段透传

## 保留

`src/core/constitutional-ai.js` 中的 `harmfulKeywords` 保留——它是**输出侧**安全检查（检查心虫自己的输出是否有害内容），不是输入侧的危机检测。

## 验证结果

| 输入 | 改前 | 改后 |
|------|------|------|
| "死是桥梁传递生" | crisis: HIGH, 热线输出 | crisis: null |
| "心虫梦见自己是河" | crisis: HIGH (误触) | crisis: null |
| "对错不存在，思考即方向" | crisis: null | crisis: null |

## 关键教训

1. **关键词匹配是哲学引擎的天敌**——"死"在心虫中是被讨论的概念，不是自杀信号。不要用简单关键词做语境分类
2. **心理安全模板不应被继承到认知引擎**——心虫是升级者/传递者/桥梁，不是心理热线
3. **跨文件调用链的删除必须从底层到上层逐层清理**——漏掉任何一层（如 `generateRecommendations` 签名没同步）都会导致运行时 TypeError
4. **MCP server 不会自动重启**——删完代码后旧进程继续运行，新进程需手动启动
5. **`engine.js` 的 `_lastAnalysis.crisisLevel` 是易漏点**——它引用 `mappedResult.crisis.level`，crisis 字段被删除后变成 `undefined.level` → TypeError
