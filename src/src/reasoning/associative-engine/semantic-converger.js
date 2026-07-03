/**
 * L4 Semantic Converger — 思想凝结层 (v2.3.0)
 * 对前三层的所有激活节点进行加权聚合，生成统一的"思想向量"
 * 
 * v2.3.0 升级内容:
 *   - 输入验证：所有公共方法增加参数类型/结构校验，无效输入返回退化结果
 *   - 收敛质量评估：计算收敛质量分数，检测退化/低质量收敛
 *   - 振荡/漂移检测：与前一次收敛比较，检测思想不稳定（概念跳跃、情绪突变）
 *   - 置信度感知降级：置信度过低时自动切换简化策略
 *   - 多信号意图融合：融合概念强度、情绪、叙事匹配、趋势方向进行意图推断
 *   - 错误处理：try/catch 包裹，所有路径保证有结果返回
 *   - 概念情感扩展：扩展情感映射表 + 相似度匹配 + 语义回退机制
 */

'use strict';

class SemanticConverger {
  constructor() {
    this.lastConvergence = null;
    this.thoughtLog = [];
    this.convergenceHistory = [];       // 收敛历史，用于漂移检测
    this.oscillationCount = 0;           // 振荡计数器
    this.driftThreshold = 0.45;          // 漂移判定阈值
    this.maxConvergenceHistory = 10;     // 历史保留长度
  }

  /**
   * 验证输入参数的结构完整性
   * @private
   * @param {*} associations
   * @param {*} chunks
   * @param {*} narrative
   * @returns {{valid: boolean, errors: string[]}}
   */
  _validateInputs(associations, chunks, narrative) {
    const errors = [];
    let valid = true;

    // associations: 应是一个对象，或 null/undefined
    if (associations != null) {
      if (typeof associations !== 'object' || Array.isArray(associations)) {
        errors.push('associations 必须是对象类型');
        valid = false;
      } else if (associations.allAssociations != null && !Array.isArray(associations.allAssociations)) {
        errors.push('associations.allAssociations 必须是数组');
        valid = false;
      }
    }

    // chunks: 应是一个对象，或 null/undefined
    if (chunks != null) {
      if (typeof chunks !== 'object' || Array.isArray(chunks)) {
        errors.push('chunks 必须是对象类型');
        valid = false;
      } else if (chunks.chunks != null && !Array.isArray(chunks.chunks)) {
        errors.push('chunks.chunks 必须是数组');
        valid = false;
      }
    }

    // narrative: 可选对象或 null
    if (narrative != null && (typeof narrative !== 'object' || Array.isArray(narrative))) {
      errors.push('narrative 必须是对象类型或 null');
      valid = false;
    }

    return { valid, errors };
  }

  /**
   * 评估收敛质量，检测退化收敛
   * @private
   * @param {Object} convergenceResult
   * @returns {{quality: number, issues: string[], isDegenerate: boolean}}
   */
  _assessConvergenceQuality(convergenceResult) {
    const issues = [];
    const { thoughtVector, activatedConcepts, activatedIdioms } = convergenceResult;

    // 1. 概念数量检查
    if (activatedConcepts.length === 0) {
      issues.push('无激活概念');
    } else if (activatedConcepts.length < 3) {
      issues.push('概念数量过少');
    }

    // 2. 情感强度检查 — 如果所有维度接近0，表示情感信息不足
    const e = thoughtVector.emotion;
    const emotionMagnitude = Math.sqrt(e.pleasure * e.pleasure + e.arousal * e.arousal + e.dominance * e.dominance);
    if (emotionMagnitude < 0.5) {
      issues.push('情感信号微弱');
    }

    // 3. 置信度检查
    if (thoughtVector.confidence < 0.2) {
      issues.push('置信度过低');
    }

    // 4. 维度稀疏度 — 如果维度太多但强度都很低，表示注意力分散
    const dims = Object.keys(thoughtVector.dimensions);
    if (dims.length > 0) {
      const avgStrength = dims.reduce((s, d) => s + thoughtVector.dimensions[d], 0) / dims.length;
      if (avgStrength < 0.15) {
        issues.push('概念强度分布过于分散');
      }
    }

    // 5. 源贡献失衡 — 如果所有贡献来自单一源
    const contrib = thoughtVector.sourceContributions;
    const total = contrib.associations + contrib.idioms + contrib.narrative;
    if (total > 0) {
      const maxContrib = Math.max(contrib.associations, contrib.idioms, contrib.narrative);
      if (maxContrib / total > 0.9) {
        issues.push('信息源过于单一');
      }
    }

    const quality = Math.max(0, 1 - (issues.length * 0.2));
    return {
      quality,
      issues,
      isDegenerate: quality < 0.4
    };
  }

