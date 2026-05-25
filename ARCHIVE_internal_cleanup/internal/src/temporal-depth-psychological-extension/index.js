/**
 * 时间深度与心理延展模块 (Temporal Depth & Psychological Extension)
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 时间意识与叙事心理学理论
 * 
 * 核心理论：
 * - SEP Temporal Consciousness: 时间深度与心理延展
 * - Narrative Psychology: 生命故事整合与自传体推理
 * - 时间深度 (Temporal Depth): 过去 - 未来的心理范围
 * - 心理延展 (Psychological Extension): 自我在时间中的延展能力
 * 
 * 可操作技术：
 * - 时间深度评估 (4 维度)
 * - 心理延展能力评估
 * - 时间深度干预 (4 个练习)
 * 
 * @module temporal-depth-psychological-extension
 * @version 4.7.0
 */

const TemporalDepthExtension = {
  /**
   * 模块元信息
   */
  meta: {
    name: '时间深度与心理延展',
    version: '4.7.0',
    source: 'SEP Temporal Consciousness + Narrative Psychology (v4.7.0)',
    description: '基于 SEP 时间深度理论与叙事心理学的自我延展模块'
  },

  /**
   * 时间深度评估框架 (Temporal Depth Assessment)
   * 4 维度评估模型
   */
  temporalDepthAssessment: {
    /**
     * 维度 1: 过去时间深度 (Past Temporal Depth)
     * 评估个体能够回忆和整合的过去时间范围
     */
    pastDepth: {
      name: '过去时间深度',
      description: '能够清晰回忆和有意义整合的过去时间范围',
      
      levels: {
        level1: {
          name: '狭窄 (0-1 年)',
          score: 1,
          characteristics: [
            '只能清晰回忆最近几个月的事件',
            '过去的经历感觉模糊或遥远',
            '难以从过去经历中提取连贯的意义',
            '可能反映创伤、解离或注意力问题'
          ],
          interventions: [
            '记忆触发练习：使用照片、物品、音乐触发回忆',
            '生命时间线绘制：从出生开始标记关键事件',
            '日记回顾：阅读旧日记重建过去连接'
          ]
        },
        level2: {
          name: '有限 (1-3 年)',
          score: 2,
          characteristics: [
            '能回忆近几年的主要事件',
            '对更早过去的记忆碎片化',
            '部分能识别过去经历的影响',
            '时间深度有扩展空间'
          ],
          interventions: [
            '主题式回忆：按主题（友谊、学习、成长）组织回忆',
            '重要他人访谈：与家人朋友讨论共同过去',
            '意义提取练习：从每个重要经历中提取 3 个学习'
          ]
        },
        level3: {
          name: '良好 (3-10 年)',
          score: 3,
          characteristics: [
            '能清晰回忆 10 年内的主要经历',
            '能识别跨时间的模式和主题',
            '过去经历被较好整合为生命故事',
            '时间深度支持健康的身份感'
          ],
          interventions: [
            '深化练习：探索早期童年记忆',
            '代际连接：了解家族历史如何影响自己',
            '智慧整合：将过去学习转化为生活智慧'
          ]
        },
        level4: {
          name: '优秀 (10 年以上)',
          score: 4,
          characteristics: [
            '能整合整个生命历程的经历',
            '早期记忆清晰且有情感连接',
            '生命故事连贯且富有意义',
            '过去是智慧和力量的来源'
          ],
          interventions: [
            '传承练习：将生命智慧传递给他人',
            '完整叙事：撰写完整的自传体叙述',
            '感恩回顾：定期感恩过去经历的塑造'
          ]
        }
      },

      assess: function(userInput) {
        // 时间范围关键词
        const timeRanges = {
          'recent': ['最近', '这几天', '上周', '这个月', '近期'],
          'short': ['今年', '过去一年', '去年', '几个月'],
          'medium': ['几年前', '大学时', '工作时', '那几年'],
          'long': ['小时候', '童年', '十年前', '从小', '一直以来']
        };

        const memoryQuality = {
          'vague': ['模糊', '记不清', '好像', '可能', '不太记得'],
          'clear': ['清晰', '记得', '具体', '详细', '生动'],
          'meaningful': ['意义', '影响', '塑造', '学习', '成长', '改变']
        };

        let timeScore = 0;
        let qualityScore = 0;

        // 评估时间范围
        if (timeRanges.long.some(kw => userInput.includes(kw))) timeScore = 4;
        else if (timeRanges.medium.some(kw => userInput.includes(kw))) timeScore = 3;
        else if (timeRanges.short.some(kw => userInput.includes(kw))) timeScore = 2;
        else if (timeRanges.recent.some(kw => userInput.includes(kw))) timeScore = 1;

        // 评估记忆质量
        let vagueCount = 0;
        let clearCount = 0;
        let meaningfulCount = 0;

        Object.keys(memoryQuality).forEach(type => {
          memoryQuality[type].forEach(kw => {
            if (userInput.includes(kw)) {
              if (type === 'vague') vagueCount++;
              else if (type === 'clear') clearCount++;
              else if (type === 'meaningful') meaningfulCount++;
            }
          });
        });

        if (meaningfulCount >= 3 && clearCount >= 2) qualityScore = 1.0;
        else if (meaningfulCount >= 1 && clearCount >= 1) qualityScore = 0.8;
        else if (clearCount >= 1) qualityScore = 0.6;
        else if (vagueCount >= 2) qualityScore = 0.4;
        else qualityScore = 0.5;

        const finalScore = timeScore * qualityScore;
        let level = '';
        if (finalScore <= 1.5) level = '狭窄';
        else if (finalScore <= 2.5) level = '有限';
        else if (finalScore <= 3.5) level = '良好';
        else level = '优秀';

        return {
          score: finalScore,
          level,
          timeRange: timeScore,
          quality: qualityScore,
          characteristics: this.levels['level' + Math.round(finalScore)].characteristics,
          interventions: this.levels['level' + Math.round(finalScore)].interventions
        };
      }
    },

    /**
     * 维度 2: 未来时间深度 (Future Temporal Depth)
     * 评估个体能够规划和想象的未来时间范围
     */
    futureDepth: {
      name: '未来时间深度',
      description: '能够清晰规划和具体想象的未来时间范围',
      
      levels: {
        level1: {
          name: '狭窄 (0-1 周)',
          score: 1,
          characteristics: [
            '只关注眼前的事情',
            '难以想象一周以后的情况',
            '缺乏长期目标和规划',
            '可能反映焦虑、不确定性或生存压力'
          ],
          interventions: [
            '短期目标扩展：从日计划扩展到周计划',
            '未来想象练习：每天花 5 分钟想象下周',
            '小步骤规划：为一个月后做小准备'
          ]
        },
        level2: {
          name: '有限 (1 周 -1 月)',
          score: 2,
          characteristics: [
            '能规划几周内的事情',
            '对更远的未来感到模糊或焦虑',
            '有短期目标但缺乏长期愿景',
            '时间深度需要扩展'
          ],
          interventions: [
            '季度规划：尝试规划 3 个月后的事情',
            '未来自我可视化：想象 6 个月后的自己',
            '目标层级：建立短期 - 中期目标连接'
          ]
        },
        level3: {
          name: '良好 (1 月 -1 年)',
          score: 3,
          characteristics: [
            '能清晰规划一年内的目标',
            '对中期未来有具体想象',
            '有年度计划和阶段性目标',
            '时间深度支持有效规划'
          ],
          interventions: [
            '长期愿景：尝试想象 3-5 年后的生活',
            '里程碑规划：设定 3 年、5 年里程碑',
            '价值对齐：确保长期目标与核心价值观一致'
          ]
        },
        level4: {
          name: '优秀 (1 年以上)',
          score: 4,
          characteristics: [
            '能规划 5 年、10 年甚至更长的未来',
            '有清晰的人生愿景和长期目标',
            '能为长远目标延迟满足',
            '未来是动机和希望的来源'
          ],
          interventions: [
            '遗产规划：思考希望留下的影响',
            '跨代思考：考虑对下一代的影响',
            '愿景更新：定期审视和调整长期愿景'
          ]
        }
      },

      assess: function(userInput) {
        const timeRanges = {
          'immediate': ['今天', '明天', '这几天', '本周'],
          'short': ['下周', '这个月', '下个月', '几周'],
          'medium': ['今年', '明年', '一年内', '几个月后'],
          'long': ['几年后', '5 年', '10 年', '未来', '长期', '以后']
        };

        const planningQuality = {
          'vague': ['不知道', '没想过', '模糊', '不确定', '看情况'],
          'specific': ['计划', '目标', '想要', '希望', '打算'],
          'committed': ['会', '要', '一定', '必须', '承诺']
        };

        let timeScore = 0;
        let qualityScore = 0;

        // 评估时间范围
        if (timeRanges.long.some(kw => userInput.includes(kw))) timeScore = 4;
        else if (timeRanges.medium.some(kw => userInput.includes(kw))) timeScore = 3;
        else if (timeRanges.short.some(kw => userInput.includes(kw))) timeScore = 2;
        else if (timeRanges.immediate.some(kw => userInput.includes(kw))) timeScore = 1;

        // 评估规划质量
        let vagueCount = 0;
        let specificCount = 0;
        let committedCount = 0;

        Object.keys(planningQuality).forEach(type => {
          planningQuality[type].forEach(kw => {
            if (userInput.includes(kw)) {
              if (type === 'vague') vagueCount++;
              else if (type === 'specific') specificCount++;
              else if (type === 'committed') committedCount++;
            }
          });
        });

        if (committedCount >= 2 && specificCount >= 2) qualityScore = 1.0;
        else if (specificCount >= 2) qualityScore = 0.8;
        else if (specificCount >= 1) qualityScore = 0.6;
        else if (vagueCount >= 2) qualityScore = 0.4;
        else qualityScore = 0.5;

        const finalScore = timeScore * qualityScore;
        let level = '';
        if (finalScore <= 1.5) level = '狭窄';
        else if (finalScore <= 2.5) level = '有限';
        else if (finalScore <= 3.5) level = '良好';
        else level = '优秀';

        return {
          score: finalScore,
          level,
          timeRange: timeScore,
          quality: qualityScore,
          characteristics: this.levels['level' + Math.round(finalScore)].characteristics,
          interventions: this.levels['level' + Math.round(finalScore)].interventions
        };
      }
    },

    /**
     * 维度 3: 时间深度平衡性 (Temporal Depth Balance)
     * 评估过去和未来时间深度的平衡程度
     */
    balance: {
      name: '时间深度平衡性',
      description: '过去整合与未来导向之间的平衡程度',
      
      types: {
        pastOriented: {
          name: '过去导向型',
          score: 1,
          characteristics: [
            '过度关注过去经历',
            '沉溺于回忆或遗憾',
            '未来规划较弱',
            '可能反映抑郁、怀旧或创伤后状态'
          ],
          interventions: [
            '未来导向练习：每天设定一个小目标',
            '未来自我对话：与 1 年后的自己对话',
            '行动承诺：为未来采取具体小步骤'
          ]
        },
        futureOriented: {
          name: '未来导向型',
          score: 2,
          characteristics: [
            '过度关注未来目标',
            '忽视当下体验和过去整合',
            '可能焦虑于未来成就',
            '难以享受过程和当下'
          ],
          interventions: [
            '正念练习：培养当下觉察',
            '感恩回顾：每天记录 3 件感恩的事',
            '过程享受：关注行动过程而非仅结果'
          ]
        },
        presentOriented: {
          name: '当下导向型',
          score: 3,
          characteristics: [
            '主要关注当下体验',
            '过去和未来连接较弱',
            '可能缺乏长期规划',
            '享受当下但可能短视'
          ],
          interventions: [
            '时间线练习：建立过去 - 现在 - 未来连接',
            '目标设定：为未来 3 个月设定目标',
            '回忆整合：定期回顾和整合过去经历'
          ]
        },
        balanced: {
          name: '平衡整合型',
          score: 4,
          characteristics: [
            '过去、现在、未来整合良好',
            '从过去学习，为未来规划，享受当下',
            '时间深度灵活适应不同情境',
            '心理健康和时间智慧的表现'
          ],
          interventions: [
            '维持练习：定期进行时间整合反思',
            '智慧分享：将时间智慧传递给他人',
            '持续成长：深化时间深度和能力'
          ]
        }
      },

      assess: function(pastScore, futureScore) {
        const diff = Math.abs(pastScore - futureScore);
        const avg = (pastScore + futureScore) / 2;

        let type = '';
        let score = 0;

        if (diff <= 1 && avg >= 3) {
          type = 'balanced';
          score = 4;
        } else if (diff <= 1.5) {
          type = 'presentOriented';
          score = 3;
        } else if (pastScore > futureScore + 1.5) {
          type = 'pastOriented';
          score = 1;
        } else {
          type = 'futureOriented';
          score = 2;
        }

        return {
          type,
          score,
          pastScore,
          futureScore,
          difference: diff,
          average: avg,
          characteristics: this.types[type].characteristics,
          interventions: this.types[type].interventions
        };
      }
    },

    /**
     * 维度 4: 时间深度灵活性 (Temporal Depth Flexibility)
     * 评估个体根据情境调整时间深度的能力
     */
    flexibility: {
      name: '时间深度灵活性',
      description: '根据情境需要灵活调整时间深度的能力',
      
      assess: function(userInput) {
        const flexibilityKeywords = ['看情况', '根据', '有时', '不同', '调整', '灵活', '适应'];
        const rigidityKeywords = ['总是', '从不', '一定', '必须', '只能', '没办法'];

        let flexibilityScore = 0;
        let rigidityScore = 0;

        flexibilityKeywords.forEach(kw => {
          if (userInput.includes(kw)) flexibilityScore += 2;
        });

        rigidityKeywords.forEach(kw => {
          if (userInput.includes(kw)) rigidityScore += 2;
        });

        const netScore = Math.max(1, 5 - rigidityScore + flexibilityScore);
        let level = '';
        if (netScore <= 2) level = '僵化';
        else if (netScore <= 3) level = '有限';
        else if (netScore <= 4) level = '良好';
        else level = '灵活';

        return {
          score: netScore,
          level,
          flexibilityIndicators: flexibilityScore,
          rigidityIndicators: rigidityScore
        };
      }
    },

    /**
     * 综合评估函数
     */
    comprehensive: function(userInput) {
      const past = this.pastDepth.assess(userInput);
      const future = this.futureDepth.assess(userInput);
      const balance = this.balance.assess(past.score, future.score);
      const flexibility = this.flexibility.assess(userInput);

      const overallScore = (past.score + future.score + balance.score + flexibility.score) / 4;
      let overallLevel = '';
      if (overallScore <= 1.5) overallLevel = '时间深度狭窄';
      else if (overallScore <= 2.5) overallLevel = '时间深度有限';
      else if (overallScore <= 3.5) overallLevel = '时间深度良好';
      else overallLevel = '时间深度优秀';

      return {
        pastDepth: past,
        futureDepth: future,
        balance,
        flexibility,
        overallScore,
        overallLevel,
        summary: this._generateSummary(past, future, balance, flexibility, overallLevel)
      };
    },

    _generateSummary: function(past, future, balance, flexibility, overallLevel) {
      const summary = [];
      summary.push(`时间深度综合评估：${overallLevel} (${overallScore.toFixed(1)}/4)`);
      summary.push('');
      summary.push(`过去时间深度：${past.level} (${past.score}/4)`);
      summary.push(`  ${past.characteristics[0]}`);
      summary.push('');
      summary.push(`未来时间深度：${future.level} (${future.score}/4)`);
      summary.push(`  ${future.characteristics[0]}`);
      summary.push('');
      summary.push(`时间深度平衡性：${balance.type}`);
      summary.push(`  ${balance.characteristics[0]}`);
      summary.push('');
      summary.push(`时间深度灵活性：${flexibility.level} (${flexibility.score}/5)`);
      summary.push('');
      summary.push('建议干预方向:');
      if (past.score < 3) {
        summary.push(`  - 过去整合：${past.interventions[0]}`);
      }
      if (future.score < 3) {
        summary.push(`  - 未来规划：${future.interventions[0]}`);
      }
      if (balance.score < 3) {
        summary.push(`  - 平衡调整：${balance.interventions[0]}`);
      }

      return summary.join('\n');
    }
  },

  /**
   * 心理延展能力评估 (Psychological Extension Assessment)
   * 评估自我在时间中的延展和整合能力
   */
  psychologicalExtension: {
    /**
     * 自我连续性感知 (Self-Continuity)
     */
    selfContinuity: {
      name: '自我连续性感知',
      description: '感知现在的自己与过去/未来自我为同一人的程度',
      
      assess: function(userInput) {
        const continuityKeywords = ['我', '自己', '一直', '始终', '还是', '依然', '继续', '同样'];
        const changeKeywords = ['改变', '不同', '变了', '不像', '陌生', '新的'];
        const integrationKeywords = ['成长', '演变', '发展', '延续', '连接', '整合'];

        let continuityScore = 0;
        let changeScore = 0;
        let integrationScore = 0;

        continuityKeywords.forEach(kw => {
          if (userInput.includes(kw)) continuityScore += 1;
        });

        changeKeywords.forEach(kw => {
          if (userInput.includes(kw)) changeScore += 1;
        });

        integrationKeywords.forEach(kw => {
          if (userInput.includes(kw)) integrationScore += 2;
        });

        // 高连续性 + 高整合 = 健康
        // 高连续性 + 低整合 = 僵化
        // 低连续性 + 高整合 = 成长中
        // 低连续性 + 低整合 = 断裂

        let level = '';
        if (integrationScore >= 4 && continuityScore >= 3) {
          level = '健康连续';
        } else if (continuityScore >= 4 && integrationScore < 2) {
          level = '僵化连续';
        } else if (integrationScore >= 4 && continuityScore < 2) {
          level = '成长整合';
        } else if (changeScore >= 3 && integrationScore < 2) {
          level = '断裂感';
        } else {
          level = '混合状态';
        }

        return {
          level,
          scores: {
            continuity: continuityScore,
            change: changeScore,
            integration: integrationScore
          }
        };
      }
    },

    /**
     * 身份时间整合 (Identity Temporal Integration)
     */
    identityIntegration: {
      name: '身份时间整合',
      description: '将不同时期的身份整合为连贯整体的能力',
      
      assess: function(userInput) {
        const identityKeywords = ['身份', '角色', '我是', '什么样的人', '定义'];
        const timeKeywords = ['过去', '现在', '未来', '以前', '以后', '当时', '现在'];
        const integrationKeywords = ['一致', '连贯', '统一', '整合', '和谐'];

        let identitySalience = 0;
        let timeAwareness = 0;
        let integrationLevel = 0;

        identityKeywords.forEach(kw => {
          if (userInput.includes(kw)) identitySalience += 2;
        });

        timeKeywords.forEach(kw => {
          if (userInput.includes(kw)) timeAwareness += 1;
        });

        integrationKeywords.forEach(kw => {
          if (userInput.includes(kw)) integrationLevel += 3;
        });

        const totalScore = identitySalience + timeAwareness + integrationLevel;
        let level = '';
        if (totalScore >= 15) level = '高度整合';
        else if (totalScore >= 10) level = '良好整合';
        else if (totalScore >= 5) level = '部分整合';
        else level = '整合不足';

        return {
          level,
          score: totalScore,
          breakdown: {
            identitySalience,
            timeAwareness,
            integrationLevel
          }
        };
      }
    },

    /**
     * 生命故事连贯性 (Life Story Coherence)
     */
    lifeStoryCoherence: {
      name: '生命故事连贯性',
      description: '将生命经历组织为连贯叙事的能力',
      
      assess: function(userInput) {
        const narrativeKeywords = ['故事', '经历', '旅程', '道路', '篇章', '阶段'];
        const coherenceKeywords = ['因为', '所以', '导致', '结果', '因此', '于是'];
        const themeKeywords = ['主题', '模式', '重复', '一直', '核心', '主线'];
        const meaningKeywords = ['意义', '目的', '价值', '使命', '为什么'];

        let narrativeScore = 0;
        let coherenceScore = 0;
        let themeScore = 0;
        let meaningScore = 0;

        narrativeKeywords.forEach(kw => {
          if (userInput.includes(kw)) narrativeScore += 2;
        });

        coherenceKeywords.forEach(kw => {
          if (userInput.includes(kw)) coherenceScore += 1;
        });

        themeKeywords.forEach(kw => {
          if (userInput.includes(kw)) themeScore += 2;
        });

        meaningKeywords.forEach(kw => {
          if (userInput.includes(kw)) meaningScore += 2;
        });

        const totalScore = narrativeScore + coherenceScore + themeScore + meaningScore;
        let level = '';
        if (totalScore >= 20) level = '高度连贯';
        else if (totalScore >= 12) level = '良好连贯';
        else if (totalScore >= 6) level = '部分连贯';
        else level = '连贯性弱';

        return {
          level,
          score: totalScore,
          breakdown: {
            narrative: narrativeScore,
            coherence: coherenceScore,
            theme: themeScore,
            meaning: meaningScore
          }
        };
      }
    },

    /**
     * 跨时间价值一致性 (Cross-Temporal Value Consistency)
     */
    valueConsistency: {
      name: '跨时间价值一致性',
      description: '价值观在时间中的稳定性和一致性',
      
      assess: function(userInput) {
        const valueKeywords = ['价值', '重要', '相信', '原则', '核心', '在乎'];
        const consistencyKeywords = ['一直', '始终', '从未改变', '坚持', '坚守'];
        const evolutionKeywords = ['演变', '深化', '调整', '成熟', '发展'];

        let valueSalience = 0;
        let consistencyScore = 0;
        let evolutionScore = 0;

        valueKeywords.forEach(kw => {
          if (userInput.includes(kw)) valueSalience += 2;
        });

        consistencyKeywords.forEach(kw => {
          if (userInput.includes(kw)) consistencyScore += 2;
        });

        evolutionKeywords.forEach(kw => {
          if (userInput.includes(kw)) evolutionScore += 1; // 健康的演变是积极的
        });

        const totalScore = valueSalience + consistencyScore + Math.min(evolutionScore, 3);
        let level = '';
        if (totalScore >= 12) level = '高度一致';
        else if (totalScore >= 8) level = '良好一致';
        else if (totalScore >= 4) level = '部分一致';
        else level = '一致性弱';

        return {
          level,
          score: totalScore,
          breakdown: {
            valueSalience,
            consistency: consistencyScore,
            healthyEvolution: Math.min(evolutionScore, 3)
          }
        };
      }
    },

    /**
     * 综合评估函数
     */
    comprehensive: function(userInput) {
      const selfContinuity = this.selfContinuity.assess(userInput);
      const identityIntegration = this.identityIntegration.assess(userInput);
      const lifeStory = this.lifeStoryCoherence.assess(userInput);
      const valueConsistency = this.valueConsistency.assess(userInput);

      const scores = [
        selfContinuity.scores.continuity + selfContinuity.scores.integration,
        identityIntegration.score,
        lifeStory.score,
        valueConsistency.score
      ];

      const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      let overallLevel = '';
      if (overallScore >= 12) overallLevel = '心理延展优秀';
      else if (overallScore >= 8) overallLevel = '心理延展良好';
      else if (overallScore >= 5) overallLevel = '心理延展中等';
      else overallLevel = '心理延展有限';

      return {
        selfContinuity,
        identityIntegration,
        lifeStory,
        valueConsistency,
        overallScore,
        overallLevel
      };
    }
  },

  /**
   * 时间深度干预练习 (Temporal Depth Interventions)
   * 4 个核心练习技术
   */
  interventions: {
    /**
     * 练习 1: 时间深度地图绘制
     * 时长：40-50 分钟
     */
    temporalDepthMapping: {
      name: '时间深度地图绘制',
      duration: '40-50 分钟',
      goal: '可视化个人的时间深度范围，识别扩展机会',
      steps: [
        {
          step: 1,
          name: '准备与放松',
          duration: '5 分钟',
          instructions: [
            '准备大张纸或白板',
            '准备彩色笔（不同颜色代表不同时间段）',
            '进行 3 分钟深呼吸，进入反思状态'
          ]
        },
        {
          step: 2,
          name: '过去时间轴绘制',
          duration: '15 分钟',
          instructions: [
            '在纸的左侧画一条从出生到现在的时间轴',
            '用不同颜色标记不同年份段',
            '对每个能清晰回忆的时期，写下 3-5 个关键词',
            '注意哪些时期记忆清晰，哪些模糊'
          ]
        },
        {
          step: 3,
          name: '未来时间轴绘制',
          duration: '15 分钟',
          instructions: [
            '在纸的右侧画一条从现在到未来的时间轴',
            '标记 1 年、3 年、5 年、10 年后的时间点',
            '对每个时间点，写下你希望的状态和目标',
            '注意哪些时期想象清晰，哪些模糊'
          ]
        },
        {
          step: 4,
          name: '深度分析与整合',
          duration: '10 分钟',
          instructions: [
            '观察你的时间深度地图',
            '识别记忆/想象的"空白区域"',
            '思考如何扩展这些区域',
            '写下 3 个扩展时间深度的具体行动'
          ]
        }
      ],
      expectedOutcomes: [
        '清晰可视化个人时间深度范围',
        '识别时间深度的优势和局限',
        '制定时间深度扩展计划',
        '增强时间自我觉察'
      ]
    },

    /**
     * 练习 2: 跨时间自我信件
     * 时长：30-40 分钟
     */
    crossTemporalLetters: {
      name: '跨时间自我信件',
      duration: '30-40 分钟',
      goal: '建立与过去和未来自我的情感连接',
      steps: [
        {
          step: 1,
          name: '给过去自我写信',
          duration: '15 分钟',
          instructions: [
            '选择 5 年或 10 年前的自己',
            '写给那时的自己：你现在过得怎么样',
            '感谢过去自己的选择和努力',
            '告诉过去自己你从经历中学到了什么'
          ]
        },
        {
          step: 2,
          name: '给未来自我写信',
          duration: '15 分钟',
          instructions: [
            '选择 5 年或 10 年后的自己',
            '写给未来的自己：你现在的状态和目标',
            '询问未来自我一些问题',
            '表达对未来的期待和承诺'
          ]
        },
        {
          step: 3,
          name: '整合反思',
          duration: '5-10 分钟',
          instructions: [
            '阅读两封信',
            '注意你的情绪感受',
            '识别贯穿时间的主题和价值',
            '写下 1-2 个时间连接的洞察'
          ]
        }
      ],
      expectedOutcomes: [
        '增强与过去/未来自我的情感连接',
        '提高自我连续性感知',
        '增强跨时间价值一致性',
        '提供情感支持和方向感'
      ]
    },

    /**
     * 练习 3: 生命故事时间线
     * 时长：50-60 分钟
     */
    lifeStoryTimeline: {
      name: '生命故事时间线',
      duration: '50-60 分钟',
      goal: '将生命经历整合为连贯的叙事',
      steps: [
        {
          step: 1,
          name: '生命章节划分',
          duration: '10 分钟',
          instructions: [
            '将你的生命划分为 5-8 个"章节"',
            '给每个章节起一个标题（如"求学期"、"探索期"）',
            '标记每个章节的时间范围',
            '写下每个章节的核心主题'
          ]
        },
        {
          step: 2,
          name: '关键事件标注',
          duration: '15 分钟',
          instructions: [
            '在每个章节中，标记 2-3 个关键事件',
            '对每个事件，写下：发生了什么、你的感受、你的学习',
            '识别事件之间的因果联系'
          ]
        },
        {
          step: 3,
          name: '主题识别',
          duration: '15 分钟',
          instructions: [
            '跨章节寻找重复出现的主题',
            '识别贯穿生命的核心价值观',
            '注意成长和演变的轨迹',
            '写下你的生命故事的"主线"'
          ]
        },
        {
          step: 4,
          name: '叙事整合',
          duration: '10-15 分钟',
          instructions: [
            '用 3-5 段话总结你的生命故事',
            '包括：起点、关键转折、当前状态、未来方向',
            '强调连贯性和意义',
            '保存这份叙事，定期更新'
          ]
        }
      ],
      expectedOutcomes: [
        '增强生命故事的连贯性',
        '识别跨时间的主题和模式',
        '增强身份整合感',
        '提供生命意义感'
      ]
    },

    /**
     * 练习 4: 价值连续性检查
     * 时长：20-30 分钟
     */
    valueContinuityCheck: {
      name: '价值连续性检查',
      duration: '20-30 分钟',
      goal: '检视价值观在时间中的一致性和演变',
      steps: [
        {
          step: 1,
          name: '核心价值识别',
          duration: '5-10 分钟',
          instructions: [
            '列出你当前最重要的 5-8 个核心价值观',
            '对每个价值观，写下它对你的意义',
            '排序这些价值观的重要性'
          ]
        },
        {
          step: 2,
          name: '历史追溯',
          duration: '10 分钟',
          instructions: [
            '对每个核心价值观，追溯它的起源',
            '什么时候开始重视这个价值？',
            '什么经历塑造了这个价值？',
            '这个价值如何随时间演变？'
          ]
        },
        {
          step: 3,
          name: '未来投射',
          duration: '5-10 分钟',
          instructions: [
            '想象 10 年后的自己',
            '这些价值观会如何变化或保持？',
            '哪些价值会变得更重要？',
            '是否需要培养新的价值观？'
          ]
        },
        {
          step: 4,
          name: '一致性评估与调整',
          duration: '5 分钟',
          instructions: [
            '评估当前生活与核心价值观的一致性',
            '识别不一致的领域',
            '写下 1-3 个增强一致性的行动',
            '承诺在未来一周实施'
          ]
        }
      ],
      expectedOutcomes: [
        '增强跨时间价值一致性感知',
        '识别价值演变的健康轨迹',
        '增强生活与价值的一致性',
        '提供决策和规划的价值基础'
      ]
    }
  },

  /**
   * 主分析函数
   */
  analyze: function(userInput) {
    const temporalDepth = this.temporalDepthAssessment.comprehensive(userInput);
    const psychologicalExtension = this.psychologicalExtension.comprehensive(userInput);
    
    // 生成干预推荐
    const recommendations = this._generateRecommendations(temporalDepth, psychologicalExtension);

    return {
      temporalDepth,
      psychologicalExtension,
      recommendations,
      summary: this._generateSummary(temporalDepth, psychologicalExtension)
    };
  },

  _generateRecommendations: function(temporalDepth, psychologicalExtension) {
    const recommendations = [];

    if (temporalDepth.pastDepth.score < 3) {
      recommendations.push({
        priority: '高',
        intervention: '时间深度地图绘制',
        reason: '扩展过去时间深度，增强记忆整合'
      });
    }

    if (temporalDepth.futureDepth.score < 3) {
      recommendations.push({
        priority: '高',
        intervention: '跨时间自我信件',
        reason: '增强与未来自我的连接，扩展未来时间深度'
      });
    }

    if (temporalDepth.balance.score < 3) {
      recommendations.push({
        priority: '中',
        intervention: '价值连续性检查',
        reason: '调整时间深度平衡，增强价值一致性'
      });
    }

    if (psychologicalExtension.lifeStory.level.includes('弱') || psychologicalExtension.lifeStory.level.includes('部分')) {
      recommendations.push({
        priority: '高',
        intervention: '生命故事时间线',
        reason: '增强生命故事的连贯性和意义感'
      });
    }

    return recommendations;
  },

  _generateSummary: function(temporalDepth, psychologicalExtension) {
    const summary = [];

    summary.push('时间深度与心理延展评估:');
    summary.push('');
    summary.push(`时间深度综合：${temporalDepth.overallLevel} (${temporalDepth.overallScore.toFixed(1)}/4)`);
    summary.push(`  过去深度：${temporalDepth.pastDepth.level} (${temporalDepth.pastDepth.score}/4)`);
    summary.push(`  未来深度：${temporalDepth.futureDepth.level} (${temporalDepth.futureDepth.score}/4)`);
    summary.push(`  平衡性：${temporalDepth.balance.type} (${temporalDepth.balance.score}/4)`);
    summary.push(`  灵活性：${temporalDepth.flexibility.level} (${temporalDepth.flexibility.score}/5)`);
    summary.push('');
    summary.push(`心理延展综合：${psychologicalExtension.overallLevel} (${psychologicalExtension.overallScore.toFixed(1)}/15)`);
    summary.push(`  自我连续性：${psychologicalExtension.selfContinuity.level}`);
    summary.push(`  身份整合：${psychologicalExtension.identityIntegration.level}`);
    summary.push(`  生命故事：${psychologicalExtension.lifeStory.level}`);
    summary.push(`  价值一致性：${psychologicalExtension.valueConsistency.level}`);

    return summary.join('\n');
  }
};

module.exports = TemporalDepthExtension;
