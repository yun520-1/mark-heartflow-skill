/**
 * Dream Consolidation Module v1.1.0
 * 来源: v1.0.0 dream.js
 * 整合: v1.1.9 → v2.0.53
 * 简洁版睡眠整合引擎 (consolidate + prune + synthesize)
 * 与 src/core/dream.js (DAG版) 共存，提供简单API
 * 
 * v1.1.0 新增功能：
 * - 记忆衰退评分系统 (memory decay scoring)
 * - 梦质量度量 (dream quality metrics)
 * - 多周期模拟 (multi-cycle simulation)
 * - 洞察优先级排序 (insight priority ranking)
 * - 巩固冲突检测 (consolidation conflict detection)
 * - 记忆强化加权 (memory reinforcement weighting)
 * - 睡眠阶段感知 (sleep stage awareness)
 * - 梦叙事生成 (dream narrative generation)
 */

class DreamConsolidation {
  constructor(memory) {
    this.memory = memory;
    this.lastDream = null;
    this.dreamHistory = [];
    this.maxHistorySize = 10;
    
    // 睡眠阶段配置
    this.sleepStages = {
      NREM1: { name: '浅睡眠-1', duration: 0.1, consolidationRate: 0.3, pruningRate: 0.1, creativityBoost: 0.0 },
      NREM2: { name: '浅睡眠-2', duration: 0.2, consolidationRate: 0.6, pruningRate: 0.3, creativityBoost: 0.1 },
      NREM3: { name: '深睡眠', duration: 0.3, consolidationRate: 0.9, pruningRate: 0.7, creativityBoost: 0.2 },
      REM:   { name: 'REM睡眠', duration: 0.2, consolidationRate: 0.7, pruningRate: 0.4, creativityBoost: 0.8 },
      NREM4: { name: '过渡睡眠', duration: 0.2, consolidationRate: 0.5, pruningRate: 0.2, creativityBoost: 0.3 }
    };
    
    // 衰退参数
    this.decayParams = {
      halfLifeDays: { core: 365, identity: 180, consolidated: 90, lesson: 60, pattern: 30, default: 14 },
      reinforcementBonus: 0.3,     // 每次访问强化增量
      accessBoostFactor: 0.05,     // 每次访问延长半衰期百分比
      minRetentionScore: 0.05      // 最低保留分数
    };
  }

  /**
   * 计算记忆衰退评分
   * @param {Object} entry - 记忆条目
   * @param {string} [entryType] - 记忆类型覆盖
   * @returns {number} 0.0-1.0 保留评分
   */
  _computeDecayScore(entry, entryType) {
    const now = Date.now();
    const lastAccessed = entry.lastAccessed || entry.createdAt || now;
    const ageDays = (now - lastAccessed) / (24 * 60 * 60 * 1000);
    const tags = entry.tags || [];
    
    // 确定半衰期
    let halfLifeDays = this.decayParams.halfLifeDays.default;
    if (entryType === 'core' || tags.includes('core')) halfLifeDays = this.decayParams.halfLifeDays.core;
    else if (tags.includes('identity')) halfLifeDays = this.decayParams.halfLifeDays.identity;
    else if (tags.includes('consolidated')) halfLifeDays = this.decayParams.halfLifeDays.consolidated;
    else if (tags.includes('lesson')) halfLifeDays = this.decayParams.halfLifeDays.lesson;
    else if (tags.includes('pattern')) halfLifeDays = this.decayParams.halfLifeDays.pattern;
    
    // 访问频率修正
    const accessCount = entry.accessCount || 1;
    const effectiveHalfLife = halfLifeDays * (1 + (accessCount - 1) * this.decayParams.accessBoostFactor);
    
    // 指数衰退: score = 2^(-age/半衰期)
    const rawScore = Math.pow(2, -ageDays / effectiveHalfLife);
    
    // 强化加成: 每次访问增加保留分数
    const reinforcementBonus = Math.min((accessCount - 1) * this.decayParams.reinforcementBonus, 0.5);
    
    return Math.min(1.0, Math.max(this.decayParams.minRetentionScore, rawScore + reinforcementBonus));
  }

