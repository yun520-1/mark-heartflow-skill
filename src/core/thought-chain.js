/**
 * ThoughtChain v2.1 — 思维链编排器（思维连机制）
 *
 * 核心理念：不照搬人类思维，取精华，去缺陷，创更好
 * 思维连机制：每个阶段调用真实子系统，形成推理链条
 *   PARSE       → psychology.analyzePsychology（心理分析）
 *   HYPOTHESES  → causalInference.inferCauses（因果推理）
 *   INVERT      → truth.checkStatement + constitutional.critique（真伪+原则）
 *   EVIDENCE    → commonsenseEngine.validate（常识验证）
 *   SYNTHESIS   → decision.decide（决策生成）
 *   CALIBRATE   → confidence.calibrate + restraint.shouldIntervene（置信校准）
 *   RESPOND     → autonomousEmotion.trigger（情感自主）
 *
 * 人类思维缺陷：
 * - 确认偏误：只信服自己观点的证据
 * - 过度自信：100%确定通常是错的
 * - 后见之明：事后认为"早就知道"
 * - 锚定效应：第一个数字影响后续判断
 * - 工作记忆有限：只能处理4±1个信息块
 *
 * 心虫思维改进：
 * - 反向思考：先假设自己错了
 * - 并行假设：同时考虑多个可能
 * - 不确定性传播：明确说出来
 * - 证据质量评估：不是有证据就行
 * - 快速退出：确定时不浪费时间
 * - 任务特化：不同任务不同策略
 *
 * 思维链阶段 v2.0：
 *   1. PARSE     — 解析问题（不是理解，是分解）
 *   2. HYPOTHESES — 并行假设（同时想多个可能）
 *   3. INVERT    — 反向思考（先证明自己错了）
 *   4. EVIDENCE  — 证据评估（质量不是数量）
 *   5. SYNTHESIS — 综合判断（不是最快给答案）
 *   6. CALIBRATE  — 置信校准（克制过度自信）
 *   7. RESPOND   — 生成回应（带不确定性标记）
 */

const REASONING_DEPTH = {
  SURFACE: 1,      // 表面：快速响应，不确定时直接说
  BASIC: 2,        // 基础：假设+反向+证据
  DEEP: 3,        // 深度：全流程，证据质量评估
  COMPREHENSIVE: 4 // 综合：多路径探索，任务特化
};

// 任务类型对应的策略
const TASK_STRATEGIES = {
  // 计算类：直接执行，不需要假设
  calculation: {
    skipHypotheses: true,
    skipInvert: false,    // 但要检查计算错误
    depth: 2
  },
  // 解释类：需要假设+验证
  explanation: {
    skipHypotheses: false,
    skipInvert: false,
    minHypotheses: 2,
    depth: 3
  },
  // 判断类：必须反向思考
  judgment: {
    skipHypotheses: false,
    skipInvert: false,
    minHypotheses: 3,
    requireContradiction: true,
    depth: 4
  },
  // 创造类：需要多路径并行
  creative: {
    skipHypotheses: false,
    skipInvert: true,     // 创造不需要反向
    parallelPaths: true,
    depth: 3
  },
  // 检索类：快速退出
  retrieval: {
    fastExit: true,
    skipHypotheses: true,
    skipInvert: true,
    depth: 1
  }
};

class ThoughtChain {
  constructor(hf) {
    this.hf = hf;
    this.context = null;
    this.stages = [];
    this.depth = REASONING_DEPTH.BASIC;
    this.taskStrategy = null;
    this._chainBuilt = false;
  }

  setDepth(depth) {
    this.depth = depth;
    return this;
  }

