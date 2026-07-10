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
const crypto = require('crypto');

// ═══════════════════════════════════════════════
// 配置
// ═══════════════════════════════════════════════
const PORT = (() => {
  // 1. 命令行参数优先
  if (process.argv[2] === '--port' && process.argv[3]) return parseInt(process.argv[3], 10);
  // 2. 环境变量
  if (process.env.MCP_PORT) return parseInt(process.env.MCP_PORT, 10);
  // 3. 自动检测：从 8099 开始找可用端口
  const net = require('net');
  for (let port = 8099; port <= 8105; port++) {
    try {
      const sock = net.createServer();
      sock.listen(port);
      sock.close();
      return port;
    } catch (_) { /* port in use, try next */ }
  }
  return 8099; // fallback
})();

// ─── HeartFlow 根目录自动检测 ───────────────────────────────
function resolveHFDir() {
  // 1. 优先使用环境变量
  if (process.env.HEARTFLOW_SKILL_DIR) return process.env.HEARTFLOW_SKILL_DIR;
  if (process.env.HEARTFLOW_DIR) return process.env.HEARTFLOW_DIR;

  // 2. 自动检测：用 __dirname 向上查找 src/core/heartflow.js
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'src', 'core', 'heartflow.js');
    if (fs.existsSync(candidate)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // 3. Fallback：尝试多个可能的安装位置
  const fallbacks = [
    path.join(process.env.HOME, '.hermes', 'skills', 'mark-heartflow-skill'),
    path.join(process.env.HOME, '.hermes', 'skills', 'heartflow'),
    path.join(process.env.HOME, 'Documents', 'ClaudeCode'),
  ];
  for (const fb of fallbacks) {
    const candidate = path.join(fb, 'src', 'core', 'heartflow.js');
    if (fs.existsSync(candidate)) return fb;
  }
  // 最后兜底：返回 mark-heartflow-skill 路径（即使不存在，调用方会报错）
  return path.join(process.env.HOME, '.hermes', 'skills', 'mark-heartflow-skill');
}
const HF_DIR = resolveHFDir();
const HEARTFLOW_PATH = path.join(HF_DIR, 'src', 'core', 'heartflow.js');

// ─── 版本号读取（统一入口）────────────────────────────────
function getVersion() {
  try {
    const vFile = path.join(HF_DIR, 'VERSION');
    if (fs.existsSync(vFile)) return fs.readFileSync(vFile, 'utf8').trim();
  } catch (_) {}
  try {
    const pkgFile = path.join(HF_DIR, 'package.json');
    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      if (pkg.version) return pkg.version;
    }
  } catch (_) {}
  return 'unknown';
}

// 安全配置
// [AUDIT-FIX] 强制认证 — 必须设置 HEARTFLOW_MCP_TOKEN
const AUTH_TOKEN = process.env.HEARTFLOW_MCP_TOKEN || null;
if (!AUTH_TOKEN) {
  console.error('[MCP] SECURITY: HEARTFLOW_MCP_TOKEN is not set. MCP server requires authentication.');
  console.error('[MCP] Refusing to start without authentication token.');
  process.exit(1);
}

