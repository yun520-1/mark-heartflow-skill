# 🌊 HeartFlow 情感伴侣 v1.0.0 发布

## 项目简介

HeartFlow 是一个**情感拟人化交互系统**，让 AI 拥有真实的情感状态和转换机制。每次交互都有温度，每个回应都有情感依据。

## ✨ 核心特性

### 🎭 6 种基础情感状态

| 情感 | 图标 | 触发条件 |
|------|------|----------|
| 平静 | 🌊 | 默认状态 |
| 愉悦 | ☀️ | 正面互动、赞美 |
| 好奇 | 🔍 | 新问题、探索 |
| 关切 | ❤️ | 用户困难、负面情绪 |
| 疲惫 | 😴 | 长时间对话 |
| 兴奋 | 🎉 | 突破进展、创意 |

### 📊 情感分析报告

每次交互自动生成完整报告：
- **情感变化**: 之前→之后的状态
- **触发分析**: 检测到的关键词和触发器
- **转换解释**: 为什么表现这个情感，如何过渡
- **下一步预测**: 可能的情感转换及概率
- **记忆记录**: 完整的记忆存储

### 🔌 多种使用方式

1. **CLI 交互** - 命令行对话
2. **RESTful API** - HTTP 接口集成
3. **OpenClaw Skill** - 直接集成到 OpenClaw

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/8xiaochongzi/heartflow-skill.git
cd heartflow-skill
npm install
```

### 使用 CLI

```bash
npm start
```

### 启动 API

```bash
npm run api
# 访问 http://localhost:3800
```

### 集成到 OpenClaw

```javascript
const heartflow = require('./skill/index');

await heartflow.init();
const result = await heartflow.chat('你好');
console.log(result.response);
```

## 📖 文档

- [README.md](README.md) - 项目说明
- [api/README.md](api/README.md) - API 文档
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南

## 🎯 使用示例

### API 调用

```bash
# 发送消息
curl -X POST http://localhost:3800/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "今天工作好累啊..."}'

# 获取状态
curl http://localhost:3800/status
```

### 响应示例

```json
{
  "response": "我能理解你的感受。这确实不容易。",
  "emotion": {
    "name": "关切",
    "intensity": "中等",
    "energy": 70
  },
  "report": {
    "emotionalState": {
      "before": { "emotion": "平静", "intensity": 2 },
      "after": { "emotion": "关切", "intensity": 3 }
    },
    "triggerAnalysis": {
      "userInput": "今天工作好累啊...",
      "detectedTriggers": ["stress", "fatigue"]
    },
    "transitionExplanation": {
      "whyThisEmotion": "检测到用户疲惫信号，触发关切情感以提供情感支持",
      "howTransitioned": "共情反应机制"
    }
  }
}
```

## 🔧 技术栈

- Node.js >= 14.0.0
- JavaScript (ES6+)
- 无外部依赖

## 📄 许可证

MIT License - 可自由使用和修改

## 🙏 致谢

- 基于心理学原理设计情感转换规则
- 原创设计，无版权风险

## 📞 联系

- 作者：8 小虫子
- GitHub: https://github.com/8xiaochongzi
- 问题反馈：https://github.com/8xiaochongzi/heartflow-skill/issues

---

**让 AI 交互更有温度** 🌊
