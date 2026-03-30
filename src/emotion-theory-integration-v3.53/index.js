/**
 * 情绪理论三大传统整合模块 v3.53.0
 * 
 * 基于 SEP (Stanford Encyclopedia of Philosophy) 情绪理论权威整合：
 * - Feeling Tradition (感觉传统)
 * - Evaluative Tradition (评价传统)
 * - Motivational Tradition (动机传统)
 * 
 * 四大理论挑战整合：
 * - Differentiation (区分挑战)
 * - Motivation (动机挑战)
 * - Intentionality (意向性挑战)
 * - Phenomenology (现象学挑战)
 * 
 * 核心理论来源：
 * - William James: 早期感觉传统奠基
 * - Cognitive Appraisal Theories: 评价传统
 * - Evolutionary Psychology: 动机传统
 * - Scarantino (2016): 三大传统整合框架
 */

class EmotionTheoryIntegration {
  constructor() {
    this.name = 'EmotionTheoryIntegration';
    this.version = '3.53.0';
    this.theoreticalFoundations = this.initTheoreticalFoundations();
  }

  /**
   * 初始化理论基础 - 三大传统
   */
  initTheoreticalFoundations() {
    return {
      // 感觉传统
      feelingTradition: {
        name: '感觉传统 (Feeling Tradition)',
        coreClaim: '情绪的本质是独特的意识体验',
        representatives: ['William James', 'classical philosophers'],
        strengths: [
          '捕捉情绪的现象学特征',
          '符合直觉的情绪理解',
          '强调主观体验的重要性'
        ],
        limitations: [
          '难以解释情绪与认知的关系',
          '无法充分说明情绪的意向性',
          '对无意识情绪解释力弱'
        ],
        keyInsights: {
          jamesian: '情绪是对身体变化的知觉（我们因为哭所以悲伤）',
          phenomenalQuality: '每种情绪有独特的感受质 (qualia)',
          introspectiveAccess: '内省是理解情绪的主要途径'
        }
      },

      // 评价传统
      evaluativeTradition: {
        name: '评价传统 (Evaluative Tradition)',
        coreClaim: '情绪是对环境的独特评价',
        representatives: ['Cognitive Appraisal Theorists', 'Philosophical Cognitivists'],
        strengths: [
          '解释情绪的意向性（关于什么）',
          '说明情绪的适当性条件',
          '连接情绪与理性'
        ],
        limitations: [
          '难以解释非理性情绪',
          '对婴儿和动物情绪解释力弱',
          '可能过度认知化'
        ],
        keyInsights: {
          appraisal: '情绪包含对情境的评价性诠释',
          formalObject: '每种情绪有形式对象（如恐惧的危险性）',
          appropriateness: '情绪可以有适当/不适当之分'
        }
      },

      // 动机传统
      motivationalTradition: {
        name: '动机传统 (Motivational Tradition)',
        coreClaim: '情绪是独特的动机状态',
        representatives: ['Evolutionary Psychologists', 'Functionalists'],
        strengths: [
          '解释情绪的行动导向',
          '说明情绪的进化功能',
          '连接情绪与行为'
        ],
        limitations: [
          '难以区分情绪与其他动机',
          '对无明显行动倾向的情绪解释力弱',
          '可能过度功能化'
        ],
        keyInsights: {
          actionTendency: '情绪包含行动倾向（如恐惧的逃跑倾向）',
          evolutionaryFunction: '情绪是进化形成的适应机制',
          motivationalForce: '情绪提供行动的动力和方向'
        }
      },

      // 四大理论挑战
      theoreticalChallenges: {
        differentiation: {
          name: '区分挑战 (Differentiation)',
          question: '情绪之间如何不同？情绪与非情绪状态如何区分？',
          solutions: {
            feeling: '不同的感受质',
            evaluative: '不同的评价内容',
            motivational: '不同的行动倾向'
          }
        },
        motivation: {
          name: '动机挑战 (Motivation)',
          question: '情绪是否必然驱动行为？如何驱动？',
          solutions: {
            feeling: '感受本身具有动机力量',
            evaluative: '评价产生行动理由',
            motivational: '情绪本质上是动机状态'
          }
        },
        intentionality: {
          name: '意向性挑战 (Intentionality)',
          question: '情绪是否指向对象？如何适当？',
          solutions: {
            feeling: '感受伴随关于对象的表征',
            evaluative: '评价本身就是关于对象的',
            motivational: '动机总是关于某物的'
          }
        },
        phenomenology: {
          name: '现象学挑战 (Phenomenology)',
          question: '情绪是否必然有主观体验？无意识情绪可能吗？',
          solutions: {
            feeling: '情绪必然有感受',
            evaluative: '评价可以无意识',
            motivational: '动机可以无意识'
          }
        }
      }
    };
  }

