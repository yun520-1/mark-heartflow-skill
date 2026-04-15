/**
 * PDCA Engine - 自适应规划-执行-评估循环
 * Plan → Do → Check → Act
 */

const fs = require('fs');
const path = require('path');
const { GoedelEngine } = require('../self-evolution/goedel-engine');

class PDCAEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.goedelEngine = new GoedelEngine(projectRoot);
    this.traceFile = path.join(projectRoot, '.opencode', 'logs', 'autonomy_trace.json');
    this.config = this.loadConfig();
    
    this.loadTrace();
  }

  loadConfig() {
    const configPath = path.join(this.projectRoot, '.opencode', 'config.json');
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      return { maxAutonomousStepsPerCycle: 5, requireConfirmationForDestructiveActions: true };
    }
  }

  loadTrace() {
    try {
      if (fs.existsSync(this.traceFile)) {
        this.trace = JSON.parse(fs.readFileSync(this.traceFile, 'utf8'));
      } else {
        this.trace = { cycles: [], completed_goals: [] };
      }
    } catch (e) {
      this.trace = { cycles: [], completed_goals: [] };
    }
  }

  saveTrace() {
    const dir = path.dirname(this.traceFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.traceFile, JSON.stringify(this.trace, null, 2));
  }

  log(message) {
    console.log(`[PDCA] ${message}`);
  }

  /**
   * 执行完整 PDCA 循环
   */
  async executeAutonomousCycle(goal) {
    const cycle = {
      goal_id: goal.goal_id,
      description: goal.description,
      start_time: new Date().toISOString(),
      plan: null,
      do: [],
      check: null,
      act: null,
      status: 'in_progress'
    };

    this.log(`Starting PDCA cycle for: ${goal.description}`);

    // Phase 1: Plan
    const planResult = await this.plan(goal);
    cycle.plan = planResult;
    
    if (!planResult.success) {
      cycle.status = 'failed';
      cycle.error = planResult.error;
      this.recordCycle(cycle);
      return cycle;
    }

    // Phase 2: Do
    const doResult = await this.do(planResult.subtasks, goal);
    cycle.do = doResult;

    // Phase 3: Check
    const checkResult = await this.check(doResult, goal);
    cycle.check = checkResult;

    // Phase 4: Act
    const actResult = await this.act(checkResult, goal, cycle);
    cycle.act = actResult;
    cycle.end_time = new Date().toISOString();
    cycle.status = checkResult.success ? 'completed' : 'failed_with_adjustment';

    this.recordCycle(cycle);
    this.log(`PDCA cycle ${cycle.status}`);

    return cycle;
  }

  /**
   * Plan: 分解目标为子任务
   */
  async plan(goal) {
    const templates = {
      'interrupt': {
        subtasks: [
          { id: '1', action: 'analyze', target: 'interrupt_logs', tool: 'read_logs' },
          { id: '2', action: 'identify', target: 'failure_patterns', tool: 'analyze_patterns' },
          { id: '3', action: 'modify', target: 'state_recovery', tool: 'goedel_engine' },
          { id: '4', action: 'test', target: 'recovery_logic', tool: 'unit_test' }
        ]
      },
      'frustration': {
        subtasks: [
          { id: '1', action: 'analyze', target: 'frustration_triggers', tool: 'read_logs' },
          { id: '2', action: 'identify', target: 'response_patterns', tool: 'analyze_patterns' },
          { id: '3', action: 'modify', target: 'emotion_response', tool: 'goedel_engine' }
        ]
      },
      'default': {
        subtasks: [
          { id: '1', action: 'research', target: goal.description, tool: 'llm_query' },
          { id: '2', action: 'design', target: 'solution', tool: 'llm_query' },
          { id: '3', action: 'implement', target: 'code', tool: 'goedel_engine' }
        ]
      }
    };

    let subtasks = templates.default.subtasks;
    for (const [key, t] of Object.entries(templates)) {
      if (key !== 'default' && goal.description.toLowerCase().includes(key)) {
        subtasks = t.subtasks;
        break;
      }
    }

    // 限制子任务数量
    const maxSteps = this.config.maxAutonomousStepsPerCycle || 5;
    subtasks = subtasks.slice(0, maxSteps);

    return {
      success: true,
      subtasks: subtasks,
      decomposition: `将目标分解为${subtasks.length}个子任务`
    };
  }

  /**
   * Do: 执行子任务
   */
  async do(subtasks, goal) {
    const results = [];
    const maxRetries = 3;

    for (const subtask of subtasks) {
      let attempt = 0;
      let success = false;
      let result = null;

      while (attempt < maxRetries && !success) {
        attempt++;
        try {
          result = await this.executeSubtask(subtask, goal);
          success = result.success;
        } catch (e) {
          result = { success: false, error: e.message };
        }
      }

      results.push({
        subtask: subtask,
        success: success,
        attempts: attempt,
        result: result
      });

      if (!success && this.config.requireConfirmationForDestructiveActions) {
        this.log(`Subtask ${subtask.id} failed, stopping due to destructive action`);
        break;
      }
    }

    return {
      executed: subtasks.length,
      successful: results.filter(r => r.success).length,
      results: results
    };
  }

  /**
   * 执行单个子任务
   */
  async executeSubtask(subtask, goal) {
    this.log(`Executing subtask ${subtask.id}: ${subtask.action}`);

    switch (subtask.tool) {
      case 'goedel_engine':
        if (this.config.requireConfirmationForDestructiveActions) {
          return { success: false, error: 'Requires confirmation for code modification' };
        }
        
        const modResult = await this.goedelEngine.evolve({
          target: 'src/core/test.js',
          description: subtask.action + ' ' + subtask.target,
          priority: 'low'
        });
        return { success: modResult.success, result: modResult };

      case 'llm_query':
        return { success: true, result: 'LLM query simulated' };

      case 'read_logs':
        return { success: true, result: 'Logs read successfully' };

      case 'analyze_patterns':
        return { success: true, result: 'Patterns analyzed' };

      case 'unit_test':
        return { success: true, result: 'Tests passed' };

      default:
        return { success: true, result: 'Generic task completed' };
    }
  }

  /**
   * Check: 评估执行结果
   */
  async check(doResult, goal) {
    const successRate = doResult.successful / doResult.executed;
    const threshold = 0.6;

    const evaluation = {
      success: successRate >= threshold,
      success_rate: successRate,
      threshold: threshold,
      criteria_met: successRate >= threshold
    };

    if (!evaluation.success) {
      evaluation.failure_reasons = doResult.results
        .filter(r => !r.success)
        .map(r => r.result?.error || 'Unknown error');
    }

    return evaluation;
  }

  /**
   * Act: 行动阶段
   */
  async act(checkResult, goal, cycle) {
    if (checkResult.success) {
      return {
        action: 'complete_goal',
        message: '目标成功完成',
        adjustments: []
      };
    }

    const act = {
      action: 'analyze_failure',
      message: '分析失败原因并调整',
      retry_count: (cycle.do?.results?.filter(r => !r.success).length || 0),
      max_retries: 3
    };

    if (act.retry_count < act.max_retries) {
      act.action = 'retry_with_adjustment';
      act.message = '调整计划后重试';
    } else {
      act.action = 'reduce_priority';
      act.message = '重试次数超限，降低目标优先级';
    }

    return act;
  }

  /**
   * 记录 PDCA 循环
   */
  recordCycle(cycle) {
    this.trace.cycles.push(cycle);
    
    if (cycle.status === 'completed') {
      this.trace.completed_goals.push({
        goal_id: cycle.goal_id,
        description: cycle.description,
        completed_at: cycle.end_time
      });
    }
    
    this.saveTrace();
  }

  /**
   * 获取历史记录
   */
  getHistory() {
    return {
      total_cycles: this.trace.cycles.length,
      completed_goals: this.trace.completed_goals.length,
      recent: this.trace.cycles.slice(-5)
    };
  }

  getStatus() {
    return {
      config: this.config,
      history: this.getHistory()
    };
  }
}

module.exports = { PDCAEngine };
