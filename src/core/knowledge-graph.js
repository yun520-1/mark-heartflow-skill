/**
 * KnowledgeGraph v2.0.0 — 三元组知识图谱
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 以 (subject, predicate, object) 三元组为基本单位的知识存储与查询系统。
 * 纯内存操作，零外部依赖，支持模糊查询、递归遍历和 JSON 持久化。
 *
 * 设计原则：
 * - 三元组不可变——添加时若 key 已存在则更新置信度和时间戳
 * - 三重索引加速查询（subject/predicate/object 各一）
 * - 模糊匹配默认启用（contains 而非 exact match）
 * - 递归遍历防环（visited Set）
 *
 * 典型用法：
 *   const kg = new KnowledgeGraph();
 *   kg.addEdge('心虫', '拥有属性', '三层记忆', 0.95);
 *   kg.query({ subject: '心虫' });
 *   kg.getRelated('心虫', 2);
 *   kg.save('/tmp/kg.json');
 *   kg.load('/tmp/kg.json');
 */

const path = require('path');
const fs = require('fs');

class KnowledgeGraph {
  /**
   * @param {string|null} dataDir - 默认数据目录（save/load 时使用）
   */
  constructor(dataDir = null) {
    this.dataDir = dataDir;

    // ─── 主存储 ─────────────────────────────────────────────────────────────
    // key = `${subject}|${predicate}|${object}`（小写标准化）
    // value = { subject, predicate, object, confidence, createdAt, updatedAt, accessedAt }
    this._triples = new Map();

    // ─── 三重索引 ───────────────────────────────────────────────────────────
    // Map<实体名, Set<tripleKey>>
    this._subjectIndex = new Map();   // subject → Set<keys>
    this._predicateIndex = new Map(); // predicate → Set<keys>
    this._objectIndex = new Map();    // object → Set<keys>

    // ─── 统计 ───────────────────────────────────────────────────────────────
    this._stats = {
      triplesAdded: 0,
      queriesExecuted: 0,
      saves: 0,
      loads: 0,
    };

    this._bornAt = Date.now();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 核心 API
  // ═════════════════════════════════════════════════════════════════════════

  _makeKey(subject, predicate, object) {
    return `${subject.toLowerCase()}|${predicate.toLowerCase()}|${object.toLowerCase()}`;
  }

  _addToIndex(index, entity, key) {
    if (!index.has(entity)) {
      index.set(entity, new Set());
    }
    index.get(entity).add(key);
  }

  _take(arr, n) {
    return arr.slice(0, n);
  }

  /**
   * 添加一个三元组
   * @param {string} subject - 主体
   * @param {string} predicate - 谓词（关系类型）
   * @param {string} object - 客体
   * @param {number} [confidence=0.5] - 置信度 0~1
   * @returns {object} 新增或更新后的三元组记录
   */
  addEdge(subject, predicate, object, confidence = 0.5) {
    if (!subject || !predicate || !object) {
      throw new Error(
        `addEdge: subject/predicate/object 都不能为空 ` +
        `(received: subject=${JSON.stringify(subject)}, ` +
        `predicate=${JSON.stringify(predicate)}, ` +
        `object=${JSON.stringify(object)})`
      );
    }

    const key = this._makeKey(subject, predicate, object);
    const now = Date.now();
    const clampedConfidence = Math.max(0, Math.min(1, confidence));

    if (this._triples.has(key)) {
      const existing = this._triples.get(key);
      existing.confidence = clampedConfidence;
      existing.updatedAt = now;
      existing.accessedAt = now;
      return existing;
    }

    const triple = {
      subject,
      predicate,
      object,
      confidence: clampedConfidence,
      createdAt: now,
      updatedAt: now,
      accessedAt: now,
    };

    this._triples.set(key, triple);
    this._stats.triplesAdded++;

    this._addToIndex(this._subjectIndex, subject, key);
    this._addToIndex(this._predicateIndex, predicate, key);
    this._addToIndex(this._objectIndex, object, key);

    return triple;
  }

  /**
   * 查询三元组
   *
   * 筛选条件之间是 AND 关系（同时匹配）。
   * 默认启用模糊匹配（contains），设置 fuzzy=false 时启用精确匹配。
   *
   * @param {object} options - 查询条件
   * @param {string}  [options.subject]   - 按主体筛选
   * @param {string}  [options.predicate] - 按谓词筛选
   * @param {string}  [options.object]    - 按客体筛选
   * @param {boolean} [options.fuzzy=true]    - 是否启用模糊匹配
   * @param {number}  [options.limit=100]     - 返回条数上限
   * @param {boolean} [options.sortByConfidence=false] - 按置信度降序排列
   * @returns {Array<object>} 匹配的三元组数组
   */
  query(options = {}) {
    const {
      subject,
      predicate,
      object,
      fuzzy = true,
      limit = 100,
      sortByConfidence = false,
    } = options;

    this._stats.queriesExecuted++;

    if (!subject && !predicate && !object) {
      return this._take(
        sortByConfidence
          ? Array.from(this._triples.values()).sort((a, b) => b.confidence - a.confidence)
          : Array.from(this._triples.values()),
        limit
      );
    }

    if (!fuzzy) {
      const candidates = this._getCandidatesExact(subject, predicate, object);
      const results = candidates.map(key => this._triples.get(key));
      return this._take(
        sortByConfidence ? results.sort((a, b) => b.confidence - a.confidence) : results,
        limit
      );
    }

    // 模糊匹配：遍历所有三元组
    const results = [];
    for (const triple of this._triples.values()) {
      if (subject && !triple.subject.toLowerCase().includes(subject.toLowerCase())) continue;
      if (predicate && !triple.predicate.toLowerCase().includes(predicate.toLowerCase())) continue;
      if (object && !triple.object.toLowerCase().includes(object.toLowerCase())) continue;
      results.push(triple);
    }

    return this._take(
      sortByConfidence ? results.sort((a, b) => b.confidence - a.confidence) : results,
      limit
    );
  }

  _getCandidatesExact(subject, predicate, object) {
    let candidates = null;

    if (subject) {
      const keys = this._subjectIndex.get(subject);
      if (keys) candidates = new Set(keys);
      else return [];
    }
    if (predicate) {
      const keys = this._predicateIndex.get(predicate);
      if (!keys) return [];
      if (candidates === null) {
        candidates = new Set(keys);
      } else {
        candidates = new Set([...candidates].filter(k => keys.has(k)));
      }
      if (candidates.size === 0) return [];
    }
    if (object) {
      const keys = this._objectIndex.get(object);
      if (!keys) return [];
      if (candidates === null) {
        candidates = new Set(keys);
      } else {
        candidates = new Set([...candidates].filter(k => keys.has(k)));
      }
    }

    return candidates ? Array.from(candidates) : [];
  }

  /**
   * 获取与某个实体相关的所有三元组（递归）
   * @param {string} entity - 实体名称
   * @param {number} [depth=1] - 递归深度
   * @param {Set} [visited] - 已访问实体（防环）
   * @returns {Array<object>} 关联的三元组
   */
  getRelated(entity, depth = 1, visited = new Set()) {
    if (depth <= 0 || visited.has(entity.toLowerCase())) return [];
    visited.add(entity.toLowerCase());

    const direct = this.query({ subject: entity, fuzzy: false });
    const reverse = this.query({ object: entity, fuzzy: false });
    const results = [...direct, ...reverse];

    if (depth > 1) {
      const seen = new Set();
      const allEntities = new Set();
      results.forEach(t => {
        allEntities.add(t.subject);
        allEntities.add(t.object);
      });
      allEntities.delete(entity);
      for (const e of allEntities) {
        if (!seen.has(e.toLowerCase())) {
          seen.add(e.toLowerCase());
          const deeper = this.getRelated(e, depth - 1, visited);
          results.push(...deeper);
        }
      }
    }

    return results;
  }

  /**
   * 获取图谱统计
   * @returns {object}
   */
  getStats() {
    return {
      ...this._stats,
      uniqueSubjects: this._subjectIndex.size,
      uniquePredicates: this._predicateIndex.size,
      uniqueObjects: this._objectIndex.size,
      uptime: Date.now() - this._bornAt,
    };
  }

  /**
   * 清除所有数据
   */
  clear() {
    this._triples.clear();
    this._subjectIndex.clear();
    this._predicateIndex.clear();
    this._objectIndex.clear();
    this._stats = { triplesAdded: 0, queriesExecuted: 0, saves: 0, loads: 0 };
    this._bornAt = Date.now();
  }

  /**
   * 保存到 JSON 文件
   * @param {string} [filePath] - 保存路径，默认 dataDir/knowledge-graph.json
   */
  save(filePath) {
    const savePath = filePath || (this.dataDir ? path.join(this.dataDir, 'knowledge-graph.json') : null);
    if (!savePath) throw new Error('save: 未指定 filePath 且 dataDir 未设置');
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      stats: this._stats,
      triples: Array.from(this._triples.values()),
    };
    const tmp = savePath + '.tmp.' + Date.now();
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, savePath);
    this._stats.saves++;
    return { path: savePath, count: this._triples.size };
  }

  /**
   * 从 JSON 文件加载
   * @param {string} [filePath] - 加载路径，默认 dataDir/knowledge-graph.json
   */
  load(filePath) {
    const loadPath = filePath || (this.dataDir ? path.join(this.dataDir, 'knowledge-graph.json') : null);
    if (!loadPath) throw new Error('load: 未指定 filePath 且 dataDir 未设置');
    if (!fs.existsSync(loadPath)) return { loaded: false, count: 0 };

    const raw = fs.readFileSync(loadPath, 'utf8');
    const data = JSON.parse(raw);
    if (!data.triples || !Array.isArray(data.triples)) {
      throw new Error('load: 无效的知识图谱数据格式');
    }

    this.clear();
    for (const triple of data.triples) {
      this.addEdge(triple.subject, triple.predicate, triple.object, triple.confidence);
    }
    this._stats.loads = (this._stats.loads || 0) + 1;
    return { loaded: true, count: this._triples.size };
  }

  /**
   * 搜索实体（按名称模糊匹配）
   * @param {string} name - 实体名（支持模糊）
   * @returns {Array<string>} 匹配的实体名列表
   */
  searchEntities(name) {
    const lower = name.toLowerCase();
    const entities = new Set();
    for (const key of this._triples.keys()) {
      const parts = key.split('|');
      if (parts[0].includes(lower)) entities.add(parts[0]);
      if (parts[2].includes(lower)) entities.add(parts[2]);
    }
    return Array.from(entities);
  }

  /**
   * 获取两个实体之间的路径
   * @param {string} from - 起始实体
   * @param {string} to - 目标实体
   * @param {number} [maxDepth=4] - 最大搜索深度
   * @returns {Array<Array<object>>} 路径数组
   */
  findPath(from, to, maxDepth = 4) {
    if (from.toLowerCase() === to.toLowerCase()) return [];

    const queue = [[{ entity: from, depth: 0, triples: [] }]];
    const visited = new Set([from.toLowerCase()]);

    while (queue.length > 0) {
      const path = queue.shift();
      const last = path[path.length - 1];

      if (last.depth >= maxDepth) continue;

      const related = this.query({ subject: last.entity, fuzzy: false });
      related.forEach(t => {
        const nextEntity = t.object;
        const nextLower = nextEntity.toLowerCase();
        if (nextLower === to.toLowerCase()) {
          path.push({ entity: nextEntity, depth: last.depth + 1, triples: [t] });
          return;
        }
        if (!visited.has(nextLower) && last.depth + 1 < maxDepth) {
          visited.add(nextLower);
          queue.push([...path, { entity: nextEntity, depth: last.depth + 1, triples: [t] }]);
        }
      });
    }

    return [];
  }
}

module.exports = { KnowledgeGraph };
