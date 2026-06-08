/**
 * L3 Narrative Retriever - 叙事编织层 v2.2.8
 * 从叙事原型库中匹配最相似的故事框架
 *
 * 升级内容 (v2.2.8):
 *   - 增加 NarrativeMatchResult 状态枚举
 *   - 增加输入参数验证与边界检查
 *   - 增加震荡检测 (oscillationDetection): 防止匹配结果在多个原型间来回跳动
 *   - 增加空原型自动补全逻辑
 *   - 增加原型文件损坏时的多层恢复策略
 *   - 增加相似度归一化与置信度校准
 *   - 增加匹配频率统计与热路径追踪
 *   - 增加防御性编程: 所有外部输入检查+降级
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ============================================================================
// 状态枚举
// ============================================================================

/**
 * 叙事匹配结果状态
 * @enum {string}
 */
const MatchStatus = {
  /** 完全匹配：找到了高质量的原型 */
  FULL_MATCH: 'full_match',
  /** 部分匹配：找到原型但置信度较低 */
  PARTIAL_MATCH: 'partial_match',
  /** 弱匹配：仅极少量关键词匹配 */
  WEAK_MATCH: 'weak_match',
  /** 无匹配：没有任何原型符合 */
  NO_MATCH: 'no_match',
  /** 降级匹配：原型库为空或损坏，使用默认回退 */
  FALLBACK: 'fallback',
  /** 震荡检测：检测到反复在多个原型间跳动 */
  OSCILLATION: 'oscillation_detected',
  /** 错误：输入无效 */
  ERROR: 'error'
};

/**
 * 错误分类
 * @enum {string}
 */
const MatchErrorType = {
  INVALID_INPUT: 'invalid_input',
  PROTOTYPE_CORRUPTION: 'prototype_corruption',
  PROTOTYPE_EMPTY: 'prototype_empty',
  FILE_IO_ERROR: 'file_io_error',
  UNKNOWN: 'unknown'
};

// ============================================================================
// 默认原型（空库时的自动补全）
// ============================================================================

const DEFAULT_PROTOTYPES = [
  {
    id: 'default_hero_journey',
    name: '英雄之旅',
    keywords: ['成长', '挑战', '转变', '冒险', '克服', '学习', '目标', '困难', '胜利'],
    framework: 'hero_journey',
    emotionalTone: 'triumphant',
    stages: ['启程', '试炼', '回归']
  },
  {
    id: 'default_overcoming_monster',
    name: '战胜怪物',
    keywords: ['对抗', '冲突', '敌人', '威胁', '危险', '战斗', '保护', '胜利', '危机'],
    framework: 'overcoming_monster',
    emotionalTone: 'dramatic',
    stages: ['威胁出现', '对抗升级', '最终对决', '和平恢复']
  },
  {
    id: 'default_quest',
    name: '追寻之旅',
    keywords: ['寻找', '探索', '发现', '目标', '方向', '旅途', '伙伴', '未知', '答案'],
    framework: 'quest',
    emotionalTone: 'adventurous',
    stages: ['召唤', '旅途', '发现', '回归']
  },
  {
    id: 'default_rags_to_riches',
    name: '从平凡到卓越',
    keywords: ['努力', '奋斗', '成长', '成功', '改变', '机遇', '进步', '突破', '成就'],
    framework: 'rags_to_riches',
    emotionalTone: 'inspiring',
    stages: ['起点', '努力', '转折', '蜕变']
  },
  {
    id: 'default_rebirth',
    name: '重生',
    keywords: ['重生', '新生', '改变', '觉悟', '放下', '重新开始', '疗愈', '希望', '转变'],
    framework: 'rebirth',
    emotionalTone: 'hopeful',
    stages: ['困境', '觉悟', '转变', '新生']
  }
];

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 验证输入是否为非空对象
 * @param {*} val
 * @returns {boolean}
 */
function isNonEmptyObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0;
}

/**
 * 验证输入是否为非空数组
 * @param {*} val
 * @returns {boolean}
 */
