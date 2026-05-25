/**
 * empathy-detector.js - 共情检测引擎 v1.0.0
 * 来源: Decety & Jackson (2004) - "The Functional Architecture of Human Empathy"
 *        Citation: 3210 | DOI: 10.1002/bdm.v10.3/issuetoc
 * 
 * 四组件共情架构:
 * 1. Emotional Contagion (情绪传染) - 自动模仿与同步
 * 2. Empathic Concern (共情关怀) - 对他人的关怀
 * 3. Perspective Taking (观点采择) - 理解他人心理状态
 * 4. Self-Other Distinction (自我-他人区分) - 区分自身与他人情绪
 * 
 * 核心功能:
 * - detectEmpathy(text) - 主入口，检测文本共情水平
 * - computeEmpathyScore() - 计算综合共情分数 (0-1)
 * - identifyEmpathyType() - 识别主要共情类型
 * - detectEmotionalContagion() - 情绪传染检测
 * - detectPerspectiveTaking() - 观点采择检测
 * - detectSelfOtherDistinction() - 自我-他人区分检测
 */

'use strict';

// 共情维度权重
const EMPATHY_WEIGHTS = {
  emotionalContagion: 0.25,    // 情绪传染权重
  empathicConcern: 0.30,       // 共情关怀权重
  perspectiveTaking: 0.25,     // 观点采择权重
  selfOtherDistinction: 0.20   // 自我-他人区分权重
};

// 情绪传染关键词
const EMOTIONAL_CONTAGION_POSITIVE = [
  '开心', '高兴', '快乐', '兴奋', '幸福', '温暖', '感动', '激动',
  '笑', '欢呼', '鼓掌', '雀跃', '欢欣', '喜悦', '愉快', '欢乐',
  'happy', 'joy', 'excited', 'glad', 'pleased', 'delighted', 'elated'
];

const EMOTIONAL_CONTAGION_NEGATIVE = [
  '难过', '悲伤', '伤心', '痛苦', '沮丧', '失落', '绝望', '崩溃',
  '哭', '流泪', '哽咽', '哭泣', '哀伤', '悲痛', '凄惨', '惨淡',
  'sad', 'upset', 'crying', 'tears', 'depressed', 'grieving', 'miserable'
];

// 共情关怀关键词（他人导向）
const EMPATHIC_CONCERN_WORDS = [
  '关心', '关怀', '关爱', '体贴', '心疼', '担忧', '牵挂', '挂念',
  '担心', '忧虑', '关怀', '在意', '体谅', '理解', '共情', '同感',
  '心疼你', '为你难过', '替你', '你还好吗', '怎么样',
  'care', 'concern', 'worry', 'support', 'compassion', 'sympathy',
  'feel for', 'sorry for', 'empathy', 'kind', 'gentle'
];

// 观点采择关键词（认知理解）
const PERSPECTIVE_TAKING_WORDS = [
  '觉得', '认为', '感觉', '理解', '明白', '懂得', '知道', '理解你的',
  '你怎么想', '你觉得', '我想你可能', '你应该是在',
  '我想', '估计', '大概', '可能', '或许',
  'think', 'feel', 'believe', 'understand', 'imagine', 'suppose',
  'might', 'probably', 'perhaps', 'maybe', 'assume', 'guess'
];

// 自我-他人区分标记
const SELF_OTHER_MARKERS = {
  selfFirst: ['我觉得', '我认为', '我感到', '我的', '我自己', '我自己'],
  otherFirst: ['你觉得', '你感到', '你认为', '你的', '他人', '别人'],
  boundary: ['但是', '不过', '然而', '可是', '虽然', '但', '然而']
};

/**
 * 计算情绪传染分数
 * @param {string} text - 输入文本
 * @returns {object} { score: 0-1, indicators: [], intensity: -1 to 1 }
 */
