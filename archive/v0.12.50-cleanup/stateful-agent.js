/**
 * HeartFlow Stateful Agent v11.7.6
 * 
 * 整合:
 *   - Letta ⭐22430 - 有状态智能体 + 记忆管理
 *   - lang-memgpt - 记忆层架构
 *   - Generative Agents - 动态记忆
 *   - Mem0 ⭐54765 - Multi-Signal Memory (语义+BM25+实体 三信号融合)
 * 
 * 核心概念:
 *   1. Block-based Memory - 分块记忆
 *   2. 多种 Memory Type - core, recall, archival, summary
 *   3. 状态持久化 - 跨会话保持
 *   4. 记忆检索 - 语义 + 关键词 + 实体 三信号融合
 *   5. Agent Facts - 确认的行动同等权重存储
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '../../data/stateful-agent');

class StatefulAgent {
  constructor(options = {}) {
    this.id = options.id || this._generateId();
    this.name = options.name || 'StatefulAgent';
    this.model = options.model || 'gpt-4o';
    
    // Letta 风格的记忆块
    this.memory = new AgentMemory(options.memoryOptions);
    
    // 状态
    this.state = {
      createdAt: Date.now(),
      lastActive: Date.now(),
      stepCount: 0,
      turnCount: 0,
    };
    
    // 工具
    this.tools = [];
    
    // 消息历史
    this.messageHistory = [];
    
    this._loadState();
  }

  // ============================================================
  // 记忆操作
  // ============================================================

  /**
   * 保存到核心记忆 (Letta: core_memory)
   * 核心记忆 = 身份、目标、关键事实
   */
  saveCoreMemory(content, options = {}) {
    return this.memory.saveBlock({
      content,
      memoryType: 'core',
      label: options.label || 'core',
      importance: options.importance || 1.0,
      source: options.source || 'agent',
    });
  }

  /**
   * 保存到召回记忆 (Letta: recall_memory)
   */
  saveRecallMemory(content, options = {}) {
    return this.memory.saveBlock({
      content,
      memoryType: 'recall',
      importance: options.importance || 0.5,
      source: options.source || 'interaction',
    });
  }

  /**
   * 获取所有核心记忆
   */
  getCoreMemories() {
    return this.memory.getBlocks('core');
  }

  /**
   * 检索记忆 (混合: 语义 + 关键词)
   */
  recall(query, options = {}) {
    return this.memory.recall(query, options);
  }

  // ============================================================
  // 步骤循环 (Letta agent step)
  // ============================================================

  /**
   * 执行一步 (Letta agent.step)
   */
  async step(input, context = {}) {
    this.state.stepCount++;
    this.state.lastActive = Date.now();

    const stepResult = {
      stepNumber: this.state.stepCount,
      input,
      memorySnapshot: this.memory.summarizeRecent(5),
      response: null,
    };

    // 1. 准备上下文
    const contextWindow = this._buildContextWindow(input, context);
    
    // 2. 获取 LLM 回复 (抽象，实际由子类实现)
    const llmResponse = await this._getResponse(contextWindow);
    stepResult.response = llmResponse;
    
    // 3. 处理回复
    if (llmResponse.tool_calls) {
      stepResult.toolCalls = await this._executeTools(llmResponse.tool_calls);
    }
    
    // 4. 更新记忆
    await this._updateMemoryAfterStep(input, llmResponse, stepResult);
    
    // 5. 添加到历史
    this.messageHistory.push({
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });
    this.messageHistory.push({
      role: 'assistant',
      content: llmResponse.content,
      timestamp: Date.now(),
    });

    // 保存状态
    this._saveState();

    return stepResult;
  }

  /**
   * 获取回复 (子类实现)
   */
  async _getResponse(contextWindow) {
    // 实际由外部 LLM 提供
    return {
      content: `[Response from ${this.name}]`,
      tool_calls: null,
    };
  }

  /**
   * 执行工具
   */
  async _executeTools(toolCalls) {
    const results = [];
    
    for (const call of toolCalls) {
      const name = call.function?.name || call.name;
      const args = typeof call.function?.arguments === 'string' 
        ? JSON.parse(call.function.arguments)
        : (call.function?.arguments || {});
      
      // 查找工具
      const tool = this.tools.find(t => t.name === name);
      if (tool) {
        try {
          const result = await tool.fn(args);
          results.push({ tool: name, result, success: true });
          
          // 自动保存到记忆
          this.saveRecallMemory(`Tool ${name} executed: ${JSON.stringify(result).substring(0, 100)}`, {
            source: 'tool_execution',
          });
        } catch (e) {
          results.push({ tool: name, error: e.message, success: false });
        }
      } else {
        results.push({ tool: name, error: 'Tool not found', success: false });
      }
    }
    
    return results;
  }

  /**
   * 构建上下文窗口
   */
  _buildContextWindow(input, context = {}) {
    const coreMemories = this.getCoreMemories();
    const recentContext = this.memory.summarizeRecent(10);
    const relevantRecall = this.recall(input, { limit: 3 });

    return {
      system: this._getSystemPrompt(),
      coreMemories,
      recentContext,
      relevantRecall,
      currentInput: input,
      context,
    };
  }

  /**
   * 获取系统提示
   */
  _getSystemPrompt() {
    return `You are ${this.name}, a stateful AI agent.`;
  }

  /**
   * 步骤后更新记忆
   */
  async _updateMemoryAfterStep(input, response, stepResult) {
    // 重要内容保存到记忆
    if (input.length > 50) {
      this.saveRecallMemory(`User input: ${input.substring(0, 200)}`, {
        source: 'user_input',
        importance: 0.6,
      });
    }
    
    if (response.content && response.content.length > 50) {
      this.saveRecallMemory(`Response: ${response.content.substring(0, 200)}`, {
        source: 'assistant_output',
        importance: 0.5,
      });
    }
  }

  // ============================================================
  // 状态持久化 (Letta 风格)
  // ============================================================

  _getStatePath() {
    return path.join(STATE_DIR, `${this.id}.json`);
  }

  _saveState() {
    try {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      
      const stateData = {
        id: this.id,
        name: this.name,
        model: this.model,
        state: this.state,
        memory: this.memory.export(),
        messageHistory: this.messageHistory.slice(-100), // 只保留最近100条
        savedAt: Date.now(),
      };
      
      fs.writeFileSync(this._getStatePath(), JSON.stringify(stateData, null, 2));
    } catch (e) {
      console.log('[StatefulAgent] Save failed:', e.message);
    }
  }

  _loadState() {
    try {
      if (!fs.existsSync(STATE_DIR)) return;
      
      const statePath = this._getStatePath();
      if (!fs.existsSync(statePath)) return;
      
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      
      // 恢复状态
      this.state = { ...this.state, ...data.state };
      this.messageHistory = data.messageHistory || [];
      
      // 恢复记忆
      if (data.memory) {
        this.memory.import(data.memory);
      }
      
      console.log(`[StatefulAgent] Loaded state for ${this.name}`);
    } catch (e) {
      console.log('[StatefulAgent] Load failed:', e.message);
    }
  }

  // ============================================================
  // 工具管理
  // ============================================================

  registerTool(tool) {
    this.tools.push({
      name: tool.name,
      description: tool.description || '',
      fn: tool.fn,
    });
    return this;
  }

  // ============================================================
  // 工具方法
  // ============================================================

  _generateId() {
    return `sa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  stats() {
    return {
      version: '11.7.5',
      id: this.id,
      name: this.name,
      state: this.state,
      memory: this.memory.stats(),
      toolCount: this.tools.length,
    };
  }
}

// ============================================================
// AgentMemory - 分块记忆系统 (Letta + Mem0 融合)
// Mem0 Multi-Signal Memory 作为底层引擎，支持语义+BM25+实体三信号融合检索
// ============================================================

class AgentMemory {
  constructor(options = {}) {
    // 底层: Mem0 MultiSignalMemory
    this._mem0 = new (require('./mem0-memory.js').MultiSignalMemory)({
      topK: options.recallTopK || 10,
      embeddingDim: 256,
    });
    
    // 兼容层: 分块索引 (Letta 风格)
    this.blocks = [];           // 所有记忆块
    this.blockIndex = {};       // 按类型索引: { core: [id, ...], recall: [...] }
    
    this.maxBlocks = options.maxBlocks || 500;
    this.recallTopK = options.recallTopK || 10;
    
    // 加载已有数据
    this._loadFromMem0();
  }

  /**
   * 从 Mem0 内存加载块索引 (启动时)
   */
  _loadFromMem0() {
    const all = this._mem0.getAll();
    this.blocks = all.map(m => ({
      id: m.id,
      content: m.content,
      memoryType: m.metadata?.memoryType || 'recall',
      label: m.metadata?.label || null,
      importance: m.metadata?.importance || 0.5,
      createdAt: m.createdAt,
      lastAccessed: Date.now(),
      accessCount: 0,
      source: m.source,
      reinforcementCount: m.reinforcementCount,
    }));
    
    // 重建索引
    this.blocks.forEach(block => {
      if (!this.blockIndex[block.memoryType]) {
        this.blockIndex[block.memoryType] = [];
      }
      this.blockIndex[block.memoryType].push(block.id);
    });
  }

  /**
   * 保存记忆块 (Letta 风格)
   * 同时写入 Mem0 MultiSignalMemory
   */
  saveBlock(block) {
    // 写入 Mem0 (ADD-only)
    const mem0Mem = this._mem0.add({
      content: block.content,
      metadata: {
        blockId: block.id,
        memoryType: block.memoryType || 'recall',
        label: block.label || null,
        importance: block.importance || 0.5,
      },
      source: block.source || 'agent',
    });
    
    const memBlock = {
      id: mem0Mem.id,
      content: block.content,
      memoryType: block.memoryType || 'recall',
      label: block.label || null,
      importance: block.importance || 0.5,
      createdAt: mem0Mem.createdAt,
      lastAccessed: Date.now(),
      accessCount: 0,
      source: block.source || 'agent',
      reinforcementCount: 0,
    };
    
    this.blocks.push(memBlock);
    
    // 更新索引
    if (!this.blockIndex[memBlock.memoryType]) {
      this.blockIndex[memBlock.memoryType] = [];
    }
    this.blockIndex[memBlock.memoryType].push(memBlock.id);
    
    // 限制总数
    if (this.blocks.length > this.maxBlocks) {
      this._pruneOldest();
    }
    
    return memBlock;
  }

  /**
   * 添加 Agent 确认的事实 (Mem0 first-class fact)
   */
  saveAgentFact(content, metadata = {}) {
    const mem0Mem = this._mem0.addAgentFact(content, {
      ...metadata,
      memoryType: 'recall',
    });
    
    const block = {
      id: mem0Mem.id,
      content,
      memoryType: 'recall',
      label: 'agent_fact',
      importance: 0.8,
      createdAt: mem0Mem.createdAt,
      lastAccessed: Date.now(),
      accessCount: 0,
      source: 'agent',
      reinforcementCount: 1,
    };
    
    this.blocks.push(block);
    if (!this.blockIndex.recall) this.blockIndex.recall = [];
    this.blockIndex.recall.push(block.id);
    
    return block;
  }

  /**
   * 确认/强化已有记忆
   */
  reinforce(memoryId, additionalContent = null) {
    return this._mem0.reinforce(memoryId, additionalContent);
  }

  /**
   * 获取某类型的记忆
   */
  getBlocks(type) {
    const ids = this.blockIndex[type] || [];
    return ids
      .map(id => this.blocks.find(b => b.id === id))
      .filter(Boolean)
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * 检索记忆 (Mem0 Multi-Signal 检索)
   * 语义 + BM25 + 实体 三信号融合
   */
  recall(query, options = {}) {
    const { limit = this.recallTopK, memoryType = null } = options;
    
    // 使用 Mem0 多信号检索
    const filter = {};
    if (memoryType) filter.memoryType = memoryType;
    
    const result = this._mem0.search(query, { topK: limit, filters: filter });
    
    // 更新访问统计
    result.results.forEach(r => {
      const block = this.blocks.find(b => b.id === r.id);
      if (block) {
        block.accessCount++;
        block.lastAccessed = Date.now();
      }
    });
    
    // 返回 Letta 风格的格式
    return result.results.map(r => {
      const block = this.blocks.find(b => b.id === r.id) || {};
      return {
        id: r.id,
        content: r.content,
        score: r.score,
        memoryType: r.metadata?.memoryType || block.memoryType || 'recall',
        label: r.metadata?.label || block.label,
        importance: r.metadata?.importance || block.importance || 0.5,
        source: r.source,
        reinforcementCount: r.reinforcementCount,
        createdAt: r.createdAt,
      };
    });
  }

  /**
   * 关键词检索 (BM25)
   */
  searchKeywords(query, options = {}) {
    const { limit = this.recallTopK } = options;
    const results = this._mem0.memories.bm25.search(query, limit);
    return results.map(r => ({
      id: r.docId,
      content: this._mem0.memories.memories.get(r.docId)?.content,
      bm25Score: r.score,
    })).filter(r => r.content);
  }

  /**
   * 实体查询
   */
  searchEntities(entityName) {
    const normalized = entityName.toLowerCase();
    const memoryIds = this._mem0.memories.entityIndex.get(normalized);
    if (!memoryIds) return [];
    return Array.from(memoryIds).map(id => this.blocks.find(b => b.id === id)).filter(Boolean);
  }

  /**
   * 清理旧记忆
   */
  _pruneOldest() {
    const oldest = this.blocks
      .filter(b => b.memoryType !== 'core')  // core 块不删除
      .sort((a, b) => a.lastAccessed - b.lastAccessed)
      .slice(0, Math.ceil(this.maxBlocks * 0.1));
    
    oldest.forEach(block => {
      // 从 Mem0 移除
      this._mem0.memories.memories.delete(block.id);
      
      // 从索引移除
      const typeIndex = this.blockIndex[block.memoryType];
      if (typeIndex) {
        const idx = typeIndex.indexOf(block.id);
        if (idx >= 0) typeIndex.splice(idx, 1);
      }
      
      // 从 blocks 移除
      const blockIdx = this.blocks.findIndex(b => b.id === block.id);
      if (blockIdx >= 0) this.blocks.splice(blockIdx, 1);
    });
  }

  stats() {
    const mem0Stats = this._mem0.memories.stats();
    return {
      totalBlocks: this.blocks.length,
      coreBlocks: (this.blockIndex.core || []).length,
      recallBlocks: (this.blockIndex.recall || []).length,
      agentFacts: this.blocks.filter(b => b.reinforcementCount > 0).length,
      mem0: mem0Stats,
    };
  }
}

// v11.43.1 PAPER INJECTION: MemoryWorth [10] arXiv:2604
const _p11 = require('./papers/v11_43_1_integration.js');
const memoryWorth = new _p11.MemoryWorth();

StatefulAgent.prototype.recordMemoryWorth = function(memoryId, success) {
  memoryWorth.record(memoryId, success);
};

StatefulAgent.prototype.getMemoryWorth = function(memoryId) {
  return memoryWorth.worth(memoryId);
};

StatefulAgent.prototype.shouldKeepMemory = function(memoryId, threshold = 0.5) {
  return memoryWorth.shouldKeep(memoryId, threshold);
};

// Evict low-worth memories on demand
StatefulAgent.prototype.evictLowWorthMemories = function(threshold = 0.5) {
  const before = this.blocks.length;
  this.blocks = this.blocks.filter(b => memoryWorth.shouldKeep(b.id || b.label, threshold));
  return { evicted: before - this.blocks.length, remaining: this.blocks.length };
};

module.exports = { StatefulAgent, AgentMemory };
