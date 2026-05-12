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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRuntime = void 0;
const TaskGraph_1 = require("./TaskGraph");
const TaskScheduler_1 = require("./TaskScheduler");
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
class AgentRuntime {
    id;
    name;
    checkpointEngine;
    heartbeatInterval;
    autoCheckpoint;
    _graphs = new Map();
    _schedulers = new Map();
    _listeners = new Map();
    _status = 'idle';
    _uptimeStartedAt = Date.now();
    _lastHeartbeat = Date.now();
    _heartbeatTimer;
    _totalTasksProcessed = 0;
    constructor(options = {}) {
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
    on(type, listener) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, new Set());
        }
        this._listeners.get(type).add(listener);
        // 返回取消订阅函数
        return () => {
            this._listeners.get(type)?.delete(listener);
        };
    }
    /**
     * 触发事件
     */
    async _emit(event) {
        const promises = [];
        const listeners = this._listeners.get(event.type);
        if (listeners) {
            for (const listener of listeners) {
                const result = listener(event);
                if (result instanceof Promise)
                    promises.push(result);
            }
        }
        // 同时触发通配符监听器
        const wildcard = this._listeners.get('*');
        if (wildcard) {
            for (const listener of wildcard) {
                const result = listener(event);
                if (result instanceof Promise)
                    promises.push(result);
            }
        }
        await Promise.all(promises);
    }
    _newEvent(type, payload, graphId, nodeId) {
        return { type, timestamp: Date.now(), payload, graphId, nodeId };
    }
    // ─── 心跳 ─────────────────────────────────────────────
    /**
     * 启动心跳
     */
    startHeartbeat() {
        if (this._heartbeatTimer)
            return;
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
    stopHeartbeat() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = undefined;
        }
    }
    // ─── 工作流注册 ─────────────────────────────────────────────
    /**
     * 注册工作流定义 (但不立即执行)
     */
    registerWorkflow(workflow) {
        const graph = new TaskGraph_1.TaskGraph({
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
    static createSequentialWorkflow(id, name, nodes) {
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
    static createParallelWorkflow(id, name, nodes) {
        // 完全并行: 所有节点无依赖
        return {
            id,
            name,
            nodes: nodes.map(n => ({ id: n.id, label: n.label, payload: n.payload, deps: [] })),
        };
    }
    static createDAGWorkflow(id, name, nodes) {
        return { id, name, nodes };
    }
    // ─── 执行 ─────────────────────────────────────────────
    /**
     * 执行指定工作流
     */
    async execute(workflowId, executor, options) {
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
        const schedulerEvents = {
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
        const scheduler = new TaskScheduler_1.TaskScheduler({
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
    async executeAndWait(workflowId, executor, options) {
        return this.execute(workflowId, executor, { ...options, autoStart: true });
    }
    // ─── 控制 ─────────────────────────────────────────────
    /**
     * 暂停工作流
     */
    pause(workflowId) {
        const scheduler = this._schedulers.get(workflowId);
        if (!scheduler)
            throw new Error(`Scheduler "${workflowId}" not found`);
        scheduler.pause();
        this._status = 'paused';
        this._emit(this._newEvent('scheduler_pause', { workflowId }, workflowId));
    }
    /**
     * 恢复工作流
     */
    async resume(workflowId) {
        const scheduler = this._schedulers.get(workflowId);
        if (!scheduler)
            throw new Error(`Scheduler "${workflowId}" not found`);
        this._status = 'running';
        this._emit(this._newEvent('scheduler_resume', { workflowId }, workflowId));
        await scheduler.resume();
    }
    /**
     * 停止工作流
     */
    stop(workflowId) {
        const scheduler = this._schedulers.get(workflowId);
        if (!scheduler)
            throw new Error(`Scheduler "${workflowId}" not found`);
        scheduler.stop();
        this._status = 'stopped';
        this._emit(this._newEvent('scheduler_stop', { workflowId }, workflowId));
    }
    /**
     * 停止所有工作流
     */
    stopAll() {
        for (const [id] of this._schedulers) {
            this.stop(id);
        }
    }
    // ─── 查询 ─────────────────────────────────────────────
    /**
     * 获取工作流图
     */
    getGraph(workflowId) {
        return this._graphs.get(workflowId);
    }
    /**
     * 获取所有工作流
     */
    getAllGraphs() {
        return Array.from(this._graphs.entries()).map(([id, graph]) => ({
            id,
            name: graph.name,
            graph,
        }));
    }
    /**
     * 获取调度器
     */
    getScheduler(workflowId) {
        return this._schedulers.get(workflowId);
    }
    /**
     * 获取状态
     */
    getStatus() {
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
    async saveState() {
        if (!this.checkpointEngine) {
            return { success: false, error: 'No checkpoint engine' };
        }
        const state = this.getStatus();
        return this.checkpointEngine.save(state, `agent-runtime-${this.id}`);
    }
    /**
     * 加载运行时状态
     */
    static async loadState(engine, runtimeId, options) {
        const result = engine.load(`agent-runtime-${runtimeId}`);
        if (!result.success || !result.data)
            return null;
        const state = result.data;
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
    shutdown() {
        this.stopAll();
        this.stopHeartbeat();
    }
}
exports.AgentRuntime = AgentRuntime;
exports.default = AgentRuntime;
//# sourceMappingURL=AgentRuntime.js.map