function detectEmotionalContagion(text) {
  const lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  const indicators = [];
  
  EMOTIONAL_CONTAGION_POSITIVE.forEach(w => {
    if (lower.includes(w)) {
      positiveCount++;
      indicators.push({ word: w, type: 'positive' });
    }
  });
  
  EMOTIONAL_CONTAGION_NEGATIVE.forEach(w => {
    if (lower.includes(w)) {
      negativeCount++;
      indicators.push({ word: w, type: 'negative' });
    }
  });
  
  const totalCount = positiveCount + negativeCount;
  if (totalCount === 0) return { score: 0, indicators: [], intensity: 0 };
  
  // 情绪强度: 正负情绪的绝对值平均
  const intensity = totalCount >= 2 ? (positiveCount > negativeCount ? 0.5 : -0.5)
                    : totalCount >= 3 ? (positiveCount > negativeCount ? 0.8 : -0.8)
                    : (positiveCount > negativeCount ? 0.3 : -0.3);
  
  // 分数: 有情绪词即有传染, 多个强化
  const rawScore = Math.min(1.0, totalCount / 3);
  
  return {
    score: rawScore,
    indicators,
    intensity,
    valence: positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral'
  };
}

/**
 * 计算共情关怀分数
 * @param {string} text - 输入文本
 * @returns {object} { score: 0-1, indicators: [], type: 'self'|'other'|'both' }
 */
function detectEmpathicConcern(text) {
  const lower = text.toLowerCase();
  let concernCount = 0;
  const indicators = [];
  let selfOriented = 0;
  let otherOriented = 0;
  
  EMPATHIC_CONCERN_WORDS.forEach(w => {
    if (lower.includes(w)) {
      concernCount++;
      indicators.push(w);
      
      // 检测关怀方向
      const contextStart = Math.max(0, lower.indexOf(w) - 5);
      const contextEnd = Math.min(lower.length, lower.indexOf(w) + w.length + 5);
      const context = lower.slice(contextStart, contextEnd);
      
      if (context.includes('你') || context.includes('your') || context.includes('他人') || context.includes('别人')) {
        otherOriented++;
      } else if (context.includes('我') || context.includes('my')) {
        selfOriented++;
      }
    }
  });
  
  if (concernCount === 0) return { score: 0, indicators: [], type: 'none' };
  
  // 有关怀词就有基础分, 方向影响最终分
  const baseScore = Math.min(0.8, concernCount * 0.3);
  const orientationBonus = (otherOriented > selfOriented) ? 0.2 : 0;
  
  return {
    score: Math.min(1.0, baseScore + orientationBonus),
    indicators,
    type: otherOriented > selfOriented ? 'other' : selfOriented > otherOriented ? 'self' : 'both'
  };
}

/**
 * 计算观点采择分数
 * @param {string} text - 输入文本
 * @returns {object} { score: 0-1, indicators: [], mode: 'speculative'|'confirmative' }
 */
function detectPerspectiveTaking(text) {
  const lower = text.toLowerCase();
  let perspectiveCount = 0;
  const indicators = [];
  let speculativeCount = 0;
  let confirmativeCount = 0;
  
  PERSPECTIVE_TAKING_WORDS.forEach(w => {
    const regex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    const regexGlobal = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    while ((match = regexGlobal.exec(lower)) !== null) {
      perspectiveCount++;
      indicators.push({ word: w, position: match.index });
      
      // 检测是推测性还是确认性
      const contextStart = Math.max(0, match.index - 8);
      const contextEnd = Math.min(lower.length, match.index + w.length + 8);
      const context = lower.slice(contextStart, contextEnd);
      
      if (context.includes('可能') || context.includes('大概') || context.includes('估计') || 
          context.includes('maybe') || context.includes('perhaps') || context.includes('might')) {
        speculativeCount++;
      } else if (context.includes('应该') || context.includes('一定') || context.includes('肯定') ||
                 context.includes('probably') || context.includes('likely')) {
        confirmativeCount++;
      }
    }
  });
  
  if (perspectiveCount === 0) return { score: 0, indicators: [], mode: 'none' };
  
  // 有观点采择词就有分数
  const baseScore = Math.min(0.9, perspectiveCount * 0.25);
  const modeBonus = speculativeCount > 0 ? 0.1 : 0; // 推测性观点采择加分
  
  return {
    score: Math.min(1.0, baseScore + modeBonus),
    indicators,
    mode: speculativeCount > confirmativeCount ? 'speculative' : confirmativeCount > 0 ? 'confirmative' : 'neutral'
  };
}

