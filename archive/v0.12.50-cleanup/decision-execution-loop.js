/**
 * HeartFlow Decision Execution Loop v11.22.0
 * 
 * 核心升级：从"决策验证"到"决策→执行→结果→学习"完整闭环
 * 
 * 来源分析（GitHub 高星项目对比）：
 * - ai-hedge-fund (581★): 交易→结果反馈→学习
 * - OpenServ SDK (130★): autonomous runtime + 结果追踪
 * - ARF (19★): decision intelligence + governed execution
 * 
 * HeartFlow 差距：
 * - DecisionVerifier 只做"事前验证"，没有"事后反馈"
 * - 没有"决策→执行→结果→修正"的 RL 闭环
 * - 没有环境传感器（实时数据作为决策上下文）
 * 
 * 核心设计：
 * - ExecuteStep: 决策记录 → 执行 → 结果记录
 * - FeedbackLoop: 结果 → Q-learning 更新 → 修正决策策略
 * - SensorBridge: 环境数据接口 → 注入决策上下文
 */

const fs = require('fs');
const path = require('path');

class DecisionExecutionLoop {
  constructor(options = {}) {
    this.stateFile = options.stateFile || path.join(__dirname, '../../data/decision-loop-state.json');
    this.decisionVerifier = null;  // 延迟加载避免循环依赖
    this.rl = null;               // 延迟加载 SelfHealingRL
    
    // 决策执行记录
    this.executionHistory = [];
    this.pendingDecision = null;
    this.executionCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    
    // 环境传感器
    this.sensors = new Map();
    
    // 初始化状态
    this._loadState();
  }

  // ============================================================
  // 依赖注入（延迟加载避免循环依赖）
  // ============================================================
  
  _getVerifiers() {
    if (!this.decisionVerifier) {
      try {
        const dv = require('./decision-verifier.js');
        this.decisionVerifier = new dv.DecisionVerifier();
      } catch (e) {
        // DecisionVerifier 不可用，使用简化版
        this.decisionVerifier = null;
      }
    }
    if (!this.rl) {
      try {
        const healing = require('./self-healing.js');
        this.rl = healing.SelfHealingRL || healing;
      } catch (e) {
        this.rl = null;
      }
    }
    return { verifier: this.decisionVerifier, rl: this.rl };
  }

  // ============================================================
  // 环境传感器接口
  // ============================================================
  
  /**
   * 注册环境传感器
   * @param {string} name - 传感器名称（如 'market', 'news', 'weather'）
   * @param {object} sensor - 传感器对象，必须有 read() 方法
   */
  registerSensor(name, sensor) {
    this.sensors.set(name, sensor);
  }

  /**
   * 读取所有传感器数据
   * @returns {object} 传感器数据字典
   */
  async readSensors() {
    const results = {};
    for (const [name, sensor] of this.sensors) {
      try {
        if (typeof sensor.read === 'function') {
          results[name] = await sensor.read();
        } else if (typeof sensor === 'function') {
          results[name] = await sensor();
        } else {
          results[name] = sensor;  // 静态数据
        }
      } catch (e) {
        results[name] = { error: e.message };
      }
    }
    return results;
  }

  // ============================================================
  // 决策→执行→结果完整闭环
  // ============================================================
  
  /**
   * 准备执行决策：注入环境数据，执行事前验证
   * @param {object} decisionRecord - 决策记录
   * @returns {object} 含环境上下文的决策记录
   */
  async prepareExecution(decisionRecord) {
    // 1. 读取环境传感器数据
    const envData = await this.readSensors();
    
    // 2. 构建增强决策记录
    const enhanced = {
      ...decisionRecord,
      _envContext: envData,
      _preparedAt: new Date().toISOString(),
      _executionId: `exec_${Date.now()}_${this.executionCount}`
    };
    
    // 3. 事前验证（如果 DecisionVerifier 可用）
    const { verifier } = this._getVerifiers();
    if (verifier) {
      const verification = verifier.verify(enhanced);
      enhanced._preVerification = {
        valid: verification.valid,
        score: verification.score,
        issues: verification.issues.map(i => i.type),
        summary: verification.summary
      };
      
      // 低分决策发出警告但不阻断
      if (!verification.valid) {
        enhanced._warnings = verification.issues.map(i => i.message);
      }
    }
    
    return enhanced;
  }

  /**
   * 执行决策步骤
   * @param {object} decisionRecord - 含环境上下文的决策记录
   * @param {object} executor - 执行器对象 { execute(decision) }
   * @returns {object} 执行结果
   */
  async execute(decisionRecord, executor = null) {
    const execId = decisionRecord._executionId || `exec_${Date.now()}`;
    this.executionCount++;
    this.pendingDecision = decisionRecord;
    
    const step = {
      executionId: execId,
      decision: decisionRecord,
      status: 'running',
      startedAt: new Date().toISOString(),
      _stage: 'execution'
    };
    
    try {
      // 执行器存在则调用，否则标记为模拟执行
      if (executor && typeof executor.execute === 'function') {
        step.result = await executor.execute(decisionRecord);
        step.executed = true;
      } else {
        // 模拟执行：用于测试和离线场景
        step.result = { simulated: true, decision: decisionRecord.decision || decisionRecord.strategy };
        step.executed = false;
        step.note = 'No executor provided - simulated execution';
      }
      
      step.status = 'completed';
      step.completedAt = new Date().toISOString();
      
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      step.failedAt = new Date().toISOString();
    }
    
    // 记录执行步骤
    this.executionHistory.push(step);
    this._saveState();
    
    return step;
  }

