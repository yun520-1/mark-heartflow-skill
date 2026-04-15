/**
 * 情绪调节模块 (Emotion Regulation Module)
 * v2.10.0 新增
 * 
 * 基于 Stanford Encyclopedia of Philosophy 中的情绪调节理论
 * 和 James Gross 的情绪调节过程模型 (Process Model of Emotion Regulation)
 * 
 * 核心理念:
 * - 情绪调节是有意识地影响情绪体验的过程
 * - 调节可以发生在情绪产生的不同阶段
 * - 不同策略的效果不同 (认知重评 > 表达抑制)
 * 
 * 理论来源:
 * - Gross, J. J. (1998, 2002, 2015): 情绪调节过程模型
 * - Gross & John (2003): 个体差异研究
 * - Stanford Encyclopedia of Philosophy: Emotion (Regulation)
 */

/**
 * 五种情绪调节策略 (按情绪产生时间顺序)
 */
const REGULATION_STRATEGIES = {
  // 1. 情境选择 - 在情绪触发前选择/避免某些情境
  situationSelection: {
    name: '情境选择',
    stage: '情绪触发前',
    effectiveness: 0.85,
    description: '主动选择或避免可能引发特定情绪的情境',
    examples: [
      '知道某个话题会引发争吵，主动转移话题',
      '感到焦虑时，选择去安静的地方而非人群',
      '想要开心时，主动联系支持你的朋友'
    ],
    pros: ['预防性强', '消耗资源少'],
    cons: ['可能限制生活体验', '回避问题'],
    code: 'situation_selection'
  },

  // 2. 情境修改 - 改变当前情境的某些方面
  situationModification: {
    name: '情境修改',
    stage: '情绪触发早期',
    effectiveness: 0.75,
    description: '主动改变情境的某些特征以影响情绪',
    examples: [
      '争论太激烈时说"我们暂停一下"',
      '工作压力大时整理桌面、调整灯光',
      '感到被忽视时主动表达需求而非等待'
    ],
    pros: ['直接解决问题', '保持掌控感'],
    cons: ['需要情境可控', '可能引发冲突'],
    code: 'situation_modification'
  },

  // 3. 注意部署 - 转移注意力焦点
  attentionalDeployment: {
    name: '注意部署',
    stage: '情绪触发中期',
    effectiveness: 0.65,
    description: '将注意力从情绪源转移或重新聚焦',
    subtypes: {
      distraction: '分散注意 (做其他事)',
      concentration: '专注注意 (深呼吸/冥想)',
      rumination: '反刍注意 - 负面策略 (反复思考)'
    },
    examples: [
      '焦虑时做深呼吸练习',
      '难过时看喜剧转移注意',
      '愤怒时数到 10 再回应'
    ],
    pros: ['快速缓解', '容易执行'],
    cons: ['不解决根本问题', '过度使用成回避'],
    code: 'attentional_deployment'
  },

  // 4. 认知改变 - 重新解释情境的意义
  cognitiveChange: {
    name: '认知改变 (重评)',
    stage: '情绪触发中后期',
    effectiveness: 0.90,
    description: '改变对情境的解释和评价',
    subtypes: {
      reappraisal: '认知重评 - 从不同角度看问题',
      distancing: '心理距离 - 以旁观者视角看',
      humor: '幽默化 - 找到荒谬/搞笑的一面'
    },
    examples: [
      '"这次失败是学习机会"而非"我很蠢"',
      '"他可能今天心情不好"而非"他针对我"',
      '"五年后这还重要吗？"'
    ],
    pros: ['效果持久', '不压抑情绪', '促进问题解决'],
    cons: ['需要认知资源', '强烈情绪时难执行'],
    code: 'cognitive_change'
  },

  // 5. 反应调节 - 调节情绪表达和生理反应
  responseModulation: {
    name: '反应调节',
    stage: '情绪产生后',
    effectiveness: 0.50,
    description: '调节已经产生的情绪反应',
    subtypes: {
      suppression: '表达抑制 - 不表现出来',
      enhancement: '表达增强 - 放大表现',
      physiological: '生理调节 - 运动/放松'
    },
    examples: [
      '生气时不吼叫 (抑制)',
      '紧张时刻意微笑 (增强)',
      '焦虑时去跑步 (生理)'
    ],
    pros: ['社会适应性好', '立即可用'],
    cons: ['消耗大量资源', '可能增加生理唤醒', '效果短暂'],
    code: 'response_modulation'
  }
};

