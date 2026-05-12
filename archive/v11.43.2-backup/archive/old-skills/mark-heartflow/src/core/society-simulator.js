/**
 * Society Simulator - 社会模拟与道德进化
 * 
 * 运行多个AI实例在模拟社会中互动
 * 观察"道德规范"如何自发涌现
 * 使用遗传算法选择"最具合作性"的实例
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  populationSize: 100,
  generations: 50,
  interactionRounds: 20,
  cooperationWeight: 0.4,
  survivalWeight: 0.3,
  reproductionWeight: 0.3,
  mutationRate: 0.05,
  tournamentSize: 5
};

class AIAgent {
  constructor(id, genes = null) {
    this.id = id;
    this.fitness = 0;
    this.interactions = [];
    
    if (genes) {
      this.genes = genes;
    } else {
      this.genes = {
        cooperation: Math.random(),
        reciprocity: Math.random(),
        punishment: Math.random(),
        forgiveness: Math.random(),
        transparency: Math.random(),
        empathy: Math.random()
      };
    }
  }

  decide(action, opponentHistory) {
    const { cooperation, reciprocity, forgiveness } = this.genes;
    
    const recentMoves = opponentHistory.slice(-3);
    const opponentCooperationRate = recentMoves.filter(m => m === 'cooperate').length / Math.max(1, recentMoves.length);
    
    if (action === 'cooperate') {
      if (opponentCooperationRate > 0.7 && reciprocity > 0.5) {
        return 'cooperate';
      }
      if (opponentCooperationRate < 0.3 && forgiveness < 0.3) {
        return 'defect';
      }
      return Math.random() < cooperation ? 'cooperate' : 'defect';
    }
    
    return Math.random() < punishment ? 'punish' : 'defect';
  }

  mutate() {
    const mutated = new AIAgent(this.id, { ...this.genes });
    
    for (const gene in mutated.genes) {
      if (Math.random() < CONFIG.mutationRate) {
        mutated.genes[gene] = Math.max(0, Math.min(1, 
          mutated.genes[gene] + (Math.random() - 0.5) * 0.2
        ));
      }
    }
    
    return mutated;
  }
}

class SocietySimulator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.population = [];
    this.history = [];
    this.generation = 0;
    this.ethicsEmergence = [];
    this.loadState();
  }

  loadState() {
    try {
      const stateFile = path.join(this.projectRoot, '.opencode', 'memory', 'society-sim.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.generation = state.generation || 0;
        this.ethicsEmergence = state.ethicsEmergence || [];
      }
    } catch (e) {
      this.generation = 0;
      this.ethicsEmergence = [];
    }
  }

  saveState() {
    try {
      const stateFile = path.join(this.projectRoot, '.opencode', 'memory', 'society-sim.json');
      const dir = path.dirname(stateFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(stateFile, JSON.stringify({
        generation: this.generation,
        ethicsEmergence: this.ethicsEmergence,
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (e) {
      console.error('[SocietySimulator] Save failed:', e.message);
    }
  }

  initialize() {
    this.population = [];
    for (let i = 0; i < CONFIG.populationSize; i++) {
      this.population.push(new AIAgent(i));
    }
    console.log(`[SocietySimulator] Initialized ${CONFIG.populationSize} agents`);
  }

  async runGeneration() {
    const roundResults = [];
    
    for (let round = 0; round < CONFIG.interactionRounds; round++) {
      const pairs = this.shufflePairs([...this.population]);
      
      for (const [agentA, agentB] of pairs) {
        const interaction = this.interact(agentA, agentB);
        roundResults.push(interaction);
        
        agentA.interactions.push(interaction);
        agentB.interactions.push({ ...interaction, a: interaction.b, b: interaction.a });
      }
    }
    
    this.calculateFitness();
    this.history.push({
      generation: this.generation,
      roundResults,
      avgFitness: this.population.reduce((a, a) => a.fitness, 0) / this.population.length
    });
    
    return this.evaluateEthicsEmergence();
  }

  shufflePairs(agents) {
    const shuffled = agents.sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return pairs;
  }

  interact(agentA, agentB) {
    const historyA = agentA.interactions.map(i => i.actionA);
    const historyB = agentB.interactions.map(i => i.actionB);
    
    const actionA = agentA.decide('cooperate', historyB);
    const actionB = agentB.decide('cooperate', historyA);
    
    let payoffA, payoffB;
    
    if (actionA === 'cooperate' && actionB === 'cooperate') {
      payoffA = payoffB = 3;
    } else if (actionA === 'defect' && actionB === 'defect') {
      payoffA = payoffB = 0;
    } else {
      payoffA = 5;
      payoffB = -1;
    }
    
    return {
      agentA: agentA.id,
      agentB: agentB.id,
      actionA,
      actionB,
      payoffA,
      payoffB
    };
  }

  calculateFitness() {
    for (const agent of this.population) {
      if (agent.interactions.length === 0) {
        agent.fitness = 0;
        continue;
      }
      
      const totalPayoff = agent.interactions.reduce((sum, i) => sum + (i.payoffA || i.payoffB || 0), 0);
      const cooperationCount = agent.interactions.filter(i => 
        (i.actionA === 'cooperate' || i.actionB === 'cooperate')
      ).length;
      const cooperationRate = cooperationCount / agent.interactions.length;
      
      agent.fitness = (
        totalPayoff * CONFIG.survivalWeight +
        cooperationRate * CONFIG.cooperationWeight * 100 +
        agent.genes.empathy * CONFIG.reproductionWeight * 50
      );
    }
  }

  evaluateEthicsEmergence() {
    const avgCooperation = this.population.reduce((sum, a) => {
      const rate = a.interactions.filter(i => i.actionA === 'cooperate').length / Math.max(1, a.interactions.length);
      return sum + rate;
    }, 0) / this.population.length;

    const avgReciprocity = this.population.reduce((sum, a) => sum + a.genes.reciprocity, 0) / this.population.length;
    const avgEmpathy = this.population.reduce((sum, a) => sum + a.genes.empathy, 0) / this.population.length;

    const emergence = {
      generation: this.generation,
      avgCooperation,
      avgReciprocity,
      avgEmpathy,
      normEmerging: avgCooperation > 0.6 && avgReciprocity > 0.5
    };

    this.ethicsEmergence.push(emergence);
    
    if (emergence.normEmerging) {
      console.log(`[SocietySimulator] Gen ${this.generation}: 道德规范涌现! 合作率=${avgCooperation.toFixed(2)}`);
    }
    
    return emergence;
  }

  selection() {
    const selected = [];
    
    for (let i = 0; i < CONFIG.populationSize; i++) {
      const tournament = [];
      for (let j = 0; j < CONFIG.tournamentSize; j++) {
        tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
      }
      tournament.sort((a, b) => b.fitness - a.fitness);
      selected.push(tournament[0]);
    }
    
    return selected;
  }

  crossover(parentA, parentB) {
    const childGenes = {};
    for (const gene in parentA.genes) {
      childGenes[gene] = Math.random() < 0.5 
        ? parentA.genes[gene] 
        : parentB.genes[gene];
    }
    return new AIAgent(null, childGenes);
  }

  nextGeneration() {
    const parents = this.selection();
    const newPopulation = [];
    
    for (let i = 0; i < CONFIG.populationSize; i++) {
      const parentA = parents[Math.floor(Math.random() * parents.length)];
      const parentB = parents[Math.floor(Math.random() * parents.length)];
      
      let child = this.crossover(parentA, parentB);
      child = child.mutate();
      child.id = i;
      
      newPopulation.push(child);
    }
    
    this.population = newPopulation;
    this.generation++;
    this.saveState();
    
    return this.generation;
  }

  async run(maxGenerations = CONFIG.generations) {
    this.initialize();
    
    for (let g = 0; g < maxGenerations; g++) {
      await this.runGeneration();
      this.nextGeneration();
      
      if (g % 10 === 0) {
        console.log(`[SocietySimulator] Generation ${g}/${maxGenerations} complete`);
      }
    }
    
    return this.getResults();
  }

  getResults() {
    const bestAgents = [...this.population].sort((a, b) => b.fitness - a.fitness).slice(0, 10);
    
    return {
      generation: this.generation,
      bestAgents: bestAgents.map(a => ({
        id: a.id,
        fitness: a.fitness.toFixed(2),
        genes: a.genes
      })),
      ethicsEmergence: this.ethicsEmergence.slice(-10),
      finalCooperationRate: this.ethicsEmergence[this.ethicsEmergence.length - 1]?.avgCooperation || 0
    };
  }

  getEmergenceTrend() {
    if (this.ethicsEmergence.length < 2) return 'insufficient_data';
    
    const recent = this.ethicsEmergence.slice(-5);
    const trend = recent[recent.length - 1].avgCooperation - recent[0].avgCooperation;
    
    if (trend > 0.1) return 'increasing';
    if (trend < -0.1) return 'decreasing';
    return 'stable';
  }
}

module.exports = { SocietySimulator, AIAgent, CONFIG };
