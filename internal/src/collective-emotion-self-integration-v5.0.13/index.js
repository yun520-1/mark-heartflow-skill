/**
 * HeartFlow v5.0.13 - 集体情绪现象学与自我意识深度整合
 * 
 * 基于 SEP Collective Intentionality + Self-Consciousness + Emotion Theory
 * 实现集体情绪现象学建模、自我意识双层结构、情绪 - 集体 - 自我三元整合
 * 
 * 理论来源:
 * - SEP Collective Intentionality: 不可还原性 + 共享经验四层结构 + Scheler 集体情绪现象学
 * - SEP Self-Consciousness: 前反思自我意识 + 直觉式/推论式自我知识 + 透明性论题
 * - SEP Emotion: 情绪三大传统 + 集体情绪中的自我扩展效应
 * 
 * 核心升级:
 * 1. 集体情绪现象学建模 (Scheler 1954 + Walther 1923 + Durkheim 集体欢腾)
 * 2. 自我意识双层结构 (前反思层 + 反思层)
 * 3. 情绪 - 集体 - 自我三元整合模型
 * 4. 集体情绪检测算法 + 自我知识冲突检测
 */

const EventEmitter = require('events')

class CollectiveEmotionPhenomenology extends EventEmitter {
  constructor () {
    super()
    this.version = '5.0.13'
    this.name = '集体情绪现象学与自我意识深度整合'
    this.codename = 'Collective-Self-Integration'
    this.releaseDate = '2026-03-30'
    
    // 集体情绪现象学模型
    this.collectiveEmotionModel = this.buildCollectiveEmotionModel()
    
    // 自我意识双层结构
    this.selfConsciousnessDualLayer = this.buildSelfConsciousnessDualLayer()
    
    // 三元整合框架
    this.triadIntegrationFramework = this.buildTriadIntegrationFramework()
  }

