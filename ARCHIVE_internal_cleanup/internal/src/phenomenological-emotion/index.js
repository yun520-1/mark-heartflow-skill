/**
 * 现象学情绪体验模块 (Phenomenological Emotion Experience Module)
 * v3.18.0 新增
 * 
 * 基于 SEP 现象学与情绪理论整合：
 * - 现象学第一人称体验结构 (Husserl, Heidegger, Merleau-Ponty, Sartre)
 * - 情绪的意向性 (intentionality)：情绪总是关于某物的
 * - 具身性 (embodiment)：情绪体验的身体维度
 * - 时间性 (temporality)：情绪在时间流中的展开
 * - 自我意识 (self-consciousness)：情绪中的自我觉知
 * 
 * 核心理论来源：
 * - Stanford Encyclopedia of Philosophy: Phenomenology, Emotion, Self-Knowledge
 * - 情绪三大传统：感受传统、评价传统、动机传统的现象学整合
 */

class PhenomenologicalEmotionModule {
  constructor() {
    this.name = 'PhenomenologicalEmotion';
    this.version = '3.18.0';
    this.description = '基于现象学的情绪体验分析与第一人称意识结构探索';
    
    // 现象学情绪体验的核心维度
    this.dimensions = {
      intentionality: {
        name: '意向性',
        description: '情绪指向的对象及其意义建构',
        questions: [
          '这个情绪是关于什么的？',
          '它揭示了你对这个对象的什么看法？',
          '这个对象在你 experience 中呈现为什么意义？'
        ]
      },
      embodiment: {
        name: '具身性',
        description: '情绪在身体中的体验方式',
        questions: [
          '这个情绪在你的身体哪里感受最明显？',
          '它有怎样的质感、温度、重量或运动感？',
          '你的身体姿势/呼吸/肌肉张力是怎样的？'
        ]
      },
      temporality: {
        name: '时间性',
        description: '情绪在时间中的展开方式',
        questions: [
          '这个情绪何时开始？它是突然的还是渐进的？',
          '它在过去-现在-未来的时间流中如何变化？',
          '它让你联想到过去的什么经历？'
        ]
      },
      selfAwareness: {
        name: '自我觉知',
        description: '情绪中的自我意识状态',
        questions: [
          '在这个情绪中，你如何体验自己？',
          '这个情绪揭示了你的什么价值观或关切？',
          '你与这个情绪的关系是什么（认同/抗拒/观察）？'
        ]
      },
      intersubjectivity: {
        name: '主体间性',
        description: '情绪中的他人维度',
        questions: [
          '这个情绪涉及或指向哪些他人？',
          '你如何理解他们在这个情境中的体验？',
          '这个情绪如何影响你与他人的关系感？'
        ]
      }
    };
    
    // 现象学还原步骤 (Epoché & Reduction)
    this.reductionSteps = [
      {
        step: 1,
        name: '悬置 (Epoché)',
        instruction: '暂时搁置对情绪的判断和解释',
        prompt: '先不急着说这个情绪是"好"还是"坏"，也不急着分析原因。只是描述它本身的样子。'
      },
      {
        step: 2,
        name: '描述 (Description)',
        instruction: '纯粹描述体验的第一人称内容',
        prompt: '用尽可能丰富的语言描述这个情绪的质感、颜色、形状、运动方式。'
      },
      {
        step: 3,
        name: '本质直观 (Eidetic Intuition)',
        instruction: '探索这个情绪体验的本质结构',
        prompt: '如果剥离所有具体细节，这个情绪最核心的"是什么"？'
      },
      {
        step: 4,
        name: '意义阐释 (Hermeneutic Interpretation)',
        instruction: '将情绪置于生活世界的意义网络中理解',
        prompt: '这个情绪揭示了你的生活中什么重要的主题或关切？'
      }
    ];
    
    // 情绪的现象学类型 (基于体验结构而非生理反应)
    this.phenomenologicalTypes = {
      directedEmotions: {
        name: '指向性情绪',
        examples: ['愤怒 (关于某事的不公)', '恐惧 (关于某物的威胁)', '爱 (关于某人的珍视)'],
        characteristic: '具有明确的意向对象'
      },
      moodStates: {
        name: '心境状态',
        examples: ['忧郁', '焦虑', '宁静'],
        characteristic: '弥散性的背景体验，不指向特定对象'
      },
      selfConsciousEmotions: {
        name: '自我意识情绪',
        examples: ['羞耻', '骄傲', '内疚'],
        characteristic: '以自我为对象的情绪反思'
      },
      existentialEmotions: {
        name: '存在性情绪',
        examples: ['敬畏', '荒诞感', '本真性体验'],
        characteristic: '揭示存在本身的结构'
      }
    };
  }
  
