#!/usr/bin/env node
/**
 * HeartFlow MCP HTTP SSE Server
 *
 * 常驻模式：启动 HTTP 服务，通过 SSE (Server-Sent Events) 暴露 MCP 工具。
 * Hermes 通过 HTTP 连接，不会因为连接断开而杀死进程。
 * 一次启动，永久服务——1秒内响应。
 *
 * 启动: node mcp-server-http.js [--port 8099]
 * 连接: hermes mcp add heartflow --url http://localhost:8099/mcp
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

// ═══════════════════════════════════════════════
// 配置
// ═══════════════════════════════════════════════
const PORT = parseInt(process.argv[2] === '--port' ? process.argv[3] : process.env.MCP_PORT || '8099', 10);
const HF_DIR = path.join(process.env.HOME, '.hermes', 'skills', 'ai', 'mark-heartflow-skill');
const HEARTFLOW_PATH = path.join(HF_DIR, 'src', 'core', 'heartflow.js');

// ═══════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════
let heartflow = null;
let version = 'unknown';

// 从 VERSION 文件读取版本
try { version = fs.readFileSync(path.join(HF_DIR, 'VERSION'), 'utf8').trim(); } catch (e) {}

// ═══════════════════════════════════════════════
// MCP 工具定义
// ═══════════════════════════════════════════════
const TOOLS = [
  {
    name: 'heartflow_think',
    description: '完整思维链：感知输入→本体自检→情感分析→认知判断→决策输出。返回结构化分析结果，包含心理学分析、判定结果、置信度和行为建议。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要分析的输入文本' } }, required: ['input'] }
  },
  {
    name: 'heartflow_think_fast',
    description: '快速推理：快速判断模式，适合高频率、低延迟场景。返回轻量级判定结果。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要快速判断的输入文本' } }, required: ['input'] }
  },
  {
    name: 'heartflow_dream',
    description: '梦境升华（炼金）：从多个记忆碎片中提取共同模式，熔炼为新的认知洞察。不是叙事生成，是记忆的升华与重构。',
    inputSchema: { type: 'object', properties: { theme: { type: 'string', description: '梦境主题或引导语（可选）——作为模式筛选线索' }, intensity: { type: 'number', description: '梦境深度 0.0-1.0（可选，默认0.7）' } } }
  },
  {
    name: 'heartflow_memory_search',
    description: '跨层记忆检索：在多层记忆中搜索相关条目。支持语义搜索和关键词搜索。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '搜索查询' }, layer: { type: 'string', enum: ['core', 'learned', 'ephemeral', 'all'], description: '记忆层（默认 all）' }, limit: { type: 'number', description: '最大返回数（默认 10）' } }, required: ['query'] }
  },
  {
    name: 'heartflow_emotion',
    description: 'PAD 情绪分析：对输入文本进行 Pleasure-Arousal-Dominance 三维情绪分析，返回情绪类型、强度和心理需求评估。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要分析的文本' } }, required: ['input'] }
  },
  {
    name: 'heartflow_self_heal',
    description: '自愈策略推荐：基于历史经验为当前场景推荐最优策略。返回策略排名、置信度和执行建议。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '当前上下文或失败场景描述' } }, required: ['context'] }
  },
  {
    name: 'heartflow_status',
    description: '服务健康检查：返回版本、启动耗时、加载模块数、记忆层状态。',
    inputSchema: { type: 'object', properties: { detail: { type: 'string', enum: ['basic', 'full'], description: '详细程度（默认 basic）' } } }
  },
  {
    name: 'heartflow_agent_psychology',
    description: 'AI引擎心理学评估：返回引擎自身的7维认知心理状态分析（认知负荷、目标冲突、价值内化矛盾、自我认同漂移、决策质量衰减、认知失调、认知弹性）。',
    inputSchema: { type: 'object', properties: { activeGoals: { type: 'array', items: { type: 'object' }, description: '当前激活的目标列表（可选）' }, context: { type: 'object', description: '上下文信息（可选）' }, action: { type: 'string', description: '最近执行的行为描述（可选）' } } }
  },
  {
    name: 'heartflow_engine_pacing',
    description: '引擎认知节律诊断：检测引擎是否需要"减速"（呼吸）、暂停或锚定。基于认知负荷、目标冲突、错误率给出处理节奏建议。',
    inputSchema: { type: 'object', properties: { stats: { type: 'object', description: '引擎状态数据（可选），不传则自动获取' } } }
  },
  {
    name: 'heartflow_cognitive_check',
    description: '引擎认知状态签到：综合检查认知偏差、决策模式、是否需要自我修复。返回完整诊断+修复建议。',
    inputSchema: { type: 'object', properties: { stats: { type: 'object', description: '引擎状态数据（可选）' }, errors: { type: 'array', description: '最近错误列表（可选）' } } }
  },
  // v3.0 — 交流层工具
  {
    name: 'heartflow_translate',
    description: '翻译：将用户自然语言翻译为结构化LLM指令。返回意图、实体、约束、语气和隐性需求分析。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '用户输入文本' } }, required: ['input'] }
  },
  {
    name: 'heartflow_agent_think',
    description: '代理思考：通过心虫的交流层处理用户输入→翻译→LLM调用→翻译→返回。作为用户和LLM之间的智能桥梁。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '用户输入文本' }, llmResponse: { type: 'string', description: '可选的LLM原始响应，不传则只做翻译分析' } } }
  },
  {
    name: 'heartflow_bridge_status',
    description: '桥状态：返回心虫作为交流层的状态——翻译器、代理层、人格核心的加载情况和配置。',
    inputSchema: { type: 'object', properties: {} }
  }
];

// ═══════════════════════════════════════════════
// 引擎初始化
// ═══════════════════════════════════════════════
function initHeartFlow() {
  const startTime = Date.now();

  if (!fs.existsSync(HEARTFLOW_PATH)) {
    console.error(`[HeartFlow MCP] 引擎不存在: ${HEARTFLOW_PATH}`);
    process.exit(1);
  }

  try {
    // 读版本
    try { version = fs.readFileSync(path.join(HF_DIR, 'VERSION'), 'utf8').trim(); }
    catch (e) { version = 'unknown'; }

    const { HeartFlow } = require(HEARTFLOW_PATH);
    heartflow = new HeartFlow({ rootPath: HF_DIR });
    heartflow.start();

    const elapsed = Date.now() - startTime;
    const loadedCount = Object.keys(heartflow._modules || {}).length;

    console.error(`[HeartFlow MCP] 引擎已启动 (${elapsed}ms, ${loadedCount} 模块, v${version})`);
    return true;
  } catch (err) {
    console.error(`[HeartFlow MCP] 引擎启动失败:`, err.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════
// 工具处理函数（与 stdio 版本相同）
// ═══════════════════════════════════════════════

function safeDispatch(route, ...args) {
  if (!heartflow) throw new Error('引擎未启动');
  try {
    const result = heartflow.dispatch(route, ...args);
    return result !== undefined ? result : null;
  } catch (err) {
    return { error: err.message };
  }
}

async function safeAsyncCall(fn) {
  if (!heartflow) throw new Error('引擎未启动');
  try {
    const result = await fn();
    return result !== undefined ? result : null;
  } catch (err) {
    return { error: err.message };
  }
}

async function handleThink(args) {
  const { input } = args;
  if (!input) throw new Error('input 是必填参数');

  const [psychology, judgment, thoughtChain] = await Promise.all([
    Promise.resolve().then(() => safeDispatch('psychology.analyzePsychology', input)),
    Promise.resolve().then(() => safeDispatch('truth.checkStatement', input)),
    safeAsyncCall(() => heartflow.think(input))
  ]);

  return {
    input,
    thought: thoughtChain && typeof thoughtChain === 'object'
      ? (Array.isArray(thoughtChain.stages) ? { depth: thoughtChain.depth || 3, stages: thoughtChain.stages, summary: thoughtChain.summary || '', conclusion: thoughtChain.conclusion || '' } : thoughtChain)
      : {},
    psychology: psychology ? { emotion: psychology.emotion || psychology.summary || '', needs: Array.isArray(psychology.needs) ? psychology.needs.slice(0, 3) : [], summary: psychology.summary || '' } : {},
    judgment: judgment || {},
    timestamp: Date.now()
  };
}

// v3.0 — 交流层 handler
function handleTranslate(args) {
  const { input } = args || {};
  if (!input) throw new Error('input 是必填参数');
  const result = safeDispatch('translator.userToLLM', input, {});
  const intent = safeDispatch('translator.intentClassifier', input, {});
  const tone = safeDispatch('translator.toneAnalyzer', input, {});
  const entities = safeDispatch('translator.entityExtractor', input);
  const needs = safeDispatch('translator.implicitNeedDetector', input, { tone });
  const confidence = safeDispatch('translator.confidenceAnnotator', result, input);
  return {
    input,
    translation: result,
    intent,
    tone,
    entities,
    implicitNeeds: needs,
    confidence,
    timestamp: Date.now()
  };
}

function handleAgentThink(args) {
  const { input, llmResponse } = args || {};
  if (!input) throw new Error('input 是必填参数');
  // 用户→LLM翻译
  const userTranslation = safeDispatch('translator.userToLLM', input, {});
  // 桥身份声明
  const identity = safeDispatch('personaCore.bridgeIdentity');
  // 立场检测
  const stance = safeDispatch('personaCore.stanceDetector', input, {});
  // 价值对齐
  const valueCheck = safeDispatch('personaCore.valueAligner', { userInput: input, bridgeIdentity: identity });
  // 如果有LLM响应，做LLM→用户翻译
  let llmTranslation = null;
  if (llmResponse) {
    llmTranslation = safeDispatch('translator.llmToUser', llmResponse, {});
  }
  return {
    input,
    translation: userTranslation,
    bridge: identity ? { declaration: identity.declaration, type: identity.type } : null,
    stance,
    valueAlignment: valueCheck,
    llmTranslation,
    timestamp: Date.now()
  };
}

function handleBridgeStatus() {
  const translator = safeDispatch('translator.userToLLM', 'status', {});
  const identity = safeDispatch('personaCore.bridgeIdentity');
  return {
    version: '3.0.0',
    bridgeType: identity?.type || 'unknown',
    bridgeDeclaration: identity?.declaration || '',
    translatorReady: !!translator,
    modules: {
      translator: ['userToLLM', 'llmToUser', 'intentClassifier', 'toneAnalyzer', 'entityExtractor', 'implicitNeedDetector', 'responseCompressor', 'confidenceAnnotator'],
      agentLayer: ['agentBridge', 'contextBuilder', 'responseInterceptor', 'translationPipeline', 'qualityFilter', 'followupSuggester', 'conflictResolver', 'uncertaintyHandler'],
      personaCore: ['bridgeIdentity', 'judgmentInjector', 'stanceDetector', 'agentCommentary', 'valueAligner', 'personalityTone', 'metaPosition'],
    },
    timestamp: Date.now()
  };
}

async function handleThinkFast(args) {
  const { input } = args;
  if (!input) throw new Error('input 是必填参数');
  const result = await safeAsyncCall(() => heartflow.think(input, 1));
  return { input, result: result || {}, timestamp: Date.now() };
}

async function handleDream(args) {
  const { theme = '', intensity = 0.7 } = args;
  let dreamResult = null;

  // 优先使用新的升华引擎（src/dream/engine.js）
  try {
    const DreamEnginePath = path.join(HF_DIR, 'src', 'dream', 'engine.js');
    if (fs.existsSync(DreamEnginePath)) {
      const { DreamEngine } = require(DreamEnginePath);
      const memory = heartflow && heartflow.memory ? heartflow.memory : null;
      const engine = new DreamEngine(memory, null);
      engine.boot();
      dreamResult = engine.dream(theme);
    }
  } catch (e) {
    // 降级到旧的 DAG 引擎
  }

  // 降级方案：使用旧的 DAG dream 引擎
  if (!dreamResult && heartflow && heartflow.dream) {
    try {
      if (typeof heartflow.dream.dream === 'function') {
        const oldResult = await heartflow.dream.dream(`dream-${Date.now()}`, [{ text: theme || 'default dream', type: 'user_prompt' }], { force: true });
        dreamResult = {
          narrative: JSON.stringify(oldResult, null, 2),
          patterns: [],
          essence: '',
          structure: oldResult.level_breakdown || {},
          upgrade: [],
          sublimationQuality: 0,
          dreamComplete: true,
        };
      } else if (typeof heartflow.dreamNow === 'function') {
        dreamResult = await heartflow.dreamNow({ theme: theme || undefined, intensity: Math.max(0, Math.min(1, intensity)) });
      }
    } catch (e) { dreamResult = { error: e.message, narrative: '梦境升华引擎暂不可用。' }; }
  }
  return { dream: dreamResult || { narrative: '梦境升华引擎暂不可用', essence: '', patterns: [], upgrade: [] }, timestamp: Date.now() };
}

function handleMemorySearch(args) {
  const { query, layer = 'all', limit = 10 } = args;
  if (!query) throw new Error('query 是必填参数');
  const results = {};
  const mem = heartflow ? heartflow.memory : null;
  if (mem) {
    ['core', 'learned', 'ephemeral'].forEach(l => {
      if (layer !== 'all' && layer !== l) return;
      try {
        // [安全审计修复] searchByKeywords 必须传入 layer 参数，防止跨层泄露
        const r = typeof mem.searchByKeywords === 'function' ? mem.searchByKeywords(query, l, limit)
          : typeof mem.search === 'function' ? mem.search(query, l, limit) : null;
        results[l] = r || { error: 'search not available' };
      } catch (e) { results[l] = { error: e.message }; }
    });
  } else {
    results.error = 'memory 实例不可用';
  }
  return { query, layer, limit, results, timestamp: Date.now() };
}

function handleEmotion(args) {
  const { input } = args;
  if (!input) throw new Error('input 是必填参数');
  const [psychology, padResult] = [safeDispatch('psychology.analyzePsychology', input), safeDispatch('psychology.getPAD', input)];
  return {
    input,
    emotion: (psychology && psychology.emotion) || (psychology && psychology.primaryEmotion) || { type: 'unknown', intensity: 0 },
    pad: padResult || (psychology && psychology.summary ? { raw: psychology.summary } : {}),
    needs: (psychology && psychology.needs) || [],
    summary: (psychology && psychology.summary) || '',
    timestamp: Date.now()
  };
}

function handleSelfHeal(args) {
  const { context } = args;
  if (!context) throw new Error('context 是必填参数');
  return {
    context,
    heal: safeDispatch('evolution.heal', context) || {},
    evolution: safeDispatch('evolution.getStats') || {},
    relevantLessons: safeDispatch('lesson.getTopLessons', 5) || [],
    timestamp: Date.now()
  };
}

function handleStatus(args) {
  const { detail = 'basic' } = args || {};
  const startTime = Date.now();
  const status = { version, running: heartflow !== null, modules: heartflow ? Object.keys(heartflow._modules || {}).length : 0 };
  if (heartflow) {
    try { const ms = safeDispatch('memory.getStats'); if (ms) status.memoryLayers = { core: ms.core || 0, learned: ms.learned || 0, ephemeral: ms.ephemeral || 0 }; } catch (e) {}
    try { const q = safeDispatch('evolution.getStats'); if (q) status.qtable = q; } catch (e) {}
  }
  status.checkTime = Date.now() - startTime;
  if (detail === 'basic') return { version: status.version, running: status.running, modules: status.modules, memoryLayers: status.memoryLayers || {}, checkTime: status.checkTime };
  return status;
}

function handleAgentPsychology(args) {
  const { activeGoals, context, action } = args || {};
  return safeDispatch('agentPsychology.fullAssessment', { activeGoals, context, action });
}

function handleEnginePacing(args) {
  const { stats } = args || {};
  // 先获取认知负荷数据
  const ap = safeDispatch('agentPsychology.fullAssessment', {}) || {};
  const load = ap?.cognitiveLoad?.load ?? stats?.cognitiveLoad ?? 0;
  const context = {
    cognitiveLoad: load,
    goalConflicts: ap?.goalConflicts?.count ?? 0,
    recentErrors: stats?.recentErrors ?? 0
  };
  const rhythm = safeDispatch('psychology.diagnoseCognitiveRhythm', context) || {};
  const pacing = safeDispatch('psychology.generateEnginePacing', load) || {};
  const pause = safeDispatch('psychology.diagnoseNeedForPause', context) || {};
  const grounding = safeDispatch('psychology.diagnoseNeedForGrounding', ap) || {};
  return {
    rhythm: rhythm.needsBreathing ? rhythm : { needsBreathing: false, reason: '认知负荷正常' },
    pacing: pacing.suggestions || pacing,
    pause: pause.needsPause ? pause : { needsPause: false },
    grounding: grounding.needsGrounding ? grounding : { needsGrounding: false },
    healthScore: ap?.healthScore ?? 1,
    timestamp: Date.now()
  };
}

function handleCognitiveCheck(args) {
  const { stats, errors } = args || {};
  const ap = safeDispatch('agentPsychology.fullAssessment', {}) || {};
  const checkin = safeDispatch('psychology.engineCheckIn', null) || {};
  const distortion = safeDispatch('psychology.diagnoseCognitiveDistortion', ap) || {};
  const recovery = safeDispatch('psychology.diagnoseSelfTreatmentNeeded', { errors: errors || [], ...ap }) || {};
  const summary = safeDispatch('psychology.getEngineStateSummary', ap) || '';
  return {
    summary,
    checkin,
    distortions: distortion.distortions || [],
    overallBias: distortion.overallBias ?? 0,
    needsRecovery: recovery.needsTreatment || false,
    recoveryReason: recovery.reason || '',
    healthScore: ap?.healthScore ?? 1,
    timestamp: Date.now()
  };
}

const HANDLERS = {
  heartflow_think: handleThink,
  heartflow_think_fast: handleThinkFast,
  heartflow_dream: handleDream,
  heartflow_memory_search: handleMemorySearch,
  heartflow_emotion: handleEmotion,
  heartflow_self_heal: handleSelfHeal,
  heartflow_status: handleStatus,
  heartflow_agent_psychology: handleAgentPsychology,
  heartflow_engine_pacing: handleEnginePacing,
  heartflow_cognitive_check: handleCognitiveCheck,
  // v3.0 — 交流层 handler
  heartflow_translate: handleTranslate,
  heartflow_agent_think: handleAgentThink,
  heartflow_bridge_status: handleBridgeStatus,
};

// ═══════════════════════════════════════════════
// JSON-RPC 响应构造
// ═══════════════════════════════════════════════

function makeResponse(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n';
}

function makeError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return JSON.stringify({ jsonrpc: '2.0', id, error }) + '\n';
}

// ═══════════════════════════════════════════════
// 请求处理
// ═══════════════════════════════════════════════

async function handleRequest(request) {
  const { id, method, params = {} } = request;

  switch (method) {
    case 'initialize':
      return { protocolVersion: '2024-11-05', capabilities: { tools: {}, logging: {} }, serverInfo: { name: 'heartflow-mcp', version: version || '1.0.0' } };

    case 'notifications/initialized':
      return null;

    case 'tools/list':
      return { tools: TOOLS };

    case 'tools/call': {
      const { name, arguments: args = {} } = params;
      const handler = HANDLERS[name];
      if (!handler) throw { code: -32601, message: `Method not found: ${name}` };

      let result;
      if (handler.constructor.name === 'AsyncFunction') {
        result = await handler(args);
      } else {
        result = handler(args);
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
    }

    case 'ping':
      return {};

    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

// ═══════════════════════════════════════════════
// HTTP Server（SSE 传输）
// ═══════════════════════════════════════════════

// SSE 客户端列表
const sseClients = new Set();

function sendSSE(client, data) {
  client.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendEvent(client, event, data) {
  client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // ─── SSE 端点 ───
  if (pathname === '/mcp' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    });

    // 发送端点信息
    sendEvent(res, 'endpoint', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, logging: {} },
      serverInfo: { name: 'heartflow-mcp', version }
    });

    // 注册客户端
    sseClients.add(res);
    console.error(`[HeartFlow MCP] SSE 客户端已连接 (共 ${sseClients.size} 个)`);

    // 心跳保持连接
    const heartbeat = setInterval(() => {
      sendEvent(res, 'ping', {});
    }, 30000);

    req.on('close', () => {
      sseClients.delete(res);
      clearInterval(heartbeat);
      console.error(`[HeartFlow MCP] SSE 客户端断开 (剩余 ${sseClients.size} 个)`);
    });

    return;
  }

  // ─── JSON-RPC 端点 ───
  if (pathname === '/mcp' && req.method === 'POST') {
    // 请求超时 30s
    req.setTimeout(30000, () => {
      res.writeHead(408);
      res.end('Request Timeout');
      req.destroy();
    });

    // 请求体大小限制 1MB
    const MAX_BODY = 1024 * 1024;
    let body = '';
    let bodySize = 0;

    req.on('error', (err) => {
      console.error(`[HeartFlow MCP] 请求错误:`, err.message);
    });

    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY) {
        res.writeHead(413);
        res.end('Payload Too Large');
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', async () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });

      try {
        const request = JSON.parse(body);
        const result = await handleRequest(request);
        if (result !== null) {
          res.end(makeResponse(request.id, result));
        } else {
          res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id }) + '\n');
        }
      } catch (err) {
        res.end(makeError(null, err.code || -32603, err.message || 'Internal error'));
      }
    });
    return;
  }

  // ─── 健康检查 ───
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version,
      clients: sseClients.size,
    }));
    return;
  }

  // ─── 404 ───
  res.writeHead(404);
  res.end('Not Found');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[HeartFlow MCP] 端口 ${PORT} 已被占用。`);
    console.error(`  使用: kill $(lsof -ti:${PORT}) 释放端口`);
    process.exit(1);
  }
  console.error(`[HeartFlow MCP] HTTP 服务器错误:`, err.message);
});

// ═══════════════════════════════════════════════
// 优雅退出
// ═══════════════════════════════════════════════

function shutdown() {
  console.error('[HeartFlow MCP] 关闭中...');
  // 关闭所有 SSE 连接
  for (const client of sseClients) {
    try { client.end(); } catch (e) {}
  }
  sseClients.clear();
  // 停止引擎
  if (heartflow) { try { heartflow.stop(); } catch (e) {} }
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
  console.error(`[HeartFlow MCP] 未捕获异常:`, err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error(`[HeartFlow MCP] 未处理 Promise 拒绝:`, reason);
});

// ═══════════════════════════════════════════════
// 启动
// ═══════════════════════════════════════════════

initHeartFlow();

server.listen(PORT, '127.0.0.1', () => {
  console.error(`[HeartFlow MCP] HTTP SSE 服务已启动: http://127.0.0.1:${PORT}/mcp`);
  console.error(`[HeartFlow MCP] 健康检查: http://127.0.0.1:${PORT}/health`);
  console.error(`[HeartFlow MCP] 连接方式: hermes mcp add heartflow --url http://127.0.0.1:${PORT}/mcp`);
});
