/**
 * 好奇心引擎 (Curiosity Engine) v1.0.0
 *
 * ⚠️ [安全修复] 此模块属于可选主动引擎组件，与 HeartFlow 认知引擎核心功能无关
 * 仅在用户显式启用 MarkCode 独立 Agent 系统时才会被加载
 * 不应作为心虫核心认知能力的一部分
 *
 * 基于信息增益的好奇心驱动探索
 */

class CuriosityEngine {
  constructor(options = {}) {
    this.knowledgeGaps = new Map();
    this.explorationHistory = [];
    this.maxHistory = options.maxHistory || 100;
    this.curiosityThreshold = options.curiosityThreshold || 0.3;
    this.informationGainWeight = options.informationGainWeight || 0.6;
    this.uncertaintyWeight = options.uncertaintyWeight || 0.4;
  }

  /**
   * 注册知识空白
   */
  registerGap(gap) {
    const id = gap.id || `gap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const gapRecord = {
      id,
      topic: gap.topic,
      question: gap.question,
      currentKnowledge: gap.currentKnowledge || '',
      missingKnowledge: gap.missingKnowledge || '',
      importance: gap.importance || 0.5,
      curiosityStrength: 0,
      explored: false,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    this.knowledgeGaps.set(id, gapRecord);
    this._recalculateCuriosity(id);

    return id;
  }

  /**
   * 重新计算好奇心强度
   */
  _recalculateCuriosity(gapId) {
    const gap = this.knowledgeGaps.get(gapId);
    if (!gap) return;

    // 信息增益潜力
    const informationGain = this._estimateInformationGain(gap);

    // 不确定性
    const uncertainty = this._estimateUncertainty(gap);

    gap.curiosityStrength = Math.min(1,
      informationGain * this.informationGainWeight +
      uncertainty * this.uncertaintyWeight
    );
  }

  /**
   * 估计信息增益潜力
   */
  _estimateInformationGain(gap) {
    // 主题越具体，信息增益越低
    const topicComplexity = gap.topic.split(' ').length;
    const specificityPenalty = Math.min(0.3, topicComplexity * 0.05);

    // 重要性加分
    const importanceBonus = gap.importance * 0.4;

    return Math.max(0, 0.7 - specificityPenalty + importanceBonus);
  }

  /**
   * 估计不确定性
   */
  _estimateUncertainty(gap) {
    // 当前知识越少，不确定性越高
    const knowledgeLength = (gap.currentKnowledge || '').length;
    const knowledgePenalty = Math.min(0.4, knowledgeLength / 500);

    // 问题越开放，不确定性越高
    const questionMarks = (gap.question.match(/\?/g) || []).length;
    const openQuestionBonus = Math.min(0.3, questionMarks * 0.15);

    return Math.min(1, 0.5 - knowledgePenalty + openQuestionBonus);
  }

  /**
   * 获取最高好奇心的Gap
   */
  getTopCuriosityGaps(count = 5) {
    const gaps = [...this.knowledgeGaps.values()]
      .filter(g => !g.explored && g.curiosityStrength >= this.curiosityThreshold)
      .sort((a, b) => b.curiosityStrength - a.curiosityStrength);

    return gaps.slice(0, count);
  }

  /**
   * 探索Gap
   */
  explore(gapId, result) {
    const gap = this.knowledgeGaps.get(gapId);
    if (!gap) return null;

    gap.explored = true;
    gap.exploredAt = Date.now();
    gap.explorationResult = result;

    this.explorationHistory.push({
      gapId,
      topic: gap.topic,
      result,
      timestamp: Date.now(),
      satisfaction: result.satisfaction || 0.5
    });

    // 清理历史
    if (this.explorationHistory.length > this.maxHistory) {
      this.explorationHistory = this.explorationHistory.slice(-this.maxHistory);
    }

    // 更新相关Gap的好奇心
    this._updateRelatedGaps(gap.topic, result);

    return gap;
  }

  /**
   * 更新相关Gap的好奇心
   */
  _updateRelatedGaps(topic, result) {
    const topicWords = new Set(topic.toLowerCase().split(' '));

    for (const [id, gap] of this.knowledgeGaps) {
      if (gap.explored) continue;

      const gapWords = new Set(gap.topic.toLowerCase().split(' '));
      const intersection = [...topicWords].filter(w => gapWords.has(w)).length;

      if (intersection > 0) {
        // 相关Gap好奇心下降（因为探索结果可能解决了部分问题）
        gap.curiosityStrength *= 0.9;
      }
    }
  }

  /**
   * 检测新的知识空白
   */
  detectGaps(text, context = {}) {
    const gaps = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    for (const sentence of sentences) {
      // 检测未知概念
      const unknownConcepts = this._extractUnknownConcepts(sentence, context);

      for (const concept of unknownConcepts) {
        const existingGap = [...this.knowledgeGaps.values()]
          .find(g => g.topic.toLowerCase().includes(concept.toLowerCase()));

        if (!existingGap) {
          const gapId = this.registerGap({
            topic: concept,
            question: `什么是${concept}？`,
            importance: 0.5
          });
          gaps.push(this.knowledgeGaps.get(gapId));
        }
      }
    }

    return gaps;
  }

  /**
   * 提取未知概念
   */
  _extractUnknownConcepts(text, context = {}) {
    // 简单实现：检测包含问号的句子中的关键词
    const concepts = [];

    // 检测 "X是什么" 类型的问题
    const whatMatches = text.match(/([^是]+)是什么/g);
    if (whatMatches) {
      for (const match of whatMatches) {
        const concept = match.replace('是什么', '').trim();
        if (concept.length > 1 && concept.length < 20) {
          concepts.push(concept);
        }
      }
    }

    // 检测 "为什么" 类型的问题
    const whyMatches = text.match(/为什么(.+?)[?？]/g);
    if (whyMatches) {
      for (const match of whyMatches) {
        const reason = match.replace(/为什么|为什么/, '').trim();
        if (reason.length > 1) {
          concepts.push(reason);
        }
      }
    }

    return [...new Set(concepts)];
  }

  /**
   * 获取探索统计
   */
  getStats() {
    const totalGaps = this.knowledgeGaps.size;
    const exploredGaps = [...this.knowledgeGaps.values()].filter(g => g.explored).length;
    const avgCuriosity = [...this.knowledgeGaps.values()]
      .reduce((sum, g) => sum + g.curiosityStrength, 0) / (totalGaps || 1);

    return {
      totalGaps,
      exploredGaps,
      unexploredGaps: totalGaps - exploredGaps,
      averageCuriosity: avgCuriosity,
      recentExplorations: this.explorationHistory.slice(-5)
    };
  }

  /**
   * 删除Gap
   */
  deleteGap(gapId) {
    return this.knowledgeGaps.delete(gapId);
  }

  /**
   * 更新Gap重要性
   */
  updateImportance(gapId, importance) {
    const gap = this.knowledgeGaps.get(gapId);
    if (!gap) return null;

    gap.importance = Math.min(1, Math.max(0, importance));
    this._recalculateCuriosity(gapId);
    return gap;
  }
}

module.exports = { CuriosityEngine };
