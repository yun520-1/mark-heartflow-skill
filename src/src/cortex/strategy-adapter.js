/**
 * 策略适配器 (Strategy Adapter) v1.0.0
 *
 * 根据经验调整执行策略
 */

const { ExperienceCollector } = require('./experience-collector');

class StrategyAdapter {
  constructor(options = {}) {
    this.experienceCollector = options.experienceCollector || new ExperienceCollector();
    this.confidenceThreshold = options.confidenceThreshold || 0.6;
    this.adaptationHistory = [];
  }

  /**
   * 调整策略
   */
  adapt(task, context = {}) {
    const relatedExperiences = this.experienceCollector.findRelated(task, context, {
      maxResults: 5,
      minUsefulness: 0.3
    });

    if (relatedExperiences.length === 0) {
      return {
        adapted: false,
        reason: '没有找到相关经验',
        strategy: context.strategy || 'default',
        confidence: 0.5
      };
    }

    // 分析经验
    const analysis = this._analyzeExperiences(relatedExperiences);

    // 生成调整建议
    const adaptation = this._generateAdaptation(analysis, context);

    // 记录调整历史
    this.adaptationHistory.push({
      task,
      context,
      analysis,
      adaptation,
      timestamp: Date.now()
    });

    return {
      adapted: true,
      reason: `基于 ${relatedExperiences.length} 条相关经验`,
      strategy: adaptation.strategy,
      confidence: adaptation.confidence,
      adjustments: adaptation.adjustments,
      insights: analysis.insights
    };
  }

  /**
   * 分析经验
   */
  _analyzeExperiences(experiences) {
    const successful = experiences.filter(e => e.success);
    const failed = experiences.filter(e => !e.success);

    const insights = [];
    let avgUsefulness = 0;

    // 分析成功经验
    if (successful.length > 0) {
      const avgDuration = successful.reduce((sum, e) => sum + (e.result?.duration || 0), 0) / successful.length;
      const avgSteps = successful.reduce((sum, e) => sum + (e.result?.steps?.length || 0), 0) / successful.length;

      insights.push({
        type: 'success_pattern',
        description: `成功的任务平均耗时 ${(avgDuration / 1000).toFixed(1)}s，平均 ${avgSteps.toFixed(1)} 步`
      });

      avgUsefulness = successful.reduce((sum, e) => sum + (e.usefulness || 0), 0) / successful.length;
    }

    // 分析失败经验
    if (failed.length > 0) {
      const errorTypes = {};
      for (const exp of failed) {
        const error = exp.error || '';
        if (/syntax|parse/i.test(error)) errorTypes.syntax = (errorTypes.syntax || 0) + 1;
        if (/dependency|module|import/i.test(error)) errorTypes.dependency = (errorTypes.dependency || 0) + 1;
        if (/permission|denied/i.test(error)) errorTypes.permission = (errorTypes.permission || 0) + 1;
        if (/timeout/i.test(error)) errorTypes.timeout = (errorTypes.timeout || 0) + 1;
      }

      for (const [type, count] of Object.entries(errorTypes)) {
        insights.push({
          type: 'failure_pattern',
          description: `${type} 错误出现 ${count} 次`
        });
      }
    }

    // 通用洞察
    insights.push({
      type: 'general',
      description: `基于 ${experiences.length} 条经验，成功率 ${((successful.length / experiences.length) * 100).toFixed(1)}%`
    });

    return {
      successful: successful.length,
      failed: failed.length,
      total: experiences.length,
      successRate: experiences.length > 0 ? successful.length / experiences.length : 0,
      averageUsefulness: avgUsefulness,
      insights
    };
  }

  /**
   * 生成调整
   */
  _generateAdaptation(analysis, context = {}) {
    const adjustments = [];
    let strategy = context.strategy || 'default';
    let confidence = analysis.averageUsefulness;

    // 基于成功率调整策略
    if (analysis.successRate >= 0.8) {
      adjustments.push({
        type: 'increase_confidence',
        description: '高成功率，提高执行信心'
      });
      confidence = Math.min(1, confidence + 0.2);
    } else if (analysis.successRate < 0.5) {
      adjustments.push({
        type: 'decrease_confidence',
        description: '低成功率，降低执行信心'
      });
      confidence = Math.max(0.1, confidence - 0.3);
      strategy = 'conservative';
    }

    // 基于有用性调整
    if (analysis.averageUsefulness >= 0.7) {
      adjustments.push({
        type: 'prefer_similar',
        description: '历史经验有用，优先采用类似方法'
      });
    }

    return {
      strategy,
      confidence,
      adjustments,
      recommendedTools: this._getRecommendedTools(analysis, context),
      avoidPatterns: this._getAvoidPatterns(analysis)
    };
  }

  /**
   * 获取推荐工具
   */
  _getRecommendedTools(analysis, context = {}) {
    // 基于成功经验推断推荐工具
    const successful = analysis.successful || 0;
    if (successful > 0) {
      return context.preferredTools || ['bash', 'file'];
    }
    return [];
  }

  /**
   * 获取应避免的模式
   */
  _getAvoidPatterns(analysis) {
    const patterns = [];

    if (analysis.failed > 0) {
      // 基于失败经验添加避免建议
      patterns.push({
        pattern: '快速执行',
        reason: '失败任务中快速执行占比高'
      });
    }

    return patterns;
  }

  /**
   * 获取调整历史
   */
  getHistory(limit = 10) {
    return this.adaptationHistory.slice(-limit);
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      totalAdaptations: this.adaptationHistory.length,
      adaptationsByStrategy: this.adaptationHistory.reduce((acc, h) => {
        acc[h.adaptation.strategy] = (acc[h.adaptation.strategy] || 0) + 1;
        return acc;
      }, {}),
      averageConfidence: this.adaptationHistory.length > 0
        ? this.adaptationHistory.reduce((sum, h) => sum + h.adaptation.confidence, 0) / this.adaptationHistory.length
        : 0
    };
  }

  /**
   * 重置历史
   */
  reset() {
    this.adaptationHistory = [];
  }
}

module.exports = { StrategyAdapter };
