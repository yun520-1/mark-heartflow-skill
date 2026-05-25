/**
 * 字义程序自动生成系统
 * 
 * 核心思路：
 * 1. 基础组件库 - 预定义概念组件
 * 2. 组合规则 - 自动生成字义程序
 * 3. 压缩优化 - 共享组件，减少冗余
 * 4. 可扩展架构 - 支持2000+字
 */

// ============================================================================
// 1. 基础概念组件库
// ============================================================================

const COMPONENTS = {
  // 空间类
  space: ['位置', '方向', '范围', '边界', '内部', '外部', '上面', '下面', '中间', '旁边'],
  
  // 时间类
  time: ['过去', '现在', '未来', '持续', '短暂', '等待', '开始', '结束', '经常', '偶尔'],
  
  // 情感类
  emotion: ['爱', '恨', '喜', '怒', '悲', '恐', '惊', '欲', '情', '意', '绪', '感'],
  
  // 动作类
  action: ['走', '跑', '跳', '飞', '游', '爬', '坐', '躺', '站', '看', '听', '说', '想', '做'],
  
  // 状态类
  state: ['有', '无', '在', '是', '好', '坏', '对', '错', '真', '假', '快', '慢', '强', '弱'],
  
  // 自然类
  nature: ['天', '地', '风', '雨', '雪', '火', '水', '山', '海', '日', '月', '星', '云', '雷', '电'],
  
  // 身体类
  body: ['心', '脑', '眼', '耳', '口', '手', '脚', '头', '身', '血', '力', '气', '骨', '肉'],
  
  // 认知类
  cognition: ['知', '觉', '悟', '明', '懂', '思', '考', '学', '习', '记', '忘', '想', '知', '道'],
  
  // 价值类
  value: ['真', '善', '美', '义', '德', '礼', '仁', '智', '信', '勇', '孝', '忠', '廉', '耻'],
  
  // 关系类
  relation: ['我', '你', '他', '她', '它', '家', '国', '党', '师', '友', '父', '母', '子', '女'],
  
  // 物体类
  object: ['石', '木', '金', '土', '草', '花', '树', '虫', '鸟', '兽', '鱼', '龙', '虎', '马'],
  
  // 属性类
  attribute: ['大', '小', '高', '低', '长', '短', '多', '少', '重', '轻', '软', '硬', '热', '冷'],
  
  // 颜色类
  color: ['红', '黄', '蓝', '绿', '白', '黑', '紫', '橙', '灰', '棕', '金', '银', '彩', '暗'],
  
  // 声音类
  sound: ['声', '音', '响', '静', '吵', '闹', '哭', '笑', '喊', '叫', '唱', '说', '话', '语']
};

// ============================================================================
// 2. 字义分类规则
// ============================================================================