/**
 * 计算自我-他人区分分数
 * @param {string} text - 输入文本
 * @returns {object} { score: 0-1, hasClearBoundary: boolean, selfRefs: [], otherRefs: [] }
 */
function detectSelfOtherDistinction(text) {
  const lower = text.toLowerCase();
  const selfRefs = [];
  const otherRefs = [];
  
  // 统计自我引用
  SELF_OTHER_MARKERS.selfFirst.forEach(m => {
    if (lower.includes(m)) selfRefs.push(m);
  });
  
  // 统计他人引用
  SELF_OTHER_MARKERS.otherFirst.forEach(m => {
    if (lower.includes(m)) otherRefs.push(m);
  });
  
  // 边界标记存在表示有区分意识
  let boundaryCount = 0;
  SELF_OTHER_MARKERS.boundary.forEach(b => {
    if (lower.includes(b)) boundaryCount++;
  });
  
  const hasBoth = selfRefs.length > 0 && otherRefs.length > 0;
  const hasBoundary = boundaryCount > 0;
  
  // 分数: 有双方引用+边界词 = 高区分度
  let score = 0;
  if (hasBoth) score += 0.5;
  if (hasBoundary) score += 0.3;
  if (selfRefs.length > 0 || otherRefs.length > 0) score += 0.2;
  
  return {
    score: Math.min(1.0, score),
    hasClearBoundary: hasBoundary,
    selfRefs,
    otherRefs,
    distinctionQuality: hasBoth && hasBoundary ? 'high' : hasBoth ? 'medium' : 'low'
  };
}

/**
 * 主入口: 检测文本共情水平
 * @param {string} text - 输入文本
 * @returns {object} 完整共情分析结果
 */
function detectEmpathy(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      score: 0,
      level: 'none',
      components: { emotionalContagion: 0, empathicConcern: 0, perspectiveTaking: 0, selfOtherDistinction: 0 },
      summary: '无文本输入',
      empathyType: 'none'
    };
  }
  
  const contagion = detectEmotionalContagion(text);
  const concern = detectEmpathicConcern(text);
  const perspective = detectPerspectiveTaking(text);
  const distinction = detectSelfOtherDistinction(text);
  
  // 加权总分
  const weightedScore = 
    contagion.score * EMPATHY_WEIGHTS.emotionalContagion +
    concern.score * EMPATHY_WEIGHTS.empathicConcern +
    perspective.score * EMPATHY_WEIGHTS.perspectiveTaking +
    distinction.score * EMPATHY_WEIGHTS.selfOtherDistinction;
  
  // 共情水平分级
  let level;
  if (weightedScore >= 0.7) level = 'high';
  else if (weightedScore >= 0.4) level = 'moderate';
  else if (weightedScore > 0) level = 'low';
  else level = 'none';
  
  // 共情类型判断
  const empathyType = identifyEmpathyType(contagion, concern, perspective, distinction);
  
  return {
    score: Math.round(weightedScore * 100) / 100,
    level,
    components: {
      emotionalContagion: Math.round(contagion.score * 100) / 100,
      empathicConcern: Math.round(concern.score * 100) / 100,
      perspectiveTaking: Math.round(perspective.score * 100) / 100,
      selfOtherDistinction: Math.round(distinction.score * 100) / 100
    },
    contagion,
    concern,
    perspective,
    distinction,
    summary: generateEmpathySummary(contagion, concern, perspective, distinction, level),
    empathyType
  };
}