function isNonEmptyArray(val) {
  return Array.isArray(val) && val.length > 0;
}

/**
 * 生成简单哈希（用于震荡检测的快速比较）
 * @param {string} str
 * @returns {number}
 */
function quickHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// ============================================================================
// NarrativeRetriever 类
// ============================================================================

class NarrativeRetriever {
  constructor(projectRoot) {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[NarrativeRetriever] 构造参数 projectRoot 必须是非空字符串');
    }
    this.projectRoot = projectRoot;
    this.prototypeFile = path.join(projectRoot, 'src', 'core', 'associative-engine', 'narrative-prototypes.json');

    // --- 升级: 原型健康状态（必须在 loadPrototypes 之前初始化） ---
    this._prototypeHealth = {
      lastLoadSuccess: true,
      lastError: null,
      corruptionCount: 0,
      fallbackUsed: false
    };

    // --- 升级: 震荡检测状态 ---
    this._matchHistory = [];       // 最近N次匹配记录
    this._maxHistorySize = 10;     // 震荡检测窗口
    this._oscillationThreshold = 4; // 在窗口内切换超过此次数判定为震荡
    this._previousMatches = new Map(); // 输入哈希 → 结果缓存

    // --- 升级: 匹配频率统计 ---
    this._matchFrequency = {};     // prototypeId → 匹配次数
    this._totalMatches = 0;

