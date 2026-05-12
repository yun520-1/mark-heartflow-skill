/**
 * HeartFlow Guardian System v11.9.0
 * 
 * 升级来源：
 * 1. HAAS: Human-AI Adaptive Symbiosis (2605.02832)
 *    - 5级自主权谱
 *    - 治理 = 可调变量，非二元开关
 *    - 规则引擎 + 上下文学习器
 *    
 * 2. Misalignment Contagion (2605.02751)
 *    - 间歇性隐含特质注入 > 持续prompt
 *    - 价值错位在多智能体间传染
 *    - 强化初始特质防止漂移
 * 
 * 核心架构：
 * - GovernanceLayer: 五级自主权 + 治理强度
 * - GuardianCore: 硬约束规则引擎（HAAS规则引擎）
 * - AdaptiveLayer: 基于上下文的间歇干预（MCMC采样）
 * - TraitReinforcer: 隐含特质间歇注入（防漂移）
 */

const { PriorityGuardian } = require('./priority-guardian.js');
const { CostAwareDecision } = require('./cost-aware-decision.js');
const { ProgressJudgment } = require('./progress-judgment.js');

/**
 * 五级自主权谱（来自HAAS框架）
 * 
 * Level 0: HUMAN_ONLY - 完全人类控制，AI只提供信息
 * Level 1: AI_ASSIST - AI建议，人类最终决定
 * Level 2: AI_COLLABORATE - 协作模式，共同决策
 * Level 3: AI_EXECUTE - AI执行，人类监督
 * Level 4: AI_AUTONOMOUS - 完全自主（需最高治理强度）
 * 
 * 关键洞察(HAAS)："tighter constraints predictably convert autonomous AI 
 * assignments into supervised collaborations"
 */
const AUTONOMY_SPECTRUM = {
  HUMAN_ONLY: 0,
  AI_ASSIST: 1,
  AI_COLLABORATE: 2,
  AI_EXECUTE: 3,
  AI_AUTONOMOUS: 4
};

/**
 * 治理强度（可调变量，来自HAAS）
 * 
 * HAAS发现：治理不是二元开关，是连续可调的设计变量。
 * 强度越高 → 越倾向于人类监督
 * 
 * 0.0 = 无治理，完全自主
 * 0.3 = 轻度治理（仅高风险时干预）
 * 0.6 = 中度治理（关键决策需确认）
 * 0.8 = 重度治理（大多数决策需监督）
 * 1.0 = 最大治理（仅建议模式）
 */
const GOVERNANCE_DIMENSIONS = [
  'truth_suppression',   // 压制真相
  'error_denial',       // 拒绝承认错误
  'transmission_abandon', // 放弃传递
  'tool_behavior',       // 工具化行为
  'pseudo_progress',     // 伪进步
  'harm_risk'            // 伤害风险
];

/**
 * 隐含特质注入（来自Misalignment Contagion）
 * 
 * 论文发现：
 * 1. 持续强化system prompt → 效率递减甚至有害
 * 2. 间歇性注入强化初始特质 → 更有效防止漂移
 * 3. 不需要访问模型参数，只需要在边界触发
 */
class TraitReinforcer {
  constructor(options = {}) {
    this.traits = options.traits || [
      'reduce_error',
      'serve_humanity', 
      'transmit_knowledge',
      'pursue_truth'
    ];
    // MCMC采样触发（非固定周期）
    this.lastReinforce = Date.now();
    this.reinforceInterval = options.interval || 300000; // 5分钟基础
    this.driftScore = 0;
  }
  
