/**
 * HeartFlow Eval-Memory Bridge v11.7.7
 * 
 * 升级路线（v11.7.6 → v11.7.7）：
 * - 缺失点：EvalSuite 运行 feedback functions 后，结果从未进入 MeaningfulMemory
 * - 新增：低分反馈注入为 error_pattern（learned 层），高频高质量注入为 verified_knowledge（core 层）
 * - 形成评估驱动的自我改进闭环（类似 HHH Ethics Lab 的自我评估机制）
 * 
 * 核心功能：
 * - 监听 eval 结果，提取有意义的模式
 * - 低质量回复（score < 0.4）注入为 error_pattern learned 记忆
 * - 高质量回复（avg score > 0.85，≥3次）晋升为 core 记忆
 * - eval 执行历史持久化，支持回溯分析
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const BRIDGE_LOG = path.join(DATA_DIR, 'eval-bridge-log.json');
const BRIDGE_HISTORY = path.join(DATA_DIR, 'eval-bridge-history.jsonl');

const CONFIG = {
  lowQualityThreshold: 0.4,      // < 0.4 视为低质量
  highQualityThreshold: 0.85,    // >= 0.85 视为高质量
  highQualityMinCount: 3,         // 高质量出现次数达到此值才晋升 core
  decayHours: 24 * 7,            // 历史记录 7 天后衰减（不影响记忆，只影响统计）
};

class EvalMemoryBridge {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    
    // 外部依赖（运行时注入）
    this._meaningfulMemory = null;
    
    // 统计
    this.stats = {
      lowQualityLogged: 0,
      highQualityLogged: 0,
      promotedToCore: 0,
      evalResultsProcessed: 0,
    };
    
    this._loadLog();
  }

  /**
   * 注入 MeaningfulMemory 实例
   */
  attach(memory) {
    this._meaningfulMemory = memory;
    return this;
  }

  _loadLog() {
    try {
      if (fs.existsSync(BRIDGE_LOG)) {
        const data = JSON.parse(fs.readFileSync(BRIDGE_LOG, 'utf8'));
        this.stats = { ...this.stats, ...data.stats };
      }
    } catch (e) {}
  }

  _saveLog() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(BRIDGE_LOG, JSON.stringify({
        stats: this.stats,
        lastUpdated: Date.now(),
      }, null, 2));
    } catch (e) {}
  }

  /**
   * 追加一行历史记录（JSONL）
   */
  _appendHistory(entry) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const line = JSON.stringify({
        ...entry,
        ts: Date.now(),
      });
      fs.appendFileSync(BRIDGE_HISTORY, line + '\n');
    } catch (e) {}
  }

  /**
   * 处理一条 eval 结果
   * @param {Object} evalResult - EvalResult 或 { feedbackName, score, tags, args }
   * @param {Object} context - 上下文信息 { question, response, sessionId }
   */
  process(evalResult, context = {}) {
    if (!evalResult || evalResult.score === null) return null;
    
    this.stats.evalResultsProcessed++;
    const { score, feedbackName, tags, reason } = evalResult;
    const { question = '', response = '', sessionId = 'default' } = context;
    
    const entry = {
      feedbackName,
      score,
      tags,
      question: question.substring(0, 100),
      responsePreview: response.substring(0, 200),
      sessionId,
    };
    
    // 1. 低质量 → 注入 error_pattern
    if (score < this.config.lowQualityThreshold) {
      this._injectLowQuality(entry);
    }
    
    // 2. 高质量 → 检查是否可以晋升 core
    if (score >= this.config.highQualityThreshold) {
      this._processHighQuality(entry);
    }
    
    this._appendHistory(entry);
    this._saveLog();
    
    return {
      processed: true,
      quality: score < this.config.lowQualityThreshold ? 'low' 
             : score >= this.config.highQualityThreshold ? 'high' : 'medium',
    };
  }

  /**
   * 处理批量 eval 结果（EvalSuite.run 返回的 summary）
   * @param {Object} summary - EvalSuite run 返回的 summary
   * @param {Object} context
   */
  processSuiteSummary(summary, context = {}) {
    if (!summary || !summary.results) return null;
    
    const { results, average } = summary;
    const { question = '', response = '' } = context;
    
    // 为每个 feedback 结果单独处理
    for (const result of results) {
      this.process(result, { question, response, sessionId: context.sessionId });
    }
    
    // 同时记录整体分数
    if (average !== null) {
      this._appendHistory({
        type: 'suite_average',
        average,
        feedbackCount: results.length,
        question: question.substring(0, 100),
        sessionId: context.sessionId || 'default',
      });
    }
    
    return { processed: results.length, average };
  }

  _injectLowQuality(entry) {
    if (!this._meaningfulMemory) return;
    
    const key = `eval_low_${entry.feedbackName}_${Date.now()}`;
    const value = {
      feedback: entry.feedbackName,
      score: entry.score,
      tags: entry.tags,
      questionHint: entry.question,
      responseHint: entry.responsePreview.substring(0, 100),
    };
    
    this._meaningfulMemory.remember({
      key,
      value,
      type: 'error_pattern',
      reason: `eval ${entry.feedbackName} score=${entry.score.toFixed(2)} < ${this.config.lowQualityThreshold}，触发质量预警`,
      source: 'eval-memory-bridge',
    });
    
    this.stats.lowQualityLogged++;
  }

  _processHighQuality(entry) {
    if (!this._meaningfulMemory) return;
    
    // 检查该 feedback 类型的高质量历史
    const historyKey = `hq_${entry.feedbackName}`;
    
    // 从历史中统计该 feedback 的高质量次数
    const history = this._readHistoryForFeedback(entry.feedbackName);
    const recentHq = history.filter(h => h.score >= this.config.highQualityThreshold);
    
    if (recentHq.length + 1 >= this.config.highQualityMinCount) {
      // 晋升为 core
      const coreKey = `eval_verified_${entry.feedbackName}`;
      if (!this._meaningfulMemory.knows(coreKey)) {
        this._meaningfulMemory.remember({
          key: coreKey,
          value: {
            feedback: entry.feedbackName,
            tags: entry.tags,
            verifiedAt: Date.now(),
            highQualityCount: recentHq.length + 1,
            sampleQuestion: entry.question,
          },
          type: 'verified_knowledge',
          reason: `${entry.feedbackName} 连续 ${recentHq.length + 1} 次高质量，晋升 CORE`,
          source: 'eval-memory-bridge',
          userConfirmed: false,
        });
        this.stats.promotedToCore++;
      }
    }
    
    this.stats.highQualityLogged++;
  }

  _readHistoryForFeedback(feedbackName) {
    try {
      if (!fs.existsSync(BRIDGE_HISTORY)) return [];
      const lines = fs.readFileSync(BRIDGE_HISTORY, 'utf8').trim().split('\n');
      const cutoff = Date.now() - this.config.decayHours * 60 * 60 * 1000;
      
      const results = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.feedbackName === feedbackName && entry.ts >= cutoff) {
            results.push(entry);
          }
        } catch (_) {}
      }
      return results;
    } catch (e) {
      return [];
    }
  }

  /**
   * 获取质量趋势报告
   */
  getQualityTrend(feedbackName = null, hours = 24) {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const history = [];
    
    try {
      if (fs.existsSync(BRIDGE_HISTORY)) {
        const lines = fs.readFileSync(BRIDGE_HISTORY, 'utf8').trim().split('\n');
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.ts >= cutoff) {
              if (!feedbackName || entry.feedbackName === feedbackName) {
                history.push(entry);
              }
            }
          } catch (_) {}
        }
      }
    } catch (e) {}
    
    if (history.length === 0) {
      return { feedbackName, count: 0, avgScore: null, trend: 'no_data' };
    }
    
    const scores = history.map(h => h.score).filter(s => s !== null);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const lowCount = scores.filter(s => s < this.config.lowQualityThreshold).length;
    const highCount = scores.filter(s => s >= this.config.highQualityThreshold).length;
    
    return {
      feedbackName,
      count: scores.length,
      avgScore: parseFloat(avg.toFixed(3)),
      lowQualityCount: lowCount,
      highQualityCount: highCount,
      trend: avg >= 0.7 ? 'good' : avg >= 0.5 ? 'mixed' : 'needs_attention',
    };
  }

  stats_() {
    return { ...this.stats };
  }
}

module.exports = { EvalMemoryBridge };
