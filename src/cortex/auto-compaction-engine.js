/**
 * HeartFlow AutoCompaction Engine v1.2.8
 * 
 * 来源:
 *   - Letta (letta-ai/letta) ⭐22478 - 自动上下文压缩
 *     letta/agents/letta_agent_v3.py: compact() + _step() 压缩触发逻辑
 *     核心: ContextWindowExceededError 触发 → compact_messages() → rebuild system prompt
 *   - Mastra guardrails factory pattern for threshold config
 * 
 * 功能:
 * 1. Token 估算 - 上下文窗口监控
 * 2. 自动压缩触发 - 阈值检测
 * 3. 压缩策略 - trim(删旧) + summarize(压缩)
 * 4. 系统提示重建 - 压缩后更新
 * 5. 压缩事件 - 可选的通知钩子
 * 
 * 吸收来源: self-improving-agent v1.0.2
 * 吸收时间: 2026-05-30
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Token 估算器 (无外部依赖的简单实现)
// ============================================================

/**
 * 简单的 token 估算器
 * 中文: 1 token ≈ 1.5-2 字符
 * 英文: 1 token ≈ 4 字符
 * 这是近似值，实际因模型而异
 */
class SimpleTokenizer {
  constructor() {
    // 中文停用词（压缩时优先删除）
    this.cnStopWords = new Set([
      '的', '了', '是', '在', '和', '与', '对', '为', '以', '上', '中', '下', '将', '把', '被',
      '啊', '呢', '吧', '吗', '呀', '哦', '哈', '嗯', '噢', '嘿', '哎', '唉', '诶', '呃', '喔',
      '这个', '那个', '什么', '怎么', '如何', '为什么', '因为', '所以', '但是', '如果',
    ]);
  }

  /**
   * 估算文本的 token 数量
   * @param {string} text - 输入文本
   * @returns {number} 估算的 token 数
   */
  estimate(text) {
    if (!text || typeof text !== 'string') return 0;
    
    let tokens = 0;
    
    // 中文字符: 1 token ≈ 1.5 字符
    const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    tokens += cnChars * 1.5;
    
    // 英文单词: 1 token ≈ 0.25 词 (4 char/word, 但单词边界不整齐)
    const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
    tokens += enWords * 0.5;  // 更保守的估算
    
    // 其他符号和空格
    const otherChars = text.replace(/[\u4e00-\u9fa5a-zA-Z\s]/g, '').length;
    tokens += otherChars * 0.5;
    
    return Math.ceil(tokens);
  }

  /**
   * 估算消息数组的总 token
   * @param {Array} messages - [{role, content}, ...]
   * @returns {number} 总 token 数
   */
  estimateMessages(messages) {
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((sum, msg) => {
      const content = typeof msg === 'string' ? msg : (msg.content || '');
      const role = msg.role || '';
      return sum + this.estimate(role) + this.estimate(content);
    }, 0);
  }
}

// ============================================================
// 压缩策略
// ============================================================

/**
 * TrimStrategy - 删除最旧的消息直到在限制内
 * 保留: system prompt, 最新的 N 条消息
 */
class TrimStrategy {
  constructor(options = {}) {
    this.keepLatest = options.keepLatest || 10;  // 保留最近 N 条
    this.keepSystem = options.keepSystem !== false;  // 始终保留 system
  }

