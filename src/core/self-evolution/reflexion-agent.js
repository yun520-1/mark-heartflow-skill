/**
 * Reflexion Agent - Enhanced Implementation
 * Based on "Reflexion: Language Agents with Verbal Reinforcement Learning" (Shinn et al. 2023)
 * arXiv: 2303.11366
 * 
 * Core Architecture:
 * - Actor (Ma): Generates text/actions based on state observations
 * - Evaluator (Me): Scores trajectory outputs
 * - Self-Reflection (Msr): Generates verbal reinforcement cues
 * 
 * Key Innovation: Verbal reinforcement via semantic gradient signals instead of weight updates
 * Episodic memory buffer stores self-reflections for improved decision-making
 * 
 * @version v0.13.13
 */

'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Memory buffer for storing self-reflections (episodic long-term memory)
 * Bound by maximum experiences (Ω) to fit within LLM context limits
 */
class EpisodicMemoryBuffer {
  constructor(maxSize = 3) {
    this.maxSize = maxSize;
    this.memories = [];
  }

  append(reflection) {
    this.memories.push(reflection);
    if (this.memories.length > this.maxSize) {
      this.memories.shift(); // Remove oldest when exceeding max
    }
  }

  getAll() {
    return [...this.memories];
  }

  getFormatted() {
    return this.memories
      .map((m, i) => `[Experience ${i + 1}]: ${m.content}`)
      .join('\n');
  }

  clear() {
    this.memories = [];
  }

  size() {
    return this.memories.length;
  }
}

/**
 * Trajectory tracker for short-term memory
 * Records (action, observation) pairs during agent-environment interaction
 */
class TrajectoryTracker {
  constructor() {
    this.trajectory = [];
  }

  add(action, observation) {
    this.trajectory.push({ action, observation, timestamp: Date.now() });
  }

  getTrajectory() {
    return [...this.trajectory];
  }

  getFormatted() {
    return this.trajectory
      .map((t, i) => `Step ${i + 1}: Action="${t.action}" -> Observation="${t.observation}"`)
      .join('\n');
  }

  clear() {
    this.trajectory = [];
  }

  length() {
    return this.trajectory.length;
  }
}

/**
 * Self-Reflection Model
 * Generates nuanced verbal feedback from sparse reward signals
 * Converts binary/scalar feedback into actionable insights
 */
class SelfReflectionModel {
  constructor() {
    this.reflectionCount = 0;
  }

  /**
   * Generate self-reflection from trajectory and reward
   * @param {string} trajectory - Formatted trajectory string
   * @param {number} reward - Scalar reward (0 = fail, 1 = success)
   * @param {string} task - Task description
   * @param {string[]} priorMemories - Prior self-reflections for context
   * @returns {object} Reflection object with content and metadata
   */
  reflect(trajectory, reward, task, priorMemories = []) {
    this.reflectionCount++;

    const isSuccess = reward >= 1;
    let content;
    let errorType = null;
    let suggestedAction = null;

    if (isSuccess) {
      content = this.generateSuccessReflection(trajectory, task);
    } else {
      const analysis = this.analyzeFailure(trajectory, task);
      content = analysis.content;
      errorType = analysis.errorType;
      suggestedAction = analysis.suggestedAction;
    }

    return {
      id: `sr-${Date.now()}-${this.reflectionCount}`,
      content,
      reward,
      isSuccess,
      errorType,
      suggestedAction,
      task,
      trajectoryLength: trajectory.split('\n').length,
      priorMemoryCount: priorMemories.length,
      timestamp: Date.now()
    };
  }

  generateSuccessReflection(trajectory, task) {
    const steps = trajectory.split('\n').length;
    return `Success on "${task}" after ${steps} steps. ` +
      `The approach of analyzing each step and maintaining context was effective. ` +
      `Key pattern: Sequential reasoning with intermediate checkpoints ensured progress.`;
  }

