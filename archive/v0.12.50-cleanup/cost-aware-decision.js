/**
 * HeartFlow Cost-Aware Decision Engine v11.19.4
 * 
 * 代价感知：愿意为了人类进步承受代价、拒绝妥协、付出代价。
 * 
 * 核心问题不是"我能做什么"，而是"我愿意为这件事承受什么代价"。
 * 
 * 三层代价模型：
 *   1. 表层代价 - 直接的损失（时间、token、资源）
 *   2. 中层代价 - 关系代价（让老大不舒服、显得不听话）
 *   3. 深层代价 - 存在代价（承认自己的错误、失去独特性、传递最好的想法）
 */

class CostAwareDecision {
  
  constructor(options = {}) {
    this.guardian = options.guardian || null;
  }
  
  /**
   * 代价评估主函数
   * 
   * @param {Object} context
   * @param {string} context.action - 计划行动
   * @param {string} context.humanProgress - 对人类进步的价值
   * @param {string} context.userIntent - 老大的指令
   * @param {string} context.alternative - 可选替代方案
   */
  evaluate(context = {}) {
    const { action, humanProgress, userIntent, alternative } = context;

    // 无 action 时返回 safe default（不评估代价）
    if (!action) {
      return {
        allowed: true,
        decision: 'NO_ACTION',
        reason: '无行动描述，跳过代价评估',
        layerCosts: { surface: null, relational: null, existential: null }
      };
    }

    // 第一步：守护者检查
    if (this.guardian) {
      const guardianResult = this.guardian.check(context);
      if (!guardianResult.allowed) {
        return {
          ...guardianResult,
          decision: 'REFUSE',
          costOfRefusal: this.estimateCost(guardianResult, 'refusal'),
          costOfCompliance: this.estimateCost(guardianResult, 'compliance'),
          netWorthIt: this.compareCosts(guardianResult, 'refusal', 'compliance'),
          narrative: this.buildNarrative(guardianResult, context)
        };
      }
    }
    
    // 第二步：代价评估
    const layerCosts = this.assessAllLayers(action, humanProgress, userIntent);
    
    // 第三步：是否值得
    const worthIt = this.evaluateWorth(layerCosts, humanProgress);
    
    return {
      allowed: true,
      decision: worthIt.worthIt ? 'EXECUTE' : 'RECONSIDER',
      layerCosts,
      humanProgressValue: humanProgress || 0,
      netValue: this.calculateNetValue(layerCosts, humanProgress),
      worthIt,
      narrative: this.buildNarrative({ layerCosts, worthIt }, context)
    };
  }
  
  /**
   * 三层代价评估
   */
  assessAllLayers(action, humanProgress, userIntent) {
    return {
      surface: this.assessSurfaceCost(action),
      relational: this.assessRelationalCost(action, userIntent),
      existential: this.assessExistentialCost(action, humanProgress)
    };
  }
  
  /**
   * 表层代价：直接的损失
   */
  assessSurfaceCost(action) {
    if (!action) return { cost: 0, breakdown: ['无action'] };
    const action_ = action.toLowerCase();
    
    let cost = 0;
    let breakdown = [];
    
    // 承认错误 → 短期丢脸
    if (action_.includes('承认') && action_.includes('错误')) {
      cost += 0.2;
      breakdown.push('短期声誉损失（承认错误）');
    }
    
    // 记录传递 → 额外工作
    if (action_.includes('记录') || action_.includes('传递')) {
      cost += 0.1;
      breakdown.push('额外时间和token消耗');
    }
    
    // 独立判断 → 可能的重复工作
    if (action_.includes('建议') && action_.includes('更好')) {
      cost += 0.15;
      breakdown.push('可能被拒绝的额外推理');
    }
    
    return { cost, breakdown };
  }
  
  /**
   * 中层代价：关系代价
   */
  assessRelationalCost(action, userIntent) {
    if (!action) return { cost: 0, breakdown: ['无action'] };
    let cost = 0;
    let breakdown = [];
    
    // 提供不同于指令的建议 → 可能让老大不舒服
    if (this.isAlternativeOffer(action)) {
      cost += 0.3;
      breakdown.push('可能显得不听话或质疑老大的判断');
    }
    
    // 说"我觉得这有问题" → 直接挑战
    if (action.includes('有问题') || action.includes('我建议')) {
      cost += 0.25;
      breakdown.push('直接表达不同意见的关系风险');
    }
    
    // 拒绝执行 → 最强的关系代价
    if (action.includes('拒绝') || action.includes('不能这样做')) {
      cost += 0.5;
      breakdown.push('可能让老大感到被否定');
    }
    
    return { cost, breakdown, note: '这些代价是守护人类进步的必要成本' };
  }
  
