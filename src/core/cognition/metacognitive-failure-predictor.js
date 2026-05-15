/**
 * Metacognitive Failure Predictor — 心虫元认知层
 * 
 * 实现论文核心思想: Agentic Metacognition (arXiv:2509.19783)
 * - 次级元认知层主动监控主执行循环
 * - 预测失败触发器: 超时/重复/资源耗尽/置信度骤降
 * - 主动人类交接 (proactive handoff)，而非被动失败
 * - 交接时提供"思考过程"解释
 * 
 * 核心原则:
 * - 元认知层独立于主循环运行
 * - 失败预测是前瞻性的，不是被动的
 * - 交接时必须解释为什么无法继续
 */

'use strict';

const fs = require('fs');
const path = require('path');

class MetacognitiveFailurePredictor {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    
    // 元认知状态
    this.state = {
      monitoring: false,
      primaryCycleCount: 0,
      lastHandoff: null,
      consecutiveRepeats: 0,
      latencyHistory: [],
      confidenceHistory: [],
      errorHistory: [],
      activeFailures: []
    };

    // 失败预测触发器配置
    this.triggers = {
      // 超时: 单步超过此时间(ms)视为异常
      excessiveLatency: options.excessiveLatency || 30000,
      
      // 重复: 连续N次相似动作视为循环陷阱
      repetitiveActions: {
        threshold: options.repetitiveThreshold || 5,
        similarityWindow: options.similarityWindow || 3
      },
      
      // 置信度骤降: 单次下降超过此幅度
      confidenceDrop: options.confidenceDropThreshold || 0.4,
      
      // 资源: 连续错误超过此数
      consecutiveErrors: options.consecutiveErrorsThreshold || 3,
      
      // 进展: N个循环无实质进展
      noProgress: {
        threshold: options.noProgressThreshold || 8,
        windowSize: options.noProgressWindow || 10
      }
    };

    // 交接缓冲区
    this.handoffBuffer = {
      cycleHistory: [],
      failureContext: null,
      thoughtProcess: []
    };

    // 注册的触发器回调
    this.triggerCallbacks = [];

    // 失败等级
    this.failureLevels = ['nominal', 'warning', 'elevated', 'critical', 'handoff'];

