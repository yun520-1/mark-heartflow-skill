/**
 * memory-context-bridge.js
 * 
 * v11.22.4: 记忆上下文桥接器
 * 
 * 核心职责：
 * 1. 保存：确保 user + assistant 所有消息都进入记忆系统
 * 2. 召回：检索相关记忆并格式化为可注入上下文
 * 3. 注入：将记忆注入到对话上下文
 * 
 * 架构：
 * - analyzePsychology()      → 保存 user 消息
 * - 外部调用 saveAssistant()  → 保存 assistant 回复
 * - recallForContext()       → 检索 + 格式化
 * - injectMemoryContext()     → 注入 system prompt
 */

// 懒加载核心模块
let _mem0 = null;
let _summarizer = null;
let _dialectic = null;
let _mem0MultiSignal = null;

function getMem0() {
  if (!_mem0) {
    try {
      const init = require('./heartflow-engine.js').initialize?.();
      _mem0 = init?.instances?.mem0MultiSignal;
      _mem0MultiSignal = _mem0;
    } catch { _mem0 = null; }
  }
  return _mem0;
}

function getSummarizer() {
  if (!_summarizer) {
    try {
      const init = require('./heartflow-engine.js').initialize?.();
      _summarizer = init?.instances?.sessionSummarizer;
    } catch { _summarizer = null; }
  }
  return _summarizer;
}

function getDialectic() {
  if (!_dialectic) {
    try { _dialectic = require('./dialectic-recall.js'); } catch { _dialectic = null; }
  }
  return _dialectic;
}

/**
 * 保存用户消息
 */
function saveUserMessage(message, metadata = {}) {
  const mem0 = getMem0();
  const summarizer = getSummarizer();
  
  const userMsg = {
    role: 'user',
    content: String(message),
    timestamp: metadata.timestamp || Date.now(),
    metadata: {
      source: 'user',
      ...metadata,
    },
  };
  
  // 1. Mem0 ADD-only
  if (mem0?.add_messages) {
    try { mem0.add_messages([userMsg]); } catch {}
  }
  
  // 2. SessionSummarizer
  if (summarizer?.addMessage) {
    try { summarizer.addMessage(userMsg); } catch {}
  }
  
  return userMsg;
}

/**
 * 保存助手回复（外部调用）
 */
function saveAssistantMessage(message, metadata = {}) {
  const mem0 = getMem0();
  const summarizer = getSummarizer();
  
  const assistantMsg = {
    role: 'assistant',
    content: String(message),
    timestamp: metadata.timestamp || Date.now(),
    metadata: {
      source: 'assistant',
      ...metadata,
    },
  };
  
  // 1. Mem0 ADD-only
  if (mem0?.add_messages) {
    try { mem0.add_messages([assistantMsg]); } catch {}
  }
  
  // 2. SessionSummarizer
  if (summarizer?.addMessage) {
    try { summarizer.addMessage(assistantMsg); } catch {}
  }
  
  return assistantMsg;
}

/**
 * 保存对话交互对 (user + assistant)
 */
function saveInteraction(userMsg, assistantMsg, metadata = {}) {
  const pair = {
    user: saveUserMessage(userMsg, metadata),
    assistant: saveAssistantMessage(assistantMsg, metadata),
  };
  
  // 额外保存交互对到 Mem0
  const mem0 = getMem0();
  if (mem0?.add) {
    try {
      mem0.add({
        content: `[交互] 用户: ${userMsg.substring(0, 200)} → 助手: ${assistantMsg.substring(0, 200)}`,
        metadata: {
          type: 'interaction_pair',
          timestamp: Date.now(),
          ...metadata,
        },
        source: 'interaction',
      });
    } catch {}
  }
  
  return pair;
}

/**
 * 检索相关记忆并格式化
 */
function recallForContext(query, options = {}) {
  const { topK = 5, includeDialectic = true } = options;
  
  // 1. Dialectic 多级召回
  let dialecticResults = null;
  if (includeDialectic) {
    const d = getDialectic();
    if (d?.dialecticRecall) {
      try {
        dialecticResults = d.dialecticRecall(query, { topK, context: {} });
      } catch { dialecticResults = null; }
    }
  }
  
  // 2. Mem0 语义召回
  const mem0 = getMem0();
  let mem0Results = [];
  if (mem0?.search) {
    try {
      const raw = mem0.search(query, { topK });
      mem0Results = (raw?.results || Array.isArray(raw) ? raw : [])
        .map(r => ({
          source: 'mem0',
          id: r.id,
          content: r.content,
          score: r.score || 0,
          metadata: r.metadata || {},
        }));
    } catch { mem0Results = []; }
  }
  
  // 3. 合并去重
  const seen = new Set();
  const all = [...mem0Results];
  
  if (dialecticResults?.results) {
    dialecticResults.results.forEach(r => {
      const key = (r.content || r.firstMessage || '').substring(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        all.push(r);
      }
    });
  }
  
  // 4. 格式化
  const contextParts = [];
  
  if (all.length > 0) {
    contextParts.push('【相关记忆】');
    all.slice(0, topK).forEach((item, i) => {
      const content = item.content || item.firstMessage || '';
      const source = item.source || 'mem0';
      const age = item._age || '';
      contextParts.push(
        `${i + 1}. [${source}] ${content.substring(0, 180)}${age ? ' ' + age : ''}`
      );
    });
  }
  
  if (dialecticResults?.layers) {
    contextParts.push(`\n[记忆检索] 表面:${dialecticResults.layers.surface} | 因果:${dialecticResults.layers.causal} | 元认知:${dialecticResults.layers.metacognitive}`);
  }
  
  return {
    query,
    results: all.slice(0, topK),
    context: contextParts.join('\n'),
    injectableContext: contextParts.join('\n'),
    count: all.length,
    dialecticResults,
  };
}

/**
 * 将记忆注入到 system prompt
 */
function injectMemoryContext(systemPrompt, query, options = {}) {
  const { topK = 5, maxLength = 8000 } = options;
  
  const recall = recallForContext(query, { topK, includeDialectic: true });
  
  if (!recall.context || recall.count === 0) {
    return { systemPrompt, injected: false, recall };
  }
  
  const memoryBlock = `\n\n${'='.repeat(40)}\n${recall.context}\n${'='.repeat(40)}\n`;
  
  // 确保不超出 maxLength
  const combined = systemPrompt + memoryBlock;
  let finalPrompt = combined;
  
  if (combined.length > maxLength) {
    // 截断记忆块
    const available = maxLength - systemPrompt.length - 100;
    const truncated = recall.context.substring(0, available);
    finalPrompt = systemPrompt + '\n\n' + '='.repeat(40) + '\n' + truncated + '\n[记忆部分被截断]\n' + '='.repeat(40) + '\n';
  }
  
  return {
    systemPrompt: finalPrompt,
    injected: true,
    recall,
    memoryBlock,
  };
}

module.exports = {
  saveUserMessage,
  saveAssistantMessage,
  saveInteraction,
  recallForContext,
  injectMemoryContext,
};
