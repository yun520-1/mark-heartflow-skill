export interface Checkpoint {
    id: string;
    timestamp: number;
    version: string;
    data: Record<string, unknown>;
    metadata: Record<string, unknown>;
}
export interface CheckpointEngine {
    boot(): void;
    save(key: string, data: Record<string, unknown>): string;
    load(key: string): Checkpoint | null;
    list(): Checkpoint[];
    prune(maxCheckpoints?: number): number;
    getLatest(key: string): Checkpoint | null;
    shutdown(): void;
}
export declare function createCheckpointEngine(version?: string): CheckpointEngine;
//# sourceMappingURL=checkpoint.d.ts.map