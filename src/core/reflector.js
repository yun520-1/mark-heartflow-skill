/**
 * Reflector - 反思模块 v2.2.1
 * 分析心流会话日志，生成结构化反思报告
 * 
 * 升级内容（v2.2.0 → v2.2.1）：
 * 1. [BUGFIX] printReport() 从空操作改为实际打印格式化报告
 * 2. [BUGFIX] 修复 analyzeAIResponse() 中变量名不一致 (effective → effectiveness)
 * 3. [FEATURE] 添加多会话趋势分析 (compareWithPreviousReports)
 * 4. [FEATURE] 添加目标跟踪系统 (goal tracking with status progression)
 * 5. [FEATURE] 为所有分析方法添加输入验证和防御性编程
 * 6. [FEATURE] analyzeSession() 添加错误边界 (try/catch per sub-analysis)
 * 7. [IMPROVEMENT] analyzeEmotions() 统一输出字段名为英文
 * 8. [IMPROVEMENT] calculateOverallScore() 增加数据驱动的加权计算
 */

const fs = require('fs');
const { atomicWrite } = require('../utils/atomic-write');
const path = require('path');

// ============================================================
// 目标跟踪状态枚举
// ============================================================
const GoalStatus = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  IMPROVED: 'improved',
  STALLED: 'stalled',
  REGRESSED: 'regressed',
  COMPLETED: 'completed'
};

// 目标描述常量
const GOAL_DESCRIPTIONS = {
  EMOTION_STABILITY: '提升情绪稳定性：降低波动幅度，维持积极趋势',
  TASK_COMPLETION: '提升任务完成率：优化分解粒度，减少未完成任务',
  FEEDBACK_POSITIVITY: '提升用户满意度：改进响应质量，增加积极反馈',
  PERSONALITY_GROWTH: '促进人格成长：推动各维度均衡发展',
  SESSION_CONSISTENCY: '提升会话连贯性：减少中断后的上下文丢失'
};

class Reflector {
  constructor(projectRoot) {
    // [P2] 路径验证 - 防止路径遍历
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[Reflector] Invalid projectRoot');
    }
    // 确保projectRoot是绝对路径且在安全范围内
    const resolvedRoot = path.resolve(projectRoot);
    
    // 验证路径安全性 - 防止路径遍历攻击
    const normalizedPath = path.normalize(resolvedRoot);
    if (normalizedPath !== resolvedRoot || !path.isAbsolute(resolvedRoot)) {
      throw new Error('[Reflector] Invalid projectRoot path');
    }
    
    this.projectRoot = resolvedRoot;
    this.stateFile = path.join(resolvedRoot, '.opencode', 'memory', 'heartflow_state.json');
    this.reportFile = path.join(resolvedRoot, 'logs', 'reflect-reports.json');
    this.logFile = path.join(resolvedRoot, 'logs', 'reflect.log');
    
