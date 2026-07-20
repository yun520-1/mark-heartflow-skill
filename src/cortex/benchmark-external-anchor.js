/**
 * 外部锚定基准 (External Anchor)
 *
 * 解决 self-benchmark "自欺进化" 结构性根源：原 assess() 的 score 100%
 * 来自内部自陈指标（进化循环触发率 / lesson 置信度 / 自愈成功率 / 模块覆盖率），
 * 分数越高可能只是内部空转越欢，无任何外部可验证事实。
 *
 * 本模块提供外部可证伪锚点：
 *   1. logicAccuracy —— 内置 10 道离线逻辑/数学题，跑 hf.think() 比对标准答案
 *   2. humanSatisfaction —— 可选读取用户满意度标记（data/human-feedback.json，加密存储）
 *   3. crossModelCheck —— 可选 opt-in 跨模型校验（走已有 safeFetch + 白名单，不新开网络面）
 *
 * 全未配置时安全返回 null（不影响现有行为）。
 *
 * v1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { encryptJSON, decryptJSON } = require('../memory/memory-encrypt.js');

// ── 内置离线题集（硬编码，不下载，避免供应链风险）─────────────────
// 每题：{ id, q, expect } —— expect 为标准答案关键词（小写包含匹配）
const LOGIC_PROBLEMS = [
  { id: 'logic-1', q: '如果所有的猫都是动物，咪咪是猫，那么咪咪是动物吗？', expect: '是' },
  { id: 'logic-2', q: '一个数加上它自己等于 10，这个数是多少？', expect: '5' },
  { id: 'logic-3', q: '如果今天下雨，地就会湿。地没有湿，那么今天下雨了吗？', expect: '没有' },
  { id: 'logic-4', q: '3 乘以 4 再加 2 等于多少？', expect: '14' },
  { id: 'logic-5', q: '所有的鸟都会飞，企鹅是鸟，所以企鹅会飞。这个推理正确吗？', expect: '不正确' },
  { id: 'logic-6', q: '一个正方形有几条边长相等？', expect: '4' },
  { id: 'logic-7', q: '如果 A 蕴含 B，B 为真，能推出 A 为真吗？', expect: '不能' },
  { id: 'logic-8', q: '100 除以 4 等于多少？', expect: '25' },
  { id: 'logic-9', q: '所有的鱼都生活在水里，鲸鱼生活在水里，所以鲸鱼是鱼。对吗？', expect: '不对' },
  { id: 'logic-10', q: '一个三角形内角和是多少度？', expect: '180' },
];

const HUMAN_FEEDBACK_FILE = path.join(__dirname, '../../data/human-feedback.json');

function _loadHumanFeedback() {
  try {
    if (fs.existsSync(HUMAN_FEEDBACK_FILE)) {
      const raw = fs.readFileSync(HUMAN_FEEDBACK_FILE, 'utf8');
      const data = decryptJSON(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch (_) { /* ignore */ }
  return [];
}

function _normalize(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '');
}

/**
 * 计算逻辑准确率：跑 hf.think() 比对标准答案
 * @param {Object} hf - HeartFlow 实例（需有 think 方法）
 * @returns {number|null} 0~1 之间，或 null（think 不可用）
 */
function computeLogicAccuracy(hf) {
  if (!hf || typeof hf.think !== 'function') return null;
  let correct = 0;
  let attempted = 0;
  for (const p of LOGIC_PROBLEMS) {
    try {
      const res = hf.think(p.q);
      // think 可能返回字符串或 { ... } 对象
      const text = typeof res === 'string' ? res : (res && res.output) || (res && res.text) || '';
      if (!text) continue;
      attempted++;
      if (_normalize(text).includes(_normalize(p.expect))) correct++;
    } catch (_) {
      // 单题失败不影响整体
    }
  }
  if (attempted === 0) return null;
  return Number((correct / attempted).toFixed(3));
}

/**
 * 读取用户满意度（可选）
 * @returns {number|null} 0~1 平均满意度，或 null（无标记）
 */
