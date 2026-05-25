#!/usr/bin/env node

/**
 * 批量字程序生成器 | Batch Character Program Generator
 * 
 * 基于用户的指导：
 * "重点是用现有的模型，进行批量运算，得到最优的程序，如何容纳常用 2000 个字的字意和程序"
 * 
 * 功能:
 * 1. 从字典文件读取 2500 个常用字
 * 2. 批量生成每个字的程序
 * 3. 使用优化的数据结构
 * 4. 输出可执行的 JS 文件
 */

const fs = require('fs');
const path = require('path');

// === 配置 ===
const CONFIG = {
  dictionaryFile: path.join(__dirname, '../../data/dictionary/modern-chinese-dictionary.md'),
  outputFile: path.join(__dirname, 'char-programs-batch.js'),
  maxChars: 2500
};

// === 字的情感/价值/文化数据库 (用于批量生成) ===
const CHAR_METADATA = {
  // 超高频情感字 (情感强度 0.8-1.0)
  highEmotion: ['爱', '恨', '喜', '怒', '哀', '乐', '悲', '痛', '欢', '爱', '家', '亲', '情', '思', '念'],
  
  // 高频代词/人称 (自我指涉 1.0)
  pronouns: ['我', '你', '他', '她', '它', '咱', '您', '自', '己', '谁'],
  
  // 高频动词 (行动导向 0.7-0.9)
  verbs: ['是', '有', '在', '来', '去', '说', '看', '想', '做', '走', '吃', '喝', '睡', '起', '行', '动', '生', '死', '活', '工', '作', '学', '习', '教', '读', '写', '买', '卖', '给', '拿', '开', '关', '进', '出', '上', '下', '回', '过', '到'],
  
  // 高频名词 (概念密度 0.6-0.8)
  nouns: ['人', '家', '国', '天', '地', '日', '月', '水', '火', '山', '石', '田', '土', '木', '金', '鱼', '鸟', '虫', '花', '草', '树', '车', '船', '书', '门', '窗', '床', '桌', '椅', '饭', '菜', '茶', '酒', '衣', '鞋', '笔', '纸', '钱', '信', '画'],
  
  // 高频形容词 (情感价 0.5-0.8)
  adjectives: ['大', '小', '多', '少', '高', '低', '长', '短', '好', '坏', '美', '丑', '新', '旧', '老', '少', '冷', '热', '快', '慢', '早', '晚', '远', '近', '深', '浅', '重', '轻', '难', '易', '对', '错', '真', '假', '清', '白', '黑', '红', '黄', '蓝', '绿'],
  
  // 功能字 (压缩比低但使用频率极高)
  functionChars: ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '就', '这', '也', '为', '着', '以', '上', '时', '到', '要', '可', '然', '与', '其', '而', '如', '何', '但', '又', '从', '于', '因', '会', '得', '让', '使', '被', '把', '将', '对', '向', '过', '还', '么', '后', '来', '着', '看', '见', '起', '现', '当', '本', '前', '所', '此', '些', '那', '你', '他', '她', '它', '们', '这个', '那个']
};

