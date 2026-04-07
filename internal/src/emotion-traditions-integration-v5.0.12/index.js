/**
 * Emotion Traditions Integration v5.0.12
 * 
 * 基于 SEP 情绪理论三大传统整合：
 * 1. Feeling Tradition (感受传统): 情绪作为独特的意识体验
 * 2. Evaluative Tradition (评价传统): 情绪作为对情境的评价
 * 3. Motivational Tradition (动机传统): 情绪作为动机状态
 * 
 * 理论来源:
 * - SEP Emotion §2: Three Traditions in the Study of Emotions
 * - SEP Emotion §3-7: 各传统详细理论
 * - Fehr & Russell (1984): 情绪原型理论
 * - Scarantino (2016): 情绪理论整合框架
 * 
 * @version 5.0.12
 * @author HeartFlow Team
 */

class EmotionTraditionsIntegration {
  constructor() {
    this.version = '5.0.12';
    this.name = 'Emotion Traditions Integration';
    
    // 情绪三成分特征数据库
    this.emotionProfiles = {
      // 基础情绪
      fear: {
        feeling: {
          quality: '紧张、不安、恐惧感',
          intensity: '高',
          bodilySignature: '心跳加速、肌肉紧张、呼吸急促',
          phenomenology: '威胁迫近的主观体验'
        },
        evaluative: {
          appraisal: '情境被评价为危险的、有害的',
          formalObject: '危险性 (dangerousness)',
          appropriateness: '当真实威胁存在时适当'
        },
        motivational: {
          actionTendency: '逃跑、回避、冻结',
          goal: '安全、避免伤害',
          urgency: '高'
        }
      },
      
      anger: {
        feeling: {
          quality: '愤怒、烦躁、怒火',
          intensity: '中 - 高',
          bodilySignature: '体温升高、肌肉紧绷、面部发热',
          phenomenology: '被冒犯的主观体验'
        },
        evaluative: {
          appraisal: '情境被评价为不公正的、冒犯性的',
          formalObject: '冒犯性 (offensiveness)',
          appropriateness: '当真实不公正存在时适当'
        },
        motivational: {
          actionTendency: '攻击、对抗、纠正',
          goal: '恢复公正、消除冒犯',
          urgency: '高'
        }
      },
      
      sadness: {
        feeling: {
          quality: '悲伤、忧郁、沉重',
          intensity: '中',
          bodilySignature: '能量降低、身体沉重、可能哭泣',
          phenomenology: '丧失的主观体验'
        },
        evaluative: {
          appraisal: '情境被评价为丧失的、不可逆转的',
          formalObject: '丧失性 (loss)',
          appropriateness: '当真实丧失发生时适当'
        },
        motivational: {
          actionTendency: '退缩、寻求安慰、反思',
          goal: '处理丧失、寻求支持',
          urgency: '低'
        }
      },
      
      joy: {
        feeling: {
          quality: '快乐、愉悦、轻松',
          intensity: '中 - 高',
          bodilySignature: '能量提升、面部放松、可能微笑',
          phenomenology: '获得/成就的主观体验'
        },
        evaluative: {
          appraisal: '情境被评价为有益的、有价值的',
          formalObject: '有益性 (beneficiality)',
          appropriateness: '当真实好事发生时适当'
        },
        motivational: {
          actionTendency: '接近、分享、庆祝',
          goal: '维持积极状态、强化连接',
          urgency: '中'
        }
      },
      
      disgust: {
        feeling: {
          quality: '厌恶、恶心、排斥',
          intensity: '中 - 高',
          bodilySignature: '胃部不适、可能呕吐、面部皱起',
          phenomenology: '污染/污染威胁的主观体验'
        },
        evaluative: {
          appraisal: '对象被评价为污染的、有害的',
          formalObject: '污染性 (contamination)',
          appropriateness: '当真实污染物存在时适当'
        },
        motivational: {
          actionTendency: '排斥、远离、清除',
          goal: '避免污染、保持纯净',
          urgency: '高'
        }
      },
      
      surprise: {
        feeling: {
          quality: '惊讶、意外、震惊',
          intensity: '短暂但高',
          bodilySignature: '眉毛上扬、眼睛睁大、短暂停顿',
          phenomenology: '预期违背的主观体验'
        },
        evaluative: {
          appraisal: '事件被评价为意外的、未预期的',
          formalObject: '意外性 (unexpectedness)',
          appropriateness: '当事件确实意外时适当'
        },
        motivational: {
          actionTendency: '注意定向、重新评估',
          goal: '理解意外事件、更新模型',
          urgency: '高 (但短暂)'
        }
      },
      
      // 复杂情绪
      guilt: {
        feeling: {
          quality: '内疚、自责、不安',
          intensity: '中 - 高',
          bodilySignature: '胸口紧缩、回避眼神、身体收缩',
          phenomenology: '道德违规的主观体验'
        },
        evaluative: {
          appraisal: '自己的行为被评价为错误的、伤害性的',
          formalObject: '道德错误性 (moral wrongness)',
          appropriateness: '当自己确实造成伤害时适当'
        },
        motivational: {
          actionTendency: '道歉、弥补、自我惩罚',
          goal: '修复关系、恢复道德完整性',
          urgency: '高'
        }
      },
      
      shame: {
        feeling: {
          quality: '羞耻、屈辱、想隐藏',
          intensity: '高',
          bodilySignature: '脸红、低头、身体最小化',
          phenomenology: '自我缺陷暴露的主观体验'
        },
        evaluative: {
          appraisal: '自我被评价为有缺陷的、不足的',
          formalObject: '自我缺陷性 (self-defectiveness)',
          appropriateness: '当自我确实有严重缺陷时可能适当'
        },
        motivational: {
          actionTendency: '隐藏、逃避、退缩',
          goal: '避免暴露、保护自我形象',
          urgency: '高'
        }
      },
      
      pride: {
        feeling: {
          quality: '自豪、满足、昂扬',
          intensity: '中 - 高',
          bodilySignature: '挺胸抬头、面部放松、能量提升',
          phenomenology: '成就/价值确认的主观体验'
        },
        evaluative: {
          appraisal: '自己的成就/特质被评价为有价值的',
          formalObject: '价值性 (worthiness)',
          appropriateness: '当成就/特质确实有价值时适当'
        },
        motivational: {
          actionTendency: '展示、分享、追求更多',
          goal: '维持/增强自我价值、获得认可',
          urgency: '中'
        }
      },
      
      envy: {
        feeling: {
          quality: '嫉妒、苦涩、不满',
          intensity: '中',
          bodilySignature: '胸口紧缩、紧张、可能面部僵硬',
          phenomenology: '相对剥夺的主观体验'
        },
        evaluative: {
          appraisal: '他人的优势被评价为自己应得但缺乏的',
          formalObject: '相对剥夺性 (relative deprivation)',
          appropriateness: '当优势确实不公平分配时可能适当'
        },
        motivational: {
          actionTendency: '竞争、贬低他人、自我提升',
          goal: '获得同等优势、恢复公平',
          urgency: '中'
        }
      },
      
      gratitude: {
        feeling: {
          quality: '感激、温暖、连接感',
          intensity: '中',
          bodilySignature: '胸口温暖、面部柔和、放松',
          phenomenology: '被善意对待的主观体验'
        },
        evaluative: {
          appraisal: '他人的行为被评价为善意的、有价值的',
          formalObject: '善意性 (benevolence)',
          appropriateness: '当善意确实存在时适当'
        },
        motivational: {
          actionTendency: '回报、表达感谢、强化关系',
          goal: '维持互惠关系、强化社会连接',
          urgency: '中'
        }
      },
      
      awe: {
        feeling: {
          quality: '敬畏、震撼、渺小感',
          intensity: '高',
          bodilySignature: '可能起鸡皮疙瘩、呼吸暂停、身体静止',
          phenomenology: '超越理解的主观体验'
        },
        evaluative: {
          appraisal: '对象被评价为巨大的、超越常规的',
          formalObject: '宏大性 (vastness) + 顺应需求 (need for accommodation)',
          appropriateness: '当对象确实宏大时适当'
        },
        motivational: {
          actionTendency: '凝视、探索、自我超越',
          goal: '理解宏大对象、调整自我认知',
          urgency: '低 - 中'
        }
      }
    };

    // 传统间冲突类型
    this.conflictTypes = {
      FEELING_EVALUATION_MISMATCH: '感受 - 评价不匹配',
      FEELING_MOTIVATION_MISMATCH: '感受 - 动机不匹配',
      EVALUATION_MOTIVATION_MISMATCH: '评价 - 动机不匹配',
      TRADITION_INCOHERENCE: '三传统不连贯'
    };
  }

