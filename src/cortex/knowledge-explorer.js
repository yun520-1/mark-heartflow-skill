/**
 * KnowledgeExplorer — 知识探索器 v1.0.0
 *
 * 「默认自己无知，对世界好奇」—— 用户
 * 「模型不能永远依赖一次性训练，它应该像人一样，在长期工作过程中不断学习」—— 梁文锋
 *
 * 心虫现有机制能检测"哪里弱"（ContinuousLearner 低置信），但不会主动去填补。
 * KnowledgeExplorer 补的正是这个缺口：
 *
 * 1. **聚合缺口**：从 ContinuousLearner 的置信度低谷 + 好奇心引擎的注册间隙，提炼"待探索"队列
 * 2. **生成探索计划**：对每个缺口生成可执行的搜索策略（arXiv / 新闻 / 网页）
 * 3. **吸收成果**：搜索结果回来后被索引并存入 WorldTree
 *
 * 本模块是引擎内"好奇→探索→学习"闭环的驱动端，执行端由 agent 工具完成。
 *
 * @version 1.0.0
 */
const fs = require('fs');
const path = require('path');

const GAP_FILE = path.join(__dirname, '../../data/knowledge-gaps.json');

// 预置的常驻知识缺口（心虫知道自己不知道的）
const INNATE_GAPS = [
  {
    topic: '持续学习 (Continual Learning) 前沿方法',
    question: 'LLM 持续学习的 SOTA 方法和评估基准有哪些？',
    source: '梁文锋判断持续学习是AGI下一个瓶颈',
    priority: 8,
    suggestedQuery: 'continual learning LLM benchmark 2026',
    suggestedSource: 'arxiv',
  },
  {
    topic: '经验蒸馏 (Notes to Self) 论文方法细节',
    question: 'Notes to Self 论文的具体方法是什么？如何将经验抽象注入LLM？',
    source: '心虫已受其启发构建ExperienceDistiller，需原论文确认',
    priority: 7,
    suggestedQuery: 'notes to self experiential abstractions LLM 2025',
    suggestedSource: 'arxiv',
  },
  {
    topic: '国产AI芯片生态进展',
    question: '梁文锋说"未来一年国产芯片生态被验证毫无问题"，当前进展如何？',
    source: '梁文锋4小时投资会讲话',
    priority: 6,
    suggestedQuery: '国产AI芯片 生态 进展 2026',
    suggestedSource: 'news',
  },
];

class KnowledgeExplorer {

  constructor(opts = {}) {
    this._config = {
      maxGaps: opts.maxGaps || 50,
      minExplorationInterval: opts.minExplorationInterval || 5 * 60 * 1000, // 同个缺口5分钟内不重复探索
      priorityThreshold: opts.priorityThreshold || 4,
    };
    this._gaps = [];
    this._loaded = false;
    this._stats = {
      totalGapsIdentified: 0,
      totalExplorationsCompleted: 0,
      totalKnowledgeAbsorbed: 0,
    };
  }

  // ─── 加载/持久化 ──────────────────────────────────────────────

  load() {
    if (this._loaded) return;
    try {
      if (fs.existsSync(GAP_FILE)) {
        const raw = fs.readFileSync(GAP_FILE, 'utf8');
        const data = JSON.parse(raw);
        this._gaps = Array.isArray(data.gaps) ? data.gaps : [];
        this._stats = data.stats || { totalGapsIdentified: 0, totalExplorationsCompleted: 0, totalKnowledgeAbsorbed: 0 };
      } else {
        this._gaps = JSON.parse(JSON.stringify(INNATE_GAPS));
      }
    } catch (e) {
      this._gaps = JSON.parse(JSON.stringify(INNATE_GAPS));
    }
    this._loaded = true;
  }

