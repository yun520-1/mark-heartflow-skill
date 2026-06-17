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
      inquire: { weight: 1, patterns: [/什么是|是什么|告诉我|解释|什么意思/] },
      analyze: { weight: 2, patterns: [/分析|比较|对比|区别|差异|vs|versus|为什么/] },
      create: { weight: 1, patterns: [/写一个|创建|生成|设计|画|做|制作/] },
      evaluate: { weight: 2, patterns: [/好不好|对不对|值得|应该|建议|推荐/] },
      execute: { weight: 3, patterns: [/运行|执行|启动|打开|安装|配置/] },
      meta: { weight: 1, patterns: [/你是谁|你能做什么|你的版本|你的能力/] },
    };
  }

  classify(input, context = {}) {
    const q = input.toLowerCase();
    const scores = {};
    
    for (const [cat, config] of Object.entries(this.categories)) {
      scores[cat] = 0;
      for (const p of config.patterns) {
        if (p.test(q)) scores[cat] += config.weight;
      }
    }

    // 从 context 中提取已有分类（heart-logic 的 whatIsThis 结果）
    if (context.whatIsThis?.category) {
      scores[context.whatIsThis.category] = (scores[context.whatIsThis.category] || 0) + 2;
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
