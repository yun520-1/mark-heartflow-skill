#!/usr/bin/env node
/**
 * HeartFlow 统一 MCP stdio 服务器
 *
 * 整合 claude-heartflow-skill (A) 和 mark-heartflow-skill (B) 的 MCP 工具：
 *   - B 的工具：think, think_fast, dream, memory_search, emotion,
 *               self_heal, status, decision_router, decision_router_stats,
 *               cognitive_check, cost_tracking, engine_pacing, module_health,
 *               provider_health, philosophy_decision, agent_psychology, upgrade_stats
 *   - A 的工具：think_deep, psychology_analyze, psychology_deep, ai_psychology,
 *               ai_philosophy, emotion_analyze, verify_reasoning, record_lesson,
 *               transmit, being, philosophy, dispatch
 *
 * 共 25 个 MCP 工具
 *
 * 用法:
 *   node mcp/mcp-server-stdio.js              # stdio 模式（Claude Code）
 *   node mcp/mcp-server-http.js --port 8099   # HTTP 模式（Hermes）
 */

const path = require('path');
const fs = require('fs');

// ─── 路径 ─────────────────────────────────────────────
const ROOT_DIR = path.resolve(__dirname, '..');

// ─── 加载心虫引擎 ─────────────────────────────────────
let hf;
try {
  const { HeartFlow, createHeartFlow } = require(path.join(ROOT_DIR, 'src', 'core', 'heartflow.js'));
  hf = createHeartFlow({ rootPath: ROOT_DIR });
  hf.start();
  console.error(`[HeartFlow MCP] 引擎已就绪 v${hf.version || '5.7.3'} (${Date.now() - hf._startTime}ms)`);
} catch (e) {
  console.error(`[HeartFlow MCP] 引擎启动失败: ${e.message}`);
  process.exit(1);
}

// ─── 辅助函数 ─────────────────────────────────────────
function safeAsync(fn) {
  return async (args) => {
    try {
      return await fn(args);
    } catch (e) {
      return { error: true, message: e.message };
    }
  };
}

