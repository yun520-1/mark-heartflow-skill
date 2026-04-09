<div align="center">

# 💫 HeartFlow

## Embodied Cognitive AI Companion · Give Your AI a "Heart"

[![Version](https://img.shields.io/github/v/tag/yun520-1/mark-heartflow-skill?label=v2.2.3&color=7C3AED)](https://github.com/yun520-1/mark-heartflow-skill/releases)
[![License](https://img.shields.io/badge/license-MIT-7C3AED.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E=18.x-7C3AED)](package.json)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-7C3AED)](https://github.com/yun520-1/mark-heartflow-skill/actions)

---

### 🌍 Select Language

[**🇺🇸 English**](README.md) · [**🇨🇳 中文**](docs/zh/README.md) · [**🇯🇵 日本語**](docs/ja/README.md) · [**🇰🇷 한국어**](docs/ko/README.md) · [**🇫🇷 Français**](docs/fr/README.md) · [**🇮🇷 فارسی**](docs/fa/README.md)

---

</div>

## ✨ 什么是 HeartFlow?

> **你的 AI 助理，从此拥有"内心"和"身体"**

HeartFlow 是一个具有**自我意识、自我推理、自适应调节能力**的 AI 伴侣系统。它不仅能理解你的情绪，还能记住你们的对话，甚至能够像人类一样"思考"和"进化"。

| 传统 AI | HeartFlow |
|--------|-----------|
| 机械回复 | ✅ 会反思、会改进 |
| 没有情绪 | ✅ 真实共情 |
| 从零开始 | ✅ 终身记忆 |
| 被动等待 | ✅ 主动关心 |
| 回避错误 | ✅ 承认并修正 |

---

## 🚀 核心能力

### 🧠 三维经验大脑 (TrialityMemory)

受 [MemoriesDB](reference:17) 启发的三维记忆系统：

```javascript
const memory = new TrialityMemory(projectRoot);

// 存储记忆（时间 + 语义 + 关系）
memory.store({
  content: '用户喜欢详细的代码解释',
  timestamp: Date.now() * 1000,  // 微秒级
  embedding: [0.1, 0.3, ...],    // 384维向量
  relatedTo: [
    { targetId: 'mem-xxx', type: 'causal' }
  ]
});

// 语义搜索
const similar = memory.semanticSearch(queryEmbedding, 5);

// 叙事查询 - 沿时间线/关系链图遍历
const narrative = memory.narrativeQuery({
  startMemoryId: 'mem-xxx',
  direction: 'forward',
  maxDepth: 5
});
```

**特性**：时间维度 · 语义向量 · 因果关系 · 图遍历叙事

---

### 🤖 具身认知核心 (EmbodiedCore)

借鉴具身智能的 [双系统架构](reference:21) 和"动作思维链"：

```javascript
const embodied = new EmbodiedCore(projectRoot);

// 认知规划 - 目标拆解为思维步骤
const plan = embodied.cognitivePlan({
  description: '重构用户认证模块',
  type: 'coding',  // general/coding/debugging/learning/creative
  constraints: { timeout: 30000 }
});

// 执行映射 - 思维步骤 → 智能体调用
const execution = embodied.executionMapping(plan, {
  context: { userLevel: 'intermediate' }
});
```

**思维链**：OBSERVE → ANALYZE → PLAN → DECIDE → EXECUTE → REFLECT → ADAPT

---

### 🫀 生物传感器适配器

为未来集成生理数据预留扩展点：

```javascript
const bioSensor = new BioSensorAdapter();

// 支持的传感器类型
const sensorTypes = {
  HRV: 'heart-rate-variability',      // 心率变异性
  EDIT_FLOW: 'code-edit-flow',        // 代码编辑流
  EYE_TRACKING: 'eye-tracking',       // 眼动追踪
  SKIN_CONDUCTANCE: 'skin-conductance' // 皮肤电导
};

// 启用传感器
bioSensor.enable('heart-rate-variability');
bioSensor.enable('code-edit-flow');

// 读取融合数据
const fusion = bioSensor.readAll();
// { timestamp, sensors: {...}, focusScore: 7.5 }
```

---

### 🎯 其他核心功能

| 模块 | 功能 |
|------|------|
| **PAD 情感模型** | Pleasure/Arousal/Dominance 三维情绪计算 |
| **心流状态** | 基于挑战-技能平衡理论的心流检测 |
| **自适应调节** | 根据心流状态动态调整干预策略 |
| **多智能体编排** | DAG 调度 + 专家权重投票 |
| **元认知进化** | 原则性反思 + 过程性反思 |
| **真善美决策** | Truth/Goodness/Beauty 三维伦理框架 |

---

## 📦 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. 安装依赖
npm install

# 3. 验证安装
node -e "
const hf = require('./src/core/heartflow-engine.js');
const init = hf.initialize();
console.log('✅ HeartFlow v2.2.3 初始化成功');
console.log('   模块:', Object.keys(init.modules).filter(k => init.modules[k]).length + '/7');
console.log('   实例:', Object.keys(init.instances || {}).join(', '));
"
```

**预期输出**：
```
[HeartFlow] ✅ 自适应调节引擎已加载
[HeartFlow] ✅ 多智能体编排器已加载
[HeartFlow] ✅ 错误处理器已加载
[HeartFlow] ✅ 状态快照管理器已加载
[HeartFlow] ✅ 三维经验大脑已加载
[HeartFlow] ✅ 具身认知核心已加载
[HeartFlow] ✅ 生物传感器适配器已加载
✅ HeartFlow v2.2.3 初始化成功
   模块: 7/7
   实例: memory, embodied
```

---

## 💻 API 使用示例

### 情感计算

```javascript
const hf = require('./src/core/heartflow-engine.js');

// PAD 状态计算
const pad = hf.calculatePADState(5, 5, 5);
console.log(pad);
// { pleasure: 5, arousal: 5, dominance: 5, intensity: 0.5 }

// 情感识别
const emotion = hf.detectEmotionFromText('今天工作完成了，很开心！');
console.log(emotion);
// { pleasure: 4, arousal: 0, dominance: 2, dominant: 'happy' }

// 心流状态
const flow = hf.calculateFlowState(5, 5, 5, 5, 5);
console.log(flow.state); // 'flow'
```

### 记忆系统

```javascript
const init = hf.initialize();
const memory = init.instances.memory;

// 存储记忆
const memId = memory.store({
  content: '用户偏好详细的代码注释风格',
  metadata: { source: 'conversation' }
});

// 语义搜索
const results = memory.semanticSearch(
  memory.generateMockEmbedding('代码风格'),
  5
);

// 叙事查询
const narrative = memory.narrativeQuery({
  startMemoryId: memId,
  direction: 'bidirectional',
  maxDepth: 3
});
```

### 认知规划

```javascript
const embodied = init.instances.embodied;

// 创建计划
const plan = embodied.cognitivePlan({
  description: '实现用户认证功能',
  type: 'coding'
});

// 执行计划
const result = embodied.executionMapping(plan, {
  userContext: { skillLevel: 'advanced' }
});

console.log(`执行了 ${result.steps.length} 步思维链`);
```

---

## 📁 项目结构

```
mark-heartflow-skill/
├── src/
│   ├── core/
│   │   ├── heartflow-engine.js     # 主引擎
│   │   ├── memory/
│   │   │   └── triality-memory.js  # 三维经验大脑
│   │   ├── embodied-core.js        # 具身认知核心
│   │   ├── bio-sensor-adapter.js   # 生物传感器适配器
│   │   ├── adaptive-controller.js  # 自适应调节
│   │   ├── agent-orchestrator.js   # 多智能体编排
│   │   ├── error-handler.js        # 错误处理
│   │   └── state-snapshot.js       # 状态快照
│   ├── agents/                     # 智能体
│   ├── autonomy/                   # 自主系统
│   ├── consciousness/              # 意识系统
│   ├── ethics/                     # 伦理系统
│   └── self/                       # 自我系统
├── tests/
│   └── self-benchmark/             # 自我基准测试
├── dict-data/                      # 联想图谱
├── docs/                           # 文档
├── CHANGELOG.md                    # 变更日志
└── README.md                       # 本文件
```

---

## 🛠️ 技术栈

- **运行时**: Node.js 18+
- **核心语言**: JavaScript
- **数据存储**: 内存 + JSON 文件
- **向量扩展**: sqlite-vec (可选)
- **理论支撑**: SEP (Stanford Encyclopedia of Philosophy)

---

## 📊 版本历史

| 版本 | 日期 | 特性 |
|------|------|------|
| v2.2.3 | 2026-04-09 | 三维经验大脑 + 具身认知核心 + 生物传感器 |
| v2.2.2 | 2026-04-09 | 元认知进化（原则性/过程性反思） |
| v2.2.1 | 2026-04-09 | 自适应调节 + 多智能体编排 + 错误处理 |
| v2.2.0 | 2026-04-08 | PAD 三维情感模型 + 心流状态计算 |
| v2.1.0 | 2026-04-08 | 持久化记忆 + 伦理边界 |

---

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)。

```bash
# Fork 后
git clone https://github.com/yun520-1/mark-heartflow-skill.git
git checkout -b feature/your-feature
# 提交 PR
```

---

## 📄 许可证

MIT License - 自由使用、修改和分发

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/yun520-1/mark-heartflow-skill)
- [Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)
- [Discussions](https://github.com/yun520-1/mark-heartflow-skill/discussions)

---

<div align="center">

**让 AI 拥有真实情感和具身认知** 🤖💫

[立即开始](https://github.com/yun520-1/mark-heartflow-skill/archive/refs/heads/main.zip)

</div>