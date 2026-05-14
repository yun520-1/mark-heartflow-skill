/**
 * HeartFlow Memory Engine - Three-Tier Memory System
 * TypeScript ESM · Zero Dependencies
 *
 * Tiers:
 *   Working  — fast, hot, LRU cache (from memory.ts)
 *   Episodic — time-indexed archived blocks (from recall.ts)
 *   Semantic — conceptual knowledge graph
 */

import * as fs from "fs";
import * as path from "path";
import { homedir } from 'os';

import { createMemoryStore, memorize, recall, forget, searchByTag, searchByContent, getRecent, getHighValue, getStats, exportMemory, importMemory, type MemoryEntry } from './memory.js';
import { createRecallIndex, archiveEntries, retrieve, retrieveByTimeRange, retrieveByTag, searchEpisodic, getRecentBlocks, getRecallStats, exportRecallIndex, importRecallIndex, type EpisodicBlock } from './recall.js';
import { createConsolidationEngine, type MemoryHealthReport, type ConsolidationResult } from './memory-consolidation.js';

// ── Semantic Layer Types ──────────────────────────────────────────────────────

export interface SemanticNode {
  id: string;
  concept: string;            // normalized concept key
  summary: string;            // compressed knowledge
  keywords: string[];         // searchable keywords
  relatedConcepts: string[];  // linked concept ids
  importance: number;         // 0.0–1.0
  strength: number;           // connection strength 0.0–1.0
  episodeIds: string[];       // source episodic block ids
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export interface SemanticIndex {
  nodes: Map<string, SemanticNode>;
  conceptIndex: Map<string, string>;   // concept → nodeId
  keywordIndex: Map<string, Set<string>>; // keyword → nodeIds
}

export interface SemanticResult {
  node: SemanticNode;
  relevance: number;          // 0.0–1.0
  matchType: 'exact' | 'keyword' | 'related';
}

// ── Three-Tier Memory Engine ─────────────────────────────────────────────────

export interface MemoryEngine {
  // Working memory (hot)
  memorize(content: string, importance?: number, tags?: string[], ephemeral?: boolean): MemoryEntry;
  recall(id: string): MemoryEntry | undefined;
  forget(id: string): void;
  searchByTag(tag: string): MemoryEntry[];
  getRecent(limit?: number): MemoryEntry[];
  getHighValue(limit?: number): MemoryEntry[];

  // Episodic (archived)
  archiveToEpisodic(entries: MemoryEntry[]): EpisodicBlock[];
  retrieveEpisodic(id: string): EpisodicBlock | null;
  retrieveByTimeRange(startTs: number, endTs: number): EpisodicBlock[];
  retrieveByTag(tag: string): EpisodicBlock[];
  getRecentBlocks(limit?: number): EpisodicBlock[];

  // Semantic (knowledge)
  learnConcept(concept: string, summary: string, keywords?: string[], importance?: number): SemanticNode;
  recallConcept(concept: string): SemanticResult | null;
  searchSemantic(query: string, limit?: number): SemanticResult[];
  linkConcepts(sourceId: string, targetId: string, strength?: number): void;

  // Unified operations
  search(query: string): {
    working: MemoryEntry[];
    episodic: { block: EpisodicBlock; relevance: number }[];
    semantic: SemanticResult[];
  };
  consolidate(highImportanceThreshold?: number): void;
  getHealth(): MemoryHealthReport;
  performDreamConsolidation(): ConsolidationResult;
  exportAll(): string;
  importMemory(json: string): number;

