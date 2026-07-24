/**
 * ContinuousLearner — 持续学习引擎 v1.0.0
 *
 * 「模型不能永远依赖一次性训练，它应该像人一样，在长期工作过程中不断学习，
 *   积累经验、理解环境、更新自己的知识。」——梁文锋
 *
 * 心虫现有机制：
 *   - LessonBank：用户主动纠正才写，不自动
 *   - ExperienceDistiller：只提取"输入→分类→决策"模式，不提炼认知层面的教训
 *   - WisdomEngine：纯内存不持久化
 *
 * ContinuousLearner 补的是：每次 think() 后自动做一次轻量反思——
 * 「这次我做得对吗？有什么可以积累的？」
 *
 * 设计：
 *   1. reflect(tcResult, input) — 轻量自动反思，检测异常/低置信/空转模式
 *   2. 有值得记的学习点 → 生成 lesson-like 记录 → 存入 lesson-bank
 *   3. 每 N 次 think 触发一次"累积反思摘要"
 *
 * @version 1.0.0
 */
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../data/continuous-learning-log.json');

class ContinuousLearner {

  constructor(opts = {}) {
    this._config = {
      reflectInterval: opts.reflectInterval || 5,
      lowConfidenceThreshold: opts.lowConfidenceThreshold || 0.4,
      enabled: opts.enabled !== false,
    };
    this._log = {
      thinkCount: 0,
      totalReflections: 0,
      lowConfidenceHits: 0,
      autoLessonsGenerated: 0,
      recentReflections: [],
      sessionStart: Date.now(),
    };
    this._loaded = false;
    this._maxRecent = 50;
  }

  load() {
    if (this._loaded) return;
    try {
      if (fs.existsSync(LOG_FILE)) {
        const raw = fs.readFileSync(LOG_FILE, 'utf8');
        const d = JSON.parse(raw);
        this._log.thinkCount = d.thinkCount || 0;
        this._log.totalReflections = d.totalReflections || 0;
        this._log.lowConfidenceHits = d.lowConfidenceHits || 0;
        this._log.autoLessonsGenerated = d.autoLessonsGenerated || 0;
      }
    } catch (e) { /* 首次运行 */ }
    this._loaded = true;
  }

  _save() {
    try {
      const dir = path.dirname(LOG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOG_FILE, JSON.stringify({
        thinkCount: this._log.thinkCount,
        totalReflections: this._log.totalReflections,
        lowConfidenceHits: this._log.lowConfidenceHits,
        autoLessonsGenerated: this._log.autoLessonsGenerated,
        lastUpdated: Date.now(),
      }, null, 2), 'utf8');
    } catch (e) { /* 非关键 */ }
  }

