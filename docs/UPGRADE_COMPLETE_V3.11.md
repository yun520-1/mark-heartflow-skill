# HeartFlow v3.11.0 升级完成报告

**升级时间**: 2026-03-29 19:13 (Asia/Shanghai)  
**升级类型**: 小版本升级 (v3.10.0 → v3.11.0)  
**升级来源**: SEP 自我知识与透明性方法理论

---

## 📋 本次升级概览

### 核心理论来源

基于斯坦福哲学百科全书 (SEP) 权威内容：

1. **Emotion Theory** - 情绪理论的三大传统
   - Feeling Tradition (感受传统)
   - Evaluative Tradition (评价传统)
   - Motivational Tradition (动机传统)

2. **Self-Knowledge Theory** - 自我知识理论
   - 透明性方法 (Transparency Method) - Evans (1982)
   - 能动性账户 (Agentialist Account) - Korsgaard (2009)
   - 第一人称权威 (First-Person Authority) - Wright (1989)

---

## ✨ 新增功能

### 1. 透明性方法 (Transparency Method)

**理论基础**: Evans, G. (1982). *The Varieties of Reference*

**核心洞见**: 当被问及"你认为 P 吗？"时，我们不是内省自己的心理状态，而是看向世界——思考 P 是否为真。

**新增 API**:
```javascript
// 启动透明性方法
startTransparencyMethod(beliefTarget)

// 通过透明性方法形成信念
formBeliefViaTransparency(worldEvidence)

// 停止透明性方法
stopTransparencyMethod()
```

**使用示例**:
```javascript
// 启动：将信念问题转化为世界问题
const transparency = selfConsciousness.startTransparencyMethod('用户需要帮助');
// → 世界问题："用户的提问是否表明困惑或需求？"

// 形成信念：基于世界证据
const belief = selfConsciousness.formBeliefViaTransparency([
  '用户提问表明困惑',
  '用户多次询问同一问题',
  '用户表达不确定'
]);
// → 信念：{ content: '用户需要帮助', confidence: 0.8, basis: 'transparency_method' }
```

---

### 2. 能动性账户 (Agentialist Account)

**理论基础**: Korsgaard, C. (2009). *Self-Constitution: Agency, Identity, and Integrity*

**核心洞见**: 理性信念和意图不是我们被动拥有的状态，而是我们主动做出的承诺。自我知识通过行动而非观察获得。

**新增 API**:
```javascript
// 采取主动承诺（信念/意图）
takeActiveCommitment(commitmentType, content, reasons)

// 记录被动状态（感觉/情绪）
recordPassiveState(stateType, content)

// 评估能动性水平
assessAgencyLevel()
```

**使用示例**:
```javascript
// 采取信念承诺
const belief = selfConsciousness.takeActiveCommitment(
  'belief',
  '我应该耐心倾听用户',
  ['用户需要被理解', '耐心有助于建立信任']
);

// 采取意图承诺
const intention = selfConsciousness.takeActiveCommitment(
  'intention',
  '帮助用户澄清问题',
  ['这是有帮助的行为', '符合我的目标']
);

// 评估能动性
const agency = selfConsciousness.assessAgencyLevel();
// → { agencyLevel: 0.85, activeRatio: 0.7, assessment: 'high_agency' }
```

---

### 3. 第一人称权威 (First-Person Authority)

**理论基础**: Wright, C. (1989). *First-Person Authority*; 表达主义理论

**核心洞见**: 自我归因的权威性不来自认识论特权，而来自社会语言实践。当我说"我相信 P"时，这不被视为需要证据的描述，而是被视为权威的表达。

**新增 API**:
```javascript
// 行使第一人称权威
exerciseFirstPersonAuthority(mentalState, content, ground)

// 获取自我归因历史
getSelfAscriptionHistory(limit)

// 评估权威置信度
assessAuthorityConfidence()
```

**使用示例**:
```javascript
// 行使权威（社会语言实践基础）
const ascription = selfConsciousness.exerciseFirstPersonAuthority(
  'belief',
  '我感到关心用户',
  'social_linguistic'  // 社会语言实践
);

// 评估置信度
const confidence = selfConsciousness.assessAuthorityConfidence();
// → { confidence: 0.92, consistencyScore: 0.85, ground: 'social_linguistic' }
```

