/**
 * Cognitive-Loop - 结构化认知循环引擎
 * 
 * 实现五阶段认知循环：检索 → 认知 → 控制 → 行动 → 记忆
 * 整合 Kahneman 双系统、Friston 预测加工、Minsky 心智社会、Clark 延展心智
 * 
 * 理论基础：Agentic Flow 架构的 R-CCAM 五模块协同
 */

class CognitiveLoop {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    // 循环状态
    this.state = {
      currentPhase: 'idle', // idle/retrieval/cognition/control/action/memory
      cycleCount: 0,
      history: [],
      currentContext: null
    };
    
    // 阶段配置
    this.phases = {
      RETRIEVAL: 'retrieval',
      COGNITION: 'cognition',
      CONTROL: 'control',
      ACTION: 'action',
      MEMORY: 'memory'
    };
    
    // 依赖模块 (延迟加载)
    this.modules = {};
    
    console.log('[CognitiveLoop] 结构化认知循环引擎初始化');
  }

  /**
   * 设置依赖模块
   */
  setModules(modules) {
    this.modules = {
      memory: modules.memory,           // TrialityMemory
      cognitiveEngine: modules.cognitiveEngine, // 般若推理引擎
      ethicsGuard: modules.ethicsGuard, // 伦理守护
      sageGuardian: modules.sageGuardian, // SAGE 守护
      reflector: modules.reflector,     // 说前反思
      symbolicGovernance: modules.symbolicGovernance, // 符号化治理
      ...modules
    };
  }

  /**
   * 执行完整认知循环
   * @param {object} input - 用户输入
   * @param {object} context - 上下文
   * @returns {object} 循环结果
   */
  async execute(input, context = {}) {
    const cycleStart = Date.now();
    this.state.currentContext = { input, context, cycleStart };
    this.state.currentPhase = this.phases.RETRIEVAL;
    this.state.cycleCount++;
    
    const trace = {
      cycleId: this.state.cycleCount,
      phases: {},
      startTime: new Date().toISOString()
    };

    try {
      // === 阶段 1: 检索 (Retrieval) ===
      trace.phases.retrieval = await this.phaseRetrieval(input, context);
      this.state.currentPhase = this.phases.COGNITION;
      
      // === 阶段 2: 认知 (Cognition) ===
      trace.phases.cognition = await this.phaseCognition(input, context, trace.phases.retrieval);
      this.state.currentPhase = this.phases.CONTROL;
      
      // === 阶段 3: 控制 (Control) ===
      trace.phases.control = await this.phaseControl(input, context, trace.phases.cognition);
      this.state.currentPhase = this.phases.ACTION;
      
      // === 阶段 4: 行动 (Action) ===
      trace.phases.action = await this.phaseAction(input, context, trace.phases.control);
      this.state.currentPhase = this.phases.MEMORY;
      
      // === 阶段 5: 记忆 (Memory) ===
      trace.phases.memory = await this.phaseMemory(input, context, trace.phases);
      
      this.state.currentPhase = 'idle';
      trace.endTime = new Date().toISOString();
      trace.duration = Date.now() - cycleStart;
      trace.success = true;
      
      this.state.history.push(trace);
      
      return {
        success: true,
        response: trace.phases.action?.response,
        trace: trace
      };
      
    } catch (error) {
      this.state.currentPhase = 'error';
      trace.error = error.message;
      trace.success = false;
      
      return {
        success: false,
        error: error.message,
        trace: trace
      };
    }
  }

  /**
   * 阶段 1: 检索 - 从记忆系统获取相关信息
   */
  async phaseRetrieval(input, context) {
    const startTime = Date.now();
    
    let relevantMemories = [];
    let associations = [];
    
    // 从 TrialityMemory 检索
    if (this.modules.memory) {
      // 语义搜索
      const queryEmbedding = this.modules.memory.generateMockEmbedding(input);
      relevantMemories = this.modules.memory.semanticSearch(queryEmbedding, 5);
      
      // 叙事查询
      if (context.lastMemoryId) {
        const narrative = this.modules.memory.narrativeQuery({
          startMemoryId: context.lastMemoryId,
          direction: 'bidirectional',
          maxDepth: 3
        });
        relevantMemories = [...relevantMemories, ...narrative];
      }
    }
    
    // 联想图谱检索 (如果有)
    if (this.modules.associationGraph) {
      associations = this.modules.associationGraph.associate(input);
    }
    
    return {
      memories: relevantMemories.slice(0, 10),
      associations: associations.slice(0, 5),
      duration: Date.now() - startTime,
      retrieved: relevantMemories.length + associations.length
    };
  }

  /**
   * 阶段 2: 认知 - 般若推理和意图分析
   */
  async phaseCognition(input, context, retrievalResult) {
    const startTime = Date.now();
    
    let analysis = {
      intent: null,
      entities: [],
      reasoning: null,
      pad: null,
      flowState: null
    };
    
    // 意图分析
    if (this.modules.cognitiveEngine?.analyzeIntent) {
      analysis.intent = await this.modules.cognitiveEngine.analyzeIntent(input, {
        memories: retrievalResult.memories,
        context: context
      });
    }
    
    // PAD 情感计算
    if (this.modules.emotionEngine?.detectEmotionFromText) {
      analysis.pad = this.modules.emotionEngine.detectEmotionFromText(input);
    }
    
    // 心流状态
    if (this.modules.flowPredictor?.calculateFlowState) {
      analysis.flowState = this.modules.flowPredictor.calculateFlowState(
        analysis.pad?.pleasure || 0,
        analysis.pad?.arousal || 0,
        analysis.pad?.dominance || 0,
        context.challengeLevel || 5,
        context.skillLevel || 5
      );
    }
    
    // 般若推理 (如果有)
    if (this.modules.cognitiveEngine?.reasoning) {
      analysis.reasoning = await this.modules.cognitiveEngine.reasoning(input, {
        memories: retrievalResult.memories,
        pad: analysis.pad
      });
    }
    
    return {
      ...analysis,
      duration: Date.now() - startTime
    };
  }

  /**
   * 阶段 3: 控制 - 伦理审查与决策仲裁
   */
  async phaseControl(input, context, cognitionResult) {
    const startTime = Date.now();
    
    let decision = {
      approved: true,
      requiresReview: false,
      modifications: [],
      ethicsScore: null
    };
    
    // 符号化治理约束检查
    if (this.modules.symbolicGovernance?.checkConstraints) {
      const constraintResult = this.modules.symbolicGovernance.checkConstraints(
        input,
        cognitionResult
      );
      
      if (!constraintResult.approved) {
        decision.approved = false;
        decision.rejectionReason = constraintResult.reason;
        return { ...decision, duration: Date.now() - startTime };
      }
      
      decision.modifications = constraintResult.modifications || [];
    }
    
    // SAGE 守护伦理审查
    if (this.modules.sageGuardian?.reviewProposal) {
      const sageResult = await this.modules.sageGuardian.reviewProposal(
        { description: input },
        { cognition: cognitionResult }
      );
      
      decision.ethicsScore = sageResult;
      
      if (!sageResult.passed) {
        decision.approved = false;
        decision.rejectionReason = sageResult.violations;
      }
    }
    
    // 道德评分
    if (this.modules.ethicsGuard?.evaluate) {
      const ethicsResult = this.modules.ethicsGuard.evaluate(input, cognitionResult);
      decision.ethicsScore = ethicsResult.score;
    }
    
    return {
      ...decision,
      duration: Date.now() - startTime
    };
  }

  /**
   * 阶段 4: 行动 - 生成回复并说前反思
   */
  async phaseAction(input, context, controlResult) {
    const startTime = Date.now();
    
    let response = '';
    let reflection = null;
    
    if (!controlResult.approved) {
      response = this.generateRejectionResponse(controlResult.rejectionReason);
    } else {
      // 生成回复草稿
      response = await this.generateResponse(input, context, {
        cognition: controlResult,
        memories: context.retrievedMemories
      });
      
      // 说前反思
      if (this.modules.reflector?.reflect) {
        reflection = await this.modules.reflector.reflect(response, {
          input: input,
          cognition: controlResult,
          context: context
        });
        
        // 如果反思发现问题，修改回复
        if (reflection.requiresModification) {
          response = reflection.modifiedResponse;
        }
      }
    }
    
    return {
      response,
      reflection,
      controlResult,
      duration: Date.now() - startTime
    };
  }

  /**
   * 生成回复
   */
  async generateResponse(input, context, state) {
    // 简化实现 - 实际会调用 LLM
    const cognition = state.cognition;
    
    let response = '';
    
    // 根据情感状态调整回复
    if (cognition.pad) {
      if (cognition.pad.pleasure < -3) {
        response = '我能感受到你现在的情绪。';
      } else if (cognition.pad.pleasure > 3) {
        response = '很高兴能帮到你！';
      }
    }
    
    // 根据心流状态调整
    if (cognition.flowState?.state === 'anxiety') {
      response += ' 看起来你可能感到压力，我们可以一起分析一下。';
    }
    
    return response || '让我来帮你分析这个问题...';
  }

  /**
   * 生成拒绝回复
   */
  generateRejectionResponse(reason) {
    if (typeof reason === 'string' && reason.includes('伦理')) {
      return '我无法协助这项请求，因为这可能违反我的伦理原则。但我可以帮你探讨其他合法的替代方案。';
    }
    return '很抱歉，我无法完成这个请求。';
  }

  /**
   * 阶段 5: 记忆 - 写入记忆并更新人格状态
   */
  async phaseMemory(input, context, trace) {
    const startTime = Date.now();
    
    let memoryId = null;
    let personalityUpdate = null;
    
    // 写入记忆系统
    if (this.modules.memory) {
      const memoryRecord = {
        content: input,
        timestamp: Date.now() * 1000,
        metadata: {
          cycleId: trace.cycleId,
          pad: trace.phases.cognition?.pad,
          flowState: trace.phases.cognition?.flowState?.state,
          intent: trace.phases.cognition?.intent
        }
      };
      
      memoryId = this.modules.memory.store(memoryRecord);
    }
    
    // 更新人格状态 (如果有)
    if (this.modules.personalityEngine?.update) {
      personalityUpdate = this.modules.personalityEngine.update({
        input: input,
        response: trace.phases.action?.response,
        cognition: trace.phases.cognition
      });
    }
    
    return {
      memoryId,
      personalityUpdate,
      duration: Date.now() - startTime
    };
  }

  /**
   * 获取循环状态
   */
  getStatus() {
    return {
      currentPhase: this.state.currentPhase,
      cycleCount: this.state.cycleCount,
      lastCycle: this.state.history[this.state.history.length - 1] || null
    };
  }

  /**
   * 获取循环历史
   */
  getHistory(limit = 10) {
    return this.state.history.slice(-limit);
  }

  /**
   * 重置循环状态
   */
  reset() {
    this.state = {
      currentPhase: 'idle',
      cycleCount: 0,
      history: [],
      currentContext: null
    };
    console.log('[CognitiveLoop] 循环状态已重置');
    return { success: true };
  }
}

module.exports = { CognitiveLoop };