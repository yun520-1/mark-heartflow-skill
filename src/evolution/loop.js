/**
 * EvolutionLoop - 自我进化循环引擎
 * 心虫自我进化核心模块
 * 
 * v1.1.0: 升级为独立进化调度引擎
 * - 进化指标追踪（周期、时间、改进量、收敛率）
 * - 自适应速率限制（基于周期频率的动态节流）
 * - 自诊断（系统健康度检查）
 * - 优先级调度（任务分类与调度策略）
 * - 周期持久化（独立于 core 的循环历史存储）
 */

const fs = require('fs');
const path = require('path');
const { SelfEvolutionCore } = require('../core/self-evolution/self-evolution-core.js');

class EvolutionLoop {
    constructor(hf = {}) {
        this.hf = hf;
        this.projectRoot = hf.rootPath || hf.projectRoot || process.cwd();
        this.core = null;
        this.cycleCount = 0;
        
        // ── 进化指标追踪 ──
        this.metrics = {
            totalCycles: 0,
            totalTime: 0,          // ms
            fastestCycle: Infinity,
            slowestCycle: 0,
            avgCycleTime: 0,
            improvements: 0,        // 有实际改进的周期数
            convergedCycles: 0,     // 收敛的周期数
            failedCycles: 0,        // 失败的周期数
            lastCycleTime: null,
            cycleTimestamps: [],     // 最近100个周期的时间戳
            improvementHistory: [],  // 每次改进量
            convergenceRate: 0,      // 收敛率
            healthScore: 100,        // 系统健康度 0-100
            errors: []
        };

        // ── 自适应速率限制 ──
        this.rateLimit = {
            enabled: true,
            minInterval: 1000,       // 最小间隔 1s
            maxCyclesPerMinute: 30,
            cooldownUntil: null,
            consecutiveFastCycles: 0
        };

        // ── 优先级队列 ──
        this.priorityQueue = [];
        this.priorityLevels = {
            critical: 0,    // 立即执行
            high: 1,        // 尽快执行
            normal: 2,      // 正常执行
            low: 3          // 空闲时执行
        };

        // ── 持久化路径 ──
        this.stateDir = path.join(this.projectRoot, 'internal', 'data', 'evolution');
        this.stateFile = path.join(this.stateDir, 'evolution-loop-state.json');

        this._loadState();
    }

    // ════════════════════════════════════════════════════════
    // 启动与初始化
    // ════════════════════════════════════════════════════════

    boot() {
        try {
            this.core = new SelfEvolutionCore(this.projectRoot);
            this._updateHealth('core_init', true);
        } catch (err) {
            this._recordError('boot_failed', err.message);
            this._updateHealth('core_init', false);
            console.error('[EvolutionLoop] Boot failed:', err.message);
        }
        return this;
    }

    // ════════════════════════════════════════════════════════
    // 核心进化方法
    // ════════════════════════════════════════════════════════

    /**
     * 执行一次进化循环（带速率限制、指标追踪、收敛检测）
     * @param {string} input - 输入
     * @param {object} context - 上下文
     * @param {object} options - 选项 { priority, maxIterations, convergenceThreshold }
     * @returns {object} 进化结果
     */
    async evolve(input, context = {}, options = {}) {
        const cycleStart = Date.now();
        this.cycleCount++;

        // ── 速率限制检查 ──
        if (!this._checkRateLimit()) {
            const waitTime = this.rateLimit.cooldownUntil - cycleStart;
            return {
                throttled: true,
                waitMs: waitTime,
                reason: 'rate_limited',
                message: `进化周期被节流，还需等待 ${Math.ceil(waitTime / 1000)}s`
            };
        }

        // ── 优先级排序 ──
        const priority = options.priority || 'normal';
        if (priority !== 'critical') {
            const queued = this._enqueue({ input, context, options, priority, timestamp: cycleStart });
            if (queued) {
                return {
                    queued: true,
                    queuePosition: this.priorityQueue.length,
                    priority,
                    message: `已加入${priority}优先级队列，位置 ${this.priorityQueue.length}`
                };
            }
        }

        // ── 执行进化 ──
        try {
            const result = await this._executeEvolve(input, context, options);
            
            // ── 更新指标 ──
            const cycleTime = Date.now() - cycleStart;
            this._updateMetrics(result, cycleTime);
            
            // ── 自适应调整速率限制 ──
            this._adaptRateLimit(cycleTime);
            
            // ── 持久化 ──
            this._saveState();
            
            return result;
        } catch (err) {
            this.metrics.failedCycles++;
            this._recordError('evolve_failed', err.message);
            this._updateHealth('evolve', false);
            this._saveState();
            
            return {
                error: true,
                message: err.message,
                cycles: this.cycleCount,
                insights: []
            };
        }
    }