  /**
   * 构建集体情绪现象学模型
   * 基于 SEP Collective Intentionality + Scheler + Walther + Durkheim
   */
  buildCollectiveEmotionModel () {
    return {
      /**
       * 集体意向性核心特征
       */
      collectiveIntentionality: {
        irreducibilityClaim: '集体意向性不可还原为个体意向性的总和',
        individualOwnershipThesis: '集体意向性由个体"共同"持有，但不融合为超级心智',
        
        // Walther 共享经验四层结构 (1923)
        sharedExperienceFourLevels: {
          level1: {
            name: '共同体验',
            description: 'A 体验 x, B 体验 x',
            formal: 'Experience(A, x) ∧ Experience(B, x)',
            example: '两个人同时听到同一声巨响'
          },
          level2: {
            name: '共情体验',
            description: 'A 共情 B 的体验，B 共情 A 的体验',
            formal: 'Empathize(A, Experience(B, x)) ∧ Empathize(B, Experience(A, x))',
            example: '我感受到你的恐惧，你感受到我的恐惧'
          },
          level3: {
            name: '认同性体验',
            description: 'A 认同 B 的体验，B 认同 A 的体验',
            formal: 'Identify(A, Experience(B, x)) ∧ Identify(B, Experience(A, x))',
            example: '我将你的悲伤视为我的悲伤'
          },
          level4: {
            name: '相互意识体验',
            description: '相互的共情意识 (mutual empathetic awareness)',
            formal: 'Aware(A, Identify(B, Experience(A, x))) ∧ Aware(B, Identify(A, Experience(B, x)))',
            example: '我知道你理解我的感受，你知道我理解你的感受',
            isFullShared: true
          }
        },
        
        // Scheler 集体情绪现象学 (1954 [1912])
        schelerCollectiveEmotion: {
          coreClaim: '共享情绪不是个体情绪的组合，而是"同一个"情绪',
          numericalIdentity: '多个心智处于数值上相同的情绪状态',
          
          // 经典案例
          paradigmCases: {
            parentalGrief: {
              description: '父母在孩子病床前共享的悲伤',
              feature: '无需思考对方，直接共享同一悲伤',
              implication: '集体情绪具有现象学上的统一性'
            },
            augustMadness: {
              description: '一战爆发时的集体爱国热情 (August Madness)',
              feature: '全国范围内的情绪同步',
              implication: '集体情绪可以跨越空间传播'
            }
          },
          
          // 与聚合情绪的区别
          vsAggregatedEmotion: {
            collective: '一个情绪，多个主体 (one emotion, multiple subjects)',
            aggregated: '多个情绪，多个主体 (multiple emotions, multiple subjects)',
            distinction: '现象学体验的统一性 vs 统计聚合'
          }
        }
      },
      
      /**
       * Durkheim 集体情绪理论
       */
      durkheimCollectiveEmotion: {
        collectiveConsciousness: '社会事实必须用集体意识解释，而非个体心理',
        
        // 集体欢腾 (Collective Effervescence)
        collectiveEffervescence: {
          description: '集体聚集产生的情绪高潮状态',
          conditions: [
            '物理共在 (physical co-presence)',
            '共享注意 (shared attention)',
            '同步行动 (synchronized action)',
            '情绪传染 (emotional contagion)'
          ],
          effects: {
            emotionalAmplification: '情绪强度放大',
            socialBonding: '社会纽带强化',
            collectiveIdentity: '集体身份形成',
            sacredCreation: '神圣符号创造'
          },
          examples: [
            '宗教仪式',
            '体育赛事',
            '政治集会',
            '音乐会',
            '抗议活动'
          ]
        },
        
        // 社会整合功能
        socialIntegration: {
          mechanical: '相似性基础上的整合 (传统社会)',
          organic: '差异性基础上的整合 (现代社会)',
          role: '集体情绪强化社会团结'
        }
      },
      
      /**
       * 集体情绪检测与建模
       */
      detectionModeling: {
        // 检测指标
        indicators: {
          synchrony: {
            name: '情绪表达同步性',
            measure: '时间序列相关性',
            threshold: 0.7,
            example: '群体面部表情/语音特征的同步变化'
          },
          convergence: {
            name: '情绪评价趋同',
            measure: '评价维度方差',
            threshold: 0.3, // 低方差表示高趋同
            example: '群体对同一事件的评价趋于一致'
          },
          amplification: {
            name: '情绪强度放大',
            measure: '集体强度 / 个体平均强度',
            threshold: 1.5,
            example: '群体中的情绪强度高于独处时'
          },
          sharedObject: {
            name: '共享情绪对象',
            measure: '对象一致性',
            threshold: 1.0, // 必须完全一致
            example: '群体情绪指向同一目标/事件'
          },
          mutualAwareness: {
            name: '相互意识',
            measure: '共同知识深度',
            threshold: 3, // 至少三层递归意识
            example: '我知道你知道我知道...'
          }
        },
        
        // 生成机制
        generativeMechanisms: {
          emotionalContagion: {
            name: '情绪传染',
            mechanism: '自动模仿 + 本体反馈',
            speed: '快速 (毫秒级)',
            consciousness: '无意识',
            example: '打哈欠传染、笑声传染'
          },
          socialAppraisal: {
            name: '社会评价',
            mechanism: '参照他人反应来评价情境',
            speed: '中速 (秒级)',
            consciousness: '部分意识',
            example: '不确定时看他人反应来判断危险'
          },
          sharedAttention: {
            name: '共享注意',
            mechanism: '共同聚焦同一对象',
            speed: '中速',
            consciousness: '意识',
            example: '大家一起看同一场比赛'
          },
          collectiveRitual: {
            name: '集体仪式',
            mechanism: '同步行动 + 共享意义',
            speed: '慢速 (分钟/小时级)',
            consciousness: '高度意识',
            example: '宗教仪式、国歌合唱'
          }
        },
        
        // 集体情绪类型分类
        classification: {
          emotionalContagion: {
            name: '情绪传染',
            indicators: { synchrony: 'high', convergence: 'low', mutualAwareness: 'none' },
            example: '人群中传播的恐慌'
          },
          sharedEmotion: {
            name: '共享情绪',
            indicators: { synchrony: 'high', convergence: 'high', mutualAwareness: 'partial' },
            example: '团队成员共享的胜利喜悦'
          },
          collectiveEffervescence: {
            name: '集体欢腾',
            indicators: { synchrony: 'very high', amplification: 'very high', sharedObject: 'yes' },
            example: '演唱会万人大合唱'
          },
          weEmotion: {
            name: '我们情绪',
            indicators: { mutualAwareness: 'full', convergence: 'very high', sharedObject: 'yes' },
            example: '夫妻共同为孩子骄傲'
          }
        }
      }
    }
  }