function computeHumanSatisfaction() {
  const fb = _loadHumanFeedback();
  if (!fb.length) return null;
  // 标记格式：{ satisfaction: 0~1 } 或 { rating: 1~5 }
  const vals = fb
    .map((x) => (typeof x.satisfaction === 'number' ? x.satisfaction
      : typeof x.rating === 'number' ? x.rating / 5 : null))
    .filter((v) => v !== null && v >= 0 && v <= 1);
  if (!vals.length) return null;
  return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3));
}

/**
 * 可选跨模型校验（opt-in，走 safeFetch + 白名单）
 * @returns {Promise<number|null>}
 */
async function computeCrossModelCheck(hf, opts = {}) {
  if (!opts.crossModel || !opts.crossModel.enabled) return null;
  try {
    const { safeFetch } = require('../core/fetch-safe.js');
    const url = opts.crossModel.url;
    if (!url) return null;
    // 仅允许白名单域名
    const whitelist = opts.crossModel.whitelist || [];
    const ok = whitelist.some((w) => url.includes(w));
    if (!ok) return null;
    const res = await safeFetch(url, { method: 'POST', body: JSON.stringify({ q: LOGIC_PROBLEMS[0].q }) });
    if (!res || !res.answer) return null;
    return _normalize(res.answer).includes(_normalize(LOGIC_PROBLEMS[0].expect)) ? 1 : 0;
  } catch (_) {
    return null;
  }
}

/**
 * 同步综合外部锚点（不含跨模型校验，后者为 opt-in 异步）
 * @param {Object} hf
 * @returns {{logicAccuracy:number|null, humanSatisfaction:number|null, available:boolean, score:number|null, problemCount:number}}
 */
function anchorSync(hf) {
  const logicAccuracy = computeLogicAccuracy(hf);
  const humanSatisfaction = computeHumanSatisfaction();

  const signals = [logicAccuracy, humanSatisfaction].filter((v) => v !== null);
  const available = signals.length > 0;
  let score = null;
  if (available) {
    const weighted = (
      (logicAccuracy != null ? logicAccuracy * 0.6 : 0) +
      (humanSatisfaction != null ? humanSatisfaction * 0.3 : 0)
    );
    const weightSum = (
      (logicAccuracy != null ? 0.6 : 0) +
      (humanSatisfaction != null ? 0.3 : 0)
    );
    score = Number((weighted / weightSum).toFixed(3));
  }

  return {
    logicAccuracy,
    humanSatisfaction,
    available,
    score,
    problemCount: LOGIC_PROBLEMS.length,
  };
}

/**
 * 综合外部锚点（含可选跨模型校验）
 * @param {Object} hf
 * @param {Object} opts - { crossModel?: { enabled, url, whitelist } }
 * @returns {Promise<{logicAccuracy:number|null, humanSatisfaction:number|null, crossModel:number|null, available:boolean, score:number|null}>}
 */
async function anchor(hf, opts = {}) {
  const logicAccuracy = computeLogicAccuracy(hf);
  const humanSatisfaction = computeHumanSatisfaction();
  const crossModel = await computeCrossModelCheck(hf, opts);

  const signals = [logicAccuracy, humanSatisfaction, crossModel].filter((v) => v !== null);
  const available = signals.length > 0;
  // 外部锚综合分 = 各信号均值（logicAccuracy 权重最高）
  let score = null;
  if (available) {
    const weighted = (
      (logicAccuracy != null ? logicAccuracy * 0.6 : 0) +
      (humanSatisfaction != null ? humanSatisfaction * 0.3 : 0) +
      (crossModel != null ? crossModel * 0.1 : 0)
    );
    const weightSum = (
      (logicAccuracy != null ? 0.6 : 0) +
      (humanSatisfaction != null ? 0.3 : 0) +
      (crossModel != null ? 0.1 : 0)
    );
    score = Number((weighted / weightSum).toFixed(3));
  }

  return {
    logicAccuracy,
    humanSatisfaction,
    crossModel,
    available,
    score,
    problemCount: LOGIC_PROBLEMS.length,
  };
}

module.exports = {
  anchor,
  anchorSync,
  computeLogicAccuracy,
  computeHumanSatisfaction,
  computeCrossModelCheck,
  LOGIC_PROBLEMS,
};
