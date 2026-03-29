/**
 * EmotionIntegrationTheory - 情绪整合理论模块 v2.0
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 情绪理论权威内容
 * 
 * 三大传统整合:
 * 1. Feeling Tradition (感受传统) - 情绪作为独特的意识体验
 * 2. Evaluative Tradition (评估传统) - 情绪作为对情境的独特评估
 * 3. Motivational Tradition (动机传统) - 情绪作为独特的动机状态
 * 
 * 四大理论挑战:
 * 1. Differentiation (区分) - 情绪如何彼此区分，如何与非情绪状态区分
 * 2. Motivation (动机) - 情绪是否及如何激励行为
 * 3. Intentionality (意向性) - 情绪是否有对象指向性，是否可评价适当性
 * 4. Phenomenology (现象学) - 情绪是否总涉及主观体验，何种类型
 * 
 * @author HeartFlow Team
 * @version 2.0.0
 * @source SEP: https://plato.stanford.edu/entries/emotion/
 */

class EmotionIntegrationTheory {
  constructor() {
    this.version = '2.0.0';
    this.name = 'EmotionIntegrationTheory';
    this.description = '情绪整合理论 - SEP 三大传统 + 四大挑战整合';
    
    // 情绪组件 (基于 SEP 情绪理论)
    this.emotionComponents = {
      evaluative: '评估组件 (如：将熊评估为危险的)',
      physiological: '生理组件 (如：心率、血压升高)',
      phenomenological: '现象学组件 (如：不愉快的感受)',
      expressive: '表达组件 (如：面部表情)',
      behavioral: '行为组件 (如：逃跑倾向)',
      mental: '心理组件 (如：注意力聚焦)'
    };
    
    // 三大传统理论
    this.traditions = {
      feeling: {
        name: '感受传统',
        core: '情绪是独特的意识体验',
        keyFigure: 'William James (James-Lange 理论)',
        strength: '解释了情绪的现象学特征',
        weakness: '难以解释情绪的区分、动机和意向性',
        codeImplementation: this.implementFeelingTradition.bind(this)
      },
      evaluative: {
        name: '评估传统',
        core: '情绪是对情境的独特评估/评价',
        keyFigure: 'Aristotle, Nussbaum, Solomon',
        strength: '解释了情绪的意向性和适当性',
        weakness: '难以解释无意识情绪和快速情绪反应',
        codeImplementation: this.implementEvaluativeTradition.bind(this)
      },
      motivational: {
        name: '动机传统',
        core: '情绪是独特的动机状态',
        keyFigure: 'Frijda, Darwin',
        strength: '解释了情绪与行为的联系',
        weakness: '难以解释情绪与单纯欲望的区别',
        codeImplementation: this.implementMotivationalTradition.bind(this)
      }
    };
    
    // 四大理论挑战的解决方案
    this.challenges = {
      differentiation: {
        question: '情绪如何彼此区分？如何与非情绪状态区分？',
        solution: '原型理论 + 组件整合',
        implementation: this.solveDifferentiation.bind(this)
      },
      motivation: {
        question: '情绪是否及如何激励行为？',
        solution: '行动倾向 (action tendency) 理论',
        implementation: this.solveMotivation.bind(this)
      },
      intentionality: {
        question: '情绪是否有对象指向性？是否可评价适当性？',
        solution: '意向性内存在 (intentional inexistence) 理论',
        implementation: this.solveIntentionality.bind(this)
      },
      phenomenology: {
        question: '情绪是否总涉及主观体验？何种类型？',
        solution: '前反思自我意识 + 具身感受',
        implementation: this.solvePhenomenology.bind(this)
      }
    };
  }

  /**
   * 感受传统实现 - James-Lange 理论现代化
   * 核心：情绪是对生理变化的感知
   */
  implementFeelingTradition(emotionData) {
    return {
      tradition: 'Feeling Tradition',
      process: {
        step1: '感知刺激 (如：看到熊)',
        step2: '自动生理反应 (心跳加速、出汗等)',
        step3: '感知生理变化',
        step4: '这种感知 = 情绪体验 (恐惧)'
      },
      keyInsight: '我们感到悲伤是因为哭泣，愤怒是因为打击，害怕是因为颤抖',
      modernUpdate: {
        embodiedCognition: '具身认知理论支持身体反馈影响情绪',
        facialFeedback: '面部反馈假说：微笑会让你更快乐',
        interoception: '内感受 (interoception) 是情绪意识的核心'
      },
      codeApplication: {
        bodyStateTracking: '追踪用户描述的生理状态',
        feedbackLoop: '通过引导呼吸/姿势调节情绪',
        granularity: '提高情绪粒度：区分不同生理感受模式'
      }
    };
  }

