# GWT/意识模块升级模式参考
## 从 global-workspace.js v2.2.7 → v2.2.8 升级中提取

## 升级前分析清单

分析一个 Global Workspace Theory (GWT) / 意识类模块时，检查以下功能缺失：

```
□ 智能体方法校验（registerAgent 前检查 process/getAttentionPriority 是否存在）
□ 智能体处理超时保护（防止单个智能体阻塞整个认知周期）
□ 获胜者确定性排序（分数相同时的次要排序规则）
□ 黑板/工作区大小上限（防止无界增长导致内存泄漏）
□ 智能体名称抽象（硬编码名称 → 可配置映射表）
□ 失败智能体优雅降级（出错时记录低优先级广播而非静默丢弃）
□ 认知周期阶段跟踪（idle/gathering/integrating/complete/error）
□ 认知周期历史记录（可回溯最近的认知周期用于调试）
□ 防御性输入校验（attentionResult 结构校验、缺失字段回退默认值）
□ 连续失败计数（agent.consecutiveFailures 用于故障检测）
□ 事件发射（cycleComplete 事件供外部监听）
```

## 模块特征识别

GWT/意识类模块的典型特征：
- 使用 `EventEmitter` 或类似的事件机制
- 内部有黑板/工作区数据结构
- 管理多个专家智能体（agent）的竞争与协作
- 实现注意力竞争机制（attention × confidence）
- 生成内心独白/整合意见
- 认知周期（cognitiveCycle）是核心入口

## 智能体方法校验模板

```javascript
_validateAgentMethods(agent) {
  const missing = [];
  if (typeof agent.process !== 'function') missing.push('process');
  if (typeof agent.getAttentionPriority !== 'function') missing.push('getAttentionPriority');
  return { valid: missing.length === 0, missing };
}

registerAgent(agent) {
  if (!agent || !agent.name) {
    console.error('[GWT] Rejecting agent: missing name');
    return false;
  }
  const validation = this._validateAgentMethods(agent);
  if (!validation.valid) {
    console.error(`[GWT] Rejecting "${agent.name}": missing [${validation.missing.join(', ')}]`);
    return false;
  }
  // ...正常注册逻辑
  return true;
}
```

## 超时保护模板

```javascript
_timeoutPromise(promise, ms, timeoutMessage) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// 使用示例：
const output = await this._timeoutPromise(
  agent.instance.process(input, context),
  GWT_LIMITS.AGENT_TIMEOUT_MS,  // 建议: 10000ms
  `Agent "${name}" process timed out`
);
```

## 确定性获胜者判定模板

```javascript
determineWinner(broadcasts) {
  // 1. 防御性空检查
  if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
    return { agent: 'none', output: null, attention: 0, confidence: 0, isEmpty: true };
  }

  // 2. 计算得分
  const scored = broadcasts.map(b => ({
    ...b,
    score: (b.attention || 0) * (b.confidence || 0),
  }));

  // 3. 主要排序: 分数降序; 次要排序: 名称字典序（确保确定性）
  scored.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return (a.agent || '').localeCompare(b.agent || '');
  });

  return scored[0];
}
```

## 黑板大小限制模板

```javascript
class Blackboard {
  constructor(maxEntries = 200) {
    this.entries = [];
    this.maxEntries = maxEntries;
  }

  add(entry) {
    this.entries.push(entry);
    // 超出上限时淘汰最旧的 10%
    if (this.entries.length > this.maxEntries) {
      const trimCount = Math.floor(this.maxEntries * 0.1);
      this.entries = this.entries.slice(trimCount);
    }
  }

  size() { return this.entries.length; }
  // ...其他方法
}
```

## 智能体名称抽象模板

```javascript
const AGENT_NAME_MAP = {
  Focus: '聚焦者',
  Mood: '情绪感知',
  Reflection: '反思者',
  Memory: '记忆',
  Reason: '推理',
  Intuition: '直觉',
  Ethics: '道德',
};

generateIntegratedThought(opinions) {
  const dominant = opinions.reduce((a, b) => a.weight > b.weight ? a : b);
  const roleName = AGENT_NAME_MAP[dominant.agent] || dominant.agent;
  return `${roleName}说：${String(dominant.opinion).substring(0, 120)}`;
}
```

## 失败智能体优雅降级模板

```javascript
try {
  const output = await agent.instance.process(input, context);
  // ...正常处理
  agentData.consecutiveFailures = 0;
} catch (e) {
  console.error(`[GWT] Agent ${name} error:`, e.message);
  agentData.consecutiveFailures++;
  // 即使失败也记录低优先级广播，保证 integrate 能看到所有参与者
  broadcasts.push({
    agent: name, output: null, attention: 0, confidence: 0, error: e.message,
  });
}
```

## 认知周期历史记录模板

```javascript
_recordCycle(userInput, consensus) {
  this.cycleHistory.push({
    cycle: this.cycleCount,
    input: String(userInput).substring(0, 100),
    winner: consensus.winner,
    participantCount: consensus.participantCount,
    timestamp: new Date().toISOString(),
  });
  if (this.cycleHistory.length > CYCLE_HISTORY_LIMIT) {
    this.cycleHistory = this.cycleHistory.slice(-CYCLE_HISTORY_LIMIT);
  }
}

getCycleHistory() { return [...this.cycleHistory]; }
getRecentCycles(n = 5) { return this.cycleHistory.slice(-n); }
```

## 关键陷阱

### 1. 超时与错误处理的冲突
- 超时后 Promise 会 reject，但智能体后续可能仍然 resolve（竞态条件）
- 解决方案：超时后检查结果是否已被处理，或使用 AbortController
- 当前方案（Promise.race）简单但存在竞态窗口，可接受

### 2. 黑板淘汰策略
- 淘汰最旧的 10% 而不是最旧的 1 条，避免频繁淘汰
- 10% 是经验值，可根据 MAX_BOARD_ENTRIES 调整（200条时淘汰20条）

### 3. 连续失败计数
- 仅当 agent 成功处理时才重置为 0
- 可用于触发警报或自动注销
- 当前版本只计数未触发，留给后续升级

### 4. 模块级导出
```javascript
module.exports = { GlobalWorkspace, Blackboard, GWT_LIMITS, AGENT_NAME_MAP };
```
GWT_LIMITS 和 AGENT_NAME_MAP 应一并导出，供其他模块读取和扩展。
