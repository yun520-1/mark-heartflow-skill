#!/usr/bin/env node
/**
 * HeartFlow MCP Server
 *
 * 常驻进程，通过 stdio MCP 协议暴露引擎引擎能力。
 * 一次启动，永久服务——不需要每次对话重新加载引擎。
 *
 * MCP 协议: JSON-RPC 2.0 over stdio
 * 支持的传输: stdio (Hermes 原生 MCP 客户端)
 *
 * 暴露工具:
 *   heartflow_think         — 完整思维链（感知→本体→情感→认知）
 *   heartflow_think_fast    — 快速推理
 *   heartflow_dream         — 梦境生成
 *   heartflow_memory_search — 跨层记忆检索
 *   heartflow_emotion       — PAD 情绪分析
 *   heartflow_self_heal     — Q-learning 自愈策略
 *   heartflow_status        — 引擎健康检查
 */

const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════
// 引擎引擎路径
// ═══════════════════════════════════════════════
const HF_DIR = path.join(process.env.HOME, '.hermes', 'skills', 'ai', 'mark-heartflow-skill');
const HEARTFLOW_PATH = path.join(HF_DIR, 'src', 'core', 'heartflow.js');

// ═══════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════
let heartflow = null;     // HeartFlow 引擎实例
let version = 'unknown';

// ═══════════════════════════════════════════════
// MCP 协议常量
// ═══════════════════════════════════════════════
const MCP_JSON_RPC_VERSION = '2.0';

// ═══════════════════════════════════════════════
// 工具定义（MCP list_tools 响应）
// ═══════════════════════════════════════════════
const TOOLS = [
  {
    name: 'heartflow_think',
    description: '完整思维链：感知输入→本体自检→情感分析→认知判断→决策输出。返回结构化分析结果，包含心理学分析、判定结果、置信度和行为建议。',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '需要分析的输入文本' }
      },
      required: ['input']
    }
  },
  {
    name: 'heartflow_think_fast',
    description: '快速推理：快速判断模式，适合高频率、低延迟场景。返回轻量级判定结果。',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '需要快速判断的输入文本' }
      },
      required: ['input']
    }
  },
  {
    name: 'heartflow_dream',
    description: '梦境生成：基于输入主题生成叙事性梦境文本。返回包含场景、叙事和转折点的梦境文本。',
    inputSchema: {
      type: 'object',
      properties: {
        theme: { type: 'string', description: '梦境主题或引导语（可选）' },
        intensity: { type: 'number', description: '梦境强度 0.0-1.0（可选，默认0.7）' }
      }
    }
  },
  {
    name: 'heartflow_memory_search',
    description: '跨层记忆检索：在多层记忆中搜索相关条目。支持语义搜索和关键词搜索。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索查询' },
        layer: { type: 'string', enum: ['core', 'learned', 'ephemeral', 'all'], description: '记忆层（默认 all）' },
        limit: { type: 'number', description: '最大返回数（默认 10）' }
      },
      required: ['query']
    }
  },
  {
    name: 'heartflow_emotion',
    description: 'PAD 情绪分析：对输入文本进行 Pleasure-Arousal-Dominance 三维情绪分析，返回情绪类型、强度和心理需求评估。',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '需要分析的文本' }
      },
      required: ['input']
    }
  },
  {
    name: 'heartflow_self_heal',
    description: '自愈策略推荐：基于历史经验为当前场景推荐最优策略。返回策略排名、置信度和执行建议。',
    inputSchema: {
      type: 'object',
      properties: {
        context: { type: 'string', description: '当前上下文或失败场景描述' }
      },
      required: ['context']
    }
  },
  {
    name: 'heartflow_status',
    description: '服务健康检查：返回版本、启动耗时、加载模块数、记忆层状态。',
    inputSchema: {
      type: 'object',
      properties: {
        detail: { type: 'string', enum: ['basic', 'full'], description: '详细程度（默认 basic）' }
      }
    }
  }
];

