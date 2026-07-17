/**
 * PaperAutoRefresh — 论文索引自动刷新引擎
 *
 * 功能：
 *   1. 从现有论文索引提取搜索词（categories + tags）
 *   2. 通过 OpenAlex API 搜索新论文
 *   3. 评估与 HeartFlow 的相关性
 *   4. 自动添加高分论文到 paper-index
 *   5. 追踪刷新历史和统计
 *
 * 用法：
 *   const refresher = new PaperAutoRefresh(paperIndex, openalexClient);
 *   await refresher.refresh();
 *   const report = refresher.getReport();
 */

const { openalexClient } = require('../core/openalex-client.js');

class PaperAutoRefresh {
  constructor(paperIndex, options = {}) {
    this._paperIndex = paperIndex;
    this._config = {
      relevanceThreshold: options.relevanceThreshold ?? 0.75,
      perQueryLimit: options.perQueryLimit ?? 5,
      maxNewPerRefresh: options.maxNewPerRefresh ?? 10,
      yearWindow: options.yearWindow ?? 2, // 只关心最近N年的论文
      ...options,
    };

    this._history = [];
    this._stats = {
      totalRefreshes: 0,
      papersFound: 0,
      papersAdded: 0,
      papersSkipped: 0,
      errors: 0,
      lastRefresh: null,
    };

    this._buildQueries();
  }

  // ─── 从现有论文提取搜索词 ──────────────────────────────────────

  _buildQueries() {
    // 从 paper-index 的 categories 和 tags 构建搜索查询
    const categories = this._paperIndex.getCategories();
    const tags = this._paperIndex.getTags();

    // 每个 category 对应一个搜索 query
    this._queries = [];

    // Category-level queries（更宽泛）
    const categoryMap = {
      'cognitive-architecture': 'cognitive architecture LLM agent reasoning',
      'memory-systems': 'memory mechanisms LLM agents long-term',
      'metacognition': 'metacognition self-awareness LLM confidence calibration',
      'self-improvement': 'self-improving agents experience learning reflection',
      'multi-agent': 'multi-agent orchestration collaboration LLM',
      'theory-of-mind': 'theory of mind LLM belief desire intention',
      'philosophy-of-mind': 'consciousness identity agency AI philosophy',
      'security': 'AI agent security persistent state vulnerability',
      'reasoning': 'reasoning LLM chain-of-thought verification',
    };

    for (const cat of categories) {
      const query = categoryMap[cat] || cat.replace(/-/g, ' ') + ' LLM agent';
      this._queries.push({ category: cat, query, source: 'category' });
    }

    // Tag-level queries（更精准，取高频 tag）
    const tagFreq = {};
    for (const paper of this._paperIndex.getAllPapers()) {
      for (const tag of (paper.tags || [])) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);

    for (const tag of topTags) {
      const query = tag.replace(/-/g, ' ') + ' LLM agent 2025 2026';
      this._queries.push({ tag, query, source: 'tag' });
    }

    // Deduplicate queries
    const seen = new Set();
    this._queries = this._queries.filter(q => {
      if (seen.has(q.query)) return false;
      seen.add(q.query);
      return true;
    });
  }

  // ─── 主刷新流程 ────────────────────────────────────────────────

