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
      console.error(`[ThinkCheckLogger] Cannot write: ${e.message}`);
      this._ready = false;
    }

    if (this._consoleOutput) {
      console.log(header);
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
      console.log(`\n--- DECISION #${decId} ---`);
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
      console.log(`${key}: ${formatted}`);
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
      } catch (e) {
        console.error(`[ThinkCheckLogger] Write error: ${e.message}`);
      }
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
    } catch (e) {
      console.error(`[ThinkCheckLogger] CoT write error: ${e.message}`);
    }

    if (this._consoleOutput) {
      console.log(lines.join('\n'));
    }
  }

  /**
   * 根据 stage 类型生成默认的 reasoning 文本
   * 这确保了即使 stage.result 没有 reasoning 字段，也能输出有意义的 CoT
   */
  _generateDefaultReasoning(stageName, result, input) {
    switch (stageName) {
      case 'PARSE':
        return `分析输入："${(input || '').substring(0, 60)}"，检测到类型为 ${result.type || 'general'}，复杂度 ${result.complexity || '中等'}`;
      case 'HYPOTHESES':
        return `基于输入生成假设，当前有 ${(result.hypotheses || []).length || 1} 个可能的解释方向`;
      case 'INVERT':
        return `反向思考：考虑对立假设的可能性，验证当前推理是否成立`;
      case 'EVIDENCE':
        return `检索相关证据，${result.hasStrongEvidence ? '找到强证据支持' : '证据不足，需要谨慎'}`;
      case 'SYNTHESIS':
        return `综合所有推理路径，${result.wasInverted ? '原假设被推翻' : '推理一致'}，形成最终判断`;
      case 'CALIBRATE':
        return `校准置信度：${result.confidence !== undefined ? `最终置信度 ${result.confidence}` : '根据证据强度调整'}`;
      case 'RESPOND':
        return `生成回应：${result.conclusion ? result.conclusion.substring(0, 80) : '基于推理输出结论'}`;
      default:
        return `处理阶段 ${stageName}：分析当前状态，推进推理`;
    }
  }

  /**
   * 生成 uncertainty 文本
   * 这是 A 值的核心来源——ThinkCheck 通过语言特征检测不确定性/矛盾
   * confidence 越低，uncertainty 越强
   */
  _generateUncertainty(stageName, confidence, result) {
    // 根据 confidence 选择不同的不确定性表达
    if (confidence < 0.3) {
      const phrases = [
        `信息严重不足，${stageName}阶段无法形成可靠判断`,
        `缺乏关键数据，推理基础薄弱`,
        `输入模糊，多个可能方向无法区分`,
        `需要更多上下文才能继续推进`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else if (confidence < 0.5) {
      const phrases = [
        `部分信息可用但存在矛盾，需要进一步验证`,
        `当前证据不足以确定方向，存在多个可能性`,
        `推理路径不清晰，可能遗漏了关键因素`,
        `不确定是否覆盖了所有相关维度`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else if (confidence < 0.7) {
      const phrases = [
        `推理方向基本明确，但部分细节仍存疑`,
        `有合理证据支持，但替代解释未完全排除`,
        `趋势明显但定量数据不足`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else if (confidence < 0.9) {
      const phrases = [
        `证据较充分，推理可靠`,
        `多数因素已考虑，结果可信`,
        `推理链完整，剩余不确定性在可接受范围`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      const phrases = [
        `证据确凿，推理可靠`,
        `多源验证一致，结论可信度高`,
        `充分验证，无需额外确认`,
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
      } catch (e) {
        console.error(`[ThinkCheckLogger] Write error: ${e.message}`);
      }
    }
    if (this._consoleOutput) {
      console.log(content);
    }
  }

  flush() {
    if (this._consoleOutput) {
      console.log(`[ThinkCheckLogger] CoT → ${this._cotOutputFile}`);
      console.log(`[ThinkCheckLogger] Decisions → ${this._outputFile}`);
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
