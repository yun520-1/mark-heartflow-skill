/**
 * 情绪评价理论模块 (Appraisal Theory Module)
 * v2.10.0 新增
 * 
 * 基于 Stanford Encyclopedia of Philosophy 中的情绪评价传统 (Evaluative Tradition)
 * 
 * 核心理念：
 * - 情绪不是对事件的直接反应，而是对事件的评价/解释的结果
 * - 同样的事件，不同的评价 → 不同的情绪
 * - 通过改变评价，可以改变情绪体验
 * 
 * 理论来源:
 * - Scherer, K. R. (2001): 评价维度模型
 * - Lazarus, R. S. (1991): 评价与情绪
 * - Arnold, M. B. (1960): 评价理论先驱
 */

const { 
  appraisalDimensions, 
  appraisalToEmotion, 
  reframingStrategies,
  detectAppraisals,
  inferEmotionFromAppraisals,
  generateReframingSuggestions 
} = require('./dimensions');

const { AppraisalReframer } = require('./reframing');

class AppraisalModule {
  constructor() {
    this.reframer = new AppraisalReframer();
    
    // 评价维度说明
    this.dimensionDescriptions = {
      novelty: {
        name: '新奇性',
        question: '这是预期的还是意外的？',
        emotions: '惊讶 vs 平静'
      },
      valence: {
        name: '效价',
        question: '这是好的还是坏的？',
        emotions: '愉悦 vs 不愉悦'
      },
      goalRelevance: {
        name: '目标相关性',
        question: '这与我的目标相关吗？',
        emotions: '关切 vs 漠然'
      },
      goalCongruence: {
        name: '目标一致性',
        question: '这促进还是阻碍我的目标？',
        emotions: '高兴 vs 沮丧'
      },
      agency: {
        name: '能动性',
        question: '谁/什么导致了这个？',
        emotions: '愤怒 (他人) vs 内疚 (自己) vs 悲伤 (环境)'
      },
      control: {
        name: '控制性',
        question: '我能应对/改变这个吗？',
        emotions: '自信 vs 焦虑/无助'
      },
      norms: {
        name: '规范性',
        question: '这符合我的价值观吗？',
        emotions: '骄傲 vs 羞愧'
      }
    };
  }

  /**
   * 检测用户输入中的评价模式并提供回应
   */
  detectAndRespond(userInput) {
    // 使用重构器进行分析
    const result = this.reframer.analyzeAndReframe(userInput);
    
    return {
      type: 'appraisal',
      module: '情绪评价理论',
      analysis: result,
      response: result
    };
  }

  /**
   * 分析文本的评价维度
   */
  analyzeAppraisals(text) {
    const appraisals = detectAppraisals(text);
    const emotion = inferEmotionFromAppraisals(appraisals);
    
    return {
      appraisals,
      emotion,
      suggestions: generateReframingSuggestions(appraisals, emotion.emotion)
    };
  }

  /**
   * 获取评价维度说明
   */
  getDimensionInfo(dimensionKey) {
    if (dimensionKey) {
      return this.dimensionDescriptions[dimensionKey] || null;
    }
    return this.dimensionDescriptions;
  }

  /**
   * 获取评价重构策略
   */
  getReframingStrategy(strategyKey) {
    if (strategyKey) {
      return reframingStrategies[strategyKey] || null;
    }
    return reframingStrategies;
  }

  /**
   * 获取评价→情绪映射
   */
  getAppraisalToEmotionMappings() {
    return appraisalToEmotion;
  }

  /**
   * 提供评价重构引导
   */
  guideReframing(userInput) {
    return this.reframer.analyzeAndReframe(userInput);
  }

  /**
   * 获取模块说明
   */
  getModuleInfo() {
    return {
      name: '情绪评价理论模块',
      version: '2.10.0',
      description: '基于评价理论的情绪分析与重构引导',
      coreIdea: '情绪不是对事件的直接反应，而是对事件的评价/解释的结果',
      dimensions: Object.keys(this.dimensionDescriptions).length,
      strategies: Object.keys(reframingStrategies).length,
      commands: [
        '/appraisal - 查看情绪评价理论说明',
        '/appraise <text> - 分析指定文本的评价维度',
        '/reframe - 获取评价重构建议'
      ]
    };
  }

