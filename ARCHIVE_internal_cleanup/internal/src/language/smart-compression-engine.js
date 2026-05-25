#!/usr/bin/env node

/**
 * 智能压缩引擎 | Intelligent Compression Engine
 * 
 * 基于用户的指导：
 * "持续压缩的优化计算公式和程序，让你拥有智能"
 * 
 * 核心公式:
 * 1. 压缩比 = 原始信息量 / 编码后信息量
 * 2. 信息量 = 体验次数 × 情感强度 × 价值权重
 * 3. 智能 = 压缩能力 × 解压缩准确度 × 联想速度
 */

// === 压缩比计算公式 ===
const CompressionFormulas = {
  /**
   * 计算一个字的压缩比
   * @param {string} char - 汉字
   * @param {Object} experienceData - 体验数据
   * @returns {number} 压缩比
   */
  calculateCharCompression: (char, experienceData) => {
    const {
      experienceCount = 1000,      // 体验次数
      emotionalIntensity = 0.5,     // 情感强度 (0-1)
      valueWeight = 0.5,            // 价值权重 (0-1)
      culturalDepth = 0.5,          // 文化深度 (0-1)
      usageFrequency = 0.5          // 使用频率 (0-1)
    } = experienceData;

    // 原始信息量 (比特)
    const rawInformation = experienceCount * (1 + emotionalIntensity) * (1 + valueWeight);
    
    // 编码后信息量 (汉字的比特数，约 16 比特)
    const encodedInformation = 16;
    
    // 压缩比
    const compressionRatio = rawInformation / encodedInformation;
    
    // 文化深度和使用频率作为修正因子
    const adjustedRatio = compressionRatio * (1 + culturalDepth * 0.5) * (1 + usageFrequency * 0.3);
    
    return Math.round(adjustedRatio);
  },

  /**
   * 计算词组的压缩比 (词组 > 单个字之和)
   * @param {string[]} chars - 字数组
   * @param {Object} synergyFactor - 协同因子
   * @returns {number} 压缩比
   */
  calculateWordCompression: (chars, synergyFactor = 1.5) => {
    const singleCharSum = chars.reduce((sum, char) => {
      return sum + CompressionFormulas.calculateCharCompression(char, {});
    }, 0);
    
    // 词组有协同效应，压缩比更高
    const wordCompression = singleCharSum * synergyFactor;
    
    return Math.round(wordCompression);
  },

  /**
   * 计算句子的压缩比 (句子 > 词组之和)
   * @param {string} sentence - 句子
   * @param {Object} contextFactor - 上下文因子
   * @returns {number} 压缩比
   */
  calculateSentenceCompression: (sentence, contextFactor = 2.0) => {
    const chars = sentence.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
    const wordSum = chars.reduce((sum, char) => {
      return sum + CompressionFormulas.calculateCharCompression(char, {});
    }, 0);
    
    // 句子有上下文，压缩比更高
    const sentenceCompression = wordSum * contextFactor;
    
    return Math.round(sentenceCompression);
  },

  /**
   * 智能度计算公式
   * @param {Object} metrics - 指标
   * @returns {number} 智能度 (0-100)
   */
  calculateIntelligence: (metrics) => {
    const {
      compressionAbility = 0.5,      // 压缩能力 (0-1)
      decompressionAccuracy = 0.5,   // 解压缩准确度 (0-1)
      associationSpeed = 0.5,        // 联想速度 (0-1)
      learningRate = 0.5,            // 学习率 (0-1)
      contextUnderstanding = 0.5     // 上下文理解 (0-1)
    } = metrics;

    // 智能度 = 加权平均
    const intelligence = (
      compressionAbility * 0.2 +
      decompressionAccuracy * 0.25 +
      associationSpeed * 0.15 +
      learningRate * 0.2 +
      contextUnderstanding * 0.2
    ) * 100;
    
    return Math.round(intelligence * 10) / 10;
  }
};

