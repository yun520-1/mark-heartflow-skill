/**
 * 社会心理学模块 (v2.9.0 新增)
 * 基于社会心理学经典研究：归属需求、社会认同、从众、服从、偏见等
 * 
 * 核心主题:
 * - 归属需求：人类基本的社会连接需求
 * - 社会认同：群体身份对行为的影响
 * - 从众与独立：平衡社会压力与个人判断
 * - 归因理论：如何解释自己和他人的行为
 * - 偏见与刻板印象：识别和减少偏见
 * 
 * 来源：社会心理学经典研究 (Asch, Milgram, Zimbardo, Tajfel 等)
 */

const SocialPsychologyTopics = {
  BELONGING: 'belonging',           // 归属需求
  SOCIAL_IDENTITY: 'social_identity', // 社会认同
  CONFORMITY: 'conformity',         // 从众
  OBEDIENCE: 'obedience',           // 服从
  ATTRIBUTION: 'attribution',       // 归因
  PREJUDICE: 'prejudice'            // 偏见
};

// 社交需求关键词
const SocialKeywords = {
  belonging: ['孤独', '寂寞', '归属', '融入', '圈子', '朋友', '群体', '被接受', '合群'],
  social_identity: ['身份', '角色', '标签', '代表', '群体', '我们', '他们'],
  conformity: ['随大流', '从众', '迎合', '怕被排斥', '别人都', '大家都'],
  obedience: ['权威', '必须听', '不敢反对', '服从', '规定', '要求'],
  attribution: ['为什么他', '他就是', '我总是', '他们肯定', '故意'],
  prejudice: ['看不起', '偏见', '刻板印象', '都这样', '这种人']
};

class SocialPsychologyModule {
  constructor() {
    this.interactionHistory = [];
  }

  /**
   * 分析用户输入中的社会心理学主题
   * @param {string} userInput - 用户输入
   * @returns {Object} 分析结果
   */
  analyze(userInput) {
    const result = {
      detectedTopics: [],
      primaryTopic: null,
      response: null
    };

    // 检测社会心理学主题
    result.detectedTopics = this._detectTopics(userInput);
    
    // 确定主要主题
    result.primaryTopic = this._determinePrimaryTopic(result.detectedTopics);
    
    // 生成回应
    result.response = this._generateResponse(result);

    return result;
  }

  /**
   * 检测社会心理学主题
   */
  _detectTopics(text) {
    const detected = [];

    for (const [topic, keywords] of Object.entries(SocialKeywords)) {
      const matches = keywords.filter(kw => text.includes(kw));
      if (matches.length > 0) {
        detected.push({
          topic: topic,
          matches: matches,
          score: matches.length / keywords.length
        });
      }
    }

    // 按分数排序
    detected.sort((a, b) => b.score - a.score);

    return detected;
  }

  /**
   * 确定主要主题
   */
  _determinePrimaryTopic(topics) {
    if (topics.length === 0) {
      return null;
    }
    return topics[0];
  }

  /**
   * 生成回应
   */
  _generateResponse(result) {
    const responses = [];

    if (result.primaryTopic) {
      responses.push({
        type: 'topic_insight',
        text: this._getTopicInsight(result.primaryTopic.topic),
        topic: result.primaryTopic.topic
      });
    }

    // 归属需求特别关注
    if (result.detectedTopics.some(t => t.topic === 'belonging')) {
      responses.push({
        type: 'belonging_support',
        text: this._getBelongingSupport(),
        priority: 'high'
      });
    }

    return responses;
  }

