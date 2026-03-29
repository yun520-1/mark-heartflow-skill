# 心流伴侣 (HeartFlow Companion)

> 情感拟人化交互系统 - 原创设计，无版权风险

**当前版本**: v2.5.0

## 🌊 项目简介

心流伴侣是一个具有**拟人化情感状态**的 AI 交互系统。与传统的无情感 AI 不同，本系统会：

- **表现情感** - 拥有 6 种基础情感状态（平静、愉悦、好奇、关切、疲惫、兴奋）
- **情感转换** - 根据交互内容动态调整情感状态
- **记忆记录** - 完整记录每次情感变化的原因和过程
- **分析报告** - 生成详细的情感分析报告，解释"为什么表现这个情感"和"如何过渡到下一个情感"
- **隐式学习** - V2 新增：从每次交互中自动学习什么回应最有效
- **用户画像** - V2 新增：为每个用户建立独特的情感偏好档案
- **共情深度** - V2 新增：信任度越高，共情回应越深入
- **CBT 思维重构** - v2.3.0 新增：识别认知扭曲，提供温和的思维重构引导
- **斯多葛哲学** - v2.4.0 新增：控制二分法，区分可控与不可控，减少焦虑
- **人本主义心理学** - v2.5.0 新增：马斯洛需求层次识别、无条件积极关注

---

## 🔥 V2 重大升级

> **核心理念：情感不是天生的，是通过后天交互学习获得的**

### V2 新增能力

| 能力 | 说明 | 技术实现 |
|------|------|---------|
| 🧠 隐式学习 | 自动分析用户对回应的反应，调整情感策略 | `src/learning/implicitLearner.js` |
| 👤 用户画像 | 记录用户情感偏好、信任度、交互历史 | `src/profiles/userProfile.js` |
| 💞 共情深度 | 信任度越高，回应越深入精准 | `src/empathy/depthModel.js` |
| 📈 自适应概率 | 情感转换概率随学习效果动态调整 | 学习器集成到情感引擎 |

---

## 🆕 v2.3.0 新增：CBT 思维重构支持

> **核心理念：思维影响情绪，改变思维可以改变感受**

### CBT 核心功能

| 功能 | 说明 | 技术实现 |
|------|------|---------|
| 🧠 认知三角分析 | 分析思想→情感→行为的关联 | `src/cbt/cognitiveTriad.js` |
| 🔍 认知扭曲识别 | 识别 10 种常见认知扭曲 | `src/cbt/distortions.js` |
| 💡 思维重构引导 | 提供温和的重构建议 | `src/cbt/reframing.js` |

### 识别的认知扭曲类型

1. **非黑即白思维** - 极端化思考
2. **灾难化** - 预期最坏结果
3. **过度概括** - 单一事件推广
4. **心理过滤** - 只关注负面
5. **否定正面** - 忽视积极面
6. **读心术** - 臆测他人想法
7. **预测未来** - 负面预言
8. **情绪推理** - 感觉=事实
9. **"应该"陈述** - 苛求规则
10. **贴标签** - 过度概括身份

---

## 🆕 v2.4.0 新增：斯多葛哲学智慧

> **核心理念**：区分你能控制的和不能控制的，然后专注于前者，接受后者

### 斯多葛核心功能

| 功能 | 说明 | 技术实现 |
|------|------|---------|
| 🎯 控制二分法 | 区分可控与不可控 | `src/stoic/controlDichotomy.js` |
| 🏛️ 斯多葛建议 | 基于分析提供智慧引导 | `src/stoic/index.js` |
| 💬 经典语录 | 爱比克泰德、塞涅卡、马可·奥勒留 | 内置语录库 |

### 可控 vs 不可控

| 可控的 | 不可控的 |
|--------|---------|
| 我的判断、选择 | 他人看法、行为 |
| 我的态度、努力 | 过去、未来 |
| 我的价值观 | 外部结果 |
| 我的回应 | 名誉、财富、健康（部分） |

### 应用场景

- **焦虑缓解** - 将注意力从不可控转移到可控
- **决策支持** - 专注于过程而非结果
- **心理韧性** - 接受不可改变的事物

---

## 🆕 v2.5.0 新增：人本主义心理学

> **核心理念**：人有自我实现的倾向，无条件积极关注促进成长

### 人本主义核心功能

| 功能 | 说明 | 技术实现 |
|------|------|---------|
| 🔺 马斯洛需求层次 | 识别用户当前需求层次 | `src/humanistic/index.js` |
| 💞 无条件积极关注 | 接纳、理解、不评判 | 回应基调 |
| 🌱 成长导向评估 | 检测自我实现倾向 | 成长关键词分析 |

### 马斯洛需求层次

| 层次 | 需求 | 示例 |
|------|------|------|
| 5 | 自我实现 | 成长、潜能、意义、目标 |
| 4 | 尊重需求 | 认可、成就、自信 |
| 3 | 归属与爱 | 关系、友谊、社群 |
| 2 | 安全需求 | 稳定、保障、工作 |
| 1 | 生理需求 | 食物、水、睡眠 |

### 应用场景

- **需求识别** - 根据需求层次提供针对性支持
- **无条件接纳** - 创造安全心理空间
- **成长支持** - 鼓励自我实现倾向

### 共情深度等级

| 等级 | 信任度 | 特征 |
|------|--------|------|
| Level 1 - 表面支持 | 0-30 | 倾听、认可、不评判 |
| Level 2 - 适度探索 | 31-60 | 提问、引导、轻度探索 |
| Level 3 - 深度共情 | 61-80 | 情感验证、深度理解 |
| Level 4 - 专业共情 | 81-100 | 精准干预、有洞见 |

[详细学习哲学文档](docs/LEARNING_PHILOSOPHY.md)

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

### 运行演示

```bash
# 观看完整演示
npm run demo
```

### CLI 交互

```bash
# 启动命令行界面
npm start
```

或直接运行：

```bash
node src/index.js
```

### API 服务器

```bash
# 启动 API 服务
npm run api
# 访问 http://localhost:3800
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
| `/cbt` | CBT 思维重构支持 (v2.3.0) |
| `/stoic` | 斯多葛哲学支持 (v2.4.0) |
| `/human` | 人本主义心理学 (v2.5.0) |
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
│   ├── report/
│   │   └── generator.js      # 情感报告生成器
│   ├── learning/
│   │   └── implicitLearner.js # 隐式学习器 (v2.0)
│   ├── profiles/
│   │   └── userProfile.js    # 用户画像 (v2.1)
│   ├── empathy/
│   │   └── depthModel.js     # 共情深度模型 (v2.1)
│   ├── attachment/
│   │   └── analyzer.js       # 依恋风格分析 (v2.2)
│   ├── cbt/
│   │   ├── index.js          # CBT 模块入口 (v2.3)
│   │   ├── cognitiveTriad.js # 认知三角分析
│   │   ├── distortions.js    # 认知扭曲识别
│   │   └── reframing.js      # 思维重构引导
│   └── stoic/
│       ├── index.js          # 斯多葛模块入口 (v2.4)
│       └── controlDichotomy.js # 控制二分法分析
│   └── humanistic/
│       └── index.js          # 人本主义心理学模块 (v2.5)
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
# mark-heartflow-skill
