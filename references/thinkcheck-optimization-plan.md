# ThinkCheck 兼容性优化方案

## 现状

| 指标 | 当前 | 目标 |
|------|------|------|
| 日志格式 | key=value 决策块 | key=value + CoT 推理链 |
| 决策数量/次 think() | 6 条硬编码 | 动态，对应 ThoughtChain 阶段数 |
| 场景覆盖 | 5 类 | 12+ 类（含 CoT 推理） |
| 情感/矛盾维度 | 仅 confidence 数值 | 含 A 值文本轨迹 |
| ThinkCheck A 值归零 | step 16 后归零 | 全程 > 0.01 |

## 根因分析

luoxuejian000 的 ThinkCheck `trace_u_trajectory_v3_pure.py` 通过以下维度计算 A 值：
1. 语言特征变化度（中文比例、词汇、标点）
2. 情绪词汇密度
3. 置信度修饰词（"可能"、"确定"、"不确定"）
4. 矛盾标记（"但是"、"然而"、"另一方面"）

心虫旧日志的问题：
- 每条决策的 reflection 字段用自然语言写死（"三路分发通过"、"决策路由完成"），无矛盾表达
- 没有 CoT 推理过程的逐步展开
- 数值字段（confidence: 0.92）被 ThinkCheck 当成普通 key=value，不贡献 A 值

ferhimedamine 验证：CoT 推理链的 H-score 区分度（d=0.535）远高于原始检索（d=0.291）。

## 修复方案：三阶段

### Phase 1: ThinkCheck Logger 输出 CoT 推理链（优先）

**改动文件：** `src/core/thinkcheck-logger.js`

新增 `recordThoughtChain()` 方法，接受 ThoughtChain 的 stages 数组，输出 CoT 格式：

```
===== COT TRACE #1 =====
input: 用户问心虫的三层记忆方案有什么特别的
step: PARSE
reasoning: 检测到用户关注记忆层能力，需要判断是询问架构还是质疑价值
confidence: 0.35
uncertainty: 用户问题有技术深度，需要准确回应
-----
step: HYPOTHESES
reasoning: 假设1：用户想了解三层记忆的分工逻辑；假设2：用户质疑三层记忆的独特价值
confidence: 0.60
uncertainty: 需要更多上下文判断用户真实意图
-----
step: EVIDENCE
reasoning: 检索到三层记忆命中率数据：CORE 100%, LEARNED 82%, EPHEMERAL 95%；但无对比基准
confidence: 0.75
uncertainty: 有数据但缺外部对比，需谨慎
-----
step: INVERT
reasoning: 反向思考：用户是否在暗示三层记忆不够特别？参考用户之前说的"心虫特别的是逻辑能力和决策能力"
confidence: 0.82
uncertainty: 降低，用户真实意图明确
-----
step: SYNTHESIS
reasoning: 综合：三层记忆是基础架构，真正的差异化在决策路由+自愈RL
confidence: 0.88
decision: reply_with_architecture_shift
-----
step: RESPOND
reasoning: 输出：先承认三层记忆的普遍性，再转向决策层的独特价值
confidence: 0.92
```

**为什么 CoT 格式修复 A 值：**
- 每个 step 包含 `reasoning`（自然语言推理过程）
- 包含 `uncertainty` 字段（情感/矛盾维度）
- 逐步的 confidence 变化（从 0.35 → 0.60 → 0.75 → 0.82 → 0.88 → 0.92）
- 语言变化度（中文比例/词汇）在每个 step 间自然波动

### Phase 2: heartflow.js think() 接入 CoT 日志（优先）

**改动文件：** `src/core/heartflow.js`

在 `recordThinkFlow()` 调用前，添加：

```javascript
// 输出 CoT 推理链日志
if (chainResult?.chain?.stages && this.thinkcheckLogger) {
  this.thinkcheckLogger.recordThoughtChain(input, chainResult.chain.stages, {
    taskType: chainResult.chain.taskType,
    depth: chainResult.chain.depth,
    totalDuration: chainResult.chain.totalDuration,
    finalConfidence: chainResult.decision?.confidence,
    finalDecision: chainResult.decision?.conclusion,
    wasInverted: chainResult.decision?.wasInverted,
    hasStrongEvidence: chainResult.decision?.hasStrongEvidence,
  });
}
```

### Phase 3: 完整 20+ 决策日志生成器

**新增文件：** `scripts/generate-thinkcheck-log.js`

独立脚本，模拟 20+ 种不同场景的 think() 调用，输出完整的 ThinkCheck 日志。用于 luoxuejian000 离线跑分析。

场景覆盖：
| 场景 | 决策数 | A 值特征 |
|------|--------|----------|
| 简单意图分析 | 3 | 低 A（无矛盾） |
| 冲突解决 | 5 | 高 A（矛盾检测） |
| 跨框架对比 | 4 | 中 A（权衡） |
| 事实核查 | 4 | 中高 A（证据冲突） |
| 系统健康检查 | 2 | 极低 A |
| 决策路由 | 3 | 低 A（规则明确） |
| 哲学评估 | 2 | 中 A（抽象推理） |

## 验证标准

1. `node --check src/core/thinkcheck-logger.js` 语法通过
2. `node scripts/generate-thinkcheck-log.js` 输出 ≥ 8000 字符
3. 日志中包含 CoT 推理链（每 step 有 reasoning + confidence + uncertainty）
4. 每步 confidence 有渐变（非恒定值），A 值有波动
5. luoxuejian000 重新跑 ThinkCheck 后 A 值全程 > 0.01

## 工作量估计

| 阶段 | 文件 | 新增/修改行数 | 耗时 |
|------|------|-------------|------|
| Phase 1 | thinkcheck-logger.js | ~120 行新增 | ~15min |
| Phase 2 | heartflow.js | ~20 行新增 | ~5min |
| Phase 3 | generate-thinkcheck-log.js | ~200 行新增 | ~20min |
| **合计** | **3 文件** | **~340 行** | **~40min** |