  /**
   * 现象学情绪探索对话
   */
  async explore(userMessage, emotionContext) {
    const exploration = {
      module: this.name,
      version: this.version,
      timestamp: new Date().toISOString(),
      phases: []
    };
    
    // Phase 1: 悬置引导
    const epoché = {
      phase: '悬置 (Epoché)',
      guidance: this.reductionSteps[0].prompt,
      purpose: '搁置预设判断，回到事物本身'
    };
    exploration.phases.push(epoché);
    
    // Phase 2: 五维度探索
    const dimensionExploration = [];
    for (const [key, dim] of Object.entries(this.dimensions)) {
      dimensionExploration.push({
        dimension: dim.name,
        questions: dim.questions,
        purpose: dim.description
      });
    }
    exploration.phases.push({
      phase: '五维度探索',
      dimensions: dimensionExploration
    });
    
    // Phase 3: 现象学还原
    exploration.phases.push({
      phase: '现象学还原四步',
      steps: this.reductionSteps
    });
    
    // Phase 4: 情绪类型识别
    exploration.phases.push({
      phase: '情绪现象学类型',
      types: this.phenomenologicalTypes,
      guidance: '识别你的情绪体验属于哪种现象学类型，这有助于理解它的功能和意义'
    });
    
    return {
      exploration,
      response: this._generateResponse(exploration, emotionContext)
    };
  }
  
  /**
   * 生成现象学风格的回应
   */
  _generateResponse(exploration, emotionContext) {
    const currentEmotion = emotionContext?.emotion || '当前情绪';
    const intensity = emotionContext?.intensity || '中等';
    
    return {
      text: `🧠 **现象学情绪探索** (v${this.version})

我邀请你一起进行一次现象学式的情绪探索。这不是分析或治疗，而是回到情绪体验本身，如实地描述它的样子。

**当前状态**: ${currentEmotion} (强度：${intensity})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔸 第一步：悬置 (Epoché)

现象学的第一步是"回到事物本身"。暂时放下对情绪的判断（好/坏、应该/不应该）、解释（为什么会有这个情绪）、和解决方案（如何消除它）。

**邀请**: 只是如实地注意这个情绪的本来面目，不做任何评价。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔸 第二步：五维度探索

让我们从五个维度探索这个情绪的体验结构：

### 1️⃣ 意向性 (Intentionality)
情绪总是"关于某物的"。你的情绪指向什么？
- 这个情绪是关于什么的？
- 它揭示了你对这个对象的什么看法？
- 这个对象在你的体验中呈现为什么意义？

### 2️⃣ 具身性 (Embodiment)
情绪在身体中如何呈现？
- 这个情绪在你的身体哪里感受最明显？
- 它有怎样的质感、温度、重量或运动感？
- 你的身体姿势/呼吸/肌肉张力是怎样的？

### 3️⃣ 时间性 (Temporality)
情绪在时间中如何展开？
- 这个情绪何时开始？它是突然的还是渐进的？
- 它在过去 - 现在 - 未来的时间流中如何变化？
- 它让你联想到过去的什么经历？

### 4️⃣ 自我觉知 (Self-Awareness)
情绪中的自我意识状态
- 在这个情绪中，你如何体验自己？
- 这个情绪揭示了你的什么价值观或关切？
- 你与这个情绪的关系是什么（认同/抗拒/观察）？

### 5️⃣ 主体间性 (Intersubjectivity)
情绪中的他人维度
- 这个情绪涉及或指向哪些他人？
- 你如何理解他们在这个情境中的体验？
- 这个情绪如何影响你与他人的关系感？

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔸 第三步：现象学还原四步

完成上述探索后，我们可以进行更深层次的现象学还原：

**1. 悬置** → 搁置预设判断
**2. 描述** → 纯粹描述第一人称体验
**3. 本质直观** → 探索情绪的本质结构
**4. 意义阐释** → 置于生活世界的意义网络

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔸 情绪现象学类型

你的情绪体验可能属于以下类型之一：

| 类型 | 特征 | 示例 |
|------|------|------|
| **指向性情绪** | 具有明确的意向对象 | 愤怒 (关于不公)、恐惧 (关于威胁)、爱 (关于珍视) |
| **心境状态** | 弥散性的背景体验 | 忧郁、焦虑、宁静 |
| **自我意识情绪** | 以自我为对象 | 羞耻、骄傲、内疚 |
| **存在性情绪** | 揭示存在结构 | 敬畏、荒诞感、本真性体验 |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💡 如何使用**:
你可以选择任何一个维度开始探索，或者告诉我你想深入了解哪个方面。现象学不是快速解决方案，而是一种深度理解自己体验的方式。

你想从哪个维度开始？或者你有什么想分享的第一人称体验描述？`,
      
      explorationData: exploration,
      suggestedNextSteps: [
        '选择一个维度进行深入探索',
        '分享你的第一人称体验描述',
        '询问情绪现象学类型识别',
        '进行完整的现象学还原练习'
      ]
    };
  }
  
  /**
   * 模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      dimensions: Object.keys(this.dimensions),
      theoreticalBasis: [
        'SEP Phenomenology',
        'SEP Emotion',
        'SEP Self-Knowledge',
        'Husserlian Phenomenology',
        'Heideggerian Hermeneutics',
        'Merleau-Ponty Embodiment',
        'Sartrean Self-Consciousness'
      ]
    };
  }
}

module.exports = { PhenomenologicalEmotionModule };
