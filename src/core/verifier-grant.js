/**
 * verifier-grant.js v1.0.0 — 非对称签名授权验证层
 *
 * 社区来源：pydantic/pydantic-ai #5536 (Whatsonyourmind)
 *
 * 核心设计：
 * 1. 三层密钥层级：Root Key（离线）→ Session Key → Grant Key
 * 2. Grant 结构绑定：tool_call_id + args_digest + workflow_run_id + expiry
 * 3. 两阶段消费追踪：max_retries 计数器
 * 4. 信号丢失处理：幂等创建 + TTL
 *
 * 与 decision-router 的关系：
 * - decision-router 做内部置信度评估（U/D/A/H 场域）
 * - verifier-grant 做外部签名验证（谁授权了这个决策）
 * - 两者正交互补：一个可信的决策需要同时通过内部评估和外部签名
 */

const crypto = require('crypto');

// ─── 密钥生成 ───────────────────────────────────────────────────────────

/**
 * 生成 RSA-SHA256 密钥对
 */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

/**
 * 用私钥签名数据（使用 RSA-SHA256，兼容所有 Node.js 版本）
 */
function sign(data, privateKey) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(typeof data === 'string' ? data : JSON.stringify(data));
  return signer.sign(privateKey, 'base64');
}

/**
 * 用公钥验证签名
 */
function verify(data, signature, publicKey) {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(typeof data === 'string' ? data : JSON.stringify(data));
  return verifier.verify(publicKey, signature, 'base64');
}

// ─── 默认配置 ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  grantTTL: 30000,            // grant 有效期 30 秒
  maxRetries: 3,              // 同一 grant 最大重试次数
  keyRotationDays: 90,        // Root Key 轮换周期（天）
  sessionKeyTTL: 3600000,     // Session Key 有效期 1 小时
  idempotencyWindow: 5000,    // 幂等去重窗口 5 秒
};

// ─── Grant 管理器 ────────────────────────────────────────────────────────

class VerifierGrant {
  /**
   * @param {object} [options]
   * @param {number} [options.grantTTL=30000]
   * @param {number} [options.maxRetries=3]
   * @param {number} [options.keyRotationDays=90]
   * @param {number} [options.sessionKeyTTL=3600000]
   */
  constructor(options = {}) {
    this.name = 'VerifierGrant';
    this.version = '1.0.0';

    const config = { ...DEFAULT_CONFIG, ...options };
    this._grantTTL = config.grantTTL;
    this._maxRetries = config.maxRetries;
    this._keyRotationDays = config.keyRotationDays;
    this._sessionKeyTTL = config.sessionKeyTTL;

    // 密钥存储
    this._rootKey = null;       // { publicKey, privateKey, createdAt }
    this._sessionKeys = [];     // [{ publicKey, privateKey, sessionId, createdAt, expiresAt }]
    this._currentSessionId = null;

    // grant 消费追踪: { grantId: { used: number, max: number, createdAt: timestamp } }
    this._grantConsumption = new Map();

    // 幂等去重: { dedupKey: timestamp }
    this._idempotencyCache = new Map();

    // 审计日志
    this._auditLog = [];

    // 初始化 Root Key
    this._initRootKey();
  }

  // ─── 密钥管理 ─────────────────────────────────────────────────────────

  /**
   * 初始化 Root Key（如果不存在）
   */
  _initRootKey() {
    if (!this._rootKey) {
      const pair = generateKeyPair();
      this._rootKey = {
        ...pair,
        createdAt: Date.now(),
      };
      this._log('audit', 'root_key_created', { createdAt: this._rootKey.createdAt });
    }
  }

  /**
   * 创建新的 Session Key（由 Root Key 签名）
   * @returns {string} sessionId
   */
  createSessionKey() {
    const pair = generateKeyPair();
    const sessionId = `sess_${crypto.randomBytes(8).toString('hex')}`;
    const now = Date.now();

    const sessionKey = {
      ...pair,
      sessionId,
      createdAt: now,
      expiresAt: now + this._sessionKeyTTL,
    };

    // Root Key 签名 Session 公钥（证明这个 session 是合法的）
    sessionKey.signature = sign(sessionKey.publicKey, this._rootKey.privateKey);

    this._sessionKeys.push(sessionKey);
    this._currentSessionId = sessionId;

    this._log('audit', 'session_key_created', { sessionId, expiresAt: sessionKey.expiresAt });

    // 清理过期 session
    this._cleanExpiredSessions();

    return sessionId;
  }

  /**
   * 验证 Session Key 是否有效
   * @param {string} sessionId
   * @returns {boolean}
   */
  verifySessionKey(sessionId) {
    const sk = this._sessionKeys.find(s => s.sessionId === sessionId);
    if (!sk) return false;
    if (Date.now() > sk.expiresAt) return false;

    // 用 Root 公钥验证 Session 签名
    return verify(sk.publicKey, sk.signature, this._rootKey.publicKey);
  }

