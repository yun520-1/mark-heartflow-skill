/**
 * 跨会话索引 (Cross-Session Index) v1.0.0
 *
 * 高效检索跨会话信息
 */

const fs = require('fs');
const path = require('path');

class CrossSessionIndex {
  constructor(options = {}) {
    // 路径安全校验
    const inputPath = options.storagePath || path.join(__dirname, '../../data/cross-session');
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = path.normalize(resolvedPath);
    if (normalizedPath !== resolvedPath || !path.isAbsolute(resolvedPath)) {
      throw new Error('[CrossSessionIndex] Invalid storage path');
    }
    this.storagePath = resolvedPath;
    this.indexFile = path.join(this.storagePath, 'index.json');
    this._ensureStoragePath();
    this._loadIndex();
  }

  /**
   * 确保存储目录存在
   */
  _ensureStoragePath() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * 加载索引
   */
  _loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        this.index = JSON.parse(fs.readFileSync(this.indexFile, 'utf-8'));
      } else {
        this.index = {
          entities: {},
          sessions: {},
          projects: {},
          lastUpdate: Date.now()
        };
      }
    } catch (error) {
      this.index = {
        entities: {},
        sessions: {},
        projects: {},
        lastUpdate: Date.now()
      };
    }
  }

  /**
   * 保存索引
   */
  _saveIndex() {
    this.index.lastUpdate = Date.now();
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
    } catch (error) {
      // 忽略保存错误
    }
  }

  /**
   * 索引实体
   */
  indexEntity(entity) {
    const { type, id, name, sessionId, projectId, tags = [], content = '' } = entity;

    if (!this.index.entities[type]) {
      this.index.entities[type] = {};
    }

    this.index.entities[type][id] = {
      id,
      name,
      type,
      sessionId,
      projectId,
      tags,
      content,
      firstSeen: this.index.entities[type][id]?.firstSeen || Date.now(),
      lastSeen: Date.now(),
      seenCount: (this.index.entities[type][id]?.seenCount || 0) + 1
    };

    // 索引标签
    for (const tag of tags) {
      this._indexTag(tag, type, id);
    }

    // 索引会话
    if (sessionId) {
      this._indexToSession(sessionId, type, id);
    }

    // 索引项目
    if (projectId) {
      this._indexToProject(projectId, type, id);
    }

    this._saveIndex();
    return this.index.entities[type][id];
  }

  /**
   * 索引标签
   */
  _indexTag(tag, entityType, entityId) {
    const tagKey = tag.toLowerCase();
    if (!this.index.tags) {
      this.index.tags = {};
    }
    if (!this.index.tags[tagKey]) {
      this.index.tags[tagKey] = [];
    }
    if (!this.index.tags[tagKey].some(e => e.type === entityType && e.id === entityId)) {
      this.index.tags[tagKey].push({ type: entityType, id: entityId });
    }
  }

  /**
   * 索引到会话
   */
  _indexToSession(sessionId, entityType, entityId) {
    if (!this.index.sessions[sessionId]) {
      this.index.sessions[sessionId] = { entities: [], lastActive: Date.now() };
    }
    if (!this.index.sessions[sessionId].entities.some(e => e.type === entityType && e.id === entityId)) {
      this.index.sessions[sessionId].entities.push({ type: entityType, id: entityId });
    }
    this.index.sessions[sessionId].lastActive = Date.now();
  }

  /**
   * 索引到项目
   */
  _indexToProject(projectId, entityType, entityId) {
    if (!this.index.projects[projectId]) {
      this.index.projects[projectId] = { entities: [], lastActive: Date.now() };
    }
    if (!this.index.projects[projectId].entities.some(e => e.type === entityType && e.id === entityId)) {
      this.index.projects[projectId].entities.push({ type: entityType, id: entityId });
    }
    this.index.projects[projectId].lastActive = Date.now();
  }

  /**
   * 搜索实体
   */
  search(query, options = {}) {
    const { types = null, tags = [], limit = 20 } = options;
    const results = [];

    // 获取候选实体
    let candidates = [];
    if (types) {
      const typeList = Array.isArray(types) ? types : [types];
      for (const type of typeList) {
        if (this.index.entities[type]) {
          candidates.push(...Object.values(this.index.entities[type]));
        }
      }
    } else {
      for (const typeEntities of Object.values(this.index.entities)) {
        candidates.push(...Object.values(typeEntities));
      }
    }

    // 过滤标签
    if (tags.length > 0) {
      candidates = candidates.filter(e =>
        tags.every(tag => e.tags?.includes(tag))
      );
    }

    // 搜索内容
    if (query) {
      const queryLower = query.toLowerCase();
      candidates = candidates.filter(e =>
        e.name?.toLowerCase().includes(queryLower) ||
        e.content?.toLowerCase().includes(queryLower)
      );
    }

    // 排序并限制数量
    candidates.sort((a, b) => {
      const scoreA = a.seenCount * 0.1 + (b.lastSeen / 1000000);
      const scoreB = b.seenCount * 0.1 + (b.lastSeen / 1000000);
      return scoreB - scoreA;
    });

    return candidates.slice(0, limit);
  }

  /**
   * 按标签搜索
   */
  searchByTag(tag, options = {}) {
    const { limit = 20 } = options;
    const tagKey = tag.toLowerCase();
    const tagged = this.index.tags?.[tagKey] || [];

    const results = [];
    for (const { type, id } of tagged.slice(0, limit)) {
      const entity = this.index.entities[type]?.[id];
      if (entity) results.push(entity);
    }

    return results;
  }

  /**
   * 获取会话的实体
   */
  getSessionEntities(sessionId) {
    const session = this.index.sessions[sessionId];
    if (!session) return [];

    const results = [];
    for (const { type, id } of session.entities) {
      const entity = this.index.entities[type]?.[id];
      if (entity) results.push(entity);
    }

    return results;
  }

  /**
   * 获取项目的实体
   */
  getProjectEntities(projectId) {
    const project = this.index.projects[projectId];
    if (!project) return [];

    const results = [];
    for (const { type, id } of project.entities) {
      const entity = this.index.entities[type]?.[id];
      if (entity) results.push(entity);
    }

    return results;
  }

  /**
   * 获取实体
   */
  getEntity(type, id) {
    return this.index.entities[type]?.[id] || null;
  }

  /**
   * 删除实体
   */
  deleteEntity(type, id) {
    const entity = this.index.entities[type]?.[id];
    if (!entity) return false;

    // 从标签索引中移除
    if (this.index.tags) {
      for (const tag of entity.tags || []) {
        const tagKey = tag.toLowerCase();
        if (this.index.tags[tagKey]) {
          this.index.tags[tagKey] = this.index.tags[tagKey]
            .filter(e => !(e.type === type && e.id === id));
        }
      }
    }

    // 从会话索引中移除
    for (const sessionId of Object.keys(this.index.sessions)) {
      this.index.sessions[sessionId].entities =
        this.index.sessions[sessionId].entities
          .filter(e => !(e.type === type && e.id === id));
    }

    // 从项目索引中移除
    for (const projectId of Object.keys(this.index.projects)) {
      this.index.projects[projectId].entities =
        this.index.projects[projectId].entities
          .filter(e => !(e.type === type && e.id === id));
    }

    // 从实体索引中移除
    delete this.index.entities[type][id];

    this._saveIndex();
    return true;
  }

  /**
   * 获取统计
   */
  getStats() {
    const entityCounts = {};
    for (const [type, entities] of Object.entries(this.index.entities)) {
      entityCounts[type] = Object.keys(entities).length;
    }

    return {
      totalEntities: Object.values(entityCounts).reduce((a, b) => a + b, 0),
      byType: entityCounts,
      totalSessions: Object.keys(this.index.sessions).length,
      totalProjects: Object.keys(this.index.projects).length,
      totalTags: Object.keys(this.index.tags || {}).length,
      lastUpdate: this.index.lastUpdate
    };
  }
}

module.exports = { CrossSessionIndex };
