/**
 * PersonaConsistencyChecker — 人格偏离检测 + 自动回正
 *
 * 复用：
 * - src/cortex/reflexion-engine.js  -> 任务后反思、策略建议
 * - src/cortex/self-correction-loop.js -> 错误记录、权重衰减、历史查询
 *
 * 设计约束：
 * - 不新增硬依赖
 * - 护栏指令由上层 shield 执行，本模块只修正表达层偏差
 * - 默认启用，支持阈值配置
 */

const { ReflexionEngine } = require('../cortex/reflexion-engine.js');
const selfCorrectionLoop = require('../cortex/self-correction-loop.js');

const DEFAULT_DRIFT_THRESHOLD = 0.2;
const DEFAULT_REFLECT_EVERY = 3;

class PersonaConsistencyChecker {
  constructor(options = {}) {
    this.name = 'personaConsistencyChecker';
    this.version = '1.0.0';
    this.driftThreshold = options.driftThreshold ?? DEFAULT_DRIFT_THRESHOLD;
    this.reflectEvery = options.reflectEvery ?? DEFAULT_REFLECT_EVERY;
    this.reflexion = new ReflexionEngine({
      maxReflections: 50,
      reflectionWindow: 100,
      successThreshold: 0.75
    });
    this._history = [];
    this._maxHistory = 200;
    this._sinceLastReflection = 0;
    this._stats = { checked: 0, drifted: 0, corrected: 0, reflectionCount: 0 };
  }

  /**
   * 检查一轮生成结果与当前 persona 是否一致。
   *
   * @param {{ profile: object, input: string, output: string, context?: object }} payload
   * @returns {{ driftScore: number, drifted: boolean, correction: object|null, reflection: object|null }}
   */
  check({ profile, input, output, context }) {
    this._stats.checked++;
    const current = profile || {};
    const result = {
      driftScore: 0,
      drifted: false,
      correction: null,
      reflection: null
    };

    if (!output || !current.tone) {
      return result;
    }

    const signals = this._computeSignals(current, String(input || ''), String(output || ''));
    const driftScore = this._aggregateDrift(signals);
    result.driftScore = Math.round(driftScore * 100) / 100;
    result.drifted = driftScore >= this.driftThreshold;
    result.signals = signals;
    if (result.drifted) {
      this._stats.drifted++;
    }

    const task = {
      input: String(input || '').slice(0, 200),
      expected: this._expectedArtefact(current),
      output: String(output || '').slice(0, 400)
    };
    const reflectResult = this.reflexion.reflect(task, { success: !result.drifted, output, error: result.drifted ? 'persona_drift' : null });

    if (result.drifted) {
      const correction = this._buildCorrection(current, signals, driftScore);
      result.correction = correction;
      try {
        selfCorrectionLoop.record('persona_drift', output, correction.suggestedOutput || output, correction.reason, 'medium');
        this._stats.corrected++;
      } catch (e) {
        // non-fatal
      }
    }

    this._sinceLastReflection++;
    if (this._sinceLastReflection >= this.reflectEvery) {
      this._sinceLastReflection = 0;
      result.reflection = reflectResult;
      this._stats.reflectionCount++;
    }

    this._boundedPush(this._history, {
      timestamp: new Date().toISOString(),
      profileId: current.id,
      preset: current.preset,
      driftScore: result.driftScore,
      drifted: result.drifted
    });
    return result;
  }

  getStats() {
    return { ...this._stats, historySize: this._history.length, reflexionStats: this.reflexion.getStats() };
  }

  getRecentDrifts(limit = 20) {
    return this._history.filter(h => h.drifted).slice(-limit);
  }

  reset() {
    this._history = [];
    this._sinceLastReflection = 0;
    this._stats = { checked: 0, drifted: 0, corrected: 0, reflectionCount: 0 };
    try { this.reflexion.reset(); } catch (e) {}
  }

  _computeSignals(profile, input, output) {
    const tone = profile.tone || {};
    const style = (profile.styleHints && profile.styleHints.primary) || 'neutral';
    const lower = output.toLowerCase();
    const len = output.trim().length;

    const signals = {
      warmthDelta: this._warmthSignal(tone.warmth, lower, len),
      directnessDelta: this._directnessSignal(tone.directness, lower, len),
      formalityDelta: this._formalitySignal(tone.formality, lower),
      playfulnessDelta: this._playfulnessSignal(tone.playfulness, lower),
      styleDelta: this._styleSignal(style, lower),
      lengthDelta: this._lengthSignal(tone.verbosity, len)
    };

    return signals;
  }

