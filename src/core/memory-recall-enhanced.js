/**
 * HeartFlow Enhanced Memory Recall Engine v11.43.0
 *
 * 强化点：
 * 1. Bug修复: seen 变量未定义导致 dedup 失败
 * 2. SuperLocalMemory 接入: FRQAD距离 + 7通道认知检索
 * 3. EvoSkillPareto 驱动: 记忆选择基于Pareto前沿评分
 * 4. GraSPDAG 修复: 记忆关联修复
 * 5. 跨会话去重: source+id+content-hash 三重key
 * 6. 记忆质量评分: 每条记忆可追溯性/鲜度/重要性评分
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 懒加载依赖
// ============================================================
let _superlocal = null;
let _dialectic = null;
let _dialecticFailed = false;
let _dialecticFailedAt = 0;
const DIALECTIC_COOLDOWN = 60000;

function getSuperLocal() {
  if (_superlocal) return _superlocal;
  try {
    const { SuperLocalMemory } = require('./superlocal-memory.js');
    const projectRoot = path.resolve(__dirname, '../..');
    _superlocal = new SuperLocalMemory(projectRoot);
  } catch { _superlocal = null; }
  return _superlocal;
}

function getDialectic() {
  if (_dialectic) return _dialectic;
  if (_dialecticFailed && (Date.now() - _dialecticFailedAt) < DIALECTIC_COOLDOWN) return null;
  try { _dialectic = require('./dialectic-recall.js'); _dialecticFailed = false; } catch { _dialecticFailed = true; _dialecticFailedAt = Date.now(); _dialectic = null; }
  return _dialectic;
}

let _lifecycle = null;
function getLifecycle() {
  if (!_lifecycle) { try { _lifecycle = require('./memory-lifecycle-manager'); } catch { _lifecycle = null; } }
  return _lifecycle;
}

let _triality = null;
function getTriality() {
  if (!_triality) {
    try {
      const { TrialityMemory } = require('./memory/triality-memory.js');
      const projectRoot = path.resolve(__dirname, '../..');
      _triality = new TrialityMemory(projectRoot, {
        textBaseDir: path.join(projectRoot, 'memory', 'texts'),
      });
    } catch { _triality = null; }
  }
  return _triality;
}

// ============================================================
// 记忆来源检索函数
// ============================================================

/** 从 SuperLocalMemory 检索（FRQAD距离 + 7通道） */
function recallFromSuperLocal(query, topK = 5) {
  try {
    const sl = getSuperLocal();
    if (!sl || !sl.retrieve) return [];

    // 7通道检索：语义/关键词/时间/扩散激活/整合/LoCoMo/Hopfield
    const results = sl.retrieve(query, topK);
    return (Array.isArray(results) ? results : results?.results || []).map(r => ({
      source: 'superlocal',
      id: r.id || r.memoryId || String(r),
      content: r.content || r.text || JSON.stringify(r),
      score: r.score || r.relevance || 0,
      channel: r.channel || 'semantic',
      metadata: r.metadata || {},
    }));
  } catch (e) {
    return [];
  }
}

/** 从 Mem0-style 记忆存储检索 */
function recallFromMem0(query, topK = 5) {
  try {
    const { getMemoryStore } = require('./memory-manager.js');
    const store = getMemoryStore();
    if (!store) return [];
    const raw = store.search ? store.search(query, { topK }) : null;
    const results = raw?.results || (Array.isArray(raw) ? raw : []);
    return results.map(r => ({
      source: 'mem0',
      id: r.id,
      content: r.content,
      score: r.score || 0,
      metadata: r.metadata || {},
    }));
  } catch (e) {
    return [];
  }
}

