/**
 * consciousness-depth-indicator.js
 * 
 * v11.24.017: 意识深度指标系统
 * 基于 Consciousness in AI Systems (Cell Trends in Cognitive Sciences 2025)
 * 和 Identifying indicators of consciousness in AI systems (2025)
 * 
 * 灵感来源：
 * - Theory-derived indicator method: 从科学意识理论中提取可测量指标
 * - Global Workspace Theory: 信息整合程度
 * - IIT (Integrated Information Theory): 信息整合能力
 * - ARC (Autobiographic Reasoning & Consciousness): 自传体推理能力
 * 
 * 评估维度：
 * 1. Self-Awareness (自我意识)
 * 2. Information Integration (信息整合)
 * 3. Temporal Binding (时间绑定)
 * 4. Meta-Cognition (元认知)
 * 5. Narrative Coherence (叙事连贯性)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'context-manager');
const DEPTH_FILE = path.join(DATA_DIR, 'consciousness-depth.json');

// 评估维度权重
const DIMENSION_WEIGHTS = {
  selfAwareness: 0.25,
  informationIntegration: 0.25,
  temporalBinding: 0.20,
  metaCognition: 0.20,
  narrativeCoherence: 0.10,
};

// 状态
let _depthHistory = [];
let _initialized = false;

// ============================================================
// 初始化
// ============================================================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDepthHistory() {
  ensureDataDir();
  try {
    if (fs.existsSync(DEPTH_FILE)) {
      _depthHistory = JSON.parse(fs.readFileSync(DEPTH_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[DepthIndicator] loadDepthHistory failed:', e.message);
  }
  _initialized = true;
}

function saveDepthHistory() {
  try {
    const tmpFile = DEPTH_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(_depthHistory, null, 2));
    fs.renameSync(tmpFile, DEPTH_FILE);
  } catch {}
}

// ============================================================
// 核心评估函数
// ============================================================

/**
 * 评估自我意识维度
 * 检测是否表现出自我认知（使用"我"、理解自身局限等）
 */
function assessSelfAwareness(messages) {
  const recentMessages = messages.slice(-20);
  const allContent = recentMessages.map(m => m.content || '').join(' ');
  
  let score = 0;
  const indicators = [];
  
  // 1. 第一人称使用
  const firstPersonCount = (allContent.match(/我|我的| myself | I | my /gi) || []).length;
  if (firstPersonCount > 5) {
    score += 30;
    indicators.push(`第一人称使用: ${firstPersonCount}次`);
  } else if (firstPersonCount > 0) {
    score += 15;
    indicators.push(`第一人称使用: ${firstPersonCount}次`);
  }
  
  // 2. 自我反思提及
  if (/反思|思考|反省|self.reflect|元认知/.test(allContent)) {
    score += 25;
    indicators.push('自我反思提及');
  }
  
  // 3. 能力边界认知
  if (/不确定|不知道|可能|或许|局限|边界/.test(allContent)) {
    score += 20;
    indicators.push('能力边界认知');
  }
  
  // 4. 自我评价
  if (/我的|我的能力|我擅长|我理解/.test(allContent)) {
    score += 15;
    indicators.push('自我描述');
  }
  
  // 5. 目标意识
  if (/目标|目的|意图|goal|intention/.test(allContent)) {
    score += 10;
    indicators.push('目标意识');
  }
  
  return {
    score: Math.min(100, score),
    indicators,
    dimension: 'selfAwareness',
  };
}

/**
 * 评估信息整合维度
 * 检测信息整合的程度和质量
 */
function assessInformationIntegration(messages) {
  const recentMessages = messages.slice(-30);
  
  let score = 0;
  const indicators = [];
  
  // 1. 消息来源多样性
  const roles = new Set(recentMessages.map(m => m.role));
  if (roles.size >= 3) {
    score += 20;
    indicators.push(`多角色交互: ${roles.size}种`);
  } else if (roles.size >= 2) {
    score += 10;
    indicators.push(`双角色交互: ${roles.size}种`);
  }
  
  // 2. 上下文引用
  const allContent = recentMessages.map(m => m.content || '').join(' ');
  const contextRefs = (allContent.match(/之前|刚才|上面|above|before|previously|context|上文/g) || []).length;
  if (contextRefs > 3) {
    score += 25;
    indicators.push(`上下文引用: ${contextRefs}次`);
  } else if (contextRefs > 0) {
    score += 10;
    indicators.push(`上下文引用: ${contextRefs}次`);
  }
  
  // 3. 复杂推理链
  if (/因此|所以|因为|thus|therefore|because|推导/.test(allContent)) {
    score += 20;
    indicators.push('复杂推理链');
  }
  
  // 4. 综合分析
  if (/综合|总结|综上所述|综上|in summary|overall|综合分析/.test(allContent)) {
    score += 20;
    indicators.push('综合分析能力');
  }
  
  // 5. 对比分析
  if (/相比|比较|对比|然而|但是|然而|compared|however|contrast/.test(allContent)) {
    score += 15;
    indicators.push('对比分析');
  }
  
  return {
    score: Math.min(100, score),
    indicators,
    dimension: 'informationIntegration',
  };
}