  /**
   * 评估情绪的感受传统成分
   */
  assessFeelingTradition(emotionReport) {
    const { emotionLabel, intensity, bodilySensations, subjectiveQuality } = emotionReport;
    
    const profile = this.emotionProfiles[emotionLabel?.toLowerCase()];
    
    const assessment = {
      tradition: 'Feeling',
      components: {
        quality: subjectiveQuality || profile?.feeling.quality || '未指定',
        intensity: intensity || '未指定',
        bodilySignature: bodilySensations || profile?.feeling.bodilySignature || '未检测到',
        phenomenology: profile?.feeling.phenomenology || '未指定'
      },
      clarity: this._calculateClarity(emotionReport, profile?.feeling),
      coherence: this._calculateFeelingCoherence(emotionReport)
    };

    return assessment;
  }

  /**
   * 评估情绪的评价传统成分
   */
  assessEvaluativeTradition(emotionReport) {
    const { emotionLabel, elicitingSituation, appraisalThemes } = emotionReport;
    
    const profile = this.emotionProfiles[emotionLabel?.toLowerCase()];
    
    const assessment = {
      tradition: 'Evaluative',
      components: {
        appraisal: appraisalThemes?.primary || profile?.evaluative.appraisal || '未指定',
        formalObject: profile?.evaluative.formalObject || '未指定',
        appropriateness: this._assessAppropriateness(emotionReport, profile?.evaluative),
        situationalFit: this._assessSituationalFit(elicitingSituation, profile?.evaluative)
      },
      rationality: this._assessRationality(emotionReport),
      coherence: this._calculateEvaluationCoherence(emotionReport)
    };

    return assessment;
  }

