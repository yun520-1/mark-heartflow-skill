/**
 * TaskGraph — DAG (Directed Acyclic Graph) 任务图
 * @version v0.1.0
 *
 * 实现：
 *   - 节点: TaskNode { id, label, payload, status, deps, createdAt }
 *   - 边: 依赖关系 (must run after)
 *   - 拓扑排序: Kahn's algorithm
 *   - 环检测: DFS coloring
 *   - 状态持久化: toJSON() / fromJSON()
 */
import { CheckpointEngine } from '../../storage/checkpoint/CheckpointEngine';
/** 任务节点状态 */
export type TaskNodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';
/** 单个任务节点 */
export interface TaskNode {
    id: string;
    label: string;
    payload: unknown;
    status: TaskNodeStatus;
    deps: string[];
    result?: unknown;
    error?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    retries: number;
    maxRetries: number;
    tags?: string[];
}
/** 任务图完整状态 */
export interface TaskGraphState {
    id: string;
    name: string;
    nodes: Record<string, TaskNode>;
    createdAt: number;
    updatedAt: number;
    status: 'running' | 'completed' | 'failed' | 'aborted';
}
/** Kahn's algorithm 拓扑排序结果 */
export interface TopoResult {
    order: string[];
    hasCycle: boolean;
    cycleNodes?: string[];
}
/** TaskGraph 配置 */
export interface TaskGraphOptions {
    id?: string;
    name?: string;
    maxRetries?: number;
    checkpointEngine?: CheckpointEngine;
}
/**
 * TaskGraph — 任务有向无环图
 *
 * 使用示例:
 *   const graph = new TaskGraph({ name: 'data-pipeline' });
 *   graph.addNode('fetch', { label: '获取数据' }, ['clean']);
 *   graph.addNode('clean', { label: '清洗数据' });
 *   graph.build();
 *   const order = graph.getTopologicalOrder(); // ['clean', 'fetch']
 */
export declare class TaskGraph {
    readonly id: string;
    readonly name: string;
    readonly maxRetries: number;
    private checkpointEngine?;
    private _nodes;
    private _adjList;
    private _inDegree;
    private _status;
    private _createdAt;
    private _updatedAt;
    private _dirty;
    constructor(options?: TaskGraphOptions);
    /**
     * 添加任务节点
     * @param id 唯一标识
     * @param label 显示名称
     * @param payload 任务输入
     * @param deps 依赖的节点 ID (这些节点必须先完成)
     */
    addNode(id: string, label: string, payload: unknown, deps?: string[]): this;
    /**
     * 批量添加节点
     */
    addNodes(nodes: Array<{
        id: string;
        label: string;
        payload: unknown;
        deps?: string[];
    }>): this;
    /**
     * 获取节点
     */
    getNode(id: string): TaskNode | undefined;
    /**
     * 获取所有节点
     */
    getNodes(): TaskNode[];
    /**
     * 获取所有就绪节点 (所有依赖已完成，状态为 ready)
     */
    getReadyNodes(): TaskNode[];
    /**
     * Kahn's algorithm 拓扑排序
     * 返回可以并行执行的层级
     */
    getTopologicalOrder(): TopoResult;
    /**
     * 按层级分组 (同一层可并行)
     * 返回数组，每层包含可并行执行的节点 ID
     */
    getExecutionLayers(): string[][];
    /**
     * 环检测 (DFS 三色标记)
     */
    detectCycle(): {
        hasCycle: boolean;
        cycleNodes?: string[];
    };
    /**
     * 更新节点状态
     */
    updateNodeStatus(id: string, status: TaskNodeStatus, result?: unknown, error?: string): void;
    /**
     * 重试节点
     */
    retryNode(id: string): boolean;
    private _propagateFailure;
    private _markDirty;
    /**
     * 保存状态到检查点引擎
     */
    checkpoint(): Promise<{
        success: boolean;
        id?: string;
        error?: string;
    }>;
    /**
     * 从检查点恢复
     */
    static fromCheckpoint(engine: CheckpointEngine, graphId: string, options?: Partial<TaskGraphOptions>): Promise<TaskGraph | null>;
    /**
     * 序列化为 JSON
     */
    toJSON(): TaskGraphState;
    /**
     * 从 JSON 恢复
     */
    static fromJSON(data: TaskGraphState, options?: Partial<TaskGraphOptions>): TaskGraph;
    isDirty(): boolean;
    markClean(): void;
    getStatus(): TaskGraphState['status'];
    getUpdatedAt(): number;
    /**
     * 获取图的大致大小
     */
    size(): number;
    /**
     * 打印拓扑顺序 (调试用)
     */
    printOrder(): string;
    /**
     * 打印状态摘要
     */
    toSummaryString(): string;
}
export default TaskGraph;
//# sourceMappingURL=TaskGraph.d.ts.map