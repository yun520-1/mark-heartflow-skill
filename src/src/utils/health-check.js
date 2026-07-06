/**
 * HeartFlow v5.8.2 — 健康检查（生产环境优化）
 * 
 * 功能: HTTP 健康检查端点、系统指标收集、负载均衡器集成
 */

const http = require('http');
const os = require('os');

class HealthCheck {
  constructor(options = {}) {
    this.interval = options.interval || 30000;  // 30秒检查一次
    this.checks = new Map();  // checkName → checkFunction
    this.status = 'starting';
    this.lastCheck = null;
    this.metrics = {
      uptime: 0,
      memoryUsage: {},
      cpuUsage: 0,
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    };
    this.startTime = Date.now();
    this.server = null;
  }

  /**
   * 注册健康检查
   */
  register(name, checkFunction) {
    this.checks.set(name, checkFunction);
    console.log(`[HealthCheck] Registered check: ${name}`);
  }

  /**
   * 运行所有健康检查
   */
  async runChecks() {
    const results = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = { healthy: true, ...result };
      } catch (error) {
        results[name] = { healthy: false, error: error.message };
        allHealthy = false;
      }
    }

    this.status = allHealthy ? 'healthy' : 'unhealthy';
    this.lastCheck = new Date().toISOString();

    // 更新指标
    this.updateMetrics();

    return {
      status: this.status,
      timestamp: this.lastCheck,
      uptime: this.metrics.uptime,
      memory: this.metrics.memoryUsage,
      checks: results
    };
  }

  /**
   * 更新系统指标
   */
  updateMetrics() {
    this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);  // 秒
    this.metrics.memoryUsage = process.memoryUsage();
    
    const loadAvg = os.loadavg();
    this.metrics.cpuUsage = loadAvg[0];  // 1分钟平均负载
  }

  /**
   * 启动健康检查服务（HTTP 端点）
   */
  startServer(port = 8080, options = {}) {
    const server = http.createServer(async (req, res) => {
      // CORS 支持
      res.setHeader('Access-Control-Allow-Origin', options.corsOrigin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === '/health' || req.url === '/health/') {
        try {
          const health = await this.runChecks();
          const statusCode = health.status === 'healthy' ? 200 : 503;

          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(health, null, 2));

          // 记录请求
          this.metrics.requestCount++;
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
          this.metrics.errorCount++;
        }
      } else if (req.url === '/metrics' || req.url === '/metrics/') {
        // Prometheus 风格指标
        const metrics = this.getPrometheusMetrics();

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(metrics);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });

    server.listen(port, () => {
      console.log(`[HealthCheck] Server started on port ${port}`);
      console.log(`[HealthCheck] Health endpoint: http://localhost:${port}/health`);
      console.log(`[HealthCheck] Metrics endpoint: http://localhost:${port}/metrics`);
    });

    this.server = server;

    return server;
  }

  /**
   * 获取 Prometheus 风格指标
   */
  getPrometheusMetrics() {
    const lines = [];

    // 系统指标
    lines.push(`# HELP heartflow_up Uptime in seconds`);
    lines.push(`# TYPE heartflow_up gauge`);
    lines.push(`heartflow_up ${this.metrics.uptime}`);

    lines.push(`# HELP heartflow_memory_rss Memory RSS in bytes`);
    lines.push(`# TYPE heartflow_memory_rss gauge`);
    lines.push(`heartflow_memory_rss ${this.metrics.memoryUsage.rss}`);

    lines.push(`# HELP heartflow_memory_heap_used Heap used in bytes`);
    lines.push(`# TYPE heartflow_memory_heap_used gauge`);
    lines.push(`heartflow_memory_heap_used ${this.metrics.memoryUsage.heapUsed}`);

    lines.push(`# HELP heartflow_cpu_usage CPU usage (load average)`);
    lines.push(`# TYPE heartflow_cpu_usage gauge`);
    lines.push(`heartflow_cpu_usage ${this.metrics.cpuUsage}`);

    lines.push(`# HELP heartflow_requests_total Total requests`);
    lines.push(`# TYPE heartflow_requests_total counter`);
    lines.push(`heartflow_requests_total ${this.metrics.requestCount}`);

    lines.push(`# HELP heartflow_errors_total Total errors`);
    lines.push(`# TYPE heartflow_errors_total counter`);
    lines.push(`heartflow_errors_total ${this.metrics.errorCount}`);

    lines.push(`# HELP heartflow_status System status (0=unhealthy, 1=healthy)`);
    lines.push(`# TYPE heartflow_status gauge`);
    lines.push(`heartflow_status ${this.status === 'healthy' ? 1 : 0}`);

    return lines.join('\n');
  }

  /**
   * 停止健康检查服务
   */
  stopServer() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[HealthCheck] Server stopped');
          resolve();
        });
      });
    }
    return Promise.resolve();
  }
}

/**
 * 预配置的健康检查
 */
function createDefaultHealthCheck(memorySystem, llmCaller) {
  const healthCheck = new HealthCheck();

  // 1. 检查记忆系统
  healthCheck.register('memory_system', async () => {
    const testId = 'health_check_' + Date.now();
    const start = Date.now();

    try {
      // 添加测试记忆
      await memorySystem.add({ id: testId, content: 'health check test' });

      // 检索测试记忆
      const retrieved = await memorySystem.get(testId);

      // 删除测试记忆
      await memorySystem.delete(testId);

      const latency = Date.now() - start;

      if (!retrieved) {
        throw new Error('Memory system not responding');
      }

      return { latency };
    } catch (error) {
      throw new Error(`Memory system check failed: ${error.message}`);
    }
  });

  // 2. 检查 LLM API
  healthCheck.register('llm_api', async () => {
    if (!llmCaller) {
      return { skipped: true, reason: 'No LLM caller configured' };
    }

    const start = Date.now();

    try {
      await llmCaller('test');
      const latency = Date.now() - start;

      if (latency > 5000) {
        throw new Error('LLM API latency too high');
      }

      return { latency };
    } catch (error) {
      throw new Error(`LLM API check failed: ${error.message}`);
    }
  });

  // 3. 检查系统资源
  healthCheck.register('system_resources', async () => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;

    const warnings = [];

    // 堆内存使用超过 1GB
    if (heapUsedMB > 1024) {
      warnings.push(`Heap memory usage high: ${heapUsedMB.toFixed(2)}MB`);
    }

    // 堆内存使用超过 80%
    if (heapUsedMB / heapTotalMB > 0.8) {
      warnings.push(`Heap memory usage > 80%: ${(heapUsedMB / heapTotalMB * 100).toFixed(2)}%`);
    }

    return {
      heapUsedMB: heapUsedMB.toFixed(2),
      heapTotalMB: heapTotalMB.toFixed(2),
      warnings: warnings.length > 0 ? warnings : null
    };
  });

  return healthCheck;
}

module.exports = { HealthCheck, createDefaultHealthCheck };
