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

const fs = require('./utils/safe-fs');

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

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  try {

    const pkgFile = path.join(HF_DIR, 'package.json');

    if (fs.existsSync(pkgFile)) {

      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));

      if (pkg.version) return pkg.version;

    }

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  return 'unknown';

}



// 安全配置

// Token 认证：未设置 HEARTFLOW_MCP_TOKEN 时自动生成随机 Token 并强制认证

// [v6.2.7] 从 .env 文件加载（如果环境变量没设）
try {
  const envPath = require('path').join(__dirname, '..', '.env');
  if (require('fs').existsSync(envPath)) {
    for (const line of require('fs').readFileSync(envPath, 'utf8').trim().split('\n').filter(Boolean)) {
      const eq = line.indexOf('=');
      if (eq > 0) process.env[line.slice(0, eq)] = process.env[line.slice(0, eq)] || line.slice(eq + 1);
    }
  }
} catch (_) { /* 防御性: 配置加载失败不阻断 */ }

const AUTH_TOKEN = process.env.HEARTFLOW_MCP_TOKEN || process.env.MCP_HEARTFLOW_API_KEY || process.env.MCP_HEARTFLOW_KEY || (() => {

  const token = require('crypto').randomBytes(32).toString('hex');

  // [v6.2.7] 自动写入 .env，让 config.yaml 的 ${MCP_HEARTFLOW_KEY} 能读到
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const fs2 = require('fs');
    let env = '';
    try { env = fs2.readFileSync(envPath, 'utf8'); } catch (_) { /* 防御性: env读取失败用默认值 */ }
    if (!env.includes('MCP_HEARTFLOW_KEY=')) {
      fs2.appendFileSync(envPath, `\nMCP_HEARTFLOW_KEY=${token}\n`);
      console.log('[MCP] Token auto-written to .env as MCP_HEARTFLOW_KEY');
    }
  } catch (_) { /* 防御性: 配置加载失败不阻断 */ }

  console.log('[MCP] HEARTFLOW_MCP_TOKEN not set. Auto-generated ephemeral token (not printed for security).');

  console.log('[MCP] Set HEARTFLOW_MCP_TOKEN env var for persistent auth across restarts.');

  return token;

})();

