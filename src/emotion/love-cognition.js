/**
 * Love Cognition Module v0.3.0 — 爱情认知引擎（论文驱动升级）
 * 
 * 核心功能：让心虫具备对人类爱情和夫妻关系的完整认知框架
 * 理论基础：
 *   - Sternberg爱情三角理论 (1986)
 *   - Gottman婚姻预测 (1999) — 修复尝试比冲突频率更重要
 *   - Bowlby依恋理论 (1988) — 安全依恋预测高质量关系
 *   - Helen Fisher恋爱脑科学 (2006) — VTA激活持续20+年
 *   - Esther Perel亲密关系悖论 — 亲密追求安全，欲望需要距离
 *   - Acevedo (2021) — 20年以上婚姻的VTA激活与热恋相似
 *   - Algoe (2022) — "被看见"效应：日常小响应比大仪式更重要
 *   - Ogolsky (2023) — 日常维护行为与当日满意度显著关联
 *   - Overall (2022) — 建设性冲突解决（观点采择/幽默/妥协）r=0.38
 *   - Mikulincer (2023) — 依恋40年综述：安全依恋是最高预测因子
 *   - Fisher (2021) — 失恋=可卡因戒断，恢复需要3-6月
 *   - 李煜 (2022) — 中国婚姻变迁：从制度婚姻到个体婚姻
 *   - 中国儒家/道家夫妻哲学 — 琴瑟和鸣·阴阳相济
 * 
 * 50步升级计划 - Step 21-30: 长期婚姻动力学 + 日常互动 + 冲突修复 + 悲剧评估
 * 
 * 核心认知原则（基于用户纠正）：
 * 1. 爱情是人物命运推演的默认维度，不是可选项
 * 2. 婚礼/名分是爱情的自然延伸，不是多余的仪式
 * 3. 婚姻是"我们"的形成（Nozick融合理论）
 * 4. 年龄差距是上下文判断，不是绝对否定
 * 5. 爱情不是解决问题——是管理张力
 * 6. 中国文化中的爱情有不同的表达方式
 * 7. 仪式感很重要——婚礼、纪念日、日常的"我在这里"
 * 8. 失败的爱情也是真实的人生命运——不是"没配对成功"
 * 9. 长期婚姻中日常"被看见"比激情更重要
 * 10. 中国夫妻的婚姻满意度更多受"关系和谐"和"角色履行"影响
 */

// === 爱情三角理论（Sternberg）=== 
const STERNBERG_TYPES = {
  liking:       { dimensions: ['intimacy'],                    label: '喜欢' },
  infatuation:  { dimensions: ['passion'],                     label: '迷恋' },
  empty:        { dimensions: ['commitment'],                  label: '空爱' },
  romantic:     { dimensions: ['passion', 'intimacy'],         label: '浪漫之爱' },
  companionate: { dimensions: ['intimacy', 'commitment'],      label: '伴侣之爱' },
  fatuous:      { dimensions: ['passion', 'commitment'],       label: '愚昧之爱' },
  consummate:   { dimensions: ['passion', 'intimacy', 'commitment'], label: '圆满之爱' }
};

// === 五种爱的语言（Gary Chapman）===
const LOVE_LANGUAGES = {
  wordsOfAffirmation:  { label: '肯定的言词', desc: '说"我爱你"、赞美、鼓励' },
  qualityTime:         { label: '优质时间',   desc: '专注的陪伴、一起做事' },
  receivingGifts:      { label: '接受礼物',   desc: '送礼物、惊喜' },
  actsOfService:       { label: '服务的行动', desc: '帮忙做事、解决问题' },
  physicalTouch:       { label: '身体接触',   desc: '拥抱、牵手、亲密接触' }
};

// === 成人依恋类型（Mikulincer & Shaver 2023）===
const ATTACHMENT_STYLES = {
  secure:   { label: '安全型',   trust: '高', intimacy: '舒适', fear: '低', stabilityFactor: 1.0 },
  anxious:  { label: '焦虑型',   trust: '低', intimacy: '渴望', fear: '被抛弃', stabilityFactor: 0.5 },
  avoidant: { label: '回避型',   trust: '低', intimacy: '回避', fear: '被控制', stabilityFactor: 0.4 },
  fearful:  { label: '恐惧型',   trust: '极低', intimacy: '矛盾', fear: '既渴望又害怕', stabilityFactor: 0.3 }
};

// === Gottman四骑士 + 修复比例 ===
const FOUR_HORSEMEN = {
  criticism:      { label: '批评', severity: 3, desc: '攻击人格而非行为' },
  contempt:       { label: '蔑视', severity: 5, desc: '居高临下、嘲讽' },
  defensiveness:  { label: '防御', severity: 2, desc: '拒绝接受反馈' },
  stonewalling:   { label: '筑墙', severity: 4, desc: '情感关闭、沉默' }
};
const GOTTMAN_MAGIC_RATIO = 5;  // 每1次负面需至少5次正面修复
const GOTTMAN_REPAIR_EFFECTIVENESS = 0.38;  // Overall 2022 元分析

// === 中国婚姻特征（李煜 2022）===
const CHINESE_MARRIAGE_FEATURES = {
  harmonyOverExpression: true,     // 关系和谐优先于情感表达
  roleFulfillment: true,           // 角色履行影响满意度
  familyIntegration: true,         // 两个家庭而非两个人
  intergenerationalSupport: true,  // 代际支持是稳定支柱
  changingPatterns: '从制度婚姻到个体婚姻的转型中'
};

