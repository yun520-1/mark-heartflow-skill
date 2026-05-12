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
import { Tool, ToolMetadata, ToolResult } from './Tool';
declare const METADATA: ToolMetadata;
/** 危险命令黑名单（正则） */
declare const DANGEROUS_PATTERNS: RegExp[];
export declare class BashTool extends Tool {
    protected readonly metadata: ToolMetadata;
    execute(args: Record<string, unknown>, ctx?: Record<string, unknown>): Promise<ToolResult>;
    /** 检测危险命令 */
    private _isDangerous;
}
export { METADATA as BASH_TOOL_METADATA, DANGEROUS_PATTERNS };
//# sourceMappingURL=BashTool.d.ts.map