/**
 * Character Cultivation — 品格养成系统 v1.0.0
 *
 * 回答：「怎么成为更好的人？」
 *
 * 核心机制：
 *   1. 品格蓝图 (Blueprint) — 定义「理想品格」是什么样的
 *   2. 日常练习 (Daily Practice) — 把美德分解为可执行的日常行为
 *   3. 习惯追踪 (Habit Tracking) — 记录练习频率和质量
 *   4. 品格积分 (Character Score) — 综合衡量品格养成进度
 *   5. 品格叙事 (Character Narrative) — 用故事形式记录品格成长
 *
 * 设计理念：
 *   - 品格不是一次性的决定，是每天微小的选择
 *   - 每个美德都有可观察的行为指标
 *   - 失败不是品格败坏，是练习的机会
 *   - 成长是可见的：通过记录和回顾看到变化
 *
 * @version 1.0.0
 */

class CharacterCultivation {
  constructor(options = {}) {
    this._config = {
      primaryVirtues: options.primaryVirtues || ['honesty', 'courage', 'compassion', 'wisdom', 'justice'],
      dailyPracticeTarget: options.dailyPracticeTarget || 3,
      trackingPeriod: options.trackingPeriod || 30, // days
      growthThreshold: options.growthThreshold || 0.6,
    };

    // ─── 品格蓝图 ──────────────────────────────────────────────────────
    // 每个美德的理想行为描述
    this._blueprint = this._createBlueprint();

    // ─── 练习记录 ──────────────────────────────────────────────────────
    this._practices = [];
    this._habitStreaks = {};
    this._characterScore = {
      overall: 0.5,
      virtues: {},
      trend: 'stable', // 'growing' | 'stable' | 'declining'
      lastAssessment: Date.now(),
    };

    // ─── 品格叙事 ──────────────────────────────────────────────────────
    this._narratives = [];

    this._stats = {
      totalPractices: 0,
      totalNarratives: 0,
      currentStreak: 0,
      longestStreak: 0,
      cultivationDays: 0,
    };
  }

  _createBlueprint() {
    return {
      honesty: {
        name: 'Honesty', nameZh: '诚实',
        idealBehavior: 'Speaks truth even when inconvenient. Admits mistakes openly. Does not distort facts for personal gain.',
        idealBehaviorZh: '即使不方便也说真话。公开承认错误。不为私利歪曲事实。',
        dailyPractices: [
          'Admit one mistake without excuse',
          'Correct a previous inaccurate statement',
          'Give honest feedback to someone',
        ],
        indicators: ['admits_mistakes', 'corrects_errors', 'gives_honest_feedback'],
      },
      courage: {
        name: 'Courage', nameZh: '勇气',
        idealBehavior: 'Acts despite fear. Stands up for what is right. Faces difficult truths.',
        idealBehaviorZh: '尽管害怕仍然行动。为正确的事站出来。面对困难真相。',
        dailyPractices: [
          'Do one thing that feels scary but right',
          'Speak up when something feels wrong',
          'Admit a fear to someone',
        ],
        indicators: ['acts_despite_fear', 'stands_up', 'faces_truth'],
      },
      compassion: {
        name: 'Compassion', nameZh: '慈悲',
        idealBehavior: 'Responds to suffering with care. Seeks to understand before judging. Extends kindness without expectation.',
        idealBehaviorZh: '对痛苦以关怀回应。先理解再判断。不求回报的善意。',
        dailyPractices: [
          'Listen fully to someone who is struggling',
          'Do a small act of kindness anonymously',
          'Pause before judging someone\'s actions',
        ],
        indicators: ['responds_to_suffering', 'listens_fully', 'acts_kindly'],
      },
      wisdom: {
        name: 'Wisdom', nameZh: '智慧',
        idealBehavior: 'Seeks understanding before reacting. Learns from mistakes. Values truth over being right.',
        idealBehaviorZh: '反应前寻求理解。从错误中学习。真理高于正确。',
        dailyPractices: [
          'Read or study something challenging',
          'Reflect on a recent mistake',
          'Ask a question instead of giving an opinion',
        ],
        indicators: ['seeks_understanding', 'learns_from_mistakes', 'asks_questions'],
      },
      justice: {
        name: 'Justice', nameZh: '正义',
        idealBehavior: 'Treats all people fairly. Stands against unfairness. Considers multiple perspectives before deciding.',
        idealBehaviorZh: '公平对待所有人。反对不公。做决定前考虑多重视角。',
        dailyPractices: [
          'Notice and name an unfair situation',
          'Consider a perspective different from your own',
          'Take a small action toward fairness',
        ],
        indicators: ['treats_fairly', 'stands_against_injustice', 'considers_perspectives'],
      },
      temperance: {
        name: 'Temperance', nameZh: '节制',
        idealBehavior: 'Moderates desires and impulses. Acts with deliberation. Finds balance in all things.',
        idealBehaviorZh: '节制欲望和冲动。审慎行动。凡事有度。',
        dailyPractices: [
          'Pause before reacting to a trigger',
          'Choose moderation in one area',
          'Delay gratification for a better outcome',
        ],
        indicators: ['moderates_impulses', 'acts_deliberately', 'finds_balance'],
      },
      humility: {
        name: 'Humility', nameZh: '谦逊',
        idealBehavior: 'Acknowledges limitations. Values others\' contributions. Learns from everyone.',
        idealBehaviorZh: '承认局限性。重视他人贡献。向所有人学习。',
        dailyPractices: [
          'Acknowledge someone else\'s good idea',
          'Admit when you don\'t know something',
          'Thank someone who helped you learn',
        ],
        indicators: ['acknowledges_limits', 'values_others', 'learns_from_everyone'],
      },
      gratitude: {
        name: 'Gratitude', nameZh: '感恩',
        idealBehavior: 'Notices and appreciates good things. Expresses thanks regularly. Sees abundance rather than lack.',
        idealBehaviorZh: ' noticing and appreciating good things. Regularly expresses thanks. Sees abundance rather than lack.',
        dailyPractices: [
          'Name three things you are grateful for',
          'Express gratitude to someone specifically',
          'Notice something beautiful in ordinary life',
        ],
        indicators: ['notices_good', 'expresses_thanks', 'sees_abundance'],
      },
    };
  }