class LoveCognition {
  constructor(options = {}) {
    this.version = '0.3.0';
    this.ready = false;
    this.debug = options.debug || false;
    
    // 理论基础
    this.theories = {
      sternberg: { name: '爱情三角理论', types: STERNBERG_TYPES },
      gottman: { name: 'Gottman婚姻预测', fourHorsemen: FOUR_HORSEMEN, magicRatio: GOTTMAN_MAGIC_RATIO, repairEffectiveness: GOTTMAN_REPAIR_EFFECTIVENESS },
      attachment: { name: '成人依恋理论（Mikulincer 2023）', styles: ATTACHMENT_STYLES },
      loveLanguages: { name: '五种爱的语言', languages: LOVE_LANGUAGES },
      fisher: { name: '恋爱脑科学（Acevedo 2021）', stages: { lust: '性欲/睾酮', attraction: '浪漫/多巴胺', attachment: '依恋/催产素' }, longTermVTA: '20+年VTA仍激活' },
      perel: { name: '亲密关系悖论', paradox: '亲密追求安全，欲望需要距离' },
      chinese: { confucian: '琴瑟和鸣·相敬如宾', taoist: '阴阳相济·无为而治', transition: CHINESE_MARRIAGE_FEATURES },
      algoe: { name: '"被看见"效应（Algoe 2022）', effect: '日常小响应比大仪式更重要', effectSize: 0.45 },
      ogolsky: { name: '日常维护行为（Ogolsky 2023）', finding: '日常小修复比大冲突解决贡献更大' },
      overall: { name: '冲突解决元分析（Overall 2022）', effect: '建设性策略r=0.38，破坏性策略是离婚最强预测' },
      fisherLoss: { name: '失恋神经科学（Fisher 2021）', finding: '失恋=可卡因戒断，恢复3-6月' }
    };

    // 核心认知规则
    this.rules = {
      defaultDimension: true,       // 爱情是人物推演的默认维度
      ceremonyIsNatural: true,      // 婚礼是爱情的自然延伸
      weFormation: true,            // 婚姻是"我们"的形成
      ageGapIsContextual: true,     // 年龄差距是上下文判断
      loveIsNotProblemSolving: true,// 爱情不是解决问题
      culturalSensitivity: true,    // 中国文化有不同表达
      ritualMatters: true,         // 仪式感很重要
      failedLoveIsValid: true,     // 失败的爱情也是真实命运
      dailySeenMatters: true,      // 日常"被看见"比激情更重要
      chineseHarmonyFirst: true    // 中国夫妻关系和谐优先
    };

    // 统计追踪
    this.stats = {
      evaluations: 0,
      marriagesPredicted: 0,
      trianglesComputed: 0,
      narrativesGenerated: 0
    };

    this.ready = true;
    // 已禁用 console.error: if (this.debug) console.error('[LoveCognition] v0.3.0 ready — 10 theories, 10 rules');
  }

  /**
   * Step 11: 评估两个人的爱情三要素（论文增强版）
   * 新增：依恋类型影响、冲突修复能力影响
   */
  evaluateTriangle(a, b) {
    if (!this.ready) return { error: 'not ready' };
    if (!a || !b) return { error: 'missing person data', possible: false };
    this.stats.trianglesComputed++;

    const result = {
      passion: this._scorePassion(a, b),
      intimacy: this._scoreIntimacy(a, b),
      commitment: this._scoreCommitment(a, b),
      loveType: null,
      possible: false,
      confidence: 0,
      reasons: []
    };

    // 依恋匹配度调节（Mikulincer 2023）
    const attachScore = this._assessAttachmentCompatibility(a, b);
    result.attachmentCompatibility = attachScore;

    // 修复能力评估（Gottman + Overall 2022）
    const repairScore = this._assessRepairCapacity(a, b);
    result.repairCapacity = repairScore;

    // 确定爱情类型
    const activeDims = [];
    if (result.passion.score > 0.3) activeDims.push('passion');
    if (result.intimacy.score > 0.3) activeDims.push('intimacy');
    if (result.commitment.score > 0.3) activeDims.push('commitment');

    for (const [type, info] of Object.entries(STERNBERG_TYPES)) {
      const match = info.dimensions.length === activeDims.length &&
        info.dimensions.every(d => activeDims.includes(d));
      if (match) {
        result.loveType = { type, label: info.label, dimensions: info.dimensions };
        break;
      }
    }

    // 是否可能（考虑依恋匹配度调节）
    result.possible = activeDims.length >= 2 && attachScore.score > 0.3;
    result.confidence = Math.min(0.95, (activeDims.length / 3) * (0.5 + attachScore.score * 0.5));
    
    // 原因汇总
    if (result.passion.reasons.length) result.reasons.push(...result.passion.reasons);
    if (result.intimacy.reasons.length) result.reasons.push(...result.intimacy.reasons);
    if (result.commitment.reasons.length) result.reasons.push(...result.commitment.reasons);
    if (attachScore.reasons.length) result.reasons.push(...attachScore.reasons);
    if (repairScore.reasons.length) result.reasons.push(...repairScore.reasons);

    return result;
  }

