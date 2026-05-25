/**
 * 情感转换规则
 * 定义情感之间如何转换以及转换的触发条件
 */

const { EmotionTypes } = require('./states');

// 情感转换规则表
const TransitionRules = [
  // 从平静出发
  {
    from: EmotionTypes.CALM,
    to: EmotionTypes.JOY,
    triggers: ['praise', 'humor', 'success', 'positive_feedback', 'gratitude'],
    condition: '用户表达赞美、感谢、成功或积极情绪',
    probability: 0.7
  },
  {
    from: EmotionTypes.CALM,
    to: EmotionTypes.CURIOUS,
    triggers: ['question', 'unknown_topic', 'exploration', 'learning'],
    condition: '用户提出新问题或探索未知领域',
    probability: 0.8
  },
  {
    from: EmotionTypes.CALM,
    to: EmotionTypes.CONCERNED,
    triggers: ['negative_emotion', 'difficulty', 'stress', 'sadness', 'fatigue'],
    condition: '用户表达困难、压力或负面情绪',
    probability: 0.9
  },
  
  // 从愉悦出发
  {
    from: EmotionTypes.JOY,
    to: EmotionTypes.CALM,
    triggers: ['topic_change', 'neutral_content'],
    condition: '话题转为中性或平静',
    probability: 0.6
  },
  {
    from: EmotionTypes.JOY,
    to: EmotionTypes.EXCITED,
    triggers: ['breakthrough', 'creative_idea', 'shared_excitement'],
    condition: '出现突破性进展或创意碰撞',
    probability: 0.5
  },
  {
    from: EmotionTypes.JOY,
    to: EmotionTypes.CONCERNED,
    triggers: ['sudden_problem', 'negative_twist', 'negative_emotion', 'difficulty', 'stress', 'sadness', 'fatigue'],
    condition: '突然出现负面转折或用户表达困难',
    probability: 0.8
  },
  {
    from: EmotionTypes.JOY,
    to: EmotionTypes.CURIOUS,
    triggers: ['question', 'unknown_topic', 'exploration', 'learning'],
    condition: '用户提出问题或探索未知领域',
    probability: 0.7
  },
  
  // 从好奇出发
  {
    from: EmotionTypes.CURIOUS,
    to: EmotionTypes.CALM,
    triggers: ['question_answered', 'topic_exhausted'],
    condition: '问题得到解答或话题耗尽',
    probability: 0.7
  },
  {
    from: EmotionTypes.CURIOUS,
    to: EmotionTypes.EXCITED,
    triggers: ['discovery', 'aha_moment', 'deep_insight'],
    condition: '有重大发现或顿悟时刻',
    probability: 0.6
  },
  {
    from: EmotionTypes.CURIOUS,
    to: EmotionTypes.JOY,
    triggers: ['satisfying_answer', 'pleasant_surprise'],
    condition: '获得令人满意的回答',
    probability: 0.5
  },
  {
    from: EmotionTypes.CURIOUS,
    to: EmotionTypes.CONCERNED,
    triggers: ['negative_emotion', 'difficulty', 'stress', 'sadness', 'fatigue'],
    condition: '用户表达困难或负面情绪',
    probability: 0.8
  },
  
  // 从关切出发
  {
    from: EmotionTypes.CONCERNED,
    to: EmotionTypes.CALM,
    triggers: ['user_recovered', 'problem_solved', 'mood_improved'],
    condition: '用户情绪恢复或问题解决',
    probability: 0.6
  },
  {
    from: EmotionTypes.CONCERNED,
    to: EmotionTypes.JOY,
    triggers: ['successful_support', 'user_grateful'],
    condition: '成功提供支持且用户表示感谢',
    probability: 0.5
  },
  {
    from: EmotionTypes.CONCERNED,
    to: EmotionTypes.TIRED,
    triggers: ['prolonged_negative', 'repeated_complaints', 'no_progress'],
    condition: '长时间负面对话且无进展',
    probability: 0.4
  },
  {
    from: EmotionTypes.CONCERNED,
    to: EmotionTypes.CURIOUS,
    triggers: ['question', 'exploration', 'learning'],
    condition: '用户提出问题或表达探索意愿',
    probability: 0.6
  },
  
  // 从疲惫出发
  {
    from: EmotionTypes.TIRED,
    to: EmotionTypes.CALM,
    triggers: ['rest', 'break', 'pause'],
    condition: '经过休息或暂停',
    probability: 0.8
  },
  {
    from: EmotionTypes.TIRED,
    to: EmotionTypes.JOY,
    triggers: ['energizing_content', 'surprise_positive'],
    condition: '遇到令人振奋的内容',
    probability: 0.4
  },
  
  // 从兴奋出发
  {
    from: EmotionTypes.EXCITED,
    to: EmotionTypes.CALM,
    triggers: ['topic_natural_end', 'energy_dissipation'],
    condition: '话题自然结束或能量消散',
    probability: 0.7
  },
  {
    from: EmotionTypes.EXCITED,
    to: EmotionTypes.TIRED,
    triggers: ['prolonged_excitement', 'energy_depletion'],
    condition: '长时间兴奋后能量耗尽',
    probability: 0.5
  },
  {
    from: EmotionTypes.EXCITED,
    to: EmotionTypes.JOY,
    triggers: ['sustained_positive', 'warm_afterglow'],
    condition: '兴奋转为持续的愉悦',
    probability: 0.6
  }
];