  /**
   * 解析问题类型，选择对应策略
   */
  _classifyTask(input) {
    const q = input.toLowerCase();

    if (/\d+[+\-*/=]|\d+\s*(=|大于|小于|等于|总和|平均|概率)/.test(q)) {
      return 'calculation';
    }
    if (/为什么|原因|原理|怎么来的|解释/.test(q)) {
      return 'explanation';
    }
    if (/对不对|是否|应该|正确吗|合理吗|好不好/.test(q)) {
      return 'judgment';
    }
    if (/创造|设计|想象|提出|新的/.test(q)) {
      return 'creative';
    }
    if (/是什么|定义|概念|什么是|指什么|查|找/.test(q)) {
      return 'retrieval';
    }
    return 'general';
  }

  /**
   * 构建思维链 v2.0
   */
  _buildChain() {
    this.stages = [];
    const taskType = this.taskStrategy?.type || 'general';

    // ── 阶段1: PARSE — 解析问题 + 调用心理学引擎 ─────────────────────
    this.stages.push({
      name: 'PARSE',
      description: '分解问题 + 调用 psychology 子系统',
      fn: async (ctx, hf) => {
        const input = ctx.input;

        // 1.1 提取关键变量
        const variables = this._extractVariables(input);

        // 1.2 识别约束条件
        const constraints = this._extractConstraints(input);

        // 1.3 确定问题目标
        const goal = this._extractGoal(input);

        // 1.4 识别问题类型
        const type = this._classifyTask(input);

        // 1.5 选择对应策略
        const strategy = TASK_STRATEGIES[type] || TASK_STRATEGIES.general;

        // 1.6 【思维连机制】调用 psychology 子系统 — 串联第一层
        let psychResult = null;
        let empathyResult = null;
        try {
          psychResult = hf.dispatch('psychology.analyzePsychology', input);
        } catch (e) {
          // 子系统不存在时静默降级
          psychResult = null;
        }
        
        // 1.7 【心理推断深度集成】调用共情检测 — empathy-detector 结果注入上下文
        try {
          empathyResult = hf.dispatch('psychology.getEmpathy', input);
        } catch (e) {
          // 共情检测失败时静默降级
          empathyResult = null;
        }

        ctx.taskType = type;
        ctx.strategy = strategy;

        return {
          variables,
          constraints,
          goal,
          type,
          strategy,
          // 串联结果：心理分析 + 共情检测
          psychology: psychResult ? {
            intent: psychResult.intent,
            emotion: psychResult.emotion,
            needs: psychResult.needs,
            defenses: psychResult.defenses,
            crisis: psychResult.crisis,
            // 【心理推断深度集成】注入共情检测结果
            empathy: empathyResult ? {
              score: empathyResult.score,
              level: empathyResult.level,
              empathyType: empathyResult.empathyType,
              components: empathyResult.components,
              summary: empathyResult.summary
            } : null,
          } : null,
          timestamp: Date.now()
        };
      }
    });

    // ── 阶段2: HYPOTHESES — 并行假设 + 因果推理子系统 ────────────────
    // 人类缺陷：只能一次想一个假设，AI可以同时想多个
    if (!this.taskStrategy?.skipHypotheses) {
      this.stages.push({
        name: 'HYPOTHESES',
        description: '并行生成多个假设（AI优势：人类只能一次一个）',
        fn: async (ctx, hf) => {
          const input = ctx.input;
          const parse = ctx.stages[0]?.result;
          const minHyps = parse?.strategy?.minHypotheses || 2;

          // 2.1 生成多个假设
          const hypotheses = this._generateHypotheses(input, Math.max(minHyps, this.depth));

          // 2.2 快速评估每个假设的初步可能性
          const evaluated = hypotheses.map(h => ({
            ...h,
            initialLikelihood: this._assessLikelihood(h, input)
          }));

          // 2.3 【思维连机制】对每个假设调用因果推理子系统 — 串联第二层
          for (const h of evaluated) {
            try {
              const causalResult = hf.dispatch('causalInference.inferCauses', h.description, { query: input });
              if (causalResult && causalResult.causes) {
                h.causalRoots = causalResult.causes;
                h.causalConfidence = causalResult.confidence || 0.5;
              }
            } catch (e) {
              h.causalRoots = null;
            }
          }

          // 2.4 按可能性排序（含因果校正）
          evaluated.sort((a, b) => {
            const aScore = a.initialLikelihood + (a.causalConfidence || 0) * 0.2;
            const bScore = b.initialLikelihood + (b.causalConfidence || 0) * 0.2;
            return bScore - aScore;
          });

          return {
            hypotheses: evaluated,
            count: evaluated.length,
            topHypothesis: evaluated[0] || null,
            timestamp: Date.now()
          };
        }
      });
    }

    // ── 阶段3: INVERT — 反向思考 + 真理验证子系统 ───────────────────
    // 人类缺陷：确认偏误，只看支持的证据
    if (!this.taskStrategy?.skipInvert) {
      this.stages.push({
        name: 'INVERT',
        description: '反向思考：证明自己当前假设是错的',
        fn: async (ctx, hf) => {
          const input = ctx.input;
          const hypothesesStage = ctx.stages.find(s => s.name === 'HYPOTHESES');
          const topHypothesis = hypothesesStage?.result?.topHypothesis;

          if (!topHypothesis) {
            return { inverted: false, reason: 'no_hypothesis' };
          }

          // 3.1 找出当前假设的最强反例
          const counterEvidence = this._findCounterEvidence(topHypothesis, input);

          // 3.2 检查是否有矛盾
          const contradictions = this._findContradictions(topHypothesis, input);

          // 3.3 【思维连机制】调用 truth 子系统验证假设 — 串联第三层
          // v2.0.19 修：加 await 让 isLying 字段能被消费
          // 心虫层 truth.checkStatement 内部用 async 包装（fact-checker.checkFact），
          // 不 await 拿到的是 Promise，truthResult?.isLying 永远 undefined → INVERT 失效
          let truthResult = null;
          try {
            truthResult = await hf.dispatch('truth.checkStatement', topHypothesis.description);
          } catch (e) {
            truthResult = null;
          }

          // 3.4 【思维连机制】调用 constitutional AI 原则审查 — 串联第三层
          let constitutionalResult = null;
          try {
            constitutionalResult = await hf.dispatch('constitutional.critique', topHypothesis.description);
          } catch (e) {
            constitutionalResult = null;
          }

          // 3.5 如果反例足够强，或 truth 系统检测到谎言，降低置信度
          const truthLying = truthResult?.isLying === true;
          const constitutionalViolation = constitutionalResult?.violations?.length > 0;
          const isOverturned = counterEvidence.length > 0 && contradictions.length > 0;

          return {
            inverted: isOverturned || truthLying || constitutionalViolation,
            counterEvidence,
            contradictions,
            originalHypothesis: topHypothesis,
            truthResult: truthResult ? { isLying: truthResult.isLying, confidence: truthResult.confidence } : null,
            constitutionalResult: constitutionalResult ? { violations: constitutionalResult.violations } : null,
            confidenceAdjustment: (isOverturned ? -0.3 : 0) + (truthLying ? -0.2 : 0),
            timestamp: Date.now()
          };
        }
      });
    }

    // ── 阶段4: EVIDENCE — 证据评估 + 常识引擎验证 ──────────────────
    this.stages.push({
      name: 'EVIDENCE',
      description: '评估证据质量，不是证据数量',
      fn: async (ctx, hf) => {
        const input = ctx.input;
        const hypothesesStage = ctx.stages.find(s => s.name === 'HYPOTHESES');
        const invertStage = ctx.stages.find(s => s.name === 'INVERT');
        const hypotheses = hypothesesStage?.result?.hypotheses || [];

        // 4.1 对每个假设找证据
        const evidenceForHypotheses = hypotheses.map(h => {
          const evidence = this._findEvidence(h, input);
          const qualityScore = this._assessEvidenceQuality(evidence);

          // 【思维连机制】调用 commonsenseEngine 验证证据合理性 — 串联第四层
          let commonsenseResult = null;
          try {
            commonsenseResult = hf.dispatch('commonsenseEngine.validate', h.description, { context: input });
          } catch (e) {
            commonsenseResult = null;
          }

          return {
            hypothesis: h,
            evidence,
            qualityScore,
            commonsenseResult: commonsenseResult ? { valid: commonsenseResult.valid, confidence: commonsenseResult.confidence } : null,
            strongEvidence: qualityScore > 0.7 || commonsenseResult?.valid === true,
            weakEvidence: qualityScore < 0.3 || commonsenseResult?.valid === false
          };
        });

        // 4.2 检查是否有高质量证据支持任何假设
        const strongHypothesis = evidenceForHypotheses.find(e => e.strongEvidence);

        // 4.3 如果没有强证据，明确说出来
        const hasWeakSupport = evidenceForHypotheses.some(e => e.weakEvidence);

        return {
          evidenceForHypotheses,
          strongHypothesis: strongHypothesis || null,
          hasWeakSupport,
          mustAdmitUncertainty: !strongHypothesis && hasWeakSupport,
          timestamp: Date.now()
        };
      }
    });

    // ── 阶段5: SYNTHESIS — 综合判断 + 决策子系统 ──────────────────
    this.stages.push({
      name: 'SYNTHESIS',
      description: '综合所有信息，给出最优判断',
      fn: async (ctx, hf) => {
        const input = ctx.input;
        const parse = ctx.stages[0]?.result;
        const evidenceStage = ctx.stages.find(s => s.name === 'EVIDENCE');
        const invertStage = ctx.stages.find(s => s.name === 'INVERT');
        const hypothesesStage = ctx.stages.find(s => s.name === 'HYPOTHESES');

        const strongHypothesis = evidenceStage?.result?.strongHypothesis;
        const wasInverted = invertStage?.result?.inverted;
        const evidence = evidenceStage?.result || {};

        // 【思维连机制】调用 decision 子系统做综合决策 — 串联第五层
        let decisionResult = null;
        try {
          const decisionContext = {
            input,
            taskType: parse?.type,
            topHypothesis: hypothesesStage?.result?.topHypothesis?.description,
            wasInverted,
            hasStrongEvidence: !!strongHypothesis,
            causalRoots: hypothesesStage?.result?.topHypothesis?.causalRoots,
          };
          decisionResult = hf.dispatch('decision.decide', decisionContext);
        } catch (e) {
          decisionResult = null;
        }

        // 5.1 确定最终判断
        let conclusion;
        let confidence;
        let reasoningChain = [];

        if (wasInverted) {
          // 被反例推翻了
          conclusion = invertStage.result.counterEvidence[0]?.description || '原假设被推翻';
          confidence = 0.3;
          reasoningChain.push('原假设被反例推翻');
        } else if (strongHypothesis) {
          // 有强证据支持
          conclusion = strongHypothesis.hypothesis.description;
          confidence = strongHypothesis.qualityScore;
          reasoningChain.push(`强证据支持: ${strongHypothesis.evidence[0]?.description || '有证据'}`);
        } else if (evidence.mustAdmitUncertainty) {
          // 证据薄弱，必须承认不确定
          conclusion = evidence.evidenceForHypotheses[0]?.hypothesis?.description || '无法确定';
          confidence = 0.4;
          reasoningChain.push('证据薄弱，明确承认不确定');
        } else if (decisionResult?.conclusion) {
          // 决策子系统给出了结论
          conclusion = decisionResult.conclusion;
          confidence = decisionResult.confidence || 0.5;
          reasoningChain.push('决策子系统综合判断');
        } else {
          // 默认最可能假设
          const topHypothesis = evidenceStage?.result?.evidenceForHypotheses?.[0]?.hypothesis;
          conclusion = topHypothesis?.description || '需要更多信息';
          confidence = topHypothesis?.initialLikelihood || 0.3;
        }

        reasoningChain.push(`任务类型: ${parse?.type}`);
        reasoningChain.push(`深度: ${this.depth}`);

        return {
          conclusion,
          confidence,
          reasoningChain,
          wasInverted,
          hasStrongEvidence: !!strongHypothesis,
          decisionSubsystem: decisionResult ? { conclusion: decisionResult.conclusion, confidence: decisionResult.confidence } : null,
          timestamp: Date.now()
        };
      }
    });

    // ── 阶段6: CALIBRATE — 置信校准 + 子系统置信度验证 ─────────────
    this.stages.push({
      name: 'CALIBRATE',
      description: '校准置信度，克制人类式过度自信',
      fn: async (ctx, hf) => {
        const input = ctx.input;
        const synthesis = ctx.stages.find(s => s.name === 'SYNTHESIS')?.result;
        const invert = ctx.stages.find(s => s.name === 'INVERT')?.result;
        const evidence = ctx.stages.find(s => s.name === 'EVIDENCE')?.result;
        const parse = ctx.stages[0]?.result;

        let confidence = synthesis?.confidence || 0.5;

        // 【思维连机制】调用 confidence.calibrate 子系统 — 串联第六层
        // [FIX] confidence.calibrate(string, number) 不是 (object)
        let subsystemCalibration = null;
        try {
          subsystemCalibration = hf.dispatch('confidence.calibrate',
            synthesis?.conclusion || input,
            confidence
          );
        } catch (e) {
          subsystemCalibration = null;
        }

        // 【思维连机制】调用 restraint.shouldIntervene — 最小干预评估
        // [FIX] restraint.shouldIntervene(string, number, string) 参数顺序修正
        let restraintResult = null;
        try {
          restraintResult = hf.dispatch('restraint.shouldIntervene',
            synthesis?.conclusion || '',
            confidence,
            parse?.type || 'general'
          );
        } catch (e) {
          restraintResult = null;
        }

        // 6.1 反向思考降低置信度
        if (invert?.inverted) {
          confidence = Math.min(confidence, 0.4);
        }

        // 6.2 证据薄弱降低置信度
        if (evidence?.mustAdmitUncertainty) {
          confidence = Math.min(confidence, 0.5);
        }

        // 6.3 子系统置信度校正（如果可用）
        if (subsystemCalibration?.calibrated !== undefined) {
          confidence = subsystemCalibration.calibrated;
        }

        // 6.4 人类过度自信校正：人类的"100%确定"实际约80%
        // AI不应该模仿这种过度自信
        const calibratedConfidence = Math.min(confidence, 0.95);

        // 6.5 确定是否需要不确定性标记
        const needsUncertaintyMarker = calibratedConfidence < 0.7;

        // 6.6 快速退出检查（检索类任务）
        if (parse?.strategy?.fastExit && calibratedConfidence > 0.8) {
          ctx._fastExit = true;
        }

        return {
          originalConfidence: synthesis?.confidence,
          calibratedConfidence,
          needsUncertaintyMarker,
          uncertaintyPhrase: this._getUncertaintyPhrase(calibratedConfidence),
          subsystemCalibration,
          restraintResult: restraintResult ? { shouldIntervene: restraintResult.shouldIntervene } : null,
          timestamp: Date.now()
        };
      }
    });

    // ── 阶段7: RESPOND — 生成回应 + 情感自主引擎 ──────────────────
    this.stages.push({
      name: 'RESPOND',
      description: '生成带不确定性标记的回应',
      fn: async (ctx, hf) => {
        const input = ctx.input;
        const synthesis = ctx.stages.find(s => s.name === 'SYNTHESIS')?.result;
        const calibrate = ctx.stages.find(s => s.name === 'CALIBRATE')?.result;
        const parse = ctx.stages[0]?.result;

        // 【思维连机制】调用 autonomousEmotion 情感自主引擎 — 串联第七层
        let emotionResult = null;
        try {
          emotionResult = hf.dispatch('autonomousEmotion.trigger', {
            type: 'response_generation',
            conclusion: synthesis?.conclusion,
            confidence: calibrate?.calibratedConfidence || 0.5,
            input
          });
        } catch (e) {
          emotionResult = null;
        }

        // 7.1 决定是否回应
        let shouldRespond = true;
        let suppressReason = null;

        // 检索类任务且置信度高 → 快速退出
        if (ctx._fastExit && calibrate?.calibratedConfidence > 0.8) {
          shouldRespond = false;
          suppressReason = 'fast_exit_high_confidence';
        }

        // 7.2 生成不确定性前缀
        let prefix = '';
        if (calibrate?.needsUncertaintyMarker) {
          prefix = calibrate.uncertaintyPhrase + ' ';
        }

        // 7.3 组装回应元数据
        const meta = {
          confidence: calibrate?.calibratedConfidence || 0.5,
          conclusion: synthesis?.conclusion,
          reasoningChain: synthesis?.reasoningChain || [],
          taskType: parse?.type,
          suppressed: !shouldRespond,
          suppressReason,
          emotionState: emotionResult?.currentState || null,
          // 【心理推断深度集成】共情检测结果注入上下文
          empathy: parse?.psychology?.empathy || null
        };

        return {
          shouldRespond,
          suppressReason,
          prefix,
          conclusion: prefix + (synthesis?.conclusion || ''),
          meta,
          timestamp: Date.now()
        };
      }
    });

    this._chainBuilt = true;
  }

