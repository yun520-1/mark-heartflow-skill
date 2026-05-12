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
exports.ALLOWED_ROOTS = exports.FILE_READ_TOOL_METADATA = exports.FileReadTool = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Tool_1 = require("./Tool");
const METADATA = {
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
exports.FILE_READ_TOOL_METADATA = METADATA;
/** 允许读取的根目录白名单 */
const ALLOWED_ROOTS = [
    path.join(process.env.HOME ?? '/Users/apple', '.hermes'),
    '/tmp',
    '/Users/apple',
];
exports.ALLOWED_ROOTS = ALLOWED_ROOTS;
class FileReadTool extends Tool_1.Tool {
    metadata = METADATA;
    async execute(args, ctx) {
        try {
            this.validateArgs(args);
            const rawPath = this.getArg(args, 'path');
            const offset = this.getArg(args, 'offset', 1) ?? 1;
            const limit = Math.min(this.getArg(args, 'limit', 500) ?? 500, 2000);
            const encoding = this.getArg(args, 'encoding', 'utf8') ?? 'utf8';
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
    /** 检查路径是否在白名单目录内 */
    _isAllowed(filePath) {
        const normalized = path.normalize(filePath);
        return ALLOWED_ROOTS.some(root => normalized.startsWith(root));
    }
    /** 分页读取文件指定行范围 */
    _readPaginated(filePath, offset, limit, encoding) {
        const content = fs.readFileSync(filePath, encoding);
        const lines = content.split('\n');
        const start = Math.max(0, offset - 1);
        const end = Math.min(start + limit, lines.length);
        return lines.slice(start, end).join('\n');
    }
    /** 快速统计总行数（不读取全部内容） */
    _countLines(filePath, encoding) {
        const content = fs.readFileSync(filePath, encoding);
        return content.split('\n').length;
    }
}
exports.FileReadTool = FileReadTool;
//# sourceMappingURL=FileReadTool.js.map