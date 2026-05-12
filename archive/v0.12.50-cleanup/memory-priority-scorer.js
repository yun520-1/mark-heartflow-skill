/**
 * memory-priority-scorer.js
 * 
 * v11.24.017: 记忆优先级评分系统
 * 基于 Memory in the Age of AI Agents Survey (arXiv:2512.13564) 和 Memory OS (ACL Anthology 2025)
 * 
 * 灵感来源：
 * - Memory OS: 操作系统式记忆管理，优先级驱动
 * - A-Mem (NeurIPS 2025): 基于访问频率和时效性的记忆评分
 * - MemTensor/HaluMem: 记忆真实性评估
 * 
 * 评分维度：
 * 1. recency (时效性) - 最近更新的记忆更重要
 * 2. accessCount (访问频率) - 频繁访问的记忆更重要
 * 3. importance (内在重要性) - 决策类 > 问题类 > 摘要类
 * 4. truthfulness (真实性指标) - 标记可信度
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'context-manager');
const PRIORITY_FILE = path.join(DATA_DIR, 'memory-priority.json');

// 评分权重配置
const WEIGHTS = {
  recency: 0.3,      // 时效性权重
  accessCount: 0.35, // 访问频率权重
  importance: 0.25,  // 重要性权重
  truthfulness: 0.1, // 真实性权重
};

// 记忆类型优先级映射
const TYPE_PRIORITY = {
  decision: 100,   // 决策类最高
  problem: 80,     // 问题类次之
  lesson: 90,      // 教训类重要
  core_directive: 95, // 核心指令最重要
  version: 40,
  git: 30,
  command: 20,
  path: 15,
  summary: 10,
};

// 状态
let _priorityCache = {};
let _initialized = false;

// ============================================================
// 初始化
// ============================================================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPriorityCache() {
  ensureDataDir();
  try {
    if (fs.existsSync(PRIORITY_FILE)) {
      _priorityCache = JSON.parse(fs.readFileSync(PRIORITY_FILE, 'utf8'));
    }
  } catch {}
  _initialized = true;
}

function savePriorityCache() {
  try {
    fs.writeFileSync(PRIORITY_FILE, JSON.stringify(_priorityCache, null, 2));
  } catch {}
}

// ============================================================
// 核心评分算法
// ============================================================

/**
 * 计算单条记忆的综合优先级分数
 * @param {object} memory - 记忆对象
 * @param {number} now - 当前时间戳
 * @returns {number} 0-100 的优先级分数
 */
function calculatePriorityScore(memory, now = Date.now()) {
  if (!_initialized) loadPriorityCache();

  const cacheKey = memory.id || `${memory.sessionId}_${memory.timestamp}`;
  
  // 检查缓存（5分钟内有效）
  if (_priorityCache[cacheKey] && 
      now - _priorityCache[cacheKey].updated < 5 * 60 * 1000) {
    return _priorityCache[cacheKey].score;
  }

  // 1. 时效性评分 (0-100)
  // 24小时内为满分，之后线性衰减
  const ageHours = (now - memory.timestamp) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 100 - ageHours * 2);

  // 2. 访问频率评分 (0-100)
  // 累计访问次数的对数映射
  const accessCount = memory.accessCount || _getAccessCount(cacheKey);
  const accessScore = Math.min(100, Math.log2(accessCount + 1) * 20);

  // 3. 内在重要性评分 (0-100)
  const basePriority = TYPE_PRIORITY[memory.type] || 30;
  const importanceBonus = memory.metadata?.priority_boost || 0;
  const importanceScore = Math.min(100, basePriority + importanceBonus);

  // 4. 真实性评分 (0-100)
  // 来自验证的记忆有更高真实性分数
  const verified = memory.metadata?.verified || false;
  const selfReported = memory.metadata?.source === 'self-reflection';
  const truthfulnessScore = verified ? 100 : (selfReported ? 60 : 40);

  // 加权求和
  const totalScore = (
    recencyScore * WEIGHTS.recency +
    accessScore * WEIGHTS.accessCount +
    importanceScore * WEIGHTS.importance +
    truthfulnessScore * WEIGHTS.truthfulness
  );

  // 缓存结果
  _priorityCache[cacheKey] = {
    score: Math.round(totalScore * 100) / 100,
    updated: now,
  };

  return totalScore;
}

/**
 * 获取记忆访问计数
 */
function _getAccessCount(cacheKey) {
  return _priorityCache[cacheKey]?.accessCount || 0;
}

/**
 * 记录记忆访问
 */
function recordAccess(memoryId, sessionId, timestamp) {
  if (!_initialized) loadPriorityCache();
  
  const cacheKey = memoryId;
  if (!_priorityCache[cacheKey]) {
    _priorityCache[cacheKey] = { accessCount: 0, updated: Date.now() };
  }
  _priorityCache[cacheKey].accessCount = 
    (_priorityCache[cacheKey].accessCount || 0) + 1;
  _priorityCache[cacheKey].updated = Date.now();
  savePriorityCache();
}

/**
 * 批量计算记忆优先级
 */
function scoreMemories(memories, now = Date.now()) {
  if (!memories || memories.length === 0) return [];
  
  return memories.map(m => ({
    ...m,
    _priorityScore: calculatePriorityScore(m, now),
  })).sort((a, b) => b._priorityScore - a._priorityScore);
}

/**
 * 获取高优先级记忆（用于上下文注入）
 */
function getTopPriorityMemories(memories, count = 10, now = Date.now()) {
  const scored = scoreMemories(memories, now);
  return scored.slice(0, count);
}

/**
 * 获取记忆优先级统计
 */
function getPriorityStats() {
  if (!_initialized) loadPriorityCache();
  
  const scores = Object.values(_priorityCache)
    .filter(c => c.score !== undefined)
    .map(c => c.score);
  
  if (scores.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0 };
  }
  
  return {
    count: scores.length,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
    min: Math.min(...scores),
    max: Math.max(...scores),
  };
}

// 初始化
loadPriorityCache();

module.exports = {
  calculatePriorityScore,
  recordAccess,
  scoreMemories,
  getTopPriorityMemories,
  getPriorityStats,
  WEIGHTS,
  TYPE_PRIORITY,
};
