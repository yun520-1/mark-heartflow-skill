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

'use strict';

import { CheckpointEngine } from '../../storage/checkpoint/CheckpointEngine';

/** 任务节点状态 */
export type TaskNodeStatus = 
  | 'pending'    // 等待调度
  | 'ready'      // 所有依赖已完成
  | 'running'    // 执行中
  | 'completed'  // 成功完成
  | 'failed'     // 执行失败
  | 'skipped';   // 被跳过 (因前置失败)

/** 单个任务节点 */
export interface TaskNode {
  id: string;
  label: string;
  payload: unknown;           // 任务输入数据
  status: TaskNodeStatus;
  deps: string[];             // 依赖的节点 ID 列表
  result?: unknown;           // 任务执行结果
  error?: string;             // 错误信息
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retries: number;            // 已重试次数
  maxRetries: number;         // 最大重试次数
  tags?: string[];            // 可选标签
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
  order: string[];     // 节点 ID 顺序
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
export class TaskGraph {
  readonly id: string;
  readonly name: string;
  readonly maxRetries: number;
  private checkpointEngine?: CheckpointEngine;
  
  private _nodes: Map<string, TaskNode> = new Map();
  private _adjList: Map<string, Set<string>> = new Map(); // node -> its dependents
  private _inDegree: Map<string, number> = new Map();
  
  private _status: TaskGraphState['status'] = 'running';
  private _createdAt: number;
  private _updatedAt: number;
  private _dirty = false; // 是否需要持久化

  constructor(options: TaskGraphOptions = {}) {
    this.id = options.id ?? `graph-${Date.now()}`;
    this.name = options.name ?? 'UntitledGraph';
    this.maxRetries = options.maxRetries ?? 3;
    this.checkpointEngine = options.checkpointEngine;
    this._createdAt = Date.now();
    this._updatedAt = this._createdAt;
  }

  // ─── 节点管理 ─────────────────────────────────────────────

  /**
   * 添加任务节点
   * @param id 唯一标识
   * @param label 显示名称
   * @param payload 任务输入
   * @param deps 依赖的节点 ID (这些节点必须先完成)
   */
  addNode(id: string, label: string, payload: unknown, deps: string[] = []): this {
    if (this._nodes.has(id)) {
      throw new Error(`Node "${id}" already exists in graph`);
    }

    const node: TaskNode = {
      id,
      label,
      payload,
      status: 'pending',
      deps,
      createdAt: Date.now(),
      retries: 0,
      maxRetries: this.maxRetries,
    };

    this._nodes.set(id, node);
    
    // 初始化入度和邻接表条目
    if (!this._inDegree.has(id)) this._inDegree.set(id, 0);
    if (!this._adjList.has(id)) this._adjList.set(id, new Set());

    // 添加依赖关系
    for (const depId of deps) {
      if (!this._nodes.has(depId) && !this._adjList.has(depId)) {
        // 前置依赖节点还不存在，先记录
        if (!this._inDegree.has(depId)) this._inDegree.set(depId, 0);
        if (!this._adjList.has(depId)) this._adjList.set(depId, new Set());
      }
      // 增加入度 (depId 完成是 id 开始的必要条件)
      this._inDegree.set(id, (this._inDegree.get(id) ?? 0) + 1);
      // 记录: depId 的完成会解锁 id
      this._adjList.get(depId)?.add(id);
    }

    this._markDirty();
    return this;
  }

  /**
   * 批量添加节点
   */
  addNodes(nodes: Array<{ id: string; label: string; payload: unknown; deps?: string[] }>): this {
    for (const n of nodes) {
      this.addNode(n.id, n.label, n.payload, n.deps ?? []);
    }
    return this;
  }

  /**
   * 获取节点
   */
  getNode(id: string): TaskNode | undefined {
    return this._nodes.get(id);
  }

  /**
   * 获取所有节点
   */
  getNodes(): TaskNode[] {
    return Array.from(this._nodes.values());
  }

