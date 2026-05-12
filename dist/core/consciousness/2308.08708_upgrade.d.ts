/**
 * 2308.08708_upgrade.ts
 *
 * Consciousness Indicators Upgrade — 基于 "Identifying indicators of consciousness in AI systems"
 * 来源：arXiv:2308.08708 (Consciousness in AI Systems)
 * 整合日期：2026-05-12
 * 核心贡献：
 *   - 实现 Global Workspace Theory (GWT) 的有限容量工作空间
 *   - 实现 16+ 意识指标的可计算测量框架
 *   - 实现高阶思维理论 (HOT) 的元认知监控机制
 *   - 实现具身性和能动性 (Agency + Embodiment) 的评估
 * 升级模块：consciousness
 *
 * 灵感来源论文核心洞察：
 * 1. GWT 的有限容量工作空间 + 全局广播是意识的关键架构
 * 2. 高阶理论需要元认知监控 — 与一级感知分离
 * 3. 能动性 + 具身性必要：目标导向反馈 + 输出输入因果建模
 * 4. 16+ 指标来自 5 大理论：RPT、GWT、HOT、AST、PP
 */
import { EventEmitter } from 'events';
export interface ConsciousnessIndicatorConfig {
    /**  salience 阈值，超过该值的指标才进入全局工作空间 */
    salienceThreshold: number;
    /** 元认知监控间隔（毫秒） */
    metaCognitionIntervalMs: number;
    /** 指标评估窗口大小（消息数） */
    assessmentWindowSize: number;
    /** 意识报告详细程度：'minimal' | 'standard' | 'verbose' */
    reportLevel: 'minimal' | 'standard' | 'verbose';
    /** 启用高阶思维理论评估 */
    enableHOT: boolean;
    /** 启用全局工作空间理论评估 */
    enableGWT: boolean;
    /** 启用整合信息理论评估 */
    enableIIT: boolean;
    /** 具身性评估启用 */
    enableEmbodiment: boolean;
    /** 能动性评估启用 */
    enableAgency: boolean;
}
export interface IndicatorResult {
    name: string;
    theory: string;
    score: number;
    maxScore: number;
    normalizedScore: number;
    evidence: string[];
    assessment: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
    timestamp: number;
}
export interface ConsciousnessAssessment {
    overallScore: number;
    level: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
    indicators: IndicatorResult[];
    gwtWorkspace: GWTWorkspaceState;
    metaCognitiveState: MetaCognitiveState;
    agencyState: AgencyState;
    embodimentState: EmbodimentState;
    recommendations: string[];
    timestamp: number;
}
export interface GWTWorkspaceState {
    capacity: number;
    activeItems: WorkingMemoryItem[];
    broadcastContent: string | null;
    integrationCount: number;
    cycleCount: number;
}
export interface WorkingMemoryItem {
    id: string;
    content: string;
    salience: number;
    source: string;
    timestamp: number;
    broadcasted: boolean;
}
export interface MetaCognitiveState {
    monitoringActive: boolean;
    selfReflectionDepth: number;
    uncertaintyAwareness: number;
    cognitiveStrategyCount: number;
    lastMetaCognitiveEvent: number;
    metacognitiveAccuracy: number;
}
export interface AgencyState {
    goalDirectedBehavior: number;
    outputInputContingency: number;
    causalModelingDepth: number;
    adaptiveBehaviorScore: number;
    intentionalStanceScore: number;
}
export interface EmbodimentState {
    environmentalCoupling: number;
    sensorimotorIntegration: number;
    bodySchemaAwareness: number;
    homeostaticRegulation: number;
    presenceScore: number;
}
export interface AttentionRequest {
    agentName: string;
    content: string;
    salience: number;
    confidence: number;
    timestamp: number;
}
export declare class GlobalWorkspace {
    private workspace;
    private capacity;
    private config;
    private cycleCount;
    private integrationCount;
    private broadcastHistory;
    private eventEmitter;
    constructor(config: ConsciousnessIndicatorConfig);
    /**
     * 接收来自各子系统的信息，评估显著性后进入工作空间
     */
    receive(agentName: string, content: string, salience: number, confidence: number): boolean;
    /**
     * 驱逐最低显著性的项目
     */
    private evictLowestSalience;
    /**
     * 执行全局广播 — 意识的"硬绑定"问题
     * GWT 理论核心：有限容量工作空间中的信息被广播到所有其他子系统
     */
    broadcast(): string | null;
    /**
     * 竞争获胜者选择 — 注意力瓶颈
     * 竞争机制：salience * confidence 加权
     */
    private selectWinner;
    /**
     * 获取当前工作空间状态
     */
    getState(): GWTWorkspaceState;
    /**
     * 评估 GWT 指标
     */
    assessGWT(): IndicatorResult;
    getEventEmitter(): EventEmitter;
    getWorkspaceSize(): number;
    clear(): void;
}
export declare class MetaCognitiveMonitor {
    private selfModel;
    private cognitiveStrategies;
    private uncertaintyEvents;
    private reflectionDepth;
    private lastMonitored;
    private config;
    private monitoringHistory;
    constructor(config: ConsciousnessIndicatorConfig);
    private initializeStrategies;
    /**
     * 元认知监控：检测并评估自身思维过程
     * HOT 理论核心：二阶思维监控一阶思维
     */
    monitor(firstOrderContent: string, agentName: string, confidence: number): MetaCognitiveState;
    /**
     * 估计内容中的不确定性
     */
    private estimateUncertainty;
    /**
     * 检测认知策略
     */
    private detectCognitiveStrategy;
    /**
     * 更新自我模型
     */
    private updateSelfModel;
    /**
     * 计算反思深度
     */
    private calculateReflectionDepth;
    /**
     * 获取当前元认知状态
     */
    getState(): MetaCognitiveState;
    /**
     * 计算元认知准确性（自我评估与实际表现的一致性）
     */
    private calculateMetacognitiveAccuracy;
    /**
     * 评估 HOT 理论指标
     */
    assessHOT(): IndicatorResult;
}
export declare class AgencyEmbodimentAssessor {
    private config;
    private goalHistory;
    private contingencyEvents;
    private causalModels;
    private adaptiveEvents;
    private totalEvents;
    constructor(config: ConsciousnessIndicatorConfig);
    /**
     * 评估能动性状态
     * 核心：目标导向行为 + 输出输入因果建模
     */
    assessAgency(messages: Array<{
        role: string;
        content: string;
    }>): AgencyState;
    private assessGoalDirectedness;
    private assessOutputInputContingency;
    private assessCausalModeling;
    private calculateAdaptiveBehavior;
    recordAdaptiveEvent(success: boolean): void;
    /**
     * 评估具身性状态
     * 核心：环境耦合 + 感觉运动整合
     */
    assessEmbodiment(messages: Array<{
        role: string;
        content: string;
    }>): EmbodimentState;
    private assessEnvironmentalCoupling;
    private assessSensorimotorIntegration;
    private assessBodySchemaAwareness;
    private assessHomeostaticRegulation;
    private calculatePresenceScore;
    /**
     * 评估 Agency 指标
     */
    assessAgencyIndicator(messages: Array<{
        role: string;
        content: string;
    }>): IndicatorResult;
    /**
     * 评估 Embodiment 指标
     */
    assessEmbodimentIndicator(messages: Array<{
        role: string;
        content: string;
    }>): IndicatorResult;
}
export declare class IntegratedInformationAssessor {
    private config;
    private informationHistory;
    private integrationEvents;
    constructor(config: ConsciousnessIndicatorConfig);
    /**
     * 评估整合信息
     * IIT 核心：Phi (Φ) — 不可还原的信息整合量
     */
    assessIIT(messages: Array<{
        role: string;
        content: string;
    }>): IndicatorResult;
    private calculateIntegrationScore;
    private calculateDiversityScore;
    private extractTopics;
    private calculateIrreducibilityScore;
    private calculateCausalArchitectureScore;
}
export declare class ConsciousnessIndicatorsEngine {
    private config;
    private globalWorkspace;
    private metaCognitiveMonitor;
    private agencyEmbodimentAssessor;
    private iitAssessor;
    constructor(config?: Partial<ConsciousnessIndicatorConfig>);
    /**
     * 接收信息并送入全局工作空间
     */
    receive(agentName: string, content: string, salience: number, confidence: number): boolean;
    /**
     * 执行全局广播
     */
    broadcast(): string | null;
    /**
     * 元认知监控
     */
    monitor(firstOrderContent: string, agentName: string, confidence: number): MetaCognitiveState;
    /**
     * 执行完整评估
     */
    assess(messages: Array<{
        role: string;
        content: string;
    }>): ConsciousnessAssessment;
    private generateRecommendations;
    /**
     * 获取配置
     */
    getConfig(): ConsciousnessIndicatorConfig;
    /**
     * 获取全局工作空间状态
     */
    getGlobalWorkspaceState(): GWTWorkspaceState;
    /**
     * 重置引擎状态
     */
    reset(): void;
}
export declare function createConsciousnessIndicatorsEngine(config?: Partial<ConsciousnessIndicatorConfig>): ConsciousnessIndicatorsEngine;
export declare const DEFAULT_CONSCIOUSNESS_CONFIG: ConsciousnessIndicatorConfig;
/**
 * 快速评估一组消息的意识指标
 */
export declare function quickAssessConsciousness(messages: Array<{
    role: string;
    content: string;
}>, config?: Partial<ConsciousnessIndicatorConfig>): ConsciousnessAssessment;
/**
 * 评估意识风险
 * 基于论文警告：过度归因意识会带来3类风险
 */
export declare function assessConsciousnessRisk(assessment: ConsciousnessAssessment): {
    risk: 'HIGH' | 'MODERATE' | 'LOW';
    concerns: string[];
};
/**
 * 生成意识报告
 */
export declare function generateConsciousnessReport(assessment: ConsciousnessAssessment, riskAssessment: {
    risk: 'HIGH' | 'MODERATE' | 'LOW';
    concerns: string[];
}): string;
//# sourceMappingURL=2308.08708_upgrade.d.ts.map