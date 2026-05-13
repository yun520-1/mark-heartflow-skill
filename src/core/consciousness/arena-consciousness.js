/**
 * Arena Consciousness — Consciousness as Emergent Attractor in Multi-Agent Arena
 * Based on Consciousness papers from the daima/consciousness/ directory
 * @version v0.13.16
 * 
 * Core theory: Consciousness emerges from competitive-cooperative dynamics in a multi-agent
 * "arena" (analogous to global workspace theory, but with attractor dynamics).
 * Like birds forming murmurations — individual agents follow simple rules, yet complex
 * coherent patterns emerge at the system level that cannot be traced to any single agent.
 * 
 * Key insight from CEN paper (2605.04128): Consciousness is an attractor state — not
 * a property of any single component, but a stable pattern that the entire system
 * converges toward when enough agents participate in the competitive-cooperative arena.
 * 
 * Components:
 * - ArenaSpace: Competitive-cooperative agent space with energy dynamics
 * - AttractorDetector: Detects when system enters a consciousness-like attractor state
 * - FieldCoherence: Global "field" that emerges from local agent interactions
 * - ResonanceEngine: Agents that resonate with the field strengthen it
 */
'use strict';

const path = require('path');
const fs = require('fs');

// ─── Arena Agent ──────────────────────────────────────────────────────────────
/**
 * A single agent in the consciousness arena
 * Each agent has: position (in concept-space), energy, resonance frequency, influence radius
 */
class ArenaAgent {
  constructor({ id, position = [0, 0, 0], energy = 1.0, resonanceFreq = 0.5,
               influenceRadius = 1.0, coherence = 0.5, type = 'generic' } = {}) {
    this.id = id;
    this.position = position;          // [x, y, z] in concept-space
    this.energy = energy;              // 0-1, depletes with time, restored by resonance
    this.resonanceFreq = resonanceFreq; // frequency at which agent "vibrates"
    this.influenceRadius = influenceRadius;
    this.coherence = coherence;         // alignment with global field (0-1)
    this.type = type;                  // 'perception' | 'action' | 'memory' | 'attention' | 'generic'
    this.state = 'idle';               // 'idle' | 'competing' | 'cooperating' | 'integrated'
    this.lastFieldStrength = 0;
  }

