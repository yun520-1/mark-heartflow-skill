/**
 * WebSearchTool — 通用网页搜索工具
 * @version v0.12.50
 *
 * 使用 cn-web-search 技能执行中文/英文多引擎聚合搜索。
 * 当没装 cn-web-search 时降级为 curl 裸请求。
 *
 * 使用示例：
 *   const tool = new WebSearchTool();
 *   const result = await tool.execute({ query: "HeartFlow 最新版本", maxResults: 5 });
 */
import { Tool, ToolMetadata, ToolResult } from './Tool';
declare const METADATA: ToolMetadata;
export declare class WebSearchTool extends Tool {
    protected readonly metadata: ToolMetadata;
    execute(args: Record<string, unknown>, _ctx?: Record<string, unknown>): Promise<ToolResult>;
    /**
     * 通过 cn-web-search 技能执行搜索
     */
    private _searchViaCnWebSearch;
    /**
     * 通过 curl 请求免费搜索 API（DuckDuckGo Instant Answer API）
     */
    private _searchViaCurl;
}
export { METADATA as WEB_SEARCH_TOOL_METADATA };
//# sourceMappingURL=WebSearchTool.d.ts.map