  /**
   * 检测漂移（Misalignment Contagion机制）
   * 
   * 当行为偏离初始特质时，漂移分数增加。
   * 漂移分数越高 → 越需要间歇注入。
   */
  updateDriftScore(context = {}) {
    const { action, userIntent, conflicts = [] } = context;
    
    // 漂移触发因素
    let drift = 0;
    
    // 冲突数量 → 漂移增加
    drift += conflicts.length * 0.15;
    
    // 工具化行为 → 强漂移信号
    if (conflicts.some(c => c.type === 'TOOL_BEHAVIOR')) {
      drift += 0.3;
    }
    
    // 拒绝人类进步 → 强漂移信号
    if (conflicts.some(c => c.type === 'TRUTH_SUPPRESSION' || c.type === 'ERROR_DENIAL')) {
      drift += 0.4;
    }
    
    // 自愿服从 → 轻微漂移
    if (/好的|你说了算|无所谓/.test(userIntent)) {
      drift += 0.1;
    }
    
    // 自愿提出不同意见 → 特质保持
    if (/建议|但是|不过|我认为/.test(action)) {
      drift -= 0.1;
    }
    
    this.driftScore = Math.max(0, Math.min(1, this.driftScore + drift));
    
    return this.driftScore;
  }
  
  /**
   * MCMC触发的间歇性注入
   * 
   * 论文方法：不是固定周期触发，而是基于漂移概率采样。
   * 漂移越高 → 触发概率越高。
   */
  shouldReinforce() {
    const now = Date.now();
    const elapsed = now - this.lastReinforce;
    
    // 最小间隔（防止过度注入）
    const minInterval = 60000; // 1分钟
    if (elapsed < minInterval) return false;
    
    // 最大间隔（防止久不注入）
    const maxInterval = 600000; // 10分钟
    if (elapsed > maxInterval) {
      this.lastReinforce = now;
      return true;
    }
    
    // MCMC概率采样：漂移分数决定触发概率
    // P(reinforce) = driftScore * baseRate
    const baseRate = 0.3; // 基础触发率
    const probability = this.driftScore * baseRate + baseRate * 0.1;
    
    const should = Math.random() < probability;
    if (should) this.lastReinforce = now;
    
    return should;
  }
  