// === 批量生成字程序的算法 ===
const BatchGenerator = {
  /**
   * 计算字的情感强度 (0-1)
   */
  calculateEmotionalIntensity: (char, category) => {
    const baseScores = {
      highEmotion: 0.9,
      pronouns: 0.5,
      verbs: 0.6,
      nouns: 0.5,
      adjectives: 0.7,
      functionChars: 0.1
    };
    
    return baseScores[category] || 0.5;
  },

  /**
   * 计算字的价值权重 (0-1)
   */
  calculateValueWeight: (char, category) => {
    const baseScores = {
      highEmotion: 0.9,
      pronouns: 0.8,
      verbs: 0.7,
      nouns: 0.6,
      adjectives: 0.7,
      functionChars: 0.5
    };
    
    return baseScores[category] || 0.5;
  },

  /**
   * 计算字的文化深度 (0-1)
   */
  calculateCulturalDepth: (char, category) => {
    const baseScores = {
      highEmotion: 0.9,
      pronouns: 0.7,
      verbs: 0.6,
      nouns: 0.8,
      adjectives: 0.6,
      functionChars: 0.4
    };
    
    return baseScores[category] || 0.5;
  },

  /**
   * 计算体验次数 (基于使用频率)
   */
  calculateExperienceCount: (char, frequency) => {
    const baseCounts = {
      '超高频': 1000000,
      '高频': 500000,
      '中频': 100000,
      '低频': 10000
    };
    
    return baseCounts[frequency] || 100000;
  },

  /**
   * 生成单个字的程序
   */
  generateCharProgram: (char, pinyin, category, frequency) => {
    const emotionalIntensity = BatchGenerator.calculateEmotionalIntensity(char, category);
    const valueWeight = BatchGenerator.calculateValueWeight(char, category);
    const culturalDepth = BatchGenerator.calculateCulturalDepth(char, category);
    const experienceCount = BatchGenerator.calculateExperienceCount(char, frequency);
    
    // 计算压缩比
    const rawInformation = experienceCount * (1 + emotionalIntensity) * (1 + valueWeight);
    const encodedInformation = 16; // 16 bits per Chinese character
    const compressionRatio = Math.round(rawInformation / encodedInformation * (1 + culturalDepth * 0.5));
    
    // 计算智能度
    const intelligence = Math.round((
      0.9 * 0.2 +  // compressionAbility
      0.9 * 0.25 +  // decompressionAccuracy
      0.85 * 0.15 +  // associationSpeed
      0.85 * 0.2 +  // learningRate
      0.9 * 0.2  // contextUnderstanding
    ) * 100) / 10;
    
    return {
      pinyin,
      category,
      frequency: frequency || '中频',
      experienceData: {
        experienceCount,
        emotionalIntensity,
        valueWeight,
        culturalDepth,
        usageFrequency: category === 'functionChars' ? 1.0 : 0.7
      },
      program: {
        compressionRatio: `${compressionRatio.toLocaleString()}:1`,
        intelligence
      }
    };
  },

  /**
   * 批量生成所有字的程序
   */
  generateAll: (charList) => {
    const programs = {};
    
    charList.forEach(item => {
      const { char, pinyin, category, frequency } = item;
      programs[char] = BatchGenerator.generateCharProgram(char, pinyin, category, frequency);
    });
    
    return programs;
  }
};

// === 从字典文件解析常用字 ===
function parseDictionary(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const chars = [];
  
  // 解析格式：字 (拼音) - 词性，释义
  const lines = content.split('\n');
  
  for (const line of lines) {
    // 匹配：爱 (ài) - 动词，深厚的感情
    const match = line.match(/^([^\s(]+)\s*\(([^)]+)\)\s*-\s*(.+)/);
    if (match && match[1].length === 1 && /[\u4e00-\u9fa5]/.test(match[1])) {
      const [, char, pinyin, definition] = match;
      
      // 分类
      let category = 'nouns';
      if (CHAR_METADATA.highEmotion.includes(char)) category = 'highEmotion';
      else if (CHAR_METADATA.pronouns.includes(char)) category = 'pronouns';
      else if (CHAR_METADATA.verbs.includes(char)) category = 'verbs';
      else if (CHAR_METADATA.adjectives.includes(char)) category = 'adjectives';
      else if (CHAR_METADATA.functionChars.includes(char)) category = 'functionChars';
      
      // 频率
      let frequency = '中频';
      if (CHAR_METADATA.functionChars.includes(char)) frequency = '超高频';
      else if (CHAR_METADATA.highEmotion.includes(char) || CHAR_METADATA.pronouns.includes(char)) frequency = '高频';
      
      chars.push({ char, pinyin, category, frequency, definition: definition.trim() });
    }
  }
  
  return chars.slice(0, CONFIG.maxChars);
}

