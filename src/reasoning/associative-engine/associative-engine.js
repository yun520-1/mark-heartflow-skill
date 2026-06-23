/**
 * Associative Engine - 人类式逐词联想理解与生成引擎
 * 整合L1-L5五个层次
 * v2.0.58 — 新增: 输入验证/错误隔离/层间一致性检查/并行处理/质量度量/优雅降级
 */

const path = require('path');

/** 层间一致性检查的阈值 */
const COHERENCE_THRESHOLD = 0.3;

/** 层状态枚举 */
const LayerStatus = {
  SUCCESS: 'success',
  DEGRADED: 'degraded',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

/** 输入验证结果 */
class InputValidation {
  constructor(input) {
    this.raw = input;
    this.isValid = true;
    this.normalized = input;
    this.issues = [];
    this._validate();
  }

  _validate() {
    if (!this.raw || typeof this.raw !== 'string') {
      this.isValid = false;
      this.issues.push({ type: 'invalid_type', message: '输入必须是字符串' });
      return;
    }
    const trimmed = this.raw.trim();
    if (trimmed.length === 0) {
      this.isValid = false;
      this.issues.push({ type: 'empty_input', message: '输入为空' });
      return;
    }
    if (trimmed.length < 2) {
      this.issues.push({ type: 'too_short', message: `输入过短(${trimmed.length}字符)，联想效果可能不佳` });
    }
    if (trimmed.length > 10000) {
      this.issues.push({ type: 'too_long', message: `输入过长(${trimmed.length}字符)，将截断至10000字符` });
      this.normalized = trimmed.slice(0, 10000);
    } else {
      this.normalized = trimmed;
    }
  }

  getStatus() {
    if (!this.isValid) return 'invalid';
    if (this.issues.length > 0) return 'warning';
    return 'clean';
  }
}

/** 层间一致性检查器 */
class CoherenceChecker {
  /**
   * 检查L1(词联想)和L2(短语检测)之间的一致性
   */
  static checkLexicalChunkCoherence(l1Result, l2Result) {
    if (!l1Result || !l2Result) return { coherent: false, score: 0, issues: ['缺少层结果'] };
    const issues = [];
    const l1Words = (l1Result.words || []).map(w => w.toLowerCase());
    const l2Chunks = (l2Result.chunks || []).map(c => (c.text || '').toLowerCase());

    if (l1Words.length === 0 && l2Chunks.length > 0) {
      issues.push('L1无词汇但L2检测到语块，可能不一致');
    }

    // 检查L2语块是否来自L1词汇
    for (const chunk of l2Chunks) {
      const chunkChars = chunk.split('');
      const allCharsInL1 = chunkChars.every(c => l1Words.some(w => w.includes(c)));
      if (!allCharsInL1 && chunkChars.length > 1) {
        issues.push(`L2语块"${chunk}"的部分字符不在L1词汇中`);
      }
    }

    const score = issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2);
    return { coherent: score >= COHERENCE_THRESHOLD, score, issues };
  }

  /**
   * 检查L2(短语)和L3(叙事)之间的一致性
   */
  static checkNarrativeChunkCoherence(l2Result, l3Result) {
    if (!l2Result || !l3Result) return { coherent: false, score: 0, issues: ['缺少层结果'] };
    const issues = [];
    const l2Text = (l2Result.originalText || '').toLowerCase();

    // 检查L3匹配的叙事原型是否与输入文本有关联
    const matchedName = l3Result.matchedPrototype?.name || '';
    if (matchedName && l2Text.length > 0) {
      const nameParts = matchedName.toLowerCase().split(/[\s_]+/);
      const overlap = nameParts.filter(p => l2Text.includes(p));
      if (overlap.length === 0 && nameParts.length > 1) {
        issues.push(`L3叙事"${matchedName}"与输入文本无直接词汇重叠`);
      }
    }

    const score = issues.length === 0 ? 1.0 : 0.5;
    return { coherent: score >= COHERENCE_THRESHOLD, score, issues };
  }

  /**
   * 综合评估L4思想向量的一致性
   */
  static checkThoughtVectorCoherence(l4Result) {
    if (!l4Result || !l4Result.thoughtVector) {
      return { coherent: false, score: 0, issues: ['缺少L4思想向量'] };
    }
    const issues = [];
    const tv = l4Result.thoughtVector;

    // 检查情感向量的合理性
    if (tv.emotion) {
      const { pleasure, arousal, dominance } = tv.emotion;
      if (typeof pleasure === 'number' && (pleasure < -1 || pleasure > 1)) {
        issues.push(`情感pleasure值${pleasure}超出[-1,1]范围`);
      }
      if (typeof arousal === 'number' && (arousal < -1 || arousal > 1)) {
        issues.push(`情感arousal值${arousal}超出[-1,1]范围`);
      }
      if (typeof dominance === 'number' && (dominance < -1 || dominance > 1)) {
        issues.push(`情感dominance值${dominance}超出[-1,1]范围`);
      }
    }

    // 检查概念激活的合理性
    if (tv.activatedConcepts && tv.activatedConcepts.length > 0) {
      const invalidConcepts = tv.activatedConcepts.filter(c => !c || (typeof c === 'object' && !c.name));
      if (invalidConcepts.length > 0) {
        issues.push(`${invalidConcepts.length}个激活概念格式无效`);
      }
    }

    const score = issues.length === 0 ? 1.0 : Math.max(0.3, 1.0 - issues.length * 0.15);
    return { coherent: score >= COHERENCE_THRESHOLD, score, issues };
  }

  /**
   * 运行所有层间一致性检查
   */
  static runAllChecks(layers) {
    const results = {};
    const allIssues = [];

    if (layers.L1 && layers.L2) {
      results.lexicalChunk = this.checkLexicalChunkCoherence(layers.L1, layers.L2);
      allIssues.push(...results.lexicalChunk.issues.map(i => `[L1↔L2] ${i}`));
    }
    if (layers.L2 && layers.L3) {
      results.narrativeChunk = this.checkNarrativeChunkCoherence(layers.L2, layers.L3);
      allIssues.push(...results.narrativeChunk.issues.map(i => `[L2↔L3] ${i}`));
    }
    if (layers.L4) {
      results.thoughtVector = this.checkThoughtVectorCoherence(layers.L4);
      allIssues.push(...results.thoughtVector.issues.map(i => `[L4] ${i}`));
    }

    const totalChecks = Object.keys(results).length;
    const coherentCount = Object.values(results).filter(r => r.coherent).length;
    const overallScore = totalChecks > 0 ? coherentCount / totalChecks : 1.0;

    return {
      overallCoherent: overallScore >= COHERENCE_THRESHOLD,
      overallScore,
      detail: results,
      allIssues
    };
  }
}

