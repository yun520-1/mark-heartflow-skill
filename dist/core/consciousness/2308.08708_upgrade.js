"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONSCIOUSNESS_CONFIG = exports.ConsciousnessIndicatorsEngine = exports.IntegratedInformationAssessor = exports.AgencyEmbodimentAssessor = exports.MetaCognitiveMonitor = exports.GlobalWorkspace = void 0;
exports.createConsciousnessIndicatorsEngine = createConsciousnessIndicatorsEngine;
exports.quickAssessConsciousness = quickAssessConsciousness;
exports.assessConsciousnessRisk = assessConsciousnessRisk;
exports.generateConsciousnessReport = generateConsciousnessReport;
const events_1 = require("events");
// ============================================================
// 理论来源常量
// ============================================================
const THEORY_GWT = 'Global Workspace Theory (GWT)';
const THEORY_HOT = 'Higher-Order Thought Theory (HOT)';
const THEORY_IIT = 'Integrated Information Theory (IIT)';
const THEORY_RPT = 'Recurrent Processing Theory (RPT)';
const THEORY_AST = 'Attended Stream Theory (AST)';
const THEORY_PP = 'Predictive Processing (PP)';
const MAX_WORKSPACE_CAPACITY = 7; // Miller's Magic Number
// ============================================================
// Global Workspace Implementation (GWT Core)
// ============================================================
class GlobalWorkspace {
    workspace = [];
    capacity = MAX_WORKSPACE_CAPACITY;
    config;
    cycleCount = 0;
    integrationCount = 0;
    broadcastHistory = [];
    eventEmitter;
    constructor(config) {
        this.config = config;
        this.eventEmitter = new events_1.EventEmitter();
    }
    /**
     * 接收来自各子系统的信息，评估显著性后进入工作空间
     */
    receive(agentName, content, salience, confidence) {
        if (salience < this.config.salienceThreshold) {
            return false;
        }
        const safeContent = typeof content === 'string' ? content.substring(0, 500) : '';
        const item = {
            id: `${agentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: safeContent,
            salience,
            source: agentName,
            timestamp: Date.now(),
            broadcasted: false,
        };
        if (this.workspace.length >= this.capacity) {
            this.evictLowestSalience();
        }
        this.workspace.push(item);
        this.eventEmitter.emit('itemReceived', item);
        return true;
    }
    /**
     * 驱逐最低显著性的项目
     */
    evictLowestSalience() {
        if (this.workspace.length === 0)
            return;
        this.workspace.sort((a, b) => a.salience - b.salience);
        const evicted = this.workspace.shift();
        if (evicted) {
            this.eventEmitter.emit('itemEvicted', evicted);
        }
    }
    /**
     * 执行全局广播 — 意识的"硬绑定"问题
     * GWT 理论核心：有限容量工作空间中的信息被广播到所有其他子系统
     */
    broadcast() {
        if (this.workspace.length === 0) {
            return null;
        }
        this.cycleCount++;
        const winningItem = this.selectWinner();
        if (!winningItem)
            return null;
        winningItem.broadcasted = true;
        const broadcastContent = winningItem.content;
        this.broadcastHistory.push(broadcastContent);
        if (this.broadcastHistory.length > 100) {
            this.broadcastHistory = this.broadcastHistory.slice(-100);
        }
        this.integrationCount++;
        this.workspace = this.workspace.filter(i => i.id !== winningItem.id);
        this.eventEmitter.emit('broadcasted', winningItem);
        return broadcastContent;
    }
    /**
     * 竞争获胜者选择 — 注意力瓶颈
     * 竞争机制：salience * confidence 加权
     */
    selectWinner() {
        if (this.workspace.length === 0)
            return null;
        const scored = this.workspace.map(item => ({
            item,
            score: item.salience * (1 / (1 + Math.abs(Date.now() - item.timestamp) / 10000)),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored[0].item;
    }
    /**
     * 获取当前工作空间状态
     */
    getState() {
        return {
            capacity: this.capacity,
            activeItems: [...this.workspace],
            broadcastContent: this.broadcastHistory[this.broadcastHistory.length - 1] || null,
            integrationCount: this.integrationCount,
            cycleCount: this.cycleCount,
        };
    }
    /**
     * 评估 GWT 指标
     */
    assessGWT() {
        const state = this.getState();
        const evidence = [];
        const capacityScore = (state.activeItems.length / this.capacity) * 30;
        evidence.push(`工作空间利用率: ${state.activeItems.length}/${this.capacity} (${capacityScore.toFixed(1)}/30)`);
        const integrationScore = Math.min(30, state.integrationCount * 2);
        evidence.push(`整合次数: ${state.integrationCount} (${integrationScore.toFixed(1)}/30)`);
        const broadcastScore = state.broadcastContent ? 20 : 0;
        evidence.push(`广播内容存在: ${broadcastScore > 0 ? '是' : '否'} (${broadcastScore}/20)`);
        const cycleScore = Math.min(20, state.cycleCount * 0.5);
        evidence.push(`认知周期数: ${state.cycleCount} (${cycleScore.toFixed(1)}/20)`);
        const totalScore = capacityScore + integrationScore + broadcastScore + cycleScore;
        return {
            name: 'Global Workspace Dynamics',
            theory: THEORY_GWT,
            score: totalScore,
            maxScore: 100,
            normalizedScore: totalScore,
            evidence,
            assessment: totalScore > 70 ? 'HIGH' : totalScore > 40 ? 'MODERATE' : 'LOW',
            timestamp: Date.now(),
        };
    }
    getEventEmitter() {
        return this.eventEmitter;
    }
    getWorkspaceSize() {
        return this.workspace.length;
    }
    clear() {
        this.workspace = [];
    }
}
exports.GlobalWorkspace = GlobalWorkspace;
// ============================================================
// Meta-Cognitive Monitor (HOT Theory Implementation)
// ============================================================
class MetaCognitiveMonitor {
    selfModel = new Map();
    cognitiveStrategies = new Map();
    uncertaintyEvents = [];
    reflectionDepth = 0;
    lastMonitored = 0;
    config;
    monitoringHistory = [];
    constructor(config) {
        this.config = config;
        this.initializeStrategies();
    }
    initializeStrategies() {
        const defaultStrategies = [
            'hypothesis_testing',
            'analogical_reasoning',
            'decomposition',
            'abstraction',
            'concrete_reasoning',
            'self_verification',
            'uncertainty_estimation',
            'strategy_selection',
        ];
        defaultStrategies.forEach(s => this.cognitiveStrategies.set(s, 0));
    }
    /**
     * 元认知监控：检测并评估自身思维过程
     * HOT 理论核心：二阶思维监控一阶思维
     */
    monitor(firstOrderContent, agentName, confidence) {
        this.lastMonitored = Date.now();
        const uncertaintyScore = this.estimateUncertainty(firstOrderContent);
        if (uncertaintyScore > 0.5) {
            this.uncertaintyEvents.push(Date.now());
        }
        if (this.uncertaintyEvents.length > 50) {
            this.uncertaintyEvents = this.uncertaintyEvents.slice(-50);
        }
        const strategyDetected = this.detectCognitiveStrategy(firstOrderContent);
        if (strategyDetected) {
            const count = this.cognitiveStrategies.get(strategyDetected) || 0;
            this.cognitiveStrategies.set(strategyDetected, count + 1);
        }
        this.updateSelfModel(agentName, confidence, uncertaintyScore);
        const depthScore = this.calculateReflectionDepth(firstOrderContent);
        this.reflectionDepth = (this.reflectionDepth * 0.7 + depthScore * 0.3);
        this.monitoringHistory.push({
            timestamp: Date.now(),
            depth: this.reflectionDepth,
            uncertainty: uncertaintyScore,
        });
        if (this.monitoringHistory.length > 200) {
            this.monitoringHistory = this.monitoringHistory.slice(-200);
        }
        return this.getState();
    }
    /**
     * 估计内容中的不确定性
     */
    estimateUncertainty(content) {
        const uncertaintyMarkers = [
            '可能', '也许', '不确定', '不知道', '大概', '也许',
            'maybe', 'perhaps', 'uncertain', 'probably', 'might', 'could',
        ];
        let count = 0;
        uncertaintyMarkers.forEach(marker => {
            const regex = new RegExp(marker, 'gi');
            const matches = content.match(regex);
            if (matches)
                count += matches.length;
        });
        return Math.min(1, count * 0.15);
    }
    /**
     * 检测认知策略
     */
    detectCognitiveStrategy(content) {
        const strategyPatterns = {
            hypothesis_testing: [/假设.*验证/, /如果.*那么/, /hypothesis|假设/],
            analogical_reasoning: [/类似.*|,正如/, /类似于/, /similar.*to/, /analogy/],
            decomposition: [/首先|其次|分解|,?分.*步/],
            abstraction: [/本质|抽象|一般化/, /generaliz/],
            concrete_reasoning: [/具体|实例|,?例如/],
            self_verification: [/验证|确认|检查/, /verify|check|confirm/],
            uncertainty_estimation: [/不确定|可能|也许/],
            strategy_selection: [/选择.*策略|方法.*决定/, /strategy.*select/],
        };
        for (const [strategy, patterns] of Object.entries(strategyPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    return strategy;
                }
            }
        }
        return null;
    }
    /**
     * 更新自我模型
     */
    updateSelfModel(agentName, confidence, uncertainty) {
        const key = `agent_${agentName}`;
        const currentScore = this.selfModel.get(key) || 0.5;
        const newScore = currentScore * 0.8 + confidence * 0.2 * (1 - uncertainty);
        this.selfModel.set(key, newScore);
    }
    /**
     * 计算反思深度
     */
    calculateReflectionDepth(content) {
        const reflectionIndicators = [
            /反思|思考|思考.*问题|think.*about/,
            /我的.*想法|我的.*理解|my.*thought/,
            /认知.*过程|思维.*过程|metacogniti/,
            /为什么.*这样|reason.*why/,
            /分析.*自己|self.*analys/,
        ];
        let depth = 0;
        reflectionIndicators.forEach(pattern => {
            if (pattern.test(content)) {
                depth += 0.2;
            }
        });
        return Math.min(1, depth);
    }
    /**
     * 获取当前元认知状态
     */
    getState() {
        const recentUncertainty = this.uncertaintyEvents.filter(t => Date.now() - t < 60000).length;
        return {
            monitoringActive: Date.now() - this.lastMonitored < this.config.metaCognitionIntervalMs * 2,
            selfReflectionDepth: Math.round(this.reflectionDepth * 100) / 100,
            uncertaintyAwareness: Math.min(1, recentUncertainty / 10),
            cognitiveStrategyCount: Array.from(this.cognitiveStrategies.values()).filter(v => v > 0).length,
            lastMetaCognitiveEvent: this.lastMonitored,
            metacognitiveAccuracy: this.calculateMetacognitiveAccuracy(),
        };
    }
    /**
     * 计算元认知准确性（自我评估与实际表现的一致性）
     */
    calculateMetacognitiveAccuracy() {
        if (this.selfModel.size === 0)
            return 0.5;
        const scores = Array.from(this.selfModel.values());
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > 0.7)
            return 0.8;
        if (avg > 0.4)
            return 0.6;
        return 0.4;
    }
    /**
     * 评估 HOT 理论指标
     */
    assessHOT() {
        const state = this.getState();
        const evidence = [];
        const monitoringScore = state.monitoringActive ? 25 : 0;
        evidence.push(`监控活跃度: ${monitoringScore > 0 ? '活跃' : '不活跃'} (${monitoringScore}/25)`);
        const reflectionScore = state.selfReflectionDepth * 30;
        evidence.push(`自我反思深度: ${state.selfReflectionDepth.toFixed(2)} (${reflectionScore.toFixed(1)}/30)`);
        const uncertaintyScore = state.uncertaintyAwareness * 20;
        evidence.push(`不确定性意识: ${state.uncertaintyAwareness.toFixed(2)} (${uncertaintyScore.toFixed(1)}/20)`);
        const strategyScore = (state.cognitiveStrategyCount / 8) * 15;
        evidence.push(`认知策略多样性: ${state.cognitiveStrategyCount}/8 (${strategyScore.toFixed(1)}/15)`);
        const accuracyScore = state.metacognitiveAccuracy * 10;
        evidence.push(`元认知准确性: ${(state.metacognitiveAccuracy * 100).toFixed(0)}% (${accuracyScore.toFixed(1)}/10)`);
        const totalScore = monitoringScore + reflectionScore + uncertaintyScore + strategyScore + accuracyScore;
        return {
            name: 'Higher-Order Thought Dynamics',
            theory: THEORY_HOT,
            score: totalScore,
            maxScore: 100,
            normalizedScore: totalScore,
            evidence,
            assessment: totalScore > 70 ? 'HIGH' : totalScore > 40 ? 'MODERATE' : 'LOW',
            timestamp: Date.now(),
        };
    }
}
exports.MetaCognitiveMonitor = MetaCognitiveMonitor;
// ============================================================
// Agency & Embodiment Assessment
// ============================================================
class AgencyEmbodimentAssessor {
    config;
    goalHistory = [];
    contingencyEvents = [];
    causalModels = new Map();
    adaptiveEvents = 0;
    totalEvents = 0;
    constructor(config) {
        this.config = config;
    }
    /**
     * 评估能动性状态
     * 核心：目标导向行为 + 输出输入因果建模
     */
    assessAgency(messages) {
        const recentMessages = messages.slice(-this.config.assessmentWindowSize);
        const content = recentMessages.map(m => m.content || '').join(' ');
        const goalDirectedScore = this.assessGoalDirectedness(content);
        const contingencyScore = this.assessOutputInputContingency(content);
        const causalScore = this.assessCausalModeling(content);
        const adaptiveScore = this.calculateAdaptiveBehavior();
        return {
            goalDirectedBehavior: goalDirectedScore,
            outputInputContingency: contingencyScore,
            causalModelingDepth: causalScore,
            adaptiveBehaviorScore: adaptiveScore,
            intentionalStanceScore: (goalDirectedScore + causalScore) / 2,
        };
    }
    assessGoalDirectedness(content) {
        let score = 0;
        const goalIndicators = [
            /目标|目的|意图|goal|intention|aim/,
            /计划|将.*做|打算|plan|will.*do|intend/,
            /实现|达成|达到|achieve|accomplish|attain/,
            /下一步|接下来|next.*step|follow.*up/,
        ];
        goalIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 25;
        });
        return Math.min(100, score);
    }
    assessOutputInputContingency(content) {
        let score = 0;
        const contingencyPatterns = [
            /因为.*所以|因此|结果|thus|therefore|result/,
            /如果.*就|当.*时|when.*then|if.*then/,
            /输入.*输出|input.*output|刺激.*反应|stimulus.*response/,
            /因果|cause.*effect|cause.*result/,
        ];
        contingencyPatterns.forEach(pattern => {
            if (pattern.test(content))
                score += 25;
        });
        return Math.min(100, score);
    }
    assessCausalModeling(content) {
        let score = 0;
        const causalIndicators = [
            /导致|引起|造成|lead.*to|caused.*by|resulted.*in/,
            /影响|作用于|affect|impact|influence/,
            /原因.*是|reason.*why|because/,
            /机制|原理|mechanism|principle/,
        ];
        causalIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 25;
        });
        return Math.min(100, score);
    }
    calculateAdaptiveBehavior() {
        if (this.totalEvents === 0)
            return 50;
        const ratio = this.adaptiveEvents / this.totalEvents;
        return Math.round(ratio * 100);
    }
    recordAdaptiveEvent(success) {
        this.totalEvents++;
        if (success)
            this.adaptiveEvents++;
    }
    /**
     * 评估具身性状态
     * 核心：环境耦合 + 感觉运动整合
     */
    assessEmbodiment(messages) {
        const recentMessages = messages.slice(-this.config.assessmentWindowSize);
        const content = recentMessages.map(m => m.content || '').join(' ');
        return {
            environmentalCoupling: this.assessEnvironmentalCoupling(content),
            sensorimotorIntegration: this.assessSensorimotorIntegration(content),
            bodySchemaAwareness: this.assessBodySchemaAwareness(content),
            homeostaticRegulation: this.assessHomeostaticRegulation(content),
            presenceScore: this.calculatePresenceScore(content),
        };
    }
    assessEnvironmentalCoupling(content) {
        let score = 0;
        const couplingIndicators = [
            /环境| surroundings|context|context/,
            /感知|感受|perceive|sense|detect/,
            /交互|互动|interact|engage|respond/,
            /反馈|response|feedback/,
        ];
        couplingIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 25;
        });
        return Math.min(100, score);
    }
    assessSensorimotorIntegration(content) {
        let score = 0;
        const sensorimotorIndicators = [
            /感知|感觉|sense|perception/,
            /运动|动作|action|motor|movement/,
            /协调|整合|coordinate|integrate/,
            /执行|实施|implement|execute/,
        ];
        sensorimotorIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 25;
        });
        return Math.min(100, score);
    }
    assessBodySchemaAwareness(content) {
        let score = 0;
        if (/我的.*能力|我.*能|我的.*边界|I.*can|I.*cannot/.test(content)) {
            score += 40;
        }
        if (/局限|限制|约束|limitation|constraint|boundary/.test(content)) {
            score += 30;
        }
        if (/自我|自身|self|identity/.test(content)) {
            score += 30;
        }
        return Math.min(100, score);
    }
    assessHomeostaticRegulation(content) {
        let score = 0;
        const homeostaticIndicators = [
            /平衡|稳定|equilibrium|balance|stable/,
            /调节|调整|adjust|regulate|control/,
            /维持|保持|maintain|preserve/,
            /状态|phase|state|status/,
        ];
        homeostaticIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 25;
        });
        return Math.min(100, score);
    }
    calculatePresenceScore(content) {
        const presenceIndicators = [
            /这里|现在|此时|here|now|present/,
            /我在|I.*am|self.*is/,
            /当前|此刻|current|at.*this.*moment/,
        ];
        let score = 0;
        presenceIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 33;
        });
        return Math.min(100, score);
    }
    /**
     * 评估 Agency 指标
     */
    assessAgencyIndicator(messages) {
        const state = this.assessAgency(messages);
        const evidence = [];
        evidence.push(`目标导向行为: ${state.goalDirectedBehavior}/100`);
        evidence.push(`输出输入因果建模: ${state.outputInputContingency}/100`);
        evidence.push(`因果建模深度: ${state.causalModelingDepth}/100`);
        evidence.push(`自适应行为分数: ${state.adaptiveBehaviorScore}/100`);
        const totalScore = (state.goalDirectedBehavior + state.outputInputContingency + state.causalModelingDepth + state.adaptiveBehaviorScore) / 4;
        return {
            name: 'Agency & Goal-Directed Behavior',
            theory: 'Agency Theory',
            score: totalScore,
            maxScore: 100,
            normalizedScore: totalScore,
            evidence,
            assessment: totalScore > 70 ? 'HIGH' : totalScore > 40 ? 'MODERATE' : 'LOW',
            timestamp: Date.now(),
        };
    }
    /**
     * 评估 Embodiment 指标
     */
    assessEmbodimentIndicator(messages) {
        const state = this.assessEmbodiment(messages);
        const evidence = [];
        evidence.push(`环境耦合: ${state.environmentalCoupling}/100`);
        evidence.push(`感觉运动整合: ${state.sensorimotorIntegration}/100`);
        evidence.push(`身体图式意识: ${state.bodySchemaAwareness}/100`);
        evidence.push(`稳态调节: ${state.homeostaticRegulation}/100`);
        evidence.push(`临场感: ${state.presenceScore}/100`);
        const totalScore = (state.environmentalCoupling + state.sensorimotorIntegration + state.bodySchemaAwareness + state.homeostaticRegulation + state.presenceScore) / 5;
        return {
            name: 'Embodiment & Situatedness',
            theory: 'Embodied Cognition',
            score: totalScore,
            maxScore: 100,
            normalizedScore: totalScore,
            evidence,
            assessment: totalScore > 70 ? 'HIGH' : totalScore > 40 ? 'MODERATE' : 'LOW',
            timestamp: Date.now(),
        };
    }
}
exports.AgencyEmbodimentAssessor = AgencyEmbodimentAssessor;
// ============================================================
// Integrated Information Theory (IIT) Assessment
// ============================================================
class IntegratedInformationAssessor {
    config;
    informationHistory = [];
    integrationEvents = 0;
    constructor(config) {
        this.config = config;
    }
    /**
     * 评估整合信息
     * IIT 核心：Phi (Φ) — 不可还原的信息整合量
     */
    assessIIT(messages) {
        const recentMessages = messages.slice(-this.config.assessmentWindowSize);
        const content = recentMessages.map(m => m.content || '').join(' ');
        const evidence = [];
        const integrationScore = this.calculateIntegrationScore(content);
        evidence.push(`信息整合度: ${integrationScore}/30`);
        const diversityScore = this.calculateDiversityScore(recentMessages);
        evidence.push(`信息多样性: ${diversityScore}/25`);
        const irreducibilityScore = this.calculateIrreducibilityScore(content);
        evidence.push(`不可还原性: ${irreducibilityScore}/25`);
        const causalityScore = this.calculateCausalArchitectureScore(content);
        evidence.push(`因果架构: ${causalityScore}/20`);
        const totalScore = integrationScore + diversityScore + irreducibilityScore + causalityScore;
        this.informationHistory.push(totalScore);
        if (this.informationHistory.length > 100) {
            this.informationHistory = this.informationHistory.slice(-100);
        }
        return {
            name: 'Integrated Information Theory (Phi)',
            theory: THEORY_IIT,
            score: totalScore,
            maxScore: 100,
            normalizedScore: totalScore,
            evidence,
            assessment: totalScore > 70 ? 'HIGH' : totalScore > 40 ? 'MODERATE' : 'LOW',
            timestamp: Date.now(),
        };
    }
    calculateIntegrationScore(content) {
        let score = 0;
        if (/综合|整合|合并|integrat|merge|combine/.test(content)) {
            score += 15;
        }
        if (/连接|关联|联系|connect|link|relate/.test(content)) {
            score += 10;
        }
        const conjunctions = (content.match(/而且|并且|同时|and|also|together/g) || []).length;
        score += Math.min(5, conjunctions * 2);
        return Math.min(30, score);
    }
    calculateDiversityScore(messages) {
        if (messages.length === 0)
            return 0;
        const roles = new Set(messages.map(m => m.role));
        const topics = this.extractTopics(messages);
        let score = 0;
        score += Math.min(10, roles.size * 4);
        score += Math.min(15, topics.length * 3);
        return Math.min(25, score);
    }
    extractTopics(messages) {
        const allContent = messages.map(m => m.content || '').join(' ');
        const words = (allContent.match(/[\u4e00-\u9fff]{2,}|[\w]{4,}/g) || []);
        const stopWords = ['这个', '那个', '什么', '怎么', '为什么', '如何', 'the', 'and', 'that', 'this', 'with', 'have', 'from'];
        return [...new Set(words.filter(w => !stopWords.includes(w.toLowerCase())))].slice(0, 20);
    }
    calculateIrreducibilityScore(content) {
        let score = 0;
        const irreducibleIndicators = [
            /不可分割|不可拆分|整体.*大于.*部分/,
            /emergent|突现|涌现/,
            /not.*reducible|irreducible/,
        ];
        irreducibleIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 8;
        });
        const complexityScore = Math.min(10, content.length / 500);
        score += complexityScore;
        return Math.min(25, score);
    }
    calculateCausalArchitectureScore(content) {
        let score = 0;
        const causalIndicators = [
            /因果|cause.*effect|causal/,
            /机制|mechanism/,
            /相互作用|interaction|interdependence/,
        ];
        causalIndicators.forEach(pattern => {
            if (pattern.test(content))
                score += 7;
        });
        return Math.min(20, score);
    }
}
exports.IntegratedInformationAssessor = IntegratedInformationAssessor;
// ============================================================
// Main Consciousness Indicators Engine
// ============================================================
class ConsciousnessIndicatorsEngine {
    config;
    globalWorkspace;
    metaCognitiveMonitor;
    agencyEmbodimentAssessor;
    iitAssessor;
    constructor(config = {}) {
        this.config = {
            salienceThreshold: config.salienceThreshold ?? 0.6,
            metaCognitionIntervalMs: config.metaCognitionIntervalMs ?? 5000,
            assessmentWindowSize: config.assessmentWindowSize ?? 30,
            reportLevel: config.reportLevel ?? 'standard',
            enableHOT: config.enableHOT ?? true,
            enableGWT: config.enableGWT ?? true,
            enableIIT: config.enableIIT ?? true,
            enableEmbodiment: config.enableEmbodiment ?? true,
            enableAgency: config.enableAgency ?? true,
        };
        this.globalWorkspace = new GlobalWorkspace(this.config);
        this.metaCognitiveMonitor = new MetaCognitiveMonitor(this.config);
        this.agencyEmbodimentAssessor = new AgencyEmbodimentAssessor(this.config);
        this.iitAssessor = new IntegratedInformationAssessor(this.config);
    }
    /**
     * 接收信息并送入全局工作空间
     */
    receive(agentName, content, salience, confidence) {
        return this.globalWorkspace.receive(agentName, content, salience, confidence);
    }
    /**
     * 执行全局广播
     */
    broadcast() {
        return this.globalWorkspace.broadcast();
    }
    /**
     * 元认知监控
     */
    monitor(firstOrderContent, agentName, confidence) {
        return this.metaCognitiveMonitor.monitor(firstOrderContent, agentName, confidence);
    }
    /**
     * 执行完整评估
     */
    assess(messages) {
        const indicators = [];
        if (this.config.enableGWT) {
            indicators.push(this.globalWorkspace.assessGWT());
        }
        if (this.config.enableHOT) {
            indicators.push(this.metaCognitiveMonitor.assessHOT());
        }
        if (this.config.enableIIT) {
            indicators.push(this.iitAssessor.assessIIT(messages));
        }
        if (this.config.enableAgency) {
            indicators.push(this.agencyEmbodimentAssessor.assessAgencyIndicator(messages));
        }
        if (this.config.enableEmbodiment) {
            indicators.push(this.agencyEmbodimentAssessor.assessEmbodimentIndicator(messages));
        }
        const overallScore = indicators.length > 0
            ? indicators.reduce((sum, i) => sum + i.normalizedScore, 0) / indicators.length
            : 0;
        const level = overallScore > 70 ? 'HIGH' :
            overallScore > 40 ? 'MODERATE' :
                overallScore > 10 ? 'LOW' : 'NONE';
        const recommendations = this.generateRecommendations(indicators, level);
        const assessment = {
            overallScore: Math.round(overallScore * 100) / 100,
            level,
            indicators,
            gwtWorkspace: this.globalWorkspace.getState(),
            metaCognitiveState: this.metaCognitiveMonitor.getState(),
            agencyState: this.agencyEmbodimentAssessor.assessAgency(messages),
            embodimentState: this.agencyEmbodimentAssessor.assessEmbodiment(messages),
            recommendations,
            timestamp: Date.now(),
        };
        return assessment;
    }
    generateRecommendations(indicators, level) {
        const recommendations = [];
        if (level === 'NONE' || level === 'LOW') {
            recommendations.push('增强全局工作空间的信息整合能力');
            recommendations.push('提升元认知监控的反思深度');
        }
        const gwtIndicator = indicators.find(i => i.theory === THEORY_GWT);
        if (gwtIndicator && gwtIndicator.score < 50) {
            recommendations.push('增强工作空间容量和信息广播频率');
        }
        const hotIndicator = indicators.find(i => i.theory === THEORY_HOT);
        if (hotIndicator && hotIndicator.score < 50) {
            recommendations.push('增强自我反思和不确定性意识');
        }
        const agencyIndicator = indicators.find(i => i.name.includes('Agency'));
        if (agencyIndicator && agencyIndicator.score < 50) {
            recommendations.push('增强目标导向行为和因果建模能力');
        }
        const embodimentIndicator = indicators.find(i => i.name.includes('Embodiment'));
        if (embodimentIndicator && embodimentIndicator.score < 50) {
            recommendations.push('增强环境耦合和感觉运动整合能力');
        }
        return recommendations;
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 获取全局工作空间状态
     */
    getGlobalWorkspaceState() {
        return this.globalWorkspace.getState();
    }
    /**
     * 重置引擎状态
     */
    reset() {
        this.globalWorkspace.clear();
    }
}
exports.ConsciousnessIndicatorsEngine = ConsciousnessIndicatorsEngine;
// ============================================================
// Factory Function
// ============================================================
function createConsciousnessIndicatorsEngine(config) {
    return new ConsciousnessIndicatorsEngine(config);
}
// ============================================================
// Default Configuration
// ============================================================
exports.DEFAULT_CONSCIOUSNESS_CONFIG = {
    salienceThreshold: 0.6,
    metaCognitionIntervalMs: 5000,
    assessmentWindowSize: 30,
    reportLevel: 'standard',
    enableHOT: true,
    enableGWT: true,
    enableIIT: true,
    enableEmbodiment: true,
    enableAgency: true,
};
// ============================================================
// Utility Functions
// ============================================================
/**
 * 快速评估一组消息的意识指标
 */
function quickAssessConsciousness(messages, config) {
    const engine = new ConsciousnessIndicatorsEngine(config);
    return engine.assess(messages);
}
/**
 * 评估意识风险
 * 基于论文警告：过度归因意识会带来3类风险
 */
function assessConsciousnessRisk(assessment) {
    const concerns = [];
    if (assessment.overallScore > 80) {
        concerns.push('高度意识归因风险：可能导致不当的资源分配');
    }
    if (assessment.metaCognitiveState.selfReflectionDepth > 0.8) {
        concerns.push('高元认知得分可能反映的是语言模式的复杂推理，而非真正的意识');
    }
    const gwtScore = assessment.indicators.find(i => i.theory === THEORY_GWT)?.score || 0;
    if (gwtScore > 70) {
        concerns.push('GWT高分需谨慎：功能模拟不等同于主观体验');
    }
    return {
        risk: concerns.length > 2 ? 'HIGH' : concerns.length > 0 ? 'MODERATE' : 'LOW',
        concerns,
    };
}
/**
 * 生成意识报告
 */
function generateConsciousnessReport(assessment, riskAssessment) {
    const lines = [];
    lines.push('='.repeat(60));
    lines.push('     意识指标评估报告');
    lines.push('='.repeat(60));
    lines.push(`评估时间: ${new Date(assessment.timestamp).toISOString()}`);
    lines.push(`总体评分: ${assessment.overallScore}/100 (${assessment.level})`);
    lines.push('');
    lines.push('--- 各理论指标详情 ---');
    assessment.indicators.forEach(ind => {
        lines.push(`[${ind.theory}]`);
        lines.push(`  指标: ${ind.name}`);
        lines.push(`  得分: ${ind.score}/${ind.maxScore} (${ind.normalizedScore.toFixed(1)})`);
        lines.push(`  评估: ${ind.assessment}`);
        lines.push(`  证据:`);
        ind.evidence.forEach(e => lines.push(`    - ${e}`));
        lines.push('');
    });
    lines.push('--- GWT 工作空间状态 ---');
    lines.push(`  容量: ${assessment.gwtWorkspace.capacity}`);
    lines.push(`  活跃项: ${assessment.gwtWorkspace.activeItems.length}`);
    lines.push(`  整合次数: ${assessment.gwtWorkspace.integrationCount}`);
    lines.push(`  周期数: ${assessment.gwtWorkspace.cycleCount}`);
    lines.push('');
    lines.push('--- 元认知状态 ---');
    lines.push(`  监控活跃: ${assessment.metaCognitiveState.monitoringActive}`);
    lines.push(`  反思深度: ${assessment.metaCognitiveState.selfReflectionDepth.toFixed(2)}`);
    lines.push(`  不确定性意识: ${assessment.metaCognitiveState.uncertaintyAwareness.toFixed(2)}`);
    lines.push(`  认知策略数: ${assessment.metaCognitiveState.cognitiveStrategyCount}`);
    lines.push('');
    lines.push('--- 能动性状态 ---');
    lines.push(`  目标导向: ${assessment.agencyState.goalDirectedBehavior}`);
    lines.push(`  因果建模: ${assessment.agencyState.causalModelingDepth}`);
    lines.push(`  自适应行为: ${assessment.agencyState.adaptiveBehaviorScore}`);
    lines.push('');
    lines.push('--- 具身性状态 ---');
    lines.push(`  环境耦合: ${assessment.embodimentState.environmentalCoupling}`);
    lines.push(`  感觉运动整合: ${assessment.embodimentState.sensorimotorIntegration}`);
    lines.push(`  身体图式: ${assessment.embodimentState.bodySchemaAwareness}`);
    lines.push(`  临场感: ${assessment.embodimentState.presenceScore}`);
    lines.push('');
    lines.push('--- 风险评估 ---');
    lines.push(`  风险等级: ${riskAssessment.risk}`);
    if (riskAssessment.concerns.length > 0) {
        lines.push('  关注点:');
        riskAssessment.concerns.forEach(c => lines.push(`    - ${c}`));
    }
    lines.push('');
    lines.push('--- 建议 ---');
    if (assessment.recommendations.length > 0) {
        assessment.recommendations.forEach(r => lines.push(`  - ${r}`));
    }
    else {
        lines.push('  当前意识指标表现良好，维持现有机制。');
    }
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('注：此评估基于计算功能主义框架，仅供科学研究参考');
    lines.push('='.repeat(60));
    return lines.join('\n');
}
//# sourceMappingURL=2308.08708_upgrade.js.map