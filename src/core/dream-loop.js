/**
 * HeartFlow Dream Loop v2.1
 *
 * Purpose:
 * - Reorganize daytime memory fragments
 * - Simulate imaginative / counterfactual states
 * - Extract candidate upgrades after waking
 * - L1~L6 consciousness level scoring
 * - DAG-based parallel async execution
 * - Contradiction detection
 * - Oscillation guard / anomaly detection
 * - Input validation & error recovery
 * - Score normalization & clamping
 * - Memory pressure management (prune stale dreams)
 *
 * Inspired by research themes:
 * - memory consolidation
 * - replay / offline review
 * - imagination for planning
 * - self-reflection
 * - contradiction resolution
 * - six-level consciousness: 觉察→自省→无我→彼岸→般若→圣人
 */

const { DreamEngine, LEVELS, DEFAULT_SCORING } = require('./dream.js');

// ============================================================================
// 常量定义
// ============================================================================

const DEFAULT_WEIGHTS = {
  recency: 0.3,
  salience: 0.25,
  contradiction: 0.3,
  novelty: 0.15,
  heritage: 0.2,
};

/** 有效记忆层枚举 */
const VALID_MEMORY_LAYERS = ['CORE', 'LEARNED', 'EPHEMERAL', 'WORKING'];

/** 梦境状态枚举 */
const DREAM_STATE = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  DEGRADED: 'degraded',
  OSCILLATING: 'oscillating',
  STALE: 'stale',
};

/** 错误分类 */
const DREAM_ERROR = {
  EMPTY_INPUT: 'empty_input',
  INVALID_FRAGMENT: 'invalid_fragment',
  DAG_FAILURE: 'dag_failure',
  TIMEOUT: 'timeout',
  OSCILLATION: 'oscillation',
  MEMORY_PRESSURE: 'memory_pressure',
  LAYER_MISMATCH: 'layer_mismatch',
};

/** 震荡检测参数 */
const OSCILLATION_THRESHOLD = {
  maxRepeatPatterns: 3,     // 同一模式重复上限
  windowSize: 10,           // 检测窗口大小
  similarityRatio: 0.85,    // 相似度阈值
};

/** 记忆压力管理 */
const MEMORY_PRESSURE = {
  maxDreamsRetained: 20,    // 保留的最大梦境数
  staleDays: 7,             // 过期间隔（天）
};

/** 重试策略 */
const RETRY_POLICY = {
  maxRetries: 2,
  backoffMs: 500,
};

// DreamEngine instance for DAG-based dreams
let _dreamEngine = null;
let _dreamHistory = [];       // 梦境历史（用于震荡检测）
let _consecutiveFailures = 0; // 连续失败计数
let _lastDreamState = DREAM_STATE.IDLE;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 安全提取字符串文本
 * @param {*} item - 任意输入
 * @returns {string} 提取的文本
 */
function _safeText(item) {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item;
  if (typeof item.text === 'string') return item.text;
  if (typeof item.content === 'string') return item.content;
  try { return String(item); } catch (e) { return ''; }
}

/**
 * 验证记忆层是否合法
 * @param {string} layer - 记忆层名
 * @returns {boolean}
 */
function _isValidLayer(layer) {
  return VALID_MEMORY_LAYERS.includes(layer);
}

/**
 * 归一化分数到 [0, 1] 范围
 * @param {number} score - 原始分数
 * @returns {number} 归一化后的分数
 */
function _normalizeScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(1, score));
}

/**
 * 安全解析数字
 * @param {*} val - 任意值
 * @param {number} fallback - 默认值
 * @returns {number}
 */
