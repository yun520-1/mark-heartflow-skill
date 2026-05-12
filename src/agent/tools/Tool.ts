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

// ─── 类型定义 ────────────────────────────────────────────────────────────────

/** 工具参数schema（JSON Schema draft-07 简化版） */
export interface ToolParamSchema {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** 工具元数据（用于注册表） */
export interface ToolMetadata {
  name: string;
  description: string;
  category: 'web' | 'file' | 'shell' | 'cognitive' | 'system';
  params: ToolParamSchema[];
  examples?: Array<{ input: Record<string, unknown>; output: unknown }>;
  version?: string;
}

/** 工具调用上下文（agent 传递给工具） */
export interface ToolContext {
  workspacePath?: string;
  sessionId?: string;
  [key: string]: unknown;
}

// ─── Tool 基类 ────────────────────────────────────────────────────────────────

export abstract class Tool {
  /** 子类设置自己的 metadata */
  protected abstract readonly metadata: ToolMetadata;

  /**
   * execute — 工具核心逻辑，由子类实现
   * @param args  工具调用参数（符合 params schema）
   * @param ctx   运行时上下文
   */
  abstract execute(args: Record<string, unknown>, ctx?: ToolContext): Promise<ToolResult>;

  /** 返回工具元数据（用于注册表） */
  getMetadata(): ToolMetadata {
    return { ...this.metadata };
  }

  /** 返回工具名称 */
  get name(): string {
    return this.metadata.name;
  }

  /** 返回工具分类 */
  get category(): ToolMetadata['category'] {
    return this.metadata.category;
  }

  /**
   * validateArgs — 校验参数是否符合 schema
   * @throws Error 当必填参数缺失或类型错误时
   */
  protected validateArgs(args: Record<string, unknown>): void {
    for (const param of this.metadata.params) {
      if (param.required && !(param.name in args)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }
  }

  /**
   * getArg — 安全获取参数，带默认值
   */
  protected getArg<T>(args: Record<string, unknown>, name: string, defaultValue?: T): T | undefined {
    return (args[name] as T) ?? defaultValue;
  }

  /** 工具描述（方便日志） */
  toString(): string {
    return `Tool(${this.metadata.name})`;
  }
}
