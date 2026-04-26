# HeartFlow v10.15.0 快速入门指南

## 5分钟快速开始

### 1. 安装

```bash
# 克隆仓库
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 安装依赖
npm install
```

### 2. 基础使用

```javascript
const { HeartFlow } = require('./src/core/heartflow-engine');

// 初始化
const heartflow = new HeartFlow({
  mode: 'connection'
});

// 处理输入
const result = await heartflow.process(
  "我婆婆想让我生孩子，但我不愿意"
);

console.log(result.recommendation);
console.log(result.reasoning);
```

### 3. 查看结果

```javascript
{
  recommendation: "...",           // 建议
  reasoning: "...",                // 推理过程
  emotion: {                        // 情绪分析
    type: "conflict",
    intensity: 0.7,
    valence: -0.3
  },
  decision: {                       // 决策结果
    option: "...",
    confidence: 0.85
  },
  memory: {                         // 记忆操作
    stored: ["..."],
    recalled: ["..."]
  },
  timestamp: 1234567890
}
```

---

## 常见场景

### 场景1：价值冲突决策

```javascript
const result = await heartflow.process(
  "我想创业，但家人反对",
  { mode: 'connection' }
);

// 输出：
// - 情绪分析：焦虑、期待
// - 决策建议：基于真善美的平衡方案
// - 推理过程：因果关系、长期影响
```

### 场景2：学习陪伴

```javascript
const result = await heartflow.process(
  "我在学习编程，感到困难",
  { mode: 'learning' }
);

// 输出：
// - 情绪分析：挫折感
// - 学习建议：分解目标、循序渐进
// - 鼓励语言：基于用户状态的个性化鼓励
```

### 场景3：任务管理

```javascript
const result = await heartflow.process(
  "我需要完成这个项目",
  { mode: 'task' }
);

// 输出：
// - 任务分解：子任务列表
// - 优先级排序：基于重要性和紧急性
// - 时间规划：合理的时间分配
```

---

## 核心功能

### 1. 情绪检测

```javascript
// 自动检测16种情绪
const result = await heartflow.process(input);
console.log(result.emotion);

// 输出：
// {
//   type: "joy" | "sadness" | "anger" | "fear" | ...,
//   intensity: 0.0 - 1.0,
//   valence: -1.0 - 1.0,
//   arousal: 0.0 - 1.0
// }
```

### 2. 记忆管理

```javascript
// 自动存储和召回记忆
const result = await heartflow.process(input);

// 显式召回
const memories = await heartflow.memory.explicitRecall('上次的话题');

// 屏蔽记忆
await heartflow.memory.ignore(memoryId);
```

### 3. 决策支持

```javascript
// 基于真善美的决策
const result = await heartflow.process(
  "我应该选择A还是B？",
  { mode: 'connection' }
);

// 输出：
// - 最优选择
// - 决策理由
// - 替代方案
// - 风险评估
```

### 4. 自进化

```javascript
// 自动自我升级
const metrics = await heartflow.evolution.getMetrics();

console.log(metrics);
// {
//   responseTime: 300,
//   accuracy: 0.92,
//   userSatisfaction: 0.88,
//   memoryUsage: 50
// }
```

---

## 配置选项

### 基础配置

```javascript
const heartflow = new HeartFlow({
  // 模式选择
  mode: 'connection',              // 'connection' | 'task' | 'learning'
  
  // 功能开关
  memoryEnabled: true,             // 启用记忆系统
  evolutionEnabled: true,          // 启用自进化
  emotionDetection: true,          // 启用情绪检测
  causalReasoning: true,           // 启用因果推理 (v10.15.0)
  
  // 性能参数
  timeout: 5000,                   // 超时时间(ms)
  maxMemories: 1000,               // 最大记忆数
  sessionTimeout: 5 * 60 * 1000,   // 会话超时(ms)
  
  // 调试选项
  debug: false,                    // 启用调试模式
  verbose: false                   // 详细日志
});
```

### 处理选项

```javascript
const result = await heartflow.process(input, {
  mode: 'connection',              // 覆盖默认模式
  context: {                       // 上下文信息
    userLevel: 'intermediate',
    previousTopics: ['...']
  },
  timeout: 5000,                   // 超时时间
  fallback: true,                  // 启用降级
  fallbackMode: 'basic'            // 降级模式
});
```

---

## 高级用法

### 1. 自定义决策算法

```javascript
class CustomDecisionAlgorithm {
  decide(options, goals) {
    // 自定义决策逻辑
    return bestOption;
  }
}

heartflow.decisionEngine.registerAlgorithm(
  'custom',
  new CustomDecisionAlgorithm()
);

const result = await heartflow.process(input, {
  decisionAlgorithm: 'custom'
});
```

