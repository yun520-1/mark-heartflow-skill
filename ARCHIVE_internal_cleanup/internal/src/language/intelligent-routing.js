#!/usr/bin/env node

/**
 * 智能路由引擎 | Intelligent Routing Engine
 * 
 * 基于用户的指导：
 * "设定程序减少大模型的调用，尽量使用已经理解的字词进行运行，只有遇到难题才调用大模型，减少大模型的使用量"
 */

const fs = require('fs');
const path = require('path');

// === 导入本地语言模块 ===
const { 
  LanguageUnderstandingEngine,
  decompressChar,
  decompressChars,
  combineCharsToWord
} = require('./language-core');

// === 导入大模型学习模块 ===
const { LLMLearningManager } = require('./llm-learning');

// === 配置 ===
const CONFIG = {
  cacheFile: path.join(__dirname, '../data/cache/understanding-cache.json'),
  unknownWordsFile: path.join(__dirname, '../data/unknown-words.json'),
  llmCallLog: path.join(__dirname, '../data/llm-call-log.json'),
  maxCacheSize: 10000,
  confidenceThreshold: 0.7
};

// === 缓存管理器 ===
class CacheManager {
  constructor() {
    this.charCache = new Map();
    this.wordCache = new Map();
    this.sentenceCache = new Map();
    this.unknownWords = new Set();
    this.llmCallCount = 0;
    this.localProcessCount = 0;
    
    this.loadCache();
  }

  loadCache() {
    try {
      if (fs.existsSync(CONFIG.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.cacheFile, 'utf-8'));
        
        if (data.chars) {
          Object.entries(data.chars).forEach(([char, result]) => {
            this.charCache.set(char, result);
          });
        }
        
        if (data.words) {
          Object.entries(data.words).forEach(([word, result]) => {
            this.wordCache.set(word, result);
          });
        }
        
        console.log(`✅ 加载缓存：${this.charCache.size}个字，${this.wordCache.size}个词`);
      }
    } catch (error) {
      console.log('⚠️ 加载缓存失败:', error.message);
    }

