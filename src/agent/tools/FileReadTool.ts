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

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { Tool, ToolMetadata, ToolResult } from './Tool';

const METADATA: ToolMetadata = {
  name: 'file_read',
  description: '读取本地文件内容，支持分页（offset/limit）和编码指定。',
  category: 'file',
  params: [
    {
      name: 'path',
      description: '文件绝对路径（支持 ~/ 展开）',
      type: 'string',
      required: true,
    },
    {
      name: 'offset',
      description: '起始行号（1-indexed，默认 1）',
      type: 'number',
      required: false,
      default: 1,
    },
    {
      name: 'limit',
      description: '最多读取行数（默认 500，max 2000）',
      type: 'number',
      required: false,
      default: 500,
    },
    {
      name: 'encoding',
      description: '文件编码（默认 utf8）',
      type: 'string',
      required: false,
      default: 'utf8',
    },
  ],
  examples: [
    {
      input: { path: '~/README.md', limit: 50 },
      output: { success: true, output: { content: '# Hello\n...', linesRead: 50 } },
    },
  ],
  version: '0.12.50',
};

/** 允许读取的根目录白名单（收紧：不允许整个 home，只允许特定子目录） */
const ALLOWED_ROOTS = [
  path.join(process.env.HOME ?? '/Users/apple', '.hermes', 'skills'),
  path.join(process.env.HOME ?? '/Users/apple', '.hermes', 'cron'),
  path.join(process.env.HOME ?? '/Users/apple', '.hermes', 'memory'),
  path.join(process.env.HOME ?? '/Users/apple', '.hermes', 'config'),
  path.join(process.env.HOME ?? '/Users/apple', '.hermes', 'data'),
  '/tmp',
  '/var/folders',  // macOS temporary directories
];

export class FileReadTool extends Tool {
  protected readonly metadata = METADATA;

  async execute(
    args: Record<string, unknown>,
    ctx?: Record<string, unknown>
  ): Promise<ToolResult> {
    try {
      this.validateArgs(args);

      const rawPath = this.getArg<string>(args, 'path')!;
      const offset = this.getArg<number>(args, 'offset', 1) ?? 1;
      const limit = Math.min(this.getArg<number>(args, 'limit', 500) ?? 500, 2000);
      const encoding = this.getArg<string>(args, 'encoding', 'utf8') ?? 'utf8';

      // 解析路径（展开 ~）
      const filePath = this._resolvePath(rawPath);

      // 安全校验：确保文件在白名单目录下
      if (!this._isAllowed(filePath)) {
        return {
          success: false,
          error: `Access denied: path "${filePath}" is outside allowed directories`,
        };
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `File not found: ${filePath}` };
      }

      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        return { success: false, error: `Path is a directory, not a file: ${filePath}` };
      }

      // 分页读取
      const content = this._readPaginated(filePath, offset, limit, encoding);

      return {
        success: true,
        output: {
          path: filePath,
          content,
          linesRead: content.split('\n').length,
          totalLines: this._countLines(filePath, encoding),
          offset,
          limit,
          encoding,
        },
        metadata: { sizeBytes: stat.size },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** 展开 ~ 并解析为绝对路径 */
  private _resolvePath(rawPath: string): string {
    if (rawPath.startsWith('~/')) {
      return path.join(process.env.HOME ?? '/Users/apple', rawPath.slice(2));
    }
    return path.isAbsolute(rawPath) ? rawPath : path.resolve(rawPath);
  }

  /** 检查路径是否在白名单目录内 */
  private _isAllowed(filePath: string): boolean {
    const normalized = path.normalize(filePath);
    return ALLOWED_ROOTS.some(root => normalized.startsWith(root));
  }

  /** 分页读取文件指定行范围 */
  private _readPaginated(filePath: string, offset: number, limit: number, encoding: string): string {
    const content = fs.readFileSync(filePath, encoding as BufferEncoding);
    const lines = content.split('\n');
    const start = Math.max(0, offset - 1);
    const end = Math.min(start + limit, lines.length);
    return lines.slice(start, end).join('\n');
  }

  /** 快速统计总行数（不读取全部内容） */
  private _countLines(filePath: string, encoding: string): number {
    const content = fs.readFileSync(filePath, encoding as BufferEncoding);
    return content.split('\n').length;
  }
}

export { METADATA as FILE_READ_TOOL_METADATA, ALLOWED_ROOTS };