  /**
   * 检测思想振荡（与前一次收敛的概念跳跃度）
   * @private
   * @param {Object} currentResult
   * @returns {{oscillation: boolean, drift: number, previousTopConcepts: string[]}}
   */
  _detectOscillation(currentResult) {
    const result = {
      oscillation: false,
      drift: 0,
      previousTopConcepts: []
    };

    if (this.convergenceHistory.length === 0) {
      return result;
    }

    const previous = this.convergenceHistory[this.convergenceHistory.length - 1];
    const prevConcepts = (previous.activatedConcepts || []).map(c => c.concept);
    const currConcepts = (currentResult.activatedConcepts || []).map(c => c.concept);

    result.previousTopConcepts = prevConcepts.slice(0, 5);

    if (prevConcepts.length === 0 || currConcepts.length === 0) {
      return result;
    }

    // 计算概念重叠率
    const prevSet = new Set(prevConcepts);
    const currSet = new Set(currConcepts);
    const intersection = [...prevSet].filter(c => currSet.has(c));
    const union = new Set([...prevSet, ...currSet]);

    // Jaccard 相似度
    const jaccard = union.size > 0 ? intersection.length / union.size : 0;
    const drift = 1 - jaccard;

    result.drift = drift;

    // 如果概念重叠率低于阈值，判定为振荡
    if (drift > this.driftThreshold) {
      this.oscillationCount++;
      result.oscillation = this.oscillationCount >= 2; // 连续2次才判定
    } else {
      // 如果收敛了，降低振荡计数
      this.oscillationCount = Math.max(0, this.oscillationCount - 1);
    }

    return result;
  }

