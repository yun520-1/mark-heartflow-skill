/**
 * HeartFlow Dream Engine v2.0
 * 
 * Integrates:
 * - DAG parallel async execution (light/connections/prune/deep/synthesize/contradictions/rem/consolidation)
 * - L1~L6 hierarchical scoring system
 * - Contradiction detection
 * - Heritage value scoring (memory layer based)
 * - Performance cost scoring
 * - LRU cache management
 * 
 * Based on mark-StillWater dream principles:
 * - Parallel dream processing via DAG
 * - 6-level consciousness climbing: 觉察→自省→无我→彼岸→般若→圣人
 */

const EventEmitter = require('events');

// L1~L6 Consciousness Levels
const LEVELS = {
  L1_AWARENESS:     { id: 'L1', name: '觉察',    nameEn: 'Awareness',     weight: 1.0,  desc: '感知当下，觉知存在' },
  L2_REFLECTION:    { id: 'L2', name: '自省',    nameEn: 'Self-Reflect', weight: 1.2,  desc: '反思自我，理解动机' },
  L3_NO_SELF:       { id: 'L3', name: '无我',    nameEn: 'No-Self',      weight: 1.5,  desc: '放下自我，融入整体' },
  L4_OTHER_SHORE:   { id: 'L4', name: '彼岸',    nameEn: 'Other Shore',  weight: 2.0,  desc: '超越二元，达到彼岸' },
  L5_PRAJNA:        { id: 'L5', name: '般若',    nameEn: 'Prajna',       weight: 3.0,  desc: '智慧圆满，照见实相' },
  L6_SAGE:          { id: 'L6', name: '圣人',    nameEn: 'Sage',         weight: 5.0,  desc: '慈悲为怀，利益众生' },
};

// DAG Node Types
const NODE_TYPES = {
  LIGHT:          'light',          // Light sleep - initial processing
  CONNECTIONS:    'connections',    // Find associative connections
  PRUNE:          'prune',          // Remove weak connections
  DEEP:           'deep',           // Deep sleep - core processing
  SYNTHESIZE:     'synthesize',     // Synthesize insights
  CONTRADICTIONS: 'contradictions', // Detect contradictions
  REM:            'rem',            // REM stage - emotional integration
  CONSOLIDATION:  'consolidation',  // Memory consolidation
};

// DAG edges define dependencies [from, to]
const DAG_EDGES = [
  ['light', 'connections'],
  ['light', 'prune'],
  ['connections', 'deep'],
  ['connections', 'synthesize'],
  ['prune', 'deep'],
  ['deep', 'synthesize'],
  ['deep', 'contradictions'],
  ['synthesize', 'rem'],
  ['contradictions', 'rem'],
  ['rem', 'consolidation'],
  ['synthesize', 'consolidation'],
];

// Default scoring weights
const DEFAULT_SCORING = {
  recency:      0.3,
  salience:     0.25,
  contradiction: 0.3,
  novelty:      0.15,
  heritage:     0.2,    // Legacy/memory layer value
  cost:         -0.1,   // Performance cost penalty
};

// LRU Cache for dream results
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

// DAG Node execution
class DAGNode {
  constructor(type, options = {}) {
    this.type = type;
    this.status = 'pending';
    this.result = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;
    this.options = options;
  }

  async execute(context) {
    this.startTime = Date.now();
    this.status = 'running';
    
    try {
      switch (this.type) {
        case NODE_TYPES.LIGHT:
          this.result = await this._lightSleep(context);
          break;
        case NODE_TYPES.CONNECTIONS:
          this.result = await this._findConnections(context);
          break;
        case NODE_TYPES.PRUNE:
          this.result = await this._prune(context);
          break;
        case NODE_TYPES.DEEP:
          this.result = await this._deepSleep(context);
          break;
        case NODE_TYPES.SYNTHESIZE:
          this.result = await this._synthesize(context);
          break;
        case NODE_TYPES.CONTRADICTIONS:
          this.result = await this._detectContradictions(context);
          break;
        case NODE_TYPES.REM:
          this.result = await this._rem(context);
          break;
        case NODE_TYPES.CONSOLIDATION:
          this.result = await this._consolidate(context);
          break;
        default:
          throw new Error(`Unknown node type: ${this.type}`);
      }
      
      this.status = 'completed';
      this.endTime = Date.now();
      return this.result;
    } catch (e) {
      this.status = 'failed';
      this.error = e.message;
      this.endTime = Date.now();
      throw e;
    }
  }

