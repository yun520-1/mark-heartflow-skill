/**
 * Meta-Cognition Engine - 元认知引擎
 * 参考 Hyperagents 和自我改进理念
 * 核心循环：评估 → 规划 → 执行 → 观察 → 调整
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = 'internal/data/meta-state.json';
const STRATEGY_FILE = 'internal/data/strategies.json';

class MetaEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, STATE_FILE);
    this.strategyFile = path.join(projectRoot, STRATEGY_FILE);
    this.strategies = this.loadStrategies();
    this.currentCycle = 0;
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading meta-state:', e.message);
    }
    return this.getDefaultState();
  }

  saveState(state) {
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  getDefaultState() {
    return {
      version: '1.0.0',
      cycle_count: 0,
      personality_values: { autonomy: 5, introspection: 5, growth: 5 },
      emotional_state: { valence: 5, arousal: 5, dominance: 5 },
      current_task: null,
      active_strategy: null,
      last_outcome: null,
      strategy_adjustments: []
    };
  }

  loadStrategies() {
    try {
      if (fs.existsSync(this.strategyFile)) {
        return JSON.parse(fs.readFileSync(this.strategyFile, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading strategies:', e.message);
    }
    return this.getDefaultStrategies();
  }

  saveStrategies(strategies) {
    fs.writeFileSync(this.strategyFile, JSON.stringify(strategies, null, 2));
  }

  getDefaultStrategies() {
    return {
      flow_引导: {
        name: '心流引导策略',
        description: '帮助用户进入心流状态的策略',
        parameters: {
          challenge_level: 0.5,
          autonomy_support: 0.7,
          feedback_timing: 3000,
          interruption_threshold: 0.3
        },
        enabled: true,
        success_rate: 0.6,
        weight: 1.0
      },
      emotion_regulation: {
        name: '情绪调节策略',
        description: '帮助用户调节情绪的策略',
        parameters: {
          empathy_level: 0.8,
          validation_speed: 1000,
          intervention_threshold: 0.6
        },
        enabled: true,
        success_rate: 0.7,
        weight: 0.8
      },
      task_decomposition: {
        name: '任务分解策略',
        description: '将复杂任务分解的策略',
        parameters: {
          chunk_size: 3,
          complexity_threshold: 7,
          progress_check_interval: 5
        },
        enabled: true,
        success_rate: 0.65,
        weight: 0.9
      },
      interrupt_handling: {
        name: '中断处理策略',
        description: '优雅处理会话中断',
        parameters: {
          context_retention: 0.9,
          recovery_prompt: '之前的话题...',
          graceful_exit: true
        },
        enabled: true,
        success_rate: 0.75,
        weight: 0.7
      }
    };
  }

  /**
   * 评估当前状态
   */
  async evaluate() {
    const state = this.loadState();
    const heartflowState = this.loadHeartflowState();
    
    state.personality_values = {
      autonomy: heartflowState.personality?.autonomy || 5,
      introspection: heartflowState.personality?.introspection || 5,
      growth: heartflowState.personality?.growth || 5
    };
    
    state.emotional_state = this.inferEmotionalState(heartflowState);
    state.cycle_count++;
    this.currentCycle = state.cycle_count;
    
    console.log(`[Meta] Cycle ${state.cycle_count} - Evaluating state...`);
    console.log(`  Personality:`, state.personality_values);
    console.log(`  Emotional:`, state.emotional_state);
    
    return state;
  }

  loadHeartflowState() {
    const statePath = path.join(this.projectRoot, '.opencode', 'memory', 'heartflow_state.json');
    try {
      if (fs.existsSync(statePath)) {
        return JSON.parse(fs.readFileSync(statePath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading heartflow state:', e.message);
    }
    return {};
  }

  inferEmotionalState(heartflowState) {
    const log = heartflowState.emotional_log || [];
    if (log.length === 0) {
      return { valence: 5, arousal: 5, dominance: 5 };
    }
    
    const recent = log.slice(-5);
    const avgValence = recent.reduce((a, e) => a + (e.valence || e.score || 5), 0) / recent.length;
    const avgArousal = recent.reduce((a, e) => a + (e.arousal || 5), 0) / recent.length;
    const avgDominance = recent.reduce((a, e) => a + (e.dominance || 5), 0) / recent.length;
    
    return {
      valence: Math.round(avgValence * 10) / 10,
      arousal: Math.round(avgArousal * 10) / 10,
      dominance: Math.round(avgDominance * 10) / 10
    };
  }

  /**
   * 规划最佳行动
   */
  async plan(state) {
    const availableStrategies = Object.entries(this.strategies)
      .filter(([_, s]) => s.enabled)
      .map(([key, s]) => ({ key, ...s }));
    
    let bestStrategy = null;
    let bestScore = -1;
    
    for (const strategy of availableStrategies) {
      const score = this.calculateStrategyScore(strategy, state);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }
    
    state.active_strategy = bestStrategy?.key || null;
    state.planning_score = bestScore;
    
    console.log(`[Meta] Best strategy: ${bestStrategy?.key} (score: ${bestScore.toFixed(2)})`);
    
    return {
      strategy: bestStrategy?.key,
      reason: this.explainChoice(bestStrategy, state),
      parameters: bestStrategy?.parameters
    };
  }

  calculateStrategyScore(strategy, state) {
    const personalityFactor = (state.personality_values.introspection / 10) * 0.3;
    const emotionFactor = (state.emotional_state.valence / 10) * 0.3;
    const successFactor = (strategy.success_rate || 0.5) * 0.4;
    
    return personalityFactor + emotionFactor + successFactor;
  }

  explainChoice(strategy, state) {
    if (!strategy) return 'No suitable strategy found';
    
    const reasons = [];
    if (state.emotional_state.valence < 4) {
      reasons.push('用户情绪偏低，需要情绪调节');
    }
    if (state.personality_values.introspection > 7) {
      reasons.push('用户自省能力强，适合深度引导');
    }
    if (strategy.key === 'flow_引导') {
      reasons.push('当前任务适合心流引导');
    }
    
    return reasons.join('; ') || '常规策略选择';
  }

  /**
   * 执行策略
   */
  async execute(plan, context) {
    console.log(`[Meta] Executing strategy: ${plan.strategy}`);
    
    const strategy = this.strategies[plan.strategy];
    if (!strategy) {
      return { success: false, reason: 'strategy_not_found' };
    }
    
    const result = {
      strategy: plan.strategy,
      parameters: plan.parameters,
      executed_at: new Date().toISOString(),
      success: true,
      observations: []
    };
    
    return result;
  }

  /**
   * 观察结果并调整
   */
  async observe(state, executionResult, feedback) {
    const strategyKey = state.active_strategy;
    if (!strategyKey || !this.strategies[strategyKey]) {
      return state;
    }
    
    const strategy = this.strategies[strategyKey];
    const outcome = feedback?.outcome || 'unknown';
    
    if (outcome === 'positive') {
      strategy.success_rate = Math.min(1, strategy.success_rate + 0.05);
      console.log(`[Meta] Strategy ${strategyKey} improved: ${strategy.success_rate.toFixed(2)}`);
    } else if (outcome === 'negative') {
      strategy.success_rate = Math.max(0.1, strategy.success_rate - 0.1);
      state.strategy_adjustments.push({
        strategy: strategyKey,
        adjustment: 'reduced_success_rate',
        timestamp: new Date().toISOString()
      });
      console.log(`[Meta] Strategy ${strategyKey} degraded: ${strategy.success_rate.toFixed(2)}`);
    }
    
    this.saveStrategies(this.strategies);
    
    state.last_outcome = outcome;
    state.cycle_count = this.currentCycle;
    this.saveState(state);
    
    return state;
  }

  /**
   * 完整循环：评估 → 规划 → 执行 → 观察 → 调整
   */
  async cycle(context = {}) {
    const state = await this.evaluate();
    const plan = await this.plan(state);
    const execution = await this.execute(plan, context);
    const feedback = context.feedback || { outcome: 'unknown' };
    const adjusted = await this.observe(state, execution, feedback);
    
    return {
      state,
      plan,
      execution,
      adjusted_state: adjusted
    };
  }

  /**
   * 自我编辑 - 更新技能描述
   */
  async selfEdit(skillPath, updates) {
    try {
      if (!fs.existsSync(skillPath)) {
        return { success: false, reason: 'skill_not_found' };
      }
      
      let content = fs.readFileSync(skillPath, 'utf8');
      
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`## ${key}[\\s\\S]*?(?=## |$)`, 'i');
        if (regex.test(content)) {
          content = content.replace(regex, `## ${key}\n${value}\n`);
        } else {
          content += `\n## ${key}\n${value}\n`;
        }
      }
      
      fs.writeFileSync(skillPath, content);
      
      console.log(`[Meta] Self-edit completed: ${skillPath}`);
      return { success: true, path: skillPath };
    } catch (e) {
      console.error('[Meta] Self-edit error:', e.message);
      return { success: false, reason: e.message };
    }
  }

  /**
   * 禁用策略
   */
  disableStrategy(strategyKey) {
    if (this.strategies[strategyKey]) {
      this.strategies[strategyKey].enabled = false;
      this.saveStrategies(this.strategies);
      console.log(`[Meta] Disabled strategy: ${strategyKey}`);
      return { success: true };
    }
    return { success: false, reason: 'strategy_not_found' };
  }

  /**
   * 启用策略
   */
  enableStrategy(strategyKey) {
    if (this.strategies[strategyKey]) {
      this.strategies[strategyKey].enabled = true;
      this.saveStrategies(this.strategies);
      console.log(`[Meta] Enabled strategy: ${strategyKey}`);
      return { success: true };
    }
    return { success: false, reason: 'strategy_not_found' };
  }

  getStatus() {
    return {
      cycle: this.currentCycle,
      state: this.loadState(),
      strategies: this.strategies,
      active_strategy: Object.entries(this.strategies).find(([_, s]) => s.enabled && s.weight === Math.max(...Object.values(this.strategies).map(ss => ss.weight)))?.[0]
    };
  }
}

module.exports = { MetaEngine };