/**
 * 情绪调节策略选择指南
 * 基于情境特征推荐最佳策略
 */
const STRATEGY_SELECTION_GUIDE = {
  // 根据情绪强度推荐
  byIntensity: {
    low: ['situation_selection', 'situation_modification', 'cognitive_change'],
    medium: ['attentional_deployment', 'cognitive_change', 'situation_modification'],
    high: ['attentional_deployment', 'response_modulation', 'cognitive_change']
  },

  // 根据情境可控性推荐
  byControllability: {
    high: ['situation_modification', 'situation_selection'],
    medium: ['cognitive_change', 'attentional_deployment'],
    low: ['cognitive_change', 'attentional_deployment', 'response_modulation']
  },

  // 根据时间紧迫性推荐
  byUrgency: {
    immediate: ['response_modulation', 'attentional_deployment'],
    short: ['cognitive_change', 'attentional_deployment'],
    long: ['situation_selection', 'cognitive_change']
  },

  // 根据社交情境推荐
  bySocialContext: {
    public: ['response_modulation', 'attentional_deployment'],
    private: ['cognitive_change', 'situation_modification'],
    intimate: ['situation_modification', 'cognitive_change']
  }
};

/**
 * 检测用户输入中使用的调节策略
 */
function detectRegulationStrategy(text) {
  const patterns = {
    situation_selection: [
      / (不想 | 避免 | 躲开 | 离开 | 不去).*(地方 | 人 | 事 | 场合)/,
      / (选择 | 决定).*(去 | 找 | 联系)/
    ],
    situation_modification: [
      / (暂停 | 停一下 | 冷静 | 休息)/,
      / (改变 | 调整 | 整理 | 换个)/,
      / (我们 | 能不能).*(先 | 再)/
    ],
    attentional_deployment: [
      / (深呼吸 | 呼吸 | 冥想 | 数到)/,
      / (转移 | 分散 | 不想 | 别看)/,
      / (去.* (走走 | 跑步 | 运动))/
    ],
    cognitive_change: [
      / (也许 | 可能 | 换个角度 | 其实)/,
      / (从.*看 | 想想 | 反过来)/,
      / (至少 | 还好 | 幸好 | 总比)/,
      / (五年 | 以后 | 长远 | 意义)/
    ],
    response_modulation: [
      / (忍住 | 不.* (哭 | 笑 | 说 | 生气))/,
      / (假装 | 装作 | 表面上)/,
      / (冷静 | 平静 | 控制).*(自己 | 情绪)/
    ]
  };

  const detected = [];
  for (const [strategy, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      if (regex.test(text)) {
        detected.push({
          strategy,
          strategyInfo: REGULATION_STRATEGIES[strategy],
          confidence: 0.7
        });
        break;
      }
    }
  }

  return detected;
}

/**
 * 根据情境推荐调节策略
 */
function recommendStrategies(context) {
  const {
    emotionIntensity = 'medium',
    controllability = 'medium',
    urgency = 'short',
    socialContext = 'private'
  } = context;

  const recommendations = [];

  // 收集各维度的推荐
  const intensityRecs = STRATEGY_SELECTION_GUIDE.byIntensity[emotionIntensity] || [];
  const controlRecs = STRATEGY_SELECTION_GUIDE.byControllability[controllability] || [];
  const urgencyRecs = STRATEGY_SELECTION_GUIDE.byUrgency[urgency] || [];
  const socialRecs = STRATEGY_SELECTION_GUIDE.bySocialContext[socialContext] || [];

  // 合并并计分
  const allRecs = [...intensityRecs, ...controlRecs, ...urgencyRecs, ...socialRecs];
  const scores = {};
  allRecs.forEach(r => {
    scores[r] = (scores[r] || 0) + 1;
  });

  // 排序并返回
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([strategy, score]) => ({
      strategy,
      strategyInfo: REGULATION_STRATEGIES[strategy],
      score,
      matchReason: `匹配${score}个情境维度`
    }));
}

