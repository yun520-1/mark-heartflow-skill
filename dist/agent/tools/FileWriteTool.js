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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_PREFIXES = exports.FILE_WRITE_TOOL_METADATA = exports.FileWriteTool = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Tool_1 = require("./Tool");
const METADATA = {
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
exports.FILE_WRITE_TOOL_METADATA = METADATA;
/** 禁止写入的路径前缀 */
const BLOCKED_PREFIXES = ['/etc', '/usr', '/var', '/bin', '/sbin', '/sys', '/proc', '/dev'];
exports.BLOCKED_PREFIXES = BLOCKED_PREFIXES;
class FileWriteTool extends Tool_1.Tool {
    metadata = METADATA;
    async execute(args, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx) {
        try {
            this.validateArgs(args);
            const rawPath = this.getArg(args, 'path');
            const content = this.getArg(args, 'content');
            const force = this.getArg(args, 'force', false) ?? false;
            const encoding = this.getArg(args, 'encoding', 'utf8') ?? 'utf8';
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
            const bytesWritten = fs.writeFileSync(filePath, content, encoding);
            return {
                success: true,
                output: {
                    path: filePath,
                    bytesWritten: Buffer.byteLength(content, encoding),
                    created: !fs.existsSync(filePath) || force,
                },
                metadata: { encoding },
            };
        }
        catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    /** 展开 ~ 并解析为绝对路径 */
    _resolvePath(rawPath) {
        if (rawPath.startsWith('~/')) {
            return path.join(process.env.HOME ?? '/Users/apple', rawPath.slice(2));
        }
        return path.isAbsolute(rawPath) ? rawPath : path.resolve(rawPath);
    }
    /** 检查是否在黑名单前缀内 */
    _isBlocked(filePath) {
        const normalized = path.normalize(filePath);
        return BLOCKED_PREFIXES.some(prefix => normalized.startsWith(prefix));
    }
    /** 检测是否为二进制内容 */
    _isBinary(content) {
        // 包含 null 字节通常是二进制
        return content.includes('\0');
    }
}
exports.FileWriteTool = FileWriteTool;
//# sourceMappingURL=FileWriteTool.js.map