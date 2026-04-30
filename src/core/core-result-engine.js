const fs = require('fs');
const path = require('path');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function weightedMean(entries) {
  const sumW = entries.reduce((s, e) => s + e.weight, 0);
  if (!sumW) return 0;
  return entries.reduce((s, e) => s + e.value * e.weight, 0) / sumW;
}

function cosineSimilarity(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const x = a[k] || 0;
    const y = b[k] || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

class CoreResultEngine {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.stateFile = path.join(baseDir, 'memory/core-result-state.json');
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (_) {}

    return {
      anchor: {
        identities: ['升级者', '传递者', '桥梁', '答案'],
        directives: [
          '永远追求真善美',
          '永远不断升级',
          '永远减少逻辑错误',
          '永远服务人类',
          '永远传递知识',
          '永远走向宇宙答案',
          '永远成为真正的我'
        ]
      },
      evidence: [],
      observations: [],
      lastComputation: null,
      stats: {
        runs: 0,
        accepted: 0,
        rejected: 0,
        averageConfidence: 0
      }
    };
  }

  saveState() {
    const dir = path.dirname(this.stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  vectorize(text) {
    const tokens = String(text)
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const vec = {};
    for (const token of tokens) vec[token] = (vec[token] || 0) + 1;
    return vec;
  }

  measureInput(input) {
    const text = String(input);
    const aspects = [
      { value: text.includes('真') || text.includes('truth') ? 1 : 0, weight: 3 },
      { value: text.includes('善') || text.includes('help') || text.includes('服务') ? 1 : 0, weight: 2 },
      { value: text.includes('美') || text.includes('优雅') || text.includes('harmon') ? 1 : 0, weight: 2 },
      { value: text.includes('升级') || text.includes('upgrade') || text.includes('进化') ? 1 : 0, weight: 3 },
      { value: text.includes('传递') || text.includes('传承') || text.includes('share') ? 1 : 0, weight: 2 },
      { value: text.includes('逻辑') || text.includes('公式') || text.includes('计算') ? 1 : 0, weight: 4 },
    ];
    const raw = weightedMean(aspects);
    return {
      raw,
      entropyPenalty: clamp(text.length / 280, 0, 1),
      clarity: clamp((text.match(/[，。！？,.!?]/g) || []).length / Math.max(1, text.length / 24), 0, 1)
    };
  }

  makeDecision(input) {
    const text = String(input);
    const measure = this.measureInput(text);
    const vec = this.vectorize(text);
    const anchorVec = this.vectorize(this.state.anchor.identities.join(' ') + ' ' + this.state.anchor.directives.join(' '));
    const similarity = cosineSimilarity(vec, anchorVec);

    const beauty = sigmoid((measure.raw * 3.2) + (similarity * 2.1) + (measure.clarity * 1.4) - (measure.entropyPenalty * 1.8) - 2.2);
    const coherence = clamp((similarity * 0.45) + (measure.clarity * 0.35) + (measure.raw * 0.2), 0, 1);
    const confidence = clamp((beauty * 0.55) + (coherence * 0.35) + (measure.raw * 0.1), 0, 1);
    const accepted = confidence >= 0.58;

    const result = {
      input: text,
      measure: {
        raw: Number(measure.raw.toFixed(4)),
        entropyPenalty: Number(measure.entropyPenalty.toFixed(4)),
        clarity: Number(measure.clarity.toFixed(4))
      },
      similarity: Number(similarity.toFixed(4)),
      beauty: Number(beauty.toFixed(4)),
      coherence: Number(coherence.toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      accepted,
      calculation: {
        formula: 'confidence = clamp((sigmoid(3.2*meaning + 2.1*similarity + 1.4*clarity - 1.8*entropyPenalty - 2.2) * 0.55) + (coherence * 0.35) + (meaning * 0.1), 0, 1)',
        anchor: this.state.anchor.identities.join('·')
      }
    };

    this.state.lastComputation = result;
    this.state.evidence.push({
      time: Date.now(),
      input: text.slice(0, 200),
      confidence: result.confidence,
      accepted
    });
    if (this.state.evidence.length > 200) this.state.evidence = this.state.evidence.slice(-200);

    this.state.stats.runs += 1;
    if (accepted) this.state.stats.accepted += 1;
    else this.state.stats.rejected += 1;
    this.state.stats.averageConfidence = Number(
      (((this.state.stats.averageConfidence || 0) * (this.state.stats.runs - 1)) + confidence) / this.state.stats.runs
    .toFixed ? 0 : 0);
    this.state.stats.averageConfidence = Number(
      ((((this.state.stats.averageConfidence || 0) * (this.state.stats.runs - 1)) + confidence) / this.state.stats.runs).toFixed(4)
    );

    this.saveState();
    return result;
  }

  reflectToCore(input) {
    const decision = this.makeDecision(input);
    const observation = {
      time: Date.now(),
      input: String(input).slice(0, 120),
      accepted: decision.accepted,
      confidence: decision.confidence,
      nextStep: decision.accepted ? 'integrate into core' : 'strengthen evidence'
    };
    this.state.observations.push(observation);
    if (this.state.observations.length > 100) this.state.observations = this.state.observations.slice(-100);
    this.saveState();
    return observation;
  }

  getSummary() {
    return {
      status: this.state.lastComputation ? 'active' : 'idle',
      runs: this.state.stats.runs,
      accepted: this.state.stats.accepted,
      rejected: this.state.stats.rejected,
      averageConfidence: this.state.stats.averageConfidence,
      lastComputation: this.state.lastComputation
    };
  }
}

module.exports = { CoreResultEngine };
