/**
 * HeartFlow BM25 搜索引擎
 * 
 * 吸收来源：agentmemory BM25 算法
 * 
 * 核心能力：
 * 1. BM25 排名算法（k1=1.2, b=0.75）
 * 2. IDF 计算：log((N - df + 0.5) / (df + 0.5) + 1)
 * 3. 倒排索引（Inverted Index）
 * 4. 同义词扩展（Synonym Expansion）
 * 5. 前缀匹配（Prefix Matching）
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// ─── BM25 配置常量 ───────────────────────────────────────────────────────────

const BM25_CONFIG = {
  k1: 1.2,        // BM25 词频饱和参数
  b: 0.75,        // 文档长度归一化参数
  avgDocLength: 0, // 平均文档长度（动态计算）
};

// ─── 同义词词典（可扩展）────────────────────────────────────────────────────

const SYNONYMS = {
  'ai': ['artificial intelligence', 'machine learning', 'ml'],
  'nlp': ['natural language processing', 'text analysis'],
  'search': ['find', 'query', 'retrieve', 'lookup'],
  'memory': ['storage', 'store', 'recall', 'remember'],
  'agent': ['bot', 'agent', 'assistant', 'client'],
  'node': ['javascript', 'js'],
  'web': ['internet', 'http', 'www'],
  'data': ['information', 'datum', 'records'],
  'fast': ['quick', 'rapid', 'speedy'],
  'slow': ['laggy', 'delayed', '迟'],
};

// ─── 工具函数 ───────────────────────────────────────────────────────────────

/**
 * 简单的分词器（支持中英文）
 * @param {string} text 
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  
  // 中英文混合分词
  const tokens = [];
  
  // 英文按空格和标点分词，转小写
  const englishPattern = /[a-zA-Z]+/g;
  let match;
  while ((match = englishPattern.exec(text)) !== null) {
    tokens.push(match[0].toLowerCase());
  }
  
  // 中文按字符分词（简单处理）
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  tokens.push(...chineseChars);
  
  return tokens;
}

/**
 * 计算 IDF（逆文档频率）
 * @param {number} N 文档总数
 * @param {number} df 包含词的文档数
 * @returns {number}
 */
function calculateIDF(N, df) {
  // IDF = log((N - df + 0.5) / (df + 0.5) + 1)
  return Math.log((N - df + 0.5) / (df + 0.5) + 1);
}

/**
 * 前缀匹配
 * @param {string} prefix 
 * @param {string} word 
 * @returns {boolean}
 */
function prefixMatch(prefix, word) {
  if (!prefix || !word) return false;
  prefix = prefix.toLowerCase();
  word = word.toLowerCase();
  return word.startsWith(prefix);
}

// ─── BM25 搜索引擎类 ────────────────────────────────────────────────────────

