# Unified Reasoning Chain — v11.33.3

## Architecture

```
Input → [8 engines] → Confidence + Verdict + Repair Hints
         ┌──────────────────────────────────────────────┐
         │ PlanAndSolve    10%  ACL 2023 问题理解+计划     │
         │ SyllogismCheck  15%  形式逻辑/肯定后件/否定前件  │
         │ DecisionVerify  15%  arXiv 2312.09210 自验证    │
         │ DaoDecision     10%  道法自然/反者道之动/为而不争/不言之教 │
         │ Consciousness   5%   意识深度自适应(>30=THOROUGH)  │
         │ DialecticRecall 5%   L1表面/L2因果/L3元认知      │
         │ Uncertainty    20%   认知/随机/幻觉 三阶量化     │
         │ Counterfactual  20%   反方生成+前提质疑         │
         └──────────────────────────────────────────────┘
```

## Usage

```javascript
const { reason } = require('./src/core/unified-reasoning-chain.js');

const result = reason({
  text: '用户输入/待审查的推理',
  messages: [{ role, content }],  // 用于意识深度评估
  goal: '用户原始目标'
});

result.verdict        // LIKELY_CORRECT / NEEDS_REVISION / HALLUCINATION_RISK / REJECTED_BY_DAO
result.confidence     // { finalScore, componentScores }
result.repairHints   // [{ type, severity, hint, suggestion }]
result.actionable     // { proceed, confidence, keyConcerns }
```

## Verdict Types

| Verdict | Meaning | Action |
|---------|---------|--------|
| `LIKELY_CORRECT` | 所有引擎通过 | 直接输出 |
| `NEEDS_REVISION` | 部分引擎警告 | 按 repairHints 修正 |
| `HALLUCINATION_RISK` | 幻觉风险检测 | 必须加入校准表达 |
| `REJECTED_BY_DAO` | 道论过滤器拒绝 | 调整表述后重试 |
| `LOW_CONFIDENCE` | 综合置信度<60% | 补充证据/多源验证 |

## Module Details

### SyllogismChecker
Simple variables (P/Q): correctly detects Modus Ponens, Modus Tollens, Affirming Consequent, Denying Antecedent.
Complex Chinese sentences: pattern matching may miss — use `verifyChain({ statements, claim })` for precise calls.

### UncertaintyQuantifier
Three-axis: epistemic (reducible) + aleatoric (irreducible) + hallucination risk.
Generates calibrated phrase: `✓ 我对X有较多了解，但仍...` / `△ 我的了解有限，建议查阅专业资料`

### CounterfactualEngine
`反者道之动` implementation: challenges certainty signals (`当然/必然/一定`) and premise assumptions.
`generateContraryScenario()`: simple negation swap — `是→不是/有→没有` — for "what if" generation.

### DaoDecision
Four filters: 道法自然 / 反者道之动 / 为而不争 / 不言之教.
Trigger: `soft词+force词` = most dangerous (covert control).