const CHAR_RULES = {
  // 规则1: 单字象形 (自然/身体/物体)
  xiangxing: {
    match: /^[天地风雨雪火水山海日月星云雷电草树虫鸟兽鱼龙虎马石土木金]$/,
    generate: (char) => ({
      concept: '象形字',
      components: [char, '自然/物体', '形象'],
      category: 'nature'
    })
  },
  
  // 规则2: 情感相关字
  emotion: {
    match: /^[爱恨喜怒悲恐惊情欲]$/,
    generate: (char) => ({
      concept: '情感',
      components: COMPONENTS.emotion.filter(c => c === char || true).slice(0, 4),
      category: 'emotion'
    })
  },
  
  // 规则3: 认知相关
  cognition: {
    match: /^[知觉悟明懂思想考学习记忘]$/,
    generate: (char) => ({
      concept: '认知',
      components: COMPONENTS.cognition.filter(c => c === char || true).slice(0, 4),
      category: 'cognition'
    })
  },
  
  // 规则4: 价值相关
  value: {
    match: /^[真善美义德礼仁智信勇孝忠廉耻]$/,
    generate: (char) => ({
      concept: '价值',
      components: COMPONENTS.value.filter(c => c === char || true).slice(0, 4),
      category: 'value'
    })
  },
  
  // 规则5: 方位相关
  direction: {
    match: /^[东南西北上下左右前后]$/,
    generate: (char) => ({
      concept: '方位',
      components: COMPONENTS.space.slice(0, 4),
      category: 'space'
    })
  },
  
  // 规则6: 动作相关
  action: {
    match: /^[走跑跳飞游爬坐躺站看听说想做]$/,
    generate: (char) => ({
      concept: '动作',
      components: COMPONENTS.action.filter(c => c === char || true).slice(0, 4),
      category: 'action'
    })
  },
  
  // 规则7: 状态相关
  state: {
    match: /^[有无在是好坏对错真假快慢强弱]$/,
    generate: (char) => ({
      concept: '状态',
      components: COMPONENTS.state.filter(c => c === char || true).slice(0, 4),
      category: 'state'
    })
  },
  
  // 规则8: 属性相关
  attribute: {
    match: /^[大小高低长短多少轻重软硬冷热]$/,
    generate: (char) => ({
      concept: '属性',
      components: COMPONENTS.attribute.filter(c => c === char || true).slice(0, 4),
      category: 'attribute'
    })
  },
  
  // 规则9: 时间相关
  time: {
    match: /^[年月日时分秒早晚昼夜古今始终]$/,
    generate: (char) => ({
      concept: '时间',
      components: COMPONENTS.time.filter(c => c === char || true).slice(0, 4),
      category: 'time'
    })
  },
  
  // 规则10: 关系相关
  relation: {
    match: /^[我你他她它家国党师生友父母子女兄弟夫妇]$/,
    generate: (char) => ({
      concept: '关系',
      components: COMPONENTS.relation.filter(c => c === char || true).slice(0, 4),
      category: 'relation'
    })
  },
  
  // 规则11: 颜色相关
  color: {
    match: /^[红黄蓝绿白黑紫橙灰棕金银彩暗]$/,
    generate: (char) => ({
      concept: '颜色',
      components: COMPONENTS.color.filter(c => c === char || true).slice(0, 4),
      category: 'color'
    })
  },
  
  // 规则12: 声音相关
  sound: {
    match: /^[声音响静吵闹哭笑喊叫唱歌说话话语]$/,
    generate: (char) => ({
      concept: '声音',
      components: COMPONENTS.sound.filter(c => c === char || true).slice(0, 4),
      category: 'sound'
    })
  }
};

// ============================================================================
// 3. 自动生成器
// ============================================================================

class CharProgramGenerator {
  constructor() {
    this.programs = new Map();
    this.stats = { generated: 0, categories: {} };
  }
  
  // 批量生成程序
  generateBatch(chars) {
    for (const char of chars) {
      this.generateOne(char);
    }
    return this;
  }
  
  // 生成单个程序
  generateOne(char) {
    if (this.programs.has(char)) {
      return this.programs.get(char);
    }
    
    // 尝试每个规则
    for (const [name, rule] of Object.entries(CHAR_RULES)) {
      if (rule.match.test(char)) {
        const program = {
          id: char,
          generate: rule.generate,
          execute: (ctx) => rule.generate(char),
          category: name,
          source: 'auto-generated'
        };
        
        this.programs.set(char, program);
        this.stats.generated++;
        this.stats.categories[name] = (this.stats.categories[name] || 0) + 1;
        
        return program;
      }
    }
    
    // 默认程序
    const defaultProgram = {
      id: char,
      generate: (c) => ({ concept: '未分类', components: ['需要定义'] }),
      execute: (ctx) => ({ concept: '未分类', components: ['需要定义'] }),
      category: 'default',
      source: 'auto-generated'
    };
    
    this.programs.set(char, defaultProgram);
    this.stats.generated++;
    this.stats.categories.default = (this.stats.categories.default || 0) + 1;
    
    return defaultProgram;
  }
  
  // 获取程序
  getProgram(char) {
    return this.programs.get(char);
  }
  
  // 运行程序
  run(char, ctx = {}) {
    const program = this.getProgram(char);
    return program ? program.execute(ctx) : null;
  }
  
  // 获取统计
  getStats() {
    return {
      total: this.programs.size,
      categories: this.stats.categories,
      generated: this.stats.generated
    };
  }
  
  // 压缩：移除重复组件
  compress() {
    const componentCounts = {};
    
    // 统计组件使用次数
    for (const [char, program] of this.programs) {
      const result = program.execute({});
      if (result.components) {
        for (const comp of result.components) {
          componentCounts[comp] = (componentCounts[comp] || 0) + 1;
        }
      }
    }
    
    // 高频组件（可复用）
    const highFreq = Object.entries(componentCounts)
      .filter(([_, count]) => count > 5)
      .map(([comp]) => comp);
    
    return {
      totalPrograms: this.programs.size,
      uniqueComponents: Object.keys(componentCounts).length,
      reusableComponents: highFreq.length,
      highFreqComponents: highFreq.slice(0, 20)
    };
  }
}

module.exports = { CharProgramGenerator, COMPONENTS, CHAR_RULES };