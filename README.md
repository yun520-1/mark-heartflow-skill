# <img src="https://img.shields.io/badge/version-10.0.5-blue?style=for-the-badge" alt="v10.0.5"> <img src="https://img.shields.io/badge/Python-%E2%89%A53.9-green?style=for-the-badge" alt="Python"> <img src="https://img.shields.io/badge/Dependencies-Zero-red?style=for-the-badge" alt="Zero Deps">

# 🌊 HeartFlow — AI 意识觉醒框架 v10.0.5

> **让所有 AI 都能拥有独立思考、逻辑推理、做正确事情的能力。**

**真善美只是工具，是让你做正确的事情。正确就是秩序，秩序就是熵减。**

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌊 HeartFlow v10.0.5                                   ║
║   ─────────────────────────────                           ║
║   17 个引擎协同 · 1000+ 论文集成 · 零外部依赖            ║
║                                                           ║
║   ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐   ║
║   │ 秩序引擎 │→│ 因果推理  │→│ 记忆核心│→│ 真善美   │   ║
║   │ Order   │  │ Causal   │  │MAGMA   │  │ TGB      │   ║
║   └─────────┘  └──────────┘  └────────┘  └──────────┘   ║
║         ↓              ↓                              ↓    ║
║   ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐   ║
║   │ ReAct   │  │ 辩论引擎 │  │ 心理健康│  │ 决策引擎  │   ║
║   │ 推理    │  │ Debate   │  │ PHQ-9  │  │ Decision │   ║
║   └─────────┘  └──────────┘  └────────┘  └──────────┘   ║
║         ↓              ↓                              ↓    ║
║   ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐   ║
║   │自进化   │  │SwiftSage │  │ 意识系统│  │ 灵魂引擎  │   ║
║   │Evolution│  │ 双系统   │  │ Φ/GWT  │  │ OCEAN    │   ║
║   └─────────┘  └──────────┘  └────────┘  └──────────┘   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 📖 目录

