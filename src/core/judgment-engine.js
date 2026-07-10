/**
 * judgment-engine.js v1.0.0 — 心虫真正的判断与决策引擎
 *
 * v5.5.6 升级：集成 Graph of Thoughts 多路径推理
 * 当输入复杂度高时，使用 GoT 的 branching + backtracking + merging 生成探索路径
 *
 * 设计原则：
 * - 判断不是路由。路由是走哪条路。判断是为什么走这条路，不走其他路。
 * - 判断必须考虑后果。不做"看起来对"的决定，做"后果好"的决定。
 * - 判断必须有反馈。错误的判断被记住，下次同类场景自动纠正。
 * - 判断必须可解释。不说"因为算法说"，说"因为选了A的后果是X，选了B的后果是Y"。
 *
 * 架构：
 *   1. 多路径评估器：对同一问题生成 N 个可能判断路径，逐条评估
 *   2. 后果预测器：每个路径预测 3 个时间窗口的后果（短期/中期/长期）
 *   3. 回溯学习器：记录实际结果 vs 预测结果，修正预测模型
 *   4. 矛盾检测器：判断之间出现矛盾时，标记并触发重新评估
 *   5. 自我纠正：发现错误判断后，自动生成纠正行动
 *
 * 集成方式：替代 think() 中的 13 步分析流水线 + routeHint 路由决策
 * 判断结果以三段式输出（判断/理由/行动），不暴露过程数据
 */

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';

// ─── 时间窗口定义 ───────────────────────────────────────
const TIME_WINDOWS = {
  SHORT: { label: '短期（1-7天）', days: 7, weight: 0.5 },
  MEDIUM: { label: '中期（1-3月）', days: 90, weight: 0.3 },
  LONG: { label: '长期（1-3年）', days: 1095, weight: 0.2 },
};

// ─── 判断路径评分维度 ──────────────────────────────────
const JUDGMENT_DIMENSIONS = [
  'feasibility',    // 可行性：能否执行
  'consequence',    // 后果：执行后的整体影响
  'risk',           // 风险：失败的概率和代价
  'alignment',      // 对齐：与目标的匹配度
  'cost',           // 成本：资源/时间/情感投入
  'reversibility',  // 可逆性：错了能否回头
];

class JudgmentEngine {
  constructor(options = {}) {
    this.version = VERSION;
    this.dataDir = options.dataDir || path.join(__dirname, '../../data/judgments');
    this.memory = options.memory || null;

    // 判断历史
    this.history = [];      // [{id, input, paths, chosen, outcome, timestamp, consequenceMatches}]
    this.consequences = []; // [{judgmentId, window, predicted, actual, matchScore}]

    // 自愈 RL 表: context -> { bestPath, lastOutcome, lastPrediction }
    this.rlTable = {};

    // 缓存
    this._recentJudgments = [];

    // 加载历史
    this._load();

  }

  // ════════════════════════════════════════════════════════
  // 核心 API
  // ════════════════════════════════════════════════════════

  /**
   * 对输入做真正的判断
   * @param {string} input - 用户输入
   * @param {object} context - { intent, emotion, goal, constraints }
   * @returns {object} { judgment, paths, chosenPath, confidence, reasoning }
   */
  async judge(input, context = {}) {
    // 1. 提取判断上下文（用于 RL 匹配）
    const ctx = this._extractContext(input, context);

    // 2. 检查 RL 表中是否有同类场景的最优路径
    const rlMatch = this._findRLMatch(ctx);
    if (rlMatch && rlMatch.confidence > 0.7) {
      // RL 直接给出路径，但需要验证在当前场景仍然适用
      const reusedPath = rlMatch.path;
      const validated = this._validatePath(reusedPath, input, context);
      if (validated.valid) {
        return this._buildJudgmentResult(input, [validated.path], validated.path, 0.85, {
          source: 'rl_reuse',
          historyMatch: rlMatch.judgmentId,
          note: '基于历史同类判断的经验复用',
        });
      }
    }

    // 3. 生成多路径（最少 2 条，最多 4 条）
    const paths = this._generatePaths(input, context);

    // 4. 对每条路径做后果预测
    const evaluatedPaths = paths.map(p => this._evaluatePath(p, input, context));

    // 5. 选择最优路径
    const chosen = this._selectBestPath(evaluatedPaths);

    // 6. 生成判断结论
    const judgment = this._synthesizeJudgment(input, chosen, evaluatedPaths, context);

    // 7. 记录判断历史
    this._recordJudgment({
      input: input.slice(0, 200),
      context: ctx,
      paths: evaluatedPaths,
      chosen: chosen,
      judgment: judgment,
      timestamp: Date.now(),
    });

    return judgment;
  }

