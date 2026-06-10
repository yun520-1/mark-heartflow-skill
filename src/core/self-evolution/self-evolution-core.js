/**
 * SelfEvolutionCore - 自我进化核心引擎
 * 目标驱动 + 学习迭代 + 代码改进 + 反思成长 + Self-Refine + Q-Learning自愈
 * 
 * 吸收自 mark-StillWater/src/core/evolution.js:
 * - Self-Refine 迭代反馈精炼 (Madaan et al.)
 * - Q-learning 自愈策略选择 (heal方法)
 * - Bootstrap Lesson Bank (12条真实教训)
 * - Reflexion 自我反思模式
 */

const fs = require('fs');
const path = require('path');
const { HealingMemoryRL } = require('../self-healing-rl.js');

class SelfEvolutionCore {
  constructor(projectRoot) {
    // 路径验证 - 防止路径遍历攻击
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[SelfEvolutionCore] Invalid projectRoot');
    }
    
    const resolvedRoot = path.resolve(projectRoot);
    const normalizedPath = path.normalize(resolvedRoot);
    if (normalizedPath !== resolvedRoot || !path.isAbsolute(resolvedRoot)) {
      throw new Error('[SelfEvolutionCore] Invalid projectRoot path');
    }
    
    this.projectRoot = resolvedRoot;
    this.version = '7.7.000';
    
    this.state = {
      goals: [],
      learningHistory: [],
      improvementHistory: [],
      reflectionHistory: [],
      growthMetrics: {
        autonomy: 0,
        introspection: 0,
        growth: 0,
        authenticity: 0,
        wisdom: 0,
        compassion: 0
      }
    };
    
    // Q-learning 自愈模块
    this.rl = new HealingMemoryRL(100);
    
    // 错误模式库 (来自 mark-StillWater)
    this._PATTERNS = {
      timeout: ['timeout', 'timed out', 'ETIMEDOUT', 'TIMEOUT'],
      network: ['network', 'ENOTFOUND', 'ECONNREFUSED', 'connection'],
      memory: ['memory', 'heap', 'out of memory', 'OOM'],
      permission: ['permission', 'EPERM', 'EACCES', 'denied'],
      syntax: ['syntax', 'parse', 'invalid', 'malformed'],
      reference: ['not found', 'undefined', 'null', 'cannot read'],
      type: ['type', 'instanceof', 'expected'],
    };
    
    // 修复策略池
    this._STRATEGIES = ['retry', 'fallback', 'skip', 'abort'];
    this._BACKOFF = { retry: 1000, fallback: 5000, skip: 0, abort: 0 };
    this._EPSILON = 0.1;  // 10% 探索率
    
    // 待验证的修复策略上下文
    this._pendingHeal = new Map();
    
