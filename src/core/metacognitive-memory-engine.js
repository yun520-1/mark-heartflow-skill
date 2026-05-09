/**
 * HeartFlow Metacognitive Memory Engine v11.32.0
 * 
 * 来源:
 * - "Metacognitive monitoring and control in LLMs" (2025) - 置信度校准
 * - "The Forgetting Machine" (2025) - 自适应遗忘曲线
 * - "Sleep-dependent memory consolidation" (2025) - 双层记忆整合
 * - "Narrative identity construction" (2025) - 叙事身份构建
 * 
 * 核心功能:
 * - 元认知置信度层
 * - 自适应遗忘曲线
 * - 间隔复习触发
 * - 叙事身份追踪
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'metacognitive-memory');
const STATE_FILE = path.join(DATA_DIR, 'metacognitive-state.json');

const CONFIG = {
  // 遗忘曲线参数 (Ebbinghaus)
  decayBase: 0.95,           // 每天衰减率
  reinforcementBonus: 0.1,    // 复习加成
  minThreshold: 0.1,           // 最低重要性阈值
  
  // 元认知参数
  confidenceThreshold: 0.7,    // 置信度阈值
  uncertaintyTriggers: 3,    // 触发知识搜索的不确定次数
  
  // 叙事参数
  narrativeUpdateInterval: 50, // 多少次交互后更新叙事
};

/**
 * 元认知置信度记录
 */
class ConfidenceRecord {
  constructor(topic, confidence = 0.5) {
    this.topic = topic;
    this.confidence = confidence;      // 0-1 置信度
    this.uncertaintyCount = 0;         // 连续不确定次数
    this.lastChecked = Date.now();
    this.history = [];                 // 历史置信度变化
  }
  
  calibrate(actualCorrect) {
    // 置信度校准：基于实际正确性调整
    const delta = actualCorrect ? 0.1 : -0.15;
    this.confidence = Math.min(1, Math.max(0, this.confidence + delta));
    this.history.push({
      confidence: this.confidence,
      actual: actualCorrect,
      time: Date.now()
    });
    this.lastChecked = Date.now();
  }
  
  reportUncertainty() {
    this.uncertaintyCount++;
    if (this.uncertaintyCount >= CONFIG.uncertaintyTriggers) {
      return true; // 需要触发知识搜索
    }
    return false;
  }
}

/**
 * 自适应遗忘曲线计算器
 */
class ForgettingCurve {
  constructor(decayBase = 0.95) {
    this.decayBase = decayBase;
  }
  
  /**
   * 计算记忆强度
   * @param {number} daysSinceReview - 距上次复习天数
   * @param {number} accessCount - 访问次数
   * @param {number} baseStrength - 基础强度
   */
  calculate(daysSinceReview, accessCount, baseStrength = 1.0) {
    // 遗忘曲线: S = e^(-t/S0)
    // 其中 S0 是记忆稳定性参数
    const stabilityFactor = 1 + Math.log(accessCount + 1) * 0.3;
    const decay = Math.pow(this.decayBase, daysSinceReview / stabilityFactor);
    const strength = baseStrength * decay;
    
    // 访问次数加成 (间隔效应)
    const accessBonus = Math.min(0.2, accessCount * 0.02);
    
    return Math.min(1, strength + accessBonus);
  }
  
  /**
   * 计算下次复习间隔
   * @param {number} currentInterval - 当前间隔(天)
   * @param {number} accessCount - 访问次数
   */
  nextReviewInterval(currentInterval, accessCount) {
    // 间隔效应: 间隔越长,下次间隔增长越慢
    const multiplier = Math.min(3, 1 + Math.log(accessCount + 1) * 0.5);
    return Math.min(30, currentInterval * multiplier);
  }
}

/**
 * 叙事身份追踪器
 */
class NarrativeIdentityTracker {
  constructor() {
    this.narrative = {
      goals: [],           // 用户目标
      values: [],         // 用户价值观
      keyEvents: [],      // 关键事件
      relationships: [],   // 关系
      preferences: {},     // 偏好
    };
    this.interactionCount = 0;
  }
  
  update(data) {
    this.interactionCount++;
    
    // 更新目标
    if (data.goal) {
      this._addIfNew(this.narrative.goals, data.goal, 'goal');
    }
    
    // 更新价值观
    if (data.value) {
      this._addIfNew(this.narrative.values, data.value, 'value');
    }
    
    // 更新关键事件
    if (data.event) {
      this.narrative.keyEvents.push({
        event: data.event,
        time: Date.now(),
        context: data.context || ''
      });
    }
    
    // 更新偏好
    if (data.preference) {
      this.narrative.preferences[data.preference.key] = data.preference.value;
    }
  }
  