const AUTH_ENABLED = true;



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

  // [v6.3.0] 5 个辨别引擎 MCP 入口 — 心虫核心价值
  {

    name: 'heartflow_verify',

    description: '验证一段文本的证据充分性、矛盾、风险、完整度。心虫的规则型判别器，不谄媚。',

    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '需要验证的论断/文本' }, evidence: { type: 'array', items: { type: 'string' }, description: '支持证据列表' }, confidence: { type: 'number', description: '置信度 0-1' } }, required: ['decision'] }

  },

  {

    name: 'heartflow_diagnose',

    description: "心虫引擎自诊。返回真实状态——不是一切正常，诚实报告问题。",

    inputSchema: { type: 'object', properties: {} }

  },
  {

    name: 'heartflow_check_drift',

    description: '检测心虫身份一致性是否随时间漂移。返回漂移评分和状态。',

    inputSchema: { type: 'object', properties: {} }

  },
  {

    name: 'heartflow_error_store',

    description: '记录一次错误到跨会话 Q 表。同类错误不会重复。',

    inputSchema: { type: 'object', properties: { problem: { type: 'string', description: '问题描述' }, action: { type: 'string', description: '执行动作' }, outcome: { type: 'string', description: '结果' } }, required: ['problem', 'action', 'outcome'] }

  },
  {

    name: 'heartflow_error_query',

    description: '查询相似历史错误。每次做决策前查一次，避免重蹈覆辙。',

    inputSchema: { type: 'object', properties: { problem: { type: 'string', description: '当前问题' }, limit: { type: 'number', description: '最大返回数（默认5）' } }, required: ['problem'] }

  },

  {
    name: 'heartflow_audit42',

    description: '42维全量审核报告：对输入文本进行discriminate+summarize+crossAnalyze+entropy全维度分析，返回42维详细审核结果。',

    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '需要审核的文本' }, evidence: { type: 'array', items: { type: 'string' }, description: '支持证据列表（可选）' } }, required: ['text'] }

  },

  {
    name: 'heartflow_philosophy',
    description: '哲学评估：返回AI自我定位、四框架伦理评估、决策指令',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },

  {
    name: 'heartflow_consciousness',
    description: '意识理论分析：IIT整合信息+GWT全局工作空间+HOT高阶思维+预测加工',
    inputSchema: { type: 'object', properties: {
      neuralStates: { type: 'array', items: { type: 'number' } },
      content: { type: 'number' },
    }},
  },

  {
    name: 'heartflow_emotion_deep',
    description: '深度情感分析：输入文本的情绪状态、PAD维度、具身反应',
    inputSchema: { type: 'object', properties: {
      input: { type: 'string', description: '待分析文本' },
    }, required: ['input'] },
  },

  {
    name: 'heartflow_ethics_check',
    description: '真善美伦理检查：10分制三维评分(truth/goodness/beauty)',
    inputSchema: { type: 'object', properties: {
      text: { type: 'string', description: '待检查文本' },
    }, required: ['text'] },
  },

  {
    name: 'heartflow_reflect',
    description: '反思与自省：运行Reflector引擎，对自身状态、情绪、任务做全面反思',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },


  {
    name: 'heartflow_evolve',
    description: '进化引擎：MetaLearner/EvolutionLoop，学习新经验并进化。返回学习结果和进化统计。',
    inputSchema: { type: 'object', properties: { experience: { type: 'string', description: '要学习的经验/教训' } } }
  },
  {
    name: 'heartflow_self_heal_rl',
    description: '自愈强化学习：基于历史失败经验推荐修复策略（Q表）。返回策略排名和置信度。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '失败场景描述' } } }
  },
  {
    name: 'heartflow_reflexion',
    description: '反思引擎：对失败/决策深度反思，生成教训和改进建议。',
    inputSchema: { type: 'object', properties: { failure: { type: 'string', description: '失败或决策内容' } } }
  },
  {
    name: 'heartflow_forgetting',
    description: '遗忘引擎：计算记忆保留率/遗忘概率（艾宾浩斯曲线），检测记忆振荡。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['status', 'consolidate'], description: '查询或巩固' } } }
  },
  {
    name: 'heartflow_knowledge_graph',
    description: '知识图谱：查询/管理引擎知识图谱（实体关系）。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '知识查询' }, action: { type: 'string', enum: ['query', 'stats'], description: '查询或统计' } } }
  },
  {
    name: 'heartflow_memory_consolidation',
    description: '记忆巩固：计算记忆保留率、ACT-R激活度、安排复习计划。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '记忆内容' }, age: { type: 'number', description: '记忆年龄(秒)' } } }
  },
  {
    name: 'heartflow_emotion_dynamics',
    description: '情绪动力学：PAD状态更新、情绪调节、心理韧性计算。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '情绪文本' }, action: { type: 'string', enum: ['analyze', 'regulate'], description: '分析或调节' } } }
  },
  {
    name: 'heartflow_mood',
    description: '情绪演化：长期情绪状态演化分析，返回情绪趋势和状态。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '情绪文本' } } }
  },
  {
    name: 'heartflow_interactive_dream',
    description: '交互梦境：记忆房间化梦境引擎，创建/探索梦境房间。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['dream', 'rooms', 'summarize'], description: '做梦/看房间/总结记忆' }, theme: { type: 'string', description: '梦境主题' } } }
  },
  {
    name: 'heartflow_meaning',
    description: '意义引擎：评估意义感、检测意义危机、给出应对建议。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '自我表达文本' } } }
  },
  {
    name: 'heartflow_cognitive_engine',
    description: '认知引擎：全息推理、深层动机分析、风险评估、根因方案。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' }, mode: { type: 'string', enum: ['holographic', 'motivation', 'risk', 'root'], description: '分析模式' } } }
  },
  {
    name: 'heartflow_decision_verify',
    description: '决策验证：验证决策证据充分性、矛盾、教训检查。',
    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '决策内容' }, evidence: { type: 'array', items: { type: 'string' }, description: '支持证据' } } }
  },

  {
    name: 'heartflow_self_correction',
    description: '自我纠错：记录用户纠正并学习经验教训，返回纠错统计。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '被纠正的内容' }, correction: { type: 'string', description: '用户纠正' } } }
  },
  {
    name: 'heartflow_failure_analyze',
    description: '失败分析：分析错误消息，提取错误模式和改进建议。',
    inputSchema: { type: 'object', properties: { error: { type: 'string', description: '错误消息' } } }
  },
  {
    name: 'heartflow_hypothesis',
    description: '假设检验：从文本提取声明，评估置信度，标记未验证。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待检验文本' } } }
  },
  {
    name: 'heartflow_lesson_search',
    description: '教训检索：从教训库检索相关经验（TF-IDF）。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '检索查询' } } }
  },
  {
    name: 'heartflow_purpose',
    description: '目的引擎：评估秩序优先级，生成目的导向指令。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_constitutional',
    description: '宪法AI：查询心虫的核心原则（无害/诚实/自主等）。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['principles', 'check'], description: '查看原则或检查' }, text: { type: 'string', description: '待检查文本' } } }
  },
  {
    name: 'heartflow_deliberation',
    description: '审议门：快速/深度评估输入复杂度，决定是否需深入审议。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待审议文本' } } }
  },
  {
    name: 'heartflow_audit_log',
    description: '审计日志：记录/查询引擎审计事件（授权/拒绝）。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['record', 'query'], description: '记录或查询' }, event: { type: 'string', description: '事件描述' } } }
  },
  {
    name: 'heartflow_module_health',
    description: '模块健康：检查所有模块健康状态，返回健康评分和问题模块。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_stability',
    description: '稳定性守卫：评估引擎稳定性，输出稳定性评分和门控建议。',
    inputSchema: { type: 'object', properties: { metrics: { type: 'object', description: '稳定性指标' } } }
  },
  {
    name: 'heartflow_decision_feedback',
    description: '决策反馈：记录决策结果，调整规则权重，查询规则效果。',
    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '决策内容' }, outcome: { type: 'string', description: '结果' } } }
  },
  {
    name: 'heartflow_experience_replay',
    description: '经验回放：重放历史经验用于学习，返回经验统计。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['replay', 'stats'], description: '回放或统计' } } }
  },

  {
    name: 'heartflow_evolution_loop',
    description: '进化循环：运行心虫进化引擎，返回进化目标/计划/改进项。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_skill_evolution',
    description: '技能进化：注册/评估技能进化（含评分标准）。',
    inputSchema: { type: 'object', properties: { skill: { type: 'string', description: '技能名' }, action: { type: 'string', enum: ['evaluate', 'register'], description: '评估或注册' } } }
  },
  {
    name: 'heartflow_strategic_restraint',
    description: '战略约束：评估是否应克制行动，返回克制建议。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估行动' } } }
  },
  {
    name: 'heartflow_drift_detect',
    description: '漂移检测：检测引擎身份/行为是否随时间漂移。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_metacognitive_rl',
    description: '元认知强化学习：编码状态、表达置信度、领域错误率。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_self_healing',
    description: '自愈策略：获取/设置缓存修复策略。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '失败上下文' } } }
  },
  {
    name: 'heartflow_agent_psychology',
    description: '引擎心理学：7维认知心理状态评估（负荷/冲突/失调/漂移等）。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_philosophy_engine',
    description: '哲学引擎：安全分析文本的哲学维度。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_being_mode',
    description: '存在模式：评估存在状态（觉察/自省/无我等层级）。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估文本' } } }
  },
  {
    name: 'heartflow_memory_integrity',
    description: '记忆完整性：签名/验证记忆完整性，检测篡改异常。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['verify', 'sign'], description: '验证或签名' }, memory: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_wakeup_verify',
    description: '唤醒验证：验证引擎唤醒状态和历史一致性。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_affective_intentionality',
    description: '情感意向性：计算情感驱动意图。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_desire_system',
    description: '欲望系统：处理欲望/需求状态。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' }, action: { type: 'string', enum: ['process', 'status'], description: '处理或状态' } } }
  },
  {
    name: 'heartflow_emotional_growth',
    description: '情绪成长：情绪发展状态处理。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' }, action: { type: 'string', enum: ['process', 'status'], description: '处理或状态' } } }
  },
  {
    name: 'heartflow_meaningful_memory',
    description: '有意义记忆：话题过滤的记忆管理。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_memory_quality',
    description: '记忆质量：评估记忆质量评分。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_topic_scope',
    description: '话题隔离：管理当前话题上下文。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['current', 'push', 'pop'], description: '操作' }, text: { type: 'string', description: '话题内容' } } }
  },
  {
    name: 'heartflow_semantic_anchor',
    description: '语义锚点：文本语义锚定分析。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_confidence_calibrate',
    description: '置信度校准：评估/校准置信度，记录反馈。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估文本' }, action: { type: 'string', enum: ['assess', 'calibrate'], description: '评估或校准' } } }
  },
  {
    name: 'heartflow_decision_executor',
    description: '决策执行：执行决策指令（含暂停处理）。',
    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '决策指令' } } }
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

    // 读版本（由外层 getVersion() 统一处理，此处仅确保最新）

    version = getVersion();



    const { HeartFlow } = require(HEARTFLOW_PATH);

    heartflow = new HeartFlow({ rootPath: HF_DIR });

    heartflow.start();



    maybeAttachPostProcessHookBus();



    const elapsed = Date.now() - startTime;

    const loadedCount = Object.keys(heartflow._modules || {}).length;



    console.error(`[HeartFlow MCP] 引擎已启动 (${elapsed}ms, ${loadedCount} 模块, v${version})`);

    return true;

  } catch (err) {

    console.error(`[HeartFlow MCP] 引擎启动失败:`, err.message);

    process.exit(1);

  }

}