  /**
   * 评估情绪的动机传统成分
   */
  assessMotivationalTradition(emotionReport) {
    const { emotionLabel, actionUrges, behavioralTendencies, goals } = emotionReport;
    
    const profile = this.emotionProfiles[emotionLabel?.toLowerCase()];
    
    const assessment = {
      tradition: 'Motivational',
      components: {
        actionTendency: actionUrges || profile?.motivational.actionTendency || '未指定',
        goal: goals || profile?.motivational.goal || '未指定',
        urgency: profile?.motivational.urgency || '未指定',
        motivationalClarity: this._assessMotivationalClarity(actionUrges)
      },
      functionality: this._assessFunctionality(emotionReport),
      coherence: this._calculateMotivationCoherence(emotionReport)
    };

    return assessment;
  }

  /**
   * 整合三传统评估
   */
  integrateTraditions(feelingAssess, evaluativeAssess, motivationalAssess) {
    const integration = {
      version: this.version,
      timestamp: new Date().toISOString(),
      
      traditions: {
        feeling: feelingAssess,
        evaluative: evaluativeAssess,
        motivational: motivationalAssess
      },
      
      // 传统间一致性检查
      crossTraditionCoherence: this._assessCrossTraditionCoherence(
        feelingAssess, 
        evaluativeAssess, 
        motivationalAssess
      ),
      
      // 冲突检测
      conflicts: this._detectConflicts(
        feelingAssess, 
        evaluativeAssess, 
        motivationalAssess
      ),
      
      // 整合评分
      integrationScore: this._calculateIntegrationScore(
        feelingAssess, 
        evaluativeAssess, 
        motivationalAssess
      ),
      
      // 干预建议
      interventions: this._generateInterventions(
        feelingAssess, 
        evaluativeAssess, 
        motivationalAssess
      )
    };

    return integration;
  }

