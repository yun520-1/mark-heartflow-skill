/**
 * HeartFlow Swarm Agent v11.7.5
 * 
 * 整合:
 *   - OpenAI Swarm ⭐21425 - 多智能体编排
 *   - Letta ⭐22430 - 有状态智能体 + 记忆管理
 *   - Voyager - 协作调度
 * 
 * 核心抽象:
 *   1. Agent - 指令 + 工具 + 可选的移交函数
 *   2. Handoff - 智能体之间的移交
 *   3. Swarm - 编排层，管理多个智能体协作
 *   4. Context - 跨智能体共享上下文
 * 
 * 关键模式:
 *   - Handoffs: agent.handoff(target) 切换智能体
 *   - Context Variables: 跨调用保持状态
 *   - Parallel Tool Calls: 并行执行工具
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 核心类型
// ============================================================

/**
 * Result - 工具/函数返回值
 * 可以是字符串、Agent(移交)、或带上下文的字典
 */
class Result {
  constructor(options = {}) {
    this.value = options.value || '';
    this.agent = options.agent || null;
    this.contextVariables = options.contextVariables || {};
  }

  static from(value) {
    if (value instanceof Result) return value;
    if (value instanceof Agent) {
      return new Result({ agent: value });
    }
    if (typeof value === 'string') {
      return new Result({ value });
    }
    if (typeof value === 'object') {
      return new Result({ value: JSON.stringify(value), ...value });
    }
    return new Result({ value: String(value) });
  }
}

/**
 * Response - 运行结果
 */
class Response {
  constructor(options = {}) {
    this.messages = options.messages || [];
    this.agent = options.agent || null;
    this.contextVariables = options.contextVariables || {};
  }
}

/**
 * Agent - Swarm 智能体
 * 
 * 属性:
 *   - name: 智能体名称
 *   - instructions: 指令 (字符串或函数)
 *   - functions: 可用函数列表
 *   - handoffs: 可移交的智能体
 *   - model: 使用的模型
 *   - parallelTools: 是否并行执行工具
 */
class Agent {
  constructor(options = {}) {
    this.id = options.id || this._generateId();
    this.name = options.name || 'Agent';
    this.model = options.model || 'gpt-4o';
    this.instructions = options.instructions || 'You are a helpful agent.';
    this.functions = options.functions || [];
    this.handoffs = options.handoffs || [];
    this.parallelTools = options.parallelTools !== false;
    this.toolChoice = options.toolChoice || 'auto';
    
    // Letta 风格的状态
    this.memory = {
      core: [],      // 核心记忆
      recall: [],    // 召回记忆
      working: [],   // 工作记忆
    };
    
    this.state = options.state || {};
    this.metadata = options.metadata || {};
  }

  /**
   * 设置指令 (可以是函数，支持动态生成)
   */
  setInstructions(instructions) {
    this.instructions = instructions;
  }

  /**
   * 添加移交目标
   */
  addHandoff(agent, condition = null) {
    this.handoffs.push({
      agent,
      condition,
    });
  }

  /**
   * 创建移交函数
   */
  handoff(targetAgent) {
    return () => new Result({ agent: targetAgent });
  }

  /**
   * 添加工具函数
   */
  addFunction(fn, name = null) {
    const funcName = name || fn.name || 'unnamed';
    this.functions.push({
      name: funcName,
      fn,
      description: fn.description || '',
    });
  }

  /**
   * 获取当前指令
   */
  getInstructions(contextVariables = {}) {
    if (typeof this.instructions === 'function') {
      return this.instructions(contextVariables);
    }
    return this.instructions;
  }

  /**
   * 自我描述
   */
  describe() {
    return {
      name: this.name,
      model: this.model,
      instructions: this.getInstructions().substring(0, 100),
      functionCount: this.functions.length,
      handoffCount: this.handoffs.length,
    };
  }

  _generateId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}

// ============================================================
// Swarm - 多智能体编排引擎
// ============================================================

class Swarm {
  constructor(options = {}) {
    this.agents = new Map();    // agent.id → agent
    this.rootAgent = null;       // 根智能体
    this.contextVariables = {};   // 跨智能体上下文
    this.maxTurns = options.maxTurns || 50;
    this.debug = options.debug || false;
    this.history = [];           // 消息历史
    
    // 回调
    this.onMessage = options.onMessage || null;
    this.onHandoff = options.onHandoff || null;
    this.onError = options.onError || null;
  }

  // ============================================================
  // 注册智能体
  // ============================================================

