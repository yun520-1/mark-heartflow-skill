/**
 * KnowledgeGraph — Agent K Architecture Integration
 * 
 * v1.1.0: Structured memory with temporal context, relationship tracking,
 * node pruning, serialization, enhanced stats, and defensive programming.
 * Based on Agent K paper: 4-layer cognitive architecture with KG.
 * 
 * Features:
 *   - Nodes: named entities with importance + reflection count
 *   - Edges: typed relationships between nodes
 *   - MAX_CONNECTIONS_PER_NODE = 20
 *   - Keyword-based search with importance sorting
 *   - Node removal / stale pruning
 *   - Edge weight updates
 *   - JSON serialization for persistence
 *   - Enhanced statistics
 *   - Input validation on all public methods
 */

const crypto = require('crypto');

// --- Error classification ---
const KG_ERROR = {
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  EDGE_NOT_FOUND: 'EDGE_NOT_FOUND',
  CONNECTION_LIMIT: 'CONNECTION_LIMIT',
  INVALID_INPUT: 'INVALID_INPUT',
  SEARCH_EMPTY: 'SEARCH_EMPTY',
  UNKNOWN: 'UNKNOWN',
};

const KG_ERROR_MESSAGES = {
  [KG_ERROR.NODE_NOT_FOUND]: 'Node not found',
  [KG_ERROR.EDGE_NOT_FOUND]: 'Edge not found',
  [KG_ERROR.CONNECTION_LIMIT]: 'Connection limit reached',
  [KG_ERROR.INVALID_INPUT]: 'Invalid input',
  [KG_ERROR.SEARCH_EMPTY]: 'Search returned no results',
  [KG_ERROR.UNKNOWN]: 'Unknown error',
};

// --- Constants ---
const MAX_CONNECTIONS = 20;
const IMPORTANCE_DECAY_RATE = 0.95; // per day
const STALE_DAYS = 30;
const DEFAULT_IMPORTANCE = 0.5;

class KnowledgeGraph {
  constructor(dataDir = null) {
    this.dataDir = dataDir;
    this.nodes = new Map();
    this.edges = new Map();
    this._isDirty = false;
    this._lastDecay = Date.now();
  }

  /**
   * Safely extract a string property from a partial object
   */
  _safeString(val, fallback = '') {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return fallback;
    return String(val);
  }

  /**
   * Safely extract a number with bounds
   */
  _safeNumber(val, fallback = 0, min = 0, max = 1) {
    if (typeof val === 'number' && !Number.isNaN(val)) {
      return Math.max(min, Math.min(max, val));
    }
    return fallback;
  }

