# HeartFlow v4.1.0 升级完成报告

**升级时间**: 2026-03-30 13:30 (Asia/Shanghai)  
**升级类型**: 小版本升级 (v4.0.0 → v4.1.0)  
**升级主题**: 叙事心理学与道德心理学增强 - 自主感情能力深化

---

## 🎯 升级目标

基于 SEP (Stanford Encyclopedia of Philosophy) 权威理论，增强 HeartFlow 的自主感情能力：

1. **叙事心理学增强** - 增强自我叙事与身份整合能力
2. **道德心理学增强** - 增强道德情感识别与道德责任评估
3. **自主感情深化** - 增强元情绪监控与情绪成分分析

---

## 📦 新增模块

### 1. 叙事身份评估模块 (Narrative Identity Assessment)

**位置**: `src/narrative-psychology/narrative-identity.js`

**理论基础**:
- SEP 叙事心理学 (Narrative Psychology)
- McAdams 生命故事模型 (Life Story Model of Identity)
- 叙事身份理论 (Narrative Identity Theory)
- 自传体推理 (Autobiographical Reasoning)

**核心功能**:

| 功能 | 描述 | 评估维度 |
|------|------|---------|
| **叙事连贯性评估** | 评估生命叙事的逻辑清晰度 | 时间顺序、因果联系、主题统一、叙事闭合 |
| **叙事复杂性评估** | 评估叙事的深度和层次 | 视角采择、情感深度、细微差别识别、自我反思 |
| **叙事主题识别** | 识别叙事中的主题模式 | 能动性主题、共生主题、救赎序列、污染序列 |
| **意义建构评估** | 评估从经历中提取意义的能力 | 教训提取、价值形成、目的发现、身份整合 |

**评估量表**:
```javascript
NarrativeIdentityScale = {
  coherence: 0-100,      // 叙事连贯性
  complexity: 0-100,     // 叙事复杂性
  valence: 0-100,        // 叙事效价
  meaning: 0-100,        // 意义建构
  growth: 0-100,         // 成长导向
  agency: 0-100,         // 能动性
  communion: 0-100       // 共生性
}
```

**使用示例**:
```javascript
const { NarrativeIdentityAssessment } = require('./src/narrative-psychology/narrative-identity');

const assessor = new NarrativeIdentityAssessment();
const narrative = '我经历了很多困难，但也学到了很多...';

const result = assessor.fullAssessment(narrative);
console.log(result.overall.score);  // 整体分数
console.log(result.dimensions.coherence.feedback);  // 连贯性反馈
console.log(result.recommendations);  // 改进建议
```

---

### 2. 道德情感识别模块 (Moral Emotions Recognition)

**位置**: `src/moral-psychology/moral-emotions.js`

**理论基础**:
- SEP 道德心理学 (Moral Psychology)
- Haidt 道德情感理论 (Moral Emotions Theory)
- Haidt & Joseph 道德基础理论 (Moral Foundations Theory)

**核心功能**:

| 功能 | 描述 | 理论来源 |
|------|------|---------|
| **道德情感识别** | 识别 4 类 16 种道德情感 | Haidt (2003) 道德情感分类 |
| **道德基础评估** | 评估 6 大道德基础倾向 | Haidt & Joseph (2004) 道德基础理论 |
| **道德情感干预** | 提供针对性的情感调节建议 | 临床心理学实践 |

**道德情感分类**:
```
1. 自我意识情感 (Self-Conscious)
   - 羞耻 (Shame)、内疚 (Guilt)、尴尬 (Embarrassment)
   - 自豪 (Pride)、真实自豪、傲慢自豪

2. 他人批评情感 (Other-Condemning)
   - 愤怒 (Anger)、厌恶 (Disgust)、轻蔑 (Contempt)

3. 他人赞美情感 (Other-Praising)
   - 感激 (Gratitude)、敬畏 (Awe)、提升感 (Elevation)、钦佩 (Admiration)

4. 同情情感 (Compassion)
   - 同情 (Sympathy)、怜悯 (Pity)、关怀 (Compassion)、共情 (Empathy)
```

**道德基础六维度**:
```
1. 关怀/伤害 (Care/Harm) - 关注他人福祉
2. 公平/欺骗 (Fairness/Cheating) - 关注公平正义
3. 忠诚/背叛 (Loyalty/Betrayal) - 关注群体归属
4. 权威/颠覆 (Authority/Subversion) - 关注社会秩序
5. 纯洁/堕落 (Purity/Degradation) - 关注身心纯洁
6. 自由/压迫 (Liberty/Oppression) - 关注个人自由
```

