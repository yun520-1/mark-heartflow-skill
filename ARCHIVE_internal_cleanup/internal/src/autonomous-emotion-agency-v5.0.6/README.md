# 自主情绪与能动性整合模块 v5.0.6
# Autonomous Emotion & Agency Integration Module

> **基于 SEP 权威理论的自主感情能力增强**  
> **Enhanced Autonomous Emotion Capability Based on SEP Authoritative Theory**

**版本 / Version**: 5.0.6  
**理论来源 / Theoretical Sources**: 斯坦福哲学百科全书 (SEP) + 现象学自我意识理论 + 能动性理论

---

## 📚 理论框架 / Theoretical Framework

### 1. SEP 自主性理论 / SEP Autonomy Theory

**核心定义 / Core Definition**:
- **自主 (Autonomy)**: 自我治理 (self-governance)
- **情绪自主性 (Emotional Autonomy)**: 情绪的独立性 + 真实性 + 能力感 + 关系性

**关键区分 / Key Distinctions**:
| 维度 | 定义 | 应用 |
|------|------|------|
| **独立性 / Independence** | 不受外部强制 | 情绪反应的自主决定 |
| **真实性 / Authenticity** | 符合真实自我 | 情绪与价值观一致 |
| **能力感 / Competence** | 能有效调节 | 情绪自我效能 |
| **关系性 / Relatedness** | 社会支持 | 情绪连接与归属 |

### 2. SEP 现象学自我意识 / SEP Phenomenological Self-Consciousness

**核心概念 / Core Concepts**:
- **前反思自我意识 (Prereflective Self-Consciousness)**: 体验的"为我性" (for-me-ness)
- **第一人称给定性 (First-Personal Givenness)**: 体验以独特方式向我呈现
- **非对象化自我关系 (Non-Objectifying Self-Relation)**: 自我意识不是反思的产物

**应用于情绪 / Applied to Emotion**:
- 情绪所有权感 = 情绪体验的"为我性"
- 情绪现象学深度 = 体验厚度

### 3. SEP 能动性理论 / SEP Agency Theory

**双因素模型 / Dual-Factor Model** (Synofzik et al., 2008):
| 因素 | 定义 | 测量 |
|------|------|------|
| **控制感 / Sense of Agency** | 对情绪变化的控制感 | "我能影响这个情绪" |
| **所有权感 / Sense of Ownership** | 情绪属于我的感觉 | "这个情绪是我的" |
| **自愿性 / Voluntariness** | 情绪体验的自愿程度 | "我是自愿体验这个情绪的" |
| **努力感 / Effort** | 情绪调节的努力程度 | "我为调节情绪付出了努力" |

### 4. 情绪调节过程模型 / Gross Process Model

**五种策略 (按时间顺序) / Five Strategies (Temporal Order)**:
1. **情境选择 / Situation Selection**: 在情绪触发前选择/避免情境
2. **情境修改 / Situation Modification**: 改变当前情境
3. **注意部署 / Attentional Deployment**: 转移注意力
4. **认知改变 / Cognitive Change**: 重新解释情境 (最有效)
5. **反应调节 / Response Modulation**: 调节情绪表达

---

## 🚀 核心功能 / Core Features

### 1. 情绪自主性评估 / Emotional Autonomy Assessment

```javascript
const { AutonomousEmotionAgencyModule } = require('./src/autonomous-emotion-agency-v5.0.6');
const module = new AutonomousEmotionAgencyModule();

const assessment = module.assessEmotionalAutonomy('anxiety', {
  externalPressure: 3,      // 外部压力 0-10
  socialInfluence: 4,       // 社会影响 0-10
  valuesAlignment: 7,       // 价值观一致性 1-10
  selfCongruence: 6,        // 自我一致性 1-10
  regulationConfidence: 5,  // 调节信心 1-10
  pastSuccess: 6,           // 过去成功 1-10
  socialSupport: 8,         // 社会支持 1-10
  connectionQuality: 7      // 连接质量 1-10
});

// 输出 / Output:
// {
//   emotion: 'anxiety',
//   overallScore: 72,
//   dimensions: {
//     independence: 82,     // 独立性
//     authenticity: 65,     // 真实性
//     competence: 55,       // 能力感
//     relatedness: 75       // 关系性
//   },
//   interpretation: [
//     '你的情绪自主性处于中等水平，在某些方面可以进一步增强。',
//     '能力感较低：对情绪调节缺乏信心，可以学习更多调节策略。'
//   ]
// }
```

