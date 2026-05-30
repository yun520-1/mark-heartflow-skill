/**
 * Process 工具 v1.0.0
 *
 * 进程管理：列出进程、杀进程、进程状态
 */

const { exec, spawn } = require('child_process');

class ProcessTool {
  constructor() {
    this.name = 'process';
    this.description = '进程管理工具';
    this.danger = 8;  // 高危险等级（涉及进程管理）

    this.args = {
      action: {
        type: 'string',
        required: true,
        description: '操作: list|kill|info|stats'
      },
      pid: {
        type: 'number',
        required: false,
        description: '进程 ID（kill/info 时需要）'
      },
      name: {
        type: 'string',
        required: false,
        description: '进程名（用于查找）'
      },
      signal: {
        type: 'string',
        required: false,
        default: 'SIGTERM',
        description: '终止信号'
      }
    };
  }

  /**
   * 执行进程操作
   */
  async execute(args, context) {
    const { action, ...rest } = args;

    switch (action) {
      case 'list':
        return await this._list(rest, context);
      case 'kill':
        return await this._kill(rest, context);
      case 'info':
        return await this._info(rest, context);
      case 'stats':
        return await this._stats(rest, context);
      default:
        return {
          success: false,
          error: `未知的操作: ${action}`,
          validActions: ['list', 'kill', 'info', 'stats']
        };
    }
  }

  /**
   * 执行命令
   */
  _run(command, cwd = context?.rootPath || process.cwd()) {
    return new Promise((resolve) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            stderr
          });
        } else {
          resolve({
            success: true,
            stdout,
            stderr
          });
        }
      });
    });
  }

  /**
   * 列出进程
   */
  async _list(args, context) {
    const { name } = args;

    let cmd = 'ps aux';

    const result = await new Promise((resolve) => {
      exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({ success: true, stdout, stderr });
        }
      });
    });

    if (!result.success) {
      return result;
    }

    // 解析进程列表
    const lines = result.stdout.split('\n').filter(l => l.trim());
    const headers = lines[0].split(/\s+/);
    const processes = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length >= 11) {
        const process = {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          mem: parseFloat(parts[3]),
          vsz: parseInt(parts[4]),
          rss: parseInt(parts[5]),
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(' ')
        };
        processes.push(process);
      }
    }

    // 如果指定了名称，过滤
    let filtered = processes;
    if (name) {
      filtered = processes.filter(p =>
        p.command.toLowerCase().includes(name.toLowerCase())
      );
    }

    return {
      success: true,
      count: filtered.length,
      processes: filtered.slice(0, 100),  // 限制返回数量
      total: processes.length
    };
  }

  /**
   * 杀进程
   */
  async _kill(args, context) {
    const { pid, signal = 'SIGTERM' } = args;

    if (!pid) {
      return { success: false, error: 'kill 需要 pid 参数' };
    }

    // [P0安全] 验证pid为数字，防止注入
    if (!/^\d+$/.test(String(pid))) {
      return { success: false, error: 'kill: pid必须是数字' };
    }

    // [P0安全] 白名单signal，防止注入
    const ALLOWED_SIGNALS = ['SIGTERM', 'SIGKILL', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGHUP'];
    const safeSignal = ALLOWED_SIGNALS.includes(signal) ? signal : 'SIGTERM';

    return new Promise((resolve) => {
      exec(`kill -${safeSignal} ${pid}`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            stderr
          });
        } else {
          resolve({
            success: true,
            message: `进程 ${pid} 已发送 ${signal} 信号`,
            stdout
          });
        }
      });
    });
  }

  /**
   * 进程详情
   */
  async _info(args, context) {
    const { pid } = args;

    if (!pid) {
      return { success: false, error: 'info 需要 pid 参数' };
    }

    // [P0安全] 验证pid为数字，防止注入
    if (!/^\d+$/.test(String(pid))) {
      return { success: false, error: 'info: pid必须是数字' };
    }

    return new Promise((resolve) => {
      exec(`ps -p ${pid} -o pid,ppid,user,stat,time,command`, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({
            success: true,
            info: stdout.trim()
          });
        }
      });
    });
  }

  /**
   * 系统统计
   */
  async _stats(args, context) {
    const stats = {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // 获取系统负载
    return new Promise((resolve) => {
      exec('uptime', (error, stdout) => {
        if (error) {
          resolve({
            success: true,
            process: stats
          });
        } else {
          resolve({
            success: true,
            process: stats,
            system: stdout.trim()
          });
        }
      });
    });
  }
}

module.exports = { ProcessTool };
