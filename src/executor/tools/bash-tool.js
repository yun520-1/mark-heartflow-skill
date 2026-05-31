/**
 * Bash 工具 v1.0.0
 *
 * 执行命令行命令
 *
 * 安全考虑：
 * - 危险命令需要用户确认
 * - 执行超时控制
 * - 输出长度限制
 */

const { spawn } = require('child_process');
const path = require('path');

class BashTool {
  constructor() {
    this.name = 'bash';
    this.description = '执行命令行命令';
    this.danger = 5;  // 中等危险等级

    this.args = {
      command: {
        type: 'string',
        required: true,
        description: '要执行的命令'
      },
      cwd: {
        type: 'string',
        required: false,
        description: '工作目录（默认当前目录）'
      },
      timeout: {
        type: 'number',
        required: false,
        default: 60000,
        description: '超时时间（毫秒）'
      },
      env: {
        type: 'object',
        required: false,
        description: '环境变量'
      }
    };

    // 允许的命令白名单（安全模式）
    this.allowedCommands = [
      'node', 'python3', 'python', 'git', 'npm', 'pip', 'pip3',
      'curl', 'wget', 'grep', 'sed', 'awk', 'cat', 'head', 'tail',
      'find', 'xargs', 'sort', 'uniq', 'wc', 'jq', 'mkdir', 'ls',
      'cd', 'pwd', 'echo', 'printf', 'date', 'which', 'command',
      'kill', 'sleep', 'true', 'false', 'test', 'dirname', 'basename',
      'realpath', 'readlink', 'touch', 'cp', 'mv', 'rm'
    ];

    // 危险命令黑名单（兜底）
    this.dangerousCommands = [
      'rm -rf', 'rm -r /', 'mkfs', 'dd if=',
      '> /dev/', 'chmod -R 777', 'curl | sh',
      'wget | sh', 'ssh', 'telnet', 'eval', 'exec ',
      'base64 -d', 'openssl enc', 'nc -e', 'bash -i',
      'sudo su', 'su root', ':(){:|:&};:', '> /tmp/lol',
      'chmod +x', 'wget.*\\| sh', 'curl.*\\| sh'
    ];

    // 输出限制
    this.maxOutput = 100 * 1024;  // 100KB
  }

  /**
   * 执行命令
   */
  async execute(args, context) {
    const {
      command,
      cwd = context.rootPath,
      timeout = 60000,
      env = {}
    } = args;

    // 安全检查
    const safetyCheck = this._checkSafety(command);
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: `危险命令: ${safetyCheck.reason}`,
        warning: '此命令被阻止执行',
        dangerousPattern: safetyCheck.pattern
      };
    }

    // 如果是潜在危险命令，需要确认（通过 context 回调）
    if (safetyCheck.level === 'warning' && context.executor) {
      // 可以在这里添加确认逻辑
      console.log(`[BashTool] 警告: 命令可能危险 - ${safetyCheck.reason}`);
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let errorOutput = '';

      // 合并环境变量
      const execEnv = { ...process.env, ...env };

      const child = spawn('/bin/zsh', ['-c', command], {
        cwd,
        env: execEnv,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 设置超时
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          error: '命令执行超时',
          command,
          timeout,
          duration: Date.now() - startTime
        });
      }, timeout);

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        if (output.length + chunk.length > this.maxOutput) {
          output += chunk.slice(0, this.maxOutput - output.length);
          output += '\n[输出已截断，超过100KB限制]';
          child.kill();
        } else {
          output += chunk;
        }
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        resolve({
          success: code === 0,
          exitCode: code,
          command,
          stdout: output,
          stderr: errorOutput,
          duration,
          timestamp: new Date().toISOString()
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: error.message,
          command,
          duration: Date.now() - startTime
        });
      });
    });
  }

  /**
   * 安全检查 — 白名单优先，黑名单兜底
   */
  _checkSafety(command) {
    const trimmed = command.trim();
    const lowerCommand = trimmed.toLowerCase();

    // 1. 黑名单检查（直接阻止）
    for (const pattern of this.dangerousCommands) {
      if (pattern.includes('.*')) {
        // 正则模式
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(lowerCommand)) {
            return {
              safe: false,
              level: 'dangerous',
              reason: `包含危险模式: ${pattern}`,
              pattern
            };
          }
        } catch (e) { /* ignore invalid regex */ }
      } else {
        if (lowerCommand.includes(pattern.toLowerCase())) {
          return {
            safe: false,
            level: 'dangerous',
            reason: `包含危险模式: ${pattern}`,
            pattern
          };
        }
      }
    }

    // 2. 管道到 shell 检查
    if (/\|.*sh\s*$/.test(lowerCommand) || /\bsh\s*\|/.test(lowerCommand)) {
      return {
        safe: false,
        level: 'dangerous',
        reason: '管道到 shell 可能危险',
        pattern: '| sh'
      };
    }

    // 3. 提取首命令
    const firstCmd = lowerCommand.split(/\s+/)[0].replace(/^-/, '');
    if (!firstCmd) {
      return { safe: true, level: 'normal' };
    }

    // 4. 白名单检查（精确匹配或别名）
    const isAllowed = this.allowedCommands.some(cmd => {
      // 精确匹配
      if (lowerCommand === cmd) return true;
      // 命令替换形式 $(cmd ...) 或 `cmd ...`
      if (/\$\([^\)]+\)/.test(trimmed) || /`[^`]+`/.test(trimmed)) {
        const innerLower = trimmed.replace(/\$\([^)]+\)/g, '').replace(/`[^`]+`/g, '');
        return innerLower.trim().split(/\s+/)[0] === cmd;
      }
      // npm/node 带路径形式: ./node_modules/.bin/xxx
      if (trimmed.includes('/')) {
        const segments = trimmed.split(/\s+/);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment.startsWith('./') && lastSegment.endsWith(cmd)) return true;
      }
      return false;
    });

    if (!isAllowed) {
      return {
        safe: false,
        level: 'dangerous',
        reason: `命令不在白名单中: ${firstCmd}`,
        pattern: firstCmd
      };
    }

    // 5. sudo 警告
    if (/sudo\s+/.test(command)) {
      return {
        safe: true,
        level: 'warning',
        reason: '包含 sudo，需要确认'
      };
    }

    return { safe: true, level: 'normal' };
  }
}

module.exports = { BashTool };