  /**
   * 压缩消息
   * @param {Array} messages - 原始消息
   * @param {number} maxTokens - 最大 token 数
   * @param {SimpleTokenizer} tokenizer
   * @returns {{ compacted: Array, summary: string, dropped: number }}
   */
  compress(messages, maxTokens, tokenizer) {
    if (!messages || messages.length === 0) {
      return { compacted: [], summary: '[无历史消息]', dropped: 0 };
    }

    // 分离 system 和非 system 消息
    const systemMsgs = this.keepSystem ? messages.filter(m => m.role === 'system') : [];
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');
    const dropped = Math.max(0, nonSystemMsgs.length - this.keepLatest);
    
    // 优先保留最新的消息
    let compacted = [...systemMsgs];
    let accumulatedTokens = tokenizer.estimateMessages(systemMsgs);
    
    // 从最新往最旧加，确保不超过限制
    for (let i = nonSystemMsgs.length - 1; i >= 0 && compacted.length < this.keepLatest + systemMsgs.length; i--) {
      const msg = nonSystemMsgs[i];
      const msgTokens = tokenizer.estimate(msg);
      
      if (accumulatedTokens + msgTokens <= maxTokens) {
        // 插入到 system 之后（保持顺序）
        compacted.push(msg);
        accumulatedTokens += msgTokens;
      } else {
        break;
      }
    }

    const summary = dropped > 0
      ? `[已压缩 ${dropped} 条早期消息，保留最近 ${compacted.length - systemMsgs.length} 条]`
      : '[无压缩]';

    return { compacted, summary, dropped };
  }
}

/**
 * SummarizeStrategy - 用压缩摘要替换旧消息
 * 
 * 注意: 这是一个简化的"伪摘要"实现
 * 真正的 LLM 摘要需要调用外部 LLM API
 * 这里实现的是基于关键词提取的伪摘要
 */
class SummarizeStrategy {
  constructor(options = {}) {
    this.maxSummaryLength = options.maxSummaryLength || 200;  // 摘要最大字符
    this.keepRecent = options.keepRecent || 5;  // 保留最近 N 条完整
  }

  /**
   * 提取关键信息生成伪摘要
   * @param {Array} messages - 要摘要的消息
   * @param {SimpleTokenizer} tokenizer
   * @returns {string} 摘要文本
   */
  _generatePseudoSummary(messages) {
    if (!messages || messages.length === 0) return '[无历史]';

    // 收集所有内容
    const allContent = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        const content = typeof m === 'string' ? m : (m.content || '');
        const role = m.role || 'user';
        return `[${role}]: ${content.slice(0, 100)}`;
      })
      .join('\n');

    // 提取关键词
    const keywords = this._extractKeywords(allContent);
    const topics = this._extractTopics(messages);

    const summary = `[摘要] 讨论了 ${topics.slice(0, 3).join('、')} 等主题。`;
    return summary;
  }

  _extractKeywords(text) {
    // 简单的关键词提取
    const cnWords = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const enWords = text.match(/[a-zA-Z]{4,}/g) || [];
    
    // 合并计数
    const wordCount = {};
    [...cnWords, ...enWords].forEach(w => {
      wordCount[w] = (wordCount[w] || 0) + 1;
    });
    
    // 排序取 top
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);
  }

  _extractTopics(messages) {
    // 简单的主题提取 - 找问句和关键词
    const topics = [];
    messages.forEach(msg => {
      const content = typeof msg === 'string' ? msg : (msg.content || '');
      // 提取问句中的主题
      const questions = content.match(/[?？][^?？]*$/gm);
      if (questions) {
        questions.forEach(q => {
          const clean = q.replace(/[?？]/g, '').trim();
          if (clean.length > 2 && clean.length < 50) {
            topics.push(clean);
          }
        });
      }
    });
    return topics.length > 0 ? topics : ['一般性讨论'];
  }

  compress(messages, maxTokens, tokenizer) {
    if (!messages || messages.length === 0) {
      return { compacted: [], summary: '[无历史消息]', dropped: 0 };
    }

    const systemMsgs = messages.filter(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');
    const recentMsgs = nonSystemMsgs.slice(-this.keepRecent);
    const oldMsgs = nonSystemMsgs.slice(0, -this.keepRecent);
    const dropped = oldMsgs.length;

    // 生成伪摘要
    const summary = this._generatePseudoSummary(oldMsgs);
    
    // 创建摘要消息
    const summaryMsg = {
      role: 'system',
      content: `[历史摘要] ${summary}\n\n注: 详细内容已压缩，此摘要仅保留关键信息。`,
      isSummary: true,
      originalCount: oldMsgs.length,
    };

    // 构建压缩后消息
    let compacted = [...systemMsgs, summaryMsg, ...recentMsgs];
    let tokenCount = tokenizer.estimateMessages(compacted);

    // 如果还是超限，用 trim
    if (tokenCount > maxTokens) {
      const trimmer = new TrimStrategy({ keepLatest: 3, keepSystem: true });
      return trimmer.compress(compacted, maxTokens, tokenizer);
    }

    return { compacted, summary, dropped };
  }
}