  /**
   * 思想凝结主函数
   */
  converge(associations, chunks, narrative) {
    // === 输入验证 ===
    const validation = this._validateInputs(associations, chunks, narrative);
    if (!validation.valid) {
      const errorResult = {
        thoughtVector: this._emptyThoughtVector(),
        activatedConcepts: [],
        activatedIdioms: [],
        matchedNarrative: null,
        understoodIntent: { intent: 'unknown', confidence: 0, emotionalBasis: { pleasure: 0, arousal: 0, dominance: 0 } },
        timestamp: new Date().toISOString(),
        quality: { quality: 0, issues: validation.errors, isDegenerate: true },
        oscillation: { oscillation: false, drift: 0, previousTopConcepts: [] },
        error: '输入验证失败: ' + validation.errors.join('; ')
      };
      this.lastConvergence = errorResult;
      this.thoughtLog.push(errorResult);
      if (this.thoughtLog.length > 30) this.thoughtLog.shift();
      return errorResult;
    }

    try {
      const activatedConcepts = this.extractActivatedConcepts(associations);
      const activatedIdioms = this.extractActivatedIdioms(chunks);
      const narrativeFramework = narrative?.matchedPrototype || null;

      // === 置信度感知降级：如果概念过少或输入质量低，使用简化策略 ===
      const useSimplifiedStrategy = activatedConcepts.length < 2 && !narrativeFramework;

      const thoughtVector = useSimplifiedStrategy
        ? this._computeSimplifiedThoughtVector(activatedConcepts, activatedIdioms, narrativeFramework, associations)
        : this.computeThoughtVector(activatedConcepts, activatedIdioms, narrativeFramework, associations);

      const understoodIntent = this.inferUserIntent(thoughtVector, chunks, activatedConcepts, activatedIdioms);

      const convergenceResult = {
        thoughtVector,
        activatedConcepts,
        activatedIdioms,
        matchedNarrative: narrativeFramework?.name || null,
        understoodIntent,
        timestamp: new Date().toISOString()
      };

      // === 收敛质量评估 ===
      const quality = this._assessConvergenceQuality(convergenceResult);
      convergenceResult.quality = quality;

      // === 振荡检测 ===
      const oscillation = this._detectOscillation(convergenceResult);
      convergenceResult.oscillation = oscillation;

      // === 如果检测到振荡，标记到意图中 ===
      if (oscillation.oscillation) {
        convergenceResult.understoodIntent.oscillationWarning = true;
        convergenceResult.understoodIntent.originalIntent = convergenceResult.understoodIntent.intent;
        convergenceResult.understoodIntent.intent = 'unstable_' + convergenceResult.understoodIntent.intent;
      }

      // === 如果收敛退化了，但仍有概念，使用简化策略重算 ===
      if (quality.isDegenerate && !useSimplifiedStrategy && activatedConcepts.length > 0) {
        const fallbackVector = this._computeSimplifiedThoughtVector(
          activatedConcepts, activatedIdioms, narrativeFramework, associations
        );
        convergenceResult.thoughtVector = fallbackVector;
        convergenceResult.understoodIntent = this.inferUserIntent(
          fallbackVector, chunks, activatedConcepts, activatedIdioms
        );
        convergenceResult.fallbackApplied = true;
      }

      this.lastConvergence = convergenceResult;
      this.thoughtLog.push(convergenceResult);

      // 保留历史，用于振荡检测
      this.convergenceHistory.push(convergenceResult);
      if (this.convergenceHistory.length > this.maxConvergenceHistory) {
        this.convergenceHistory.shift();
      }

      if (this.thoughtLog.length > 30) {
        this.thoughtLog.shift();
      }

      return convergenceResult;

    } catch (err) {
      // === 错误处理：保证所有路径都有返回 ===
      const errorResult = {
        thoughtVector: this._emptyThoughtVector(),
        activatedConcepts: [],
        activatedIdioms: [],
        matchedNarrative: null,
        understoodIntent: { intent: 'unknown', confidence: 0, emotionalBasis: { pleasure: 0, arousal: 0, dominance: 0 } },
        timestamp: new Date().toISOString(),
        quality: { quality: 0, issues: ['收敛异常: ' + err.message], isDegenerate: true },
        oscillation: { oscillation: false, drift: 0, previousTopConcepts: [] },
        error: '收敛过程异常: ' + err.message
      };
      this.lastConvergence = errorResult;
      this.thoughtLog.push(errorResult);
      if (this.thoughtLog.length > 30) this.thoughtLog.shift();
      return errorResult;
    }
  }

  /**
   * 空思维向量（用于降级场景）
   * @private
   */
  _emptyThoughtVector() {
    return {
      dimensions: {},
      emotion: { pleasure: 0, arousal: 0, dominance: 0 },
      confidence: 0,
      sourceContributions: { associations: 0, idioms: 0, narrative: 0 }
    };
  }

  /**
   * 简化版思维向量计算（低概念数量时使用）
   * @private
   */
  _computeSimplifiedThoughtVector(concepts, idioms, narrative, associations) {
    const vector = this._emptyThoughtVector();

    for (const concept of concepts) {
      vector.dimensions[concept.concept] = concept.strength;
      vector.sourceContributions.associations += concept.strength * 0.6;
    }

    if (idioms.length > 0) {
      vector.sourceContributions.idioms += 0.3;
    }

    if (narrative) {
      vector.sourceContributions.narrative += 0.4;
    }

    vector.confidence = Math.min(0.4, (concepts.length * 0.05) + (idioms.length * 0.1) + (narrative ? 0.15 : 0));
    return vector;
  }

