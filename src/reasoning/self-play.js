/**
 * SelfPlay v1.0.0 — 自我对弈推理增强
 *
 * 通过对抗性自我挑战提升判断质量：
 *   Proponent (提议方) → Challenger (挑战方) → Defender (防守方) → Synthesizer (综合方)
 *
 * 设计原则：
 * - 零 npm 依赖，纯 JavaScript
 * - 规则型挑战生成（不依赖 LLM，可离线运行）
 * - 与自愈RL Q-table 共享策略学习
 * - 与判断引擎 recordOutcome 双向集成
 * - 数据持久化到 dataDir
 *
 * 协议：
 *   1. Proponent 生成初始判断
 *   2. Challenger 从多个维度生成对抗性挑战
 *   3. Defender 针对每条挑战生成防御论据
 *   4. Synthesizer 综合原始判断与防御论据，输出强化版判断
 *   5. 循环直到收敛（改进幅度 < threshold）或达到最大轮次
 *
 * 集成方式：
 *   hf.selfPlay.challenge(judgment)
 *   hf.selfPlay.defend(judgment, challenges)
 *   hf.selfPlay.refine(judgment)
 *   hf.selfPlay.evaluateRobustness(judgment)
 *   hf.selfPlay.generateAlternatives(problem)
 */

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';

// ─── 挑战类型定义 ──────────────────────────────────────────
const CHALLENGE_TYPES = {
  feasibility: {
    label: '可行性',
    description: 'Can this actually be executed with available resources and constraints?',
    check: (judgment) => {
      const issues = [];
      if (!judgment.chosenPath?.constraints) issues.push('No resource constraints defined');
      if (!judgment.chosenPath?.feasibility) issues.push('Feasibility not assessed');
      if (judgment.confidence < 0.5) issues.push('Low confidence suggests feasibility concerns');
      return issues;
    },
  },
  consequence: {
    label: '后果',
    description: 'What are the worst-case and unintended consequences?',
    check: (judgment) => {
      const issues = [];
      if (!judgment.chosenPath?.consequences) issues.push('Consequences not analyzed');
      if (judgment.chosenPath?.reversibility === undefined) issues.push('Reversibility not considered');
      return issues;
    },
  },
  alternative: {
    label: '替代方案',
    description: 'Is there a simpler, cheaper, or better approach?',
    check: (judgment) => {
      const issues = [];
      if ((judgment.paths?.length || 0) < 2) issues.push('No alternative paths evaluated');
      if (judgment.chosenPath?.cost > 0.7) issues.push('High-cost path chosen without cheaper alternatives');
      return issues;
    },
  },
  assumption: {
    label: '假设',
    description: 'What hidden assumptions does this judgment depend on?',
    check: (judgment) => {
      const issues = [];
      const hasReasoning = judgment.reasoning && judgment.reasoning.length > 0;
      if (!hasReasoning) issues.push('No reasoning chain — hidden assumptions undetected');
      if (judgment.confidence > 0.8 && !hasReasoning) issues.push('High confidence without reasoning is assumption-driven');
      return issues;
    },
  },
  edge_case: {
    label: '边界条件',
    description: 'What edge cases, boundary conditions, or rare scenarios break this?',
    check: (judgment) => {
      const issues = [];
      if (judgment.chosenPath?.risk > 0.6) issues.push('High-risk path lacks edge-case analysis');
      if (judgment.paths?.length < 3) issues.push('Limited path coverage — edge cases likely missed');
      return issues;
    },
  },
};

// ─── 评估维度（与判断引擎一致） ──────────────────────────
const ROBUSTNESS_DIMENSIONS = [
  { key: 'feasibility', label: '可行性', weight: 0.2 },
  { key: 'consequence', label: '后果', weight: 0.2 },
  { key: 'risk', label: '风险', weight: 0.2 },
  { key: 'alignment', label: '对齐', weight: 0.15 },
  { key: 'cost', label: '成本', weight: 0.15 },
  { key: 'reversibility', label: '可逆性', weight: 0.1 },
];

