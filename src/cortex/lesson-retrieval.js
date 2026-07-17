/**
 * 教训检索引擎 v2.0.48 — 语义搜索 + 模式匹配 + 优先级排序 + 多样性保证
 * 
 * 升级内容 (v2.0.47 → v2.0.48):
 * 1. TF-IDF 加权相关性评分替代简单 includes() 匹配
 * 2. 时间衰减因子（recency boost）纳入优先级排序
 * 3. 类型感知过滤和混合类型多样性保证
 * 4. 标签/主题搜索
 * 5. 跨会话持久性守卫（自动从磁盘加载）
 * 6. 去重感知结果合并（自动递增频率）
 * 7. N-gram 上下文扩展
 * 8. 随机抽样和多样化检索模式
 */
const { lessonBank } = require('./lesson-bank');

class LessonRetrievalEngine {
  constructor() {
    this._loaded = false;
  }

  /**
   * 确保教训库已加载（跨会话持久性守卫）
   */
  _ensureLoaded() {
    if (!this._loaded && lessonBank.lessons.length === 0 && typeof lessonBank.load === 'function') {
      lessonBank.load();
    }
    this._loaded = true;
  }

  /**
   * 计算查询词的 TF-IDF 权重
   * @param {string} query - 查询文本
   * @returns {Map<string,number>} 词 → idf 权重
   */
  _computeIDF(query) {
    this._ensureLoaded();
    const terms = this._tokenize(query);
    const lessons = lessonBank.lessons;
    const N = Math.max(1, lessons.length);
    const df = new Map(); // document frequency per term
    const idf = new Map();

    for (const term of terms) {
      if (!df.has(term)) {
        let count = 0;
        for (const lesson of lessons) {
          const content = (lesson.content || '').toLowerCase();
          const ctx = (lesson.context || '').toLowerCase();
          if (content.includes(term) || ctx.includes(term)) count++;
        }
        df.set(term, count);
      }
    }

    for (const [term, freq] of df) {
      // 平滑 IDF: log(N / (1 + df)) + 1 避免除零
      idf.set(term, Math.log(N / (1 + freq)) + 1);
    }
    return idf;
  }

