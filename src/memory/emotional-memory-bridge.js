/**
 * emotional-memory-bridge.js - 引擎情感记忆桥 v1.1.0
 * 
 * 来源: 整合 cognitive-appraisal.js + meaningful-memory.js
 * 论文基础: 
 *   - Leventhal's Common-Sense Model (cognitive-appraisal.js, 1564 citations)
 *   - Self-Regulation Theory (psychology.js 自我调节反馈系统)
 *   - MeaningfulMemory CORE/LEARNED/EPHEMERAL 三层架构
 * 
 * 核心功能:
 * 1. 认知评估 → 记忆转化 (appraisal → meaningful memory)
 * 2. 情绪显著性检测 (emotional salience → CORE/LEARNED晋级)
 * 3. 自我调节反馈环 (self-regulation loop integration)
 * 4. 心理模式识别 (psychological pattern detection from appraisal chains)
 * 5. 记忆去重 (deduplication of similar appraisals)
 * 6. 显著性衰减模型 (emotional salience decay over time)
 * 7. 批量记忆合并 (batch memory consolidation)
 * 8. 持久化验证 (memory persistence verification)
 * 9. 错误分类与恢复建议 (error classification with recovery strategies)
 * 
 * 设计原则:
 * - 慈悲是体、爱是用、真善美逻辑
 * - 情感时刻自动存入有意义记忆层
 */

const PATH = require('path');
const crypto = require('crypto');
const HF_ROOT = PATH.resolve(__dirname, '../..');

// ========================================
// 错误类型枚举
// ========================================

const ErrorType = {
  MODULE_UNAVAILABLE: 'MODULE_UNAVAILABLE',     // 依赖模块未加载
  STORE_FAILED: 'STORE_FAILED',                  // 存储操作失败
  INVALID_INPUT: 'INVALID_INPUT',                // 输入参数无效
  FILE_IO_ERROR: 'FILE_IO_ERROR',                // 文件读写失败
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',      // 持久化验证失败
  DEDUP_CHECK_FAILED: 'DEDUP_CHECK_FAILED',      // 去重检查失败
  BATCH_PARTIAL_FAILURE: 'BATCH_PARTIAL_FAILURE', // 批量操作部分失败
  UNKNOWN: 'UNKNOWN'                              // 未知错误
};

const ErrorSeverity = {
  FATAL: 'FATAL',     // 不可恢复
  HIGH: 'HIGH',       // 需人工干预
  MEDIUM: 'MEDIUM',   // 自动重试
  LOW: 'LOW'          // 可忽略
};

// 错误分类配置
const ERROR_CLASSIFICATION = {
  [ErrorType.MODULE_UNAVAILABLE]: {
    severity: ErrorSeverity.HIGH,
    retryable: false,
    fallbackAction: '使用降级模式（不依赖外部模块）',
    recoverySuggestion: '检查模块路径是否正确，或安装缺失依赖'
  },
  [ErrorType.STORE_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 100,
    recoverySuggestion: '检查存储介质是否可用，尝试重新存储'
  },
  [ErrorType.INVALID_INPUT]: {
    severity: ErrorSeverity.LOW,
    retryable: false,
    recoverySuggestion: '检查传入参数是否符合接口规范'
  },
  [ErrorType.FILE_IO_ERROR]: {
    severity: ErrorSeverity.HIGH,
    retryable: true,
    maxRetries: 2,
    retryDelayMs: 50,
    recoverySuggestion: '检查文件系统权限或磁盘空间'
  },
  [ErrorType.PERSISTENCE_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 2,
    retryDelayMs: 200,
    recoverySuggestion: '尝试写入临时缓存，下次启动时重试持久化'
  },
  [ErrorType.DEDUP_CHECK_FAILED]: {
    severity: ErrorSeverity.LOW,
    retryable: true,
    maxRetries: 1,
    recoverySuggestion: '跳过去重检查，直接存储（可能产生重复条目）'
  },
  [ErrorType.BATCH_PARTIAL_FAILURE]: {
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    recoverySuggestion: '检查各批次项目的具体错误，单独重试失败项'
  }
};

// 显著性衰减参数
const SALIENCE_DECAY = {
  HALF_LIFE_HOURS: 24,           // 显著性半衰期（小时）
  MIN_SALIENCE: 0.1,             // 最小显著性（低于此值视为可遗忘）
  CORE_PERSISTENCE_MULTIPLIER: 3, // CORE记忆衰减速度是普通记忆的1/3
  LEARNED_DECAY_FACTOR: 1.0,     // LEARNED记忆正常衰减
  EPHEMERAL_DECAY_FACTOR: 3.0    // EPHEMERAL记忆加速衰减
};

