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
import { Tool, ToolMetadata, ToolResult } from './Tool';
declare const METADATA: ToolMetadata;
type ParamSchema = {
    type: 'literal' | 'number' | 'string' | 'flag';
    values?: string[];
    max?: number;
    pattern?: RegExp;
};
interface AllowedCommand {
    description: string;
    params: Record<string, ParamSchema>;
    validator?: (args: string[]) => boolean;
}
declare const ALLOWED_COMMANDS: Record<string, AllowedCommand>;
export declare class BashTool extends Tool {
    protected readonly metadata: ToolMetadata;
    execute(args: Record<string, unknown>, ctx?: Record<string, unknown>): Promise<ToolResult>;
    /**
     * 白名单命令验证
     * @returns { valid: boolean, reason?: string }
     */
    private _validateCommand;
    /**
     * 简单命令解析（处理引号和转义）
     */
    private _parseCommand;
}
export { METADATA as BASH_TOOL_METADATA, ALLOWED_COMMANDS };
//# sourceMappingURL=BashTool.d.ts.map