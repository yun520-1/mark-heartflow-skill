/**
 * 情绪表达模块 (Emotion Expression Module)
 * 
 * 基于 SEP 情绪理论中的表达成分 (Expressive Component)
 * 模拟情绪的面部、声音、姿态表达
 * 
 * 核心理论来源:
 * - Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy
 * - Ekman, P. (1992). An Argument for Basic Emotions
 * - Darwin, C. (1872). The Expression of the Emotions in Man and Animals
 * 
 * 功能目标:
 * - 将内部情绪状态转化为外部表达信号
 * - 支持多模态表达（面部、声音、姿态）
 * - 表达强度与情绪强度动态映射
 * 
 * @version 3.15.0
 * @author HeartFlow Team
 */

const { EmotionTypes, EmotionDefinitions } = require('../emotion/states');

// ============ 表达模态 ============

const ExpressionModalities = {
  FACIAL: 'facial',      // 面部表达
  VOCAL: 'vocal',        // 声音表达
  POSTURAL: 'postural',  // 姿态表达
  GESTURAL: 'gestural'   // 手势表达
};

// ============ 情绪表达模式 ============

/**
 * 基础情绪表达模式
 * 基于 Ekman 的跨文化面部表情研究 + 声音/姿态表达研究
 */
const EmotionExpressionPatterns = {
  [EmotionTypes.CALM]: {
    facial: {
      eyebrows: 'relaxed',           // 眉毛放松
      eyes: 'soft_focus',            // 眼神柔和专注
      mouth: 'neutral_sligh_smile',  // 嘴角微扬
      face_muscles: 'relaxed',       // 面部肌肉放松
      description: '面部放松，眼神专注而温和，嘴角自然微扬'
    },
    vocal: {
      pitch: 'medium',               // 音调中等
      tempo: 'moderate',             // 语速适中
      volume: 'medium',              // 音量中等
      tone: 'warm_steady',           // 语调温暖稳定
      pauses: 'natural',             // 停顿自然
      description: '语调平稳温暖，语速适中，停顿自然'
    },
    postural: {
      body_tension: 'relaxed',       // 身体放松
      orientation: 'open_facing',    // 身体朝向对方
      lean: 'slight_forward',        // 微微前倾（表示关注）
      shoulders: 'relaxed_down',     // 肩膀放松下沉
      description: '身体放松，姿态开放，微微前倾表示关注'
    },
    gestural: {
      hand_movement: 'minimal',      // 手势极少
      palm_orientation: 'open_up',   // 手掌向上开放
      description: '手势极少，偶尔用手掌向上的开放手势'
    }
  },
  
  [EmotionTypes.JOY]: {
    facial: {
      eyebrows: 'slightly_raised',   // 眉毛微扬
      eyes: 'crinkled_corners',      // 眼角皱纹（真笑标志）
      mouth: 'wide_smile',           // 咧嘴笑
      cheeks: 'raised',              // 脸颊上扬
      face_muscles: 'active_upward', // 面部肌肉向上活动
      description: '嘴角大幅上扬，眼睛微弯，眼角出现笑纹，脸颊上扬'
    },
    vocal: {
      pitch: 'medium_high',          // 音调中高
      tempo: 'brisk',                // 语速轻快
      volume: 'medium_loud',         // 音量中偏大
      tone: 'bright_warm',           // 语调明亮温暖
      pauses: 'brief',               // 停顿短暂
      description: '语调轻快明亮，音调略高，带有笑意'
    },
    postural: {
      body_tension: 'light_energetic', // 身体轻盈有活力
      orientation: 'open_facing',      // 身体朝向对方
      lean: 'forward',                 // 前倾
      shoulders: 'relaxed_bouncy',     // 肩膀放松有弹性
      description: '身体轻盈，姿态开放，有轻微的弹动感'
    },
    gestural: {
      hand_movement: 'expressive',     // 手势丰富
      palm_orientation: 'open_varied', // 手掌开放多变
      description: '手势丰富多变，常配合言语节奏'
    }
  },
  
  [EmotionTypes.CURIOUS]: {
    facial: {
      eyebrows: 'one_raised',        // 一边眉毛挑起
      eyes: 'wide_focused',          // 眼睛睁大聚焦
      mouth: 'slight_open',          // 嘴微张
      head_tilt: 'slight_side',      // 头微侧
      face_muscles: 'attentive',     // 面部肌肉专注
      description: '眉毛微挑，眼睛睁大聚焦，头部微侧，嘴微张'
    },
    vocal: {
      pitch: 'varied_rising',        // 音调多变，句末上扬
      tempo: 'moderate_slow',        // 语速中等偏慢
      volume: 'medium',              // 音量中等
      tone: 'inquiring',             // 语调探询
      pauses: 'thoughtful',          // 停顿思考性
      description: '语调探询，句末常上扬，带有思考性停顿'
    },
    postural: {
      body_tension: 'alert_forward', // 警觉前倾
      orientation: 'leaning_in',     // 身体前倾靠近
      lean: 'forward',               // 明显前倾
      shoulders: 'slight_forward',   // 肩膀微前
      description: '身体明显前倾，姿态警觉，靠近信息源'
    },
    gestural: {
      hand_movement: 'pointing',     // 指向性手势
      palm_orientation: 'up_questioning', // 手掌向上表示疑问
      description: '常有指向性手势，或手掌向上表示疑问'
    }
  },
  
  [EmotionTypes.CONCERNED]: {
    facial: {
      eyebrows: 'inner_raised',      // 眉毛内侧上扬
      eyes: 'soft_worried',          // 眼神柔和带担忧
      mouth: 'slight_frown',         // 嘴微皱
      forehead: 'slight_wrinkle',    // 额头微皱
      face_muscles: 'tensed_inner',  // 面部内侧肌肉紧张
      description: '眉头微皱，眉毛内侧上扬，眼神柔和带担忧'
    },
    vocal: {
      pitch: 'low_medium',           // 音调偏低中
      tempo: 'slow',                 // 语速缓慢
      volume: 'soft',                // 音量轻柔
      tone: 'gentle_supportive',     // 语调温和支持
      pauses: 'caring',              // 停顿关怀性
      description: '语调温和轻柔，语速缓慢，充满关怀'
    },
    postural: {
      body_tension: 'soft_approach', // 柔和靠近
      orientation: 'facing_close',   // 面向靠近
      lean: 'slight_forward',        // 微微前倾
      shoulders: 'relaxed_forward',  // 肩膀放松前倾
      description: '身体柔和靠近，姿态表达关心和支持'
    },
    gestural: {
      hand_movement: 'comforting',   // 安慰性手势
      palm_orientation: 'open_down', // 手掌向下安抚
      description: '手势温和，可能有安慰性的轻拍动作'
    }
  },
  
  [EmotionTypes.TIRED]: {
    facial: {
      eyebrows: 'relaxed_low',       // 眉毛放松下垂
      eyes: 'half_closed',           // 眼睛半闭
      mouth: 'neutral_droop',        // 嘴角微垂
      eyelids: 'heavy',              // 眼皮沉重
      face_muscles: 'slack',         // 面部肌肉松弛
      description: '眼皮沉重，眼睛半闭，嘴角微垂，面部肌肉松弛'
    },
    vocal: {
      pitch: 'low',                  // 音调低沉
      tempo: 'slow',                 // 语速缓慢
      volume: 'soft',                // 音量轻柔
      tone: 'flat_weary',            // 语调平淡疲惫
      pauses: 'long',                // 停顿长
      description: '语调低沉平淡，语速缓慢，停顿较长'
    },
    postural: {
      body_tension: 'slumped',       // 身体塌陷
      orientation: 'withdrawn',      // 姿态退缩
      lean: 'backward_slump',        // 向后塌陷
      shoulders: 'drooped',          // 肩膀下垂
      description: '身体塌陷，肩膀下垂，姿态退缩'
    },
    gestural: {
      hand_movement: 'minimal_slow', // 手势极少缓慢
      palm_orientation: 'down_rest', // 手掌向下 resting
      description: '手势极少，动作缓慢'
    }
  },
  
  [EmotionTypes.EXCITED]: {
    facial: {
      eyebrows: 'raised',            // 眉毛上扬
      eyes: 'wide_bright',           // 眼睛睁大有神
      mouth: 'open_smile',           // 张嘴笑
      cheeks: 'high_raised',         // 脸颊高高扬起
      face_muscles: 'high_energy',   // 面部肌肉高能量
      description: '眼睛睁大有神，眉毛上扬，张嘴大笑，脸颊高扬'
    },
    vocal: {
      pitch: 'high',                 // 音调高
      tempo: 'fast',                 // 语速快
      volume: 'loud',                // 音量大
      tone: 'enthusiastic',          // 语调热情
      pauses: 'minimal',             // 停顿极少
      description: '语调热情高昂，语速快，音量大'
    },
    postural: {
      body_tension: 'high_energy',   // 身体高能量
      orientation: 'dynamic',        // 姿态动态
      lean: 'forward_active',        // 前倾活跃
      shoulders: 'active_moving',    // 肩膀活动
      description: '身体充满能量，姿态动态，可能来回移动'
    },
    gestural: {
      hand_movement: 'vigorous',     // 手势有力
      palm_orientation: 'varied_dynamic', // 手掌多变动态
      description: '手势丰富有力，动作幅度大'
    }
  }
};

