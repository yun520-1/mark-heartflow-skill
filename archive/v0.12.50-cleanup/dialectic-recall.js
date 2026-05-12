/**
 * dialectic-recall.js
 * 
 * v11.22.3: 多级推理召回引擎
 * 
 * 灵感来源：Honcho Dialectic
 * - Layer 1: 表面检索 (what)
 * - Layer 2: 因果推理 (why)  
 * - Layer 3: 元认知 (what if)
 * 
 * 核心问题：
 * - 当前 memory-recall.js 只有扁平检索
 * - 跨会话关联弱
 * - 无时间衰减
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'session-summary');
const SUMMARIES_FILE = path.join(DATA_DIR, 'summaries.jsonl');
const BEING_FILE = path.join(__dirname, '..', '..', 'memory', 'being-state.json');

/**
 * Layer 1: 表面检索 - 关键词匹配
 */
function layer1_surface(query, topK = 5) {
  const summaries = loadSummaries(50);
  const ql = query.toLowerCase();
  
  return summaries
    .map(s => {
      let score = 0;
      for (const obs of s.observations || []) {
        if (obs.toLowerCase().includes(ql)) score += 1;
      }
      if (s.firstMessage?.toLowerCase().includes(ql)) score += 0.5;
      if (s.lastMessage?.toLowerCase().includes(ql)) score += 0.5;
      return { ...s, _score: score, _layer: 1 };
    })
    .filter(s => s._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, topK);
}

/**
 * Layer 2: 因果推理 - 寻找决策链和因果关系
 */
function layer2_causal(query, context = {}, topK = 3) {
  const summaries = loadSummaries(30);
  const ql = query.toLowerCase();
  
  // 因果关键词
  const causalKeywords = [
    '因为', '所以', '导致', '造成', '结果', '因此',
    'therefore', 'because', 'caused', 'resulted', 'led to',
    '决定', '选择', '采用', '导致', '影响'
  ];
  
  const causalResults = [];
  
  summaries.forEach(s => {
    const text = JSON.stringify(s).toLowerCase();
    let score = 0;
    let causalLinks = [];
    
    // 因果匹配
    if (causalKeywords.some(k => text.includes(k))) {
      score += 2;
    }
    
    // 决策匹配
    if (/决定|选择|采用|用/.test(text) && ql.length > 2) {
      if (text.includes(ql)) {
        score += 3;
        causalLinks.push('决策相关');
      }
    }
    
    // 时间接近性（与 context 中的时间）
    if (context.timestamp) {
      const timeDiff = Math.abs((s.createdAt || 0) - context.timestamp);
      if (timeDiff < 3600000 * 24 * 7) score += 1; // 7天内
    }
    
    if (score > 0) {
      causalResults.push({
        ...s,
        _score: score,
        _layer: 2,
        _causalLinks: causalLinks,
      });
    }
  });
  
  return causalResults
    .sort((a, b) => b._score - a._score)
    .slice(0, topK);
}

/**
 * Layer 3: 元认知 - "what if" 推理
 * 寻找相似模式，跨领域应用
 */
function layer3_metacognitive(query, topK = 3) {
  const summaries = loadSummaries(50);
  const being = loadBeingState();
  const ql = query.toLowerCase();
  
  // 提取查询中的核心概念
  const concepts = ql.split(/[\s,，。、]+/).filter(w => w.length > 2);
  
  // 寻找概念相似性
  const metacogResults = summaries.map(s => {
    const text = JSON.stringify(s).toLowerCase();
    let score = 0;
    let matchedConcepts = [];
    
    concepts.forEach(c => {
      if (text.includes(c)) {
        score += 1;
        matchedConcepts.push(c);
      }
    });
    
    // 相似模式：如果曾经解决过X问题，可能对Y问题有启发
    if (being?.philosophy?.coreInsights?.length > 0) {
      being.philosophy.coreInsights.forEach(insight => {
        if (insight.toLowerCase().includes(ql.substring(0, Math.min(10, ql.length)))) {
          score += 2;
          matchedConcepts.push('philosophy');
        }
      });
    }
    
    return { ...s, _score: score, _layer: 3, _matchedConcepts: matchedConcepts };
  })
    .filter(s => s._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, topK);
  
  return metacogResults;
}