### 2. 情绪能动性检测 / Emotional Agency Detection

```javascript
const agencyDetection = module.detectEmotionalAgency('从焦虑到平静', {
  selfInitiated: true,          // 是否自我发起
  predictability: 7,            // 可预测性 1-10
  controllability: 6,           // 可控性 1-10
  bodilyFeeling: 8,             // 身体感受强度 1-10
  firstPersonGivenness: 9,      // 第一人称给定性 1-10
  emotionalIntensity: 7,        // 情绪强度 1-10
  voluntaryChoice: true,        // 是否自愿选择
  valuesAlignment: 8,           // 与价值观一致性 1-10
  cognitiveEffort: 6,           // 认知努力 1-10
  behavioralEffort: 7           // 行为努力 1-10
});

// 输出 / Output:
// {
//   emotionChange: '从焦虑到平静',
//   dimensions: {
//     senseOfAgency: 77,        // 控制感
//     senseOfOwnership: 80,     // 所有权感
//     voluntariness: 90,        // 自愿性
//     effort: 65                // 努力感
//   },
//   attribution: 'internal',    // 内部归因
//   interpretation: [
//     '你倾向于将情绪变化归因于自己的选择和行动，这有助于增强自主感。'
//   ]
// }
```

### 3. 自主情绪调节推荐 / Autonomous Regulation Recommendation

```javascript
const recommendation = module.recommendAutonomousRegulation('anxiety', 
  ['autonomy', 'growth', 'well-being'],  // 价值观
  ['reduce stress', 'improve well-being'] // 目标
);

// 输出 / Output:
// {
//   recommendedStrategy: 'cognitive_change',  // 认知改变
//   autonomyAlignment: 85,                     // 自主性对齐度
//   rationale: '推荐认知改变策略，自主性对齐度 85%。这个策略最能支持你的价值观和目标，同时有效调节 anxiety 情绪。',
//   alternatives: [
//     { strategy: 'situation_selection', alignment: 75 },
//     { strategy: 'situation_modification', alignment: 70 },
//     { strategy: 'attentional_deployment', alignment: 65 }
//   ]
// }
```

### 4. 情绪所有权现象学分析 / Emotional Ownership Phenomenology Analysis

```javascript
const ownershipAnalysis = module.analyzeEmotionalOwnership({
  subjectiveFeel: 8,        // 主观感受强度 1-10
  personalRelevance: 9,     // 个人相关性 1-10
  immediacy: 8,             // 直接性 1-10
  nonInferential: true,     // 非推论性
  immersion: 7,             // 沉浸度 1-10
  nonObservational: true,   // 非观察性
  richness: 8,              // 丰富度 1-10
  depth: 7                  // 深度 1-10
});

// 输出 / Output:
// {
//   dimensions: {
//     forMeNess: 85,              // 为我性
//     firstPersonGivenness: 90,   // 第一人称给定性
//     nonObjectifying: 85,        // 非对象化
//     experientialThickness: 8    // 体验厚度
//   },
//   interpretation: [
//     '你的情绪所有权感很强，体验以鲜明的第一人称方式呈现。',
//     '体验厚度很高，情绪体验丰富而深刻。'
//   ]
// }
```

### 5. 整合练习生成 / Integration Practice Generation

