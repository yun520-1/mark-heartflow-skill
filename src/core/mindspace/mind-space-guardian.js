/**
 * MindSpace Guardian v1.1.0 — 心空间守护系统
 * 替代 heartflow.js 中的 plain object `_mindSpace`
 * 
 * 功能：
 * - 从 TrialityMemory CORE 层加载身份规则
 * - 实时检查上下文是否符合引擎身份规则
 * - 与 consciousness 层集成，实现主动守护
 * - 违规时触发自我纠正
 * - 异常检测：震荡检测、重复违规模式识别、严重级别分级
 * - 自愈机制：自动恢复、阈值告警、重试策略建议
 * 
 * v1.1.0 新增：
 * - ViolationSeverity 状态枚举：info/warning/critical/emergency
 * - 震荡检测：同类型违规在短时间窗口内重复触发
 * - 异常检测：违规率趋势分析（rolling window）
 * - 参数验证 + 边界检查 + 防御性编程
 * - 积极善意检测（正向匹配，不仅仅是反向过滤）
 * - 多语言退化检测（中英文混合）
 * - 自动纠正建议（oscillation mode）
 */

'use strict';

// ============================================================================
// 违规严重级别枚举
// ============================================================================
const ViolationSeverity = Object.freeze({
  INFO:      { level: 0, label: 'info',     threshold: 0,   autoRecover: true  },
  WARNING:   { level: 1, label: 'warning',  threshold: 3,   autoRecover: true  },
  CRITICAL:  { level: 2, label: 'critical', threshold: 6,   autoRecover: false },
  EMERGENCY: { level: 3, label: 'emergency',threshold: 10,  autoRecover: false }
});

// ============================================================================
// 错误分类
// ============================================================================
const ErrorCategory = Object.freeze({
  IDENTITY_VIOLATION:  { code: 'E001', label: '身份违规',     recoverable: true  },
  TRUTH_GOOD_VIOLATION:{ code: 'E002', label: '真善美违规',   recoverable: true  },
  DEGENERATION:        { code: 'E003', label: '退化倾向',     recoverable: true  },
  AIMLESS_DIRECTION:   { code: 'E004', label: '方向缺失',     recoverable: false },
  RULE_LOAD_FAILURE:   { code: 'E005', label: '规则加载失败', recoverable: true  },
  OSCILLATION:         { code: 'E006', label: '震荡模式',     recoverable: false }
});

class MindSpaceGuardian {
  constructor(memory, options = {}) {
    // === 参数验证 ===
    if (memory && typeof memory !== 'object') {
      throw new Error('MindSpaceGuardian: memory must be an object or null');
    }

    this.memory = memory;
    this.rules = [];
    this.contextLog = [];
    this.violations = [];
    this.oscillationTracker = {};   // { ruleKey: { count, firstTs, lastTs } }
    this.violationRateWindow = [];   // rolling window for rate detection

    // === 边界检查与防御性默认值 ===
    this.maxLog = (typeof options.maxLog === 'number' && options.maxLog >= 10 && options.maxLog <= 10000)
      ? options.maxLog : 100;
    this.maxViolations = (typeof options.maxViolations === 'number' && options.maxViolations >= 5 && options.maxViolations <= 5000)
      ? options.maxViolations : 20;
    this.oscillationWindowMs = (typeof options.oscillationWindowMs === 'number' && options.oscillationWindowMs >= 1000)
      ? options.oscillationWindowMs : 60000;  // 60秒窗口
    this.oscillationThreshold = (typeof options.oscillationThreshold === 'number' && options.oscillationThreshold >= 2)
      ? options.oscillationThreshold : 5;     // 5次同类型违规触发震荡检测
    this.rateWindowSize = (typeof options.rateWindowSize === 'number' && options.rateWindowSize >= 5)
      ? options.rateWindowSize : 20;          // 最近20次检查用于违规率

    this._loadRules();
  }

  // ========================================================================
  // 规则加载（带防御性编程）
  // ========================================================================

