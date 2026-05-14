/**
 * FileWriteTool — 文件写入工具
 * @version v0.12.50
 *
 * 创建或覆盖写入本地文件，支持自动创建父目录。
 * 默认工作目录为 workspacePath（ToolContext 提供）。
 *
 * 安全特性：
 *   - 路径白名单校验（防止写入 /etc、/usr 等敏感目录）
 *   - 不允许覆盖已存在文件（除非显式指定 force）
 *   - 不允许写入二进制文件
 *
 * 使用示例：
 *   const tool = new FileWriteTool();
 *   const result = await tool.execute({
 *     path: '~/project/new-file.ts',
 *     content: 'export const version = "1.0";',
 *   });
 */
import { Tool, ToolMetadata, ToolResult } from './Tool';
declare const METADATA: ToolMetadata;
/** 禁止写入的路径前缀（扩展安全边界） */
declare const BLOCKED_PREFIXES: string[];
export declare class FileWriteTool extends Tool {
    protected readonly metadata: ToolMetadata;
    execute(args: Record<string, unknown>, _ctx?: Record<string, unknown>): Promise<ToolResult>;
    /** 展开 ~ 并解析为绝对路径 */
    private _resolvePath;
    /** 检查是否在黑名单前缀内（带路径分隔符边界检查） */
    private _isBlocked;
    /** 检测是否为二进制内容 */
    private _isBinary;
}
export { METADATA as FILE_WRITE_TOOL_METADATA, BLOCKED_PREFIXES };
//# sourceMappingURL=FileWriteTool.d.ts.map