  /**
   * 生成教学说明
   */
  getTeachingContent() {
    return `
# 🔍 情绪评价理论 (Appraisal Theory)

## 核心理念

> **情绪不是对事件的直接反应，而是对事件的评价/解释的结果。**
> 
> 同样的事件，不同的评价 → 不同的情绪

## 七个评价维度

| 维度 | 核心问题 | 情绪影响 |
|------|---------|---------|
| 🆕 新奇性 | 这是预期的还是意外的？ | 惊讶 vs 平静 |
| 👍 效价 | 这是好的还是坏的？ | 愉悦 vs 不愉悦 |
| 🎯 目标相关性 | 这与我的目标相关吗？ | 关切 vs 漠然 |
| ✅ 目标一致性 | 这促进还是阻碍我的目标？ | 高兴 vs 沮丧 |
| 👤 能动性 | 谁/什么导致了这个？ | 愤怒 (他人) vs 内疚 (自己) |
| 🎮 控制性 | 我能应对/改变这个吗？ | 自信 vs 焦虑/无助 |
| 📜 规范性 | 这符合我的价值观吗？ | 骄傲 vs 羞愧 |

## 经典情绪模式

| 评价组合 | 产生的情绪 |
|---------|-----------|
| 他人导致 + 负面结果 + 目标受阻 | **愤怒** |
| 自己导致 + 负面结果 + 违反标准 | **内疚/羞愧** |
| 环境导致 + 负面结果 + 低控制感 | **焦虑/无助** |
| 意外 + 负面 | **震惊** |
| 意外 + 正面 | **惊喜** |
| 自己导致 + 正面结果 | **自豪** |
| 他人导致 + 正面结果 | **感激** |

## 评价重构技术

### 1. 能动性重构
从"他导致"转向"我选择如何回应"
- 问：在这件事中，我能控制的部分是什么？
- 问：除了责怪，我还能做什么来改善情况？

### 2. 控制性重构
区分可控与不可控，专注前者
- 问：这件事中，哪些是我完全无法控制的？
- 问：哪些是我部分或完全可控的？

### 3. 目标一致性重构
重新定义成功与失败
- 问：这个阻碍是否也可能是一个机会？
- 问：从长远看，这件事的意义可能是什么？

### 4. 规范性重构
从自我批评转向自我接纳
- 问：我的标准是否过于严苛？
- 问：如果是朋友犯了同样的错，我会怎么对他？

## 使用示例

\`\`\`
用户："他怎么能这样对我！太生气了！"

评价分析:
- 能动性：他人归因
- 效价：负面
- 目标一致性：不一致

回应:
🔍 [情绪评价分析]
   检测到评价模式：他人导致 + 负面结果 → 愤怒
   
💡 评价重构:
   愤怒告诉你：有人侵犯了你的边界或价值观。
   
   问自己:
   • 你的哪个边界被侵犯了？
   • 除了愤怒，还有什么方式可以保护这个边界？
   • 对方的行为是否有其他可能的解释？
\`\`\`

## 与其他模块的关系

| 模块 | 关系 |
|------|------|
| CBT | 认知扭曲 → 评价偏差 |
| 斯多葛 | 控制二分法 → 控制性评价 |
| 正念 | 不评判 → 暂停自动评价 |
| 情绪智力 | 情绪识别 → 评价识别 |
| 社会心理学 | 归因理论 → 能动性评价 |

## 理论来源

- **Scherer, K. R. (2001)**: 评价维度模型 (Scherer's Component Process Model)
- **Lazarus, R. S. (1991)**: 评价与情绪 (Emotion and Adaptation)
- **Arnold, M. B. (1960)**: 评价理论先驱 (Emotion and Personality)
- **Stanford Encyclopedia of Philosophy**: Emotion (Evaluative Tradition)
`;
  }
}

module.exports = { AppraisalModule };
