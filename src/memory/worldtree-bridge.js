/**
 * WorldTreeBridge — 心虫调用外部 World Tree 记忆系统的适配层
 * 
 * 提供 4 个 dispatch 路由：
 *   worldtree.search(query)       — 全文搜索
 *   worldtree.store(category, content, opts) — 存入知识
 *   worldtree.query(category)    — 按分类查询最近条目
 *   worldtree.status()           — 数据库健康状态
 * 
 * 存储后端：纯 JSON 文件（无外部依赖，自包含）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.env.HERMES_DATA || path.join(__dirname, '../../data'), 'worldtree');
const DB_PATH  = path.join(DATA_DIR, 'worldtree.json');

// ─── 7 分类映射（World Tree 分类 ID → 中文标签）──────────────────────────────

const CATEGORIES = {
  'ecommerce:sourcing':   '选品库',
  'ecommerce:platform':   '平台分析',
  'project:tracking':     '项目进度',
  'knowledge:solutions':  '问题库',
  'workflow:procedures':  '流程库',
  'knowledge:general':    '知识库',
  'session:snapshots':    '会话快照',
};

// 允许的分类 ID 白名单
const VALID_CATEGORIES = new Set(Object.keys(CATEGORIES));

// ─── 存储层（JSON 文件）───────────────────────────────────────────────────────

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    return { chunks: [], accessLog: [], meta: {} };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return {
      chunks: data.chunks || [],
      accessLog: data.accessLog || [],
      meta: data.meta || {},
    };
  } catch (e) {
    // 文件损坏，返回空库
    return { chunks: [], accessLog: [], meta: {} };
  }
}

function saveDb(db) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ─── 工具函数 ───────────────────────────────────────────────────────────────

function generateId(prefix = 'wt') {
  const ts = Date.now().toString(36);
  const rnd = crypto.randomBytes(3).toString('hex');
  return `${prefix}_${ts}_${rnd}`;
}

function now() { return Date.now(); }

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}

// ─── 核心 API ────────────────────────────────────────────────────────────────

/**
 * 全文搜索
 * @param {string} query — 搜索关键词
 * @returns {Object} {success, results, count}
 */
function search(query) {
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'query 必须是非空字符串', results: [], count: 0 };
  }
  const db = loadDb();
  const q = query.toLowerCase();
  const results = db.chunks
    .filter(c => {
      const hay = `${c.title || ''} ${c.content} ${c.tags.join(' ')} ${c.category}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (b.accessed_at || 0) - (a.accessed_at || 0))
    .slice(0, 20);

  // 记录访问日志
  for (const r of results) {
    r.accessed_at = now();
    db.accessLog.push({ chunk_id: r.id, accessed_at: r.accessed_at, hit_rank: 0 });
  }
  saveDb(db);

  return {
    success: true,
    results: results.map(c => ({
      id: c.id,
      category: c.category,
      categoryLabel: CATEGORIES[c.category] || c.category,
      title: c.title,
      content: c.content,
      tags: c.tags,
      accessed_at: c.accessed_at,
      created_at: c.created_at,
    })),
    count: results.length,
  };
}

/**
 * 存入知识
 * @param {string} category — 分类 ID（见 CATEGORIES）
 * @param {string} content — 内容
 * @param {Object} opts — {title, tags, source, realm, quality}
 * @returns {Object} {success, id, category}
 */
function store(category, content, opts = {}) {
  if (!category || typeof category !== 'string') {
    return { success: false, error: 'category 必填' };
  }
  if (!VALID_CATEGORIES.has(category)) {
    return { success: false, error: `无效分类: ${category}. 允许: ${[...VALID_CATEGORIES].join(', ')}` };
  }
  if (!content || typeof content !== 'string') {
    return { success: false, error: 'content 必填' };
  }

  const db = loadDb();
  const id = generateId('wt');
  const ts = now();
  const chunk = {
    id,
    category,
    title: opts.title || null,
    content,
    tags: normalizeTags(opts.tags),
    source: opts.source || null,
    leaf_id: opts.leaf_id || null,
    realm: opts.realm || 'midgard',
    quality: typeof opts.quality === 'number' ? opts.quality : 1.0,
    accessed_at: 0,
    created_at: ts,
    updated_at: ts,
  };
  db.chunks.push(chunk);
  saveDb(db);

  return { success: true, id, category, categoryLabel: CATEGORIES[category] };
}

/**
 * 按分类查询最近条目
 * @param {string} category — 分类 ID
 * @param {number} limit — 返回数量（默认 10）
 * @returns {Object} {success, results, count}
 */
function query(category, limit = 10) {
  if (!category || typeof category !== 'string') {
    return { success: false, error: 'category 必填', results: [], count: 0 };
  }
  if (!VALID_CATEGORIES.has(category)) {
    return { success: false, error: `无效分类: ${category}`, results: [], count: 0 };
  }
  const db = loadDb();
  const results = db.chunks
    .filter(c => c.category === category)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);

  return {
    success: true,
    results: results.map(c => ({
      id: c.id,
      title: c.title,
      content: c.content,
      tags: c.tags,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    count: results.length,
  };
}

/**
 * 数据库健康状态
 * @returns {Object} {ok, totalChunks, categories, dbPath, storage}
 */
function status() {
  const db = loadDb();
  const catCount = {};
  for (const c of db.chunks) {
    catCount[c.category] = (catCount[c.category] || 0) + 1;
  }
  return {
    ok: true,
    totalChunks: db.chunks.length,
    categories: catCount,
    dbPath: DB_PATH,
    storage: 'json',
  };
}

// ─── 路由导出（供心虫 dispatch 调用）───────────────────────────────────────────

const ROUTES = {
  'worldtree.search': search,
  'worldtree.store':  store,
  'worldtree.query':  query,
  'worldtree.status': status,
};

module.exports = { ROUTES, CATEGORIES, VALID_CATEGORIES };
