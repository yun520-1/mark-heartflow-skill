/**
 * 情绪理性整合模块 v4.3.0 (Emotion Rationality Integration)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 情绪理论权威整合
 * 
 * 核心理论来源:
 * - SEP Emotion (https://plato.stanford.edu/entries/emotion/)
 * - 情绪三大传统完整整合 (Feeling/Evaluative/Motivational)
 * - 情绪理性理论 (Emotion Rationality)
 * - 情绪恰当性评估 (Emotion Appropriateness)
 * - 情绪证成性框架 (Emotion Justification)
 * 
 * 新增功能 v4.3.0:
 * - 情绪三大传统整合评估框架
 * - 情绪理性五维度评估 (认知理性/战略理性/恰当性/证成性/一致性)
 * - 情绪恰当性评估工具 (对象恰当性/强度恰当性)
 * - 情绪证成性框架 (证据基础/推理质量)
 * - 情绪一致性检查 (情绪 - 信念/情绪 - 行动一致性)
 * 
 * 可操作技术:
 * - 情绪传统识别：识别情绪体验中的感觉/评价/动机成分
 * - 情绪理性评估：评估情绪的理性程度
 * - 情绪恰当性反思：反思情绪是否适合情境
 * - 情绪证成性探索：探索情绪的证据基础
 * - 情绪一致性校准：校准情绪与信念/行动的一致性
 * 
 * @module emotion-rationality-integration-v4.3
 * @version 4.3.0
 * @author HeartFlow Team
 */

