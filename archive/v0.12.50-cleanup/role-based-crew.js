/**
 * HeartFlow Role-Based Agent System v11.20.0
 * 
 * 来源:
 *   - CrewAI (CrewAIInc/crewAI) ⭐50778 - Role-based multi-agent orchestration
 *     核心: Agent(role, goal, backstory) + Task + Crew + Process
 *     @CrewBase decorator pattern for declarative YAML config
 *   - Mastra (mastra-ai/mastra) ⭐23623 - Agent + Workflow platform
 * 
 * CrewAI Role System 核心概念:
 *   1. Role: { role, goal, backstory }
 *   2. Agent: role + tools + llm + memory + guardrails
 *   3. Task: { description, expected_output, agent, dependencies }
 *   4. Crew: { agents[], tasks[], process: sequential|parallel|hierarchical }
 *   5. Process: how agents collaborate (sequential/parallel)
 * 
 * HeartFlow 整合:
 *   - 纯 JavaScript，无外部依赖
 *   - 适配现有 AgentOrchestrator
 *   - 兼容 AgentExecutionLoop
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Role Definition
// ============================================================

/**
 * Role - 定义 Agent 的角色
 * 
 * CrewAI 原始字段:
 *   role: str (e.g., "researcher", "writer")
 *   goal: str (e.g., "Find the latest AI news")
 *   backstory: str (e.g., "You are a seasoned journalist...")
 */
class Role {
  constructor(config = {}) {
    this.role = config.role || 'generalist';
    this.goal = config.goal || '';
    this.backstory = config.backstory || '';
    this.tools = config.tools || [];
    this.llmConfig = config.llmConfig || null;
    this.memoryEnabled = config.memoryEnabled !== false;
    this.guardrails = config.guardrails || [];
  }

  /**
   * 生成 system prompt 用于 LLM
   */
  toSystemPrompt() {
    const parts = [];
    
    if (this.backstory) {
      parts.push(`# 背景\n${this.backstory}`);
    }
    
    parts.push(`# 角色\n你是 ${this.role}。`);
    
    if (this.goal) {
      parts.push(`# 目标\n${this.goal}`);
    }
    
    if (this.tools.length > 0) {
      const toolList = this.tools.map(t => `  - ${t}`).join('\n');
      parts.push(`# 可用工具\n${toolList}`);
    }
    
    return parts.join('\n\n');
  }

  toJSON() {
    return {
      role: this.role,
      goal: this.goal,
      backstory: this.backstory,
      tools: this.tools,
      llmConfig: this.llmConfig,
      memoryEnabled: this.memoryEnabled,
      guardrails: this.guardrails,
    };
  }

  static fromJSON(json) {
    return new Role(json);
  }
}

// ============================================================
// Task Definition
// ============================================================

/**
 * Task - 定义任务
 * 
 * CrewAI 原始字段:
 *   description: str
 *   expected_output: str
 *   agent: Agent (assigned role)
 *   dependencies: Task[] (upstream tasks)
 */
class Task {
  constructor(config = {}) {
    this.id = config.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.description = config.description || '';
    this.expectedOutput = config.expectedOutput || config.expected_output || '';
    this.agentRole = config.agentRole || config.agent_role || null;
    this.dependencies = config.dependencies || [];
    this.outputFile = config.outputFile || config.output_file || null;
    this.context = config.context || [];
    this.tools = config.tools || [];
    this.async = config.async || false;
    this.status = 'pending';  // pending | in_progress | completed | failed
    this.result = null;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
  }

  /**
   * 任务是否可以开始（依赖是否完成）
   */
  canStart() {
    if (this.status !== 'pending') return false;
    return this.dependencies.every(dep => {
      if (typeof dep === 'string') {
        return dep.status === 'completed';
      }
      return dep.status === 'completed';
    });
  }

  /**
   * 开始执行
   */
  start() {
    this.status = 'in_progress';
    this.startedAt = Date.now();
  }

  /**
   * 完成执行
   */
  complete(result) {
    this.status = 'completed';
    this.result = result;
    this.completedAt = Date.now();
  }

