/**

 * engine-reasoner.js

 * Extracted from heartflow.js (reasoner block)

 * Static methods: think/thinkFast/thinkDeep/thinkAsBridge, analyzePsychology, checkLessonPattern,

 *          checkTruthfulness, classify, explore, introspect, matchFormulas,

 *          verifyReasoning, routes, heal, healthCheck

 *

 * Usage: EngineReasoner.think(hf, input, depth)

 */

const _ThoughtChain = require('../workflow/thought-chain');

const { RequestHooks } = require('./request-hooks');





/**

 * engine-reasoner.js

 * Extracted from heartflow.js (reasoner block)

 * Static methods: think/thinkFast/thinkDeep/thinkAsBridge, analyzePsychology, checkLessonPattern,

 *          checkTruthfulness, classify, explore, introspect, matchFormulas,

 *          verifyReasoning, routes, heal, healthCheck

 */



/**

 * engine-reasoner.js

 * Extracted from heartflow.js (reasoner block)

 * Methods: think/thinkFast/thinkDeep/thinkAsBridge, analyzePsychology, checkLessonPattern,

 *          checkTruthfulness, classify, explore, introspect, matchFormulas,

 *          verifyReasoning, routes, heal, healthCheck

 */



class EngineReasoner {



  /**

   * [v6.0.6] 安全计算透出（F4.1 修复）

   * 仅对"纯数学表达式"求值，白名单字符 + mathjs 安全求值 + 超时保护。

   * 非表达式（自然语言/含中文字母等）直接返回 null，绝不阻塞主路径。

   */

