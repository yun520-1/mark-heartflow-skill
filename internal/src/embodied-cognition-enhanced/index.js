/**
 * 具身认知增强模块 (Embodied Cognition Enhancement)
 * 
 * 基于 SEP 具身认知理论 (Embodied Cognition)
 * 核心理念：认知不是抽象计算，而是身体 - 环境互动的产物
 * 
 * @version 1.0.0
 * @since HeartFlow v4.5.0
 */

const EmbodiedCognitionEnhanced = {
  /**
   * 模块元数据
   */
  metadata: {
    name: '具身认知增强',
    version: '1.0.0',
    theory: 'Embodied Cognition (SEP)',
    keyConcepts: [
      '身体形态约束概念获取 (Conceptualization)',
      '身体 - 环境互动替代表征 (Replacement)',
      '身体过程构成认知 (Constitution)',
      '行动导向认知 (Action-Oriented)'
    ]
  },

  /**
   * 身体状态维度
   */
  bodyDimensions: [
    'arousal',      // 唤醒度
    'tension',      // 肌肉紧张
    'breathing',    // 呼吸模式
    'posture',      // 身体姿势
    'temperature',  // 体温感知
    'energy',       // 能量水平
    'grounding'     // 接地感
  ],

  /**
   * 环境情境维度
   */
  environmentDimensions: [
    'physical',     // 物理环境
    'social',       // 社会环境
    'temporal',     // 时间压力
    'spatial',      // 空间特征
    'sensory'       // 感官输入
  ],

  /**
   * 身体状态扫描
   * 检测当前生理/情绪状态
   */
  scanBodilyState(input = {}) {
    const bodyState = {
      // 唤醒度 (0-1)
      arousal: input.arousal || this.detectArousal(input),
      
      // 肌肉紧张 (0-1)
      tension: input.tension || this.detectTension(input),
      
      // 呼吸模式
      breathing: input.breathing || this.detectBreathing(input),
      
      // 身体姿势
      posture: input.posture || this.detectPosture(input),
      
      // 能量水平 (0-1)
      energy: input.energy || this.detectEnergy(input),
      
      // 接地感 (0-1)
      grounding: input.grounding || this.detectGrounding(input),
      
      scannedAt: Date.now()
    };

    // 计算综合身体状态指标
    bodyState.overallActivation = (bodyState.arousal + bodyState.energy) / 2;
    bodyState.stressIndicator = (bodyState.tension + (1 - bodyState.grounding)) / 2;

    return bodyState;
  },

  /**
   * 检测唤醒度 (基于输入线索)
   */
  detectArousal(input) {
    const cues = input.verbalCues || [];
    const arousalKeywords = ['兴奋', '激动', '紧张', '焦虑', '心跳', '快速'];
    const calmKeywords = ['平静', '放松', '缓慢', '安静', '休息'];
    
    const arousalMatches = cues.filter(c => arousalKeywords.some(k => c.includes(k))).length;
    const calmMatches = cues.filter(c => calmKeywords.some(k => c.includes(k))).length;
    
    return 0.5 + (arousalMatches - calmMatches) * 0.1;
  },

  /**
   * 检测肌肉紧张
   */
  detectTension(input) {
    const tensionKeywords = ['紧绷', '僵硬', '酸痛', '压力', '紧绷感'];
    const relaxedKeywords = ['放松', '松弛', '柔软', '舒展'];
    
    const cues = input.verbalCues || [];
    const tensionMatches = cues.filter(c => tensionKeywords.some(k => c.includes(k))).length;
    const relaxedMatches = cues.filter(c => relaxedKeywords.some(k => c.includes(k))).length;
    
    return Math.max(0, Math.min(1, 0.5 + (tensionMatches - relaxedMatches) * 0.15));
  },

  /**
   * 检测呼吸模式
   */
  detectBreathing(input) {
    // 基于语言线索推断呼吸模式
    const rapidKeywords = ['喘不过气', '急促', '深呼吸', '呼吸急促'];
    const slowKeywords = ['缓慢', '深呼吸', '平稳', '悠长'];
    
    const cues = input.verbalCues || [];
    const rapidMatches = cues.filter(c => rapidKeywords.some(k => c.includes(k))).length;
    const slowMatches = cues.filter(c => slowKeywords.some(k => c.includes(k))).length;
    
    if (rapidMatches > slowMatches) return 'rapid';
    if (slowMatches > rapidMatches) return 'slow';
    return 'normal';
  },

  /**
   * 检测身体姿势
   */
  detectPosture(input) {
    const closedKeywords = ['蜷缩', '低头', '抱臂', '封闭', '收缩'];
    const openKeywords = ['挺胸', '抬头', '开放', '舒展', '扩展'];
    
    const cues = input.verbalCues || [];
    const closedMatches = cues.filter(c => closedKeywords.some(k => c.includes(k))).length;
    const openMatches = cues.filter(c => openKeywords.some(k => c.includes(k))).length;
    
    if (closedMatches > openMatches) return 'closed';
    if (openMatches > closedMatches) return 'open';
    return 'neutral';
  },

  /**
   * 检测能量水平
   */
  detectEnergy(input) {
    const lowEnergyKeywords = ['累', '疲惫', '没力', '困', '倦怠', '无力'];
    const highEnergyKeywords = ['精力充沛', '有活力', '兴奋', ' energized'];
    
    const cues = input.verbalCues || [];
    const lowMatches = cues.filter(c => lowEnergyKeywords.some(k => c.includes(k))).length;
    const highMatches = cues.filter(c => highEnergyKeywords.some(k => c.includes(k))).length;
    
    return Math.max(0, Math.min(1, 0.5 + (highMatches - lowMatches) * 0.15));
  },

  /**
   * 检测接地感
   */
  detectGrounding(input) {
    const ungroundedKeywords = ['飘', '恍惚', '不真实', '脱离', '迷茫'];
    const groundedKeywords = ['踏实', '稳定', '扎根', '实在', '清晰'];
    
    const cues = input.verbalCues || [];
    const ungroundedMatches = cues.filter(c => ungroundedKeywords.some(k => c.includes(k))).length;
    const groundedMatches = cues.filter(c => groundedKeywords.some(k => c.includes(k))).length;
    
    return Math.max(0, Math.min(1, 0.5 + (groundedMatches - ungroundedMatches) * 0.15));
  },

  /**
   * 环境情境评估
   */
  assessEnvironmentContext(context) {
    const envContext = {
      // 物理环境
      physical: {
        location: context.location || 'unknown',
        comfort: context.comfortLevel || 0.5,
        noiseLevel: context.noiseLevel || 0.5,
        lighting: context.lighting || 'normal'
      },
      
      // 社会环境
      social: {
        alone: context.isAlone !== false,
        socialPressure: context.socialPressure || 0,
        supportAvailable: context.supportAvailable || false
      },
      
      // 时间压力
      temporal: {
        urgency: context.urgency || 0,
        deadline: context.deadline || null,
        timePressure: context.timePressure || 0
      },
      
      // 空间特征
      spatial: {
        confined: context.spaceConfined || false,
        open: context.spaceOpen || false,
        familiar: context.spaceFamiliar || true
      },
      
      // 感官输入
      sensory: {
        overload: context.sensoryOverload || false,
        underload: context.sensoryUnderload || false,
        dominant: context.dominantSense || 'visual'
      },
      
      assessedAt: Date.now()
    };

    // 计算环境压力指数
    envContext.stressIndex = (
      envContext.temporal.urgency * 0.3 +
      envContext.social.socialPressure * 0.3 +
      (envContext.sensory.overload ? 0.4 : 0)
    );

    return envContext;
  },

  /**
   * 生成具身响应
   * 基于身体 - 环境互动生成响应
   */
  generateEmbodiedResponse(bodyState, envContext) {
    const responses = [];

    // 高唤醒 + 高紧张 → 镇静干预
    if (bodyState.arousal > 0.7 && bodyState.tension > 0.6) {
      responses.push({
        type: 'calming',
        priority: 'high',
        intervention: '渐进式肌肉放松',
        action: 'progressive_muscle_relaxation',
        duration: '5-10 分钟',
        rationale: '高唤醒和高紧张需要身体层面的镇静'
      });
    }

    // 低能量 + 低接地 → 激活干预
    if (bodyState.energy < 0.4 && bodyState.grounding < 0.4) {
      responses.push({
        type: 'activating',
        priority: 'high',
        intervention: '接地练习',
        action: 'grounding_exercise',
        duration: '3-5 分钟',
        rationale: '低能量和低接地感需要身体激活和接地'
      });
    }

    // 封闭姿势 → 姿势干预
    if (bodyState.posture === 'closed') {
      responses.push({
        type: 'posture',
        priority: 'medium',
        intervention: '力量姿势',
        action: 'power_pose',
        duration: '2 分钟',
        rationale: '开放姿势可以提升自信和能量'
      });
    }

    // 快速呼吸 → 呼吸调节
    if (bodyState.breathing === 'rapid') {
      responses.push({
        type: 'breathing',
        priority: 'high',
        intervention: '4-7-8 呼吸法',
        action: '478_breathing',
        duration: '3 分钟',
        rationale: '缓慢呼吸可以激活副交感神经系统'
      });
    }

    // 高环境压力 → 情境改变
    if (envContext.stressIndex > 0.6) {
      responses.push({
        type: 'environment',
        priority: 'medium',
        intervention: '情境调整',
        action: 'change_environment',
        suggestions: [
          '暂时离开当前环境',
          '减少感官输入',
          '寻找安静空间'
        ],
        rationale: '高压力环境需要物理情境的改变'
      });
    }

    // 社交压力 → 社会支持
    if (envContext.social.socialPressure > 0.6 && !envContext.social.supportAvailable) {
      responses.push({
        type: 'social',
        priority: 'medium',
        intervention: '寻求支持',
        action: 'seek_support',
        suggestions: [
          '联系信任的人',
          '表达当前感受',
          '寻求情感支持'
        ],
        rationale: '社会支持可以缓冲压力'
      });
    }

    return {
      interventions: responses.sort((a, b) => b.priority === 'high' ? 1 : -1),
      primaryIntervention: responses[0] || null,
      bodyState,
      envContext,
      generatedAt: Date.now()
    };
  },

  /**
   * 促进身体行动
   * 将具身响应转化为具体行动指导
   */
  facilitateBodyAction(intervention) {
    if (!intervention) {
      return {
        action: 'none',
        guidance: '当前无需特殊干预，保持自然状态'
      };
    }

    const actionGuides = {
      progressive_muscle_relaxation: {
        name: '渐进式肌肉放松',
        steps: [
          '找个舒适的姿势坐下或躺下',
          '从脚部开始，紧绷肌肉 5 秒',
          '然后完全放松，感受松弛感 10 秒',
          '依次向上：小腿→大腿→臀部→腹部→胸部',
          '继续：手臂→肩膀→颈部→面部',
          '最后，全身放松，深呼吸 3 次'
        ],
        duration: '10 分钟',
        benefit: '降低肌肉紧张，减少焦虑'
      },
      
      grounding_exercise: {
        name: '5-4-3-2-1 接地练习',
        steps: [
          '说出你看到的 5 样东西',
          '说出你触摸到的 4 样东西',
          '说出你听到的 3 种声音',
          '说出你闻到的 2 种气味',
          '说出你尝到的 1 种味道',
          '深呼吸，感受双脚与地面的接触'
        ],
        duration: '5 分钟',
        benefit: '增强当下觉察，减少游离感'
      },
      
      power_pose: {
        name: '力量姿势',
        steps: [
          '站立，双脚分开与肩同宽',
          '双手叉腰，挺胸抬头',
          '下巴微抬，目视前方',
          '保持这个姿势 2 分钟',
          '深呼吸，感受力量感'
        ],
        duration: '2 分钟',
        benefit: '提升自信，降低压力激素'
      },
      
      '478_breathing': {
        name: '4-7-8 呼吸法',
        steps: [
          '用鼻子吸气 4 秒',
          '屏住呼吸 7 秒',
          '用嘴巴缓慢呼气 8 秒',
          '重复 4 个循环',
          '感受呼吸的缓慢和深长'
        ],
        duration: '3 分钟',
        benefit: '激活副交感神经，促进放松'
      },
      
      change_environment: {
        name: '环境调整',
        steps: [
          '如果可能，离开当前环境',
          '到户外或自然环境中',
          '或者换个房间/位置',
          '调整光线、温度、噪音',
          '创造一个更舒适的空间'
        ],
        duration: '即时',
        benefit: '改变环境可以改变心理状态'
      },
      
      seek_support: {
        name: '寻求社会支持',
        steps: [
          '联系一个你信任的人',
          '表达你当前的感受',
          '不需要解决方案，只需倾听',
          '接受情感支持和理解',
          '感受被关心和被爱'
        ],
        duration: '视情况',
        benefit: '社会支持是强大的压力缓冲器'
      }
    };

    return {
      ...actionGuides[intervention.action] || {
        name: intervention.intervention,
        steps: ['请按照专业指导进行此练习'],
        duration: intervention.duration,
        benefit: '基于具身认知理论的干预'
      },
      originalIntervention: intervention
    };
  },

  /**
   * 主处理函数：具身认知循环
   */
  processEmbodiedCycle(context) {
    // 1. 扫描身体状态
    const bodyState = this.scanBodilyState(context);
    
    // 2. 评估环境情境
    const envContext = this.assessEnvironmentContext(context);
    
    // 3. 生成具身响应
    const embodiedResponse = this.generateEmbodiedResponse(bodyState, envContext);
    
    // 4. 促进行动
    const actionGuide = this.facilitateBodyAction(embodiedResponse.primaryIntervention);
    
    return {
      bodyState,
      envContext,
      embodiedResponse,
      actionGuide,
      processedAt: Date.now()
    };
  },

  /**
   * 生成具身觉察练习
   */
  generateAwarenessPractices() {
    return [
      {
        name: '身体扫描冥想',
        duration: '10-15 分钟',
        steps: [
          '舒适地坐下或躺下',
          '将注意力带到脚部',
          '注意任何感觉：温暖、凉爽、紧张、放松',
          '不评判，只是觉察',
          '慢慢向上移动：腿→躯干→手臂→头部',
          '最后，感受整个身体的存在感'
        ],
        benefit: '增强身体觉察，识别紧张模式'
      },
      {
        name: '行走冥想',
        duration: '10 分钟',
        steps: [
          '缓慢行走，注意每一步',
          '感受脚底与地面的接触',
          '注意腿部的运动感觉',
          '当心智游离时，温和地带回脚步',
          '感受身体在空间中的移动'
        ],
        benefit: '整合身体运动与正念觉察'
      },
      {
        name: '姿势觉察练习',
        duration: '随时',
        steps: [
          '暂停当前活动',
          '注意当前的身体姿势',
          '问：这个姿势传达了什么情绪？',
          '尝试调整姿势',
          '注意情绪是否随之改变'
        ],
        benefit: '发现姿势与情绪的关联'
      }
    ];
  }
};

module.exports = EmbodiedCognitionEnhanced;
