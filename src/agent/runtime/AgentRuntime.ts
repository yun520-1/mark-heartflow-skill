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

'use strict';

import { TaskGraph, TaskNode, TaskGraphState } from './TaskGraph';
import { TaskScheduler, SchedulerResult, SchedulerEvents, TaskExecutor } from './TaskScheduler';
import { CheckpointEngine } from '../../storage/checkpoint/CheckpointEngine';

/** Agent 事件类型 */
export type AgentEventType =
  | 'task_start' | 'task_complete' | 'task_fail' | 'task_skip'
  | 'graph_start' | 'graph_complete' | 'graph_fail'
  | 'scheduler_pause' | 'scheduler_resume' | 'scheduler_stop'
  | 'checkpoint_save' | 'heartbeat'
  | 'error';

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
  heartbeatInterval?: number;  // 心跳间隔 ms (default: 30000)
  autoCheckpoint?: boolean;    // 默认开启 checkpoint
}

/** Agent 状态 */
export interface AgentRuntimeState {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  activeGraphs: string[];       // 当前活跃的图 ID
  completedGraphs: string[];    // 已完成的图 ID
  failedGraphs: string[];       // 失败的图 ID
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
export class AgentRuntime {
  readonly id: string;
  readonly name: string;

  private checkpointEngine?: CheckpointEngine;
  private heartbeatInterval: number;
  private autoCheckpoint: boolean;

  private _graphs: Map<string, TaskGraph> = new Map();
  private _schedulers: Map<string, TaskScheduler> = new Map();
  private _listeners: Map<AgentEventType, Set<AgentEventListener>> = new Map();

  private _status: AgentRuntimeState['status'] = 'idle';
  private _uptimeStartedAt = Date.now();
  private _lastHeartbeat = Date.now();
  private _heartbeatTimer?: NodeJS.Timeout;
  private _totalTasksProcessed = 0;

  constructor(options: AgentRuntimeOptions = {}) {
    this.id = options.id ?? `agent-${Date.now()}`;
    this.name = options.name ?? 'AgentRuntime';
    this.checkpointEngine = options.checkpointEngine;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
    this.autoCheckpoint = options.autoCheckpoint ?? true;
  }

  // ─── 事件总线 ─────────────────────────────────────────────

  /**
   * 注册事件监听器
   */
  on(type: AgentEventType, listener: AgentEventListener): () => void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);

