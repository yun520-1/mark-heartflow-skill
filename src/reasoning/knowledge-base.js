/**
 * 知识库 (Knowledge Base) v1.0.0
 *
 * 常识知识存储
 */

const fs = require('fs');
const path = require('path');

class KnowledgeBase {
  constructor(options = {}) {
    // 路径验证 - 防止路径遍历攻击
    const inputPath = options.storagePath || path.join(__dirname, '../../data/knowledge');
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = path.normalize(resolvedPath);
    
    // 验证路径安全性
    if (normalizedPath !== resolvedPath || !path.isAbsolute(resolvedPath)) {
      throw new Error('[KnowledgeBase] Invalid storage path');
    }
    
    // 确保路径在预期范围内
    const expectedBase = path.resolve(__dirname, '..', '..', 'data');
    if (!resolvedPath.startsWith(expectedBase)) {
      throw new Error('[KnowledgeBase] Storage path outside allowed directory');
    }
    
    this.storagePath = resolvedPath;
    this.categories = new Map();
    this.autoSave = options.autoSave !== false;
    this._ensureStoragePath();
    this._loadKnowledge();
    this._registerDefaultKnowledge();
  }

  /**
   * 确保存储目录存在
   */
  _ensureStoragePath() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * 加载知识
   */
  _loadKnowledge() {
    const indexPath = path.join(this.storagePath, 'index.json');
    try {
      if (fs.existsSync(indexPath)) {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        this.categories = new Map(data.categories || []);
      }
    } catch (error) {
      this.categories = new Map();
    }
  }

  /**
   * 保存知识
   */
  _saveKnowledge() {
    if (!this.autoSave) return;

    const indexPath = path.join(this.storagePath, 'index.json');
    try {
      const data = {
        categories: [...this.categories.entries()],
        savedAt: Date.now()
      };
      fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
    } catch (error) {
      // 忽略保存错误
    }
  }

  /**
   * 注册默认知识
   */
  _registerDefaultKnowledge() {
    if (this.categories.size > 0) return;

    // 物理常识
    this.addFact('physics', 'gravity', '水会向下流动', '因为重力作用');
    this.addFact('physics', 'water_flow', '物体落地', '因为重力');
    this.addFact('physics', 'heat', '热的东西会变冷', '热量传递');
    this.addFact('physics', 'solid', '冰会融化成水', '温度升高');

    // 因果常识
    this.addFact('causal', 'push', '推物体会使其移动', '力的作用');
    this.addFact('causal', 'fire', '火会导致燃烧', '火焰特性');
    this.addFact('causal', 'rain', '云会导致下雨', '水循环');

    // 社会常识
    this.addFact('social', 'greeting', '见面应该打招呼', '社交礼仪');
    this.addFact('social', 'thanks', '得到帮助应该说谢谢', '礼貌');
    this.addFact('social', 'promise', '承诺应该遵守', '信任');

    // 时间常识
    this.addFact('time', 'day_night', '太阳升起是白天', '自然规律');
    this.addFact('time', 'seasons', '春天天气变暖', '季节变化');
  }

  /**
   * 添加事实
   */
  addFact(category, key, statement, explanation = '') {
    if (!this.categories.has(category)) {
      this.categories.set(category, new Map());
    }

    const categoryMap = this.categories.get(category);
    categoryMap.set(key, {
      category,
      key,
      statement,
      explanation,
      examples: [],
      confidence: 0.9,
      createdAt: Date.now()
    });

    this._saveKnowledge();
    return true;
  }

  /**
   * 添加示例
   */
  addExample(category, key, example) {
    const fact = this.getFact(category, key);
    if (!fact) return false;

    fact.examples.push({
      example,
      addedAt: Date.now()
    });

    this._saveKnowledge();
    return true;
  }

  /**
   * 获取事实
   */
  getFact(category, key) {
    const categoryMap = this.categories.get(category);
    return categoryMap ? categoryMap.get(key) : null;
  }

  /**
   * 查询知识
   */
  query(queryText) {
    const results = [];
    const queryLower = queryText.toLowerCase();

    for (const [category, facts] of this.categories) {
      for (const [key, fact] of facts) {
        const searchText = `${fact.statement} ${fact.explanation} ${key} ${category}`.toLowerCase();
        if (searchText.includes(queryLower)) {
          results.push({
            ...fact,
            relevance: this._calculateRelevance(queryText, fact)
          });
        }
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 计算相关性
   */
  _calculateRelevance(query, fact) {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const factWords = new Set(
      `${fact.statement} ${fact.explanation} ${fact.key}`.toLowerCase().split(/\s+/)
    );

    const intersection = [...queryWords].filter(w => factWords.has(w)).length;
    const union = new Set([...queryWords, ...factWords]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * 获取类别的所有事实
   */
  getCategory(category) {
    const facts = this.categories.get(category);
    return facts ? [...facts.values()] : [];
  }

  /**
   * 获取所有类别
   */
  getCategories() {
    return [...this.categories.keys()];
  }

  /**
   * 删除事实
   */
  deleteFact(category, key) {
    const facts = this.categories.get(category);
    if (!facts) return false;

    const deleted = facts.delete(key);
    if (deleted) this._saveKnowledge();
    return deleted;
  }

  /**
   * 获取统计
   */
  getStats() {
    const stats = {
      categories: this.categories.size,
      totalFacts: 0,
      byCategory: {}
    };

    for (const [category, facts] of this.categories) {
      const count = facts.size;
      stats.totalFacts += count;
      stats.byCategory[category] = count;
    }

    return stats;
  }

  /**
   * 导出知识
   */
  export() {
    const data = {};
    for (const [category, facts] of this.categories) {
      data[category] = [...facts.values()];
    }
    return data;
  }

  /**
   * 导入知识
   */
  import(data) {
    let imported = 0;
    for (const [category, facts] of Object.entries(data)) {
      if (Array.isArray(facts)) {
        for (const fact of facts) {
          if (fact.key) {
            this.addFact(category, fact.key, fact.statement, fact.explanation);
            imported++;
          }
        }
      }
    }
    return imported;
  }
}

module.exports = { KnowledgeBase };