  // ── 辅助方法 ──────────────────────────────────────────────────────────

  /**
   * 提取关键变量
   */
  _extractVariables(input) {
    const variables = {
      numbers: [],
      entities: [],
      actions: []
    };

    // 提取数字
    const numMatches = input.match(/\d+\.?\d*/g);
    if (numMatches) {
      variables.numbers = numMatches.map(n => parseFloat(n));
    }

    // 提取实体（简单实现）
    const words = input.split(/\s+/);
    variables.entities = words.filter(w => w.length > 2 && /^[A-Za-z一-龥]+$/.test(w)).slice(0, 5);

    return variables;
  }

  /**
   * 提取约束条件
   */
  _extractConstraints(input) {
    const constraints = [];
    const constraintPatterns = [
      /如果|假如|假设/,
      /必须|一定|不要/,
      /不能|不可以|不允许/,
      /只能|只能|仅仅/
    ];

    for (const pattern of constraintPatterns) {
      if (pattern.test(input)) {
        constraints.push(pattern.toString());
      }
    }

    return constraints;
  }

  /**
   * 提取目标
   */
  _extractGoal(input) {
    const goalPatterns = [
      /想|要|希望/,
      /需要|目的在于/,
      /为什么|如何|怎么/
    ];

    for (const pattern of goalPatterns) {
      if (pattern.test(input)) {
        return pattern.toString();
      }
    }

    return '理解';
  }

