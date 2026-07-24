/**
 * HypothesisDriver — 假设驱动探索 v1.0.0
 *
 * 「今天的大模型不知道自己不知道什么」——周伯文，WAIC 2026
 * 「失败乃成功之母，AI到了该听这句话的年纪」
 *
 * 心虫有置信度检测、有纵向模式识别，但检测到"反复低置信"后只会记录，
 * 不会主动换方向。HypothesisDriver 补的是：
 *   当多次 low-confidence 命中同一主题 → 自动生成"可能是哪里错了"的假设
 *   → 把假设注入 KnowledgeExplorer 探索队列 → 下次主动验证
 *
 * 这不是"加新模块"，是把心虫已有的数据（置信趋势、模式、知识缺口）
 * 接上一条新的执行回路：被失败驱动。
 *
 * @version 1.0.0
 */

const HYPOTHESIS_TEMPLATES = [
  { pattern: /置信度.*下降|confidence.*declin|低置信.*反复/i,
    gen: (topic) => `假设：心虫对「${topic}」领域的判断框架可能不匹配实际。当前使用的分类/推理模型也许不适合该领域。建议：换一种分类框架重新分析。` },
  { pattern: /boundary_hit|边界.*命中/i,
    gen: (topic) => `假设：心虫被设定为不擅长「${topic}」，但用户反复输入说明它需要这个能力。也许不是"不能做"，而是"需要换方式做"。建议：尝试用更简单的规则替代。` },
  { pattern: /spinning_detected|空转/i,
    gen: (topic) => `假设：反复短输入被归类为分析，说明心虫缺少一个"我是不是在空转"的自我察觉阈值。建议：增加空转自检，触发主动请求更多上下文。` },
  { pattern: /misclassification|错误分类/i,
    gen: (topic) => `假设：「${topic}」可能被分到了错误的类别，导致走了不合适的推理路径。建议：检查路由规则是否涵盖该输入类型。` },
];

class HypothesisDriver {
  constructor(hf) {
    this.hf = hf;
    this._stats = {
      hypothesesGenerated: 0,
      hypothesesVerified: 0,
      hypothesesProvenRight: 0,
      activeHypotheses: [],
    };
  }

  /**
   * 从 ContinuousLearner 的累积摘要中提取模式，生成假设
   * @param {Object} summary - CumulativeLearner._cumulativeSummary() 的返回
   * @returns {Array} 生成的假设列表
   */
  generate(summary) {
    if (!summary) return [];
    const hypotheses = [];

    // 1. 从置信度趋势生成假设
    if (summary.confidenceTrend === 'declining' && summary.recurringPatterns) {
      for (const pattern of summary.recurringPatterns) {
        if (pattern.type === 'confidence_gap' || pattern.rate > 0.25) {
          // 从 recentReflections 中找到低置信主题
          const topic = this._findTopicFromPattern(pattern);
          const h = this._makeHypothesis(pattern.type, pattern, topic);
          if (h) hypotheses.push(h);
        }
      }
    }

    // 2. 从重复模式生成假设
    if (summary.recurringTopics && summary.recurringTopics.length > 0) {
      for (const rt of summary.recurringTopics.slice(0, 3)) {
        // 同一话题反复出现低置信
        const existingH = hypotheses.find(h => h.topic === rt.topic);
        if (!existingH) {
          hypotheses.push({
            id: `hyp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            topic: rt.topic,
            source: 'recurring_low_confidence',
            confidence: Math.min(0.3 + rt.count * 0.05, 0.6),
            statement: `假设：心虫对「${rt.topic}」的理解方式可能需要调整。`,
            action: '尝试用不同的分析角度或查询更基础的资料。',
            priority: Math.min(rt.count * 2, 8),
            createdAt: Date.now(),
            status: 'active',
            sourceCount: rt.count,
          });
        }
      }
    }

    // 3. 尝试注册到 KnowledgeExplorer
    if (hypotheses.length > 0 && this.hf && this.hf.knowledgeExplorer) {
      for (const h of hypotheses) {
        this.hf.knowledgeExplorer.registerGap({
          topic: `[假设驱动] ${h.topic}`,
          question: h.statement + ' ' + h.action,
          source: `HypothesisDriver: ${h.source}`,
          priority: h.priority,
          suggestedQuery: h.topic,
          suggestedSource: 'arxiv',
        });
        this._stats.hypothesesGenerated++;
        this._stats.activeHypotheses.push(h.id);
      }
    }

    return hypotheses;
  }

  _findTopicFromPattern(pattern) {
    // 尝试从 recentReflections 中找关联话题
    try {
      if (this.hf && this.hf.continuousLearner) {
        const stats = this.hf.continuousLearner.getStats();
        const recents = stats.recentReflections || [];
        // 找最近低置信的输入
        const lowConf = recents.filter(r => r.confidence !== undefined && r.confidence < 0.4);
        if (lowConf.length > 0 && lowConf[0].inputSnip) {
          return lowConf[0].inputSnip.replace(/^test/i, '').trim().substring(0, 20) || '未知领域';
        }
      }
    } catch (e) { /* 降级 */ }
    return '未识别领域';
  }

  _makeHypothesis(type, pattern, topic) {
    // 匹配模板
    for (const tpl of HYPOTHESIS_TEMPLATES) {
      if (tpl.pattern.test(type)) {
        const statement = typeof tpl.gen === 'function' ? tpl.gen(topic) : tpl.gen;
        return {
          id: `hyp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          topic,
          source: type,
          confidence: Math.min(0.3 + (pattern.rate || 0), 0.6),
          statement,
          action: '验证假设后更新判断框架或补充知识',
          priority: 6,
          createdAt: Date.now(),
          status: 'active',
          sourceCount: pattern.count || 1,
        };
      }
    }
    return null;
  }

  /**
   * 验证一个假设（由外部调用）
   */
  verify(hypothesisId, provenRight) {
    const idx = this._stats.activeHypotheses.indexOf(hypothesisId);
    if (idx !== -1) {
      this._stats.activeHypotheses.splice(idx, 1);
    }
    this._stats.hypothesesVerified++;
    if (provenRight) this._stats.hypothesesProvenRight++;
  }

  getStats() {
    return {
      ...this._stats,
      activeCount: this._stats.activeHypotheses.length,
    };
  }
}

module.exports = { HypothesisDriver };