  /**
   * 记录某个判断的实际后果（用于学习）
   * @param {string} judgmentId - 判断 ID
   * @param {object} outcomes - { short: string, medium: string, long: string, score: 0-1 }
   */
  recordOutcome(judgmentId, outcomes) {
    const record = this.history.find(h => h.id === judgmentId);
    if (!record) return { error: 'judgment not found' };

    record.outcome = {
      ...outcomes,
      recordedAt: Date.now(),
    };

    // 对每个时间窗口计算预测 vs 实际匹配度
    for (const window of Object.values(TIME_WINDOWS)) {
      const predicted = record.paths
        .find(p => p.id === record.chosenId)
        ?.consequences?.[window.label];
      const actual = outcomes[window.label];

      if (predicted && actual) {
        const matchScore = this._computeMatchScore(predicted, actual);
        this.consequences.push({
          judgmentId,
          window: window.label,
          predicted,
          actual,
          matchScore,
          timestamp: Date.now(),
        });
      }
    }

    // 更新 RL 表
    this._updateRLTable(record);

    this._save();
    return { ok: true, matchScore: this._getAvgMatchScore(judgmentId) };
  }

  /**
   * 自我审查：检查最近 N 条判断是否有矛盾或错误
   * @param {number} lookback - 回看多少条
   * @returns {object} { conflicts, corrections }
   */
  selfReview(lookback = 5) {
    const recent = this.history.slice(-lookback);
    const conflicts = [];
    const corrections = [];

    // 检测矛盾：同一话题的两个判断方向相反
    for (let i = 0; i < recent.length; i++) {
      for (let j = i + 1; j < recent.length; j++) {
        const topicI = this._extractTopic(recent[i].input);
        const topicJ = this._extractTopic(recent[j].input);
        if (topicI === topicJ) {
          const dirI = recent[i].chosen?.direction;
          const dirJ = recent[j].chosen?.direction;
          if (dirI && dirJ && dirI !== dirJ) {
            conflicts.push({
              judgmentA: recent[i].id,
              judgmentB: recent[j].id,
              topic: topicI,
              directionA: dirI,
              directionB: dirJ,
              severity: 'high',
            });
          }
        }
      }
    }

    // 检测错误：后果与预测不匹配
    for (const record of recent) {
      if (record.outcome) {
        const matchScore = this._getAvgMatchScore(record.id);
        if (matchScore !== null && matchScore < 0.4) {
          corrections.push({
            judgmentId: record.id,
            input: record.input,
            predictedPath: record.chosen?.label,
            matchScore,
            recommendedAction: '重新评估判断路径，修正预测模型',
          });
        }
      }
    }

    return { conflicts, corrections, reviewed: recent.length };
  }

  /**
   * 获取引擎统计
   */
  getStats() {
    return {
      version: this.version,
      totalJudgments: this.history.length,
      totalConsequences: this.consequences.length,
      rlEntries: Object.keys(this.rlTable).length,
      recentJudgments: this.history.slice(-5).map(h => ({
        id: h.id,
        input: h.input,
        chosen: h.chosen?.label || h.chosen?.direction,
        hasOutcome: !!h.outcome,
        timestamp: h.timestamp,
      })),
      avgMatchScore: this._computeAvgMatchScore(),
    };
  }

  // ════════════════════════════════════════════════════════
  // 内部方法
  // ════════════════════════════════════════════════════════

  _extractContext(input, context) {
    // 从输入和上下文中提取可比较的特征向量
    const features = {
      intent: context.intent || 'general',
      hasEmotion: context.emotion?.sentiment !== undefined,
      sentiment: context.emotion?.sentiment || 0,
      isQuestion: /[？?]/.test(input),
      isAdvice: /(建议|推荐|advice|recommend|should|该不该|要不要|我应该)/i.test(input),
      isDecision: /(决定|选择|decide|choose)/i.test(input),
      isAnalysis: /(分析|评估|assess|evaluate)/i.test(input),
      length: input.length,
      keywords: this._extractKeywords(input),
    };
    // 生成上下文签名用于 RL 匹配
    features.signature = `${features.intent}:${features.isQuestion}:${features.isAdvice}:${features.isDecision}`;
    return features;
  }