  /**
   * 记录执行结果并触发学习
   * @param {string} executionId - 执行ID
   * @param {object} outcome - 执行结果 { success: boolean, result: any, error?: string }
   * @returns {object} 学习结果
   */
  async recordOutcome(executionId, outcome) {
    // 找到对应执行记录
    const step = this.executionHistory.find(s => s.executionId === executionId);
    if (!step) {
      throw new Error(`Execution ${executionId} not found`);
    }
    
    // 更新执行记录
    step.outcome = outcome;
    step.endedAt = new Date().toISOString();
    step._stage = 'outcome_recorded';
    
    // 统计
    if (outcome.success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
    
    // 执行后验证（如果 DecisionVerifier 可用）
    const { verifier, rl } = this._getVerifiers();
    let postVerification = null;
    let learningResult = null;
    
    if (verifier) {
      // 用结果更新决策记录，然后自我验证
      const updatedRecord = {
        ...step.decision,
        _actualOutcome: outcome,
        _verified: true
      };
      
      postVerification = verifier.selfVerify(updatedRecord);
      step._postVerification = postVerification;
    }
    
    // RL 学习（如果 SelfHealingRL 可用）
    if (rl) {
      try {
        const pattern = this._extractPattern(step.decision);
        const reward = outcome.success ? 1 : -1;
        const context = this._buildRLContext(step.decision, outcome);
        
        // Q-learning 更新
        if (typeof rl.record === 'function') {
          rl.record({ context: pattern, action: step.decision.decision || step.decision.strategy, outcome: reward > 0 ? 'success' : 'failure' });
        }
        if (typeof rl.learn === 'function') {
          learningResult = rl.learn(pattern, reward, context);
        }
        
        step._rlUpdate = {
          pattern,
          reward,
          learningResult
        };
        step._stage = 'rl_updated';
        
      } catch (e) {
        step._rlError = e.message;
      }
    }
    
    this._saveState();
    
    return {
      executionId,
      outcome,
      postVerification,
      learningResult,
      stats: this.getStats()
    };
  }

  // ============================================================
  // 决策→执行→结果 完整流程（一键调用）
  // ============================================================
  
  /**
   * 完整决策执行流程
   * @param {object} decisionRecord - 决策记录
   * @param {object} executor - 执行器 { execute(decision) }
   * @param {number} delayMs - 执行后延迟（用于模拟异步结果）
   * @returns {object} 完整流程结果
   */
  async runFullLoop(decisionRecord, executor = null, delayMs = 0) {
    // Step 1: 准备（含环境数据 + 事前验证）
    const prepared = await this.prepareExecution(decisionRecord);
    
    // Step 2: 执行
    const executed = await this.execute(prepared, executor);
    
    // Step 3: 等待结果（模拟场景下 delayMs > 0）
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    // Step 4: 记录结果并学习
    const result = await this.recordOutcome(executed.executionId, {
      success: executed.status === 'completed',
      result: executed.result,
      error: executed.error
    });
    
    return {
      prepared,
      executed,
      result,
      stats: this.getStats()
    };
  }

  // ============================================================
  // 辅助方法
  // ============================================================
  
  _extractPattern(decision) {
    const msg = decision.decision || decision.strategy || decision.action || '';
    const type = decision._type || 'default';
    return `${type}|${msg.slice(0, 60)}`;
  }

  _buildRLContext(decision, outcome) {
    return {
      decision: decision.decision || decision.strategy,
      reason: decision.reason,
      expectedOutcome: decision.expectedOutcome,
      actualOutcome: outcome.result,
      success: outcome.success,
      envContext: decision._envContext
    };
  }

  getStats() {
    const total = this.executionCount;
    const rate = total > 0 ? (this.successCount / total * 100).toFixed(1) : 0;
    return {
      total,
      success: this.successCount,
      failure: this.failureCount,
      successRate: `${rate}%`,
      pending: this.pendingDecision ? 1 : 0
    };
  }

  // ============================================================
  // 状态持久化
  // ============================================================
  
  _loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.executionHistory = data.executionHistory || [];
        this.executionCount = data.executionCount || 0;
        this.successCount = data.successCount || 0;
        this.failureCount = data.failureCount || 0;
      }
    } catch (e) {
      // 忽略加载错误
    }
  }

  _saveState() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify({
        executionHistory: this.executionHistory.slice(-100),  // 只保留最近100条
        executionCount: this.executionCount,
        successCount: this.successCount,
        failureCount: this.failureCount,
        lastSaved: new Date().toISOString()
      }, null, 2));
    } catch (e) {
      // 忽略保存错误
    }
  }

  // ============================================================
  // 内置传感器实现
  // ============================================================
  
  /**
   * 创建时间传感器
   */
  static timeSensor() {
    return {
      read: () => ({
        timestamp: Date.now(),
        datetime: new Date().toISOString(),
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      })
    };
  }

  /**
   * 创建随机数传感器（用于模拟不确定性决策）
   */
  static randomSensor(options = {}) {
    const min = options.min || 0;
    const max = options.max || 1;
    return {
      read: () => ({
        value: min + Math.random() * (max - min),
        source: 'random'
      })
    };
  }
}

module.exports = { DecisionExecutionLoop };
