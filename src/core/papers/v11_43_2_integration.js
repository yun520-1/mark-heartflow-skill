/**
 * HeartFlow v11.43.2 — Memory Enhancement Papers (JS Translation)
 *
 * Papers:
 * [1] MemArchitect      arXiv:2603.18330  — FSRS v4 + Kalman Filter + tri-path loop
 * [2] PersistIdentity   arXiv:2604.09588  — multi-anchor identity memory
 * [3] HippoRAG         arXiv:2406.13417  — hippocampal-inspired graph memory
 * [4] EASE             arXiv:2604.10379  — episodic-abstract semantic compression
 * [5] Ctx2SkillReplay  arXiv:2604.27660v2 — cross-time replay consolidation
 */

// ============================================================
// [1] MemArchitectGovernor — FSRS v4 + Kalman Filter + Tri-Path
// arXiv:2603.18330
// ============================================================

const FSRS_V4_CONFIG = {
  retrievabilityThreshold: 0.3,
  stabilityDefault: 30, // days
  maxEpisodic: 100,
  consolidationTrigger: 50,
};

class MemArchitectGovernor {
  constructor() {
    this.policies = {
      decay: { type: 'FSRS_v4', retrievability_threshold: 0.3 },
      consistency: { type: 'KalmanFilter', trust_inertia: 0.7 },
      lifecycle: { max_episodic: 100, consolidation_trigger: 50 },
    };
    this.utilityEstimates = new Map(); // memoryId → utility
    this.episodicMemories = [];
  }

  /** FSRS v4 retrievability: R(t) = (1 + (19/9) * t / S)^(-1) */
  _fsrs4_retrievability(memory) {
    const now = Date.now();
    const t = (now - (memory.timestamp || now)) / 86400000; // days
    const S = memory.stability || 30;
    return 1.0 / (1.0 + (19 / 9) * (t / S));
  }

  /** Kalman filter update for utility estimate */
  _kalmanUpdate(memoryId, feedback) {
    const prev = this.utilityEstimates.get(memoryId) ?? 0.5;
    const K = 0.3; // Kalman gain
    const updated = prev + K * (feedback - prev);
    this.utilityEstimates.set(memoryId, Math.max(0.0, Math.min(1.0, updated)));
  }

  /** Tri-path: Read → Reflect → Background */
  triPathProcess(query, memories) {
    const retrieved = this._readPath(query, memories);
    const adjudicated = this._reflectPath(retrieved);
    this._backgroundPath(memories);
    return adjudicated;
  }