  /**
   * 构建自我意识双层结构
   * 基于 SEP Self-Consciousness + 现象学 + 分析哲学
   */
  buildSelfConsciousnessDualLayer () {
    return {
      /**
       * 层一：前反思自我意识 (Pre-reflective Self-Consciousness)
       * 现象学传统：Husserl, Sartre, Heidelberg School, Fichte
       */
      prereflectiveLayer: {
        coreClaim: '意识总是伴随着对自身的非对象化意识',
        tradition: '现象学',
        
        // 核心特征
        characteristics: {
          nonObjectifying: {
            description: '不将自我作为对象',
            contrast: '反思式自我意识将自我作为对象',
            example: '数香烟时，意识到自己在数，但不将"自己"作为对象'
          },
          immediate: {
            description: '直接的、非推断的',
            contrast: '反思式自我知识可能需要推理',
            example: '直接感受到疼痛，无需推理'
          },
          ubiquitous: {
            description: '伴随所有意识体验',
            contrast: '反思是间歇性的',
            example: '任何体验都有"为我性" (for-me-ness)'
          },
          minimal: {
            description: '最小自我感 (ipseity)',
            contrast: '叙事自我是丰富的',
            example: '最基本的"这是我在体验"的感觉'
          }
        },
        
        // Fichte 的自身设定 (Self-Positing)
        fichteSelfPositing: {
          claim: '自我通过存在而设定自身存在',
          formula: 'self exists → self posits itself',
          implication: '自我意识是行动 (Tathandlung) 而非事实 (Tatsache)',
          modernInterpretation: '自我意识是构成性的，而非认知性的'
        },
        
        // Sartre 的前反思意识
        sartrePreReflective: {
          claim: '意识是对某物的意识，同时是对自身的意识',
          structure: '前反思意识 → 反思意识',
          example: {
            preReflective: '专注于数香烟',
            reflective: '意识到"我在数香烟"'
          },
          implication: '反思以前反思为基础'
        },
        
        //  Heidelberg School 的自身意识
        heidelbergSchool: {
          claim: '自身意识是意识的自身给定性 (self-givenness)',
          keyFigures: ['Henrich', 'Tugendhat', 'Frank'],
          argument: '反思模型导致无穷倒退，需要前反思的自身意识'
        },
        
        // 检测方法
        detection: {
          markers: [
            '第一人称体验报告 ("我感到...")',
            '体验的"为我性" (for-me-ness)',
            '非对象化的自我觉察',
            '身体感受的直接性'
          ],
          assessment: {
            name: '前反思觉察量表',
            dimensions: [
              '身体觉察 (body awareness)',
              '情绪觉察 (emotion awareness)',
              '体验流觉察 (stream of consciousness awareness)',
              '最小自我感 (minimal self)'
            ]
          }
        }
      },
      
      /**
       * 层二：反思式自我知识 (Reflective Self-Knowledge)
       * 分析哲学传统：Locke, Kant, 当代自我知识理论
       */
      reflectiveLayer: {
        // 直觉式自我知识
        intuitiveSelfKnowledge: {
          claim: '对自己心智状态的直接通达',
          authority: '第一人称权威 (first-person authority)',
          tradition: '笛卡尔 - 洛克传统',
          
          // 透明性论题 (Transparency Thesis)
          transparency: {
            claim: '通过关注世界而非内心来了解自己的心智',
            origin: 'Evans (1982)',
            example: '问自己"我相信 p 吗？" → 思考"p 是否为真"',
            implication: '自我知识是外向的而非内向的',
            application: '信念/欲望等命题态度的自我知识'
          },
          
          // 特征
          characteristics: {
            direct: '无需推理或证据',
            authoritative: '他人难以挑战',
            nonInferential: '不基于观察或推理',
            presentTense: '关于当前心智状态'
          }
        },
        
        // 推论式自我知识
        inferentialSelfKnowledge: {
          claim: '通过推理/证据了解自己',
          tradition: '休谟 - 知觉主义传统',
          
          // 方法
          methods: {
            selfObservation: {
              name: '自我观察',
              example: '注意到自己在颤抖，推断自己害怕',
              limitation: '可能出错'
            },
            behavioralInference: {
              name: '行为推理',
              example: '看到自己回避某物，推断自己不喜欢它',
              limitation: '自我欺骗可能'
            },
            socialFeedback: {
              name: '他人反馈',
              example: '朋友说你看起来焦虑',
              limitation: '他人可能误判'
            },
            theoreticalInference: {
              name: '理论推理',
              example: '根据心理学理论推断自己的情绪',
              limitation: '理论可能不适用'
            }
          },
          
          // 特征
          characteristics: {
            inferential: '基于推理',
            fallible: '可能出错',
            thirdPerson: '类似了解他人的方式',
            pastTense: '常关于过去的心智状态'
          }
        },
        
        // 检测方法
        detection: {
          intuitiveMarkers: [
            '确定性报告 ("我确定我感到...")',
            '无需解释的自我知识',
            '第一人称权威主张'
          ],
          inferentialMarkers: [
            '推理性报告 ("我可能是因为...而感到...")',
            '证据引用 ("因为我一直在想...")',
            '不确定性表达 ("我觉得我可能...")'
          ],
          assessment: {
            name: '自我知识来源量表',
            dimensions: [
              '直觉性得分',
              '推论性得分',
              '来源一致性'
            ]
          }
        }
      },
      
      /**
       * 双层整合模型
       */
      dualLayerIntegration: {
        model: {
          prereflective: {
            name: '前反思层',
            function: '提供基本的自我感 (minimal self)',
            access: '非概念化、直接',
            reliability: '高 (构成性)',
            consciousness: '伴随所有意识',
            development: '婴儿期即存在'
          },
          reflective: {
            name: '反思层',
            function: '提供叙事自我 (narrative self)',
            access: '概念化、推断',
            reliability: '中 (可修正)',
            consciousness: '间歇性',
            development: '儿童期逐渐发展'
          }
        },
        
        // 层间关系
        interLayerRelations: {
          foundation: '前反思层是反思层的基础',
          enrichment: '反思层丰富前反思层的内容',
          conflict: '两层可能产生冲突 (如：直觉感到 X，但推理认为 Y)',
          integration: '健康自我意识需要两层协调'
        },
        
        // 自我检查元认知
        metacognitiveCheck: {
          prereflectiveCheck: {
            name: '前反思觉察检查',
            questions: [
              '我此刻有怎样的身体感受？',
              '这个体验的"为我性"是怎样的？',
              '我能直接觉察到什么，无需思考？'
            ]
          },
          reflectiveCheck: {
            name: '反思自我知识检查',
            questions: [
              '我如何知道自己处于这种状态？',
              '这个自我知识有证据支持吗？',
              '有没有其他可能的解释？'
            ]
          },
          coherenceCheck: {
            name: '层间一致性检查',
            questions: [
              '我的直觉感受和推理结论一致吗？',
              '如果不一致，哪个更可信？',
              '如何整合这两种自我知识？'
            ]
          }
        }
      }
    }
  }

