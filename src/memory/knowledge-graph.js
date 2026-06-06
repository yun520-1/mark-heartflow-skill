/**
 * KnowledgeGraph — Agent K Architecture Integration
 * 
 * v1.0.2: Structured memory with temporal context and relationship tracking.
 * Based on Agent K paper: 4-layer cognitive architecture with KG.
 * 
 * Features:
 *   - Nodes: named entities with importance + reflection count
 *   - Edges: typed relationships between nodes
 *   - MAX_CONNECTIONS_PER_NODE = 20
 *   - Keyword-based search with importance sorting
 */

const crypto = require('crypto');

class KnowledgeGraph {
  constructor(dataDir = null) {
    this.dataDir = dataDir;
    this.nodes = new Map();
    this.edges = new Map();
    this._isDirty = false;
  }

  /**
   * Add a node to the knowledge graph
   */
  addNode(partial) {
    const now = Date.now();
    const node = {
      id: `kg-${now}-${crypto.randomBytes(4).toString('hex')}`,
      name: partial.name,
      description: partial.description || '',
      type: partial.type || 'concept',
      importance: partial.importance || 0.5,
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
    const sourceNode = this.nodes.get(partial.sourceId);
    const targetNode = this.nodes.get(partial.targetId);
    
    if (!sourceNode || !targetNode) return null;
    if (sourceNode.connections.length >= 20) return null;

    const edge = {
      id: `kge-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      sourceId: partial.sourceId,
      targetId: partial.targetId,
      relation: partial.relation || 'related',
      weight: partial.weight || 0.5,
      bidirectional: partial.bidirectional || false,
      createdAt: Date.now(),
    };

    this.edges.set(edge.id, edge);

    if (!sourceNode.connections.includes(partial.targetId)) {
      sourceNode.connections.push(partial.targetId);
    }
    if (partial.bidirectional && !targetNode.connections.includes(partial.sourceId)) {
      targetNode.connections.push(partial.sourceId);
    }

    this._isDirty = true;
    return edge;
  }

  /**
   * Get a node by ID
   */
  getNode(id) {
    const node = this.nodes.get(id) ?? null;
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
          connected.push(connectedNode);
        }
      }
    }
    return connected;
  }

  /**
   * Search nodes by keyword (name or description)
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const node of this.nodes.values()) {
      if (
        node.name.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push(node);
      }
    }

    return results.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Reflect on a node — increment reflection count
   */
  reflect(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    node.reflectionCount = (node.reflectionCount ?? 0) + 1;
    node.lastAccessed = Date.now();
    this._isDirty = true;
    return node;
  }

  /**
   * Get knowledge graph statistics
   */
  getStats() {
    let totalConnections = 0;
    const mostConnected = [];

    for (const node of this.nodes.values()) {
      totalConnections += node.connections.length;
      if (node.connections.length > 0) {
        mostConnected.push({ id: node.id, name: node.name, count: node.connections.length });
      }
    }

    mostConnected.sort((a, b) => b.count - a.count);

    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      avgConnections: this.nodes.size > 0 ? totalConnections / this.nodes.size : 0,
      mostConnected: mostConnected.slice(0, 5),
    };
  }

  /**
   * Add a concept to the knowledge graph
   * Convenience method that creates a node and returns it
   */
  learnConcept(name, description = '', importance = 0.5) {
    return this.addNode({ name, description, type: 'concept', importance });
  }

  /**
   * Connect two concepts with a relationship
   */
  connect(sourceName, targetName, relation = 'related', bidirectional = false) {
    const sourceNodes = this.search(sourceName);
    const targetNodes = this.search(targetName);
    
    if (sourceNodes.length === 0 || targetNodes.length === 0) return null;
    
    return this.addEdge({
      sourceId: sourceNodes[0].id,
      targetId: targetNodes[0].id,
      relation,
      bidirectional,
    });
  }
}

module.exports = { KnowledgeGraph };