const EmotionRationalityIntegrationV43 = {
  /**
   * 模块元信息
   */
  meta: {
    name: '情绪理性整合 v4.3',
    version: '4.3.0',
    source: 'SEP Emotion Theory + Emotion Rationality (Scarantino 2016/2024)',
    description: '基于 SEP 情绪三大传统与情绪理性理论的深度整合模块',
    upgradeDate: '2026-03-30'
  },

  /**
   * 情绪三大传统 (Three Traditions in Emotion Theory)
   * SEP 情绪理论核心框架
   */
  threeTraditions: {
    /**
     * 感觉传统 (Feeling Tradition)
     * 核心主张：情绪的本质是独特的意识体验
     * 代表人物：William James, Carl Lange, contemporary feeling theorists
     */
    feeling: {
      name: '感觉传统',
      coreThesis: '情绪是独特的意识体验类别，通过感受质 (qualia) 区分',
      proponents: ['William James', 'Carl Lange', 'Jesse Prinz', 'Peter Goldie'],
      keyClaims: [
        '情绪是身体变化的感知 (James-Lange 理论)',
        '情绪感受是原初的、不可还原的',
        '情绪感受具有现象学特征',
        '情绪感受可以无认知地发生'
      ],
      strengths: [
        '捕捉情绪的现象学维度',
        '解释情绪的主观体验质量',
        '与日常情绪概念兼容度高'
      ],
      weaknesses: [
        '难以解释情绪的对象指向性 (intentionality)',
        '难以区分情绪与单纯的身体感受',
        '无法解释无意识情绪的可能性'
      ],
      assess: function(experience) {
        const assessment = {
          tradition: 'feeling',
          indicators: [],
          score: 0
        };
        
        // 检测感觉传统特征
        if (experience.includes('感觉') || experience.includes('感受') || experience.includes('体验')) {
          assessment.indicators.push('强调主观感受体验');
          assessment.score += 2;
        }
        if (experience.includes('身体') || experience.includes('生理') || experience.includes('心跳') || experience.includes('紧张')) {
          assessment.indicators.push'身体变化感知');
          assessment.score += 2;
        }
        if (experience.includes'无法形容' || experience.includes'难以描述') {
          assessment.indicators.push('感受的原初性');
          assessment.score += 1;
        }
        
        return assessment;
      }
    },

    /**
     * 评价传统 (Evaluative Tradition)
     * 核心主张：情绪的本质是对情境的独特评价/ construal
     * 代表人物：Aristotle, Martha Nussbaum, Robert Solomon, appraisal theorists
     */
    evaluative: {
      name: '评价传统',
      coreThesis: '情绪是 (或涉及) 对引发情境的独特评价或 construal',
      proponents: ['Aristotle', 'Martha Nussbaum', 'Robert Solomon', 'Magda Arnold', 'Richard Lazarus'],
      keyClaims: [
        '情绪包含对情境的评价性判断',
        '情绪评价涉及核心关系主题 (core relational themes)',
        '情绪评价可以是无意识的',
        '情绪评价决定情绪类型 (愤怒=冒犯评价，恐惧=威胁评价)'
      ],
      coreRelationalThemes: {
        anger: '对我或我的价值的冒犯/贬低',
        fear: '对迫近的危险/威胁',
        sadness: '对重要损失的确认',
        happiness: '对目标达成/价值实现的确认',
        disgust: '对污染物/厌恶物的排斥',
        guilt: '对道德违规的自我归因',
        shame: '对自我缺陷的暴露',
        pride: '对自我成就的确认',
        envy: '对他人优势的渴望',
        jealousy: '对关系威胁的感知',
        gratitude: '对他人善意的认可',
        hope: '对未来积极结果的期待',
        love: '对对象价值的肯定与依恋'
      },
      strengths: [
        '解释情绪的对象指向性',
        '解释情绪的恰当性条件',
        '解释情绪与理性的关系',
        '与认知心理学兼容'
      ],
      weaknesses: [
        '难以解释婴儿和动物的情绪',
        '难以解释快速自动的情绪反应',
        '可能过度认知化情绪'
      ],
      assess: function(experience) {
        const assessment = {
          tradition: 'evaluative',
          indicators: [],
          score: 0
        };
        
        // 检测评价传统特征
        if (experience.includes('认为') || experience.includes('觉得') || experience.includes('判断')) {
          assessment.indicators.push('包含评价性判断');
          assessment.score += 2;
        }
        if (experience.includes('威胁') || experience.includes('冒犯') || experience.includes('损失') || experience.includes('危险')) {
          assessment.indicators.push('核心关系主题识别');
          assessment.score += 2;
        }
        if (experience.includes('应该') || experience.includes('不公平') || experience.includes('错误')) {
          assessment.indicators.push('规范性评价');
          assessment.score += 1;
        }
        
        return assessment;
      }
    },

    /**
     * 动机传统 (Motivational Tradition)
     * 核心主张：情绪的本质是独特的动机状态
     * 代表人物：Aristotle, Hume, contemporary motivational theorists
     */
    motivational: {
      name: '动机传统',
      coreThesis: '情绪是独特的动机状态，驱动特定类型的行动倾向',
      proponents: ['Aristotle', 'David Hume', 'Jenefer Robinson', 'Aaron Ben-Ze\'ev'],
      keyClaims: [
        '情绪包含行动倾向 (action tendencies)',
        '情绪动机具有紧迫性 (urgency)',
        '情绪动机可以压倒其他动机',
        '情绪动机具有目标指向性'
      ],
      actionTendencies: {
        anger: '攻击/对抗/消除冒犯',
        fear: '逃避/回避/寻求安全',
        sadness: '退缩/寻求支持/放弃',
        happiness: '接近/维持/分享',
        disgust: '排斥/远离/清除',
        guilt: '补偿/修复/道歉',
        shame: '隐藏/逃避/退缩',
        pride: '展示/维持/追求更多',
        envy: '获取/破坏他人优势',
        jealousy: '保护关系/消除威胁',
        gratitude: '回报/维持关系',
        hope: '追求/坚持',
        love: '接近/照顾/保护'
      },
      strengths: [
        '解释情绪的动机力量',
        '解释情绪与行动的联系',
        '解释情绪的适应性功能',
        '与进化心理学兼容'
      ],
      weaknesses: [
        '难以解释不伴随行动倾向的情绪',
        '难以区分情绪与其他动机状态',
        '可能过度简化情绪的复杂性'
      ],
      assess: function(experience) {
        const assessment = {
          tradition: 'motivational',
          indicators: [],
          score: 0
        };
        
        // 检测动机传统特征
        if (experience.includes('想') || experience.includes('想要') || experience.includes('冲动')) {
          assessment.indicators.push('行动倾向表达');
          assessment.score += 2;
        }
        if (experience.includes('必须') || experience.includes('不得不') || experience.includes('忍不住')) {
          assessment.indicators.push('动机紧迫性');
          assessment.score += 2;
        }
        if (experience.includes('逃避') || experience.includes('对抗') || experience.includes('接近')) {
          assessment.indicators.push('具体行动倾向');
          assessment.score += 1;
        }
        
        return assessment;
      }
    }
  },

  /**
   * 情绪理性评估框架 (Emotion Rationality Assessment Framework)
   * 基于 SEP 情绪理论第 10 节：情绪与理性
   */
  emotionRationality: {
    name: '情绪理性评估',
    
    /**
     * 情绪理性的五个维度
     */
    dimensions: {
      /**
       * 认知理性 (Cognitive Rationality)
       * 情绪的评价/信念是否有充分的证据支持
       */
      cognitive: {
        name: '认知理性',
        description: '情绪背后的评价/信念是否有充分的证据支持',
        criteria: [
          '证据充分性：是否有足够的证据支持情绪评价',
          '证据质量：证据是否可靠、相关',
          '推理质量：从证据到评价的推理是否合理',
          '信念一致性：情绪评价与其他信念是否一致'
        ],
        assess: function(emotion, evidence) {
          const assessment = {
            dimension: 'cognitive',
            score: 0,  // 0-100
            strengths: [],
            weaknesses: [],
            recommendations: []
          };
          
          // 证据充分性评估
          if (evidence.quantity >= 3 && evidence.quality >= 0.7) {
            assessment.score += 25;
            assessment.strengths.push('证据充分且质量高');
          } else if (evidence.quantity >= 1 && evidence.quality >= 0.5) {
            assessment.score += 15;
            assessment.strengths.push('有一定证据支持');
          } else {
            assessment.weaknesses.push('证据不足或质量低');
            assessment.recommendations.push('收集更多相关证据');
          }
          
          // 推理质量评估
          if (evidence.reasoningQuality >= 0.8) {
            assessment.score += 25;
            assessment.strengths.push('推理逻辑清晰');
          } else if (evidence.reasoningQuality >= 0.5) {
            assessment.score += 15;
            assessment.strengths.push('推理基本合理');
          } else {
            assessment.weaknesses.push('推理存在漏洞');
            assessment.recommendations.push('检查推理链条，识别逻辑谬误');
          }
          
          // 信念一致性评估
          if (evidence.consistency >= 0.9) {
            assessment.score += 25;
            assessment.strengths.push('与其他信念高度一致');
          } else if (evidence.consistency >= 0.6) {
            assessment.score += 15;
            assessment.strengths.push('与其他信念基本一致');
          } else {
            assessment.weaknesses.push('与其他信念存在冲突');
            assessment.recommendations.push('识别并解决信念冲突');
          }
          
          return assessment;
        }
      },

      /**
       * 战略理性 (Strategic Rationality)
       * 情绪是否有助于实现行动者的目标
       */
      strategic: {
        name: '战略理性',
        description: '情绪是否有助于实现行动者的短期和长期目标',
        criteria: [
          '目标一致性：情绪是否支持而非阻碍目标实现',
          '情境适应性：情绪是否适合当前情境',
          '长期效益：情绪是否带来长期益处而非仅短期满足',
          '社会适应性：情绪是否有助于而非损害社会关系'
        ],
        assess: function(emotion, goals, context) {
          const assessment = {
            dimension: 'strategic',
            score: 0,
            strengths: [],
            weaknesses: [],
            recommendations: []
          };
          
          // 目标一致性评估
          const goalAlignment = this.calculateGoalAlignment(emotion, goals);
          if (goalAlignment >= 0.8) {
            assessment.score += 25;
            assessment.strengths.push('情绪高度支持目标实现');
          } else if (goalAlignment >= 0.5) {
            assessment.score += 15;
            assessment.strengths.push('情绪部分支持目标实现');
          } else {
            assessment.weaknesses.push('情绪可能阻碍目标实现');
            assessment.recommendations.push('重新评估情绪对目标的影响');
          }
          
          // 情境适应性评估
          if (context.appropriateness >= 0.8) {
            assessment.score += 25;
            assessment.strengths.push('情绪适合当前情境');
          } else {
            assessment.weaknesses.push('情绪可能不适合当前情境');
            assessment.recommendations.push('考虑情境特点，调整情绪反应');
          }
          
          return assessment;
        },
        
        calculateGoalAlignment: function(emotion, goals) {
          // 简化的目标对齐计算
          return 0.7;  // 实际实现需要更复杂的逻辑
        }
      },

      /**
       * 恰当性 (Appropriateness)
       * 情绪是否适合其对象和情境
       */
      appropriateness: {
        name: '恰当性',
        description: '情绪是否适合其对象和引发情境',
        types: {
          /**
           * 对象恰当性 (Object Appropriateness)
           * 情绪是否适合其对象
           */
          object: {
            name: '对象恰当性',
            description: '情绪对象是否真正具有引发该情绪的属性',
            examples: {
              appropriate: '对真正的威胁感到恐惧',
              inappropriate: '对无害事物感到恐惧 (如恐惧症)'
            },
            assess: function(emotion, object, objectProperties) {
              const assessment = {
                type: 'object',
                isAppropriate: true,
                reasons: [],
                recommendations: []
              };
              
              // 检查对象属性是否匹配情绪
              const match = this.checkEmotionObjectMatch(emotion, objectProperties);
              if (match) {
                assessment.reasons.push('对象属性与情绪匹配');
              } else {
                assessment.isAppropriate = false;
                assessment.reasons.push('对象属性与情绪不匹配');
                assessment.recommendations.push('重新评估对象的真实属性');
              }
              
              return assessment;
            }
          },

          /**
           * 强度恰当性 (Intensity Appropriateness)
           * 情绪强度是否与情境严重程度匹配
           */
          intensity: {
            name: '强度恰当性',
            description: '情绪强度是否与情境的严重程度相匹配',
            examples: {
              appropriate: '对轻微冒犯感到轻微不悦',
              inappropriate: '对轻微冒犯感到极度愤怒'
            },
            assess: function(emotion, intensity, situationSeverity) {
              const assessment = {
                type: 'intensity',
                isAppropriate: true,
                mismatch: 0,  // 0 = 完全匹配，1 = 完全不匹配
                reasons: [],
                recommendations: []
              };
              
              // 计算强度与严重程度的匹配度
              const mismatch = Math.abs(intensity - situationSeverity);
              assessment.mismatch = mismatch;
              
              if (mismatch < 0.2) {
                assessment.reasons.push('情绪强度与情境严重程度匹配良好');
              } else if (mismatch < 0.5) {
                assessment.reasons.push('情绪强度与情境严重程度基本匹配');
              } else {
                assessment.isAppropriate = false;
                if (intensity > situationSeverity) {
                  assessment.reasons.push('情绪反应过度');
                  assessment.recommendations.push('考虑情境的实际严重程度，调整情绪强度');
                } else {
                  assessment.reasons.push('情绪反应不足');
                  assessment.recommendations.push('考虑情境的重要性，允许自己更充分地体验情绪');
                }
              }
              
              return assessment;
            }
          }
        }
      },

      /**
       * 证成性 (Justification)
       * 情绪是否有充分的理由/证成
       */
      justification: {
        name: '证成性',
        description: '情绪是否有充分的理由或证成',
        criteria: [
          '证据基础：情绪是否有事实证据支持',
          '推理质量：从证据到情绪的推理是否合理',
          '价值一致性：情绪是否与行动者的核心价值观一致',
          '社会证成：情绪是否在社会规范下可被理解'
        ],
        assess: function(emotion, reasons) {
          const assessment = {
            isJustified: true,
            score: 0,  // 0-100
            strengths: [],
            weaknesses: [],
            recommendations: []
          };
          
          // 证据基础评估
          if (reasons.evidence && reasons.evidence.length > 0) {
            assessment.score += 25;
            assessment.strengths.push('有事实证据支持');
          } else {
            assessment.weaknesses.push('缺乏事实证据支持');
            assessment.recommendations.push('寻找支持情绪的具体证据');
          }
          
          // 推理质量评估
          if (reasons.reasoning && reasons.reasoningQuality >= 0.7) {
            assessment.score += 25;
            assessment.strengths.push('推理逻辑合理');
          } else {
            assessment.weaknesses.push('推理可能存在漏洞');
            assessment.recommendations.push('检查从证据到情绪的推理链条');
          }
          
          return assessment;
        }
      },

      /**
       * 一致性 (Consistency)
       * 情绪与信念、行动、其他情绪是否一致
       */
      consistency: {
        name: '一致性',
        description: '情绪与信念、行动、其他情绪是否一致',
        types: {
          /**
           * 情绪 - 信念一致性 (Emotion-Belief Consistency)
           */
          emotionBelief: {
            name: '情绪 - 信念一致性',
            description: '情绪是否与相关信念一致',
            assess: function(emotion, beliefs) {
              const assessment = {
                type: 'emotion-belief',
                isConsistent: true,
                conflicts: [],
                recommendations: []
              };
              
              // 检查情绪与信念的冲突
              const conflicts = this.detectEmotionBeliefConflicts(emotion, beliefs);
              if (conflicts.length > 0) {
                assessment.isConsistent = false;
                assessment.conflicts = conflicts;
                assessment.recommendations.push('识别并解决情绪与信念的冲突');
              }
              
              return assessment;
            }
          },

          /**
           * 情绪 - 行动一致性 (Emotion-Action Consistency)
           */
          emotionAction: {
            name: '情绪 - 行动一致性',
            description: '情绪驱动的行动倾向是否与实际行动一致',
            assess: function(emotion, actionTendency, actualAction) {
              const assessment = {
                type: 'emotion-action',
                isConsistent: true,
                gap: 0,
                reasons: [],
                recommendations: []
              };
              
              // 计算行动倾向与实际行动的差距
              const gap = this.calculateActionGap(actionTendency, actualAction);
              assessment.gap = gap;
              
              if (gap < 0.3) {
                assessment.reasons.push('行动与情绪一致');
              } else {
                assessment.reasons.push('行动与情绪存在差距');
                assessment.recommendations.push('探索行动差距的原因，考虑是否需要调整');
              }
              
              return assessment;
            }
          }
        }
      }
    }
  },

  /**
   * 整合评估流程 (Integrated Assessment Process)
   */
  integratedAssessment: function(emotionExperience) {
    const assessment = {
      emotion: emotionExperience.emotion,
      traditions: {},
      rationality: {},
      integration: {
        overallScore: 0,
        strengths: [],
      weaknesses: [],
        recommendations: []
      }
    };
    
    // 三大传统评估
    assessment.traditions.feeling = this.threeTraditions.feeling.assess(emotionExperience.description);
    assessment.traditions.evaluative = this.threeTraditions.evaluative.assess(emotionExperience.description);
    assessment.traditions.motivational = this.threeTraditions.motivational.assess(emotionExperience.description);
    
    // 识别主导传统
    const traditionScores = {
      feeling: assessment.traditions.feeling.score,
      evaluative: assessment.traditions.evaluative.score,
      motivational: assessment.traditions.motivational.score
    };
    assessment.traditions.dominant = Object.keys(traditionScores).reduce(
      (a, b) => traditionScores[a] > traditionScores[b] ? a : b
    );
    
    // 情绪理性评估
    if (emotionExperience.evidence) {
      assessment.rationality.cognitive = this.emotionRationality.dimensions.cognitive.assess(
        emotionExperience.emotion,
        emotionExperience.evidence
      );
    }
    
    // 整合建议
    this.generateIntegrationRecommendations(assessment, emotionExperience);
    
    return assessment;
  },

  /**
   * 生成整合建议
   */
  generateIntegrationRecommendations: function(assessment, experience) {
    const { integration, traditions, rationality } = assessment;
    
    // 基于传统分布的建议
    if (traditions.dominant === 'feeling' && traditions.evaluative.score < 5) {
      integration.recommendations.push('尝试识别情绪背后的评价性判断，这有助于理解情绪的根源');
    }
    if (traditions.dominant === 'evaluative' && traditions.feeling.score < 5) {
      integration.recommendations.push('关注情绪的身体感受体验，这有助于充分体验和调节情绪');
    }
    if (traditions.motivational.score < 5) {
      integration.recommendations.push('探索情绪驱动的行动倾向，理解情绪的功能性目的');
    }
    
    // 基于理性评估的建议
    if (rationality.cognitive && rationality.cognitive.score < 50) {
      integration.recommendations.push('收集更多证据支持情绪评价，或重新评估现有证据的质量');
    }
    
    // 计算整体分数
    integration.overallScore = (
      traditions.feeling.score +
      traditions.evaluative.score +
      traditions.motivational.score +
      (rationality.cognitive ? rationality.cognitive.score : 0)
    ) / 4;
  },

  /**
   * 情绪理性练习 (Emotion Rationality Exercises)
   */
  rationalityExercises: {
    /**
     * 情绪证据收集练习 (5 分钟)
     */
    evidenceCollection: function(emotion) {
      return {
        name: '情绪证据收集练习',
        duration: '5 分钟',
        emotion: emotion,
        steps: [
          {
            step: 1,
            instruction: '识别情绪评价',
            description: '明确你的情绪背后的核心评价 (如"我被冒犯了"、"我面临威胁")',
            duration: '1 分钟'
          },
          {
            step: 2,
            instruction: '收集支持证据',
            description: '列出所有支持这个评价的具体证据 (事实、观察、他人反馈)',
            duration: '2 分钟'
          },
          {
            step: 3,
            instruction: '收集反面证据',
            description: '列出所有可能反驳这个评价的证据',
            duration: '1 分钟'
          },
          {
            step: 4,
            instruction: '证据质量评估',
            description: '评估每条证据的可靠性和相关性 (高/中/低)',
            duration: '1 分钟'
          }
        ],
        reflection: [
          '支持证据是否充分？',
          '证据质量如何？',
          '是否有重要的反面证据被忽略？',
          '基于证据，情绪评价是否需要调整？'
        ]
      };
    },

    /**
     * 情绪恰当性反思练习 (10 分钟)
     */
    appropriatenessReflection: function(emotion, situation) {
      return {
        name: '情绪恰当性反思练习',
        duration: '10 分钟',
        emotion: emotion,
        situation: situation,
        steps: [
          {
            step: 1,
            instruction: '情境描述',
            description: '客观描述引发情绪的情境 (不含评价)',
            duration: '2 分钟'
          },
          {
            step: 2,
            instruction: '对象属性分析',
            description: '分析情境/对象的真实属性，是否与情绪匹配',
            duration: '2 分钟'
          },
          {
            step: 3,
            instruction: '强度匹配评估',
            description: '评估情绪强度是否与情境严重程度匹配',
            duration: '2 分钟'
          },
          {
            step: 4,
            instruction: '社会规范参考',
            description: '考虑在类似情境下，他人的情绪反应如何',
            duration: '2 分钟'
          },
          {
            step: 5,
            instruction: '调整决策',
            description: '决定是否需要调整情绪强度或重新评价情境',
            duration: '2 分钟'
          }
        ],
        reflection: [
          '情绪对象是否真正具有引发该情绪的属性？',
          '情绪强度是否与情境严重程度匹配？',
          '如果不匹配，是什么因素导致了偏差？',
          '如何调整情绪反应使其更恰当？'
        ]
      };
    },

    /**
     * 情绪一致性检查练习 (10 分钟)
     */
    consistencyCheck: function(emotion, beliefs, actions) {
      return {
        name: '情绪一致性检查练习',
        duration: '10 分钟',
        emotion: emotion,
        steps: [
          {
            step: 1,
            instruction: '情绪 - 信念一致性检查',
            description: '列出与情绪相关的信念，检查是否一致',
            duration: '3 分钟',
            prompt: '我的情绪是 X，我的相关信念是 Y，这两者一致吗？'
          },
          {
            step: 2,
            instruction: '情绪 - 行动一致性检查',
            description: '检查情绪驱动的行动倾向与实际行动是否一致',
            duration: '3 分钟',
            prompt: '我的情绪让我想做什么？我实际做了什么？为什么？'
          },
          {
            step: 3,
            instruction: '情绪间一致性检查',
            description: '检查同时存在的多种情绪是否一致',
            duration: '2 分钟',
            prompt: '我同时感受到的多种情绪之间是否冲突？'
          },
          {
            step: 4,
            instruction: '整合调整',
            description: '识别不一致之处，制定调整策略',
            duration: '2 分钟'
          }
        ],
        reflection: [
          '情绪与信念之间是否存在冲突？',
          '如果有冲突，哪个更可靠？',
          '情绪与行动之间的差距说明了什么？',
          '如何整合不一致的部分？'
        ]
      };
    }
  }
};

module.exports = { EmotionRationalityIntegrationV43 };
