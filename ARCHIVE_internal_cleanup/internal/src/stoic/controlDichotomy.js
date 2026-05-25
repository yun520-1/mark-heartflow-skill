/**
 * 斯多葛控制二分法模块 (v2.4.0 新增)
 * 基于斯多葛哲学：区分可控与不可控，专注于前者，接受后者
 * 
 * 来源：Stanford Encyclopedia of Philosophy - Stoicism
 * 应用：帮助用户减少焦虑，增强内在控制感
 */

const ControlCategories = {
  CONTROLLABLE: 'controllable',      // 可控的
  UNCONTROLLABLE: 'uncontrollable',  // 不可控的
  MIXED: 'mixed'                     // 部分可控
};

// 可控事物列表
const ControllableItems = [
  '我的判断',
  '我的选择',
  '我的欲望',
  '我的厌恶',
  '我的态度',
  '我的努力',
  '我的价值观',
  '我的回应',
  '我的注意力',
  '我的意图'
];

// 不可控事物列表
const UncontrollableItems = [
  '身体（部分）',
  '财富',
  '名誉',
  '他人看法',
  '过去',
  '未来',
  '天气',
  '交通',
  '经济',
  '他人的行为',
  '外部结果'
];

class StoicControlAnalyzer {
  /**
   * 分析用户输入中的控制范畴
   * @param {string} userInput - 用户输入
   * @returns {Object} 控制分析结果
   */
  analyze(userInput) {
    const result = {
      controllable: [],
      uncontrollable: [],
      mixed: [],
      focus: null,
      stoicAdvice: null
    };

    // 检测可控相关
    result.controllable = this._detectControllable(userInput);
    
    // 检测不可控相关
    result.uncontrollable = this._detectUncontrollable(userInput);
    
    // 检测混合情况
    result.mixed = this._detectMixed(userInput);
    
    // 确定关注焦点
    result.focus = this._determineFocus(result);
    
    // 生成斯多葛建议
    result.stoicAdvice = this._generateAdvice(result);

    return result;
  }

  /**
   * 检测可控内容
   */
  _detectControllable(text) {
    const controllable = [];

    // 检测主动选择词汇
    if (text.match(/(我决定 | 我选择 | 我要 | 我可以 | 我能)/)) {
      controllable.push({
        type: 'active_choice',
        text: '主动选择',
        confidence: 0.9
      });
    }

    // 检测努力/态度
    if (text.match(/(努力 | 尝试 | 尽力 | 态度 | 心态)/)) {
      controllable.push({
        type: 'effort_attitude',
        text: '努力/态度',
        confidence: 0.85
      });
    }

    // 检测自我反思
    if (text.match(/(我觉得 | 我认为 | 我想 | 我的想法)/)) {
      controllable.push({
        type: 'self_reflection',
        text: '自我反思',
        confidence: 0.8
      });
    }

    return controllable;
  }

  /**
   * 检测不可控内容
   */
  _detectUncontrollable(text) {
    const uncontrollable = [];

    // 检测他人相关
    if (text.match(/(他 (们)? | 别人 | 大家 | 所有人)/)) {
      uncontrollable.push({
        type: 'others_behavior',
        text: '他人行为/看法',
        confidence: 0.85
      });
    }

    // 检测外部结果
    if (text.match(/(结果 | 成功 | 失败 | 输 | 赢 | 得到 | 失去)/)) {
      uncontrollable.push({
        type: 'external_outcome',
        text: '外部结果',
        confidence: 0.8
      });
    }

    // 检测过去/未来
    if (text.match(/(后悔 | 当初 | 早知道 | 担心 | 如果.*就 | 万一)/)) {
      uncontrollable.push({
        type: 'past_future',
        text: '过去/未来',
        confidence: 0.9
      });
    }

    // 检测绝对化表达（通常指向不可控）
    if (text.match(/(必须 | 一定 | 应该 | 不得不)/)) {
      uncontrollable.push({
        type: 'rigid_expectation',
        text: '刚性期望',
        confidence: 0.75
      });
    }

    return uncontrollable;
  }

  /**
   * 检测混合情况
   */
  _detectMixed(text) {
    const mixed = [];

    // 工作/学习（部分可控）
    if (text.match(/(工作 | 学习 | 考试 | 项目 | 任务)/)) {
      mixed.push({
        type: 'work_study',
        text: '工作/学习',
        confidence: 0.8,
        explanation: '过程可控，结果部分可控'
      });
    }

    // 关系（部分可控）
    if (text.match(/(关系 | 恋爱 | 友谊 | 家庭)/)) {
      mixed.push({
        type: 'relationships',
        text: '人际关系',
        confidence: 0.85,
        explanation: '你的行为可控，他人反应不可控'
      });
    }

    // 健康（部分可控）
    if (text.match(/(健康 | 身体 | 生病 | 运动)/)) {
      mixed.push({
        type: 'health',
        text: '健康',
        confidence: 0.8,
        explanation: '生活方式可控，身体状况部分可控'
      });
    }

    return mixed;
  }

