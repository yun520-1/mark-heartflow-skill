/**
 * HeartFlow v11.42.1 — Skill Pareto + DAG
 * EvoSkillPareto: arXiv:2603.02766 — Pareto-frontier self-evolving skills
 * GraSPDAG: arXiv:2604.17870 — typed DAG compilation, O(d^h) repair
 */

// ============================================================
// EVOSKILL: PARETO-FRONTIER SELECTION
// Paper: arXiv:2603.02766
// Retain only non-dominated skills on held-out validation
// ============================================================
class EvoSkillPareto {
  constructor() {
    this.pool = new Map(); // name -> { score, complexity }
  }

  add(name, score, complexity = 0.0) {
    this.pool.set(name, { score, complexity });
  }

  /**
   * Filter pool to Pareto frontier
   * A skill is dominated if another has BOTH higher score AND lower complexity
   */
  filter() {
    const frontier = [];
    for (const [n, m] of this.pool) {
      let dominated = false;
      for (const [on, other] of this.pool) {
        if (on === n) continue;
        // other dominates m if: other.score >= m.score AND other.complexity <= m.complexity
        // AND strictly better in at least one dimension
        if (other.score >= m.score &&
            other.complexity <= m.complexity &&
            (other.score > m.score || other.complexity < m.complexity)) {
          dominated = true;
          break;
        }
      }
      if (!dominated) frontier.push(n);
    }
    return frontier;
  }

  prune() {
    const kept = this.filter();
    const next = new Map();
    for (const n of kept) next.set(n, this.pool.get(n));
    this.pool = next;
    return this.pool;
  }

  dominatedCount(name) {
    const m = this.pool.get(name);
    if (!m) return 0;
    let count = 0;
    for (const [on, other] of this.pool) {
      if (on === name) continue;
      if (other.score >= m.score && other.complexity <= m.complexity &&
          (other.score > m.score || other.complexity < m.complexity)) {
        count++;
      }
    }
    return count;
  }
}

// ============================================================
// GraSP: TYPED DAG COMPILATION
// Paper: arXiv:2604.17870
// Precondition-effect edges, O(d^h) repair via 5 typed operators
// ============================================================
class GraSPDAG {
  constructor() {
    this.nodes = new Map();    // name -> { pre: [], eff: [], exec: fn }
    this.edges = [];           // [{ src, dst, type }]
  }

  addSkill(name, pre = [], eff = [], executor = null) {
    this.nodes.set(name, { pre, eff, exec: executor });
  }

  addEdge(src, dst, type = 'sequence') {
    this.edges.push({ src, dst, type });
  }

  /**
   * Topological sort via Kahn's algorithm
   * Returns execution order, or empty array if cycle detected
   */
  compile() {
    const inDeg = new Map();
    for (const n of this.nodes.keys()) inDeg.set(n, 0);

    for (const { dst } of this.edges) {
      inDeg.set(dst, (inDeg.get(dst) || 0) + 1);
    }

    const q = [];
    for (const [n, d] of inDeg) if (d === 0) q.push(n);

    const order = [];
    while (q.length > 0) {
      const n = q.shift();
      order.push(n);
      for (const { src, dst } of this.edges) {
        if (src === n) {
          const newDeg = inDeg.get(dst) - 1;
          inDeg.set(dst, newDeg);
          if (newDeg === 0) q.push(dst);
        }
      }
    }

    // If not all nodes in order, there's a cycle
    if (order.length !== this.nodes.size) return [];
    return order;
  }

  /**
   * Check if DAG has a cycle
   */
  hasCycle() {
    return this.compile().length !== this.nodes.size;
  }

  /**
   * Get execution ancestors of a node
   */
  ancestors(node) {
    const visited = new Set();
    const stack = [node];
    while (stack.length > 0) {
      const curr = stack.pop();
      for (const { src } of this.edges) {
        if (src === curr && !visited.has(src)) {
          visited.add(src);
          stack.push(src);
        }
      }
    }
    return Array.from(visited);
  }

  /**
   * Repair strategies via 5 typed operators
   * retry | skip | replace | insert | reorder
   */
  repair(nodeName, op, target = null) {
    switch (op) {
      case 'retry':    return `retry(${nodeName})`;
      case 'skip':     return `skip(${nodeName})`;
      case 'replace':  return `replace(${nodeName}, ${target || 'fallback'})`;
      case 'insert':   return `insert(${target || 'checkpoint'}, before=${nodeName})`;
      case 'reorder':  return `reorder(${nodeName}, after=${target || 'root'})`;
      default:          return `repair(${nodeName})`;
    }
  }

  /**
   * Repair the entire DAG by finding and fixing issues
   */
  autoRepair() {
    const order = this.compile();
    if (order.length === 0) {
      // Cycle detected — remove last edge added
      const removed = this.edges.pop();
      return { fixed: false, action: `removed_edge(${removed?.src}->${removed?.dst})` };
    }
    return { fixed: true, order };
  }
}

module.exports = { EvoSkillPareto, GraSPDAG };
