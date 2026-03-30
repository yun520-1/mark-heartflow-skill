/**
 * 具身认知增强模块 (Embodied Cognition Enhancement)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 具身认知理论 (Embodied Cognition)
 * 
 * 核心理论：
 * - 认知不是抽象计算，而是身体 - 环境互动的产物
 * - 身体形态限制/塑造概念获取 (Conceptualization)
 * - 身体 - 环境互动可替代内部表征 (Replacement)
 * - 身体过程构成认知过程 (Constitution)
 * - 现象学传统：Merleau-Ponty, Heidegger, Husserl
 * 
 * 可操作技术：
 * - 身体状态扫描：检测生理/情绪状态
 * - 环境情境评估：当前物理/社会环境
 * - 具身响应生成：基于身体 - 环境互动的响应
 * - 行动导向干预：促进身体行动而非纯认知分析
 * 
 * @module embodied-cognition-enhanced
 */

const EmbodiedCognitionEnhanced = {
  /**
   * 模块元信息
   */
  meta: {
    name: '具身认知增强',
    version: '1.0.0',
    source: 'SEP Embodied Cognition + Phenomenology',
    description: '基于具身认知理论的身体 - 环境互动干预模块',
    upgradeVersion: 'v4.5.0'
  },

  /**
   * 身体状态扫描系统
   * 
   * 基于 interoception (内感受) 和 proprioception (本体感受)
   */
  bodyScan: {
    /**
     * 身体区域映射
     */
    bodyRegions: {
      'head': { name: '头部', sensations: ['紧张', '压力', '轻松', '清晰'] },
      'neck': { name: '颈部', sensations: ['僵硬', '放松', '灵活'] },
      'shoulders': { name: '肩膀', sensations: ['紧绷', '沉重', '轻松'] },
      'chest': { name: '胸部', sensations: ['紧缩', '开阔', '沉重', '轻盈'] },
      'stomach': { name: '腹部', sensations: ['紧张', '舒适', '翻腾', '平静'] },
      'arms': { name: '手臂', sensations: ['无力', '有力', '沉重', '轻盈'] },
      'hands': { name: '双手', sensations: ['冰冷', '温暖', '颤抖', '稳定'] },
      'legs': { name: '腿部', sensations: ['无力', '有力', '沉重', '轻盈'] }
    },

    /**
     * 生理指标与情绪映射
     */
    physiologicalEmotionMap: {
      'high_arousal': {
        indicators: ['心率快', '呼吸急促', '肌肉紧张'],
        possibleEmotions: ['焦虑', '愤怒', '兴奋', '恐惧']
      },
      'low_arousal': {
        indicators: ['心率慢', '呼吸缓慢', '肌肉松弛'],
        possibleEmotions: ['悲伤', '平静', '疲惫', '满足']
      },
      'approach_tendency': {
        indicators: ['身体前倾', '肌肉准备', '能量上升'],
        possibleEmotions: ['愤怒', '喜悦', '渴望']
      },
      'avoidance_tendency': {
        indicators: ['身体后撤', '肌肉收缩', '能量下降'],
        possibleEmotions: ['恐惧', '厌恶', '悲伤']
      }
    },

    /**
     * 执行身体扫描
     * @param {Object} options - 扫描选项
     * @returns {Object} 身体状态报告
     */
    scan: function(options = {}) {
      const { depth = 'full', focusAreas = [] } = options;
      
      const scanResult = {
        timestamp: Date.now(),
        depth,
        regions: {},
        overallArousal: 0.5,
        overallValence: 0.5,
        actionTendencies: [],
        dominantSensations: []
      };
      
      // 扫描各身体区域
      const regionsToScan = focusAreas.length > 0 ? focusAreas : Object.keys(this.bodyRegions);
      
      for (const region of regionsToScan) {
        const regionData = this.scanRegion(region);
        scanResult.regions[region] = regionData;
        
        // 收集主导感觉
        if (regionData.sensations.length > 0) {
          scanResult.dominantSensations.push(...regionData.sensations);
        }
      }
      
      // 计算整体唤醒度
      scanResult.overallArousal = this.calculateArousal(scanResult.regions);
      
      // 计算整体效价
      scanResult.overallValence = this.calculateValence(scanResult.regions);
      
      // 识别行动倾向
      scanResult.actionTendencies = this.identifyActionTendencies(scanResult);
      
      return scanResult;
    },

    /**
     * 扫描特定身体区域
     */
    scanRegion: function(region) {
      // 在实际应用中，这里会连接生物传感器或用户输入
      // 这里提供框架和示例
      return {
        region: this.bodyRegions[region]?.name || region,
        tension: 0.5, // 0-1 紧张度
        temperature: 'neutral', // 'cold', 'neutral', 'warm'
        sensations: [], // 检测到的感觉
        awareness: 0.5, // 觉察程度
        note: '需要用户输入或传感器数据'
      };
    },

    /**
     * 计算整体唤醒度
     */
    calculateArousal: function(regions) {
      let totalTension = 0;
      let count = 0;
      
      for (const region of Object.values(regions)) {
        if (region.tension !== undefined) {
          totalTension += region.tension;
          count++;
        }
      }
      
      return count > 0 ? totalTension / count : 0.5;
    },

    /**
     * 计算整体效价
     */
    calculateValence: function(regions) {
      // 基于身体感觉的效价评估
      // 正面感觉：轻松、温暖、开阔、轻盈
      // 负面感觉：紧张、冰冷、紧缩、沉重
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      for (const region of Object.values(regions)) {
        for (const sensation of region.sensations || []) {
          if (['轻松', '温暖', '开阔', '轻盈', '平静', '舒适'].includes(sensation)) {
            positiveCount++;
          } else if (['紧张', '冰冷', '紧缩', '沉重', '僵硬', '翻腾'].includes(sensation)) {
            negativeCount++;
          }
        }
      }
      
      const total = positiveCount + negativeCount;
      if (total === 0) return 0.5;
      
      return 0.5 + (positiveCount - negativeCount) / (2 * total);
    },

    /**
     * 识别行动倾向
     */
    identifyActionTendencies: function(scanResult) {
      const tendencies = [];
      
      // 高唤醒 + 负面效价 → 战斗或逃跑
      if (scanResult.overallArousal > 0.7 && scanResult.overallValence < 0.4) {
        tendencies.push({
          type: 'fight_or_flight',
          description: '战斗或逃跑倾向',
          bodilyBasis: '高唤醒 + 负面感受',
          suggestedAction: '觉察冲动，选择有意识的响应'
        });
      }
      
      // 低唤醒 + 负面效价 → 退缩/冻结
      if (scanResult.overallArousal < 0.3 && scanResult.overallValence < 0.4) {
        tendencies.push({
          type: 'withdrawal',
          description: '退缩/冻结倾向',
          bodilyBasis: '低唤醒 + 负面感受',
          suggestedAction: '温和激活身体，小步骤行动'
        });
      }
      
      // 高唤醒 + 正面效价 → 接近/探索
      if (scanResult.overallArousal > 0.6 && scanResult.overallValence > 0.6) {
        tendencies.push({
          type: 'approach',
          description: '接近/探索倾向',
          bodilyBasis: '高唤醒 + 正面感受',
          suggestedAction: '利用能量进行建设性行动'
        });
      }
      
      return tendencies;
    }
  },

  /**
   * 环境情境评估
   */
  environmentAssessment: {
    /**
     * 环境维度
     */
    dimensions: {
      physical: {
        name: '物理环境',
        factors: ['空间', '光线', '温度', '噪音', '安全性']
      },
      social: {
        name: '社会环境',
        factors: ['他人在场', '社会评价', '关系质量', '权力动态']
      },
      task: {
        name: '任务环境',
        factors: ['任务要求', '时间压力', '资源可用性', '目标清晰度']
      }
    },

    /**
     * 评估环境情境
     * @param {Object} context - 环境信息
     * @returns {Object} 环境评估结果
     */
    assess: function(context) {
      const assessment = {
        timestamp: Date.now(),
        physical: this.assessPhysical(context.physical || {}),
        social: this.assessSocial(context.social || {}),
        task: this.assessTask(context.task || {}),
        affordances: [],
        constraints: []
      };
      
      // 识别环境给养 (Affordances)
      assessment.affordances = this.identifyAffordances(assessment);
      
      // 识别环境约束
      assessment.constraints = this.identifyConstraints(assessment);
      
      return assessment;
    },

    /**
     * 评估物理环境
     */
    assessPhysical: function(physical) {
      return {
        space: physical.space || 'unknown', // 'open', 'confined', 'crowded'
        lighting: physical.lighting || 'unknown', // 'bright', 'dim', 'natural'
        temperature: physical.temperature || 'neutral',
        noise: physical.noise || 'unknown', // 'quiet', 'moderate', 'loud'
        safety: physical.safety || 0.5, // 0-1 安全感知
        comfort: this.calculateComfort(physical)
      };
    },

    /**
     * 评估社会环境
     */
    assessSocial: function(social) {
      return {
        othersPresent: social.othersPresent || false,
        evaluationConcern: social.evaluationConcern || 0.5, // 社会评价担忧
        relationshipQuality: social.relationshipQuality || 'neutral',
        powerDynamic: social.powerDynamic || 'equal',
        supportAvailability: social.supportAvailability || 0.5
      };
    },

    /**
     * 评估任务环境
     */
    assessTask: function(task) {
      return {
        demands: task.demands || 0.5, // 任务要求
        timePressure: task.timePressure || 0.5,
        resources: task.resources || 0.5,
        goalClarity: task.goalClarity || 0.5,
        control: task.control || 0.5 // 控制感
      };
    },

    /**
     * 计算物理舒适度
     */
    calculateComfort: function(physical) {
      let comfort = 0.5;
      
      if (physical.temperature === 'comfortable') comfort += 0.2;
      if (physical.temperature === 'uncomfortable') comfort -= 0.2;
      
      if (physical.noise === 'quiet') comfort += 0.1;
      if (physical.noise === 'loud') comfort -= 0.1;
      
      if (physical.lighting === 'natural') comfort += 0.1;
      
      return Math.max(0, Math.min(1, comfort));
    },

    /**
     * 识别环境给养 (Affordances)
     * Gibson 的给养理论：环境提供的行动可能性
     */
    identifyAffordances: function(assessment) {
      const affordances = [];
      
      // 物理给养
      if (assessment.physical.space === 'open') {
        affordances.push({
          type: 'physical',
          affordance: 'movement',
          description: '开放空间提供移动自由'
        });
      }
      
      // 社会给养
      if (assessment.social.supportAvailability > 0.7) {
        affordances.push({
          type: 'social',
          affordance: 'seeking_support',
          description: '可获得的社会支持'
        });
      }
      
      // 任务给养
      if (assessment.task.control > 0.7 && assessment.task.resources > 0.6) {
        affordances.push({
          type: 'task',
          affordance: 'effective_action',
          description: '高控制感 + 充足资源 = 有效行动的可能性'
        });
      }
      
      return affordances;
    },

    /**
     * 识别环境约束
     */
    identifyConstraints: function(assessment) {
      const constraints = [];
      
      if (assessment.physical.noise === 'loud') {
        constraints.push({
          type: 'physical',
          constraint: 'noise',
          impact: '可能干扰专注和沟通'
        });
      }
      
      if (assessment.social.evaluationConcern > 0.7) {
        constraints.push({
          type: 'social',
          constraint: 'evaluation_pressure',
          impact: '社会评价压力可能限制自然表达'
        });
      }
      
      if (assessment.task.timePressure > 0.7) {
        constraints.push({
          type: 'task',
          constraint: 'time_pressure',
          impact: '时间压力可能影响决策质量'
        });
      }
      
      return constraints;
    }
  },

  /**
   * 具身响应生成
   */
  embodiedResponse: {
    /**
     * 基于身体状态和环境生成响应
     * @param {Object} bodyState - 身体状态
     * @param {Object} environment - 环境评估
     * @returns {Object} 具身响应建议
     */
    generate: function(bodyState, environment) {
      const response = {
        timestamp: Date.now(),
        category: this.categorizeResponse(bodyState, environment),
        interventions: [],
        bodyBased: true,
        environmentAware: true
      };
      
      response.interventions = this.selectInterventions(response.category, bodyState, environment);
      
      return response;
    },

    /**
     * 分类响应类型
     */
    categorizeResponse: function(bodyState, environment) {
      const { overallArousal, overallValence } = bodyState;
      
      // 高唤醒 + 负面 → 平静/接地
      if (overallArousal > 0.7 && overallValence < 0.4) {
        return 'calming_grounding';
      }
      
      // 低唤醒 + 负面 → 激活/ energizing
      if (overallArousal < 0.3 && overallValence < 0.4) {
        return 'activating';
      }
      
      // 高唤醒 + 正面 → 引导/ channeling
      if (overallArousal > 0.6 && overallValence > 0.6) {
        return 'channeling';
      }
      
      // 低唤醒 + 正面 → 维持/ savoring
      if (overallArousal < 0.4 && overallValence > 0.6) {
        return 'savoring';
      }
      
      // 中等 → 觉察/ awareness
      return 'awareness';
    },

    /**
     * 选择干预措施
     */
    selectInterventions: function(category, bodyState, environment) {
      const interventions = {
        'calming_grounding': [
          {
            name: '深呼吸练习',
            type: 'breathing',
            instruction: '缓慢深呼吸，吸气 4 秒，屏息 2 秒，呼气 6 秒',
            duration: '2-5 分钟',
            bodilyBasis: '通过呼吸调节自主神经系统',
            environmentFit: environment.physical.noise !== 'loud'
          },
          {
            name: '身体接地',
            type: 'somatic',
            instruction: '感受双脚与地面的接触，注意身体重量',
            duration: '1-2 分钟',
            bodilyBasis: '本体感受增强带来稳定感',
            environmentFit: true
          },
          {
            name: '渐进肌肉放松',
            type: 'relaxation',
            instruction: '依次紧张然后放松各肌肉群',
            duration: '5-10 分钟',
            bodilyBasis: '释放肌肉紧张，降低生理唤醒',
            environmentFit: environment.physical.space !== 'confined'
          }
        ],
        
        'activating': [
          {
            name: '活力呼吸',
            type: 'breathing',
            instruction: '快速有力的呼吸，激活交感神经系统',
            duration: '1-2 分钟',
            bodilyBasis: '增加氧气供应，提升唤醒度',
            environmentFit: true
          },
          {
            name: '身体伸展',
            type: 'movement',
            instruction: '大幅度的伸展动作，打开胸腔',
            duration: '2-3 分钟',
            bodilyBasis: '扩展身体姿态提升能量',
            environmentFit: environment.physical.space !== 'confined'
          },
          {
            name: '快步走',
            type: 'movement',
            instruction: '快速行走，摆动手臂',
            duration: '5-10 分钟',
            bodilyBasis: '全身运动激活能量',
            environmentFit: environment.affordances.some(a => a.affordance === 'movement')
          }
        ],
        
        'channeling': [
          {
            name: '目标导向行动',
            type: 'action',
            instruction: '将能量引导至有意义的任务',
            duration: '根据任务',
            bodilyBasis: '利用高能量状态进行建设性工作',
            environmentFit: environment.task.control > 0.5
          },
          {
            name: '创造性表达',
            type: 'creative',
            instruction: '通过写作、绘画、音乐表达能量',
            duration: '15-30 分钟',
            bodilyBasis: '将情绪能量转化为创造性产出',
            environmentFit: true
          }
        ],
        
        'savoring': [
          {
            name: '正念品味',
            type: 'mindfulness',
            instruction: '专注地体验当下的愉悦感受',
            duration: '3-5 分钟',
            bodilyBasis: '增强正面感受的觉察和持续',
            environmentFit: true
          },
          {
            name: '感恩身体',
            type: 'appreciation',
            instruction: '感谢身体的功能和感受能力',
            duration: '2-3 分钟',
            bodilyBasis: '培养与身体的积极关系',
            environmentFit: true
          }
        ],
        
        'awareness': [
          {
            name: '开放觉察',
            type: 'mindfulness',
            instruction: '不加评判地觉察当下体验',
            duration: '5-10 分钟',
            bodilyBasis: '培养对身心状态的敏锐觉察',
            environmentFit: true
          },
          {
            name: '身体扫描冥想',
            type: 'meditation',
            instruction: '系统地觉察身体各部位的感受',
            duration: '10-20 分钟',
            bodilyBasis: '深化身心连接',
            environmentFit: environment.physical.noise !== 'loud'
          }
        ]
      };
      
      return interventions[category] || interventions['awareness'];
    }
  },

  /**
   * 身体行动促进
   */
  actionFacilitation: {
    /**
     * 促进身体行动执行
     * @param {Object} intervention - 干预措施
     * @returns {Object} 执行支持
     */
    facilitate: function(intervention) {
      return {
        preparation: this.prepareAction(intervention),
        execution: this.supportExecution(intervention),
        reflection: this.supportReflection(intervention)
      };
    },

    /**
     * 准备行动
     */
    prepareAction: function(intervention) {
      return {
        mindset: '以好奇和开放的态度接近这个练习',
        bodyPreparation: '采取舒适的姿势，做 3 次深呼吸',
        intention: `意图：${intervention.instruction}`,
        estimatedDuration: intervention.duration,
        environmentCheck: intervention.environmentFit ? '环境适合' : '考虑调整环境'
      };
    },

    /**
     * 支持执行
     */
    supportExecution: function(intervention) {
      return {
        stepByStep: this.breakDownSteps(intervention),
        reminders: [
          '保持温和的态度，不要强迫',
          '注意身体的反馈，适时调整',
          '如果感到不适，可以暂停'
        ],
        modifications: this.suggestModifications(intervention)
      };
    },

    /**
     * 分解步骤
     */
    breakDownSteps: function(intervention) {
      // 根据干预类型提供具体步骤
      if (intervention.type === 'breathing') {
        return [
          '1. 采取舒适坐姿或躺姿',
          '2. 一只手放在腹部，感受呼吸',
          '3. 按照指示的节奏呼吸',
          '4. 注意呼吸过程中的身体感受',
          '5. 结束后，静坐片刻，注意变化'
        ];
      } else if (intervention.type === 'movement') {
        return [
          '1. 确保有足够的活动空间',
          '2. 从温和的动作开始',
          '3. 逐渐增加动作幅度',
          '4. 注意身体的感受和限制',
          '5. 结束后，静止片刻，整合体验'
        ];
      }
      
      return ['按照干预指示执行', '注意身体感受', '结束后反思'];
    },

    /**
     * 建议调整
     */
    suggestModifications: function(intervention) {
      const modifications = [];
      
      if (intervention.duration.includes('10')) {
        modifications.push('如时间有限，可缩短至 5 分钟');
      }
      
      if (intervention.type === 'movement') {
        modifications.push('如有身体限制，选择适合的动作幅度');
      }
      
      return modifications;
    },

    /**
     * 支持反思
     */
    supportReflection: function(intervention) {
      return {
        immediateQuestions: [
          '做完这个练习后，你的身体感受有什么变化？',
          '情绪状态有什么变化？',
          '哪个部分最有帮助？'
        ],
        bodyCheck: '再次扫描身体，注意与练习前的差异',
        integration: '思考如何将这个练习融入日常生活'
      };
    }
  },

  /**
   * 核心 API
   */

  /**
   * 执行完整的具身认知干预循环
   * @param {Object} context - 情境信息
   * @returns {Object} 完整干预方案
   */
  runEmbodiedIntervention: function(context) {
    // 1. 身体扫描
    const bodyState = this.bodyScan.scan(context.bodyScanOptions);
    
    // 2. 环境评估
    const environment = this.environmentAssessment.assess(context.environment || {});
    
    // 3. 生成具身响应
    const response = this.embodiedResponse.generate(bodyState, environment);
    
    // 4. 准备行动促进
    const facilitation = response.interventions.map(i => this.actionFacilitation.facilitate(i));
    
    return {
      bodyState,
      environment,
      response,
      facilitation,
      cycleComplete: true,
      timestamp: Date.now()
    };
  },

  /**
   * 快速身体觉察练习
   * @returns {Object} 练习指导
   */
  quickBodyAwarenessExercise: function() {
    return {
      exercise: '快速身体觉察',
      duration: '2-3 分钟',
      steps: [
        '1. 暂停当前活动，将注意力转向身体',
        '2. 注意双脚与地面的接触感',
        '3. 扫描身体，注意任何紧张或不适',
        '4. 做 3 次深呼吸，感受气息进出',
        '5. 注意整体身体感受：紧张/放松？ energized/tired？',
        '6. 不带评判地接纳当下的身体状态'
      ],
      benefits: [
        '快速连接身体感受',
        '中断自动化反应模式',
        '为有意识选择创造空间'
      ]
    };
  },

  /**
   * 具身情绪调节练习
   * @param {String} targetEmotion - 目标情绪状态
   * @returns {Object} 练习指导
   */
  embodiedEmotionRegulation: function(targetEmotion) {
    const exercises = {
      'calm': {
        name: '具身平静练习',
        posture: '舒适坐姿，脊柱挺直但放松',
        breathing: '缓慢深呼吸，呼气比吸气长',
        movement: '缓慢、流畅的动作，如太极式手臂运动',
        grounding: '感受身体重量，双脚稳踏地面',
        duration: '5-10 分钟'
      },
      'energy': {
        name: '具身活力练习',
        posture: '站立，双脚分开与肩同宽',
        breathing: '有力的呼吸，激活核心',
        movement: '大幅度的伸展和跳跃',
        grounding: '感受双脚推地的力量',
        duration: '3-5 分钟'
      },
      'confidence': {
        name: '具身自信练习',
        posture: '扩展姿态：挺胸抬头，双手叉腰或上举',
        breathing: '深而稳定的呼吸',
        movement: '有力的手势和姿态',
        grounding: '感受身体的稳定和力量',
        duration: '2-3 分钟'
      }
    };
    
    return exercises[targetEmotion] || exercises['calm'];
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmbodiedCognitionEnhanced;
}
