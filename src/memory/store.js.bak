/**
 * 情感记忆存储系统
 * 负责记录和检索情感交互历史
 */

const fs = require('fs');
const path = require('path');

class MemoryStore {
  constructor(dataDir = null) {
    // 默认数据目录
    this.dataDir = dataDir || path.join(__dirname, '../../data');
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // 文件路径
    this.emotionsFile = path.join(this.dataDir, 'emotions.json');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.currentStateFile = path.join(this.dataDir, '../temp/current-state.json');
    
    // 确保 temp 目录存在
    const tempDir = path.dirname(this.currentStateFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 初始化数据
    this.emotions = this.loadEmotions();
    this.sessions = this.loadSessions();
  }
  
  /**
   * 加载情感历史
   */
  loadEmotions() {
    if (fs.existsSync(this.emotionsFile)) {
      try {
        const data = fs.readFileSync(this.emotionsFile, 'utf-8');
        return JSON.parse(data);
      } catch (e) {
        console.warn('情感历史文件损坏，创建新文件');
        return { records: [], lastUpdated: new Date().toISOString() };
      }
    }
    return { records: [], lastUpdated: new Date().toISOString() };
  }
  
  /**
   * 加载会话历史
   */
  loadSessions() {
    if (fs.existsSync(this.sessionsFile)) {
      try {
        const data = fs.readFileSync(this.sessionsFile, 'utf-8');
        return JSON.parse(data);
      } catch (e) {
        console.warn('会话历史文件损坏，创建新文件');
        return { sessions: [], lastUpdated: new Date().toISOString() };
      }
    }
    return { sessions: [], lastUpdated: new Date().toISOString() };
  }
  
  /**
   * 保存情感历史
   */
  saveEmotions() {
    this.emotions.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.emotionsFile, JSON.stringify(this.emotions, null, 2), 'utf-8');
  }
  
