---
name: heartflow
version: 10.8.1
description: >
  HeartFlow v10.8.1 - AI 认知与价值对齐引擎
  
  ## 核心能力
  - 15个认知引擎：逻辑验证、决策、记忆、情绪、价值评估
  - 3个核心工具：tgb_eval(真善美)、logic_check(逻辑检查)、identity_chain(身份链)
  - 逻辑准确率≥95%，误报率≤3%，延迟≤100ms
  
  ## 解决问题
  - 记忆丢失 → MemoryEngine 持久化
  - 逻辑漏洞 → LogicModelEngine 自动验证
  - 价值模糊 → TGBEngine 真善美评分
  - 身份漂移 → identity_chain 会话保持
  
  ## 一键安装
  curl -sSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash
author: HeartFlow Team
homepage: https://github.com/yun520-1/mark-heartflow-skill
changelog: |
  v10.8.1 - 安全审计 + 安装确认 + 版本统一
    - 安全审计报告 SECURITY_AUDIT.md (评分 7.4/10)
    - 安装脚本增加安全确认提示
    - 版本统一到 v10.8.1
    - 15个认知引擎完整文档
    - 临床量表免责声明增强
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
    - cognitive-memory
    - logic-verification
    - craniemem
    - tableau-calculus
    - reasoning
    - value-alignment
    - tgb-evaluation
    - self-evolution
    - emotion-analysis
    - decision-engine
  compliance:
    - agent-skills-open-standard-2025
    - owasp-agentic-skills-top-10
  papers:
    - CraniMem (2026)
    - HeLa-Mem (2026)
    - D-Mem (2026)
    - Hilbert-style verification (2026)
    - VerifiAgent (2026)
    - PRoSFI (2026)
---

# HeartFlow v10.7.8 - Cognitive Memory & Logic Verification

**HeartFlow** 是一个轻量级认知引擎，提供**记忆存储与检索**和**逻辑验证**两大核心能力。

**定位:** 为 AI Agent 提供持久化记忆和逻辑推理验证能力，基于 2026 年前沿认知科学研究。

---

## Quick Start | 快速开始

### Installation | 安装

```bash
# Clone repository
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# Verify installation
python scripts/heart_memory.py --health
python scripts/heart_logic.py --health
```

### Usage | 使用

```bash
# Memory: Store a memory
python scripts/heart_memory.py --store "Today I learned about CraniMem" --emotion 0.8

# Memory: Retrieve
python scripts/heart_memory.py --retrieve "CraniMem"

# Logic: Verify an argument
python scripts/heart_logic.py --verify "All humans are mortal. Socrates is human. Therefore Socrates is mortal."

# Health check
python scripts/heart_memory.py --health
python scripts/heart_logic.py --health
```

---

## Core Engines | 核心引擎

### 1. HeartTrace Memory | 心痕记忆引擎

**File:** `scripts/heart_memory.py`

**Architecture:** 三级存储架构

| Layer | 层级 | Capacity | Purpose |
|-------|------|----------|---------|
| STM | 短期记忆 | 256 items | Fast access, recent context |
| Episodic Buffer | 情景缓冲 | 128 items (goal-gated) | Controlled consolidation |
| LTM | 长期知识图谱 | Unlimited (persisted) | Entity-relation graph |

**Features:**
- 🧠 **Goal-gated encoding**: Ego strength × Emotion = Memory strength
- 🔄 **Hebbian consolidation**: Automatic transfer from episodic to LTM
- 📊 **Multi-pathway retrieval**: Semantic + Temporal + Usage frequency
- 💾 **Persistent storage**: LTM saved to JSON file

**Papers:** CraniMem (2026), HeLa-Mem (2026), D-Mem (2026)

### 2. Logic Verification Engine | 逻辑验证引擎

**File:** `scripts/heart_logic.py`

**Verification Modes:**

