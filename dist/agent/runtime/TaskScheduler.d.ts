/**
 * TaskScheduler — 任务调度器
 * @version v0.1.0
 *
 * 功能：
 *   - 按 DAG 拓扑顺序驱动任务执行
 *   - 支持并行层内任务并发
 *   - 事件驱动: onTaskComplete / onTaskFail / onGraphComplete
 *   - 自动检查点保存
 *   - 支持暂停/恢复
 */
import { TaskGraph, TaskNode } from './TaskGraph';
/** 任务执行器函数 */
export type TaskExecutor = (node: TaskNode, graph: TaskGraph) => Promise<unknown>;
/** 调度器事件 */
export interface SchedulerEvents {
    onTaskStart?: (node: TaskNode, graph: TaskGraph) => void | Promise<void>;
    onTaskComplete?: (node: TaskNode, result: unknown, graph: TaskGraph) => void | Promise<void>;
    onTaskFail?: (node: TaskNode, error: Error, graph: TaskGraph) => void | Promise<void>;
    onTaskSkip?: (node: TaskNode, reason: string, graph: TaskGraph) => void | Promise<void>;
    onGraphComplete?: (graph: TaskGraph) => void | Promise<void>;
    onGraphFail?: (graph: TaskGraph, failedNodeId: string, error: Error) => void | Promise<void>;
    onCheckpoint?: (graph: TaskGraph) => void | Promise<void>;
}
/** 调度器配置 */
export interface TaskSchedulerOptions {
    graph: TaskGraph;
    executor: TaskExecutor;
    events?: SchedulerEvents;
    maxConcurrency?: number;
    checkpointInterval?: number;
    autoStart?: boolean;
}
/** 调度器状态 */
export type SchedulerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';
/** 调度结果 */
export interface SchedulerResult {
    success: boolean;
    completedCount: number;
    failedCount: number;
    skippedCount: number;
    totalCount: number;
    durationMs: number;
    errors: Array<{
        nodeId: string;
        error: string;
    }>;
}
/**
 * TaskScheduler — DAG 任务调度器
 *
 * 使用示例:
 *   const scheduler = new TaskScheduler({
 *     graph,
 *     executor: async (node) => {
 *       console.log('Executing:', node.label);
 *       return { result: node.payload };
 *     },
 *     events: {
 *       onTaskComplete: (node) => console.log('Done:', node.label),
 *     }
 *   });
 *   const result = await scheduler.run();
 */
export declare class TaskScheduler {
    private graph;
    private executor;
    private events;
    private maxConcurrency;
    private checkpointInterval;
    private _status;
    private _paused;
    private _stopped;
    private _runningTasks;
    private _pendingTasks;
    private _errors;
    private _startTime;
    private _tasksSinceCheckpoint;
    constructor(options: TaskSchedulerOptions);
    private _autoStart;
    /**
     * 开始执行 (或从暂停恢复)
     */
    run(): Promise<SchedulerResult>;
    /**
     * 暂停调度 (暂停新任务启动，等待运行中任务完成)
     */
    pause(): void;
    /**
     * 恢复调度
     */
    resume(): Promise<void>;
    /**
     * 停止调度
     */
    stop(): void;
    /**
     * 等待指定节点完成
     */
    waitForNode(nodeId: string, timeoutMs?: number): Promise<TaskNode | null>;
    private _executeLayer;
    private _executeTask;
    private _waitForSlot;
    private _autoCheckpoint;
    private _sleep;
    private _emit;
    private _buildResult;
    getStatus(): SchedulerStatus;
    isPaused(): boolean;
    isStopped(): boolean;
    getGraph(): TaskGraph;
    getErrors(): Array<{
        nodeId: string;
        error: string;
    }>;
    getRunningCount(): number;
}
export default TaskScheduler;
//# sourceMappingURL=TaskScheduler.d.ts.map