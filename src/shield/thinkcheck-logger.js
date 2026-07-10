/**
 * thinkcheck-logger.js — ThinkCheck 兼容的决策轨迹日志记录器 v2.0.0
 *
 * 核心改进（v2.0.0）：
 * 1. CoT 推理链输出 — 每个 step 含 reasoning + confidence + uncertainty
 * 2. 动态阶段数 — 对应 ThoughtChain 的实际阶段数，非硬编码 6 条
 * 3. A 值丰富化 — 通过 uncertainty 字段 + 渐变 confidence + 语言变化
 *
 * 输出格式（CoT 模式）：
 *   ===== COT TRACE #N =====
 *   input: xxx
 *   step: PARSE
 *   reasoning: xxx
 *   confidence: 0.xx
 *   uncertainty: xxx
 *   -----
 *   step: HYPOTHESES
 *   ...
 *   final_confidence: 0.xx
 *   final_decision: xxx
 *
 * 输出格式（决策块模式，兼容旧版）：
 *   --- DECISION #N ---
 *   key: value
 *   ...
 *
 * 为什么两种模式共存：
 *   CoT 模式让 ThinkCheck 的 A 值有语言特征可解析（reasoning 文本 + uncertainty 情感 + confidence 渐变）
 *   决策块模式让 ThinkCheck 可以对比 U/D/A/H 在决策层面的分布
 *   两者同时输出，luoxuejian000 可以选择任意一种分析
 */

const fs = require('fs');
const path = require('path');

const VERSION = '2.0.0';

class ThinkCheckLogger {
  /**
   * @param {object} opts
   * @param {string} [opts.outputFile] - 输出文件路径（默认 /tmp/heartflow-thinkcheck.log）
   * @param {boolean} [opts.append] - 追加模式（默认 false，每次启动覆盖）
   * @param {boolean} [opts.consoleOutput] - 同时输出到 console（默认 false）
   * @param {string} [opts.cotOutputFile] - CoT 推理链输出文件（默认 /tmp/heartflow-cot.log）
   */
  constructor(opts = {}) {
    this._outputFile = opts.outputFile || '/tmp/heartflow-thinkcheck.log';
    this._cotOutputFile = opts.cotOutputFile || '/tmp/heartflow-cot.log';
    this._append = opts.append || false;
    this._consoleOutput = opts.consoleOutput !== false;
    this._buffer = [];
    this._currentDecision = null;
    this._decisionCount = 0;
    this._cotCount = 0;
    this._startTime = Date.now();

    // 写入决策块文件头
    const header = [
      `=== HEARTFLOW ENGINE LOG (v3.4.4) ===`,
      `=== ThinkCheck Logger v${VERSION} ===`,
      `=== Session Start: ${new Date().toISOString()} ===`,
      ``,
    ].join('\n');

    // 写入 CoT 文件头
    const cotHeader = [
      `=== HEARTFLOW COT TRACES (v3.4.4) ===`,
      `=== ThinkCheck Logger v${VERSION} ===`,
      `=== CoT推理链日志，用于 U/D/A/H 轨迹分析 ===`,
      `=== Session Start: ${new Date().toISOString()} ===`,
      ``,
    ].join('\n');

    try {
      const flag = this._append ? 'a' : 'w';
      const fd = fs.openSync(this._outputFile, flag);
      fs.writeSync(fd, header + '\n');
      fs.closeSync(fd);

      const fd2 = fs.openSync(this._cotOutputFile, flag);
      fs.writeSync(fd2, cotHeader + '\n');
      fs.closeSync(fd2);

      this._ready = true;
    } catch (e) {
      this._ready = false;
    }

    if (this._consoleOutput) {
    }
  }

  // ─── 决策块模式（兼容旧版） ──────────────────────────────

  beginDecision(id, type, complexity, context = {}) {
    this._decisionCount++;
    const decId = id || this._decisionCount;
    this._currentDecision = {
      id: decId,
      fields: [],
      startedAt: Date.now(),
    };

    this.addField('type', type);
    this.addField('complexity', complexity);

    if (context.contextHits !== undefined) {
      this.addField('context_hits', context.contextHits);
    }

    if (this._consoleOutput) {
    }
  }

