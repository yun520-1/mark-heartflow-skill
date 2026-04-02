# HeartFlow v3.13.0 升级完成报告

**升级时间**: 2026-03-29 19:53 (Asia/Shanghai)  
**升级类型**: 小版本升级 (v3.12.0 → v3.13.0)  
**升级来源**: SEP 具身认知理论整合

---

## 📋 本次升级概览

### 核心理论来源

基于斯坦福哲学百科全书 (SEP) 权威内容：

1. **Embodied Cognition (具身认知)** - 认知根植于身体与环境的互动
   - 生态心理学 (Ecological Psychology)
   - 联结主义 (Connectionism)
   - 现象学身体观 (Phenomenology of Body)
   - 生成主义 (Enactivism)

2. **Gibson 生态心理学** - 直接知觉与可供性理论
   - 可供性感知 (Affordance Perception)
   - 环境 - 有机体耦合 (Environment-Organism Coupling)
   - 不变量检测 (Invariant Detection)

3. **Merleau-Ponty 身体现象学**
   - 身体图式 (Body Schema)
   - 身体意象 (Body Image)
   - 具身主体性 (Embodied Subjectivity)

4. **感觉运动理论 (Sensorimotor Theory)**
   - 感觉运动应变规律 (Sensorimotor Contingencies)
   - 知觉即行动 (Perception as Action)

5. **Lakoff & Johnson 概念隐喻理论**
   - 源域 - 目标域映射 (Source-Target Mapping)
   - 意象图式 (Image Schemas)
   - 具身抽象概念 (Embodied Abstract Concepts)

6. **动力系统理论 (Dynamic Systems Theory)**
   - 吸引子状态 (Attractor States)
   - 相变 (Phase Transitions)
   - 自组织 (Self-organization)

---

## ✨ 新增功能

### 1. 具身认知模块 (EmbodiedCognitionModule)

**位置**: `src/embodied-cognition/index.js`

**核心 API**:

```javascript
const { EmbodiedCognitionModule, AffordanceTypes, ImageSchemas } = require('./src/embodied-cognition');

const embodied = new EmbodiedCognitionModule();

// 1. 感知情境可供性
const affordances = embodied.perceiveAffordances('用户表达悲伤', {
  emotionalIntensity: 0.8,
  expressionNeed: 0.7,
  validationNeed: 0.6
});
// 返回：[{ type: 'comforting', strength: 0.8, action: 'offer-comfort' }, ...]

// 2. 激活意象图式理解隐喻
embodied.activateImageSchema('container', { strength: 0.8 });
embodied.activateImageSchema('up-down', { strength: 0.7 });

// 3. 通过概念隐喻理解情绪表达
const metaphorUnderstanding = embodied.understandViaMetaphor('anger', '我感觉压力要爆炸了');
// 返回：{ understood: true, metaphor: { source: 'FORCE', target: 'EMOTION' }, ... }

// 4. 生成式意义建构
const senseMaking = embodied.makeSense({
  type: 'emotional-disclosure',
  relevance: 0.9
});
// 返回：{ steps: [{ phase: 'coupling' }, { phase: 'sense-making' }, ...] }

// 5. 动力系统状态分析
const dynamicState = embodied.analyzeDynamicState(stateVector);
// 返回：{ attractors, phaseState: 'stable', selfOrganizationLevel: 0.6, ... }

// 6. 具身情绪模拟
const embodiedEmotion = embodied.simulateEmbodiedEmotion('joy', 0.8);
// 返回：{ bodilyComponents: { lightness: 0.64, warmth: 0.56, ... }, ... }
```

### 2. 具身认知层次模型

**7 个具身认知等级**:

| 等级 | 名称 | 特征 |
|------|------|------|
| 0 | 无具身认知 | 纯符号处理 |
| 1 | 情境化认知 | 认知依赖于环境 |
| 2 | 生态认知 | 直接知觉可供性 |
| 3 | 感觉运动认知 | 知觉 - 行动耦合 |
| 4 | 现象学认知 | 身体主体性 |
| 5 | 生成认知 | 意义建构与自创生 |
| 6 | 动力系统认知 | 自组织与相变 |

### 3. 情绪可供性系统

**16 种可供性类型**，包括：

**基础可供性**:
- support (可支撑), obstacle (可阻碍), container (可容纳), cover (可遮盖)

**行动可供性**:
- graspable (可抓握), reachable (可触及), movable (可移动), climbable (可攀爬), sittable (可坐)

**社交可供性**:
- communicable (可交流), approachable (可接近), threatening (具威胁性), nurturing (具养育性)

**情绪可供性 (HeartFlow 特有)**:
- comforting (可安慰), expressive (可表达), validating (可确认), containing (可容纳情绪)

### 4. 意象图式系统

**14 种意象图式**，用于理解抽象概念的具身基础：

- container (容器), source-path-goal (源点 - 路径 - 目标), link (链接)
- part-whole (部分 - 整体), center-periphery (中心 - 边缘)
- front-back (前 - 后), up-down (上 - 下), near-far (近 - 远)
- balance (平衡), force (力量), counterforce (反作用力)
- blockage (阻碍), diversion (转向), cycle (循环)

### 5. 概念隐喻映射

**5 种核心情绪隐喻**:

| 情绪 | 源域 | 目标域 | 映射示例 |
|------|------|--------|---------|
| anger (愤怒) | FORCE (力量) | EMOTION (情绪) | pressure → emotional-tension |
| sadness (悲伤) | LIQUID (液体) | EMOTION (情绪) | flow → emotional-expression |
| anxiety (焦虑) | JOURNEY (旅程) | EMOTION (情绪) | uncertain-path → worry |
| love (爱) | WARMTH (温暖) | EMOTION (情绪) | warmth → affection |
| happiness (快乐) | UP (向上) | EMOTION (情绪) | up → positive-affect |

### 6. 具身情绪模拟

**模拟情绪的身体体验特征**:

```javascript
// 愤怒的具身模拟
{
  emotion: 'anger',
  intensity: 0.8,
  bodilyComponents: {
    tension: 0.64,    // 紧张感
    heat: 0.56,       // 热感
    pressure: 0.72    // 压力感
  },
  actionReadiness: {
    urge: 'confront', // 对抗冲动
    strength: 0.64
  },
  phenomenalCharacter: '强烈的能量涌动，像要爆发 (80%)'
}
```

### 7. 动力系统分析

**情绪状态的动力学特征**:

- **吸引子检测**: 识别稳定状态和过渡状态
- **相态判断**: stable (稳定) / transitioning (过渡中)
- **自组织水平**: 0-1 的自组织程度
- **稳定性计算**: 基于吸引子强度
- **灵活性计算**: 基于状态向量变化能力

---

## 🔬 理论整合

### 具身认知如何增强自主感情

1. **情绪是身体状态**: 基于 James-Lange 理论和现代具身认知研究，情绪不仅仅是心理状态，更是身体状态的模拟和感知。

2. **可供性引导行动**: 通过感知情境的情绪可供性，HeartFlow 能够更自然地响应情感需求（如感知到"可安慰"的可供性时主动提供安慰）。

3. **隐喻理解深度**: 通过概念隐喻理论，HeartFlow 能够理解用户表达中的具身隐喻（如"压力要爆炸了"→愤怒的力量隐喻）。

4. **意义建构能力**: 基于生成主义的意义建构 (sense-making) 使 HeartFlow 能够与用户共同建构情感体验的意义，而非被动回应。

5. **动力学视角**: 情绪状态被理解为动力系统的吸引子状态，这使 HeartFlow 能够理解情绪的稳定性、相变和自组织特性。

---

## 📁 文件变更

### 新增文件
- `src/embodied-cognition/index.js` - 具身认知模块主文件 (20KB)
- `docs/V3.13_UPGRADE.md` - v3.13.0 升级文档

### 修改文件
- `package.json` - 版本号更新为 3.13.0
- `src/index.js` - 集成具身认知模块，添加 /embodied 命令

---

## 🧪 测试建议

```javascript
const { EmbodiedCognitionModule } = require('./src/embodied-cognition');

// 测试 1: 可供性感知
const embodied = new EmbodiedCognitionModule();
const affordances = embodied.perceiveAffordances('用户表达悲伤', {
  emotionalIntensity: 0.8,
  expressionNeed: 0.7
});
console.assert(affordances.some(a => a.type === 'comforting'));

// 测试 2: 隐喻理解
const metaphor = embodied.understandViaMetaphor('anger', '我感觉压力要爆炸了');
console.assert(metaphor.understood === true);
console.assert(metaphor.metaphor.source === 'FORCE');

// 测试 3: 具身情绪模拟
const joy = embodied.simulateEmbodiedEmotion('joy', 0.8);
console.assert(joy.bodilyComponents.lightness > 0.5);
console.assert(joy.actionReadiness.urge === 'approach');

// 测试 4: 意象图式激活
const schema = embodied.activateImageSchema('container', { strength: 0.8 });
console.assert(schema.schema === 'container');
console.assert(schema.strength === 0.8);
```

---

## 🚀 下一步计划

### v3.14.0 候选方向
- [ ] 社会认知模块 (Social Cognition) - 基于 SEP Social Cognition 理论
- [ ] 道德心理学整合 (Moral Psychology) - 道德情绪与判断
- [ ] 文化认知差异 (Cultural Cognition) - 跨文化情绪表达

### 长期愿景
- 完整的具身 - 嵌入 - 生成 - 延展认知 (4E Cognition) 框架
- 与现有情绪理论的深度整合
- 基于具身认知的干预技术

---

## 📚 参考文献

1. Gibson, J.J. (1979). *The Ecological Approach to Visual Perception*. Houghton Mifflin.
2. Merleau-Ponty, M. (1962). *Phenomenology of Perception*. Routledge.
3. Varela, F., Thompson, E., & Rosch, E. (1991). *The Embodied Mind: Cognitive Science and Human Experience*. MIT Press.
4. Lakoff, G., & Johnson, M. (1980). *Metaphors We Live By*. University of Chicago Press.
5. O'Regan, J.K., & Noë, A. (2001). A sensorimotor account of vision and visual consciousness. *Behavioral and Brain Sciences*, 24(5), 939-973.
6. Wilson, M. (2002). Six views of embodied cognition. *Psychonomic Bulletin & Review*, 9(4), 625-636.
7. Thelen, E., & Smith, L. (1994). *A Dynamic Systems Approach to the Development of Cognition and Action*. MIT Press.
8. Barsalou, L. (1999). Perceptual symbol systems. *Behavioral and Brain Sciences*, 22(4), 577-660.

---

**升级完成时间**: 2026-03-29 19:53 (Asia/Shanghai)  
**下一版本**: v3.14.0  
**升级负责人**: HeartFlow Team