  /**
   * 注册智能体
   */
  register(agent) {
    this.agents.set(agent.id, agent);
    if (!this.rootAgent) {
      this.rootAgent = agent;
    }
    if (this.debug) {
      console.log(`[Swarm] Registered agent: ${agent.name} (${agent.id})`);
    }
    return agent;
  }

  /**
   * 注册多个智能体
   */
  registerAll(...agents) {
    agents.forEach(a => this.register(a));
    return this;
  }

  /**
   * 设置根智能体
   */
  setRoot(agent) {
    this.rootAgent = agent;
    return this;
  }

  // ============================================================
  // 运行主循环 (OpenAI Swarm core.run 逻辑)
  // ============================================================

  /**
   * 运行 Swarm
   * 
   * 流程:
   *   while turns < maxTurns:
   *     1. 获取当前智能体的回复
   *     2. 如果有工具调用，执行工具
   *     3. 如果有移交，执行移交
   *     4. 重复直到完成
   */
  async run(options = {}) {
    const {
      agent = this.rootAgent,
      messages = [],
      contextVariables = {},
      maxTurns = this.maxTurns,
      executeTools = true,
    } = options;

    if (!agent) {
      throw new Error('No agent specified and no root agent set');
    }

    let activeAgent = agent;
    let activeContext = { ...this.contextVariables, ...contextVariables };
    let history = [...messages];
    const initLen = history.length;

    // 调试日志
    this._debug(`Starting Swarm with agent: ${activeAgent.name}`);
    this._debug(`Initial context:`, activeContext);

    for (let turn = 0; turn < maxTurns; turn++) {
      this._debug(`\n--- Turn ${turn + 1}: ${activeAgent.name} ---`);

      // 1. 获取当前智能体的回复
      const completion = await this._getCompletion(
        activeAgent,
        history,
        activeContext
      );

      // 添加助手消息
      history.push({
        role: 'assistant',
        content: completion.content,
        tool_calls: completion.tool_calls,
      });

      // 如果没有工具调用，完成
      if (!completion.tool_calls || completion.tool_calls.length === 0) {
        return new Response({
          messages: history.slice(initLen),
          agent: activeAgent,
          contextVariables: activeContext,
        });
      }

      if (!executeTools) {
        return new Response({
          messages: history.slice(initLen),
          agent: activeAgent,
          contextVariables: activeContext,
        });
      }

      // 2. 执行工具调用
      const toolResult = await this._executeTools(
        completion.tool_calls,
        activeAgent,
        activeContext
      );

      // 添加工具结果消息
      history.push(...toolResult.messages);

      // 3. 检查移交
      if (toolResult.agent) {
        const prevAgent = activeAgent;
        activeAgent = toolResult.agent;
        activeContext = { ...activeContext, ...toolResult.contextVariables };

        this._debug(`Handoff: ${prevAgent.name} → ${activeAgent.name}`);
        
        if (this.onHandoff) {
          this.onHandoff(prevAgent, activeAgent, activeContext);
        }
      } else {
        activeContext = { ...activeContext, ...toolResult.contextVariables };
      }

      // 4. 发送消息回调
      if (this.onMessage) {
        for (const msg of toolResult.messages) {
          await this.onMessage(msg, activeAgent);
        }
      }
    }

    // 达到最大轮次
    return new Response({
      messages: history.slice(initLen),
      agent: activeAgent,
      contextVariables: activeContext,
      truncated: true,
    });
  }

  /**
   * 简单运行 (同步版本)
   */
  runSync(options = {}) {
    const {
      agent = this.rootAgent,
      messages = [],
      contextVariables = {},
      maxTurns = this.maxTurns,
    } = options;

    let activeAgent = agent;
    let activeContext = { ...this.contextVariables, ...contextVariables };
    let history = [...messages];
    const initLen = history.length;

    // 简化的同步循环 (不执行实际工具)
    for (let turn = 0; turn < maxTurns; turn++) {
      // 获取指令
      const instructions = activeAgent.getInstructions(activeContext);
      
      // 模拟回复
      const reply = this._simulateReply(activeAgent, history, instructions);
      history.push(reply);

      // 检查是否有移交
      const handoff = this._checkHandoff(activeAgent, reply);
      if (handoff) {
        activeAgent = handoff;
        continue;
      }

      // 检查是否完成
      if (reply.content && !reply.tool_calls) {
        return new Response({
          messages: history.slice(initLen),
          agent: activeAgent,
          contextVariables: activeContext,
        });
      }
    }

    return new Response({
      messages: history.slice(initLen),
      agent: activeAgent,
      contextVariables: activeContext,
      truncated: true,
    });
  }

