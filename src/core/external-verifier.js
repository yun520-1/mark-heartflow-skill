/**
 * 外部验证调度器 - 整合所有外部验证模块
 * v2.0.56+ : 新增并发控制、超时保护、重试逻辑、源冲突检测、优先级队列、状态枚举
 */
const { openalexClient } = require('./openalex-client');
let factChecker;
try { factChecker = require('./fact-checker').factChecker; } catch (e) { factChecker = null; }
let claimExtractor;
try { claimExtractor = require('./claim-extractor').claimExtractor; } catch (e) { claimExtractor = null; }
let confidenceAnnotator;
try { confidenceAnnotator = require('./confidence-annotator').confidenceAnnotator; } catch (e) { confidenceAnnotator = null; }
const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('../utils/atomic-write');

const CACHE_FILE = path.join(__dirname, '../../data/verification-cache.json');

// ===== 验证状态枚举 (v2.0.56+) =====
const VerificationStatus = {
  PENDING: 'pending',           // 等待验证
  IN_PROGRESS: 'in_progress',   // 验证进行中
  CONFIRMED: 'confirmed',       // 已确认（多源一致）
  DISPUTED: 'disputed',         // 有争议（来源冲突）
  INCONCLUSIVE: 'inconclusive', // 无法判定
  ERROR: 'error',               // 验证出错
  TIMEOUT: 'timeout',           // 超时
  UNVERIFIABLE: 'unverifiable'  // 不可验证（无可用来源）
};

// ===== 置信度等级 (v2.0.56+) =====
const ConfidenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNVERIFIED: 'unverified',
  CONFLICTING: 'conflicting'    // 来源矛盾
};

// ===== 错误分类 (v2.0.56+) =====
const VerificationErrorType = {
  NETWORK: 'network',           // 网络错误
  TIMEOUT: 'timeout',           // 超时
  RATE_LIMIT: 'rate_limit',     // 限流
  PARSING: 'parsing',           // 解析错误
  EMPTY_RESULT: 'empty_result', // 无结果
  SOURCE_UNAVAILABLE: 'source_unavailable' // 来源不可用
};

// ===== 声明优先级 (v2.0.56+) =====
const ClaimPriority = {
  CRITICAL: 3,   // 关键声明（涉及事实断言、核心论点）
  IMPORTANT: 2,  // 重要声明（数据、引用）
  NORMAL: 1,     // 普通声明（一般信息）
  LOW: 0         // 低优先级（背景信息）
};