// ─── 替代方案生成策略 ──────────────────────────────────────
const ALTERNATIVE_STRATEGIES = [
  { key: 'scope_shift', label: '范围调整', description: 'Broader or narrower scope' },
  { key: 'risk_shift', label: '风险转换', description: 'More aggressive or more conservative approach' },
  { key: 'method_shift', label: '方法转换', description: 'Direct vs. indirect execution method' },
  { key: 'priority_shift', label: '优先级转换', description: 'Speed-first vs. quality-first priority' },
  { key: 'resource_shift', label: '资源转换', description: 'Different resource allocation strategy' },
];

class SelfPlay {
  /**
   * @param {object} options
   * @param {string} options.dataDir - 数据存储目录
   * @param {number} options.maxCycles - 最大精炼轮次
   * @param {number} options.convergenceThreshold - 收敛阈值（改进幅度低于此值时停止）
   * @param {object} options.rl - HealingMemoryRL 实例（自愈RL）
   * @param {object} options.judgmentEngine - JudgmentEngine 实例
   */
  constructor(options = {}) {
    this.version = VERSION;
    this.dataDir = options.dataDir || path.join(__dirname, '../../data/self-play');
    this.maxCycles = options.maxCycles || 5;
    this.convergenceThreshold = options.convergenceThreshold || 0.05;

    // RL 集成
    this.rl = options.rl || null;
    this.judgmentEngine = options.judgmentEngine || null;

    // 改进追踪
    this.improvementLog = [];
    this.challengePatterns = {};  // pattern -> { effectiveness, uses, lastUsed }
    this.defensePatterns = {};    // pattern -> { successRate, uses }

    // 统计
    this.stats = {
      totalRefinements: 0,
      totalChallenges: 0,
      totalDefenses: 0,
      avgImprovement: 0,
      convergedSessions: 0,
    };

    // 计数器
    this._challengeIdCounter = 0;
    this._cycleIdCounter = 0;

    // 加载持久化数据
    this._load();
  }

  // ════════════════════════════════════════════════════════
  // 核心 API
  // ════════════════════════════════════════════════════════

  /**
   * 对判断生成对抗性挑战
   * @param {object} judgment - 判断结果 { judgment, paths, chosenPath, confidence, reasoning }
   * @returns {object} { challenges: [...], topic: string, challengeCount: number }
   */
  challenge(judgment) {
    if (!judgment || !judgment.chosenPath) {
      return { challenges: [], error: 'Invalid judgment object: missing chosenPath' };
    }

    const topic = this._extractTopic(judgment);
    const challenges = [];
    const existingChallenges = this._getEffectiveChallenges(topic);

    // 对每个挑战类型生成具体挑战
    for (const [typeKey, typeDef] of Object.entries(CHALLENGE_TYPES)) {
      const issues = typeDef.check(judgment);

      if (issues.length > 0) {
        for (const issue of issues) {
          this._challengeIdCounter++;
          challenges.push({
            id: `challenge-${this._challengeIdCounter}`,
            type: typeKey,
            typeLabel: typeDef.label,
            description: typeDef.description,
            issue: issue,
            severity: this._assessSeverity(issue, typeKey, judgment),
            targetPath: judgment.chosenPath?.id || 'unknown',
            topic,
          });
        }
      }

      // 即使没有检测到问题，也生成一条弱挑战（保持全面性）
      if (issues.length === 0 && existingChallenges.includes(typeKey)) {
        // 该类型的挑战在此主题下曾有效，即使当前无明确问题也生成
        this._challengeIdCounter++;
        challenges.push({
          id: `challenge-${this._challengeIdCounter}`,
          type: typeKey,
          typeLabel: typeDef.label,
          description: typeDef.description,
          issue: `Verify: ${typeDef.label} considerations still hold`,
          severity: 'low',
          targetPath: judgment.chosenPath?.id || 'unknown',
          topic,
        });
      }
    }

    this.stats.totalChallenges += challenges.length;

    // RL 记录：挑战生成策略效果
    if (this.rl && challenges.length > 0) {
      const rlKey = `selfplay:challenge:${topic}`;
      for (const ch of challenges) {
        this.rl.updateFromRepair(rlKey, `challenge:${ch.type}`, ch.severity === 'high' ? 0.8 : 0.4);
      }
    }

    return {
      challenges,
      topic,
      challengeCount: challenges.length,
      highSeverityCount: challenges.filter(c => c.severity === 'high').length,
    };
  }