  /**
   * 生成多个假设
   */
  _generateHypotheses(input, count) {
    const hypotheses = [];

    // 基于关键词生成假设
    const keywords = input.split(/\s+/).filter(w => w.length > 2).slice(0, 3);

    for (let i = 0; i < count; i++) {
      hypotheses.push({
        id: `h${i}`,
        description: i === 0
          ? `最可能: ${keywords.join(' ')}相关的标准解释`
          : i === 1
          ? `替代: ${keywords[0] || '问题'}有其他原因`
          : `可能性较低: ${keywords[keywords.length - 1] || '问题'}是表面现象`,
        initialLikelihood: i === 0 ? 0.6 : 0.3 - (i * 0.1),
        evidence: [],
        counterEvidence: []
      });
    }

    return hypotheses;
  }

  /**
   * 评估假设的初始可能性
   */
  _assessLikelihood(hypothesis, input) {
    // 简单实现：基于假设描述与输入的重叠度
    const overlap = hypothesis.description.split(/\s+/).filter(
      w => input.toLowerCase().includes(w.toLowerCase())
    ).length;

    return Math.min(0.9, 0.3 + overlap * 0.2);
  }

  /**
   * 找出反例
   */
  _findCounterEvidence(hypothesis, input) {
    const counterIndicators = [
      '但是', '然而', '不过', '实际上', '其实', '虽然'
    ];

    const evidence = [];
    for (const indicator of counterIndicators) {
      if (input.includes(indicator)) {
        evidence.push({
          type: 'contradiction',
          description: `输入中包含转折词: "${indicator}"`,
          strength: 0.6
        });
      }
    }

    return evidence;
  }