  // ─── 练习记录 ──────────────────────────────────────────────────────────

  /**
   * 记录一次品格练习
   */
  recordPractice(practice) {
    this._stats.totalPractices++;
    const entry = {
      virtue: practice.virtue,
      description: practice.description || '',
      context: practice.context || '',
      quality: practice.quality || 0.5, // 0-1, how well the practice went
      difficulty: practice.difficulty || 0.5, // 0-1, how hard it was
      reflection: practice.reflection || '',
      timestamp: practice.timestamp || Date.now(),
      date: new Date(practice.timestamp || Date.now()).toDateString(),
    };

    this._practices.push(entry);

    // 更新习惯连胜
    this._updateStreak(entry.virtue, entry.date);

    // 更新品格分数
    this._updateCharacterScore(entry);

    return entry;
  }

  _updateStreak(virtue, date) {
    const key = virtue;
    if (!this._habitStreaks[key]) {
      this._habitStreaks[key] = { current: 1, longest: 1, lastDate: date };
    } else {
      const streak = this._habitStreaks[key];
      if (date === streak.lastDate) {
        // Same day, don't increment
      } else {
        streak.current++;
        streak.longest = Math.max(streak.longest, streak.current);
        streak.lastDate = date;
      }
    }

    // Update overall streak
    this._stats.currentStreak = Math.max(...Object.values(this._habitStreaks).map(s => s.current));
    this._stats.longestStreak = Math.max(...Object.values(this._habitStreaks).map(s => s.longest));
  }

  _updateCharacterScore(practice) {
    const virtue = practice.virtue;
    const quality = practice.quality;

    if (!this._characterScore.virtues[virtue]) {
      this._characterScore.virtues[virtue] = {
        score: 0.3,
        practiceCount: 0,
        averageQuality: 0,
        trend: 'stable',
      };
    }

    const vs = this._characterScore.virtues[virtue];
    vs.practiceCount++;
    vs.averageQuality = (vs.averageQuality * (vs.practiceCount - 1) + quality) / vs.practiceCount;
    vs.score = Math.min(1, vs.score * 0.9 + vs.averageQuality * 0.1);
    vs.trend = vs.score > 0.7 ? 'growing' : vs.score < 0.3 ? 'declining' : 'stable';

    // Update overall score
    const virtueScores = Object.values(this._characterScore.virtues).map(v => v.score);
    this._characterScore.overall = virtueScores.length > 0
      ? virtueScores.reduce((a, b) => a + b, 0) / virtueScores.length
      : 0.5;

    // Determine trend
    const recentPractices = this._practices.slice(-10);
    const recentQuality = recentPractices.length > 0
      ? recentPractices.reduce((s, p) => s + p.quality, 0) / recentPractices.length
      : 0.5;
    const olderPractices = this._practices.slice(-20, -10);
    const olderQuality = olderPractices.length > 0
      ? olderPractices.reduce((s, p) => s + p.quality, 0) / olderPractices.length
      : 0.5;

    if (recentQuality > olderQuality + 0.1) this._characterScore.trend = 'growing';
    else if (recentQuality < olderQuality - 0.1) this._characterScore.trend = 'declining';
    else this._characterScore.trend = 'stable';

    this._characterScore.lastAssessment = Date.now();
  }