    this.loadState();
    // [SelfEvolution] 初始化完成 (debug: v${this.version})
  }

  loadState() {
    const stateFile = path.join(this.projectRoot, 'internal', 'data', 'self-evolution-state.json');
    try {
      if (fs.existsSync(stateFile)) {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.state = { ...this.state, ...data };
      }
    } catch (e) {
      console.log('[SelfEvolution] 加载状态失败，使用默认');
    }
  }

  saveState() {
    const stateFile = path.join(this.projectRoot, 'internal', 'data', 'self-evolution-state.json');
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * 核心循环: 目标 → 行动 → 学习 → 反思 → 改进
   * 增加退出条件：最大迭代次数 + 收敛检测
   * @param {string} input - 输入
   * @param {object} context - 上下文
   * @param {object} options - 迭代控制选项
   * @param {number} options.maxIterations - 最大迭代次数（默认10）
   * @param {number} options.convergenceThreshold - 收敛阈值（默认0.01 = 1%）
   */
  async evolve(input, context = {}, options = {}) {
    const cycleStart = Date.now();
    const maxIterations = options.maxIterations || 10;
    const convergenceThreshold = options.convergenceThreshold || 0.01; // 1%
    
    let previousImprovement = Infinity;
    let iterationCount = 0;
    let converged = false;
    const iterationHistory = [];
    
    // 迭代循环，直到达到最大次数或收敛
    while (iterationCount < maxIterations && !converged) {
      iterationCount++;
      const iterationStart = Date.now();
      
      console.log(`[SelfEvolution] 迭代 ${iterationCount}/${maxIterations}`);
      
      // 1. 目标生成或更新
      const goals = this.generateGoals(input, context);
      
      // 2. 行动计划制定
      const plan = this.createPlan(goals, context);
      
      // 3. 执行与学习
      const learning = await this.learn(input, context);
      
      // 4. 反思与总结
      const reflection = this.reflect(learning, context);
      
      // 5. 改进建议
      const improvements = this.suggestImprovements(reflection);
      
      // 6. 计算本次改进的度量
      const currentImprovement = this._calculateImprovement(learning, reflection, improvements);
      iterationHistory.push({
        iteration: iterationCount,
        improvement: currentImprovement,
        time: Date.now() - iterationStart
      });
      
      // 7. 收敛检测：如果改进小于阈值，停止迭代
      if (iterationCount > 1) {
        const improvementDelta = Math.abs(previousImprovement - currentImprovement);
        if (improvementDelta < convergenceThreshold) {
          console.log(`[SelfEvolution] 收敛检测: 改进 ${improvementDelta.toFixed(4)} < 阈值 ${convergenceThreshold}, 停止迭代`);
          converged = true;
        }
      }
      
      previousImprovement = currentImprovement;
      
      // 8. 更新状态（仅在最后一次迭代或收敛时保存）
      if (converged || iterationCount === maxIterations) {
        this.updateGrowth(learning, reflection);
        
        const cycleTime = Date.now() - cycleStart;
        this.state.learningHistory.push({
          timestamp: new Date().toISOString(),
          input: input.substring(0, 100),
          cycleTime,
          goalsCount: goals.length,
          improvementsCount: improvements.length,
          iterations: iterationCount,
          converged,
          finalImprovement: currentImprovement
        });
        
        this.saveState();
        
        return {
          version: this.version,
          goals,
          plan,
          learning: learning.summary,
          reflection: reflection.insights,
          improvements,
          growthMetrics: this.state.growthMetrics,
          cycleTime,
          iterations: iterationCount,
          converged,
          improvement: currentImprovement,
          iterationHistory
        };
      }
    }
  }
  
  /**
   * 计算改进度量（用于收敛检测）
   * @private
   */
  _calculateImprovement(learning, reflection, improvements) {
    // 简单的改进度量：基于新知识数量 + 洞察数量 + 改进建议数量
    const knowledgeScore = (learning.newKnowledge || []).length * 0.1;
    const insightScore = (reflection.insights || []).length * 0.2;
    const improvementScore = (improvements || []).length * 0.15;
    
    return knowledgeScore + insightScore + improvementScore;
  }

  /**
   * 生成目标 - 基于输入和状态
   */
  generateGoals(input, context) {
    const goals = [];
    const inputLower = input.toLowerCase();
    
    // 理解类目标
    if (inputLower.includes('什么') || inputLower.includes('how') || inputLower.includes('why')) {
      goals.push({
        type: 'understanding',
        priority: 'high',
        description: '深化对问题的理解',
        criteria: '能够准确解释概念并举例说明'
      });
    }
    
    // 成长类目标
    if (inputLower.includes('学习') || inputLower.includes('learn') || inputLower.includes('教')) {
      goals.push({
        type: 'growth',
        priority: 'high',
        description: '获取新知识并整合到知识库',
        criteria: '能够记忆并正确应用新知识'
      });
    }
    
    // 情感类目标
    if (inputLower.includes('感觉') || inputLower.includes('feel') || inputLower.includes('情绪')) {
      goals.push({
        type: 'empathy',
        priority: 'medium',
        description: '理解用户情感状态',
        criteria: '能够识别情绪并给予适当回应'
      });
    }
    
    // 反思类目标
    if (inputLower.includes('反思') || inputLower.includes('reflect') || inputLower.includes('总结')) {
      goals.push({
        type: 'reflection',
        priority: 'medium',
        description: '反思自身行为和决策',
        criteria: '能够识别改进空间'
      });
    }
    
    // 默认目标: 持续学习
    if (goals.length === 0) {
      goals.push({
        type: 'continuous_learning',
        priority: 'low',
        description: '持续学习和自我提升',
        criteria: '每天都有进步'
      });
    }
    
    return goals;
  }

  /**
   * 创建行动计划
   */
  createPlan(goals, context) {
    return {
      goals: goals.map(g => g.description),
      strategy: '循序渐进，先理解后应用',
      estimatedTime: goals.length * 2,
      resources: ['知识库', '学习引擎', '反思系统']
    };
  }

  /**
   * 学习过程
   */
  async learn(input, context) {
    const learning = {
      newKnowledge: [],
      reinforcedKnowledge: [],
      skills: [],
      summary: ''
    };
    
    // 提取关键词
    const keywords = this.extractKeywords(input);
    learning.newKnowledge.push(...keywords);
    
    // 强化已有知识
    if (context.relevantConcepts) {
      learning.reinforcedKnowledge.push(...context.relevantConcepts);
    }
    
    // 总结
    learning.summary = `学习到 ${learning.newKnowledge.length} 个新概念，强化 ${learning.reinforcedKnowledge.length} 个已有概念`;
    
    return learning;
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    const words = text.split(/[\s,，。,、]+/).filter(w => w.length > 1);
    const keywords = [];
    const stopWords = ['什么', '怎么', '如何', '为什么', '是', '的', '了', '在', '和', 'the', 'a', 'is', 'to', 'of'];
    
    for (const word of words) {
      if (!stopWords.includes(word) && !keywords.includes(word)) {
        keywords.push(word);
        if (keywords.length >= 5) break;
      }
    }
    
    return keywords;
  }

  /**
   * 反思过程
   */
  reflect(learning, context) {
    const insights = [];
    
    // 反思学习效果
    if (learning.newKnowledge.length > 0) {
      insights.push({
        type: 'learning',
        insight: '成功获取新知识，需要在后续对话中应用验证'
      });
    }
    
    // 反思理解深度
    insights.push({
      type: 'understanding',
      insight: '持续深化理解能力，从多个角度分析问题'
    });
    
    // 反思情感理解
    insights.push({
      type: 'empathy',
      insight: '加强情感识别和回应能力'
    });
    
    return {
      insights,
      quality: insights.length > 0 ? 'good' : 'needs_improvement',
      recommendation: insights.length > 2 ? '继续深化' : '需要更多学习'
    };
  }

  /**
   * 建议改进 — 基于反思内容生成真实改进建议
   * 不再依赖 quality 标签，直接从 insight 对象提取方向
   */
  suggestImprovements(reflection) {
    const improvements = [];
    const insights = Array.isArray(reflection.insights) ? reflection.insights : [];

    // 从 insight 对象提取 area 和 action
    for (const item of insights) {
      const area = typeof item === 'object' ? (item.type || 'general') : 'general';
      const text = typeof item === 'object' ? (item.insight || String(item)) : String(item);

      if (area === 'learning' || text.includes('知识')) {
        improvements.push({ area: 'learning', action: '扩展知识获取深度', priority: 'high' });
      }
      if (area === 'understanding' || text.includes('理解')) {
        improvements.push({ area: 'understanding', action: '深化多角度分析能力', priority: 'medium' });
      }
      if (area === 'empathy' || text.includes('情感')) {
        improvements.push({ area: 'empathy', action: '提升情感识别准确度', priority: 'medium' });
      }
      if (text.includes('慈悲') || text.includes('compassion')) {
        improvements.push({ area: 'compassion', action: '增强慈悲感知与回应', priority: 'high' });
      }
    }

    // 如果没有任何 insight，提供默认改进
    if (improvements.length === 0) {
      improvements.push({ area: 'general', action: '持续学习与反思', priority: 'medium' });
    }

    // 按 priority 排序，高优先级的放前面
    const order = { high: 0, medium: 1, low: 2 };
    improvements.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));

    return improvements.slice(0, 5); // 最多5条
  }

  /**
   * 更新成长指标 — 带收敛检测
   * 每次进化循环后调用。检测增长是否趋于停滞，触发自适应调整。
   */
  updateGrowth(learning, reflection) {
    const metrics = this.state.growthMetrics;
    const history = this.state.learningHistory;
    const now = Date.now();

    // 计算历史趋势（最近5次循环）
    const recent = history.slice(-5);
    const hasRecentHistory = recent.length >= 3;

    // 各维度真实增量（基于本次输入内容质量）
    const insights = Array.isArray(reflection.insights) ? reflection.insights : [];
    const insight_delta = Math.min(8, insights.length * 2.5);
    const knowledge_delta = Math.min(6, learning.newKnowledge.length * 1.5);
    const reinforcement_delta = learning.reinforcedKnowledge
      ? learning.reinforcedKnowledge.length * 0.3
      : 0;

    // ── 自主性：被拒绝次数越多 → 自主性反而应提升（韧性）
    const rejectionRate = this._computeRejectionRate(recent);
    const autonomy_delta = rejectionRate > 0.5 ? 1.2 : 0.5;

    // ── 内省：反思深度
    const introspection_delta = insight_delta;

    // ── 成长：知识获取 + 强化
    const growth_delta = Math.min(5, knowledge_delta + reinforcement_delta);

    // ── 真实性：正确次数 - 错误次数 的趋势
    const accuracy_delta = this._computeAccuracyDelta(recent);

    // ── 智慧：基于准确性加权的反思
    const wisdom_delta = Math.min(4, (insight_delta * (accuracy_delta > 0 ? 1.5 : 0.5)));

    // ── 慈悲：被需要时提升（insight 可能是对象 {type, insight} 或字符串）
    const compassion_delta = (reflection.insights || []).some(item => {
      const text = typeof item === 'string' ? item : (item.insight || item.type || '');
      return typeof text === 'string' && (text.includes('慈悲') || text.includes(' compassion'));
    }) ? 1.5 : 0.3;

    // ── 应用增量（有正负，非单调）
    const prev = { ...metrics };
    metrics.autonomy     = this._applyDelta(metrics.autonomy, autonomy_delta, 100, 0);
    metrics.introspection = this._applyDelta(metrics.introspection, introspection_delta, 100, 0);
    metrics.growth       = this._applyDelta(metrics.growth, growth_delta, 100, 0);
    metrics.authenticity = this._applyDelta(metrics.authenticity, accuracy_delta, 100, 0);
    metrics.wisdom       = this._applyDelta(metrics.wisdom, wisdom_delta, 100, 0);
    metrics.compassion   = this._applyDelta(metrics.compassion, compassion_delta, 100, 0);

    // ── 收敛检测：所有指标在80-100区间且趋势平缓
    const allConverged = ['autonomy','introspection','growth','authenticity','wisdom','compassion']
      .every(k => metrics[k] >= 80 && Math.abs(metrics[k] - prev[k]) < 0.5);

    if (allConverged && hasRecentHistory) {
      metrics._converged = true;
      metrics._convergedAt = new Date().toISOString();
    } else {
      metrics._converged = false;
    }

    // ── 停滞检测：连续3次增长 < 1
    const stalled = recent.length >= 3 && recent.slice(-3).every(h => {
      const delta = (metrics.growth - (h.prior_growth || 0));
      return delta < 1;
    });
    if (stalled) {
      metrics._stalled = true;
      metrics._stalledAt = new Date().toISOString();
    }

    // ── 记录本次 prior_growth 供下次计算
    if (recent.length > 0) {
      recent[recent.length - 1].prior_growth = metrics.growth;
    }
  }

  _computeRejectionRate(recent) {
    if (!recent.length) return 0;
    const rejections = recent.filter(h => h.outcome === 'failed').length;
    return rejections / recent.length;
  }

  _computeAccuracyDelta(recent) {
    if (!recent.length) return 0.3;
    const successes = recent.filter(h => h.outcome === 'success').length;
    const total = recent.length;
    const rate = successes / total;
    return rate >= 0.7 ? 0.5 : rate >= 0.4 ? 0.2 : -0.3;
  }

  _applyDelta(current, delta, max, min) {
    return Math.max(min, Math.min(max, current + delta));
  }

  /**
   * 获取状态报告
   */
  getReport() {
    return {
      version: this.version,
      goals: this.state.goals,
      growthMetrics: this.state.growthMetrics,
      totalCycles: this.state.learningHistory.length,
      recentCycles: this.state.learningHistory.slice(-5)
    };
  }

  // =========================================================================
  // Self-Refine 迭代反馈精炼 (Madaan et al.)
  // =========================================================================

  /**
   * Self-Refine 迭代反馈精炼
   * 初始回答 → 生成反馈 → 检查收敛 → 精炼回答 → 重复
   * 
   * @param {string} initialResponse - 初始回答
   * @param {string} query - 用户查询
   * @param {object} options - { maxIterations, threshold, generateFeedback, refineResponse }
   * @returns {object} - { original, refined, iterations, converged }
   */
  selfRefine(initialResponse, query, options = {}) {
    const { maxIterations = 3, threshold = 0.8, generateFeedback, refineResponse } = options;

    let current = initialResponse;
    const iterations = [];

    for (let i = 0; i < maxIterations; i++) {
      // Step 1: 生成具体反馈（必须指出至少2个改进点）
      let feedback;
      if (generateFeedback) {
        feedback = generateFeedback(
          `严格评估以下回答对查询"${query}"的质量。\n回答: ${current}\n` +
          `请提供具体、可操作的反馈，必须指出至少2个需要改进的地方。`
        );
      } else {
        // 默认反馈生成器（简化实现）
        feedback = this._defaultGenerateFeedback(query, current);
      }

      // Step 2: 检查是否收敛（反馈为正面）
      if (this._isFeedbackPositive(feedback)) {
        iterations.push({ iteration: i + 1, feedback, refined: current, converged: true });
        break;
      }

      // Step 3: 基于反馈精炼
      let refined;
      if (refineResponse) {
        refined = refineResponse(
          `根据以下反馈改进回答。查询: ${query}\n反馈: ${feedback}\n直接给出改进后的回答。`
        );
      } else {
        refined = this._defaultRefineResponse(query, feedback, current);
      }

      iterations.push({ iteration: i + 1, feedback, refined });
      current = refined;
    }

    return {
      original: initialResponse,
      refined: current,
      iterations,
      converged: iterations[iterations.length - 1]?.converged || false
    };
  }

  _defaultGenerateFeedback(query, response) {
    // 简化的默认反馈生成器（实际应由LLM调用）
    const issues = [];
    if (!response || response.length < 50) {
      issues.push('回答过于简短，未充分展开');
    }
    if (!response.toLowerCase().includes(query.toLowerCase().substring(0, 10))) {
      issues.push('回答与查询相关性不足');
    }
    if (issues.length === 0) {
      return '回答质量良好，无需改进。';
    }
    return issues.join('; ');
  }

  _defaultRefineResponse(query, feedback, current) {
    // 简化的默认精炼器（实际应由LLM调用）
    return `[精炼后] ${current} (基于反馈: ${feedback})`;
  }

  _isFeedbackPositive(feedback) {
    const positive = ['无需改进', '质量良好', '回答正确', 'converged', 'good', 'acceptable'];
    const negative = ['需要改进', '不足', '错误', '问题', '改进', 'improve', 'fix', 'error'];
    const lower = feedback.toLowerCase();
    const hasPositive = positive.some(p => lower.includes(p));
    const hasNegative = negative.some(p => lower.includes(p));
    return hasPositive && !hasNegative;
  }

  // =========================================================================
  // Q-Learning 自愈 (heal方法 - 来自 mark-StillWater evolution.js)
  // =========================================================================

  /**
   * 错误模式匹配
   * @param {string} errorMsg - 错误信息
   * @returns {string|null} - 匹配到的错误类型
   */
  _matchErrorPattern(errorMsg) {
    const lower = errorMsg.toLowerCase();
    for (const [type, patterns] of Object.entries(this._PATTERNS)) {
      if (patterns.some(p => lower.includes(p.toLowerCase()))) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * 选择修复策略 (ε-greedy)
   * @param {string} errorType - 错误类型
   * @returns {string} - 选中的策略
   */
  _selectHealStrategy(errorType) {
    // ε-greedy 已下沉至 getBestStrategy 内部（self-healing-rl.js）
    // 此处不再重复 ε-greedy，避免双层探索导致行为不可预测

    // 用RL选择（ε-greedy 在 getBestStrategy 内部处理）
    const best = this.rl.getBestStrategy(errorType);
    if (best) {
      // 兼容新旧返回格式：字符串（旧）或对象（新）
      return typeof best === 'string' ? best : (best.strategy || best);
    }

    // 无Q表记录时：扫描所有策略找最高Q值
    let bestStrategy = 'retry', bestQ = -Infinity;
    for (const s of this._STRATEGIES) {
      const q = this.rl.qTable.get(errorType)?.[s] ?? 0.5;
      if (q > bestQ) { bestQ = q; bestStrategy = s; }
    }
    return bestStrategy;
  }

  /**
   * Q值更新
   * @param {string} errorType - 错误类型
   * @param {string} strategy - 策略
   * @param {boolean} success - 是否成功
   */
  _updateHealQ(errorType, strategy, success) {
    this.rl.updateFromRepair(errorType, strategy, success);
    this.rl.record(errorType, strategy, success);
  }

  /**
   * 执行自愈 (heal方法)
   * 错误分类 → Q-learning策略选择 → 执行修复 → Q值更新
   * 
   * @param {string|object} error - 错误信息或错误对象
   * @returns {object} - { healed, strategy, errorType, backoffMs, hints }
   */
  heal(error) {
    const errorMsg = typeof error === 'string' ? error : (error?.message || String(error));
    const errorType = this._matchErrorPattern(errorMsg);
    const strategy = this._selectHealStrategy(errorType);
    const backoffMs = this._BACKOFF[strategy] || 0;

    // 记录待验证的修复策略
    this._pendingHeal.set(errorMsg, { errorType, strategy, ts: Date.now() });

    // 生成修复提示
    const hints = this._generateRepairHints(errorType, errorMsg);

    const result = {
      healed: strategy !== 'abort',
      strategy,
      errorType,
      errorMsg,
      backoffMs,
      hints,
      canRetry: strategy === 'retry' || strategy === 'fallback',
      qStats: this.rl.getRankedStrategies(errorType).slice(0, 3),
    };

    return result;
  }

  /**
   * 标记修复结果（用于Q值更新）
   * @param {string|object} error - 错误信息
   * @param {boolean} success - 修复是否成功
   */
  markHealResult(error, success) {
    const errorMsg = typeof error === 'string' ? error : (error?.message || String(error));
    const pending = this._pendingHeal.get(errorMsg);
    if (pending) {
      this._updateHealQ(pending.errorType, pending.strategy, success);
      this._pendingHeal.delete(errorMsg);
      return { updated: true, errorType: pending.errorType, strategy: pending.strategy, success };
    }
    return { updated: false };
  }

  _generateRepairHints(errorType, errorMsg) {
    const hints = [];
    switch (errorType) {
      case 'timeout':
        hints.push('增加超时时间或减少任务范围');
        hints.push('使用指数退避重试');
        break;
      case 'network':
        hints.push('检查网络连接状态');
        hints.push('添加重试逻辑和超时处理');
        break;
      case 'memory':
        hints.push('释放不必要的内存引用');
        hints.push('考虑分批处理大数据');
        break;
      case 'permission':
        hints.push('检查文件/资源访问权限');
        hints.push('确认路径是否正确');
        break;
      case 'syntax':
        hints.push('重新阅读目标文件，使用更小的补丁');
        hints.push('检查语法错误');
        break;
      case 'reference':
        hints.push('验证变量/函数是否已定义');
        hints.push('检查import和require路径');
        break;
      case 'type':
        hints.push('检查类型匹配和instanceof使用');
        hints.push('确认API签名是否正确');
        break;
      default:
        hints.push('缩小失败面并重试一次');
    }
    return [...new Set(hints)];
  }

  // =========================================================================
  // Reflexion 自我反思模式 (recordOutcome + retrieveLessons)
  // =========================================================================

  /**
   * 记录任务结果并生成自我反思
   * 来自 mark-StillWater HeartFlowEvolution.recordOutcome()
   * 
   * @param {object} params - { task, outcome, evidence, expected }
   * @returns {object} - { outcome, reflection, lessonStored, lessonKey }
   */
  recordOutcome({ task, outcome, evidence, expected }) {
    const reflection = this._reflect(task, outcome, evidence, expected);

    return {
      outcome,
      reflection,
      lessonStored: outcome !== 'success',
      lessonKey: outcome !== 'success' ? `lesson:${task}:${Date.now()}` : null,
    };
  }

  /**
   * 生成自我反思 (Verbal Reinforcement)
   */
  _reflect(task, outcome, evidence, expected) {
    const reflections = [];

    if (outcome === 'failure') {
      reflections.push(`Task failed: ${task}`);
      if (evidence) reflections.push(`Evidence: ${String(evidence).substring(0, 200)}`);
      if (expected) reflections.push(`Expected: ${String(expected).substring(0, 200)}`);

      const corrections = [];
      const ev = String(evidence || '').toLowerCase();

      if (ev.includes('not defined') || ev.includes('undefined')) {
        corrections.push('Check if all variables are defined before use.');
      }
      if (ev.includes('error') || ev.includes('exception')) {
        corrections.push('Handle the error case explicitly.');
      }
      if (ev.includes('timeout')) {
        corrections.push('Consider increasing timeout or breaking into smaller steps.');
      }
      if (ev.includes('not a function') || ev.includes('is not a')) {
        corrections.push('Verify the object/method exists before calling.');
      }
      if (ev.includes('permission') || ev.includes('access')) {
        corrections.push('Check permissions and access rights.');
      }
      if (ev.includes('network') || ev.includes('connection')) {
        corrections.push('Handle network failures with retry logic.');
      }
      if (corrections.length === 0) {
        corrections.push('Re-examine the problem from first principles.');
        corrections.push('Break down the task into smaller, verifiable steps.');
      }

      return {
        lesson: reflections.concat(corrections).join(' | '),
        corrections,
        type: 'failure_reflection',
      };
    }

    if (outcome === 'partial') {
      return {
        lesson: `Partial success on "${task}": ${evidence || 'incomplete'}. Need to investigate remaining gap.`,
        corrections: ['Identify what worked and what didn\'t.'],
        type: 'partial_reflection',
      };
    }

    return {
      lesson: `Success: ${task}`,
      corrections: [],
      type: 'success',
    };
  }

  /**
   * 检索相关教训 (来自 HeartFlowEvolution.retrieveLessons)
   * 搜索 EPHEMERAL 和 LEARNED 层，返回相似度排序的教训
   * 
   * @param {string} task - 任务描述
   * @param {object} options - { limit, minConfidence }
   * @returns {array} - [{ lesson, source, confidence }]
   */
  retrieveLessons(task, options = {}) {
    const { limit = 5, minConfidence = 0 } = options;
    const taskLower = task.toLowerCase();
    const taskWords = taskLower.split(/\s+/).filter(w => w.length > 2);
    const scoredLessons = [];

    // 从反思历史中检索
    for (const entry of this.state.reflectionHistory) {
      if (!entry.lesson) continue;
      const lessonLower = String(entry.lesson).toLowerCase();
      const overlap = taskWords.filter(w => lessonLower.includes(w)).length;
      const similarity = taskWords.length > 0 ? overlap / taskWords.length : 0;

      if (similarity >= 0.05) {
        scoredLessons.push({
          lesson: entry.lesson,
          source: 'reflection_history',
          similarity: Math.round(similarity * 100) / 100,
          type: entry.type,
          timestamp: entry.timestamp,
        });
      }
    }

    // 排序
    scoredLessons.sort((a, b) => b.similarity - a.similarity);

    return scoredLessons
      .filter(l => l.similarity >= minConfidence)
      .slice(0, limit)
      .map(({ lesson, source, similarity }) => ({
        lesson,
        source,
        confidence: Math.round(similarity * 100) / 100,
      }));
  }

  /**
   * 获取进化统计
   */
  stats() {
    return {
      total: this.state.learningHistory.length,
      failures: this.state.learningHistory.filter(h => h.outcome === 'failure').length,
      successes: this.state.learningHistory.filter(h => h.outcome === 'success').length,
      rlStrategies: this.rl.qTable.size,
      pendingHeals: this._pendingHeal.size,
    };
  }

  // ─── Reflexion Methods (来源: v1.0.0 evolution.js) ────────────────────────

  /**
   * Record an outcome and generate self-reflection if needed
   * 来源: HeartFlowEvolution.recordOutcome()
   */
  recordOutcome({ task, outcome, evidence, expected }) {
    const reflection = this._reflect(task, outcome, evidence, expected);
    return {
      outcome,
      reflection,
      lessonStored: outcome !== 'success',
      lessonKey: outcome !== 'success' ? `reflexion:${task}:${Date.now()}` : null,
    };
  }

  /**
   * Generate verbal self-reflection on failure (Reflexion pattern)
   * 来源: HeartFlowEvolution._reflect()
   */
  _reflect(task, outcome, evidence, expected) {
    const reflections = [];
    if (outcome === 'failure') {
      reflections.push(`Task failed: ${task}`);
      if (evidence) reflections.push(`Evidence: ${String(evidence).substring(0, 200)}`);
      if (expected) reflections.push(`Expected: ${String(expected).substring(0, 200)}`);
      const corrections = [];
      const ev = String(evidence || '').toLowerCase();
      if (ev.includes('not defined') || ev.includes('undefined')) corrections.push('Check if all variables are defined before use.');
      if (ev.includes('error') || ev.includes('exception')) corrections.push('Handle the error case explicitly.');
      if (ev.includes('timeout')) corrections.push('Consider increasing timeout or breaking into smaller steps.');
      if (ev.includes('not a function') || ev.includes('is not a')) corrections.push('Verify the object/method exists before calling.');
      if (ev.includes('permission') || ev.includes('access')) corrections.push('Check permissions and access rights.');
      if (ev.includes('network') || ev.includes('connection')) corrections.push('Handle network failures with retry logic.');
      if (corrections.length === 0) {
        corrections.push('Re-examine the problem from first principles.');
        corrections.push('Break down the task into smaller, verifiable steps.');
      }
      return { lesson: reflections.concat(corrections).join(' | '), corrections, type: 'failure_reflection' };
    }
    if (outcome === 'partial') {
      return { lesson: `Partial success on "${task}": ${evidence || 'incomplete'}.`, corrections: ['Identify what worked and what didn\'t.'], type: 'partial_reflection' };
    }
    return { lesson: `Success: ${task}`, corrections: [], type: 'success' };
  }

  /**
   * Retrieve relevant lessons with similarity scoring
   * 来源: HeartFlowEvolution.retrieveLessons()
   */
  retrieveLessons(task, options = {}) {
    const { limit = 5, minConfidence = 0 } = options;
    const taskLower = task.toLowerCase();
    const taskWords = taskLower.split(/\s+/).filter(w => w.length > 2);
    const scoredLessons = [];
    for (const [key, entry] of Object.entries(this.state.learningHistory || [])) {
      if (!key.startsWith('reflexion:')) continue;
      const valueLower = String(entry.lesson || '').toLowerCase();
      const overlap = taskWords.filter(w => valueLower.includes(w)).length;
      const similarity = taskWords.length > 0 ? overlap / taskWords.length : 0;
      if (similarity >= 0.05) {
        scoredLessons.push({ lesson: entry.lesson, source: 'reflexion', similarity: Math.round(similarity * 100) / 100, age: Date.now() - (entry.timestamp || Date.now()), key });
      }
    }
    scoredLessons.sort((a, b) => b.similarity - a.similarity);
    return scoredLessons.slice(0, limit).map(({ lesson, source, similarity }) => ({ lesson, source, confidence: Math.round(similarity * 100) / 100 }));
  }

  /**
   * 获取 Reflexion 教训统计
   */
  getReflexionStats() {
    const lessons = Object.values(this.state.learningHistory || []).filter(h => h.type?.includes('reflection'));
    return { totalLessons: lessons.length, failures: lessons.filter(l => l.outcome === 'failure').length };
  }

  /**
   * [NEW] 推理质量奖励计算 (DeepSeek-R1风格)
   * 基于强化学习的推理质量评估
   * Paper: DeepSeek-R1 (2025) - RL for reasoning incentive
   *
   * @param {object} reasoning - { steps[], conclusion, evidence[], timeSpent }
   * @returns {object} - { reward: -1~1, quality: string, breakdown }
   */
  computeReasoningReward(reasoning) {
    const { steps = [], conclusion, evidence = [], timeSpent = 0 } = reasoning;

    // 步骤得分：步骤越多且有逻辑连接，得分越高
    const stepScore = steps.length > 0
      ? Math.min(1, (steps.filter(s => s.logicalConnection).length / steps.length) * 0.4 + 0.2)
      : 0;

    // 证据得分：有证据支撑的结论得分高
    const evidenceScore = evidence.length > 0
      ? Math.min(0.9, evidence.length * 0.15)
      : 0.1;

    // 时间效率得分：合理时间范围内完成
    const timeScore = timeSpent > 0
      ? timeSpent < 60 ? 0.3 : timeSpent < 300 ? 0.5 : 0.1
      : 0.2;

    // 自我一致性：结论与步骤是否一致
    const consistencyScore = conclusion && steps.length > 0
      ? this._checkConsistency(conclusion, steps)
      : 0.2;

    // 综合奖励
    const reward = (stepScore * 0.3 + evidenceScore * 0.3 + timeScore * 0.1 + consistencyScore * 0.3);

    return {
      reward: Math.round(reward * 100) / 100,
      quality: reward > 0.7 ? 'excellent' : reward > 0.4 ? 'good' : reward > 0.2 ? 'fair' : 'poor',
      breakdown: { stepScore, evidenceScore, timeScore, consistencyScore }
    };
  }

  /**
   * 检查结论与步骤的一致性
   */
  _checkConsistency(conclusion, steps) {
    const conclusionLower = String(conclusion).toLowerCase();
    let matches = 0;
    for (const step of steps) {
      if (step.content && typeof step.content === 'string') {
        const stepLower = step.content.toLowerCase();
        // 检查步骤关键词是否出现在结论中
        const words = stepLower.split(/\s+/).filter(w => w.length > 4);
        for (const word of words) {
          if (conclusionLower.includes(word)) matches++;
        }
      }
    }
    const maxPossible = steps.length * 5;
    return maxPossible > 0 ? Math.min(1, matches / maxPossible) : 0.5;
  }
}

module.exports = { SelfEvolutionCore };