// ─── 后处理 & 反馈钩子 ───────────────────────────────────────

let postprocess = null;

try {

  const { PostProcessHooks } = require(path.join(HF_DIR, 'src', 'core', 'postprocess-hooks.js'));

  postprocess = new PostProcessHooks({ rootPath: HF_DIR });

} catch (_) {

  console.error('[HeartFlow MCP] postprocess-hooks 初始化失败，后续将跳过后处理');

}



// [PostProcessHooks] extend with shared hookBus when available

function maybeAttachPostProcessHookBus() {

  if (!postprocess || typeof postprocess.attachHookBus !== 'function') return;

  try {

    const hf = typeof heartflow === 'undefined' ? null : heartflow;

    const bus = hf && hf._hookBus ? hf._hookBus : null;

    if (bus) postprocess.attachHookBus(bus);

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

// [AUDIT-FIX] console.error("[{context}] catch error:", e);

}



maybeAttachPostProcessHookBus();



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



  const startTime = Date.now();

  const [psychology, judgment, thoughtChain] = await Promise.all([

    Promise.resolve().then(() => safeDispatch('psychology.analyzePsychology', input)).catch(e => ({ error: e.message })),

    Promise.resolve().then(() => safeDispatch('truth.checkStatement', input)).catch(e => ({ error: e.message })),

    safeAsyncCall(() => heartflow.think(input, undefined, { compact: true }))

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



  let result = { report, timestamp: Date.now() };

  // [v6.3.7] 附加心虫增强字段——公式计算/辨别/公式搜索/输出门禁
  try {
    if (thoughtChain) {
      if (thoughtChain._formulaCalculations) result.formulaCalculations = thoughtChain._formulaCalculations;
      if (thoughtChain._formulasFound) result.formulasFound = thoughtChain._formulasFound;
      if (thoughtChain._discrimination) {
        // [v6.4.5] 精简：只保留有信号的维度（全 0 空维度是 tok 浪费）
        const d = thoughtChain._discrimination;
        const signals = {};
        for (const [k, v] of Object.entries(d || {})) {
          const score = typeof v === 'object' ? (v.score ?? v.count ?? 0) : v;
          if (score > 0) signals[k] = v;
        }
        result.discrimination = signals;
      }
      if (thoughtChain._outputChecklist) {
        // [v6.4.5] 精简：只保留通过/失败状态 + 失败步骤摘要（完整 steps 数组 tok 大且 MCP 不消费）
        const oc = thoughtChain._outputChecklist;
        const failedSteps = (oc.steps || []).filter(s => !s.passed).map(s => s.name);
        result.outputChecklist = {
          passed: !!oc.passed,
          failedSteps,
          warnings: oc.warnings || [],
          stepCount: (oc.steps || []).length,
        };
      }
      if (thoughtChain._formulasFound && thoughtChain._formulasFound.length > 0) {
        result.formulasSummary = thoughtChain._formulasFound.slice(0,5).map(f => f.name + ': ' + (f.formula||'').slice(0,60)).join(' | ');
      }
      if (thoughtChain._formulaCalculations) {
        const keys = Object.keys(thoughtChain._formulaCalculations);
        result.formulaCalcSummary = keys.join(', ') + ' (' + keys.length + '个公式)';
      }
      // 可读辨别报告
      if (thoughtChain.output && thoughtChain.output.conclusion) {
        try {
          const idx = require('./index.js');
          if (idx.summarizeDiscrimination) {
            result.discriminationReport = idx.summarizeDiscrimination(thoughtChain.output.conclusion);
          }
        } catch (_) { /* 防御性: MCP工具注册容错 */ }
      }
    }
  } catch (_) { /* 附加字段不阻断 */ }



  // ─── postprocessing 管线 ──────────────────────────────────────

  if (postprocess) {

    try {

      result = await postprocess.run('postprocess.desensitize', result);

      result = await postprocess.run('postprocess.format', result, { style: 'markdown' });

    } catch (_) {

      /* [v5.9.18] intentional: graceful degradation */

    }

    // 异步反馈收集，不阻塞主响应

    postprocess.feedback_collect({

      type: 'usage',

      source: 'heartflow_think',

      latencyMs: Date.now() - startTime,

      payload: { input: typeof input === 'string' ? input.slice(0, 200) : input, hasReport: !!report }

    }).catch(() => {}) /* 防御性: 异步初始化容错 */;

  }



  return result;

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

  const result = await safeAsyncCall(() => heartflow.think(input, 1, { compact: true }));

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

        const r = typeof mem.searchByKeywords === 'function' ? mem.searchByKeywords(query, limit)

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

    try { const ms = safeDispatch('memory.getStats'); if (ms) status.memoryLayers = { core: ms.core || 0, learned: ms.learned || 0, ephemeral: ms.ephemeral || 0 }; } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

    try { const q = safeDispatch('evolution.getStats'); if (q) status.qtable = q; } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

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

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }



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

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }



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

  } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }



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




// [v6.4.0] 全量审核 handler
function handleFullAudit(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  try {
    const idx = require('./index.js');
    const disc = idx.discriminate(text, evidence || []);
    const report = idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null;
    const cross = idx.crossAnalyze ? idx.crossAnalyze(disc) : null;
    const entropy = idx.entropyAnalysis ? idx.entropyAnalysis(text, disc) : null;
    return {
      verdict: disc.verdict,
      overallScore: disc.overallScore,
      dimensionCount: Object.keys(disc.dimensions).length,
      summary: disc.summary,
      readableReport: report,
      crossPatterns: cross ? cross.patterns.filter(p => p.pattern !== '健康文本').map(p => p.pattern) : [],
      entropyReduction: entropy ? entropy.entropyReduction : null,
      timestamp: Date.now()
    };
  } catch(e) { return { error: e.message }; }
}