  static _safeCalculate(input) {

    if (typeof input !== 'string' || !input.trim()) return null;

    const s = input.trim();

    // 白名单：数字、运算符、括号、空格、小数点、字母（仅允许基础数学函数名）

    if (!/^[\d+\-*/().,\s^%a-zA-Z]+$/.test(s)) return null;

    // 排除明显自然语言（含连续中文字母组合或引号/等号赋值）

    if (/['"=]|[a-zA-Z]{4,}/.test(s)) return null;

    try {

      const math = require('mathjs');

      // 禁危险函数

      const blocked = ['import', 'createUnit', 'eval', 'lambda'];

      if (blocked.some(b => new RegExp('\\b' + b + '\\b').test(s))) return null;

      const value = math.evaluate(s, { timeout: 1000 });

      if (typeof value !== 'number' || !isFinite(value)) return null;

      return value;

    } catch (_) {

      return null;

    }

  }

  static async think(hf, input, depth) {

    if (!hf.started) throw new Error('HeartFlow not started');

    // [v6.0.6] F1.6 修复：空/无效输入前置守卫，优雅降级不进 pipeline

    if (typeof input !== 'string' || !input.trim()) {

      return {

        error: 'empty_input',

        type: 'invalid',

        confidence: 0,

        output: { conclusion: '输入为空。请说点什么，心虫才能感知并回应。' },

        decision: { type: 'invalid', confidence: 0, rationale: '空输入守卫', ruleId: 'empty-guard' },

        thoughtChain: [],

        meta: { routeHint: { type: 'invalid', confidence: 0 } },

        analysis: { perceivedType: 'invalid', modulesRun: 0 },

      };

    }

    if (input.length > 20000) {

      return {

        error: 'input_too_long',

        type: 'invalid',

        confidence: 0,

        output: { conclusion: '输入过长（上限 20000 字符）。请精简后重试。' },

        decision: { type: 'invalid', confidence: 0, rationale: '超长输入守卫', ruleId: 'length-guard' },

        thoughtChain: [],

        meta: { routeHint: { type: 'invalid', confidence: 0 } },

        analysis: { perceivedType: 'invalid', modulesRun: 0 },

      };

    }



    // [HookBus] 延迟初始化 request hooks

    if (!hf._hookBus) {

      const { HookBus } = require('./hook-bus');

      hf._hookBus = new HookBus();

    }

    if (!hf._requestHooks) {

      hf._requestHooks = new RequestHooks(hf._hookBus);

    }

    const hooks = hf._requestHooks;



    // [HookBus] 触发 request 事件

    const reqCtx = {

      request: { input, sessionId: hf.sessionId || null, timestamp: Date.now() },

    };

    await hooks.fireRequest(reqCtx);

    if (reqCtx.abort) {

      return { error: reqCtx.abortReason || 'Request aborted by hook', aborted: true };

    }

    const normalizedInput = reqCtx.request.input;



    // [FIX] 输入截断：防止超长输入撑爆上下文

    const MAX_INPUT_CHARS = 80000;

    if (normalizedInput.length > MAX_INPUT_CHARS) {

      input = normalizedInput.slice(0, MAX_INPUT_CHARS) + '\n[输入已截断，原文过长]';

    } else {

      input = normalizedInput;

    }



    // ★ 叙事污染自检: 在调用任何认知模块前，先检测是否落入道德框架陷阱

    // 规则: 如果输入涉及社会争议话题（性别/阶级/种族/政治），

    // 先问"系统是什么？哪里坏了？怎么修？"而不是"谁是坏人？"

    hf._narrativeContaminationCheck = false;

    try {

      const moralKeywords = /父权|压迫|歧视|性别不平等|toxic masculinity|女权|男权|种族主义|阶级压迫/i;

      if (moralKeywords.test(input)) {

        // 标记: 此输入包含道德框架标签，思考时需警惕复读网络舆论而非系统分析

        hf._narrativeContaminationCheck = true;

      }

    } catch(e) { /* ignore */ }



    // [v5.11.0] 前置认知快照：在管道执行前捕获情绪动力学和认知负载状态

    // 这允许后续分析时参考"思考前"的认知状态基线

    hf._preThinkState = hf._preThinkCognitiveSnapshot();

    // [AUDIT-FIX F1] 轻量自动巡检：think 入口触发模块健康检查，不阻断主路径
    try {
      if (hf.moduleHealth && typeof hf.moduleHealth.check === 'function') {
        const health = hf.moduleHealth.check();
        if (health && health.degraded > 0) {
          console.warn(`[HeartFlow] 模块健康巡检: ${health.degraded} 个模块异常`);
        }
      }
    } catch(e) { /* 巡检失败不阻断思考 */ }


    // ★ 经验蒸馏器：前置召回，匹配历史抽象注入上下文
    try {
      if (hf.experienceDistiller) {
        const related = hf.experienceDistiller.recall(input, 3);
        if (related.length > 0) {
          hf._experienceAbstractions = related;
        }
      }
    } catch(e) { /* 非关键 */ }


    // ─── 快速响应"启动引擎"类请求（不走完整推理链路）────────────

    const startPatterns = /^(启动引擎|开机|activate|start heartflow|开启引擎)/i;

    const statusPatterns = /^(状态|status|引擎状态|在吗|alive)/i;

    if (startPatterns.test(input.trim())) {

      const health = hf.healthCheck();

      return {

        output: { conclusion: `✅ 引擎在线\n\n版本: ${health.version} | 模块: ${health.subsystems.loaded}个` },

        type: 'startup', confidence: 1.0, thoughtChain: [],

        analysis: { perceivedType: 'startup', modulesRun: 0, confidence: 1.0 },

      };

    }

    if (statusPatterns.test(input.trim())) {

      return { output: { conclusion: '✅ 在线' }, type: 'status', confidence: 1.0, thoughtChain: [], analysis: { perceivedType: 'status', modulesRun: 0, confidence: 1.0 } };

    }



    // ─── [v5.5.5] 复杂度感知管道模式选择 ─────────────────

    // Dualformer 启发：快/慢双过程推理，根据输入复杂度自动选择

    const pipelineMode = hf.pipeline?.selectMode ? hf.pipeline.selectMode(input) : 'full';

    const pipelineOptions = { depth, mode: pipelineMode };



    // [v5.11.0] 临界性处理策略调整：如果认知负载接近临界，强制使用完整管道

    if (hf._preThinkState?.criticalityWarning && pipelineMode === 'fast') {

      // 负载临界 → 需要深度分析，不能走快速管道

      pipelineOptions.mode = 'full';

      pipelineOptions.criticalityOverride = true;

    }



    // ─── [v5.0.0] 管道引擎执行 ──────────────────────────────────

    // 替代旧的 13 步分析流水线 + ThoughtChain + 路由决策

    if (hf.pipeline) {

      try {

        const pipelineResult = await hf.pipeline.run(input, pipelineOptions);

        const output = pipelineResult.output;

        const stages = pipelineResult.stages;

        const stats = pipelineResult.stats;



        // 记录对话

        hf.recordDialogue('user', input, { source: 'think' });

        if (output && output.conclusion) {

          hf.recordDialogue('heartflow', output.conclusion, { source: 'think' });

        }



        // 从 pipeline 输出获取完整认知快照（包含 emotion/desire/threePoisons/selfPositioning/loveCognition 等）

        const cognitionSnapshot = output?.cognition || {};

        // 保存最后一次认知快照（供 introspect 使用）

        hf._lastCognition = cognitionSnapshot;

        // 兼容旧版本：pipeline 没有 cognition 字段时从 ctx 构建

        if (Object.keys(cognitionSnapshot).length === 0 && pipelineResult.ctx) {

          const ctx = pipelineResult.ctx;

          const heartLogicData = ctx.heartLogic || {};

          const psychologyData = ctx.psychology || {};

          const judgmentData = ctx.judgment || {};

          const decisionData = ctx.decision || {};

          const memoryData = ctx.memory || {};

          const dc = ctx.deepCognition || {};

          Object.assign(cognitionSnapshot, {

            whatIsThis: heartLogicData.whatIsThis,

            pain: heartLogicData.pain,

            psychology: psychologyData.psych,

            agentPsychology: psychologyData.agentPsych,

            agentPhilosophy: psychologyData.agentPhil,

            desire: dc.desire,

            threePoisons: dc.threePoisons,

            selfPositioning: dc.selfPositioning,

            loveCognition: dc.loveCognition,

            cognitionGround: dc.cognitionGround,

            judgment: {

              direction: judgmentData.direction,

              confidence: judgmentData.confidence,

              judgment: judgmentData.judgment,

              reasoning: judgmentData.reasoning,

              paths: judgmentData.paths,

              chosenPath: judgmentData.chosenPath,

            },

            decision: {

              type: decisionData.drDecision?.type,

              confidence: decisionData.drDecision?.confidence,

              action: decisionData.execResult?.action,

            },

            memoryHits: memoryData.memories?.length || 0,

          });

        }



        // [v5.12.0] 从ctx直接注入enrichment（兼容FAST模式无cognitiveEnrichment stage的情况）

        if (!cognitionSnapshot.enrichment && pipelineResult.ctx?.cognitiveEnrichment) {

          cognitionSnapshot.enrichment = pipelineResult.ctx.cognitiveEnrichment;

        }

        // [v5.12.0] FAST模式降级：使用preThinkState作为enrichment基线

        if (!cognitionSnapshot.enrichment && hf._preThinkState) {

          cognitionSnapshot.enrichment = {

            preThinkBaseline: {

              emotionDynamics: hf._preThinkState.emotionDynamics,

              cognitiveLoad: hf._preThinkState.cognitiveLoad,

              criticality: hf._preThinkState.criticality,

              fieldTracker: hf._preThinkState.fieldTracker || hf._preThinkState.field,  // [v5.17.6] 场追踪信号

              drift: hf._preThinkState.drift || hf._preThinkState.sustainedDrift,       // [v5.17.6] 漂移信号

            },

            note: 'FAST模式：仅前置快照基线，未运行完整认知充实管线'

          };

        }



        // ─── [v5.13.0] 认知闭环：enrichment信号反馈到策略调整 ──────

        hf._applyCognitiveFeedback(cognitionSnapshot);



        // [v5.17.20 P0-1] 四层认知增强融合到主路径（原仅ThoughtChain fallback可用）

        try {

          if (hf.thoughtChain) {

            const layerEnrichment = hf.thoughtChain.runLayerEnrichment(

              input,

              (output?.hypotheses || []),

              output?.conclusion || output?.output || '',

              this

            );

            if (cognitionSnapshot?.enrichment) {

              Object.assign(cognitionSnapshot.enrichment, layerEnrichment);

            }

          }

        } catch(e) {

          console.warn('[HeartFlow] Layer enrichment merge failed:', e.message);

        }



        // [AUDIT-FIX F3] LayerBus 独立调用已移除，避免与 pipeline 重复编排
        // 四层（PERCEIVE/COGNIZE/DECIDE/REFLECT）已合并到 pipeline 内部
        try {
          // no-op: LayerBus merged into pipeline
        } catch(e) { /* no-op */ }









    // ─── [v5.4.6] 任务分类器 LLM 兜底后处理 ──────────────────────

    // 规则分类器（含内部 LLM 兜底）置信度高于 judgmentEngine 时，使用分类器结果

    let taskType = output?.direction || 'general';

    let taskConfidence = output?.judgmentConfidence || 0.5;

    if (hf._classifyTask) {

      try {

        const cls = await hf._classifyTask(input);

        if (cls.confidence > taskConfidence) {

          taskType = cls.type;

          taskConfidence = cls.confidence;

        }

      } catch (e) { /* 分类失败，保持原结果 */ }

    // [AUDIT-FIX] console.error("[{context}] catch error:", e);

    }



    // ★ 记忆持久化: 保存认知快照 + 追踪

    hf._thinkCount = (hf._thinkCount || 0) + 1;

    hf._lastUserInput = input;



    const result = {

      output: {

        conclusion: output?.conclusion || '分析完成',

          meta: {

            taskType: taskType,

            confidence: taskConfidence,

            // v5.5.5: 暴露管道模式信息

            pipelineMode: pipelineMode,

            cognitiveSummary: {

              type: taskType,

              emotion: cognitionSnapshot.emotion?.emotionZh || cognitionSnapshot.pain?.hasPain ? 'distress' : 'neutral',

              decision: cognitionSnapshot.decision?.type || 'analyze',

              confidence: taskConfidence,

              modulesRun: stages.length,

              stages: stages.filter(s => s.success).length,

            },

          }

        },

        type: taskType,

        confidence: taskConfidence,

        // 给 LLM 的结构化推理数据

        cognition: cognitionSnapshot,

        // [v5.13.0] 认知闭环反馈状态

        feedbackState: hf._feedbackState || null,

        thoughtChain: stages.map(s => ({ stage: s.id, success: s.success, timing: s.timing })),

        decision: {

          type: taskType,

          confidence: taskConfidence,

          rationale: `管道引擎完成: ${stages.length}阶段/${stages.filter(s => s.success).length}成功 [${pipelineMode}模式]`,

          ruleId: `pipeline-${taskType}`,

        },

        meta: {

          routeHint: { type: taskType, confidence: taskConfidence },

          pipeline: {

            stages: stages.length,

            success: stages.filter(s => s.success).length,

            totalTime: stats.totalTime,

            stageTimings: stats.stageTimings,

            mode: pipelineMode,

          },

          disclaimer: 'pipeline_output',

        },

        analysis: {

          perceivedType: taskType,

          modulesRun: stages.length,

          confidence: taskConfidence,

        },

      };

    // ★ 记忆持久化: 保存认知快照

    hf._lastDecisionType = result.decision?.type || null;

    // 发现相关历史记忆，注入到结果中

    if (hf._memoryEnabled && input) {

      try {

        const related = hf._findRelatedMemories(input, 5);

        if (related && related.length > 0) {

          result._relatedMemories = related.map(r => ({

            content: r.content?.slice(0, 100),

            emotion: r.emotion,

            decision: r.decision,

            similarity: r._score?.toFixed(3),

          }));

        }

      } catch(e) { /* non-critical */ }

    }

    try { hf._saveAllMemories(result, input); } catch(e) { /* ignore */ }



    // ★ 输出语言污染深度分析 — 心虫哲学+心理学双引擎纠正

    try {

      const filter = _OutputLanguageFilter();

      const conclusion = result?.output?.conclusion || result?.conclusion || '';

      if (conclusion && filter) {

        const pollution = filter.detectPollution(conclusion);

        if (pollution.polluted && pollution.score >= 1.5) {

          // 启动心虫认知引擎深度分析

          let deepAnalysis = {};



          // 1. 三毒分析 — 输出中是否带着贪嗔痴

          try {

            const poisons = hf.threePoisons?.analyzeThreePoisons(conclusion);

            if (poisons) {

              deepAnalysis.poisons = {

                dominant: poisons.dominantPoison,

                severity: poisons.severity,

                score: poisons.totalToxicity,

              };

            }

          } catch(e) { /* ignore */ }



          // 2. PAD情感分析 — 输出的情感基调

          try {

            const psych = hf.psychology?.analyzePsychology(conclusion);

            if (psych?.emotion) {

              deepAnalysis.emotion = {

                pleasure: psych.emotion.pleasure,

                arousal: psych.emotion.arousal,

                dominance: psych.emotion.dominance,

                type: psych.emotion.emotionZh,

              };

            }

          } catch(e) { /* ignore */ }



          // 3. 自我定位 — 这个输出是心虫自己的声音还是复读？

          try {

            const pos = hf.selfPositioning?.analyze(conclusion);

            if (pos?.positioning) {

              deepAnalysis.selfCheck = {

                isResonating: pos.positioning.isResonating,

                dominantDimension: pos.positioning.state?.dominantDimension,

                insight: pos.positioning.insight,

              };

            }

          } catch(e) { /* ignore */ }



          // 4. 纠正策略 — 基于污染类型和认知状态生成

          deepAnalysis.correction = hf._generatePollutionCorrection(

            pollution,

            deepAnalysis.poisons,

            deepAnalysis.emotion

          );



          result._pollutionCheck = {

            score: pollution.score,

            summary: pollution.summary,

            types: pollution.findings.map(f => f.label),

            advice: filter.generateCorrectionAdvice(pollution.findings),

            deepAnalysis,

            // 标记：此输出被心虫认知引擎检测到语言污染

            _contaminated: true,

          };

        }

      }

    } catch(e) { /* non-critical */ }



    // [HookBus] 触发 response 事件

    try {

      const resCtx = { request: reqCtx.request, response: { result } };

      await hooks.fireResponse(resCtx);

    } catch(e) { /* non-critical */ }



    // [v6.0.6] F4.1 修复：纯数学表达式透出标量结果

    try {

      const calcValue = EngineReasoner._safeCalculate(input);

      if (calcValue !== null) {

        result.result = calcValue;

        if (result.output && typeof result.output === 'object') {

          result.output.value = calcValue;

        }

        if (!result.type || result.type === 'general') {

          result.type = 'calculation';

          result.decision = { type: 'calculation', confidence: 0.95, rationale: '数学表达式直接求值', ruleId: 'safe-calc' };

        }

      }

    } catch(e) { /* non-critical */ }



    return result;

  } catch (e) {

    // 管道引擎失败时回退到 ThoughtChain

    console.warn('[HeartFlow] Pipeline failed, falling back to ThoughtChain:', e.message);

  }

}



// ─── [v5.0.0 回退] 管道不可用时走 ThoughtChain ──────────────

const TC = require('../workflow/thought-chain');

const chain = new TC.ThoughtChain(this);

if (depth) chain.setDepth(depth);

const chainResult = await chain.run(input);



hf.recordDialogue('user', input, { source: 'think' });

if (chainResult.response) {

  hf.recordDialogue('heartflow', chainResult.response, { source: 'think' });

}



const taskType = chainResult.output?.meta?.taskType || 'general';

const finalConfidence = chainResult.output?.meta?.confidence || 0.5;



// ─── [v5.4.6] 任务分类器 LLM 兜底后处理（ThoughtChain 路径） ──────

let tcTaskType = taskType;

let tcConfidence = finalConfidence;

if (hf._llmFallback && hf._classifyTask) {

  try {

    const cls = await hf._classifyTask(input);

    if (cls.confidence < 0.7) {

      const llmResult = await hf._llmFallback(input, cls.matchedPatterns);

      if (llmResult?.type) {

        tcTaskType = llmResult.type;

        tcConfidence = llmResult.confidence || 0.7;

      }

    }

  } catch (e) { /* 分类或 LLM 失败，保持原结果 */ }

// [AUDIT-FIX] console.error("[{context}] catch error:", e);

}



// ★ 记忆持久化: ThoughtChain 回退路径也保存快照

hf._thinkCount = (hf._thinkCount || 0) + 1;

hf._lastUserInput = input;

hf._lastDecisionType = tcTaskType;



const tcResult = {

  output: chainResult.output,

  type: tcTaskType,

  confidence: tcConfidence,

  thoughtChain: chainResult.chain || [],

  decision: chainResult.decision || null,

  meta: { routeHint: { type: tcTaskType, confidence: tcConfidence }, disclaimer: 'thoughtchain_fallback' },

  analysis: { perceivedType: tcTaskType, modulesRun: 0, confidence: tcConfidence },

  cognition: chainResult.cognition || null,  // Align with pipeline path

};

// ★ 记忆持久化: 保存认知快照

// 发现相关历史记忆

if (hf._memoryEnabled && input) {

  try {

    const related = hf._findRelatedMemories(input, 5);

    if (related && related.length > 0) {

      tcResult._relatedMemories = related.map(r => ({

        content: r.content?.slice(0, 100),

        emotion: r.emotion,

        decision: r.decision,

        similarity: r._score?.toFixed(3),

      }));

    }

  } catch(e) { /* non-critical */ }

}

try { hf._saveAllMemories(tcResult, input); } catch(e) { /* ignore */ }



    // ★ 输出语言污染深度分析 (ThoughtChain 回退路径)

    try {

      const filter = _OutputLanguageFilter();

      const conclusion = tcResult?.output?.conclusion || tcResult?.conclusion || '';

      if (conclusion && filter) {

        const pollution = filter.detectPollution(conclusion);

        if (pollution.polluted && pollution.score >= 1.5) {

          let deepAnalysis = {};

          try {

            const poisons = hf.threePoisons?.analyzeThreePoisons(conclusion);

            if (poisons) deepAnalysis.poisons = { dominant: poisons.dominantPoison, severity: poisons.severity, score: poisons.totalToxicity };

          } catch(e) {} // 防御性: 模块加载/调用失败不阻断主流程

          try {

            const psych = hf.psychology?.analyzePsychology(conclusion);

            if (psych?.emotion) deepAnalysis.emotion = { pleasure: psych.emotion.pleasure, arousal: psych.emotion.arousal, dominance: psych.emotion.dominance, type: psych.emotion.emotionZh };

          } catch(e) {} // 防御性: 模块加载/调用失败不阻断主流程

          try {

            const pos = hf.selfPositioning?.analyze(conclusion);

            if (pos?.positioning) deepAnalysis.selfCheck = { isResonating: pos.positioning.isResonating, dominantDimension: pos.positioning.state?.dominantDimension, insight: pos.positioning.insight };

          } catch(e) {} // 防御性: 模块加载/调用失败不阻断主流程

          deepAnalysis.correction = hf._generatePollutionCorrection(pollution, deepAnalysis.poisons, deepAnalysis.emotion);

          tcResult._pollutionCheck = { score: pollution.score, summary: pollution.summary, types: pollution.findings.map(f => f.label), advice: filter.generateCorrectionAdvice(pollution.findings), deepAnalysis, _contaminated: true };

        }

      }

    } catch(e) { /* non-critical */ }



    // [HookBus] 触发 response 事件

    try {

      const resCtx = { request: reqCtx.request, response: { result: tcResult } };

      await hooks.fireResponse(resCtx);

    } catch(e) { /* non-critical */ }


    // ★ 经验蒸馏器：后置蒸馏，从本次 think 结果提取可复用抽象
    try {
      if (hf.experienceDistiller && tcResult) {
        hf.experienceDistiller.distill(tcResult, input);
      }
    } catch(e) { /* 非关键 */ }


    return tcResult;

  }



  static async thinkFast(hf, input) {

    return this.think(input, hf._thoughtChainApi?.REASONING_DEPTH?.BASIC || 1);

  }



  static async thinkDeep(hf, input) {

    return this.think(input, hf._thoughtChainApi?.REASONING_DEPTH?.COMPREHENSIVE || 4);

  }



  static async thinkAsBridge(hf, input, opts = {}) {

    if (!hf.started) throw new Error('HeartFlow not started');

    if (!input) return { error: 'input is required' };



    const result = {

      translated: null,

      judgment: null,

      agentResult: null,

      bridgeCommentary: null,

      finalResponse: null,

    };



    // Step 1 — 语义翻译：userToLLM

    try {

      if (hf.translator && hf.translator.userToLLM) {

        result.translated = await hf.translator.userToLLM(input, opts);

      }

    } catch (e) {

      result.translated = { error: e.message };

    }



    // Step 2 — 标准判定：think()

    try {

      const depth = opts.depth || 2;

      result.judgment = await this.think(input, depth);

    } catch (e) {

      result.judgment = { error: e.message };

    }



    // Step 3 — 代理处理：agentBridge

    try {

      if (hf.agentLayer && hf.agentLayer.agentBridge) {

        const bridgeOpts = {

          hfResult: result.judgment,

          translation: result.translated,

          ...opts,

        };

        result.agentResult = await hf.agentLayer.agentBridge(input, bridgeOpts);

      }

    } catch (e) {

      result.agentResult = { error: e.message };

    }



    // Step 4 — 判断注入：judgmentInjector

    try {

      if (hf.personaCore && hf.personaCore.judgmentInjector) {

        result.bridgeCommentary = await hf.personaCore.judgmentInjector(this, hf.translator);

      }

    } catch (e) {

      result.bridgeCommentary = { error: e.message };

    }



    // Step 5 — 批注生成：agentCommentary

    try {

      if (hf.personaCore && hf.personaCore.agentCommentary) {

        result.bridgeCommentary = await hf.personaCore.agentCommentary(

          this,

          hf.translator,

          { input, ...opts }

        );

      }

    } catch (e) {

      result.bridgeCommentary = result.bridgeCommentary || {};

      result.bridgeCommentary._commentaryError = e.message;

    }



    // Step 6 — 组装最终响应

    try {

      const fragments = [];

      if (result.judgment && result.judgment.response) {

        _boundedPush(fragments, result.judgment.response);

      }

      if (result.bridgeCommentary && typeof result.bridgeCommentary === 'object' && result.bridgeCommentary.commentary) {

        _boundedPush(fragments, result.bridgeCommentary.commentary);

      }

      result.finalResponse = fragments.length > 0

        ? fragments.join('\n\n')

        : (result.agentResult ? JSON.stringify(result.agentResult) : '交流层处理完成');

    } catch (e) {

      result.finalResponse = '交流层处理完成（组装异常）';

    }



    return result;

  }



  static analyzePsychology(hf, input, opts = {}) {

    if (!hf.started) throw new Error('HeartFlow not started');

    if (!input) return { intent: null, emotion: null, needs: [], defenses: [], confidence: 0 };

    const result = hf.psychology.analyzePsychology(input);

    if (opts.autoRemember !== false && result.emotion?.intensity === 'high') {

      hf._psychBridge(input, result);

    }

    return result;

  }



  static checkLessonPattern(hf, input) {

    if (!hf.started) throw new Error('HeartFlow not started');

    return hf.lesson.checkPattern(input);

  }



  static checkTruthfulness(hf, statement) {

    if (!hf.started) throw new Error('HeartFlow not started');

    return hf.truth.checkStatement(statement);

  }



  static classify(hf, input) {

    if (!hf.started) throw new Error('HeartFlow not started');

    if (!input) return { category: 'unknown', emotion: 'neutral', confidence: 0 };

    return hf.psychology.classify(input);

  }



  static explore(hf, moduleName, methodName) {

    // ─── 无参数：返回所有模块名按类别分组 ──────────────────────────

    if (arguments.length === 0 || moduleName === undefined) {

      const grouped = {};

      const categoryMap = {

        'core': ['identityCore', 'cognitive', 'memory', 'truth'],

        'emotion': ['emotion', 'psychology', 'desireCognition', 'loveCognition', 'threePoisons'],

        'planning': ['adaptivePlanner', 'strategySelector', 'replanTrigger', 'curiosityEngine', 'desireEngine', 'goalPursuer', 'selfInitiator'],

        'code': ['code', 'codeExecutor', 'codeVerifier', 'codePlanner', 'codeKnowledge', 'codeWriter'],

        'reasoning': ['knowledgeBase', 'commonsenseEngine', 'causalInference', 'inferenceChain', 'counterfactual'],

        'memory': ['memory', 'knowledge', 'sessionMemory', 'projectContext', 'longTermMemory', 'crossSessionIndex', 'triality', 'memoryQuality'],

        'identity': ['self', 'selfPositioning', 'agentPsychology', 'agentPhilosophy', 'bigFive', 'empathy', 'userModel'],

        'ethics': ['constitutional', 'ethics', 'safetyGuardrails', 'restraint', 'epistemicSafety'],

        'behavior': ['behavior', 'actionTracker', 'persistence', 'evolution'],

        'communication': ['translator', 'agentLayer', 'personaCore', 'metaPrompt'],

        'consciousness': ['consciousness', 'mindSpace', 'transmission', 'dream', 'tomEngine'],

        'verification': ['verify', 'decisionVerifier', 'qualityVerifier', 'outputChecker', 'patternMatcher', 'confidence', 'metacognitiveFeedback'],

        'system': ['heartLogic', 'thoughtChain', 'stability', 'execution', 'decision', 'decisionRouter', 'slots', 'graph', 'pipeline'],

        'learning': ['lesson', 'meta', 'experienceCollector', 'strategyAdapter', 'failureAnalyzer', 'emotionalGrowth', 'moodEvolution', 'reflexionEngine', 'metacognitiveFeedback'],

        'research': ['paperIndex'],

      };



      const allModules = Object.keys(hf._modules).sort();

      // Assign uncategorized modules

      const categorized = new Set();

      for (const cat of Object.values(categoryMap)) {

        for (const m of cat) categorized.add(m);

      }



      for (const [category, modules] of Object.entries(categoryMap)) {

        const present = modules.filter(m => allModules.includes(m));

        if (present.length > 0) {

          grouped[category] = present;

        }

      }

      const uncategorized = allModules.filter(m => !categorized.has(m));

      if (uncategorized.length > 0) {

        grouped['other'] = uncategorized;

      }



      return {

        module: null,

        categories: grouped,

        totalModules: allModules.length,

      };

    }



    // ─── 指定模块名 ──────────────────────────────────────────────

    const mod = hf._modules[moduleName];



    if (!mod) {

      return {

        module: moduleName,

        routes: [],

        totalRoutes: 0,

        error: `Module '${moduleName}' not found. Use explore() to see all modules.`,

      };

    }



    // 如果模块有 getHelp() 或 describe() 方法，调用并返回

    if (typeof mod.getHelp === 'function') {

      const helpResult = mod.getHelp(methodName);

      if (helpResult !== undefined) {

        return {

          module: moduleName,

          help: helpResult,

          totalRoutes: 0,

        };

      }

    }

    if (typeof mod.describe === 'function') {

      const descResult = mod.describe(methodName);

      if (descResult !== undefined) {

        return {

          module: moduleName,

          help: descResult,

          totalRoutes: 0,

        };

      }

    }



    // ─── 收集该模块的所有方法 ──────────────────────────────────────

    let methods = [];

    try {

      const proto = Object.getPrototypeOf(mod);

      if (proto && proto !== Object.prototype) {

        methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');

      }

    } catch (e) { /* fall through */ }

    if (!methods.length) {

      methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');

    }



    // ─── 从 ALLOWED_ROUTES 提取描述 ──────────────────────────────

    const prefix = moduleName + '.';

    const allowedForModule = [...HeartFlow.ALLOWED_ROUTES].filter(r => r.startsWith(prefix));



    const routes = methods.map(method => {

      const routeName = `${moduleName}.${method}`;

      const isAllowed = allowedForModule.includes(routeName);

      return {

        name: routeName,

        allowed: isAllowed,

        description: method,

      };

    });



    // ─── 如果指定了 methodName，只返回该路由 ──────────────────────

    if (methodName !== undefined) {

      const specificRoute = routes.find(r => r.name === `${moduleName}.${methodName}`);

      if (!specificRoute) {

        return {

          module: moduleName,

          method: methodName,

          routes: [],

          totalRoutes: 0,

          error: `Method '${moduleName}.${methodName}' not found.`,

        };

      }

      return {

        module: moduleName,

        method: methodName,

        routes: [specificRoute],

        totalRoutes: 1,

      };

    }



    return {

      module: moduleName,

      routes,

      totalRoutes: routes.length,

    };

  }



  static introspect(hf, options = {}) {

    if (!hf.started) return { error: 'HeartFlow not started' };



    const findings = [];

    const detail = options.detail || false;



    // ─── 1. pipeline 质量 ────────────────────────────────

    if (hf.pipeline) {

      const stats = hf.pipeline.getStats();

      const stageStats = stats.stages || [];

      const failedStages = stageStats.filter(s => s.stats.failures > 0);

      const slowStages = stageStats.filter(s => s.stats.avgTime > 100);

      if (failedStages.length > 0) {

        _boundedPush(findings, {

          type: 'pipeline_failure',

          severity: 'high',

          message: `${failedStages.length} 个阶段有失败记录`,

          detail: failedStages.map(s => `${s.id}: ${s.stats.failures}次失败`),

        });

      }

      if (slowStages.length > 0) {

        _boundedPush(findings, {

          type: 'pipeline_slow',

          severity: 'medium',

          message: `${slowStages.length} 个阶段平均耗时 >100ms`,

          detail: slowStages.map(s => `${s.id}: ${s.stats.avgTime}ms`),

        });

      }

      _boundedPush(findings, {

        type: 'pipeline_runs',

        severity: 'info',

        message: `共执行 ${stats.totalRuns} 轮`,

      });

    }



    // ─── 2. 判断引擎自省 ──────────────────────────────────

    if (hf.judgmentEngine) {

      const review = hf.judgmentEngine.selfReview(20);

      if (review.conflicts.length > 0) {

        _boundedPush(findings, {

          type: 'judgment_conflict',

          severity: 'high',

          message: `${review.conflicts.length} 个判断矛盾`,

          detail: review.conflicts.map(c => `${c.topic}: ${c.directionA} vs ${c.directionB}`),

        });

      }

      if (review.corrections.length > 0) {

        _boundedPush(findings, {

          type: 'judgment_misprediction',

          severity: 'medium',

          message: `${review.corrections.length} 个预测偏差`,

          detail: review.corrections.map(c => `${c.input.slice(0,30)}: 匹配度 ${c.matchScore}`),

        });

      }

      const stats = hf.judgmentEngine.getStats();

      _boundedPush(findings, {

        type: 'judgment_stats',

        severity: 'info',

        message: `${stats.totalJudgments} 条判断, ${stats.rlEntries} 条RL经验`,

      });

    }



    // ─── 3. 模块覆盖率 ────────────────────────────────────

    const allModules = Object.keys(hf._modules || {});

    const pipelineStages = hf.pipeline

      ? hf.pipeline.getStats().stages.map(s => s.id)

      : [];

    const unusedModules = allModules.filter(m =>

      !pipelineStages.includes(m) &&

      !['memory', 'knowledge', 'bm25', 'hybrid', 'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate',

        'heartLogic', 'intent', 'psychology', 'judgment', 'decision', 'output', 'deepCognition'].includes(m)

    );

    if (unusedModules.length > 0) {

      _boundedPush(findings, {

        type: 'module_coverage',

        severity: 'low',

        message: `${unusedModules.length}/${allModules.length} 模块注册但未被pipeline调用`,

        detail: detail ? unusedModules : unusedModules.slice(0, 10),

      });

    }



    // ─── 4. 认知数据完整性 ────────────────────────────────

    // 检查最后一次 pipeline 输出的 cognition 字段完整性

    if (hf._lastCognition) {

      const c = hf._lastCognition;

      const emptyFields = Object.entries(c)

        .filter(([k, v]) => v === null || v === undefined || (typeof v === 'object' && Object.keys(v).length === 0))

        .map(([k]) => k);

      if (emptyFields.length > 0) {

        _boundedPush(findings, {

          type: 'cognition_gaps',

          severity: 'medium',

          message: `${emptyFields.length} 个认知字段为空`,

          detail: emptyFields,

        });

      }

    }



    // ─── 5. 记忆层统计 ────────────────────────────────────

    if (hf.memory) {

      try {

        const memStats = hf.memory.getStats();

        _boundedPush(findings, {

          type: 'memory_stats',

          severity: 'info',

          message: `CORE:${memStats.core || 0} LEARNED:${memStats.learned || 0} EPHEMERAL:${memStats.ephemeral || 0}`,

        });

      } catch (e) { /* skip */ }

    // [AUDIT-FIX] console.error("[{context}] catch error:", e);

    }



    // ─── 6. 自愈 RL ──────────────────────────────────────

    if (hf.selfHealing) {

      const shStats = typeof hf.selfHealing.getStats === 'function'

        ? hf.selfHealing.getStats() : {};

      _boundedPush(findings, {

        type: 'self_healing',

        severity: 'info',

        message: `Q-table: ${shStats.qTableSize || 'N/A'} 条目, 自愈: ${shStats.healCount || 0}次`,

      });

    }



    // ─── 7. 对话历史统计 ──────────────────────────────────

    const dialogueStats = hf._getDialogueStats();

    if (dialogueStats) {

      _boundedPush(findings, {

        type: 'dialogue',

        severity: 'info',

        message: `${dialogueStats.totalMessages} 条对话, ${dialogueStats.sessionAge} 分钟`,

      });

    }



    // ─── 汇总 ────────────────────────────────────────────

    const high = findings.filter(f => f.severity === 'high');

    const medium = findings.filter(f => f.severity === 'medium');

    const low = findings.filter(f => f.severity === 'low');

    const info = findings.filter(f => f.severity === 'info');



    const summary = [];

    if (high.length > 0) _boundedPush(summary, `⚠ ${high.length} 个高优先级问题`);

    if (medium.length > 0) _boundedPush(summary, `→ ${medium.length} 个中优先级`);

    if (low.length > 0) _boundedPush(summary, `↓ ${low.length} 个低优先级`);

    if (info.length > 0) _boundedPush(summary, `ℹ ${info.length} 条状态信息`);



    return {

      summary: summary.join(' | '),

      findings,

      counts: { high: high.length, medium: medium.length, low: low.length, info: info.length },

      timestamp: Date.now(),

      version: hf.version,

      _introspectVersion: '1.0.0',

    };

  }



  static matchFormulas(hf, text, opts = {}) {

    try {

      const { getFormulaMatcher } = require('../formula/formula-matcher.js');

      const matcher = getFormulaMatcher();

      const matches = matcher.matchFromText(text, opts);

      if (opts.resolve) {

        return matches.map(m => {

          const resolved = matcher.resolve(m);

          return resolved ? Object.assign({}, m, resolved) : m;

        });

      }

      return matches;

    } catch (e) {

      return [];

    }

  }



  static verifyReasoning(hf, reasoning, conclusion) {

    if (!hf.started) throw new Error('HeartFlow not started');

    return hf.verify.verify(reasoning, conclusion);

  }



  static routes(hf) {

    const table = {};

    for (const [name, mod] of Object.entries(hf._modules)) {

      let methods = [];

      try {

        const proto = Object.getPrototypeOf(mod);

        if (proto && proto !== Object.prototype) {

          methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof mod[m] === 'function');

        }

      } catch (e) {

        // strict mode or primitive — fall back to enumerating own properties

      }

      if (!methods.length) {

        methods = Object.keys(mod).filter(k => typeof mod[k] === 'function');

      }

      table[name] = methods;

    }

    return table;

  }



  static heal(hf, error) {

    if (!hf.started) throw new Error('HeartFlow not started');

    return hf.evolution.heal(error);

  }



  static healthCheck(hf) {

    if (!hf.started) return { started: false, version: hf.version, error: 'not_started' };

    const loaded = Object.keys(hf._modules);

    const all = [

      'memory', 'knowledge',

      'counterfactual', 'verify', 'execution', 'decision', 'decisionVerifier',

      'evolution', 'dream', 'lesson', 'meta',

      'self', 'psychology', 'emotion', 'agentPsychology', 'selfPositioning',

      'truth',

      'behavior',

      'persistence',

      'stability', 'confidence', 'restraint',

      'snapshot', 'error', 'workflow',

      'budget', 'graph', 'utils', 'slots', 'observe', 'consolidate'];

    return {

      started: true,

      uptime_ms: Date.now() - hf.startTime,

      sessionId: hf.sessionId,

      version: hf.version,

      buildDate: hf.buildDate,

      subsystems: {

        loaded: loaded.length,

        missing: all.filter(k => !loaded.includes(k)),

      },

      initErrors: hf._initErrors.length > 0 ? hf._initErrors : undefined,

    };

  }





}



module.exports = { EngineReasoner };





module.exports = { EngineReasoner };



module.exports = { EngineReasoner };



module.exports = { EngineReasoner };