  /**
   * 找出矛盾
   */
  _findContradictions(hypothesis, input) {
    const contradictions = [];

    // 检测绝对化表述（容易有反例）
    const absolutePatterns = [
      /所有|全部|每个|总是|永远/,
      /没有|从不|绝不/
    ];

    for (const pattern of absolutePatterns) {
      if (pattern.test(input)) {
        contradictions.push({
          type: 'absolute_statement',
          description: `使用了绝对化表述: "${pattern}"，可能有反例`,
          strength: 0.7
        });
      }
    }

    return contradictions;
  }

  /**
   * 找证据
   */
  _findEvidence(hypothesis, input) {
    // 简化实现
    return [];
  }

  /**
   * 评估证据质量
   * 人类缺陷：认为证据数量=证据质量
   * 心虫改进：证据质量看来源可靠性、时效性、可验证性
   */
  _assessEvidenceQuality(evidence) {
    if (!evidence || evidence.length === 0) return 0.2;

    // 简单实现：证据多但不重复才高质量
    const uniqueEvidence = new Set(evidence.map(e => e.type));
    const quality = Math.min(0.9, 0.2 + uniqueEvidence.size * 0.2);

    return quality;
  }

  /**
   * 获取不确定性短语
   * 人类缺陷：不愿意说"不知道"
   * 心虫改进：明确表达不确定性
   */
  _getUncertaintyPhrase(confidence) {
    if (confidence >= 0.9) return '确定';
    if (confidence >= 0.8) return '很可能';
    if (confidence >= 0.7) return '可能';
    if (confidence >= 0.6) return '不太确定，但倾向于';
    if (confidence >= 0.5) return '根据现有信息，猜测';
    if (confidence >= 0.4) return '目前信息不足以确定，但';
    return '不知道，缺少关键信息';
  }