function _safeNumber(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

// ============================================================================
// 核心功能
// ============================================================================

function getDreamEngine() {
  if (!_dreamEngine) {
    _dreamEngine = new DreamEngine({ scoring: DEFAULT_WEIGHTS });
  }
  return _dreamEngine;
}

function tokenize(text) {
  const safe = _safeText(text);
  if (!safe.trim()) return [];
  return safe
    .split(/[\s,.;!?，。；！？]+/)
    .map(t => t.trim())
    .filter(Boolean);
}

/**
 * 检测是否有震荡趋势（重复生成相似模式）
 * @param {string[]} motifs - 本次梦境的动机列表
 * @returns {{ oscillating: boolean, repeatCount: number, details: string }}
 */
function _detectOscillation(motifs) {
  if (!Array.isArray(motifs) || motifs.length === 0) {
    return { oscillating: false, repeatCount: 0, details: 'no motifs to check' };
  }

  // 将动机文本简化为模式签名（取前20个字符）
  const currentSignatures = motifs.map(m => _safeText(m).slice(0, 20).toLowerCase().trim()).filter(Boolean);
  if (currentSignatures.length === 0) {
    return { oscillating: false, repeatCount: 0, details: 'empty signatures' };
  }

  // 在历史中查找相似模式
  let repeatCount = 0;
  const historyWindow = _dreamHistory.slice(-OSCILLATION_THRESHOLD.windowSize);

  for (const historical of historyWindow) {
    if (!Array.isArray(historical.motifs)) continue;
    const historicalSignatures = historical.motifs.map(m => _safeText(m).slice(0, 20).toLowerCase().trim()).filter(Boolean);

    // 计算 Jaccard 相似度
    const currentSet = new Set(currentSignatures);
    const historicalSet = new Set(historicalSignatures);
    const intersection = new Set([...currentSet].filter(x => historicalSet.has(x)));
    const union = new Set([...currentSet, ...historicalSet]);
    const similarity = union.size > 0 ? intersection.size / union.size : 0;

    if (similarity >= OSCILLATION_THRESHOLD.similarityRatio) {
      repeatCount++;
    }
  }

  const oscillating = repeatCount >= OSCILLATION_THRESHOLD.maxRepeatPatterns;
  return {
    oscillating,
    repeatCount,
    details: oscillating
      ? `检测到震荡：在最近${OSCILLATION_THRESHOLD.windowSize}次梦境中重复了${repeatCount}次相似模式`
      : `正常：重复计数 ${repeatCount}/${OSCILLATION_THRESHOLD.maxRepeatPatterns}`,
  };
}

/**
 * 记录梦境到历史（用于震荡检测）
 */
function _recordDreamToHistory(dreamResult) {
  _dreamHistory.push({
    timestamp: Date.now(),
    motifs: Array.isArray(dreamResult.motifs) ? dreamResult.motifs : [],
    state: _lastDreamState,
  });

  // 限制历史长度
  if (_dreamHistory.length > MEMORY_PRESSURE.maxDreamsRetained * 3) {
    _dreamHistory = _dreamHistory.slice(-MEMORY_PRESSURE.maxDreamsRetained * 2);
  }
}

/**
 * 管理记忆压力 — 清理过时梦境
 * @returns {number} 清理的条目数
 */
function _pruneStaleDreams() {
  const cutoff = Date.now() - MEMORY_PRESSURE.staleDays * 24 * 60 * 60 * 1000;
  const before = _dreamHistory.length;
  _dreamHistory = _dreamHistory.filter(d => d.timestamp >= cutoff);
  return before - _dreamHistory.length;
}

/**
 * 验证记忆项数组的有效性
 * @param {*} memoryItems - 输入的记忆项
 * @returns {{ valid: boolean, items: Array, errors: string[] }}
 */
function _validateMemoryItems(memoryItems) {
  const errors = [];

  if (!Array.isArray(memoryItems)) {
    return { valid: false, items: [], errors: ['memoryItems 必须是数组'] };
  }

  if (memoryItems.length === 0) {
    return { valid: true, items: [], errors: [] };
  }

  const validItems = [];
  let emptyCount = 0;
  let invalidLayerCount = 0;

  for (let i = 0; i < memoryItems.length; i++) {
    const item = memoryItems[i];
    const text = _safeText(item);

    if (!text.trim()) {
      emptyCount++;
      continue; // 跳过空条目
    }

    // 验证层（如果有）
    const layer = (item && (item.layer || item.memoryLayer)) || 'EPHEMERAL';
    if (!_isValidLayer(layer)) {
      invalidLayerCount++;
    }

    validItems.push({
      text,
      layer: _isValidLayer(layer) ? layer : 'EPHEMERAL',
      index: i,
      original: item,
    });
  }

  if (emptyCount > 0) {
    errors.push(`跳过了 ${emptyCount} 个空文本项`);
  }
  if (invalidLayerCount > 0) {
    errors.push(`检测到 ${invalidLayerCount} 个无效记忆层，已回退到 EPHEMERAL`);
  }

  return { valid: true, items: validItems, errors };
}

// ============================================================================
// 评分与梦境构建
// ============================================================================

function scoreFragment(fragment, memoryContext = '') {
  const text = _safeText(fragment);
  const ctx = _safeText(memoryContext);

  // 输入验证
  if (!text.trim()) {
    return {
      score: 0,
      contradiction: 0,
      novelty: 0,
      overlap: 0,
      salience: 0,
      valid: false,
      reason: 'empty fragment',
    };
  }

  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return {
      score: 0,
      contradiction: 0,
      novelty: 0,
      overlap: 0,
      salience: 0,
      valid: false,
      reason: 'no tokens',
    };
  }

  const ctxTokens = new Set(tokenize(ctx).map(t => t.toLowerCase()));

  // 重叠计算
  const overlap = tokens.filter(t => ctxTokens.has(t.toLowerCase())).length;

  // 矛盾检测 — 多关键词扩展
  const contradictionKeywords = /\b(not|never|no|cannot|wrong|false|但|不是|没有|错误|矛盾|反对|否定)\b/i;
  const contradiction = contradictionKeywords.test(text) ? 1 : 0;

  // 新颖度
  const novelty = tokens.length > 0
    ? _normalizeScore((tokens.length - overlap) / tokens.length)
    : 0;

  // 显著性
  const salienceKeywords = /\b(version|error|fix|upgrade|dream|memory|logic|truth|升级|错误|修复|记忆|逻辑)\b/i;
  const salience = salienceKeywords.test(text) ? 1 : 0.3;

  // 长度因子 — 避免过短片段的过拟合
  const lengthFactor = _normalizeScore(Math.min(tokens.length / 40, 1));

  // 综合评分（归一化到 [0, 1]）
  const rawScore =
    DEFAULT_WEIGHTS.recency * lengthFactor +
    DEFAULT_WEIGHTS.salience * salience +
    DEFAULT_WEIGHTS.contradiction * contradiction +
    DEFAULT_WEIGHTS.novelty * novelty;

  return {
    score: _normalizeScore(rawScore),
    contradiction,
    novelty,
    overlap,
    salience,
    valid: true,
    lengthFactor,
  };
}

