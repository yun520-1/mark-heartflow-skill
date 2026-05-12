/**
 * engines.ts — HeartFlow 引擎面板
 * @version v0.12.50
 *
 * 提供引擎状态查询接口：
 *   - 记忆引擎 (Memory Engine)
 *   - 检查点引擎 (Checkpoint Engine)
 *   - 向量存储引擎 (Vector Store Engine)
 *   - 核心引擎 (Core Engine)
 *
 * 支持 --watch 实时监控模式（每 3 秒刷新一次）
 */
export interface EngineStatus {
    name: string;
    status: 'online' | 'offline' | 'error' | 'unknown';
    details: Record<string, any>;
    uptime?: string;
    memoryMB?: number;
    lastActivity?: string;
}
export interface PanelSnapshot {
    timestamp: string;
    hostname: string;
    platform: string;
    uptime: string;
    loadavg: number[];
    memory: {
        total: number;
        free: number;
        used: number;
        usedPercent: number;
    };
    engines: EngineStatus[];
    totalMemoryMB: number;
}
export declare function collectPanelSnapshot(): PanelSnapshot;
export declare function renderPanelTable(snapshot: PanelSnapshot): string;
export declare function watchPanel(intervalMs?: number, onUpdate?: (snap: PanelSnapshot) => void): Promise<() => void>;
//# sourceMappingURL=engines.d.ts.map