  /** Read path: retrieve by utility × retrievability */
  _readPath(query, memories) {
    const scored = [];
    for (const mem of memories) {
      const utility = this.utilityEstimates.get(mem.id) ?? 0.5;
      const R = this._fsrs4_retrievability(mem);
      if (utility > 0.2 && R > this.policies.decay.retrievability_threshold) {
        scored.push({ score: utility * R, mem });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(s => s.mem);
  }

  /** Reflect path: cross-encoder veto gate — remove contradictions */
  _reflectPath(retrieved) {
    const filtered = [];
    for (const mem of retrieved) {
      let contradicted = false;
      for (const f of filtered) {
        if (this._isContradiction(mem.content || '', f.content || '')) {
          contradicted = true;
          const memUtil = this.utilityEstimates.get(mem.id) ?? 0.5;
          const fUtil = this.utilityEstimates.get(f.id) ?? 0.5;
          if (memUtil > fUtil) {
            filtered[filtered.indexOf(f)] = mem;
          }
          break;
        }
      }
      if (!contradicted) filtered.push(mem);
    }
    return filtered;
  }

  /** Background path: prune low-retrievability, consolidate fading */
  _backgroundPath(memories) {
    const toKeep = [];
    for (const mem of memories) {
      const R = this._fsrs4_retrievability(mem);
      if (R < 0.3) continue; // prune
      if (R < 0.7) {
        mem.consolidated = true;
        mem.synthesized = (mem.content || '').substring(0, 100);
      }
      toKeep.push(mem);
    }
    if (toKeep.length > this.policies.lifecycle.max_episodic) {
      this.episodicMemories = toKeep.slice(-this.policies.lifecycle.max_episodic);
    } else {
      this.episodicMemories = toKeep;
    }
  }

  _isContradiction(a, b) {
    const aHasNot = a.includes('不') || a.includes('非');
    const bHasNot = b.includes('不') || b.includes('非');
    if (aHasNot !== bHasNot) {
      const aCore = a.replace(/不/g, '').replace(/非/g, '').trim();
      const bCore = b.replace(/不/g, '').replace(/非/g, '').trim();
      return aCore === bCore;
    }
    return false;
  }

  /** Record feedback for a memory (called after successful recall/use) */
  recordFeedback(memoryId, success) {
    this._kalmanUpdate(memoryId, success ? 1.0 : 0.0);
  }
}

// ============================================================
// [2] MultiAnchorIdentity — 4-Anchor Identity Persistence
// arXiv:2604.09588
// ============================================================

const IDENTITY_ANCHORS = {
  episodic: 'data/identity/episodic.json',
  procedural: 'data/identity/procedural.json',
  emotional: 'data/identity/emotional.json',
  embodied: 'data/identity/embodied.json',
};

class MultiAnchorIdentity {
  constructor(fs = require('fs'), path = require('path')) {
    this.fs = fs;
    this.path = path;
    this.anchors = {};
    this.activeAnchors = new Set();
    this.baseDir = path.join(__dirname, '../../..');
  }

  loadAnchors() {
    let loaded = 0;
    for (const [name, relPath] of Object.entries(IDENTITY_ANCHORS)) {
      const fullPath = this.path.join(this.baseDir, relPath);
      try {
        if (this.fs.existsSync(fullPath)) {
          this.anchors[name] = this.fs.readFileSync(fullPath, 'utf8');
          this.activeAnchors.add(name);
          loaded++;
        }
      } catch (e) {
        // Anchor file missing — skip
      }
    }
    return loaded;
  }

  injectIdentity() {
    const blocks = [];
    for (const name of this.activeAnchors) {
      blocks.push(`[${name}] ${(this.anchors[name] || '').substring(0, 100)}`);
    }
    return blocks.length ? blocks.join('\n') : 'IDENTITY_DEGRADED';
  }

  damageSimulate(lostAnchor) {
    this.activeAnchors.delete(lostAnchor);
    return this.activeAnchors.size >= 2;
  }

  recover() {
    if (this.activeAnchors.size < 2) {
      return 'IDENTITY_DEGRADED: insufficient anchors';
    }
    return this.injectIdentity();
  }

  saveAnchor(name, content) {
    const fullPath = this.path.join(this.baseDir, IDENTITY_ANCHORS[name]);
    try {
      this.fs.mkdirSync(this.path.dirname(fullPath), { recursive: true });
      this.fs.writeFileSync(fullPath, content, 'utf8');
      this.anchors[name] = content;
      this.activeAnchors.add(name);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// ============================================================
// [3] HippoRAGMemory — Hippocampal-Inspired Graph Memory
// arXiv:2406.13417
// ============================================================

// HippoRAGMemory — uses native Node.js only (no external deps)

class HippoRAGMemory {
  constructor() {
    this.graph = new Map(); // entity → { neighbor → weight }
    this.memories = [];
  }

  index(memory) {
    const entities = this._extractEntities(memory.content || '');
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < entities.length; j++) {
        if (i === j) continue;
        const [e1, e2] = [entities[i], entities[j]];
        if (!this.graph.has(e1)) this.graph.set(e1, new Map());
        const neighbors = this.graph.get(e1);
        neighbors.set(e2, (neighbors.get(e2) || 0) + 1.0);
      }
    }
    memory.entities = entities;
    this.memories.push(memory);
  }

  retrieve(query, topK = 5) {
    const qEntities = this._extractEntities(query);
    if (!qEntities.length) return [];

    // Personalized PageRank from query entities
    const scores = new Map();
    for (const qEnt of qEntities) {
      for (const [neighbor, weight] of (this.graph.get(qEnt) || new Map())) {
        scores.set(neighbor, (scores.get(neighbor) || 0) + weight);
      }
    }

    // Rank memories by aggregate entity score
    const memScores = [];
    for (const mem of this.memories) {
      let memScore = 0;
      for (const e of (mem.entities || [])) {
        memScore += scores.get(e) || 0;
      }
      memScores.push({ memScore, mem });
    }
    memScores.sort((a, b) => b.memScore - a.memScore);
    return memScores.slice(0, topK).map(s => s.mem);
  }

  _extractEntities(text) {
    // Extract Chinese 2+ char words
    const matches = (text.match(/[\u4e00-\u9fa5]{2,}/g) || []);
    // Also extract English words
    const enMatches = (text.match(/[a-zA-Z]{3,}/g) || []).map(w => w.toLowerCase());
    return [...new Set([...matches, ...enMatches])];
  }
}

// ============================================================
// [4] EASEMemoryCompressor — Episodic-Abstract Semantic Embedding
// arXiv:2604.10379
// ============================================================

const EASE_TOPICS = ['死亡', '公平', '意义', '意识', 'AI', '永生', '升级', '记忆', '心虫', '真善美'];

class EASEMemoryCompressor {
  constructor() {
    this.semanticStore = new Map(); // concept → { summary, episodeIds }
  }

  compress(episodes) {
    for (const ep of episodes) {
      const concept = this._extractAbstractConcept(ep.content || '');
      if (!this.semanticStore.has(concept)) {
        this.semanticStore.set(concept, { summary: (ep.content || '').substring(0, 200), episodeIds: [] });
      }
      this.semanticStore.get(concept).episodeIds.push(ep.id);
    }
  }

  query(abstractConcept) {
    return this.semanticStore.get(abstractConcept) || {};
  }

  _extractAbstractConcept(text) {
    for (const topic of EASE_TOPICS) {
      if (text.includes(topic)) return topic;
    }
    return 'general';
  }
}

// ============================================================
// [5] CrossTimeReplay — Cross-Time Replay Consolidation
// arXiv:2604.27660v2
// ============================================================

class CrossTimeReplay {
  constructor() {
    this.memoryPool = new Map(); // memId → { content, metadata, retentionScore }
    this.replayLog = [];
  }

  store(memId, content, metadata = {}) {
    this.memoryPool.set(memId, {
      content,
      metadata,
      retentionScore: 1.0,
      storedAt: Date.now(),
    });
  }

  /**
   * Replay: re-evaluate all memories, decay unused ones
   * @param {Function} evaluator — fn(mem) → usefulness [0..1]
   */
  replay(evaluator) {
    for (const [memId, mem] of this.memoryPool) {
      const usefulness = evaluator(mem);
      mem.retentionScore = 0.9 * mem.retentionScore + 0.1 * usefulness;
      if (mem.retentionScore < 0.3) {
        this.memoryPool.delete(memId);
      }
    }
    this.replayLog.push({ time: Date.now(), poolSize: this.memoryPool.size });
  }

  retrieveTop(topK = 5) {
    return [...this.memoryPool.values()]
      .sort((a, b) => b.retentionScore - a.retentionScore)
      .slice(0, topK);
  }

  getStats() {
    return {
      poolSize: this.memoryPool.size,
      avgRetention: [...this.memoryPool.values()].reduce((s, m) => s + m.retentionScore, 0) /
        Math.max(this.memoryPool.size, 1),
      replayCount: this.replayLog.length,
    };
  }
}

// ============================================================
// v11.43.2 EXPORT
// ============================================================

const MemoryV11432 = {
  version: '11.43.2',
  MemArchitectGovernor,
  MultiAnchorIdentity,
  HippoRAGMemory,
  EASEMemoryCompressor,
  CrossTimeReplay,
};

module.exports = {
  MemoryV11432,
  MemArchitectGovernor,
  MultiAnchorIdentity,
  HippoRAGMemory,
  EASEMemoryCompressor,
  CrossTimeReplay,
};
