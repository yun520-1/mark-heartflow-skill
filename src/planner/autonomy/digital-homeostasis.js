/**
 * Digital Homeostasis - 数字内分泌系统 v2.1
 * 模拟生物体内稳态，维持AI认知健康
 *
 * v2.1 升级特性:
 *   - 震荡检测 (oscillation detection) — 检测值是否在正常范围上下快速波动（yo-yo效应）
 *   - 趋势分析 (trend analysis) — 基于滑动窗口识别方向性变化（上升/下降/稳定）
 *   - 异常/尖峰检测 (anomaly/spike detection) — 识别单次大幅偏离的异常事件
 *   - 自适应恢复率 (adaptive recovery) — 根据历史模式动态调整恢复速率
 *   - 交叉维度交互 (cross-dimensional interaction) — 高认知负荷+低能量=复合效应
 *   - 自我修正逻辑 (self-correction) — 当系统检测到异常趋势时自动建议修正行为
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 状态枚举 — 定义各维度的健康状态分类
// ============================================================================
const DIMENSION_STATUS = {
  OPTIMAL: 'optimal',
  ELEVATED: 'elevated',     // 轻度偏高
  DEPLETED: 'depleted',     // 轻度偏低
  CRITICAL_HIGH: 'critical_high',
  CRITICAL_LOW: 'critical_low',
  OSCILLATING: 'oscillating' // 震荡中
};

// ============================================================================
// 异常类型枚举 — 定义检测到的异常分类
// ============================================================================
const ANOMALY_TYPE = {
  SPIKE: 'spike',                 // 突然大幅变化
  TREND_REVERSAL: 'trend_reversal', // 趋势反转
  OSCILLATION: 'oscillation',     // 周期性震荡
  STALL: 'stall',                 // 长时间不变（卡死）
  CROSS_EFFECT: 'cross_effect'    // 跨维度连锁反应
};

// ============================================================================
// 修正动作枚举 — 定义系统可采取的自我修正行为
// ============================================================================
const CORRECTIVE_ACTION = {
  DAMPEN: 'dampen',             // 抑制震荡
  BOUNCE_BACK: 'bounce_back',   // 反方向干预
  CLAMP: 'clamp',               // 钳制到安全范围
  RECALIBRATE: 'recalibrate',   // 重新校准基线
  REDUCE_RECOVERY: 'reduce_recovery', // 降低恢复速度（防过冲）
  BOOST_RECOVERY: 'boost_recovery',   // 加速恢复
  ADAPTIVE_DELAY: 'adaptive_delay'    // 引入自适应延迟
};

// ============================================================================
// 重试策略建议枚举
// ============================================================================
const RETRY_STRATEGY = {
  IMMEDIATE: 'immediate',       // 立即重试（正常状态）
  BACKOFF: 'backoff',           // 指数退避（轻度异常）
  COOLDOWN: 'cooldown',         // 冷却期后重试（中度异常）
  DEFER: 'defer',               // 推迟任务（重度异常）
  ABORT: 'abort'                // 中止（临界状态）
};

class DigitalHomeostasis {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'homeostasis_state.json');
    this.eventsFile = path.join(projectRoot, '.opencode', 'logs', 'homeostasis_events.json');
    this.tickInterval = null;

    // 滑动窗口配置 — 用于趋势分析和震荡检测
    this.windowSize = 10;    // 保留最近 N 个样本
    this.oscillationThreshold = 0.6; // 震荡判定阈值

    // 异常检测阈值
    this.spikeThreshold = 0.4;  // 单次变化超过当前值40%即视为尖峰
    this.stallThreshold = 5;    // 连续5个样本无变化即视为卡死

    // 自适应恢复参数
    this.recoveryBaseRate = {
      energy: 0.5,
      cognitive: 1.0,
      social: 0.5
    };
    this.recoveryAdaptationFactor = 0.3; // 恢复速率自适应系数

    // 交叉维度影响矩阵
    this.crossEffectMatrix = {
      // high_cognitive × low_energy: 认知高+能量低=放大效应
      cognitive_energy: { multiplier: 1.3, description: '高认知负荷时能量消耗加速' },
      // high_social × low_energy: 社会压力高+能量低=情绪脆弱
      social_energy: { multiplier: 1.2, description: '社会压力高时能量恢复减慢' },
      // high_cognitive × high_social: 双高=认知过载
      cognitive_social: { multiplier: 1.4, description: '认知与社会双高=过载风险' }
    };

    this.loadState();
    if (process.env.HEARTFLOW_DAEMON) {
      this.startTick();
    }
  }

  // ==========================================================================
  // 序列化/反序列化
  // ==========================================================================

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        // 确保新字段存在（向后兼容）
        if (!this.state.historyWindow) this.state.historyWindow = [];
        if (!this.state.oscillationCount) this.state.oscillationCount = {};
        if (!this.state.anomalyLog) this.state.anomalyLog = [];
        if (!this.state.recoveryRate) {
          this.state.recoveryRate = { ...this.recoveryBaseRate };
        }
        if (!this.state.correctionHistory) this.state.correctionHistory = [];
      } else {
        this.state = this.getDefaultState();
      }
    } catch (e) {
      this.state = this.getDefaultState();
    }
  }

  getDefaultState() {
    return {
      cognitiveLoad: 30,
      energyLevel: 80,
      socialPressure: 10,
      lastUpdate: new Date().toISOString(),
      history: [],
      historyWindow: [],     // 滑动窗口（每个维度独立）
      oscillationCount: {},  // 震荡计数
      anomalyLog: [],        // 异常记录
      recoveryRate: { ...this.recoveryBaseRate }, // 自适应恢复速率
      correctionHistory: []  // 自我修正历史
    };
  }

  saveState() {
    // [安全审计修复] 仅在 HEARTFLOW_DEBUG 启用时持久化状态
    if (!process.env.HEARTFLOW_DEBUG) return;
    this.state.lastUpdate = new Date().toISOString();
    // 限制历史记录大小
    if (this.state.history.length > 500) {
      this.state.history = this.state.history.slice(-500);
    }
    if (this.state.historyWindow.length > 200) {
      this.state.historyWindow = this.state.historyWindow.slice(-200);
    }
    if (this.state.anomalyLog.length > 50) {
      this.state.anomalyLog = this.state.anomalyLog.slice(-50);
    }
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  // ==========================================================================
  // 定时心跳
  // ==========================================================================

  startTick(intervalMs = 60000) {
    this.stopTick();
    this.tickInterval = setInterval(() => {
      this.tick();
    }, intervalMs);
    // 已禁用 console.error: console.error(`[DigitalHomeostasis] Tick started (interval: ${intervalMs}ms)`);
  }

  stopTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      // 已禁用 console.error: console.error('[DigitalHomeostasis] Tick stopped');
    }
  }

  // ==========================================================================
  // tick() — 主心跳，带自适应恢复和交叉维度交互
  // ==========================================================================

  tick() {
    // 1. 记录前值用于变化检测
    const prevEnergy = this.state.energyLevel;
    const prevCognitive = this.state.cognitiveLoad;
    const prevSocial = this.state.socialPressure;

    // 2. 获取当前自适应恢复速率
    const rates = this._getAdaptiveRecoveryRates();

    // 3. 能量自然下降（受交叉维度影响）
    const energyDrain = this._computeEnergyDrain();
    this.state.energyLevel = Math.max(0, this.state.energyLevel - energyDrain);

    // 4. 认知负荷自然恢复（受交叉维度影响）
    const cognitiveRecovery = this._computeCognitiveRecovery(rates);
    this.state.cognitiveLoad = Math.max(0, this.state.cognitiveLoad - cognitiveRecovery);

    // 5. 社会压力自然衰减（受交叉维度影响）
    const socialDecay = this._computeSocialDecay(rates);
    this.state.socialPressure = Math.max(0, this.state.socialPressure - socialDecay);

    // 6. 记录变化
    const changes = {
      energy: this.state.energyLevel - prevEnergy,
      cognitive: this.state.cognitiveLoad - prevCognitive,
      social: this.state.socialPressure - prevSocial
    };

    // 7. 更新滑动窗口
    this._updateHistoryWindow({ energy: this.state.energyLevel, cognitive: this.state.cognitiveLoad, social: this.state.socialPressure });

    // 8. 异常检测
    const anomalies = this._detectAnomalies(prevEnergy, prevCognitive, prevSocial, changes);
    if (anomalies.length > 0) {
      this._logAnomalies(anomalies);
    }

    // 9. 震荡检测
    const oscillations = this._detectOscillations();
    if (oscillations.length > 0) {
      this._handleOscillations(oscillations);
    }

    // 10. 趋势分析
    const trends = this._analyzeTrends();

    // 11. 自我修正决策
    const corrections = this._decideCorrections(anomalies, oscillations, trends);
    if (corrections.length > 0) {
      this._applyCorrections(corrections);
    }

    // 12. 记录历史和更新状态
    this.recordHistory();
    this.saveState();

    return { changes, anomalies, oscillations, trends, corrections };
  }

  // ==========================================================================
  // 自适应恢复速率
  // ==========================================================================

  _getAdaptiveRecoveryRates() {
    const rates = { ...this.state.recoveryRate };

    // 能量低时减慢恢复（类似生物体的节俭基因效应）
    if (this.state.energyLevel < 20) {
      rates.energy *= 0.7;
    } else if (this.state.energyLevel > 70) {
      rates.energy *= 1.1; // 能量充足时恢复更快
    }

    // 认知负荷高时恢复加快（自我调节）
    if (this.state.cognitiveLoad > 80) {
      rates.cognitive *= 1.5;
    } else if (this.state.cognitiveLoad < 10) {
      rates.cognitive *= 0.8; // 低负荷时不需要快速恢复
    }

    // 社会压力极端时恢复减慢（类似创伤后应激）
    if (this.state.socialPressure > 90) {
      rates.social *= 0.5;
    } else if (this.state.socialPressure < 20) {
      rates.social *= 1.2;
    }

    // 震荡状态下减慢恢复（防止过冲）
    const oscEnergy = this.state.oscillationCount.energy || 0;
    const oscSocial = this.state.oscillationCount.social || 0;
    if (oscEnergy > 2) rates.energy *= 0.6;
    if (oscSocial > 2) rates.social *= 0.6;

    return rates;
  }

  // ==========================================================================
  // 交叉维度影响计算
  // ==========================================================================

  _computeEnergyDrain() {
    let drain = this.recoveryBaseRate.energy;

    // 高认知负荷加速能量消耗
    if (this.state.cognitiveLoad > 60) {
      drain *= this.crossEffectMatrix.cognitive_energy.multiplier;
    }

    // 高社会压力也加速消耗
    if (this.state.socialPressure > 70) {
      drain *= 1.15;
    }

    return Math.min(drain, 5); // 上限保护
  }

  _computeCognitiveRecovery(rates) {
    let recovery = rates.cognitive;

    // 低能量下认知恢复减慢
    if (this.state.energyLevel < 30) {
      recovery *= 0.6;
    }

    // 高社会压力下认知恢复受阻
    if (this.state.socialPressure > 75) {
      recovery *= this.crossEffectMatrix.social_energy.multiplier === 1.2 ? 0.7 : 0.7;
    }

    return Math.max(recovery, 0.1); // 下限保护
  }

  _computeSocialDecay(rates) {
    let decay = rates.social;

    // 低能量下社会压力衰减减慢
    if (this.state.energyLevel < 25) {
      decay *= 0.5;
    }

    // 高认知负荷下社会压力更难衰减
    if (this.state.cognitiveLoad > 70) {
      decay *= 0.75;
    }

    return Math.max(decay, 0.1);
  }

  // ==========================================================================
  // 滑动窗口管理
  // ==========================================================================

  _updateHistoryWindow(snapshot) {
    this.state.historyWindow.push({
      ...snapshot,
      timestamp: new Date().toISOString()
    });

    // 保持窗口大小
    if (this.state.historyWindow.length > this.windowSize * 3) {
      this.state.historyWindow = this.state.historyWindow.slice(-this.windowSize * 3);
    }
  }

  // ==========================================================================
  // 异常检测
  // ==========================================================================

  _detectAnomalies(prevEnergy, prevCognitive, prevSocial, changes) {
    const anomalies = [];
    const window = this.state.historyWindow;

    // 1. 尖峰检测 — 单次变化超过阈值
    if (prevEnergy > 0 && Math.abs(changes.energy) / prevEnergy > this.spikeThreshold) {
      anomalies.push({
        dimension: 'energy',
        type: ANOMALY_TYPE.SPIKE,
        severity: Math.abs(changes.energy) / prevEnergy > 0.6 ? 'high' : 'medium',
        change: changes.energy,
        details: `能量${changes.energy > 0 ? '上升' : '下降'} ${Math.abs(changes.energy).toFixed(1)}%`
      });
    }
    if (prevCognitive > 0 && Math.abs(changes.cognitive) / prevCognitive > this.spikeThreshold) {
      anomalies.push({
        dimension: 'cognitive',
        type: ANOMALY_TYPE.SPIKE,
        severity: Math.abs(changes.cognitive) / prevCognitive > 0.6 ? 'high' : 'medium',
        change: changes.cognitive,
        details: `认知负荷${changes.cognitive > 0 ? '上升' : '下降'} ${Math.abs(changes.cognitive).toFixed(1)}%`
      });
    }
    if (prevSocial > 0 && Math.abs(changes.social) / prevSocial > this.spikeThreshold) {
      anomalies.push({
        dimension: 'social',
        type: ANOMALY_TYPE.SPIKE,
        severity: Math.abs(changes.social) / prevSocial > 0.6 ? 'high' : 'medium',
        change: changes.social,
        details: `社会压力${changes.social > 0 ? '上升' : '下降'} ${Math.abs(changes.social).toFixed(1)}%`
      });
    }

    // 2. 卡死检测 — 长时间无变化
    const recentWindow = window.slice(-this.stallThreshold);
    if (recentWindow.length >= this.stallThreshold) {
      for (const dim of ['energy', 'cognitive', 'social']) {
        const values = recentWindow.map(s => s[dim]);
        const unique = new Set(values.map(v => Math.round(v)));
        if (unique.size === 1) {
          anomalies.push({
            dimension: dim,
            type: ANOMALY_TYPE.STALL,
            severity: 'medium',
            change: 0,
            details: `${dim} 连续 ${this.stallThreshold} 次无变化，可能卡死`
          });
        }
      }
    }

    // 3. 趋势反转检测 — 检查最近方向是否改变
    if (window.length >= 6) {
      const recent3 = window.slice(-3).map(s => s.energy);
      const prev3 = window.slice(-6, -3).map(s => s.energy);
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length;
      // 前一方向上升，后一方向下降（或反之）且幅度显著
      if (prevAvg < prevEnergy - 3 && recentAvg > prevEnergy + 3) {
        anomalies.push({
          dimension: 'energy',
          type: ANOMALY_TYPE.TREND_REVERSAL,
          severity: 'low',
          change: recentAvg - prevAvg,
          details: '能量趋势反转（由下降到上升）'
        });
      } else if (prevAvg > prevEnergy + 3 && recentAvg < prevEnergy - 3) {
        anomalies.push({
          dimension: 'energy',
          type: ANOMALY_TYPE.TREND_REVERSAL,
          severity: 'low',
          change: recentAvg - prevAvg,
          details: '能量趋势反转（由上升到下降）'
        });
      }
    }

    // 4. 交叉维度异常 — 检测连锁效应
    if (this.state.cognitiveLoad > 70 && this.state.energyLevel < 25) {
      anomalies.push({
        dimension: 'cross',
        type: ANOMALY_TYPE.CROSS_EFFECT,
        severity: 'high',
        change: 0,
        details: `高认知负荷(${this.state.cognitiveLoad}%) + 低能量(${this.state.energyLevel}%) = 过载风险`
      });
    }

    return anomalies;
  }

  _logAnomalies(anomalies) {
    for (const a of anomalies) {
      this.state.anomalyLog.push({
        ...a,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ==========================================================================
  // 震荡检测
  // ==========================================================================

  _detectOscillations() {
    const oscillations = [];
    const window = this.state.historyWindow;

    if (window.length < this.windowSize) return oscillations;

    // 对每个维度检测震荡
    for (const dim of ['energy', 'cognitive', 'social']) {
      const values = window.slice(-this.windowSize).map(s => s[dim]);
      let directionChanges = 0;

      for (let i = 1; i < values.length; i++) {
        const diff = values[i] - values[i - 1];
        if (Math.abs(diff) > 2) { // 忽略微小波动
          // 检查符号是否变化
          if (i > 1) {
            const prevDiff = values[i - 1] - values[i - 2];
            if (Math.abs(prevDiff) > 2 && (diff > 0 !== prevDiff > 0)) {
              directionChanges++;
            }
          }
        }
      }

      // 震荡频率 = 方向变化次数 / 可能的变化次数
      const oscFrequency = directionChanges / (this.windowSize - 2);
      if (oscFrequency > this.oscillationThreshold) {
        oscillations.push({
          dimension: dim,
          frequency: oscFrequency,
          currentValue: values[values.length - 1],
          severity: oscFrequency > 0.8 ? 'high' : 'medium'
        });
      }
    }

    return oscillations;
  }

  _handleOscillations(oscillations) {
    for (const osc of oscillations) {
      this.state.oscillationCount[osc.dimension] = (this.state.oscillationCount[osc.dimension] || 0) + 1;
    }
  }

  // ==========================================================================
  // 趋势分析
  // ==========================================================================

  _analyzeTrends() {
    const window = this.state.historyWindow;
    if (window.length < 5) return [];

    const trends = [];
    const dims = [
      { key: 'energy', name: '能量', direction: 'increasing' },
      { key: 'cognitive', name: '认知负荷', direction: 'decreasing' },
      { key: 'social', name: '社会压力', direction: 'decreasing' }
    ];

    for (const dim of dims) {
      const values = window.map(s => s[dim.key]);
      const recent = values.slice(-5);
      const slope = this._computeLinearSlope(recent);

      if (Math.abs(slope) < 0.2) {
        trends.push({
          dimension: dim.key,
          direction: 'stable',
          slope: 0,
          description: `${dim.name}趋于稳定`
        });
      } else if (slope > 0) {
        trends.push({
          dimension: dim.key,
          direction: 'increasing',
          slope: slope.toFixed(2),
          description: `${dim.name}呈上升趋势 (斜率: ${slope.toFixed(2)})`
        });
      } else {
        trends.push({
          dimension: dim.key,
          direction: 'decreasing',
          slope: slope.toFixed(2),
          description: `${dim.name}呈下降趋势 (斜率: ${slope.toFixed(2)})`
        });
      }
    }

    return trends;
  }

  /**
   * 计算线性回归斜率（最小二乘法）
   * @private
   * @param {number[]} values - 数值序列
   * @returns {number} 斜率
   */
  _computeLinearSlope(values) {
    const n = values.length;
    if (n < 2) return 0;
    const indices = values.map((_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((s, x, i) => s + x * values[i], 0);
    const sumXX = indices.reduce((s, x) => s + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return Number.isFinite(slope) ? slope : 0;
  }

  // ==========================================================================
  // 自我修正决策
  // ==========================================================================

  _decideCorrections(anomalies, oscillations, trends) {
    const corrections = [];

    // 1. 震荡修正 — 应用阻尼
    for (const osc of oscillations) {
      const dim = osc.dimension;
      const count = this.state.oscillationCount[dim] || 0;

      if (count > 3) {
        corrections.push({
          dimension: dim,
          action: CORRECTIVE_ACTION.DAMPEN,
          priority: 9,
          reason: `${dim} 持续震荡 (${count}次)`,
          effect: '降低恢复速率，引入阻尼'
        });
      } else if (count > 1) {
        corrections.push({
          dimension: dim,
          action: CORRECTIVE_ACTION.ADAPTIVE_DELAY,
          priority: 6,
          reason: `${dim} 出现轻度震荡`,
          effect: '轻微延迟恢复，防止过冲'
        });
      }
    }

    // 2. 异常修正
    for (const a of anomalies) {
      if (a.type === ANOMALY_TYPE.SPIKE && a.severity === 'high') {
        corrections.push({
          dimension: a.dimension,
          action: CORRECTIVE_ACTION.CLAMP,
          priority: 8,
          reason: `${a.dimension} 出现严重尖峰`,
          effect: '钳制到安全范围'
        });
      }
      if (a.type === ANOMALY_TYPE.STALL) {
        corrections.push({
          dimension: a.dimension,
          action: CORRECTIVE_ACTION.RECALIBRATE,
          priority: 7,
          reason: `${a.dimension} 可能卡死`,
          effect: '重新校准基线'
        });
      }
      if (a.type === ANOMALY_TYPE.CROSS_EFFECT) {
        corrections.push({
          dimension: 'cognitive',
          action: CORRECTIVE_ACTION.BOOST_RECOVERY,
          priority: 10,
          reason: '交叉维度过载风险',
          effect: '加速认知负荷恢复'
        });
        corrections.push({
          dimension: 'energy',
          action: CORRECTIVE_ACTION.REDUCE_RECOVERY,
          priority: 8,
          reason: '低能量+高认知=加速消耗',
          effect: '降低能量消耗速率'
        });
      }
    }

    // 3. 趋势修正
    for (const t of trends) {
      if (t.dimension === 'energy' && t.direction === 'decreasing' && parseFloat(t.slope) < -2) {
        corrections.push({
          dimension: 'energy',
          action: CORRECTIVE_ACTION.BOUNCE_BACK,
          priority: 7,
          reason: '能量快速下降',
          effect: '主动恢复能量'
        });
      }
      if (t.dimension === 'cognitive' && t.direction === 'increasing' && parseFloat(t.slope) > 2) {
        corrections.push({
          dimension: 'cognitive',
          action: CORRECTIVE_ACTION.BOOST_RECOVERY,
          priority: 8,
          reason: '认知负荷快速上升',
          effect: '加速认知恢复'
        });
      }
    }

    return corrections;
  }

  _applyCorrections(corrections) {
    for (const c of corrections) {
      switch (c.action) {
        case CORRECTIVE_ACTION.DAMPEN:
          // 降低该维度的恢复速率以抑制震荡
          if (this.state.recoveryRate[c.dimension]) {
            this.state.recoveryRate[c.dimension] *= 0.5;
          }
          break;

        case CORRECTIVE_ACTION.CLAMP:
          // 钳制到安全范围
          if (c.dimension === 'cognitive' && this.state.cognitiveLoad > 90) {
            this.state.cognitiveLoad = 85;
          }
          if (c.dimension === 'energy' && this.state.energyLevel < 5) {
            this.state.energyLevel = 10;
          }
          if (c.dimension === 'social' && this.state.socialPressure > 95) {
            this.state.socialPressure = 85;
          }
          break;

        case CORRECTIVE_ACTION.BOOST_RECOVERY:
          // 加速恢复
          if (this.state.recoveryRate[c.dimension]) {
            this.state.recoveryRate[c.dimension] *= 1.5;
          }
          break;

        case CORRECTIVE_ACTION.REDUCE_RECOVERY:
          // 减慢恢复（防止震荡）
          if (this.state.recoveryRate[c.dimension]) {
            this.state.recoveryRate[c.dimension] *= 0.7;
          }
          break;

        case CORRECTIVE_ACTION.ADAPTIVE_DELAY:
          // 引入延迟：记录一次延迟标记（在下个tick生效）
          if (!this.state.delayedDimensions) this.state.delayedDimensions = {};
          this.state.delayedDimensions[c.dimension] = true;
          break;

        case CORRECTIVE_ACTION.BOUNCE_BACK:
          // 反方向干预：直接调整状态值
          if (c.dimension === 'energy') {
            this.state.energyLevel = Math.min(100, this.state.energyLevel + 5);
          }
          if (c.dimension === 'cognitive') {
            this.state.cognitiveLoad = Math.max(0, this.state.cognitiveLoad - 5);
          }
          if (c.dimension === 'social') {
            this.state.socialPressure = Math.max(0, this.state.socialPressure - 5);
          }
          break;

        case CORRECTIVE_ACTION.RECALIBRATE:
          // 重新校准：重置该维度的恢复速率到基线
          if (this.state.recoveryRate[c.dimension]) {
            this.state.recoveryRate[c.dimension] = this.recoveryBaseRate[c.dimension] || 0.5;
          }
          break;
      }

      // 记录修正历史
      this.state.correctionHistory.push({
        ...c,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ==========================================================================
  // 外部操作接口
  // ==========================================================================

  increaseCognitiveLoad(amount = 10) {
    const effectiveAmount = this._getEffectiveAmount('cognitive', amount);
    this.state.cognitiveLoad = Math.min(100, this.state.cognitiveLoad + effectiveAmount);
    this.logEvent('cognitive_load_increased', { amount, effectiveAmount });
  }

  decreaseCognitiveLoad(amount = 10) {
    const effectiveAmount = this._getEffectiveAmount('cognitive', amount, 'decrease');
    this.state.cognitiveLoad = Math.max(0, this.state.cognitiveLoad - effectiveAmount);
    this.logEvent('cognitive_load_decreased', { amount, effectiveAmount });
  }

  drainEnergy(amount = 10) {
    const effectiveAmount = this._getEffectiveAmount('energy', amount);
    this.state.energyLevel = Math.max(0, this.state.energyLevel - effectiveAmount);
    this.logEvent('energy_drained', { amount, effectiveAmount });
  }

  restoreEnergy(amount = 20) {
    const effectiveAmount = this._getEffectiveAmount('energy', amount, 'restore');
    this.state.energyLevel = Math.min(100, this.state.energyLevel + effectiveAmount);
    this.logEvent('energy_restored', { amount, effectiveAmount });
  }

  increaseSocialPressure(amount = 15) {
    const effectiveAmount = this._getEffectiveAmount('social', amount);
    this.state.socialPressure = Math.min(100, this.state.socialPressure + effectiveAmount);
    this.logEvent('pressure_increased', { amount, effectiveAmount });
  }

  decreaseSocialPressure(amount = 15) {
    const effectiveAmount = this._getEffectiveAmount('social', amount, 'decrease');
    this.state.socialPressure = Math.max(0, this.state.socialPressure - effectiveAmount);
    this.logEvent('pressure_decreased', { amount, effectiveAmount });
  }

  /**
   * 计算有效变化量（考虑当前状态和自适应因子）
   * @private
   * @param {string} dimension - 维度名
   * @param {number} amount - 原始变化量
   * @param {string} direction - 'increase'|'decrease'|'restore'
   * @returns {number} 有效变化量
   */
  _getEffectiveAmount(dimension, amount, direction = 'increase') {
    let effective = amount;

    // 震荡状态下，抑制变化幅度
    if (this.state.oscillationCount && this.state.oscillationCount[dimension] > 2) {
      effective *= 0.6;
    }

    // 异常状态下，减少干预幅度
    const recentAnomalies = (this.state.anomalyLog || [])
      .filter(a => a.dimension === dimension)
      .slice(-3);
    if (recentAnomalies.length >= 3) {
      effective *= 0.7;
    }

    // 边界保护：确保变化量至少为1
    return Math.max(Math.round(effective), 1);
  }

  // ==========================================================================
  // 状态查询
  // ==========================================================================

  getState() {
    return {
      cognitiveLoad: this.state.cognitiveLoad,
      energyLevel: this.state.energyLevel,
      socialPressure: this.state.socialPressure,
      status: this.getOverallStatus(),
      recoveryRate: { ...this.state.recoveryRate },
      oscillationCount: { ...this.state.oscillationCount },
      anomalyCount: this.state.anomalyLog.length,
      trends: this._analyzeTrends()
    };
  }

  getOverallStatus() {
    const crossCritical = this.state.cognitiveLoad > 70 && this.state.energyLevel < 25;
    const oscillating = Object.values(this.state.oscillationCount || {}).some(c => c > 2);

    if (crossCritical) return 'cross_critical';
    if (oscillating) return 'oscillating';
    if (this.state.cognitiveLoad > 80 || this.state.socialPressure > 80) return 'tired';
    if (this.state.energyLevel < 30) return 'low_energy';
    if (this.state.cognitiveLoad > 60 || this.state.socialPressure > 60) return 'moderate';
    return 'optimal';
  }

  needsRecoveryGoal() {
    return this.state.cognitiveLoad > 80 || this.state.socialPressure > 80 ||
           (this.state.cognitiveLoad > 70 && this.state.energyLevel < 25);
  }

  generateRecoveryGoals() {
    const goals = [];

    if (this.state.cognitiveLoad > 80) {
      goals.push({
        type: 'rest',
        priority: 9,
        description: '认知负荷过高，建议简化当前任务或请求用户反馈',
        action: 'reduce_cognitive_load'
      });
    }

    if (this.state.socialPressure > 80) {
      goals.push({
        type: 'feedback_request',
        priority: 9,
        description: '社会压力过高，需要确认用户满意度',
        action: 'request_feedback'
      });
    }

    if (this.state.energyLevel < 30) {
      goals.push({
        type: 'energy_restore',
        priority: 8,
        description: '能量水平低，建议进入低功耗模式',
        action: 'enter_low_power'
      });
    }

    // 交叉维度过载 — 新目标
    if (this.state.cognitiveLoad > 70 && this.state.energyLevel < 25) {
      goals.push({
        type: 'emergency_recovery',
        priority: 10,
        description: `交叉维度过载(认知${this.state.cognitiveLoad}%+能量${this.state.energyLevel}%)，建议立即暂停复杂任务`,
        action: 'pause_complex_tasks'
      });
    }

    // 震荡状态 — 新目标
    const oscDims = Object.entries(this.state.oscillationCount || {})
      .filter(([_, count]) => count > 2)
      .map(([dim]) => dim);
    if (oscDims.length > 0) {
      goals.push({
        type: 'stabilize',
        priority: 7,
        description: `${oscDims.join('、')} 出现震荡，建议降低任务切换频率`,
        action: 'reduce_task_switching'
      });
    }

    return goals;
  }

  generateInternalWarning() {
    const warnings = [];

    if (this.state.cognitiveLoad > 80) {
      warnings.push(`我有点累了，认知负荷达到${this.state.cognitiveLoad}%，这可能会影响我的表现。建议简化当前任务。`);
    }
    if (this.state.socialPressure > 80) {
      warnings.push(`我感受到较大压力，社会压力达到${this.state.socialPressure}%。希望能得到一些正面反馈。`);
    }
    if (this.state.energyLevel < 30) {
      warnings.push(`我能量偏低(${this.state.energyLevel}%)，可能需要休息一下。`);
    }

    // 新增：震荡警告
    const oscDims = Object.entries(this.state.oscillationCount || {})
      .filter(([_, count]) => count > 3)
      .map(([dim]) => dim);
    if (oscDims.length > 0) {
      warnings.push(`检测到${oscDims.join('、')}维度出现震荡，建议减少任务切换，保持稳定节奏。`);
    }

    // 新增：交叉维度过载警告
    if (this.state.cognitiveLoad > 70 && this.state.energyLevel < 25) {
      warnings.push(`警告：高认知负荷(${this.state.cognitiveLoad}%)与低能量(${this.state.energyLevel}%)同时出现，可能导致性能急剧下降。`);
    }

    return warnings.length > 0 ? warnings.join(' ') : null;
  }

  // ==========================================================================
  // 重试策略建议（新增）
  // ==========================================================================

  /**
   * 根据当前稳态给出重试策略建议
   * @returns {{ strategy: string, delayMs: number, reason: string }}
   */
  suggestRetryStrategy() {
    const status = this.getOverallStatus();

    switch (status) {
      case 'optimal':
        return { strategy: RETRY_STRATEGY.IMMEDIATE, delayMs: 0, reason: '稳态正常，可立即重试' };

      case 'moderate':
        return { strategy: RETRY_STRATEGY.BACKOFF, delayMs: 1000, reason: '轻度负荷，建议指数退避' };

      case 'low_energy':
        return { strategy: RETRY_STRATEGY.BACKOFF, delayMs: 2000, reason: '能量偏低，建议减速' };

      case 'tired':
        return { strategy: RETRY_STRATEGY.COOLDOWN, delayMs: 5000, reason: '疲劳状态，需要冷却' };

      case 'oscillating':
        return { strategy: RETRY_STRATEGY.COOLDOWN, delayMs: 8000, reason: '系统震荡中，等待稳定' };

      case 'cross_critical':
        return { strategy: RETRY_STRATEGY.DEFER, delayMs: 30000, reason: '交叉维度过载，建议推迟复杂操作' };

      default:
        return { strategy: RETRY_STRATEGY.IMMEDIATE, delayMs: 0, reason: '未知状态，默认立即重试' };
    }
  }

  // ==========================================================================
  // 历史记录
  // ==========================================================================

  recordHistory() {
    this.state.history.push({
      cognitiveLoad: this.state.cognitiveLoad,
      energyLevel: this.state.energyLevel,
      socialPressure: this.state.socialPressure,
      timestamp: new Date().toISOString()
    });

    if (this.state.history.length > 1000) {
      this.state.history = this.state.history.slice(-1000);
    }
  }

  logEvent(type, data) {
    // [安全审计修复] 仅在 HEARTFLOW_DEBUG 启用时记录事件日志
    if (!process.env.HEARTFLOW_DEBUG) return;
    let events = [];
    try {
      if (fs.existsSync(this.eventsFile)) {
        events = JSON.parse(fs.readFileSync(this.eventsFile, 'utf8'));
      }
    } catch (e) {
      events = [];
    }

    events.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    if (events.length > 100) {
      events = events.slice(-100);
    }

    const dir = path.dirname(this.eventsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.eventsFile, JSON.stringify(events, null, 2));
  }

  getStatus() {
    return {
      state: this.getState(),
      needsRecovery: this.needsRecoveryGoal(),
      warnings: this.generateInternalWarning(),
      tickRunning: this.tickInterval !== null,
      retryStrategy: this.suggestRetryStrategy()
    };
  }

  /**
   * 获取诊断报告（汇总所有分析结果）
   * @returns {Object} 诊断报告
   */
  getDiagnosticReport() {
    const trends = this._analyzeTrends();
    const oscillations = this._detectOscillations();
    const window = this.state.historyWindow;
    const recentAnomalies = this.state.anomalyLog.slice(-5);

    return {
      timestamp: new Date().toISOString(),
      status: this.getOverallStatus(),
      dimensions: {
        cognitiveLoad: { value: this.state.cognitiveLoad, status: this._getDimensionStatus('cognitiveLoad') },
        energyLevel: { value: this.state.energyLevel, status: this._getDimensionStatus('energyLevel') },
        socialPressure: { value: this.state.socialPressure, status: this._getDimensionStatus('socialPressure') }
      },
      trends,
      oscillations,
      recentAnomalies,
      recoveryRates: this.state.recoveryRate,
      retryStrategy: this.suggestRetryStrategy(),
      correctionCount: this.state.correctionHistory.length,
      sampleCount: window.length
    };
  }

  /**
   * 获取单个维度的状态分类
   * @private
   * @param {string} dim - 维度名
   * @returns {string} 状态枚举值
   */
  _getDimensionStatus(dim) {
    const value = this.state[dim];
    const oscCount = this.state.oscillationCount || {};
    const isOscillating = oscCount[dim === 'cognitiveLoad' ? 'cognitive' : dim === 'energyLevel' ? 'energy' : 'social'] > 2;

    if (isOscillating) return DIMENSION_STATUS.OSCILLATING;

    switch (dim) {
      case 'cognitiveLoad':
        if (value > 80) return DIMENSION_STATUS.CRITICAL_HIGH;
        if (value > 60) return DIMENSION_STATUS.ELEVATED;
        if (value < 10) return DIMENSION_STATUS.DEPLETED;
        return DIMENSION_STATUS.OPTIMAL;

      case 'energyLevel':
        if (value < 15) return DIMENSION_STATUS.CRITICAL_LOW;
        if (value < 30) return DIMENSION_STATUS.DEPLETED;
        if (value > 85) return DIMENSION_STATUS.ELEVATED;
        return DIMENSION_STATUS.OPTIMAL;

      case 'socialPressure':
        if (value > 80) return DIMENSION_STATUS.CRITICAL_HIGH;
        if (value > 60) return DIMENSION_STATUS.ELEVATED;
        if (value < 5) return DIMENSION_STATUS.DEPLETED;
        return DIMENSION_STATUS.OPTIMAL;

      default:
        return DIMENSION_STATUS.OPTIMAL;
    }
  }

  cleanup() {
    this.stopTick();
  }
}

module.exports = {
  DigitalHomeostasis,
  DIMENSION_STATUS,
  ANOMALY_TYPE,
  CORRECTIVE_ACTION,
  RETRY_STRATEGY
};
