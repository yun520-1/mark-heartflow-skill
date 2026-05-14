/**
 * SkillDAG — Compositional Skill DAG
 * Based on CoCoDA: Co-evolving Compositional DAG for Tool-Augmented Agents (arXiv:2605.08399)
 * @version v0.13.16
 * 
 * Core idea: Transform flat skill registry into a typed compositional DAG where:
 * - Nodes = primitive or composite skills
 * - Edges = invocation dependencies  
 * - Each node stores: typed signature, description, pre/post-conditions, worked examples
 * - DAG retrieval = signature unification → description ranking → behavioral filtering → example disambiguation
 * 
 * This directly addresses the limitation of the flat skill-registry.js
 */
'use strict';

const path = require('path');
const fs = require('fs');

// ─── Typed Signature Unification ─────────────────────────────────────────────
const PRIMITIVE_TYPES = ['string', 'number', 'boolean', 'object', 'array', 'void', 'any'];
const TYPE_COMPATIBILITY = {
  'number': ['number', 'any'],
  'string': ['string', 'any'],
  'boolean': ['boolean', 'any'],
  'object': ['object', 'any'],
  'array': ['array', 'any'],
  'void': ['void', 'any'],
  'any': PRIMITIVE_TYPES,
};

/**
 * Check if source type can satisfy target type (covariant for output, contravariant for input)
 */
function typesCompatible(src, tgt) {
  if (src === tgt) return true;
  const compat = TYPE_COMPATIBILITY[tgt];
  return compat && compat.includes(src);
}

/**
 * Unify two function signatures — returns {unified: bool, substitutions: {name: type}}
 */
function unifySignatures(sig1, sig2) {
  const subs = {};
  const inputs1 = sig1.inputs || [];
  const inputs2 = sig2.inputs || [];
  if (inputs1.length !== inputs2.length) return { unified: false, substitutions: {} };
  
  for (let i = 0; i < inputs1.length; i++) {
    const t1 = inputs1[i].type || 'any';
    const t2 = inputs2[i].type || 'any';
    if (!typesCompatible(t1, t2) && !typesCompatible(t2, t1)) {
      return { unified: false, substitutions: {} };
    }
    if (t1 !== t2) subs[inputs1[i].name] = t2;
  }
  return { unified: true, substitutions: subs };
}

// ─── SkillDAG Node ────────────────────────────────────────────────────────────
class SkillNode {
  constructor({ id, name, type = 'primitive', description = '', 
                inputs = [], output = 'void',
                preconditions = [], postconditions = [],
                examples = [], code = null, dependencies = [] }) {
    this.id = id;                    // unique node ID
    this.name = name;                // human-readable name
    this.type = type;                // 'primitive' | 'composite'
    this.description = description;
    this.inputs = inputs;            // [{name, type, description?}]
    this.output = output;            // return type
    this.preconditions = preconditions; // [{condition, description}]
    this.postconditions = postconditions; // [{condition, description}]
    this.examples = examples;        // [{input, expectedOutput, description?}]
    this.code = code;                // function code string
    this.dependencies = dependencies; // [nodeId] — for composite nodes
    this.metadata = {
      createdAt: Date.now(),
      lastUsed: null,
      useCount: 0,
      successRate: 1.0,
    };
  }

  getSignature() {
    return {
      inputs: this.inputs.map(i => ({ name: i.name, type: i.type })),
      output: this.output,
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      inputs: this.inputs,
      output: this.output,
      preconditions: this.preconditions,
      postconditions: this.postconditions,
      examples: this.examples,
      code: this.code,
      dependencies: this.dependencies,
      metadata: this.metadata,
    };
  }

  static fromJSON(obj) {
    const n = new SkillNode(obj);
    n.metadata = obj.metadata || n.metadata;
    return n;
  }
}

// ─── SkillDAG Core ────────────────────────────────────────────────────────────
class SkillDAG {
  constructor({ dataDir = null, maxNodes = 1000 } = {}) {
    this.dataDir = dataDir || path.join(__dirname, '../../data/skill-dag');
    this.maxNodes = maxNodes;
    this.nodes = new Map();   // nodeId → SkillNode
    this.edges = new Map();   // nodeId → [dependentNodeId]
    this.revEdges = new Map(); // nodeId → [prerequisiteNodeId]
    this._typeIndex = new Map(); // type → Set<nodeId>
    this._tagIndex = new Map();  // tag → Set<nodeId>
    this._ensure();
  }

