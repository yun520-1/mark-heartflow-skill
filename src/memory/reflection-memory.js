/**
 * ReflectionMemory — 反思记忆独立存储 v1.0.0
 *
 * 基于 Reflexion (arXiv:2303.11366) 论文：
 * 将反思从元记忆中独立出来，作为特殊记忆类型存储，
 * 支持跨会话检索——新任务开始时，检索相关历史反思。
 *
 * 架构：
 *   - 反思记录：每次任务失败/成功后生成结构化反思
 *   - 策略库：从反思中提取的可复用策略
 *   - 模式匹配：相似场景匹配历史反思
 *
 * 集成:
 *   hf.reflectionMemory.store(task, result, reflection)
 *   hf.reflectionMemory.search(query, limit)
 *   hf.reflectionMemory.getStrategies()
 *   hf.reflectionMemory.getStats()
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VERSION = '1.0.0';
const DATA_DIR = path.join(require('os').tmpdir(), 'heartflow-reflection');

class ReflectionMemory {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxReflections: options.maxReflections || 500,
      maxStrategies: options.maxStrategies || 100,
      similarityThreshold: options.similarityThreshold || 0.1,
      dataDir: options.dataDir || DATA_DIR,
    };

    this.reflections = [];
    this.strategies = new Map();
    this.patternIndex = new Map(); // pattern → [reflectionIds]

    this._ensureDir();
    this._load();
  }

  // ─── 核心 API ─────────────────────────────────────────────────────────────

  /**
   * 存储一次反思记录
   * @param {Object} task - 任务描述 {input, context}
   * @param {Object} result - 结果 {success, output, error}
   * @param {string} reflection - 反思文本
   * @returns {Object} 反思记录
   */
  store(task, result, reflection) {
    const record = {
      id: `refl-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: Date.now(),
      task: {
        input: (task.input || '').slice(0, 500),
        context: task.context || {},
        type: task.type || 'unknown',
      },
      result: {
        success: !!result.success,
        error: result.error || null,
        output: (result.output || '').slice(0, 200),
      },
      reflection: (reflection || '').slice(0, 1000),
      tags: this._extractTags(task.input || '', reflection || ''),
      lesson: this._extractLesson(result, reflection),
    };

    this.reflections.push(record);

    // 索引模式
    for (const tag of record.tags) {
      if (!this.patternIndex.has(tag)) {
        this.patternIndex.set(tag, []);
      }
      this.patternIndex.get(tag).push(record.id);
    }

    // 如果有 lessons，提取/更新策略
    if (record.lesson) {
      this._updateStrategies(record);
    }

    // 裁剪
    if (this.reflections.length > this.config.maxReflections) {
      this.reflections = this.reflections.slice(-this.config.maxReflections);
    }

    this._save();
    return record;
  }

  /**
   * 基于语义相似度搜索历史反思
   * 支持中文（字符n-gram）和英文（词级）匹配
   * @param {string} query - 查询文本
   * @param {number} [limit=5] - 返回数量
   * @returns {Array} 匹配的反思记录
   */
  search(query, limit = 5) {
    if (!query || this.reflections.length === 0) return [];

    const hasCJK = /[一-鿿぀-ゟ가-힯]/.test(query);

    const queryTokens = hasCJK
      ? new Set(this._charNgrams(query, 2))
      : new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 1));

    const scored = this.reflections.map(refl => {
      const text = `${refl.task.input} ${refl.reflection} ${refl.tags.join(' ')}`;
      const reflTokens = hasCJK
        ? new Set(this._charNgrams(text, 2))
        : new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 1));

      let overlap;
      if (hasCJK) {
        overlap = [...queryTokens].filter(w => reflTokens.has(w)).length;
      } else {
        overlap = [...queryTokens].filter(w => reflTokens.has(w)).length;
      }

      const denominator = Math.sqrt(queryTokens.size * Math.max(1, reflTokens.size));
      const similarity = denominator > 0 ? overlap / denominator : 0;

      return { ...refl, similarity };
    });

    return scored
      .filter(r => r.similarity >= this.config.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 生成字符n-gram（用于中文等无空格语言）
   * @private
   */
  _charNgrams(text, n = 2) {
    const chars = text.toLowerCase().replace(/\s+/g, '');
    const grams = [];
    for (let i = 0; i <= chars.length - n; i++) {
      grams.push(chars.substring(i, i + n));
    }
    return grams;
  }

  /**
   * 获取学到的策略
   * @returns {Array} 策略列表
   */
  getStrategies() {
    return [...this.strategies.values()].sort((a, b) => b.successCount - a.successCount);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const successes = this.reflections.filter(r => r.result.success).length;
    const failures = this.reflections.length - successes;
    return {
      version: this.version,
      totalReflections: this.reflections.length,
      totalStrategies: this.strategies.size,
      successes,
      failures,
      successRate: this.reflections.length > 0 ? (successes / this.reflections.length).toFixed(2) : 0,
      patterns: this.patternIndex.size,
      config: this.config,
    };
  }

  /**
   * 重置所有数据
   */
  reset() {
    this.reflections = [];
    this.strategies.clear();
    this.patternIndex.clear();
    this._save();
  }

  // ─── 内部方法 ──────────────────────────────────────────────────────────────

  /**
   * 从反思中提取标签
   * @private
   */
  _extractTags(input, reflection) {
    const tags = new Set();
    const text = `${input} ${reflection}`.toLowerCase();

    // 任务类型标签
    if (/错误|失败|bug|error|fail/.test(text)) tags.add('failure');
    if (/成功|通过|正确|success|pass/.test(text)) tags.add('success');
    if (/推理|思考|分析|reason/.test(text)) tags.add('reasoning');
    if (/记忆|忘记|recall|memory/.test(text)) tags.add('memory');
    if (/决策|选择|决定|decision/.test(text)) tags.add('decision');
    if (/情感|情绪|emotion/.test(text)) tags.add('emotion');
    if (/代码|编程|code/.test(text)) tags.add('code');
    if (/搜索|查找|search/.test(text)) tags.add('search');

    return [...tags];
  }

  /**
   * 从反思中提取经验教训
   * @private
   */
  _extractLesson(result, reflection) {
    if (!reflection || reflection.length < 10) return null;

    const text = reflection.toLowerCase();
    // 检测显式的"应该/不应该"模式
    const shouldMatch = text.match(/应该([^。，；\n]{3,30})/);
    const shouldNotMatch = text.match(/不应该([^。，；\n]{3,30})/);
    const alwaysMatch = text.match(/(总是|始终)([^。，；\n]{3,30})/);
    const neverMatch = text.match(/(绝不|从不|永远不要)([^。，；\n]{3,30})/);

    if (shouldMatch) return { type: 'should', content: shouldMatch[1].trim() };
    if (shouldNotMatch) return { type: 'should_not', content: shouldNotMatch[1].trim() };
    if (alwaysMatch) return { type: 'always', content: alwaysMatch[2].trim() };
    if (neverMatch) return { type: 'never', content: neverMatch[1].trim() };

    return null;
  }

  /**
   * 更新策略库
   * @private
   */
  _updateStrategies(record) {
    if (!record.lesson) return;

    const key = record.lesson.content;
    const existing = this.strategies.get(key);

    if (existing) {
      existing.usageCount++;
      existing.successCount += record.result.success ? 1 : 0;
      existing.lastUsed = record.timestamp;
    } else {
      this.strategies.set(key, {
        content: record.lesson.content,
        type: record.lesson.type,
        successCount: record.result.success ? 1 : 0,
        usageCount: 1,
        firstUsed: record.timestamp,
        lastUsed: record.timestamp,
        sourceReflection: record.id,
      });
    }

    // 裁剪策略数
    if (this.strategies.size > this.config.maxStrategies) {
      const sorted = [...this.strategies.entries()].sort((a, b) => a[1].usageCount - b[1].usageCount);
      for (let i = 0; i < sorted.length - this.config.maxStrategies; i++) {
        this.strategies.delete(sorted[i][0]);
      }
    }
  }

  // ─── 持久化 ────────────────────────────────────────────────────────────────

  _ensureDir() {
    try { fs.mkdirSync(this.config.dataDir, { recursive: true }); } catch (e) { /* non-fatal */ }
  }

  _load() {
    const file = path.join(this.config.dataDir, 'reflection-memory.json');
    if (!fs.existsSync(file)) return;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      this.reflections = data.reflections || [];
      this.strategies = new Map(data.strategies || []);
      this.patternIndex = new Map(data.patternIndex || []);
    } catch (e) { /* non-fatal */ }
  }

  _save() {
    try {
      const data = JSON.stringify({r: this.reflections, s: Array.from(this.strategies), p: Array.from(this.patternIndex)});
      fs.writeFileSync(path.join(this.config.dataDir, "reflection-memory.json"), data);
    } catch (e) {}
  }

}

module.exports = { ReflectionMemory };
