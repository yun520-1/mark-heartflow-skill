/**
 * 运动技能引擎（独立模块）
 * 
 * 功能：
 * 1. 描述运动动作（跑步、游泳、瑜伽等）
 * 2. 生成训练计划（按目标、水平、时间）
 * 3. 分析运动表现（基于输入数据）
 * 
 * 用法：
 * const SportsEngine = require('./sports-engine.js');
 * const engine = new SportsEngine();
 * const result = engine.describeMove('跑步', 'beginner');
 */

class SportsEngine {
  constructor(options = {}) {
    this.sports = {
      running: {
        name: '跑步',
        muscles: ['股四头肌', '腘绳肌', '小腿三头肌'],
        benefits: ['心肺功能提升', '卡路里燃烧', '心理健康改善'],
        beginnerPlan: ['每周3次，每次20分钟', '慢跑为主，心率控制在最大心率60-70%'],
      },
      swimming: {
        name: '游泳',
        muscles: ['背阔肌', '胸大肌', '三角肌'],
        benefits: ['全身运动', '关节低冲击', '心肺功能提升'],
        beginnerPlan: ['每周2次，每次30分钟', '自由泳+蛙泳交替'],
      },
      yoga: {
        name: '瑜伽',
        muscles: ['核心肌群', '背部肌群', '臀部肌群'],
        benefits: ['柔韧性提升', '压力缓解', '平衡感改善'],
        beginnerPlan: ['每周3次，每次30分钟', '从基础体式开始'],
      },
    };
    this.performanceMetrics = ['速度', '距离', '心率', '卡路里', '恢复时间'];
  }

  /**
   * 描述运动动作
   * @param {string} sport - 运动类型
   * @param {string} level - 水平（beginner, intermediate, advanced）
   * @returns {object} - { name, muscles, benefits, plan }
   */
  describeMove(sport, level = 'beginner') {
    const sportData = this.sports[sport];
    if (!sportData) {
      return {
        error: `不支持的运动类型：${sport}`,
        supportedSports: Object.keys(this.sports),
      };
    }

    const planKey = `${level}Plan`;
    const plan = sportData[planKey] || sportData['beginnerPlan'];

    return {
      name: sportData.name,
      muscles: sportData.muscles,
      benefits: sportData.benefits,
      plan,
    };
  }

  /**
   * 生成训练计划
   * @param {string} goal - 目标（fitness, weight_loss, relaxation）
   * @param {number} weeks - 周数
   * @returns {object} - { goal, weeks, schedule }
   */
  generateTrainingPlan(goal = 'fitness', weeks = 4) {
    const schedule = [];
    for (let week = 1; week <= weeks; week++) {
      const intensity = Math.min(week * 10, 100);  // 强度递增
      schedule.push({
        week,
        intensity: `${intensity}%`,
        sessions: [
          { day: '周一', sport: 'running', duration: '20分钟' },
          { day: '周三', sport: 'yoga', duration: '30分钟' },
          { day: '周五', sport: 'swimming', duration: '30分钟' },
        ],
      });
    }

    return {
      goal,
      weeks,
      schedule,
    };
  }

  /**
   * 分析运动表现（简化）
   * @param {object} data - 运动数据（速度、距离、心率等）
   * @returns {object} - { analysis, suggestions }
   */
  analyzePerformance(data) {
    const analysis = [];
    const suggestions = [];

    // 速度分析
    if (data.speed) {
      analysis.push(`速度：${data.speed} km/h`);
      if (data.speed < 8) {
        suggestions.push('速度偏慢，建议增加间歇训练。');
      }
    }

    // 心率分析
    if (data.heartRate) {
      analysis.push(`心率：${data.heartRate} bpm`);
      if (data.heartRate > 160) {
        suggestions.push('心率过高，建议降低强度。');
      }
    }

    return {
      analysis,
      suggestions,
    };
  }
}

module.exports = { SportsEngine };
