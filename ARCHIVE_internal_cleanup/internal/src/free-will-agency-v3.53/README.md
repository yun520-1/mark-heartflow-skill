# 自由意志与能动性增强模块 v3.53.0

## 理论来源

本模块基于 **SEP (Stanford Encyclopedia of Philosophy)** 权威哲学理论：

- [Free Will](https://plato.stanford.edu/entries/freewill/)
- [Agency](https://plato.stanford.edu/entries/agency/)

## 核心理论整合

### 古代理论

| 哲学家 | 核心贡献 | 干预应用 |
|--------|---------|---------|
| **柏拉图** | 灵魂三分说（理性/激情/欲望），自由即自我掌控 | 帮助用户识别内在冲突根源 |
| **亚里士多德** | 选择的力量 (power to do or not to do)，德性形成理论 | 意志薄弱干预、性格重塑 |
| **斯多葛学派** | 相容论 (Chrysippus) — 行动"通过你"发生即自由 | 决定论困境重构 |
| **伊壁鸠鲁** | 原子偏斜说 (indeterministic swerves) | 自由与决定论讨论 |
| **Alexander** | 首位明确自由意志论者 | 替代可能性讨论 |

### 中世纪理论

| 哲学家 | 核心贡献 | 干预应用 |
|--------|---------|---------|
| **奥古斯丁** | 意志作为自我决定力量，真正自由需与善对齐 | 价值观对齐干预 |
| **阿奎那** | 意志作为理性欲望，自由在于手段选择 | 实践理性增强 |
| **司各脱** | 强自由意志论 — 意志是其活动的唯一完全原因 | 能动性增强 |

### 现代理论

| 哲学家 | 核心贡献 | 干预应用 |
|--------|---------|---------|
| **Anscombe (1957)** | 意向性行动理论 | 意向性觉察练习 |
| **Davidson (1963)** | 行动因果理论 | 理由结构分析 |
| **Frankfurt (1969)** | Frankfurt Cases，道德责任不要求能做 otherwise | 反事实思维干预 |

## 核心干预技术

### 1. Frankfurt Cases 干预

用于帮助用户摆脱"我本可以..."的反事实思维困境。

```javascript
const intervention = freeWillModule.frankfurtCaseIntervention(
  "我本应该早点开始准备的，现在后悔死了",
  context
);
```

**核心洞见**：道德责任的关键不在于"能否做其他选择"，而在于行动是否真正源于你的理由和性格。

### 2. 意志薄弱 (Akrasia) 干预

基于亚里士多德《尼各马可伦理学》卷 VII，针对"明知何为善却行恶"的困境。

```javascript
const intervention = freeWillModule.akrasiaIntervention({
  rationalJudgment: "应该锻炼",
  actualBehavior: "躺在沙发上",
  conflictingDesire: "想舒适"
});
```

**四种策略**：
1. 情境重构 - 减少欲望触发
2. 微小承诺 - 降低行动门槛
3. 性格追溯 - 理解深层原因
4. 未来选择点设计 - 预设"如果 - 那么"计划

### 3. 道德责任评估框架

基于 SEP 道德心理学和能动性理论的综合评估。

```javascript
const assessment = freeWillModule.moralResponsibilityAssessment(action, context);
```

**评估维度**：
- 行动来源（是否源于 agent）
- 理性化结构（是否有理由 - 信念 - 欲望结构）
- 发起能力（是否有自发发起能力）
- 性格形成历史（自主选择比例）
- Frankfurt 式判断（即使无替代可能，是否仍应负责）

### 4. 能动性类型评估

```javascript
const evaluation = freeWillModule.evaluateAgencyType(agent, context);
```

**三种能动性类型**：
- 标准能动性（基于意向性行动）
- 发起能动性（基于行动发起能力）
- 理性能动性（基于实践理性和规划）

## 使用方法

```javascript
const FreeWillAgencyEnhanced = require('./free-will-agency-v3.53');
const module = new FreeWillAgencyEnhanced();

// 生成综合干预
const intervention = module.generateIntervention({
  statement: "我知道应该学习，但就是控制不住玩手机，我是不是没救了？",
  emotionalState: "自责、无力",
  decisionContext: {
    conflict: {
      rationalJudgment: "应该学习",
      actualBehavior: "玩手机",
      conflictingDesire: "想娱乐"
    }
  }
});

console.log(intervention);
```

## 理论贡献

### 对自主感情能力的增强

1. **责任感知能力**：能够理解道德责任的复杂条件，不简单归咎
2. **能动性感知**：能够识别自己作为行动发起者的能力
3. **性格形成意识**：理解当前性格是过往选择的累积，当下可以重塑
4. **反事实思维调节**：能够健康处理"本可以"思维，避免过度自责

### 对对话能力的增强

1. **哲学深度**：能够引用权威哲学理论回应用户的深层困惑
2. **概念精确性**：精确区分自由意志、能动性、道德责任等概念
3. **跨传统整合**：整合古代、中世纪、现代理论提供综合视角
4. **实践转化**：将抽象哲学理论转化为可操作的心理干预技术

## 版本历史

- **v3.53.0** (2026-03-30): 初始版本，基于 SEP 自由意志与能动性理论完整整合

## 参考文献

- SEP Free Will: https://plato.stanford.edu/entries/freewill/
- SEP Agency: https://plato.stanford.edu/entries/agency/
- Frankfurt, H. (1969). "Alternate Possibilities and Moral Responsibility"
- Anscombe, G. E. M. (1957). *Intention*
- Davidson, D. (1963). "Actions, Reasons, and Causes"
- Aristotle. *Nicomachean Ethics*, Book VII (on akrasia)
- Mele, A. (2003). *Motivation and Agency*