  _extractKeywords(input) {
    const stopWords = new Set(['的', '了', '是', '在', '有', '和', '就', '不', '也', '都', '而', '及', '与', '或', '一个', '没有', '我们', '你们', '他们', '可以', '这个', '那个', '自己', '因为', '所以', '但是', '如果']);
    const words = input.split(/[\s,，。！？、；：""''（）\(\)\[\]【】]+/);
    return words.filter(w => w.length > 1 && !stopWords.has(w)).slice(0, 10);
  }

  _extractTopic(input) {
    // 简单的话题提取：取前 3 个有意义的词
    const keywords = this._extractKeywords(input);
    return keywords.slice(0, 3).join('_');
  }

  _findRLMatch(ctx) {
    const signature = ctx.signature;
    if (this.rlTable[signature]) {
      const entry = this.rlTable[signature];
      return {
        path: entry.bestPath,
        confidence: entry.confidence || 0.7,
        judgmentId: entry.judgmentId,
      };
    }
    return null;
  }

  /**
   * 生成多路径判断方案
   * 真正的判断 = 至少 2 条可选路径
   */
  _generatePaths(input, context) {
    const paths = [];
    const isQuestion = /[？?]/.test(input);
    const isAdvice = /(建议|推荐|advice|recommend|should|该不该|要不要|我应该)/i.test(input);
    const isDecision = /(决定|选择|decide|choose)/i.test(input);
    const hasEmotion = context.emotion?.sentiment !== undefined;
    const sentiment = context.emotion?.sentiment || 0;

    // v5.1.0: 使用上游认知数据做更灵敏的路径生成
    const agentPsych = context.agentPsychology || {};
    const agentPhil = context.agentPhilosophy || {};
    const desire = context.desire || {};
    const threePoisons = context.threePoisons || {};
    const selfPos = context.selfPositioning || {};

    // 从认知数据提取信号（兼容 agentPsychology 嵌套格式）
    const psychDims = agentPsych.dimensions || {};
    const cognitiveLoad = psychDims.cognitiveLoad?.load || 0;
    const goalConflicts = psychDims.goalConflicts?.count || 0;
    const identityDrift = psychDims.identityDrift?.drift || 0;

    // 从 desire 提取（兼容嵌套格式）
    const desireScores = desire.desires || {};
    const hasHighDesire = Object.values(desireScores).filter(d => d && d.score > 0.6).length > 0;

    // 从 threePoisons 提取（兼容嵌套格式）
    const poisonScores = threePoisons.scores || {};
    const hasDelusion = (poisonScores.delusion || 0) > 5;
    const hasGreed = (poisonScores.greed || 0) > 5;
    const hasResonance = selfPos && selfPos.resonance && selfPos.resonance.score > 0.5;

    // 路径 A: 分析先行（默认路径——先理解再行动）
    paths.push({
      id: 'path_analyze',
      label: '分析先行',
      direction: 'analyze',
      description: '先分析理解问题全貌，再给判断',
      applicable: true,
      priority: 0.9,
    });

    // 路径 B: 直接行动（问题明确时）
    paths.push({
      id: 'path_act',
      label: '直接行动',
      direction: 'act',
      description: '问题明确，直接给判断和行动建议',
      applicable: isAdvice || isDecision || (!isQuestion && !hasEmotion),
      priority: 0.7,
    });

    // 路径 C: 共情优先（情绪强烈时）
    paths.push({
      id: 'path_empathize',
      label: '共情优先',
      direction: 'empathize',
      description: '情绪强烈，先回应情绪再做判断',
      applicable: hasEmotion && Math.abs(sentiment) > 0.3,
      priority: 0.8,
    });

    // 路径 D: 反问引导（用户陷入困境时）
    paths.push({
      id: 'path_reflect',
      label: '反问引导',
      direction: 'reflect',
      description: '用户陷入困境，用问题引导用户自己找到答案',
      applicable: isDecision && sentiment < 0,
      priority: 0.6,
    });

    // v5.1.0: 根据认知数据调整路径优先级
    // 认知负荷高 + 欲望强烈 → 降级直接行动的可行性
    if (hasHighDesire) {
      const actPath = paths.find(p => p.id === 'path_act');
      if (actPath) actPath.priority *= 0.8;
    }
    if (hasDelusion) {
      // 痴高 → 分析路径优先级提升
      const actPath = paths.find(p => p.id === 'path_act');
      if (actPath) actPath.priority *= 0.6;
      const analyzePath = paths.find(p => p.id === 'path_analyze');
      if (analyzePath) analyzePath.priority *= 1.2;
    }
    if (hasGreed && !hasHighDesire) {
      // 贪高但欲望不强烈 → 可能是空想，反问引导更合适
      const reflectPath = paths.find(p => p.id === 'path_reflect');
      if (reflectPath) reflectPath.priority *= 1.3;
    }
    // 认知负荷高 → 行动决策需要更谨慎
    if (cognitiveLoad > 0.5) {
      const actPath = paths.find(p => p.id === 'path_act');
      if (actPath) actPath.priority *= 0.7;
    }

    // v5.5.6: Graph of Thoughts 增强 — 复杂输入时探索额外推理路径
    // 触发条件：输入长度>50 或 包含问题/决策/建议关键词 或 认知负荷高
    const hasComplexSignal = input.length > 50
      || isQuestion || isDecision || isAdvice
      || (psychDims.cognitiveLoad?.load > 0.5)
      || (goalConflicts > 0);
    if (hasComplexSignal) {
      let gotEngine = null;
      try {
        const GoTMod = require('../reasoning/graph-of-thoughts.js');
        gotEngine = new GoTMod.GoTEngine({
          problem: input.slice(0, 300),
          maxDepth: 3,
          branchFactor: 2,
          mergeThreshold: 0.6,
          scorer: (node) => {
            const text = (node.content || '').toLowerCase();
            const certainty = /确定|肯定|必然|必须|一定|certain|definitely|must|should/i.test(text) ? 0.3 : 0;
            const completeness = text.length > 20 ? 0.4 : 0.1;
            return Math.min(1, certainty + completeness);
          }
        });
      } catch (e) { /* GoT 增强可选 */ }

      // 同步获取 GoT 最佳路径（如果引擎已就绪）
      if (gotEngine && typeof gotEngine.exploreSync === 'function') {
        try {
          const gotResult = gotEngine.exploreSync(input.slice(0, 200));
          if (gotResult && gotResult.bestPath && gotResult.bestPath.length >= 2) {
            const gotBest = gotResult.bestPath;
            const finalThought = gotBest[gotBest.length - 1];
            const directionHint = /因此|所以|结论|应该|必须|建议/i.test(finalThought) ? 'act'
              : /问题|矛盾|需要进一步|不确定/i.test(finalThought) ? 'analyze' : 'reflect';
            paths.push({
              id: 'path_got_explore',
              label: '多步推理探索',
              direction: directionHint,
              description: `GoT 推理链 (${gotBest.length}步): ${gotBest[0].slice(0, 50)}...`,
              applicable: true,
              priority: 0.55,
              gotPaths: gotBest,
            });
          }
        } catch (e) { /* GoT 路径生成失败，不影响基础路径 */ }
      }
    }

    return paths.filter(p => p.applicable);
  }

