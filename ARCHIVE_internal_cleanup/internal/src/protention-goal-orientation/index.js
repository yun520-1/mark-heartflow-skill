/**
 * 预期与目标导向模块 (Protention & Goal Orientation)
 * 
 * 基于 Husserl 内时间意识现象学与 SEP 能动性理论
 * 
 * 核心理论：
 * - Husserl Protention: 前摄性预期结构
 * - SEP Agency: 目标导向行动与实践推理
 * - Goal-Directed Behavior: 目标设定与追求心理学
 * 
 * 可操作技术：
 * - 预期结构评估 (4 维度)
 * - 目标导向行动分析
 * - 实践推理支持
 * - 4 个核心练习技术
 * 
 * @module protention-goal-orientation
 * @version 4.7.0
 */

const ProtentionGoalOrientation = {
  /**
   * 模块元信息
   */
  meta: {
    name: '预期与目标导向',
    version: '4.7.0',
    source: 'Husserl Protention + SEP Agency + Goal Psychology (v4.7.0)',
    description: '基于现象学预期理论与能动性理论的目标导向模块'
  },

  /**
   * 预期结构评估 (Protention Structure Assessment)
   * 4 维度评估框架
   */
  protentionAssessment: {
    /**
     * 维度 1: 预期清晰度 (Protention Clarity)
     * 评估个体对未来预期的清晰和具体程度
     */
    clarity: {
      name: '预期清晰度',
      description: '对未来预期的清晰度和具体程度',
      
      levels: {
        level1: {
          name: '模糊',
          score: 1,
          characteristics: [
            '对未来的想象非常模糊',
            '难以描述具体的未来状态',
            '预期缺乏细节和生动性',
            '可能反映焦虑、回避或想象力受限'
          ],
          interventions: [
            '具体化练习：将模糊愿望转化为具体画面',
            '感官细节添加：为未来想象添加视觉/听觉/触觉细节',
            '未来自我画像：详细描述未来自我的外貌、环境、活动'
          ]
        },
        level2: {
          name: '一般',
          score: 2,
          characteristics: [
            '对未来有大致的方向感',
            '能描述一些未来目标但不够具体',
            '预期有一定细节但不够生动',
            '预期清晰度有提升空间'
          ],
          interventions: [
            '目标细化：将大目标分解为具体的小目标',
            '场景可视化：为每个目标创建具体的实现场景',
            '情感连接：为预期目标添加情感意义'
          ]
        },
        level3: {
          name: '清晰',
          score: 3,
          characteristics: [
            '能清晰描述未来 1-3 年的状态',
            '目标具体且有明确的衡量标准',
            '预期画面较为生动',
            '预期支持有效的规划'
          ],
          interventions: [
            '深化练习：为长期目标 (5-10 年) 创建清晰画面',
            '多场景规划：为不同可能性创建预期',
            '预期更新：定期审视和更新预期'
          ]
        },
        level4: {
          name: '非常清晰',
          score: 4,
          characteristics: [
            '对未来有非常清晰和具体的想象',
            '目标画面生动且情感丰富',
            '能想象多种可能的未来路径',
            '预期是强大的动机来源'
          ],
          interventions: [
            '预期分享：与他人分享你的未来愿景',
            '预期行动化：将预期转化为具体行动计划',
            '预期锚定：创建视觉提示强化预期'
          ]
        }
      },

      assess: function(userInput) {
        const vagueKeywords = ['可能', '也许', '大概', '说不清', '模糊', '不知道', '看情况'];
        const clearKeywords = ['明确', '清晰', '具体', '一定', '确定', '想要', '希望'];
        const detailKeywords = ['具体', '详细', '比如', '例如', '包括', '特别是'];

        let vagueScore = 0;
        let clearScore = 0;
        let detailScore = 0;

        vagueKeywords.forEach(kw => {
          if (userInput.includes(kw)) vagueScore += 1;
        });

        clearKeywords.forEach(kw => {
          if (userInput.includes(kw)) clearScore += 2;
        });

        detailKeywords.forEach(kw => {
          if (userInput.includes(kw)) detailScore += 1;
        });

        const netScore = Math.max(1, clearScore + detailScore - vagueScore);
        let level = '';
        if (netScore <= 2) level = '模糊';
        else if (netScore <= 4) level = '一般';
        else if (netScore <= 6) level = '清晰';
        else level = '非常清晰';

        return {
          score: Math.min(netScore, 4),
          level,
          breakdown: {
            clarity: clearScore,
            detail: detailScore,
            vagueness: vagueScore
          },
          characteristics: this.levels['level' + Math.min(Math.round(netScore / 2), 4)].characteristics,
          interventions: this.levels['level' + Math.min(Math.round(netScore / 2), 4)].interventions
        };
      }
    },

    /**
     * 维度 2: 预期时间范围 (Protention Time Range)
     * 评估个体预期覆盖的时间跨度
     */
    timeRange: {
      name: '预期时间范围',
      description: '预期覆盖的时间跨度',
      
      assess: function(userInput) {
        const timeRanges = {
          'immediate': ['今天', '明天', '这几天', '本周', '下周'],
          'short': ['这个月', '下个月', '几周内', '一个月内'],
          'medium': ['今年', '明年', '一年内', '半年后', '几个月后'],
          'long': ['几年后', '3 年', '5 年', '10 年', '长期', '未来']
        };

        let maxRange = 0;

        Object.keys(timeRanges).forEach((range, index) => {
          if (timeRanges[range].some(kw => userInput.includes(kw))) {
            maxRange = index + 1;
          }
        });

        let level = '';
        if (maxRange <= 1) level = '即时 (天)';
        else if (maxRange <= 2) level = '短期 (周)';
        else if (maxRange <= 3) level = '中期 (月)';
        else level = '长期 (年)';

        return {
          score: maxRange,
          level,
          detectedRanges: Object.keys(timeRanges).filter((_, index) => 
            timeRanges[Object.keys(timeRanges)[index]].some(kw => userInput.includes(kw))
          )
        };
      }
    },

    /**
     * 维度 3: 预期灵活性 (Protention Flexibility)
     * 评估个体调整和更新预期的能力
     */
    flexibility: {
      name: '预期灵活性',
      description: '根据现实反馈调整和更新预期的能力',
      
      assess: function(userInput) {
        const flexibleKeywords = ['调整', '适应', '灵活', '改变', '更新', '修正', '如果', '可能'];
        const rigidKeywords = ['必须', '一定', '绝不', '只能', '没办法', '必须这样'];

        let flexibleScore = 0;
        let rigidScore = 0;

        flexibleKeywords.forEach(kw => {
          if (userInput.includes(kw)) flexibleScore += 2;
        });

        rigidKeywords.forEach(kw => {
          if (userInput.includes(kw)) rigidScore += 2;
        });

        const netScore = Math.max(1, 5 + flexibleScore - rigidScore);
        let level = '';
        if (netScore <= 2) level = '僵化';
        else if (netScore <= 3) level = '有限';
        else if (netScore <= 4) level = '良好';
        else level = '灵活';

        return {
          score: Math.min(netScore, 5),
          level,
          flexibilityIndicators: flexibleScore,
          rigidityIndicators: rigidScore
        };
      }
    },

    /**
     * 维度 4: 预期 - 现实校准 (Protention-Reality Calibration)
     * 评估预期与现实的匹配程度
     */
    calibration: {
      name: '预期 - 现实校准',
      description: '预期与现实的匹配和校准程度',
      
      assess: function(userInput) {
        const realisticKeywords = ['实际', '现实', '可行', '可能', '评估', '考虑'];
        const unrealisticKeywords = ['完美', '一定成功', '肯定', '绝对', '不可能失败'];
        const learningKeywords = ['学习', '调整', '反馈', '改进', '经验'];

        let realisticScore = 0;
        let unrealisticScore = 0;
        let learningScore = 0;

        realisticKeywords.forEach(kw => {
          if (userInput.includes(kw)) realisticScore += 2;
        });

        unrealisticKeywords.forEach(kw => {
          if (userInput.includes(kw)) unrealisticScore += 2;
        });

        learningKeywords.forEach(kw => {
          if (userInput.includes(kw)) learningScore += 2;
        });

        const netScore = realisticScore + learningScore - unrealisticScore;
        let level = '';
        if (netScore <= 2) level = '校准不足';
        else if (netScore <= 4) level = '部分校准';
        else if (netScore <= 6) level = '良好校准';
        else level = '优秀校准';

        return {
          score: Math.max(1, Math.min(netScore, 5)),
          level,
          breakdown: {
            realism: realisticScore,
            learning: learningScore,
            unrealistic: unrealisticScore
          }
        };
      }
    },

    /**
     * 综合评估函数
     */
    comprehensive: function(userInput) {
      const clarity = this.clarity.assess(userInput);
      const timeRange = this.timeRange.assess(userInput);
      const flexibility = this.flexibility.assess(userInput);
      const calibration = this.calibration.assess(userInput);

      const overallScore = (clarity.score + timeRange.score + flexibility.score + calibration.score) / 4;
      let overallLevel = '';
      if (overallScore <= 1.5) overallLevel = '预期结构弱';
      else if (overallScore <= 2.5) overallLevel = '预期结构中等';
      else if (overallScore <= 3.5) overallLevel = '预期结构良好';
      else overallLevel = '预期结构优秀';

      return {
        clarity,
        timeRange,
        flexibility,
        calibration,
        overallScore,
        overallLevel
      };
    }
  },

  /**
   * 目标导向行动分析 (Goal-Directed Action Analysis)
   */
  goalDirectedAnalysis: {
    /**
     * 目标清晰度评估
     */
    goalClarity: {
      name: '目标清晰度',
      
      assess: function(userInput) {
        const smartCriteria = {
          specific: ['具体', '明确', '清晰', '详细'],
          measurable: ['衡量', '量化', '数字', '百分比', '次数'],
          achievable: ['可行', '实际', '可以', '能够'],
          relevant: ['重要', '价值', '意义', '相关'],
          timeBound: ['时间', '截止日期', '之前', '天内', '月前']
        };

        const scores = {};
        let totalScore = 0;

        Object.keys(smartCriteria).forEach(criterion => {
          let score = 0;
          smartCriteria[criterion].forEach(kw => {
            if (userInput.includes(kw)) score += 1;
          });
          scores[criterion] = Math.min(score, 3);
          totalScore += scores[criterion];
        });

        const level = totalScore >= 12 ? 'SMART' : totalScore >= 8 ? '较清晰' : totalScore >= 4 ? '模糊' : '不清晰';

        return {
          level,
          score: totalScore,
          breakdown: scores
        };
      }
    },

    /**
     * 手段 - 目的推理分析
     */
    meansEndReasoning: {
      name: '手段 - 目的推理',
      
      assess: function(userInput) {
        const meansKeywords = ['通过', '用', '方式', '方法', '手段', '步骤', '计划'];
        const endKeywords = ['为了', '以便', '目的是', '目标是', '想要'];
        const connectionKeywords = ['可以', '能够', '会', '导致', '实现'];

        let meansScore = 0;
        let endScore = 0;
        let connectionScore = 0;

        meansKeywords.forEach(kw => {
          if (userInput.includes(kw)) meansScore += 1;
        });

        endKeywords.forEach(kw => {
          if (userInput.includes(kw)) endScore += 2;
        });

        connectionKeywords.forEach(kw => {
          if (userInput.includes(kw)) connectionScore += 1;
        });

        const totalScore = meansScore + endScore + connectionScore;
        let level = '';
        if (totalScore >= 8) level = '清晰';
        else if (totalScore >= 4) level = '部分清晰';
        else level = '模糊';

        return {
          level,
          score: totalScore,
          breakdown: {
            means: meansScore,
            end: endScore,
            connection: connectionScore
          }
        };
      }
    },

    /**
     * 目标承诺强度评估
     */
    goalCommitment: {
      name: '目标承诺强度',
      
      assess: function(userInput) {
        const commitmentKeywords = ['一定', '必须', '承诺', '决心', '坚持', '绝不放弃'];
        const intentionKeywords = ['想要', '希望', '打算', '计划', '考虑'];
        const weakKeywords = ['可能', '也许', '试试看', '有空', '再说'];

        let commitmentScore = 0;
        let intentionScore = 0;
        let weakScore = 0;

        commitmentKeywords.forEach(kw => {
          if (userInput.includes(kw)) commitmentScore += 3;
        });

        intentionKeywords.forEach(kw => {
          if (userInput.includes(kw)) intentionScore += 1;
        });

        weakKeywords.forEach(kw => {
          if (userInput.includes(kw)) weakScore += 2;
        });

        const netScore = commitmentScore + intentionScore - weakScore;
        let level = '';
        if (netScore >= 8) level = '强承诺';
        else if (netScore >= 4) level = '中等承诺';
        else if (netScore >= 1) level = '弱承诺';
        else level = '承诺不足';

        return {
          level,
          score: Math.max(1, netScore + 5)
        };
      }
    },

    /**
     * 目标冲突检测
     */
    goalConflict: {
      name: '目标冲突检测',
      
      detect: function(userInput) {
        const conflictKeywords = ['但是', '可是', '然而', '却', '矛盾', '冲突', '难以兼顾'];
        const competitionKeywords = ['时间不够', '精力有限', '资源不足', '顾此失彼'];

        let conflictScore = 0;
        let competitionScore = 0;

        conflictKeywords.forEach(kw => {
          if (userInput.includes(kw)) conflictScore += 2;
        });

        competitionKeywords.forEach(kw => {
          if (userInput.includes(kw)) competitionScore += 3;
        });

        const hasConflict = conflictScore >= 2 || competitionScore >= 3;
        let level = '';
        if (conflictScore + competitionScore >= 6) level = '严重冲突';
        else if (conflictScore + competitionScore >= 3) level = '中等冲突';
        else if (hasConflict) level = '轻微冲突';
        else level = '无明显冲突';

        return {
          hasConflict,
          level,
          score: conflictScore + competitionScore,
          breakdown: {
            goalConflict: conflictScore,
            resourceCompetition: competitionScore
          }
        };
      }
    },

    /**
     * 综合分析函数
     */
    comprehensive: function(userInput) {
      const goalClarity = this.goalClarity.assess(userInput);
      const meansEnd = this.meansEndReasoning.assess(userInput);
      const commitment = this.goalCommitment.assess(userInput);
      const conflict = this.goalConflict.detect(userInput);

      const overallScore = (goalClarity.score + meansEnd.score + commitment.score) / 3;
      let overallLevel = '';
      if (overallScore >= 10) overallLevel = '目标导向强';
      else if (overallScore >= 6) overallLevel = '目标导向中等';
      else overallLevel = '目标导向弱';

      return {
        goalClarity,
        meansEnd,
        commitment,
        conflict,
        overallScore,
        overallLevel
      };
    }
  },

  /**
   * 实践推理支持 (Practical Reasoning Support)
   * 基于亚里士多德实践三段论
   */
  practicalReasoning: {
    /**
     * 构建实践三段论
     */
    buildPracticalSyllogism: function(goal, currentSituation) {
      // 大前提：目标/欲望
      const majorPremise = {
        type: 'goal',
        content: goal,
        analysis: this._analyzeGoal(goal)
      };

      // 小前提：现状/信念
      const minorPremise = {
        type: 'belief',
        content: currentSituation,
        analysis: this._analyzeSituation(currentSituation)
      };

      // 结论：行动
      const conclusion = this._deriveAction(majorPremise, minorPremise);

      return {
        majorPremise,
        minorPremise,
        conclusion,
        reasoning: this._explainReasoning(majorPremise, minorPremise, conclusion)
      };
    },

    _analyzeGoal: function(goal) {
      const analysis = {
        clarity: 0,
        feasibility: 0,
        importance: 0,
        timeBound: false
      };

      if (goal.length > 10 && goal.length < 100) analysis.clarity = 2;
      else if (goal.length > 5) analysis.clarity = 1;

      const feasibilityKeywords = ['可以', '能够', '可能', '可行'];
      const importanceKeywords = ['重要', '必须', '想要', '希望'];
      const timeKeywords = ['今天', '本周', '本月', '今年', '之前', '天内'];

      feasibilityKeywords.forEach(kw => {
        if (goal.includes(kw)) analysis.feasibility = 2;
      });

      importanceKeywords.forEach(kw => {
        if (goal.includes(kw)) analysis.importance = 2;
      });

      timeKeywords.forEach(kw => {
        if (goal.includes(kw)) analysis.timeBound = true;
      });

      return analysis;
    },

    _analyzeSituation: function(situation) {
      const analysis = {
        resources: [],
        obstacles: [],
        opportunities: []
      };

      const resourceKeywords = ['有', '具备', '可以', '能够', '资源', '能力', '时间', '支持'];
      const obstacleKeywords = ['但是', '困难', '问题', '障碍', '不足', '缺乏', '限制'];
      const opportunityKeywords = ['机会', '可能', '如果', '可以试试', '考虑'];

      resourceKeywords.forEach(kw => {
        if (situation.includes(kw)) analysis.resources.push(kw);
      });

      obstacleKeywords.forEach(kw => {
        if (situation.includes(kw)) analysis.obstacles.push(kw);
      });

      opportunityKeywords.forEach(kw => {
        if (situation.includes(kw)) analysis.opportunities.push(kw);
      });

      return analysis;
    },

    _deriveAction: function(majorPremise, minorPremise) {
      const actions = [];

      // 基于目标和现状推导行动
      if (minorPremise.analysis.obstacles.length > 0) {
        actions.push({
          type: 'obstacleRemoval',
          description: '识别并解决主要障碍',
          priority: '高'
        });
      }

      if (minorPremise.analysis.resources.length > 0) {
        actions.push({
          type: 'resourceUtilization',
          description: '充分利用现有资源',
          priority: '中'
        });
      }

      if (minorPremise.analysis.opportunities.length > 0) {
        actions.push({
          type: 'opportunityCapture',
          description: '抓住可用机会',
          priority: '中'
        });
      }

      // 添加具体的第一步行动
      actions.push({
        type: 'firstStep',
        description: '确定并执行最小的第一步行动',
        priority: '高'
      });

      return {
        actions,
        recommendedAction: actions[0],
        confidence: this._calculateConfidence(majorPremise, minorPremise)
      };
    },

    _calculateConfidence: function(majorPremise, minorPremise) {
      let confidence = 50;

      // 目标清晰度增加信心
      confidence += majorPremise.analysis.clarity * 10;
      confidence += majorPremise.analysis.feasibility * 10;
      confidence += majorPremise.analysis.importance * 10;
      if (majorPremise.analysis.timeBound) confidence += 10;

      // 障碍减少信心
      confidence -= minorPremise.analysis.obstacles.length * 5;

      // 资源增加信心
      confidence += minorPremise.analysis.resources.length * 5;

      return Math.min(Math.max(confidence, 0), 100);
    },

    _explainReasoning: function(majorPremise, minorPremise, conclusion) {
      const explanation = [];

      explanation.push('实践推理过程:');
      explanation.push('');
      explanation.push(`大前提 (目标): ${majorPremise.content}`);
      explanation.push(`  - 清晰度：${majorPremise.analysis.clarity}/2`);
      explanation.push(`  - 可行性：${majorPremise.analysis.feasibility}/2`);
      explanation.push(`  - 重要性：${majorPremise.analysis.importance}/2`);
      explanation.push(`  - 时间限定：${majorPremise.analysis.timeBound ? '是' : '否'}`);
      explanation.push('');
      explanation.push(`小前提 (现状): ${minorPremise.content}`);
      explanation.push(`  - 可用资源：${minorPremise.analysis.resources.length} 个`);
      explanation.push(`  - 主要障碍：${minorPremise.analysis.obstacles.length} 个`);
      explanation.push(`  - 潜在机会：${minorPremise.analysis.opportunities.length} 个`);
      explanation.push('');
      explanation.push(`结论 (推荐行动): ${conclusion.recommendedAction.description}`);
      explanation.push(`  - 行动类型：${conclusion.recommendedAction.type}`);
      explanation.push(`  - 优先级：${conclusion.recommendedAction.priority}`);
      explanation.push(`  - 推理信心：${conclusion.confidence}%`);

      return explanation.join('\n');
    },

    /**
     * 生成替代方案
     */
    generateAlternatives: function(goal, situation, initialAction) {
      const alternatives = [];

      // 替代方案 1: 简化版本
      alternatives.push({
        name: '简化方案',
        description: '降低目标难度或范围，更容易启动',
        action: `将"${goal}"简化为更小的第一步`,
        pros: ['更容易开始', '降低心理阻力', '快速获得成就感'],
        cons: ['进展可能较慢', '可能需要多次迭代']
      });

      // 替代方案 2: 分阶段方案
      alternatives.push({
        name: '分阶段方案',
        description: '将目标分解为多个阶段，逐步推进',
        action: '制定 3-5 个阶段，每个阶段有明确的里程碑',
        pros: ['清晰的路径感', '便于监控进展', '可调整性强'],
        cons: ['需要更多规划时间', '可能过于复杂']
      });

      // 替代方案 3: 支持寻求方案
      alternatives.push({
        name: '支持寻求方案',
        description: '寻求外部支持或合作',
        action: '识别可以寻求帮助的资源或人',
        pros: ['获得额外资源', '增加坚持可能性', '学习他人经验'],
        cons: ['需要协调他人时间', '可能降低自主感']
      });

      // 替代方案 4: 环境优化方案
      alternatives.push({
        name: '环境优化方案',
        description: '改变环境以减少阻力和增加提示',
        action: '优化物理和社会环境以支持目标追求',
        pros: ['减少意志力消耗', '自动化支持行为', '长期可持续'],
        cons: ['需要前期投入', '环境改变可能受限']
      });

      return alternatives;
    },

    /**
     * 决策时间优化
     */
    optimizeDecisionTime: function(decisionComplexity, urgency, importance) {
      // 基于决策复杂度和紧急性推荐决策时间
      let recommendedTime = '';
      let reasoning = '';

      if (urgency === '高' && importance === '高') {
        recommendedTime = '立即决策 (10-30 分钟内)';
        reasoning = '高紧急高重要：需要快速但审慎的决策';
      } else if (urgency === '高' && importance === '中') {
        recommendedTime = '快速决策 (1 小时内)';
        reasoning = '高紧急中重要：快速决策，可接受一定风险';
      } else if (urgency === '中' && importance === '高') {
        recommendedTime = '审慎决策 (1-24 小时)';
        reasoning = '中紧急高重要：花时间收集信息和分析';
      } else if (urgency === '低' && importance === '高') {
        recommendedTime = '深度决策 (1-7 天)';
        reasoning = '低紧急高重要：充分思考、咨询、实验';
      } else {
        recommendedTime = '灵活决策 (根据情况)';
        reasoning = '低重要性：不必过度分析，快速决定即可';
      }

      return {
        recommendedTime,
        reasoning,
        factors: {
          complexity: decisionComplexity,
          urgency,
          importance
        }
      };
    }
  },

  /**
   * 预期与目标导向干预练习 (Interventions)
   * 4 个核心练习技术
   */
  interventions: {
    /**
     * 练习 1: 预期清晰度训练
     * 时长：20-30 分钟
     */
    protentionClarityTraining: {
      name: '预期清晰度训练',
      duration: '20-30 分钟',
      goal: '提升对未来预期的清晰度和具体程度',
      steps: [
        {
          step: 1,
          name: '模糊预期识别',
          duration: '5 分钟',
          instructions: [
            '写下你对未来的一个模糊预期（如"我想变得更好"）',
            '识别这个预期中模糊的词汇和概念',
            '问自己：这个预期具体是什么意思？'
          ]
        },
        {
          step: 2,
          name: '具体化转换',
          duration: '10 分钟',
          instructions: [
            '将模糊预期转换为具体的、可衡量的描述',
            '添加感官细节：你会看到什么、听到什么、感受到什么？',
            '添加时间和地点：什么时候？在哪里？',
            '添加行为：你会在做什么？'
          ]
        },
        {
          step: 3,
          name: '生动性增强',
          duration: '5-10 分钟',
          instructions: [
            '闭上眼睛，想象具体的未来场景',
            '尽可能生动地体验这个场景',
            '注意场景中的情绪感受',
            '锚定这份感受作为动机来源'
          ]
        },
        {
          step: 4,
          name: '预期记录与强化',
          duration: '5 分钟',
          instructions: [
            '将具体化的预期写下来',
            '创建视觉提示（图片、愿景板等）',
            '设定定期回顾的时间',
            '承诺每天花 1 分钟回顾这个预期'
          ]
        }
      ],
      expectedOutcomes: [
        '预期清晰度显著提升',
        '增强动机和行动力',
        '提高目标实现可能性',
        '减少模糊焦虑'
      ]
    },

    /**
     * 练习 2: 目标层级地图
     * 时长：35-45 分钟
     */
    goalHierarchyMapping: {
      name: '目标层级地图',
      duration: '35-45 分钟',
      goal: '建立清晰的目标层级结构，连接愿景与行动',
      steps: [
        {
          step: 1,
          name: '愿景层定义',
          duration: '10 分钟',
          instructions: [
            '思考 5-10 年后你希望成为什么样的人',
            '写下 3-5 个核心人生愿景',
            '这些愿景应该反映你的核心价值观'
          ]
        },
        {
          step: 2,
          name: '战略目标层',
          duration: '10 分钟',
          instructions: [
            '为每个愿景，设定 3-5 年内的战略目标',
            '目标应该是具体的、可衡量的',
            '确保战略目标与愿景对齐'
          ]
        },
        {
          step: 3,
          name: '战术目标层',
          duration: '10 分钟',
          instructions: [
            '为每个战略目标，设定年度目标',
            '进一步分解为季度目标',
            '确保下层目标支持上层目标'
          ]
        },
        {
          step: 4,
          name: '行动层规划',
          duration: '5-10 分钟',
          instructions: [
            '为当前季度目标，设定本周行动',
            '确定今天可以做的第一步',
            '创建目标层级地图的可视化'
          ]
        },
        {
          step: 5,
          name: '整合与承诺',
          duration: '5 分钟',
          instructions: [
            '整体审视目标层级地图',
            '检查各层级的对齐度',
            '承诺执行今天的第一个行动',
            '设定每周回顾的时间'
          ]
        }
      ],
      expectedOutcomes: [
        '清晰的目标层级结构',
        '愿景与日常行动的连接',
        '增强行动的目的性和方向感',
        '提高目标实现的可能性'
      ]
    },

    /**
     * 练习 3: 手段 - 目的分析
     * 时长：25-35 分钟
     */
    meansEndAnalysis: {
      name: '手段 - 目的分析',
      duration: '25-35 分钟',
      goal: '清晰分析目标与手段之间的逻辑关系',
      steps: [
        {
          step: 1,
          name: '目标定义',
          duration: '5 分钟',
          instructions: [
            '清晰定义你想要达成的目标',
            '确保目标符合 SMART 原则',
            '写下目标的重要性和意义'
          ]
        },
        {
          step: 2,
          name: '现状评估',
          duration: '5-10 分钟',
          instructions: [
            '诚实评估当前的状态',
            '列出可用的资源和优势',
            '识别主要的障碍和挑战'
          ]
        },
        {
          step: 3,
          name: '手段生成',
          duration: '10 分钟',
          instructions: [
            '头脑风暴所有可能帮助你达成目标的手段',
            '不评判，先尽可能多地列出',
            '分类整理这些手段（资源利用、障碍克服、机会捕捉）'
          ]
        },
        {
          step: 4,
          name: '手段评估与选择',
          duration: '5-10 分钟',
          instructions: [
            '评估每个手段的可行性和效果',
            '选择 3-5 个最有效的手段',
            '为每个手段制定具体的行动计划'
          ]
        }
      ],
      expectedOutcomes: [
        '清晰的目标 - 手段逻辑',
        '可行的行动计划',
        '增强行动的信心',
        '减少盲目行动'
      ]
    },

    /**
     * 练习 4: 实践推理日志
     * 时长：15-20 分钟/天
     */
    practicalReasoningJournal: {
      name: '实践推理日志',
      duration: '15-20 分钟/天',
      goal: '培养日常实践推理能力，提高决策质量',
      steps: [
        {
          step: 1,
          name: '目标/欲望记录',
          duration: '3-5 分钟',
          instructions: [
            '记录今天最重要的目标或欲望',
            '描述为什么这个目标对你重要',
            '评估目标的清晰度和可行性'
          ]
        },
        {
          step: 2,
          name: '现状/信念记录',
          duration: '3-5 分钟',
          instructions: [
            '记录当前的情况和可用资源',
            '识别可能的障碍',
            '写下你对情况的信念和假设'
          ]
        },
        {
          step: 3,
          name: '行动推导',
          duration: '5 分钟',
          instructions: [
            '基于目标和现状，推导应该采取的行动',
            '写下推理过程',
            '确定第一步行动'
          ]
        },
        {
          step: 4,
          name: '反思与校准',
          duration: '5 分钟',
          instructions: [
            '回顾昨天的行动和结果',
            '评估推理的准确性',
            '调整信念和策略'
          ]
        }
      ],
      expectedOutcomes: [
        '提高实践推理能力',
        '增强决策质量',
        '培养反思习惯',
        '加速学习和成长'
      ]
    }
  },

  /**
   * 主分析函数
   */
  analyze: function(userInput) {
    const protentionAssessment = this.protentionAssessment.comprehensive(userInput);
    const goalAnalysis = this.goalDirectedAnalysis.comprehensive(userInput);
    
    // 生成干预推荐
    const recommendations = this._generateRecommendations(protentionAssessment, goalAnalysis);

    return {
      protention: protentionAssessment,
      goalDirected: goalAnalysis,
      recommendations,
      summary: this._generateSummary(protentionAssessment, goalAnalysis)
    };
  },

  _generateRecommendations: function(protention, goalDirected) {
    const recommendations = [];

    if (protention.clarity.score < 3) {
      recommendations.push({
        priority: '高',
        intervention: '预期清晰度训练',
        reason: '提升预期的清晰度和具体程度'
      });
    }

    if (goalDirected.goalClarity.level !== 'SMART') {
      recommendations.push({
        priority: '高',
        intervention: '目标层级地图',
        reason: '建立清晰的目标层级结构'
      });
    }

    if (goalDirected.meansEnd.level !== '清晰') {
      recommendations.push({
        priority: '中',
        intervention: '手段 - 目的分析',
        reason: '清晰分析目标与手段的逻辑关系'
      });
    }

    recommendations.push({
      priority: '低',
      intervention: '实践推理日志',
      reason: '培养日常实践推理能力，持续改进决策质量'
    });

    return recommendations;
  },

  _generateSummary: function(protention, goalDirected) {
    const summary = [];

    summary.push('预期与目标导向评估:');
    summary.push('');
    summary.push(`预期结构综合：${protention.overallLevel} (${protention.overallScore.toFixed(1)}/4)`);
    summary.push(`  清晰度：${protention.clarity.level} (${protention.clarity.score}/4)`);
    summary.push(`  时间范围：${protention.timeRange.level} (得分：${protention.timeRange.score}/4)`);
    summary.push(`  灵活性：${protention.flexibility.level} (${protention.flexibility.score}/5)`);
    summary.push(`  校准度：${protention.calibration.level} (${protention.calibration.score}/5)`);
    summary.push('');
    summary.push(`目标导向综合：${goalDirected.overallLevel} (${goalDirected.overallScore.toFixed(1)}/15)`);
    summary.push(`  目标清晰度：${goalDirected.goalClarity.level} (${goalDirected.goalClarity.score}/15)`);
    summary.push(`  手段 - 目的推理：${goalDirected.meansEnd.level} (${goalDirected.meansEnd.score}/9)`);
    summary.push(`  目标承诺：${goalDirected.commitment.level} (${goalDirected.commitment.score}/10)`);
    summary.push(`  目标冲突：${goalDirected.conflict.level} (冲突分：${goalDirected.conflict.score})`);

    return summary.join('\n');
  }
};

module.exports = ProtentionGoalOrientation;
