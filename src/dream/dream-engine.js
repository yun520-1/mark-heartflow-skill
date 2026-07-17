/**
 * 梦境/潜意识引擎（独立模块）
 * 
 * 功能：
 * 1. 模拟梦境状态（REM 睡眠、浅睡眠、深睡眠）
 * 2. 生成梦境叙事（基于记忆碎片、情绪状态）
 * 3. 辅助潜意识处理（情绪消化、记忆巩固）
 * 
 * 用法：
 * const DreamEngine = require('./dream-engine.js');
 * const engine = new DreamEngine();
 * const dream = engine.generateDream({ mood: 'anxious', memories: ['考试失败', '朋友离开'] });
 */

class DreamEngine {
  constructor(options = {}) {
    this.sleepStages = {
      rem: { name: 'REM 睡眠', description: '梦境最活跃阶段，情绪记忆处理' },
      light: { name: '浅睡眠', description: '记忆巩固开始' },
      deep: { name: '深睡眠', description: '身体修复，记忆整合' },
    };
    
    this.dreamTemplates = {
      anxious: [
        '我梦见自己在考试中，题目看不懂，时间快到了…',
        '我梦见自己在迷路，找不到出口，很焦虑…',
        '我梦见自己在演讲，但忘词了，台下人都在笑…',
      ],
      sad: [
        '我梦见自己走在雨中，身边没有人，很孤独…',
        '我梦见自己回到童年，但找不到回家的路…',
        '我梦见自己送别朋友，醒来时枕头湿了…',
      ],
      happy: [
        '我梦见自己在一片花海中，阳光温暖，很平静…',
        '我梦见自己和朋友在笑，很久没这么开心了…',
        '我梦见自己完成了一个大项目，大家都鼓掌…',
      ],
    };
    
    this.defaultStage = options.defaultStage || 'rem';
  }

  /**
   * 生成梦境叙事
   * @param {object} context - { mood, memories, stage }
   * @returns {object} - { narrative, stage, analysis }
   */
  generateDream(context = {}) {
    const mood = context.mood || 'neutral';
    const memories = context.memories || [];
    const stage = context.stage || this.defaultStage;

    // 1. 选择梦境模板
    const templates = this.dreamTemplates[mood] || this.dreamTemplates['happy'];
    const narrative = templates[Math.floor(Math.random() * templates.length)];

    // 2. 记忆碎片插入（简化）
    let fullNarrative = narrative;
    if (memories.length > 0) {
      const memoryFragment = `梦里还出现了 ${memories[0]} 的画面…`;
      fullNarrative += `\n${memoryFragment}`;
    }

    // 3. 分析
    const analysis = this._analyzeDream(mood, stage);

    return {
      narrative: fullNarrative,
      stage: this.sleepStages[stage].name,
      analysis,
    };
  }

  /**
   * 模拟睡眠周期
   * @param {number} cycles - 睡眠周期数（默认 5）
   * @returns {array} - 睡眠周期详情
   */
  simulateSleep(cycles = 5) {
    const schedule = [];
    for (let i = 1; i <= cycles; i++) {
      schedule.push({
        cycle: i,
        stages: ['light', 'deep', 'rem'],
        description: `第 ${i} 个睡眠周期：浅睡眠 → 深睡眠 → REM`,
      });
    }
    return schedule;
  }

  /**
   * 潜意识处理（情绪消化）
   * @param {string} mood - 当前情绪
   * @param {array} recentEvents - 近期事件
   * @returns {object} - { processedEmotion, suggestions }
   */
  subconsciousProcessing(mood, recentEvents = []) {
    const processedEmotion = {
      anxious: '梦境帮助你面对压力，醒来后可能更清晰。',
      sad: '梦境帮助你释放悲伤，哭泣是自然的疗愈。',
      happy: '梦境强化积极情绪，继续享受生活。',
      neutral: '梦境在整理记忆，明天精神会更好。',
    }[mood] || '梦境在处理情绪，不用太在意。';

    const suggestions = [];
    if (mood === 'anxious') {
      suggestions.push('白天尝试冥想或深呼吸');
      suggestions.push('睡前避免刷手机或工作');
    }
    if (recentEvents.length > 0) {
      suggestions.push(`近期事件「${recentEvents[0]}」可能在梦境中出现，这是大脑在整理记忆。`);
    }

    return {
      processedEmotion,
      suggestions,
    };
  }

  /**
   * 分析梦境
   */
  _analyzeDream(mood, stage) {
    return {
      mood,
      stage: this.sleepStages[stage].name,
      possibleMeaning: this._interpretDream(mood),
      recommendation: this._generateRecommendation(mood),
    };
  }

  /**
   * 解释梦境（简化）
   */
  _interpretDream(mood) {
    const interpretations = {
      anxious: '梦境反映压力，建议放松。',
      sad: '梦境释放情绪，允许自己悲伤。',
      happy: '梦境强化积极，享受当下。',
    };
    return interpretations[mood] || '梦境在整理记忆。';
  }

  /**
   * 生成建议
   */
  _generateRecommendation(mood) {
    const recommendations = {
      anxious: '白天做 5 分钟深呼吸，睡前写感恩日记。',
      sad: '找朋友聊聊，或做一件让自己开心的事。',
      happy: '继续保持，分享快乐给身边的人。',
    };
    return recommendations[mood] || '保持规律作息，睡个好觉。';
  }
}

module.exports = { DreamEngine };