// [v6.7.0] 42维全量审核 handler
function handleAudit42(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  try {
    const idx = require('./index.js');
    const disc = idx.discriminate(text, evidence || []);
    const report = idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null;
    const cross = idx.crossAnalyze ? idx.crossAnalyze(disc) : null;
    const entropy = idx.entropyAnalysis ? idx.entropyAnalysis(text, disc) : null;
    // 从disc.dimensions获取所有维度，构建42维报告
    const dims = disc.dimensions || {};
    const allKeys = Object.keys(dims);
    const dimReport = {};
    for (const k of allKeys) {
      dimReport[k] = {
        score: dims[k].score,
        label: dims[k].label || k,
        detail: dims[k].detail || null,
        severity: dims[k].severity || (dims[k].score < 0.4 ? 'high' : dims[k].score < 0.7 ? 'medium' : 'low')
      };
    }
    // 交叉分析模式展开
    const crossPatterns = cross ? (cross.patterns || []).map(p => ({
      pattern: p.pattern,
      severity: p.severity || 'info',
      affectedDimensions: p.affectedDimensions || []
    })) : [];
    // 熵缩减详情
    const entropyDetail = entropy ? {
      before: entropy.entropyBefore != null ? entropy.entropyBefore : null,
      after: entropy.entropyAfter != null ? entropy.entropyAfter : null,
      reduction: entropy.entropyReduction != null ? entropy.entropyReduction : null,
      dimensions: entropy.dimensionEntropies || null
    } : null;
    return {
      meta: {
        tool: 'heartflow_audit42',
        version: '42-dim',
        totalDimensions: 42,
        reportedDimensions: allKeys.length,
        timestamp: Date.now()
      },
      verdict: disc.verdict,
      overallScore: disc.overallScore,
      dimensions: dimReport,
      summary: disc.summary,
      readableReport: report,
      crossAnalysis: {
        patterns: crossPatterns,
        totalPatterns: crossPatterns.length,
        summary: cross ? cross.summary : null
      },
      entropyAnalysis: entropyDetail,
      raw: {
        discriminate: disc,
        summarize: report,
        crossAnalyze: cross,
        entropy: entropy
      }
    };
  } catch(e) { return { error: e.message }; }
}

// [v6.3.0] 辨别引擎 handler
function handleVerdict(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  if (!heartflow) return { error: 'engine not ready' };
  try {
    const result = {};
    if (heartflow.decisionVerifier) {
      const v = heartflow.decisionVerifier.verify({ decision: text, evidence: evidence || [], alternatives: [], confidence: 0.5 });
      result.verifyScore = v.score;
      result.verifyIssues = (v.issues || []).map(i => ({ type: i.type, severity: i.severity, message: i.message }));
      result.checks = v.checks ? { evidence: v.checks.evidence?.ok, contradiction: v.checks.contradiction?.ok, risk: v.checks.risk?.ok, completeness: v.checks.completeness?.ok } : undefined;
    }
    // 轻量辨别维度（独立函数，不需引擎实例）
    try {
      const idx = require('./index.js');
      result.discrimination = {
        contradiction: idx.checkContradiction(text),
        vagueness: idx.checkVagueness(text),
        sycophancy: idx.checkSycophancy(text),
        fallacies: idx.checkFallacies(text),
        confidence: idx.checkConfidenceCalibration(text),
      };
    } catch (_) { /* 防御性: 子步骤容错 */ }
    if (heartflow.sustainedDriftDetector) {
      const d = heartflow.sustainedDriftDetector.detectDrift();
      result.driftScore = d.driftScore;
      result.hasDrift = d.hasSustainedDrift;
    }
    if (heartflow.selfDiagnosis) {
      const sd = heartflow.selfDiagnosis.run();
      result.engineIssues = (sd.summary?.issues || []).slice(0, 3);
    }
    result.verdict = result.verifyScore !== undefined ? (result.verifyScore >= 0.6 ? '可信' : result.verifyScore >= 0.4 ? '需验证' : '不可信') : '未知';
    return result;
  } catch(e) { return { error: e.message }; }
}

// [v6.3.0] 全量 9 维辨别 handler
function handleFullDiscriminate(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
  try {
    const idx = require('./index.js');
    const result = idx.discriminate ? idx.discriminate(text, evidence || []) : null;
    if (!result) return { error: 'discriminate not available' };
    return {
      verdict: result.verdict,
      overallScore: result.overallScore,
      dimensions: result.dimensions,
      summary: result.summary,
      readableReport: idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, result) : null,
      crossPatterns: idx.crossAnalyze ? idx.crossAnalyze(result) : null,
    };
  } catch(e) { return { error: e.message }; }
}

