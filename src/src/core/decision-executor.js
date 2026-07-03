/**
 * decision-executor.js — 决策路由执行器 v1.0.0
 *
 * 将 decision-router 的输出转化为实际的行为变更。
 * 核心职责：接收决策指令 → 修改 { depth, _routeHint, flags } → 返回修改后的上下文
 *
 * 设计原则：
 * - 所有方法必须是安全的（try/catch 保护），失败时返回未修改的上下文
 * - 不依赖 decision-router 的具体实现，只消费其决策类型字符串
 * - 可独立测试，无需启动完整 HeartFlow
 *
 * 决策类型与优先级的文档映射（与 decision-router.js 的 DECISION / DECISION_PRIORITY 一致）
 *   HEAL=100, TURN=90, PAUSE=80, REST=70, TRANSMIT=60, RESONATE=50, ACCELERATE=40, HOLD=30
 */

'use strict';

// ─── 文档常量 ──────────────────────────────────────────────────────────────
/**
 * 决策 → 行为映射表（纯文档用途，程序逻辑不依赖此表）
 * 每个条目：{ action, description, effect }
 */
const DECISION_ACTION_MAP = Object.freeze({
  pause: {
    action: 'PAUSE',
    description: '减速/暂停 — 降低推理深度，减少认知负荷',
    effect: 'depth→1, routeHint.confidence→0.3',
  },
  accelerate: {
    action: 'ACCELERATE',
    description: '加速 — 提升推理深度，增强信心',
    effect: 'depth+1 (max 5), routeHint.confidence boost',
  },
  turn: {
    action: 'TURN',
    description: '转向 — 切换响应类型，触发重新路由',
    effect: 'routeHint.type→alternate type, trigger re-route flag',
  },
  hold: {
    action: 'HOLD',
    description: '坚守 — 冻结当前状态，不做变更',
    effect: 'depth unchanged, routeHint preserved',
  },
  heal: {
    action: 'HEAL',
    description: '自愈 — 触发自我修复流程，降低推理深度',
    effect: 'call selfHealing module if available, else set heal_requested flag, depth→1',
  },
  resonate: {
    action: 'RESONATE',
    description: '共振 — 大幅提升推理深度，进入谐振模式',
    effect: 'depth+2 (max 5), routeHint→resonant mode',
  },
  transmit: {
    action: 'TRANSMIT',
    description: '传递 — 快速输出，最低推理深度',
    effect: 'depth→1, routeHint→transmit type',
  },
  rest: {
    action: 'REST',
    description: '休息 — 跳过 ThoughtChain，返回最小响应',
    effect: 'depth→0, skip ThoughtChain, return minimal response',
  },
});

// ─── 内部常量 ──────────────────────────────────────────────────────────────
const MAX_DEPTH = 5;
const MIN_DEPTH = 1;
const REST_DEPTH = 0;

/**
 * DecisionExecutor — 决策指令执行器
 *
 * @param {object} heartFlow - HeartFlow 主实例引用（用于访问 selfHealing 等模块）
 */
class DecisionExecutor {
  constructor(heartFlow) {
    /** @type {object} HeartFlow 实例引用 */
    this.hf = heartFlow;
    this.name = 'DecisionExecutor';
  }

  /**
   * 执行单个决策指令，修改上下文中的 { depth, _routeHint, flags }
   *
   * @param {string} decision - 决策类型（小写，如 'pause', 'heal'）
   * @param {object} context - 当前执行上下文
   * @param {number} context.depth - 当前推理深度（1-4）
   * @param {object} context._routeHint - 路由提示 { type, confidence }
   * @param {object} [context.chain] - ThoughtChain 实例（可选）
   * @param {string} [context.input] - 原始用户输入（可选）
   * @returns {object} 修改后的上下文 { depth, _routeHint, flags }
   */
  execute(decision, context) {
    // 安全防护：任何失败返回未修改的上下文
    try {
      if (!decision || typeof decision !== 'string') {
        return this._cloneContext(context);
      }

      const dec = decision.toLowerCase().trim();
      const ctx = this._cloneContext(context);

      switch (dec) {
        case 'pause':
          return this._handlePause(ctx);
        case 'accelerate':
          return this._handleAccelerate(ctx);
        case 'turn':
          return this._handleTurn(ctx);
        case 'hold':
          return this._handleHold(ctx);
        case 'heal':
          return this._handleHeal(ctx);
        case 'resonate':
          return this._handleResonate(ctx);
        case 'transmit':
          return this._handleTransmit(ctx);
        case 'rest':
          return this._handleRest(ctx);
        default:
          // 未知决策类型：不做变更
          return ctx;
      }
    } catch (_err) {
      // 安全兜底：任何异常都返回未修改的上下文
      return this._cloneContext(context);
    }
  }

