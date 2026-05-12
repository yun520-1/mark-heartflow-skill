/**
 * BioSignalAdapter - 生理信号适配器
 * 支持心率变异性 (HRV) 等生理信号集成
 * 
 * 参考：
 * - Heart Rate Variability (HRV) and Flow State
 * - HRV 高值通常与放松状态相关，中等 HRV 与心流状态相关
 * - 低 HRV 通常与压力/焦虑相关
 */

class BioSignalAdapter {
  constructor() {
    // 配置
    this.enabled = false;
    this.hrvDataSource = null;
    
    // HRV 数据缓存
    this.hrvData = {
      currentValue: null,
      history: [],
      lastUpdate: null,
      baseline: 50 // 基准 HRV 值 (ms)
    };
    
    // 专注度计算
    this.focusScore = {
      current: 5, // 1-10 分
      fromHRV: 5,
      fromBehavior: 5,
      lastCalculation: null
    };
    
    // HRV 与专注度映射 (基于研究)
    // HRV 过低 (<30ms): 压力/焦虑，专注度低
    // HRV 中等 (30-70ms): 心流状态，专注度高
    // HRV 过高 (>70ms): 放松状态，专注度中等
    this.hrvFocusMapping = {
      min: 10,
      optimal: 50,
      max: 100
    };
  }

  /**
   * 启用生理信号
   * @param {string} dataSource - 数据源 (如 'polar', 'garmin', 'apple-health')
   */
  enable(dataSource) {
    this.enabled = true;
    this.hrvDataSource = dataSource;
    console.log(`🫀 生理信号已启用，数据源：${dataSource}`);
    return { success: true, dataSource };
  }

  /**
   * 禁用生理信号
   */
  disable() {
    this.enabled = false;
    this.hrvDataSource = null;
    console.log('🫀 生理信号已禁用');
    return { success: true };
  }

  /**
   * 接收 HRV 数据
   * @param {number} hrvValue - HRV 值 (ms)
   * @returns {object} 处理结果
   */
  onHRVData(hrvValue) {
    // 验证数据
    if (typeof hrvValue !== 'number' || hrvValue < 0 || hrvValue > 200) {
      return {
        success: false,
        message: '无效 HRV 数据 (应为 0-200ms)'
      };
    }

    // 更新 HRV 数据
    this.hrvData.currentValue = hrvValue;
    this.hrvData.history.push({
      value: hrvValue,
      timestamp: new Date().toISOString()
    });
    this.hrvData.lastUpdate = new Date().toISOString();
    
    // 保留最近 100 条记录
    if (this.hrvData.history.length > 100) {
      this.hrvData.history.shift();
    }

    // 计算专注度
    const focusFromHRV = this.calculateFocusFromHRV(hrvValue);
    
    // 更新专注度分数
    this.focusScore.fromHRV = focusFromHRV;
    this.focusScore.current = this.calculateOverallFocus();
    this.focusScore.lastCalculation = new Date().toISOString();

    return {
      success: true,
      hrvValue,
      focusScore: this.focusScore.current,
      state: this.getHRVState(hrvValue),
      timestamp: this.hrvData.lastUpdate
    };
  }

  /**
   * 根据 HRV 计算专注度
   * @param {number} hrvValue - HRV 值
   * @returns {number} 专注度分数 (1-10)
   */
  calculateFocusFromHRV(hrvValue) {
    // 使用倒 U 型曲线映射 HRV 到专注度
    // 最优 HRV 范围：40-60ms (心流状态)
    
    const optimal = this.hrvFocusMapping.optimal;
    const range = 30; // 最优范围 ±30ms
    
    // 计算与最优值的距离
    const distance = Math.abs(hrvValue - optimal);
    
    // 距离越近，专注度越高
    // 距离 0: 10 分，距离 30: 5 分，距离 60: 1 分
    let focus = 10 - (distance / range) * 5;
    
    // 限制在 1-10 范围
    focus = Math.max(1, Math.min(10, focus));
    
    return Math.round(focus * 10) / 10;
  }

  /**
   * 计算整体专注度 (HRV + 行为)
   * @returns {number} 整体专注度 (1-10)
   */
  calculateOverallFocus() {
    // HRV 权重 40%，行为权重 60%
    const hrvWeight = 0.4;
    const behaviorWeight = 0.6;
    
    const overall = (
      this.focusScore.fromHRV * hrvWeight +
      this.focusScore.fromBehavior * behaviorWeight
    );
    
    return Math.round(overall * 10) / 10;
  }

  /**
   * 更新行为专注度
   * @param {number} score - 行为专注度分数 (1-10)
   */
  updateBehaviorFocus(score) {
    this.focusScore.fromBehavior = Math.max(1, Math.min(10, score));
    this.focusScore.current = this.calculateOverallFocus();
    this.focusScore.lastCalculation = new Date().toISOString();
  }