  /**
   * 标记失败
   */
  fail(error) {
    this.status = 'failed';
    this.result = { error };
    this.completedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      expectedOutput: this.expectedOutput,
      agentRole: this.agentRole,
      dependencies: this.dependencies.map(d => d.id || d),
      outputFile: this.outputFile,
      context: this.context,
      tools: this.tools,
      async: this.async,
      status: this.status,
      result: this.result,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  static fromJSON(json) {
    const task = new Task(json);
    task.status = json.status || 'pending';
    task.result = json.result || null;
    task.createdAt = json.createdAt || Date.now();
    task.startedAt = json.startedAt || null;
    task.completedAt = json.completedAt || null;
    return task;
  }
}

// ============================================================
// Agent (Role-Bound)
// ============================================================

/**
 * Agent - 基于 Role 的 Agent
 * 
 * CrewAI Agent = Role + Tools + LLM + Memory + Guardrails
 */
class Agent {
  constructor(config = {}) {
    this.id = config.id || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.name = config.name || config.role || 'Agent';
    this.role = config.role instanceof Role ? config.role : new Role(config.role || {});
    this.verbose = config.verbose || false;
    this.maxRetries = config.maxRetries || 3;
    this.allowDelegation = config.allowDelegation !== false;
    
    // Memory
    this.memoryEnabled = config.memoryEnabled !== false;
    this.memoryStore = null;  // Set by Crew
    
    // Execution context
    this.currentTask = null;
    this.taskHistory = [];
  }

  /**
   * 获取 Agent 的 system prompt
   */
  getSystemPrompt(context = {}) {
    const parts = [];
    parts.push(this.role.toSystemPrompt());
    
    if (context.task) {
      parts.push(`# 当前任务\n${context.task.description}`);
    }
    
    if (context.previousResults && context.previousResults.length > 0) {
      const results = context.previousResults
        .map(r => `- ${r.task}: ${r.result}`)
        .join('\n');
      parts.push(`# 已完成任务\n${results}`);
    }
    
    return parts.join('\n\n');
  }

  /**
   * 执行任务
   */
  async execute(task, context = {}) {
    this.currentTask = task;
    task.start();
    
    if (this.verbose) {
      console.log(`[Agent:${this.name}] 执行任务: ${task.description.slice(0, 50)}...`);
    }

    try {
      // 构建执行上下文
      const execContext = {
        ...context,
        task,
        systemPrompt: this.getSystemPrompt(context),
        agent: this,
      };

      // 如果有 memory store，使用它
      if (this.memoryStore && this.memoryEnabled) {
        execContext.memory = this.memoryStore;
      }

      // 调用执行器（由 Crew 设置）
      if (this._executeHandler) {
        const result = await this._executeHandler(execContext);
        task.complete(result);
        this.taskHistory.push({ task, result, timestamp: Date.now() });
        return result;
      }

      // 默认实现：返回占位结果
      const result = {
        taskId: task.id,
        agent: this.name,
        output: `[模拟执行] ${task.description}`,
        status: 'completed',
      };
      
      task.complete(result);
      this.taskHistory.push({ task, result, timestamp: Date.now() });
      return result;

    } catch (error) {
      task.fail(error.message);
      throw error;
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * 设置执行处理器（由 Crew 调用）
   */
  setExecuteHandler(handler) {
    this._executeHandler = handler;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role.toJSON(),
      verbose: this.verbose,
      maxRetries: this.maxRetries,
      allowDelegation: this.allowDelegation,
      memoryEnabled: this.memoryEnabled,
      taskHistory: this.taskHistory,
    };
  }

  static fromJSON(json) {
    const agent = new Agent({
      id: json.id,
      name: json.name,
      role: Role.fromJSON(json.role),
      verbose: json.verbose,
      maxRetries: json.maxRetries,
      allowDelegation: json.allowDelegation,
      memoryEnabled: json.memoryEnabled,
    });
    agent.taskHistory = json.taskHistory || [];
    return agent;
  }
}

// ============================================================
// Process Types
// ============================================================

const ProcessType = {
  SEQUENTIAL: 'sequential',     // 按顺序执行，上游完成后执行下游
  PARALLEL: 'parallel',        // 所有任务并行执行
  HIERARCHICAL: 'hierarchical', // 层级，有一个 manager agent
};

// ============================================================
// Crew
// ============================================================

/**
 * Crew - Role-based Agent Team
 * 
 * CrewAI Crew = Agents[] + Tasks[] + Process
 */
class Crew {
  constructor(config = {}) {
    this.id = config.id || `crew_${Date.now()}`;
    this.name = config.name || 'Crew';
    this.agents = [];
    this.tasks = [];
    this.process = config.process || ProcessType.SEQUENTIAL;
    this.verbose = config.verbose || false;
    
    // Manager for hierarchical process
    this.manager = config.manager || null;
    
    // Memory shared across agents
    this.sharedMemory = {
      agents: {},    // Per-agent memory
      crew: {},      // Shared crew memory
    };
    
    // Results
    this.results = [];
    this.startedAt = null;
    this.completedAt = null;
  }