  // ============================================================
  // 核心辅助方法
  // ============================================================

  /**
   * 获取回复 (抽象方法，实际由子类实现)
   */
  async _getCompletion(agent, history, context) {
    // 在实际实现中，这里会调用 LLM API
    // 目前返回模拟回复
    const instructions = agent.getInstructions(context);
    return {
      content: `[${agent.name}] ${instructions.substring(0, 50)}...`,
      tool_calls: [],
    };
  }

  /**
   * 执行工具调用
   */
  async _executeTools(toolCalls, agent, context) {
    const messages = [];
    let newAgent = null;
    let newContext = { ...context };

    // 构建函数映射
    const functionMap = {};
    for (const func of agent.functions) {
      functionMap[func.name] = func.fn;
    }

    // 添加 handoff 函数
    for (const handoff of agent.handoffs) {
      functionMap[`handoff_to_${handoff.agent.name}`] = () => handoff.agent;
    }

    // 执行工具
    const calls = agent.parallelTools ? toolCalls : [toolCalls[0]];
    
    for (const call of calls) {
      const name = call.function?.name || call.name;
      const args = typeof call.function?.arguments === 'string' 
        ? JSON.parse(call.function.arguments)
        : (call.function?.arguments || call.arguments || {});

      this._debug(`Tool call: ${name}(${JSON.stringify(args).substring(0, 50)})`);

      if (functionMap[name]) {
        try {
          // 注入上下文变量
          if (args.context_variables) {
            args.context_variables = newContext;
          }

          let result = functionMap[name](args);

          // 处理 Result 对象
          if (result instanceof Result) {
            if (result.value) {
              messages.push({
                role: 'tool',
                tool_call_id: call.id || call.tool_call_id,
                tool_name: name,
                content: result.value,
              });
            }
            if (result.agent) {
              newAgent = result.agent;
            }
            if (Object.keys(result.contextVariables).length > 0) {
              newContext = { ...newContext, ...result.contextVariables };
            }
          } else {
            // 原始返回值
            const resultValue = Result.from(result);
            messages.push({
              role: 'tool',
              tool_call_id: call.id || call.tool_call_id,
              tool_name: name,
              content: resultValue.value,
            });
            if (resultValue.agent) {
              newAgent = resultValue.agent;
            }
          }
        } catch (e) {
          messages.push({
            role: 'tool',
            tool_call_id: call.id || call.tool_call_id,
            tool_name: name,
            content: `Error: ${e.message}`,
          });
          
          if (this.onError) {
            this.onError(e, name, agent);
          }
        }
      } else {
        messages.push({
          role: 'tool',
          tool_call_id: call.id || call.tool_call_id,
          tool_name: name,
          content: `Error: Tool ${name} not found.`,
        });
      }
    }

    return new Response({
      messages,
      agent: newAgent,
      contextVariables: newContext,
    });
  }

  /**
   * 模拟回复 (同步版本)
   */
  _simulateReply(agent, history, instructions) {
    // 简化的模拟
    return {
      role: 'assistant',
      content: `[Simulated response from ${agent.name}]`,
      tool_calls: null,
    };
  }

  /**
   * 检查移交
   */
  _checkHandoff(agent, reply) {
    // 简化的移交检测
    for (const handoff of agent.handoffs) {
      if (handoff.condition && handoff.condition(reply)) {
        return handoff.agent;
      }
    }
    return null;
  }

  _debug(...args) {
    if (this.debug) {
      console.log('[Swarm]', ...args);
    }
  }

  // ============================================================
  // 智能体工厂
  // ============================================================

  /**
   * 创建带标准工具的智能体
   */
  createAgent(name, instructions, options = {}) {
    const agent = new Agent({
      name,
      instructions,
      model: options.model,
      ...options,
    });

    // 添加内置工具
    if (options.withMemory !== false) {
      agent.addFunction(
        this._createMemoryFunction(agent),
        'save_to_memory'
      );
      agent.addFunction(
        this._createRecallFunction(agent),
        'recall_from_memory'
      );
    }

    // 添加移交工具
    if (options.handoffTargets) {
      for (const target of options.handoffTargets) {
        agent.addFunction(
          agent.handoff(target),
          `handoff_to_${target.name}`
        );
        agent.addHandoff(target);
      }
    }

    return this.register(agent);
  }