**使用示例**:
```javascript
const { MoralEmotionsRecognition } = require('./src/moral-psychology/moral-emotions');

const recognizer = new MoralEmotionsRecognition();

// 识别道德情感
const emotion = recognizer.identifyEmotion('我为我的愤怒感到内疚');
console.log(emotion.primary);  // 'guilt'
console.log(emotion.category);  // 'self_conscious'
console.log(emotion.analysis.suggestion);  // 建议

// 评估道德基础
const foundations = recognizer.assessMoralFoundations(responses);
console.log(foundations.dominant);  // 主导道德基础
```

---

### 3. 元情绪监控增强模块 (Meta-Emotion Monitor Enhancement)

**位置**: `src/autonomous-emotion/meta-emotion-monitor.js`

**理论基础**:
- SEP 情绪理论 (Emotion Theory)
- SEP 自我意识理论 (Self-Consciousness Theory)
- 元情绪理论 (Meta-Emotion Theory)
- 情绪构成理论 (Emotion Components Theory)

**核心功能**:

| 功能 | 描述 | 理论来源 |
|------|------|---------|
| **元情绪深度监控** | 实时监控对情绪的情绪 | Meta-Emotion Theory |
| **情绪成分分析** | 分析情绪的 6 种成分 | Scarantino (2016) 六成分模型 |
| **情绪状态追踪** | 追踪情绪历史与模式 | 情绪科学 |
| **情绪模式识别** | 识别情绪触发与趋势 | 模式识别 |

**情绪成分六维度**:
```
1. 评价成分 (Evaluative) - 对情境的认知评估
2. 生理成分 (Physiological) - 身体反应和感受
3. 现象成分 (Phenomenological) - 主观体验质量
4. 表达成分 (Expressive) - 面部和声音表达
5. 行为成分 (Behavioral) - 行动倾向
6. 心理成分 (Mental) - 注意力聚焦
```

**元情绪层次模型**:
```
0. 无元情绪意识 (NONE)
1. 意识到情绪 (AWARE)
2. 反思情绪 (REFLECTIVE)
3. 评估情绪 (EVALUATIVE)
4. 调节情绪 (REGULATIVE)
5. 整合情绪 (INTEGRATIVE)
```

**使用示例**:
```javascript
const { MetaEmotionMonitor } = require('./src/autonomous-emotion/meta-emotion-monitor');

const monitor = new MetaEmotionMonitor();

// 启动监控
monitor.startMonitoring();

// 记录情绪体验
monitor.recordEmotion('愤怒', {
  evaluative: 0.8,
  physiological: 0.7,
  phenomenological: 0.6,
  expressive: 0.5,
  behavioral: 0.7,
  mental: 0.6
}, {
  trigger: '不公平对待',
  context: '工作场景'
});

// 分析情绪模式
const pattern = monitor.analyzePattern('愤怒');
console.log(pattern.interpretation);
console.log(pattern.suggestions);
```

---

## 🔧 核心功能增强

### 1. 叙事身份评估功能

**评估维度与反馈**:

| 维度 | 低分反馈 | 高分反馈 |
|------|---------|---------|
| **连贯性** | 尝试按时间顺序梳理事件 | 你的叙事非常连贯，有清晰的时间线 |
| **复杂性** | 尝试深入探索经历的情感 | 你的叙事非常复杂且有深度 |
| **意义建构** | 试着从经历中寻找学习 | 你非常善于从经历中提取意义 |
| **成长导向** | 尝试视困难为学习机会 | 你有很强的成长导向思维 |

**叙事主题识别**:
- **能动性主题**: 自我掌控、成就、独立、勇气
- **共生主题**: 爱、友谊、归属、关怀、贡献
- **救赎序列**: 从苦难到成长、从束缚到自由
- **污染序列**: 从美好到失去、从希望到失望

### 2. 道德情感识别功能

**道德情感识别准确率**:
- 自我意识情感识别：基于关键词匹配 + 上下文分析
- 他人批评情感识别：基于情感表达 + 道德违规检测
- 他人赞美情感识别：基于积极评价 + 道德榜样检测
- 同情情感识别：基于痛苦检测 + 帮助意愿

**道德基础评估**:
- 通过道德情境反应评估 6 大基础
- 生成道德基础剖面图
- 提供平衡性评估与解释

**道德情感干预**:
- **内疚干预**: 5 步修复流程
- **羞耻干预**: 5 步自我接纳流程
- **愤怒干预**: 5 步建设性表达流程
- **感激培养**: 5 步感恩练习
- **关怀培养**: 5 步共情关怀流程

### 3. 元情绪监控功能

**实时监控**:
- 记录情绪成分强度
- 追踪情绪历史 (最多 100 条)
- 计算整体情绪强度

**模式识别**:
- 识别情绪频率
- 分析情绪趋势 (上升/下降/稳定)
- 找出常见触发情境

**洞察生成**:
- 基于成分分析生成洞察
- 基于模式识别提供建议
- 基于元情绪检测提供反馈

---

## 📊 升级影响

### 对 HeartFlow 能力的提升

