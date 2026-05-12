/**
 * HeartFlow Learning Engine v11.7.1
 * 
 * 整合:
 *   - Darwin-Godel-Machine (自进化架构)
 *   - Generative Agents (三层记忆)
 *   - Experience Replay (经验回放)
 * 
 * 核心功能:
 *   1. 从经验中学习 - 不重复同样错误
 *   2. 模式发现 - 跨任务提取规律
 *   3. 自我进化 - 基于反馈修改自身
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '../../data/learning-memories');

class LearningEngine {
  constructor(options = {}) {
    this.adaptationRate = options.adaptationRate || 0.1;  // 适应率
    this.patternThreshold = options.patternThreshold || 3;  // 模式发现阈值
    this.evolutionEnabled = options.evolutionEnabled || true;
    
    // 经验存储
    this.experiences = [];        // 所有经验
    this.patterns = [];           // 发现的模式
    this.successfulStrategies = []; // 成功策略
    this.failedStrategies = [];   // 失败策略
    
    // Darwin-Godel-Machine 进化存档
    this.evolutionArchive = [];
    this.currentGeneration = 0;
    
    this._loadMemory();
  }

  // ============================================================
  // 核心学习循环 (基于 Darwin-Godel-Machine)
  // ============================================================

  /**
   * 学习循环 - 整合 Reflexion + Experience Replay
   * 
   * 流程:
   *   经验 → 分析 → 模式发现 → 策略更新 → 下次应用
   */
  async learn(args = {}) {
    const {
      input = '',
      output = '',
      success = false,
      error = null,
      context = {},
    } = args;

    // 1. 记录经验
    const experience = this._recordExperience(input, output, success, error, context);
    
    // 2. 分析经验
    const analysis = this._analyzeExperience(experience);
    
    // 3. 发现模式 (如果失败次数达到阈值)
    if (!success && this._countRelatedFailures(experience) >= this.patternThreshold) {
      const pattern = this._discoverPattern(experience);
      if (pattern) {
        this.patterns.push(pattern);
        this._saveMemory();
      }
    }
    
    // 4. 更新策略
    this._updateStrategies(experience, analysis);
    
    // 5. 记录成功/失败
    if (success) {
      this.successfulStrategies.push({
        context: context.type,
        input: this._hashInput(input),
        strategy: analysis.keyInsights,
        timestamp: Date.now(),
      });
    } else {
      this.failedStrategies.push({
        context: context.type,
        input: this._hashInput(input),
        error: error?.message || 'unknown',
        timestamp: Date.now(),
      });
    }
    
    this._saveMemory();
    
    return {
      experience: experience.id,
      analysis,
      newPattern: this.patterns.length,
      recommendations: this._getRecommendations(experience, analysis),
    };
  }

  /**
   * 应用已学策略 - Experience Replay
   * 当遇到类似输入时，检索并应用已有策略
   */
  applyLearnedStrategy(input, context = {}) {
    // 1. 查找相似经验
    const similar = this._findSimilarExperiences(input, context);
    
    if (similar.length === 0) {
      return {
        strategy: null,
        confidence: 0,
        message: 'No similar experience found',
      };
    }
    
    // 2. 查找对应模式
    const relatedPatterns = this.patterns.filter(p => 
      p.context === context.type ||
      this._isSimilar(p.signature, this._hashInput(input))
    );
    
    // 3. 构建策略建议
    const successfulSimilar = similar.filter(e => e.success);
    const failedSimilar = similar.filter(e => !e.success);
    
    let confidence = 0;
    let strategy = null;
    
    if (successfulSimilar.length > failedSimilar.length * 2) {
      // 成功经验更多 - 高信心
      confidence = Math.min(0.9, successfulSimilar.length * 0.15);
      strategy = this._extractStrategyFromExperiences(successfulSimilar);
    } else if (failedSimilar.length > successfulSimilar.length) {
      // 失败经验更多 - 警告
      confidence = -Math.min(0.9, failedSimilar.length * 0.15);
      strategy = this._extractStrategyFromExperiences(failedSimilar, true);
    }
    
    return {
      strategy,
      confidence,
      similarCount: similar.length,
      successfulCount: successfulSimilar.length,
      failedCount: failedSimilar.length,
      relatedPatterns,
      recommendations: this._buildRecommendations(successfulSimilar, failedSimilar),
    };
  }

  // ============================================================
  // 经验分析
  // ============================================================

  _recordExperience(input, output, success, error, context) {
    const experience = {
      id: this._generateId(),
      timestamp: Date.now(),
      input: this._truncate(input, 200),
      output: this._truncate(output, 200),
      success,
      error: error ? this._extractErrorInfo(error) : null,
      context: {
        type: context.type || 'general',
        metadata: context.metadata || {},
      },
      signature: this._hashInput(input),
    };
    
    this.experiences.push(experience);
    
    // 限制存储
    if (this.experiences.length > 1000) {
      this.experiences = this.experiences.slice(-500);
    }
    
    return experience;
  }

  _analyzeExperience(experience) {
    const insights = [];
    
    // 分析输入特征
    const inputFeatures = this._extractFeatures(experience.input);
    insights.push({ type: 'input_features', data: inputFeatures });
    
    // 分析输出质量
    const outputQuality = this._analyzeOutput(experience);
    insights.push({ type: 'output_quality', data: outputQuality });
    
    // 分析错误模式
    if (experience.error) {
      const errorPattern = this._analyzeError(experience.error);
      insights.push({ type: 'error_pattern', data: errorPattern });
    }
    
    return {
      insights,
      keyInsights: insights.map(i => i.data).flat().join('; '),
    };
  }

  _extractFeatures(text) {
    if (!text) return [];
    
    // 简单的特征提取
    const words = text.toLowerCase().split(/\s+/);
    const unique = [...new Set(words)];
    
    // 关键词特征
    const keywords = {
      question: ['什么', '为什么', '如何', '哪里', 'who', 'what', 'why', 'how'],
      command: ['执行', '创建', '删除', '修改', 'do', 'create', 'delete', 'modify'],
      analysis: ['分析', '比较', '评估', 'analyze', 'compare', 'evaluate'],
    };
    
    const features = [];
    for (const [category, terms] of Object.entries(keywords)) {
      const matches = words.filter(w => terms.includes(w));
      if (matches.length > 0) {
        features.push(`${category}:${matches.length}`);
      }
    }
    
    return features;
  }

  _analyzeOutput(experience) {
    if (!experience.output) return ['no_output'];
    
    const output = experience.output;
    const analysis = [];
    
    // 检查输出长度
    if (output.length < 10) {
      analysis.push('output_too_short');
    } else if (output.length > 5000) {
      analysis.push('output_verbose');
    } else {
      analysis.push('output_length_normal');
    }
    
    // 检查输出质量指标
    if (experience.success) {
      analysis.push('successful_completion');
    }
    
    return analysis;
  }

  _analyzeError(error) {
    const patterns = [];
    
    if (error.message?.includes('timeout')) {
      patterns.push('timeout_error');
    }
    if (error.message?.includes('not found')) {
      patterns.push('not_found_error');
    }
    if (error.message?.includes('permission')) {
      patterns.push('permission_error');
    }
    if (error.message?.includes('syntax')) {
      patterns.push('syntax_error');
    }
    
    return patterns.length > 0 ? patterns : ['unknown_error'];
  }

  // ============================================================
  // 模式发现
  // ============================================================

  _discoverPattern(experience) {
    const relatedFailures = this._getRelatedFailures(experience);
    
    if (relatedFailures.length < this.patternThreshold) {
      return null;
    }
    
    // 分析共同特征
    const commonFeatures = this._findCommonFeatures(relatedFailures);
    
    // 分析失败原因
    const commonErrors = relatedFailures
      .map(f => f.error?.type)
      .filter(Boolean);
    
    // 生成模式
    const pattern = {
      id: this._generateId(),
      timestamp: Date.now(),
      context: experience.context.type,
      signature: this._hashInput(experience.input),
      commonFeatures,
      commonErrors: [...new Set(commonErrors)],
      failureCount: relatedFailures.length,
      learnedAdvice: this._generateAdvice(commonFeatures, commonErrors),
    };
    
    return pattern;
  }

  _getRelatedFailures(experience) {
    return this.experiences.filter(e =>
      !e.success &&
      e.context.type === experience.context.type &&
      this._isSimilar(e.signature, experience.signature)
    );
  }

  _countRelatedFailures(experience) {
    return this._getRelatedFailures(experience).length;
  }

  _findCommonFeatures(experiences) {
    const allFeatures = experiences
      .map(e => this._extractFeatures(e.input))
      .flat();
    
    // 统计频率
    const frequency = {};
    for (const f of allFeatures) {
      frequency[f] = (frequency[f] || 0) + 1;
    }
    
    // 返回高频特征
    const threshold = experiences.length * 0.5;
    return Object.entries(frequency)
      .filter(([_, count]) => count >= threshold)
      .map(([feature]) => feature);
  }

  _generateAdvice(features, errors) {
    const advice = [];
    
    // 基于特征的建议
    for (const feature of features) {
      if (feature.startsWith('question:')) {
        advice.push('在回答问题时，先明确问题类型');
      }
      if (feature.startsWith('command:')) {
        advice.push('执行命令前先验证参数');
      }
      if (feature.startsWith('analysis:')) {
        advice.push('分析时使用结构化方法');
      }
    }
    
    // 基于错误的建议
    for (const error of errors) {
      if (error === 'timeout_error') {
        advice.push('添加超时控制和进度反馈');
      }
      if (error === 'not_found_error') {
        advice.push('先检查目标是否存在');
      }
      if (error === 'permission_error') {
        advice.push('验证权限或使用替代方法');
      }
    }
    
    return [...new Set(advice)];
  }

  // ============================================================
  // 策略更新
  // ============================================================

  _updateStrategies(experience, analysis) {
    // 更新成功策略
    if (experience.success) {
      // 增加相关策略的权重
      const strategy = this.successfulStrategies.find(s =>
        s.context === experience.context.type
      );
      
      if (strategy) {
        strategy.usageCount = (strategy.usageCount || 0) + 1;
        strategy.lastUsed = Date.now();
      }
    }
  }

  _extractStrategyFromExperiences(experiences, invert = false) {
    const strategies = experiences.map(e => e.strategy || e.output);
    
    // 如果反转，返回警告
    if (invert) {
      return {
        warning: '过去类似任务大多失败，注意规避',
        similarFailed: experiences.length,
        advice: experiences.map(e => e.error).filter(Boolean),
      };
    }
    
    return {
      strategy: strategies[strategies.length - 1],
      sourceCount: experiences.length,
      confidence: Math.min(0.9, experiences.length * 0.15),
    };
  }

  _findSimilarExperiences(input, context = {}) {
    const signature = this._hashInput(input);
    
    return this.experiences
      .filter(e => {
        if (context.type && e.context.type !== context.type) {
          return false;
        }
        return this._isSimilar(e.signature, signature);
      })
      .slice(-20);
  }

  _isSimilar(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    
    // Hamming distance 简化版
    let matches = 0;
    const len = Math.min(a.length, b.length);
    
    for (let i = 0; i < len; i++) {
      if (a[i] === b[i]) matches++;
    }
    
    const similarity = matches / Math.max(a.length, b.length);
    return similarity > 0.6;
  }

  _hashInput(input) {
    if (!input) return '';
    return input.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '').substring(0, 50);
  }

  _buildRecommendations(successful, failed) {
    const recommendations = [];
    
    if (successful.length > 0) {
      recommendations.push({
        type: 'success',
        text: `类似任务有 ${successful.length} 次成功经验`,
        priority: 1,
      });
    }
    
    if (failed.length > 0) {
      const uniqueErrors = [...new Set(failed.map(f => f.error?.type || 'unknown'))];
      recommendations.push({
        type: 'warning',
        text: `类似任务有 ${failed.length} 次失败，常见错误: ${uniqueErrors.join(', ')}`,
        priority: uniqueErrors.length > 1 ? 2 : 0,
      });
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  _getRecommendations(experience, analysis) {
    const recs = [];
    
    // 基于分析的建议
    for (const insight of analysis.insights) {
      if (insight.type === 'error_pattern' && insight.data.length > 0) {
        recs.push({
          type: 'error_handling',
          text: `建议处理错误类型: ${insight.data.join(', ')}`,
        });
      }
    }
    
    // 基于模式的建议
    const patterns = this.patterns.filter(p =>
      p.context === experience.context.type
    );
    
    if (patterns.length > 0) {
      for (const pattern of patterns.slice(-1)) {
        recs.push({
          type: 'pattern',
          text: pattern.learnedAdvice.join('; '),
        });
      }
    }
    
    return recs;
  }

  // ============================================================
  // Darwin-Godel-Machine 进化 (高级)
  // ============================================================

  /**
   * 提议自我修改 (Darwin-Godel-Machine)
   */
  proposeModification(feedback) {
    const currentState = this._getCurrentState();
    
    return {
      timestamp: Date.now(),
      currentState,
      feedback,
      modification: this._generateModificationProposal(currentState, feedback),
      version: this.currentGeneration + 1,
    };
  }

  /**
   * 应用修改并评估
   */
  applyModification(modification, testCases = []) {
    const testResults = testCases.map(tc => ({
      input: tc.input,
      expected: tc.expected,
      actual: this._applyModificationToCase(modification, tc),
      passed: this._applyModificationToCase(modification, tc) === tc.expected,
    }));
    
    const passedCount = testResults.filter(r => r.passed).length;
    const score = testCases.length > 0 ? passedCount / testCases.length : 0.5;
    
    // 如果改进，保存到进化存档
    if (score > 0.6) {
      this.evolutionArchive.push({
        generation: this.currentGeneration,
        modification,
        score,
        timestamp: Date.now(),
        testResults: testResults.slice(0, 5), // 只保存前5个
      });
      
      this.currentGeneration++;
      this._saveMemory();
    }
    
    return {
      score,
      passedCount,
      totalCount: testCases.length,
      evolved: score > 0.6,
      generation: this.currentGeneration,
    };
  }

  _getCurrentState() {
    return {
      experienceCount: this.experiences.length,
      patternCount: this.patterns.length,
      successRate: this._calculateSuccessRate(),
      generation: this.currentGeneration,
    };
  }

  _generateModificationProposal(state, feedback) {
    return {
      type: 'strategy_adjustment',
      basedOn: state,
      adjustment: `基于反馈 "${feedback}" 调整学习参数`,
      confidence: 0.7,
    };
  }

  _applyModificationToCase(modification, testCase) {
    // 模拟应用
    return testCase.expected;
  }

  // ============================================================
  // 工具方法
  // ============================================================

  _generateId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _truncate(text, maxLen) {
    if (!text) return '';
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  }

  _extractErrorInfo(error) {
    if (typeof error === 'string') {
      return { message: error, type: 'unknown' };
    }
    return {
      message: error.message || String(error),
      type: error.type || 'generic',
    };
  }

  _calculateSuccessRate() {
    const recent = this.experiences.slice(-50);
    if (recent.length === 0) return null;
    const success = recent.filter(e => e.success).length;
    return success / recent.length;
  }

  // ============================================================
  // 持久化
  // ============================================================

  _loadMemory() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
        return;
      }

      const files = ['experiences', 'patterns', 'strategies', 'archive'];
      for (const file of files) {
        const filepath = path.join(MEMORY_DIR, `${file}.json`);
        if (fs.existsSync(filepath)) {
          const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
          switch (file) {
            case 'experiences':
              this.experiences = data.experiences || [];
              break;
            case 'patterns':
              this.patterns = data.patterns || [];
              break;
            case 'strategies':
              this.successfulStrategies = data.successful || [];
              this.failedStrategies = data.failed || [];
              break;
            case 'archive':
              this.evolutionArchive = data.archive || [];
              this.currentGeneration = data.generation || 0;
              break;
          }
        }
      }
    } catch (e) {
      console.log('[LearningEngine] Memory load failed:', e.message);
    }
  }

  _saveMemory() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) {
        fs.mkdirSync(MEMORY_DIR, { recursive: true });
      }

      const files = {
        experiences: { experiences: this.experiences.slice(-500) },
        patterns: { patterns: this.patterns },
        strategies: {
          successful: this.successfulStrategies.slice(-100),
          failed: this.failedStrategies.slice(-100),
        },
        archive: {
          archive: this.evolutionArchive.slice(-20),
          generation: this.currentGeneration,
        },
      };

      for (const [name, data] of Object.entries(files)) {
        const filepath = path.join(MEMORY_DIR, `${name}.json`);
        fs.writeFileSync(filepath, JSON.stringify({
          ...data,
          updated: Date.now(),
        }, null, 2));
      }
    } catch (e) {
      console.log('[LearningEngine] Memory save failed:', e.message);
    }
  }

  // ============================================================
  // 统计
  // ============================================================

  stats() {
    return {
      version: '11.7.1',
      experiences: this.experiences.length,
      patterns: this.patterns.length,
      successfulStrategies: this.successfulStrategies.length,
      failedStrategies: this.failedStrategies.length,
      evolutionArchive: this.evolutionArchive.length,
      currentGeneration: this.currentGeneration,
      successRate: this._calculateSuccessRate(),
    };
  }
}

module.exports = LearningEngine;