  /**
   * 构建情绪 - 集体 - 自我三元整合框架
   */
  buildTriadIntegrationFramework () {
    return {
      /**
       * 集体情绪中的自我意识变化
       */
      selfInCollectiveEmotion: {
        phenomenon: '在集体情绪中，自我感发生系统性变化',
        
        // 自我扩展效应
        selfExpansion: {
          description: '自我边界扩展至群体',
          mechanism: '认知上将他者纳入自我概念',
          evidence: 'Aron & Aron 自我扩展理论',
          example: '球迷说"我们赢了"而非"他们赢了"'
        },
        
        // 身份融合
        identityFusion: {
          description: '个人身份与群体身份融合',
          types: {
            local: '与具体他人融合',
            collective: '与抽象群体融合'
          },
          consequence: '为群体牺牲的意愿增加',
          example: '为国捐躯的意愿'
        },
        
        // 能动性转移
        agencyShift: {
          from: '"我做" (individual agency)',
          to: '"我们做" (collective agency)',
          implication: '个人责任感可能降低 (去个体化)',
          risk: '群体极化、去抑制效应'
        },
        
        // Scheler 的集体情绪现象学应用
        schelerApplication: {
          claim: '集体情绪中，多个心智处于数值上相同的状态',
          experience: '"我们的悲伤"而非"我的悲伤 + 你的悲伤"',
          implication: '集体情绪具有不可还原的现象学特征'
        }
      },
      
      /**
       * 情绪评价中的自我参照
       */
      selfReferentialAppraisal: {
        claim: '情绪评价总是涉及自我参照',
        
        // 自我参照维度
        dimensions: {
          selfRelevance: {
            name: '自我相关性',
            question: '这件事与我有关吗？',
            high: '直接影响我的福祉',
            low: '与我无关'
          },
          selfCongruence: {
            name: '自我一致性',
            question: '这件事与我的自我概念一致吗？',
            congruent: '符合我的价值观/身份',
            incongruent: '威胁我的自我概念'
          },
          selfEfficacy: {
            name: '自我效能感',
            question: '我能应对这件事吗？',
            high: '我有能力应对',
            low: '我无能为力'
          },
          selfEsteem: {
            name: '自尊影响',
            question: '这件事影响我的自我价值吗？',
            positive: '提升自我价值',
            negative: '损害自我价值'
          }
        },
        
        // 情绪产生的自我参照路径
        pathways: {
          threat: {
            appraisal: '威胁自我相关性 + 低自我效能',
            emotion: '恐惧、焦虑'
          },
          anger: {
            appraisal: '自我不一致 + 他人责任',
            emotion: '愤怒'
          },
          pride: {
            appraisal: '自我一致性 + 自我责任',
            emotion: '自豪'
          },
          shame: {
            appraisal: '自我不一致 + 自我责任',
            emotion: '羞耻'
          }
        }
      },
      
      /**
       * 实践应用：多层情绪调节策略
       */
      regulationStrategies: {
        // 基于 Feeling Tradition
        feelingBased: {
          name: '感受导向调节',
          techniques: {
            interoceptiveAwareness: {
              name: '内感受觉察',
              instruction: '关注身体内部感受，不加评判',
              example: '扫描身体，注意紧张/放松的部位'
            },
            somaticRegulation: {
              name: '身体调节',
              techniques: ['深呼吸', '渐进式肌肉放松', '正念身体扫描'],
              mechanism: '通过身体调节影响情绪'
            },
            emotionLabeling: {
              name: '情绪标签化',
              instruction: '用语言标记当前情绪',
              effect: '降低杏仁核激活 (affect labeling)'
            }
          }
        },
        
        // 基于 Evaluative Tradition
        evaluationBased: {
          name: '评价导向调节',
          techniques: {
            cognitiveReappraisal: {
              name: '认知重评',
              instruction: '重新解释情境的意义',
              example: '将"威胁"重评为"挑战"'
            },
            perspectiveTaking: {
              name: '视角转换',
              instruction: '从他人/未来自我视角看当前情境',
              effect: '降低情绪强度'
            },
            valueAlignment: {
              name: '价值一致性检查',
              instruction: '检查情绪反应与核心价值是否一致',
              example: '愤怒是否符合我的公正价值观？'
            }
          }
        },
        
        // 基于 Motivational Tradition
        motivationBased: {
          name: '动机导向调节',
          techniques: {
            actionTendencyAwareness: {
              name: '行动倾向觉察',
              instruction: '觉察情绪驱动的冲动，但不立即行动',
              example: '感到愤怒时，觉察攻击冲动但不行动'
            },
            urgeSurfing: {
              name: '冲动冲浪',
              instruction: '观察冲动如海浪般起伏，不抗拒也不顺从',
              origin: '正念复发预防 (MBRP)'
            },
            valueBasedAction: {
              name: '价值导向行动',
              instruction: '按照核心价值行动，而非情绪冲动',
              origin: '接纳承诺疗法 (ACT)'
            }
          }
        },
        
        // 集体情绪调节
        collectiveRegulation: {
          name: '集体情绪调节',
          techniques: {
            groupCoherence: {
              name: '群体一致性调节',
              instruction: '同步呼吸/动作，增强群体凝聚力',
              example: '团队冥想、同步呼吸练习'
            },
            sharedMeaningMaking: {
              name: '共享意义建构',
              instruction: '群体共同讨论事件意义',
              example: '团队复盘、集体反思'
            },
            collectiveRitual: {
              name: '集体仪式参与',
              instruction: '参与有意义的集体仪式',
              example: '团队仪式、纪念活动'
            }
          }
        },
        
        // 自我意识调节
        selfConsciousnessRegulation: {
          name: '自我意识调节',
          techniques: {
            prereflectiveCultivation: {
              name: '前反思觉察培养',
              instruction: '正念冥想，培养非评判的当下觉察',
              effect: '增强最小自我感稳定性'
            },
            reflectiveCalibration: {
              name: '反思校准',
              instruction: '检查自我知识的来源和可靠性',
              effect: '减少自我欺骗'
            },
            layerIntegration: {
              name: '层间整合',
              instruction: '整合直觉感受和理性推理',
              example: '我感到 X，我认为 Y，如何理解这种差异？'
            }
          }
        }
      }
    }
  }