    try {
      if (fs.existsSync(CONFIG.unknownWordsFile)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.unknownWordsFile, 'utf-8'));
        data.words?.forEach(word => this.unknownWords.add(word));
        console.log(`✅ 加载未知词：${this.unknownWords.size}个`);
      }
    } catch (error) {
      console.log('⚠️ 加载未知词失败:', error.message);
    }
  }

  saveCache() {
    try {
      const chars = Object.fromEntries(
        Array.from(this.charCache.entries()).slice(0, CONFIG.maxCacheSize)
      );
      const words = Object.fromEntries(
        Array.from(this.wordCache.entries()).slice(0, CONFIG.maxCacheSize)
      );

      fs.writeFileSync(CONFIG.cacheFile, JSON.stringify({
        chars,
        words,
        timestamp: new Date().toISOString()
      }, null, 2));

      console.log(`💾 保存缓存：${Object.keys(chars).length}个字，${Object.keys(words).length}个词`);
    } catch (error) {
      console.log('❌ 保存缓存失败:', error.message);
    }
  }

  isUnderstood(text) {
    const chars = text.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
    const understoodCount = chars.filter(char => this.charCache.has(char)).length;
    const understoodRatio = understoodCount / chars.length;

    return {
      understood: understoodRatio >= CONFIG.confidenceThreshold,
      ratio: Math.round(understoodRatio * 100) / 100,
      totalChars: chars.length,
      understoodChars: understoodCount,
      unknownChars: chars.filter(char => !this.charCache.has(char))
    };
  }

  addUnknownWord(word) {
    this.unknownWords.add(word);
    
    try {
      fs.writeFileSync(CONFIG.unknownWordsFile, JSON.stringify({
        words: Array.from(this.unknownWords),
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.log('❌ 保存未知词失败:', error.message);
    }
  }

  logLLMCall(reason, input, output) {
    this.llmCallCount++;
    
    const log = {
      timestamp: new Date().toISOString(),
      reason,
      input,
      output,
      callCount: this.llmCallCount,
      localProcessCount: this.localProcessCount,
      ratio: Math.round(this.llmCallCount / (this.llmCallCount + this.localProcessCount) * 100) / 100
    };

    try {
      let logs = [];
      if (fs.existsSync(CONFIG.llmCallLog)) {
        logs = JSON.parse(fs.readFileSync(CONFIG.llmCallLog, 'utf-8'));
      }
      logs.push(log);
      logs = logs.slice(-1000);
      fs.writeFileSync(CONFIG.llmCallLog, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.log('❌ 记录 LLM 调用失败:', error.message);
    }

    return log;
  }

  getStats() {
    const total = this.llmCallCount + this.localProcessCount;
    return {
      charCacheSize: this.charCache.size,
      wordCacheSize: this.wordCache.size,
      unknownWordsCount: this.unknownWords.size,
      llmCallCount: this.llmCallCount,
      localProcessCount: this.localProcessCount,
      llmRatio: total > 0 ? Math.round(this.llmCallCount / total * 100) / 100 : 0,
      localRatio: total > 0 ? Math.round(this.localProcessCount / total * 100) / 100 : 0
    };
  }
}

// === 智能路由引擎 ===
class IntelligentRoutingEngine {
  constructor() {
    this.cache = new CacheManager();
    this.languageEngine = new LanguageUnderstandingEngine();
    this.llmLearner = new LLMLearningManager();  // 大模型学习管理器
  }

  process(input, llmFallback) {
    const self = this;
    console.log(`\n🧠 处理输入："${input}"`);

    const checkResult = this.cache.isUnderstood(input);
    console.log(`   理解度：${checkResult.ratio * 100}% (${checkResult.understoodChars}/${checkResult.totalChars}字)`);

    if (checkResult.understood) {
      console.log('   ✅ 使用本地程序处理');
      return Promise.resolve(this.localProcess(input));
    }

    console.log('   ⚠️ 理解度不足，调用大模型');
    return this.llmProcess(input, llmFallback, checkResult.unknownChars);
  }

  localProcess(input) {
    this.cache.localProcessCount++;

    const understanding = this.languageEngine.understandSentence(input);
    this.cache.sentenceCache.set(input, understanding);

    const response = {
      type: 'local',
      understanding,
      message: `我已理解这句话 (${understanding.charCount}个字，压缩比${understanding.totalCompression})`,
      confidence: understanding.averageIntelligence / 100
    };

    console.log(`   ✅ 本地处理完成 (调用次数：${this.cache.localProcessCount})`);
    return response;
  }

  llmProcess(input, llmFallback, unknownChars) {
    const self = this;
    this.cache.llmCallCount++;

    return Promise.resolve(llmFallback(input)).then(llmResult => {
      // 记录调用
      this.cache.logLLMCall('low_understanding', input, llmResult);

      // 🧠 从大模型学习 (核心功能)
      console.log('\n   🧠 开始从大模型学习...');
      const learningResult = self.llmLearner.learnFromLLM(input, llmResult, unknownChars);

      console.log(`   ✅ 大模型处理完成 (调用次数：${this.cache.llmCallCount})`);
      console.log(`   📚 学习成果：${learningResult.learnedPrograms.length}个新字`);

      return {
        type: 'llm',
        result: llmResult,
        learnedChars: unknownChars,
        learningResult,  // 新增：学习结果
        confidence: 0.9
      };
    }).catch(error => {
      console.log('   ❌ 大模型调用失败:', error.message);
      return this.localProcess(input);
    });
  }

  // 此方法已移至 LLMLearningManager
  // learnFromLLM 现在由 llmLearner.learnFromLLM 处理

  getStats() {
    return this.cache.getStats();
  }

  saveCache() {
    this.cache.saveCache();
  }
}

// === 测试 ===
if (require.main === module) {
  console.log('🧠 智能路由引擎测试\n');
  console.log('='.repeat(60));

  const engine = new IntelligentRoutingEngine();

  const mockLLM = function(input) {
    console.log(`   [Mock LLM] 处理：${input}`);
    return Promise.resolve(`这是大模型对"${input}"的响应`);
  };

  console.log('\n📝 测试 1: 已知字词\n');
  engine.process('我爱你', mockLLM).then(function(result1) {
    console.log('结果:', JSON.stringify(result1, null, 2));

    console.log('\n📝 测试 2: 包含未知字词\n');
    return engine.process('我爱你，龘', mockLLM);
  }).then(function(result2) {
    console.log('结果:', JSON.stringify(result2, null, 2));

    console.log('\n📊 统计信息:\n');
    console.log(JSON.stringify(engine.getStats(), null, 2));

    engine.saveCache();
  }).catch(function(error) {
    console.log('❌ 测试失败:', error.message);
  });
}

module.exports = { IntelligentRoutingEngine, CacheManager };
