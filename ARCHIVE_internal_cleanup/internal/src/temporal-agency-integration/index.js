/**
 * 时间性能动性整合模块 (Temporal Agency Integration)
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 时间意识与能动性理论
 * 
 * 核心理论：
 * - SEP Temporal Consciousness: 三大时间意识模型 (电影/保留/延展)
 * - SEP Agency: 五种能动性概念 (标准/发起/意志/因果历史/现象)
 * - Husserl 内时间意识现象学：原初印象 + 保留 + 预期
 * - William James 似是而非的现在 (Specious Present)
 * - 时间性与能动性的深度整合
 * 
 * 可操作技术：
 * - 时间性能动性评估 (5 维度)
 * - 时间模型识别 (3 模型)
 * - 能动性时间结构分析
 * - 时间性干预设计 (7 个练习)
 * 
 * @module temporal-agency-integration
 * @version 4.7.0
 */

const TemporalAgencyIntegration = {
  /**
   * 模块元信息
   */
  meta: {
    name: '时间性能动性整合',
    version: '4.7.0',
    source: 'SEP Temporal Consciousness + Agency + Temporality (v4.7.0)',
    description: '基于 SEP 时间意识三大模型与能动性五种概念的深度整合模块'
  },

  /**
   * SEP 时间意识三大模型 (Three Models of Temporal Consciousness)
   * 基于 Stanford Encyclopedia of Philosophy 权威理论
   */
  temporalModels: {
    /**
     * 1. 电影模型 (Cinematic Model)
     * 主张：意识是瞬间的"快照"序列，没有真正的时间延展
     * 代表人物：Augustine, Reid, Chuard
     */
    cinematic: {
      name: '电影模型',
      coreThesis: '意识是瞬间静态快照序列，通过快速连续产生运动错觉',
      proponents: ['Augustine', 'Thomas Reid', 'Philippe Chuard'],
      mechanisms: {
        snapshot: '瞬间意识状态，无时间延展',
        succession: '快照的快速连续排列',
        memory: '记忆连接离散快照产生连续感',
        illusion: '运动/变化是错觉而非真实体验'
      },
      indicators: [
        '片段化体验描述',
        '依赖记忆连接体验',
        '体验的错觉性质',
        '缺乏连续感',
        '注意力分散'
      ],
      agencyImplications: {
        decisionMaking: '决策可能碎片化，缺乏长期连贯性',
        goalPursuit: '目标可能频繁变化，难以坚持长期目标',
        selfContinuity: '自我连续性感知较弱',
        intervention: '需要时间整合练习，建立过去 - 现在 - 未来连接'
      }
    },

    /**
     * 2. 保留模型 (Retentional Model)
     * 主张：意识瞬间但包含对过去的"保留"表征
     * 代表人物：Husserl, Brentano, Dennett
     */
    retentional: {
      name: '保留模型',
      coreThesis: '意识瞬间但包含原初印象 + 保留 (过去) + 预期 (未来) 的复合结构',
      proponents: ['Edmund Husserl', 'Franz Brentano', 'Daniel Dennett'],
      mechanisms: {
        primalImpression: '当下的核心体验',
        retention: '对刚刚过去的非自愿持存（非回忆）',
        protention: '对即将到来的前摄性预期',
        cometTail: '保留形成时间的"彗星尾"厚度'
      },
      indicators: [
        '过去 - 现在连续性体验',
        '未来预期结构',
        '时间厚度体验',
        '流动感',
        '延续感'
      ],
      agencyImplications: {
        decisionMaking: '决策具有时间深度，考虑过去经验和未来后果',
        goalPursuit: '能够维持中长期目标',
        selfContinuity: '自我连续性感知良好',
        intervention: '保持健康的时间结构，深化预期想象能力'
      }
    },

    /**
     * 3. 延展模型 (Extensional Model)
     * 主张：意识本身在时间中延展，直接感知变化
     * 代表人物：William James, Barry Dainton, Ian Phillips
     */
    extensional: {
      name: '延展模型',
      coreThesis: '意识本身具有时间延展，直接体验变化和持续',
      proponents: ['William James', 'Barry Dainton', 'Ian Phillips'],
      mechanisms: {
        speciousPresent: '似是而非的现在——有延展的体验单元',
        directPerception: '直接感知变化而非推断',
        overlap: '相邻体验重叠保证连续性',
        flow: '意识流的内在动态性'
      },
      indicators: [
        '直接体验描述',
        '变化/运动的直接体验',
        '连续性体验',
        '整体性体验',
        '流动感强烈'
      ],
      agencyImplications: {
        decisionMaking: '决策具有流畅性和整体性',
        goalPursuit: '目标追求具有自然流动感',
        selfContinuity: '自我连续性感知强',
        intervention: '保持延展体验，注意避免过度沉浸'
      }
    },

    /**
     * 时间模型识别算法
     * 基于用户描述自动识别主导时间意识模型
     */
    identify: function(userDescription) {
      const scores = {
        cinematic: 0,
        retentional: 0,
        extensional: 0
      };

      const keywords = {
        cinematic: ['片段', '碎片', '瞬间', '断开', '拼凑', '好像', '似乎', '记忆连接', '快照'],
        retentional: ['刚才', '刚刚', '持续', '期待', '预期', '即将', '流动', '延续', '厚度', '彗星尾'],
        extensional: ['直接', '感受到', '变化', '运动', '连续', '不间断', '整体', '完整', '流畅', '沉浸']
      };

      // 计算各模型得分
      Object.keys(keywords).forEach(model => {
        keywords[model].forEach(keyword => {
          if (userDescription.includes(keyword)) {
            scores[model] += 2;
          }
        });
      });

      // 检测句子结构特征
      const sentences = userDescription.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
      
      // 电影模型：短句多，缺乏连接词
      if (sentences.length > 5 && sentences.every(s => s.length < 20)) {
        scores.cinematic += 3;
      }

      // 保留模型：有时间连接词 (然后/之后/接下来)
      const temporalConnectors = ['然后', '之后', '接下来', '之前', '同时', '随后'];
      const hasTemporalConnectors = sentences.some(s => 
        temporalConnectors.some(connector => s.includes(connector))
      );
      if (hasTemporalConnectors) {
        scores.retentional += 3;
      }

      // 延展模型：长句，描述连续体验
      const longSentences = sentences.filter(s => s.length > 40);
      if (longSentences.length > 2) {
        scores.extensional += 3;
      }

      // 判定主导模型
      const maxScore = Math.max(scores.cinematic, scores.retentional, scores.extensional);
      let dominantModel = '未确定';
      let confidence = 0;

      if (maxScore > 0) {
        if (maxScore === scores.cinematic) {
          dominantModel = 'cinematic';
        } else if (maxScore === scores.retentional) {
          dominantModel = 'retentional';
        } else if (maxScore === scores.extensional) {
          dominantModel = 'extensional';
        }
        confidence = Math.min(maxScore / 10, 1.0);
      }

      return {
        dominantModel,
        scores,
        confidence,
        interpretation: this._interpretModel(dominantModel, scores),
        recommendation: this._recommendBasedOnModel(dominantModel)
      };
    },

    _interpretModel: function(model, scores) {
      const interpretations = {
        cinematic: '你的时间体验倾向于片段化，可能通过记忆连接离散时刻。这可能反映注意力分散、压力状态或解离倾向。决策时可能缺乏长期连贯性。',
        retentional: '你的时间体验显示健康的过去 - 现在 - 未来结构，具有现象学上的时间厚度。你能够自然地整合过去经验和未来预期到当下决策中。',
        extensional: '你的时间体验具有直接连续性和流动感，显示良好的时间整合能力。你能够流畅地体验变化和持续，自我连续性感知强。',
        un确定：'需要更多体验描述来识别你的时间意识模式。请详细描述你的时间体验，特别是关于变化、持续、过去 - 现在 - 未来连接的感受。'
      };
      return interpretations[model] || interpretations['未确定'];
    },

    _recommendBasedOnModel: function(model) {
      const recommendations = {
        cinematic: [
          '时间线整合练习：建立过去 - 现在 - 未来的连贯叙事',
          '正念冥想：培养当下连续体验',
          '生命故事写作：整合碎片化记忆为连贯故事',
          '目标层级练习：建立短期 - 中期 - 长期目标的连接'
        ],
        retentional: [
          '保持健康的时间结构',
          '深化预期想象能力：构建更清晰的未来图景',
          '回忆整合练习：重新理解过去经历的时间意义',
          '时间透视扩展：有意识地扩展心理时间视野'
        ],
        extensional: [
          '保持延展体验',
          '注意避免过度沉浸导致的时间感扭曲',
          '定期反思：确保流动感与目标导向的平衡',
          '分享体验：帮助他人理解连续时间体验'
        ]
      };
      return recommendations[model] || recommendations['retentional'];
    }
  },

  /**
   * 时间性能动性评估 (Temporal Agency Assessment)
   * 5 维度评估框架
   */
  assessment: {
    /**
     * 维度 1: 时间深度评分 (Temporal Depth Score)
     * 评估个体能够整合的过去范围和能够规划的未来范围
     */
    temporalDepth: {
      name: '时间深度',
      description: '能够整合的过去时间范围和能够规划的未来时间范围',
      dimensions: [
        {
          name: '过去时间深度',
          questions: [
            '你能清晰地回忆多久以前的具体事件？',
            '你的过去经历在多大程度上影响现在的决策？',
            '你能否识别过去事件之间的因果联系？',
            '你对自己的历史有多少连贯的理解？'
          ],
          scoring: {
            '0-1 年': 1,
            '1-3 年': 2,
            '3-10 年': 3,
            '10 年以上': 4
          }
        },
        {
          name: '未来时间深度',
          questions: [
            '你能清晰地规划多久以后的事情？',
            '未来的目标在多大程度上影响现在的行动？',
            '你能否想象未来自我的具体状态？',
            '你对未来有多少连贯的规划？'
          ],
          scoring: {
            '0-1 周': 1,
            '1 周 -1 月': 2,
            '1 月 -1 年': 3,
            '1 年以上': 4
          }
        },
        {
          name: '时间深度平衡性',
          questions: [
            '你更多关注过去还是未来？',
            '过去和未来的时间深度是否平衡？',
            '你是否过度沉溺于过去或过度焦虑于未来？'
          ],
          scoring: {
            '严重失衡': 1,
            '轻度失衡': 2,
            '基本平衡': 3,
            '高度平衡': 4
          }
        }
      ],
      calculate: function(responses) {
        const scores = responses.map(r => r.score).filter(s => s);
        if (scores.length === 0) return { score: 0, level: '未评估' };
        
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        let level = '';
        if (avg <= 1.5) level = '时间深度狭窄';
        else if (avg <= 2.5) level = '时间深度有限';
        else if (avg <= 3.5) level = '时间深度良好';
        else level = '时间深度优秀';

        return {
          score: avg,
          level,
          breakdown: scores
        };
      }
    },

    /**
     * 维度 2: 过去整合度 (Past Integration)
     * 评估个体对过去经历的整合程度
     */
    pastIntegration: {
      name: '过去整合度',
      description: '对过去经历的接纳、理解和整合程度',
      indicators: [
        '能否接纳过去的错误和遗憾',
        '能否从过去经历中提取意义',
        '过去经历是否被整合为连贯的生命故事',
        '是否存在未处理的创伤或情结',
        '能否与过去自我和解'
      ],
      assess: function(userInput) {
        const positiveKeywords = ['接纳', '理解', '意义', '成长', '学习', '和解', '整合', '连贯'];
        const negativeKeywords = ['遗憾', '后悔', '创伤', '痛苦', '回避', '压抑', '碎片', '断裂'];

        let positiveScore = 0;
        let negativeScore = 0;

        positiveKeywords.forEach(kw => {
          if (userInput.includes(kw)) positiveScore += 2;
        });

        negativeKeywords.forEach(kw => {
          if (userInput.includes(kw)) negativeScore += 2;
        });

        const netScore = Math.max(0, positiveScore - negativeScore * 0.5);
        let level = '';
        if (netScore <= 3) level = '整合度低';
        else if (netScore <= 6) level = '整合度中等';
        else if (netScore <= 10) level = '整合度良好';
        else level = '整合度优秀';

        return {
          score: netScore,
          level,
          positiveIndicators: positiveScore,
          negativeIndicators: negativeScore
        };
      }
    },

    /**
     * 维度 3: 未来导向性 (Future Orientation)
     * 评估个体对未来的规划、期待和行动导向
     */
    futureOrientation: {
      name: '未来导向性',
      description: '对未来的规划能力、期待质量和行动导向',
      dimensions: [
        {
          name: '目标清晰度',
          questions: [
            '你有明确的长期目标吗？',
            '你能描述未来自我的具体状态吗？',
            '你的目标是否有清晰的时间节点？'
          ]
        },
        {
          name: '预期质量',
          questions: [
            '你对未来的期待主要是积极还是消极？',
            '你能否想象多种可能的未来？',
            '你的未来想象是否具体生动？'
          ]
        },
        {
          name: '行动导向',
          questions: [
            '你是否为未来目标采取具体行动？',
            '现在的行动与未来目标的关联度如何？',
            '你能否延迟满足以追求长期目标？'
          ]
        }
      ],
      assess: function(userInput) {
        const goalKeywords = ['目标', '计划', '规划', '想要', '希望', '期待', '未来', '以后'];
        const actionKeywords = ['行动', '做', '执行', '实施', '开始', '进行', '努力', '坚持'];
        const clarityKeywords = ['明确', '清晰', '具体', '详细', '清楚', '确定'];

        let goalScore = 0;
        let actionScore = 0;
        let clarityScore = 0;

        goalKeywords.forEach(kw => {
          if (userInput.includes(kw)) goalScore += 1;
        });

        actionKeywords.forEach(kw => {
          if (userInput.includes(kw)) actionScore += 1;
        });

        clarityKeywords.forEach(kw => {
          if (userInput.includes(kw)) clarityScore += 1;
        });

        const totalScore = (goalScore + actionScore + clarityScore) / 3;
        let level = '';
        if (totalScore <= 2) level = '未来导向弱';
        else if (totalScore <= 4) level = '未来导向中等';
        else if (totalScore <= 6) level = '未来导向良好';
        else level = '未来导向强';

        return {
          score: totalScore,
          level,
          breakdown: {
            goalClarity: goalScore,
            actionOrientation: actionScore,
            clarity: clarityScore
          }
        };
      }
    },

    /**
     * 维度 4: 当下临在感 (Present Presence)
     * 评估个体在当下的临在质量和专注度
     */
    presentPresence: {
      name: '当下临在感',
      description: '在当下的临在质量、专注度和体验深度',
      indicators: [
        '能否专注于当前任务',
        '是否经常被过去回忆或未来担忧打断',
        '对当下体验的觉察程度',
        '当下体验的丰富性和深度',
        '心流体验的频率'
      ],
      assess: function(userInput) {
        const presenceKeywords = ['当下', '现在', '此刻', '专注', '临在', '觉察', '沉浸', '心流'];
        const distractionKeywords = ['分心', '走神', '担忧', '胡思乱想', '无法集中', '思绪飘'];

        let presenceScore = 0;
        let distractionScore = 0;

        presenceKeywords.forEach(kw => {
          if (userInput.includes(kw)) presenceScore += 2;
        });

        distractionKeywords.forEach(kw => {
          if (userInput.includes(kw)) distractionScore += 2;
        });

        const netScore = Math.max(0, presenceScore - distractionScore * 0.5);
        let level = '';
        if (netScore <= 3) level = '临在感弱';
        else if (netScore <= 6) level = '临在感中等';
        else if (netScore <= 10) level = '临在感良好';
        else level = '临在感强';

        return {
          score: netScore,
          level,
          presenceIndicators: presenceScore,
          distractionIndicators: distractionScore
        };
      }
    },

    /**
     * 维度 5: 时间连续性 (Temporal Continuity)
     * 评估自我在时间中的连续性感知
     */
    temporalContinuity: {
      name: '时间连续性',
      description: '自我在时间中的连续性感知和身份整合度',
      indicators: [
        '是否感觉现在的自己与过去的自己是同一个人',
        '能否识别跨时间的个人特质和价值观',
        '生命故事的连贯性',
        '身份变化的整合能力',
        '未来自我与现在自我的连接感'
      ],
      assess: function(userInput) {
        const continuityKeywords = ['一直', '始终', '继续', '保持', '延续', '连接', '连续', '同一', '一致'];
        const discontinuityKeywords = ['改变', '不同', '断裂', '陌生', '不像', '分裂', '矛盾'];

        let continuityScore = 0;
        let discontinuityScore = 0;

        continuityKeywords.forEach(kw => {
          if (userInput.includes(kw)) continuityScore += 2;
        });

        discontinuityKeywords.forEach(kw => {
          if (userInput.includes(kw)) discontinuityScore += 1; // 不连续性不一定是负面的
        });

        const netScore = continuityScore + Math.min(discontinuityScore, 3); // 适度的不连续性感知也是健康的
        let level = '';
        if (netScore <= 3) level = '连续性弱';
        else if (netScore <= 6) level = '连续性中等';
        else if (netScore <= 10) level = '连续性良好';
        else level = '连续性强';

        return {
          score: netScore,
          level,
          continuityIndicators: continuityScore,
          changeAwareness: discontinuityScore
        };
      }
    },

    /**
     * 综合评估函数
     */
    comprehensive: function(userInput) {
      return {
        temporalDepth: this.temporalDepth.calculate([]), // 需要具体 responses
        pastIntegration: this.pastIntegration.assess(userInput),
        futureOrientation: this.futureOrientation.assess(userInput),
        presentPresence: this.presentPresence.assess(userInput),
        temporalContinuity: this.temporalContinuity.assess(userInput),
        overallScore: function() {
          const scores = [
            this.pastIntegration.score,
            this.futureOrientation.score,
            this.presentPresence.score,
            this.temporalContinuity.score
          ];
          return scores.reduce((a, b) => a + b, 0) / scores.length;
        }.bind(this)
      };
    }
  },

  /**
   * 时间性干预练习 (Temporal Interventions)
   * 7 个核心练习技术
   */
  interventions: {
    /**
     * 练习 1: 时间线整合练习
     * 时长：45-60 分钟
     * 目标：建立过去 - 现在 - 未来的连贯叙事
     */
    timelineIntegration: {
      name: '时间线整合练习',
      duration: '45-60 分钟',
      goal: '建立过去 - 现在 - 未来的连贯叙事',
      steps: [
        {
          step: 1,
          name: '准备阶段',
          duration: '5 分钟',
          instructions: [
            '找一个安静、不被打扰的空间',
            '准备纸笔或电子设备',
            '进行 3 分钟深呼吸，让身心平静'
          ]
        },
        {
          step: 2,
          name: '过去时间线绘制',
          duration: '15-20 分钟',
          instructions: [
            '在纸上画一条水平线，左端代表出生，右端代表现在',
            '标记出 5-8 个关键生命事件（积极的和消极的）',
            '对每个事件，写下：发生了什么、你的感受、你学到了什么',
            '识别事件之间的因果联系和主题模式'
          ]
        },
        {
          step: 3,
          name: '现在定位',
          duration: '5-10 分钟',
          instructions: [
            '在时间线的现在位置，写下你当前的状态',
            '描述你现在的核心身份、价值观、目标',
            '反思过去的经历如何塑造了现在的你'
          ]
        },
        {
          step: 4,
          name: '未来时间线延伸',
          duration: '15-20 分钟',
          instructions: [
            '从现在的位置向右延伸时间线，展望 1 年、5 年、10 年后',
            '对每个时间点，描述你希望成为什么样的人',
            '写下你希望实现的目标和经历',
            '思考从现在到未来需要的行动和改变'
          ]
        },
        {
          step: 5,
          name: '整合反思',
          duration: '10 分钟',
          instructions: [
            '整体审视你的时间线',
            '识别贯穿始终的主题和价值观',
            '写下 3-5 句关于你生命故事的连贯叙述',
            '感谢过去的自己，承诺未来的行动'
          ]
        }
      ],
      expectedOutcomes: [
        '增强自我连续性感知',
        '整合碎片化的生命经历',
        '建立清晰的未来自我图景',
        '增强行动的目的性和方向感'
      ]
    },

    /**
     * 练习 2: 未来未来自我对话
     * 时长：20-30 分钟
     * 目标：与未来自我建立连接，增强未来导向
     */
    futureSelfDialogue: {
      name: '未来未来自我对话',
      duration: '20-30 分钟',
      goal: '与未来自我建立连接，增强未来导向',
      steps: [
        {
          step: 1,
          name: '未来自我可视化',
          duration: '5-10 分钟',
          instructions: [
            '闭上眼睛，想象 5 年后的自己',
            '尽可能详细地想象：你在哪里、和谁在一起、在做什么',
            '注意未来自我的表情、姿态、语气',
            '感受未来自我的情绪状态'
          ]
        },
        {
          step: 2,
          name: '写信给未来自我',
          duration: '10 分钟',
          instructions: [
            '以现在的身份给 5 年后的自己写一封信',
            '分享你现在的希望、担忧、目标',
            '询问未来自我一些问题（如：你后悔什么？你骄傲什么？）'
          ]
        },
        {
          step: 3,
          name: '未来自我回信',
          duration: '10 分钟',
          instructions: [
            '切换视角，以未来自我的身份给现在的自己回信',
            '未来自我会对现在的你说什么？',
            '未来自我建议你现在做什么、不做什么？',
            '未来自我感谢你现在做了什么？'
          ]
        },
        {
          step: 4,
          name: '整合与承诺',
          duration: '5 分钟',
          instructions: [
            '阅读两封信，注意你的感受',
            '写下 1-3 个你愿意为未来自我采取的具体行动',
            '承诺在接下来的一周内开始其中一个行动'
          ]
        }
      ],
      expectedOutcomes: [
        '增强与未来自我的情感连接',
        '提高延迟满足能力',
        '增强当前行动的目的性',
        '减少短视决策'
      ]
    },

    /**
     * 练习 3: 过去自我宽恕练习
     * 时长：25-35 分钟
     * 目标：与过去自我和解，释放遗憾和自责
     */
    pastSelfForgiveness: {
      name: '过去自我宽恕练习',
      duration: '25-35 分钟',
      goal: '与过去自我和解，释放遗憾和自责',
      steps: [
        {
          step: 1,
          name: '识别未和解的经历',
          duration: '5-10 分钟',
          instructions: [
            '回想一件你仍然感到遗憾、后悔或自责的事情',
            '写下发生了什么、你当时的选择、结果如何',
            '注意你现在的感受（愧疚、羞耻、愤怒等）'
          ]
        },
        {
          step: 2,
          name: '理解过去的自己',
          duration: '10 分钟',
          instructions: [
            '回想当时的你：你知道什么？你不知道什么？',
            '当时的你有什么局限（知识、经验、情绪状态、外部压力）？',
            '当时的你在尽力吗？基于当时的条件？',
            '如果换成现在的你，会做得更好吗？为什么？'
          ]
        },
        {
          step: 3,
          name: '提取意义与学习',
          duration: '5-10 分钟',
          instructions: [
            '从这段经历中，你学到了什么？',
            '这段经历如何塑造了现在的你？',
            '有没有任何积极的副产品（成长、洞察、力量）？'
          ]
        },
        {
          step: 4,
          name: '宽恕仪式',
          duration: '5 分钟',
          instructions: [
            '对过去的自己说："我看到你的努力，我理解你的局限"',
            "说：'我原谅你，我释放这份遗憾'",
            '感谢过去的自己为你带来的学习',
            '承诺用学习到的智慧过好现在的生活'
          ]
        }
      ],
      expectedOutcomes: [
        '减少对过去的执着和自责',
        '增强自我接纳和自我同情',
        '释放情绪负担',
        '将遗憾转化为成长资源'
      ]
    },

    /**
     * 练习 4: 当下临在冥想
     * 时长：10-20 分钟
     * 目标：培养深度临在感，增强当下觉察
     */
    presentMindfulness: {
      name: '当下临在冥想',
      duration: '10-20 分钟',
      goal: '培养深度临在感，增强当下觉察',
      steps: [
        {
          step: 1,
          name: '身体锚定',
          duration: '3 分钟',
          instructions: [
            '舒适地坐着或躺着',
            '将注意力带到呼吸上，感受气息进出',
            '扫描身体，注意各部位的感觉（不评判）',
            '让身体自然放松'
          ]
        },
        {
          step: 2,
          name: '感官觉察',
          duration: '5-7 分钟',
          instructions: [
            '依次注意：听到的声音、看到的物体、身体的触感、闻到的气味',
            '对每个感官体验，只是觉察，不分析不评判',
            '当思绪飘走，温和地带回感官体验',
            '体验纯粹的当下感知'
          ]
        },
        {
          step: 3,
          name: '思绪观察',
          duration: '5 分钟',
          instructions: [
            '将注意力转向内心升起的思绪',
            '把思绪看作天空中的云，让它们自然来去',
            '不跟随思绪，也不压抑思绪',
            '保持观察者的位置'
          ]
        },
        {
          step: 4,
          name: '整合与返回',
          duration: '2-5 分钟',
          instructions: [
            '深呼吸几次，感受整个身体的存在',
            '注意当下的整体感受',
            '慢慢睁开眼睛，带着觉察回到日常活动',
            '尝试将这份临在感带入接下来的活动'
          ]
        }
      ],
      expectedOutcomes: [
        '增强当下觉察能力',
        '减少思绪飘移',
        '提高专注力',
        '增强体验的丰富性和深度'
      ]
    },

    /**
     * 练习 5: 时间透视扩展训练
     * 时长：30-40 分钟
     * 目标：扩展心理时间视野，增强长期思维
     */
    temporalPerspectiveExpansion: {
      name: '时间透视扩展训练',
      duration: '30-40 分钟',
      goal: '扩展心理时间视野，增强长期思维',
      steps: [
        {
          step: 1,
          name: '当前时间透视评估',
          duration: '5 分钟',
          instructions: [
            '写下你通常考虑的时间范围（天/周/月/年）',
            '评估你的决策主要基于多长时间的后果',
            '识别你的时间透视局限'
          ]
        },
        {
          step: 2,
          name: '深时想象',
          duration: '10 分钟',
          instructions: [
            '想象 10 年后的世界和你',
            '想象 50 年后的世界（你可能不在了）',
            '想象 100 年、1000 年后的世界',
            '感受个体生命在历史长河中的位置'
          ]
        },
        {
          step: 3,
          name: '跨时间影响分析',
          duration: '10 分钟',
          instructions: [
            '选择一个当前的重要决策',
            '分析这个决策在 1 天、1 周、1 月、1 年、10 年后的影响',
            '识别短期和长期影响的差异',
            '思考如何平衡短期和长期考虑'
          ]
        },
        {
          step: 4,
          name: '遗产思考',
          duration: '5-10 分钟',
          instructions: [
            '思考你希望留下什么样的遗产',
            '你希望别人如何记住你？',
            '你希望对世界产生什么影响？',
            '基于遗产思考，调整当前的优先级'
          ]
        }
      ],
      expectedOutcomes: [
        '扩展心理时间视野',
        '增强长期思维能力',
        '提高决策质量',
        '增强生命意义感'
      ]
    },

    /**
     * 练习 6: 预期想象可视化
     * 时长：15-25 分钟
     * 目标：构建清晰的积极未来图景，增强动机
     */
    protentionVisualization: {
      name: '预期想象可视化',
      duration: '15-25 分钟',
      goal: '构建清晰的积极未来图景，增强动机',
      steps: [
        {
          step: 1,
          name: '放松与准备',
          duration: '3-5 分钟',
          instructions: [
            '舒适地坐着或躺着',
            '进行深呼吸，放松身体',
            '清空思绪，准备进入想象'
          ]
        },
        {
          step: 2,
          name: '场景构建',
          duration: '5-10 分钟',
          instructions: [
            '选择一个你希望实现的未来场景',
            '尽可能详细地想象：地点、人物、活动',
            '使用所有感官：看、听、触、闻、尝',
            '让场景尽可能生动具体'
          ]
        },
        {
          step: 3,
          name: '情绪体验',
          duration: '5 分钟',
          instructions: [
            '注意在这个场景中你的情绪感受',
            '充分体验积极情绪（喜悦、满足、自豪等）',
            '让情绪在身体中流动',
            '锚定这份情绪感受'
          ]
        },
        {
          step: 4,
          name: '行动连接',
          duration: '5 分钟',
          instructions: [
            '思考从现在到这个未来需要的步骤',
            '识别下一步可以做什么',
            '承诺采取具体行动',
            '带着清晰的图景和动机结束练习'
          ]
        }
      ],
      expectedOutcomes: [
        '增强未来图景的清晰度',
        '提高动机和行动力',
        '增强积极情绪',
        '改善目标承诺'
      ]
    },

    /**
     * 练习 7: 回忆重构叙事
     * 时长：35-45 分钟
     * 目标：重新理解过去经历的时间意义，转化负面记忆
     */
    memoryReconstruction: {
      name: '回忆重构叙事',
      duration: '35-45 分钟',
      goal: '重新理解过去经历的时间意义，转化负面记忆',
      steps: [
        {
          step: 1,
          name: '选择记忆',
          duration: '5 分钟',
          instructions: [
            '选择一个仍然困扰你的过去经历',
            '写下客观事实（发生了什么、何时、何地、涉及谁）',
            '写下你当前的解读和感受'
          ]
        },
        {
          step: 2,
          name: '多视角重构',
          duration: '10-15 分钟',
          instructions: [
            '从其他参与者的视角重写这个故事',
            '从一个中立的观察者视角重写',
            '从 10 年后的你的视角重写',
            '注意不同视角带来的理解差异'
          ]
        },
        {
          step: 3,
          name: '意义提取',
          duration: '10 分钟',
          instructions: [
            '这段经历教会了你什么？',
            '它如何塑造了你的价值观、信念、行为？',
            '有没有任何积极的副产品？',
            '如果这段经历是必要的，它为了什么？'
          ]
        },
        {
          step: 4,
          name: '新叙事整合',
          duration: '10 分钟',
          instructions: [
            '基于新的理解，重写这个故事',
            '强调成长、学习、力量的获得',
            '将这段经历整合为你的力量来源而非负担',
            '写下新的叙事，并承诺以新视角看待这段经历'
          ]
        }
      ],
      expectedOutcomes: [
        '转化负面记忆的情绪负荷',
        '增强对过去的接纳',
        '提取成长资源',
        '增强生命故事的连贯性和意义感'
      ]
    }
  },

  /**
   * 主分析函数
   * 综合时间模型识别、能动性评估和干预推荐
   */
  analyze: function(userInput) {
    const temporalModelAnalysis = this.temporalModels.identify(userInput);
    const assessment = this.assessment.comprehensive(userInput);
    
    // 基于评估结果推荐干预
    const recommendations = this._generateRecommendations(assessment, temporalModelAnalysis);

    return {
      temporalModel: temporalModelAnalysis,
      assessment,
      recommendations,
      summary: this._generateSummary(temporalModelAnalysis, assessment)
    };
  },

  _generateRecommendations: function(assessment, temporalModel) {
    const recommendations = [];

    // 基于时间模型推荐
    if (temporalModel.dominantModel === 'cinematic') {
      recommendations.push({
        priority: '高',
        intervention: '时间线整合练习',
        reason: '你的时间体验倾向于片段化，需要建立过去 - 现在 - 未来的连贯叙事'
      });
    }

    // 基于评估维度推荐
    if (assessment.pastIntegration.level === '整合度低' || assessment.pastIntegration.level === '整合度中等') {
      recommendations.push({
        priority: '高',
        intervention: '过去自我宽恕练习',
        reason: '增强对过去经历的整合，释放遗憾和自责'
      });
    }

    if (assessment.futureOrientation.level === '未来导向弱' || assessment.futureOrientation.level === '未来导向中等') {
      recommendations.push({
        priority: '中',
        intervention: '未来未来自我对话',
        reason: '增强与未来自我的连接，提高未来导向'
      });
    }

    if (assessment.presentPresence.level === '临在感弱' || assessment.presentPresence.level === '临在感中等') {
      recommendations.push({
        priority: '中',
        intervention: '当下临在冥想',
        reason: '培养深度临在感，增强当下觉察'
      });
    }

    if (assessment.temporalContinuity.level === '连续性弱' || assessment.temporalContinuity.level === '连续性中等') {
      recommendations.push({
        priority: '高',
        intervention: '回忆重构叙事',
        reason: '增强自我在时间中的连续性感知'
      });
    }

    return recommendations;
  },

  _generateSummary: function(temporalModel, assessment) {
    const summary = [];

    summary.push(`时间意识模型：${temporalModel.interpretation}`);
    summary.push('');
    summary.push('时间性能动性评估:');
    summary.push(`  - 过去整合度：${assessment.pastIntegration.level} (${assessment.pastIntegration.score}/12)`);
    summary.push(`  - 未来导向性：${assessment.futureOrientation.level} (${assessment.futureOrientation.score.toFixed(1)}/8)`);
    summary.push(`  - 当下临在感：${assessment.presentPresence.level} (${assessment.presentPresence.score}/12)`);
    summary.push(`  - 时间连续性：${assessment.temporalContinuity.level} (${assessment.temporalContinuity.score}/12)`);
    summary.push('');
    summary.push(`整体时间性能动性得分：${assessment.overallScore().toFixed(1)}/11`);

    return summary.join('\n');
  }
};

module.exports = TemporalAgencyIntegration;