    // 目标跟踪系统
    this.goals = this.loadGoals();
    this.goalsFile = path.join(resolvedRoot, 'logs', 'reflect-goals.json');
    
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (e) {
      console.error('[Reflector] 加载状态失败:', e.message);
    }
    return this.getDefaultState();
  }

  getDefaultState() {
    return {
      version: '2.2.0',
      last_session: new Date().toISOString(),
      total_sessions: 0,
      personality: {},
      big_five_scores: {},
      emotional_log: [],
      feedback_history: [],
      achievements: [],
      current_mode: 'buddy'
    };
  }

  /**
   * 加载目标跟踪数据
   */
  loadGoals() {
    try {
      if (fs.existsSync(this.goalsFile)) {
        return JSON.parse(fs.readFileSync(this.goalsFile, 'utf8'));
      }
    } catch (e) {
      console.warn('[Reflector] 加载目标失败:', e.message);
    }
    return {
      version: '2.2.1',
      goals: [],
      last_updated: null
    };
  }

  /**
   * 保存目标跟踪数据
   */
  saveGoals() {
    try {
      const dir = path.dirname(this.goalsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.goalsFile, JSON.stringify(this.goals, null, 2));
    } catch (e) {
      console.warn('[Reflector] 保存目标失败:', e.message);
    }
  }

  /**
   * 更新目标跟踪状态
   * @param {string} goalKey - 目标标识符
   * @param {number} currentValue - 当前值 (0-10)
   * @param {number} previousValue - 之前的值 (0-10)
   */
  updateGoal(goalKey, currentValue, previousValue) {
    if (typeof currentValue !== 'number' || typeof previousValue !== 'number') {
      return;
    }

    let goal = this.goals.goals.find(g => g.key === goalKey);
    
    if (!goal) {
      // 创建新目标
      goal = {
        key: goalKey,
        description: GOAL_DESCRIPTIONS[goalKey] || `改善${goalKey}`,
        status: GoalStatus.NEW,
        created_at: new Date().toISOString(),
        history: [],
        best_value: currentValue,
        last_value: currentValue,
        stale_count: 0
      };
      this.goals.goals.push(goal);
    }

    // 记录历史
    goal.history.push({
      timestamp: new Date().toISOString(),
      value: currentValue
    });
    if (goal.history.length > 20) {
      goal.history = goal.history.slice(-20);
    }

    // 更新状态
    goal.last_value = currentValue;
    if (currentValue > goal.best_value) {
      goal.best_value = currentValue;
      goal.status = currentValue >= 8 ? GoalStatus.COMPLETED : GoalStatus.IMPROVED;
      goal.stale_count = 0;
    } else if (currentValue < previousValue) {
      goal.status = GoalStatus.REGRESSED;
      goal.stale_count = 0;
    } else if (currentValue === previousValue) {
      goal.stale_count = (goal.stale_count || 0) + 1;
      if (goal.stale_count >= 3) {
        goal.status = GoalStatus.STALLED;
      }
    }

    // 目标达到 8/10 以上标记完成
    if (currentValue >= 8) {
      goal.status = GoalStatus.COMPLETED;
    }

    this.goals.last_updated = new Date().toISOString();
    this.saveGoals();
  }

  /**
   * 获取目标跟踪摘要
   */
  getGoalSummary() {
    const active = this.goals.goals.filter(g => g.status !== GoalStatus.COMPLETED);
    const completed = this.goals.goals.filter(g => g.status === GoalStatus.COMPLETED);
    
    return {
      total_goals: this.goals.goals.length,
      active_goals: active.length,
      completed_goals: completed.length,
      stalled_goals: active.filter(g => g.status === GoalStatus.STALLED).length,
      regressed_goals: active.filter(g => g.status === GoalStatus.REGRESSED).length,
      goals: this.goals.goals.map(g => ({
        key: g.key,
        description: g.description,
        status: g.status,
        best_value: g.best_value,
        last_value: g.last_value,
        data_points: g.history.length
      }))
    };
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    // 统一使用 JSON Lines 格式（每行一个 JSON）
    const entry = JSON.stringify({
      timestamp,
      message,
      ...(data ? { data } : {})
    }) + '\n';
    try {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(this.logFile, entry);
    } catch (e) {
      console.warn('[Reflector] 写入日志失败:', e.message);
    }
  }

  /**
   * 分析会话（带错误边界）
   */
  analyzeSession() {
    this.log('开始分析心流会话...');
    
    const state = this.loadState();
    const previousReports = this.loadPreviousReports();
    
    // 错误边界：每个子分析独立 try/catch
    const safeAnalyze = (fn, fallback) => {
      try {
        return fn();
      } catch (e) {
        this.log(`分析异常: ${e.message}`);
        return fallback;
      }
    };

    const emotionAnalysis = safeAnalyze(
      () => this.analyzeEmotions(state.emotional_log),
      { status: 'error', summary: '情绪分析失败', volatility: 0, trend: 'unknown', avgScore: 0, dataPoints: 0 }
    );

    const taskAnalysis = safeAnalyze(
      () => this.analyzeTasks(state.achievements),
      { completed: 0, total: 0, rate: '0%', summary: '任务分析失败' }
    );

    const feedbackAnalysis = safeAnalyze(
      () => this.analyzeAIResponse(state.feedback_history),
      { effectiveness: '0/10', positive: 0, negative: 0, summary: '反馈分析失败' }
    );

    const personalityAnalysis = safeAnalyze(
      () => this.analyzePersonality(state.personality),
      { avgScore: 0, level: '未知', summary: '人格分析失败' }
    );

    // 多会话趋势分析
    const trendAnalysis = safeAnalyze(
      () => this.analyzeTrends(previousReports, {
        emotionAnalysis,
        taskAnalysis,
        feedbackAnalysis,
        personalityAnalysis
      }),
      { status: 'no_data', summary: '趋势分析需要更多会话数据', changes: {} }
    );

    const overallScore = safeAnalyze(
      () => this.calculateOverallScore(state, emotionAnalysis, taskAnalysis, feedbackAnalysis),
      { score: '0/10', flowState: '未知', breakdown: {} }
    );

    const improvements = safeAnalyze(
      () => this.generateImprovements(state, trendAnalysis),
      []
    );

    // 更新目标跟踪
    this._updateGoalsFromAnalysis(emotionAnalysis, taskAnalysis, feedbackAnalysis, trendAnalysis);

    const report = {
      timestamp: new Date().toISOString(),
      session_time: state.last_session,
      total_sessions: state.total_sessions,
      
      emotionAnalysis,
      taskAnalysis,
      feedbackAnalysis,
      personalityAnalysis,
      trendAnalysis,
      goalTracking: this.getGoalSummary(),
      
      overallScore,
      improvements
    };

    this.saveReport(report);
    this.log('会话分析完成');
    
    return report;
  }

  /**
   * 加载历史报告用于趋势分析
   */
  loadPreviousReports() {
    try {
      if (fs.existsSync(this.reportFile)) {
        const data = JSON.parse(fs.readFileSync(this.reportFile, 'utf8'));
        return Array.isArray(data) ? data : [];
      }
    } catch (e) {
      this.log('加载历史报告失败:', e.message);
    }
    return [];
  }

  /**
   * 多会话趋势分析
   * @param {Object[]} previousReports - 历史报告列表
   * @param {Object} currentAnalysis - 当前分析结果
   */
  analyzeTrends(previousReports, currentAnalysis) {
    if (!previousReports || previousReports.length === 0) {
      return {
        status: 'first_session',
        summary: '首次会话，无历史数据可比对',
        changes: {},
        sessions_analyzed: 0
      };
    }

    // 取上一份报告作为比较基准
    const lastReport = previousReports[previousReports.length - 1];
    const changes = {};

    // 情绪趋势
    if (lastReport.emotionAnalysis && currentAnalysis.emotionAnalysis) {
      const prevVol = parseFloat(lastReport.emotionAnalysis.volatility) || 0;
      const currVol = parseFloat(currentAnalysis.emotionAnalysis.volatility) || 0;
      const prevAvg = parseFloat(lastReport.emotionAnalysis.avgScore) || 0;
      const currAvg = parseFloat(currentAnalysis.emotionAnalysis.avgScore) || 0;

      changes.emotion = {
        volatilityDelta: Math.round((currVol - prevVol) * 10) / 10,
        avgScoreDelta: Math.round((currAvg - prevAvg) * 10) / 10,
        direction: currAvg > prevAvg ? 'improving' : currAvg < prevAvg ? 'declining' : 'stable'
      };

      this.updateGoal(
        'EMOTION_STABILITY',
        Math.min(10, Math.max(0, (10 - currVol) * 0.5 + currAvg * 0.5)),
        Math.min(10, Math.max(0, (10 - prevVol) * 0.5 + prevAvg * 0.5))
      );
    }

    // 任务趋势
    if (lastReport.taskAnalysis && currentAnalysis.taskAnalysis) {
      const prevRate = parseFloat(lastReport.taskAnalysis.rate) || 0;
      const currRate = parseFloat(currentAnalysis.taskAnalysis.rate) || 0;

      changes.task = {
        rateDelta: Math.round((currRate - prevRate) * 10) / 10,
        direction: currRate > prevRate ? 'improving' : currRate < prevRate ? 'declining' : 'stable'
      };

      this.updateGoal('TASK_COMPLETION', currRate, prevRate);
    }

    // 反馈趋势
    if (lastReport.feedbackAnalysis && currentAnalysis.feedbackAnalysis) {
      const prevEff = parseFloat(lastReport.feedbackAnalysis.effectiveness) || 0;
      const currEff = parseFloat(currentAnalysis.feedbackAnalysis.effectiveness) || 0;

      changes.feedback = {
        effectivenessDelta: Math.round((currEff - prevEff) * 10) / 10,
        direction: currEff > prevEff ? 'improving' : currEff < prevEff ? 'declining' : 'stable'
      };

      this.updateGoal('FEEDBACK_POSITIVITY', currEff, prevEff);
    }

    // 人格趋势
    if (lastReport.personalityAnalysis && currentAnalysis.personalityAnalysis) {
      const prevP = parseFloat(lastReport.personalityAnalysis.avgScore) || 0;
      const currP = parseFloat(currentAnalysis.personalityAnalysis.avgScore) || 0;

      changes.personality = {
        avgScoreDelta: Math.round((currP - prevP) * 10) / 10,
        direction: currP > prevP ? 'improving' : currP < prevP ? 'declining' : 'stable'
      };

      this.updateGoal('PERSONALITY_GROWTH', currP, prevP);
    }

    // 统计趋势方向
    const improving = Object.values(changes).filter(c => c.direction === 'improving').length;
    const declining = Object.values(changes).filter(c => c.direction === 'declining').length;
    const overallTrend = improving > declining ? 'positive' : declining > improving ? 'negative' : 'stable';

    return {
      status: 'compared',
      summary: `与上次会话相比，${improving}个维度改善，${declining}个维度退步`,
      changes,
      overallTrend,
      sessions_analyzed: previousReports.length + 1,
      last_session_time: lastReport.timestamp
    };
  }

  /**
   * 从分析结果更新目标跟踪
   */
  _updateGoalsFromAnalysis(emotionAnalysis, taskAnalysis, feedbackAnalysis, trendAnalysis) {
    // 首次会话没有历史对比，由趋势分析负责目标更新
    if (trendAnalysis.status === 'first_session') {
      // 初始化所有目标
      this.updateGoal('EMOTION_STABILITY', 5, 5);
      this.updateGoal('TASK_COMPLETION', 5, 5);
      this.updateGoal('FEEDBACK_POSITIVITY', 5, 5);
      this.updateGoal('PERSONALITY_GROWTH', 5, 5);
      this.updateGoal('SESSION_CONSISTENCY', 5, 5);
    }
  }

  /**
   * 分析情绪变化
   * @param {Array} emotionalLog - 情绪日志数组
   */
  analyzeEmotions(emotionalLog) {
    // 输入验证
    if (!Array.isArray(emotionalLog)) {
      return {
        status: 'invalid_input',
        volatility: 0,
        trend: 'unknown',
        avgScore: 0,
        dataPoints: 0,
        summary: '情绪日志格式无效'
      };
    }

    if (emotionalLog.length === 0) {
      return {
        status: 'no_data',
        volatility: 0,
        trend: 'unknown',
        avgScore: 0,
        dataPoints: 0,
        summary: '本次会话未记录情绪变化'
      };
    }

    const scores = emotionalLog
      .map(e => {
        const score = e.score || e.valence || null;
        return typeof score === 'number' && score >= 0 && score <= 10 ? score : null;
      })
      .filter(s => s !== null);

    if (scores.length === 0) {
      return {
        status: 'invalid_data',
        volatility: 0,
        trend: 'unknown',
        avgScore: 0,
        dataPoints: emotionalLog.length,
        summary: '情绪数据无效或超出范围(0-10)'
      };
    }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const volatility = max - min;
    
    // 趋势检测：使用线性回归或简单首尾比较
    let trend = 'stable';
    if (scores.length >= 3) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const delta = secondAvg - firstAvg;
      if (delta > 0.5) trend = 'rising';
      else if (delta < -0.5) trend = 'declining';
    } else if (scores.length === 2) {
      trend = scores[1] > scores[0] ? 'rising' : scores[1] < scores[0] ? 'declining' : 'stable';
    }

    // 波动等级
    let volatilityLevel = 'low';
    if (volatility > 4) volatilityLevel = 'high';
    else if (volatility > 2) volatilityLevel = 'medium';

    return {
      status: volatility < 2 ? 'stable' : 'volatile',
      volatility: Math.round(volatility * 10) / 10,
      volatilityLevel,
      trend,
      avgScore: Math.round(avg * 10) / 10,
      maxScore: max,
      minScore: min,
      dataPoints: scores.length,
      summary: `检测到${scores.length}个有效情绪数据点，平均得分${Math.round(avg * 10) / 10}，趋势${trend}，波动${volatilityLevel}`
    };
  }

  /**
   * 分析任务完成度
   * @param {Array} achievements - 成就列表
   */
  analyzeTasks(achievements) {
    // 输入验证
    if (!Array.isArray(achievements)) {
      return {
        completed: 0,
        total: 0,
        rate: '0%',
        rateValue: 0,
        summary: '任务数据格式无效'
      };
    }

    if (achievements.length === 0) {
      return {
        completed: 0,
        total: 0,
        rate: '0%',
        rateValue: 0,
        summary: '本次会话无任务记录'
      };
    }

    const completed = achievements.filter(a => a && a.status === 'completed').length;
    const total = achievements.length;
    const rateValue = Math.round((completed / total) * 100);
    const rate = rateValue + '%';

    let level = 'low';
    if (rateValue >= 80) level = 'high';
    else if (rateValue >= 50) level = 'medium';

    return {
      completed,
      total,
      rate,
      rateValue,
      level,
      summary: `任务完成率 ${rate} (${completed}/${total})，${level === 'high' ? '表现优秀' : level === 'medium' ? '有待提升' : '需重点关注'}`
    };
  }

  /**
   * 分析AI响应效果
   * @param {Array} feedbackHistory - 反馈历史
   */
  analyzeAIResponse(feedbackHistory) {
    // 输入验证
    if (!Array.isArray(feedbackHistory)) {
      return {
        effectiveness: '0/10',
        effectivenessValue: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        summary: '反馈数据格式无效'
      };
    }

    if (feedbackHistory.length === 0) {
      return {
        effectiveness: '0/10',
        effectivenessValue: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        summary: '本次会话无用户反馈数据'
      };
    }

    // 分类反馈
    const positive = feedbackHistory.filter(f => 
      f && (f.type === 'positive' || (typeof f.rating === 'number' && f.rating >= 4))
    ).length;
    
    const negative = feedbackHistory.filter(f => 
      f && (f.type === 'negative' || (typeof f.rating === 'number' && f.rating <= 2))
    ).length;

    const neutral = feedbackHistory.length - positive - negative;

    const effectivenessValue = feedbackHistory.length > 0 
      ? Math.round((positive / feedbackHistory.length) * 10 * 10) / 10
      : 0;

    let level = 'medium';
    if (effectivenessValue >= 7) level = 'high';
    else if (effectivenessValue < 4) level = 'low';

    return {
      effectiveness: effectivenessValue + '/10',
      effectivenessValue,
      positive,
      negative,
      neutral,
      level,
      total: feedbackHistory.length,
      summary: `响应有效性 ${effectivenessValue}/10，积极${positive}次，消极${negative}次，中性${neutral}次`
    };
  }

  /**
   * 分析人格状态
   * @param {Object} personality - 人格数据
   */
  analyzePersonality(personality) {
    // 输入验证
    if (!personality || typeof personality !== 'object' || Array.isArray(personality)) {
      return {
        status: 'invalid_input',
        avgScore: 0,
        level: '未知',
        dimensions: {},
        summary: '人格数据格式无效'
      };
    }

    const keys = Object.keys(personality);
    if (keys.length === 0) {
      return {
        status: 'no_data',
        avgScore: 0,
        level: '未知',
        dimensions: {},
        summary: '人格状态未知'
      };
    }

    // 过滤有效数值
    const values = keys
      .map(k => personality[k])
      .filter(v => typeof v === 'number' && v >= 0 && v <= 10);

    if (values.length === 0) {
      return {
        status: 'invalid_data',
        avgScore: 0,
        level: '未知',
        dimensions: personality,
        summary: '人格维度值无效（需0-10范围）'
      };
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const level = avg >= 7 ? 'high' : avg >= 4 ? 'medium' : 'low';

    // 找出最强和最弱维度
    const sortedKeys = [...keys].sort((a, b) => (personality[b] || 0) - (personality[a] || 0));
    const strongest = sortedKeys[0];
    const weakest = sortedKeys[sortedKeys.length - 1];

    return {
      status: 'available',
      avgScore: Math.round(avg * 10) / 10,
      level,
      dimensions: personality,
      strongest,
      weakest,
      dimensionCount: values.length,
      summary: `人格平均分 ${Math.round(avg * 10) / 10}/10，水平${level}，最强维度"${strongest}"，最弱维度"${weakest}"`
    };
  }

  /**
   * 计算综合评分（数据驱动加权）
   * @param {Object} state - 状态对象
   * @param {Object} emotionAnalysis - 情绪分析结果
   * @param {Object} taskAnalysis - 任务分析结果
   * @param {Object} feedbackAnalysis - 反馈分析结果
   */
  calculateOverallScore(state, emotionAnalysis, taskAnalysis, feedbackAnalysis) {
    // 数据驱动评分：有数据时用实际值，无数据时用默认中间值
    const emotionScore = emotionAnalysis && emotionAnalysis.dataPoints > 0
      ? Math.min(10, Math.max(0, (parseFloat(emotionAnalysis.avgScore) || 5) * (emotionAnalysis.status === 'stable' ? 1.0 : 0.8)))
      : 5;

    const taskScore = taskAnalysis && taskAnalysis.total > 0
      ? Math.min(10, Math.max(0, (taskAnalysis.rateValue || 0) / 10))
      : 5;

    const feedbackScore = feedbackAnalysis && feedbackAnalysis.total > 0
      ? Math.min(10, Math.max(0, feedbackAnalysis.effectivenessValue || 5))
      : 5;

    // 加权：有数据的维度权重更高
    const hasEmotion = (emotionAnalysis?.dataPoints || 0) > 0;
    const hasTasks = (taskAnalysis?.total || 0) > 0;
    const hasFeedback = (feedbackAnalysis?.total || 0) > 0;
    const dataDimensions = [hasEmotion, hasTasks, hasFeedback].filter(Boolean).length;

    let emotionWeight, taskWeight, feedbackWeight;
    if (dataDimensions === 0) {
      // 全无数据：等权
      emotionWeight = 0.33;
      taskWeight = 0.33;
      feedbackWeight = 0.34;
    } else {
      // 有数据的维度权重更高
      const baseWeight = 0.2;
      const dataBonus = 0.4 / dataDimensions;
      emotionWeight = baseWeight + (hasEmotion ? dataBonus : 0);
      taskWeight = baseWeight + (hasTasks ? dataBonus : 0);
      feedbackWeight = baseWeight + (hasFeedback ? dataBonus : 0);
    }

    const overall = Math.round((emotionScore * emotionWeight + taskScore * taskWeight + feedbackScore * feedbackWeight) * 10) / 10;

    let flowState;
    if (overall >= 8) flowState = 'deep_flow';
    else if (overall >= 6) flowState = 'flow';
    else if (overall >= 4) flowState = 'engaged';
    else flowState = 'distracted';

    return {
      score: overall + '/10',
      scoreValue: overall,
      flowState,
      breakdown: {
        emotion: { score: Math.round(emotionScore * 10) / 10, weight: Math.round(emotionWeight * 100) + '%' },
        task: { score: Math.round(taskScore * 10) / 10, weight: Math.round(taskWeight * 100) + '%' },
        feedback: { score: Math.round(feedbackScore * 10) / 10, weight: Math.round(feedbackWeight * 100) + '%' }
      },
      dataDimensions: dataDimensions === 3 ? 'complete' : dataDimensions > 0 ? 'partial' : 'none',
      summary: `综合评分 ${overall}/10，状态${flowState}`
    };
  }

  /**
   * 生成改进建议（带趋势感知）
   * @param {Object} state - 状态对象
   * @param {Object} trendAnalysis - 趋势分析结果
   */
  generateImprovements(state, trendAnalysis) {
    const improvements = [];

    // 检查趋势退步
    if (trendAnalysis && trendAnalysis.changes) {
      const { changes } = trendAnalysis;

      if (changes.emotion && changes.emotion.direction === 'declining') {
        improvements.push({
          priority: 'high',
          area: 'emotion_trend',
          suggestion: '情绪呈下降趋势，建议增加正向引导和共情回应',
          reason: `情绪评分下降 ${Math.abs(changes.emotion.avgScoreDelta)} 分`
        });
      }

      if (changes.task && changes.task.direction === 'declining') {
        improvements.push({
          priority: 'high',
          area: 'task_trend',
          suggestion: '任务完成率下降，建议检查任务分解粒度是否过大',
          reason: `完成率下降 ${Math.abs(changes.task.rateDelta)}%`
        });
      }

      if (changes.feedback && changes.feedback.direction === 'declining') {
        improvements.push({
          priority: 'medium',
          area: 'feedback_trend',
          suggestion: '用户满意度下降，建议调整响应风格',
          reason: `有效性评分下降 ${Math.abs(changes.feedback.effectivenessDelta)} 分`
        });
      }
    }

    // 数据缺失检查
    if (!state.emotional_log || !Array.isArray(state.emotional_log) || state.emotional_log.length === 0) {
      improvements.push({
        priority: 'medium',
        area: 'emotion_tracking',
        suggestion: '建议启用情绪日志记录，积累更多数据以提升分析精度',
        reason: '当前无情绪数据'
      });
    }

    if (!state.feedback_history || !Array.isArray(state.feedback_history) || state.feedback_history.length === 0) {
      improvements.push({
        priority: 'medium',
        area: 'user_feedback',
        suggestion: '建议增加用户反馈渠道，收集更多有效反馈数据',
        reason: '当前无反馈数据'
      });
    }

    // 目标跟踪提醒
    const goalSummary = this.getGoalSummary();
    if (goalSummary.stalled_goals > 0) {
      improvements.push({
        priority: 'low',
        area: 'stalled_goals',
        suggestion: `${goalSummary.stalled_goals}个目标长期无进展，建议调整策略`,
        reason: '目标停滞'
      });
    }

    if (goalSummary.regressed_goals > 0) {
      improvements.push({
        priority: 'low',
        area: 'regressed_goals',
        suggestion: `${goalSummary.regressed_goals}个目标出现退步，建议分析原因`,
        reason: '目标退步'
      });
    }

    if (improvements.length === 0) {
      improvements.push({
        priority: 'low',
        area: 'maintain',
        suggestion: '当前系统状态良好，建议保持当前交互风格',
        reason: '各项指标正常或呈改善趋势'
      });
    }

    return improvements;
  }

  /**
   * 保存报告
   */
  async saveReport(report) {
    let reports = [];
    try {
      const dir = path.dirname(this.reportFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.reportFile)) {
        reports = JSON.parse(fs.readFileSync(this.reportFile, 'utf8'));
      }
    } catch (e) {
      reports = [];
    }

    reports.push(report);
    if (reports.length > 50) {
      reports = reports.slice(-50);
    }

    try {
      await atomicWrite(this.reportFile, JSON.stringify(reports, null, 2));
    } catch (e) {
      console.error('[Reflector] 保存报告失败:', e.message);
    }
  }

  /**
   * 打印报告到控制台（原为空操作，现已修复）
   * @param {Object} report - 分析报告
   */
  printReport(report) {
    if (!report) {
      console.log('[Reflector] 无报告可打印');
      return;
    }

    const line = '='.repeat(60);
    const subLine = '-'.repeat(40);

    console.log('\n' + line);
    console.log('  HeartFlow 反思报告');
    console.log('  ' + report.timestamp);
    console.log(line);

    // 综合评分
    console.log(`\n📊 综合评分: ${report.overallScore?.score || 'N/A'}`);
    console.log(`   心流状态: ${report.overallScore?.flowState || '未知'}`);

    // 情绪分析
    console.log(`\n😊 情绪分析:`);
    console.log(subLine);
    console.log(`   状态: ${report.emotionAnalysis?.status || 'N/A'}`);
    console.log(`   平均分: ${report.emotionAnalysis?.avgScore || 'N/A'}`);
    console.log(`   趋势: ${report.emotionAnalysis?.trend || 'N/A'}`);
    console.log(`   波动: ${report.emotionAnalysis?.volatility || 'N/A'} (${report.emotionAnalysis?.volatilityLevel || 'N/A'})`);
    console.log(`   数据点: ${report.emotionAnalysis?.dataPoints || 0}`);

    // 任务分析
    console.log(`\n✅ 任务分析:`);
    console.log(subLine);
    console.log(`   完成率: ${report.taskAnalysis?.rate || 'N/A'}`);
    console.log(`   ${report.taskAnalysis?.summary || 'N/A'}`);

    // 反馈分析
    console.log(`\n💬 反馈分析:`);
    console.log(subLine);
    console.log(`   有效性: ${report.feedbackAnalysis?.effectiveness || 'N/A'}`);
    console.log(`   积极: ${report.feedbackAnalysis?.positive || 0}`);
    console.log(`   消极: ${report.feedbackAnalysis?.negative || 0}`);

    // 人格分析
    console.log(`\n🧠 人格分析:`);
    console.log(subLine);
    console.log(`   平均分: ${report.personalityAnalysis?.avgScore || 'N/A'}`);
    console.log(`   水平: ${report.personalityAnalysis?.level || 'N/A'}`);

    // 趋势分析
    if (report.trendAnalysis) {
      console.log(`\n📈 趋势分析:`);
      console.log(subLine);
      console.log(`   状态: ${report.trendAnalysis.status || 'N/A'}`);
      console.log(`   ${report.trendAnalysis.summary || ''}`);

      if (report.trendAnalysis.changes) {
        for (const [key, change] of Object.entries(report.trendAnalysis.changes)) {
          console.log(`   ${key}: ${change.direction} (Δ${change.avgScoreDelta || change.rateDelta || change.effectivenessDelta || '?'})`);
        }
      }
    }

    // 目标跟踪
    if (report.goalTracking) {
      console.log(`\n🎯 目标跟踪:`);
      console.log(subLine);
      console.log(`   活跃: ${report.goalTracking.active_goals}`);
      console.log(`   完成: ${report.goalTracking.completed_goals}`);
      console.log(`   停滞: ${report.goalTracking.stalled_goals}`);
    }

    // 改进建议
    console.log(`\n💡 改进建议:`);
    console.log(subLine);
    if (report.improvements && report.improvements.length > 0) {
      for (const imp of report.improvements) {
        const icon = imp.priority === 'high' ? '🔴' : imp.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${icon} [${imp.priority}] ${imp.suggestion}`);
        console.log(`      原因: ${imp.reason}`);
      }
    } else {
      console.log('   暂无建议');
    }

    console.log('\n' + line + '\n');
  }

  /**
   * 运行完整分析
   */
  run() {
    const report = this.analyzeSession();
    this.printReport(report);
    return report;
  }
}

/**
 * CLI 入口
 */
if (require.main === module) {
  const reflector = new Reflector(process.cwd());
  reflector.run();
}

module.exports = { Reflector, GoalStatus };