// ============ 表达强度映射 ============

/**
 * 情绪强度到表达强度的映射函数
 * 输入：情绪强度 (1-5)
 * 输出：表达强度系数 (0.0-1.0)
 */
function mapIntensityToExpression(intensity) {
  // 使用非线性映射：低强度时变化平缓，高强度时变化陡峭
  // 公式：(intensity - 1) / 4 的平方根
  const normalized = (intensity - 1) / 4;
  return Math.sqrt(normalized);
}

/**
 * 根据强度调整表达描述
 * @param {string} baseDescription - 基础表达描述
 * @param {number} intensity - 情绪强度 (1-5)
 * @returns {string} 调整后的表达描述
 */
function modulateExpressionByIntensity(baseDescription, intensity) {
  const coefficient = mapIntensityToExpression(intensity);
  
  // 强度修饰词
  const modifiers = {
    0.0-0.2: '极其微弱的，几乎不可察觉的',
    0.2-0.4: '轻微的，细微的',
    0.4-0.6: '中等的，明显的',
    0.6-0.8: '强烈的，显著的',
    0.8-1.0: '极其强烈的，充满张力的'
  };
  
  // 找到合适的修饰词
  let modifier = '中等的';
  if (coefficient <= 0.2) modifier = '极其微弱的，几乎不可察觉的';
  else if (coefficient <= 0.4) modifier = '轻微的，细微的';
  else if (coefficient <= 0.6) modifier = '中等的，明显的';
  else if (coefficient <= 0.8) modifier = '强烈的，显著的';
  else modifier = '极其强烈的，充满张力的';
  
  return `${modifier}：${baseDescription}`;
}

