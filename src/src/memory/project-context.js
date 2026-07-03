/**
 * 项目上下文 (Project Context) v1.0.0
 *
 * 跟踪项目的整体状态、任务和决策
 */

const fs = require('fs');
const path = require('path');

class ProjectContext {
  constructor(options = {}) {
    // 路径安全校验
    const inputPath = options.storagePath || path.join(__dirname, '../../data/projects');
    const resolvedPath = path.resolve(inputPath);
    const normalizedPath = path.normalize(resolvedPath);
    if (normalizedPath !== resolvedPath || !path.isAbsolute(resolvedPath)) {
      throw new Error('[ProjectContext] Invalid storage path');
    }
    this.storagePath = resolvedPath;
    this.currentProject = null;
    this.autoSave = options.autoSave !== false;
    this._ensureStoragePath();
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
   * 设置当前项目
   */
  setProject(projectId, metadata = {}) {
    const filePath = this._getProjectFile(projectId);
    let project;

    try {
      if (fs.existsSync(filePath)) {
        project = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } else {
        project = this._createNewProject(projectId, metadata);
      }
    } catch (error) {
      project = this._createNewProject(projectId, metadata);
    }

    this.currentProject = project;
    return project;
  }

  /**
   * 创建新项目
   */
  _createNewProject(projectId, metadata) {
    return {
      projectId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata,
      tasks: [],
      decisions: [],
      files: [],
      goals: [],
      notes: []
    };
  }

  /**
   * 获取项目文件路径
   */
  _getProjectFile(projectId) {
    return path.join(this.storagePath, `${projectId}.json`);
  }

  /**
   * 保存当前项目
   */
  save() {
    if (!this.currentProject) return false;

    this.currentProject.updatedAt = Date.now();
    const filePath = this._getProjectFile(this.currentProject.projectId);

    try {
      fs.writeFileSync(filePath, JSON.stringify(this.currentProject, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 添加任务
   */
  addTask(task) {
    if (!this.currentProject) return null;

    const taskRecord = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: task.title,
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      createdAt: Date.now(),
      completedAt: null,
      subtasks: []
    };

    this.currentProject.tasks.push(taskRecord);
    if (this.autoSave) this.save();
    return taskRecord;
  }

  /**
   * 更新任务状态
   */
  updateTask(taskId, updates) {
    if (!this.currentProject) return null;

    const task = this.currentProject.tasks.find(t => t.id === taskId);
    if (!task) return null;

    Object.assign(task, updates);
    if (updates.status === 'completed') {
      task.completedAt = Date.now();
    }
    if (this.autoSave) this.save();
    return task;
  }

  /**
   * 添加决策记录
   */
  addDecision(decision) {
    if (!this.currentProject) return null;

    const record = {
      id: `decision-${Date.now()}`,
      content: decision.content,
      reason: decision.reason || '',
      outcome: null,
      createdAt: Date.now()
    };

    this.currentProject.decisions.push(record);
    if (this.autoSave) this.save();
    return record;
  }

  /**
   * 更新决策结果
   */
  updateDecisionOutcome(decisionId, outcome) {
    if (!this.currentProject) return null;

    const decision = this.currentProject.decisions.find(d => d.id === decisionId);
    if (!decision) return null;

    decision.outcome = outcome;
    if (this.autoSave) this.save();
    return decision;
  }

  /**
   * 添加文件跟踪
   */
  trackFile(filePath, metadata = {}) {
    if (!this.currentProject) return null;

    const existing = this.currentProject.files.find(f => f.path === filePath);
    if (existing) {
      existing.updatedAt = Date.now();
      Object.assign(existing, metadata);
    } else {
      this.currentProject.files.push({
        path: filePath,
        firstSeen: Date.now(),
        updatedAt: Date.now(),
        ...metadata
      });
    }

    if (this.autoSave) this.save();
    return true;
  }

  /**
   * 设置目标
   */
  setGoal(goal) {
    if (!this.currentProject) return null;

    const goalRecord = {
      id: `goal-${Date.now()}`,
      content: goal.content,
      status: 'active',
      progress: 0,
      createdAt: Date.now(),
      completedAt: null
    };

    this.currentProject.goals.push(goalRecord);
    if (this.autoSave) this.save();
    return goalRecord;
  }

  /**
   * 更新目标进度
   */
  updateGoalProgress(goalId, progress) {
    if (!this.currentProject) return null;

    const goal = this.currentProject.goals.find(g => g.id === goalId);
    if (!goal) return null;

    goal.progress = Math.min(100, Math.max(0, progress));
    if (goal.progress >= 100) {
      goal.status = 'completed';
      goal.completedAt = Date.now();
    }
    if (this.autoSave) this.save();
    return goal;
  }

  /**
   * 获取项目摘要
   */
  getSummary() {
    if (!this.currentProject) return null;

    const completedTasks = this.currentProject.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = this.currentProject.tasks.length;

    return {
      projectId: this.currentProject.projectId,
      createdAt: this.currentProject.createdAt,
      updatedAt: this.currentProject.updatedAt,
      taskProgress: `${completedTasks}/${totalTasks}`,
      completedGoals: this.currentProject.goals.filter(g => g.status === 'completed').length,
      totalGoals: this.currentProject.goals.length,
      decisionsCount: this.currentProject.decisions.length,
      filesCount: this.currentProject.files.length
    };
  }

  /**
   * 获取项目状态
   */
  getState() {
    return this.currentProject ? { ...this.currentProject } : null;
  }

  /**
   * 列出所有项目
   */
  listProjects() {
    const projects = [];

    try {
      const files = fs.readdirSync(this.storagePath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(this.storagePath, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          projects.push({
            projectId: data.projectId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            taskCount: data.tasks?.length || 0,
            completedTaskCount: data.tasks?.filter(t => t.status === 'completed').length || 0
          });
        } catch (e) {
          // 跳过无效文件
        }
      }
    } catch (error) {
      // 目录不存在
    }

    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

module.exports = { ProjectContext };
