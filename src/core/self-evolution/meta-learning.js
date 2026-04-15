/**
 * MetaLearning v7.6.000 - 元学习引擎
 * 学习如何学习 - 从经验中提取模式并优化学习策略
 */

const fs = require('fs');
const path = require('path');

class MetaLearning {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.version = '7.6.000';
    
    this.strategies = {
      conceptual: { success: 0, total: 0, score: 0 },
      example: { success: 0, total: 0, score: 0 },
      analogy: { success: 0, total: 0, score: 0 },
      step_by_step: { success: 0, total: 0, score: 0 },
      socratic: { success: 0, total: 0, score: 0 }
    };
    
    this.learningPatterns = [];
    this.loadPatterns();
  }

  loadPatterns() {
    const patternsFile = path.join(this.projectRoot, 'internal', 'data', 'meta-learning-patterns.json');
    try {
      if (fs.existsSync(patternsFile)) {
        const data = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
        this.strategies = data.strategies || this.strategies;
        this.learningPatterns = data.patterns || [];
      }
    } catch (e) {
      console.log('[MetaLearning] 加载模式失败');
    }
  }

  savePatterns() {
    const patternsFile = path.join(this.projectRoot, 'internal', 'data', 'meta-learning-patterns.json');
    const dir = path.dirname(patternsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(patternsFile, JSON.stringify({
      strategies: this.strategies,
      patterns: this.learningPatterns
    }, null, 2));
  }

  /**
   * 根据上下文选择最佳学习策略
   */
  selectStrategy(context) {
    const input = context.input || '';
    const inputLower = input.toLowerCase();
    
    // 分析输入类型
    let bestStrategy = 'step_by_step';
    let bestScore = 0;
    
    // 概念理解类
    if (inputLower.includes('什么是') || inputLower.includes('什么是') || inputLower.includes('explain') || inputLower.includes('概念')) {
      bestStrategy = 'conceptual';
    }
    // 示例需求
    else if (inputLower.includes('例子') || inputLower.includes('example') || inputLower.includes('比如')) {
      bestStrategy = 'example';
    }
    // 类比需求
    else if (inputLower.includes('像') || inputLower.includes('like') || inputLower.includes('类似')) {
      bestStrategy = 'analogy';
    }
    // 步骤需求
    else if (inputLower.includes('怎么') || inputLower.includes('how to') || inputLower.includes('步骤')) {
      bestStrategy = 'step_by_step';
    }
    // 问题探索
    else if (inputLower.includes('为什么') || inputLower.includes('why') || inputLower.includes('?')) {
      bestStrategy = 'socratic';
    }
    
    // 获取策略评分
    const strategyData = this.strategies[bestStrategy];
    const score = strategyData ? strategyData.score : 0.5;
    
    return { strategy: bestStrategy, confidence: score };
  }

  /**
   * 执行学习
   */
  async learn(input, context = {}) {
    const startTime = Date.now();
    
    // 选择策略
    const { strategy, confidence } = this.selectStrategy(context);
    
    // 执行学习
    const result = await this.executeStrategy(strategy, input, context);
    
    // 记录模式
    const learningTime = Date.now() - startTime;
    this.recordPattern(input, strategy, result.success, learningTime);
    
    // 更新策略评分
    this.updateStrategyScore(strategy, result.success);
    
    // 保存
    this.savePatterns();
    
    return {
      strategy,
      confidence,
      result,
      time: learningTime,
      patternsLearned: this.learningPatterns.length
    };
  }

  /**
   * 执行具体策略
   */
  async executeStrategy(strategy, input, context) {
    let result = { success: true, quality: 'good', output: '' };
    
    switch (strategy) {
      case 'conceptual':
        result.output = this.conceptualLearning(input);
        break;
      case 'example':
        result.output = this.exampleLearning(input);
        break;
      case 'analogy':
        result.output = this.analogyLearning(input);
        break;
      case 'step_by_step':
        result.output = this.stepByStepLearning(input);
        break;
      case 'socratic':
        result.output = this.socraticLearning(input);
        break;
    }
    
    return result;
  }

  /**
   * 概念学习
   */
  conceptualLearning(input) {
    return {
      type: 'concept',
      definition: '从输入中提取核心概念',
      keyPoints: this.extractKeyPoints(input),
      structure: '分层组织'
    };
  }

  /**
   * 示例学习
   */
  exampleLearning(input) {
    return {
      type: 'example',
      examples: ['示例1', '示例2'],
      pattern: '通过例子理解'
    };
  }

  /**
   * 类比学习
   */
  analogyLearning(input) {
    return {
      type: 'analogy',
      comparisons: ['类比1', '类比2'],
      mapping: '概念映射'
    };
  }

  /**
   * 逐步学习
   */
  stepByStepLearning(input) {
    return {
      type: 'step',
      steps: ['步骤1', '步骤2', '步骤3'],
      order: '循序渐进'
    };
  }

  /**
   * 苏格拉底式学习
   */
  socraticLearning(input) {
    return {
      type: 'question',
      questions: ['问题1', '问题2', '问题3'],
      method: '追问深化'
    };
  }

  /**
   * 提取关键点
   */
  extractKeyPoints(text) {
    const words = text.split(/[\s,，。]+/).filter(w => w.length > 2);
    return words.slice(0, 5);
  }

  /**
   * 记录学习模式
   */
  recordPattern(input, strategy, success, time) {
    this.learningPatterns.push({
      input: input.substring(0, 50),
      strategy,
      success,
      time,
      timestamp: new Date().toISOString()
    });
    
    // 保留最近100条
    if (this.learningPatterns.length > 100) {
      this.learningPatterns = this.learningPatterns.slice(-100);
    }
  }

  /**
   * 更新策略评分
   */
  updateStrategyScore(strategy, success) {
    const s = this.strategies[strategy];
    if (s) {
      s.total++;
      if (success) s.success++;
      s.score = s.total > 0 ? s.success / s.total : 0.5;
    }
  }

  /**
   * 获取学习统计
   */
  getStats() {
    return {
      strategies: Object.keys(this.strategies).map(k => ({
        name: k,
        score: this.strategies[k].score.toFixed(2),
        uses: this.strategies[k].total
      })),
      patterns: this.learningPatterns.length,
      bestStrategy: Object.entries(this.strategies).sort((a, b) => b[1].score - a[1].score)[0][0]
    };
  }
}

module.exports = { MetaLearning };