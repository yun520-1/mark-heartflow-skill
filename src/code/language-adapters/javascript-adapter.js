/**
 * javascript-adapter.js — JavaScript / TypeScript 语言适配器
 *
 * 提供 JavaScript 和 TypeScript 的：
 * - 语法模板（按意图分类）
 * - 测试代码生成
 * - 结构关键字（用于代码审查）
 * - 注释前缀（用于注释覆盖率检查）
 * - 缩进配置
 *
 * @module language-adapters/javascript-adapter
 */

'use strict';

const { INTENT } = require('../writer-core');
const { validateFetchUrl } = require('../../security/url-validator.js');

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
// 已禁用 console.log: // console.log(result); // [1, 1, 3, 4, 5, 9]
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
// 已禁用 console.log: // console.log(result); // [3, 4, 5]
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
// 已禁用 console.log: // console.log(stats);
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
  // SSRF 防护：校验 URL 安全性
  const urlCheck = _validateFetchUrl(url);
  if (!urlCheck.safe) {
    console.warn('[SSRF防护] 阻止不安全请求:', urlCheck.reason);
    return { success: false, error: urlCheck.reason };
  }

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
// 已禁用 console.log: // if (result.success) console.log(result.data);
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
// 已禁用 console.log: // console.log(cache.get('user:1'));
// 已禁用 console.log: // console.log(cache.stats);
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
// 已禁用 console.log: // console.log(result.valid ? '通过' : '失败', result.errors);
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
    const baseWithSep = this.baseDir.endsWith(path.sep) ? this.baseDir : this.baseDir + path.sep;
    if (!resolved.startsWith(baseWithSep) && resolved !== this.baseDir) {
      throw new Error('Path traversal detected: "' + target + '" exceeds base directory');
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
// 已禁用 console.log: // console.log(fm.read('test.txt'));
// 已禁用 console.log: // console.log(fm.list('.'));
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
// 已禁用 console.log: // console.log(result.data); // [12, 10, 8, 6]
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

  if (process.env.HEARTFLOW_DEBUG) console.log(\`--- 柱状图: \${label} ---\`);
  for (let i = 0; i < data.length; i++) {
    const barLen = Math.max(1, Math.round((values[i] / max) * width));
    const bar = symbol.repeat(barLen);
    if (process.env.HEARTFLOW_DEBUG) console.log(\`\${String(labels[i]).padEnd(10)} | \${bar} \${values[i]}\`);
  }
  if (process.env.HEARTFLOW_DEBUG) console.log(\`--- 总计: \${values.length} 项 ---\`);
}

function plotLine(values, options = {}) {
  const { height = 10, width = 50, label = '折线' } = options;
  if (!Array.isArray(values) || values.length === 0) return;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  if (process.env.HEARTFLOW_DEBUG) console.log(\`--- 折线图: \${label} ---\`);
  for (let row = 0; row <= height; row++) {
    const threshold = max - (row / height) * range;
    let line = '';
    for (let col = 0; col < Math.min(values.length, width); col++) {
      const idx = Math.floor((col / width) * values.length);
      line += values[idx] >= threshold ? '*' : ' ';
    }
    const valLabel = (min + (height - row) / height * range).toFixed(1);
    if (process.env.HEARTFLOW_DEBUG) console.log(\`\${String(valLabel).padStart(8)} |\${line}\`);
  }
  if (process.env.HEARTFLOW_DEBUG) console.log('          ' + '-'.repeat(Math.min(values.length, width)));
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
// 已禁用 console.log: // console.log(base64Encode('Hello 世界'));  // 编码
// 已禁用 console.log: // console.log(base64Decode('SGVsbG8g5LiW55WM')); // 解码
// 已禁用 console.log: // console.log(hexEncode('ABC')); // '414243'
// 已禁用 console.log: // console.log(hexDecode('414243')); // 'ABC'
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
// 已禁用 console.log: // console.log(result.results); // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
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
// 已禁用 console.log: // console.log(deepClone({ a: 1, b: { c: 2 } }));
// 已禁用 console.log: // console.log(chunk([1,2,3,4,5], 2)); // [[1,2],[3,4],[5]]
// 已禁用 console.log: // console.log(unique([1,2,2,3,3,4])); // [1,2,3,4]
`;
  }
};

// ============================================================================
// JavaScript 测试代码生成
// ============================================================================

