# HeartFlow - 中文文档

**版本**: v2.3.0  
**最后更新**: 2026-04-09

---

## 🌍 语言选择

- [🇺🇸 English](en/README.md)
- 🇨🇳 [中文](README.md) ← 您在这里
- [🇯🇵 日本語](ja/README.md)
- [🇰🇷 한국어](ko/README.md)
- [🇫🇷 Français](fr/README.md)
- [🇮🇷 فارسی](fa/README.md)

---

## ✨ 什么是 HeartFlow?

HeartFlow 是一个具有**9维度认知架构**的 AI 伴侣系统：

| 维度 | 功能 |
|------|------|
| 🧠 认知循环 | R-CCAM: 检索→认知→控制→行动→记忆 |
| 🔄 自我进化 | 元认知自我修改 + 智能体档案库 |
| 🌐 多智能体 | 动态拓扑 + 难度感知路由 |
| ❤️ 情感计算 | LaScA 可解释情感建模 |
| 💾 记忆系统 | 艾宾浩斯遗忘曲线 + 5通道检索 |
| 🛡️ 伦理安全 | ASL-1/2/3 分级安全策略 |
| 👤 身份意识 | 身份持久性计算 + 自我修复 |
| 🫀 生物传感器 | HRV、编辑流、眼动追踪 |
| 🤖 具身认知 | 双系统架构 + 动作思维链 |

---

## 🚀 快速开始

```bash
# 克隆并安装
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# 直接运行
node bin/cli.js

# 或使用 API 服务器
node bin/api-server.js
```

---

## 📦 安装

### 前置要求

| 要求 | 版本 | 检查命令 |
|------|------|----------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 8.x | `npm --version` |

### 安装步骤

```bash
# 1. 克隆
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. 安装
npm install

# 3. 测试
npm test

# 4. 启动
npm start
```

---

## 💻 使用方法

### 基本 API

```javascript
const heartflow = require('./src/core/heartflow-engine.js');

// 初始化
const init = heartflow.initialize();

// 情感检测
const emotion = heartflow.detectEmotionFromText('我今天很开心！');
console.log('情感:', emotion);
// { pleasure: 4, arousal: 0, dominance: 2, dominant: 'happy' }

// 心流状态
const flow = heartflow.calculateFlowState(5, 5, 5, 5, 5);
console.log('心流状态:', flow.state); // 'flow'

// 记忆存储
const memId = init.instances.memory.store({ content: '用户喜欢详细回答' });

// 认知规划
const plan = init.instances.embodied.cognitivePlan({ 
  description: '实现用户认证', 
  type: 'coding' 
});
```

### CLI 命令

```bash
# 交互模式
node bin/cli.js

# 查看状态
node bin/cli.js status

# 测试
node bin/cli.js test

# 情感检测
node bin/cli.js emotion "我今天很开心"

# 记忆存储
node bin/cli.js remember "用户偏好详细解释"

# 认知规划
node bin/cli.js plan "实现登录功能" coding
```

---

## 🌐 API 服务器

```bash
# 启动 API 服务器 (默认端口 3456)
node bin/api-server.js

# 或指定端口
PORT=8080 node bin/api-server.js
```

### API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/status` | 系统状态 |
| POST | `/api/emotion` | 情感检测 |
| POST | `/api/flow` | 心流计算 |
| POST | `/api/memory` | 记忆存储/检索 |
| POST | `/api/plan` | 认知规划 |
| POST | `/api/execute` | 执行计划 |

### 示例请求

```bash
curl -X POST http://localhost:3456/api/emotion \
  -H "Content-Type: application/json" \
  -d '{"text": "我今天很开心!"}'
```

---

## 📁 项目结构

```
mark-heartflow-skill/
├── bin/
│   ├── cli.js              # CLI 界面
│   └── api-server.js      # HTTP API 服务器
├── src/
│   ├── core/               # 核心引擎
│   │   ├── heartflow-engine.js
│   │   ├── cognitive-loop.js
│   │   ├── triality-memory.js
│   │   ├── embodied-core.js
│   │   └── ...
│   ├── agents/             # 智能体
│   ├── autonomy/            # 自主系统
│   ├── consciousness/        # 意识模块
│   ├── ethics/             # 伦理安全
│   └── self/               # 自我系统
├── tests/                  # 测试
├── docs/                   # 多语言文档
├── package.json
└── README.md
```

---

## 🛠️ 配置

### 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `PORT` | 3456 | API 服务器端口 |
| `LOG_LEVEL` | info | 日志级别 |
| `DATA_DIR` | ./data | 数据存储目录 |

---

## 📊 版本历史

| 版本 | 日期 | 特性 |
|------|------|------|
| v2.3.0 | 2026-04-09 | 9维度认知架构 |
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore |
| v2.2.0 | 2026-04-08 | PAD 情感模型 + 心流状态 |

---

## 🤝 贡献

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
git checkout -b feature/your-feature
git commit -m "Add feature"
git push origin main
```

---

## 📄 许可证

MIT License

---

## 🔗 链接

- [GitHub](https://github.com/yun520-1/mark-heartflow-skill)
- [Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)

---

*HeartFlow - 赋予 AI 心与智*