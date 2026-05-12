/**
 * BashTool — Shell 命令执行工具
 * @version v0.12.50
 *
 * 在本地 shell 中执行命令，返回 stdout/stderr/exitCode。
 *
 * 安全特性：
 *   - 危险命令黑名单（rm -rf / 等）
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
  version: '0.12.50',
};

/** 危险命令黑名单（正则） */
const DANGEROUS_PATTERNS = [
  /^\s*rm\s+-rf\s+\/\s*$/,                    // rm -rf /
  /^\s*rm\s+-rf\s+\/.*--no-preserve-root/,   // rm -rf /... --no-preserve-root
  /^\s*dd\s+if=.*of=\/dev\//,                 // dd to /dev
  /^\s*mkfs\./,                                // mkfs.*
  /^\s*format\s+/,                             // format
  /^\s*wget\s+.*\|\s*sh/,                      // wget ... | sh
  /^\s*curl\s+.*\|\s*sh/,                      // curl ... | sh
  /^:\(\)\{.*:\|:&.*\}/,                       // fork bomb
];

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

      // 安全校验：危险命令
      if (this._isDangerous(command)) {
        return {
          success: false,
          error: `Command blocked: potentially dangerous command detected: ${command.slice(0, 50)}...`,
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
          maxBuffer: 10 * 1024 * 1024, // 10MB
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

  /** 检测危险命令 */
  private _isDangerous(command: string): boolean {
    return DANGEROUS_PATTERNS.some(pattern => pattern.test(command.trim()));
  }
}

export { METADATA as BASH_TOOL_METADATA, DANGEROUS_PATTERNS };
