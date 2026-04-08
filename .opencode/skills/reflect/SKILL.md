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