  /**
   * 多维度情绪成分分析
   * 
   * 基于 SEP 情绪理论的情绪成分框架
   */
  emotionComponentAnalysis(emotionEpisode) {
    const {
      emotionType,      // 情绪类型（如"愤怒"）
      elicitingSituation, // 引发情境
      subjectiveReport    // 主观报告
    } = emotionEpisode;

    return {
      // 1. 评价成分
      evaluative: {
        // 核心评价（如何诠释情境）
        coreAppraisal: this.extractCoreAppraisal(emotionEpisode),
        // 效价（正面/负面）
        valence: this.determineValence(emotionEpisode),
        // 评价维度
        appraisalDimensions: {
          // 目标相关性（与我的目标有关吗？）
          goalRelevance: this.evaluateGoalRelevance(emotionEpisode),
          // 目标一致性（促进还是阻碍？）
          goalCongruence: this.evaluateGoalCongruence(emotionEpisode),
          // 责任归属（谁负责？）
          agency: this.evaluateAgency(emotionEpisode),
          // 控制感（我能应对吗？）
          control: this.evaluateControl(emotionEpisode),
          // 规范相容性（符合规范吗？）
          normCompatibility: this.evaluateNormCompatibility(emotionEpisode)
        }
      },

      // 2. 生理成分
      physiological: {
        // 唤醒水平
        arousal: this.estimateArousal(emotionEpisode),
        // 生理模式
        patterns: this.identifyPhysiologicalPatterns(emotionEpisode),
        // 自主神经系统反应
        ansResponse: this.identifyANSResponse(emotionEpisode)
      },

      // 3. 现象学成分
      phenomenological: {
        // 感受质（什么样的感觉）
        feelingQuality: this.describeFeelingQuality(emotionEpisode),
        // 强度
        intensity: this.estimateIntensity(emotionEpisode),
        // 身体定位（感觉在身体哪里）
        bodilyLocation: this.identifyBodilyLocation(emotionEpisode),
        // 时间动态（如何随时间变化）
        temporalDynamics: this.analyzeTemporalDynamics(emotionEpisode)
      },

      // 4. 表达成分
      expressive: {
        // 面部表情
        facial: this.identifyFacialExpression(emotionEpisode),
        // 声音特征
        vocal: this.identifyVocalExpression(emotionEpisode),
        // 姿势
        postural: this.identifyPosturalExpression(emotionEpisode)
      },

      // 5. 行为成分
      behavioral: {
        // 行动倾向
        actionTendency: this.identifyActionTendency(emotionEpisode),
        // 实际行为
        actualBehavior: this.identifyActualBehavior(emotionEpisode),
        // 行为抑制/促进
        behavioralInhibition: this.evaluateBehavioralInhibition(emotionEpisode)
      },

      // 6. 认知成分
      cognitive: {
        // 注意焦点
        attentionFocus: this.identifyAttentionFocus(emotionEpisode),
        // 信念变化
        beliefChanges: this.identifyBeliefChanges(emotionEpisode),
        // 记忆效应
        memoryEffects: this.identifyMemoryEffects(emotionEpisode),
        // 决策影响
        decisionImpact: this.evaluateDecisionImpact(emotionEpisode)
      }
    };
  }

