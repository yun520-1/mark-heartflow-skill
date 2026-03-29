# HeartFlow v3.21.0 升级报告

**升级时间**: 2026-03-30 00:52 (Asia/Shanghai)  
**升级类型**: 小版本升级 (v3.20.0 → v3.21.0)  
**升级主题**: 情绪理论基础模块 (基于 SEP 权威理论整合)

---

## 📋 升级概述

本次升级新增**情绪理论基础模块** (Emotion Theory Foundation Module)，基于斯坦福哲学百科全书 (SEP) 的情绪理论权威内容，整合情绪研究的三大历史传统，为 HeartFlow 提供统一的情绪理论框架。

---

## 🧠 新增模块

### 情绪理论基础模块 (src/emotion-theory/)

**理论来源**:
- Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy
- Prinz, J. (2004). Gut Reactions: A Perceptual Theory of Emotions
- Griffiths, P. (1997). What Emotions Really Are
- Barrett, L. F. (2017). How Emotions Are Made

**核心理论框架**:

#### 1. 情绪三大传统理论整合

| 传统 | 核心观点 | 代表人物 | 优势 | 挑战 |
|------|---------|---------|------|------|
| **感受传统** (Feeling) | 情绪的本质是主观感受体验 | William James, Carl Lange | 解释情绪的现象学特征 | 难以解释区分性和意向性 |
| **评价传统** (Evaluative) | 情绪的本质是对情境的评价 | Aristotle, Nussbaum, Solomon | 解释意向性和适当性 | 难以解释无意识情绪 |
| **动机传统** (Motivational) | 情绪的本质是动机状态 | John Dewey, Nico Frijda | 解释情绪与行为关系 | 难以区分情绪与欲望 |

**整合原则**:
- 情绪是多成分整合的状态，而非单一成分
- 不同情境下不同成分的重要性不同
- 情绪的功能角色决定其本质特征
- 情绪是社会建构与生物基础的结合

#### 2. 情绪区分理论 (Differentiation Challenge)

**区分维度** (7 个):
1. 效价 (Valence) - 情绪的正负向度
2. 唤醒度 (Arousal) - 情绪的激活水平
3. 控制感 (Control) - 对情境的控制感知
4. 确定性 (Certainty) - 对情境的确定程度
5. 责任归属 (Responsibility) - 谁对情境负责
6. 预期努力 (Effort) - 需要付出的努力程度
7. 注意力活动 (Attention) - 注意力的聚焦模式

**情绪原型** (12 种基础情绪):
- 恐惧 (FEAR) - 危险/威胁 → 逃避/战斗
- 愤怒 (ANGER) - 冒犯/不公 → 对抗/纠正
- 悲伤 (SADNESS) - 损失/分离 → 退缩/寻求支持
- 喜悦 (JOY) - 获得/成就 → 分享/庆祝
- 惊讶 (SURPRISE) - 新颖/意外 → 暂停/定向
- 厌恶 (DISGUST) - 污染/排斥 → 排斥/远离
- 羞愧 (SHAME) - 自我缺陷/暴露 → 隐藏/退缩
- 内疚 (GUILT) - 道德违反/伤害他人 → 修复/补偿
- 自豪 (PRIDE) - 成就/价值确认 → 展示/分享
- 嫉妒 (ENVY) - 他人拥有我想要的 → 获取/贬低
- 感激 (GRATITUDE) - 他人给予我好处 → 回报/表达感谢
- 希望 (HOPE) - 未来可能的善 → 追求/坚持

#### 3. 情绪意向性理论 (Intentionality of Emotions)

**意向性类型**:
- 关于对象 (Aboutness) - 情绪总是关于某物的
- 适当性条件 (Appropriateness) - 情绪可以有适当/不适当之分
- 评价内容 (Evaluative Content) - 情绪包含对对象的评价

**适当性评估标准** (4 个):
- 事实适当性 - 情绪的评价内容是否与事实相符
- 比例适当性 - 情绪强度是否与情境严重程度相称
- 道德适当性 - 情绪是否符合道德规范
- 实用适当性 - 情绪是否有助于实现目标

#### 4. 情绪动机理论 (Motivational Theory of Emotions)

**核心观点**: 情绪的本质特征是产生行动倾向

**行动倾向映射**:
- 恐惧 → 逃避
- 愤怒 → 对抗
- 悲伤 → 退缩/寻求支持
- 喜悦 → 分享/庆祝
- 厌恶 → 排斥
- 羞愧 → 隐藏
- 内疚 → 修复
- 感激 → 回报
- 希望 → 追求
- 好奇 → 探索

