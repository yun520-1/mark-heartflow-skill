/**
 * Unified Memory API v11.34.4
 * 
 * 统一访问所有记忆源的 API。
 * 解决"记忆散落12+文件，搜索遗漏"的问题。
 */

const fs = require('fs');
const path = require('path');

class UnifiedMemoryAPI {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.sources = this._initSources();
    this.stats = { queries: 0, totalResults: 0 };
  }

  _initSources() {
    return [
      { name: 'meaningful-learned', file: 'memory/meaningful-learned.json', parser: this._parseObject },
      { name: 'meaningful-core', file: 'memory/meaningful-core.json', parser: this._parseObject },
      { name: 'unified-learned', file: 'memory/stores/unified-learned.json', parser: this._parseArray },
      { name: 'unified-core', file: 'memory/stores/unified-core.json', parser: this._parseArray },
      { name: 'memory-store', file: 'memory/memory-store.json', parser: this._parseArray },
      { name: 'learning-queue', file: 'memory/states/learning-queue.json', parser: this._parseArray },
      { name: 'being-state', file: 'memory/states/being-state.json', parser: this._parseObject },
      { name: 'executable-rules', file: 'data/executable-rules.json', parser: (d) => (d.rules || []).map(r => r.text) },
      { name: 'block-memory', file: 'data/block-memory/blocks.json', parser: (d) => (d.blocks || []).map(b => b.content) },
      { name: 'reflection-memory', file: 'data/reflection-memory/reflections.json', parser: this._parseArray },
      { name: 'store-semantic', file: 'data/memory-routing/store_semantic.json', parser: (d) => d.map(e => e.content) },
      { name: 'store-episodic', file: 'data/memory-routing/store_episodic.json', parser: (d) => d.map(e => e.content) },
      { name: 'store-procedural', file: 'data/memory-routing/store_procedural.json', parser: (d) => d.map(e => e.content) },
    ];
  }

  _parseObject(data) {
    if (typeof data !== 'object') return [];
    return Object.values(data).map(v => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') return v.text || v.value || v.content || JSON.stringify(v);
      return String(v);
    }).filter(Boolean);
  }

  _parseArray(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.text || item.content || item.value || JSON.stringify(item);
      return String(item);
    }).filter(Boolean);
  }

  /**
   * 搜索所有记忆源
   * @param {string|RegExp} query - 搜索词或正则表达式
   * @param {Object} options - { limit, sources, caseSensitive }
   * @returns {Array} 搜索结果
   */
  search(query, options = {}) {
    this.stats.queries++;
    const { limit = 20, sources: sourceFilter = null, caseSensitive = false } = options;

    let results = [];
    const sourcesToSearch = sourceFilter
      ? this.sources.filter(s => sourceFilter.includes(s.name))
      : this.sources;

    for (const source of sourcesToSearch) {
      try {
        const filePath = path.join(this.baseDir, source.file);
        if (!fs.existsSync(filePath)) continue;

        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        const items = source.parser(data);

        for (const item of items) {
          const match = query instanceof RegExp
            ? query.test(item)
            : (caseSensitive ? item.includes(query) : item.toLowerCase().includes(query.toLowerCase()));

          if (match) {
            results.push({
              source: source.name,
              content: item.slice(0, 200),
              relevance: this._calculateRelevance(item, query)
            });
          }
        }
      } catch (e) {
        // 跳过无法读取的文件
      }
    }

    // 按相关度排序
    results.sort((a, b) => b.relevance - a.relevance);
    results = results.slice(0, limit);

    this.stats.totalResults += results.length;
    return results;
  }

  /**
   * 计算相关度
   */
  _calculateRelevance(text, query) {
    const lower = text.toLowerCase();
    const q = query instanceof RegExp ? query.source.toLowerCase() : query.toLowerCase();

    let score = 0;
    if (lower.includes(q)) score += 10;
    if (lower.startsWith(q)) score += 5;
    if (lower === q) score += 20;

    // 关键词权重
    const importantKeywords = ['升级', '记忆', '决策', '逻辑', '真善美', '人类进步', '验证'];
    for (const kw of importantKeywords) {
      if (text.includes(kw)) score += 2;
    }

    return score;
  }

  /**
   * 获取所有记忆源的统计信息
   */
  getStats() {
    const sourceStats = {};
    let totalItems = 0;

    for (const source of this.sources) {
      try {
        const filePath = path.join(this.baseDir, source.file);
        if (!fs.existsSync(filePath)) {
          sourceStats[source.name] = { items: 0, exists: false };
          continue;
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        const items = source.parser(data);
        sourceStats[source.name] = { items: items.length, exists: true };
        totalItems += items.length;
      } catch (e) {
        sourceStats[source.name] = { items: 0, error: e.message };
      }
    }

    return {
      totalSources: this.sources.length,
      activeSources: Object.values(sourceStats).filter(s => s.exists).length,
      totalItems,
      queryStats: this.stats,
      sources: sourceStats
    };
  }

  /**
   * 获取记忆摘要
   */
  getSummary() {
    const stats = this.getStats();
    return {
      version: '11.34.4',
      totalMemories: stats.totalItems,
      sources: stats.activeSources + '/' + stats.totalSources,
      topSources: Object.entries(stats.sources)
        .filter(([, s]) => s.items > 0)
        .sort((a, b) => b[1].items - a[1].items)
        .slice(0, 5)
        .map(([name, s]) => ({ name, items: s.items }))
    };
  }
}

module.exports = { UnifiedMemoryAPI };

// CLI 测试
if (require.main === module) {
  const api = new UnifiedMemoryAPI(process.argv[2] || '.');

  console.log('=== Unified Memory API v11.34.4 ===\n');

  // 获取摘要
  console.log('记忆摘要:');
  console.log(JSON.stringify(api.getSummary(), null, 2));

  // 测试搜索
  console.log('\n=== 搜索测试 ===');
  const tests = [
    { query: '升级', desc: '升级相关记忆' },
    { query: '人类进步', desc: '人类进步相关' },
    { query: '记忆', desc: '记忆相关' },
    { query: '教训', desc: '教训/反思' },
  ];

  for (const test of tests) {
    const results = api.search(test.query, { limit: 3 });
    console.log('\n--- ' + test.desc + ' (' + results.length + ' 条) ---');
    results.forEach((r, i) => {
      console.log('  [' + (i+1) + '] [' + r.source + '] ' + r.content.slice(0, 80));
    });
  }

  console.log('\n=== 查询统计 ===');
  console.log(JSON.stringify(api.stats, null, 2));
}