/**
 * 生成 JavaScript 测试代码
 * @param {string} intent - 意图
 * @param {Object} params - 参数
 * @param {string} funcName - 函数/类名
 * @returns {string} 测试代码
 */
function generateJSTest(intent, params, funcName) {
  const testCases = getTestCases(intent, funcName);

  let testCode = `// === 测试: ${params.description?.substring(0, 50) || funcName} ===
function test${funcName}() {
  if (process.env.HEARTFLOW_DEBUG) console.log('测试 ${funcName}...');
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
    if (process.env.HEARTFLOW_DEBUG) console.log('  ✅ ${tc.name}');
    passed++;
  } catch (err) {
    console.error('  ❌ ${tc.name}:', err.message);
    failed++;
  }
`;
  }

  testCode += `
  if (process.env.HEARTFLOW_DEBUG) console.log(\`测试完成: \${passed} 通过, \${failed} 失败\`);
  return { passed, failed };
}

// 运行测试
// test${funcName}();
`;
  return testCode;
}

/**
 * 获取 JavaScript 测试用例（意图相关的测试数据和断言）
 */
function getTestCases(intent, funcName) {
  const cases = {
    [INTENT.SORT]: [
      {
        name: '基本排序 - 数字数组升序',
        setup: 'const input = [3, 1, 4, 1, 5, 9];',
        call: 'sortData(input)',
        assert: 'if (!Array.isArray(result)) throw new Error("结果不是数组");\n    if (result[0] !== 1 || result[result.length-1] !== 9) throw new Error("排序结果不正确");\n    if (result.length !== 6) throw new Error("数组长度变化");'
      },
      {
        name: '空数组处理',
        setup: 'const input = [];',
        call: 'sortData(input)',
        assert: 'if (!Array.isArray(result)) throw new Error("空数组应返回空数组");\n    if (result.length !== 0) throw new Error("空数组结果长度不为0");'
      },
      {
        name: '降序排序',
        setup: 'const input = [3, 1, 4];',
        call: 'sortData(input, false)',
        assert: 'if (result[0] !== 4) throw new Error("降序排序失败");'
      }
    ],
    [INTENT.FILTER]: [
      {
        name: '基本过滤 - 大于2',
        setup: 'const input = [1, 2, 3, 4, 5];',
        call: 'filterData(input, n => n > 2)',
        assert: 'if (!Array.isArray(result)) throw new Error("结果不是数组");\n    if (result.length !== 3) throw new Error("过滤结果长度错误");\n    if (!result.every(n => n > 2)) throw new Error("过滤条件不满足");'
      },
      {
        name: '空数组',
        setup: 'const input = [];',
        call: 'filterData(input, n => n > 0)',
        assert: 'if (!Array.isArray(result)) throw new Error("空数组应返回数组");\n    if (result.length !== 0) throw new Error("空数组结果不为空");'
      }
    ],
    [INTENT.ANALYZE]: [
      {
        name: '基本统计分析',
        setup: 'const input = [1, 2, 3, 4, 5];',
        call: 'analyzeData(input)',
        assert: 'if (result.count !== 5) throw new Error("count 错误");\n    if (result.sum !== 15) throw new Error("sum 错误");\n    if (result.avg !== 3) throw new Error("avg 错误");\n    if (result.min !== 1) throw new Error("min 错误");\n    if (result.max !== 5) throw new Error("max 错误");'
      },
      {
        name: '空数组',
        setup: 'const input = [];',
        call: 'analyzeData(input)',
        assert: 'if (result.count !== 0) throw new Error("空数组 count 应为 0");'
      }
    ],
    [INTENT.FETCH]: [
      {
        name: '请求结构完整性',
        setup: '',
        call: 'typeof fetchData',
        assert: 'if (result !== "function") throw new Error("fetchData 应为一个函数");'
      }
    ],
    [INTENT.CACHE]: [
      {
        name: '缓存基本功能',
        setup: 'const cache = new DataCache({ maxSize: 10, ttl: 60000 });',
        call: 'cache.set("key1", "value1")',
        assert: 'if (result !== true) throw new Error("set 应返回 true");\n    const val = cache.get("key1");\n    if (val !== "value1") throw new Error("get 返回值不匹配");'
      },
      {
        name: '缓存未命中',
        setup: 'const cache = new DataCache({ maxSize: 10, ttl: 60000 });',
        call: 'cache.get("nonexistent")',
        assert: 'if (result !== undefined) throw new Error("不存在的键应返回 undefined");'
      }
    ],
    [INTENT.VALIDATE]: [
      {
        name: '有效数据验证',
        setup: 'const input = { name: "Alice", age: 25 };\n    const rules = { name: { required: true, type: "string" }, age: { required: true, type: "number", min: 0 } };',
        call: 'validate(input, rules)',
        assert: 'if (result.valid !== true) throw new Error("有效数据应验证通过");\n    if (result.errorCount !== 0) throw new Error("错误计数应为 0");'
      },
      {
        name: '无效数据验证',
        setup: 'const input = { name: "" };\n    const rules = { name: { required: true, minLength: 2 } };',
        call: 'validate(input, rules)',
        assert: 'if (result.valid !== false) throw new Error("无效数据应验证失败");'
      }
    ],
    [INTENT.FILE]: [
      {
        name: 'FileManager 实例化',
        setup: '',
        call: 'typeof FileManager',
        assert: 'if (result !== "function") throw new Error("FileManager 应为一个类");'
      }
    ],
    [INTENT.PIPELINE]: [
      {
        name: '管道基本功能',
        setup: 'const input = [1, 2, 3, 4, 5];\n    const pipeline = new DataPipeline(input);',
        call: 'pipeline.filter(n => n > 2).map(n => n * 2).run()',
        assert: 'if (!Array.isArray(result.data)) throw new Error("管道结果应为数组");\n    if (result.data.length !== 3) throw new Error("管道过滤长度错误");'
      }
    ],
    [INTENT.PLOT]: [
      {
        name: 'plotBar 参数验证',
        setup: '',
        call: 'typeof plotBar',
        assert: 'if (result !== "function") throw new Error("plotBar 应为一个函数");'
      },
      {
        name: 'plotLine 参数验证',
        setup: '',
        call: 'typeof plotLine',
        assert: 'if (result !== "function") throw new Error("plotLine 应为一个函数");'
      }
    ],
    [INTENT.ENCODE]: [
      {
        name: 'Base64 编码',
        setup: '',
        call: 'base64Encode("Hello")',
        assert: 'if (typeof result !== "string" || result.length === 0) throw new Error("编码结果应为非空字符串");'
      },
      {
        name: 'Base64 解码',
        setup: 'const encoded = base64Encode("Hello");',
        call: 'base64Decode(encoded)',
        assert: 'if (result !== "Hello") throw new Error("解码结果不匹配");'
      }
    ],
    [INTENT.BATCH]: [
      {
        name: 'batchProcess 函数存在性',
        setup: '',
        call: 'typeof batchProcess',
        assert: 'if (result !== "function") throw new Error("batchProcess 应为一个函数");'
      },
      {
        name: 'chunkProcess 函数存在性',
        setup: '',
        call: 'typeof chunkProcess',
        assert: 'if (result !== "function") throw new Error("chunkProcess 应为一个函数");'
      }
    ],
    [INTENT.UTILITY]: [
      {
        name: 'deepClone 基本功能',
        setup: 'const obj = { a: 1, b: { c: 2 } };',
        call: 'deepClone(obj)',
        assert: 'if (result.a !== 1) throw new Error("克隆值不匹配");\n    if (result.b.c !== 2) throw new Error("嵌套克隆不匹配");\n    if (result === obj) throw new Error("应返回新对象");'
      },
      {
        name: 'chunk 函数',
        setup: '',
        call: 'chunk([1,2,3,4,5], 2)',
        assert: 'if (result.length !== 3) throw new Error("chunk 结果长度错误");\n    if (result[0].length !== 2) throw new Error("chunk 第一块长度错误");'
      }
    ]
  };

  return cases[intent] || [
    {
      name: '基本功能测试',
      setup: '',
      call: `${funcName}()`,
      // 已禁用 console.log: assert: 'console.log(`测试 ${funcName} 基本功能`);'
    }
  ];
}

// ============================================================================
// 适配器接口
// ============================================================================

module.exports = {
  name: 'javascript',
  templates: CODE_TEMPLATES,
  generateTest: generateJSTest,
  getTestCases,
  structureKeywords: ['function', 'class', 'async', 'const'],
  commentPrefixes: ['//', '/*', '*', '*/'],
  indentSize: 2,
  useTabs: false,
  supportedIntents: Object.keys(CODE_TEMPLATES)
};