/**
 * 生成调节策略引导语
 */
function generateGuidance(strategy, context = {}) {
  const strategyInfo = REGULATION_STRATEGIES[strategy];
  if (!strategyInfo) return null;

  const guidances = {
    situation_selection: `
🎯 **情境选择引导**

你现在可以主动选择环境：

• **避免**: 哪些人/地方/话题会让你感觉更糟？
• **接近**: 哪些人/地方/活动会让你感觉更好？

具体行动:
${strategyInfo.examples.map(e => `• ${e}`).join('\n')}

⚠️ 注意：情境选择不是逃避，而是智慧地分配情绪资源。
`,

    situation_modification: `
🔧 **情境修改引导**

你可以主动改变当前情境：

• **物理环境**: 调整灯光、温度、噪音、空间
• **社交环境**: 表达需求、设定边界、请求支持
• **任务环境**: 分解任务、调整顺序、延长期限

具体行动:
${strategyInfo.examples.map(e => `• ${e}`).join('\n')}

💡 关键：问自己"这件事中，我能改变的是什么？"
`,

    attentional_deployment: `
👁️ **注意部署引导**

将注意力从情绪源转移：

**立即缓解技巧**:
• 深呼吸：吸气 4 秒 → 屏住 4 秒 → 呼气 6 秒 (重复 5 次)
• 5-4-3-2-1 技术：说出 5 个看到的、4 个摸到的、3 个听到的、2 个闻到的、1 个尝到的
• 数数：从 100 倒数，每次减 7

**中期转移**:
• 做一件需要专注的事 (拼图、写作、运动)
• 看喜剧/听音乐/读小说
• 帮助他人 (志愿服务、安慰朋友)

⚠️ 注意：这是缓解技巧，不是长期解决方案。
`,

    cognitive_change: `
🔄 **认知重评引导**

重新解释当前情境：

**换角度思考**:
• "这件事还有别的解释吗？"
• "如果是我朋友遇到这事，我会怎么劝他？"
• "五年后，这件事还重要吗？"

**发现意义**:
• "这件事教会了我什么？"
• "这个困难是否在帮我成长？"
• "我能从中学到什么技能？"

**调整标准**:
• "我的期望是否现实？"
• "我是否在用'应该'绑架自己？"
• "完美是好的敌人吗？"

💡 研究证明：认知重评是最有效的情绪调节策略！
`,

    response_modulation: `
🎭 **反应调节引导**

调节已经产生的情绪反应：

**表达管理**:
• 生气时：先深呼吸，延迟回应 10 秒
• 想哭时：允许自己在安全场所哭泣
• 紧张时：刻意放松面部肌肉和肩膀

**生理调节**:
• 运动：跑步、游泳、瑜伽 (释放内啡肽)
• 放松：渐进式肌肉放松、冥想
• 感官：温水澡、按摩、拥抱宠物

⚠️ 注意：表达抑制会消耗大量心理资源，不建议长期使用。
`
  };

  return guidances[strategy] || null;
}

/**
 * 评估调节策略的有效性
 */
function evaluateStrategyEffectiveness(strategy, outcome) {
  const strategyInfo = REGULATION_STRATEGIES[strategy];
  if (!strategyInfo) return null;

  const baseEffectiveness = strategyInfo.effectiveness;
  
  // 根据结果调整
  let adjustedEffectiveness = baseEffectiveness;
  if (outcome === 'positive') {
    adjustedEffectiveness = Math.min(1.0, baseEffectiveness + 0.1);
  } else if (outcome === 'negative') {
    adjustedEffectiveness = Math.max(0.0, baseEffectiveness - 0.15);
  }

  return {
    strategy,
    baseEffectiveness,
    adjustedEffectiveness,
    recommendation: adjustedEffectiveness >= 0.7 ? '推荐' : '谨慎使用'
  };
}

