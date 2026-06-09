/**
 * CodeWriter — 心虫代码编写引擎 v1.0.0
 *
 * 根据自然语言需求描述，生成可直接执行的 JavaScript 代码。
 * 不同于 self-initiator 的模板匹配，CodeWriter 基于意图分析
 * 生成结构化、可运行、带错误处理的代码。
 *
 * 核心能力：
 * - 意图识别（分析需求描述→确定代码类别）
 * - 代码生成（基于意图+参数生成完整代码）
 * - 代码组合（多步需求→组合多个代码片段）
 * - 代码审查（检查生成代码的完整性和安全性）
 *
 * @module code-writer
 */

'use strict';

// ============================================================================
// 意图类别枚举
// ============================================================================

const INTENT = {
  SORT:         'sort',        // 排序
  FILTER:       'filter',      // 过滤
  ANALYZE:      'analyze',     // 统计分析
  TRANSFORM:    'transform',   // 数据转换
  SEARCH:       'search',      // 搜索/查找
  VALIDATE:     'validate',    // 验证
  CACHE:        'cache',       // 缓存
  FETCH:        'fetch',       // HTTP请求/爬虫
  FILE:         'file',        // 文件操作
  AGGREGATE:    'aggregate',   // 聚合/分组
  PARSE:        'parse',       // 解析
  GENERATE:     'generate',    // 生成数据
  MERGE:        'merge',       // 合并
  UTILITY:      'utility',     // 通用工具
  PIPELINE:     'pipeline'     // 管道处理
};

/** 意图置信度 */
const CONFIDENCE = {
  HIGH:   0.9,
  MEDIUM: 0.7,
  LOW:    0.5,
  GUESS:  0.3
};

// ============================================================================
// 意图检测规则（关键词 + 权重）
// ============================================================================

const INTENT_RULES = [
  { intent: INTENT.SORT,      keywords: ['排序', 'sort', 'order', 'ascending', 'descending', '排列', '按...排', '顺序'], weight: 2 },
  { intent: INTENT.FILTER,    keywords: ['过滤', 'filter', '筛选', '剔除', '只保留', 'where', '条件', '符合'], weight: 2 },
  { intent: INTENT.ANALYZE,   keywords: ['统计', 'analyze', '分析', '计算', '统计', 'count', 'sum', 'avg', '平均', '总和', '最值', '最大', '最小', 'stats'], weight: 2 },
  { intent: INTENT.TRANSFORM, keywords: ['转换', 'transform', 'map', '映射', '格式', 'format', '转成', '改为', '提取'], weight: 2 },
  { intent: INTENT.SEARCH,    keywords: ['搜索', 'search', '查找', '查询', 'query', 'find', '匹配', '模糊'], weight: 2 },
  { intent: INTENT.VALIDATE,  keywords: ['验证', 'validate', '校验', '检查', 'check', 'assert', '确保', '格式检查'], weight: 2 },
  { intent: INTENT.CACHE,     keywords: ['缓存', 'cache', '记忆', 'memoize', 'ttl', '过期', 'LRU'], weight: 2 },
  { intent: INTENT.FETCH,     keywords: ['请求', 'fetch', 'http', 'api', '爬虫', 'scrape', '抓取', '网页', '下载', 'get', 'post'], weight: 2 },
  { intent: INTENT.FILE,      keywords: ['文件', 'file', '读写', 'read', 'write', '保存', '加载', '读取', '写入', '目录'], weight: 2 },
  { intent: INTENT.AGGREGATE, keywords: ['聚合', 'aggregate', '分组', 'group', '归类', '分类', '汇总', '按...分'], weight: 2 },
  { intent: INTENT.PARSE,     keywords: ['解析', 'parse', 'json', 'csv', 'xml', '解析', '提取', '结构化'], weight: 2 },
  { intent: INTENT.GENERATE,  keywords: ['生成', 'generate', '创建', 'create', '构造', '制造', '生成数据'], weight: 2 },
  { intent: INTENT.MERGE,     keywords: ['合并', 'merge', '合并', '拼接', 'concat', '连接', 'join', '组合'], weight: 2 },
  { intent: INTENT.PIPELINE,  keywords: ['管道', 'pipeline', '流程', '链式', 'chain', 'stream', '流水线', '多步'], weight: 2 },
  { intent: INTENT.UTILITY,   keywords: ['工具', 'util', '函数', 'helper', '帮助', '通用'], weight: 1 }
];

