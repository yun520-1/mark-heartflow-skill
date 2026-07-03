/**
 * Policy Optimizer — 无监督行为策略优化器（升级版 v1.1.0）
 *
 * 从历史经验中学习并生成动态策略，支持：
 * - 基于实际数据的成功率计算（非硬编码）
 * - 策略去重与合并
 * - 策略过期与自动修剪
 * - 加权匹配与优先级排序
 * - 结构化价值观对齐检查
 * - 震荡检测与收敛分析
 *
 * @module policy-optimizer
 */

const fs = require('fs');
const path = require('path');

/** 策略状态枚举 */
const POLICY_STATES = {
  ACTIVE: 'active',           // 活跃中
  STALE: 'stale',             // 已过期
  MERGED: 'merged',           // 已被合并到其他策略
  SUPERSEDED: 'superseded',   // 已被更优策略替代
  REJECTED: 'rejected'        // 价值观审查未通过
};

/** 策略优先级等级 */
const PRIORITY_LEVELS = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  EXPERIMENTAL: 1
};

/** 策略来源分类 */
const POLICY_SOURCES = {
  AUTONOMOUS_LEARNING: 'autonomous_learning',
  FAILURE_LEARNING: 'failure_learning',
  MANUAL: 'manual',
  MERGED: 'merged',
  INFERRED: 'inferred'
};

/** 默认配置 */
const DEFAULTS = {
  policyTTL: 30 * 24 * 60 * 60 * 1000,  // 30天过期
  minEvidenceCount: 2,                    // 最少证据数
  mergeSimilarityThreshold: 0.7,          // 策略合并相似度阈值
  maxPolicies: 100,                       // 最大策略数
  pruningInterval: 7 * 24 * 60 * 60 * 1000, // 7天修剪间隔
  successWeight: 1.0,                     // 成功权重
  failureWeight: 1.5,                     // 失败权重（更高，因为失败更有信息量）
  recencyDecay: 0.95,                     // 时间衰减因子
  oscillationWindow: 5                    // 震荡检测窗口大小
};