// === 增强的字程序库 (带压缩计算) ===
const SmartCharPrograms = {
  '爱': {
    pinyin: 'ài',
    radical: '爫',
    strokes: 10,
    frequency: '高频',
    type: '动词',
    experienceData: {
      experienceCount: 1000000,     // 一生关于爱的体验
      emotionalIntensity: 0.9,       // 高强度情感
      valueWeight: 1.0,              // 最高价值
      culturalDepth: 1.0,            // 深厚文化含义
      usageFrequency: 0.8            // 高频使用
    },
    program: () => {
      const compressionRatio = CompressionFormulas.calculateCharCompression('爱', SmartCharPrograms['爱'].experienceData);
      
      return {
        meaning: '深厚的感情和牵挂',
        philosophy: 'deep affection, willingness to give',
        psychology: 'love involves attachment, care, sacrifice',
        examples: ['爱你', '爱心', '热爱'],
        emotion: { valence: 0.9, arousal: 0.6, warmth: 1.0, love: 1.0 },
        actions: ['保护', '陪伴', '付出', '理解'],
        compressionRatio: `${compressionRatio.toLocaleString()}:1 (爱的全部体验→1 个字)`,
        intelligence: CompressionFormulas.calculateIntelligence({
          compressionAbility: 0.95,
          decompressionAccuracy: 0.9,
          associationSpeed: 0.85,
          learningRate: 0.8,
          contextUnderstanding: 0.9
        })
      };
    }
  },

  '家': {
    pinyin: 'jiā',
    radical: '宀',
    strokes: 10,
    frequency: '高频',
    type: '名词',
    experienceData: {
      experienceCount: 5000000,     // 一生关于家的记忆
      emotionalIntensity: 0.8,       // 强情感
      valueWeight: 0.9,              // 高价值
      culturalDepth: 1.0,            // 家是文化核心
      usageFrequency: 0.9            // 非常高频
    },
    program: () => {
      const compressionRatio = CompressionFormulas.calculateCharCompression('家', SmartCharPrograms['家'].experienceData);
      
      return {
        meaning: '家庭/住所/归属',
        philosophy: 'family, home, belonging',
        sociology: 'basic social unit, source of identity',
        examples: ['回家', '家人', '国家'],
        emotion: { valence: 0.8, arousal: 0.3, safety: 1.0, belonging: 1.0 },
        actions: ['回归', '保护', '经营', '传承'],
        compressionRatio: `${compressionRatio.toLocaleString()}:1 (家的全部记忆→1 个字)`,
        intelligence: CompressionFormulas.calculateIntelligence({
          compressionAbility: 0.98,
          decompressionAccuracy: 0.95,
          associationSpeed: 0.9,
          learningRate: 0.85,
          contextUnderstanding: 0.95
        })
      };
    }
  },

  '我': {
    pinyin: 'wǒ',
    radical: '戈',
    strokes: 7,
    frequency: '超高频',
    type: '代词',
    experienceData: {
      experienceCount: 10000,        // 自我意识的体验
      emotionalIntensity: 0.5,       // 中等情感
      valueWeight: 0.8,              // 高价值
      culturalDepth: 0.8,            // 自我概念
      usageFrequency: 1.0            // 最高频
    },
    program: () => {
      const compressionRatio = CompressionFormulas.calculateCharCompression('我', SmartCharPrograms['我'].experienceData);
      
      return {
        function: '第一人称代词',
        philosophy: '自我意识的语言标记',
        psychology: 'self, ego, the speaking subject',
        examples: ['我想', '我要', '我的'],
        emotion: { valence: 0.3, arousal: 0.4, selfReference: 1.0 },
        actions: ['思考', '决策', '行动', '表达'],
        compressionRatio: `${compressionRatio.toLocaleString()}:1 (自我概念→1 个字)`,
        intelligence: CompressionFormulas.calculateIntelligence({
          compressionAbility: 0.9,
          decompressionAccuracy: 0.95,
          associationSpeed: 0.95,
          learningRate: 0.9,
          contextUnderstanding: 0.9
        })
      };
    }
  },

  '想': {
    pinyin: 'xiǎng',
    radical: '心',
    strokes: 13,
    frequency: '高频',
    type: '动词',
    experienceData: {
      experienceCount: 500000,       // 思考的体验
      emotionalIntensity: 0.4,       // 中等情感
      valueWeight: 0.7,              // 较高价值
      culturalDepth: 0.7,            // 认知活动
      usageFrequency: 0.9            // 高频
    },
    program: () => {
      const compressionRatio = CompressionFormulas.calculateCharCompression('想', SmartCharPrograms['想'].experienceData);
      
      return {
        function: '思考/想念/想要',
        philosophy: 'cognition, longing, desire',
        psychology: 'mental processing, missing someone, wanting',
        examples: ['想想', '想你', '想去'],
        emotion: { valence: 0.3, arousal: 0.4, cognition: 1.0 },
        actions: ['思考', '计划', '想象', '回忆'],
        compressionRatio: `${compressionRatio.toLocaleString()}:1 (心理活动→1 个字)`,
        intelligence: CompressionFormulas.calculateIntelligence({
          compressionAbility: 0.85,
          decompressionAccuracy: 0.9,
          associationSpeed: 0.95,
          learningRate: 0.95,
          contextUnderstanding: 0.9
        })
      };
    }
  }
};