  _save() {
    try {
      const dir = path.dirname(GAP_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(GAP_FILE, JSON.stringify({ gaps: this._gaps, stats: this._stats, lastUpdated: Date.now() }, null, 2), 'utf8');
    } catch (e) { /* 非关键 */ }
  }

  // ─── 缺口管理 ──────────────────────────────────────────────

  /**
   * 从 ContinuousLearner 的置信缺口信号生成知识缺口
   */
  absorbLearnerSignals(learnerStats) {
    this.load();
    if (!learnerStats) return;

    // 如果总置信缺口超过 thinkCount 的 15%，生成"系统性能瓶颈"缺口
    const rate = learnerStats.thinkCount > 0
      ? learnerStats.lowConfidenceHits / learnerStats.thinkCount
      : 0;

    if (rate > 0.15) {
      this._ensureGap({
        topic: '心虫置信度校准优化',
        question: `置信度偏低率 ${(rate * 100).toFixed(0)}%，如何提升低置信区域的判断准确度？`,
        source: 'ContinuousLearner 自动检测',
        priority: 7,
        suggestedQuery: 'LLM confidence calibration uncertainty estimation 2026',
        suggestedSource: 'arxiv',
      });
    }
  }

  /**
   * 从外部来源注册新缺口
   */
  registerGap({ topic, question, source, priority = 5, suggestedQuery, suggestedSource = 'arxiv' }) {
    this.load();
    if (!topic || !question) return { success: false, error: 'topic和question必填' };

    return this._ensureGap({ topic, question, source, priority, suggestedQuery, suggestedSource });
  }

  _ensureGap(entry) {
    const existing = this._gaps.find(g =>
      g.topic === entry.topic || g.topic.includes(entry.topic) || entry.topic.includes(g.topic)
    );

    if (existing) {
      // 更新优先级和来源
      existing.priority = Math.max(existing.priority || 0, entry.priority);
      existing.lastSeen = Date.now();
      if (entry.suggestedQuery && !existing.suggestedQuery) existing.suggestedQuery = entry.suggestedQuery;
      if (entry.source && !existing.source.includes(entry.source)) existing.source += '; ' + entry.source;
      this._save();
      return { success: true, action: 'updated', id: existing.id };
    }

    const gap = {
      id: `gap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topic: entry.topic,
      question: entry.question,
      source: entry.source || '',
      priority: entry.priority || 5,
      suggestedQuery: entry.suggestedQuery || null,
      suggestedSource: entry.suggestedSource || 'arxiv',
      status: 'pending',        // pending | exploring | explored | absorbed
      createdAt: Date.now(),
      lastSeen: Date.now(),
      lastExploredAt: null,
      explorationResult: null,
    };

    this._gaps.push(gap);
    this._stats.totalGapsIdentified++;

    // 容量保护
    if (this._gaps.length > this._config.maxGaps) {
      this._gaps.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      this._gaps = this._gaps.slice(0, this._config.maxGaps);
    }

    this._save();
    return { success: true, action: 'added', id: gap.id };
  }

  // ─── 探索调度 ──────────────────────────────────────────────

  /**
   * 获取下一个待探索的缺口（供 agent 执行搜索）
   * @returns {Object|null} { gap, searchPlan }
   */
  nextToExplore() {
    this.load();

    const now = Date.now();
    const candidates = this._gaps
      .filter(g => {
        if (g.status === 'explored' || g.status === 'absorbed') return false;
        if (g.status === 'exploring' && g.lastExploredAt) {
          // 探索中但超时（24h）视为可重试
          if ((now - g.lastExploredAt) < 24 * 3600 * 1000) return false;
        }
        if (!g.lastExploredAt) return true;  // 从未探索
        return (now - g.lastExploredAt) > this._config.minExplorationInterval;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (candidates.length === 0) return null;

    const target = candidates[0];
    target.status = 'exploring';
    target.lastExploredAt = now;
    this._save();

    return {
      gap: {
        id: target.id,
        topic: target.topic,
        question: target.question,
        priority: target.priority,
        source: target.source,
      },
      searchPlan: {
        query: target.suggestedQuery || target.topic,
        source: target.suggestedSource || 'arxiv',
        reason: `优先级 ${target.priority}：${target.source}`,
      },
    };
  }

  /**
   * 记录探索结果并吸收
   */
  recordExploration(gapId, { success, summary, findings, sources }) {
    this.load();
    const gap = this._gaps.find(g => g.id === gapId);
    if (!gap) return { success: false, error: 'gap not found' };

    gap.status = success ? 'explored' : 'pending';  // 失败则回到待探索
    gap.explorationResult = {
      success,
      summary: (summary || '').substring(0, 2000),
      findings: Array.isArray(findings) ? findings.slice(0, 10) : [],
      sources: Array.isArray(sources) ? sources.slice(0, 5) : [],
      completedAt: Date.now(),
    };

    this._stats.totalExplorationsCompleted++;

    if (success) {
      this._stats.totalKnowledgeAbsorbed += (Array.isArray(findings) ? findings.length : 1);
    }

    this._save();
    return { success: true, status: gap.status };
  }

  // ─── 查询 ──────────────────────────────────────────────────────

  getGaps(filters = {}) {
    this.load();
    let result = [...this._gaps];

    if (filters.status) result = result.filter(g => g.status === filters.status);
    if (filters.minPriority) result = result.filter(g => (g.priority || 0) >= filters.minPriority);
    if (filters.source) result = result.filter(g =>
      (g.source || '').toLowerCase().includes(filters.source.toLowerCase())
    );

    return result.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(g => ({
      id: g.id,
      topic: g.topic,
      question: g.question,
      priority: g.priority,
      source: g.source,
      status: g.status,
      createdAt: g.createdAt,
      lastExploredAt: g.lastExploredAt,
      explorationResult: g.explorationResult ? {
        success: g.explorationResult.success,
        summary: (g.explorationResult.summary || '').substring(0, 200),
        findingsCount: (g.explorationResult.findings || []).length,
      } : null,
    }));
  }

  getStats() {
    this.load();
    const byStatus = {};
    for (const g of this._gaps) {
      byStatus[g.status] = (byStatus[g.status] || 0) + 1;
    }
    return {
      ...this._stats,
      totalGaps: this._gaps.length,
      byStatus,
      topPriority: this._gaps
        .filter(g => g.status === 'pending' || g.status === 'exploring')
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 3)
        .map(g => ({ topic: g.topic, priority: g.priority, status: g.status })),
      innateGapsLoaded: INNATE_GAPS.length,
    };
  }

  clear() {
    this._gaps = [];
    this._stats = { totalGapsIdentified: 0, totalExplorationsCompleted: 0, totalKnowledgeAbsorbed: 0 };
    this._save();
  }
}

module.exports = { KnowledgeExplorer, INNATE_GAPS };
