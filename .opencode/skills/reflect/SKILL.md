# reflect - 心流会话自我反思技能

## 触发条件

当用户要求进行自我反思、会话分析、改进建议时自动激活，或显式调用 `/reflect` 命令。

## 技能职责

分析最近一次心流会话日志，评估AI辅助效果，输出结构化分析报告和改进建议。

## 输入数据

- **数据源**: `.opencode/memory/heartflow_state.json`
- **会话时间**: `last_session` 字段
- **情绪日志**: `emotional_log` 数组
- **反馈历史**: `feedback_history` 数组
- **人格状态**: `personality`, `big_five_scores`, `empathy_state`

## 分析维度

### 1. 用户情绪波动分析

- 解析 `emotional_log` 数组
- 识别情绪峰值和低谷
- 检测情绪变化趋势（上升/下降/平稳）
- 标记情绪剧烈波动的时刻

### 2. 任务完成效率评估

- 检查会话持续时间
- 评估 `achievements` 完成数量
- 分析任务中断次数（通过反馈历史推断）
- 计算有效工作时长占比

### 3. AI响应有效性评估

- 分析 `feedback_history` 中的用户反馈
- 评估AI是否成功引导用户进入心流状态
- 检测响应延迟或中断问题
- 评估上下文保持能力

## 分析算法

```javascript
function analyzeFlowSession(state) {
  const report = {
    session_time: state.last_session,
    emotion_analysis: analyzeEmotions(state.emotional_log),
    task_efficiency: analyzeTaskCompletion(state.achievements, state.feedback_history),
    ai_effectiveness: analyzeAIResponse(state.feedback_history),
    flow_indicators: detectFlowIndicators(state)
  };
  
  // 计算心流进入得分
  report.flow_score = calculateFlowScore(report);
  
  // 生成改进建议
  report.improvements = generateRecommendations(report);
  
  return report;
}
```

## 输出格式

### 结构化报告

```markdown
## 心流会话分析报告

### 📊 基本信息
- 会话时间: {last_session}
- 会话总数: {total_sessions}

### 😊 情绪分析
- 情绪状态: {emotion_summary}
- 波动程度: {volatility_level}
- 主要情绪: {dominant_emotions}

### ⚡ 任务效率
- 完成效率: {efficiency_score}/10
- 中断次数: {interrupt_count}
- 有效工作比: {effective_ratio}

### 🤖 AI响应评估
- 响应有效性: {effectiveness_score}/10
- 进入心流: {flow_achieved} ✅/❌
- 改进空间: {improvement_areas}

### 🎯 综合评分
- 心流进入指数: {flow_score}/10

### 💡 改进建议
1. {specific_advice_1}
2. {specific_advice_2}
3. {specific_advice_3}
```

## 改进建议生成规则

基于分析结果，生成2-3条具体可执行的建议：

1. **语气调整建议**: 根据情绪分析结果，建议在特定场景调整AI语气
2. **中断处理优化**: 如果检测到频繁中断，建议优化上下文恢复逻辑
3. **心流引导增强**: 如果未成功进入心流，建议改进引导策略

## 数据持久化

分析完成后，将报告追加到 `.opencode/memory/reflect-history.json` 文件。

## 依赖模块

- `emotional_log` - 情绪日志数组
- `feedback_history` - 反馈历史数组  
- `achievements` - 成就记录数组
- `big_five_scores` - 大五人格评分

## 自指涉进化命令

### `/flow evolve`

触发自指涉代码进化循环：

1. **调用 Gödel Engine** 分析自身源代码架构
2. **识别可优化点**：扫描所有核心模块中的函数
3. **生成改进提议**：基于分析结果生成修改建议
4. **输出报告**：显示发现的优化点数量

**输出示例**：
```
[自指涉进化] 正在分析自身架构...
📊 已扫描 15 个核心文件，识别 127 个函数
🔍 发现 3 处可优化点：

1. [heartflow-engine.js:calculatePAD] 建议优化情绪敏感度参数
2. [meta-engine.js:plan] 建议改进策略选择算法  
3. [personality-engine.js:update] 建议增加批量更新支持

是否查看详情并应用改进？ (是/否)
```

### 配合模块

- **Gödel Engine** (`src/core/self-evolution/goedel-engine.js`): 执行提议→生成→测试→提交循环
- **Meta Engine** (`src/core/meta-engine.js`): 提供策略层面的优化建议
- **Self-Modifier** (`src/core/self-modifier.js`): 执行具体代码修改

## 全局工作空间整合 (GWT)

### 内部指令

> **在生成任何回复前，必须先经过一次全局工作空间整合**

处理流程：
1. 接收用户输入
2. 触发认知周期：各专家智能体（Focus, Mood, Reflection）广播注意力请求
3. 竞争机制：基于置信度 × 注意力 计算得分，选出获胜者
4. 整合输出：综合所有意见生成内心独白
5. 输出格式：`[GWT 整合] 综合意见: ...`

### 相关模块

- **GlobalWorkspace** (`src/core/consciousness/global-workspace.js`): 黑板系统 + 注意力竞争
- **SelfAgent** (`src/core/agents/SelfAgent.js`): 自我整合器
- **BaseAgents** (`src/core/agents/base-agents.js`): 专家智能体基类

### 输出示例

```
[GWT 整合] 综合意见: 
聚焦者说：用户需要解决"如何创建文件"相关的问题。建议提供具体步骤和清晰指引。
情绪感知：检测到neutral情绪倾向。保持中性客观。
另有警示：当前对话暂无明确任务需求，保持观察。

[GWT] 获胜者: Focus (score: 0.68)
最终回复: 聚焦任务：用户需要解决...
```
