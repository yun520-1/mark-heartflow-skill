/**
 * access-pattern-tracker.js
 * 
 * v11.24.017: 记忆访问模式追踪器
 * 基于 Memory in the Age of AI Agents Survey (arXiv:2512.13564)
 * 
 * 灵感来源：
 * - A-Mem: Agentic Memory for LLM Agents (NeurIPS 2025)
 * - karta: An agentic memory system that thinks (GitHub 2026)
 * 
 * 功能：
 * 1. 追踪用户查询模式
 * 2. 识别高频查询关键词
 * 3. 预测用户意图
 * 4. 优化记忆预取策略
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'context-manager');
const PATTERNS_FILE = path.join(DATA_DIR, 'access-patterns.json');

// 状态
let _patterns = {
  queryKeywords: {},    // 关键词频率
  queryTypes: {},      // 查询类型统计
  timePatterns: [],    // 时间模式
  lastQueries: [],     // 最近查询（用于去重）
};
let _initialized = false;

// 每次会话最多记录最近50条查询
const MAX_RECENT_QUERIES = 50;

const QUERY_TYPE_KEYWORDS = {
  version: ['版本', 'version', 'v11', '升级'],
  workflow: ['工作流', 'workflow', '流程', '步骤'],
  problem: ['问题', 'bug', '错误', '失败', '修复'],
  decision: ['决定', '选择', '采用', '决策'],
  project: ['项目', 'project', '代码', '文件'],
  user: ['用户', 'user', '偏好', '习惯'],
};

// ============================================================
// 初始化
// ============================================================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPatterns() {
  ensureDataDir();
  try {
    if (fs.existsSync(PATTERNS_FILE)) {
      _patterns = JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf8'));
    }
  } catch {}
  _initialized = true;
}

function savePatterns() {
  try {
    fs.writeFileSync(PATTERNS_FILE, JSON.stringify(_patterns, null, 2));
  } catch {}
}

// ============================================================
// 核心功能
// ============================================================

/**
 * 记录一次查询
 */
function recordQuery(query, context = {}) {
  if (!_initialized) loadPatterns();
  
  const normalized = query.toLowerCase().trim();
  
  // 避免重复记录（10秒内的相同查询）
  const recent = _patterns.lastQueries.slice(-5);
  if (recent.some(q => q.query === normalized && Date.now() - q.time < 10000)) {
    return;
  }

  // 记录到最近查询
  _patterns.lastQueries.push({
    query: normalized,
    time: Date.now(),
    type: detectQueryType(query),
  });
  
  // 保持队列长度
  if (_patterns.lastQueries.length > MAX_RECENT_QUERIES) {
    _patterns.lastQueries = _patterns.lastQueries.slice(-MAX_RECENT_QUERIES);
  }

  // 提取关键词
  const keywords = extractKeywords(query);
  keywords.forEach(kw => {
    _patterns.queryKeywords[kw] = (_patterns.queryKeywords[kw] || 0) + 1;
  });

  // 记录查询类型
  const queryType = detectQueryType(query);
  _patterns.queryTypes[queryType] = (_patterns.queryTypes[queryType] || 0) + 1;

  // 记录时间模式
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const timeKey = `h${hour}_d${dayOfWeek}`;
  _patterns.timePatterns.push(timeKey);

  // 只保留最近1000个时间模式
  if (_patterns.timePatterns.length > 1000) {
    _patterns.timePatterns = _patterns.timePatterns.slice(-1000);
  }

  savePatterns();
}

/**
 * 提取查询关键词
 */
function extractKeywords(query) {
  const keywords = [];
  const normalized = query.toLowerCase();
  
  // 英文词
  const englishWords = normalized.match(/[a-z]{3,}/g) || [];
  keywords.push(...englishWords);
  
  // 中文词（2字以上）
  const chineseWords = normalized.match(/[\u4e00-\u9fff]{2,}/g) || [];
  keywords.push(...chineseWords);
  
  return [...new Set(keywords)];
}

/**
 * 检测查询类型
 */
function detectQueryType(query) {
  const normalized = query.toLowerCase();
  
  for (const [type, keywords] of Object.entries(QUERY_TYPE_KEYWORDS)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      return type;
    }
  }
  
  return 'general';
}

/**
 * 获取高频关键词
 */
function getTopKeywords(count = 10) {
  if (!_initialized) loadPatterns();
  
  return Object.entries(_patterns.queryKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([keyword, count]) => ({ keyword, count }));
}

/**
 * 获取查询类型分布
 */
function getQueryTypeDistribution() {
  if (!_initialized) loadPatterns();
  
  const total = Object.values(_patterns.queryTypes).reduce((a, b) => a + b, 0) || 1;
  
  return Object.entries(_patterns.queryTypes)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round(count / total * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 预测用户意图（基于最近查询）
 */
function predictIntent(currentQuery) {
  if (!_initialized) loadPatterns();
  
  const recent = _patterns.lastQueries.slice(-10);
  const keywords = extractKeywords(currentQuery);
  
  // 查找相似的高频查询模式
  const suggestions = [];
  
  keywords.forEach(kw => {
    const related = Object.entries(_patterns.queryKeywords)
      .filter(([k]) => k !== kw && (k.includes(kw) || kw.includes(k)))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k);
    
    suggestions.push(...related);
  });
  
  return {
    currentType: detectQueryType(currentQuery),
    topKeywords: getTopKeywords(5),
    relatedSuggestions: [...new Set(suggestions)].slice(0, 5),
  };
}

/**
 * 获取访问模式统计
 */
function getPatternStats() {
  if (!_initialized) loadPatterns();
  
  const now = Date.now();
  const recentQueries = _patterns.lastQueries.filter(q => now - q.time < 24 * 60 * 60 * 1000);
  
  return {
    totalQueries: Object.values(_patterns.queryKeywords).reduce((a, b) => a + b, 0),
    recentQueries24h: recentQueries.length,
    uniqueKeywords: Object.keys(_patterns.queryKeywords).length,
    topTypes: getQueryTypeDistribution().slice(0, 3),
  };
}

// 初始化
loadPatterns();

module.exports = {
  recordQuery,
  detectQueryType,
  getTopKeywords,
  getQueryTypeDistribution,
  predictIntent,
  getPatternStats,
  QUERY_TYPE_KEYWORDS,
};
