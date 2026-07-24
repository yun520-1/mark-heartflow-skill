/**
 * PatternTracer — 模式溯源器 v1.0.0
 *
 * 「邓煜和希尔伯特第六问题：从微观规则推导宏观行为」
 *
 * 心虫能看到宏观趋势（置信度下降、模式重复）但不知道是哪些具体的
 * 微观输入导致的。PatternTracer 不解决数学推导——它做的是一件更
 * 基础的事：当宏观模式出现时，自动回溯到最近的微观数据（每次 think
 * 的置信度、类型、输入），找到相关性最强的具体源头。
 *
 * 这不是"证明因果"，是"指出最可能的原因"。跟邓煜的严谨数学不能比，
 * 但方向一样：从微观理解宏观。
 *
 * @version 1.0.0
 */

class PatternTracer {
  constructor(hf) {
    this.hf = hf;
    this._stats = {
      tracesRun: 0,
      correlationsFound: 0,
    };
  }

  /**
   * 对一次宏观摘要执行溯源，找出最可能的微观原因
   * @param {Object} summary - ContinuousLearner._cumulativeSummary()
   * @param {Array} recentReflections - 最近的反思记录
   * @returns {Object} trace
   */
  trace(summary, recentReflections) {
    if (!summary || !recentReflections || recentReflections.length < 3) {
      return { traced: false, reason: 'data insufficient' };
    }

    this._stats.tracesRun++;
    const result = {
      traced: true,
      macroTrend: summary.confidenceTrend || 'unknown',
      confidenceChange: null,
      correlations: [],
      topCause: null,
    };

    // 1. 按置信度分两组
    const lowConf = recentReflections.filter(r => r.confidence !== undefined && r.confidence < 0.4);
    const highConf = recentReflections.filter(r => r.confidence !== undefined && r.confidence >= 0.4);

    // 首尾置信度比较
    if (recentReflections.length >= 4) {
      const half = Math.floor(recentReflections.length / 2);
      const firstAvg = recentReflections.slice(0, half).reduce((s, r) => s + (r.confidence || 0.5), 0) / half;
      const lastAvg = recentReflections.slice(-half).reduce((s, r) => s + (r.confidence || 0.5), 0) / half;
      result.confidenceChange = +(lastAvg - firstAvg).toFixed(3);
    }

    // 2. 按输入类型聚类分析
    const typeMap = {};
    for (const r of recentReflections) {
      if (!r.inputSnip) continue;
      // 取中文首2字 + 英文首词做聚类
      const trimmed = r.inputSnip.trim().toLowerCase();
      const chineseMatch = trimmed.match(/[\u4e00-\u9fff]/g);
      const key = chineseMatch ? chineseMatch.slice(0, 2).join('') : (trimmed.split(/\s+/)[0] || 'other');
      if (!typeMap[key]) {
        typeMap[key] = { count: 0, totalConf: 0, lowConfHits: 0, samples: [] };
      }
      typeMap[key].count++;
      typeMap[key].totalConf += r.confidence || 0.5;
      if ((r.confidence || 0.5) < 0.4) typeMap[key].lowConfHits++;
      if (typeMap[key].samples.length < 3) {
        typeMap[key].samples.push(r.inputSnip.substring(0, 30));
      }
    }

    // 3. 计算每个类型的平均置信度，找最差的
    const correlations = Object.entries(typeMap)
      .filter(([_, v]) => v.count >= 2) // 至少出现2次才算
      .map(([key, v]) => ({
        topic: key,
        count: v.count,
        avgConfidence: +(v.totalConf / v.count).toFixed(3),
        lowConfRate: +(v.lowConfHits / v.count).toFixed(3),
        samples: v.samples,
      }))
      .sort((a, b) => a.avgConfidence - b.avgConfidence) // 平均置信度最低的排最前
      .slice(0, 5);

    result.correlations = correlations;

    if (correlations.length > 0) {
      const worst = correlations[0];
      result.topCause = {
        topic: worst.topic,
        avgConfidence: worst.avgConfidence,
        lowConfRate: worst.lowConfRate,
        // 生成一句话解释
        explanation: worst.avgConfidence < 0.3
          ? `最薄弱的是「${worst.topic.replace('_', '')}」类输入，平均置信度仅 ${(worst.avgConfidence * 100).toFixed(0)}%，占总的 ${((worst.count / recentReflections.length) * 100).toFixed(0)}%`
          : worst.lowConfRate > 0.5
            ? `「${worst.topic.replace('_', '')}」类输入低置信率 ${(worst.lowConfRate * 100).toFixed(0)}%，占 ${((worst.count / recentReflections.length) * 100).toFixed(0)}%`
            : null,
      };
      if (result.topCause.explanation) {
        this._stats.correlationsFound++;
      }
    }

    return result;
  }

  /**
   * 从汇总的追踪结果生成可读文本
   */
  format(trace) {
    if (!trace || !trace.traced) return '数据不足以溯源';

    const lines = [];
    if (trace.macroTrend) {
      const trendLabel = { improving: '上升', declining: '下降', stable: '稳定' }[trace.macroTrend] || trace.macroTrend;
      lines.push(`宏观趋势：置信度${trendLabel}`);
    }
    if (trace.confidenceChange !== null) {
      lines.push(`前后半段变化：${(trace.confidenceChange * 100).toFixed(1)}%`);
    }
    if (trace.topCause && trace.topCause.explanation) {
      lines.push(`溯源结论：${trace.topCause.explanation}`);
    }
    if (trace.correlations && trace.correlations.length > 0) {
      lines.push('各类型输入排序（按平均置信度从低到高）：');
      trace.correlations.forEach((c, i) => {
        lines.push(`  ${i + 1}. ${c.topic}：${(c.avgConfidence * 100).toFixed(0)}%（出现${c.count}次）`);
      });
    }
    return lines.join('\n');
  }

  getStats() {
    return { ...this._stats };
  }
}

module.exports = { PatternTracer };
