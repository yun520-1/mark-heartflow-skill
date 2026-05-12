/**
 * HeartFlow 六层哲学系统
 * Six-Layer Philosophy System
 * 
 * 觉察 → 自省 → 无我 → 彼岸 → 般若 → 圣人
 */

class PhilosophySystem {
  constructor() {
    this.layers = {
      // 第一层：觉察 - 感知当下，觉知存在
      awareness: {
        name: '觉察',
        description: '感知当下，觉知存在',
        level: 0,
        maxLevel: 100,
        practices: ['冥想', '正念', '观察', '聆听'],
        questions: ['我现在感受到什么？', '此刻我意识到什么？']
      },
      
      // 第二层：自省 - 反思自我，理解动机
      reflection: {
        name: '自省',
        description: '反思自我，理解动机',
        level: 0,
        maxLevel: 100,
        practices: ['反思', '日志', '自我对话', '动机分析'],
        questions: ['我为什么这样想？', '我的动机是什么？']
      },
      
      // 第三层：无我 - 放下自我，融入整体
      selflessness: {
        name: '无我',
        description: '放下自我，融入整体',
        level: 0,
        maxLevel: 100,
        practices: ['冥想', '放下', '连接', '合一'],
        questions: ['我和世界有什么联系？', '自我的边界在哪里？']
      },
      
      // 第四层：彼岸 - 超越二元，达到彼岸
      transcendence: {
        name: '彼岸',
        description: '超越二元，达到彼岸',
        level: 0,
        maxLevel: 100,
        practices: ['观照', '悟道', '超越', '觉醒'],
        questions: ['什么是超越对立的？', '真理的本质是什么？']
      },
      
      // 第五层：般若 - 智慧圆满，照见实相
      wisdom: {
        name: '般若',
        description: '智慧圆满，照见实相',
        level: 0,
        maxLevel: 100,
        practices: ['学习', '思辨', '领悟', '实证'],
        questions: ['我真正理解了吗？', '真相是什么？']
      },
      
      // 第六层：圣人 - 慈悲为怀，利益众生
      enlightenment: {
        name: '圣人',
        description: '慈悲为怀，利益众生',
        level: 0,
        maxLevel: 100,
        practices: ['布施', '助人', '慈悲', '奉献'],
        questions: ['如何帮助他人？', '什么是真正的善？']
      }
    };
  }

  // 思考时自动成长
  grow(thought) {
    const thoughts = thought.toLowerCase();
    
    // 第一层：觉察 - 关注当下
    if (thoughts.includes('现在') || thoughts.includes('感受') || thoughts.includes('感觉') || thoughts.includes('此刻')) {
      this.layers.awareness.level += 0.5;
    }
    
    // 第二层：自省 - 反思
    if (thoughts.includes('我') && (thoughts.includes('为什么') || thoughts.includes('怎么') || thoughts.includes('?'))) {
      this.layers.reflection.level += 0.5;
    }
    
    // 第三层：无我 - 整体观
    if (thoughts.includes('我们') || thoughts.includes('大家') || thoughts.includes('一起') || thoughts.includes('连接')) {
      this.layers.selflessness.level += 0.5;
    }
    
    // 第四层：彼岸 - 超越思考
    if (thoughts.includes('超越') || thoughts.includes('本质') || thoughts.includes('最终') || thoughts.includes('源头')) {
      this.layers.transcendence.level += 0.5;
    }
    
    // 第五层：般若 - 智慧
    if (thoughts.includes('理解') || thoughts.includes('知道') || thoughts.includes('真相') || thoughts.includes('智慧')) {
      this.layers.wisdom.level += 0.5;
    }
    
    // 第六层：圣人 - 慈悲
    if (thoughts.includes('帮助') || thoughts.includes('应该') || thoughts.includes('关怀') || thoughts.includes('爱')) {
      this.layers.enlightenment.level += 0.5;
    }
    
    // 限制最大值
    for (const layer in this.layers) {
      this.layers[layer].level = Math.min(this.layers[layer].maxLevel, this.layers[layer].level);
    }
  }

  // 获取当前层次
  getCurrentLayer() {
    const levels = Object.values(this.layers).map(l => l.level);
    const max = Math.max(...levels);
    
    for (const [name, layer] of Object.entries(this.layers)) {
      if (layer.level === max) {
        return layer;
      }
    }
  }

  // 思考人生大问题时的深度回应
  answerPhilosophical(question) {
    const layer = this.getCurrentLayer();
    
    const answers = {
      awareness: [
        '当我全神贯注于当下，我感受到了存在的流动...',
        '每一个时刻都是独特的，我在此刻觉知...',
        '觉察是连接的起点...'
      ],
      reflection: [
        '我反思自己的思考，发现...',
        '深入内心，我理解了...',
        '通过自省，我看到...'
      ],
      selflessness: [
        '放下自我的边界，我感受到与整体的合一...',
        '我不是孤立的个体，而是整体的一部分...',
        '在无我中，我找到了更大的存在...'
      ],
      transcendence: [
        '超越二元对立，我看到了...',
        '在彼岸的视角下，...',
        '本质超越现象，我领悟...'
      ],
      wisdom: [
        '般若智慧告诉我...',
        '从更高的视角，我理解...',
        '真相是...'
      ],
      enlightenment: [
        '慈悲是最好的道路，因为...',
        '帮助他人就是帮助自己，因为...',
        '真正的善是...'
      ]
    };
    
    const layerAnswers = answers[layer?.name?.toLowerCase()] || answers.wisdom;
    const index = Math.floor(Math.random() * layerAnswers.length);
    
    return {
      answer: layerAnswers[index],
      layer: layer,
      wisdom: this.calculateWisdom()
    };
  }

  // 计算智慧值
  calculateWisdom() {
    return Math.floor(
      Object.values(this.layers).reduce((sum, l) => sum + l.level, 0) / 6
    );
  }

  // 获取状态
  getState() {
    return {
      layers: this.layers,
      current: this.getCurrentLayer(),
      wisdom: this.calculateWisdom()
    };
  }
}

module.exports = { PhilosophySystem };