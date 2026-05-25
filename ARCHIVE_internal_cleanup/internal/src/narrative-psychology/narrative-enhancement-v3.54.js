/**
 * 叙事心理学增强模块 v3.54.0 (Narrative Psychology Enhancement)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 叙事心理学理论
 * 及 McAdams 生命故事模型 (Life Story Model of Identity)
 * 
 * 核心理论来源:
 * - SEP Narrative Psychology
 * - Dan P. McAdams 生命故事模型
 * - 自传体推理 (Autobiographical Reasoning)
 * - 救赎与污染序列 (Redemption & Contamination Sequences)
 * - 叙事幸福感 (Narrative Well-being)
 * 
 * 新增功能 v3.54.0:
 * - 自传体推理评估框架 (Autobiographical Reasoning Assessment)
 * - 叙事幸福感量表 (Narrative Well-being Scale)
 * - 救赎/污染序列自动识别
 * - 生命故事访谈结构化流程 (Life Story Interview)
 * - 叙事主题深度分析
 * 
 * 可操作技术:
 * - 自传体推理编码：识别意义建构模式
 * - 叙事主题提取：能动性/共生/救赎/污染
 * - 生命故事章节书写
 * - 叙事重构干预
 * - 叙事幸福感提升练习
 * 
 * @module narrative-psychology-enhancement
 * @version 3.54.0
 * @author HeartFlow Team
 */

