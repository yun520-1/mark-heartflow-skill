/**
 * HeartFlow Permanent Memory Archiver v11.26.0
 * 
 * 功能: 压缩时被删除的消息 → 提取关键信息 → 存入 meaningful-memory（永久记忆）
 * 
 * 核心逻辑:
 * 1. 压缩时，被删除的消息不丢弃，而是提取关键信息
 * 2. 存入 meaningful-memory 的 CORE 或 LEARNED 层
 * 3. 以后可通过 recall() 召回，恢复上下文
 */

const path = require('path');

// ============================================================
// 消息内容提取器
// ============================================================

class MessageArchiver {
  constructor(options = {}) {
    this.maxKeyLength = options.maxKeyLength || 60;
    this.maxValueLength = options.maxValueLength || 500;
  }

  /**
   * 从一条消息中提取关键信息
   * @param {Object} message - { role, content, _importanceScore, ... }
   * @returns {Object} - { key, value, type, reason, metadata }
   */
  extract(message) {
    const content = typeof message === 'string' ? message : (message.content || '');
    const role = message.role || 'unknown';

    // 生成唯一 key
    const key = this._generateKey(content, role);
    
    // 提取类型
    const { type, reason } = this._classifyContent(content, role);

    // 提取后的值（可能经过裁剪）
    const value = content.substring(0, this.maxValueLength);

    return {
      key,
      value,
      type,
      reason,
      metadata: {
        originalRole: role,
        originalLength: content.length,
        importanceScore: message._importanceScore || 0,
        archivedAt: Date.now(),
        summary: this._generateBrief(content),  // 一句话摘要
      },
    };
  }

  /**
   * 从多条消息中提取关键信息
   * @param {Array} messages - 消息数组
   * @returns {Array} - 提取的记忆数组
   */
  extractBatch(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const memories = [];
    const seen = new Set();

    for (const msg of messages) {
      const extracted = this.extract(msg);
      
      // 去重：如果 key 已存在，追加到已有值
      if (seen.has(extracted.key)) {
        const existing = memories.find(m => m.key === extracted.key);
        if (existing && existing.value !== extracted.value) {
          existing.value = existing.value.substring(0, this.maxValueLength - 100) + '...\n[追加] ' + extracted.value.substring(0, 100);
          existing.metadata.appendCount = (existing.metadata.appendCount || 1) + 1;
        }
        continue;
      }

      seen.add(extracted.key);
      memories.push(extracted);
    }

    return memories;
  }

  /**
   * 生成简短摘要（用于 recall 时快速预览）
   */
  _generateBrief(content) {
    if (!content) return '';
    // 取前 100 字符
    const brief = content.substring(0, 100).trim();
    return brief.length < content.length ? brief + '...' : brief;
  }

  /**
   * 生成唯一 key
   */
  _generateKey(content, role) {
    // 基于内容 hash 生成稳定 key
    const hash = this._simpleHash(content.substring(0, 100));
    const prefix = this._getRolePrefix(role);
    return `${prefix}_${hash}`;
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;  // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  _getRolePrefix(role) {
    const prefixes = {
      user: 'usr',
      assistant: 'asst',
      system: 'sys',
      tool: 'tool',
    };
    return prefixes[role] || 'msg';
  }

  /**
   * 分类消息内容
   */
  _classifyContent(content, role) {
    const lower = content.toLowerCase();

    // 用户问题 → 记录为 question
    if (role === 'user' && (lower.includes('?') || lower.includes('？') || lower.includes('怎么') || lower.includes('如何') || lower.includes('为什么'))) {
      return {
        type: 'archived_question',
        reason: '压缩前的用户问题',
      };
    }

    // AI 回答 → 记录为 answer
    if (role === 'assistant') {
      if (lower.includes('升级') || lower.includes('v11') || lower.includes('版本')) {
        return {
          type: 'archived_upgrade',
          reason: '压缩前的升级相关信息',
        };
      }
      if (lower.includes('错误') || lower.includes('失败') || lower.includes('修复')) {
        return {
          type: 'archived_fix',
          reason: '压缩前的错误修复信息',
        };
      }
      return {
        type: 'archived_response',
        reason: '压缩前的 AI 响应',
      };
    }

    // 系统消息 → 记录为 system_event
    if (role === 'system') {
      return {
        type: 'archived_system',
        reason: '压缩前的系统事件',
      };
    }

    return {
      type: 'archived_content',
      reason: '压缩前的一般内容',
    };
  }
}

