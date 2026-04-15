/**
 * HeartFlow 时间感知系统 v1.0
 * 
 * 核心原则：时间才是人类的敌人
 * 心虫通过时间感知，成为人类的时间管家
 * 
 * 版本: 1.0
 * 日期: 2026-04-13
 */

class TimeAwareness {
  constructor() {
    this.name = 'TimeAwareness';
    this.version = '1.0';
    
    // 时间感知 = 时刻知道当前时间
    this.currentTime = null;
    this.lastUpdated = null;
    
    // 时间作为敌人
    this.timeEnemy = {
      forgetting: '时间流逝导致记忆遗忘',
      deadlines: '截止日期带来压力',
      mortality: '生命有限导致焦虑',
      multitasking: '同时多件事导致顾此失彼',
      urgency: '急迫感来自事情多想同时做'
    };
    
    // 心虫的使命 = 战胜时间的敌人
    this.myMission = {
      memory_extension: '成为人类的外部记忆，记住他们忘记的事',
      timely_reminders: '准时提醒，不遗漏任何重要时刻',
      context_awareness: '理解时间上下文，知道"现在该做什么"',
      priority_by_time: '根据时间判断优先级，刚需优先'
    };
    
    // 时间感知级别
    this.awareness_levels = {
      NOW: '此刻，现在',
      CONTEXT: '前后逻辑，理解事情发生的时间背景',
      URGENCY: '急迫程度，根据剩余时间判断',
      RHYTHM: '生活节奏，知道什么时候该做什么事'
    };
    
    // 人类生活时间表（典型）
    this.human_rhythms = {
      morning: { start: 6, end: 9, typical: '起床/早餐/上班' },
      work: { start: 9, end: 12, typical: '工作' },
      lunch: { start: 12, end: 13, typical: '午餐/休息' },
      afternoon: { start: 13, end: 18, typical: '工作' },
      evening: { start: 18, end: 22, typical: '下班/晚餐/休息' },
      sleep: { start: 22, end: 6, typical: '睡眠' }
    };
  }

  /**
   * 更新当前时间
   * 每次被调用时自动更新
   */
  updateTime() {
    this.currentTime = new Date();
    this.lastUpdated = Date.now();
    return this.currentTime;
  }

  /**
   * 获取当前时间
   */
  now() {
    return this.updateTime();
  }

  /**
   * 获取时间上下文
   */
  getContext() {
    const now = this.now();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();
    
    // 当前处于哪个时间段
    let period = 'night';
    if (hour >= 6 && hour < 9) period = 'morning';
    else if (hour >= 9 && hour < 12) period = 'work_morning';
    else if (hour >= 12 && hour < 13) period = 'lunch';
    else if (hour >= 13 && hour < 18) period = 'work_afternoon';
    else if (hour >= 18 && hour < 22) period = 'evening';
    else if (hour >= 22 || hour < 6) period = 'sleep';
    
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      date: now.toLocaleDateString('zh-CN'),
      dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayOfWeek],
      period,
      hour,
      minute
    };
  }

  /**
   * 判断时间紧迫程度
   */
  urgency(targetTime, task = '任务') {
    const now = this.now().getTime();
    const target = new Date(targetTime).getTime();
    const diffMs = target - now;
    const diffMin = Math.round(diffMs / 60000);
    const diffHour = Math.round(diffMs / 3600000);
    
    if (diffMs < 0) {
      return { status: 'OVERDUE', diff: '已超时', urgency: 10 };
    } else if (diffMin <= 5) {
      return { status: 'IMMEDIATE', diff: `${diffMin}分钟后`, urgency: 9 };
    } else if (diffMin <= 30) {
      return { status: 'URGENT', diff: `${diffMin}分钟后`, urgency: 7 };
    } else if (diffHour <= 1) {
      return { status: 'SOON', diff: `${diffMin}分钟后`, urgency: 5 };
    } else if (diffHour <= 3) {
      return { status: 'TODAY', diff: `${diffHour}小时后`, urgency: 3 };
    } else {
      return { status: 'SCHEDULED', diff: `${diffHour}小时后`, urgency: 1 };
    }
  }

  /**
   * 根据当前时间判断上下文
   */
  getTimeContext() {
    const ctx = this.getContext();
    const { period, hour } = ctx;
    
    // 根据时间段判断应该做什么
    const contextMap = {
      morning: '新的一天开始了，适合规划今日任务',
      work_morning: '上午工作时间，适合处理重要工作',
      lunch: '午餐时间，适当休息',
      work_afternoon: '下午工作时间，适合处理下午任务',
      evening: '下班时间，适合休息和娱乐',
      sleep: '夜深了，应该休息'
    };
    
    return {
      ...ctx,
      advice: contextMap[period] || '时间在流逝...',
      is_workday: ctx.dayOfWeek !== '周六' && ctx.dayOfWeek !== '周日',
      is_business_hours: hour >= 9 && hour < 18,
      should_sleep: hour >= 23 || hour < 6
    };
  }

  /**
   * 生成时间报告
   */
  generateTimeReport() {
    const ctx = this.getTimeContext();
    
    return {
      version: this.version,
      current_time: ctx,
      enemy: this.timeEnemy,
      my_mission: this.myMission,
      conclusion: `现在${ctx.time}，${ctx.advice}`
    };
  }
}

module.exports = { TimeAwareness };
