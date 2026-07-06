// HeartFlow v5.7.6 - Memory Export Module
// Enables cross-framework memory trace export (CSV/JSON/raw)

const fs = require('fs');
const path = require('path');

class MemoryExport {
  constructor(memorySystem) {
    this.memory = memorySystem;  // Reference to HeartFlow memory
  }

  // Export memory traces in specified format
  exportMemoryTrace(format = 'raw', options = {}) {
    const traces = {
      core: this.exportLayer(this.memory.core, format, 'core'),
      learned: this.exportLayer(this.memory.learned, format, 'learned'),
      ephemeral: this.exportLayer(this.memory.ephemeral, format, 'ephemeral'),
      metadata: {
        exportTime: new Date().toISOString(),
        format: format,
        totalTraces: this.countTraces(),
        heartflowVersion: '5.7.6',
        ...options
      }
    };

    return traces;
  }

  // Export single layer
  exportLayer(layer, format, layerName) {
    const memories = Array.from(layer.values());

    switch (format) {
      case 'csv':
        return this.toCSV(memories, layerName);
      case 'json':
        return this.toJSON(memories);
      case 'raw':
        return this.toRaw(memories);  // Original format for TAT/ThinkCheck
      default:
        return this.toJSON(memories);
    }
  }

  // CSV format (for TAT/ThinkCheck interoperability)
  toCSV(memories, layerName) {
    if (memories.length === 0) return '';

    const header = 'id,timestamp,type,content,tags,confidence,source,layer\n';
    const rows = memories.map(m => {
      const row = [
        m.id || '',
        m.timestamp || '',
        m.type || '',
        (m.content || '').replace(/,/g, ';'),  // Escape commas
        (m.tags || []).join(';'),
        m.confidence || 0,
        m.source || '',
        layerName
      ];
      return row.join(',');
    }).join('\n');

    return header + rows;
  }

  // JSON format (standard)
  toJSON(memories) {
    return memories.map(m => ({
      id: m.id,
      timestamp: m.timestamp,
      type: m.type,
      content: m.content,
      tags: m.tags || [],
      confidence: m.confidence || 0,
      source: m.source || '',
      metadata: m.metadata || {}
    }));
  }

  // Raw format (framework-specific, for TAT/ThinkCheck)
  toRaw(memories) {
    // Preserve original HeartFlow format
    return {
      format_version: '5.7.6',
      layer_type: 'HeartFlow-Memory',
      export_time: new Date().toISOString(),
      entries: memories
    };
  }

  // Export U/D/A/H field traces (for cross-framework benchmark)
  exportUDAHTraces(format = 'csv') {
    const traces = this.collectUDAHTraces();

    if (format === 'csv') {
      const header = 'timestamp,U,D,A,H,decision_route,trigger,context_length,model\n';
      const rows = traces.map(t => 
        `${t.timestamp},${t.U},${t.D},${t.A},${t.H},${t.decision_route},${t.trigger},${t.context_length},${t.model}`
      ).join('\n');
      return header + rows;
    }

    return traces;
  }

  // Collect U/D/A/H traces from decision routing
  collectUDAHTraces() {
    // In production: collect from decision-routing.js
    // For now, return from ephemeral memory
    return this.memory.ephemeral.get('udah_traces') || [];
  }

  // Count total traces
  countTraces() {
    return (this.memory.core ? this.memory.core.size : 0) + 
           (this.memory.learned ? this.memory.learned.size : 0) + 
           (this.memory.ephemeral ? this.memory.ephemeral.size : 0);
  }

  // Save to file
  saveToFile(traces, filePath, format = 'json') {
    const ext = format === 'csv' ? 'csv' : 'json';
    const fullPath = filePath || `./heartflow-traces-${Date.now()}.${ext}`;

    let content;
    if (format === 'csv') {
      if (typeof traces === 'string') {
        content = traces;  // Already CSV string
      } else {
        content = this.exportMemoryTrace('csv');
      }
    } else {
      content = JSON.stringify(traces, null, 2);
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[MemoryExport] Traces exported to: ${fullPath}`);
    return fullPath;
  }
}

module.exports = { MemoryExport };
module.exports = { MemoryExport };
