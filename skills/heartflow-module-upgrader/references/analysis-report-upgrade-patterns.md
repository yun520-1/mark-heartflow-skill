# Analysis/Reporting Class Upgrade Patterns

## 适用场景

分析/报告类模块负责**从结构化数据（情绪日志、任务记录、用户反馈）中生成分析报告和洞察**。核心流程：`analyzeEmotions(data)` → `analyzeTasks(data)` → `analyzeFeedback(data)` → `calculateOverallScore()` → `generateImprovements()`。

## 典型特征

- 多个 `analyze*()` 方法，每个处理一种数据维度
- `calculateOverallScore()` 加权聚合各维度评分
- `generateImprovements()` 基于评分生成建议
- 数据持久化到 JSON 文件（报告/日志/状态）
- 无趋势分析（每次独立计算，不比较历史）
- 无输入验证（假设数据格式正确）
- 无错误边界（单个分析失败 → 整体崩溃）

## 标准升级清单

### 1. 修复已知 Bug

常见 Bug 类型：
- **空操作方法**：如 `printReport()` 直接 `return;` — 必须改为实际格式化输出
- **变量名错误**：引用未定义的变量名（如 `effective` 而非 `effectiveness`）
- **字段名不一致**：部分字段用中文名、部分用英文名

### 2. 输入验证系统

```javascript
// 每个 analyze* 方法增加输入验证
analyzeEmotions(emotionalLog) {
  // 类型检查
  if (!Array.isArray(emotionalLog)) {
    return { status: 'invalid_input', ...defaults };
  }
  
  // 空值处理
  if (emotionalLog.length === 0) {
    return { status: 'no_data', ...defaults };
  }
  
  // 数据有效性过滤（范围检查）
  const scores = emotionalLog
    .map(e => {
      const score = e.score || e.valence || null;
      return typeof score === 'number' && score >= 0 && score <= 10 ? score : null;
    })
    .filter(s => s !== null);
}
```

### 3. 错误边界（Error Boundary）

```javascript
analyzeSession() {
  const safeAnalyze = (fn, fallback) => {
    try {
      return fn();
    } catch (e) {
      this.log(`分析异常: ${e.message}`);
      return fallback;
    }
  };

  const emotionAnalysis = safeAnalyze(
    () => this.analyzeEmotions(data),
    { status: 'error', summary: '分析失败' }
  );
  // ... 每个子分析独立包裹
}
```

### 4. 多会话趋势分析

```javascript
analyzeTrends(previousReports, currentAnalysis) {
  if (!previousReports || previousReports.length === 0) {
    return { status: 'first_session', summary: '首次会话' };
  }

  const lastReport = previousReports[previousReports.length - 1];
  const changes = {};

  // 逐维度比较
  for (const dimension of ['emotion', 'task', 'feedback']) {
    const prev = lastReport[dimension + 'Analysis'];
    const curr = currentAnalysis[dimension + 'Analysis'];
    
    if (prev && curr) {
      const prevScore = parseFloat(prev.avgScore) || 0;
      const currScore = parseFloat(curr.avgScore) || 0;
      
      changes[dimension] = {
        delta: Math.round((currScore - prevScore) * 10) / 10,
        direction: currScore > prevScore ? 'improving' : 
                   currScore < prevScore ? 'declining' : 'stable'
      };
    }
  }

  // 统计总体趋势
  const improving = Object.values(changes).filter(c => c.direction === 'improving').length;
  const declining = Object.values(changes).filter(c => c.direction === 'declining').length;

  return {
    status: 'compared',
    summary: `${improving}个维度改善，${declining}个维度退步`,
    changes,
    overallTrend: improving > declining ? 'positive' : 
                  declining > improving ? 'negative' : 'stable'
  };
}
```

### 5. 数据驱动加权评分

替代固定权重，根据实际数据存在情况动态调整：

```javascript
calculateOverallScore(state, emotionAnalysis, taskAnalysis, feedbackAnalysis) {
  const hasEmotion = (emotionAnalysis?.dataPoints || 0) > 0;
  const hasTasks = (taskAnalysis?.total || 0) > 0;
  const hasFeedback = (feedbackAnalysis?.total || 0) > 0;
  const dataDimensions = [hasEmotion, hasTasks, hasFeedback].filter(Boolean).length;

  let emotionWeight, taskWeight, feedbackWeight;
  if (dataDimensions === 0) {
    // 全无数据：等权
    emotionWeight = 0.33;
    taskWeight = 0.33;
    feedbackWeight = 0.34;
  } else {
    // 有数据的维度权重更高
    const baseWeight = 0.2;
    const dataBonus = 0.4 / dataDimensions;
    emotionWeight = baseWeight + (hasEmotion ? dataBonus : 0);
    taskWeight = baseWeight + (hasTasks ? dataBonus : 0);
    feedbackWeight = baseWeight + (hasFeedback ? dataBonus : 0);
  }
}
```

### 6. 目标跟踪系统