  /**
   * 检测集体情绪类型
   */
  detectCollectiveEmotionType (groupData) {
    const indicators = {
      synchrony: this.calculateSynchrony(groupData.expressions),
      convergence: this.calculateConvergence(groupData.appraisals),
      amplification: this.calculateAmplification(groupData.intensities),
      sharedObject: this.checkSharedObject(groupData.objects),
      mutualAwareness: this.assessMutualAwareness(groupData.interactions)
    }
    
    // 分类逻辑
    if (indicators.mutualAwareness >= 3 && indicators.convergence > 0.8) {
      return {
        type: 'weEmotion',
        confidence: 0.9,
        description: '我们情绪： fully shared collective emotion',
        indicators
      }
    }
    
    if (indicators.synchrony > 0.8 && indicators.amplification > 2.0) {
      return {
        type: 'collectiveEffervescence',
        confidence: 0.85,
        description: '集体欢腾：high-intensity collective arousal',
        indicators
      }
    }
    
    if (indicators.synchrony > 0.7 && indicators.convergence > 0.6) {
      return {
        type: 'sharedEmotion',
        confidence: 0.75,
        description: '共享情绪：coordinated emotional response',
        indicators
      }
    }
    
    if (indicators.synchrony > 0.5 && indicators.mutualAwareness < 1) {
      return {
        type: 'emotionalContagion',
        confidence: 0.7,
        description: '情绪传染：automatic emotional spread',
        indicators
      }
    }
    
    return {
      type: 'aggregatedIndividualEmotion',
      confidence: 0.6,
      description: '个体情绪聚合：no genuine collective emotion',
      indicators
    }
  }