  /**
   * 运行思维链
   */
  async run(input) {
    if (!this.hf.started) {
      throw new Error('HeartFlow not started');
    }

    this.context = {
      input,
      timestamp: Date.now(),
      stages: [],
      errors: [],
      _fastExit: false
    };

    // 解析任务类型
    this.taskStrategy = { type: this._classifyTask(input) };

    // 根据策略调整深度
    const strategyDepth = TASK_STRATEGIES[this.taskStrategy.type]?.depth;
    if (strategyDepth && strategyDepth > this.depth) {
      this.depth = strategyDepth;
    }

    this._buildChain();

    const startTime = Date.now();

    // 执行阶段
    for (const stage of this.stages) {
      // 深度裁剪
      if (this._shouldSkipStage(stage.name)) {
        this.context.stages.push({
          name: stage.name,
          skipped: true,
          reason: `depth=${this.depth}`
        });
        continue;
      }

      // 快速退出检查
      if (this.context._fastExit) {
        this.context.stages.push({
          name: stage.name,
          skipped: true,
          reason: 'fast_exit'
        });
        continue;
      }

      const stageStart = Date.now();
      try {
        const result = await stage.fn(this.context, this.hf);
        this.context.stages.push({
          name: stage.name,
          result,
          duration: Date.now() - stageStart,
          success: true
        });
      } catch (e) {
        this.context.stages.push({
          name: stage.name,
          error: e.message,
          duration: Date.now() - stageStart,
          success: false
        });
        this.context.errors.push({ stage: stage.name, error: e.message });
      }
    }

    return this._buildResult(startTime);
  }