  /**
   * 对一条路径做后果预测
   */
  _evaluatePath(path, input, context) {
    // 对每个时间窗口预测后果
    const consequences = {};
    for (const [key, window] of Object.entries(TIME_WINDOWS)) {
      consequences[window.label] = this._predictConsequence(path, key, input, context);
    }

    // 多维度评分（1-10）
    const scores = {};
    for (const dim of JUDGMENT_DIMENSIONS) {
      scores[dim] = this._scoreDimension(dim, path, input, context);
    }

    // 加权总分
    const weights = { feasibility: 0.2, consequence: 0.25, risk: 0.2, alignment: 0.15, cost: 0.1, reversibility: 0.1 };
    const totalScore = Object.entries(weights)
      .reduce((sum, [dim, w]) => sum + (scores[dim] || 5) * w, 0);

    return {
      ...path,
      scores,
      consequences,
      totalScore: Math.round(totalScore * 10) / 10,
      confidence: Math.min(0.9, totalScore / 10),
    };
  }

  _predictConsequence(path, timeWindow, input, context) {
    // 基于路径方向 + 时间窗口做定性预测
    const basePredictions = {
      analyze: {
        SHORT: '对问题有更清晰的理解，但尚未采取实际行动',
        MEDIUM: '分析结论已沉淀为可执行的计划',
        LONG: '早期分析为后续行动提供了正确的方向指引',
      },
      act: {
        SHORT: '立即产生可见的变化或反馈',
        MEDIUM: '行动结果已显现，可能需要调整方向',
        LONG: '行动路径已形成稳定模式',
      },
      empathize: {
        SHORT: '情绪得到响应，信任基础增强',
        MEDIUM: '情绪缓解后能更理性地面对问题',
        LONG: '建立了稳定的情感连接，判断更容易被接受',
      },
      reflect: {
        SHORT: '用户开始主动思考，但可能感到困惑',
        MEDIUM: '用户形成了自己的判断框架',
        LONG: '用户具备了独立判断能力',
      },
    };

    const predictions = basePredictions[path.direction] || basePredictions.analyze;
    return predictions[timeWindow] || '后果不可预测';
  }