  /**
   * apply — 主入口，供 think() 调用
   * 接收决策字符串和 think() 内部的上下文对象，返回修改后的字段
   *
   * @param {string} decision - 决策类型（小写）
   * @param {object} thinkContext - think() 内部上下文
   * @param {number} thinkContext.depth - 当前深度
   * @param {object} thinkContext._routeHint - 路由提示
   * @returns {{ depth: number, _routeHint: object, flags: object }} 修改后的字段
   */
  apply(decision, thinkContext) {
    try {
      if (!decision || !thinkContext) {
        return this._defaultResult(thinkContext);
      }

      const context = {
        depth: typeof thinkContext.depth === 'number' ? thinkContext.depth : 1,
        _routeHint: thinkContext._routeHint && typeof thinkContext._routeHint === 'object'
          ? { type: thinkContext._routeHint.type || 'general', confidence: thinkContext._routeHint.confidence || 0.5 }
          : { type: 'general', confidence: 0.5 },
        chain: thinkContext.chain || null,
        input: thinkContext.input || '',
      };

      const result = this.execute(decision, context);

      return {
        depth: result.depth,
        _routeHint: result._routeHint,
        flags: result.flags || {},
      };
    } catch (_err) {
      return this._defaultResult(thinkContext);
    }
  }

  // ─── 内部处理器 ──────────────────────────────────────────────────────────

  /**
   * PAUSE: 减速/暂停
   * - 降低深度到 1（浅层推理）
   * - 设置 routeHint.confidence 为 0.3（低信心，谨慎输出）
   * - 如果输入含质疑信号，设置 routeHint.type 为 'self-review'（自我审查模式）
   */
  _handlePause(ctx) {
    ctx.depth = 1;
    if (ctx._routeHint) {
      ctx._routeHint.confidence = 0.3;
      // 检测质疑信号：如果是收到质疑/批评，切换到自我审查模式
      if (ctx.input && typeof ctx.input === 'string') {
        const challengePatterns = [
          /质疑|为什么.*没|为什么.*不|为什么.*错|你的问题|你.*(错|不对|有问题)/i,
          /不是.*(态度|这个|这样)/i,
          /严重.*问题|底层.*问题/i,
          /彻底.*检查|彻底.*重构/i,
          /你.*说.*不对|你.*做.*不对|你.*回答.*不对/i,
        ];
        if (challengePatterns.some(p => p.test(ctx.input))) {
          ctx._routeHint.type = 'self-review';
        }
      }
    }
    ctx.flags = ctx.flags || {};
    ctx.flags.paused = true;
    ctx.flags.decisionAction = 'pause';
    return ctx;
  }

  /**
   * ACCELERATE: 加速
   * - 深度 +1（不超过 MAX_DEPTH=5）
   * - 提升 routeHint.confidence（增加 0.15，不超过 1.0）
   */
  _handleAccelerate(ctx) {
    ctx.depth = Math.min(MAX_DEPTH, (ctx.depth || 1) + 1);
    if (ctx._routeHint) {
      ctx._routeHint.confidence = Math.min(1.0, (ctx._routeHint.confidence || 0.5) + 0.15);
    }
    ctx.flags = ctx.flags || {};
    ctx.flags.accelerated = true;
    ctx.flags.decisionAction = 'accelerate';
    return ctx;
  }

  /**
   * TURN: 转向
   * - 将 _routeHint.type 切换为备选类型
   * - 设置 reRoute 标志，供上游检查并触发重新路由
   *
   * 备选类型映射：
   *   'general'       → 'analytical'
   *   'analytical'    → 'creative'
   *   'creative'      → 'general'
   *   'empathic'      → 'general'
   *   'technical'     → 'analytical'
   *   'crisis'        → 'empathic'
   *   'silent'        → 'general'
   *   其他            → 'general'
   */
  _handleTurn(ctx) {
    if (!ctx._routeHint) {
      ctx._routeHint = { type: 'general', confidence: 0.5 };
    }

    const alternateMap = {
      general: 'analytical',
      analytical: 'creative',
      creative: 'general',
      empathic: 'general',
      technical: 'analytical',
      crisis: 'empathic',
      silent: 'general',
    };

    const currentType = ctx._routeHint.type || 'general';
    ctx._routeHint.type = alternateMap[currentType] || 'general';

    ctx.flags = ctx.flags || {};
    ctx.flags.reRoute = true;
    ctx.flags.decisionAction = 'turn';
    return ctx;
  }

  /**
   * HOLD: 坚守
   * - 冻结深度和 routeHint，不做任何变更
   * - 仅设置 hold 标志
   */
  _handleHold(ctx) {
    ctx.flags = ctx.flags || {};
    ctx.flags.hold = true;
    ctx.flags.decisionAction = 'hold';
    // depth 和 _routeHint 保持原样
    return ctx;
  }