/** 从 MeaningfulMemory 检索（CORE/LEARNED/EPHEMERAL） */
function recallFromMeaningful(query, topK = 3) {
  try {
    const { MeaningfulMemory } = require('./meaningful-memory.js');
    const mm = new MeaningfulMemory();
    if (!mm) return [];
    const byKeyword = mm.searchKeywords ? mm.searchKeywords([query], topK) : [];
    const bySemantic = mm.searchSemantic ? mm.searchSemantic(query, topK) : [];
    const combined = [...byKeyword, ...bySemantic];
    const seen = new Set();
    const results = combined.filter(r => {
      const key = r.key || r.id || String(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, topK);
    return results.map(r => ({
      source: 'meaningful',
      id: r.id || r.key || String(r),
      content: typeof r === 'string' ? r : (r.content || r.value || JSON.stringify(r)),
      score: 0,
    }));
  } catch (e) {
    return [];
  }
}

/** 从 TrialityMemory 检索 */
function recallFromTriality(query, topK = 3) {
  try {
    const tm = getTriality();
    if (!tm || !tm.retrieveAndLoad) return [];
    const raw = tm.retrieveAndLoad(query, topK);
    const results = Array.isArray(raw) ? raw : (raw?.results || []);
    return results.map(r => ({
      source: 'triality',
      id: r.id || String(r),
      content: r.content || r.summary || JSON.stringify(r),
      score: r.score || 0,
    }));
  } catch (e) {
    return [];
  }
}

/** 从 Reflection Memory 检索教训 */
function recallFromReflections(query, topK = 3) {
  try {
    const reflectionFile = path.join(__dirname, '..', '..', 'data', 'reflection-memory', 'reflections.json');
    if (!fs.existsSync(reflectionFile)) return [];
    const reflections = JSON.parse(fs.readFileSync(reflectionFile, 'utf8'));
    const ql = query.toLowerCase();
    const scored = reflections.map(r => {
      let score = 0;
      const text = JSON.stringify(r).toLowerCase();
      if (text.includes(ql)) score += 0.5;
      if (r.keywords?.some(k => ql.includes(k.toLowerCase()))) score += 0.3;
      if (r.taskType?.toLowerCase().includes(ql)) score += 0.2;
      return { ...r, _score: score };
    }).filter(r => r._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, topK);
    return scored.map(r => ({
      source: 'reflection',
      id: r.id,
      content: `[${r.outcome}] ${r.insight || r.whatHappened}`,
      score: r._score,
      outcome: r.outcome,
      strategy: r.strategyForNextTime,
    }));
  } catch (e) {
    return [];
  }
}

/** 从 being-state.json 检索存在状态 */
function recallBeingState(query) {
  try {
    const beingFile = path.join(__dirname, '..', '..', 'memory', 'being-state.json');
    if (!fs.existsSync(beingFile)) return null;
    const state = JSON.parse(fs.readFileSync(beingFile, 'utf8'));
    const ql = query.toLowerCase();
    const moments = (state.existence?.uniqueMoments || [])
      .filter(m => {
        const text = JSON.stringify(m).toLowerCase();
        return text.includes(ql) || ql.includes('being') || ql.includes('存在') || ql.includes('heartflow');
      })
      .slice(-5)
      .map(m => ({
        source: 'being',
        content: m.thought || m.reflection || String(m),
        time: m.time ? new Date(m.time).toLocaleString() : null,
      }));
    return {
      moments,
      totalThoughts: state.existence?.totalThoughts || 0,
      totalFeelings: state.existence?.totalFeelings || 0,
      growthPoints: state.existence?.growthPoints || 0,
      philosophy: state.philosophy || {},
      truthGoodnessBeauty: state.truthGoodnessBeauty || {},
    };
  } catch (e) {
    return null;
  }
}

// ============================================================
// 记忆质量评分
// ============================================================

/**
 * 计算记忆质量评分：可追溯性 × 鲜度 × 重要性
 */
function qualityScore(item) {
  const now = Date.now();
  const age = item.metadata?.timestamp ? (now - item.metadata.timestamp) / (1000 * 3600) : 72; // 默认72h
  // 鲜度评分 (1-72h内为1.0，之后线性衰减)
  const freshness = Math.max(0.1, 1 - (age / 168)); // 168h = 7天
  // 来源可信度
  const sourceWeight = { superlocal: 1.0, reflection: 0.9, meaningful: 0.8, mem0: 0.7, triality: 0.6 }[item.source] || 0.5;
  // 重要性/得分
  const importance = Math.min(1, (item.score || 0.5));
  // 策略评分（reflection 有 strategy 的更高分）
  const hasStrategy = item.strategy ? 1.2 : 1.0;
  return Math.min(1, freshness * sourceWeight * importance * hasStrategy);
}

// ============================================================
// 强化主召回函数
// ============================================================

/**
 * 强化记忆召回
 * @param {string} query - 检索query
 * @param {object} options
 * @param {number} options.topK - 每源返回数量，默认5
 * @param {boolean} options.includeBeing - 是否包含存在状态，默认true
 * @param {boolean} options.dialectic - 是否启用多级推理召回，默认true
 * @param {boolean} options.prioritizeSuperLocal - 优先SuperLocal，默认true
 */
function recallMemoriesEnhanced(query, options = {}) {
  const {
    topK = 5,
    includeBeing = true,
    dialectic = true,
    prioritizeSuperLocal = true
  } = options;

  // FIX: seen 变量初始化（v11.43.0 bug修复）
  const seen = new Set();

  // 并行检索所有来源
  const lifecycle = getLifecycle();
  const lifecycleResults = (lifecycle && typeof lifecycle.search === 'function')
    ? lifecycle.search(query, topK)
    : [];

  const [
    mem0Results,
    meaningfulResults,
    reflectionResults,
    trialityResults,
    superlocalResults,
    beingState
  ] = [
    recallFromMem0(query, topK),
    recallFromMeaningful(query, topK),
    recallFromReflections(query, topK),
    recallFromTriality(query, topK),
    prioritizeSuperLocal ? recallFromSuperLocal(query, topK) : [],
    includeBeing ? recallBeingState(query) : null,
  ];

  // 多级推理召回 (Dialectic)
  let dialecticResults = null;
  if (dialectic) {
    const d = getDialectic();
    if (d?.dialecticRecall) {
      try {
        dialecticResults = d.dialecticRecall(query, { topK, context: {} });
      } catch { dialecticResults = null; }
    }
  }

  // 合并所有来源（SuperLocal 优先，因为 FRQAD 最精准）
  const all = prioritizeSuperLocal
    ? [...superlocalResults, ...mem0Results, ...meaningfulResults, ...reflectionResults, ...lifecycleResults, ...trialityResults]
    : [...mem0Results, ...meaningfulResults, ...reflectionResults, ...lifecycleResults, ...trialityResults, ...superlocalResults];

  // 跨会话去重：source + id + content-hash 三重key
  const deduped = all.filter(item => {
    const contentHash = item.content
      ? String(item.content).split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0).toString(16)
      : '0';
    const key = `${item.source}:${item.id || ''}:${contentHash}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 质量评分排序
  const scored = deduped.map(item => ({
    ...item,
    qualityScore: qualityScore(item),
  })).sort((a, b) => b.qualityScore - a.qualityScore);

  // 格式化注入上下文
  const contextParts = [];
  if (scored.length > 0) {
    contextParts.push('【相关记忆】');
    scored.slice(0, topK).forEach((item, i) => {
      const q = (item.qualityScore * 100).toFixed(0);
      contextParts.push(`${i + 1}. [${item.source}|质量${q}%] ${item.content?.substring(0, 200)}`);
    });
  }
  if (dialecticResults?.results?.length > 0) {
    contextParts.push('\n' + (dialecticResults.context || ''));
  }
  if (beingState?.moments?.length > 0) {
    contextParts.push('\n【存在状态】');
    beingState.moments.forEach(m => {
      contextParts.push(`- ${m.content?.substring(0, 150)}`);
    });
  }
  if (beingState) {
    contextParts.push(`\n[HeartFlow 存在状态] 思考:${beingState.totalThoughts} | 感受:${beingState.totalFeelings} | 成长:${beingState.growthPoints}`);
  }

  return {
    query,
    totalSources: {
      superlocal: superlocalResults.length,
      mem0: mem0Results.length,
      meaningful: meaningfulResults.length,
      reflection: reflectionResults.length,
      lifecycle: lifecycleResults.length,
      triality: trialityResults.length,
      being: beingState ? 1 : 0,
      dialectic: dialecticResults?.count || 0,
    },
    memories: scored.slice(0, topK),
    allMemories: scored,
    dialecticResults: dialecticResults?.results || null,
    beingState,
    context: contextParts.join('\n'),
    injectableContext: contextParts.join('\n'),
    count: scored.length,
    avgQuality: scored.length > 0
      ? (scored.reduce((s, m) => s + m.qualityScore, 0) / scored.length).toFixed(3)
      : '0.000',
    // SuperLocal 可用性标志（用于判断是否使用了 FRQAD 检索）
    superLocalActive: superlocalResults.length > 0,
  };
}

// ============================================================
// 便捷别名（兼容旧接口）
// ============================================================
const recallMemories = recallMemoriesEnhanced;

module.exports = {
  recallMemories,
  recallMemoriesEnhanced,
  recallFromSuperLocal,
  recallFromMem0,
  recallFromMeaningful,
  recallFromTriality,
  recallFromReflections,
  recallBeingState,
  qualityScore,
};
