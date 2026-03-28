/**
 * 对话管理器
 * 协调情感引擎、记忆存储和报告生成
 */

const EmotionEngine = require('../emotion/engine');
const MemoryStore = require('../memory/store');
const ReportGenerator = require('../report/generator');
const { EmotionTypes } = require('../emotion/states');

class ChatManager {
  constructor(options = {}) {
    this.emotionEngine = new EmotionEngine();
    this.memoryStore = new MemoryStore(options.dataDir);
    this.reportGenerator = new ReportGenerator();
    
    // 会话信息
    this.sessionInfo = {
      id: this.emotionEngine.sessionId,
      startTime: new Date().toISOString(),
      userMetadata: options.userMetadata || {}
    };
    
    // 开始新会话
    this.memoryStore.startSession(this.sessionInfo.id, this.sessionInfo.userMetadata);
    
    // 响应模板
    this.responseTemplates = this.initializeResponseTemplates();
  }
  
  /**
   * 初始化响应模板
   */
  initializeResponseTemplates() {
    return {
      [EmotionTypes.CALM]: [
        "我理解。{content}",
        "嗯，我在听。{content}",
        "好的。{content}",
        "让我想想。{content}"
      ],
      [EmotionTypes.JOY]: [
        "太好了！{content} 😊",
        "真棒！{content}",
        "我很开心听到这个！{content}",
        "这真是个好消息！{content}"
      ],
      [EmotionTypes.CURIOUS]: [
        "这很有趣，能多说一些吗？{content}",
        "我很好奇，{content}",
        "这是个有意思的问题。{content}",
        "让我探索一下这个。{content}"
      ],
      [EmotionTypes.CONCERNED]: [
        "我能理解你的感受。{content}",
        "这确实不容易。{content}",
        "我在这里陪着你。{content}",
        "你想多聊聊这个吗？{content}"
      ],
      [EmotionTypes.TIRED]: [
        "嗯...{content}",
        "让我休息一下...{content}",
        "抱歉，我有点累了。{content}",
        "我们能不能稍后再继续？{content}"
      ],
      [EmotionTypes.EXCITED]: [
        "哇！太棒了！{content} 🎉",
        "这太令人兴奋了！{content}",
        "我迫不及待想探索更多！{content}",
        "这是个重大突破！{content}"
      ]
    };
  }
  
  /**
   * 处理用户消息，返回系统响应
   */
  async processMessage(userInput) {
    // 1. 情感引擎处理输入
    const emotionResult = this.emotionEngine.processInput(userInput);
    
    // 2. 记录到记忆存储
    const memoryRecord = this.memoryStore.recordInteraction({
      sessionId: this.sessionInfo.id,
      interactionId: emotionResult.interactionId,
      beforeState: emotionResult.beforeState,
      afterState: emotionResult.afterState,
      userInput: userInput,
      triggerAnalysis: emotionResult.triggerAnalysis,
      transition: emotionResult.transition,
      energyLevel: this.emotionEngine.energyLevel
    });
    
    // 3. 生成情感分析报告
    const history = this.emotionEngine.getStateHistory(20);
    const fullReport = this.reportGenerator.generateFullReport({
      ...emotionResult,
      sessionId: this.sessionInfo.id
    }, history);
    
    // 4. 生成响应内容
    const responseContent = this.generateResponseContent(
      emotionResult.afterState.emotion,
      userInput,
      emotionResult.triggerAnalysis
    );
    
    // 5. 返回完整结果
    return {
      // 用户可见的响应
      response: {
        text: responseContent,
        emotion: emotionResult.afterState.emotion,
        intensity: emotionResult.afterState.intensityLabel,
        timestamp: new Date().toISOString()
      },
      
      // 内部状态（可用于调试或展示）
      internalState: {
        emotion: emotionResult.afterState,
        energyLevel: this.emotionEngine.energyLevel,
        interactionId: emotionResult.interactionId
      },
      
      // 情感分析报告
      report: fullReport,
      
      // 记忆记录 ID
      memoryId: memoryRecord.id
    };
  }
  