  /**
   * 核心：每次 think() 后调用
   */
  reflect(tcResult, input, lessonBank) {
    if (!this._config.enabled) return { reflected: false };

    this.load();
    this._log.thinkCount++;

    // 自校准：每20次think检查阈值是否合适
    if (this._log.thinkCount > 10 && this._log.thinkCount % 20 === 0) {
      const rate = this._log.lowConfidenceHits / this._log.thinkCount;
      // 低置信率>40% → 阈值太严,放宽; <5% → 阈值太松,收紧
      if (rate > 0.4) {
        this._config.lowConfidenceThreshold = Math.max(0.1, this._config.lowConfidenceThreshold - 0.02);
      } else if (rate < 0.05 && this._config.lowConfidenceThreshold > 0.1) {
        this._config.lowConfidenceThreshold = Math.min(0.45, this._config.lowConfidenceThreshold + 0.02);
      }
    }

    const signals = this._detectSignals(tcResult, input);
    const insights = [];

    // 信号 1：低置信度
    if (signals.lowConfidence) {
      this._log.lowConfidenceHits++;
      insights.push({
        type: 'confidence_gap',
        detail: `think#${this._log.thinkCount}: 对「${(input || '').substring(0, 30)}...」置信度仅 ${signals.confidence}`,
        importance: 5,
      });
    }

    // 信号 2：空转
    if (signals.fastTrackLoop) {
      insights.push({
        type: 'spinning_detected',
        detail: `think#${this._log.thinkCount}: 检测到快速循环（${signals.fastTrackCount}次同类短输入）`,
        importance: 4,
      });
    }

    // 信号 3：异常分类
    if (signals.invalidClassification) {
      insights.push({
        type: 'misclassification',
        detail: `think#${this._log.thinkCount}: 输入被归为 invalid（可能路由错误）`,
        importance: 6,
      });
    }

    // 信号 4：边界命中
    if (signals.outOfScope) {
      insights.push({
        type: 'boundary_hit',
        detail: `think#${this._log.thinkCount}: 触发 outOfScope 边界`,
        importance: 3,
      });
    }

    let lesson = null;

    if (insights.length > 0) {
      lesson = {
        type: 'self_learned',
        content: insights.map(i => `[${i.type}] ${i.detail}`).join('\n'),
        context: `自动反思: think#${this._log.thinkCount}`,
        importance: Math.max(...insights.map(i => i.importance)),
        trigger: 'auto_reflection',
      };

      if (lessonBank && typeof lessonBank.add === 'function') {
        try {
          const result = lessonBank.add(lesson);
          if (result.action === 'added' || result.action === 'updated') {
            this._log.autoLessonsGenerated++;
          }
        } catch (e) { /* 非关键 */ }
      }

      this._log.totalReflections++;
    }

    // 记录最近反思（先于 summary，确保累积摘要能看到最新记录）
    this._log.recentReflections.push({
      ts: Date.now(),
      thinkCount: this._log.thinkCount,
      inputSnip: (input || '').substring(0, 30),
      insights: insights.map(i => i.type),
      confidence: signals.confidence,
    });
    if (this._log.recentReflections.length > this._maxRecent) {
      this._log.recentReflections = this._log.recentReflections.slice(-this._maxRecent);
    }

    // 累积反思
    let summary = null;
    if (this._log.thinkCount % this._config.reflectInterval === 0) {
      summary = this._cumulativeSummary();
    }

    this._save();

    return {
      reflected: insights.length > 0,
      lesson,
      insights: insights.map(i => i.type),
      summary,
      stats: {
        thinkCount: this._log.thinkCount,
        totalReflections: this._log.totalReflections,
        lowConfidenceHits: this._log.lowConfidenceHits,
        autoLessons: this._log.autoLessonsGenerated,
      },
    };
  }

  // ─── 信号检测 ──────────────────────────────────────────────────

  _detectSignals(tcResult, input) {
    const signals = {
      lowConfidence: false,
      confidence: 0.5,
      fastTrackLoop: false,
      fastTrackCount: 0,
      invalidClassification: false,
      outOfScope: false,
    };

    if (!tcResult) return signals;

    const confidence = tcResult.confidence ?? tcResult?.analysis?.confidence ?? 0.5;
    signals.confidence = confidence;
    if (confidence < this._config.lowConfidenceThreshold) {
      signals.lowConfidence = true;
    }

    const type = tcResult.type || tcResult?.analysis?.perceivedType || '';
    if (type === 'invalid') {
      signals.invalidClassification = true;
    }

    const outOfScope = tcResult._narrativeCheck?.outOfScope ||
      tcResult?.output?.outOfScope ||
      (tcResult?.analysis?.perceivedType === 'outOfScope');
    if (outOfScope) {
      signals.outOfScope = true;
    }

    if (input && input.length < 10 && type === 'analytical') {
      const recent = this._log.recentReflections || [];
      let count = 1;
      for (let i = recent.length - 1; i >= 0; i--) {
        if (recent[i].insights && recent[i].insights.length === 0 && (recent[i].inputSnip || '').length < 10) {
          count++;
        } else {
          break;
        }
      }
      signals.fastTrackCount = count;
      if (count >= 3) signals.fastTrackLoop = true;
    }

    return signals;
  }

  // ─── 纵向模式检测 ──────────────────────────────────────────────
  // 来源：arXiv 2506.05109 "Truly Self-Improving Agents Require Intrinsic Metacognitive Learning"
  //       + arXiv 2510.08002 "Learning on the Job: Experience-Driven Self-Evolving Agent"
  // 心虫之前只反思单次 think，不做跨任务的纵向模式识别

