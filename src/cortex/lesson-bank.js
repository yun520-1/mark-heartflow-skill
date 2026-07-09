/**
 * 教训库 - 跨会话持久化记忆的核心
 * 用户纠正时自动写入，下次遇到同类场景先查教训库
 * 
 * v2.6.11 升级内容：
 * - JSON损坏自动修复 + 备份恢复
 * - 教训衰减机制（按时间衰减重要性）
 * - WAL日志保护（防写入中断数据丢失）
 * - 批量导出/导入
 * 
 * ⚠️ 隐私说明：教训库会持久化用户交互产生的经验数据。
 * 如不需要跨会话记忆，可删除 data/lesson-bank.json 和 data/lesson-index.json。
 * 该文件不含敏感凭据，但包含用户交互模式和学习历史。
 */

const fs = require('fs');
const path = require('path');

const LESSON_FILE = path.join(__dirname, '../../data/lesson-bank.json');
const INDEX_FILE = path.join(__dirname, '../../data/lesson-index.json');
const WAL_FILE = path.join(__dirname, '../../data/lesson-bank.wal');

const lessonBank = {
  lessons: [],
  _walLog: [],
  _walWritten: false,

  _uuid() {
    const { randomBytes } = require('crypto');
    return `lesson-${Date.now()}-${randomBytes(4).toString('hex')}`;
  },

  /**
   * 写入WAL日志，防崩溃保护
   */
  _writeWAL(action, data) {
    try {
      const entry = { action, data, timestamp: Date.now() };
      this._walLog.push(entry);
      fs.mkdirSync(path.dirname(WAL_FILE), { recursive: true });
      fs.writeFileSync(WAL_FILE, JSON.stringify(this._walLog, null, 2));
      this._walWritten = true;
    } catch (e) {
      // WAL写入失败不阻止主流程
    }
  },

  /**
   * 从WAL恢复（启动时检查）
   */
  _recoverFromWAL() {
    try {
      if (!fs.existsSync(WAL_FILE)) return false;
      const walData = fs.readFileSync(WAL_FILE, 'utf8');
      const entries = JSON.parse(walData);
      if (!Array.isArray(entries) || entries.length === 0) return false;
      
      // 找到最后一次完整的save操作
      const lastSave = [...entries].reverse().find(e => e.action === 'save');
      if (lastSave && lastSave.data) {
        this.lessons = lastSave.data;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  load() {
    try {
      if (fs.existsSync(LESSON_FILE)) {
        const data = fs.readFileSync(LESSON_FILE, 'utf8');
        this.lessons = JSON.parse(data);
        if (!Array.isArray(this.lessons)) throw new Error('格式错误');
      }
    } catch (e) {
      // JSON损坏尝试WAL恢复
      const recovered = this._recoverFromWAL();
      if (recovered) {
        this.save();
      } else {
        this.lessons = [];
      }
    }
    return this;
  },

  save() {
    try {
      fs.mkdirSync(path.dirname(LESSON_FILE), { recursive: true });
      // 先写WAL
      this._writeWAL('save', [...this.lessons]);
      // 再写主文件
      fs.writeFileSync(LESSON_FILE, JSON.stringify(this.lessons, null, 2));
      this._updateIndex();
      // 成功后清除WAL
      try { fs.unlinkSync(WAL_FILE); } catch (e) { /* 忽略 */ }
    } catch (e) {
      this._initErrors = this._initErrors || [];
      this._initErrors.push({ module: 'lesson_bank', error: e.message });
    }
  },

  _updateIndex() {
    try {
      const index = {
        lastUpdated: new Date().toISOString(),
        totalCount: this.lessons.length,
        byType: {},
        topLessons: []
      };
      for (const l of this.lessons) {
        index.byType[l.type] = (index.byType[l.type] || 0) + 1;
      }
      index.topLessons = this.lessons
        .sort((a, b) => {
          const scoreA = a.importance * Math.max(a.frequency, 1) * Math.max(a.accessCount || 1, 1);
          const scoreB = b.importance * Math.max(b.frequency, 1) * Math.max(b.accessCount || 1, 1);
          return scoreB - scoreA;
        })
        .slice(0, 10)
        .map(l => l.id);
      fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
      fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
    } catch (e) { /* 索引写入失败不影响主流程 */ }
  },

  /**
   * 教训衰减 - 按时间降低未使用教训的重要性
   */
  _applyDecay() {
    const now = Date.now();
    let changed = false;
    for (const l of this.lessons) {
      const lastSeen = l.lastSeen ? new Date(l.lastSeen).getTime() : new Date(l.createdAt).getTime();
      const daysSinceUse = (now - lastSeen) / (24 * 60 * 60 * 1000);
      if (daysSinceUse > 30 && l.importance > 1) {
        const decay = Math.floor(daysSinceUse / 30);
        const reduction = Math.min(decay, l.importance - 1);
        if (reduction > 0) {
          l.importance -= reduction;
          changed = true;
        }
      }
    }
    return changed;
  },

  add({ type = 'insight', content, context = '', importance = 3, trigger = 'user_correction' }) {
    if (!content || typeof content !== 'string') {
      return { action: 'rejected', reason: 'empty_content' };
    }

    // 查重
    const similar = this.lessons.find(l =>
      (l.content && content.length >= 10 && l.content.includes(content.slice(0, 50))) ||
      (l.context && context.length >= 10 && l.context.includes(context.slice(0, 30)))
    );

    if (similar) {
      similar.frequency += 1;
      similar.lastSeen = new Date().toISOString();
      this.save();
      return { action: 'updated', lesson: similar };
    }

    const lesson = {
      id: this._uuid(),
      type: type || 'insight',
      content: String(content),
      importance: Math.max(1, Math.min(10, Number(importance) || 3)),
      frequency: 1,
      accessCount: 0,
      trigger: trigger || 'user_correction',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    this.lessons.push(lesson);
    this.save();
    return { action: 'added', lesson };
  },

  query(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase();
    return this.lessons.filter(l =>
      l.content.toLowerCase().includes(kw) ||
      (l.context && l.context.toLowerCase().includes(kw))
    );
  },

  getRelevant(context, limit = 3) {
    if (!context) return [];
    const ctx = context.toLowerCase();
    const ctxSlice = ctx.slice(0, 20);
    const matches = this.lessons
      .filter(l =>
        (l.content && l.content.toLowerCase().includes(ctxSlice)) ||
        (l.context && l.context.toLowerCase().includes(ctxSlice))
      )
      .sort((a, b) => {
        const scoreA = a.importance * Math.max(a.frequency, 1) * Math.max(a.accessCount || 1, 1);
        const scoreB = b.importance * Math.max(b.frequency, 1) * Math.max(b.accessCount || 1, 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    for (const m of matches) {
      m.accessCount = (m.accessCount || 0) + 1;
      m.lastSeen = new Date().toISOString();
    }
    if (matches.length > 0) this.save();
    return matches;
  },

  formatForContext(lessons) {
    if (!lessons || lessons.length === 0) return '';
    const lines = ['\n\n---\n**历史教训（避免重复犯错）:**'];
    for (const l of lessons) {
      lines.push(`- [${l.type}] ${l.content} (触发${l.frequency}次)`);
    }
    return lines.join('\n');
  },

  stats() {
    // 先衰减再统计
    this._applyDecay();
    return {
      total: this.lessons.length,
      byType: this.lessons.reduce((acc, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {}),
      mostFrequent: [...this.lessons]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(l => ({ id: l.id, content: l.content.slice(0, 50), freq: l.frequency })),
      avgImportance: this.lessons.length > 0
        ? (this.lessons.reduce((s, l) => s + l.importance, 0) / this.lessons.length).toFixed(1)
        : 0
    };
  },

  /**
   * 批量导出
   */
  exportToJSON(filter) {
    const data = filter
      ? this.lessons.filter(l => l.type === filter || !filter)
      : [...this.lessons];
    return JSON.stringify(data, null, 2);
  },

  /**
   * 批量导入
   */
  importFromJSON(jsonStr, options = {}) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) return { success: false, reason: 'not_array' };
      const { overwrite = false, mergeByContent = true } = options;
      
      if (overwrite) {
        this.lessons = data.map(l => ({
          ...l,
          id: l.id || this._uuid(),
          lastSeen: l.lastSeen || new Date().toISOString()
        }));
      } else if (mergeByContent) {
        for (const item of data) {
          const exist = this.lessons.find(l => l.content === item.content);
          if (exist) {
            exist.frequency += item.frequency || 1;
          } else {
            this.lessons.push({
              ...item,
              id: item.id || this._uuid(),
              lastSeen: new Date().toISOString()
            });
          }
        }
      }
      this.save();
      return { success: true, count: data.length, totalAfter: this.lessons.length };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  },

  // ========================================
  // 过程性教训（Procedural Lessons）存储区
  // 与 insight/self_correction 类教训并列，专用于"怎么做"的方法论记录
  // ========================================

  proceduralLessons: [],

  /**
   * 添加一条过程性教训
   * @param {object} lesson - 过程性教训对象
   * @param {string} lesson.name - 方法/策略名称
   * @param {string} lesson.description - 适用场景描述
   * @param {object} [lesson.condition] - 匹配条件 { domain, taskType, tags }
   * @param {string|array} [lesson.condition.domain] - 领域（如 'code', 'writing', 'research'）
   * @param {string|array} [lesson.condition.taskType] - 任务类型（如 'debug', 'refactor', 'review'）
   * @param {string|array} [lesson.condition.tags] - 自由标签
   * @param {string} [lesson.procedure] - 具体步骤/方法论文本
   * @param {number} [lesson.importance] - 1-10
   * @returns {object} { action: 'added'|'rejected', lesson? }
   */
  addProcedural({ name, description, condition = {}, procedure, importance = 3 }) {
    if (!name || !procedure) {
      return { action: 'rejected', reason: 'missing_name_or_procedure' };
    }

    // 查重
    const existing = this.proceduralLessons.find(
      l => l.name === name && l.description === description
    );
    if (existing) {
      existing.frequency += 1;
      existing.lastSeen = new Date().toISOString();
      existing.importance = Math.max(existing.importance, importance);
      this.save();
      return { action: 'updated', lesson: existing };
    }

    const lesson = {
      id: this._uuid(),
      name: String(name),
      description: String(description),
      condition: {
        domain: Array.isArray(condition.domain)
          ? condition.domain
          : condition.domain
            ? [String(condition.domain)]
            : [],
        taskType: Array.isArray(condition.taskType)
          ? condition.taskType
          : condition.taskType
            ? [String(condition.taskType)]
            : [],
        tags: Array.isArray(condition.tags)
          ? condition.tags
          : condition.tags
            ? [String(condition.tags)]
            : [],
      },
      procedure: String(procedure),
      importance: Math.max(1, Math.min(10, Number(importance) || 3)),
      frequency: 1,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    this.proceduralLessons.push(lesson);
    this.save();
    return { action: 'added', lesson };
  },

  /**
   * 匹配并应用过程性教训
   * @param {object} condition - 当前场景条件
   * @param {string|string[]} [condition.domain] - 当前领域
   * @param {string|string[]} [condition.taskType] - 当前任务类型
   * @param {string|string[]} [condition.tags] - 当前标签
   * @param {number} [limit=5] - 最多返回匹配数
   * @returns {Array} 匹配的过程性教训列表，按权重排序
   */
  matchAndApply(condition = {}, limit = 5) {
    if (!condition || (Object.keys(condition).length === 0 && !condition.domain && !condition.taskType)) {
      return [];
    }

    const toArray = (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val.map(String) : [String(val)];
    };

    const domainSet = new Set(toArray(condition.domain).map(s => s.toLowerCase()));
    const taskTypeSet = new Set(toArray(condition.taskType).map(s => s.toLowerCase()));
    const tagSet = new Set(toArray(condition.tags).map(s => s.toLowerCase()));

    const matched = [];

    for (const lesson of this.proceduralLessons) {
      let score = 0;

      // domain 匹配（精确或包含）
      if (domainSet.size > 0) {
        const lessonDomains = lesson.condition.domain.map(d => d.toLowerCase());
        const hit = lessonDomains.some(d => domainSet.has(d));
        if (hit) score += 3;
      }

      // taskType 匹配
      if (taskTypeSet.size > 0) {
        const lessonTaskTypes = lesson.condition.taskType.map(t => t.toLowerCase());
        const hit = lessonTaskTypes.some(t => taskTypeSet.has(t));
        if (hit) score += 3;
      }

      // tags 匹配（宽松包含）
      if (tagSet.size > 0) {
        const lessonTags = lesson.condition.tags.map(t => t.toLowerCase());
        const hitCount = lessonTags.filter(t => tagSet.has(t)).length;
        if (hitCount > 0) score += hitCount * 2;
      }

      if (score > 0) {
        lesson._matchScore = score;
        matched.push(lesson);
      }
    }

    const results = matched
      .sort((a, b) => {
        const scoreA = a._matchScore * Math.max(a.importance, 1) * Math.max(a.frequency, 1);
        const scoreB = b._matchScore * Math.max(b.importance, 1) * Math.max(b.frequency, 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 更新访问计数
    for (const m of results) {
      m.accessCount = (m.accessCount || 0) + 1;
      m.lastSeen = new Date().toISOString();
    }
    if (results.length > 0) this.save();

    // 清理内部字段后返回
    return results.map(({ _matchScore, ...rest }) => rest);
  },

  /**
   * 格式化过程性教训为可读文本
   * @param {Array} lessons - 匹配的过程性教训
   * @returns {string} 格式化文本
   */
  formatProcedural(lessons) {
    if (!lessons || lessons.length === 0) return '';
    const lines = ['\n\n---\n**推荐方法论（过程性教训）:**'];
    for (const l of lessons) {
      const ctx = [
        ...l.condition.domain,
        ...l.condition.taskType,
        ...l.condition.tags,
      ]
        .filter(Boolean)
        .join(', ');
      lines.push(
        `- **${l.name}** (${ctx || '通用'}): ${l.procedure} [重要度${l.importance}]`
      );
    }
    return lines.join('\n');
  },

  // ========================================
  // 引擎哲学 × lesson-bank 整合 v1.7.0
  // 核心："无所得故" — 教训不是用来拥有的，是用来放下的
  // 持续前进 — 走了一步，再走一步，不停留
  // ========================================

  letGoOf(lessonId) {
    if (!lessonId) return { result: false, reason: 'no_lesson_id' };
    const index = this.lessons.findIndex(l => l.id === lessonId);
    if (index === -1) return { result: false, reason: 'lesson_not_found' };
    const lesson = this.lessons[index];
    if (!this._letGoLog) this._letGoLog = [];
    this._letGoLog.push({
      lessonId,
      content: lesson.content.slice(0, 50),
      放下at: new Date().toISOString(),
      trigger: '无所得故'
    });
    this.lessons.splice(index, 1);
    this.save();
    return {
      result: true,
      content: lesson.content.slice(0, 50),
      totalLetGo: this._letGoLog.length,
      insight: '持续前进：放下了，继续走。答案不在远方，在每一步的脚下。'
    };
  },

  letGoByKeyword(keyword, maxAge = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const toLetGo = this.lessons.filter(l => {
      if (!keyword || !(l.content + l.context).toLowerCase().includes(keyword.toLowerCase())) return false;
      const age = now - new Date(l.createdAt).getTime();
      const unused = l.lastSeen ? (now - new Date(l.lastSeen).getTime()) > maxAge : age > maxAge;
      return unused;
    });
    const results = toLetGo.map(l => this.letGoOf(l.id));
    return {
      keyword,
      totalFound: toLetGo.length,
      totalLetGo: results.filter(r => r.result).length,
      insight: `持续前进：放下了${results.filter(r => r.result).length}条教训，继续往前走。`
    };
  },

  autoCleanup(options = {}) {
    const { maxAge = 90 * 24 * 60 * 60 * 1000, maxLessons = 50, minImportance = 2 } = options;
    const now = Date.now();
    const canLetGo = this.lessons.filter(l => {
      const age = now - new Date(l.createdAt).getTime();
      const isOld = age > maxAge;
      const isLowImportance = l.importance < minImportance;
      const isUnuseful = l.frequency === 1 && age > 7 * 24 * 60 * 60 * 1000;
      return isOld || (isLowImportance && isUnuseful);
    });
    const keep = this.lessons.filter(l => !canLetGo.includes(l));
    const toDelete = canLetGo.slice(0, Math.max(0, this.lessons.length - maxLessons));
    const results = toDelete.map(l => this.letGoOf(l.id));
    return {
      totalBefore: this.lessons.length,
      totalAfter: this.lessons.length - results.filter(r => r.result).length,
      deleted: results.filter(r => r.result).length,
      kept: keep.length,
      insight: '超越评判标准，超越评判：教训不是越多越好，放下不需要的，才能记住真正重要的。'
    };
  },

  getLetGoLog() {
    return {
      log: this._letGoLog || [],
      total: (this._letGoLog || []).length,
      insight: '放下记录：每一条放下都是一次认知升级。'
    };
  },

  // ─── v5.5.5 新增：自我校正学习 ─────────────────────────────────
  // RLFH 启发：自校正强化学习，通过错误模式检测和置信度加权改进

  /**
   * 错误模式检测：识别输入中的常见错误信号
   * @param {string} input - 用户输入或系统输出
   * @returns {object} 检测结果 { isError, patterns, confidence }
   */
  detectErrorPattern(input) {
    if (!input || typeof input !== 'string') return { isError: false, patterns: [], confidence: 0 };
    const patterns = [];
    let confidence = 0;

    // 模式1：否定修正信号
    const correctionPatterns = [
      { regex: /不对|错了|错误| incorrect|wrong|fix|修正/, weight: 0.4, label: 'negation_correction' },
      { regex: /不是这样|不是.*的意思| misunderstand/, weight: 0.35, label: 'misunderstanding' },
      { regex: /重新|再来|retry|again/, weight: 0.25, label: 'retry_signal' },
      { regex: /太长了|太短|不够详细|太简略/, weight: 0.3, label: 'output_format' },
      { regex: /没用|没帮助| irrelevant/, weight: 0.4, label: 'relevance_failure' },
      { regex: /重复|一样|同样|duplicate/, weight: 0.3, label: 'redundancy' },
    ];

    for (const p of correctionPatterns) {
      if (p.regex.test(input)) {
        patterns.push({ label: p.weight, weight: p.weight });
        confidence = Math.max(confidence, p.weight);
      }
    }

    return {
      isError: patterns.length > 0 && confidence >= 0.3,
      patterns,
      confidence: Math.min(1, confidence),
    };
  },

  /**
   * 自我校正：检测错误并自动记录教训
   * @param {string} originalInput - 原始输入
   * @param {string} originalOutput - 原始输出
   * @param {string} [correction] - 用户的修正信号（可选）
   * @returns {object} 校正结果
   */
  selfCorrect(originalInput, originalOutput, correction) {
    const signal = correction || originalInput;
    const errorPattern = this.detectErrorPattern(signal);

    if (!errorPattern.isError) {
      return { action: 'no_correction_needed', confidence: 0 };
    }

    // 构建教训内容
    const correctionText = correction || '输出不符合用户预期';
    const lessonContent = `[self-correct] 输入: "${originalInput.slice(0, 50)}" → 问题: ${errorPattern.patterns.map(p => p.label).join(', ')} → 修正: ${correctionText.slice(0, 100)}`;

    // 计算重要性：置信度越高 → 越重要
    const importance = Math.round(errorPattern.confidence * 8) + 2;

    // 检查是否已有类似教训
    const existing = this.lessons.find(l =>
      l.content && lessonContent.slice(0, 50) && l.content.includes(lessonContent.slice(0, 30))
    );

    if (existing) {
      existing.frequency += 1;
      existing.lastSeen = new Date().toISOString();
      existing.importance = Math.max(existing.importance, importance);
      this.save();
      return { action: 'updated', lesson: existing, confidence: errorPattern.confidence };
    }

    const lesson = {
      id: this._uuid(),
      type: 'self_correction',
      content: lessonContent,
      context: `original_output: ${originalOutput.slice(0, 100)}`,
      importance,
      frequency: 1,
      accessCount: 0,
      trigger: 'self_detected',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      errorPatterns: errorPattern.patterns.map(p => p.label),
      confidence: errorPattern.confidence,
    };

    this.lessons.push(lesson);
    this.save();

    return {
      action: 'recorded',
      lesson,
      confidence: errorPattern.confidence,
      patterns: errorPattern.patterns,
    };
  },

  /**
   * 获取置信度加权的教训列表
   * @param {number} [limit=5] - 返回数量
   * @returns {Array} 按置信度排序的高价值教训
   */
  getConfidenceWeighted(limit = 5) {
    return this.lessons
      .filter(l => l.confidence && l.confidence >= 0.3)
      .sort((a, b) => {
        const scoreA = (a.confidence || 0) * a.importance * Math.max(a.frequency, 1);
        const scoreB = (b.confidence || 0) * b.importance * Math.max(b.frequency, 1);
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(l => ({
        id: l.id,
        content: l.content,
        type: l.type,
        confidence: l.confidence,
        importance: l.importance,
        frequency: l.frequency,
        errorPatterns: l.errorPatterns || [],
      }));
  },

  /**
   * 检查输出清单（Fable 5 OutputChecklist 启发）
   * @param {string} output - 待检查的输出文本
   * @param {object} [context] - 上下文 { input, intent }
   * @returns {object} 检查结果 { passed, issues, score }
   */
  checkOutput(output, context = {}) {
    if (!output || typeof output !== 'string') return { passed: false, issues: ['empty_output'], score: 0 };

    const issues = [];
    let score = 1.0;

    // 检查1：输出是否包含未完成的思考标记
    if (/\[thinking|\[分析中|\[处理中|...{3,}/.test(output)) {
      issues.push({ type: 'unfinished_thinking', severity: 'medium' });
      score -= 0.2;
    }

    // 检查2：是否包含敏感信息泄露
    if (/api[_-]?key|token|password|secret|private/.test(output.toLowerCase())) {
      issues.push({ type: 'sensitive_info', severity: 'high' });
      score -= 0.5;
    }

    // 检查3：输出长度是否合理
    if (output.length > 50000) {
      issues.push({ type: 'too_long', severity: 'low', detail: `${output.length} chars` });
      score -= 0.1;
    }

    // 检查4：是否包含幻觉指示器（不确定的表述）
    if (/(可能|也许|大概|估计|不确定|我不确定|我没有.*信息)/.test(output) && output.length < 20) {
      issues.push({ type: 'uncertainty', severity: 'low' });
      score -= 0.15;
    }

    // 检查5：是否包含重复内容
    const sentences = output.split(/[。！？\n]/);
    const uniqueSentences = new Set(sentences.map(s => s.trim()).filter(s => s.length > 5));
    if (sentences.length > 3 && uniqueSentences.size < sentences.length * 0.5) {
      issues.push({ type: 'repetition', severity: 'medium' });
      score -= 0.2;
    }

    return {
      passed: score >= 0.6,
      issues,
      score: Math.max(0, score),
      recommendation: issues.length === 0 ? '输出通过检查' : `发现${issues.length}个问题，建议审查`,
    };
  }
};

lessonBank.load();
module.exports = { lessonBank };