const externalVerifier = {
  cache: { entries: [] },

  // 并发控制 (v2.0.56+)
  _concurrencyLimit: 3,           // 最大并发验证数
  _activeVerifications: 0,        // 当前活跃验证数
  _verificationQueue: [],          // 等待队列

  // 默认超时（毫秒）
  _claimTimeout: 15000,           // 每个声明验证的超时

  // 重试配置
  _maxRetries: 2,
  _retryDelay: 1000,

  // 统计信息 (v2.0.56+)
  _stats: {
    totalVerified: 0,
    confirmed: 0,
    disputed: 0,
    inconclusive: 0,
    errors: 0,
    timeouts: 0,
    retriesUsed: 0
  },

  // 加载缓存
  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
          throw new Error('Invalid cache structure');
        }
        this.cache = parsed;
        // 清理过期条目（24小时）
        const now = Date.now();
        const DAY = 86400000;
        this.cache.entries = this.cache.entries.filter(e => now - e.verifiedAt < DAY);
      }
    } catch (e) {
      // 已禁用 console.warn: console.warn('[ExternalVerifier] Cache load failed, starting fresh:', e.message);
      this.cache = { entries: [] };
    }
    return this;
  },

  // 保存缓存（异步原子写入）
  async saveCacheAsync() {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    await atomicWrite(CACHE_FILE, JSON.stringify(this.cache, null, 2));
  },

  // 从缓存获取
  getCached(claim) {
    return this.cache.entries.find(e => e.claim === claim);
  },

  // ===== 声明优先级判定 (v2.0.56+) =====
  _determinePriority(claim) {
    if (!claim || typeof claim !== 'string') return ClaimPriority.LOW;

    // 包含引用标记 → 关键
    if (/\[\d+\]|\(https?:\/\/|doi\s*[:=]/i.test(claim)) return ClaimPriority.CRITICAL;

    // 包含数据断言 → 重要
    if (/\d{3,}|%|percent|研究|study|research|report|调查|统计/i.test(claim)) return ClaimPriority.IMPORTANT;

    // 包含时间/日期 → 正常
    if (/\d{4}年|\d{1,2}月|\d{1,2}日|20\d{2}/.test(claim)) return ClaimPriority.NORMAL;

    return ClaimPriority.LOW;
  },

  // ===== 带超时的验证封装 (v2.0.56+) =====
  _verifyWithTimeout(claim, timeoutMs) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({
          claim,
          status: VerificationStatus.TIMEOUT,
          confidence: ConfidenceLevel.UNVERIFIED,
          sources: [],
          error: { type: VerificationErrorType.TIMEOUT, message: `验证超时 (${timeoutMs}ms)` },
          verifiedAt: Date.now(),
          priority: this._determinePriority(claim)
        });
      }, timeoutMs);

      this._verifySingleClaim(claim)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timer);
          resolve({
            claim,
            status: VerificationStatus.ERROR,
            confidence: ConfidenceLevel.UNVERIFIED,
            sources: [],
            error: { type: VerificationErrorType.NETWORK, message: err.message },
            verifiedAt: Date.now(),
            priority: this._determinePriority(claim)
          });
        });
    });
  },

  // ===== 核心单声明验证（带重试）(v2.0.56+) =====
  async _verifySingleClaim(claim, attempt = 0) {
    const result = {
      claim,
      status: VerificationStatus.INCONCLUSIVE,
      confidence: ConfidenceLevel.UNVERIFIED,
      sources: [],
      verifiedAt: Date.now(),
      priority: this._determinePriority(claim),
      sourceDetails: []
    };

    // 1. 尝试学术验证
    let academicOk = false;
    try {
      const academic = await openalexClient.searchPaper(claim, 3);
      if (academic.ok && academic.works.length > 0) {
        academicOk = true;
        const topWork = academic.works[0];
        result.sources.push(...academic.works.slice(0, 2).map(w => ({
          title: w.title,
          type: 'academic',
          citations: w.citations,
          year: w.year,
          doi: w.doi,
          authors: w.authors
        })));
        result.sourceDetails.push({ source: 'openalex', count: academic.works.length });
      }
    } catch (e) {
      result.sourceDetails.push({ source: 'openalex', error: e.message });
    }

    // 2. 事实检查
    let factOk = false;
    try {
      const fact = await factChecker.checkFact(claim);
      if (fact.checked) {
        factOk = true;
        result.sourceDetails.push({
          source: 'fact-checker',
          isLying: fact.isLying,
          isHollow: fact.isHollow,
          isDichotomy: fact.isDichotomy,
          confidence: fact.confidence,
          type: fact.type,
          note: fact.note
        });
        if (fact.issue) result.sourceDetails.push({ source: 'fact-checker', issue: fact.issue });
      }
    } catch (e) {
      result.sourceDetails.push({ source: 'fact-checker', error: e.message });
    }

    // ===== 置信度聚合与冲突检测 (v2.0.56+) =====
    const academicConfidence = academicOk ? (
      result.sources.length > 0 && result.sources[0].citations > 100 ? ConfidenceLevel.HIGH :
      result.sources.length > 0 && result.sources[0].citations > 10 ? ConfidenceLevel.MEDIUM :
      ConfidenceLevel.LOW
    ) : null;

    const factConfidence = factOk ? (
      result.sourceDetails.find(s => s.source === 'fact-checker')?.confidence || null
    ) : null;

    // 检测来源冲突
    const factIsSuspicious = result.sourceDetails.some(
      s => s.source === 'fact-checker' && (s.isLying || s.isHollow || s.isDichotomy)
    );

    if (academicOk && factOk) {
      // 两源一致：学术支持 + 事实检查无问题 → 已确认
      if (!factIsSuspicious) {
        result.status = VerificationStatus.CONFIRMED;
        result.confidence = academicConfidence === ConfidenceLevel.HIGH ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM;
      } else {
        // 学术支持但事实检查发现逻辑问题 → 有争议
        result.status = VerificationStatus.DISPUTED;
        result.confidence = ConfidenceLevel.CONFLICTING;
        result.conflict = {
          academic: { supports: true, works: result.sources.length },
          factChecker: { suspicious: true, details: result.sourceDetails.filter(s => s.source === 'fact-checker') }
        };
      }
    } else if (academicOk && !factOk) {
      // 仅学术支持
      result.status = academicConfidence === ConfidenceLevel.HIGH ? VerificationStatus.CONFIRMED : VerificationStatus.INCONCLUSIVE;
      result.confidence = academicConfidence || ConfidenceLevel.MEDIUM;
    } else if (!academicOk && factOk) {
      // 仅事实检查
      if (!factIsSuspicious) {
        result.status = VerificationStatus.INCONCLUSIVE;
        result.confidence = factConfidence || ConfidenceLevel.MEDIUM;
      } else {
        result.status = VerificationStatus.UNVERIFIABLE;
        result.confidence = ConfidenceLevel.UNVERIFIED;
        result.issue = '声明存在逻辑问题且无学术来源支持';
      }
    } else {
      // 两源都不可用
      result.status = VerificationStatus.UNVERIFIABLE;
      result.confidence = ConfidenceLevel.UNVERIFIED;
    }

    return result;
  },

  // ===== 带重试的验证 (v2.0.56+) =====
  async _verifyWithRetry(claim) {
    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        const result = await this._verifyWithTimeout(claim, this._claimTimeout);
        // 如果结果可用（不是错误/超时），直接返回
        if (result.status !== VerificationStatus.ERROR && result.status !== VerificationStatus.TIMEOUT) {
          return result;
        }
        // 最后一次尝试，接受任何结果
        if (attempt === this._maxRetries) {
          return result;
        }
        // 等待后重试
        this._stats.retriesUsed++;
        await new Promise(r => setTimeout(r, this._retryDelay * (attempt + 1)));
      } catch (e) {
        if (attempt === this._maxRetries) {
          return {
            claim,
            status: VerificationStatus.ERROR,
            confidence: ConfidenceLevel.UNVERIFIED,
            sources: [],
            error: { type: VerificationErrorType.NETWORK, message: e.message },
            verifiedAt: Date.now(),
            priority: this._determinePriority(claim)
          };
        }
        this._stats.retriesUsed++;
        await new Promise(r => setTimeout(r, this._retryDelay * (attempt + 1)));
      }
    }
  },

  // ===== 带并发控制的验证 (v2.0.56+) =====
  async _verifyWithConcurrencyControl(claim) {
    return new Promise((resolve) => {
      const task = { claim, resolve };
      this._verificationQueue.push(task);
      this._processQueue();
    });
  },

  async _processQueue() {
    while (this._activeVerifications < this._concurrencyLimit && this._verificationQueue.length > 0) {
      const task = this._verificationQueue.shift();
      this._activeVerifications++;
      this._verifyWithRetry(task.claim)
        .then(result => {
          // 更新统计
          this._stats.totalVerified++;
          if (result.status === VerificationStatus.CONFIRMED) this._stats.confirmed++;
          else if (result.status === VerificationStatus.DISPUTED) this._stats.disputed++;
          else if (result.status === VerificationStatus.INCONCLUSIVE) this._stats.inconclusive++;
          else if (result.status === VerificationStatus.ERROR) this._stats.errors++;
          else if (result.status === VerificationStatus.TIMEOUT) this._stats.timeouts++;

          task.resolve(result);
        })
        .catch(err => {
          this._stats.totalVerified++;
          this._stats.errors++;
          task.resolve({
            claim: task.claim,
            status: VerificationStatus.ERROR,
            confidence: ConfidenceLevel.UNVERIFIED,
            sources: [],
            error: { type: VerificationErrorType.NETWORK, message: err.message },
            verifiedAt: Date.now(),
            priority: this._determinePriority(task.claim)
          });
        })
        .finally(() => {
          this._activeVerifications--;
          this._processQueue();
        });
    }
  },

  // ===== 获取统计信息 (v2.0.56+) =====
  getStats() {
    return { ...this._stats };
  },

  // ===== 重置统计 (v2.0.56+) =====
  resetStats() {
    this._stats = {
      totalVerified: 0,
      confirmed: 0,
      disputed: 0,
      inconclusive: 0,
      errors: 0,
      timeouts: 0,
      retriesUsed: 0
    };
    return { reset: true };
  },

  // ===== 验证单个声明（增强版）(v2.0.56+) =====
  async verify(claim) {
    this.loadCache();
    const cached = this.getCached(claim);
    if (cached) return cached;

    const result = await this._verifyWithConcurrencyControl(claim);

    // 更新缓存
    this.cache.entries.push(result);
    // 已禁用 console.error: this.saveCacheAsync().catch(e => console.error("[ExternalVerifier] Cache save failed:", e.message));
    return result;
  },

  // 异步验证多个声明（带优先级排序）(v2.0.56+)
  async verifyAsync(claims) {
    if (!Array.isArray(claims) || claims.length === 0) return [];

    // 按优先级降序排列：关键 > 重要 > 正常 > 低
    const sorted = [...claims]
      .map(c => ({ claim: c, priority: this._determinePriority(c) }))
      .sort((a, b) => b.priority - a.priority);

    const results = await Promise.all(sorted.map(item => this.verify(item.claim)));

    return results;
  },

  // 验证文本中的所有声明（增强版）(v2.0.56+)
  async verifyText(text) {
    const claims = claimExtractor.extractAll(text);
    const allClaims = [
      ...claims.citations,
      ...claims.percentages,
      ...claims.numbers
    ];
    if (allClaims.length === 0) {
      return {
        verified: true,
        status: 'clean',
        issues: [],
        annotations: null,
        stats: this.getStats()
      };
    }

    const results = await this.verifyAsync(allClaims);
    const annotations = confidenceAnnotator.generateAnnotationReport(text);

    // 按状态分类结果
    const confirmed = results.filter(r => r.status === VerificationStatus.CONFIRMED);
    const disputed = results.filter(r => r.status === VerificationStatus.DISPUTED);
    const inconclusive = results.filter(r => r.status === VerificationStatus.INCONCLUSIVE);
    const errors = results.filter(r => r.status === VerificationStatus.ERROR || r.status === VerificationStatus.TIMEOUT);
    const unverifiable = results.filter(r => r.status === VerificationStatus.UNVERIFIABLE);

    // 汇总问题：有争议 + 无法验证 + 错误
    const issues = [...disputed, ...unverifiable, ...errors];

    return {
      verified: issues.length === 0,
      status: issues.length === 0 ? 'verified' : 'has_issues',
      confirmed: confirmed.length,
      disputed: disputed.length,
      inconclusive: inconclusive.length,
      unverifiable: unverifiable.length,
      errors: errors.length,
      total: results.length,
      issues: issues.map(i => ({
        claim: i.claim,
        status: i.status,
        confidence: i.confidence,
        conflict: i.conflict || null,
        error: i.error || null,
        issue: i.issue || null
      })),
      annotations,
      stats: this.getStats()
    };
  },

  // ===== 配置并发限制 (v2.0.56+) =====
  setConcurrencyLimit(limit) {
    if (typeof limit === 'number' && limit > 0 && limit <= 10) {
      this._concurrencyLimit = limit;
    }
    return this._concurrencyLimit;
  },

  // ===== 配置超时 (v2.0.56+) =====
  setTimeout(ms) {
    if (typeof ms === 'number' && ms >= 1000 && ms <= 60000) {
      this._claimTimeout = ms;
    }
    return this._claimTimeout;
  },

  // 清理缓存
  clearCache() {
    this.cache = { entries: [] };
    // 已禁用 console.error: this.saveCacheAsync().catch(e => console.error("[ExternalVerifier] Cache save failed:", e.message));
    return { cleared: true };
  }
};

externalVerifier.loadCache();

module.exports = {
  externalVerifier,
  VerificationStatus,
  ConfidenceLevel,
  VerificationErrorType,
  ClaimPriority
};
