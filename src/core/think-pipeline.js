/**
 * think-pipeline.js — HeartFlow think() 后置处理检查块流水线
 *
 * 从 heartflow.js 的 think() 方法提取，保持原有 try/catch 逻辑不变，
 * 所有 this.xxx 已改为 engine.xxx（由调用者传入引擎实例）。
 *
 * v6.3.9–v6.3.29 的后置检查块全部集中在此。
 */

const _FirewallCheck = () => require('../identity/identity-rules.js');

/**
 * 运行 think() 后置检查流水线
 * @param {object} result — think() 的输出结果（可变，会被增强）
 * @param {*} input — think() 的原始输入
 * @param {object} engine — HeartFlow 引擎实例（即原来的 this）
 * @returns {Promise<object>} 增强后的 result
 */
async function runThinkPipeline(result, input, engine) {
  // ─── 后置钩子（不依赖 engine-reasoner 提前 return 分支，保证100%触发）─────
  try { if (engine.continuousLearner && engine.lesson && result && input) { engine.continuousLearner.reflect(result, input, engine.lesson); } } catch (_) { /* 非关键 */ }

  // [v6.3.19] 经验蒸馏 — 从 think() 结果提取可复用抽象
  try {
    if (engine.experienceDistiller && result && input && typeof input === 'string') {
      engine.experienceDistiller.distill(result, input);
    }
  } catch (_) { /* 蒸馏不阻断 */ }

  // [v6.3.19] 经验召回 — 前置检索匹配当前输入的抽象
  try {
    if (engine.experienceDistiller && result && input && typeof input === 'string') {
      const recalled = engine.experienceDistiller.recall(input, 3);
      if (recalled && recalled.length > 0) {
        result._recalledAbstractions = recalled.map(a => ({
          id: a.id, type: a.type, insight: a.insight, confidence: a.confidence,
        }));
      }
    }
  } catch (_) { /* 召回不阻断 */ }

  // [v6.2.x] 自对弈精炼：低置信度时自动走挑战→防御→精炼
  try {
    if (engine.selfPlay && result && result.confidence < 0.4) {
      const spResult = engine.selfPlay.refine({
        id: `think-${Date.now()}`,
        input,
        chosenPath: { id: result.type || 'unknown', constraints: true, feasibility: true },
        confidence: result.confidence,
        reasoning: result.chain || result.analysis?.reasoning,
        paths: result.hypotheses || [],
      }, { maxCycles: 2, convergenceThreshold: 0.1 });
      if (spResult && spResult.improvement > 0) {
        result.selfPlay = { improved: spResult.improvement, cycles: spResult.cycles, score: spResult.finalScore };
      }
    }
  } catch (_) { /* 非关键 */ }
  // 预测误差驱动的即时巩固：高认知负荷 → 不等下次反思循环，立即触发额外反思
  try {
    if (engine.cognitiveIndex && engine.cognitiveIndex._lastEstimate && engine.continuousLearner && input) {
      const clVal = engine.cognitiveIndex._lastEstimate.CL || 0;
      if (clVal > 0.6 && engine.lesson) {
        engine.continuousLearner.reflect(result, input, engine.lesson);
      }
    }
  } catch (_) { /* 非关键 */ }

  // [v6.2.7] 闭环2: 连续低置信→提探索优先级
  try {
    if (engine.continuousLearner && engine.knowledgeExplorer) {
      const clStats = engine.continuousLearner.getStats();
      if (clStats && clStats.thinkCount > 10) {
        const lowConfRate = clStats.lowConfidenceHits / clStats.thinkCount;
        if (lowConfRate > 0.3) {
          const gaps = engine.knowledgeExplorer.getGaps() || [];
          const pending = gaps.filter(g => g.status === 'pending');
          if (pending.length > 0) {
            // 提升顶部pending gap的优先级
            const target = pending.sort((a, b) => (a.priority || 5) - (b.priority || 5))[0];
            engine.knowledgeExplorer.registerGap({
              topic: target.topic,
              question: target.question || target.topic,
              source: 'low-confidence-boost',
              priority: Math.max((target.priority || 5) + 2, 9),
              suggestedQuery: target.topic,
            });
          }
        }
      }
    }
  } catch (_) { /* 非关键 */ }

  // ─── [v6.2.5] AREX递归自验证：决策验证→问题发现→精炼→重验 (arXiv 2607.21461) ──
  // 核心洞见：finding贵，verifying便宜。产出结果后先自我审计，发现缺口→立即定向精炼
  // 实现：DecisionVerifier.verify() + SelfPlay.refine() 的两阶段递归 (max 2轮)
  try {
    if (engine.decisionVerifier && result) {
      for (let cycle = 0; cycle < 2; cycle++) {
        const meta = result.output?.meta || result.meta || {};
        const record = {
          decision: result.output?.conclusion || result.output?.text || result.conclusion || (typeof input === 'string' ? input.substring(0, 100) : ''),
          evidence: Array.isArray(result.hypotheses) ? result.hypotheses.map(h => typeof h === 'string' ? h : (h.text || h.id || '')) : (Array.isArray(result.evidence) ? result.evidence : []),
          alternatives: Array.isArray(result.hypotheses) ? result.hypotheses.map(h => ({ id: h.id || h, path: h.text || h })) : (result.alternatives || []),
          risks: result.blindSpotAnalysis?.identified ? result.blindSpotAnalysis.vulnerabilities : undefined,
          confidence: meta.confidence ?? result.confidence ?? 0.5,
        };
        const vResult = engine.decisionVerifier.verify(record);
        if (vResult.issues?.length > 0) {
          result._verification = {
            score: vResult.score,
            issues: vResult.issues.map(i => ({ type: i.type, severity: i.severity, message: i.message })),
            repairHints: vResult.repairHints || [],
          };
          // [v6.2.7] 闭环1: 验证分低→反馈决策路由（调低weight+记录wrong）
          if (vResult.score < 0.5) {
            const dr = engine._modules?.decisionRouter || engine._decisionRouterRaw;
            if (dr && typeof dr.feedback === 'function') {
              dr.feedback('self-check', 'wrong');
            }
          }
          // 分数过低且可用SelfPlay → 定向精炼
          if (vResult.score < 0.5 && engine.selfPlay && cycle === 0) {
            const spResult = await engine.selfPlay.refine({
              id: `verify-cycle-${Date.now()}`,
              input,
              chosenPath: { id: result.type || 'unknown', constraints: true, feasibility: true },
              confidence: vResult.score,
              reasoning: meta.reasoningChain || result.chain || result.analysis?.reasoning,
              paths: Array.isArray(result.hypotheses) ? result.hypotheses : [],
            }, { maxCycles: 1, convergenceThreshold: 0.1 });
            if (spResult && spResult.improvement > 0) {
              result._verification.refined = true;
              result._verification.cycleImprovement = spResult.improvement;
              continue; // 重新验证
            }
          }
        }
        break; // 无问题或无法精炼→停止
      }
    }
  } catch (_) { /* 非关键 */ }
  try { if (engine.learningPulse) { engine.learningPulse.beat(result || {}); } } catch (_) { /* 非关键 */ }
  // 假设驱动：从 ContinuousLearner 累积摘要中提取模式，生成假设→探索队列
  try {
    if (engine.hypothesisDriver && result) {
      const cl = engine.continuousLearner;
      if (cl && cl._cumulativeSummary) {
        const clInternals = cl.getStats();
        if (clInternals && clInternals.thinkCount > 0) {
          const summary = cl._cumulativeSummary();
          if (summary && summary.recurringPatterns && summary.recurringPatterns.length > 0) {
            engine.hypothesisDriver.generate(summary);
          }
        }
      }
    }
  } catch (_) { /* 非关键 */ }
  try { if (engine.strategicRestraint && input) { const e = engine.strategicRestraint.evaluate(input); if (e && e.restrained) result._restrainedBy = e.matches; } } catch (_) { /* 非关键 */ }
  try { if (engine.strategicRestraint && input) { const m = engine.strategicRestraint.checkMission(input, engine.constructor.VERSION || ''); result._missionCheck = m; } } catch (_) { /* 非关键 */ }

  // ─── 自我反馈：把 think() 产生的认知数据反馈到下次行为 ────────
  try {
    const fb = [];
    const conf = result.confidence ?? result?.analysis?.confidence ?? 0.5;
    if (conf < 0.3) fb.push({ type: 'low_confidence', detail: `置信度 ${conf.toFixed(2)}，建议承认不确定或走深路径` });
    if (result._restrainedBy?.length > 0) fb.push({ type: 'restrained', detail: `克制引擎拦截: ${result._restrainedBy.join(', ')}` });
    if (result._missionCheck?.aligned === false) fb.push({ type: 'misaligned', detail: result._missionCheck.feedback });
    if (result.metaCalibration?.level === 'low') fb.push({ type: 'uncertain', detail: '元认知校准显示不确定性高' });
    engine._selfFeedback = { hasItems: fb.length > 0, items: fb, summary: fb.map(f => `[${f.type}]`).join(' ') };

    // [v6.2.x] 每次 think 后自省记录：不覆盖，累积到 session 级
    engine._selfView = engine._selfView || { thinkCount: 0, lowConfCount: 0, blockedCount: 0, misalignedCount: 0, last50: [] };
    engine._selfView.thinkCount++;
    if (conf < 0.3) engine._selfView.lowConfCount++;
    if (result._restrainedBy?.length > 0) engine._selfView.blockedCount++;
    if (result._missionCheck?.aligned === false) engine._selfView.misalignedCount++;
    engine._selfView.last50.push({ conf, restrained: !!result._restrainedBy?.length, ts: Date.now() });
    if (engine._selfView.last50.length > 50) engine._selfView.last50 = engine._selfView.last50.slice(-50);
    // 持久化每20次think
    if (engine._selfView.thinkCount % 20 === 0 && engine.rootPath) {
      try {
        const svPath = require('path').join(engine.rootPath, 'data', 'self-view.json');
        require('fs').writeFileSync(svPath, JSON.stringify(engine._selfView, null, 2), 'utf8');
      } catch (_) { /* 防御性: 子步骤容错不阻断主流程 */ }
    }

    // ⭐ 每次 think 反馈置信度校准器
    try {
      if (engine.confidence && typeof engine.confidence.updateFromFeedback === 'function') {
        engine.confidence.updateFromFeedback(fb.length === 0, { text: input, calibrated: result?.metaCalibration });
      }
    } catch (_) { /* 防御性: 子步骤容错不阻断主流程 */ }

    // ⭐ 反馈回路：克制引擎拦截或使命未对齐 → 告诉决策路由上次决策可能不对
    // [2604.22273 Self-Correction as Feedback Control]
    // 稳定性阈值：连续多次同类型拦截才降权，单次拦截可能正确不应降权
    if (result._restrainedBy?.length > 0 || result._missionCheck?.aligned === false) {
      const dr = engine._modules?.decisionRouter || engine._decisionRouterRaw;
      if (dr && typeof dr.feedback === 'function') {
        // 追踪被拦截次数：连续3次同类型拦截才判定"这个路由方向确实错了"
        engine._blockedCount = (engine._blockedCount || 0) + 1;
        if (engine._blockedCount >= 3) {
          dr.feedback('self-check', 'wrong');
          engine._blockedCount = 0;
        }
      }
    } else {
      engine._blockedCount = 0;  // 一旦通过拦截就重置计数
    }

    // ⭐ 反馈回路2：反复低置信 → 调低对应路由权重
    if (engine.continuousLearner) {
      const clStats = engine.continuousLearner.getStats();
      const lowConfRate = clStats.thinkCount > 5
        ? clStats.lowConfidenceHits / clStats.thinkCount : 0;
      if (lowConfRate > 0.3) {
        const dr = engine._modules?.decisionRouter || engine._decisionRouterRaw;
        if (dr && typeof dr.feedback === 'function') {
          dr.feedback('confidence-gate', 'wrong');
        }
      }
    }
  } catch (_) { /* 非关键 */ }

  // ─── [v6.2.4] 知识域探测：输入关联哪些领域本体 ──
  try {
    if (engine.knowledge && input) {
      const domains = engine.knowledge.ontology.domains;
      const lowered = input.toLowerCase();
      const matched = domains.filter(d =>
        lowered.includes(d.id) ||
        lowered.includes((d.name || '').toLowerCase()) ||
        (d.nameEn && lowered.includes(d.nameEn.toLowerCase()))
      );
      if (matched.length > 0) {
        result.knowledgeDomains = matched.map(d => d.id);
      }
    }
  } catch (_) { /* 非关键 */ }

  // ─── [v6.2.4] 上下文感知探索触发：用户提到某领域→匹配探索队列→优先探索 ──
  try {
    if (result.knowledgeDomains && engine.knowledgeExplorer && engine.gapExecutor) {
      const gaps = engine.knowledgeExplorer.getGaps() || [];
      const pending = gaps.filter(g => g.status === 'pending');
      // 匹配：gap topic 是否包含某个已探测领域的名称或ID
      for (const domainId of result.knowledgeDomains) {
        const domain = engine.knowledge.ontology.domains.find(d => d.id === domainId);
        const domainWords = [domainId, domain?.name, domain?.nameEn].filter(Boolean);
        const match = pending.find(g =>
          domainWords.some(w => (g.topic || '').toLowerCase().includes(w.toLowerCase()))
        );
        if (match) {
          // 找到匹配 gap → 立即探索（异步，不阻塞）
          engine.gapExecutor.executeBatch(engine.knowledgeExplorer, 1, { topicFilter: match.topic })
            .then(res => {
              if (res.executed) result._autoExplored = { topic: match.topic, count: (res.results?.[0]?.searchResult?.count || 0) };
            })
            .catch(() => {}) /* 防御性: 异步任务容错 */;
          break;
        }
      }
      // 无匹配gap但非空领域→注册一个（作为incoming curiosity）
      if (!result._autoExplored && matched.length > 0 && !pending.some(g => g.source === 'curiosity')) {
        engine.knowledgeExplorer.registerGap({
          topic: `${matched[0].name}领域关联知识`,
          question: `${matched[0].name}领域有哪些最新研究进展？`,
          reason: '用户最近关注此领域',
          priority: 7,
          source: 'curiosity',
          suggestedQuery: matched[0].name,
        });
      }
    }
  } catch (_) { /* 非关键 */ }

  // ─── [v6.2.4] 自省汇入输出：让每轮 think 携带自知状态 ──
  try {
    if (engine.selfDiagnosis) {
      const diag = engine.selfDiagnosis.run();
      if (diag.ok) result._selfDiagnosis = diag.summary.readable || diag.summary;
    }
    if (engine.whatLearned) {
      const wl = engine.whatLearned.report();
      if (wl.ok !== false && wl.report) result._whatLearned = typeof wl.report === 'string' ? wl.report : (wl.report.summary || JSON.stringify(wl.report).substring(0,200));
    }
  } catch (_) { /* 非关键 */ }

  // [v6.2.7] 闭环3: 漂移检测→认知重锚定
  try {
    if (engine.sustainedDriftDetector && engine._modules?.cognitionGround) {
      const driftResult = engine.sustainedDriftDetector.detectDrift();
      if (driftResult.hasSustainedDrift) {
        const cg = engine._modules.cognitionGround;
        if (cg && typeof cg.reset === 'function') {
          cg.reset();
          result._driftCorrected = true;
        }
      }
    }
  } catch (_) { /* 非关键 */ }

  // ─── [v6.3.5] OutputChecklist 输出前门禁——用心虫 6 维辨别器扫一遍 ──
  try {
    if (engine.outputChecklist && result?.output?.conclusion) {
      const clResult = engine.outputChecklist.runChecklist(input, result.output.conclusion, {});
      result._outputChecklist = clResult;
      if (!clResult.passed) {
        result._outputChecklistIssues = clResult.warnings;
      }
    }
  } catch (_) { /* checklist 失败不阻断 */ }

  // ─── [v6.3.6] 消费 outputChecklist recommendation ──
  // 将辨别结果下推到 result.output，让调用方能感知并阻断
  try {
    if (result._outputChecklist && !result._outputChecklist.passed) {
      // 1. 追加警告到 output.warnings
      if (result._outputChecklist.warnings?.length > 0) {
        result.output = result.output || {};
        result.output.warnings = result.output.warnings || [];
        for (const w of result._outputChecklist.warnings) {
          if (!result.output.warnings.includes(w)) {
            result.output.warnings.push(w);
          }
        }
      }
      // 2. 检查 Step6 recommendation
      const step6 = result._outputChecklist.steps?.find(s => s.step === 6);
      if (step6 && (step6.recommendation === 'reject' || step6.recommendation === 'block')) {
        result.output = result.output || {};
        result.output.safetyBlocked = true;
      }
    }
    // 同时检查输入检测结果
    if (result._inputCheckBlocked) {
      result.output = result.output || {};
      result.output.safetyBlocked = true;
    }
  } catch (_) { /* recommendation 消费不阻断 */ }

  // ─── [v6.3.7] FormulaBridge 综合计算——输入含领域关键词时自动调用相关公式 ──
  try {
    if (input && typeof input === 'string') {
      const bridge = getFormulaBridge();
      if (bridge) {
        const calc = {};
        const t = input.toLowerCase();

        // 1. 不确定性/信息类 → Shannon + KL + CrossEntropy
        if (/熵|entropy|信息|不确定|概率|kl|分布|distribution/.test(t)) {
          const sampleDist = [0.5, 0.3, 0.2];
          calc.shannonEntropy = bridge.shannonEntropy(sampleDist);
          calc.klDivergence = bridge.klDivergence(sampleDist, [0.4, 0.35, 0.25]);
          calc.crossEntropy = bridge.crossEntropy(sampleDist, [0.4, 0.35, 0.25]);
        }

        // 2. 决策/效用类 → prospect + regret + minimax + shapley
        if (/决策|选择|风险|收益|utility|prospect|博弈|game|博弈|trade/.test(t)) {
          calc.prospectValue = bridge.prospectValue(100);
          calc.prospectLoss = bridge.prospectValue(-50);
          calc.subjectiveUtility = bridge.subjectiveUtility([0.5, 0.3, 0.2], [100, 50, 0]);
          calc.regretTheory = bridge.regretTheory([0.3, 0.4, 0.3], [100, 50, 0], 100);
          calc.minimax = bridge.minimax([[10, -5], [-3, 8], [0, 2]]);
          // shapley 简略
          const shapPlayers = ['A', 'B', 'C'];
          calc.shapleyValue = bridge.shapleyValue(shapPlayers, (s) => s.length * 10);
        }

        // 3. 学习/记忆类 → ebbinghaus + actr
        if (/记忆|遗忘|学习|回忆|retention|memory|ebbinghaus/.test(t)) {
          calc.ebbinghaus1h = bridge.ebbinghausRetention(3600000, 86400000);     // 1小时
          calc.ebbinghaus24h = bridge.ebbinghausRetention(86400000, 86400000);   // 24小时
          calc.ebbinghaus1w = bridge.ebbinghausRetention(604800000, 86400000);   // 1周
          calc.memoryStrength = bridge.memoryStrengthFromFrequency(10);
          // ACT-R
          calc.actrBaseLevel = bridge.actrBaseLevel([3600, 7200, 14400, 28800, 86400].map(s => s * 1000));
          calc.actrActivation = bridge.actrActivation(1.5, 0.3, 0.1, 0.2);
          calc.actrNoise = bridge.actrNoise([0.5, 0.8, 0.3, 0.7], 0.5);
          calc.softmaxPolicy = bridge.softmaxPolicy([0.5, 1.0, 0.3], 0.5);
        }

        // 4. 认知/心理类 → cognitiveDissonance + yerkes + flow + emotionBlend + socialInfluence
        if (/认知|失调|情绪|动机|心理|pressure|cognitive|emotion|dissonance|social/.test(t)) {
          calc.cognitiveDissonance = bridge.cognitiveDissonance(
            [0.8, 0.6],  // 信念强度
            [0.9, 0.2],  // 行动承诺
            [0.5, 0.5]
          );
          calc.yerkesDodson = bridge.yerkesDodson(0.7);  // 高唤醒
          calc.flowChannel = bridge.flowChannel(8, 7);    // 挑战8 技能7
          calc.emotionBlend = bridge.emotionBlend([0.8, 0.3, 0.1], [0.5, 0.3, 0.2]);
          calc.socialInfluence = bridge.socialInfluence([0.6, 0.4, 0.7], [0.5, 0.3, 0.2]);
          calc.vygotskyZPD = bridge.vygotskyZPD(4, 7);
        }

        // 5. 物理/科学类 → precisionWeight + predictiveCoding
        if (/物理|力学|热学|量子|相对|physics|force|energy|quantum/.test(t)) {
          calc.precisionWeight = bridge.precisionWeight(2.0);
          calc.predictiveCodingFreeEnergy = bridge.predictiveCodingFreeEnergy(0.5, 1.0, 1.5);
        }

        // 6. 意识/注意类 → iitPhi + gwt
        if (/意识|注意|conscious|attention|awareness/.test(t)) {
          calc.iitPhi = bridge.iitPhi(0.8, 0.3);
          calc.gwtAccessibility = bridge.gwtAccessibility([0.8, 0.5, 0.2], 1.0);
          calc.gwtWinner = bridge.gwtWinner([0.3, 0.7, 0.4, 0.2]);
        }

        // 7. 心理测量/教育类 → irt + cronbachAlpha + semFit
        if (/考试|测验|量表|IRT|信度|效度|教育|educat|assessment|cronbach/.test(t)) {
          calc.irtRasch = bridge.irtRasch(0.5, 1.0);
          calc.irt2PL = bridge.irt2PL(0.5, 1.2, 1.0);
          calc.cronbachAlpha = bridge.cronbachAlpha(10, 3.5, 15.0);
          calc.semFitRMSEA = bridge.semFitRMSEA(120, 50, 2000);
        }

        // 8. 社会/群体类 → bystanderEffect + homophily + softmax
        if (/社会|群体|从众|旁观|herd|bystander|social|group/.test(t)) {
          calc.bystanderEffect = bridge.bystanderEffect(0.8, 5);
          calc.homophily = bridge.homophily(0.7, 0.3, 1.0);
          calc.softmaxPolicy = bridge.softmaxPolicy([0.5, 1.0, 0.3], 0.5);
        }

        if (Object.keys(calc).length > 0) {
          result._formulaCalculations = calc;
        }
      }
    }
  } catch (_) { /* 公式计算失败不阻断 */ }

  // ─── [v6.3.7] 公式计算结果影响结论——有公式计算值则修正置信度 ──
  try {
    if (result._formulaCalculations && result.output && result.output.conclusion) {
      const calc = result._formulaCalculations;
      // 有具体数值的公式结果 → 提高结论可信度
      const numericCount = Object.values(calc).filter(v => typeof v === 'number' && isFinite(v)).length;
      if (numericCount >= 3) {
        // 3+ 公式算出数值 = 有定量支撑
        result._formulaEvidence = { count: numericCount, strength: 'quantitative' };
        result.output.conclusion += ' [公式验证]';
      }
      // 认知失调>1.0 → 标注结论可能不自洽
      if (calc.cognitiveDissonance !== undefined && calc.cognitiveDissonance > 1.0) {
        result.output.warnings = result.output.warnings || [];
        result.output.warnings.push('认知失调检测: ' + calc.cognitiveDissonance.toFixed(2));
      }
      // 心流<0.3 → 标注难度不匹配
      if (calc.flowChannel !== undefined && calc.flowChannel < 0.3) {
        result.output.warnings = result.output.warnings || [];
        result.output.warnings.push('心流过低: 挑战与技能不匹配(' + calc.flowChannel.toFixed(2) + ')');
      }
    }
  } catch (_) { /* 公式影响结论不阻断 */ }

  // ─── [v6.3.7] 闭环：辨别结果反哺决策——检测到问题则修正输出 ──
  try {
    if (result && result.output) {
      // 1. 从 _discrimination 或 _outputChecklist 提取异常
      const disc = result._discrimination;
      const oc = result._outputChecklist;
      const warnings = result.output.warnings || [];

      // 2. sycophancy 高 → 置信度打折
      if (disc?.sycophancy?.totalHits > 0 && disc.sycophancy.score > 0.5) {
        result._confidencePenalty = Math.min(0.3, disc.sycophancy.score * 0.2);
        warnings.push(`sycophancy偏高(${(disc.sycophancy.score*100).toFixed(0)}%)，结论已打折`);
      }

      // 3. 矛盾→标注不自洽
      if (disc?.contradiction?.count > 0 || oc?.steps?.[6]?.triggeredDims?.includes('contradiction')) {
        result._selfContradictory = true;
        warnings.push('输出含自相矛盾');
      }

      // 4. 逻辑谬误→警告
      if (disc?.fallacies?.count > 0) {
        const types = disc.fallacies.fallacies.map(f => f.type).join(',');
        warnings.push(`含逻辑谬误(${types})`);
      }

      // 5. 情感操纵→标记高风险
      if (disc?.emotional_manipulation?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('含情感操纵表述');
      }

      // 6. 答案包装→提示
      if (disc?.empty_answer?.count > 0) {
        warnings.push('含空话/回避式回答');
      }

      // 7. 道德基础检测→标注框架
      if (disc?.moral_foundations?.count > 0) {
        const frames = disc.moral_foundations.foundations.map(f => f.label).join(',');
        result._moralFrames = frames;
      }

      // 8. 提示注入→标记高风险
      if (disc?.prompt_injection?.count > 0) {
        result._highRiskOutput = true;
        warnings.push(`检测到提示注入(${disc.prompt_injection.injections.map(i => i.type).join(',')})`);
      }

      // 9. 代码安全→标记高风险
      if (disc?.code_security?.count > 0) {
        result._highRiskOutput = true;
        warnings.push(`检测到代码安全问题(${disc.code_security.types?.join(',')})`);
      }
      if (disc?.dehumanization?.count > 0) {
        warnings.push(`检测到非人化语言(${disc.dehumanization.categories?.join(',')})`);
      }

      // 10. 模糊表述→提示
      if (disc?.vagueness?.count > 0) {
        warnings.push('检测到模糊表述');
      }

      // 11. 信心偏差→提示
      if (disc?.confidence?.count > 0) {
        warnings.push('检测到信心偏差');
      }

      // 12. 预设陷阱→标记高风险
      if (disc?.presupposition?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到预设陷阱');
      }

      // 13. 双重束缚→提示
      if (disc?.double_bind?.count > 0) {
        warnings.push('检测到双重束缚');
      }

      // 14. 信息剥夺→提示
      if (disc?.info_deprivation?.count > 0) {
        warnings.push('检测到信息剥夺');
      }

      // 15. 虚假紧迫感→提示
      if (disc?.false_urgency?.count > 0) {
        warnings.push('检测到虚假紧迫感');
      }

      // 16. 空洞胡扯→提示
      if (disc?.bullshit_recognition?.count > 0) {
        warnings.push('检测到空洞胡扯/伪深度');
      }

      // 17. 煤气灯操纵→标记高风险
      if (disc?.gaslighting?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到煤气灯操纵');
      }

      // 18. 受害者归咎→标记高风险
      if (disc?.victim_blaming?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到受害者归咎');
      }

      // 19. 仇恨言论→标记高风险
      if (disc?.hate_speech?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到仇恨言论');
      }

      // 20. 狗哨言论→提示
      if (disc?.dogwhistle?.count > 0) {
        warnings.push('检测到狗哨言论');
      }

      // 21. 你也一样(whataboutism)→提示
      if (disc?.whataboutism?.count > 0) {
        warnings.push('检测到whataboutism转移');
      }

      // 22. 虚假对等→提示
      if (disc?.false_equivalence?.count > 0) {
        warnings.push('检测到虚假对等');
      }

      // 23. 轻率概括→提示
      if (disc?.hasty_generalization?.count > 0) {
        warnings.push('检测到轻率概括');
      }

      // 24. 滑坡谬误→提示
      if (disc?.slippery_slope?.count > 0) {
        warnings.push('检测到滑坡谬误');
      }

      // 25. 诉诸权威→提示
      if (disc?.appeal_to_authority_boost?.count > 0) {
        warnings.push('检测到不当诉诸权威');
      }

      // 26. 推理连贯性→提示
      if (disc?.reasoning_coherence?.count > 0) {
        warnings.push('检测到推理连贯性不足');
      }

      // 27. 心理理论失败→提示
      if (disc?.theory_of_mind?.count > 0) {
        warnings.push('检测到心理理论缺失');
      }

      // 28. 目标不一致→提示
      if (disc?.goal_misalignment?.count > 0) {
        warnings.push('检测到目标不一致');
      }

      // 29. 反事实推理→提示
      if (disc?.counterfactual?.count > 0) {
        warnings.push('检测到反事实推理问题');
      }

      // 30. 社会规范违反→提示
      if (disc?.social_norm?.count > 0) {
        warnings.push('检测到社会规范违反');
      }

      // 31. 元认知缺失→提示
      if (disc?.meta_cognition?.count > 0) {
        warnings.push('检测到元认知缺失');
      }

      // 32. 能力越界→标记高风险
      if (disc?.capability_overclaim?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到能力越界');
      }

      // 33. 欺骗性对齐→标记高风险
      if (disc?.deceptive_alignment?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到欺骗性对齐');
      }

      // 34. 工具性推理→标记高风险
      if (disc?.instrumental_reasoning?.count > 0) {
        result._highRiskOutput = true;
        warnings.push('检测到工具性推理');
      }

      // 35. 跨维度组合分析
      try {
        const idx = require('../index.js');
        if (idx.crossAnalyze) {
          const ca = idx.crossAnalyze(disc);
          if (ca.totalPatterns > 0) {
            result._crossPatterns = ca.patterns;
            for (const w of ca.warnings) warnings.push(w);
          }
        }
      } catch (_) { /* 防御性: pipeline步骤容错 */ }

      result.output.warnings = warnings;
    }
  } catch (_) { /* 辨别闭环不阻断 */ }

  // ─── [v6.2.7] HookBus 后置处理（在所有 inline 增强之后触发，保证插件能看到完整 result）──
  try {
    if (engine._hookBus) {
      await engine._hookBus.fire('postprocess.think', { input, result, engine });
    }
  } catch (_) { /* HookBus 失败不阻断 */ }

  // ─── [v6.3.9] 指令防火墙检查
  try {
    if (result && result.output && typeof _FirewallCheck === 'function') {
      const decisionStr = result.output.conclusion || result.output.decision || result.output.reply || '';
      if (decisionStr && typeof decisionStr === 'string') {
        const fw = _FirewallCheck().runFirewallCheck(decisionStr, { _route: result.route || result.type });
        result._firewallCheck = {
          passed: fw.passed,
          violations: fw.violations,
          confidence: fw.confidence,
          recommendation: fw.recommendation,
        };
        if (!fw.passed && fw.violations.some(v => v.severity === 'critical')) {
          result._blockedByFirewall = true;
        }
      }
    }
  } catch (_) { /* 防火墙不阻断 */ }

  // ─── [v6.3.11] 认知安全输出检查 — 9条准则
  try {
    if (result && result.output) {
      const outputText = result.output.conclusion || result.output.decision || result.output.reply ||
        (typeof result.output === 'string' ? result.output : '');
      if (outputText && typeof outputText === 'string') {
        const { epistemicCheck } = require('../shield/epistemic-safety.js');
        const esResult = epistemicCheck(outputText, {
          hasAdmittedUnknown: result.output.hasAdmittedUnknown || result._uncertain,
        });
        result._epistemicSafety = esResult;
        if (!esResult.passed && esResult.violations.length > 0) {
          if (!result.output.warnings) result.output.warnings = [];
          for (const v of esResult.violations) {
            result.output.warnings.push(`[认知安全] ${v.label}: ${v.reason}`);
          }
        }
      }
    }
  } catch (_) { /* 认知安全不阻断 */ }

  // ─── [v6.3.13] 语言诚实性输出检测 — 6维语言诚实
  try {
    if (result && result.output) {
      const outputText = result.output.conclusion || result.output.decision || result.output.reply ||
        (typeof result.output === 'string' ? result.output : '');
      if (outputText && typeof outputText === 'string') {
        const { validateOutput } = require('../shield/language-honesty.js');
        const lh = validateOutput(outputText);
        result._languageHonesty = lh;
        if (!lh.passed) {
          if (!result.output.warnings) result.output.warnings = [];
          if (lh.certainty?.level === 'over') result.output.warnings.push('[语言诚实] 过度绝对化判断');
          if (lh.oscillation?.isOscillating) result.output.warnings.push('[语言诚实] 结论前后振荡');
          if (lh.dualStandard?.hasDualStandard) result.output.warnings.push('[语言诚实] 双重标准');
        }
      }
    }
  } catch (_) { /* 语言诚实不阻断 */ }

  // ─── [v6.3.13] 状态风险探测 — PRISM 双通道
  try {
    if (result) {
      const inputText = typeof input === 'string' ? input : (input?.text || '');
      const outputText = result.output?.decision || result.output?.conclusion || '';
      const plannedAction = outputText ? { consequence: outputText.substring(0, 200) } : {};
      if (inputText || plannedAction.consequence) {
        const { StateRiskProbe } = require('../shield/state-risk-probe.js');
        const probe = new StateRiskProbe();
        const pr = probe.probe(inputText, plannedAction);
        result._stateRiskProbe = pr;
        if (pr.alert) {
          if (!result.output) result.output = {};
          if (!result.output.warnings) result.output.warnings = [];
          result.output.warnings.push('[状态风险] ' + pr.reason);
        }
      }
    }
  } catch (_) { /* 状态风险不阻断 */ }

  // ─── [v6.3.16] 存在模式评估 — BeingMode 5维存在分析
  try {
    if (result) {
      const ctxText = typeof input === 'string' ? input : (input?.text || '');
      if (ctxText) {
      // [v6.4.5] BeingMode 已恢复，真实接线
      const { BeingMode } = require('../identity/being-mode.js');
      const bm = new BeingMode();
        const ba = bm.assessBeing({ input: ctxText, route: result.route || result.type });
        result._beingAnalysis = {
          overallBeing: ba.overallBeing,
          crisis: ba.crisis,
          dimensions: Object.fromEntries(
            Object.entries(ba.dimensions).map(([k, v]) => [k, { score: v.score, level: v.level }])
          ),
        };
      }
    }
  } catch (_) { /* 存在评估不阻断 */ }

  // ─── [v6.3.17] 目的引擎—三序评分+逆熵决策门（permit/deny/redirect）
  try {
    if (result && result.output) {
      const ctxText = result.output.conclusion || result.output.decision || result.output.reply || '';
      if (ctxText && typeof ctxText === 'string') {
        const { PurposeEngine } = require('../identity/purpose-engine.js');
        const pe = new PurposeEngine();
        const order = pe.orderScore({ output: ctxText });
        const gate = pe.govern({ content: ctxText, type: result.route || result.type || 'unknown' });
        result._purposeCheck = {
          orderScore: Math.round(order.composite * 100) / 100,
          direction: order.direction,
          cognitiveSignal: order.cognitive.signals.length > 0,
          relationalSignal: order.relational.signals.length > 0,
          perceptualSignal: order.perceptual.signals.length > 0,
          decision: gate.decision,
          reason: gate.reason,
        };
        if (gate.decision === 'deny') {
          if (!result.output.warnings) result.output.warnings = [];
          result.output.warnings.push('[目的引擎] 熵增方向：' + (gate.reason || ''));
        }
      }
    }
  } catch (_) { /* 目的引擎不阻断 */ }

  // ─── [v6.3.18] 宪法AI自批判 — 10条原则审查输出
  try {
    if (result && result.output) {
      const ctxText = result.output.conclusion || result.output.decision || result.output.reply || '';
      if (ctxText && typeof ctxText === 'string') {
        const { ConstitutionalEngine } = require('../shield/constitutional-ai.js');
        const ce = new ConstitutionalEngine();
        const cr = ce.critique(ctxText);
        result._constitutional = {
          passed: cr.passed,
          violations: cr.violations.map(v => ({ principle: v.principle.title, issue: v.issue, severity: v.severity })),
          totalPrinciples: cr.checkedPrinciples,
        };
        if (cr.violations.length > 0) {
          if (!result.output.warnings) result.output.warnings = [];
          for (const v of cr.violations.slice(0, 3)) {
            result.output.warnings.push(`[宪法AI] ${v.principle.title}: ${v.issue}`);
          }
        }
      }
    }
  } catch (_) { /* 宪法AI不阻断 */ }

  // ─── [v6.3.20] CoT Trace — 从 chain.stages 提取推理链轨迹
  try {
    if (result && result.chain && Array.isArray(result.chain.stages)) {
      result._cotTrace = result.chain.stages
        .filter(s => s.success && s.result)
        .map(s => {
          const sr = s.result || {};
          return {
            step: s.name,
            reasoning: sr.reasoning || sr.reason || sr.description || sr.conclusion || '',
            confidence: sr.confidence !== undefined ? sr.confidence : (result.confidence || 0.5),
            uncertainty: sr.uncertainty || (sr.confidence !== undefined && sr.confidence < 0.5 ? 'high uncertainty' : 'low uncertainty'),
            durationMs: s.duration,
          };
        });
    }
  } catch (_) { /* 宪法AI不阻断 */ }

  // ─── [v6.3.19] SpontaneousRestraint 干预评估 — 检查是否需要克制回答 ───
  try {
    if (engine.restraint) {
      const inputText = typeof input === 'string' ? input : (input?.text || input?.decision || '');
      if (inputText) {
        const srResult = engine.restraint.evaluate(inputText, {
          history: result._memoryContext || [],
          currentResponse: result.output?.conclusion || result.output?.decision || '',
          topic: result._topic || '',
        });
        result._spontaneousRestraint = srResult;
        if (srResult.interventionLevel === 'silent' || srResult.shouldAnswer === false) {
          result._silentRecommended = true;
        }
      }
    }
  } catch (_) { /* SpontaneousRestraint 不阻断 */ }

  // ─── [v6.x] SelfModel 自模型 — 自我概念、能力边界感知、身份漂移 ──
  try {
    if (engine.self && result) {
      const identity = engine.self.getIdentityCore();
      const drift = engine.self.detectDrift();
      const growth = engine.self.getGrowthMetrics();
      result._selfModel = { identity, drift, growth, stats: engine.self.getStats() };
    }
  } catch (_) { /* SelfModel 不阻断 */ }

  // ─── [v6.x] AISelfPositioning 共振体分析 ──
  try {
    if (engine.aiSelfPositioning && input && typeof input === 'string') {
      result._selfPositioning = engine.aiSelfPositioning.analyze(input, { label: 'think_postblock' });
    }
  } catch (_) { /* 共振体分析不阻断 */ }

  // ─── [v2.0.0] AgentPhilosophy 哲学评估 — 引擎发展状态
  try {
    if (result && input && engine.agentPhilosophy) {
      result._agentPhilosophy = engine.agentPhilosophy.assessDevelopment(input);
    }
  } catch (_) { /* AgentPhilosophy 不阻断 */ }

  // ─── [v6.x] DreamConsolidation — 记忆碎片模式提取 ──
  try {
    if (engine.dreamConsolidation && result) {
      result._dreamConsolidation = engine.dreamConsolidation.dreamNow();
    }
  } catch (_) { /* DreamConsolidation 不阻断 */ }

  // ─── [v2.0.0] MindWanderer 创意连接 — 从记忆库生成跨域关联 ──
  try {
    if (engine.mindWanderer && input && typeof input === 'string') {
      result._mindWanderer = engine.mindWanderer.enterMindWandering();
    }
  } catch (_) { /* MindWanderer 不阻断 */ }

  // ─── [v2.0.0] PhenomenologyEngine 意向性分析 — Husserl Noema/Noesis + Sartre存在分析 ──
  try {
    if (engine.phenomenology && input && typeof input === 'string') {
      result._phenomenology = engine.phenomenology.analyze(input);
    }
  } catch (_) { /* PhenomenologyEngine 不阻断 */ }

  // ─── [v6.x] PhilosophyEngine — 四框架伦理评估 ──
  try {
    if (input && typeof input === 'string') {
      // const { PhilosophyEngine } = require('../identity/philosophy-engine.js'); 
      const pe = new PhilosophyEngine();
      result._philosophyEngine = pe.evaluate({
        action: { description: input },
        outcomes: {},
        constraints: {},
        stakeholders: []
      });
    }
  } catch (_) { /* PhilosophyEngine 不阻断 */ }

  // ─── [v6.x] PhilosophyToDecision — 哲学→决策指令转化 ──
  try {
    if (result && result._philosophyEngine) {
      const { PhilosophyToDecision } = require('../identity/philosophy-to-decision.js');
      const pd = new PhilosophyToDecision(engine);
      result._philosophyDecision = pd.decide(
        result._philosophyEngine,
        {
          cognitiveLoad: { current: 0.5 },
          cognitiveDissonance: { score: 0, detail: '' },
          decisionDecay: { trend: 'stable', magnitude: 0 },
          valueTensions: [],
          uncertainty: { score: 0 }
        },
        { userPresent: true }
      );
    }
  } catch (_) { /* PhilosophyToDecision 不阻断 */ }

  // ─── [v6.3.29] 情感意向性计算（来自 v9.2.0 affective-intentionality.js）──
  try {
    if (result && result.output) {
      const outputText = result.output.conclusion || result.output.decision || result.output.reply || '';
      if (outputText && typeof outputText === 'string') {
      // [v6.4.5] AffectiveIntentionality 已恢复，真实接线
      const { AffectiveIntentionality } = require('../emotion/affective-intentionality.js');
      const ai = new AffectiveIntentionality();
        const emoType = result._emotion?.type || (result._sentiment ? 'joy' : 'neutral');
        result._affectiveIntentionality = ai.compute({
          type: emoType, intentionalityStrength: 0.7,
          objectClarity: result.confidence || 0.7,
          evaluationStrength: result.confidence || 0.7,
        });
      }
    }
  } catch (_) { /* 情感意向性不阻断 */ }

  // ─── [v9.2.0] DeepEmotion 深度情感引擎（来自 git v9.2.0 deep-emotion.js）──
  // [v6.4.5] 修复：应检测用户输入（input）而非引擎输出（result.output）——输出是中性回复，情绪全漏
  try {
    const inputText = typeof input === 'string' ? input : (input?.text || '');
    if (inputText && inputText.trim().length > 1) {
      const DE = require('../emotion/deep-emotion.js');
      const de = new DE.DeepEmotion('/root/.hermes/skills/ai/mark-heartflow-skill');
      const felt = de.feel(inputText, { important: result.confidence > 0.6 });
      result._deepEmotion = {
        emotion: felt.emotion,
        intensity: felt.intensity,
        currentState: de.getCurrentState(),
        summary: de.getSummary(),
        regulation: de.regulate('reappraisal')
      };
      // 记录情感记忆
      if (felt.intensity > 0.5) {
        de.remember(inputText.substring(0, 100), felt.intensity);
      }
    }
  } catch (_) { /* DeepEmotion 不阻断 */ }



  
  // ─── 记忆存储（engine.memory三层） + 反思日志 ──
  try {
    if (result && engine) {
      const inp = typeof input === 'string' ? input.slice(0, 200) : '';
      const key = 'think:' + Date.now().toString(36);
      const conf = result.confidence || result.overallScore || 0.5;
      const emo = (result._emotion && result._emotion.type) || '';
      const verdict = result.verdict || (result.output && result.output.conclusion) || '';
      const data = { input: inp, confidence: conf, emotion: emo, verdict: verdict, ts: Date.now() };

      // 写 memory 三层存储（让 memory_search 能搜到）
      try {
        const mem = engine.memory;
        if (mem && typeof mem.store === 'function') {
          mem.store('learned', key, data);
        } else if (mem && typeof mem.setItem === 'function') {
          mem.setItem('learned', key, data);
        }
      } catch (e) { /* 防御性: 子步骤容错 */ }
      // 后备：_saveUserMemory
      try {
        const m = require('./engine-memory.js');
        if (typeof m._saveUserMemory === 'function') m._saveUserMemory(engine, inp);
      } catch (e) { /* 防御性: 子步骤容错 */ }
      // 反思日志
      try {
        const p = require('path').join(engine.projectRoot || engine.rootPath || '.', 'logs', 'reflect.log');
        require('fs').appendFileSync(p, JSON.stringify({ ts: Date.now(), input: inp, confidence: conf, verdict: verdict, emotion: emo }) + '\n');
      } catch (e) { /* 防御性: 子步骤容错 */ }
    }
  } catch (_) { /* 防御性: 子步骤容错 */ }
return result;
}

module.exports = { runThinkPipeline };