```javascript
// 状态枚举
const GoalStatus = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  IMPROVED: 'improved',
  STALLED: 'stalled',
  REGRESSED: 'regressed',
  COMPLETED: 'completed'
};

// 更新目标
updateGoal(goalKey, currentValue, previousValue) {
  let goal = this.goals.goals.find(g => g.key === goalKey);
  
  if (!goal) {
    goal = { key: goalKey, status: GoalStatus.NEW, history: [], 
             best_value: currentValue, stale_count: 0 };
    this.goals.goals.push(goal);
  }

  // 记录历史
  goal.history.push({ timestamp: new Date(), value: currentValue });
  if (goal.history.length > 20) goal.history = goal.history.slice(-20);

  // 状态判定
  if (currentValue > goal.best_value) {
    goal.status = currentValue >= 8 ? GoalStatus.COMPLETED : GoalStatus.IMPROVED;
    goal.stale_count = 0;
  } else if (currentValue < previousValue) {
    goal.status = GoalStatus.REGRESSED;
  } else if (currentValue === previousValue) {
    goal.stale_count++;
    if (goal.stale_count >= 3) goal.status = GoalStatus.STALLED;
  }
}
```

### 7. 趋势感知改进建议

```javascript
generateImprovements(state, trendAnalysis) {
  const improvements = [];

  // 检查趋势退步
  if (trendAnalysis?.changes?.emotion?.direction === 'declining') {
    improvements.push({
      priority: 'high',
      area: 'emotion_trend',
      suggestion: '情绪呈下降趋势，建议增加正向引导和共情回应',
      reason: `情绪评分下降 ${Math.abs(trendAnalysis.changes.emotion.avgScoreDelta)} 分`
    });
  }

  // 数据缺失检查
  if (!state.emotional_log?.length) {
    improvements.push({
      priority: 'medium',
      area: 'emotion_tracking',
      suggestion: '建议启用情绪日志记录',
      reason: '当前无情绪数据'
    });
  }

  // 目标跟踪提醒
  if (goalSummary.stalled_goals > 0) {
    improvements.push({
      priority: 'low',
      area: 'stalled_goals',
      suggestion: '部分目标长期无进展，建议调整策略',
      reason: '目标停滞'
    });
  }
}
```

### 8. 情绪分析增强

```javascript
analyzeEmotions(scores) {
  // 半区对比趋势检测（3+数据点）
  let trend = 'stable';
  if (scores.length >= 3) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const delta = secondAvg - firstAvg;
    if (delta > 0.5) trend = 'rising';
    else if (delta < -0.5) trend = 'declining';
  }

  // 波动等级分类
  let volatilityLevel = 'low';
  const volatility = max - min;
  if (volatility > 4) volatilityLevel = 'high';
  else if (volatility > 2) volatilityLevel = 'medium';
}
```

### 9. 格式化报告输出（修复空操作）

```javascript
printReport(report) {
  if (!report) { console.log('[Module] 无报告可打印'); return; }

  const line = '='.repeat(60);
  console.log('\n' + line);
  console.log('  报告标题');
  console.log('  ' + report.timestamp);
  console.log(line);

  // 综合评分
  console.log(`\n📊 综合评分: ${report.overallScore?.score || 'N/A'}`);
  console.log(`   状态: ${report.overallScore?.flowState || '未知'}`);

  // 各维度分析
  console.log(`\n😊 情绪分析:`);
  console.log(`   平均分: ${report.emotionAnalysis?.avgScore || 'N/A'}`);
  console.log(`   趋势: ${report.emotionAnalysis?.trend || 'N/A'}`);

  // 趋势分析
  if (report.trendAnalysis) {
    console.log(`\n📈 趋势分析:`);
    console.log(`   状态: ${report.trendAnalysis.status}`);
    if (report.trendAnalysis.changes) {
      for (const [key, change] of Object.entries(report.trendAnalysis.changes)) {
        console.log(`   ${key}: ${change.direction}`);
      }
    }
  }

  // 改进建议
  console.log(`\n💡 改进建议:`);
  for (const imp of report.improvements || []) {
    const icon = imp.priority === 'high' ? '🔴' : '🟡';
    console.log(`   ${icon} [${imp.priority}] ${imp.suggestion}`);
  }
  console.log('\n' + line + '\n');
}
```

## 关键陷阱

### 1. 字段名统一性
- 不要在同一个模块内混合中英文输出字段名（如 `波动` vs `volatility`）
- 统一使用英文，在 `summary` 字段中用中文描述

### 2. 变量名 Bug
- 检查所有引用变量名是否拼写正确（如 `effectiveness` 非 `effective`）
- 运行时错误才能暴露这类 Bug，语法检查发现不了

### 3. 历史数据比较的兼容性
- 新版本新增的字段（如 `volatilityLevel`）在旧报告文件中不存在
- 读取旧报告时必须用 `||` 回退或 `?.` 可选链

### 4. 保存异步不等待
- `saveReport()` 是 async 但调用处不 await
- 不影响功能但日志顺序可能异常

### 5. 边界值的格式化
- `toFixed(1)` 在数值为 `undefined` 时抛异常
- 先用 `parseFloat()` 确保是数字再调用

## 验证清单

- [ ] `node --check` 语法验证
- [ ] `require()` 模块加载
- [ ] 所有 `analyze*` 方法用空数组/无效输入测试
- [ ] 所有 `analyze*` 方法用有效数据测试
- [ ] `printReport()` 输出格式化报告（验证非空操作）
- [ ] `calculateOverallScore()` 有数据/无数据两种场景
- [ ] `analyzeTrends()` 首次会话 vs 有历史数据
- [ ] 目标跟踪系统创建/更新/完成流程
- [ ] 向后兼容：旧报告文件格式不崩溃