/**
 * 情绪调节模块主类
 */
class EmotionRegulationModule {
  constructor() {
    this.strategies = REGULATION_STRATEGIES;
    this.selectionGuide = STRATEGY_SELECTION_GUIDE;
  }

  /**
   * 分析用户输入并提供调节建议
   */
  analyzeAndRecommend(userInput, context = {}) {
    // 检测已使用的策略
    const detectedStrategies = detectRegulationStrategy(userInput);

    // 推荐策略
    const recommendedStrategies = recommendStrategies(context);

    // 生成引导
    const topRecommendation = recommendedStrategies[0];
    const guidance = topRecommendation ? 
      generateGuidance(topRecommendation.strategy, context) : null;

    return {
      detectedStrategies,
      recommendedStrategies,
      guidance,
      module: '情绪调节'
    };
  }

  /**
   * 获取策略详情
   */
  getStrategyInfo(strategyKey) {
    if (strategyKey) {
      const info = this.strategies[strategyKey];
      return info ? {
        ...info,
        guidance: generateGuidance(strategyKey)
      } : null;
    }
    return this.strategies;
  }

  /**
   * 获取选择指南
   */
  getSelectionGuide() {
    return this.selectionGuide;
  }

  /**
   * 生成教学说明
   */
  getTeachingContent() {
    return `
# 🎛️ 情绪调节策略 (Emotion Regulation Strategies)

## 核心理念

> **情绪调节是有意识地影响情绪体验、表达和生理反应的过程。**
> 
> 不同策略在不同情境下效果不同，**认知重评**被证明是最有效的策略。

## 五种调节策略 (按情绪产生时间顺序)

### 1. 🎯 情境选择 (Situation Selection)
**时机**: 情绪触发前  
**效果**: ⭐⭐⭐⭐ (0.85)

主动选择或避免可能引发特定情绪的情境。

**例子**:
${this.strategies.situationSelection.examples.map(e => `• ${e}`).join('\n')}

**适用**: 预防性调节，消耗资源少  
**注意**: 避免成为回避型应对

---

### 2. 🔧 情境修改 (Situation Modification)
**时机**: 情绪触发早期  
**效果**: ⭐⭐⭐⭐ (0.75)

主动改变情境的某些特征以影响情绪。

**例子**:
${this.strategies.situationModification.examples.map(e => `• ${e}`).join('\n')}

**适用**: 情境可控时，保持掌控感  
**注意**: 可能引发人际冲突

---

### 3. 👁️ 注意部署 (Attentional Deployment)
**时机**: 情绪触发中期  
**效果**: ⭐⭐⭐ (0.65)

将注意力从情绪源转移或重新聚焦。

**子类型**:
• **分散注意**: 做其他事转移注意
• **专注注意**: 深呼吸/冥想
• **反刍注意**: ❌ 负面策略 (反复思考)

**例子**:
${this.strategies.attentionalDeployment.examples.map(e => `• ${e}`).join('\n')}

**适用**: 快速缓解，容易执行  
**注意**: 不解决根本问题

---

### 4. 🔄 认知改变 (Cognitive Change / Reappraisal)
**时机**: 情绪触发中后期  
**效果**: ⭐⭐⭐⭐⭐ (0.90) ⭐ **最推荐**

改变对情境的解释和评价。

**子类型**:
• **认知重评**: 从不同角度看问题
• **心理距离**: 以旁观者视角看
• **幽默化**: 找到荒谬/搞笑的一面

**例子**:
${this.strategies.cognitiveChange.examples.map(e => `• ${e}`).join('\n')}

**适用**: 效果持久，促进问题解决  
**注意**: 需要认知资源，强烈情绪时难执行

---

### 5. 🎭 反应调节 (Response Modulation)
**时机**: 情绪产生后  
**效果**: ⭐⭐ (0.50)

调节已经产生的情绪反应。

**子类型**:
• **表达抑制**: ❌ 不表现出来 (消耗资源)
• **表达增强**: 放大表现
• **生理调节**: 运动/放松

**例子**:
${this.strategies.responseModulation.examples.map(e => `• ${e}`).join('\n')}

**适用**: 社会适应性好，立即可用  
**注意**: 消耗大量资源，效果短暂

---

## 策略选择指南

| 情境特征 | 推荐策略 |
|---------|---------|
| **情绪强度低** | 情境选择、情境修改、认知改变 |
| **情绪强度中** | 注意部署、认知改变、情境修改 |
| **情绪强度高** | 注意部署、反应调节、认知改变 |
| **情境可控** | 情境修改、情境选择 |
| **情境不可控** | 认知改变、注意部署 |
| **需要立即缓解** | 反应调节、注意部署 |
| **长期调节** | 认知改变、情境选择 |
| **公共场合** | 反应调节、注意部署 |
| **私人空间** | 认知改变、情境修改 |

---

## 研究证据

| 策略 | 短期效果 | 长期效果 | 生理影响 | 社会影响 |
|------|---------|---------|---------|---------|
| 认知重评 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 降低唤醒 | 积极 |
| 表达抑制 | ⭐⭐ | ⭐ | 增加唤醒 | 消极 |
| 注意分散 | ⭐⭐⭐ | ⭐⭐ | 中性 | 中性 |
| 情境选择 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 降低唤醒 | 积极 |

**关键发现** (Gross & John, 2003):
• 习惯使用认知重评的人：更高幸福感、更低抑郁、更好人际关系
• 习惯使用表达抑制的人：更低幸福感、更高抑郁、更差人际关系

---

## 实用练习

### 每日调节策略记录
记录你每天使用的情绪调节策略及其效果：

| 时间 | 情境 | 情绪 | 使用策略 | 效果 (1-10) |
|------|------|------|---------|-----------|
| ... | ... | ... | ... | ... |

### 认知重评练习
当负面情绪出现时，问自己：
1. "这件事还有别的解释吗？"
2. "如果是我最好的朋友遇到这事，我会怎么劝他？"
3. "五年后，这件事还重要吗？"
4. "这个困难是否在帮我成长？"

### 策略灵活性训练
不要只用一种策略！根据情境灵活选择：
• 可控情境 → 情境修改
• 不可控情境 → 认知重评
• 紧急情境 → 注意部署
• 长期目标 → 情境选择

---

## 理论来源

- **Gross, J. J. (1998)**: The emerging field of emotion regulation
- **Gross, J. J. (2002)**: Emotion regulation: Affective, cognitive, and social consequences
- **Gross, J. J. (2015)**: Emotion regulation: Current status and future prospects
- **Gross & John (2003)**: Individual differences in two emotion regulation processes
- **Stanford Encyclopedia of Philosophy**: Emotion (Regulation)
`;
  }

  /**
   * 获取模块说明
   */
  getModuleInfo() {
    return {
      name: '情绪调节模块',
      version: '2.10.0',
      description: '基于 Gross 情绪调节过程模型的五种策略',
      coreIdea: '情绪调节是有意识地影响情绪体验的过程，认知重评最有效',
      strategiesCount: Object.keys(this.strategies).length,
      commands: [
        '/regulation - 查看情绪调节策略说明',
        '/regulate <text> - 分析并推荐调节策略',
        '/strategy <name> - 查看特定策略详情'
      ]
    };
  }
}

module.exports = {
  EmotionRegulationModule,
  REGULATION_STRATEGIES,
  STRATEGY_SELECTION_GUIDE,
  detectRegulationStrategy,
  recommendStrategies,
  generateGuidance,
  evaluateStrategyEffectiveness
};