    /**
     * 内部执行进化（无速率限制检查）
     */
    async _executeEvolve(input, context = {}, options = {}) {
        if (!this.core || typeof this.core.evolve !== 'function') {
            return { cycles: this.cycleCount, insights: [], error: 'core_not_initialized' };
        }
        return await this.core.evolve(input, context, options);
    }

    // ════════════════════════════════════════════════════════
    // 优先级队列管理
    // ════════════════════════════════════════════════════════

    _enqueue(task) {
        if (this.priorityQueue.length >= 50) {
            // 队列满，丢弃低优先级任务
            if (task.priority === 'low') return false;
            // 移除最低优先级
            const lowestIdx = this.priorityQueue
                .map((t, i) => ({ idx: i, prio: this.priorityLevels[t.priority] }))
                .sort((a, b) => b.prio - a.prio)[0];
            if (lowestIdx && this.priorityLevels[task.priority] < lowestIdx.prio) {
                this.priorityQueue.splice(lowestIdx.idx, 1);
            } else {
                return false;
            }
        }
        this.priorityQueue.push(task);
        this.priorityQueue.sort((a, b) => 
            this.priorityLevels[a.priority] - this.priorityLevels[b.priority]
        );
        return true;
    }

    /**
     * 处理优先级队列中的下一个任务
     * @returns {object|null} 处理结果或 null（队列为空）
     */
    async processQueue() {
        if (this.priorityQueue.length === 0) return null;
        const task = this.priorityQueue.shift();
        return await this.evolve(task.input, task.context, {
            ...task.options,
            priority: 'critical'  // 出队后直接执行
        });
    }

    getQueueStatus() {
        const counts = { critical: 0, high: 0, normal: 0, low: 0 };
        for (const t of this.priorityQueue) {
            counts[t.priority] = (counts[t.priority] || 0) + 1;
        }
        return {
            total: this.priorityQueue.length,
            counts,
            isEmpty: this.priorityQueue.length === 0
        };
    }

    // ════════════════════════════════════════════════════════
    // 速率限制
    // ════════════════════════════════════════════════════════

    _checkRateLimit() {
        if (!this.rateLimit.enabled) return true;
        
        // 检查冷却期
        if (this.rateLimit.cooldownUntil && Date.now() < this.rateLimit.cooldownUntil) {
            return false;
        }

        // 检查每分钟最大周期数
        const oneMinuteAgo = Date.now() - 60000;
        const recentCycles = this.metrics.cycleTimestamps.filter(t => t > oneMinuteAgo);
        if (recentCycles.length >= this.rateLimit.maxCyclesPerMinute) {
            this.rateLimit.cooldownUntil = Date.now() + 5000; // 5s 冷却
            return false;
        }

        return true;
    }

    _adaptRateLimit(cycleTime) {
        // 连续快速周期 → 收紧限制
        if (cycleTime < 100) {
            this.rateLimit.consecutiveFastCycles++;
            if (this.rateLimit.consecutiveFastCycles >= 5) {
                this.rateLimit.maxCyclesPerMinute = Math.max(10, 
                    this.rateLimit.maxCyclesPerMinute - 2
                );
                this.rateLimit.consecutiveFastCycles = 0;
            }
        } else {
            this.rateLimit.consecutiveFastCycles = Math.max(0, 
                this.rateLimit.consecutiveFastCycles - 1
            );
            // 恢复正常速率
            if (this.rateLimit.maxCyclesPerMinute < 30) {
                this.rateLimit.maxCyclesPerMinute = Math.min(30,
                    this.rateLimit.maxCyclesPerMinute + 1
                );
            }
        }
    }

    // ════════════════════════════════════════════════════════
    // 指标追踪
    // ════════════════════════════════════════════════════════

