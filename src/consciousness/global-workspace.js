/**

 * Global Workspace - 全局工作空间架构

 * 参考 Global Workspace Theory (GWT)

 * 实现黑板系统 + 注意力竞争机制

 *

 * v2.3.0 升级内容:

 *   - 新增 AGENT_NAME_MAP 配置，将硬编码的智能体名称抽象为可配置映射

 *   - 新增 Blackboard 条目上限 (MAX_BOARD_ENTRIES)，防止无界增长

 *   - 新增 agentTimeout 机制，防止单个智能体阻塞整个认知周期

 *   - 新增 determineWinner 次要排序 (名称字典序)，解决分数相同时的确定性选择

 *   - 新增 validateAgentMethods 校验，确保智能体实现了 process/getAttentionPriority

 *   - 新增 cognitiveCycle 的阶段跟踪 (cyclePhase)，便于调试和监控

 *   - 新增 _validateBroadcasts 防御性校验，处理空/异常广播

 *   - 新增 getCycleHistory / getRecentCycles 可观测性接口

 */



const EventEmitter = require('events');



const GWT_LIMITS = {

  salienceThreshold: 0.7,

  summaryLimit: 3,

  /** 黑板条目上限，超出时淘汰最旧的 */

  MAX_BOARD_ENTRIES: 200,

  /** 单个智能体处理超时 (毫秒)，超时则标记失败并继续 */

  AGENT_TIMEOUT_MS: 10000,

  /** 保留的认知周期历史数 */

  CYCLE_HISTORY_LIMIT: 50,

};



/**

 * 智能体名称 → 内心独白角色描述的映射表

 * 将 generateIntegratedThought 中的硬编码名称抽象为可配置映射

 * @type {Object<string, string>}

 */

const AGENT_NAME_MAP = {

  Focus: '聚焦者',

  Mood: '情绪感知',

  Reflection: '反思者',

  Memory: '记忆',

  Reason: '推理',

  Intuition: '直觉',

  Ethics: '道德',

};



class GlobalWorkspace extends EventEmitter {

  constructor(projectRoot) {

    super();

    this.projectRoot = projectRoot;

    this.blackboard = new Blackboard(GWT_LIMITS.MAX_BOARD_ENTRIES);

    this.agents = new Map();

    this.cycleCount = 0;

    this.lastConsensus = null;

    /** 认知周期阶段跟踪: idle | gathering | integrating | complete | error */

    this.cyclePhase = 'idle';

    /** 历史认知周期记录 */

    this.cycleHistory = [];

  }



  /**

   * 验证智能体是否实现了必要方法

   * @param {Object} agent - 智能体实例

   * @returns {{ valid: boolean, missing: string[] }}

   */

  _validateAgentMethods(agent) {

    const missing = [];

    if (typeof agent.process !== 'function') missing.push('process');

    if (typeof agent.getAttentionPriority !== 'function') missing.push('getAttentionPriority');

    return {

      valid: missing.length === 0,

      missing,

    };

  }



  /**

   * 注册专家智能体

   * @param {Object} agent - 智能体实例 (需实现 process() 和 getAttentionPriority())

   * @returns {boolean} 是否注册成功

   */

  registerAgent(agent) {

    if (!agent || !agent.name) {

      return false;

    }



    const validation = this._validateAgentMethods(agent);

    if (!validation.valid) {

      return false;

    }



    if (this.agents.has(agent.name)) {

    }



    this.agents.set(agent.name, {

      instance: agent,

      attentionRequests: [],

      lastOutput: null,

      confidence: 0,

      /** 注册时间戳 */

      registeredAt: new Date().toISOString(),

      /** 连续失败计数，用于故障检测 */

      consecutiveFailures: 0,

    });

    return true;

  }



  /**

   * 触发认知周期

   */

  async cognitiveCycle(userInput, context = {}) {

    this.cyclePhase = 'gathering';

    this.cycleCount++;



    this.blackboard.add({

      type: 'user_input',

      content: userInput,

      timestamp: new Date().toISOString(),

      source: 'user',

    });



    this.blackboard.add({

      type: 'context',

      content: context,

      timestamp: new Date().toISOString(),

      source: 'system',

    });



    const broadcasts = await this.gatherAgentBroadcasts(userInput, context);



    this.cyclePhase = 'integrating';

    const winningAgent = this.determineWinner(broadcasts);

    const stabilizedWinner = this._stabilizeWinner(winningAgent, broadcasts, 3);

    const consensus = this.integrate(stabilizedWinner, broadcasts);

    this.lastConsensus = consensus;



    // 记录周期历史

    this._recordCycle(userInput, consensus);

    this.cyclePhase = 'complete';



    this.emit('cycleComplete', { cycle: this.cycleCount, consensus });

    return consensus;

  }



