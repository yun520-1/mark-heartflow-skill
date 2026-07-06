/**
 * HeartFlow v5.8.1 — 密钥管理器（避免密钥泄露）
 * 
 * 来源: Node.js Best Practices (goldbergyoni/nodebestpractices)
 * 功能: 从环境变量加载密钥、自动脱敏日志、密钥格式验证
 */

class SecretManager {
  constructor(options = {}) {
    this.secrets = new Map();
    this.loadSecrets();
    this.logger = options.logger || console;
  }

  /**
   * 从环境变量加载密钥（不在代码中硬编码）
   */
  loadSecrets() {
    const secretKeys = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'HERMES_WEBUI_ALLOWED_ORIGINS',
      'GITHUB_TOKEN',
      'FEISHU_APP_ID',
      'FEISHU_APP_SECRET',
      'WECHAT_TOKEN'
    ];

    for (const key of secretKeys) {
      if (process.env[key]) {
        this.secrets.set(key, process.env[key]);
        this.logger.info(`[SecretManager] Loaded secret: ${key}`);
      } else {
        this.logger.warn(`[SecretManager] Secret not found: ${key}`);
      }
    }
  }

  /**
   * 获取密钥
   */
  get(secretKey) {
    const value = this.secrets.get(secretKey);
    
    if (!value) {
      const error = new Error(`Secret ${secretKey} not found`);
      error.name = 'SecretNotFoundError';
      throw error;
    }

    return value;
  }

  /**
   * 安全地获取密钥（不存在时返回 null）
   */
  getSafe(secretKey) {
    try {
      return this.get(secretKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * 验证密钥格式
   */
  validate(secretKey, value) {
    const validators = {
      'OPENAI_API_KEY': v => typeof v === 'string' && v.startsWith('sk-') && v.length > 40,
      'ANTHROPIC_API_KEY': v => typeof v === 'string' && v.startsWith('sk-ant-') && v.length > 40,
      'GITHUB_TOKEN': v => typeof v === 'string' && v.length === 40,
      'HERMES_WEBUI_ALLOWED_ORIGINS': v => typeof v === 'string' && v.length > 0
    };

    const validator = validators[secretKey];
    if (!validator) {
      this.logger.warn(`[SecretManager] No validator for ${secretKey}`);
      return true;  // 没有验证器，默认通过
    }

    const isValid = validator(value);
    if (!isValid) {
      this.logger.error(`[SecretManager] Invalid format for ${secretKey}`);
    }

    return isValid;
  }

  /**
   * 清理日志中的密钥（防止泄露到日志）
   */
  sanitizeLog(message) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    let sanitized = message;
    
    // 替换 API Key
    for (const [key, value] of this.secrets) {
      if (value && sanitized.includes(value)) {
        sanitized = sanitized.replace(value, '***');
      }
    }

    // 替换可能的 JWT Token（xxx.yyy.zzz 格式）
    sanitized = sanitized.replace(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, '***');

    // 替换可能的 Base64 编码密钥（长度 >32 的字母数字字符串）
    sanitized = sanitized.replace(/[A-Za-z0-9+\/]{32,}=*/g, '***');

    return sanitized;
  }

  /**
   * 列出所有已加载的密钥名（不返回值）
   */
  listSecrets() {
    const secretNames = [];
    for (const [key] of this.secrets) {
      secretNames.push(key);
    }
    return secretNames;
  }

  /**
   * 检查密钥是否存在
   */
  has(secretKey) {
    return this.secrets.has(secretKey);
  }

  /**
   * 重新加载密钥（从环境变量）
   */
  reload() {
    this.secrets.clear();
    this.loadSecrets();
    this.logger.info('[SecretManager] Secrets reloaded');
  }
}

/**
 * 创建预配置的密钥管理器
 */
function createSecretManager(options) {
  return new SecretManager(options);
}

/**
 * 默认密钥管理器（全局复用）
 */
let defaultSecretManager = null;

function getDefaultSecretManager() {
  if (!defaultSecretManager) {
    defaultSecretManager = new SecretManager();
  }
  return defaultSecretManager;
}

module.exports = { SecretManager, createSecretManager, getDefaultSecretManager };
