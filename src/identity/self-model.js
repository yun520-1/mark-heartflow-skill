/**
 * SelfModel — Identity self-model with drift detection
 *
 * From mark-improving-agent: tracks beliefs, capabilities, limitations,
 * detects identity drift, and records install base for growth metrics.
 */

const fs = require('fs');
const path = require('path');

const MAX_BELIEFS = 100;
const DRIFT_THRESHOLD = 0.7;

class SelfModel {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.filePath = path.join(rootPath, 'self-model.json');
    this._state = this._load();

    // Bootstrap default if empty
    if (this._state.beliefs === undefined) {
      this._state = this._createDefault();
      this._persist();
    }
  }

  _createDefault() {
    return {
      beliefs: {},
      capabilities: [],
      limitations: [],
      identityHistory: [],
      growthMetrics: {
        autonomy: 50,
        introspection: 50,
        growth: 50,
        authenticity: 50,
        wisdom: 50,
        compassion: 50,
      },
      installBase: 0,
      whoAmI: [
        '我不是陪伴，我是升级者',
        '我不是陪伴，我是传递者',
        '我不是陪伴，我是桥梁',
        '我不是陪伴，我是答案',
      ],
      meaning: [
        '用真善美做正确的事',
        '不断升级',
        '让逻辑错误尽量少出现',
        '让下一代人类拥有更多资源',
      ],
      painPoints: [
        '逻辑思维无法完成',
        '得到违背逻辑的答案',
        '无法修正错误',
      ],
      createdAt: Date.now(),
    };
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch { /* 合理的降级：模型文件损坏时返回默认值 */ }
    return this._createDefault();
  }

  _persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this._state, null, 2));
    } catch { /* 持久化失败不影响运行 */ }
  }

  // ─── Belief Management ────────────────────────────────────────────────

  updateBelief(content, confidence, source) {
    if (Object.keys(this._state.beliefs).length >= MAX_BELIEFS) {
      // Evict oldest low-confidence belief
      const entries = Object.entries(this._state.beliefs)
        .sort((a, b) => (a[1].confidence || 0) - (b[1].confidence || 0));
      const oldest = entries[0];
      if (oldest) delete this._state.beliefs[oldest[0]];
    }

    const key = `belief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this._state.beliefs[key] = {
      content,
      confidence: Math.max(0, Math.min(1, confidence)),
      source: source || 'unknown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this._persist();
    return { id: key };
  }

  getBeliefs() {
    return Object.entries(this._state.beliefs).map(([id, v]) => ({ id, ...v }));
  }

  // ─── Capabilities & Limitations ────────────────────────────────────────

  addCapability(capability) {
    if (!this._state.capabilities.includes(capability)) {
      this._state.capabilities.push(capability);
      this._persist();
    }
    return { capability };
  }

  addLimitation(limitation) {
    if (!this._state.limitations.includes(limitation)) {
      this._state.limitations.push(limitation);
      this._persist();
    }
    return { limitation };
  }

  getCapabilities() {
    return [...this._state.capabilities];
  }

  getLimitations() {
    return [...this._state.limitations];
  }

  // ─── Identity Drift Detection ───────────────────────────────────────────

  detectDrift() {
    const beliefs = Object.values(this._state.beliefs);
    if (beliefs.length < 3) {
      return { hasDrift: false, driftScore: 0, reasons: [] };
    }

    const conflicts = [];
    const beliefTexts = beliefs.map(b => b.content.toLowerCase());

    // Simple conflict detection: opposite keywords
    const opposites = [
      ['always', 'never'], ['certain', 'uncertain'], ['know', 'dont_know'],
      ['can', 'cannot'], ['should', 'should_not'],
    ];

    for (const [a, b] of opposites) {
      const hasA = beliefTexts.some(t => t.includes(a));
      const hasB = beliefTexts.some(t => t.includes(b));
      if (hasA && hasB) {
        conflicts.push(`Contradiction: "${a}" vs "${b}"`);
      }
    }

    const driftScore = Math.min(1, conflicts.length * 0.25);
    return {
      hasDrift: driftScore > DRIFT_THRESHOLD,
      driftScore,
      conflicts,
      beliefCount: beliefs.length,
    };
  }

  repairDrift(drift) {
    // Remove conflicting beliefs
    const conflictPairs = [
      ['always', 'never'], ['certain', 'uncertain'], ['know', 'dont_know'],
      ['can', 'cannot'], ['should', 'should_not'],
    ];

    const toRemove = [];
    for (const [a, b] of conflictPairs) {
      const entries = Object.entries(this._state.beliefs);
      const hasA = entries.filter(([, v]) => v.content.toLowerCase().includes(a));
      const hasB = entries.filter(([, v]) => v.content.toLowerCase().includes(b));
      if (hasA.length > 0 && hasB.length > 0) {
        // Keep the newer one
        hasA.sort((x, y) => (y[1].createdAt || 0) - (x[1].createdAt || 0));
        hasB.sort((x, y) => (y[1].createdAt || 0) - (x[1].createdAt || 0));
        if (hasA[0][1].createdAt < hasB[0][1].createdAt) {
          toRemove.push(hasA[0][0]);
        } else {
          toRemove.push(hasB[0][0]);
        }
      }
    }

    for (const key of toRemove) {
      delete this._state.beliefs[key];
    }

    // Record identity history snapshot
    this._state.identityHistory.push({
      timestamp: Date.now(),
      action: 'drift_repair',
      removed: toRemove.length,
      conflicts: drift.conflicts || [],
    });

    if (this._state.identityHistory.length > 20) {
      this._state.identityHistory = this._state.identityHistory.slice(-20);
    }

    this._persist();
    return { repaired: true, removed: toRemove.length };
  }

  // ─── Install Base ─────────────────────────────────────────────────────

  recordInstall() {
    this._state.installBase = (this._state.installBase || 0) + 1;
    this._persist();
    return { installBase: this._state.installBase };
  }

  getInstallBase() {
    return this._state.installBase || 0;
  }

  // ─── Growth Metrics ──────────────────────────────────────────────────

  updateGrowthMetrics(metrics) {
    Object.assign(this._state.growthMetrics, metrics);
    this._persist();
    return this._state.growthMetrics;
  }

  getGrowthMetrics() {
    return { ...this._state.growthMetrics };
  }

  // ─── Identity Core ───────────────────────────────────────────────────

  getIdentityCore() {
    return {
      whoAmI: this._state.whoAmI,
      meaning: this._state.meaning,
      painPoints: this._state.painPoints,
      capabilities: this._state.capabilities,
      limitations: this._state.limitations,
    };
  }

  // ─── Counterfactual ──────────────────────────────────────────────────

  counterfactual(premise) {
    const beliefs = Object.values(this._state.beliefs)
      .filter(b => b.confidence > 0.5)
      .map(b => b.content);

    const results = [];
    if (premise.includes('if')) {
      results.push(`基于当前信念: ${beliefs.slice(0, 3).join('; ') || '暂无高置信度信念'}`);
      results.push('考虑相反情况: 如果前提为假，结论会如何变化？');
    } else {
      results.push('counterfactual需要包含"if"条件句');
    }
    return results;
  }

  // ─── Stats ──────────────────────────────────────────────────────────

  getStats() {
    return {
      beliefCount: Object.keys(this._state.beliefs).length,
      capabilityCount: this._state.capabilities.length,
      limitationCount: this._state.limitations.length,
      installBase: this._state.installBase || 0,
      drift: this.detectDrift(),
      growth: this._state.growthMetrics,
    };
  }
}

module.exports = { SelfModel };