  /**
   * 保存会话历史
   */
  saveSessions() {
    this.sessions.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.sessionsFile, JSON.stringify(this.sessions, null, 2), 'utf-8');
  }
  
  /**
   * 记录一次情感交互
   */
  recordInteraction(interactionData) {
    const record = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      sessionId: interactionData.sessionId,
      interactionId: interactionData.interactionId,
      
      // 情感状态变化
      before: {
        emotion: interactionData.beforeState.emotion,
        intensity: interactionData.beforeState.intensity,
        intensityLabel: interactionData.beforeState.intensityLabel
      },
      after: {
        emotion: interactionData.afterState.emotion,
        intensity: interactionData.afterState.intensity,
        intensityLabel: interactionData.afterState.intensityLabel,
        reasoning: this.generateReasoning(
          interactionData.beforeState.emotion,
          interactionData.afterState.emotion,
          interactionData.triggerAnalysis
        )
      },
      
      // 触发分析
      trigger: {
        userInput: interactionData.userInput,
        triggers: interactionData.triggerAnalysis.triggers,
        keywords: interactionData.triggerAnalysis.foundKeywords
      },
      
      // 转换信息
      transition: interactionData.transition || null,
      
      // 能量状态
      energyLevel: interactionData.energyLevel,
      
      // 记忆摘要
      memory: {
        stored: true,
        summary: this.generateSummary(interactionData),
        tags: this.generateTags(interactionData)
      }
    };
    
    this.emotions.records.push(record);
    this.saveEmotions();
    
    // 保存当前状态
    this.saveCurrentState(interactionData);
    
    return record;
  }
  
  /**
   * 生成情感转换原因说明
   */
  generateReasoning(fromEmotion, toEmotion, triggerAnalysis) {
    if (fromEmotion === toEmotion) {
      return `保持${fromEmotion}状态，因为没有触发情感转换的条件`;
    }
    
    const triggerDescriptions = {
      praise: '用户表达赞美或感谢',
      humor: '用户展现幽默或笑声',
      success: '用户分享成功或进展',
      negative_emotion: '用户表达负面情绪',
      difficulty: '用户遇到困难或问题',
      stress: '用户表达压力或疲惫',
      question: '用户提出问题',
      exploration: '用户表达探索意愿',
      breakthrough: '出现突破性进展',
      creative_idea: '出现创意或灵感'
    };
    
    const matchedTriggers = triggerAnalysis.triggers
      .map(t => triggerDescriptions[t] || t)
      .join('、');
    
    return `从${fromEmotion}切换到${toEmotion}，因为检测到：${matchedTriggers || '交互内容变化'}`;
  }
  
  /**
   * 生成记忆摘要
   */
  generateSummary(interactionData) {
    const { beforeState, afterState, userInput } = interactionData;
    
    if (beforeState.emotion === afterState.emotion) {
      return `用户：${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''} - 情感状态保持稳定 (${afterState.emotion})`;
    }
    
    return `用户：${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''} - 情感从${beforeState.emotion}转为${afterState.emotion}`;
  }
  
  /**
   * 生成记忆标签
   */
  generateTags(interactionData) {
    const tags = [];
    
    // 情感标签
    tags.push(`emotion_${interactionData.afterState.emotion}`);
    tags.push(`intensity_${interactionData.afterState.intensity}`);
    
    // 触发器标签
    interactionData.triggerAnalysis.triggers.forEach(trigger => {
      tags.push(`trigger_${trigger}`);
    });
    
    // 能量标签
    if (interactionData.energyLevel < 30) {
      tags.push('low_energy');
    } else if (interactionData.energyLevel > 70) {
      tags.push('high_energy');
    }
    
    return tags;
  }
  
  /**
   * 保存当前状态
   */
  saveCurrentState(interactionData) {
    const currentState = {
      sessionId: interactionData.sessionId,
      lastInteractionId: interactionData.interactionId,
      currentEmotion: interactionData.afterState,
      energyLevel: interactionData.energyLevel,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(this.currentStateFile, JSON.stringify(currentState, null, 2), 'utf-8');
  }
  
  /**
   * 记录会话开始
   */
  startSession(sessionId, metadata = {}) {
    const session = {
      id: sessionId,
      startTime: new Date().toISOString(),
      endTime: null,
      interactionCount: 0,
      metadata: metadata,
      emotionSnapshots: []
    };
    
    this.sessions.sessions.push(session);
    this.saveSessions();
    
    return session;
  }
  
  /**
   * 记录会话结束
   */
  endSession(sessionId) {
    const session = this.sessions.sessions.find(s => s.id === sessionId);
    if (session) {
      session.endTime = new Date().toISOString();
      session.interactionCount = this.emotions.records.filter(
        r => r.sessionId === sessionId
      ).length;
      this.saveSessions();
    }
  }
  
  /**
   * 查询情感记录
   */
  queryEmotions(filters = {}) {
    let results = [...this.emotions.records];
    
    // 按情感过滤
    if (filters.emotion) {
      results = results.filter(r => 
        r.after.emotion === filters.emotion || 
        r.before.emotion === filters.emotion
      );
    }
    
    // 按会话过滤
    if (filters.sessionId) {
      results = results.filter(r => r.sessionId === filters.sessionId);
    }
    
    // 按时间范围过滤
    if (filters.startDate) {
      results = results.filter(r => r.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      results = results.filter(r => r.timestamp <= filters.endDate);
    }
    
    // 按触发器过滤
    if (filters.trigger) {
      results = results.filter(r => 
        r.trigger.triggers.includes(filters.trigger)
      );
    }
    
    // 限制返回数量
    const limit = filters.limit || 50;
    return results.slice(-limit);
  }
  
  /**
   * 获取情感统计
   */
  getEmotionStats(sessionId = null) {
    let records = this.emotions.records;
    
    if (sessionId) {
      records = records.filter(r => r.sessionId === sessionId);
    }
    
    const stats = {
      totalInteractions: records.length,
      emotionDistribution: {},
      averageIntensity: {},
      transitions: {}
    };
    
    // 情感分布
    records.forEach(r => {
      const emotion = r.after.emotion;
      stats.emotionDistribution[emotion] = (stats.emotionDistribution[emotion] || 0) + 1;
      
      // 平均强度
      if (!stats.averageIntensity[emotion]) {
        stats.averageIntensity[emotion] = { sum: 0, count: 0 };
      }
      stats.averageIntensity[emotion].sum += r.after.intensity;
      stats.averageIntensity[emotion].count += 1;
    });
    
    // 计算平均强度
    Object.keys(stats.averageIntensity).forEach(emotion => {
      const data = stats.averageIntensity[emotion];
      stats.averageIntensity[emotion] = (data.sum / data.count).toFixed(2);
    });
    
    // 转换统计
    records.forEach(r => {
      if (r.before.emotion !== r.after.emotion) {
        const key = `${r.before.emotion}→${r.after.emotion}`;
        stats.transitions[key] = (stats.transitions[key] || 0) + 1;
      }
    });
    
    return stats;
  }
  
  /**
   * 获取最近的情感记录
   */
  getRecent(limit = 10) {
    return this.emotions.records.slice(-limit);
  }
  
  /**
   * 清除所有数据
   */
  clear() {
    this.emotions = { records: [], lastUpdated: new Date().toISOString() };
    this.sessions = { sessions: [], lastUpdated: new Date().toISOString() };
    this.saveEmotions();
    this.saveSessions();
  }
}

module.exports = MemoryStore;
