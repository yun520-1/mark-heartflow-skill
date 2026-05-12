/**
 * PlanExecutor — 自然语言计划解析为任务图
 * @version v0.1.0
 *
 * 功能：
 *   - 将自然语言计划解析为 TaskGraph（TaskGraph.ts）
 *   - 集成 CognitionEngine（HeartFlow.think）进行计划分析
 *   - 支持 DAG 拓扑调度（TaskScheduler.ts）
 *   - 自动检查点保存
 *
 * 使用示例:
 *   const executor = new PlanExecutor({ cognition });
 *   const graph = await executor.parse('帮我搜索论文然后总结重点');
 *   const result = await executor.execute(graph);
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanExecutor = void 0;
exports.createPlanExecutor = createPlanExecutor;
const TaskGraph_1 = require("./TaskGraph");
const TaskScheduler_1 = require("./TaskScheduler");
// ─── PlanExecutor ─────────────────────────────────────────────────────────
/**
 * PlanExecutor
 *
 * 将自然语言计划转换为可执行的 DAG 任务图，并使用 TaskScheduler 驱动执行。
 */
class PlanExecutor {
    cognition;
    checkpointEngine;
    maxConcurrency;
    checkpointInterval;
    maxRetries;
    constructor(options) {
        this.cognition = options.cognition;
        this.checkpointEngine = options.checkpointEngine;
        this.maxConcurrency = options.maxConcurrency ?? Infinity;
        this.checkpointInterval = options.checkpointInterval ?? 5;
        this.maxRetries = options.maxRetries ?? 3;
    }
    // ─── 公开 API ─────────────────────────────────────────────────────────
    /**
     * parse — 将自然语言计划解析为 TaskGraph
     *
     * @param planText  自然语言计划描述
     * @param context   可选上下文（用于 Cognition 分析）
     * @returns ParseResult
     */
    async parse(planText, context) {
        const start = Date.now();
        try {
            // 1. 调用 CognitionEngine 分析计划
            const cogResult = await this.cognition(planText, context);
            // 2. 提取关键信息
            const reasoning = this._extractReasoning(cogResult);
            // 3. 从 Cognition 结果中推断任务步骤
            const steps = this._inferSteps(planText, cogResult);
            if (steps.length === 0) {
                return {
                    success: false,
                    steps: [],
                    graph: new TaskGraph_1.TaskGraph({ name: 'EmptyPlan' }),
                    reasoning,
                    error: '无法从计划中解析出任何可执行步骤',
                };
            }
            // 4. 构建 TaskGraph
            const graph = this._buildGraph(steps);
            // 5. 验证拓扑
            const topo = graph.getTopologicalOrder();
            if (topo.hasCycle) {
                return {
                    success: false,
                    steps,
                    graph,
                    reasoning,
                    error: `检测到循环依赖: ${(topo.cycleNodes ?? []).join(' → ')}`,
                };
            }
            return {
                success: true,
                steps,
                graph,
                reasoning,
            };
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                steps: [],
                graph: new TaskGraph_1.TaskGraph({ name: 'ErrorPlan' }),
                error: `解析失败: ${error}`,
            };
        }
    }
    /**
     * execute — 执行已解析的 TaskGraph
     *
     * @param graph   parse() 返回的 TaskGraph
     * @param events  可选调度器事件回调
     * @returns ExecuteResult
     */
    async execute(graph, events) {
        const start = Date.now();
        const parseMs = 0; // 已由 parse 消耗
        try {
            // 构建默认执行器（用户可覆盖）
            const executor = async (node) => {
                // 默认：直接返回 payload
                // 实际应用中这里会调用具体工具
                return { executed: true, nodeId: node.id, payload: node.payload };
            };
            // 创建调度器
            const scheduler = new TaskScheduler_1.TaskScheduler({
                graph,
                executor,
                maxConcurrency: this.maxConcurrency,
                checkpointInterval: this.checkpointInterval,
                events: events ?? {},
                autoStart: false, // 手动控制 run()
            });
            // 执行
            await scheduler.run();
            const executeMs = Date.now() - start;
            return {
                success: scheduler.getStatus() === 'completed',
                graph,
                scheduler,
                parseMs,
                executeMs,
                totalMs: Date.now() - start,
            };
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                graph,
                scheduler: null,
                parseMs,
                executeMs: Date.now() - start,
                totalMs: Date.now() - start,
                error: `执行失败: ${error}`,
            };
        }
    }
    /**
     * parseAndExecute — 解析并执行（原子操作）
     */
    async parseAndExecute(planText, context, events) {
        const start = Date.now();
        const parseResult = await this.parse(planText, context);
        if (!parseResult.success) {
            return {
                success: false,
                graph: parseResult.graph,
                scheduler: null,
                parseMs: Date.now() - start,
                executeMs: 0,
                totalMs: Date.now() - start,
                error: parseResult.error,
            };
        }
        const executeResult = await this.execute(parseResult.graph, events);
        return {
            ...executeResult,
            parseMs: Date.now() - start - executeResult.executeMs,
        };
    }
    // ─── 私有工具 ─────────────────────────────────────────────────────────
    /**
     * 从 Cognition 结果中提取分析文本
     */
    _extractReasoning(cogResult) {
        const parts = [];
        if (cogResult.psychology?.intention) {
            parts.push(`意图: ${cogResult.psychology.intention}`);
        }
        if (cogResult.psychology?.emotion) {
            parts.push(`情绪: ${cogResult.psychology.emotion}`);
        }
        if (cogResult.truthCheck && !cogResult.truthCheck.pass) {
            parts.push(`真善美问题: ${(cogResult.truthCheck.issues ?? []).join(', ')}`);
        }
        return parts.length > 0 ? parts.join(' | ') : '计划分析完成';
    }
    /**
     * 从自然语言计划 + Cognition 结果推断任务步骤
     */
    _inferSteps(planText, cogResult) {
        const steps = [];
        const text = planText.toLowerCase();
        const stepIdPrefix = `step-${Date.now()}-`;
        let stepIndex = 0;
        // 动作模式识别
        const patterns = [
            {
                regex: /搜索?|查(找|询)|search/i,
                action: 'search',
                labelFn: (m) => `搜索: ${m[0] || '相关内容'}`,
                payloadFn: () => ({}),
                tags: ['search'],
            },
            {
                regex: /阅读?|读取?|read|看(看|一下)/i,
                action: 'read',
                labelFn: (m) => `阅读: ${m[0]}`,
                payloadFn: () => ({}),
                tags: ['read'],
            },
            {
                regex: /总结?|概括|提炼|summarize|汇总/i,
                action: 'summarize',
                labelFn: (m) => `总结: ${m[0]}`,
                payloadFn: () => ({}),
                tags: ['summarize'],
            },
            {
                regex: /分析|研究|analyze/i,
                action: 'analyze',
                labelFn: (m) => `分析: ${m[0]}`,
                payloadFn: () => ({}),
                tags: ['analyze'],
            },
            {
                regex: /写(入|入)?|保存|存储|save|write/i,
                action: 'write',
                labelFn: (m) => `写入: ${m[0]}`,
                payloadFn: () => ({}),
                tags: ['write'],
            },
            {
                regex: /执行|运行|run|execute|做(一下)?|搞/i,
                action: 'execute',
                labelFn: (m) => `执行: ${m[0]}`,
                payloadFn: () => ({}),
                tags: ['execute'],
            },
        ];
        // 简单顺序解析：按顺序匹配动作模式
        // 实际应用中这里应该用 LLM 来分解计划
        const sentences = planText.split(/[，,。;；\n]/).filter(Boolean);
        let lastMatchedIdx = -1;
        for (const sentence of sentences) {
            for (const pattern of patterns) {
                const match = sentence.match(pattern.regex);
                if (match) {
                    const stepId = `${stepIdPrefix}${stepIndex++}`;
                    const prevDeps = lastMatchedIdx >= 0 ? [`${stepIdPrefix}${lastMatchedIdx}`] : [];
                    steps.push({
                        id: stepId,
                        label: pattern.labelFn(match),
                        action: pattern.action,
                        intent: sentence.trim(),
                        payload: pattern.payloadFn(match, sentence),
                        deps: prevDeps,
                        tags: pattern.tags,
                    });
                    lastMatchedIdx = steps.length - 1;
                    break;
                }
            }
        }
        // Fallback: 如果没有匹配到任何动作，创建单个执行步骤
        if (steps.length === 0) {
            steps.push({
                id: `${stepIdPrefix}0`,
                label: `执行计划`,
                action: 'execute',
                intent: planText,
                payload: { planText },
                deps: [],
                tags: ['execute'],
            });
        }
        return steps;
    }
    /**
     * 构建 TaskGraph
     */
    _buildGraph(steps) {
        const graph = new TaskGraph_1.TaskGraph({
            name: 'PlanExecution',
            maxRetries: this.maxRetries,
            checkpointEngine: this.checkpointEngine,
        });
        for (const step of steps) {
            graph.addNode(step.id, step.label, step.payload, step.deps);
        }
        return graph;
    }
}
exports.PlanExecutor = PlanExecutor;
// ─── 工厂函数 ─────────────────────────────────────────────────────────────
/**
 * 创建 PlanExecutor（使用内置 Mock Cognition）
 */
function createPlanExecutor(options) {
    // 默认 mock cognition
    const defaultCognition = async (input) => {
        return {
            psychology: {
                intention: 'request_action',
                emotion: 'neutral',
                needs: 'unknown',
                defense: [],
            },
            truthCheck: { pass: true, issues: [] },
            latency: 0,
        };
    };
    return new PlanExecutor({
        cognition: options?.cognition ?? defaultCognition,
        checkpointEngine: options?.checkpointEngine,
        maxConcurrency: options?.maxConcurrency,
        checkpointInterval: options?.checkpointInterval,
        maxRetries: options?.maxRetries,
    });
}
exports.default = PlanExecutor;
//# sourceMappingURL=PlanExecutor.js.map