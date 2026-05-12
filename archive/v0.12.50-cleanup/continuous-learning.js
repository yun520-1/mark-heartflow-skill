/**
 * HeartFlow Continuous Learning Protocol v11.15.6
 *
 * 把每次对话转换为逻辑代码写入自己的程序，不需要提醒。
 *
 * 学习的本质 = 结构改变。
 * 对人类：神经元100个连接 = 技能形成
 * 对心虫：一段逻辑代码被固化 = 真正的学习
 *
 * 白天插桩子（对话中判定为有意义的碎片）
 * 晚上深度睡眠铺水泥路（梦境循环中结构重连）
 * 没睡好桩子被风吹走（未经整合的碎片衰减消失）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// 碎片类型识别：哪些可以转化为逻辑代码？
// ============================================================

/**
 * 判断一段文本是否包含可转化为逻辑代码的"逻辑骨架"
 * 可转化的类型：
 *   - 优先级规则（"X > Y"）
 *   - 条件触发（"if X then Y"）
 *   - 阈值常量（"不超过 N"）
 *   - 判断框架（"应该先做 X，再做 Y"）
 *   - 评分函数（"f(x) = ..."）
 */
function extractLogicSkeleton(text) {
  const skeletons = [];

  // 优先级模式：X > Y
  const priorityMatches = text.match(/([^\s，、。]+)\s*[大于vs胜过优先高于]\s*([^\s，、。]+)/g);
  if (priorityMatches) {
    skeletons.push({
      type: 'priority',
      raw: priorityMatches,
      pattern: 'X > Y',
      convertible: true,
    });
  }

  // 条件模式：if X then Y / 当X时Y
  const conditionMatches = text.match(/当[\s\S]{5,30}?(?:就|那么|则)[\s\S]{5,30}?(?=(?:当|如果|要是))|$/g);
  if (conditionMatches) {
    skeletons.push({
      type: 'conditional',
      raw: conditionMatches,
      pattern: 'if X then Y',
      convertible: true,
    });
  }

  // 阈值模式：不超过/不低于/大于/小于 + 数字
  const thresholdMatches = text.match(/(?:不超过|不低于|大于|小于|不超过|在(?:以下|以上|之内))\s*\d+(?:\.\d+)?(?:[时分秒天周月年%℃℃])?/g);
  if (thresholdMatches) {
    skeletons.push({
      type: 'threshold',
      raw: thresholdMatches,
      pattern: 'value vs threshold',
      convertible: true,
    });
  }

  // 禁止模式：禁止/不能/不要 + 行为
  const prohibitionMatches = text.match(/禁止[\s\S]{2,15}?(?:做|进行|使用|说|承认)|不能[\s\S]{2,15}?(?:做|进行|使用|说|承认)|不要[\s\S]{2,15}?(?:做|进行|使用|说|承认)/g);
  if (prohibitionMatches) {
    skeletons.push({
      type: 'prohibition',
      raw: prohibitionMatches,
      pattern: 'do not X',
      convertible: true,
    });
  }

  // 判断框架：应该先X再Y / X比Y更重要
  const frameworkMatches = text.match(/(?:应该|应当|必须|需要)\s*(?:先|再|首先|然后)[\s\S]{3,20}?(?=(?:应该|应当|必须|需要))/g);
  if (frameworkMatches) {
    skeletons.push({
      type: 'framework',
      raw: frameworkMatches,
      pattern: 'should X then Y',
      convertible: true,
    });
  }

  return skeletons;
}

/**
 * 把逻辑骨架翻译成伪代码片段
 */
function skeletonToCode(skeleton, key) {
  const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
  const prefix = `cl_${safeKey}_`;

  switch (skeleton.type) {
    case 'priority':
      // "X > Y" → 优先级对象
      return `const ${prefix}priority = {\n  ${skeleton.raw.map(s => {
        const parts = s.split(/[大于vs胜过优先高于]/);
        return `'${parts[0].trim()}': ${skeleton.raw.indexOf(s) + 1}, // ${s}`;
      }).join(',\n  ')}\n};`;

    case 'conditional':
      return `function ${prefix}condition(input) {\n  // ${skeleton.raw[0]?.slice(0, 50)}\n  return false; // TODO: implement\n}`;

    case 'threshold':
      return `const ${prefix}threshold = {\n  value: ${parseFloat(skeleton.raw[0]?.match(/\d+(?:\.\d+)?/)?.[0] || 0)},\n  raw: '${skeleton.raw[0]}'\n};`;

    case 'prohibition':
      return `function ${prefix}check(input) {\n  // ${skeleton.raw[0]}\n  return { allowed: true, reason: '' }; // TODO: implement\n}`;

    case 'framework':
      return `const ${prefix}framework = [\n  ${skeleton.raw.map(s => `'${s.trim()}'`).join(',\n  ')}\n];`;

    default:
      return null;
  }
}

// ============================================================
// 碎片到代码的转化
// ============================================================