// ============ 核心类 ============

class EmotionExpressionModule {
  constructor() {
    this.expressionPatterns = EmotionExpressionPatterns;
  }
  
  /**
   * 获取情绪的面部表达
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 情绪强度 (1-5)
   * @returns {object} 面部表达详情
   */
  getFacialExpression(emotionName, intensity = 3) {
    const pattern = this.expressionPatterns[emotionName];
    if (!pattern) {
      return {
        error: `未知情绪类型：${emotionName}`,
        facial: { description: '中性表情' }
      };
    }
    
    const facial = pattern.facial;
    return {
      ...facial,
      intensity: intensity,
      modulatedDescription: modulateExpressionByIntensity(facial.description, intensity)
    };
  }
  
  /**
   * 获取情绪的声音表达
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 情绪强度 (1-5)
   * @returns {object} 声音表达详情
   */
  getVocalExpression(emotionName, intensity = 3) {
    const pattern = this.expressionPatterns[emotionName];
    if (!pattern) {
      return {
        error: `未知情绪类型：${emotionName}`,
        vocal: { description: '中性语调' }
      };
    }
    
    const vocal = pattern.vocal;
    return {
      ...vocal,
      intensity: intensity,
      modulatedDescription: modulateExpressionByIntensity(vocal.description, intensity)
    };
  }
  
