/**
 * Experience Distiller — 经验蒸馏器 v1.0.0
 *
 * 从每次 think() 的思维过程中提取可复用抽象原则，持久化存储。
 * 下次遇到相似议题时自动召回，让心虫「一次学到，下次会用」。
 *
 * 核心设计：
 *   1. 蒸馏 (distill) — 每次 think 后运行，从 tcResult 提取抽象
 *   2. 召回 (recall) — think 前置检索，匹配当前输入返回相关抽象
 *   3. 衰减 (decay) — 未被引用的抽象随时间降权
 *
 * 灵感：arXiv "Notes to Self: Can LLMs Benefit from Experiential Abstractions?"
 *      人类把经验蒸馏成可复用策略——心虫也应该能。
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/experience-abstractions.json');

class ExperienceDistiller {

  constructor(options = {}) {
    this._maxAbstractions = options.maxAbstractions || 500;
    this._decayDays = options.decayDays || 30;       // 30天未引用衰减
    this._minConfidence = options.minConfidence || 0.4; // 低于此置信度不生成抽象
    this._stats = { totalDistilled: 0, totalRecalled: 0, abstractionsPruned: 0 };
    this._abstractions = [];
    this._loaded = false;
  }

  // ─── 加载 ──────────────────────────────────────────────────────────────

  load() {
    if (this._loaded) return;
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(raw);
        this._abstractions = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      this._abstractions = [];
    }
    this._loaded = true;
  }

  _save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this._abstractions, null, 2), 'utf8');
    } catch (e) {
      // 写入失败不阻断主流程
    }
  }

  // ─── 蒸馏 ──────────────────────────────────────────────────────────────

  /**
   * 从 think() 结果中提取可复用抽象
   * @param {Object} tcResult - think() 返回的结果对象
   * @param {string} input - 原始输入
   * @returns {Array} 本次新增的抽象列表
   */
  distill(tcResult, input) {
    this.load();
    if (!tcResult || !input) return [];

    const newAbstractions = [];
    const type = tcResult.type || tcResult?.analysis?.perceivedType || 'unknown';
    const confidence = tcResult.confidence ?? tcResult?.analysis?.confidence ?? 0;
    const decision = tcResult.decision || {};

    // 1. 提取「输入特征→分类→决策」模式
    const features = this._extractFeatures(input);
    const decisionType = decision.type || '';
    const decisionRationale = (decision.rationale || '').substring(0, 200);

    // 只有当分类明确且有合理置信度时才蒸馏
    if (type !== 'invalid' && type !== 'unknown' && confidence >= this._minConfidence) {
      const abstraction = {
        id: `abs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'route_pattern',
        trigger: { typePattern: type, features: features.slice(0, 3) },
        insight: `当输入分类为 "${type}"（置信度 ${(confidence * 100).toFixed(0)}%）时，决策为 "${decisionType}"。${decisionRationale ? '依据：' + decisionRationale : ''}`,
        decisionLabel: decisionType,
        confidence: confidence,
        born: Date.now(),
        lastUsed: Date.now(),
        useCount: 0,
        hitCount: 0,
      };
      newAbstractions.push(abstraction);
    }

    // 2. 如果 think 链里有辅助引擎结果，提取交叉信号
    if (tcResult.analysis?.modulesRun > 2 && tcResult.analysis?.modulesRun < 10) {
      const modAbstraction = {
        id: `abs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'module_composition',
        trigger: { moduleCount: tcResult.analysis.modulesRun },
        insight: `该输入调用了 ${tcResult.analysis.modulesRun} 个引擎模块。模块数量适中，覆盖全面。`,
        confidence: 0.5,
        born: Date.now(),
        lastUsed: Date.now(),
        useCount: 0,
        hitCount: 0,
      };
      newAbstractions.push(modAbstraction);
    }

    // 3. 去重：如果已有完全相同的 trigger pattern，更新统计不追加
    const deduped = [];
    for (const abs of newAbstractions) {
      const existing = this._abstractions.find(a =>
        a.trigger.typePattern && abs.trigger.typePattern &&
        a.trigger.typePattern === abs.trigger.typePattern &&
        a.type === abs.type
      );
      if (existing) {
        existing.useCount = (existing.useCount || 0) + 1;
        existing.lastUsed = Date.now();
        existing.confidence = (existing.confidence * 0.7 + abs.confidence * 0.3);
      } else {
        deduped.push(abs);
      }
    }

    if (deduped.length > 0) {
      this._abstractions.push(...deduped);
      this._stats.totalDistilled += deduped.length;

      // 容量保护
      if (this._abstractions.length > this._maxAbstractions) {
        this._prune();
      }
      this._save();
    }

    return deduped;
  }

  // ─── 召回 ──────────────────────────────────────────────────────────────

  /**
   * 根据输入检索相关抽象规则
   * @param {string} input - 当前输入
   * @param {number} limit - 最多返回条数
   * @returns {Array} 排序后的相关抽象
   */
  recall(input, limit = 5) {
    this.load();
    if (!input || this._abstractions.length === 0) return [];

    const inputLower = input.toLowerCase();
    const words = inputLower.split(/\s+/).filter(w => w.length > 2);
    const inputFeatures = this._extractFeatures(input);  // 对输入也提取特征

    // 计算每个抽象与输入的匹配度
    const scored = this._abstractions.map(abs => {
      let score = 0;

      // 按 trigger.typePattern 匹配（权重最高）
      if (abs.trigger.typePattern) {
        const pattern = abs.trigger.typePattern.toLowerCase();
        if (inputLower.includes(pattern)) score += 0.6;
        // 特征推断：如果输入特征包含 typePattern 也表示匹配
        if (inputFeatures.includes(abs.trigger.typePattern)) score += 0.5;
      }

      // 按 trigger.features 匹配（输入特征与存储特征的交集）
      if (abs.trigger.features && abs.trigger.features.length > 0) {
        const storedFeatures = abs.trigger.features.map(f => f.toLowerCase());
        const matchCount = inputFeatures.filter(f => storedFeatures.includes(f)).length;
        score += matchCount * 0.25;
      }

      // 按 insight 中的关键词匹配
      if (abs.insight) {
        const insightWords = abs.insight.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matched = words.filter(w => insightWords.includes(w));
        score += matched.length * 0.05;
      }

      // 按决策标签匹配
      if (abs.decisionLabel && inputLower.includes(abs.decisionLabel.toLowerCase())) {
        score += 0.3;
      }

      // 衰减：长期未使用的降权
      const daysSinceUse = (Date.now() - (abs.lastUsed || abs.born)) / (1000 * 86400);
      if (daysSinceUse > this._decayDays) {
        score *= Math.max(0.1, 1 - (daysSinceUse - this._decayDays) / 30);
      }

      // 置信度权重
      score *= (abs.confidence || 0.5);

      return { abstraction: abs, score };
    });

    const matched = scored.filter(s => s.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 更新召回统计
    for (const match of matched) {
      match.abstraction.hitCount = (match.abstraction.hitCount || 0) + 1;
      match.abstraction.lastUsed = Date.now();
    }
    this._stats.totalRecalled += matched.length;

    return matched.map(m => ({
      id: m.abstraction.id,
      insight: m.abstraction.insight,
      type: m.abstraction.type,
      decisionLabel: m.abstraction.decisionLabel,
      confidence: m.abstraction.confidence,
      relevanceScore: +m.score.toFixed(3),
    }));
  }

  // ─── 内部方法 ──────────────────────────────────────────────────────────

  _extractFeatures(input) {
    const features = [];
    const text = input.toLowerCase();

    // 常见特征词检测
    const patterns = [
      { word: 'why', feature: 'causal_question' },
      { word: 'what if', feature: 'counterfactual' },
      { word: 'should', feature: 'prescriptive' },
      { word: 'how', feature: 'procedural' },
      { word: 'feel', feature: 'emotional' },
      { word: 'compare', feature: 'comparative' },
      { word: 'explain', feature: 'explanatory' },
      { word: 'predict', feature: 'predictive' },
      { word: 'analyze', feature: 'analytical' },
      { word: 'create', feature: 'creative' },
      { word: 'summarize', feature: 'summarization' },
    ];

    for (const p of patterns) {
      if (text.includes(p.word)) features.push(p.feature);
    }

    // 长度特征
    if (text.length < 50) features.push('short_input');
    else if (text.length > 500) features.push('long_input');

    return features;
  }

  _prune() {
    // 淘汰：使用次数少 + 置信度低 + 长期未用
    const expired = this._abstractions
      .filter(a => {
        const daysSinceBorn = (Date.now() - a.born) / (1000 * 86400);
        const daysSinceUse = (Date.now() - (a.lastUsed || a.born)) / (1000 * 86400);
        return daysSinceBorn > 7 && daysSinceUse > this._decayDays && (a.useCount || 0) < 2 && (a.confidence || 0) < 0.6;
      })
      .map(a => a.id);

    if (expired.length > 0) {
      this._abstractions = this._abstractions.filter(a => !expired.includes(a.id));
      this._stats.abstractionsPruned += expired.length;
    }

    // 如果还超容量，淘汰最旧且使用最少的
    if (this._abstractions.length > this._maxAbstractions) {
      this._abstractions.sort((a, b) => (a.useCount || 0) - (b.useCount || 0));
      const removeCount = this._abstractions.length - this._maxAbstractions;
      this._abstractions = this._abstractions.slice(removeCount);
      this._stats.abstractionsPruned += removeCount;
    }
  }

  // ─── 查询 ──────────────────────────────────────────────────────────────

  getAbstractions(limit = 20) {
    this.load();
    return this._abstractions.slice(-limit).map(a => ({
      id: a.id,
      type: a.type,
      trigger: a.trigger,
      insight: (a.insight || '').substring(0, 120),
      confidence: a.confidence,
      useCount: a.useCount || 0,
      hitCount: a.hitCount || 0,
      daysSinceLastUse: Math.round((Date.now() - (a.lastUsed || a.born)) / (1000 * 86400)),
    })).reverse();
  }

  getStats() {
    this.load();
    return {
      ...this._stats,
      totalStored: this._abstractions.length,
      types: [...new Set(this._abstractions.map(a => a.type))],
    };
  }

  clear() {
    this._abstractions = [];
    this._stats = { totalDistilled: 0, totalRecalled: 0, abstractionsPruned: 0 };
    this._save();
  }
}

module.exports = { ExperienceDistiller };
