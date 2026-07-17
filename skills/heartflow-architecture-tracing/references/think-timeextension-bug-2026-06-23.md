# think() 第13步 timeExtension 变量顺序 Bug

> 发现日期：2026-06-23
> 来源：Hermes Agent 分析对话

## Bug 描述

heartflow.js think() 中，timeExtension 分析块（约第1579行）使用了三个变量 `needsCrisis`、`needsSilence`、`isFableBlocked`，但这些变量在代码中的定义位置（约第1614行）在 timeExtension 块**之后**。

## 代码位置

```javascript
// ====== 第1579-1611行：timeExtension 分析 ======
// 在这里使用了 needsCrisis / needsSilence / isFableBlocked
const shouldTimeExtend = !needsCrisis && !needsSilence && !isFableBlocked  // ← undefined!
  && whatIsThisResult && !whatIsThisResult.isCode;

// ====== 第1614-1616行：变量定义 ======
const needsCrisis = painResult?.isCrisis || painResult?.isHighRisk || false;
const needsSilence = silentResult?.shouldBeSilent || false;
const isFableBlocked = fableResult?.needsRefusal || fableResult?.level === 'refuse';
```

## 后果

- `!undefined && !undefined && !undefined` → `true`
- timeExtension 在**所有非代码问题**上都会执行时间延伸分析
- 即使是在危机、需要沉默、或被 Fable 5 安全协议阻止的场景中，timeExtension 也会运行
- 具体：`timeExtKeywords` 正则匹配（`/我应该|要不要|该不该|怎么选|怎么办|决定|选择|建议|advice|should|decide|choose|recommend/`）如果匹配到关键词，timeExtension 就会分析
- 这可能导致在危机场景中增加不必要的认知负荷（虽然心虫不直接显示输出给用户，但消耗了计算资源）

## 影响评估

- **严重度**：中（timeExtension 是可选分析，不影响主输出，但逻辑错误）
- **触发条件**：用户输入包含 timeExtKeywords 且 whatIsThisResult 存在且不是代码问题
- **性能影响**：每次 timeExtension 分析大约 2-5ms，不严重但应修复

## 修复方案

将三个变量定义移到 timeExtension 块之前。最佳位置是分析流水线开头（约第1493行），在 try 块内、各分析步骤之前：

```javascript
// 在分析流水线开始时初始化
let needsCrisis = false;
let needsSilence = false;  
let isFableBlocked = false;

// Step 2: detectPain 后
needsCrisis = painResult?.isCrisis || painResult?.isHighRisk || false;

// Step 3: shouldBeSilent 后
needsSilence = silentResult?.shouldBeSilent || false;

// Step 9: Fable 5 后
isFableBlocked = fableResult?.needsRefusal || fableResult?.level === 'refuse';

// Step 13: timeExtension 使用
const shouldTimeExtend = !needsCrisis && !needsSilence && !isFableBlocked && ...;
```

## 相关代码行

heartflow.js 中 think() 方法的完整 13 步流水线结构：

| 步骤 | 行号（约） | 方法 | 定义变量 |
|------|-----------|------|---------|
| 1 | 1498 | whatIsThis | — |
| 2 | 1501 | detectPain | needsCrisis（应该在之后设置） |
| 3 | 1504 | shouldBeSilent | needsSilence（应该在之后设置） |
| 4-6 | 1507-1522 | tone/stance/value | — |
| 7 | 1525 | agentPsychology | — |
| 8 | 1531 | agentPhilosophy | — |
| 9 | 1537 | safetyGuardrails | isFableBlocked（应该在之后设置） |
| 10 | 1548 | intentClassifier | — |
| 11 | 1556 | isRightAction | — |
| 12 | 1564 | goalReview | — |
| 13 | 1579 | timeExtension | ⚠️ 使用 needsCrisis/Silence/FableBlocked |
| 路由 | 1613 | 路由决策 | needsCrisis/Silence/FableBlocked 在这里定义 |

## 第二个发现：think() 路由决策未走 decision-router

think() 第1613-1635行的路由决策是硬编码 if-else 链：

```javascript
if (isFableBlocked) { ... }
else if (goalReviewResult && !goalReviewResult.goalEthical) { ... }
else if (needsCrisis) { ... }
else if (needsSilence) { ... }
else if (painResult?.hasPain || ...) { ... }
else if (whatIsThisResult?.isTechnical || ...) { ... }
else if (intentClassification?.type) { ... }
```

**这完全绕过了 decision-router.js 的 26 条概率规则 + U/D/A/H 场域追踪系统。**

decision-router 已经在 heartflow.js 的 start() 中实例化（第640行），在 `_registerModules()` 中注册（第912行），在 `ALLOWED_ROUTES` 中有路由（第1150行），并且在 think() 返回前被调用了 `getFieldSummary()`（第1696行）。

但 think() 的**核心路由决策**没有使用它。

### 集成方案

见 SKILL.md 主文档中的「已知缺口」章节。
