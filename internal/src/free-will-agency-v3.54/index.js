/**
 * 自由意志与能动性模块 v3.54.0 (Free Will & Agency Enhancement)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 自由意志权威理论
 * 
 * 核心理论来源:
 * - SEP Free Will (https://plato.stanford.edu/entries/freewill/)
 * - 古代至现代自由意志理论整合
 * - Frankfurt Cases 与道德责任
 * - 意志薄弱 (Akrasia) 理论
 * - 相容论 vs 自由意志论
 * 
 * 新增功能 v3.54.0:
 * - Frankfurt Cases 道德责任评估框架
 * - 意志薄弱 (Akrasia) 识别与干预
 * - 相容论/自由意志论对话框架
 * - 道德责任评估工具
 * - 自由意志信念量表 (Free Will Belief Scale)
 * 
 * 可操作技术:
 * - Frankfurt Cases 思想实验引导
 * - 意志薄弱干预策略
 * - 道德责任归因分析
 * - 自由意志信念探索
 * - 能动性增强练习
 * 
 * @module free-will-agency-v3.54
 * @version 3.54.0
 * @author HeartFlow Team
 */

const FreeWillAgencyV354 = {
  /**
   * 模块元信息
   */
  meta: {
    name: '自由意志与能动性 v3.54',
    version: '3.54.0',
    source: 'SEP Free Will + Frankfurt Cases + Akrasia Theory',
    description: '基于 SEP 自由意志理论与道德心理学的深度自我整合模块',
    upgradeDate: '2026-03-30'
  },

  /**
   * Frankfurt Cases 道德责任评估框架
   * 
   * Harry Frankfurt (1969) 提出的思想实验，挑战"能做 otherwise"是道德责任必要条件的观点
   * 
   * 核心论证:
   * - 设计一个场景：Agent 做出选择 X
   * - 存在一个"强制机制"会在 Agent 想选 Y 时干预，强制选 X
   * - 但 Agent 实际上自己选择了 X，强制机制未启动
   * - 结论：Agent 对选 X 负有道德责任，尽管他不能选 Y
   * 
   * 意义:
   * - 挑战 Principle of Alternative Possibilities (PAP)
   * - 支持相容论：即使决定论为真，仍可有道德责任
   * - 道德责任的关键在于行动的来源 (source)，而非替代可能性
   */
  frankfurtCases: {
    name: 'Frankfurt Cases 框架',
    
    originalCase: {
      name: 'Frankfurt 原始案例',
      scenario: `
Jones 在考虑是否投票给候选人 A 或 B。
Black 希望 Jones 投票给 A，并 secretly 植入了一种装置。
如果 Jones 自己想选 A，装置不干预。
如果 Jones 想选 B，装置会强制他选 A。
实际上，Jones 自己想选 A，装置从未启动。

问题：Jones 对他选 A 负有道德责任吗？
      `,
      intuitions: {
        compatibilist: '是 - Jones 的行动来源于他自己的意志',
        libertarian: '否 - Jones 不能选 B，所以没有真正的自由',
        sourceCompatibilist: '是 - 关键在于行动是否来源于 Agent 的真实自我'
      },
      philosophicalSignificance: [
        '挑战 PAP (Principle of Alternative Possibilities)',
        '支持 source compatibilism - 责任在于行动来源',
        '区分"能做 otherwise"和"道德责任"'
      ]
    },

    /**
     * Frankfurt Cases 变体
     */
    variants: [
      {
        name: '道德 Frankfurt Case',
        scenario: '一个人自己想做好事，但即使他不想做，也会被强制做好事',
        question: '他对做好事负有道德功劳吗？',
        insight: '道德功劳同样依赖于行动来源，而非强制'
      },
      {
        name: '成瘾 Frankfurt Case',
        scenario: '成瘾者自己想吸毒，但即使他不想吸，也会被强制吸毒',
        question: '他对吸毒行为负有道德责任吗？',
        insight: '成瘾削弱但不消除责任 - 关键在于意志的认同程度'
      },
      {
        name: '心理疾病 Frankfurt Case',
        scenario: '强迫症患者想洗手，但即使他不想洗，也会被强迫洗手',
        question: '他对洗手行为负有责任吗？',
        insight: '心理疾病可能削弱意志认同，影响责任归因'
      }
    ],

    /**
     * 应用：道德责任评估框架
     */
    moralResponsibilityAssessment: {
      name: '道德责任评估框架',
      
      dimensions: [
        {
          name: '意志认同 (Volitional Identification)',
          description: 'Agent 是否认同驱动行动的欲望/动机？',
          questions: [
            '这个行动反映了你的真实价值观吗？',
            '你认同驱动这个行动的欲望吗？',
            '如果有机会反思，你会支持这个动机吗？'
          ],
          scoring: {
            high: '高度认同 - 行动反映真实自我',
            medium: '部分认同 - 混合动机',
            low: '低认同 - 行动与价值观冲突'
          }
        },
        {
          name: '理性反应 (Rational Responsiveness)',
          description: 'Agent 的行动是否对理由敏感？',
          questions: [
            '如果有更好的理由，你会改变行动吗？',
            '你的行动是否基于对情境的理解？',
            '你能解释为什么这样做吗？'
          ],
          scoring: {
            high: '高度理性敏感 - 行动基于充分理由',
            medium: '部分理性敏感 - 混合动机',
            low: '低理性敏感 - 冲动或强迫驱动'
          }
        },
        {
          name: '控制程度 (Degree of Control)',
          description: 'Agent 对行动有多少实际控制？',
          questions: [
            '你能在行动上暂停并反思吗？',
            '有外部强制或内部强迫吗？',
            '你能想象自己做不同的选择吗？'
          ],
          scoring: {
            high: '高控制 - 充分反思和选择能力',
            medium: '中等控制 - 部分限制',
            low: '低控制 - 显著强制或强迫'
          }
        },
        {
          name: '替代可能性 (Alternative Possibilities)',
          description: 'Agent 是否真的有替代选择？(Frankfurt 挑战此条件的必要性)',
          questions: [
            '在相同情境下，你能做不同的选择吗？',
            '有什么因素限制了你的选择？',
            '这些限制是内部的还是外部的？'
          ],
          scoring: {
            high: '充分替代可能 - 多个真实选项',
            medium: '有限替代可能 - 部分限制',
            low: '极少替代可能 - 高度受限'
          },
          frankfurtNote: '根据 Frankfurt，此条件对道德责任可能不是必要的'
        }
      ],

      /**
       * 评估函数
       */
      assess: function(userNarrative, actionDescription) {
        const assessment = {
          timestamp: new Date().toISOString(),
          action: actionDescription,
          dimensions: {},
          overallResponsibility: 'pending',
          recommendations: []
        };

        // 简化评估逻辑 (实际应用中需要更复杂的 NLP 分析)
        const narrative = userNarrative.toLowerCase();

        // 意志认同评估
        if (narrative.includes('我想要') || narrative.includes('我决定') || narrative.includes('我选择')) {
          assessment.dimensions.volitionalIdentification = {
            score: 'high',
            evidence: '用户表达了明确的意志认同',
            analysis: '行动似乎来源于用户的真实自我'
          };
        } else if (narrative.includes'我必须' || narrative.includes('我被迫') || narrative.includes('没办法')) {
          assessment.dimensions.volitionalIdentification = {
            score: 'low',
            evidence: '用户表达了外部强制或缺乏选择',
            analysis: '行动可能不反映用户的真实意愿'
          };
        } else {
          assessment.dimensions.volitionalIdentification = {
            score: 'medium',
            evidence: '混合或未明确的意志表达',
            analysis: '需要进一步探索意志认同程度'
          };
        }

        // 理性反应评估
        if (narrative.includes('因为') || narrative.includes('所以') || narrative.includes('考虑到')) {
          assessment.dimensions.rationalResponsiveness = {
            score: 'high',
            evidence: '用户展示了理由基的推理',
            analysis: '行动似乎基于理性考量'
          };
        } else {
          assessment.dimensions.rationalResponsiveness = {
            score: 'medium',
            evidence: '理性基不明确',
            analysis: '需要进一步探索行动的理性基础'
          };
        }

        // 控制程度评估
        if (narrative.includes('我可以选择') || narrative.includes('我能控制') || narrative.includes('我决定')) {
          assessment.dimensions.degreeOfControl = {
            score: 'high',
            evidence: '用户表达了控制感',
            analysis: '用户感知到对行动的控制'
          };
        } else if (narrative.includes('我控制不了') || narrative.includes('我忍不住') || narrative.includes('失控')) {
          assessment.dimensions.degreeOfControl = {
            score: 'low',
            evidence: '用户表达了控制感缺失',
            analysis: '用户感知到控制受限'
          };
        } else {
          assessment.dimensions.degreeOfControl = {
            score: 'medium',
            evidence: '控制感不明确',
            analysis: '需要进一步探索控制程度'
          };
        }

        // 整体责任评估
        const scores = Object.values(assessment.dimensions).map(d => 
          d.score === 'high' ? 2 : d.score === 'medium' ? 1 : 0
        );
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avgScore >= 1.5) {
          assessment.overallResponsibility = 'high - 用户对行动负有较高的道德责任';
        } else if (avgScore >= 1) {
          assessment.overallResponsibility = 'medium - 用户对行动负有中等道德责任';
        } else {
          assessment.overallResponsibility = 'low - 用户对行动的道德责任较低，可能存在削弱因素';
        }

        // 生成建议
        assessment.recommendations = this.generateResponsibilityRecommendations(assessment);

        return assessment;
      },

      generateResponsibilityRecommendations: function(assessment) {
        const recommendations = [];

        if (assessment.dimensions.volitionalIdentification?.score === 'low') {
          recommendations.push({
            area: '意志认同',
            suggestion: '探索行动背后的真实动机 - 这个行动反映了你的价值观吗？',
            exercise: '价值观澄清练习：列出你的核心价值观，评估行动与价值观的一致性'
          });
        }

        if (assessment.dimensions.rationalResponsiveness?.score === 'low') {
          recommendations.push({
            area: '理性反应',
            suggestion: '在行动前暂停，问自己"为什么这样做？"',
            exercise: '理由清单：写下支持和不支持行动的至少 3 个理由'
          });
        }

        if (assessment.dimensions.degreeOfControl?.score === 'low') {
          recommendations.push({
            area: '控制程度',
            suggestion: '识别控制受限的因素 - 是外部强制还是内部强迫？',
            exercise: '控制圈练习：区分你能控制的和不能控制的，专注前者'
          });
        }

        return recommendations;
      }
    }
  },

  /**
   * 意志薄弱 (Akrasia) 理论与干预
   * 
   * Akrasia: 明知什么是最好的，却不做
   * 又称：weakness of will, incontinence
   * 
   * 历史来源:
   * - Aristotle: Nicomachean Ethics Book VII
   * - 明知善而行恶的心理机制
   * - 欲望压倒理性判断
   * 
   * 现代理论:
   * - 时间不一致偏好 (hyperbolic discounting)
   * - 自我控制失败
   * - 动机冲突
   */
  akrasia: {
    name: '意志薄弱 (Akrasia)',
    
    aristotelianAnalysis: {
      name: '亚里士多德分析',
      source: 'Nicomachean Ethics Book VII',
      
      coreInsight: '意志薄弱者知道什么是善，但被欲望压倒而无法行动',
      
      distinction: {
        akrasia: '意志薄弱 - 知道善但被欲望压倒',
        akolasia: '放纵 - 认为追求感官快乐是善的',
        enkrateia: '自制 - 有坏欲望但能克制',
        sophrosyne: '节制 - 没有坏欲望'
      },
      
      psychologicalMechanism: [
        '实践三段论失效：大前提 (应该做 X) 未能在行动中生效',
        '欲望遮蔽理性：强烈欲望暂时"遮蔽"理性判断',
        '部分无知：行动时并非完全知道什么是善'
      ]
    },

    /**
     * 现代心理学视角
     */
    modernPsychology: {
      name: '现代心理学视角',
      
      theories: [
        {
          name: '时间不一致偏好 (Hyperbolic Discounting)',
          description: '人们过度折扣未来收益，偏好即时满足',
          example: '知道应该锻炼 (长期收益)，但选择看电视 (即时满足)',
          intervention: '承诺机制、预先承诺、减少诱惑'
        },
        {
          name: '自我控制资源模型 (Ego Depletion)',
          description: '自我控制是有限资源，使用后暂时耗竭',
          example: '工作一天后更难抵制垃圾食品',
          intervention: '习惯养成、环境设计、自我同情'
        },
        {
          name: '动机冲突理论',
          description: '多个动机系统竞争，短期动机常战胜长期动机',
          example: '健康动机 vs 美食动机',
          intervention: '价值澄清、动机访谈、实施意图'
        }
      ]
    },

    /**
     * 意志薄弱识别框架
     */
    identification: {
      name: '意志薄弱识别',
      
      indicators: [
        '明知应该做 X，但持续不做',
        '事后后悔，但下次仍重复',
        '感到"被控制"或"身不由己"',
        '理性判断与实际行动脱节',
        '自我控制失败的模式'
      ],
      
      assessment: function(userNarrative) {
        const narrative = userNarrative.toLowerCase();
        const indicators = {
          knowledge: narrative.includes('我知道应该') || narrative.includes('我明白要') || narrative.includes'道理我懂',
          failure: narrative.includes('但我就是') || narrative.includes('却做不到') || narrative.includes('还是'),
          regret: narrative.includes('后悔') || narrative.includes('自责') || narrative.includes('又'),
          pattern: narrative.includes('总是') || narrative.includes('每次') || narrative.includes('又')
        };

        const score = Object.values(indicators).filter(v => v).length;
        
        return {
          indicators,
          score,
          likelihood: score >= 3 ? 'high - 很可能是意志薄弱模式' : score >= 2 ? 'medium - 可能存在意志薄弱' : 'low - 意志薄弱特征不明显',
          pattern: score >= 3 ? '识别到意志薄弱模式：明知应做但未能行动' : '未识别到明显的意志薄弱模式'
        };
      }
    },

    /**
     * 意志薄弱干预策略
     */
    interventions: {
      name: '意志薄弱干预',
      
      strategies: [
        {
          name: '实施意图 (Implementation Intentions)',
          description: '预先设定"如果 - 那么"计划',
          format: '如果 [情境]，那么我将 [行动]',
          example: '如果想吃零食，那么我先喝一杯水',
          evidence: 'Gollwitzer (1999) - 显著提高目标达成率',
          steps: [
            '识别触发意志薄弱的情境',
            '设计具体的"如果 - 那么"计划',
            '心理演练计划的执行',
            '在实际情境中实践'
          ]
        },
        {
          name: '承诺机制 (Commitment Devices)',
          description: '预先限制未来选择，防止意志薄弱',
          examples: [
            'Ulysses contract: 像奥德修斯把自己绑在桅杆上',
            '金钱承诺：失败就捐钱给讨厌的组织',
            '公开承诺：向他人宣布目标',
            '技术限制：使用网站屏蔽软件'
          ],
          steps: [
            '识别最可能失败的情境',
            '设计有效的承诺机制',
            '预先设置机制 (在意志力强时)',
            '定期评估和调整'
          ]
        },
        {
          name: '环境设计 (Environment Design)',
          description: '改变环境减少诱惑，增加目标行为的便利性',
          principles: [
            '增加坏行为的摩擦 (把零食放高处)',
            '减少好行为的摩擦 (把运动服放床边)',
            '改变视觉线索 (移除诱惑触发物)',
            '创建支持性环境 (加入健身社群)'
          ],
          steps: [
            '审计当前环境的诱惑和障碍',
            '设计支持目标的环境',
            '实施环境改变',
            '持续优化'
          ]
        },
        {
          name: '正念觉察 (Mindful Awareness)',
          description: '觉察冲动而不立即行动，创造选择空间',
          techniques: [
            '冲动冲浪 (Urge Surfing): 觉察冲动如海浪般升起消退',
            'RAIN 技术：Recognize, Allow, Investigate, Non-identify',
            '身体扫描：觉察冲动在身体中的表现',
            '呼吸空间：在冲动和行动间创造暂停'
          ],
          steps: [
            '觉察冲动升起',
            '暂停，不立即行动',
            '好奇地观察冲动的身体感受',
            '等待冲动自然消退或减弱',
            '有意识地选择行动'
          ]
        },
        {
          name: '自我同情 (Self-Compassion)',
          description: '用同情而非批评对待意志薄弱失败',
          rationale: '自我批评削弱自我控制，自我同情增强恢复力',
          components: [
            '自我友善：像对待朋友一样对待自己',
            '共同人性：意志薄弱是普遍人类经验',
            '正念：平衡觉察负面情绪'
          ],
          steps: [
            '承认失败，不回避或否认',
            '用友善的语言对待自己',
            '记住这是人类共同经验',
            '问"我现在需要什么支持？"',
            '制定恢复计划'
          ]
        },
        {
          name: '价值澄清 (Value Clarification)',
          description: '深化对长期价值的连接，增强动机',
          exercises: [
            '价值清单：列出对你最重要的 5 个价值',
            '价值 - 行动对齐：评估当前行动与价值的一致性',
            '未来自我可视化：连接行动与未来自我',
            '价值承诺：基于价值设定具体目标'
          ],
          steps: [
            '反思什么对你真正重要',
            '识别与价值冲突的行为',
            '设计价值一致的行动',
            '定期回顾和调整'
          ]
        }
      ],

      /**
       * 根据用户情况推荐干预策略
       */
      recommendInterventions: function(akrasiaAssessment, context = {}) {
        const recommendations = [];

        if (akrasiaAssessment.likelihood === 'high' || akrasiaAssessment.likelihood === 'medium') {
          // 根据具体情况推荐
          if (context.immediateGratification) {
            recommendations.push({
              strategy: '实施意图',
              rationale: '针对即时满足倾向，预先设定"如果 - 那么"计划',
              priority: 'high'
            });
            recommendations.push({
              strategy: '承诺机制',
              rationale: '预先限制选择，防止冲动决策',
              priority: 'medium'
            });
          }

          if (context.environmentalTriggers) {
            recommendations.push({
              strategy: '环境设计',
              rationale: '减少环境中的诱惑触发',
              priority: 'high'
            });
          }

          if (context.emotionalEating || context.stressRelated) {
            recommendations.push({
              strategy: '正念觉察',
              rationale: '觉察情绪驱动的冲动',
              priority: 'high'
            });
            recommendations.push({
              strategy: '自我同情',
              rationale: '减少情绪性自我批评',
              priority: 'medium'
            });
          }

          if (context.lackOfMotivation) {
            recommendations.push({
              strategy: '价值澄清',
              rationale: '增强内在动机',
              priority: 'high'
            });
          }

          // 默认推荐
          if (recommendations.length === 0) {
            recommendations.push({
              strategy: '实施意图',
              rationale: '通用有效的意志薄弱干预',
              priority: 'high'
            });
            recommendations.push({
              strategy: '环境设计',
              rationale: '减少自我控制负担',
              priority: 'medium'
            });
          }
        }

        return recommendations;
      }
    }
  },

  /**
   * 自由意志信念探索
   * 帮助用户探索和理解自己对自由意志的信念
   */
  freeWillBeliefs: {
    name: '自由意志信念探索',
    
    /**
     * 自由意志信念量表 (简化版)
     */
    beliefScale: {
      name: '自由意志信念量表',
      
      questions: [
        {
          id: 1,
          text: '人的行为是由先前的原因决定的，自由意志是一种幻觉',
          dimension: 'determinism',
          reverse: true
        },
        {
          id: 2,
          text: '人们可以自由选择，不受因果律的限制',
          dimension: 'libertarianism',
          reverse: false
        },
        {
          id: 3,
          text: '即使行为由原因决定，人们仍然可以为自己的行为负责',
          dimension: 'compatibilism',
          reverse: false
        },
        {
          id: 4,
          text: '道德责任要求人们能够做出不同的选择',
          dimension: 'pap',
          reverse: false
        },
        {
          id: 5,
          text: '人的选择最终由基因和环境决定',
          dimension: 'determinism',
          reverse: true
        },
        {
          id: 6,
          text: '人们有能力超越因果决定，做出真正自由的选择',
          dimension: 'libertarianism',
          reverse: false
        }
      ],

      scoring: {
        determinism: '决定论倾向 - 相信行为由先前原因决定',
        libertarianism: '自由意志论倾向 - 相信人能做真正自由的选择',
        compatibilism: '相容论倾向 - 相信决定论与自由/责任相容',
        pap: 'PAP 倾向 - 相信道德责任要求替代可能性'
      },

      interpret: function(scores) {
        const interpretation = {
          profile: '',
          dominant: '',
          implications: []
        };

        const maxScore = Math.max(...Object.values(scores));
        const dominant = Object.keys(scores).find(k => scores[k] === maxScore);

        interpretation.dominant = dominant;
        
        switch(dominant) {
          case 'determinism':
            interpretation.profile = '决定论倾向 - 你可能倾向于认为行为由因果决定';
            interpretation.implications = [
              '可能更容易理解他人的行为 (减少道德愤怒)',
              '可能需要增强个人能动性感',
              '适合探索相容论视角'
            ];
            break;
          case 'libertarianism':
            interpretation.profile = '自由意志论倾向 - 你可能相信人能做出真正自由的选择';
            interpretation.implications = [
              '可能有较强的个人责任观',
              '可能对决定论论证感到挑战',
              '适合探索自由意志的哲学基础'
            ];
            break;
          case 'compatibilism':
            interpretation.profile = '相容论倾向 - 你可能相信决定论与自由/责任可以共存';
            interpretation.implications = [
              '平衡的视角',
              '适合深入探讨 Frankfurt Cases',
              '可能欣赏源相容论 (source compatibilism)'
            ];
            break;
          default:
            interpretation.profile = '混合或未明确倾向';
        }

        return interpretation;
      }
    },

    /**
     * 哲学对话框架
     * 引导用户探索自由意志问题
     */
    philosophicalDialogue: {
      name: '自由意志哲学对话',
      
      topics: [
        {
          name: '决定论挑战',
          questions: [
            '如果所有事件都由先前原因决定，自由意志可能吗？',
            '量子力学的随机性能拯救自由意志吗？',
            '决定论是否意味着我们无法改变未来？'
          ],
          perspectives: {
            hardDeterminism: '决定论为真 → 自由意志是幻觉',
            libertarianism: '决定论为假 → 自由意志可能',
            compatibilism: '决定论与自由意志相容'
          }
        },
        {
          name: '道德责任',
          questions: [
            '什么条件下我们对行为负有道德责任？',
            'Frankfurt Cases 是否成功挑战了 PAP？',
            '如果没有自由意志，惩罚还有意义吗？'
          ],
          perspectives: {
            retributive: '应得惩罚 - 要求自由意志',
            consequentialist: '威慑/改造 - 不要求自由意志',
            restorative: '修复伤害 - 焦点在受害者'
          }
        },
        {
          name: '实践意义',
          questions: [
            '自由意志信念如何影响日常生活？',
            '相信/不相信自由意志，哪个更有益？',
            '如何在决定论世界中过有意义的生活？'
          ],
          practicalImplications: [
            '道德愤怒：相信自由意志可能增加对他人的愤怒',
            '个人责任：相信自由意志可能增强责任感',
            '心理健康：平衡的视角可能最有益'
          ]
        }
      ]
    }
  },

  /**
   * 综合应用：自由意志与能动性增强方案
   */
  integratedProgram: {
    name: '自由意志与能动性增强方案',
    
    description: '整合 Frankfurt Cases、意志薄弱干预、自由意志信念探索的综合方案',
    
    sessions: [
      {
        session: 1,
        title: '自由意志信念探索',
        duration: '30 分钟',
        activities: [
          '完成自由意志信念量表',
          '探索个人自由意志直觉',
          '讨论决定论挑战',
          '反思信念对生活的影响'
        ],
        outcome: '澄清个人自由意志信念和理解'
      },
      {
        session: 2,
        title: '道德责任评估',
        duration: '30 分钟',
        activities: [
          '学习 Frankfurt Cases',
          '评估具体行动的责任程度',
          '探索意志认同、理性反应、控制程度',
          '讨论削弱因素'
        ],
        outcome: '理解道德责任的多维性质'
      },
      {
        session: 3,
        title: '意志薄弱识别与干预',
        duration: '40 分钟',
        activities: [
          '识别个人意志薄弱模式',
          '学习意志薄弱理论 (Aristotle + 现代)',
          '选择并设计干预策略',
          '制定实施计划'
        ],
        outcome: '掌握意志薄弱干预工具'
      },
      {
        session: 4,
        title: '能动性增强实践',
        duration: '40 分钟',
        activities: [
          '回顾干预实施经验',
          '识别能动性增强的时刻',
          '设计持续实践计划',
          '整合自由意志信念与日常生活'
        ],
        outcome: '建立持续的能动性增强实践'
      }
    ],

    /**
     * 评估进展
     */
    progressAssessment: {
      dimensions: [
        '自由意志信念的清晰度',
        '道德责任判断的细致性',
        '意志薄弱干预的有效性',
        '日常生活中的能动性感',
        '自我控制的信心'
      ],
      
      track: function(baseline, current) {
        const progress = {};
        baseline.dimensions.forEach((dim, i) => {
          progress[dim] = {
            baseline: baseline.scores[i],
            current: current.scores[i],
            change: current.scores[i] - baseline.scores[i]
          };
        });
        return progress;
      }
    }
  }
};

module.exports = FreeWillAgencyV354;
