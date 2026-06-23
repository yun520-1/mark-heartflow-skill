/**
 * Rollback Manager v2.0.0 — 回滚与熔断机制
 * 
 * 功能升级（v1.0.0 → v2.0.0）：
 * - 状态枚举：IDLE / MONITORING / DECLINING / ROLLING_BACK / COOLDOWN / CIRCUIT_OPEN
 * - 震荡检测：追踪版本震荡循环，检测重复回滚到同一版本
 * - 异常检测：噪声容忍下降检测（±1波动不触发）
 * - 实际文件恢复：快照备份 + 真实文件恢复
 * - 冷却期升级：连续回滚后冷却期翻倍
 * - 智能版本定位：找最后一个稳定版本，而非仅上一个版本
 * - 错误分类枚举：VALIDATION / DECLINE / CIRCUIT / OSCILLATION / COOLDOWN / IO_ERROR
 * - 严重度分级：NORMAL / WARNING / CRITICAL
 * - 熔断器：N次回滚后完全停止
 * - 健康指标：成功率/失败率/总回滚次数/最后事件
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 枚举定义
// ============================================================================

/** 回滚管理器状态 */
const RollbackState = Object.freeze({
  IDLE: 'idle',
  MONITORING: 'monitoring',
  DECLINING: 'declining',
  ROLLING_BACK: 'rolling_back',
  COOLDOWN: 'cooldown',
  CIRCUIT_OPEN: 'circuit_open'
});

/** 回滚失败原因分类 */
const RollbackError = Object.freeze({
  VALIDATION: 'validation_error',
  DECLINE: 'performance_decline',
  CIRCUIT: 'circuit_breaker_open',
  OSCILLATION: 'oscillation_detected',
  COOLDOWN: 'in_cooldown',
  IO_ERROR: 'file_io_error',
  NO_VERSION: 'no_previous_version',
  INSUFFICIENT_DATA: 'insufficient_data'
});

