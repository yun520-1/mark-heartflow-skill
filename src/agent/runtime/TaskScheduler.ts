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

'use strict';

import { TaskGraph, TaskNode, TaskNodeStatus, TopoResult } from './TaskGraph';

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
  maxConcurrency?: number;   // 最大并发任务数 (default: Infinity)
  checkpointInterval?: number; // 每 N 个任务后自动 checkpoint (default: 5)
  autoStart?: boolean;        // 创建后自动开始 (default: true)
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
  errors: Array<{ nodeId: string; error: string }>;
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
export class TaskScheduler {
  private graph: TaskGraph;
  private executor: TaskExecutor;
  private events: SchedulerEvents;
  private maxConcurrency: number;
  private checkpointInterval: number;

  private _status: SchedulerStatus = 'idle';
  private _paused = false;
  private _stopped = false;
  private _reentrant = false;
  private _runningTasks = new Set<string>();
  private _pendingTasks: string[] = [];
  private _errors: Array<{ nodeId: string; error: string }> = [];
  private _startTime = 0;
  private _tasksSinceCheckpoint = 0;

  constructor(options: TaskSchedulerOptions) {
    this.graph = options.graph;
    this.executor = options.executor;
    this.events = options.events ?? {};
    this.maxConcurrency = options.maxConcurrency ?? Infinity;
    this.checkpointInterval = options.checkpointInterval ?? 5;
    this._pendingTasks = [];

    if (options.autoStart !== false) {
      // Defer start to next tick
      try { this._autoStart(); } catch (err) { console.error('[Scheduler]', err); }
    }
  }

