/**
 * Reflector - 反思模块
 * 分析心流会话日志，生成结构化反思报告
 */

const fs = require('fs');
const path = require('path');

class Reflector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'heartflow_state.json');
    this.reportFile = path.join(projectRoot, 'logs', 'reflect-reports.json');
    this.logFile = path.join(projectRoot, 'logs', 'reflect.log');
    
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

  log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, entry);
    console.log(`[Reflector] ${message}`);
  }

  /**
   * 分析会话
   */
  analyzeSession() {
    this.log('开始分析心流会话...');
    
    const state = this.loadState();
    
    const report = {
      timestamp: new Date().toISOString(),
      session_time: state.last_session,
      total_sessions: state.total_sessions,
      
      emotionAnalysis: this.analyzeEmotions(state.emotional_log),
      taskAnalysis: this.analyzeTasks(state.achievements),
      aiResponseAnalysis: this.analyzeAIResponse(state.feedback_history),
      personalityAnalysis: this.analyzePersonality(state.personality),
      
      overallScore: this.calculateOverallScore(state),
      improvements: this.generateImprovements(state)
    };

    this.saveReport(report);
    this.log('会话分析完成');
    
    return report;
  }

  /**
   * 分析情绪变化
   */
  analyzeEmotions(emotionalLog) {
    if (!emotionalLog || emotionalLog.length === 0) {
      return {
        status: '无数据',
       波动: '未知',
       趋势: '未知',
        summary: '本次会话未记录情绪变化'
      };
    }

    const scores = emotionalLog.map(e => e.score || e.valence || 5);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const volatility = max - min;
    
    const trend = scores.length > 1 
      ? (scores[scores.length - 1] > scores[0] ? '上升' : 
         scores[scores.length - 1] < scores[0] ? '下降' : '平稳')
      : '稳定';

    return {
      status: volatility < 2 ? '稳定' : '波动',
      volatility: volatility.toFixed(1),
      trend: trend,
      avgScore: avg.toFixed(1),
      dataPoints: emotionalLog.length,
      summary: `检测到${emotionalLog.length}个情绪数据点，平均得分${avg.toFixed(1)}，情绪${trend}`
    };
  }

  /**
   * 分析任务完成度
   */
  analyzeTasks(achievements) {
    if (!achievements || achievements.length === 0) {
      return {
        completed: 0,
        total: 0,
        rate: '0%',
        summary: '本次会话无任务记录'
      };
    }

    const completed = achievements.filter(a => a.status === 'completed').length;
    const total = achievements.length;
    const rate = ((completed / total) * 100).toFixed(0) + '%';

    return {
      completed: completed,
      total: total,
      rate: rate,
      summary: `任务完成率 ${rate} (${completed}/${total})`
    };
  }

  /**
   * 分析AI响应效果
   */
  analyzeAIResponse(feedbackHistory) {
    if (!feedbackHistory || feedbackHistory.length === 0) {
      return {
        effectiveness: '未知',
        positive: 0,
        negative: 0,
        summary: '本次会话无用户反馈数据'
      };
    }

    const positive = feedbackHistory.filter(f => 
      f.type === 'positive' || f.rating >= 4
    ).length;
    
    const negative = feedbackHistory.filter(f => 
      f.type === 'negative' || f.rating <= 2
    ).length;

    const effectiveness = feedbackHistory.length > 0 
      ? ((positive / feedbackHistory.length) * 10).toFixed(1)
      : '5.0';

    return {
      effectiveness: effectiveness + '/10',
      positive: positive,
      negative: negative,
      summary: `响应有效性评分 ${effective}/10，积极反馈${positive}次，消极反馈${negative}次`
    };
  }

  /**
   * 分析人格状态
   */
  analyzePersonality(personality) {
    if (!personality || Object.keys(personality).length === 0) {
      return {
        status: '无数据',
        summary: '人格状态未知'
      };
    }

    const values = Object.values(personality);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const level = avg >= 7 ? '高' : avg >= 5 ? '中等' : '低';

    return {
      avgScore: avg.toFixed(1),
      level: level,
      dimensions: personality,
      summary: `人格平均分 ${avg.toFixed(1)}/10，水平${level}`
    };
  }

  /**
   * 计算综合评分
   */
  calculateOverallScore(state) {
    const emotionScore = state.emotional_log?.length > 0 ? 7 : 5;
    const taskScore = state.achievements?.length > 0 ? 7 : 5;
    const feedbackScore = state.feedback_history?.length > 0 
      ? (state.feedback_history.filter(f => f.rating >= 4).length / state.feedback_history.length * 10)
      : 5;
    
    const overall = (emotionScore * 0.3 + taskScore * 0.3 + feedbackScore * 0.4).toFixed(1);
    
    return {
      score: overall + '/10',
      flowState: overall >= 7 ? '已入流' : overall >= 5 ? '进行中' : '未入流'
    };
  }

  /**
   * 生成改进建议
   */
  generateImprovements(state) {
    const improvements = [];

    if (!state.emotional_log || state.emotional_log.length === 0) {
      improvements.push({
        priority: '高',
        area: '情绪追踪',
        suggestion: '建议启用情绪日志记录，积累更多数据以提升分析精度',
        reason: '当前无情绪数据'
      });
    }

    if (!state.feedback_history || state.feedback_history.length === 0) {
      improvements.push({
        priority: '高',
        area: '用户反馈',
        suggestion: '建议增加用户反馈渠道，收集更多有效反馈数据',
        reason: '当前无反馈数据'
      });
    }

    const personality = state.personality || {};
    if (personality.introspection && personality.introspection < 6) {
      improvements.push({
        priority: '中',
        area: '自省能力',
        suggestion: '建议增加反思性对话频率，帮助用户深化自我认知',
        reason: '自省分数偏低'
      });
    }

    if (improvements.length === 0) {
      improvements.push({
        priority: '低',
        area: '保持',
        suggestion: '当前系统状态良好，建议保持当前交互风格',
        reason: '各项指标正常'
      });
    }

    return improvements;
  }

  /**
   * 保存报告
   */
  saveReport(report) {
    let reports = [];
    try {
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

    const dir = path.dirname(this.reportFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.reportFile, JSON.stringify(reports, null, 2));
  }

  /**
   * 打印报告到控制台
   */
  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 心流会话反思报告');
    console.log('='.repeat(60));
    
    console.log('\n【基本信息】');
    console.log(`  会话时间: ${report.session_time}`);
    console.log(`  会话总数: ${report.total_sessions}`);
    
    console.log('\n【情绪分析】');
    console.log(`  状态: ${report.emotionAnalysis.status}`);
    console.log(`  波动: ${report.emotionAnalysis.volatility}`);
    console.log(`  趋势: ${report.emotionAnalysis.trend}`);
    console.log(`  总结: ${report.emotionAnalysis.summary}`);
    
    console.log('\n【任务完成】');
    console.log(`  ${report.taskAnalysis.summary}`);
    
    console.log('\n【AI响应效果】');
    console.log(`  有效性: ${report.aiResponseAnalysis.effectiveness}`);
    console.log(`  总结: ${report.aiResponseAnalysis.summary}`);
    
    console.log('\n【人格状态】');
    console.log(`  ${report.personalityAnalysis.summary}`);
    
    console.log('\n【综合评分】');
    console.log(`  得分: ${report.overallScore.score}`);
    console.log(`  心流状态: ${report.overallScore.flowState}`);
    
    console.log('\n【改进建议】');
    report.improvements.forEach((imp, i) => {
      console.log(`  ${i + 1}. [${imp.priority}] ${imp.area}: ${imp.suggestion}`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
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

module.exports = { Reflector };