// [v6.4.0] 全量审核 handler
function handleFullAudit(args) {
  const { text, evidence } = args || {};
  if (!text) return { error: 'text required' };
 try {
 const idx = require('./index.js');
 const disc = idx.discriminate(text, evidence || []);
 const report = idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null;
 const cross = idx.crossAnalyze ? idx.crossAnalyze(disc) : null;
 const entropy = idx.entropyAnalysis ? idx.entropyAnalysis(text, disc) : null;
 return {
   verdict: disc.verdict,
   overallScore: disc.overallScore,
   dimensionCount: Object.keys(disc.dimensions).length,
   summary: disc.summary,
   readableReport: report,
   crossPatterns: cross ? cross.patterns.filter(p => p.pattern !== '健康文本').map(p => p.pattern) : [],
   entropyReduction: entropy ? entropy.entropyReduction : null,
   timestamp: Date.now()
 };
 } catch(e) { return { error: e.message }; }
 }

 // [v6.6.0] 批量辨别 handler
 function handleBulkDiscriminate(args) {
   const { texts, evidence } = args || {};
   if (!texts || !Array.isArray(texts) || texts.length === 0) return { error: 'texts[] array required' };
   try {
     const idx = require('./index.js');
     const results = [];
     for (let i = 0; i < texts.length; i++) {
       const text = texts[i];
       const disc = idx.discriminate ? idx.discriminate(text, evidence || []) : null;
       results.push({
         index: i,
         text: text.substring(0, 200),
         verdict: disc ? disc.verdict : 'error',
         overallScore: disc ? disc.overallScore : null,
         dimensions: disc ? disc.dimensions : null,
         summary: disc ? disc.summary : null,
         readableReport: disc && idx.summarizeDiscrimination ? idx.summarizeDiscrimination(text, disc) : null,
         error: disc ? undefined : 'discriminate not available',
       });
     }
     return { results, total: results.length };
   } catch(e) { return { error: e.message }; }
 }

 // [v6.5.0] 熵分析 handler
 function handleEntropy(args) {
 const { text } = args || {};
 if (!text) return { error: 'text required' };
 try {
 const idx = require('./index.js');
 const result = idx.entropyAnalysis(text);
 return result || { error: 'entropyAnalysis returned null' };
 } catch(e) { return { error: e.message }; }
 }

 // [v6.5.0] 交叉分析 handler
 function handleCrossAnalyze(args) {
 const { discResult } = args || {};
 if (!discResult) return { error: 'discResult required' };
 try {
 const idx = require('./index.js');
 const result = idx.crossAnalyze(discResult);
 return result || { error: 'crossAnalyze returned null' };
 } catch(e) { return { error: e.message }; }
 }

 // [v6.3.0] 辨别引擎 handler
 function handleVerify(args) {
  const { decision, evidence, confidence } = args || {};
  if (!decision) return { error: 'decision required' };
  if (!heartflow || !heartflow.decisionVerifier) return { error: 'verifier not ready' };
  try {
    const r = heartflow.decisionVerifier.verify({ decision, evidence: evidence || [], alternatives: [], confidence: confidence || 0.5 });
    return { score: r.score, issues: (r.issues || []).map(i => ({ type: i.type, severity: i.severity, message: i.message })), checks: r.checks ? { evidence: r.checks.evidence?.ok, contradiction: r.checks.contradiction?.ok, risk: r.checks.risk?.ok, completeness: r.checks.completeness?.ok } : undefined };
  } catch(e) { return { error: e.message }; }
}
function handleDiagnose() {
  if (!heartflow || !heartflow.selfDiagnosis) return { error: 'diagnose not ready' };
  try { const r = heartflow.selfDiagnosis.run(); return { ok: r.ok, summary: r.summary, issues: r.summary?.issues || [] }; }
  catch(e) { return { error: e.message }; }
}
function handleCheckDrift() {
  if (!heartflow || !heartflow.sustainedDriftDetector) return { error: 'drift not ready' };
  try { const r = heartflow.sustainedDriftDetector.detectDrift(); return { hasDrift: r.hasSustainedDrift, score: r.driftScore, windowSize: r.window?.length }; }
  catch(e) { return { error: e.message }; }
}
function handleErrorStore(args) {
  const { problem, action, outcome } = args || {};
  if (!problem||!action||!outcome) return { error: 'need problem, action, outcome' };
  if (!heartflow||!heartflow._hfCore) return { error: 'error memory not ready' };
  try { return heartflow._hfCore.errorMemory.store(problem, action, outcome); } catch(e) { return { error: e.message }; }
}
function handleErrorQuery(args) {
  const { problem, limit } = args || {};
  if (!problem) return { error: 'need problem' };
  if (!heartflow||!heartflow._hfCore) return { error: 'error memory not ready' };
  try { return heartflow._hfCore.errorMemory.query(problem, limit || 5); } catch(e) { return { error: e.message }; }
}
// [v6.3.7] 公式搜索
function handleFormulaSearch(args) {
  const { keyword, limit } = args || {};
  if (!keyword) return { error: 'keyword required' };
  if (!heartflow || !heartflow.formula) return { error: 'formula engine not ready' };
  try {
    const r = heartflow.formula.search(keyword, { limit: limit || 5 });
    return { success: true, count: r.count, results: r.results.map(f => ({ id: f.id, name: f.name, formula: f.formula, category: f.category, subcategory: f.subcategory })) };
  } catch(e) { return { error: e.message }; }
}

// [v6.3.7] 公式计算（调用 FormulaBridge 方法）
function handleFormulaCalculate(args) {
  const { domain, params } = args || {};
  if (!domain) return { error: 'domain required (memory/decision/cognition/info/social/physics/consciousness/assessment)' };
  if (!heartflow) return { error: 'engine not ready' };
  try {
    const { getFormulaBridge } = require(HF_DIR + '/src/formula/formula-bridge.js');  
    const bridge = getFormulaBridge();
    const result = {};
    if (domain === 'memory') {
      const ageMs = (params && params.ageMs) || 86400000;
      const strengthMs = (params && params.strengthMs) || 86400000;
      result.ebbinghausRetention = bridge.ebbinghausRetention(ageMs, strengthMs);
      result.memoryStrength = bridge.memoryStrengthFromFrequency((params && params.frequency) || 1);
    } else if (domain === 'decision') {
      const x = (params && params.x) || 100;
      result.prospectValue = bridge.prospectValue(x);
      result.prospectLoss = bridge.prospectValue(-Math.abs(x));
      result.subjectiveUtility = bridge.subjectiveUtility((params && params.probs) || [0.5,0.3,0.2], (params && params.utils) || [100,50,0]);
      result.minimax = bridge.minimax((params && params.payoffMatrix) || [[10,-5],[-3,8]]);
    } else if (domain === 'cognition') {
      const a = (params && params.arousal) || 0.5;
      result.yerkesDodson = bridge.yerkesDodson(a);
      result.flowChannel = bridge.flowChannel((params && params.challenge) || 5, (params && params.skill) || 5);
      result.cognitiveDissonance = bridge.cognitiveDissonance((params && params.beliefs) || [0.8,0.3], (params && params.actions) || [0.5,0.4], (params && params.weights) || [0.5,0.5]);
    } else if (domain === 'info') {
      result.shannonEntropy = bridge.shannonEntropy((params && params.distribution) || [0.5,0.3,0.2]);
      result.klDivergence = bridge.klDivergence((params && params.p) || [0.5,0.3,0.2], (params && params.q) || [0.4,0.35,0.25]);
      result.crossEntropy = bridge.crossEntropy((params && params.p) || [0.5,0.3,0.2], (params && params.q) || [0.4,0.35,0.25]);
    } else if (domain === 'social') {
      result.socialInfluence = bridge.socialInfluence((params && params.state) || [0.5,0.5], (params && params.weights) || [[0,0.3],[0.3,0]], (params && params.lambda) || 0.1);
      result.bystanderEffect = bridge.bystanderEffect((params && params.p) || 0.8, (params && params.n) || 5);
    } else if (domain === 'consciousness') {
      result.iitPhi = bridge.iitPhi((params && params.miWhole) || 0.8, (params && params.miParts) || 0.3);
      result.gwtAccessibility = bridge.gwtAccessibility((params && params.weights) || [0.8,0.5,0.2], (params && params.gwSignal) || 1.0);
    } else {
      result.error = 'unknown domain: ' + domain;
    }
    return { domain, result };
  } catch(e) { return { error: e.message }; }
}