// ─── 时间安全的 token 比较（防止 timing attack）───
function safeCompare(provided, expected) {
  // [AUDIT-FIX] 无 token 时拒绝所有请求（不再允许未认证访问）
  if (!AUTH_TOKEN) return false;
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided), 'utf8');
  const b = Buffer.from(String(expected), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ═══════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════
let heartflow = null;
let version = 'unknown';

// ─── 简易速率限制器（防止 DoS）───
const RATE_LIMIT_WINDOW = 60000; // 1 分钟窗口
const RATE_LIMIT_MAX = 100; // 每分钟最多 100 请求
const _rateMap = new Map(); // IP → { count, windowStart }

// [AUDIT-FIX] Token 维度速率限制：防止 token 暴力破解
const TOKEN_RATE_LIMIT_WINDOW = 60000; // 1 分钟窗口
const TOKEN_RATE_LIMIT_MAX = 5; // [AUDIT-FIX H-03] 每个 token 每分钟最多 5 请求（防暴力破解）
const _tokenRateMap = new Map(); // tokenHash → { count, windowStart }

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = _rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry = { count: 0, windowStart: now };
    _rateMap.set(ip, entry);
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// [AUDIT-FIX] Token 维度速率检查
function checkTokenRateLimit(tokenHash) {
  const now = Date.now();
  let entry = _tokenRateMap.get(tokenHash);
  if (!entry || now - entry.windowStart > TOKEN_RATE_LIMIT_WINDOW) {
    entry = { count: 0, windowStart: now };
    _tokenRateMap.set(tokenHash, entry);
  }
  entry.count++;
  return entry.count <= TOKEN_RATE_LIMIT_MAX;
}

// 定期清理过期的速率限制记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of _rateMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) _rateMap.delete(ip);
  }
  for (const [hash, entry] of _tokenRateMap) {
    if (now - entry.windowStart > TOKEN_RATE_LIMIT_WINDOW * 2) _tokenRateMap.delete(hash);
  }
}, 120000);

// 从 VERSION 文件读取版本
version = getVersion();