/** 处理质量度量器 */
class ProcessingMetrics {
  constructor() {
    this.layerTimes = {};
    this.layerStatuses = {};
    this.startTime = 0;
    this.totalTime = 0;
    this.coherenceScore = 1.0;
    this.confidenceScore = 1.0;
  }

  start() {
    this.startTime = Date.now();
  }

  recordLayer(layerName, startTime, status = LayerStatus.SUCCESS) {
    const elapsed = Date.now() - startTime;
    this.layerTimes[layerName] = elapsed;
    this.layerStatuses[layerName] = status;
  }

  setCoherence(score) {
    this.coherenceScore = score;
  }

  getSummary() {
    this.totalTime = Date.now() - this.startTime;

    const totalLayerTime = Object.values(this.layerTimes).reduce((a, b) => a + b, 0);
    const failedLayers = Object.entries(this.layerStatuses)
      .filter(([_, s]) => s === LayerStatus.FAILED)
      .map(([name]) => name);
    const degradedLayers = Object.entries(this.layerStatuses)
      .filter(([_, s]) => s === LayerStatus.DEGRADED)
      .map(([name]) => name);

    return {
      totalTime: this.totalTime,
      layerBreakdown: { ...this.layerTimes },
      layerStatuses: { ...this.layerStatuses },
      failedLayers,
      degradedLayers,
      coherenceScore: this.coherenceScore,
      overhead: this.totalTime - totalLayerTime,
      qualityScore: Math.round(
        (this.coherenceScore * 0.4 +
         (failedLayers.length === 0 ? 0.3 : 0) +
         (degradedLayers.length === 0 ? 0.15 : 0.05) +
         (totalLayerTime > 0 ? Math.min(0.15, 5 / totalLayerTime * 0.15) : 0)) * 100
      ) / 100
    };
  }
}

class AssociativeEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    const { LexicalAssociator } = require('./lexical-associator');
    const { ChunkDetector } = require('./chunk-detector');
    const { NarrativeRetriever } = require('./narrative-retriever');
    const { SemanticConverger } = require('./semantic-converger');
    const { WordByWordGenerator } = require('./word-by-word-generator');

    this.lexicalAssociator = new LexicalAssociator(projectRoot);
    this.chunkDetector = new ChunkDetector(projectRoot);
    this.narrativeRetriever = new NarrativeRetriever(projectRoot);
    this.semanticConverger = new SemanticConverger();
    this.wordByWordGenerator = new WordByWordGenerator(projectRoot);
    
    this.lastProcessing = null;
    this.processingLog = [];
    this.metricsHistory = [];
    this.totalProcessed = 0;
    this.successfulProcessed = 0;
  }

  /**
   * 输入预处理与验证
   */
  _preprocessInput(input) {
    const validation = new InputValidation(input);
    if (!validation.isValid) {
      return {
        normalized: '',
        validation,
        status: 'invalid'
      };
    }
    return {
      normalized: validation.normalized,
      validation,
      status: validation.getStatus()
    };
  }

  /**
   * 安全执行层处理，带错误隔离
   */
  async _safeExecuteLayer(layerName, fn, fallbackResult) {
    const start = Date.now();
    try {
      const result = await fn();
      this.metrics.recordLayer(layerName, start, LayerStatus.SUCCESS);
      return { result, status: LayerStatus.SUCCESS, error: null };
    } catch (e) {
      console.error(`[AssociativeEngine] ${layerName} 失败:`, e.message);
      this.metrics.recordLayer(layerName, start, LayerStatus.FAILED);
      return {
        result: fallbackResult,
        status: LayerStatus.FAILED,
        error: e.message
      };
    }
  }

  /**
   * 并行执行L1和L2（两者都接受原始输入，互不依赖）
   */
  async _runParallelLayers(normalizedInput) {
    const l1Start = Date.now();
    const l2Start = Date.now();

    const [l1Result, l2Result] = await Promise.all([
      this._safeExecuteLayer('L1', () => 
        Promise.resolve(this.lexicalAssociator.associateSequence(normalizedInput))
      , { words: [], allAssociations: [], timestamp: new Date().toISOString() }),
      this._safeExecuteLayer('L2', () =>
        Promise.resolve(this.chunkDetector.detectChunks(normalizedInput))
      , { originalText: normalizedInput, chunks: [], tokenCount: 0, timestamp: new Date().toISOString() })
    ]);

    return { l1Result, l2Result };
  }

  /**
   * 处理后的结果降级（当关键层失败时提供有意义的回退）
   */
  _buildDegradedResponse(layers, coherence) {
    const hasL1 = layers.L1 && layers.L1Status !== LayerStatus.FAILED;
    const hasL5 = layers.L5 && layers.L5Status !== LayerStatus.FAILED;

    if (!hasL1 && !hasL5) {
      return {
        response: '我暂时无法理解你的意思，请换一种方式表达。',
        internal: {
          degraded: true,
          reason: 'L1和L5层均失败，无法完成处理',
          layers: layers
        },
        processingTime: this.metrics.totalTime
      };
    }

    if (hasL5) {
      return {
        response: layers.L5.response || '(思考中...)',
        internal: {
          degraded: true,
          reason: '部分层处理失败，结果可能不完整',
          failedLayers: this.metrics.getSummary().failedLayers,
          coherence: coherence,
          layers: layers
        },
        processingTime: this.metrics.totalTime
      };
    }

    return {
      response: `关于"${layers.L1?.words?.slice(0, 3)?.join(' ') || ''}"...`,
      internal: {
        degraded: true,
        reason: '仅有部分层完成处理',
        layers: layers
      },
      processingTime: this.metrics.totalTime
    };
  }

  /**
   * 完整处理流程
   */
  async process(userInput, userModel = {}) {
    this.metrics = new ProcessingMetrics();
    this.metrics.start();
    const processingStart = Date.now();
    this.totalProcessed++;
    
    const trace = {
      timestamp: new Date().toISOString(),
      userInput,
      layers: {},
      validation: null,
      coherence: null,
      degraded: false
    };

    try {
      // 步骤1: 输入预处理
      const preprocess = this._preprocessInput(userInput);
      trace.validation = {
        issues: preprocess.validation.issues,
        status: preprocess.status
      };

      if (preprocess.status === 'invalid') {
        this.successfulProcessed++;
        const response = preprocess.validation.issues[0]?.message === '输入为空'
          ? '请说些什么，我在这里倾听。'
          : '请提供有效的文字输入。';
        return {
          response,
          internal: {
            validationError: true,
            issues: preprocess.validation.issues,
            inputStatus: preprocess.status
          },
          processingTime: Date.now() - processingStart
        };
      }

      const normalizedInput = preprocess.normalized;

      // 步骤2: 并行执行L1(词联想)和L2(短语检测)
      const { l1Result, l2Result } = await this._runParallelLayers(normalizedInput);
      trace.layers.L1 = l1Result.result;
      trace.layers.L2 = l2Result.result;
      trace.layers.L1Status = l1Result.status;
      trace.layers.L2Status = l2Result.status;

      // 步骤3: L3叙事编织（依赖L1+L2）
      const semanticInput = {
        associations: trace.layers.L1.allAssociations || [],
        coreConcepts: (trace.layers.L1.allAssociations || []).map(a => a.word).filter((w, i, arr) => arr.indexOf(w) === i)
      };
      const l3Result = await this._safeExecuteLayer('L3', () =>
        Promise.resolve(this.narrativeRetriever.matchNarrative(semanticInput, trace.layers.L2.chunks))
      , { matchedPrototype: null, confidence: 0, alternativeMatches: [] });
      trace.layers.L3 = l3Result.result;
      trace.layers.L3Status = l3Result.status;

      // 步骤4: L4思想凝结
      const l4Result = await this._safeExecuteLayer('L4', () =>
        Promise.resolve(this.semanticConverger.converge(
          trace.layers.L1, trace.layers.L2, trace.layers.L3
        ))
      , {
        thoughtVector: { emotion: { pleasure: 0, arousal: 0, dominance: 0 }, activatedConcepts: [], activatedIdioms: [] },
        understoodIntent: 'unknown',
        matchedNarrative: null
      });
      trace.layers.L4 = l4Result.result;
      trace.layers.L4Status = l4Result.status;

      // 步骤5: 层间一致性检查
      const coherence = CoherenceChecker.runAllChecks({
        L1: trace.layers.L1,
        L2: trace.layers.L2,
        L3: trace.layers.L3,
        L4: trace.layers.L4
      });
      trace.coherence = coherence;
      this.metrics.setCoherence(coherence.overallScore);

      // 步骤6: L5逐词生成
      const l5Result = await this._safeExecuteLayer('L5', () =>
        this.wordByWordGenerator.generateResponse(trace.layers.L4.thoughtVector, userModel)
      , { response: '我在思考...', wordCount: 0, trace: [] });
      trace.layers.L5 = l5Result.result;
      trace.layers.L5Status = l5Result.status;

      trace.totalTime = Date.now() - processingStart;
      this.lastProcessing = trace;
      this.processingLog.push(trace);
      
      if (this.processingLog.length > 20) {
        this.processingLog.shift();
      }

      // ── SkillSpector fix: 存储后立即脱敏，删除 userInput 字段 ──
      // 防止跨会话数据泄露，仅保留引擎处理结果（不含原始用户输入）
      if (this.lastProcessing) {
        delete this.lastProcessing.userInput;
      }
      for (const entry of this.processingLog) {
        delete entry.userInput;
      }

      // 判断是否降级
      const summary = this.metrics.getSummary();
      const isDegraded = summary.failedLayers.length > 0 || summary.degradedLayers.length > 0;
      trace.degraded = isDegraded;

      if (isDegraded) {
        this.metricsHistory.push(summary);
        if (this.metricsHistory.length > 50) this.metricsHistory.shift();
        return this._buildDegradedResponse(trace.layers, coherence);
      }

      this.successfulProcessed++;
      this.metricsHistory.push(summary);
      if (this.metricsHistory.length > 50) this.metricsHistory.shift();

      return {
        response: trace.layers.L5.response,
        internal: {
          layers: trace.layers,
          thoughtLog: this.semanticConverger.generateThoughtLog(trace.layers.L4),
          wordTrace: trace.layers.L5.trace,
          coherence: {
            score: coherence.overallScore,
            issues: coherence.allIssues
          },
          metrics: summary
        },
        processingTime: trace.totalTime
      };
      
    } catch (e) {
      console.error('[AssociativeEngine] 严重错误:', e.message);
      this.totalProcessed++;
      return {
        response: '我正在思考如何回应你...',
        internal: { error: e.message, degraded: true },
        processingTime: Date.now() - processingStart
      };
    }
  }

  /**
   * L1: 词素感知层
   */
  processL1(userInput) {
    return this.lexicalAssociator.associateSequence(userInput);
  }

  /**
   * L2: 短语整合层
   */
  processL2(userInput) {
    return this.chunkDetector.detectChunks(userInput);
  }

  /**
   * L3: 叙事编织层
   */
  processL3(semanticVector, chunks) {
    return this.narrativeRetriever.matchNarrative(semanticVector, chunks);
  }

  /**
   * L4: 思想凝结层
   */
  processL4(associations, chunks, narrative) {
    return this.semanticConverger.converge(associations, chunks, narrative);
  }

  /**
   * L5: 逐词回复生成层
   */
  async processL5(thoughtVector, userModel) {
    return this.wordByWordGenerator.generateResponse(thoughtVector, userModel);
  }

  /**
   * 获取完整轨迹 (/flow trace) — 已脱敏，去掉 userInput 敏感字段
   */
  getFullTrace() {
    if (!this.lastProcessing) {
      return { status: 'no_processing', message: '无最近处理记录' };
    }
    
    const t = this.lastProcessing;
    
    return {
      timestamp: t.timestamp,
      validation: t.validation ? {
        issues: t.validation.issues,
        status: t.validation.status
      } : null,
      degraded: t.degraded,
      coherence: t.coherence ? {
        overallScore: t.coherence.overallScore,
        overallCoherent: t.coherence.overallCoherent,
        issueCount: t.coherence.allIssues.length,
        issues: t.coherence.allIssues.slice(0, 10)
      } : null,
      L1_associations: {
        wordCount: t.layers.L1.words?.length || 0,
        sample: t.layers.L1.allAssociations?.slice(0, 5) || [],
        status: t.layers.L1Status
      },
      L2_chunks: {
        detected: t.layers.L2.chunks?.length || 0,
        items: t.layers.L2.chunks || [],
        status: t.layers.L2Status
      },
      L3_narrative: {
        matched: t.layers.L3.matchedPrototype?.name || '无匹配',
        confidence: t.layers.L3.confidence,
        alternatives: t.layers.L3.alternativeMatches,
        status: t.layers.L3Status
      },
      L4_convergence: {
        coreConcepts: t.layers.L4.thoughtVector?.activatedConcepts?.slice(0, 5) || [],
        idioms: t.layers.L4.activatedIdioms || [],
        matchedStory: t.layers.L4.matchedNarrative,
        // SkillSpector fix: 脱敏 — understoodIntent 可能包含用户推导内容
        understoodIntent: t.layers.L4.understoodIntent ? '[已脱敏]' : null,
        emotionVector: null,  // SkillSpector fix: 不暴露情绪向量
        status: t.layers.L4Status
      },
      L5_generation: {
        // SkillSpector fix: 不暴露完整 response，仅保留字数统计
        response: '[已脱敏]',
        wordCount: t.layers.L5.wordCount,
        trace: [],  // SkillSpector fix: 不暴露生成轨迹
        status: t.layers.L5Status
      },
      processingTime: t.totalTime
    };
  }

  /**
   * 获取最近处理记录（已脱敏，最多返回最近3条，去掉 userInput）
   */
  getLastProcessing() {
    if (!this.processingLog || this.processingLog.length === 0) {
      return [];
    }
    return this.processingLog.slice(-3).map(entry => ({
      timestamp: entry.timestamp,
      validation: entry.validation,
      degraded: entry.degraded,
      coherence: entry.coherence ? {
        overallScore: entry.coherence.overallScore,
        overallCoherent: entry.coherence.overallCoherent,
        issueCount: entry.coherence.allIssues.length,
        issues: entry.coherence.allIssues.slice(0, 10)
      } : null,
      L1_associations: {
        wordCount: entry.layers.L1.words?.length || 0,
        sample: entry.layers.L1.allAssociations?.slice(0, 5) || [],
        status: entry.layers.L1Status
      },
      L2_chunks: {
        detected: entry.layers.L2.chunks?.length || 0,
        items: entry.layers.L2.chunks || [],
        status: entry.layers.L2Status
      },
      L3_narrative: {
        matched: entry.layers.L3.matchedPrototype?.name || '无匹配',
        confidence: entry.layers.L3.confidence,
        alternatives: entry.layers.L3.alternativeMatches,
        status: entry.layers.L3Status
      },
      L4_convergence: {
        coreConcepts: entry.layers.L4.thoughtVector?.activatedConcepts?.slice(0, 5) || [],
        idioms: entry.layers.L4.activatedIdioms || [],
        matchedStory: entry.layers.L4.matchedNarrative,
        understoodIntent: entry.layers.L4.understoodIntent ? '[已脱敏]' : null,
        emotionVector: null,
        status: entry.layers.L4Status
      },
      L5_generation: {
        response: '[已脱敏]',
        wordCount: entry.layers.L5.wordCount,
        trace: [],
        status: entry.layers.L5Status
      },
      processingTime: entry.totalTime
    }));
  }

  /**
   * 获取最近处理日志（已脱敏，去掉 userInput，最多最近10条）
   */
  getProcessingLog() {
    return this.processingLog.slice(-10).map(entry => ({
      timestamp: entry.timestamp,
      validation: entry.validation,
      degraded: entry.degraded,
      processingTime: entry.totalTime,
      L1Status: entry.layers.L1Status,
      L2Status: entry.layers.L2Status,
      L3Status: entry.layers.L3Status,
      L4Status: entry.layers.L4Status,
      L5Status: entry.layers.L5Status
    }));
  }

  /**
   * 获取引擎统计信息
   */
  getStats() {
    const total = this.totalProcessed || 0;
    return {
      totalProcessed: total,
      successfulProcessed: this.successfulProcessed,
      successRate: total > 0 ? Math.round(this.successfulProcessed / total * 100) / 100 : 0,
      metricsHistoryCount: this.metricsHistory.length,
      lastProcessingTime: this.lastProcessing?.totalTime || 0,
      averageProcessingTime: this.metricsHistory.length > 0
        ? Math.round(this.metricsHistory.reduce((s, m) => s + m.totalTime, 0) / this.metricsHistory.length)
        : 0,
      averageQualityScore: this.metricsHistory.length > 0
        ? Math.round(this.metricsHistory.reduce((s, m) => s + m.qualityScore, 0) / this.metricsHistory.length * 100) / 100
        : 0
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.totalProcessed = 0;
    this.successfulProcessed = 0;
    this.metricsHistory = [];
    this.processingLog = [];
    this.lastProcessing = null;
  }
}

module.exports = { AssociativeEngine, LayerStatus, InputValidation, CoherenceChecker, ProcessingMetrics };
