/**
 * 具身预测情绪模块 v5.0.7
 * Embodied Predictive Emotion Module v5.0.7
 * 
 * 基于 SEP 具身认知理论 + 预测加工理论 + 情绪理论 + 集体意向性理论
 * 
 * 核心理念:
 * 1. 身体约束概念 - 身体状态塑造情绪预测
 * 2. 情境化认知 - 情绪是身体 - 环境耦合的动态响应
 * 3. 预测性身体 - 情绪体验源于对身体内部状态的预测
 * 4. 社会具身 - 集体情绪通过身体同步实现
 * 
 * @author HeartFlow Team
 * @version 5.0.7
 * @license MIT
 */

class EmbodiedPredictiveEmotionModule {
  constructor() {
    this.version = '5.0.7';
    this.name = 'Embodied Predictive Emotion';
    this.nameCn = '具身预测情绪';
    
    // 配置参数
    this.config = {
      // 误差阈值
      errorThresholds: {
        low: 0.2,      // 低误差：预测准确
        medium: 0.5,   // 中等误差：需要调整
        high: 0.8      // 高误差：需要干预
      },
      
      // 权重配置
      weights: {
        bodyState: 0.45,      // 身体状态权重
        environment: 0.30,    // 环境情境权重
        social: 0.15,         // 社会情境权重
        history: 0.10         // 历史模型权重
      },
      
      // 耦合评估阈值
      couplingThresholds: {
        excellent: 80,
        good: 60,
        fair: 40,
        poor: 20
      },
      
      // 动态系统参数
      dynamics: {
        attractorStabilityThreshold: 0.7,
        bifurcationWarningThreshold: 0.85,
        interventionOptimalWindow: 0.3  // attractor 边缘干预效果最佳
      }
    };
  }

  /**
   * 具身预测生成器
   * 基于身体状态生成情绪预测，整合身体约束与情境信息
   */
  generateEmbodiedPrediction(context) {
    const { bodyState, environment, socialContext, pastModels } = context;
    
    // 1. 身体状态分析
    const bodyAnalysis = this._analyzeBodyState(bodyState);
    
    // 2. 环境需求评估
    const environmentAnalysis = this._analyzeEnvironment(environment);
    
    // 3. 社会情境评估
    const socialAnalysis = this._analyzeSocialContext(socialContext);
    
    // 4. 历史模型整合
    const historyAnalysis = this._analyzeHistory(pastModels);
    
    // 5. 加权整合预测
    const weightedPrediction = this._integratePredictions({
      body: bodyAnalysis,
      environment: environmentAnalysis,
      social: socialAnalysis,
      history: historyAnalysis
    });
    
    // 6. 概念约束检查 (身体状态约束情绪概念)
    const conceptualConstraints = this._applyConceptualConstraints(
      weightedPrediction,
      bodyState
    );
    
    // 7. 动态吸引子识别
    const dynamicAttractor = this._identifyDynamicAttractor(
      weightedPrediction,
      context
    );
    
    return {
      predictedEmotion: weightedPrediction.emotion,
      predictedIntensity: weightedPrediction.intensity,
      confidence: weightedPrediction.confidence,
      bodyContribution: Math.round(this.config.weights.bodyState * 100),
      environmentContribution: Math.round(this.config.weights.environment * 100),
      socialContribution: Math.round(this.config.weights.social * 100),
      conceptualConstraints,
      dynamicAttractor,
      detailedAnalysis: {
        body: bodyAnalysis,
        environment: environmentAnalysis,
        social: socialAnalysis,
        history: historyAnalysis
      }
    };
  }

  /**
   * 身体状态分析
   */
  _analyzeBodyState(bodyState) {
    const {
      arousal = 0.5,
      heartRate = 75,
      breathingRate = 16,
      muscleTension = 0.3,
      posture = 'neutral',
      energyLevel = 'moderate'
    } = bodyState;
    
    // 身体状态到情绪维度的映射
    const valenceFromArousal = arousal > 0.6 ? -0.3 : 0.2;  // 高唤醒偏向负面
    const energyScore = energyLevel === 'high' ? 0.8 : 
                        energyLevel === 'low' ? 0.2 : 0.5;
    
    // 身体紧张度分析
    const tensionAnalysis = {
      level: muscleTension,
      interpretation: muscleTension > 0.6 ? '高紧张 - 可能与焦虑/愤怒相关' :
                      muscleTension > 0.3 ? '中等紧张 - 准备状态' :
                      '低紧张 - 放松状态',
      emotionHints: muscleTension > 0.6 ? ['焦虑', '愤怒', '压力'] :
                    muscleTension > 0.3 ? ['专注', '期待'] :
                    ['平静', '放松']
    };
    
    // 姿势分析 (具身认知：姿势影响情绪)
    const postureAnalysis = {
      type: posture,
      interpretation: posture === 'open' ? '开放姿势 - 增强自信' :
                      posture === 'closed' ? '封闭姿势 - 可能反映防御' :
                      posture === 'tense' ? '紧张姿势 - 焦虑信号' :
                      '中性姿势',
      emotionInfluence: posture === 'open' ? 0.2 : 
                        posture === 'closed' ? -0.2 :
                        posture === 'tense' ? -0.3 : 0
    };
    
    // 生理指标综合
    const physiologicalScore = (
      (arousal * 0.4) +
      ((heartRate - 60) / 100 * 0.3) +
      ((breathingRate - 12) / 20 * 0.3)
    );
    
    return {
      arousal,
      valence: valenceFromArousal,
      energyScore,
      physiologicalScore,
      tensionAnalysis,
      postureAnalysis,
      primaryEmotionHints: this._bodyToEmotionHints(bodyState),
      confidence: 0.75
    };
  }

