/**
 * 元审计闭环 TDD 测试
 * 验证：审计能力被真调用并落盘（不再是装饰）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hf-audit-cli-'));
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  test('AuditLogger 能真落盘 engine_start 事件', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const { HeartFlow } = require('../src/core/heartflow.js');
    const root = tmpRoot();
    const dataDir = path.join(root, 'data');
    const engine = new HeartFlow({ dataDir, silent: true });
    engine.start();
    const logger = new AuditLogger({ logPath: path.join(dataDir, 'audit', 'audit-log.jsonl') });
    logger.log('engine_start', { version: engine.version });
    const stats = logger.getStats();
    assertTrue(stats.persisted);
    engine.shutdown();
  });

  test('ModuleHealthChecker 在引擎上真跑(非仅MCP)', () => {
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const { HeartFlow } = require('../src/core/heartflow.js');
    const root = tmpRoot();
    const engine = new HeartFlow({ dataDir: path.join(root, 'data'), silent: true });
    engine.start();
    const checker = new ModuleHealthChecker(engine);
    const report = checker.check();
    assertTrue(report.totalModules > 0);
    assertTrue(typeof report.healthy === 'number');
    engine.shutdown();
  });

  test('审计日志含防篡改哈希', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'audit-log.jsonl');
    const logger = new AuditLogger({ logPath });
    logger.log('security_event', { user: 'alice' });
    const line = fs.readFileSync(logPath, 'utf8').trim().split('\n')[0];
    const entry = JSON.parse(line);
    assertTrue(typeof entry.h === 'string' && entry.h.length === 12);
  });
}

module.exports = run;
