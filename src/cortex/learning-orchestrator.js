/**
 * LearningOrchestrator — 学习编排器 v1.0.0
 *
 * 心虫过去两轮升级新增了4个学习模块，但它们各自独立不对话：
 *   - ExperienceDistiller  提取可复用抽象  (6.1.8)
 *   - StrategicRestraint   战略克制引擎    (6.1.9)
 *   - ContinuousLearner    持续自动反思    (6.2.0)
 *   - KnowledgeExplorer    知识探索队列    (6.2.1)
 *
 * LearningOrchestrator 不增加新能力，而是把4个模块连成一条流水线——
 * 让心虫有统一的「自我学习状态」认知，并能回答"你现在学得怎么样？"
 *
 * 流水线：
 *   think() 结果 → ContinuousLearner.reflect → 低置信信号 → KnowledgeExplorer
 *                                         ↘ ExperienceDistiller.distill
 *   ExperienceDistiller.recall → 注入 think() 上下文
 *   KnowledgeExplorer.nextToExplore → 最高优先级探索缺口
 *   StrategicRestraint.evaluate → 提案克制检查
 *
 * @version 1.0.0
 */

class LearningOrchestrator {
  constructor(hf) {
    this.hf = hf;
    this._lastCheck = 0;
    this._checkInterval = 10 * 60 * 1000; // 10分钟
  }

  /**
   * 从心虫实例获取各学习模块实例
   */
  _modules() {
    return {
      distiller: this.hf.experienceDistiller || null,
      restraint: this.hf.strategicRestraint || null,
      learner: this.hf.continuousLearner || null,
      explorer: this.hf.knowledgeExplorer || null,
      lesson: this.hf.lesson || null,
      worldTree: this.hf._modules?.worldtree || null,
    };
  }

  /**
   * 统一学习状态报告
   * @returns {Object} 心虫当前学习状态快照
   */
  status() {
    const m = this._modules();
    const now = Date.now();

    // 从各模块采集数据
    const learnerStats = m.learner ? m.learner.getStats() : null;
    const explorerStats = m.explorer ? m.explorer.getStats() : null;
    const distillerStats = m.distiller ? m.distiller.getStats() : null;
    const restraintDontList = m.restraint ? m.restraint.getDontList() : [];
    const lessonCount = m.lesson ? (m.lesson.lessons || []).length : 0;

    // 分析置信度健康度
    const thinkCount = learnerStats?.thinkCount || 0;
    const lowConfHits = learnerStats?.lowConfidenceHits || 0;
    const confidenceHealth = thinkCount > 5
      ? (thinkCount - lowConfHits) / thinkCount
      : null;

    // 学习模块之间是否已联通
    const linkage = {
      learnerToExplorer: false,
      distillerToThink: false,
    };
    // 检查 linkage：连续学习者→探索者 信号是否已传递
    if (m.learner && m.explorer) {
      const explorerGaps = explorerStats?.totalGaps || 0;
      // 如果探索器有缺口（含吸收Learner信号产生的），认为联通
      linkage.learnerToExplorer = explorerGaps > 3;  // 3个固有缺口算基线
    }
    if (m.distiller) {
      linkage.distillerToThink = distillerStats?.totalStored > 0;
    }

    // 主动克制力度
    const restraintStats = m.restraint ? m.restraint.getStats() : null;
    const restraintRate = restraintStats?.evaluationsTotal > 0
      ? +(restraintStats.restrained / restraintStats.evaluationsTotal).toFixed(3)
      : 0;

    // 探索队列状态
    const topExplore = explorerStats?.topPriority || [];

    return {
      version: '1.0.0',
      ts: now,
      meta: {
        description: '心虫自我学习状态快照——4个学习模块的联通状况与运行指标',
      },
      learningModules: {
        experienceDistiller: {
          loaded: !!m.distiller,
          abstractionsStored: distillerStats?.totalStored || 0,
          totalDistilled: distillerStats?.totalDistilled || 0,
        },
        strategicRestraint: {
          loaded: !!m.restraint,
          dontListCount: restraintDontList.length,
          restraintRate,
        },
        continuousLearner: {
          loaded: !!m.learner,
          thinkCount,
          totalReflections: learnerStats?.totalReflections || 0,
          autoLessonsGenerated: learnerStats?.autoLessons || 0,
          confidenceHealth,
        },
        knowledgeExplorer: {
          loaded: !!m.explorer,
          totalGaps: explorerStats?.totalGaps || 0,
          explorationsCompleted: explorerStats?.totalExplorationsCompleted || 0,
          knowledgeAbsorbed: explorerStats?.totalKnowledgeAbsorbed || 0,
          topPending: topExplore,
          byStatus: explorerStats?.byStatus || {},
        },
      },
      linkage: {
        learnerToExplorer: linkage.learnerToExplorer,
        distillerToThink: linkage.distillerToThink,
        reflectionsToLessonBank: (learnerStats?.autoLessons || 0) > 0,
        explorationBacklog: topExplore.length,
      },
      healthScore: this._overallHealth({
        confidenceHealth,
        restraintRate,
        explorationBacklog: topExplore.length,
      }),
      learningLoop: {
        detect: learnerStats?.totalReflections || 0,
        explore: explorerStats?.totalExplorationsCompleted || 0,
        absorb: distillerStats?.totalStored || 0,
        restrain: restraintStats?.restrained || 0,
      },
    };
  }

  /**
   * 整体学习健康度（0-1）
   */
  _overallHealth({ confidenceHealth, restraintRate, explorationBacklog }) {
    let score = 0.5;

    // 置信度健康 >0.7 加分
    if (confidenceHealth !== null) {
      score += (confidenceHealth - 0.5) * 0.3;
    }

    // 克制率 0.1-0.3 最佳（太低=不克制，太高=过度克制）
    if (restraintRate > 0 && restraintRate < 0.1) score -= 0.05; // 克制太少
    if (restraintRate >= 0.1 && restraintRate <= 0.3) score += 0.1; // 适度
    if (restraintRate > 0.5) score -= 0.05; // 过度克制

    // 有待探索缺口加分
    if (explorationBacklog > 0) score += 0.05;

    return Math.max(0, Math.min(1, +score.toFixed(3)));
  }

  /**
   * 执行一次模块间路由，传递信号
   * @returns {Object} 路由结果
   */
  tick() {
    const m = this._modules();
    const results = [];

    // 1. ContinuousLearner → KnowledgeExplorer：传递置信信号
    if (m.learner && m.explorer) {
      try {
        const stats = m.learner.getStats();
        m.explorer.absorbLearnerSignals(stats);
        results.push({ from: 'continuousLearner', to: 'knowledgeExplorer', action: 'absorbLearnerSignals', success: true });
      } catch (e) {
        results.push({ from: 'continuousLearner', to: 'knowledgeExplorer', error: e.message });
      }
    }

    // 2. KnowledgeExplorer 已有探索结果 → 可注入 WorldTree
    // (执行端由 agent 工具做搜索，本层只标记可吸收的缺口)
    if (m.explorer) {
      const explored = m.explorer.getGaps({ status: 'explored' });
      for (const gap of explored.slice(0, 3)) {
        if (gap.explorationResult?.success && !gap._absorbedToWorldTree) {
          results.push({ from: 'knowledgeExplorer', to: 'worldTree', gap: gap.topic, action: 'ready_to_absorb' });
        }
      }
    }

    return {
      ticked: results.length > 0,
      results,
      status: this.status(),
    };
  }
}

module.exports = { LearningOrchestrator };
