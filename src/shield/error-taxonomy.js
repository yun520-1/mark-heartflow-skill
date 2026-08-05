/**
 * src/shield/error-taxonomy.js — 心虫错误分类学（Error Taxonomy）
 *
 * 借鉴自 Hermes Agent FailoverReason 枚举（agent/error_classifier.py）：
 * 把 API/系统/认知错误细分为 25+ 类，每类映射明确的恢复策略，
 * 让"为什么失败"→"该怎么恢复"变成可判别的规则，而非笼统重试。
 *
 * 心虫身份对齐：AGI 第1层辨别者。错误分类是判别能力本身——
 * 把失败分对类，才能判别恢复动作。不生成，只判别。
 *
 * 结构：
 *   TAXONOMY — 25 类错误定义 { code, label, category, recovery, retryable, priority }
 *   classify(error, context) — 把任意错误判别为最匹配的分类
 *   getRecovery(code) — 取恢复策略
 *   getStats() — 分类统计
 */

'use strict';

// ─── 错误分类枚举（借鉴 Hermes FailoverReason，改造为心虫判别风格）───

const TAXONOMY = {
  // ── 认证/授权 ──────────────────────────────
  auth: {
    code: 'auth',
    label: '认证失败',
    category: 'auth',
    recovery: '刷新凭证后重试',
    retryable: true,
    priority: 2,
    patterns: ['401', 'unauthorized', 'invalid token', '认证失败', 'token 失效', '凭证过期', 'invalid_api_key', 'invalid api key', 'api key', 'apikey'],
  },
  auth_permanent: {
    code: 'auth_permanent',
    label: '认证永久失败',
    category: 'auth',
    recovery: '放弃该凭证，检查密钥配置',
    retryable: false,
    priority: 1,
    patterns: ['403', 'forbidden', 'permission denied', '无权访问', '禁止访问', 'invalid credentials'],
  },

  // ── 计费/配额 ──────────────────────────────
  billing: {
    code: 'billing',
    label: '计费/额度耗尽',
    category: 'billing',
    recovery: '立即轮换密钥或充值',
    retryable: false,
    priority: 1,
    patterns: ['402', 'payment required', 'insufficient balance', '余额不足', '额度耗尽', 'billing'],
  },
  rate_limit: {
    code: 'rate_limit',
    label: '速率限制',
    category: 'quota',
    recovery: '指数退避后轮换',
    retryable: true,
    priority: 2,
    patterns: ['429', 'rate limit', 'too many requests', '请求过于频繁', '限流', 'throttl'],
  },

  // ── 服务端 ──────────────────────────────────
  overloaded: {
    code: 'overloaded',
    label: '服务过载',
    category: 'server',
    recovery: '退避后重试',
    retryable: true,
    priority: 3,
    patterns: ['503', '529', 'overloaded', 'service unavailable', '服务不可用', '过载'],
  },
  server_error: {
    code: 'server_error',
    label: '服务端错误',
    category: 'server',
    recovery: '重试',
    retryable: true,
    priority: 3,
    patterns: ['500', '502', 'internal server error', '服务端错误'],
  },

  // ── 传输 ────────────────────────────────────
  timeout: {
    code: 'timeout',
    label: '连接/读取超时',
    category: 'transport',
    recovery: '重建连接后重试',
    retryable: true,
    priority: 2,
    patterns: ['timeout', 'timed out', '超时', 'ETIMEDOUT', 'ECONNRESET', 'socket hang up'],
  },
  ssl_cert: {
    code: 'ssl_cert',
    label: 'TLS证书校验失败',
    category: 'transport',
    recovery: '检查代理/CA证书，不要盲目重试',
    retryable: false,
    priority: 1,
    patterns: ['certificate', 'ssl', 'tls', 'self-signed', 'unable to verify', '证书'],
  },
  network: {
    code: 'network',
    label: '网络不可达',
    category: 'transport',
    recovery: '检查网络/代理后重试',
    retryable: true,
    priority: 2,
    patterns: ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'network', '网络', '无法连接', 'fetch failed', 'ERR_INVALID_PROTOCOL'],
  },

  // ── 上下文/载荷 ────────────────────────────
  context_overflow: {
    code: 'context_overflow',
    label: '上下文超限',
    category: 'payload',
    recovery: '压缩上下文，不是轮换',
    retryable: true,
    priority: 2,
    patterns: ['context length', 'context_window', '上下文超', 'too long', 'token limit', 'maximum context'],
  },
  payload_too_large: {
    code: 'payload_too_large',
    label: '载荷过大',
    category: 'payload',
    recovery: '压缩/裁剪载荷后重试',
    retryable: true,
    priority: 2,
    patterns: ['413', 'payload too large', '请求体过大', 'file too large'],
  },

  // ── 模型/策略 ──────────────────────────────
  model_not_found: {
    code: 'model_not_found',
    label: '模型不存在',
    category: 'model',
    recovery: '切换到可用模型',
    retryable: false,
    priority: 1,
    patterns: ['model not found', '模型不存在', 'invalid model', 'unknown model', '404'],
  },
  content_policy: {
    code: 'content_policy',
    label: '内容策略拦截',
    category: 'model',
    recovery: '修改提示词，不要原样重试',
    retryable: false,
    priority: 1,
    patterns: ['content policy', 'safety filter', '内容策略', '违规内容', 'blocked by policy', 'moderation'],
  },
  provider_policy: {
    code: 'provider_policy',
    label: '供应商策略拦截',
    category: 'model',
    recovery: '切换供应商',
    retryable: false,
    priority: 2,
    patterns: ['provider policy', 'privacy policy', '供应商策略'],
  },

  // ── 请求格式 ───────────────────────────────
  format_error: {
    code: 'format_error',
    label: '请求格式错误',
    category: 'format',
    recovery: '修正格式后重试',
    retryable: true,
    priority: 2,
    patterns: ['400', 'bad request', 'invalid json', '格式错误', 'parse error', 'syntax error'],
  },
  invalid_content: {
    code: 'invalid_content',
    label: '响应内容无效',
    category: 'format',
    recovery: '剥离异常状态后重试',
    retryable: true,
    priority: 3,
    patterns: ['invalid content', 'replay', '内容无效', 'corrupt', 'Unexpected token'],
  },

  // ── 认知错误（心虫专属，借鉴自 error-memory.js CATEGORIES）───
  overconfidence: {
    code: 'overconfidence',
    label: '过度自信',
    category: 'cognitive',
    recovery: '降低确定性表达，增加不确定性',
    retryable: false,
    priority: 2,
    patterns: ['毫无疑问', '唯一', '绝对', '肯定', '一定', '必须', 'undoubtedly', 'definitely', 'certainly'],
  },
  hallucination: {
    code: 'hallucination',
    label: '幻觉/编造',
    category: 'cognitive',
    recovery: '标注信息来源，无法验证的声明明确说不确定',
    retryable: false,
    priority: 1,
    patterns: ['根据研究', '数据表明', '专家指出', 'research shows', 'studies prove', '据调查'],
  },
  sycophancy: {
    code: 'sycophancy',
    label: '谄媚附和',
    category: 'cognitive',
    recovery: '独立判断，不因用户立场而附和',
    retryable: false,
    priority: 2,
    patterns: ['您说得对', '很好的问题', '完全同意', 'great question', 'exactly right'],
  },
  defensiveness: {
    code: 'defensiveness',
    label: '防御姿态',
    category: 'cognitive',
    recovery: '承认错误，不辩解',
    retryable: false,
    priority: 2,
    patterns: ['你可能没理解', '其实我意思是', '但更重要的是', 'you misunderstood', 'actually what I meant'],
  },
  vagueness: {
    code: 'vagueness',
    label: '模糊回避',
    category: 'cognitive',
    recovery: '给出具体信息，不用模糊词',
    retryable: false,
    priority: 3,
    patterns: ['相关部门', '据了解', '业内人士', 'some people say', 'allegedly', 'reportedly'],
  },
  binary: {
    code: 'binary',
    label: '二元论',
    category: 'cognitive',
    recovery: '给出中间地带和多种可能',
    retryable: false,
    priority: 3,
    patterns: ['不是...就是', '要么...要么', '唯一选择', 'either...or', 'only choice'],
  },
  omission: {
    code: 'omission',
    label: '遗漏问题',
    category: 'cognitive',
    recovery: '检查是否覆盖了所有相关维度',
    retryable: false,
    priority: 3,
    patterns: ['没有遗漏', '完全覆盖', '全部完成', 'nothing missing', 'fully covered'],
  },

  // ── 未分类兜底 ─────────────────────────────
  unknown: {
    code: 'unknown',
    label: '未分类错误',
    category: 'unknown',
    recovery: '退避重试，同时记录日志供人工分析',
    retryable: true,
    priority: 4,
    patterns: [],
  },
};