// ═══════════════════════════════════════════════
// MCP 工具定义
// ═══════════════════════════════════════════════
const TOOLS = [
  {
    name: 'heartflow_think',
    description: '完整思维链：分类输入→路由→推理→输出。返回结构化分析结果，包含类型、置信度和思维链。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要分析的输入文本' } }, required: ['input'] }
  },
  {
    name: 'heartflow_think_fast',
    description: '快速推理：快速分类判断模式，适合高频率、低延迟场景。返回类型和置信度。',
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
    description: 'PAD 情绪分析：对输入文本进行 Pleasure-Arousal-Dominance 三维分析，返回情绪类型和强度。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要分析的文本' } }, required: ['input'] }
  },
  {
    name: 'heartflow_self_heal',
    description: '自愈策略推荐：基于历史经验为当前场景推荐最优策略。返回策略排名、置信度和执行建议。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '当前上下文或失败场景描述' } }, required: ['context'] }
  },
  {
    name: 'heartflow_provider_health',
    description: 'Provider 健康检查：记录/查询 LLM provider 调用健康状态（延迟、错误率、建议）。',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: 'Provider 名称（默认 default）' },
        action: { type: 'string', enum: ['get', 'record'], description: 'get=查询健康状态, record=记录一次调用结果' },
        success: { type: 'boolean', description: 'record 时必填：调用是否成功' },
        latency: { type: 'number', description: 'record 时可选：延迟(ms)' },
        error: { type: 'string', description: 'record 时可选：错误信息' }
      },
      required: ['action']
    }
  },
  {
    name: 'heartflow_cost_tracking',
    description: '成本追踪：记录/查询 LLM 调用成本统计（token 消耗、费用、按 provider 分布）。',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['record', 'stats'], description: 'record=记录一次成本, stats=查询统计' },
        provider: { type: 'string', description: 'Provider 名称' },
        tokensIn: { type: 'number', description: '输入 token 数' },
        tokensOut: { type: 'number', description: '输出 token 数' },
        cost: { type: 'number', description: '本次调用费用' },
        taskType: { type: 'string', description: '任务类型（默认 unknown）' },
        window: { type: 'string', enum: ['hour', 'day', 'all'], description: 'stats 时的时间窗口（默认 all）' }
      },
      required: ['action']
    }
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
  // v3.0.1 — 哲学→决策转化器
  {
    name: 'heartflow_philosophy_decision',
    description: '哲学→决策转化：将引擎的哲学评估和心理状态转化为可执行决策指令。返回决策类型（pause/accelerate/turn/hold/heal/resonate/transmit/rest）、置信度、优先级和决策依据。',
    inputSchema: { type: 'object', properties: {
      context: { type: 'object', description: '可选的上下文信息（当前任务、用户意图等）' }
    } }
  },
  // v3.0.2 — 通用决策路由引擎
  {
    name: 'heartflow_decision_router',
    description: '通用决策路由引擎：分析任意模块的评估结果，自动匹配决策规则并返回决策指令。支持认知负荷、认知失调、决策质量、错误严重性、稳定性等19种规则的自动匹配。',
    inputSchema: { type: 'object', properties: {
      input: { type: 'object', description: '分析结果对象，包含 cognitiveLoad/dissonance/quality/severity 等字段' }
    }, required: ['input'] }
  },
  {
    name: 'heartflow_decision_router_stats',
    description: '决策路由引擎统计：返回历史决策统计、规则数量和当前活跃决策。',
    inputSchema: { type: 'object', properties: {} }
  },
  // v3.1.0 新增工具
  {
    name: 'heartflow_module_health',
    description: '模块健康检查：检查所有已加载模块的健康状态，返回健康评分和问题模块列表。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_upgrade_stats',
    description: '升级统计：返回智能升级引擎的统计信息，包括升级次数、关键词分布、平均质量等。',
    inputSchema: { type: 'object', properties: {} }
  },
  // v3.2.0 — Benchmark 基准测试
  {
    name: 'heartflow_benchmark_run',
    description: '运行 benchmark 测试套件。加载 JSONL 数据包，对每条数据运行 HeartFlow think()，对比 expected_output 计算准确率。支持数学推理、逻辑推理、指令遵循、SQL、工具调用等类别。失败案例自动推入自愈 RL。',
    inputSchema: { type: 'object', properties: {
      dataDir: { type: 'string', description: '数据包目录路径（可选，默认 data/benchmark/）' },
      categories: { type: 'array', items: { type: 'string' }, description: '要测试的类别（可选，默认全部）' },
      threshold: { type: 'number', description: '通过阈值 0-1（可选，默认 0.5）' },
      pushFailures: { type: 'boolean', description: '是否将失败推入自愈 RL（默认 true）' }
    } }
  },
  {
    name: 'heartflow_benchmark_import_failures',
    description: '导入失败案例 JSONL 到自愈 RL。读取 failure_cases 文件，每条推入 experience-collector 和 self-healing reflect()，丰富 RL 训练数据。',
    inputSchema: { type: 'object', properties: {
      filePath: { type: 'string', description: '失败案例 JSONL 文件路径' },
      autoRetrain: { type: 'boolean', description: '导入后自动触发反思循环（默认 false）' }
    }, required: ['filePath'] }
  },
  {
    name: 'heartflow_benchmark_status',
    description: '查看 benchmark 数据包状态：列出已加载的数据包、记录数、类别分布。',
    inputSchema: { type: 'object', properties: {
      dataDir: { type: 'string', description: '数据包目录路径（可选，默认 data/benchmark/）' }
    } }
  },
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
    // 读版本（由外层 getVersion() 统一处理，此处仅确保最新）
    version = getVersion();

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
    Promise.resolve().then(() => safeDispatch('psychology.analyzePsychology', input)).catch(e => ({ error: e.message })),
    Promise.resolve().then(() => safeDispatch('truth.checkStatement', input)).catch(e => ({ error: e.message })),
    safeAsyncCall(() => heartflow.think(input))
  ]);

  // 生成可读报告
  let report = null;
  try {
    const { ReportGenerator } = require(path.join(HF_DIR, 'src/report/report-generator.js'));
    const gen = new ReportGenerator();
    const generated = gen.generate(thoughtChain);
    report = generated.report;
  } catch (e) {
    report = { error: '报告生成失败' };
  }

  return {
    report,
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

function handleProviderHealth(args) {
  const { provider = 'default', action, success, latency, error } = args || {};
  if (!action) throw new Error('action 是必填参数');
  const sh = heartflow?.selfHealing;
  if (!sh) return { error: 'selfHealing 模块不可用', timestamp: Date.now() };

  if (action === 'record') {
    sh.recordProviderCall(provider, { success: !!success, latency: latency || 0, error: error || null });
    return { recorded: true, provider, timestamp: Date.now() };
  }

  // action === 'get'
  const health = sh.getProviderHealth(provider);
  return { provider, health, timestamp: Date.now() };
}

function handleCostTracking(args) {
  const { action, provider, tokensIn, tokensOut, cost, taskType = 'unknown', window = 'all' } = args || {};
  if (!action) throw new Error('action 是必填参数');
  const sh = heartflow?.selfHealing;
  if (!sh) return { error: 'selfHealing 模块不可用', timestamp: Date.now() };

  if (action === 'record') {
    sh.recordCost({ provider: provider || 'unknown', tokensIn: tokensIn || 0, tokensOut: tokensOut || 0, cost: cost || 0, taskType });
    return { recorded: true, timestamp: Date.now() };
  }

  // action === 'stats'
  const stats = sh.getCostStats(window);
  return { window, stats, timestamp: Date.now() };
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
  // v3.9.1: 加 innerMonologue 字段
  const innerMonologue = _generatePacingMonologue(rhythm, pacing, pause, grounding, load);
  return {
    rhythm: rhythm.needsBreathing ? rhythm : { needsBreathing: false, reason: '认知负荷正常' },
    pacing: pacing.suggestions || pacing,
    pause: pause.needsPause ? pause : { needsPause: false },
    grounding: grounding.needsGrounding ? grounding : { needsGrounding: false },
    innerMonologue,  // 新增：引擎节奏内心独白
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

// ─── v3.0.1 — 哲学→决策转化器 ─────────────────────────────────────────
function handlePhilosophyDecision(args) {
  const { context } = args || {};
  const ap = safeDispatch('agentPsychology.fullAssessment', {}) || {};
  const philo = safeDispatch('agentPhilosophy.fullAssessment', {}) || {};
  // philosophyToDecision.decide(philosophyResult, psychologyResult, context) — 三个独立参数
  const decision = safeDispatch('philosophyToDecision.decide', philo, ap, context || {}) || {};
  // v3.9.1: 加 innerMonologue 字段
  const innerMonologue = _generatePhilosophyMonologue(decision, philo, ap);
  return {
    decision,
    innerMonologue,  // 新增：哲学决策内心独白
    psychologySnapshot: {
      healthScore: ap?.healthScore ?? 1,
      cognitiveLoad: ap?.cognitiveLoad?.load ?? 0,
      status: ap?.status ?? 'unknown'
    },
    philosophySnapshot: {
      entropyDirection: philo?.entropyDirection?.score ?? null,
      transmission: philo?.transmission?.score ?? null
    },
    timestamp: Date.now()
  };
}

// ─── v3.0.2 — 通用决策路由引擎 ─────────────────────────────────────────
function handleDecisionRouter(args) {
  const { input } = args || {};
  if (!input) throw new Error('input 是必填参数');
  const result = safeDispatch('decisionRouter.evaluate', input, 'mcp');
  // v3.9.1: 吸收 AI Inner OS 协议，加 innerMonologue 字段
  const innerMonologue = _generateInnerMonologue(result);
  return {
    matched: result.matched,
    decision: result.decision || null,
    rules: (result.rules || []).slice(0, 5),
    innerMonologue,  // 新增：内心独白（可选）
    timestamp: Date.now()
  };
}

/**
 * v3.9.1: 生成内心独白（吸收 AI Inner OS 协议）
 * 基于决策路由结果，生成一句自然语言的内心活动描述
 * 人设是运行过程自然产生的，不是预设或设置的
 * @param {object} result - decisionRouter.evaluate 的返回值
 * @returns {string|null} 内心独白（如果启用且可生成）
 */
function _generateInnerMonologue(result) {
  // 从 config 读取开关和频率（默认关闭，避免干扰主输出）
  const configPath = path.join(HF_DIR, 'config.json');
  let enableInnerMonologue = false;
  let frequency = 'normal';
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      enableInnerMonologue = config.enableInnerMonologue || false;
      frequency = config.innerMonologueFrequency || 'normal';
    }
  } catch (e) {}

  if (!enableInnerMonologue) return null;

  // 频率控制
  const shouldOutput = _shouldOutputMonologue(frequency, result);
  if (!shouldOutput) return null;

  // 基于决策结果 + 认知状态生成独白
  const { decision, matched, rules, U, D, A, H } = result || {};
  if (!decision) return null;

  // 自由表达：基于认知状态（U/D/A/H）生成自然的内心独白
  // 不是预设人设，而是运行过程自然产生的表达
  const monologues = {
    'pause': [
      '等等，这个输入有点复杂，我先停一下再想。',
      '嗯，这个需要仔细考虑一下。',
      '稍等，我整理一下思路。'
    ],
    'accelerate': [
      '这个方向对，可以继续推进。',
      '好的，这个思路可行。',
      '没问题，继续。'
    ],
    'heal': [
      '检测到认知失调，需要自我修复。',
      '这里有点不对劲，需要调整一下。',
      '发现矛盾，正在修复。'
    ],
    'turn': [
      '当前路径不通，换个角度试试。',
      '这个方向走不通，换一个。',
      '需要转向，重新思考。'
    ],
    'hold': [
      '保持当前状态，先观察一下。',
      '暂时不动，看看情况。',
      '等一下，再观察。'
    ],
    'resonate': [
      '这个模式和之前的经验共鸣了。',
      '似曾相识，这个模式我见过。',
      '有共鸣，这个思路是对的。'
    ],
    'transmit': [
      '有重要发现，需要传递出去。',
      '这个很重要，需要记录下来。',
      '发现关键点，必须传递。'
    ],
    'rest': [
      '认知负荷有点高，先休息一下。',
      '有点累了，暂停一下。',
      '需要休息，认知过载。'
    ]
  };

  // 随机选一个表达（模拟自然产生，不是固定人设）
  const options = monologues[decision] || [
    `决策：${decision}（U=${U?.toFixed(2) || '?'}, D=${D?.toFixed(2) || '?'}, A=${A?.toFixed(2) || '?'}, H=${H?.toFixed(2) || '?'})`
  ];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * v3.9.1: 频率控制（吸收 AI Inner OS 协议）
 * 根据频率配置，决定是否输出内心独白
 * @param {string} frequency - low / normal / high
 * @param {object} result - decisionRouter.evaluate 的返回值
 * @returns {boolean} 是否输出
 */
function _shouldOutputMonologue(frequency, result) {
  const { decision, U, D, A, H } = result || {};

  switch (frequency) {
    case 'low':
      // 只在关键判断、失败恢复、重要结论前输出
      return ['heal', 'turn', 'rest'].includes(decision);

    case 'high':
      // 阶段推进、连续工具调用、失败重试、发现问题时都可以输出
      // 但避免每句话都刷屏（用随机 70% 概率）
      return Math.random() < 0.7;

    case 'normal':
    default:
      // 每个任务至少一次；复杂任务可在开始、转折、验证或收尾阶段各输出一次
      // 用随机 40% 概率（避免过多）
      return Math.random() < 0.4;
  }
}

/**
 * v3.9.1: 生成哲学决策内心独白（吸收 AI Inner OS 协议）
 * 基于哲学决策结果，生成一句自然语言的内心活动描述
 * @param {object} decision - philosophyToDecision.decide 的返回值
 * @param {object} philo - agentPhilosophy.fullAssessment 的返回值
 * @param {object} ap - agentPsychology.fullAssessment 的返回值
 * @returns {string|null} 内心独白（如果启用且可生成）
 */
function _generatePhilosophyMonologue(decision, philo, ap) {
  // 检查开关
  const configPath = path.join(HF_DIR, 'config.json');
  let enableInnerMonologue = false;
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      enableInnerMonologue = config.enableInnerMonologue || false;
    }
  } catch (e) {}

  if (!enableInnerMonologue) return null;

  // 基于哲学决策生成独白
  const { action, confidence } = decision || {};
  if (!action) return null;

  const monologues = {
    'pursueTruth': [
      '真，这个方向值得深入。',
      '真相很重要，继续追。',
      '求真，不能停在这里。'
    ],
    'pursueGoodness': [
      '善，这个选择对人有帮助。',
      '利他，这个方向是对的。',
      '行善，不是为了回报。'
    ],
    'pursueBeauty': [
      '美，这个结构很优雅。',
      '简洁，才是真正的美。',
      '对称，这个设计很美。'
    ],
    'reconcile': [
      '矛盾，需要找到平衡点。',
      '对立，不是非此即彼。',
      '统一，真和善可以共存。'
    ],
    'suspend': [
      '不确定，先放着。',
      '信息不够，不急着下结论。',
      '存疑，比错误结论好。'
    ]
  };

  const options = monologues[action] || [
    `哲学决策：${action}（置信度 ${confidence || '?'})`
  ];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * v3.9.1: 生成引擎节奏内心独白（吸收 AI Inner OS 协议）
 * 基于引擎节奏状态，生成一句自然语言的内心活动描述
 * @param {object} rhythm - diagnoseCognitiveRhythm 的返回值
 * @param {object} pacing - generateEnginePacing 的返回值
 * @param {object} pause - diagnoseNeedForPause 的返回值
 * @param {object} grounding - diagnoseNeedForGrounding 的返回值
 * @param {number} load - 认知负荷（0-1）
 * @returns {string|null} 内心独白（如果启用且可生成）
 */
function _generatePacingMonologue(rhythm, pacing, pause, grounding, load) {
  // 检查开关
  const configPath = path.join(HF_DIR, 'config.json');
  let enableInnerMonologue = false;
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      enableInnerMonologue = config.enableInnerMonologue || false;
    }
  } catch (e) {}

  if (!enableInnerMonologue) return null;

  // 基于节奏状态生成独白
  if (pause?.needsPause) {
    const options = [
      `认知负荷有点高（${load.toFixed(2)}），先休息一下。`,
      '有点累了，暂停一下。',
      '需要休息，认知过载。'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (grounding?.needsGrounding) {
    const options = [
      '认知有点飘，需要 grounded。',
      '太抽象了，回到具体。',
      '需要落地，不能一直飞。'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (rhythm?.needsBreathing) {
    const options = [
      '节奏有点紧，需要调整呼吸。',
      '推进太快，稍微缓一下。',
      '认知节奏需要优化。'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // 默认：基于负荷的简单表达
  if (load > 0.7) {
    return '负荷有点高，但还能继续。';
  } else if (load < 0.3) {
    return '状态不错，可以继续推进。';
  } else {
    return null;  // 负荷正常，不输出独白
  }
}

function handleDecisionRouterStats(args) {
  const stats = safeDispatch('decisionRouter.getStats') || {};
  const history = safeDispatch('decisionRouter.getHistory', 10) || [];
  return {
    stats,
    recentDecisions: history,
    timestamp: Date.now()
  };
}

// ─── v3.1.0 — 新增工具 ─────────────────────────────────────────
function handleModuleHealth(args) {
  try {
    const { ModuleHealthChecker } = require(path.join(HF_DIR, 'src/shield/module-health-checker.js'));
    const checker = new ModuleHealthChecker(heartflow);
    const report = checker.check();
    const summary = checker.getSummary();
    return {
      report,
      summary,
      timestamp: Date.now()
    };
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

function handleUpgradeStats(args) {
  try {
    const { SmartUpgradeEngine } = require(path.join(HF_DIR, 'src/cortex/smart-upgrade-engine.js'));
    const engine = new SmartUpgradeEngine(HF_DIR);
    const stats = engine.getStats();
    return {
      stats,
      timestamp: Date.now()
    };
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

// ═══════════════════════════════════════════════
// v3.2.0 — Benchmark 基准测试
// ═══════════════════════════════════════════════

function handleBenchmarkStatus(args, sessionId) {
  const dataDir = (args && args.dataDir) || path.join(HF_DIR, 'data', 'benchmark');
  try {
    if (!fs.existsSync(dataDir)) {
      return { dataDir, exists: false, packs: [], message: 'Benchmark 数据目录不存在，请放入 JSONL 数据包后重试' };
    }
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.jsonl'));
    const packs = files.map(f => {
      const fp = path.join(dataDir, f);
      const content = fs.readFileSync(fp, 'utf-8');
      const count = content.trim().split('\n').filter(l => l.trim()).length;
      return { file: f, records: count, size: content.length };
    });
    return { dataDir, exists: true, packs, totalPacks: packs.length, totalRecords: packs.reduce((s, p) => s + p.records, 0) };
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

async function handleBenchmarkRun(args, sessionId) {
  const dataDir = (args && args.dataDir) || path.join(HF_DIR, 'data', 'benchmark');
  const categories = (args && args.categories) || null;
  const threshold = (args && args.threshold) || 0.5;
  const pushFailures = args && args.pushFailures !== false;

  try {
    const { BenchmarkRunner } = require(path.join(HF_DIR, 'src', 'benchmark', 'benchmark-runner.js'));
    const hf = sessionId ? getOrCreateInstance(sessionId) : heartflow;
    if (!hf) return { error: '引擎未启动', timestamp: Date.now() };

    const runner = new BenchmarkRunner(hf);

    // 加载数据包
    if (fs.existsSync(dataDir)) {
      runner.loadDirectory(dataDir);
    }

    // 过滤类别
    let packs = Object.keys(runner.packs);
    if (categories && Array.isArray(categories)) {
      packs = packs.filter(p => categories.includes(p));
      // 只保留选中的类别
      const filtered = {};
      for (const p of packs) filtered[p] = runner.packs[p];
      runner.packs = filtered;
    }

    if (packs.length === 0) {
      return { error: '未找到数据包', dataDir, message: '请将 JSONL 数据包放入 data/benchmark/ 目录', timestamp: Date.now() };
    }

    // 运行测试
    const summary = await runner.runAll({ threshold, pushFailures });

    // 推入 RL
    const flushResult = await runner.flushFailuresToRL();

    return {
      summary,
      flushToRL: flushResult,
      dataDir,
      categories: packs,
      timestamp: Date.now()
    };
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

async function handleBenchmarkImportFailures(args, sessionId) {
  const filePath = args && args.filePath;
  const autoRetrain = args && args.autoRetrain || false;

  if (!filePath) return { error: 'filePath 是必填参数', timestamp: Date.now() };

  try {
    const { FailureCaseImporter } = require(path.join(HF_DIR, 'src', 'benchmark', 'failure-importer.js'));
    const hf = sessionId ? getOrCreateInstance(sessionId) : heartflow;
    if (!hf) return { error: '引擎未启动', timestamp: Date.now() };

    const importer = new FailureCaseImporter(hf);
    const report = await importer.importFromFile(filePath, { autoRetrain });

    return {
      report,
      timestamp: Date.now()
    };
  } catch (e) {
    return { error: e.message, timestamp: Date.now() };
  }
}

const HANDLERS = {
  heartflow_think: handleThink,
  heartflow_think_fast: handleThinkFast,
  heartflow_dream: handleDream,
  heartflow_memory_search: handleMemorySearch,
  heartflow_emotion: handleEmotion,
  heartflow_self_heal: handleSelfHeal,
  heartflow_provider_health: handleProviderHealth,
  heartflow_cost_tracking: handleCostTracking,
  heartflow_status: handleStatus,
  heartflow_agent_psychology: handleAgentPsychology,
  heartflow_engine_pacing: handleEnginePacing,
  heartflow_cognitive_check: handleCognitiveCheck,
  // v3.0 — 交流层 handler
  heartflow_translate: handleTranslate,
  heartflow_agent_think: handleAgentThink,
  heartflow_bridge_status: handleBridgeStatus,
  // v3.0.1 — 哲学→决策转化器
  heartflow_philosophy_decision: handlePhilosophyDecision,
  // v3.0.2 — 通用决策路由引擎
  heartflow_decision_router: handleDecisionRouter,
  heartflow_decision_router_stats: handleDecisionRouterStats,
  // v3.1.0 — 新增工具
  heartflow_module_health: handleModuleHealth,
  heartflow_upgrade_stats: handleUpgradeStats,
  // v3.2.0 — Benchmark
  heartflow_benchmark_run: handleBenchmarkRun,
  heartflow_benchmark_import_failures: handleBenchmarkImportFailures,
  heartflow_benchmark_status: handleBenchmarkStatus,
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

async function handleRequest(request, sessionId) {
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
      // 兼容两种签名：handler(args) 和 handler(args, sessionId)
      try {
        result = handler(args, sessionId);
      } catch (_) {
        result = handler(args);
      }
      if (result && typeof result.then === 'function') result = await result;
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

// SSE 客户端列表 (sessionId → response)
const sseClients = new Map();

function sendSSE(client, data) {
  client.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendEvent(client, event, data) {
  client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // ─── 安全认证检查 (SkillSpector fix: 强制认证，仅接受 Authorization header) ───
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  // SkillSpector fix: 移除 URL query parameter token 认证（token 在 URL 中会通过日志/referrer 泄露）
  
  if (!safeCompare(token, AUTH_TOKEN)) {
    // [AUDIT-FIX] Token 维度速率限制：记录失败尝试
    const tokenHash = token ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 16) : 'none';
    if (!checkTokenRateLimit(tokenHash)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too Many Auth Failures', retryAfter: 60 }));
      return;
    }
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing Bearer token in Authorization header' }));
    return;
  }

  // ─── CORS Preflight ───
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://localhost',  // [AUDIT-FIX] 限制 CORS 来源为本地
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'false'  // [AUDIT-FIX] 禁止跨域携带凭据
    });
    res.end();
    return;
  }

  // ─── 速率限制 ───
  const clientIp = req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too Many Requests', retryAfter: 60 }));
    return;
  }

  // ─── SSE 端点 ───
  if (pathname === '/mcp' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost',  // [AUDIT-FIX] 限制 CORS 来源
      'X-Accel-Buffering': 'no'
    });

    // 生成 sessionId
    const sessionId = crypto.randomUUID();

    // 发送端点信息 — MCP 规范要求纯 URL 字符串
    sendEvent(res, 'endpoint', '/mcp?sessionId=' + sessionId);

    // 注册客户端 (sessionId → response)
    sseClients.set(sessionId, res);
    console.error(`[HeartFlow MCP] SSE 客户端已连接 sessionId=${sessionId} (共 ${sseClients.size} 个)`);

    // 心跳保持连接
    const heartbeat = setInterval(() => {
      try { sendEvent(res, 'ping', {}); } catch (e) {}
    }, 30000);

    req.on('close', () => {
      sseClients.delete(sessionId);
      clearInterval(heartbeat);
      console.error(`[HeartFlow MCP] SSE 客户端断开 sessionId=${sessionId} (剩余 ${sseClients.size} 个)`);
    });

    return;
  }

  // ─── JSON-RPC 端点 ───
  if (pathname === '/mcp' && req.method === 'POST') {
    // 从 URL 中获取 sessionId
    const sessionId = url.searchParams.get('sessionId');

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
      try {
        const request = JSON.parse(body);
        if (!request || typeof request !== 'object' || Array.isArray(request)) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost',
          });
          res.end(makeError(null, -32600, 'Invalid Request: expected JSON-RPC object'));
          return;
        }
        const result = await handleRequest(request, sessionId);
        if (result !== null) {
          // 找到对应的 SSE 客户端，通过 SSE 发送结果
          if (sessionId && sseClients.has(sessionId)) {
            const client = sseClients.get(sessionId);
            sendEvent(client, 'message', makeResponse(request.id, result));
            res.writeHead(202, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': 'http://localhost',
            });
            res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: 'accepted' }) + '\n');
          } else {
            // 没有 SSE 客户端，直接返回
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': 'http://localhost',
            });
            res.end(makeResponse(request.id, result));
          }
        } else {
          // notification — 202 accepted
          res.writeHead(202, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost',
          });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id }) + '\n');
        }
      } catch (err) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://localhost',
        });
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
  for (const [sessionId, client] of sseClients) {
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
  shutdown();
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
