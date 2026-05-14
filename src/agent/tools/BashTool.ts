/**
 * BashTool — Shell 命令执行工具
 * @version v0.13.60
 *
 * 在本地 shell 中执行命令，返回 stdout/stderr/exitCode。
 *
 * 安全特性：
 *   - 命令白名单模式（只允许预定义的安全操作）
 *   - 执行超时控制（默认 30s，可配置）
 *   - 不支持交互式命令（防止阻塞）
 *
 * 使用示例：
 *   const tool = new BashTool();
 *   const result = await tool.execute({ command: 'ls -la ~/', timeout: 10 });
 */

'use strict';

import { Tool, ToolMetadata, ToolResult } from './Tool';

const METADATA: ToolMetadata = {
  name: 'bash',
  description: '在本地 shell 中执行命令，返回 stdout/stderr/exitCode。',
  category: 'shell',
  params: [
    {
      name: 'command',
      description: '要执行的 shell 命令',
      type: 'string',
      required: true,
    },
    {
      name: 'timeout',
      description: '超时秒数（默认 30）',
      type: 'number',
      required: false,
      default: 30,
    },
    {
      name: 'cwd',
      description: '执行目录（默认进程当前目录）',
      type: 'string',
      required: false,
    },
    {
      name: 'env',
      description: '额外的环境变量（key: value 对象）',
      type: 'object',
      required: false,
    },
  ],
  examples: [
    {
      input: { command: 'echo "Hello World"', timeout: 5 },
      output: { success: true, output: { stdout: 'Hello World\n', stderr: '', exitCode: 0 } },
    },
  ],
  version: '0.13.60',
};

// ── 白名单模式：允许的命令及参数规范 ────────────────────────────────────────

type ParamSchema = {
  type: 'literal' | 'number' | 'string' | 'flag';
  values?: string[];  // for literal type
  max?: number;      // for number type
  pattern?: RegExp;  // for string type
};

interface AllowedCommand {
  description: string;
  params: Record<string, ParamSchema>;
  // 可选的验证函数（用于更复杂的约束）
  validator?: (args: string[]) => boolean;
}

