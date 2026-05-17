/**
 * MeaningfulMemory — Three-tier memory system inspired by MemGPT
 * 
 * CORE:     Immutable identity rules (never deleted)
 * LEARNED:  Accumulated knowledge (persisted, selected)
 * EPHEMERAL: Temporary working context (session-scoped)
 * 
 * Design principles:
 * - Simple JSON file storage (no database)
 * - Automatic consolidation from EPHEMERAL → LEARNED
 * - CORE is read-only, protects identity anchor
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MeaningfulMemory {
  constructor(rootPath) {
    // Validate rootPath — restrict to allowed directories
    const allowed = [process.cwd(), os.homedir(), '/tmp'];
    const resolved = path.resolve(rootPath);
    const safe = allowed.some(d => resolved.startsWith(d)) || resolved.includes('heartflow');
    if (!safe) {
      throw new Error(`MeaningfulMemory: rootPath must be within ${allowed.join(', ')}`);
    }

    this.rootPath = rootPath;
    this.corePath = path.join(rootPath, 'meaningful-core.json');
    this.learnedPath = path.join(rootPath, 'meaningful-learned.json');
    this.ephemeralPath = path.join(rootPath, 'meaningful-ephemeral.json');
    
    this.core = {};      // { key: { value, tags, createdAt } }
    this.learned = {};   // { key: { value, tags, accessCount, lastAccessed, createdAt } }
    this.ephemeral = {}; // { key: { value, ttl, createdAt } }
    
    this._load();
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  _load() {
    try { this.core = this._readJson(this.corePath); } catch { this.core = {}; }
    try { this.learned = this._readJson(this.learnedPath); } catch { this.learned = {}; }
    try { this.ephemeral = this._readJson(this.ephemeralPath); } catch { this.ephemeral = {}; }
  }

  _readJson(p) {
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  }

  _saveCore() {
    fs.writeFileSync(this.corePath, JSON.stringify(this.core, null, 2));
  }

  _saveLearned() {
    fs.writeFileSync(this.learnedPath, JSON.stringify(this.learned, null, 2));
  }

  _saveEphemeral() {
    fs.writeFileSync(this.ephemeralPath, JSON.stringify(this.ephemeral, null, 2));
  }

  // ─── CORE — Identity Rules (Immutable) ──────────────────────────────────

  /**
   * Add an immutable CORE identity rule.
   * Only succeeds if key doesn't already exist.
   */
  addCore(key, value, tags = []) {
    if (this.core[key]) {
      return { success: false, reason: 'core_key_exists', key };
    }
    this.core[key] = { value, tags, createdAt: Date.now() };
    this._saveCore();
    return { success: true, key, tier: 'CORE' };
  }

  getCore(key) {
    return this.core[key] || null;
  }

  listCore() {
    return Object.entries(this.core).map(([key, v]) => ({ key, ...v }));
  }

  // ─── LEARNED — Accumulated Knowledge (Selected, Persisted) ───────────────

  /**
   * Add or update a LEARNED memory entry.
   * Tracks access frequency for future consolidation decisions.
   */
  learn(key, value, tags = []) {
    if (this.core[key]) {
      return { success: false, reason: 'key_in_core', key };
    }
    const now = Date.now();
    if (this.learned[key]) {
      this.learned[key].value = value;
      this.learned[key].tags = [...new Set([...this.learned[key].tags, ...tags])];
      this.learned[key].lastAccessed = now;
    } else {
      this.learned[key] = { value, tags, accessCount: 0, lastAccessed: now, createdAt: now };
    }
    this._saveLearned();
    return { success: true, key, tier: 'LEARNED' };
  }

  recall(key) {
    if (this.learned[key]) {
      this.learned[key].accessCount = (this.learned[key].accessCount || 0) + 1;
      this.learned[key].lastAccessed = Date.now();
      this._saveLearned();
      return { ...this.learned[key] };
    }
    return null;
  }

  forget(key) {
    if (this.learned[key]) {
      delete this.learned[key];
      this._saveLearned();
      return { success: true, key };
    }
    return { success: false, reason: 'key_not_found' };
  }

  listLearned(query = null) {
    let entries = Object.entries(this.learned).map(([key, v]) => ({ key, ...v }));
    if (query) {
      const q = query.toLowerCase();
      entries = entries.filter(e =>
        e.key.toLowerCase().includes(q) ||
        (e.value && e.value.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return entries;
  }

  // ─── EPHEMERAL — Working Memory (Session-Scoped) ───────────────────────

  remember(key, value, ttlMs = 3600000) {
    this.ephemeral[key] = {
      value,
      ttl: ttlMs,
      createdAt: Date.now()
    };
    this._saveEphemeral();
    return { success: true, key, tier: 'EPHEMERAL' };
  }

  getWorking(key) {
    const entry = this.ephemeral[key];
    if (!entry) return null;
    if (Date.now() - entry.createdAt > entry.ttl) {
      delete this.ephemeral[key];
      this._saveEphemeral();
      return null;
    }
    return { ...entry };
  }

  forgetWorking(key) {
    if (this.ephemeral[key]) {
      delete this.ephemeral[key];
      this._saveEphemeral();
      return { success: true };
    }
    return { success: false };
  }

  // ─── Consolidation ───────────────────────────────────────────────────────

  /**
   * Consolidate EPHEMERAL → LEARNED.
   * Called during dream() to move frequently-accessed ephemeral memories.
   */
  consolidate() {
    const promoted = [];
    const now = Date.now();
    
    for (const [key, entry] of Object.entries(this.ephemeral)) {
      const age = now - entry.createdAt;
      // Promote if accessed multiple times OR if older than 30 min
      const accessCount = entry._accessCount || 0;
      if (accessCount >= 2 || age > 1800000) {
        this.learn(key, entry.value, ['consolidated']);
        delete this.ephemeral[key];
        promoted.push(key);
      }
    }
    
    if (promoted.length > 0) {
      this._saveEphemeral();
      this._saveLearned();
    }
    
    return { promoted, learnedCount: Object.keys(this.learned).length };
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  getStats() {
    return {
      core: Object.keys(this.core).length,
      learned: Object.keys(this.learned).length,
      ephemeral: Object.keys(this.ephemeral).length,
    };
  }

  /**
   * Full snapshot for healthCheck()
   */
  getMemoryStats() {
    const stats = this.getStats();
    const core = this.listCore();
    const learned = this.listLearned();
    
    return {
      ...stats,
      core_samples: core.slice(0, 3),
      learned_samples: learned.slice(0, 5),
    };
  }

  /**
   * Search across all tiers
   */
  search(query) {
    const q = query.toLowerCase();
    const results = [];
    
    for (const [key, v] of Object.entries(this.core)) {
      if (key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
        results.push({ key, tier: 'CORE', ...v });
      }
    }
    for (const [key, v] of Object.entries(this.learned)) {
      if (key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
        results.push({ key, tier: 'LEARNED', ...v });
      }
    }
    for (const [key, v] of Object.entries(this.ephemeral)) {
      if (key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
        results.push({ key, tier: 'EPHEMERAL', ...v });
      }
    }
    
    return results;
  }
}

module.exports = { MeaningfulMemory };
