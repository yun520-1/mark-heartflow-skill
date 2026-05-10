/**
 * Memory Routing v11.19.0
 * 
 * 来源: NirDiamant/Agent_Memory_Techniques (⭐104) - Memory Routing
 *       基于 modular memory architecture
 * 
 * 核心思想:
 * - 每次记忆读写，不是查所有库，是先分类再路由
 * - 分类: 这条记忆是"事件"(episodic)?"事实"(semantic)?"技能"(procedural)?
 * - 路由: 分类后送到对应专业库，不是广播到所有库
 * - LLM分类器做决策，每操作一次200-500ms但避免全库扫描
 * 
 * 记忆类型:
 * - episodic: 发生在何时何地的具体事件（会话/会议/决策）
 * - semantic: 通用事实/知识/概念（不绑定特定时间）
 * - procedural: 如何做事的步骤/流程/技能
 * - core: 身份定义/核心指令（永久不变）
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'memory-routing');
const ROUTING_LOG = path.join(DATA_DIR, 'routing-log.json');
const CLASSIFIER_CACHE = path.join(DATA_DIR, 'classifier-cache.json');

// 记忆类型枚举
const MemoryType = {
  EPISODIC: 'episodic',
  SEMANTIC: 'semantic',
  PROCEDURAL: 'procedural',
  CORE: 'core',
  UNKNOWN: 'unknown'
};

// 内置关键词规则（快速分类，不走LLM）
const TYPE_KEYWORDS = {
  [MemoryType.EPISODIC]: [
    '昨天', '今天', '上周', '上周', '会议', '会话', '讨论', '发生在',
    '那天', '当时', '过后', '回顾', '总结', '会议纪要', '对话记录',
    'yesterday', 'today', 'meeting', 'conversation', 'session', 'discussed',
    'happened', 'when', 'after', 'then', 'later', 'previously'
  ],
  [MemoryType.SEMANTIC]: [
    '概念', '定义', '事实', '知识', '理论', '原则', '规律', '本质', '重要',
    '一般来说', '通常', '事实是', '百科',
    '物理', '常数', '定律', '科学', '数学', '定理', '公式',
    'AI', '人工智能', '机器学习', '发展方向', '策略',
    '测试', '测试内容', '测试用例',
    'concept', 'definition', 'fact', 'knowledge', 'theory', 'principle',
    'truth', 'rule', 'law', 'always', 'generally', 'typically',
    'physics', 'constant', 'theorem', 'formula', 'scientific', 'important', 'test'
  ],
  [MemoryType.PROCEDURAL]: [
    '步骤', '流程', '方法', '如何', '如何做', '教程', '指南', '操作', '配置', '安装', '运行', '部署',
    '首先', '然后', '最后', '下一步', '顺序', '过程',
    'step', 'process', 'method', 'how to', 'tutorial', 'guide', 'configure', 'install', 'run', 'deploy',
    'first', 'then', 'next', 'finally', 'procedure', 'workflow'
  ],
  [MemoryType.CORE]: [
    '我是', '我的身份', '核心指令', '永远', '必须', '原则',
    '价值', '使命', 'identity', 'core', 'directive', 'always',
    'must', 'never', 'always', 'I am', 'my purpose'
  ]
};

/**
 * 快速规则分类器（不走LLM）
 * 用关键词匹配快速判断记忆类型
 */
function quickClassify(text) {
  if (!text) return MemoryType.UNKNOWN;
  
  const textLower = text.toLowerCase();
  const scores = {};
  
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (type === MemoryType.UNKNOWN || type === MemoryType.CORE) continue;
    scores[type] = 0;
    for (const kw of keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        scores[type]++;
      }
    }
  }
  
  // 找最高分
  let bestType = MemoryType.UNKNOWN;
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  
  return bestScore >= 2 ? bestType : MemoryType.UNKNOWN;
}

/**
 * 模糊推断类型（当quickClassify不确定时）
 */
function inferType(context = {}) {
  const { taskType, source, tags } = context;
  
  // 根据来源推断
  if (source === 'core_identity') return MemoryType.CORE;
  if (source === 'user_correction') return MemoryType.SEMANTIC;
  if (source === 'error_recovery') return MemoryType.EPISODIC;
  if (source === 'skill' || source === 'procedure') return MemoryType.PROCEDURAL;
  
  // 根据任务类型推断
  if (taskType === 'reasoning') return MemoryType.SEMANTIC;
  if (taskType === 'decision') return MemoryType.EPISODIC;
  if (taskType === 'code_generation') return MemoryType.PROCEDURAL;
  
  // 根据标签推断
  if (tags && Array.isArray(tags)) {
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower.includes('step') || tagLower.includes('流程')) return MemoryType.PROCEDURAL;
      if (tagLower.includes('fact') || tagLower.includes('知识')) return MemoryType.SEMANTIC;
      if (tagLower.includes('event') || tagLower.includes('会议')) return MemoryType.EPISODIC;
    }
  }
  
  return MemoryType.UNKNOWN;
}