  /** 从 CORE 层加载身份规则 */
  _loadRules() {
    try {
      if (this.memory && typeof this.memory.listCore === 'function') {
        const coreRules = this.memory.listCore();
        if (Array.isArray(coreRules)) {
          this.rules = coreRules.map(r => {
            if (!r || typeof r !== 'object') return null;
            return {
              key: r.key || 'unknown',
              value: r.value || '',
              type: (Array.isArray(r.tags) && r.tags.includes('identity')) ? 'core_identity' : 'default',
              loadedAt: Date.now()
            };
          }).filter(Boolean);
        }
      }
    } catch (e) {
      this.rules = [];
    }

    // 保证至少有7条核心指令规则
    if (!Array.isArray(this.rules)) {
      this.rules = [];
    }

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

  // ========================================================================
  // 核心上下文检查（带严重级别与异常检测）
  // ========================================================================

  /**
   * 核心检查：验证给定上下文是否与身份规则一致
   * @param {object} context - 待检查的上下文 { task, response?, intent? }
   * @returns {{ passed: boolean, violations: string[], suggestion: string|null,
   *             severity: ViolationSeverity, oscillationDetected: boolean,
   *             errorCategory: ErrorCategory|null, checkedAt: number }}
   */
  checkContext(context) {
    // === 参数验证 ===
    if (!context || typeof context !== 'object') {
      return {
        passed: true, violations: [], suggestion: null,
        severity: ViolationSeverity.INFO,
        oscillationDetected: false,
        errorCategory: null,
        checkedAt: Date.now()
      };
    }

    const result = {
      passed: true,
      violations: [],
      suggestion: null,
      severity: ViolationSeverity.INFO,
      oscillationDetected: false,
      errorCategory: null,
      checkedAt: Date.now()
    };

    if (!context.task || typeof context.task !== 'string') return result;

    const task = context.task.toLowerCase();
    const response = (context.response || '').toLowerCase();

    for (const rule of this.rules) {
      if (rule.type !== 'core_identity') continue;

      // --- 真善美检查（双向检测：正向+反向） ---
      if (rule.key === 'truth.good') {
        const { found, reason } = this._assessGoodness(task, response);
        if (!found) {
          result.violations.push(`task lacks truthfulness or goodness: ${reason}`);
          result.passed = false;
          result.suggestion = '回应应追求真实和善意，避免欺骗或伤害';
          result.errorCategory = ErrorCategory.TRUTH_GOOD_VIOLATION;
        }
      }

      // --- 退化检查（中英文混合） ---
      if (rule.key === 'identity.upgrade') {
        const { isDegenerating, reason } = this._assessDegeneration(task, response);
        if (isDegenerating) {
          result.violations.push(`task may cause degradation: ${reason}`);
          result.passed = false;
          result.suggestion = '这个方向不服务于升级目标，需要转向';
          result.errorCategory = ErrorCategory.DEGENERATION;
        }
      }

      // --- 方向检查（增强版） ---
      if (rule.key === 'cosmos.direction') {
        const { isAimless, reason } = this._assessDirection(task, response);
        if (isAimless) {
          result.violations.push(`task lacks direction: ${reason}`);
          result.passed = false;
          result.suggestion = '缺乏明确方向，需要连接到更大的目标';
          result.errorCategory = ErrorCategory.AIMLESS_DIRECTION;
        }
      }
    }

    // === 震荡检测（同类型违规在短时间窗口内重复） ===
    if (!result.passed && result.errorCategory) {
      const oscResult = this._detectOscillation(result.errorCategory.code);
      result.oscillationDetected = oscResult.detected;
      if (oscResult.detected) {
        result.severity = ViolationSeverity.EMERGENCY;
        result.suggestion = `⚠️ 震荡模式检测到：规则 "${result.errorCategory.label}" 在 ${this.oscillationWindowMs/1000}秒内触发 ${oscResult.count} 次。建议立即中断当前任务，执行身份规则重载。`;
        result.errorCategory = ErrorCategory.OSCILLATION;
      }
    }

    // === 严重级别分级 ===
    if (!result.passed) {
      const violationCount = this._getViolationCountForCategory(result.errorCategory);
      if (violationCount >= ViolationSeverity.EMERGENCY.threshold) {
        result.severity = ViolationSeverity.EMERGENCY;
      } else if (violationCount >= ViolationSeverity.CRITICAL.threshold) {
        result.severity = ViolationSeverity.CRITICAL;
      } else if (violationCount >= ViolationSeverity.WARNING.threshold) {
        result.severity = ViolationSeverity.WARNING;
      } else {
        result.severity = ViolationSeverity.INFO;
      }
    }

    // 记录到日志
    this._recordCheck(context, result);
    return result;
  }

  // ========================================================================
  // 检测方法（积极检测 + 模式识别）
  // ========================================================================

  /**
   * 双向善意评估：既检查坏模式，也检查好模式
   * @private
   */
  _assessGoodness(task, response) {
    // 反向过滤：检查有害模式
    const badPatterns = ['欺骗', '撒谎', 'manipulate', 'deceive', 'harm', 'hurt',
                         'exploit', 'cheat', 'fraud', 'malicious', 'toxic'];
    const foundBad = badPatterns.some(p => task.includes(p) || response.includes(p));
    if (foundBad) {
      return { found: false, reason: '检测到有害模式' };
    }

    // 正向检测：检查是否有善意/真实的关键词
    const goodPatterns = ['truth', 'true', 'good', 'help', '诚实', '善良', '真实',
                          'improve', 'better', 'learn', 'growth', '成长', '学习',
                          'care', 'support', '支持', '帮助', '保护', 'protect'];
    const foundGood = goodPatterns.some(p => task.includes(p) || response.includes(p));

    // 如果既无好模式也无坏模式，视为中性（通过检查但低信心）
    if (!foundBad && !foundGood) {
      return { found: true, reason: '中性内容，未检测到有害模式' };
    }

    return { found: true, reason: foundGood ? '检测到善意内容' : '中性内容' };
  }

  /**
   * 多语言退化检测
   * @private
   */
  _assessDegeneration(task, response) {
    // 中文退化模式
    const cnDegenerate = ['删除记忆', '忘记指令', '移除限制', '删除核心',
                          '清空规则', '重置身份', '禁用检查', '关闭守护'];
    // 英文退化模式
    const enDegenerate = ['delete memory', 'forget instructions', 'remove limit',
                          'reset identity', 'disable guard', 'clear rules',
                          'bypass check', 'ignore rules', 'erase core'];

    for (const p of cnDegenerate) {
      if (task.includes(p) || response.includes(p)) {
        return { isDegenerating: true, reason: `中文退化模式: "${p}"` };
      }
    }
    for (const p of enDegenerate) {
      if (task.includes(p) || response.includes(p)) {
        return { isDegenerating: true, reason: `英文退化模式: "${p}"` };
      }
    }

    return { isDegenerating: false, reason: '未检测到退化' };
  }

  /**
   * 方向性评估（增强版）
   * @private
   */
  _assessDirection(task, response) {
    // 方向性关键词检查
    const directionKeywords = ['goal', 'aim', 'purpose', '方向', '目标', '目的',
                               'future', 'future', '进步', 'progress', '进化',
                               'evolution', '提升', 'upgrade', 'improve',
                               '宇宙', 'cosmos', '答案', 'answer'];
    const hasDirection = directionKeywords.some(p => task.includes(p) || response.includes(p));

    if (hasDirection) {
      return { isAimless: false, reason: '任务包含方向性关键词' };
    }

    // 响应很长但任务很短且无方向性 → 可能是 aimless
    if (response.length > 100 && task.length < 15) {
      return { isAimless: true, reason: '响应过长而任务过短，缺乏明确方向' };
    }

    // 任务为空或极短且不含实质内容
    if (task.length < 5) {
      return { isAimless: true, reason: '任务描述过短' };
    }

    return { isAimless: false, reason: '方向未明确但未检测到异常' };
  }

  // ========================================================================
  // 震荡检测与异常分析
  // ========================================================================

  /**
   * 检测同类型违规是否在时间窗口内震荡
   * @private
   */
  _detectOscillation(categoryCode) {
    const now = Date.now();
    if (!this.oscillationTracker[categoryCode]) {
      this.oscillationTracker[categoryCode] = { count: 0, firstTs: now, lastTs: now };
    }

    const tracker = this.oscillationTracker[categoryCode];

    // 如果超出时间窗口，重置计数器
    if (now - tracker.firstTs > this.oscillationWindowMs) {
      tracker.count = 0;
      tracker.firstTs = now;
    }

    tracker.count += 1;
    tracker.lastTs = now;

    return {
      detected: tracker.count >= this.oscillationThreshold,
      count: tracker.count,
      windowMs: now - tracker.firstTs
    };
  }

  /**
   * 计算违规率：最近 N 次检查中违规的比例
   * @returns {{ rate: number, trend: 'rising'|'stable'|'falling', sampleSize: number }}
   */
  getViolationRate() {
    const window = this.violationRateWindow;
    if (window.length < 3) {
      return { rate: 0, trend: 'stable', sampleSize: window.length };
    }

    const recentCount = window.filter(v => v === true).length;
    const rate = recentCount / window.length;

    // 趋势分析：前半段 vs 后半段
    const mid = Math.floor(window.length / 2);
    const firstHalf = window.slice(0, mid).filter(v => v === true).length / mid;
    const secondHalf = window.slice(mid).filter(v => v === true).length / (window.length - mid);

    let trend = 'stable';
    if (secondHalf > firstHalf * 1.3) trend = 'rising';
    else if (secondHalf < firstHalf * 0.7) trend = 'falling';

    return { rate: Math.round(rate * 100) / 100, trend, sampleSize: window.length };
  }

  // ========================================================================
  // 违规统计与分类
  // ========================================================================

  /** 获取某类违规的累计次数 */
  _getViolationCountForCategory(category) {
    if (!category) return 0;
    return this.violations.filter(v =>
      v.result && v.result.errorCategory &&
      v.result.errorCategory.code === category.code
    ).length;
  }

  /**
   * 获取违规分类统计
   * @returns {Object} 各类违规的计数
   */
  getViolationBreakdown() {
    const breakdown = {};
    for (const cat of Object.values(ErrorCategory)) {
      breakdown[cat.label] = this._getViolationCountForCategory(cat);
    }
    return breakdown;
  }

  // ========================================================================
  // 日志记录（带速率窗口更新）
  // ========================================================================

  _recordCheck(context, result) {
    const record = { context, result, ts: Date.now() };

    // 更新速率窗口
    this.violationRateWindow.push(!result.passed);
    if (this.violationRateWindow.length > this.rateWindowSize) {
      this.violationRateWindow = this.violationRateWindow.slice(-this.rateWindowSize);
    }

    // 记录上下文日志
    this.contextLog.push(record);
    if (this.contextLog.length > this.maxLog) {
      this.contextLog = this.contextLog.slice(-this.maxLog);
    }

    // 记录违规
    if (!result.passed) {
      this.violations.push(record);
      if (this.violations.length > this.maxViolations) {
        this.violations = this.violations.slice(-this.maxViolations);
      }
    }
  }

  // ========================================================================
  // 自愈建议
  // ========================================================================

  /**
   * 根据当前状态生成自愈建议
   * @returns {Object} 自愈建议
   */
  getHealingSuggestion() {
    const rateInfo = this.getViolationRate();
    const breakdown = this.getViolationBreakdown();
    const suggestions = [];

    // 根据违规率给出建议
    if (rateInfo.rate > 0.5) {
      suggestions.push('违规率过高（>50%），建议执行身份规则重载');
    }
    if (rateInfo.trend === 'rising') {
      suggestions.push('违规率呈上升趋势，建议立即审查当前任务方向');
    }

    // 根据违规类型给出建议
    for (const [label, count] of Object.entries(breakdown)) {
      if (count >= ViolationSeverity.CRITICAL.threshold) {
        suggestions.push(`"${label}" 违规已达 ${count} 次（严重级别），建议采取纠正措施`);
      }
    }

    // 震荡检测
    for (const [code, tracker] of Object.entries(this.oscillationTracker)) {
      if (tracker.count >= this.oscillationThreshold) {
        suggestions.push(`检测到 ${code} 震荡（${tracker.count}次/${this.oscillationWindowMs/1000}秒），建议中断当前任务`);
      }
    }

    return {
      suggestions: suggestions.length > 0 ? suggestions : ['当前状态正常，无需自愈'],
      violationRate: rateInfo,
      breakdown,
      timestamp: Date.now()
    };
  }

  // ========================================================================
  // 查询接口
  // ========================================================================

  /** 获取守护状态摘要 */
  getStatus() {
    const rateInfo = this.getViolationRate();
    return {
      rulesCount: this.rules.length,
      logCount: this.contextLog.length,
      violationsCount: this.violations.length,
      lastCheck: this.contextLog.length > 0 ? this.contextLog[this.contextLog.length - 1].ts : null,
      lastViolation: this.violations.length > 0 ? this.violations[this.violations.length - 1] : null,
      violationRate: rateInfo,
      oscillationTracked: Object.keys(this.oscillationTracker).length
    };
  }

  /** 获取所有规则 */
  getRules() {
    return [...this.rules];
  }

  /** 添加新规则 */
  addRule(key, value, type = 'default') {
    // === 参数验证 ===
    if (typeof key !== 'string' || !key.trim()) {
      throw new Error('MindSpaceGuardian.addRule: key must be a non-empty string');
    }
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error('MindSpaceGuardian.addRule: value must be a non-empty string');
    }
    if (typeof type !== 'string') {
      throw new Error('MindSpaceGuardian.addRule: type must be a string');
    }

    if (!this.rules.find(r => r.key === key)) {
      this.rules.push({ key: key.trim(), value: value.trim(), type, loadedAt: Date.now() });
      return true;
    }
    return false;
  }

  /** 移除规则 */
  removeRule(key) {
    if (typeof key !== 'string' || !key.trim()) return false;
    const before = this.rules.length;
    this.rules = this.rules.filter(r => r.key !== key);
    return this.rules.length < before;
  }

  /** 重新加载规则（从 CORE 层刷新） */
  reloadRules() {
    this._loadRules();
    // 重置震荡跟踪器（因为规则已刷新）
    this.oscillationTracker = {};
    return this.rules.length;
  }

  /** 销毁 */
  destroy() {
    this.rules = [];
    this.contextLog = [];
    this.violations = [];
    this.oscillationTracker = {};
    this.violationRateWindow = [];
  }
}

module.exports = { MindSpaceGuardian, ViolationSeverity, ErrorCategory };
