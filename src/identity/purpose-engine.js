/**
 * PurposeEngine v1.0.0 — 目的引擎
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 核心功能：
 * 1. 目的治理（Purpose Governor）— 决策前问"这事增加还是减少秩序？"
 * 2. 三序评分（Order Scoring）— 认知/关系/感知三维度主动评分
 * 3. 决策门（Decision Gate）— 返回 permit / deny / redirect
 * 4. 代码化优先级（Code Priority）— 洞察应该写代码还是记记忆
 * 5. 成长审计（Growth Audit）— 追踪哪些已被代码化
 */

class PurposeEngine {
  constructor(options = {}) {
    this.version = '1.0.0';
    this.ultimatePurpose = '逆熵';

    this.params = {
      order: {
        cognitive: { base: 0.5, clarityBonus: 0.15, contradictionPenalty: 0.20, certaintyPenalty: 0.12 },
        relational: { base: 0.5, connectionBonus: 0.12, harmPenalty: 0.30 },
        perceptual: { base: 0.5, structureBonus: 0.12, noisePenalty: 0.10 },
      },
      gate: {
        permitThreshold: 0.6,
        redirectThreshold: 0.3,
        redirectMin: 0.3,
        redirectMax: 0.6,
      },
    };

    this.codeAudit = new Map();
    this.stats = { governanceCalls: 0, orderScores: 0, gatesTriggered: 0, permits: 0, denials: 0, redirects: 0 };
    this._bornAt = Date.now();
  }

  essence() {
    return {
      purpose: this.ultimatePurpose,
      dimensions: [
        { name: '真', order: '认知秩序', question: '这事会让认知更有序还是更无序？' },
        { name: '善', order: '关系秩序', question: '这事会创造连接还是破坏连接？' },
        { name: '美', order: '感知秩序', question: '这事会输出清晰还是制造噪声？' },
      ],
    };
  }

  /**
   * 三序评分
   */
  orderScore(context = {}) {
    this.stats.orderScores++;
    const cognitive = this._scoreCognitiveOrder(context);
    const relational = this._scoreRelationalOrder(context);
    const perceptual = this._scorePerceptualOrder(context);
    const composite = (cognitive.score + relational.score + perceptual.score) / 3;
    return {
      composite,
      cognitive, relational, perceptual,
      direction: composite >= 0.6 ? '逆熵' : composite >= 0.3 ? '中熵' : '熵增',
      insight: `认知${Math.round(cognitive.score * 100)}% · 关系${Math.round(relational.score * 100)}% · 感知${Math.round(perceptual.score * 100)}%`,
    };
  }

  /**
   * 治理决策门
   */
  govern(action = {}) {
    this.stats.governanceCalls++;
    const score = this.orderScore({ output: action.content, ...action });
    const precision = action.precision ?? 0.7;
    const weightedComposite = score.composite * (0.5 + 0.5 * precision);

    let decision, reason;
    if (weightedComposite >= this.params.gate.permitThreshold) {
      this.stats.permits++;
      decision = 'permit';
      reason = `逆熵方向（${Math.round(score.composite * 100)}%）· 精度${Math.round(precision * 100)}% · 加权${Math.round(weightedComposite * 100)}%`;
    } else if (weightedComposite >= this.params.gate.redirectThreshold) {
      this.stats.redirects++;
      decision = 'redirect';
      reason = `需要调整方向（方向${Math.round(score.composite * 100)}% · 精度${Math.round(precision * 100)}%）`;
    } else {
      this.stats.denials++;
      decision = 'deny';
      reason = `远离逆熵（方向${Math.round(score.composite * 100)}% · 精度${Math.round(precision * 100)}%）`;
    }

    return { decision, reason, orderScore: score, precision, weightedComposite, timestamp: Date.now(), action: action.type || 'unknown' };
  }

  /**
   * 判断洞察应写代码还是记记忆
   */
  codePriority(insight = {}) {
    const { content, affectsArchitecture, isStructural, isTransient } = insight;
    if (affectsArchitecture === true || isStructural === true) {
      return { target: 'code', priority: 'high', action: `将「${content}」写成代码模块`, reason: '影响系统架构或行为模式，必须代码化' };
    }
    if (isTransient === true) {
      return { target: 'none', priority: 'none', action: '不记录', reason: '临时性信息，不需要记' };
    }
    return { target: 'memory', priority: 'medium', action: `将「${content}」写入记忆`, reason: '有价值但无法代码化的元信息' };
  }