/**
 * 主路由类
 */
class MemoryRouter {
  constructor() {
    this.log = [];
    this.cache = {};
    this._loadCache();
    this._loadLog();
  }

  _loadCache() {
    try {
      if (fs.existsSync(CLASSIFIER_CACHE)) {
        this.cache = JSON.parse(fs.readFileSync(CLASSIFIER_CACHE, 'utf-8'));
      }
    } catch (e) {
      this.cache = {};
    }
  }

  _saveCache() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CLASSIFIER_CACHE, JSON.stringify(this.cache));
  }

  _loadLog() {
    try {
      if (fs.existsSync(ROUTING_LOG)) {
        this.log = JSON.parse(fs.readFileSync(ROUTING_LOG, 'utf-8'));
      }
    } catch (e) {
      this.log = [];
    }
  }

  _saveLog() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ROUTING_LOG, JSON.stringify(this.log.slice(-500))); // 保留最近500条
  }

  /**
   * 分类记忆类型
   * @param {string} text - 待分类的文本
   * @param {Object} context - 额外上下文
   * @returns {Object} { type, confidence, method }
   */
  classify(text, context = {}) {
    // 1. 先查缓存
    const cacheKey = text.substring(0, 200).replace(/\s+/g, ' ');
    if (this.cache[cacheKey]) {
      return { ...this.cache[cacheKey], fromCache: true };
    }
    
    // 2. 快速规则分类
    const quickResult = quickClassify(text);
    if (quickResult !== MemoryType.UNKNOWN) {
      const result = { type: quickResult, confidence: 0.6, method: 'rule-based' };
      this.cache[cacheKey] = result;
      this._saveCache();
      return result;
    }
    
    // 3. 模糊推断（基于context）
    const inferred = inferType(context);
    if (inferred !== MemoryType.UNKNOWN) {
      const result = { type: inferred, confidence: 0.4, method: 'context-inference' };
      this.cache[cacheKey] = result;
      this._saveCache();
      return result;
    }
    
    // 4. 默认返回unknown（需要外部LLM分类）
    return { type: MemoryType.UNKNOWN, confidence: 0, method: 'none' };
  }

  /**
   * 路由写操作
   * @param {string} text - 要写入的内容
   * @param {Object} options - { stores: { episodic, semantic, procedural, core }, context }
   * @returns {Object} 路由结果
   */
  routeWrite(text, options = {}) {
    const { stores = {}, context = {} } = options;
    
    // 分类
    const { type, confidence, method } = this.classify(text, context);
    
    // 决定目标存储
    let targets = [];
    if (type === MemoryType.EPISODIC && stores.episodic) targets.push('episodic');
    else if (type === MemoryType.SEMANTIC && stores.semantic) targets.push('semantic');
    else if (type === MemoryType.PROCEDURAL && stores.procedural) targets.push('procedural');
    else if (type === MemoryType.CORE && stores.core) targets.push('core');
    else if (type === MemoryType.UNKNOWN) {
      // fallback: 尝试所有可用存储
      targets = Object.entries(stores).filter(([k, v]) => v).map(([k]) => k);
    }
    
    const decision = {
      input: text.substring(0, 100),
      type,
      confidence,
      method,
      targets,
      timestamp: Date.now()
    };
    
    this.log.push({ action: 'write', ...decision });
    this._saveLog();
    
    return decision;
  }

  /**
   * 路由读操作（查询）
   * @param {string} query - 查询文本
   * @param {Object} options - { stores, fallbackSearchAll }
   * @returns {Object} 路由结果
   */
  routeRead(query, options = {}) {
    const { stores = {}, fallbackSearchAll = true } = options;
    
    // 分类查询意图
    const { type, confidence, method } = this.classify(query, { taskType: options.taskType });
    
    // 决定查哪些库
    let targets = [];
    if (type !== MemoryType.UNKNOWN && stores[type]) {
      targets.push(type);
    } else if (fallbackSearchAll) {
      targets = Object.entries(stores).filter(([k, v]) => v).map(([k]) => k);
    }
    
    const decision = {
      input: query.substring(0, 100),
      type,
      confidence,
      method,
      targets,
      timestamp: Date.now()
    };
    
    this.log.push({ action: 'read', ...decision });
    this._saveLog();
    
    return decision;
  }

  /**
   * 获取路由统计
   */
  stats() {
    const total = this.log.length;
    const byAction = { read: 0, write: 0 };
    const byType = {};
    const byMethod = {};
    
    for (const entry of this.log) {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      byMethod[entry.method] = (byMethod[entry.method] || 0) + 1;
    }
    
    return { total, byAction, byType, byMethod, cacheSize: Object.keys(this.cache).length };
  }
}


/**
 * MultiMemoryStore - 多类型记忆存储管理器
 * 
 * 管理 episodic/semantic/procedural/core 四个独立存储
 * 并与 MemoryRouter 配合实现智能路由
 */
