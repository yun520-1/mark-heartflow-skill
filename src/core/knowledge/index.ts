/**
 * Knowledge Graph Engine — TypeScript ESM wrapper over knowledge-graph.js (CommonJS)
 */

export interface KGEntity {
  name: string;
  entityType: string;
  mentionCount: number;
  lastMentioned: string;
  createdAt: string;
}

export interface KGEdge {
  source: string;
  target: string;
  relationType: string;
  confidence: number;
  factId: string | null;
  createdAt: string;
}

export interface KGStats {
  totalEntities: number;
  totalRelations: number;
  density: string;
  byType: Record<string, number>;
}

export interface KGTraversalResult {
  entity: string;
  depth: number;
  path: { entity: string; relation: string }[];
}

export interface KnowledgeGraphEngine {
  addEntity(opts: { name: string; entityType?: string; mentionCount?: number; lastMentioned?: string }): boolean;
  removeEntity(name: string): boolean;
  getEntity(name: string): KGEntity | null;
  getAllEntities(entityType?: string): KGEntity[];
  addRelation(opts: { source: string; target: string; relationType?: string; confidence?: number; factId?: string }): boolean;
  removeRelation(source: string, target: string): boolean;
  getRelation(source: string, target: string): KGEdge | null;
  getNeighbors(name: string, direction?: 'out' | 'in' | 'both'): { entity: string; relation: string; confidence: number; direction: string }[];
  bfs(startEntity: string, opts?: { maxDepth?: number; relationTypes?: string[] | null; direction?: 'out' | 'in' | 'both' }): KGTraversalResult[];
  findPath(source: string, target: string, maxDepth?: number): { entity: string; relation: string }[] | null;
  addFact(opts: { factId?: string; subject: string; predicate?: string; object: string; confidence?: number }): boolean;
  toJSON(entityFilter?: (n: KGEntity) => boolean): {
    nodes: { name: string; type: string; mentions: number; lastSeen: string }[];
    edges: { from: string; to: string; relation: string; confidence: number }[];
    stats: KGStats;
  };
  toNaturalLanguage(maxEntities?: number): string;
  stats(): KGStats;
}

interface KGInstance {
  addEntity(opts: { name: string; entityType?: string; mentionCount?: number; lastMentioned?: string }): boolean;
  removeEntity(name: string): boolean;
  getEntity(name: string): KGEntity | null;
  getAllEntities(entityType?: string): KGEntity[];
  addRelation(opts: { source: string; target: string; relationType?: string; confidence?: number; factId?: string }): boolean;
  removeRelation(source: string, target: string): boolean;
  getRelation(source: string, target: string): KGEdge | null;
  getNeighbors(name: string, direction?: 'out' | 'in' | 'both'): { entity: string; relation: string; confidence: number; direction: string }[];
  bfs(startEntity: string, opts?: { maxDepth?: number; relationTypes?: string[] | null; direction?: 'out' | 'in' | 'both' }): KGTraversalResult[];
  findPath(source: string, target: string, maxDepth?: number): { entity: string; relation: string }[] | null;
  addFact(opts: { factId?: string; subject: string; predicate?: string; object: string; confidence?: number }): boolean;
  toJSON(entityFilter?: (n: KGEntity) => boolean): {
    nodes: { name: string; type: string; mentions: number; lastSeen: string }[];
    edges: { from: string; to: string; relation: string; confidence: number }[];
    stats: KGStats;
  };
  toNaturalLanguage(maxEntities?: number): string;
  stats(): KGStats;
}

export async function createKnowledgeGraphEngine(options?: { dataDir?: string }): Promise<KnowledgeGraphEngine> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('./knowledge-graph.js') as any;
  const KnowledgeGraph = mod.KnowledgeGraph;
  const instance = new KnowledgeGraph(options) as unknown as KGInstance;

  return instance; // Already matches KnowledgeGraphEngine interface
}
