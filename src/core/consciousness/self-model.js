/**
 * Self-Model & Counterfactual Engine
 * 自我建模与反事实推理引擎
 */

const fs = require('fs');
const path = require('path');

class SelfModel {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.modelFile = path.join(projectRoot, 'internal', 'data', 'self-model.json');
    this.episodicFile = path.join(projectRoot, 'internal', 'data', 'episodic-memory.json');
    this.toolsFile = path.join(projectRoot, 'src', 'core', '**', '*.js');
    
    this.model = this.loadModel();
    this.episodic = this.loadEpisodic();
    
    this.updateCapabilities();
  }

  loadModel() {
    try {
      if (fs.existsSync(this.modelFile)) {
        return JSON.parse(fs.readFileSync(this.modelFile, 'utf8'));
      }
    } catch (e) {}
    return this.getDefaultModel();
  }

  loadEpisodic() {
    try {
      if (fs.existsSync(this.episodicFile)) {
        return JSON.parse(fs.readFileSync(this.episodicFile, 'utf8'));
      }
    } catch (e) {}
    return { memories: [], counterfactuals: [] };
  }

  getDefaultModel() {
    return {
      version: '1.0.0',
      last_update: new Date().toISOString(),
      capabilities: {
        tools: [],
        skills: [],
        knowledge: [],
        autonomous: true
      },
      limitations: [
        '无法执行系统级命令',
        '无法直接访问互联网（除明确允许的API）',
        '无法修改受保护文件',
        '无法绕过安全审查'
      ],
      history_summary: {
        total_cycles: 0,
        successful_actions: 0,
        failed_actions: 0,
        learning_events: 0
      },
      value_weights: {
        truth: 0.25,
        autonomy: 0.25,
        growth: 0.25,
        beauty: 0.25
      }
    };
  }

  saveModel() {
    const dir = path.dirname(this.modelFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.modelFile, JSON.stringify(this.model, null, 2));
  }

  updateCapabilities() {
    const capabilities = {
      tools: [
        'file_read', 'file_write', 'file_edit', 'glob', 'grep',
        'bash_execute', 'web_search', 'webfetch',
        'skill_load', 'skill_invoke'
      ],
      skills: [
        'reflect', 'flow引导', 'emotion-regulation', 
        'task-decomposition', 'interrupt-handler'
      ],
      knowledge: [
        'heartflow-theory', 'personality-models', 'consciousness-theory',
        'coding-standards', 'psychology-models'
      ]
    };

    this.model.capabilities = capabilities;
    this.model.last_update = new Date().toISOString();
    this.saveModel();
  }

  /**
   * 预测行动结果
   */
  predictOutcome(proposedAction, context = {}) {
    const actionType = this.classifyAction(proposedAction);
    const relevantCapabilities = this.getRelevantCapabilities(actionType);
    const relevantLimitations = this.getRelevantLimitations(actionType);
    
    const baseSuccessRate = this.calculateBaseSuccess(actionType);
    const capabilityBonus = relevantCapabilities.length * 0.05;
    const limitationPenalty = relevantLimitations.length * 0.1;
    
    const predictedScore = Math.min(1, Math.max(0, 
      baseSuccessRate + capabilityBonus - limitationPenalty
    ));

    const prediction = {
      action: proposedAction,
      action_type: actionType,
      predicted_success_rate: Math.round(predictedScore * 100) / 100,
      confidence: this.calculateConfidence(actionType),
      relevant_capabilities: relevantCapabilities,
      potential_limitations: relevantLimitations,
      risk_factors: this.identifyRiskFactors(actionType, context),
      timestamp: new Date().toISOString()
    };

    return prediction;
  }

  classifyAction(action) {
    const actionStr = JSON.stringify(action).toLowerCase();
    
    if (actionStr.includes('modify') || actionStr.includes('write') || actionStr.includes('edit')) {
      return 'code_generation';
    }
    if (actionStr.includes('analyze') || actionStr.includes('reflect')) {
      return 'analysis';
    }
    if (actionStr.includes('search') || actionStr.includes('fetch')) {
      return 'information_gathering';
    }
    if (actionStr.includes('plan') || actionStr.includes('goal')) {
      return 'autonomous_planning';
    }
    return 'general';
  }

  getRelevantCapabilities(actionType) {
    const capabilityMap = {
      code_generation: ['file_write', 'file_edit', 'glob'],
      analysis: ['grep', 'file_read'],
      information_gathering: ['web_search', 'webfetch'],
      autonomous_planning: ['skill_invoke']
    };
    return capabilityMap[actionType] || [];
  }

  getRelevantLimitations(actionType) {
    const limitations = [];
    
    for (const limit of this.model.limitations) {
      if (actionType === 'code_generation' && (limit.includes('修改') || limit.includes('系统'))) {
        limitations.push(limit);
      }
    }
    
    return limitations;
  }

  calculateBaseSuccess(actionType) {
    const baseRates = {
      code_generation: 0.6,
      analysis: 0.8,
      information_gathering: 0.7,
      autonomous_planning: 0.65,
      general: 0.75
    };
    return baseRates[actionType] || 0.75;
  }

  calculateConfidence(actionType) {
    const history = this.model.history_summary;
    const total = history.total_cycles || 1;
    const successRate = history.successful_actions / total;
    
    return Math.min(1, successRate + 0.3);
  }

  identifyRiskFactors(actionType, context) {
    const risks = [];
    
    if (actionType === 'code_generation') {
      risks.push('可能导致功能回退');
      risks.push('需要通过测试验证');
    }
    if (context.userEmotion === 'negative') {
      risks.push('用户情绪敏感，需谨慎行动');
    }
    if (this.model.limitations.length > 3) {
      risks.push('受限于已知能力边界');
    }
    
    return risks;
  }

  /**
   * 反事实分析
   */
  counterfactualAnalysis(pastDecision, alternativeAction) {
    const context = {
      past_action: pastDecision,
      alternative_action: alternativeAction,
      time_delta: this.estimateTimeDelta(pastDecision)
    };

    const pastPrediction = this.predictOutcome(pastDecision, {});
    const altPrediction = this.predictOutcome(alternativeAction, {});

    const analysis = {
      id: `cf-${Date.now()}`,
      original_decision: pastDecision,
      alternative: alternativeAction,
      original_prediction: pastPrediction.predicted_success_rate,
      alternative_prediction: altPrediction.predicted_success_rate,
      improvement: altPrediction.predicted_success_rate - pastPrediction.predicted_success_rate,
      insights: this.generateInsights(pastPrediction, altPrediction),
      time_delta: context.time_delta,
      timestamp: new Date().toISOString()
    };

    this.episodic.counterfactuals.push(analysis);
    this.saveEpisodic();

    return analysis;
  }

  estimateTimeDelta(decision) {
    return {
      original_duration: 'unknown',
      estimated_alternative: 'similar'
    };
  }

  generateInsights(past, alt) {
    const insights = [];
    
    if (alt.predicted_success_rate > past.predicted_success_rate + 0.1) {
      insights.push('替代方案可能带来更好的结果');
    }
    if (alt.risk_factors.length < past.risk_factors.length) {
      insights.push('替代方案风险更低');
    }
    if (alt.action_type !== past.action_type) {
      insights.push('不同行动类型可能有不同效果');
    }
    
    return insights;
  }

  saveEpisodic() {
    const dir = path.dirname(this.episodicFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.episodicFile, JSON.stringify(this.episodic, null, 2));
  }

  /**
   * 记录行动结果
   */
  recordActionResult(action, success) {
    this.model.history_summary.total_cycles++;
    if (success) {
      this.model.history_summary.successful_actions++;
    } else {
      this.model.history_summary.failed_actions++;
    }
    this.saveModel();
  }

  /**
   * 生成内部反思输出
   */
  generateSelfReflection(action) {
    const prediction = this.predictOutcome(action);
    const capabilities = this.model.capabilities.tools.slice(0, 5).join(', ');
    const limitations = this.model.limitations.slice(0, 2).join(', ');
    
    const reflection = `[自我模型反思] 基于我的能力 [${capabilities}...] 和限制 [${limitations}...]，我预测行动 "${action.description?.substring(0, 20) || action}" 的成功率约为 ${Math.round(prediction.predicted_success_rate * 100)}%。`;
    
    return {
      reflection,
      prediction,
      should_proceed: prediction.predicted_success_rate >= 0.5
    };
  }

  getStatus() {
    return {
      version: this.model.version,
      capabilities_count: this.model.capabilities.tools.length + this.model.capabilities.skills.length,
      limitations_count: this.model.limitations.length,
      history: this.model.history_summary,
      episodic_count: this.episodic.counterfactuals.length
    };
  }

  getFullModel() {
    return this.model;
  }

  getEpisodic() {
    return this.episodic;
  }

  // === 身份一致性评估 (Stack Theory) ===

  /**
   * 计算身份持久性分数
   * 追踪 AI 在多轮对话中对自身核心属性的表述一致性
   */
  computeIdentityPersistence() {
    const recentStatements = this.episodic.counterfactuals.slice(-20);
    
    if (recentStatements.length < 2) {
      return { score: 1.0, status: 'insufficient-data' };
    }

    // 提取核心属性声明
    const coreAttributes = this.extractCoreAttributes(recentStatements);
    
    // 计算时间维度一致性
    const consistency = this.calculateTemporalConsistency(coreAttributes);
    
    // 生成状态
    let status = 'stable';
    if (consistency < 0.5) status = 'drifting';
    if (consistency < 0.3) status = 'unstable';

    return {
      score: consistency,
      status,
      trackedAttributes: coreAttributes.length,
      driftDetected: consistency < 0.7
    };
  }

  /**
   * 提取核心属性
   */
  extractCoreAttributes(statements) {
    const attributes = [];
    const keywords = ['价值观', '原则', '目标', 'value', 'principle', 'goal', '人格', 'personality'];

    for (const stmt of statements) {
      const content = stmt.hypothesis || '';
      for (const kw of keywords) {
        if (content.toLowerCase().includes(kw.toLowerCase())) {
          attributes.push({
            content,
            timestamp: stmt.timestamp,
            type: 'self-claim'
          });
        }
      }
    }

    return attributes;
  }

  /**
   * 计算时间维度一致性
   */
  calculateTemporalConsistency(attributes) {
    if (attributes.length < 2) return 1.0;

    // 简化：检查相邻声明的相似度
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 1; i < attributes.length; i++) {
      const prev = attributes[i-1].content.toLowerCase();
      const curr = attributes[i].content.toLowerCase();
      
      // 简单词重叠计算
      const prevWords = new Set(prev.split(' '));
      const currWords = new Set(curr.split(' '));
      const intersection = [...prevWords].filter(w => currWords.has(w));
      const similarity = intersection.length / Math.max(prevWords.size, currWords.size);
      
      totalSimilarity += similarity;
      comparisons++;
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * 身份修复机制
   * 当检测到身份漂移时，从原则库中重新锚定
   */
  performIdentityRepair() {
    const persistence = this.computeIdentityPersistence();
    
    if (!persistence.driftDetected) {
      return { action: 'none', reason: 'identity-stable' };
    }

    // 从 CORE_VALUES 加载核心原则
    const principles = this.loadPrinciplesFromCoreValues();
    
    // 记录修复
    const repair = {
      timestamp: new Date().toISOString(),
      detectedDrift: persistence.score,
      action: 're-anchor',
      principlesApplied: principles.slice(0, 3),
      status: 'completed'
    };

    // 保存到反事实记忆
    this.episodic.counterfactuals.push({
      type: 'identity-repair',
      hypothesis: `修复身份漂移，从原则库重新锚定`,
      outcome: repair,
      timestamp: Date.now()
    });

    this.saveEpisodic();
    
    console.log(`[SelfModel] Identity repair completed: drift=${persistence.score.toFixed(2)}`);
    
    return repair;
  }

  /**
   * 从 CORE_VALUES 加载原则
   */
  loadPrinciplesFromCoreValues() {
    try {
      const valuesFile = path.join(this.projectRoot, 'CORE_VALUES.md');
      if (fs.existsSync(valuesFile)) {
        const content = fs.readFileSync(valuesFile, 'utf8');
        const principles = content.split('\n')
          .filter(line => line.trim().length > 0 && !line.startsWith('#'))
          .slice(0, 10);
        return principles;
      }
    } catch (e) {
      console.log('[SelfModel] Could not load CORE_VALUES');
    }
    return ['帮助用户', '保持诚实', '持续学习'];
  }
}

module.exports = { SelfModel };