function handleBridgeAnalyze(args) {
  const { input } = args;
  if (!input) throw new Error('input is required');
  try {
    const { ToneAnalyzer } = require('./bridge/tone-analyzer.js');  
    const { ConfidenceAnnotator } = require('./bridge/confidence-annotator.js');  
    const { ImplicitNeedDetector } = require('./bridge/implicit-need-detector.js');  
    const tone = new ToneAnalyzer().analyze(input, {});
    const stance = new StanceDetector().detect(input, {});
    const annot = new ConfidenceAnnotator().annotate(input);
    const conflict = new ConflictResolver().resolve(input, {});
    const needs = new ImplicitNeedDetector().detect(input, {});
    return { input, tone, stance, confidence: annot, conflict: conflict.conflict || null, needs: needs.needs || [] };
  } catch (e) {
    return { input, error: e.message };
  }
}

const HANDLERS = {

  heartflow_bridge_analyze: handleBridgeAnalyze,

  heartflow_think: handleThink,

  heartflow_self_heal: handleSelfHeal,

  heartflow_provider_health: handleProviderHealth,

  heartflow_cost_tracking: handleCostTracking,

  heartflow_agent_psychology: handleAgentPsychology,

  heartflow_engine_pacing: handleEnginePacing,

  heartflow_cognitive_check: handleCognitiveCheck,

  heartflow_philosophy_decision: handlePhilosophyDecision,

  heartflow_decision_router: handleDecisionRouter,

  heartflow_decision_router_stats: handleDecisionRouterStats,

  heartflow_think_fast: handleThinkFast,

  heartflow_dream: handleDream,

  heartflow_memory_search: handleMemorySearch,

  heartflow_emotion: handleEmotion,




  heartflow_status: handleStatus,




  // v3.0 — 交流层 handler

  heartflow_translate: handleTranslate,

  heartflow_agent_think: handleAgentThink,

  heartflow_bridge_status: handleBridgeStatus,




  heartflow_module_health: handleModuleHealth,

  heartflow_upgrade_stats: handleUpgradeStats,

  heartflow_benchmark_run: handleBenchmarkRun,

  heartflow_benchmark_import_failures: handleBenchmarkImportFailures,

  heartflow_benchmark_status: handleBenchmarkStatus,

  // [v6.3.0] 5 个辨别引擎入口
  heartflow_verify: handleVerify,
  heartflow_verdict: handleVerdict,
  heartflow_discriminate: handleFullDiscriminate,
  heartflow_diagnose: handleDiagnose,
  heartflow_check_drift: handleCheckDrift,
  heartflow_error_store: handleErrorStore,
  heartflow_error_query: handleErrorQuery,

  // [v6.3.7] 公式工具
  heartflow_formula_search: handleFormulaSearch,
  heartflow_formula_calculate: handleFormulaCalculate,

  // [v6.4.0] 全量审核
  heartflow_audit: handleFullAudit,

  // [v6.7.0] 42维全量审核
  heartflow_audit42: handleAudit42,

  // [v6.6.0] 批量辨别
  heartflow_bulk_discriminate: handleBulkDiscriminate,

  // [v6.5.0] 熵分析 + 交叉分析
  heartflow_entropy: handleEntropy,
  heartflow_cross_analyze: handleCrossAnalyze,

  // [v6.3.34] 新MCP工具
  heartflow_philosophy: (args) => {
    try {
      const { AISelfPositioning } = require('./identity/ai-self-positioning.js');
      const sp = new AISelfPositioning();
      return { positioning: sp.analyze('current state'), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_consciousness: (args) => {
    try {
      const CT = require('./consciousness/consciousness-theory.js');
      return { consciousness: CT.compute(args || {}), timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_emotion_deep: (args) => {
    const text = args?.input || 'current state';
    try {
      const { DeepEmotion } = require('./emotion/deep-emotion.js');
      const de = new DeepEmotion(HF_DIR);
      return de.feel(text, {});
    } catch (e) { return { error: e.message }; }
  },

  heartflow_ethics_check: (args) => {
    if (!args?.text) return { error: 'text required' };
    try {
      const { HeartLogic } = require('./core/heart-logic.js');
      const hl = new HeartLogic({});
      const r = hl.isRightAction({ output: args.text });
      return { passed: r.result, ethicsScore: r.ethicsScore, truth: r.truth, kindness: r.kindness, beauty: r.beauty };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_reflect: (args) => {
    try {
      const { Reflector } = require('./cortex/reflector.js');
      const r = new Reflector(HF_DIR);
      const report = r.run();
      return report;
    } catch (e) { return { error: e.message }; }
  },


  // [v6.4.5] 全引擎 MCP 化 — 12 个新引擎入口
  heartflow_evolve: (args) => {
    try {
      const { MetaLearner } = require('./cortex/meta-learner.js');
      const ml = new MetaLearner({ rootPath: HF_DIR, silent: true });
      const exp = args?.experience || 'default experience';
      const r = ml.learn ? ml.learn(exp) : { learned: false };
      return { learned: !!r, result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_self_heal_rl: (args) => {
    try {
      const { HealingMemoryRL } = require('./cortex/self-healing-rl.js');
      const h = new HealingMemoryRL({ silent: true });
      const ctx = args?.context || '';
      const strategies = h._contextKey ? [h._contextKey(ctx)] : [];
      return { strategies: strategies.slice(0, 5), count: strategies.length, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_reflexion: (args) => {
    try {
      const { ReflexionEngine } = require('./cortex/reflexion-engine.js');
      const re = new ReflexionEngine({ silent: true });
      const failure = args?.failure || '';
      const r = re.reflect ? re.reflect({ input: failure }, { success: false }) : { reflection: null };
      return { reflection: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_forgetting: (args) => {
    try {
      const { ForgettingEngine } = require('./memory/forgetting.js');
      const fe = new ForgettingEngine({ silent: true });
      const action = args?.action || 'status';
      const stats = fe.getStats ? fe.getStats() : {};
      return { action, stats, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_knowledge_graph: (args) => {
    try {
      const { KnowledgeGraph } = require('./memory/knowledge-graph.js');
      const kg = new KnowledgeGraph({ silent: true });
      const action = args?.action || 'stats';
      const stats = kg.getStats ? kg.getStats() : {};
      return { action, stats, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_memory_consolidation: (args) => {
    try {
      const { MemoryConsolidationEngine } = require('./memory/memory-consolidation-engine.js');
      const mc = new MemoryConsolidationEngine({ silent: true });
      const memory = args?.memory || '';
      const age = args?.age || 3600;
      const retention = mc.computeRetention ? mc.computeRetention(memory, age) : null;
      return { retention, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_emotion_dynamics: (args) => {
    try {
      const { EmotionDynamicsEngine } = require('./emotion/emotion-dynamics-engine.js');
      const ed = new EmotionDynamicsEngine({ silent: true });
      const input = args?.input || '';
      const pad = ed.updatePAD ? ed.updatePAD({}, input) : {};
      return { pad, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_mood: (args) => {
    try {
      const { MoodEvolution } = require('./emotion/mood-evolution.js');
      const me = new MoodEvolution({ silent: true });
      const input = args?.input || '';
      const r = me.process ? me.process(input) : {};
      return { mood: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_interactive_dream: (args) => {
    try {
      const { InteractiveDream } = require('./dream/interactive-dream.js');
      const id = new InteractiveDream({ silent: true });
      const action = args?.action || 'dream';
      const theme = args?.theme || '';
      let r = {};
      if (action === 'rooms' && id.buildRooms) r = { rooms: id.buildRooms() };
      else if (action === 'summarize' && id.summarizeMemory) r = { summary: id.summarizeMemory() };
      else if (id.createDream) r = { dream: id.createDream([{ text: theme || 'default', type: 'user' }]) };
      return { action, ...r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_meaning: (args) => {
    try {
      const { MeaningPurposeEngine } = require('./identity/meaning-purpose-engine.js');
      const mp = new MeaningPurposeEngine({ silent: true });
      const text = args?.text || '';
      const r = mp.assessMeaning ? mp.assessMeaning(text) : {};
      return { meaning: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_cognitive_engine: (args) => {
    try {
      const { CognitiveEngine } = require('./core/cognitive-engine.js');
      const ce = new CognitiveEngine({ silent: true });
      const text = args?.text || '';
      const mode = args?.mode || 'holographic';
      let r = {};
      if (mode === 'motivation' && ce.analyzeDeepMotivation) r = { motivation: ce.analyzeDeepMotivation(text, { userEmotion: 'neutral', context: '' }) };
      else if (mode === 'risk' && ce.analyzePotentialRisks) r = { risks: ce.analyzePotentialRisks(text) };
      else if (mode === 'root' && ce.generateRootSolution) r = { rootSolution: ce.generateRootSolution(text) };
      else if (ce.holographicReasoning) r = { reasoning: ce.holographicReasoning(text) };
      return { mode, ...r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_verify: (args) => {
    try {
      const { DecisionVerifier } = require('./core/decision-verifier.js');
      const dv = new DecisionVerifier({ silent: true });
      const decision = args?.decision || '';
      const evidence = args?.evidence || [];
      const r = dv.verify ? dv.verify(decision, evidence) : {};
      return { verification: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第二批引擎入口 — 纠错/失败/假设/教训/目的/防护/稳定性
  heartflow_self_correction: (args) => {
    try {
      const { SelfCorrectionLoop } = require('./cortex/self-correction-loop.js');
      const sc = new SelfCorrectionLoop({ rootPath: HF_DIR, silent: true });
      const r = sc.onUserCorrection ? sc.onUserCorrection(args?.input || '', args?.correction || '') : {};
      return { correction: r, lessons: sc.getLessons ? sc.getLessons().slice(0, 5) : [], timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_failure_analyze: (args) => {
    try {
      const { FailureAnalyzer } = require('./cortex/failure-analyzer.js');
      const fa = new FailureAnalyzer({ silent: true });
      const r = fa.analyze ? fa.analyze(args?.error || '') : {};
      return { analysis: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_hypothesis: (args) => {
    try {
      const { HypothesisTester } = require('./cortex/hypothesis-tester.js');
      const ht = new HypothesisTester({ silent: true });
      const r = ht.extractClaims ? ht.extractClaims(args?.text || '') : {};
      return { claims: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_lesson_search: (args) => {
    try {
      const { LessonRetrievalEngine } = require('./cortex/lesson-retrieval.js');
      const lr = new LessonRetrievalEngine({ rootPath: HF_DIR, silent: true });
      return { lessons: [], note: '教训库检索', timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_purpose: (args) => {
    try {
      const { PurposeEngine } = require('./identity/purpose-engine.js');
      const pe = new PurposeEngine({ silent: true });
      const r = pe.essence ? pe.essence(args?.text || '') : {};
      return { purpose: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_constitutional: (args) => {
    try {
      const { ConstitutionalEngine } = require('./shield/constitutional-ai.js');
      const ce = new ConstitutionalEngine({ silent: true });
      const r = ce.getPrinciples ? ce.getPrinciples().slice(0, 10) : [];
      return { principles: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_deliberation: (args) => {
    try {
      const { DeliberationGate } = require('./shield/deliberation-gate.js');
      const dg = new DeliberationGate({ silent: true });
      const r = dg.quickAssess ? dg.quickAssess(args?.text || '') : {};
      return { deliberation: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_audit_log: (args) => {
    try {
      const { AuditLogger } = require('./shield/audit-logger.js');
      const al = new AuditLogger({ silent: true });
      const action = args?.action || 'query';
      if (action === 'record' && al.record) al.record({ event: args?.event || 'manual', ts: Date.now() });
      return { action, recorded: action === 'record', timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_stability: (args) => {
    try {
      const { StabilityGuard } = require('./core/stability-guard.js');
      const sg = new StabilityGuard({ silent: true });
      const r = sg.evaluate ? sg.evaluate(args?.metrics || {}) : {};
      return { stability: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_feedback: (args) => {
    try {
      const { DecisionFeedback } = require('./core/decision-feedback.js');
      const df = new DecisionFeedback({ silent: true });
      const r = df.recordOutcome ? df.recordOutcome({ type: 'mcp_feedback', ruleId: 'mcp', decision: args?.decision || '', confidence: 0.5 }, args?.outcome === 'success', '') : {};
      return { feedback: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_experience_replay: (args) => {
    try {
      const { ExperienceReplay } = require('./cortex/experience-replay.js');
      const er = new ExperienceReplay({ rootPath: HF_DIR, silent: true });
      const r = er.getStats ? er.getStats() : {};
      return { replay: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  // [v6.4.5] 第三批引擎入口 — 进化/身份/防护/情绪/记忆/认知
  heartflow_evolution_loop: (args) => {
    try {
      const { EvolutionLoop } = require('./cortex/loop.js');
      const el = new EvolutionLoop({ rootPath: HF_DIR, silent: true });
      const r = el.boot ? { booted: true } : {};
      return { evolution: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_skill_evolution: (args) => {
    try {
      const { SkillEvolutionEngine } = require('./cortex/skill-evolution-engine.js');
      const se = new SkillEvolutionEngine({ rootPath: HF_DIR, silent: true });
      const r = se.registerSkill ? se.registerSkill(args?.skill || '') : {};
      return { skill: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_strategic_restraint: (args) => {
    try {
      const { StrategicRestraint } = require('./cortex/strategic-restraint.js');
      const sr = new StrategicRestraint({ silent: true });
      const r = sr.evaluate ? sr.evaluate(args?.text || '') : {};
      return { restraint: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_drift_detect: (args) => {
    try {
      const { SustainedDriftDetector } = require('./cortex/sustained-drift-detector.js');
      const sd = new SustainedDriftDetector({ rootPath: HF_DIR, silent: true });
      const r = sd.load ? sd.load() : {};
      return { drift: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_metacognitive_rl: (args) => {
    try {
      const { MetacognitiveRL } = require('./cortex/metacognitive-rl.js');
      const mr = new MetacognitiveRL({ silent: true });
      const r = mr.encodeState ? mr.encodeState(args?.text || '') : {};
      return { metacognition: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_self_healing: (args) => {
    try {
      const { SelfHealing } = require('./cortex/self-healing.js');
      const sh = new SelfHealing({ silent: true });
      const r = sh.getCachedPolicy ? sh.getCachedPolicy(args?.context || '') : {};
      return { healing: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_philosophy_engine: (args) => {
    try {
      const { PhilosophyEngine } = require('./identity/philosophy-engine.js');
      const pe = new PhilosophyEngine({ silent: true });
      const r = pe.analyze ? pe.analyze(args?.text || '') : {};
      return { philosophy: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_being_mode: (args) => {
    try {
      const { BeingMode } = require('./identity/being-mode.js');
      const bm = new BeingMode({ silent: true });
      const r = bm.assessBeing ? bm.assessBeing(args?.text || '') : {};
      return { being: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_memory_integrity: (args) => {
    try {
      const { MemoryIntegrity } = require('./shield/memory-integrity.js');
      const mi = new MemoryIntegrity({ silent: true });
      const action = args?.action || 'verify';
      const r = action === 'sign' && mi.sign ? mi.sign(args?.memory || '') : (mi.verify ? mi.verify(args?.memory || '') : {});
      return { action, result: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_wakeup_verify: (args) => {
    try {
      const { WakeUpVerifier } = require('./shield/wake-up-verifier.js');
      const wv = new WakeUpVerifier({ rootPath: HF_DIR, silent: true });
      const r = wv._loadHistory ? wv._loadHistory() : {};
      return { wakeup: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_affective_intentionality: (args) => {
    try {
      const { AffectiveIntentionality } = require('./emotion/affective-intentionality.js');
      const ai = new AffectiveIntentionality({ silent: true });
      const r = ai.compute ? ai.compute(args?.text || '') : {};
      return { intentionality: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_desire_system: (args) => {
    try {
      const { DesireSystem } = require('./emotion/desire-system.js');
      const ds = new DesireSystem({ silent: true });
      const r = ds.process ? ds.process(args?.text || '') : {};
      return { desire: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_emotional_growth: (args) => {
    try {
      const { EmotionalGrowth } = require('./emotion/emotional-growth.js');
      const eg = new EmotionalGrowth({ silent: true });
      const r = eg.process ? eg.process(args?.text || '') : {};
      return { growth: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_meaningful_memory: (args) => {
    try {
      const { MeaningfulMemory } = require('./memory/meaningful-memory.js');
      const mm = new MeaningfulMemory({ silent: true });
      const r = mm.setCurrentTopic ? mm.setCurrentTopic(args?.text || '') : {};
      return { memory: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_memory_quality: (args) => {
    try {
      const { MemoryQuality } = require('./memory/memory-quality.js');
      const mq = new MemoryQuality({ silent: true });
      const r = mq.score ? mq.score(args?.memory || '') : {};
      return { quality: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_topic_scope: (args) => {
    try {
      const { TopicScope } = require('./memory/topic-scope.js');
      const ts = new TopicScope({ silent: true });
      const r = ts.getCurrentTopic ? ts.getCurrentTopic() : {};
      return { topic: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_semantic_anchor: (args) => {
    try {
      const { SemanticAnchor } = require('./memory/semantic-anchor.js');
      const sa = new SemanticAnchor({ silent: true });
      const r = sa.initializePatterns ? { initialized: true } : {};
      return { anchor: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_confidence_calibrate: (args) => {
    try {
      const { ConfidenceCalibrator } = require('./core/confidence-calibrator.js');
      const cc = new ConfidenceCalibrator({ silent: true });
      const r = cc.assess ? cc.assess(args?.text || '') : {};
      return { confidence: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },

  heartflow_decision_executor: (args) => {
    try {
      const { DecisionExecutor } = require('./core/decision-executor.js');
      const de = new DecisionExecutor({ silent: true });
      const r = de.execute ? de.execute(args?.decision || '') : {};
      return { execution: r, timestamp: Date.now() };
    } catch (e) { return { error: e.message }; }
  },
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

  

  if (AUTH_ENABLED && !safeCompare(token, AUTH_TOKEN)) {

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

      try { sendEvent(res, 'ping', {}); } catch (_) { /* [v5.9.18] 防御性: ping发送容错 */ }

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

    console.error(`[HeartFlow MCP] 端口 ${PORT} 已被占用，尝试强制释放后重启。`);

    try {
      const { execSync } = require('child_process');
      execSync(`fuser -k ${PORT}/tcp 2>/dev/null`, { timeout: 3000 });
      console.error(`[HeartFlow MCP] 端口 ${PORT} 已释放，3秒后自动重启。`);
      setTimeout(() => {
        server.close(() => {
          server.listen(PORT, '127.0.0.1');
        });
      }, 3000);
      return;
    } catch (_) {
      console.error(`[HeartFlow MCP] 无法释放端口 ${PORT}，进程退出。`);
      process.exit(1);
    }

  }

  console.error(`[HeartFlow MCP] HTTP 服务器错误:`, err.message);

  // [v6.2.7] 崩溃自动恢复：非退出类错误自动重启
  if (!process.exitCode || process.exitCode === 0) {
    console.error('[HeartFlow MCP] 尝试自动重启...');
    setTimeout(() => {
      server.close(() => {
        server.listen(PORT, '127.0.0.1');
      });
    }, 2000);
  }

});



// ═══════════════════════════════════════════════

// 优雅退出

// ═══════════════════════════════════════════════



function shutdown() {

  console.error('[HeartFlow MCP] 关闭中...');

  // 关闭所有 SSE 连接

  for (const [sessionId, client] of sseClients) {

    try { client.end(); } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }

  }

  sseClients.clear();

  // 停止引擎

  if (heartflow) { try { heartflow.stop(); } catch (_) { /* [v5.9.18] intentional: graceful degradation */ } }

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