  async refresh() {
    const startTime = Date.now();
    const found = [];
    const added = [];
    const skipped = [];
    const errors = [];

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - this._config.yearWindow;
    const existingIds = new Set(this._paperIndex.getAllPapers().map(p => p.id));

    // 并行搜索所有查询词（限制并发）
    const batchSize = 4;
    for (let i = 0; i < this._queries.length; i += batchSize) {
      const batch = this._queries.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(q => this._searchQuery(q))
      );

      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        if (r.status === 'rejected') {
          errors.push({ query: batch[j].query, error: r.reason?.message || 'Unknown error' });
          continue;
        }
        const papers = r.value || [];
        found.push(...papers);

        // 评估并添加新论文
        for (const paper of papers) {
          if (existingIds.has(paper.id)) {
            skipped.push(paper.id);
            continue;
          }
          if (paper.year < minYear) {
            skipped.push({ id: paper.id, reason: 'too_old', year: paper.year });
            continue;
          }
          if (paper.relevanceToHeartFlow < this._config.relevanceThreshold) {
            skipped.push({ id: paper.id, reason: 'low_relevance', score: paper.relevanceToHeartFlow });
            continue;
          }

          // 添加论文
          try {
            const ok = this._paperIndex.addPaper(paper);
            if (ok) {
              added.push(paper.id);
              existingIds.add(paper.id);
            } else {
              skipped.push(paper.id);
            }
          } catch (e) {
            errors.push({ id: paper.id, error: e.message });
          }

          // 达到上限则停止
          if (added.length >= this._config.maxNewPerRefresh) break;
        }
        if (added.length >= this._config.maxNewPerRefresh) break;
      }
    }

    const elapsed = Date.now() - startTime;

    // 更新统计
    this._stats.totalRefreshes++;
    this._stats.papersFound += found.length;
    this._stats.papersAdded += added.length;
    this._stats.papersSkipped += skipped.length;
    this._stats.errors += errors.length;
    this._stats.lastRefresh = new Date().toISOString();

    const entry = {
      timestamp: this._stats.lastRefresh,
      elapsed,
      queries: this._queries.length,
      found: found.length,
      added: added.length,
      skipped: skipped.length,
      errors: errors.length,
      addedIds: added,
      errorDetails: errors,
    };
    this._history.push(entry);
    if (this._history.length > 50) this._history.shift();

    return entry;
  }

  // ─── 搜索单个查询词 ────────────────────────────────────────────

  async _searchQuery(queryObj) {
    const result = await openalexClient.searchPaperRanked(queryObj.query, this._config.perQueryLimit, 'balanced');
    if (!result.ok) return [];

    return result.works
      .filter(w => w.year >= new Date().getFullYear() - this._config.yearWindow)
      .map(w => this._mapOpenAlexPaper(w, queryObj));
  }

  // ─── OpenAlex 结果 → paper-index 格式 ──────────────────────────

  _mapOpenAlexPaper(work, queryObj) {
    // 生成论文 ID
    const id = this._generateId(work.title);

    // 评估相关性
    const relevance = this._estimateRelevance(work, queryObj);

    // 构建 abstract（OpenAlex 不直接返回，用 title + concepts 近似）
    const abstract = `[${work.concepts?.slice(0, 3).join(', ') || 'N/A'}] ${work.title}`;

    return {
      id,
      title: work.title,
      authors: (work.authors || []).join(', ') || 'Unknown',
      venue: `arXiv/OpenAlex (${work.year})`,
      year: work.year,
      url: work.doi ? `https://doi.org/${work.doi}` : '',
      abstract,
      keyContributions: this._extractContributions(work),
      tags: [...(work.concepts || []).slice(0, 5), queryObj.tag || queryObj.category].filter(Boolean),
      relevanceToHeartFlow: relevance,
      category: queryObj.category || 'cognitive-architecture',
      dateAdded: new Date().toISOString().split('T')[0],
      _source: 'auto-refresh',
      _score: work._score || 0,
    };
  }

  _generateId(title) {
    // 从标题生成简短唯一 ID
    const words = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .split('-')
      .filter(w => w.length > 3)
      .slice(0, 4);
    const slug = words.join('-').slice(0, 40);
    const hash = Buffer.from(title).toString('base64url').slice(0, 6);
    return `auto-${slug}-${hash}`;
  }

  _estimateRelevance(work, queryObj) {
    // 基于引用数、年份、概念匹配度估算相关性
    const citations = work.citations || 0;
    const year = work.year || 2020;
    const currentYear = new Date().getFullYear();
    const recencyScore = Math.min(1, (year - 2020) / (currentYear - 2020));
    const citationScore = Math.min(1, citations / 100);

    // 概念匹配
    const hfKeywords = [
      'llm', 'agent', 'memory', 'reasoning', 'metacognition', 'self-improvement',
      'multi-agent', 'consciousness', 'embodied', 'planning', 'learning',
      'cognitive', 'reflection', 'uncertainty', 'calibration', 'world model',
      'skill', 'experience', 'knowledge', 'dialogue', 'navigation',
    ];
    const concepts = (work.concepts || []).map(c => c.toLowerCase());
    const keywordHits = hfKeywords.filter(k => concepts.some(c => c.includes(k))).length;
    const keywordScore = Math.min(1, keywordHits / 5);

    return +(0.3 * recencyScore + 0.3 * citationScore + 0.4 * keywordScore).toFixed(3);
  }

  _extractContributions(work) {
    // 从概念和标题推断关键贡献
    const concepts = work.concepts || [];
    const contributions = [
      `${work.type || 'Research'} on ${concepts.slice(0, 2).join(' and ')}`,
    ];
    if (work.citations > 50) {
      contributions.push(`Highly cited (${work.citations} citations)`);
    }
    if (concepts.length > 0) {
      contributions.push('Key concepts: ' + concepts.slice(0, 3).join(', '));
    }
    return contributions.length > 0 ? contributions : ['Contribution details available in full paper'];
  }

  // ─── 搜索特定主题（手动触发）────────────────────────────────────

  async searchTopic(topic, limit = 10) {
    const result = await openalexClient.searchPaperRanked(topic, limit, 'balanced');
    if (!result.ok) return { ok: false, error: result.error };

    return {
      ok: true,
      topic,
      query: topic,
      total: result.total,
      works: result.works.map(w => ({
        title: w.title,
        year: w.year,
        citations: w.citations,
        doi: w.doi,
        authors: w.authors?.slice(0, 3),
        concepts: w.concepts?.slice(0, 5),
        relevance: this._estimateRelevance(w, { category: 'manual', tag: topic }),
      })),
    };
  }

  // ─── 报告 & 统计 ───────────────────────────────────────────────

  getReport() {
    const indexStats = this._paperIndex.getStats();
    return {
      refresh: {
        totalRefreshes: this._stats.totalRefreshes,
        papersFound: this._stats.papersFound,
        papersAdded: this._stats.papersAdded,
        papersSkipped: this._stats.papersSkipped,
        errors: this._stats.errors,
        lastRefresh: this._stats.lastRefresh,
      },
      queries: this._queries.length,
      history: this._history.slice(-10), // 最近10次刷新记录
      paperIndex: indexStats,
    };
  }

  getStats() {
    return this._stats;
  }

  getHistory() {
    return [...this._history];
  }

  // ─── 配置 ──────────────────────────────────────────────────────

  getConfig() {
    return { ...this._config, queryCount: this._queries.length };
  }

  updateConfig(newConfig) {
    Object.assign(this._config, newConfig);
    if (newConfig.relevanceThreshold !== undefined || newConfig.yearWindow !== undefined) {
      this._buildQueries(); // 搜索参数变了，重建查询
    }
  }

  // ─── 自动调度 ────────────────────────────────────────────────────

  startAutoRefresh(intervalHours = 6) {
    if (this._timer) {
      return { alreadyRunning: true, intervalHours: this._intervalHours };
    }
    this._intervalHours = intervalHours;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    this._timer = setInterval(async () => {
      try {
        await this.refresh();
      } catch (e) {
        console.error(`[PaperRefresh] 自动刷新失败:`, e.message);
      }
    }, intervalMs);

    console.error(`[PaperRefresh] 自动刷新已启动，每 ${intervalHours} 小时一次`);
    return { started: true, intervalHours, nextRefreshIn: intervalMs };
  }

  stopAutoRefresh() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      console.error(`[PaperRefresh] 自动刷新已停止`);
      return { stopped: true };
    }
    return { stopped: false, reason: 'not_running' };
  }

  getAutoRefreshStatus() {
    return {
      running: !!this._timer,
      intervalHours: this._intervalHours || null,
      lastRefresh: this._stats.lastRefresh,
      totalRefreshes: this._stats.totalRefreshes,
    };
  }

  // ─── 批量操作 ───────────────────────────────────────────────────

  async bulkAddPapers(papers) {
    if (!Array.isArray(papers)) return { added: 0, skipped: 0, errors: 1, error: 'papers must be an array' };

    const added = [], skipped = [], errors = [];
    const existingIds = new Set(this._paperIndex.getAllPapers().map(p => p.id));
    const minRelevance = this._config.relevanceThreshold;

    for (const paper of papers) {
      try {
        if (!paper || !paper.id || !paper.title) {
          skipped.push({ id: paper?.id, reason: 'missing_fields' });
          continue;
        }
        if (existingIds.has(paper.id)) {
          skipped.push({ id: paper.id, reason: 'duplicate' });
          continue;
        }
        if ((paper.relevanceToHeartFlow || 0) < minRelevance) {
          skipped.push({ id: paper.id, reason: 'low_relevance', score: paper.relevanceToHeartFlow });
          continue;
        }

        // 补齐默认字段
        const entry = {
          id: paper.id,
          title: paper.title,
          authors: paper.authors || 'Unknown',
          venue: paper.venue || '',
          year: paper.year || new Date().getFullYear(),
          url: paper.url || '',
          abstract: paper.abstract || '',
          keyContributions: paper.keyContributions || [],
          tags: paper.tags || [],
          relevanceToHeartFlow: paper.relevanceToHeartFlow || 0.5,
          category: paper.category || 'cognitive-architecture',
          dateAdded: paper.dateAdded || new Date().toISOString().split('T')[0],
          _source: paper._source || 'bulk-import',
        };

        const ok = this._paperIndex.addPaper(entry);
        if (ok) {
          added.push(entry.id);
          existingIds.add(entry.id);
        } else {
          skipped.push({ id: entry.id, reason: 'addPaper_failed' });
        }
      } catch (e) {
        errors.push({ id: paper.id, error: e.message });
      }
    }

    return { added, skipped, errors, totalProcessed: papers.length };
  }

  exportPapers(format = 'json') {
    const papers = this._paperIndex.getAllPapers();
    if (format === 'json') {
      return JSON.stringify({
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        count: papers.length,
        papers,
      }, null, 2);
    }
    if (format === 'ids') {
      return papers.map(p => p.id).join('\n');
    }
    throw new Error('Unsupported format: ' + format);
  }

  async importPapers(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const papers = Array.isArray(data) ? data : (data.papers || []);
      return await this.bulkAddPapers(papers);
    } catch (e) {
      return { added: 0, skipped: 0, errors: 1, error: 'JSON parse failed: ' + e.message };
    }
  }

  // ─── 智能补全 ────────────────────────────────────────────────────

  async enrichPapers(paperIds) {
    const allPapers = this._paperIndex.getAllPapers();
    const targets = paperIds
      ? allPapers.filter(p => paperIds.includes(p.id))
      : allPapers.filter(p => !p.abstract || p.abstract.startsWith('['));

    const enriched = [];
    for (const paper of targets.slice(0, 10)) {
      // 用标题搜索 OpenAlex 获取更完整信息
      const result = await openalexClient.searchPaperRanked(paper.title, 1, 'balanced');
      if (result.ok && result.works.length > 0) {
        const work = result.works[0];
        if (work.doi && !paper.url) paper.url = 'https://doi.org/' + work.doi;
        if (work.concepts?.length && (!paper.tags || paper.tags.length === 0)) {
          paper.tags = work.concepts.slice(0, 5);
        }
        enriched.push(paper.id);
      }
    }

    if (enriched.length > 0) {
      this._paperIndex._save();
    }

    return { enriched: enriched.length, ids: enriched };
  }
}

module.exports = { PaperAutoRefresh };
