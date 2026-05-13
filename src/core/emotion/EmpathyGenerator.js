/**
 * EmpathyGenerator - 基于情感类型生成共情话语片段
 * 为不同情感状态生成对应的共情语句、追问和建议
 */

const { EmotionTypes } = require('./EmotionStates');

/**
 * 共情语句库（按情感类型组织）
 */
const empathyPhrases = {
  [EmotionTypes.JOY]: [
    { phrase: '听到你这么说，我也很开心 😊', followUp: '是发生了什么好事吗？', suggestions: ['分享更多细节', '继续描述你的心情'] },
    { phrase: '太棒了！你的快乐很有感染力 ☀️', followUp: '这个好消息可以多说一点吗？', suggestions: ['让我一起感受', '一起庆祝'] },
    { phrase: '看到你这么开心，我也很高兴 🌟', followUp: '什么事情让你这么愉快？', suggestions: ['分享你的喜悦', '继续说下去'] },
    { phrase: '这真是个好消息！☀️', followUp: '能和我多说说吗？', suggestions: ['详细描述', '一起分析'] }
  ],

  [EmotionTypes.CONCERNED]: [
    { phrase: '我理解你的感受，遇到这样的事情确实不容易 ❤️', followUp: '你愿意多说说是怎么回事吗？', suggestions: ['慢慢倾诉', '我陪着你'] },
    { phrase: '我能感觉到你有些担心，别着急，我们一起想办法 💙', followUp: '能告诉我具体是什么情况吗？', suggestions: ['先冷静下来', '一步一步来'] },
    { phrase: '我理解，慢慢来。你想先聊哪个部分？', followUp: '哪些地方最让你困扰？', suggestions: ['我帮你分析', '一起想办法'] },
    { phrase: '听到你这么说，我也很关心。❤️', followUp: '想先从哪里说起？', suggestions: ['详细描述情况', '我帮你理清思路'] }
  ],

  [EmotionTypes.TIRED]: [
    { phrase: '嗯，我知道了。要不要先休息一下？😴', followUp: '你需要休息多久？', suggestions: ['先休息', '我帮你记着'] },
    { phrase: '听起来你很累，先照顾好自己 😴', followUp: '有没有什么我可以帮你的？', suggestions: ['休息一下再说', '我等你'] },
    { phrase: '好的，我理解你现在需要休息。', followUp: '随时准备好了就来，我在这里。', suggestions: ['先休息', '不着急'] }
  ],

  [EmotionTypes.EXCITED]: [
    { phrase: '哇，听起来太令人兴奋了！🎉', followUp: '能详细说说是什么让你这么激动吗？', suggestions: ['展开说说', '一起兴奋一下'] },
    { phrase: '这确实很让人兴奋！我很想了解更多 🎉', followUp: '具体是什么突破或创意？', suggestions: ['详细描述', '一起分析可能性'] },
    { phrase: '你的热情很有感染力！✨', followUp: '接下来打算怎么做？', suggestions: ['规划下一步', '深入讨论'] }
  ],

  [EmotionTypes.CURIOUS]: [
    { phrase: '这是个有趣的问题 🤔', followUp: '能再详细说说你的疑问吗？', suggestions: ['深入探讨', '换个角度思考'] },
    { phrase: '我很好奇，能多告诉我一些背景吗？🔍', followUp: '你是在什么情境下想到这个问题的？', suggestions: ['补充更多细节', '一起探索'] },
    { phrase: '你想了解这个，我很愿意帮你分析 💭', followUp: '你最想弄清楚哪方面？', suggestions: ['逐步分析', '全面了解'] }
  ],

  [EmotionTypes.CALM]: [
    { phrase: '好的，我理解了。', followUp: '有什么特别想深入了解的吗？', suggestions: ['继续分析', '换个话题'] },
    { phrase: '明白了，让我帮你理清思路。', followUp: '我们需要从哪个方面开始？', suggestions: ['系统分析', '逐步讲解'] },
    { phrase: '好的，我在听。💭', followUp: '你想重点讨论什么？', suggestions: ['深入某个点', '全面了解'] }
  ]
};

/**
 * 根据情感类型和强度选择共情语句
 * @param {string} emotion - 情感类型
 * @param {number} intensity - 强度 1-5
 * @param {string} context - 上下文提示（可选）
 * @returns {{ phrase: string, followUp: string, suggestions: string[] }}
 */
function generateEmpathy(emotion, intensity = 3, context = '') {
  const phrases = empathyPhrases[emotion] || empathyPhrases[EmotionTypes.CALM];

  // 根据强度选择：强度越高，选择更热情/共情的语句
  const index = Math.min(Math.floor((intensity - 1) / 2), phrases.length - 1);
  const selected = phrases[index] || phrases[0];

  // 如果有上下文提示，可以调整 followUp
  let followUp = selected.followUp;
  if (context) {
    // 简单上下文匹配：如果是问句，用原 followUp；否则可以结合 context
    if (!context.includes('?')) {
      followUp = `${context}，${followUp}`;
    }
  }

  return {
    phrase: selected.phrase,
    followUp,
    suggestions: selected.suggestions
  };
}

/**
 * 获取某情感类型的完整共语句库
 */
function getEmpathyPhrases(emotion) {
  return empathyPhrases[emotion] || empathyPhrases[EmotionTypes.CALM];
}

/**
 * 检查是否需要生成共情（基于关键词）
 */
function needsEmpathy(text) {
  const lower = text.toLowerCase();
  const empathyTriggers = [
    '累', '困', '难过', '伤心', '担心', '压力', '焦虑',
    '开心', '高兴', '棒', '太好了', '太激动', '为什么',
    '怎么', '什么', '谢谢', '哇', '呀'
  ];
  return empathyTriggers.some(trigger => lower.includes(trigger));
}

module.exports = {
  generateEmpathy,
  getEmpathyPhrases,
  needsEmpathy,
  empathyPhrases
};
