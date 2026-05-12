/**
 * AgentRuntime — 主导入器 / 运行时编排器
 * @version v0.1.0
 *
 * 整合 TaskGraph + TaskScheduler，提供：
 *   - 统一的 Agent 任务编排
 *   - 多图管理 (多个并行工作流)
 *   - 事件总线 (agent-event)
 *   - 状态持久化与恢复
 *   - 心跳监控
 */
import { TaskGraph } from './TaskGraph';
import { TaskScheduler, SchedulerResult, TaskExecutor } from './TaskScheduler';
import { CheckpointEngine } from '../../storage/checkpoint/CheckpointEngine';
/** Agent 事件类型 */
export type AgentEventType = 'task_start' | 'task_complete' | 'task_fail' | 'task_skip' | 'graph_start' | 'graph_complete' | 'graph_fail' | 'scheduler_pause' | 'scheduler_resume' | 'scheduler_stop' | 'checkpoint_save' | 'heartbeat' | 'error';
/** Agent 事件 */
export interface AgentEvent {
    type: AgentEventType;
    timestamp: number;
    payload: unknown;
    graphId?: string;
    nodeId?: string;
}
/** Agent 事件监听器 */
export type AgentEventListener = (event: AgentEvent) => void | Promise<void>;
/** 工作流定义 */
export interface WorkflowDefinition {
    id: string;
    name: string;
    nodes: Array<{
        id: string;
        label: string;
        payload: unknown;
        deps?: string[];
        maxRetries?: number;
        tags?: string[];
    }>;
    config?: {
        maxConcurrency?: number;
        checkpointInterval?: number;
    };
}
/** Runtime 配置 */
export interface AgentRuntimeOptions {
    id?: string;
    name?: string;
    checkpointEngine?: CheckpointEngine;
    heartbeatInterval?: number;
    autoCheckpoint?: boolean;
}
/** Agent 状态 */
export interface AgentRuntimeState {
    id: string;
    name: string;
    status: 'idle' | 'running' | 'paused' | 'stopped';
    activeGraphs: string[];
    completedGraphs: string[];
    failedGraphs: string[];
    totalTasksProcessed: number;
    uptimeStartedAt: number;
    lastHeartbeat: number;
}
/**
 * AgentRuntime — 主导入器
 *
 * 使用示例:
 *   const runtime = new AgentRuntime({
 *     name: 'DataPipeline',
 *     checkpointEngine: new CheckpointEngine({ dir: '~/.hermes/heartflow/checkpoints' })
 *   });
 *
 *   // 注册工作流
 *   runtime.registerWorkflow({
 *     id: 'etl',
 *     name: 'ETL Pipeline',
 *     nodes: [
 *       { id: 'fetch', label: 'Fetch Data', payload: { url: '...' }, deps: ['transform'] },
 *       { id: 'transform', label: 'Transform', payload: { format: 'csv' } },
 *     ]
 *   });
 *
 *   // 监听事件
 *   runtime.on('task_complete', (e) => console.log('Task done:', e.nodeId));
 *
 *   // 执行工作流
 *   const result = await runtime.execute('etl', async (node) => {
 *     // 执行任务
 *     return { result: node.payload };
 *   });
 */
export declare class AgentRuntime {
    readonly id: string;
    readonly name: string;
    private checkpointEngine?;
    private heartbeatInterval;
    private autoCheckpoint;
    private _graphs;
    private _schedulers;
    private _listeners;
    private _status;
    private _uptimeStartedAt;
    private _lastHeartbeat;
    private _heartbeatTimer?;
    private _totalTasksProcessed;
    constructor(options?: AgentRuntimeOptions);
    /**
     * 注册事件监听器
     */
    on(type: AgentEventType, listener: AgentEventListener): () => void;
    /**
     * 触发事件
     */
    private _emit;
    private _newEvent;
    /**
     * 启动心跳
     */
    startHeartbeat(): void;
    /**
     * 停止心跳
     */
    stopHeartbeat(): void;
    /**
     * 注册工作流定义 (但不立即执行)
     */
    registerWorkflow(workflow: WorkflowDefinition): void;
    /**
     * 预定义工作流 (快捷方法)
     */
    static createSequentialWorkflow(id: string, name: string, nodes: Array<{
        id: string;
        label: string;
        payload: unknown;
    }>): WorkflowDefinition;
    static createParallelWorkflow(id: string, name: string, nodes: Array<{
        id: string;
        label: string;
        payload: unknown;
    }>): WorkflowDefinition;
    static createDAGWorkflow(id: string, name: string, nodes: Array<{
        id: string;
        label: string;
        payload: unknown;
        deps?: string[];
    }>): WorkflowDefinition;
    /**
     * 执行指定工作流
     */
    execute(workflowId: string, executor: TaskExecutor, options?: {
        maxConcurrency?: number;
        checkpointInterval?: number;
        autoStart?: boolean;
    }): Promise<SchedulerResult>;
    /**
     * 执行并等待完成
     */
    executeAndWait(workflowId: string, executor: TaskExecutor, options?: Parameters<typeof this.execute>[2]): Promise<SchedulerResult>;
    /**
     * 暂停工作流
     */
    pause(workflowId: string): void;
    /**
     * 恢复工作流
     */
    resume(workflowId: string): Promise<void>;
    /**
     * 停止工作流
     */
    stop(workflowId: string): void;
    /**
     * 停止所有工作流
     */
    stopAll(): void;
    /**
     * 获取工作流图
     */
    getGraph(workflowId: string): TaskGraph | undefined;
    /**
     * 获取所有工作流
     */
    getAllGraphs(): Array<{
        id: string;
        name: string;
        graph: TaskGraph;
    }>;
    /**
     * 获取调度器
     */
    getScheduler(workflowId: string): TaskScheduler | undefined;
    /**
     * 获取状态
     */
    getStatus(): AgentRuntimeState;
    /**
     * 保存完整运行时状态
     */
    saveState(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 加载运行时状态
     */
    static loadState(engine: CheckpointEngine, runtimeId: string, options?: Partial<AgentRuntimeOptions>): Promise<AgentRuntime | null>;
    /**
     * 关闭运行时 (清理资源)
     */
    shutdown(): void;
}
export default AgentRuntime;
//# sourceMappingURL=AgentRuntime.d.ts.map