/**
 * HeartFlow v5.0.12 - 情绪原型结构深度增强
 * 
 * 基于 SEP 情绪原型理论 + Fehr & Russell (1984) 原型模型
 * 实现情绪原型网络结构、典型性评分、置信度评估和情绪粒度增强
 * 
 * 理论来源:
 * - SEP Emotion Theory §1: Emotion Concepts and Prototypes
 * - Fehr & Russell (1984): Prototype Approach to Emotion Concepts
 * - 原型效应：情绪类别具有家族相似性而非充分必要条件
 * - 典型性梯度：某些情绪是"更好"的例子 (fear > awe)
 * - 模糊边界：某些案例处于边界地带 (boredom, curiosity)
 */

const EventEmitter = require('events')

class EmotionPrototypeStructure extends EventEmitter {
  constructor () {
    super()
    this.version = '5.0.12'
    this.name = '情绪原型结构深度增强'
    
    // 情绪原型网络 - 基于 SEP 和 Fehr & Russell (1984)
    this.prototypeNetwork = this.buildPrototypeNetwork()
    
    // 情绪粒度映射 - 强度连续谱
    this.granularityMap = this.buildGranularityMap()
    
    // 成分权重配置
    this.componentWeights = {
      feeling: 0.25,        // 感受成分
      evaluative: 0.25,     // 评价成分
      motivational: 0.20,   // 动机成分
      expressive: 0.15,     // 表达成分
      physiological: 0.15   // 生理成分
    }
  }

