/**
 * OpenAlex 学术论文客户端 - 验证学术声明
 * api.openalex.org 完全免费，无限速
 * v2.0.57 - 新增：LRU缓存、作者搜索、概念过滤、结果评分排序、批量验证、引用网络、分页、统计追踪
 */
const https = require('https');

// 简单的 LRU 缓存实现
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this._map = new Map();
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  get(key) {
    if (!this._map.has(key)) {
      this._stats.misses++;
      return undefined;
    }
    // 移到末尾（最近使用）
    const value = this._map.get(key);
    this._map.delete(key);
    this._map.set(key, value);
    this._stats.hits++;
    return value;
  }

  set(key, value) {
    if (this._map.has(key)) {
      this._map.delete(key);
    } else if (this._map.size >= this.maxSize) {
      // 删除最久未使用的（Map 的第一个键）
      const oldestKey = this._map.keys().next().value;
      this._map.delete(oldestKey);
      this._stats.evictions++;
    }
    this._map.set(key, value);
  }

  has(key) {
    return this._map.has(key);
  }

  clear() {
    this._map.clear();
  }

  getStats() {
    const total = this._stats.hits + this._stats.misses;
    return {
      ...this._stats,
      size: this._map.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? (this._stats.hits / total * 100).toFixed(1) + '%' : '0%'
    };
  }
}

