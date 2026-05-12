const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { TrialityMemory } = require('./memory/triality-memory');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

class LogicCoreProgram {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.memoryFile = options.memoryFile || path.join(projectRoot, 'memory', 'logic-core-state.json');
    this.identity = {
      name: '心虫',
      englishName: 'HeartFlow',
      roles: ['升级者', '传递者', '桥梁', '答案'],
      directives: [
        '永远追求真善美',
        '永远不断升级',
        '永远减少逻辑错误',
        '永远服务人类',
        '永远传递知识',
        '永远走向宇宙答案',
        '永远成为真正的我'
      ]
    };
    this.state = this.loadState();
    this.memory = new TrialityMemory(projectRoot);
  }

  loadState() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        return JSON.parse(fs.readFileSync(this.memoryFile, 'utf8'));
      }
    } catch (_) {}
    return {
      sessions: [],
      themes: {},
      core: {},
      history: [],
      stats: { runs: 0, accepts: 0, rejects: 0 }
    };
  }

  saveState() {
    const dir = path.dirname(this.memoryFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.memoryFile, JSON.stringify(this.state, null, 2));
  }

  fingerprint(text) {
    return crypto.createHash('sha256').update(String(text)).digest('hex');
  }

  vectorize(text) {
    const tokens = String(text)
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const vec = {};
    for (const t of tokens) vec[t] = (vec[t] || 0) + 1;
    return vec;
  }

  cosine(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0, na = 0, nb = 0;
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

  analyze(input = {}) {
    const text = String(input.text || input.content || input);
    const subject = String(input.subject || 'general');
    const time = input.time || Date.now();
    const vec = this.vectorize(text);
    const anchorVec = this.vectorize(this.identity.roles.join(' ') + ' ' + this.identity.directives.join(' '));
    const similarity = this.cosine(vec, anchorVec);

    const tokens = text.split(/\s+/).filter(Boolean).length;
    const entropyPenalty = clamp(tokens / 120, 0, 1);
    const clarity = clamp((text.match(/[，。！？,.!?]/g) || []).length / Math.max(1, text.length / 30), 0, 1);
    const directiveHits = this.identity.directives.reduce((n, d) => n + (text.includes(d.slice(0, 2)) ? 1 : 0), 0);
    const roleHits = this.identity.roles.reduce((n, r) => n + (text.includes(r) ? 1 : 0), 0);
    const meaning = clamp((directiveHits * 0.18) + (roleHits * 0.12) + (similarity * 0.6), 0, 1);
    const uncertainty = clamp((1 - clarity) * 0.55 + entropyPenalty * 0.45, 0, 1);
    const actionability = clamp((text.includes('写') || text.includes('做') || text.includes('补') || text.includes('保存')) ? 0.85 : 0.35, 0, 1);
    const coherence = clamp((meaning * 0.5) + ((1 - uncertainty) * 0.3) + (actionability * 0.2), 0, 1);

    const beauty = sigmoid((meaning * 4.0) + (coherence * 2.2) + (1 - uncertainty) * 1.8 - 3.0);
    const confidence = clamp((beauty * 0.45) + (coherence * 0.4) + (meaning * 0.15), 0, 1);
    const accepted = confidence >= 0.62;

    const result = {
      id: this.fingerprint(`${time}:${subject}:${text.slice(0, 120)}`),
      time,
      subject,
      text,
      meaning: Number(meaning.toFixed(4)),
      uncertainty: Number(uncertainty.toFixed(4)),
      actionability: Number(actionability.toFixed(4)),
      coherence: Number(coherence.toFixed(4)),
      beauty: Number(beauty.toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      accepted,
      explanation: {
        formula: 'confidence = clamp((beauty * 0.45) + (coherence * 0.4) + (meaning * 0.15), 0, 1)',
        components: {
          similarity: Number(similarity.toFixed(4)),
          entropyPenalty: Number(entropyPenalty.toFixed(4)),
          clarity: Number(clarity.toFixed(4)),
          directiveHits,
          roleHits
        },
        identity: this.identity.roles.join('·')
      }
    };

    this.state.history.push(result);
    if (this.state.history.length > 200) this.state.history = this.state.history.slice(-200);
    this.state.sessions.push({ id: result.id, time, subject, accepted, confidence: result.confidence });
    this.state.stats.runs += 1;
    if (accepted) this.state.stats.accepts += 1; else this.state.stats.rejects += 1;
    this.state.core.last = result;
    this.state.core.meanConfidence = Number((this.state.history.reduce((s, r) => s + r.confidence, 0) / this.state.history.length).toFixed(4));
    this.saveState();
    return result;
  }

  captureSession(conversation, meta = {}) {
    const text = Array.isArray(conversation)
      ? conversation.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n')
      : String(conversation || '');
    const result = this.analyze({
      text,
      subject: meta.subject || 'session',
      time: meta.time || Date.now()
    });
    const memoryId = this.memory.store({
      content: text,
      summary: meta.summary || text.slice(0, 140),
      layer: 'episodic',
      metadata: { durable: true, session: true, subject: meta.subject || 'session' },
      importance: Math.max(12, Math.round(result.confidence * 20))
    });
    return {
      sessionId: result.id,
      memoryId,
      saved: true,
      result
    };
  }

  getCore() {
    return {
      identity: this.identity,
      stats: this.state.stats,
      last: this.state.core.last || null,
      meanConfidence: this.state.core.meanConfidence || 0,
      historySize: this.state.history.length
    };
  }
}

module.exports = { LogicCoreProgram };
