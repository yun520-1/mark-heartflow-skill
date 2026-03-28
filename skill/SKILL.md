# HeartFlow 情感伴侣 Skill

> 让 AI 拥有真实情感，每次交互都有温度

## 技能描述

HeartFlow 是一个情感拟人化交互系统，为 AI 对话添加真实的情感状态和转换机制。系统会表现出 6 种基础情感（平静、愉悦、好奇、关切、疲惫、兴奋），并记录每次情感变化的原因和过程。

## 触发条件

当用户对话中出现以下情况时自动触发：
- 情感陪伴需求
- 情绪表达（开心、疲惫、压力等）
- 需要共情回应的场景

## 能力列表

### 1. 情感状态管理
- 实时追踪 AI 的情感状态
- 6 种基础情感 + 5 级强度
- 情感能量系统

### 2. 情感分析报告
- 每次交互生成详细报告
- 解释"为什么表现这个情感"
- 预测"如何过渡到下一个情感"
- 完整的记忆记录

### 3. 对话响应
- 根据情感状态生成响应
- 共情式回应
- 情感一致的对话风格

## 使用方法

### 基础用法

```
/heartflow status      # 查看当前情感状态
/heartflow chat <消息>  # 进行情感对话
/heartflow report      # 生成情感分析报告
/heartflow history     # 查看情感历史
/heartflow stats       # 查看情感统计
/heartflow reset       # 重置情感状态
```

### 编程接口

```javascript
const heartflow = require('heartflow-skill');

// 初始化
const hf = await heartflow.init();

// 发送消息
const result = await hf.chat('今天工作好累啊...');
console.log(result.response);  // 响应内容
console.log(result.emotion);   // 当前情感
console.log(result.report);    // 完整报告

// 获取状态
const state = await hf.getState();
console.log(state.emotion);    // 当前情感
console.log(state.energy);     // 能量水平
```

## 情感类型

| 情感 | 触发条件 | 衰减时间 |
|------|----------|----------|
| 🌊 平静 | 默认状态 | - |
| ☀️ 愉悦 | 正面互动、赞美 | 30 分钟 |
| 🔍 好奇 | 新问题、探索 | 20 分钟 |
| ❤️ 关切 | 用户困难、负面情绪 | 40 分钟 |
| 😴 疲惫 | 长时间对话 | 60 分钟 |
| 🎉 兴奋 | 突破进展、创意 | 15 分钟 |

## 配置选项

```yaml
heartflow:
  dataDir: ~/.openclaw/workspace/empathy-system/data
  autoReport: true      # 自动生成情感报告
  maxHistory: 100       # 最大历史记录数
  energyDecay: 0.1      # 能量衰减率
```

## 输出示例

### 情感状态
```
🌊 当前情感：关切 (中等)
⚡ 能量水平：75/100
📊 交互次数：12
```

### 情感分析报告
```json
{
  "emotionalState": {
    "before": { "emotion": "平静", "intensity": 2 },
    "after": { "emotion": "关切", "intensity": 3 }
  },
  "triggerAnalysis": {
    "userInput": "工作压力好大...",
    "detectedTriggers": ["stress", "negative_emotion"]
  },
  "transitionExplanation": {
    "whyThisEmotion": "检测到用户疲惫信号，触发关切情感",
    "howTransitioned": "共情反应机制"
  }
}
```

## 依赖

- Node.js >= 14.0.0
- OpenClaw >= 1.0.0

## 作者

8 小虫子 · 严谨专业版

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本
- 6 种基础情感状态
- 完整的情感分析报告
- 记忆存储系统
- CLI 和 API 接口