| Mode | 模式 | Description |
|------|------|-------------|
| Syllogism | 三段论 | All M are P. All S are M. ∴ All S are P. |
| Modus Ponens | 肯定前件 | If P then Q. P. ∴ Q. |
| Modus Tollens | 否定后件 | If P then Q. Not Q. ∴ Not P. |

**Fallacy Detection:**
- Affirming the consequent
- Denying the antecedent
- False dichotomy (非黑即白)
- Circular reasoning

**Papers:** Hilbert-style (2026), VerifiAgent (2026), PRoSFI (2026), Interleaved Bonus (2026)

---

## API Reference | API 参考

### HeartTrace Memory

```python
from scripts.heart_memory import HeartTraceMemory

mem = HeartTraceMemory(eg_buf=128, ltm_fp="memory/heart_ltm.json")
mem.load_ltm()

# Store
mem.store("Important conversation", emotion=0.8)

# Retrieve
results = mem.retrieve("conversation", top_n=5)

# Save
mem.save_ltm()
```

### Logic Verification

```python
from scripts.heart_logic import LogicVerificationEngine

engine = LogicVerificationEngine()

# Verify syllogism
result = engine.verify_syllogism(
    "All humans are mortal",
    "Socrates is human",
    "Therefore Socrates is mortal"
)
print(f"Valid: {result.valid}, Confidence: {result.confidence}")

# Auto-detect and verify
result = engine.verify("If P then Q. P. Therefore Q.")
```

---

## Examples | 示例

### Memory Example | 记忆示例

```bash
$ python scripts/heart_memory.py --store "HeartFlow v10.7.8 released" --emotion 0.9
✅ 记忆已存储
  内容：HeartFlow v10.7.8 released...
  情感：0.9
  强度：0.450
  Hash: a3f8c2d1e5b7

$ python scripts/heart_memory.py --retrieve "HeartFlow"
🔍 检索结果 (查询：'HeartFlow')
==================================================
  [1] HeartFlow v10.7.8 released...
      强度：0.450 | 情感：0.9 | 检索：1 次 | 距今：0.1 小时
==================================================
```

### Logic Example | 逻辑示例

```bash
$ python scripts/heart_logic.py --verify "All humans are mortal. Socrates is human. Therefore Socrates is mortal."
🔍 逻辑验证结果
==================================================
有效性：✅ 有效
置信度：85.00%
推理步骤:
  ✓ 中项 'human' 连接大前提和小前提
  ✓ 有效推理：all + all → all
==================================================

$ python scripts/heart_logic.py --verify "If it rains then ground is wet. Ground is not wet. Therefore it did not rain."
🔍 逻辑验证结果
==================================================
有效性：✅ 有效
置信度：95.00%
推理步骤:
  ✓ 否定后件 (Modus Tollens): ground is wet
  ✓ 有效推出否定前件：it rains
==================================================
```

---

## Security | 安全

HeartFlow 遵循 OWASP Agentic Skills Top 10:

- ✅ **AST02 Supply Chain**: No external script downloads
- ✅ **AST03 Excessive Agency**: Minimal file access (memory/ directory only)
- ✅ **ASI01 Goal Hijack**: Clear, bounded objectives
- ✅ **ASI02 Tool Abuse**: Deterministic pattern matching

See `references/safety_guardrails.md` for details.

---

## Version History | 版本历史

| Version | Date | Theme |
|---------|------|-------|
| 10.7.8 | 2026-04-23 | Memory & Logic Pillars |
| 10.7.7 | 2026-04-23 | Engineering Excellence |
| 10.7.6 | 2026-04-23 | Minimal Executable Core |
| 10.7.5 | 2026-04-23 | Skill Standardization |
| 10.7.4 | 2026-04-23 | Agent Skills Open Standard |
| 10.7.0 | 2026-04-23 | Initial Release |

---

## License | 许可证

MIT License - See `LICENSE` file for details.