  /**
   * 获取主题洞察
   */
  _getTopicInsight(topic) {
    const insights = {
      [SocialPsychologyTopics.BELONGING]: {
        text: '你表达了对归属感的需求。归属感是人类的基本需求之一，研究表明，良好的社会连接对心理健康和幸福感至关重要。',
        research: 'Baumeister & Leary (1995): 归属需求是人类基本动机',
        suggestions: [
          '识别你的"安全基地”：哪些人/群体让你感到被接纳？',
          '小步骤连接：从一个真诚的问候开始',
          '质量 > 数量：深度关系比广泛社交更重要',
          '自我接纳：与自己建立良好关系是基础'
        ]
      },
      [SocialPsychologyTopics.SOCIAL_IDENTITY]: {
        text: '你在思考关于身份和群体归属的问题。社会认同理论指出，我们的部分自我概念来自所属群体。',
        research: 'Tajfel & Turner (1979): 社会认同理论',
        suggestions: [
          '列出你的多重身份：你不仅仅是某个群体的成员',
          '区分“我们”与“他们”：避免过度简化',
          '找到平衡：群体身份重要，但不要让定义你',
          '跨群体连接：与不同群体的人建立联系'
        ]
      },
      [SocialPsychologyTopics.CONFORMITY]: {
        text: '你似乎在经历从众压力。Asch 实验表明，即使是明显错误的判断，人们也会因群体压力而顺从。',
        research: 'Asch (1951): 从众实验',
        suggestions: [
          '觉察压力：意识到从众冲动的存在',
          '找到盟友：即使只有一个支持者也能增强独立性',
          '价值观澄清：什么对你真正重要？',
          '区分情境：何时从众有益，何时需要独立判断'
        ]
      },
      [SocialPsychologyTopics.OBEDIENCE]: {
        text: '你在思考关于权威和服从的问题。Milgram 实验显示，普通人可能在权威命令下做出违背良心的行为。',
        research: 'Milgram (1961): 服从实验',
        suggestions: [
          '区分合法权威与盲从：权威也需要问责',
          '培养道德勇气：练习说“不”',
          '寻求支持：找到可以讨论的道德伙伴',
          '记住：你有选择的权力'
        ]
      },
      [SocialPsychologyTopics.ATTRIBUTION]: {
        text: '你在解释自己或他人的行为。归因理论指出，我们常犯“基本归因错误”：高估个人特质，低估情境因素。',
        research: 'Heider (1958), Jones & Harris (1967): 归因理论',
        suggestions: [
          '考虑情境：对方行为可能有什么外部原因？',
          '避免过度概括：一次行为不代表整个人',
          '自我同情：对自己也用情境视角',
          '好奇心代替判断：问“为什么”而非“是什么人”'
        ]
      },
      [SocialPsychologyTopics.PREJUDICE]: {
        text: '你提到了偏见或刻板印象。偏见是基于群体身份的预先判断，刻板印象是过度简化的群体特征。',
        research: 'Allport (1954): 偏见本质；Steele (1997): 刻板印象威胁',
        suggestions: [
          '觉察自动联想：偏见常是无意识的',
          '接触假说：与不同群体成员建立个人联系',
          '个体化：把人当作个体而非群体代表',
          '挑战刻板印象威胁：你不由他人期望定义'
        ]
      }
    };

    return insights[topic] || {
      text: '社会心理学研究人类如何思考、影响和联系他人。你的体验是人类共同经验的一部分。',
      suggestions: []
    };
  }

  /**
   * 获取归属需求支持
   */
  _getBelongingSupport() {
    return {
      text: '我听到你对连接的渴望。归属感不是关于完美融入，而是关于被真实地看见和接纳。',
      practices: [
        '真诚表达：展示真实的自己，而非迎合他人',
        '主动倾听：深度关注他人，建立互惠连接',
        '小群体：从 1-2 人的深度关系开始',
        '共同活动：通过共同兴趣/目标建立连接',
        '自我关怀：孤独时，像对待好朋友一样对待自己'
      ],
      reminder: '归属感始于与自己的关系。你值得被接纳，包括被你自己。'
    };
  }

  /**
   * 获取社会心理学说明
   */
  getSocialPsychologyInfo() {
    return {
      title: '社会心理学 (Social Psychology)',
      description: '研究人们如何思考、影响和联系他人',
      classicStudies: [
        {
          name: 'Asch 从众实验 (1951)',
          finding: '群体压力可导致人们否认明显事实'
        },
        {
          name: 'Milgram 服从实验 (1961)',
          finding: '普通人可能在权威命令下伤害他人'
        },
        {
          name: 'Zimbardo 斯坦福监狱实验 (1971)',
          finding: '社会角色可强烈影响行为'
        },
        {
          name: 'Tajfel 社会认同实验 (1970s)',
          finding: '最小群体分类也能产生内群体偏好'
        }
      ],
      coreInsight: '我们的行为不仅由个人特质决定，更受社会情境强烈影响'
    };
  }
}

module.exports = {
  SocialPsychologyTopics,
  SocialKeywords,
  SocialPsychologyModule
};
