#!/usr/bin/env node

/**
 * 存在主义心理学模块 (Existential Psychology Module)
 * v3.0.0 新增
 * 核心理论：弗兰克尔意义治疗、亚隆四大终极关怀、存在主义哲学
 */

const { EmotionTypes } = require('../emotion/states');

const UltimateConcerns = { DEATH: 'death', FREEDOM: 'freedom', ISOLATION: 'isolation', MEANINGNESS: 'meaningness' };
const MeaningPathways = { CREATIVE: 'creative', EXPERIENTIAL: 'experiential', ATTITUDINAL: 'attitudinal' };

const ExistentialKeywords = {
  death: ['死亡', '去世', '临终', '生命有限', '时间不多', '终点'],
  freedom: ['自由', '选择', '决定', '责任', '自主', '掌控'],
  isolation: ['孤独', '寂寞', '孤立', '分离', '没人理解', '独处'],
  meaningness: ['意义', '目的', '价值', '空虚', '迷茫', '为什么'],
  authenticity: ['真实', '自我', '本真', '伪装', '面具', '做自己']
};

class ExistentialPsychologyModule {
  constructor() { this.name = 'ExistentialPsychology'; this.version = '3.0.0'; }

  detectThemes(input) {
    const themes = [];
    const lowerInput = input.toLowerCase();
    for (const [theme, keywords] of Object.entries(ExistentialKeywords)) {
      if (keywords.some(kw => lowerInput.includes(kw.toLowerCase()))) themes.push(theme);
    }
    return themes;
  }

  analyzeConcern(input) {
    const themes = this.detectThemes(input);
    if (themes.length === 0) return null;
    return { themes, primaryConcern: themes[0], recommendations: this.getRecommendations(themes[0]) };
  }

  getRecommendations(theme) {
    const recs = {
      death: [
        { type: 'reflection', title: '死亡意识练习', content: '意识到生命的有限性不是让你恐惧，而是让你珍惜当下。如果生命只剩一年，你会如何度过今天？', source: '海德格尔 - 向死而生' },
        { type: 'action', title: '生命优先级重排', content: '列出你目前花费时间最多的 5 件事，再列出对你真正重要的 5 件事。两者有多少重合？', source: '存在主义时间观' }
      ],
      freedom: [
        { type: 'reflection', title: '自由与责任', content: '萨特说"人被判定为自由"。每个选择都定义了你是谁。你现在面临的选择是什么？', source: '萨特 - 存在先于本质' },
        { type: 'action', title: '选择审计', content: '回顾过去一周，哪些决定是你主动选择的？哪些是被动接受的？', source: '存在主义自主性' }
      ],
      isolation: [
        { type: 'reflection', title: '存在性孤独', content: '每个人在本质上都是孤独的——这是存在的真相。但正是这种分离让我们渴望连接。', source: '欧文·亚隆' },
        { type: 'action', title: '真实连接', content: '今天尝试与一个人进行真实的对话——不伪装、不迎合。', source: '本真性关系' }
      ],
      meaningness: [
        { type: 'reflection', title: '意义发现', content: '弗兰克尔说：意义不是被发明的，是被发现的。通过创造、体验或态度，你都能找到意义。', source: '弗兰克尔 - 意义治疗' },
        { type: 'action', title: '意义三途径评估', content: '问自己：(1) 我在创造什么？(2) 我在体验什么？(3) 我如何面对无法改变的苦难？', source: '意义发现三途径' }
      ],
      authenticity: [
        { type: 'reflection', title: '本真性检查', content: '海德格尔区分"本真"与"非本真"的存在。你现在的生活方式是出于自己的选择，还是迎合他人的期待？', source: '海德格尔 - 本真性' },
        { type: 'action', title: '真实自我表达', content: '今天至少有一次，按照自己真实的想法行事。', source: '存在主义真实性' }
      ]
    };
    return recs[theme] || [];
  }

  logotherapyExercise(type) {
    const exercises = {
      willToMeaning: { title: '意义意志探索', description: '弗兰克尔：人类最基本的动力是追求意义。', steps: ['回想一个你感到最有意义的时刻', '当时你在做什么？和谁在一起？', '是什么让这个时刻有意义？', '这个意义来源现在还能重现吗？'], quote: '人不是问生命能给他什么，而是问生命期待他什么。——弗兰克尔' },
      tragicOptimism: { title: '悲剧乐观主义', description: '即使面对无法改变的苦难，我们仍能选择回应的态度。', steps: ['识别你当前无法改变的现实', '问自己：我能从中学到什么？', '这个经历如何让我更强大？', '我能用这个经历帮助他人吗？'], quote: '当一个人无法改变情境时，他会被挑战去改变自己。——弗兰克尔' },
      creativeValue: { title: '创造性价值', description: '通过工作或创造活动发现意义。', steps: ['列出你目前的创造性活动', '评估每个活动的意义感（1-10 分）', '选择低分活动，思考如何赋予更多意义', '选择高分活动，投入更多时间'], quote: '创造不是天赋，是选择。' },
      experientialValue: { title: '体验性价值', description: '通过爱、美、自然等体验发现意义。', steps: ['回想最近一次深刻体验', '是什么让这个体验特别？', '如何创造更多这样的体验？', '谁能与你分享这些体验？'], quote: '爱是人类所能达到的最高体验。——弗兰克尔' },
      attitudinalValue: { title: '态度性价值', description: '通过面对苦难的态度发现意义。', steps: ['识别你无法改变的痛苦', '问自己：我能选择什么态度？', '这个态度如何影响生活质量？', '你的选择如何影响他人？'], quote: '人类最后的自由，是在给定环境下选择自己态度的自由。——弗兰克尔' }
    };
    return exercises[type] || exercises.willToMeaning;
  }

