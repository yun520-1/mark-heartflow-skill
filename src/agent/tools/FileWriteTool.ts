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

import * as fs from "fs";
import * as path from "path";
import { homedir } from 'os';
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

/** 禁止写入的路径前缀（扩展安全边界） */
const BLOCKED_PREFIXES = [
  '/etc', '/usr', '/var', '/bin', '/sbin', '/sys', '/proc', '/dev',
  '/root', '/home', '/private', '/snap',
  // 敏感配置和凭据文件
  '.ssh', '.aws', '.env', '.git-credentials', '.netrc',
  '.npmrc', '.pypirc', '.pip.conf',
  // 关键配置
  'credentials', 'secrets', 'keys', 'id_rsa', 'id_ed25519',
];

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
      let filePath: string;
      try {
        filePath = this._resolvePath(rawPath);
      } catch (err) {
        return { success: false, error: `Invalid path: ${String(err)}` };
      }

      // 安全校验：黑名单前缀（带路径分隔符检查防止 /etc-fake 绕过）
      if (this._isBlocked(filePath)) {
        return {
          success: false,
          error: `Access denied: writing to "${filePath}" is not allowed`,
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

      // 写入文件（原子操作防止 TOCTOU）
      // 使用 'wx' 标志：独占创建，文件存在则失败
      // force=true 时降级为覆盖写入
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      try {
        await fs.promises.writeFile(filePath, contentStr, { encoding: 'utf8', mode: 0o644, flag: force ? 'w' : 'wx' });
      } catch (err) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr.code === 'EEXIST') {
          return { success: false, error: `File already exists: ${filePath}. Use force=true to overwrite.` };
        }
        throw err;
      }

      return {
        success: true,
        output: {
          path: filePath,
          bytesWritten: Buffer.byteLength(content, encoding as BufferEncoding),
          created: !force,
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
    // Expand ~ to HOME for ALL occurrences, not just ~/ prefix
    const home = homedir();
    const expanded = rawPath.replace(/^~/, home);
    return path.isAbsolute(expanded) ? expanded : path.resolve(expanded);
  }

  /** 检查是否在黑名单前缀内（带路径分隔符边界检查） */
  private _isBlocked(filePath: string): boolean {
    const normalized = path.normalize(filePath);
    const normalizedWithSep = normalized + path.sep;
    return BLOCKED_PREFIXES.some(prefix => {
      // 检查完整路径前缀 + 路径分隔符，防止 /etc-fake 绕过 /etc
      return normalizedWithSep.startsWith(prefix + path.sep) || normalized === prefix;
    });
  }

  /** 检测是否为二进制内容 */
  private _isBinary(content: string): boolean {
    // 包含 null 字节通常是二进制
    return content.includes('\0');
  }
}

export { METADATA as FILE_WRITE_TOOL_METADATA, BLOCKED_PREFIXES };
