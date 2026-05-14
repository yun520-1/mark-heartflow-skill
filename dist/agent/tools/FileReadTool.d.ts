/**
 * FileReadTool — 文件读取工具
 * @version v0.12.50
 *
 * 读取本地文件内容，支持路径规范化和安全校验。
 * 默认工作目录为 workspacePath（ToolContext 提供）。
 *
 * 使用示例：
 *   const tool = new FileReadTool();
 *   const result = await tool.execute({ path: '~/project/README.md', offset: 1, limit: 100 });
 */
import { Tool, ToolMetadata, ToolResult } from './Tool';
declare const METADATA: ToolMetadata;
/** 允许读取的根目录白名单（收紧：不允许整个 home，只允许特定子目录） */
declare const ALLOWED_ROOTS: string[];
export declare class FileReadTool extends Tool {
    protected readonly metadata: ToolMetadata;
    execute(args: Record<string, unknown>, ctx?: Record<string, unknown>): Promise<ToolResult>;
    /** 展开 ~ 并解析为绝对路径 */
    private _resolvePath;
    /** 检查路径是否在白名单目录内 */
    private _isAllowed;
    /** 分页读取文件指定行范围 */
    private _readPaginated;
    /** 快速统计总行数（对大文件使用 wc -l 避免加载全部内容到内存） */
    private _countLines;
}
export { METADATA as FILE_READ_TOOL_METADATA, ALLOWED_ROOTS };
//# sourceMappingURL=FileReadTool.d.ts.map