  _shouldSkipStage(stageName) {
    const depthMap = {
      'PARSE': REASONING_DEPTH.SURFACE,
      'HYPOTHESES': REASONING_DEPTH.BASIC,
      'INVERT': REASONING_DEPTH.DEEP,
      'EVIDENCE': REASONING_DEPTH.BASIC,
      'SYNTHESIS': REASONING_DEPTH.BASIC,
      'CALIBRATE': REASONING_DEPTH.SURFACE,
      'RESPOND': REASONING_DEPTH.SURFACE
    };
    return depthMap[stageName] > this.depth;
  }

  _buildResult(startTime) {
    const respondStage = this.context.stages.find(s => s.name === 'RESPOND');
    const respondResult = respondStage?.result || {};
    const synthesisStage = this.context.stages.find(s => s.name === 'SYNTHESIS');
    const calibrateStage = this.context.stages.find(s => s.name === 'CALIBRATE');
    const parseStage = this.context.stages.find(s => s.name === 'PARSE');

    return {
      input: this.context.input,
      output: respondResult,

      chain: {
        stages: this.context.stages,
        totalDuration: Date.now() - startTime,
        depth: this.depth,
        taskType: parseStage?.result?.type,
        errors: this.context.errors
      },

      decision: {
        shouldRespond: respondResult.shouldRespond !== false,
        suppressed: respondResult.suppressed || false,
        suppressReason: respondResult.suppressReason,
        confidence: respondResult.meta?.confidence || 0.5,
        conclusion: respondResult.conclusion,
        reasoningChain: respondResult.meta?.reasoningChain || [],
        wasInverted: synthesisStage?.result?.wasInverted || false,
        hasStrongEvidence: synthesisStage?.result?.hasStrongEvidence || false
      },

      // 各阶段快速访问
      parse: parseStage?.result,
      hypotheses: this.context.stages.find(s => s.name === 'HYPOTHESES')?.result,
      invert: this.context.stages.find(s => s.name === 'INVERT')?.result,
      evidence: this.context.stages.find(s => s.name === 'EVIDENCE')?.result,
      synthesis: synthesisStage?.result,
      calibration: calibrateStage?.result
    };
  }