  /**
   * HEAL: 自愈
   * - 如果 heartflow 实例上有 selfHealing 模块且可调用，则调用它
   * - 否则设置 heal_requested 标志
   * - 降低深度到 1（减少认知负荷，便于恢复）
   */
  _handleHeal(ctx) {
    ctx.depth = 1;

    // 尝试调用 selfHealing 模块
    let healingCalled = false;
    try {
      if (this.hf) {
        // 检查多种可能的 selfHealing 位置
        const healModule = this.hf.selfHealing || this.hf.healing || null;

        if (healModule && typeof healModule.heal === 'function') {
          healModule.heal(ctx.input || '', { depth: ctx.depth, routeHint: ctx._routeHint });
          healingCalled = true;
        } else if (healModule && typeof healModule.repair === 'function') {
          healModule.repair(ctx.input || '', { depth: ctx.depth, routeHint: ctx._routeHint });
          healingCalled = true;
        } else if (healModule && typeof healModule.attemptRecovery === 'function') {
          healModule.attemptRecovery(ctx.input || '', { depth: ctx.depth, routeHint: ctx._routeHint });
          healingCalled = true;
        } else if (healModule && typeof healModule === 'function') {
          healModule(ctx.input || '', { depth: ctx.depth, routeHint: ctx._routeHint });
          healingCalled = true;
        }
      }
    } catch (_shErr) {
      // selfHealing 失败：回退到标志设置
      healingCalled = false;
    }

    ctx.flags = ctx.flags || {};
    ctx.flags.heal_requested = !healingCalled;
    ctx.flags.healing_called = healingCalled;
    ctx.flags.decisionAction = 'heal';

    if (ctx._routeHint) {
      // 自愈时降低信心，保持谨慎
      ctx._routeHint.confidence = Math.min(ctx._routeHint.confidence || 0.5, 0.5);
    }

    return ctx;
  }

  /**
   * RESONATE: 共振
   * - 深度 +2（不超过 MAX_DEPTH=5）
   * - 设置 routeHint 为 resonant 模式
   */
  _handleResonate(ctx) {
    ctx.depth = Math.min(MAX_DEPTH, (ctx.depth || 1) + 2);
    if (ctx._routeHint) {
      ctx._routeHint.type = 'resonant';
      ctx._routeHint.confidence = Math.min(1.0, (ctx._routeHint.confidence || 0.5) + 0.2);
    } else {
      ctx._routeHint = { type: 'resonant', confidence: 0.7 };
    }
    ctx.flags = ctx.flags || {};
    ctx.flags.resonating = true;
    ctx.flags.decisionAction = 'resonate';
    return ctx;
  }

  /**
   * TRANSMIT: 传递/快速输出
   * - 深度强制为 1（最浅推理，快速产出）
   * - 设置 routeHint 为 transmit 类型
   */
  _handleTransmit(ctx) {
    ctx.depth = 1;
    if (ctx._routeHint) {
      ctx._routeHint.type = 'transmit';
      ctx._routeHint.confidence = Math.min(1.0, (ctx._routeHint.confidence || 0.5) + 0.1);
    } else {
      ctx._routeHint = { type: 'transmit', confidence: 0.6 };
    }
    ctx.flags = ctx.flags || {};
    ctx.flags.transmitting = true;
    ctx.flags.decisionAction = 'transmit';
    return ctx;
  }

  /**
   * REST: 休息/低能耗
   * - 深度强制为 0（跳过 ThoughtChain）
   * - 设置 rest 标志，供调用方检测并返回最小响应
   */
  _handleRest(ctx) {
    ctx.depth = REST_DEPTH; // 0
    if (ctx._routeHint) {
      ctx._routeHint.type = 'rest';
      ctx._routeHint.confidence = 0.2;
    } else {
      ctx._routeHint = { type: 'rest', confidence: 0.2 };
    }
    ctx.flags = ctx.flags || {};
    ctx.flags.rest = true;
    ctx.flags.skipThoughtChain = true;
    ctx.flags.decisionAction = 'rest';
    return ctx;
  }

  // ─── 工具方法 ────────────────────────────────────────────────────────────

  /**
   * 深拷贝上下文（防止副作用污染原始对象）
   */
  _cloneContext(context) {
    if (!context || typeof context !== 'object') {
      return {
        depth: 1,
        _routeHint: { type: 'general', confidence: 0.5 },
        chain: null,
        input: '',
        flags: {},
      };
    }

    return {
      depth: typeof context.depth === 'number' ? context.depth : 1,
      _routeHint: context._routeHint && typeof context._routeHint === 'object'
        ? {
            type: context._routeHint.type || 'general',
            confidence: typeof context._routeHint.confidence === 'number'
              ? context._routeHint.confidence : 0.5,
          }
        : { type: 'general', confidence: 0.5 },
      chain: context.chain || null,
      input: context.input || '',
      flags: context.flags && typeof context.flags === 'object'
        ? { ...context.flags }
        : {},
    };
  }

  /**
   * 生成安全的默认返回结果
   */
  _defaultResult(thinkContext) {
    const depth = thinkContext && typeof thinkContext.depth === 'number' ? thinkContext.depth : 1;
    const routeHint = thinkContext && thinkContext._routeHint && typeof thinkContext._routeHint === 'object'
      ? { type: thinkContext._routeHint.type || 'general', confidence: thinkContext._routeHint.confidence || 0.5 }
      : { type: 'general', confidence: 0.5 };

    return { depth, _routeHint: routeHint, flags: {} };
  }
}

// ─── 导出 ──────────────────────────────────────────────────────────────────
module.exports = {
  DecisionExecutor,
  DECISION_ACTION_MAP,
};
