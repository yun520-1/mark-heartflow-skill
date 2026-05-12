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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskGraph = void 0;
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
class TaskGraph {
    id;
    name;
    maxRetries;
    checkpointEngine;
    _nodes = new Map();
    _adjList = new Map(); // node -> its dependents
    _inDegree = new Map();
    _status = 'running';
    _createdAt;
    _updatedAt;
    _dirty = false; // 是否需要持久化
    constructor(options = {}) {
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
    addNode(id, label, payload, deps = []) {
        if (this._nodes.has(id)) {
            throw new Error(`Node "${id}" already exists in graph`);
        }
        const node = {
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
        if (!this._inDegree.has(id))
            this._inDegree.set(id, 0);
        if (!this._adjList.has(id))
            this._adjList.set(id, new Set());
        // 添加依赖关系
        for (const depId of deps) {
            if (!this._nodes.has(depId) && !this._adjList.has(depId)) {
                // 前置依赖节点还不存在，先记录
                if (!this._inDegree.has(depId))
                    this._inDegree.set(depId, 0);
                if (!this._adjList.has(depId))
                    this._adjList.set(depId, new Set());
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
    addNodes(nodes) {
        for (const n of nodes) {
            this.addNode(n.id, n.label, n.payload, n.deps ?? []);
        }
        return this;
    }
    /**
     * 获取节点
     */
    getNode(id) {
        return this._nodes.get(id);
    }
    /**
     * 获取所有节点
     */
    getNodes() {
        return Array.from(this._nodes.values());
    }
    /**
     * 获取所有就绪节点 (所有依赖已完成，状态为 ready)
     */
    getReadyNodes() {
        return this.getNodes().filter(n => {
            if (n.status !== 'pending')
                return false;
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
    getTopologicalOrder() {
        const order = [];
        const inDegree = new Map(this._inDegree);
        const queue = [];
        // 入度为 0 的节点可以首先执行
        for (const [id, degree] of inDegree) {
            if (degree === 0)
                queue.push(id);
        }
        let hasCycle = false;
        const visited = new Set();
        while (queue.length > 0) {
            const id = queue.shift();
            if (visited.has(id))
                continue;
            visited.add(id);
            order.push(id);
            const dependents = this._adjList.get(id) ?? new Set();
            for (const depId of dependents) {
                const newDegree = (inDegree.get(depId) ?? 1) - 1;
                inDegree.set(depId, newDegree);
                if (newDegree === 0)
                    queue.push(depId);
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
    getExecutionLayers() {
        const layers = [];
        const completed = new Set();
        const inDegree = new Map(this._inDegree);
        while (completed.size < this._nodes.size) {
            const layer = [];
            for (const [id, degree] of inDegree) {
                if (degree === 0 && !completed.has(id)) {
                    layer.push(id);
                }
            }
            if (layer.length === 0 && completed.size < this._nodes.size) {
                // 环检测: 无法继续但还有未完成节点
                const remaining = Array.from(this._nodes.keys()).filter(id => !completed.has(id));
                throw new Error(`Cycle detected among nodes: ${remaining.join(', ')}`);
            }
            layers.push(layer);
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
    detectCycle() {
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = new Map();
        const parent = new Map();
        for (const id of this._nodes.keys())
            color.set(id, WHITE);
        const cycleStack = [];
        const dfs = (u) => {
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
                    if (dfs(v))
                        return true;
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
    updateNodeStatus(id, status, result, error) {
        const node = this._nodes.get(id);
        if (!node)
            throw new Error(`Node "${id}" not found`);
        node.status = status;
        if (status === 'running')
            node.startedAt = Date.now();
        if (status === 'completed' || status === 'failed' || status === 'skipped') {
            node.completedAt = Date.now();
        }
        if (result !== undefined)
            node.result = result;
        if (error !== undefined)
            node.error = error;
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
    retryNode(id) {
        const node = this._nodes.get(id);
        if (!node)
            throw new Error(`Node "${id}" not found`);
        if (node.retries >= node.maxRetries)
            return false;
        node.status = 'pending';
        node.retries++;
        this._updatedAt = Date.now();
        this._markDirty();
        return true;
    }
    _propagateFailure(failedId) {
        const queue = [failedId];
        const visited = new Set();
        while (queue.length > 0) {
            const id = queue.shift();
            if (visited.has(id))
                continue;
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
    _markDirty() {
        this._dirty = true;
    }
    // ─── 持久化 ─────────────────────────────────────────────
    /**
     * 保存状态到检查点引擎
     */
    async checkpoint() {
        if (!this.checkpointEngine) {
            return { success: false, error: 'No checkpoint engine configured' };
        }
        const state = this.toJSON();
        return this.checkpointEngine.save(state, this.id);
    }
    /**
     * 从检查点恢复
     */
    static async fromCheckpoint(engine, graphId, options) {
        const result = engine.load(graphId);
        if (!result.success || !result.data)
            return null;
        return TaskGraph.fromJSON(result.data, options);
    }
    /**
     * 序列化为 JSON
     */
    toJSON() {
        const nodes = {};
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
    static fromJSON(data, options) {
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
            if (!graph._adjList.has(id))
                graph._adjList.set(id, new Set());
            if (!graph._inDegree.has(id))
                graph._inDegree.set(id, 0);
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
    isDirty() { return this._dirty; }
    markClean() { this._dirty = false; }
    getStatus() { return this._status; }
    getUpdatedAt() { return this._updatedAt; }
    /**
     * 获取图的大致大小
     */
    size() { return this._nodes.size; }
    /**
     * 打印拓扑顺序 (调试用)
     */
    printOrder() {
        const { order, hasCycle } = this.getTopologicalOrder();
        if (hasCycle)
            return `⚠️ Cycle detected: ${order.join(' → ')}`;
        return order.join(' → ');
    }
    /**
     * 打印状态摘要
     */
    toSummaryString() {
        const counts = { pending: 0, ready: 0, running: 0, completed: 0, failed: 0, skipped: 0 };
        for (const node of this._nodes.values()) {
            counts[node.status]++;
        }
        return `[${this.name}] ${this._status} — pending:${counts.pending} ready:${counts.ready} running:${counts.running} completed:${counts.completed} failed:${counts.failed} skipped:${counts.skipped}`;
    }
}
exports.TaskGraph = TaskGraph;
exports.default = TaskGraph;
//# sourceMappingURL=TaskGraph.js.map