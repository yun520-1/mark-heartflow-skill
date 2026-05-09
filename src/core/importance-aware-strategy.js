/**
 * HeartFlow ImportanceAwareStrategy v11.26.0
 * 
 * 来源: 基于 auto-compaction-engine.js 的 TrimStrategy 改造
 * 核心改进: 压缩时按 importance 保留，不是按新旧
 * 
 * 策略逻辑:
 * 1. 计算每条消息的 importance 分数
 * 2. 优先保留高分消息
 * 3. 低分消息合并为摘要
 */

const { ImportanceScorer } = require('./importance-scorer.js');

// ============================================================
// 重要性感知压缩策略
// ============================================================

class ImportanceAwareStrategy {
  /**
   * @param {Object} options
   * @param {number} options.keepLatest - 保留最近 N 条（即使低分）
   * @param {number} options.keepMinScore - 最低分数以上的全部保留
   * @param {boolean} options.keepSystem - 是否保留 system 消息
   * @param {boolean} options.mergeLowScore - 低分消息是否合并为摘要
   * @param {number} options.maxSummaryLength - 摘要最大长度
   */
  constructor(options = {}) {
    this.keepLatest = options.keepLatest || 5;  // 无论分数，保留最近 5 条
    this.keepMinScore = options.keepMinScore || 60;  // 60 分以上的全部保留
    this.keepSystem = options.keepSystem !== false;
    this.mergeLowScore = options.mergeLowScore !== false;
    this.maxSummaryLength = options.maxSummaryLength || 300;
    
    // 重要性评分器
    this.scorer = new ImportanceScorer({
      memoryDir: options.memoryDir,
    });
  }

  /**
   * 压缩消息
   * @param {Array} messages - [{role, content, metadata?, ...}]
   * @param {number} maxTokens - 最大 token 数
   * @param {SimpleTokenizer} tokenizer
   * @returns {{ compacted: Array, summary: string, dropped: number }}
   */
  compress(messages, maxTokens, tokenizer) {
    if (!messages || messages.length === 0) {
      return { compacted: [], summary: '[无历史消息]', dropped: 0 };
    }

    // 分离 system 和非 system 消息
    const systemMsgs = this.keepSystem ? messages.filter(m => m.role === 'system') : [];
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');

    if (nonSystemMsgs.length === 0) {
      return { compacted: messages, summary: '[无非系统消息]', dropped: 0 };
    }

    // ============================================================
    // 第一步: 计算所有消息的 importance 分数
    // ============================================================
    
    const scoredMessages = nonSystemMsgs.map((msg, index) => {
      // 从 metadata 中提取记忆数据（如果有）
      const memoryData = msg.metadata || {};
      const score = this.scorer.score({
        ...memoryData,
        // 消息本身的信息
        role: msg.role,
        timestamp: msg.timestamp || (Date.now() - (nonSystemMsgs.length - index) * 60000),
      });
      
      return {
        ...msg,
        _importanceScore: score,
        _originalIndex: index,
      };
    });

    // ============================================================
    // 第二步: 分类
    // ============================================================

    // 保留区: 最近 N 条（无论分数）
    const recentCutoff = Math.max(0, scoredMessages.length - this.keepLatest);
    const recentMessages = scoredMessages.slice(recentCutoff);  // 最新的 keepLatest 条
    
    // 高分区: 分数 >= keepMinScore
    const highScoreMessages = scoredMessages
      .slice(0, recentCutoff)  // 只看旧消息（不包含 recent）
      .filter(msg => msg._importanceScore >= this.keepMinScore);
    
    // 低分区: 分数 < keepMinScore 且不是最近的
    const lowScoreMessages = scoredMessages
      .slice(0, recentCutoff)
      .filter(msg => msg._importanceScore < this.keepMinScore);

    // ============================================================
    // 第三步: 构建保留列表
    // ============================================================

    const toKeep = [
      ...systemMsgs,
      ...highScoreMessages,  // 高分区全部保留
      ...recentMessages,     // 最近的消息全部保留
    ];

    // 检查 token 限制
    let accumulatedTokens = tokenizer.estimateMessages(toKeep);
    const targetTokens = maxTokens;

    // 如果超限，从低分消息开始删（直到在限制内）
    if (accumulatedTokens > targetTokens) {
      // 按分数从低到高排序要删除的消息
      const sortedLowScore = [...lowScoreMessages].sort(
        (a, b) => a._importanceScore - b._importanceScore
      );

      for (const msg of sortedLowScore) {
        if (accumulatedTokens <= targetTokens) break;
        // 跳过（标记为要删除）
        accumulatedTokens -= tokenizer.estimate(msg);
      }
    }

    // ============================================================
    // 第四步: 生成低分消息的摘要
    // ============================================================

    let summary = '';
    const droppedCount = lowScoreMessages.length;

    if (droppedCount > 0 && this.mergeLowScore) {
      // 合并低分消息为摘要
      summary = this._generateSummary(lowScoreMessages, droppedCount);
      
      // 在高分区和低分区之间插入摘要
      const summaryMsg = {
        role: 'system',
        content: summary,
        isSummary: true,
        originalCount: droppedCount,
        summaryType: 'importance_compressed',
      };

      // 重新构建 compacted: system + 高分 + 摘要 + recent
      const highScoreTokens = tokenizer.estimateMessages(highScoreMessages);
      const recentTokens = tokenizer.estimateMessages(recentMessages);
      const summaryTokens = tokenizer.estimate(summaryMsg);

      // 检查是否放得下
      const totalTokens = tokenizer.estimateMessages(systemMsgs) + 
                          highScoreTokens + 
                          recentTokens + 
                          summaryTokens;

      if (totalTokens <= targetTokens) {
        toKeep.push(summaryMsg);
      } else if (highScoreTokens + recentTokens + summaryTokens <= targetTokens) {
        // 如果放不下 system，就不放 system
        toKeep.length = 0;
        toKeep.push(...highScoreMessages, summaryMsg, ...recentMessages);
      }
    }

    // ============================================================
    // 第五步: 按原始顺序排序
    // ============================================================

    // 保持消息顺序（system + 高分按原顺序 + recent 按原顺序）
    const compacted = this._sortByOriginalOrder(toKeep.filter(m => !m.isSummary));
    
    if (summary && !compacted.find(m => m.isSummary)) {
      // 摘要没有被加入，尝试加回去
      const summaryMsg = {
        role: 'system',
        content: summary,
        isSummary: true,
        originalCount: droppedCount,
        summaryType: 'importance_compressed',
      };
      if (tokenizer.estimateMessages(compacted) + tokenizer.estimate(summaryMsg) <= targetTokens) {
        compacted.push(summaryMsg);
      }
    }

    // 确保 system 消息在最前面
    const finalCompacted = [
      ...systemMsgs,
      ...compacted.filter(m => m.role !== 'system' && !m.isSummary),
      ...compacted.filter(m => m.isSummary),
    ];

    return {
      compacted: finalCompacted,
      summary: summary || '[无压缩]',
      dropped: droppedCount,
      stats: {
        highScoreKept: highScoreMessages.length,
        recentKept: recentMessages.length,
        lowScoreCompressed: droppedCount,
        averageScore: Math.round(
          scoredMessages.reduce((sum, m) => sum + m._importanceScore, 0) / scoredMessages.length
        ),
      },
    };
  }

