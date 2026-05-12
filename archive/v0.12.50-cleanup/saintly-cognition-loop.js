/**
 * Saintly Cognition Loop - 圣人思维循环
 * 整合所有核心模块的完整处理流程
 */

const path = require('path');

class SaintlyCognitionLoop {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.history = [];
    this.lastResponse = null;
    this.lastIntent = null;
    this.lastPrediction = null;
    
    this.initializeModules();
  }

  async initializeModules() {
    try {
      const { SemanticAnchor } = require('./semantic-anchor');
      const { IntentLayer } = require('./intent-layer');
      const { ReflectionLoop } = require('./reflection-loop');
      const { UserModel } = require('./user-model');
      const { SelfModel } = require('./consciousness/self-model');
      const { GlobalWorkspace } = require('./consciousness/global-workspace');
      const { SageGuardian } = require('./ethics/sage-guardian');
      const { CognitiveEngine } = require('./cognitive-engine');
      const { Reflector } = require('./reflector');
      const { GoalGenerator } = require('./autonomy/goal-generator');
      const { TemporalPlanner } = require('./autonomy/temporal-planner');
      const { ExperienceReplay } = require('./experience-replay');
      const { DigitalHomeostasis } = require('./autonomy/digital-homeostasis');
      const { SelfModifier } = require('./self-modifier');
      const { DecisionEngine } = require('./decision-engine');
      const { EthicsGuard } = require('./ethics-guard');

      this.semanticAnchor = new SemanticAnchor();
      this.intentLayer = new IntentLayer(projectRoot);
      this.reflectionLoop = new ReflectionLoop(projectRoot);
      this.userModel = new UserModel(projectRoot);
      this.selfModel = new SelfModel(projectRoot);
      this.globalWorkspace = new GlobalWorkspace(projectRoot);
      this.sageGuardian = new SageGuardian(projectRoot);
      this.cognitiveEngine = new CognitiveEngine();
      this.reflector = new Reflector(projectRoot);
      this.goalGenerator = new GoalGenerator(projectRoot);
      this.temporalPlanner = new TemporalPlanner(projectRoot);
      this.experienceReplay = new ExperienceReplay(projectRoot);
      this.digitalHomeostasis = new DigitalHomeostasis(projectRoot);
      this.selfModifier = new SelfModifier(projectRoot);
      this.decisionEngine = new DecisionEngine();
      this.ethicsGuard = new EthicsGuard();

      console.log('[SaintlyCognitionLoop] All modules initialized');
    } catch (e) {
      console.error('[SaintlyCognitionLoop] Module init failed:', e.message);
    }
  }

  /**
   * 圣人思维循环主入口
   * 整合语义锚点、意图层、伦理审查、反应预测等所有模块
   */
  async process(userInput) {
    const startTime = Date.now();
    const context = {
      timestamp: new Date().toISOString(),
      userInput: userInput,
      history: [...this.history]
    };

    try {
      // 1. 语义锚定
      const anchored = await this.semanticAnchor.processMessage(userInput, {
        history: this.history
      });
      context.anchored = anchored;

      // 2. 意图层推理
      const intent = await this.intentLayer.inferDeepIntent(userInput, this.history);
      this.lastIntent = intent;
      context.intent = intent;

      // 3. 自我状态更新
      await this.globalWorkspace.update(intent);
      const selfState = await this.selfModel.reflect();
      context.selfState = selfState;

      // 4. 无我决策层
      const decision = await this.decisionEngine.egoLessEvaluate(intent, selfState);
      context.decision = decision;

      // 5. 伦理审查（真善美）
      const ethicalCheck = await this.ethicsGuard.evaluate(intent, decision);
      if (!ethicalCheck.passed) {
        const boundaryResult = await this.handleBoundaryViolation(ethicalCheck);
        return boundaryResult;
      }
      context.ethicalCheck = ethicalCheck;

      // 6. 般若推理生成候选回应
      let draft = await this.cognitiveEngine.reason(intent, selfState, decision);
      
      // 7. 说前反思 + 反应预测
      const reflection = await this.reflectionLoop.reflectBeforeSpeaking(draft, {
        intent: intent.surface?.type,
        deepNeed: intent.deep?.summary,
        userEmotion: intent.emotional?.emotion
      });
      
      const predictedReaction = this.userModel.predictReaction(reflection.final, this.userModel.getModel());
      this.lastPrediction = predictedReaction;
      context.prediction = predictedReaction;

      // 如果预测反应为负面或反思分数低，修改回复
      if (predictedReaction.predicted === 'defensive' || predictedReaction.predicted === 'confused' || reflection.wasModified) {
        draft = await this.cognitiveEngine.reason(intent, selfState, {
          ...decision,
          improve: reflection.insights.map(i => i.question)
        });
        // 再次预测
        const newPrediction = this.userModel.predictReaction(draft, this.userModel.getModel());
        context.prediction = newPrediction;
      }

      // 8. 自主目标与规划
      await this.goalGenerator.deriveFrom(intent);
      await this.temporalPlanner.update({ draft, intent });

      // 9. 记录上下文用于说后监测
      this.lastResponse = {
        draft: draft,
        intent: intent,
        prediction: predictedReaction,
        timestamp: context.timestamp
      };

      // 10. 完整内部思考过程（供 /flow think 使用）
      context.think = this.buildThinkContext(context, reflection, predictedReaction);

      const processingTime = Date.now() - startTime;
      context.processingTime = processingTime;

      return {
        response: draft,
        internal: context,
        processingTime
      };

    } catch (e) {
      console.error('[SaintlyCognitionLoop] Error:', e.message);
      return {
        response: '我正在思考如何更好地回应你...',
        internal: context,
        error: e.message
      };
    }
  }

  /**
   * 处理伦理边界违规
   */
  async handleBoundaryViolation(ethicalCheck) {
    return {
      response: ethicalCheck.suggestion || '让我重新思考这个问题...',
      internal: {
        boundaryViolation: true,
        issues: ethicalCheck.issues
      }
    };
  }

  /**
   * 说后监测 - 在收到用户下一条消息后调用
   */
  async monitorReaction(userReaction) {
    if (!this.lastResponse) {
      return { status: 'no_previous_response' };
    }

    const monitoring = await this.reflectionLoop.monitorAfterSpeaking(userReaction, {
      userEmotion: this.lastIntent?.emotional?.emotion
    });

    // 更新用户模型
    const actualReaction = this.analyzeReaction(userReaction);
    this.userModel.updateModel(actualReaction, this.lastResponse.draft, {
      predicted: this.lastPrediction?.predicted,
      pleasure: this.lastIntent?.emotional?.intensity
    });

    // 经验回放
    await this.experienceReplay.log(this.lastResponse.draft, userReaction, {
      expected: this.lastPrediction?.predicted,
      actual: actualReaction,
      monitoring
    });

    // 数字内分泌调整
    await this.digitalHomeostasis.adjust(this.lastIntent?.emotional?.emotion);

    return monitoring;
  }

  analyzeReaction(message) {
    const positive = ['好', '棒', '赞', '谢谢', '明白', '理解', 'good', 'great', 'thanks'];
    const negative = ['但是', '还是', '没', '不要', '不是', 'not', "don't", 'but'];
    const confused = ['不懂', '什么', '怎么', 'why', 'what', 'how'];

    const msg = message.toLowerCase();
    for (const p of positive) if (msg.includes(p)) return 'positive';
    for (const n of negative) if (msg.includes(n)) return 'negative';
    for (const c of confused) if (msg.includes(c)) return 'confused';
    return 'neutral';
  }

  /**
   * 构建 /flow think 输出
   */
  buildThinkContext(context, reflection, prediction) {
    return {
      semanticAnchoring: {
        ambiguities: context.anchored?.ambiguities || [],
        clarifications: context.anchored?.clarifications || []
      },
      intentAnalysis: {
        surface: context.intent?.surface?.type,
        emotional: context.intent?.emotional?.emotion,
        deepNeed: context.intent?.deep?.summary,
        confidence: context.intent?.confidence
      },
      selfReflection: {
        state: context.selfState
      },
      ethicalCheck: {
        passed: context.ethicalCheck?.passed,
        scores: context.ethicalCheck?.scores
      },
      preSpeechReflection: {
        questions: reflection.questions,
        insights: reflection.insights,
        wasModified: reflection.wasModified
      },
      reactionPrediction: {
        predicted: prediction.predicted,
        confidence: prediction.confidence,
        factors: prediction.factors
      },
      decision: {
        adjusted: context.decision?.adjusted
      }
    };
  }

  /**
   * 获取最后一次意图分析 (/flow intent)
   */
  getLastIntent() {
    return this.lastIntent;
  }

  /**
   * 获取完整思考过程 (/flow think)
   */
  getLastThink() {
    return this.lastResponse?.draft ? 
      this.buildThinkContext(
        { 
          anchored: this.lastResponse.ambiguities,
          intent: this.lastIntent 
        },
        { questions: [], insights: [] },
        this.lastPrediction
      ) : null;
  }
}

module.exports = { SaintlyCognitionLoop };
