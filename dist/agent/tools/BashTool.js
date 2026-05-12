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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DANGEROUS_PATTERNS = exports.BASH_TOOL_METADATA = exports.BashTool = void 0;
const Tool_1 = require("./Tool");
const METADATA = {
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
exports.BASH_TOOL_METADATA = METADATA;
/** 危险命令黑名单（正则） */
const DANGEROUS_PATTERNS = [
    /^\s*rm\s+-rf\s+\/\s*$/, // rm -rf /
    /^\s*rm\s+-rf\s+\/.*--no-preserve-root/, // rm -rf /... --no-preserve-root
    /^\s*dd\s+if=.*of=\/dev\//, // dd to /dev
    /^\s*mkfs\./, // mkfs.*
    /^\s*format\s+/, // format
    /^\s*wget\s+.*\|\s*sh/, // wget ... | sh
    /^\s*curl\s+.*\|\s*sh/, // curl ... | sh
    /^:\(\)\{.*:\|:&.*\}/, // fork bomb
];
exports.DANGEROUS_PATTERNS = DANGEROUS_PATTERNS;
class BashTool extends Tool_1.Tool {
    metadata = METADATA;
    async execute(args, ctx) {
        try {
            this.validateArgs(args);
            const command = this.getArg(args, 'command');
            const timeout = this.getArg(args, 'timeout', 30) ?? 30;
            const cwd = this.getArg(args, 'cwd', process.cwd()) ?? process.cwd();
            const extraEnv = this.getArg(args, 'env', {}) ?? {};
            // 解析 workspacePath
            const workspacePath = ctx?.workspacePath;
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
            let stdout;
            let stderr;
            let exitCode;
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
            }
            catch (err) {
                const execError = err;
                stdout = execError.stdout ?? '';
                stderr = execError.stderr ?? '';
                exitCode = execError.status ?? 1;
            }
            return {
                success: exitCode === 0,
                output: { stdout, stderr, exitCode },
                metadata: { command, timeout, cwd },
            };
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    /** 检测危险命令 */
    _isDangerous(command) {
        return DANGEROUS_PATTERNS.some(pattern => pattern.test(command.trim()));
    }
}
exports.BashTool = BashTool;
//# sourceMappingURL=BashTool.js.map