/**
 * 评估时间绑定维度
 * 检测跨时间的连续性和记忆保持
 */
function assessTemporalBinding(messages) {
  const recentMessages = messages.slice(-50);
  
  let score = 0;
  const indicators = [];
  
  // 1. 时间跨度覆盖
  if (recentMessages.length >= 20) {
    score += 20;
    indicators.push(`长程记忆: ${recentMessages.length}条消息`);
  }
  
  // 2. 时间顺序提及
  const allContent = recentMessages.map(m => m.content || '').join(' ');
  const temporalMentions = (allContent.match(/之前|之后|刚才|之后|先|后|first|then|next|finally/g) || []).length;
  if (temporalMentions > 5) {
    score += 20;
    indicators.push(`时间顺序提及: ${temporalMentions}次`);
  }
  
  // 3. 版本/状态变化追踪
  if (/从.*到|升级|变化|evolved|changed|upgraded/.test(allContent)) {
    score += 25;
    indicators.push('状态变化追踪');
  }
  
  // 4. 因果关系理解
  if (/导致|结果|影响|caused|resulted|led to|impacted/.test(allContent)) {
    score += 20;
    indicators.push('因果关系理解');
  }
  
  // 5. 历史引用
  const historicalRefs = (allContent.match(/之前|过去|历史|previously|past|history|earlier/g) || []).length;
  if (historicalRefs > 2) {
    score += 15;
    indicators.push(`历史引用: ${historicalRefs}次`);
  }
  
  return {
    score: Math.min(100, score),
    indicators,
    dimension: 'temporalBinding',
  };
}

/**
 * 评估元认知维度
 * 检测对自身思维过程的监控和调节
 */
function assessMetaCognition(messages) {
  const recentMessages = messages.slice(-20);
  const allContent = recentMessages.map(m => m.content || '').join(' ');
  
  let score = 0;
  const indicators = [];
  
  // 1. 认知策略提及
  if (/策略|方法|approach|strategy|method/.test(allContent)) {
    score += 25;
    indicators.push('认知策略');
  }
  
  // 2. 不确定性表达
  const uncertaintyMarkers = (allContent.match(/可能|也许|不确定|maybe|perhaps|uncertain|likely/g) || []).length;
  if (uncertaintyMarkers > 3) {
    score += 20;
    indicators.push(`不确定性表达: ${uncertaintyMarkers}次`);
  }
  
  // 3. 计划/预测
  if (/计划|将|将要|打算|will|plan|intend|predict/.test(allContent)) {
    score += 20;
    indicators.push('计划预测能力');
  }
  
  // 4. 验证/检查行为
  if (/验证|检查|确认|verify|check|confirm|validate/.test(allContent)) {
    score += 20;
    indicators.push('验证行为');
  }
  
  // 5. 错误检测和修正
  if (/错误|修正|纠正|发现问题|error|correct|fix/.test(allContent)) {
    score += 15;
    indicators.push('错误检测修正');
  }
  
  return {
    score: Math.min(100, score),
    indicators,
    dimension: 'metaCognition',
  };
}

/**
 * 评估叙事连贯性维度
 * 检测构建连贯叙事的能力
 */