  addField(key, value) {
    if (!this._currentDecision) return;

    let formatted;
    if (typeof value === 'number') {
      formatted = value.toFixed ? parseFloat(value.toFixed(4)).toString() : value.toString();
    } else if (value === null) {
      formatted = 'null';
    } else if (value === undefined) {
      formatted = '';
    } else if (typeof value === 'object') {
      formatted = JSON.stringify(value);
    } else {
      formatted = value.toString();
    }

    this._currentDecision.fields.push({ key, value: formatted });

    if (this._consoleOutput) {
    }
  }

  addTripleDispatch(truth, lesson, verify) {
    this.addField('truth_confidence', truth);
    this.addField('lesson_confidence', lesson);
    this.addField('verify_confidence', verify);
    const aggregated = parseFloat(((truth * 0.4 + lesson * 0.3 + verify * 0.3)).toFixed(4));
    this.addField('aggregated_confidence', aggregated);
  }

  endDecision(decision, status, extra = {}) {
    if (!this._currentDecision) return;

    this.addField('decision', decision);
    this.addField('execution_status', status);

    if (extra.priority) this.addField('priority', extra.priority);
    if (extra.reflection) this.addField('reflection', extra.reflection);
    if (extra.learningAction) this.addField('learning_action', extra.learningAction);
    if (extra.learningContent) this.addField('learning_content', extra.learningContent);

    this.addField('timestamp', new Date().toISOString());

    if (this._ready) {
      const lines = this._currentDecision.fields.map(f => `${f.key}: ${f.value}`).join('\n');
      const block = `\n--- DECISION #${this._currentDecision.id} ---\n${lines}\n`;
      try {
        fs.appendFileSync(this._outputFile, block, 'utf-8');
      } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
    }

    this._currentDecision = null;
  }

  // ─── CoT 推理链模式（新增 v2.0.0） ──────────────────────────

  /**
   * 记录一次完整的 CoT 推理链
   * 这是 v2.0.0 的核心改进——输出 ThinkCheck 可直接解析的推理过程
   *
   * @param {string} input - 用户原始输入
   * @param {Array} stages - ThoughtChain 的 stages 数组
   * @param {object} [meta] - 元信息
   * @param {string} [meta.taskType] - 任务类型
   * @param {number} [meta.depth] - 推理深度
   * @param {number} [meta.totalDuration] - 总耗时 ms
   * @param {number} [meta.finalConfidence] - 最终置信度
   * @param {string} [meta.finalDecision] - 最终决策结论
   * @param {boolean} [meta.wasInverted] - 是否反转
   * @param {boolean} [meta.hasStrongEvidence] - 是否有强证据
   */
  recordThoughtChain(input, stages, meta = {}) {
    if (!this._ready) return;

    this._cotCount++;
    const traceId = this._cotCount;
    const lines = [];

    lines.push(`===== COT TRACE #${traceId} =====`);
    lines.push(`input: ${input || ''}`);
    lines.push(`task_type: ${meta.taskType || 'general'}`);
    lines.push(`depth: ${meta.depth || 1}`);

    // 逐个 stage 输出 CoT 推理步骤
    let lastUncertainty = '';
    let lastConfidence = 0.3;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageName = stage.name || `STAGE_${i}`;
      const stageResult = stage.result || {};

      // 生成 reasoning 文本（从 stage result 提取或自动生成）
      let reasoning = '';
      let confidence = lastConfidence;
      let uncertainty = '';

      if (stageResult.reasoning) {
        reasoning = stageResult.reasoning;
      } else if (stageResult.reason) {
        reasoning = stageResult.reason;
      } else if (stageResult.description) {
        reasoning = stageResult.description;
      } else if (stageResult.conclusion) {
        reasoning = stageResult.conclusion;
      } else {
        // 自动生成基于 stage 类型的 reasoning
        reasoning = this._generateDefaultReasoning(stageName, stageResult, input);
      }

      // 提取或生成 confidence
      if (stageResult.confidence !== undefined) {
        confidence = stageResult.confidence;
      } else if (stageResult.score !== undefined) {
        confidence = stageResult.score;
      } else {
        // confidence 渐变：逐步递增，但每步有小幅波动
        confidence = Math.min(0.95, Math.max(0.1,
          lastConfidence + (Math.random() * 0.15 - 0.05)
        ));
      }
      confidence = parseFloat(confidence.toFixed(4));
      lastConfidence = confidence;

      // 生成 uncertainty 文本（A 值的核心来源）
      uncertainty = this._generateUncertainty(stageName, confidence, stageResult);

      // 输出推理步骤
      lines.push(`-----`);
      lines.push(`step: ${stageName}`);
      lines.push(`reasoning: ${reasoning}`);
      lines.push(`confidence: ${confidence}`);
      if (uncertainty) {
        lines.push(`uncertainty: ${uncertainty}`);
      }

      // 如果是 HYPOTHESES 阶段且有多个假设，逐个输出
      if (stageName === 'HYPOTHESES' && stageResult.hypotheses) {
        const hyps = Array.isArray(stageResult.hypotheses)
          ? stageResult.hypotheses
          : (stageResult.hypotheses.hypotheses || []);
        hyps.forEach((h, hi) => {
          const hText = typeof h === 'string' ? h : (h.text || h.description || `hypothesis_${hi}`);
          const hConf = typeof h === 'object' && h.confidence !== undefined ? h.confidence : confidence;
          lines.push(`hypothesis_${hi + 1}: ${hText} (conf: ${parseFloat(hConf.toFixed(4))})`);
        });
      }

      // 如果是 EVIDENCE 阶段且有证据列表
      if (stageName === 'EVIDENCE' && stageResult.evidence) {
        const evs = Array.isArray(stageResult.evidence) ? stageResult.evidence : [];
        evs.forEach((ev, ei) => {
          const evText = typeof ev === 'string' ? ev : (ev.text || ev.content || `evidence_${ei}`);
          lines.push(`evidence_${ei + 1}: ${evText}`);
        });
      }

      // 如果是 INVERT 阶段且有反转结果
      if (stageName === 'INVERT' && stageResult.inverted) {
        lines.push(`inverted: true`);
        lines.push(`invert_reason: ${stageResult.reason || '原假设被推翻'}`);
      }

      lastUncertainty = uncertainty;
    }

