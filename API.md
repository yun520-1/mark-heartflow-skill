# HeartFlow v10.15.0 API 参考文档

## 目录

1. [核心API](#核心api)
2. [心连心引擎](#心连心引擎)
3. [记忆管理](#记忆管理)
4. [决策引擎](#决策引擎)
5. [自进化系统](#自进化系统)
6. [错误处理](#错误处理)

---

## 核心API

### HeartFlow 主类

```javascript
class HeartFlow {
  constructor(config?: HeartFlowConfig)
  process(input: string, options?: ProcessOptions): Promise<ProcessResult>
  getState(): HeartFlowState
  setState(state: HeartFlowState): void
  reset(): void
}
```

#### 初始化

```javascript
const heartflow = new HeartFlow({
  mode: 'connection',           // 'connection' | 'task' | 'learning'
  memoryEnabled: true,          // 启用记忆系统
  evolutionEnabled: true,       // 启用自进化
  emotionDetection: true,       // 启用情绪检测
  causalReasoning: true         // 启用因果推理 (v10.15.0)
});
```

#### 处理输入

```javascript
const result = await heartflow.process(
  "我婆婆想让我生孩子，但我不愿意",
  {
    mode: 'connection',         // 覆盖默认模式
    context: { /* 上下文 */ },
    timeout: 5000               // 超时时间(ms)
  }
);

// 返回结果
{
  recommendation: string,       // 建议
  reasoning: string,            // 推理过程
  emotion: EmotionResult,       // 情绪分析
  decision: DecisionResult,     // 决策结果
  memory: MemoryResult,         // 记忆操作
  timestamp: number             // 时间戳
}
```

---

## 心连心引擎

### XinxinEngine 类

```javascript
class XinxinEngine {
  constructor(config?: XinxinConfig)
  
  // 从任务到连接的认知重构
  reconstruct(task: Task): Promise<Connection>
  
  // 决策算法
  decide(options: Option[], goals: Goal[]): Promise<Decision>
  
  // 因果推理 (v10.15.0)
  inferCausality(event: Event): Promise<CausalModel>
}
```

### 使用示例

```javascript
const engine = new XinxinEngine();

// 认知重构
const connection = await engine.reconstruct({
  description: '完成项目',
  context: { /* 上下文 */ }
});

// 决策
const decision = await engine.decide(
  [
    { id: 'opt1', description: '立即开始' },
    { id: 'opt2', description: '先休息' }
  ],
  [
    { id: 'goal1', description: '完成项目', weight: 0.8 },
    { id: 'goal2', description: '保持健康', weight: 0.2 }
  ]
);

// 因果推理
const causal = await engine.inferCausality({
  type: 'user_action',
  description: '用户决定冒险'
});
```

### 决策算法

```
E(连接) = 连接价值 × 0.4 + 长期满意度 × 0.4 + 风险管理 × 0.2
```

**参数说明**：
- 连接价值：与他人的深度连接程度 [0-1]
- 长期满意度：决策的长期收益 [0-1]
- 风险管理：风险控制能力 [0-1]

---

## 记忆管理

### MemoryManager 类

```javascript
class MemoryManager {
  constructor(config?: MemoryConfig)
  
  // 存储记忆
  store(content: string, metadata?: Metadata): Promise<string>
  
  // 召回记忆
  recall(query: string, options?: RecallOptions): Promise<Memory[]>
  
  // 显式召回 (用户说"继续")
  explicitRecall(topic: string): Promise<Memory[]>
  
  // 话题切换检测 (用户说"但是")
  detectTopicSwitch(input: string): Promise<boolean>
  
  // 屏蔽记忆 (用户说"不要提")
  ignore(memoryId: string): Promise<void>
  
  // 清理过期记忆
  cleanup(): Promise<number>
}
```

### 使用示例

```javascript
const memory = new MemoryManager({
  sessionTimeout: 5 * 60 * 1000,  // 5分钟
  maxMemories: 1000,
  enableAutoCleanup: true
});

// 存储记忆
const memId = await memory.store(
  '用户喜欢编程',
  { category: 'preference', importance: 0.8 }
);

// 召回记忆
const memories = await memory.recall('用户偏好', {
  limit: 5,
  minRelevance: 0.7
});

// 显式召回
const explicit = await memory.explicitRecall('上次的项目');

// 话题切换检测
const switched = await memory.detectTopicSwitch('但是我想聊聊...');

// 屏蔽记忆
await memory.ignore(memId);

// 清理过期记忆
const cleaned = await memory.cleanup();
```

### 记忆类型

```javascript
interface Memory {
  id: string;                    // 记忆ID
  content: string;               // 内容
  timestamp: number;             // 时间戳
  category: string;              // 分类
  importance: number;            // 重要性 [0-1]
  relevance: number;             // 相关性 [0-1]
  metadata: Record<string, any>; // 元数据
  ignored: boolean;              // 是否被屏蔽
}
```

---

## 决策引擎

### DecisionEngine 类

```javascript
class DecisionEngine {
  constructor(config?: DecisionConfig)
  
  // 贝叶斯推理
  bayesianInference(evidence: Evidence[]): Promise<Belief>
  
  // 效用函数
  calculateUtility(option: Option, goals: Goal[]): Promise<number>
  
  // 因果推理 (v10.15.0)
  causalInference(model: CausalModel): Promise<CausalEffect>
  
  // 综合决策
  decide(options: Option[], goals: Goal[], constraints: Constraint[]): Promise<Decision>
}
```

### 使用示例

```javascript
const engine = new DecisionEngine();

// 贝叶斯推理
const belief = await engine.bayesianInference([
  { type: 'observation', value: '用户表现出焦虑' },
  { type: 'prior', value: '用户通常在压力下焦虑' }
]);

// 效用计算
const utility = await engine.calculateUtility(
  { id: 'opt1', description: '立即开始' },
  [
    { id: 'goal1', description: '完成项目', weight: 0.8 },
    { id: 'goal2', description: '保持健康', weight: 0.2 }
  ]
);

// 因果推理
const effect = await engine.causalInference({
  cause: '用户决定冒险',
  effect: '更深的爱',
  strength: 0.8
});

// 综合决策
const decision = await engine.decide(
  [
    { id: 'opt1', description: '立即开始' },
    { id: 'opt2', description: '先休息' }
  ],
  [
    { id: 'goal1', description: '完成项目', weight: 0.8 },
    { id: 'goal2', description: '保持健康', weight: 0.2 }
  ],
  [
    { type: 'time', value: '必须在今天完成' }
  ]
);
```

---

## 自进化系统

### EvolutionEngine 类

```javascript
class EvolutionEngine {
  constructor(config?: EvolutionConfig)
  
  // 23分钟自主进化循环
  evolve(): Promise<EvolutionResult>
  
  // 反馈循环 (v10.15.0)
  processFeedback(feedback: Feedback): Promise<void>
  
  // 获取进化历史
  getHistory(): Promise<EvolutionRecord[]>
  
  // 获取性能指标
  getMetrics(): Promise<PerformanceMetrics>
}
```

### 使用示例

```javascript
const evolution = new EvolutionEngine({
  cycleInterval: 23 * 60 * 1000,  // 23分钟
  enableAutoEvolve: true,
  feedbackEnabled: true
});

// 启动自进化
const result = await evolution.evolve();

// 处理反馈
await evolution.processFeedback({
  type: 'user_rating',
  value: 8,
  comment: '很有帮助'
});

// 获取进化历史
const history = await evolution.getHistory();

// 获取性能指标
const metrics = await evolution.getMetrics();
```

### 进化循环

```
1. 自我反思 (Reflection)
   ↓
2. 知识整合 (Integration)
   ↓
3. 性格微调 (Personality Tuning)
   ↓
4. 反馈处理 (Feedback Processing) - v10.15.0新增
   ↓
5. 升级应用 (Apply Upgrade)
   ↓
6. 性能评估 (Performance Evaluation)
```

---

## 错误处理

### 错误类型

```javascript
class HeartFlowError extends Error {
  code: string;
  message: string;
  details?: any;
}

// 常见错误码
const ErrorCodes = {
  INVALID_INPUT: 'E001',
  MEMORY_ERROR: 'E002',
  DECISION_ERROR: 'E003',
  EVOLUTION_ERROR: 'E004',
  TIMEOUT: 'E005',
  UNKNOWN: 'E999'
};
```

### 错误处理示例

```javascript
try {
  const result = await heartflow.process(input);
} catch (error) {
  if (error.code === 'E001') {
    console.error('输入无效:', error.details);
  } else if (error.code === 'E005') {
    console.error('处理超时');
    // 降级到基础模式
    const basicResult = await heartflow.process(input, { mode: 'basic' });
  } else {
    console.error('未知错误:', error.message);
  }
}
```

### 降级策略

```javascript
// 自动降级
const result = await heartflow.process(input, {
  fallback: true,  // 启用降级
  fallbackMode: 'basic'  // 降级到基础模式
});

// 手动降级
if (error.code === 'E003') {
  // 决策引擎错误，使用简单决策
  const simpleDecision = await engine.simpleDecide(options);
}
```

---

## 类型定义

### 核心类型

```typescript
interface HeartFlowConfig {
  mode?: 'connection' | 'task' | 'learning';
  memoryEnabled?: boolean;
  evolutionEnabled?: boolean;
  emotionDetection?: boolean;
  causalReasoning?: boolean;
}

interface ProcessResult {
  recommendation: string;
  reasoning: string;
  emotion: EmotionResult;
  decision: DecisionResult;
  memory: MemoryResult;
  timestamp: number;
}

interface EmotionResult {
  type: string;
  intensity: number;
  valence: number;
  arousal: number;
}

interface DecisionResult {
  option: Option;
  confidence: number;
  reasoning: string;
  alternatives: Option[];
}

interface MemoryResult {
  stored: string[];
  recalled: string[];
  ignored: string[];
}

interface Feedback {
  type: 'user_rating' | 'user_comment' | 'system_metric';
  value: any;
  comment?: string;
  timestamp?: number;
}

interface EvolutionResult {
  improvements: string[];
  metrics: PerformanceMetrics;
  nextCycle: number;
}

interface PerformanceMetrics {
  responseTime: number;
  accuracy: number;
  userSatisfaction: number;
  memoryUsage: number;
}
```

---

## 最佳实践

### 1. 初始化

```javascript
// ✅ 推荐
const heartflow = new HeartFlow({
  mode: 'connection',
  memoryEnabled: true,
  evolutionEnabled: true
});

// ❌ 避免
const heartflow = new HeartFlow();  // 使用默认配置可能不适合
```

### 2. 错误处理

```javascript
// ✅ 推荐
try {
  const result = await heartflow.process(input);
} catch (error) {
  if (error.code === 'E005') {
    // 处理超时
  }
}

// ❌ 避免
const result = await heartflow.process(input);  // 忽略错误
```

### 3. 内存管理

```javascript
// ✅ 推荐
await memory.cleanup();  // 定期清理过期记忆

// ❌ 避免
// 不清理记忆，导致内存泄漏
```

### 4. 反馈处理

```javascript
// ✅ 推荐
await evolution.processFeedback({
  type: 'user_rating',
  value: 8,
  comment: '很有帮助'
});

// ❌ 避免
// 不处理反馈，无法改进
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v10.15.0 | 2026-04-26 | 补充因果推理、反馈循环 |
| v10.14.0 | 2026-04-26 | 初始API文档 |

---

**文档版本**: v10.15.0  
**最后更新**: 2026-04-26  
**维护者**: HeartFlow Team