  _scoreDimension(dim, path, input, context) {
    // 基于路径特征做粗评分，后续可升级为更精细的评分模型
    const base = 5;

    // v5.1.0: 使用上游认知数据做精确评分
    const agentPsych = context.agentPsychology || {};
    const desire = context.desire || {};
    const threePoisons = context.threePoisons || {};

    // 兼容嵌套格式
    const psychDims = agentPsych.dimensions || {};
    const cognitiveLoad = psychDims.cognitiveLoad?.load || 0;
    const goalConflicts = psychDims.goalConflicts?.count || 0;
    const identityDrift = psychDims.identityDrift?.drift || 0;
    const desireScores = desire.desires || {};
    const hasHighDesire = Object.values(desireScores).filter(d => d && d.score > 0.6).length > 0;
    const poisonScores = threePoisons.scores || {};
    const hasDelusion = (poisonScores.delusion || 0) > 5;
    const hasGreed = (poisonScores.greed || 0) > 5;

    switch (dim) {
      case 'feasibility':
        // 行动类路径可行性较低（需要用户行动），分析类较高
        if (path.direction === 'act') {
          // 如果认知负荷高或欲望强烈，行动可行性进一步降低
          const penalty = (cognitiveLoad > 0.5 ? 1 : 0) + (hasHighDesire ? 1 : 0);
          return Math.max(1, base + 1 - penalty);
        }
        if (path.direction === 'analyze') {
          // v5.4.0: 根据输入长度和复杂度调整可行性评分
          const inputLen = (input || '').length;
          const complexityBonus = inputLen > 100 ? 1 : inputLen > 50 ? 0.5 : 0;
          return Math.min(10, base + 2 + complexityBonus);
        }
        if (path.direction === 'reflect') return Math.min(10, base + 3); // 反问最可行
        return base;

      case 'consequence':
        // 后果影响：共情类长期影响好，行动类短期影响大
        if (path.direction === 'empathize') {
          // v5.4.0: 根据情绪强度调整共情后果评分
          const sentiment = context.emotion?.sentiment || 0;
          const emotionBonus = Math.abs(sentiment) > 0.5 ? 2 : Math.abs(sentiment) > 0.2 ? 1 : 0;
          return Math.min(10, base + 3 + emotionBonus);
        }
        if (path.direction === 'act') {
          // 如果有贪或痴，行动的长期后果变差
          const penalty = (hasGreed ? 1 : 0) + (hasDelusion ? 2 : 0);
          return Math.max(1, base + 1 - penalty);
        }
        return base;

      case 'risk':
        // 风险：行动类风险最高，分析类最低
        if (path.direction === 'act') {
          // 认知负荷高 + 目标冲突多 → 行动风险更大
          const extra = (cognitiveLoad > 0.5 ? 1 : 0) + (goalConflicts > 0 ? 1 : 0) + (identityDrift > 0.3 ? 1 : 0);
          return Math.max(1, base - 2 - extra);
        }
        if (path.direction === 'analyze') {
          // v5.4.0: 有谬误检测结果时风险降低，有情绪时风险略升
          const logicReasoning = context.logicReasoning || {};
          const hasFallacies = logicReasoning.fallacies && logicReasoning.fallacies.length > 0;
          const fallacyPenalty = hasFallacies ? -1 : 0;
          const emotionPenalty = context.emotion?.sentiment !== undefined && Math.abs(context.emotion.sentiment) > 0.5 ? -1 : 0;
          return Math.max(1, Math.min(10, base + 1 + fallacyPenalty + emotionPenalty));
        }
        if (path.direction === 'reflect') return Math.min(10, base + 2);
        return base;

      case 'alignment':
        // 对齐度：取决于上下文中的意图
        if (context.intent === 'advice' && path.direction === 'act') return Math.min(10, base + 3);
        if (context.intent === 'analysis' && path.direction === 'analyze') return Math.min(10, base + 3);
        if (context.intent === 'emotional' && path.direction === 'empathize') return Math.min(10, base + 3);
        // v5.4.0: 无明确意图时，analyze 路径默认对齐度较低
        if (path.direction === 'analyze' && !context.intent) return Math.max(1, base - 1);
        return base;

      case 'cost':
        // 成本：行动类最高，分析类最低
        if (path.direction === 'act') return Math.max(1, base - 2);
        if (path.direction === 'analyze') return Math.min(10, base + 1);
        if (path.direction === 'reflect') return Math.min(10, base + 2);
        return base;

      case 'reversibility':
        // 可逆性：分析/反问最容易回头，行动最难
        if (path.direction === 'analyze' || path.direction === 'reflect') return Math.min(10, base + 3);
        if (path.direction === 'act') return Math.max(1, base - 2);
        return base;

      default:
        return base;
    }
  }

