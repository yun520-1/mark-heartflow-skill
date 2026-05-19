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