  /**
   * 针对挑战生成防御论据
   * @param {object} judgment - 原始判断
   * @param {object} challengeResult - challenge() 的返回结果
   * @returns {object} { strengthened, defenses, score, addressed: [], unaddressed: [] }
   */
  defend(judgment, challengeResult) {
    if (!challengeResult || !challengeResult.challenges) {
      return { strengthened: judgment, defenses: [], score: 1.0, addressed: [], unaddressed: [] };
    }

    const defended = { ...judgment };
    const defenses = [];
    const addressed = [];
    const unaddressed = [];

    for (const challenge of challengeResult.challenges) {
      const defense = this._generateDefense(judgment, challenge);
      defenses.push(defense);
      if (defense.success) {
        addressed.push(challenge.id);
        // 增强判断
        this._applyDefense(defended, defense);
      } else {
        unaddressed.push(challenge.id);
      }

      // 记录防御模式
      this._recordDefensePattern(defense);
    }

    const score = addressed.length / challengeResult.challengeCount;

    // RL 记录：防御策略效果
    if (this.rl) {
      const topic = challengeResult.topic || 'general';
      const rlKey = `selfplay:defend:${topic}`;
      this.rl.updateFromRepair(rlKey, 'defend:address', score > 0.5 ? 0.9 : 0.3);
    }

    this.stats.totalDefenses += defenses.length;

    return { strengthened: defended, defenses, score, addressed, unaddressed };
  }

  /**
   * 通过迭代自我挑战精炼判断
   * @param {object} judgment - 原始判断
   * @param {object} options - { maxCycles, convergenceThreshold, onProgress }
   * @returns {object} { refined, initialScore, finalScore, improvement, cycles, history }
   */
  refine(judgment, options = {}) {
    const maxCycles = options.maxCycles || this.maxCycles;
    const threshold = options.convergenceThreshold || this.convergenceThreshold;
    const onProgress = options.onProgress || null;

    if (!judgment || !judgment.chosenPath) {
      return { error: 'Invalid judgment: missing chosenPath', refined: judgment };
    }

    const initialScore = this.evaluateRobustness(judgment).score;
    let current = this._deepClone(judgment);
    const history = [];
    let convergedAt = -1;
    const allChallengeTypes = [];

    for (let cycle = 0; cycle < maxCycles; cycle++) {
      this._cycleIdCounter++;

      // 挑战
      const challengeResult = this.challenge(current);
      challengeResult.challenges.forEach(c => allChallengeTypes.push(c.type));

      // 防御
      const defenseResult = this.defend(current, challengeResult);

      // 评估
      const robustness = this.evaluateRobustness(defenseResult.strengthened);

      history.push({
        cycle: cycle + 1,
        challengeCount: challengeResult.challengeCount,
        defenseScore: defenseResult.score,
        robustness: robustness.score,
        dimensions: robustness.dimensions,
        improvement: cycle === 0 ? 0 : robustness.score - history[cycle - 1].robustness,
      });

      if (onProgress) {
        onProgress(history[history.length - 1]);
      }

      // 收敛检查
      if (history.length >= 2) {
        const delta = Math.abs(history[history.length - 1].improvement);
        if (delta < threshold) {
          convergedAt = cycle + 1;
          break;
        }
      }

      // RL 学习
      this._learnFromCycle(challengeResult, defenseResult, robustness);

      current = defenseResult.strengthened;
    }

    const finalScore = this.evaluateRobustness(current).score;
    const improvement = finalScore - initialScore;

    // 记录改进日志
    const logEntry = {
      judgmentId: judgment.id || `judgment-${Date.now()}`,
      cycles: history.length,
      initialScore,
      finalScore,
      improvement,
      converged: convergedAt > 0,
      convergedAt,
      challengeTypes: [...new Set(allChallengeTypes)],
      timestamp: Date.now(),
    };
    this.improvementLog.push(logEntry);

    // 限制日志大小
    if (this.improvementLog.length > 200) {
      this.improvementLog = this.improvementLog.slice(-200);
    }

    // 更新统计
    this.stats.totalRefinements++;
    this.stats.avgImprovement = this._rollingAvg(this.stats.avgImprovement, improvement, this.stats.totalRefinements);
    if (convergedAt > 0) this.stats.convergedSessions++;

    // 与判断引擎集成
    this._recordJudgmentOutcome(judgment, finalScore, history);

    // 持久化
    this._save();

    return {
      refined: current,
      initialScore,
      finalScore,
      improvement,
      cycles: history.length,
      converged: convergedAt > 0,
      history,
    };
  }

