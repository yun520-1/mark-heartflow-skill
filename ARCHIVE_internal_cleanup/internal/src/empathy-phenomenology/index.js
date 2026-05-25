/**
 * 共情现象学模块 (Empathy Phenomenology Module)
 * v3.26.0 新增
 * 
 * 基于 Stanford Encyclopedia of Philosophy 权威理论：
 * - SEP: Self-Consciousness (自我意识理论)
 * - SEP: Collective Intentionality (集体意向性理论)
 * - SEP: Phenomenology (现象学方法)
 * - Scheler, M. (1912). The Nature of Sympathy
 * - Walther, G. (1923). 共享体验现象学
 * - Husserl, E. 共情理论 (Einfühlung)
 * 
 * 核心理念：
 * - 共情不是投射，而是直接感知他者的体验
 * - 共情需要自我 - 他者的清晰区分
 * - 真正的共情是交互的、关系性的
 * - 自我关怀是可持续共情的基础
 * 
 * @version 3.26.0
 * @author HeartFlow Team
 */

// 引入子模块
const { 
  assessResonanceIntensity, 
  identifyEmpathyType, 
  assessEmpathyDepth,
  getResonanceDescription,
  getDepthDescription
} = require('./resonance');

const {
  guidePerspectiveTaking,
  assessPerspectiveTakingQuality,
  generatePhenomenologicalInsight
} = require('./perspective');

const {
  detectEmpathyBoundaries,
  generateBoundaryIntervention,
  boundaryWarnings,
  healthyBoundaryIndicators
} = require('./boundary');

// ============ 共情现象学核心类 ============

class EmpathyPhenomenologyModule {
  constructor() {
    // 共情状态历史
    this.empathyHistory = [];
    
    // 边界状态缓存
    this.boundaryStateCache = null;
  }

  /**
   * 分析用户的共情状态并提供引导
   * @param {string} userInput - 用户输入
   * @param {object} context - 情境信息
   * @returns {object} 共情分析结果
   */
  analyzeEmpathy(userInput, context = {}) {
    // 1. 情感共鸣分析
    const resonance = assessResonanceIntensity(userInput, context);
    
    // 2. 共情类型识别
    const empathyType = identifyEmpathyType(userInput);
    
    // 3. 共情深度评估
    const depth = assessEmpathyDepth(userInput);
    
    // 4. 边界状态检测
    const boundary = detectEmpathyBoundaries(userInput);
    
    // 5. 生成综合回应
    const response = this.generateEmpathyResponse(resonance, empathyType, depth, boundary, context);
    
    // 6. 记录历史
    this._recordEmpathyHistory({
      timestamp: new Date().toISOString(),
      resonance,
      empathyType,
      depth,
      boundary,
      userInput: userInput.substring(0, 100) + '...'
    });
    
    return {
      resonance,
      empathyType,
      depth,
      boundary,
      response,
      hasBoundaryWarning: boundary.hasWarning,
      boundaryState: boundary.boundaryState?.state
    };
  }

  /**
   * 生成共情回应
   */
  generateEmpathyResponse(resonance, empathyType, depth, boundary, context = {}) {
    const response = {
      validation: this.generateValidation(resonance),
      guidance: [],
      boundaryCheck: null,
      phenomenologicalInsight: null
    };
    
    // 生成共情引导
    if (context.targetPerson && context.situation) {
      const perspectiveGuidance = guidePerspectiveTaking(
        context.targetPerson,
        context.situation,
        context
      );
      response.guidance.push(perspectiveGuidance);
    }
    
    // 边界检查（如果有预警）
    if (boundary.hasWarning) {
      response.boundaryCheck = generateBoundaryIntervention(boundary.warnings);
    }
    
    // 现象学洞见
    response.phenomenologicalInsight = generatePhenomenologicalInsight();
    
    return response;
  }

  /**
   * 生成共情验证回应
   */
  generateValidation(resonance) {
    const validations = {
      high: {
        text: '我感受到你深刻的情感共鸣。这种与他人深度连接的能力是珍贵的，同时也需要注意保护自己的边界。',
        tone: '温暖而谨慎'
      },
      medium: {
        text: '我能感受到你对他人的关心和理解。这种共情能力让你能够真正与他人连接。',
        tone: '温暖而支持'
      },
      low: {
        text: '你在尝试理解他人的处境。共情是一种可以培养的能力，让我们一起探索。',
        tone: '鼓励而开放'
      },
      minimal: {
        text: '你在认知层面理解他人的处境。如果你想更深入地连接，我们可以一起练习共情。',
        tone: '中性而邀请'
      }
    };
    
    return validations[resonance.level] || validations.minimal;
  }

  /**
   * 引导观点采择
   * @param {string} targetPerson - 他者描述
   * @param {string} situation - 情境描述
   * @returns {object} 观点采择引导
   */
  guidePerspective(targetPerson, situation) {
    return guidePerspectiveTaking(targetPerson, situation);
  }

