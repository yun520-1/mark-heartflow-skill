/**
 * Tool.ts — HeartFlow 内置工具基类
 * @version v0.12.50
 *
 * 所有内置工具（WebSearchTool、FileReadTool 等）都继承自 Tool。
 * 工具是可组合的构建块，agent 通过工具注册表发现和调用工具。
 *
 * 设计原则：
 *   - 每个工具职责单一（SRP）
 *   - 输入/输出类型安全（TypeScript interface）
 *   - 支持异步执行
 *   - 工具元数据用于注册表发现
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tool = void 0;
// ─── Tool 基类 ────────────────────────────────────────────────────────────────
class Tool {
    /** 返回工具元数据（用于注册表） */
    getMetadata() {
        return { ...this.metadata };
    }
    /** 返回工具名称 */
    get name() {
        return this.metadata.name;
    }
    /** 返回工具分类 */
    get category() {
        return this.metadata.category;
    }
    /**
     * validateArgs — 校验参数是否符合 schema
     * @throws Error 当必填参数缺失或类型错误时
     */
    validateArgs(args) {
        for (const param of this.metadata.params) {
            if (param.required && !(param.name in args)) {
                throw new Error(`Missing required parameter: ${param.name}`);
            }
        }
    }
    /**
     * getArg — 安全获取参数，带默认值
     */
    getArg(args, name, defaultValue) {
        return args[name] ?? defaultValue;
    }
    /** 工具描述（方便日志） */
    toString() {
        return `Tool(${this.metadata.name})`;
    }
}
exports.Tool = Tool;
//# sourceMappingURL=Tool.js.map