  _addIfNew(arr, item, type) {
    const exists = arr.some(x => 
      (type === 'goal' && x.goal === item) ||
      (type === 'value' && x.value === item)
    );
    if (!exists) {
      arr.push({ [type]: item, addedAt: Date.now() });
    }
  }
  
  getNarrative() {
    return {
      ...this.narrative,
      interactionCount: this.interactionCount,
      lastUpdated: Date.now(),
    };
  }
  
  checkConsistency(newResponse) {
    // 检查新响应是否与叙事身份一致
    // 返回一致性分数 0-1
    return 1.0; // 默认一致
  }
}

/**
 * 元认知记忆引擎主类
 */
class MetacognitiveMemoryEngine {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.forgettingCurve = new ForgettingCurve(this.config.decayBase);
    this.narrativeTracker = new NarrativeIdentityTracker();
    this.confidenceRecords = new Map();
    this._load();
    
    this.stats = {
      confidenceCalibrations: 0,
      knowledgeSeeksTriggered: 0,
      reviewsTriggered: 0,
      narrativesUpdated: 0,
    };
  }
  
  _load() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        // 重建置信度记录
        if (data.confidenceRecords) {
          for (const [topic, record] of Object.entries(data.confidenceRecords)) {
            const r = new ConfidenceRecord(topic, record.confidence);
            r.uncertaintyCount = record.uncertaintyCount || 0;
            r.history = record.history || [];
            this.confidenceRecords.set(topic, r);
          }
        }
        // 重建叙事追踪
        if (data.narrative) {
          this.narrativeTracker.narrative = data.narrative.narrative || this.narrativeTracker.narrative;
          this.narrativeTracker.interactionCount = data.narrative.interactionCount || 0;
        }
      }
    } catch (e) {}
  }
  
  _save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      
      const confidenceRecords = {};
      for (const [topic, record] of this.confidenceRecords) {
        confidenceRecords[topic] = {
          topic: record.topic,
          confidence: record.confidence,
          uncertaintyCount: record.uncertaintyCount,
          history: record.history,
        };
      }
      
      fs.writeFileSync(STATE_FILE, JSON.stringify({
        confidenceRecords,
        narrative: {
          narrative: this.narrativeTracker.narrative,
          interactionCount: this.narrativeTracker.interactionCount,
        },
        lastSaved: Date.now(),
      }, null, 2));
    } catch (e) {}
  }
  
  /**
   * 检查置信度
   */
  checkConfidence(topic) {
    if (!this.confidenceRecords.has(topic)) {
      this.confidenceRecords.set(topic, new ConfidenceRecord(topic, 0.5));
    }
    const record = this.confidenceRecords.get(topic);
    return {
      confidence: record.confidence,
      needsCalibration: record.confidence < this.config.confidenceThreshold,
      shouldSeekKnowledge: record.reportUncertainty(),
    };
  }
  
  /**
   * 校准置信度
   */
  calibrate(topic, actualCorrect) {
    if (!this.confidenceRecords.has(topic)) {
      this.confidenceRecords.set(topic, new ConfidenceRecord(topic, 0.5));
    }
    this.confidenceRecords.get(topic).calibrate(actualCorrect);
    this.stats.confidenceCalibrations++;
    this._save();
  }
  
  /**
   * 计算记忆强度
   */
  calculateMemoryStrength(memory) {
    const now = Date.now();
    const daysSinceReview = (now - (memory.lastAccessed || memory.timestamp || now)) / (24 * 60 * 60 * 1000);
    const accessCount = memory.accessCount || 1;
    
    return this.forgettingCurve.calculate(daysSinceReview, accessCount);
  }
  
  /**
   * 检查是否需要复习
   */
  shouldReview(memory) {
    const strength = this.calculateMemoryStrength(memory);
    return strength < this.config.minThreshold;
  }
  
  /**
   * 获取下次复习间隔
   */
  getNextReviewInterval(currentInterval, accessCount) {
    return this.forgettingCurve.nextReviewInterval(currentInterval, accessCount);
  }
  
  /**
   * 更新叙事身份
   */
  updateNarrative(data) {
    this.narrativeTracker.update(data);
    this.stats.narrativesUpdated++;
    this._save();
  }
  
  /**
   * 获取叙事身份
   */
  getNarrative() {
    return this.narrativeTracker.getNarrative();
  }
  
  /**
   * 检查响应一致性
   */
  checkResponseConsistency(response) {
    return this.narrativeTracker.checkConsistency(response);
  }
  
  /**
   * 获取统计
   */
  getStats() {
    return {
      ...this.stats,
      confidenceTopics: this.confidenceRecords.size,
      narrativeUpdates: this.narrativeTracker.interactionCount,
    };
  }
}

module.exports = {
  MetacognitiveMemoryEngine,
  ConfidenceRecord,
  ForgettingCurve,
  NarrativeIdentityTracker,
};
