/**
 * HeartFlow CodeGenerator v2.0.0
 *
 * 代码生成引擎核心 — 心虫核心模块
 *
 * 特性：
 * - 本地模板优先（零成本），LLM 作为 fallback
 * - 支持 6 种语言：javascript, typescript, python, bash, go, rust
 * - 模板按语言+类型分类：algorithm/structure/network/io
 * - 生成结果带置信度评分
 * - 与 MeaningfulMemory 打通，记录成功生成模式
 *
 * @author HeartFlow Team
 */

const { PromptFactory, LANGUAGE_PATTERNS, INTENT_PATTERNS, TEMPLATES } = require('./prompt-factory');
const { CodeValidator } = require('./generator-validator');

// ============================================================
// 代码生成引擎主类
// ============================================================

/**
 * 代码生成引擎 — 通过模板匹配或 LLM 生成代码
 *
 * @class CodeGenerator
 */
class CodeGenerator {
  /**
   * 构造函数
   *
   * @param {Object} [options={}] - 配置选项
   * @param {Object} [options.hf] - 心虫引擎引用（用于 LLM fallback 和记忆记录）
   */
  constructor({ hf } = {}) {
    /** @type {Object|null} 心虫引擎引用 */
    this.hf = hf;
    /** @type {Object} 模板库，按语言+类型组织 */
    this.templates = TEMPLATES;
    /** @type {Object} 语言检测模式 */
    this.languagePatterns = LANGUAGE_PATTERNS;
    /** @type {Object} 意图检测模式 */
    this.intentPatterns = INTENT_PATTERNS;

    // 子模块实例
    /** @type {PromptFactory} 提示词工厂 */
    this.promptFactory = new PromptFactory({ hf });
    /** @type {CodeValidator} 代码验证器 */
    this.codeValidator = new CodeValidator({ hf });

    // 统计信息
    /** @type {{templateHits: number, llmHits: number, totalGenerations: number}} */
    this.stats = {
      templateHits: 0,
      llmHits: 0,
      totalGenerations: 0
    };
  }

  // ============================================================
  // 公开 API
  // ============================================================

  /**
   * 主生成方法 — 根据任务描述生成代码
   *
   * @param {string} task - 任务描述（自然语言）
   * @param {string} [language='javascript'] - 目标语言，或 'auto' 自动检测
   * @param {Object} [options={}] - 附加选项
   * @returns {Promise<Object>} 生成结果
   * @returns {boolean}   return.success - 是否成功
   * @returns {string|null} return.code - 生成的代码
   * @returns {string|null} return.language - 实际使用的语言
   * @returns {string|null} return.filePath - 输出文件路径（如有）
   * @returns {Object|null} return.metadata - 元数据（source, confidence, intent 等）
   * @returns {string|null} return.error - 错误信息（失败时）
   */
  async generate(task, language = 'javascript', options = {}) {
    this.stats.totalGenerations++;

    // 1. 检测意图和语言
    const intent = this.detectIntent(task);
    const detectedLanguage = language === 'auto' ? intent.language : language;

    // 2. 验证语言支持
    if (!this.isLanguageSupported(detectedLanguage)) {
      return {
        success: false,
        error: `语言 "${detectedLanguage}" 不支持。支持的列表: ${this.getSupportedLanguages().join(', ')}`,
        code: null,
        language: null,
        filePath: null,
        metadata: null
      };
    }

    // 3. 尝试从本地模板获取
    const templateResult = this.findTemplate(detectedLanguage, intent.type, task);

    if (templateResult) {
      this.stats.templateHits++;
      return {
        success: true,
        code: templateResult.code,
        language: detectedLanguage,
        filePath: null,
        metadata: {
          source: 'template',
          templateName: templateResult.name,
          confidence: templateResult.confidence,
          intent: intent,
          llmUsed: false
        }
      };
    }

    // 4. 回退到 LLM 生成
    this.stats.llmHits++;
    return await this._generateWithLLM(task, detectedLanguage, intent, options);
  }

  /**
   * 生成代码并写入文件
   *
   * @param {string} task - 任务描述
   * @param {string} filePath - 输出文件路径
   * @param {Object} [options={}] - 附加选项
   * @returns {Promise<Object>} 生成结果（同 generate()，附加 filePath 字段）
   */
  async generateFile(task, filePath, options = {}) {
    // 检测语言
    const ext = require('path').extname(filePath).toLowerCase();
    const language = this._detectLanguageFromExtension(ext);

    // 生成代码
    const result = await this.generate(task, language, options);

    if (!result.success) {
      return result;
    }

    // 写入文件
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(filePath);

      // 确保目录存在
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, result.code, 'utf-8');

      // 更新返回值
      result.filePath = filePath;
      result.metadata.filePath = filePath;

