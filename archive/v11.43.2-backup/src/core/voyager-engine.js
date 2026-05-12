/**
 * HeartFlow Voyager Engine v11.7.3
 * 
 * 整合: MineDojo/Voyager ⭐6873 - Open-Ended Embodied Agent
 * 
 * 4-Agent 协作架构:
 *   1. ActionAgent → 迭代执行 (行动循环)
 *   2. CriticAgent → 自我验证 (检查成功/失败)
 *   3. CurriculumAgent → 课程生成 (自动生成任务)
 *   4. SkillManager → 技能库 (检索+生成+存储)
 * 
 * Paper: "Voyager: An Open-Ended Embodied Agent with Large Language Models"
 */

const fs = require('fs');
const path = require('path');

const VOYAGER_DIR = path.join(__dirname, '../../data/voyager');
const SKILL_DIR = path.join(VOYAGER_DIR, 'skills');
const CURRICULUM_FILE = path.join(VOYAGER_DIR, 'curriculum.json');
const TASK_FILE = path.join(VOYAGER_DIR, 'tasks.json');

class VoyagerEngine {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 160;
    this.maxRetries = options.maxRetries || 4;
    this.skillTopK = options.skillTopK || 5;
    
    // 4-Agent 系统
    this.actionAgent = new ActionAgent(this);
    this.criticAgent = new CriticAgent(this);
    this.curriculumAgent = new CurriculumAgent(this);
    this.skillManager = new SkillManager(this);
    
    // 状态
    this.currentTask = null;
    this.taskHistory = [];
    this.completedTasks = [];
    this.failedTasks = [];
    
