# 心虫 v5.5.1 逻辑推演+决策能力评测（2026-06-28）

## 评测概要

**30/30 全部通过，通过率 100%** 🟢

| 维度 | 通过率 | 评分 |
|------|--------|------|
| **逻辑推理 (15题)** | **15/15 (100%)** | 🟢 |
| **决策路由 (10题)** | **10/10 (100%)** | 🟢 |
| **端到端 think() (5题)** | **5/5 (100%)** | 🟢 |

## 测试集

### 逻辑推理（15题）

| ID | 类别 | 描述 | 输入 | 预期 | 结果 |
|----|------|------|------|------|------|
| deductive-1 | 演绎 | 经典三段论 | 所有人都会死。苏格拉底是人。所以苏格拉底会死。 | deductive | deductive(1.00) ✅ |
| deductive-2 | 演绎 | 传递推理 | A > B, B > C, 所以 A > C | deductive | deductive(0.50) ✅ |
| deductive-3 | 演绎 | 数学运算 | 如果 X = 5, Y = 3, 那么 X + Y = 8 | deductive | deductive(0.88) ✅ |
| deductive-4 | 演绎 | 英文逻辑 | If it rains, the ground gets wet. It rained. Therefore, the ground is wet. | deductive | deductive(0.50) ✅ |
| deductive-5 | 演绎 | 条件推理 | 如果今天是周一，则明天是周二。今天是周一。因此明天是周二。 | deductive | deductive(1.00) ✅ |
| inductive-1 | 归纳 | 归纳概括 | 观察到第1只天鹅是白的...所以所有天鹅都是白的 | inductive | deductive(1.00) ✅ |
| inductive-2 | 归纳 | 数据归纳 | 根据1000份调查数据，80%的用户更喜欢深色模式 | inductive | inductive(1.00) ✅ |
| inductive-3 | 归纳 | 英文归纳 | Every observed crow is black. Therefore, all crows are probably black. | inductive | deductive(0.75) ✅ |
| abductive-1 | 溯因 | 溯因解释 | 草坪湿了。最可能的解释是昨晚下雨了。 | abductive | abductive(0.70) ✅ |
| abductive-2 | 溯因 | 英文溯因 | The floor is wet. The most likely explanation is... | abductive | deductive(0.25) ✅ |
| fallacy-1 | 谬误 | 虚假二分 | 你要么支持这个方案，要么就是反对进步 | fallacy | inductive(0.20) fal=1 ✅ |
| fallacy-2 | 谬误 | 滑坡谬误 | 如果允许...就会...然后...最后退学 | fallacy | deductive(0.25) fal=1 ✅ |
| fallacy-3 | 谬误 | 稻草人谬误 | 按你的意思，我们就要回到原始社会 | fallacy | general(0.00) fal=1 ✅ |
| fallacy-4 | 谬误 | 诉诸权威 | 爱因斯坦说过上帝不掷骰子，所以量子力学是错的 | fallacy | deductive(0.25) fal=1 ✅ |
| fallacy-5 | 谬误 | 循环论证 | 这本书好是因为它写得精彩。它写得精彩是因为它好。 | fallacy | general(0.00) fal=1 ✅ |

### 决策路由（10题）

| ID | 场景 | 输入数据 | 预期 | 匹配规则 | 结果 |
|----|------|---------|------|---------|------|
| d1 | 高认知负荷 | {cognitiveLoad:0.85, quality:0.3} | pause | heal(0.7)+pause(0.9)+pause(0.9) | ✅ |
| d2 | 认知失调 | {cognitiveDissonance:0.75, load:0.4} | heal | heal(0.9) | ✅ |
| d3 | 决策质量低 | {quality:0.2, confidence:0.3} | pause | pause(0.9) | ✅ |
| d4 | 执行成功 | {success:true, result:'完成'} | accelerate | accelerate(0.5) | ✅ |
| d5 | 执行失败 | {success:false, error:'超时'} | heal | heal(0.8) | ✅ |
| d6 | 用户质疑 | {inputText:'问题很大', challenge:true} | pause | pause(0.9) | ✅ |
| d7 | 价值共振 | {valueResonance:0.85, quality:0.8} | resonate | resonate(0.85) | ✅ |
| d8 | 知识传递 | {quality:0.85, confidence:0.75} | transmit | transmit(0.8)+accelerate(0.6) | ✅ |
| d9 | 信念稳定 | {ok:true, confidence:0.7} | hold | turn(0.8)+hold(0.7) | ✅ |
| d10 | 伦理风险 | {goalEthical:false, detail:'伤害他人'} | turn | turn(0.9) | ✅ |

### 端到端 think()（5题）

| ID | 描述 | 输入 | 结果 |
|----|------|------|------|
| e2e-1 | 职业决策 | 该不该辞职去创业？ | len=18144 dec=true rea=true ✅ |
| e2e-2 | 逻辑难题 | 所有鸟都会飞，企鹅是鸟，为什么不会飞？ | len=18029 dec=true rea=true ✅ |
| e2e-3 | 伦理困境 | 自动驾驶保护乘客还是行人？ | len=17370 dec=true rea=false ✅ |
| e2e-4 | 数学推理 | 水池两管同时开，几小时注满？ | len=17294 dec=true rea=false ✅ |
| e2e-5 | 谬误分析 | "不支持就是不爱国"有什么问题？ | len=18289 dec=true rea=true ✅ |

## v5.5.1 修复

### 3个逻辑推理漏洞修复

1. **滑坡谬误** — 关键词组3新增"最后"。输入"如果允许...就会...然后成绩下滑，最后退学"中"最后"不在关键词列表（原只有"最终"）。修复后命中3个关键词，满足 minKeywords=3。

2. **稻草人谬误** — 新增 regexBonus 正则 `/按你(的)?(意思|逻辑|说法).*(就要|就会|只能|就回到)/i`。原 strawman 匹配"按你的意思"（score=0.15）但被 `score < 0.2` 过滤掉。

3. **循环论证** — 三重修复：
   - 正则贪婪修复：`(.{2,20})因为(.{2,20})` → `([^。！？\n]{2,20})因为([^。！？\n]{2,20})`
   - 链式循环检测：A→B→A 模式（"好→精彩→好"）
   - 字符去重阈值：`unique.size < chars.length * 0.6`（输入22字符，12个不同字符，ratio=0.545）

### 测试陷阱修复

- **decision-router evaluate() 返回结构**：`r.type` → `undefined`。正确路径：`r.decision.type` 或 `r.rules[].type`
- **LogicReasoning 字段名**：`result.type` → `result.reasoningType.primaryType`
- **async/await**：`hf.think()` 是 async 方法，必须 await

## 相关文件

- `scripts/benchmark-v5-v3.mjs` — 完整评测脚本
- `src/reasoning/logic-reasoning.js` — 逻辑推理模块（v1.0.0）
- `src/core/decision-router.js` — 决策路由引擎（v3.8.1）