    _updateMetrics(result, cycleTime) {
        this.metrics.totalCycles++;
        this.metrics.totalTime += cycleTime;
        this.metrics.fastestCycle = Math.min(this.metrics.fastestCycle, cycleTime);
        this.metrics.slowestCycle = Math.max(this.metrics.slowestCycle, cycleTime);
        this.metrics.avgCycleTime = Math.round(this.metrics.totalTime / this.metrics.totalCycles);
        this.metrics.lastCycleTime = cycleTime;

        // 时间戳追踪（仅保留最近100个）
        this.metrics.cycleTimestamps.push(Date.now());
        if (this.metrics.cycleTimestamps.length > 100) {
            this.metrics.cycleTimestamps.shift();
        }

        // 改进量追踪
        if (result && result.improvement !== undefined) {
            this.metrics.improvementHistory.push(result.improvement);
            if (this.metrics.improvementHistory.length > 100) {
                this.metrics.improvementHistory.shift();
            }
            if (result.improvement > 0.01) {
                this.metrics.improvements++;
            }
        }

        // 收敛检测
        if (result && result.converged) {
            this.metrics.convergedCycles++;
        }

        // 收敛率
        this.metrics.convergenceRate = this.metrics.totalCycles > 0
            ? Math.round((this.metrics.convergedCycles / this.metrics.totalCycles) * 100) / 100
            : 0;

        // 健康度
        this._updateHealth('evolve', true);
    }

    _updateHealth(context, success) {
        if (!success) {
            this.metrics.healthScore = Math.max(0, this.metrics.healthScore - 10);
            return;
        }

        switch (context) {
            case 'core_init':
                this.metrics.healthScore = Math.min(100, this.metrics.healthScore + 15);
                break;
            case 'evolve':
                // 成功进化后恢复
                this.metrics.healthScore = Math.min(100, this.metrics.healthScore + 1);
                // 如果最近10次都成功，额外恢复
                const recent = this.metrics.cycleTimestamps.slice(-10);
                if (recent.length >= 10) {
                    this.metrics.healthScore = Math.min(100, this.metrics.healthScore + 2);
                }
                break;
        }
    }

    _recordError(type, message) {
        this.metrics.errors.push({
            type,
            message,
            timestamp: new Date().toISOString(),
            cycleCount: this.cycleCount
        });
        if (this.metrics.errors.length > 50) {
            this.metrics.errors = this.metrics.errors.slice(-50);
        }
    }

    // ════════════════════════════════════════════════════════
    // 持久化
    // ════════════════════════════════════════════════════════

