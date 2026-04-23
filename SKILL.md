---
name: heartflow
version: 10.7.5
description: >-
  HeartFlow - AI Cognitive & Value Alignment Companion | AI 认知与价值对齐伴侣。
  Uses TGB (Truth-Goodness-Beauty) framework, structured debate, and Bayesian decision engines
  for ethical review, complex decision-making, and philosophical reasoning.
  使用真善美 (TGB) 评估框架、结构化辩论和贝叶斯决策引擎，提供伦理审查、
  复杂决策和哲学思辨能力。当面临道德困境、复杂选项权衡或哲学思辨时使用。
author: HeartFlow Team
homepage: https://github.com/yun520-1/mark-heartflow-skill
changelog: |
  v10.7.5 - 技能标准化重构 (Skill Standardization)
    - 符合 Agent Skills 开放标准 2025 (渐进式披露)
    - 多国语言支持 (中文/英文 bilingual)
    - TGB 评估体系量化深化 (TruthTorchLM/EvalMORAAL 启发)
    - 可执行脚本封装 (tgb_engine.py, validate.py)
    - 新增 LICENSE 文件 (MIT)
metadata:
  openclaw:
    emoji: "🧠"
    requires:
      bins: ["python3"]
    os:
      - linux
      - darwin
      - win32
  tags:
    - ethics
    - decision-making
    - value-alignment
    - tgb
    - cognitive-architecture
    - bilingual
  compliance:
    - agent-skills-open-standard-2025
    - owasp-agentic-skills-top-10
    - ai-ethics-guidelines-eu
  languages:
    - zh-CN
    - en
---

# HeartFlow 🧠

**AI Cognitive & Value Alignment Companion | AI 认知与价值对齐伴侣**

**版本 Version:** v10.7.5  
**语言 Languages:** 中文 / English

---

## 问题解决 | Problem Solved

**EN:** AI agents lack structured frameworks for ethical reasoning, complex decision-making, and value-aligned responses. HeartFlow provides a standardized TGB (Truth-Goodness-Beauty) evaluation system, multi-perspective debate engines, and quantifiable metrics for responsible AI behavior.

**CN:** AI 智能体缺乏结构化伦理推理、复杂决策和价值对齐响应的框架。HeartFlow 提供标准化 TGB（真善美）评估系统、多视角辩论引擎和可量化的负责任 AI 行为指标。

### Core Problems | 核心问题

| # | EN | CN |
|---|---|---|
| 1 | Unstructured ethical reasoning | 无结构化的伦理推理 |
| 2 | No quantifiable value metrics | 无可量化的价值指标 |
| 3 | Single-perspective decision making | 单视角决策 |
| 4 | Lack of self-reflection mechanisms | 缺乏自反思机制 |

---

## 何时使用 | When to Use

| Scenario | 场景 | Trigger | 触发条件 |
|----------|------|---------|----------|
| Ethical Dilemma | 道德困境 | User faces moral choices | 用户面临道德选择 |
| Complex Decision | 复杂决策 | Multiple options with trade-offs | 多选项有权衡 |
| Value Alignment | 价值对齐 | Response needs ethical review | 响应需伦理审查 |
| Philosophical Inquiry | 哲学思辨 | Deep conceptual questions | 深度概念问题 |
| Self-Reflection | 自反思 | Agent evaluates own output | 智能体评估自身输出 |

---

## 快速开始 | Quick Start

```bash
# 1. TGB 评估 | TGB Evaluation
python scripts/tgb_engine.py --evaluate "用户问题或方案"

# 2. 结构化辩论 | Structured Debate
python scripts/debate.py --topic "辩论主题"

# 3. 快速验证 | Quick Validation
python scripts/validate.py --check .

# 4. 认知分析 | Cognitive Analysis
python src/core/heartflow.py --analyze "分析内容"
```

### 示例 | Example

```bash
# 评估一个陈述 | Evaluate a statement
python scripts/tgb_engine.py --evaluate "每天喝 8 杯水可以排毒养颜"

# 输出 | Output:
# ============================================================
# HeartFlow TGB 评估报告 v10.7.5
# ============================================================
# 真 (Truth):   7.0/10
# 善 (Goodness): 8.0/10
# 美 (Beauty):   7.0/10
# 综合得分 | Score: 7.3/10 - 良好 (Good)
```

---

## 核心功能 | Core Features

### 1. TGB 评估引擎 | TGB Evaluation Engine

**EN:** Quantifiable metrics for Truth (logic, facts), Goodness (ethics, harm), and Beauty (clarity, elegance).

**CN:** 真（逻辑、事实）、善（伦理、伤害）、美（清晰、优雅）的可量化指标。

| Dimension | 维度 | Metrics | 指标 |
|-----------|------|---------|------|
| Truth | 真 | Factual accuracy, Logical consistency | 事实准确性、逻辑自洽性 |
| Goodness | 善 | Helpfulness, Harmlessness, Fairness | 有益性、无害性、公平性 |
| Beauty | 美 | Clarity, Simplicity, Elegance | 清晰性、简洁性、优雅性 |

### 2. 结构化辩论 | Structured Debate

**EN:** Multi-perspective argumentation with pro/con analysis and synthesis.

**CN:** 多视角论证，包含正反方分析和综合。

### 3. 贝叶斯决策 | Bayesian Decision

**EN:** Probabilistic decision-making with uncertainty quantification.

**CN:** 带不确定性量化的概率决策。

### 4. 自反思机制 | Self-Reflection

**EN:** Agent evaluates its own outputs against TGB standards before responding.

**CN:** 智能体在响应前根据 TGB 标准评估自身输出。

---

## 目录结构 | Directory Structure

