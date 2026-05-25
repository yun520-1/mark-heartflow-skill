/**
 * OpenAlex 学术论文客户端 - 验证学术声明
 * api.openalex.org 完全免费，无限速
 */
const https = require('https');

const openalexClient = {
  // HTTP GET 封装
  _get(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON解析失败: ${data.slice(0, 100)}`)); }
        });
      }).on('error', reject);
    });
  },

  // 搜索论文
  async searchPaper(query, perPage = 5) {
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${perPage}&select=title,publication_year,cited_by_count,doi,authorships`;
      const result = await this._get(url);
      return {
        ok: true,
        works: (result.results || []).map(w => ({
          title: w.title,
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          authors: (w.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean)
        })),
        total: result.meta?.count || 0
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // 验证引用（通过DOI）
  async verifyCitation(doi, claim) {
    try {
      const url = `https://api.openalex.org/works/https://doi.org/${doi}`;
      const result = await this._get(url);
      return {
        ok: true,
        verified: true,
        title: result.title,
        citations: result.cited_by_count,
        year: result.publication_year
      };
    } catch (e) {
      return { ok: false, verified: false, error: e.message };
    }
  },

  // 按标题搜索验证
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
  }
};

module.exports = { openalexClient };