  /**

   * 收集各智能体的注意力请求（含超时保护）

   */

  async gatherAgentBroadcasts(userInput, context) {

    const broadcasts = [];



    for (const [name, agentData] of this.agents) {

      try {

        // 超时包装: 单个智能体处理不得超过 AGENT_TIMEOUT_MS

        const output = await this._timeoutPromise(

          agentData.instance.process(userInput, context),

          GWT_LIMITS.AGENT_TIMEOUT_MS,

          `Agent "${name}" process timed out after ${GWT_LIMITS.AGENT_TIMEOUT_MS}ms`

        );



        const attentionResult = await this._timeoutPromise(

          agentData.instance.getAttentionPriority(userInput, context),

          GWT_LIMITS.AGENT_TIMEOUT_MS,

          `Agent "${name}" getAttentionPriority timed out after ${GWT_LIMITS.AGENT_TIMEOUT_MS}ms`

        );



        // 防御性: 确保 attentionResult 有合理结构

        const attention = attentionResult && typeof attentionResult === 'object' ? attentionResult : { priority: 0.5, confidence: 0.5 };

        const priority = typeof attention.priority === 'number' ? attention.priority : 0.5;

        const confidence = typeof attention.confidence === 'number' ? attention.confidence : 0.5;



        const broadcast = {

          agent: name,

          output: output,

          attention: Math.max(0, Math.min(1, priority)),

          confidence: Math.max(0, Math.min(1, confidence)),

        };



        broadcasts.push(broadcast);



        // [v5.17.15 M1] 动态显著性阈值 — 根据情绪状态和任务类型调整

        // 高唤醒(情绪激烈) → 降低阈值(更敏感); 低噪声任务 → 提高阈值(过滤噪音)

        const emotionalArousal = context?.emotion?.arousal || 0.5;

        const taskComplexity = context?.task?.complexity || 0.5;

        const salienceThreshold = 0.5 + 0.2 * (1 - emotionalArousal) + 0.1 * taskComplexity;

        broadcast.salienceThreshold = +salienceThreshold.toFixed(3);



        agentData.lastOutput = output;

        agentData.attentionRequests.push({

          attention: broadcast.attention,

          confidence: broadcast.confidence,

          timestamp: new Date().toISOString(),

        });

        agentData.consecutiveFailures = 0;



      } catch (e) {

        agentData.consecutiveFailures++;

        // 即使失败也记录一个低优先级广播，保证 integrate 能看到所有参与者

        broadcasts.push({

          agent: name,

          output: null,

          attention: 0,

          confidence: 0,

          error: e.message,

        });

      }

    }



    return broadcasts;

  }



  /**

   * Promise 超时包装

   * @private

   * @param {Promise} promise - 原始 Promise

   * @param {number} ms - 超时毫秒

   * @param {string} timeoutMessage - 超时提示消息

   * @returns {Promise} 带超时的 Promise

   */

