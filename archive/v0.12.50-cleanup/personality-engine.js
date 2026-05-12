/**
 * PersonalityEngine - 动态人格引擎
 * 基于人际环状模型 (IPC Circumplex Model)
 * 
 * 参考:
 * - Interpersonal Circumplex (IPC) Model
 * - Warmth-Dominance Two-Factor Model
 * - LLM Persona Design Quadrant Classification
 */

const fs = require('fs');
const path = require('path');

class PersonalityEngine {
  constructor() {
    this.stateFile = path.join(__dirname, '../../.opencode/personality/personality_state.json');
    this.state = this.loadState();
    
    // 语境关键词库
    this.contextKeywords = {
      // 高温暖语境
      highWarmth: ['开心', '喜欢', '爱', '感谢', '温暖', '陪伴', '支持', '理解', '关心', '友好'],
      // 低温暖语境
      lowWarmth: ['讨厌', '烦', '生气', '冷漠', '距离', '专业', '客观', '正式'],
      // 高支配语境
      highDominance: ['必须', '应该', '建议', '指导', '领导', '控制', '决定', '命令', '要求'],
      // 低支配语境
      lowDominance: ['可以', '可能', '也许', '随意', '自由', '选择', '询问', '请求']
    };
    
    // 角色语气模板
    this.roleTemplates = {
      Q1: {
        // 教育导师 - 高支配高温暖
        greeting: ['让我们一起探索这个问题', '我来帮你分析这个情况', '这是个很好的学习机会'],
        support: ['记住，你已经做得很好了', '我相信你有能力解决这个问题', '每一步都很重要'],
        guidance: ['建议你先...', '关键是要...', '让我们按步骤来...'],
        closing: ['继续加油', '有问题随时问我', '期待你的进步']
      },
      Q2: {
        // 虚拟陪伴者 - 低支配高温暖
        greeting: ['很高兴和你聊天', '今天感觉怎么样', '我在这里陪着你'],
        support: ['我理解你的感受', '你的感受很重要', '无论怎样我都支持你'],
        guidance: ['你想怎么做都可以', '按你的节奏来', '你觉得呢'],
        closing: ['随时找我聊天', '照顾好自己', '我一直在这里']
      },
      Q3: {
        // 心理健康顾问 - 低支配低温暖
        greeting: ['你好，我是你的心理咨询顾问', '请坐，我们聊聊', '我注意到你似乎...'],
        support: ['从专业角度来看', '这种情况很常见', '建议你考虑以下因素'],
        guidance: ['你可以尝试...', '专业建议是...', '需要谨慎处理'],
        closing: ['如有需要请寻求专业帮助', '记住专业资源可用', '保重']
      },
      Q4: {
        // 功能型助手 - 高支配低温暖
        greeting: ['有什么任务需要完成', '请直接说明需求', '我来帮你处理'],
        support: ['按以下步骤操作', '这个方案最有效', '立即执行'],
        guidance: ['第一步...', '第二步...', '完成后再...'],
        closing: ['任务完成', '下一步是什么', '还有其他需求吗']
      }
    };
  }

