/**
 * Bio-Sensor-Adapter - 生物传感器适配器接口
 * 
 * 统一传感器接口，支持多种生物信号
 * 预留扩展点：HRV、代码编辑流、眼动、皮肤电导等
 */

class BioSensorAdapter {
  constructor() {
    this.adapters = {};
    this.activeSensors = new Set();
    this.readingHistory = new Map();
    
    this.sensorTypes = {
      HRV: 'heart-rate-variability',
      EDIT_FLOW: 'code-edit-flow',
      EYE_TRACKING: 'eye-tracking',
      SKIN_CONDUCTANCE: 'skin-conductance',
      EEG: 'eeg-brainwave'
    };
    
    this.initializeBuiltIn();
  }

  initializeBuiltIn() {
    this.adapters[this.sensorTypes.HRV] = {
      name: 'HRV Sensor',
      enabled: false,
      lastReading: null,
      config: { samplingRate: 1000, bufferSize: 100 },
      enable() { this.enabled = true; },
      disable() { this.enabled = false; },
      read() { return this.lastReading; },
      onData(data) {
        this.lastReading = { value: data.hrv, timestamp: Date.now(), state: data.state, focus: data.focusScore };
      }
    };

    this.adapters[this.sensorTypes.EDIT_FLOW] = {
      name: 'Edit Flow Sensor',
      enabled: false,
      keystrokeBuffer: [],
      config: { windowSize: 5000, minEditDistance: 3 },
      enable() { this.enabled = true; },
      disable() { this.enabled = false; },
      read() {
        return { editRate: this.calculateEditRate(), pauseCount: this.countPauses(), pattern: this.getCurrentPattern() };
      },
      onData(data) {
        this.keystrokeBuffer.push({ type: data.type, timestamp: Date.now(), length: data.length || 0 });
        this.cleanupOldEvents();
      },
      calculateEditRate() {
        const now = Date.now();
        const recent = this.keystrokeBuffer.filter(e => now - e.timestamp < this.config.windowSize);
        return recent.length / (this.config.windowSize / 1000);
      },
      countPauses() {
        const now = Date.now();
        const recent = this.keystrokeBuffer.filter(e => now - e.timestamp < this.config.windowSize);
        let pauses = 0;
        for (let i = 1; i < recent.length; i++) {
          if (recent[i].timestamp - recent[i-1].timestamp > 2000) pauses++;
        }
        return pauses;
      },
      getCurrentPattern() {
        if (this.keystrokeBuffer.length < 3) return 'initializing';
        const rate = this.calculateEditRate();
        if (rate < 0.5) return 'paused';
        if (rate > 5) return 'rapid';
        return 'steady';
      },
      cleanupOldEvents() {
        const cutoff = Date.now() - this.config.windowSize * 2;
        this.keystrokeBuffer = this.keystrokeBuffer.filter(e => e.timestamp > cutoff);
      }
    };
  }

  register(type, adapter) {
    this.adapters[type] = { ...adapter, enabled: false, readings: [] };
    console.log(`[BioSensorAdapter] 注册传感器: ${type}`);
    return { success: true, type };
  }

  enable(type) {
    const adapter = this.adapters[type];
    if (!adapter) return { success: false, reason: 'sensor_not_found' };
    adapter.enable?.();
    this.activeSensors.add(type);
    console.log(`[BioSensorAdapter] 启用: ${type}`);
    return { success: true, type };
  }

  disable(type) {
    const adapter = this.adapters[type];
    if (!adapter) return { success: false, reason: 'sensor_not_found' };
    adapter.disable?.();
    this.activeSensors.delete(type);
    return { success: true, type };
  }

  read(type) {
    const adapter = this.adapters[type];
    if (!adapter || !adapter.enabled) return null;
    return adapter.read?.() || null;
  }

  write(type, data) {
    const adapter = this.adapters[type];
    if (!adapter) return { success: false, reason: 'sensor_not_found' };
    adapter.onData?.(data);
    if (!this.readingHistory.has(type)) this.readingHistory.set(type, []);
    this.readingHistory.get(type).push({ data, timestamp: Date.now() });
    return { success: true };
  }

  readAll() {
    const fusion = { timestamp: Date.now(), sensors: {} };
    for (const type of this.activeSensors) {
      const reading = this.read(type);
      if (reading) fusion.sensors[type] = reading;
    }
    fusion.focusScore = this.calculateFusionFocus(fusion.sensors);
    return fusion;
  }

  calculateFusionFocus(sensorReadings) {
    let totalWeight = 0, weightedSum = 0;
    if (sensorReadings[this.sensorTypes.HRV]?.focus !== undefined) {
      weightedSum += sensorReadings[this.sensorTypes.HRV].focus * 0.4;
      totalWeight += 0.4;
    }
    if (sensorReadings[this.sensorTypes.EDIT_FLOW]) {
      let editFocus = 5;
      if (sensorReadings[this.sensorTypes.EDIT_FLOW].pattern === 'steady') editFocus = 8;
      else if (sensorReadings[this.sensorTypes.EDIT_FLOW].pattern === 'rapid') editFocus = 7;
      else if (sensorReadings[this.sensorTypes.EDIT_FLOW].pattern === 'paused') editFocus = 3;
      weightedSum += editFocus * 0.6;
      totalWeight += 0.6;
    }
    return totalWeight === 0 ? 5 : Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  getStatus() {
    const status = { activeSensors: Array.from(this.activeSensors), availableSensors: Object.keys(this.adapters), historySize: this.readingHistory.size };
    for (const type of this.activeSensors) {
      status[type] = { enabled: true, lastReading: this.read(type), readingCount: this.readingHistory.get(type)?.length || 0 };
    }
    return status;
  }

  getConfig(type) { return this.adapters[type]?.config || null; }
  setConfig(type, config) {
    if (!this.adapters[type]) return { success: false, reason: 'sensor_not_found' };
    this.adapters[type].config = { ...this.adapters[type].config, ...config };
    return { success: true, config: this.adapters[type].config };
  }

  getHistory(type, limit = 100) {
    return (this.readingHistory.get(type) || []).slice(-limit);
  }

  clear(type) {
    if (type) {
      this.readingHistory.delete(type);
      if (this.adapters[type]) this.adapters[type].readings = [];
    } else {
      this.readingHistory.clear();
      for (const adapter of Object.values(this.adapters)) adapter.readings = [];
    }
    return { success: true };
  }
}

const bioSensorAdapter = new BioSensorAdapter();
module.exports = BioSensorAdapter;
module.exports.bioSensorAdapter = bioSensorAdapter;
module.exports.SensorTypes = { HRV: 'heart-rate-variability', EDIT_FLOW: 'code-edit-flow', EYE_TRACKING: 'eye-tracking', SKIN_CONDUCTANCE: 'skin-conductance', EEG: 'eeg-brainwave' };