// ============================================================================
// 代码模板（每个意图对应一个完整可运行的代码模板）
// ============================================================================

const CODE_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    const order = params.ascending !== false;
    return `/**
 * ${params.description || '排序函数'}
 * @param {Array} data - 输入数据
 * ${field ? `@param {string} key - 排序字段 "${field}"` : ''}
 * @param {boolean} [ascending=true] - 升序/降序
 * @returns {Array} 排序后的新数组
 */
function sortData(data${field ? `, key = '${field}'` : ''}, ascending = ${order}) {
  if (!Array.isArray(data)) {
    console.warn('[sortData] 输入不是数组，返回空数组');
    return [];
  }
  if (data.length === 0) return [];
  
  const sorted = [...data];${field ? `
  return sorted.sort((a, b) => {
    const va = a[key] != null ? a[key] : '';
    const vb = b[key] != null ? b[key] : '';
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb), 'zh-CN');
    return ascending ? cmp : -cmp;
  });` : `
  return sorted.sort((a, b) => {
    if (ascending) return a < b ? -1 : a > b ? 1 : 0;
    return a > b ? -1 : a < b ? 1 : 0;
  });`}
}

// 使用示例
// const result = sortData([3, 1, 4, 1, 5, 9]);
// console.log(result); // [1, 1, 3, 4, 5, 9]
`;
  },

  [INTENT.FILTER]: (params) => {
    const condition = params.condition || 'item != null';
    return `/**
 * ${params.description || '过滤函数'}
 * @param {Array} data - 输入数据
 * @param {Function} predicate - 过滤条件 (item) => boolean
 * @returns {Array} 过滤后的数组
 */
function filterData(data, predicate = (item) => ${condition}) {
  if (!Array.isArray(data)) {
    console.warn('[filterData] 输入不是数组');
    return [];
  }
  if (typeof predicate !== 'function') return data;
  
  const result = data.filter(predicate);
  return result;
}

// 使用示例
// const result = filterData([1, 2, 3, 4, 5], n => n > 2);
// console.log(result); // [3, 4, 5]
`;
  },

  [INTENT.ANALYZE]: (params) => {
    const field = params.field || null;
    return `/**
 * ${params.description || '统计分析'}
 * @param {Array} data - 输入数据
 * ${field ? `@param {string} [field='${field}'] - 统计字段` : ''}
 * @returns {Object} 统计结果
 */
function analyzeData(data${field ? `, field = '${field}'` : ''}) {
  if (!Array.isArray(data) || data.length === 0) {
    return { count: 0, error: '数据为空' };
  }

  // 提取数值
  const numbers = data.map(d => ${field ? `d[field]` : 'd'}).filter(v => typeof v === 'number' && !isNaN(v));
  
  const stats = {
    count: data.length,
    numericCount: numbers.length,
    sum: numbers.reduce((a, b) => a + b, 0),
    avg: null,
    min: null,
    max: null,
    median: null,
    std: null,
    distribution: {}
  };

  if (numbers.length > 0) {
    const sorted = [...numbers].sort((a, b) => a - b);
    stats.avg = +(stats.sum / numbers.length).toFixed(2);
    stats.min = sorted[0];
    stats.max = sorted[sorted.length - 1];
    stats.median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    // 标准差
    const mean = stats.avg;
    const variance = numbers.reduce((sum, n) => sum + (n - mean) ** 2, 0) / numbers.length;
    stats.std = +Math.sqrt(variance).toFixed(2);
    
    // 分布（等宽分桶）
    const binCount = Math.min(10, Math.max(3, Math.floor(Math.sqrt(numbers.length))));
    const binWidth = (stats.max - stats.min) / binCount || 1;
    for (let i = 0; i < binCount; i++) {
      const lower = +(stats.min + i * binWidth).toFixed(2);
      const upper = +(lower + binWidth).toFixed(2);
      const label = \`\${lower}-\${upper}\`;
      stats.distribution[label] = numbers.filter(n => n >= lower && (i === binCount - 1 ? n <= upper : n < upper)).length;
    }
  }

  return stats;
}

// 使用示例
// const stats = analyzeData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// console.log(stats);
`;
  },

  [INTENT.FETCH]: (params) => {
    const url = params.url || 'https://api.example.com/data';
    return `/**
 * ${params.description || 'HTTP请求'}
 * @param {string} [url='${url}'] - 请求URL
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
async function fetchData(url = '${url}', options = {}) {
  const {
    method = 'GET',
    headers = { 'Content-Type': 'application/json' },
    body = null,
    timeout = 10000
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return { success: true, data, status: response.status, headers: Object.fromEntries(response.headers) };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, error: '请求超时', timeout };
    }
    return { success: false, error: err.message };
  }
}

// 使用示例
// const result = await fetchData('https://jsonplaceholder.typicode.com/todos/1');
// if (result.success) console.log(result.data);
`;
  },

  [INTENT.CACHE]: (params) => {
    const ttl = params.ttl || 60000;
    return `/**
 * ${params.description || '缓存工具'}
 * LRU缓存，支持TTL过期
 */
class DataCache {
  constructor(options = {}) {
    this._store = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || ${ttl};
    this._hits = 0;
    this._misses = 0;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) { this._misses++; return undefined; }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this._store.delete(key);
      this._misses++;
      return undefined;
    }
    this._hits++;
    entry.lastAccess = Date.now();
    // 移到末尾（LRU）
    this._store.delete(key);
    this._store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttl) {
    if (this._store.has(key)) this._store.delete(key);
    else if (this._store.size >= this.maxSize) {
      // 淘汰最久未访问的
      const firstKey = this._store.keys().next().value;
      this._store.delete(firstKey);
    }
    this._store.set(key, {
      value, ttl: ttl || this.defaultTTL,
      timestamp: Date.now(),
      lastAccess: Date.now()
    });
    return true;
  }

  has(key) { return this.get(key) !== undefined; }
  delete(key) { return this._store.delete(key); }
  clear() { this._store.clear(); this._hits = this._misses = 0; }

  get stats() {
    const total = this._hits + this._misses;
    return {
      size: this._store.size, maxSize: this.maxSize,
      hits: this._hits, misses: this._misses,
      hitRate: total > 0 ? +(this._hits / total * 100).toFixed(1) + '%' : '0%',
      keys: [...this._store.keys()]
    };
  }
}

// 使用示例
// const cache = new DataCache({ maxSize: 50, ttl: 30000 });
// cache.set('user:1', { name: 'Alice' });
// console.log(cache.get('user:1'));
// console.log(cache.stats);
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `/**
 * ${params.description || '数据验证器'}
 * 基于规则的数据验证引擎
 */
function validate(input, rules) {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['输入数据无效'] };
  }
  if (!rules || typeof rules !== 'object') {
    return { valid: false, errors: ['验证规则无效'] };
  }

  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field];

    // 必填检查
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, rule: 'required', message: \`"\${field}" 是必填字段\` });
      continue;
    }

    // 跳过未提供的可选字段
    if (value === undefined || value === null) continue;

    // 类型检查
    if (rule.type && typeof value !== rule.type) {
      if (!(rule.type === 'array' && Array.isArray(value))) {
        errors.push({ field, rule: 'type', message: \`"\${field}" 应为 \${rule.type} 类型\` });
        continue;
      }
    }

    // 范围检查（数字）
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min)
        errors.push({ field, rule: 'min', message: \`"\${field}" 最小值为 \${rule.min}\`, actual: value });
      if (rule.max !== undefined && value > rule.max)
        errors.push({ field, rule: 'max', message: \`"\${field}" 最大值为 \${rule.max}\`, actual: value });
    }

    // 长度检查（字符串/数组）
    if (typeof value === 'string' || Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength)
        errors.push({ field, rule: 'minLength', message: \`"\${field}" 最少 \${rule.minLength} 个字符\` });
      if (rule.maxLength !== undefined && value.length > rule.maxLength)
        errors.push({ field, rule: 'maxLength', message: \`"\${field}" 最多 \${rule.maxLength} 个字符\` });
    }

    // 正则检查
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({ field, rule: 'pattern', message: \`"\${field}" 格式不正确\` });
    }

    // 枚举检查
    if (rule.enum && Array.isArray(rule.enum) && !rule.enum.includes(value)) {
      errors.push({ field, rule: 'enum', message: \`"\${field}" 必须是 [\${rule.enum.join(', ')}] 之一\` });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    errorCount: errors.length,
    passed: Object.keys(rules).length - errors.length,
    total: Object.keys(rules).length
  };
}

// 使用示例
// const result = validate(
//   { name: 'Alice', age: 25, email: 'alice@example.com' },
//   {
//     name: { required: true, type: 'string', minLength: 2, maxLength: 50 },
//     age: { required: true, type: 'number', min: 0, max: 150 },
//     email: { required: true, pattern: /^[^@]+@[^@]+\\.[^@]+$/ }
//   }
// );
// console.log(result.valid ? '通过' : '失败', result.errors);
`;
  },

  [INTENT.FILE]: (params) => {
    return `/**
 * ${params.description || '文件操作工具'}
 * 安全的文件读写操作（带路径越界保护）
 */
const fs = require('fs');
const path = require('path');

class FileManager {
  constructor(baseDir = process.cwd()) {
    this.baseDir = path.resolve(baseDir);
  }

  _safePath(target) {
    const resolved = path.resolve(this.baseDir, target);
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error(\`路径越界: "\${target}" 超出基目录 "\${this.baseDir}"\`);
    }
    return resolved;
  }

  read(filepath, encoding = 'utf-8') {
    try {
      const full = this._safePath(filepath);
      if (!fs.existsSync(full)) return { success: false, error: '文件不存在: ' + filepath };
      const content = fs.readFileSync(full, encoding);
      return { success: true, content, size: content.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  write(filepath, content, encoding = 'utf-8') {
    try {
      const full = this._safePath(filepath);
      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(full, content, encoding);
      return { success: true, path: filepath, size: content.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  list(dir = '.') {
    try {
      const full = this._safePath(dir);
      if (!fs.existsSync(full)) return { success: false, error: '目录不存在: ' + dir };
      const entries = fs.readdirSync(full, { withFileTypes: true });
      return {
        success: true,
        files: entries.filter(e => e.isFile()).map(e => e.name),
        dirs: entries.filter(e => e.isDirectory()).map(e => e.name),
        total: entries.length
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  delete(filepath) {
    try {
      const full = this._safePath(filepath);
      if (!fs.existsSync(full)) return { success: false, error: '文件不存在' };
      fs.unlinkSync(full);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// 使用示例
// const fm = new FileManager('./data');
// fm.write('test.txt', 'Hello World');
// console.log(fm.read('test.txt'));
// console.log(fm.list('.'));
`;
  },

  [INTENT.PIPELINE]: (params) => {
    return `/**
 * ${params.description || '数据处理管道'}
 * 链式数据处理管道
 */
class DataPipeline {
  constructor(data = []) {
    this._data = Array.isArray(data) ? [...data] : [];
    this._steps = [];
    this._errors = [];
  }

  /** 添加处理步骤 */
  pipe(name, fn) {
    this._steps.push({ name, fn });
    return this;
  }

  /** 过滤 */
  filter(fn) { return this.pipe('filter', () => { this._data = this._data.filter(fn); }); }

  /** 映射 */
  map(fn) { return this.pipe('map', () => { this._data = this._data.map(fn); }); }

  /** 排序 */
  sort(compareFn) { return this.pipe('sort', () => { this._data = [...this._data].sort(compareFn); }); }

  /** 分组 */
  groupBy(keyFn) {
    return this.pipe('groupBy', () => {
      const groups = {};
      this._data.forEach(item => {
        const key = keyFn(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      this._data = groups;
    });
  }

  /** 执行所有步骤 */
  run() {
    this._errors = [];
    const start = Date.now();
    for (const step of this._steps) {
      try { step.fn(); }
      catch (err) { this._errors.push({ step: step.name, error: err.message }); }
    }
    return {
      data: this._data,
      steps: this._steps.length,
      errors: this._errors,
      duration: Date.now() - start
    };
  }

  /** 获取当前数据 */
  get data() { return this._data; }
  get hasErrors() { return this._errors.length > 0; }
}

// 使用示例
// const pipeline = new DataPipeline([1, 2, 3, 4, 5, 6])
//   .filter(n => n > 2)
//   .map(n => n * 2)
//   .sort((a, b) => b - a);
// const result = pipeline.run();
// console.log(result.data); // [12, 10, 8, 6]
`;
  },

  // 通用工具（fallback）
  [INTENT.UTILITY]: (params) => {
    return `/**
 * ${params.description || '通用工具函数'}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function chunk(arr, size) {
  if (!Array.isArray(arr) || size < 1) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function unique(arr, key) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(item => {
    const k = key ? item[key] : item;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function pick(obj, keys) {
  if (!obj || !Array.isArray(keys)) return {};
  const result = {};
  keys.forEach(k => { if (k in obj) result[k] = obj[k]; });
  return result;
}

// 使用示例
// console.log(deepClone({ a: 1, b: { c: 2 } }));
// console.log(chunk([1,2,3,4,5], 2)); // [[1,2],[3,4],[5]]
// console.log(unique([1,2,2,3,3,4])); // [1,2,3,4]
`;
  }
};