  /**
   * 检测最近 N 次 think 中的重复模式
   * @returns {Object} { patterns, confidenceTrend, recurringTopics }
   */
  _detectLongitudinalPatterns() {
    const recent = this._log.recentReflections || [];
    if (recent.length < 5) return { patterns: [], confidenceTrend: 'stable', recurringTopics: [] };

    const lastN = recent.slice(-20);

    // 1. 置信度趋势
    const mid = Math.floor(lastN.length / 2);
    const firstHalf = lastN.slice(0, mid);
    const secondHalf = lastN.slice(mid);
    const avg1 = firstHalf.reduce((s, r) => s + (r.confidence || 0.5), 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((s, r) => s + (r.confidence || 0.5), 0) / secondHalf.length;
    const diff = avg2 - avg1;
    const confidenceTrend = diff > 0.05 ? 'improving' : diff < -0.05 ? 'declining' : 'stable';

    // 2. 话题重复模式：同类 insight 反复出现
    const insightCounts = {};
    for (const r of lastN) {
      if (r.insights && Array.isArray(r.insights)) {
        for (const ins of r.insights) {
          insightCounts[ins] = (insightCounts[ins] || 0) + 1;
        }
      }
    }

    const patterns = Object.entries(insightCounts)
      .filter(([_, count]) => count > 2 && count / lastN.length > 0.15)
      .map(([type, count]) => ({
        type,
        count,
        rate: +(count / lastN.length).toFixed(2),
        severity: count / lastN.length > 0.3 ? 'high' : 'medium',
        suggestion: type === 'confidence_gap' ? '需要补充相关知识或降低该领域期望值'
          : type === 'spinning_detected' ? '可能需要更长输入或换策略'
          : type === 'boundary_hit' ? '该领域心虫不擅长，建议标记为 out-of-scope'
          : '检查是否持续存在同类问题',
      }));

    // 3. 低置信话题聚类（按 inputSnip 关键词）
    const lowConfTopics = lastN
      .filter(r => r.confidence !== undefined && r.confidence < 0.4 && r.inputSnip)
      .map(r => {
        const words = r.inputSnip.replace(/[^一-鿿w]/g, ' ').split(/s+/).filter(w => w.length > 1);
        return words.slice(0, 3);
      })
      .flat();

    const topicCounts = {};
    for (const w of lowConfTopics) {
      topicCounts[w] = (topicCounts[w] || 0) + 1;
    }
    const recurringTopics = Object.entries(topicCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    return { patterns, confidenceTrend, recurringTopics };
  }

  // ─── 累积摘要 ──────────────────────────────────────────────────

  _cumulativeSummary() {
    const recent = this._log.recentReflections || [];
    if (recent.length < 3) return null;

    const last10 = recent.slice(-10);
    const issueCounts = {};
    for (const r of last10) {
      if (r.insights) {
        for (const ins of r.insights) {
          issueCounts[ins] = (issueCounts[ins] || 0) + 1;
        }
      }
    }

    const longitudinal = this._detectLongitudinalPatterns();

    return {
      atThink: this._log.thinkCount,
      totalRecentReflections: last10.length,
      issuePatterns: Object.entries(issueCounts)
        .filter(([_, count]) => count > 1)
        .map(([type, count]) => ({ type, count, rate: +(count / last10.length).toFixed(2) })),
      overallAccuracy: this._log.thinkCount > 0
        ? +((this._log.thinkCount - this._log.lowConfidenceHits) / this._log.thinkCount).toFixed(3)
        : 1.0,
      sessionAge: Math.round((Date.now() - this._log.sessionStart) / 1000),
      // [v6.2.3] 纵向模式检测：跨任务模式识别
      confidenceTrend: longitudinal.confidenceTrend,
      recurringPatterns: longitudinal.patterns,
      recurringTopics: longitudinal.recurringTopics,
    };
  }

  // ─── 查询 ──────────────────────────────────────────────────────

  getStats() {
    this.load();
    return {
      ...this._log,
      recentReflections: this._log.recentReflections.slice(-5),
      config: this._config,
    };
  }

  resetSession() {
    this._log.thinkCount = 0;
    this._log.recentReflections = [];
    this._log.sessionStart = Date.now();
    this._save();
  }
}

module.exports = { ContinuousLearner };