  /**
   * 构建情绪原型网络
   * 基于 SEP 情绪原型理论和 Fehr & Russell (1984) 研究
   */
  buildPrototypeNetwork () {
    return {
      // ===== 高典型性情绪 (原型情绪) =====
      fear: {
        name: '恐惧',
        prototype: true,
        typicality: 0.95,  // 典型性评分 (0-1)
        category: '基本情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['害怕', '恐惧', '惊慌', '紧张', '不安'],
            bodilyProfile: ['心跳加速', '呼吸急促', '肌肉紧张', '手心出汗']
          },
          evaluative: {
            weight: 0.9,
            formalObject: 'danger',  // 形式对象
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'high',
              control: 'low',
              certainty: 'variable',
              responsibility: 'situational'
            },
            coreTheme: 'threat to well-being'
          },
          motivational: {
            weight: 0.9,
            actionTendency: 'escape/avoid',
            attentionalFocus: 'threat detection',
            urgency: 'high'
          },
          expressive: {
            weight: 0.7,
            facial: ['eyes widened', 'eyebrows raised', 'mouth stretched'],
            vocal: ['high pitch', 'fast speech', 'trembling voice']
          },
          physiological: {
            weight: 0.8,
            autonomic: ['increased heart rate', 'increased blood pressure', 'pupil dilation'],
            hormonal: ['adrenaline release', 'cortisol increase']
          }
        },
        boundaries: {
          clear: ['panic', 'terror', 'anxiety', 'dread', 'horror'],
          fuzzy: ['worry', 'apprehension', 'nervousness', 'unease']
        },
        intensitySpectrum: ['apprehension', 'worry', 'fear', 'terror', 'panic']
      },

      anger: {
        name: '愤怒',
        prototype: true,
        typicality: 0.93,
        category: '基本情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['生气', '愤怒', '恼火', '愤慨', '暴怒'],
            bodilyProfile: ['身体发热', '肌肉紧绷', '心跳加快', '呼吸变重']
          },
          evaluative: {
            weight: 0.9,
            formalObject: 'offense',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'high',
              control: 'moderate',
              certainty: 'high',
              responsibility: 'other-blame'
            },
            coreTheme: 'wrongdoing against me or mine'
          },
          motivational: {
            weight: 0.9,
            actionTendency: 'attack/remove obstacle',
            attentionalFocus: 'source of offense',
            urgency: 'high'
          },
          expressive: {
            weight: 0.8,
            facial: ['eyebrows lowered', 'eyes narrowed', 'lips pressed'],
            vocal: ['loud', 'harsh', 'fast']
          },
          physiological: {
            weight: 0.7,
            autonomic: ['increased heart rate', 'increased blood pressure', 'face flushing'],
            hormonal: ['adrenaline release', 'testosterone increase']
          }
        },
        boundaries: {
          clear: ['rage', 'fury', 'wrath', 'indignation', 'annoyance'],
          fuzzy: ['frustration', 'irritation', 'displeasure', 'discontent']
        },
        intensitySpectrum: ['annoyance', 'irritation', 'anger', 'rage', 'fury']
      },

      sadness: {
        name: '悲伤',
        prototype: true,
        typicality: 0.92,
        category: '基本情绪',
        features: {
          feeling: {
            weight: 0.9,
            markers: ['悲伤', '难过', '伤心', '悲痛', '哀伤'],
            bodilyProfile: ['身体沉重', '无力感', '胸口闷', '眼泪']
          },
          evaluative: {
            weight: 0.9,
            formalObject: 'loss',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'low',
              control: 'low',
              certainty: 'high',
              responsibility: 'situational'
            },
            coreTheme: 'irrevocable loss'
          },
          motivational: {
            weight: 0.7,
            actionTendency: 'withdraw/seek support',
            attentionalFocus: 'loss object',
            urgency: 'low'
          },
          expressive: {
            weight: 0.8,
            facial: ['inner eyebrows raised', 'corners of lips down', 'drooping eyelids'],
            vocal: ['soft', 'slow', 'monotone']
          },
          physiological: {
            weight: 0.6,
            autonomic: ['decreased energy', 'reduced activity'],
            hormonal: ['cortisol increase', 'serotonin decrease']
          }
        },
        boundaries: {
          clear: ['grief', 'sorrow', 'mourning', 'despair', 'melancholy'],
          fuzzy: ['disappointment', 'regret', 'loneliness', 'emptiness']
        },
        intensitySpectrum: ['disappointment', 'sadness', 'grief', 'despair', 'devastation']
      },

      joy: {
        name: '喜悦',
        prototype: true,
        typicality: 0.94,
        category: '基本情绪',
        features: {
          feeling: {
            weight: 0.9,
            markers: ['快乐', '喜悦', '开心', '高兴', '愉快'],
            bodilyProfile: ['身体轻盈', '能量充沛', '微笑冲动', '心跳轻快']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'goal attainment / positive outcome',
            appraisalDimensions: {
              valence: 'positive',
              arousal: 'high',
              control: 'moderate',
              certainty: 'high',
              responsibility: 'self or situational'
            },
            coreTheme: 'desired outcome achieved'
          },
          motivational: {
            weight: 0.8,
            actionTendency: 'approach/maintain/share',
            attentionalFocus: 'positive stimulus',
            urgency: 'moderate'
          },
          expressive: {
            weight: 0.9,
            facial: ['Duchenne smile', 'eyes crinkled', 'cheeks raised'],
            vocal: ['bright', 'animated', 'varied pitch']
          },
          physiological: {
            weight: 0.7,
            autonomic: ['relaxed state', 'balanced arousal'],
            hormonal: ['dopamine release', 'endorphin release', 'oxytocin increase']
          }
        },
        boundaries: {
          clear: ['happiness', 'delight', 'elation', 'ecstasy', 'jubilation'],
          fuzzy: ['contentment', 'satisfaction', 'pleasure', 'amusement']
        },
        intensitySpectrum: ['contentment', 'pleasure', 'joy', 'elation', 'ecstasy']
      },

      disgust: {
        name: '厌恶',
        prototype: true,
        typicality: 0.88,
        category: '基本情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['厌恶', '恶心', '反感', '嫌弃', '憎恶'],
            bodilyProfile: ['胃部不适', '恶心感', '想要呕吐', '身体后退']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'contamination',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'moderate',
              control: 'high',
              certainty: 'high',
              responsibility: 'object-focused'
            },
            coreTheme: 'ingestion of harmful substance / moral violation'
          },
          motivational: {
            weight: 0.9,
            actionTendency: 'expel/avoid',
            attentionalFocus: 'contaminant',
            urgency: 'high'
          },
          expressive: {
            weight: 0.9,
            facial: ['nose wrinkled', 'upper lip raised', 'tongue protrusion'],
            vocal: ['gagging sounds', 'rejection sounds']
          },
          physiological: {
            weight: 0.8,
            autonomic: ['nausea', 'decreased appetite', 'gastrointestinal distress'],
            hormonal: ['stress response']
          }
        },
        boundaries: {
          clear: ['revulsion', 'repulsion', 'loathing', 'abhorrence'],
          fuzzy: ['distaste', 'dislike', 'aversion', 'disapproval']
        },
        intensitySpectrum: ['dislike', 'distaste', 'disgust', 'revulsion', 'loathing']
      },

      surprise: {
        name: '惊讶',
        prototype: false,
        typicality: 0.65,  // 边界案例 - 是否是情绪有争议
        category: '争议情绪',
        contested: true,
        features: {
          feeling: {
            weight: 0.6,
            markers: ['惊讶', '吃惊', '意外', '震惊'],
            bodilyProfile: ['瞬间停顿', '心跳漏拍', '屏息']
          },
          evaluative: {
            weight: 0.5,
            formalObject: 'unexpected event',
            appraisalDimensions: {
              valence: 'neutral (can become positive/negative)',
              arousal: 'high',
              control: 'low',
              certainty: 'low',
              responsibility: 'situational'
            },
            coreTheme: 'violation of expectation'
          },
          motivational: {
            weight: 0.7,
            actionTendency: 'orient/attend/explore',
            attentionalFocus: 'surprising stimulus',
            urgency: 'high'
          },
          expressive: {
            weight: 0.9,
            facial: ['eyebrows raised', 'eyes widened', 'jaw dropped'],
            vocal: ['gasp', 'exclamation']
          },
          physiological: {
            weight: 0.6,
            autonomic: ['orienting response', 'brief arousal spike'],
            hormonal: ['adrenaline spike']
          }
        },
        boundaries: {
          clear: ['shock', 'astonishment', 'amazement'],
          fuzzy: ['startle', 'wonder', 'curiosity']
        },
        intensitySpectrum: ['mild surprise', 'surprise', 'shock', 'astonishment', 'amazement']
      },

      // ===== 中等典型性情绪 =====
      anxiety: {
        name: '焦虑',
        prototype: false,
        typicality: 0.75,
        category: '复合情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['焦虑', '不安', '忧虑', '紧张'],
            bodilyProfile: ['坐立不安', '肌肉紧张', '胃部不适', '心跳加快']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'uncertain threat',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'high',
              control: 'low',
              certainty: 'low',
              responsibility: 'uncertain'
            },
            coreTheme: 'uncertain future threat'
          },
          motivational: {
            weight: 0.7,
            actionTendency: 'prepare/avoid/worry',
            attentionalFocus: 'potential threats',
            urgency: 'moderate'
          },
          expressive: {
            weight: 0.5,
            facial: ['tense', 'fidgeting'],
            vocal: ['hesitant', 'uncertain']
          },
          physiological: {
            weight: 0.7,
            autonomic: ['sustained arousal', 'muscle tension'],
            hormonal: ['cortisol elevation', 'adrenaline']
          }
        },
        boundaries: {
          clear: ['worry', 'nervousness', 'apprehension', 'unease'],
          fuzzy: ['stress', 'tension', 'restlessness']
        },
        intensitySpectrum: ['unease', 'nervousness', 'anxiety', 'panic']
      },

      guilt: {
        name: '内疚',
        prototype: false,
        typicality: 0.72,
        category: '道德情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['内疚', '愧疚', '自责', '懊悔'],
            bodilyProfile: ['胸口沉重', '胃部不适', '想要隐藏']
          },
          evaluative: {
            weight: 0.9,
            formalObject: 'own wrongdoing',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'moderate',
              control: 'high (self-responsibility)',
              certainty: 'high',
              responsibility: 'self-blame'
            },
            coreTheme: 'I did something wrong'
          },
          motivational: {
            weight: 0.8,
            actionTendency: 'repair/confess/atone',
            attentionalFocus: 'own action',
            urgency: 'moderate'
          },
          expressive: {
            weight: 0.6,
            facial: ['gaze avoidance', 'slumped posture'],
            vocal: ['apologetic', 'soft']
          },
          physiological: {
            weight: 0.5,
            autonomic: ['mild arousal'],
            hormonal: ['cortisol increase']
          }
        },
        boundaries: {
          clear: ['remorse', 'compunction', 'contrition'],
          fuzzy: ['regret', 'shame', 'embarrassment']
        },
        intensitySpectrum: ['regret', 'guilt', 'remorse', 'contrition']
      },

      shame: {
        name: '羞愧',
        prototype: false,
        typicality: 0.70,
        category: '道德情绪',
        features: {
          feeling: {
            weight: 0.9,
            markers: ['羞愧', '羞耻', '丢脸', '无地自容'],
            bodilyProfile: ['脸红', '想要消失', '身体蜷缩', '低头']
          },
          evaluative: {
            weight: 0.9,
            formalObject: 'self-defect exposed',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'high',
              control: 'low',
              certainty: 'high',
              responsibility: 'self-blame (global)'
            },
            coreTheme: 'I am flawed/defective'
          },
          motivational: {
            weight: 0.8,
            actionTendency: 'hide/withdraw/disappear',
            attentionalFocus: 'self as seen by others',
            urgency: 'high'
          },
          expressive: {
            weight: 0.8,
            facial: ['gaze down', 'head down', 'blushing'],
            vocal: ['quiet', 'hesitant']
          },
          physiological: {
            weight: 0.7,
            autonomic: ['blushing', 'increased heart rate'],
            hormonal: ['cortisol spike']
          }
        },
        boundaries: {
          clear: ['humiliation', 'mortification', 'dishonor'],
          fuzzy: ['embarrassment', 'guilt', 'shyness']
        },
        intensitySpectrum: ['embarrassment', 'shame', 'humiliation', 'mortification']
      },

      pride: {
        name: '自豪',
        prototype: false,
        typicality: 0.68,
        category: '道德情绪',
        features: {
          feeling: {
            weight: 0.7,
            markers: ['自豪', '骄傲', '得意', '光荣'],
            bodilyProfile: ['挺胸抬头', '身体舒展', '微笑', '能量充沛']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'own achievement',
            appraisalDimensions: {
              valence: 'positive',
              arousal: 'moderate',
              control: 'high',
              certainty: 'high',
              responsibility: 'self-credit'
            },
            coreTheme: 'I achieved something valuable'
          },
          motivational: {
            weight: 0.7,
            actionTendency: 'display/share/maintain',
            attentionalFocus: 'achievement',
            urgency: 'low'
          },
          expressive: {
            weight: 0.7,
            facial: ['small smile', 'head tilted back', 'expanded posture'],
            vocal: ['confident', 'animated']
          },
          physiological: {
            weight: 0.5,
            autonomic: ['balanced arousal'],
            hormonal: ['testosterone increase', 'dopamine release']
          }
        },
        boundaries: {
          clear: ['triumph', 'glory', 'satisfaction'],
          fuzzy: ['confidence', 'contentment', 'smugness']
        },
        intensitySpectrum: ['satisfaction', 'pride', 'triumph', 'glory']
      },

      // ===== 低典型性情绪 (边界案例) =====
      boredom: {
        name: '无聊',
        prototype: false,
        typicality: 0.45,  // 边界案例 - 普通语言使用者对是否是情绪有分歧
        category: '争议情绪',
        contested: true,
        features: {
          feeling: {
            weight: 0.6,
            markers: ['无聊', '厌烦', '乏味', '没意思'],
            bodilyProfile: ['倦怠感', '想要离开', '坐立不安']
          },
          evaluative: {
            weight: 0.6,
            formalObject: 'lack of engagement',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'low',
              control: 'moderate',
              certainty: 'high',
              responsibility: 'situational'
            },
            coreTheme: 'current activity is meaningless/unengaging'
          },
          motivational: {
            weight: 0.7,
            actionTendency: 'seek stimulation/escape',
            attentionalFocus: 'time passing slowly',
            urgency: 'low'
          },
          expressive: {
            weight: 0.5,
            facial: ['blank stare', 'yawning', 'slumped posture'],
            vocal: ['monotone', 'sighing']
          },
          physiological: {
            weight: 0.4,
            autonomic: ['low arousal', 'reduced engagement'],
            hormonal: ['low dopamine']
          }
        },
        boundaries: {
          clear: ['tedium', 'ennui', 'weariness'],
          fuzzy: ['restlessness', 'dissatisfaction', 'apathy']
        },
        intensitySpectrum: ['mild boredom', 'boredom', 'tedium', 'ennui']
      },

      curiosity: {
        name: '好奇',
        prototype: false,
        typicality: 0.50,  // 边界案例
        category: '认知情绪',
        contested: true,
        features: {
          feeling: {
            weight: 0.6,
            markers: ['好奇', '感兴趣', '想知道', '探究'],
            bodilyProfile: ['身体前倾', '注意力集中', '警觉']
          },
          evaluative: {
            weight: 0.7,
            formalObject: 'knowledge gap',
            appraisalDimensions: {
              valence: 'positive',
              arousal: 'moderate',
              control: 'moderate',
              certainty: 'low',
              responsibility: 'situational'
            },
            coreTheme: 'I want to know/understand'
          },
          motivational: {
            weight: 0.9,
            actionTendency: 'explore/investigate/learn',
            attentionalFocus: 'information source',
            urgency: 'moderate'
          },
          expressive: {
            weight: 0.5,
            facial: ['attentive gaze', 'slight head tilt'],
            vocal: ['questioning', 'engaged']
          },
          physiological: {
            weight: 0.5,
            autonomic: ['orienting response', 'moderate arousal'],
            hormonal: ['dopamine release']
          }
        },
        boundaries: {
          clear: ['interest', 'inquisitiveness', 'wonder'],
          fuzzy: ['surprise', 'fascination', 'intrigue']
        },
        intensitySpectrum: ['interest', 'curiosity', 'fascination', 'obsession']
      },

      // ===== 审美情绪 =====
      awe: {
        name: '敬畏',
        prototype: false,
        typicality: 0.55,
        category: '审美情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['敬畏', '惊叹', '震撼', '肃然起敬'],
            bodilyProfile: ['起鸡皮疙瘩', '屏息', '身体静止', '渺小感']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'vastness + need for accommodation',
            appraisalDimensions: {
              valence: 'positive (can be mixed)',
              arousal: 'moderate',
              control: 'low',
              certainty: 'low',
              responsibility: 'situational'
            },
            coreTheme: 'encounter with something vast that transcends current understanding'
          },
          motivational: {
            weight: 0.7,
            actionTendency: 'approach/contemplate/submit',
            attentionalFocus: 'vast stimulus',
            urgency: 'low'
          },
          expressive: {
            weight: 0.7,
            facial: ['eyes widened', 'mouth slightly open', 'stillness'],
            vocal: ['whisper', 'silence', 'hushed tone']
          },
          physiological: {
            weight: 0.7,
            autonomic: ['goosebumps', 'chills', 'breath holding'],
            hormonal: ['oxytocin', 'dopamine']
          }
        },
        boundaries: {
          clear: ['wonder', 'amazement', 'reverence'],
          fuzzy: ['surprise', 'admiration', 'respect']
        },
        intensitySpectrum: ['interest', 'wonder', 'awe', 'reverence', 'transcendence']
      },

      // ===== 社会情绪 =====
      gratitude: {
        name: '感激',
        prototype: false,
        typicality: 0.65,
        category: '社会情绪',
        features: {
          feeling: {
            weight: 0.7,
            markers: ['感激', '感谢', '感恩', '感动'],
            bodilyProfile: ['温暖感', '胸口舒展', '想要回报']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'received benefit',
            appraisalDimensions: {
              valence: 'positive',
              arousal: 'moderate',
              control: 'low (received)',
              certainty: 'high',
              responsibility: 'other-credit'
            },
            coreTheme: 'someone did something valuable for me'
          },
          motivational: {
            weight: 0.8,
            actionTendency: 'reciprocate/connect/express',
            attentionalFocus: 'benefactor',
            urgency: 'moderate'
          },
          expressive: {
            weight: 0.7,
            facial: ['warm smile', 'soft eyes'],
            vocal: ['warm', 'sincere', 'appreciative']
          },
          physiological: {
            weight: 0.6,
            autonomic: ['calm state', 'warmth sensation'],
            hormonal: ['oxytocin increase']
          }
        },
        boundaries: {
          clear: ['thankfulness', 'appreciation', 'indebtedness'],
          fuzzy: ['relief', 'happiness', 'contentment']
        },
        intensitySpectrum: ['appreciation', 'gratitude', 'thankfulness', 'indebtedness']
      },

      jealousy: {
        name: '嫉妒',
        prototype: false,
        typicality: 0.62,
        category: '社会情绪',
        features: {
          feeling: {
            weight: 0.8,
            markers: ['嫉妒', '吃醋', '眼红', '不平衡'],
            bodilyProfile: ['胃部紧缩', '胸口不适', '紧张感']
          },
          evaluative: {
            weight: 0.8,
            formalObject: 'threat to valued relationship',
            appraisalDimensions: {
              valence: 'negative',
              arousal: 'high',
              control: 'low',
              certainty: 'variable',
              responsibility: 'other-blame'
            },
            coreTheme: 'rival threatens my relationship'
          },
          motivational: {
            weight: 0.8,
            actionTendency: 'protect/compete/monitor',
            attentionalFocus: 'rival and partner',
            urgency: 'high'
          },
          expressive: {
            weight: 0.6,
            facial: ['tense', 'watchful'],
            vocal: ['tense', 'questioning']
          },
          physiological: {
            weight: 0.6,
            autonomic: ['increased arousal', 'muscle tension'],
            hormonal: ['cortisol', 'testosterone']
          }
        },
        boundaries: {
          clear: ['envy', 'resentment', 'covetousness'],
          fuzzy: ['insecurity', 'possessiveness', 'competitiveness']
        },
        intensitySpectrum: ['envy', 'jealousy', 'resentment', 'rage']
      }
    }
  }

  /**
   * 构建情绪粒度映射 - 强度连续谱
   */
  buildGranularityMap () {
    return {
      // 恐惧谱系
      fear: {
        base: 'fear',
        spectrum: [
          { level: 0.2, name: 'apprehension', label: '担忧' },
          { level: 0.4, name: 'worry', label: '忧虑' },
          { level: 0.6, name: 'fear', label: '恐惧' },
          { level: 0.8, name: 'terror', label: '恐怖' },
          { level: 1.0, name: 'panic', label: '恐慌' }
        ]
      },
      // 愤怒谱系
      anger: {
        base: 'anger',
        spectrum: [
          { level: 0.2, name: 'annoyance', label: '烦恼' },
          { level: 0.4, name: 'irritation', label: ' irritability' },
          { level: 0.6, name: 'anger', label: '愤怒' },
          { level: 0.8, name: 'rage', label: '暴怒' },
          { level: 1.0, name: 'fury', label: '狂怒' }
        ]
      },
      // 悲伤谱系
      sadness: {
        base: 'sadness',
        spectrum: [
          { level: 0.2, name: 'disappointment', label: '失望' },
          { level: 0.4, name: 'sadness', label: '悲伤' },
          { level: 0.6, name: 'grief', label: '悲痛' },
          { level: 0.8, name: 'despair', label: '绝望' },
          { level: 1.0, name: 'devastation', label: '崩溃' }
        ]
      },
      // 喜悦谱系
      joy: {
        base: 'joy',
        spectrum: [
          { level: 0.2, name: 'contentment', label: '满足' },
          { level: 0.4, name: 'pleasure', label: '愉快' },
          { level: 0.6, name: 'joy', label: '喜悦' },
          { level: 0.8, name: 'elation', label: '兴高采烈' },
          { level: 1.0, name: 'ecstasy', label: '狂喜' }
        ]
      }
    }
  }

  /**
   * 分析情绪的原型匹配度
   * @param {string} emotionName - 情绪名称
   * @param {object} context - 上下文信息 (用户描述)
   * @returns {object} 原型匹配分析结果
   */
  analyzePrototypeMatch (emotionName, context = {}) {
    const emotion = this.prototypeNetwork[emotionName.toLowerCase()]
    
    if (!emotion) {
      return {
        found: false,
        message: `未找到情绪 "${emotionName}" 的原型数据`,
        suggestion: this.findSimilarEmotions(emotionName)
      }
    }

    const { features, typicality, contested } = emotion
    const componentMatches = this.calculateComponentMatches(features, context)
    const overallMatch = this.calculateOverallMatch(componentMatches)

    return {
      found: true,
      emotion: emotionName,
      name: emotion.name,
      prototype: emotion.prototype,
      typicality,
      contested,
      category: emotion.category,
      componentMatches,
      overallMatch,
      confidenceLevel: this.getConfidenceLevel(overallMatch),
      boundaries: emotion.boundaries,
      intensitySpectrum: emotion.intensitySpectrum
    }
  }

  /**
   * 计算各成分匹配度
   */
  calculateComponentMatches (features, context) {
    const matches = {}
    
    // 感受成分匹配
    if (context.feeling || context.description) {
      matches.feeling = this.matchFeeling(features.feeling, context)
    } else {
      matches.feeling = { weight: features.feeling.weight, match: 0.5, note: '无感受描述' }
    }

    // 评价成分匹配
    if (context.evaluation || context.thought || context.appraisal) {
      matches.evaluative = this.matchEvaluative(features.evaluative, context)
    } else {
      matches.evaluative = { weight: features.evaluative.weight, match: 0.5, note: '无评价描述' }
    }

    // 动机成分匹配
    if (context.urge || context.actionTendency || context.want) {
      matches.motivational = this.matchMotivational(features.motivational, context)
    } else {
      matches.motivational = { weight: features.motivational.weight, match: 0.5, note: '无动机描述' }
    }

    // 表达成分匹配
    if (context.expression || context.behavior || context.facial) {
      matches.expressive = this.matchExpressive(features.expressive, context)
    } else {
      matches.expressive = { weight: features.expressive.weight, match: 0.5, note: '无表达描述' }
    }

    // 生理成分匹配
    if (context.bodily || context.physiological || context.sensation) {
      matches.physiological = this.matchPhysiological(features.physiological, context)
    } else {
      matches.physiological = { weight: features.physiological.weight, match: 0.5, note: '无生理描述' }
    }

    return matches
  }

  /**
   * 匹配感受成分
   */
  matchFeeling (feature, context) {
    const text = (context.feeling || context.description || '').toLowerCase()
    const markers = feature.markers || []
    
    let matchCount = 0
    markers.forEach(marker => {
      if (text.includes(marker.toLowerCase())) {
        matchCount++
      }
    })

    const match = matchCount > 0 ? Math.min(1.0, matchCount / markers.length * 2) : 0.3
    return {
      weight: feature.weight,
      match,
      matchedMarkers: matchCount,
      totalMarkers: markers.length
    }
  }

  /**
   * 匹配评价成分
   */
  matchEvaluative (feature, context) {
    const formalObject = feature.formalObject
    const coreTheme = feature.coreTheme
    const text = (context.evaluation || context.thought || context.appraisal || '').toLowerCase()

    // 检查是否包含形式对象或核心主题的关键词
    let match = 0.5
    if (text.includes(formalObject.toLowerCase()) || text.includes(coreTheme.toLowerCase())) {
      match = 0.8
    }

    // 检查评价维度
    if (context.valence && context.valence === feature.appraisalDimensions.valence) {
      match += 0.1
    }
    if (context.arousal && context.arousal === feature.appraisalDimensions.arousal) {
      match += 0.1
    }

    return {
      weight: feature.weight,
      match: Math.min(1.0, match),
      formalObject,
      coreTheme
    }
  }

  /**
   * 匹配动机成分
   */
  matchMotivational (feature, context) {
    const actionTendency = feature.actionTendency
    const text = (context.urge || context.actionTendency || context.want || '').toLowerCase()

    let match = 0.5
    if (text.includes(actionTendency.split('/')[0].toLowerCase())) {
      match = 0.8
    }

    return {
      weight: feature.weight,
      match,
      actionTendency
    }
  }

  /**
   * 匹配表达成分
   */
  matchExpressive (feature, context) {
    const text = (context.expression || context.behavior || context.facial || '').toLowerCase()
    const facial = feature.facial || []
    
    let matchCount = 0
    facial.forEach(marker => {
      if (text.includes(marker.split(' ')[0].toLowerCase())) {
        matchCount++
      }
    })

    const match = matchCount > 0 ? Math.min(1.0, matchCount / facial.length * 2) : 0.5
    return {
      weight: feature.weight,
      match
    }
  }

  /**
   * 匹配生理成分
   */
  matchPhysiological (feature, context) {
    const text = (context.bodily || context.physiological || context.sensation || '').toLowerCase()
    const bodilyProfile = feature.bodilyProfile || []
    
    let matchCount = 0
    bodilyProfile.forEach(marker => {
      if (text.includes(marker.split(' ')[0].toLowerCase())) {
        matchCount++
      }
    })

    const match = matchCount > 0 ? Math.min(1.0, matchCount / bodilyProfile.length * 2) : 0.5
    return {
      weight: feature.weight,
      match
    }
  }

  /**
   * 计算总体匹配度
   */
  calculateOverallMatch (componentMatches) {
    let weightedSum = 0
    let totalWeight = 0

    Object.values(componentMatches).forEach(({ weight, match }) => {
      weightedSum += weight * match
      totalWeight += weight
    })

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5
  }

  /**
   * 获取置信度等级
   */
  getConfidenceLevel (match) {
    if (match >= 0.8) return { level: '高', label: 'high', color: 'green' }
    if (match >= 0.6) return { level: '中', label: 'medium', color: 'yellow' }
    if (match >= 0.4) return { level: '低', label: 'low', color: 'orange' }
    return { level: '模糊', label: 'fuzzy', color: 'red' }
  }

  /**
   * 查找相似情绪
   */
  findSimilarEmotions (emotionName) {
    const name = emotionName.toLowerCase()
    const similar = []

    Object.entries(this.prototypeNetwork).forEach(([key, emotion]) => {
      // 检查边界案例
      if (emotion.boundaries) {
        const allBoundaries = [...emotion.boundaries.clear, ...emotion.boundaries.fuzzy]
        if (allBoundaries.some(b => b.toLowerCase().includes(name) || name.includes(b.toLowerCase()))) {
          similar.push({
            emotion: key,
            name: emotion.name,
            typicality: emotion.typicality,
            relation: 'boundary'
          })
        }
      }

      // 检查强度谱系
      if (emotion.intensitySpectrum) {
        if (emotion.intensitySpectrum.some(s => s.toLowerCase().includes(name))) {
          similar.push({
            emotion: key,
            name: emotion.name,
            typicality: emotion.typicality,
            relation: 'intensity'
          })
        }
      }
    })

    return similar.slice(0, 5)
  }

  /**
   * 获取情绪粒度建议
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 强度 (0-1)
   * @returns {object} 粒度建议
   */
  getGranularitySuggestion (emotionName, intensity = 0.5) {
    const emotion = this.granularityMap[emotionName.toLowerCase()]
    
    if (!emotion) {
      return {
        found: false,
        message: `未找到情绪 "${emotionName}" 的粒度映射`,
        available: Object.keys(this.granularityMap)
      }
    }

    // 找到最接近的强度等级
    const closest = emotion.spectrum.reduce((prev, curr) => {
      return Math.abs(curr.level - intensity) < Math.abs(prev.level - intensity) ? curr : prev
    })

    return {
      found: true,
      baseEmotion: emotion.base,
      currentIntensity: intensity,
      suggested: closest,
      fullSpectrum: emotion.spectrum,
      nextLevel: emotion.spectrum.find(s => s.level > intensity),
      prevLevel: emotion.spectrum.find(s => s.level < intensity)
    }
  }

  /**
   * 生成情绪原型觉察练习
   * @param {string} emotionName - 情绪名称
   * @returns {string} 练习指南
   */
  generatePractice (emotionName) {
    const emotion = this.prototypeNetwork[emotionName.toLowerCase()]
    
    if (!emotion) {
      return `未找到情绪 "${emotionName}" 的数据`
    }

    const practice = `
# 情绪原型觉察练习 - ${emotion.name} (${emotionName})

**典型性**: ${emotion.typicality >= 0.8 ? '高 (原型情绪)' : emotion.typicality >= 0.6 ? '中' : '低 (边界案例)'}
**类别**: ${emotion.category}
${emotion.contested ? '**注意**: 该情绪是否是"真正的情绪"在学术界有争议' : ''}

## 练习目标
通过 5 成分的全面觉察，深化对"${emotion.name}"的理解和体验。

## 练习步骤 (15-20 分钟)

### 第一步：感受觉察 (3-4 分钟)
${emotion.features.feeling.bodilyProfile ? `
关注身体感受：${emotion.features.feeling.bodilyProfile.join('、')}
` : ''}
- 闭上眼睛，回想一次体验"${emotion.name}"的经历
- 注意当时的身体感受
- 不加评判地观察这些感受

### 第二步：评价探索 (3-4 分钟)
形式对象：${emotion.features.evaluative.formalObject}
核心主题：${emotion.features.evaluative.coreTheme}
- 问自己：当时我认为什么受到了威胁/获得/失去？
- 我的评价是什么？
- 这个评价是否准确？

### 第三步：动机觉察 (3-4 分钟)
行动倾向：${emotion.features.motivational.actionTendency}
- 我当时想要做什么？
- 这个冲动是否有帮助？
- 我如何回应这个冲动？

### 第四步：表达观察 (2-3 分钟)
- 我的面部表情是什么样的？
- 我的声音有什么变化？
- 我的行为有什么表现？

### 第五步：整合反思 (3-4 分钟)
- 这 5 个成分如何相互作用？
- 我对"${emotion.name}"有什么新的理解？
- 下次体验这个情绪时，我想如何回应？

## 反思提示
${emotion.prototype ? 
  `"${emotion.name}"是典型的情绪，大多数人都能清晰识别。` :
  `"${emotion.name}"处于情绪类别的边界地带，体验可能因人而异。`
}
${emotion.contested ? 
  `学术界对"${emotion.name}"是否是"真正的情绪"有争议，这正说明了情绪类别的模糊性。` : ''
}

## 延伸练习
- 记录一周内体验"${emotion.name}"的时刻
- 注意每次体验的 5 成分有何不同
- 探索情绪强度的变化 (从轻微到强烈)
`

    return practice
  }

  /**
   * 获取模块信息
   */
  getInfo () {
    return {
      name: this.name,
      version: this.version,
      description: '基于 SEP 情绪原型理论 + Fehr & Russell (1984) 原型模型，实现情绪原型网络结构、典型性评分、置信度评估和情绪粒度增强',
      features: [
        '情绪原型网络 (15+ 种情绪)',
        '典型性评分系统 (0-1)',
        '5 成分匹配分析 (感受/评价/动机/表达/生理)',
        '置信度评估 (高/中/低/模糊)',
        '情绪粒度映射 (强度连续谱)',
        '边界案例处理 (boredom, curiosity, surprise)',
        '可操作练习生成'
      ],
      theorySources: [
        'SEP Emotion Theory §1: Emotion Concepts and Prototypes',
        'Fehr & Russell (1984): Prototype Approach to Emotion Concepts',
        '原型效应：情绪类别具有家族相似性',
        '典型性梯度：fear > awe (作为情绪的例子)'
      ],
      emotionCount: Object.keys(this.prototypeNetwork).length,
      prototypeEmotions: Object.values(this.prototypeNetwork).filter(e => e.prototype).length,
      contestedEmotions: Object.values(this.prototypeNetwork).filter(e => e.contested).length
    }
  }
}

module.exports = EmotionPrototypeStructure
