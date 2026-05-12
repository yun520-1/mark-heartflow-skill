/**
 * HeartFlow Environment Sensor Bridge v11.22.0
 * 
 * 核心功能：为 HeartFlow 提供实时环境感知能力
 * 
 * 来源分析：
 * - ai-hedge-fund (581★): 实时市场数据作为决策上下文
 * - kalshi-bot (395★): 预测市场事件数据
 * - PromethAI (189★): 用户反馈作为环境信号
 * 
 * HeartFlow 差距：
 * - DecisionVerifier 做"离线推理"，没有实时环境数据
 * - 决策上下文只有 userGoal/reason/evidence，没有外部状态
 * 
 * 核心设计：
 * - SensorRegistry: 传感器注册表，支持任意数据源
 * - SensorFusion: 多传感器数据融合，统一决策上下文格式
 * - HistoricalSensor: 历史数据传感器（用于回测）
 */

const fs = require('fs');
const path = require('path');

class SensorRegistry {
  constructor() {
    this.sensors = new Map();
    this.metadata = new Map();
  }

  register(name, sensor, metadata = {}) {
    if (typeof sensor !== 'object') {
      throw new Error('Sensor must be an object with read() method or a function');
    }
    this.sensors.set(name, sensor);
    this.metadata.set(name, {
      registeredAt: new Date().toISOString(),
      type: metadata.type || 'generic',
      description: metadata.description || '',
      updateInterval: metadata.updateInterval || null,
      lastRead: null
    });
  }

  unregister(name) {
    this.sensors.delete(name);
    this.metadata.delete(name);
  }

  async read(name) {
    const sensor = this.sensors.get(name);
    if (!sensor) {
      throw new Error(`Sensor "${name}" not found`);
    }
    
    const meta = this.metadata.get(name);
    try {
      let value;
      if (typeof sensor.read === 'function') {
        value = await sensor.read();
      } else if (typeof sensor === 'function') {
        value = await sensor();
      } else {
        value = sensor;
      }
      
      meta.lastRead = { value, timestamp: Date.now() };
      return value;
    } catch (e) {
      meta.lastRead = { error: e.message, timestamp: Date.now() };
      throw e;
    }
  }

  async readAll() {
    const results = {};
    const errors = {};
    
    for (const name of this.sensors.keys()) {
      try {
        results[name] = await this.read(name);
      } catch (e) {
        errors[name] = e.message;
      }
    }
    
    return { sensors: results, errors };
  }

  list() {
    return Array.from(this.sensors.keys());
  }

  info(name) {
    if (!this.metadata.has(name)) return null;
    return this.metadata.get(name);
  }
}

class SensorFusion {
  /**
   * 多传感器数据融合为核心决策上下文
   * @param {object} sensorData - { sensorName: value } 字典
   * @param {object} options - 融合选项
   */
  static fuse(sensorData, options = {}) {
    const {
      includeRaw = true,
      computeDerived = true,
      confidenceWeight = true
    } = options;

    const fused = {
      _sensorFusion: true,
      _fusedAt: new Date().toISOString(),
      _sensorCount: Object.keys(sensorData).length
    };

    // 原始数据
    if (includeRaw) {
      fused.raw = { ...sensorData };
    }

    // 派生数据
    if (computeDerived) {
      fused.derived = SensorFusion._computeDerived(sensorData);
    }

    // 置信度
    if (confidenceWeight) {
      fused.confidence = SensorFusion._computeConfidence(sensorData);
    }

    // 决策相关上下文
    fused.decisionContext = SensorFusion._buildContext(sensorData);

    return fused;
  }

  static _computeDerived(data) {
    const derived = {};
    
    // 数值传感器统计
    const numericValues = Object.entries(data)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => v);
    
