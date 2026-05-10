/**
 * HeartFlow Memory Recall Engine v11.24.3
 *
 * 核心功能：语义检索 + 格式化返回 → 可注入上下文的记忆召回
 *
 * 检索来源：
 * - Mem0MultiSignal: 语义 + BM25 + 实体 三信号融合
 * - MeaningfulMemory: CORE / LEARNED / EPHEMERAL 三层语义
 * - TrialityMemory: working context + long-term archive + conversation logging (v11.24.3新增)
 * - Reflection Memory: 真实教训（success/failure outcome）
 * - LifecycleManager: 遗忘周期 + 晋升 + 层级评分
 * - being-state.json: 存在状态（哲学层/真善美/成长）
 * - DialecticRecall: 多级推理召回 (L1表面/L2因果/L3元认知)
 *
 * 召回原则：
 * - 84KB total memory — 全部保留，无需删除
 * - 只做好引用和调取：检索 → 召回 → 注入
 * - 返回结构化结果，供外部决定如何使用
 */

// 懒加载 dialectic（带失败冷却，避免高频重试）
let _dialectic = null;
let _dialecticFailed = false;
let _dialecticFailedAt = 0;
const DIALECTIC_COOLDOWN = 60000; // 60秒冷却

function getDialectic() {
  if (_dialectic) return _dialectic;
  if (_dialecticFailed && (Date.now() - _dialecticFailedAt) < DIALECTIC_COOLDOWN) return null;
  try { _dialectic = require('./dialectic-recall.js'); _dialecticFailed = false; } catch { _dialecticFailed = true; _dialecticFailedAt = Date.now(); _dialectic = null; }
  return _dialectic;
}

// 懒加载 lifecycle manager
let _lifecycle = null;
function getLifecycle() {
  if (!_lifecycle) {
    try { _lifecycle = require('./memory-lifecycle-manager'); } catch { _lifecycle = null; }
  }
  return _lifecycle;
}

// v11.24.3: 懒加载 TrialityMemory (working context + archive)
let _triality = null;
function getTriality() {
  if (!_triality) {
    try {
      const { TrialityMemory } = require('./memory/triality-memory.js');
      const path = require('path');
      const projectRoot = path.resolve(__dirname, '../..');
      _triality = new TrialityMemory(projectRoot, {
        textBaseDir: path.join(projectRoot, 'memory', 'texts'),
      });
    } catch { _triality = null; }
  }
  return _triality;
}

/**
 * 从 Mem0 检索相关记忆
 * [v11.34.x 已归档] Mem0MultiSignal 功能已被 UnifiedMemoryStore 覆盖
 * 直接通过 MemoryManager 检索，不走 initialize()（initialize 会触发 runDreamCycle 阻塞）
 */
function recallFromMem0(query, topK = 5) {
  try {
    // 直接使用 UnifiedMemoryStore，避免触发 heartflow-engine initialize()
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

/**
 * 从 MeaningfulMemory 检索
 * v11.24.3: 修复 — 使用 searchKeywords 或 searchSemantic，而非不存在的 search()
 * v11.34.x: 修复 — 直接 require MeaningfulMemory，不走 initialize()
 */
function recallFromMeaningful(query, topK = 3) {
  try {
    // 直接加载，不走 heartflow-engine initialize()（会阻塞）
    const { MeaningfulMemory } = require('./meaningful-memory.js');
    const mm = new MeaningfulMemory();
    if (!mm) return [];

    // searchKeywords 能做关键词匹配
    const byKeyword = mm.searchKeywords ? mm.searchKeywords([query], topK) : [];
    const bySemantic = mm.searchSemantic ? mm.searchSemantic(query, topK) : [];
    const combined = [...byKeyword, ...bySemantic];
    // 去重
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

/**
 * v11.24.3: 从 TrialityMemory 检索 working context + long-term archive
 */
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

/**
 * 从 Reflection Memory 检索教训
 */
function recallFromReflections(query, topK = 3) {
  try {
    const fs = require('fs');
    const path = require('path');
    const reflectionFile = path.join(__dirname, '..', '..', 'data', 'reflection-memory', 'reflections.json');
    if (!fs.existsSync(reflectionFile)) return [];

    const reflections = JSON.parse(fs.readFileSync(reflectionFile, 'utf8'));
    const ql = query.toLowerCase();

    // 关键词匹配
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

/**
 * 从 being-state.json 检索存在状态
 */
function recallBeingState(query) {
  try {
    const fs = require('fs');
    const path = require('path');
    const beingFile = path.join(__dirname, '..', '..', 'memory', 'being-state.json');
    if (!fs.existsSync(beingFile)) return null;

    const state = JSON.parse(fs.readFileSync(beingFile, 'utf8'));
    const ql = query.toLowerCase();

    // 提取uniqueMoments中相关的
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

/**
 * 主召回函数 — 并行检索所有记忆源，融合返回
 *
 * @param {string} query - 检索query
 * @param {object} options
 * @param {number} options.topK - 每源返回数量，默认5
 * @param {boolean} options.includeBeing - 是否包含存在状态，默认true
 * @param {boolean} options.dialectic - 是否启用多级推理召回，默认true
 * @returns {object} 检索结果
 */
function recallMemories(query, options = {}) {
  const { topK = 5, includeBeing = true, dialectic = true } = options;

  // 并行检索
  const lifecycle = getLifecycle();
  const lifecycleResults = (lifecycle && typeof lifecycle.search === 'function') ? lifecycle.search(query, topK) : [];
  const [mem0Results, meaningfulResults, reflectionResults, trialityResults, beingState] = [
    recallFromMem0(query, topK),
    recallFromMeaningful(query, topK),
    recallFromReflections(query, topK),
    recallFromTriality(query, topK),
    includeBeing ? recallBeingState(query) : null,
  ];

  // 多级推理召回 (Honcho Dialectic)
  let dialecticResults = null;
  if (dialectic) {
    const d = getDialectic();
    if (d?.dialecticRecall) {
      try {
        dialecticResults = d.dialecticRecall(query, { topK, context: {} });
      } catch { dialecticResults = null; }
    }
  }

  // 合并去重（按content相似度）
  const all = [...mem0Results, ...meaningfulResults, ...reflectionResults, ...lifecycleResults, ...trialityResults];
  const deduped = all.filter(item => {
    // source+id 组合 key，避免不同源50字符相同导致的误删
    const key = `${item.source}:${item.id || item.content?.substring(0, 100)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 格式化注入上下文
  const contextParts = [];
  if (deduped.length > 0) {
    contextParts.push('【相关记忆】');
    deduped.forEach((item, i) => {
      contextParts.push(`${i + 1}. [${item.source}] ${item.content?.substring(0, 200)}`);
    });
  }
  if (dialecticResults?.results?.length > 0) {
    contextParts.push('\n' + dialecticResults.context);
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
      mem0: mem0Results.length,
      meaningful: meaningfulResults.length,
      reflection: reflectionResults.length,
      lifecycle: lifecycleResults.length,
      being: beingState ? 1 : 0,
      dialectic: dialecticResults?.count || 0,
      triality: trialityResults.length,
    },
    memories: deduped,
    dialecticResults: dialecticResults?.results || null,
    beingState,
    context: contextParts.join('\n'),
    injectableContext: contextParts.join('\n'),
    count: deduped.length + (dialecticResults?.count || 0),
  };
}

module.exports = { recallMemories };