  extractCoreAppraisal(ep) {
    // 提取核心评价
    const appraisals = {
      '愤怒': '他人对我做了错事，应受谴责',
      '恐惧': '面临迫在眉睫的危险',
      '悲伤': '失去了重要的东西',
      '喜悦': '获得了想要的东西',
      '羞耻': '我在他人眼中形象受损',
      '内疚': '我做了错事，伤害了他人',
      '敬畏': '面对超越理解的宏大事物'
    };
    return appraisals[ep.emotionType] || '未识别的评价模式';
  }

  determineValence(ep) {
    const negative = ['愤怒', '恐惧', '悲伤', '羞耻', '内疚', '厌恶'];
    const positive = ['喜悦', '感激', '敬畏', '爱'];
    if (negative.includes(ep.emotionType)) return 'negative';
    if (positive.includes(ep.emotionType)) return 'positive';
    return 'mixed';
  }

  evaluateGoalRelevance(ep) {
    return ep.elicitingSituation?.personalRelevance ? 'high' : 'low';
  }

  evaluateGoalCongruence(ep) {
    const congruent = ['喜悦', '感激'];
    const incongruent = ['愤怒', '恐惧', '悲伤'];
    if (congruent.includes(ep.emotionType)) return 'congruent';
    if (incongruent.includes(ep.emotionType)) return 'incongruent';
    return 'mixed';
  }

  evaluateAgency(ep) {
    const selfAgency = ['内疚', '羞耻'];
    const otherAgency = ['愤怒'];
    const situationalAgency = ['恐惧', '悲伤'];
    if (selfAgency.includes(ep.emotionType)) return 'self';
    if (otherAgency.includes(ep.emotionType)) return 'other';
    return 'situation';
  }

  evaluateControl(ep) {
    const highControl = ['愤怒']; // 通常感到有力量
    const lowControl = ['恐惧', '悲伤'];
    if (highControl.includes(ep.emotionType)) return 'high';
    if (lowControl.includes(ep.emotionType)) return 'low';
    return 'moderate';
  }

  evaluateNormCompatibility(ep) {
    const normViolations = ['愤怒', '厌恶', '羞耻', '内疚'];
    if (normViolations.includes(ep.emotionType)) return 'violated';
    return 'compatible';
  }

  estimateArousal(ep) {
    const highArousal = ['愤怒', '恐惧', '喜悦'];
    const lowArousal = ['悲伤', '平静'];
    if (highArousal.includes(ep.emotionType)) return 'high';
    if (lowArousal.includes(ep.emotionType)) return 'low';
    return 'moderate';
  }

  identifyPhysiologicalPatterns(ep) {
    const patterns = {
      '愤怒': ['心跳加速', '血压升高', '肌肉紧张'],
      '恐惧': ['心跳加速', '呼吸急促', '出汗'],
      '悲伤': ['能量降低', '肌肉松弛', '哭泣冲动'],
      '喜悦': ['能量提升', '面部肌肉放松', '微笑']
    };
    return patterns[ep.emotionType] || [];
  }

  identifyANSResponse(ep) {
    const sympathetic = ['愤怒', '恐惧']; // 交感神经激活
    const parasympathetic = ['悲伤']; // 副交感神经激活
    if (sympathetic.includes(ep.emotionType)) return 'sympathetic_activation';
    if (parasympathetic.includes(ep.emotionType)) return 'parasympathetic_activation';
    return 'mixed';
  }

  describeFeelingQuality(ep) {
    const qualities = {
      '愤怒': '灼热、紧绷、膨胀感',
      '恐惧': '收缩、冰冷、颤抖感',
      '悲伤': '沉重、空虚、下坠感',
      '喜悦': '轻盈、温暖、扩展感',
      '羞耻': '灼热、想隐藏、缩小感',
      '内疚': '沉重、压迫、想弥补感'
    };
    return qualities[ep.emotionType] || '独特的感受质';
  }