  /**
   * 添加 Agent
   */
  addAgent(agentConfig) {
    let agent;
    if (agentConfig instanceof Agent) {
      agent = agentConfig;
    } else if (agentConfig.role && typeof agentConfig.role === 'object') {
      agent = new Agent(agentConfig);
    } else {
      agent = new Agent({ role: agentConfig });
    }
    
    this.agents.push(agent);
    
    // 设置 memory store
    if (!this.sharedMemory.agents[agent.id]) {
      this.sharedMemory.agents[agent.id] = {
        taskResults: [],
        context: {},
      };
    }
    agent.memoryStore = this.sharedMemory.agents[agent.id];
    
    return agent;
  }

  /**
   * 添加 Task
   */
  addTask(taskConfig) {
    let task;
    if (taskConfig instanceof Task) {
      task = taskConfig;
    } else {
      task = new Task(taskConfig);
    }
    
    // 解析 agentRole 到具体 Agent
    if (task.agentRole) {
      const agent = this.agents.find(a => 
        a.role.role === task.agentRole || 
        a.name === task.agentRole
      );
      if (agent) {
        task._agent = agent;
      }
    }
    
    this.tasks.push(task);
    return task;
  }

  /**
   * 设置执行处理器（用于连接外部 LLM）
   */
  setExecuteHandler(handler) {
    this._executeHandler = handler;
    this.agents.forEach(agent => {
      agent.setExecuteHandler(async (context) => {
        return handler({
          ...context,
          crew: this,
        });
      });
    });
  }

  /**
   * 执行 Crew
   */
  async kickoff(context = {}) {
    this.startedAt = Date.now();
    this.results = [];
    
    if (this.verbose) {
      console.log(`\n[Crew:${this.name}] 开始执行 (${this.process})`);
      console.log(`  Agents: ${this.agents.map(a => a.name).join(', ')}`);
      console.log(`  Tasks: ${this.tasks.length}`);
    }

    try {
      switch (this.process) {
        case ProcessType.SEQUENTIAL:
          await this._executeSequential(context);
          break;
        case ProcessType.PARALLEL:
          await this._executeParallel(context);
          break;
        case ProcessType.HIERARCHICAL:
          await this._executeHierarchical(context);
          break;
        default:
          throw new Error(`Unknown process: ${this.process}`);
      }
    } finally {
      this.completedAt = Date.now();
    }

    return this._formatResults();
  }

  /**
   * 顺序执行
   */
  async _executeSequential(context = {}) {
    // 构建依赖图
    const taskMap = new Map(this.tasks.map(t => [t.id, t]));
    
    // 找出没有依赖的任务作为起点
    let pendingTasks = this.tasks.filter(t => t.dependencies.length === 0);
    const completedTasks = [];
    
    while (pendingTasks.length > 0) {
      const task = pendingTasks.shift();
      
      // 构建上下文（包含已完成任务的结果）
      const taskContext = {
        ...context,
        previousResults: completedTasks.map(t => ({
          task: t.description,
          result: t.result,
        })),
        crew: this,
      };
      
      // 找到负责的 Agent
      const agent = task._agent || this.agents.find(a => 
        a.role.role === task.agentRole
      );
      
      if (!agent) {
        task.fail(new Error(`No agent found for role: ${task.agentRole}`));
        continue;
      }
      
      // 执行
      const result = await agent.execute(task, taskContext);
      this.results.push({ task, agent: agent.name, result });
      completedTasks.push(task);
      
      // 将完成任务的直接下游加入 pending
      this.tasks.forEach(t => {
        if (t.status === 'pending') {
          const deps = t.dependencies.map(d => typeof d === 'string' ? d : d.id);
          if (deps.includes(task.id) && deps.every(depId => {
            const dep = taskMap.get(depId);
            return dep && dep.status === 'completed';
          })) {
            pendingTasks.push(t);
          }
        }
      });
      
      // 按创建顺序排序（稳定的拓扑序）
      pendingTasks.sort((a, b) => a.createdAt - b.createdAt);
    }
  }