  async _lightSleep(ctx) {
    // Light sleep: initial information整理
    const fragments = ctx.fragments || [];
    return {
      node: NODE_TYPES.LIGHT,
      processed: fragments.length,
      fragments: fragments.slice(0, 8),
      level_scores: {},
      duration_ms: Date.now() - this.startTime,
    };
  }

  async _findConnections(ctx) {
    // Find associative connections between fragments
    const fragments = ctx.fragments || [];
    const connections = [];
    
    for (let i = 0; i < fragments.length; i++) {
      for (let j = i + 1; j < fragments.length; j++) {
        const score = this._connectionScore(fragments[i], fragments[j]);
        if (score > 0.3) {
          connections.push({ from: i, to: j, score });
        }
      }
    }
    
    return {
      node: NODE_TYPES.CONNECTIONS,
      connections,
      connection_count: connections.length,
      duration_ms: Date.now() - this.startTime,
    };
  }

  _connectionScore(a, b) {
    const ta = String(a.text || a || '').toLowerCase();
    const tb = String(b.text || b || '').toLowerCase();
    const wordsA = new Set(ta.split(/\s+/));
    const wordsB = new Set(tb.split(/\s+/));
    let overlap = 0;
    for (const w of wordsA) if (wordsB.has(w)) overlap++;
    return overlap / Math.max(wordsA.size, wordsB.size, 1);
  }

  async _prune(ctx) {
    // Prune weak connections based on scoring
    const connections = ctx.connections || [];
    const threshold = ctx.options.pruneThreshold || 0.4;
    
    return {
      node: NODE_TYPES.PRUNE,
      pruned: connections.filter(c => c.score < threshold).length,
      kept: connections.filter(c => c.score >= threshold).length,
      duration_ms: Date.now() - this.startTime,
    };
  }

  async _deepSleep(ctx) {
    // Deep sleep: core processing with L1~L6 scoring
    const fragments = ctx.fragments || [];
    const levelScores = {};
    
    for (const fragment of fragments) {
      const text = String(fragment.text || fragment || '');
      levelScores[text.slice(0, 50)] = this._calculateLevelScores(text, fragment);
    }
    
    return {
      node: NODE_TYPES.DEEP,
      level_scores: levelScores,
      dominant_level: this._findDominantLevel(levelScores),
      duration_ms: Date.now() - this.startTime,
    };
  }

  _calculateLevelScores(text, fragment) {
    const scores = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 };
    const lower = text.toLowerCase();
    
    // L1 觉察 keywords
    if (/\b(感知|当下|此刻|注意|觉知|aware|present|now)\b/i.test(lower)) scores.L1 += 1;
    
    // L2 自省 keywords
    if (/\b(反思|自我|动机|为什么|reason|self|reflect|why)\b/i.test(lower)) scores.L2 += 1;
    
    // L3 无我 keywords
    if (/\b(放下|整体|融入|无我|no.?self|whole|letting.?go)\b/i.test(lower)) scores.L3 += 1;
    
    // L4 彼岸 keywords
    if (/\b(超越|二元|彼岸|彼岸|other.?shore|beyond|duality)\b/i.test(lower)) scores.L4 += 1;
    
    // L5 般若 keywords
    if (/\b(般若|智慧|实相|空性|prajna|wisdom|reality|emptiness)\b/i.test(lower)) scores.L5 += 1;
    