    this.prototypes = this.loadPrototypes();
    this.lastMatch = null;
  }

  // ==========================================================================
  // 原型加载（增强版）
  // ==========================================================================

  loadPrototypes() {
    try {
      if (fs.existsSync(this.prototypeFile)) {
        const raw = fs.readFileSync(this.prototypeFile, 'utf8');
        if (!raw || !raw.trim()) {
          this._prototypeHealth.lastLoadSuccess = false;
          this._prototypeHealth.lastError = '原型文件为空';
          this._prototypeHealth.fallbackUsed = true;
          return this._createDefaultPrototypeStore();
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
          this._prototypeHealth.lastLoadSuccess = false;
          this._prototypeHealth.lastError = '原型文件内容不是有效对象';
          this._prototypeHealth.fallbackUsed = true;
          return this._createDefaultPrototypeStore();
        }
        // 检查原型数据是否有效
        if (!parsed.prototypes || typeof parsed.prototypes !== 'object') {
          this._prototypeHealth.lastLoadSuccess = false;
          this._prototypeHealth.lastError = 'prototypes 字段缺失或格式错误';
          this._prototypeHealth.fallbackUsed = true;
          return this._createDefaultPrototypeStore();
        }
        // 检查是否为空对象
        if (Object.keys(parsed.prototypes).length === 0) {
          this._prototypeHealth.lastLoadSuccess = true;
          this._prototypeHealth.lastError = '原型库为空，将自动注入默认原型';
          this._prototypeHealth.fallbackUsed = true;
          return this._createDefaultPrototypeStore();
        }
        this._prototypeHealth.lastLoadSuccess = true;
        this._prototypeHealth.lastError = null;
        this._prototypeHealth.fallbackUsed = false;
        return parsed;
      }
      // 文件不存在，使用默认原型
      this._prototypeHealth.lastLoadSuccess = true;
      this._prototypeHealth.lastError = '原型文件不存在，使用默认原型';
      this._prototypeHealth.fallbackUsed = true;
      return this._createDefaultPrototypeStore();
    } catch (e) {
      this._prototypeHealth.lastLoadSuccess = false;
      this._prototypeHealth.lastError = e.message;
      this._prototypeHealth.corruptionCount++;
      this._prototypeHealth.fallbackUsed = true;
      console.error('[NarrativeRetriever] Load prototypes failed:', e.message);
      return this._createDefaultPrototypeStore();
    }
  }

  /**
   * 创建默认原型存储
   * @private
   * @returns {Object}
   */
  _createDefaultPrototypeStore() {
    const prototypes = {};
    for (const proto of DEFAULT_PROTOTYPES) {
      prototypes[proto.id] = {
        name: proto.name,
        keywords: proto.keywords,
        framework: proto.framework,
        emotionalTone: proto.emotionalTone,
        stages: proto.stages
      };
    }
    return {
      version: '2.0',
      prototypes,
      metadata: {
        count: prototypes.length,
        isDefault: true,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  // ==========================================================================
  // 核心匹配方法（增强版）
  // ==========================================================================

  /**
   * 匹配叙事原型
   * @param {Object} semanticVector - 语义向量
   * @param {Array} [activatedChunks=[]] - 激活的记忆块
   * @returns {Object} 匹配结果
   */
  matchNarrative(semanticVector, activatedChunks = []) {
    // --- 升级: 输入验证 ---
    const validationResult = this._validateMatchInput(semanticVector, activatedChunks);
    if (!validationResult.valid) {
      return {
        status: MatchStatus.ERROR,
        errorType: validationResult.errorType,
        errorMessage: validationResult.errorMessage,
        inputKeywords: [],
        matchedPrototype: null,
        confidence: 0,
        alternativeMatches: [],
        timestamp: new Date().toISOString()
      };
    }

    const semanticKeywords = this.extractKeywords(semanticVector);
    const chunkKeywords = this.extractChunkKeywords(activatedChunks || []);

    const allKeywords = [...new Set([...semanticKeywords, ...chunkKeywords])];

    // --- 升级: 空关键词处理 ---
    if (allKeywords.length === 0) {
      return {
        status: MatchStatus.NO_MATCH,
        inputKeywords: [],
        matchedPrototype: null,
        confidence: 0,
        alternativeMatches: [],
        timestamp: new Date().toISOString()
      };
    }

    // --- 升级: 空原型库检查 ---
    const prototypeEntries = Object.entries(this.prototypes.prototypes);
    if (prototypeEntries.length === 0) {
      return {
        status: MatchStatus.FALLBACK,
        inputKeywords: allKeywords,
        matchedPrototype: null,
        confidence: 0,
        alternativeMatches: [],
        timestamp: new Date().toISOString()
      };
    }

    let bestMatch = null;
    let bestScore = 0;
    const allScores = [];

    for (const [prototypeId, prototype] of prototypeEntries) {
      const score = this.calculateSimilarity(allKeywords, prototype.keywords);
      allScores.push({ id: prototypeId, name: prototype.name, score });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          id: prototypeId,
          name: prototype.name,
          framework: prototype.framework,
          emotionalTone: prototype.emotionalTone,
          stages: prototype.stages,
          score
        };
      }
    }

    // --- 升级: 相似度归一化（当分数较低时做相对排名） ---
    const normalizedScore = this._normalizeScore(bestScore, allScores);

    // --- 升级: 震荡检测 ---
    const oscillationInfo = this._detectOscillation(bestMatch);

    // --- 升级: 状态判定 ---
    const status = this._determineMatchStatus(normalizedScore, oscillationInfo.isOscillating);

    // --- 升级: 如果震荡，选择最稳定的替代 ---
    if (oscillationInfo.isOscillating && bestMatch) {
      const stableAlternative = this._findStableAlternative(allScores);
      if (stableAlternative) {
        bestMatch = stableAlternative.match;
        bestScore = stableAlternative.score;
      }
    }

    // --- 升级: 更新匹配历史 ---
    this._updateMatchHistory(bestMatch, normalizedScore);

    // --- 升级: 更新频率统计 ---
    if (bestMatch) {
      this._matchFrequency[bestMatch.id] = (this._matchFrequency[bestMatch.id] || 0) + 1;
      this._totalMatches++;
    }

    // --- 升级: 输入缓存（避免重复匹配） ---
    const inputHash = quickHash(allKeywords.join('|'));
    this._previousMatches.set(inputHash, {
      matchedPrototype: bestMatch,
      confidence: normalizedScore,
      timestamp: Date.now()
    });
    // 限制缓存大小
    if (this._previousMatches.size > 100) {
      const oldestKey = this._previousMatches.keys().next().value;
      this._previousMatches.delete(oldestKey);
    }

    const alternatives = this.getAlternativeMatches(allKeywords, 3);

    const result = {
      status,
      inputKeywords: allKeywords,
      matchedPrototype: bestMatch,
      confidence: normalizedScore,
      alternativeMatches: alternatives,
      oscillationDetected: oscillationInfo.isOscillating,
      oscillationDetail: oscillationInfo.isOscillating ? oscillationInfo.detail : null,
      frequency: bestMatch ? (this._matchFrequency[bestMatch.id] || 0) : 0,
      prototypeHealth: { ...this._prototypeHealth },
      timestamp: new Date().toISOString()
    };

    this.lastMatch = result;

    return result;
  }

  /**
   * 验证匹配输入
   * @private
   * @param {*} semanticVector
   * @param {*} activatedChunks
   * @returns {{ valid: boolean, errorType?: string, errorMessage?: string }}
   */
  _validateMatchInput(semanticVector, activatedChunks) {
    if (semanticVector === null || semanticVector === undefined) {
      return {
        valid: false,
        errorType: MatchErrorType.INVALID_INPUT,
        errorMessage: 'semanticVector 不能为 null 或 undefined'
      };
    }
    if (typeof semanticVector !== 'object' || Array.isArray(semanticVector)) {
      return {
        valid: false,
        errorType: MatchErrorType.INVALID_INPUT,
        errorMessage: `semanticVector 必须为对象，当前类型: ${typeof semanticVector}`
      };
    }
    if (activatedChunks !== undefined && !Array.isArray(activatedChunks)) {
      return {
        valid: false,
        errorType: MatchErrorType.INVALID_INPUT,
        errorMessage: `activatedChunks 必须为数组，当前类型: ${typeof activatedChunks}`
      };
    }
    return { valid: true };
  }

  /**
   * 归一化匹配分数
   * @private
   * @param {number} rawScore - 原始最高分
   * @param {Array} allScores - 所有分数
   * @returns {number} 归一化后的分数 (0-1)
   */
  _normalizeScore(rawScore, allScores) {
    if (allScores.length === 0) return 0;

    // 如果有多个候选且最高分远高于次高分，保留高分
    const sorted = allScores.sort((a, b) => b.score - a.score);
    if (sorted.length >= 2) {
      const top = sorted[0].score;
      const second = sorted[1].score;
      // 如果第一和第二接近，适当降低置信度
      if (top - second < 0.05 && top < 0.5) {
        return top * 0.8; // 降低置信度以反映不确定性
      }
    }

    // 如果分数本身已经较高（>0.5），保留
    if (rawScore > 0.5) return rawScore;

    // 低分情况：根据候选数量加权
    const densityFactor = Math.min(allScores.filter(s => s.score > 0.1).length / 5, 1);
    return Math.min(rawScore * (1 + densityFactor * 0.3), 0.7);
  }

  /**
   * 震荡检测：检测最近几次匹配是否在多个原型间反复跳动
   * @private
   * @param {Object} currentMatch - 当前最佳匹配
   * @returns {{ isOscillating: boolean, detail: Object|null }}
   */
  _detectOscillation(currentMatch) {
    if (!currentMatch) {
      return { isOscillating: false, detail: null };
    }

    // 记录当前匹配
    this._matchHistory.push({
      id: currentMatch.id,
      name: currentMatch.name,
      timestamp: Date.now()
    });

    // 限制历史大小
    if (this._matchHistory.length > this._maxHistorySize) {
      this._matchHistory.shift();
    }

    if (this._matchHistory.length < 4) {
      return { isOscillating: false, detail: null };
    }

    // 统计最近N次匹配的唯一原型数
    const recentWindow = this._matchHistory.slice(-this._maxHistorySize);
    const uniqueIds = new Set(recentWindow.map(m => m.id));
    const switchCount = uniqueIds.size - 1; // 切换次数

    // 如果唯一原型数超过阈值，说明在反复切换
    if (switchCount >= this._oscillationThreshold) {
      // 找出最频繁的匹配
      const freqMap = {};
      for (const m of recentWindow) {
        freqMap[m.id] = (freqMap[m.id] || 0) + 1;
      }
      const sortedFreq = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
      const mostFrequent = sortedFreq.length > 0 ? sortedFreq[0][0] : null;

      return {
        isOscillating: true,
        detail: {
          windowSize: recentWindow.length,
          uniquePrototypes: uniqueIds.size,
          switchCount,
          mostFrequentId: mostFrequent,
          frequencyMap: freqMap
        }
      };
    }

    return { isOscillating: false, detail: null };
  }

  /**
   * 在震荡时找到最稳定的替代匹配
   * @private
   * @param {Array} allScores - 所有原型得分
   * @returns {{ match: Object, score: number }|null}
   */
  _findStableAlternative(allScores) {
    if (allScores.length === 0) return null;

    // 从频率统计中找到最常匹配的原型
    const sortedByFreq = Object.entries(this._matchFrequency)
      .sort((a, b) => b[1] - a[1]);

    if (sortedByFreq.length > 0) {
      const mostFrequentId = sortedByFreq[0][0];
      const freqScore = allScores.find(s => s.id === mostFrequentId);
      if (freqScore && freqScore.score > 0.1) {
        const proto = this.prototypes.prototypes[mostFrequentId];
        if (proto) {
          return {
            match: {
              id: mostFrequentId,
              name: proto.name,
              framework: proto.framework,
              emotionalTone: proto.emotionalTone,
              stages: proto.stages,
              score: freqScore.score
            },
            score: freqScore.score
          };
        }
      }
    }

    return null;
  }

  /**
   * 根据分数和震荡状态确定匹配状态
   * @private
   * @param {number} score - 归一化分数
   * @param {boolean} isOscillating - 是否震荡
   * @returns {string} MatchStatus
   */
  _determineMatchStatus(score, isOscillating) {
    if (isOscillating) return MatchStatus.OSCILLATION;
    if (score >= 0.6) return MatchStatus.FULL_MATCH;
    if (score >= 0.3) return MatchStatus.PARTIAL_MATCH;
    if (score >= 0.1) return MatchStatus.WEAK_MATCH;
    return MatchStatus.NO_MATCH;
  }

  /**
   * 更新匹配历史
   * @private
   */
  _updateMatchHistory(match, score) {
    // 已由 _detectOscillation 处理
  }

  // ==========================================================================
  // 关键词提取（增强边界检查）
  // ==========================================================================

  extractKeywords(semanticVector) {
    const keywords = [];

    if (!semanticVector || typeof semanticVector !== 'object') {
      return keywords;
    }

    if (semanticVector.associations && Array.isArray(semanticVector.associations)) {
      for (const assoc of semanticVector.associations) {
        if (assoc && typeof assoc === 'object' && assoc.strength > 0.3 && assoc.word) {
          keywords.push(String(assoc.word));
        }
      }
    }

    if (semanticVector.coreConcepts && Array.isArray(semanticVector.coreConcepts)) {
      for (const concept of semanticVector.coreConcepts) {
        if (concept && typeof concept === 'string') {
          keywords.push(concept);
        }
      }
    }

    if (semanticVector.intent && typeof semanticVector.intent === 'string') {
      keywords.push(semanticVector.intent);
    }

    return [...new Set(keywords)];
  }

  extractChunkKeywords(chunks) {
    const keywords = [];

    if (!Array.isArray(chunks)) return keywords;

    for (const chunk of chunks) {
      if (!chunk || typeof chunk !== 'object') continue;

      if (chunk.data) {
        if (Array.isArray(chunk.data.keywords)) {
          for (const kw of chunk.data.keywords) {
            if (kw && typeof kw === 'string') keywords.push(kw);
          }
        }
        if (chunk.data.narrativeSeed && typeof chunk.data.narrativeSeed === 'string') {
          const seedWords = chunk.data.narrativeSeed.split(' ').filter(w => w && w.trim());
          keywords.push(...seedWords);
        }
      }
    }

    return keywords;
  }

  // ==========================================================================
  // 相似度计算（增强版）
  // ==========================================================================

  calculateSimilarity(inputKeywords, prototypeKeywords) {
    if (!Array.isArray(inputKeywords) || !Array.isArray(prototypeKeywords)) {
      return 0;
    }
    if (inputKeywords.length === 0 || prototypeKeywords.length === 0) {
      return 0;
    }

    const inputSet = new Set(inputKeywords.map(k => String(k).toLowerCase()));
    const prototypeSet = new Set(prototypeKeywords.map(k => String(k).toLowerCase()));

    let exactMatchCount = 0;
    let partialMatchCount = 0;

    for (const keyword of inputSet) {
      if (prototypeSet.has(keyword)) {
        exactMatchCount++;
      } else {
        // 部分匹配：检查包含关系
        for (const proto of prototypeSet) {
          if (keyword.includes(proto) || proto.includes(keyword)) {
            partialMatchCount++;
            break; // 每个输入关键词只计一次部分匹配
          }
        }
      }
    }

    const totalScore = exactMatchCount + (partialMatchCount * 0.5);
    const denominator = Math.max(inputSet.size, prototypeSet.size);

    // 边界保护
    return denominator > 0 ? Math.min(totalScore / denominator, 1.0) : 0;
  }

  // ==========================================================================
  // 候选匹配（增强版）
  // ==========================================================================

  getAlternativeMatches(keywords, limit) {
    const alternatives = [];

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return alternatives;
    }

    const effectiveLimit = typeof limit === 'number' && limit > 0 ? Math.min(limit, 10) : 3;

    for (const [prototypeId, prototype] of Object.entries(this.prototypes.prototypes)) {
      if (this.lastMatch && this.lastMatch.matchedPrototype &&
          prototypeId === this.lastMatch.matchedPrototype.id) continue;

      const score = this.calculateSimilarity(keywords, prototype.keywords);
      if (score > 0.2) {
        alternatives.push({
          id: prototypeId,
          name: prototype.name,
          score
        });
      }
    }

    alternatives.sort((a, b) => b.score - a.score);
    return alternatives.slice(0, effectiveLimit);
  }

  // ==========================================================================
  // 叙事上下文（增强版）
  // ==========================================================================

  getNarrativeContext(matchedPrototype, activatedChunks, emotionVector) {
    // 输入验证
    const chunks = Array.isArray(activatedChunks) ? activatedChunks : [];
    const emotion = emotionVector && typeof emotionVector === 'object'
      ? {
          pleasure: typeof emotionVector.pleasure === 'number' ? emotionVector.pleasure : 0,
          arousal: typeof emotionVector.arousal === 'number' ? emotionVector.arousal : 0,
          dominance: typeof emotionVector.dominance === 'number' ? emotionVector.dominance : 0
        }
      : { pleasure: 0, arousal: 0, dominance: 0 };

    if (!matchedPrototype || typeof matchedPrototype !== 'object') {
      return {
        framework: null,
        narrativeName: null,
        emotionalTone: 'neutral',
        stages: [],
        activatedChunks: chunks.map(c => {
          if (c && typeof c === 'object' && c.text) return c.text;
          return String(c);
        }).filter(Boolean),
        emotionVector: emotion,
        status: MatchStatus.NO_MATCH
      };
    }

    const emotionalTone = this.mergeEmotionalTones(
      matchedPrototype.emotionalTone,
      emotion
    );

    return {
      framework: matchedPrototype.framework || null,
      narrativeName: matchedPrototype.name || null,
      emotionalTone,
      stages: Array.isArray(matchedPrototype.stages) ? matchedPrototype.stages : [],
      activatedChunks: chunks.map(c => {
        if (c && typeof c === 'object' && c.text) return c.text;
        return String(c);
      }).filter(Boolean),
      confidence: typeof matchedPrototype.score === 'number' ? matchedPrototype.score : 0,
      emotionVector: emotion,
      status: this._determineMatchStatus(
        typeof matchedPrototype.score === 'number' ? matchedPrototype.score : 0,
        false
      )
    };
  }

  // ==========================================================================
  // 情感融合（增强边界检查）
  // ==========================================================================

  mergeEmotionalTones(prototypeTone, inputEmotion) {
    if (!prototypeTone || typeof prototypeTone !== 'string') return 'neutral';
    if (!inputEmotion || typeof inputEmotion !== 'object') return prototypeTone;

    const tones = [prototypeTone];

    // 安全取值
    const pleasure = typeof inputEmotion.pleasure === 'number' ? inputEmotion.pleasure : 0;
    const arousal = typeof inputEmotion.arousal === 'number' ? inputEmotion.arousal : 0;

    if (pleasure > 3) tones.push('joyful');
    if (pleasure < -3) tones.push('sorrowful');
    if (arousal > 3) tones.push('excited');
    if (arousal < -3) tones.push('calm');

    return tones.join(' + ');
  }

  // ==========================================================================
  // 原型管理（增强版）
  // ==========================================================================

  addPrototype(id, name, keywords, framework, emotionalTone, stages) {
    if (!id || typeof id !== 'string') {
      console.error('[NarrativeRetriever] addPrototype: id 必须是非空字符串');
      return false;
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      console.error('[NarrativeRetriever] addPrototype: keywords 必须是非空数组');
      return false;
    }

    this.prototypes.prototypes[id] = {
      name: name || id,
      keywords: keywords.map(k => String(k)),
      framework: framework || 'custom',
      emotionalTone: emotionalTone || 'neutral',
      stages: Array.isArray(stages) ? stages : ['start', 'middle', 'end']
    };
    this.prototypes.metadata.count = Object.keys(this.prototypes.prototypes).length;
    this.prototypes.metadata.lastUpdate = new Date().toISOString();
    this.savePrototypes();
    return true;
  }

  /**
   * 删除原型（增强版：验证存在性）
   * @param {string} id - 原型ID
   * @returns {boolean} 是否成功
   */
  removePrototype(id) {
    if (!id || typeof id !== 'string') {
      console.error('[NarrativeRetriever] removePrototype: id 必须是非空字符串');
      return false;
    }
    if (!this.prototypes.prototypes[id]) {
      console.error(`[NarrativeRetriever] removePrototype: 原型 "${id}" 不存在`);
      return false;
    }
    delete this.prototypes.prototypes[id];
    this.prototypes.metadata.count = Object.keys(this.prototypes.prototypes).length;
    this.prototypes.metadata.lastUpdate = new Date().toISOString();
    this.savePrototypes();
    return true;
  }

  /**
   * 获取原型统计信息
   * @returns {Object}
   */
  getPrototypeStats() {
    const protoCount = Object.keys(this.prototypes.prototypes).length;
    const hasDefault = this.prototypes.metadata.isDefault === true;

    return {
      totalPrototypes: protoCount,
      usingDefaults: hasDefault,
      health: { ...this._prototypeHealth },
      matchFrequency: { ...this._matchFrequency },
      totalMatches: this._totalMatches,
      cacheSize: this._previousMatches.size,
      oscillationHistorySize: this._matchHistory.length,
      isOscillating: this._matchHistory.length >= 4 &&
        new Set(this._matchHistory.slice(-this._maxHistorySize).map(m => m.id)).size >= this._oscillationThreshold
    };
  }

  savePrototypes() {
    try {
      fs.writeFileSync(this.prototypeFile, JSON.stringify(this.prototypes, null, 2));
    } catch (e) {
      console.error('[NarrativeRetriever] Save failed:', e.message);
    }
  }

  /**
   * 恢复原型健康状态（重置震荡检测、清空缓存）
   */
  resetMatchState() {
    this._matchHistory = [];
    this._previousMatches.clear();
    this._matchFrequency = {};
    this._totalMatches = 0;
    this.lastMatch = null;
  }

  getLastMatch() {
    return this.lastMatch;
  }

  getPrototypeCount() {
    return this.prototypes.metadata.count;
  }
}

module.exports = { NarrativeRetriever, MatchStatus, MatchErrorType };