// ============================================================
// 主引擎
// ============================================================

class AutoCompactionEngine {
  constructor(options = {}) {
    this.tokenizer = new SimpleTokenizer();
    
    this.config = {
      // 默认 128k context 的 80% 预警
      warningThreshold: options.warningThreshold || 0.80,
      // 90% 开始压缩
      compactionThreshold: options.compactionThreshold || 0.90,
      // 默认上下文限制 (token)
      maxContextTokens: options.maxContextTokens || 100000,
      // 压缩策略: 'trim' | 'summarize'
      strategy: options.strategy || 'trim',
      // 是否自动压缩
      autoCompact: options.autoCompact !== false,
      // 回调
      onCompactionStart: options.onCompactionStart || null,
      onCompactionEnd: options.onCompactionEnd || null,
      onWarning: options.onWarning || null,
      ...options,
    };

    this.stats = {
      totalRuns: 0,
      warnings: 0,
      compactions: 0,
      totalDropped: 0,
      lastCompaction: null,
      strategyUsed: null,
      // --- 可观测性增强 v1.3.0 ---
      // 压缩效率趋势 (每次压缩的比例变化)
      compressionRatios: [],          // 每次压缩前的 context 使用率
      compressionEfficiency: [],      // 每次压缩的节省比例 (节省token/原token)
      totalSavedTokens: 0,            // 累计节省 token 数
      maxConsecutiveCompactions: 0,   // 最大连续压缩次数 (反映上下文压力)
    };

    this._compactionHistory = [];
    this._consecutiveCompactions = 0;   // 当前连续压缩计数
  }

  // ============================================================
  // 核心方法
  // ============================================================

  /**
   * 检查是否需要压缩
   * @param {Array} messages - 当前消息列表
   * @returns {{ needsCompaction: boolean, level: 'ok'|'warning'|'critical', tokenCount: number, ratio: number }}
   */
  check(messages) {
    const tokenCount = this.tokenizer.estimateMessages(messages);
    const ratio = tokenCount / this.config.maxContextTokens;
    
    let level = 'ok';
    if (ratio >= this.config.compactionThreshold) {
      level = 'critical';
    } else if (ratio >= this.config.warningThreshold) {
      level = 'warning';
    }

    return {
      needsCompaction: level === 'critical',
      level,
      tokenCount,
      ratio,
      maxTokens: this.config.maxContextTokens,
    };
  }

