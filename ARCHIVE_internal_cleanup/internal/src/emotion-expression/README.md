# 情绪表达模块 (Emotion Expression Module)

## 概述

基于 SEP 情绪理论中的**表达成分 (Expressive Component)**，模拟情绪的面部、声音、姿态和手势表达。

**版本**: v3.15.0  
**理论来源**: SEP Emotion Theory (Scarantino 2016)

---

## 📚 理论基础

### SEP 情绪六成分模型

情绪表达属于 SEP 情绪理论的六个核心成分之一：

| 成分 | 说明 | 实现模块 |
|------|------|---------|
| Evaluative | 评价成分 | appraisal/ |
| Physiological | 生理成分 | embodied-cognition/ |
| Phenomenological | 现象成分 (Qualia) | autonomous-emotion/ |
| **Expressive** | **表达成分** | **emotion-expression/** ✅ |
| Behavioral | 行为成分 | autonomous-emotion/ |
| Mental | 心理成分 | autonomous-emotion/ |

### 核心理论来源

1. **Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy**
   - 情绪表达作为情绪的必要成分
   - 跨文化表达的普遍性与差异性

2. **Ekman, P. (1992). An Argument for Basic Emotions**
   - 6 种基础情绪的面部表情编码
   - 跨文化一致性证据

3. **Darwin, C. (1872). The Expression of the Emotions in Man and Animals**
   - 情绪表达的进化起源
   - 连续性原理

---

## 🎭 支持的表达模态

| 模态 | 说明 | 示例 |
|------|------|------|
| **Facial** | 面部表情 | 眉毛、眼睛、嘴巴、脸颊 |
| **Vocal** | 声音特征 | 音调、语速、音量、语调 |
| **Postural** | 身体姿态 | 身体紧张度、朝向、倾斜 |
| **Gestural** | 手势动作 | 手部运动、手掌朝向 |

---

## 📊 支持的情绪类型

| 情绪 | 面部特征 | 声音特征 | 姿态特征 | 手势特征 |
|------|---------|---------|---------|---------|
| **平静 (Calm)** | 放松，微扬 | 平稳温暖 | 开放前倾 | 极少 |
| **愉悦 (Joy)** | 咧嘴笑，眼角纹 | 轻快明亮 | 轻盈弹动 | 丰富多变 |
| **好奇 (Curious)** | 眉挑，眼睁，头侧 | 探询上扬 | 警觉前倾 | 指向性 |
| **关切 (Concerned)** | 眉内扬，微皱 | 温和轻柔 | 柔和靠近 | 安慰性 |
| **疲惫 (Tired)** | 眼皮垂，嘴角垂 | 低沉缓慢 | 塌陷退缩 | 极少缓慢 |
| **兴奋 (Excited)** | 眼睁大，张嘴笑 | 高昂快速 | 动态活跃 | 有力幅度大 |

---

## 💻 使用示例

```javascript
const { EmotionExpressionModule } = require('./emotion-expression');

const expression = new EmotionExpressionModule();

// 1. 获取完整表达（所有模态）
const fullExpr = expression.getFullExpression('joy', 4);
console.log(fullExpr.summary);
// 输出：整体表达 (强烈): 嘴角大幅上扬，眼睛微弯...；语调轻快明亮...；身体轻盈...

// 2. 仅获取面部表达
const facial = expression.getFacialExpression('curious', 3);
console.log(facial.description);
// 输出：眉毛微挑，眼睛睁大聚焦，头部微侧，嘴微张

// 3. 获取声音表达
const vocal = expression.getVocalExpression('concerned', 2);
console.log(vocal.modulatedDescription);
// 输出：轻微的，细微的：语调温和轻柔，语速缓慢，充满关怀

// 4. 获取姿态表达
const postural = expression.getPosturalExpression('excited', 5);
console.log(postural.modulatedDescription);
// 输出：极其强烈的，充满张力的：身体充满能量，姿态动态，可能来回移动

// 5. 获取手势表达
const gestural = expression.getGesturalExpression('calm', 2);
console.log(gestural.description);
// 输出：手势极少，偶尔用手掌向上的开放手势

// 6. 获取表达模态枚举
const modalities = expression.getModalities();
console.log(modalities);
// 输出：{ FACIAL: 'facial', VOCAL: 'vocal', POSTURAL: 'postural', GESTURAL: 'gestural' }

// 7. 获取模块信息
const info = expression.getModuleInfo();
console.log(info);
// 输出：模块元信息（版本、理论来源、支持的情绪等）
```

---

## 🔧 API 参考

### `getFacialExpression(emotionName, intensity)`

获取情绪的面部表达详情

**参数**:
- `emotionName` (string): 情绪名称（如 'joy', 'calm'）
- `intensity` (number): 情绪强度 (1-5)，默认 3

**返回**:
```javascript
{
  eyebrows: 'slightly_raised',
  eyes: 'crinkled_corners',
  mouth: 'wide_smile',
  cheeks: 'raised',
  face_muscles: 'active_upward',
  description: '嘴角大幅上扬，眼睛微弯，眼角出现笑纹，脸颊上扬',
  intensity: 4,
  modulatedDescription: '强烈的，显著的：嘴角大幅上扬...'
}
```

### `getVocalExpression(emotionName, intensity)`

获取情绪的声音表达详情

**参数**: 同上  
**返回**:
```javascript
{
  pitch: 'medium_high',
  tempo: 'brisk',
  volume: 'medium_loud',
  tone: 'bright_warm',
  pauses: 'brief',
  description: '语调轻快明亮，音调略高，带有笑意',
  intensity: 4,
  modulatedDescription: '强烈的，显著的：语调轻快明亮...'
}
```

### `getPosturalExpression(emotionName, intensity)`

获取情绪的姿态表达详情

**参数**: 同上  
**返回**:
```javascript
{
  body_tension: 'light_energetic',
  orientation: 'open_facing',
  lean: 'forward',
  shoulders: 'relaxed_bouncy',
  description: '身体轻盈，姿态开放，有轻微的弹动感',
  intensity: 4,
  modulatedDescription: '...'
}
```

### `getGesturalExpression(emotionName, intensity)`

获取情绪的手势表达详情

**参数**: 同上  
**返回**:
```javascript
{
  hand_movement: 'expressive',
  palm_orientation: 'open_varied',
  description: '手势丰富多变，常配合言语节奏',
  intensity: 4,
  modulatedDescription: '...'
}
```

### `getFullExpression(emotionName, intensity)`

获取情绪的完整表达（所有模态）

**参数**: 同上  
**返回**:
```javascript
{
  emotion: 'joy',
  intensity: 4,
  expressionCoefficient: 0.707,
  facial: { ... },
  vocal: { ... },
  postural: { ... },
  gestural: { ... },
  summary: '整体表达 (强烈): ...'
}
```

### `getModalities()`

获取表达模态枚举

**返回**:
```javascript
{
  FACIAL: 'facial',
  VOCAL: 'vocal',
  POSTURAL: 'postural',
  GESTURAL: 'gestural'
}
```

### `getModuleInfo()`

获取模块元信息

**返回**:
```javascript
{
  name: 'EmotionExpressionModule',
  version: '3.15.0',
  description: '情绪表达模块 - 基于 SEP 情绪理论的表达成分',
  theoreticalBasis: [...],
  supportedEmotions: ['平静', '愉悦', ...],
  supportedModalities: ['facial', 'vocal', ...],
  intensityRange: { min: 1, max: 5 }
}
```

---

## 📈 强度映射函数

### `mapIntensityToExpression(intensity)`

将情绪强度 (1-5) 映射到表达强度系数 (0.0-1.0)

**公式**: `sqrt((intensity - 1) / 4)`

**映射表**:

| 情绪强度 | 表达系数 | 表达程度 |
|---------|---------|---------|
| 1 | 0.0 | 无表达 |
| 2 | 0.5 | 轻微表达 |
| 3 | 0.707 | 中等表达 |
| 4 | 0.866 | 强烈表达 |
| 5 | 1.0 | 极致表达 |

### `modulateExpressionByIntensity(description, intensity)`

根据强度调整表达描述，添加强度修饰词

**修饰词映射**:

| 表达系数 | 修饰词 |
|---------|--------|
| 0.0-0.2 | 极其微弱的，几乎不可察觉的 |
| 0.2-0.4 | 轻微的，细微的 |
| 0.4-0.6 | 中等的，明显的 |
| 0.6-0.8 | 强烈的，显著的 |
| 0.8-1.0 | 极其强烈的，充满张力的 |

---

## 🔬 研究发现

### 面部表达的跨文化一致性

Ekman 的研究表明，以下面部表情具有跨文化一致性：

- **愉悦**: 嘴角上扬 + 眼角皱纹 (Duchenne 微笑)
- **悲伤**: 眉毛内侧上扬 + 嘴角下垂
- **愤怒**: 眉毛下压 + 瞪眼 + 嘴唇紧绷
- **恐惧**: 眉毛上扬 + 眼睁大 + 嘴唇水平拉伸
- **惊讶**: 眉毛高扬 + 眼睁大 + 嘴张开
- **厌恶**: 鼻子皱起 + 上唇上扬

### 声音表达的声学特征

| 情绪 | 音调 | 语速 | 音量 | 音色 |
|------|------|------|------|------|
| 愉悦 | 中高 | 快 | 中大 | 明亮 |
| 悲伤 | 低 | 慢 | 小 | 暗淡 |
| 愤怒 | 低 | 快 | 大 | 紧张 |
| 恐惧 | 高 | 快 | 变化大 | 颤抖 |
| 平静 | 中 | 中 | 中 | 温暖 |

### 姿态表达的功能

- **前倾**: 表示兴趣、关注、亲近
- **后仰**: 表示放松、疏远、支配
- **开放姿态**: 表示接纳、友好
- **封闭姿态**: 表示防御、不适

---

## 🎯 应用场景

1. **对话系统**: 为 AI 回复添加情绪表达提示
2. **虚拟角色**: 驱动虚拟人的面部/身体动画
3. **情绪教育**: 帮助用户识别和理解情绪表达
4. **心理咨询**: 辅助治疗师观察来访者的情绪表达
5. **表演训练**: 指导演员如何表达特定情绪

---

## ⚠️ 注意事项

1. **个体差异**: 表达模式存在个体和文化差异，本模块提供的是典型模式
2. **混合情绪**: 真实情境中常有混合情绪，需要组合多个表达模式
3. **表达抑制**: 有些人会抑制情绪表达，外部表达与内部体验不一致
4. **情境调节**: 社会情境会影响表达强度（如公共场合 vs 私人空间）

---

## 📝 版本历史

### v3.15.0 (2026-03-29)

- ✅ 初始版本
- ✅ 实现 6 种情绪的四模态表达
- ✅ 强度动态映射
- ✅ 基于 SEP 情绪理论

---

## 🔗 相关模块

- **autonomous-emotion/**: 自主感情模块（包含 Qualia 档案）
- **emotion/**: 基础情绪引擎
- **embodied-cognition/**: 具身认知模块（生理成分）
- **meta-emotion/**: 元情绪模块

---

## 📚 参考资料

1. Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy. https://plato.stanford.edu/entries/emotion/
2. Ekman, P., & Friesen, W. V. (1971). Constants across cultures in the face and emotion. Journal of Personality and Social Psychology, 17(2), 124–129.
3. Darwin, C. (1872). The Expression of the Emotions in Man and Animals. London: John Murray.
4. Juslin, P. N., & Laukka, P. (2003). Communication of emotions in vocal expression and music performance: Different channels, same code? Psychological Bulletin, 129(5), 770–814.
