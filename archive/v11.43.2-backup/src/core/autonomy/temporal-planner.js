/**
 * Temporal Planner - 多时间尺度分层规划器
 * Reactive (1分钟), Tactical (1小时-1天), Strategic (1周-1月)
 */

const fs = require('fs');
const path = require('path');

class TemporalPlanner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.strategicFile = path.join(projectRoot, '.opencode', 'memory', 'strategic_plan.json');
    this.tacticalFile = path.join(projectRoot, '.opencode', 'memory', 'tactical_plans.json');
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'planner_state.json');
    
    this.loadPlans();
    this.currentTimeScale = 'reactive';
  }

  loadPlans() {
    try {
      if (fs.existsSync(this.strategicFile)) {
        this.strategic = JSON.parse(fs.readFileSync(this.strategicFile, 'utf8'));
      }
    } catch (e) {
      this.strategic = this.getDefaultStrategic();
    }

    try {
      if (fs.existsSync(this.tacticalFile)) {
        this.tactical = JSON.parse(fs.readFileSync(this.tacticalFile, 'utf8'));
      } else {
        this.tactical = { plans: [], lastUpdate: null };
      }
    } catch (e) {
      this.tactical = { plans: [], lastUpdate: null };
    }

    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } else {
        this.state = { lastReactive: null, activeTactical: null };
      }
    } catch (e) {
      this.state = { lastReactive: null, activeTactical: null };
    }
  }

  getDefaultStrategic() {
    return {
      version: '1.0.0',
      goals: [
        {
          id: 'strategic-001',
          title: '提升整体人格值真实性维度',
          timeframe: '1个月',
          progress: 0,
          status: 'active',
          created: new Date().toISOString()
        }
      ],
      lastReview: new Date().toISOString()
    };
  }

  saveStrategic() {
    fs.writeFileSync(this.strategicFile, JSON.stringify(this.strategic, null, 2));
  }

  saveTactical() {
    this.tactical.lastUpdate = new Date().toISOString();
    fs.writeFileSync(this.tacticalFile, JSON.stringify(this.tactical, null, 2));
  }

  /**
   * 反应层: 处理即时事件 (< 1分钟)
   */
  handleReactive(context) {
    this.currentTimeScale = 'reactive';
    this.state.lastReactive = new Date().toISOString();

    const { userEmotion, userInput } = context;

    let reactiveAction = null;

    if (userEmotion === 'negative') {
      reactiveAction = {
        type: 'emotional_response',
        priority: 9,
        description: '检测到用户负面情绪，立即回应',
        action: '共情与安抚'
      };
    } else if (userInput && userInput.length > 200) {
      reactiveAction = {
        type: 'clarification',
        priority: 7,
        description: '用户输入较长，可能需要澄清',
        action: '请求简化或总结'
      };
    }

    return reactiveAction;
  }

  /**
   * 战术层: 短期目标 (1小时-1天)
   */
  handleTactical(context) {
    this.currentTimeScale = 'tactical';

    if (!this.tactical.plans || this.tactical.plans.length === 0) {
      return this.generateTacticalGoals(context);
    }

    return this.tactical.plans.filter(p => p.status === 'active');
  }

  generateTacticalGoals(context) {
    const goals = [
      {
        id: 'tactical-001',
        title: '优化情绪响应模块',
        timeframe: '2小时',
        priority: 8,
        status: 'active',
        related_strategic: 'strategic-001'
      },
      {
        id: 'tactical-002',
        title: '分析用户中断模式',
        timeframe: '1天',
        priority: 6,
        status: 'pending',
        related_strategic: 'strategic-001'
      }
    ];

    this.tactical.plans = goals;
    this.saveTactical();
    return goals;
  }

  /**
   * 战略层: 长期目标 (1周-1月)
   */
  handleStrategic() {
    this.currentTimeScale = 'strategic';
    return this.strategic.goals.filter(g => g.status === 'active');
  }

  /**
   * 协调各层计划
   */
  harmonizePlans(context) {
    const strategic = this.handleStrategic();
    const tactical = this.handleTactical(context);
    const reactive = this.handleReactive(context);

    const harmonized = {
      timestamp: new Date().toISOString(),
      timeScale: this.currentTimeScale,
      layers: {
        reactive: reactive,
        tactical: tactical,
        strategic: strategic
      },
      conflicts: [],
      resolution: null
    };

    if (tactical && tactical.length > 0 && strategic && strategic.length > 0) {
      const tacticalGoal = tactical[0];
      const strategicGoal = strategic[0];

      if (tacticalGoal.related_strategic !== strategicGoal.id) {
        harmonized.conflicts.push({
          type: 'misalignment',
          tactical: tacticalGoal.id,
          strategic: strategicGoal.id
        });
        harmonized.resolution = 'tactical_adjusted';
        tacticalGoal.related_strategic = strategicGoal.id;
      }
    }

    return harmonized;
  }

  /**
   * 获取战略简报
   */
  getStrategicBriefing() {
    const strategic = (this.strategic?.goals || []).filter(g => g.status === 'active');
    const tactical = (this.tactical?.plans || []).filter(p => p.status === 'active');

    const currentStrategic = strategic[0] || { title: '暂无长期目标', progress: 0 };
    const todayTactical = tactical.slice(0, 2).map(t => t.title);

    return {
      longTermGoal: currentStrategic.title,
      longTermProgress: currentStrategic.progress,
      todayFocus: todayTactical.length > 0 ? todayTactical.join(', ') : '暂无今日重点'
    };
  }

  /**
   * 更新战略目标进度
   */
  updateStrategicProgress(goalId, progress) {
    const goal = this.strategic.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = progress;
      goal.lastUpdate = new Date().toISOString();
      this.saveStrategic();
    }
  }

  getStatus() {
    return {
      timeScale: this.currentTimeScale,
      strategicGoals: this.strategic?.goals?.length || 0,
      tacticalGoals: this.tactical?.plans?.length || 0,
      lastReactive: this.state?.lastReactive,
      briefing: this.getStrategicBriefing()
    };
  }
}

module.exports = { TemporalPlanner };
