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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskScheduler = void 0;
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
class TaskScheduler {
    graph;
    executor;
    events;
    maxConcurrency;
    checkpointInterval;
    _status = 'idle';
    _paused = false;
    _stopped = false;
    _runningTasks = new Set();
    _pendingTasks = [];
    _errors = [];
    _startTime = 0;
    _tasksSinceCheckpoint = 0;
    constructor(options) {
        this.graph = options.graph;
        this.executor = options.executor;
        this.events = options.events ?? {};
        this.maxConcurrency = options.maxConcurrency ?? Infinity;
        this.checkpointInterval = options.checkpointInterval ?? 5;
        this._pendingTasks = [];
        if (options.autoStart !== false) {
            // Defer start to next tick
            setImmediate(() => this._autoStart());
        }
    }
    async _autoStart() {
        // Check for cycles before starting
        const cycle = this.graph.detectCycle();
        if (cycle.hasCycle) {
            this._status = 'failed';
            return;
        }
    }
    // ─── 控制方法 ─────────────────────────────────────────────
    /**
     * 开始执行 (或从暂停恢复)
     */
    async run() {
        if (this._status === 'completed' || this._status === 'failed' || this._status === 'stopped') {
            throw new Error(`Scheduler cannot run from status: ${this._status}`);
        }
        this._status = 'running';
        this._startTime = this._startTime || Date.now();
        this._paused = false;
        this._stopped = false;
        // 获取执行层级
        let layers;
        try {
            layers = this.graph.getExecutionLayers();
        }
        catch (e) {
            this._status = 'failed';
            const err = e;
            return this._buildResult(err);
        }
        // 按层级执行
        for (const layer of layers) {
            if (this._stopped)
                break;
            while (this._paused) {
                await this._sleep(100);
                if (this._stopped)
                    break;
            }
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
    pause() {
        if (this._status !== 'running')
            return;
        this._paused = true;
        this._status = 'paused';
    }
    /**
     * 恢复调度
     */
    async resume() {
        if (this._status !== 'paused')
            return;
        this._paused = false;
        this._status = 'running';
        // 继续执行
        await this.run();
    }
    /**
     * 停止调度
     */
    stop() {
        this._stopped = true;
        this._status = 'stopped';
    }
    /**
     * 等待指定节点完成
     */
    async waitForNode(nodeId, timeoutMs = 60000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const node = this.graph.getNode(nodeId);
            if (!node)
                return null;
            if (node.status === 'completed' || node.status === 'failed' || node.status === 'skipped') {
                return node;
            }
            await this._sleep(50);
        }
        return null;
    }
    // ─── 执行逻辑 ─────────────────────────────────────────────
    async _executeLayer(layer) {
        const promises = [];
        for (const nodeId of layer) {
            const node = this.graph.getNode(nodeId);
            if (!node)
                continue;
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
    async _executeTask(node) {
        this._runningTasks.add(node.id);
        this.graph.updateNodeStatus(node.id, 'running');
        try {
            await this._emit('onTaskStart', node, this.graph);
            const result = await this.executor(node, this.graph);
            this.graph.updateNodeStatus(node.id, 'completed', result);
            await this._emit('onTaskComplete', node, result, this.graph);
        }
        catch (err) {
            const error = err;
            // 检查是否可重试
            if (node.retries < node.maxRetries) {
                const retried = this.graph.retryNode(node.id);
                if (retried) {
                    // 重试
                    await this._sleep(Math.pow(2, node.retries) * 100); // 指数退避
                    return this._executeTask(this.graph.getNode(node.id));
                }
            }
            this.graph.updateNodeStatus(node.id, 'failed', undefined, error.message);
            this._errors.push({ nodeId: node.id, error: error.message });
            await this._emit('onTaskFail', node, error, this.graph);
        }
        finally {
            this._runningTasks.delete(node.id);
            this._tasksSinceCheckpoint++;
            // 自动 checkpoint
            if (this._tasksSinceCheckpoint >= this.checkpointInterval) {
                await this._autoCheckpoint();
            }
        }
    }
    async _waitForSlot() {
        return new Promise(resolve => {
            const check = () => {
                if (this._runningTasks.size < this.maxConcurrency || this._stopped) {
                    resolve();
                }
                else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }
    async _autoCheckpoint() {
        this._tasksSinceCheckpoint = 0;
        try {
            await this.graph.checkpoint();
            await this._emit('onCheckpoint', this.graph);
        }
        catch (e) {
            // checkpoint 失败不阻塞执行
            console.warn('[TaskScheduler] checkpoint failed:', e);
        }
    }
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async _emit(event, ...args) {
        const handler = this.events[event];
        if (handler) {
            const result = handler(...args);
            if (result instanceof Promise)
                await result;
        }
    }
    _buildResult(fatalError) {
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
    getStatus() { return this._status; }
    isPaused() { return this._paused; }
    isStopped() { return this._stopped; }
    getGraph() { return this.graph; }
    getErrors() { return [...this._errors]; }
    getRunningCount() { return this._runningTasks.size; }
}
exports.TaskScheduler = TaskScheduler;
exports.default = TaskScheduler;
//# sourceMappingURL=TaskScheduler.js.map