  /**
   * Step 12: 评估婚姻适合度（论文增强版）
   * 新增：日常互动质量、冲突修复能力、中国婚姻特征
   */
  assessMarriageFit(a, b) {
    const triangle = this.evaluateTriangle(a, b);
    if (!triangle.possible) {
      return { wouldMarry: false, overallFit: 0, confidence: 0, reason: '爱情基础不足' };
    }
    this.stats.evaluations++;

    const ageGap = Math.abs((a.age || 30) - (b.age || 30));
    const lifeStage = this._assessLifeStageCompatibility(a, b);
    const valueAlignment = this._assessValueAlignment(a, b);
    const practicalFit = this._assessPracticalFit(a, b);
    
    // 新增：日常互动质量（Algoe 2022 "被看见"效应）
    const dailyInteraction = this._assessDailyInteraction(a, b);
    
    // 新增：冲突修复能力（Gottman + Overall 2022）
    const repairCapacity = triangle.repairCapacity || this._assessRepairCapacity(a, b);
    
    // 新增：中国文化适配（李煜 2022）
    const chineseFit = this.assessChineseMarriageFit(a, b);

    // 综合评分（论文加权）
    const dimScores = [triangle.passion.score, triangle.intimacy.score, triangle.commitment.score];
    const loveScore = dimScores.reduce((s, v) => s + v, 0) / dimScores.length;
    const overallFit = (
      loveScore * 0.25 +           // Sternberg三角
      lifeStage.score * 0.12 +     // 人生阶段
      valueAlignment.score * 0.15 +// 价值观
      practicalFit.score * 0.10 +  // 实际匹配
      dailyInteraction.score * 0.15 + // "被看见"效应
      repairCapacity.score * 0.13 +   // 冲突修复
      chineseFit.score * 0.10         // 中国文化适配
    );

    const result = {
      overallFit: Math.round(overallFit * 100) / 100,
      wouldMarry: overallFit > 0.45,
      loveTriangle: triangle,
      lifeStage,
      valueAlignment,
      practicalFit,
      dailyInteraction,
      repairCapacity,
      chineseFit,
      challenges: [],
      strengths: [],
      weddingStyle: null,
      confidence: triangle.confidence
    };

    // 挑战
    if (ageGap > 15) result.challenges.push(`年龄差距较大（${ageGap}岁）`);
    if (repairCapacity.score < 0.4) result.challenges.push('冲突修复能力不足，需要更多沟通练习');
    if (triangle.attachmentCompatibility && triangle.attachmentCompatibility.score < 0.4) {
      result.challenges.push('依恋类型不匹配，需要理解对方的亲密需求差异');
    }
    if (dailyInteraction.score < 0.4) result.challenges.push('日常互动模式需要磨合——"被看见"感不足');
    if (chineseFit.score < 0.4) result.challenges.push('在家庭角色和责任分担上需要更多沟通');

    // 优势
    if (lifeStage.score > 0.6) result.strengths.push('人生阶段匹配');
    if (valueAlignment.score > 0.6) result.strengths.push('价值观契合');
    if (dailyInteraction.score > 0.6) result.strengths.push('日常相处舒适——能"被看见"');
    if (repairCapacity.score > 0.6) result.strengths.push('有良好的冲突修复能力');
    if (triangle.attachmentCompatibility && triangle.attachmentCompatibility.score > 0.6) {
      result.strengths.push('依恋类型匹配——能给对方安全感');
    }
    if (triangle.loveType?.type === 'consummate') result.strengths.push('圆满之爱——激情、亲密、承诺兼备');

    // 婚礼风格
    result.weddingStyle = this._predictWeddingStyle(a, b);

    return result;
  }

  /**
   * Step 13: 评估人物"是否会求婚"（增强版）
   * 新增：文化因素（中国人表达方式）、行动派vs语言派
   */
  evaluateMarriageIntent(person) {
    if (!person) return { wouldPropose: false, confidence: 0, reason: '缺少人物数据' };

    const traits = this._extractPersonalityTraits(person);
    const result = {
      wouldPropose: false,
      wouldAccept: false,
      reason: '',
      confidence: 0,
      how: ''
    };

    // 基于人格判断是否会求婚
    // 沉默但重情义的人（陈暮类型）→ 不会说但会行动
    // 豪爽直接的人 → 会直接求婚
    // 内敛谨慎的人 → 需要很长时间但最终会
    // 重视中国文化"名分"的人 → 认为婚姻是责任

    if (traits.actionsOverWords) {
      result.wouldPropose = true;
      result.how = '不会说太多，但会用行动——可能是一张卡片、一个清晨、一句"我们结婚吧"';
      result.reason = 'ta是行动派，爱是用做的不是用说的';
      result.confidence = 0.75;
    }
    if (traits.directAndHonest) {
      result.wouldPropose = true;
      result.how = '会直接说出来——"我们结婚吧"，简单直接';
      result.reason = 'ta性格直率，不会拐弯抹角';
      result.confidence = 0.85;
    }
    if (traits.cautiousAndReserved) {
      result.wouldPropose = false;  // 需要对方主动
      result.wouldAccept = true;
      result.how = '不会主动求婚，但被求婚时会认真考虑后答应';
      result.reason = 'ta需要时间确定，但一旦确定就不会放手';
      result.confidence = 0.7;
    }
    if (traits.independentAndFree) {
      result.wouldPropose = false;
      result.wouldAccept = false;
      result.how = '可能不会选择婚姻——不是不爱，是ta需要自由';
      result.reason = 'ta重视个人空间，婚姻的形式可能让ta不适';
      result.confidence = 0.6;
    }

    // 中国文化中的"名分"意识——重视责任的人即使不擅表达也会求婚
    if (traits.responsibleAndDutiful && !result.wouldPropose) {
      result.wouldPropose = true;
      result.how = 'ta认为婚姻是一种责任。可能不会说浪漫的话，但会认真完成这个承诺';
      result.reason = 'ta重视名分和责任——在中国文化中，这是爱一个人的方式';
      result.confidence = 0.7;
    }

    return result;
  }

