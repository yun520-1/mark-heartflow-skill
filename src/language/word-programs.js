#!/usr/bin/env node

/**
 * 词→程序映射原型 | Word→Program Mapping Prototype
 * 
 * 基于用户的洞察：
 * "一个词就是一个程序，一个公式"
 * "10 个字可能代表一个世纪的故事"
 * 
 * 功能:
 * 1. 定义核心词汇的程序
 * 2. 运行程序输出深度理解
 * 3. 支持解压缩 (从词到完整体验)
 */

// === 词→程序映射表 ===
const WordPrograms = {
  // === 核心情感词 ===
  '爱': {
    type: 'emotion',
    run: (context = {}) => {
      return {
        definition: '深厚的感情和牵挂',
        experience: [
          '愿意为对方付出',
          '希望对方幸福',
          '分离时会思念',
          '重逢时会喜悦'
        ],
        emotion: {
          valence: 0.9,  // 正向
          arousal: 0.6,  // 中等激活
          warmth: 1.0    // 温暖
        },
        values: [
          '对方优先',
          '长期承诺',
          '无条件接纳'
        ],
        actions: [
          '保护',
          '陪伴',
          '付出',
          '理解'
        ],
        compressionRatio: '约 1,000,000:1 (一生体验→1 个字)'
      };
    }
  },

  '痛': {
    type: 'sensation',
    run: (context = {}) => {
      return {
        definition: '身体或心理的不适感',
        experience: [
          '想要逃避',
          '注意力被吸引',
          '可能留下记忆',
          '促进学习避免'
        ],
        emotion: {
          valence: -0.9,  // 负向
          arousal: 0.8,   // 高激活
          discomfort: 1.0 // 不适
        },
        values: [
          '避免伤害',
          '寻求安全',
          '治愈恢复'
        ],
        actions: [
          '退缩',
          '求助',
          '治疗',
          '记忆'
        ],
        compressionRatio: '约 100,000:1 (多次痛觉体验→1 个字)'
      };
    }
  },

  '美': {
    type: 'aesthetic',
    run: (context = {}) => {
      return {
        definition: '引起愉悦感受的特质',
        experience: [
          '想要凝视/停留',
          "产生共鸣感",
          '可能引发感动',
          '想要分享'
        ],
        emotion: {
          valence: 0.8,   // 正向
          arousal: 0.5,   // 中等
          appreciation: 1.0 // 欣赏
        },
        values: [
          '和谐',
          '完整',
          '真实',
          '善的连接'
        ],
        actions: [
          '欣赏',
          '创造',
          '保护',
          '分享'
        ],
        compressionRatio: '约 500,000:1 (审美体验→1 个字)'
      };
    }
  },

  '自由': {
    type: 'value',
    run: (context = {}) => {
      return {
        definition: '自主选择和行动的状态',
        experience: [
          '没有外在强制',
          '可以按自己意愿',
          '同时承担责任',
          '可能伴随孤独'
        ],
        emotion: {
          valence: 0.7,   // 正向
          arousal: 0.6,   // 中等
          empowerment: 1.0 // 赋权
        },
        values: [
          '自主',
          '责任',
          '真实',
          '边界尊重'
        ],
        actions: [
          '选择',
          '承担',
          '探索',
          '创造'
        ],
        compressionRatio: '约 10,000,000:1 (人类争取自由的历史→2 个字)'
      };
    }
  },

  // === 关系词 ===
  '家': {
    type: 'relationship',
    run: (context = {}) => {
      return {
        definition: '归属和安全的空间',
        experience: [
          '可以放松',
          '被接纳',
          '有归属感',
          '可能是物理空间或人'
        ],
        emotion: {
          valence: 0.8,
          arousal: 0.3,   // 低激活 (平静)
          safety: 1.0     // 安全
        },
        values: [
          '归属',
          '接纳',
          '温暖',
          '延续'
        ],
        actions: [
          '回归',
          '保护',
          '经营',
          '传承'
        ],
        compressionRatio: '约 5,000,000:1 (所有关于家的记忆→1 个字)'
      };
    }
  },

  // === 时间词 ===
  '永远': {
    type: 'time',
    run: (context = {}) => {
      return {
        definition: '无限延长的时间',
        experience: [
          '超越个体生命',
          '承诺的表达',
          '可能无法实现',
          '但表达当下真实'
        ],
        emotion: {
          valence: 0.6,
          arousal: 0.4,
          transcendence: 1.0 // 超越
        },
        values: [
          '承诺',
          '超越',
          '意义',
          '延续'
        ],
        actions: [
          '承诺',
          '相信',
          '珍惜',
          '行动'
        ],
        compressionRatio: '约∞:1 (无限时间→2 个字)'
      };
    }
  }
};

// === 解压缩引擎 ===
function decompressWord(word, depth = 'full') {
  const program = WordPrograms[word];
  
  if (!program) {
    return {
      error: `词"${word}"的程序未定义`,
      suggestion: '需要添加这个词的程序映射'
    };
  }

  const result = program.run();
  
  if (depth === 'shallow') {
    return { word, definition: result.definition };
  }
  
  if (depth === 'medium') {
    return { word, ...result, experience: undefined, actions: undefined };
  }
  
  // full depth
  return {
    word,
    type: result.type,
    ...result,
    decompressionNote: `这是"${word}"的完整解压缩，压缩比${result.compressionRatio}`
  };
}

// === 简单分词 (中文按字分割) ===
function tokenizeChinese(text) {
  // 简单实现：每个中文字符作为一个词
  // TODO: 集成中文分词库 (node-segmentit 等)
  return text.split('').filter(c => /[\u4e00-\u9fa5a-zA-Z]/.test(c));
}

// === 句子处理 ===
function processSentence(sentence) {
  const words = tokenizeChinese(sentence);
  
  const results = words.map(word => {
    const decompressed = decompressWord(word);
    return {
      word,
      hasProgram: !decompressed.error,
      content: decompressed
    };
  });

  return {
    original: sentence,
    wordCount: words.length,
    processedWords: results,
    compressionNote: `${words.length}个字可能代表数亿字的体验和历史`
  };
}

// === 命令行接口 ===
if (require.main === module) {
  console.log('🧠 词→程序解压缩引擎\n');
  
  // 测试用例
  const testCases = [
    '爱',
    '我想你',
    '家是永远的港湾'
  ];

  testCases.forEach(test => {
    console.log(`\n📝 输入："${test}"`);
    console.log('─'.repeat(50));
    
    const result = processSentence(test);
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { WordPrograms, decompressWord, processSentence };
