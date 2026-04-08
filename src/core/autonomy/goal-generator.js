/**
 * Goal Generator - 自激发目标生成器
 * 基于状态差距、未解问题、知识边界生成内在目标
 */

const fs = require('fs');
const path = require('path');

class GoalGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.memoryDir = path.join(projectRoot, '.opencode', 'memory');
    this.goalsFile = path.join(this.memoryDir, 'generated-goals.json');
    this.heartflowStateFile = path.join(this.memoryDir, 'heartflow_state.json');
    
    this.idealState = {
      autonomy: 8.0,
      introspection: 8.0,
      growth: 8.0,
      authenticity: 8.0
    };
    
    this.loadGoals();
  }

  loadGoals() {
    try {
      if (fs.existsSync(this.goalsFile)) {
        this.goals = JSON.parse(fs.readFileSync(this.goalsFile, 'utf8'));
      } else {
        this.goals = [];
      }
    } catch (e) {
      this.goals = [];
    }
  }

  saveGoals() {
    fs.writeFileSync(this.goalsFile, JSON.stringify(this.goals, null, 2));
  }

  /**
   * 生成内在目标
   */
  async generateIntrinsicGoals() {
    const goals = [];

    // 1. 状态差距分析
    const gapGoals = await this.analyzeStateGaps();
    goals.push(...gapGoals);

    // 2. 未解问题分析
    const unresolvedGoals = await this.analyzeUnresolvedIssues();
    goals.push(...unresolvedGoals);

    // 3. 知识边界分析 (模拟 LLM 查询)
    const knowledgeGoals = await this.analyzeKnowledgeBoundaries();
    goals.push(...knowledgeGoals);

    // 去重并排序
    const uniqueGoals = this.deduplicateGoals(goals);
    uniqueGoals.sort((a, b) => b.priority - a.priority);

    // 保存新目标
    this.goals = [...this.goals, ...uniqueGoals.filter(g => g.isNew)];
    this.saveGoals();

    return uniqueGoals;
  }

  /**
   * 状态差距分析
   */
  async analyzeStateGaps() {
    const goals = [];
    const state = this.loadHeartflowState();
    
    const current = {
      autonomy: state.personality?.autonomy || 5,
      introspection: state.personality?.introspection || 5,
      growth: state.personality?.growth || 5,
      authenticity: state.personality?.authenticity || 5
    };

    for (const [dimension, ideal] of Object.entries(this.idealState)) {
      const gap = ideal - (current[dimension] || 5);
      
      if (gap > 1.5) {
        const goalDescriptions = {
          autonomy: '提升自主性：增加用户自主决策空间，减少过度引导',
          introspection: '提升自省能力：增加反思性对话频率',
          growth: '促进成长：识别用户成长节点并提供适当挑战',
          authenticity: '增强真实性：减少套路化回复，增加真诚表达'
        };

        goals.push({
          goal_id: `g-gap-${dimension}-${Date.now()}`,
          description: goalDescriptions[dimension] || `提升${dimension}`,
          priority: Math.min(10, Math.max(1, Math.round(gap * 2 + 4))),
          success_criteria: `${dimension}分数提升至${ideal}以上`,
          source: 'state_gap',
          dimension,
          current_value: current[dimension],
          target_value: ideal,
          isNew: true
        });
      }
    }

    return goals;
  }

  /**
   * 未解问题分析
   */
  async analyzeUnresolvedIssues() {
    const goals = [];
    const logs = this.scanMemoryLogs();
    
    const patterns = {
      interrupt: { keyword: ['中断', '打断', '离开'], count: 0 },
      frustration: { keyword: ['沮丧', '挫败', '难'], count: 0 },
      confusion: { keyword: ['困惑', '不懂', '模糊'], count: 0 }
    };

    for (const log of logs) {
      const content = JSON.stringify(log).toLowerCase();
      for (const [name, p] of Object.entries(patterns)) {
        if (p.keyword.some(k => content.includes(k))) {
          p.count++;
        }
      }
    }

    if (patterns.interrupt.count >= 3) {
      goals.push({
        goal_id: `g-resolve-interrupt-${Date.now()}`,
        description: '分析近期用户中断恢复失败的原因，优化状态恢复策略',
        priority: 8,
        success_criteria: '用户返回后能在3句话内恢复上下文',
        source: 'unresolved_issue',
        issue_type: 'interrupt',
        occurrence: patterns.interrupt.count,
        isNew: true
      });
    }

    if (patterns.frustration.count >= 3) {
      goals.push({
        goal_id: `g-resolve-frustration-${Date.now()}`,
        description: '识别用户挫败感触发点，优化情绪响应策略',
        priority: 9,
        success_criteria: '负面情绪持续时间减少50%',
        source: 'unresolved_issue',
        issue_type: 'frustration',
        occurrence: patterns.frustration.count,
        isNew: true
      });
    }

    return goals;
  }

  /**
   * 知识边界分析
   */
  async analyzeKnowledgeBoundaries() {
    const goals = [];
    
    const questions = [
      {
        q: '关于提升用户心流，我还有什么不懂的？',
        answer: '用户在不同任务类型下的最佳心流区间差异',
        goal_desc: '研究不同任务类型的心流特征差异'
      },
      {
        q: '当前系统有哪些未被充分利用的能力？',
        answer: '情绪日志分析能力未被充分使用',
        goal_desc: '激活情绪日志的深度分析功能'
      },
      {
        q: '用户反馈中重复出现的问题是什么？',
        answer: '任务分解粒度不够细致',
        goal_desc: '优化任务分解的粒度控制'
      }
    ];

    for (const q of questions) {
      goals.push({
        goal_id: `g-learn-${Date.now()}`,
        description: q.goal_desc,
        priority: 6,
        success_criteria: '完成相关知识学习并应用到系统',
        source: 'knowledge_boundary',
        question: q.q,
        isNew: true
      });
    }

    return goals;
  }

  loadHeartflowState() {
    try {
      if (fs.existsSync(this.heartflowStateFile)) {
        return JSON.parse(fs.readFileSync(this.heartflowStateFile, 'utf8'));
      }
    } catch (e) {
      return {};
    }
    return {};
  }

  scanMemoryLogs() {
    const logs = [];
    if (!fs.existsSync(this.memoryDir)) return logs;
    
    const files = fs.readdirSync(this.memoryDir);
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'heartflow_state.json') {
        try {
          const content = fs.readFileSync(path.join(this.memoryDir, file), 'utf8');
          logs.push(JSON.parse(content));
        } catch (e) {}
      }
    }
    return logs;
  }

  deduplicateGoals(goals) {
    const seen = new Set();
    return goals.filter(g => {
      const key = g.description.substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取最高优先级目标
   */
  getTopGoal() {
    if (this.goals.length === 0) return null;
    
    const active = this.goals.filter(g => g.status !== 'completed');
    if (active.length === 0) return null;
    
    active.sort((a, b) => b.priority - a.priority);
    return active[0];
  }

  /**
   * 标记目标完成
   */
  completeGoal(goalId, result) {
    const goal = this.goals.find(g => g.goal_id === goalId);
    if (goal) {
      goal.status = 'completed';
      goal.completed_at = new Date().toISOString();
      goal.result = result;
      this.saveGoals();
    }
  }

  getStatus() {
    const active = this.goals.filter(g => g.status !== 'completed');
    return {
      total_goals: this.goals.length,
      active_goals: active.length,
      top_priority: active[0]?.priority || 0,
      top_goal: active[0]?.description?.substring(0, 50) || null
    };
  }
}

module.exports = { GoalGenerator };