  /**
   * 获取所有就绪节点 (所有依赖已完成，状态为 ready)
   */
  getReadyNodes(): TaskNode[] {
    return this.getNodes().filter(n => {
      if (n.status !== 'pending') return false;
      return n.deps.every(depId => {
        const dep = this._nodes.get(depId);
        return dep?.status === 'completed' || dep?.status === 'skipped';
      });
    });
  }

  // ─── 拓扑排序 ─────────────────────────────────────────────

  /**
   * Kahn's algorithm 拓扑排序
   * 返回可以并行执行的层级
   */
  getTopologicalOrder(): TopoResult {
    const order: string[] = [];
    const inDegree = new Map(this._inDegree);
    const queue: string[] = [];

    // 入度为 0 的节点可以首先执行
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    let hasCycle = false;
    const visited = new Set<string>();

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      order.push(id);

      const dependents = this._adjList.get(id) ?? new Set();
      for (const depId of dependents) {
        const newDegree = (inDegree.get(depId) ?? 1) - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) queue.push(depId);
      }
    }

    // 检测环: 还有未访问的节点说明有环
    if (visited.size !== this._nodes.size) {
      hasCycle = true;
      const cycleNodes = Array.from(this._nodes.keys()).filter(id => !visited.has(id));
      return { order, hasCycle, cycleNodes };
    }