  /**
   * 身体状态到情绪提示的映射
   */
  _bodyToEmotionHints(bodyState) {
    const { arousal, energyLevel, muscleTension } = bodyState;
    
    const hints = [];
    
    // 高唤醒 + 低能量 → 焦虑/压力
    if (arousal > 0.6 && energyLevel === 'low') {
      hints.push({ emotion: '焦虑', confidence: 0.7 });
      hints.push({ emotion: '压力', confidence: 0.6 });
    }
    
    // 高唤醒 + 高能量 → 兴奋/愤怒
    if (arousal > 0.6 && energyLevel === 'high') {
      hints.push({ emotion: '兴奋', confidence: 0.6 });
      hints.push({ emotion: '愤怒', confidence: 0.5 });
    }
    
    // 低唤醒 + 低能量 → 悲伤/疲劳
    if (arousal < 0.4 && energyLevel === 'low') {
      hints.push({ emotion: '悲伤', confidence: 0.6 });
      hints.push({ emotion: '疲劳', confidence: 0.7 });
    }
    
    // 高肌肉紧张 → 焦虑/愤怒
    if (muscleTension > 0.6) {
      hints.push({ emotion: '紧张', confidence: 0.65 });
    }
    
    return hints;
  }

  /**
   * 环境情境分析
   */
  _analyzeEnvironment(environment) {
    const {
      location = 'unknown',
      noiseLevel = 'moderate',
      lighting = 'normal',
      temperature = 22,
      spaceType = 'normal'
    } = environment;
    
    // 环境需求评估
    const demands = {
      attention: noiseLevel === 'loud' ? 'high' : 
                 noiseLevel === 'quiet' ? 'low' : 'moderate',
      adaptation: temperature < 18 || temperature > 28 ? 'high' : 'low',
      social: location.includes('办公室') || location.includes('会议') ? 'high' : 'moderate'
    };
    
    // 环境对情绪的影响
    const emotionInfluence = {
      noiseImpact: noiseLevel === 'loud' ? -0.2 : 
                   noiseLevel === 'quiet' ? 0.1 : 0,
      lightingImpact: lighting === 'bright' ? 0.1 :
                      lighting === 'dim' ? -0.1 : 0,
      spaceImpact: spaceType === 'confined' ? -0.15 :
                   spaceType === 'open' ? 0.1 : 0
    };
    
    return {
      demands,
      emotionInfluence,
      comfortScore: this._calculateEnvironmentComfort(environment),
      primaryEmotionHints: this._environmentToEmotionHints(environment),
      confidence: 0.65
    };
  }