class BM25Engine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.k1 = options.k1 || BM25_CONFIG.k1;
    this.b = options.b || BM25_CONFIG.b;
    
    // 文档存储：{ id: { text, tokens, metadata } }
    this.documents = new Map();
    
    // 倒排索引：{ token: { docId: { tf, positions } } }
    this.invertedIndex = new Map();
    
    // 文档频率：{ token: docCount }
    this.docFrequency = new Map();
    
    // IDF 缓存：{ token: idf }
    this.idfCache = new Map();
    
    // 同义词映射：{ token: Set<synonym> }
    this.synonymMap = new Map();
    
    // 平均文档长度
    this.avgDocLength = 0;
    
    // 文档总数
    this.N = 0;
    
    // 数据目录
    this.dataDir = options.dataDir || path.join(__dirname, '../../../data/search');
    this.indexPath = path.join(this.dataDir, 'bm25-index.json');
    
    // 加载同义词
    this._loadSynonyms(options.synonyms);
    
    // 自动保存
    this.autoSave = options.autoSave !== false;
    this.dirty = false;
    this._saveTimer = null;
  }

  /**
   * 加载同义词词典
   * @param {Object} synonyms 
   */
  _loadSynonyms(synonyms) {
    if (synonyms) {
      for (const [word, syns] of Object.entries(synonyms)) {
        this.addSynonym(word, syns);
      }
    } else {
      // 使用默认同义词
      for (const [word, syns] of Object.entries(SYNONYMS)) {
        this.addSynonym(word, syns);
      }
    }
  }

  /**
   * 添加同义词
   * @param {string} word 
   * @param {string[]} synonyms 
   */
  addSynonym(word, synonyms) {
    if (!this.synonymMap.has(word)) {
      this.synonymMap.set(word, new Set());
    }
    const synSet = this.synonymMap.get(word);
    if (Array.isArray(synonyms)) {
      synonyms.forEach(s => synSet.add(s.toLowerCase()));
    } else {
      synSet.add(synonyms.toLowerCase());
    }
  }

  /**
   * 获取词的所有同义词（包括原词）
   * @param {string} word 
   * @returns {string[]}
   */
  getSynonyms(word) {
    const result = new Set([word.toLowerCase()]);
    
    // 添加直接同义词
    if (this.synonymMap.has(word.toLowerCase())) {
      this.synonymMap.get(word.toLowerCase()).forEach(s => result.add(s));
    }
    
    // 反向查询：哪些词以此词为同义词
    for (const [key, syns] of this.synonymMap) {
      if (syns.has(word.toLowerCase())) {
        result.add(key);
      }
    }
    
    return Array.from(result);
  }

  /**
   * 添加文档
   * @param {string} id 
   * @param {string} text 
   * @param {Object} metadata 
   * @returns {BM25Engine}
   */
  addDocument(id, text, metadata = {}) {
    if (this.documents.has(id)) {
      this.removeDocument(id);
    }
    
    const tokens = tokenize(text);
    
    // 扩展同义词
    const expandedTokens = new Set(tokens);
    for (const token of tokens) {
      const syns = this.getSynonyms(token);
      syns.forEach(s => expandedTokens.add(s));
    }
    const allTokens = Array.from(expandedTokens);
    
    // 存储文档
    this.documents.set(id, {
      id,
      text,
      tokens,
      expandedTokens: allTokens,
      metadata,
      length: tokens.length,
    });
    
    // 更新倒排索引
    for (const token of allTokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Map());
      }
      
      const posting = this.invertedIndex.get(token);
      if (!posting.has(id)) {
        posting.set(id, { tf: 0, positions: [] });
      }
      
      const entry = posting.get(id);
      entry.tf = this._countTermFrequency(token, allTokens);
      entry.positions.push(...this._findPositions(token, allTokens));
    }
    
    // 更新文档频率
    const uniqueTokens = new Set(allTokens);
    for (const token of uniqueTokens) {
      this.docFrequency.set(token, (this.docFrequency.get(token) || 0) + 1);
    }
    
    // 更新统计
    this.N = this.documents.size;
    this._updateAvgDocLength();
    this._invalidateIDFCache();
    
    this.dirty = true;
    this._scheduleSave();
    
    this.emit('documentAdded', { id, text: text.substring(0, 100) });
    return this;
  }

  /**
   * 移除文档
   * @param {string} id 
   */
  removeDocument(id) {
    if (!this.documents.has(id)) return;
    
    const doc = this.documents.get(id);
    
    // 从倒排索引移除
    for (const token of doc.expandedTokens) {
      if (this.invertedIndex.has(token)) {
        this.invertedIndex.get(token).delete(id);
        if (this.invertedIndex.get(token).size === 0) {
          this.invertedIndex.delete(token);
        }
      }
    }
    
    // 更新文档频率
    const uniqueTokens = new Set(doc.expandedTokens);
    for (const token of uniqueTokens) {
      const newDf = (this.docFrequency.get(token) || 1) - 1;
      if (newDf <= 0) {
        this.docFrequency.delete(token);
      } else {
        this.docFrequency.set(token, newDf);
      }
    }
    
    this.documents.delete(id);
    
    // 更新统计
    this.N = this.documents.size;
    this._updateAvgDocLength();
    this._invalidateIDFCache();
    
    this.dirty = true;
    this._scheduleSave();
    
    this.emit('documentRemoved', { id });
  }

  /**
   * 计算词频
   * @param {string} term 
   * @param {string[]} tokens 
   * @returns {number}
   */
  _countTermFrequency(term, tokens) {
    return tokens.filter(t => t === term).length;
  }

  /**
   * 查找词位置
   * @param {string} term 
   * @param {string[]} tokens 
   * @returns {number[]}
   */
  _findPositions(term, tokens) {
    const positions = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === term) {
        positions.push(i);
      }
    }
    return positions;
  }

  /**
   * 更新平均文档长度
   */
  _updateAvgDocLength() {
    if (this.documents.size === 0) {
      this.avgDocLength = 0;
      return;
    }
    
    let totalLength = 0;
    for (const doc of this.documents.values()) {
      totalLength += doc.length;
    }
    this.avgDocLength = totalLength / this.documents.size;
  }

  /**
   * 使 IDF 缓存失效
   */
  _invalidateIDFCache() {
    this.idfCache.clear();
  }

  /**
   * 获取 IDF 值
   * @param {string} token 
   * @returns {number}
   */
  getIDF(token) {
    if (this.idfCache.has(token)) {
      return this.idfCache.get(token);
    }
    
    const df = this.docFrequency.get(token) || 0;
    const idf = calculateIDF(this.N, df);
    this.idfCache.set(token, idf);
    return idf;
  }

  /**
   * 计算 BM25 得分
   * @param {Object} doc 
   * @param {string[]} queryTokens 
   * @returns {number}
   */
  _calculateBM25(doc, queryTokens) {
    let score = 0;
    const docLength = doc.length || 1;
    
    for (const queryTerm of queryTokens) {
      const synonyms = this.getSynonyms(queryTerm);
      let maxTf = 0;
      let maxIDF = 0;
      
      for (const term of synonyms) {
        const tf = this._countTermFrequency(term, doc.expandedTokens);
        const idf = this.getIDF(term);
        
        if (tf > 0 && idf > maxIDF) {
          maxTf = tf;
          maxIDF = idf;
        }
      }
      
      if (maxTf > 0) {
        // BM25 公式：IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl))
        const numerator = maxTf * (this.k1 + 1);
        const denominator = maxTf + this.k1 * (1 - this.b + this.b * docLength / this.avgDocLength);
        score += maxIDF * (numerator / denominator);
      }
    }
    
    return score;
  }

  /**
   * 搜索
   * @param {string} query 
   * @param {Object} options 
   * @returns {Array}
   */
  search(query, options = {}) {
    const {
      limit = 10,
      prefixEnabled = true,
      synonymEnabled = true,
      minScore = 0,
    } = options;
    
    if (!query || this.documents.size === 0) {
      return [];
    }
    
    const queryTokens = tokenize(query);
    const results = [];
    
    // 收集候选文档
    const candidateDocs = new Set();
    
    for (const token of queryTokens) {
      // 精确匹配
      if (this.invertedIndex.has(token)) {
        for (const docId of this.invertedIndex.get(token).keys()) {
          candidateDocs.add(docId);
        }
      }
      
      // 同义词匹配
      if (synonymEnabled) {
        const synonyms = this.getSynonyms(token);
        for (const syn of synonyms) {
          if (this.invertedIndex.has(syn)) {
            for (const docId of this.invertedIndex.get(syn).keys()) {
              candidateDocs.add(docId);
            }
          }
        }
      }
      
      // 前缀匹配
      if (prefixEnabled) {
        for (const [indexToken] of this.invertedIndex) {
          if (prefixMatch(token, indexToken)) {
            for (const docId of this.invertedIndex.get(indexToken).keys()) {
              candidateDocs.add(docId);
            }
          }
        }
      }
    }
    
    // 计算 BM25 得分
    for (const docId of candidateDocs) {
      const doc = this.documents.get(docId);
      if (!doc) continue;
      
      const score = this._calculateBM25(doc, queryTokens);
      
      if (score >= minScore) {
        results.push({
          id: doc.id,
          text: doc.text,
          metadata: doc.metadata,
          score,
          matchedTokens: this._getMatchedTokens(queryTokens, doc),
        });
      }
    }
    
    // 排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }

  /**
   * 获取匹配的词
   * @param {string[]} queryTokens 
   * @param {Object} doc 
   * @returns {string[]}
   */
  _getMatchedTokens(queryTokens, doc) {
    const matched = [];
    
    for (const token of queryTokens) {
      const synonyms = this.getSynonyms(token);
      
      for (const term of synonyms) {
        if (doc.expandedTokens.includes(term)) {
          matched.push(term);
          break;
        }
      }
    }
    
    return matched;
  }

  /**
   * 前缀搜索
   * @param {string} prefix 
   * @param {number} limit 
   * @returns {string[]}
   */
  prefixSearch(prefix, limit = 10) {
    const results = [];
    
    for (const token of this.invertedIndex.keys()) {
      if (prefixMatch(prefix, token)) {
        results.push(token);
      }
    }
    
    return results.slice(0, limit);
  }

  /**
   * 获取相关词建议
   * @param {string} term 
   * @param {number} limit 
   * @returns {Array}
   */
  getSuggestions(term, limit = 5) {
    if (!term) return [];
    
    const suggestions = [];
    const termLower = term.toLowerCase();
    
    // 从同义词表查找
    if (this.synonymMap.has(termLower)) {
      for (const syn of this.synonymMap.get(termLower)) {
        if (syn !== termLower && !suggestions.includes(syn)) {
          suggestions.push(syn);
        }
      }
    }
    
    // 从索引中查找相关词
    for (const [token, df] of this.docFrequency) {
      // 包含该词的任何词
      if (token.includes(termLower) && token !== termLower) {
        suggestions.push(token);
      }
    }
    
    return suggestions.slice(0, limit);
  }

  /**
   * 获取索引统计
   * @returns {Object}
   */
  getStats() {
    return {
      documentCount: this.N,
      tokenCount: this.invertedIndex.size,
      avgDocLength: this.avgDocLength.toFixed(2),
      topTokens: this._getTopTokens(10),
    };
  }

  /**
   * 获取高频词
   * @param {number} n 
   * @returns {Array}
   */
  _getTopTokens(n = 10) {
    const entries = Array.from(this.docFrequency.entries());
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, n).map(([token, df]) => ({ token, df }));
  }

  /**
   * 保存索引
   */
  save() {
    try {
      const data = {
        documents: Array.from(this.documents.entries()).map(([id, doc]) => [id, {
          ...doc,
        }]),
        invertedIndex: Array.from(this.invertedIndex.entries()).map(([token, posting]) => [
          token,
          Array.from(posting.entries()).map(([docId, data]) => [docId, data]),
        ]),
        docFrequency: Array.from(this.docFrequency.entries()),
        N: this.N,
        avgDocLength: this.avgDocLength,
        k1: this.k1,
        b: this.b,
      };
      
      // 确保目录存在
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      
      // 原子写入
      const tempPath = this.indexPath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.indexPath);
      
      this.dirty = false;
      this.emit('saved', { path: this.indexPath });
      return true;
    } catch (err) {
      this.emit('error', { operation: 'save', error: err.message });
      return false;
    }
  }

  /**
   * 加载索引
   */
  load() {
    try {
      if (!fs.existsSync(this.indexPath)) {
        return false;
      }
      
      const data = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
      
      // 恢复文档
      this.documents = new Map(data.documents);
      
      // 恢复倒排索引
      this.invertedIndex = new Map(
        data.invertedIndex.map(([token, posting]) => [
          token,
          new Map(posting),
        ])
      );
      
      // 恢复文档频率
      this.docFrequency = new Map(data.docFrequency);
      
      this.N = data.N;
      this.avgDocLength = data.avgDocLength;
      
      if (data.k1) this.k1 = data.k1;
      if (data.b) this.b = data.b;
      
      this._invalidateIDFCache();
      
      this.emit('loaded', { documentCount: this.N });
      return true;
    } catch (err) {
      this.emit('error', { operation: 'load', error: err.message });
      return false;
    }
  }

  /**
   * 调度自动保存
   */
  _scheduleSave() {
    if (!this.autoSave) return;
    
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
    }
    
    this._saveTimer = setTimeout(() => {
      if (this.dirty) {
        this.save();
      }
    }, 5000); // 5秒后保存
  }

  /**
   * 销毁
   */
  destroy() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
    }
    
    if (this.dirty) {
      this.save();
    }
    
    this.removeAllListeners();
    this.documents.clear();
    this.invertedIndex.clear();
    this.docFrequency.clear();
    this.idfCache.clear();
  }
}

// ─── 工厂函数 ────────────────────────────────────────────────────────────────

/**
 * 创建 BM25 搜索引擎实例
 * @param {Object} options 
 * @returns {BM25Engine}
 */
function createBM25Engine(options = {}) {
  return new BM25Engine(options);
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

module.exports = {
  BM25Engine,
  createBM25Engine,
  tokenize,
  calculateIDF,
  prefixMatch,
  BM25_CONFIG,
  SYNONYMS,
};
