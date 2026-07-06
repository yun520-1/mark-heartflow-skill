/**
 * HeartFlow v5.8.1 — 输入验证器（防止 XSS、注入攻击）
 * 
 * 来源: Node.js Best Practices (goldbergyoni/nodebestpractices)
 * 功能: Schema 验证、XSS 防护、输入清理
 */

class InputValidator {
  constructor(options = {}) {
    this.schemas = new Map();
    this.logger = options.logger || console;
  }

  /**
   * 定义验证 Schema
   * 
   * Schema 格式：
   * {
   *   type: 'object',
   *   properties: {
   *     message: { type: 'string', maxLength: 10000 },
   *     memoryId: { type: 'string', pattern: '^mem_[a-f0-9]{16}$' },
   *     sessionId: { type: 'string', pattern: '^session_\\d+_[a-z0-9]{9}$' }
   *   },
   *   required: ['message']
   * }
   */
  defineSchema(name, schema) {
    this.schemas.set(name, schema);
    this.logger.info(`[InputValidator] Schema defined: ${name}`);
  }

  /**
   * 验证输入
   */
  validate(input, schemaName) {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      const error = new Error(`Schema ${schemaName} not found`);
      error.name = 'SchemaNotFoundError';
      throw error;
    }

    const errors = [];

    // 检查类型
    if (schema.type && typeof input !== schema.type.replace('array', 'object')) {
      if (schema.type === 'array' && !Array.isArray(input)) {
        errors.push(`Input must be ${schema.type}`);
      } else if (schema.type !== 'array' && typeof input !== schema.type) {
        errors.push(`Input must be ${schema.type}`);
      }
    }

    // 检查必填字段
    if (schema.required) {
      for (const field of schema.required) {
        if (input[field] === undefined || input[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // 检查字段类型与格式
    if (schema.properties) {
      for (const [field, config] of Object.entries(schema.properties)) {
        if (input[field] === undefined || input[field] === null) continue;

        // 类型检查
        if (config.type === 'string' && typeof input[field] !== 'string') {
          errors.push(`Field ${field} must be string`);
        }

        if (config.type === 'number' && typeof input[field] !== 'number') {
          errors.push(`Field ${field} must be number`);
        }

        if (config.type === 'boolean' && typeof input[field] !== 'boolean') {
          errors.push(`Field ${field} must be boolean`);
        }

        if (config.type === 'array' && !Array.isArray(input[field])) {
          errors.push(`Field ${field} must be array`);
        }

        // 字符串长度检查
        if (config.maxLength && typeof input[field] === 'string' && input[field].length > config.maxLength) {
          errors.push(`Field ${field} exceeds max length ${config.maxLength}`);
        }

        if (config.minLength && typeof input[field] === 'string' && input[field].length < config.minLength) {
          errors.push(`Field ${field} below min length ${config.minLength}`);
        }

        // 数字范围检查
        if (config.maximum && typeof input[field] === 'number' && input[field] > config.maximum) {
          errors.push(`Field ${field} exceeds maximum ${config.maximum}`);
        }

        if (config.minimum && typeof input[field] === 'number' && input[field] < config.minimum) {
          errors.push(`Field ${field} below minimum ${config.minimum}`);
        }

        // 正则检查
        if (config.pattern && typeof input[field] === 'string') {
          const regex = new RegExp(config.pattern);
          if (!regex.test(input[field])) {
            errors.push(`Field ${field} does not match pattern`);
          }
        }

        // 枚举检查
        if (config.enum && !config.enum.includes(input[field])) {
          errors.push(`Field ${field} must be one of: ${config.enum.join(', ')}`);
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * XSS 防护：转义 HTML 特殊字符
   */
  escapeHtml(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * XSS 防护：清理 HTML 标签
   */
  sanitizeHtml(input) {
    if (typeof input !== 'string') return input;

    // 移除所有 HTML 标签
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * 清理输入（通用）
   */
  sanitize(input, options = {}) {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // HTML 转义
    if (options.escapeHtml !== false) {
      sanitized = this.escapeHtml(sanitized);
    }

    // 移除 HTML 标签
    if (options.stripHtml) {
      sanitized = this.sanitizeHtml(sanitized);
    }

    // 移除控制字符
    if (options.stripControlChars) {
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    }

    // 截断长度
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * 验证并清理（组合方法）
   */
  validateAndSanitize(input, schemaName, sanitizeOptions = {}) {
    // 先验证
    const validation = this.validate(input, schemaName);
    if (!validation.valid) {
      return { valid: false, errors: validation.errors };
    }

    // 再清理
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value, sanitizeOptions);
      } else {
        sanitized[key] = value;
      }
    }

    return { valid: true, sanitized };
  }
}

/**
 * 预定义常用 Schema
 */
const CommonSchemas = {
  // 记忆添加请求
  MemoryAddRequest: {
    type: 'object',
    properties: {
      content: { type: 'string', maxLength: 10000, minLength: 1 },
      type: { type: 'string', enum: ['episodic', 'semantic', 'procedural'] },
      metadata: { type: 'object' }
    },
    required: ['content']
  },

  // 记忆查询请求
  MemoryQueryRequest: {
    type: 'object',
    properties: {
      query: { type: 'string', maxLength: 1000, minLength: 1 },
      type: { type: 'string', enum: ['episodic', 'semantic', 'procedural'] },
      limit: { type: 'number', minimum: 1, maximum: 100 }
    },
    required: ['query']
  },

  // LLM 调用请求
  LLMCallRequest: {
    type: 'object',
    properties: {
      prompt: { type: 'string', maxLength: 50000, minLength: 1 },
      model: { type: 'string', maxLength: 100 },
      maxTokens: { type: 'number', minimum: 1, maximum: 100000 }
    },
    required: ['prompt']
  }
};

/**
 * 创建预配置的验证器
 */
function createValidator(options) {
  const validator = new InputValidator(options);

  // 注册常用 Schema
  for (const [name, schema] of Object.entries(CommonSchemas)) {
    validator.defineSchema(name, schema);
  }

  return validator;
}

/**
 * 默认验证器（全局复用）
 */
let defaultValidator = null;

function getDefaultValidator() {
  if (!defaultValidator) {
    defaultValidator = createValidator();
  }
  return defaultValidator;
}

module.exports = { InputValidator, CommonSchemas, createValidator, getDefaultValidator };