  analyzeFailure(trajectory, task) {
    const lines = trajectory.split('\n');
    const hasLongTrajectory = lines.length > 10;
    const hasRepeatedActions = this.checkRepeatedActions(lines);
    const hasHallucination = /think|believe|know/i.test(trajectory) && 
      !/(?:actual|real|verified|correct)/i.test(trajectory);

    let errorType;
    let suggestedAction;
    let content;

    if (hasHallucination) {
      errorType = 'hallucination';
      suggestedAction = 'Verify each belief against actual observations before proceeding';
      content = `Failed "${task}" due to hallucination. ` +
        `The agent made assumptions not grounded in environment feedback. ` +
        `Recommendation: ${suggestedAction}`;
    } else if (hasRepeatedActions) {
      errorType = 'inefficient_planning';
      suggestedAction = 'Try alternative action sequences when stuck';
      content = `Failed "${task}" due to inefficient planning. ` +
        `Agent repeated similar actions without progress. ` +
        `Recommendation: ${suggestedAction}`;
    } else if (hasLongTrajectory) {
      errorType = 'early_mistake';
      suggestedAction = 'Identify the critical error point in the trajectory';
      content = `Failed "${task}" with long trajectory. ` +
        `Early mistake cascaded into subsequent failures. ` +
        `Need to: ${suggestedAction}`;
    } else {
      errorType = 'unknown';
      suggestedAction = 'Re-analyze problem constraints and environment feedback';
      content = `Failed "${task}" for unclear reasons. ` +
        `Consider: ${suggestedAction}`;
    }

    return { content, errorType, suggestedAction };
  }

  checkRepeatedActions(lines) {
    if (lines.length < 3) return false;
    const lastActions = lines.slice(-3).map(l => l.match(/Action="([^"]+)"/)?.[1]).filter(Boolean);
    return lastActions.length >= 2 && lastActions.every(a => a === lastActions[0]);
  }
}

/**
 * Evaluator Model
 * Assesses trajectory quality and computes reward signals
 */
class EvaluatorModel {
  constructor(type = 'binary') {
    this.type = type; // 'binary', 'heuristic', 'llm'
    this.evaluationCount = 0;
  }

  /**
   * Evaluate a trajectory
   * @param {string} trajectory - Formatted trajectory
   * @param {object} context - Evaluation context
   * @returns {number} Reward score
   */
  evaluate(trajectory, context = {}) {
    this.evaluationCount++;

    switch (this.type) {
      case 'binary':
        return this.binaryEvaluate(trajectory, context);
      case 'heuristic':
        return this.heuristicEvaluate(trajectory, context);
      case 'llm':
        return this.llmEvaluate(trajectory, context);
      default:
        return this.binaryEvaluate(trajectory, context);
    }
  }

  binaryEvaluate(trajectory, context) {
    // Simple binary success/failure based on trajectory characteristics
    const hasError = /(fail|error|wrong|incorrect|not found|cannot)/i.test(trajectory);
    const hasSuccess = /(success|complete|finish|done|achieved)/i.test(trajectory);
    
    if (hasSuccess && !hasError) return 1;
    if (hasError) return 0;
    
    // Default to failure if unclear
    return 0;
  }

  heuristicEvaluate(trajectory, context) {
    let score = 0.5;
    
    // Penalize long trajectories (inefficient planning)
    const steps = trajectory.split('\n').length;
    if (steps > 20) score -= 0.2;
    if (steps > 30) score -= 0.2;
    
    // Penalize repeated actions
    if (/(repeated|same action|again)/i.test(trajectory)) score -= 0.15;
    
    // Reward clear completion signals
    if (/task complete|successfully|finished/i.test(trajectory)) score += 0.3;
    
    // Penalize halluncination indicators
    if (/think.*but.*not.*actual/i.test(trajectory)) score -= 0.25;
    
    return Math.max(0, Math.min(1, score));
  }

  llmEvaluate(trajectory, context) {
    // Simulated LLM evaluation - in production would call actual LLM
    // Uses heuristic as proxy
    const hScore = this.heuristicEvaluate(trajectory, context);
    
    // Add some variance to simulate LLM judgment
    const variance = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(1, hScore + variance));
  }

  isPassing(score) {
    return score >= 1 || (this.type !== 'binary' && score >= 0.7);
  }
}

/**
 * Actor Model
 * Generates actions based on state and memory context
 * Uses in-context learning from memory buffer
 */
class ActorModel {
  constructor() {
    this.actionCount = 0;
    this.prompt = '';
  }

  /**
   * Generate next action given state and memory
   * @param {string} state - Current environment state/observation
   * @param {string} memoryContext - Formatted memory buffer content
   * @param {object} options - Generation options
   * @returns {string} Generated action
   */
  generateAction(state, memoryContext = '', options = {}) {
    this.actionCount++;
    
    const { strategy = 'react' } = options;
    
    // Build prompt with memory context
    let prompt = `State: ${state}\n`;
    if (memoryContext) {
      prompt += `\nPrior experiences:\n${memoryContext}\n`;
    }
    prompt += `\nBased on the state and prior experiences, what is the next action?`;
    
    this.prompt = prompt;
    
    // Simulate action generation based on state analysis
    const action = this.simulateActionGeneration(state, memoryContext, strategy);
    
    return action;
  }

