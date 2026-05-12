/**
 * HeartFlow Diagnostic Collector v11.25.0
 * 
 * 来源: compound-eng-debugging (ClawHub) collect-diagnostics.sh
 * 转换为 Node.js 模块，供调试和根因分析时使用
 * 
 * 功能：收集系统信息、Git 状态、项目元数据、诊断报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DiagnosticCollector {
  constructor() {
    this.report = [];
  }

  /**
   * 执行命令，返回 stdout 或 null（失败时）
   */
  _exec(cmd, options = {}) {
    try {
      const result = execSync(cmd, { 
        encoding: 'utf8', 
        timeout: 5000,
        ...options 
      });
      return result.trim();
    } catch (e) {
      return null;
    }
  }

  /**
   * 收集系统信息
   */
  collectSystem() {
    const info = {
      section: 'System',
      items: []
    };

    const uname = this._exec('uname -s -r');
    if (uname) info.items.push({ key: 'OS', value: uname });
    
    const arch = this._exec('uname -m');
    if (arch) info.items.push({ key: 'Arch', value: arch });
    
    info.items.push({ key: 'Shell', value: process.env.SHELL || 'unknown' });
    info.items.push({ key: 'Node', value: process.version });
    info.items.push({ key: 'Platform', value: os.platform() });
    info.items.push({ key: 'User', value: os.userInfo().username });
    info.items.push({ key: 'CWD', value: process.cwd() });
    info.items.push({ key: 'NodeEnv', value: process.env.NODE_ENV || 'not set' });

    return info;
  }

  /**
   * 收集资源状态
   */
  collectResources() {
    const info = {
      section: 'Resources',
      items: []
    };

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    info.items.push({ 
      key: 'Memory', 
      value: `${Math.round(usedMem / 1024 / 1024 / 1024)}GB / ${Math.round(totalMem / 1024 / 1024 / 1024)}GB used` 
    });
    info.items.push({ 
      key: 'CPUs', 
      value: `${os.cpus().length} cores` 
    });

    try {
      const df = execSync('df -h . | tail -1', { encoding: 'utf8' }).trim();
      info.items.push({ key: 'Disk', value: df });
    } catch (e) {}

    return info;
  }

  /**
   * 收集 Git 状态
   */
  collectGit(repoPath = process.cwd()) {
    const info = {
      section: 'Git',
      items: []
    };

    const isInsideWorkTree = this._exec('git rev-parse --is-inside-work-tree', { cwd: repoPath });
    if (isInsideWorkTree !== 'true') {
      info.items.push({ key: 'Status', value: 'Not a git repository' });
      return info;
    }

    const branch = this._exec('git branch --show-current', { cwd: repoPath });
    info.items.push({ key: 'Branch', value: branch || 'detached' });

    const lastCommit = this._exec('git log -1 --format="%h %s"', { cwd: repoPath });
    if (lastCommit) info.items.push({ key: 'Last commit', value: lastCommit });

    const dirty = this._exec('git status --porcelain', { cwd: repoPath });
    const dirtyCount = dirty ? dirty.split('\n').filter(l => l.trim()).length : 0;
    info.items.push({ key: 'Dirty files', value: String(dirtyCount) });

    const remote = this._exec('git remote get-url origin', { cwd: repoPath });
    if (remote) info.items.push({ key: 'Remote', value: remote });

    try {
      const tag = this._exec('git describe --tags --abbrev=0', { cwd: repoPath });
      if (tag) info.items.push({ key: 'Latest tag', value: tag });
    } catch (e) {}

    return info;
  }

  /**
   * 收集环境变量（脱敏）
   */
  collectEnv() {
    const info = {
      section: 'Environment',
      items: []
    };

    const sensitive = ['API_KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'PRIVATE', 'AUTH'];
    const env = process.env;

    for (const [key, value] of Object.entries(env)) {
      const isSensitive = sensitive.some(s => key.includes(s));
      if (isSensitive) {
        info.items.push({ key, value: '[REDACTED]' });
      } else if (key.startsWith('HF_') || key.startsWith('HEARTFLOW_') || key.startsWith('HERMES_')) {
        info.items.push({ key, value: value || '(empty)' });
      }
    }

    return info;
  }

  /**
   * 收集进程信息
   */
  collectProcess() {
    const info = {
      section: 'Process',
      items: []
    };

    info.items.push({ key: 'PID', value: String(process.pid) });
    info.items.push({ key: ' uptime', value: `${(process.uptime()).toFixed(1)}s` });
    info.items.push({ key: ' argv', value: process.argv.slice(0, 3).join(' ') });
    
    const mem = process.memoryUsage();
    info.items.push({ 
      key: 'Heap Used', 
      value: `${Math.round(mem.heapUsed / 1024 / 1024)}MB` 
    });
    info.items.push({ 
      key: 'Heap Total', 
      value: `${Math.round(mem.heapTotal / 1024 / 1024)}MB` 
    });
    info.items.push({ 
      key: 'RSS', 
      value: `${Math.round(mem.rss / 1024 / 1024)}MB` 
    });

    return info;
  }

  /**
   * 生成 Markdown 格式报告
   */
  toMarkdown() {
    const lines = [
      '# Diagnostic Report',
      `**Collected:** ${new Date().toISOString()}`,
      '',
    ];

    for (const section of this.sections) {
      lines.push(`## ${section.section}`);
      lines.push('');
      lines.push('| Property | Value |');
      lines.push('|----------|-------|');
      for (const item of section.items) {
        const escaped = String(item.value).replace(/\|/g, '\\|');
        lines.push(`| ${item.key} | ${escaped} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 生成 JSON 格式报告
   */
  toJSON() {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      sections: this.sections,
    }, null, 2);
  }

  /**
   * 收集完整诊断报告
   * @param {Object} options - {git: bool, env: bool, format: 'markdown'|'json'}
   */
  collect(options = {}) {
    const { git = true, env = false, format = 'markdown' } = options;
    this.sections = [];

    this.sections.push(this.collectSystem());
    this.sections.push(this.collectResources());
    this.sections.push(this.collectProcess());
    if (git) this.sections.push(this.collectGit());
    if (env) this.sections.push(this.collectEnv());

    return format === 'json' ? this.toJSON() : this.toMarkdown();
  }
}

module.exports = { DiagnosticCollector };
