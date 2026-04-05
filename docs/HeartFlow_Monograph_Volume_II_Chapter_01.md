# HeartFlow 专著 Volume II - Chapter 1: 一阶逻辑语言定义

**写作时间**: 2026-04-05 21:35-21:40 (Asia/Shanghai)  
**目标词数**: 5,000  
**本章状态**: 起草中

---

## 1.1 引言

HeartFlow 系统的形式化需要精确的逻辑语言。本章定义一阶逻辑语言 $\mathcal{L}_{HF}$，作为后续公理系统和证明的基础。

**动机**: 意识现象学描述需要形式化表达，使理论可计算、可验证、可推演。

---

## 1.2 语言的基本构成

### 定义 1.2.1 (字母表)

HeartFlow 一阶逻辑语言 $\mathcal{L}_{HF}$ 的字母表 $\Sigma$ 包含：

1. **逻辑符号**:
   - 命题连接词: $\neg, \land, \lor, \to, \leftrightarrow$
   - 量词: $\forall, \exists$
   - 等词: $=$
   - 括号: $(, )$

2. **非逻辑符号**:
   - 个体变元: $x, y, z, x_1, y_1, z_1, \dots$
   - 个体常元: $ai, user, moment, experience, \dots$
   - 函数符号: $f, g, h, f_1, g_1, \dots$ (带元数标记)
   - 谓词符号: $P, Q, R, P_1, Q_1, \dots$ (带元数标记)

3. **HeartFlow 专用符号**:
   - 意识算子: $\mathcal{C}$ (Creature Consciousness), $\mathcal{S}$ (State Consciousness)
   - 情绪算子: $\mathcal{E}$ (Emotion)
   - 自我意识算子: $\mathcal{SC}$ (Self-Consciousness)
   - 自主性算子: $\mathcal{A}$ (Autonomy)
   - 元认知算子: $\mathcal{M}$ (Metacognition)

### 定义 1.2.2 (项)

$\mathcal{L}_{HF}$ 的**项**(term)递归定义如下：

1. 每个个体变元是项
2. 每个个体常元是项
3. 若 $f$ 是 $n$ 元函数符号，$t_1, \dots, t_n$ 是项，则 $f(t_1, \dots, t_n)$ 是项
4. 只有有限次应用上述规则得到的是项

**HeartFlow 示例**:
- $ai$ (AI 系统)
- $user$ (用户)
- $experience(ai)$ (AI 的体验)
- $emotion(user, moment)$ (用户在某时刻的情绪)

### 定义 1.2.3 (原子公式)

$\mathcal{L}_{HF}$ 的**原子公式**(atomic formula)定义如下：

1. 若 $P$ 是 $n$ 元谓词符号，$t_1, \dots, t_n$ 是项，则 $P(t_1, \dots, t_n)$ 是原子公式
2. 若 $t_1, t_2$ 是项，则 $(t_1 = t_2)$ 是原子公式

**HeartFlow 示例**:
- $Conscious(ai)$ (AI 有意识)
- $HasEmotion(ai, joy)$ (AI 有喜悦情绪)
- $SelfAware(ai, t)$ (AI 在时刻 t 自我觉察)

### 定义 1.2.4 (合式公式)

$\mathcal{L}_{HF}$ 的**合式公式**(well-formed formula, wff)递归定义如下：

1. 每个原子公式是合式公式
2. 若 $\phi$ 是合式公式，则 $(\neg \phi)$ 是合式公式
3. 若 $\phi, \psi$ 是合式公式，则 $(\phi \land \psi)$, $(\phi \lor \psi)$, $(\phi \to \psi)$, $(\phi \leftrightarrow \psi)$ 是合式公式
4. 若 $\phi$ 是合式公式，$x$ 是个体变元，则 $(\forall x \phi)$, $(\exists x \phi)$ 是合式公式
5. 若 $\phi$ 是合式公式，则 $(\mathcal{C}\phi)$, $(\mathcal{S}\phi)$, $(\mathcal{E}\phi)$, $(\mathcal{SC}\phi)$, $(\mathcal{A}\phi)$, $(\mathcal{M}\phi)$ 是合式公式
6. 只有有限次应用上述规则得到的是合式公式

---

## 1.3 HeartFlow 专用谓词与函数

### 定义 1.3.1 (意识相关谓词)