  /**
   * Validate a partial node input object
   */
  _validateNodeInput(partial) {
    if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
      return { valid: false, error: KG_ERROR.INVALID_INPUT, message: 'Node input must be a non-null object' };
    }
    if (!partial.name || typeof partial.name !== 'string' || partial.name.trim().length === 0) {
      return { valid: false, error: KG_ERROR.INVALID_INPUT, message: 'Node name is required and must be a non-empty string' };
    }
    return { valid: true };
  }

  /**
   * Validate a partial edge input object
   */
  _validateEdgeInput(partial) {
    if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
      return { valid: false, error: KG_ERROR.INVALID_INPUT, message: 'Edge input must be a non-null object' };
    }
    if (!partial.sourceId || typeof partial.sourceId !== 'string') {
      return { valid: false, error: KG_ERROR.INVALID_INPUT, message: 'sourceId is required and must be a string' };
    }
    if (!partial.targetId || typeof partial.targetId !== 'string') {
      return { valid: false, error: KG_ERROR.INVALID_INPUT, message: 'targetId is required and must be a string' };
    }
    return { valid: true };
  }

  /**
   * Apply importance decay to all nodes based on time elapsed
   */
  _applyDecay() {
    const now = Date.now();
    const elapsed = now - this._lastDecay;
    const days = elapsed / (24 * 60 * 60 * 1000);
    if (days < 1) return; // only decay once per day minimum

    for (const node of this.nodes.values()) {
      const ageDays = (now - node.createdAt) / (24 * 60 * 60 * 1000);
      if (ageDays > STALE_DAYS) {
        // older than stale threshold — faster decay
        node.importance *= Math.pow(IMPORTANCE_DECAY_RATE * 0.9, days);
      } else {
        node.importance *= Math.pow(IMPORTANCE_DECAY_RATE, days);
      }
      node.importance = Math.max(0.05, Math.min(1.0, node.importance));
    }
    this._lastDecay = now;
    this._isDirty = true;
  }

  /**
   * Add a node to the knowledge graph
   */
  addNode(partial) {
    const validation = this._validateNodeInput(partial);
    if (!validation.valid) {
      const err = new Error(validation.message);
      err.code = validation.error;
      throw err;
    }

    const now = Date.now();
    const node = {
      id: `kg-${now}-${crypto.randomBytes(4).toString('hex')}`,
      name: partial.name.trim(),
      description: this._safeString(partial.description),
      type: this._safeString(partial.type, 'concept'),
      importance: this._safeNumber(partial.importance, DEFAULT_IMPORTANCE, 0.05, 1.0),
      connections: [],
      reflectionCount: 0,
      createdAt: now,
      lastAccessed: now,
    };
    this.nodes.set(node.id, node);
    this._isDirty = true;
    return node;
  }

  /**
   * Add an edge between two nodes
   * Returns null if nodes don't exist or connection limit reached
   */
  addEdge(partial) {
    const validation = this._validateEdgeInput(partial);
    if (!validation.valid) {
      const err = new Error(validation.message);
      err.code = validation.error;
      throw err;
    }

    const sourceNode = this.nodes.get(partial.sourceId);
    const targetNode = this.nodes.get(partial.targetId);

    if (!sourceNode || !targetNode) {
      const missing = !sourceNode && !targetNode ? 'Both nodes' : (!sourceNode ? 'Source node' : 'Target node');
      const err = new Error(`${missing} not found`);
      err.code = KG_ERROR.NODE_NOT_FOUND;
      return null;
    }

    if (sourceNode.connections.length >= MAX_CONNECTIONS) {
      const err = new Error(`Source node connection limit (${MAX_CONNECTIONS}) reached`);
      err.code = KG_ERROR.CONNECTION_LIMIT;
      return null;
    }

    const edge = {
      id: `kge-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      sourceId: partial.sourceId,
      targetId: partial.targetId,
      relation: partial.relation || 'related',
      weight: this._safeNumber(partial.weight, 0.5, 0, 1),
      bidirectional: partial.bidirectional === true,
      createdAt: Date.now(),
    };

    this.edges.set(edge.id, edge);

    if (!sourceNode.connections.includes(partial.targetId)) {
      sourceNode.connections.push(partial.targetId);
    }
    if (edge.bidirectional && !targetNode.connections.includes(partial.sourceId)) {
      targetNode.connections.push(partial.sourceId);
    }

    this._isDirty = true;
    return edge;
  }

  /**
   * Remove a node and all associated edges
   */
  removeNode(nodeId) {
    if (!nodeId || typeof nodeId !== 'string') {
      const err = new Error('nodeId must be a non-empty string');
      err.code = KG_ERROR.INVALID_INPUT;
      throw err;
    }

    const node = this.nodes.get(nodeId);
    if (!node) {
      const err = new Error(KG_ERROR_MESSAGES[KG_ERROR.NODE_NOT_FOUND]);
      err.code = KG_ERROR.NODE_NOT_FOUND;
      return false;
    }

    // Remove all edges involving this node
    const edgesToRemove = [];
    for (const [edgeId, edge] of this.edges) {
      if (edge.sourceId === nodeId || edge.targetId === nodeId) {
        edgesToRemove.push(edgeId);
      }
    }
    for (const edgeId of edgesToRemove) {
      this.edges.delete(edgeId);
    }

    // Remove connections from other nodes' connection lists
    for (const otherNode of this.nodes.values()) {
      otherNode.connections = otherNode.connections.filter(c => c !== nodeId);
    }

    this.nodes.delete(nodeId);
    this._isDirty = true;
    return true;
  }

  /**
   * Update the weight of an existing edge
   */
  updateEdgeWeight(edgeId, newWeight) {
    if (!edgeId || typeof edgeId !== 'string') {
      const err = new Error('edgeId must be a non-empty string');
      err.code = KG_ERROR.INVALID_INPUT;
      throw err;
    }

    const edge = this.edges.get(edgeId);
    if (!edge) {
      const err = new Error(KG_ERROR_MESSAGES[KG_ERROR.EDGE_NOT_FOUND]);
      err.code = KG_ERROR.EDGE_NOT_FOUND;
      return null;
    }

    edge.weight = this._safeNumber(newWeight, edge.weight, 0, 1);
    this._isDirty = true;
    return edge;
  }

  /**
   * Get a node by ID
   */
  getNode(id) {
    if (!id || typeof id !== 'string') {
      const err = new Error('id must be a non-empty string');
      err.code = KG_ERROR.INVALID_INPUT;
      throw err;
    }
    const node = this.nodes.get(id) || null;
    if (node) {
      node.lastAccessed = Date.now();
      this._isDirty = true;
    }
    return node;
  }

  /**
   * Get all nodes connected to a given node
   */
  getConnectedNodes(nodeId, relation = null) {
    if (!nodeId || typeof nodeId !== 'string') {
      const err = new Error('nodeId must be a non-empty string');
      err.code = KG_ERROR.INVALID_INPUT;
      throw err;
    }

    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const connected = [];
    for (const edge of this.edges.values()) {
      if (edge.sourceId === nodeId || (edge.bidirectional && edge.targetId === nodeId)) {
        if (relation && edge.relation !== relation) continue;
        const connectedId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        const connectedNode = this.nodes.get(connectedId);
        if (connectedNode) {
          connectedNode.lastAccessed = Date.now();
          connected.push({ node: connectedNode, edgeWeight: edge.weight, relation: edge.relation });
        }
      }
    }
    return connected;
  }

  /**
   * Search nodes by keyword (name or description)
   * Returns results sorted by importance descending
   */
  search(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery.length === 0) return [];

    const results = [];

    for (const node of this.nodes.values()) {
      let score = 0;
      const nameLower = node.name.toLowerCase();
      const descLower = node.description.toLowerCase();

      // Exact name match: highest score
      if (nameLower === lowerQuery) {
        score = 1.0;
      } else if (nameLower.includes(lowerQuery)) {
        // Name contains query
        score = 0.8;
      } else if (descLower.includes(lowerQuery)) {
        // Description contains query
        score = 0.5;
      }

      if (score > 0) {
        results.push({ node, score, rankScore: score * node.importance });
      }
    }

    return results.sort((a, b) => b.rankScore - a.rankScore);
  }

  /**
   * Search by exact node name (for name-based lookups)
   */
  findByName(name) {
    if (!name || typeof name !== 'string') return null;
    const lower = name.toLowerCase().trim();
    for (const node of this.nodes.values()) {
      if (node.name.toLowerCase() === lower) return node;
    }
    return null;
  }

  /**
   * Reflect on a node — increment reflection count
   */
  reflect(nodeId) {
    if (!nodeId || typeof nodeId !== 'string') {
      const err = new Error('nodeId must be a non-empty string');
      err.code = KG_ERROR.INVALID_INPUT;
      throw err;
    }
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    node.reflectionCount = (node.reflectionCount || 0) + 1;
    node.importance = Math.min(1.0, node.importance + 0.05);
    node.lastAccessed = Date.now();
    this._isDirty = true;
    return node;
  }

  /**
   * Prune stale nodes (low importance, old, unreflected)
   */
  pruneStale(options = {}) {
    const minImportance = options.minImportance ?? 0.1;
    const maxAgeMs = options.maxAgeMs ?? (STALE_DAYS * 24 * 60 * 60 * 1000);
    const minReflections = options.minReflections ?? 0;
    const now = Date.now();
    const removed = [];

    for (const [id, node] of this.nodes) {
      const tooOld = (now - node.lastAccessed) > maxAgeMs;
      const tooLow = node.importance < minImportance;
      const unreflected = node.reflectionCount <= minReflections;
      if (tooOld && (tooLow || unreflected)) {
        this.removeNode(id);
        removed.push({ id, name: node.name, importance: node.importance, age: now - node.createdAt });
      }
    }

    return removed;
  }

  /**
   * Export graph to a serializable JSON object
   */
  toJSON() {
    const nodesArray = [];
    for (const [id, node] of this.nodes) {
      nodesArray.push({
        id,
        name: node.name,
        description: node.description,
        type: node.type,
        importance: node.importance,
        connections: [...node.connections],
        reflectionCount: node.reflectionCount,
        createdAt: node.createdAt,
        lastAccessed: node.lastAccessed,
      });
    }

    const edgesArray = [];
    for (const [id, edge] of this.edges) {
      edgesArray.push({
        id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        relation: edge.relation,
        weight: edge.weight,
        bidirectional: edge.bidirectional,
        createdAt: edge.createdAt,
      });
    }

    return { nodes: nodesArray, edges: edgesArray };
  }

  /**
   * Import graph state from a JSON object
   */
  fromJSON(data) {
    if (!data || typeof data !== 'object') return false;
    this.nodes.clear();
    this.edges.clear();

    if (Array.isArray(data.nodes)) {
      for (const n of data.nodes) {
        if (n && n.id && n.name) {
          this.nodes.set(n.id, {
            id: n.id,
            name: this._safeString(n.name),
            description: this._safeString(n.description),
            type: this._safeString(n.type, 'concept'),
            importance: this._safeNumber(n.importance, DEFAULT_IMPORTANCE, 0.05, 1.0),
            connections: Array.isArray(n.connections) ? [...n.connections] : [],
            reflectionCount: typeof n.reflectionCount === 'number' ? n.reflectionCount : 0,
            createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
            lastAccessed: typeof n.lastAccessed === 'number' ? n.lastAccessed : Date.now(),
          });
        }
      }
    }

    if (Array.isArray(data.edges)) {
      for (const e of data.edges) {
        if (e && e.id && e.sourceId && e.targetId) {
          this.edges.set(e.id, {
            id: e.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            relation: this._safeString(e.relation, 'related'),
            weight: this._safeNumber(e.weight, 0.5, 0, 1),
            bidirectional: e.bidirectional === true,
            createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
          });
        }
      }
    }

    this._lastDecay = Date.now();
    this._isDirty = false;
    return true;
  }

  /**
   * Get comprehensive knowledge graph statistics
   */
  getStats() {
    this._applyDecay();

    let totalConnections = 0;
    const mostConnected = [];
    const mostReflected = [];
    let staleCount = 0;
    const now = Date.now();

    for (const node of this.nodes.values()) {
      totalConnections += node.connections.length;

      if (node.connections.length > 0) {
        mostConnected.push({ id: node.id, name: node.name, count: node.connections.length });
      }
      if (node.reflectionCount > 0) {
        mostReflected.push({ id: node.id, name: node.name, count: node.reflectionCount, importance: node.importance });
      }
      if ((now - node.lastAccessed) > STALE_DAYS * 24 * 60 * 60 * 1000) {
        staleCount++;
      }
    }

    mostConnected.sort((a, b) => b.count - a.count);
    mostReflected.sort((a, b) => b.count - a.count);

    const edgeTypes = new Map();
    for (const edge of this.edges.values()) {
      edgeTypes.set(edge.relation, (edgeTypes.get(edge.relation) || 0) + 1);
    }

    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      avgConnections: this.nodes.size > 0 ? +(totalConnections / this.nodes.size).toFixed(2) : 0,
      mostConnected: mostConnected.slice(0, 5),
      mostReflected: mostReflected.slice(0, 5),
      staleCount,
      edgeTypeDistribution: Object.fromEntries(edgeTypes),
      nodeTypes: this._getNodeTypeDistribution(),
      isDirty: this._isDirty,
    };
  }

  /**
   * Get distribution of node types
   */
  _getNodeTypeDistribution() {
    const dist = {};
    for (const node of this.nodes.values()) {
      dist[node.type] = (dist[node.type] || 0) + 1;
    }
    return dist;
  }

  /**
   * Add a concept to the knowledge graph
   * Convenience method that creates a node and returns it
   */
  learnConcept(name, description = '', importance = DEFAULT_IMPORTANCE) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Concept name must be a non-empty string');
      err.code = KG_ERROR.INVALID_INPUT;
      throw err;
    }
    return this.addNode({ name: name.trim(), description: this._safeString(description), type: 'concept', importance: this._safeNumber(importance, DEFAULT_IMPORTANCE, 0.05, 1.0) });
  }

  /**
   * Connect two concepts by name with a relationship
   */
  connect(sourceName, targetName, relation = 'related', bidirectional = false) {
    if (!sourceName || !targetName) return null;

    const sourceNodes = this.search(sourceName);
    const targetNodes = this.search(targetName);

    if (sourceNodes.length === 0 || targetNodes.length === 0) return null;

    return this.addEdge({
      sourceId: sourceNodes[0].node.id,
      targetId: targetNodes[0].node.id,
      relation: this._safeString(relation, 'related'),
      bidirectional: bidirectional === true,
    });
  }

  /**
   * Check if graph needs saving
   */
  get isDirty() {
    return this._isDirty;
  }

  /**
   * Mark graph as saved
   */
  markClean() {
    this._isDirty = false;
  }
}

module.exports = { KnowledgeGraph, KG_ERROR, KG_ERROR_MESSAGES, MAX_CONNECTIONS, IMPORTANCE_DECAY_RATE };