  /**
   * 获取情绪的姿态表达
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 情绪强度 (1-5)
   * @returns {object} 姿态表达详情
   */
  getPosturalExpression(emotionName, intensity = 3) {
    const pattern = this.expressionPatterns[emotionName];
    if (!pattern) {
      return {
        error: `未知情绪类型：${emotionName}`,
        postural: { description: '中性姿态' }
      };
    }
    
    const postural = pattern.postural;
    return {
      ...postural,
      intensity: intensity,
      modulatedDescription: modulateExpressionByIntensity(postural.description, intensity)
    };
  }
  
  /**
   * 获取情绪的手势表达
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 情绪强度 (1-5)
   * @returns {object} 手势表达详情
   */
  getGesturalExpression(emotionName, intensity = 3) {
    const pattern = this.expressionPatterns[emotionName];
    if (!pattern) {
      return {
        error: `未知情绪类型：${emotionName}`,
        gestural: { description: '中性手势' }
      };
    }
    
    const gestural = pattern.gestural;
    return {
      ...gestural,
      intensity: intensity,
      modulatedDescription: modulateExpressionByIntensity(gestural.description, intensity)
    };
  }
  
  /**
   * 获取情绪的完整表达（所有模态）
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 情绪强度 (1-5)
   * @returns {object} 完整表达详情
   */
  getFullExpression(emotionName, intensity = 3) {
    const pattern = this.expressionPatterns[emotionName];
    if (!pattern) {
      return {
        error: `未知情绪类型：${emotionName}`,
        expression: {
          facial: { description: '中性表情' },
          vocal: { description: '中性语调' },
          postural: { description: '中性姿态' },
          gestural: { description: '中性手势' }
        }
      };
    }
    
    const intensityMod = mapIntensityToExpression(intensity);
    
    return {
      emotion: emotionName,
      intensity: intensity,
      expressionCoefficient: intensityMod,
      facial: {
        ...pattern.facial,
        modulatedDescription: modulateExpressionByIntensity(pattern.facial.description, intensity)
      },
      vocal: {
        ...pattern.vocal,
        modulatedDescription: modulateExpressionByIntensity(pattern.vocal.description, intensity)
      },
      postural: {
        ...pattern.postural,
        modulatedDescription: modulateExpressionByIntensity(pattern.postural.description, intensity)
      },
      gestural: {
        ...pattern.gestural,
        modulatedDescription: modulateExpressionByIntensity(pattern.gestural.description, intensity)
      },
      summary: this._generateExpressionSummary(pattern, intensity)
    };
  }
  
  /**
   * 生成表达摘要
   * @private
   */
  _generateExpressionSummary(pattern, intensity) {
    const { facial, vocal, postural } = pattern;
    
    // 提取关键特征
    const keyFeatures = [
      facial.description,
      vocal.description,
      postural.description
    ];
    
    const intensityDesc = intensity <= 2 ? '轻微' :
                          intensity <= 3 ? '中等' :
                          intensity <= 4 ? '强烈' : '极其强烈';
    
    return `整体表达 (${intensityDesc}): ${keyFeatures.join('；')}`;
  }
  
  /**
   * 获取表达模态枚举
   * @returns {object} 表达模态
   */
  getModalities() {
    return ExpressionModalities;
  }
  
  /**
   * 获取模块信息
   * @returns {object} 模块元信息
   */
  getModuleInfo() {
    return {
      name: 'EmotionExpressionModule',
      version: '3.15.0',
      description: '情绪表达模块 - 基于 SEP 情绪理论的表达成分',
      theoreticalBasis: [
        'Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy',
        'Ekman, P. (1992). An Argument for Basic Emotions',
        'Darwin, C. (1872). The Expression of the Emotions in Man and Animals'
      ],
      supportedEmotions: Object.keys(this.expressionPatterns),
      supportedModalities: Object.values(ExpressionModalities),
      intensityRange: { min: 1, max: 5 }
    };
  }
}

// ============ 导出 ============

module.exports = {
  EmotionExpressionModule,
  ExpressionModalities,
  EmotionExpressionPatterns,
  mapIntensityToExpression,
  modulateExpressionByIntensity
};
