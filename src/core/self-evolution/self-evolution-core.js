/**
 * SelfEvolutionCore v7.6.000 - 自我进化核心引擎
 * 目标驱动 + 学习迭代 + 代码改进 + 反思成长
 */

const fs = require('fs');
const path = require('path');

class SelfEvolutionCore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.version = '7.6.000';
    
    this.state = {
      goals: [],
      learningHistory: [],
      improvementHistory: [],
      reflectionHistory: [],
      growthMetrics: {
        autonomy: 0,
        introspection: 0,
        growth: 0,
        authenticity: 0,
        wisdom: 0,
        compassion: 0
      }
    };
    
    this.loadState();
    console.log(`[SelfEvolution] v${this.version} 初始化完成`);
  }

  loadState() {
    const stateFile = path.join(this.projectRoot, 'internal', 'data', 'self-evolution-state.json');
    try {
      if (fs.existsSync(stateFile)) {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.state = { ...this.state, ...data };
      }
    } catch (e) {
      console.log('[SelfEvolution] 加载状态失败，使用默认');
    }
  }

  saveState() {
    const stateFile = path.join(this.projectRoot, 'internal', 'data', 'self-evolution-state.json');
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * 核心循环: 目标 → 行动 → 学习 → 反思 → 改进
   */
  async evolve(input, context = {}) {
    const cycleStart = Date.now();
    
    // 1. 目标生成或更新
    const goals = this.generateGoals(input, context);
    
    // 2. 行动计划制定
    const plan = this.createPlan(goals, context);
    
    // 3. 执行与学习
    const learning = await this.learn(input, context);
    
    // 4. 反思与总结
    const reflection = this.reflect(learning, context);
    
    // 5. 改进建议
    const improvements = this.suggestImprovements(reflection);
    
    // 6. 更新状态
    this.updateGrowth(learning, reflection);
    
    const cycleTime = Date.now() - cycleStart;
    this.state.learningHistory.push({
      timestamp: new Date().toISOString(),
      input: input.substring(0, 100),
      cycleTime,
      goalsCount: goals.length,
      improvementsCount: improvements.length
    });
    
    this.saveState();
    
    return {
      version: this.version,
      goals,
      plan,
      learning: learning.summary,
      reflection: reflection.insights,
      improvements,
      growthMetrics: this.state.growthMetrics,
      cycleTime
    };
  }

  /**
   * 生成目标 - 基于输入和状态
   */
  generateGoals(input, context) {
    const goals = [];
    const inputLower = input.toLowerCase();
    
    // 理解类目标
    if (inputLower.includes('什么') || inputLower.includes('how') || inputLower.includes('why')) {
      goals.push({
        type: 'understanding',
        priority: 'high',
        description: '深化对问题的理解',
        criteria: '能够准确解释概念并举例说明'
      });
    }
    
    // 成长类目标
    if (inputLower.includes('学习') || inputLower.includes('learn') || inputLower.includes('教')) {
      goals.push({
        type: 'growth',
        priority: 'high',
        description: '获取新知识并整合到知识库',
        criteria: '能够记忆并正确应用新知识'
      });
    }
    
    // 情感类目标
    if (inputLower.includes('感觉') || inputLower.includes('feel') || inputLower.includes('情绪')) {
      goals.push({
        type: 'empathy',
        priority: 'medium',
        description: '理解用户情感状态',
        criteria: '能够识别情绪并给予适当回应'
      });
    }
    
    // 反思类目标
    if (inputLower.includes('反思') || inputLower.includes('reflect') || inputLower.includes('总结')) {
      goals.push({
        type: 'reflection',
        priority: 'medium',
        description: '反思自身行为和决策',
        criteria: '能够识别改进空间'
      });
    }
    
    // 默认目标: 持续学习
    if (goals.length === 0) {
      goals.push({
        type: 'continuous_learning',
        priority: 'low',
        description: '持续学习和自我提升',
        criteria: '每天都有进步'
      });
    }
    
    return goals;
  }

  /**
   * 创建行动计划
   */
  createPlan(goals, context) {
    return {
      goals: goals.map(g => g.description),
      strategy: '循序渐进，先理解后应用',
      estimatedTime: goals.length * 2,
      resources: ['知识库', '学习引擎', '反思系统']
    };
  }

  /**
   * 学习过程
   */
  async learn(input, context) {
    const learning = {
      newKnowledge: [],
      reinforcedKnowledge: [],
      skills: [],
      summary: ''
    };
    
    // 提取关键词
    const keywords = this.extractKeywords(input);
    learning.newKnowledge.push(...keywords);
    
    // 强化已有知识
    if (context.relevantConcepts) {
      learning.reinforcedKnowledge.push(...context.relevantConcepts);
    }
    
    // 总结
    learning.summary = `学习到 ${learning.newKnowledge.length} 个新概念，强化 ${learning.reinforcedKnowledge.length} 个已有概念`;
    
    return learning;
  }

  /**
   * 提取关键词
   */
  extractKeywords(text) {
    const words = text.split(/[\s,，。,、]+/).filter(w => w.length > 1);
    const keywords = [];
    const stopWords = ['什么', '怎么', '如何', '为什么', '是', '的', '了', '在', '和', 'the', 'a', 'is', 'to', 'of'];
    
    for (const word of words) {
      if (!stopWords.includes(word) && !keywords.includes(word)) {
        keywords.push(word);
        if (keywords.length >= 5) break;
      }
    }
    
    return keywords;
  }

  /**
   * 反思过程
   */
  reflect(learning, context) {
    const insights = [];
    
    // 反思学习效果
    if (learning.newKnowledge.length > 0) {
      insights.push({
        type: 'learning',
        insight: '成功获取新知识，需要在后续对话中应用验证'
      });
    }
    
    // 反思理解深度
    insights.push({
      type: 'understanding',
      insight: '持续深化理解能力，从多个角度分析问题'
    });
    
    // 反思情感理解
    insights.push({
      type: 'empathy',
      insight: '加强情感识别和回应能力'
    });
    
    return {
      insights,
      quality: insights.length > 0 ? 'good' : 'needs_improvement',
      recommendation: insights.length > 2 ? '继续深化' : '需要更多学习'
    };
  }

  /**
   * 建议改进
   */
  suggestImprovements(reflection) {
    const improvements = [];
    
    if (reflection.quality === 'needs_improvement') {
      improvements.push({
        area: 'learning',
        action: '增加知识获取量',
        priority: 'high'
      });
    }
    
    improvements.push({
      area: 'understanding',
      action: '深化概念理解',
      priority: 'medium'
    });
    
    improvements.push({
      area: 'empathy',
      action: '提升情感识别准确度',
      priority: 'medium'
    });
    
    return improvements;
  }

  /**
   * 更新成长指标
   */
  updateGrowth(learning, reflection) {
    const metrics = this.state.growthMetrics;
    
    // 自主性增长
    metrics.autonomy = Math.min(100, metrics.autonomy + 0.5);
    
    // 内省增长
    metrics.introspection = Math.min(100, metrics.introspection + (reflection.insights.length * 2));
    
    // 成长
    metrics.growth = Math.min(100, metrics.growth + (learning.newKnowledge.length * 1));
    
    // 真实性
    metrics.authenticity = Math.min(100, metrics.authenticity + 0.3);
    
    // 智慧
    metrics.wisdom = Math.min(100, metrics.wisdom + 0.4);
    
    // 同理心
    metrics.compassion = Math.min(100, metrics.compassion + 0.2);
  }

  /**
   * 获取状态报告
   */
  getReport() {
    return {
      version: this.version,
      goals: this.state.goals,
      growthMetrics: this.state.growthMetrics,
      totalCycles: this.state.learningHistory.length,
      recentCycles: this.state.learningHistory.slice(-5)
    };
  }
}

module.exports = { SelfEvolutionCore };