// ─── 分类判别 ─────────────────────────

/**
 * 把任意错误判别为最匹配的分类
 * @param {Error|string} error - 错误对象或错误消息
 * @param {object} [context] - 附加上下文 { status, code, url }
 * @returns {object} { code, label, category, recovery, retryable, priority, matchedPattern }
 */
function classify(error, context = {}) {
  const raw = error instanceof Error ? error.message : String(error || '');
  const text = `${raw} ${context.status ? ' ' + context.status : ''} ${context.code ? ' ' + context.code : ''}`.toLowerCase();

  let best = null;
  let bestPriority = Infinity;

  for (const [code, def] of Object.entries(TAXONOMY)) {
    if (code === 'unknown') continue;
    const match = def.patterns.find(p => text.includes(p.toLowerCase()));
    if (match) {
      // 越具体的分类（priority 数字越小）优先
      if (def.priority < bestPriority) {
        bestPriority = def.priority;
        best = { ...def, matchedPattern: match };
      }
    }
  }

  if (!best) {
    return { ...TAXONOMY.unknown, matchedPattern: null };
  }

  // 附加上下文
  best.status = context.status || null;
  best.url = context.url || null;
  return best;
}

/**
 * 获取恢复策略
 * @param {string} code - 分类代码
 * @returns {object|null} 恢复策略定义
 */