/**
 * 识别主要共情类型
 */
function identifyEmpathyType(contagion, concern, perspective, distinction) {
  const components = [
    { name: 'emotionalContagion', score: contagion.score },
    { name: 'empathicConcern', score: concern.score },
    { name: 'perspectiveTaking', score: perspective.score },
    { name: 'selfOtherDistinction', score: distinction.score }
  ];
  
  const sorted = components.sort((a, b) => b.score - a.score);
  const top = sorted[0];
  
  if (top.score === 0) return 'none';
  
  // 类型映射
  const typeMap = {
    emotionalContagion: contagion.intensity > 0 ? 'positiveEmpathy' : 'negativeEmpathy',
    empathicConcern: concern.type === 'other' ? 'compassionate' : concern.type === 'self' ? 'selfFocused' : 'mixedConcern',
    perspectiveTaking: perspective.mode === 'speculative' ? 'cognitiveEmpathy' : 'confirmativeEmpathy',
    selfOtherDistinction: distinction.distinctionQuality === 'high' ? 'differentiated' : 'undifferentiated'
  };
  
  return typeMap[top.name] || 'mixed';
}

/**
 * 生成共情摘要
 */
function generateEmpathySummary(contagion, concern, perspective, distinction, level) {
  if (level === 'none') return '未检测到共情信号';
  
  const parts = [];
  
  if (contagion.score >= 0.5) {
    parts.push(`情绪传染${contagion.valence === 'positive' ? '正向' : '负向'}`);
  }
  if (concern.score >= 0.5) {
    parts.push(concern.type === 'other' ? '关怀他人' : '自我关注');
  }
  if (perspective.score >= 0.5) {
    parts.push(perspective.mode === 'speculative' ? '推测理解' : '确认理解');
  }
  if (distinction.score >= 0.5) {
    parts.push(distinction.hasClearBoundary ? '自我-他人边界清晰' : '边界模糊');
  }
  
  return parts.length > 0 ? parts.join(' + ') : '低水平共情';
}

/**
 * 计算综合共情分数 (简化接口)
 * @param {string} text - 输入文本
 * @returns {number} 0-1 共情分数
 */
function computeEmpathyScore(text) {
  const result = detectEmpathy(text);
  return result.score;
}

/**
 * 演示函数
 */
function demo() {
  const testTexts = [
    '我很难过，你还好吗？',
    '我觉得你应该很开心吧，祝贺你！',
    '我最近压力很大，总是睡不好，很担心你的情况。',
    '这个任务完成了。',
    '听说你遇到困难了，我很心疼你，想帮你分担一些。'
  ];
  
  console.log('=== Decety & Jackson (2004) 共情架构测试 ===\n');
  console.log('来源论文: The Functional Architecture of Human Empathy');
  console.log('引用数: 3210\n');
  
  testTexts.forEach((text, i) => {
    console.log(`[${i+1}] 输入: "${text}"`);
    const result = detectEmpathy(text);
    console.log(`    分数: ${result.score} (${result.level})`);
    console.log(`    类型: ${result.empathyType}`);
    console.log(`    摘要: ${result.summary}`);
    console.log('');
  });
  
  console.log('=== 组件详情 ===');
  const detailed = detectEmpathy('我最近压力很大，总是睡不好，很担心你的情况。');
  console.log('示例深度分析:', JSON.stringify(detailed, null, 2));
}

// 导出
module.exports = {
  detectEmpathy,
  computeEmpathyScore,
  detectEmotionalContagion,
  detectEmpathicConcern,
  detectPerspectiveTaking,
  detectSelfOtherDistinction,
  EMPATHY_WEIGHTS,
  demo
};

// 主入口
if (require.main === module) {
  demo();
}