  /**
   * 计算梦质量度量
   * @param {Object} dreamResult - 梦境结果
   * @returns {Object} 质量度量
   */
  _computeDreamQuality(dreamResult) {
    const quality = {
      consolidationScore: 0,
      pruningEfficiency: 0,
      synthesisCoherence: 0,
      overallQuality: 0,
      insights: []
    };
    
    // 巩固质量: 基于巩固条目数量和多样性
    if (dreamResult.consolidation) {
      const consol = dreamResult.consolidation;
      const entryCount = consol.entries ? consol.entries.length : (consol.count || 0);
      quality.consolidationScore = Math.min(1.0, entryCount / 20);
    }
    
    // 修剪效率: 修剪比例
    if (dreamResult.pruning) {
      const pruned = dreamResult.pruning.pruned_count || 0;
      quality.pruningEfficiency = Math.min(1.0, pruned / 50);
    }
    
    // 综合连贯性: 基于主题数量和洞察深度
    if (dreamResult.synthesis) {
      const syn = dreamResult.synthesis;
      const themeCount = (syn.themes || []).length;
      const topicCount = (syn.topics || []).length;
      const hasInsight = syn.insight && syn.insight.length > 20;
      quality.synthesisCoherence = Math.min(1.0, 
        (themeCount * 0.2 + topicCount * 0.1 + (hasInsight ? 0.3 : 0)) / 1.0
      );
      
      if (hasInsight) quality.insights.push(syn.insight);
    }
    
    // 综合质量 (加权平均)
    quality.overallQuality = (
      quality.consolidationScore * 0.35 +
      quality.pruningEfficiency * 0.25 +
      quality.synthesisCoherence * 0.40
    );
    
    return quality;
  }

  /**
   * 检测巩固冲突
   * 检查新记忆与现有记忆之间是否存在矛盾
   * @param {Array} newEntries - 新记忆条目
   * @returns {Array} 冲突列表
   */
  _detectConflicts(newEntries) {
    const conflicts = [];
    if (!this.memory.listLearned || !newEntries || newEntries.length === 0) return conflicts;
    
    const existing = this.memory.listLearned();
    for (const newEntry of newEntries) {
      if (!newEntry.key || !newEntry.value) continue;
      const newKey = String(newEntry.key).toLowerCase();
      const newValue = String(newEntry.value || '').toLowerCase();
      
      for (const old of existing) {
        if (!old.key || !old.value) continue;
        // 只比较同类键
        const oldKey = String(old.key).toLowerCase();
        if (newKey !== oldKey) continue;
        
        const oldValue = String(old.value || '').toLowerCase();
        
        // 检测矛盾模式
        const negationPatterns = ['not ', "don't ", "doesn't ", 'never ', 'without '];
        const isNewNegated = negationPatterns.some(p => newValue.includes(p));
        const isOldNegated = negationPatterns.some(p => oldValue.includes(p));
        
        if (isNewNegated !== isOldNegated) {
          // 一个肯定一个否定 → 冲突
          const newSummary = newValue.substring(0, 60);
          const oldSummary = oldValue.substring(0, 60);
          conflicts.push({
            type: 'contradiction',
            severity: 'high',
            newEntry: { key: newEntry.key, value: newSummary },
            oldEntry: { key: old.key, value: oldSummary },
            resolution: 'review_required',
            suggestedAction: `Existing "${old.key}" contradicts new learning. Consider: (a) update existing, (b) reject new, (c) mark as resolved contradiction.`
          });
        }
        
        // 数值冲突检测
        const newNums = newValue.match(/\d+\.?\d*/g);
        const oldNums = oldValue.match(/\d+\.?\d*/g);
        if (newNums && oldNums && newNums.length === oldNums.length) {
          for (let i = 0; i < newNums.length; i++) {
            const diff = Math.abs(parseFloat(newNums[i]) - parseFloat(oldNums[i]));
            const ratio = Math.max(parseFloat(newNums[i]), parseFloat(oldNums[i]));
            if (ratio > 0 && diff / ratio > 0.3) {
              conflicts.push({
                type: 'numerical_discrepancy',
                severity: 'medium',
                newEntry: { key: newEntry.key, value: newValue.substring(0, 60) },
                oldEntry: { key: old.key, value: oldValue.substring(0, 60) },
                field: `value #${i + 1}: ${oldNums[i]} vs ${newNums[i]}`,
                suggestedAction: `Numerical mismatch: verify which value is correct.`
              });
              break;
            }
          }
        }
      }
    }
    return conflicts;
  }

