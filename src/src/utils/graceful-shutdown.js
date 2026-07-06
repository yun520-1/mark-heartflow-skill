/**
 * HeartFlow v5.8.2 — 优雅关闭（生产环境优化）
 * 
 * 功能: SIGTERM/SIGINT 处理、资源清理、进行中请求等待
 */

class GracefulShutdown {
  constructor(options = {}) {
    this.servers = [];  // HTTP 服务器列表
    this.cleanupTasks = [];  // 清理任务
    this.timeout = options.timeout || 30000;  // 30秒超时
    this.isShuttingDown = false;
    this.logger = options.logger || console;
  }

  /**
   * 注册服务器（需要关闭的）
   */
  registerServer(server) {
    this.servers.push(server);
    this.logger.info('[GracefulShutdown] Server registered');
  }

  /**
   * 注册清理任务
   */
  registerCleanupTask(taskName, taskFunction) {
    this.cleanupTasks.push({ name: taskName, fn: taskFunction });
    this.logger.info(`[GracefulShutdown] Cleanup task registered: ${taskName}`);
  }

  /**
   * 启动优雅关闭监听
   */
  start() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach(signal => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          this.logger.warn('[GracefulShutdown] Already shutting down, ignoring signal');
          return;
        }

        this.isShuttingDown = true;
        this.logger.info(`[GracefulShutdown] Received ${signal}, starting graceful shutdown...`);

        // 设置超时
        const timeout = setTimeout(() => {
          this.logger.error('[GracefulShutdown] Timeout, forcing shutdown');
          process.exit(1);
        }, this.timeout);

        try {
          // 1. 停止接收新请求（关闭服务器）
          await this.closeServers();

          // 2. 执行清理任务
          await this.runCleanupTasks();

          // 3. 刷新日志
          await this.flushLogs();

          clearTimeout(timeout);
          this.logger.info('[GracefulShutdown] Shutdown complete');
          process.exit(0);
        } catch (error) {
          this.logger.error('[GracefulShutdown] Error during shutdown:', error);
          process.exit(1);
        }
      });
    });

    this.logger.info('[GracefulShutdown] Graceful shutdown listener started');
  }

  /**
   * 关闭所有注册的服务器
   */
  async closeServers() {
    if (this.servers.length === 0) {
      this.logger.info('[GracefulShutdown] No servers to close');
      return;
    }

    this.logger.info(`[GracefulShutdown] Closing ${this.servers.length} server(s)...`);

    const promises = this.servers.map(server => {
      return new Promise((resolve) => {
        server.close(() => {
          this.logger.info('[GracefulShutdown] Server closed');
          resolve();
        });
      });
    });

    await Promise.all(promises);
  }

  /**
   * 运行所有清理任务
   */
  async runCleanupTasks() {
    if (this.cleanupTasks.length === 0) {
      this.logger.info('[GracefulShutdown] No cleanup tasks to run');
      return;
    }

    this.logger.info(`[GracefulShutdown] Running ${this.cleanupTasks.length} cleanup task(s)...`);

    for (const task of this.cleanupTasks) {
      try {
        this.logger.info(`[GracefulShutdown] Running cleanup task: ${task.name}`);
        await task.fn();
        this.logger.info(`[GracefulShutdown] Cleanup task completed: ${task.name}`);
      } catch (error) {
        this.logger.error(`[GracefulShutdown] Cleanup task failed: ${task.name}`, error);
      }
    }
  }

  /**
   * 刷新日志
   */
  async flushLogs() {
    return new Promise((resolve) => {
      // 等待所有日志写入完成
      if (this.logger.flush) {
        this.logger.flush(resolve);
      } else {
        // 如果没有 flush 方法，等待 100ms
        setTimeout(resolve, 100);
      }
    });
  }

  /**
   * 手动触发优雅关闭（用于测试）
   */
  async shutdown() {
    this.logger.info('[GracefulShutdown] Manual shutdown triggered');
    process.emit('SIGTERM');
  }
}

/**
 * 创建预配置的优雅关闭处理器
 */
function createGracefulShutdown(options) {
  return new GracefulShutdown(options);
}

/**
 * 默认优雅关闭处理器（全局复用）
 */
let defaultGracefulShutdown = null;

function getDefaultGracefulShutdown() {
  if (!defaultGracefulShutdown) {
    defaultGracefulShutdown = new GracefulShutdown();
  }
  return defaultGracefulShutdown;
}

module.exports = { GracefulShutdown, createGracefulShutdown, getDefaultGracefulShutdown };
