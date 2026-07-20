/**
 * 自我基准度量 - Self Benchmark
 * 全知全能逼近度度量
 *
 * v1.0.0
 * - 可量化逼近度报告
 * - 复用现有 cortex/self-benchmark 指标
 */

const { encryptJSON, decryptJSON } = require('../memory/memory-encrypt.js');
const { anchorSync } = require('./benchmark-external-anchor.js');

const BENCHMARK_FILE = require('path').join(__dirname, '../../data/self-benchmark.json');
const MAX_BENCHMARKS = 500;

let _benchCache = null;

function _load() {
  if (_benchCache) return _benchCache;
  try {
    if (require('fs').existsSync(BENCHMARK_FILE)) {
      const raw = require('fs').readFileSync(BENCHMARK_FILE, 'utf8');
      const data = decryptJSON(raw);
      _benchCache = Array.isArray(data) ? data : [];
    } else {
      _benchCache = [];
    }
  } catch (e) {
    _benchCache = [];
  }
  return _benchCache;
}

function _save(items) {
  try {
    require('fs').mkdirSync(require('path').dirname(BENCHMARK_FILE), { recursive: true });
    require('fs').writeFileSync(BENCHMARK_FILE, encryptJSON(items));
    _benchCache = items;
  } catch (e) {
    // silent
  }
}

class SelfBenchmark {
  constructor(hf = {}) {
    this.hf = hf;
    this.benchmarks = _load();
    this.history = [];
  }

  _uuid() {
    return `bench-${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}`;
  }

  _now() {
    return new Date().toISOString();
  }

  /**
   * 执行全知全能逼近度评估
   * 修复"自欺进化"：原 score 100% 来自内部自陈指标（进化循环触发率 / lesson
   * 置信度 / 自愈成功率 / 模块覆盖率），无任何外部可验证事实。
   * 现改为：有外部锚时 score = 0.4*内部 + 0.6*外部；无外部锚时内部分打 0.7 折
   * 并打标 verified:false，防止心虫拿"自评分高"自我激励。
   * @returns {Object} quantifiable report
   */
  assess() {
    const stats = this._computeStats();
    const internalScore = this._score(stats);

    // 外部锚定（同步：逻辑题 + 可选满意度；跨模型为 opt-in 异步，不在此阻塞）
    let external = null;
    try {
      external = anchorSync(this.hf);
    } catch (_) {
      external = null;
    }

    let finalScore;
    let verified;
    let guardNote;
    if (external && external.available && external.score !== null) {
      finalScore = Number((0.4 * internalScore + 0.6 * external.score * 100).toFixed(2));
      verified = true;
      guardNote = 'external_anchored';
    } else {
      // 防自欺护栏：无外部验证时内部分打折 + 明确标记未验证
      finalScore = Number((internalScore * 0.7).toFixed(2));
      verified = false;
      guardNote = 'UNVERIFIED: 分数未经验证，勿据此自我激励（无外部锚）';
      console.warn('[self-benchmark] ' + guardNote);
    }

    const report = {
      id: this._uuid(),
      createdAt: this._now(),
      ...stats,
      internalScore,
      externalAnchor: external ? {
        logicAccuracy: external.logicAccuracy,
        humanSatisfaction: external.humanSatisfaction,
        available: external.available,
        score: external.score,
      } : null,
      verified,
      score: finalScore,
      label: this._label(finalScore),
      guardNote,
      details: this._details(stats),
    };

    this.benchmarks.push(report);
    if (this.benchmarks.length > MAX_BENCHMARKS) {
      this.benchmarks = this.benchmarks.slice(-MAX_BENCHMARKS);
    }
    _save(this.benchmarks);
    return report;
  }

  _computeStats() {
    let loopStats = { triggerRate: 0, closureRate: 0, reuseRate: 0 };
    let lessonStats = { total: 0, recent: 0, avgConfidence: 0 };
    let healingStats = { successRate: 0, total: 0 };
    let coverageStats = { modulesUsed: 0, totalModules: 0, ratio: 0 };

    try {
      if (this.hf && typeof this.hf.dispatch === 'function') {
        const loopResult = this.hf.dispatch('selfEvolutionLoop.getStats', {});
        if (loopResult && typeof loopResult === 'object') {
          loopStats = {
            triggerRate: loopResult.triggerRate || 0,
            closureRate: loopResult.closureRate || 0,
            reuseRate: loopResult.reuseRate || 0,
          };
        }

        const lessonResult = this.hf.dispatch('lessonBankAdapter.getStats', {});
        if (lessonResult && typeof lessonResult === 'object') {
          lessonStats = {
            total: lessonResult.total || lessonResult.totalLessons || 0,
            recent: lessonResult.recent || 0,
            avgConfidence: lessonResult.avgConfidence || 0,
          };
        }

        const routesResult = this.hf.routes ? this.hf.routes() : {};
        const moduleKeys = Object.keys(routesResult);
        coverageStats = {
          modulesUsed: moduleKeys.length,
          totalModules: moduleKeys.length,
          ratio: moduleKeys.length ? 1 : 0,
        };
      }
    } catch (_) {
      // keep defaults
    }

    return {
      loopStats,
      lessonStats,
      healingStats,
      coverageStats,
    };
  }

  _score(stats) {
    const weights = {
      closureRate: 0.45,
      reuseRate: 0.25,
      coverageRatio: 0.15,
      lessonCount: 0.15,
    };

    const closure = Math.min(100, stats.loopStats.closureRate || 0) / 100;
    const reuse = Math.min(100, stats.loopStats.reuseRate || 0) / 100;
    const coverage = Math.min(1, stats.coverageStats.ratio || 0);
    const lessons = Math.min(1, (stats.lessonStats.total || 0) / 100);

    const raw = weights.closureRate * closure
      + weights.reuseRate * reuse
      + weights.coverageRatio * coverage
      + weights.lessonCount * lessons;

    return Number((raw * 100).toFixed(2));
  }

  _label(score) {
    if (score >= 85) return 'omniscient-approaching';
    if (score >= 70) return 'advanced';
    if (score >= 55) return 'intermediate';
    if (score >= 40) return 'developing';
    return 'nascent';
  }

  _details(stats) {
    return {
      closureRatePct: `${stats.loopStats.closureRate}%`,
      reuseRatePct: `${stats.loopStats.reuseRate}%`,
      coverageRatio: `${Number((stats.coverageStats.ratio * 100).toFixed(2))}%`,
      lessonCount: stats.lessonStats.total,
    };
  }

  getStats() {
    const scores = this.benchmarks.map((item) => item.score || 0);
    const recent = scores.slice(-20);
    return {
      totalBenchmarks: this.benchmarks.length,
      latestScore: scores.length ? scores[scores.length - 1] : 0,
      avgScore: recent.length ? Number((recent.reduce((a, b) => a + b, 0) / recent.length).toFixed(2)) : 0,
      maxScore: scores.length ? Math.max(...scores) : 0,
      minScore: scores.length ? Math.min(...scores) : 0,
    };
  }
}

module.exports = { SelfBenchmark };