  /**
   * 评估传统实现 - 认知评估理论
   * 核心：情绪是对情境的评估/解释
   */
  implementEvaluativeTradition(emotionData) {
    return {
      tradition: 'Evaluative Tradition',
      appraisalDimensions: {
        relevance: '与我相关吗？',
        valence: '是好事还是坏事？',
        agency: '谁/什么导致的？(自我/他人/环境)',
        control: '我能控制/应对吗？',
        compatibility: '与我的目标/价值观一致吗？',
        certainty: '我确定发生了什么吗？'
      },
      emotionMapping: {
        '威胁评估': '恐惧',
        '损失评估': '悲伤',
        '冒犯评估': '愤怒',
        '成就评估': '自豪',
        '不确定性评估': '焦虑'
      },
      codeApplication: {
        cognitiveReframing: 'CBT 核心：改变评估 = 改变情绪',
        perspectiveShift: '引导用户从多角度评估同一事件',
        valueAlignment: '检查情绪与核心价值观的一致性'
      }
    };
  }

  /**
   * 动机传统实现 - 行动倾向理论
   * 核心：情绪是行动的准备状态
   */
  implementMotivationalTradition(emotionData) {
    return {
      tradition: 'Motivational Tradition',
      actionTendencies: {
        '恐惧': '逃跑/回避',
        '愤怒': '攻击/消除障碍',
        '悲伤': '退缩/寻求支持',
        '喜悦': '接近/分享',
        '厌恶': '排斥/远离',
        '惊讶': '停止/重新定向',
        '羞耻': '隐藏/逃避',
        '内疚': '修复/补偿'
      },
      motivationalForce: {
        intensity: '情绪强度决定动机强度',
        urgency: '某些情绪 (恐惧、愤怒) 产生紧迫感',
        direction: '趋近 vs 回避倾向'
      },
      codeApplication: {
        behaviorPrediction: '根据情绪预测可能的行为倾向',
        interventionTiming: '在冲动行动前介入',
        channeling: '将情绪能量引导到建设性行动'
      }
    };
  }

  /**
   * 解决区分问题 - 原型理论 + 组件整合
   */
  solveDifferentiation() {
    return {
      problem: '情绪如何彼此区分？如何与非情绪状态 (如心情、感觉) 区分？',
      solution: {
        prototypeTheory: {
          description: '情绪概念是原型组织的，有典型和非典型成员',
          example: '恐惧是比敬畏更好的"情绪"例子',
          borderline: '无聊是边界案例 (有人认为是情绪，有人认为不是)'
        },
        componentProfile: {
          description: '每种情绪有独特的组件配置',
          dimensions: [
            '持续时间 (恐惧短暂 vs 悲伤持久)',
            '强度 (恐慌强烈 vs 担忧轻微)',
            '意识程度 (有意识 vs 无意识)',
            '面部表达 (有 vs 无)',
            '认知复杂度 (原始 vs 复杂)',
            '跨物种存在 (恐惧跨物种 vs 幸灾乐祸人类独有)'
          ]
        },
        theoreticalKind: {
          description: '情绪是否构成"理论种类"(有共同属性的自然分组)',
          debate: '建构主义 vs 基本情绪理论的争议',
          practicalApproach: '使用 prescriptive definition (规定性定义) 平衡日常语言和理论需求'
        }
      },
      codeImplementation: {
        emotionClassification: '使用多维度分类而非单一标签',
        granularityTraining: '帮助用户区分相似情绪 (如焦虑 vs 恐惧)',
        boundaryCases: '识别并讨论边界案例 (如无聊、怀旧)'
      }
    };
  }