class MultiMemoryStore {
  constructor() {
    this.stores = {
      episodic: [],
      semantic: [],
      procedural: [],
      core: []
    };
    this.router = new MemoryRouter();
    this.DATA_DIR = path.join(__dirname, '..', '..', 'data', 'memory-routing');
    
    this._loadAll();
  }

  _storeFile(type) {
    return path.join(this.DATA_DIR, `store_${type}.json`);
  }

  _loadAll() {
    for (const type of Object.keys(this.stores)) {
      try {
        const file = this._storeFile(type);
        if (fs.existsSync(file)) {
          this.stores[type] = JSON.parse(fs.readFileSync(file, 'utf-8'));
        }
      } catch (e) {
        this.stores[type] = [];
      }
    }
  }

  _save(type) {
    if (!fs.existsSync(this.DATA_DIR)) fs.mkdirSync(this.DATA_DIR, { recursive: true });
    fs.writeFileSync(this._storeFile(type), JSON.stringify(this.stores[type]));
  }

  /**
   * 写入记忆（自动路由到正确存储）
   */
  write(content, metadata = {}) {
    const decision = this.router.routeWrite(content, {
      stores: {
        episodic: true,
        semantic: true,
        procedural: true,
        core: true
      },
      context: metadata
    });
    
    // 添加到所有目标存储
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      content,
      type: decision.type,
      metadata,
      createdAt: Date.now(),
      accessCount: 0
    };
    
    for (const target of decision.targets) {
      if (this.stores[target]) {
        this.stores[target].push(entry);
        this._save(target);
      }
    }
    
    return { entry, decision };
  }

  /**
   * 搜索记忆（自动路由到相关存储）
   */
  search(query, options = {}) {
    const { limit = 10, includeTypes = null } = options;
    
    const decision = this.router.routeRead(query, {
      stores: {
        episodic: includeTypes === null || includeTypes.includes('episodic'),
        semantic: includeTypes === null || includeTypes.includes('semantic'),
        procedural: includeTypes === null || includeTypes.includes('procedural'),
        core: includeTypes === null || includeTypes.includes('core')
      },
      fallbackSearchAll: includeTypes === null,
      taskType: options.taskType
    });
    
    // 从目标存储搜索
    const results = [];
    for (const target of decision.targets) {
      if (!this.stores[target]) continue;
      
      const targetResults = this.stores[target]
        .filter(item => {
          const text = item.content.toLowerCase();
          const queryLower = query.toLowerCase();
          // 简单关键词匹配
          const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
          return queryWords.some(w => text.includes(w));
        })
        .map(item => ({ ...item, store: target }))
        .slice(0, Math.ceil(limit / decision.targets.length)); // 平均分配
        
      results.push(...targetResults);
    }
    
    // 按accessCount排序
    results.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
    
    // 更新访问统计
    for (const r of results) {
      const store = this.stores[r.store];
      const idx = store.findIndex(s => s.id === r.id);
      if (idx >= 0) {
        store[idx].accessCount = (store[idx].accessCount || 0) + 1;
      }
    }
    
    return {
      query,
      results: results.slice(0, limit),
      decision,
      totalFound: results.length
    };
  }

  /**
   * 获取指定类型的记忆
   */
  getByType(type, options = {}) {
    const { limit = 50 } = options;
    if (!this.stores[type]) return [];
    return this.stores[type]
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, limit);
  }

  /**
   * 获取所有记忆的简要统计
   */
  stats() {
    const result = {};
    for (const [type, items] of Object.entries(this.stores)) {
      result[type] = {
        count: items.length,
        totalAccess: items.reduce((sum, i) => sum + (i.accessCount || 0), 0)
      };
    }
    result.router = this.router.stats();
    return result;
  }
}


// v11.43.2 PAPER INJECTION: memory-router.js
// [3] HippoRAGMemory (arXiv:2406.13417)
const _p11 = require('./papers/v11_43_2_integration.js');

MemoryRouter.prototype.hippoRAG = new _p11.HippoRAGMemory();

/** Index a memory in HippoRAG's entity graph */
MemoryRouter.prototype.indexWithHippoRAG = function(memory) {
  this.hippoRAG.index(memory);
};

/** Retrieve from HippoRAG entity graph (hippocampal pattern completion) */
MemoryRouter.prototype.hippoRAGRetrieve = function(query, topK = 5) {
  return this.hippoRAG.retrieve(query, topK);
};

MultiMemoryStore.prototype.hippoRAG = new _p11.HippoRAGMemory();

MultiMemoryStore.prototype.indexWithHippoRAG = function(memory) {
  this.hippoRAG.index(memory);
};

MultiMemoryStore.prototype.hippoRAGRetrieve = function(query, topK = 5) {
  return this.hippoRAG.retrieve(query, topK);
};

module.exports = { MemoryRouter, MultiMemoryStore, MemoryType, quickClassify, inferType };