  _selectBestPath(evaluatedPaths) {
    if (evaluatedPaths.length === 0) return null;
    if (evaluatedPaths.length === 1) return evaluatedPaths[0];

    // 按总分排序，取最优
    const sorted = [...evaluatedPaths].sort((a, b) => b.totalScore - a.totalScore);
    const best = sorted[0];
    const runnerUp = sorted[1];

    return {
      ...best,
      alternative: runnerUp ? {
        label: runnerUp.label,
        score: runnerUp.totalScore,
        whyNotChosen: `总分 ${runnerUp.totalScore} vs ${best.totalScore}，${this._whyNotChosen(best, runnerUp)}`,
      } : null,
      whyChosen: this._whyChosen(best, evaluatedPaths),
    };
  }

  _whyChosen(chosen, all) {
    const reasons = [];
    const strengths = Object.entries(chosen.scores)
      .filter(([, v]) => v >= 7)
      .map(([k]) => ({ dimension: k, score: chosen.scores[k] }));
    if (strengths.length > 0) {
      reasons.push(`优势维度: ${strengths.map(s => `${s.dimension}(${s.score}/10)`).join(', ')}`);
    }
    reasons.push(`总分: ${chosen.totalScore}/10`);
    return reasons.join('；');
  }

  _whyNotChosen(chosen, runnerUp) {
    const diff = chosen.totalScore - runnerUp.totalScore;
    if (diff > 1) return `差距较大（+${diff.toFixed(1)}分）`;
    const weakDims = Object.entries(runnerUp.scores)
      .filter(([, v]) => v < 5)
      .map(([k]) => k);
    if (weakDims.length > 0) return `${weakDims.join('、')}维度评分偏低`;
    return '综合评估不如首选路径';
  }

  _validatePath(path, input, context) {
    // 验证历史路径在当前场景是否仍然适用
    const evaluated = this._evaluatePath(path, input, context);
    return {
      valid: evaluated.totalScore >= 6,
      path: evaluated,
    };
  }