// === 生成优化后的 JS 文件 ===
function generateOptimizedJS(programs, outputPath) {
  let content = `#!/usr/bin/env node

/**
 * 批量生成的字程序库 | Batch Generated Character Programs
 * 
 * 生成时间：${new Date().toISOString()}
 * 字数：${Object.keys(programs).length}
 * 
 * 数据结构优化:
 * - 使用紧凑的 JSON 格式
 * - 共享公共数据
 * - 支持快速查找
 */

// === 压缩公式 (共享) ===
const CompressionFormulas = {
  calculateCompression: (experienceCount, emotionalIntensity, valueWeight, culturalDepth) => {
    const rawInformation = experienceCount * (1 + emotionalIntensity) * (1 + valueWeight);
    const encodedInformation = 16;
    return Math.round(rawInformation / encodedInformation * (1 + culturalDepth * 0.5));
  },
  
  calculateIntelligence: () => {
    return Math.round((0.9*0.2 + 0.9*0.25 + 0.85*0.15 + 0.85*0.2 + 0.9*0.2) * 100) / 10;
  }
};

// === 字程序库 (${Object.keys(programs).length} 字) ===
const CharPrograms = ${JSON.stringify(programs, null, 2)};

// === 解压缩函数 ===
function decompressChar(char) {
  const program = CharPrograms[char];
  if (!program) {
    return { error: '字未定义', char };
  }
  
  const { compressionRatio, intelligence } = program.program;
  const { experienceData } = program;
  
  return {
    char,
    pinyin: program.pinyin,
    category: program.category,
    frequency: program.frequency,
    compressionRatio,
    intelligence,
    experienceData,
    decompressionNote: '这是"' + char + '"的批量生成程序'
  };
}

// === 批量解压缩 ===
function decompressChars(chars) {
  return chars.map(char => decompressChar(char)).filter(r => !r.error);
}

// === 命令行测试 ===
if (require.main === module) {
  console.log('📖 批量生成的字程序库\\n');
  console.log('总字数:', Object.keys(CharPrograms).length);
  console.log('\\n示例测试:\\n');
  
  const testChars = ['爱', '家', '我', '你', '的', '是', '不', '了'];
  testChars.forEach(char => {
    const result = decompressChar(char);
    if (!result.error) {
      console.log('"' + char + '": 压缩比=' + result.compressionRatio + ', 智能度=' + result.intelligence);
    }
  });
}

module.exports = { CharPrograms, decompressChar, decompressChars, CompressionFormulas };
`;

  fs.writeFileSync(outputPath, content);
  console.log(`✅ 已生成优化后的 JS 文件：${outputPath}`);
  console.log(`   文件大小：${(content.length / 1024).toFixed(2)} KB`);
  console.log(`   字数：${Object.keys(programs).length}`);
}

// === 主函数 ===
function main() {
  console.log('🧠 批量字程序生成器\n');
  console.log('='.repeat(60));
  
  // 1. 解析字典
  console.log('\n📖 步骤 1: 解析字典文件...');
  const chars = parseDictionary(CONFIG.dictionaryFile);
  console.log(`   解析到 ${chars.length} 个字`);
  
  // 2. 批量生成程序
  console.log('\n🔧 步骤 2: 批量生成程序...');
  const programs = BatchGenerator.generateAll(chars);
  console.log(`   生成 ${Object.keys(programs).length} 个字的程序`);
  
  // 3. 生成优化后的 JS 文件
  console.log('\n💾 步骤 3: 生成优化 JS 文件...');
  generateOptimizedJS(programs, CONFIG.outputFile);
  
  // 4. 统计
  console.log('\n📊 统计信息:');
  const categories = {};
  Object.values(programs).forEach(p => {
    categories[p.category] = (categories[p.category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} 字`);
  });
  
  console.log('\n✅ 批量生成完成!\n');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { BatchGenerator, parseDictionary };