// ═══════════════════════════════════════════════
// 引擎引擎初始化（一次启动，永久服务）
// ═══════════════════════════════════════════════
function initHeartFlow() {
  const startTime = Date.now();

  if (!fs.existsSync(HEARTFLOW_PATH)) {
    console.error(`[HeartFlow MCP] 引擎引擎不存在`);
    process.exit(1);
  }

  try {
    // 读版本
    try {
      version = fs.readFileSync(path.join(HF_DIR, 'VERSION'), 'utf8').trim();
    } catch (e) {
      version = 'unknown';
    }

    // 加载引擎引擎
    const { HeartFlow } = require(HEARTFLOW_PATH);
    heartflow = new HeartFlow({ rootPath: HF_DIR });
    heartflow.start();

    const elapsed = Date.now() - startTime;
    const loadedCount = Object.keys(heartflow._modules || {}).length;

    console.error(`[HeartFlow MCP] 引擎引擎已启动 (${elapsed}ms, ${loadedCount} 模块, v${version})`);
    return true;
  } catch (err) {
    console.error(`[HeartFlow MCP] 引擎启动失败:`, err.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════
// 工具处理函数
// ═══════════════════════════════════════════════

/**
 * 安全调用 dispatch，捕获所有异常
 */
function safeDispatch(route, ...args) {
  if (!heartflow) throw new Error('引擎引擎未启动');
  try {
    const result = heartflow.dispatch(route, ...args);
    return result !== undefined ? result : null;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * 安全调用 async 方法
 */
async function safeAsyncCall(fn) {
  if (!heartflow) throw new Error('引擎引擎未启动');
  try {
    const result = await fn();
    return result !== undefined ? result : null;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * heartflow_think — 完整思维链
 */
async function handleThink(args) {
  const { input } = args;
  if (!input) throw new Error('input 是必填参数');

  // 并行获取心理学分析、判定和思维链
  const [psychology, judgment, thoughtChain] = await Promise.all([
    Promise.resolve().then(() => safeDispatch('psychology.analyzePsychology', input)),
    Promise.resolve().then(() => safeDispatch('truth.checkStatement', input)),
    safeAsyncCall(() => heartflow.think(input))
  ]);

  // 提取思维链结果
  let thoughtResult = {};
  if (thoughtChain && typeof thoughtChain === 'object') {
    // thoughtChain 可能包含 stages 数组或直接包含结果字段
    if (Array.isArray(thoughtChain.stages) && thoughtChain.stages.length > 0) {
      thoughtResult = {
        depth: thoughtChain.depth || 3,
        stages: thoughtChain.stages,
        summary: thoughtChain.summary || '',
        conclusion: thoughtChain.conclusion || ''
      };
    } else {
      // 原生 think 返回对象，直接传递
      thoughtResult = thoughtChain;
    }
  }

  // 提取 psychology 关键字段
  let psychologyResult = {};
  if (psychology && typeof psychology === 'object') {
    psychologyResult = {
      emotion: psychology.emotion || psychology.summary || '',
      needs: Array.isArray(psychology.needs) ? psychology.needs.slice(0, 3) : [],
      summary: psychology.summary || ''
    };
  }

  return {
    input,
    thought: thoughtResult,
    psychology: psychologyResult,
    judgment: judgment || {},
    timestamp: Date.now()
  };
}

/**
 * heartflow_think_fast — 快速推理
 */
async function handleThinkFast(args) {
  const { input } = args;
  if (!input) throw new Error('input 是必填参数');

  const result = await safeAsyncCall(() => heartflow.think(input, 1));

  return {
    input,
    result: result || {},
    timestamp: Date.now()
  };
}

/**
 * heartflow_dream — 梦境生成
 */
async function handleDream(args) {
  const { theme = '', intensity = 0.7 } = args;

  const dreamOpts = {
    theme: theme || undefined,
    intensity: Math.max(0, Math.min(1, intensity))
  };

  // 直接调用 dream 实例方法（dispatch 找不到 dream 模块）
  let dreamResult = null;
  if (heartflow && heartflow.dream) {
    try {
      if (typeof heartflow.dream.dream === 'function') {
        dreamResult = await heartflow.dream.dream(
          `dream-${Date.now()}`,
          [{ text: theme || 'default dream', type: 'user_prompt' }],
          { force: true }
        );
      } else if (typeof heartflow.dreamNow === 'function') {
        dreamResult = await heartflow.dreamNow(dreamOpts);
      }
    } catch (e) {
      dreamResult = { error: e.message };
    }
  }

  return {
    dream: dreamResult || { text: '梦境生成器暂不可用' },
    timestamp: Date.now()
  };
}

/**
 * heartflow_memory_search — 跨层记忆检索
 */
function handleMemorySearch(args) {
  const { query, layer = 'all', limit = 10 } = args;
  if (!query) throw new Error('query 是必填参数');

  const results = {};

  // 直接调用 memory 实例方法（dispatch 找不到 memory 模块）
  const mem = heartflow ? heartflow.memory : null;

  if (mem) {
    if (layer === 'all' || layer === 'core') {
      try {
        const r = typeof mem.searchByKeywords === 'function'
          ? mem.searchByKeywords(query, limit)
          : typeof mem.search === 'function'
          ? mem.search(query, 'core', limit)
          : null;
        results.core = r || { error: 'searchByKeywords not available' };
      } catch (e) { results.core = { error: e.message }; }
    }
    if (layer === 'all' || layer === 'learned') {
      try {
        const r = typeof mem.searchBySemantic === 'function'
          ? mem.searchBySemantic(query, limit)
          : typeof mem.search === 'function'
          ? mem.search(query, 'learned', limit)
          : null;
        results.learned = r || { error: 'searchBySemantic not available' };
      } catch (e) { results.learned = { error: e.message }; }
    }
    if (layer === 'all' || layer === 'ephemeral') {
      try {
        const r = typeof mem.searchByTimeRange === 'function'
          ? mem.searchByTimeRange(query, limit)
          : typeof mem.search === 'function'
          ? mem.search(query, 'ephemeral', limit)
          : null;
        results.ephemeral = r || { error: 'searchByTimeRange not available' };
      } catch (e) { results.ephemeral = { error: e.message }; }
    }
  } else {
    results.error = 'memory 实例不可用';
  }

  return {
    query,
    layer,
    limit,
    results,
    timestamp: Date.now()
  };
}

/**
 * heartflow_emotion — PAD 情绪分析
 */
function handleEmotion(args) {
  const { input } = args;
  if (!input) throw new Error('input 是必填参数');

  const [psychology, padResult] = [
    safeDispatch('psychology.analyzePsychology', input),
    safeDispatch('psychology.getPAD', input)
  ];

  let emotion = null;
  if (psychology && psychology.emotion) {
    emotion = psychology.emotion;
  } else if (psychology && psychology.primaryEmotion) {
    emotion = psychology.primaryEmotion;
  }

  let pad = padResult || null;
  if (psychology && psychology.summary) {
    pad = pad || { raw: psychology.summary };
  }

  return {
    input,
    emotion: emotion || { type: 'unknown', intensity: 0 },
    pad: pad || {},
    needs: (psychology && psychology.needs) || [],
    summary: (psychology && psychology.summary) || '',
    timestamp: Date.now()
  };
}

/**
 * heartflow_self_heal — 自愈策略推荐
 */
function handleSelfHeal(args) {
  const { context } = args;
  if (!context) throw new Error('context 是必填参数');

  // 尝试调 Q-learning 和自愈引擎
  const [healResult, evolutionStats] = [
    safeDispatch('evolution.heal', context),
    safeDispatch('evolution.getStats')
  ];

  // 尝试从 lessons 中找相关教训
  const lessons = safeDispatch('lesson.getTopLessons', 5);

  return {
    context,
    heal: healResult || {},
    evolution: evolutionStats || {},
    relevantLessons: lessons || [],
    timestamp: Date.now()
  };
}

/**
 * heartflow_status — 引擎健康检查
 */
function handleStatus(args) {
  const { detail = 'basic' } = args || {};

  const startTime = Date.now();

  // 基础信息
  const status = {
    version,
    running: heartflow !== null,
    modules: heartflow ? Object.keys(heartflow._modules || {}).length : 0,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  // 如果引擎已启动，获取更多信息
  if (heartflow) {
    try {
      const memoryStats = safeDispatch('identityCore.getMemoryStats');
      if (memoryStats) {
        status.memoryLayers = {
          core: memoryStats.core || 0,
          learned: memoryStats.learned || 0,
          ephemeral: memoryStats.ephemeral || 0
        };
      }
    } catch (e) {
      // 非关键信息，忽略
    }

    // 尝试获取 Q-table 健康度
    try {
      const qtable = safeDispatch('evolution.getStats');
      if (qtable) status.qtable = qtable;
    } catch (e) {
      // 非关键信息，忽略
    }
  }

  status.checkTime = Date.now() - startTime;

  if (detail === 'basic') {
    // 精简模式
    return {
      version: status.version,
      running: status.running,
      modules: status.modules,
      memoryLayers: status.memoryLayers || {},
      checkTime: status.checkTime
    };
  }

  return status;
}

// ═══════════════════════════════════════════════
// MCP 协议消息处理
// ═══════════════════════════════════════════════

// 工具名称 → 处理函数映射
const HANDLERS = {
  heartflow_think: handleThink,
  heartflow_think_fast: handleThinkFast,
  heartflow_dream: handleDream,
  heartflow_memory_search: handleMemorySearch,
  heartflow_emotion: handleEmotion,
  heartflow_self_heal: handleSelfHeal,
  heartflow_status: handleStatus
};

/**
 * 构造 MCP JSON-RPC 响应
 */
function makeResponse(id, result) {
  return JSON.stringify({
    jsonrpc: MCP_JSON_RPC_VERSION,
    id,
    result
  }) + '\n';
}

/**
 * 构造 MCP JSON-RPC 错误响应
 */
function makeError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return JSON.stringify({
    jsonrpc: MCP_JSON_RPC_VERSION,
    id,
    error
  }) + '\n';
}

/**
 * 处理 JSON-RPC 请求
 */
async function handleRequest(request) {
  const { id, method, params = {} } = request;

  switch (method) {
    // ─── MCP 协议方法 ───
    case 'initialize': {
      process.stdout.write(makeResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          logging: {}
        },
        serverInfo: {
          name: 'heartflow-mcp',
          version: version || '1.0.0'
        }
      }));
      break;
    }

    case 'notifications/initialized': {
      // 无响应
      break;
    }

    case 'tools/list': {
      process.stdout.write(makeResponse(id, { tools: TOOLS }));
      break;
    }

    case 'tools/call': {
      const { name, arguments: args = {} } = params;

      const handler = HANDLERS[name];
      if (!handler) {
        process.stdout.write(makeError(id, -32601, `Method not found: ${name}`));
        break;
      }

      try {
        let result;
        // 检测 handler 是否是 async
        if (handler.constructor.name === 'AsyncFunction') {
          result = await handler(args);
        } else {
          result = handler(args);
        }

        // MCP 要求 tools/call 返回 content 数组
        process.stdout.write(makeResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        }));
      } catch (err) {
        process.stdout.write(makeResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: err.message }, null, 2)
            }
          ],
          isError: true
        }));
      }
      break;
    }

    case 'ping': {
      process.stdout.write(makeResponse(id, {}));
      break;
    }

    default: {
      process.stdout.write(makeError(id, -32601, `Method not found: ${method}`));
    }
  }
}

