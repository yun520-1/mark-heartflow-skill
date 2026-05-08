/**
 * HeartFlow Memory Recall Engine v11.22.0
 *
 * 核心功能：语义检索 + 格式化返回 → 可注入上下文的记忆召回
 *
 * 检索来源：
 * - Mem0MultiSignal: 语义 + BM25 + 实体 三信号融合
 * - MeaningfulMemory: CORE / LEARNED / EPHEMERAL 三层语义
 * - Reflection Memory: 真实教训（success/failure outcome）
 * - being-state.json: 存在状态（哲学层/真善美/成长）
 *
 * 召回原则：
 * - 84KB total memory — 全部保留，无需删除
 * - 只做好引用和调取：检索 → 召回 → 注入
 * - 返回结构化结果，供外部决定如何使用
 */

/**
 * 从 Mem0 检索相关记忆
 */
function recallFromMem0(query, topK = 5) {
  try {
    const init = require('./heartflow-engine.js').initialize?.();
    const mem0 = init?.instances?.mem0MultiSignal;
    if (!mem0) return [];

    const results = mem0.search ? mem0.search(query, { topK }) : [];
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
 */
function recallFromMeaningful(query, topK = 3) {
  try {
    const init = require('./heartflow-engine.js').initialize?.();
    const mm = init?.instances?.meaningfulMemory;
    if (!mm) return [];

    const results = mm.search ? mm.search(query, topK) : [];
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
 * @returns {object} 检索结果
 */
function recallMemories(query, options = {}) {
  const { topK = 5, includeBeing = true } = options;

  // 并行检索
  const [mem0Results, meaningfulResults, reflectionResults, beingState] = [
    recallFromMem0(query, topK),
    recallFromMeaningful(query, topK),
    recallFromReflections(query, topK),
    includeBeing ? recallBeingState(query) : null,
  ];

  // 合并去重（按content相似度）
  const all = [...mem0Results, ...meaningfulResults, ...reflectionResults];
  const seen = new Set();
  const deduped = all.filter(item => {
    const key = item.content?.substring(0, 50);
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
      being: beingState ? 1 : 0,
    },
    memories: deduped,
    beingState,
    context: contextParts.join('\n'),
    injectableContext: contextParts.join('\n'),
    count: deduped.length,
  };
}

module.exports = { recallMemories };
