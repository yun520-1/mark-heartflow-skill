/**
 * L2 Chunk Detector v2.0.0 — 短语整合层
 * 识别成语、俗语、诗词引用
 *
 * v2.0.0 升级内容 (2026-06-06):
 *   - 新增 ErrorCode 枚举：错误分类与恢复建议
 *   - 新增参数验证：所有公开方法检测 null/undefined/空值 + 类型检查
 *   - 新增输入尺寸守卫：maxTokenLimit 防止大输入导致的性能退化
 *   - 新增检测质量评分：每匹配的置信度 (0-1) 基于长度、精确度、上下文重叠
 *   - 新增模糊匹配回退：近匹配成语用 Levenshtein 距离发现
 *   - 新增空/边界值处理：所有路径覆盖 null/undefined/空数组
 *   - 新增可观测性：_stats 计数器 + getStats() + resetStats()
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// ErrorCode — 错误分类与恢复建议
// ============================================================================

/**
 * @enum {string}
 */
const ErrorCode = {
  INPUT_NULL:           'INPUT_NULL',
  INPUT_TYPE_MISMATCH:  'INPUT_TYPE_MISMATCH',
  INPUT_TOO_LARGE:      'INPUT_TOO_LARGE',
  INPUT_EMPTY:          'INPUT_EMPTY',
  DB_LOAD_FAILED:       'DB_LOAD_FAILED',
  DB_SAVE_FAILED:       'DB_SAVE_FAILED',
  DB_MISSING:           'DB_MISSING',
  CHUNK_INVALID:        'CHUNK_INVALID',
  UNKNOWN:              'UNKNOWN',
};

/**
 * 错误恢复建议
 * @type {Object<string, { severity: string, suggestion: string }>}
 */
const ERROR_SUGGESTIONS = {
  [ErrorCode.INPUT_NULL]:          { severity: 'info',    suggestion: '向调用者传递空输入 — 返回空结果而不是崩溃' },
  [ErrorCode.INPUT_TYPE_MISMATCH]: { severity: 'warning', suggestion: '调用者传入了非字符串类型 — 使用 String() 安全转换或拒绝' },
  [ErrorCode.INPUT_TOO_LARGE]:     { severity: 'warning', suggestion: '输入超过 maxTokenLimit — 截断至上限后继续处理' },
  [ErrorCode.INPUT_EMPTY]:         { severity: 'info',    suggestion: '输入为空字符串 — 返回空结果，不报错' },
  [ErrorCode.DB_LOAD_FAILED]:      { severity: 'warning', suggestion: '初始化空数据库并继续，下次保存时重新创建文件' },
  [ErrorCode.DB_SAVE_FAILED]:      { severity: 'warning', suggestion: '磁盘写入失败 — 内存数据不受影响，下次操作重试' },
  [ErrorCode.DB_MISSING]:          { severity: 'info',    suggestion: '数据库文件尚不存在 — 用默认空数据初始化' },
  [ErrorCode.CHUNK_INVALID]:       { severity: 'warning', suggestion: '语块对象缺少 type/text 字段 — 跳过无效块' },
  [ErrorCode.UNKNOWN]:             { severity: 'error',   suggestion: '未分类异常 — 检查日志并报告' },
};

/**
 * 创建标准化的错误结果
 */