  /**
   * 获取 HRV 状态
   * @param {number} hrvValue - HRV 值
   * @returns {string} 状态描述
   */
  getHRVState(hrvValue) {
    if (hrvValue < 30) {
      return 'stress'; // 压力/焦虑
    } else if (hrvValue >= 30 && hrvValue < 70) {
      return 'flow'; // 心流状态
    } else {
      return 'relaxed'; // 放松状态
    }
  }

  /**
   * 获取 HRV 状态描述
   * @param {string} state - 状态代码
   * @returns {object} 状态信息
   */
  getStateDescription(state) {
    const descriptions = {
      stress: {
        label: '压力状态',
        icon: '😰',
        description: 'HRV 过低，可能处于压力或焦虑状态',
        suggestion: '建议深呼吸，短暂休息，降低任务难度'
      },
      flow: {
        label: '心流状态',
        icon: '🌊',
        description: 'HRV 处于 optimal 范围，处于心流状态',
        suggestion: '保持当前节奏，避免打断'
      },
      relaxed: {
        label: '放松状态',
        icon: '😌',
        description: 'HRV 较高，处于放松状态',
        suggestion: '适合休息或进行轻松任务'
      }
    };
    
    return descriptions[state] || descriptions.relaxed;
  }

  /**
   * 获取生理信号状态
   * @returns {object} 完整状态
   */
  getStatus() {
    const hrvState = this.hrvData.currentValue 
      ? this.getHRVState(this.hrvData.currentValue)
      : 'unknown';
    
    const stateDesc = this.getStateDescription(hrvState);
    
    return {
      enabled: this.enabled,
      dataSource: this.hrvDataSource,
      hrv: {
        currentValue: this.hrvData.currentValue,
        baseline: this.hrvData.baseline,
        state: hrvState,
        stateLabel: stateDesc.label,
        lastUpdate: this.hrvData.lastUpdate
      },
      focus: {
        current: this.focusScore.current,
        fromHRV: this.focusScore.fromHRV,
        fromBehavior: this.focusScore.fromBehavior,
        lastCalculation: this.focusScore.lastCalculation
      },
      history: {
        count: this.hrvData.history.length,
        average: this.hrvData.history.length > 0
          ? this.hrvData.history.reduce((sum, d) => sum + d.value, 0) / this.hrvData.history.length
          : 0
      }
    };
  }

  /**
   * 生成生理信号报告
   * @returns {string} 报告文本
   */
  generateReport() {
    const status = this.getStatus();
    
    if (!status.enabled) {
      return '🫀 生理信号未启用\n\n系统未来将支持连接心率设备，以提供更精准的心流检测。';
    }
    
    let report = '🫀 生理信号状态\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    if (status.hrv.currentValue) {
      report += `${status.hrv.stateLabel} ${status.hrv.stateIcon || '🫀'}\n`;
      report += `HRV: ${status.hrv.currentValue}ms (基准：${status.hrv.baseline}ms)\n`;
      report += `专注度：${status.focus.current}/10\n\n`;
      
      const stateDesc = this.getStateDescription(status.hrv.state);
      report += `${stateDesc.description}\n\n`;
      report += `建议：${stateDesc.suggestion}\n`;
    } else {
      report += '等待 HRV 数据...\n';
      report += '请连接心率设备或手动输入 HRV 数据\n';
    }
    
    if (status.history.count > 0) {
      report += `\n历史数据：${status.history.count} 条记录\n`;
      report += `平均 HRV: ${status.history.average.toFixed(1)}ms\n`;
    }
    
    report += '\n' + '═'.repeat(40) + '\n';
    report += `数据源：${status.dataSource}\n`;
    report += `最后更新：${status.hrv.lastUpdate || '无'}\n`;
    
    return report;
  }

  /**
   * 重置生理信号数据
   */
  reset() {
    this.hrvData = {
      currentValue: null,
      history: [],
      lastUpdate: null,
      baseline: 50
    };
    this.focusScore = {
      current: 5,
      fromHRV: 5,
      fromBehavior: 5,
      lastCalculation: null
    };
    return { success: true, message: '生理信号数据已重置' };
  }

  /**
   * 设置 HRV 基准值
   * @param {number} baseline - 基准 HRV 值
   */
  setBaseline(baseline) {
    this.hrvData.baseline = Math.max(10, Math.min(100, baseline));
    return { success: true, baseline: this.hrvData.baseline };
  }
}

// 创建全局实例
const bioSignalAdapter = new BioSignalAdapter();

// 导出
module.exports = BioSignalAdapter;
module.exports.bioSignalAdapter = bioSignalAdapter;
module.exports.onHRVData = (hrvValue) => bioSignalAdapter.onHRVData(hrvValue);
module.exports.getBioSignalStatus = () => bioSignalAdapter.getStatus();
module.exports.generateBioSignalReport = () => bioSignalAdapter.generateReport();