// 去重配置
const DEDUP_CONFIG = {
  SIMILARITY_THRESHOLD: 0.85,    // 文本相似度阈值（超过视为重复）
  TIME_WINDOW_HOURS: 1,          // 去重时间窗口（小时内）
  MAX_DEDUP_CACHE: 100           // 去重缓存大小
};

// Lazy load
let _mm = null;
let _ca = null;
let _psy = null;

// 去重缓存（内存级，跨函数调用）
const _dedupCache = new Map();
let _dedupCacheTimestamps = [];

function getMeaningfulMemory() {
  if (!_mm) {
    try { _mm = require('./meaningful-memory.js'); } catch(e) { _mm = null; }
  }
  return _mm;
}

function getCognitiveAppraisal() {
  if (!_ca) {
    try { _ca = require('./cognitive-appraisal.js'); } catch(e) { _ca = null; }
  }
  return _ca;
}

function getPsychology() {
  if (!_psy) {
    try { _psy = require('./psychology.js'); } catch(e) { _psy = null; }
  }
  return _psy;
}

// ========================================
// 输入验证
// ========================================

/**
 * 验证输入参数并返回分类错误
 * @param {*} value - 待验证的值
 * @param {string} name - 参数名称
 * @param {object} rules - 验证规则
 * @returns {{ valid: boolean, error: object|null }}
 */
function validateInput(value, name, rules = {}) {
  const { type = 'string', required = false, minLength, maxLength, min, max } = rules;
  
  if (required && (value === undefined || value === null)) {
    return {
      valid: false,
      error: {
        type: ErrorType.INVALID_INPUT,
        message: `参数 "${name}" 为必填项`,
        severity: ErrorSeverity.LOW,
        retryable: false
      }
    };
  }
  
  if (value === undefined || value === null) {
    return { valid: true, error: null }; // 非必填的 null/undefined 通过
  }
  
  if (type === 'string' && typeof value !== 'string') {
    return {
      valid: false,
      error: {
        type: ErrorType.INVALID_INPUT,
        message: `参数 "${name}" 应为字符串，实际为 ${typeof value}`,
        severity: ErrorSeverity.LOW,
        retryable: false
      }
    };
  }
  
  if (type === 'string' && minLength !== undefined && value.length < minLength) {
    return {
      valid: false,
      error: {
        type: ErrorType.INVALID_INPUT,
        message: `参数 "${name}" 长度 ${value.length} 小于最小值 ${minLength}`,
        severity: ErrorSeverity.LOW,
        retryable: false
      }
    };
  }
  
  if (type === 'string' && maxLength !== undefined && value.length > maxLength) {
    return {
      valid: false,
      error: {
        type: ErrorType.INVALID_INPUT,
        message: `参数 "${name}" 长度 ${value.length} 超过最大值 ${maxLength}`,
        severity: ErrorSeverity.LOW,
        retryable: false
      }
    };
  }
  
  if (type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) {
    return {
      valid: false,
      error: {
        type: ErrorType.INVALID_INPUT,
        message: `参数 "${name}" 应为对象，实际为 ${typeof value}`,
        severity: ErrorSeverity.LOW,
        retryable: false
      }
    };
  }
  
  if (type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return {
        valid: false,
        error: {
          type: ErrorType.INVALID_INPUT,
          message: `参数 "${name}" 应为有效数字，实际为 ${typeof value}`,
          severity: ErrorSeverity.LOW,
          retryable: false
        }
      };
    }
    if (min !== undefined && value < min) {
      return {
        valid: false,
        error: {
          type: ErrorType.INVALID_INPUT,
          message: `参数 "${name}" 值 ${value} 小于最小值 ${min}`,
          severity: ErrorSeverity.LOW,
          retryable: false
        }
      };
    }
    if (max !== undefined && value > max) {
      return {
        valid: false,
        error: {
          type: ErrorType.INVALID_INPUT,
          message: `参数 "${name}" 值 ${value} 超过最大值 ${max}`,
          severity: ErrorSeverity.LOW,
          retryable: false
        }
      };
    }
  }
  
  return { valid: true, error: null };
}

/**
 * 包装错误对象，添加分类信息和恢复建议
 * @param {Error} err - 原始错误对象
 * @param {string} errorType - 错误类型（ErrorType 枚举）
 * @param {object} context - 错误上下文信息
 * @returns {object} 分类后的错误对象
 */
function classifyError(err, errorType = ErrorType.UNKNOWN, context = {}) {
  const classification = ERROR_CLASSIFICATION[errorType] || ERROR_CLASSIFICATION[ErrorType.UNKNOWN];
  return {
    type: errorType,
    severity: classification.severity,
    message: err?.message || '未知错误',
    retryable: classification.retryable,
    maxRetries: classification.maxRetries || 0,
    retryDelayMs: classification.retryDelayMs || 0,
    recoverySuggestion: classification.recoverySuggestion,
    fallbackAction: classification.fallbackAction || '无降级方案',
    context,
    timestamp: new Date().toISOString()
  };
}