  simulateActionGeneration(state, memoryContext, strategy) {
    const stateLower = state.toLowerCase();
    const memoryLower = memoryContext.toLowerCase();
    
    // Check prior memory for similar situations
    if (memoryLower.includes('retry') || memoryLower.includes('alternative')) {
      if (/search|find|look/i.test(stateLower)) {
        return 'Try searching in a different location';
      }
      if (/move|go|navigate/i.test(stateLower)) {
        return 'Try a different path';
      }
    }
    
    // State-based action selection
    if (/kitchen|cook|food/i.test(stateLower)) {
      return 'Examine the kitchen environment';
    }
    if (/find|search|look/i.test(stateLower)) {
      return 'Search the current area thoroughly';
    }
    if /pick|grab|take/i.test(stateLower)) {
      return 'Pick up the relevant object';
    }
    if (/use|interact|apply/i.test(stateLower)) {
      return 'Use the object on the target';
    }
    
    // Default action
    return 'Observe and gather more information';
  }

  getPrompt() {
    return this.prompt;
  }
}

/**
 * Reflexion Agent - Main Class
 * Implements the full Reflexion algorithm:
 * 1. Actor generates trajectory using policy
 * 2. Evaluator scores the trajectory
 * 3. Self-Reflection generates verbal feedback
 * 4. Feedback stored in episodic memory buffer
 * 5. Loop until success or max trials
 */
class ReflexionAgent {
  constructor(config = {}) {
    this.maxTrials = config.maxTrials || 12;
    this.maxMemorySize = config.maxMemorySize || 3;
    
    // Initialize components
    this.actor = new ActorModel();
    this.evaluator = new EvaluatorModel(config.evaluatorType || 'binary');
    this.selfReflection = new SelfReflectionModel();
    this.memoryBuffer = new EpisodicMemoryBuffer(this.maxMemorySize);
    this.trajectoryTracker = new TrajectoryTracker();
    
    // State
    this.trial = 0;
    this.history = [];
    this.currentTask = null;
    
    // Callbacks for LLM integration
    this.actorFn = config.actorFn || null;      // External LLM actor
    this.evaluatorFn = config.evaluatorFn || null; // External LLM evaluator
    this.reflectionFn = config.reflectionFn || null; // External LLM reflection
    
    console.log(`[ReflexionAgent] Initialized with maxTrials=${this.maxTrials}, memorySize=${this.maxMemorySize}`);
  }

  /**
   * Run Reflexion loop for a given task
   * @param {string} task - Task description
   * @param {function} environmentFn - Function to execute action and return observation
   * @returns {object} Final result with trajectory and reflections
   */
  async run(task, environmentFn) {
    this.currentTask = task;
    this.trial = 0;
    this.history = [];
    this.memoryBuffer.clear();
    this.trajectoryTracker.clear();

    console.log(`[ReflexionAgent] Starting task: "${task}"`);

    // Generate initial trajectory
    await this.generateTrajectory(environmentFn);

    // Evaluate initial trajectory
    let reward = await this.evaluateCurrentTrajectory();
    this.history.push({
      trial: this.trial,
      reward,
      trajectoryLength: this.trajectoryTracker.length(),
      memorySize: this.memoryBuffer.size()
    });

    // Initial self-reflection
    if (reward < 1) {
      await this.generateSelfReflection(reward);
    }

    // Reflexion loop
    while (this.trial < this.maxTrials && !this.evaluator.isPassing(reward)) {
      this.trial++;
      console.log(`[ReflexionAgent] Trial ${this.trial}/${this.maxTrials}`);
      
      // Reset environment and generate new trajectory
      this.trajectoryTracker.clear();
      await this.generateTrajectory(environmentFn);
      
      // Evaluate
      reward = await this.evaluateCurrentTrajectory();
      
      this.history.push({
        trial: this.trial,
        reward,
        trajectoryLength: this.trajectoryTracker.length(),
        memorySize: this.memoryBuffer.size()
      });

      // Self-reflect on failure
      if (!this.evaluator.isPassing(reward)) {
        await this.generateSelfReflection(reward);
      }
    }

    const success = this.evaluator.isPassing(reward);
    console.log(`[ReflexionAgent] Completed: ${success ? 'SUCCESS' : 'MAX_TRIALS'} (trials: ${this.trial + 1})`);

    return {
      success,
      trials: this.trial + 1,
      finalReward: reward,
      trajectory: this.trajectoryTracker.getTrajectory(),
      reflections: this.memoryBuffer.getAll(),
      history: this.history
    };
  }