  // Stats
  getStats(): {
    working: ReturnType<typeof getStats>;
    episodic: ReturnType<typeof getRecallStats>;
    semantic: { totalNodes: number; avgImportance: number; avgStrength: number };
  };
  boot(): void;
  shutdown(): void;
}

// ── Factory ─────────────────────────────────────────────────────────────────

export function createMemoryEngine(): MemoryEngine {
  // Working memory store
  const working = createMemoryStore();

  // Episodic recall index
  const episodic = createRecallIndex(0.65);

  // Semantic knowledge graph
  const semantic = createSemanticIndex();

  // Consolidation engine (hippocampal replay + pollution/dilution monitoring)
  const consolidation = createConsolidationEngine();

  // Persistence constants (inside engine to close over all state)
  const PERMANENT_DIR  = path.join(homedir(), ".hermes", "skills", "ai", "mark-heartflow-skill", "memory");
  const PERMANENT_FILE = path.join(PERMANENT_DIR, "permanent.json");
  const SEMANTIC_FILE  = path.join(PERMANENT_DIR, "semantic.json");

  // ── Persistence helpers (inside engine so they close over state) ─────────────

  function ensureDir() {
    if (!fs.existsSync(PERMANENT_DIR)) {
      fs.mkdirSync(PERMANENT_DIR, { recursive: true });
    }
  }

  function loadFromDisk(): number {
    let loaded = 0;
    try {
      if (fs.existsSync(PERMANENT_FILE)) {
        const content = fs.readFileSync(PERMANENT_FILE, "utf8");
        loaded += importMemoryData(content);
      }
    } catch { /* best-effort */ }
    try {
      if (fs.existsSync(SEMANTIC_FILE)) {
        const raw = JSON.parse(fs.readFileSync(SEMANTIC_FILE, "utf8"));
        if (raw.nodes) for (const [id, node] of raw.nodes) {
          if (!semantic.nodes.has(id)) semantic.nodes.set(id, node as SemanticNode);
        }
        if (raw.conceptIndex) for (const [c, nid] of raw.conceptIndex) {
          if (!semantic.conceptIndex.has(c)) semantic.conceptIndex.set(c, nid as string);
        }
        if (raw.keywordIndex) for (const [kw, ids] of raw.keywordIndex) {
          if (!semantic.keywordIndex.has(kw)) semantic.keywordIndex.set(kw, new Set(ids as string[]));
        }
      }
    } catch { /* best-effort */ }
    return loaded;
  }

  function saveToDisk(): void {
    try {
      ensureDir();
      const allData = JSON.parse(exportAllData());
      if (allData.working?.length > 0) {
        fs.writeFileSync(PERMANENT_FILE, JSON.stringify(allData.working, null, 2), "utf8");
      }
      fs.writeFileSync(SEMANTIC_FILE, JSON.stringify({
        nodes: Array.from(semantic.nodes.entries()),
        conceptIndex: Array.from(semantic.conceptIndex.entries()),
        keywordIndex: Array.from(semantic.keywordIndex.entries()).map(([k, v]) => [k, Array.from(v)] as [string, string[]]),
      }, null, 2), "utf8");
    } catch { /* best-effort */ }
  }

  // ── Semantic Helpers ──────────────────────────────────────────────────────

  function createSemanticIndex(): SemanticIndex {
    return {
      nodes: new Map(),
      conceptIndex: new Map(),
      keywordIndex: new Map(),
    };
  }

  function normalizeConcept(concept: string): string {
    return concept.toLowerCase().trim().replace(/\s+/g, '_');
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function now(): number {
    return Date.now();
  }

  function extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const freq = new Map<string, number>();
    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);
  }

  // ── Working Memory ─────────────────────────────────────────────────────────

  function memorizeEntry(
    content: string,
    importance: number = 0.5,
    tags: string[] = [],
    ephemeral: boolean = false,
  ): MemoryEntry {
    const entry = memorize(working, content, importance, tags, ephemeral);
    consolidation.recordEntryAdded();
    return entry;
  }

  function recallEntry(id: string): MemoryEntry | undefined {
    return recall(working, id) ?? undefined;
  }

  function forgetEntry(id: string): void {
    forget(working, id);
  }

  function searchByTagEntry(tag: string): MemoryEntry[] {
    return searchByTag(working, tag);
  }

  function getRecentEntries(limit: number = 50): MemoryEntry[] {
    return getRecent(working, limit);
  }

  function getHighValueEntries(limit: number = 20): MemoryEntry[] {
    return getHighValue(working, limit);
  }

  // ── Episodic Memory ────────────────────────────────────────────────────────

  function archiveEntriesToEpisodic(entries: MemoryEntry[]): EpisodicBlock[] {
    return archiveEntries(episodic, entries);
  }

  function retrieveEpisodicBlock(id: string): EpisodicBlock | null {
    return retrieve(episodic, id);
  }

  function retrieveByTimeRangeEp(startTs: number, endTs: number): EpisodicBlock[] {
    return retrieveByTimeRange(episodic, startTs, endTs);
  }

  function retrieveByTagEp(tag: string): EpisodicBlock[] {
    return retrieveByTag(episodic, tag);
  }

  function getRecentEpBlocks(limit: number = 20): EpisodicBlock[] {
    return getRecentBlocks(episodic, limit);
  }

  // ── Semantic Memory ───────────────────────────────────────────────────────

  function learnConceptNode(
    concept: string,
    summary: string,
    keywords: string[] = [],
    importance: number = 0.5,
  ): SemanticNode {
    const id = generateId();
    const normalized = normalizeConcept(concept);
    const extracted = keywords.length > 0 ? keywords : extractKeywords(summary);

    const node: SemanticNode = {
      id,
      concept: normalized,
      summary,
      keywords: extracted,
      relatedConcepts: [],
      importance: Math.max(0, Math.min(1, importance)),
      strength: 0.5,
      episodeIds: [],
      createdAt: now(),
      lastAccessed: now(),
      accessCount: 0,
    };

    semantic.nodes.set(id, node);
    semantic.conceptIndex.set(normalized, id);

    for (const kw of extracted) {
      if (!semantic.keywordIndex.has(kw)) {
        semantic.keywordIndex.set(kw, new Set());
      }
      semantic.keywordIndex.get(kw)!.add(id);
    }

    return node;
  }