/**
 * 带重试的异步操作包装器
 * @param {Function} fn - 异步操作函数
 * @param {object} errorInfo - 错误信息（用于分类）
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<{ success: boolean, data: any, error: object|null, attempts: number }>}
 */
async function withRetry(fn, errorInfo = {}, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      return { success: true, data: result, error: null, attempts: attempt };
    } catch (err) {
      lastError = classifyError(err, errorInfo.type || ErrorType.UNKNOWN, {
        ...errorInfo.context,
        attempt,
        maxAttempts: maxRetries + 1
      });
      if (attempt <= maxRetries) {
        const delay = (errorInfo.retryDelayMs || 100) * attempt; // 线性退避
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return { success: false, data: null, error: lastError, attempts: maxRetries + 1 };
}

// ========================================
// 显著性衰减模型
// ========================================

/**
 * 计算衰减后的显著性分数
 * 使用指数衰减模型：S(t) = S0 * 0.5^(t/T)
 * 其中 S0 = 原始显著性, t = 经过时间(小时), T = 半衰期(小时)
 * 
 * @param {number} originalSalience - 原始显著性 (0-1)
 * @param {string} layer - 记忆层 ('core' | 'learned' | 'ephemeral')
 * @param {number} elapsedHours - 经过的小时数（默认自动从存储时间计算）
 * @returns {number} 衰减后的显著性
 */
function applySalienceDecay(originalSalience, layer = 'learned', elapsedHours = 0) {
  const validated = validateInput(originalSalience, 'originalSalience', { type: 'number', min: 0, max: 1 });
  if (!validated.valid) return originalSalience || 0.5;
  
  const validatedLayer = validateInput(layer, 'layer', { type: 'string' });
  if (!validatedLayer.valid) layer = 'learned';
  
  // 计算有效的经过时间
  const effectiveHours = Math.max(0, elapsedHours || 0);
  
  // 根据记忆层选择衰减因子
  let decayFactor;
  switch (layer) {
    case 'core':
      decayFactor = SALIENCE_DECAY.CORE_PERSISTENCE_MULTIPLIER;
      break;
    case 'learned':
      decayFactor = SALIENCE_DECAY.LEARNED_DECAY_FACTOR;
      break;
    case 'ephemeral':
      decayFactor = SALIENCE_DECAY.EPHEMERAL_DECAY_FACTOR;
      break;
    default:
      decayFactor = 1.0;
  }
  
  // 有效半衰期 = 基础半衰期 * 衰减因子（CORE记忆衰减更慢）
  const effectiveHalfLife = SALIENCE_DECAY.HALF_LIFE_HOURS * decayFactor;
  
  if (effectiveHalfLife <= 0 || effectiveHours <= 0) {
    return Math.max(SALIENCE_DECAY.MIN_SALIENCE, Math.min(1, originalSalience));
  }
  
  // 指数衰减: S = S0 * 0.5^(t/T)
  const decayed = originalSalience * Math.pow(0.5, effectiveHours / effectiveHalfLife);
  
  // 不低于最小显著性
  return Math.max(SALIENCE_DECAY.MIN_SALIENCE, Math.min(1, decayed));
}

/**
 * 计算两个时间之间的经过小时数
 * @param {string} timestamp - ISO 时间戳
 * @returns {number} 经过的小时数
 */
function getElapsedHours(timestamp) {
  if (!timestamp) return 0;
  try {
    const past = new Date(timestamp).getTime();
    if (isNaN(past)) return 0;
    return (Date.now() - past) / (1000 * 60 * 60);
  } catch (e) {
    return 0;
  }
}

// ========================================
// 记忆去重
// ========================================

/**
 * 计算两个文本字符串的相似度（基于字符三元组重叠率）
 * 使用 Jaccard 相似度：|intersection| / |union|
 * 
 * @param {string} a - 文本A
 * @param {string} b - 文本B
 * @returns {number} 相似度 (0-1)
 */
function computeTextSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1.0;
  
  const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);
  const na = normalize(a);
  const nb = normalize(b);
  
  if (na === nb) return 1.0;
  if (na.length < 3 || nb.length < 3) return na.includes(nb) || nb.includes(na) ? 0.9 : 0;
  
  // 生成三元组 (trigrams)
  const trigramsA = new Set();
  for (let i = 0; i < na.length - 2; i++) trigramsA.add(na.slice(i, i + 3));
  
  const trigramsB = new Set();
  for (let i = 0; i < nb.length - 2; i++) trigramsB.add(nb.slice(i, i + 3));
  
  // 计算 Jaccard 相似度
  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }
  
  const union = trigramsA.size + trigramsB.size - intersection;
  if (union === 0) return 0;
  
  return intersection / union;
}

