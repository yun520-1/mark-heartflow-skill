# HeartFlow Collective Intentionality Enhanced v5.0

## 集体意向性深度整合模块

### 理论来源
**Stanford Encyclopedia of Philosophy - Collective Intentionality**  
https://plato.stanford.edu/entries/collective-intentionality/

---

## 📚 理论背景

### We-Intention (Searle)

**核心观点**: 集体意向不可还原为个体意向之和。

**Searle (1990, 1995)**:
- "我们意图做 X" ≠ "我意图做我的部分" + "你意图做你的部分"
- We-Intention 是原初的心理状态
- 即使没有明确的共同承诺，We-Intention 仍可存在

**关键特征**:
1. **不可还原性**: 集体意向不能分解为个体意向
2. **个体持有**: We-Intention 由个体持有，但内容是集体的
3. **共同目标**: 指向共同行动或状态

---

### 联合承诺 (Gilbert)

**核心观点**: 共同承诺形成"plural subject"。

**Gilbert (1990)**:
- 联合承诺需要相互表达承诺意愿
- 形成"我们"作为行动主体
- 产生规范性期待：可以正当地期待他人履行

**关键特征**:
1. **相互性**: 各方都承诺于共同目标
2. **规范性**: 承诺产生义务和期待
3. **共同主体性**: "我们"成为行动的主体

---

### 共享意向性 (Bratman, Tomasello)

**Bratman (1999)**:
- 共享意向 = 相互响应的子计划系统
- 不需要原初的 We-Intention
- 通过相互协调和承诺实现共享

**Tomasello (2009)**:
- 共享意向性是人类独有的能力
- 发展于早期婴儿 - 照顾者互动
- 是合作、语言、文化的基础

---

## 🎯 模块功能

### 核心功能

1. **We-Intention 检测器**
   - 检测语言标记 ("我们"、"一起"、"共同")
   - 分析意向结构 (共享/相互依赖/并行)
   - 评估共同目标和相互依赖性
   - 识别 We-Intention 类型 (Searle/Gilbert/Bratman)

2. **联合承诺评估**
   - 检测联合承诺的存在
   - 评估承诺强度
   - 识别承诺类型

3. **集体情绪识别**
   - 识别共享情绪体验
   - 评估集体情绪强度
   - 分析情绪与集体意向的关系

4. **信任框架分析**
   - 评估信任水平
   - 识别信任类型
   - 分析信任与集体意向的关系

5. **整合分析**
   - 计算集体强度
   - 评估凝聚力
   - 识别集体模式

---

## 💻 使用示例

```javascript
const CollectiveIntentionalityEnhanced = require('./collective-intentionality-enhanced-v5');

const assessor = new CollectiveIntentionalityEnhanced();

// 评估集体意向性
const result = assessor.assessCollectiveIntentionality({
  situation: '我们计划一起完成这个项目，每个人都承诺贡献自己的力量',
  participants: [
    { name: 'A', role: 'leader' },
    { name: 'B', role: 'developer' },
    { name: 'C', role: 'designer' }
  ],
  individualIntentions: [
    { agent: 'A', goal: '完成项目', condition: 'B 和 C 也承诺' },
    { agent: 'B', goal: '完成项目', condition: 'A 和 C 也参与' },
    { agent: 'C', goal: '完成项目', condition: 'A 和 B 也参与' }
  ],
  sharedExperience: '团队感到兴奋和期待'
});

console.log(result);
```

---

## 📊 评估指标

| 指标 | 说明 | 取值范围 |
|------|------|----------|
| We-Intention 强度 | 集体意向的强度 | 0-1 |
| 联合承诺强度 | 共同承诺的强度 | 0-1 |
| 相互依赖性 | 个体行动的相互依赖程度 | low/moderate/high |
| 集体强度 | 整体集体性强度 | 0-1 |
| 凝聚力 | 集体凝聚力 | 0-1 |

---

## 🧠 集体模式

| 模式 | 特征 | 干预方向 |
|------|------|----------|
| **强集体性** | We-Intention 强 + 联合承诺强 | 维持和深化 |
| **中等集体性** | 有一定集体性 | 加强共同目标和承诺 |
| **个体主导** | 个体意向为主 | 从基础建设集体性 |

---

## 🔗 相关模块

- `collective-emotion-enhanced/`: 集体情绪增强
- `social-identity-enhanced/`: 社会认同增强
- `relational-self-enhanced/`: 关系性自我增强

---

## 📖 延伸阅读

1. SEP Entry: Collective Intentionality
2. Searle, J. (1990). Collective Intentions and Actions.
3. Gilbert, M. (1990). Walking Together: A Paradigmatic Social Phenomenon.
4. Bratman, M. (1999). Faces of Intention: Selected Essays on Intention and Agency.
5. Tomasello, M. (2009). Why We Cooperate.