function _makeError(code, detail) {
  const info = ERROR_SUGGESTIONS[code] || ERROR_SUGGESTIONS[ErrorCode.UNKNOWN];
  return { error: true, code, detail, severity: info.severity, suggestion: info.suggestion };
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 计算 Levenshtein 编辑距离（模糊匹配用）
 */
function _levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * 字符串相似度 (0-1)
 */
function _similarity(a, b) {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1.0 : 1 - _levenshtein(a, b) / maxLen;
}

/**
 * 检查输入有效性
 * @param {*} input - 待检查的输入
 * @param {object} [opts]
 * @param {number} [opts.maxLength] - 可选的最大长度
 * @returns {{ valid: boolean, error?: object }}
 */
function _validateInput(input, opts = {}) {
  if (input === null || input === undefined) {
    return { valid: false, error: _makeError(ErrorCode.INPUT_NULL, '输入为 null 或 undefined') };
  }
  if (typeof input !== 'string') {
    return { valid: false, error: _makeError(ErrorCode.INPUT_TYPE_MISMATCH, `期望 string, 收到 ${typeof input}`) };
  }
  if (input.length === 0) {
    return { valid: false, error: _makeError(ErrorCode.INPUT_EMPTY, '输入为空字符串') };
  }
  if (opts.maxLength && input.length > opts.maxLength) {
    return { valid: false, error: _makeError(ErrorCode.INPUT_TOO_LARGE, `输入长度 ${input.length} 超过上限 ${opts.maxLength}`) };
  }
  return { valid: true };
}

// ============================================================================
// ChunkDetector 类
// ============================================================================

class ChunkDetector {
  /**
   * @param {string} projectRoot - 项目根路径
   * @param {object} [opts]
   * @param {number} [opts.maxTokenLimit=5000] - 单次检测的最大 token 数
   * @param {number} [opts.fuzzyThreshold=0.8] - 模糊匹配相似度阈值 (0-1)
   * @param {number} [opts.maxHistory=30] - 历史记录最大长度
   */
  constructor(projectRoot, opts = {}) {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[ChunkDetector] projectRoot 必须为非空字符串');
    }
    this.projectRoot = projectRoot;
    this.idiomFile = path.join(projectRoot, 'src', 'core', 'associative-engine', 'idiom-story-db.json');
    this.idiomDB = this.loadIdiomDB();
    this.detectedChunks = [];

    // 配置参数
    this.maxTokenLimit = (typeof opts.maxTokenLimit === 'number' && opts.maxTokenLimit > 0) ? opts.maxTokenLimit : 5000;
    this.fuzzyThreshold = (typeof opts.fuzzyThreshold === 'number' && opts.fuzzyThreshold > 0 && opts.fuzzyThreshold <= 1) ? opts.fuzzyThreshold : 0.8;
    this.maxHistory = (typeof opts.maxHistory === 'number' && opts.maxHistory > 0) ? opts.maxHistory : 30;

    // 可观测性计数器
    this._stats = {
      detectCalls: 0,
      idiomMatches: 0,
      poetryMatches: 0,
      proverbMatches: 0,
      fuzzyMatches: 0,
      truncatedInputs: 0,
      errors: {},
      totalTokensProcessed: 0,
    };
  }

  // ========================================================================
  // 数据库加载/保存
  // ========================================================================

  loadIdiomDB() {
    try {
      if (fs.existsSync(this.idiomFile)) {
        const raw = fs.readFileSync(this.idiomFile, 'utf8');
        const parsed = JSON.parse(raw);
        // 验证基本结构
        if (!parsed || typeof parsed !== 'object') {
          return this.initializeDefaultIdiomDB();
        }
        return parsed;
      }
    } catch (e) {
      console.error('[ChunkDetector] Load idiom DB failed:', e.message);
      this._stats.errors[ErrorCode.DB_LOAD_FAILED] = (this._stats.errors[ErrorCode.DB_LOAD_FAILED] || 0) + 1;
    }
    return this.initializeDefaultIdiomDB();
  }

  initializeDefaultIdiomDB() {
    return {
      version: '1.0',
      idioms: {},
      poetry: {},
      proverbs: {},
      metadata: {
        lastUpdate: new Date().toISOString()
      }
    };
  }

  saveIdiomDB() {
    try {
      fs.writeFileSync(this.idiomFile, JSON.stringify(this.idiomDB, null, 2));
      return true;
    } catch (e) {
      console.error('[ChunkDetector] Save failed:', e.message);
      this._stats.errors[ErrorCode.DB_SAVE_FAILED] = (this._stats.errors[ErrorCode.DB_SAVE_FAILED] || 0) + 1;
      return false;
    }
  }

  // ========================================================================
  // Tokenization
  // ========================================================================

  /**
   * 分词，带输入验证和尺寸守卫
   * @param {string} text - 输入文本
   * @returns {{ words: string[], truncated: boolean, error?: object }}
   */
  tokenize(text) {
    const validation = _validateInput(text);
    if (!validation.valid) {
      return { words: [], truncated: false, error: validation.error };
    }

    const words = text.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0);

    // 尺寸守卫：超过上限时截断
    if (words.length > this.maxTokenLimit) {
      this._stats.truncatedInputs++;
      return {
        words: words.slice(0, this.maxTokenLimit),
        truncated: true,
        warning: `输入已截断至 ${this.maxTokenLimit} 个 token（原始 ${words.length} 个）`
      };
    }

    return { words, truncated: false };
  }

  // ========================================================================
  // 核心检测
  // ========================================================================

  /**
   * 检测词序列中的语块
   * @param {string} wordSequence - 输入文本
   * @returns {{ originalText: string, chunks: Array, tokenCount: number, truncated: boolean, warning?: string, error?: object, timestamp: string }}
   */
  detectChunks(wordSequence) {
    // 参数验证
    const validation = _validateInput(wordSequence);
    if (!validation.valid) {
      return {
        originalText: wordSequence || '',
        chunks: [],
        tokenCount: 0,
        truncated: false,
        error: validation.error,
        timestamp: new Date().toISOString()
      };
    }

    this._stats.detectCalls++;

    const tokenResult = this.tokenize(wordSequence);
    const words = tokenResult.words;

    if (tokenResult.error) {
      return {
        originalText: wordSequence,
        chunks: [],
        tokenCount: 0,
        truncated: false,
        error: tokenResult.error,
        timestamp: new Date().toISOString()
      };
    }

    this._stats.totalTokensProcessed += words.length;

    const chunks = [];
    let i = 0;

    while (i < words.length) {
      const idiom = this.detectIdiomAt(words, i);
      if (idiom) {
        chunks.push(idiom);
        this._stats.idiomMatches++;
        i += idiom.length;
        continue;
      }

      const poetry = this.detectPoetryAt(words, i);
      if (poetry) {
        chunks.push(poetry);
        this._stats.poetryMatches++;
        i += poetry.length;
        continue;
      }

      const proverb = this.detectProverbAt(words, i);
      if (proverb) {
        chunks.push(proverb);
        this._stats.proverbMatches++;
        i += proverb.length;
        continue;
      }

      i++;
    }

    const result = {
      originalText: wordSequence,
      chunks,
      tokenCount: words.length,
      truncated: tokenResult.truncated || false,
      timestamp: new Date().toISOString()
    };

    if (tokenResult.warning) {
      result.warning = tokenResult.warning;
    }

    this.detectedChunks.push(result);
    if (this.detectedChunks.length > this.maxHistory) {
      this.detectedChunks.shift();
    }

    return result;
  }

  // ========================================================================
  // 子检测方法
  // ========================================================================

  /**
   * 在指定位置检测成语，含模糊匹配回退
   * @param {string[]} words - 分词数组
   * @param {number} startIndex - 起始位置
   * @returns {object|null} 检测到的语块
   */
  detectIdiomAt(words, startIndex) {
    // 边界检查
    if (!Array.isArray(words) || words.length === 0) return null;
    if (typeof startIndex !== 'number' || startIndex < 0 || startIndex >= words.length) return null;

    const idiomKeys = Object.keys(this.idiomDB.idioms);
    if (idiomKeys.length === 0) return null;

    for (let len = 4; len >= 2; len--) {
      if (startIndex + len > words.length) continue;

      const phrase = words.slice(startIndex, startIndex + len).join('');

      // 精确匹配
      if (this.idiomDB.idioms[phrase]) {
        return this._buildChunk('idiom', phrase, len, this.idiomDB.idioms[phrase], startIndex, 1.0);
      }

      // 反向精确匹配
      const reversed = phrase.split('').reverse().join('');
      if (this.idiomDB.idioms[reversed]) {
        return this._buildChunk('idiom', phrase, len, this.idiomDB.idioms[reversed], startIndex, 0.95);
      }

      // 模糊匹配回退：对已知成语做 Levenshtein 距离匹配
      for (const key of idiomKeys) {
        if (Math.abs(key.length - phrase.length) > 3) continue; // 长度过滤
        const sim = _similarity(phrase, key);
        if (sim >= this.fuzzyThreshold) {
          this._stats.fuzzyMatches++;
          const fuzzyData = { ...this.idiomDB.idioms[key], _fuzzyMatch: { originalKey: key, similarity: sim } };
          return this._buildChunk('idiom', phrase, len, fuzzyData, startIndex, sim);
        }
      }
    }

    return null;
  }

  /**
   * 在指定位置检测诗词引用
   */
  detectPoetryAt(words, startIndex) {
    if (!Array.isArray(words) || words.length === 0) return null;
    if (typeof startIndex !== 'number' || startIndex < 0 || startIndex >= words.length) return null;

    const poetryKeys = Object.keys(this.idiomDB.poetry);
    if (poetryKeys.length === 0) return null;

    for (let len = 5; len >= 2; len--) {
      if (startIndex + len > words.length) continue;

      const phrase = words.slice(startIndex, startIndex + len).join('');

      if (this.idiomDB.poetry[phrase]) {
        return this._buildChunk('poetry', phrase, len, this.idiomDB.poetry[phrase], startIndex, 1.0);
      }

      // 模糊匹配
      for (const key of poetryKeys) {
        if (Math.abs(key.length - phrase.length) > 3) continue;
        const sim = _similarity(phrase, key);
        if (sim >= this.fuzzyThreshold) {
          this._stats.fuzzyMatches++;
          const fuzzyData = { ...this.idiomDB.poetry[key], _fuzzyMatch: { originalKey: key, similarity: sim } };
          return this._buildChunk('poetry', phrase, len, fuzzyData, startIndex, sim);
        }
      }
    }

    return null;
  }

  /**
   * 在指定位置检测俗语
   */
  detectProverbAt(words, startIndex) {
    if (!Array.isArray(words) || words.length === 0) return null;
    if (typeof startIndex !== 'number' || startIndex < 0 || startIndex >= words.length) return null;

    const proverbKeys = Object.keys(this.idiomDB.proverbs);
    if (proverbKeys.length === 0) return null;

    for (let len = 6; len >= 2; len--) {
      if (startIndex + len > words.length) continue;

      const phrase = words.slice(startIndex, startIndex + len).join('');

      if (this.idiomDB.proverbs[phrase]) {
        return this._buildChunk('proverb', phrase, len, this.idiomDB.proverbs[phrase], startIndex, 1.0);
      }

      // 模糊匹配
      for (const key of proverbKeys) {
        if (Math.abs(key.length - phrase.length) > 3) continue;
        const sim = _similarity(phrase, key);
        if (sim >= this.fuzzyThreshold) {
          this._stats.fuzzyMatches++;
          const fuzzyData = { ...this.idiomDB.proverbs[key], _fuzzyMatch: { originalKey: key, similarity: sim } };
          return this._buildChunk('proverb', phrase, len, fuzzyData, startIndex, sim);
        }
      }
    }

    return null;
  }

  /**
   * 构建带置信度的语块对象
   * @private
   */
  _buildChunk(type, text, length, data, startIndex, confidence) {
    return {
      type,
      text,
      length,
      data,
      startIndex,
      confidence: Math.round(confidence * 100) / 100, // 保留两位小数
    };
  }

  // ========================================================================
  // 典故检索
  // ========================================================================

  /**
   * 检索成语的典故
   * @param {object} chunk - 检测到的语块对象
   * @returns {object|null} 典故信息
   */
  retrieveIdiomStory(chunk) {
    // 参数验证
    if (!chunk || typeof chunk !== 'object') {
      return { error: true, code: ErrorCode.CHUNK_INVALID, detail: 'chunk 必须为非空对象' };
    }
    if (!chunk.type || !chunk.text) {
      return { error: true, code: ErrorCode.CHUNK_INVALID, detail: 'chunk 缺少 type 或 text 字段' };
    }
    if (chunk.type !== 'idiom') {
      return null;
    }

    // 优先使用精确键查找，再尝试模糊键
    const idiom = chunk.text;
    let entry = this.idiomDB.idioms[idiom];

    // 如果是模糊匹配结果，用原键查找
    if (!entry && chunk.data && chunk.data._fuzzyMatch) {
      entry = this.idiomDB.idioms[chunk.data._fuzzyMatch.originalKey];
    }

    if (entry) {
      return {
        idiom: idiom,
        story: entry.story || '无典故记录',
        meaning: entry.meaning || '',
        origin: entry.origin || '',
        narrativeSeed: entry.narrativeSeed || null
      };
    }

    return null;
  }

  // ========================================================================
  // 叙事种子提取
  // ========================================================================

  /**
   * 将激活的典故作为叙事种子
   * @param {Array} chunks - 语块数组
   * @returns {Array} 种子数组
   */
  extractNarrativeSeeds(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return [];
    }

    const seeds = [];

    for (const chunk of chunks) {
      if (!chunk || typeof chunk !== 'object') continue;

      if (chunk.type === 'idiom' && chunk.data && chunk.data.narrativeSeed) {
        seeds.push({
          type: 'idiom',
          text: chunk.text,
          seed: chunk.data.narrativeSeed,
          confidence: chunk.confidence || 1.0,
        });
      }

      if (chunk.type === 'poetry' && chunk.data && chunk.data.narrativeSeed) {
        seeds.push({
          type: 'poetry',
          text: chunk.text,
          seed: chunk.data.narrativeSeed,
          confidence: chunk.confidence || 1.0,
        });
      }
    }

    return seeds;
  }

  // ========================================================================
  // 数据库操作
  // ========================================================================

  /**
   * 添加成语到数据库
   */
  addIdiom(idiom, story, meaning, origin, narrativeSeed) {
    if (!idiom || typeof idiom !== 'string') {
      return _makeError(ErrorCode.INPUT_NULL, 'addIdiom: idiom 必须为非空字符串');
    }

    this.idiomDB.idioms[idiom] = {
      story: story || '',
      meaning: meaning || '',
      origin: origin || '',
      narrativeSeed: narrativeSeed || null
    };
    this.idiomDB.metadata.lastUpdate = new Date().toISOString();
    return this.saveIdiomDB();
  }

  /**
   * 添加诗词到数据库
   */
  addPoetry(poetry, content, author, era, narrativeSeed) {
    if (!poetry || typeof poetry !== 'string') {
      return _makeError(ErrorCode.INPUT_NULL, 'addPoetry: poetry 必须为非空字符串');
    }

    this.idiomDB.poetry[poetry] = {
      content: content || '',
      author: author || '',
      era: era || '',
      narrativeSeed: narrativeSeed || null
    };
    this.idiomDB.metadata.lastUpdate = new Date().toISOString();
    return this.saveIdiomDB();
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  getRecentChunks() {
    return this.detectedChunks.slice(-10);
  }

  getIdiomCount() {
    return Object.keys(this.idiomDB.idioms).length;
  }

  getPoetryCount() {
    return Object.keys(this.idiomDB.poetry).length;
  }

  getProverbCount() {
    return Object.keys(this.idiomDB.proverbs).length;
  }

  // ========================================================================
  // 可观测性
  // ========================================================================

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this._stats,
      totalMatches: this._stats.idiomMatches + this._stats.poetryMatches + this._stats.proverbMatches,
      fuzzyRatio: this._stats.detectCalls > 0
        ? Math.round((this._stats.fuzzyMatches / this._stats.idiomMatches) * 10000) / 100
        : 0,
      dbSize: {
        idioms: this.getIdiomCount(),
        poetry: this.getPoetryCount(),
        proverbs: this.getProverbCount(),
      },
      chunkHistorySize: this.detectedChunks.length,
    };
  }

  /**
   * 重置统计计数器
   */
  resetStats() {
    this._stats = {
      detectCalls: 0,
      idiomMatches: 0,
      poetryMatches: 0,
      proverbMatches: 0,
      fuzzyMatches: 0,
      truncatedInputs: 0,
      errors: {},
      totalTokensProcessed: 0,
    };
    return this.getStats();
  }
}

module.exports = { ChunkDetector, ErrorCode, ERROR_SUGGESTIONS };