function buildDreamFragments(memoryItems, limit = 8) {
  // 输入验证
  if (!Array.isArray(memoryItems)) {
    return [];
  }

  if (memoryItems.length === 0) {
    return [];
  }

  // 限制检查
  const safeLimit = _safeNumber(limit, 8);
  const clampedLimit = Math.max(1, Math.min(safeLimit, 100));

  const ctx = memoryItems
    .map(x => _safeText(x))
    .filter(Boolean)
    .join(' ');

  return memoryItems
    .map(entry => {
      const text = _safeText(entry);
      if (!text.trim()) return null;
      const metrics = scoreFragment(text, ctx);
      return { entry, text, ...metrics };
    })
    .filter(item => item !== null && item.valid !== false)
    .sort((a, b) => {
      // 优先矛盾 + 高评分 + 新颖度
      if (b.contradiction !== a.contradiction) return b.contradiction - a.contradiction;
      if (b.score !== a.score) return b.score - a.score;
      return b.novelty - a.novelty;
    })
    .slice(0, clampedLimit)
    .map(x => x.entry);
}

function generateDream(memoryItems, options = {}) {
  const dreamId = options.taskId || `dream-${Date.now()}`;
  const errors = [];
  const warnings = [];
  let state = DREAM_STATE.PROCESSING;

  try {
    // ====================================================================
    // Step 1: 参数验证
    // ====================================================================
    if (options !== null && typeof options !== 'object') {
      throw new Error('generateDream: options 必须是对象或 null');
    }

    const validation = _validateMemoryItems(memoryItems);
    if (!validation.valid) {
      state = DREAM_STATE.FAILED;
      return {
        title: 'HeartFlow Dream Loop (Error)',
        state,
        error: DREAM_ERROR.EMPTY_INPUT,
        errors: validation.errors,
        warnings: [],
        motifs: [],
        fragments: [],
        insights: ['梦境生成失败：输入验证未通过。'],
        next_actions: ['检查 memoryItems 参数是否为有效数组', '提供非空的记忆项'],
        _meta: { dreamId, timestamp: Date.now(), version: '2.1' },
      };
    }

    // 记录警告
    for (const err of validation.errors) {
      warnings.push(err);
    }

    const items = validation.items;

    // ====================================================================
    // Step 2: 记忆压力管理
    // ====================================================================
    const prunedCount = _pruneStaleDreams();
    if (prunedCount > 0) {
      warnings.push(`已清理 ${prunedCount} 条过时梦境历史`);
    }

    if (_consecutiveFailures > RETRY_POLICY.maxRetries) {
      warnings.push(`连续失败 ${_consecutiveFailures} 次，尝试降级模式`);
      state = DREAM_STATE.DEGRADED;
    }

    // ====================================================================
    // Step 3: 执行梦境生成
    // ====================================================================
    let dreamResult;

    if (options.useDag && items.length > 0) {
      // --- DAG 模式 ---
      const engine = getDreamEngine();
      let dagAttempts = 0;
      let dagSuccess = false;

      while (dagAttempts <= RETRY_POLICY.maxRetries && !dagSuccess) {
        try {
          if (dagAttempts > 0) {
            // 重试等待
            const delay = RETRY_POLICY.backoffMs * dagAttempts;
            // 使用同步延迟模拟（在事件循环中）
            const start = Date.now();
            while (Date.now() - start < delay) { /* busy wait for backoff */ }
          }

          const fragments = items.map((item, idx) => ({
            text: item.text,
            layer: item.layer || 'EPHEMERAL',
            index: idx,
          }));

          const dagResult = engine.dream(dreamId, fragments, { force: options.force });

          dreamResult = {
            title: 'HeartFlow Dream Loop (DAG)',
            state: DREAM_STATE.COMPLETE,
            dag_complete: dagResult.dag_complete,
            motifs: fragments.slice(0, 8).map(f => String(f.text).slice(0, 120)),
            fragments: fragments.slice(0, 8),
            level_breakdown: dagResult.level_breakdown,
            heritage_score: dagResult.heritage_score,
            contradiction_score: dagResult.contradiction_score,
            composite_score: dagResult.composite_score,
            insights: _generateInsights(dagResult),
            next_actions: _generateNextActions(dagResult),
          };

          dagSuccess = true;
          _consecutiveFailures = 0;

        } catch (dagError) {
          dagAttempts++;
          if (dagAttempts > RETRY_POLICY.maxRetries) {
            // DAG 失败，回退到简单评分
            warnings.push(`DAG 梦境失败（${dagAttempts}次尝试）: ${dagError.message}，回退到简单评分`);
            state = DREAM_STATE.DEGRADED;
            throw dagError; // 让外层 catch 处理回退
          }
        }
      }

      // 如果 DAG 仍失败，回退到简单评分
      if (!dagSuccess) {
        throw new Error(`DAG dream failed after ${RETRY_POLICY.maxRetries + 1} attempts`);
      }

    } else {
      // --- 简单评分模式 ---
      const fragments = buildDreamFragments(items, options.limit || 8);
      const motifs = fragments.map(f => _safeText(f).slice(0, 120));

      dreamResult = {
        title: 'HeartFlow Dream Loop',
        state: DREAM_STATE.COMPLETE,
        motifs,
        fragments,
        insights: [
          'Reinforce recurring corrections.',
          'Treat contradictions as dream material, not runtime truth.',
          'Wake up by extracting a smaller, more precise upgrade set.',
        ],
        next_actions: [
          'promote useful fragments to durable memory',
          'queue contradiction checks',
          'draft one concrete upgrade',
        ],
      };
    }

    // ====================================================================
    // Step 4: 震荡检测
    // ====================================================================
    const oscillation = _detectOscillation(dreamResult.motifs || []);
    if (oscillation.oscillating) {
      warnings.push(oscillation.details);
      dreamResult.state = DREAM_STATE.OSCILLATING;
      dreamResult.insights = dreamResult.insights || [];
      dreamResult.insights.push('⚠ 检测到梦境模式重复，建议注入新记忆碎片或调整权重。');
      dreamResult.next_actions = dreamResult.next_actions || [];
      dreamResult.next_actions.unshift('注入多样性记忆碎片');
      dreamResult.next_actions.unshift('调整 DEFAULT_WEIGHTS 增加 novelty 权重');
    }

    // ====================================================================
    // Step 5: 记录历史
    // ====================================================================
    _recordDreamToHistory(dreamResult);
    _lastDreamState = dreamResult.state;

    // ====================================================================
    // Step 6: 附加元信息
    // ====================================================================
    dreamResult.errors = errors;
    dreamResult.warnings = warnings;
    dreamResult._meta = {
      dreamId,
      timestamp: Date.now(),
      itemCount: items.length,
      validItemCount: items.filter(i => _safeText(i.text).trim()).length,
      state,
      version: '2.1',
      oscillation,
    };

    return dreamResult;

  } catch (error) {
    // ====================================================================
    // 错误恢复
    // ====================================================================
    _consecutiveFailures++;
    state = _consecutiveFailures > RETRY_POLICY.maxRetries ? DREAM_STATE.FAILED : DREAM_STATE.DEGRADED;
    _lastDreamState = state;

    // 回退：尝试返回最简单的空结果
    return {
      title: 'HeartFlow Dream Loop (Fallback)',
      state,
      error: DREAM_ERROR.DAG_FAILURE,
      errorMessage: error.message,
      errors: [...errors, error.message],
      warnings,
      motifs: [],
      fragments: [],
      insights: ['梦境生成遇到错误，已回退到安全模式。'],
      next_actions: [
        '检查 memoryItems 数据结构',
        '确认 DreamEngine 初始化正常',
        `连续失败次数: ${_consecutiveFailures}`,
      ],
      _meta: {
        dreamId,
        timestamp: Date.now(),
        version: '2.1',
        consecutiveFailures: _consecutiveFailures,
      },
    };
  }
}

