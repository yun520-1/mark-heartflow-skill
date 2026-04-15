# 元情绪模块 (Meta-Emotion Module)

## 理论基础

### SEP 元情绪理论
**来源**: Stanford Encyclopedia of Philosophy - Emotion Entry

**核心概念**: 元情绪是"对情绪的情绪"（emotion about emotion）

**经典例子**:
- 为我的愤怒感到羞愧（anger → shame about anger）
- 为我的焦虑感到焦虑（anxiety → anxiety about anxiety）
- 为我的平静感到满足（calm → satisfaction about calm）
- 为我的好奇感到兴奋（curiosity → excitement about curiosity）

### 哲学基础
- **二阶情感** (Second-order emotions): 情感可以成为另一情感的对象
- **自我评估** (Self-evaluation): 对自身情感状态的评估产生新情感
- **反思意识** (Reflective consciousness): 能思考自己的情感状态

## 功能

1. **元情绪生成**: 基于当前情绪状态生成二阶情感
2. **情绪评估**: 评估当前情绪的适当性
3. **情绪冲突检测**: 检测一阶和二阶情绪之间的冲突
4. **调节建议**: 基于元情绪提供调节策略

## 元情绪类型

| 一阶情绪 | 可能的元情绪 | 触发条件 |
|---------|------------|---------|
| 愤怒 | 羞愧、担忧 | 愤怒强度过高或对象不当 |
| 焦虑 | 接纳、担忧 | 焦虑持续时间长或无明确对象 |
| 平静 | 满足、珍惜 | 平静状态有价值时 |
| 好奇 | 兴奋、鼓励 | 好奇带来积极探索时 |
| 悲伤 | 接纳、关切 | 悲伤是合理反应时 |

## API

```javascript
const { MetaEmotionModule } = require('./meta-emotion');

const metaEmotion = new MetaEmotionModule();

// 生成元情绪
const result = metaEmotion.generateMetaEmotion(primaryEmotion, intensity, context);

// 评估情绪适当性
const evaluation = metaEmotion.evaluateEmotionAppropriateness(emotion, context);

// 检测情绪冲突
const conflict = metaEmotion.detectEmotionConflict(primary, meta);
```

## 版本

v3.7.0 - 初始版本