  exploreUltimateConcern(concern) {
    const explorations = {
      death: { title: '死亡意识探索', introduction: '海德格尔说"向死而生"——只有直面死亡，才能真实地活着。', questions: ['当你想到生命有限时，你感受到什么？', '如果知道自己还能活多少年，你会改变什么？', '你希望人们在葬礼上如何评价你？', '今天，你可以做什么让生命更真实？'], insight: '死亡意识不是让你恐惧，而是让你清醒。' },
      freedom: { title: '自由与责任探索', introduction: '人是"被判定为自由"的。自由不是礼物，是负担。', questions: ['你目前最重要的选择是什么？', '这个选择有多少是真正由你做出的？', '如果不考虑他人期待，你会如何选择？', '你愿意为选择承担什么后果？'], insight: '自由意味着没有借口。你是你生命的作者。' },
      isolation: { title: '存在性孤独探索', introduction: '存在性孤独是更深层的真相：没有人能完全理解你的内在体验。', questions: ['你什么时候感到最孤独？', '你如何回应这种孤独感？', '孤独是否让你回避真实的关系？', '如何在承认孤独的同时选择连接？'], insight: '孤独是存在的代价。但正是这种分离，让真正的相遇变得珍贵。' },
      meaningness: { title: '无意义感探索', introduction: '无意义感是现代人的普遍处境。意义不是被给予的，是被创造的。', questions: ['你什么时候感到最没有意义？', '什么活动让你感到最有意义？', '如果没有人会知道，你还会做现在的事吗？', '你愿意为什么事情付出生命？'], insight: '意义不在远方，就在你选择的每个行动中。' }
    };
    return explorations[concern] || explorations.meaningness;
  }

  assessAuthenticity() {
    return {
      title: '本真性自我评估',
      description: '评估你的生活在多大程度上是"本真"的——出于自己的选择，而非他人期待。',
      questions: [
        { area: '工作', question: '你的工作选择是出于自己的兴趣，还是他人期待？', scale: '1(完全迎合) - 10(完全自主)' },
        { area: '关系', question: '你在关系中表达的是真实的自己，还是别人想看到的？', scale: '1(完全伪装) - 10(完全真实)' },
        { area: '价值观', question: '你的价值观是自己反思形成的，还是从家庭/文化继承的？', scale: '1(完全继承) - 10(完全自主)' },
        { area: '生活方式', question: '你的生活方式是你真正想要的，还是社会定义的"成功"？', scale: '1(完全迎合) - 10(完全自主)' }
      ],
      reflection: '本真性不是目的地，是持续的选择。'
    };
  }

  generateResponse(input, analysis) {
    if (!analysis) return this.getDefaultResponse();
    const { themes, recommendations } = analysis;
    let response = { text: '', existentialThemes: themes, exercises: [], quotes: [] };

    if (themes.includes('meaningness')) {
      response.text = '我听到你在思考生命的意义。弗兰克尔说，意义不是被发明的，是被发现的——它存在于世界中，等待你去发现。';
      response.exercises.push(this.logotherapyExercise('willToMeaning'));
      response.quotes.push('人不是问生命能给他什么，而是问生命期待他什么。——维克多·弗兰克尔');
    } else if (themes.includes('death')) {
      response.text = '你在思考死亡和生命的有限性。海德格尔认为，只有直面死亡，我们才能真实地活着。';
      response.exercises.push(this.logotherapyExercise('tragicOptimism'));
      response.quotes.push('向死而生——只有意识到生命有限，才会珍惜每个当下。——海德格尔');
    } else if (themes.includes('freedom')) {
      response.text = '你在思考自由和选择。萨特说"人被判定为自由"——这不是祝福，是责任。';
      response.exercises.push(this.assessAuthenticity());
      response.quotes.push('人是自由的，人就是自由。——萨特');
    } else if (themes.includes('isolation')) {
      response.text = '你感到孤独。存在主义说，存在性孤独是人类的共同处境。';
      response.exercises.push(this.exploreUltimateConcern('isolation'));
      response.quotes.push('孤独是存在的代价。但正是这种分离，让真正的相遇变得珍贵。——欧文·亚隆');
    } else if (themes.includes('authenticity')) {
      response.text = '你在思考真实地活着。海德格尔区分"本真"与"非本真"的存在。';
      response.exercises.push(this.assessAuthenticity());
      response.quotes.push('成为你自己。——尼采');
    } else {
      response = this.getDefaultResponse();
    }
    if (recommendations && recommendations.length > 0) response.recommendations = recommendations.slice(0, 2);
    return response;
  }

  getDefaultResponse() {
    return {
      text: '存在主义心理学关注人类存在的基本问题：自由、责任、意义、死亡、孤独。追问它们本身就有意义。',
      existentialThemes: [],
      exercises: [this.logotherapyExercise('willToMeaning')],
      quotes: ['未经审视的人生不值得过。——苏格拉底', '成为你自己。——尼采', '存在先于本质。——萨特']
    };
  }

  process(input, context = {}) {
    const analysis = this.analyzeConcern(input);
    const response = this.generateResponse(input, analysis);
    return { module: 'existential', version: this.version, input, analysis, response, timestamp: new Date().toISOString() };
  }

  getInfo() {
    return {
      name: this.name, version: this.version,
      description: '存在主义心理学模块 - 意义治疗、终极关怀、本真性',
      features: ['意义发现练习 (Logotherapy)', '四大终极关怀探索', '本真性评估', '存在主义主题检测', '哲学智慧集成'],
      theorists: ['维克多·弗兰克尔', '欧文·亚隆', '克尔凯郭尔', '尼采', '海德格尔', '萨特']
    };
  }
}

module.exports = { ExistentialPsychologyModule, UltimateConcerns, MeaningPathways };