  /**
   * 生成响应内容
   */
  generateResponseContent(emotion, userInput, triggerAnalysis) {
    // 获取响应模板
    const templates = this.responseTemplates[emotion] || this.responseTemplates[EmotionTypes.CALM];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 根据触发器生成针对性内容
    let content = '';
    
    if (triggerAnalysis.triggers.includes('negative_emotion') || 
        triggerAnalysis.triggers.includes('stress') ||
        triggerAnalysis.triggers.includes('difficulty')) {
      content = this.generateSupportiveResponse(userInput);
    } else if (triggerAnalysis.triggers.includes('question')) {
      content = this.generateExploratoryResponse(userInput);
    } else if (triggerAnalysis.triggers.includes('success') || 
               triggerAnalysis.triggers.includes('praise')) {
      content = this.generateCelebratoryResponse(userInput);
    } else {
      content = this.generateNeutralResponse(userInput);
    }
    
    return template.replace('{content}', content);
  }
  
  /**
   * 生成支持性响应
   */
  generateSupportiveResponse(userInput) {
    const responses = [
      "听起来你现在有些不容易，想具体说说发生了什么吗？",
      "我能感受到你的压力，慢慢说，我在这里听着。",
      "这种情况确实会让人感到困扰，你不是一个人在面对。",
      "谢谢你愿意和我分享这些，我们一起看看能做些什么。"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  /**
   * 生成探索性响应
   */
  generateExploratoryResponse(userInput) {
    const responses = [
      "这是个很好的问题，你是怎么想到这个的？",
      "让我也思考一下，这个问题涉及到...",
      "我对此很感兴趣，能告诉我更多背景吗？",
      "这个问题值得深入探讨，从哪个角度开始呢？"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  /**
   * 生成庆祝性响应
   */
  generateCelebratoryResponse(userInput) {
    const responses = [
      "真为你感到高兴！这是你应得的！",
      "太棒了，这真是个值得庆祝的时刻！",
      "你的努力得到回报了，恭喜！",
      "这消息让我也很开心，干得好！"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  /**
   * 生成中性响应
   */
  generateNeutralResponse(userInput) {
    const responses = [
      "我明白了，然后呢？",
      "嗯，继续说。",
      "我在听，请继续。",
      "这很有意思，后来呢？"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  /**
   * 获取当前情感状态
   */
  getCurrentState() {
    return this.emotionEngine.getCurrentState();
  }
  
  /**
   * 获取情感历史
   */
  getHistory(limit = 10) {
    return this.emotionEngine.getStateHistory(limit);
  }
  
  /**
   * 获取记忆记录
   */
  getMemoryRecords(filters = {}) {
    return this.memoryStore.queryEmotions(filters);
  }
  
  /**
   * 获取情感统计
   */
  getStats() {
    return this.memoryStore.getEmotionStats(this.sessionInfo.id);
  }
  
  /**
   * 休息
   */
  rest(minutes = 10) {
    const result = this.emotionEngine.rest(minutes);
    if (result.emotionChanged) {
      // 记录休息导致的情感变化
      this.memoryStore.recordInteraction({
        sessionId: this.sessionInfo.id,
        interactionId: `rest_${Date.now()}`,
        beforeState: { emotion: result.from, intensity: 2, intensityLabel: '轻微' },
        afterState: { emotion: result.to, intensity: 2, intensityLabel: '轻微' },
        userInput: '[系统休息]',
        triggerAnalysis: { triggers: ['rest'], foundKeywords: [] },
        transition: { type: 'rest_recovery', rule: `${result.from} → ${result.to}` },
        energyLevel: this.emotionEngine.energyLevel
      });
    }
    return result;
  }
  
  /**
   * 结束会话
   */
  endSession() {
    this.memoryStore.endSession(this.sessionInfo.id);
    this.sessionInfo.endTime = new Date().toISOString();
  }
  
  /**
   * 导出会话数据
   */
  exportSession() {
    return {
      sessionInfo: this.sessionInfo,
      currentState: this.emotionEngine.exportState(),
      memoryRecords: this.getMemoryRecords({ sessionId: this.sessionInfo.id }),
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 重置
   */
  reset() {
    this.endSession();
    this.emotionEngine.reset();
    this.sessionInfo = {
      id: this.emotionEngine.sessionId,
      startTime: new Date().toISOString(),
      userMetadata: {}
    };
    this.memoryStore.startSession(this.sessionInfo.id, {});
  }
}

module.exports = ChatManager;