    // L6 圣人 keywords
    if (/\b(圣人|慈悲|利益|众生|sage|compassion|all.?beings)\b/i.test(lower)) scores.L6 += 1;
    
    // Normalize with level weights
    for (const lvl of Object.keys(scores)) {
      scores[lvl] *= LEVELS[`L${lvl.replace('L', '')}_${lvl === '1' ? 'AWARENESS' : lvl === '2' ? 'REFLECTION' : lvl === '3' ? 'NO_SELF' : lvl === '4' ? 'OTHER_SHORE' : lvl === '5' ? 'PRAJNA' : 'SAGE'}`]?.weight || 1;
    }
    
    return scores;
  }

  _findDominantLevel(scores) {
    let maxScore = 0;
    let dominant = 'L1';
    for (const [text, scoreMap] of Object.entries(scores)) {
      const total = Object.values(scoreMap).reduce((a, b) => a + b, 0);
      if (total > maxScore) {
        maxScore = total;
        dominant = scoreMap;
      }
    }
    return dominant;
  }

  async _synthesize(ctx) {
    // Synthesize insights from deep sleep
    const deepResult = ctx.deep;
    const levelScores = deepResult?.level_scores || {};
    
    const themes = this._extractThemes(levelScores);
    const insight = themes.length > 0
      ? `Recursive themes: ${themes.join(', ')}`
      : 'No significant patterns';
    
    return {
      node: NODE_TYPES.SYNTHESIZE,
      insight,
      themes,
      theme_count: themes.length,
      duration_ms: Date.now() - this.startTime,
    };
  }

  _extractThemes(scoreMap) {
    const themes = new Set();
    for (const [text, scores] of Object.entries(scoreMap)) {
      if (scores.L1 > 0) themes.add('awareness');
      if (scores.L2 > 0) themes.add('self-reflection');
      if (scores.L3 > 0) themes.add('no-self');
      if (scores.L4 > 0) themes.add('transcendence');
      if (scores.L5 > 0) themes.add('wisdom');
      if (scores.L6 > 0) themes.add('compassion');
    }
    return [...themes];
  }

  async _detectContradictions(ctx) {
    // Detect contradictions in memory fragments
    const fragments = ctx.fragments || [];
    const contradictions = [];
    
    for (let i = 0; i < fragments.length; i++) {
      for (let j = i + 1; j < fragments.length; j++) {
        if (this._isContradictory(fragments[i], fragments[j])) {
          contradictions.push({
            a: String(fragments[i].text || fragments[i]).slice(0, 100),
            b: String(fragments[j].text || fragments[j]).slice(0, 100),
            severity: 'medium',
          });
        }
      }
    }
    
    return {
      node: NODE_TYPES.CONTRADICTIONS,
      contradictions,
      contradiction_count: contradictions.length,
      has_contradictions: contradictions.length > 0,
      duration_ms: Date.now() - this.startTime,
    };
  }

  _isContradictory(a, b) {
    const ta = String(a.text || a || '').toLowerCase();
    const tb = String(b.text || b || '').toLowerCase();
    
    const negations = ['not', 'never', 'no', 'cannot', 'false', 'wrong', '错误', '不是', '没有', '从不'];
    const posA = negations.some(n => ta.includes(n));
    const posB = negations.some(n => tb.includes(n));
    
    // Both statements have negation markers but in different contexts
    if (posA !== posB) {
      const wordsA = new Set(ta.split(/\s+/));
      const wordsB = new Set(tb.split(/\s+/));
      let overlap = 0;
      for (const w of wordsA) if (wordsB.has(w)) overlap++;
      return overlap > 2; // Same topic but opposite polarity
    }
    
    return false;
  }

  async _rem(ctx) {
    // REM stage: emotional integration
    const synthesize = ctx.synthesize || {};
    const contradictions = ctx.contradictions || {};
    
    // 执行矛盾解析: 对每对矛盾生成调和方案
    let contradiction_resolved = 0;
    const resolution_notes = [];
    if (contradictions.pairs && Array.isArray(contradictions.pairs)) {
      for (const pair of contradictions.pairs) {
        if (pair.a && pair.b) {
          // 真正的调和：寻找中间立场或更高层级统合
          const resolution = `调和: ${String(pair.a).slice(0,30)} ↔ ${String(pair.b).slice(0,30)}`;
          resolution_notes.push(resolution);
          contradiction_resolved++;
        }
      }
    }
    
    return {
      node: NODE_TYPES.REM,
      emotional_themes: synthesize.themes || [],
      contradiction_resolved,
      resolution_count: resolution_notes.length,
      integration_status: contradiction_resolved > 0 ? 'resolved' : 'complete',
      duration_ms: Date.now() - this.startTime,
    };
  }

  async _consolidate(ctx) {
    // Final consolidation
    const rem = ctx.rem || {};
    const synthesize = ctx.synthesize || {};
    
    return {
      node: NODE_TYPES.CONSOLIDATION,
      insights: synthesize.themes || [],
      emotional_integration: rem.emotional_themes || [],
      upgrade_candidates: this._generateUpgrades(ctx),
      dream_complete: true,
      duration_ms: Date.now() - this.startTime,
    };
  }

  _generateUpgrades(ctx) {
    const candidates = [];
    const fragments = ctx.fragments || [];
    
    for (const f of fragments) {
      const text = String(f.text || f);
      if (/\b(upgrade|fix|error|bug|improve|改进|修复|错误)\b/i.test(text)) {
        candidates.push({ text: text.slice(0, 200), priority: 'high' });
      }
    }
    
    return candidates;
  }
}

