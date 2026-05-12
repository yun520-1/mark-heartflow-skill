/**
 * HeartFlow Self-Healing RL Module v11.5.9
 * 基于 Reflexion/CRITIC 架构的修复策略学习
 *
 * 核心：Q-learning + ε-greedy 探索 + 持久化
 * 数据来源：self-healing.js 的每次修复记录
 * 学习信号：repair outcome (success=1, failure=-0.5)
 *
 * Paper: Reflexion (2023), CRITIC (2024)
 * Persistence: data/healing-rl-state.json
 */

const fs = require('fs');
const path = require('path');

// 持久化路径
const STATE_DIR = path.join(__dirname, '..', '..', 'data');
const STATE_FILE = path.join(STATE_DIR, 'healing-rl-state.json');

class HealingMemoryRL {
  constructor(maxMemory = 100) {
    this.maxMemory = maxMemory;
    this.memory = [];
    this.Q = {};       // Q-table: context-action → value
    this.lr = 0.1;      // learning rate
    this.gamma = 0.9;   // discount factor
    this.epsilon = 0.15; // exploration rate
    this.statsVersion = 0; // 用于检测版本变化

    // 启动时从磁盘恢复
    this._load();
  }

  /**
   * 从磁盘加载 Q-table 和 memory
   */
  _load() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf-8');
        const state = JSON.parse(raw);
        this.Q = state.Q || {};
        this.memory = state.memory || [];
        this.statsVersion = state.version || 0;
        console.log(`[HealingMemoryRL] 从磁盘恢复: ${this.memory.length}条记忆, ${Object.keys(this.Q).length}个Q值`);
      } else {
        console.log('[HealingMemoryRL] 无历史记录，从空白开始');
      }
    } catch (e) {
      console.warn('[HealingMemoryRL] 加载失败:', e.message);
    }
  }

  /**
   * 保存 Q-table 和 memory 到磁盘
   */
  _save() {
    try {
      if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
      }
      const state = {
        Q: this.Q,
        memory: this.memory.slice(-this.maxMemory),
        version: Date.now()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
      console.warn('[HealingMemoryRL] 保存失败:', e.message);
    }
  }

  /**
   * 记录修复结果
   */
  record(pattern, patch, success) {
    this.memory.push({
      pattern,
      patch,
      success: !!success,
      timestamp: Date.now()
    });
    if (this.memory.length > this.maxMemory) {
      this.memory = this.memory.slice(-this.maxMemory);
    }
    this._save(); // 每次记录后持久化
  }

  /**
   * Q-learning 更新
   */
  learn(context, action, reward) {
    const key = this._key(context, action);
    const prev = this.Q[key] || 0;
    const maxFutureQ = Object.keys(this.Q).length > 0
      ? Math.max(...Object.values(this.Q), 0)
      : 0;
    this.Q[key] = prev + this.lr * (reward + this.gamma * maxFutureQ - prev);
    this._save(); // 每次学习后持久化
  }

  /**
   * ε-greedy 策略选择
   */
  selectAction(context, availableActions) {
    if (!availableActions || availableActions.length === 0) return null;
    if (Math.random() < this.epsilon) {
      return availableActions[Math.floor(Math.random() * availableActions.length)];
    }
    let best = null, bestQ = -Infinity;
    for (const action of availableActions) {
      const q = this.Q[this._key(context, action)] || 0;
      if (q > bestQ) { bestQ = q; best = action; }
    }
    return best || availableActions[0];
  }

  /**
   * 从修复结果学习
   */
  updateFromRepair(context, action, success) {
    const reward = success ? 1.0 : -0.5;
    this.learn(context, action, reward);
  }

  /**
   * 策略质量评估
   */
  getStrategyQuality(action) {
    let total = 0, count = 0;
    for (const [key, val] of Object.entries(this.Q)) {
      if (key.endsWith(`"${action}"]`)) { total += val; count++; }
    }
    return count > 0 ? total / count : 0;
  }

  /**
   * 历史最佳补丁（基于成功率）
   */
  bestPatch(pattern) {
    const candidates = this.memory.filter(x => x.pattern === pattern);
    if (!candidates.length) return null;
    const scored = candidates.map(x => ({
      ...x,
      score: this.Q[this._key(x.pattern, x.patch)] || (x.success ? 1 : -0.5)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }

  /**
   * 按 Q 值排序所有补丁
   */
  rankedPatches(failureCtx) {
    const ctx = String(failureCtx);
    const candidates = this.memory.filter(x => {
      const xCtx = String(x.pattern);
      return xCtx === ctx || ctx.includes(xCtx) || xCtx.includes(ctx);
    });
    if (!candidates.length) return this.memory.slice(-8).reverse().map(x => x.patch);
    return candidates
      .map(x => ({
        ...x,
        qVal: this.Q[this._key(x.pattern, x.patch)] || 0
      }))
      .sort((a, b) => b.qVal - a.qVal)
      .map(x => x.patch);
  }

  /**
   * 学习统计
   */
  stats() {
    const successes = this.memory.filter(x => x.success).length;
    const total = this.memory.length;
    return {
      total,
      successes,
      failRate: total > 0 ? (1 - successes / total).toFixed(3) : 'N/A',
      qEntries: Object.keys(this.Q).length,
      persisted: fs.existsSync(STATE_FILE),
      topStrategies: Object.entries(this.Q)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, v]) => ({ strategy: JSON.parse(k).action, q: v.toFixed(3) }))
    };
  }

  _key(context, action) {
    return JSON.stringify({
      ctx: String(context).slice(0, 80),
      action: String(action).slice(0, 50)
    });
  }
}

module.exports = { HealingMemoryRL };