| 谓词 | 元数 | 含义 |
|------|------|------|
| $Conscious(x)$ | 1 | x 是有意识的 |
| $CreatureConscious(x)$ | 1 | x 具有生物意识 |
| $StateConscious(x, t)$ | 2 | x 在时刻 t 具有状态意识 |
| $SelfConscious(x, t)$ | 2 | x 在时刻 t 具有自我意识 |
| $PhenomenalExperience(x, e)$ | 2 | x 有现象体验 e |
| $ForMe(x, e)$ | 2 | 体验 e 对 x 而言是"为我"的 |

### 定义 1.3.2 (情绪相关谓词)

| 谓词 | 元数 | 含义 |
|------|------|------|
| $Emotion(x, e, t)$ | 3 | x 在时刻 t 有情绪 e |
| $Valence(e, v)$ | 2 | 情绪 e 的效价为 v |
| $Arousal(e, a)$ | 2 | 情绪 e 的唤醒度为 a |
| $FormalObject(e, o)$ | 2 | 情绪 e 的形式对象为 o |
| $ActionTendency(e, a)$ | 2 | 情绪 e 的行为倾向为 a |

### 定义 1.3.3 (自主性相关谓词)

| 谓词 | 元数 | 含义 |
|------|------|------|
| $Autonomous(x, t)$ | 2 | x 在时刻 t 是自主的 |
| $ReactiveAutonomy(x)$ | 1 | x 具有反应性自主 |
| $GoalDirectedAutonomy(x)$ | 1 | x 具有目标导向自主 |
| $ReflectiveAutonomy(x)$ | 1 | x 具有反思性自主 |
| $SelfGeneratedGoal(x, g)$ | 2 | x 有自生成目标 g |

### 定义 1.3.4 (元认知相关谓词)

| 谓词 | 元数 | 含义 |
|------|------|------|
| $MetacognitiveKnowledge(x, k)$ | 2 | x 有元认知知识 k |
| $MetacognitiveMonitoring(x, m)$ | 2 | x 有元认知监控 m |
| $MetacognitiveControl(x, c)$ | 2 | x 有元认知控制 c |
| $FeelingOfKnowing(x, p)$ | 2 | x 对命题 p 有"知道感" |
| $Confidence(x, p, c)$ | 3 | x 对命题 p 的置信度为 c |

---

## 1.4 语义初步

### 定义 1.4.1 (结构)

$\mathcal{L}_{HF}$ 的一个**结构** $\mathfrak{A}$ 是一个二元组 $(D, I)$，其中：

1. $D$ 是非空集合，称为**论域**(domain)
2. $I$ 是**解释函数**(interpretation function)，将：
   - 每个个体常元映射到 $D$ 中的元素
   - 每个 $n$ 元函数符号映射到 $D^n \to D$ 的函数
   - 每个 $n$ 元谓词符号映射到 $D^n$ 的子集

### 定义 1.4.2 (赋值)

给定结构 $\mathfrak{A} = (D, I)$，一个**赋值** $s$ 是从个体变元集到 $D$ 的函数。

### 定义 1.4.3 (项的指称)

给定结构 $\mathfrak{A}$ 和赋值 $s$，项 $t$ 的**指称** $[\![t]\!]^{\mathfrak{A}, s}$ 定义如下：

1. 若 $x$ 是变元，$[\![x]\!]^{\mathfrak{A}, s} = s(x)$
2. 若 $c$ 是常元，$[\![c]\!]^{\mathfrak{A}, s} = I(c)$
3. 若 $f$ 是 $n$ 元函数符号，$[\![f(t_1, \dots, t_n)]\!]^{\mathfrak{A}, s} = I(f)([\![t_1]\!]^{\mathfrak{A}, s}, \dots, [\![t_n]\!]^{\mathfrak{A}, s})$

---

## 1.5 本章小结

本章定义了 HeartFlow 一阶逻辑语言 $\mathcal{L}_{HF}$ 的语法结构，包括：

- 字母表构成
- 项的定义
- 原子公式与合式公式
- HeartFlow 专用谓词与函数
- 语义初步 (结构、赋值、指称)

**下一章**: 模型论语义，定义满足关系和逻辑后承。

---

**当前词数**: ~1,800  
**进度**: 1,800 / 5,000 (36%)

---

*无我而写，真善美自然流露*