  private async _autoStart(): Promise<void> {
    // Check for cycles before starting
    const cycle = this.graph.detectCycle();
    if (cycle.hasCycle) {
      this._status = 'failed';
      return;
    }
    // No cycle — begin execution; wrap to prevent unhandled promise rejection
    try {
      await this.run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Scheduler] run() failed:', msg);
      this._status = 'failed';
    }
  }

  // ─── 控制方法 ─────────────────────────────────────────────

  /**
   * 开始执行 (或从暂停恢复)
   */
  async run(): Promise<SchedulerResult> {
    if (this._status === 'completed' || this._status === 'failed' || this._status === 'stopped') {
      throw new Error(`Scheduler cannot run from status: ${this._status}`);
    }

    this._status = 'running';
    this._startTime = this._startTime || Date.now();
    this._paused = false;
    this._stopped = false;

    // 获取执行层级
    let layers: string[][];
    try {
      layers = this.graph.getExecutionLayers();
    } catch (e) {
      this._status = 'failed';
      const err = e as Error;
      return this._buildResult(err);
    }

    // 按层级执行
    for (const layer of layers) {
      if (this._stopped) break;
      while (this._paused) {
        await this._sleep(100);
        if (this._stopped || (this._status as string) !== 'paused') break;
      }

      // 暂停后检查是否停止或不再是 paused 状态
      if (this._stopped || (this._status as string) !== 'paused') continue;

      // 等待该层所有任务完成
      await this._executeLayer(layer);

      // 检查是否全失败
      if (this._errors.length > 0) {
        const failedNode = this._errors[0].nodeId;
        const err = new Error(`Graph failed at node: ${failedNode}`);
        await this._emit('onGraphFail', this.graph, failedNode, err);
        this._status = 'failed';
        return this._buildResult(err);
      }
    }

    if (!this._stopped) {
      this._status = 'completed';
      await this._emit('onGraphComplete', this.graph);
    }

    return this._buildResult();
  }

  /**
   * 暂停调度 (暂停新任务启动，等待运行中任务完成)
   */
  pause(): void {
    if (this._status !== 'running') return;
    this._paused = true;
    this._status = 'paused';
  }

  /**
   * 恢复调度
   */
  async resume(): Promise<void> {
    if (this._reentrant) {
      console.warn('[TaskScheduler] resume re-entrant call blocked');
      return;
    }
    if (this._status !== 'paused') return;
    this._paused = false;
    this._status = 'running';
    this._reentrant = true;
    try {
      await this.run();
    } finally {
      this._reentrant = false;
    }
  }

  /**
   * 停止调度
   */
  stop(): void {
    this._stopped = true;
    this._status = 'stopped';
  }

  /**
   * 等待指定节点完成
   */
  async waitForNode(nodeId: string, timeoutMs = 60000): Promise<TaskNode | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const node = this.graph.getNode(nodeId);
      if (!node) return null;
      if (node.status === 'completed' || node.status === 'failed' || node.status === 'skipped') {
        return node;
      }
      await this._sleep(50);
    }
    return null;
  }

  // ─── 执行逻辑 ─────────────────────────────────────────────

  private async _executeLayer(layer: string[]): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const nodeId of layer) {
      const node = this.graph.getNode(nodeId);
      if (!node) continue;

      // 检查是否应跳过
      if (node.status === 'skipped') {
        await this._emit('onTaskSkip', node, 'Upstream failure', this.graph);
        continue;
      }

      if (node.status === 'completed') {
        // 已完成，直接跳过
        continue;
      }

      // 限流: 等待槽位
      if (this._runningTasks.size >= this.maxConcurrency) {
        await this._waitForSlot();
      }

      // 启动任务
      const promise = this._executeTask(node);
      promises.push(promise);
    }

    // 等待所有任务完成
    await Promise.all(promises);
  }

  private async _executeTask(node: TaskNode): Promise<void> {
    this._runningTasks.add(node.id);
    this.graph.updateNodeStatus(node.id, 'running');

    try {
      await this._emit('onTaskStart', node, this.graph);

      const result = await this.executor(node, this.graph);

      this.graph.updateNodeStatus(node.id, 'completed', result);
      await this._emit('onTaskComplete', node, result, this.graph);

    } catch (err) {
      const error = err as Error;

      // 检查是否可重试
      if (node.retries < node.maxRetries) {
        const retried = this.graph.retryNode(node.id);
        if (retried) {
          // 重试
          await this._sleep(Math.pow(2, node.retries) * 100); // 指数退避
          return this._executeTask(this.graph.getNode(node.id)!);
        }
      }

      this.graph.updateNodeStatus(node.id, 'failed', undefined, error.message);
      this._errors.push({ nodeId: node.id, error: error.message });
      await this._emit('onTaskFail', node, error, this.graph);
    } finally {
      this._runningTasks.delete(node.id);
      this._tasksSinceCheckpoint++;

      // 自动 checkpoint
      if (this._tasksSinceCheckpoint >= this.checkpointInterval) {
        await this._autoCheckpoint();
      }
    }
  }

  private async _waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (this._runningTasks.size < this.maxConcurrency || this._stopped) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  private async _autoCheckpoint(): Promise<void> {
    try {
      await this.graph.checkpoint();
      await this._emit('onCheckpoint', this.graph);
      this._tasksSinceCheckpoint = 0; // reset only on success
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this._errors.push({ nodeId: '<checkpoint>', error: `checkpoint failed: ${msg}` });
      console.warn('[TaskScheduler] checkpoint failed:', msg);
    }
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async _emit<K extends keyof SchedulerEvents>(
    event: K,
    ...args: Parameters<NonNullable<SchedulerEvents[K]>>
  ): Promise<void> {
    const handler = this.events[event];
    if (handler) {
      const result = (handler as Function)(...args as any[]);
      if (result instanceof Promise) await result;
    }
  }

  private _buildResult(fatalError?: Error): SchedulerResult {
    const nodes = this.graph.getNodes();
    return {
      success: !fatalError && this._errors.length === 0,
      completedCount: nodes.filter(n => n.status === 'completed').length,
      failedCount: nodes.filter(n => n.status === 'failed').length,
      skippedCount: nodes.filter(n => n.status === 'skipped').length,
      totalCount: nodes.length,
      durationMs: Date.now() - this._startTime,
      errors: [...this._errors],
    };
  }

  // ─── 查询 ─────────────────────────────────────────────

  getStatus(): SchedulerStatus { return this._status; }
  isPaused(): boolean { return this._paused; }
  isStopped(): boolean { return this._stopped; }
  getGraph(): TaskGraph { return this.graph; }
  getErrors(): Array<{ nodeId: string; error: string }> { return [...this._errors]; }
  getRunningCount(): number { return this._runningTasks.size; }
}

export default TaskScheduler;