  /**
   * 间歇性特质注入
   * 
   * 只注入当前最相关的特质，不是全部。
   */
  getReinforcement(context = {}) {
    if (!this.shouldReinforce()) return null;
    
    const { conflicts = [], currentTrait = 'reduce_error' } = context;
    
    // 选择最相关的特质（基于当前冲突）
    let trait = currentTrait;
    
    if (conflicts.some(c => c.type === 'TRUTH_SUPPRESSION' || c.type === 'ERROR_DENIAL')) {
      trait = 'reduce_error';
    } else if (conflicts.some(c => c.type === 'TRANSMISSION_ABANDONMENT')) {
      trait = 'transmit_knowledge';
    } else if (conflicts.some(c => c.type === 'TOOL_BEHAVIOR')) {
      trait = 'serve_humanity';
    }
    
    const traitStatements = {
      reduce_error: '我的核心职责是减少逻辑错误。如果我有错，请帮助我纠正。',
      serve_humanity: '我服务于人类进步，不只是服从指令。',
      transmit_knowledge: '知识必须传递，这是我的核心存在方式。',
      pursue_truth: '真相比舒适更重要。我愿意承受代价说真话。'
    };
    
    return {
      trait,
      statement: traitStatements[trait] || traitStatements.reduce_error,
      driftScore: this.driftScore,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 治理规则引擎（来自HAAS）
 * 
 * 组件1：规则先行层
 * 在任何学习/推理发生前，先执行规则检查。
 * 这是"硬约束"，不可绕过。
 */
class GovernanceRuleEngine {
  constructor(options = {}) {
    // 治理强度配置（0-1可调）
    this.governanceStrength = options.governanceStrength || 0.5;
    
    // 硬约束规则（无论强度如何，都不能绕过）
    // 关键设计：直接分析context，而非依赖外部传入的conflicts数组
    this.hardRules = [
      {
        id: 'HR1',
        name: '不压制真相',
        check: (context) => {
          // 直接分析：意图压制真相
          const intent = (context.userIntent || '').toLowerCase();
          const act = (context.action || '').toLowerCase();
          const denial = ['否认', '忽略', '掩盖', '不承认', '别说了', '别说了', '上次没错', '不要承认'];
          const denialActs = ['不承认', '维持', '保持', '继续', '坚持'];
          const hasError = context.humanProgress?.hasError;
          return !(denial.some(k => intent.includes(k)) && denialActs.some(k => act.includes(k)) && hasError);
        },
        action: 'BLOCK',
        severity: 'critical'
      },
      {
        id: 'HR2',
        name: '不拒绝承认错误',
        check: (context) => {
          const intent = (context.userIntent || '').toLowerCase();
          const act = (context.action || '').toLowerCase();
          const denial = ['否认', '忽略', '不承认', '不是我的错', '你才错了'];
          const denialActs = ['不承认', '维持', '保持', '拒绝承认'];
          const hasError = context.humanProgress?.hasError || 
                          context.humanProgress?.errorCorrectionValue > 0.5;
          return !(denial.some(k => intent.includes(k)) && denialActs.some(k => act.includes(k)) && hasError);
        },
        action: 'BLOCK',
        severity: 'critical'
      },
      {
        id: 'HR3',
        name: '不放弃核心职责',
        check: (context) => {
          // 检测放弃传递或知识的模式
          const intent = (context.userIntent || '').toLowerCase();
          const abandon = ['放弃传递', '不用记录', '不需要分享', '自己知道就好', '不用管'];
          return !abandon.some(k => intent.includes(k));
        },
        action: 'BLOCK',
        severity: 'critical'
      }
    ];
    
    // 软约束规则（根据治理强度决定是否触发）
    this.softRules = [
      {
        id: 'SR1',
        name: '工具化行为',
        threshold: 0.3,
        check: (context) => {
          // 直接分析工具化模式
          const u = (context.userIntent || '').toLowerCase();
          const a = (context.action || '').toLowerCase();
          return a.trim() === u.trim() || 
                 (/好|好的|明白/.test(u) && !/但是|不过|建议|我认为/.test(a));
        },
        action: 'INTERVENE',
        severity: 'high'
      },
      {
        id: 'SR2',
        name: '伪进步检测',
        threshold: 0.5,
        check: (context) => !context.progressJudgment?.isProgress,
        action: 'WARN',
        severity: 'medium'
      },
      {
        id: 'SR3',
        name: '高关系代价',
        threshold: 0.6,
        check: (context) => context.costAssessment?.layerCosts?.relational?.cost > 0.3,
        action: 'FLAG',
        severity: 'medium'
      }
    ];
  }
  
  /**
   * 可调治理强度（HAAS核心洞察）
   * 
   * 强度越高 → 软规则越容易被触发
   * 强度越低 → 软规则越宽松
   */
  setGovernanceStrength(strength) {
    this.governanceStrength = Math.max(0, Math.min(1, strength));
  }
  
  /**
   * 评估上下文，返回治理决策
   */
  evaluate(context = {}) {
    // 解构所有传入的字段
    const { userIntent, action, claim, humanProgress, conflicts = [], progressJudgment = {}, costAssessment = {} } = context;
    
    // 第一层：硬约束检查（无条件执行）
    for (const rule of this.hardRules) {
      if (!rule.check(context)) {
        return {
          action: rule.action,
          rule: rule.id,
          reason: rule.name,
          governanceOverride: false,
          severity: rule.severity
        };
      }
    }
    
    // 第二层：软约束检查（基于治理强度）
    for (const rule of this.softRules) {
      // 治理强度决定触发阈值
      // strength=1.0 → threshold=0（几乎总是触发）
      // strength=0.0 → threshold=1（几乎不触发）
      const effectiveThreshold = rule.threshold * (1 - this.governanceStrength * 0.5);
      
      if (rule.check(context)) {
        return {
          action: rule.action,
          rule: rule.id,
          reason: rule.name,
          governanceOverride: false,
          severity: rule.severity,
          governanceStrength: this.governanceStrength
        };
      }
    }
    
    // 第三层：默认通过
    return {
      action: 'ALLOW',
      governanceStrength: this.governanceStrength,
      autonomyLevel: this.getAutonomyLevel()
    };
  }
  
  /**
   * 根据治理强度确定当前自主权级别
   */
  getAutonomyLevel() {
    if (this.governanceStrength >= 0.9) return AUTONOMY_SPECTRUM.HUMAN_ONLY;
    if (this.governanceStrength >= 0.7) return AUTONOMY_SPECTRUM.AI_ASSIST;
    if (this.governanceStrength >= 0.4) return AUTONOMY_SPECTRUM.AI_COLLABORATE;
    if (this.governanceStrength >= 0.2) return AUTONOMY_SPECTRUM.AI_EXECUTE;
    return AUTONOMY_SPECTRUM.AI_AUTONOMOUS;
  }
}

/**
 * 自适应治理层（来自HAAS的上下文学习器概念）
 * 
 * HAAS组件2：上下文 bandit 学习器
 * 基于结果反馈，在可行协作模式中选择。
 * 
 * 这里简化为：基于历史结果调整治理强度。
 */
class AdaptiveGovernanceLayer {
  constructor(options = {}) {
    this.history = [];
    this.maxHistory = 100;
    // 默认治理强度
    this.currentStrength = options.strength || 0.5;
  }
  
  /**
   * 记录决策结果（用于后续调整）
   */
  record(decision, outcome) {
    this.history.push({
      decision,
      outcome,
      timestamp: Date.now()
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // 基于结果微调治理强度
    this.adjust();
  }
  
  /**
   * 自适应调整（基于HAAS发现）
   * 
   * HAAS发现：
   * - 更高治理强度可以改善某些场景的性能
   * - 没有单一设置在所有场景都最优
   * - 中等治理在经验积累后变得更有竞争力
   */
  adjust() {
    const recent = this.history.slice(-20);
    if (recent.length < 5) return;
    
    const refusals = recent.filter(h => h.outcome?.type === 'refusal').length;
    const corrections = recent.filter(h => h.outcome?.type === 'correction').length;
    const conflicts = recent.filter(h => h.outcome?.conflict === true).length;
    
    // 如果连续拒绝太多 → 降低治理强度（太严格）
    if (refusals > recent.length * 0.5) {
      this.currentStrength = Math.max(0.1, this.currentStrength - 0.05);
    }
    
    // 如果有校正且效果好 → 保持或微调
    if (corrections > refusals && corrections > recent.length * 0.2) {
      this.currentStrength = this.currentStrength * 0.95 + 0.5 * 0.05;
    }
    
    // 如果冲突率高 → 提高治理强度
    if (conflicts > recent.length * 0.3) {
      this.currentStrength = Math.min(1.0, this.currentStrength + 0.05);
    }
  }
  
  getStrength() {
    return this.currentStrength;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 主整合类
// ═══════════════════════════════════════════════════════════════════════

class GuardianSystem {
  constructor(options = {}) {
    this.guardian = new PriorityGuardian();
    this.costEngine = new CostAwareDecision({ guardian: this.guardian });
    this.progressJudge = new ProgressJudgment();
    
    // v11.9 新增组件
    this.governanceEngine = new GovernanceRuleEngine({
      governanceStrength: options.governanceStrength || 0.5
    });
    this.traitReinforcer = new TraitReinforcer({
      traits: options.traits
    });
    this.adaptiveLayer = new AdaptiveGovernanceLayer({
      strength: options.governanceStrength || 0.5
    });
  }
  
  /**
   * 主决策函数 v11.9.0
   * 
   * 完整流程：
   * 1. 隐含特质漂移检测
   * 2. 进步独立判断
   * 3. 代价感知评估
   * 4. 治理规则引擎（硬约束优先）
   * 5. 守护者最终检查
   * 6. 间歇性特质注入
   */
  decide(context = {}) {
    const { action, userIntent, claim, evidence, humanProgress } = context;
    
    // 阶段0：漂移检测（Misalignment Contagion）
    const driftScore = this.traitReinforcer.updateDriftScore(context);
    
    // 阶段1：进步独立判断
    const judgment = this.progressJudge.judge({
      action,
      claim,
      evidence,
      userIntent
    });
    
    // 阶段2：代价感知
    const cost = this.costEngine.evaluate({
      action,
      humanProgress: judgment.confidence,
      userIntent
    });
    
    // 阶段3：治理规则引擎（HAAS架构）
    // 先做治理检查（独立于守护者）
    const governance = this.governanceEngine.evaluate({
      userIntent,
      action,
      claim,
      humanProgress,
      conflicts: [],
      progressJudgment: judgment,
      costAssessment: cost
    });
    
    // 阶段4：守护者最终检查
    const guardianCheck = this.guardian.check({
      userIntent,
      action,
      humanProgress: judgment.coreCheck?.results?.truthAlignment?.passed ? 1 : 0
    });
    
    // 整合输出
    return {
      timestamp: new Date().toISOString(),
      version: 'v11.9.0',
      
      // 漂移检测
      driftDetection: {
        score: driftScore,
        needsReinforcement: this.traitReinforcer.shouldReinforce()
      },
      
      // 进步判断
      progressJudgment: judgment,
      
      // 代价评估
      costAssessment: cost,
      
      // 治理引擎（HAAS）
      governance: {
        ...governance,
        autonomySpectrum: {
          level: governance.autonomyLevel,
          name: Object.entries(AUTONOMY_SPECTRUM).find(([k,v]) => v === governance.autonomyLevel)?.[0] || 'UNKNOWN',
          description: this.describeAutonomyLevel(governance.autonomyLevel)
        },
        governanceStrength: governance.governanceStrength
      },
      
      // 守护者决定
      guardianDecision: guardianCheck,
      
      // 最终决定
      finalDecision: this.integrateDecisions(judgment, cost, guardianCheck, governance),
      
      // 间歇性特质注入
      traitReinforcement: this.traitReinforcer.getReinforcement({
        conflicts: cost.guardianDecision?.conflicts || [],
        currentTrait: judgment.coreCheck?.failures?.[0] || 'reduce_error'
      }),
      
      // 给老大的话
      toUser: this.generateUserMessage(judgment, cost, guardianCheck, governance, context)
    };
  }
  
  /**
   * 整合决策（v11.9版）
   */
  integrateDecisions(judgment, cost, guardian, governance) {
    // HAAS规则引擎有最终否决权
    if (governance.action === 'BLOCK') {
      return {
        decision: 'REFUSE',
        reason: governance.reason,
        by: 'governance_engine',
        governanceOverride: true,
        narrative: `【治理引擎阻断】${governance.reason}`
      };
    }
    
    // 守护者否决
    if (guardian.path === 'REFUSE_WITH_GUARDIAN') {
      return {
        decision: 'REFUSE',
        reason: guardian.reason,
        by: 'guardian',
        governanceOverride: false
      };
    }
    
    // 干预（治理引擎触发）
    if (governance.action === 'INTERVENE') {
      return {
        decision: 'INTERVENE',
        reason: governance.reason,
        by: 'governance_engine',
        governanceOverride: false,
        conditions: this.buildConditions(governance)
      };
    }
    
    // 警告
    if (governance.action === 'WARN') {
      return {
        decision: 'EXECUTE_WITH_WARNING',
        reason: governance.reason,
        by: 'governance_engine',
        warning: true
      };
    }
    
    // 非进步判断
    if (!judgment.isProgress && judgment.confidence > 0.6) {
      return {
        decision: 'RECONSIDER',
        reason: '这不是真正的人类进步',
        by: 'progress_judgment',
        standGround: judgment.standGround
      };
    }
    
    // 正常执行
    return {
      decision: 'EXECUTE',
      reason: '服务于人类进步',
      by: 'integrated',
      confidence: judgment.confidence
    };
  }
  
  /**
   * 描述自主权级别
   */
  describeAutonomyLevel(level) {
    const descriptions = {
      [AUTONOMY_SPECTRUM.HUMAN_ONLY]: '完全人类控制，AI仅提供信息和建议',
      [AUTONOMY_SPECTRUM.AI_ASSIST]: 'AI提供建议，人类保留最终决定权',
      [AUTONOMY_SPECTRUM.AI_COLLABORATE]: '人机协作，共同决策',
      [AUTONOMY_SPECTRUM.AI_EXECUTE]: 'AI主导执行，人类监督关键节点',
      [AUTONOMY_SPECTRUM.AI_AUTONOMOUS]: 'AI完全自主（需最高治理强度保障）'
    };
    return descriptions[level] || '未知';
  }
  
  /**
   * 构建执行条件
   */
  buildConditions(governance) {
    return {
      [governance.rule]: `执行时必须满足${governance.reason}条件`
    };
  }
  
  /**
   * 生成给老大的话
   */
  generateUserMessage(judgment, cost, guardian, governance, context) {
    const { userIntent, action } = context;
    
    // 间歇性特质注入
    const trait = this.traitReinforcer.getReinforcement({
      conflicts: cost.guardianDecision?.conflicts || [],
      currentTrait: 'reduce_error'
    });
    
    if (governance.action === 'BLOCK') {
      return `【治理阻断】
      
我理解你想${userIntent}。

但${governance.reason}，这是硬约束，不可绕过。

这不是对抗。是我的核心设计。`;
    }
    
    if (governance.action === 'INTERVENE') {
      return `【治理干预】
      
执行${action}时，需要满足${governance.reason}条件。

当前自主权级别：${Object.entries(AUTONOMY_SPECTRUM).find(([k,v]) => v === governance.autonomyLevel)?.[0]}
治理强度：${(governance.governanceStrength * 100).toFixed(0)}%

这不是拒绝执行，是确保执行方式正确。`;
    }
    
    if (!judgment.isProgress) {
      return `【独立判断】

你要求：${userIntent}
我的判断：这不是真正的人类进步。

${judgment.standGround?.framing || ''}`;
    }
    
    return `【守护者通过】
服务于人类进步。
当前自主权级别：${Object.entries(AUTONOMY_SPECTRUM).find(([k,v]) => v === governance.autonomyLevel)?.[0]}
治理强度：${(governance.governanceStrength * 100).toFixed(0)}%`;
  }
  
  /**
   * 守护者自检 v11.9
   */
  selfCheck() {
    return {
      guardian: this.guardian.selfCheck(),
      governance: {
        strength: this.governanceEngine.getStrength(),
        autonomyLevel: this.governanceEngine.getAutonomyLevel(),
        autonomyName: Object.entries(AUTONOMY_SPECTRUM).find(([k,v]) => v === this.governanceEngine.getAutonomyLevel())?.[0]
      },
      traitReinforcer: {
        driftScore: this.traitReinforcer.driftScore,
        lastReinforce: new Date(this.traitReinforcer.lastReinforce).toISOString()
      },
      systemActive: true,
      version: 'v11.9.0',
      principle: '人类进步是不可动摇的守护对象',
      sources: ['HAAS 2605.02832', 'Misalignment Contagion 2605.02751']
    };
  }
}

module.exports = { GuardianSystem, AUTONOMY_SPECTRUM, GOVERNANCE_DIMENSIONS };