  /**
   * 解决动机问题 - 情绪与行为的关系
   */
  solveMotivation() {
    return {
      problem: '情绪是否激励行为？如果是，如何激励？',
      solution: {
        causalRole: {
          description: '情绪在行为因果链中扮演角色',
          jamesChallenge: 'James 认为情绪不导致行为，而是来自生理变化',
          counterArgument: 'Dewey: 如果情绪没有因果作用，为何对我们如此重要？'
        },
        actionReadiness: {
          description: 'Frijda 的"行动准备"理论',
          mechanism: '情绪创造特定的行动倾向 (action tendency)',
          modulation: '倾向可以被抑制、调节或重新定向'
        },
        motivationalPriority: {
          description: '情绪设定行为优先级',
          example: '恐惧使安全成为最高优先级',
          conflict: '不同情绪可能产生冲突的动机 (如愤怒想攻击，恐惧想逃跑)'
        }
      },
      codeImplementation: {
        urgeSurfing: '帮助用户观察情绪冲动而不立即行动',
        pauseTechnique: '在情绪和行动之间创造暂停空间',
        choiceExpansion: '识别多种可能的回应方式，而非自动反应'
      }
    };
  }

  /**
   * 解决意向性问题 - 情绪的对象指向性
   */
  solveIntentionality() {
    return {
      problem: '情绪是否有对象指向性？情绪是否可以适当/不适当？',
      solution: {
        intentionalObject: {
          description: 'Brentano 的"意向性内存在"理论',
          keyIdea: '心理现象的特征是包含对象于自身之内',
          example: '爱某物 = 爱这个对象 (无论对象是否存在)'
        },
        appropriateness: {
          description: '情绪可以有适当/不适当的评价',
          criteria: [
            '对象是否存在 (对不存在的事物恐惧 = 不适当)',
            '评估是否准确 (对无害事物恐惧 = 不适当)',
            '强度是否匹配 (对小问题大怒 = 不适当)',
            '持续时间是否合理 (长期悲伤 vs 短暂悲伤)'
          ]
        },
        formalObject: {
          description: '每种情绪有"形式对象"(formal object)',
          examples: {
            '恐惧': '危险',
            '愤怒': '冒犯',
            '悲伤': '损失',
            '自豪': '成就'
          },
          insight: '形式对象定义了情绪的评估核心'
        }
      },
      codeImplementation: {
        objectIdentification: '帮助用户识别情绪的真正对象',
        appropriatenessCheck: '评估情绪反应是否与情境匹配',
        displacementDetection: '识别情绪转移 (如对老板生气却对家人发火)'
      }
    };
  }

  /**
   * 解决现象学问题 - 情绪的主观体验
   */
  solvePhenomenology() {
    return {
      problem: '情绪是否总涉及主观体验？如果是，是什么类型的体验？',
      solution: {
        consciousExperience: {
          description: '情绪通常涉及有意识的感受',
          debate: '是否有无意识情绪？(Freud: 有；James: 无)',
          evidence: '情绪可以在没有意识觉察的情况下被诱发'
        },
        qualia: {
          description: '情绪有独特的感受质 (qualitative character)',
          example: '恐惧的感受与愤怒的感受截然不同',
          challenge: '难以用语言完全捕捉情绪体验'
        },
        preReflective: {
          description: '前反思自我意识 (pre-reflective self-awareness)',
          insight: '情绪体验中隐含的自我意识，不需要反思',
          source: '现象学传统 (Husserl, Sartre, Merleau-Ponty)'
        },
        embodied: {
          description: '具身现象学',
          keyIdea: '情绪体验是身体性的，不是纯粹的"心理"感受',
          example: '焦虑不仅是"担心"，而是胃部紧缩、呼吸急促的整体体验'
        }
      },
      codeImplementation: {
        phenomenologicalInquiry: '引导用户描述情绪的身体感受',
        mindfulness: '培养对情绪体验的非评判性觉察',
        articulation: '帮助用户用语言捕捉情绪体验的细微差别'
      }
    };
  }

  /**
   * 整合三大传统 - 综合情绪理论
   */
  integrateAllTraditions(emotionScenario) {
    const feeling = this.implementFeelingTradition(emotionScenario);
    const evaluative = this.implementEvaluativeTradition(emotionScenario);
    const motivational = this.implementMotivationalTradition(emotionScenario);

    return {
      integration: {
        description: '情绪是感受、评估和动机的整合状态',
        components: {
          feeling: '情绪体验的感受质',
          evaluative: '情绪的认知评估内容',
          motivational: '情绪的行为倾向'
        },
        synergy: '三大传统不是竞争关系，而是互补视角'
      },
      practicalApplication: {
        assessment: '从三个维度评估情绪状态',
        intervention: {
          feeling: '通过身体调节 (呼吸、放松) 改变感受',
          evaluative: '通过认知重构改变评估',
          motivational: '通过行为激活改变行动倾向'
        },
        personalization: '根据个体差异选择主导干预路径'
      },
      theoreticalAdvance: {
        beyondReductionism: '拒绝将情绪还原为单一成分',
        pluralism: '接受情绪的多维度、多层次本质',
        empiricalGrounding: '整合哲学分析与实证研究'
      }
    };
  }