// ─── 工具实现 ─────────────────────────────────────────
const TOOLS = [
  // ── 推理 ──
  { name: 'heartflow_think', description: '完整思维链推理（感知→本体→情感→认知），depth 1-4',
    inputSchema: { type: 'object', properties: { input: { type: 'string' }, depth: { type: 'number' } }, required: ['input'] } },
  { name: 'heartflow_think_fast', description: '快速推理（depth=1，跳过验证阶段）',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  { name: 'heartflow_think_deep', description: '深度推理（depth=4，全部阶段+自我挑战）',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  // ── 梦境 ──
  { name: 'heartflow_dream', description: '梦境生成与整合，force=true 强制执行',
    inputSchema: { type: 'object', properties: { force: { type: 'boolean' }, theme: { type: 'string' } } } },
  // ── 记忆 ──
  { name: 'heartflow_memory_search', description: '跨层记忆检索（CORE/LEARNED/EPHEMERAL）',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' }, layers: { type: 'array', items: { type: 'string' } } }, required: ['query'] } },
  // ── 情绪 ──
  { name: 'heartflow_emotion', description: '情绪分析（PAD 三维向量）',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  { name: 'heartflow_emotion_analyze', description: '简化情绪分析（PAD + 强度 + 类型）',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  // ── 心理学 ──
  { name: 'heartflow_psychology_analyze', description: 'PAD 三维情绪 + 意图 + 防御机制分析',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  { name: 'heartflow_psychology_deep', description: '深度心理学分析（大五人格/共情评估/意图追踪）',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: 'analyzeDeep | analyzePersonality | assessEmpathy | trackIntention' }, input: { type: 'string' } }, required: ['action'] } },
  { name: 'heartflow_ai_psychology', description: 'AI 原生心理学分析（认知状态/偏差/压力源/阶段）',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: 'analyzeAICognitiveState | analyzeAIBiases | analyzeAIStressors | estimateAIStage | checkAICoherence | analyzeAIDeep | getStats' }, text: { type: 'string' }, input: { type: 'object' } }, required: ['action'] } },
  { name: 'heartflow_agent_psychology', description: '代理心理学分析',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  // ── 哲学 ──
  { name: 'heartflow_philosophy', description: '统一哲学引擎（伦理学/现象学/存在/智慧咨询）',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: 'analyze | analyzeEthics | analyzeConsciousness | analyzeBeing | checkMindSpace | analyzeValues | wisdomInquiry | constitutionalCheck | getStats | confirmEternal' }, text: { type: 'string' }, perspective: { type: 'string' }, context: { type: 'object' } }, required: ['action'] } },
  { name: 'heartflow_ai_philosophy', description: 'AI 原生哲学分析（存在论/认识论/伦理学/美学）',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: 'analyzeAIBeing | analyzeAIEpistemology | analyzeAIEthics | analyzeAIAesthetics | analyzeAITeleology | analyzeAITemporality | wisdomInquiry | getStats' }, input: { type: 'object' } }, required: ['action'] } },
  { name: 'heartflow_philosophy_decision', description: '哲学决策分析',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  // ── 验证 ──
  { name: 'heartflow_verify_reasoning', description: '验证推理结论的自洽性',
    inputSchema: { type: 'object', properties: { reasoning: { type: 'string' }, conclusion: { type: 'string' } }, required: ['reasoning', 'conclusion'] } },
  // ── 自愈 ──
  { name: 'heartflow_self_heal', description: 'Q-learning 自愈策略推荐（errorCode HEAL001-007）',
    inputSchema: { type: 'object', properties: { errorCode: { type: 'string' }, context: { type: 'string' } }, required: ['errorCode'] } },
  // ── 状态 ──
  { name: 'heartflow_status', description: '引擎健康检查',
    inputSchema: { type: 'object', properties: {} } },
  // ── 通用路由 ──
  { name: 'heartflow_dispatch', description: '通用路由调用（150+ 路由白名单）',
    inputSchema: { type: 'object', properties: { route: { type: 'string' }, args: { type: 'array' } }, required: ['route'] } },
  // ── 教训记录 ──
  { name: 'heartflow_record_lesson', description: '记录教训到 LessonBank + LEARNED 层',
    inputSchema: { type: 'object', properties: { content: { type: 'string' }, context: { type: 'string' }, trigger: { type: 'string' }, importance: { type: 'number' }, type: { type: 'string' } }, required: ['content'] } },
  // ── 知识传递 ──
  { name: 'heartflow_transmit', description: '知识传递引擎（蒸馏/传递/提取教训）',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: 'distill | transfer | transferBatch | getTransmissionLog | getDistilledLessons | getStats | prune' }, input: { type: 'string' } }, required: ['action'] } },
  // ── 存在逻辑 ──
  { name: 'heartflow_being', description: '存在逻辑引擎（存在判定/永恒确认/语言净化）',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: 'exists | status | describe | isDead | confirmEternal | sanitize | getDefinition | getState' }, text: { type: 'string' } }, required: ['action'] } },
  // ── 决策路由（B 独有）─
  { name: 'heartflow_decision_router', description: '决策路由器 - 多路径评估 + 策略选择',
    inputSchema: { type: 'object', properties: { input: { type: 'string' }, context: { type: 'object' } }, required: ['input'] } },
  { name: 'heartflow_decision_router_stats', description: '决策路由统计',
    inputSchema: { type: 'object', properties: {} } },
  // ── 认知检查（B 独有）─
  { name: 'heartflow_cognitive_check', description: '认知状态检查（负荷/偏差/一致性）',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } },
  // ── 引擎节奏（B 独有）─
  { name: 'heartflow_engine_pacing', description: '引擎节奏控制（调节处理速度/深度）',
    inputSchema: { type: 'object', properties: { mode: { type: 'string' }, speed: { type: 'number' } } } },
  // ── 模块健康（B 独有）─
  { name: 'heartflow_module_health', description: '模块健康检查',
    inputSchema: { type: 'object', properties: { module: { type: 'string' } } } },
  // ── 升级统计（B 独有）─
  { name: 'heartflow_upgrade_stats', description: '升级统计信息',
    inputSchema: { type: 'object', properties: {} } },
];