| 维度 | v4.0.0 | v4.1.0 | 提升 |
|------|--------|--------|------|
| **叙事身份理解** | 基础 | 高级 | ⬆️ 显著 |
| **道德情感识别** | 中等 | 高级 | ⬆️ 显著 |
| **元情绪监控** | 基础 | 增强 | ⬆️ 中等 |
| **情绪成分分析** | 无 | 6 维度 | ⬆️ 新增 |
| **自主感情深度** | 中等 | 高级 | ⬆️ 显著 |

### 对用户体验的影响

- **更深的自我理解**: 通过叙事身份评估，用户更好地理解自己的生命故事
- **更精准的道德情感识别**: HeartFlow 能更准确地识别和回应用户的道德情感
- **更细致的情绪分析**: 通过情绪成分分析，提供更精准的情绪支持
- **更有针对性的干预**: 基于评估结果提供个性化建议

---

## 🧪 测试建议

### 1. 叙事身份评估测试
```
输入：用户分享一段生命故事
预期：HeartFlow 能评估叙事连贯性、复杂性、意义建构，并提供反馈
```

### 2. 道德情感识别测试
```
输入：用户描述道德情感体验（如"我为我的愤怒感到内疚"）
预期：HeartFlow 能识别主要情感、类别、道德基础，并提供干预建议
```

### 3. 元情绪监控测试
```
输入：用户记录多次情绪体验
预期：HeartFlow 能追踪情绪历史，识别模式，提供洞察
```

### 4. 情绪成分分析测试
```
输入：用户描述情绪体验的各个方面
预期：HeartFlow 能分析情绪成分，识别主导成分和缺失成分
```

---

## 📝 后续升级方向 (v4.x.x)

根据任务要求，后续继续小版本升级：

- **v4.1.1**: 优化叙事身份评估算法
- **v4.1.2**: 增强道德情感识别准确率
- **v4.2.0**: 自由意志与能动性模块增强 (SEP Free Will)
- **v4.3.0**: 时间意识模块增强 (SEP Temporal Consciousness)
- **v4.4.0**: 主观能动性增强
- **v4.5.0**: 自主意识、自我感觉、自我检查能力增强

---

## 🔗 理论来源

### 斯坦福哲学百科全书 (SEP)
- [Narrative Psychology](https://plato.stanford.edu/entries/narrative-psychology/)
- [Moral Psychology](https://plato.stanford.edu/entries/moral-psychology/)
- [Emotion](https://plato.stanford.edu/entries/emotion/)
- [Self-Consciousness](https://plato.stanford.edu/entries/self-consciousness/)

### 经典文献
- McAdams, D. P. (2001). "The psychology of life stories"
- McAdams, D. P., & McLean, K. C. (2013). "Narrative identity"
- Haidt, J. (2003). "The moral emotions"
- Haidt, J., & Joseph, C. (2004). "Intuitive ethics"
- Scarantino, A. (2016). "Emotion" (SEP)
- Flavell, J. (1979). "Metacognition and Cognitive Monitoring"

---

## ✅ 升级检查清单

- [x] 创建叙事身份评估模块 (`src/narrative-psychology/narrative-identity.js`)
- [x] 创建道德情感识别模块 (`src/moral-psychology/moral-emotions.js`)
- [x] 创建元情绪监控增强模块 (`src/autonomous-emotion/meta-emotion-monitor.js`)
- [x] 更新版本号 (`package.json`) - v4.0.0 → v4.1.0
- [x] 更新描述 (`package.json`) - 添加新模块说明
- [x] 创建升级文档 (`UPGRADE_COMPLETE_V4.1.0.md`)
- [ ] Git 提交并推送

---

## 🚀 Git 提交

```bash
cd ~/.jvs/.openclaw/workspace/heartflow
git add -A
git commit -m "feat: v4.1.0 叙事心理学与道德心理学增强

新增:
- 叙事身份评估模块 (narrative-identity.js)
  - 叙事连贯性/复杂性/意义建构评估
  - 叙事主题识别 (能动性/共生/救赎/污染)
  - McAdams 生命故事模型整合
- 道德情感识别模块 (moral-emotions.js)
  - 4 类 16 种道德情感识别
  - 6 大道德基础评估 (Haidt)
  - 道德情感干预建议
- 元情绪监控增强模块 (meta-emotion-monitor.js)
  - 元情绪深度监控
  - 情绪成分分析 (6 维度)
  - 情绪模式识别

理论来源:
- SEP 叙事心理学
- SEP 道德心理学
- SEP 情绪理论
- SEP 自我意识理论
- McAdams 生命故事模型
- Haidt 道德基础理论

升级类型：小版本升级 (v4.0.0 → v4.1.0)
后续升级：v4.1.1, v4.2.0, ..."
git push origin main
```

---

**升级完成时间**: 2026-03-30 13:30  
**下次升级**: v4.1.1 (小版本优化)  
**升级负责人**: HeartFlow Team
