/**
 * CheckpointEngine — 心流检查点持久化引擎
 * @version v0.12.50
 *
 * 提供 save/load/cleanup 三个核心方法：
 * - save()   : 将状态快照写入 ~/.hermes/heartflow/checkpoints/<timestamp>.json
 * - load()   : 从指定 ID 或最新快照恢复状态
 * - cleanup(): 保留最新 N 个快照，删除其余
 *
 * 快照命名: checkpoint-<unix_ms>.json
 * 元数据  : checkpoint-meta.json (索引 + 版本)
 */
declare const CHECKPOINT_DIR: string;
declare const MAX_KEEP = 10;
interface CheckpointMeta {
    version: string;
    lastSavedAt: string | null;
    totalSnapshots: number;
    snapshots: CheckpointEntry[];
}
interface CheckpointEntry {
    id: string;
    filename: string;
    savedAt: string;
    sizeBytes: number;
    label?: string;
}
interface SaveResult {
    success: boolean;
    id?: string;
    filename?: string;
    savedAt?: string;
    error?: string;
}
interface LoadResult {
    success: boolean;
    data?: object;
    id?: string;
    error?: string;
}
interface CleanupResult {
    success: boolean;
    deleted: string[];
    kept: number;
    error?: string;
}
interface ListResult {
    success: boolean;
    snapshots: CheckpointEntry[];
    error?: string;
}
/**
 * CheckpointEngine
 *
 * 管理 HeartFlow 状态快照的持久化。
 * 快照以 JSON 格式写入 ~/.hermes/heartflow/checkpoints/，
 * 自动保留最新 10 个，cleanup() 删除更旧的。
 */
export declare class CheckpointEngine {
    private dir;
    private maxKeep;
    constructor(opts?: {
        dir?: string;
        maxKeep?: number;
    });
    private ensureDir;
    private metaPath;
    private snapshotPath;
    private loadMeta;
    private saveMeta;
    private sortByIdDesc;
    /**
     * save — 保存一个状态快照
     *
     * @param data      要持久化的状态对象
     * @param label     可选标签，如 'pre-upgrade'
     * @returns SaveResult
     */
    save(data: object, label?: string): SaveResult;
    /**
     * load — 恢复一个快照
     *
     * @param id     快照 ID（unix ms），或传入 'latest' / undefined 加载最新
     * @returns LoadResult
     */
    load(id?: string): LoadResult;
    /**
     * cleanup — 删除旧快照，保留最新 N 个
     *
     * @param keep  保留数量，默认 this.maxKeep (=10)
     * @returns CleanupResult
     */
    cleanup(keep?: number): CleanupResult;
    /**
     * list — 列出所有快照（最新在前）
     */
    list(): ListResult;
    /**
     * getStats — 统计信息
     */
    getStats(): {
        dir: string;
        totalSnapshots: number;
        maxKeep: number;
        lastSavedAt: string;
    };
}
export { CHECKPOINT_DIR, MAX_KEEP };
export type { CheckpointMeta, CheckpointEntry, SaveResult, LoadResult, CleanupResult, ListResult };
//# sourceMappingURL=CheckpointEngine.d.ts.map