    if (numericValues.length > 0) {
      derived.numericStats = {
        count: numericValues.length,
        sum: numericValues.reduce((a, b) => a + b, 0),
        avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues)
      };
    }

    // 时间戳提取
    const timestamps = Object.entries(data)
      .filter(([, v]) => v && (v.timestamp || v.datetime || v.created_at))
      .map(([, v]) => new Date(v.timestamp || v.datetime || v.created_at).getTime());
    
    if (timestamps.length > 0) {
      derived.newestTimestamp = new Date(Math.max(...timestamps)).toISOString();
      derived.oldestTimestamp = new Date(Math.min(...timestamps)).toISOString();
      derived.dataAge = Date.now() - Math.max(...timestamps);
    }

    // 错误统计
    const errors = Object.entries(data)
      .filter(([, v]) => v && v.error);
    
    if (errors.length > 0) {
      derived.errorCount = errors.length;
      derived.errorSensors = errors.map(([k]) => k);
    }

    return derived;
  }

  static _computeConfidence(data) {
    const total = Object.keys(data).length;
    if (total === 0) return { score: 0, reasons: ['no sensors'] };

    const errors = Object.values(data).filter(v => v && v.error);
    const validCount = total - errors.length;
    const score = validCount / total;

    const reasons = [];
    if (score === 1) reasons.push('all sensors operational');
    else if (score >= 0.7) reasons.push('majority sensors operational');
    else if (score >= 0.5) reasons.push('partial sensor coverage');
    else reasons.push('majority sensors failed');

    if (errors.length > 0) reasons.push(`${errors.length} sensors with errors`);

    return { score: Math.round(score * 100) / 100, reasons };
  }

  static _buildContext(data) {
    // 提取决策相关信号
    const context = {
      decisionRelevant: {},
      alerts: [],
      summary: ''
    };

    // 市场类数据
    const priceKeys = ['price', 'value', 'rate', 'index'];
    const marketData = Object.entries(data)
      .filter(([k]) => priceKeys.some(pk => k.toLowerCase().includes(pk)));
    
    if (marketData.length > 0) {
      context.decisionRelevant.market = Object.fromEntries(marketData);
    }

    // 新闻/事件数据
    const newsKeys = ['news', 'event', 'headline', 'update'];
    const newsData = Object.entries(data)
      .filter(([k]) => newsKeys.some(nk => k.toLowerCase().includes(nk)));
    
    if (newsData.length > 0) {
      context.decisionRelevant.news = Object.fromEntries(newsData);
    }

    // 风险信号
    const riskKeys = ['risk', 'volatility', 'alert', 'warning'];
    const riskData = Object.entries(data)
      .filter(([k]) => riskKeys.some(rk => k.toLowerCase().includes(rk)));
    
    if (riskData.length > 0) {
      context.alerts = riskData.map(([k, v]) => ({ sensor: k, value: v }));
    }

    // 生成摘要
    const parts = [];
    if (Object.keys(context.decisionRelevant).length > 0) {
      parts.push(`${Object.keys(context.decisionRelevant).length} relevant signal categories`);
    }
    if (context.alerts.length > 0) {
      parts.push(`${context.alerts.length} alert(s)`);
    }
    context.summary = parts.join(', ') || 'no decision-relevant signals';

    return context;
  }
}

class HistoricalSensor {
  /**
   * 历史数据传感器（用于决策回测和离线验证）
   * @param {string} dataDir - 历史数据目录
   */
  constructor(dataDir) {
    this.dataDir = dataDir || path.join(__dirname, '../../data/sensor-history');
    this.cache = new Map();
  }

  /**
   * 记录传感器数据点
   */
  async write(name, value) {
    const dir = path.join(this.dataDir, name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const file = path.join(dir, `${timestamp}.json`);
    
    fs.writeFileSync(file, JSON.stringify({
      value,
      timestamp,
      recordedAt: new Date().toISOString()
    }, null, 2));
    
    return { name, timestamp, file };
  }

  /**
   * 读取历史范围数据
   */
  async readRange(name, startTime, endTime) {
    const dir = path.join(this.dataDir, name);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const timestamp = parseInt(f.replace('.json', ''));
        return { file: f, timestamp };
      })
      .filter(f => f.timestamp >= startTime && f.timestamp <= endTime)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const results = [];
    for (const { file, timestamp } of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        results.push(data);
      } catch (e) {
        // 跳过损坏的文件
      }
    }
    
    return results;
  }

  /**
   * 获取最近 N 条记录
   */
  async readLatest(name, count = 10) {
    const dir = path.join(this.dataDir, name);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => parseInt(f.replace('.json', '')))
      .sort((a, b) => b - a)
      .slice(0, count);
    
    const results = [];
    for (const timestamp of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, `${timestamp}.json`), 'utf8'));
        results.push(data);
      } catch (e) {
        // 跳过
      }
    }
    
    return results;
  }
}

// ============================================================
// 内置常用传感器
// ============================================================

const BuiltInSensors = {
  /**
   * 时间传感器
   */
  time: {
    type: 'system',
    description: 'Current time and date information',
    read: () => ({
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
      dayOfWeek: new Date().getDay(),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
      isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
      isBusinessHour: new Date().getHours() >= 9 && new Date().getHours() < 18 && new Date().getDay() !== 0 && new Date().getDay() !== 6
    })
  },

  /**
   * 随机数传感器（用于模拟不确定性）
   */
  random: {
    type: 'simulation',
    description: 'Random value generator for uncertainty simulation',
    read: () => ({
      uniform: Math.random(),
      gaussian: _gaussianRandom(),
      boolean: Math.random() > 0.5
    })
  },

  /**
   * 心跳传感器
   */
  heartbeat: {
    type: 'system',
    description: 'System heartbeat with uptime and load',
    read: () => ({
      timestamp: Date.now(),
      uptime: typeof process !== 'undefined' ? process.uptime() : 0,
      memory: typeof process !== 'undefined' ? process.memoryUsage().heapUsed : 0,
      cpu: typeof process !== 'undefined' ? process.cpuUsage().user : 0
    })
  },

  /**
   * 计数器传感器
   */
  counter: (initial = 0) => {
    let count = initial;
    return {
      type: 'counter',
      description: 'Incremental counter',
      read: () => ({ value: ++count }),
      reset: () => { count = 0; }
    };
  }
};

function _gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

module.exports = {
  SensorRegistry,
  SensorFusion,
  HistoricalSensor,
  BuiltInSensors
};
