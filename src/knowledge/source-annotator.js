/**
 * source-annotator.js
 *
 * 来源/时效/置信标注器：为知识条目或跨域推理结果附加 provenance 元数据。
 * 支持持久化时经 memory-encrypt.js 的 encryptJSON/decryptJSON。
 */

const fs = require('../utils/safe-fs');
const path = require('path');
const { encryptJSON, decryptJSON } = require('../memory/memory-encrypt.js');

class SourceAnnotator {
  /**
   * @param {object} [options]
   * @param {string} [options.annotationsPath]
   */
  constructor(options = {}) {
    this.annotationsPath = options.annotationsPath || path.join(__dirname, '..', '..', 'data', 'ontology', 'source-annotations.json');
    this.annotations = this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(this.annotationsPath)) return [];
      const raw = fs.readFileSync(this.annotationsPath, 'utf8');
      const data = decryptJSON(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  _persist() {
    try {
      const dir = path.dirname(this.annotationsPath);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = this.annotationsPath + `.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, encryptJSON(this.annotations), 'utf8');
      fs.renameSync(tmp, this.annotationsPath);
    } catch (e) {
      // 持久化失败不回抛，避免阻塞查询流程
    }
  }

  /**
   * 标注一条知识
   */
  annotate({ id, source, sourceType, domain, confidence, expiresAt, tags = [] } = {}) {
    const record = {
      id: id || `anno_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: source || 'unknown',
      sourceType: sourceType || 'manual',
      domain: domain || 'unknown',
      confidence: typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : 0.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: expiresAt || null,
      tags,
    };
    this.annotations.push(record);
    this._persist();
    return record;
  }

  /**
   * 刷新时效/置信
   */
  refresh(id, patch = {}) {
    const record = this.annotations.find(a => a.id === id);
    if (!record) return null;
    Object.assign(record, patch, { updatedAt: Date.now() });
    this._persist();
    return record;
  }

  /**
   * 检索
   */
  query({ domain, sourceType, minConfidence, limit = 50 } = {}) {
    let items = this.annotations;
    if (domain) items = items.filter(a => a.domain === domain);
    if (sourceType) items = items.filter(a => a.sourceType === sourceType);
    if (typeof minConfidence === 'number') items = items.filter(a => a.confidence >= minConfidence);
    items.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return items.slice(0, limit);
  }

  getStats() {
    const now = Date.now();
    return {
      total: this.annotations.length,
      byDomain: this._groupBy('domain'),
      bySourceType: this._groupBy('sourceType'),
      expired: this.annotations.filter(a => a.expiresAt && a.expiresAt < now).length,
    };
  }

  _groupBy(key) {
    const map = new Map();
    for (const a of this.annotations) {
      map.set(a[key], (map.get(a[key]) || 0) + 1);
    }
    return Object.fromEntries(map);
  }
}

module.exports = { SourceAnnotator };
