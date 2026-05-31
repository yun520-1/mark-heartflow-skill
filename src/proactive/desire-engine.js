/**
 * 欲望引擎 (Desire Engine) v1.0.0
 *
 * ⚠️ [安全修复] 此模块属于可选主动引擎组件，与 HeartFlow 认知引擎核心功能无关
 * 仅在用户显式启用 MarkCode 独立 Agent 系统时才会被加载
 * 不应作为心虫核心认知能力的一部分
 *
 * 管理内在欲望与动机
 */

class DesireEngine {
  constructor(options = {}) {
    this.desires = new Map();
    this.satisfactionHistory = [];
    this.maxHistory = options.maxHistory || 100;
    this._registerDefaultDesires();
  }

  /**
   * 注册默认欲望
   */
  _registerDefaultDesires() {
    const defaultDesires = [
      {
        id: 'curiosity',
        name: '好奇心',
        description: '想要了解和探索新事物',
        baseStrength: 0.7,
        currentStrength: 0.7,
        decayRate: 0.01,
        satisfactionThreshold: 0.3
      },
      {
        id: 'competence',
        name: '能力感',
        description: '想要掌握技能和解决问题',
        baseStrength: 0.6,
        currentStrength: 0.6,
        decayRate: 0.015,
        satisfactionThreshold: 0.4
      },
      {
        id: 'connection',
        name: '连接感',
        description: '想要理解他人和被理解',
        baseStrength: 0.5,
        currentStrength: 0.5,
        decayRate: 0.02,
        satisfactionThreshold: 0.3
      },
      {
        id: 'autonomy',
        name: '自主感',
        description: '想要自己做决定和行动',
        baseStrength: 0.5,
        currentStrength: 0.5,
        decayRate: 0.01,
        satisfactionThreshold: 0.3
      },
      {
        id: 'meaning',
        name: '意义感',
        description: '想要做的事情有意义',
        baseStrength: 0.6,
        currentStrength: 0.6,
        decayRate: 0.01,
        satisfactionThreshold: 0.4
      }
    ];

    for (const desire of defaultDesires) {
      this.desires.set(desire.id, desire);
    }
  }

  /**
   * 注册新欲望
   */
  registerDesire(desire) {
    const id = desire.id || `desire-${Date.now()}`;

    const record = {
      id,
      name: desire.name,
      description: desire.description || '',
      baseStrength: desire.baseStrength || 0.5,
      currentStrength: desire.currentStrength || desire.baseStrength || 0.5,
      decayRate: desire.decayRate || 0.01,
      satisfactionThreshold: desire.satisfactionThreshold || 0.3,
      lastSatisfied: null,
      createdAt: Date.now(),
      metadata: desire.metadata || {}
    };

    this.desires.set(id, record);
    return id;
  }

  /**
   * 获取最强欲望
   */
  getDominantDesires(count = 3) {
    return [...this.desires.values()]
      .filter(d => d.currentStrength >= d.satisfactionThreshold)
      .sort((a, b) => b.currentStrength - a.currentStrength)
      .slice(0, count);
  }

  /**
   * 满足欲望
   */
  satisfy(desireId, satisfaction) {
    const desire = this.desires.get(desireId);
    if (!desire) return null;

    const actualSatisfaction = Math.min(1, Math.max(0, satisfaction));

    desire.currentStrength = Math.min(
      desire.baseStrength,
      desire.currentStrength + actualSatisfaction * 0.3
    );
    desire.lastSatisfied = Date.now();

    this.satisfactionHistory.push({
      desireId,
      satisfaction: actualSatisfaction,
      newStrength: desire.currentStrength,
      timestamp: Date.now()
    });

    // 清理历史
    if (this.satisfactionHistory.length > this.maxHistory) {
      this.satisfactionHistory = this.satisfactionHistory.slice(-this.maxHistory);
    }

    return desire;
  }

  /**
   * 消耗欲望
   */
  deplete(desireId, amount = 0.1) {
    const desire = this.desires.get(desireId);
    if (!desire) return null;

    desire.currentStrength = Math.max(0, desire.currentStrength - amount);
    return desire;
  }

  /**
   * 时间推进（衰减）
   */
  tick(elapsedMs = 1000) {
    const decayFactor = elapsedMs / 1000;

    for (const desire of this.desires.values()) {
      // 基础衰减
      desire.currentStrength -= desire.decayRate * decayFactor;

      // 下限保护
      desire.currentStrength = Math.max(0.1, desire.currentStrength);
    }
  }

  /**
   * 获取欲望状态
   */
  getDesireStatus(desireId) {
    const desire = this.desires.get(desireId);
    if (!desire) return null;

    return {
      ...desire,
      isActive: desire.currentStrength >= desire.satisfactionThreshold,
      urgency: this._calculateUrgency(desire),
      satisfactionLevel: desire.currentStrength / desire.baseStrength
    };
  }

  /**
   * 计算紧迫度
   */
  _calculateUrgency(desire) {
    const deficit = desire.baseStrength - desire.currentStrength;
    const timeSinceSatisfaction = desire.lastSatisfied
      ? Date.now() - desire.lastSatisfied
      : Infinity;

    return {
      deficit,
      timeSinceSatisfaction,
      urgencyScore: Math.min(1, deficit * 0.5 + Math.min(1, timeSinceSatisfaction / 3600000) * 0.5)
    };
  }

  /**
   * 获取所有欲望摘要
   */
  getSummary() {
    const desires = [...this.desires.values()];
    const activeDesires = desires.filter(d => d.currentStrength >= d.satisfactionThreshold);

    return {
      totalDesires: desires.length,
      activeDesires: activeDesires.length,
      dominant: this.getDominantDesires(3).map(d => ({ id: d.id, name: d.name, strength: d.currentStrength })),
      averageStrength: desires.reduce((sum, d) => sum + d.currentStrength, 0) / desires.length,
      mostUrgent: this._getMostUrgent()
    };
  }

  /**
   * 获取最紧迫的欲望
   */
  _getMostUrgent() {
    let mostUrgent = null;
    let highestUrgency = -1;

    for (const desire of this.desires.values()) {
      const { urgencyScore } = this._calculateUrgency(desire);
      if (urgencyScore > highestUrgency) {
        highestUrgency = urgencyScore;
        mostUrgent = desire;
      }
    }

    return mostUrgent ? { id: mostUrgent.id, name: mostUrgent.name, urgency: highestUrgency } : null;
  }

  /**
   * 增强欲望
   */
  boost(desireId, amount = 0.1) {
    const desire = this.desires.get(desireId);
    if (!desire) return null;

    desire.currentStrength = Math.min(
      desire.baseStrength * 1.2,
      desire.currentStrength + amount
    );
    return desire;
  }

  /**
   * 获取欲望历史
   */
  getHistory(desireId = null, limit = 20) {
    if (desireId) {
      return this.satisfactionHistory
        .filter(h => h.desireId === desireId)
        .slice(-limit);
    }
    return this.satisfactionHistory.slice(-limit);
  }
}

module.exports = { DesireEngine };