      // 记录到记忆系统
      await this._recordGeneration(task, result);

      return result;
    } catch (err) {
      return {
        success: false,
        error: `写入文件失败: ${err.message}`,
        code: result.code,
        language: result.language,
        filePath: null,
        metadata: result.metadata
      };
    }
  }

  /**
   * 识别文本中的语言和意图
   *
   * @param {string} text - 输入文本（任务描述或文件路径）
   * @returns {Object} 识别结果
   * @returns {string|null} return.language - 检测到的语言
   * @returns {string|null} return.type - 意图类型（algorithm/structure/network/io/cli）
   * @returns {number} return.confidence - 置信度 (0-1)
   * @returns {string[]} return.keywords - 匹配到的关键词
   * @returns {string} return.raw - 原始输入文本
   */
  detectIntent(text) {
    const lowerText = text.toLowerCase();
    const result = {
      language: null,
      type: null,
      confidence: 0,
      keywords: [],
      raw: text
    };

    // 检测语言
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      let langScore = 0;

      // 关键词匹配
      for (const keyword of pattern.keywords) {
        if (lowerText.includes(keyword)) {
          langScore += 0.3;
          result.keywords.push(keyword);
        }
      }

      // 扩展名匹配
      for (const ext of pattern.extensions) {
        if (lowerText.includes(ext)) {
          langScore += 0.4;
        }
      }

      // 代码模式匹配
      for (const pat of pattern.patterns) {
        const regex = new RegExp(pat, 'i');
        if (regex.test(text)) {
          langScore += 0.2;
        }
      }

      if (langScore > result.confidence) {
        result.confidence = langScore;
        result.language = lang;
      }
    }

    // 默认语言
    if (!result.language || result.confidence < 0.2) {
      result.language = 'javascript';
      result.confidence = 0.5;
    }

    // 检测意图类型
    for (const [type, keywords] of Object.entries(this.intentPatterns)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          result.type = type;
          break;
        }
      }
      if (result.type) break;
    }

    // 默认类型
    if (!result.type) {
      result.type = this._guessIntentType(text);
    }

    return result;
  }

  /**
   * 返回可用模板列表（按语言和类型组织）
   *
   * @returns {Object} 按语言和类型组织的模板列表
   * @returns {Object<string, Object>} return[language] - 每种语言的模板
   * @returns {Array} return[language][category] - 该类别的模板列表
   */
  getAvailableTemplates() {
    const result = {};

    for (const [lang, categories] of Object.entries(this.templates)) {
      result[lang] = {};

      for (const [category, templates] of Object.entries(categories)) {
        result[lang][category] = Object.entries(templates).map(([key, tmpl]) => ({
          id: key,
          name: tmpl.name,
          description: tmpl.description,
          confidence: tmpl.confidence
        }));
      }
    }

    return result;
  }

  /**
   * 获取支持的编程语言列表
   *
   * @returns {string[]} 支持的语言列表
   */
  getSupportedLanguages() {
    return Object.keys(this.templates);
  }

  /**
   * 检查语言是否支持
   *
   * @param {string} language - 语言名
   * @returns {boolean} 是否支持
   */
  isLanguageSupported(language) {
    return language in this.templates;
  }

  /**
   * 获取生成统计信息
   *
   * @returns {Object} 统计信息
   * @returns {number} return.totalGenerations - 总生成次数
   * @returns {number} return.templateHits - 模板命中次数
   * @returns {number} return.llmHits - LLM 调用次数
   * @returns {string} return.templateHitRate - 模板命中率百分比
   */
  getStats() {
    return {
      ...this.stats,
      templateHitRate: this.stats.totalGenerations > 0
        ? (this.stats.templateHits / this.stats.totalGenerations * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 查找本地模板
   * @private
   * @param {string} language - 目标语言
   * @param {string} intentType - 意图类型
   * @param {string} task - 任务描述
   * @returns {Object|null} 匹配的模板对象，或 null
   */
  findTemplate(language, intentType, task) {
    const templates = this.templates[language];
    if (!templates) return null;

    const lowerTask = task.toLowerCase();

    // 首先按意图类型查找
    if (intentType && templates[intentType]) {
      const categoryTemplates = templates[intentType];

      for (const [key, tmpl] of Object.entries(categoryTemplates)) {
        // 检查模板名或描述是否匹配任务
        if (lowerTask.includes(tmpl.name.toLowerCase()) ||
            lowerTask.includes(tmpl.description.toLowerCase()) ||
            key.includes(lowerTask.replace(/\s+/g, '-'))) {
          return tmpl;
        }
      }

      // 按匹配度排序后返回最佳模板
      const sorted = Object.values(categoryTemplates)
        .map(tmpl => ({
          tmpl,
          score: (lowerTask.includes(tmpl.name.toLowerCase()) ? 10 : 0) +
                 (lowerTask.includes(tmpl.description.toLowerCase()) ? 5 : 0) +
                 (tmpl.tags && tmpl.tags.some(t => lowerTask.includes(t)) ? 3 : 0)
        }))
        .sort((a, b) => b.score - a.score);

      // 如果最佳模板完全不相关（分数为0），返回null让上层走LLM生成
      if (sorted.length > 0 && sorted[0].score > 0) {
        return sorted[0].tmpl;
      }
      // 无匹配模板，返回null以触发LLM生成
      return null;
    }

    // 在所有类别中搜索
    for (const category of Object.keys(templates)) {
      for (const [key, tmpl] of Object.entries(templates[category])) {
        if (lowerTask.includes(tmpl.name.toLowerCase()) ||
            lowerTask.includes(tmpl.description.toLowerCase())) {
          return tmpl;
        }
      }
    }

    return null;
  }

  /**
   * 使用 LLM 生成代码
   * @private
   * @param {string} task - 任务描述
   * @param {string} language - 目标语言
   * @param {Object} intent - 意图信息
   * @param {Object} [options={}] - 选项
   * @returns {Promise<Object>} 生成结果
   */
  async _generateWithLLM(task, language, intent, options = {}) {
    const prompt = this.promptFactory.buildPrompt(task, language, intent);

    try {
      let code = null;

      // 优先尝试 hf.dispatch
      if (this.hf && typeof this.hf.dispatch === 'function') {
        const response = await this.hf.dispatch('generate', { task, language, intent, options });
        if (response && response.code) {
          code = response.code;
        }
      }

      // 回退到 _llmClient
      if (!code && this.hf && this.hf._llmClient) {
        const response = await this.hf._llmClient.generate(prompt);
        if (response && response.text) {
          code = this.codeValidator.extractCode(response.text);
        }
      }

      // 最后回退到直接调用
      if (!code && this.hf && typeof this.hf.generate === 'function') {
        const response = await this.hf.generate(prompt);
        if (response) {
          code = typeof response === 'string' ? response : response.code || response.text;
        }
      }

      if (code) {
        return {
          success: true,
          code: code,
          language: language,
          filePath: null,
          metadata: {
            source: 'llm',
            intent: intent,
            llmUsed: true,
            prompt: prompt.substring(0, 100) + '...'
          }
        };
      }

      return {
        success: false,
        error: 'LLM 生成失败：无法获取代码生成结果',
        code: null,
        language: language,
        filePath: null,
        metadata: null
      };
    } catch (err) {
      return {
        success: false,
        error: `LLM 生成失败: ${err.message}`,
        code: null,
        language: language,
        filePath: null,
        metadata: null
      };
    }
  }

  /**
   * 根据文件扩展名检测语言
   * @private
   * @param {string} ext - 文件扩展名（含点，如 '.js'）
   * @returns {string} 检测到的语言名
   */
  _detectLanguageFromExtension(ext) {
    const extMap = {
      '.js': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.pyw': 'python',
      '.sh': 'bash',
      '.bash': 'bash',
      '.go': 'go',
      '.rs': 'rust'
    };

    return extMap[ext] || 'javascript';
  }

  /**
   * 根据文本内容猜测意图类型
   * @private
   * @param {string} text - 输入文本
   * @returns {string} 意图类型（algorithm/structure/network/io/cli）
   */
  _guessIntentType(text) {
    const lowerText = text.toLowerCase();

    // 基于关键词模式猜测
    if (/algorithm|排序|查找|搜索|sorter|binary/.test(lowerText)) {
      return 'algorithm';
    }
    if (/server|http|api|请求|endpoint/.test(lowerText)) {
      return 'network';
    }
    if (/file|文件|读写|read|write/.test(lowerText)) {
      return 'io';
    }
    if (/class|struct|结构|链表|tree/.test(lowerText)) {
      return 'structure';
    }

    return 'algorithm'; // 默认类型
  }

  /**
   * 记录生成结果到记忆系统
   * @private
   * @param {string} task - 任务描述
   * @param {Object} result - 生成结果
   */
  async _recordGeneration(task, result) {
    if (!this.hf || !this.hf.meaningfulMemory) return;

    try {
      await this.hf.meaningfulMemory.remember(
        `code-gen:${Date.now()}`,
        {
          task: task,
          language: result.language,
          template: result.metadata?.templateName || 'llm',
          success: result.success,
          timestamp: new Date().toISOString()
        },
        'ephemeral'
      );
    } catch (err) {
      // 静默失败，不影响主流程
      console.warn('记录生成结果失败:', err.message);
    }
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = { CodeGenerator };
