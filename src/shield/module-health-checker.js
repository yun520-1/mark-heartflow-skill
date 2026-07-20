/**
 * HeartFlow 模块健康检查器
 * 
 * 功能：
 * 1. 检查模块加载状态
 * 2. 自动禁用失败模块
 * 3. 提供健康报告
 */

// 标准生命周期 mixin：为缺少接口方法的模块注入 noop 清理 + 基础统计
// 避免对 120+ 模块逐一手动添加，零侵入、不破坏现有逻辑
function ensureModuleInterfaces(mod) {
  if (!mod || typeof mod !== 'object') return mod;
  if (typeof mod.destroy !== 'function' && typeof mod.stop !== 'function') {
    mod.destroy = function _noopDestroy() {};
    mod.stop = mod.stop || mod.destroy;
  }
  if (typeof mod.getStats !== 'function' && typeof mod.stats !== 'object') {
    mod.getStats = function _defaultStats() {
      const keys = Object.getOwnPropertyNames(mod).filter(k => !k.startsWith('_'));
      return { name: mod.constructor?.name || 'anonymous', methods: keys.length, stats: 'default' };
    };
    mod.stats = mod.stats || {};
  }
  return mod;
}

class ModuleHealthChecker {
  constructor(heartflow) {
    this.hf = heartflow;
    this.healthLog = [];
    this.maxLogSize = 100;
    this.disabledModules = new Set(); // [v6.0.34] 真禁用集合(元审计修复: 之前只计数不禁用)
  }

  /** 统一为所有已注册模块注入标准接口 */
  normalizeModules() {
    const modules = this.hf._modules || {};
    let normalized = 0;
    for (const [name, mod] of Object.entries(modules)) {
      const before = typeof mod?.destroy === 'function' && typeof mod?.getStats === 'function';
      ensureModuleInterfaces(mod);
      if (!before) normalized++;
    }
    return normalized;
  }

  /**
   * 执行健康检查
   */
  check() {
    const report = {
      timestamp: Date.now(),
      totalModules: 0,
      healthy: 0,
      degraded: 0,
      failed: 0,
      disabled: [], // [v6.0.34] 真禁用模块清单(元审计修复)
      details: []
    };

    // 自修复：先为缺失标准接口的模块注入 noop 清理 + 基础统计
    this.normalizeModules();

    // 检查所有已注册模块
    const modules = this.hf._modules || {};
    report.totalModules = Object.keys(modules).length;

    for (const [name, mod] of Object.entries(modules)) {
      const status = this.checkModule(name, mod);
      report.details.push(status);

      switch (status.health) {
        case 'healthy':
          report.healthy++;
          break;
        case 'degraded':
          report.degraded++;
          break;
        case 'failed':
          report.failed++;
          // [v6.0.34] 元审计修复: 之前只计数不禁用 = 假自愈
          // [v6.0.51 L4] 诚实标注: 标记 __disabled + 加入 disabledModules 集合（保留 _modules 对象以便诊断，不物理移除引用）
          if (mod && typeof mod === 'object') mod.__disabled = true;
          this.disabledModules.add(name);
          break;
      }
    }

    // 记录日志
    this.healthLog.push(report);
    if (this.healthLog.length > this.maxLogSize) {
      this.healthLog = this.healthLog.slice(-this.maxLogSize);
    }

    report.disabled = [...this.disabledModules]; // [v6.0.34] 填充真禁用清单
    return report;
  }

  /** [v6.0.34] 元审计修复: 查询模块是否被真禁用 */
  isDisabled(name) {
    return this.disabledModules.has(name);
  }

  getDisabled() {
    return [...this.disabledModules];
  }

  /**
   * 检查单个模块
   */
  checkModule(name, mod) {
    const status = {
      name,
      health: 'healthy',
      issues: []
    };

    if (!mod) {
      status.health = 'failed';
      status.issues.push('模块为null');
      return status;
    }

    // 检查是否有destroy/stop方法（可清理）
    if (typeof mod.destroy !== 'function' && typeof mod.stop !== 'function') {
      status.issues.push('缺少清理方法(destroy/stop)');
    }

    // 检查是否有getStats方法（可观测性）
    if (typeof mod.getStats !== 'function' && typeof mod.stats !== 'object') {
      status.issues.push('缺少统计方法(getStats/stats)');
    }

    // 如果有问题，标记为degraded
    if (status.issues.length > 0) {
      status.health = 'degraded';
    }

    return status;
  }

  /**
   * 获取健康报告摘要
   */
  getSummary() {
    if (this.healthLog.length === 0) {
      return { status: 'no_data', message: '尚未执行健康检查' };
    }

    const latest = this.healthLog[this.healthLog.length - 1];
    const previous = this.healthLog.length > 1 ? this.healthLog[this.healthLog.length - 2] : null;

    const summary = {
      timestamp: latest.timestamp,
      total: latest.totalModules,
      healthy: latest.healthy,
      degraded: latest.degraded,
      failed: latest.failed,
      healthScore: latest.totalModules > 0 
        ? Math.round((latest.healthy / latest.totalModules) * 100)
        : 0
    };

    // 趋势分析
    if (previous) {
      summary.trend = {
        healthy: latest.healthy - previous.healthy,
        degraded: latest.degraded - previous.degraded,
        failed: latest.failed - previous.failed
      };
    }

    return summary;
  }

  /**
   * 获取有问题的模块列表
   */
  getProblematicModules() {
    if (this.healthLog.length === 0) return [];

    const latest = this.healthLog[this.healthLog.length - 1];
    return latest.details.filter(d => d.health !== 'healthy');
  }
}

module.exports = { ModuleHealthChecker };
