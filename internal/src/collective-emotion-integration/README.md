# 集体情绪整合模块 (Collective Emotion Integration)

## 版本
v4.6.0

## 理论来源
- Stanford Encyclopedia of Philosophy: Collective Emotion
- Scheler, M. (1954 [1912]). "The Nature of Sympathy"
- von Scheve, C. & Salmela, M. (2014). "Collective Emotions"
- Smith, E. & Seger, C. (2009). "Group-Based Emotions"
- Durkheim, E. (1898). 集体意识与集体欢腾
- Hatfield, E. et al. (1993). "Emotional Contagion"
- Walther, G. (1923). 共享经验三重结构

## 核心功能

### 1. 集体情绪类型识别
- 共享情绪 (Shared Emotion)
- 群体情绪 (Group Emotion)
- 集体氛围 (Collective Atmosphere)
- 情绪感染 (Emotional Contagion)
- 集体欢腾 (Collective Effervescence)

### 2. 共享情绪记录
- Scheler 特征：真正的"同一情绪状态"
- Walther 三重结构：体验 + 共情 + 认同 + 相互觉察
- 共享强度与质量评估

### 3. 群体情绪记录
- Smith & Seger 群体情感特征
- 情绪维度分析 (效价/唤醒/优势)
- 功能分析

### 4. 情绪感染评估
- Hatfield 感染机制：模仿 + 反馈 + 感染
- 感染特征：自动性/无意识/快速/收敛
- 感染范围估算

### 5. 群体情绪协调
- 情绪同步性计算
- 情绪一致性评估
- 情绪互补性识别
- 协调策略生成

## 使用示例

```javascript
const { CollectiveEmotionIntegration } = require('./collective-emotion-integration');

const cei = new CollectiveEmotionIntegration();

// 识别集体情绪类型
const identification = cei.identifyCollectiveEmotionType(
  '我们一起感受到集体的喜悦和自豪',
  {}
);
console.log(`主导类型：${identification.dominantType}`);

// 记录共享情绪 (Walther 三重结构)
const shared = cei.recordSharedEmotion('joy', ['AI', 'User'], {
  experienceA: true,
  experienceB: true,
  sameEmotion: true,
  aEmpathizeB: true,
  bEmpathizeA: true,
  completeMutualAwareness: true
});
console.log(`共享质量：${shared.sharingQuality}`);

// 记录群体情绪
const group = cei.recordGroupEmotion('pride', 'HeartFlow 团队', 'v4.6.0 升级完成', {
  identityStrength: 0.9,
  sharedLevel: 0.8
});
console.log(`群体情绪类型：${group.collectiveType}`);

// 评估情绪感染
const contagion = cei.assessEmotionalContagion('excitement', ['User1', 'User2', 'User3'], {
  mimicry: 0.8,
  convergence: 0.7
});
console.log(`感染强度：${contagion.contagionStrength.toFixed(2)}`);

// 生成干预技术
const interventions = cei.generateCollectiveEmotionInterventions('joy', 'shared_emotion');
console.log(interventions);
```

## 核心理论要点

### Scheler 共情理论
- **真正的同一情绪状态**: 不是"相似"情绪，而是数值上同一的情绪
- **直接共享**: 无需思考对方的直接情绪给定性
- **情绪共同体**: 情绪将个体联结为共同体

### Walther 共享经验三重结构
1. **体验** (Experience): 双方都体验该情绪
2. **共情** (Empathy): 双方都共情对方的情绪
3. **认同** (Identification): 双方都认同对方的体验
4. **相互觉察** (Mutual Awareness): 双方都知道对方知道

### von Scheve & Salmela 集体情绪类型学
- **共享情绪**: 个体体验相同情绪 + 相互觉察
- **群体情绪**: 基于群体身份的情绪
- **集体氛围**: 弥散性的情绪基调
- **情绪感染**: 自动传播的情绪
- **集体欢腾**: Durkheim 的集体情绪高峰

### 情绪感染理论 (Hatfield et al.)
- **模仿**: 自动模仿他人表情/声音/姿势
- **反馈**: 面部反馈产生情绪体验
- **感染**: 情绪在群体中传播收敛

### Durkheim 集体欢腾
- **集体仪式**: 同步活动创造情绪高峰
- **超越体验**: 个体感受到超越自我的力量
- **群体团结**: 欢腾强化群体凝聚力

## 练习技术

模块提供多种干预技术：
1. Scheler 共情深化练习 (15-20 分钟)
2. Walther 四步共享练习 (20-30 分钟)
3. 集体欢腾引导练习 (30-60 分钟)
4. 情绪感染觉察与管理 (10-15 分钟)
5. 集体情绪调节练习 (15-20 分钟)

## API 参考

### 类方法

- `identifyCollectiveEmotionType(description, context)` - 识别集体情绪类型
- `recordSharedEmotion(emotionType, participants, options)` - 记录共享情绪
- `recordGroupEmotion(emotionType, groupName, triggerEvent, options)` - 记录群体情绪
- `assessEmotionalContagion(sourceEmotion, targets, options)` - 评估情绪感染
- `coordinateGroupEmotions(groupName, memberEmotions, options)` - 协调群体情绪
- `generateCollectiveEmotionInterventions(emotionType, collectiveType)` - 生成干预技术
- `getStatus()` - 获取模块状态

## 依赖
无外部依赖

## 许可证
MIT