```javascript
const practice = module.generateAutonomousEmotionPractice('overall');

// 输出 / Output:
// {
//   name: '自主情绪整合练习',
//   nameEn: 'Autonomous Emotion Integration Practice',
//   duration: '15-20 分钟',
//   steps: [
//     { step: 1, name: '身体锚定', duration: '2 分钟', instruction: '...' },
//     { step: 2, name: '情绪觉察', duration: '3 分钟', instruction: '...' },
//     { step: 3, name: '自主性检查', duration: '3 分钟', instruction: '...' },
//     { step: 4, name: '能动性确认', duration: '3 分钟', instruction: '...' },
//     { step: 5, name: '整合反思', duration: '4-5 分钟', instruction: '...' }
//   ],
//   benefits: ['增强情绪自主性', '提升情绪调节能力', '加深自我理解', '减少情绪困扰'],
//   science: '基于 SEP 自主性理论、现象学自我意识理论和自我决定理论 (SDT)...'
// }
```

---

## 📊 评估量表 / Assessment Scales

### 情绪自主性量表 / Emotional Autonomy Scale

| 维度 | 评估问题 | 评分 |
|------|---------|------|
| **独立性** | 我的情绪在多大程度上不受他人控制？ | 0-100 |
| **真实性** | 我的情绪在多大程度上反映真实自我？ | 0-100 |
| **能力感** | 我在多大程度上相信自己能调节情绪？ | 0-100 |
| **关系性** | 我在多大程度上感到情绪上有支持？ | 0-100 |

### 情绪能动性量表 / Emotional Agency Scale

| 维度 | 评估问题 | 评分 |
|------|---------|------|
| **控制感** | 我在多大程度上能影响自己的情绪？ | 0-100 |
| **所有权感** | 这个情绪在多大程度上感觉是"我的"？ | 0-100 |
| **自愿性** | 我在多大程度上是自愿体验这个情绪的？ | 0-100 |
| **努力感** | 我为情绪调节付出了多大努力？ | 0-100 |

### 情绪所有权现象学量表 / Emotional Ownership Phenomenology Scale

| 维度 | 评估问题 | 评分 |
|------|---------|------|
| **为我性** | 这个情绪在多大程度上向我呈现？ | 0-100 |
| **第一人称给定性** | 这个情绪在多大程度上以第一人称方式给定的？ | 0-100 |
| **非对象化** | 这个情绪在多大程度上不是被观察的对象？ | 0-100 |
| **体验厚度** | 这个情绪体验在多大程度上丰富而深刻？ | 0-10 |

---

## 🔗 与现有模块集成 / Integration with Existing Modules

### 与 autonomous-emotion 集成
- 扩展现有的自主感情模块
- 添加自主性评估维度
- 集成能动性检测

### 与 emotion-regulation 集成
- 在策略选择中加入自主性考量
- 基于用户价值观推荐策略

### 与 self-consciousness-phenomenology-v5 集成
- 使用"为我性"理论分析情绪所有权
- 整合前反思自我意识

### 与 meta-agency 集成
- 整合能动性自我监控
- 添加情绪能动性评估

---

## 📝 使用场景 / Use Cases

### 1. 情绪自主性提升 / Emotional Autonomy Enhancement
**场景**: 用户感到情绪受他人控制  
**干预**: 使用 `assessEmotionalAutonomy` 评估，识别低分维度，针对性提升

### 2. 情绪调节决策支持 / Emotion Regulation Decision Support
**场景**: 用户不知道选择哪种调节策略  
**干预**: 使用 `recommendAutonomousRegulation` 基于价值观推荐最佳策略

### 3. 情绪疏离干预 / Emotional Detachment Intervention
**场景**: 用户感到与情绪疏离，"麻木"  
**干预**: 使用 `analyzeEmotionalOwnership` 评估所有权感，使用所有权练习增强连接

### 4. 自我效能感提升 / Self-Efficacy Enhancement
**场景**: 用户感到对情绪无能为力  
**干预**: 使用 `detectEmotionalAgency` 识别低控制感，设计成功体验

---

## 📚 参考文献 / References