  /**
   * 检查共情边界
   * @param {string} userInput - 用户输入
   * @returns {object} 边界检测结果
   */
  checkBoundaries(userInput) {
    return detectEmpathyBoundaries(userInput);
  }

  /**
   * 提供边界干预建议
   * @param {array} warnings - 预警信号
   * @returns {object} 干预建议
   */
  provideBoundaryIntervention(warnings) {
    return generateBoundaryIntervention(warnings);
  }

  /**
   * 获取共情教育内容
   */
  getEmpathyEducation() {
    return {
      whatIsEmpathy: `
# 什么是共情？

共情 (Empathy) 是理解和分享他人情绪体验的能力，包含四个核心成分：

1. **情感共鸣** (Affective Resonance): 身体和情绪层面的自动共鸣
2. **认知理解** (Cognitive Understanding): 理解他人的观点和处境
3. **自我 - 他者区分** (Self-Other Distinction): 保持清晰的边界
4. **关怀动机** (Care Motivation): 想要关心和支持的愿望

## 共情的层次

| 层次 | 描述 | 特征 |
|------|------|------|
| 情绪感染 | 自动的情绪传染 | 无意识、身体层面 |
| 共情感受 | 感受他人的情绪 | 有情感连接 |
| 观点采择 | 从他者视角理解 | 认知参与 |
| 交互共情 | 双向的关系连接 | 深度、相互性 |
`,

      phenomenologicalApproach: `
# 现象学共情方法

现象学提供了一种独特的共情理解方式：

## 核心原则

1. **悬置判断** (Epoché): 放下自己的预设和评判
2. **面向事物本身**: 如实地让他者的体验显现
3. **想象性变体**: 通过想象探索多种可能性
4. **保持好奇**: 承认他者永远有神秘性

## 与心理学共情的区别

| 心理学共情 | 现象学共情 |
|-----------|-----------|
| 理解他者的心理状态 | 与他者共同体验 |
| 保持客观距离 | 建立关系连接 |
| 追求准确性 | 保持开放性 |
| 认知为主 | 身心整合 |
`,

      boundaryCare: `
# 共情边界与自我关怀

## 为什么需要边界？

- 防止共情疲劳和替代性创伤
- 保持清晰的自我感
- 尊重他者的能动性
- 实现可持续的关怀

## 健康边界的标志

✅ 能够感受他人的情绪，但不被淹没
✅ 关心他人，同时照顾自己的需求
✅ 提供支持，但不承担他人的责任
✅ 保持连接，同时尊重差异

## 自我关怀练习

1. **情绪容器可视化**: 想象你的情绪容量是一个杯子，先填满自己的杯子
2. **边界设定**: 学会说"我关心你，但我现在需要休息"
3. **身体锚定**: 通过呼吸和身体感受回到当下
4. **同侪支持**: 与理解你的人分享你的感受
`
    };
  }

  /**
   * 记录共情历史
   */
  _recordEmpathyHistory(record) {
    this.empathyHistory.push(record);
    // 保留最近 50 条记录
    if (this.empathyHistory.length > 50) {
      this.empathyHistory.shift();
    }
  }