class PolicyOptimizer {
  /**
   * @param {string} projectRoot - 项目根目录
   * @param {object} [options] - 配置选项
   */
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULTS, ...options };
    this.traceFile = path.join(projectRoot, '.opencode', 'logs', 'autonomy_trace.json');
    this.policiesFile = path.join(projectRoot, '.opencode', 'memory', 'learned_policies.json');
    this.coreValuesFile = path.join(projectRoot, 'CORE_VALUES.md');
    this.summaryFile = path.join(projectRoot, 'internal', 'data', 'monthly-summaries.json');
    
    this.policies = { version: '1.1.0', policies: [], last_optimization: null, last_pruning: null };
    this.loadPolicies();
  }

  // ==========================================================================
  // 持久化
  // ==========================================================================

  loadPolicies() {
    try {
      if (fs.existsSync(this.policiesFile)) {
        const raw = JSON.parse(fs.readFileSync(this.policiesFile, 'utf8'));
        // 向前兼容旧版本格式
        this.policies = {
          version: raw.version || '1.0.0',
          policies: raw.policies || [],
          last_optimization: raw.last_optimization || null,
          last_pruning: raw.last_pruning || null
        };
      }
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[PolicyOptimizer] 加载策略文件失败:', e.message);
      this.policies = { version: '1.1.0', policies: [], last_optimization: null, last_pruning: null };
    }
  }

  savePolicies() {
    try {
      const dir = path.dirname(this.policiesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.policiesFile, JSON.stringify(this.policies, null, 2));
    } catch (e) {
      // [PROD] 生产环境移除 console.error: console.error('[PolicyOptimizer] 保存策略失败:', e.message);
    }
  }

  // ==========================================================================
  // 策略生命周期
  // ==========================================================================

  /**
   * 优化行为策略（主入口）
   */
  async optimizeBehaviorPolicies() {
    // [PROD] 生产环境移除 console.error: console.error('[PolicyOptimizer] 开始策略优化...');

    const trace = this.loadTrace();
    if (!trace.cycles || trace.cycles.length === 0) {
      return { success: false, reason: 'no_history' };
    }

    // 1. 分析历史循环
    const analysis = this.analyzeCycles(trace.cycles);

    // 2. 提取新策略
    const newPolicies = this.extractPolicies(analysis);

    // 3. 验证价值观对齐
    const validPolicies = await this.validatePolicies(newPolicies);

    // 4. 去重与合并
    const mergedPolicies = this.deduplicateAndMerge(validPolicies);

    // 5. 添加到策略库
    for (const policy of mergedPolicies) {
      this.policies.policies.push(policy);
    }

    // 6. 检查是否需要修剪（过期/超额）
    this.pruneIfNeeded();

    this.policies.last_optimization = new Date().toISOString();
    this.savePolicies();

    // [PROD] 生产环境移除 console.error: console.error(`[PolicyOptimizer] 优化完成: ${validPolicies.length} 个新策略 (去重后 ${mergedPolicies.length} 个)`);

    return {
      success: true,
      new_policies: mergedPolicies.length,
      analysis: analysis.summary
    };
  }

  /**
   * 修剪过期或超额策略
   */
  pruneIfNeeded() {
    const now = Date.now();
    const lastPruning = this.policies.last_pruning 
      ? new Date(this.policies.last_pruning).getTime() 
      : 0;

    // 未到修剪间隔
    if (now - lastPruning < this.config.pruningInterval && 
        this.policies.policies.length <= this.config.maxPolicies) {
      return;
    }

    const before = this.policies.policies.length;
    const active = [];
    const staleCount = { merged: 0, superseded: 0, expired: 0 };

    for (const policy of this.policies.policies) {
      // 已合并/替代的策略直接丢弃
      if (policy.state === POLICY_STATES.MERGED || 
          policy.state === POLICY_STATES.SUPERSEDED) {
        staleCount[policy.state]++;
        continue;
      }

      // 检查过期
      const age = now - new Date(policy.created_at).getTime();
      if (age > this.config.policyTTL && policy.state !== POLICY_STATES.ACTIVE) {
        staleCount.expired++;
        continue;
      }

      // 更新过期状态
      if (age > this.config.policyTTL) {
        policy.state = POLICY_STATES.STALE;
      }

      active.push(policy);
    }

    // 如果仍超额，按成功率排序保留最优
    if (active.length > this.config.maxPolicies) {
      active.sort((a, b) => {
        const scoreA = this._computePolicyScore(a);
        const scoreB = this._computePolicyScore(b);
        return scoreB - scoreA;
      });
      const removed = active.splice(this.config.maxPolicies);
      staleCount.expired += removed.length;
    }

    this.policies.policies = active;
    this.policies.last_pruning = new Date().toISOString();

    const removed = before - active.length;
    if (removed > 0) {
      // [PROD] 生产环境移除 console.error: console.error(`[PolicyOptimizer] 修剪完成: 移除 ${removed} 个策略 (合并:${staleCount.merged}, 替代:${staleCount.superseded}, 过期:${staleCount.expired})`);
    }
  }

  // ==========================================================================
  // 核心逻辑
  // ==========================================================================

  loadTrace() {
    try {
      if (fs.existsSync(this.traceFile)) {
        return JSON.parse(fs.readFileSync(this.traceFile, 'utf8'));
      }
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[PolicyOptimizer] 加载追踪文件失败:', e.message);
    }
    return { cycles: [] };
  }

  /**
   * 分析历史循环，统计成功率、模式分布、震荡检测
   */
  analyzeCycles(cycles) {
    const actionStats = {};  // action → { success, failure, lastTimestamp }
    const sequencePatterns = [];  // 连续动作序列
    const oscillationDetected = false;

    for (const cycle of cycles) {
      const isSuccess = cycle.status === 'completed';
      const subtasks = cycle.do?.results || [];
      const timestamp = new Date(cycle.timestamp || cycle.completed_at || Date.now()).getTime();
      
      const subtaskTypes = subtasks.map(s => s.subtask?.action).filter(Boolean);
      
      for (const action of subtaskTypes) {
        if (!actionStats[action]) {
          actionStats[action] = { success: 0, failure: 0, total: 0, lastTimestamp: 0, timestamps: [] };
        }
        actionStats[action].total++;
        if (isSuccess) {
          actionStats[action].success++;
        } else {
          actionStats[action].failure++;
        }
        actionStats[action].lastTimestamp = Math.max(actionStats[action].lastTimestamp, timestamp);
        actionStats[action].timestamps.push({ success: isSuccess, time: timestamp });
      }

      // 记录动作序列
      if (subtaskTypes.length > 1) {
        sequencePatterns.push({
          sequence: subtaskTypes,
          success: isSuccess,
          timestamp
        });
      }
    }

    // 计算每个动作的成功率（带时间衰减）
    const actionRates = {};
    const now = Date.now();
    for (const [action, stats] of Object.entries(actionStats)) {
      const total = stats.success + stats.failure;
      if (total === 0) {
        actionRates[action] = { rate: 0, confidence: 0, total };
        continue;
      }

      // 时间衰减：越近的事件权重越高
      let weightedSuccess = 0;
      let weightedTotal = 0;
      for (const entry of stats.timestamps) {
        const age = (now - entry.time) / (24 * 60 * 60 * 1000); // 天
        const weight = Math.pow(this.config.recencyDecay, Math.max(0, age));
        weightedTotal += weight;
        if (entry.success) weightedSuccess += weight;
      }

      const rate = weightedTotal > 0 ? weightedSuccess / weightedTotal : stats.success / total;
      // 置信度基于样本量
      const confidence = Math.min(total / 10, 1.0);

      actionRates[action] = { rate, confidence, total };
    }

    // 震荡检测：检查同一动作的成功/失败是否频繁交替
    const oscillationResults = {};
    for (const [action, stats] of Object.entries(actionStats)) {
      if (stats.timestamps.length >= this.config.oscillationWindow) {
        const recent = stats.timestamps.slice(-this.config.oscillationWindow);
        let transitions = 0;
        for (let i = 1; i < recent.length; i++) {
          if (recent[i].success !== recent[i - 1].success) {
            transitions++;
          }
        }
        const oscillationScore = transitions / (recent.length - 1);
        oscillationResults[action] = {
          oscillation: oscillationScore,
          unstable: oscillationScore > 0.6
        };
      }
    }

    return {
      action_rates: actionRates,
      oscillation: oscillationResults,
      sequence_patterns: sequencePatterns,
      total_cycles: cycles.length,
      summary: this._buildSummary(actionRates, oscillationResults, cycles.length)
    };
  }

  /**
   * 构建可读摘要
   */
  _buildSummary(actionRates, oscillation, totalCycles) {
    const highSuccess = Object.entries(actionRates)
      .filter(([_, s]) => s.rate >= 0.7 && s.confidence >= 0.3)
      .map(([a]) => a);
    const highFailure = Object.entries(actionRates)
      .filter(([_, s]) => s.rate < 0.4 && s.confidence >= 0.3)
      .map(([a]) => a);
    const unstable = Object.entries(oscillation)
      .filter(([_, o]) => o.unstable)
      .map(([a]) => a);

    let parts = [`分析了${totalCycles}个循环`];
    if (highSuccess.length) parts.push(`高成功动作: ${highSuccess.join(', ')}`);
    if (highFailure.length) parts.push(`高失败动作: ${highFailure.join(', ')}`);
    if (unstable.length) parts.push(`震荡动作: ${unstable.join(', ')}`);
    return parts.join('；');
  }

  /**
   * 从分析结果中提取新策略
   */
  extractPolicies(analysis) {
    const policies = [];
    const now = new Date().toISOString();

    // 从成功率提取策略
    for (const [action, stats] of Object.entries(analysis.action_rates)) {
      if (stats.total < this.config.minEvidenceCount) continue;

      if (stats.rate >= 0.7 && stats.confidence >= 0.3) {
        policies.push(this._createPolicy({
          trigger: `action=${action}`,
          rule: this._generateRuleText(action, 'success', stats.rate),
          successRate: Math.round(stats.rate * 100) / 100,
          confidence: stats.confidence,
          source: POLICY_SOURCES.AUTONOMOUS_LEARNING,
          evidenceCount: stats.total,
          priority: stats.rate >= 0.9 ? PRIORITY_LEVELS.HIGH : PRIORITY_LEVELS.MEDIUM,
          state: POLICY_STATES.ACTIVE
        }));
      }

      if (stats.rate < 0.4 && stats.confidence >= 0.3) {
        policies.push(this._createPolicy({
          trigger: `action=${action}`,
          rule: this._generateRuleText(action, 'failure', stats.rate),
          successRate: Math.round(stats.rate * 100) / 100,
          confidence: stats.confidence,
          source: POLICY_SOURCES.FAILURE_LEARNING,
          evidenceCount: stats.total,
          priority: PRIORITY_LEVELS.LOW,
          state: POLICY_STATES.ACTIVE
        }));
      }
    }

    // 从震荡检测提取策略
    for (const [action, osc] of Object.entries(analysis.oscillation || {})) {
      if (osc.unstable) {
        policies.push(this._createPolicy({
          trigger: `action=${action}`,
          rule: `检测到${action}行动的结果频繁交替（震荡分数: ${Math.round(osc.oscillation * 100) / 100}），建议加入稳定化步骤后再执行`,
          successRate: 0.5,
          confidence: 0.5,
          source: POLICY_SOURCES.INFERRED,
          evidenceCount: this.config.oscillationWindow,
          priority: PRIORITY_LEVELS.EXPERIMENTAL,
          state: POLICY_STATES.ACTIVE
        }));
      }
    }

    return policies;
  }

  /**
   * 创建策略对象
   */
  _createPolicy(params) {
    return {
      policy_id: `pol-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      trigger: params.trigger,
      rule: params.rule,
      success_rate: params.successRate,
      confidence: params.confidence,
      source: params.source,
      priority: params.priority,
      state: params.state,
      evidence_count: params.evidenceCount || 1,
      hit_count: 0,
      last_matched: null,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 生成规则描述文本
   */
  _generateRuleText(action, type, rate) {
    const templates = {
      analyze: {
        success: '先进行全面分析再行动可以提高成功率',
        failure: '分析后未能有效改善结果，建议更换分析方法'
      },
      modify: {
        success: '代码修改后必须进行测试验证',
        failure: '直接修改代码风险较高，建议先分析再修改'
      },
      identify: {
        success: '识别模式后应立即采取针对性行动',
        failure: '仅识别模式不足以改善结果，需要更深入的分析'
      },
      test: {
        success: '测试是确保质量的关键步骤',
        failure: '当前测试策略效果不佳，建议扩大测试覆盖范围'
      }
    };

    if (templates[action] && templates[action][type]) {
      return templates[action][type];
    }
    
    // 动态生成
    if (type === 'success') {
      return `执行${action}行动有较高成功率(${Math.round(rate * 100)}%)，建议优先采用`;
    }
    return `执行${action}行动成功率偏低(${Math.round(rate * 100)}%)，建议避免或改进后再执行`;
  }

  /**
   * 去重与合并相似策略
   */
  deduplicateAndMerge(newPolicies) {
    const merged = [];

    for (const policy of newPolicies) {
      let wasMerged = false;

      // 检查是否与已有策略重复
      for (const existing of this.policies.policies) {
        if (existing.state === POLICY_STATES.MERGED || 
            existing.state === POLICY_STATES.SUPERSEDED) continue;

        // 同触发条件 + 同来源 = 重复
        if (existing.trigger === policy.trigger && existing.source === policy.source) {
          // 合并证据计数
          existing.evidence_count = Math.max(existing.evidence_count || 1, policy.evidence_count || 1);
          // 更新成功率（加权平均）
          if (existing.hit_count > 0) {
            existing.success_rate = (existing.success_rate * existing.hit_count + policy.success_rate) / (existing.hit_count + 1);
          }
          existing.hit_count = (existing.hit_count || 0) + 1;
          wasMerged = true;
          break;
        }

        // 相似规则合并
        if (existing.trigger === policy.trigger) {
          const sim = this._computeRuleSimilarity(existing.rule, policy.rule);
          if (sim >= this.config.mergeSimilarityThreshold) {
            // 将旧策略标记为已合并
            existing.state = POLICY_STATES.MERGED;
            existing.merged_into = policy.policy_id;
            policy.evidence_count = (policy.evidence_count || 1) + (existing.evidence_count || 1);
            wasMerged = true;
            break;
          }
        }
      }

      if (!wasMerged) {
        merged.push(policy);
      }
    }

    return merged;
  }

  /**
   * 计算两条规则的相似度
   */
  _computeRuleSimilarity(ruleA, ruleB) {
    if (!ruleA || !ruleB) return 0;
    const a = ruleA.toLowerCase();
    const b = ruleB.toLowerCase();
    if (a === b) return 1.0;

    // 基于关键词交集
    const tokensA = new Set(a.split(/[\s,，。！？、]+/).filter(t => t.length > 1));
    const tokensB = new Set(b.split(/[\s,，。！？、]+/).filter(t => t.length > 1));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) intersection++;
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * 验证策略与价值观对齐
   */
  async validatePolicies(policies) {
    const coreValues = this.loadCoreValues();
    const validPolicies = [];

    // 提取价值观关键词（从CORE_VALUES.md中）
    const valueKeywords = this._extractValueKeywords(coreValues);

    for (const policy of policies) {
      const alignment = this.checkValueAlignment(policy, valueKeywords);
      
      if (alignment.aligned) {
        validPolicies.push(policy);
      } else {
        policy.state = POLICY_STATES.REJECTED;
        policy.rejection_reason = alignment.reason;
        // [PROD] 生产环境移除 console.error: console.error(`[PolicyOptimizer] 策略 ${policy.policy_id} 被拒绝: ${alignment.reason}`);
      }
    }

    return validPolicies;
  }

  /**
   * 从CORE_VALUES.md提取价值观关键词
   */
  _extractValueKeywords(coreValues) {
    if (!coreValues) return null;

    const keywords = {
      positive: [],
      negative: [],
      neutral: []
    };

    // 解析markdown，提取加粗/列表项/标题中的关键词
    const lines = coreValues.split('\n');
    for (const line of lines) {
      const boldMatch = line.match(/\*\*(.+?)\*\*/g);
      if (boldMatch) {
        for (const b of boldMatch) {
          const word = b.replace(/\*\*/g, '').toLowerCase().trim();
          if (word.length > 1) keywords.positive.push(word);
        }
      }
      // 列表项
      const listMatch = line.match(/^[-*+]\s+(.+)/);
      if (listMatch) {
        const word = listMatch[1].toLowerCase().trim();
        if (word.length > 1) keywords.positive.push(word);
      }
    }

    return keywords;
  }

  /**
   * 检查策略与价值观对齐
   * @returns {{ aligned: boolean, reason: string, score: number }}
   */
  checkValueAlignment(policy, valueKeywords) {
    const defaultResult = { aligned: true, reason: '无价值观配置，默认通过', score: 1.0 };

    if (!valueKeywords) return defaultResult;

    const content = policy.rule.toLowerCase();
    const trigger = policy.trigger.toLowerCase();

    // 检查是否包含负面价值观关键词
    const negativeIndicators = [
      '忽略', '跳过', '绕过', '欺骗', '隐瞒', '操纵',
      'ignore', 'skip', 'bypass', 'deceive', 'manipulate', 'hide'
    ];

    for (const neg of negativeIndicators) {
      if (content.includes(neg) || trigger.includes(neg)) {
        return {
          aligned: false,
          reason: `包含负面关键词: "${neg}"`,
          score: 0
        };
      }
    }

    // 检查是否包含正面价值观
    let positiveScore = 0;
    const matchedValues = [];

    if (valueKeywords.positive && valueKeywords.positive.length > 0) {
      for (const kw of valueKeywords.positive) {
        if (content.includes(kw)) {
          positiveScore += 0.2;
          matchedValues.push(kw);
        }
      }
    }

    // 通用正面关键词（回退检查）
    const fallbackPositive = [
      '心流', '帮助', '提升', '用户', '体验', '质量', '安全',
      'flow', 'help', 'improve', 'quality', 'safe', 'user', 'test',
      '验证', '测试', '分析', '检查', '确保', '优化'
    ];

    for (const kw of fallbackPositive) {
      if (content.includes(kw) && !matchedValues.includes(kw)) {
        positiveScore += 0.1;
        matchedValues.push(kw);
      }
    }

    // 分数越高越对齐
    const finalScore = Math.min(positiveScore, 1.0);
    
    return {
      aligned: finalScore >= 0.1 || valueKeywords.positive.length === 0,
      reason: finalScore >= 0.1 
        ? `匹配正面价值观: ${matchedValues.slice(0, 3).join(', ')}` 
        : '未匹配到正面价值观关键词',
      score: finalScore
    };
  }

  // ==========================================================================
  // 策略查询与匹配
  // ==========================================================================

  loadCoreValues() {
    try {
      if (fs.existsSync(this.coreValuesFile)) {
        return fs.readFileSync(this.coreValuesFile, 'utf8');
      }
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[PolicyOptimizer] loadCoreValues failed:', e.message);
    }
    return null;
  }

  /**
   * 获取当前策略列表
   */
  getPolicies() {
    return this.policies;
  }

  /**
   * 匹配策略（加权匹配）
   * 支持两种上下文格式：
   *   1) 对象格式: { action: 'analyze', type: 'code' }
   *   2) 字符串格式: "action=analyze"
   * @param {object|string} context - 上下文对象或字符串
   * @returns {object|null} 最优匹配策略
   */
  matchPolicy(context) {
    if (!context || this.policies.policies.length === 0) return null;

    // 将上下文转换为可搜索的字符串和键值对
    let contextStr;
    let contextPairs = [];

    if (typeof context === 'string') {
      contextStr = context.toLowerCase();
      // 解析 "key=value" 格式
      const parts = contextStr.split(/[&,;]+/);
      for (const part of parts) {
        const kv = part.trim().split('=');
        if (kv.length === 2) {
          contextPairs.push({ key: kv[0].trim(), value: kv[1].trim() });
        }
      }
    } else {
      contextStr = JSON.stringify(context).toLowerCase();
      // 提取对象的键值对
      for (const [key, value] of Object.entries(context)) {
        const strValue = String(value).toLowerCase();
        contextPairs.push({ key: key.toLowerCase(), value: strValue });
      }
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const policy of this.policies.policies) {
      // 跳过非活跃策略
      if (policy.state !== POLICY_STATES.ACTIVE && 
          policy.state !== POLICY_STATES.STALE) continue;

      let score = 0;

      // 解析 policy trigger: "key=value" 格式
      const triggerParts = policy.trigger.split(/[&,;]+/);
      let triggerKey = null;
      let triggerValue = null;

      for (const part of triggerParts) {
        const kv = part.trim().split('=');
        if (kv.length === 2) {
          triggerKey = kv[0].trim().toLowerCase();
          triggerValue = kv[1].trim().toLowerCase();
        }
      }

      // 精确匹配 key=value
      if (triggerKey && triggerValue) {
        const matchedPair = contextPairs.find(
          p => p.key === triggerKey && (p.value === triggerValue || p.value.includes(triggerValue))
        );
        if (matchedPair) {
          score += 0.6;
        }
      }

      // 回退：全文包含 trigger 字符串
      if (score === 0 && contextStr.includes(policy.trigger.toLowerCase())) {
        score += 0.4;
      }

      // 关键词增强匹配
      const triggerKeywords = (triggerValue || policy.trigger).split(/[_\- ]+/).filter(w => w.length > 2);
      for (const keyword of triggerKeywords) {
        if (contextStr.includes(keyword)) {
          score += 0.1;
        }
      }

      // 规则文本匹配
      const ruleWords = policy.rule.toLowerCase().split(/[\s,，。]+/).filter(w => w.length > 2);
      for (const word of ruleWords) {
        if (contextStr.includes(word)) {
          score += 0.05;
        }
      }

      // 加权：成功率和优先级
      score *= (0.5 + policy.success_rate * 0.5);
      score *= (1 + (policy.priority || PRIORITY_LEVELS.MEDIUM) * 0.1);

      if (score > bestScore && score >= 0.3) {
        bestScore = score;
        bestMatch = policy;
      }
    }

    // 更新匹配统计
    if (bestMatch) {
      bestMatch.hit_count = (bestMatch.hit_count || 0) + 1;
      bestMatch.last_matched = new Date().toISOString();
      this.savePolicies();
    }

    return bestMatch;
  }

  /**
   * 计算策略综合评分
   */
  _computePolicyScore(policy) {
    const rateScore = policy.success_rate * 0.4;
    const confidenceScore = (policy.confidence || 0.5) * 0.2;
    const evidenceScore = Math.min((policy.evidence_count || 1) / 20, 1.0) * 0.2;
    const hitScore = Math.min((policy.hit_count || 0) / 10, 1.0) * 0.1;
    const priorityScore = ((policy.priority || PRIORITY_LEVELS.MEDIUM) / PRIORITY_LEVELS.CRITICAL) * 0.1;

    return rateScore + confidenceScore + evidenceScore + hitScore + priorityScore;
  }

  // ==========================================================================
  // 报告与摘要
  // ==========================================================================

  /**
   * 生成月度摘要
   */
  async generateMonthlySummary() {
    const trace = this.loadTrace();
    const completed = trace.completed_goals || [];
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonth = completed.filter(c => 
      new Date(c.completed_at || c.timestamp) >= monthStart
    );

    // 本月新增策略
    const newPoliciesThisMonth = this.policies.policies.filter(p => 
      new Date(p.created_at) >= monthStart
    );

    // 本月命中策略
    const hitPoliciesThisMonth = this.policies.policies.filter(p => 
      p.last_matched && new Date(p.last_matched) >= monthStart
    );

    const summary = {
      month: now.toISOString().substring(0, 7),
      completed_goals: thisMonth.length,
      total_policies: this.policies.policies.length,
      active_policies: this.policies.policies.filter(p => p.state === POLICY_STATES.ACTIVE).length,
      new_policies: newPoliciesThisMonth.length,
      matched_policies: hitPoliciesThisMonth.length,
      timestamp: now.toISOString()
    };

    // 保存摘要
    let summaries = [];
    try {
      if (fs.existsSync(this.summaryFile)) {
        summaries = JSON.parse(fs.readFileSync(this.summaryFile, 'utf8'));
      }
    } catch (e) {
      summaries = [];
    }
    
    summaries.push(summary);
    const dir = path.dirname(this.summaryFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.summaryFile, JSON.stringify(summaries, null, 2));

    return summary;
  }

  /**
   * 获取状态概览
   */
  getStatus() {
    const active = this.policies.policies.filter(p => p.state === POLICY_STATES.ACTIVE);
    const stale = this.policies.policies.filter(p => p.state === POLICY_STATES.STALE);
    
    return {
      total_policies: this.policies.policies.length,
      active_policies: active.length,
      stale_policies: stale.length,
      high_success: active.filter(p => p.success_rate >= 0.7).length,
      last_optimization: this.policies.last_optimization,
      last_pruning: this.policies.last_pruning,
      average_success_rate: active.length > 0 
        ? Math.round(active.reduce((s, p) => s + p.success_rate, 0) / active.length * 100) / 100
        : 0
    };
  }
}

module.exports = { PolicyOptimizer };