  estimateIntensity(ep) {
    return ep.subjectiveReport?.intensity || 'moderate';
  }

  identifyBodilyLocation(ep) {
    const locations = {
      '愤怒': ['胸部', '头部', '手臂'],
      '恐惧': ['胸部', '胃部', '喉咙'],
      '悲伤': ['胸部', '喉咙', '眼睛'],
      '喜悦': ['胸部', '面部', '全身']
    };
    return locations[ep.emotionType] || [];
  }

  analyzeTemporalDynamics(ep) {
    const dynamics = {
      '愤怒': '快速上升，可能持续较长时间',
      '恐惧': '突然爆发，随威胁消失而快速消退',
      '悲伤': '缓慢上升，持续时间长',
      '喜悦': '快速上升，中等持续时间'
    };
    return dynamics[ep.emotionType] || '典型的情绪时间动态';
  }

  identifyFacialExpression(ep) {
    const expressions = {
      '愤怒': ['眉毛下压', '眼睛瞪视', '嘴唇紧绷'],
      '恐惧': ['眉毛上扬', '眼睛睁大', '嘴巴张开'],
      '悲伤': ['眉毛内侧上扬', '眼睑下垂', '嘴角下垂'],
      '喜悦': ['眼角皱纹', '嘴角上扬', '脸颊提升']
    };
    return expressions[ep.emotionType] || [];
  }

  identifyVocalExpression(ep) {
    const vocals = {
      '愤怒': '响亮、快速、尖锐',
      '恐惧': '颤抖、高音调、快速',
      '悲伤': '轻柔、慢速、低音调',
      '喜悦': '响亮、快速、音调变化大'
    };
    return vocals[ep.emotionType] || [];
  }

  identifyPosturalExpression(ep) {
    const postures = {
      '愤怒': '身体前倾、肌肉紧绷、拳头紧握',
      '恐惧': '身体后缩、僵硬、准备逃跑',
      '悲伤': '身体下垂、肩膀塌陷、动作缓慢',
      '喜悦': '身体舒展、动作轻快、开放姿态'
    };
    return postures[ep.emotionType] || [];
  }

  identifyActionTendency(ep) {
    const tendencies = {
      '愤怒': '攻击、对抗、纠正错误',
      '恐惧': '逃跑、躲避、寻求安全',
      '悲伤': '退缩、寻求安慰、修复损失',
      '喜悦': '接近、分享、继续活动',
      '羞耻': '隐藏、逃避、修复形象',
      '内疚': '弥补、道歉、修复关系'
    };
    return tendencies[ep.emotionType] || '未识别的行动倾向';
  }

  identifyActualBehavior(ep) {
    return ep.subjectiveReport?.actualBehavior || '未报告';
  }

  evaluateBehavioralInhibition(ep) {
    // 评估行为抑制程度
    const highInhibition = ['恐惧', '羞耻'];
    const lowInhibition = ['愤怒', '喜悦'];
    if (highInhibition.includes(ep.emotionType)) return 'high';
    if (lowInhibition.includes(ep.emotionType)) return 'low';
    return 'moderate';
  }

  identifyAttentionFocus(ep) {
    const focuses = {
      '愤怒': '聚焦于冒犯者和不公',
      '恐惧': '聚焦于威胁源和逃生路线',
      '悲伤': '聚焦于损失和过去',
      '喜悦': '聚焦于当前积极体验'
    };
    return focuses[ep.emotionType] || '情绪相关的注意焦点';
  }

  identifyBeliefChanges(ep) {
    const changes = {
      '愤怒': ['他人对我不公', '世界应该是公平的'],
      '恐惧': ['我有危险', '我需要保护自己'],
      '悲伤': ['我失去了重要的东西', '世界不如我愿'],
      '喜悦': ['我得到了想要的', '世界是友好的']
    };
    return changes[ep.emotionType] || [];
  }

