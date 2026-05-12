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
import { TaskGraph } from './TaskGraph';
import { TaskScheduler, TaskExecutor, SchedulerEvents } from './TaskScheduler';
/** 计划步骤解析结果 */
export interface ParsedStep {
    id: string;
    label: string;
    action: string;
    intent: string;
    payload: unknown;
    deps: string[];
    tags?: string[];
}
/** 解析结果 */
export interface ParseResult {
    success: boolean;
    steps: ParsedStep[];
    graph: TaskGraph;
    reasoning?: string;
    error?: string;
}
/** 执行结果 */
export interface ExecuteResult {
    success: boolean;
    graph: TaskGraph;
    scheduler: TaskScheduler;
    parseMs: number;
    executeMs: number;
    totalMs: number;
    error?: string;
}
/** PlanExecutor 配置 */
export interface PlanExecutorOptions {
    /** Cognition 函数签名同 HeartFlow.think() */
    cognition: (input: string, context?: object) => Promise<CognitionResult>;
    /** 可选：自定义检查点引擎（默认用 CheckpointEngine） */
    checkpointEngine?: import('../../storage/checkpoint/CheckpointEngine').CheckpointEngine;
    /** 可选：最大并发任务数 */
    maxConcurrency?: number;
    /** 可选：检查点间隔（每 N 个任务） */
    checkpointInterval?: number;
    /** 可选：每个任务最大重试次数 */
    maxRetries?: number;
}
/** CognitionEngine 返回类型（兼容 HeartFlow.think） */
export interface CognitionResult {
    blocked?: boolean;
    reason?: string;
    psychology?: {
        intention?: string;
        emotion?: string;
        needs?: string;
        defense?: string[];
    };
    truthCheck?: {
        pass?: boolean;
        issues?: string[];
    };
    skills?: Array<{
        name: string;
        result?: unknown;
    }>;
    memories?: unknown[];
    latency?: number;
    [key: string]: unknown;
}
/**
 * PlanExecutor
 *
 * 将自然语言计划转换为可执行的 DAG 任务图，并使用 TaskScheduler 驱动执行。
 */
export declare class PlanExecutor {
    private cognition;
    private checkpointEngine?;
    private maxConcurrency;
    private checkpointInterval;
    private maxRetries;
    constructor(options: PlanExecutorOptions);
    /**
     * parse — 将自然语言计划解析为 TaskGraph
     *
     * @param planText  自然语言计划描述
     * @param context   可选上下文（用于 Cognition 分析）
     * @returns ParseResult
     */
    parse(planText: string, context?: object): Promise<ParseResult>;
    /**
     * execute — 执行已解析的 TaskGraph
     *
     * @param graph   parse() 返回的 TaskGraph
     * @param events  可选调度器事件回调
     * @returns ExecuteResult
     */
    execute(graph: TaskGraph, events?: SchedulerEvents): Promise<ExecuteResult>;
    /**
     * parseAndExecute — 解析并执行（原子操作）
     */
    parseAndExecute(planText: string, context?: object, events?: SchedulerEvents): Promise<ExecuteResult>;
    /**
     * 从 Cognition 结果中提取分析文本
     */
    private _extractReasoning;
    /**
     * 从自然语言计划 + Cognition 结果推断任务步骤
     */
    private _inferSteps;
    /**
     * 构建 TaskGraph
     */
    private _buildGraph;
}
/**
 * 创建 PlanExecutor（使用内置 Mock Cognition）
 */
export declare function createPlanExecutor(options?: Partial<PlanExecutorOptions>): PlanExecutor;
export default PlanExecutor;
export type { TaskExecutor, SchedulerEvents };
//# sourceMappingURL=PlanExecutor.d.ts.map