  /**
   * 执行压缩
   * @param {Array} messages - 原始消息
   * @param {Object} options - 覆盖配置
   * @returns {{ compacted: Array, summary: string, dropped: number, stats: Object }}
   */
  compact(messages, options = {}) {
    const strategy = options.strategy || this.config.strategy;
    const maxTokens = options.maxTokens || (this.config.maxContextTokens * this.config.compactionThreshold);
    
    // 触发回调
    if (this.config.onCompactionStart) {
      try {
        this.config.onCompactionStart({
          messageCount: messages.length,
          tokenCount: this.tokenizer.estimateMessages(messages),
          strategy,
        });
      } catch (e) {
        // 忽略回调错误
      }
    }

    const startTime = Date.now();
    
    // 选择策略
    let result;
    if (strategy === 'summarize') {
      const summarizer = new SummarizeStrategy(options.summarizeOptions);
      result = summarizer.compress(messages, maxTokens, this.tokenizer);
    } else {
      const trimmer = new TrimStrategy(options.trimOptions);
      result = trimmer.compress(messages, maxTokens, this.tokenizer);
    }

    const duration = Date.now() - startTime;
    const originalTokenCount = this.tokenizer.estimateMessages(messages);
    const compactedTokenCount = this.tokenizer.estimateMessages(result.compacted);
    const savedTokens = Math.max(0, originalTokenCount - compactedTokenCount);
    const efficiency = originalTokenCount > 0 ? savedTokens / originalTokenCount : 0;
    const beforeRatio = originalTokenCount / this.config.maxContextTokens;

    // 更新统计
    this.stats.totalRuns++;
    this.stats.compactions++;
    this.stats.totalDropped += result.dropped;
    this.stats.lastCompaction = Date.now();
    this.stats.strategyUsed = strategy;

    // --- 可观测性增强: 记录压缩效率趋势 ---
    this.stats.compressionRatios.push(beforeRatio);
    this.stats.compressionEfficiency.push(efficiency);
    this.stats.totalSavedTokens += savedTokens;
    this._consecutiveCompactions++;
    if (this._consecutiveCompactions > this.stats.maxConsecutiveCompactions) {
      this.stats.maxConsecutiveCompactions = this._consecutiveCompactions;
    }

    // 记录历史
    this._compactionHistory.push({
      timestamp: Date.now(),
      originalCount: messages.length,
      compactedCount: result.compacted.length,
      dropped: result.dropped,
      strategy,
      duration,
      tokenCount: this.tokenizer.estimateMessages(result.compacted),
    });
    if (this._compactionHistory.length > 100) {
      this._compactionHistory.shift();
    }

    // 触发回调
    if (this.config.onCompactionEnd) {
      try {
        this.config.onCompactionEnd({
          ...result,
          duration,
          strategy,
        });
      } catch (e) {
        // 忽略回调错误
      }
    }

    return {
      ...result,
      stats: {
        originalMessages: messages.length,
        compactedMessages: result.compacted.length,
        dropped: result.dropped,
        strategy,
        duration,
        tokenCount: this.tokenizer.estimateMessages(result.compacted),
      },
    };
  }

  /**
   * 在 agent 运行前自动检查并压缩
   * @param {Array} messages - 当前消息
   * @param {Object} options
   * @returns {{ shouldProceed: boolean, messages: Array, checkResult: Object, compactionResult: Object|null }}
   */
  preFlightCheck(messages, options = {}) {
    const checkResult = this.check(messages);

    // Warning 级别: 通知但不阻止
    if (checkResult.level === 'warning') {
      this.stats.warnings++;
      if (this.config.onWarning) {
        try {
          this.config.onWarning(checkResult);
        } catch (e) { /* 回调异常不影响压缩流程 */ }
      }
    }

    // Critical 级别或 autoCompact: 执行压缩
    if (checkResult.needsCompaction || (this.config.autoCompact && checkResult.level !== 'ok')) {
      const result = this.compact(messages, options);
      return {
        shouldProceed: true,
        messages: result.compacted,
        checkResult,
        compactionResult: result,
        compressed: true,
      };
    }

    return {
      shouldProceed: true,
      messages,
      checkResult,
      compactionResult: null,
      compressed: false,
    };
  }

  // ============================================================
  // 统计和状态
  // ============================================================

  getStats() {
    const hist = this._compactionHistory;
    const avgEfficiency = this.stats.compressionEfficiency.length > 0
      ? this.stats.compressionEfficiency.reduce((a, b) => a + b, 0) / this.stats.compressionEfficiency.length
      : 0;
    return {
      ...this.stats,
      historyLength: hist.length,
      averageCompressionEfficiency: Number(avgEfficiency.toFixed(4)),
      totalSavedTokens: this.stats.totalSavedTokens,
      maxConsecutiveCompactions: this.stats.maxConsecutiveCompactions,
      // 简化历史大小以避免超大对象
      compressionRatios: this.stats.compressionRatios.slice(-10),
      compressionEfficiency: this.stats.compressionEfficiency.slice(-10),
    };
  }

  getStatus() {
    const recent = this._compactionHistory.slice(-5);
    return {
      config: {
        maxContextTokens: this.config.maxContextTokens,
        warningThreshold: this.config.warningThreshold,
        compactionThreshold: this.config.compactionThreshold,
        strategy: this.config.strategy,
        autoCompact: this.config.autoCompact,
      },
      stats: this.getStats(),
      recentCompactions: recent.map(h => ({
        timestamp: new Date(h.timestamp).toISOString(),
        dropped: h.dropped,
        strategy: h.strategy,
        duration: h.duration,
      })),
    };
  }