  /**
   * 生成低分消息的摘要
   */
  _generateSummary(lowScoreMessages, totalDropped) {
    if (lowScoreMessages.length === 0) return '';

    // 收集关键信息
    const topics = [];
    const keywords = [];
    const contents = lowScoreMessages.map(m => {
      const content = typeof m === 'string' ? m : (m.content || '');
      return content;
    });

    // 提取关键词
    const cnWords = contents.join('').match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const enWords = contents.join('').match(/[a-zA-Z]{4,}/g) || [];
    
    const wordCount = {};
    [...cnWords, ...enWords].forEach(w => {
      wordCount[w] = (wordCount[w] || 0) + 1;
    });

    const topWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    // 提取问句中的主题
    contents.forEach(content => {
      const questions = content.match(/[?？][^?？]*$/gm);
      if (questions) {
        questions.forEach(q => {
          const clean = q.replace(/[?？]/g, '').trim();
          if (clean.length > 2 && clean.length < 50) {
            topics.push(clean);
          }
        });
      }
    });

    const uniqueTopics = [...new Set(topics)].slice(0, 3);
    const topicStr = uniqueTopics.length > 0 ? uniqueTopics.join('、') : '一般性讨论';

    return `[重要性压缩摘要] ${totalDropped} 条低分消息已压缩。` +
      `主题: ${topicStr}。关键词: ${topWords.join(', ')}。`;
  }

  /**
   * 按原始顺序排序
   */
  _sortByOriginalOrder(messages) {
    return messages
      .filter(m => !m.isSummary)
      .sort((a, b) => {
        // system 消息排在最前
        if (a.role === 'system') return -1;
        if (b.role === 'system') return 1;
        // 其他按原始索引
        return (a._originalIndex || 0) - (b._originalIndex || 0);
      });
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  ImportanceAwareStrategy,
};