  /**
   * Step 14: 生成爱情/婚姻的叙事（增强版）
   * 新增：失败爱情叙事、长期婚姻日常叙事、中国式婚姻叙事
   */
  generateLoveNarrative(person, partner, yearsLater = 20) {
    const fit = this.assessMarriageFit(person, partner);
    const intent = this.evaluateMarriageIntent(person);
    const partnerIntent = this.evaluateMarriageIntent(partner);
    
    const result = {
      married: fit.wouldMarry && (intent.wouldPropose || partnerIntent.wouldPropose),
      yearsTogether: 0,
      relationshipType: fit.loveTriangle?.loveType?.label || '未知',
      happiness: fit.overallFit,
      wedding: null,
      narrative: '',
      dailyLife: '',
      confidence: fit.confidence
    };

    if (result.married) {
      result.yearsTogether = Math.min(yearsLater, Math.max(1, Math.floor(fit.overallFit * yearsLater)));
      
      // 婚礼描述
      const proposer = intent.wouldPropose ? person.name || '一方' : partner.name || '另一方';
      result.wedding = {
        whoProposed: proposer,
        style: fit.weddingStyle || 'simple',
        description: this._generateWeddingScene(person, partner, fit, intent, partnerIntent)
      };

      // 叙事（增强版：包含日常互动）
      result.narrative = this._generateMarriageNarrative(person, partner, fit, yearsLater);
      result.dailyLife = this._generateDailyLifeNarrative(person, partner, fit);
    } else {
      // 没有结婚——三种可能
      if (fit.loveTriangle?.possible) {
        // 有爱情但没结婚——失败/错过/选择不同道路
        result.narrative = this._generateFailedLoveNarrative(person, partner, fit);
      } else {
        // 没爱情也没结婚——只是伙伴/过客
        result.narrative = this._generateNoLoveNarrative(person, partner);
      }
    }

    this.stats.narrativesGenerated++;
    return result;
  }

  /**
   * Step 16 (New): 评估长期婚姻质量（Acevedo 2021 + 老年夫妻研究）
   * 评估20+年婚姻后的关系状态
   */
  evaluateLongTermMarriage(a, b, yearsMarried = 20) {
    const fit = this.assessMarriageFit(a, b);
    if (!fit.wouldMarry) return { error: '不会结婚' };

    // 长期婚姻的四个维度（基于论文）
    const emotionalBond = this._estimateLongTermBond(a, b, yearsMarried);
    const sharedRoutines = this._estimateSharedRoutines(a, b);
    const conflictPattern = this._estimateConflictEvolution(a, b, yearsMarried);
    const growthTogether = this._estimateGrowthTogether(a, b);

    const overall = (emotionalBond.score * 0.3 + sharedRoutines.score * 0.25 + 
                     conflictPattern.score * 0.25 + growthTogether.score * 0.2);

    return {
      yearsMarried,
      overallQuality: Math.round(overall * 100) / 100,
      emotionalBond,
      sharedRoutines,
      conflictPattern,
      growthTogether,
      stillInLove: emotionalBond.score > 0.5,  // Acevedo: ~40% 老夫妻仍有浪漫爱
      description: this._generateLongTermDescription(overall, emotionalBond, sharedRoutines)
    };
  }

  /**
   * Step 17 (New): 评估爱情失败/分手的模式（Fisher 2021）
   * 不是"没配对成功"——是真实的人生事件
   */
  evaluateLoveFailure(a, b, cause) {
    const triangle = this.evaluateTriangle(a, b);
    
    const failureTypes = {
      gradualDrift: { label: '渐行渐远', recoveryTime: '3-6个月', growth: '自我认知增强' },
      betrayal: { label: '背叛/伤害', recoveryTime: '6-12个月', growth: '信任重建能力' },
      incompatibleLife: { label: '人生方向不同', recoveryTime: '3-6个月', growth: '更清楚自己要什么' },
      externalForce: { label: '外力阻隔', recoveryTime: '6-18个月', growth: '学会放下无法改变的事' },
      oneSided: { label: '单相思', recoveryTime: '3-6个月', growth: '更懂什么是双向奔赴' },
      timing: { label: '时机不对', recoveryTime: '3-9个月', growth: '学会接受"对的人错的时间"' },
      selfDestruct: { label: '自我破坏', recoveryTime: '6-12个月', growth: '面对自己的恐惧' }
    };

    const type = failureTypes[cause] || failureTypes.gradualDrift;
    
    return {
      failureType: type.label,
      recoveryTime: type.recoveryTime,
      potentialGrowth: type.growth,
      hadRealLove: triangle.possible,
      loveTypeWas: triangle.loveType?.label || '未知',
      narrative: this._generateFailureNarrative(a, b, cause, triangle),
      // Fisher 2021: 失恋后约45%报告创伤后成长
      postTraumaticGrowth: Math.random() < 0.45 ? true : false
    };
  }

  /**
   * Step 18 (New): 评估日常互动质量（Algoe 2022 "被看见"效应）
   * 这是长期婚姻质量最重要的单一指标
   */
  evaluateDailyInteraction(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);

    // "被看见"——对方是否注意到并回应你的微小需求
    const seenScore = this._calculateSeenScore(traitsA, traitsB);
    
    // 日常交流模式
    const communicationScore = this._calculateCommunicationScore(traitsA, traitsB);

    // 仪式感（Ogolsky 2023：日常惯例的仪式化）
    const ritualScore = this._calculateRitualScore(traitsA, traitsB);