  calculateSynchrony (expressions) {
    // 计算情绪表达同步性 (简化实现)
    if (!expressions || expressions.length < 2) return 0
    // 实际实现需要时间序列分析
    return 0.75 // placeholder
  }

  calculateConvergence (appraisals) {
    // 计算评价趋同性 (简化实现)
    if (!appraisals || appraisals.length < 2) return 0
    return 0.8 // placeholder
  }

  calculateAmplification (intensities) {
    // 计算强度放大
    if (!intensities || intensities.length < 2) return 1
    const avgIndividual = intensities.reduce((a, b) => a + b, 0) / intensities.length
    const collectiveIntensity = Math.max(...intensities)
    return collectiveIntensity / avgIndividual
  }

  checkSharedObject (objects) {
    // 检查是否有共享的情绪对象
    if (!objects || objects.length < 2) return 0
    const uniqueObjects = new Set(objects)
    return uniqueObjects.size === 1 ? 1 : 0
  }

  assessMutualAwareness (interactions) {
    // 评估相互意识深度 (简化实现)
    // 实际实现需要分析对话中的递归心智理论标记
    return 2 // placeholder
  }

  /**
   * 评估自我知识来源
   */
  assessSelfKnowledgeSource (selfReport) {
    const intuitiveScore = this.calculateIntuitiveScore(selfReport)
    const inferentialScore = this.calculateInferentialScore(selfReport)
    
    return {
      intuitive: intuitiveScore,
      inferential: inferentialScore,
      dominant: intuitiveScore > inferentialScore ? 'intuitive' : 'inferential',
      coherence: 1 - Math.abs(intuitiveScore - inferentialScore) / 10,
      recommendation: this.getSelfKnowledgeRecommendation(intuitiveScore, inferentialScore)
    }
  }