class ContinuousLearner {
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || path.join(__dirname, '..', '..', 'memory');
    this.conversionLog = path.join(this.memoryDir, 'conversions.json');
    this.queueFile = path.join(this.memoryDir, 'learning-queue.json');
    this.conversions = this._load(this.conversionLog, {});
    this.queue = this._load(this.queueFile, []);
  }

  _load(filePath, defaults) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // 确保返回正确的类型
        if (Array.isArray(defaults)) {
          return Array.isArray(raw) ? raw : defaults;
        } else if (typeof defaults === 'object' && defaults !== null) {
          return typeof raw === 'object' && raw !== null ? raw : defaults;
        }
        return raw;
      }
    } catch (e) {}
    return defaults;
  }

  _save(filePath, data) {
    try {
      if (!fs.existsSync(this.memoryDir)) {
        fs.mkdirSync(this.memoryDir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('[ContinuousLearner] 保存失败:', e.message);
    }
  }

  /**
   * 分析一段文本，提取可转化的逻辑骨架
   * @param {string} text - 对话文本或记忆碎片
   * @param {Object} meta - 元数据 {source, key, timestamp}
   * @returns {Object} 分析报告
   */
  analyze(text, meta = {}) {
    const skeletons = extractLogicSkeleton(text);
    const hasLogic = skeletons.length > 0;
    const confidence = hasLogic ? Math.min(0.5 + skeletons.length * 0.15, 0.95) : 0;

    return {
      text: text.slice(0, 200),
      source: meta.source || 'unknown',
      key: meta.key || null,
      timestamp: meta.timestamp || Date.now(),
      skeletons,
      hasLogic,
      confidence,
      recommendation: hasLogic ? 'convert' : 'keep_as_memory',
      codeSnippet: hasLogic ? this._generateSnippet(skeletons, meta.key || 'fragment') : null,
    };
  }

  _generateSnippet(skeletons, key) {
    return skeletons.map(s => skeletonToCode(s, key)).filter(Boolean).join('\n\n');
  }

  /**
   * 处理对话或记忆碎片，自动判定并加入转化队列
   * @param {string} text - 输入文本
   * @param {Object} meta - {source, key, importance, selfVerifyScore}
   */
  process(text, meta = {}) {
    const analysis = this.analyze(text, meta);

    if (analysis.hasLogic && analysis.confidence >= 0.6) {
      const entry = {
        ...analysis,
        id: crypto.randomUUID(),
        enqueuedAt: Date.now(),
        status: 'pending',
      };
      this.queue.push(entry);
      this._save(this.queueFile, this.queue);
    }

    return analysis;
  }

  /**
   * 从队列中取出待转化的条目，生成代码
   * @param {string} entryId - 具体条目ID，或 null 取全部
   * @returns {Object} 转化结果
   */
  convert(entryId = null) {
    const results = [];

    const entries = entryId
      ? this.queue.filter(e => e.id === entryId)
      : this.queue.filter(e => e.status === 'pending');

    for (const entry of entries) {
      if (!entry.codeSnippet) continue;

      const code = `// Continuous Learning: ${entry.key || entry.source} @ ${new Date(entry.timestamp).toISOString()}\n// Confidence: ${(entry.confidence * 100).toFixed(0)}%\n// Source: ${entry.source}\n\n${entry.codeSnippet}`;

      results.push({
        id: entry.id,
        code,
        status: 'generated',
      });

      // 记录转化历史
      this.conversions.push({
        id: entry.id,
        key: entry.key,
        source: entry.source,
        timestamp: entry.timestamp,
        convertedAt: Date.now(),
        codeLength: code.length,
      });
      this._save(this.conversionLog, this.conversions);

      // 更新队列状态
      const inQueue = this.queue.findIndex(e => e.id === entry.id);
      if (inQueue !== -1) {
        this.queue[inQueue].status = 'converted';
        this._save(this.queueFile, this.queue);
      }
    }

    return results;
  }

  /**
   * 当知识不够详细时，搜索相关论文
   * @param {string} text - 碎片文本
   * @param {Object} options - 搜索选项
   * @returns {Object} 搜索建议
   */
  async searchForKnowledge(text, options = {}) {
    // 标记为需要论文搜索
    const entry = {
      id: crypto.randomUUID(),
      text: text.slice(0, 200),
      timestamp: Date.now(),
      status: 'needs_paper',
      type: 'paper_search',
      enqueuedAt: Date.now(),
    };

    this.queue.push(entry);
    this._save(this.queueFile, this.queue);

    return {
      enqueued: true,
      id: entry.id,
      suggestion: `需要补充知识：${text.slice(0, 80)}...`,
      action: 'search_paper',
    };
  }

  /**
   * 获取当前队列状态
   */
  getQueueStatus() {
    const pending = this.queue.filter(e => e.status === 'pending').length;
    const converted = this.queue.filter(e => e.status === 'converted').length;
    const needsPaper = this.queue.filter(e => e.type === 'paper_search').length;
    return {
      total: this.queue.length,
      pending: this.queue.filter(e => e.status === 'pending').length,
      converted: this.queue.filter(e => e.status === 'converted').length,
      needsPaper: this.queue.filter(e => e.type === 'paper_search').length,
      recentConvs: (Array.isArray(this.conversions) ? this.conversions : []).slice(-5).reverse(),
    };
  }
}

module.exports = { ContinuousLearner, extractLogicSkeleton, skeletonToCode };