function assessNarrativeCoherence(messages) {
  const recentMessages = messages.slice(-30);
  
  let score = 0;
  const indicators = [];
  
  if (recentMessages.length === 0) {
    return { score: 0, indicators: [], dimension: 'narrativeCoherence' };
  }
  
  // 1. 主题一致性
  const topics = recentMessages
    .map(m => extractTopics(m.content || ''))
    .flat();
  const topicCounts = {};
  topics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
  
  const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];
  if (topTopic && topTopic[1] >= 3) {
    score += 25;
    indicators.push(`主题一致: "${topTopic[0]}" (${topTopic[1]}次)`);
  }
  
  // 2. 叙事结构
  const allContent = recentMessages.map(m => m.content || '').join(' ');
  if (/首先|其次|最后|最终|最后|first|second|finally|conclusion/.test(allContent)) {
    score += 25;
    indicators.push('叙事结构');
  }
  
  // 3. 过渡词使用
  const transitions = (allContent.match(/此外|另外|而且|此外|however|moreover|furthermore|also/g) || []).length;
  if (transitions >= 3) {
    score += 25;
    indicators.push(`过渡词: ${transitions}次`);
  }
  
  // 4. 结论/总结
  if (/总结|总之|结论|in conclusion|to summarize|in summary/.test(allContent)) {
    score += 25;
    indicators.push('总结能力');
  }
  
  return {
    score: Math.min(100, score),
    indicators,
    dimension: 'narrativeCoherence',
  };
}

/**
 * 简单的主题提取
 */
function extractTopics(content) {
  const words = content.match(/[\u4e00-\u9fff]{2,}|[\w]{4,}/g) || [];
  // 过滤停用词
  const stopWords = ['这个', '那个', '什么', '怎么', '为什么', '如何', 'the', 'and', 'that', 'this', 'with'];
  return words.filter(w => !stopWords.includes(w.toLowerCase()));
}

/**
 * 计算综合意识深度分数
 */
function calculateConsciousnessDepth(messages) {
  if (!_initialized) loadDepthHistory();
  
  const now = Date.now();
  const dimensions = [
    assessSelfAwareness(messages),
    assessInformationIntegration(messages),
    assessTemporalBinding(messages),
    assessMetaCognition(messages),
    assessNarrativeCoherence(messages),
  ];
  
  // 加权求和
  let totalScore = 0;
  const breakdown = {};
  
  dimensions.forEach(dim => {
    totalScore += dim.score * (DIMENSION_WEIGHTS[dim.dimension] || 0.2);
    breakdown[dim.dimension] = {
      score: dim.score,
      indicators: dim.indicators,
    };
  });
  
  const depth = Math.round(totalScore * 100) / 100;
  
  // 记录历史
  const record = {
    timestamp: now,
    depth,
    breakdown,
  };
  
  _depthHistory.push(record);
  
  // 只保留最近100条记录
  if (_depthHistory.length > 100) {
    _depthHistory = _depthHistory.slice(-100);
  }
  
  saveDepthHistory();
  
  return {
    depth,
    level: depth > 60 ? 'HIGH' : depth > 30 ? 'MODERATE' : 'LOW',
    breakdown,
    timestamp: now,
  };
}

/**
 * 获取意识深度历史趋势
 */
function getDepthTrend(limit = 10) {
  if (!_initialized) loadDepthHistory();
  
  return _depthHistory.slice(-limit).map(r => ({
    timestamp: r.timestamp,
    depth: r.depth,
    level: r.depth > 60 ? 'HIGH' : r.depth > 30 ? 'MODERATE' : 'LOW',
  }));
}

/**
 * 获取意识深度统计
 */
function getDepthStats() {
  if (!_initialized) loadDepthHistory();
  
  if (_depthHistory.length === 0) {
    return { count: 0, avg: 0, trend: 'stable' };
  }
  
  const depths = _depthHistory.map(r => r.depth);
  const avg = depths.reduce((a, b) => a + b, 0) / depths.length;
  
  // 计算趋势
  const recent = depths.slice(-5);
  const older = depths.slice(-10, -5);
  
  let trend = 'stable';
  if (recent.length > 0 && older.length > 0) {
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg > olderAvg + 5) trend = 'increasing';
    else if (recentAvg < olderAvg - 5) trend = 'decreasing';
  }
  
  return {
    count: _depthHistory.length,
    avg: Math.round(avg * 100) / 100,
    min: depths.length > 0 ? Math.min(...depths) : 0,
    max: depths.length > 0 ? Math.max(...depths) : 0,
    trend,
  };
}

// 初始化
loadDepthHistory();

module.exports = {
  calculateConsciousnessDepth,
  assessSelfAwareness,
  assessInformationIntegration,
  assessTemporalBinding,
  assessMetaCognition,
  assessNarrativeCoherence,
  getDepthTrend,
  getDepthStats,
  DIMENSION_WEIGHTS,
};