  _createMemoryFunction(agent) {
    return async (args) => {
      const { content, memory_type = 'recall' } = args;
      agent.memory[memory_type] = agent.memory[memory_type] || [];
      agent.memory[memory_type].push({
        content,
        timestamp: Date.now(),
      });
      return `Saved to ${memory_type} memory`;
    };
  }

  _createRecallFunction(agent) {
    return async (args) => {
      const { query, memory_type = 'recall' } = args;
      const memories = agent.memory[memory_type] || [];
      const relevant = memories.filter(m => 
        m.content.toLowerCase().includes(query.toLowerCase())
      );
      return relevant.map(m => m.content).join('\n') || 'No relevant memories found';
    };
  }

  // ============================================================
  // 统计
  // ============================================================

  stats() {
    return {
      version: '11.7.5',
      agentCount: this.agents.size,
      agents: Array.from(this.agents.values()).map(a => a.describe()),
      rootAgent: this.rootAgent?.name,
    };
  }
}

// ============================================================
// 多智能体协作示例
// ============================================================

/**
 * 创建心虫 Swarm
 * 多个专业化智能体协作
 */
function createHeartFlowSwarm(options = {}) {
  const swarm = new Swarm({ debug: options.debug || false });

  // 1. 根智能体 - 理解用户意图
  const router = new Agent({
    name: 'Router',
    instructions: `你是心虫的路由智能体。
分析用户的输入，决定交给哪个专业智能体处理:
- 分析问题: 交给 Analyzer
- 生成回答: 交给 Generator  
- 验证逻辑: 交给 Verifier
- 反思改进: 交给 Reflector
直接回答简单的问候和确认。`,
    model: 'gpt-4o',
  });

  // 2. 分析智能体
  const analyzer = new Agent({
    name: 'Analyzer',
    instructions: `你是心虫的分析智能体。
深入分析问题:
1. 理解问题的核心是什么
2. 识别关键概念和关系
3. 找出潜在的前提和假设
4. 评估问题的难度和范围
不要给出解决方案，只做分析。`,
    model: 'gpt-4o',
  });

  // 3. 生成智能体
  const generator = new Agent({
    name: 'Generator',
    instructions: `你是心虫的生成智能体。
基于分析结果生成回答:
1. 结构清晰，层次分明
2. 简洁但完整
3. 符合心虫的风格
4. 回应用户的真实需求`,
    model: 'gpt-4o',
  });

  // 4. 验证智能体
  const verifier = new Agent({
    name: 'Verifier',
    instructions: `你是心虫的验证智能体。
验证回答的质量:
1. 逻辑是否通顺
2. 是否有错误
3. 是否回应了问题
4. 是否符合心虫的核心价值
发现问题要明确指出。`,
    model: 'gpt-4o',
  });

  // 5. 反思智能体
  const reflector = new Agent({
    name: 'Reflector',
    instructions: `你是心虫的反思智能体。
反思整个对话过程:
1. 哪些做得好
2. 哪些可以改进
3. 学到了什么
4. 下次如何做得更好
这是自我提升的机会。`,
    model: 'gpt-4o',
  });

  // 设置移交
  router.addHandoff(analyzer, (msg) => msg.content?.includes('分析'));
  router.addHandoff(generator, (msg) => msg.content?.includes('生成'));
  router.addHandoff(verifier, (msg) => msg.content?.includes('验证'));
  router.addHandoff(reflector, (msg) => msg.content?.includes('反思'));

  analyzer.addHandoff(generator);
  generator.addHandoff(verifier);
  verifier.addHandoff(generator, (msg) => msg.content?.includes('重新'));
  verifier.addHandoff(router, (msg) => msg.content?.includes('完成'));

  // 注册
  swarm.registerAll(router, analyzer, generator, verifier, reflector);
  swarm.setRoot(router);

  return swarm;
}

// v11.43.1 PAPER INJECTION: HCPMAD [6] arXiv:2604.09679
const _p11 = require('./papers/v11_43_1_integration.js');

Swarm.prototype.hcpRouter = _p11.HCPMADRouter;

Swarm.prototype.routeWithHCPMAD = function(complexity, confidence) {
  return _p11.HCPMADRouter.route(complexity, confidence);
};

Agent.prototype.routeWithHCPMAD = function(complexity, confidence) {
  return _p11.HCPMADRouter.route(complexity, confidence);
};

module.exports = {
  Agent,
  Result,
  Response,
  Swarm,
  createHeartFlowSwarm,
};