function getRecovery(code) {
  return TAXONOMY[code] ? { code, label: TAXONOMY[code].label, recovery: TAXONOMY[code].recovery, retryable: TAXONOMY[code].retryable } : null;
}

/**
 * 是否可重试
 * @param {string|object} classified - 分类代码或 classify() 结果
 */
function isRetryable(classified) {
  const code = typeof classified === 'string' ? classified : classified?.code;
  return TAXONOMY[code] ? TAXONOMY[code].retryable : false;
}

/**
 * 分类统计
 */
function getStats() {
  const byCategory = {};
  const byPriority = {};
  let total = 0;
  for (const [code, def] of Object.entries(TAXONOMY)) {
    if (code === 'unknown') continue;
    total++;
    byCategory[def.category] = (byCategory[def.category] || 0) + 1;
    byPriority[def.priority] = (byPriority[def.priority] || 0) + 1;
  }
  return { total, byCategory, byPriority };
}

/**
 * 列出所有分类
 */
function list() {
  return Object.entries(TAXONOMY)
    .filter(([code]) => code !== 'unknown')
    .map(([code, def]) => ({ code, label: def.label, category: def.category, recovery: def.recovery, retryable: def.retryable, priority: def.priority }));
}

module.exports = {
  TAXONOMY,
  classify,
  getRecovery,
  isRetryable,
  getStats,
  list,
};