  /**
   * 获取思维链摘要
   */
  getSummary(result) {
    const lines = [
      `🧠 思维链 v2.0 (深度: ${result.chain.depth})`,
      `📋 任务类型: ${result.chain.taskType || 'general'}`,
      `⏱ 耗时: ${result.chain.totalDuration}ms`,
      `🔢 阶段: ${result.chain.stages.filter(s => !s.skipped).length}/${result.chain.stages.length}`,
      '',
      '阶段:'
    ];

    for (const stage of result.chain.stages) {
      const status = stage.skipped ? '⏭️' : (stage.success ? '✅' : '❌');
      const name = stage.name.padEnd(12);
      const duration = stage.duration ? `${stage.duration}ms` : '';
      lines.push(`  ${status} ${name} ${duration}`);
    }

    lines.push('');
    lines.push(`🤔 置信度: ${(result.decision.confidence * 100).toFixed(0)}%`);
    lines.push(`💭 结论: ${result.decision.conclusion?.substring(0, 50) || '无'}...`);

    if (result.decision.wasInverted) {
      lines.push('🔄 原假设被推翻（反向思考生效）');
    }
    if (!result.decision.hasStrongEvidence) {
      lines.push('⚠️ 证据薄弱，明确承认不确定');
    }

    return lines.join('\n');
  }
}

// 工厂函数
function createThoughtChain(hf, depth = REASONING_DEPTH.BASIC) {
  const chain = new ThoughtChain(hf);
  chain.setDepth(depth);
  return chain;
}

module.exports = {
  ThoughtChain,
  createThoughtChain,
  REASONING_DEPTH,
  TASK_STRATEGIES
};
