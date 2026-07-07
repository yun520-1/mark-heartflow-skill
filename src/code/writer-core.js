/**
 * writer-core.js — 代码编写引擎核心逻辑 v1.1.0
 *
 * 不包含任何语言特定的代码模板；所有模板由 language-adapters/*.js 提供。
 * CodeWriter 通过 adapter 接口动态获取模板、测试生成器和格式化规则。
 *
 * 架构：
 *   code-writer.js  (facade — 预装所有适配器，导出 CodeWriter)
 *   writer-core.js  (核心逻辑 — 意图分析、代码组合、审查、格式化)
 *   language-adapters/*.js (语言特定 — 模板、测试、格式化规则)
 *
 * @module writer-core
 * @permission execute_code — 生成可直接执行的代码，请谨慎使用
 */

'use strict';

// ============================================================================
// 意图类别枚举
// ============================================================================

/** 意图类别枚举 — 18种代码生成意图 */
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

/** 意图置信度等级 */
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
// 默认参数提取器
// ============================================================================

/** 默认参数提取器 — 从自然语言描述中提取结构化参数 */
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
// CodeWriter 核心类
// ============================================================================

class CodeWriter {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxCodeLength=50000] - 最大代码长度
   * @param {Object} [options.adapters={}] - 语言适配器映射 { languageName: adapter }
   */
  constructor(options = {}) {
    this.maxCodeLength = options.maxCodeLength || 50000;
    this.generatedCount = 0;
    this._generationLog = [];
    this._adapters = options.adapters || {};
  }

  /**
   * 获取指定语言的适配器，不存在则返回 null
   * @param {string} language
   * @returns {Object|null}
   */
  _getAdapter(language) {
    return this._adapters[language] || null;
  }

  /**
   * 获取默认（JavaScript）适配器
   * @returns {Object}
   */
  _getDefaultAdapter() {
    return this._getAdapter('javascript') || this._getAdapter(Object.keys(this._adapters)[0]) || null;
  }

  // ==========================================================================
  // 意图分析
  // ==========================================================================

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
      ambiguity: secondScore >= topScore * 0.7
    };
  }

  // ==========================================================================
  // 代码生成
  // ==========================================================================

  /**
   * 根据需求描述生成代码
   * @param {string} description - 自然语言描述
   * @param {Object} [options]
   * @param {string} [options.language='javascript'] - 生成语言
   * @param {boolean} [options.includeTests=false] - 是否包含测试代码
   * @returns {Object} { code, intent, confidence, testCode?, language, ... }
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

    // 通过适配器获取语言特定模板
    const adapter = this._getAdapter(language);
    const template = adapter?.templates?.[analysis.primaryIntent];

    if (!template) {
      // 回退：如果该语言没有该意图的模板，尝试使用 JavaScript 适配器
      const fallbackAdapter = this._getDefaultAdapter();
      const fallbackTemplate = fallbackAdapter?.templates?.[analysis.primaryIntent];
      if (fallbackTemplate) {
        const code = fallbackTemplate(analysis.params);
        this.generatedCount++;

        let testCode = null;
        if (includeTests && adapter) {
          const funcName = this._resolveFuncName(analysis.primaryIntent);
          testCode = adapter.generateTest(analysis.primaryIntent, analysis.params, funcName);
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

    // 使用适配器模板生成代码
    const code = template(analysis.params);
    this.generatedCount++;

    // 生成测试代码（通过适配器）
    let testCode = null;
    if (includeTests && adapter) {
      const funcName = this._resolveFuncName(analysis.primaryIntent);
      testCode = adapter.generateTest(analysis.primaryIntent, analysis.params, funcName);
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

  // ==========================================================================
  // 代码审查
  // ==========================================================================

  /**
   * 审查生成的代码
   * @param {string} code - 生成的代码
   * @param {Object} [options]
   * @param {string} [options.language] - 语言（用于语言特定的结构检查）
   * @returns {Object} 审查结果
   */
  reviewCode(code, options = {}) {
    if (!code) return { valid: false, issues: ['代码为空'] };

    const { language } = options;
    const adapter = language ? this._getAdapter(language) : this._getDefaultAdapter();
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

    // 完整性检查 — 使用适配器的语言特定结构关键字
    const keywords = adapter?.structureKeywords || ['function', 'class', 'async', 'def '];
    const hasStructure = keywords.some(kw => code.includes(kw));
    if (!hasStructure) {
      issues.push({ type: 'structure', message: '代码中未检测到函数/类定义', severity: 'info' });
    }

    // 注释完整性检查
    const lines = code.split('\n');
    const commentPrefixes = adapter?.commentPrefixes || ['//', '#', '/*', '*', '"""'];
    const commentLines = lines.filter(l => {
      const trimmed = l.trim();
      return commentPrefixes.some(prefix => trimmed.startsWith(prefix));
    });
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

  // ==========================================================================
  // 代码格式化
  // ==========================================================================

  /**
   * 格式化代码（通用格式化，语言特定缩进由适配器提供）
   * @param {string} code - 原始代码
   * @param {Object} [options]
   * @param {string} [options.language] - 语言（用于语言特定的缩进设置）
   * @returns {string} 格式化后的代码
   */
  formatCode(code, options = {}) {
    if (!code) return '';

    const { language } = options;
    const adapter = language ? this._getAdapter(language) : this._getDefaultAdapter();
    const indentSize = adapter?.indentSize || 2;

    let formatted = code;

    // 缩进标准化
    formatted = formatted.replace(/\t/g, '  ');
    formatted = formatted.replace(/^(  )+/gm, (match) => {
      return '  '.repeat(Math.ceil(match.length / indentSize));
    });

    // 尾随空格清理
    formatted = formatted.replace(/[ \t]+$/gm, '');

    // 空行规范化
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
    formatted = formatted.replace(/^\n+/, '');
    formatted = formatted.replace(/\n+$/, '\n');

    // 逗号后加空格（如果缺失）
    formatted = formatted.replace(/,(?!\s)/g, ', ');

    return formatted;
  }

  // ==========================================================================
  // 测试生成
  // ==========================================================================

  /**
   * 生成测试代码（内部方法，通过适配器分发）
   * @param {string} intent - 意图
   * @param {Object} params - 参数
   * @param {string} language - 语言
   * @returns {string} 测试代码
   */
  _generateTest(intent, params, language = 'javascript') {
    const adapter = this._getAdapter(language);
    if (adapter?.generateTest) {
      const funcName = this._resolveFuncName(intent);
      return adapter.generateTest(intent, params, funcName);
    }
    // 回退到 JavaScript 适配器
    const fallbackAdapter = this._getDefaultAdapter();
    if (fallbackAdapter?.generateTest) {
      const funcName = this._resolveFuncName(intent);
      return fallbackAdapter.generateTest(intent, params, funcName);
    }
    return '// 无法生成测试代码：未找到适配器';
  }

  /**
   * 根据意图解析函数/类名
   * @param {string} intent
   * @returns {string}
   */
  _resolveFuncName(intent) {
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
    return nameMap[intent] || 'main';
  }

  // ==========================================================================
  // 元数据
  // ==========================================================================

  /**
   * 获取支持的意图列表
   * @returns {Array} 每个意图的支持情况
   */
  getSupportedIntents() {
    const adapterNames = Object.keys(this._adapters);
    return Object.values(INTENT).map(intent => {
      const entry = {
        intent,
        keywords: INTENT_RULES.find(r => r.intent === intent)?.keywords || []
      };
      for (const name of adapterNames) {
        entry[`has${name.charAt(0).toUpperCase() + name.slice(1)}Template`] =
          !!this._adapters[name].templates[intent];
      }
      return entry;
    });
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