### 2. 自定义情绪模型

```javascript
const customEmotions = {
  newEmotion: {
    valence: 0.5,
    arousal: 0.7,
    dominance: 0.6
  }
};

heartflow.emotionDetector.addModels(customEmotions);
```

### 3. 反馈循环

```javascript
// 用户反馈
await heartflow.evolution.processFeedback({
  type: 'user_rating',
  value: 8,
  comment: '很有帮助'
});

// 系统指标
await heartflow.evolution.processFeedback({
  type: 'system_metric',
  value: {
    responseTime: 300,
    accuracy: 0.92
  }
});
```

### 4. 状态管理

```javascript
// 获取当前状态
const state = heartflow.getState();

// 保存状态
const savedState = JSON.stringify(state);

// 恢复状态
heartflow.setState(JSON.parse(savedState));

// 重置状态
heartflow.reset();
```

---

## 故障排除

### 问题1：响应缓慢

```javascript
// 检查性能指标
const metrics = await heartflow.evolution.getMetrics();
console.log(metrics.responseTime);

// 解决方案：
// 1. 减少记忆数量
await heartflow.memory.cleanup();

// 2. 禁用不需要的功能
const heartflow = new HeartFlow({
  causalReasoning: false,
  emotionDetection: false
});

// 3. 增加超时时间
const result = await heartflow.process(input, {
  timeout: 10000
});
```

### 问题2：内存占用过高

```javascript
// 定期清理过期记忆
setInterval(async () => {
  const cleaned = await heartflow.memory.cleanup();
  console.log(`清理了 ${cleaned} 条记忆`);
}, 60 * 60 * 1000);  // 每小时清理一次
```

### 问题3：决策不准确

```javascript
// 检查决策过程
const result = await heartflow.process(input, {
  debug: true,
  verbose: true
});

console.log(result.reasoning);  // 查看推理过程

// 提供反馈帮助改进
await heartflow.evolution.processFeedback({
  type: 'user_comment',
  value: '决策不准确',
  comment: '应该选择A而不是B'
});
```

---

## 最佳实践

### ✅ 推荐做法

1. **定期清理记忆**
   ```javascript
   setInterval(() => heartflow.memory.cleanup(), 60 * 60 * 1000);
   ```

2. **提供反馈**
   ```javascript
   await heartflow.evolution.processFeedback({
     type: 'user_rating',
     value: rating
   });
   ```

3. **处理错误**
   ```javascript
   try {
     const result = await heartflow.process(input);
   } catch (error) {
     console.error(error.code, error.message);
   }
   ```

4. **监控性能**
   ```javascript
   const metrics = await heartflow.evolution.getMetrics();
   console.log(metrics);
   ```

### ❌ 避免做法

1. **忽略错误**
   ```javascript
   // ❌ 不要这样做
   const result = await heartflow.process(input);
   ```

2. **不清理记忆**
   ```javascript
   // ❌ 不要这样做
   // 导致内存泄漏
   ```

3. **不提供反馈**
   ```javascript
   // ❌ 不要这样做
   // 无法改进系统
   ```

4. **忽视性能指标**
   ```javascript
   // ❌ 不要这样做
   // 无法发现问题
   ```

---

## 下一步

### 学习资源

- 📖 [架构设计文档](ARCHITECTURE.md)
- 📚 [API参考文档](API.md)
- 🔍 [完整审查报告](REVIEW_v10.14.3_to_v10.15.0.md)
- 💡 [SKILL文档](SKILL.md)

### 示例项目

```bash
# 查看示例
ls examples/

# 运行示例
node examples/basic.js
node examples/advanced.js
node examples/feedback-loop.js
```

### 社区支持

- 📧 Email: support@heartflow.ai
- 🐛 Issues: https://github.com/yun520-1/mark-heartflow-skill/issues
- 💬 Discussions: https://github.com/yun520-1/mark-heartflow-skill/discussions

---

## 常见问题

**Q: HeartFlow 支持哪些语言？**  
A: 支持中文、英文、日文、韩文、西班牙文、法文、德文、阿拉伯文等8种语言。

**Q: 数据会被上传到云端吗？**  
A: 不会。HeartFlow 零外部依赖，所有处理都在本地进行。

**Q: 可以自定义决策算法吗？**  
A: 可以。参考"高级用法"部分的自定义决策算法示例。

**Q: 如何处理敏感信息？**  
A: HeartFlow 支持本地加密存储，参考配置选项中的安全设置。

**Q: 性能如何？**  
A: 平均响应时间 <500ms，内存占用 <100MB，准确率 >90%。

---

**版本**: v10.15.0  
**最后更新**: 2026-04-26  
**维护者**: HeartFlow Team