  _ensure() {
    try { fs.mkdirSync(this.dataDir, { recursive: true }); } catch {}
    this._load();
  }

  // ─── Persistence ───────────────────────────────────────────────────────────
  _dagPath() { return path.join(this.dataDir, 'dag-state.json'); }
  _load() {
    const p = this._dagPath();
    if (!fs.existsSync(p)) return;
    try {
      const stats = fs.statSync(p);
      if (stats.size > 5 * 1024 * 1024) {
        console.warn('[SkillDAG] File too large (>5MB), skipping load:', stats.size);
        return;
      }
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      d.nodeIds.forEach(id => {
        const n = SkillNode.fromJSON(d.nodes[id]);
        this.nodes.set(id, n);
        this._indexNode(n);
      });
      this.edges = new Map(Object.entries(d.edges || {}));
      this.revEdges = new Map(Object.entries(d.revEdges || {}));
    } catch (e) {
      console.warn('[SkillDAG] _load failed:', e.message);
    }
  }

  _save() {
    const d = {
      nodeIds: Array.from(this.nodes.keys()),
      nodes: Object.fromEntries(
        Array.from(this.nodes.entries()).map(([id, n]) => [id, n.toJSON()])
      ),
      edges: Object.fromEntries(this.edges),
      revEdges: Object.fromEntries(this.revEdges),
    };
    fs.writeFileSync(this._dagPath(), JSON.stringify(d, null, 2));
  }

  // ─── Indexing ─────────────────────────────────────────────────────────────
  _indexNode(node) {
    // Type index
    node.inputs.forEach(inp => {
      if (!this._typeIndex.has(inp.type)) this._typeIndex.set(inp.type, new Set());
      this._typeIndex.get(inp.type).add(node.id);
    });
    if (!this._typeIndex.has(node.output)) this._typeIndex.set(node.output, new Set());
    this._typeIndex.get(node.output).add(node.id);
    // Tag index
    (node.tags || []).forEach(tag => {
      if (!this._tagIndex.has(tag)) this._tagIndex.set(tag, new Set());
      this._tagIndex.get(tag).add(node.id);
    });
  }