  /**
   * 分词
   */
  _tokenize(text) {
    return (text || '').toLowerCase()
      .split(/[\s,.;:!?()\[\]{}"'\-—–/\\]+/)
      .filter(w => w.length > 1);
  }

  /**
   * TF-IDF 加权相关性评分
   * @param {string} query - 查询
   * @param {object} lesson - 教训对象
   * @param {Map<string,number>} idfMap - 预计算的 IDF
   * @returns {number} 相关性得分 (0-1)
   */
  _relevanceScore(query, lesson, idfMap) {
    const queryTerms = this._tokenize(query);
    if (queryTerms.length === 0) return 0;

    const lessonText = ((lesson.content || '') + ' ' + (lesson.context || '') + ' ' + (lesson.trigger || '') + ' ' + (lesson.type || '')).toLowerCase();
    const lessonTerms = this._tokenize(lessonText);
    if (lessonTerms.length === 0) return 0;

    // TF-IDF 加权: sum(idf for matching terms) / sum(idf for all query terms)
    let score = 0;
    let totalWeight = 0;

    for (const term of queryTerms) {
      const idf = idfMap.get(term) || 0;
      totalWeight += idf;

      // Term frequency in lesson (normalized by max freq)
      let tf = 0;
      for (const lt of lessonTerms) {
        if (lt === term) tf++;
      }
      if (tf > 0) {
        const maxFreq = Math.max(1, ...lessonTerms.map(t => {
          let c = 0;
          for (const lt of lessonTerms) { if (lt === t) c++; }
          return c;
        }));
        const normalizedTF = tf / maxFreq;
        score += idf * normalizedTF;
      }

      // Bonus: exact phrase match
      if (lessonText.includes(term)) {
        score += idf * 0.1;
      }
    }

    // 标题/类型前缀匹配加分
    const typeWords = this._tokenize(lesson.type || '');
    for (const tw of typeWords) {
      if (queryTerms.includes(tw)) {
        score += 0.15;
      }
    }

    return totalWeight > 0 ? Math.min(1, score / totalWeight) : 0;
  }

  /**
   * N-gram 上下文扩展
   * 从查询中提取 2-3 gram 与教训内容匹配
   */
  _ngramScore(query, lesson) {
    const text = ((lesson.content || '') + ' ' + (lesson.context || '')).toLowerCase();
    const q = query.toLowerCase();
    let score = 0;

    // Bigram 匹配
    const qWords = this._tokenize(q);
    for (let i = 0; i < qWords.length - 1; i++) {
      const bigram = qWords[i] + ' ' + qWords[i + 1];
      if (text.includes(bigram)) score += 0.3;
    }

    // Trigram 匹配（更高权重）
    for (let i = 0; i < qWords.length - 2; i++) {
      const trigram = qWords[i] + ' ' + qWords[i + 1] + ' ' + qWords[i + 2];
      if (text.includes(trigram)) score += 0.5;
    }

    return Math.min(1, score);
  }

  /**
   * 关键词搜索 — TF-IDF 加权版本
   */
  keywordSearch(query, lessons) {
    this._ensureLoaded();
    if (!query || !lessons) return [];
    const idfMap = this._computeIDF(query);

    const scored = lessons.map(l => ({
      lesson: l,
      relevance: this._relevanceScore(query, l, idfMap),
      ngram: this._ngramScore(query, l)
    }));

    // 综合得分 = 0.7 * TF-IDF + 0.3 * N-gram
    return scored
      .map(s => ({ ...s.lesson, _relevance: Math.min(1, s.relevance * 0.7 + s.ngram * 0.3) }))
      .filter(l => l._relevance > 0.05)
      .sort((a, b) => b._relevance - a._relevance);
  }

  /**
   * 标签搜索
   * @param {string|string[]} tags - 标签名或数组
   * @returns {object[]} 匹配的教训
   */
  tagSearch(tags) {
    this._ensureLoaded();
    if (!tags) return [];
    const tagList = Array.isArray(tags) ? tags : [tags];
    const lowerTags = tagList.map(t => t.toLowerCase());

    return lessonBank.lessons.filter(l => {
      const lessonTags = (l.tags || l.type ? [l.type] : []);
      // 也搜索 content 中的 #tag 模式
      const contentTags = ((l.content || '') + ' ' + (l.context || '')).match(/#\w+/g) || [];
      const allTags = [...lessonTags, ...contentTags].map(t => t.replace(/^#/, '').toLowerCase());
      return lowerTags.some(t => allTags.includes(t));
    });
  }

  /**
   * 优先级排序：importance × frequency × recency_decay
   */
  prioritySort(lessons) {
    const now = Date.now();
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    return [...lessons].sort((a, b) => {
      // 基础分
      const baseA = a.importance * Math.log((a.frequency || 1) + 1);
      const baseB = b.importance * Math.log((b.frequency || 1) + 1);

      // 时间衰减因子：lastSeen 越近，衰减越小
      const lastSeenA = a.lastSeen || a.createdAt || now;
      const lastSeenB = b.lastSeen || b.createdAt || now;
      const ageA = Math.min(1, (now - lastSeenA) / WEEK_MS);
      const ageB = Math.min(1, (now - lastSeenB) / WEEK_MS);
      const decayA = Math.exp(-ageA * 2); // 指数衰减
      const decayB = Math.exp(-ageB * 2);

      const scoreA = baseA * (0.6 + 0.4 * decayA);
      const scoreB = baseB * (0.6 + 0.4 * decayB);

      return scoreB - scoreA;
    });
  }

  /**
   * 获取 Top N 教训（带多样性保证）
   * @param {number} n - 数量
   * @param {object} options - { diversify: boolean, excludeTypes: string[] }
   */
  getTopN(n = 5, options = {}) {
    this._ensureLoaded();
    const { diversify = true, excludeTypes = [] } = options;

    let candidates = [...lessonBank.lessons];

    // 排除指定类型
    if (excludeTypes.length > 0) {
      candidates = candidates.filter(l => !excludeTypes.includes(l.type));
    }

    const sorted = this.prioritySort(candidates);

    if (!diversify || n <= 1) {
      return sorted.slice(0, n);
    }

    // 多样性保证：交替选取不同类型
    const result = [];
    const usedTypes = new Set();
    const remaining = [...sorted];

    // 第一轮：每种类型取最高分的一个
    for (let i = 0; i < remaining.length && result.length < n; i++) {
      const type = remaining[i].type || 'default';
      if (!usedTypes.has(type)) {
        result.push(remaining[i]);
        usedTypes.add(type);
      }
    }

    // 第二轮：取剩余最高分
    for (let i = 0; i < remaining.length && result.length < n; i++) {
      if (!result.includes(remaining[i])) {
        result.push(remaining[i]);
      }
    }

    return result;
  }

  /**
   * 查找相似教训（用于合并/去重），带频率自动更新
   */
  findSimilar(newContent, threshold = 0.6) {
    this._ensureLoaded();
    const newWords = new Set(this._tokenize(newContent));
    const results = [];

    for (const lesson of lessonBank.lessons) {
      const lessonWords = new Set(this._tokenize(lesson.content));
      const intersection = [...newWords].filter(w => lessonWords.has(w));
      const jaccard = intersection.length / Math.max(1, newWords.size + lessonWords.size - intersection.length);
      if (jaccard >= threshold) {
        results.push({ lesson, similarity: jaccard });
      }
    }

    const sorted = results.sort((a, b) => b.similarity - a.similarity);

    // 如果找到高度相似的教训（>0.8），自动递增频率
    for (const r of sorted) {
      if (r.similarity > 0.8) {
        r.lesson.frequency = (r.lesson.frequency || 1) + 1;
        r.lesson.lastSeen = Date.now();
      }
    }

    return sorted;
  }

  /**
   * 类型感知过滤检索
   * @param {object} filters - { types: string[], importanceMin: number, since: Date }
   */
  filterBy(filters = {}) {
    this._ensureLoaded();
    let results = [...lessonBank.lessons];

    if (filters.types && filters.types.length > 0) {
      const lowerTypes = filters.types.map(t => t.toLowerCase());
      results = results.filter(l => lowerTypes.includes((l.type || '').toLowerCase()));
    }

    if (filters.importanceMin !== undefined) {
      results = results.filter(l => (l.importance || 0) >= filters.importanceMin);
    }

    if (filters.since) {
      const sinceTime = typeof filters.since === 'number' ? filters.since : filters.since.getTime();
      results = results.filter(l => {
        const created = l.createdAt ? new Date(l.createdAt).getTime() : 0;
        return created >= sinceTime;
      });
    }

    return this.prioritySort(results);
  }

  /**
   * 随机抽样（用于多样性探索）
   * @param {number} n - 样本数量
   * @param {object} options - { types: string[], seed: number }
   */
  randomSample(n = 3, options = {}) {
    this._ensureLoaded();
    let pool = [...lessonBank.lessons];

    if (options.types && options.types.length > 0) {
      const lowerTypes = options.types.map(t => t.toLowerCase());
      pool = pool.filter(l => lowerTypes.includes((l.type || '').toLowerCase()));
    }

    // Fisher-Yates 洗牌
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(n, shuffled.length));
  }

  /**
   * 上下文感知检索（增强版）
   */
  retrieve(context, limit = 3) {
    this._ensureLoaded();

    // 1. TF-IDF 加权匹配
    let results = this.keywordSearch(context, lessonBank.lessons);

    // 2. 如果不够，扩展上下文用 n-gram 补充
    if (results.length < limit) {
      const idfMap = this._computeIDF(context);
      for (const lesson of lessonBank.lessons) {
        if (results.find(r => r.id === lesson.id)) continue;
        const ngramScore = this._ngramScore(context, lesson);
        if (ngramScore > 0.2) {
          results.push({ ...lesson, _relevance: ngramScore * 0.5 });
        }
      }
    }

    // 3. 类型均衡：如果结果全是一种类型，补充其他类型的高分项
    const typesInResults = new Set(results.map(r => r.type));
    if (typesInResults.size <= 1 && results.length >= limit) {
      const dominantType = [...typesInResults][0];
      for (const lesson of lessonBank.lessons) {
        if (results.find(r => r.id === lesson.id)) continue;
        if (lesson.type !== dominantType) {
          const score = this._relevanceScore(context, lesson, this._computeIDF(context));
          if (score > 0.1) {
            results.push({ ...lesson, _relevance: score * 0.6 });
            break;
          }
        }
      }
    }

    return this.prioritySort(results).slice(0, limit);
  }

  /**
   * 查询命令接口（增强版）
   */
  query(cmd) {
    this._ensureLoaded();
    const parts = cmd.trim().split(/\s+/);

    // 类型过滤
    if (parts[0] === 'type' && parts[1]) {
      return this.filterBy({ types: [parts.slice(1).join(' ')] });
    }

    // 最近教训
    if (parts[0] === 'recent' || parts[0] === 'latest') {
      const n = parseInt(parts[1] || 5, 10);
      return lessonBank.lessons.slice(-n).reverse();
    }

    // 按标签搜索
    if (parts[0] === 'tag' && parts[1]) {
      return this.tagSearch(parts.slice(1));
    }

    // 随机抽样
    if (parts[0] === 'random') {
      const n = parseInt(parts[1] || 3, 10);
      const type = parts[2] === 'type' ? parts.slice(3).join(' ') : undefined;
      return this.randomSample(n, type ? { types: [type] } : {});
    }

    // 重要性过滤
    if (parts[0] === 'important' || parts[0] === 'critical') {
      const minImportance = parseInt(parts[1] || 4, 10);
      return this.filterBy({ importanceMin: minImportance });
    }

    // 统计
    if (parts[0] === 'stats' || parts[0] === 'count') {
      const byType = {};
      for (const l of lessonBank.lessons) {
        const t = l.type || 'default';
        byType[t] = (byType[t] || 0) + 1;
      }
      return {
        total: lessonBank.lessons.length,
        byType,
        loaded: this._loaded
      };
    }

    // 默认关键词搜索（TF-IDF 加权）
    return this.prioritySort(this.keywordSearch(cmd, lessonBank.lessons)).slice(0, 10);
  }

  /**
   * 获取检索统计信息
   */
  stats() {
    this._ensureLoaded();
    const byType = {};
    const byImportance = {};
    for (const l of lessonBank.lessons) {
      const t = l.type || 'default';
      byType[t] = (byType[t] || 0) + 1;
      const imp = l.importance || 0;
      byImportance[imp] = (byImportance[imp] || 0) + 1;
    }
    return {
      total: lessonBank.lessons.length,
      byType,
      byImportance,
      engineVersion: '2.0.48',
      hasTFIDF: true,
      hasRecencyDecay: true,
      hasDiversity: true,
      hasTagSearch: true,
      hasPersistenceGuard: true
    };
  }
}

// 保持向后兼容：导出实例 + 旧函数接口
const lessonRetrieval = new LessonRetrievalEngine();

// 向后兼容包装函数
lessonRetrieval.keywordSearch = lessonRetrieval.keywordSearch.bind(lessonRetrieval);
lessonRetrieval.prioritySort = lessonRetrieval.prioritySort.bind(lessonRetrieval);
lessonRetrieval.getTopN = lessonRetrieval.getTopN.bind(lessonRetrieval);
lessonRetrieval.findSimilar = lessonRetrieval.findSimilar.bind(lessonRetrieval);
lessonRetrieval.retrieve = lessonRetrieval.retrieve.bind(lessonRetrieval);
lessonRetrieval.query = lessonRetrieval.query.bind(lessonRetrieval);

module.exports = { lessonRetrieval, LessonRetrievalEngine };
