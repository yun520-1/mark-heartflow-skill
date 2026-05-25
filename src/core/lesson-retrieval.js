/**
 * 教训检索引擎 - 语义搜索 + 模式匹配 + 优先级排序
 */
const { lessonBank } = require('./lesson-bank');

const lessonRetrieval = {
  // 关键词搜索
  keywordSearch(query, lessons) {
    if (!query || !lessons) return [];
    const q = query.toLowerCase();
    return lessons.filter(l =>
      l.content.toLowerCase().includes(q) ||
      (l.context && l.context.toLowerCase().includes(q)) ||
      (l.type && l.type.toLowerCase().includes(q))
    );
  },

  // 优先级排序：importance × frequency
  prioritySort(lessons) {
    return [...lessons].sort((a, b) => {
      const scoreA = a.importance * Math.log(a.frequency + 1);
      const scoreB = b.importance * Math.log(b.frequency + 1);
      return scoreB - scoreA;
    });
  },

  // 获取Top N教训
  getTopN(n = 5) {
    const sorted = this.prioritySort(lessonBank.lessons);
    return sorted.slice(0, n);
  },

  // 查找相似教训（用于合并）
  findSimilar(newContent, threshold = 0.6) {
    const newWords = new Set(newContent.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const results = [];
    for (const lesson of lessonBank.lessons) {
      const lessonWords = new Set(lesson.content.toLowerCase().split(/\W+/).filter(w => w.length > 2));
      const intersection = [...newWords].filter(w => lessonWords.has(w));
      const jaccard = intersection.length / Math.max(1, newWords.size + lessonWords.size - intersection.length);
      if (jaccard >= threshold) {
        results.push({ lesson, similarity: jaccard });
      }
    }
    return results.sort((a, b) => b.similarity - a.similarity);
  },

  // 上下文感知检索
  retrieve(context, limit = 3) {
    // 1. 精确匹配
    let results = lessonBank.getRelevant(context, limit);
    // 2. 如果不够，用关键词搜索
    if (results.length < limit) {
      const kwResults = this.keywordSearch(context, lessonBank.lessons);
      for (const r of kwResults) {
        if (!results.find(existing => existing.id === r.id)) {
          results.push(r);
        }
      }
    }
    return this.prioritySort(results).slice(0, limit);
  },

  // 查询命令接口
  query(cmd) {
    const parts = cmd.trim().split(/\s+/);
    if (parts[0] === 'type' && parts[1]) {
      return lessonBank.lessons.filter(l => l.type === parts[1]);
    }
    if (parts[0] === 'recent' || parts[0] === 'latest') {
      const n = parseInt(parts[1] || 5);
      return lessonBank.lessons.slice(-n).reverse();
    }
    // 默认关键词搜索
    return this.prioritySort(this.keywordSearch(cmd, lessonBank.lessons)).slice(0, 10);
  }
};

module.exports = { lessonRetrieval };
