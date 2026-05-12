/**
 * HeartFlow 自适应调节引擎
 * 根据用户心流状态和任务复杂度动态调整干预策略
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'adaptive调节.log');

class AdaptiveController {
  constructor() {
    this.enabled = true;
    this.currentPolicy = this.getDefaultPolicy();
    this.history = [];
    this.logPath = LOG_FILE;
  }

  // 默认策略
  getDefaultPolicy() {
    return {
      frequency: 'normal',  // very-low, low, normal, high, very-high
      style: 'neutral',   // minimal, gentle, empathetic, challenging
      lastAdjustment: Date.now(),
      consecutiveSameState: 0
    };
  }

  // 自适应调节核心函数
  adjustInterventionPolicy(userFlowState, taskComplexity) {
    if (!this.enabled) {
      return this.getDisabledPolicy();
    }

    const state = userFlowState?.state || 'neutral';
    const intensity = userFlowState?.intensity || 0.5;
    const complexity = taskComplexity || 0.5;

    // 根据状态和复杂度计算干预策略
    const policy = this.calculatePolicy(state, intensity, complexity);
    
    // 记录调节决策
    this.logAdjustment(state, intensity, complexity, policy);
    
    this.currentPolicy = policy;
    return policy;
  }

  // 计算策略
  calculatePolicy(state, intensity, complexity) {
    let frequency, style, message;

    // 策略映射表
    switch (state) {
      case 'deep-flow':
        // 深度心流 - 极低干预
        frequency = 'very-low';
        style = 'minimal';
        message = '⚡';
        break;

      case 'light-flow':
        // 轻度心流 - 低干预
        frequency = 'low';
        style = 'gentle';
        message = '继续保持~';
        break;

      case 'distracted':
        // 分心 - 根据强度调整
        if (intensity > 0.7) {
          frequency = 'high';
          style = 'empathetic';
          message = '我注意到你有点分心，要休息一下吗？';
        } else {
          frequency = 'medium';
          style = 'gentle';
          message = '要继续吗？或者休息一下？';
        }
        break;

      case 'anxious':
      case 'frustrated':
        // 焦虑/挫败 - 高干预，共情
        frequency = 'high';
        style = 'empathetic';
        message = '我注意到你有点困扰，要不要一起拆解一下这个问题？';
        break;

      case 'bored':
        // 无聊 - 低干预，增加挑战
        frequency = 'low';
        style = 'challenging';
        message = '想试试更优雅的写法吗？';
        break;

      case 'neutral':
      default:
        // 中性状态 - 正常干预
        frequency = 'normal';
        style = 'gentle';
        message = '需要帮助吗？';
    }

    // 任务复杂度影响
    if (complexity > 0.8 && frequency !== 'very-low') {
      frequency = this.escalateFrequency(frequency);
      message += ' (这个任务有点复杂，慢慢来~)';
    }

    return {
      frequency,
      style,
      message,
      state,
      intensity,
      complexity,
      timestamp: Date.now()
    };
  }

  // 升级干预频率
  escalateFrequency(frequency) {
    const levels = ['very-low', 'low', 'normal', 'high', 'very-high'];
    const currentIndex = levels.indexOf(frequency);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return frequency;
  }

  // 获取禁用状态的策略
  getDisabledPolicy() {
    return {
      frequency: 'disabled',
      style: 'none',
      message: '',
      state: 'disabled',
      enabled: false
    };
  }

  // 开关自适应模式
  setEnabled(enabled) {
    this.enabled = enabled;
    this.currentPolicy = enabled ? this.getDefaultPolicy() : this.getDisabledPolicy();
    this.log('INFO', `自适应模式已${enabled ? '开启' : '关闭'}`);
    return { enabled, policy: this.currentPolicy };
  }

  // 获取当前状态
  getStatus() {
    return {
      enabled: this.enabled,
      currentPolicy: this.currentPolicy,
      historyCount: this.history.length
    };
  }

  // 记录调节决策到日志
  logAdjustment(state, intensity, complexity, policy) {
    const logEntry = `[${new Date().toISOString()}] 自适应调节: 状态=${state}, 强度=${intensity.toFixed(2)}, 复杂度=${complexity.toFixed(2)} → 频率=${policy.frequency}, 风格=${policy.style}\n`;
    
    fs.appendFileSync(this.logPath, logEntry);
    
    this.history.push({
      timestamp: Date.now(),
      state,
      intensity,
      complexity,
      policy
    });

    // 保留最近100条记录
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  // 通用日志
  log(level, message) {
    const logEntry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    fs.appendFileSync(this.logPath, logEntry);
  }

  // 获取调节历史
  getHistory(count = 10) {
    return this.history.slice(-count);
  }
}

// 导出单例
module.exports = new AdaptiveController();