/**
 * 生成文本的指纹哈希
 * @param {string} text - 输入文本
 * @returns {string} SHA256 哈希（前16字符）
 */
function fingerprintText(text) {
  if (!text) return '';
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * 检查文本是否与去重缓存中的条目重复
 * 
 * @param {string} text - 待检查文本
 * @param {number} similarityThreshold - 相似度阈值（默认 DEDUP_CONFIG.SIMILARITY_THRESHOLD）
 * @param {number} timeWindowHours - 时间窗口小时数（默认 DEDUP_CONFIG.TIME_WINDOW_HOURS）
 * @returns {{ isDuplicate: boolean, similarEntry: string|null, similarity: number }}
 */
function checkDuplicate(text, similarityThreshold = DEDUP_CONFIG.SIMILARITY_THRESHOLD, timeWindowHours = DEDUP_CONFIG.TIME_WINDOW_HOURS) {
  const inputValidation = validateInput(text, 'text', { type: 'string', minLength: 1 });
  if (!inputValidation.valid) {
    return { isDuplicate: false, similarEntry: null, similarity: 0, error: inputValidation.error };
  }
  
  // 清理过期缓存
  const now = Date.now();
  const windowMs = timeWindowHours * 60 * 60 * 1000;
  _dedupCacheTimestamps = _dedupCacheTimestamps.filter(ts => (now - ts) < windowMs);
  
  // 如果缓存溢出，清理最旧的条目
  if (_dedupCache.size > DEDUP_CONFIG.MAX_DEDUP_CACHE) {
    const oldestKeys = [..._dedupCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, _dedupCache.size - DEDUP_CONFIG.MAX_DEDUP_CACHE)
      .map(([key]) => key);
    for (const key of oldestKeys) _dedupCache.delete(key);
  }
  
  // 先做指纹快速匹配
  const fp = fingerprintText(text);
  const exactMatch = _dedupCache.get(fp);
  if (exactMatch) {
    const elapsed = getElapsedHours(exactMatch.timestamp);
    if (elapsed <= timeWindowHours) {
      return {
        isDuplicate: true,
        similarEntry: exactMatch.text,
        similarity: 1.0,
        matchType: 'exact_fingerprint'
      };
    }
  }
  
  // 模糊匹配：遍历缓存中的文本计算相似度
  let bestMatch = { similarity: 0, text: null };
  for (const [, entry] of _dedupCache) {
    const elapsed = getElapsedHours(entry.timestamp);
    if (elapsed > timeWindowHours) continue;
    
    const sim = computeTextSimilarity(text, entry.text);
    if (sim > bestMatch.similarity) {
      bestMatch = { similarity: sim, text: entry.text };
    }
  }
  
  // 将当前文本加入缓存（无论是否重复，供后续使用）
  _dedupCache.set(fp, { text: text.slice(0, 100), timestamp: new Date().toISOString() });
  _dedupCacheTimestamps.push(now);
  
  if (bestMatch.similarity >= similarityThreshold) {
    return {
      isDuplicate: true,
      similarEntry: bestMatch.text,
      similarity: bestMatch.similarity,
      matchType: 'fuzzy'
    };
  }
  
  return { isDuplicate: false, similarEntry: null, similarity: 0, matchType: 'none' };
}

/**
 * 清除去重缓存（用于测试或重置）
 */
function clearDedupCache() {
  _dedupCache.clear();
  _dedupCacheTimestamps = [];
}

/**
 * 获取去重缓存统计
 * @returns {{ size: number, oldestTimestamp: string|null, newestTimestamp: string|null }}
 */
function getDedupStats() {
  if (_dedupCache.size === 0) {
    return { size: 0, oldestTimestamp: null, newestTimestamp: null };
  }
  const timestamps = [..._dedupCache.values()].map(e => e.timestamp).sort();
  return {
    size: _dedupCache.size,
    oldestTimestamp: timestamps[0],
    newestTimestamp: timestamps[timestamps.length - 1]
  };
}

// ========================================
// 情绪显著性评估
// ========================================

/**
 * 评估一段文字的情感显著性
 * 高显著性 → CORE/LEARNED 记忆
 * 低显著性 → EPHEMERAL (丢弃)
 */
function assessEmotionalSalience(text, appraisalResult = {}, padState = {}) {
  const textValidation = validateInput(text, 'text', { type: 'string' });
  if (!textValidation.valid) {
    return {
      score: 0.5,
      factors: ['fallback_default'],
      threshold: {
        CORE: 0.75,
        LEARNED: 0.55,
        EPHEMERAL: 0.0
      },
      warning: textValidation.error.message
    };
  }
  
  let score = 0.5;
  const factors = [];
  
  // 1. 威胁级别贡献
  const threat = appraisalResult.threatType || 'neutral';
  if (threat === 'harm_loss') { score += 0.25; factors.push('harm_loss'); }
  else if (threat === 'threat') { score += 0.15; factors.push('threat'); }
  else if (threat === 'challenge') { score -= 0.05; factors.push('challenge_opportunity'); }
  
  // 2. 控制感低 → 高显著性 (失控的威胁更显著)
  const sec = appraisalResult.secondaryAppraisal || {};
  const control = sec.control || 0.5;
  if (control < 0.3) { score += 0.2; factors.push('low_control'); }
  else if (control > 0.7) { score -= 0.1; factors.push('high_control'); }
  
  // 3. PAD情绪强度贡献
  if (padState.intensity && padState.intensity > 0.7) {
    score += 0.15 * padState.intensity;
    factors.push('high_pad_intensity');
  }
  if (padState.pleasure !== undefined && padState.pleasure < -3) {
    score += 0.15;
    factors.push('negative_pad');
  }
  
  // 4. 应对策略类型
  const coping = appraisalResult.copingStrategies || [];
  const hasAvoidance = coping.some(s => s.type === 'avoidance');
  const hasMeaningFocused = coping.some(s => s.type === 'meaning_focused');
  if (hasAvoidance) { score += 0.1; factors.push('avoidance_coping'); }
  if (hasMeaningFocused && threat !== 'neutral') { score += 0.08; factors.push('meaning_building'); }
  
  // 5. 第一人称自我相关 (更显著)
  const lower = text.toLowerCase();
  if (/^(我|我的|自己|I|my|myself)/.test(lower)) {
    score += 0.05;
    factors.push('first_person_self');
  }
  
  // 7. 文本长度贡献（极短文本显著性较低）
  if (text.length < 10) {
    score -= 0.1;
    factors.push('very_short_text');
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    factors,
    threshold: {
      CORE: 0.75,
      LEARNED: 0.55,
      EPHEMERAL: 0.0
    }
  };
}

// ========================================
// 认知模式提取
// ========================================

/**
 * 从一系列认知评估中提取心理模式
 * 用于检测反复出现的消极认知模式
 */
function extractCognitivePattern(appraisalHistory) {
  const historyValidation = validateInput(appraisalHistory, 'appraisalHistory', { type: 'object' });
  if (!historyValidation.valid) return null;
  
  if (!appraisalHistory || !Array.isArray(appraisalHistory) || appraisalHistory.length < 3) {
    return null;
  }
  
  const patterns = {
    hopelessness: { count: 0, examples: [] },
    overwhelming: { count: 0, examples: [] },
    selfCriticism: { count: 0, examples: [] },
    avoidance: { count: 0, examples: [] }
  };
  
  for (const a of appraisalHistory) {
    if (!a || typeof a !== 'object') continue;
    
    const text = a.text || '';
    const primary = a.primaryAppraisal || {};
    const secondary = a.secondaryAppraisal || {};
    const lower = text.toLowerCase();
    
    // hopelessness: 低控制 + 负轨迹
    if ((secondary.control || 0.5) < 0.35 && (primary.trajectory?.value || 0) < -0.3) {
      patterns.hopelessness.count++;
      if (patterns.hopelessness.examples.length < 2) patterns.hopelessness.examples.push(text.slice(0, 50));
    }
    
    // overwhelming: 高相关 + 高新奇 + 低确定
    if ((primary.relevance?.value || 0.5) > 0.7 && 
        (primary.novelty?.value || 0.5) > 0.6 && 
        (primary.certainty?.value || 0.5) < 0.4) {
      patterns.overwhelming.count++;
      if (patterns.overwhelming.examples.length < 2) patterns.overwhelming.examples.push(text.slice(0, 50));
    }
    
    // self-criticism: 第一人称负面
    if (/^(我|我的|I|my).*(不行|不好|没用|失败|失望|错|差)/.test(lower)) {
      patterns.selfCriticism.count++;
      if (patterns.selfCriticism.examples.length < 2) patterns.selfCriticism.examples.push(text.slice(0, 50));
    }
    
    // avoidance: 回避策略占主导
    const coping = a.copingStrategies || [];
    if (coping.length > 0 && coping[0].type === 'avoidance') {
      patterns.avoidance.count++;
      if (patterns.avoidance.examples.length < 2) patterns.avoidance.examples.push(text.slice(0, 50));
    }
  }
  
  // 返回最强的模式
  let strongest = null;
  let maxCount = 0;
  for (const [name, data] of Object.entries(patterns)) {
    if (data.count > maxCount) {
      maxCount = data.count;
      strongest = { pattern: name, count: data.count, examples: data.examples };
    }
  }
  
  return maxCount >= 2 ? strongest : null;
}

// ========================================
// 持久化验证
// ========================================

/**
 * 验证记忆是否成功持久化
 * 通过检查存储后的读取操作确认数据可达
 * 
 * @param {object} mm - MeaningfulMemory 实例
 * @param {object} storeResult - 存储操作的结果
 * @param {object} memoryContent - 存储的记忆内容（用于验证）
 * @returns {Promise<{ verified: boolean, checkMethod: string, error: object|null }>}
 */
async function verifyPersistence(mm, storeResult, memoryContent) {
  if (!mm) {
    return { verified: false, checkMethod: 'none', error: { type: ErrorType.MODULE_UNAVAILABLE, message: 'MeaningfulMemory not available' } };
  }
  
  if (!storeResult || !storeResult.success) {
    return { verified: false, checkMethod: 'none', error: { type: ErrorType.STORE_FAILED, message: 'Store operation did not return success' } };
  }
  
  // 尝试不同的验证方式
  const checkMethods = ['search', 'recall', 'query', 'get'];
  const contentFingerprint = memoryContent?.text ? fingerprintText(memoryContent.text) : null;
  
  for (const method of checkMethods) {
    try {
      if (typeof mm[method] === 'function') {
        const result = await mm[method]({
          query: memoryContent?.text?.slice(0, 50) || '',
          limit: 1
        });
        
        if (result && (Array.isArray(result) ? result.length > 0 : true)) {
          return { verified: true, checkMethod: method, error: null };
        }
      }
    } catch (e) {
      // 尝试下一个方法
      continue;
    }
  }
  
  // 如果所有验证方法都失败，但有 storeResult 成功，标记为"未验证"
  return {
    verified: false,
    checkMethod: 'all_failed',
    error: {
      type: ErrorType.PERSISTENCE_FAILED,
      message: '无法验证记忆持久化（所有验证方法均失败）',
      severity: ErrorSeverity.MEDIUM,
      recoverySuggestion: '记忆可能已存储但无法验证，建议检查存储后端状态'
    }
  };
}

// ========================================
// 记忆转化 (Appraisal → Meaningful Memory)
// ========================================

/**
 * 将认知评估结果转化为有意义记忆
 * @param {string} text - 原始文本
 * @param {object} appraisalResult - cognitive-appraisal 结果
 * @param {object} padState - PAD情绪状态
 * @param {object} options - 配置选项
 * @param {boolean} options.forceStore - 强制存储（忽略显著性阈值）
 * @param {boolean} options.skipDedup - 跳过重复检查
 * @param {boolean} options.verifyPersistence - 验证持久化
 * @returns {Promise<object>} 记忆录入结果
 */
async function appraisalToMemory(text, appraisalResult, padState = {}, options = {}) {
  // 输入验证
  const textValidation = validateInput(text, 'text', { type: 'string', minLength: 1 });
  if (!textValidation.valid) {
    return { success: false, reason: textValidation.error.message, error: textValidation.error };
  }
  
  const appraisalValidation = validateInput(appraisalResult, 'appraisalResult', { type: 'object' });
  if (!appraisalValidation.valid) {
    appraisalResult = {}; // 降级为空对象
  }
  
  const padValidation = validateInput(padState, 'padState', { type: 'object' });
  if (!padValidation.valid) {
    padState = {}; // 降级为空对象
  }
  
  const salience = assessEmotionalSalience(text, appraisalResult, padState);
  const mm = getMeaningfulMemory();
  
  if (!mm) {
    return { success: false, reason: 'MeaningfulMemory not available', error: classifyError(new Error('Module not found'), ErrorType.MODULE_UNAVAILABLE, { module: 'meaningful-memory' }) };
  }
  
  // 重复检查
  if (!options.skipDedup) {
    try {
      const dupCheck = checkDuplicate(text);
      if (dupCheck.isDuplicate) {
        return {
          success: true,
          stored: false,
          reason: 'Duplicate appraisal (similarity: ' + dupCheck.similarity.toFixed(2) + ')',
          isDuplicate: true,
          similarEntry: dupCheck.similarEntry,
          salience
        };
      }
    } catch (e) {
      // 去重失败时继续存储，但记录警告
      const dedupError = classifyError(e, ErrorType.DEDUP_CHECK_FAILED);
      if (options.debug) console.warn('[EMB] Dedup check failed, proceeding without it:', dedupError.message);
    }
  }
  
  // 构建记忆内容
  const memoryContent = {
    text: text.slice(0, 500),
    timestamp: new Date().toISOString(),
    salience: salience.score,
    salienceFactors: salience.factors,
    decay: {
      model: 'exponential',
      halfLifeHours: SALIENCE_DECAY.HALF_LIFE_HOURS
    },
    appraisal: {
      threatType: appraisalResult.threatType || 'unknown',
      primaryScore: appraisalResult.primaryAppraisal?.overall || 0,
      secondaryScore: appraisalResult.secondaryAppraisal?.overall || 0,
      copingStrategies: (appraisalResult.copingStrategies || []).map(s => s.type)
    },
    pad: padState.intensity ? {
      pleasure: padState.pleasure,
      arousal: padState.arousal,
      dominance: padState.dominance,
      intensity: padState.intensity
    } : null,
    source: 'emotional-memory-bridge',
    bridgeVersion: '1.1.0'
  };
  
  // 判断存储层
  let layer = 'ephemeral';
  if (salience.score >= salience.threshold.CORE) layer = 'core';
  else if (salience.score >= salience.threshold.LEARNED) layer = 'learned';
  
  if (layer === 'ephemeral' && !options.forceStore) {
    return { success: true, layer, stored: false, reason: 'Below salience threshold', salience };
  }
  
  // 标签
  const tags = ['appraisal', layer];
  if (appraisalResult.threatType === 'harm_loss' || appraisalResult.threatType === 'threat') {
    tags.push('negative_threat');
  }
  if (salience.score >= salience.threshold.CORE) {
    tags.push('core_candidate');
  }
  
  // 带重试的存储
  const storeResult = await withRetry(async () => {
    if (typeof mm.store === 'function') {
      return mm.store({
        content: JSON.stringify(memoryContent),
        tags,
        layer: layer === 'core' ? 'core' : 'learned',
        emotionalSalience: salience.score
      });
    }
    if (typeof mm.add === 'function') {
      return mm.add({
        content: JSON.stringify(memoryContent),
        tags,
        layer: layer === 'core' ? 'core' : 'learned',
        emotionalSalience: salience.score
      });
    }
    throw new Error('store/add method not found on MeaningfulMemory');
  }, { type: ErrorType.STORE_FAILED, retryDelayMs: 100 }, 2);
  
  if (!storeResult.success) {
    return {
      success: false,
      reason: 'Store failed after ' + storeResult.attempts + ' attempts',
      error: storeResult.error,
      salience
    };
  }
  
  // 持久化验证（可选）
  if (options.verifyPersistence) {
    const verification = await verifyPersistence(mm, storeResult.data, memoryContent);
    if (!verification.verified && options.failOnUnverified) {
      return {
        success: false,
        stored: true,
        reason: 'Persistence verification failed',
        verification,
        salience
      };
    }
    return { success: true, layer, stored: true, salience, verification };
  }
  
  return { success: true, layer, stored: true, salience };
}

// ========================================
// 批量记忆合并
// ========================================

/**
 * 批量将多个认知评估转化为记忆
 * 支持部分失败（成功项返回，失败项记录错误）
 * 
 * @param {Array<{ text: string, appraisalResult: object, padState: object }>} items - 批量项目
 * @param {object} options - 配置选项（同 appraisalToMemory）
 * @returns {Promise<{ success: boolean, results: Array, errors: Array, summary: object }>}
 */
async function batchAppraisalToMemory(items, options = {}) {
  const itemsValidation = validateInput(items, 'items', { type: 'object' });
  if (!itemsValidation.valid || !Array.isArray(items)) {
    return {
      success: false,
      results: [],
      errors: [{
        type: ErrorType.INVALID_INPUT,
        message: 'items 应为数组',
        severity: ErrorSeverity.LOW
      }],
      summary: { total: 0, succeeded: 0, failed: 0, stored: 0, duplicate: 0 }
    };
  }
  
  if (items.length === 0) {
    return {
      success: true,
      results: [],
      errors: [],
      summary: { total: 0, succeeded: 0, failed: 0, stored: 0, duplicate: 0 }
    };
  }
  
  const results = [];
  const errors = [];
  let storedCount = 0;
  let duplicateCount = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== 'object') {
      errors.push({
        index: i,
        type: ErrorType.INVALID_INPUT,
        message: `第 ${i} 项无效：不是对象`,
        severity: ErrorSeverity.LOW
      });
      continue;
    }
    
    try {
      const result = await appraisalToMemory(
        item.text,
        item.appraisalResult || {},
        item.padState || {},
        { ...options, skipDedup: options.skipDedup || i === 0 } // 只在第一项强制去重
      );
      
      results.push({ index: i, ...result });
      if (result.stored) storedCount++;
      if (result.isDuplicate) duplicateCount++;
      
      if (!result.success && result.error) {
        errors.push({ index: i, error: result.error });
      }
    } catch (e) {
      const classified = classifyError(e, ErrorType.UNKNOWN, { index: i });
      errors.push({ index: i, error: classified });
      results.push({ index: i, success: false, error: classified });
    }
  }
  
  const summary = {
    total: items.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    stored: storedCount,
    duplicate: duplicateCount
  };
  
  return {
    success: errors.length === 0,
    results,
    errors,
    summary
  };
}