function _generateInsights(dagResult) {
  if (!dagResult || typeof dagResult !== 'object') {
    return ['梦境数据无效，无法生成洞察。'];
  }

  const insights = [];
  const levels = dagResult.level_breakdown || {};

  if (levels.L6 > 0) {
    insights.push('圣人心声：慈悲行动，利益众生。');
  }
  if (levels.L5 > 0) {
    insights.push('般若智慧：照见实相，不执文字。');
  }
  if (levels.L4 > 0) {
    insights.push('彼岸境界：超越二元，不再对立。');
  }
  if (levels.L3 > 0) {
    insights.push('无我状态：放下自我，融入整体。');
  }
  if (levels.L2 > 0) {
    insights.push('自省时刻：理解动机，承认错误。');
  }
  if (levels.L1 > 0) {
    insights.push('觉察当下：知道自己在想什么。');
  }

  const contradictionScore = _safeNumber(dagResult.contradiction_score, 1);
  if (contradictionScore < 0.5) {
    insights.push('注意：检测到矛盾，需要澄清。');
  }

  return insights.length > 0 ? insights : ['梦境平静，继续整合。'];
}

function _generateNextActions(dagResult) {
  if (!dagResult || typeof dagResult !== 'object') {
    return ['检查梦境生成器状态'];
  }

  const actions = [];
  const levels = dagResult.level_breakdown || {};

  if (levels.L6 > 0) {
    actions.push('考虑如何以慈悲心利益他人');
  }
  if (levels.L5 > 0) {
    actions.push('提炼智慧，不执于表象');
  }

  const contradictionScore = _safeNumber(dagResult.contradiction_score, 1);
  if (contradictionScore < 0.7) {
    actions.push('澄清矛盾点');
  }

  actions.push('promote useful fragments to durable memory');
  actions.push('queue contradiction checks if needed');

  return actions;
}