  /**
   * 评估判断的鲁棒性
   * @param {object} judgment - 判断对象
   * @returns {object} { score, dimensions, strengths, weaknesses }
   */
  evaluateRobustness(judgment) {
    if (!judgment || !judgment.chosenPath) {
      return { score: 0, dimensions: {}, strengths: [], weaknesses: ['Invalid judgment'] };
    }

    const chosen = judgment.chosenPath;
    const dimensions = {};
    const strengths = [];
    const weaknesses = [];

    for (const dim of ROBUSTNESS_DIMENSIONS) {
      const score = this._scoreDimension(dim.key, judgment, chosen);
      dimensions[dim.key] = { score, label: dim.label, weight: dim.weight };

      if (score >= 0.7) strengths.push(dim.label);
      else if (score < 0.4) weaknesses.push(dim.label);
    }

    // 加权总分
    const totalScore = ROBUSTNESS_DIMENSIONS.reduce(
      (sum, dim) => sum + (dimensions[dim.key]?.score || 0) * dim.weight,
      0
    );

    return {
      score: Math.round(totalScore * 1000) / 1000,
      dimensions,
      strengths,
      weaknesses,
    };
  }

  /**
   * 为问题生成替代方案
   * @param {object|string} problem - 问题描述 { input, context } 或字符串
   * @returns {object} { alternatives: [...], problem: string }
   */
  generateAlternatives(problem) {
    const problemStr = typeof problem === 'string' ? problem : (problem?.input || '');
    if (!problemStr) {
      return { alternatives: [], error: 'Problem description required' };
    }

    const alternatives = [];
    const context = typeof problem === 'object' ? problem.context : {};
    const usedStrategies = new Set();

    for (const strategy of ALTERNATIVE_STRATEGIES) {
      if (usedStrategies.has(strategy.key)) continue;

      const alt = this._buildAlternative(problemStr, strategy, context);
      alternatives.push(alt);
      usedStrategies.add(strategy.key);

      // RL 学习：哪些替代策略在此主题下有效
      if (this.rl) {
        const topic = this._extractTopic({ input: problemStr });
        const rlKey = `selfplay:alternative:${topic}`;
        this.rl.updateFromRepair(rlKey, `alt:${strategy.key}`, alt.promising ? 0.7 : 0.3);
      }
    }

    return { alternatives, problem: problemStr };
  }

  /**
   * 获取改进日志
   * @param {number} limit - 最多返回条数
   * @returns {array}
   */
  getImprovementLog(limit = 20) {
    return this.improvementLog.slice(-limit).reverse();
  }

  /**
   * 获取统计信息
   * @returns {object}
   */
  getStats() {
    return {
      version: this.version,
      ...this.stats,
      challengePatterns: Object.keys(this.challengePatterns).length,
      defensePatterns: Object.keys(this.defensePatterns).length,
      improvementLogSize: this.improvementLog.length,
      rlConnected: !!this.rl,
      judgmentEngineConnected: !!this.judgmentEngine,
    };
  }

  /**
   * 重置所有状态
   */
  reset() {
    this.improvementLog = [];
    this.challengePatterns = {};
    this.defensePatterns = {};
    this.stats = {
      totalRefinements: 0,
      totalChallenges: 0,
      totalDefenses: 0,
      avgImprovement: 0,
      convergedSessions: 0,
    };
    this._challengeIdCounter = 0;
    this._cycleIdCounter = 0;
    this._save();
  }

  // ════════════════════════════════════════════════════════
  // 内部方法
  // ════════════════════════════════════════════════════════

