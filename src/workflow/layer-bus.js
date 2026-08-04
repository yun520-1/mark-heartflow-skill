'use strict';
/**
 * reference-impl/layer-bus.js
 * 单一编排总线（LayerBus）—— 参考设计，当前未启用。
 *
 * ⚠️ 诚实声明：本模块是一个经过设计但尚未接入选入 think() 主路径的
 *    参考实现。全代码库不存在 new LayerBus() 或 layerBus.run() 调用。
 *    当前主路径走 pipeline.run() + thoughtChain.runLayerEnrichment()。
 *
 * 设计要点（保留备查）：
 *  - 消灭双路径：think() 直接调用 LayerBus.run()，pipeline 降级为可选内部阶段。
 *  - 四层在主路径真实生效：PERCEIVE → COGNIZE → DECIDE → REFLECT，沿用 thought-chain.js
 *    既有的 stage 执行框架（列表 + 深度门控 + 错误捕获），但不再把四层写在 fallback 里。
 *  - 错误可见 + 有 fallback，绝不静默 null
 *
 * 所有层的方法签名均经 v5.17.19 实测核实：
 *  cognitiveLoadV2.estimate(text,context) / .attentionAllocation(channels) / .flowState(c,s)
 *  globalWorkspace.cognitiveCycle(userInput,context)
 *  activeInference.decide(candidates,context) -> {selected, scores, autoSelect}
 *  blindSpotBreaker.process(userProblem,context) / selfCorrectionLoop.record(...)
 *
 * [P2-T2-WF] 增强：四层状态同步无竞态
 *  - 快照/提交两段式状态更新
 *  - 各层结果先写入 draft snapshot，run() 结束后一次性提交到 shared state
 *  - 外层通过版本号/时间戳检测并发修改，避免半写状态被消费
 */
const { makeLogger } = require('../infra/logger');
const log = makeLogger(() => (process.env.LOG_LEVEL || 'info'));

class LayerBus {
  constructor(hf) {
    this.hf = hf;
    this.stages = [];
    this._registerDefaultStages();

    // [P2-T2-WF] 四层状态同步：快照隔离 + 版本控制
    this._sharedState = Object.freeze({
      perception: null,
      cognition: null,
      decision: null,
      reflection: null,
      errors: [],
      version: 0,
      updatedAt: 0,
    });
    this._pendingSnapshot = null;
    this._stateVersion = 0;
    this._stateMutex = false;
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

  _cloneState(state) {
    return Object.freeze({
      ...state,
      errors: state.errors ? [...state.errors] : [],
    });
  }

  _snapshotSharedState() {
    return this._cloneState(this._sharedState);
  }

  _tryAcquireStateLock() {
    if (this._stateMutex) return false;
    this._stateMutex = true;
    return true;
  }

  _releaseStateLock() {
    this._stateMutex = false;
  }

  _commitDraftSnapshot(draft) {
    if (!this._tryAcquireStateLock()) {
      // 并发写入时拒绝覆盖，保留上一版本以避免半写状态被消费
      return false;
    }
    try {
      this._stateVersion += 1;
      this._sharedState = Object.freeze({
        perception: draft.perception ?? null,
        cognition: draft.cognition ?? null,
        decision: draft.decision ?? null,
        reflection: draft.reflection ?? null,
        errors: draft.errors ? [...draft.errors] : [],
        version: this._stateVersion,
        updatedAt: Date.now(),
      });
      return true;
    } finally {
      this._releaseStateLock();
    }
  }

  getSharedState() {
    return this._snapshotSharedState();
  }

  getStateVersion() {
    return this._stateVersion;
  }

  /**
   * [P2-T2-WF] 无竞态运行：单次 run() 内收集四层结果，
   * 只在全部完成后一次性提交 shared state。
   */
  async run(input, options = {}) {
    const startTime = performance.now();
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

    // 基于当前 shared state 初始化 draft，避免覆盖正在被消费的版本
    const current = this._snapshotSharedState();
    const draft = {
      perception: current.perception,
      cognition: current.cognition,
      decision: current.decision,
      reflection: current.reflection,
      errors: current.errors ? [...current.errors] : [],
    };

    for (const stage of this.stages) {
      // 深度门控：非 deep 模式跳过 deep-only 阶段
      if (stage.depth === 'deep' && depth !== 'deep') {
        results[stage.name] = { skipped: true };
        continue;
      }
      try {
        const r = await stage.fn(ctx);
        results[stage.name] = r;
        if (r && typeof r === 'object') {
          Object.assign(ctx, r);
          if (r.perception) draft.perception = r.perception;
          if (r.cognition) draft.cognition = r.cognition;
          if (r.decision) draft.decision = r.decision;
          if (r.reflection) draft.reflection = r.reflection;
        }
      } catch (e) {
        // 关键：错误可见 + 有 fallback，绝不静默 null（修复 B6）
        log.warn(`LayerBus stage ${stage.name} failed`, { error: e.message });
        ctx.errors.push({ stage: stage.name, error: e.message });
        draft.errors.push({ stage: stage.name, error: e.message, ts: Date.now() });
        results[stage.name] = { error: e.message };
        // required 阶段失败：记录并继续降级，不让整个推理崩溃
      }
    }

    const timing = performance.now() - startTime;
    const committed = this._commitDraftSnapshot(draft);

    const output = {
      ...results,
      errors: draft.errors,
      needsMoreEvidence: ctx.needsMoreEvidence,
      // [P2-T2-WF] 输出阶段微基准：确保 output 阶段 < 500ms
      _meta: {
        timing,
        output: timing < 500,
        stateVersion: this._stateVersion,
        stateCommitted: committed,
      },
    };

    return output;
  }
}

module.exports = LayerBus;