  extractActivatedConcepts(associations) {
    const concepts = [];

    if (!associations || !associations.allAssociations) {
      return concepts;
    }

    if (!Array.isArray(associations.allAssociations)) {
      return concepts;
    }

    const assocByWord = {};
    for (const assoc of associations.allAssociations) {
      if (!assoc || typeof assoc !== 'object') continue;
      if (typeof assoc.strength !== 'number' || assoc.strength <= 0.2) continue;
      const word = assoc.word;
      if (!word || typeof word !== 'string') continue;

      if (!assocByWord[word]) {
        assocByWord[word] = {
          word: word,
          relations: [],
          totalStrength: 0
        };
      }
      if (assoc.relation) {
        assocByWord[word].relations.push(assoc.relation);
      }
      assocByWord[word].totalStrength += assoc.strength;
    }

    for (const [word, data] of Object.entries(assocByWord)) {
      concepts.push({
        concept: word,
        relations: [...new Set(data.relations)],
        strength: Math.min(1, data.totalStrength)
      });
    }

    concepts.sort((a, b) => b.strength - a.strength);
    return concepts.slice(0, 15);
  }

  extractActivatedIdioms(chunks) {
    const idioms = [];

    if (!chunks || !chunks.chunks) {
      return idioms;
    }

    if (!Array.isArray(chunks.chunks)) {
      return idioms;
    }

    for (const chunk of chunks.chunks) {
      if (!chunk || typeof chunk !== 'object') continue;
      if (chunk.type === 'idiom') {
        idioms.push({
          text: chunk.text || '',
          meaning: chunk.data?.meaning || '',
          story: chunk.data?.story || '',
          startIndex: typeof chunk.startIndex === 'number' ? chunk.startIndex : -1
        });
      }
    }

    return idioms;
  }

  computeThoughtVector(concepts, idioms, narrative, associations) {
    const vector = {
      dimensions: {},
      emotion: { pleasure: 0, arousal: 0, dominance: 0 },
      confidence: 0,
      sourceContributions: {
        associations: 0,
        idioms: 0,
        narrative: 0
      }
    };

    // 概念贡献
    for (const concept of concepts) {
      const weight = concept.strength * 0.6;
      vector.dimensions[concept.concept] = concept.strength;
      vector.sourceContributions.associations += weight;

      const emotion = this.getConceptEmotion(concept.concept);
      vector.emotion.pleasure += emotion.pleasure * weight;
      vector.emotion.arousal += emotion.arousal * weight;
      vector.emotion.dominance += emotion.dominance * weight;
    }

    // 习语贡献
    for (const idiom of idioms) {
      vector.sourceContributions.idioms += 0.3;
      const idiomEmotion = this.getIdiomEmotion(idiom.meaning);
      vector.emotion.pleasure += idiomEmotion.pleasure * 0.2;
      vector.emotion.arousal += idiomEmotion.arousal * 0.2;
      vector.emotion.dominance += idiomEmotion.dominance * 0.2;
    }

    // 叙事贡献
    if (narrative) {
      vector.sourceContributions.narrative += 0.4;
      const narrativeEmotion = this.getNarrativeEmotion(narrative.framework);
      vector.emotion.pleasure += narrativeEmotion.pleasure * 0.3;
      vector.emotion.arousal += narrativeEmotion.arousal * 0.3;
      vector.emotion.dominance += narrativeEmotion.dominance * 0.3;
    }

    // 归一化情感
    const totalContributions = vector.sourceContributions.associations +
                              vector.sourceContributions.idioms +
                              vector.sourceContributions.narrative;

    if (totalContributions > 0) {
      vector.emotion.pleasure /= (totalContributions + 1);
      vector.emotion.arousal /= (totalContributions + 1);
      vector.emotion.dominance /= (totalContributions + 1);
    }

    // 边界裁剪
    vector.emotion.pleasure = Math.max(-10, Math.min(10, vector.emotion.pleasure));
    vector.emotion.arousal = Math.max(-10, Math.min(10, vector.emotion.arousal));
    vector.emotion.dominance = Math.max(-10, Math.min(10, vector.emotion.dominance));

    // 置信度计算
    vector.confidence = Math.min(1, (concepts.length * 0.05) +
                                      (idioms.length * 0.15) +
                                      (narrative ? 0.3 : 0));

    return vector;
  }