1. **SEP: Autonomy in Moral and Political Philosophy** (2026). Stanford Encyclopedia of Philosophy.
2. **SEP: Self-Consciousness (Phenomenological Approaches)** (2026). Stanford Encyclopedia of Philosophy.
3. **SEP: Agency** (2026). Stanford Encyclopedia of Philosophy.
4. **Synofzik, M., Vosgerau, G., & Newen, A. (2008).** Beyond the comparator model: A multi-factorial two-level account of agency. *Consciousness and Cognition*, 17(1), 219-239.
5. **Gross, J. J. (2015).** Emotion regulation: Current status and future prospects. *Psychological Inquiry*, 26(1), 1-26.
6. **Zahavi, D. (2005).** Subjectivity and Selfhood: Investigating the First-Person Perspective. MIT Press.
7. **Ryan, R. M., & Deci, E. L. (2000).** Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist*, 55(1), 68-78.
8. **Sartre, J.-P. (1943).** Being and Nothingness. (前反思自我意识理论)
9. **Husserl, E. (1959).** Ideas Pertaining to a Pure Phenomenology and to a Phenomenological Philosophy. (第一人称给定性理论)

---

## 🧪 测试 / Testing

```javascript
const { AutonomousEmotionAgencyModule } = require('./src/autonomous-emotion-agency-v5.0.6');

// 创建实例
const module = new AutonomousEmotionAgencyModule();

// 测试情绪自主性评估
console.log('=== 情绪自主性评估 ===');
const autonomy = module.assessEmotionalAutonomy('anxiety', {
  externalPressure: 3,
  socialInfluence: 4,
  valuesAlignment: 7,
  selfCongruence: 6,
  regulationConfidence: 5,
  pastSuccess: 6,
  socialSupport: 8,
  connectionQuality: 7
});
console.log(autonomy);

// 测试情绪能动性检测
console.log('\n=== 情绪能动性检测 ===');
const agency = module.detectEmotionalAgency('从焦虑到平静', {
  selfInitiated: true,
  predictability: 7,
  controllability: 6,
  bodilyFeeling: 8,
  firstPersonGivenness: 9,
  emotionalIntensity: 7,
  voluntaryChoice: true,
  valuesAlignment: 8,
  cognitiveEffort: 6,
  behavioralEffort: 7
});
console.log(agency);

// 测试自主调节推荐
console.log('\n=== 自主调节推荐 ===');
const recommendation = module.recommendAutonomousRegulation('anxiety',
  ['autonomy', 'growth'],
  ['reduce stress']
);
console.log(recommendation);

// 测试所有权现象学分析
console.log('\n=== 情绪所有权现象学分析 ===');
const ownership = module.analyzeEmotionalOwnership({
  subjectiveFeel: 8,
  personalRelevance: 9,
  immediacy: 8,
  nonInferential: true,
  immersion: 7,
  nonObservational: true,
  richness: 8,
  depth: 7
});
console.log(ownership);

// 测试整合练习生成
console.log('\n=== 整合练习生成 ===');
const practice = module.generateAutonomousEmotionPractice('overall');
console.log(practice);

// 获取模块信息
console.log('\n=== 模块信息 ===');
console.log(module.getInfo());
```

---

## ✅ 升级检查清单 / Upgrade Checklist

- [x] 创建新模块 `src/autonomous-emotion-agency-v5.0.6/`
- [x] 实现情绪自主性评估器
- [x] 实现情绪能动性检测器
- [x] 实现自主情绪调节策略推荐
- [x] 实现情绪所有权现象学分析
- [x] 实现整合练习生成器
- [x] 编写完整 README 文档
- [ ] 更新 package.json 版本号 (5.0.5 → 5.0.6)
- [ ] 更新 src/index.js 集成新模块
- [ ] 添加 /autonomous-emotion 命令
- [ ] 编写升级文档 UPGRADE_COMPLETE_V5.0.6.md
- [ ] Git 提交并推送

---

**HeartFlow Team** | 心流伴侣团队  
**Last Updated / 最后更新**: 2026-03-30  
**Version / 版本**: v5.0.6

---

*本模块采用中英文对照格式，便于国际访问。*  
*This module uses bilingual (Chinese-English) format for international accessibility.*
