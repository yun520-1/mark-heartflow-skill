/**
 * 经验收集器 (Experience Collector) v1.0.0
 *
 * 收集和管理执行经验
 */

const fs = require('fs');
const path = require('path');

class ExperienceCollector {
  constructor(options = {}) {
    // 路径验证 - 防止路径遍历攻击
    const inputPath = options.storagePath || path.join(__dirname, '../../data/experiences');
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = path.normalize(resolvedPath);
    
    // 验证路径安全性
    if (normalizedPath !== resolvedPath || !path.isAbsolute(resolvedPath)) {
      throw new Error('[ExperienceCollector] Invalid storage path');
    }
    
    // 确保路径在预期范围内
    const expectedBase = path.resolve(__dirname, '..', '..', 'data');
    if (!resolvedPath.startsWith(expectedBase)) {
      throw new Error('[ExperienceCollector] Storage path outside allowed directory');
    }
    
    this.storagePath = resolvedPath;
    this.experiences = new Map();
    this.maxExperiences = options.maxExperiences || 1000;
    this.autoSave = options.autoSave !== false;
    this._ensureStoragePath();
    this._loadExperiences();
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
   * 加载经验
   */
  _loadExperiences() {
    try {
      const indexPath = path.join(this.storagePath, 'index.json');
      if (fs.existsSync(indexPath)) {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        for (const [id, meta] of Object.entries(index)) {
          this.experiences.set(id, meta);
        }
      }
    } catch (error) {
      // [PROD] 生产环境移除 console.warn: console.warn('加载经验失败:', error.message);
    }
  }

  /**
   * 保存经验
   */
  _saveExperience(id, experience) {
    if (!this.autoSave) return;

    try {
      const filePath = path.join(this.storagePath, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(experience, null, 2));
    } catch (error) {
      // [PROD] 生产环境移除 console.warn: console.warn('保存经验失败:', error.message);
    }
  }

  /**
   * 更新索引
   */
  _updateIndex() {
    if (!this.autoSave) return;

    try {
      const index = Object.fromEntries(this.experiences);
      const indexPath = path.join(this.storagePath, 'index.json');
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      // [PROD] 生产环境移除 console.warn: console.warn('更新索引失败:', error.message);
    }
  }

  /**
   * 添加经验
   */
  add(experience) {
    const id = experience.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const record = {
      id,
      type: experience.type || 'general',
      task: experience.task,
      context: experience.context || {},
      result: experience.result,
      success: experience.success,
      timestamp: experience.timestamp || Date.now(),
      usefulness: experience.usefulness || 0,
      tags: experience.tags || [],
      lessons: experience.lessons || []
    };

    this.experiences.set(id, record);
    this._saveExperience(id, record);
    this._updateIndex();

    // 清理旧经验
    this._cleanup();

    return id;
  }

  /**
   * 记录成功经验
   */
  recordSuccess(task, context, result, lessons = []) {
    return this.add({
      type: 'success',
      task,
      context,
      result,
      success: true,
      usefulness: this._evaluateUsefulness(result),
      lessons
    });
  }

  /**
   * 记录失败经验
   */
  recordFailure(task, context, result, error, lessons = []) {
    return this.add({
      type: 'failure',
      task,
      context,
      result,
      error,
      success: false,
      usefulness: 0,
      lessons
    });
  }

  /**
   * 评估有用性
   */
  _evaluateUsefulness(result) {
    if (!result) return 0;

    let score = 0;

    // 效率
    if (result.duration && result.duration < 60000) score += 0.3;
    if (result.steps && result.steps.length < 5) score += 0.2;

    // 质量
    if (result.qualityScore) score += result.qualityScore * 0.3;

    // 简洁性
    if (!result.errors || result.errors.length === 0) score += 0.2;

    return Math.min(1, score);
  }

  /**
   * 查找相关经验
   */
  findRelated(task, context = {}, options = {}) {
    const { maxResults = 5, minUsefulness = 0 } = options;
    const taskStr = typeof task === 'string' ? task : task.description || '';

    const related = [];

    for (const [id, exp] of this.experiences) {
      // 检查有用性
      if (exp.usefulness < minUsefulness) continue;

      // 检查类型
      if (options.type && exp.type !== options.type) continue;

      // 计算相关性
      const similarity = this._calculateSimilarity(taskStr, exp.task, context, exp.context);

      if (similarity > 0) {
        related.push({
          ...exp,
          similarity
        });
      }
    }

    // 排序并限制数量
    return related
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * 计算相似度
   */
  _calculateSimilarity(task1, task2, context1 = {}, context2 = {}) {
    let score = 0;

    // 任务描述相似度
    if (task1 && task2) {
      const words1 = new Set(task1.toLowerCase().split(/\s+/));
      const words2 = new Set(task2.toLowerCase().split(/\s+/));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      score += union > 0 ? intersection / union * 0.6 : 0;
    }

    // 上下文相似度
    if (context1.environment && context1.environment === context2.environment) {
      score += 0.2;
    }

    if (context1.taskType && context1.taskType === context2.taskType) {
      score += 0.2;
    }

    return score;
  }

  /**
   * 获取经验统计
   */
  getStats() {
    const stats = {
      total: this.experiences.size,
      byType: {},
      byTag: {},
      averageUsefulness: 0,
      recentCount: 0
    };

    let totalUsefulness = 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const exp of this.experiences.values()) {
      // 按类型统计
      stats.byType[exp.type] = (stats.byType[exp.type] || 0) + 1;

      // 按标签统计
      for (const tag of exp.tags || []) {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      }

      // 计算平均有用性
      totalUsefulness += exp.usefulness || 0;

      // 最近经验数
      if (exp.timestamp > oneWeekAgo) {
        stats.recentCount++;
      }
    }

    stats.averageUsefulness = this.experiences.size > 0
      ? totalUsefulness / this.experiences.size
      : 0;

    return stats;
  }

  /**
   * 清理旧经验
   */
  _cleanup() {
    if (this.experiences.size <= this.maxExperiences) return;

    // 按有用性和时间排序
    const sorted = [...this.experiences.entries()]
      .sort((a, b) => {
        const scoreA = (a[1].usefulness || 0) - (a[1].timestamp / 10000000);
        const scoreB = (b[1].usefulness || 0) - (b[1].timestamp / 10000000);
        return scoreA - scoreB;
      });

    // 删除最不有用的经验
    const toRemove = sorted.slice(0, this.experiences.size - this.maxExperiences);
    for (const [id] of toRemove) {
      this.experiences.delete(id);
      const filePath = path.join(this.storagePath, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    this._updateIndex();
  }

  /**
   * 删除经验
   */
  delete(id) {
    const deleted = this.experiences.delete(id);
    if (deleted) {
      const filePath = path.join(this.storagePath, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this._updateIndex();
    }
    return deleted;
  }

  /**
   * 清空所有经验
   */
  clear() {
    for (const id of this.experiences.keys()) {
      const filePath = path.join(this.storagePath, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    this.experiences.clear();
    this._updateIndex();
  }

  /**
   * 导出经验
   */
  export() {
    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      count: this.experiences.size,
      experiences: [...this.experiences.values()]
    };
  }

  /**
   * 导入经验
   */
  import(data) {
    if (!data.experiences || !Array.isArray(data.experiences)) {
      throw new Error('无效的导入数据格式');
    }

    let imported = 0;
    for (const exp of data.experiences) {
      if (exp.id && exp.task) {
        this.experiences.set(exp.id, exp);
        this._saveExperience(exp.id, exp);
        imported++;
      }
    }

    this._updateIndex();
    return imported;
  }
}

module.exports = { ExperienceCollector };