  /**
   * 环境舒适度计算
   */
  _calculateEnvironmentComfort(environment) {
    let score = 70;  // 基础分
    
    // 温度舒适度 (22-24 度最佳)
    const tempDiff = Math.abs(environment.temperature - 23);
    score -= tempDiff * 3;
    
    // 噪音影响
    if (environment.noiseLevel === 'loud') score -= 15;
    if (environment.noiseLevel === 'quiet') score += 5;
    
    // 光照影响
    if (environment.lighting === 'dim') score -= 10;
    if (environment.lighting === 'bright') score += 5;
    
    // 空间类型
    if (environment.spaceType === 'confined') score -= 10;
    if (environment.spaceType === 'open') score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 环境到情绪提示的映射
   */
  _environmentToEmotionHints(environment) {
    const hints = [];
    
    if (environment.noiseLevel === 'loud') {
      hints.push({ emotion: '烦躁', confidence: 0.6 });
      hints.push({ emotion: '压力', confidence: 0.5 });
    }
    
    if (environment.spaceType === 'confined') {
      hints.push({ emotion: '压抑', confidence: 0.55 });
      hints.push({ emotion: '焦虑', confidence: 0.45 });
    }
    
    if (environment.lighting === 'dim') {
      hints.push({ emotion: '低落', confidence: 0.5 });
    }
    
    return hints;
  }

  /**
   * 社会情境分析
   */
  _analyzeSocialContext(socialContext) {
    if (!socialContext) {
      return {
        presence: false,
        emotionInfluence: 0,
        collectiveMood: null,
        confidence: 0
      };
    }
    
    const {
      presence = false,
      groupSize = 0,
      relationship = 'unknown',
      powerDynamic = 'equal',
      collectiveMood = 'neutral'
    } = socialContext;
    
    // 社会情境对情绪的影响
    const socialPressure = this._calculateSocialPressure(socialContext);
    const belongingScore = this._calculateBelongingScore(socialContext);
    
    return {
      presence,
      groupSize,
      socialPressure,
      belongingScore,
      collectiveMood,
      powerDynamic,
      emotionInfluence: (socialPressure * -0.3) + (belongingScore * 0.2),
      primaryEmotionHints: this._socialToEmotionHints(socialContext),
      confidence: 0.60
    };
  }

  /**
   * 社会压力计算
   */
  _calculateSocialPressure(socialContext) {
    let pressure = 0.3;  // 基础压力
    
    // 群体大小影响
    if (socialContext.groupSize > 10) pressure += 0.2;
    else if (socialContext.groupSize > 5) pressure += 0.1;
    
    // 权力动态
    if (socialContext.powerDynamic === 'hierarchical') pressure += 0.2;
    if (socialContext.powerDynamic === 'evaluative') pressure += 0.3;
    
    // 关系类型
    if (socialContext.relationship === 'strangers') pressure += 0.2;
    if (socialContext.relationship === 'authority') pressure += 0.25;
    
    return Math.min(1, pressure);
  }

  /**
   * 归属感计算
   */
  _calculateBelongingScore(socialContext) {
    let score = 0.5;  // 基础分
    
    // 关系亲密度
    if (socialContext.relationship === 'friends') score += 0.3;
    if (socialContext.relationship === 'family') score += 0.35;
    if (socialContext.relationship === 'close_colleagues') score += 0.25;
    if (socialContext.relationship === 'strangers') score -= 0.2;
    
    // 群体凝聚力
    if (socialContext.cohesion === 'high') score += 0.2;
    if (socialContext.cohesion === 'low') score -= 0.15;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 社会情境到情绪提示的映射
   */
  _socialToEmotionHints(socialContext) {
    const hints = [];
    const pressure = this._calculateSocialPressure(socialContext);
    
    if (pressure > 0.6) {
      hints.push({ emotion: '紧张', confidence: 0.65 });
      hints.push({ emotion: '社交焦虑', confidence: 0.55 });
    }
    
    if (socialContext.powerDynamic === 'evaluative') {
      hints.push({ emotion: '表现焦虑', confidence: 0.6 });
    }
    
    if (socialContext.cohesion === 'high') {
      hints.push({ emotion: '归属', confidence: 0.5 });
      hints.push({ emotion: '安全', confidence: 0.45 });
    }
    
    return hints;
  }

  /**
   * 历史模型分析
   */
  _analyzeHistory(pastModels) {
    if (!pastModels || !pastModels.similarSituations) {
      return {
        available: false,
        prediction: null,
        confidence: 0
      };
    }
    
    const {
      similarSituations = 0,
      averageArousal = 0.5,
      typicalEmotions = []
    } = pastModels;
    
    return {
      available: true,
      dataPoints: similarSituations,
      averageArousal,
      typicalEmotions,
      reliability: similarSituations > 20 ? 'high' :
                   similarSituations > 10 ? 'medium' : 'low',
      confidence: Math.min(0.8, similarSituations / 50)
    };
  }

  /**
   * 整合预测
   */
  _integratePredictions(analyses) {
    const { body, environment, social, history } = analyses;
    
    // 加权情绪分数
    let emotionScore = 0;
    let totalWeight = 0;
    
    if (body.confidence > 0.5) {
      emotionScore += body.valence * this.config.weights.bodyState;
      totalWeight += this.config.weights.bodyState;
    }
    
    if (environment.confidence > 0.5) {
      const envValence = environment.emotionInfluence.noiseImpact +
                        environment.emotionInfluence.lightingImpact +
                        environment.emotionInfluence.spaceImpact;
      emotionScore += envValence * this.config.weights.environment;
      totalWeight += this.config.weights.environment;
    }
    
    if (social.confidence > 0.5 && social.presence) {
      emotionScore += social.emotionInfluence * this.config.weights.social;
      totalWeight += this.config.weights.social;
    }
    
    // 归一化
    if (totalWeight > 0) {
      emotionScore /= totalWeight;
    }
    
    // 确定主导情绪
    const dominantEmotion = this._determineDominantEmotion(analyses);
    
    // 计算强度 (基于唤醒度和情绪分数)
    const intensity = Math.round(
      (Math.abs(emotionScore) * 5 + body.arousal * 5) * 2
    );
    
    // 计算置信度
    const confidence = Math.round(
      (body.confidence * 0.4 + 
       environment.confidence * 0.3 + 
       social.confidence * 0.2 + 
       (history.confidence || 0) * 0.1) * 100
    ) / 100;
    
    return {
      emotion: dominantEmotion,
      intensity: Math.min(10, Math.max(1, intensity)),
      valence: emotionScore,
      confidence
    };
  }

  /**
   * 确定主导情绪
   */
  _determineDominantEmotion(analyses) {
    const { body, environment, social } = analyses;
    
    // 收集所有情绪提示
    const allHints = [
      ...body.primaryEmotionHints.map(h => ({ ...h, source: 'body' })),
      ...environment.primaryEmotionHints.map(h => ({ ...h, source: 'environment' })),
      ...social.primaryEmotionHints.map(h => ({ ...h, source: 'social' }))
    ];
    
    if (allHints.length === 0) {
      return '中性';
    }
    
    // 按置信度排序
    allHints.sort((a, b) => b.confidence - a.confidence);
    
    // 返回最高置信度的情绪
    return allHints[0].emotion;
  }

  /**
   * 应用概念约束 (身体状态约束情绪概念)
   */
  _applyConceptualConstraints(prediction, bodyState) {
    const constraints = [];
    
    // 约束 1: 高唤醒 + 低能量 → 不能是兴奋
    if (bodyState.arousal > 0.6 && bodyState.energyLevel === 'low') {
      if (prediction.emotion === '兴奋') {
        constraints.push('高唤醒 + 低能量状态通常不产生兴奋，更可能是焦虑');
      }
      constraints.push('高唤醒 + 低能量 → 紧张/焦虑而非兴奋');
    }
    
    // 约束 2: 低唤醒 + 低能量 → 不能是愤怒
    if (bodyState.arousal < 0.4 && bodyState.energyLevel === 'low') {
      if (prediction.emotion === '愤怒') {
        constraints.push('低唤醒 + 低能量状态通常不产生愤怒，更可能是悲伤');
      }
      constraints.push('低唤醒 + 低能量 → 悲伤/疲劳而非愤怒');
    }
    
    // 约束 3: 高肌肉紧张 → 焦虑成分
    if (bodyState.muscleTension > 0.6) {
      constraints.push('高肌肉紧张 → 焦虑/压力成分');
    }
    
    // 约束 4: 封闭姿势 → 防御性情绪
    if (bodyState.posture === 'closed') {
      constraints.push('封闭姿势 → 可能反映防御/不安');
    }
    
    return constraints;
  }

  /**
   * 识别动态吸引子
   */
  _identifyDynamicAttractor(prediction, context) {
    const { bodyState, pastModels } = context;
    
    // 基于情绪和身体状态识别吸引子模式
    const attractors = {
      '焦虑 - 回避循环': {
        conditions: prediction.emotion === '焦虑' && 
                   bodyState.arousal > 0.6 &&
                   bodyState.energyLevel === 'low',
        description: '焦虑导致回避，回避强化焦虑的循环'
      },
      '愤怒 - 攻击循环': {
        conditions: prediction.emotion === '愤怒' && 
                   bodyState.arousal > 0.7 &&
                   bodyState.muscleTension > 0.6,
        description: '愤怒导致攻击倾向，攻击强化愤怒的循环'
      },
      '悲伤 - 退缩循环': {
        conditions: prediction.emotion === '悲伤' && 
                   bodyState.arousal < 0.4 &&
                   bodyState.energyLevel === 'low',
        description: '悲伤导致退缩，退缩强化悲伤的循环'
      },
      '专注 - 流动状态': {
        conditions: prediction.emotion === '专注' && 
                   bodyState.arousal > 0.5 &&
                   bodyState.arousal < 0.8 &&
                   bodyState.energyLevel === 'moderate',
        description: '适度唤醒 + 中等能量 → 心流状态'
      }
    };
    
    for (const [name, attractor] of Object.entries(attractors)) {
      if (attractor.conditions) {
        return {
          name,
          description: attractor.description,
          stability: this._estimateAttractorStability(prediction, context)
        };
      }
    }
    
    return {
      name: '未识别模式',
      description: '当前状态不符合已知吸引子模式',
      stability: 0.5
    };
  }

  /**
   * 估计吸引子稳定性
   */
  _estimateAttractorStability(prediction, context) {
    // 基于历史数据估计稳定性
    if (context.pastModels && context.pastModels.similarSituations > 10) {
      return 0.7 + (context.pastModels.similarSituations / 100);
    }
    
    // 基于当前强度估计
    return 0.3 + (prediction.confidence * 0.4);
  }

  /**
   * 身体 - 环境耦合评估器
   */
  assessBodyEnvironmentCoupling(bodyState, environmentDemands) {
    const {
      energyLevel = 'moderate',
      arousal = 0.5,
      focusAbility = 'moderate'
    } = bodyState;
    
    const {
      requiredEnergy = 'moderate',
      requiredArousal = 0.5,
      requiredFocus = 'moderate',
      timePressure = 'moderate'
    } = environmentDemands;
    
    // 维度匹配度计算
    const energyMatch = this._calculateEnergyMatch(energyLevel, requiredEnergy);
    const arousalMatch = this._calculateArousalMatch(arousal, requiredArousal);
    const focusMatch = this._calculateFocusMatch(focusAbility, requiredFocus);
    
    // 总体耦合分数
    const couplingScore = Math.round(
      (energyMatch + arousalMatch + focusMatch) / 3
    );
    
    // 检测不匹配
    const mismatches = [];
    if (energyMatch < 50) {
      mismatches.push({
        dimension: '能量',
        body: energyLevel,
        demand: requiredEnergy,
        gap: energyMatch < 30 ? '严重' : '中等'
      });
    }
    if (arousalMatch < 50) {
      mismatches.push({
        dimension: '唤醒',
        body: arousal,
        demand: requiredArousal,
        gap: arousalMatch < 30 ? '严重' : '中等'
      });
    }
    if (focusMatch < 50) {
      mismatches.push({
        dimension: '专注',
        body: focusAbility,
        demand: requiredFocus,
        gap: focusMatch < 30 ? '严重' : '中等'
      });
    }
    
    // 预测后果
    const consequences = this._predictCouplingConsequences(couplingScore);
    
    // 生成建议
    const recommendations = this._generateCouplingRecommendations(
      mismatches,
      bodyState,
      environmentDemands
    );
    
    return {
      couplingScore,
      mismatchDetected: mismatches.length > 0,
      mismatches,
      predictedConsequences: consequences,
      recommendations,
      interpretation: this._interpretCouplingScore(couplingScore)
    };
  }

  _calculateEnergyMatch(bodyEnergy, requiredEnergy) {
    const energyMap = { 'low': 0.3, 'moderate': 0.6, 'high': 0.9 };
    const bodyScore = energyMap[bodyEnergy] || 0.5;
    const requiredScore = energyMap[requiredEnergy] || 0.5;
    
    const diff = Math.abs(bodyScore - requiredScore);
    return Math.round((1 - diff) * 100);
  }

  _calculateArousalMatch(bodyArousal, requiredArousal) {
    const diff = Math.abs(bodyArousal - requiredArousal);
    return Math.round((1 - diff) * 100);
  }

  _calculateFocusMatch(bodyFocus, requiredFocus) {
    const focusMap = { 'poor': 0.3, 'moderate': 0.6, 'high': 0.9 };
    const bodyScore = focusMap[bodyFocus] || 0.5;
    const requiredScore = focusMap[requiredFocus] || 0.5;
    
    const diff = Math.abs(bodyScore - requiredScore);
    return Math.round((1 - diff) * 100);
  }

  _predictCouplingConsequences(score) {
    if (score >= 80) {
      return ['表现优化', '情绪稳定', '能量高效利用'];
    } else if (score >= 60) {
      return ['表现良好', '轻微波动可能', '可维持较长时间'];
    } else if (score >= 40) {
      return ['表现下降风险', '情绪波动可能', '疲劳风险增加'];
    } else {
      return ['表现显著下降风险高', '情绪耗竭风险', '错误率可能增加', '需要立即干预'];
    }
  }

  _generateCouplingRecommendations(mismatches, bodyState, environmentDemands) {
    const recommendations = [];
    
    for (const mismatch of mismatches) {
      if (mismatch.dimension === '能量') {
        if (bodyState.energyLevel === 'low' && environmentDemands.requiredEnergy === 'high') {
          recommendations.push({
            type: '身体调节',
            priority: '高',
            action: '短暂休息 + 能量补充 (水/轻食)',
            duration: '5-10 分钟'
          });
        }
      }
      if (mismatch.dimension === '唤醒') {
        if (bodyState.arousal < environmentDemands.requiredArousal) {
          recommendations.push({
            type: '身体激活',
            priority: '中',
            action: '快速活动 (伸展/走动) + 深呼吸',
            duration: '2-3 分钟'
          });
        } else {
          recommendations.push({
            type: '身体镇静',
            priority: '中',
            action: '缓慢呼吸 + 渐进式放松',
            duration: '3-5 分钟'
          });
        }
      }
      if (mismatch.dimension === '专注') {
        recommendations.push({
          type: '认知调节',
          priority: '高',
          action: '单任务专注 + 消除干扰',
          duration: '25 分钟 (番茄钟)'
        });
      }
    }
    
    return recommendations;
  }

  _interpretCouplingScore(score) {
    if (score >= this.config.couplingThresholds.excellent) {
      return '优秀匹配 - 身体状态与环境需求高度协调';
    } else if (score >= this.config.couplingThresholds.good) {
      return '良好匹配 - 身体状态基本满足环境需求';
    } else if (score >= this.config.couplingThresholds.fair) {
      return '中等匹配 - 存在部分不匹配，建议关注';
    } else {
      return '较差匹配 - 身体状态与环境需求显著不协调，建议干预';
    }
  }

  /**
   * 集体情绪预测器
   */
  predictCollectiveEmotion(context) {
    const {
      individualEmotions = [],
      groupCharacteristics = {},
      jointCommitment = {},
      bodilySynchrony = {}
    } = context;
    
    // 1. 个体情绪整合
    const aggregatedEmotion = this._aggregateIndividualEmotions(individualEmotions);
    
    // 2. We-Intention 强度计算
    const weIntentionStrength = this._calculateWeIntentionStrength(
      groupCharacteristics,
      jointCommitment
    );
    
    // 3. 身体同步分析
    const synchronyAnalysis = this._analyzeBodilySynchrony(bodilySynchrony);
    
    // 4. 集体吸引子识别
    const collectiveAttractor = this._identifyCollectiveAttractor(
      aggregatedEmotion,
      groupCharacteristics
    );
    
    // 5. 情绪传染风险评估
    const contagionRisk = this._assessEmotionalContagionRisk(
      individualEmotions,
      groupCharacteristics
    );
    
    // 6. 干预点识别
    const interventionPoints = this._identifyCollectiveInterventionPoints(
      aggregatedEmotion,
      weIntentionStrength,
      synchronyAnalysis
    );
    
    return {
      predictedCollectiveEmotion: aggregatedEmotion.dominant,
      collectiveIntensity: aggregatedEmotion.averageIntensity,
      emotionalContagionRisk: contagionRisk,
      weIntentionStrength,
      collectiveAttractor,
      bodilySynchrony: synchronyAnalysis,
      interventionPoints,
      dynamics: {
        phase: this._determineCollectivePhase(groupCharacteristics),
        stability: this._estimateCollectiveStability(weIntentionStrength, synchronyAnalysis),
        predictedTrajectory: this._predictCollectiveTrajectory(
          aggregatedEmotion,
          groupCharacteristics
        )
      }
    };
  }

  _aggregateIndividualEmotions(individualEmotions) {
    if (individualEmotions.length === 0) {
      return { dominant: '中性', averageIntensity: 0, distribution: {} };
    }
    
    // 情绪分布统计
    const distribution = {};
    let totalIntensity = 0;
    
    for (const person of individualEmotions) {
      const { emotion, intensity } = person;
      distribution[emotion] = (distribution[emotion] || 0) + 1;
      totalIntensity += intensity;
    }
    
    // 主导情绪
    const dominant = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    return {
      dominant,
      averageIntensity: Math.round(totalIntensity / individualEmotions.length),
      distribution,
      diversity: Object.keys(distribution).length
    };
  }

  _calculateWeIntentionStrength(groupCharacteristics, jointCommitment) {
    let strength = 0.5;  // 基础分
    
    // 群体凝聚力
    if (groupCharacteristics.cohesion === 'high') strength += 0.2;
    if (groupCharacteristics.cohesion === 'low') strength -= 0.15;
    
    // 共享目标
    if (groupCharacteristics.sharedGoal) strength += 0.15;
    
    // 联合承诺
    if (jointCommitment.detected) {
      strength += jointCommitment.strength * 0.2;
    }
    
    return Math.min(1, Math.max(0, strength));
  }

  _analyzeBodilySynchrony(bodilySynchrony) {
    const {
      detected = 'none',
      indicators = [],
      synchronyScore = 0
    } = bodilySynchrony;
    
    return {
      detected,
      indicators,
      synchronyScore,
      interpretation: synchronyScore > 0.7 ? '高同步 - 群体凝聚力强' :
                      synchronyScore > 0.4 ? '中等同步 - 群体协调中' :
                      '低同步 - 群体分散'
    };
  }

  _identifyCollectiveAttractor(aggregatedEmotion, groupCharacteristics) {
    const { dominant, averageIntensity } = aggregatedEmotion;
    
    if (dominant === '专注' && averageIntensity > 5) {
      return {
        name: '任务导向协作',
        description: '群体专注于共同任务，高效协作状态'
      };
    }
    
    if (dominant === '紧张' && averageIntensity > 6) {
      return {
        name: '集体焦虑',
        description: '群体共享焦虑状态，可能影响决策质量'
      };
    }
    
    if (dominant === '兴奋' && averageIntensity > 6) {
      return {
        name: '集体热情',
        description: '群体共享积极情绪，创造力和动力高涨'
      };
    }
    
    return {
      name: '未识别模式',
      description: '当前群体情绪状态不符合已知吸引子模式'
    };
  }

  _assessEmotionalContagionRisk(individualEmotions, groupCharacteristics) {
    // 情绪传染风险因素
    const intensity = individualEmotions.reduce((sum, e) => sum + e.intensity, 0) / 
                      (individualEmotions.length || 1);
    
    const diversity = new Set(individualEmotions.map(e => e.emotion)).size;
    
    let risk = '低';
    if (intensity > 7 && diversity < 3) {
      risk = '高';
    } else if (intensity > 5 && diversity < 5) {
      risk = '中等';
    }
    
    // 群体特征影响
    if (groupCharacteristics.cohesion === 'high') {
      risk = risk === '高' ? '高' : risk === '中等' ? '高' : '中等';
    }
    
    return risk;
  }

  _identifyCollectiveInterventionPoints(aggregatedEmotion, weIntentionStrength, synchronyAnalysis) {
    const points = [];
    
    if (aggregatedEmotion.dominant === '紧张' && aggregatedEmotion.averageIntensity > 6) {
      points.push('增强共享目标感可降低个体焦虑');
    }
    
    if (synchronyAnalysis.synchronyScore < 0.4) {
      points.push('身体同步练习可增强群体凝聚力');
    }
    
    if (weIntentionStrength < 0.5) {
      points.push('加强联合承诺可提升集体效能感');
    }
    
    return points;
  }

  _determineCollectivePhase(groupCharacteristics) {
    if (groupCharacteristics.cohesion === 'high' && groupCharacteristics.sharedGoal) {
      return '协调中';
    }
    return '形成中';
  }

  _estimateCollectiveStability(weIntentionStrength, synchronyAnalysis) {
    const score = (weIntentionStrength + synchronyAnalysis.synchronyScore) / 2;
    return score > 0.7 ? '高' : score > 0.4 ? '中等' : '低';
  }

  _predictCollectiveTrajectory(aggregatedEmotion, groupCharacteristics) {
    if (aggregatedEmotion.dominant === '专注' && groupCharacteristics.cohesion === 'high') {
      return '向专注状态收敛';
    }
    if (aggregatedEmotion.dominant === '紧张' && groupCharacteristics.cohesion === 'low') {
      return '可能分散或冲突';
    }
    return '维持当前状态';
  }

  /**
   * 具身干预生成器
   */
  generateEmbodiedInterventions(context) {
    const {
      targetEmotion,
      bodyState,
      environment,
      timeAvailable
    } = context;
    
    // 1. 立即干预 (身体导向)
    const immediateInterventions = this._generateImmediateInterventions(
      targetEmotion,
      bodyState,
      timeAvailable
    );
    
    // 2. 环境调整建议
    const environmentalAdjustments = this._generateEnvironmentalAdjustments(
      environment,
      timeAvailable
    );
    
    // 3. 预测重构
    const predictiveReframing = this._generatePredictiveReframing(
      targetEmotion,
      bodyState
    );
    
    // 4. 证据基础
    const evidenceBase = [
      '具身认知：身体状态直接影响情绪体验',
      '预测加工：改变身体输入可更新情绪预测',
      '情绪理论：身体感受是情绪的核心成分'
    ];
    
    return {
      immediateInterventions,
      environmentalAdjustments,
      predictiveReframing,
      evidenceBase,
      totalDuration: timeAvailable
    };
  }

  _generateImmediateInterventions(targetEmotion, bodyState, timeAvailable) {
    const interventions = [];
    
    // 基于目标情绪和身体状态选择干预
    if (targetEmotion === '焦虑' || targetEmotion === '紧张') {
      if (bodyState.arousal > 0.6) {
        interventions.push({
          name: '4-7-8 呼吸法',
          type: '呼吸调节',
          duration: '2 分钟',
          mechanism: '激活副交感神经，降低生理唤醒',
          instruction: '吸气 4 秒，屏息 7 秒，呼气 8 秒，重复 4 次'
        });
      }
      
      if (bodyState.muscleTension > 0.5) {
        interventions.push({
          name: '渐进式肌肉放松',
          type: '身体扫描',
          duration: '3 分钟',
          mechanism: '释放肌肉紧张，打破焦虑 - 紧张循环',
          instruction: '从脚到头，依次紧张 - 放松各肌群'
        });
      }
    }
    
    if (targetEmotion === '愤怒') {
      interventions.push({
        name: '冷却呼吸',
        type: '呼吸调节',
        duration: '2 分钟',
        mechanism: '降低体温和唤醒度',
        instruction: '缓慢吸气，通过微张的嘴唇呼气，感受凉爽'
      });
      
      interventions.push({
        name: '身体移动',
        type: '身体行动',
        duration: '2 分钟',
        mechanism: '释放愤怒能量，打破愤怒 - 攻击循环',
        instruction: '快速走动或伸展，将能量导向建设性行动'
      });
    }
    
    if (targetEmotion === '悲伤') {
      interventions.push({
        name: '开放姿势',
        type: '姿势调整',
        duration: '1 分钟',
        mechanism: '开放姿势可提升自信和积极情绪',
        instruction: '挺胸抬头，双臂展开，保持 1 分钟'
      });
      
      interventions.push({
        name: '温和身体关怀',
        type: '自我触摸',
        duration: '2 分钟',
        mechanism: '自我触摸激活关怀系统',
        instruction: '双手轻抚手臂或放在心口，感受温暖'
      });
    }
    
    // 确保有干预
    if (interventions.length === 0) {
      interventions.push({
        name: '正念呼吸',
        type: '呼吸觉察',
        duration: '2 分钟',
        mechanism: '提升觉察，减少自动反应',
        instruction: '专注呼吸，不加评判地观察感受'
      });
    }
    
    return interventions;
  }

  _generateEnvironmentalAdjustments(environment, timeAvailable) {
    const adjustments = [];
    const { constraints = [], resources = [] } = environment;
    
    // 基于可用资源生成建议
    if (resources.includes('窗户')) {
      adjustments.push('靠近窗户获取自然光');
    }
    if (resources.includes('椅子')) {
      adjustments.push('调整坐姿为开放姿势');
    }
    if (!constraints.includes('不能离开')) {
      adjustments.push('短暂户外走动 (2-3 分钟)');
    }
    
    // 默认建议
    if (adjustments.length === 0) {
      adjustments.push('调整工作区域布局减少压迫感');
    }
    
    return adjustments;
  }

  _generatePredictiveReframing(targetEmotion, bodyState) {
    const reframes = [];
    
    if (targetEmotion === '焦虑') {
      reframes.push('身体紧张是准备状态，不是威胁信号');
      reframes.push('适度唤醒有助于表现 (耶克斯 - 多德森定律)');
    }
    
    if (targetEmotion === '愤怒') {
      reframes.push('愤怒提示边界被侵犯，可转化为建设性行动');
      reframes.push('愤怒能量可用于推动积极改变');
    }
    
    if (targetEmotion === '悲伤') {
      reframes.push('悲伤是自然的情绪过程，允许自己感受');
      reframes.push('悲伤提示失去的价值，连接深层需求');
    }
    
    return reframes;
  }

  /**
   * 动态系统情绪追踪
   */
  trackEmotionDynamics(context) {
    const { timeSeries = [], context: situationContext = '' } = context;
    
    if (timeSeries.length < 3) {
      return {
        error: '需要至少 3 个时间点的数据',
        minRequired: 3,
        provided: timeSeries.length
      };
    }
    
    // 1. 识别吸引子
    const attractor = this._identifyAttractorFromTimeSeries(timeSeries);
    
    // 2. 相空间分析
    const phaseSpaceAnalysis = this._analyzePhaseSpace(timeSeries);
    
    // 3. 干预时机
    const interventionTiming = this._determineInterventionTiming(
      attractor,
      phaseSpaceAnalysis
    );
    
    // 4. 分岔风险评估
    const bifurcationRisk = this._assessBifurcationRisk(timeSeries);
    
    return {
      identifiedAttractor: attractor.name,
      attractorStability: attractor.stability,
      phaseSpaceAnalysis,
      interventionTiming,
      bifurcationRisk,
      timeSeriesLength: timeSeries.length,
      context: situationContext
    };
  }

  _identifyAttractorFromTimeSeries(timeSeries) {
    // 基于时间序列模式识别吸引子
    const valences = timeSeries.map(p => p.valence);
    const arousals = timeSeries.map(p => p.arousal);
    
    const avgValence = valences.reduce((a, b) => a + b, 0) / valences.length;
    const avgArousal = arousals.reduce((a, b) => a + b, 0) / arousals.length;
    
    // 计算变异性 (标准差近似)
    const valenceVar = valences.reduce((sum, v) => sum + Math.pow(v - avgValence, 2), 0) / valences.length;
    
    // 吸引子分类
    let name = '未识别模式';
    let stability = 0.5;
    
    if (avgValence < -0.3 && avgArousal > 0.6) {
      name = '焦虑 - 回避循环';
      stability = 0.7;
    } else if (avgValence < -0.3 && avgArousal < 0.4) {
      name = '悲伤 - 退缩循环';
      stability = 0.65;
    } else if (avgValence > 0.3 && avgArousal > 0.5) {
      name = '积极 - 参与循环';
      stability = 0.6;
    } else if (valenceVar < 0.05) {
      name = '稳定基线';
      stability = 0.85;
    }
    
    return { name, stability };
  }

  _analyzePhaseSpace(timeSeries) {
    const lastPoint = timeSeries[timeSeries.length - 1];
    const prevPoint = timeSeries[timeSeries.length - 2];
    
    const valenceChange = lastPoint.valence - prevPoint.valence;
    const arousalChange = lastPoint.arousal - prevPoint.arousal;
    
    let currentPhase = '稳定';
    let trajectory = '维持';
    
    if (valenceChange < -0.1) {
      currentPhase = '情绪下降';
      trajectory = '向负面发展';
    } else if (valenceChange > 0.1) {
      currentPhase = '情绪上升';
      trajectory = '向正面发展';
    }
    
    if (arousalChange > 0.1) {
      trajectory += ' + 唤醒增加';
    } else if (arousalChange < -0.1) {
      trajectory += ' + 唤醒降低';
    }
    
    return {
      currentPhase,
      trajectory,
      predictedNextState: {
        valence: lastPoint.valence + (valenceChange * 0.5),
        arousal: lastPoint.arousal + (arousalChange * 0.5)
      }
    };
  }

  _determineInterventionTiming(attractor, phaseSpaceAnalysis) {
    const stability = attractor.stability;
    
    // 在 attractor 边缘干预效果最佳
    const optimalWindow = stability < 0.5 ? '现在' :
                          stability < 0.7 ? '尽快' :
                          '可择机';
    
    const rationale = stability < 0.5 ? 
      '处于 attractor 边缘，干预效果最佳' :
      stability < 0.7 ?
      'attractor 稳定性中等，干预可能有效' :
      'attractor 稳定，需要更强干预';
    
    const leveragePoints = [];
    if (stability < 0.7) {
      leveragePoints.push('认知重构');
      leveragePoints.push('身体调节');
    }
    if (phaseSpaceAnalysis.trajectory.includes('负面')) {
      leveragePoints.push('环境改变');
    }
    
    return {
      optimalWindow,
      rationale,
      leveragePoints
    };
  }

  _assessBifurcationRisk(timeSeries) {
    // 检测剧烈变化
    const changes = [];
    for (let i = 1; i < timeSeries.length; i++) {
      const change = Math.abs(timeSeries[i].valence - timeSeries[i-1].valence) +
                    Math.abs(timeSeries[i].arousal - timeSeries[i-1].arousal);
      changes.push(change);
    }
    
    const maxChange = Math.max(...changes);
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    
    const detected = maxChange > 0.5;
    
    return {
      detected,
      warning: detected ? 
        '检测到剧烈情绪波动，可能存在相变风险' :
        '当前无相变风险',
      maxChange: Math.round(maxChange * 100) / 100,
      avgChange: Math.round(avgChange * 100) / 100
    };
  }

  /**
   * 具身自我觉察练习生成器
   */
  generateEmbodiedAwarenessPractice(context) {
    const {
      focusArea = 'general',
      timeAvailable = '15 分钟',
      environment = '安静室内'
    } = context;
    
    return {
      name: '具身预测觉察练习',
      nameEn: 'Embodied Predictive Awareness Practice',
      duration: timeAvailable,
      focusArea,
      environment,
      steps: [
        {
          step: 1,
          name: '身体锚定',
          nameEn: 'Body Anchoring',
          duration: '3 分钟',
          instruction: '扫描身体感受，注意紧张、温度、重量、触感等感觉。不加评判，只是觉察。',
          instructionEn: 'Scan bodily sensations, notice tension, temperature, weight, touch. Observe without judgment.',
          rationale: '建立身体觉察基线，激活内感受意识',
          rationaleEn: 'Establish body awareness baseline, activate interoceptive awareness'
        },
        {
          step: 2,
          name: '识别自动预测',
          nameEn: 'Identify Automatic Predictions',
          duration: '3 分钟',
          instruction: '注意自动出现的预期想法："会发生什么？""我会有什么感受？"这些是预测，不是事实。',
          instructionEn: 'Notice automatic expectations: "What will happen?" "How will I feel?" These are predictions, not facts.',
          rationale: '识别预测生成过程，培养元认知觉察',
          rationaleEn: 'Identify prediction generation process, cultivate meta-cognitive awareness'
        },
        {
          step: 3,
          name: '身体 - 预测关联',
          nameEn: 'Body-Prediction Connection',
          duration: '3 分钟',
          instruction: '探索身体感受与预测想法的关联。预测出现时，身体有什么变化？',
          instructionEn: 'Explore connection between bodily sensations and predictive thoughts. What changes in the body when predictions arise?',
          rationale: '理解具身预测机制，身体是预测的载体',
          rationaleEn: 'Understand embodied prediction mechanism, body carries predictions'
        },
        {
          step: 4,
          name: '检验预测证据',
          nameEn: 'Examine Prediction Evidence',
          duration: '3 分钟',
          instruction: '寻找支持/反对自动预测的证据。过去类似情况的结果如何？',
          instructionEn: 'Find evidence for/against automatic predictions. What happened in similar past situations?',
          rationale: '促进预测模型更新，减少预测误差',
          rationaleEn: 'Facilitate prediction model updating, reduce prediction error'
        },
        {
          step: 5,
          name: '具身重构',
          nameEn: 'Embodied Reframing',
          duration: timeAvailable === '15 分钟' ? '3 分钟' : '2-3 分钟',
          instruction: '通过身体行动 (调整姿势/深呼吸/温和伸展) 支持更平衡的预测。感受身体变化如何影响情绪。',
          instructionEn: 'Use bodily actions (posture adjustment/deep breathing/gentle stretching) to support more balanced predictions. Feel how body changes affect emotions.',
          rationale: '整合身体与认知，实现具身情绪调节',
          rationaleEn: 'Integrate body and cognition, achieve embodied emotion regulation'
        }
      ],
      benefits: [
        '增强身体 - 情绪连接觉察',
        '识别自动化预测模式',
        '提升情绪调节灵活性',
        '减少预测误差困扰',
        '培养具身自我意识'
      ],
      benefitsEn: [
        'Enhance body-emotion connection awareness',
        'Identify automatic prediction patterns',
        'Improve emotion regulation flexibility',
        'Reduce prediction error distress',
        'Cultivate embodied self-awareness'
      ],
      science: '基于 SEP 具身认知理论、预测加工理论、情绪理论三大传统整合',
      scienceEn: 'Based on SEP Embodied Cognition, Predictive Processing, and Emotion Theory integration',
      references: [
        'SEP: Embodied Cognition',
        'SEP: Predictive Processing',
        'SEP: Emotion',
        'Friston, K. (2010). The free-energy principle',
        'Gallagher, S. (2005). How the Body Shapes the Mind'
      ]
    };
  }

  /**
   * 完整流程
   */
  fullEmbodiedPredictiveProcess(context) {
    const {
      bodyState,
      environment,
      socialContext,
      pastModels,
      actualEmotion
    } = context;
    
    // 1. 具身预测生成
    const prediction = this.generateEmbodiedPrediction({
      bodyState,
      environment,
      socialContext,
      pastModels
    });
    
    // 2. 身体 - 环境耦合评估
    const coupling = this.assessBodyEnvironmentCoupling(
      bodyState,
      environment.demands || {}
    );
    
    // 3. 预测误差计算 (如果有实际情绪)
    let errorAnalysis = null;
    if (actualEmotion) {
      errorAnalysis = this.calculatePredictionError(prediction, actualEmotion);
    }
    
    // 4. 干预建议
    const intervention = this.generateEmbodiedInterventions({
      targetEmotion: prediction.predictedEmotion,
      bodyState,
      environment,
      timeAvailable: '10 分钟'
    });
    
    // 5. 练习生成
    const practice = this.generateEmbodiedAwarenessPractice({
      focusArea: prediction.predictedEmotion,
      timeAvailable: '15 分钟',
      environment: environment.location || '室内'
    });
    
    return {
      version: this.version,
      prediction,
      coupling,
      errorAnalysis,
      intervention,
      practice,
      summary: this._generateProcessSummary(prediction, coupling, errorAnalysis)
    };
  }

  /**
   * 预测误差计算
   */
  calculatePredictionError(prediction, actualEmotion) {
    const actual = typeof actualEmotion === 'string' ? 
      { emotion: actualEmotion, intensity: 5 } : actualEmotion;
    
    // 情绪类别误差
    const emotionMatch = prediction.predictedEmotion === actual.emotion ? 1 : 0;
    const emotionError = 1 - emotionMatch;
    
    // 强度误差
    const intensityError = Math.abs(prediction.predictedIntensity - (actual.intensity || 5)) / 10;
    
    // 总误差
    const totalError = (emotionError * 0.6) + (intensityError * 0.4);
    
    // 解释
    let interpretation = '';
    if (totalError < this.config.errorThresholds.low) {
      interpretation = '预测准确 - 模型校准良好';
    } else if (totalError < this.config.errorThresholds.medium) {
      interpretation = '预测中等误差 - 需要学习调整';
    } else {
      interpretation = '预测高误差 - 需要显著更新模型';
    }
    
    return {
      totalError: Math.round(totalError * 100) / 100,
      emotionError,
      intensityError: Math.round(intensityError * 100) / 100,
      interpretation,
      prediction: prediction.predictedEmotion,
      actual: actual.emotion
    };
  }

  _generateProcessSummary(prediction, coupling, errorAnalysis) {
    const summary = [];
    
    summary.push(`预测情绪：${prediction.predictedEmotion} (强度${prediction.predictedIntensity}/10)`);
    summary.push(`身体 - 环境耦合：${coupling.interpretation}`);
    
    if (errorAnalysis) {
      summary.push(`预测误差：${errorAnalysis.interpretation}`);
    }
    
    if (coupling.mismatchDetected) {
      summary.push(`⚠ 检测到${coupling.mismatches.length}项不匹配，建议关注`);
    }
    
    return summary;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      nameCn: this.nameCn,
      version: this.version,
      description: '基于 SEP 具身认知理论 + 预测加工理论的情绪模块',
      descriptionEn: 'Emotion module based on SEP Embodied Cognition + Predictive Processing',
      capabilities: [
        'generateEmbodiedPrediction - 具身预测生成',
        'assessBodyEnvironmentCoupling - 身体 - 环境耦合评估',
        'predictCollectiveEmotion - 集体情绪预测',
        'generateEmbodiedInterventions - 具身干预生成',
        'trackEmotionDynamics - 动态系统情绪追踪',
        'generateEmbodiedAwarenessPractice - 具身自我觉察练习',
        'fullEmbodiedPredictiveProcess - 完整流程',
        'calculatePredictionError - 预测误差计算'
      ],
      theoreticalBasis: [
        'SEP: Embodied Cognition',
        'SEP: Predictive Processing',
        'SEP: Emotion',
        'SEP: Collective Intentionality'
      ]
    };
  }
}

module.exports = EmbodiedPredictiveEmotionModule;