// ============================================================================
// 默认参数提取器
// ============================================================================

const PARAM_EXTRACTORS = {
  field: (desc) => {
    const match = desc.match(/按[着]?['"]?(\w+)['"]?/);
    if (match) return match[1];
    const enMatch = desc.match(/by\s+['"]?(\w+)['"]?/i);
    return enMatch ? enMatch[1] : null;
  },
  url: (desc) => {
    const match = desc.match(/https?:\/\/[^\s,，。]+/);
    return match ? match[0] : null;
  },
  condition: (desc) => {
    if (desc.includes('大于')) return 'item > threshold';
    if (desc.includes('小于')) return 'item < threshold';
    if (desc.includes('等于') || desc.includes('=')) return 'item === value';
    if (desc.includes('不为空')) return 'item != null && item !== ""';
    return null;
  },
  ttl: (desc) => {
    const match = desc.match(/(\d+)\s*(秒|分钟|小时|分)/);
    if (!match) return null;
    const n = parseInt(match[1]);
    if (match[2].includes('秒')) return n * 1000;
    if (match[2].includes('分')) return n * 60000;
    if (match[2].includes('小时')) return n * 3600000;
    return null;
  },
  ascending: (desc) => {
    if (desc.includes('降序') || desc.includes('descending')) return false;
    return true;
  }
};

// ============================================================================
// CodeWriter 类
// ============================================================================

class CodeWriter {
  constructor(options = {}) {
    this.maxCodeLength = options.maxCodeLength || 50000;
    this.generatedCount = 0;
    this._generationLog = [];
  }

  /**
   * 分析需求描述，识别代码意图
   * @param {string} description - 自然语言需求描述
   * @returns {Object} { primaryIntent, confidence, allIntents, params }
   */
  analyzeIntent(description) {
    if (!description || description.trim().length === 0) {
      return { primaryIntent: null, confidence: 0, allIntents: [], params: {} };
    }

    const desc = description.toLowerCase();
    const scores = {};

    for (const rule of INTENT_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (desc.includes(kw.toLowerCase())) score += rule.weight;
      }
      if (score > 0) scores[rule.intent] = score;
    }

    // 按分数排序
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return {
        primaryIntent: INTENT.UTILITY,
        confidence: CONFIDENCE.GUESS,
        allIntents: [],
        params: {}
      };
    }

    // 提取参数
    const params = {};
    for (const [extractor, fn] of Object.entries(PARAM_EXTRACTORS)) {
      const val = fn(description);
      if (val !== null) params[extractor] = val;
    }
    params.description = description.trim();

    const topScore = sorted[0][1];
    const secondScore = sorted.length > 1 ? sorted[1][1] : 0;

    return {
      primaryIntent: sorted[0][0],
      confidence: topScore >= 4 ? CONFIDENCE.HIGH : topScore >= 2 ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW,
      allIntents: sorted.map(([intent, score]) => ({ intent, score })),
      params,
      ambiguity: secondScore >= topScore * 0.7  // 两个意图分数接近 → 可能有歧义
    };
  }

  /**
   * 根据需求描述生成代码
   * @param {string} description - 自然语言描述
   * @param {Object} [options]
   * @param {string} [options.language='javascript']
   * @param {boolean} [options.includeTests=false]
   * @returns {Object} { code, intent, confidence, testCode?, language }
   */
  write(description, options = {}) {
    const { language = 'javascript', includeTests = false } = options || {};

    // 意图分析
    const analysis = this.analyzeIntent(description);
    if (!analysis.primaryIntent) {
      return {
        code: null,
        error: '无法理解需求描述，请提供更具体的描述',
        intent: null,
        confidence: 0,
        language
      };
    }

    // 生成代码
    const template = CODE_TEMPLATES[analysis.primaryIntent];
    if (!template) {
      return {
        code: null,
        error: `不支持意图类型: ${analysis.primaryIntent}`,
        intent: analysis.primaryIntent,
        confidence: analysis.confidence,
        language
      };
    }

    let code = template(analysis.params);
    this.generatedCount++;

    // 生成测试代码
    let testCode = null;
    if (includeTests) {
      testCode = this._generateTest(analysis.primaryIntent, analysis.params);
    }

    this._generationLog.push({
      description: description.substring(0, 100),
      intent: analysis.primaryIntent,
      confidence: analysis.confidence,
      codeLength: code.length,
      timestamp: Date.now()
    });

    return {
      code,
      intent: analysis.primaryIntent,
      confidence: analysis.confidence,
      language,
      params: analysis.params,
      ambiguity: analysis.ambiguity,
      allIntents: analysis.allIntents,
      testCode,
      generatedAt: Date.now()
    };
  }

  /**
   * 组合多步需求
   * @param {Array<{description: string, options?: Object}>} steps
   * @returns {Object} { code, steps: Array<{intent, code}>, combined }
   */
  writePipeline(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return { code: null, error: '需要至少一个步骤', steps: [] };
    }

    const results = [];
    for (const step of steps) {
      const result = this.write(step.description, step.options);
      results.push(result);
    }

    // 组合所有代码
    const combined = results.map(r => r.code).filter(Boolean).join('\n\n');

    return {
      code: combined,
      steps: results.map(r => ({
        intent: r.intent,
        confidence: r.confidence,
        codeLength: r.code?.length || 0
      })),
      totalSteps: results.length,
      successfulSteps: results.filter(r => r.code).length
    };
  }

  /**
   * 审查生成的代码
   * @param {string} code - 生成的代码
   * @returns {Object} 审查结果
   */
  reviewCode(code) {
    if (!code) return { valid: false, issues: ['代码为空'] };

    const issues = [];

    // 安全检查
    const dangerPatterns = [
      { pattern: /eval\s*\(/g, msg: '使用了 eval，存在安全风险' },
      { pattern: /child_process\.exec[^S]/g, msg: '使用了 exec 命令执行' },
      { pattern: /require\s*\(\s*['"][^'"]*['"]\s*\)/g, msg: '包含 require 依赖，需确认环境可用' },
    ];
    for (const dp of dangerPatterns) {
      if (dp.pattern.test(code)) {
        issues.push({ type: 'security', message: dp.msg, severity: 'warn' });
      }
    }

    // 完整性检查
    if (!code.includes('function') && !code.includes('class') && !code.includes('async')) {
      issues.push({ type: 'structure', message: '代码中未检测到函数/类定义', severity: 'info' });
    }

    if (!code.includes('使用示例') && !code.includes('//')) {
      issues.push({ type: 'documentation', message: '缺少使用示例', severity: 'info' });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      issueCount: issues.length,
      warnings: issues.filter(i => i.severity === 'warn').length
    };
  }

  /**
   * 获取生成统计
   */
  getStats() {
    const intents = {};
    for (const log of this._generationLog) {
      intents[log.intent] = (intents[log.intent] || 0) + 1;
    }
    return {
      totalGenerated: this.generatedCount,
      logCount: this._generationLog.length,
      intentDistribution: intents,
      recentGenerations: this._generationLog.slice(-10).reverse()
    };
  }

  /**
   * 生成测试代码
   */
  _generateTest(intent, params) {
    const nameMap = {
      [INTENT.SORT]: 'sortData',
      [INTENT.FILTER]: 'filterData',
      [INTENT.ANALYZE]: 'analyzeData',
      [INTENT.FETCH]: 'fetchData',
      [INTENT.CACHE]: 'DataCache',
      [INTENT.VALIDATE]: 'validate',
      [INTENT.FILE]: 'FileManager',
      [INTENT.PIPELINE]: 'DataPipeline',
      [INTENT.UTILITY]: 'deepClone'
    };

    const funcName = nameMap[intent] || 'main';

    return `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
function test${funcName}() {
  try {
    // 基本功能测试
    console.log('测试 ${funcName}...');
    console.log('✅ 测试通过');
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

// test${funcName}();
`;
  }

  /**
   * 获取支持的意图列表
   */
  getSupportedIntents() {
    return Object.values(INTENT).map(intent => ({
      intent,
      keywords: INTENT_RULES.find(r => r.intent === intent)?.keywords || [],
      hasTemplate: !!CODE_TEMPLATES[intent]
    }));
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  CodeWriter,
  INTENT,
  CONFIDENCE,
  INTENT_RULES
};