  /**
   * 清理过期 Session
   */
  _cleanExpiredSessions() {
    const now = Date.now();
    this._sessionKeys = this._sessionKeys.filter(s => now < s.expiresAt);
  }

  // ─── Grant 生命周期 ────────────────────────────────────────────────────

  /**
   * 计算 args_digest
   * @param {string} toolName
   * @param {object} params
   * @param {string} agentId
   * @param {number} round
   * @returns {string}
   */
  computeArgsDigest(toolName, params, agentId, round) {
    const canonical = JSON.stringify({
      tool: toolName,
      params: this._canonicalizeParams(params),
      agent: agentId,
      round,
    });
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * 规范化参数（排序 key，统一类型）
   */
  _canonicalizeParams(params) {
    if (typeof params !== 'object' || params === null) return params;
    if (Array.isArray(params)) return params.map(p => this._canonicalizeParams(p));
    const sorted = {};
    Object.keys(params).sort().forEach(k => {
      sorted[k] = this._canonicalizeParams(params[k]);
    });
    return sorted;
  }

  /**
   * 创建授权 Grant
   *
   * @param {object} opts
   * @param {string} opts.toolCallId - 工具调用 ID
   * @param {string} opts.toolName - 工具名称
   * @param {object} opts.params - 调用参数
   * @param {string} opts.agentId - Agent ID
   * @param {number} opts.round - 调用轮次
   * @param {string} [opts.workflowRunId] - 工作流运行 ID（可选）
   * @param {number} [opts.maxRetries] - 最大重试次数（默认配置值）
   * @param {number} [opts.ttl] - 有效期 ms（默认配置值）
   * @returns {object|null} grant 对象，失败返回 null
   */
  createGrant(opts) {
    const {
      toolCallId,
      toolName,
      params,
      agentId,
      round,
      workflowRunId = `run_${Date.now()}`,
      maxRetries = this._maxRetries,
      ttl = this._grantTTL,
    } = opts;

    // 验证参数
    if (!toolCallId || !toolName || !agentId) {
      this._log('error', 'grant_creation_failed', { reason: 'missing_required_params', toolCallId });
      return null;
    }

    // 确保有 Session Key
    if (!this._currentSessionId || !this.verifySessionKey(this._currentSessionId)) {
      this.createSessionKey();
    }

    const now = Date.now();
    const argsDigest = this.computeArgsDigest(toolName, params, agentId, round);
    const grantId = `grt_${crypto.randomBytes(8).toString('hex')}`;

    // 幂等性检查：相同 (toolCallId + argsDigest + workflowRunId) 在窗口期内
    const dedupKey = `${toolCallId}|${argsDigest}|${workflowRunId}`;
    const existing = this._idempotencyCache.get(dedupKey);
    if (existing && (now - existing) < this._idempotencyWindow) {
      this._log('warn', 'grant_duplicate_suppressed', { dedupKey, grantId });
      return null;
    }
    this._idempotencyCache.set(dedupKey, now);

    // 构建 grant payload
    const grantPayload = {
      grantId,
      toolCallId,
      argsDigest,
      workflowRunId,
      agentId,
      round,
      maxRetries,
      expiresAt: now + ttl,
      sessionId: this._currentSessionId,
    };

    // 用 Session 私钥签名
    const sessionKey = this._sessionKeys.find(s => s.sessionId === this._currentSessionId);
    grantPayload.signature = sign(grantPayload, sessionKey.privateKey);
    grantPayload.signer = 'session_key';

    // 注册消费追踪
    this._grantConsumption.set(grantId, {
      used: 0,
      max: maxRetries,
      createdAt: now,
      expiresAt: now + ttl,
      dedupKey,
    });

    this._log('audit', 'grant_created', {
      grantId,
      toolCallId,
      argsDigest: argsDigest.slice(0, 16) + '...',
      workflowRunId,
      maxRetries,
      ttl,
    });

    return grantPayload;
  }

  /**
   * 验证并消费 Grant
   *
   * @param {object} grant - grant 对象
   * @param {object} callContext - 当前调用上下文
   * @param {string} callContext.toolCallId
   * @param {string} callContext.toolName
   * @param {object} callContext.params
   * @param {string} callContext.agentId
   * @param {number} callContext.round
   * @param {string} [callContext.workflowRunId]
   * @returns {object} { valid, reason, remaining }
   */
  consumeGrant(grant, callContext) {
    const result = { valid: false, reason: null, remaining: 0 };

    // 1. grant 对象存在
    if (!grant || !grant.grantId) {
      result.reason = 'missing_grant';
      return result;
    }

    // 2. grant 未过期
    if (Date.now() > grant.expiresAt) {
      result.reason = 'grant_expired';
      this._log('warn', 'grant_expired', { grantId: grant.grantId });
      return result;
    }

    // 3. 验证签名
    const sessionKey = this._sessionKeys.find(s => s.sessionId === grant.sessionId);
    if (!sessionKey) {
      result.reason = 'session_key_not_found';
      this._log('error', 'session_key_not_found', { sessionId: grant.sessionId });
      return result;
    }

    // 重建 payload 验证签名（排除 signature 字段自身）
    const payloadToVerify = {
      grantId: grant.grantId,
      toolCallId: grant.toolCallId,
      argsDigest: grant.argsDigest,
      workflowRunId: grant.workflowRunId,
      agentId: grant.agentId,
      round: grant.round,
      maxRetries: grant.maxRetries,
      expiresAt: grant.expiresAt,
      sessionId: grant.sessionId,
    };

    if (!verify(payloadToVerify, grant.signature, sessionKey.publicKey)) {
      result.reason = 'signature_mismatch';
      this._log('error', 'signature_mismatch', { grantId: grant.grantId });
      return result;
    }

    // 4. 验证 args_digest 匹配
    const expectedDigest = this.computeArgsDigest(
      callContext.toolName,
      callContext.params,
      callContext.agentId,
      callContext.round
    );

    if (grant.argsDigest !== expectedDigest) {
      result.reason = 'args_mismatch';
      this._log('warn', 'args_mismatch', {
        grantId: grant.grantId,
        expected: expectedDigest.slice(0, 16),
        actual: grant.argsDigest.slice(0, 16),
      });
      return result;
    }

    // 5. 验证 toolCallId 匹配
    if (grant.toolCallId !== callContext.toolCallId) {
      result.reason = 'call_id_mismatch';
      this._log('warn', 'call_id_mismatch', { grantId: grant.grantId });
      return result;
    }

    // 6. 消费追踪
    const consumption = this._grantConsumption.get(grant.grantId);
    if (!consumption) {
      result.reason = 'grant_not_registered';
      return result;
    }

    if (consumption.used >= consumption.max) {
      result.reason = 'max_retries_exceeded';
      result.remaining = 0;
      this._log('warn', 'max_retries_exceeded', {
        grantId: grant.grantId,
        used: consumption.used,
        max: consumption.max,
      });
      return result;
    }

    // 消费一次
    consumption.used++;
    result.valid = true;
    result.remaining = consumption.max - consumption.used;
    result.used = consumption.used;
    result.maxRetries = consumption.max;

    this._log('audit', 'grant_consumed', {
      grantId: grant.grantId,
      remaining: result.remaining,
    });

    return result;
  }

  /**
   * 吊销 Grant
   * @param {string} grantId
   * @returns {boolean}
   */
  revokeGrant(grantId) {
    const consumption = this._grantConsumption.get(grantId);
    if (!consumption) return false;
    consumption.used = consumption.max;  // 设置为已耗尽
    this._log('audit', 'grant_revoked', { grantId });
    return true;
  }

  // ─── 状态查询 ─────────────────────────────────────────────────────────

  /**
   * 获取状态统计
   */
  getStats() {
    return {
      version: this.version,
      rootKeyAge: this._rootKey ? Math.floor((Date.now() - this._rootKey.createdAt) / 1000) + 's' : 'none',
      sessionKeyCount: this._sessionKeys.length,
      currentSessionId: this._currentSessionId,
      sessionValid: this._currentSessionId ? this.verifySessionKey(this._currentSessionId) : false,
      activeGrants: this._grantConsumption.size,
      consumedGrants: Array.from(this._grantConsumption.values()).filter(c => c.used > 0).length,
      auditLogCount: this._auditLog.length,
      config: {
        grantTTL: this._grantTTL,
        maxRetries: this._maxRetries,
        sessionKeyTTL: this._sessionKeyTTL,
      },
    };
  }

  /**
   * 获取审计日志
   * @param {number} [limit=20]
   * @returns {Array}
   */
  getAuditLog(limit = 20) {
    return this._auditLog.slice(-limit);
  }

  /**
   * 重置（清空所有密钥和 grant）
   */
  reset() {
    this._rootKey = null;
    this._sessionKeys = [];
    this._currentSessionId = null;
    this._grantConsumption.clear();
    this._idempotencyCache.clear();
    this._initRootKey();
    this._log('audit', 'system_reset', {});
    return true;
  }

  // ─── 内部方法 ─────────────────────────────────────────────────────────

  _log(level, event, data = {}) {
    this._auditLog.push({
      level,
      event,
      data,
      timestamp: new Date().toISOString(),
    });
    // 限制日志大小
    if (this._auditLog.length > 1000) {
      this._auditLog = this._auditLog.slice(-500);
    }
  }
}

// ─── 导出 ───────────────────────────────────────────────────────────────

module.exports = { VerifierGrant, generateKeyPair, sign, verify };