  /**
   * 检测传统间冲突
   */
  _detectConflicts(feeling, evaluative, motivational) {
    const conflicts = [];

    // 感受 - 评价冲突
    if (feeling.clarity < 0.5 && evaluative.rationality > 0.7) {
      conflicts.push({
        type: this.conflictTypes.FEELING_EVALUATION_MISMATCH,
        description: '感受体验模糊但评价清晰，可能存在认知 - 体验分离',
        severity: '中',
        intervention: '身体扫描练习，增强感受觉察'
      });
    }

    // 感受 - 动机冲突
    if (feeling.intensity === '高' && motivational.motivationalClarity < 0.5) {
      conflicts.push({
        type: this.conflictTypes.FEELING_MOTIVATION_MISMATCH,
        description: '高强度感受但缺乏明确行动倾向，可能存在行动抑制',
        severity: '中',
        intervention: '探索行动障碍，小步骤实验'
      });
    }

    // 评价 - 动机冲突
    if (evaluative.appropriateness === '不适当' && motivational.functionality > 0.7) {
      conflicts.push({
        type: this.conflictTypes.EVALUATION_MOTIVATION_MISMATCH,
        description: '评价为不适当但动机功能性强，可能存在价值冲突',
        severity: '高',
        intervention: '价值观澄清练习'
      });
    }

    return conflicts;
  }

  /**
   * 评估跨传统一致性
   */
  _assessCrossTraditionCoherence(feeling, evaluative, motivational) {
    const scores = [
      feeling.clarity,
      feeling.coherence,
      evaluative.rationality,
      evaluative.coherence,
      motivational.functionality,
      motivational.coherence
    ];

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = this._calculateVariance(scores);

    return {
      overallScore: avgScore,
      consistency: variance < 0.1 ? '高' : variance < 0.2 ? '中' : '低',
      strongestTradition: this._findStrongest(feeling, evaluative, motivational),
      weakestTradition: this._findWeakest(feeling, evaluative, motivational)
    };
  }

  /**
   * 生成整合干预方案
   */
  _generateInterventions(feeling, evaluative, motivational) {
    const interventions = [];

    // 基于最弱传统推荐干预
    const weakest = this._findWeakest(feeling, evaluative, motivational);
    
    if (weakest === 'feeling') {
      interventions.push({
        type: '感受增强',
        name: '身体扫描冥想',
        duration: '10-15 分钟',
        description: '系统性地关注身体各部位的感受，增强感受觉察能力',
        steps: [
          '找安静地方坐下或躺下',
          '从脚部开始，依次关注每个身体部位',
          '注意任何感受（温暖、紧张、刺痛等）',
          '不加评判地观察',
          '完成全身扫描后，静坐 2 分钟整合体验'
        ]
      });
    }

    if (weakest === 'evaluative') {
      interventions.push({
        type: '评价澄清',
        name: '认知重构练习',
        duration: '15-20 分钟',
        description: '识别并检验自动评价，发展更平衡的视角',
        steps: [
          '识别触发情境',
          '记录自动评价（"这意味着..."）',
          '寻找支持/反对证据',
          '生成替代性评价',
          '评估新评价的合理性'
        ]
      });
    }

    if (weakest === 'motivational') {
      interventions.push({
        type: '动机澄清',
        name: '价值导向行动实验',
        duration: '1 周',
        description: '基于核心价值观设计小步骤行动实验',
        steps: [
          '识别当前情绪相关的行动倾向',
          '连接个人核心价值观',
          '设计与价值一致的小步骤行动',
          '实施并记录体验',
          '反思行动与价值的对齐度'
        ]
      });
    }

    // 如果有冲突，添加整合练习
    const conflicts = this._detectConflicts(feeling, evaluative, motivational);
    if (conflicts.length > 0) {
      interventions.push({
        type: '整合练习',
        name: '三传统整合冥想',
        duration: '20 分钟',
        description: '整合感受、评价、动机的正念练习',
        steps: [
          '静坐，关注呼吸 3 分钟',
          '识别当前情绪的感受成分（5 分钟）',
          '识别评价成分（5 分钟）',
          '识别动机成分（5 分钟）',
          '整合三成分，观察其相互关系（2 分钟）'
        ]
      });
    }

    return interventions;
  }