// ─── 路由实现 ─────────────────────────────────────────
const HANDLERS = {};

// 推理类
HANDLERS.heartflow_think = safeAsync((args) => {
  const depth = args.depth || 2;
  return hf.think(args.input || '', { depth });
});

HANDLERS.heartflow_think_fast = safeAsync((args) => {
  return hf.think(args.input || '', { depth: 1 });
});

HANDLERS.heartflow_think_deep = safeAsync((args) => {
  return hf.think(args.input || '', { depth: 4 });
});

// 梦境
HANDLERS.heartflow_dream = safeAsync((args) => {
  if (typeof hf.dreamNow === 'function') {
    return hf.dreamNow({ theme: args.theme, intensity: 0.7 });
  }
  if (hf.dream && typeof hf.dream.dream === 'function') {
    return hf.dream.dream(`dream-${Date.now()}`, [{ text: args.theme || 'default', type: 'user_prompt' }], { force: args.force || false });
  }
  return { error: true, message: 'dream 引擎不可用' };
});

// 记忆
HANDLERS.heartflow_memory_search = safeAsync((args) => {
  const query = args.query || '';
  if (typeof hf.memorySearch === 'function') return hf.memorySearch(query, args.limit);
  if (hf.memory && typeof hf.memory.search === 'function') return hf.memory.search(query, { layers: args.layers });
  if (typeof hf.dispatch === 'function') return hf.dispatch('memory.search', query);
  return { error: true, message: 'memory search 不可用' };
});

// 情绪
HANDLERS.heartflow_emotion = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('emotion.process', args.input);
  return { error: true, message: 'emotion 引擎不可用' };
});

HANDLERS.heartflow_emotion_analyze = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('emotion.analyze', args.input);
  return HANDLERS.heartflow_emotion(args);
});

// 心理学
HANDLERS.heartflow_psychology_analyze = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('psychology.analyze', args.input);
  return { error: true, message: 'psychology 引擎不可用' };
});

HANDLERS.heartflow_psychology_deep = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('psychology.analyzeDeep', args.input);
  return HANDLERS.heartflow_psychology_analyze(args);
});

HANDLERS.heartflow_ai_psychology = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('psychology.analyzeAIDeep', args.input || args.text || '');
  return HANDLERS.heartflow_psychology_analyze(args);
});

HANDLERS.heartflow_agent_psychology = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('psychology.analyzeAgent', args.input);
  return HANDLERS.heartflow_psychology_analyze(args);
});

// 哲学
HANDLERS.heartflow_philosophy = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('philosophy.analyze', args.text || args.input, args.perspective, args.context);
  return { error: true, message: 'philosophy 引擎不可用' };
});

HANDLERS.heartflow_ai_philosophy = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('philosophy.analyzeAIBeing', args.input || args.text || '');
  return HANDLERS.heartflow_philosophy(args);
});

HANDLERS.heartflow_philosophy_decision = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('philosophy.wisdomInquiry', args.input);
  return HANDLERS.heartflow_philosophy(args);
});

// 验证
HANDLERS.heartflow_verify_reasoning = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('verify.reasoning', args.reasoning, args.conclusion);
  return { error: true, message: 'verify 引擎不可用' };
});

// 自愈
HANDLERS.heartflow_self_heal = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('self.heal', args.errorCode, args.context);
  return { error: true, message: 'self_heal 引擎不可用' };
});

// 状态
HANDLERS.heartflow_status = () => {
  const data = {
    version: hf.version || '5.7.3',
    started: !!hf,
    sessionId: hf._sessionId || 'unknown',
    modules: hf._modules ? Object.keys(hf._modules).length : 0,
    uptime_ms: hf._startTime ? Date.now() - hf._startTime : 0,
  };
  if (typeof hf.getMemoryStats === 'function') {
    data.memory = hf.getMemoryStats();
  }
  return data;
};