// ========================================
// 自我调节反馈环集成
// ========================================

/**
 * 整合心理学的自我调节反馈系统
 * 检测用户是否在正确的自我调节轨道上
 */
function assessSelfRegulationHealth(text, appraisalResult, padState, historyLength = 5) {
  const textValidation = validateInput(text, 'text', { type: 'string' });
  if (!textValidation.valid) {
    return { status: 'healthy', indicators: ['insufficient_input'], recommendations: [] };
  }
  
  const result = {
    status: 'healthy',
    indicators: [],
    recommendations: []
  };
  
  // 1. 检测是否陷入"过度反思"模式
  if (text.length > 300 && appraisalResult.primaryAppraisal?.novelty?.value > 0.6) {
    result.indicators.push('potential_rumination');
    result.status = 'struggling';
    result.recommendations.push('尝试把注意力转移到具体行动上，而不是反复分析');
  }
  
  // 2. 检测是否有"行动缺口" (高评估+低行动)
  const coping = appraisalResult.copingStrategies || [];
  const hasProblemFocused = coping.some(s => s.type === 'problem_focused');
  if (!hasProblemFocused && appraisalResult.primaryAppraisal?.relevance?.value > 0.7) {
    result.indicators.push('action_gap');
    if (result.status === 'healthy') result.status = 'struggling';
    result.recommendations.push('把感受转化为具体的下一步行动，即使是小的行动也比无行动好');
  }
  
  // 3. 检测自我批评模式
  const lower = text.toLowerCase();
  if (/^(我|我的|I|my).*(不行|不好|没用|失败|失望|错|差)/.test(lower)) {
    result.indicators.push('self_criticism');
    if (result.status === 'healthy') result.status = 'struggling';
    result.recommendations.push('尝试用更客观的方式描述情况，避免全或无的自我评价');
  }
  
  // 4. 检测控制感丧失
  const sec = appraisalResult.secondaryAppraisal || {};
  if ((sec.control || 0.5) < 0.25 && (sec.capability || 0.5) < 0.25) {
    result.indicators.push('control_loss');
    result.status = 'dysregulated';
    result.recommendations.push('控制感较低时，尝试把注意力放在能控制的小事上');
  }
  
  return result;
}

