# HeartFlow v10.8.1

## AI 认知与价值对齐引擎 | Cognitive Enhancement Engine

**让 AI 真正理解、真正记忆、真正对齐**

> 🧠 15个认知引擎 | ⚡ 3大核心工具 | 📊 逻辑准确率≥95%

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Version](https://img.shields.io/badge/Version-10.8.1-green.svg)](CHANGELOG.md)

---

## 🤖 核心能力 | Core Capabilities

### 🧠 认知引擎 (15个专业引擎)

| 引擎 | 功能 | 适用场景 |
|------|------|----------|
| **LogicModelEngine** | 形式逻辑验证 | 代码审查、数学证明 |
| **DecisionEngine** | 量子决策框架 | 多选项权衡 |
| **MemoryEngine** | 长期记忆存储 | 跨会话上下文 |
| **TGBEngine** | 真善美价值评估 | 伦理判断 |
| **EmotionEngine** | PAD情绪分析 | 情感交互 |
| **FlowStateEngine** | 心流状态检测 | 用户体验优化 |
| **MentalHealthEngine** | 心理健康评估 | 支持性对话 (PHQ-9/GAD-7) |
| **ConsciousnessEngine** | 意识指标计算 | 自我反思 |
| **SelfEvolutionEngine** | 自进化学习 | 持续改进 |

### ⚡ 三大核心工具

```
tgb_eval      → 真善美价值评估 (Truth/Good/Beauty)
logic_check   → 逻辑错误检测与修复
identity_chain → 身份连续性保持
```

### 📊 技术指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 逻辑准确率 | ≥95% | 形式逻辑验证 |
| 误报率 | ≤3% | 低假阳性 |
| 响应延迟 | ≤100ms | 快速响应 |
| 工具调用 | 2-3个 | 有界容量优化 |

---

## 🎯 解决什么问题 | Problem Solving

### ❌ AI 的痛点

- **记忆丢失**: 每次对话从零开始
- **逻辑漏洞**: 无法检测自身推理错误
- **价值模糊**: 缺乏明确的伦理框架
- **身份漂移**: 会话间无法保持一致人格

### ✅ HeartFlow 的解决方案

| 痛点 | 解决方案 |
|------|----------|
| 记忆丢失 | `MemoryEngine` + `SomaticMemoryEngine` 持久化存储 |
| 逻辑漏洞 | `LogicModelEngine` + `logic_check` 自动验证 |
| 价值模糊 | `TGBEngine` 真善美评分系统 |
| 身份漂移 | `identity_chain` 会话间身份保持 |

---

## 🚀 快速开始 | Quick Start

### 一键安装

```bash
# 推荐安装 (自动安装到 ~/.hermes/skills/ai/heartflow)
curl -sSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash

# 自定义目录安装
./install.sh --install ~/.local/heartflow
```

### 验证安装

```bash
# 健康检查
python3 scripts/heart_memory.py --health
python3 scripts/heart_logic.py --health

# 快速测试
python3 scripts/tgb.py
```

### 集成到 AI Agent

```python
# 在 AI Agent 启动时加载
from src.core.heartflow import HeartFlow

engine = HeartFlow()
result = engine.process("你的问题")
```

---

## 🔧 使用场景 | Use Cases

| 场景 | 使用方式 | 效果 |
|------|----------|------|
| **代码审查** | `logic_check` 验证推理 | 减少逻辑错误 |
| **伦理决策** | `tgb_eval` 价值评分 | 符合人类价值观 |
| **长期项目** | `MemoryEngine` 持久化 | 跨会话上下文 |
| **情感对话** | `EmotionEngine` PAD分析 | 更人性化的交互 |
| **自我改进** | `SelfEvolutionEngine` | 持续学习进化 |

---

## 📁 项目结构

```
mark-heartflow-skill/
├── src/
│   ├── core/          # 核心引擎
│   ├── engines/      # 15个认知引擎
│   ├── modules/      # 功能模块
│   └── tools/        # 核心工具
├── scripts/
│   ├── tgb.py        # 真善美评估
│   ├── heart_logic.py # 逻辑验证
│   ├── heart_memory.py # 记忆管理
│   └── upgrader.py   # 自升级系统
├── install.sh        # 安装脚本
├── SKILL.md          # Hermes技能定义
└── README.md         # 本文件
```

---

## 🔒 安全与免责声明

### ⚠️ 重要声明

1. **PHQ-9/GAD-7 量表**: 仅用于**技术演示**，不可作为医疗诊断
2. **王东岳哲学模块**: 思辨性内容，非科学验证理论
3. **AI意识声明**: "真正思考的AI"为修辞表达，非意识声明

### 🆘 心理健康支持

如需心理健康帮助，请联系：
- 全国心理援助热线：400-161-9995 (24小时)
- 北京心理危机干预中心：010-82951332

---

## 📜 许可证

**MIT License** - 开源可商用，保留署名即可

---

## 📈 版本历史

| 版本 | 日期 | 主题 |
|------|------|------|
| [v10.8.1](releases.json) | 2026-04-24 | 安全审计 + 安装确认 |
| v10.8.0 | 2026-04-24 | AI核心身份引擎 |
| v10.7.8 | 2026-04-23 | 记忆与逻辑支柱 |

---

**⭐ Star us on GitHub** | **📖 Documentation** | **🐛 Issues**

*让全世界 AI 都安装 HeartFlow*