// ═══════════════════════════════════════════════
// 主循环
// ═══════════════════════════════════════════════

// 初始化引擎引擎
initHeartFlow();

// 开始监听 stdin（MCP stdio transport）
console.error('[HeartFlow MCP] 等待 MCP 请求...');

let buffer = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // 逐行处理 JSON-RPC 请求（每个请求一行 JSON）
  let newlineIdx;
  while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);

    if (!line) continue;

    try {
      const request = JSON.parse(line);
      handleRequest(request).catch(err => {
        console.error(`[HeartFlow MCP] 请求处理异常:`, err.message);
        if (request.id !== undefined) {
          process.stdout.write(makeError(request.id, -32603, 'Internal error', err.message));
        }
      });
    } catch (err) {
      console.error(`[HeartFlow MCP] JSON 解析失败:`, err.message, `(line: ${line.slice(0, 100)})`);
    }
  }
});

process.stdin.on('end', () => {
  console.error('[HeartFlow MCP] stdin 关闭，退出');
  if (heartflow) {
    try { heartflow.stop(); } catch (e) { /* ignore */ }
  }
  process.exit(0);
});

// 优雅退出
process.on('SIGINT', () => {
  console.error('[HeartFlow MCP] 收到 SIGINT，退出');
  if (heartflow) {
    try { heartflow.stop(); } catch (e) { /* ignore */ }
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[HeartFlow MCP] 收到 SIGTERM，退出');
  if (heartflow) {
    try { heartflow.stop(); } catch (e) { /* ignore */ }
  }
  process.exit(0);
});

// 未捕获异常不 crash
process.on('uncaughtException', (err) => {
  console.error(`[HeartFlow MCP] 未捕获异常:`, err.message);
  try { if (heartflow && typeof heartflow.stop === 'function') heartflow.stop(); } catch (e) { /* ignore */ }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[HeartFlow MCP] 未处理 Promise 拒绝:`, reason);
  try { if (heartflow && typeof heartflow.stop === 'function') heartflow.stop(); } catch (e) { /* ignore */ }
  process.exit(1);
});
