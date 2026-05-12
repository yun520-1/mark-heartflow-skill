export interface VectorEntry {
    id: string;
    vector: number[];
    metadata: Record<string, unknown>;
}
export interface SearchResult {
    id: string;
    score: number;
    metadata: Record<string, unknown>;
}
export interface VectorStoreEngine {
    boot(): Promise<void>;
    add(id: string, vector: number[], metadata?: Record<string, unknown>): void;
    persist(): Promise<void>;
    search(query: number[], k?: number): SearchResult[];
    query(vector: number[], k?: number): SearchResult[];
    get(id: string): VectorEntry | undefined;
    remove(id: string): boolean;
    clear(): void;
    size(): number;
    shutdown(): Promise<void>;
}
export declare function createVectorStoreEngine(storeDir?: string): VectorStoreEngine;
//# sourceMappingURL=VectorStoreEngine.d.ts.map