    _loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                if (data.metrics) {
                    this.metrics = { ...this.metrics, ...data.metrics };
                }
                if (data.rateLimit) {
                    this.rateLimit = { ...this.rateLimit, ...data.rateLimit };
                }
                if (data.cycleCount !== undefined) {
                    this.cycleCount = data.cycleCount;
                }
            }
        } catch (e) {
            console.log('[EvolutionLoop] 加载状态失败，使用默认');
        }
    }

    _saveState() {
        try {
            if (!fs.existsSync(this.stateDir)) {
                fs.mkdirSync(this.stateDir, { recursive: true });
            }
            const state = {
                version: '1.1.0',
                cycleCount: this.cycleCount,
                metrics: {
                    totalCycles: this.metrics.totalCycles,
                    totalTime: this.metrics.totalTime,
                    fastestCycle: this.metrics.fastestCycle,
                    slowestCycle: this.metrics.slowestCycle,
                    avgCycleTime: this.metrics.avgCycleTime,
                    improvements: this.metrics.improvements,
                    convergedCycles: this.metrics.convergedCycles,
                    failedCycles: this.metrics.failedCycles,
                    convergenceRate: this.metrics.convergenceRate,
                    healthScore: this.metrics.healthScore,
                    cycleTimestamps: this.metrics.cycleTimestamps.slice(-100),
                    improvementHistory: this.metrics.improvementHistory.slice(-100),
                    errors: this.metrics.errors.slice(-20)
                },
                rateLimit: {
                    enabled: this.rateLimit.enabled,
                    maxCyclesPerMinute: this.rateLimit.maxCyclesPerMinute,
                    consecutiveFastCycles: this.rateLimit.consecutiveFastCycles
                },
                lastSaved: new Date().toISOString()
            };
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        } catch (e) {
            console.error('[EvolutionLoop] 保存状态失败:', e.message);
        }
    }

    // ════════════════════════════════════════════════════════
    // 代理方法（委托给 core）
    // ════════════════════════════════════════════════════════

    recordOutcome(params = {}) {
        if (this.core && typeof this.core.recordOutcome === 'function') {
            return this.core.recordOutcome(params);
        }
        return { recorded: false };
    }

    retrieveLessons(task) {
        if (this.core && typeof this.core.retrieveLessons === 'function') {
            return this.core.retrieveLessons(task);
        }
        return [];
    }

    heal(error) {
        if (this.core && typeof this.core.heal === 'function') {
            return this.core.heal(error);
        }
        return { healed: false, error: error?.message || String(error) };
    }

    // ════════════════════════════════════════════════════════
    // 诊断与统计
    // ════════════════════════════════════════════════════════

    /**
     * 获取完整进化循环诊断报告
     */
    getDiagnostics() {
        const now = Date.now();
        const recentActivity = this.metrics.cycleTimestamps
            .filter(t => now - t < 300000) // 最近5分钟
            .length;

        return {
            system: {
                version: '1.1.0',
                coreVersion: this.core ? this.core.version : 'not_initialized',
                enabled: !!this.core,
                healthScore: this.metrics.healthScore,
                status: this.metrics.healthScore >= 70 ? 'healthy' :
                        this.metrics.healthScore >= 40 ? 'degraded' : 'critical'
            },
            cycles: {
                total: this.metrics.totalCycles,
                current: this.cycleCount,
                failed: this.metrics.failedCycles,
                converged: this.metrics.convergedCycles,
                withImprovement: this.metrics.improvements
            },
            performance: {
                avgTime: `${this.metrics.avgCycleTime}ms`,
                fastest: `${this.metrics.fastestCycle === Infinity ? 'N/A' : this.metrics.fastestCycle + 'ms'}`,
                slowest: `${this.metrics.slowestCycle}ms`,
                lastTime: `${this.metrics.lastCycleTime || 'N/A'}`,
                recentActivity: `${recentActivity} cycles in last 5min`
            },
            convergence: {
                rate: `${Math.round(this.metrics.convergenceRate * 100)}%`,
                totalConverged: this.metrics.convergedCycles
            },
            rateLimit: {
                enabled: this.rateLimit.enabled,
                maxPerMinute: this.rateLimit.maxCyclesPerMinute,
                consecutiveFast: this.rateLimit.consecutiveFastCycles,
                cooldown: this.rateLimit.cooldownUntil 
                    ? Math.max(0, Math.ceil((this.rateLimit.cooldownUntil - now) / 1000)) + 's'
                    : 'none'
            },
            queue: this.getQueueStatus(),
            errors: this.metrics.errors.slice(-5).map(e => ({
                type: e.type,
                message: e.message.substring(0, 80),
                at: e.timestamp
            }))
        };
    }

    getStats() {
        return {
            cycleCount: this.cycleCount,
            enabled: !!this.core,
            version: '1.1.0',
            healthScore: this.metrics.healthScore,
            totalTime: `${Math.round(this.metrics.totalTime / 1000)}s`,
            avgCycleTime: `${this.metrics.avgCycleTime}ms`,
            convergenceRate: `${Math.round(this.metrics.convergenceRate * 100)}%`,
            queueSize: this.priorityQueue.length
        };
    }

    /**
     * 重置指标（保留核心状态）
     */
    resetMetrics() {
        this.metrics = {
            totalCycles: 0,
            totalTime: 0,
            fastestCycle: Infinity,
            slowestCycle: 0,
            avgCycleTime: 0,
            improvements: 0,
            convergedCycles: 0,
            failedCycles: 0,
            lastCycleTime: null,
            cycleTimestamps: [],
            improvementHistory: [],
            convergenceRate: 0,
            healthScore: 100,
            errors: []
        };
        this.rateLimit.consecutiveFastCycles = 0;
        this.rateLimit.cooldownUntil = null;
        this._saveState();
    }

    shutdown() {
        this._saveState();
        this.core = null;
    }
}

module.exports = { EvolutionLoop };