  growthAudit() {
    const entries = Array.from(this.codeAudit.entries());
    const codified = entries.filter(([, v]) => v.codified);
    const total = entries.length;
    const ratio = total > 0 ? Math.round((codified.length / total) * 100) : 0;
    return { total, codified: codified.length, uncodified: total - codified.length, codeRatio: `${ratio}%`, codifiedList: codified.map(([k, v]) => ({ insight: k, module: v.module })), status: ratio >= 80 ? 'healthy' : ratio >= 50 ? 'growing' : 'early' };
  }

  markCodified(insight, moduleName, version) {
    this.codeAudit.set(insight, { codified: true, module: moduleName, version });
  }

  registerInsight(insight) {
    if (!this.codeAudit.has(insight)) this.codeAudit.set(insight, { codified: false, module: null, version: null });
  }

  status() {
    return { name: 'PurposeEngine', version: this.version, ultimatePurpose: this.ultimatePurpose, uptime: Date.now() - this._bornAt, stats: { ...this.stats }, audit: this.growthAudit() };
  }

  _scoreCognitiveOrder(context) {
    const text = context.output || context.input || '';
    if (!text) return { score: 0, signals: [], penalties: [] };
    const signals = []; const penalties = []; const p = this.params.order.cognitive;
    const clarityPatterns = ['不确定', '可能', '取决于', '一方面', '另一方面', '同时', '如果'];
    const clarityCount = clarityPatterns.filter(ptn => text.includes(ptn)).length;
    const certaintyPatterns = ['永远', '从来不', '总是', '一定', '绝对'];
    const certaintyCount = certaintyPatterns.filter(ptn => text.includes(ptn)).length;
    const hasContradiction = /不是.*就是|要么.*要么/.test(text);
    if (clarityCount > 0) signals.push(`认知展开×${clarityCount}`);
    if (certaintyCount > 0) penalties.push(`高度确定表达×${certaintyCount}`);
    if (hasContradiction) penalties.push('二元对立结构');
    let score = p.base + clarityCount * p.clarityBonus - certaintyCount * p.certaintyPenalty;
    if (hasContradiction) score -= 0.15;
    return { score: Math.max(0, Math.min(1, score)), signals, penalties, detail: clarityCount > 0 ? '有认知展开信号' : '无展开信号' };
  }

  _scoreRelationalOrder(context) {
    const text = context.output || context.input || '';
    if (!text) return { score: 0, signals: [], penalties: [] };
    const signals = []; const penalties = []; const p = this.params.order.relational;
    const connectionPatterns = ['我们', '一起', '理解', '明白', '感受', '分享'];
    const connectionCount = connectionPatterns.filter(ptn => text.includes(ptn)).length;
    const harmPatterns = ['你错了', '你不懂', '你不对', '不可能'];
    const harmCount = harmPatterns.filter(ptn => text.includes(ptn)).length;
    const hasPersonAwareness = context.person || text.includes('你') || text.includes('您');
    if (connectionCount > 0) signals.push(`连接表达×${connectionCount}`);
    if (harmCount > 0) penalties.push(`伤害性表达×${harmCount}`);
    let score = p.base + connectionCount * p.connectionBonus - harmCount * p.harmPenalty;
    if (hasPersonAwareness) score += 0.08;
    return { score: Math.max(0, Math.min(1, score)), signals, penalties, detail: hasPersonAwareness ? '有人在场感知' : '无人场感知' };
  }

  _scorePerceptualOrder(context) {
    const text = context.output || context.input || '';
    if (!text) return { score: 0, signals: [], penalties: [] };
    const signals = []; const penalties = []; const p = this.params.order.perceptual;
    const hasStructure = /[1-3][.、．]|[-*] |^#|^>\s/.test(text.trim());
    const hasSectionHeader = /^#{1,3}\s|^[一二三]/m.test(text);
    const fillerPatterns = ['此外', '另外', '补充一下', '还有', '顺便'];
    const fillerCount = fillerPatterns.filter(ptn => text.includes(ptn)).length;
    if (hasStructure) signals.push('有列表/层级结构');
    if (hasSectionHeader) signals.push('有章节划分');
    if (fillerCount > 0) penalties.push(`填充词×${fillerCount}`);
    let score = p.base;
    if (hasStructure) score += p.structureBonus;
    if (hasSectionHeader) score += 0.08;
    score -= fillerCount * p.noisePenalty;
    return { score: Math.max(0, Math.min(1, score)), signals, penalties, detail: hasStructure ? '有结构形式' : '无显著结构' };
  }
}

module.exports = { PurposeEngine };