  function recallConceptNode(concept: string): SemanticResult | null {
    const normalized = normalizeConcept(concept);
    const nodeId = semantic.conceptIndex.get(normalized);

    if (nodeId) {
      const node = semantic.nodes.get(nodeId)!;
      node.lastAccessed = now();
      node.accessCount++;
      return { node, relevance: 1.0, matchType: 'exact' };
    }

    // Partial match via keyword
    const results = searchSemanticNode(concept, 1);
    if (results.length > 0) {
      return results[0];
    }

    return null;
  }

  function searchSemanticNode(query: string, limit: number = 10): SemanticResult[] {
    const q = query.toLowerCase();
    const results: SemanticResult[] = [];

    for (const node of semantic.nodes.values()) {
      let relevance = 0;
      let matchType: 'exact' | 'keyword' | 'related' = 'keyword';

      // Exact concept match
      if (node.concept.includes(q)) {
        relevance = 1.0;
        matchType = 'exact';
      }
      // Keyword match
      else if (node.keywords.some((k) => k.includes(q))) {
        relevance = 0.7;
        matchType = 'keyword';
      }
      // Summary match
      else if (node.summary.toLowerCase().includes(q)) {
        relevance = 0.4;
        matchType = 'keyword';
      }
      // Related concept match
      else if (node.relatedConcepts.some((rc) => rc.includes(q))) {
        relevance = 0.3;
        matchType = 'related';
      }

      if (relevance > 0) {
        // Age decay: importance halves every 30 days
        const age = (now() - node.createdAt) / (24 * 3600 * 1000);
        const decayed = node.importance * Math.pow(0.5, age / 30);
        relevance = relevance * (0.5 + 0.5 * decayed);

        results.push({ node, relevance, matchType });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  function linkConceptsNode(sourceId: string, targetId: string, strength: number = 0.5): void {
    const source = semantic.nodes.get(sourceId);
    const target = semantic.nodes.get(targetId);

    if (!source || !target) return;

    if (!source.relatedConcepts.includes(targetId)) {
      source.relatedConcepts.push(targetId);
    }
    if (!target.relatedConcepts.includes(sourceId)) {
      target.relatedConcepts.push(sourceId);
    }

    source.strength = Math.max(source.strength, strength);
    target.strength = Math.max(target.strength, strength);
  }

  // ── Unified Search ─────────────────────────────────────────────────────────

  function searchAll(query: string) {
    const workingResults = searchByContent(working, query, 20);
    const episodicResults = searchEpisodic(episodic, query, 10);
    const semanticResults = searchSemanticNode(query, 10);

    return {
      working: workingResults,
      episodic: episodicResults,
      semantic: semanticResults,
    };
  }

  // ── Consolidation ─────────────────────────────────────────────────────────

  function consolidateEntries(highImportanceThreshold: number = 0.7): void {
    // Move high-value working entries to episodic
    const highValue = getHighValue(working, highImportanceThreshold);
    if (highValue.length > 0) {
      const blocks = archiveEntriesToEpisodic(highValue);
      consolidation.recordEntriesConsolidated(highValue.length);

      // Extract semantic nodes from important episodic blocks
      for (const block of blocks) {
        if (block.importance >= highImportanceThreshold) {
          const sampleContent = block.entries.slice(0, 3)
            .map((e) => e.content)
            .join(' ');
          const summary = block.summary || sampleContent.slice(0, 200);

          learnConceptNode(
            block.tags[0] || `episode_${block.id}`,
            summary,
            block.tags,
            block.importance,
          );

          // Link episodeIds to semantic node
          const nodeId = semantic.conceptIndex.get(block.tags[0] || `episode_${block.id}`);
          if (nodeId) {
            const node = semantic.nodes.get(nodeId);
            if (node) {
              node.episodeIds.push(block.id);
            }
          }
        }
      }
    }
  }

  // ── Export/Import ──────────────────────────────────────────────────────────

  function exportAllData(): string {
    const data = {
      version: 1,
      exportedAt: now(),
      working: JSON.parse(exportMemory(working)),
      episodic: JSON.parse(exportRecallIndex(episodic)),
      semantic: {
        nodes: Array.from(semantic.nodes.entries()),
        conceptIndex: Array.from(semantic.conceptIndex.entries()),
        keywordIndex: Array.from(semantic.keywordIndex.entries()).map(
          ([k, v]) => [k, Array.from(v)] as [string, string[]],
        ),
      },
    };
    return JSON.stringify(data, null, 2);
  }

  function importMemoryData(json: string): number {
    try {
      const data = JSON.parse(json);
      let count = 0;

      // Import working memory
      if (data.working && Array.isArray(data.working)) {
        const workingJson = JSON.stringify(data.working);
        count += importMemory(working, workingJson);
      }

      // Import episodic
      if (data.episodic) {
        const imported = importRecallIndex(JSON.stringify(data.episodic));
        if (imported && imported.success) {
          const idx = imported.index;
          // Merge blocks into episodic index
          for (const [id, block] of idx.blocks) {
            if (!episodic.blocks.has(id)) {
              episodic.blocks.set(id, block);
            }
          }
          for (const [day, ids] of idx.timeline) {
            if (!episodic.timeline.has(day)) {
              episodic.timeline.set(day, ids);
            }
          }
          for (const [tag, ids] of idx.tagIndex) {
            if (!episodic.tagIndex.has(tag)) {
              episodic.tagIndex.set(tag, new Set(ids));
            }
          }
        }
      }

      // Import semantic
      if (data.semantic) {
        if (data.semantic.nodes) {
          for (const [id, node] of data.semantic.nodes) {
            if (!semantic.nodes.has(id)) {
              semantic.nodes.set(id, node as SemanticNode);
            }
          }
        }
        if (data.semantic.conceptIndex) {
          for (const [concept, nodeId] of data.semantic.conceptIndex) {
            if (!semantic.conceptIndex.has(concept)) {
              semantic.conceptIndex.set(concept, nodeId as string);
            }
          }
        }
        if (data.semantic.keywordIndex) {
          for (const [kw, ids] of data.semantic.keywordIndex) {
            if (!semantic.keywordIndex.has(kw)) {
              semantic.keywordIndex.set(kw, new Set(ids as string[]));
            }
          }
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  function getAllStats() {
    const semNodes = Array.from(semantic.nodes.values());
    const semAvgImportance = semNodes.length > 0
      ? semNodes.reduce((s, n) => s + n.importance, 0) / semNodes.length
      : 0;
    const semAvgStrength = semNodes.length > 0
      ? semNodes.reduce((s, n) => s + n.strength, 0) / semNodes.length
      : 0;

    return {
      working: getStats(working),
      episodic: getRecallStats(episodic),
      semantic: {
        totalNodes: semNodes.length,
        avgImportance: semAvgImportance,
        avgStrength: semAvgStrength,
      },
    };
  }

  // ── Return Engine ──────────────────────────────────────────────────────────

  return {
    // Working
    memorize: memorizeEntry,
    recall: recallEntry,
    forget: forgetEntry,
    searchByTag: searchByTagEntry,
    getRecent: getRecentEntries,
    getHighValue: getHighValueEntries,

    // Episodic
    archiveToEpisodic: archiveEntriesToEpisodic,
    retrieveEpisodic: retrieveEpisodicBlock,
    retrieveByTimeRange: retrieveByTimeRangeEp,
    retrieveByTag: retrieveByTagEp,
    getRecentBlocks: getRecentEpBlocks,

    // Semantic
    learnConcept: learnConceptNode,
    recallConcept: recallConceptNode,
    searchSemantic: searchSemanticNode,
    linkConcepts: linkConceptsNode,

    // Unified
    search: searchAll,
    consolidate: consolidateEntries,
    getHealth: () => consolidation.getMemoryHealth(
      Array.from(working.entries.values()),
      Array.from(episodic.blocks.values())
    ),
    performDreamConsolidation(): ConsolidationResult {
      const blocks = Array.from(episodic.blocks.values());
      const result = consolidation.performReplay(blocks);

      // Remove pruned blocks from episodic
      for (const blockId of result.prunedBlocks) {
        episodic.blocks.delete(blockId);
      }

      return {
        replayStats: consolidation.getReplayStats(),
        healthReport: consolidation.getMemoryHealth(
          Array.from(working.entries.values()),
          Array.from(episodic.blocks.values())
        ),
        consolidatedEntries: result.strengthenedBlocks.length,
      };
    },
    exportAll: exportAllData,
    importMemory: importMemoryData,

    // Stats
    getStats: getAllStats,

    // Lifecycle
    boot() {
      const loaded = loadFromDisk();
      console.log(`[MemoryEngine] boot — three-tier memory ready${loaded > 0 ? ` (loaded ${loaded} entries)` : ''}`);
    },
    shutdown() {
      saveToDisk();
      working.entries.clear();
      working.accessOrder = [];
      episodic.blocks.clear();
      semantic.nodes.clear();
      console.log('[MemoryEngine] shutdown — saved + cleared');
    },
  };
}

// Re-export types for external use
export type { MemoryEntry } from './memory.js';
export type { EpisodicBlock } from './recall.js';