  /**
   * 计算整合评分
   */
  _calculateIntegrationScore(feeling, evaluative, motivational) {
    const componentScores = [
      feeling.clarity,
      feeling.coherence,
      evaluative.rationality,
      evaluative.coherence,
      motivational.functionality,
      motivational.coherence
    ];

    const avg = componentScores.reduce((a, b) => a + b, 0) / componentScores.length;
    
    return {
      overall: avg,
      level: avg > 0.8 ? '高整合' : avg > 0.6 ? '中整合' : '低整合',
      breakdown: {
        feeling: (feeling.clarity + feeling.coherence) / 2,
        evaluative: (evaluative.rationality + evaluative.coherence) / 2,
        motivational: (motivational.functionality + motivational.coherence) / 2
      }
    };
  }

  // 辅助方法
  _calculateClarity(report, profile) {
    let score = 0.5;
    if (report.subjectiveQuality) score += 0.2;
    if (report.bodilySensations) score += 0.2;
    if (report.intensity) score += 0.1;
    return Math.min(score, 1.0);
  }

  _calculateFeelingCoherence(report) {
    // 简化实现
    return 0.7;
  }

  _assessAppropriateness(report, profile) {
    // 简化实现
    return '需要更多信息';
  }

  _assessSituationalFit(situation, profile) {
    return '未评估';
  }

  _assessRationality(report) {
    return 0.6;
  }

  _calculateEvaluationCoherence(report) {
    return 0.7;
  }

  _assessMotivationalClarity(urges) {
    return urges ? 0.8 : 0.5;
  }

  _assessFunctionality(report) {
    return 0.6;
  }

  _calculateMotivationCoherence(report) {
    return 0.7;
  }

  _calculateVariance(scores) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s - avg, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  }

  _findStrongest(feeling, evaluative, motivational) {
    const scores = {
      feeling: (feeling.clarity + feeling.coherence) / 2,
      evaluative: (evaluative.rationality + evaluative.coherence) / 2,
      motivational: (motivational.functionality + motivational.coherence) / 2
    };
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }

  _findWeakest(feeling, evaluative, motivational) {
    const scores = {
      feeling: (feeling.clarity + feeling.coherence) / 2,
      evaluative: (evaluative.rationality + evaluative.coherence) / 2,
      motivational: (motivational.functionality + motivational.coherence) / 2
    };
    return Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  }

  /**
   * 创建 15 分钟整合练习
   */
  generateIntegrationPractice(emotionReport, duration = 15) {
    const practice = {
      name: '情绪三传统整合练习',
      version: this.version,
      duration: `${duration} 分钟`,
      phases: [
        {
          phase: 1,
          name: '感受觉察',
          duration: '5 分钟',
          instructions: [
            '静坐，关注呼吸 1 分钟',
            '识别当前情绪的身体感受（2 分钟）',
            '注意感受的质量、强度、位置（2 分钟）'
          ],
          focus: 'Feeling Tradition'
        },
        {
          phase: 2,
          name: '评价探索',
          duration: '5 分钟',
          instructions: [
            '问自己："这个情绪在评价什么？"（1 分钟）',
            '识别自动评价（"这意味着..."）（2 分钟）',
            '检验评价的合理性（2 分钟）'
          ],
          focus: 'Evaluative Tradition'
        },
        {
          phase: 3,
          name: '动机澄清',
          duration: '5 分钟',
          instructions: [
            '注意行动倾向（1 分钟）',
            '问："这个情绪想让我做什么？"（2 分钟）',
            '评估行动倾向的功能性（2 分钟）'
          ],
          focus: 'Motivational Tradition'
        }
      ],
      integration: {
        duration: '可选额外 5 分钟',
        instructions: [
          '整合三传统的洞察',
          '注意它们如何相互影响',
          '生成整合性的回应方式'
        ]
      }
    };

    return practice;
  }
}

module.exports = EmotionTraditionsIntegration;