  /**
   * 概念 → 情感映射（带语义相似度匹配和回退）
   */
  getConceptEmotion(concept) {
    if (!concept || typeof concept !== 'string') {
      return { pleasure: 0, arousal: 0, dominance: 0 };
    }

    const emotionMap = {
      '心流': { pleasure: 5, arousal: 4, dominance: 3 },
      '专注': { pleasure: 3, arousal: 5, dominance: 4 },
      '愉悦': { pleasure: 6, arousal: 3, dominance: 2 },
      '创造': { pleasure: 5, arousal: 6, dominance: 4 },
      '烦恼': { pleasure: -4, arousal: 2, dominance: -2 },
      '困惑': { pleasure: -2, arousal: 3, dominance: -3 },
      '成功': { pleasure: 7, arousal: 5, dominance: 5 },
      '失败': { pleasure: -5, arousal: 2, dominance: -4 },
      '希望': { pleasure: 6, arousal: 4, dominance: 3 },
      '恐惧': { pleasure: -6, arousal: 6, dominance: -5 },
      '愤怒': { pleasure: -5, arousal: 7, dominance: 3 },
      '平静': { pleasure: 4, arousal: 1, dominance: 2 },
      '悲伤': { pleasure: -5, arousal: 1, dominance: -3 },
      '惊讶': { pleasure: 2, arousal: 7, dominance: 1 },
      '厌恶': { pleasure: -4, arousal: 3, dominance: -1 },
      '爱':   { pleasure: 8, arousal: 4, dominance: 2 },
      '恨':   { pleasure: -7, arousal: 5, dominance: 4 },
      '信任': { pleasure: 6, arousal: 2, dominance: 4 },
      '怀疑': { pleasure: -2, arousal: 3, dominance: -2 },
      '期待': { pleasure: 4, arousal: 5, dominance: 2 },
      '回忆': { pleasure: 3, arousal: 2, dominance: 1 },
      '梦想': { pleasure: 7, arousal: 6, dominance: 3 },
      '孤独': { pleasure: -4, arousal: 1, dominance: -4 },
      '温暖': { pleasure: 6, arousal: 2, dominance: 3 },
      '痛苦': { pleasure: -7, arousal: 3, dominance: -5 },
      '成长': { pleasure: 5, arousal: 4, dominance: 4 },
      '停滞': { pleasure: -3, arousal: 1, dominance: -2 },
      '自由': { pleasure: 7, arousal: 5, dominance: 6 },
      '束缚': { pleasure: -4, arousal: 3, dominance: -5 },
      '智慧': { pleasure: 5, arousal: 2, dominance: 5 }
    };

    // 1. 精确匹配
    for (const [key, emotion] of Object.entries(emotionMap)) {
      if (concept.includes(key)) {
        return emotion;
      }
    }

    // 2. 语义组匹配（基于共同主题）
    const semanticGroups = [
      { keywords: ['积极', '正面', '好', '快乐', '开心', '高兴', '幸福', '喜悦'], emotion: { pleasure: 5, arousal: 3, dominance: 2 } },
      { keywords: ['消极', '负面', '坏', '难受', '痛苦', '绝望', '沮丧'], emotion: { pleasure: -5, arousal: 2, dominance: -3 } },
      { keywords: ['思考', '想', '思考', '反思', '反省', '琢磨', '思索'], emotion: { pleasure: 1, arousal: 3, dominance: 2 } },
      { keywords: ['行动', '做', '执行', '动手', '实践', '实现'], emotion: { pleasure: 3, arousal: 5, dominance: 4 } },
      { keywords: ['社交', '人', '朋友', '家人', '陪伴', '对话', '交流'], emotion: { pleasure: 4, arousal: 3, dominance: 1 } },
      { keywords: ['工作', '任务', '项目', '完成', '效率', '生产力'], emotion: { pleasure: 2, arousal: 4, dominance: 3 } },
      { keywords: ['学习', '知识', '理解', '明白', '懂', '学会', '掌握'], emotion: { pleasure: 4, arousal: 3, dominance: 3 } },
      { keywords: ['健康', '身体', '病', '疼痛', '恢复', '康复'], emotion: { pleasure: 1, arousal: 2, dominance: 1 } }
    ];

    for (const group of semanticGroups) {
      for (const kw of group.keywords) {
        if (concept.includes(kw)) {
          return group.emotion;
        }
      }
    }

    // 3. 中性回退
    return { pleasure: 0, arousal: 0, dominance: 0 };
  }