  _aggregateDrift(signals) {
    const vals = Object.values(signals).filter(v => typeof v === 'number');
    if (!vals.length) return 0;
    const avg = vals.reduce((s, v) => s + Math.abs(v), 0) / vals.length;
    return Math.min(1, avg);
  }

  _warmthSignal(expected, lower, len) {
    const target = expected != null ? expected : 0.5;
    const warmCues = /感谢|理解|支持|抱抱|安抚|没关系|辛苦|心疼|我在|陪你|共情|关心|温柔|温暖|肯定/.test(lower) ? 0.3 : 0;
    const coldCues = /显然|显然|必须|立刻|不对|错|这还不简单|自己|自己看/.test(lower) ? -0.3 : 0;
    const warmth = Math.min(1, Math.max(0, target + warmCues + coldCues));
    if (target >= 0.75 && warmth < 0.55) return -0.45;
    if (target <= 0.3 && warmth > 0.65) return 0.45;
    return 0;
  }

  _directnessSignal(expected, lower, len) {
    const target = expected != null ? expected : 0.5;
    const direct = /直接说|结论是|所以|答案是|明确|不要|必须|不是/.test(lower) ? 0.2 : 0;
    const hedging = /也许|可能|大概|有时候|不一定|也许/.test(lower) ? -0.2 : 0;
    const level = Math.min(1, Math.max(0, target + direct + hedging));
    if (target >= 0.75 && level < 0.55) return -0.4;
    if (target <= 0.3 && level > 0.65) return 0.4;
    return 0;
  }

  _formalitySignal(expected, lower) {
    const target = expected != null ? expected : 0.5;
    const formal = /请|您|敬请|烦请|建议|综上所述|因此/.test(lower) ? 0.2 : 0;
    const casual = /哈|呢|啦|哦|呗|咋|啥|搞定|走起/.test(lower) ? -0.2 : 0;
    const level = Math.min(1, Math.max(0, target + formal + casual));
    if (target >= 0.75 && level < 0.55) return -0.35;
    if (target <= 0.3 && level > 0.65) return 0.35;
    return 0;
  }

  _playfulnessSignal(expected, lower) {
    const target = expected != null ? expected : 0.2;
    const playful = /哈哈|有趣|好玩|试试看|猜|逗你|玩笑|轻松|幽默/.test(lower) ? 0.25 : 0;
    const level = Math.min(1, Math.max(0, target + playful));
    if (target >= 0.6 && level < 0.4) return -0.5;
    if (target <= 0.2 && level > 0.5) return 0.5;
    return 0;
  }

  _styleSignal(expectedStyle, lower) {
    const critical = /显然错误|前提不成立|证据不足|核对前提|反例/.test(lower) ? 1 : 0;
    const empathy = /我听到|你并不孤单|你的感受|我陪着你|可以理解/.test(lower) ? 1 : 0;
    if (expectedStyle === 'critical' && empathy > 0) return 0.45;
    if (expectedStyle === 'empathy' && critical > 0) return 0.45;
    return 0;
  }

  _lengthSignal(verbosity, len) {
    const target = verbosity || 'balanced';
    if (target === 'minimal' && len > 320) return 0.35;
    if (target === 'rich' && len < 80) return 0.35;
    return 0;
  }

  _expectedArtefact(profile) {
    return `Persona=${profile.id || 'unknown'}, preset=${profile.preset || 'unknown'}, tone=${JSON.stringify(profile.tone || {})}`;
  }

  _buildCorrection(profile, signals, driftScore) {
    const hints = [];
    if (Math.abs(signals.warmthDelta || 0) > 0.2) hints.push('调整语气温度');
    if (Math.abs(signals.directnessDelta || 0) > 0.2) hints.push('校准直接程度');
    if (Math.abs(signals.formalityDelta || 0) > 0.2) hints.push('校准正式程度');
    if (Math.abs(signals.playfulnessDelta || 0) > 0.2) hints.push('调节轻松度');
    if (Math.abs(signals.styleDelta || 0) > 0.2) hints.push('回归表达模式');
    if (Math.abs(signals.lengthDelta || 0) > 0.2) hints.push('调整输出长度');

    const reason = `persona drift score=${driftScore.toFixed(2)}; ${hints.join('; ') || '轻微表达偏离'}`;
    return {
      type: 'persona_drift',
      reason,
      severity: driftScore > 0.45 ? 'high' : 'medium',
      confidence: 0.85,
      suggestedAdjustments: hints,
      suggestedOutput: null,
      personaId: profile.id,
      preset: profile.preset
    };
  }

  _boundedPush(arr, item) {
    if (arr.length >= this._maxHistory) arr.shift();
    arr.push(item);
  }
}

module.exports = { PersonaConsistencyChecker };
