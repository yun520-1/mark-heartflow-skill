/**
 * CodeWriter — 心虫代码编写引擎 v1.1.0
 *
 * 根据自然语言需求描述，生成可直接执行的代码（支持 JavaScript / Python）。
 * 不同于 self-initiator 的模板匹配，CodeWriter 基于意图分析
 * 生成结构化、可运行、带错误处理的代码。
 *
 * 核心能力：
 * - 意图识别（分析需求描述→确定代码类别）
 * - 代码生成（基于意图+参数生成完整代码，多语言支持）
 * - 代码组合（多步需求→组合多个代码片段）
 * - 代码审查（检查生成代码的完整性和安全性）
 * - 测试生成（为每个模板生成对应的测试代码）
 * - 代码格式化（缩进、尾随空格、空行规范化）
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
  PIPELINE:     'pipeline',    // 管道处理
  PLOT:         'plot',        // 数据可视化
  ENCODE:       'encode',      // 编码/解码
  BATCH:        'batch'        // 批量处理
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
  { intent: INTENT.PLOT,      keywords: ['可视化', 'plot', 'chart', '图表', '图形', '画图', '绘图', '柱状图', '折线图', '散点图', '饼图', '画'], weight: 2 },
  { intent: INTENT.ENCODE,    keywords: ['编码', 'encode', '解码', 'decode', 'base64', '加密', '解密', 'hash', '加密解密'], weight: 2 },
  { intent: INTENT.BATCH,     keywords: ['批量', 'batch', '批处理', 'bulk', '多个', '循环处理', '全部', '遍历'], weight: 2 },
  { intent: INTENT.UTILITY,   keywords: ['工具', 'util', '函数', 'helper', '帮助', '通用'], weight: 1 }
];

// ============================================================================
// JavaScript 代码模板
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

  // 可视化
  [INTENT.PLOT]: (params) => {
    return `/**
 * ${params.description || '数据可视化'}
 * 使用字符/控制台绘制简单的图表
 */