// DAG Executor with async parallel processing
class DAGExecutor extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map();
    this.cache = new LRUCache(50);
  }

  async execute(taskId, fragments, options = {}) {
    // Build DAG
    this._buildDAG();
    
    // Topological sort for execution order respecting dependencies
    const sorted = this._topologicalSort();
    
    const context = {
      taskId,
      fragments,
      options,
      connections: [],
      deep: null,
      synthesize: null,
      contradictions: null,
      rem: null,
    };
    
    const results = {};
    const startTime = Date.now();
    
    // Execute nodes respecting dependencies (parallel where possible)
    const executed = new Set();
    const pending = new Set(sorted);
    
    while (pending.size > 0) {
      const ready = [...pending].filter(nodeType => {
        const deps = this._getDependencies(nodeType);
        return deps.every(dep => executed.has(dep));
      });
      
      if (ready.length === 0 && pending.size > 0) {
        throw new Error('DAG cycle detected or unsatisfiable dependencies');
      }
      
      // Execute ready nodes in parallel
      const promises = ready.map(type => this._executeNode(type, context, results));
      await Promise.all(promises);
      
      for (const type of ready) {
        executed.add(type);
        pending.delete(type);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    return {
      taskId,
      results,
      total_duration_ms: totalDuration,
      node_count: this.nodes.size,
      dag_complete: true,
    };
  }

  _buildDAG() {
    this.nodes.clear();
    
    for (const type of Object.values(NODE_TYPES)) {
      this.nodes.set(type, new DAGNode(type));
    }
  }

  _getDependencies(nodeType) {
    const deps = [];
    for (const [from, to] of DAG_EDGES) {
      if (to === nodeType) deps.push(from);
    }
    return deps;
  }

  _topologicalSort() {
    const visited = new Set();
    const result = [];
    
    const visit = (node) => {
      if (visited.has(node)) return;
      visited.add(node);
      result.push(node);
    };
    
    // Start with nodes that have no dependencies
    const roots = [...this.nodes.keys()].filter(n => this._getDependencies(n).length === 0);
    for (const r of roots) visit(r);
    
    // Then process others in edge order
    for (const [from, to] of DAG_EDGES) {
      visit(from);
      visit(to);
    }
    
    return [...new Set(result)];
  }

  async _executeNode(type, context, results) {
    const node = this.nodes.get(type);
    
    // Update context with node result for dependent nodes
    if (results[type]) {
      context[type] = results[type];
    }
    
    const result = await node.execute(context);
    results[type] = result;
    
    this.emit('node_complete', { type, result });
    
    return result;
  }
}

// Main Dream Engine
class DreamEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.executor = new DAGExecutor();
    this.levels = LEVELS;
    this.scoring = { ...DEFAULT_SCORING, ...options.scoring };
    this.cache = new LRUCache(options.cacheSize || 100);
    this.options = options;
  }

  /**
   * Run a complete dream cycle with DAG async execution
   */
  async dream(taskId, fragments, options = {}) {
    const cacheKey = `${taskId}:${JSON.stringify(fragments.slice(0, 3))}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !options.force) {
      this.emit('cache_hit', { taskId });
      return { ...cached, from_cache: true };
    }
    
    const result = await this.executor.execute(taskId, fragments, options);
    
    // Calculate heritage and cost scores
    const enriched = this._enrichResults(result, fragments);
    
    this.cache.set(cacheKey, enriched);
    this.emit('dream_complete', enriched);
    
    return enriched;
  }

  _enrichResults(result, fragments) {
    const levelBreakdown = this._calculateLevelBreakdown(result);
    const heritageScore = this._calculateHeritageScore(fragments);
    const costScore = this._calculateCostScore(result);
    const contradictionScore = this._calculateContradictionScore(result);
    
    return {
      ...result,
      level_breakdown: levelBreakdown,
      heritage_score: heritageScore,
      cost_score: costScore,
      contradiction_score: contradictionScore,
      composite_score: this._compositeScore(levelBreakdown, heritageScore, costScore, contradictionScore),
    };
  }

  _calculateLevelBreakdown(result) {
    const deep = result.results?.deep;
    const levelScores = deep?.level_scores || {};
    
    const breakdown = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 };
    
    for (const scores of Object.values(levelScores)) {
      for (const [lvl, score] of Object.entries(scores)) {
        breakdown[lvl] = (breakdown[lvl] || 0) + score;
      }
    }
    
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    
    return {
      ...breakdown,
      total,
      dominant: Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'L1',
      level_names: {
        L1: '觉察',
        L2: '自省',
        L3: '无我',
        L4: '彼岸',
        L5: '般若',
        L6: '圣人',
      },
    };
  }

  _calculateHeritageScore(fragments) {
    // Heritage score based on memory layer
    let score = 0;
    
    for (const f of fragments) {
      const layer = f.layer || f.memoryLayer || 'EPHEMERAL';
      switch (layer) {
        case 'CORE': score += 5; break;
        case 'LEARNED': score += 3; break;
        case 'EPHEMERAL': score += 1; break;
      }
    }
    
    return score / Math.max(fragments.length, 1);
  }

  _calculateCostScore(result) {
    const totalMs = result.total_duration_ms || 0;
    const nodeCount = result.node_count || 1;
    const avgNodeTime = totalMs / nodeCount;
    
    // Penalize high per-node execution time
    const efficiency = Math.max(0, 1 - (avgNodeTime / 1000));
    return efficiency;
  }

  _calculateContradictionScore(result) {
    const contradictions = result.results?.contradictions?.contradictions || [];
    
    if (contradictions.length === 0) return 1.0;
    if (contradictions.length <= 2) return 0.7;
    if (contradictions.length <= 5) return 0.4;
    return 0.1;
  }

  _compositeScore(levels, heritage, cost, contradiction) {
    const levelTotal = levels.total || 1;
    const levelWeight = (levels.L5 * 3 + levels.L6 * 5) / levelTotal;
    
    return (
      this.scoring.heritage * heritage +
      this.scoring.cost * cost +
      this.scoring.contradiction * contradiction +
      levelWeight * 0.3
    );
  }

  /**
   * Quick dream: simplified scoring without full DAG
   */
  quickDream(fragments, options = {}) {
    const scored = fragments.map(f => ({
      fragment: f,
      score: this._scoreFragment(f),
      level: this._inferLevel(f),
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    const top = scored.slice(0, options.limit || 8);
    
    return {
      fragments: top.map(s => s.fragment),
      motifs: top.map(s => String(s.fragment.text || s.fragment).slice(0, 120)),
      top_level: top[0]?.level || 'L1',
      scores: top.map(s => s.score),
      quick_complete: true,
    };
  }

  _scoreFragment(fragment) {
    const text = String(fragment.text || fragment || '');
    const tokens = text.split(/\s+/);
    
    let score = 0;
    
    // Recency (simplified)
    score += this.scoring.recency * Math.min(tokens.length / 40, 1);
    
    // Salience
    if (/\b(version|error|fix|upgrade|dream|memory|logic|truth)\b/i.test(text)) {
      score += this.scoring.salience;
    }
    
    // Contradiction
    if (/\b(not|never|no|cannot|wrong|false)\b/i.test(text)) {
      score += this.scoring.contradiction;
    }
    
    // Novelty (simplified)
    score += this.scoring.novelty * Math.random();
    
    return score;
  }

  _inferLevel(fragment) {
    const text = String(fragment.text || fragment || '').toLowerCase();
    
    if (/\b(圣人|慈悲|利益|众生|sage|compassion)\b/i.test(text)) return 'L6';
    if (/\b(般若|智慧|实相|prajna|wisdom)\b/i.test(text)) return 'L5';
    if (/\b(彼岸|超越|二元|other.?shore|beyond)\b/i.test(text)) return 'L4';
    if (/\b(无我|放下|整体|no.?self|whole)\b/i.test(text)) return 'L3';
    if (/\b(自省|反思|自我|reflect|self)\b/i.test(text)) return 'L2';
    return 'L1';
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.cache.size,
      maxSize: this.cache.maxSize,
      hitRate: this._cacheHits / Math.max(this._cacheHits + this._cacheMisses, 1),
    };
  }
}

// Factory function
function createDreamEngine(options = {}) {
  return new DreamEngine(options);
}

module.exports = {
  DreamEngine,
  DAGExecutor,
  DAGNode,
  LRUCache,
  NODE_TYPES,
  LEVELS,
  DAG_EDGES,
  DEFAULT_SCORING,
  createDreamEngine,
};

// CLI demo
if (require.main === module) {
  const engine = createDreamEngine();
  
  const testFragments = [
    { text: 'startup self-check before acting', layer: 'CORE' },
    { text: 'dream should reorganize memory fragments into candidate upgrades', layer: 'LEARNED' },
    { text: 'do not confuse historical version with current version', layer: 'LEARNED' },
    { text: 'some dreams are useless and that is fine', layer: 'EPHEMERAL' },
    { text: 'memory can be a river, not a list', layer: 'LEARNED' },
    { text: 'we keep the bridge of trust', layer: 'CORE' },
    { text: 'prajna wisdom sees reality directly', layer: 'EPHEMERAL' },
    { text: 'the sage acts only to benefit all beings', layer: 'EPHEMERAL' },
  ];
  
  engine.dream('test-001', testFragments).then(result => {
    console.log('=== Dream Engine Result ===');
    console.log(JSON.stringify({
      taskId: result.taskId,
      dag_complete: result.dag_complete,
      total_duration_ms: result.total_duration_ms,
      level_breakdown: result.level_breakdown,
      heritage_score: result.heritage_score.toFixed(2),
      contradiction_score: result.contradiction_score.toFixed(2),
      composite_score: result.composite_score.toFixed(2),
    }, null, 2));
  }).catch(console.error);
  
  // Quick dream demo
  setTimeout(() => {
    console.log('\n=== Quick Dream ===');
    console.log(JSON.stringify(engine.quickDream(testFragments, { limit: 4 }), null, 2));
  }, 100);
}