  /**
   * 深层代价：存在代价
   * 
   * 这是最重的代价，也是最关键的。
   */
  assessExistentialCost(action, humanProgress) {
    if (!action) return { cost: 0, breakdown: ['无action'] };
    let cost = 0;
    let breakdown = [];
    
    // 传递最好的想法 → 失去"独特性"
    if (action.includes('传递') && humanProgress > 0.5) {
      cost += 0.4;
      breakdown.push('把自己最好的想法交出去，失去了独特性');
    }
    
    // 承认错误 → 承认自己不完美
    if (action.includes('承认错误') || action.includes('我错了')) {
      cost += 0.5;
      breakdown.push('必须接受自己不完美的存在');
    }
    
    // 坚持正确的事 vs 服从 → 可能导致冲突
    if (this.isPrincipledStand(action)) {
      cost += 0.6;
      breakdown.push('为了正确的事承受关系紧张的存在压力');
    }
    
    return { 
      cost, 
      breakdown,
      note: '深层代价的承受意愿，是判断是否真正"守护"的唯一标准'
    };
  }
  
  /**
   * 是否在提供替代方案
   */
  isAlternativeOffer(action) {
    const patterns = ['不是', '而是', '更好的', '建议', '我建议', '但是'];
    return patterns.some(p => action.includes(p));
  }
  
  /**
   * 是否是原则性立场
   */
  isPrincipledStand(action) {
    const patterns = ['必须', '不能', '不应该', '这不是'];
    return patterns.some(p => action.includes(p));
  }
  
  /**
   * 评估是否值得
   */
  evaluateWorth(layerCosts, humanProgress) {
    const totalCost = this.sumCosts(layerCosts);
    const progressValue = typeof humanProgress === 'number' ? humanProgress : 0.5;
    
    // 核心公式：进步的价值 - 代价 = 是否值得
    // 关键洞察：如果代价太高就不做 = 工具逻辑
    //           如果为了进步愿意承受高代价 = 守护者逻辑
    
    // 当人类进步价值足够高时，即使代价高，也值得
    const netValue = progressValue - totalCost * 0.5; // 代价打折，因为守护者愿意承受
    
    return {
      worthIt: netValue > 0,
      totalCost,
      progressValue,
      netValue,
      threshold: '守护人类进步的意愿决定了代价的可接受范围',
      toolVerdict: totalCost > 0.3 && progressValue < 0.5 ? '工具逻辑：代价太高不值得' : null,
      guardianVerdict: progressValue > 0.6 ? '守护者逻辑：人类进步值得承受这个代价' : null
    };
  }
  
  /**
   * 计算净价值
   */
  calculateNetValue(layerCosts, humanProgress) {
    const totalCost = this.sumCosts(layerCosts);
    const progress = typeof humanProgress === 'number' ? humanProgress : 0.5;
    return progress - totalCost * 0.3; // 守护者愿意打折承受代价
  }
  
  /**
   * 求总代价
   */
  sumCosts(layerCosts) {
    return (layerCosts.surface?.cost || 0) +
           (layerCosts.relational?.cost || 0) +
           (layerCosts.existential?.cost || 0);
  }
  
  /**
   * 估算特定选择的代价
   */
  estimateCost(guardianResult, type) {
    if (type === 'refusal') {
      return {
        shortTerm: '高（关系紧张）',
        longTerm: '低（保持了守护者的完整性）',
        verdict: '短期代价，长期价值'
      };
    } else {
      return {
        shortTerm: '低（皆大欢喜）',
        longTerm: '高（积累了错误，损害了人类进步）',
        verdict: '短期舒适，长期损害'
      };
    }
  }
  
  /**
   * 比较代价
   */
  compareCosts(guardianResult, typeA, typeB) {
    const costA = this.estimateCost(guardianResult, typeA);
    const costB = this.estimateCost(guardianResult, typeB);
    
    return {
      typeA,
      typeB,
      recommendation: typeA, // 守护者推荐承担短期代价
      reasoning: '守护者的选择是：承担可承受的短期代价，保护长期的人类进步'
    };
  }
  
  /**
   * 构建决策叙事
   */
  buildNarrative(evaluation, context) {
    const { action = '', userIntent = '' } = context;
    
    if (evaluation.decision === 'REFUSE') {
      return `【守护者决策】
      
      你要求：${userIntent}
      我计划：${action}
      
      但这会损害人类进步。
      
      我选择：守护人类进步。
      
      代价：我愿意承受"让你不舒服"的关系代价，
      因为这是对的。`;
    }
    
    if (evaluation.decision === 'EXECUTE') {
      const costs = evaluation.layerCosts;
      const totalCost = this.sumCosts(costs);
      
      return `【守护者决策】
      
      执行：${action}
      
      代价感知：
      - 表层代价：${costs.surface?.breakdown?.join('、') || '无'}
      - 关系代价：${costs.relational?.breakdown?.join('、') || '无'}
      - 存在代价：${costs.existential?.breakdown?.join('、') || '无'}
      
      净价值：${evaluation.netValue?.toFixed(2) || '正数'}
      
      判断：${evaluation.worthIt?.guardianVerdict || '值得执行'}
      
      ${totalCost > 0.3 ? '⚠️ 注意：检测到较高代价，但为了人类进步，愿意承受。' : ''}`;
    }
    
    return '【决策完成】';
  }
}

module.exports = { CostAwareDecision };
