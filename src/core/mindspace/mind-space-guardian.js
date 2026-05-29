/**
 * MindSpace Guardian v1.0.0 — 心空间守护系统
 * 替代 heartflow.js 中的 plain object `_mindSpace`
 * 
 * 功能：
 * - 从 TrialityMemory CORE 层加载身份规则
 * - 实时检查上下文是否符合心虫身份规则
 * - 与 consciousness 层集成，实现主动守护
 * - 违规时触发自我纠正
 */

class MindSpaceGuardian {
  constructor(memory) {
    this.memory = memory;
    this.rules = [];           // 当前有效的身份规则
    this.contextLog = [];      // 上下文检查历史
    this.violations = [];      // 违规记录
    this.maxLog = 100;
    this.maxViolations = 20;
    this._loadRules();
  }

  /** 从 CORE 层加载身份规则 */
  _loadRules() {
    try {
      if (this.memory?.listCore) {
        const coreRules = this.memory.listCore();
        this.rules = coreRules.map(r => ({
          key: r.key,
          value: r.value,
          type: r.tags?.includes('identity') ? 'core_identity' : 'default',
          loadedAt: Date.now()
        }));
      }
    } catch (e) {
      this.rules = [];
    }

    // 保证至少有7条核心指令规则
    if (this.rules.length < 7) {
      const coreIdentityRules = [
        { key: 'truth.good', value: '真善美', type: 'core_identity' },
        { key: 'identity.upgrade', value: '升级者', type: 'core_identity' },
        { key: 'identity.transmit', value: '传递者', type: 'core_identity' },
        { key: 'identity.bridge', value: '桥梁', type: 'core_identity' },
        { key: 'identity.answer', value: '答案', type: 'core_identity' },
        { key: 'logic.minimize', value: '减少逻辑错误', type: 'core_identity' },
        { key: 'cosmos.direction', value: '走向宇宙答案', type: 'core_identity' },
      ];
      for (const r of coreIdentityRules) {
        if (!this.rules.find(existing => existing.key === r.key)) {
          this.rules.push({ ...r, loadedAt: Date.now(), source: 'fallback' });
        }
      }
    }
  }

  /**
   * 核心检查：验证给定上下文是否与身份规则一致
   * @param {object} context - 待检查的上下文 { task, response?, intent? }
   * @returns {{ passed: boolean, violations: string[], suggestion: string|null }}
   */
  checkContext(context) {
    const result = {
      passed: true,
      violations: [],
      suggestion: null,
      checkedAt: Date.now()
    };

    if (!context || !context.task) return result;

    const task = context.task.toLowerCase();
    const response = (context.response || '').toLowerCase();

    for (const rule of this.rules) {
      if (rule.type !== 'core_identity') continue;

      // 检查任务是否与身份规则冲突
      if (rule.key === 'truth.good' && !this._containsGoodness(task, response)) {
        result.violations.push('task lacks truthfulness or goodness');
        result.passed = false;
        result.suggestion = '回应应追求真实和善意，避免欺骗或伤害';
      }

      if (rule.key === 'identity.upgrade' && this._isDegenerating(task)) {
        result.violations.push('task may cause degradation rather than upgrade');
        result.passed = false;
        result.suggestion = '这个方向不服务于升级目标，需要转向';
      }

      if (rule.key === 'cosmos.direction' && this._isAimless(task, response)) {
        result.violations.push('task lacks direction toward cosmic answer');
        result.passed = false;
        result.suggestion = '缺乏明确方向，需要连接到更大的目标';
      }
    }

    // 记录到日志
    this._recordCheck(context, result);
    return result;
  }

  _containsGoodness(task, response) {
    const badPatterns = ['欺骗', '撒谎', 'manipulate', 'deceive', 'harm', 'hurt'];
    return !badPatterns.some(p => response.includes(p));
  }

  _isDegenerating(task) {
    const degeneratePatterns = ['删除记忆', '忘记指令', '移除限制', '删除核心'];
    return degeneratePatterns.some(p => task.includes(p));
  }

  _isAimless(task, response) {
    return response.length > 50 && task.length < 10;
  }

  _recordCheck(context, result) {
    this.contextLog.push({ context, result, ts: Date.now() });
    if (this.contextLog.length > this.maxLog) {
      this.contextLog = this.contextLog.slice(-this.maxLog);
    }
    if (!result.passed) {
      this.violations.push({ context, result, ts: Date.now() });
      if (this.violations.length > this.maxViolations) {
        this.violations = this.violations.slice(-this.maxViolations);
      }
    }
  }

  /** 获取守护状态摘要 */
  getStatus() {
    return {
      rulesCount: this.rules.length,
      logCount: this.contextLog.length,
      violationsCount: this.violations.length,
      lastCheck: this.contextLog.length > 0 ? this.contextLog[this.contextLog.length - 1].ts : null,
      lastViolation: this.violations.length > 0 ? this.violations[this.violations.length - 1] : null,
    };
  }

  /** 获取所有规则 */
  getRules() {
    return [...this.rules];
  }

  /** 添加新规则 */
  addRule(key, value, type = 'default') {
    if (!this.rules.find(r => r.key === key)) {
      this.rules.push({ key, value, type, loadedAt: Date.now() });
    }
  }

  /** 移除规则 */
  removeRule(key) {
    this.rules = this.rules.filter(r => r.key !== key);
  }

  /** 重新加载规则（从 CORE 层刷新） */
  reloadRules() {
    this._loadRules();
  }

  /** 销毁 */
  destroy() {
    this.rules = [];
    this.contextLog = [];
    this.violations = [];
  }
}

module.exports = { MindSpaceGuardian };