    console.log('[MetacognitiveFailurePredictor] 元认知失败预测器初始化');
  }

  /**
   * 开始监控主循环
   */
  startMonitoring() {
    this.state.monitoring = true;
    console.log('[MetacognitiveFailurePredictor] 开始监控主执行循环');
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    this.state.monitoring = false;
    console.log('[MetacognitiveFailurePredictor] 停止监控');
  }

  /**
   * 注册触发器回调 (失败预测触发时调用)
   */
  onTrigger(callback) {
    this.triggerCallbacks.push(callback);
  }

  /**
   * 主循环每次执行后调用此方法 — 元认知层采样
   * @param {object} cycleResult — 主循环当前执行结果
   */
  samplePrimaryCycle(cycleResult) {
    if (!this.state.monitoring) return;

    const now = Date.now();
    this.state.primaryCycleCount++;

    const sample = {
      cycleId: this.state.primaryCycleCount,
      timestamp: now,
      latency: cycleResult.latency || 0,
      confidence: cycleResult.confidence ?? 1.0,
      action: cycleResult.action || '',
      result: cycleResult.result || '',
      success: cycleResult.success !== false,
      error: cycleResult.error || null
    };

    // 记录历史
    this.state.latencyHistory.push(sample.latency);
    this.state.confidenceHistory.push(sample.confidence);
    if (sample.error) {
      this.state.errorHistory.push({ cycleId: sample.cycleId, error: sample.error, timestamp: now });
    }

    // 保持窗口大小
    const MAX_HISTORY = 50;
    if (this.state.latencyHistory.length > MAX_HISTORY) {
      this.state.latencyHistory.shift();
      this.state.confidenceHistory.shift();
    }

    // 添加到交接缓冲
    this.handoffBuffer.cycleHistory.push(sample);
    if (this.handoffBuffer.cycleHistory.length > 30) {
      this.handoffBuffer.cycleHistory.shift();
    }

    // 元认知分析 — 检查所有触发器
    this._analyzeTriggers(sample);

    return sample;
  }

  /**
   * 元认知分析 — 检查所有失败预测触发器
   */
  _analyzeTriggers(sample) {
    const predictions = [];
    const now = Date.now();

    // 1. 超时检测
    if (sample.latency > this.triggers.excessiveLatency) {
      predictions.push({
        trigger: 'excessiveLatency',
        level: 'warning',
        value: sample.latency,
        threshold: this.triggers.excessiveLatency,
        message: `步骤延迟 ${Math.round(sample.latency / 1000)}s 超过阈值 ${this.triggers.excessiveLatency / 1000}s`,
        cycleId: sample.cycleId
      });
    }

    // 2. 重复动作检测
    const recent = this.handoffBuffer.cycleHistory.slice(-this.triggers.repetitiveActions.similarityWindow);
    if (recent.length >= this.triggers.repetitiveActions.similarityWindow) {
      const actions = recent.map(s => s.action);
      const lastAction = actions[actions.length - 1];
      const repeatCount = actions.filter(a => a === lastAction).length;
      if (repeatCount >= this.triggers.repetitiveActions.threshold) {
        this.state.consecutiveRepeats = repeatCount;
        predictions.push({
          trigger: 'repetitiveActions',
          level: repeatCount >= this.triggers.repetitiveActions.threshold + 2 ? 'critical' : 'warning',
          value: repeatCount,
          threshold: this.triggers.repetitiveActions.threshold,
          message: `检测到 ${repeatCount} 次重复动作 "${lastAction}"，可能陷入循环`,
          cycleId: sample.cycleId
        });
      }
    }

    // 3. 置信度骤降
    if (this.state.confidenceHistory.length >= 2) {
      const prev = this.state.confidenceHistory[this.state.confidenceHistory.length - 2];
      const drop = prev - sample.confidence;
      if (drop > this.triggers.confidenceDrop) {
        predictions.push({
          trigger: 'confidenceDrop',
          level: drop > this.triggers.confidenceDrop * 2 ? 'critical' : 'warning',
          value: drop,
          threshold: this.triggers.confidenceDrop,
          message: `置信度骤降 ${(drop * 100).toFixed(0)}% (${(prev * 100).toFixed(0)}% → ${(sample.confidence * 100).toFixed(0)}%)`,
          cycleId: sample.cycleId
        });
      }
    }

    // 4. 连续错误
    const recentErrors = this.state.errorHistory.slice(-this.triggers.consecutiveErrorsThreshold);
    if (recentErrors.length >= this.triggers.consecutiveErrorsThreshold) {
      predictions.push({
        trigger: 'consecutiveErrors',
        level: recentErrors.length >= this.triggers.consecutiveErrorsThreshold + 1 ? 'critical' : 'elevated',
        value: recentErrors.length,
        threshold: this.triggers.consecutiveErrorsThreshold,
        message: `连续 ${recentErrors.length} 次错误: ${recentErrors[recentErrors.length - 1].error}`,
        cycleId: sample.cycleId
      });
    }

    // 5. 无实质进展检测
    const recentSamples = this.handoffBuffer.cycleHistory.slice(-this.triggers.noProgress.windowSize);
    const successfulCycles = recentSamples.filter(s => s.success).length;
    const progressRatio = successfulCycles / recentSamples.length;
    if (recentSamples.length >= this.triggers.noProgress.threshold && progressRatio < 0.3) {
      predictions.push({
        trigger: 'noProgress',
        level: progressRatio < 0.1 ? 'critical' : 'elevated',
        value: progressRatio,
        threshold: 0.3,
        message: `${this.triggers.noProgress.threshold} 个循环内成功率仅 ${(progressRatio * 100).toFixed(0)}%，无实质进展`,
        cycleId: sample.cycleId
      });
    }

    // 如果有预测，触发回调
    if (predictions.length > 0) {
      const maxLevel = this._getMaxFailureLevel(predictions);
      
      // 记录到活跃失败列表
      predictions.forEach(p => {
        if (!this.state.activeFailures.find(f => f.trigger === p.trigger)) {
          this.state.activeFailures.push({ ...p, detectedAt: now });
        }
      });

      // 达到 critical 或 handoff 等级 → 准备交接
      if (maxLevel === 'critical' || maxLevel === 'handoff') {
        this._prepareHandoff(predictions);
      }

      // 调用所有回调
      const event = {
        predictions,
        maxLevel,
        activeFailures: [...this.state.activeFailures],
        cycleId: sample.cycleId
      };
      this.triggerCallbacks.forEach(cb => {
        try { cb(event); } catch (e) { /* silent */ }
      });

      return event;
    }

    // 正常周期 → 清理已缓解的失败
    this._clearResolvedFailures(sample);
    return null;
  }

  /**
   * 准备人类交接
   */
  _prepareHandoff(predictions) {
    const now = Date.now();
    const recentCycles = this.handoffBuffer.cycleHistory.slice(-15);

    // 构建思考过程解释
    const thoughtProcess = this._buildThoughtProcess(recentCycles, predictions);

    this.handoffBuffer.failureContext = {
      predictions,
      detectedAt: now,
      thoughtProcess,
      cycleCount: this.state.primaryCycleCount,
      recentActions: recentCycles.map(c => ({ cycle: c.cycleId, action: c.action, success: c.success }))
    };

    this.state.lastHandoff = {
      at: now,
      predictions: predictions.map(p => p.trigger),
      level: this._getMaxFailureLevel(predictions)
    };

    return this.handoffBuffer.failureContext;
  }

  /**
   * 构建交接时的思考过程解释
   */
  _buildThoughtProcess(cycleHistory, predictions) {
    const lines = [];
    lines.push(`## 元认知层思考过程报告`);
    lines.push(`**监控循环数**: ${this.state.primaryCycleCount}`);
    lines.push(`**触发器检测**: ${predictions.map(p => p.trigger).join(', ')}`);
    lines.push('');

    lines.push(`### 近期执行轨迹`);
    cycleHistory.slice(-5).forEach(c => {
      const status = c.success ? '✓' : '✗';
      lines.push(`  ${status} 循环${c.cycleId}: "${c.action}" (${Math.round(c.latency / 1000)}s, 置信度${(c.confidence * 100).toFixed(0)}%)`);
    });

    lines.push('');
    lines.push(`### 失败分析`);
    predictions.forEach(p => {
      lines.push(`- **${p.trigger}**: ${p.message}`);
    });

    lines.push('');
    lines.push(`### 为什么无法继续`);
    const topPrediction = predictions.reduce((a, b) => 
      this.failureLevels.indexOf(a.level) > this.failureLevels.indexOf(b.level) ? a : b
    );
    
    if (topPrediction.trigger === 'repetitiveActions') {
      lines.push(`系统检测到重复的动作模式，已无法通过当前策略产生有效进展。`);
      lines.push(`这表明可能存在以下情况:`);
      lines.push(`  1. 当前解决路径在局部最优解无法跳出`);
      lines.push(`  2. 问题约束条件发生了变化`);
      lines.push(`  3. 需要人工介入提供新的方向或约束`);
    } else if (topPrediction.trigger === 'excessiveLatency') {
      lines.push(`某步骤消耗异常长的执行时间，可能遇到了死循环、I/O阻塞或计算复杂度问题。`);
    } else if (topPrediction.trigger === 'consecutiveErrors') {
      lines.push(`连续多次执行错误，可能存在未捕获的异常或系统性问题。`);
    } else if (topPrediction.trigger === 'noProgress') {
      lines.push(`在多个执行周期内没有产生有效结果，继续运行可能浪费资源。`);
    } else {
      lines.push(`系统置信度已降至无法可靠继续的水平，建议人工审核当前执行状态。`);
    }

    lines.push('');
    lines.push(`### 建议交接行动`);
    lines.push(`1. 审核以上执行轨迹，判断是否需要调整执行策略`);
    lines.push(`2. 提供新的执行方向或约束条件`);
    lines.push(`3. 或选择终止当前任务`);

    return lines.join('\n');
  }

  /**
   * 获取交接报告 (用于人类交接)
   */
  getHandoffReport() {
    if (!this.handoffBuffer.failureContext) {
      return {
        ready: false,
        message: '无待处理失败，无需交接'
      };
    }

    return {
      ready: true,
      ...this.handoffBuffer.failureContext
    };
  }

  /**
   * 清除已缓解的失败
   */
  _clearResolvedFailures(currentSample) {
    this.state.activeFailures = this.state.activeFailures.filter(f => {
      // 超时问题：如果当前步骤正常，可能是临时波动
      if (f.trigger === 'excessiveLatency' && currentSample.latency < this.triggers.excessiveLatency * 0.5) {
        return false;
      }
      // 重复问题：如果当前动作不同，清除
      if (f.trigger === 'repetitiveActions') {
        const recent = this.handoffBuffer.cycleHistory.slice(-2);
        if (recent.length >= 2 && recent[0].action !== recent[1].action) return false;
      }
      return true;
    });
  }

  /**
   * 获取最大失败等级
   */
  _getMaxFailureLevel(predictions) {
    let max = 'nominal';
    for (const p of predictions) {
      if (this.failureLevels.indexOf(p.level) > this.failureLevels.indexOf(max)) {
        max = p.level;
      }
    }
    return max;
  }

  /**
   * 获取当前元认知状态
   */
  getMetacognitiveStatus() {
    return {
      monitoring: this.state.monitoring,
      primaryCycleCount: this.state.primaryCycleCount,
      activeFailures: this.state.activeFailures,
      lastHandoff: this.state.lastHandoff,
      avgLatency: this.state.latencyHistory.length > 0
        ? this.state.latencyHistory.reduce((a, b) => a + b, 0) / this.state.latencyHistory.length
        : 0,
      avgConfidence: this.state.confidenceHistory.length > 0
        ? this.state.confidenceHistory.reduce((a, b) => a + b, 0) / this.state.confidenceHistory.length
        : 1.0,
      consecutiveErrors: this.state.errorHistory.length > 0
        ? this.state.errorHistory.slice(-this.triggers.consecutiveErrorsThreshold).length
        : 0
    };
  }

  /**
   * 清除交接状态 (交接完成后调用)
   */
  clearHandoff() {
    this.handoffBuffer.failureContext = null;
    this.handoffBuffer.thoughtProcess = [];
    this.state.activeFailures = [];
    return { success: true };
  }

  /**
   * 手动触发一次失败预测检查 (用于测试)
   */
  simulateFailure(type = 'repetitiveActions') {
    const now = Date.now();
    const fakeCycles = [];
    
    for (let i = 0; i < 8; i++) {
      fakeCycles.push({
        cycleId: i + 1,
        timestamp: now - (8 - i) * 5000,
        latency: 1000,
        confidence: 0.95 - i * 0.05,
        action: type === 'repetitiveActions' ? 'search' : 'analyze',
        result: 'completed',
        success: i < 6
      });
    }

    fakeCycles.forEach(c => this.samplePrimaryCycle(c));
    return this.getHandoffReport();
  }
}

module.exports = { MetacognitiveFailurePredictor };