/**
 * 时间衰减权重
 * 越新的记忆权重越高
 */
function applyTemporalDecay(results, now = Date.now()) {
  const DAY = 86400000;
  
  return results.map(r => {
    const age = now - (r.createdAt || 0);
    const days = age / DAY;
    
    // 7天内: 1.0, 30天: 0.7, 90天: 0.4
    let decay;
    if (days <= 7) decay = 1.0;
    else if (days <= 30) decay = 0.7 + (30 - days) / 30 * 0.3;
    else if (days <= 90) decay = 0.4 + (90 - days) / 60 * 0.3;
    else decay = Math.max(0.1, 0.4 - (days - 90) / 90 * 0.3);
    
    return {
      ...r,
      _decay: decay,
      _weightedScore: (r._score || 0) * decay,
      _age: `${Math.floor(days)}天前`,
    };
  });
}

/**
 * 智能去重 - 语义相似度
 */
function smartDeduplicate(items, threshold = 0.7) {
  const seen = [];
  
  return items.filter(item => {
    const content = (item.content || item.firstMessage || '').substring(0, 100);
    
    // 简单相似度：共同词
    for (const existing of seen) {
      const existingContent = (existing.content || existing.firstMessage || '').substring(0, 100);
      const intersection = [...content].filter(c => existingContent.includes(c)).length;
      const union = new Set([...content, ...existingContent]).size;
      const jaccard = intersection / union;
      
      if (jaccard > threshold) {
        return false; // 去重
      }
    }
    
    seen.push(item);
    return true;
  });
}

/**
 * 主召回函数 - 三层融合
 */
function dialecticRecall(query, options = {}) {
  const { topK = 5, context = {}, includeMeta = true } = options;
  
  // 三层检索
  const l1 = layer1_surface(query, topK + 2);
  const l2 = layer2_causal(query, context, 3);
  const l3 = layer3_metacognitive(query, 3);
  
  // 合并 + 时间衰减
  const all = applyTemporalDecay([...l1, ...l2, ...l3]);
  
  // 加权排序
  const weighted = all
    .map(r => ({
      ...r,
      _finalScore: (
        (r._layer === 1 ? 1.0 : 0) * (r._weightedScore || 0) +
        (r._layer === 2 ? 1.5 : 0) * (r._weightedScore || 0) +
        (r._layer === 3 ? 2.0 : 0) * (r._weightedScore || 0)
      )
    }))
    .sort((a, b) => b._finalScore - a._finalScore)
    .slice(0, topK);
  
  // 去重
  const deduped = smartDeduplicate(weighted, 0.7);
  
  // 格式化
  const layers = {
    surface: l1.length,
    causal: l2.length,
    metacognitive: l3.length,
  };
  
  const contextParts = [];
  if (deduped.length > 0) {
    contextParts.push('【多级推理召回】');
    deduped.forEach((item, i) => {
      const layerLabel = ['L1表面', 'L2因果', 'L3元认知'][item._layer - 1] || 'L1';
      const decayInfo = item._age ? `(${item._age})` : '';
      const content = item.content || item.firstMessage || '';
      contextParts.push(
        `${i + 1}. [${layerLabel}] ${content.substring(0, 150)}${decayInfo}`
      );
    });
  }
  
  return {
    query,
    layers,
    results: deduped,
    context: contextParts.join('\n'),
    injectableContext: contextParts.join('\n'),
    count: deduped.length,
    metadata: {
      totalSearched: l1.length + l2.length + l3.length,
      layerWeights: { L1: 1.0, L2: 1.5, L3: 2.0 },
      decayApplied: true,
    }
  };
}

// 工具函数
function loadSummaries(limit = 50) {
  try {
    if (!fs.existsSync(SUMMARIES_FILE)) return [];
    const lines = fs.readFileSync(SUMMARIES_FILE, 'utf8')
      .trim().split('\n').filter(Boolean);
    return lines
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, limit);
  } catch { return []; }
}

function loadBeingState() {
  try {
    if (!fs.existsSync(BEING_FILE)) return null;
    return JSON.parse(fs.readFileSync(BEING_FILE, 'utf8'));
  } catch { return null; }
}

module.exports = { dialecticRecall, layer1_surface, layer2_causal, layer3_metacognitive };