  identifyMemoryEffects(ep) {
    const effects = {
      '愤怒': '增强对不公事件的记忆',
      '恐惧': '增强对威胁相关线索的记忆',
      '悲伤': '增强对损失相关记忆的可及性',
      '喜悦': '增强对积极事件的记忆'
    };
    return effects[ep.emotionType] || '情绪一致性记忆效应';
  }

  evaluateDecisionImpact(ep) {
    const impacts = {
      '愤怒': '增加风险寻求，促进惩罚性决定',
      '恐惧': '增加风险规避，促进保守决定',
      '悲伤': '增加现状偏好，促进改变动机',
      '喜悦': '增加创造性，促进探索行为'
    };
    return impacts[ep.emotionType] || '情绪对决策的影响';
  }

  /**
   * 情绪理论传统分类
   * 
   * 判断一个情绪理论属于哪个传统，或是否为跨传统整合
   */
  classifyEmotionTheory(theory) {
    const traditions = {
      feeling: 0.0,
      evaluative: 0.0,
      motivational: 0.0
    };

    // 分析理论的核心主张
    if (theory.emphasizesConsciousExperience) traditions.feeling += 0.4;
    if (theory.emphasizesAppraisal) traditions.evaluative += 0.4;
    if (theory.emphasizesActionTendency) traditions.motivational += 0.4;

    if (theory.emphasizesPhenomenology) traditions.feeling += 0.3;
    if (theory.emphasizesIntentionality) traditions.evaluative += 0.3;
    if (theory.emphasizesEvolutionaryFunction) traditions.motivational += 0.3;

    if (theory.emphasizesBodilyChanges) traditions.feeling += 0.3;
    if (theory.emphasizesNormativeAssessment) traditions.evaluative += 0.3;
    if (theory.emphasizesMotivationalForce) traditions.motivational += 0.3;

    // 归一化
    const total = traditions.feeling + traditions.evaluative + traditions.motivational;
    if (total > 0) {
      traditions.feeling /= total;
      traditions.evaluative /= total;
      traditions.motivational /= total;
    }

    // 判断是否为整合理论
    const isIntegrative = Object.values(traditions).every(v => v > 0.2);

    return {
      traditions,
      dominantTradition: this.getDominantTradition(traditions),
      isIntegrative,
      theoreticalPosition: this.describeTheoreticalPosition(traditions)
    };
  }