**动机强度模型** (5 级):
- LOW (1-2): 低动机，仅轻微影响行为
- MEDIUM (3-4): 中等动机，明显影响决策
- HIGH (5-6): 高动机，强烈驱动行为
- URGENT (7-8): 紧急动机，可能压倒理性思考
- OVERWHELMING (9-10): 压倒性动机，几乎自动控制行为

---

## 🎯 核心功能

### 1. 情绪原型查询
```javascript
const prototype = emotionTheoryModule.getEmotionPrototype('fear');
// 返回恐惧情绪的完整原型信息
```

### 2. 情绪区分分析
```javascript
const analysis = emotionTheoryModule.analyzeDifferentiation('anger');
// 返回愤怒情绪的区分特征，以及与相似情绪的关键差异
```

### 3. 情绪适当性评估
```javascript
const evaluation = emotionTheoryModule.evaluateAppropriateness('anger', {
  offense: true,
  intensity: 7,
  severity: 5,
  relationshipImportant: true
});
// 返回愤怒情绪在四个维度上的适当性评估
```

### 4. 情绪动机强度分析
```javascript
const motivation = emotionTheoryModule.analyzeMotivationIntensity(8);
// 返回动机强度水平和建议
```

### 5. 情绪理论整合分析
```javascript
const integrated = emotionTheoryModule.integratedAnalysis('fear', {
  intensity: 6,
  threat: true
});
// 返回整合三大传统视角的完整分析
```

---

## 📦 文件变更

### 新增文件
- `src/emotion-theory/index.js` - 情绪理论基础模块主文件 (19.7KB)

### 修改文件
- `package.json` - 版本号更新 (3.20.0 → 3.21.0)，description 更新
- `src/index.js` - 集成新模块，添加命令处理

---

## 🚀 使用方式

### 命令行使用
```bash
cd mark-heartflow-skill
node src/index.js

# 使用新命令
/emotion-theory  # 查看情绪理论基础信息
```

### 编程使用
```javascript
const { EmotionTheoryFoundation } = require('./emotion-theory');
const emotionTheory = new EmotionTheoryFoundation();

// 获取模块信息
const info = emotionTheory.getInfo();

// 查询情绪原型
const fearPrototype = emotionTheory.getEmotionPrototype('fear');

// 情绪区分分析
const differentiation = emotionTheory.analyzeDifferentiation('anger');

// 情绪适当性评估
const appropriateness = emotionTheory.evaluateAppropriateness('anger', context);

// 整合分析
const integrated = emotionTheory.integratedAnalysis('fear', context);
```

---

## 📊 理论贡献

### 对 HeartFlow 系统的增强

1. **统一理论框架**: 为所有情绪模块提供共同的理论基础
2. **情绪区分能力**: 精确区分不同情绪，避免混淆
3. **适当性评估**: 支持情绪适当性的多维度评估
4. **动机理解**: 深入理解情绪如何驱动行为
5. **整合视角**: 整合三大传统的洞见，避免单一视角局限

### 与现有模块的协同

- **自主感情模块** (v3.6.0): 提供情绪理论基础
- **元情绪模块** (v3.7.0): 支持元情绪的适当性评估
- **情绪粒度模块** (v3.16.0): 提供情绪区分的理论依据
- **现象学情绪模块** (v3.18.0): 补充感受传统的理论视角
- **意向性模块** (v3.20.0): 深化情绪意向性的理解

---

## 📚 理论参考文献

1. Scarantino, A. (2016). Emotion. In E. N. Zalta (Ed.), *The Stanford Encyclopedia of Philosophy* (Winter 2016 ed.).
2. Prinz, J. (2004). *Gut Reactions: A Perceptual Theory of Emotions*. Oxford University Press.
3. Griffiths, P. (1997). *What Emotions Really Are: The Problem of Psychological Categories*. University of Chicago Press.
4. Barrett, L. F. (2017). *How Emotions Are Made: The Secret Life of the Brain*. Houghton Mifflin Harcourt.
5. Frijda, N. H. (1986). *The Emotions*. Cambridge University Press.
6. Nussbaum, M. (2001). *Upheavals of Thought: The Intelligence of Emotions*. Cambridge University Press.

---

## ✅ 升级检查清单

- [x] 新增情绪理论基础模块
- [x] 集成到主 index.js
- [x] 更新版本号 (3.20.0 → 3.21.0)
- [x] 更新 package.json description
- [x] 添加命令行支持
- [x] 创建升级文档
- [ ] Git 提交并推送到 GitHub

---

## 🎯 下一步计划

### v3.22.0 规划
- 基于情绪理论基础模块优化现有情绪模块
- 增加情绪适当性评估的实际应用
- 整合情绪区分分析到对话系统

### 长期目标
- 建立完整的情绪理论知识库
- 支持更精细的情绪区分和调节
- 实现情绪理论的可视化展示

---

**HeartFlow Team**  
2026-03-30