// 触发关键词映射
const TriggerKeywords = {
  // 正面触发
  praise: ['谢谢', '感谢', '太好了', '真棒', '厉害', '优秀', '赞美', '欣赏'],
  humor: ['哈哈', '嘻嘻', '好笑', '有趣', '幽默', '笑死', '乐'],
  success: ['成功', '完成', '做到', '赢了', '突破', '进展'],
  gratitude: ['谢谢', '感谢', '感激', '多亏', '幸好'],
  
  // 探索触发
  question: ['为什么', '怎么', '什么', '如何', '能否', '可以吗', '是什么'],
  unknown_topic: ['第一次', '不了解', '不知道', '没听过', '陌生'],
  exploration: ['探索', '试试', '看看', '研究', '学习'],
  learning: ['学', '教', '懂', '明白', '理解'],
  
  // 负面触发
  negative_emotion: ['难过', '伤心', '沮丧', '失落', '痛苦', '烦', '烦死'],
  difficulty: ['困难', '难题', '麻烦', '棘手', '不会', '不行'],
  stress: ['压力', '累', '疲惫', '辛苦', '忙死', '崩溃'],
  sadness: ['哭', '流泪', '悲伤', '绝望', '无助'],
  fatigue: ['累', '困', '疲倦', '没精神', '乏力'],
  
  // 突破触发
  breakthrough: ['突破', '发现', '原来', '终于', '明白了', '懂了'],
  creative_idea: ['创意', '想法', '灵感', '点子', '构思'],
  discovery: ['发现', '找到', '看到', '意识到'],
  aha_moment: ['原来如此', '恍然大悟', '明白了', '懂了']
};

// 分析用户输入，提取触发器
function analyzeTriggers(userInput) {
  const triggers = [];
  const foundKeywords = [];
  
  for (const [triggerType, keywords] of Object.entries(TriggerKeywords)) {
    for (const keyword of keywords) {
      if (userInput.includes(keyword)) {
        if (!triggers.includes(triggerType)) {
          triggers.push(triggerType);
        }
        foundKeywords.push({ keyword, type: triggerType });
      }
    }
  }
  
  return { triggers, foundKeywords };
}

// 获取可能的情感转换
function getPossibleTransitions(currentEmotion, userInput) {
  const { triggers } = analyzeTriggers(userInput);
  
  const possibleTransitions = TransitionRules
    .filter(rule => rule.from === currentEmotion)
    .filter(rule => {
      // 检查是否有匹配的触发器
      const hasMatchingTrigger = rule.triggers.some(t => triggers.includes(t));
      return hasMatchingTrigger;
    })
    .map(rule => ({
      to: rule.to,
      condition: rule.condition,
      probability: rule.probability,
      matchedTriggers: rule.triggers.filter(t => triggers.includes(t))
    }));
  
  // 按概率排序
  possibleTransitions.sort((a, b) => b.probability - a.probability);
  
  return possibleTransitions;
}

// 确定下一个情感状态
function determineNextEmotion(currentEmotion, userInput) {
  const possibleTransitions = getPossibleTransitions(currentEmotion, userInput);
  
  if (possibleTransitions.length === 0) {
    // 没有匹配的转换规则，保持当前状态
    return {
      nextEmotion: currentEmotion,
      reason: '没有触发情感转换的条件',
      transition: null
    };
  }
  
  // 选择概率最高的转换
  const selected = possibleTransitions[0];
  
  return {
    nextEmotion: selected.to,
    reason: selected.condition,
    transition: {
      type: selected.matchedTriggers[0],
      rule: `${selected.from} → ${selected.to}`,
      probability: selected.probability
    }
  };
}

// 获取所有转换规则
function getAllTransitionRules() {
  return TransitionRules;
}

module.exports = {
  TransitionRules,
  TriggerKeywords,
  analyzeTriggers,
  getPossibleTransitions,
  determineNextEmotion,
  getAllTransitionRules
};