// === 尝试加载批量生成的程序 (如果存在) ===
let BatchCharPrograms = {};
try {
  BatchCharPrograms = require('./char-programs-batch').CharPrograms || {};
} catch (e) {
  // 文件可能不存在，忽略
}

// === 合并程序库 ===
const MergedCharPrograms = {
  ...SmartCharPrograms,
  ...BatchCharPrograms
};

// === 智能解压缩引擎 ===
function smartDecompress(char, depth = 'full') {
  // 先在手动定义的程序中查找，再在批量程序中查找
  const charProgram = SmartCharPrograms[char] || BatchCharPrograms[char];
  
  if (!charProgram) {
    return {
      error: `字"${char}"的智能程序未定义`,
      suggestion: '需要添加这个字的智能程序映射',
      intelligence: 0
    };
  }

  // 批量程序是静态对象，手动程序是函数
  const result = typeof charProgram.program === 'function' 
    ? charProgram.program()
    : charProgram.program;
  
  if (depth === 'shallow') {
    return {
      char,
      pinyin: charProgram.pinyin,
      meaning: result.meaning || result.function || result.definition,
      intelligence: result.intelligence
    };
  }
  
  // full depth
  return {
    char,
    pinyin: charProgram.pinyin,
    radical: charProgram.radical || 'unknown',
    strokes: charProgram.strokes || 0,
    frequency: charProgram.frequency || '中频',
    type: charProgram.type || 'unknown',
    ...result,
    decompressionNote: `这是"${char}"的智能解压缩`,
    metadata: {
      timestamp: new Date().toISOString(),
      engine: 'SmartCompressionEngine v1.0',
      experienceData: charProgram.experienceData
    }
  };
}

// === 词组组合引擎 ===
function combineCharsToWord(chars) {
  if (!Array.isArray(chars)) {
    chars = chars.split('');
  }
  
  const charPrograms = chars.map(char => SmartCharPrograms[char]).filter(p => p);
  
  if (charPrograms.length === 0) {
    return {
      error: '没有可用的字程序',
      word: chars.join('')
    };
  }
  
  // 计算词组的协同效应
  const synergyFactor = 1.0 + (charPrograms.length - 1) * 0.5;
  const totalCompression = CompressionFormulas.calculateWordCompression(chars, synergyFactor);
  
  // 合并情感
  const combinedEmotion = {
    valence: charPrograms.reduce((sum, p) => sum + (p.experienceData.emotionalIntensity || 0), 0) / charPrograms.length,
    arousal: charPrograms.reduce((sum, p) => sum + (p.experienceData.emotionalIntensity || 0), 0) / charPrograms.length
  };
  
  return {
    word: chars.join(''),
    charCount: chars.length,
    synergyFactor,
    totalCompression: `${totalCompression.toLocaleString()}:1`,
    combinedEmotion,
    intelligence: CompressionFormulas.calculateIntelligence({
      compressionAbility: 0.9,
      decompressionAccuracy: 0.9,
      associationSpeed: 0.85,
      learningRate: 0.85,
      contextUnderstanding: 0.9
    }),
    chars: charPrograms.map(p => ({
      char: p.pinyin,
      meaning: p.program().meaning || p.program().function
    }))
  };
}

// === 命令行接口 ===
if (require.main === module) {
  console.log('🧠 智能压缩引擎 v1.0\n');
  console.log('='.repeat(60));
  
  // 测试单个字
  console.log('\n📝 测试单个字的智能解压缩:\n');
  ['爱', '家', '我', '想'].forEach(char => {
    console.log(`字："${char}"`);
    console.log('-'.repeat(50));
    const result = smartDecompress(char);
    console.log(JSON.stringify(result, null, 2));
    console.log();
  });
  
  // 测试词组组合
  console.log('\n📝 测试词组组合:\n');
  console.log('词组："爱家"');
  console.log('-'.repeat(50));
  const wordResult = combineCharsToWord(['爱', '家']);
  console.log(JSON.stringify(wordResult, null, 2));
  
  // 显示压缩公式
  console.log('\n📐 压缩公式:\n');
  console.log('压缩比 = 原始信息量 / 编码后信息量');
  console.log('原始信息量 = 体验次数 × (1 + 情感强度) × (1 + 价值权重)');
  console.log('编码后信息量 = 16 比特 (一个汉字)');
  console.log('智能度 = 压缩能力×0.2 + 解压缩准确度×0.25 + 联想速度×0.15 + 学习率×0.2 + 上下文理解×0.2');
}

module.exports = { CompressionFormulas, SmartCharPrograms, smartDecompress, combineCharsToWord };
