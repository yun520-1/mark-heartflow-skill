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

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { Tool, ToolMetadata, ToolResult } from './Tool';

const METADATA: ToolMetadata = {
  name: 'file_write',
  description: '创建或覆盖写入本地文件，自动创建父目录。支持文本内容。',
  category: 'file',
  params: [
    {
      name: 'path',
      description: '文件绝对路径（支持 ~/ 展开）',
      type: 'string',
      required: true,
    },
    {
      name: 'content',
      description: '写入的文本内容',
      type: 'string',
      required: true,
    },
    {
      name: 'force',
      description: '是否强制覆盖已存在文件（默认 false）',
      type: 'boolean',
      required: false,
      default: false,
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
      input: { path: '~/test.txt', content: 'Hello World' },
      output: { success: true, output: { path: '...', bytesWritten: 11 } },
    },
  ],
  version: '0.12.50',
};

/** 禁止写入的路径前缀 */
const BLOCKED_PREFIXES = ['/etc', '/usr', '/var', '/bin', '/sbin', '/sys', '/proc', '/dev'];

export class FileWriteTool extends Tool {
  protected readonly metadata = METADATA;

  async execute(
    args: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx?: Record<string, unknown>
  ): Promise<ToolResult> {
    try {
      this.validateArgs(args);

      const rawPath = this.getArg<string>(args, 'path')!;
      const content = this.getArg<string>(args, 'content')!;
      const force = this.getArg<boolean>(args, 'force', false) ?? false;
      const encoding = this.getArg<string>(args, 'encoding', 'utf8') ?? 'utf8';

      // 解析路径
      const filePath = this._resolvePath(rawPath);

      // 安全校验：黑名单前缀
      if (this._isBlocked(filePath)) {
        return {
          success: false,
          error: `Access denied: writing to "${filePath}" is not allowed`,
        };
      }

      // 禁止覆盖已存在文件（除非 force）
      if (!force && fs.existsSync(filePath)) {
        return {
          success: false,
          error: `File already exists: ${filePath}. Use force=true to overwrite.`,
        };
      }

      // 检测二进制内容（包含 null 字节）
      if (this._isBinary(content)) {
        return {
          success: false,
          error: 'Binary content is not supported. Use a different tool for binary files.',
        };
      }

      // 自动创建父目录
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      const bytesWritten = fs.writeFileSync(filePath, content, encoding as BufferEncoding);

      return {
        success: true,
        output: {
          path: filePath,
          bytesWritten: Buffer.byteLength(content, encoding as BufferEncoding),
          created: !fs.existsSync(filePath) || force,
        },
        metadata: { encoding },
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

  /** 检查是否在黑名单前缀内 */
  private _isBlocked(filePath: string): boolean {
    const normalized = path.normalize(filePath);
    return BLOCKED_PREFIXES.some(prefix => normalized.startsWith(prefix));
  }

  /** 检测是否为二进制内容 */
  private _isBinary(content: string): boolean {
    // 包含 null 字节通常是二进制
    return content.includes('\0');
  }
}

export { METADATA as FILE_WRITE_TOOL_METADATA, BLOCKED_PREFIXES };