  /**
   * 生成人类可读的诊断报告
   * @returns {string} 格式化的状态报告
   */
  getReport() {
    const stats = this.getStats();
    const lines = [];
    lines.push('═══════════════════════════════════════');
    lines.push('  AutoCompaction 引擎诊断报告');
    lines.push('═══════════════════════════════════════');
    lines.push(`  运行总次数:           ${stats.totalRuns}`);
    lines.push(`  压缩执行次数:         ${stats.compactions}`);
    lines.push(`  警告触发次数:         ${stats.warnings}`);
    lines.push(`  累计丢弃消息:         ${stats.totalDropped}`);
    lines.push(`  累计节省 Token:      ${stats.totalSavedTokens.toLocaleString()}`);
    if (stats.compactions > 0) {
      lines.push(`  平均压缩效率:         ${(stats.averageCompressionEfficiency * 100).toFixed(1)}%`);
      lines.push(`  历史最高连续压缩:     ${stats.maxConsecutiveCompactions} 次`);
      lines.push(`  最近压缩比率趋势:     [${stats.compressionRatios.map(r => (r * 100).toFixed(0) + '%').join(' → ')}]`);
      lines.push(`  最近压缩效率趋势:     [${stats.compressionEfficiency.map(e => (e * 100).toFixed(0) + '%').join(' → ')}]`);
    }
    lines.push(`  当前策略:             ${this.config.strategy}`);
    lines.push(`  上下文限制:           ${this.config.maxContextTokens.toLocaleString()} tokens`);
    lines.push(`  预警阈值:             ${(this.config.warningThreshold * 100).toFixed(0)}%`);
    lines.push(`  压缩阈值:             ${(this.config.compactionThreshold * 100).toFixed(0)}%`);
    lines.push(`  最近压缩记录:         ${stats.recentCompactions ? stats.recentCompactions.length : 0} 条`);
    lines.push('───────────────────────────────────────');
    return lines.join('\n');
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      totalRuns: 0,
      warnings: 0,
      compactions: 0,
      totalDropped: 0,
      lastCompaction: null,
      strategyUsed: null,
      compressionRatios: [],
      compressionEfficiency: [],
      totalSavedTokens: 0,
      maxConsecutiveCompactions: 0,
    };
    this._compactionHistory = [];
    this._consecutiveCompactions = 0;
  }
}

// ============================================================
// 与 BlockMemory 的集成
// ============================================================

/**
 * 集成到 BlockMemory 的压缩层
 * 当 BlockMemory 接近限制时触发压缩
 */
class BlockMemoryCompaction {
  constructor(blockMemory, options = {}) {
    this.blockMemory = blockMemory;
    this.compactionEngine = new AutoCompactionEngine(options);
  }

  /**
   * 在写入前检查是否需要压缩
   */
  preWriteCheck(blockId, newContent) {
    // 获取当前所有 blocks 的内容
    const allBlocks = this.blockMemory.getAllBlocks();
    const totalTokens = this.compactionEngine.tokenizer.estimateMessages(
      allBlocks.map(b => b.value || b.content || '')
    );

    const newTokens = this.compactionEngine.tokenizer.estimate(newContent);
    const projectedTotal = totalTokens + newTokens;
    const projectedRatio = projectedTotal / this.compactionEngine.config.maxContextTokens;

    if (projectedRatio >= this.compactionEngine.config.compactionThreshold) {
      // 需要压缩
      const messages = allBlocks.map(b => ({
        role: b.label || 'block',
        content: b.value || b.content || '',
      }));

      const result = this.compactionEngine.compact(messages);
      return {
        needsCompaction: true,
        compactionResult: result,
        projectedTokens: projectedTotal,
      };
    }

    return {
      needsCompaction: false,
      projectedTokens: projectedTotal,
    };
  }
}

module.exports = {
  AutoCompactionEngine,
  SimpleTokenizer,
  TrimStrategy,
  SummarizeStrategy,
  BlockMemoryCompaction,
};
