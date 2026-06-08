/**
 * L5 Word-by-Word Generator - 逐词回复生成层
 * 模拟人类说话过程，逐词生成回复
 * 
 * v2.0.0 — 升级：增加输入验证/震荡检测/循环保护/自愈选择/用户模型集成
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 错误分类与状态枚举
// ============================================================================

/** 生成状态枚举 */
const GenerationState = {
  INIT: 'init',
  SELECTING_FIRST: 'selecting_first',
  PREDICTING: 'predicting',
  COMPLETED: 'completed',
  ERROR: 'error',
  MAX_ITERATIONS: 'max_iterations',
  OSCILLATION_DETECTED: 'oscillation_detected',
  DRIFT_DETECTED: 'drift_detected'
};

/** 错误分类 */
const ErrorCategory = {
  INVALID_INPUT: 'invalid_input',
  VOCABULARY_EMPTY: 'vocabulary_empty',
  WORD_SELECTION_FAILED: 'word_selection_failed',
  STATE_CORRUPT: 'state_corrupt',
  MAX_ITERATIONS_EXCEEDED: 'max_iterations_exceeded',
  OSCILLATION: 'oscillation',
  DRIFT: 'drift',
  UNKNOWN: 'unknown'
};

/** 重试策略建议 */
const RetryStrategy = {
  RETRY_SAME: 'retry_same',
  FALLBACK_DEFAULT: 'fallback_default',
  RESET_STATE: 'reset_state',
  ABORT: 'abort'
};

class WordByWordGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'word-gen-trace.json');
    this.currentTrace = [];
    this.vocabulary = this.loadVocabulary();
    this.generationState = GenerationState.INIT;
    this.iterationCount = 0;
    this.maxIterations = 1000; // 硬限制：防止无限循环
    this.oscillationWindow = 8;  // 震荡检测窗口大小
    this.driftThreshold = 0.6;   // 漂移检测阈值
    this.lastErrors = [];        // 错误历史，用于自愈
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
  }

  loadVocabulary() {
    return {
      common: ['我', '你', '他', '她', '它', '是', '在', '有', '和', '了', '这', '那', '也', '都', '就', '要', '可以', '知道', '认为', '觉得'],
      emotional: ['开心', '难过', '感动', '担心', '放心', '期待', '感谢', '理解', '支持', '相信'],
      flow: ['心流', '专注', '沉浸', '创造', '体验', '状态', '进入', '保持', '感受'],
      transition: ['但是', '而且', '所以', '因为', '虽然', '如果', '不过', '其实', '然后']
    };
  }

  /**
   * 验证 thoughtVector 结构是否完整
   * @private
   * @param {Object} thoughtVector
   * @returns {{valid: boolean, error?: string, category?: string}}
   */
  _validateThoughtVector(thoughtVector) {
    if (!thoughtVector) {
      return { valid: false, error: 'thoughtVector 为 null/undefined', category: ErrorCategory.INVALID_INPUT };
    }
    if (typeof thoughtVector !== 'object' || Array.isArray(thoughtVector)) {
      return { valid: false, error: 'thoughtVector 类型错误', category: ErrorCategory.INVALID_INPUT };
    }
    if (!thoughtVector.dimensions || typeof thoughtVector.dimensions !== 'object') {
      return { valid: false, error: 'thoughtVector.dimensions 缺失或无效', category: ErrorCategory.INVALID_INPUT };
    }
    if (!thoughtVector.emotion || typeof thoughtVector.emotion !== 'object') {
      return { valid: false, error: 'thoughtVector.emotion 缺失或无效', category: ErrorCategory.INVALID_INPUT };
    }
    return { valid: true };
  }

  /**
   * 验证 userModel 结构（可选，仅警告）
   * @private
   * @param {Object} userModel
   * @returns {boolean} 是否可用
   */
  _validateUserModel(userModel) {
    if (!userModel) return false;
    if (typeof userModel !== 'object') return false;
    // 至少需要一个有用字段
    return !!(userModel.preferences || userModel.personality || userModel.emotionalState || userModel.languageStyle);
  }

  /**
   * 震荡检测：检查最近生成的词是否出现重复循环模式
   * @private
   * @param {string[]} words - 已生成词序列
   * @returns {{oscillating: boolean, pattern?: string, repeatCount: number}}
   */
  _detectOscillation(words) {
    if (words.length < this.oscillationWindow * 2) {
      return { oscillating: false, repeatCount: 0 };
    }

    const recent = words.slice(-this.oscillationWindow);
    const previous = words.slice(-this.oscillationWindow * 2, -this.oscillationWindow);

    // 精确序列匹配（检测循环模式）
    const exactMatch = recent.every((w, i) => w === previous[i]);
    if (exactMatch) {
      return { oscillating: true, pattern: recent.join(''), repeatCount: 2 };
    }

    // 近似重复检测：检查是否有 70%+ 的词重复
    const overlapCount = recent.filter(w => previous.includes(w)).length;
    const overlapRatio = overlapCount / this.oscillationWindow;
    if (overlapRatio > 0.7) {
      return { oscillating: true, pattern: recent.slice(0, 3).join('') + '...', repeatCount: Math.round(overlapRatio * 10) / 10 };
    }

    // 单个词重复检测（同一个词出现太多次）
    const wordFreq = {};
    for (const w of words) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(wordFreq));
    const maxFreqWord = Object.keys(wordFreq).find(k => wordFreq[k] === maxFreq);
    if (maxFreq > words.length * 0.4 && words.length > 10) {
      return { oscillating: true, pattern: `重复词"${maxFreqWord}"出现${maxFreq}次`, repeatCount: maxFreq };
    }

    return { oscillating: false, repeatCount: 0 };
  }

  /**
   * 漂移检测：检查生成内容是否偏离 thoughtVector 主题
   * @private
   * @param {string[]} words
   * @param {Object} thoughtDims
   * @returns {{drifted: boolean, score: number, reason?: string}}
   */
  _detectDrift(words, thoughtDims) {
    const concepts = Object.keys(thoughtDims);
    if (concepts.length === 0 || words.length < 5) {
      return { drifted: false, score: 0 };
    }

    // 统计生成的词中与 thoughtVector 概念相关的比例
    const relevantWords = words.filter(w => concepts.includes(w));
    const relevanceRatio = relevantWords.length / words.length;

    // 如果相关词比例低于阈值，认为发生了漂移
    if (relevanceRatio < (1 - this.driftThreshold)) {
      return {
        drifted: true,
        score: 1 - relevanceRatio,
        reason: `相关词比例 ${(relevanceRatio * 100).toFixed(0)}% 低于阈值 ${((1 - this.driftThreshold) * 100).toFixed(0)}%`
      };
    }

    return { drifted: false, score: 1 - relevanceRatio };
  }

  /**
   * 安全的选择函数：从数组中选取随机元素，含防御性回退
   * @private
   * @param {string[]} array
   * @returns {string} 选中的词或安全回退
   */
  _safePick(array) {
    if (!array || array.length === 0) {
      this.lastErrors.push({ type: ErrorCategory.VOCABULARY_EMPTY, time: Date.now() });
      return '。'; // 安全回退：句号
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 生成回复 (异步)
   */
  async generateResponse(thoughtVector, userModel = {}, maxLength = 200) {
    // ====================================================================
    // 1. 输入验证
    // ====================================================================
    const validation = this._validateThoughtVector(thoughtVector);
    if (!validation.valid) {
      this.generationState = GenerationState.ERROR;
      this.recordTrace('validation_error', { error: validation.error, category: validation.category });
      return {
        response: '',
        wordCount: 0,
        error: validation.error,
        errorCategory: validation.category,
        trace: this.currentTrace,
        state: GenerationState.ERROR
      };
    }

    // 验证 userModel 并标记是否可用
    const hasUserModel = this._validateUserModel(userModel);

    // ====================================================================
    // 2. 初始化
    // ====================================================================
    this.currentTrace = [];
    this.iterationCount = 0;
    this.generationState = GenerationState.SELECTING_FIRST;
    this.lastErrors = [];
    this.recoveryAttempts = 0;

    const responseState = {
      generatedWords: [],
      thoughtVector,
      userModel,
      userModelActive: hasUserModel,
      completed: false,
      error: null,
      oscillationsDetected: 0,
      driftsCorrected: 0
    };

    this.recordTrace('start', {
      thoughtVector: thoughtVector.dimensions,
      emotion: thoughtVector.emotion,
      userModelActive: hasUserModel,
      maxLength
    });

    // ====================================================================
    // 3. 选择首词
    // ====================================================================
    const firstWord = this.selectFirstWord(thoughtVector);
    responseState.generatedWords.push(firstWord);
    this.recordTrace('select_first_word', { word: firstWord });

    // ====================================================================
    // 4. 逐词生成循环（含震荡检测 + 漂移检测 + 循环保护）
    // ====================================================================
    this.generationState = GenerationState.PREDICTING;

    while (!responseState.completed) {
      this.iterationCount++;

      // ---- 4a. 硬限制：最大迭代次数保护 ----
      if (this.iterationCount > this.maxIterations) {
        this.generationState = GenerationState.MAX_ITERATIONS;
        this.recordTrace('max_iterations', { iteration: this.iterationCount });
        responseState.completed = true;
        responseState.error = `超过最大迭代次数 (${this.maxIterations})`;
        break;
      }

      // ---- 4b. 长度限制 ----
      if (this.getLength(responseState.generatedWords) >= maxLength) {
        responseState.completed = true;
        this.recordTrace('max_length_reached', { length: this.getLength(responseState.generatedWords) });
        break;
      }

      // ---- 4c. 震荡检测 ----
      const oscillation = this._detectOscillation(responseState.generatedWords);
      if (oscillation.oscillating) {
        responseState.oscillationsDetected++;
        this.generationState = GenerationState.OSCILLATION_DETECTED;

        // 自愈：强制插入一个随机过渡词打断循环
        const breakWord = this._safePick(this.vocabulary.transition);
        responseState.generatedWords.push(breakWord);
        this.recordTrace('oscillation_break', {
          pattern: oscillation.pattern,
          breakWord,
          repeatCount: oscillation.repeatCount
        });
        continue;
      }

      // ---- 4d. 漂移检测 ----
      const drift = this._detectDrift(responseState.generatedWords, thoughtVector.dimensions);
      if (drift.drifted) {
        responseState.driftsCorrected++;
        this.generationState = GenerationState.DRIFT_DETECTED;

        // 自愈：强制回归到 thoughtVector 中的高权重概念
        const topConcept = Object.entries(thoughtVector.dimensions)
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        if (topConcept) {
          responseState.generatedWords.push(topConcept);
          this.recordTrace('drift_correction', {
            correction: topConcept,
            driftScore: drift.score,
            reason: drift.reason
          });
          continue;
        }
      }

      // ---- 4e. 正常预测下一个词 ----
      const nextWord = await this.predictNextWord(responseState);
      
      // 检查 predictNextWord 是否返回了有效词
      if (!nextWord) {
        this.lastErrors.push({ type: ErrorCategory.WORD_SELECTION_FAILED, iteration: this.iterationCount });
        this.recoveryAttempts++;
        
        if (this.recoveryAttempts > this.maxRecoveryAttempts) {
          responseState.completed = true;
          responseState.error = '连续词选择失败，放弃生成';
          this.recordTrace('recovery_exhausted', { attempts: this.recoveryAttempts });
          break;
        }
        
        // 回退：使用安全默认词
        const fallbackWord = this._safePick(this.vocabulary.common);
        responseState.generatedWords.push(fallbackWord);
        this.recordTrace('recovery_fallback', { fallback: fallbackWord, attempt: this.recoveryAttempts });
        continue;
      }

      responseState.generatedWords.push(nextWord);
      this.recordTrace('predict_next', {
        word: nextWord,
        iteration: this.iterationCount,
        currentSequence: responseState.generatedWords.join('').slice(-30)
      });

      // ---- 4f. 停止判断 ----
      if (this.shouldStop(responseState)) {
        responseState.completed = true;
      }

      await this.delay(10);
    }

    // ====================================================================
    // 5. 完成
    // ====================================================================
    this.generationState = GenerationState.COMPLETED;
    const finalResponse = responseState.generatedWords.join('');
    this.recordTrace('complete', {
      response: finalResponse,
      iterations: this.iterationCount,
      oscillationsDetected: responseState.oscillationsDetected,
      driftsCorrected: responseState.driftsCorrected,
      userModelActive: hasUserModel
    });

    this.saveTrace();

    return {
      response: finalResponse,
      wordCount: responseState.generatedWords.length,
      charCount: finalResponse.length,
      iterations: this.iterationCount,
      oscillationsDetected: responseState.oscillationsDetected,
      driftsCorrected: responseState.driftsCorrected,
      state: this.generationState,
      error: responseState.error,
      trace: this.currentTrace
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  selectFirstWord(thoughtVector) {
    // 防御性检查
    if (!thoughtVector || !thoughtVector.emotion || !thoughtVector.dimensions) {
      return this._safePick(this.vocabulary.common);
    }

    const emotion = thoughtVector.emotion;
    const concepts = Object.keys(thoughtVector.dimensions);
    
    if (emotion.pleasure > 2) {
      return this._safePick(['我理解', '我能感受到', '很高兴', '真是']);
    }
    
    if (emotion.pleasure < -2) {
      return this._safePick(['我理解', '很遗憾', '我明白', '没关系']);
    }
    
    if (concepts.length > 0) {
      return concepts[0];
    }
    
    return this._safePick(this.vocabulary.common);
  }

  pickFrom(array) {
    return this._safePick(array);
  }

  async predictNextWord(state) {
    // 防御性检查
    if (!state || !state.generatedWords || !state.thoughtVector) {
      return null;
    }

    const currentSeq = state.generatedWords.join('');
    const lastWord = state.generatedWords[state.generatedWords.length - 1];
    const thoughtDims = state.thoughtVector.dimensions || {};
    
    // ---- 集成 userModel（如果可用） ----
    if (state.userModelActive && state.userModel) {
      const um = state.userModel;
      // 根据 userModel 的语言风格偏好调整选词
      if (um.languageStyle === 'formal' && Math.random() < 0.2) {
        const formalWord = this._safePick(['因此', '然而', '此外', '鉴于']);
        if (formalWord) return formalWord;
      }
      if (um.languageStyle === 'simple' && Math.random() < 0.2) {
        const simpleWord = this._safePick(['所以', '但是', '还有', '因为']);
        if (simpleWord) return simpleWord;
      }
      // 根据用户情绪状态调整选词
      if (um.emotionalState === 'sad' && Math.random() < 0.15) {
        return this._safePick(this.vocabulary.emotional);
      }
    }

    // ---- 正常逐词逻辑 ----
    if (currentSeq.length < 5) {
      if (lastWord && this.isFunctionWord(lastWord)) {
        const contentWord = this.selectContentWord(thoughtDims);
        return contentWord || this._safePick(this.vocabulary.common);
      }
      return this._safePick(this.vocabulary.common);
    }
    
    if (currentSeq.endsWith('。') || currentSeq.endsWith('！') || currentSeq.endsWith('？')) {
      const conceptKeys = Object.keys(thoughtDims);
      if (conceptKeys.length > 0) {
        const topConcept = Object.entries(thoughtDims)
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        if (topConcept) return topConcept;
      }
      return this._safePick(['希望', '相信', '期待', '感谢']);
    }
    
    if (Math.random() < 0.3) {
      return this._safePick(this.vocabulary.transition);
    }
    
    if (Math.random() < 0.2) {
      return this._safePick(this.vocabulary.emotional);
    }
    
    return this.selectContentWord(thoughtDims);
  }

  isFunctionWord(word) {
    const functionWords = ['是', '在', '有', '和', '了', '的', '也', '就', '要', '可以'];
    return functionWords.includes(word);
  }

  selectContentWord(thoughtDims) {
    // 防御性检查
    if (!thoughtDims || typeof thoughtDims !== 'object') {
      return this._safePick(this.vocabulary.flow);
    }

    const concepts = Object.keys(thoughtDims);
    
    if (concepts.length > 0) {
      const weighted = concepts.sort((a, b) => thoughtDims[b] - thoughtDims[a]);
      const selected = weighted[Math.floor(Math.random() * Math.min(3, weighted.length))];
      if (selected) return selected;
    }
    
    return this._safePick(this.vocabulary.flow);
  }

  shouldStop(state) {
    if (!state || !state.generatedWords) return true;
    const words = state.generatedWords;
    if (words.length < 3) return false;
    
    const lastChars = words.slice(-2).join('');
    if (lastChars.endsWith('。') || lastChars.endsWith('！') || lastChars.endsWith('？')) {
      return true;
    }
    
    if (words.length > 30 && Math.random() < 0.3) {
      return true;
    }
    
    return false;
  }

  getLength(words) {
    return words.join('').length;
  }

  recordTrace(step, data) {
    this.currentTrace.push({
      step,
      data,
      timestamp: Date.now(),
      sequence: this.currentTrace.length + 1
    });
  }

  saveTrace() {
    if (!process.env.HEARTFLOW_DEBUG) return;
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const traceData = {
        trace: this.currentTrace.slice(-10),
        finalResponse: this.currentTrace.find(t => t.step === 'complete')?.data?.response || '',
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(this.stateFile, JSON.stringify(traceData, null, 2));
      console.warn('[WordByWordGenerator] Trace saved to disk');
    } catch (e) {
      console.error('[WordByWordGenerator] Save failed:', e.message);
    }
  }

  getLastTrace() {
    return this.currentTrace;
  }

  getFormattedTrace() {
    return this.currentTrace.map(t => {
      if (t.step === 'start') {
        return `[逐词生成] 开始 - 思想向量: ${JSON.stringify(t.data.thoughtVector).slice(0, 50)}...`;
      }
      if (t.step === 'select_first_word') {
        return `[逐词生成] 选择首词: ${t.data.word}`;
      }
      if (t.step === 'predict_next') {
        return `[逐词生成] ${t.sequence}: ${t.data.word} (当前: ${t.data.currentSequence}...)`;
      }
      if (t.step === 'oscillation_break') {
        return `[逐词生成] 震荡检测 - 打断循环模式 "${t.data.pattern}"，插入 "${t.data.breakWord}"`;
      }
      if (t.step === 'drift_correction') {
        return `[逐词生成] 漂移纠正 - 漂移分数 ${t.data.driftScore}，强制回归 "${t.data.correction}"`;
      }
      if (t.step === 'max_iterations') {
        return `[逐词生成] 达到最大迭代次数 ${t.data.iteration}`;
      }
      if (t.step === 'recovery_fallback') {
        return `[逐词生成] 自愈回退 #${t.data.attempt} - 使用 "${t.data.fallback}"`;
      }
      if (t.step === 'complete') {
        return `[逐词生成] 完成 - ${t.data.response} (迭代${t.data.iterations}次, 震荡${t.data.oscillationsDetected}次, 漂移纠正${t.data.driftsCorrected}次)`;
      }
      return '';
    }).filter(Boolean).join('\n');
  }

  /** 获取当前生成状态 */
  getState() {
    return this.generationState;
  }

  /** 获取错误统计 */
  getErrorSummary() {
    const counts = {};
    for (const err of this.lastErrors) {
      counts[err.type] = (counts[err.type] || 0) + 1;
    }
    return {
      totalErrors: this.lastErrors.length,
      recoveryAttempts: this.recoveryAttempts,
      maxRecoveryAttempts: this.maxRecoveryAttempts,
      byCategory: counts,
      recentErrors: this.lastErrors.slice(-5)
    };
  }
}

module.exports = { WordByWordGenerator, GenerationState, ErrorCategory, RetryStrategy };