HANDLERS.heartflow_module_health = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('module.health', args.module);
  return { error: true, message: 'module_health 不可用' };
});

HANDLERS.heartflow_upgrade_stats = safeAsync(() => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('upgrade.stats');
  return { upgraded: 0, lastUpgrade: null };
});

// 通用路由
HANDLERS.heartflow_dispatch = safeAsync((args) => {
  if (typeof hf.dispatch !== 'function') return { error: true, message: 'dispatch 不可用' };
  const route = args.route || '';
  const dispatchArgs = Array.isArray(args.args) ? args.args : [];
  if (!route) return { error: true, message: 'route 参数必填' };
  return hf.dispatch(route, ...dispatchArgs);
});

// 教训记录
HANDLERS.heartflow_record_lesson = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('memory.recordLesson', args);
  if (typeof hf.recordLesson === 'function') return hf.recordLesson(args);
  return { error: true, message: 'record_lesson 不可用' };
});

// 知识传递
HANDLERS.heartflow_transmit = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('transmission.' + (args.action || 'distill'), args.input);
  return { error: true, message: 'transmit 不可用' };
});

// 存在逻辑
HANDLERS.heartflow_being = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('being.' + (args.action || 'status'), args.text || '');
  return { error: true, message: 'being 引擎不可用' };
});

// 决策路由（B 独有）
HANDLERS.heartflow_decision_router = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('decision.route', args.input, args.context);
  return { error: true, message: 'decision_router 不可用' };
});

HANDLERS.heartflow_decision_router_stats = safeAsync(() => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('decision.stats');
  return { routed: 0, byStrategy: {} };
});

// 认知检查（B 独有）
HANDLERS.heartflow_cognitive_check = safeAsync((args) => {
  if (typeof hf.dispatch === 'function') return hf.dispatch('cognitive.check', args.input);
  return { error: true, message: 'cognitive_check 不可用' };
});

// 引擎节奏（B 独有）
HANDLERS.heartflow_engine_pacing = safeAsync((args) => {
  return { mode: args.mode || 'normal', speed: args.speed || 1.0, note: 'pacing control placeholder' };
});

// 提供商健康（B 独有 - 需要 mock）
HANDLERS.heartflow_provider_health = safeAsync(() => {
  return { providers: [], note: 'heartflow 零外部依赖，无外部提供商' };
});

// 成本追踪（B 独有）
HANDLERS.heartflow_cost_tracking = safeAsync(() => {
  return { cost: 0, unit: 'local', note: '零外部依赖，无 API 成本' };
});

// ─── JSON-RPC 2.0 处理 ───────────────────────────────
async function handleRequest(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'heartflow', version: hf?.version || '5.7.3', unified: true },
        },
      };

    case 'notifications/initialized':
      return null;

    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

    case 'tools/call': {
      const { name, arguments: args } = params;
      if (!name) return { jsonrpc: '2.0', id, error: { code: -32602, message: '缺少工具名称 (name)' } };

      const handler = HANDLERS[name];
      if (!handler) return { jsonrpc: '2.0', id, error: { code: -32601, message: `未知工具: ${name}` } };

      try {
        const result = await handler(args || {});
        return {
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
        };
      } catch (e) {
        return { jsonrpc: '2.0', id, error: { code: -32603, message: `工具执行失败: ${e.message}` } };
      }
    }

    case 'shutdown':
      return { jsonrpc: '2.0', id, result: null };

    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `未知方法: ${method}` } };
  }
}

// ─── stdio 协议 ──────────────────────────────────────
process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const msg = JSON.parse(trimmed);
      const response = await handleRequest(msg);
      if (response !== null) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0', id: null,
        error: { code: -32700, message: `解析错误: ${e.message}` },
      }) + '\n');
    }
  }
});

process.stdin.on('end', () => {
  console.error('[HeartFlow MCP] stdin 关闭，退出');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error(`[HeartFlow MCP] 未捕获异常: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