const NarrativePsychologyEnhancement = {
  /**
   * 模块元信息
   */
  meta: {
    name: '叙事心理学增强',
    version: '3.54.0',
    source: 'SEP Narrative Psychology + McAdams Life Story Model + Habermas & Bluck',
    description: '基于叙事心理学与生命故事模型的深度自我整合模块',
    upgradeDate: '2026-03-30'
  },

  /**
   * 自传体推理评估框架
   * Autobiographical Reasoning Assessment
   * 
   * 自传体推理：从生命事件中提取意义、洞察、连接的认知过程
   * 
   * 理论来源:
   * - Habermas & Bluck (2000) - 自传体推理的提出
   * - McAdams et al. - 意义建构与身份形成
   * - 发展心理学：青少年期开始发展自传体推理能力
   * 
   * 四种自传体推理类型:
   * 1. 传记论证 (Biographical Arguments): 事件如何塑造性格
   * 2.  Lessons Learned: 从事件中学到什么
   * 3. 人生转折点 (Turning Points): 事件如何改变人生方向
   * 4. 主题连接 (Thematic Connections): 跨事件的主题模式
   */
  autobiographicalReasoning: {
    name: '自传体推理评估',
    
    types: {
      biographicalArguments: {
        name: '传记论证',
        description: '解释生命事件如何塑造了现在的自己',
        example: '那次失败让我变得更加坚韧',
        indicators: ['让我成为', '塑造了我', '使我变得', '从那以后我'],
        psychologicalFunction: '建立因果连续感，连接过去与现在'
      },
      lessonsLearned: {
        name: '经验教训',
        description: '从生命事件中提取的智慧和洞察',
        example: '我学会了不要轻易相信别人',
        indicators: ['我学会了', '我明白了', '我认识到', '这让我懂得'],
        psychologicalFunction: '从经验中学习，指导未来行动'
      },
      turningPoints: {
        name: '人生转折点',
        description: '识别改变人生方向的关键事件',
        example: '遇见她之后，我的人生完全改变了',
        indicators: ['从那时起', '转折点', '改变了一切', '人生分界线'],
        psychologicalFunction: '组织生命故事的结构节点'
      },
      thematicConnections: {
        name: '主题连接',
        description: '识别跨事件的一致主题和模式',
        example: '我发现自己总是在追求认可',
        indicators: ['总是', '反复', '模式', '我发现自己'],
        psychologicalFunction: '建立生命的连贯性和意义'
      }
    },

    /**
     * 自传体推理评估函数
     */
    assess: function(userNarrative) {
      const assessment = {
        timestamp: new Date().toISOString(),
        types: {
          biographicalArguments: { count: 0, examples: [], score: 0 },
          lessonsLearned: { count: 0, examples: [], score: 0 },
          turningPoints: { count: 0, examples: [], score: 0 },
          thematicConnections: { count: 0, examples: [], score: 0 }
        },
        overall: {
          totalAR: 0,
          level: '',
          profile: '',
          recommendations: []
        }
      };

      const narrative = userNarrative;
      const sentences = narrative.split(/[.!?]/).filter(s => s.trim().length > 0);

      // 分析每个句子
      sentences.forEach(sentence => {
        const s = sentence.trim();
        
        // 传记论证
        const baIndicators = ['让我成为', '塑造了我', '使我变得', '从那以后我', '因此我', '所以我现在'];
        baIndicators.forEach(indicator => {
          if (s.includes(indicator)) {
            assessment.types.biographicalArguments.count++;
            assessment.types.biographicalArguments.examples.push(s);
          }
        });

        // 经验教训
        const llIndicators = ['我学会了', '我明白了', '我认识到', '这让我懂得', '我意识到', ' lesson'];
        llIndicators.forEach(indicator => {
          if (s.includes(indicator)) {
            assessment.types.lessonsLearned.count++;
            assessment.types.lessonsLearned.examples.push(s);
          }
        });

        // 转折点
        const tpIndicators = ['从那时起', '转折点', '改变了一切', '人生分界线', '从此以后', '完全改变'];
        tpIndicators.forEach(indicator => {
          if (s.includes(indicator)) {
            assessment.types.turningPoints.count++;
            assessment.types.turningPoints.examples.push(s);
          }
        });

        // 主题连接
        const tcIndicators = ['总是', '反复', '模式', '我发现自己', '一贯', '经常'];
        tcIndicators.forEach(indicator => {
          if (s.includes(indicator)) {
            assessment.types.thematicConnections.count++;
            assessment.types.thematicConnections.examples.push(s);
          }
        });
      });

      // 计算分数 (0-4 分)
      Object.keys(assessment.types).forEach(type => {
        const count = assessment.types[type].count;
        assessment.types[type].score = Math.min(count, 4); // 最多 4 分
      });

      // 总体评估
      assessment.overall.totalAR = Object.values(assessment.types).reduce((sum, t) => sum + t.count, 0);
      
      const totalScore = Object.values(assessment.types).reduce((sum, t) => sum + t.score, 0);
      
      if (totalScore >= 12) {
        assessment.overall.level = 'high';
        assessment.overall.profile = '高度自传体推理 - 善于从生命经验中提取意义和洞察';
      } else if (totalScore >= 6) {
        assessment.overall.level = 'medium';
        assessment.overall.profile = '中等自传体推理 - 有一定的意义建构能力';
      } else {
        assessment.overall.level = 'low';
        assessment.overall.profile = '低自传体推理 - 可能需要加强意义建构练习';
      }

      // 生成建议
      assessment.overall.recommendations = this.generateARRecommendations(assessment);

      return assessment;
    },

    /**
     * 生成自传体推理发展建议
     */
    generateARRecommendations: function(assessment) {
      const recommendations = [];

      // 识别薄弱环节
      Object.entries(assessment.types).forEach(([type, data]) => {
        if (data.score < 2 && data.count === 0) {
          switch(type) {
            case 'biographicalArguments':
              recommendations.push({
                type: '传记论证',
                exercise: '因果连接练习',
                prompt: '选择一个重要经历，写 3 句话说明它如何塑造了现在的你',
                example: '那次失败经历 → 让我学会了谨慎 → 使我成为更周全的决策者'
              });
              break;
            case 'lessonsLearned':
              recommendations.push({
                type: '经验教训',
                exercise: '智慧提取练习',
                prompt: '回顾一个挑战，写下你从中学到的 3 个教训',
                example: '从那次冲突中，我学会了：1) 沟通的重要性 2) 换位思考 3) 及时道歉'
              });
              break;
            case 'turningPoints':
              recommendations.push({
                type: '转折点',
                exercise: '生命时间线练习',
                prompt: '绘制生命时间线，标记 3-5 个转折点',
                example: '高中毕业 → 第一次工作 → 遇见伴侣 → 成为父母'
              });
              break;
            case 'thematicConnections':
              recommendations.push({
                type: '主题连接',
                exercise: '主题识别练习',
                prompt: '回顾 5 个重要经历，寻找反复出现的主题',
                example: '我发现在每段关系中，我都在追求.../避免...'
              });
              break;
          }
        }
      });

      // 总体建议
      if (assessment.overall.level === 'low') {
        recommendations.push({
          type: '整体',
          exercise: '生命故事书写',
          prompt: '每周写一篇生命故事章节，聚焦一个主题或时期',
          benefit: '培养自传体推理习惯，增强生命意义感'
        });
      }

      return recommendations;
    }
  },

  /**
   * 叙事幸福感量表
   * Narrative Well-being Scale
   * 
   * 基于 McAdams 等人的研究：叙事特征与心理健康的关联
   * 
   * 核心维度:
   * 1. 救赎倾向 (Redemption Tendency): 从负面到正面的转变
   * 2. 能动性主题 (Agency Themes): 自我掌控、成就
   * 3. 共生主题 (Communion Themes): 爱、联结、归属
   * 4. 意义连贯 (Meaning Coherence): 生命故事的连贯性和意义
   * 5. 情感基调 (Affective Tone): 整体情感色彩
   * 
   * 研究发现:
   * - 高救赎倾向与更高生活满意度相关
   * - 平衡的能动性与共生主题与心理健康相关
   * - 意义连贯感与幸福感正相关
   */
  narrativeWellBeing: {
    name: '叙事幸福感量表',
    
    dimensions: {
      redemption: {
        name: '救赎倾向',
        description: '从负面经历中提取正面意义的能力',
        highIndicator: '能从困难中看到成长和收获',
        lowIndicator: '困在负面经历中，看不到积极面',
        research: 'McAdams et al. (2001) - 救赎序列与高生活满意度相关',
        questions: [
          '你能从困难经历中找到积极意义吗？',
          '挫折后你能恢复并成长吗？',
          '你的生命故事中有"因祸得福"的时刻吗？'
        ]
      },
      agency: {
        name: '能动性主题',
        description: '生命故事中的自我掌控、成就、赋权主题',
        highIndicator: '感到自己是生命的主导者',
        lowIndicator: '感到被动、无力、被外界控制',
        research: 'McAdams - 能动性主题与自尊和自我效能感相关',
        questions: [
          '你感到能掌控自己的生活吗？',
          '你的故事中有许多成就和克服困难的时刻吗？',
          '你感到自己是行动的发起者吗？'
        ]
      },
      communion: {
        name: '共生主题',
        description: '生命故事中的爱、联结、归属主题',
        highIndicator: '重视关系，感到被爱和归属',
        lowIndicator: '感到孤独、疏离、缺乏联结',
        research: 'McAdams - 共生主题与关系满意度相关',
        questions: [
          '你的故事中有许多关于爱和联结的时刻吗？',
          '你感到与他人有深层联结吗？',
          '你重视并投入于关系吗？'
        ]
      },
      coherence: {
        name: '意义连贯',
        description: '生命故事的连贯性、一致性和意义感',
        highIndicator: '生命故事有清晰的主题和方向',
        lowIndicator: '生命故事感觉碎片化、无意义',
        research: 'Habermas & Bluck (2000) - 连贯性与心理健康相关',
        questions: [
          '你的生命故事有清晰的主题吗？',
          '你能理解生命事件之间的联系吗？',
          '你的生命感觉有方向和目的吗？'
        ]
      },
      affectiveTone: {
        name: '情感基调',
        description: '生命故事的整体情感色彩',
        highIndicator: '整体积极、希望、感恩',
        lowIndicator: '整体消极、绝望、怨恨',
        research: '积极情感基调与主观幸福感相关',
        questions: [
          '回顾生命，整体感觉是积极还是消极？',
          '你对未来感到希望吗？',
          '你经常感到感恩吗？'
        ]
      }
    },

    /**
     * 评估函数
     */
    assess: function(userNarrative) {
      const assessment = {
        timestamp: new Date().toISOString(),
        dimensions: {},
        overall: {
          wellBeingLevel: '',
          profile: '',
          strengths: [],
          areas: [],
          recommendations: []
        }
      };

      const narrative = userNarrative.toLowerCase();

      // 救赎倾向评估
      const redemptionMarkers = (narrative.match(/成长 | 学会 | 收获 | 变得更好 | 感谢 | 幸好 | 幸好 | 因祸得福/g) || []).length;
      const negativeMarkers = (narrative.match(/痛苦 | 伤害 | 永远 | 无法 | 毁了我 | 完了/g) || []).length;
      assessment.dimensions.redemption = {
        score: redemptionMarkers > negativeMarkers ? 'high' : redemptionMarkers === negativeMarkers ? 'medium' : 'low',
        evidence: `救赎词汇：${redemptionMarkers}, 负面词汇：${negativeMarkers}`,
        analysis: redemptionMarkers > negativeMarkers 
          ? '能从负面经历中提取积极意义' 
          : '可能困在负面经历中'
      };

      // 能动性主题评估
      const agencyMarkers = (narrative.match(/我选择 | 我决定 | 我创造 | 我克服 | 我实现 | 我主动 | 我能/g) || []).length;
      const passiveMarkers = (narrative.match(/我被迫 | 我必须 | 我只能 | 我被 | 没办法 | 不得不/g) || []).length;
      assessment.dimensions.agency = {
        score: agencyMarkers > passiveMarkers * 2 ? 'high' : agencyMarkers > passiveMarkers ? 'medium' : 'low',
        evidence: `能动性词汇：${agencyMarkers}, 被动词汇：${passiveMarkers}`,
        analysis: agencyMarkers > passiveMarkers 
          ? '生命故事中有较强的能动性感' 
          : '可能感到被动或缺乏控制'
      };

      // 共生主题评估
      const communionMarkers = (narrative.match(/爱 | 关系 | 朋友 | 家人 | 联结 | 归属 | 陪伴 | 支持/g) || []).length;
      const isolationMarkers = (narrative.match(/孤独 | 一个人 | 疏离 | 没人 | 孤立 | 隔绝/g) || []).length;
      assessment.dimensions.communion = {
        score: communionMarkers > isolationMarkers * 2 ? 'high' : communionMarkers > isolationMarkers ? 'medium' : 'low',
        evidence: `共生词汇：${communionMarkers}, 孤立词汇：${isolationMarkers}`,
        analysis: communionMarkers > isolationMarkers 
          ? '生命故事中有丰富的关系主题' 
          : '可能感到孤独或缺乏联结'
      };

      // 意义连贯评估
      const coherenceMarkers = (narrative.match(/因为 | 所以 | 因此 | 从此 | 导致 | 结果 | 意义 | 目的/g) || []).length;
      const fragmentationMarkers = (narrative.match(/碎片 | 混乱 | 没有意义 | 不知道为什么 | 迷茫/g) || []).length;
      assessment.dimensions.coherence = {
        score: coherenceMarkers > fragmentationMarkers * 2 ? 'high' : coherenceMarkers > fragmentationMarkers ? 'medium' : 'low',
        evidence: `连贯词汇：${coherenceMarkers}, 碎片词汇：${fragmentationMarkers}`,
        analysis: coherenceMarkers > fragmentationMarkers 
          ? '生命故事有较好的连贯性和意义感' 
          : '生命故事可能感觉碎片化'
      };

      // 情感基调评估
      const positiveMarkers = (narrative.match(/快乐 | 幸福 | 希望 | 感恩 | 美好 | 喜悦 | 满足/g) || []).length;
      const negativeMarkers2 = (narrative.match(/悲伤 | 绝望 | 愤怒 | 怨恨 | 痛苦 | 后悔/g) || []).length;
      assessment.dimensions.affectiveTone = {
        score: positiveMarkers > negativeMarkers2 * 2 ? 'high' : positiveMarkers > negativeMarkers2 ? 'medium' : 'low',
        evidence: `积极词汇：${positiveMarkers}, 消极词汇：${negativeMarkers2}`,
        analysis: positiveMarkers > negativeMarkers2 
          ? '整体情感基调较为积极' 
          : '整体情感基调可能偏消极'
      };

      // 总体评估
      const scores = Object.values(assessment.dimensions).map(d => 
        d.score === 'high' ? 2 : d.score === 'medium' ? 1 : 0
      );
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

      if (avgScore >= 1.5) {
        assessment.overall.wellBeingLevel = 'high';
        assessment.overall.profile = '高叙事幸福感 - 生命故事呈现积极、连贯、有意义的特征';
      } else if (avgScore >= 1) {
        assessment.overall.wellBeingLevel = 'medium';
        assessment.overall.profile = '中等叙事幸福感 - 生命故事有积极面也有挑战';
      } else {
        assessment.overall.wellBeingLevel = 'low';
        assessment.overall.profile = '低叙事幸福感 - 生命故事可能需要重构和整合';
      }

      // 识别优势和待发展领域
      Object.entries(assessment.dimensions).forEach(([dim, data]) => {
        if (data.score === 'high') {
          assessment.overall.strengths.push(dim);
        } else if (data.score === 'low') {
          assessment.overall.areas.push(dim);
        }
      });

      // 生成建议
      assessment.overall.recommendations = this.generateWellBeingRecommendations(assessment);

      return assessment;
    },

    /**
     * 生成幸福感提升建议
     */
    generateWellBeingRecommendations: function(assessment) {
      const recommendations = [];

      // 针对低分维度的建议
      assessment.overall.areas.forEach(area => {
        switch(area) {
          case 'redemption':
            recommendations.push({
              dimension: '救赎倾向',
              exercise: '救赎序列书写',
              prompt: '选择一个困难经历，书写它如何带来成长或积极变化',
              structure: [
                '描述困难情境',
                '描述当时的感受和反应',
                '描述转折点或领悟',
                '描述积极的改变或成长',
                '描述这个经历对现在的意义'
              ],
              example: '失业 → 迷茫痛苦 → 发现新兴趣 → 转行成功 → 感谢那段经历'
            });
            break;
          case 'agency':
            recommendations.push({
              dimension: '能动性主题',
              exercise: '掌控时刻记录',
              prompt: '每天记录 3 个你主动选择或克服困难的时刻',
              structure: [
                '情境描述',
                '你的选择或行动',
                '结果和影响',
                '这反映了你的什么能力'
              ],
              benefit: '增强自我效能感和掌控感'
            });
            break;
          case 'communion':
            recommendations.push({
              dimension: '共生主题',
              exercise: '关系感恩日记',
              prompt: '每天记录 3 个关于他人的感恩时刻',
              structure: [
                '谁做了什么',
                '你的感受',
                '这段关系对你的意义'
              ],
              benefit: '增强联结感和归属感'
            });
            break;
          case 'coherence':
            recommendations.push({
              dimension: '意义连贯',
              exercise: '生命时间线',
              prompt: '绘制生命时间线，标记关键事件并寻找主题',
              structure: [
                '按时间顺序标记重要事件',
                '寻找事件之间的联系',
                '识别反复出现的主题',
                '书写你的生命故事概要'
              ],
              benefit: '增强生命连贯性和意义感'
            });
            break;
          case 'affectiveTone':
            recommendations.push({
              dimension: '情感基调',
              exercise: '三件好事练习',
              prompt: '每天记录三件好事及其原因',
              structure: [
                '今天发生的三件好事',
                '为什么这些事会发生',
                '你的感受'
              ],
              research: 'Seligman et al. (2005) - 显著提升幸福感',
              benefit: '培养积极情感基调'
            });
            break;
        }
      });

      // 强化优势的建议
      assessment.overall.strengths.forEach(strength => {
        recommendations.push({
          dimension: strength,
          type: '优势强化',
          suggestion: `你的${strength}较强，可以：`,
          actions: [
            '分享你的经验帮助他人',
            '深入探索这个维度的意义',
            '用它来支持其他维度的发展'
          ]
        });
      });

      return recommendations;
    }
  },

  /**
   * 救赎与污染序列识别
   * Redemption & Contamination Sequence Identification
   * 
   * 救赎序列：负面 → 正面 (从坏到好的转变)
   * 污染序列：正面 → 负面 (从好到坏的转变)
   * 
   * 研究发现:
   * - 高幸福感者的生命故事中救赎序列更多
   * - 抑郁倾向者的生命故事中污染序列更多
   * - 救赎序列可被培养和增强
   */
  sequenceIdentification: {
    name: '救赎/污染序列识别',
    
    /**
     * 救赎序列模式
     */
    redemptionPatterns: [
      {
        name: '成长型救赎',
        pattern: '挫折/失败 → 学习/成长 → 变得更强',
        example: '失业让我发现了真正的热情，现在我从事更有意义的工作',
        indicators: ['虽然...但是', '从...中学会', '让我成长', '因祸得福']
      },
      {
        name: '关系型救赎',
        pattern: '孤独/疏离 → 联结/归属 → 感到被爱',
        example: '离婚后我以为不会再爱，直到遇见现在的伴侣',
        indicators: ['曾经孤独', '遇见', '现在', '感到被爱']
      },
      {
        name: '意义型救赎',
        pattern: '痛苦/创伤 → 寻找意义 → 帮助他人',
        example: '失去亲人后，我创办了支持组织帮助类似经历的人',
        indicators: ['痛苦经历', '找到意义', '帮助', '回馈']
      },
      {
        name: '自由型救赎',
        pattern: '束缚/限制 → 突破/解放 → 自我实现',
        example: '离开那份压抑的工作后，我终于能追求自己的梦想',
        indicators: ['曾经被困', '突破', '自由', '做自己']
      }
    ],

    /**
     * 污染序列模式
     */
    contaminationPatterns: [
      {
        name: '失去型污染',
        pattern: '拥有/幸福 → 失去/破坏 → 痛苦/遗憾',
        example: '我们曾经很幸福，直到那场事故毁了一切',
        indicators: ['曾经', '直到', '毁了', '再也']
      },
      {
        name: '背叛型污染',
        pattern: '信任/期待 → 背叛/失望 → 怀疑/封闭',
        example: '我全心信任他，他却背叛了我，现在我再也不敢相信别人',
        indicators: ['信任', '背叛', '不再', '封闭']
      },
      {
        name: '失败型污染',
        pattern: '希望/努力 → 失败/挫折 → 放弃/绝望',
        example: '我努力了那么久，最后还是失败了，现在觉得什么都没意义',
        indicators: ['努力', '还是失败', '放弃', '没意义']
      },
      {
        name: '堕落型污染',
        pattern: '纯真/理想 → 现实/妥协 → 愤世嫉俗',
        example: '年轻时我相信改变世界，现在只关心自己别被世界改变',
        indicators: ['曾经相信', '现在只', '妥协', '愤世']
      }
    ],

    /**
     * 识别函数
     */
    identify: function(userNarrative) {
      const result = {
        timestamp: new Date().toISOString(),
        redemption: {
          sequences: [],
          count: 0,
          dominant: null
        },
        contamination: {
          sequences: [],
          count: 0,
          dominant: null
        },
        ratio: 0,
        interpretation: '',
        recommendations: []
      };

      const narrative = userNarrative.toLowerCase();

      // 识别救赎序列
      this.redemptionPatterns.forEach(pattern => {
        const matches = pattern.indicators.filter(ind => narrative.includes(ind)).length;
        if (matches >= 2) {
          result.redemption.sequences.push({
            type: pattern.name,
            pattern: pattern.pattern,
            evidence: pattern.indicators.filter(ind => narrative.includes(ind))
          });
          result.redemption.count++;
        }
      });

      // 识别污染序列
      this.contaminationPatterns.forEach(pattern => {
        const matches = pattern.indicators.filter(ind => narrative.includes(ind)).length;
        if (matches >= 2) {
          result.contamination.sequences.push({
            type: pattern.name,
            pattern: pattern.pattern,
            evidence: pattern.indicators.filter(ind => narrative.includes(ind))
          });
          result.contamination.count++;
        }
      });

      // 计算救赎/污染比率
      if (result.contamination.count > 0) {
        result.ratio = result.redemption.count / result.contamination.count;
      } else if (result.redemption.count > 0) {
        result.ratio = Infinity;
      } else {
        result.ratio = 1;
      }

      // 解释
      if (result.ratio >= 2) {
        result.interpretation = '救赎倾向较强 - 生命故事中积极转变多于消极转变，这是心理健康的标志';
      } else if (result.ratio >= 1) {
        result.interpretation = '平衡的叙事 - 救赎和污染序列相对平衡';
      } else if (result.ratio >= 0.5) {
        result.interpretation = '污染倾向 - 生命故事中消极转变较多，可能需要叙事重构';
      } else {
        result.interpretation = '显著污染倾向 - 生命故事以消极转变为主，建议进行叙事干预';
      }

      // 建议
      if (result.contamination.count > result.redemption.count) {
        result.recommendations.push({
          type: '叙事重构',
          exercise: '救赎序列重写',
          prompt: '选择一个污染序列，尝试重新诠释，寻找其中的成长或积极面',
          steps: [
            '描述原始的污染序列',
            '问自己：这个经历让我学到了什么？',
            '问自己：这个经历如何让我成长？',
            '问自己：这个经历如何帮助我帮助他人？',
            '重写这个故事，包含救赎元素'
          ]
        });
      }

      if (result.redemption.count > 0) {
        result.recommendations.push({
          type: '优势强化',
          exercise: '救赎序列扩展',
          prompt: '识别更多的救赎序列，强化积极叙事模式',
          steps: [
            '回顾生命，找出更多"因祸得福"的时刻',
            '书写每个救赎序列的完整故事',
            '识别其中的共同主题',
            '思考如何将这些主题带入未来'
          ]
        });
      }

      return result;
    }
  },

  /**
   * 生命故事访谈结构化流程
   * Life Story Interview (LSI) - 简化版
   * 
   * 基于 McAdams 的生命故事访谈 protocol
   * 用于深度探索个人生命叙事
   */
  lifeStoryInterview: {
    name: '生命故事访谈 (简化版)',
    
    description: '结构化的生命叙事探索，帮助整合生命经验和身份认同',
    
    chapters: [
      {
        chapter: 1,
        title: '生命时间线',
        duration: '15-20 分钟',
        prompts: [
          '请画出你的生命时间线，从出生到现在',
          '标记高峰体验 (生命中最美好的时刻)',
          '标记低谷体验 (生命中最艰难的时刻)',
          '标记转折点 (改变人生方向的事件)',
          '分享每个标记背后的故事'
        ],
        outcome: '建立生命故事的整体框架'
      },
      {
        chapter: 2,
        title: '关键场景',
        duration: '20-30 分钟',
        prompts: [
          '描述一个具体的高峰体验场景',
          '描述一个具体的低谷体验场景',
          '描述一个转折点场景',
          '描述一个早期记忆 (尽可能早)',
          '描述一个重要的他人',
          '对于每个场景：发生了什么？你的感受？这个场景的意义？'
        ],
        outcome: '深入探索塑造身份的关键经历'
      },
      {
        chapter: 3,
        title: '主题识别',
        duration: '15-20 分钟',
        prompts: [
          '你的生命故事中反复出现的主题是什么？',
          '你一直在追求什么？',
          '你一直在避免什么？',
          '什么价值观贯穿你的生命故事？',
          '如果用一句话总结你的生命故事，会是什么？'
        ],
        outcome: '识别生命故事的核心主题和意义'
      },
      {
        chapter: 4,
        title: '未来篇章',
        duration: '15-20 分钟',
        prompts: [
          '想象 5 年后的生活，具体描述',
          '你希望下一章生命故事如何展开？',
          '你想实现什么？',
          '你想成为什么样的人？',
          '你希望别人如何记住你？'
        ],
        outcome: '连接过去与未来，建立生命方向感'
      }
    ],

    /**
     * 引导函数
     */
    guide: function(chapterIndex = 0) {
      const chapter = this.chapters[chapterIndex];
      if (!chapter) {
        return { error: 'Invalid chapter index' };
      }

      return {
        chapter: chapter.chapter,
        title: chapter.title,
        duration: chapter.duration,
        prompts: chapter.prompts,
        outcome: chapter.outcome,
        nextChapter: chapterIndex < this.chapters.length - 1 ? chapterIndex + 1 : null,
        completion: chapterIndex === this.chapters.length - 1
      };
    },

    /**
     * 整合分析
     */
    integrateAnalysis: function(allChaptersResponses) {
      const analysis = {
        timestamp: new Date().toISOString(),
        lifeThemes: [],
        identityStatement: '',
        strengths: [],
        challenges: [],
        futureDirection: '',
        recommendations: []
      };

      // 这里需要复杂的 NLP 分析
      // 简化版本：基于关键词和模式识别

      const allText = JSON.stringify(allChaptersResponses).toLowerCase();

      // 识别主题
      const themeKeywords = {
        '成就导向': ['成就', '成功', '目标', '实现', '超越'],
        '关系导向': ['关系', '爱', '家庭', '朋友', '联结'],
        '成长导向': ['成长', '学习', '发展', '进步', '改变'],
        '服务导向': ['帮助', '贡献', '服务', '回馈', '意义'],
        '自主导向': ['自由', '独立', '自主', '选择', '掌控']
      };

      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        const matches = keywords.filter(k => allText.includes(k)).length;
        if (matches >= 2) {
          analysis.lifeThemes.push(theme);
        }
      });

      // 生成身份陈述 (简化)
      analysis.identityStatement = '基于您的生命故事，您的身份核心围绕着：' + analysis.lifeThemes.join('、');

      // 识别优势和挑战
      const positiveMarkers = (allText.match(/克服 | 成功 | 成长 | 学会 | 感恩 | 希望/g) || []).length;
      const challengeMarkers = (allText.match(/困难 | 挑战 | 挣扎 | 痛苦 | 遗憾/g) || []).length;

      if (positiveMarkers > challengeMarkers) {
        analysis.strengths.push('从挑战中恢复和成长的能力');
      }
      if (challengeMarkers > 0) {
        analysis.challenges.push('整合和处理困难经历');
      }

      return analysis;
    }
  }
};

module.exports = NarrativePsychologyEnhancement;
