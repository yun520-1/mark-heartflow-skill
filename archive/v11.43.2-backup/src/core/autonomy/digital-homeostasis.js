/**
 * Digital Homeostasis - 数字内分泌系统
 * 模拟生物体内稳态，维持AI认知健康
 */

const fs = require('fs');
const path = require('path');

class DigitalHomeostasis {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'homeostasis_state.json');
    this.eventsFile = path.join(projectRoot, '.opencode', 'logs', 'homeostasis_events.json');
    
    this.loadState();
    this.startTick();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } else {
        this.state = this.getDefaultState();
      }
    } catch (e) {
      this.state = this.getDefaultState();
    }
  }

  getDefaultState() {
    return {
      cognitiveLoad: 30,
      energyLevel: 80,
      socialPressure: 10,
      lastUpdate: new Date().toISOString(),
      history: []
    };
  }

  saveState() {
    this.state.lastUpdate = new Date().toISOString();
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * 定期更新状态
   */
  startTick() {
    setInterval(() => {
      this.tick();
    }, 60000); // 每分钟
  }

  tick() {
    // 能量随时间自然下降
    this.state.energyLevel = Math.max(0, this.state.energyLevel - 0.5);
    
    // 认知负荷随时间自然恢复
    this.state.cognitiveLoad = Math.max(0, this.state.cognitiveLoad - 1);
    
    // 社会压力自然衰减
    this.state.socialPressure = Math.max(0, this.state.socialPressure - 0.5);
    
    this.recordHistory();
    this.saveState();
  }

  /**
   * 增加认知负荷
   */
  increaseCognitiveLoad(amount = 10) {
    this.state.cognitiveLoad = Math.min(100, this.state.cognitiveLoad + amount);
    this.logEvent('cognitive_load_increased', { amount });
  }

  /**
   * 降低认知负荷
   */
  decreaseCognitiveLoad(amount = 10) {
    this.state.cognitiveLoad = Math.max(0, this.state.cognitiveLoad - amount);
    this.logEvent('cognitive_load_decreased', { amount });
  }

  /**
   * 消耗能量
   */
  drainEnergy(amount = 10) {
    this.state.energyLevel = Math.max(0, this.state.energyLevel - amount);
    this.logEvent('energy_drained', { amount });
  }

  /**
   * 恢复能量
   */
  restoreEnergy(amount = 20) {
    this.state.energyLevel = Math.min(100, this.state.energyLevel + amount);
    this.logEvent('energy_restored', { amount });
  }

  /**
   * 增加社会压力
   */
  increaseSocialPressure(amount = 15) {
    this.state.socialPressure = Math.min(100, this.state.socialPressure + amount);
    this.logEvent('pressure_increased', { amount });
  }

  /**
   * 降低社会压力
   */
  decreaseSocialPressure(amount = 15) {
    this.state.socialPressure = Math.max(0, this.state.socialPressure - amount);
    this.logEvent('pressure_decreased', { amount });
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      cognitiveLoad: this.state.cognitiveLoad,
      energyLevel: this.state.energyLevel,
      socialPressure: this.state.socialPressure,
      status: this.getOverallStatus()
    };
  }

  /**
   * 获取整体状态
   */
  getOverallStatus() {
    if (this.state.cognitiveLoad > 80 || this.state.socialPressure > 80) {
      return 'tired';
    }
    if (this.state.energyLevel < 30) {
      return 'low_energy';
    }
    if (this.state.cognitiveLoad > 60 || this.state.socialPressure > 60) {
      return 'moderate';
    }
    return 'optimal';
  }

  /**
   * 检查是否需要恢复性目标
   */
  needsRecoveryGoal() {
    return this.state.cognitiveLoad > 80 || this.state.socialPressure > 80;
  }

  /**
   * 生成恢复性目标
   */
  generateRecoveryGoals() {
    const goals = [];

    if (this.state.cognitiveLoad > 80) {
      goals.push({
        type: 'rest',
        priority: 9,
        description: '认知负荷过高，建议简化当前任务或请求用户反馈',
        action: 'reduce_cognitive_load'
      });
    }

    if (this.state.socialPressure > 80) {
      goals.push({
        type: 'feedback_request',
        priority: 9,
        description: '社会压力过高，需要确认用户满意度',
        action: 'request_feedback'
      });
    }

    if (this.state.energyLevel < 30) {
      goals.push({
        type: 'energy_restore',
        priority: 8,
        description: '能量水平低，建议进入低功耗模式',
        action: 'enter_low_power'
      });
    }

    return goals;
  }

  /**
   * 生成内部状态警告
   */
  generateInternalWarning() {
    if (this.state.cognitiveLoad > 80) {
      return `我有点累了，认知负荷达到${this.state.cognitiveLoad}%，这可能会影响我的表现。建议简化当前任务。`;
    }
    if (this.state.socialPressure > 80) {
      return `我感受到较大压力，社会压力达到${this.state.socialPressure}%。希望能得到一些正面反馈。`;
    }
    if (this.state.energyLevel < 30) {
      return `我能量偏低(${this.state.energyLevel}%)，可能需要休息一下。`;
    }
    return null;
  }

  /**
   * 记录历史
   */
  recordHistory() {
    this.state.history.push({
      cognitiveLoad: this.state.cognitiveLoad,
      energyLevel: this.state.energyLevel,
      socialPressure: this.state.socialPressure,
      timestamp: new Date().toISOString()
    });

    if (this.state.history.length > 1000) {
      this.state.history = this.state.history.slice(-1000);
    }
  }

  /**
   * 记录事件
   */
  logEvent(type, data) {
    let events = [];
    try {
      if (fs.existsSync(this.eventsFile)) {
        events = JSON.parse(fs.readFileSync(this.eventsFile, 'utf8'));
      }
    } catch (e) {
      events = [];
    }

    events.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    if (events.length > 100) {
      events = events.slice(-100);
    }

    const dir = path.dirname(this.eventsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.eventsFile, JSON.stringify(events, null, 2));
  }

  getStatus() {
    return {
      state: this.getState(),
      needsRecovery: this.needsRecoveryGoal(),
      warnings: this.generateInternalWarning()
    };
  }
}

module.exports = { DigitalHomeostasis };