  /**
   * 确定关注焦点
   */
  _determineFocus(result) {
    const controllableCount = result.controllable.length;
    const uncontrollableCount = result.uncontrollable.length;
    const mixedCount = result.mixed.length;

    if (uncontrollableCount > controllableCount + mixedCount) {
      return {
        type: 'shift_to_controllable',
        message: '注意力过度集中在不可控事物上',
        priority: 'high'
      };
    } else if (controllableCount > uncontrollableCount) {
      return {
        type: 'healthy_focus',
        message: '注意力集中在可控事物上',
        priority: 'low'
      };
    } else {
      return {
        type: 'balanced',
        message: '注意力分布相对平衡',
        priority: 'medium'
      };
    }
  }

  /**
   * 生成斯多葛建议
   */
  _generateAdvice(result) {
    const advices = [];

    // 如果过度关注不可控
    if (result.focus.type === 'shift_to_controllable') {
      advices.push({
        type: 'control_dichotomy',
        text: this._getControlDichotomyAdvice(result.uncontrollable),
        source: '爱比克泰德《手册》'
      });

      advices.push({
        type: 'reframe',
        text: this._getReframeAdvice(result),
        source: '斯多葛实践'
      });
    }

    // 如果有刚性期望
    const rigidExpectation = result.uncontrollable.find(u => u.type === 'rigid_expectation');
    if (rigidExpectation) {
      advices.push({
        type: 'flexible_expectation',
        text: '你用了"应该"或"必须"这样的词。斯多葛主义者建议：用偏好代替要求——"我希望这样，但如果不是，我也能接受"',
        source: '斯多葛认知重构'
      });
    }

    // 如果有过去/未来担忧
    const pastFuture = result.uncontrollable.find(u => u.type === 'past_future');
    if (pastFuture) {
      advices.push({
        type: 'present_focus',
        text: '过去已无法改变，未来尚未到来。斯多葛主义者专注于当下——这是唯一真正属于你的时刻。',
        source: '马可·奥勒留《沉思录》'
      });
    }

    return advices;
  }

  /**
   * 获取控制二分法建议
   */
  _getControlDichotomyAdvice(uncontrollables) {
    const templates = [
      '我注意到你在担心一些你无法完全控制的事情。斯多葛哲学的控制二分法建议：区分你能控制的和不能控制的，然后专注于前者，接受后者。',
      '爱比克泰德说："人不是被事物本身困扰，而是被他们对事物的看法困扰。" 让我们看看哪些是你能控制的。',
      '当我们将幸福寄托在不可控的事物上时，焦虑就产生了。真正的自由来自专注于你能够影响的事情。'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 获取重构建议
   */
  _getReframeAdvice(result) {
    const reframes = [];

    // 针对他人看法
    if (result.uncontrollable.some(u => u.type === 'others_behavior')) {
      reframes.push('他人的看法和反应是你无法控制的。你能控制的是：做你认为正确的事，保持你的品格。');
    }

    // 针对外部结果
    if (result.uncontrollable.some(u => u.type === 'external_outcome')) {
      reframes.push('结果往往不完全由你控制。斯多葛主义者建议：专注于过程（可控），而不是结果（部分不可控）。尽力而为，然后接受任何结果。');
    }

    // 针对过去/未来
    if (result.uncontrollable.some(u => u.type === 'past_future')) {
      reframes.push('过去无法改变，未来无法预测。你能把握的只有当下。问自己：此刻，我能做什么有意义的事？');
    }

    return reframes.join(' ');
  }

  /**
   * 生成控制清单（实践工具）
   */
  generateControlList(userInput) {
    return {
      title: '控制二分法练习',
      instruction: '将你的担忧分类，然后专注于左侧',
      controllable: [
        '我的态度和回应',
        '我的努力和行动',
        '我的价值观和原则',
        '我当下的选择'
      ],
      uncontrollable: [
        '他人的想法和行为',
        '过去的决定',
        '未来的不确定性',
        '外部环境和结果'
      ],
      actionPrompt: '基于以上分析，此刻你能控制的一个小行动是什么？'
    };
  }

  /**
   * 获取斯多葛语录
   */
  getStoicQuote() {
    const quotes = [
      {
        text: '人不是被事物本身困扰，而是被他们对事物的看法困扰。',
        author: '爱比克泰德',
        source: '《手册》'
      },
      {
        text: '我们有两次生命，第二次生命在我们意识到生命只有一次时开始。',
        author: '塞涅卡',
        source: '《道德书简》'
      },
      {
        text: '不要要求事情如你所愿，而要愿望事情如它们所是，这样你就会幸福。',
        author: '爱比克泰德',
        source: '《手册》'
      },
      {
        text: '我们不应该在每年都说"我活了多少年"，而应该说"我有多少年是真正活过的"。',
        author: '塞涅卡',
        source: '《论生命短暂》'
      },
      {
        text: '你拥有权力掌控你的心灵——而不是外在事件。意识到这一点，你将找到力量。',
        author: '马可·奥勒留',
        source: '《沉思录》'
      }
    ];

    return quotes[Math.floor(Math.random() * quotes.length)];
  }
}

module.exports = {
  ControlCategories,
  ControllableItems,
  UncontrollableItems,
  StoicControlAnalyzer
};