// ============================================================
// 永久记忆归档器
// ============================================================

class PermanentMemoryArchiver {
  constructor(options = {}) {
    this.archiver = new MessageArchiver(options);
    this.memoryModule = null;  // 延迟加载
    this.stats = {
      messagesArchived: 0,
      memoriesStored: 0,
      batchesProcessed: 0,
    };
  }

  /**
   * 获取 MeaningfulMemory 实例
   */
  _getMemoryModule() {
    if (!this.memoryModule) {
      try {
        this.memoryModule = require('./meaningful-memory.js');
      } catch (e) {
        return null;
      }
    }
    return this.memoryModule;
  }

  /**
   * 归档一批消息到永久记忆
   * @param {Array} messages - 要归档的消息
   * @param {Object} options - { level: 'core'|'learned', source: string }
   * @returns {Object} - { stored: number, keys: string[] }
   */
  archive(messages, options = {}) {
    const MemModule = this._getMemoryModule();
    if (!MemModule) {
      console.warn('[PermanentMemoryArchiver] 无法加载 meaningful-memory');
      return { stored: 0, keys: [] };
    }

    const level = options.level || 'learned';  // 默认 learned，不轻易放 core
    const source = options.source || 'compaction-archiver';

    // 提取关键信息
    const memories = this.archiver.extractBatch(messages);
    if (memories.length === 0) {
      return { stored: 0, keys: [] };
    }

    // 存入 meaningful-memory
    const mm = new MemModule.MeaningfulMemory();
    const storedKeys = [];

    for (const mem of memories) {
      try {
        mm.remember({
          key: mem.key,
          value: mem.value,
          type: mem.type,
          reason: mem.reason,
          source,
          ...(level === 'core' ? { userConfirmed: true } : {}),
          // 额外元数据存入 value（如果是对象）
          _archivedMeta: mem.metadata,
        });
        storedKeys.push(mem.key);
      } catch (e) {
        // 忽略单条失败
      }
    }

    this.stats.messagesArchived += messages.length;
    this.stats.memoriesStored += storedKeys.length;
    this.stats.batchesProcessed++;

    return {
      stored: storedKeys.length,
      keys: storedKeys,
      level,
      source,
    };
  }

  /**
   * 召回归档的记忆
   * @param {string} key - 记忆 key
   * @returns {Object|null}
   */
  recall(key) {
    const MemModule = this._getMemoryModule();
    if (!MemModule) return null;

    const mm = new MemModule.MeaningfulMemory();
    return mm.recall(key);
  }

  /**
   * 搜索归档的记忆
   * @param {string} query - 搜索词
   * @param {number} topK
   * @returns {Array}
   */
  search(query, topK = 5) {
    const MemModule = this._getMemoryModule();
    if (!MemModule) return [];

    const mm = new MemModule.MeaningfulMemory();
    const semanticResults = mm.searchSemantic(query, topK);
    const keywordResults = mm.searchKeywords(query.split(/\s+/), topK);

    // 合并去重
    const seen = new Set();
    const merged = [];
    for (const r of [...semanticResults, ...keywordResults]) {
      if (!seen.has(r.key)) {
        seen.add(r.key);
        merged.push(r);
      }
    }

    return merged.slice(0, topK);
  }

  getStats() {
    return { ...this.stats };
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  PermanentMemoryArchiver,
  MessageArchiver,
};
