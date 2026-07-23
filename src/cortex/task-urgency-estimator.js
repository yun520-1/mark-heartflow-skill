/**
 * TaskUrgencyEstimator — 任务紧迫性估计器 v1.0.0
 *
 * 「做研究需要一个松弛的环境」——梁文锋
 * DeepSeek两条管理线：50%以上时间不被安排，留给自由探索。
 *
 * 心虫现有的 think() 对所有输入都走完整推理链路，没有区分
 * "这个只是普通问题" vs "这个需要深度思考"。
 *
 * TaskUrgencyEstimator 在 think 入口前置判断：
 *   - 快速识别输入是简单查询/复杂推理/紧急指令
 *   - 建议合适的认知投入级别
 *   - 让心虫"松弛"时省资源，"紧绷"时投入深度
 *
 * 来源：梁文锋"松弛环境"理念 + "50%自由探索"管理。
 *
 * @version 1.0.0
 */

const URGENCY_PATTERNS = [
  // 高紧迫：修复/崩溃/紧急
  { pattern: /崩溃|报错|error|crash|fail|紧急|修复|坏了/i, level: 'high', weight: 0.9 },
  // 高紧迫：安全/风险
  { pattern: /安全|风险|漏洞|攻击|泄露|hack|break|security/i, level: 'high', weight: 0.85 },
  // 中紧迫：决策/分析
  { pattern: /分析|评估|判断|决策|应该|是否|推荐|建议|比较/i, level: 'medium', weight: 0.7 },
  // 中紧迫：升级/开发
  { pattern: /升级|开发|实现|构建|创建|写|设计|优化|重构/i, level: 'medium', weight: 0.6 },
  // 低紧迫：闲聊/简单
  { pattern: /你好|嗨|hi|hello|在吗|早安|晚安|谢谢|好的|OK|ok|嗯/i, level: 'low', weight: -0.5 },
  // 低紧迫：状态查询
  { pattern: /状态|status|升级了|版本|version|多少[i]?$/i, level: 'low', weight: -0.3 },
];

class TaskUrgencyEstimator {
  constructor(opts = {}) {
    this._config = {
      minUrgentChars: opts.minUrgentChars || 8,        // 短于这个字符数不走高紧迫
      maxRelaxedChars: opts.maxRelaxedChars || 150,     // 长于这个不走低紧迫
      outputMode: opts.outputMode || 'hint',             // hint | strict
    };
    this._stats = {
      totalEstimated: 0,
      highUrgency: 0,
      mediumUrgency: 0,
      lowUrgency: 0,
    };
  }

  /**
   * 估计输入的任务紧迫性和建议的认知投入
   * @param {string} input - 用户输入
   * @param {Object} context - 可选的上文 context
   * @returns {Object} { urgency, suggestedDepth, rationale, features }
   */
  estimate(input, context = {}) {
    this._stats.totalEstimated++;
    if (!input || typeof input !== 'string') {
      return { urgency: 'unknown', suggestedDepth: 1, rationale: '无效输入', features: {} };
    }

    const text = input.trim();
    const features = this._extractFeatures(text);
    let urgency = this._classify(text, features);

    // 上下文修正：如果上文是紧急场景，当前输入接续也升一级
    if (context.previousUrgency === 'high' && urgency === 'medium') urgency = 'high';

    // 输出修正
    if (urgency === 'high') this._stats.highUrgency++;
    else if (urgency === 'medium') this._stats.mediumUrgency++;
    else this._stats.lowUrgency++;

    // 建议深度（与 thinkFast/thinkDeep 对应）
    const depthMap = { high: 3, medium: 2, low: 1 };
    const suggestedDepth = depthMap[urgency] || 1;

    return {
      urgency,
      suggestedDepth,
      rationale: this._generateRationale(urgency, features),
      features,
      stats: { ...this._stats },
    };
  }

  _extractFeatures(text) {
    const features = {
      length: text.length,
      hasQuestion: /[？?]$/.test(text.trim()),
      hasExclamation: /[！!]/.test(text.trim()),
      hasJson: text.trim().startsWith('{') || text.trim().startsWith('['),
      hasCode: /function|class|const|import|require|def /.test(text),
      keywordDensity: 0,
    };

    // 关键词密度（有实际内容的词占比）
    const words = text.split(/[\s，。、！？：；""''（）\n,\.!\?:;\(\)]+/).filter(w => w.length > 1);
    features.wordCount = words.length;
    features.keywordDensity = words.length > 0
      ? words.filter(w => w.length > 2).length / words.length
      : 0;

    // 认知投入信号
    features.technicalDepth = 0;
    if (/算法|架构|设计模式|抽象|递归|并行|分布|集群|向量|维度|优化/i.test(text)) features.technicalDepth += 0.4;
    if (/复杂|系统|框架|协议|规范|标准|体系|策略|战略/i.test(text)) features.technicalDepth += 0.3;
    if (features.hasCode) features.technicalDepth += 0.3;

    return features;
  }

  _classify(text, features) {
    let score = 0;

    // 模式匹配
    for (const p of URGENCY_PATTERNS) {
      if (p.pattern.test(text)) {
        score += p.weight;
      }
    }

    // 长度惩罚/奖励
    if (features.length < this._config.minUrgentChars) score -= 0.3;
    if (features.length > this._config.maxRelaxedChars) score += 0.2;

    // 技术深度修正
    score += features.technicalDepth * 0.5;

    // 是否带代码
    if (features.hasCode) score += 0.3;

    // 阈值
    if (score >= 0.5) return 'high';
    if (score >= 0) return 'medium';
    return 'low';
  }

  _generateRationale(urgency, features) {
    const reasons = [];
    if (features.technicalDepth > 0.5) reasons.push('技术深度较高');
    if (features.length > 200) reasons.push('上下文较长');
    if (features.hasCode) reasons.push('包含代码');
    if (features.hasExclamation) reasons.push('紧迫感较强');
    if (features.length < 15) reasons.push('输入极短');

    const urgencyLabels = { high: '高紧迫', medium: '中度', low: '松弛' };

    if (reasons.length > 0) {
      return `${urgencyLabels[urgency]}：${reasons.join('，')}`;
    }
    return `${urgencyLabels[urgency]}：无明显紧迫信号`;
  }

  getStats() {
    return {
      ...this._stats,
      distribution: {
        highRate: this._stats.totalEstimated > 0
          ? +(this._stats.highUrgency / this._stats.totalEstimated).toFixed(3) : 0,
        mediumRate: this._stats.totalEstimated > 0
          ? +(this._stats.mediumUrgency / this._stats.totalEstimated).toFixed(3) : 0,
        lowRate: this._stats.totalEstimated > 0
          ? +(this._stats.lowUrgency / this._stats.totalEstimated).toFixed(3) : 0,
      },
    };
  }
}

module.exports = { TaskUrgencyEstimator };
