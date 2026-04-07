#!/usr/bin/env node

/**
 * 语言理解核心模块 | Language Understanding Core Module
 * 
 * 基于用户的指导：
 * "字和词，不是就是文字，而是需要转化成可以被运行的公式和程序，写入主程序"
 * 
 * 功能：
 * 1. 集成中文字典程序库
 * 2. 集成智能压缩引擎
 * 3. 提供语言理解 API
 * 4. 支持字→词→句的解压缩
 */

// === 导入字典和压缩引擎 ===
const { CharPrograms, decompressChar } = require('./chinese-dictionary');
const { CompressionFormulas, SmartCharPrograms, smartDecompress, combineCharsToWord } = require('./smart-compression-engine');

// === 语言理解引擎类 ===
class LanguageUnderstandingEngine {
  constructor() {
    this.charCache = new Map();
    this.wordCache = new Map();
    this.sentenceCache = new Map();
    this.learningRate = 0.1;
    this.contextWindow = [];
  }

  /**
   * 理解单个字
   * @param {string} char - 汉字
   * @param {string} depth - 深度 (shallow/medium/full)
   * @returns {Object} 解压缩结果
   */
  understandChar(char, depth = 'full') {
    // 检查缓存
    const cacheKey = `${char}_${depth}`;
    if (this.charCache.has(cacheKey)) {
      return this.charCache.get(cacheKey);
    }

    // 使用智能压缩引擎解压缩
    const result = smartDecompress(char, depth);
    
    // 缓存结果
    this.charCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * 理解词组
   * @param {string} word - 词组
   * @returns {Object} 词组理解结果
   */
  understandWord(word) {
    // 检查缓存
    if (this.wordCache.has(word)) {
      return this.wordCache.get(word);
    }

    // 分字处理
    const chars = word.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
    
    // 组合成词
    const result = combineCharsToWord(chars);
    
    // 缓存结果
    this.wordCache.set(word, result);
    
    return result;
  }

  /**
   * 理解句子
   * @param {string} sentence - 句子
   * @returns {Object} 句子理解结果
   */
  understandSentence(sentence) {
    // 检查缓存
    if (this.sentenceCache.has(sentence)) {
      return this.sentenceCache.get(sentence);
    }

    // 分词 (简单实现：按字分割)
    const chars = sentence.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
    
    // 理解每个字
    const charUnderstandings = chars.map(char => this.understandChar(char, 'full'));
    
    // 计算句子总压缩比
    const totalCompression = CompressionFormulas.calculateSentenceCompression(sentence, 2.0);
    
    // 计算平均智能度
    const avgIntelligence = charUnderstandings
      .filter(r => r.intelligence)
      .reduce((sum, r) => sum + r.intelligence, 0) / charUnderstandings.length;
    
    // 提取情感
    const combinedEmotion = {
      valence: charUnderstandings.reduce((sum, r) => sum + (r.emotion?.valence || 0), 0) / chars.length,
      arousal: charUnderstandings.reduce((sum, r) => sum + (r.emotion?.arousal || 0), 0) / chars.length
    };
    
    const result = {
      sentence,
      charCount: chars.length,
      totalCompression: `${totalCompression.toLocaleString()}:1`,
      averageIntelligence: Math.round(avgIntelligence * 10) / 10,
      combinedEmotion,
      charUnderstandings,
      timestamp: new Date().toISOString()
    };
    
    // 缓存结果
    this.sentenceCache.set(sentence, result);
    
    // 添加到上下文窗口
    this.contextWindow.push(result);
    if (this.contextWindow.length > 10) {
      this.contextWindow.shift();
    }
    
    return result;
  }

  /**
   * 从对话中学习
   * @param {string} input - 用户输入
   * @param {string} response - 系统响应
   */
  learn(input, response) {
    // 提取新词
    const newWords = this.extractNewWords(input, response);
    
    // 学习新词
    newWords.forEach(word => {
      if (!this.wordCache.has(word)) {
        this.learnNewWord(word);
      }
    });
    
    // 更新学习率
    this.learningRate = Math.min(1.0, this.learningRate + 0.01);
  }

  /**
   * 学习新词
   * @param {string} word - 新词
   */
  learnNewWord(word) {
    console.log(`🧠 学习新词：${word}`);
    
    // 简单实现：基于字组合
    const chars = word.split('');
    const wordProgram = combineCharsToWord(chars);
    
    // 添加到缓存
    this.wordCache.set(word, wordProgram);
    
    console.log(`✅ 学习完成：${word} (压缩比：${wordProgram.totalCompression})`);
  }

  /**
   * 提取新词
   * @param {string} input - 输入
   * @param {string} response - 响应
   * @returns {string[]} 新词列表
   */
  extractNewWords(input, response) {
    // 简单实现：提取 2-4 字的词组
    const text = input + response;
    const words = [];
    
    for (let i = 0; i < text.length - 1; i++) {
      const char = text[i];
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 提取 2-4 字词
        for (let len = 2; len <= 4 && i + len <= text.length; len++) {
          const word = text.substring(i, i + len);
          if (/^[\u4e00-\u9fa5]+$/.test(word)) {
            words.push(word);
          }
        }
      }
    }
    
    return [...new Set(words)];
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      charCacheSize: this.charCache.size,
      wordCacheSize: this.wordCache.size,
      sentenceCacheSize: this.sentenceCache.size,
      contextWindowSize: this.contextWindow.length,
      learningRate: Math.round(this.learningRate * 100) / 100
    };
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.charCache.clear();
    this.wordCache.clear();
    this.sentenceCache.clear();
    this.contextWindow = [];
  }
}

// === 导出 ===
module.exports = {
  LanguageUnderstandingEngine,
  CharPrograms,
  decompressChar,
  CompressionFormulas,
  SmartCharPrograms,
  smartDecompress,
  combineCharsToWord
};

// === 命令行测试 ===
if (require.main === module) {
  console.log('🧠 语言理解核心模块测试\n');
  console.log('='.repeat(60));
  
  const engine = new LanguageUnderstandingEngine();
  
  // 测试字理解
  console.log('\n📝 测试字理解:\n');
  ['爱', '家', '我', '想'].forEach(char => {
    const result = engine.understandChar(char);
    console.log(`字："${char}"`);
    console.log(`  压缩比：${result.compressionRatio}`);
    console.log(`  智能度：${result.intelligence}`);
    console.log(`  含义：${result.meaning || result.function}`);
    console.log();
  });
  
  // 测试词理解
  console.log('\n📝 测试词理解:\n');
  ['爱家', '我想', '爱你'].forEach(word => {
    const result = engine.understandWord(word);
    console.log(`词："${word}"`);
    console.log(`  压缩比：${result.totalCompression}`);
    console.log(`  协同因子：${result.synergyFactor}`);
    console.log(`  智能度：${result.intelligence}`);
    console.log();
  });
  
  // 测试句子理解
  console.log('\n📝 测试句子理解:\n');
  const sentence = '我爱你';
  const result = engine.understandSentence(sentence);
  console.log(`句子："${sentence}"`);
  console.log(`  字数：${result.charCount}`);
  console.log(`  总压缩比：${result.totalCompression}`);
  console.log(`  平均智能度：${result.averageIntelligence}`);
  console.log(`  综合情感：valence=${result.combinedEmotion.valence}, arousal=${result.combinedEmotion.arousal}`);
  console.log();
  
  // 显示统计
  console.log('\n📊 统计信息:\n');
  console.log(JSON.stringify(engine.getStats(), null, 2));
}