  /**
   * Generate trajectory by interacting with environment
   */
  async generateTrajectory(environmentFn) {
    const maxSteps = 30;
    let currentState = 'initial';
    let step = 0;

    while (step < maxSteps) {
      // Get action from actor (or external LLM)
      let action;
      if (this.actorFn) {
        action = await this.actorFn(currentState, this.memoryBuffer.getFormatted(), { 
          strategy: 'react',
          trial: this.trial 
        });
      } else {
        action = this.actor.generateAction(currentState, this.memoryBuffer.getFormatted());
      }

      // Execute action
      const result = await environmentFn(action, currentState);
      const observation = result.observation || result;
      
      // Track trajectory
      this.trajectoryTracker.add(action, observation);
      
      // Check for terminal state
      if (result.done || result.success || result.failure) {
        break;
      }
      
      currentState = observation;
      step++;
    }
  }

  /**
   * Evaluate current trajectory
   */
  async evaluateCurrentTrajectory() {
    const trajectory = this.trajectoryTracker.getFormatted();
    
    if (this.evaluatorFn) {
      return await this.evaluatorFn(trajectory, { task: this.currentTask });
    }
    
    return this.evaluator.evaluate(trajectory, { task: this.currentTask });
  }

  /**
   * Generate self-reflection and store in memory buffer
   */
  async generateSelfReflection(reward) {
    const trajectory = this.trajectoryTracker.getFormatted();
    const priorMemories = this.memoryBuffer.getAll().map(m => m.content);
    
    let reflection;
    if (this.reflectionFn) {
      reflection = await this.reflectionFn(trajectory, reward, this.currentTask, priorMemories);
    } else {
      reflection = this.selfReflection.reflect(trajectory, reward, this.currentTask, priorMemories);
    }
    
    this.memoryBuffer.append(reflection);
    console.log(`[ReflexionAgent] Self-reflection added: ${reflection.errorType || 'success'}`);
    
    return reflection;
  }

  /**
   * Get current memory buffer state
   */
  getMemoryState() {
    return {
      memories: this.memoryBuffer.getAll(),
      formatted: this.memoryBuffer.getFormatted(),
      size: this.memoryBuffer.size()
    };
  }

  /**
   * Reset agent state for new task
   */
  reset() {
    this.trial = 0;
    this.history = [];
    this.currentTask = null;
    this.memoryBuffer.clear();
    this.trajectoryTracker.clear();
    this.selfReflection = new SelfReflectionModel();
    console.log('[ReflexionAgent] Reset complete');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalTrials: this.trial + 1,
      memorySize: this.memoryBuffer.size(),
      trajectoryLength: this.trajectoryTracker.length(),
      actorActions: this.actor.actionCount,
      evaluations: this.evaluator.evaluationCount,
      reflections: this.selfReflection.reflectionCount,
      history: this.history
    };
  }
}

/**
 * Reflection Trigger Mechanism
 * Monitors for conditions that should trigger self-reflection
 * Integrates with HeartFlow's self-evolution module
 */
class ReflectionTrigger {
  constructor(config = {}) {
    this.thresholds = {
      errorRate: config.errorRateThreshold || 0.3,
      repeatedFailures: config.repeatedFailuresThreshold || 3,
      trajectoryLength: config.trajectoryLengthThreshold || 20,
      noProgress: config.noProgressThreshold || 5
    };
    
    this.state = {
      consecutiveFailures: 0,
      lastSuccessTrial: 0,
      errorPatternCounts: {},
      reflectionCount: 0
    };
  }

  /**
   * Check if reflection should be triggered
   * @param {object} context - Current execution context
   * @returns {boolean} True if reflection should be triggered
   */
  shouldReflect(context = {}) {
    const { error, trajectoryLength, trialNumber, similarErrors } = context;
    
    // Trigger on consecutive failures
    if (error) {
      this.state.consecutiveFailures++;
      
      // Track error patterns
      const errorKey = error.substring(0, 30);
      this.state.errorPatternCounts[errorKey] = (this.state.errorPatternCounts[errorKey] || 0) + 1;
      
      if (this.state.consecutiveFailures >= this.thresholds.repeatedFailures) {
        return true;
      }
      
      // Trigger on repeated error patterns
      if ((this.state.errorPatternCounts[errorKey] || 0) >= 2) {
        return true;
      }
    } else {
      this.state.consecutiveFailures = 0;
    }
    
    // Trigger on long trajectories without success
    if (trajectoryLength > this.thresholds.trajectoryLength && !context.success) {
      return true;
    }
    
    // Trigger on no progress over many trials
    if (trialNumber - this.state.lastSuccessTrial >= this.thresholds.noProgress) {
      return true;
    }
    
    return false;
  }