const openalexClient = {
  // 超时配置（毫秒）
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,

  // 缓存实例
  _cache: new LRUCache(80),

  // 使用统计
  _stats: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedResponses: 0,
    startTime: Date.now()
  },

  /**
   * 生成缓存键
   */
  _cacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  },

  /**
   * HTTP GET 封装 - 带超时和重试
   */
  _get(url, retryCount = 0) {
    this._stats.totalRequests++;
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        req.destroy();
        reject(new Error(`请求超时 (${this.TIMEOUT}ms): ${url}`));
      }, this.TIMEOUT);
      
      const req = https.get(url, { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'HeartFlow/1.0'
        } 
      }, (res) => {
        if (res.statusCode === 429 || res.statusCode >= 500) {
          clearTimeout(timeoutId);
          req.destroy();
          
          if (retryCount < this.MAX_RETRIES) {
            const delay = this.BASE_DELAY * Math.pow(2, retryCount);
            // 已禁用 console.warn: console.warn(`[OpenAlex] 状态码 ${res.statusCode}, ${retryCount + 1}/${this.MAX_RETRIES} 次重试 (延迟 ${delay}ms)`);
            
            setTimeout(() => {
              this._get(url, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, delay);
            return;
          } else {
            this._stats.failedRequests++;
            reject(new Error(`达到最大重试次数 (${this.MAX_RETRIES}), 最后状态码: ${res.statusCode}`));
            return;
          }
        }
        
        if (res.statusCode !== 200) {
          clearTimeout(timeoutId);
          req.destroy();
          this._stats.failedRequests++;
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timeoutId);
          try { 
            this._stats.successfulRequests++;
            resolve(JSON.parse(data)); 
          } catch (e) { 
            this._stats.failedRequests++;
            reject(new Error(`JSON解析失败: ${data.slice(0, 100)}`)); 
          }
        });
      });
      
      req.on('error', (err) => {
        clearTimeout(timeoutId);
        
        if (retryCount < this.MAX_RETRIES && 
            (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND')) {
          const delay = this.BASE_DELAY * Math.pow(2, retryCount);
          // 已禁用 console.warn: console.warn(`[OpenAlex] 网络错误 ${err.code}, ${retryCount + 1}/${this.MAX_RETRIES} 次重试 (延迟 ${delay}ms)`);
          
          setTimeout(() => {
            this._get(url, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          this._stats.failedRequests++;
          reject(err);
        }
      });
    });
  },

  /**
   * 带缓存的 GET 请求
   */
  async _getCached(url, cacheKey) {
    // 检查缓存
    const cached = this._cache.get(cacheKey);
    if (cached) {
      this._stats.cachedResponses++;
      return cached;
    }

    // 实际请求
    const result = await this._get(url);
    this._cache.set(cacheKey, result);
    return result;
  },

  /**
   * 搜索论文 - 带缓存和分页
   */
  async searchPaper(query, perPage = 5, page = 1) {
    const cacheKey = this._cacheKey('searchPaper', { query, perPage, page });
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&select=title,publication_year,cited_by_count,doi,authorships,concepts,type,language`;
      const result = await this._getCached(url, cacheKey);
      return {
        ok: true,
        works: (result.results || []).map(w => ({
          title: w.title,
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          type: w.type || 'article',
          language: w.language || 'en',
          authors: (w.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean),
          concepts: (w.concepts || []).slice(0, 5).map(c => c.display_name)
        })),
        total: result.meta?.count || 0,
        page: page,
        perPage: perPage
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 搜索论文并排序 - 按引用数/年份/综合评分排序
   */
  async searchPaperRanked(query, perPage = 10, sortBy = 'relevance') {
    try {
      const result = await this.searchPaper(query, perPage);
      if (!result.ok) return result;

      const sortFunctions = {
        citations: (a, b) => (b.citations || 0) - (a.citations || 0),
        year: (a, b) => (b.year || 0) - (a.year || 0),
        relevance: () => 0, // OpenAlex 已按相关性排序
        balanced: (a, b) => {
          // 综合评分：引用数(0-50) + 年份新鲜度(0-50)
          const maxCitations = Math.max(...result.works.map(w => w.citations || 0), 1);
          const currentYear = new Date().getFullYear();
          const scoreA = ((a.citations || 0) / maxCitations) * 50 +
            Math.min(50, ((a.year || currentYear) - 1900) / (currentYear - 1900) * 50);
          const scoreB = ((b.citations || 0) / maxCitations) * 50 +
            Math.min(50, ((b.year || currentYear) - 1900) / (currentYear - 1900) * 50);
          return scoreB - scoreA;
        }
      };

      const sortFn = sortFunctions[sortBy] || sortFunctions.relevance;
      if (sortBy !== 'relevance') {
        result.works.sort(sortFn);
      }

      // 添加评分信息
      if (sortBy === 'balanced') {
        const maxCitations = Math.max(...result.works.map(w => w.citations || 0), 1);
        const currentYear = new Date().getFullYear();
        result.works = result.works.map(w => {
          const citationScore = ((w.citations || 0) / maxCitations) * 50;
          const recencyScore = Math.min(50, ((w.year || currentYear) - 1900) / (currentYear - 1900) * 50);
          return { ...w, _score: Math.round((citationScore + recencyScore) * 100) / 100 };
        });
      }

      result.sortedBy = sortBy;
      return result;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 验证引用（通过DOI）
   */
  async verifyCitation(doi, claim) {
    const cacheKey = this._cacheKey('verifyCitation', { doi });
    try {
      const url = `https://api.openalex.org/works/https://doi.org/${doi}`;
      const result = await this._getCached(url, cacheKey);
      return {
        ok: true,
        verified: true,
        title: result.title,
        citations: result.cited_by_count,
        year: result.publication_year,
        type: result.type || 'article',
        language: result.language || 'en',
        authors: (result.authorships || []).slice(0, 5).map(a => a.author?.display_name).filter(Boolean),
        concepts: (result.concepts || []).slice(0, 5).map(c => c.display_name),
        abstract: result.abstract_inverted_index ? '有摘要' : '无摘要'
      };
    } catch (e) {
      return { ok: false, verified: false, error: e.message };
    }
  },

  /**
   * 批量验证引用
   */
  async batchVerifyCitations(dois) {
    if (!Array.isArray(dois) || dois.length === 0) {
      return { ok: false, error: '请提供DOI数组' };
    }

    const results = [];
    const errors = [];

    for (const doi of dois) {
      try {
        const result = await this.verifyCitation(doi);
        results.push({ doi, ...result });
      } catch (e) {
        errors.push({ doi, error: e.message });
      }
    }

    return {
      ok: results.length > 0,
      total: dois.length,
      verified: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * 按标题搜索验证
   */
  async verifyByTitle(title) {
    const result = await this.searchPaper(title, 3);
    if (!result.ok || result.works.length === 0) {
      return { ok: false, verified: false, error: '未找到相关论文' };
    }
    const best = result.works[0];
    return {
      ok: true,
      verified: best.title.toLowerCase().includes(title.toLowerCase().slice(0, 30)),
      ...best
    };
  },

  /**
   * 按作者搜索论文
   */
  async searchByAuthor(authorName, perPage = 10, page = 1) {
    const cacheKey = this._cacheKey('searchByAuthor', { authorName, perPage, page });
    try {
      // 先搜索作者
      const authorUrl = `https://api.openalex.org/authors?search=${encodeURIComponent(authorName)}&per_page=5&select=id,display_name,works_count,cited_by_count`;
      const authorResult = await this._getCached(authorUrl, `author:${authorName}:5`);

      if (!authorResult.results || authorResult.results.length === 0) {
        return { ok: false, error: '未找到该作者' };
      }

      const authors = authorResult.results.map(a => ({
        id: a.id,
        name: a.display_name,
        worksCount: a.works_count,
        citations: a.cited_by_count
      }));

      // 用第一个作者的ID搜索其论文
      const authorId = authors[0].id;
      const worksUrl = `https://api.openalex.org/works?filter=authorships.author.id:${encodeURIComponent(authorId)}&per_page=${perPage}&page=${page}&sort=cited_by_count:desc&select=title,publication_year,cited_by_count,doi,concepts`;
      const worksResult = await this._getCached(worksUrl, `authorWorks:${authorId}:${perPage}:${page}`);

      return {
        ok: true,
        authors,
        works: (worksResult.results || []).map(w => ({
          title: w.title,
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          concepts: (w.concepts || []).slice(0, 5).map(c => c.display_name)
        })),
        total: worksResult.meta?.count || 0
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 按概念/主题过滤论文
   */
  async searchByConcept(query, concept, perPage = 10) {
    const cacheKey = this._cacheKey('searchByConcept', { query, concept, perPage });
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=concepts.display_name.search:${encodeURIComponent(concept)}&per_page=${perPage}&select=title,publication_year,cited_by_count,doi,authorships,concepts`;
      const result = await this._getCached(url, cacheKey);
      return {
        ok: true,
        concept,
        works: (result.results || []).map(w => ({
          title: w.title,
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          authors: (w.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean),
          concepts: (w.concepts || []).slice(0, 5).map(c => c.display_name)
        })),
        total: result.meta?.count || 0
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 获取论文的引用网络（引用此论文的作品）
   */
  async getCitingWorks(doi, perPage = 10) {
    const cacheKey = this._cacheKey('getCitingWorks', { doi, perPage });
    try {
      const url = `https://api.openalex.org/works?filter=citations:${encodeURIComponent(doi)}&per_page=${perPage}&sort=cited_by_count:desc&select=title,publication_year,cited_by_count,doi,concepts`;
      const result = await this._getCached(url, cacheKey);
      return {
        ok: true,
        doi,
        totalCited: result.meta?.count || 0,
        works: (result.results || []).map(w => ({
          title: w.title,
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          concepts: (w.concepts || []).slice(0, 5).map(c => c.display_name)
        }))
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 获取论文的参考文献（此论文引用的作品）
   */
  async getReferencedWorks(doi, perPage = 10) {
    const cacheKey = this._cacheKey('getReferencedWorks', { doi, perPage });
    try {
      // 先获取论文详情（含 referenced_works）
      const workUrl = `https://api.openalex.org/works/https://doi.org/${doi}?select=id,title,referenced_works,cited_by_count`;
      const workResult = await this._getCached(workUrl, `workRefs:${doi}`);
      
      const refs = workResult.referenced_works || [];
      const totalRefs = refs.length;
      const refsToFetch = refs.slice(0, perPage);

      // 批量获取引用详情（并行）
      const refDetails = await Promise.allSettled(
        refsToFetch.map(refId => {
          const refUrl = `https://api.openalex.org/works/${encodeURIComponent(refId)}?select=title,publication_year,cited_by_count,doi`;
          return this._getCached(refUrl, `refDetail:${refId}`);
        })
      );

      return {
        ok: true,
        doi,
        title: workResult.title,
        totalReferences: totalRefs,
        works: refDetails
          .filter(r => r.status === 'fulfilled')
          .map(r => ({
            title: r.value.title,
            year: r.value.publication_year,
            citations: r.value.cited_by_count,
            doi: r.value.doi
          }))
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 搜索研究机构
   */
  async searchInstitution(institutionName) {
    const cacheKey = this._cacheKey('searchInstitution', { institutionName });
    try {
      const url = `https://api.openalex.org/institutions?search=${encodeURIComponent(institutionName)}&per_page=5&select=id,display_name,type,country_code,works_count,cited_by_count,homepage_url`;
      const result = await this._getCached(url, cacheKey);
      return {
        ok: true,
        institutions: (result.results || []).map(inst => ({
          name: inst.display_name,
          type: inst.type || 'unknown',
          country: inst.country_code || 'unknown',
          worksCount: inst.works_count,
          citations: inst.cited_by_count,
          homepage: inst.homepage_url
        }))
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 获取顶级概念列表
   */
  async getTopConcepts() {
    const cacheKey = this._cacheKey('getTopConcepts', {});
    try {
      const url = 'https://api.openalex.org/concepts?filter=level:0&per_page=20&sort=works_count:desc&select=display_name,works_count,cited_by_count,level,description';
      const result = await this._getCached(url, cacheKey);
      return {
        ok: true,
        concepts: (result.results || []).map(c => ({
          name: c.display_name,
          worksCount: c.works_count,
          citations: c.cited_by_count,
          level: c.level,
          description: c.description
        }))
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * 获取使用统计
   */
  getStats() {
    const uptime = Date.now() - this._stats.startTime;
    return {
      requests: {
        total: this._stats.totalRequests,
        successful: this._stats.successfulRequests,
        failed: this._stats.failedRequests,
        successRate: this._stats.totalRequests > 0
          ? (this._stats.successfulRequests / this._stats.totalRequests * 100).toFixed(1) + '%'
          : '0%'
      },
      cache: this._cache.getStats(),
      cachedResponses: this._stats.cachedResponses,
      uptimeMs: uptime,
      uptimeFormatted: this._formatDuration(uptime)
    };
  },

  /**
   * 清空缓存
   */
  clearCache() {
    this._cache.clear();
    return { ok: true, cleared: true };
  },

  /**
   * 格式化时长
   */
  _formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
};

module.exports = { openalexClient, LRUCache };
