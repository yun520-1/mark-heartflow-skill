/**
 * IntentClassifier — 意图分类器
 * 
 * 基于用户输入，精确分类意图类型和子类型。
 * 与 heart-logic 的 whatIsThis 协同工作。
 */

class IntentClassifier {
  constructor(options = {}) {
    this.name = 'intent-classifier';
    this.version = '1.0.0';
    this.categories = this._initCategories();
  }

  _initCategories() {
    return {
      inquire: { weight: 1, patterns: [/什么是|是什么|告诉我|解释|什么意思|怎么回事|怎么理解|为何/] },
      analyze: { weight: 2, patterns: [/分析|比较|对比|区别|差异|vs|versus|为什么|为啥|原因|帮我看看|帮我分析|这段代码|这个逻辑|排查|诊断/] },
      create: { weight: 1, patterns: [/写一个|写一个|创建|生成|设计|画|做|制作|搞一个|搞个|帮我写|写个|写一个|写一段|实现(一个|一下)?/] },
      evaluate: { weight: 2, patterns: [/好不好|对不对|值得|应该|建议|推荐|这个方案|这个思路|怎么样|行不行|靠谱吗|合理吗|优劣/] },
      execute: { weight: 3, patterns: [/运行|执行|启动|打开|安装|配置|跑一下|跑起来|测试一下|试一下|部署|上线|调用/] },
      meta: { weight: 1, patterns: [/你是谁|你能做什么|你的版本|你的能力|介绍一下你|你是什么/] },
    };
  }

  classify(input, context = {}) {
    if (!input || typeof input !== 'string') {
      return {
        primary: null,
        scores: {},
        confidence: 0,
        isAmbiguous: false,
        allIntents: [],
        error: 'invalid_input'
      };
    }

    const q = input.toLowerCase();
    const scores = {};

    for (const [cat, config] of Object.entries(this.categories)) {
      scores[cat] = 0;
      for (const p of config.patterns) {
        if (p.test(q)) scores[cat] += config.weight;
      }
    }

    // 从 context 中提取已有分类（仅接受已定义的类别，防止注入任意类别）
    const ctxCategory = context.whatIsThis?.category;
    if (ctxCategory && this.categories[ctxCategory]) {
      scores[ctxCategory] = (scores[ctxCategory] || 0) + 2;
    }

    // 找最高分
    let maxScore = 0;
    let primaryIntent = 'general';
    for (const [cat, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = cat;
      }
    }

    return {
      primary: primaryIntent,
      scores,
      confidence: Math.min(maxScore / 3, 1.0),
      isAmbiguous: Object.values(scores).filter(s => s > 0).length > 2,
      allIntents: Object.entries(scores)
        .filter(([_, s]) => s > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat)
    };
  }

  destroy() {}
  stop() {}
}

module.exports = { IntentClassifier };