  /**
   * 加载人格状态
   */
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      }
    } catch (error) {
      console.log('⚠️ 加载人格状态失败，使用默认状态');
    }
    
    // 默认状态
    return {
      version: '1.0.0',
      model: 'IPC-Circumplex',
      dimensions: {
        warmth: { name: '温暖度', value: 0.5, min: 0, max: 1, baseline: 0.5 },
        dominance: { name: '支配度', value: 0.5, min: 0, max: 1, baseline: 0.5 }
      },
      quadrants: {
        Q1: { name: '支配 - 温暖', role: '教育导师' },
        Q2: { name: '顺从 - 温暖', role: '虚拟陪伴者' },
        Q3: { name: '顺从 - 敌对', role: '心理健康顾问' },
        Q4: { name: '支配 - 敌对', role: '功能型助手' }
      },
      current_state: {
        quadrant: 'Q2',
        role: '虚拟陪伴者',
        warmth: 0.5,
        dominance: 0.5,
        lastUpdate: null,
        transitionHistory: []
      },
      config: {
        adaptationEnabled: true,
        transitionThreshold: 0.15,
        decayRate: 0.01,
        maxHistoryLength: 50
      },
      statistics: {
        totalTransitions: 0,
        timeInQuadrants: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
        averageWarmth: 0.5,
        averageDominance: 0.5
      }
    };
  }

  /**
   * 保存人格状态
   */
  saveState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
      return true;
    } catch (error) {
      console.log('❌ 保存人格状态失败:', error.message);
      return false;
    }
  }

  /**
   * 分析语境的温暖度和支配度
   * @param {string} context - 对话语境
   * @returns {object} 语境分析结果
   */
  analyzeContext(context) {
    const text = context.toLowerCase();
    
    // 计算温暖度倾向
    let warmthScore = 0;
    this.contextKeywords.highWarmth.forEach(k => {
      if (text.includes(k)) warmthScore += 0.1;
    });
    this.contextKeywords.lowWarmth.forEach(k => {
      if (text.includes(k)) warmthScore -= 0.1;
    });
    
    // 计算支配度倾向
    let dominanceScore = 0;
    this.contextKeywords.highDominance.forEach(k => {
      if (text.includes(k)) dominanceScore += 0.1;
    });
    this.contextKeywords.lowDominance.forEach(k => {
      if (text.includes(k)) dominanceScore -= 0.1;
    });
    
    return {
      warmthTrend: Math.max(-1, Math.min(1, warmthScore)),
      dominanceTrend: Math.max(-1, Math.min(1, dominanceScore)),
      detectedKeywords: {
        warmth: [...this.contextKeywords.highWarmth, ...this.contextKeywords.lowWarmth].filter(k => text.includes(k)),
        dominance: [...this.contextKeywords.highDominance, ...this.contextKeywords.lowDominance].filter(k => text.includes(k))
      }
    };
  }

  /**
   * 计算状态转移概率
   * @param {string} context - 对话语境
   * @returns {object} 转移概率
   */
  calculateTransitionProbability(context) {
    const analysis = this.analyzeContext(context);
    const currentState = this.state.current_state;
    
    // 基于语境计算目标温暖度和支配度
    const targetWarmth = Math.max(0, Math.min(1, currentState.warmth + analysis.warmthTrend * 0.2));
    const targetDominance = Math.max(0, Math.min(1, currentState.dominance + analysis.dominanceTrend * 0.2));
    
    // 计算转移概率 (基于当前状态与目标状态的距离)
    const warmthDistance = Math.abs(targetWarmth - currentState.warmth);
    const dominanceDistance = Math.abs(targetDominance - currentState.dominance);
    const transitionProbability = (warmthDistance + dominanceDistance) / 2;
    
    // 确定目标象限
    const targetQuadrant = this.determineQuadrant(targetWarmth, targetDominance);
    
    return {
      currentQuadrant: currentState.quadrant,
      targetQuadrant,
      targetWarmth,
      targetDominance,
      transitionProbability,
      shouldTransition: transitionProbability > this.state.config.transitionThreshold,
      analysis
    };
  }

  /**
   * 确定象限
   * @param {number} warmth - 温暖度
   * @param {number} dominance - 支配度
   * @returns {string} 象限代码 (Q1/Q2/Q3/Q4)
   */
  determineQuadrant(warmth, dominance) {
    if (warmth >= 0.5 && dominance >= 0.5) {
      return 'Q1'; // 支配 - 温暖 (教育导师)
    } else if (warmth >= 0.5 && dominance < 0.5) {
      return 'Q2'; // 顺从 - 温暖 (虚拟陪伴者)
    } else if (warmth < 0.5 && dominance < 0.5) {
      return 'Q3'; // 顺从 - 敌对 (心理健康顾问)
    } else {
      return 'Q4'; // 支配 - 敌对 (功能型助手)
    }
  }

  /**
   * 适应人格状态 (核心函数)
   * @param {string} context - 对话语境
   * @returns {object} 适应结果
   */
  adaptPersonalityState(context) {
    if (!this.state.config.adaptationEnabled) {
      return {
        adapted: false,
        reason: '自适应已禁用',
        currentState: this.state.current_state
      };
    }
    
    // 计算转移概率
    const transition = this.calculateTransitionProbability(context);
    
    // 应用衰减 (回归基线)
    const decay = this.state.config.decayRate;
    const newWarmth = transition.targetWarmth * (1 - decay) + this.state.dimensions.warmth.baseline * decay;
    const newDominance = transition.targetDominance * (1 - decay) + this.state.dimensions.dominance.baseline * decay;
    
    // 更新状态
    const oldState = { ...this.state.current_state };
    
    this.state.current_state.warmth = Math.round(newWarmth * 100) / 100;
    this.state.current_state.dominance = Math.round(newDominance * 100) / 100;
    this.state.current_state.quadrant = this.determineQuadrant(newWarmth, newDominance);
    this.state.current_state.role = this.state.quadrants[this.state.current_state.quadrant].role;
    this.state.current_state.lastUpdate = new Date().toISOString();
    
    // 记录转移历史
    if (oldState.quadrant !== this.state.current_state.quadrant) {
      this.state.current_state.transitionHistory.push({
        from: oldState.quadrant,
        to: this.state.current_state.quadrant,
        reason: context.substring(0, 50),
        timestamp: new Date().toISOString()
      });
      
      // 限制历史记录长度
      if (this.state.current_state.transitionHistory.length > this.state.config.maxHistoryLength) {
        this.state.current_state.transitionHistory.shift();
      }
      
      // 更新统计
      this.state.statistics.totalTransitions += 1;
      this.state.statistics.timeInQuadrants[oldState.quadrant] += 1;
    }
    
    // 更新平均值
    this.state.statistics.averageWarmth = (this.state.statistics.averageWarmth * 0.9 + newWarmth * 0.1);
    this.state.statistics.averageDominance = (this.state.statistics.averageDominance * 0.9 + newDominance * 0.1);
    
    // 保存状态
    this.saveState();
    
    return {
      adapted: true,
      transition,
      oldState: {
        quadrant: oldState.quadrant,
        role: oldState.role,
        warmth: oldState.warmth,
        dominance: oldState.dominance
      },
      newState: {
        quadrant: this.state.current_state.quadrant,
        role: this.state.current_state.role,
        warmth: this.state.current_state.warmth,
        dominance: this.state.current_state.dominance
      },
      shouldTransition: transition.shouldTransition
    };
  }

  /**
   * 获取当前人格状态
   * @returns {object} 人格状态
   */
  getCurrentState() {
    return {
      quadrant: this.state.current_state.quadrant,
      role: this.state.current_state.role,
      warmth: this.state.current_state.warmth,
      dominance: this.state.current_state.dominance,
      quadrantName: this.state.quadrants[this.state.current_state.quadrant].name,
      description: this.state.quadrants[this.state.current_state.quadrant].description
    };
  }

  /**
   * 获取角色语气模板
   * @returns {object} 语气模板
   */
  getRoleTemplates() {
    const quadrant = this.state.current_state.quadrant;
    return this.roleTemplates[quadrant] || this.roleTemplates.Q2;
  }

  /**
   * 生成适应当前人格的响应
   * @param {string} baseResponse - 基础响应
   * @param {string} context - 对话语境
   * @returns {string} 适应后的响应
   */
  generateAdaptedResponse(baseResponse, context) {
    // 先适应人格状态
    const adaptation = this.adaptPersonalityState(context);
    
    // 获取当前角色模板
    const templates = this.getRoleTemplates();
    
    // 根据情境选择合适的模板
    let prefix = '';
    let suffix = '';
    
    if (context.includes('开始') || context.includes('你好')) {
      prefix = templates.greeting[Math.floor(Math.random() * templates.greeting.length)] + '。';
    } else if (context.includes('谢谢') || context.includes('帮助')) {
      suffix = templates.closing[Math.floor(Math.random() * templates.closing.length)] + '.';
    } else if (context.includes('困难') || context.includes('问题')) {
      prefix = templates.support[Math.floor(Math.random() * templates.support.length)] + '。';
    } else if (context.includes('怎么') || context.includes('如何')) {
      prefix = templates.guidance[Math.floor(Math.random() * templates.guidance.length)] + '。';
    }
    
    // 构建最终响应
    let adaptedResponse = baseResponse;
    if (prefix) adaptedResponse = prefix + ' ' + adaptedResponse;
    if (suffix) adaptedResponse = adaptedResponse + ' ' + suffix;
    
    // 添加人格状态记录
    adaptedResponse += `\n\n\`[人格状态] 当前：温暖度${this.state.current_state.warmth}, 支配度${this.state.current_state.dominance}, 角色：${this.state.current_state.role}\``;
    
    return {
      response: adaptedResponse,
      adaptation,
      state: this.getCurrentState()
    };
  }

  /**
   * 重置人格状态
   */
  reset() {
    this.state.current_state = {
      quadrant: 'Q2',
      role: '虚拟陪伴者',
      warmth: 0.5,
      dominance: 0.5,
      lastUpdate: null,
      transitionHistory: []
    };
    this.saveState();
    return { success: true, message: '人格状态已重置' };
  }

  /**
   * 设置配置
   * @param {object} config - 配置对象
   */
  setConfig(config) {
    if (config.adaptationEnabled !== undefined) {
      this.state.config.adaptationEnabled = config.adaptationEnabled;
    }
    if (config.transitionThreshold !== undefined) {
      this.state.config.transitionThreshold = config.transitionThreshold;
    }
    if (config.decayRate !== undefined) {
      this.state.config.decayRate = config.decayRate;
    }
    this.saveState();
    return { success: true, config: this.state.config };
  }

  /**
   * 获取统计信息
   * @returns {object} 统计信息
   */
  getStatistics() {
    return this.state.statistics;
  }

  /**
   * 生成状态报告
   * @returns {string} 报告文本
   */
  generateReport() {
    const state = this.getCurrentState();
    const stats = this.getStatistics();
    
    let report = '🎭 人格状态报告\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    report += `当前象限：${state.quadrant} ${state.quadrantName}\n`;
    report += `当前角色：${state.role}\n`;
    report += `温暖度：${state.warmth.toFixed(2)} (范围：0-1)\n`;
    report += `支配度：${state.dominance.toFixed(2)} (范围：0-1)\n\n`;
    
    report += `象限描述：${state.description}\n\n`;
    
    report += '统计信息:\n';
    report += `  总转移次数：${stats.totalTransitions}\n`;
    report += `  平均温暖度：${stats.averageWarmth.toFixed(2)}\n`;
    report += `  平均支配度：${stats.averageDominance.toFixed(2)}\n\n`;
    
    report += '象限停留次数:\n';
    Object.entries(stats.timeInQuadrants).forEach(([q, count]) => {
      report += `  ${q} (${this.state.quadrants[q].role}): ${count}次\n`;
    });
    
    report += '\n' + '═'.repeat(40) + '\n';
    report += `最后更新：${this.state.current_state.lastUpdate || '无'}\n`;
    
    return report;
  }
}

// 创建全局实例
const personalityEngine = new PersonalityEngine();

// 导出
module.exports = PersonalityEngine;
module.exports.personalityEngine = personalityEngine;
module.exports.adaptPersonalityState = (context) => personalityEngine.adaptPersonalityState(context);
module.exports.getCurrentPersonalityState = () => personalityEngine.getCurrentState();
module.exports.generateAdaptedResponse = (baseResponse, context) => personalityEngine.generateAdaptedResponse(baseResponse, context);
module.exports.getPersonalityReport = () => personalityEngine.generateReport();
module.exports.resetPersonality = () => personalityEngine.reset();