  getIdiomEmotion(meaning) {
    if (!meaning || typeof meaning !== 'string') return { pleasure: 0, arousal: 0, dominance: 0 };

    const positive = ['成功', '胜利', '快乐', '美好', '成长', '喜悦', '希望', '幸福'];
    const negative = ['失败', '困难', '痛苦', '失去', '绝望', '悲伤', '恐惧', '愤怒'];

    for (const p of positive) {
      if (meaning.includes(p)) {
        return { pleasure: 3, arousal: 2, dominance: 1 };
      }
    }
    for (const n of negative) {
      if (meaning.includes(n)) {
        return { pleasure: -3, arousal: 2, dominance: -1 };
      }
    }

    return { pleasure: 0, arousal: 0, dominance: 0 };
  }

  getNarrativeEmotion(framework) {
    if (!framework || typeof framework !== 'string') return { pleasure: 0, arousal: 0, dominance: 0 };

    const positiveFrameworks = ['英雄之旅', '顿悟时刻', '失而复得', '渐入佳境', '圆满结局', '突破'];
    const negativeFrameworks = ['困境', '失去', '失败', '悲剧', '冲突', '危机'];

    for (const p of positiveFrameworks) {
      if (framework.includes(p)) {
        return { pleasure: 4, arousal: 3, dominance: 2 };
      }
    }
    for (const n of negativeFrameworks) {
      if (framework.includes(n)) {
        return { pleasure: -3, arousal: 3, dominance: -2 };
      }
    }

    return { pleasure: 0, arousal: 0, dominance: 0 };
  }