    return { order, hasCycle: false };
  }

  /**
   * 按层级分组 (同一层可并行)
   * 返回数组，每层包含可并行执行的节点 ID
   */
  getExecutionLayers(): string[][] {
    const layers: string[][] = [];
    const completed = new Set<string>();
    const inDegree = new Map(this._inDegree);

    while (completed.size < this._nodes.size) {
      const layer: string[] = [];

      for (const [id, degree] of inDegree) {
        if (degree === 0 && !completed.has(id)) {
          layer.push(id);
        }
      }

      // Cycle detected: no nodes with in-degree 0 remain but graph is incomplete
      if (layer.length === 0 && completed.size < this._nodes.size) {
        const remaining = Array.from(this._nodes.keys()).filter(id => !completed.has(id));
        throw new Error(`Cycle detected among nodes: ${remaining.join(', ')}`);
      }

      if (layer.length > 0) {
        layers.push(layer);
      }

      for (const id of layer) {
        completed.add(id);
        for (const depId of this._adjList.get(id) ?? []) {
          inDegree.set(depId, (inDegree.get(depId) ?? 1) - 1);
        }
      }
    }

    return layers;
  }

  /**
   * 环检测 (DFS 三色标记)
   */
  detectCycle(): { hasCycle: boolean; cycleNodes?: string[] } {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<string, number>();
    const parent = new Map<string, string>();

    for (const id of this._nodes.keys()) color.set(id, WHITE);

    const cycleStack: string[] = [];

    const dfs = (u: string): boolean => {
      color.set(u, GRAY);
      cycleStack.push(u);

      for (const v of this._adjList.get(u) ?? []) {
        if (color.get(v) === GRAY) {
          // 找到环
          const cycleStart = cycleStack.indexOf(v);
          return true;
        }
        if (color.get(v) === WHITE) {
          parent.set(v, u);
          if (dfs(v)) return true;
        }
      }

      color.set(u, BLACK);
      cycleStack.pop();
      return false;
    };

    for (const id of this._nodes.keys()) {
      if (color.get(id) === WHITE && dfs(id)) {
        return { hasCycle: true, cycleNodes: [...cycleStack] };
      }
    }

    return { hasCycle: false };
  }

  // ─── 状态更新 ─────────────────────────────────────────────

  /**
   * 更新节点状态
   */
  updateNodeStatus(id: string, status: TaskNodeStatus, result?: unknown, error?: string): void {
    const node = this._nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found`);

    node.status = status;
    if (status === 'running') node.startedAt = Date.now();
    if (status === 'completed' || status === 'failed' || status === 'skipped') {
      node.completedAt = Date.now();
    }
    if (result !== undefined) node.result = result;
    if (error !== undefined) node.error = error;

    // 如果节点失败，将依赖它的节点标记为 skipped
    if (status === 'failed') {
      this._propagateFailure(id);
    }

    this._updatedAt = Date.now();
    this._markDirty();
  }

  /**
   * 重试节点
   */
  retryNode(id: string): boolean {
    const node = this._nodes.get(id);
    if (!node) throw new Error(`Node "${id}" not found`);
    if (node.retries >= node.maxRetries) return false;

    node.status = 'pending';
    node.retries++;
    this._updatedAt = Date.now();
    this._markDirty();
    return true;
  }

  private _propagateFailure(failedId: string): void {
    const queue: string[] = [failedId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const dependents = this._adjList.get(id) ?? new Set();
      for (const depId of dependents) {
        const node = this._nodes.get(depId);
        if (node && (node.status === 'pending' || node.status === 'ready')) {
          node.status = 'skipped';
          node.error = `Skipped due to upstream failure: ${failedId}`;
          queue.push(depId);
        }
      }
    }
  }

  private _markDirty(): void {
    this._dirty = true;
  }

  // ─── 持久化 ─────────────────────────────────────────────

  /**
   * 保存状态到检查点引擎
   */
  async checkpoint(): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.checkpointEngine) {
      return { success: false, error: 'No checkpoint engine configured' };
    }
    const state = this.toJSON();
    return this.checkpointEngine.save(state, this.id);
  }

  /**
   * 从检查点恢复
   */
  static async fromCheckpoint(
    engine: CheckpointEngine,
    graphId: string,
    options?: Partial<TaskGraphOptions>
  ): Promise<TaskGraph | null> {
    const result = engine.load(graphId);
    if (!result.success || !result.data) return null;
    return TaskGraph.fromJSON(result.data as TaskGraphState, options);
  }

  /**
   * 序列化为 JSON
   */
  toJSON(): TaskGraphState {
    const nodes: Record<string, TaskNode> = {};
    for (const [id, node] of this._nodes) {
      nodes[id] = { ...node };
    }
    return {
      id: this.id,
      name: this.name,
      nodes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      status: this._status,
    };
  }

  /**
   * 从 JSON 恢复
   */
  static fromJSON(data: TaskGraphState, options?: Partial<TaskGraphOptions>): TaskGraph {
    const graph = new TaskGraph({
      id: data.id,
      name: data.name,
      ...options,
    });

    graph._createdAt = data.createdAt;
    graph._updatedAt = data.updatedAt;
    graph._status = data.status;

    // 重建节点
    for (const [id, node] of Object.entries(data.nodes)) {
      graph._nodes.set(id, { ...node });
      if (!graph._adjList.has(id)) graph._adjList.set(id, new Set());
      if (!graph._inDegree.has(id)) graph._inDegree.set(id, 0);
    }

    // 重建邻接表和入度
    for (const [id, node] of Object.entries(data.nodes)) {
      for (const depId of node.deps) {
        graph._inDegree.set(id, (graph._inDegree.get(id) ?? 0) + 1);
        graph._adjList.get(depId)?.add(id);
      }
    }

    graph._dirty = false;
    return graph;
  }

  // ─── 查询 ─────────────────────────────────────────────

  isDirty(): boolean { return this._dirty; }
  markClean(): void { this._dirty = false; }
  getStatus(): TaskGraphState['status'] { return this._status; }
  getUpdatedAt(): number { return this._updatedAt; }

  /**
   * 获取图的大致大小
   */
  size(): number { return this._nodes.size; }

  /**
   * 打印拓扑顺序 (调试用)
   */
  printOrder(): string {
    const { order, hasCycle } = this.getTopologicalOrder();
    if (hasCycle) return `⚠️ Cycle detected: ${order.join(' → ')}`;
    return order.join(' → ');
  }

  /**
   * 打印状态摘要
   */
  toSummaryString(): string {
    const counts = { pending: 0, ready: 0, running: 0, completed: 0, failed: 0, skipped: 0 };
    for (const node of this._nodes.values()) {
      counts[node.status]++;
    }
    return `[${this.name}] ${this._status} — pending:${counts.pending} ready:${counts.ready} running:${counts.running} completed:${counts.completed} failed:${counts.failed} skipped:${counts.skipped}`;
  }
}

export default TaskGraph;
