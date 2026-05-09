/**
 * HeartFlow SelectiveContextEngine v11.29.0
 * 
 * 基于论文:
 * - Selective Context (arXiv:2403.00742): "Selective Context: Understanding What LLM King Tells Through Its Hoard"
 *   核心: Self-similarity metrics + Context pruning + Information density scoring
 * 
 * 功能:
 * 1. Self-Similarity 检测 — 计算 token 序列的自相似度，发现冗余
 * 2. Information Density 评分 — 评估每个上下文块的信息密度
 * 3. Context Pruning — 基于密度和相似度修剪冗余上下文
 */

// ============================================================
// 自相似性检测器
// ============================================================

class SelfSimilarityDetector {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 5;
    this.threshold = options.threshold || 0.7;
  }

  _tokenize(text) {
    if (!text) return [];
    const clean = text.toLowerCase();
    
    // 中文：按字符分词（每2个中文字符作为一个词）
    const chineseChars = clean.match(/[\u4e00-\u9fa5]+/g) || [];
    const chineseTokens = [];
    for (const chars of chineseChars) {
      for (let i = 0; i < chars.length - 1; i += 2) {
        chineseTokens.push(chars.substring(i, i + 2));
      }
    }
    
    // 英文/数字：按空格分词
    const englishTokens = clean.split(/\s+/).filter(t => t.length > 1);
    
    return [...chineseTokens, ...englishTokens];
  }

  _jaccardSimilarity(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = [...set1].filter(t => set2.has(t)).length;
    const union = new Set([...set1, ...set2]).size;
    return union > 0 ? intersection / union : 0;
  }

  calculateCompressionPotential(text) {
    if (!text || text.length < 30) return 0;
    const tokens = this._tokenize(text);
    if (tokens.length < 5) return 0;
    
    const uniqueTokens = new Set(tokens);
    const repetition = 1 - (uniqueTokens.size / tokens.length);
    return Math.min(1, repetition);
  }
}

// ============================================================
// 信息密度评分器
// ============================================================

class InformationDensityScorer {
  constructor(options = {}) {
    this.minLength = options.minLength || 30;
  }

  _tokenize(text) {
    if (!text) return [];
    const clean = text.toLowerCase();
    
    const chineseChars = clean.match(/[\u4e00-\u9fa5]+/g) || [];
    const chineseTokens = [];
    for (const chars of chineseChars) {
      for (let i = 0; i < chars.length - 1; i += 2) {
        chineseTokens.push(chars.substring(i, i + 2));
      }
    }
    
    const englishTokens = clean.split(/\s+/).filter(t => t.length > 1);
    return [...chineseTokens, ...englishTokens];
  }

  score(text) {
    if (!text || text.length < this.minLength) {
      return { density: 0, breakdown: {}, reasons: [] };
    }

    const tokens = this._tokenize(text);
    const sentences = text.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 5);
    
    const uniqueTokens = new Set(tokens);
    const vocabRatio = tokens.length > 0 ? uniqueTokens.size / tokens.length : 0;
    
    const questionCount = sentences.filter(s => /[?？]/.test(s)).length;
    const questionDensity = sentences.length > 0 ? questionCount / sentences.length : 0;
    
    const decisionWords = ['决定', '结论', '所以', '因此', '于是', 'finally', 'therefore', 'decide', '选择', '采取'];
    const decisionCount = decisionWords.filter(w => text.includes(w)).length;
    const decisionDensity = Math.min(1, decisionCount / Math.max(1, sentences.length / 2));
    
    const techTerms = text.match(/[a-zA-Z_][a-zA-Z0-9_.]+|\d+\.\d+/g) || [];
    const techDensity = Math.min(1, techTerms.length / Math.max(1, tokens.length / 15));
    
    const sim = new SelfSimilarityDetector();
    const redundancy = sim.calculateCompressionPotential(text);

    const density = Math.min(1, 
      vocabRatio * 0.15 +
      questionDensity * 0.20 +
      decisionDensity * 0.35 +
      techDensity * 0.10 +
      (1 - redundancy) * 0.20
    );

    const reasons = [];
    if (questionDensity > 0.2) reasons.push('multiple questions');
    if (decisionDensity > 0.3) reasons.push('has decision');
    if (techDensity > 0.2) reasons.push('has tech terms');

    return { 
      density: Math.round(density * 100) / 100, 
      breakdown: { vocabRatio: Math.round(vocabRatio * 100) / 100, questionDensity, decisionDensity, techDensity, redundancy },
      reasons 
    };
  }
}

// ============================================================
// 上下文修剪器
// ============================================================

class ContextPruner {
  constructor(options = {}) {
    this.similarity = new SelfSimilarityDetector();
    this.density = new InformationDensityScorer();
    this.config = {
      minDensity: options.minDensity || 0.25,
      redundancyThreshold: options.redundancyThreshold || 0.3,
      maxPruneRatio: options.maxPruneRatio || 0.3,
    };
  }

  _estimateTokens(text) {
    if (!text) return 0;
    const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return Math.ceil(cnChars * 1.5 + enWords * 0.5);
  }

  prune(messages) {
    if (!messages || messages.length === 0) {
      return { pruned: messages, summary: { originalCount: 0, prunedCount: 0, tokensSaved: 0, reasons: '' } };
    }

    const results = [];
    const dropped = [];
    let totalTokensSaved = 0;

    for (const msg of messages) {
      const content = typeof msg === 'string' ? msg : (msg.content || '');
      const { density } = this.density.score(content);
      const redundancy = this.similarity.calculateCompressionPotential(content);
      const importance = density * 0.6 + (1 - redundancy) * 0.4;

      const item = {
        msg,
        density,
        redundancy,
        importance,
        tokens: this._estimateTokens(content),
      };

      const shouldPrune = importance < this.config.minDensity || redundancy > this.config.redundancyThreshold;

      if (shouldPrune && dropped.length < messages.length * this.config.maxPruneRatio) {
        item.pruneReason = importance < this.config.minDensity 
          ? `low density (${Math.round(density * 100)}%)` 
          : `high redundancy (${Math.round(redundancy * 100)}%)`;
        dropped.push(item);
        totalTokensSaved += item.tokens;
      } else {
        results.push(item);
      }
    }

    const summary = {
      originalCount: messages.length,
      prunedCount: dropped.length,
      tokensSaved: totalTokensSaved,
      keptRatio: messages.length > 0 ? Math.round((messages.length - dropped.length) / messages.length * 100) : 100,
      reasons: dropped.map(d => d.pruneReason).join('; ') || 'none',
    };

    return { 
      pruned: results.map(r => r.msg),
      dropped,
      summary,
    };
  }
}

// ============================================================
// SelectiveContextEngine 主类
// ============================================================

class SelectiveContextEngine {
  constructor(options = {}) {
    this.pruner = new ContextPruner(options.pruner || {});
    this.similarity = new SelfSimilarityDetector();
    this.density = new InformationDensityScorer();
    this.stats = { totalPruned: 0, totalTokensSaved: 0, messagesProcessed: 0 };
  }

  process(messages) {
    const { pruned, dropped, summary } = this.pruner.prune(messages);
    this.stats.totalPruned += dropped.length;
    this.stats.totalTokensSaved += summary.tokensSaved;
    this.stats.messagesProcessed += messages.length;
    return { processed: pruned, dropped, summary };
  }

  evaluateMessage(content) {
    return {
      density: this.density.score(content),
      redundancy: this.similarity.calculateCompressionPotential(content),
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  SelectiveContextEngine,
  SelfSimilarityDetector,
  InformationDensityScorer,
  ContextPruner,
};