    // 返回取消订阅函数
    return () => {
      this._listeners.get(type)?.delete(listener);
    };
  }

  /**
   * 触发事件
   */
  private async _emit(event: AgentEvent): Promise<void> {
    const promises: Promise<void>[] = [];
    const listeners = this._listeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        const result = listener(event);
        if (result instanceof Promise) promises.push(result);
      }
    }

    // 同时触发通配符监听器
    const wildcard = this._listeners.get('*' as AgentEventType);
    if (wildcard) {
      for (const listener of wildcard) {
        const result = listener(event);
        if (result instanceof Promise) promises.push(result);
      }
    }
    await Promise.all(promises);
  }

  private _newEvent(type: AgentEventType, payload: unknown, graphId?: string, nodeId?: string): AgentEvent {
    return { type, timestamp: Date.now(), payload, graphId, nodeId };
  }

  // ─── 心跳 ─────────────────────────────────────────────

  /**
   * 启动心跳
   */
  startHeartbeat(): void {
    if (this._heartbeatTimer) return;
    this._heartbeatTimer = setInterval(() => {
      this._lastHeartbeat = Date.now();
      this._emit(this._newEvent('heartbeat', {
        uptime: this._lastHeartbeat - this._uptimeStartedAt,
        activeGraphs: this._graphs.size,
        totalTasks: this._totalTasksProcessed,
        status: this._status,
      }));
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = undefined;
    }
  }

  // ─── 工作流注册 ─────────────────────────────────────────────

  /**
   * 注册工作流定义 (但不立即执行)
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    const graph = new TaskGraph({
      id: workflow.id,
      name: workflow.name,
      checkpointEngine: this.checkpointEngine,
    });

    graph.addNodes(workflow.nodes);
    this._graphs.set(workflow.id, graph);
  }

  /**
   * 预定义工作流 (快捷方法)
   */
  static createSequentialWorkflow(
    id: string,
    name: string,
    nodes: Array<{ id: string; label: string; payload: unknown }>
  ): WorkflowDefinition {
    // 顺序执行: 每个节点依赖前一个
    return {
      id,
      name,
      nodes: nodes.map((n, i) => ({
        id: n.id,
        label: n.label,
        payload: n.payload,
        deps: i > 0 ? [nodes[i - 1].id] : [],
      })),
    };
  }

  static createParallelWorkflow(
    id: string,
    name: string,
    nodes: Array<{ id: string; label: string; payload: unknown }>
  ): WorkflowDefinition {
    // 完全并行: 所有节点无依赖
    return {
      id,
      name,
      nodes: nodes.map(n => ({ id: n.id, label: n.label, payload: n.payload, deps: [] })),
    };
  }

  static createDAGWorkflow(
    id: string,
    name: string,
    nodes: Array<{ id: string; label: string; payload: unknown; deps?: string[] }>
  ): WorkflowDefinition {
    return { id, name, nodes };
  }

  // ─── 执行 ─────────────────────────────────────────────

  /**
   * 执行指定工作流
   */
  async execute(
    workflowId: string,
    executor: TaskExecutor,
    options?: {
      maxConcurrency?: number;
      checkpointInterval?: number;
      autoStart?: boolean;
    }
  ): Promise<SchedulerResult> {
    const graph = this._graphs.get(workflowId);
    if (!graph) {
      throw new Error(`Workflow "${workflowId}" not found`);
    }

    // 检查循环
    const cycle = graph.detectCycle();
    if (cycle.hasCycle) {
      throw new Error(`Workflow "${workflowId}" has cycle: ${cycle.cycleNodes?.join(' → ')}`);
    }

    this._status = 'running';
    await this._emit(this._newEvent('graph_start', { workflowId }, workflowId));
    this.startHeartbeat();

    const schedulerEvents: SchedulerEvents = {
      onTaskStart: async (node) => {
        this._emit(this._newEvent('task_start', { nodeId: node.id }, workflowId, node.id));
      },
      onTaskComplete: async (node, result) => {
        this._totalTasksProcessed++;
        this._emit(this._newEvent('task_complete', { nodeId: node.id, result }, workflowId, node.id));
      },
      onTaskFail: async (node, error) => {
        this._emit(this._newEvent('task_fail', { nodeId: node.id, error: error.message }, workflowId, node.id));
      },
      onTaskSkip: async (node, reason) => {
        this._emit(this._newEvent('task_skip', { nodeId: node.id, reason }, workflowId, node.id));
      },
      onGraphComplete: async () => {
        this._status = 'idle';
        this._emit(this._newEvent('graph_complete', { workflowId }, workflowId));
      },
      onGraphFail: async (_, failedNodeId) => {
        this._status = 'idle';
        this._emit(this._newEvent('graph_fail', { workflowId, failedNodeId }, workflowId));
      },
      onCheckpoint: async () => {
        this._emit(this._newEvent('checkpoint_save', { workflowId }, workflowId));
      },
    };

    const scheduler = new TaskScheduler({
      graph,
      executor,
      events: schedulerEvents,
      maxConcurrency: options?.maxConcurrency ?? Infinity,
      checkpointInterval: options?.checkpointInterval ?? 5,
      autoStart: options?.autoStart ?? true,
    });

    this._schedulers.set(workflowId, scheduler);
    const result = await scheduler.run();
    return result;
  }

  /**
   * 执行并等待完成
   */
  async executeAndWait(
    workflowId: string,
    executor: TaskExecutor,
    options?: Parameters<typeof this.execute>[2]
  ): Promise<SchedulerResult> {
    return this.execute(workflowId, executor, { ...options, autoStart: true });
  }

  // ─── 控制 ─────────────────────────────────────────────

  /**
   * 暂停工作流
   */
  pause(workflowId: string): void {
    const scheduler = this._schedulers.get(workflowId);
    if (!scheduler) throw new Error(`Scheduler "${workflowId}" not found`);
    scheduler.pause();
    this._status = 'paused';
    this._emit(this._newEvent('scheduler_pause', { workflowId }, workflowId));
  }

  /**
   * 恢复工作流
   */
  async resume(workflowId: string): Promise<void> {
    const scheduler = this._schedulers.get(workflowId);
    if (!scheduler) throw new Error(`Scheduler "${workflowId}" not found`);
    this._status = 'running';
    this._emit(this._newEvent('scheduler_resume', { workflowId }, workflowId));
    await scheduler.resume();
  }

  /**
   * 停止工作流
   */
  stop(workflowId: string): void {
    const scheduler = this._schedulers.get(workflowId);
    if (!scheduler) throw new Error(`Scheduler "${workflowId}" not found`);
    scheduler.stop();
    this._status = 'stopped';
    this._emit(this._newEvent('scheduler_stop', { workflowId }, workflowId));
  }

  /**
   * 停止所有工作流
   */
  stopAll(): void {
    for (const [id] of this._schedulers) {
      this.stop(id);
    }
  }

  // ─── 查询 ─────────────────────────────────────────────

  /**
   * 获取工作流图
   */
  getGraph(workflowId: string): TaskGraph | undefined {
    return this._graphs.get(workflowId);
  }

  /**
   * 获取所有工作流
   */
  getAllGraphs(): Array<{ id: string; name: string; graph: TaskGraph }> {
    return Array.from(this._graphs.entries()).map(([id, graph]) => ({
      id,
      name: graph.name,
      graph,
    }));
  }

  /**
   * 获取调度器
   */
  getScheduler(workflowId: string): TaskScheduler | undefined {
    return this._schedulers.get(workflowId);
  }

  /**
   * 获取状态
   */
  getStatus(): AgentRuntimeState {
    return {
      id: this.id,
      name: this.name,
      status: this._status,
      activeGraphs: Array.from(this._graphs.values()).map(g => g.id),
      completedGraphs: Array.from(this._graphs.values())
        .filter(g => g.getStatus() === 'completed')
        .map(g => g.id),
      failedGraphs: Array.from(this._graphs.values())
        .filter(g => g.getStatus() === 'failed')
        .map(g => g.id),
      totalTasksProcessed: this._totalTasksProcessed,
      uptimeStartedAt: this._uptimeStartedAt,
      lastHeartbeat: this._lastHeartbeat,
    };
  }

  // ─── 持久化 ─────────────────────────────────────────────

  /**
   * 保存完整运行时状态
   */
  async saveState(): Promise<{ success: boolean; error?: string }> {
    if (!this.checkpointEngine) {
      return { success: false, error: 'No checkpoint engine' };
    }

    const state: AgentRuntimeState = this.getStatus();
    return this.checkpointEngine.save(state, `agent-runtime-${this.id}`);
  }

  /**
   * 加载运行时状态
   */
  static async loadState(
    engine: CheckpointEngine,
    runtimeId: string,
    options?: Partial<AgentRuntimeOptions>
  ): Promise<AgentRuntime | null> {
    const result = engine.load(`agent-runtime-${runtimeId}`);
    if (!result.success || !result.data) return null;

    const state = result.data as AgentRuntimeState;
    const runtime = new AgentRuntime({ id: state.id, name: state.name, ...options });
    runtime._status = state.status;
    runtime._totalTasksProcessed = state.totalTasksProcessed;
    runtime._uptimeStartedAt = state.uptimeStartedAt;
    runtime._lastHeartbeat = state.lastHeartbeat;

    return runtime;
  }

  /**
   * 关闭运行时 (清理资源)
   */
  shutdown(): void {
    this.stopAll();
    this.stopHeartbeat();
  }
}

export default AgentRuntime;