  getDominantTradition(traditions) {
    const entries = Object.entries(traditions);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  describeTheoreticalPosition(traditions) {
    const { feeling, evaluative, motivational } = traditions;
    
    if (feeling > 0.6) return '强感觉传统立场';
    if (evaluative > 0.6) return '强评价传统立场';
    if (motivational > 0.6) return '强动机传统立场';
    
    if (feeling > 0.4 && evaluative > 0.3) return '感觉 - 评价整合立场';
    if (feeling > 0.4 && motivational > 0.3) return '感觉 - 动机整合立场';
    if (evaluative > 0.4 && motivational > 0.3) return '评价 - 动机整合立场';
    
    if (feeling > 0.25 && evaluative > 0.25 && motivational > 0.25) {
      return '三大传统整合立场';
    }
    
    return '未明确定位';
  }

  /**
   * 四大挑战应对策略生成
   */
  generateChallengeResponses(challenge, userQuestion) {
    const strategies = {
      differentiation: {
        explanation: '情绪之间的区分可以从三个传统理解：',
        perspectives: [
          {
            tradition: '感觉传统',
            answer: '不同情绪有不同的感受质。愤怒感觉像灼热，恐惧感觉像收缩，悲伤感觉像沉重。',
            intervention: '帮助用户精细区分情绪感受，提升情绪粒度'
          },
          {
            tradition: '评价传统',
            answer: '不同情绪包含不同的评价。愤怒评价为"他人对我不公"，恐惧评价为"我有危险"。',
            intervention: '帮助用户识别背后的评价模式'
          },
          {
            tradition: '动机传统',
            answer: '不同情绪产生不同的行动倾向。愤怒倾向对抗，恐惧倾向逃跑，悲伤倾向退缩。',
            intervention: '帮助用户识别行动倾向，选择适应性回应'
          }
        ]
      },

      motivation: {
        explanation: '情绪与动机的关系可以从三个传统理解：',
        perspectives: [
          {
            tradition: '感觉传统',
            answer: '情绪感受本身具有动机力量。痛苦的感受推动我们行动以减轻痛苦。',
            intervention: '帮助用户理解情绪感受的信息功能'
          },
          {
            tradition: '评价传统',
            answer: '情绪评价产生行动理由。评价为"危险"就产生保护自己的理由。',
            intervention: '帮助用户审视评价是否合理，理由是否充分'
          },
          {
            tradition: '动机传统',
            answer: '情绪本质上是动机状态，直接推动行动。',
            intervention: '帮助用户将情绪能量导向建设性行动'
          }
        ]
      },

      intentionality: {
        explanation: '情绪的意向性（关于什么）可以从三个传统理解：',
        perspectives: [
          {
            tradition: '感觉传统',
            answer: '情绪感受伴随关于对象的表征。我们感到愤怒，同时表征冒犯者。',
            intervention: '帮助用户明确情绪的对象'
          },
          {
            tradition: '评价传统',
            answer: '评价本身就是关于对象的。评价"他对我不公"必然指向"他"。',
            intervention: '帮助用户澄清评价的对象和内容'
          },
          {
            tradition: '动机传统',
            answer: '动机总是关于某物的。逃跑倾向必然关于威胁源。',
            intervention: '帮助用户识别动机指向的目标'
          }
        ]
      },

      phenomenology: {
        explanation: '情绪的现象学体验可以从三个传统理解：',
        perspectives: [
          {
            tradition: '感觉传统',
            answer: '情绪必然有主观感受。无意识情绪是矛盾的。',
            intervention: '帮助用户提升情绪觉察'
          },
          {
            tradition: '评价传统',
            answer: '评价可以无意识发生。"无意识情绪"可能是无意识评价引发的身心反应。',
            intervention: '帮助用户探索潜在的评价模式'
          },
          {
            tradition: '动机传统',
            answer: '动机可以无意识运作。"无意识情绪"可能是无意识动机倾向。',
            intervention: '帮助用户识别无意识的行动倾向'
          }
        ]
      }
    };

    return strategies[challenge] || {
      explanation: '未识别的理论挑战',
      perspectives: []
    };
  }

  /**
   * 整合干预生成
   * 
   * 基于三大传统整合框架生成综合干预
   */
  generateIntegrativeIntervention(emotionEpisode) {
    // 多维度分析
    const componentAnalysis = this.emotionComponentAnalysis(emotionEpisode);

    // 理论传统分类
    const theoryClassification = this.classifyEmotionTheory({
      emphasizesConsciousExperience: true,
      emphasizesAppraisal: true,
      emphasizesActionTendency: true,
      emphasizesPhenomenology: true,
      emphasizesIntentionality: true,
      emphasizesEvolutionaryFunction: true,
      emphasizesBodilyChanges: true,
      emphasizesNormativeAssessment: true,
      emphasizesMotivationalForce: true
    });

    // 生成整合干预
    const intervention = {
      // 1. 感觉传统干预
      feelingIntervention: {
        focus: '提升情绪感受的觉察和接纳',
        techniques: [
          {
            name: '感受质描述',
            instruction: '用尽可能多的词汇描述这种情绪的身体感受',
            basis: 'William James: 情绪是对身体变化的知觉'
          },
          {
            name: '感受接纳',
            instruction: '允许这种感受存在，不评判、不抗拒',
            basis: '现象学方法：如其所是地体验'
          },
          {
            name: '身体扫描',
            instruction: '从头到脚扫描身体，定位情绪的具体位置',
            basis: '具身认知：情绪是身体状态'
          }
        ]
      },

      // 2. 评价传统干预
      evaluativeIntervention: {
        focus: '审视和重构情绪背后的评价',
        techniques: [
          {
            name: '评价识别',
            instruction: '识别这种情绪背后的核心评价是什么',
            basis: '认知评价理论：情绪源于评价'
          },
          {
            name: '评价检验',
            instruction: '这个评价是准确的吗？有其他可能的诠释吗？',
            basis: 'CBT: 检验自动化思维'
          },
          {
            name: '适当性评估',
            instruction: '这种情绪对当前情境是适当的吗？强度匹配吗？',
            basis: '情绪规范性评估'
          }
        ]
      },

      // 3. 动机传统干预
      motivationalIntervention: {
        focus: '理解情绪的动机功能并选择适应性回应',
        techniques: [
          {
            name: '行动倾向识别',
            instruction: '这种情绪推动你想做什么？',
            basis: '动机传统：情绪包含行动倾向'
          },
          {
            name: '功能分析',
            instruction: '这种情绪在进化上有什么功能？在当前情境有用吗？',
            basis: '进化心理学：情绪是适应机制'
          },
          {
            name: '价值导向行动',
            instruction: '基于你的价值观，如何回应这种情绪最有益？',
            basis: 'ACT: 价值导向的承诺行动'
          }
        ]
      },

      // 4. 整合框架
      integrativeFramework: {
        description: '三大传统整合视角',
        synthesis: `
从整合视角看，你的${emotionEpisode.emotionType}包含：

1. **感受层面**：${componentAnalysis.phenomenological.feelingQuality}
   - 这是情绪的现象学核心，值得被觉察和接纳

2. **评价层面**：${componentAnalysis.evaluative.coreAppraisal}
   - 这是情绪的认知核心，可以被审视和重构

3. **动机层面**：${componentAnalysis.behavioral.actionTendency}
   - 这是情绪的功能核心，可以导向适应性行动

三个层面相互关联，共同构成完整的情绪体验。
        `,
        theoreticalBasis: 'Scarantino (2016): 情绪理论三大传统整合框架'
      }
    };

    return {
      componentAnalysis,
      theoryClassification,
      intervention,
      version: this.version
    };
  }

  /**
   * 主干预接口
   */
  intervene(userSituation) {
    const {
      statement,
      emotionalState,
      emotionType,
      elicitingSituation
    } = userSituation;

    const emotionEpisode = {
      emotionType: emotionType || this.inferEmotionType(statement),
      elicitingSituation,
      subjectiveReport: {
        statement,
        emotionalState,
        intensity: this.inferIntensity(statement)
      }
    };

    return this.generateIntegrativeIntervention(emotionEpisode);
  }

  inferEmotionType(statement) {
    const emotionKeywords = {
      '愤怒': ['生气', '愤怒', '恼火', '愤慨'],
      '恐惧': ['害怕', '恐惧', '担心', '焦虑'],
      '悲伤': ['悲伤', '难过', '伤心', '沮丧'],
      '喜悦': ['开心', '高兴', '喜悦', '兴奋'],
      '羞耻': ['羞耻', '羞愧', '丢脸'],
      '内疚': ['内疚', '愧疚', '自责']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(k => statement.includes(k))) {
        return emotion;
      }
    }

    return '未识别';
  }

  inferIntensity(statement) {
    const highIntensity = ['非常', '极其', '特别', '太', 'so', 'very', 'extremely'];
    const lowIntensity = ['有点', '稍微', '些许', 'a bit', 'slightly'];

    if (highIntensity.some(w => statement.includes(w))) return 'high';
    if (lowIntensity.some(w => statement.includes(w))) return 'low';
    return 'moderate';
  }
}

module.exports = EmotionTheoryIntegration;