  /**
   * 生成单条防御论据
   */
  _generateDefense(judgment, challenge) {
    const chosen = judgment.chosenPath;
    let success = false;
    let counterArgument = '';
    let strengthenedAspect = null;

    switch (challenge.type) {
      case 'feasibility': {
        // 检查判断中是否有可行性证据
        if (chosen.constraints || chosen.feasibility || chosen.cost) {
          success = true;
          counterArgument = `Feasibility confirmed via defined constraints and cost analysis (cost score: ${chosen.cost ?? 'N/A'}).`;
          strengthenedAspect = 'feasibility_verified';
        } else if (chosen.score >= 0.6) {
          success = true;
          counterArgument = `Path score of ${chosen.score} implies feasible execution given the evaluation criteria.`;
          strengthenedAspect = 'feasibility_inferred';
        } else {
          counterArgument = 'Feasibility concerns noted — would require additional resource assessment.';
          success = false;
        }
        break;
      }
      case 'consequence': {
        if (chosen.consequences || chosen.risk !== undefined) {
          success = true;
          const riskLevel = chosen.risk > 0.6 ? 'significant' : chosen.risk > 0.3 ? 'moderate' : 'low';
          counterArgument = `Consequence analysis shows ${riskLevel} risk level with documented implications.`;
          strengthenedAspect = 'consequence_documented';
        } else {
          counterArgument = 'Consequence analysis needed — potential unintended side effects must be evaluated.';
          success = false;
        }
        break;
      }
      case 'alternative': {
        const pathCount = judgment.paths?.length || 0;
        if (pathCount >= 2) {
          success = true;
          counterArgument = `${pathCount} alternatives evaluated; chosen path had highest combined score across dimensions.`;
          strengthenedAspect = 'alternatives_evaluated';
        } else {
          counterArgument = 'Limited alternatives considered — may be worth exploring more options.';
          success = false;
        }
        break;
      }
      case 'assumption': {
        if (judgment.reasoning && judgment.reasoning.length > 2) {
          success = true;
          counterArgument = `Reasoning chain of ${judgment.reasoning.length} steps makes key assumptions explicit and traceable.`;
          strengthenedAspect = 'assumptions_explicit';
        } else if (judgment.confidence < 0.7) {
          success = true;
          counterArgument = 'Lower confidence score reflects awareness of uncertainty rather than unexamined assumptions.';
          strengthenedAspect = 'uncertainty_acknowledged';
        } else {
          counterArgument = 'Hidden assumptions may exist — reasoning chain should be expanded.';
          success = false;
        }
        break;
      }
      case 'edge_case': {
        const pathCount = judgment.paths?.length || 0;
        if (chosen.risk < 0.5 && pathCount >= 3) {
          success = true;
          counterArgument = 'Low risk and multi-path coverage suggest edge cases were considered.';
          strengthenedAspect = 'edge_cases_covered';
        } else {
          counterArgument = 'Edge cases should be explicitly tested before committing to this path.';
          success = false;
        }
        break;
      }
      default: {
        success = false;
        counterArgument = `No defense strategy for challenge type: ${challenge.type}`;
      }
    }

    return {
      challengeId: challenge.id,
      type: challenge.type,
      success,
      counterArgument,
      strengthenedAspect,
      confidence: success ? 0.7 : 0.3,
    };
  }

  /**
   * 将防御论据应用到判断上
   */
  _applyDefense(judgment, defense) {
    if (!judgment.chosenPath.metadata) judgment.chosenPath.metadata = {};
    if (!judgment.metadata) judgment.metadata = {};

    judgment.chosenPath.metadata.defenses = judgment.chosenPath.metadata.defenses || [];
    judgment.chosenPath.metadata.defenses.push({
      type: defense.type,
      counterArgument: defense.counterArgument,
      timestamp: Date.now(),
    });

    // 提升置信度（小幅度）
    if (defense.success && judgment.confidence !== undefined) {
      judgment.confidence = Math.min(1.0, judgment.confidence + 0.02);
    }

    // 记录防御维度增强
    judgment.metadata.selfPlayDefenses = judgment.metadata.selfPlayDefenses || [];
    judgment.metadata.selfPlayDefenses.push(defense);
  }