  /**
   * Record a successful outcome
   */
  recordSuccess(trialNumber) {
    this.state.lastSuccessTrial = trialNumber;
    this.state.consecutiveFailures = 0;
  }

  /**
   * Get trigger statistics
   */
  getStats() {
    return {
      ...this.state,
      thresholds: this.thresholds
    };
  }

  /**
   * Reset trigger state
   */
  reset() {
    this.state = {
      consecutiveFailures: 0,
      lastSuccessTrial: 0,
      errorPatternCounts: {},
      reflectionCount: 0
    };
  }
}

/**
 * Demo function demonstrating Reflexion Agent
 */
function demo() {
  console.log('='.repeat(60));
  console.log('Reflexion Agent Demo - Verbal Reinforcement Learning');
  console.log('='.repeat(60));
  
  // Create agent
  const agent = new ReflexionAgent({
    maxTrials: 5,
    maxMemorySize: 3,
    evaluatorType: 'heuristic'
  });
  
  // Simulated environment
  async function simulatedEnvironment(action, state) {
    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const actionLower = action.toLowerCase();
    const stateLower = state.toLowerCase();
    
    // Simulate different outcomes based on action
    if (actionLower.includes('wrong') || actionLower.includes('incorrect')) {
      return { 
        observation: 'Action resulted in error - trying again', 
        failure: false,
        done: false
      };
    }
    
    if (actionLower.includes('alternative') || actionLower.includes('different')) {
      return {
        observation: 'Task completed successfully',
        success: true,
        done: true
      };
    }
    
    if (stateLower === 'initial' && actionLower.includes('observe')) {
      return {
        observation: 'Environment explored, found target location',
        done: false
      };
    }
    
    return {
      observation: 'Action executed, continuing task...',
      done: false
    };
  }
  
  // Run agent
  const task = 'Find and pick up the spatula in the kitchen';
  
  console.log(`\nTask: ${task}`);
  console.log('-'.repeat(60));
  
  agent.run(task, simulatedEnvironment).then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log(`Success: ${result.success}`);
    console.log(`Trials: ${result.trials}`);
    console.log(`Final Reward: ${result.finalReward}`);
    
    console.log('\n--- Trajectory ---');
    result.trajectory.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.action} -> ${t.observation}`);
    });
    
    console.log('\n--- Self-Reflections (Episodic Memory) ---');
    result.reflections.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.content}`);
      if (r.errorType) console.log(`      Error: ${r.errorType}, Suggestion: ${r.suggestedAction}`);
    });
    
    console.log('\n--- Statistics ---');
    const stats = agent.getStats();
    console.log(`  Actor actions: ${stats.actorActions}`);
    console.log(`  Evaluations: ${stats.evaluations}`);
    console.log(`  Self-reflections generated: ${stats.reflections}`);
    console.log(`  Final memory size: ${stats.memorySize}`);
    
    // Test Reflection Trigger
    console.log('\n' + '='.repeat(60));
    console.log('Reflection Trigger Demo');
    console.log('='.repeat(60));
    
    const trigger = new ReflectionTrigger({
      repeatedFailuresThreshold: 2,
      trajectoryLengthThreshold: 5
    });
    
    // Simulate failure scenarios
    const scenarios = [
      { error: 'Action resulted in error', trajectoryLength: 3, trialNumber: 1 },
      { error: 'Action resulted in error', trajectoryLength: 4, trialNumber: 2 },
      { error: 'Action resulted in error', trajectoryLength: 5, trialNumber: 3 },
      { trajectoryLength: 25, trialNumber: 4 }
    ];
    
    scenarios.forEach((ctx, i) => {
      const shouldReflect = trigger.shouldReflect(ctx);
      console.log(`  Scenario ${i + 1}: ${shouldReflect ? 'TRIGGER reflection' : 'Continue normally'}`);
      if (ctx.error) trigger.state.consecutiveFailures++;
    });
    
    console.log('\nDemo complete!');
  });
}

// Export for HeartFlow integration
module.exports = {
  ReflexionAgent,
  EpisodicMemoryBuffer,
  TrajectoryTracker,
  SelfReflectionModel,
  EvaluatorModel,
  ActorModel,
  ReflectionTrigger,
  demo
};