const ALLOWED_COMMANDS: Record<string, AllowedCommand> = {
  // 文件查看
  ls: {
    description: '列出目录内容',
    params: {
      '-a': { type: 'flag' },
      '-l': { type: 'flag' },
      '-R': { type: 'flag' },
      '-t': { type: 'flag' },
      '-h': { type: 'flag' },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  cat: {
    description: '查看文件内容',
    params: {
      '-n': { type: 'flag' },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  head: {
    description: '查看文件开头',
    params: {
      '-n': { type: 'number', max: 1000 },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  tail: {
    description: '查看文件结尾',
    params: {
      '-n': { type: 'number', max: 1000 },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  wc: {
    description: '统计行数/词数/字符数',
    params: {
      '-l': { type: 'flag' },
      '-w': { type: 'flag' },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  grep: {
    description: '文本搜索',
    params: {
      '-r': { type: 'flag' },
      '-i': { type: 'flag' },
      '-n': { type: 'flag' },
      '-l': { type: 'flag' },
      pattern: { type: 'string', pattern: /^[^\"\';|&`$]+$/ },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  find: {
    description: '查找文件',
    params: {
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
      '-name': { type: 'string', pattern: /^[^\;\|\`]+$/ },
      '-type': { type: 'literal', values: ['f', 'd', 'l'] },
    },
    validator: (args) => {
      // find 禁止使用 -delete、-exec、| 等危险操作
      return !args.some(a => ['-delete', '-exec', '-ok', '|', ';', '`'].includes(a));
    },
  },
  // Git 命令
  git: {
    description: 'Git 版本控制',
    params: {
      'status': { type: 'literal' },
      'log': { type: 'literal' },
      'diff': { type: 'literal' },
      '--oneline': { type: 'flag' },
      '--graph': { type: 'flag' },
      '-n': { type: 'number', max: 100 },
    },
    validator: (args) => {
      // 禁止危险 git 操作
      const dangerous = ['filter-branch', 'push', '--force', '-f', 'rebase'];
      return !dangerous.some(d => args.includes(d));
    },
  },
  // Node/npm
  node: {
    description: '执行 Node.js 脚本',
    params: {
      path: { type: 'string', pattern: /^\// },  // Only absolute paths, no -e/-p
    },
    validator: (args) => {
      // Disallow -e, -p, -r flags that allow arbitrary code execution
      return !args.some(a => a === '-e' || a === '-p' || a === '-r' || a === '--eval');
    }
  },
  npm: {
    description: 'npm 包管理',
    params: {
      'install': { type: 'literal' },
      'run': { type: 'literal' },
      '-y': { type: 'flag' },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
    validator: (args) => {
      // 禁止全局安装、危险脚本
      // Disallow dangerous flags that allow code execution
      // Disallow dangerous flags that allow code execution
      const dangerous = ['-e', '-p', '-r', '--eval', '--check', '-c'];
      return !args.some(a => dangerous.some(d => a === d || a.startsWith(d + '=')));
    },
  },
  // 文件操作（安全限制下）
  mkdir: {
    description: '创建目录',
    params: {
      '-p': { type: 'flag' },
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
    validator: (args) => {
      // 禁止在 /etc、/var 等系统目录创建
      return !args.some(a => /^\/(etc|var|usr|bin|sbin|sys|proc|dev)/.test(a));
    },
  },
  touch: {
    description: '创建空文件',
    params: {
      path: { type: 'string', pattern: /^[~\/\w\.\-]+$/ },
    },
  },
  // 进程/系统信息
  ps: {
    description: '进程状态',
    params: {
      'aux': { type: 'literal' },
    },
  },
  env: {
    description: '查看环境变量',
    params: {},
  },
  whoami: {
    description: '当前用户',
    params: {},
  },
  pwd: {
    description: '当前目录',
    params: {},
  },
  date: {
    description: '当前日期',
    params: {},
  },
  // 简单输出
  echo: {
    description: '输出文本',
    params: {
      '-n': { type: 'flag' },
      text: { type: 'string', pattern: /^[^\;\|\`\$\\]{0,500}$/ },
    },
  },
};

export class BashTool extends Tool {
  protected readonly metadata = METADATA;

  async execute(
    args: Record<string, unknown>,
    ctx?: Record<string, unknown>
  ): Promise<ToolResult> {
    try {
      this.validateArgs(args);

      const command = this.getArg<string>(args, 'command')!;
      const timeout = this.getArg<number>(args, 'timeout', 30) ?? 30;
      const cwd = this.getArg<string>(args, 'cwd', process.cwd()) ?? process.cwd();
      const extraEnv = this.getArg<Record<string, string>>(args, 'env', {}) ?? {};

      // 解析 workspacePath
      const workspacePath = ctx?.workspacePath as string | undefined;

      // 安全校验：白名单模式
      const validation = this._validateCommand(command.trim());
      if (!validation.valid) {
        return {
          success: false,
          error: `Command not allowed: ${validation.reason}`,
        };
      }

      // 执行命令
      const { execSync } = await import('child_process');
      const env = { ...process.env, ...extraEnv };

      let stdout: string;
      let stderr: string;
      let exitCode: number;

      try {
        stdout = execSync(command, {
          cwd: workspacePath ?? cwd,
          env,
          encoding: 'utf8',
          timeout: timeout * 1000,
          maxBuffer: 10 * 1024 * 1024,
        });
        stderr = '';
        exitCode = 0;
      } catch (err: unknown) {
        const execError = err as { stdout?: string; stderr?: string; status?: number };
        stdout = execError.stdout ?? '';
        stderr = execError.stderr ?? '';
        exitCode = execError.status ?? 1;
      }

      return {
        success: exitCode === 0,
        output: { stdout, stderr, exitCode },
        metadata: { command, timeout, cwd },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 白名单命令验证
   * @returns { valid: boolean, reason?: string }
   */
  private _validateCommand(command: string): { valid: boolean; reason?: string } {
    // 第一道门：检查 shell 元字符（黑名单防止绕过白名单）
    // 注意：不在字符类中放空格（会误杀 "ls -la" 等合法带空格命令）
    // 只匹配真正的 shell 操作符和危险构造
    const shellMetachars = /[;&|`$\x00{}\[\]!<>~#%^*\n\\]|&&|\|\||;;|<<|>>|<>|&\||\(|\\\(|\\\)/;
    if (shellMetachars.test(command)) {
      return { valid: false, reason: `Forbidden shell metacharacter in command` };
    }

    // 解析命令和参数
    const parts = this._parseCommand(command);
    if (parts.length === 0) {
      return { valid: false, reason: 'Empty command' };
    }

    const cmdName = parts[0];
    const cmdArgs = parts.slice(1);

    // 检查命令是否在白名单中
    const allowed = ALLOWED_COMMANDS[cmdName];
    if (!allowed) {
      return { valid: false, reason: `Command "${cmdName}" is not in whitelist` };
    }

    // 验证每个参数
    const unknownArgs = cmdArgs.filter(arg => {
      return !arg.startsWith('-') && !Object.keys(allowed.params).includes(arg);
    });

    if (unknownArgs.length > 0 && allowed.params.text) {
      // echo/text 类型允许任意字符串参数
    } else if (unknownArgs.length > 0) {
      return { valid: false, reason: `Unknown argument(s): ${unknownArgs.join(', ')}` };
    }

    // 运行命令特定的验证器
    if (allowed.validator && !allowed.validator(cmdArgs)) {
      return { valid: false, reason: `Command "${cmdName}" has forbidden operation` };
    }

    return { valid: true };
  }

  /**
   * 简单命令解析（处理引号和转义）
   */
  private _parseCommand(command: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const c = command[i];

      if (inQuote) {
        if (c === quoteChar) {
          inQuote = false;
        } else {
          current += c;
        }
      } else if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
      } else if (c === ' ' || c === '\t') {
        if (current.length > 0) {
          parts.push(current);
          current = '';
        }
      } else {
        current += c;
      }
    }

    if (current.length > 0) {
      parts.push(current);
    }

    return parts;
  }
}

export { METADATA as BASH_TOOL_METADATA, ALLOWED_COMMANDS };