/** 性能指标严重度 */
const MetricSeverity = Object.freeze({
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

/** 熔断器状态 */
const CircuitState = Object.freeze({
  CLOSED: 'closed',       // 正常，允许回滚
  HALF_OPEN: 'half_open', // 试探性恢复
  OPEN: 'open'            // 禁止回滚
});

// ============================================================================
// 有效状态转换映射
// ============================================================================

const VALID_TRANSITIONS = Object.freeze({
  [RollbackState.IDLE]: [RollbackState.MONITORING],
  [RollbackState.MONITORING]: [RollbackState.DECLINING, RollbackState.IDLE],
  [RollbackState.DECLINING]: [RollbackState.ROLLING_BACK, RollbackState.MONITORING, RollbackState.IDLE],
  [RollbackState.ROLLING_BACK]: [RollbackState.COOLDOWN, RollbackState.IDLE],
  [RollbackState.COOLDOWN]: [RollbackState.MONITORING, RollbackState.CIRCUIT_OPEN],
  [RollbackState.CIRCUIT_OPEN]: [RollbackState.IDLE]
});

// ============================================================================
// RollbackManager 类
// ============================================================================

class RollbackManager {
  constructor(projectRoot, options = {}) {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[RollbackManager] Invalid projectRoot');
    }

    this.projectRoot = projectRoot;
    this.state = RollbackState.IDLE;
    this.circuitState = CircuitState.CLOSED;

    // 路径（带安全性校验）
    this._ensureDir(path.join(projectRoot, 'internal', 'data'));
    this._ensureDir(path.join(projectRoot, 'logs'));
    this._ensureDir(path.join(projectRoot, 'internal', 'snapshots'));

    this.versionFile = path.join(projectRoot, 'internal', 'data', 'evolution-versions.json');
    this.performanceFile = path.join(projectRoot, 'internal', 'data', 'performance-metrics.json');
    this.logFile = path.join(projectRoot, 'logs', 'rollback-manager.log');
    this.snapshotDir = path.join(projectRoot, 'internal', 'snapshots');

    // 状态计数器
    this.consecutiveDeclines = 0;
    this.consecutiveRollbacks = 0;
    this.totalRollbacks = 0;
    this.successfulRollbacks = 0;
    this.failedRollbacks = 0;
    this.lastStableVersion = null;
    this.cooldownUntil = null;
    this.oscillationCount = 0;
    this._versionOscillationTracker = [];  // [{ version, ts }]

    // 配置（可覆盖）
    this.maxDeclines = options.maxDeclines ?? 3;
    this.maxConsecutiveRollbacks = options.maxConsecutiveRollbacks ?? 3;
    this.initialCooldownMs = options.initialCooldownMs ?? 24 * 60 * 60 * 1000; // 默认24h
    this.maxCooldownMs = options.maxCooldownMs ?? 7 * 24 * 60 * 60 * 1000;     // 最大7天
    this.scoreThreshold = options.scoreThreshold ?? 5.0;
    this.oscillationWindow = options.oscillationWindow ?? 5;  // 检测最后N次回滚中的震荡
    this.circuitResetMs = options.circuitResetMs ?? 3 * 24 * 60 * 60 * 1000; // 3天后尝试半开
    this.noiseTolerance = options.noiseTolerance ?? 0.5;  // ±0.5分波动不触发下降

    this._loadMetrics();
    this._transitionTo(RollbackState.MONITORING);
  }

  /**
   * 安全创建目录
   */
  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 安全读取路径（防止路径遍历）
   */
  _safePath(basePath, userPath) {
    const resolved = path.resolve(basePath, userPath);
    if (!resolved.startsWith(path.resolve(basePath))) {
      throw new Error(`[RollbackManager] 路径遍历攻击检测: ${userPath}`);
    }
    return resolved;
  }

  // ========================================================================
  // 状态机
  // ========================================================================

  /**
   * 状态转换守卫
   * @param {string} newState - 目标状态
   * @returns {boolean} 转换是否成功
   */
  _transitionTo(newState) {
    const from = this.state;
    const validTargets = VALID_TRANSITIONS[from] || [];
    if (!validTargets.includes(newState)) {
      this._log(`状态转换拒绝: ${from} → ${newState}（不合法）`, 'WARN');
      return false;
    }
    this.state = newState;
    this._log(`状态转换: ${from} → ${newState}`, 'INFO');
    return true;
  }

  // ========================================================================
  // 指标加载/保存
  // ========================================================================

  _loadMetrics() {
    try {
      if (fs.existsSync(this.performanceFile)) {
        const raw = fs.readFileSync(this.performanceFile, 'utf8');
        this.metrics = JSON.parse(raw);
      } else {
        this.metrics = { history: [], currentScore: 7.0 };
      }
    } catch (e) {
      this.metrics = { history: [], currentScore: 7.0 };
    }
  }

  _saveMetrics() {
    try {
      fs.writeFileSync(this.performanceFile, JSON.stringify(this.metrics, null, 2));
    } catch (e) {
      this._log(`保存指标失败: ${e.message}`, 'ERROR');
    }
  }

  _log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${level}] [${this.state}] ${message}\n`;
    try {
      fs.appendFileSync(this.logFile, entry);
    } catch (e) {
      // 日志写入失败时静默处理
    }
    console.log(`[Rollback] ${message}`);
  }

  // ========================================================================
  // 性能指标记录与分析
  // ========================================================================

  /**
   * 记录性能指标
   * @param {string} type - 指标类型
   * @param {number} score - 评分 (0-10)
   */
  recordMetric(type, score) {
    const sanitizedScore = Math.max(0, Math.min(10, Number(score) || 0));
    const metric = {
      type,
      score: sanitizedScore,
      timestamp: new Date().toISOString()
    };

    this.metrics.history.push(metric);
    this.metrics.currentScore = sanitizedScore;
    this._saveMetrics();
    this._log(`Recorded metric: ${type} = ${sanitizedScore}`);
  }

  /**
   * 分类指标严重度
   * @param {number} score - 评分
   * @returns {string} MetricSeverity
   */
  _classifySeverity(score) {
    if (score >= 7) return MetricSeverity.NORMAL;
    if (score >= 4) return MetricSeverity.WARNING;
    return MetricSeverity.CRITICAL;
  }

  /**
   * 噪声容忍下降检测
   * 允许小幅度波动（±noiseTolerance），只有持续净下降才触发
   * @param {number[]} scores - 最近N个评分
   * @returns {{ isDeclining: boolean, netDrop: number, severity: string }}
   */
  _detectDeclineWithNoiseTolerance(scores) {
    if (scores.length < 3) {
      return { isDeclining: false, netDrop: 0, severity: MetricSeverity.NORMAL };
    }

    // 用线性回归趋势检测方向，而非简单的逐点比较
    const n = scores.length;
    const indices = scores.map((_, i) => i);
    const meanX = (n - 1) / 2;
    const meanY = scores.reduce((a, b) => a + b, 0) / n;

    // 斜率 = Σ((x-meanX)*(y-meanY)) / Σ((x-meanX)²)
    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      const dx = i - meanX;
      const dy = scores[i] - meanY;
      numerator += dx * dy;
      denominator += dx * dx;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const netDrop = scores[0] - scores[n - 1];
    const isDeclining = slope < 0 && netDrop > this.noiseTolerance;

    let severity = MetricSeverity.NORMAL;
    if (isDeclining) {
      severity = netDrop > 3 ? MetricSeverity.CRITICAL : MetricSeverity.WARNING;
    }

    return { isDeclining, netDrop, severity, slope: Math.round(slope * 100) / 100 };
  }

  // ========================================================================
  // 震荡检测
  // ========================================================================

  /**
   * 检测版本震荡循环
   * 当同一版本被回滚到又升级回多次时，触发震荡检测
   * @returns {{ isOscillating: boolean, cycleCount: number, reason: string|null }}
   */
  _detectOscillation() {
    const recent = this._versionOscillationTracker.slice(-this.oscillationWindow);
    if (recent.length < 4) {
      return { isOscillating: false, cycleCount: 0, reason: null };
    }

    // 检测 A → B → A → B 模式（版本震荡）
    let cycles = 0;
    for (let i = 2; i < recent.length; i++) {
      if (recent[i].version === recent[i - 2].version &&
          recent[i - 1].version !== recent[i].version) {
        cycles++;
      }
    }

    if (cycles >= 2) {
      this.oscillationCount++;
      return {
        isOscillating: true,
        cycleCount: cycles,
        reason: `检测到版本震荡循环: ${recent[recent.length - 3].version} ↔ ${recent[recent.length - 2].version}`
      };
    }

    return { isOscillating: false, cycleCount: 0, reason: null };
  }

  /**
   * 记录版本震荡轨迹
   */
  _recordOscillationEvent(version) {
    this._versionOscillationTracker.push({
      version,
      ts: Date.now()
    });
    // 限制追踪长度
    if (this._versionOscillationTracker.length > 20) {
      this._versionOscillationTracker = this._versionOscillationTracker.slice(-20);
    }
  }

  // ========================================================================
  // 回滚检查
  // ========================================================================

  /**
   * 检查是否需要回滚
   * @returns {{ needed: boolean, reason: string, scores?: number[], severity?: string }}
   */
  checkRollbackNeeded() {
    // 熔断器检查
    if (this.circuitState === CircuitState.OPEN) {
      return { needed: false, reason: RollbackError.CIRCUIT };
    }

    const history = this.metrics.history || [];
    if (history.length < this.maxDeclines) {
      return { needed: false, reason: RollbackError.INSUFFICIENT_DATA };
    }

    const recent = history.slice(-this.maxDeclines);
    const scores = recent.map(m => m.score);
    const lastScore = scores[scores.length - 1];

    // 噪声容忍下降检测
    const declineResult = this._detectDeclineWithNoiseTolerance(scores);

    if (declineResult.isDeclining && lastScore < this.scoreThreshold) {
      this.consecutiveDeclines++;

      this._log(
        `下降检测! 连续: ${this.consecutiveDeclines}, ` +
        `净降幅: ${declineResult.netDrop.toFixed(1)}, ` +
        `斜率: ${declineResult.slope}, ` +
        `严重度: ${declineResult.severity}`
      );

      if (this.consecutiveDeclines >= this.maxDeclines) {
        // 尝试转换到 DECLINING 状态
        this._transitionTo(RollbackState.DECLINING);
        return {
          needed: true,
          reason: RollbackError.DECLINE,
          scores: scores,
          severity: declineResult.severity,
          netDrop: declineResult.netDrop,
          slope: declineResult.slope
        };
      }
    } else {
      // 未检测到下降 → 恢复计数
      if (this.consecutiveDeclines > 0) {
        this.consecutiveDeclines = Math.max(0, this.consecutiveDeclines - 1);
      }
      // 如果分数恢复且状态为 DECLINING，切回 MONITORING
      if (this.state === RollbackState.DECLINING && !declineResult.isDeclining) {
        this._transitionTo(RollbackState.MONITORING);
      }
    }

    return { needed: false, reason: 'stable' };
  }

  // ========================================================================
  // 快照管理
  // ========================================================================

  /**
   * 创建文件快照
   * @param {string} filePath - 要备份的文件路径
   * @param {string} version - 版本标识
   * @returns {{ success: boolean, snapshotPath: string|null, error: string|null }}
   */
  createSnapshot(filePath, version) {
    try {
      const safePath = this._safePath(this.projectRoot, path.relative(this.projectRoot, filePath));
      if (!fs.existsSync(safePath)) {
        return { success: false, snapshotPath: null, error: '文件不存在' };
      }

      const content = fs.readFileSync(safePath, 'utf8');
      const snapshotName = `${version}_${path.basename(filePath)}.snap`;
      const snapshotPath = path.join(this.snapshotDir, snapshotName);

      fs.writeFileSync(snapshotPath, content, 'utf8');
      this._log(`快照创建: ${snapshotPath} (${content.length} bytes)`);
      return { success: true, snapshotPath, error: null };
    } catch (e) {
      this._log(`快照创建失败: ${e.message}`, 'ERROR');
      return { success: false, snapshotPath: null, error: e.message };
    }
  }

  /**
   * 从快照恢复文件
   * @param {string} snapshotName - 快照文件名
   * @param {string} targetPath - 目标文件路径
   * @returns {{ success: boolean, error: string|null }}
   */
  restoreFromSnapshot(snapshotName, targetPath) {
    try {
      const safeSnapshot = this._safePath(this.snapshotDir, path.basename(snapshotName));
      if (!fs.existsSync(safeSnapshot)) {
        return { success: false, error: `快照不存在: ${snapshotName}` };
      }

      const safeTarget = this._safePath(this.projectRoot, path.relative(this.projectRoot, targetPath));
      const content = fs.readFileSync(safeSnapshot, 'utf8');
      fs.writeFileSync(safeTarget, content, 'utf8');

      this._log(`文件恢复: ${targetPath} ← ${snapshotName} (${content.length} bytes)`);
      return { success: true, error: null };
    } catch (e) {
      this._log(`文件恢复失败: ${e.message}`, 'ERROR');
      return { success: false, error: e.message };
    }
  }

  // ========================================================================
  // 智能版本定位
  // ========================================================================

  /**
   * 寻找最后一个稳定版本
   * 遍历版本历史，找到最后一个评分 >= threshold 的版本
   * @returns {{ version: object|null, index: number }}
   */
  _findLastStableVersion() {
    const versions = this._loadVersions();
    if (versions.length < 2) {
      return { version: null, index: -1 };
    }

    // 从后往前找，找到最后一个评分的版本
    const history = this.metrics.history || [];
    for (let i = versions.length - 2; i >= 0; i--) {
      const ver = versions[i];
      // 查找该版本记录时的评分
      const scoreRecord = history.find(h => {
        const hTime = new Date(h.timestamp).getTime();
        const vTime = new Date(ver.timestamp || ver.ts || 0).getTime();
        return Math.abs(hTime - vTime) < 60000; // 1分钟内
      });
      if (scoreRecord && scoreRecord.score >= this.scoreThreshold) {
        return { version: ver, index: i };
      }
    }

    // 回退到上一个版本
    return { version: versions[versions.length - 2], index: versions.length - 2 };
  }

  // ========================================================================
  // 执行回滚
  // ========================================================================

  /**
   * 执行回滚
   * @returns {Promise<{ success: boolean, reason?: string, rolledBack?: object, cooldownHours?: number, error?: string }>}
   */
  async performRollback() {
    // 熔断器检查
    if (this.circuitState === CircuitState.OPEN) {
      this.failedRollbacks++;
      return { success: false, reason: RollbackError.CIRCUIT };
    }

    // 冷却期检查
    if (this.isInCooldown()) {
      this.failedRollbacks++;
      return { success: false, reason: RollbackError.COOLDOWN };
    }

    // 状态检查
    if (!this._transitionTo(RollbackState.ROLLING_BACK)) {
      this.failedRollbacks++;
      return { success: false, reason: `非法状态: ${this.state}` };
    }

    const versions = this._loadVersions();
    if (versions.length < 2) {
      this.failedRollbacks++;
      this._transitionTo(RollbackState.MONITORING);
      return { success: false, reason: RollbackError.NO_VERSION };
    }

    // 震荡检测
    const oscillation = this._detectOscillation();
    if (oscillation.isOscillating) {
      this._log(`震荡检测: ${oscillation.reason}`, 'WARN');
      this.failedRollbacks++;
      this._transitionTo(RollbackState.COOLDOWN);
      this._triggerCooldown(this.initialCooldownMs * 2); // 震荡加倍冷却
      return { success: false, reason: RollbackError.OSCILLATION, detail: oscillation.reason };
    }

    // 智能定位稳定版本
    const stable = this._findLastStableVersion();
    if (!stable.version) {
      this.failedRollbacks++;
      this._transitionTo(RollbackState.MONITORING);
      return { success: false, reason: RollbackError.NO_VERSION };
    }

    const previousVersion = stable.version;
    const currentVersion = versions[versions.length - 1];

    this._log(`回滚: ${currentVersion.id || 'unknown'} → ${previousVersion.id || 'unknown'}`);

    // 创建当前版本快照
    if (previousVersion.target) {
      const targetPath = path.join(this.projectRoot, previousVersion.target);
      const snapshotResult = this.createSnapshot(targetPath, currentVersion.id || 'pre_rollback');
      if (snapshotResult.success) {
        this._log(`回滚前快照已保存: ${snapshotResult.snapshotPath}`);
      }
    }

    // 尝试从快照恢复文件
    let fileRestored = false;
    if (previousVersion.target) {
      const targetPath = path.join(this.projectRoot, previousVersion.target);
      const snapshotName = `${previousVersion.id}_${path.basename(previousVersion.target)}.snap`;
      const restoreResult = this.restoreFromSnapshot(snapshotName, targetPath);
      fileRestored = restoreResult.success;

      if (!restoreResult.success) {
        this._log(`快照恢复失败，尝试替代路径: ${restoreResult.error}`, 'WARN');
        // 尝试从备份目录恢复
        const altSnapshotPattern = `${path.basename(previousVersion.target)}.snap`;
        const altSnapshotPath = path.join(this.snapshotDir, altSnapshotPattern);
        if (fs.existsSync(altSnapshotPath)) {
          const altRestore = this.restoreFromSnapshot(altSnapshotPattern, targetPath);
          fileRestored = altRestore.success;
        }
      }
    }

    // 更新轨迹
    this._recordOscillationEvent(currentVersion.id || 'unknown');
    this._recordOscillationEvent(previousVersion.id || 'unknown');

    // 计算冷却期（连续回滚时翻倍）
    this.consecutiveRollbacks++;
    const cooldownMs = Math.min(
      this.initialCooldownMs * Math.pow(2, this.consecutiveRollbacks - 1),
      this.maxCooldownMs
    );

    this._transitionTo(RollbackState.COOLDOWN);
    this._triggerCooldown(cooldownMs);

    // 检查是否需要打开熔断器
    if (this.consecutiveRollbacks >= this.maxConsecutiveRollbacks) {
      this._log(
        `连续回滚达到 ${this.consecutiveRollbacks}/${this.maxConsecutiveRollbacks}，` +
        `激活熔断器（${this.circuitResetMs / (60 * 60 * 1000)}小时半开）`,
        'WARN'
      );
      this.circuitState = CircuitState.OPEN;
      this._circuitOpenAt = Date.now();
    }

    // 记录回滚事件
    const rollbackEvent = {
      timestamp: new Date().toISOString(),
      from: currentVersion.id || 'unknown',
      to: previousVersion.id || 'unknown',
      reason: RollbackError.DECLINE,
      fileRestored,
      cooldownHours: cooldownMs / (60 * 60 * 1000),
      stateAfter: this.state,
      circuitState: this.circuitState
    };

    this._recordRollback(rollbackEvent);
    this.totalRollbacks++;
    if (fileRestored) {
      this.successfulRollbacks++;
    } else {
      this.failedRollbacks++;
    }

    return {
      success: true,
      rolledBack: previousVersion,
      fileRestored,
      cooldownHours: cooldownMs / (60 * 60 * 1000),
      oscillationDetected: oscillation.isOscillating,
      circuitState: this.circuitState
    };
  }

  // ========================================================================
  // 冷却期管理
  // ========================================================================

  /**
   * 触发冷却期
   * @param {number} durationMs - 冷却时长（毫秒）
   */
  _triggerCooldown(durationMs) {
    this.cooldownUntil = new Date(Date.now() + durationMs);
    this._log(
      `冷却触发: ${durationMs / (60 * 60 * 1000).toFixed(1)}小时 ` +
      `(连续回滚 #${this.consecutiveRollbacks})`
    );
  }

  /**
   * 检查是否在冷却期
   * @returns {boolean}
   */
  isInCooldown() {
    if (!this.cooldownUntil) return false;
    const now = new Date();
    const isIn = now < this.cooldownUntil;
    if (!isIn) {
      this.cooldownUntil = null;
      // 冷却结束，尝试熔断器半开
      if (this.circuitState === CircuitState.OPEN) {
        const elapsed = now.getTime() - (this._circuitOpenAt || 0);
        if (elapsed >= this.circuitResetMs) {
          this.circuitState = CircuitState.HALF_OPEN;
          this._log('熔断器半开，允许试探性回滚', 'INFO');
        }
      }
      // 冷却结束但熔断器半开时，允许恢复监控
      if (this.circuitState !== CircuitState.OPEN) {
        if (this.state === RollbackState.COOLDOWN) {
          this._transitionTo(RollbackState.MONITORING);
        }
      }
      this._log('冷却期结束', 'INFO');
    }
    return isIn;
  }

  // ========================================================================
  // 熔断器管理
  // ========================================================================

  /**
   * 重置熔断器
   */
  resetCircuitBreaker() {
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveRollbacks = 0;
    this.oscillationCount = 0;
    this._circuitOpenAt = null;
    this._log('熔断器重置为 CLOSED', 'INFO');
  }

  /**
   * 尝试半开熔断器（试探性允许一次回滚）
   * @returns {boolean} 是否允许
   */
  tryHalfOpen() {
    if (this.circuitState !== CircuitState.HALF_OPEN) return false;
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveRollbacks = Math.max(0, this.consecutiveRollbacks - 1);
    this._log('熔断器半开成功，转为 CLOSED', 'INFO');
    return true;
  }

  // ========================================================================
  // 版本/回滚历史
  // ========================================================================

  _loadVersions() {
    try {
      if (fs.existsSync(this.versionFile)) {
        return JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  _recordRollback(event) {
    const rollbackFile = path.join(this.projectRoot, 'internal', 'data', 'rollback-history.json');
    let history = [];

    try {
      if (fs.existsSync(rollbackFile)) {
        history = JSON.parse(fs.readFileSync(rollbackFile, 'utf8'));
      }
    } catch (e) {
      history = [];
    }

    history.push(event);
    try {
      fs.writeFileSync(rollbackFile, JSON.stringify(history, null, 2));
    } catch (e) {
      this._log(`写入回滚历史失败: ${e.message}`, 'ERROR');
    }
  }

  // ========================================================================
  // 状态查询
  // ========================================================================

  /**
   * 获取完整状态
   * @returns {object}
   */
  getStatus() {
    return {
      state: this.state,
      circuitState: this.circuitState,
      consecutiveDeclines: this.consecutiveDeclines,
      maxDeclines: this.maxDeclines,
      consecutiveRollbacks: this.consecutiveRollbacks,
      totalRollbacks: this.totalRollbacks,
      successfulRollbacks: this.successfulRollbacks,
      failedRollbacks: this.failedRollbacks,
      oscillationCount: this.oscillationCount,
      currentScore: this.metrics.currentScore,
      inCooldown: this.isInCooldown(),
      cooldownUntil: this.cooldownUntil ? this.cooldownUntil.toISOString() : null,
      lastStableVersion: this.lastStableVersion,
      stateHistory: this._stateHistory ? this._stateHistory.slice(-10) : []
    };
  }

  /**
   * 获取健康指标
   * @returns {{ pipeline: string, state: string, circuit: string, score: number, rollbacks: object }}
   */
  healthCheck() {
    const total = this.successfulRollbacks + this.failedRollbacks;
    const successRate = total > 0 ? (this.successfulRollbacks / total * 100).toFixed(1) : 'N/A';
    return {
      pipeline: this.state !== RollbackState.CIRCUIT_OPEN ? 'healthy' : 'blocked',
      state: this.state,
      circuit: this.circuitState,
      currentScore: this.metrics.currentScore,
      rollbacks: {
        total: this.totalRollbacks,
        successful: this.successfulRollbacks,
        failed: this.failedRollbacks,
        successRate: successRate,
        consecutive: this.consecutiveRollbacks
      }
    };
  }

  /**
   * 获取所有指标摘要
   * @returns {object}
   */
  getMetrics() {
    const history = this.metrics.history || [];
    const scores = history.map(m => m.score);
    const avgScore = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 'N/A';
    const minScore = scores.length > 0 ? Math.min(...scores) : 'N/A';
    const maxScore = scores.length > 0 ? Math.max(...scores) : 'N/A';

    return {
      totalRecords: history.length,
      currentScore: this.metrics.currentScore,
      averageScore: avgScore,
      minScore,
      maxScore,
      severity: this._classifySeverity(this.metrics.currentScore),
      recentScores: scores.slice(-10)
    };
  }

  /**
   * 重置连续下降计数
   */
  resetDeclineCount() {
    this.consecutiveDeclines = 0;
    const versions = this._loadVersions();
    if (versions.length > 0) {
      this.lastStableVersion = versions[versions.length - 1];
    }
    this._log('下降计数已重置', 'INFO');
    if (this.state === RollbackState.DECLINING || this.state === RollbackState.ROLLING_BACK) {
      this._transitionTo(RollbackState.MONITORING);
    }
  }

  /**
   * 清理快照目录中的旧快照
   * @param {number} keepCount - 保留的快照数量
   */
  pruneSnapshots(keepCount = 20) {
    try {
      const files = fs.readdirSync(this.snapshotDir)
        .filter(f => f.endsWith('.snap'))
        .map(f => ({
          name: f,
          path: path.join(this.snapshotDir, f),
          mtime: fs.statSync(path.join(this.snapshotDir, f)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime); // 最新在前

      if (files.length <= keepCount) return;

      const toDelete = files.slice(keepCount);
      for (const f of toDelete) {
        fs.unlinkSync(f.path);
      }
      this._log(`快照清理: 删除了 ${toDelete.length} 个旧快照 (保留 ${keepCount})`, 'INFO');
    } catch (e) {
      this._log(`快照清理失败: ${e.message}`, 'WARN');
    }
  }

  /**
   * 销毁
   */
  destroy() {
    this.state = RollbackState.IDLE;
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveDeclines = 0;
    this.consecutiveRollbacks = 0;
    this._versionOscillationTracker = [];
    this.cooldownUntil = null;
    this._log('RollbackManager 已销毁', 'INFO');
  }
}

module.exports = {
  RollbackManager,
  RollbackState,
  RollbackError,
  MetricSeverity,
  CircuitState,
  VALID_TRANSITIONS
};
