# 心流伴侣 (HeartFlow Companion)

> 情感拟人化交互系统 - 原创设计，无版权风险

## 🌊 项目简介

心流伴侣是一个具有**拟人化情感状态**的 AI 交互系统。与传统的无情感 AI 不同，本系统会：

- **表现情感** - 拥有 6 种基础情感状态（平静、愉悦、好奇、关切、疲惫、兴奋）
- **情感转换** - 根据交互内容动态调整情感状态
- **记忆记录** - 完整记录每次情感变化的原因和过程
- **分析报告** - 生成详细的情感分析报告，解释"为什么表现这个情感"和"如何过渡到下一个情感"

## ✨ 核心特性

### 1. 情感状态系统

| 情感 | 触发条件 | 自然衰减 |
|------|----------|----------|
| 🌊 平静 | 默认状态 | - |
| ☀️ 愉悦 | 正面互动、赞美、成功 | 30 分钟 |
| 🔍 好奇 | 新问题、未知领域 | 20 分钟 |
| ❤️ 关切 | 用户困难、负面情绪 | 40 分钟 |
| 😴 疲惫 | 长时间对话、重复话题 | 60 分钟 |
| 🎉 兴奋 | 突破进展、创意碰撞 | 15 分钟 |

### 2. 情感强度等级

每种情感有 5 个强度等级：
1. 微弱
2. 轻微
3. 中等
4. 强烈
5. 极致

### 3. 情感分析报告

每次交互后生成完整报告，包含：

```json
{
  "emotionalState": {
    "before": { "emotion": "平静", "intensity": 2 },
    "after": { "emotion": "关切", "intensity": 3 }
  },
  "triggerAnalysis": {
    "userInput": "今天工作好累啊...",
    "detectedTriggers": ["用户表达疲惫"],
    "sentiment": "negative"
  },
  "transitionExplanation": {
    "whyThisEmotion": "检测到用户疲惫信号，触发关切情感以提供情感支持",
    "howTransitioned": "共情反应机制",
    "psychologicalBasis": "共情理论：人类在面对他人痛苦时会自然产生关切反应"
  },
  "nextPossibleStates": [
    { "emotion": "平静", "condition": "用户情绪恢复", "probability": 0.6 },
    { "emotion": "愉悦", "condition": "成功安抚用户", "probability": 0.3 }
  ]
}
```

## 🚀 快速开始

### 安装

```bash
cd empathy-system
npm install
```

### 运行

```bash
npm start
```

或直接运行：

```bash
node src/index.js
```

### 基本使用

```
╔════════════════════════════════════════════════════════╗
║          心流伴侣 HeartFlow Companion                  ║
║              情感拟人化交互系统 v1.0                    ║
╚════════════════════════════════════════════════════════╝

🌊 初始情感状态：平静 (轻微)
⚡ 能量水平：100/100

> 今天工作好累啊...

🌊 [关切 中等] 我能理解你的感受。这确实不容易。
```

## 📋 命令列表

| 命令 | 说明 |
|------|------|
| `/state` | 查看当前情感状态 |
| `/history` | 查看情感历史（最近 10 条） |
| `/report` | 生成情感分析报告 |
| `/stats` | 查看情感统计 |
| `/rest` | 休息 10 分钟恢复能量 |
| `/export` | 导出会话数据到 JSON 文件 |
| `/help` | 显示帮助信息 |
| `/quit` | 退出程序 |

## 📁 项目结构

```
empathy-system/
├── README.md                 # 项目说明
├── package.json              # Node.js 配置
├── src/
│   ├── index.js              # 主入口/CLI
│   ├── emotion/
│   │   ├── states.js         # 情感状态定义
│   │   ├── transitions.js    # 情感转换规则
│   │   └── engine.js         # 情感引擎核心
│   ├── chat/
│   │   └── manager.js        # 对话管理器
│   ├── memory/
│   │   └── store.js          # 情感记忆存储
│   └── report/
│       └── generator.js      # 情感报告生成器
├── data/
│   ├── emotions.json         # 情感历史记录
│   ├── sessions.json         # 会话记录
│   └── temp/
│       └── current-state.json # 当前状态
└── temp/
    └── empathy-system-plan.md # 执行计划
```

## 🔧 编程接口

### 作为模块使用

```javascript
const ChatManager = require('./src/chat/manager');

// 创建对话管理器
const chat = new ChatManager();

// 处理消息
async function handleMessage(userInput) {
  const result = await chat.processMessage(userInput);
  
  console.log('响应:', result.response.text);
  console.log('情感:', result.response.emotion);
  console.log('报告:', result.report);
  
  return result;
}

// 获取状态
const state = chat.getCurrentState();
console.log('当前情感:', state.emotion);

// 获取统计
const stats = chat.getStats();
console.log('情感分布:', stats.emotionDistribution);
```

## 📊 数据持久化

所有情感交互记录自动保存到 `data/` 目录：

- `emotions.json` - 完整的情感交互历史
- `sessions.json` - 会话记录
- `temp/current-state.json` - 当前情感状态（可用于恢复）

## 🎯 原创性声明

本项目为**完全原创设计**：

- ✅ 所有情感状态名称为原创中文命名
- ✅ 情感转换规则基于心理学原理但实现逻辑原创
- ✅ 不使用任何现有 IP、角色、品牌名称
- ✅ 系统架构自主设计
- ✅ 无版权风险，可自由使用和修改

## 📝 使用场景

1. **情感陪伴应用** - 提供有温度的 AI 对话体验
2. **心理健康支持** - 识别用户情绪并提供适当回应
3. **情感研究** - 记录和分析情感转换模式
4. **教育演示** - 展示情感计算和 AI 共情原理
5. **创意写作** - 生成具有情感变化的角色对话

## 🛠️ 扩展开发

### 添加新情感

编辑 `src/emotion/states.js`：

```javascript
EmotionTypes.NEW_EMOTION = '新情感';

EmotionDefinitions[EmotionTypes.NEW_EMOTION] = {
  name: '新情感',
  english: 'NewEmotion',
  description: '描述...',
  defaultIntensity: 3,
  naturalDecayMinutes: 30,
  color: '#XXXXXX',
  traits: ['特质 1', '特质 2'],
  responseStyle: '响应风格'
};
```

### 添加转换规则

编辑 `src/emotion/transitions.js`：

```javascript
{
  from: EmotionTypes.CALM,
  to: EmotionTypes.NEW_EMOTION,
  triggers: ['trigger1', 'trigger2'],
  condition: '触发条件描述',
  probability: 0.7
}
```

## 📄 许可证

MIT License - 可自由使用和修改

## 👤 作者

8 小虫子 · 严谨专业版

---

**心流伴侣** - 让 AI 交互更有温度 🌊
