/**
 * HeartFlow Context-Memory Bridge v11.25.0
 * 
 * 升级来源:
 *   MemGPT (cpacker/MemGPT, ⭐14000+) - Letta
 *   核心: ContextWindowExceededError → self_summarize_all → 摘要存入memory
 *   thresholds.py: GPT-5 90% proactive, 其他 100%
 *   self_summarizer.py: agent 调用自己的 LLM 做真实摘要
 * 
 * 升级内容:
 * 1. ContextMemoryBridge - 把 compaction engine 和 meaningful-memory 连起来
 * 2. RealLLMSummarizer - 调用实际 LLM 生成真实摘要（不只是关键词提取）
 * 3. CompactionTrigger - 模型感知的阈值（GPT-5: 90%, 其他: 95%）
 * 4. MemoryPersistenceHook - compaction 后自动把摘要存入 meaningful-memory
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// LLM 摘要器 - 调用实际 LLM 生成真实摘要
// ============================================================

class RealLLMSummarizer {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.XIAOMI_API_KEY || process.env.OPENAI_API_KEY;
    this.endpoint = options.endpoint || 'https://api.minimax.chat/v1';
    this.model = options.model || 'MiniMax-Text-01';
    this.maxTokens = options.maxTokens || 500;
    this.promptTemplate = options.promptTemplate || 
      '请用50字以内总结以下对话的核心内容，保留关键决策和结论:\n\n{messages}';
  }

  /**
   * 生成真实摘要 - 调用 LLM
   * @param {Array} messages - 要摘要的消息 [{role, content}, ...]
   * @param {Object} context - 额外上下文（用户信息、项目状态等）
   * @returns {Promise<string>} 摘要文本
   */
  async summarize(messages, context = {}) {
    if (!messages || messages.length === 0) return '[空对话]';
    if (messages.length <= 3) return '[对话过短，无需摘要]';

    // 格式化消息
    const formattedMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => `【${m.role}】${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
      .join('\n');

    const prompt = this.promptTemplate
      .replace('{messages}', formattedMessages.slice(-2000)); // 限制输入长度

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.maxTokens,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '[摘要生成失败]';
    } catch (error) {
      console.error('[RealLLMSummarizer] 摘要失败:', error.message);
      return `[摘要生成失败: ${error.message}]`;
    }
  }
}

// ============================================================
// 模型感知阈值计算器
// ============================================================

class CompactionThreshold {
  constructor() {
    // GPT-5 家族: 90% proactive（MemGPT 观测到 272k 窗口易超限）
    this.gpt5Pattern = /(^|\/)gpt-5($|[.-])/i;
    // 模型 context window 默认值（128k）
    this.defaultContextWindow = 128000;
    // 输出 buffer（防止 max_output_tokens 超出）
    this.outputBuffer = 2000;
  }

  /**
   * 获取模型 context window
   */
  getContextWindow(modelName) {
    const known = {
      'gpt-5': 272000,
      'gpt-4-turbo': 128000,
      'gpt-4o': 128000,
      'claude-3-5': 200000,
      'claude-3': 200000,
      'gemini-2': 1000000,
    };
    for (const [model, window] of Object.entries(known)) {
      if (modelName?.toLowerCase().includes(model)) return window;
    }
    return this.defaultContextWindow;
  }

  /**
   * 计算 compaction 触发阈值（token 数）
   */
  getThreshold(modelName, forceProactive = false) {
    const window = this.getContextWindow(modelName);
    const isGPT5 = this.gpt5Pattern.test(modelName || '');
    
    // GPT-5 或 forceProactive: 90%
    // 其他: 95%（留 5% 给输出）
    const ratio = (isGPT5 || forceProactive) ? 0.90 : 0.95;
    return Math.floor(window * ratio) - this.outputBuffer;
  }

  /**
   * 检查是否需要 compaction
   */
  needsCompaction(currentTokens, modelName, forceProactive = false) {
    const threshold = this.getThreshold(modelName, forceProactive);
    return currentTokens >= threshold;
  }
}

// ============================================================
// 上下文-记忆 桥接器
// ============================================================

class ContextMemoryBridge {
  constructor(options = {}) {
    this.summarizer = options.summarizer || new RealLLMSummarizer();
    this.threshold = options.threshold || new CompactionThreshold();
    this.meaningfulMemory = null; // 延迟加载
    this.modelName = options.modelName || null;
    this.stats = {
      compactions: 0,
      summariesStored: 0,
      tokensSaved: 0,
      lastCompaction: null,
    };
  }

  /**
   * 延迟加载 MeaningfulMemory
   */
  _getMeaningfulMemory() {
    if (!this.meaningfulMemory) {
      try {
        const { MeaningfulMemory } = require('./meaningful-memory.js');
        this.meaningfulMemory = new MeaningfulMemory();
      } catch (e) {
        console.error('[ContextMemoryBridge] MeaningfulMemory 加载失败:', e.message);
      }
    }
    return this.meaningfulMemory;
  }

  /**
   * 执行 compaction 并持久化
   * @param {Array} messages - 当前消息列表
   * @param {Object} options - {modelName, storeSummary, ...}
   * @returns {Promise<{compacted, summary, dropped, stats}>}
   */
  async compactAndStore(messages, options = {}) {
    const modelName = options.modelName || this.modelName;
    const storeSummary = options.storeSummary !== false;
    const startTime = Date.now();
    const originalCount = messages.length;
    const originalTokens = this._estimateTokens(messages);

    // 1. 生成真实摘要
    const summary = await this.summarizer.summarize(messages);

    // 2. 构建压缩后的消息（保留 system + 最新 N 条 + 摘要）
    const compacted = this._buildCompactedMessages(messages, summary);

    // 3. 估算节省
    const newTokens = this._estimateTokens(compacted);
    const tokensSaved = originalTokens - newTokens;

    // 4. 存入 meaningful-memory（如果启用）
    if (storeSummary && summary && !summary.startsWith('[')) {
      const mm = this._getMeaningfulMemory();
      if (mm) {
        try {
          mm.remember({
            type: 'compaction_summary',
            key: `compaction_${Date.now()}`,
            value: summary,
            reason: `上下文压缩摘要，节省 ${tokensSaved} tokens，原始消息 ${originalCount} 条`,
            selfVerifyScore: 0.8,
          });
          this.stats.summariesStored++;
        } catch (e) {
          console.error('[ContextMemoryBridge] 摘要存储失败:', e.message);
        }
      }
    }

    // 5. 更新统计
    this.stats.compactions++;
    this.stats.tokensSaved += tokensSaved;
    this.stats.lastCompaction = Date.now();

    return {
      compacted,
      summary,
      dropped: originalCount - compacted.length,
      tokensSaved,
      duration: Date.now() - startTime,
      stats: {
        originalCount,
        compactedCount: compacted.length,
        originalTokens,
        newTokens,
        tokensSaved,
      }
    };
  }

  /**
   * 检查是否需要 compaction
   */
  checkNeedsCompaction(messages) {
    const tokens = this._estimateTokens(messages);
    return {
      needs: this.threshold.needsCompaction(tokens, this.modelName),
      tokens,
      threshold: this.threshold.getThreshold(this.modelName),
      ratio: (tokens / this.threshold.getThreshold(this.modelName) * 100).toFixed(1) + '%',
    };
  }

  /**
   * 构建压缩后的消息
   */
  _buildCompactedMessages(messages, summary) {
    const systemMsgs = messages.filter(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');
    const keepRecent = 3; // 保留最近 3 条

    const recentMsgs = nonSystemMsgs.slice(-keepRecent);
    const summaryMsg = {
      role: 'system',
      content: `[历史摘要] ${summary}\n\n此前对话已被压缩。`,
      isCompactionSummary: true,
    };

    return [...systemMsgs, summaryMsg, ...recentMsgs];
  }

  /**
   * 简单 token 估算
   */
  _estimateTokens(messages) {
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((sum, msg) => {
      const text = typeof msg === 'string' ? msg : (msg.content || '');
      const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
      return sum + Math.ceil(cnChars * 1.5 + enWords * 0.5);
    }, 0);
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = {
  RealLLMSummarizer,
  CompactionThreshold,
  ContextMemoryBridge,
};