  /**
   * 多信号意图融合推断
   * @param {Object} thoughtVector
   * @param {Object} chunks
   * @param {Array} concepts - 激活概念（用于额外信号）
   * @param {Array} idioms - 激活习语（用于额外信号）
   */
  inferUserIntent(thoughtVector, chunks, concepts, idioms) {
    // 处理退化输入
    if (!thoughtVector || !thoughtVector.emotion) {
      return { intent: 'unknown', confidence: 0, emotionalBasis: { pleasure: 0, arousal: 0, dominance: 0 } };
    }

    const emotion = thoughtVector.emotion;
    concepts = concepts || [];
    idioms = idioms || [];

    // === 信号采集 ===
    const signals = [];

    // 信号1: 情感极性
    if (emotion.pleasure > 3) signals.push({ type: 'positive_emotion', weight: 0.25 });
    if (emotion.pleasure < -3) signals.push({ type: 'negative_emotion', weight: 0.25 });
    if (emotion.arousal > 4) signals.push({ type: 'high_arousal', weight: 0.2 });

    // 信号2: 概念强度分布
    const dims = Object.keys(thoughtVector.dimensions || {});
    const topConcepts = concepts.slice(0, 3).map(c => c.concept);
    if (topConcepts.some(c => /^(什么|为什么|怎么|如何|是否|吗|呢|吗|哪)/.test(c))) {
      signals.push({ type: 'question_keyword', weight: 0.3 });
    }
    if (topConcepts.some(c => /^(我|自己|我的)/.test(c))) {
      signals.push({ type: 'self_reference', weight: 0.15 });
    }

    // 信号3: 习语中的意图线索
    if (idioms.some(i => (i.meaning || '').includes('问') || (i.text || '').includes('?'))) {
      signals.push({ type: 'question_idiom', weight: 0.2 });
    }
    if (idioms.some(i => (i.meaning || '').includes('帮助') || (i.meaning || '').includes('请求'))) {
      signals.push({ type: 'help_request', weight: 0.2 });
    }

    // 信号4: chunks 中的直接意图
    if (chunks && chunks.chunks) {
      const chunkTexts = chunks.chunks
        .filter(c => c && c.text)
        .map(c => c.text);
      const fullText = chunkTexts.join(' ');
      if (/^(为什么|怎么|如何|是否|什么|多少|谁|哪里|何时)/.test(fullText.trim())) {
        signals.push({ type: 'direct_question', weight: 0.35 });
      }
      if (/^(请|帮|能|可以)/.test(fullText.trim())) {
        signals.push({ type: 'request', weight: 0.3 });
      }
    }

    // === 信号融合 ===
    let intentScore = { explore: 0.2 }; // 默认基线

    // 情感驱动意图
    if (emotion.pleasure > 3) intentScore.share_joy = (intentScore.share_joy || 0) + 0.3;
    if (emotion.pleasure < -3) intentScore.seek_support = (intentScore.seek_support || 0) + 0.3;
    if (emotion.arousal > 4) intentScore.urgent = (intentScore.urgent || 0) + 0.25;

    // 信号驱动意图调整
    for (const signal of signals) {
      switch (signal.type) {
        case 'question_keyword':
        case 'question_idiom':
        case 'direct_question':
          intentScore.question = (intentScore.question || 0) + signal.weight;
          break;
        case 'help_request':
        case 'request':
          intentScore.request = (intentScore.request || 0) + signal.weight;
          break;
        case 'self_reference':
          intentScore.reflection = (intentScore.reflection || 0) + signal.weight;
          break;
        case 'positive_emotion':
          intentScore.share_joy = (intentScore.share_joy || 0) + signal.weight * 0.5;
          break;
        case 'negative_emotion':
          intentScore.seek_support = (intentScore.seek_support || 0) + signal.weight * 0.5;
          break;
        default:
          break;
      }
    }

    // 选择最高分意图
    let topIntent = 'explore';
    let topScore = 0;
    for (const [intent, score] of Object.entries(intentScore)) {
      if (score > topScore) {
        topScore = score;
        topIntent = intent;
      }
    }

    // 置信度：基于信号数量和情感强度
    const signalConfidence = Math.min(1, signals.length * 0.12 + Math.abs(emotion.pleasure) * 0.03);
    const finalConfidence = Math.min(1, (thoughtVector.confidence + signalConfidence) / 2);

    return {
      intent: topIntent,
      confidence: Math.round(finalConfidence * 100) / 100,
      emotionalBasis: emotion,
      signalsUsed: signals.map(s => s.type),
      conceptDriven: topConcepts
    };
  }

  /**
   * 生成思想凝结内部日志
   */
  generateThoughtLog(convergenceResult) {
    if (!convergenceResult) {
      return { error: '无收敛结果' };
    }

    const log = {
      timestamp: convergenceResult.timestamp,
      activatedConcepts: (convergenceResult.activatedConcepts || []).slice(0, 5).map(c => c.concept),
      activatedIdioms: (convergenceResult.activatedIdioms || []).map(i => i.text),
      matchedStory: convergenceResult.matchedNarrative,
      understoodIntent: convergenceResult.understoodIntent?.intent || 'unknown',
      emotionVector: convergenceResult.thoughtVector?.emotion || { pleasure: 0, arousal: 0, dominance: 0 },
      confidence: convergenceResult.thoughtVector?.confidence || 0,
      quality: convergenceResult.quality?.quality || 0,
      oscillation: convergenceResult.oscillation?.oscillation || false,
      drift: convergenceResult.oscillation?.drift || 0,
      fallbackApplied: convergenceResult.fallbackApplied || false,
      hasError: !!convergenceResult.error
    };

    return log;
  }

  getLastConvergence() {
    return this.lastConvergence;
  }

  getThoughtLog() {
    return this.thoughtLog.slice(-10);
  }

  /**
   * 重置收敛状态（用于新会话或清理）
   */
  reset() {
    this.lastConvergence = null;
    this.thoughtLog = [];
    this.convergenceHistory = [];
    this.oscillationCount = 0;
  }
}

module.exports = { SemanticConverger };