    this._loadState();
  }

  // ============================================================
  // 主循环: Voyager 核心迭代
  // ============================================================

  /**
   * 运行主循环 (Voyager main loop)
   * 
   * while not finished:
   *   task = curriculum.generate()    # 生成任务
   *   skills = skill.retrieve(task)  # 检索技能
   *   action = action.execute(task, skills)  # 执行
   *   success, critique = critic.verify(task, action)  # 验证
   *   if success:
   *     curriculum.complete(task)
   *     skill.add(action)  # 保存新技能
   *   else:
   *     curriculum.fail(task, critique)
   */
  async run(task = null, options = {}) {
    const {
      maxIterations = this.maxIterations,
      resume = false,
    } = options;

    const results = {
      iterations: 0,
      task,
      success: false,
      skillsAdded: 0,
      critique: '',
    };

    // 如果没有指定任务，让课程生成器生成
    if (!task) {
      task = this.curriculumAgent.generateNextTask();
    }
    this.currentTask = task;

    for (let i = 0; i < maxIterations; i++) {
      results.iterations = i + 1;

      // 1. 检索相关技能
      const skills = this.skillManager.retrieve(task);
      const skillContext = skills.length > 0
        ? `Available skills:\n${skills.join('\n\n')}\n\n`
        : '';

      // 2. 执行动作 (带重试)
      let actionResult;
      let retries = 0;
      
      while (retries < this.maxRetries) {
        actionResult = await this.actionAgent.execute(task, skillContext);
        
        if (actionResult.success || !actionResult.error) {
          break;
        }
        retries++;
        
        // 重试时加入错误信息
        actionResult.context += `\nPrevious error: ${actionResult.error}\n`;
      }
      
      results.actionResult = actionResult;

      // 3. 自我验证
      const verification = await this.criticAgent.verify(task, actionResult);
      results.verification = verification;

      if (verification.success) {
        // 任务成功
        results.success = true;
        this.completedTasks.push({
          task,
          iterations: i + 1,
          skillsAdded: results.skillsAdded,
        });
        
        // 4a. 如果产生了新技能，保存
        if (actionResult.newSkill) {
          this.skillManager.add(actionResult.newSkill);
          results.skillsAdded++;
        }
        
        // 4b. 通知课程完成
        this.curriculumAgent.completeTask(task, verification.critique);
        
        break;
      } else {
        // 任务失败
        results.critique = verification.critique;
        
        // 通知课程失败
        this.curriculumAgent.failTask(task, verification.critique);
        
        // 如果是致命错误，退出
        if (actionResult.fatal) {
          break;
        }
      }
    }

    // 保存状态
    this._saveState();
    
    return results;
  }

  // ============================================================
  // CriticAgent: 自我验证 (来自 Voyager)
  // ============================================================

  /**
   * 验证任务是否成功
   * 整合 Voyager CriticAgent
   */
  async verify(task, actionResult) {
    // 构建验证上下文
    const context = this._buildCriticContext(task, actionResult);
    
    // 调用验证器
    const verification = await this.criticAgent.check(task, context);
    
    return verification;
  }

  _buildCriticContext(task, actionResult) {
    return {
      task,
      action: actionResult.output || '',
      error: actionResult.error || null,
      context: actionResult.context || '',
      events: actionResult.events || [],
    };
  }

  // ============================================================
  // 工具方法
  // ============================================================

  _generateId() {
    return `vg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _loadState() {
    try {
      if (!fs.existsSync(VOYAGER_DIR)) return;
      
      if (fs.existsSync(TASK_FILE)) {
        const data = JSON.parse(fs.readFileSync(TASK_FILE, 'utf-8'));
        this.completedTasks = data.completed || [];
        this.failedTasks = data.failed || [];
      }
    } catch (e) {
      console.log('[VoyagerEngine] Load failed:', e.message);
    }
  }

  _saveState() {
    try {
      fs.mkdirSync(VOYAGER_DIR, { recursive: true });
      fs.mkdirSync(SKILL_DIR, { recursive: true });
      
      fs.writeFileSync(TASK_FILE, JSON.stringify({
        completed: this.completedTasks.slice(-100),
        failed: this.failedTasks.slice(-50),
        updated: Date.now(),
      }, null, 2));
    } catch (e) {
      console.log('[VoyagerEngine] Save failed:', e.message);
    }
  }

  stats() {
    return {
      version: '11.7.3',
      completedTasks: this.completedTasks.length,
      failedTasks: this.failedTasks.length,
      skillsInLibrary: this.skillManager.count(),
      currentTask: this.currentTask,
    };
  }
}

// ============================================================
// ActionAgent: 迭代执行 (简化版)
// ============================================================

class ActionAgent {
  constructor(engine) {
    this.engine = engine;
    this.maxSteps = 10;
  }

  async execute(task, skillContext) {
    const result = {
      output: '',
      success: false,
      error: null,
      context: skillContext,
      events: [],
      steps: 0,
    };

    // 简化的执行逻辑
    // 实际使用中，这里会调用 LLM 进行迭代推理
    result.steps = Math.floor(Math.random() * this.maxSteps);
    
    // 模拟执行
    result.output = `[Action] Executing: ${task}`;
    
    return result;
  }
}

// ============================================================
// CriticAgent: 自我验证 (来自 Voyager)
// ============================================================

class CriticAgent {
  constructor(engine) {
    this.engine = engine;
    this.mode = 'auto'; // auto | manual
  }

  /**
   * 检查任务是否成功 (Voyager CriticAgent.ai_check_task_success)
   * 
   * 验证逻辑:
   *   1. 检查是否有错误
   *   2. 检查结果是否符合任务目标
   *   3. 生成批判性反馈
   */
  async check(task, context) {
    if (this.mode === 'manual') {
      return this._manualCheck(task, context);
    }
    
    return this._autoCheck(task, context);
  }

  async _autoCheck(task, context) {
    // 简化的自动验证
    const { action, error, events } = context;
    
    // 检查错误
    if (error) {
      return {
        success: false,
        critique: `Error occurred: ${error}. Consider fixing this before retrying.`,
        reason: 'execution_error',
      };
    }
    
    // 检查是否有实质内容
    if (!action || action.length < 10) {
      return {
        success: false,
        critique: 'No meaningful action was produced. Please try again.',
        reason: 'no_action',
      };
    }
    
    // 检查任务关键词
    const taskKeywords = task.toLowerCase().split(/\s+/);
    const actionLower = action.toLowerCase();
    const keywordMatch = taskKeywords.filter(k => 
      k.length > 3 && actionLower.includes(k)
    ).length;
    
    if (keywordMatch >= 2) {
      return {
        success: true,
        critique: 'Task completed successfully.',
        reason: 'keyword_match',
      };
    }
    
    // 需要更多判断
    return {
      success: false,
      critique: 'The action partially addressed the task but may need refinement.',
      reason: 'partial_match',
    };
  }

  async _manualCheck(task, context) {
    // 手动验证 (在实际系统中，这会提示用户)
    return {
      success: false,
      critique: 'Manual verification not implemented in this context.',
      reason: 'manual_required',
    };
  }
}

// ============================================================
// CurriculumAgent: 课程生成 (来自 Voyager)
// ============================================================

class CurriculumAgent {
  constructor(engine) {
    this.engine = engine;
    
    // 任务队列
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.difficultyLevel = 1;
    
    // 初始化任务
    this._initTasks();
  }

  _initTasks() {
    // 默认任务难度梯度
    this.taskQueue = [
      { task: 'Understand the core goal', difficulty: 1, status: 'pending' },
      { task: 'Identify key challenges', difficulty: 1, status: 'pending' },
      { task: 'Form initial approach', difficulty: 2, status: 'pending' },
      { task: 'Execute and verify', difficulty: 2, status: 'pending' },
      { task: 'Iterate and improve', difficulty: 3, status: 'pending' },
    ];
  }

  /**
   * 生成下一个任务 (Voyager CurriculumAgent)
   */
  generateNextTask() {
    // 优先队列中的任务
    if (this.taskQueue.length > 0) {
      const pending = this.taskQueue.find(t => t.status === 'pending');
      if (pending) {
        return pending.task;
      }
    }
    
    // 基于当前状态生成新任务
    return this._generateAdaptiveTask();
  }

  _generateAdaptiveTask() {
    const level = this.difficultyLevel;
    
    // 基于难度生成任务
    const taskTemplates = {
      1: [
        'Analyze the basic structure',
        'Identify key components',
        'Understand the context',
      ],
      2: [
        'Compare multiple approaches',
        'Evaluate trade-offs',
        'Design a solution',
      ],
      3: [
        'Implement the solution',
        'Test edge cases',
        'Optimize performance',
      ],
      4: [
        'Review and refine',
        'Document the process',
        'Generate insights',
      ],
    };
    
    const tasks = taskTemplates[Math.min(level, 4)] || taskTemplates[1];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    return task;
  }

  /**
   * 任务完成
   */
  completeTask(task, critique) {
    this.completedTasks.push({
      task,
      critique,
      timestamp: Date.now(),
    });
    
    // 从队列移除
    this.taskQueue = this.taskQueue.filter(t => t.task !== task);
    
    // 难度调整
    this._adjustDifficulty(true);
  }

  /**
   * 任务失败
   */
  failTask(task, critique) {
    this.failedTasks.push({
      task,
      critique,
      timestamp: Date.now(),
    });
    
    // 从队列移除并可能重新入队
    this.taskQueue = this.taskQueue.filter(t => t.task !== task);
    
    // 降低难度
    this._adjustDifficulty(false);
    
    // 将任务以较低难度重新加入
    const failedTask = this.taskQueue.find(t => t.task === task);
    if (!failedTask) {
      this.taskQueue.push({
        task,
        difficulty: Math.max(1, this.difficultyLevel - 1),
        status: 'pending',
        retryCount: (failedTask?.retryCount || 0) + 1,
      });
    }
  }

  _adjustDifficulty(success) {
    if (success) {
      // 连续成功，增加难度
      const recentSuccess = this.completedTasks.slice(-3);
      if (recentSuccess.length >= 3) {
        this.difficultyLevel = Math.min(5, this.difficultyLevel + 1);
      }
    } else {
      // 失败，降低难度
      this.difficultyLevel = Math.max(1, this.difficultyLevel - 1);
    }
  }
}

// ============================================================
// SkillManager: 技能库 (来自 Voyager)
// ============================================================

class SkillManager {
  constructor(engine) {
    this.engine = engine;
    
    // 技能存储
    this.skills = {};        // { name: { code, description, usageCount } }
    this.vectors = {};       // 简化的向量存储
    
    // 目录
    this.codeDir = path.join(SKILL_DIR, 'code');
    this.descDir = path.join(SKILL_DIR, 'description');
    
    this._init();
  }

  _init() {
    try {
      fs.mkdirSync(this.codeDir, { recursive: true });
      fs.mkdirSync(this.descDir, { recursive: true });
      
      // 加载已有技能
      const skillsFile = path.join(VOYAGER_DIR, 'skills.json');
      if (fs.existsSync(skillsFile)) {
        this.skills = JSON.parse(fs.readFileSync(skillsFile, 'utf-8'));
        
        // 加载向量
        const vectorsFile = path.join(VOYAGER_DIR, 'vectors.json');
        if (fs.existsSync(vectorsFile)) {
          this.vectors = JSON.parse(fs.readFileSync(vectorsFile, 'utf-8'));
        }
      }
    } catch (e) {
      console.log('[SkillManager] Init failed:', e.message);
    }
  }

  /**
   * 检索技能 (Voyager SkillManager.retrieve_skills)
   * 基于语义相似度检索
   */
  retrieve(query, topK = null) {
    const k = topK || this.engine.skillTopK;
    
    if (Object.keys(this.skills).length === 0) {
      return [];
    }
    
    // 简化的向量检索
    const queryVec = this._embed(query);
    const scored = Object.entries(this.skills).map(([name, skill]) => {
      const skillVec = this.vectors[name] || this._embed(skill.description || name);
      const score = this._cosineSimilarity(queryVec, skillVec);
      return { name, skill, score };
    });
    
    // 排序并返回 Top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(s => s.skill.code || s.skill.description);
  }

  /**
   * 添加新技能 (Voyager SkillManager.add_new_skill)
   */
  add(info) {
    const { programName, programCode, skillDescription } = info;
    
    if (!programName || !programCode) {
      return null;
    }
    
    // 生成描述 (如果没有提供)
    const description = skillDescription || this._generateDescription(programName, programCode);
    
    // 保存技能
    this.skills[programName] = {
      code: programCode,
      description,
      usageCount: 0,
      createdAt: Date.now(),
    };
    
    // 保存向量
    this.vectors[programName] = this._embed(description);
    
    // 持久化
    this._save();
    
    console.log(`[SkillManager] Added skill: ${programName}`);
    
    return programName;
  }

  /**
   * 生成技能描述 (Voyager SkillManager.generate_skill_description)
   */
  _generateDescription(name, code) {
    // 简化版: 基于代码生成描述
    // 实际使用中，这里会调用 LLM
    
    const lines = code.split('\n').filter(l => l.trim());
    const commentLines = lines.filter(l => l.includes('//') || l.includes('#'));
    
    if (commentLines.length > 0) {
      return commentLines[0].replace(/\/\/|#/, '').trim();
    }
    
    return `Skill: ${name} - handles ${name.split('_').join(' ')} task`;
  }

  count() {
    return Object.keys(this.skills).length;
  }

  /**
   * 简化的嵌入函数
   */
  _embed(text) {
    const words = text.toLowerCase().split(/\s+/);
    const vocab = [...new Set(words)];
    const vec = new Array(Math.min(vocab.length, 50)).fill(0);
    
    vocab.slice(0, 50).forEach((word, i) => {
      vec[i] = words.filter(w => w === word).length;
    });
    
    return vec;
  }

  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  _save() {
    try {
      fs.writeFileSync(
        path.join(VOYAGER_DIR, 'skills.json'),
        JSON.stringify(this.skills, null, 2)
      );
      fs.writeFileSync(
        path.join(VOYAGER_DIR, 'vectors.json'),
        JSON.stringify(this.vectors, null, 2)
      );
    } catch (e) {
      console.log('[SkillManager] Save failed:', e.message);
    }
  }
}

module.exports = { VoyagerEngine, ActionAgent, CriticAgent, CurriculumAgent, SkillManager };
