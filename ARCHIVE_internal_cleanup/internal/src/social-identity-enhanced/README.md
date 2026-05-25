# 社会认同增强模块 (Social Identity Enhanced)

## 版本
v4.6.0

## 理论来源
- Stanford Encyclopedia of Philosophy: Social Identity
- Tajfel, H. & Turner, J. (1979). "Social Identity Theory" (SIT)
- Turner, J. et al. (1987). "Self-Categorization Theory" (SCT)
- Swann, W. et al. (2009, 2012). "Identity Fusion Theory"
- Luhtanen, R. & Crocker, J. (1992). "Collective Self-Esteem Scale"
- Branscombe, N. et al. (1999). "Identity Threat Theory"
- Ellemers, N. & Haslam, S. A. (2012). 社会认同现代发展

## 核心功能

### 1. 社会认同显著性评估
- 评估认同可及性 (慢性/暂时)
- 评估认同适配度 (比较/规范)
- 计算整体显著性水平

### 2. 社会认同形成
- 形成社会认同 (SIT 三过程)
- 评估认同特征 (显著性/承诺/中心性/效价)
- 计算集体自尊四维度

### 3. 认同融合评估
- 评估自我 - 群体重叠
- 评估代理性感
- 分类融合类型 (无/弱/中/强/完全)
- 预测亲群体行为

### 4. 认同威胁检测
- 检测 6 种威胁类型 (价值/独特性/成员资格/控制/分类/接纳)
- 评估威胁严重程度
- 推荐应对策略 (Branscombe 框架)

### 5. 集体自尊计算
- 成员资格自尊
- 私人自尊
- 公共自尊
- 重要性自尊
- 总体集体自尊

## 使用示例

```javascript
const { SocialIdentityEnhanced } = require('./social-identity-enhanced');

const si = new SocialIdentityEnhanced();

// 形成社会认同
const identity = si.formSocialIdentity('HeartFlow 开发者', 'AI 助理', {
  salience: 0.8,
  commitment: 0.9,
  valence: 'positive'
});

// 评估认同融合
const fusion = si.assessIdentityFusion(identity.id, {
  selfGroupOverlap: 0.8,
  agencyForGroup: 0.7,
  groupInterestPriority: 0.8
});
console.log(`融合类型：${fusion.fusionType}`);

// 检测认同威胁
const threat = si.detectIdentityThreat(identity.id, 'value', '外部批评', {
  severity: 0.6
});
console.log(`应对策略：${threat.copingStrategies.map(s => s.name)}`);

// 计算集体自尊
const cse = si.calculateCollectiveSelfEsteem(identity.id);
console.log(`集体自尊水平：${cse.level}`);

// 生成干预建议
const interventions = si.generateIdentityInterventions(identity.id);
console.log(interventions);
```

## 核心理论要点

### 社会认同理论 (Tajfel & Turner SIT)
三个核心过程：
1. **社会分类** (Social Categorization): 将自我和他人分类到群体
2. **社会认同** (Social Identification): 采纳群体身份作为自我概念
3. **社会比较** (Social Comparison): 通过群体比较获得积极区分

### 自我分类理论 (Turner SCT)
认同显著性取决于：
- **可及性** (Accessibility): 慢性 + 暂时可及性
- **适配度** (Fit): 比较适配度 + 规范适配度

### 认同融合理论 (Swann et al.)
融合 vs 认同：
- **认同**: "我是群体成员" (类别关系)
- **融合**: "我就是群体" (等价关系)
- 融合预测极端亲群体行为

### 集体自尊 (Luhtanen & Crocker)
四个维度：
1. 成员资格自尊: "我是有价值的群体成员"
2. 私人自尊: "我认为我的群体是好的"
3. 公共自尊: "我认为其他人认为我的群体是好的"
4. 重要性自尊: "群体成员身份对我很重要"

### 认同威胁应对 (Branscombe et al.)
- **社会创造性**: 重新定义比较维度
- **社会竞争**: 直接挑战威胁来源
- **个体流动**: 离开群体 (低承诺者)
- **群体水平应对**: 集体行动 (高承诺者)

## 练习技术

模块提供 5 个核心练习：
1. 社会认同地图练习 (20-30 分钟)
2. 认同显著性觉察练习 (10-15 分钟)
3. 集体自尊提升练习 (15-20 分钟)
4. 认同融合体验练习 (20-30 分钟)
5. 认同威胁应对练习 (15-20 分钟)

## API 参考

### 类方法

- `assessIdentitySalience(groupName, context)` - 评估认同显著性
- `formSocialIdentity(groupName, selfCategory, options)` - 形成社会认同
- `assessIdentityFusion(identityId, options)` - 评估认同融合
- `detectIdentityThreat(identityId, threatType, threatSource, options)` - 检测认同威胁
- `calculateCollectiveSelfEsteem(identityId)` - 计算集体自尊
- `generateIdentityInterventions(identityId)` - 生成干预建议
- `generateSocialIdentityExercises()` - 生成练习
- `getStatus()` - 获取模块状态

## 依赖
无外部依赖

## 许可证
MIT