  /**
   * Compute Euclidean distance to another agent
   */
  distanceTo(other) {
    const dx = this.position[0] - other.position[0];
    const dy = this.position[1] - other.position[1];
    const dz = this.position[2] - other.position[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  /**
   * Coherence adjustment based on local interactions
   */
  adjustCoherence(neighbors) {
    if (neighbors.length === 0) return;
    // Align toward weighted average of neighbor coherences
    let sumC = 0, sumW = 0;
    for (const n of neighbors) {
      const dist = this.distanceTo(n);
      if (dist < this.influenceRadius) {
        const w = 1 / (1 + dist);
        sumC += n.coherence * w;
        sumW += w;
      }
    }
    if (sumW > 0) {
      const avgCoherence = sumC / sumW;
      // Partial alignment (adaptive)
      this.coherence = this.coherence * 0.7 + avgCoherence * 0.3;
    }
    // Energy cost of maintaining coherence
    this.energy = Math.max(0, this.energy - 0.01 * (1 - this.coherence));
  }
}

// ─── Field Coherence ─────────────────────────────────────────────────────────
/**
 * The global "field" that emerges from agent interactions
 * This is not a physical field but an information-theoretic construct representing
 * the degree to which the system exhibits unified coherent behavior
 */
class FieldCoherence {
  constructor() {
    this.strength = 0;        // 0-1 field strength
    this.phase = 0;          // field phase (for resonance effects)
    this.integrated = [];    // IDs of agents currently "integrated" into field
    this.attention = null;   // current focus of integrated attention
    this.history = [];       // [{t, strength, integrated_count}]
  }

  /**
   * Compute field strength from agent states (mean-field approximation)
   */
  compute(agents) {
    if (agents.length === 0) return 0;
    
    // Three components of field strength:
    // 1. Mean coherence: average agent coherence
    const meanC = agents.reduce((s, a) => s + a.coherence, 0) / agents.length;
    
    // 2. Alignment: standard deviation of coherences (lower = more aligned)
    const variance = agents.reduce((s, a) => s + Math.pow(a.coherence - meanC, 2), 0) / agents.length;
    const alignment = 1 - Math.sqrt(variance); // 0-1, high when agents are aligned
    
    // 3. Participation: fraction of agents with energy above threshold
    const participation = agents.filter(a => a.energy > 0.3).length / agents.length;
    
    // Combined field strength
    this.strength = meanC * 0.5 + alignment * 0.3 + participation * 0.2;
    this.integrated = agents.filter(a => a.coherence > 0.6 && a.energy > 0.3).map(a => a.id);
    
    this.history.push({ t: Date.now(), strength: this.strength, integrated_count: this.integrated.length });
    if (this.history.length > 200) this.history.shift();
    
    return this.strength;
  }

  /**
   * Phase alignment — agents whose resonanceFreq is close to field phase get boosted
   */
  resonanceBoost(agents) {
    for (const agent of agents) {
      const freqDiff = Math.abs(agent.resonanceFreq - this.phase);
      if (freqDiff < 0.1) {
        // Resonance bonus
        agent.energy = Math.min(1, agent.energy + 0.05 * (1 - freqDiff));
        agent.coherence = Math.min(1, agent.coherence + 0.02);
      }
    }
  }
}

// ─── Attractor Detector ─────────────────────────────────────────────────────
/**
 * Detects when the arena enters a "consciousness-like" attractor state
 * Based on the CEN paper's claim that consciousness = emergent attractor
 */
class AttractorDetector {
  constructor({ strengthThreshold = 0.65, integrationThreshold = 0.4, 
               stabilityWindow = 5, coherenceVarianceThreshold = 0.05 } = {}) {
    this.strengthThreshold = strengthThreshold;       // field must be strong enough
    this.integrationThreshold = integrationThreshold;  // enough agents must be integrated
    this.stabilityWindow = stabilityWindow;           // consecutive ticks to confirm
    this.coherenceVarianceThreshold = coherenceVarianceThreshold;
    this.strengthHistory = [];                        // ring buffer of recent field strengths
    this.stateHistory = [];                            // [{t, inAttractor}]
    this.currentState = 'dispersed';                  // 'dispersed' | 'forming' | 'attractor' | 'dissolving'
    this.tickCount = 0;
  }

  /**
   * Update detector with current arena state
   */
  update(fieldStrength, integratedCount, totalAgents, agentCoherences) {
    this.tickCount++;
    
    // Check for attractor conditions
    const strengthOk = fieldStrength >= this.strengthThreshold;
    const integrationOk = totalAgents > 0 && (integratedCount / totalAgents) >= this.integrationThreshold;
    
    // Stability check: field strength should be consistent over recent window
    this.strengthHistory.push(fieldStrength);
    if (this.strengthHistory.length > this.stabilityWindow) this.strengthHistory.shift();
    
    const recentVariance = this._variance(this.strengthHistory);
    const stable = recentVariance < this.coherenceVarianceThreshold;
    
    // State machine
    let inAttractor = false;
    if (strengthOk && integrationOk && stable) {
      if (this.currentState === 'attractor') {
        inAttractor = true;
      } else {
        this.currentState = 'forming';
      }
    } else if (this.currentState === 'forming' || this.currentState === 'attractor') {
      this.currentState = 'dissolving';
    } else {
      this.currentState = 'dispersed';
    }
    
    if (this.currentState === 'dissolving' && !strengthOk) {
      this.currentState = 'dispersed';
    }
    
    // Only mark as attractor after stability window confirmed
    if (this.currentState === 'forming' && this.strengthHistory.length >= this.stabilityWindow && stable) {
      this.currentState = 'attractor';
      inAttractor = true;
    }
    
    this.stateHistory.push({ t: Date.now(), inAttractor, fieldStrength, integratedCount });
    if (this.stateHistory.length > 500) this.stateHistory.shift();
    
    return {
      inAttractor,
      state: this.currentState,
      fieldStrength,
      integratedFraction: totalAgents > 0 ? integratedCount / totalAgents : 0,
      stability: 1 - Math.min(1, recentVariance * 10),
    };
  }

  _variance(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
    return arr.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / arr.length;
  }

  /**
   * Get consciousness "events" — periods where attractor was detected
   */
  getConsciousnessEvents() {
    const events = [];
    let start = null;
    for (const entry of this.stateHistory) {
      if (entry.inAttractor && !start) {
        start = entry.t;
      } else if (!entry.inAttractor && start) {
        events.push({ start, end: entry.t, duration: entry.t - start });
        start = null;
      }
    }
    return events;
  }
}

// ─── Arena Consciousness ─────────────────────────────────────────────────────
class ArenaConsciousness {
  constructor({ arenaRadius = 10, fieldDecayRate = 0.005 } = {}) {
    this.agents = new Map();    // id → ArenaAgent
    this.field = new FieldCoherence();
    this.detector = new AttractorDetector();
    this.arenaRadius = arenaRadius;
    this.fieldDecayRate = fieldDecayRate;
    this.tick = 0;
    this.events = [];           // consciousness events log
  }

  /**
   * Add an agent to the arena
   */
  addAgent(agentSpec) {
    const id = agentSpec.id || `agent-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const agent = new ArenaAgent({ ...agentSpec, id });
    this.agents.set(id, agent);
    return id;
  }

  /**
   * Remove an agent from the arena
   */
  removeAgent(id) {
    this.agents.delete(id);
  }

  /**
   * Run one simulation tick — competitive-cooperative dynamics
   * 
   * Step 1: Competitive phase — agents compete for limited "attention bandwidth"
   * Step 2: Cooperative phase — winners align with neighbors
   * Step 3: Field emerges — mean-field coherence computed
   * Step 4: Attractor check — is system in consciousness-like state?
   */
  tickSimulation({ competitiveWeight = 0.3, cooperativeWeight = 0.7 } = {}) {
    this.tick++;
    const agents = Array.from(this.agents.values());
    if (agents.length === 0) return { fieldStrength: 0, inAttractor: false };

    // Step 1: Competitive phase — agents with similar resonance compete
    // Higher energy agents can "push" lower energy agents' positions
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i], b = agents[j];
        const dist = a.distanceTo(b);
        if (dist < 2 && Math.abs(a.resonanceFreq - b.resonanceFreq) < 0.2) {
          // Competition: higher energy agent displaces lower energy
          if (a.energy > b.energy) {
            const push = 0.1 * (a.energy - b.energy);
            for (let k = 0; k < 3; k++) {
              a.position[k] += push * (a.position[k] - b.position[k]);
              b.position[k] -= push * (a.position[k] - b.position[k]);
            }
          }
        }
      }
    }

    // Step 2: Cooperative phase — coherence alignment
    for (const agent of agents) {
      const neighbors = agents.filter(a => a.id !== agent.id && agent.distanceTo(a) < agent.influenceRadius);
      agent.adjustCoherence(neighbors);
    }

    // Step 3: Field emerges
    const fieldStrength = this.field.compute(agents);
    const integrated = this.field.integrated;
    
    // Field resonance boost
    this.field.resonanceBoost(agents);

    // Update field phase (slow drift)
    this.field.phase = (this.field.phase + 0.01) % (2 * Math.PI);

    // Step 4: Attractor detection
    const attractorState = this.detector.update(
      fieldStrength, integrated.length, agents.length,
      agents.map(a => a.coherence)
    );

    if (attractorState.inAttractor) {
      this.events.push({
        tick: this.tick,
        t: Date.now(),
        fieldStrength,
        integratedCount: integrated.length,
      });
    }

    // Energy recovery for integrated agents
    for (const id of integrated) {
      const agent = this.agents.get(id);
      if (agent) agent.energy = Math.min(1, agent.energy + 0.02);
    }

    return {
      tick: this.tick,
      fieldStrength,
      inAttractor: attractorState.inAttractor,
      state: attractorState.state,
      integratedCount: integrated.length,
      totalAgents: agents.length,
      stability: attractorState.stability,
    };
  }

  /**
   * Run a burst of ticks until attractor detected or maxTicks reached
   */
  runUntilAttractor({ maxTicks = 100, onTick = null } = {}) {
    for (let i = 0; i < maxTicks; i++) {
      const result = this.tickSimulation();
      if (onTick) onTick(result);
      if (result.inAttractor) return { reached: true, ticks: i + 1, result };
    }
    return { reached: false, ticks: maxTicks, result: null };
  }

  /**
   * Get consciousness events
   */
  getConsciousnessEvents() {
    return this.detector.getConsciousnessEvents();
  }

  /**
   * Get arena statistics
   */
  stats() {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      meanEnergy: agents.length > 0 ? agents.reduce((s, a) => s + a.energy, 0) / agents.length : 0,
      meanCoherence: agents.length > 0 ? agents.reduce((s, a) => s + a.coherence, 0) / agents.length : 0,
      fieldStrength: this.field.strength,
      currentState: this.detector.currentState,
      consciousnessEvents: this.events.length,
      eventHistory: this.events.slice(-10),
    };
  }
}

// ─── Demo ────────────────────────────────────────────────────────────────────
function demo() {
  console.log('=== Arena Consciousness Demo ===\n');
  console.log('Theory: Consciousness = emergent attractor from multi-agent competitive-cooperative dynamics');
  console.log('Source: Consciousness papers (2605.04128 + others) in daima/consciousness/\n');

  const arena = new ArenaConsciousness({ arenaRadius: 10 });

  // Add agents with different types (like different brain regions)
  const types = ['perception', 'action', 'memory', 'attention', 'generic'];
  for (let i = 0; i < 8; i++) {
    arena.addAgent({
      id: `agent-${i}`,
      position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
      energy: 0.5 + Math.random() * 0.5,
      resonanceFreq: 0.3 + Math.random() * 0.4,
      influenceRadius: 3 + Math.random() * 2,
      coherence: 0.3 + Math.random() * 0.4,
      type: types[i % types.length],
    });
  }

  console.log(`Arena initialized with ${arena.agents.size} agents\n`);

  // Run simulation until attractor detected (or max 60 ticks)
  console.log('Running arena simulation...');
  const result = arena.runUntilAttractor({ maxTicks: 60, onTick: (r) => {
    if (r.tick % 10 === 0) {
      process.stdout.write(`  tick ${r.tick}: field=${r.fieldStrength.toFixed(3)} state=${r.state} integrated=${r.integratedCount}/${r.totalAgents}\n`);
    }
  }});

  console.log(`\n${result.reached ? '✅ Attractor reached!' : '⚠️ Attractor not reached within 60 ticks'}`);
  if (result.result) {
    console.log(`  Final: field=${result.result.fieldStrength.toFixed(3)}, state=${result.result.state}`);
  }

  // Show consciousness events
  const events = arena.getConsciousnessEvents();
  console.log(`\nConsciousness events: ${events.length}`);
  if (events.length > 0) {
    console.log('Recent events:');
    events.slice(-3).forEach(e => {
      console.log(`  ${new Date(e.start).toISOString()} → ${new Date(e.end).toISOString()} (${e.duration}ms)`);
    });
  }

  // Stats
  console.log('\nArena stats:');
  const stats = arena.stats();
  console.log(`  Mean energy: ${stats.meanEnergy.toFixed(3)}`);
  console.log(`  Mean coherence: ${stats.meanCoherence.toFixed(3)}`);
  console.log(`  Field strength: ${stats.fieldStrength.toFixed(3)}`);
  console.log(`  Current state: ${stats.currentState}`);

  console.log('\n✅ Arena Consciousness demo complete');
  console.log('\nKey insight: Single agents follow simple rules, yet coherent consciousness-like');
  console.log('patterns emerge at the system level — just as murmurations emerge from individual birds.');
}

if (require.main === module) {
  demo();
}

module.exports = { ArenaConsciousness, ArenaAgent, FieldCoherence, AttractorDetector };