// ========================================
// 演示函数
// ========================================

async function demo() {
  const testCases = [
    { text: '我今天很焦虑，感觉什么都做不好', padState: { pleasure: -2, arousal: 3, dominance: -1, intensity: 0.8 } },
    { text: '测试去重功能', padState: { intensity: 0.3 } }
  ];
  
  const results = [];
  for (const tc of testCases) {
    const salience = assessEmotionalSalience(tc.text, {}, tc.padState);
    results.push({
      text: tc.text.slice(0, 30),
      salience: salience.score,
      factors: salience.factors,
      decayAfter24h: applySalienceDecay(salience.score, 'learned', 24),
      decayAfter72h: applySalienceDecay(salience.score, 'core', 72)
    });
  }
  
  // 去重测试
  const dup1 = checkDuplicate('测试去重功能');
  const dup2 = checkDuplicate('测试去重功能'); // 应该标记为重复
  const sim = computeTextSimilarity('我今天心情不好', '我今心情不太好');
  
  console.log('[EMB Demo] Salience assessment:', JSON.stringify(results, null, 2));
  console.log('[EMB Demo] First dedup check:', JSON.stringify(dup1));
  console.log('[EMB Demo] Second dedup check:', JSON.stringify(dup2));
  console.log('[EMB Demo] Text similarity:', sim);
}

// ========================================
// 导出
// ========================================

module.exports = {
  // 核心功能
  assessEmotionalSalience,
  extractCognitivePattern,
  appraisalToMemory,
  assessSelfRegulationHealth,
  
  // v1.1.0 新增
  applySalienceDecay,
  getElapsedHours,
  computeTextSimilarity,
  fingerprintText,
  checkDuplicate,
  clearDedupCache,
  getDedupStats,
  batchAppraisalToMemory,
  verifyPersistence,
  validateInput,
  classifyError,
  withRetry,
  
  // 枚举与配置
  ErrorType,
  ErrorSeverity,
  SALIENCE_DECAY,
  DEDUP_CONFIG,
  
  // 演示
  demo
};

if (require.main === module) {
  demo();
}
