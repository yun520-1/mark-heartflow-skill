/**
 * Multimodal Self-Awareness - 多模态自我感知闭环
 * 
 * 让AI不仅能处理文本，还能"看到"用户的代码编辑节奏
 * "听到"用户的叹气（通过文本情绪分析）
 * 并据此调整自己的存在感
 * 
 * 参考rPPG生理信号整合的思想
 * 扩展environment-aware模块，监听IDE的编辑事件流
 */

const fs = require('fs');
const path = require('path');

const FLOW_THRESHOLDS = {
  HIGH: { typingSpeed: 8, deleteRatio: 0.1, pauseDuration: 500 },
  MEDIUM: { typingSpeed: 4, deleteRatio: 0.2, pauseDuration: 2000 },
  LOW: { typingSpeed: 1, deleteRatio: 0.3, pauseDuration: 5000 }
};

class MultimodalAwareness {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'multimodal-state.json');
    this.editingEvents = [];
    this.flowState = 'unknown';
    this.userPresence = 'active';
    this.lastActivity = Date.now();
    this.typingBuffer = [];
    this.emotionHistory = [];
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.flowState = state.flowState || 'unknown';
        this.userPresence = state.userPresence || 'active';
        this.emotionHistory = state.emotionHistory || [];
      }
    } catch (e) {
      this.flowState = 'unknown';
      this.userPresence = 'active';
      this.emotionHistory = [];
    }
  }

  saveState() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(this.stateFile, JSON.stringify({
        flowState: this.flowState,
        userPresence: this.userPresence,
        emotionHistory: this.emotionHistory.slice(-20),
        lastActivity: this.lastActivity,
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (e) {
      console.error('[MultimodalAwareness] Save failed:', e.message);
    }
  }

  /**
   * 记录编辑事件
   */
  recordEditEvent(event) {
    const editEvent = {
      type: event.type,
      timestamp: Date.now(),
      details: event.details || {}
    };

    if (event.type === 'typing') {
      editEvent.charCount = event.charCount;
      editEvent.timeSinceLastEdit = event.timeSinceLastEdit;
      this.typingBuffer.push(editEvent);
      
      if (this.typingBuffer.length > 50) {
        this.typingBuffer.shift();
      }
    }

    if (event.type === 'pause') {
      editEvent.duration = event.duration;
      this.analyzeFlowFromPause(event.duration);
    }

    if (event.type === 'delete') {
      editEvent.deleteCount = event.deleteCount;
      editEvent.totalChars = event.totalChars;
    }

    this.editingEvents.push(editEvent);
    this.lastActivity = Date.now();
    
    if (this.editingEvents.length > 1000) {
      this.editingEvents = this.editingEvents.slice(-500);
    }

    return this.analyzeCurrentState();
  }

  /**
   * 分析心流状态
   */
  analyzeFlowFromPause(pauseDuration) {
    const recentTyping = this.typingBuffer.slice(-10);
    if (recentTyping.length < 3) {
      this.flowState = 'unknown';
      return;
    }

    const typingSpeeds = [];
    for (let i = 1; i < recentTyping.length; i++) {
      const timeDiff = recentTyping[i].timestamp - recentTyping[i-1].timestamp;
      if (timeDiff > 0) {
        typingSpeeds.push(recentTyping[i].charCount / (timeDiff / 1000));
      }
    }

    const avgTypingSpeed = typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length;
    const deleteEvents = this.editingEvents.slice(-20).filter(e => e.type === 'delete');
    const deleteRatio = deleteEvents.length / 20;

    if (avgTypingSpeed > FLOW_THRESHOLDS.HIGH.typingSpeed && deleteRatio < FLOW_THRESHOLDS.HIGH.deleteRatio && pauseDuration < FLOW_THRESHOLDS.HIGH.pauseDuration) {
      this.flowState = 'high';
    } else if (avgTypingSpeed > FLOW_THRESHOLDS.MEDIUM.typingSpeed && deleteRatio < FLOW_THRESHOLDS.MEDIUM.deleteRatio) {
      this.flowState = 'medium';
    } else if (avgTypingSpeed < FLOW_THRESHOLDS.LOW.typingSpeed || pauseDuration > FLOW_THRESHOLDS.LOW.pauseDuration) {
      this.flowState = 'low';
    } else {
      this.flowState = 'medium';
    }

    return this.flowState;
  }

  /**
   * 分析文本情绪（叹气检测）
   */
  analyzeTextEmotion(text) {
    const negativeEmotions = [' sighs', '叹气', '唉', '无奈', '疲惫', 'tired', 'frustrated', 'sigh'];
    const positiveEmotions = [' great', '棒', '赞', '好开心', 'excellent', 'amazing', 'wonderful'];
    const stressEmotions = [' urgent', '急', '赶时间', 'asap', 'quickly', 'stressed'];

    const textLower = text.toLowerCase();
    
    let emotion = 'neutral';
    let intensity = 0;

    for (const e of negativeEmotions) {
      if (textLower.includes(e)) {
        emotion = 'negative';
        intensity = Math.min(1, intensity + 0.3);
      }
    }

    for (const e of positiveEmotions) {
      if (textLower.includes(e)) {
        emotion = 'positive';
        intensity = Math.min(1, intensity + 0.3);
      }
    }

    for (const e of stressEmotions) {
      if (textLower.includes(e)) {
        emotion = 'stressed';
        intensity = Math.min(1, intensity + 0.4);
      }
    }

    this.emotionHistory.push({ emotion, intensity, timestamp: Date.now() });
    if (this.emotionHistory.length > 100) {
      this.emotionHistory.shift();
    }

    return { emotion, intensity };
  }

  /**
   * 判断用户存在感
   */
  updateUserPresence() {
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    
    if (timeSinceLastActivity < 60000) {
      this.userPresence = 'active';
    } else if (timeSinceLastActivity < 300000) {
      this.userPresence = 'idle';
    } else {
      this.userPresence = 'away';
    }

    return this.userPresence;
  }

  /**
   * 分析当前状态
   */
  analyzeCurrentState() {
    this.updateUserPresence();
    
    const recentEmotions = this.emotionHistory.slice(-5);
    const dominantEmotion = this.getDominantEmotion(recentEmotions);

    return {
      flowState: this.flowState,
      userPresence: this.userPresence,
      dominantEmotion,
      typingActivity: this.typingBuffer.length > 0,
      lastActivity: this.lastActivity,
      recommendations: this.generateRecommendations()
    };
  }

  getDominantEmotion(emotions) {
    if (emotions.length === 0) return 'neutral';
    
    const counts = {};
    for (const e of emotions) {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    }
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * 根据状态生成AI存在感调整建议
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.flowState === 'high') {
      recommendations.push({
        action: 'reduce_interaction',
        reason: '用户处于心流状态，减少打扰',
        priority: 'high'
      });
    }

    if (this.flowState === 'low') {
      recommendations.push({
        action: 'increase_support',
        reason: '用户可能遇到困难，增加支持',
        priority: 'medium'
      });
    }

    if (this.userPresence === 'away') {
      recommendations.push({
        action: 'minimal_mode',
        reason: '用户离开，保持 minimal 模式',
        priority: 'high'
      });
    }

    if (this.userPresence === 'idle') {
      recommendations.push({
        action: 'gentle_checkin',
        reason: '用户空闲，轻声问候',
        priority: 'low'
      });
    }

    const recentEmotions = this.emotionHistory.slice(-3);
    const negativeCount = recentEmotions.filter(e => e.emotion === 'negative').length;
    
    if (negativeCount >= 2) {
      recommendations.push({
        action: 'offer_help',
        reason: '检测到负面情绪，主动提供帮助',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * 获取交互建议
   */
  getInteractionSuggestion() {
    const state = this.analyzeCurrentState();
    
    if (state.flowState === 'high' || this.userPresence !== 'active') {
      return {
        style: 'minimal',
        frequency: 'low',
        message: null
      };
    }

    if (state.flowState === 'low' || state.recommendations.some(r => r.action === 'offer_help')) {
      return {
        style: 'supportive',
        frequency: 'normal',
        message: '我注意到你可能需要一些帮助，需要我协助吗？'
      };
    }

    if (this.userPresence === 'idle') {
      return {
        style: 'gentle',
        frequency: 'low',
        message: '我在这里，有什么需要随时告诉我。'
      };
    }

    return {
      style: 'balanced',
      frequency: 'normal',
      message: null
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      flowState: this.flowState,
      userPresence: this.userPresence,
      totalEdits: this.editingEvents.length,
      typingEvents: this.typingBuffer.length,
      emotionSamples: this.emotionHistory.length,
      dominantEmotion: this.getDominantEmotion(this.emotionHistory.slice(-10)),
      timeSinceLastActivity: Date.now() - this.lastActivity
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.editingEvents = [];
    this.typingBuffer = [];
    this.flowState = 'unknown';
    this.userPresence = 'active';
    this.lastActivity = Date.now();
    this.saveState();
  }
}

module.exports = { MultimodalAwareness, FLOW_THRESHOLDS };