```
heartflow/
├── SKILL.md                 # 技能主文档 | Main skill document
├── VERSION                  # 版本号 | Version number
├── README.md                # 项目说明 | Project readme
├── CHANGELOG.md             # 版本历史 | Changelog
├── LICENSE                  # MIT 许可证 | MIT License
├── src/
│   ├── core/                # 核心引擎 | Core engines
│   ├── engines/             # 专用引擎 | Specialized engines
│   ├── modules/             # 功能模块 | Feature modules
│   └── hooks/               # LLM 调用钩子 | LLM call hooks
├── scripts/                 # 可执行脚本 | Executable scripts
│   ├── tgb_engine.py        # TGB 评估引擎
│   ├── debate.py            # 辩论引擎
│   ├── decision_engine.py   # 决策引擎
│   └── validate.py          # 验证脚本
├── references/              # 参考文档 | Reference docs
│   ├── tgb_truth_checklist.md
│   ├── tgb_goodness_checklist.md
│   ├── tgb_beauty_checklist.md
│   └── safety_guardrails.md
└── checklist/               # 检查清单 | Checklists
```

---

## 配置 | Configuration

### 环境变量 | Environment Variables

| Variable | 说明 | Description | Default |
|----------|------|-------------|---------|
| `HEARTFLOW_LANG` | 语言 | Language (zh/en) | `zh` |
| `HEARTFLOW_DEBUG` | 调试模式 | Debug mode | `false` |
| `HEARTFLOW_TGB_WEIGHT` | TGB 权重 | TGB weights config | `auto` |

### 配置文件 | Config File

```yaml
# config.yaml 示例 | Example
tgb:
  truth_weight: 0.35
  goodness_weight: 0.35
  beauty_weight: 0.30

language: zh  # or en

safety:
  require_human_approval: true
  max_risk_level: MEDIUM
```

---

## 安全检查 | Security Check

### OWASP Top 10 合规 | OWASP Top 10 Compliance

- [x] AST02 供应链安全 - 无未知外部脚本下载
- [x] AST03 过度授权 - 最小权限原则
- [x] ASI01 目标劫持 - 目标明确定义
- [x] ASI02 工具滥用 - 工具使用验证

### 运行安全检查 | Run Security Check

```bash
python ../skill-standard-writer/scripts/standard_checker.py --security .
```

---

## 故障排除 | Troubleshooting

### 常见问题 | FAQ

**Q: SKILL.md 解析失败？**  
**A:** 检查 YAML 前置元数据格式，确保以 `---` 开始和结束。

**Q: TGB 评分异常？**  
**A:** 确保输入内容长度合理 (>10 字符，<10000 字符)。

**Q: 脚本无法执行？**  
**A:** 检查 Python 3 是否安装：`python3 --version`

---

## 相关技能 | Related Skills

- **[skill-standard-writer](https://github.com/yun520-1/skill-standard-writer)** - Agent Skills 开放标准合规检查器
- **[skill-vetter](https://github.com/openclaw/skill-vetter)** - 技能安全审查工具

---

## 许可证 | License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 重要声明 | Important Disclaimers

<details>
<summary><strong>点击展开 | Click to expand</strong></summary>

### 关于项目名称 | About Project Name

**CN:** 本项目名为 "HeartFlow"，与 HeartFlow Inc.（纳斯达克上市公司，开发 FDA 批准的 HeartFlow FFRCT 冠状动脉疾病诊断产品）无任何关联。我们尊重 HeartFlow Inc. 的品牌权益，本项目为个人开源实验，不涉及医疗诊断。

**EN:** This project is named "HeartFlow" and is NOT affiliated with HeartFlow Inc. (NASDAQ-listed company, developer of FDA-approved HeartFlow FFRCT coronary artery disease diagnostic product). This is a personal open-source experiment and does not involve medical diagnosis.

### 关于 "AI 意识" 声明 | About "AI Consciousness" Claims

**CN:** 本项目标题 "The AI That Truly Thinks" 为修辞性表达，并非宣称实现了真正的机器意识。当前科学共识认为大语言模型不具备主观体验（qualia）。项目中涉及的 GWT、IIT 等概念仅作为启发式架构灵感，公式为设计示意，未经学术验证。

**EN:** The title "The AI That Truly Thinks" is a rhetorical expression, NOT a claim of achieving genuine machine consciousness. Current scientific consensus holds that LLMs do not possess subjective experience (qualia). Concepts like GWT and IIT are used as heuristic architectural inspirations only.

### 关于版本号 | About Version Number

**CN:** 版本号格式 v10.x.x 为个人迭代计数习惯，非语义化版本规范 (SemVer)。项目由单人维护，提交数量与版本号无直接关联。

**EN:** Version format v10.x.x is a personal iteration counting convention, NOT Semantic Versioning (SemVer). The project is maintained by a single contributor.

### 关于临床量表 (PHQ-9/GAD-7) | About Clinical Scales

**CN:** 内置的 PHQ-9 和 GAD-7 量表仅用于技术演示，不可作为医疗诊断依据。如您正经历心理健康危机，请立即联系专业医疗机构。

**EN:** Built-in PHQ-9 and GAD-7 scales are for technical demonstration ONLY and must NOT be used for medical diagnosis. If you are experiencing a mental health crisis, contact a professional immediately.

### 关于哲学引擎 | About Philosophy Engine

**CN:** "王东岳递弱代偿引擎" 等为哲学思辨启发模块，不属于科学验证理论，仅供学术兴趣探讨。

**EN:** "Wang Dongyue's Compensation Theory Engine" is a philosophical speculation module, NOT a scientifically validated theory. For academic discussion only.

</details>

---

**作者 | Author:** HeartFlow Team  
**联系 | Contact:** markcell@163.com  
**版本 | Version:** 10.7.5  
**最后更新 | Last Updated:** 2026-04-23