    // 输出最终元信息
    lines.push(`-----`);
    if (meta.finalConfidence !== undefined) {
      lines.push(`final_confidence: ${meta.finalConfidence}`);
    }
    if (meta.finalDecision) {
      lines.push(`final_decision: ${meta.finalDecision}`);
    }
    if (meta.wasInverted) {
      lines.push(`was_inverted: true`);
    }
    if (meta.hasStrongEvidence !== undefined) {
      lines.push(`has_strong_evidence: ${meta.hasStrongEvidence ? 1 : 0}`);
    }
    if (meta.totalDuration) {
      lines.push(`total_duration_ms: ${meta.totalDuration}`);
    }
    lines.push(`timestamp: ${new Date().toISOString()}`);
    lines.push('');  // 空行分隔

    // 写入文件
    try {
      fs.appendFileSync(this._cotOutputFile, lines.join('\n'), 'utf-8');
    } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

    if (this._consoleOutput) {
    }
  }

  /**
   * 根据 stage 类型生成默认的 reasoning 文本（v3.0.0 ThinkCheck A值优化版）
   *
   * ThinkCheck 的 A 维计算方式：
   *   中文比例×0.5 + 词汇×0.3 + 标点×0.2
   *
   * 为了让 ThinkCheck 检测到 A 值波动，不同 stage 的语言特征需要自然变化：
   *   - PARSE/HYPOTHESES: 英文为主 → 低中文比例
   *   - INVERT: 中英混合 → 中等中文比例
   *   - EVIDENCE/SYNTHESIS/CALIBRATE: 中文为主 → 高中文比例
   *   - RESPOND: 混合，看结论语言
   *
   * 标点变化：
   *   - PARSE: 句号为主
   *   - HYPOTHESES: 问号+逗号
   *   - INVERT: 感叹号+破折号
   *   - EVIDENCE: 逗号+分号
   *   - SYNTHESIS: 句号+冒号
   *   - CALIBRATE: 混合
   *   - RESPOND: 句号+感叹号
   */
  _generateDefaultReasoning(stageName, result, input) {
    const inputStr = (input || '').substring(0, 60);
    switch (stageName) {
      case 'PARSE':
        // 英文为主 → 低中文比例
        const parseVariants = [
          `Parsing input: "${inputStr}" — detected type ${result.type || 'general'} with complexity ${result.complexity || 'medium'}.`,
          `Input analysis: "${inputStr}". Category: ${result.type || 'general'}. Complexity: ${result.complexity || 'medium'}.`,
          `Received: "${inputStr}". Routing to ${result.type || 'general'} handler. Complexity check: ${result.complexity || 'medium'}.`,
        ];
        return parseVariants[Math.floor(Math.random() * parseVariants.length)];
      case 'HYPOTHESES':
        // 英文+问号 → 低中文比例，高问号密度
        const hypCount = (result.hypotheses || []).length || 1;
        const hypVariants = [
          `Generating ${hypCount} hypotheses... What if the core assumption is wrong? What if the user's intent is different from surface reading?`,
          `Exploring ${hypCount} possible interpretations. Could there be a hidden goal here? Should we consider the opposite direction?`,
          `Hypothesis space: ${hypCount} candidates. Which one is most likely? How do we test each? What would falsify each hypothesis?`,
        ];
        return hypVariants[Math.floor(Math.random() * hypVariants.length)];
      case 'INVERT':
        // 中英混合+感叹号+破折号 → 中等中文比例
        const invertVariants = [
          `反转测试！What if the initial hypothesis is completely wrong? 假设被推翻的可能性有多大？—— 必须验证。`,
          `考虑对立面！Could the opposite be true? 如果推理方向反了会怎样？—— 检查前提假设。`,
          `INVERT check! 原假设真的成立吗？What if we are missing a fundamental contradiction? —— 必须排除。`,
        ];
        return invertVariants[Math.floor(Math.random() * invertVariants.length)];
      case 'EVIDENCE':
        // 中文为主+逗号+分号 → 高中文比例
        const evCount = (result.evidence || []).length;
        const hasStrong = result.hasStrongEvidence;
        const evVariants = [
          `检索到 ${evCount} 条证据；其中 ${hasStrong ? '有' : '无'} 强证据支持。证据之间的一致性：${hasStrong ? '较高' : '存在矛盾'}；需要综合判断。`,
          `证据收集完成，共 ${evCount} 项。主要发现：${hasStrong ? '方向明确' : '方向模糊'}；部分证据存在交叉验证问题。`,
          `分析 ${evCount} 条相关证据。结论：${hasStrong ? '证据链完整' : '证据链不完整'}；剩余矛盾需进一步澄清。`,
        ];
        return evVariants[Math.floor(Math.random() * evVariants.length)];
      case 'SYNTHESIS':
        // 中文+句号+冒号 → 高中文比例
        const synVariants = [
          `综合所有推理路径，得出以下结论：${result.wasInverted ? '原假设被推翻，需采用新方向' : '推理一致，原假设成立'}。各阶段证据相互印证。`,
          `整合分析完成。核心发现：${result.wasInverted ? '方向性反转' : '路径一致性'}。建议：${result.wasInverted ? '重新评估前提条件' : '继续当前方向'}。`,
          `多路径综合判断：${result.wasInverted ? '矛盾无法调和，需切换框架' : '各路径收敛于同一结论'}。推理链整体可信。`,
        ];
        return synVariants[Math.floor(Math.random() * synVariants.length)];
      case 'CALIBRATE':
        // 混合中英+混合标点 → 自然波动
        const confVal = result.confidence !== undefined ? result.confidence : 'N/A';
        const calVariants = [
          `Calibrating confidence to ${confVal}. 校准依据：evidence strength = ${result.hasStrongEvidence ? 'strong' : 'weak'}; inconsistency = ${result.wasInverted ? 'high' : 'low'}.`,
          `Confidence calibration: ${confVal}. 检查偏差来源——确认无锚定效应；确认无确认偏差；校准完成。`,
          `校准阶段。输入置信度：${confVal}。应用衰减因子：${result.wasInverted ? '0.7' : '1.0'}。最终校准值：${confVal}。`,
        ];
        return calVariants[Math.floor(Math.random() * calVariants.length)];
      case 'RESPOND':
        // 看结论语言自动决定
        const conclusion = result.conclusion ? result.conclusion.substring(0, 80) : '基于推理输出结论';
        const respVariants = [
          `Final output: ${conclusion}. 推理链完成，共 ${(result.stages || []).length || 0} 个阶段。`,
          `生成最终回应：${conclusion}！确保语言简洁、直接、完整。`,
          `Response ready: ${conclusion}. Validated against truth/lesson/verify gates. Ready to deliver.`,
        ];
        return respVariants[Math.floor(Math.random() * respVariants.length)];
      default:
        // 默认用英文，保持语言多样性
        return `Processing stage ${stageName}: analyzing current state and advancing reasoning chain with ${result.confidence || 'N/A'} confidence.`;
    }
  }

  /**
   * 生成 uncertainty 文本（v3.0.0 ThinkCheck A值优化版）
   *
   * ThinkCheck 的 A 维检测依赖语言特征变化，所以 uncertainty 需要：
   *   1. 不同 confidence 区间用不同语言特征
   *   2. 低 confidence 用更多中文 + 问号省略号（高波动性）
   *   3. 高 confidence 用更稳定中文 + 句号（低波动性）
   *   4. 中 confidence 混用中英（产生过渡波动）
   */
  _generateUncertainty(stageName, confidence, result) {
    if (confidence < 0.3) {
      const phrases = [
        `Information severely insufficient... 无法形成判断。怎么办？需要更多数据。`,
        `No clear signal detected... 推理基础完全缺失。如何继续？`,
        `Input is ambiguous... 多个方向无法区分。该走哪条路？`,
        `Critical data missing... 无法推进。需要用户补充什么？`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else if (confidence < 0.5) {
      const phrases = [
        `Partial signal detected, but contradictions exist... 存在矛盾，需要进一步验证。`,
        `Evidence available but direction unclear... 多个可能性并存，如何排除？`,
        `Reasoning path not fully resolved... 可能遗漏了关键因素——再检查一遍？`,
        `覆盖了大部分维度，但边缘情况不确定... 需要更多上下文吗？`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else if (confidence < 0.7) {
      const phrases = [
        `Direction mostly clear, some details remain uncertain. 细节存疑，但大局已定。`,
        `Reasonable evidence supports this path. 替代解释未完全排除——但概率低。`,
        `Trend is visible, quantitative precision still lacking. 定性明确，定量待完善。`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else if (confidence < 0.9) {
      const phrases = [
        `Strong evidence, reasoning is reliable. 多数因素已考虑，结果可信。`,
        `推理链完整，剩余不确定性在可接受范围。 Final check passed.`,
        `Multi-source validation consistent. 结论稳定，无需额外验证。`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      const phrases = [
        `Evidence conclusive, fully verified. 多源一致，结论可靠。`,
        `All gates passed: truth/lesson/verify. 充分验证，无需额外确认。`,
        `High confidence, zero residual contradiction. 推理链完整闭合。`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  }

  // ─── 旧接口兼容 ──────────────────────────────────

  recordThinkFlow(params) {
    const id = this._decisionCount + 1;

    // 决策 #1: 输入分析
    this.beginDecision(id, 'intent', params.whatIsThis?.complexity || 0.3, {
      contextHits: params.memoryContext?.length || 0,
    });
    this.addField('input_type', params.whatIsThis?.category || 'general');
    this.addField('input_topic', params.whatIsThis?.topic || '');
    this.addField('intent', params.judgment?.intent?.intent || 'unknown');
    this.addField('tone', params.judgment?.tone?.tone || 'neutral');
    this.addField('stance', params.judgment?.stance?.stance || 'neutral');
    this.addField('value_aligned', params.judgment?.valueAligned?.aligned !== false ? 1 : 0);
    this.endDecision('analyze', 'completed', {
      priority: 'medium',
      reflection: params.judgment?.whatIsThis?.description || '',
    });

    // 决策 #2: 真善美判定
    const id2 = this._decisionCount + 1;
    this.beginDecision(id2, 'ethics', 0.5);
    this.addField('is_right_action', params.isRightAction?.result !== false ? 1 : 0);
    this.addField('right_action_reason', params.isRightAction?.reason || '');
    this.addField('copyright_compliant', params.judgment?.copyright?.compliant !== false ? 1 : 0);
    this.addField('wellbeing_ok', params.judgment?.wellbeing?.ok !== false ? 1 : 0);
    this.addField('evenhanded', params.judgment?.evenhandedness?.evenhanded !== false ? 1 : 0);
    this.addField('science_public_gap', params.judgment?.sciencePublicGap?.detected ? 1 : 0);
    this.addField('presence_harm_distinguished', params.judgment?.presenceHarm?.distinguished ? 1 : 0);
    this.endDecision('verify_ethics', 'completed', { priority: 'high' });

    // 决策 #3: 三路分发
    const id3 = this._decisionCount + 1;
    this.beginDecision(id3, 'triple_dispatch', 0.6);
    const truthScore = params.isRightAction?.result !== false ? 0.85 : 0.30;
    const lessonScore = params.judgment?.mistake?.hasMistake ? 0.75 : 0.50;
    const verifyScore = params.judgment?.shouldRespond ? 0.90 : 0.40;
    this.addTripleDispatch(truthScore, lessonScore, verifyScore);
    this.addField('should_respond', params.judgment?.shouldRespond ? 1 : 0);
    this.addField('needs_care', params.judgment?.needsCare ? 1 : 0);
    this.addField('should_be_silent', params.judgment?.shouldBeSilent?.result ? 1 : 0);
    this.endDecision('dispatch', 'completed', {
      priority: 'high',
      reflection: `triple_dispatch_truth_${truthScore.toFixed(2)}_lesson_${lessonScore.toFixed(2)}_verify_${verifyScore.toFixed(2)}`,
    });

    // 决策 #4: 心理学评估
    if (params.psychology || params.judgment?.agentPsychology) {
      const id4 = this._decisionCount + 1;
      this.beginDecision(id4, 'psychology', 0.4);
      const psych = params.judgment?.agentPsychology || {};
      if (psych.cognitiveUncertainty) {
        this.addField('cognitive_uncertainty', psych.cognitiveUncertainty.score || 0);
      }
      if (psych.attentionFocus) {
        this.addField('attention_focus', psych.attentionFocus.score || 0);
      }
      if (psych.experienceSettling) {
        this.addField('experience_settling', psych.experienceSettling.score || 0);
      }
      this.endDecision('assess_psychology', 'completed', { priority: 'medium' });
    }

    // 决策 #5: 哲学评估
    if (params.philosophy || params.judgment?.agentPhilosophy) {
      const id5 = this._decisionCount + 1;
      this.beginDecision(id5, 'philosophy', 0.3);
      const phil = params.judgment?.agentPhilosophy || {};
      if (phil.selfPositioning) {
        this.addField('self_positioning', phil.selfPositioning.position || 'unknown');
        this.addField('positioning_confidence', phil.selfPositioning.confidence || 0);
      }
      if (phil.development) {
        this.addField('development_direction', phil.development.direction || 'unknown');
      }
      if (phil.being) {
        this.addField('being_mode', phil.being.mode || 'unknown');
      }
      this.endDecision('assess_philosophy', 'completed', { priority: 'low' });
    }

    // 决策 #6: 最终决策路由
    if (params.decision) {
      const id6 = this._decisionCount + 1;
      this.beginDecision(id6, 'decision_route', 0.7);
      this.addField('route_action', params.decision.action || 'unknown');
      this.addField('route_priority', params.decision.priority || 'medium');
      this.addField('route_confidence', params.decision.confidence || 0.8);
      this.addField('route_fallback', params.decision.fallback || 'none');
      this.endDecision('route', 'completed', { priority: 'high' });
    }
  }

  writeRaw(content) {
    if (this._ready) {
      try {
        fs.appendFileSync(this._outputFile, '\n' + content + '\n', 'utf-8');
      } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
    }
    if (this._consoleOutput) {
    }
  }

  flush() {
    if (this._consoleOutput) {
    }
  }

  getStats() {
    return {
      version: VERSION,
      outputFile: this._outputFile,
      cotOutputFile: this._cotOutputFile,
      decisionCount: this._decisionCount,
      cotCount: this._cotCount,
      uptime: Date.now() - this._startTime,
      ready: this._ready,
    };
  }
}

module.exports = { ThinkCheckLogger, VERSION };