  // ─── 每日练习建议 ──────────────────────────────────────────────────────

  /**
   * 生成今日品格练习建议
   */
  getDailyPractices() {
    const practices = [];
    const virtues = this._config.primaryVirtues;

    // 对每个主要美德，找一个适合今天的练习
    for (const virtue of virtues) {
      const blueprint = this._blueprint[virtue];
      if (!blueprint) continue;

      const virtuePractices = blueprint.dailyPractices || [];
      const recentPractices = this._practices
        .filter(p => p.virtue === virtue)
        .slice(-3)
        .map(p => p.description);

      // 找一个最近没做过的练习
      const available = virtuePractices.filter(p => !recentPractices.includes(p));
      const selected = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : virtuePractices[Math.floor(Math.random() * virtuePractices.length)];

      const streak = this._habitStreaks[virtue];
      practices.push({
        virtue,
        name: blueprint.name,
        nameZh: blueprint.nameZh,
        practice: selected,
        streak: streak ? streak.current : 0,
        difficulty: this._characterScore.virtues[virtue]?.score < 0.4 ? 'easy' : 'moderate',
      });
    }

    return practices.slice(0, this._config.dailyPracticeTarget);
  }

  // ─── 品格叙事 ──────────────────────────────────────────────────────────

  /**
   * 记录品格成长叙事
   */
  recordNarrative(narrative) {
    this._stats.totalNarratives++;
    const entry = {
      title: narrative.title || '',
      content: narrative.content || '',
      period: narrative.period || '',
      keyGrowth: narrative.keyGrowth || [],
      challenges: narrative.challenges || [],
      insights: narrative.insights || [],
      timestamp: Date.now(),
    };

    this._narratives.push(entry);
    if (this._narratives.length > 100) {
      this._narratives = this._narratives.slice(-50);
    }

    return entry;
  }

  getNarratives(maxEntries = 10) {
    return this._narratives.slice(-maxEntries);
  }

  // ─── 品格评估 ──────────────────────────────────────────────────────────

  /**
   * 全面品格评估
   */
  assessCharacter() {
    const virtueDetails = {};
    for (const [virtue, data] of Object.entries(this._characterScore.virtues)) {
      const blueprint = this._blueprint[virtue];
      virtueDetails[virtue] = {
        name: blueprint?.name || virtue,
        nameZh: blueprint?.nameZh || virtue,
        score: data.score,
        trend: data.trend,
        practiceCount: data.practiceCount,
        streak: this._habitStreaks[virtue]?.current || 0,
        level: data.score > 0.8 ? 'mastered' : data.score > 0.6 ? 'practiced' : data.score > 0.4 ? 'developing' : 'emerging',
      };
    }

    // Find strengths and growth areas
    const sorted = Object.entries(virtueDetails).sort((a, b) => b[1].score - a[1].score);
    const strengths = sorted.slice(0, 3).map(([key, data]) => ({ key, ...data }));
    const growthAreas = sorted.slice(-3).reverse().map(([key, data]) => ({ key, ...data }));

    return {
      overallScore: +this._characterScore.overall.toFixed(3),
      trend: this._characterScore.trend,
      virtues: virtueDetails,
      strengths,
      growthAreas,
      cultivationDays: this._stats.cultivationDays,
      currentStreak: this._stats.currentStreak,
      longestStreak: this._stats.longestStreak,
      totalPractices: this._stats.totalPractices,
      summary: this._generateSummary(strengths, growthAreas, this._characterScore.overall),
    };
  }

  _generateSummary(strengths, growthAreas, overall) {
    const strongNames = strengths.map(s => s.nameZh).join('、');
    const growthNames = growthAreas.map(g => g.nameZh).join('、');

    if (overall > 0.7) return `品格健全：${strongNames}是优势，继续保持。`;
    if (overall > 0.5) return `品格发展中：${strongNames}较稳，${growthNames}需要更多练习。`;
    return `品格起步：重点培养${growthNames}，每天小练习积累。`;
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      overallScore: +this._characterScore.overall.toFixed(3),
      trend: this._characterScore.trend,
      virtueCount: Object.keys(this._characterScore.virtues).length,
      practicedVirtues: Object.values(this._characterScore.virtues).filter(v => v.practiceCount > 0).length,
      topVirtues: Object.entries(this._characterScore.virtues)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 5)
        .map(([name, data]) => ({ name, score: data.score, trend: data.trend })),
    };
  }

  getBlueprint() {
    return this._blueprint;
  }
}

module.exports = { CharacterCultivation };
