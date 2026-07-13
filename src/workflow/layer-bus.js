'use strict';
/**
 * reference-impl/layer-bus.js
 * 单一编排总线（LayerBus）—— 修复瓶颈 B1（双路径 + 四层休眠）。
 *
 * 设计要点：
 *  - 消灭双路径：think() 直接调用 LayerBus.run()，pipeline 降级为可选内部阶段。
 *  - 四层在主路径真实生效：PERCEIVE → COGNIZE → DECIDE → REFLECT，沿用 thought-chain.js
 *    既有的 stage 执行框架（列表 + 深度门控 + 错误捕获），但不再把四层写在 fallback 里。
 *  - 错误可见 + 有 fallback，绝不静默 null（修复 B6 / thought-chain.js:535 的 catch→null）。
 *
 * 所有层的方法签名均经 v5.17.19 实测核实：
 *  cognitiveLoadV2.estimate(text,context) / .attentionAllocation(channels) / .flowState(c,s)
 *  globalWorkspace.cognitiveCycle(userInput,context)
 *  activeInference.decide(candidates,context) -> {selected, scores, autoSelect}
 *  blindSpotBreaker.process(userProblem,context) / selfCorrectionLoop.record(...)
 */
const { makeLogger } = require('./logger');
const log = makeLogger(() => (process.env.LOG_LEVEL || 'info'));

class LayerBus {
  constructor(hf) {
    this.hf = hf;
    this.stages = [];
    this._registerDefaultStages();
  }

  registerStage(name, fn, { depth = 'deep', required = true } = {}) {
    this.stages.push({ name, fn, depth, required });
  }

  _registerDefaultStages() {
    // ── 感知层（Perception）──
    this.registerStage('PERCEIVE', async (ctx) => {
      const cl = this.hf.cognitiveLoadV2 || this.hf.cognitiveLoad;
      if (!cl || typeof cl.estimate !== 'function') return { perception: null };
      const estimate = cl.estimate(ctx.input, ctx.context || {});
      const attention = cl.attentionAllocation(ctx.channels || []);
      const flow = cl.flowState
        ? cl.flowState(ctx.challenge ?? 0.5, ctx.skill ?? 0.5)
        : null;
      return {
        perception: {
          precisionWeight: estimate?.precisionWeight ?? null,
          attention,
          flow,
        },
      };
    }, { depth: 'surface' });

    // ── 认知层（Cognition / Thoughtseed 竞争）──
    this.registerStage('COGNIZE', async (ctx) => {
      const gw = this.hf.globalWorkspace;
      if (!gw || typeof gw.cognitiveCycle !== 'function') return { cognition: null };
      const cycle = await gw.cognitiveCycle(ctx.input, ctx.context || {});
      return {
        cognition: {
          winner: cycle?.winner ?? null,
          broadcasts: cycle?.broadcasts ?? [],
        },
      };
    });

    // ── 决策层（Decision / Active Inference）──
    this.registerStage('DECIDE', async (ctx) => {
      const ai = this.hf.activeInference;
      const candidates = ctx.candidates || [];
      if (!ai || candidates.length === 0) return { decision: null };
      const decision = ai.decide(candidates, ctx.context || {});
      // 探索优先：EFE 优势不足 → 标记需澄清，而非强行选（算法优化 A3）
      if (decision && decision.scores && decision.scores.lowConfidence) {
        ctx.needsMoreEvidence = true;
      }
      return { decision };
    });

    // ── 反思层（Reflection / Blind-spot + Self-correction）──
    this.registerStage('REFLECT', async (ctx) => {
      const bs = this.hf.blindSpotBreaker;
      const sc = this.hf.selfCorrectionLoop;
      const reflection = bs && typeof bs.process === 'function'
        ? bs.process(ctx.input, ctx.context || {})
        : null;
      const rec = { reflection };
      if (sc && typeof sc.record === 'function' && ctx.lastError) {
        sc.record('reasoning', ctx.lastError.original, ctx.lastError.corrected, ctx.lastError.reason, 'medium');
      }
      return rec;
    });
  }

  async run(input, options = {}) {
    const ctx = {
      input,
      context: options.context || {},
      channels: options.channels || [],
      candidates: options.candidates || [],
      errors: [],
      needsMoreEvidence: false,
    };
    const depth = options.depth || 'deep';
    const results = {};

    for (const stage of this.stages) {
      // 深度门控：非 deep 模式跳过 deep-only 阶段
      if (stage.depth === 'deep' && depth !== 'deep') {
        results[stage.name] = { skipped: true };
        continue;
      }
      try {
        const r = await stage.fn(ctx);
        results[stage.name] = r;
        Object.assign(ctx, r); // 层间状态传递
      } catch (e) {
        // 关键：错误可见 + 有 fallback，绝不静默 null（修复 B6）
        log.warn(`LayerBus stage ${stage.name} failed`, { error: e.message });
        ctx.errors.push({ stage: stage.name, error: e.message });
        results[stage.name] = { error: e.message };
        // required 阶段失败：记录并继续降级，不让整个推理崩溃
      }
    }

    return {
      ...results,
      errors: ctx.errors,
      needsMoreEvidence: ctx.needsMoreEvidence,
    };
  }
}

module.exports = LayerBus;