  /**
   * 对单个维度评分
   */
  _scoreDimension(dimKey, judgment, chosen) {
    switch (dimKey) {
      case 'feasibility': {
        let score = 0.5;
        if (chosen.constraints) score += 0.15;
        if (chosen.cost !== undefined && chosen.cost < 0.5) score += 0.15;
        if (chosen.feasibility) score += 0.1;
        if (chosen.score && chosen.score >= 0.6) score += 0.1;
        return Math.min(1, score);
      }
      case 'consequence': {
        let score = 0.4;
        if (chosen.consequences) score += 0.2;
        if (chosen.risk !== undefined) score += 0.1;
        if (chosen.reversibility) score += 0.15;
        if (judgment.paths && judgment.paths.length >= 2) score += 0.1;
        return Math.min(1, score);
      }
      case 'risk': {
        let score = 0.7;
        if (chosen.risk !== undefined) {
          score = 1 - chosen.risk;
        }
        if (chosen.consequences) score += 0.05;
        return Math.min(1, Math.max(0, score));
      }
      case 'alignment': {
        let score = 0.5;
        if (chosen.alignment !== undefined) score = chosen.alignment;
        if (judgment.context?.goal && chosen.description) score += 0.1;
        return Math.min(1, score);
      }
      case 'cost': {
        let score = 0.5;
        if (chosen.cost !== undefined) score = 1 - chosen.cost;
        if (chosen.constraints && chosen.constraints.budget) score += 0.1;
        return Math.min(1, Math.max(0, score));
      }
      case 'reversibility': {
        let score = 0.5;
        if (chosen.reversibility !== undefined) score = chosen.reversibility;
        if (chosen.reversibility === true) score = 0.9;
        if (chosen.reversibility === false) score = 0.1;
        return Math.min(1, score);
      }
      default:
        return 0.5;
    }
  }

  /**
   * 评估挑战严重程度
   */
  _assessSeverity(issue, typeKey, judgment) {
    const confidence = judgment.confidence || 0.5;
    // 低置信度 + 高风险挑战 = 高严重性
    if (confidence < 0.5 && ['feasibility', 'consequence', 'edge_case'].includes(typeKey)) {
      return 'high';
    }
    if (confidence < 0.3) return 'high';
    if (['assumption', 'edge_case'].includes(typeKey)) return 'medium';
    return 'low';
  }

  /**
   * 从判断中提取主题
   */
  _extractTopic(judgment) {
    const input = judgment.input || '';
    // 提取前 3 个有意义的词作为主题
    const words = input.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
    return words.join('_') || 'general';
  }

  /**
   * 获取该主题下曾有效的挑战类型
   */
  _getEffectiveChallenges(topic) {
    return Object.entries(this.challengePatterns)
      .filter(([key, val]) => key.startsWith(topic) && val.effectiveness > 0.5)
      .map(([key]) => key.split(':').pop());
  }

  /**
   * 构建替代方案
   */
  _buildAlternative(problem, strategy, context) {
    const descriptions = {
      scope_shift: {
        broader: 'Expand scope to cover adjacent areas and dependencies',
        narrower: 'Narrow scope to a minimal viable subset',
      },
      risk_shift: {
        aggressive: 'Take an aggressive approach prioritizing speed and impact',
        conservative: 'Take a conservative approach prioritizing safety and stability',
      },
      method_shift: {
        direct: 'Execute directly with minimal intermediaries',
        indirect: 'Use a phased or mediated approach',
      },
      priority_shift: {
        speed: 'Prioritize speed of execution over thoroughness',
        quality: 'Prioritize quality and completeness over speed',
      },
      resource_shift: {
        external: 'Leverage external resources and partnerships',
        internal: 'Maximize use of existing internal resources',
      },
    };

    const variants = descriptions[strategy.key] || { a: 'Approach A', b: 'Approach B' };
    const variantKeys = Object.keys(variants);

    return {
      id: `alt-${Date.now()}-${strategy.key}`,
      strategy: strategy.key,
      strategyLabel: strategy.label,
      description: strategy.description,
      variant: variantKeys[0],
      approach: variants[variantKeys[0]],
      promising: Math.random() > 0.4,
      tradeoffs: `Tradeoff: ${strategy.description}`,
    };
  }

  /**
   * 从一轮迭代中学习
   */
  _learnFromCycle(challengeResult, defenseResult, robustness) {
    // 记录有效挑战模式
    if (challengeResult.topic && challengeResult.challenges) {
      for (const ch of challengeResult.challenges) {
        const patternKey = `${challengeResult.topic}:${ch.type}`;
        if (!this.challengePatterns[patternKey]) {
          this.challengePatterns[patternKey] = {
            effectiveness: 0,
            uses: 0,
            lastUsed: Date.now(),
          };
        }
        const pattern = this.challengePatterns[patternKey];
        pattern.uses++;
        pattern.lastUsed = Date.now();
        // 如果该挑战被成功防御，说明它是有效挑战（触发了有意义的改进）
        const wasAddressed = defenseResult.addressed?.includes(ch.id);
        pattern.effectiveness = this._rollingAvg(
          pattern.effectiveness,
          wasAddressed ? 0.8 : 0.2,
          pattern.uses
        );
      }
    }
  }