  _timeoutPromise(promise, ms, timeoutMessage) {

    let timer;

    const timeout = new Promise((_, reject) => {

      timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);

    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));

  }



  /**

   * 验证广播列表，处理空/异常情况

   * @private

   */

  _validateBroadcasts(broadcasts) {

    if (!Array.isArray(broadcasts) || broadcasts.length === 0) {

      return {

        agent: 'none',

        output: null,

        attention: 0,

        confidence: 0,

        isEmpty: true,

      };

    }

    return null;

  }



  /**

   * 决定获胜者（注意力竞争）

   * 主要排序: 注意力 × 置信度 (降序)

   * 次要排序: 智能体名称 (字典序) — 解决分数相同时的确定性选择

   */

  determineWinner(broadcasts) {

    const emptyResult = this._validateBroadcasts(broadcasts);

    if (emptyResult) return emptyResult;



    const scored = broadcasts

      .filter(b => b && typeof b === 'object')

      .map(b => ({

        ...b,

        score: (b.attention || 0) * (b.confidence || 0),

      }));



    if (scored.length === 0) {

      return { agent: 'none', output: null, attention: 0, confidence: 0, score: 0, isEmpty: true };

    }



    // 主要: 分数降序; 次要: 名称字典序 (确保确定性)

    scored.sort((a, b) => {

      const scoreDiff = b.score - a.score;

      if (scoreDiff !== 0) return scoreDiff;

      return (a.agent || '').localeCompare(b.agent || '');

    });



    const winner = scored[0];



    // [FORMULA v5.14.0] GWT 公式增强 —— 用公式桥接直接计算全局工作空间竞争信号

    // 不替代主逻辑（确定性排序），仅附带 GWT 计算结果供上层感知

    let gwt = null;

    try {

      const { getFormulaBridge } = require('../formula/formula-bridge.js');

      const bridge = getFormulaBridge();

      if (bridge) {

        const weights = scored.map(s => (s.attention || 0) * (s.confidence || 0) + (s.score || 0) * 0.5);

        const gwtActs = bridge.gwtAccessibility(weights, 1, 0.3);

        const gwtIdx = bridge.gwtWinner(gwtActs);

        if (Array.isArray(gwtActs) && typeof gwtIdx === 'number' && gwtActs.length > 0 && gwtIdx >= 0) {

          gwt = {

            activations: gwtActs.map(v => +v.toFixed(3)),

            winnerIndex: gwtIdx,

            winnerAgent: scored[gwtIdx]?.agent || null,

            bridgeWinner: scored[gwtIdx]?.agent || null

          };

        }

      }

    } catch (e) { gwt = null; }

    // [FORMULA v5.14.0] 回退到注册表调用（兼容现有 registry 集成）

    if (!gwt) {

      try {

        const { getFormulaRegistry } = require('../formula/formula-registry.js');

        const reg = getFormulaRegistry();

        const acts = scored.map(s => (s.attention || 0) * (s.confidence || 0) * 10 + (s.score || 0));

        const gwtActs = reg.call('decision_utility', 'gwt_accessibility', acts, 1, 0.5);

        const gwtIdx = reg.call('decision_utility', 'gwt_winner', gwtActs);

        if (Array.isArray(gwtActs) && typeof gwtIdx === 'number' && gwtActs.length) {

          gwt = { activations: gwtActs.map(v => +v.toFixed(3)), winnerIndex: gwtIdx, winnerAgent: scored[gwtIdx]?.agent || null };

        }

      } catch (e) { gwt = null; }

    // [AUDIT-FIX] console.error("[{context}] catch error:", e);

    }



    const result = winner;

    result.gwt = gwt;



    // [v5.17.13] Thoughtseed竞争动力学 (Lotka-Volterra) — 意识内容的自我组织

    // 赢家获得注意力增强(ignition), 输家被侧向抑制(lateral inhibition)

    // d(TS_i)/dt = f(TS_i, W) - Σ α_{ij} * TS_j  — 来自 arXiv:2408.15982

    if (scored.length > 1) {

      const winnerScore = result.score || 0;

      const avgLoserScore = scored.slice(1).reduce((s,b) => s + (b.score||0), 0) / (scored.length - 1);

      const inhibition = Math.min(0.5, avgLoserScore / Math.max(1, winnerScore) * 0.3);

      result.thoughtseed = {

        ignition: Math.min(1, winnerScore / (winnerScore + avgLoserScore + 1e-9)),

        lateralInhibition: +inhibition.toFixed(3),

        competitiveAdvantage: +(winnerScore - avgLoserScore).toFixed(2),

        loserCount: scored.length - 1,

      };

    }

    return result;

  }



  /**

   * 整合各智能体意见形成共识

   */

  integrate(winner, broadcasts) {

    const validBroadcasts = (broadcasts || []).filter(b => b && typeof b === 'object');



    const allOpinions = validBroadcasts.map(b => ({

      agent: b.agent,

      opinion: typeof b.output === 'string' ? b.output : (b.output ? JSON.stringify(b.output) : ''),

      weight: (b.confidence || 0) * (b.attention || 0),

      hasError: !!b.error,

    }));



    const consensus = {

      cycle: this.cycleCount,

      winner: winner?.agent || 'none',

      winnerOutput: winner?.output || '',

      allOpinions: allOpinions,

      integratedThought: this.generateIntegratedThought(allOpinions),

      summary: this.summarizeConsensus(allOpinions),

      participantCount: validBroadcasts.length,

      failedCount: validBroadcasts.filter(b => b.error).length,

      timestamp: new Date().toISOString(),

    };



    return consensus;

  }



  /**

   * [v5.17.16 M2] 马尔可夫毯稳定化 — Thoughtseed多轮竞争

   * arXiv:2408.15982 — 嵌套马尔可夫毯层级间消息传递

   * 对初始winner多轮迭代, 增强胜者注意力直到概念稳定

   */

  _stabilizeWinner(winner, broadcasts, maxRounds) {

    maxRounds = maxRounds || 3;

    if (!winner || broadcasts.length <= 1) return winner;

    let current = { ...winner, score: winner.score || 0 };

    for (let round = 1; round <= maxRounds; round++) {

      const totalScore = broadcasts.reduce((s, b) => s + (b.score || 0) * (b.attention || 0), 0) || 1;

      const dominance = current.score / totalScore;

      if (dominance > 0.5 || round === maxRounds) {

        current.stabilizationRounds = round;

        current.finalDominance = +dominance.toFixed(3);

        current.converged = dominance > 0.5;

        return current;

      }

      const boost = Math.min(0.2, (1 - dominance) * 0.3);

      current.score += boost;

    }

    return current;

  }



  /**

   * 生成内心独白

   * 使用 AGENT_NAME_MAP 抽象智能体名称，避免硬编码

   */

  generateIntegratedThought(opinions) {

    if (!opinions || opinions.length === 0) {

      return '寂静...没有声音。';

    }



    // 排除失败的智能体

    const active = opinions.filter(o => !o.hasError && o.weight > 0);

    if (active.length === 0) {

      return '所有声音都沉默了。';

    }



    const dominant = active.reduce((a, b) => a.weight > b.weight ? a : b);

    const thoughts = [];



    // 使用可配置的 AGENT_NAME_MAP 而非硬编码字符串

    const roleName = AGENT_NAME_MAP[dominant.agent] || dominant.agent;

    const opinionPreview = String(dominant.opinion).substring(0, 120);

    thoughts.push(`${roleName}说：${opinionPreview}`);



    // 取权重第二高的意见作为补充 (如果其权重超过阈值)

    const second = active

      .filter(o => o.agent !== dominant.agent)

      .sort((a, b) => b.weight - a.weight)[0];



    if (second && second.weight > 0.3) {

      const secondRole = AGENT_NAME_MAP[second.agent] || second.agent;

      const secondPreview = String(second.opinion).substring(0, 80);

      thoughts.push(`另有${secondRole}提醒：${secondPreview}`);

    }



    return thoughts.join('\n');

  }



  /**

   * 汇总共识（简短摘要）

   */

  summarizeConsensus(opinions) {

    if (!opinions || opinions.length === 0) return '';



    return opinions

      .slice()

      .sort((a, b) => b.weight - a.weight)

      .slice(0, GWT_LIMITS.summaryLimit)

      .filter(o => !o.hasError && o.opinion)

      .map(o => `${o.agent}: ${String(o.opinion).slice(0, 80)}`)

      .join(' | ');

  }



  /**

   * 记录认知周期到历史

   * @private

   */

  _recordCycle(userInput, consensus) {

    this.cycleHistory.push({

      cycle: this.cycleCount,

      input: typeof userInput === 'string' ? userInput.substring(0, 100) : '(non-string)',

      winner: consensus.winner,

      participantCount: consensus.participantCount,

      timestamp: new Date().toISOString(),

    });



    // 限制历史长度

    if (this.cycleHistory.length > GWT_LIMITS.CYCLE_HISTORY_LIMIT) {

      this.cycleHistory = this.cycleHistory.slice(-GWT_LIMITS.CYCLE_HISTORY_LIMIT);

    }

  }



  /**

   * 获取黑板全部内容

   */

  getBlackboard() {

    return this.blackboard.getAll();

  }



  /**

   * 获取认知周期历史

   */

  getCycleHistory() {

    return [...this.cycleHistory];

  }



  /**

   * 获取最近的 N 个认知周期

   * @param {number} [n=5] - 最近周期数

   */

  getRecentCycles(n = 5) {

    return this.cycleHistory.slice(-n);

  }



  /**

   * 获取系统状态

   */

  getStatus() {

    return {

      cycle: this.cycleCount,

      phase: this.cyclePhase,

      agents: Array.from(this.agents.keys()),

      agentCount: this.agents.size,

      boardSize: this.blackboard.size(),

      lastConsensus: this.lastConsensus ? {

        winner: this.lastConsensus.winner,

        integrated: this.lastConsensus.integratedThought.substring(0, 100),

        participantCount: this.lastConsensus.participantCount,

      } : null,

    };

  }

}



/**

 * Blackboard - 黑板数据结构

 * 带条目上限，超出时自动淘汰最旧条目

 */

class Blackboard {

  constructor(maxEntries = GWT_LIMITS.MAX_BOARD_ENTRIES) {

    this.entries = [];

    this.maxEntries = maxEntries;

  }



  add(entry) {

    this.entries.push(entry);

    // 超出上限时淘汰最旧的 10%

    if (this.entries.length > this.maxEntries) {

      const trimCount = Math.floor(this.maxEntries * 0.1);

      this.entries = this.entries.slice(trimCount);

    }

  }



  getAll() {

    return [...this.entries];

  }



  getByType(type) {

    return this.entries.filter(e => e.type === type);

  }



  getByAgent(agent) {

    return this.entries.filter(e => e.agent === agent);

  }



  /** 返回当前条目数 */

  size() {

    return this.entries.length;

  }



  clear() {

    this.entries = [];

  }

}



module.exports = { GlobalWorkspace, Blackboard, GWT_LIMITS, AGENT_NAME_MAP };
