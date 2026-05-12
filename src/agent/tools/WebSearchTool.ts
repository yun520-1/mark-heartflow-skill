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

'use strict';

import { Tool, ToolMetadata, ToolResult, ToolParamSchema } from './Tool';

const METADATA: ToolMetadata = {
  name: 'web_search',
  description: '在互联网上搜索信息，支持多引擎聚合（百度/必应/Google等）。返回标题、URL、摘要。',
  category: 'web',
  params: [
    {
      name: 'query',
      description: '搜索关键词或短语',
      type: 'string',
      required: true,
    },
    {
      name: 'maxResults',
      description: '最大返回结果数（默认 5）',
      type: 'number',
      required: false,
      default: 5,
    },
    {
      name: 'language',
      description: '搜索语言偏好: "zh" | "en" | "auto"（默认 "auto"）',
      type: 'string',
      required: false,
      default: 'auto',
      enum: ['zh', 'en', 'auto'],
    },
  ],
  examples: [
    {
      input: { query: 'HeartFlow AI framework', maxResults: 3 },
      output: {
        success: true,
        output: [
          { title: '...', url: '...', snippet: '...' },
        ],
      },
    },
  ],
  version: '0.12.50',
};

export class WebSearchTool extends Tool {
  protected readonly metadata = METADATA;

  async execute(
    args: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx?: Record<string, unknown>
  ): Promise<ToolResult> {
    try {
      this.validateArgs(args);

      const query = this.getArg<string>(args, 'query')!;
      const maxResults = this.getArg<number>(args, 'maxResults', 5) ?? 5;
      const language = this.getArg<string>(args, 'language', 'auto') ?? 'auto';

      // 优先使用 cn-web-search 技能
      const searchResult = await this._searchViaCnWebSearch(query, maxResults, language);

      if (searchResult) {
        return {
          success: true,
          output: searchResult,
          metadata: { engine: 'cn-web-search', query, maxResults, language },
        };
      }

      // 降级：使用 curl 请求免费搜索 API
      const fallback = await this._searchViaCurl(query, maxResults);
      return {
        success: true,
        output: fallback,
        metadata: { engine: 'curl-fallback', query, maxResults },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 通过 cn-web-search 技能执行搜索
   */
  private async _searchViaCnWebSearch(
    query: string,
    maxResults: number,
    language: string
  ): Promise<Array<{ title: string; url: string; snippet: string }> | null> {
    try {
      // 动态加载 cn-web-search 技能的搜索函数
      // @ts-ignore — external skill path
      const { search } = await import('../../../skills/cn-web-search/search.js').catch(
        () => null
      ) as { search?: (q: string, n: number, lang: string) => Promise<unknown> } ?? {};

      if (typeof search === 'function') {
        const result = await search(query, maxResults, language);
        return result as Array<{ title: string; url: string; snippet: string }>;
      }
    } catch {
      // 技能不存在或加载失败，静默降级
    }
    return null;
  }

  /**
   * 通过 curl 请求免费搜索 API（DuckDuckGo Instant Answer API）
   */
  private async _searchViaCurl(
    query: string,
    maxResults: number
  ): Promise<Array<{ title: string; url: string; snippet: string }>> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`;

    const { execSync } = await import('child_process');
    const output = execSync(`curl -s -L --max-time 10 "${url}"`, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    const data = JSON.parse(output);
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: data.Heading ?? query,
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    return results;
  }
}

export { METADATA as WEB_SEARCH_TOOL_METADATA };