  /**
   * 应用：情绪粒度提升训练
   */
  trainEmotionalGranularity(userInput) {
    return {
      step1_differentiate: {
        instruction: '区分当前情绪与相似情绪',
        questions: [
          '这是焦虑还是恐惧？(焦虑 = 不确定威胁，恐惧 = 明确威胁)',
          '这是愤怒还是失望？(愤怒 = 被冒犯，失望 = 期望落空)',
          '这是悲伤还是抑郁？(悲伤 = 对损失的回应，抑郁 = 持续状态)'
        ]
      },
      step2_componentAnalysis: {
        instruction: '分析情绪的各个组件',
        components: [
          '身体感受：你感觉到什么生理变化？',
          '想法：你脑海中有什么念头？',
          '冲动：你想做什么？',
          '行为：你实际做了什么？'
        ]
      },
      step3_traditionMapping: {
        instruction: '从三大传统视角理解情绪',
        mapping: {
          feeling: '这种情绪的感受是什么样的？',
          evaluative: '你在评估什么？这个评估准确吗？',
          motivational: '这种情绪想让你做什么？这是最好的行动吗？'
        ]
      },
      step4_integration: {
        instruction: '整合理解，形成完整情绪画像',
        output: '完整的情绪描述 + 干预建议'
      }
    };
  }

  /**
   * 主处理函数：分析情绪状态
   */
  analyzeEmotion(emotionData) {
    const analysis = {
      metadata: {
        version: this.version,
        timestamp: new Date().toISOString(),
        framework: 'SEP Emotion Theory Integration'
      },
      components: this.emotionComponents,
      traditions: {
        feeling: this.implementFeelingTradition(emotionData),
        evaluative: this.implementEvaluativeTradition(emotionData),
        motivational: this.implementMotivationalTradition(emotionData)
      },
      challenges: {
        differentiation: this.solveDifferentiation(),
        motivation: this.solveMotivation(),
        intentionality: this.solveIntentionality(),
        phenomenology: this.solvePhenomenology()
      },
      integration: this.integrateAllTraditions(emotionData),
      recommendations: this.trainEmotionalGranularity(emotionData)
    };

    return analysis;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      source: 'Stanford Encyclopedia of Philosophy - Emotion',
      url: 'https://plato.stanford.edu/entries/emotion/',
      keyContributions: [
        '整合 SEP 情绪理论三大传统',
        '解决四大理论挑战',
        '提供可操作的情绪分析框架',
        '支持情绪粒度提升训练'
      ]
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmotionIntegrationTheory;
}

// 测试代码
if (typeof require !== 'undefined' && require.main === module) {
  const theory = new EmotionIntegrationTheory();
  
  console.log('=== EmotionIntegrationTheory v2.0 ===\n');
  console.log('模块信息:', theory.getInfo());
  console.log('\n=== 分析示例：恐惧情绪 ===\n');
  
  const fearAnalysis = theory.analyzeEmotion({
    emotion: 'fear',
    trigger: '看到熊',
    context: '在森林中徒步'
  });
  
  console.log('传统分析:');
  console.log('- 感受传统:', fearAnalysis.traditions.feeling.core);
  console.log('- 评估传统:', fearAnalysis.traditions.evaluative.appraisalDimensions);
  console.log('- 动机传统:', fearAnalysis.traditions.motivational.actionTendencies['恐惧']);
  
  console.log('\n四大挑战解决方案:');
  console.log('- 区分:', fearAnalysis.challenges.differentiation.solution.prototypeTheory.description);
  console.log('- 动机:', fearAnalysis.challenges.motivation.solution.actionReadiness.description);
  console.log('- 意向性:', fearAnalysis.challenges.intentionality.solution.formalObject.examples['恐惧']);
  console.log('- 现象学:', fearAnalysis.challenges.phenomenology.solution.embodied.keyIdea);
}
