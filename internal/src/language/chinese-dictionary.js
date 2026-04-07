#!/usr/bin/env node

/**
 * 中文字典程序库 | Chinese Character Program Library
 * 
 * 基于用户的指导：
 * "先从底层字义开始，先下载一部字典，先了解字和词写成程序和公式"
 * 
 * 功能:
 * 1. 定义常用汉字的程序
 * 2. 支持字的解压缩
 * 3. 支持字→词组合
 */

// === 基础字程序库 (按使用频率排序) ===
const CharPrograms = {
  // === 超高频字 (Top 20) ===
  
  '的': {
    pinyin: 'de',
    radical: '白',
    strokes: 8,
    frequency: '超高频',
    type: '助词',
    program: () => ({
      function: '所有格标记/定语标记',
      compression: '连接修饰语和中心语',
      logic: 'X 的 Y = X belongs to Y / X modifies Y',
      examples: ['我的书', '美丽的花', '昨天的事'],
      emotion: { valence: 0, arousal: 0 },  // 中性
      compressionRatio: '100:1 (关系表达→1 个字)'
    })
  },

  '一': {
    pinyin: 'yī',
    radical: '一',
    strokes: 1,
    frequency: '超高频',
    type: '数词',
    program: () => ({
      meaning: '最小正整数/唯一/同一',
      philosophy: '万物之始，道生一',
      math: '1, the first positive integer',
      examples: ['一个人', '一样', '一起'],
      emotion: { valence: 0.1, arousal: 0.1 },
      compressionRatio: '1000:1 (单一性概念→1 个字)'
    })
  },

  '是': {
    pinyin: 'shì',
    radical: '日',
    strokes: 9,
    frequency: '超高频',
    type: '判断词',
    program: () => ({
      function: '判断/肯定/存在',
      logic: 'A 是 B = A ∈ B / A = B',
      examples: ['我是学生', '这是书', '是的'],
      emotion: { valence: 0.2, arousal: 0.3 },
      compressionRatio: '500:1 (判断陈述→1 个字)'
    })
  },

  '我': {
    pinyin: 'wǒ',
    radical: '戈',
    strokes: 7,
    frequency: '超高频',
    type: '代词',
    program: () => ({
      function: '第一人称代词',
      philosophy: '自我意识的语言标记',
      psychology: 'self, ego, the speaking subject',
      examples: ['我想', '我要', '我的'],
      emotion: { valence: 0.3, arousal: 0.4, selfReference: 1.0 },
      compressionRatio: '10000:1 (自我概念→1 个字)'
    })
  },

  '你': {
    pinyin: 'nǐ',
    radical: '人',
    strokes: 7,
    frequency: '超高频',
    type: '代词',
    program: () => ({
      function: '第二人称代词',
      philosophy: '他者意识的语言标记',
      psychology: 'you, the other, the addressee',
      examples: ['你想', '你要', '你的'],
      emotion: { valence: 0.3, arousal: 0.4, otherReference: 1.0 },
      compressionRatio: '10000:1 (他者概念→1 个字)'
    })
  },

  '不': {
    pinyin: 'bù',
    radical: '一',
    strokes: 4,
    frequency: '超高频',
    type: '否定词',
    program: () => ({
      function: '否定/拒绝',
      logic: '不 X = ¬X / NOT X',
      examples: ['不是', '不要', '不好'],
      emotion: { valence: -0.3, arousal: 0.3, negation: 1.0 },
      compressionRatio: '200:1 (否定操作→1 个字)'
    })
  },

  '了': {
    pinyin: 'le',
    radical: '乙',
    strokes: 2,
    frequency: '超高频',
    type: '助词',
    program: () => ({
      function: '完成体标记/变化标记',
      time: '表示动作完成或状态变化',
      aspect: 'perfective aspect, change of state',
      examples: ['吃了', '来了', '好了'],
      emotion: { valence: 0.1, arousal: 0.2, completion: 1.0 },
      compressionRatio: '300:1 (时态标记→1 个字)'
    })
  },

  '人': {
    pinyin: 'rén',
    radical: '人',
    strokes: 2,
    frequency: '超高频',
    type: '名词',
    program: () => ({
      meaning: '人类/个体/他人',
      philosophy: '万物之灵，有意识的存在',
      biology: 'Homo sapiens, conscious being',
      examples: ['人们', '别人', '人生'],
      emotion: { valence: 0.4, arousal: 0.3, humanity: 1.0 },
      compressionRatio: '100000:1 (人类概念→1 个字)'
    })
  },

  '在': {
    pinyin: 'zài',
    radical: '土',
    strokes: 6,
    frequency: '超高频',
    type: '介词',
    program: () => ({
      function: '存在/位置/进行',
      space: '表示位置',
      time: '表示进行',
      examples: ['在家', '存在', '在看书'],
      emotion: { valence: 0.1, arousal: 0.1, existence: 1.0 },
      compressionRatio: '400:1 (存在/位置→1 个字)'
    })
  },

  '有': {
    pinyin: 'yǒu',
    radical: '月',
    strokes: 6,
    frequency: '超高频',
    type: '动词',
    program: () => ({
      function: '拥有/存在',
      logic: '有 X = ∃X / X exists',
      examples: ['有钱', '有人', '有事'],
      emotion: { valence: 0.3, arousal: 0.2, possession: 1.0 },
      compressionRatio: '500:1 (存在量化→1 个字)'
    })
  },

  '这': {
    pinyin: 'zhè',
    radical: '辶',
    strokes: 7,
    frequency: '超高频',
    type: '代词',
    program: () => ({
      function: '近指代词',
      space: '指代较近的人或事物',
      examples: ['这个', '这里', '这样'],
      emotion: { valence: 0.1, arousal: 0.2, proximity: 1.0 },
      compressionRatio: '200:1 (近指→1 个字)'
    })
  },

  '中': {
    pinyin: 'zhōng',
    radical: '丨',
    strokes: 4,
    frequency: '超高频',
    type: '方位词',
    program: () => ({
      meaning: '中间/内部/中国',
      philosophy: '中庸之道，不偏不倚',
      examples: ['中间', '中国', '心中'],
      emotion: { valence: 0.3, arousal: 0.1, balance: 1.0 },
      compressionRatio: '1000:1 (中心概念→1 个字)'
    })
  },

  '来': {
    pinyin: 'lái',
    radical: '木',
    strokes: 7,
    frequency: '高频',
    type: '动词',
    program: () => ({
      function: '移动/趋向',
      direction: '向说话者方向移动',
      time: '未来',
      examples: ['来了', '来北京', '未来'],
      emotion: { valence: 0.3, arousal: 0.4, approach: 1.0 },
      compressionRatio: '500:1 (趋近运动→1 个字)'
    })
  },

  '上': {
    pinyin: 'shàng',
    radical: '一',
    strokes: 3,
    frequency: '高频',
    type: '方位词',
    program: () => ({
      meaning: '上方/向上/上升',
      direction: '垂直向上',
      examples: ['上面', '上学', '上班'],
      emotion: { valence: 0.3, arousal: 0.3, upward: 1.0 },
      compressionRatio: '400:1 (向上方向→1 个字)'
    })
  },

  '要': {
    pinyin: 'yào',
    radical: '西',
    strokes: 9,
    frequency: '高频',
    type: '助动词',
    program: () => ({
      function: '想要/需要/将要',
      modality: '意愿/必要/未来',
      examples: ['我要', '要好', '要来了'],
      emotion: { valence: 0.4, arousal: 0.5, desire: 1.0 },
      compressionRatio: '600:1 (意愿表达→1 个字)'
    })
  },

  '想': {
    pinyin: 'xiǎng',
    radical: '心',
    strokes: 13,
    frequency: '高频',
    type: '动词',
    program: () => ({
      function: '思考/想念/想要',
      mind: '心理活动',
      examples: ['想想', '想你', '想去'],
      emotion: { valence: 0.3, arousal: 0.4, cognition: 1.0 },
      compressionRatio: '2000:1 (心理活动→1 个字)'
    })
  },

  '爱': {
    pinyin: 'ài',
    radical: '爫',
    strokes: 10,
    frequency: '高频',
    type: '动词',
    program: () => ({
      meaning: '深厚的感情',
      emotion: '正向情感，愿意付出',
      psychology: 'deep affection, willingness to give',
      examples: ['爱你', '爱心', '热爱'],
      emotion: { valence: 0.9, arousal: 0.6, warmth: 1.0, love: 1.0 },
      compressionRatio: '1000000:1 (爱的全部体验→1 个字)'
    })
  },

  '家': {
    pinyin: 'jiā',
    radical: '宀',
    strokes: 10,
    frequency: '高频',
    type: '名词',
    program: () => ({
      meaning: '家庭/住所/归属',
      emotion: '安全感和归属感',
      sociology: 'family, home, belonging',
      examples: ['回家', '家人', '国家'],
      emotion: { valence: 0.8, arousal: 0.3, safety: 1.0, belonging: 1.0 },
      compressionRatio: '5000000:1 (家的全部记忆→1 个字)'
    })
  },

  '生': {
    pinyin: 'shēng',
    radical: '生',
    strokes: 5,
    frequency: '高频',
    type: '动词',
    program: () => ({
      meaning: '生命/出生/活着',
      philosophy: '生生不息，生命之本',
      biology: 'life, birth, living',
      examples: ['生活', '生命', '学生'],
      emotion: { valence: 0.6, arousal: 0.5, life: 1.0 },
      compressionRatio: '10000000:1 (生命概念→1 个字)'
    })
  },

  '死': {
    pinyin: 'sǐ',
    radical: '歹',
    strokes: 6,
    frequency: '中频',
    type: '动词',
    program: () => ({
      meaning: '死亡/终结',
      philosophy: '生命的终结，存在的消失',
      biology: 'death, end of life',
      examples: ['死亡', '死了', '生死'],
      emotion: { valence: -0.9, arousal: 0.7, finality: 1.0 },
      compressionRatio: '10000000:1 (死亡概念→1 个字)'
    })
  }
};

// === 解压缩引擎 ===
function decompressChar(char) {
  const program = CharPrograms[char];
  
  if (!program) {
    return {
      error: `字"${char}"的程序未定义`,
      suggestion: '需要添加这个字的程序映射',
      basic: {
        char: char,
        note: '这个字还没有程序定义，只有基本信息'
      }
    };
  }

  const result = program.program();
  
  return {
    char,
    pinyin: program.pinyin,
    radical: program.radical,
    strokes: program.strokes,
    frequency: program.frequency,
    type: program.type,
    ...result,
    decompressionNote: `这是"${char}"的完整解压缩`
  };
}

// === 命令行接口 ===
if (require.main === module) {
  console.log('📖 中文字典程序库\n');
  
  // 显示已定义的字
  console.log(`已定义 ${Object.keys(CharPrograms).length} 个字的程序:\n`);
  console.log(Object.keys(CharPrograms).join(' '));
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试解压缩
  const testChars = ['爱', '家', '我', '你', '生', '死'];
  
  testChars.forEach(char => {
    console.log(`\n📝 字："${char}"`);
    console.log('─'.repeat(50));
    const result = decompressChar(char);
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { CharPrograms, decompressChar };