  /**
   * 获取共情历史
   */
  getEmpathyHistory(limit = 10) {
    return this.empathyHistory.slice(-limit);
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'EmpathyPhenomenologyModule',
      version: '3.26.0',
      description: '共情现象学模块 - 基于 SEP 自我意识、集体意向性、现象学理论',
      theoreticalFoundations: [
        'SEP: Self-Consciousness',
        'SEP: Collective Intentionality',
        'SEP: Phenomenology',
        'Scheler (1912): The Nature of Sympathy',
        'Walther (1923): 共享体验现象学',
        'Husserl: 共情理论 (Einfühlung)'
      ],
      capabilities: [
        '情感共鸣分析',
        '共情类型识别',
        '共情深度评估',
        '观点采择引导',
        '边界状态检测',
        '边界干预建议',
        '现象学洞见生成',
        '共情教育内容'
      ],
      submodules: {
        resonance: '情感共鸣分析',
        perspective: '观点采择引导',
        boundary: '边界检测与干预'
      },
      commands: [
        '/empathy - 查看共情现象学说明',
        '/empathize <text> - 分析共情状态并提供引导',
        '/boundary - 检查共情边界和自我保护'
      ]
    };
  }

  /**
   * 生成教学说明
   */
  getTeachingContent() {
    return `
# 💗 共情现象学 (Empathy Phenomenology)

## 核心理念

> **共情不是"我懂你的感受"，而是"我愿意陪伴你探索你的感受"。**
> 
> —— 现象学共情的核心洞见

## 共情的四个成分

| 成分 | 描述 | 现象学特征 |
|------|------|-----------|
| 💓 情感共鸣 | 身体和情绪层面的自动共鸣 | 前反思、具身性 |
| 🧠 认知理解 | 理解他人的观点和处境 | 反思性、想象性 |
| 🚧 自我 - 他者区分 | 保持清晰的边界 | 边界意识、自我感 |
| 💝 关怀动机 | 想要关心和支持的愿望 | 伦理性、关系性 |

## 共情的层次模型

**Level 1: 情绪感染** (Emotional Contagion)
- 自动的、无意识的情绪传递
- 例子：看到别人打哈欠，自己也打哈欠

**Level 2: 共情感受** (Empathic Feeling)
- 真正感受到他人的情绪体验
- 例子：为朋友的失去感到悲伤

**Level 3: 观点采择** (Perspective-Taking)
- 从他者的视角理解情境
- 例子：想象"如果我是 TA，会怎么想"

**Level 4: 交互共情** (Interactive Empathy)
- 双向的、关系性的深度连接
- 例子：与朋友共同探索情绪，相互确认

## 现象学共情方法

### 1. 悬置判断 (Epoché)
放下自己的预设、评判和解决方案，如实地让他者的体验显现。

### 2. 想象性变体 (Imaginative Variation)
通过想象探索多种可能性：
- "如果从 TA 的角度看，这件事是什么样的？"
- "TA 的成长经历如何影响 TA 的反应？"
- "TA 的价值观和信念是什么？"

### 3. 保持好奇 (Curiosity)
承认他者永远有神秘性，不可能被完全理解。
- "我可能误解了 TA"
- "TA 的体验可能与我完全不同"
- "我愿意被 TA 纠正"

### 4. 身体作为媒介 (Body as Medium)
通过自己的身体感受理解他者：
- 注意身体的共鸣反应
- 感受情绪的具身特征
- 用身体锚定自我感

## 共情边界与自我保护

### 预警信号

⚠️ **过度认同**: "TA 的痛苦就是我的痛苦"
⚠️ **共情疲劳**: "我感到精疲力尽，不想再听任何人倾诉"
⚠️ **替代性创伤**: "我开始做噩梦，对世界失去信心"
⚠️ **拯救者情结**: "只有我能帮 TA，TA 没有我不行"

### 健康边界的标志

✅ 能够感受他人的情绪，但不被淹没
✅ 关心他人，同时照顾自己的需求
✅ 提供支持，但不承担他人的责任
✅ 保持连接，同时尊重差异

### 自我关怀练习

**1. 情绪容器可视化**
想象你的情绪容量是一个杯子。
在倒水给他人之前，先确保自己的杯子是满的。

**2. 边界设定语句**
- "我关心你，但我现在需要休息。"
- "我可以倾听，但我不能解决这个问题。"
- "这是你的情绪，我尊重它，但它不属于我。"

**3. 身体锚定**
- 感受脚踩地面的感觉
- 深呼吸，将注意力带回身体
- 对自己说："我在这里，我是安全的"

## 与其他模块的关系

| 模块 | 关系 |
|------|------|
| autonomous-emotion | 共情中的情绪共鸣机制 |
| meta-emotion | 对共情体验的元情绪 |
| self-compassion | 共情疲劳的自我关怀干预 |
| phenomenological-emotion | 现象学方法的应用 |
| social-psychology | 观点采择与社会认知 |
| mindfulness | 正念在共情中的临在品质 |

## 理论来源

- **Scheler, M. (1912)**. The Nature of Sympathy
- **Walther, G. (1923)**. Zur Ontologie der sozialen Gemeinschaften
- **Husserl, E. (1913)**. Ideas Pertaining to a Pure Phenomenology
- **Zahavi, D. (2014)**. Self and Other: Exploring Subjectivity, Empathy, and Shame
- **SEP Entry**: Self-Consciousness (2023)
- **SEP Entry**: Collective Intentionality (2023)
- **SEP Entry**: Phenomenology (2023)

## 使用示例

\`\`\`
用户："我朋友最近很抑郁，我也不知道怎么帮 TA"

共情分析:
- 情感共鸣：检测到关心、无助感
- 观点采择：需要引导理解朋友的体验
- 边界检查：检测是否有过度承担倾向

回应:
💗 [共情现象学分析]

🔍 情感共鸣检测:
   我感受到你对朋友的深切关心，以及想要帮助却不知如何着力的无助感。
   这种"想要做点什么"的冲动，正是共情的自然表达。

🎭 观点采择引导:
   让我们一起尝试理解你朋友的体验：
   
   • 想象一下：如果你的内心世界像一间屋子，
     抑郁可能让这间屋子变得怎样？
   
   • 从 TA 的角度看：
     - 每天醒来可能是什么样的感受？
     - TA 可能最需要什么？

   ⚠️ 边界提醒:
     记住：TA 的情绪属于 TA，你的情绪属于你。
     你可以陪伴，但不必承担 TA 的全部痛苦。

💡 现象学洞见:
   真正的共情不是"我懂你的感受"，
   而是"我愿意陪伴你探索你的感受"。
\`\`\`
`;
  }
}

// ============ 导出 ============

module.exports = {
  EmpathyPhenomenologyModule,
  assessResonanceIntensity,
  identifyEmpathyType,
  assessEmpathyDepth,
  detectEmpathyBoundaries,
  guidePerspectiveTaking
};
