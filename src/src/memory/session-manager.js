/**
 * HeartFlow v5.8.0 — 会话级记忆隔离
 * 
 * 来源: Memori (https://github.com/MemoriLabs/Memori)
 * 功能: 支持多项目/多会话的记忆管理
 */

class SessionManager {
  constructor(options = {}) {
    this.currentSessionId = null;
    this.currentProjectId = null;
    this.sessionIndex = new Map();   // projectId → (sessionId → memoryIds)
    this.sessionMetadata = new Map();  // sessionId → metadata
  }

  /**
   * 开始新会话
   */
  startSession(projectId, options = {}) {
    const sessionId = options.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSessionId = sessionId;
    this.currentProjectId = projectId;

    // 初始化项目索引
    if (!this.sessionIndex.has(projectId)) {
      this.sessionIndex.set(projectId, new Map());
    }

    // 初始化会话索引
    if (!this.sessionIndex.get(projectId).has(sessionId)) {
      this.sessionIndex.get(projectId).set(sessionId, []);
    }

    // 记录会话元数据
    this.sessionMetadata.set(sessionId, {
      projectId,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      messageCount: 0,
      summary: options.summary || '',
      tags: options.tags || []
    });

    return sessionId;
  }

  /**
   * 切换会话
   */
  switchSession(sessionId, projectId = this.currentProjectId) {
    if (!this.sessionIndex.has(projectId)) {
      throw new Error(`Project ${projectId} not found`);
    }

    if (!this.sessionIndex.get(projectId).has(sessionId)) {
      throw new Error(`Session ${sessionId} not found in project ${projectId}`);
    }

    this.currentSessionId = sessionId;
    this.currentProjectId = projectId;

    // 更新最后访问时间
    const metadata = this.sessionMetadata.get(sessionId);
    if (metadata) {
      metadata.lastAccessed = new Date().toISOString();
    }

    return sessionId;
  }

  /**
   * 记录记忆到当前会话
   */
  trackMemory(memoryId, sessionId = this.currentSessionId, projectId = this.currentProjectId) {
    if (!sessionId || !projectId) {
      console.warn('[SessionManager] Cannot track memory: no active session or project');
      return;
    }

    const projectSessions = this.sessionIndex.get(projectId);
    if (!projectSessions) {
      console.warn(`[SessionManager] Project ${projectId} not found`);
      return;
    }

    const sessionMemories = projectSessions.get(sessionId);
    if (!sessionMemories) {
      console.warn(`[SessionManager] Session ${sessionId} not found`);
      return;
    }

    if (!sessionMemories.includes(memoryId)) {
      sessionMemories.push(memoryId);

      // 更新会话元数据
      const metadata = this.sessionMetadata.get(sessionId);
      if (metadata) {
        metadata.messageCount++;
        metadata.lastAccessed = new Date().toISOString();
      }
    }
  }

  /**
   * 召回当前会话的记忆
   */
  recallSession(sessionId = this.currentSessionId, projectId = this.currentProjectId) {
    const sessionMemories = this.sessionIndex
      .get(projectId)
      ?.get(sessionId) || [];

    return sessionMemories;  // 返回 memoryIds，需要外部根据 ID 获取记忆内容
  }

  /**
   * 召回项目内所有会话的记忆
   */
  recallProject(projectId = this.currentProjectId) {
    const projectSessions = this.sessionIndex.get(projectId);
    if (!projectSessions) return [];

    const allMemoryIds = new Set();
    for (const [sessionId, memoryIds] of projectSessions) {
      memoryIds.forEach(id => allMemoryIds.add(id));
    }

    return Array.from(allMemoryIds);
  }

  /**
   * 生成会话摘要
   */
  async summarizeSession(sessionId, memories, llmCaller) {
    const metadata = this.sessionMetadata.get(sessionId);
    const memoryContents = memories.map(id => {
      // 假设外部传入了 memories 对象列表
      return `- ${id.content || id}`;
    }).join('\n');

    const prompt = `请总结以下会话的记忆内容（简明扼要，200字以内）：

会话元数据：
- 创建时间：${metadata?.createdAt}
- 消息数：${metadata?.messageCount}

记忆内容：
${memoryContents}

输出格式：
{
  "summary": "会话摘要",
  "keyPoints": ["关键点1", "关键点2", ...],
  "actionItems": ["待办1", "待办2", ...]
}

只输出 JSON，不要额外解释。`;

    try {
      const response = await llmCaller(prompt);
      const summary = JSON.parse(response);

      // 更新会话元数据
      if (metadata) {
        metadata.summary = summary.summary;
        metadata.keyPoints = summary.keyPoints;
        metadata.actionItems = summary.actionItems;
      }

      return summary;
    } catch (error) {
      console.error('[SessionManager] 会话摘要生成失败:', error);
      return null;
    }
  }

  /**
   * 压缩会话（将旧记忆归档）
   */
  compactSession(sessionId, keepLastN = 50) {
    const sessionMemories = this.sessionIndex
      .get(this.currentProjectId)
      ?.get(sessionId) || [];

    if (sessionMemories.length <= keepLastN) {
      return { compacted: 0, kept: sessionMemories.length };
    }

    const toCompact = sessionMemories.slice(0, sessionMemories.length - keepLastN);
    const toKeep = sessionMemories.slice(sessionMemories.length - keepLastN);

    // 更新会话索引
    this.sessionIndex.get(this.currentProjectId).set(sessionId, toKeep);

    return {
      compacted: toCompact.length,
      kept: toKeep.length,
      compactedIds: toCompact
    };
  }

  /**
   * 获取会话列表
   */
  listSessions(projectId = this.currentProjectId) {
    const projectSessions = this.sessionIndex.get(projectId);
    if (!projectSessions) return [];

    const sessions = [];
    for (const [sessionId] of projectSessions) {
      const metadata = this.sessionMetadata.get(sessionId);
      sessions.push({
        sessionId,
        ...metadata
      });
    }

    return sessions.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId, projectId = this.currentProjectId) {
    const projectSessions = this.sessionIndex.get(projectId);
    if (projectSessions) {
      projectSessions.delete(sessionId);
    }

    this.sessionMetadata.delete(sessionId);

    // 如果删除的是当前会话，清空当前会话
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }

    return true;
  }

  /**
   * 导出会话数据（用于可视化或迁移）
   */
  exportSession(sessionId) {
    const metadata = this.sessionMetadata.get(sessionId);
    const memoryIds = this.recallSession(sessionId);

    return {
      sessionId,
      metadata,
      memoryIds,
      exportedAt: new Date().toISOString()
    };
  }
}

module.exports = { SessionManager };