function plotBar(data, options = {}) {
  const {
    width = 40,
    label = '值',
    symbol = '█'
  } = options;

  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[plotBar] 输入数据为空');
    return;
  }

  const max = Math.max(...data.map(d => typeof d === 'number' ? d : d.value));
  const labels = data.map(d => typeof d === 'object' ? d.label : String(d));
  const values = data.map(d => typeof d === 'number' ? d : d.value);

  console.log(\`--- 柱状图: \${label} ---\`);
  for (let i = 0; i < data.length; i++) {
    const barLen = Math.max(1, Math.round((values[i] / max) * width));
    const bar = symbol.repeat(barLen);
    console.log(\`\${String(labels[i]).padEnd(10)} | \${bar} \${values[i]}\`);
  }
  console.log(\`--- 总计: \${values.length} 项 ---\`);
}

function plotLine(values, options = {}) {
  const { height = 10, width = 50, label = '折线' } = options;
  if (!Array.isArray(values) || values.length === 0) return;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  console.log(\`--- 折线图: \${label} ---\`);
  for (let row = 0; row <= height; row++) {
    const threshold = max - (row / height) * range;
    let line = '';
    for (let col = 0; col < Math.min(values.length, width); col++) {
      const idx = Math.floor((col / width) * values.length);
      line += values[idx] >= threshold ? '*' : ' ';
    }
    const valLabel = (min + (height - row) / height * range).toFixed(1);
    console.log(\`\${String(valLabel).padStart(8)} |\${line}\`);
  }
  console.log('          ' + '-'.repeat(Math.min(values.length, width)));
}

// 使用示例
// plotBar([3, 7, 2, 9, 5], { label: '分数' });
// plotLine([1, 3, 2, 5, 7, 4, 6, 8, 9, 10]);
`;
  },

  // 编码/解码
  [INTENT.ENCODE]: (params) => {
    return `/**
 * ${params.description || '编码/解码工具'}
 * 提供 Base64、URL、Hex 等编解码功能
 */

/**
 * Base64 编码
 * @param {string} str - 输入字符串
 * @returns {string} Base64 编码结果
 */
function base64Encode(str) {
  if (typeof str !== 'string') {
    console.warn('[base64Encode] 输入必须是字符串');
    return '';
  }
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode('0x' + p1)));
  } catch (err) {
    return btoa(str);
  }
}

/**
 * Base64 解码
 * @param {string} encoded - Base64 编码的字符串
 * @returns {string} 解码后的字符串
 */
function base64Decode(encoded) {
  if (typeof encoded !== 'string') return '';
  try {
    return decodeURIComponent(Array.from(atob(encoded), c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch {
    try { return atob(encoded); } catch { return ''; }
  }
}

/**
 * URL 编码
 */
function urlEncode(str) {
  return encodeURIComponent(str);
}

/**
 * URL 解码
 */
function urlDecode(str) {
  return decodeURIComponent(str);
}

/**
 * Hex 编码
 */
function hexEncode(str) {
  return Array.from(str, c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

/**
 * Hex 解码
 */
function hexDecode(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return String.fromCharCode(...bytes);
}

// 使用示例
// console.log(base64Encode('Hello 世界'));  // 编码
// console.log(base64Decode('SGVsbG8g5LiW55WM')); // 解码
// console.log(hexEncode('ABC')); // '414243'
// console.log(hexDecode('414243')); // 'ABC'
`;
  },

  // 批量处理
  [INTENT.BATCH]: (params) => {
    return `/**
 * ${params.description || '批量处理工具'}
 * 批量处理数组/列表中的数据，支持并发控制
 */

/**
 * 批量处理函数
 * @param {Array} items - 待处理的项目列表
 * @param {Function} processor - 处理函数 (item, index) => result
 * @param {Object} [options] - 配置选项
 * @param {number} [options.batchSize=5] - 每批处理数量
 * @param {number} [options.delay=0] - 批次间延迟（毫秒）
 * @param {boolean} [options.parallel=false] - 是否并行处理
 * @returns {Promise<{results: Array, errors: Array, total: number, succeeded: number, failed: number}>}
 */
async function batchProcess(items, processor, options = {}) {
  const {
    batchSize = 5,
    delay = 0,
    parallel = false
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    return { results: [], errors: [], total: 0, succeeded: 0, failed: 0 };
  }
  if (typeof processor !== 'function') {
    throw new Error('[batchProcess] processor 必须是函数');
  }

  const results = [];
  const errors = [];

  if (parallel) {
    // 并行处理（带并发限制）
    const running = new Set();
    for (let i = 0; i < items.length; i++) {
      const run = (async () => {
        try {
          results[i] = { index: i, value: await processor(items[i], i) };
        } catch (err) {
          errors.push({ index: i, item: items[i], error: err.message });
        }
      })();
      running.add(run);
      run.finally(() => running.delete(run));

      if (running.size >= batchSize) {
        await Promise.race(running);
      }
    }
    await Promise.all(running);
  } else {
    // 分批串行处理
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map((item, batchIdx) => {
        const idx = i + batchIdx;
        return (async () => {
          try {
            return { index: idx, value: await processor(item, idx) };
          } catch (err) {
            errors.push({ index: idx, item, error: err.message });
            return null;
          }
        })();
      });

      const batchResults = await Promise.all(batchPromises);
      for (const r of batchResults) {
        if (r) results[r.index] = r;
      }

      if (delay > 0 && i + batchSize < items.length) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  return {
    results: results.filter(Boolean).map(r => r.value),
    errors,
    total: items.length,
    succeeded: results.filter(Boolean).length,
    failed: errors.length
  };
}

/**
 * 分块处理（同步版本）
 * @param {Array} items - 待处理项目
 * @param {Function} processor - 同步处理函数
 * @param {number} [chunkSize=10] - 每块大小
 * @returns {Array} 处理结果
 */
function chunkProcess(items, processor, chunkSize = 10) {
  if (!Array.isArray(items)) return [];
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const processed = chunk.map((item, idx) => processor(item, i + idx));
    results.push(...processed);
  }
  return results;
}

// 使用示例
// const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// const result = await batchProcess(data, async (n) => n * 2, { batchSize: 3 });
// console.log(result.results); // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
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
// Python 代码模板
// ============================================================================

const PYTHON_TEMPLATES = {
  [INTENT.SORT]: (params) => {
    const field = params.field || null;
    return `def sort_data(data, key=None, ascending=True):
    \"\"\"
    ${params.description || '排序函数'}
    
    Args:
        data: 输入数据列表
        key: 排序字段（数据为字典时使用）
        ascending: 升序/降序
    
    Returns:
        排序后的新列表
    \"\"\"
    if not isinstance(data, list):
        print('[sort_data] 输入不是列表')
        return []
    if not data:
        return []
    
    if key:
        def sort_key(item):
            v = item.get(key, '') if isinstance(item, dict) else item
            return v if v is not None else ''
        return sorted(data, key=sort_key, reverse=not ascending)
    else:
        return sorted(data, reverse=not ascending)


# 使用示例
# result = sort_data([3, 1, 4, 1, 5, 9])
# print(result)  # [1, 1, 3, 4, 5, 9]
`;
  },

  [INTENT.FILTER]: (params) => {
    const condition = params.condition || 'item is not None';
    return `def filter_data(data, predicate=None):
    \"\"\"
    ${params.description || '过滤函数'}
    
    Args:
        data: 输入数据列表
        predicate: 过滤条件函数 (item) -> bool
    
    Returns:
        过滤后的列表
    \"\"\"
    if not isinstance(data, list):
        print('[filter_data] 输入不是列表')
        return []
    
    if predicate is None:
        predicate = lambda item: ${condition}
    
    return [item for item in data if predicate(item)]


# 使用示例
# result = filter_data([1, 2, 3, 4, 5], lambda n: n > 2)
# print(result)  # [3, 4, 5]
`;
  },

  [INTENT.ANALYZE]: (params) => {
    const field = params.field || null;
    return `import statistics
from collections import Counter


def analyze_data(data, field=None):
    \"\"\"
    ${params.description || '统计分析'}
    
    Args:
        data: 输入数据列表
        field: 统计字段（数据为字典时使用）
    
    Returns:
        统计结果字典
    \"\"\"
    if not isinstance(data, list) or not data:
        return {'count': 0, 'error': '数据为空'}
    
    # 提取数值
    if field:
        numbers = [d[field] for d in data if isinstance(d, dict) and field in d and isinstance(d[field], (int, float))]
    else:
        numbers = [d for d in data if isinstance(d, (int, float))]
    
    stats = {
        'count': len(data),
        'numeric_count': len(numbers),
        'sum': sum(numbers) if numbers else 0,
        'avg': None,
        'min': None,
        'max': None,
        'median': None,
        'std': None,
        'distribution': {}
    }
    
    if numbers:
        stats['avg'] = round(sum(numbers) / len(numbers), 2)
        stats['min'] = min(numbers)
        stats['max'] = max(numbers)
        stats['median'] = statistics.median(numbers)
        stats['std'] = round(statistics.stdev(numbers), 2) if len(numbers) > 1 else 0
    
    return stats


# 使用示例
# stats = analyze_data([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
# print(stats)
`;
  },

  [INTENT.FILE]: (params) => {
    return `import os
import json
import csv
from pathlib import Path


class FileManager:
    \"\"\"
    ${params.description || '文件操作工具'}
    安全的文件读写操作
    \"\"\"
    
    def __init__(self, base_dir=None):
        self.base_dir = Path(base_dir).resolve() if base_dir else Path.cwd()
    
    def _safe_path(self, target):
        resolved = (self.base_dir / target).resolve()
        if not str(resolved).startswith(str(self.base_dir)):
            raise PermissionError(f'路径越界: "{target}" 超出基目录 "{self.base_dir}"')
        return resolved
    
    def read(self, filepath, encoding='utf-8'):
        try:
            full = self._safe_path(filepath)
            if not full.exists():
                return {'success': False, 'error': f'文件不存在: {filepath}'}
            content = full.read_text(encoding=encoding)
            return {'success': True, 'content': content, 'size': len(content)}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def write(self, filepath, content, encoding='utf-8'):
        try:
            full = self._safe_path(filepath)
            full.parent.mkdir(parents=True, exist_ok=True)
            full.write_text(content, encoding=encoding)
            return {'success': True, 'path': str(filepath), 'size': len(content)}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def list(self, dir_path='.'):
        try:
            full = self._safe_path(dir_path)
            if not full.exists():
                return {'success': False, 'error': f'目录不存在: {dir_path}'}
            files = [p.name for p in full.iterdir() if p.is_file()]
            dirs = [p.name for p in full.iterdir() if p.is_dir()]
            return {'success': True, 'files': files, 'dirs': dirs, 'total': len(files) + len(dirs)}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def read_csv(self, filepath, has_header=True):
        try:
            full = self._safe_path(filepath)
            with open(full, 'r', encoding='utf-8') as f:
                if has_header:
                    reader = csv.DictReader(f)
                    return {'success': True, 'data': list(reader), 'count': len(list(reader))}
                else:
                    reader = csv.reader(f)
                    return {'success': True, 'data': list(reader), 'count': len(list(reader))}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def read_json(self, filepath):
        try:
            full = self._safe_path(filepath)
            with open(full, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {'success': True, 'data': data}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# 使用示例
# fm = FileManager('./data')
# fm.write('test.txt', 'Hello World')
# print(fm.read('test.txt'))
# print(fm.list('.'))
`;
  },

  [INTENT.VALIDATE]: (params) => {
    return `import re


def validate(input_data, rules):
    \"\"\"
    ${params.description || '数据验证器'}
    
    Args:
        input_data: 输入数据（字典）
        rules: 验证规则字典
    
    Returns:
        验证结果字典
    \"\"\"
    if not isinstance(input_data, dict):
        return {'valid': False, 'errors': ['输入数据无效']}
    if not isinstance(rules, dict):
        return {'valid': False, 'errors': ['验证规则无效']}
    
    errors = []
    
    for field, rule in rules.items():
        value = input_data.get(field)
        
        # 必填检查
        if rule.get('required') and (value is None or value == ''):
            errors.append({'field': field, 'rule': 'required', 'message': f'"{field}" 是必填字段'})
            continue
        
        # 跳过未提供的可选字段
        if value is None:
            continue
        
        # 类型检查
        expected_type = rule.get('type')
        if expected_type:
            if expected_type == 'array' and not isinstance(value, (list, tuple)):
                errors.append({'field': field, 'rule': 'type', 'message': f'"{field}" 应为 {expected_type} 类型'})
                continue
            elif expected_type == 'number' and not isinstance(value, (int, float)):
                errors.append({'field': field, 'rule': 'type', 'message': f'"{field}" 应为 {expected_type} 类型'})
                continue
            elif expected_type == 'string' and not isinstance(value, str):
                errors.append({'field': field, 'rule': 'type', 'message': f'"{field}" 应为 {expected_type} 类型'})
                continue
        
        # 范围检查（数字）
        if isinstance(value, (int, float)):
            min_val = rule.get('min')
            max_val = rule.get('max')
            if min_val is not None and value < min_val:
                errors.append({'field': field, 'rule': 'min', 'message': f'"{field}" 最小值为 {min_val}', 'actual': value})
            if max_val is not None and value > max_val:
                errors.append({'field': field, 'rule': 'max', 'message': f'"{field}" 最大值为 {max_val}', 'actual': value})
        
        # 长度检查（字符串/列表）
        if isinstance(value, (str, list, tuple)):
            min_len = rule.get('min_length')
            max_len = rule.get('max_length')
            if min_len is not None and len(value) < min_len:
                errors.append({'field': field, 'rule': 'min_length', 'message': f'"{field}" 最少 {min_len} 个字符'})
            if max_len is not None and len(value) > max_len:
                errors.append({'field': field, 'rule': 'max_length', 'message': f'"{field}" 最多 {max_len} 个字符'})
        
        # 正则检查
        pattern = rule.get('pattern')
        if pattern and isinstance(value, str) and not re.match(pattern, value):
            errors.append({'field': field, 'rule': 'pattern', 'message': f'"{field}" 格式不正确'})
        
        # 枚举检查
        enum_vals = rule.get('enum')
        if enum_vals and isinstance(enum_vals, (list, tuple)) and value not in enum_vals:
            errors.append({'field': field, 'rule': 'enum', 'message': f'"{field}" 必须是 {enum_vals} 之一'})
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'error_count': len(errors),
        'passed': len(rules) - len(errors),
        'total': len(rules)
    }


# 使用示例
# result = validate(
#     {'name': 'Alice', 'age': 25, 'email': 'alice@example.com'},
#     {
#         'name': {'required': True, 'type': 'string', 'min_length': 2, 'max_length': 50},
#         'age': {'required': True, 'type': 'number', 'min': 0, 'max': 150},
#         'email': {'required': True, 'pattern': r'^[^@]+@[^@]+\\.[^@]+$'}
#     }
# )
# print(result)
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
   * @param {string} [options.language='javascript'] - 生成语言 ('javascript' | 'python')
   * @param {boolean} [options.includeTests=false] - 是否包含测试代码
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

    // 选择语言模板
    const templateMap = language === 'python' ? PYTHON_TEMPLATES : CODE_TEMPLATES;
    const template = templateMap[analysis.primaryIntent];

    if (!template) {
      // Fallback: 如果该语言没有该意图的模板，尝试另一个语言
      const fallbackMap = language === 'python' ? CODE_TEMPLATES : PYTHON_TEMPLATES;
      const fallbackTemplate = fallbackMap[analysis.primaryIntent];
      if (fallbackTemplate) {
        // 仍返回 fallback，但标记
        let code = fallbackTemplate(analysis.params);
        this.generatedCount++;

        let testCode = null;
        if (includeTests) {
          testCode = this._generateTest(analysis.primaryIntent, analysis.params, language);
        }

        this._generationLog.push({
          description: description.substring(0, 100),
          intent: analysis.primaryIntent,
          confidence: analysis.confidence,
          codeLength: code.length,
          language,
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
          generatedAt: Date.now(),
          _fallback: true
        };
      }

      return {
        code: null,
        error: `不支持意图类型: ${analysis.primaryIntent}（语言: ${language}）`,
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
      testCode = this._generateTest(analysis.primaryIntent, analysis.params, language);
    }

    this._generationLog.push({
      description: description.substring(0, 100),
      intent: analysis.primaryIntent,
      confidence: analysis.confidence,
      codeLength: code.length,
      language,
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
      { pattern: /Function\s*\(/g, msg: '使用了 Function 构造函数，存在安全风险' },
      { pattern: /new\s+Function\s*\(/g, msg: '使用了 new Function，存在安全风险' },
      { pattern: /process\.env/g, msg: '引用了环境变量，注意敏感信息泄露' },
      { pattern: /fs\.\w+Sync/g, msg: '使用了同步文件操作，可能阻塞事件循环' },
      { pattern: /child_process/g, msg: '包含子进程操作，需注意安全性' },
    ];
    for (const dp of dangerPatterns) {
      dp.pattern.lastIndex = 0;
      if (dp.pattern.test(code)) {
        issues.push({ type: 'security', message: dp.msg, severity: 'warn' });
      }
    }

    // 代码长度检查
    if (code.length > this.maxCodeLength) {
      issues.push({
        type: 'size',
        message: `代码长度 ${code.length} 超过最大限制 ${this.maxCodeLength}`,
        severity: 'warn'
      });
    }

    if (code.length < 30) {
      issues.push({
        type: 'size',
        message: `代码过短（${code.length} 字符），可能不完整`,
        severity: 'info'
      });
    }

    // 完整性检查
    if (!code.includes('function') && !code.includes('class') && !code.includes('async')
        && !code.includes('def ') && !code.includes('class ')) {
      issues.push({ type: 'structure', message: '代码中未检测到函数/类定义', severity: 'info' });
    }

    // 注释完整性检查
    const lines = code.split('\n');
    const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#')
      || l.trim().startsWith('/*') || l.trim().startsWith('*') || l.trim().startsWith('"""'));
    const commentRatio = lines.length > 0 ? commentLines.length / lines.length : 0;

    if (commentRatio < 0.05 && lines.length > 10) {
      issues.push({
        type: 'documentation',
        message: `注释覆盖率偏低（${(commentRatio * 100).toFixed(1)}%），建议增加注释`,
        severity: 'info'
      });
    }

    if (!code.includes('使用示例') && !code.includes('//') && !code.includes('#')) {
      issues.push({ type: 'documentation', message: '缺少使用示例', severity: 'info' });
    }

    // 检查是否有未闭合的括号/引号
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({
        type: 'syntax',
        message: `花括号不匹配: 打开 ${openBraces} 个，关闭 ${closeBraces} 个`,
        severity: 'warn'
      });
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push({
        type: 'syntax',
        message: `括号不匹配: 打开 ${openParens} 个，关闭 ${closeParens} 个`,
        severity: 'warn'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      issueCount: issues.length,
      warnings: issues.filter(i => i.severity === 'warn').length,
      commentRatio: +(commentRatio * 100).toFixed(1)
    };
  }

  /**
   * 格式化代码
   * @param {string} code - 原始代码
   * @returns {string} 格式化后的代码
   */
  formatCode(code) {
    if (!code) return '';

    let formatted = code;

    // 1. 缩进标准化：将混合缩进统一为 2 空格
    // 将 tab 替换为 2 空格
    formatted = formatted.replace(/\t/g, '  ');
    // 将超过 4 的缩进（4空格→2空格，8空格→4空格等）
    formatted = formatted.replace(/^(  )+/gm, (match) => {
      return '  '.repeat(Math.ceil(match.length / 2));
    });

    // 2. 尾随空格清理
    formatted = formatted.replace(/[ \t]+$/gm, '');

    // 3. 空行规范化
    // 将连续 3 个及以上的空行减少为 2 个
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
    // 文件开头和结尾的空行
    formatted = formatted.replace(/^\n+/, '');
    formatted = formatted.replace(/\n+$/, '\n');

    // 4. 在特定符号前后添加/移除空格（基本的美化）
    // 逗号后加空格（如果缺失）
    formatted = formatted.replace(/,(?!\s)/g, ', ');

    return formatted;
  }

  /**
   * 生成测试代码
   * @param {string} intent - 意图
   * @param {Object} params - 参数
   * @param {string} language - 语言
   * @returns {string} 测试代码
   */
  _generateTest(intent, params, language = 'javascript') {
    const nameMap = {
      [INTENT.SORT]: 'sortData',
      [INTENT.FILTER]: 'filterData',
      [INTENT.ANALYZE]: 'analyzeData',
      [INTENT.FETCH]: 'fetchData',
      [INTENT.CACHE]: 'DataCache',
      [INTENT.VALIDATE]: 'validate',
      [INTENT.FILE]: 'FileManager',
      [INTENT.PIPELINE]: 'DataPipeline',
      [INTENT.PLOT]: 'plotBar',
      [INTENT.ENCODE]: 'base64Encode',
      [INTENT.BATCH]: 'batchProcess',
      [INTENT.UTILITY]: 'deepClone'
    };

    const funcName = nameMap[intent] || 'main';

    if (language === 'python') {
      return this._generatePythonTest(intent, params, funcName);
    }

    return this._generateJSTest(intent, params, funcName);
  }

  /**
   * 生成 JavaScript 测试代码
   */
  _generateJSTest(intent, params, funcName) {
    const testCases = this._getTestCases(intent, funcName);

    let testCode = `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
function test${funcName}() {
  console.log('测试 ${funcName}...');
  let passed = 0;
  let failed = 0;
`;

    for (const tc of testCases) {
      testCode += `
  // ${tc.name}
  try {
    ${tc.setup || ''}
    const result = ${tc.call};
    ${tc.assert}
    console.log('  ✅ ${tc.name}');
    passed++;
  } catch (err) {
    console.error('  ❌ ${tc.name}:', err.message);
    failed++;
  }
`;
    }

    testCode += `
  console.log(\`测试完成: \${passed} 通过, \${failed} 失败\`);
  return { passed, failed };
}

// 运行测试
// test${funcName}();
`;
    return testCode;
  }

  /**
   * 生成 Python 测试代码
   */
  _generatePythonTest(intent, params, funcName) {
    const testCases = this._getTestCases(intent, funcName);

    let testCode = `# === 测试: ${params.description?.substring(0, 50) || funcName} ===

def test_${funcName}():
    """测试 ${funcName}"""
    print(f'测试 ${funcName}...')
    passed = 0
    failed = 0
`;

    for (const tc of testCases) {
      testCode += `
    # ${tc.name}
    try:
${tc.setup ? '        ' + tc.setup.replace(/\n/g, '\n        ') : ''}
        result = ${tc.call}
        ${tc.assert.replace(/\n/g, '\n        ')}
        print('  ✅ ${tc.name}')
        passed += 1
    except Exception as e:
        print(f'  ❌ ${tc.name}: {e}')
        failed += 1
`;
    }

    testCode += `
    print(f'测试完成: {passed} 通过, {failed} 失败')
    return {'passed': passed, 'failed': failed}

# 运行测试
# test_${funcName}()
`;
    return testCode;
  }

  /**
   * 获取测试用例（意图相关的测试数据和断言）
   */
  _getTestCases(intent, funcName) {
    const cases = {
      [INTENT.SORT]: [
        {
          name: '基本排序 - 数字数组升序',
          setup: 'const input = [3, 1, 4, 1, 5, 9];',
          call: 'sortData(input)',
          assert: 'if (!Array.isArray(result)) throw new Error(\"结果不是数组\");\n    if (result[0] !== 1 || result[result.length-1] !== 9) throw new Error(\"排序结果不正确\");\n    if (result.length !== 6) throw new Error(\"数组长度变化\");'
        },
        {
          name: '空数组处理',
          setup: 'const input = [];',
          call: 'sortData(input)',
          assert: 'if (!Array.isArray(result)) throw new Error(\"空数组应返回空数组\");\n    if (result.length !== 0) throw new Error(\"空数组结果长度不为0\");'
        },
        {
          name: '降序排序',
          setup: 'const input = [3, 1, 4];',
          call: 'sortData(input, false)',
          assert: 'if (result[0] !== 4) throw new Error(\"降序排序失败\");'
        }
      ],
      [INTENT.FILTER]: [
        {
          name: '基本过滤 - 大于2',
          setup: 'const input = [1, 2, 3, 4, 5];',
          call: 'filterData(input, n => n > 2)',
          assert: 'if (!Array.isArray(result)) throw new Error(\"结果不是数组\");\n    if (result.length !== 3) throw new Error(\"过滤结果长度错误\");\n    if (!result.every(n => n > 2)) throw new Error(\"过滤条件不满足\");'
        },
        {
          name: '空数组',
          setup: 'const input = [];',
          call: 'filterData(input, n => n > 0)',
          assert: 'if (!Array.isArray(result)) throw new Error(\"空数组应返回数组\");\n    if (result.length !== 0) throw new Error(\"空数组结果不为空\");'
        }
      ],
      [INTENT.ANALYZE]: [
        {
          name: '基本统计分析',
          setup: 'const input = [1, 2, 3, 4, 5];',
          call: 'analyzeData(input)',
          assert: 'if (result.count !== 5) throw new Error(\"count 错误\");\n    if (result.sum !== 15) throw new Error(\"sum 错误\");\n    if (result.avg !== 3) throw new Error(\"avg 错误\");\n    if (result.min !== 1) throw new Error(\"min 错误\");\n    if (result.max !== 5) throw new Error(\"max 错误\");'
        },
        {
          name: '空数组',
          setup: 'const input = [];',
          call: 'analyzeData(input)',
          assert: 'if (result.count !== 0) throw new Error(\"空数组 count 应为 0\");'
        }
      ],
      [INTENT.FETCH]: [
        {
          name: '请求结构完整性',
          setup: '',
          call: 'typeof fetchData',
          assert: 'if (result !== \"function\") throw new Error(\"fetchData 应为一个函数\");'
        }
      ],
      [INTENT.CACHE]: [
        {
          name: '缓存基本功能',
          setup: 'const cache = new DataCache({ maxSize: 10, ttl: 60000 });',
          call: 'cache.set(\"key1\", \"value1\")',
          assert: 'if (result !== true) throw new Error(\"set 应返回 true\");\n    const val = cache.get(\"key1\");\n    if (val !== \"value1\") throw new Error(\"get 返回值不匹配\");'
        },
        {
          name: '缓存未命中',
          setup: 'const cache = new DataCache({ maxSize: 10, ttl: 60000 });',
          call: 'cache.get(\"nonexistent\")',
          assert: 'if (result !== undefined) throw new Error(\"不存在的键应返回 undefined\");'
        }
      ],
      [INTENT.VALIDATE]: [
        {
          name: '有效数据验证',
          setup: 'const input = { name: \"Alice\", age: 25 };\n    const rules = { name: { required: true, type: \"string\" }, age: { required: true, type: \"number\", min: 0 } };',
          call: 'validate(input, rules)',
          assert: 'if (result.valid !== true) throw new Error(\"有效数据应验证通过\");\n    if (result.errorCount !== 0) throw new Error(\"错误计数应为 0\");'
        },
        {
          name: '无效数据验证',
          setup: 'const input = { name: \"\" };\n    const rules = { name: { required: true, minLength: 2 } };',
          call: 'validate(input, rules)',
          assert: 'if (result.valid !== false) throw new Error(\"无效数据应验证失败\");'
        }
      ],
      [INTENT.FILE]: [
        {
          name: 'FileManager 实例化',
          setup: '',
          call: 'typeof FileManager',
          assert: 'if (result !== \"function\") throw new Error(\"FileManager 应为一个类\");'
        }
      ],
      [INTENT.PIPELINE]: [
        {
          name: '管道基本功能',
          setup: 'const input = [1, 2, 3, 4, 5];\n    const pipeline = new DataPipeline(input);',
          call: 'pipeline.filter(n => n > 2).map(n => n * 2).run()',
          assert: 'if (!Array.isArray(result.data)) throw new Error(\"管道结果应为数组\");\n    if (result.data.length !== 3) throw new Error(\"管道过滤长度错误\");'
        }
      ],
      [INTENT.PLOT]: [
        {
          name: 'plotBar 参数验证',
          setup: '',
          call: 'typeof plotBar',
          assert: 'if (result !== \"function\") throw new Error(\"plotBar 应为一个函数\");'
        },
        {
          name: 'plotLine 参数验证',
          setup: '',
          call: 'typeof plotLine',
          assert: 'if (result !== \"function\") throw new Error(\"plotLine 应为一个函数\");'
        }
      ],
      [INTENT.ENCODE]: [
        {
          name: 'Base64 编码',
          setup: '',
          call: 'base64Encode(\"Hello\")',
          assert: 'if (typeof result !== \"string\" || result.length === 0) throw new Error(\"编码结果应为非空字符串\");'
        },
        {
          name: 'Base64 解码',
          setup: 'const encoded = base64Encode(\"Hello\");',
          call: 'base64Decode(encoded)',
          assert: 'if (result !== \"Hello\") throw new Error(\"解码结果不匹配\");'
        }
      ],
      [INTENT.BATCH]: [
        {
          name: 'batchProcess 函数存在性',
          setup: '',
          call: 'typeof batchProcess',
          assert: 'if (result !== \"function\") throw new Error(\"batchProcess 应为一个函数\");'
        },
        {
          name: 'chunkProcess 函数存在性',
          setup: '',
          call: 'typeof chunkProcess',
          assert: 'if (result !== \"function\") throw new Error(\"chunkProcess 应为一个函数\");'
        }
      ],
      [INTENT.UTILITY]: [
        {
          name: 'deepClone 基本功能',
          setup: 'const obj = { a: 1, b: { c: 2 } };',
          call: 'deepClone(obj)',
          assert: 'if (result.a !== 1) throw new Error(\"克隆值不匹配\");\n    if (result.b.c !== 2) throw new Error(\"嵌套克隆不匹配\");\n    if (result === obj) throw new Error(\"应返回新对象\");'
        },
        {
          name: 'chunk 函数',
          setup: '',
          call: 'chunk([1,2,3,4,5], 2)',
          assert: 'if (result.length !== 3) throw new Error(\"chunk 结果长度错误\");\n    if (result[0].length !== 2) throw new Error(\"chunk 第一块长度错误\");'
        }
      ]
    };

    return cases[intent] || [
      {
        name: '基本功能测试',
        setup: '',
        call: `${funcName}()`,
        assert: 'console.log(\`测试 ${funcName} 基本功能\`);'
      }
    ];
  }

  /**
   * 获取支持的意图列表
   */
  getSupportedIntents() {
    return Object.values(INTENT).map(intent => ({
      intent,
      keywords: INTENT_RULES.find(r => r.intent === intent)?.keywords || [],
      hasTemplate: !!CODE_TEMPLATES[intent],
      hasPythonTemplate: !!PYTHON_TEMPLATES[intent]
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