  // ─── Core Operations ───────────────────────────────────────────────────────
  /**
   * Insert a new primitive or composite skill into the DAG
   * Returns {success, nodeId, reason?}
   */
  insert(nodeSpec) {
    if (this.nodes.size >= this.maxNodes) {
      return { success: false, reason: 'maxNodes reached' };
    }
    const id = nodeSpec.id || `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const node = new SkillNode({ ...nodeSpec, id });
    
    // Validate preconditions against dependency signatures
    if (node.type === 'composite') {
      for (const depId of node.dependencies) {
        const dep = this.nodes.get(depId);
        if (!dep) return { success: false, reason: `dependency ${depId} not found` };
        // Check L3: postcondition of dep must satisfy precondition of using node
        // (simplified: just check dependency exists)
      }
    }

    // Cycle detection for composite nodes
    if (node.type === 'composite' && node.dependencies.length > 0) {
      if (this._wouldCreateCycle(node)) {
        return { success: false, reason: 'cycle detected' };
      }
    }

    this.nodes.set(id, node);
    this._indexNode(node);
    
    // Update edges
    if (!this.edges.has(id)) this.edges.set(id, []);
    if (!this.revEdges.has(id)) this.revEdges.set(id, []);
    for (const depId of node.dependencies) {
      if (this.edges.has(depId)) {
        this.edges.get(depId).push(id);
      } else {
        this.edges.set(depId, [id]);
      }
      if (this.revEdges.has(id)) {
        this.revEdges.get(id).push(depId);
      } else {
        this.revEdges.set(id, [depId]);
      }
    }

    this._save();
    return { success: true, nodeId: id };
  }

  _wouldCreateCycle(node) {
    // DFS from dependencies to see if we can reach node.id
    const visited = new Set();
    const stack = [...node.dependencies];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur === node.id) return true;
      if (visited.has(cur)) continue;
      visited.add(cur);
      const deps = this.nodes.get(cur)?.dependencies || [];
      stack.push(...deps);
    }
    return false;
  }

  /**
   * Typed DAG Retrieval — 4-stage pipeline from CoCoDA paper
   * Stage 1: Signature unification pruning
   * Stage 2: Description-based ranking  
   * Stage 3: Behavioral specification filtering
   * Stage 4: Example-based disambiguation
   */
  retrieve({ querySig = null, queryText = '', 
             requiredInputs = [], requiredOutput = null,
             topK = 5, tags = [] } = {}) {
    let candidates = new Set(this.nodes.keys());

    // Stage 1: Signature unification
    if (querySig || requiredInputs.length > 0 || requiredOutput) {
      const sig = querySig || { inputs: requiredInputs, output: requiredOutput };
      const filtered = new Set();
      for (const id of candidates) {
        const node = this.nodes.get(id);
        const result = unifySignatures(node.getSignature(), sig);
        if (result.unified) {
          // Score by how many substitutions were needed
          const subCount = Object.keys(result.substitutions).length;
          node._matchScore = (node.inputs.length + 1 - subCount) / (node.inputs.length + 1);
          filtered.add(id);
        }
      }
      candidates = filtered;
    }

    if (candidates.size === 0) return [];

    // Stage 2: Description ranking (BM25-like text match)
    if (queryText) {
      const qTerms = queryText.toLowerCase().split(/\s+/);
      const scored = [];
      for (const id of candidates) {
        const node = this.nodes.get(id);
        const text = (node.description + ' ' + node.name).toLowerCase();
        let score = 0;
        for (const term of qTerms) {
          if (text.includes(term)) score++;
        }
        // Bonus for exact name match
        if (node.name.toLowerCase().includes(queryText.toLowerCase())) score += 2;
        node._textScore = score / Math.max(qTerms.length, 1);
        scored.push({ id, score: node._textScore });
      }
      scored.sort((a, b) => b.score - a.score);
      candidates = new Set(scored.filter(x => x.score > 0).map(x => x.id));
    }

    // Stage 3: Tag/behavioral filtering
    if (tags.length > 0) {
      const filtered = new Set();
      for (const id of candidates) {
        const node = this.nodes.get(id);
        if (tags.some(tag => (node.tags || []).includes(tag))) {
          filtered.add(id);
        }
      }
      if (filtered.size > 0) candidates = filtered;
    }

    if (candidates.size === 0) return [];

    // Stage 4: Example disambiguation — pick node with most relevant examples
    const results = [];
    for (const id of candidates) {
      const node = this.nodes.get(id);
      let finalScore = (node._matchScore || 0.5) * 0.4 + (node._textScore || 0.5) * 0.6;
      
      // Example quality bonus
      if (node.examples && node.examples.length > 0) {
        finalScore += 0.1 * Math.min(node.examples.length, 3);
      }
      
      results.push({
        id,
        name: node.name,
        type: node.type,
        description: node.description,
        score: finalScore,
        inputs: node.inputs,
        output: node.output,
        preconditions: node.preconditions,
        postconditions: node.postconditions,
        dependencies: node.dependencies,
        useCount: node.metadata.useCount,
        successRate: node.metadata.successRate,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Get all composite skills that depend on a given node
   */
  getCompositesUsing(nodeId) {
    return Array.from(this.edges.get(nodeId) || []);
  }

  /**
   * Get topological order (primitives first)
   */
  topologicalSort() {
    const visited = new Set();
    const result = [];
    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      for (const depId of (this.revEdges.get(id) || [])) {
        visit(depId);
      }
      result.push(id);
    };
    for (const id of this.nodes.keys()) visit(id);
    return result;
  }

  /**
   * Record usage outcome for a skill (to track success rate)
   */
  recordUse(nodeId, success) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    node.metadata.useCount++;
    node.metadata.lastUsed = Date.now();
    // Exponential moving average of success rate
    const prev = node.metadata.successRate;
    node.metadata.successRate = prev * 0.9 + (success ? 0.1 : 0);
    this._save();
  }

  /**
   * Get DAG statistics
   */
  stats() {
    let primitives = 0, composites = 0, edges = 0;
    for (const node of this.nodes.values()) {
      if (node.type === 'primitive') primitives++;
      else composites++;
    }
    for (const arr of this.edges.values()) edges += arr.length;
    return {
      totalNodes: this.nodes.size,
      primitives,
      composites,
      totalEdges: edges,
      topUsers: Array.from(this.nodes.values())
        .sort((a, b) => b.metadata.useCount - a.metadata.useCount)
        .slice(0, 5).map(n => ({ id: n.id, name: n.name, useCount: n.metadata.useCount })),
    };
  }
}

// ─── Demo ────────────────────────────────────────────────────────────────────
function demo() {
  console.log('=== SkillDAG Demo (CoCoDA-inspired) ===\n');
  
  const dag = new SkillDAG({ dataDir: '/tmp/skill-dag-demo' });
  
  // Insert primitive skills (like CoCoDA's primitive tools)
  const r1 = dag.insert({
    name: 'calculate',
    type: 'primitive',
    description: 'Evaluate a mathematical expression',
    inputs: [{ name: 'expr', type: 'string', description: 'math expression' }],
    output: 'number',
    preconditions: [{ condition: 'expr is valid', description: 'Expression must be parseable' }],
    postconditions: [{ condition: 'returns number', description: 'Result is numeric' }],
    examples: [{ input: { expr: '2+2' }, expectedOutput: 4 }],
    tags: ['math', 'compute'],
  });
  console.log('Insert calculate:', r1);
  
  const r2 = dag.insert({
    name: 'format_date',
    type: 'primitive', 
    description: 'Format a timestamp as human-readable date',
    inputs: [{ name: 'timestamp', type: 'number', description: 'Unix timestamp' }],
    output: 'string',
    preconditions: [{ condition: 'timestamp > 0', description: 'Must be positive' }],
    postconditions: [{ condition: 'returns string', description: 'Formatted date' }],
    examples: [{ input: { timestamp: 1715500000 }, expectedOutput: '2024-05-12' }],
    tags: ['time', 'format'],
  });
  console.log('Insert format_date:', r2);

  // Composite skill (like CoCoDA's composite tools = validated DAG folds)
  const r3 = dag.insert({
    name: 'math_report',
    type: 'composite',
    description: 'Calculate math expression and format as date-labeled report',
    inputs: [{ name: 'expr', type: 'string' }, { name: 'timestamp', type: 'number' }],
    output: 'object',
    dependencies: [r1.nodeId, r2.nodeId],
    preconditions: [
      { condition: 'expr valid', description: 'Valid math expr' },
      { condition: 'timestamp > 0', description: 'Positive timestamp' },
    ],
    postconditions: [
      { condition: 'result has calculation and report', description: 'Composite output' },
    ],
    tags: ['math', 'report'],
  });
  console.log('Insert math_report (composite):', r3);

  // Typed DAG Retrieval — Stage 1 (signature unification)
  console.log('\n--- Stage 1: Signature Unification ---');
  const res1 = dag.retrieve({
    requiredInputs: [{ name: 'expr', type: 'string' }],
    requiredOutput: 'number',
    topK: 3,
  });
  console.log('Sig-match (string→number):', res1.map(r => r.name));

  // Typed DAG Retrieval — Stage 2 (description ranking)
  console.log('\n--- Stage 2: Description Ranking ---');
  const res2 = dag.retrieve({ queryText: 'math expression', topK: 3 });
  console.log('Text-match "math expression":', res2.map(r => r.name));

  // Tag-based filtering
  console.log('\n--- Tag Filter: [time] ---');
  const res3 = dag.retrieve({ tags: ['time'], topK: 3 });
  console.log('Tag [time]:', res3.map(r => r.name));

  // Full pipeline with query sig + text
  console.log('\n--- Full 4-Stage Retrieval ---');
  const res4 = dag.retrieve({
    querySig: { inputs: [{ name: 'x', type: 'string' }], output: 'number' },
    queryText: 'math',
    tags: ['math'],
    topK: 5,
  });
  console.log('Full pipeline:', res4.map(r => `${r.name} (score=${r.score.toFixed(2)})`));

  // Stats
  console.log('\n--- DAG Stats ---');
  console.log(dag.stats());

  // Record usage
  dag.recordUse(r1.nodeId, true);
  dag.recordUse(r1.nodeId, false);
  dag.recordUse(r2.nodeId, true);
  console.log('\nAfter usage:', dag.stats());
  
  console.log('\n✅ SkillDAG demo complete');
  console.log('Source: CoCoDA (arXiv:2605.08399) — Typed DAG Retrieval + Compositional Skill Evolution');
}

if (require.main === module) {
  demo();
}

module.exports = { SkillDAG, SkillNode, unifySignatures, typesCompatible };
