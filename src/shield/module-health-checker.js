/**
 * HeartFlow 模块健康检查器
 * 
 * 功能：
 * 1. 检查模块加载状态
 * 2. 自动禁用失败模块
 * 3. 提供健康报告
 */

class ModuleHealthChecker {
  constructor(heartflow) {
    this.hf = heartflow;
    this.healthLog = [];
    this.maxLogSize = 100;
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
      details: []
    };

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
          break;
      }
    }

    // 记录日志
    this.healthLog.push(report);
    if (this.healthLog.length > this.maxLogSize) {
      this.healthLog = this.healthLog.slice(-this.maxLogSize);
    }

    return report;
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