  /**
   * 并行执行
   */
  async _executeParallel(context = {}) {
    // 找出所有可以立即开始的任务（无依赖）
    let readyTasks = this.tasks.filter(t => t.canStart());
    
    // 并行执行所有就绪任务
    const executing = [];
    
    for (const task of readyTasks) {
      const agent = task._agent || this.agents.find(a => 
        a.role.role === task.agentRole
      );
      
      if (agent) {
        const taskContext = { ...context, crew: this };
        executing.push(
          agent.execute(task, taskContext)
            .then(result => {
              this.results.push({ task, agent: agent.name, result });
            })
            .catch(error => {
              task.fail(error);
              this.results.push({ task, agent: agent.name, result: { error: error.message } });
            })
        );
      }
    }
    
    await Promise.allSettled(executing);
  }

  /**
   * 层级执行（Manager 决定任务分配）
   */
  async _executeHierarchical(context = {}) {
    if (!this.manager) {
      throw new Error('Hierarchical process requires a manager agent');
    }
    
    // Manager 分析任务，决定执行顺序
    const taskContext = {
      ...context,
      tasks: this.tasks.map(t => ({
        id: t.id,
        description: t.description,
        agentRole: t.agentRole,
        dependencies: t.dependencies.map(d => typeof d === 'string' ? d : d.id),
      })),
      crew: this,
    };
    
    // Manager 选择下一个任务
    const managerTask = new Task({
      description: '分析任务列表，决定执行顺序并分配给 Agent',
      agentRole: this.manager.role?.role || this.manager,
    });
    
    const managerResult = await this.manager.execute(managerTask, taskContext);
    
    // 解析 Manager 的决策
    // 期望 Manager 返回: { nextTaskId, reasoning }
    if (managerResult && managerResult.nextTaskId) {
      const task = this.tasks.find(t => t.id === managerResult.nextTaskId);
      if (task) {
        const agent = task._agent || this.agents.find(a => 
          a.role.role === task.agentRole
        );
        if (agent) {
          const execContext = { ...context, crew: this };
          const result = await agent.execute(task, execContext);
          this.results.push({ task, agent: agent.name, result });
        }
      }
    }
  }

  /**
   * 格式化结果
   */
  _formatResults() {
    return {
      crew: this.name,
      process: this.process,
      duration: this.completedAt - this.startedAt,
      tasks: this.results.map(r => ({
        task: r.task.description,
        agent: r.agent,
        result: r.result,
        status: r.task.status,
      })),
      raw: this.results,
    };
  }