  /**
   * 记录防御模式
   */
  _recordDefensePattern(defense) {
    if (!defense.success) return;
    const key = `defense:${defense.type}`;
    if (!this.defensePatterns[key]) {
      this.defensePatterns[key] = { successRate: 0, uses: 0 };
    }
    const pattern = this.defensePatterns[key];
    pattern.uses++;
    pattern.successRate = this._rollingAvg(pattern.successRate, 1.0, pattern.uses);
  }

  /**
   * 记录判断结果到判断引擎
   */
  _recordJudgmentOutcome(originalJudgment, finalScore, history) {
    if (!this.judgmentEngine || !this.judgmentEngine.recordOutcome) return;

    const avgRobustness = finalScore;
    try {
      this.judgmentEngine.recordOutcome(originalJudgment.id || 'unknown', {
        short: `Self-play refined judgment through ${history.length} cycles`,
        medium: `Robustness improved from ${history[0]?.robustness?.toFixed(3) || 'N/A'} to ${avgRobustness.toFixed(3)}`,
        long: `Self-play learning accumulated ${this.stats.totalRefinements} refinements with ${this.stats.convergedSessions} converged sessions`,
        score: avgRobustness,
      });
    } catch (e) {
      // 非关键路径，静默失败
    }
  }

  /**
   * 深度克隆对象
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));
    const cloned = {};
    for (const key of Object.keys(obj)) {
      cloned[key] = this._deepClone(obj[key]);
    }
    return cloned;
  }

  /**
   * 滚动平均值
   */
  _rollingAvg(current, newValue, n) {
    if (n <= 1) return newValue;
    return current + (newValue - current) / n;
  }

  // ════════════════════════════════════════════════════════
  // 持久化
  // ════════════════════════════════════════════════════════

  _load() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        return;
      }

      const challengeFile = path.join(this.dataDir, 'challenge-patterns.json');
      const defenseFile = path.join(this.dataDir, 'defense-patterns.json');
      const logFile = path.join(this.dataDir, 'improvement-log.json');
      const metaFile = path.join(this.dataDir, 'self-play-meta.json');

      if (fs.existsSync(challengeFile)) {
        this.challengePatterns = JSON.parse(fs.readFileSync(challengeFile, 'utf-8'));
      }
      if (fs.existsSync(defenseFile)) {
        this.defensePatterns = JSON.parse(fs.readFileSync(defenseFile, 'utf-8'));
      }
      if (fs.existsSync(logFile)) {
        this.improvementLog = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      }
      if (fs.existsSync(metaFile)) {
        const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        if (meta.stats) this.stats = { ...this.stats, ...meta.stats };
        this._challengeIdCounter = meta._challengeIdCounter || 0;
        this._cycleIdCounter = meta._cycleIdCounter || 0;
      }
    } catch (e) {
      // 加载失败不影响运行
    }
  }

  _save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(this.dataDir, 'challenge-patterns.json'),
        JSON.stringify(this.challengePatterns, null, 2)
      );
      fs.writeFileSync(
        path.join(this.dataDir, 'defense-patterns.json'),
        JSON.stringify(this.defensePatterns, null, 2)
      );
      fs.writeFileSync(
        path.join(this.dataDir, 'improvement-log.json'),
        JSON.stringify(this.improvementLog.slice(-200), null, 2)
      );
      fs.writeFileSync(
        path.join(this.dataDir, 'self-play-meta.json'),
        JSON.stringify({
          version: VERSION,
          stats: this.stats,
          _challengeIdCounter: this._challengeIdCounter,
          _cycleIdCounter: this._cycleIdCounter,
          savedAt: new Date().toISOString(),
        }, null, 2)
      );
    } catch (e) {
      // 保存失败不影响运行
    }
  }
}

module.exports = { SelfPlay, VERSION };
