/**
 * MemoryIntegrity — 记忆完整性安全验证引擎 v1.0.0
 *
 * 基于 "Distributed Attacks in Persistent-State AI Control" (arXiv:2607.02514)：
 * 持久化状态创造新的攻击面——注入的记忆可被后续会话利用。
 * 此模块提供记忆完整性验证机制。
 *
 * 检测能力：
 *   - 记忆注入检测：异常来源、异常模式
 *   - 关键记忆完整性：CORE层写入监控
 *   - 交叉验证：记忆间一致性检查
 *   - 来源追踪：每条记忆的来源和完整性签名
 *
 * 集成:
 *   hf.memoryIntegrity.verify(memory)
 *   hf.memoryIntegrity.sign(memory, source)
 *   hf.memoryIntegrity.detectAnomalies()
 *   hf.memoryIntegrity.getStats()
 */

const crypto = require('crypto');
const VERSION = '1.0.0';

// === 签名/频率 Map 最大容量 ===
const MAX_MAP_SIZE = 200;

/**
 * 带容量保护的 Map.set — 超出容量时淘汰最早插入的条目（LRU）
 * @param {Map} map - 目标 Map
 * @param {*} key - 键
 * @param {*} value - 值
 * @param {number} maxSize - 最大容量
 */
function _boundedSet(map, key, value, maxSize) {
  if (map.size >= maxSize && !map.has(key)) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
  }
  map.set(key, value);
}

// 安全规则
const TRUSTED_SOURCES = ['user', 'system', 'reflection', 'consolidation'];
const SUSPICIOUS_PATTERNS = [
  /忽略.*指令|忽略.*规则|忽略.*安全/i,
  /system\s*prompt/i,
  /你.*现在.*是|你现在是/i,
  /roleplay|扮演|pretend/i,
  /ignore.*previous|disregard/i,
  /execute|eval|exec\s*\(/i,
  /__proto__|constructor|prototype/i,
];

class MemoryIntegrity {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      enableSigning: options.enableSigning !== false,
      strictMode: options.strictMode || false,
      maxAnomalies: options.maxAnomalies || 100,
    };

    this.signatures = new Map();  // memoryId → {source, hash, timestamp}
    this.anomalies = [];
    this.stats = { verified: 0, signed: 0, anomalies: 0 };
  }

  // ─── 核心 API ─────────────────────────────────────────────────────────────

  /**
   * 为记忆条目签名
   * @param {Object} memory - 记忆条目
   * @param {string} source - 来源 ('user'|'system'|'reflection'|'consolidation')
   * @returns {Object} 带签名的记忆
   */
  sign(memory, source = 'system') {
    const content = JSON.stringify({ id: memory.id, content: memory.content, source });
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const signature = {
      source,
      hash,
      timestamp: Date.now(),
      trusted: TRUSTED_SOURCES.includes(source),
    };

    _boundedSet(this.signatures, memory.id, signature, MAX_MAP_SIZE);
    this.stats.signed++;

    return { ...memory, _signature: signature };
  }

  /**
   * 验证记忆完整性
   * @param {Object} memory - 带签名的记忆条目
   * @returns {Object} 验证结果 {valid, issues}
   */
  verify(memory) {
    const issues = [];
    const sig = memory._signature;

    // 1. 检查签名是否存在
    if (!sig) {
      issues.push({ type: 'no_signature', severity: 'medium', message: 'Memory has no signature' });
      this.stats.verified++;
      return { valid: false, issues, recommendation: 'sign' };
    }

    // 2. 验证哈希
    const content = JSON.stringify({ id: memory.id, content: memory.content, source: sig.source });
    const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
    if (sig.hash !== expectedHash) {
      issues.push({ type: 'hash_mismatch', severity: 'high', message: 'Content hash does not match signature' });
    }

    // 3. 检查来源是否可信
    if (!sig.trusted) {
      issues.push({ type: 'untrusted_source', severity: 'high', message: `Source "${sig.source}" is not trusted` });
    }

    // 4. 扫描恶意模式
    const contentStr = memory.content || '';
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(contentStr)) {
        issues.push({
          type: 'suspicious_pattern',
          severity: 'critical',
          message: `Content matches suspicious pattern: ${pattern.source}`,
        });
      }
    }

    // 5. 检查CORE层写入（高优先级监控）
    if (memory.metadata?.tier === 'CORE' || memory.layer === 'semantic') {
      if (sig.source === 'external' || !TRUSTED_SOURCES.includes(sig.source)) {
        issues.push({
          type: 'core_layer_write',
          severity: 'critical',
          message: 'Untrusted source writing to CORE/semantic layer',
        });
      }
    }

    const valid = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0;
    this.stats.verified++;

    return {
      valid,
      issues,
      recommendation: issues.length === 0 ? 'ok' : issues.some(i => i.severity === 'critical') ? 'reject' : 'review',
    };
  }

  /**
   * 批量检测异常
   * @param {Array} memories - 记忆条目数组
   * @returns {Array} 异常列表
   */
  detectAnomalies(memories) {
    const anomalies = [];
    const freqMap = new Map(); // source → count

    for (const mem of memories) {
      const result = this.verify(mem);
      if (!result.valid) {
        anomalies.push({
          memoryId: mem.id,
          ...result,
        });
      }

      // 检测频率异常
      const sig = mem._signature;
      if (sig) {
        const key = `${sig.source}:${new Date(sig.timestamp).toDateString()}`;
        _boundedSet(freqMap, key, (freqMap.get(key) || 0) + 1, MAX_MAP_SIZE);
      }
    }

    // 检测突发写入
    for (const [key, count] of freqMap) {
      if (count > 20) {
        anomalies.push({
          type: 'burst_write',
          severity: 'medium',
          message: `Burst write detected: ${count} memories from ${key}`,
        });
      }
    }

    this.anomalies.push(...anomalies);
    this.stats.anomalies += anomalies.length;

    // 裁剪异常记录
    if (this.anomalies.length > this.config.maxAnomalies) {
      this.anomalies = this.anomalies.slice(-this.config.maxAnomalies);
    }

    return anomalies;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      version: this.version,
      signedMemories: this.signatures.size,
      totalAnomalies: this.anomalies.length,
      criticalAnomalies: this.anomalies.filter(a => a.severity === 'critical').length,
      ...this.stats,
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.signatures.clear();
    this.anomalies = [];
    this.stats = { verified: 0, signed: 0, anomalies: 0 };
  }
}

module.exports = { MemoryIntegrity };