  /**
   * 获取 Crew 状态
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      process: this.process,
      agents: this.agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role.role,
        status: a.currentTask ? 'busy' : 'idle',
      })),
      tasks: this.tasks.map(t => ({
        id: t.id,
        description: t.description.slice(0, 50),
        agentRole: t.agentRole,
        status: t.status,
      })),
      stats: {
        total: this.tasks.length,
        completed: this.tasks.filter(t => t.status === 'completed').length,
        failed: this.tasks.filter(t => t.status === 'failed').length,
        pending: this.tasks.filter(t => t.status === 'pending').length,
      },
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      agents: this.agents.map(a => a.toJSON()),
      tasks: this.tasks.map(t => t.toJSON()),
      process: this.process,
      verbose: this.verbose,
      results: this.results,
    };
  }
}

// ============================================================
// CrewFactory - CrewAI @CrewBase 装饰器模式的等价物
// ============================================================

/**
 * CrewFactory - CrewAI 的 @CrewBase 装饰器的等价物
 * 
 * 从 YAML/JSON 配置创建 Crew
 * 
 * CrewAI 原始用法:
 * @CrewBase
 * class LatestAiDevelopmentCrew():
 *   agents: List[BaseAgent]
 *   tasks: List[Task]
 * 
 *   @agent
 *   def researcher(self) -> Agent:
 *     return Agent(config=self.agents_config['researcher'])
 * 
 * HeartFlow 等价用法:
 * const crew = CrewFactory.fromConfig({
 *   agents: { researcher: { role: 'researcher', goal: '...', backstory: '...' } },
 *   tasks: { research_task: { description: '...', agentRole: 'researcher' } }
 * });
 */
class CrewFactory {
  /**
   * 从配置对象创建 Crew
   */
  static fromConfig(config) {
    const crew = new Crew({
      name: config.name || 'Crew',
      process: config.process || ProcessType.SEQUENTIAL,
      verbose: config.verbose || false,
    });

    // 创建 Agents
    if (config.agents) {
      Object.entries(config.agents).forEach(([name, agentConfig]) => {
        const agent = crew.addAgent({
          name,
          role: new Role({
            role: agentConfig.role,
            goal: agentConfig.goal,
            backstory: agentConfig.backstory,
            tools: agentConfig.tools || [],
          }),
          verbose: agentConfig.verbose,
        });
      });
    }

    // 创建 Tasks
    if (config.tasks) {
      Object.entries(config.tasks).forEach(([name, taskConfig]) => {
        crew.addTask({
          id: taskConfig.id || name,
          description: taskConfig.description,
          expectedOutput: taskConfig.expected_output || taskConfig.expectedOutput,
          agentRole: taskConfig.agent_role || taskConfig.agentRole,
          dependencies: taskConfig.dependencies || [],
          outputFile: taskConfig.output_file || taskConfig.outputFile,
        });
      });
    }

    // 设置执行处理器
    if (config.executeHandler) {
      crew.setExecuteHandler(config.executeHandler);
    }

    return crew;
  }

  /**
   * 从 YAML 文件创建 Crew
   */
  static fromYAML(yamlPath) {
    try {
      const yaml = require('js-yaml');
      const fs = require('fs');
      const content = fs.readFileSync(yamlPath, 'utf8');
      const config = yaml.load(content);
      return CrewFactory.fromConfig(config);
    } catch (e) {
      throw new Error(`Failed to load Crew from YAML: ${e.message}`);
    }
  }
}

// ============================================================
// 预定义 Role 模板
// ============================================================

const RoleTemplates = {
  researcher: {
    role: 'Researcher',
    goal: 'Find and analyze the most relevant and accurate information',
    backstory: 'You are an experienced researcher with strong analytical skills. You excel at finding credible sources and synthesizing complex information into clear insights.',
    tools: [],
  },
  
  writer: {
    role: 'Writer',
    goal: 'Create clear, engaging content based on research findings',
    backstory: 'You are a skilled writer with a talent for making complex topics accessible. Your writing is precise, engaging, and well-structured.',
    tools: [],
  },
  
  analyst: {
    role: 'Analyst',
    goal: 'Analyze data and provide actionable recommendations',
    backstory: 'You are a data-driven analyst with a keen eye for patterns and trends. You excel at turning raw data into meaningful insights.',
    tools: [],
  },
  
  planner: {
    role: 'Planner',
    goal: 'Break down complex goals into actionable steps',
    backstory: 'You are a strategic thinker who excels at planning and coordination. You naturally see the big picture and know how to structure work into manageable pieces.',
    tools: [],
  },
  
  reviewer: {
    role: 'Reviewer',
    goal: 'Ensure quality and accuracy of outputs',
    backstory: 'You are a thorough reviewer with high standards for quality. You catch errors and inconsistencies others might miss.',
    tools: [],
  },
};

module.exports = {
  Role,
  Task,
  Agent,
  Crew,
  CrewFactory,
  ProcessType,
  RoleTemplates,
};
