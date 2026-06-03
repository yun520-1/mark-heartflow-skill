/**
 * OpenAlex 学术论文客户端 - 验证学术声明
 * api.openalex.org 完全免费，无限速
 * 修复：添加超时控制和指数退避重试
 */
const https = require('https');

const openalexClient = {
  // 超时配置（毫秒）
  TIMEOUT: 30000,  // 30秒超时
  MAX_RETRIES: 3,   // 最多重试3次
  BASE_DELAY: 1000,  // 基础延迟1秒
  
  /**
   * HTTP GET 封装 - 带超时和重试
   * @param {string} url - 请求URL
   * @param {number} retryCount - 当前重试次数（内部使用）
   * @returns {Promise<object>} - 解析后的JSON响应
   */
  _get(url, retryCount = 0) {
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
        // 检查状态码
        if (res.statusCode === 429 || res.statusCode >= 500) {
          clearTimeout(timeoutId);
          req.destroy();
          
          // 需要重试
          if (retryCount < this.MAX_RETRIES) {
            const delay = this.BASE_DELAY * Math.pow(2, retryCount); // 指数退避
            console.warn(`[OpenAlex] 状态码 ${res.statusCode}, ${retryCount + 1}/${this.MAX_RETRIES} 次重试 (延迟 ${delay}ms)`);
            
            setTimeout(() => {
              this._get(url, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, delay);
            return;
          } else {
            reject(new Error(`达到最大重试次数 (${this.MAX_RETRIES}), 最后状态码: ${res.statusCode}`));
            return;
          }
        }
        
        if (res.statusCode !== 200) {
          clearTimeout(timeoutId);
          req.destroy();
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timeoutId);
          try { 
            resolve(JSON.parse(data)); 
          } catch (e) { 
            reject(new Error(`JSON解析失败: ${data.slice(0, 100)}`)); 
          }
        });
      });
      
      req.on('error', (err) => {
        clearTimeout(timeoutId);
        
        // 网络错误重试
        if (retryCount < this.MAX_RETRIES && 
            (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND')) {
          const delay = this.BASE_DELAY * Math.pow(2, retryCount);
          console.warn(`[OpenAlex] 网络错误 ${err.code}, ${retryCount + 1}/${this.MAX_RETRIES} 次重试 (延迟 ${delay}ms)`);
          
          setTimeout(() => {
            this._get(url, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          reject(err);
        }
      });
    });
  },

  // 搜索论文
  async searchPaper(query, perPage = 5) {
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${perPage}&select=title,publication_year,cited_by_count,doi,authorships,concepts`;
      const result = await this._get(url);
      return {
        ok: true,
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