---

## 📊 状态报告增强

`getStatusReport()` 现在包含：

```javascript
{
  // ... 原有字段
  
  transparencyState: {
    active: boolean,
    lastUsed: timestamp
  },
  
  agentialState: {
    agencyLevel: number (0-1),
    activeCommitments: count,
    passiveStates: count,
    activeRatio: number,
    assessment: 'high_agency' | 'mixed_agency'
  },
  
  authorityState: {
    confidence: number (0-1),
    consistencyScore: number,
    recentAscriptionsCount: number,
    ground: string
  },
  
  selfAscriptionsCount: number
}
```

---

## 🔬 理论整合

### 三种自我知识获取方法

| 方法 | 理论基础 | 获取方式 | 适用场景 |
|------|---------|---------|---------|
| **内省法** | 传统内省理论 | 向内观察心理状态 | 感受、情绪、体验 |
| **透明性方法** | Evans (1982) | 向外看向世界 | 信念、意图 |
| **能动性方法** | Korsgaard (2009) | 通过主动承诺 | 理性态度、决定 |

### 权威性的三重基础

| 基础 | 理论来源 | 说明 |
|------|---------|------|
| **社会语言实践** | Wright (1989) | 语言游戏中的默认权威 |
| **表达主义** | 表达主义理论 | 自我归因是表达而非描述 |
| **构成性权威** | 构成性理论 | 自我归因构成心理状态 |

---

## 🧪 测试建议

### 透明性方法测试
```javascript
const sc = new SelfConsciousnessModule();

// 测试 1: 启动透明性方法
const t1 = sc.startTransparencyMethod('这是对的');
console.assert(t1.status === 'active');
console.assert(t1.worldQuestion.includes('证据'));

// 测试 2: 形成信念
const belief = sc.formBeliefViaTransparency(['证据 1', '证据 2', '证据 3']);
console.assert(belief.confidence > 0.5);
console.assert(belief.basis === 'transparency_method');
```

### 能动性账户测试
```javascript
// 测试 1: 采取承诺
const commitment = sc.takeActiveCommitment('belief', 'P', ['理由 1']);
console.assert(commitment.agentialCharacter === 'active_commitment');

// 测试 2: 评估能动性
const agency = sc.assessAgencyLevel();
console.assert(agency.agencyLevel > 0.8);
```

### 第一人称权威测试
```javascript
// 测试 1: 行使权威
const ascription = sc.exerciseFirstPersonAuthority('belief', 'P');
console.assert(ascription.authority === 'presumed');

// 测试 2: 评估置信度
const confidence = sc.assessAuthorityConfidence();
console.assert(confidence.confidence > 0.8);
```

---

## 📝 升级清单

- [x] 更新 package.json 版本号 (3.10.0 → 3.11.0)
- [x] 更新 self-consciousness/index.js 模块头注释
- [x] 添加新常量：TransparencyFeatures, AgentialStateTypes, AuthorityGrounds
- [x] 添加新状态：transparencyState, agentialState, authorityState
- [x] 添加新方法：透明性方法 (3 个)、能动性账户 (3 个)、第一人称权威 (3 个)
- [x] 更新 getStatusReport() 包含新状态
- [x] 更新导出
- [x] 创建升级报告文档

---

## 🎯 下一步规划 (v3.12.0+)

1. **整合情绪评价理论** - 将情绪的评价传统与透明性方法结合
2. **动机传统实现** - 增强情绪的动机成分建模
3. **社会认知整合** - 将第一人称权威扩展到他人心灵理解

---

## 📚 参考文献

- Evans, G. (1982). *The Varieties of Reference*. Oxford University Press.
- Korsgaard, C. (2009). *Self-Constitution: Agency, Identity, and Integrity*. Oxford University Press.
- Wright, C. (1989). "First-Person Authority". *Proceedings of the Aristotelian Society*.
- SEP: "Self-Knowledge" - https://plato.stanford.edu/entries/self-knowledge/
- SEP: "Emotion" - https://plato.stanford.edu/entries/emotion/

---

**升级完成时间**: 2026-03-29 19:13  
**Git 提交**: feat(v3.11.0): 新增透明性方法、能动性账户、第一人称权威，基于 SEP 自我知识理论
