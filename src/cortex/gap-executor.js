/**
 * GapExecutor — 知识缺口执行桥 v1.0.0
 *
 * 把 KnowledgeExplorer 的探索队列 + SelfEvolutionV2 的 arXiv 搜索能力接起来。
 * 补的是心虫学习流水线最后缺失的执行环节。
 *
 * 流水线完整闭环：
 *   ContinuousLearner (检测缺口)
 *     → KnowledgeExplorer (管理队列)
 *       → GapExecutor (执行搜索)       ← 本轮新增
 *         → KnowledgeExplorer (记录成果)
 *           → WorldTree/LessonBank (吸收)
 *
 * @version 1.0.0
 */
const https = require('https');
const http = require('http');

// 轻量 arXiv 搜索（独立于 SelfEvolutionV2，避免大文件依赖）
async function searchArxiv(query, maxResults = 5) {
  if (!query || query.length < 3) return { success: false, error: 'query too short' };

  const encoded = encodeURIComponent(`(cat:cs.AI OR cat:cs.CL OR cat:cs.LG OR cat:cs.NE) AND all:${query}`);
  const url = `https://export.arxiv.org/api/query?search_query=${encoded}&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

  try {
    const body = await _fetchWithTimeout(url, 15000);
    const entries = [...body.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    const results = [];

    for (const m of entries) {
      const block = m[1];
      const title = ((block.match(/<title>([^<]+)<\/title>/) || [])[1] || '').trim();
      const summary = ((block.match(/<summary>([^<]+)<\/summary>/) || [])[1] || '').trim();
      const link = ((block.match(/<id>([^<]+)<\/id>/) || [])[1] || '').trim();
      if (title) {
        results.push({ title, summary: summary.substring(0, 500), link });
      }
    }

    return { success: true, results, count: results.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function _fetchWithTimeout(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect once
        return _fetchWithTimeout(res.headers.location, timeoutMs).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk.toString());
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

class GapExecutor {

  constructor(opts = {}) {
    this._config = {
      maxResultsPerQuery: opts.maxResultsPerQuery || 5,
      minSummaryLength: opts.minSummaryLength || 100,
    };
    // 可注入自定义搜索函数（用于测试）
    this._searchFn = opts.searchFn || searchArxiv;
    this._stats = {
      totalExecutions: 0,
      totalResults: 0,
      failedQueries: 0,
    };
  }

  /**
   * 执行一个知识缺口探索
   * @param {Object} gap - 来自 KnowledgeExplorer.nextToExplore().gap
   * @param {Object} explorer - KnowledgeExplorer 实例（用于记录结果）
   * @returns {Object} { executed, searchResult, gapId }
   */
  async execute(gap, explorer) {
    if (!gap || !gap.id) return { executed: false, error: 'no gap provided' };

    this._stats.totalExecutions++;
    const query = gap.suggestedQuery || gap.topic;

    let searchResult;
    if (query.length < 3) {
      searchResult = { success: false, error: 'query too short' };
    } else {
      searchResult = await this._searchFn(query, this._config.maxResultsPerQuery);
    }

    const findings = [];
    const sources = [];
    let summary = '';

    if (searchResult.success && searchResult.results) {
      this._stats.totalResults += searchResult.count;

      for (const r of searchResult.results) {
        findings.push(r.title);
        if (r.link) sources.push(r.link);
        if (!summary && r.summary.length > this._config.minSummaryLength) {
          summary = r.summary;
        }
      }

      if (!summary && searchResult.results.length > 0) {
        summary = searchResult.results.map(r => r.title).join('; ');
      }
    } else {
      this._stats.failedQueries++;
      summary = searchResult.error || '搜索失败';
    }

    // 记录到 explorer
    let recordResult = null;
    if (explorer && typeof explorer.recordExploration === 'function') {
      recordResult = explorer.recordExploration(gap.id, {
        success: searchResult.success && searchResult.count > 0,
        summary,
        findings: findings.slice(0, 10),
        sources: sources.slice(0, 5),
      });
    }

    return {
      executed: true,
      gapId: gap.id,
      gapTopic: gap.topic,
      query,
      searchResult: {
        success: searchResult.success,
        count: searchResult.count || 0,
        topFindings: findings.slice(0, 3),
        summary: summary.substring(0, 300),
      },
      recorded: recordResult?.success || false,
      stats: { ...this._stats },
    };
  }

  /**
   * 批量执行待探索队列中的顶部N个缺口
   */
  async executeBatch(explorer, count = 1) {
    if (!explorer || typeof explorer.nextToExplore !== 'function') {
      return { executed: false, error: 'explorer required' };
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      const next = explorer.nextToExplore();
      if (!next) break;
      const r = await this.execute(next.gap, explorer);
      results.push(r);
    }

    return {
      executed: results.length > 0,
      batchSize: results.length,
      results,
      stats: { ...this._stats },
    };
  }

  getStats() {
    return { ...this._stats };
  }
}

module.exports = { GapExecutor, searchArxiv };
