/**
 * Rollback Manager - 回滚与熔断机制
 * 监控修改后的性能指标，触发自动回滚
 */

const fs = require('fs');
const path = require('path');

class RollbackManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.versionFile = path.join(projectRoot, 'internal', 'data', 'evolution-versions.json');
    this.performanceFile = path.join(projectRoot, 'internal', 'data', 'performance-metrics.json');
    this.logFile = path.join(projectRoot, 'logs', 'rollback-manager.log');
    
    this.consecutiveDeclines = 0;
    this.lastStableVersion = null;
    this.cooldownUntil = null;
    this.maxDeclines = 3;
    
    this.loadMetrics();
  }

  loadMetrics() {
    try {
      if (fs.existsSync(this.performanceFile)) {
        this.metrics = JSON.parse(fs.readFileSync(this.performanceFile, 'utf8'));
      } else {
        this.metrics = { history: [], currentScore: 7.0 };
      }
    } catch (e) {
      this.metrics = { history: [], currentScore: 7.0 };
    }
  }

  saveMetrics() {
    fs.writeFileSync(this.performanceFile, JSON.stringify(this.metrics, null, 2));
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(this.logFile, entry);
    console.log(`[Rollback] ${message}`);
  }

  /**
   * 记录性能指标
   */
  recordMetric(type, score) {
    const metric = {
      type,
      score,
      timestamp: new Date().toISOString()
    };
    
    this.metrics.history.push(metric);
    this.metrics.currentScore = score;
    this.saveMetrics();
    
    this.log(`Recorded metric: ${type} = ${score}`);
  }

  /**
   * 检查是否需要回滚
   */
  checkRollbackNeeded() {
    const history = this.metrics.history || [];
    
    if (history.length < this.maxDeclines) {
      return { needed: false, reason: 'insufficient_data' };
    }

    const recent = history.slice(-this.maxDeclines);
    const scores = recent.map(m => m.score);
    
    const isDeclining = scores.every((s, i) => i === 0 || s <= scores[i - 1]);
    const lastScore = scores[scores.length - 1];
    const threshold = 5.0;
    
    if (isDeclining && lastScore < threshold) {
      this.consecutiveDeclines++;
      
      this.log(`Decline detected! Consecutive: ${this.consecutiveDeclines}`);
      
      if (this.consecutiveDeclines >= this.maxDeclines) {
        return { 
          needed: true, 
          reason: 'consecutive_declines',
          scores: scores
        };
      }
    } else {
      this.consecutiveDeclines = 0;
    }

    return { needed: false, reason: 'stable' };
  }

  /**
   * 执行回滚
   */
  async performRollback() {
    if (this.isInCooldown()) {
      return { success: false, reason: 'in_cooldown' };
    }

    const versions = this.loadVersions();
    
    if (versions.length < 2) {
      return { success: false, reason: 'no_previous_version' };
    }

    const previousVersion = versions[versions.length - 2];
    const currentVersion = versions[versions.length - 1];

    this.log(`Rolling back from ${currentVersion.id} to ${previousVersion.id}`);

    // 恢复文件 - 从版本历史中获取内容并写入
    const srcDir = path.join(this.projectRoot, 'src');
    const filePath = path.join(srcDir, previousVersion.target);

    try {
      if (previousVersion.content) {
        // 直接使用存储的文件内容进行恢复
        fs.writeFileSync(filePath, previousVersion.content, 'utf8');
        this.log(`Restored file: ${previousVersion.target} (id: ${previousVersion.id})`);

        // 更新当前版本记录，指向已恢复的文件
        const currentVersionEntry = {
          id: `v-${Date.now()}`,
          proposal: 'rollback',
          target: previousVersion.target,
          timestamp: new Date().toISOString(),
          hash: previousVersion.hash,
          previousHash: currentVersion.hash,
          content: previousVersion.content
        };

        // 追加回滚版本记录
        const versions = this.loadVersions();
        versions.push(currentVersionEntry);
        fs.writeFileSync(this.versionFile, JSON.stringify(versions, null, 2));
      } else {
        this.log(`Cannot restore: no content stored for ${previousVersion.target}`, 'WARN');
      }
    } catch (err) {
      this.log(`Restore failed: ${err.message}`, 'ERROR');
      return { success: false, reason: 'restore_failed', error: err.message };
    }

    // 设置冷却期
    this.triggerCooldown(24 * 60 * 60 * 1000);

    // 记录回滚事件
    const rollbackEvent = {
      timestamp: new Date().toISOString(),
      from: currentVersion.id,
      to: previousVersion.id,
      reason: 'performance_decline'
    };

    this.recordRollback(rollbackEvent);

    return {
      success: true,
      rolledBack: previousVersion,
      cooldownHours: 24
    };
  }

  loadVersions() {
    try {
      if (fs.existsSync(this.versionFile)) {
        return JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  recordRollback(event) {
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
    fs.writeFileSync(rollbackFile, JSON.stringify(history, null, 2));
  }

  /**
   * 触发冷却期
   */
  triggerCooldown(durationMs) {
    this.cooldownUntil = new Date(Date.now() + durationMs);
    this.log(`Cooldown triggered for ${durationMs / (60 * 60 * 1000)} hours`);
  }

  /**
   * 检查是否在冷却期
   */
  isInCooldown() {
    if (!this.cooldownUntil) return false;
    const isIn = new Date() < this.cooldownUntil;
    if (!isIn) {
      this.cooldownUntil = null;
      this.log('Cooldown period ended');
    }
    return isIn;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      consecutiveDeclines: this.consecutiveDeclines,
      maxDeclines: this.maxDeclines,
      currentScore: this.metrics.currentScore,
      inCooldown: this.isInCooldown(),
      cooldownUntil: this.cooldownUntil ? this.cooldownUntil.toISOString() : null,
      lastStableVersion: this.lastStableVersion
    };
  }

  /**
   * 重置连续下降计数
   */
  resetDeclineCount() {
    this.consecutiveDeclines = 0;
    this.lastStableVersion = this.loadVersions().slice(-1)[0];
    this.log('Decline counter reset');
  }
}

module.exports = { RollbackManager };