  /**
   * 对洞察进行优先级排序
   * @param {Array} insights - 洞察列表
   * @returns {Array} 排序后的洞察
   */
  _rankInsights(insights) {
    if (!insights || insights.length === 0) return [];
    
    const ranked = insights.map(insight => {
      let priority = 0;
      const text = String(insight.insight || insight.text || insight).toLowerCase();
      
      // 优先级因子: 情感强度
      const emotionWords = ['urgent', 'critical', 'important', 'key', '重大', '关键', '紧急'];
      for (const w of emotionWords) {
        if (text.includes(w)) priority += 15;
      }
      
      // 优先级因子: 问题解决
      const problemWords = ['error', 'bug', 'fix', 'resolve', 'issue', 'fail', '错误', '修复', '失败'];
      for (const w of problemWords) {
        if (text.includes(w)) priority += 10;
      }
      
      // 优先级因子: 学习成长
      const learningWords = ['learn', 'lesson', 'pattern', 'discover', '学习', '教训', '模式'];
      for (const w of learningWords) {
        if (text.includes(w)) priority += 8;
      }
      
      // 优先级因子: 长度 (中等长度最有价值)
      const length = text.length;
      if (length > 30 && length < 200) priority += 5;
      
      // 优先级因子: 新近性
      if (insight.timestamp) {
        const age = Date.now() - insight.timestamp;
        if (age < 3600000) priority += 10;       // 1小时内
        else if (age < 86400000) priority += 5;   // 24小时内
      }
      
      return { insight, priority, text: text.substring(0, 100) };
    });
    
    return ranked.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 计算记忆强化加权
   * @param {string} key - 记忆键
   * @param {Object} entry - 记忆条目 (可选)
   * @returns {number} 强化权重 0.0-1.0
   */
  _computeReinforcementWeight(key, entry) {
    if (!entry) {
      if (!this.memory.get) return 0.5;
      entry = this.memory.get(key);
    }
    if (!entry) return 0.3;
    
    const tags = entry.tags || [];
    const accessCount = entry.accessCount || 1;
    const now = Date.now();
    const lastAccessed = entry.lastAccessed || entry.createdAt || now;
    const age = (now - lastAccessed) / (24 * 60 * 60 * 1000);
    
    let weight = 0.5; // 基础权重
    
    // 类型加权
    if (tags.includes('core')) weight += 0.3;
    else if (tags.includes('identity')) weight += 0.2;
    else if (tags.includes('lesson')) weight += 0.15;
    else if (tags.includes('consolidated')) weight += 0.1;
    
    // 访问频率加权 (最多+0.2)
    weight += Math.min(0.2, (accessCount - 1) * 0.02);
    
    // 新近性加权 (7天内递增)
    if (age < 1) weight += 0.15;
    else if (age < 3) weight += 0.10;
    else if (age < 7) weight += 0.05;
    
    // 数值质量加权
    if (entry.quality !== undefined) weight += entry.quality * 0.1;
    
    return Math.min(1.0, Math.max(0.0, weight));
  }

  /**
   * 生成梦境叙事
   * @param {Object} dreamResult - 梦境结果
   * @returns {string} 叙事文本
   */
  _generateNarrative(dreamResult) {
    const parts = [];
    
    if (dreamResult.consolidation) {
      const consol = dreamResult.consolidation;
      const count = consol.entries ? consol.entries.length : (consol.count || 0);
      if (count > 0) {
        parts.push(`巩固了 ${count} 条记忆片段`);
      }
    }
    
    if (dreamResult.pruning) {
      const pruned = dreamResult.pruning.pruned_count || 0;
      if (pruned > 0) {
        parts.push(`修剪了 ${pruned} 条不再活跃的痕迹`);
      }
    }
    
    if (dreamResult.synthesis) {
      const syn = dreamResult.synthesis;
      if (syn.themes && syn.themes.length > 0) {
        parts.push(`提炼出 ${syn.themes.length} 个核心主题: ${syn.themes.join(', ')}`);
      }
      if (syn.insight && syn.insight.length > 20) {
        parts.push(`生成洞察: "${syn.insight.substring(0, 80)}..."`);
      }
    }
    
    if (dreamResult.conflicts && dreamResult.conflicts.length > 0) {
      parts.push(`发现 ${dreamResult.conflicts.length} 处记忆冲突待处理`);
    }
    
    if (parts.length === 0) return '这次梦境没有显著活动。';
    
    const stage = dreamResult.sleepStage || 'REM';
    const quality = dreamResult.quality ? Math.round(dreamResult.quality.overallQuality * 100) : 0;
    
    return `[${this.sleepStages[stage]?.name || stage}] ${parts.join('；')}。梦境质量: ${quality}%。`;
  }

  /**
   * Run a full dream consolidation cycle
   * @param {Object} options - 配置选项
   * @param {boolean} options.consolidate - 是否执行巩固
   * @param {boolean} options.prune - 是否执行修剪
   * @param {boolean} options.synthesize - 是否执行综合
   * @param {string} options.sleepStage - 睡眠阶段 (NREM1/NREM2/NREM3/REM/NREM4)
   * @param {Array} options.newEntries - 新记忆条目 (用于冲突检测)
   * @param {boolean} options.detectConflicts - 是否检测冲突
   * @returns {Object} 梦境结果
   */
  dream({ consolidate = true, prune = true, synthesize = true, sleepStage = 'REM', newEntries = [], detectConflicts = true } = {}) {
    const results = {};
    const startTime = Date.now();
    
    // 获取睡眠阶段参数
    const stage = this.sleepStages[sleepStage] || this.sleepStages.REM;
    
    // 应用睡眠阶段调制
    const consolidationFactor = consolidate ? stage.consolidationRate : 0;
    const pruningFactor = prune ? stage.pruningRate : 0;
    const creativityFactor = stage.creativityBoost;
    
    // 执行巩固 (带睡眠阶段调制)
    if (consolidate && this.memory.consolidate) {
      const baseResult = this.memory.consolidate();
      results.consolidation = {
        ...baseResult,
        sleepStage: sleepStage,
        consolidationRate: consolidationFactor,
        creativityBoost: creativityFactor
      };
    }
    
    // 执行修剪 (带衰退评分)
    if (prune) {
      results.pruning = this._pruneWithDecay(pruningFactor);
    }
    
    // 执行综合
    if (synthesize) {
      results.synthesis = this._synthesizeEnhanced(creativityFactor);
    }
    
    // 检测冲突
    if (detectConflicts && newEntries.length > 0) {
      results.conflicts = this._detectConflicts(newEntries);
    }
    
    // 计算质量度量
    results.quality = this._computeDreamQuality(results);
    
    // 生成叙事
    results.sleepStage = sleepStage;
    results.narrative = this._generateNarrative(results);
    results.duration_ms = Date.now() - startTime;
    results.dream_complete = true;
    
    this.lastDream = results;
    
    // 记录历史
    this.dreamHistory.push({
      timestamp: startTime,
      sleepStage: sleepStage,
      quality: results.quality.overallQuality,
      conflictsFound: (results.conflicts || []).length
    });
    if (this.dreamHistory.length > this.maxHistorySize) {
      this.dreamHistory = this.dreamHistory.slice(-this.maxHistorySize);
    }
    
    return results;
  }

  /**
   * Quick dream: just consolidate (default sleep stage: NREM3 deep sleep)
   */
  dreamNow() {
    return this.dream({ consolidate: true, prune: false, synthesize: false, sleepStage: 'NREM3', detectConflicts: false });
  }

  /**
   * 执行多周期梦境模拟
   * @param {number} cycles - 周期数 (1-8)
   * @returns {Array} 每个周期的结果
   */
  dreamCycle(cycles = 4) {
    cycles = Math.max(1, Math.min(8, cycles));
    const stageOrder = ['NREM1', 'NREM2', 'NREM3', 'REM', 'NREM1', 'NREM2', 'NREM3', 'REM'];
    const results = [];
    
    for (let i = 0; i < cycles; i++) {
      const stage = stageOrder[i % stageOrder.length];
      const cycleResult = this.dream({
        consolidate: true,
        prune: i >= 2,       // 前两个周期不修剪
        synthesize: i >= 1,  // 第一个周期不综合
        sleepStage: stage,
        newEntries: [],
        detectConflicts: false
      });
      results.push(cycleResult);
    }
    
    // 生成多周期总结
    const avgQuality = results.reduce((sum, r) => sum + (r.quality?.overallQuality || 0), 0) / results.length;
    const totalConflicts = results.reduce((sum, r) => sum + (r.conflicts || []).length, 0);
    const totalPruned = results.reduce((sum, r) => sum + (r.pruning?.pruned_count || 0), 0);
    
    return {
      cycles: results,
      summary: {
        totalCycles: cycles,
        avgQuality: Math.round(avgQuality * 100) / 100,
        totalPruned,
        totalConflicts,
        duration_ms: results.reduce((sum, r) => sum + (r.duration_ms || 0), 0)
      }
    };
  }

  /**
   * 带衰退评分的修剪
   * PROTECTS: entries tagged 'core', 'identity', 'consolidated'
   * @param {number} pruningFactor - 修剪因子 (0.0-1.0)
   */
  _pruneWithDecay(pruningFactor = 1.0) {
    const pruned = [];
    const retained = [];
    if (!this.memory.listLearned) return { pruned_count: 0, pruned_keys: [], retained_count: 0, decayScores: [] };
    
    const learned = this.memory.listLearned();
    const decayScores = [];
    
    for (const entry of learned) {
      const tags = entry.tags || [];
      
      // 保护核心条目
      if (tags.includes('core') || tags.includes('identity') || tags.includes('consolidated')) {
        retained.push(entry.key);
        continue;
      }
      
      // 计算衰退评分
      const decayScore = this._computeDecayScore(entry);
      decayScores.push({ key: entry.key, score: decayScore });
      
      // 修剪决策: 低于阈值的条目被修剪 (受pruningFactor调制)
      const threshold = this.decayParams.minRetentionScore + (1.0 - pruningFactor) * 0.2;
      if (decayScore < threshold) {
        if (this.memory.forget) this.memory.forget(entry.key);
        pruned.push(entry.key);
      } else {
        retained.push(entry.key);
      }
    }
    
    return {
      pruned_count: pruned.length,
      pruned_keys: pruned.slice(0, 10),
      retained_count: retained.length,
      decayScores: decayScores.slice(0, 20),
      pruningFactor
    };
  }

  /**
   * 增强版综合: 带优先级排序和强化加权
   * @param {number} creativityFactor - 创造力因子 (0.0-1.0)
   */
  _synthesizeEnhanced(creativityFactor = 0.5) {
    if (!this.memory.listLearned) return { insight: 'No memory system available.', topics: [], priority: 0 };
    
    const allLearned = this.memory.listLearned();
    const recentLearned = allLearned
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .slice(0, 10);
    
    if (recentLearned.length === 0) return { insight: 'No significant patterns to synthesize.', topics: [], priority: 0 };
    
    // 计算每个条目的强化加权
    const weightedEntries = recentLearned.map(entry => ({
      ...entry,
      reinforcementWeight: this._computeReinforcementWeight(entry.key, entry),
      decayScore: this._computeDecayScore(entry)
    }));
    
    // 按强化加权排序
    weightedEntries.sort((a, b) => b.reinforcementWeight - a.reinforcementWeight);
    
    const topics = weightedEntries.map(l => l.key).filter(Boolean);
    const themes = this._extractThemes(weightedEntries);
    
    // 生成带优先级的洞察
    let insight;
    if (themes.length > 0) {
      const topTheme = themes[0];
      const topEntry = weightedEntries[0];
      const reinforcementPct = Math.round(topEntry.reinforcementWeight * 100);
      insight = `Recent focus areas show recurring themes: ${themes.join(', ')}. ` +
        `Top reinforcement: "${topEntry.key}" (${reinforcementPct}% strength).`;
    } else {
      insight = `Recent focus areas: ${topics.join(', ')}.`;
    }
    
    // 创造力调制 (REM阶段加入更多创造性连接)
    if (creativityFactor > 0.5 && themes.length > 1) {
      const creativePairs = [];
      for (let i = 0; i < themes.length - 1; i++) {
        for (let j = i + 1; j < themes.length; j++) {
          creativePairs.push(`${themes[i]}+${themes[j]}`);
        }
      }
      if (creativePairs.length > 0) {
        insight += ` Creative synthesis suggests cross-domain patterns: ${creativePairs.join(', ')}.`;
      }
    }
    
    // 计算综合优先级
    const priority = Math.min(1.0, 
      (weightedEntries.reduce((s, e) => s + e.reinforcementWeight, 0) / weightedEntries.length) * 
      (1 + themes.length * 0.1)
    );
    
    return {
      insight,
      topics,
      themes,
      summary_length: topics.length,
      weightedEntries: weightedEntries.slice(0, 5).map(e => ({
        key: e.key,
        weight: Math.round(e.reinforcementWeight * 100) / 100,
        decayScore: Math.round(e.decayScore * 100) / 100
      })),
      priority: Math.round(priority * 100) / 100,
      creativityFactor
    };
  }

  _extractThemes(entries) {
    const themes = new Set();
    for (const entry of entries) {
      const lower = String(entry.key).toLowerCase();
      const value = String(entry.value || '').toLowerCase();
      if (lower.includes('error') || lower.includes('bug') || value.includes('error')) themes.add('problem-solving');
      if (lower.includes('learn') || lower.includes('lesson') || value.includes('learn')) themes.add('learning');
      if (lower.includes('emotion') || lower.includes('feel') || value.includes('情感')) themes.add('emotional-processing');
      if (lower.includes('build') || lower.includes('create')) themes.add('creation');
      if (lower.includes('fix') || lower.includes('resolve')) themes.add('resolution');
      if (lower.includes('refactor') || lower.includes('optimize') || lower.includes('improve')) themes.add('optimization');
      if (lower.includes('test') || lower.includes('verify') || value.includes('test')) themes.add('verification');
      if (lower.includes('security') || lower.includes('safe') || lower.includes('protect')) themes.add('security');
    }
    return [...themes];
  }

  /**
   * 获取上次梦境结果
   */
  getLastDream() {
    return this.lastDream || { status: 'no_dreams_yet' };
  }

  /**
   * 获取梦境历史统计
   * @returns {Object} 历史统计
   */
  getDreamHistory() {
    if (this.dreamHistory.length === 0) {
      return { totalDreams: 0, avgQuality: 0, stageDistribution: {}, message: 'No dream history recorded.' };
    }
    
    const avgQuality = this.dreamHistory.reduce((s, d) => s + d.quality, 0) / this.dreamHistory.length;
    const stageDistribution = {};
    for (const dream of this.dreamHistory) {
      stageDistribution[dream.sleepStage] = (stageDistribution[dream.sleepStage] || 0) + 1;
    }
    const totalConflicts = this.dreamHistory.reduce((s, d) => s + d.conflictsFound, 0);
    
    return {
      totalDreams: this.dreamHistory.length,
      avgQuality: Math.round(avgQuality * 100) / 100,
      stageDistribution,
      totalConflicts,
      recentStages: this.dreamHistory.slice(-5).map(d => d.sleepStage)
    };
  }

  /**
   * 获取衰退参数配置
   * @returns {Object} 当前衰退参数
   */
  getDecayParams() {
    return { ...this.decayParams };
  }

  /**
   * 更新衰退参数
   * @param {Object} params - 要更新的参数
   * @returns {Object} 更新后的参数
   */
  updateDecayParams(params) {
    if (!params || typeof params !== 'object') return this.decayParams;
    
    if (params.halfLifeDays && typeof params.halfLifeDays === 'object') {
      Object.assign(this.decayParams.halfLifeDays, params.halfLifeDays);
    }
    if (params.reinforcementBonus !== undefined) this.decayParams.reinforcementBonus = params.reinforcementBonus;
    if (params.accessBoostFactor !== undefined) this.decayParams.accessBoostFactor = params.accessBoostFactor;
    if (params.minRetentionScore !== undefined) this.decayParams.minRetentionScore = params.minRetentionScore;
    
    return { ...this.decayParams };
  }
}

module.exports = { DreamConsolidation };