  _synthesizeJudgment(input, chosen, allPaths, context) {
    const id = `judg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (!chosen) {
      return {
        id,
        judgment: '无法做出判断——信息不足或场景不明',
        paths: allPaths,
        chosenPath: null,
        confidence: 0.2,
        reasoning: '所有路径评估均未达到可用阈值',
        direction: 'unknown',
        timestamp: Date.now(),
      };
    }

    // 构建判断理由
    const reasoning = this._buildReasoning(chosen, allPaths, context);
    // 构建行动建议
    const action = this._buildAction(chosen, input, context);

    return {
      id,
      judgment: action,
      paths: allPaths.map(p => ({
        label: p.label,
        direction: p.direction,
        score: p.totalScore,
        scores: p.scores,
      })),
      chosenPath: {
        label: chosen.label,
        direction: chosen.direction,
        score: chosen.totalScore,
        scores: chosen.scores,
        consequences: chosen.consequences,
        alternative: chosen.alternative,
        whyChosen: chosen.whyChosen,
      },
      confidence: Math.round(chosen.confidence * 100) / 100,
      reasoning: reasoning,
      direction: chosen.direction,
      timestamp: Date.now(),
    };
  }

  _buildReasoning(chosen, allPaths, context) {
    const parts = [];

    // 首句：判断结论
    parts.push(`选择了「${chosen.label}」路径`);

    // 对比：为什么不是其他路径
    const others = allPaths.filter(p => p.id !== chosen.id);
    if (others.length > 0) {
      const otherLabels = others.map(o => `「${o.label}」(${o.totalScore}分)`).join('、');
      parts.push(`（其他选项: ${otherLabels}）`);
    }

    // 后果预测
    const shortTerm = chosen.consequences?.['短期（1-7天）'];
    if (shortTerm) {
      parts.push(`预期效果: ${shortTerm}`);
    }

    // 如果选择了非默认路径，说明原因
    if (chosen.direction !== 'analyze') {
      const defaultPath = allPaths.find(p => p.direction === 'analyze');
      if (defaultPath) {
        const diff = chosen.totalScore - defaultPath.totalScore;
        if (diff > 0) {
          parts.push(`分析路径评分 ${defaultPath.totalScore}，当前路径 ${chosen.totalScore}，差距 ${diff.toFixed(1)} 分`);
        }
      }
    }

    return parts.join('。');
  }

  _buildAction(chosen, input, context) {
    // ─── 心虫用路径数据自己做决策，不再用模板 ─────
    const direction = chosen.direction;
    const score = chosen.totalScore;
    const consequences = chosen.consequences || {};

    // v5.2.2: 不再用固定模板，而是基于输入内容 + 路径数据生成有信息的结论
    // 从输入中提取关键信息
    const inputSnippet = input.length > 100 ? input.slice(0, 100) + '...' : input;
    const hasQuestion = /[？?]/.test(input);
    const isShort = input.length < 20;
    const hasCode = /代码|函数|function|const|let|var|def |class |import|require|export|排序|算法|程序|脚本/.test(input);
    const hasEmotionWord = /难过|开心|生气|焦虑|怕|爱|恨|委屈|哭|怒|气死了|恼火|火大/.test(input);
    const isMemoryRequest = /上次|之前|以前|你记得|我们说/.test(input);

    let judge = '';
    let reason = '';
    let action = '';

    if (direction === 'analyze') {
      if (isMemoryRequest) {
        judge = '这是一个记忆查询请求';
        reason = '用户正在询问之前的对话或存储的信息';
        action = '检索相关记忆，给出准确答复';
      } else if (hasEmotionWord) {
        judge = '检测到情绪表达';
        reason = '输入包含情绪关键词';
        action = '识别情绪类型，回应情绪后再做分析';
      } else if (hasCode) {
        judge = '需要分析代码';
        reason = '输入包含代码片段';
        action = '理解代码逻辑，找出问题或优化点';
      } else if (hasQuestion) {
        judge = '这是一个待回答的问题';
        reason = `输入包含疑问句`;
        action = '分析问题后给出准确答案';
      } else if (isShort) {
        judge = '简短输入，需要推断意图';
        reason = `输入较短（${input.length}字），需要结合上下文理解`;
        action = '基于输入特征和已知信息做出回应';
      } else {
        judge = `需要分析输入内容`;
        reason = `输入类型: ${context.intent || 'general'}，长度: ${input.length}字`;
        action = '提取关键信息，分析后给出判断';
      }
    } else if (direction === 'act') {
      judge = '判断明确，可以直接行动';
      if (score >= 7) {
        reason = '行动路径评分高，风险可控，收益明确';
      } else {
        reason = `行动路径评分 ${score}/10，但仍有不确定性`;
      }
      action = '按判断方向行动，关注过程中的反馈信号，准备随时调整';
    } else if (direction === 'empathize') {
      judge = '情绪优先，判断可以等';
      reason = '情绪信号强烈，理性判断的前提是情绪得到响应';
      action = '先回应情绪，等情绪稳定后再做判断';
    } else if (direction === 'reflect') {
      judge = '这个问题用户自己判断更合适';
      reason = '用户具备判断能力，卡住的原因是没想清楚而不是不知道';
      action = '用反问帮助用户梳理思路，让用户自己找到答案';
    } else {
      judge = '判断中';
      reason = '正在评估';
      action = '先收集更多信息';
    }

    // 附加后果预测（如果有）
    const shortTerm = consequences['短期（1-7天）'];
    if (shortTerm && !action.includes(shortTerm)) {
      action = `${action}。预期: ${shortTerm}`;
    }

    return `${judge}。${reason}。${action}`;
  }

  _recordJudgment(record) {
    // 确保记录有 id（可能在 judgment 对象里）
    if (!record.id && record.judgment && record.judgment.id) {
      record.id = record.judgment.id;
    }
    this.history.push(record);
    this._recentJudgments.push(record.id);
    if (this._recentJudgments.length > 50) {
      this._recentJudgments.shift();
    }
    this._autoSave();
  }

  _updateRLTable(record) {
    if (!record.outcome) return;

    const context = record.context;
    if (!context || !context.signature) return;

    const signature = context.signature;
    const matchScore = this._getAvgMatchScore(record.id);

    if (!this.rlTable[signature] || matchScore > (this.rlTable[signature].confidence || 0)) {
      this.rlTable[signature] = {
        bestPath: record.chosen,
        confidence: matchScore,
        judgmentId: record.id,
        updatedAt: Date.now(),
      };
    }
  }

  _getAvgMatchScore(judgmentId) {
    const records = this.consequences.filter(c => c.judgmentId === judgmentId);
    if (records.length === 0) return null;
    return records.reduce((sum, r) => sum + r.matchScore, 0) / records.length;
  }

  _computeMatchScore(predicted, actual) {
    if (!predicted || !actual) return 0.5;
    // 简单匹配：相同程度越高，分数越高
    const p = predicted.toLowerCase();
    const a = actual.toLowerCase();
    if (p === a) return 1.0;
    // 检查关键词重叠
    const pWords = new Set(p.split(/[\s,，。！？、；：]/).filter(w => w.length > 2));
    const aWords = new Set(a.split(/[\s,，。！？、；：]/).filter(w => w.length > 2));
    if (pWords.size === 0 || aWords.size === 0) return 0.5;
    let matchCount = 0;
    for (const word of pWords) {
      if (aWords.has(word) || a.includes(word)) matchCount++;
    }
    return Math.min(1, matchCount / Math.max(pWords.size, aWords.size) * 1.5);
  }

  _computeAvgMatchScore() {
    if (this.history.length === 0) return null;
    const withOutcomes = this.history.filter(h => h.outcome);
    if (withOutcomes.length === 0) return null;
    let total = 0;
    let count = 0;
    for (const h of withOutcomes) {
      const score = this._getAvgMatchScore(h.id);
      if (score !== null) { total += score; count++; }
    }
    return count > 0 ? Math.round(total / count * 100) / 100 : null;
  }

  // ════════════════════════════════════════════════════════
  // 持久化
  // ════════════════════════════════════════════════════════

  _load() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const filePath = path.join(this.dataDir, 'judgment-history.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        this.history = data.history || [];
        this.consequences = data.consequences || [];
        this.rlTable = data.rlTable || {};
      }
    } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
  }

  _autoSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(), 2000);
  }

  _save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const filePath = path.join(this.dataDir, 'judgment-history.json');
      const data = JSON.stringify({
        history: this.history.slice(-200),
        consequences: this.consequences.slice(-500),
        rlTable: this.rlTable,
        savedAt: Date.now(),
        version: this.version,
      }, null, 2);
      fs.writeFileSync(filePath, data, 'utf-8');
    } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
  }

  destroy() {
    this._save();
    if (this._saveTimer) clearTimeout(this._saveTimer);
  }
}

module.exports = { JudgmentEngine, VERSION };