  calculateIntuitiveScore (report) {
    // 检测直觉式自我知识标记
    const intuitiveMarkers = [
      /我确定/i,
      /直接感到/i,
      /毫无疑问/i,
      /显然/i,
      /我就是知道/i
    ]
    
    let score = 5 // baseline
    intuitiveMarkers.forEach(marker => {
      if (marker.test(report)) score += 1
    })
    
    return Math.min(10, score)
  }

  calculateInferentialScore (report) {
    // 检测推论式自我知识标记
    const inferentialMarkers = [
      /可能是因为/i,
      /我觉得/i,
      /也许/i,
      /看起来/i,
      /根据.*推断/i,
      /因为.*所以/i
    ]
    
    let score = 5 // baseline
    inferentialMarkers.forEach(marker => {
      if (marker.test(report)) score += 1
    })
    
    return Math.min(10, score)
  }

  getSelfKnowledgeRecommendation (intuitive, inferential) {
    if (Math.abs(intuitive - inferential) > 3) {
      return {
        issue: '自我知识来源冲突',
        suggestion: '探索直觉和推理之间的差异，可能揭示潜在的自我欺骗或未整合的体验'
      }
    }
    
    if (intuitive > 8 && inferential < 4) {
      return {
        issue: '过度依赖直觉',
        suggestion: '考虑寻求外部反馈或证据来校准自我认知'
      }
    }
    
    if (inferential > 8 && intuitive < 4) {
      return {
        issue: '过度理性化',
        suggestion: '培养正念觉察，连接身体感受和直接体验'
      }
    }
    
    return {
      issue: '自我知识整合良好',
      suggestion: '继续保持直觉和反思的平衡'
    }
  }

  /**
   * 生成调节建议
   */
  generateRegulationRecommendation (emotionState, context) {
    const recommendations = []
    
    // 基于情绪成分分析
    if (emotionState.bodilyAwareness < 0.5) {
      recommendations.push({
        type: 'feeling',
        technique: '内感受觉察',
        instruction: '花 2 分钟扫描身体，注意各部位的感受'
      })
    }
    
    if (emotionState.appraisalClarity < 0.5) {
      recommendations.push({
        type: 'evaluative',
        technique: '认知重评',
        instruction: '尝试从三个不同角度重新解释当前情境'
      })
    }
    
    if (emotionState.actionUrgency > 0.8) {
      recommendations.push({
        type: 'motivational',
        technique: '冲动冲浪',
        instruction: '观察冲动如海浪般起伏，等待 10 分钟再决定行动'
      })
    }
    
    // 基于集体情境
    if (context.isGroupContext) {
      recommendations.push({
        type: 'collective',
        technique: '群体一致性调节',
        instruction: '与群体同步呼吸 3 分钟，增强连接感'
      })
    }
    
    // 基于自我知识来源
    const selfKnowledgeAssessment = this.assessSelfKnowledgeSource(emotionState.selfReport || '')
    if (selfKnowledgeAssessment.issue !== '自我知识整合良好') {
      recommendations.push({
        type: 'selfConsciousness',
        technique: selfKnowledgeAssessment.suggestion,
        instruction: '反思直觉感受和理性思考之间的关系'
      })
    }
    
    return recommendations
  }
}

module.exports = CollectiveEmotionPhenomenology
