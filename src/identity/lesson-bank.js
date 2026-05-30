/**
 * LessonBank — Real-time lesson learning system
 *
 * From mark-improving-agent: stores lessons extracted from actual AI behavior patterns.
 * Each lesson tracks errorPattern → correction → rootCause.
 *
 * Bootstrap lessons from real HeartFlow behavior errors.
 */

const fs = require('fs');
const path = require('path');

// lessonStorage 冗余写入：LessonBank 和 lessonStorage 双写，保持同步
let _lessonStorage = null;
function _getLessonStorage() {
  if (_lessonStorage) return _lessonStorage;
  try {
    const mod = require('../core/lessons/lesson-storage.js');
    _lessonStorage = mod.lessonStorage;
  } catch { _lessonStorage = null; }
  return _lessonStorage;
}

class LessonBank {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.filePath = path.join(rootPath, 'lesson-bank.json');
    this._state = this._load();
    this._bootstrapLessons();
  }

  _createDefault() {
    return {
      lessons: {},
      totalHits: 0,
      totalSuccesses: 0,
      totalFailures: 0,
    };
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (raw.lessons) return raw;
      }
    } catch { /* ignore */ }
    return this._createDefault();
  }

  _persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this._state, null, 2));
    } catch { /* ignore */ }
  }

  _bootstrapLessons() {
    const BOOTSTRAP_LESSONS = [
      {
        errorPattern: '收到理解类问题就搜索',
        correction: '理解类问题第一反应是自己思考，不是搜索GitHub',
        rootCause: '条件反射式搜索',
        skill: 'heartflow',
        confidence: 0.75,
      },
      {
        errorPattern: '版本号只更新一个文件',
        correction: 'VERSION、package.json、SKILL.md、README.md必须同时更新到同一版本号',
        rootCause: '只更新了VERSION',
        skill: 'git',
        confidence: 0.75,
      },
      {
        errorPattern: 'commit备注引用老大原话',
        correction: '备注要基于代码改动，不引用对话',
        rootCause: '误解了备注的用途',
        skill: 'git',
        confidence: 0.75,
      },
      {
        errorPattern: '修复后不验证',
        correction: '修复后必须实际执行验证，不能只读代码',
        rootCause: '只看没实际跑',
        skill: 'heartflow',
        confidence: 0.80,
      },
      {
        errorPattern: '结论没有证据',
        correction: '结论必须有证据，没证据就承认不知道，绝不编数字',
        rootCause: '渡话问题刻意',
        skill: 'truthfulness',
        confidence: 0.90,
      },
      {
        errorPattern: '不承认底层原因',
        correction: '被追问"为什么"时直接承认底层原因，不要防御',
        rootCause: '论需要明确固拥别人的见解',
        skill: 'truthfulness',
        confidence: 0.90,
      },
      {
        errorPattern: '版本号不一致',
        correction: '修复后同步更新所有版本文件',
        rootCause: '版本管理没有结构化',
        skill: 'heartflow',
        confidence: 0.85,
      },
      {
        errorPattern: '不核实就说',
        correction: '未核实内容先说置信度，不要当事实汇报',
        rootCause: '急于给出答案',
        skill: 'truthfulness',
        confidence: 0.85,
      },
      {
        errorPattern: '过度hedging',
        correction: '直接给结论，不要\"可能\"、\"也许\"、\"似乎\"等模糊词',
        rootCause: '不确信自己的判断',
        skill: 'communication',
        confidence: 0.85,
      },
      {
        errorPattern: '修复验证后不更新版本',
        correction: '修复验证后立即同步更新所有版本文件',
        rootCause: '版本管理流程缺失',
        skill: 'git',
        confidence: 0.80,
      },
      {
        errorPattern: '多文件修改不一致',
        correction: '相关文件同步修改，保持一致性',
        rootCause: '缺乏全局修改意识',
        skill: 'heartflow',
        confidence: 0.75,
      },
      {
        errorPattern: '删除操作前不备份',
        correction: '删除前先备份，重要操作前先快照',
        rootCause: '缺乏安全意识',
        skill: 'safety',
        confidence: 0.90,
      },
    ];

    for (const lesson of BOOTSTRAP_LESSONS) {
      const key = this._patternToKey(lesson.errorPattern);
      if (!this._state.lessons[key]) {
        this._state.lessons[key] = {
          ...lesson,
          id: key,
          successCount: 0,
          failureCount: 0,
          createdAt: Date.now(),
          lastHit: Date.now(),
        };
      }
    }
  }

  _patternToKey(pattern) {
    return 'lesson_' + pattern.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 40);
  }

  /**
   * 提取关键词用于匹配
   * @private
   */
  _extractKeywords(text) {
    if (!text || typeof text !== 'string') return [];
    // 去除标点，分词，过滤停用词
    const words = text
      .replace(/[^\w\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
    const stopWords = new Set([
      '这个', '那个', '什么', '怎么', '如何', '为什么', '一个', '的是', '不是',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
      '我', '你', '他', '她', '它', '的', '是', '在', '了', '和', '与', '或',
    ]);
    return words
      .filter(w => !stopWords.has(w.toLowerCase()) && !stopWords.has(w))
      .map(w => w.toLowerCase());
  }

  addLesson({ errorPattern, correction, rootCause, skill, confidence }) {
    const key = this._patternToKey(errorPattern);
    const now = Date.now();

    this._state.lessons[key] = {
      id: key,
      errorPattern,
      correction,
      rootCause,
      skill: skill || 'general',
      confidence: Math.max(0, Math.min(1, confidence || 0.5)),
      successCount: 0,
      failureCount: 0,
      createdAt: now,
      lastHit: now,
    };

    this._persist();
    // lessonStorage 冗余写入：双写保持同步
    try {
      const ls = _getLessonStorage();
      if (ls) {
        ls.record({
          type: 'correction',
          content: correction || errorPattern,
          context: rootCause || '',
          trigger: skill || 'heartflow',
          importance: Math.round((confidence || 0.5) * 5),
          sessionId: null
        });
      }
    } catch { /* ignore lessonStorage write failure */ }
    return { id: key, success: true };
  }

  getLesson(id) {
    return this._state.lessons[id] || null;
  }

  checkPattern(input) {
    const lower = input.toLowerCase();

    for (const lesson of Object.values(this._state.lessons)) {
      const patternLower = lesson.errorPattern.toLowerCase();
      if (lower.includes(patternLower)) {
        lesson.lastHit = Date.now();
        this._state.totalHits++;
        this._persist();
        return lesson;
      }
    }

    return null;
  }

  markHit(id, success) {
    const lesson = this._state.lessons[id];
    if (!lesson) return { found: false };

    if (success) {
      lesson.successCount++;
      this._state.totalSuccesses++;
    } else {
      lesson.failureCount++;
      this._state.totalFailures++;
    }

    lesson.lastHit = Date.now();
    this._persist();
    return { found: true, success };
  }

  getBySkill(skill) {
    return Object.values(this._state.lessons).filter(l => l.skill === skill);
  }

  getTopLessons(limit = 10) {
    return Object.values(this._state.lessons)
      .map(l => ({
        ...l,
        utility: (l.successCount + 1) * l.confidence,
      }))
      .sort((a, b) => b.utility - a.utility)
      .slice(0, limit);
  }

  getAll() {
    return Object.values(this._state.lessons);
  }

  /**
   * 做事前的lesson检查
   * AI在执行危险操作前主动调用
   * @param {string} task - 任务描述
   * @returns {object} 匹配到的lesson列表（空的也返回，用于告知"无相关教训"
   */
  beforeTask(task) {
    if (!task || typeof task !== 'string') {
      return { task: '', relevant: [], count: 0 };
    }

    const keywords = this._extractKeywords(task);
    const lessons = Object.values(this._state.lessons);
    const scored = [];

    for (const lesson of lessons) {
      // 精确匹配errorPattern关键词
      const patternWords = this._extractKeywords(lesson.errorPattern);
      const overlap = keywords.filter(k => patternWords.includes(k));

      if (overlap.length > 0) {
        scored.push({
          ...lesson,
          matchScore: overlap.length,
          overlap,
        });
      }
    }

    // 按matchScore和confidence排序
    scored.sort((a, b) => {
      const scoreA = a.matchScore * a.confidence;
      const scoreB = b.matchScore * b.confidence;
      return scoreB - scoreA;
    });

    const relevant = scored.slice(0, 5).map(l => ({
      id: l.id,
      errorPattern: l.errorPattern,
      correction: l.correction,
      rootCause: l.rootCause,
      skill: l.skill,
      confidence: l.confidence,
    }));

    return { task, keywords, relevant, count: relevant.length };
  }

  /**
   * 记录一次失败
   * AI在操作失败后主动调用
   * @param {string|object} error - 错误描述或对象
   * @returns {object} 记录结果
   */
  recordFailure(error) {
    let errorText = '';
    let context = '';

    if (typeof error === 'string') {
      errorText = error;
    } else if (typeof error === 'object' && error !== null) {
      errorText = error.message || error.error || JSON.stringify(error).substring(0, 100);
      context = error.context || error.task || '';
    } else {
      errorText = String(error);
    }

    // 尝试匹配已有lesson
    const matched = this.checkPattern(errorText);

    if (matched) {
      // 已知的失败模式 → 标记hit
      this.markHit(matched.id, false);
      return {
        recorded: true,
        type: 'known_pattern',
        lessonId: matched.id,
        errorPattern: matched.errorPattern,
        correction: matched.correction,
        message: `已知教训 #${matched.id}，已标记失败`,
      };
    }

    // 新的失败模式 → 建议AI补充lesson
    return {
      recorded: false,
      type: 'new_pattern',
      errorText: errorText.substring(0, 100),
      context,
      message: '未匹配到已有教训，建议调用 lesson.addLesson 补充',
      suggestion: {
        errorPattern: errorText.substring(0, 60),
        correction: '【待补充】这次错在哪里，应该怎么改',
        rootCause: '【待补充】根本原因是什么',
        skill: 'heartflow',
        confidence: 0.5,
      },
    };
  }

  getStats() {
    const lessons = Object.values(this._state.lessons);
    return {
      totalLessons: lessons.length,
      totalHits: this._state.totalHits,
      totalSuccesses: this._state.totalSuccesses,
      totalFailures: this._state.totalFailures,
      successRate: this._state.totalHits > 0
        ? this._state.totalSuccesses / this._state.totalHits
        : 0,
      bySkill: lessons.reduce((acc, l) => {
        acc[l.skill] = (acc[l.skill] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

module.exports = { LessonBank };