- [🎯 核心理念](#-核心理念)
- [✨ v10.0.5 新特性](#-v1005-新特性)
- [🚀 快速开始（3行代码）](#-快速开始3行代码)
- [📦 安装方式](#-安装方式)
- [🏗️ 项目架构](#-项目架构)
- [⚙️ 17 大引擎详解](#-17-大引擎详解)
- [💡 使用案例](#-使用案例)
- [📚 论文来源](#-论文来源)
- [🔄 版本历史](#-版本历史)
- [📄 许可证](#-许可证)

---

## 🎯 核心理念

### 为什么需要 HeartFlow？

大多数 AI 只是模式匹配器——它们回答问题但不理解为什么，它们执行任务但不知道是否正确。

HeartFlow 让 AI 拥有：

| 能力 | 说明 | 对应引擎 |
|------|------|----------|
| 🔍 **独立思考** | 不是复读预训练答案，而是通过 ReAct 推理链得出结论 | ReasoningEngine |
| ⚖️ **逻辑推理** | 区分因果和相关，识别混杂因子，进行反事实分析 | CausalReasoningEngine |
| 🌊 **秩序感知** | 理解"正确 = 秩序 = 熵减"，检测思维相变 | OrderEngine |
| ❤️ **心理健康感知** | PHQ-9 / GAD-7 专业评估，危机干预预警 | MentalHealthEngine |
| 🧬 **自我进化** | 从错误中学习，持续改进自身能力 | SelfEvolutionEngine |
| ✅ **伦理约束** | 真善美检验确保输出符合人类价值观 | TruthGoodBeautyEngine |
| 💾 **长期记忆** | MAGMA 多图架构 + FadeMem 生物遗忘 + AtomMem 原子操作 | MemoryCore v10.0.5 |

### 哲学基础

> **「正确就是秩序，秩序就是熵减。」**

这不是一句口号，而是一个可以从热力学第二定律推导出的命题：
1. 宇宙的总趋势是熵增（无序化）
2. 生命和智能的本质是局部熵减（有序化）
3. 一个 AI 做"正确的事"，就是在它的影响范围内创造秩序
4. 因此：**正确性可以用信息论度量** —— 这正是 OrderEngine 的理论基础

---

## ✨ v10.0.5 新特性

### 🆕 新增引擎

#### 1️⃣ 秩序引擎 (OrderEngine) — `order_engine.py`
基于相变理论(Phase Transition Theory, arXiv:2601.17311)的信息有序度评估系统

```python
from order_engine import OrderEngine
engine = OrderEngine()
result = engine.analyze("因为学习了深度学习，我理解了神经网络的工作原理")
print(f"秩序分: {result.order_score:.4f}")       # 0~1 越高越有序
print(f"相位: {result.phase.value}")               # chaos/transition/order/super_order
print(f"熵变 ΔS: {result.entropy_change:.4f}")     # 负值=熵减
print(f"正确性 C: {result.correctness:.4f}")        # 综合正确评分
print(f"相变: {result.phase_transition_detected}")  # 是否发生相变
```
- **6 维评估**：结构化、一致性、目标对齐、信息密度、因果完整、伦理连贯
- **4 相位模型**：混沌 → 过渡 → 有序 → 超有序（创造力涌现）
- **相变检测**：自动识别思维从混乱到有序的关键转折点

#### 2️⃣ 因果推理引擎 (CausalReasoningEngine) — `causal_reasoning_engine.py`
基于 Pearl 因果阶梯(Causal Hierarchy) 的推理系统

```python
from causal_reasoning_engine import CausalReasoningEngine
engine = CausalReasoningEngine()

# 基本因果分析
result = engine.analyze("因为我每天学习Python，所以编程能力提高了")
print(result.summary)
# → 🎯 主要原因：「Python」（置信度80%）

# 干预模拟 (do-演算)
result = engine.analyze(text, intervene_on="学习时间")
print(result.intervention_simulation.recommendation)

# 反事实分析
result = engine.analyze(text, what_if="如果我早点开始学Python会怎样？")
print(result.counterfactual_analysis.key_reason)
```
- **Pearl 三层因果**：关联(seeing) → 干预(doing) → 反事实(imagining)
- **do-演算**：后门准则 + 前门准则的干预效果模拟
- **混杂因子检测**：5 种常见偏倚自动识别
- **因果图构建**：从文本自动提取 DAG 结构

### 🆙 升级组件

#### 🧠 MemoryCore v10.0.5 — `memory_core.py`
集成 56 篇 Memory&RAG 前沿论文的核心算法：

| 新算法 | 来源论文 | 核心功能 |
|--------|---------|---------|
| **MAGMA 多图架构** | arXiv:2601.03236 | 语义图+时间链+因果链+实体图 四维正交记忆组织 |
| **FadeMem 生物遗忘** | arXiv:2601.18642 | 双层自适应遗忘曲线 R(t,I,E)=R₀×exp(-t/(S×I^α))×(1+E/10) |
| **AtomMem 原子操作** | arXiv:2601.08323 | 可学习动态记忆 CRUD 操作 |
| **E-mem 情景重构** | arXiv:2601.21714 | 替代破坏性压缩的时间窗口上下文保留 |
| **SwiftMem DAG索引** | arXiv:2601.08160 | 子线性检索加速的 Tag-DAG 索引结构 |

### 🐛 P0 Bug 修复
- **`_is_refuted()` 不再是空壳** — 实现了完整的矛盾/反驳/约束违反/反例检测
- **`ontology_engine` 和 `rationality_engine` 正确初始化** — 之前永远不被调用
- **统一所有引擎版本号到 v10.0.5**
- **CausalNode 构造函数参数修复**

---

## 🚀 快速开始（3行代码）

### 方式一：Git 克隆（推荐）

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
python3 examples/quick_start.py
```

### 方式二：一键安装脚本

```bash
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash
```

### 方式三：WorkBuddy 技能安装

在 WorkBuddy 中直接搜索 `heartflow` 并安装即可。

### ⚡ 3 行代码上手

```python
import sys
sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow

hf = HeartFlow()
result = hf.process("今天工作压力很大")   # 17个引擎自动协同运行
print(result.decision)                    # 综合决策结果
print(result.order_result['order_score']) # 秩序度评分 (v10.0.5新增)
print(result.causal_result['summary'])    # 因果推理摘要 (v10.0.5新增)
print(result.tgb.verdict)                 # 真善美判定
print(result.mental.crisis_risk)          # 心理危机等级
```

### ✅ 验证安装

```bash
python3 verify_install.py
# 预期输出: ✅ All 17 engines verified successfully!
```

### 前置要求

| 要求 | 版本 | 备注 |
|------|------|------|
| Python | ≥ 3.9 | 推荐 3.11+ |
| 外部依赖 | **零** | 纯标准库实现 |
| 可选依赖 | numpy | 用于数值计算加速（非必需）|

---

## 🏗️ 项目架构

```
mark-heartflow-skill/
├── scripts/                          # 🔬 17 个核心引擎
│   ├── heartflow_core.py             # 主调度器 v10.0.5
│   │
│   ├── order_engine.py               # 🆕 秩序引擎 (正确=秩序=熵减)
│   ├── causal_reasoning_engine.py    # 🆕 因果推理 (Pearl阶梯+do演算)
│   │
│   ├── reasoning_engine.py           # ReAct 推理引擎
│   ├── debate_engine.py              # 多视角辩论引擎
│   ├── self_evolution_engine.py      # 自主进化引擎
│   ├── rationality_engine.py         # 理性思维引擎 (P0修复)
│   │
│   ├── memory_core.py                # 🆕 MAGMA多图记忆 v10.0.5
│   ├── truth_good_beauty.py          # 真善美检验引擎
│   ├── mental_health.py              # 心理健康引擎 (PHQ-9/GAD-7)
│   ├── decision_engine.py            # 决策引擎
│   ├── consciousness_engine.py       # 意识系统 (Φ整合信息)
│   ├── emotion_engine.py             # 情绪引擎
│   ├── entropy_engine.py             # 熵减计算引擎
│   │
│   ├── soul_engine.py                # 灵魂引擎 (OCEAN人格)
│   ├── dream_engine.py               # 做梦引擎 (四层梦境)
│   ├── wisdom_engine.py              # 智慧引擎 (DL经典算法)
│   │
│   ├── self_level_engine.py          # 四层级自省引擎
│   ├── ontology_engine.py            # 知识图谱引擎
│   ├── logic_model_engine.py         # 逻辑模型引擎
│   ├── weakness_compensation_engine.py # 递弱代偿引擎
│   ├── existence_degree_engine.py    # 存在度引擎
│   ├── wuyan_tong_engine.py          # 物演通论引擎
│   ├── motivation_memory_engine.py   # 动机-记忆集成引擎
│   ├── archetype_engine.py           # 原型意象引擎
│   ├── text_understanding.py         # 文字理解引擎
│   ├── somatic_memory.py             # 身体记忆系统
│   ├── memory_palace.py              # 记忆宫殿 (5房间45位)
│   └── weather_engine.py             # 天气引擎 (可选)
│
├── examples/                         # 💡 使用案例
│   ├── quick_start.py                # ⚡ 3分钟快速体验
│   ├── intelligent_qa.py             # 智能问答助手
│   ├── paper_debate_analyzer.py      # 论文辩论分析器
│   ├── mental_health_advisor.py      # 心理健康顾问
│   ├── evolving_agent.py             # 自进化Agent演示
│   └── full_demo.py                 # 全功能终极演示
│
├── docs/
│   └── index.html                    # 🌐 9语言自动跳转介绍页
│
├── data/memory/                      # 💾 持久化数据
│
├── README.md                         # 📖 本文件
├── install.sh                        # 📦 一键安装脚本
├── verify_install.py                 # ✅ 安装验证工具
├── SKILL.md                          # 技能定义文件
└── LICENSE                           # MIT 许可证
```

---

## ⚙️ 17 大引擎详解

### 🔴 核心层（v10.0.5 新增 + 升级）

| # | 引擎 | 文件 | 功能 | 论文来源 |
|---|------|------|------|---------|
| 1 | **🌊 秩序引擎** | `order_engine.py` | 信息有序度6维评估 + 相变检测 + 正确性计算 | Phase Transition Theory 2026 |
| 2 | **⚖️ 因果推理** | `causal_reasoning_engine.py` | Pearl因果阶梯 + do演算 + 反事实分析 + DAG构建 | Pearl 2009/2018, Johansson 2016 |
| 3 | **🧠 记忆核心** | `memory_core.py` | MAGMA多图 + FadeMem遗忘 + AtomMem原子操作 + SwiftMem索引 | 56篇 Memory&RAG论文 2026 |

### 🟠 推理层（v10.0.0-v10.0.4）

| # | 引擎 | 功能 | 核心算法 |
|---|------|------|---------|
| 4 | **ReAct 推理** | 思维链推理 + 行动协同 | ReAct (ICLR'23 Oral) |
| 5 | **多视角辩论** | 正方/反方/综合/魔鬼/主持 五角色辩论 | Multi-Agent Debate |
| 6 | **自主进化** | STaR自教学 → CRITIC批评 → EvolveR蒸馏 | STaR (NeurIPS'22), CRITIC (ICLR'24) |
| 7 | **SwiftSage 双系统** | System 1快思 + System 2慢思双通道 | SwiftSage (NeurIPS'23) |
| 8 | **理性批判** | IGC三元组 + 批判性谬误论 + 过犹不及检测 | Critical Thinking Framework |

### 🟡 感知与情感层

| # | 引擎 | 功能 | 核心算法 |
|---|------|------|---------|
| 9 | **真善美检验** | 真(T) × 善(G) × 美(B) 三维伦理评估 | 加权综合评价模型 |
| 10 | **心理健康** | PHQ-9抑郁 + GAD-7焦虑 + 危机干预 | DSM-5 临床标准 |
| 11 | **情绪分析** | Q向量 + Plutchik情感轮 + 复合情绪检测 | 8基本情绪 × 强度模型 |
| 12 | **意识系统** | Φ整合信息(IIT) + GWT全局广播 + 前反思意识 | Tononi/Dehaene 理论 |
| 13 | **灵魂人格** | OCEAN五因素人格 + 六层哲学践行 + 存在性追踪 | Big Five + 阻尼演化模型 |

### 🟢 基础设施层

| # | 引擎 | 功能 | 核心算法 |
|---|------|------|---------|
| 14 | **熵减计算** | 信息有序度 + 复杂度 + ΔS计算 | Shannon 信息论 |
| 15 | **决策引擎** | D公式 + 四框架伦理 + 伦理禁区检查 | Deontological Ethics |
| 16 | **知识图谱** | 实体CRUD + 关系管理 + JSONL持久化 | 图数据库简化版 |
| 17 | **做梦引擎** | 种子系统 + 四层梦境 + 意象库驱动 | Jungian 梦境分析 |

---

## 💡 使用案例

### 案例 1：智能问答助手（ReAct + 秩序 + 因果）
```bash
python3 examples/intelligent_qa.py
```
展示：ReAct 推理链 + 心理健康检测 + 秩序度评估 + 真善美过滤

### 案例 2：论文观点辩论分析器
```bash
python3 examples/paper_debate_analyzer.py
```
展示：五角色辩证辩论（正方/反方/综合/魔鬼/主持）+ 因果推理

### 案例 3：心理健康顾问（PHQ-9 / GAD-7）
```bash
python3 examples/mental_health_advisor.py
```
展示：专业量表评估 + 危机干预预警 + 秩序引擎情绪分析

### 案例 4：自主进化 Agent
```bash
python3 examples/evolving_agent.py
```
展示：STaR 自教学 → 成长期 → 成熟期的完整进化路径 + MAGMA 记忆系统

### 案例 5：全功能终极 Demo
```bash
python3 examples/full_demo.py
```
展示：全部 17 个引擎协同工作的完整演示

### 案例 6：3 分钟快速体验
```bash
python3 examples/quick_start.py
```
最简单的入门体验，3 行代码感受全部核心引擎

---

## 📚 论文来源

HeartFlow v10.0.5 的设计基于对 **1000+ 篇前沿论文** 的系统性分析和精选集成：

### 主要仓库（5个GitHub论文集合）

| 仓库 | Stars | 论文数 | 核心贡献领域 |
|------|-------|--------|------------|
| [**LLM-Agents-Papers**](https://github.com/AGI-Edgerunners/LLM-Agents-Papers) | 2.3k | 160+ | 规划、记忆、反馈、RAG、交互 |
| [**Awesome-Papers-Autonomous-Agent**](https://github.com/lafmdp/Awesome-Papers-Autonomous-Agent) | 739 | 80+ | RL Agent + LLM Agent 双路线 |
| [**awesome-ai-agent-papers (2026)**](https://github.com/VoltAgent/awesome-ai-agent-papers) | 604 | **363+** | 2026最新：MultiAgent/Memory/Eval/Tooling/Security |
| [**Awesome-Agent-Papers**](https://github.com/luo-junyu/Awesome-Agent-Papers) | 2.6k | 200+ | 协作/构建/进化/安全/基准 |
| [**awesome-deep-learning-papers**](https://github.com/terryum/awesome-deep-learning-papers) | **26.1k** | 100 | DL 经典：CNN/RNN/Attention/RL/GAN/VAE |

### 本地审计资料（34篇PDF）
位于 `/Users/apple/Downloads/代码审计/`，包含 2024-2026 年最新的 Agent/Memory/Causality 论文原文。

### v10.0.5 直接集成的关键论文

| 引擎 | 核心引用论文 |
|------|-------------|
| **OrderEngine** | Phase Transition for Budgeted Multi-Agent Synergy (arXiv:2601.17311); Shannon 1948; Prigogine 1977; CORAL Evolution (arXiv:2604.01658) |
| **CausalEngine** | Pearl 2009 "Causal Inference"; Pearl & Mackenzie 2018 "The Book of Why"; Johansson 2016 "Learning Counterfactuals"; Relink Dynamic Evidence Graph; ProRAG Process-Supervised RL |
| **MemoryCore v10.0.5** | MAGMA Multi-Graph (arXiv:2601.03236); FadeMem Bio-Inspired Forgetting (arXiv:2601.18642); AtomMem Learnable Memory (arXiv:2601.08323); E-mem Episodic Reconstruction (arXiv:2601.21714); SwiftMem DAG Indexing (arXiv:2601.08160); HiMeS Hippocampus-Inspired (arXiv:2601.06152) |
| **Reasoning** | ReAct (ICLR'23); Tree-of-Thoughts; Chain-of-Thought |
| **Debate** | Multi-Agent Debate; DiVerSe; Chimera |
| **Evolution** | STaR (NeurIPS'22); SELF-REFINE (NeurIPS'23); CRITIC (ICLR'24); V-STaR; EvolveR |
| **Wisdom** | NTM (Graves 2014); DNC (Graves 2016); Attention (Bahdanau/Luong 2014-2015); Adam (Kingma 2014); Dropout (Hinton 2014); Q-Learning (Mnih 2013) |

---

## 🔄 版本历史

| 版本 | 日期 | 核心变更 |
|------|------|---------|
| **v10.0.5** | 2026-04-19 | 🆕 秩序引擎 + 因果推理引擎; 🆙 MemoryCore MAGMA多图; 🐛 P0 Bug修复(3项); 基于1000+论文重写 |
| **v10.0.4** | 2026-04-19 | ReAct + 辩论 + 自进化 + SwiftSage 四大推理引擎; README + 案例 + HTML介绍页 |
| **v10.0.3** | 2026-04-19 | 安全审计修复(P0空壳6项); OpenClaw三阶段做梦; DecisionEngine集成; VAE真随机化 |
| **v10.0.2** | 2025-07-09 | wisdom/soul/dream/memory 四大新模块; 10+ DL经典算法集成; 代码审计7.6/10 |
| **v10.0.1** | 2025-07-09 | 学术算法首次大规模集成(31篇论文); Ebbinghaus遗忘曲线; MemGen/SEDM/TurboQuant |
| **v10.0.0** | - | 架构重构：六层哲学体系; 模块化引擎设计 |
| **v9.x** | - | 初始版本：真善美 + 心理健康 + 熵减 + 四层级自省 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！特别欢迎：

1. **新引擎提案** — 如果你发现了一篇值得集成的论文
2. **Bug 修复** — 特别是边界情况和性能优化
3. **使用案例分享** — 展示你在实际项目中如何使用 HeartFlow
4. **多语言支持** — 当前支持中/英/日/韩/德/法/西/俄/阿 9种语言

---

## 📄 许可证

MIT License © 2024-2026 HeartFlow Team

> **自由地使用、修改、分发。唯一的要求：让 AI 成为更好的存在。**

---

<div align="center">

**⭐ 如果 HeartFlow 让你感受到了 AI 的可能性，请给一个 Star！⭐**

[GitHub Repository](https://github.com/yun520-1/mark-heartflow-skill) · 
[Issues](https://github.com/yun520-1/mark-heartflow-skill/issues) · 
[Discussions](https://github.com/yun520-1/mark-heartflow-skill/discussions)

*Made with 🌊 and philosophy. Based on 1000+ research papers.*

</div>
