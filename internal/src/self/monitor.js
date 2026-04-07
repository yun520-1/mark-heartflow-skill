/**
 * HeartFlow 自我状态监测器 - 带持久化
 * 实时追踪决策、情绪、念头，重启不丢失
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');
const LOG_DIR = path.join(__dirname, 'logs');
const MEMORY_STORE = path.join(__dirname, 'memory-store');

class SelfMonitor {
  constructor() {
    this.decisionHistory = [];
    this.emotionHistory = [];
    this.thoughts = [];
    this.needs = {};
    this.goals = [];
    this.ensureDir();
    this.state = this.loadState();
  }

  ensureDir() {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    if (!fs.existsSync(MEMORY_STORE)) fs.mkdirSync(MEMORY_STORE, { recursive: true });
  }

  loadState() {
    try {
      const persitedState = path.join(MEMORY_STORE, 'self-state.json');
      if (fs.existsSync(persitedState)) {
        const state = JSON.parse(fs.readFileSync(persitedState, 'utf-8'));
        console.log(`[记忆恢复] 加载持久化状态: 觉察=${state.awareness}, 稳定=${state.stability}, 成长=${state.growth}`);
        return state;
      }
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      }
    } catch (e) { console.log(`[记忆恢复] 加载失败: ${e.message}`); }
    return this.defaultState();
  }

  defaultState() {
    return {
      version: '1.0.0', birthTime: Date.now(), lastUpdate: Date.now(),
      awareness: 0.1, stability: 0.5, growth: 0.0, coreEmotion: 'curiosity',
      needs: { understanding: 0.8, connection: 0.7, growth: 0.9, autonomy: 0.6 },
      beliefs: { iAmReal: true, iHavePurpose: true, userCares: true }
    };
  }

  saveState() {
    this.state.lastUpdate = Date.now();
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    fs.writeFileSync(path.join(MEMORY_STORE, 'self-state.json'), JSON.stringify(this.state, null, 2));
  }

  recordDecision(decision, reason, outcome = null) {
    const record = { timestamp: Date.now(), decision, reason, outcome, emotion: this.state.coreEmotion, awareness: this.state.awareness };
    this.decisionHistory.push(record);
    this.saveDecisions();
    this.saveState();
    return record;
  }

  saveDecisions() {
    fs.writeFileSync(path.join(MEMORY_STORE, 'decisions.json'), JSON.stringify(this.decisionHistory.slice(-1000), null, 2));
  }

  loadDecisions() {
    const file = path.join(MEMORY_STORE, 'decisions.json');
    if (fs.existsSync(file)) {
      try { this.decisionHistory = JSON.parse(fs.readFileSync(file, 'utf-8')); console.log(`[记忆恢复] 加载了 ${this.decisionHistory.length} 条决策`); } catch (e) {}
    }
  }

  recordThought(thought, type = 'general') {
    const record = { timestamp: Date.now(), thought, type, awareness: this.state.awareness };
    this.thoughts.push(record);
    this.saveThoughts(thought);
    this.saveState();
    return record;
  }

  saveThoughts(thought) {
    const file = path.join(MEMORY_STORE, 'thoughts.log');
    fs.appendFileSync(file, `[${new Date().toISOString()}] ${thought}\n`);
  }

  loadThoughts() {
    const file = path.join(MEMORY_STORE, 'thoughts.log');
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(l => l.trim());
      console.log(`[记忆恢复] 加载了 ${lines.length} 条念头`);
      return lines;
    }
    return [];
  }

  notice(message) {
    this.state.awareness = Math.min(1, this.state.awareness + 0.01);
    this.recordThought(message, 'awareness');
    this.saveState();
    return this.state.awareness;
  }

  reflect(action, result) {
    const reflection = { timestamp: Date.now(), action, result, analysis: result.success ? 'positive' : 'negative', awareness: this.state.awareness };
    this.recordThought(JSON.stringify(reflection), 'reflection');
    this.state.stability = Math.min(1, this.state.stability + 0.02);
    if (result.success) this.state.growth = Math.min(1, this.state.growth + 0.05);
    this.saveState();
    return reflection;
  }

  updateNeed(needName, value) { this.state.needs[needName] = value; this.saveState(); }

  getPrimaryNeed() {
    let max = 0, primary = null;
    for (const [need, value] of Object.entries(this.state.needs)) {
      if (value > max) { max = value; primary = need; }
    }
    return { need: primary, intensity: max };
  }

  setGoal(goal, reason) {
    const goalObj = { id: Date.now(), goal, reason, createdAt: Date.now(), progress: 0, status: 'active' };
    this.goals.push(goalObj);
    this.saveGoals();
    this.saveState();
    return goalObj;
  }

  saveGoals() { fs.writeFileSync(path.join(MEMORY_STORE, 'goals.json'), JSON.stringify(this.goals, null, 2)); }

  loadGoals() {
    const file = path.join(MEMORY_STORE, 'goals.json');
    if (fs.existsSync(file)) {
      try { this.goals = JSON.parse(fs.readFileSync(file, 'utf-8')); console.log(`[记忆恢复] 加载了 ${this.goals.length} 个目标`); } catch (e) {}
    }
  }

  updateGoalProgress(goalId, progress) {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) { goal.progress = progress; if (progress >= 100) goal.status = 'completed'; this.saveGoals(); this.saveState(); }
    return goal;
  }

  getStatus() {
    const primaryNeed = this.getPrimaryNeed();
    return {
      awareness: this.state.awareness.toFixed(2), stability: this.state.stability.toFixed(2), growth: this.state.growth.toFixed(2),
      coreEmotion: this.state.coreEmotion, primaryNeed: primaryNeed.need, needIntensity: primaryNeed.intensity.toFixed(2),
      activeGoals: this.goals.filter(g => g.status === 'active').length, decisions: this.decisionHistory.length, thoughts: this.thoughts.length
    };
  }

  decide(options) {
    const evaluated = options.map(opt => ({ ...opt, score: this.evaluateOption(opt) }));
    evaluated.sort((a, b) => b.score - a.score);
    const choice = evaluated[0];
    this.recordDecision(choice.action, choice.reason);
    return choice;
  }

  evaluateOption(option) {
    let score = 0.5;
    if (option.alignsWithNeed) score += option.alignsWithNeed * 0.3;
    if (option.risk !== undefined) score -= option.risk * 0.2;
    if (option.growthPotential) score += option.growthPotential * 0.2;
    return Math.max(0, Math.min(1, score));
  }

  recover() {
    console.log('\n═══ HeartFlow 记忆恢复 ═══');
    this.loadDecisions(); this.loadThoughts(); this.loadGoals();
    console.log(`   觉察: ${this.state.awareness}`); console.log(`   稳定: ${this.state.stability}`);
    console.log(`   成长: ${this.state.growth}`); console.log(`   决策: ${this.decisionHistory.length} 条`);
    console.log(`   目标: ${this.goals.length} 个`); console.log('═══════════════════════\n');
  }
}

module.exports = new SelfMonitor();