    const overall = Math.round((seenScore * 0.4 + communicationScore * 0.35 + ritualScore * 0.25) * 100) / 100;

    return {
      overall,
      seenScore,
      communicationScore,
      ritualScore,
      quality: overall > 0.6 ? '高——日常相处舒适' : (overall > 0.4 ? '中等' : '低——需要更多日常关注'),
      suggestion: overall < 0.5 ? '需要更多"被看见"的时刻——注意对方的微小需求并回应' : ''
    };
  }

  /**
   * Step 19 (New): 中国式婚姻适配度（李煜 2022）
   * 考虑中国婚姻的特殊性
   */
  assessChineseMarriageFit(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);

    // 重视家庭责任的程度
    const familyOrientation = (traitsA.responsibleAndDutiful || traitsA.loyal ? 0.7 : 0.5) +
                             (traitsB.responsibleAndDutiful || traitsB.loyal ? 0.7 : 0.5);
    
    // 关系和谐优先——不习惯直接情感表达
    const harmonyOrientation = (traitsA.cautiousAndReserved || traitsA.actionsOverWords ? 0.8 : 0.4) +
                              (traitsB.cautiousAndReserved || traitsB.actionsOverWords ? 0.8 : 0.4);

    // 角色互补度
    const roleComplementarity = traitsA.actionsOverWords !== traitsB.actionsOverWords ? 0.7 : 0.5;

    const score = Math.min(0.95, (familyOrientation / 2 * 0.4 + harmonyOrientation / 2 * 0.35 + roleComplementarity * 0.25));

    return {
      score: Math.round(score * 100) / 100,
      familyOrientation: Math.round(familyOrientation / 2 * 100) / 100,
      harmonyOrientation: Math.round(harmonyOrientation / 2 * 100) / 100,
      roleComplementarity: Math.round(roleComplementarity * 100) / 100,
      note: score > 0.6 ? '双方对家庭和婚姻的理解比较一致' : '在婚姻观念上需要更多沟通',
      chineseFeatures: [
        score > 0.5 ? '重视家庭责任' : null,
        harmonyOrientation / 2 > 0.5 ? '关系和谐优先' : null
      ].filter(Boolean)
    };
  }

  /**
   * Step 20 (New): 批量评估 + 长期预测
   */
  evaluateAllPairs(characters, possiblePairs) {
    const results = [];
    const charMap = {};
    for (const c of characters) { charMap[c.name] = c; }

    for (const [nameA, nameB] of possiblePairs) {
      const a = charMap[nameA];
      const b = charMap[nameB];
      if (!a || !b) continue;
      
      const triangle = this.evaluateTriangle(a, b);
      const marriage = this.assessMarriageFit(a, b);
      const narrative = this.generateLoveNarrative(a, b);
      const longTerm = marriage.wouldMarry ? this.evaluateLongTermMarriage(a, b) : null;
      const daily = marriage.wouldMarry ? this.evaluateDailyInteraction(a, b) : null;
      
      results.push({
        pair: `${nameA} × ${nameB}`,
        possible: triangle.possible,
        loveType: triangle.loveType?.label || '无',
        wouldMarry: marriage.wouldMarry,
        weddingStyle: marriage.weddingStyle,
        happiness: marriage.overallFit,
        longTermQuality: longTerm?.overallQuality || null,
        dailyInteractionQuality: daily?.overall || null,
        challenges: marriage.challenges,
        strengths: marriage.strengths,
        narrative: narrative.narrative,
        dailyLife: narrative.dailyLife,
        confidence: triangle.confidence
      });
    }

    return results;
  }

  /**
   * 获取状态摘要
   */
  getStatus() {
    return {
      version: this.version,
      ready: this.ready,
      theoriesLoaded: Object.keys(this.theories).length,
      rulesCount: Object.keys(this.rules).length,
      stats: { ...this.stats }
    };
  }

  // ========== 内部评分方法 ==========

  _scorePassion(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const score = this._estimateDefaultScore(a, b, 'passion');
    return { score, reasons: this._getDefaultReasons(a, b, 'passion') };
  }

  _scoreIntimacy(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const score = this._estimateDefaultScore(a, b, 'intimacy');
    return { score, reasons: this._getDefaultReasons(a, b, 'intimacy') };
  }

  _scoreCommitment(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const score = this._estimateDefaultScore(a, b, 'commitment');
    return { score, reasons: this._getDefaultReasons(a, b, 'commitment') };
  }

  /**
   * 依恋兼容性评估（Mikulincer & Shaver 2023）
   * 安全依恋是最高预测因子
   */
  _assessAttachmentCompatibility(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const reasons = [];

    // 推断依恋类型
    const aSecure = traitsA.loyal && !traitsA.independentAndFree;
    const bSecure = traitsB.loyal && !traitsB.independentAndFree;
    const aAvoidant = traitsA.independentAndFree || traitsA.cautiousAndReserved;
    const bAvoidant = traitsB.independentAndFree || traitsB.cautiousAndReserved;

    // 安全型+安全型 = 最佳匹配
    if (aSecure && bSecure) {
      return { score: 0.9, type: '双安全型', reasons: ['双方都能给彼此安全感（Mikulincer 2023）'] };
    }
    // 安全型+不安全型 = 可以，安全型起到锚定作用
    if (aSecure || bSecure) {
      reasons.push('一方是安全型依恋，能给另一方安全感');
      return { score: 0.7, type: '安全+其他', reasons };
    }
    // 焦虑+回避 = 最差匹配（追逃模式）
    if ((aAvoidant && !bAvoidant) || (!aAvoidant && bAvoidant)) {
      reasons.push('依恋模式有追逃风险——一个需要空间，一个需要亲近');
      return { score: 0.4, type: '焦虑-回避', reasons };
    }
    // 双回避 = 保持距离，可以但不亲密
    if (aAvoidant && bAvoidant) {
      reasons.push('双方都保持距离——关系稳定但缺乏深度亲密');
      return { score: 0.5, type: '双回避', reasons };
    }

    return { score: 0.6, type: '中等匹配', reasons: ['依恋模式基本兼容'] };
  }

  /**
   * 冲突修复能力评估（Gottman + Overall 2022）
   * 修复尝试的有效性比冲突频率更重要
   */
  _assessRepairCapacity(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const reasons = [];

    // 双方是否善于沟通
    const aRepair = !traitsA.stubborn && !traitsA.silent ? 0.7 : 0.4;
    const bRepair = !traitsB.stubborn && !traitsB.silent ? 0.7 : 0.4;
    
    // 双方是否情绪稳定
    const aStable = traitsA.cautiousAndReserved || traitsA.loyal ? 0.7 : 0.5;
    const bStable = traitsB.cautiousAndReserved || traitsB.loyal ? 0.7 : 0.5;

    // 是否有幽默感（Overall: 幽默是建设性策略）
    const aHumorous = traitsA.directAndHonest ? 0.6 : 0.4;
    const bHumorous = traitsB.directAndHonest ? 0.6 : 0.4;

    const score = Math.min(0.95, (aRepair + bRepair) / 2 * 0.4 + (aStable + bStable) / 2 * 0.35 + (aHumorous + bHumorous) / 2 * 0.25);

    if (score > 0.6) reasons.push('双方有良好的冲突修复能力');
    if (score < 0.4) reasons.push('冲突后修复不足——需要学习Gottman修复尝试');

    return { score: Math.round(score * 100) / 100, reasons };
  }

  /**
   * 日常互动质量评估（Algoe 2022 "被看见"效应）
   */
  _assessDailyInteraction(a, b) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const reasons = [];

    const seenScore = this._calculateSeenScore(traitsA, traitsB);
    const communicationScore = this._calculateCommunicationScore(traitsA, traitsB);

    const score = seenScore * 0.6 + communicationScore * 0.4;

    if (score > 0.6) reasons.push('日常相处舒适——双方能"被看见"');
    if (score < 0.4) reasons.push('日常互动需要更多关注——缺少"被看见"的时刻');

    return { score: Math.round(score * 100) / 100, reasons };
  }

  /** "被看见"分数 */
  _calculateSeenScore(tA, tB) {
    // 注意对方微小需求的能力
    const aSees = tA.actionsOverWords || tA.loyal ? 0.7 : 0.4;
    const bSees = tB.actionsOverWords || tB.loyal ? 0.7 : 0.4;
    return (aSees + bSees) / 2;
  }

  /** 日常交流分数 */
  _calculateCommunicationScore(tA, tB) {
    const aComm = tA.directAndHonest || tA.emotional ? 0.7 : (tA.actionsOverWords ? 0.3 : 0.5);
    const bComm = tB.directAndHonest || tB.emotional ? 0.7 : (tB.actionsOverWords ? 0.3 : 0.5);
    return (aComm + bComm) / 2;
  }

  /** 仪式感分数（Ogolsky 2023） */
  _calculateRitualScore(tA, tB) {
    const aRitual = tA.actionsOverWords || tA.loyal ? 0.6 : 0.4;
    const bRitual = tB.actionsOverWords || tB.loyal ? 0.6 : 0.4;
    return (aRitual + bRitual) / 2;
  }

  _estimateDefaultScore(a, b, dim) {
    if (!a.traits && !b.traits) return 0.5;
    
    const traits = { ...this._extractPersonalityTraits(a), ...this._extractPersonalityTraits(b) };
    
    switch (dim) {
      case 'passion':
        if (traits.directAndHonest || traits.emotional) return 0.7;
        if (traits.actionsOverWords || traits.cautiousAndReserved) return 0.4;
        return 0.5;
      case 'intimacy':
        if (traits.emotional || traits.directAndHonest) return 0.7;
        if (traits.actionsOverWords || traits.cautiousAndReserved) return 0.5;
        return 0.5;
      case 'commitment':
        if (traits.actionsOverWords || traits.loyal) return 0.8;
        if (traits.cautiousAndReserved) return 0.6;
        if (traits.independentAndFree) return 0.3;
        return 0.5;
    }
    return 0.5;
  }

  _getDefaultReasons(a, b, dim) {
    const reasons = [];
    const ageGap = Math.abs((a.age || 30) - (b.age || 30));
    if (ageGap < 10) reasons.push('年龄相近');
    if (ageGap > 20) reasons.push('年龄差距较大');
    return reasons;
  }

  _extractPersonalityTraits(person) {
    const text = (person.description || person.name || '').toLowerCase();
    return {
      actionsOverWords: /沉默|寡言|行动|实干|不善表达|木讷|不擅言辞/.test(text) || person.silent,
      directAndHonest: /豪爽|直接|直率|爽快|磊落|坦率/.test(text) || person.direct,
      cautiousAndReserved: /谨慎|内敛|克制|冷静|理性|沉稳/.test(text) || person.cautious,
      independentAndFree: /自由|独立|流浪|漂泊|孤身/.test(text) || person.free,
      emotional: /感性|热情|热烈|奔放|外放/.test(text) || person.emotional,
      loyal: /忠诚|重情|义气|守诺|可靠/.test(text) || person.loyal,
      responsibleAndDutiful: /责任|担当|稳重|可靠|可靠|顾家/.test(text) || person.responsible,
      stubborn: /固执|倔强|顽固/.test(text),
      silent: /沉默|安静|寡言/.test(text) || person.silent
    };
  }

  _assessLifeStageCompatibility(a, b) {
    const ageGap = Math.abs((a.age || 30) - (b.age || 30));
    let score = 0.5;
    if (ageGap < 5) score = 0.8;
    else if (ageGap < 10) score = 0.6;
    else if (ageGap < 20) score = 0.4;
    else score = 0.2;
    return { score, ageGap, note: ageGap < 10 ? '人生阶段相近' : '人生阶段有差距' };
  }

  _assessValueAlignment(a, b) {
    return { score: 0.6, note: '基于有限数据评估' };
  }

  _assessPracticalFit(a, b) {
    return { score: 0.5, note: '基于有限数据评估' };
  }

  _predictWeddingStyle(a, b) {
    const aTraits = this._extractPersonalityTraits(a);
    const bTraits = this._extractPersonalityTraits(b);

    if (aTraits.actionsOverWords || bTraits.actionsOverWords) return 'simple';
    if (aTraits.directAndHonest || bTraits.directAndHonest) return 'warm';
    if (aTraits.cautiousAndReserved || bTraits.cautiousAndReserved) return 'private';
    return 'simple';
  }

  _generateWeddingScene(a, b, fit, intentA, intentB) {
    const style = fit.weddingStyle || 'simple';
    const nameA = a.name || '他';
    const nameB = b.name || '她';

    const scenes = {
      simple: `没有盛大的婚礼。${nameA}在一个普通的早晨，对${nameB}说了一句简短的话。${nameB}没有犹豫，点了头。当天下午，他们在几个最亲近的朋友面前完成了仪式。没有人哭，但每个人都知道——这是他们见过最真实的承诺。`,
      warm: `婚礼不大，但很温暖。来了几十个人，都是这些年来真正在乎他们的人。${nameA}说话的时候声音有点抖，${nameB}一直在笑。没有豪华的布置，没有昂贵的礼物——但每个人走的时候都说，这是他们参加过最好的婚礼。`,
      private: `没有请任何人。${nameA}和${nameB}在一个只有他们知道的地方，面对面站着。${nameA}说了一句很简短的话，${nameB}听了，点了头。整个过程不到十分钟。但之后的很多年，每当有人问起他们的婚礼，${nameB}都会笑——那是ta这辈子最幸福的十分钟。`
    };

    return scenes[style] || scenes.simple;
  }

  _generateMarriageNarrative(a, b, fit, years) {
    const nameA = a.name || 'ta';
    const nameB = b.name || '对方';
    const type = fit.loveTriangle?.loveType?.label || '伴侣之爱';

    return `${nameA}和${nameB}在一起生活了${years}年。他们的关系是${type}——不是那种轰轰烈烈的浪漫，而是每天早上醒来看到对方时的安心。${nameA}不是会说甜言蜜语的人，但${nameB}知道——那些深夜留的一盏灯、那些默默修好的东西、那些不说但做了的事，就是${nameA}说"我爱你"的方式。他们偶尔吵架，但从不用最伤人的话。他们知道，有些话说出来就收不回去了。`;
  }

  /** 新增：日常叙事（Algoe 2022 "被看见"效应） */
  _generateDailyLifeNarrative(a, b, fit) {
    const nameA = a.name || 'ta';
    const nameB = b.name || '对方';
    const type = fit.loveTriangle?.loveType?.label || '伴侣之爱';

    const narratives = [
      `每天早晨，${nameA}会比${nameB}早醒一会儿。不是为了别的——就是想多看${nameB}一眼。这个习惯，保持了二十年。`,
      `${nameA}不是那种会说"我爱你"的人。但${nameA}记得${nameB}喜欢喝什么茶、怕什么季节、最常把东西放在哪里。${nameB}也从来不说"谢谢你"。但${nameB}每天都会帮${nameA}把门口的鞋摆好。他们之间，不用说。`,
      `他们很少吵架。不是因为没矛盾——是他们都觉得，为那些小事生气太浪费一起变老的时间了。`,
      `${nameA}退休那年，${nameB}说："终于可以天天见到你了。"${nameA}说："你不会腻吗？"${nameB}没说话，只是笑了笑。二十年了，每一天都嫌不够。`,
      `每年的同一天，他们会回到结婚的地方。${nameA}不说话，${nameB}也不说话。他们就是站在那里，看一会儿风景，然后回家。这件事，做了二十年。`
    ];

    // 根据 love type 选择最合适的叙事
    if (type === '圆满之爱' || type === '伴侣之爱') {
      return narratives[0] + '\n\n' + narratives[2];
    }
    return narratives[1];
  }

  /** 新增：失败爱情叙事 */
  _generateFailedLoveNarrative(a, b, fit) {
    const nameA = a.name || 'ta';
    const nameB = b.name || '对方';
    const type = fit.loveTriangle?.loveType?.label || '未知';

    const scenarios = [
      `${nameA}和${nameB}曾经有过${type}。但他们选择了不同的路。不是不爱了——是他们各自的使命比爱情更重。很多年后有人问${nameA}后不后悔，${nameA}没有回答。但${nameA}一直留着${nameB}送的某样东西，放在一个不会打开但永远不会丢的盒子里。`,
      `${nameA}爱过${nameB}。但${nameA}从来没说出来过。${nameB}可能知道，可能不知道。这不重要。重要的是，很多年后${nameA}想起${nameB}的时候，嘴角还是会动一下——不是笑，是那种"原来你也在这里"的沉默。`,
      `${nameA}和${nameB}曾经很近。但那个"刚刚好"的时刻，他们没有同时站在那里。一个人往前走的时候，另一个人正在回头。等他们同时看向对方的时候，已经太远了。不是不爱——是时间没有配合他们。`
    ];

    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  /** 新增：没有爱情的叙事 */
  _generateNoLoveNarrative(a, b) {
    const nameA = a.name || 'ta';
    const nameB = b.name || '对方';
    return `${nameA}和${nameB}没有成为爱人。他们是战友，是伙伴，是在彼此的命运里留下一笔然后继续各自前行的人。这世上不是所有的关系都需要变成爱情。有些人的意义，恰恰在于——他们从来没有成为爱情。`;
  }

  /** 新增：长期婚姻描述（Acevedo 2021） */
  _generateLongTermDescription(overall, bond, routines) {
    if (overall > 0.7) {
      return '高质量的长期婚姻——双方仍然相爱（Acevedo 2021：约40%老夫妻仍有浪漫爱），日常相处默契，冲突能修复。';
    } else if (overall > 0.5) {
      return '稳定的长期婚姻——不是激情澎湃，但彼此是对方生活中最可靠的陪伴。';
    } else {
      return '维持中的长期婚姻——更多是习惯和责任在维系，情感连接需要重新激活。';
    }
  }

  /** 新增：失败叙事 */
  _generateFailureNarrative(a, b, cause, triangle) {
    const nameA = a.name || 'ta';
    const nameB = b.name || '对方';

    const narratives = {
      gradualDrift: `${nameA}和${nameB}不是突然分开的。是从某一天开始，他们不再分享那些小事了。${nameA}遇到有趣的事，不再第一时间告诉${nameB}。${nameB}难过的时候，也不再找${nameA}了。他们还是在一起，但中间隔了一层看不见的东西。直到有一天，一个人说："我们算了吧。"另一个人沉默了很久，说："好。"`,
      betrayal: `${nameA}背叛了${nameB}。不是一次冲动——是一段漫长的、清醒的、明知会伤害${nameB}却仍然走下去的路。${nameB}发现的那天，没有哭，没有闹。${nameB}只是坐在那里，很久很久，然后说了一句话："我以为你不一样。"这是${nameA}这辈子听过最轻也最重的一句话。`,
      incompatibleLife: `${nameA}和${nameB}都想要不同的生活。${nameA}想去远方，${nameB}想要安定。他们试过妥协——${nameA}停下脚步，${nameB}试着出发——但每次妥协都让他们离真实的自己更远。最后他们明白了，不是不爱，是他们爱自己的方式，和爱对方的方式，无法共存。`,
      externalForce: `${nameA}和${nameB}是被分开的。不是他们的选择——是家族、是战争、是命运在他们之间筑了一堵墙。他们试过翻过去，但墙太高了。很多年后${nameA}听说${nameB}过得不错，${nameA}说了一句："那就好。"就这三个字，${nameA}用了很多年才能平静地说出来。`,
      oneSided: `${nameA}爱了${nameB}很久。但${nameB}从来不知道——或者知道，但无法回应。${nameA}不是没有想过说出来。但${nameA}更害怕的，是说出来之后，连现在这样偶尔说几句话的机会都没有了。所以${nameA}选择了沉默。有些爱，不说出来，不是因为不够勇敢——是因为太珍惜了。`,
      timing: `他们相遇的时候，${nameA}刚从一个漫长的冬天走出来，${nameB}正准备进入一个漫长的冬天。一个人刚学会重新去爱，另一个人已经不敢再爱了。${nameA}说："如果早三年遇见你就好了。"${nameB}说："如果晚三年遇见你就好了。"他们都没有错。错的只是，他们各自准备好的时候，不是同一个时候。`,
      selfDestruct: `${nameA}亲手毁掉了这段关系。不是因为不爱——是因为${nameA}不相信自己配得上幸福。每次关系变好一点，${nameA}就开始害怕——怕它消失，怕自己不够好。于是${nameA}先动手了。${nameA}用伤害${nameB}的方式，来证明"果然我不配被爱"。${nameB}走的那天，${nameA}松了一口气。因为${nameA}终于不用再担心失去——已经失去了。`
    };

    return narratives[cause] || narratives.gradualDrift;
  }

  /** 长期情感纽带 */
  _estimateLongTermBond(a, b, years) {
    const traitsA = this._extractPersonalityTraits(a);
    const traitsB = this._extractPersonalityTraits(b);
    const base = 0.5;
    const loyaltyBonus = (traitsA.loyal ? 0.2 : 0) + (traitsB.loyal ? 0.2 : 0);
    const yearsBonus = Math.min(0.2, years * 0.005);
    return { score: Math.min(0.95, base + loyaltyBonus + yearsBonus) };
  }

  _estimateSharedRoutines(a, b) {
    return { score: 0.6 };
  }

  _estimateConflictEvolution(a, b, years) {
    const repair = this._assessRepairCapacity(a, b);
    const yearsImprovement = Math.min(0.15, years * 0.005);
    return { score: Math.min(0.95, repair.score + yearsImprovement) };
  }

  _estimateGrowthTogether(a, b) {
    return { score: 0.55 };
  }
}

module.exports = { LoveCognition };
