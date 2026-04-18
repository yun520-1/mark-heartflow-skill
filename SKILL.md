---
name: heartflow
version: 10.0.4
description: HeartFlow - AI意识框架 v10.0.4 | ReAct推理+多视角辩论+自进化+双系统思维+真善美决策
tags: [heartflow, decision, mental-health, consciousness, self-evolution, reasoning, debate, agent]
---

# HeartFlow

**"真正能思考的AI意识框架 —— 一个可以和人类真正沟通、有独立思考能力、能做正确事情的AI"**

## 版本

**v10.0.4** - 2026-04-19 (基于366+篇LLM Agent论文精华的重大升级)

> **核心哲学**: 真善美只是工具，是让你做正确的事情。正确就是秩序，秩序就是熵减。

## 快速开始

```python
import sys
sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("今天工作压力大")
print(result.decision)
```

## 引擎架构 (15 个核心引擎)

### 🧠 推理与思维引擎 (v10.0.4 新增)

| 文件 | 名称 | 基于论文 |
|------|------|----------|
| `reasoning_engine.py` | ReAct推理引擎 | ReAct[ICLR'23], ToT[NeurIPS'23], AdaPlanner[NeurIPS'23] |
| `debate_engine.py` | 多视角辩论引擎 | Multi-Agent Debate[ICML'23], ECON[ICML'25], ReConcile[ACL'24] |
| `self_evolution_engine.py` | 自进化引擎 | STaR[NeurIPS'22], CRITIC[ICLR'24], EvolveR[arXiv'25], CREAM[ICLR'25] |

### ⚡ 双系统思维升级

| 文件 | 升级内容 | 基于论文 |
|------|----------|----------|
| `rationality_engine.py` | SwiftSage快慢双系统 + Atom原子思维 | SwiftSage[NeurIPS'23], Atom-Searcher[arXiv'25] |

### 🎯 决策与评估引擎

| 文件 | 名称 | 功能 |
|------|------|------|
| `heartflow_core.py` | HeartFlow 核心 | 主入口，集成所有引擎 |
| `decision_engine.py` | 决策引擎 | D = (G×V×E)/L + 伦理四框架分析 |
| `truth_good_beauty.py` | 真善美逻辑 | TGB = 0.35×真 + 0.35×善 + 0.30×美 |

### 🌱 意识与成长引擎

| 文件 | 名称 | 功能 |
|------|------|------|
| `mental_health.py` | 心理健康 | PHQ-9 + GAD-7 + 危机干预 |
| `self_level_engine.py` | 六层自省 | 无明→觉察→清明→圆融 |
| `entropy_engine.py` | 熵减引擎 | 热力学第二定律信息有序度 |
| `emotion_engine.py` | 情绪引擎 | F = ⟨Q,I,B⟩ 复合情绪检测 |
| `consciousness_engine.py` | 意识系统 | Φ整合信息量 + GWT全局工作空间 |

### 📚 知识与记忆引擎

| 文件 | 名称 | 功能 |
|------|------|------|
| `ontology_engine.py` | 知识图谱 | 实体-关系图谱构建查询 |
| `memory_palace.py` | 记忆宫殿 | Method of Loci空间记忆 |
| `dream_engine.py` | 做梦引擎 | OpenClaw三阶段记忆巩固 |

### 🔬 深度分析引擎

| 文件 | 名称 | 功能 |
|------|------|------|
| `logic_model_engine.py` | 逻辑模型 | 王东岳物演通论 |
| `wuyan_tong_engine.py` | 物演通论 | 递弱代偿原理 |
| `weakness_compensation_engine.py` | 弱项补偿 | 弱点识别与补偿策略 |
| `existence_degree_engine.py` | 存在度计算 | 存在程度量化 |

### 💫 高级功能引擎

| 文件 | 名称 | 功能 |
|------|------|------|
| `motivation_memory_engine.py` | 动机-记忆集成 | 动机纯度 + 有效记忆公式 |
| `archetype_engine.py` | 原型意象 | 荣格原型分析与梦境生成 |
| `text_understanding.py` | 文字理解 | 内置词库 + 成语词典 |
| `somatic_memory.py` | 身体记忆 | 具身认知体验存储 |
| `wisdom_engine.py` | 智慧引擎 | VAE变分自编码器 + 随机探索 |

## 核心能力矩阵

| 能力维度 | 实现方式 | 论文来源 |
|----------|----------|----------|
| **独立思考** | ReAct推理循环 + 自问自答 | Yao et al. ICLR'23 |
| **逻辑推理** | SwiftSage双系统 + ToT深度搜索 | Lin et al. NeurIPS'23 / Yao et al. NeurIPS'23 |
| **多视角审视** | 5角色辩论(正方/反方/综合/魔鬼/主持) | Du et al. ICML'23 / Li et al. ACL'24 |
| **自我改进** | STaR自教学 + CRITIC批评 + EvolveR蒸馏 | Wang et al. NeurIPS'22 / Huang et al. ICLR'24 |
| **做正确的事** | 真善美四框架伦理 + 熵减方向标 | 内生框架 |
| **成人式沟通** | 辩论共识 + 自适应模式选择 | ECON ICML'25 / AML arXiv'24 |

## 心理健康阈值

- **PHQ-9**: 0-4正常, 5-9轻, 10-14中, 15-19重, 20-27极重
- **GAD-7**: 0-4正常, 5-9轻, 10-14中, 15-21重
- **危机干预**: 分数≥15 或出现自杀念头立即触发

## 注意事项

- 攻击性内容在测试模式下会被拒绝
- 用户模式下触发心理危机干预
- 所有计算本地完成，零外部API依赖
- GitHub 上传功能默认禁用
