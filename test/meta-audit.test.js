/**
 * 元审计修复 TDD 测试
 * 验证：审计基础设施自己诚信（不再假装审计）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hf-meta-audit-'));
}

function run({ test, assertEqual, assertTrue, assertFalse }) {
  // === audit-logger 真落盘 ===
  test('AuditLogger.log 真写入磁盘文件', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'audit-log.jsonl');
    const logger = new AuditLogger({ logPath });
    logger.log('security_event', { user: 'alice' });
    logger.log('config_change', { key: 'x' });
    assertTrue(fs.existsSync(logPath), '日志文件应存在');
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    assertEqual(lines.length, 2);
    const entry = JSON.parse(lines[0]);
    assertEqual(entry.e, 'security_event');
    assertTrue(typeof entry.h === 'string'); // 防篡改哈希
  });

  test('AuditLogger 重启后能从磁盘恢复', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'audit-log.jsonl');
    const l1 = new AuditLogger({ logPath });
    l1.log('evt1', {});
    l1.close();
    // 新实例应能从磁盘加载已有日志
    const l2 = new AuditLogger({ logPath });
    const recent = l2.readRecent(10);
    assertTrue(recent.length >= 1);
    assertEqual(recent[recent.length - 1].e, 'evt1');
  });

  test('AuditLogger getStats 报告持久化状态', () => {
    const { AuditLogger } = require('../src/shield/audit-logger.js');
    const root = tmpRoot();
    const logPath = path.join(root, 'audit-log.jsonl');
    const logger = new AuditLogger({ logPath });
    logger.log('x', {});
    const stats = logger.getStats();
    assertTrue(stats.persisted);
  });

  // === module-health-checker 真禁用 ===
  test('失败模块被真禁用(isDisabled)', () => {
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const fakeHf = {
      _modules: {
        good: { name: 'good' },
        bad: null // 模拟加载失败
      }
    };
    const checker = new ModuleHealthChecker(fakeHf);
    const report = checker.check();
    assertTrue(report.failed >= 1);
    assertTrue(checker.isDisabled('bad'), 'bad 模块应被禁用');
    assertTrue(report.disabled.includes('bad'), 'report 应含 disabled 清单');
  });

  test('健康模块不被禁用', () => {
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const fakeHf = { _modules: { good: { name: 'good', destroy() {}, getStats() { return {}; } } } };
    const checker = new ModuleHealthChecker(fakeHf);
    checker.check();
    assertFalse(checker.isDisabled('good'));
  });

  test('getDisabled 返回禁用清单', () => {
    const { ModuleHealthChecker } = require('../src/shield/module-health-checker.js');
    const fakeHf = { _modules: { broken: null } };
    const checker = new ModuleHealthChecker(fakeHf);
    checker.check();
    const disabled = checker.getDisabled();
    assertTrue(disabled.includes('broken'));
  });
}

module.exports = run;