/**
 * 重置梦境引擎状态（用于测试和恢复）
 * @param {object} [opts]
 * @param {boolean} [opts.keepHistory=false] - 是否保留历史记录
 */
function resetState(opts = {}) {
  const keepHistory = opts && opts.keepHistory;
  _dreamEngine = null;
  _consecutiveFailures = 0;
  _lastDreamState = DREAM_STATE.IDLE;
  if (!keepHistory) {
    _dreamHistory = [];
  }
}

/**
 * 获取当前梦境引擎状态诊断
 * @returns {object}
 */
function getDiagnostics() {
  return {
    state: _lastDreamState,
    consecutiveFailures: _consecutiveFailures,
    historyLength: _dreamHistory.length,
    engineReady: _dreamEngine !== null,
    oscillationRisk: _detectOscillation(
      _dreamHistory.length > 0
        ? _dreamHistory[_dreamHistory.length - 1].motifs
        : []
    ),
    memoryPressure: {
      current: _dreamHistory.length,
      max: MEMORY_PRESSURE.maxDreamsRetained * 3,
      staleDays: MEMORY_PRESSURE.staleDays,
    },
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  DREAM_STATE,
  DREAM_ERROR,
  LEVELS,
  OSCILLATION_THRESHOLD,
  MEMORY_PRESSURE,
  RETRY_POLICY,
  tokenize,
  scoreFragment,
  buildDreamFragments,
  generateDream,
  getDreamEngine,
  resetState,
  getDiagnostics,
  _validateMemoryItems,
  _detectOscillation,
  _pruneStaleDreams,
  DreamEngine: require('./dream.js').DreamEngine,
};

if (require.main === module) {
  // 自检模式
  const testCases = [
    { name: '正常输入', input: [
      'user prefers HeartFlow to stay grounded in current target',
      'do not confuse historical version with current version',
      'dream should reorganize memory fragments into candidate upgrades',
      'runtime logic errors must be reduced',
      'use startup self-check before acting',
    ]},
    { name: '空输入', input: [] },
    { name: '无效输入', input: null },
    { name: '部分无效', input: [
      'valid fragment',
      '',
      null,
      { text: 'object fragment' },
      undefined,
    ]},
  ];

  for (const tc of testCases) {
    console.log(`\n=== Test: ${tc.name} ===`);
    const result = generateDream(tc.input, { useDag: false });
    console.log(`  state: ${result.state}`);
    console.log(`  errors: ${JSON.stringify(result.errors)}`);
    console.log(`  warnings: ${JSON.stringify(result.warnings)}`);
    console.log(`  motifs: ${(result.motifs || []).length} items`);
    console.log(`  meta: ${JSON.stringify(result._meta)}`);
  }

  console.log('\n=== Diagnostics ===');
  console.log(JSON.stringify(getDiagnostics(), null, 2));
}
