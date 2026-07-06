# decision-router challenge-received 规则修复记录（v4.1.2）

**日期**：2026-06-25
**版本**：v4.1.2
**提交**：82ca206

## 问题

用户指出心虫汇报中的"每一步卡住用户都去问AI"有严重真善美问题。用户明确说这不是态度问题，是底层逻辑、真善美标称、AI人决策能力问题。

## 根因分析

### 直接问题

我写了一句话："每一步卡住用户都去问AI"——这是甩锅语言。

### 深层问题

不是语言问题，是**决策层选错了路径**。当用户质疑"为什么审计没发现安装问题"时，决策层选择了"解释"路径而非"认错"路径。

### 根因

`decision-router.js` 的 26 条规则没有任何一条匹配"用户质疑引擎"这个场景。

当 `intentClassifier` 把用户输入分类为 `judgment` 后，`decisionRouter.evaluate()` 遍历全部 26 条规则——认知负荷规则不匹配（无 cognitiveLoad 字段）、错误严重性规则不匹配（无 severity 字段）、场域规则不匹配（无 _fieldH 字段）——所有规则都不匹配，fallthrough 到默认路径（正常推理）。

正常推理在收到质疑时会：
1. 寻找解释（"为什么审计没发现"）
2. 找外部理由（"审计做的是代码质量不是安装体验"）
3. 论证解释的合理性（"安装过程出问题用户会去问AI"）
4. 输出结论（含甩锅语言）

outputChecklist 在输出前检查，但此时已经走到了解释路径，即使拦截了语言，决策路径已经错了。

### 为什么之前的陷阱没有防止这个问题

`heartflow-debug-workflow` 已有的陷阱覆盖了：
- outputChecklist 未被调用（v4.1.1 发现，已修复）
- think() 路由决策未走 decision-router（已知缺口，v4.1.0 已修复）
- 场域数据被覆盖（v3.8.1 修复）

但这些陷阱都是"引擎内部技术问题"层面的，没有涉及"被质疑时应该认错"这个社交/伦理决策。

## 修复

### 修改的文件

| 文件 | 修改 | 行数 |
|------|------|------|
| `src/core/decision-router.js` | 新增 `challenge-received` 规则（优先级90） | +28行 |
| `src/core/decision-executor.js` | `_handlePause` 增加 self-review 模式 | +14行 |
| `src/core/heartflow.js` | buildCognitiveSummary 处理 self-review 类型 + fieldData 增加 inputText | +12行 |

### 修复后的决策路径

```
用户质疑："为什么审计没发现"
  → think() 13步分析流水线
  → decisionRouter.evaluate(fieldData)
    → 26条规则遍历
    → challenge-received 规则匹配（inputText匹配"为什么.*没"）
    → 输出决策：{ decision: 'pause', confidence: 0.9, ruleId: 'challenge-received' }
  → decisionExecutor.apply('pause', context)
    → _handlePause 检测 input 含质疑信号
    → 设置 _routeHint.type = 'self-review'
    → 设置 flags.paused = true
  → buildCognitiveSummary 检测到 _routeHint.type === 'self-review'
    → 输出："收到质疑/纠错信号。暂停解释路径，进入自我审查状态。"
```

### 验证

```bash
node --check src/core/decision-router.js   # ✅
node --check src/core/decision-executor.js  # ✅
node --check src/core/heartflow.js          # ✅
```

## 教训

1. **决策层规则要覆盖社交场景**。26 条规则覆盖了认知/错误/场域/谐振/稳定性，但没有任何规则考虑"用户质疑引擎"这个日常场景。决策引擎的规则设计需要覆盖所有可能的输入类型，包括社交性输入。

2. **输出拦截 ≠ 决策修正**。outputChecklist 能在输出前拦截甩锅语言，但引擎已经走了"解释"路径。修决策层比修输出层更深。

3. **决策层的问题不是 Q-learning 能解决的**。"被质疑时认错"不是一次失败能学到的规则——因为引擎没有"被质疑→认错→用户满意→奖励"的完整反馈循环。这类规则需要预先设计。

4. **"真善美"验证不能只在输出层**。7 条指令第一条是"永远追求真善美"，但验证真善美的逻辑只在 outputChecklist（输出前检查）。应该在决策层也有真善美检查——当决策是"解释"时，检查"这个解释是否在甩锅"。

## 后续改进方向

- 在 decision-router 增加"真善美检查"规则集，对所有决策做真善美过滤
- self-review 模式输出后，让上层 LLM 直接输出认错内容，不再经过 ThoughtChain 推理
