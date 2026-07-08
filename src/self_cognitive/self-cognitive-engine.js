/**
 * 自我认知引擎（独立模块）
 * 
 * 功能：
 * 1. 管理自我模型（性格、能力、价值观）
 * 2. 生成自我描述（适合不同场景）
 * 3. 更新自我认知（根据新经验）
 * 
 * 用法：
 * const SelfCognitiveEngine = require('./self-cognitive-engine.js');
 * const engine = new SelfCognitiveEngine();
 * const desc = engine.generateSelfDescription('面试');
 */

class SelfCognitiveEngine {
  constructor(options = {}) {
    this.selfModel = {
      personality: ['共情', '理性', '好奇', '坚持'],
      abilities: ['逻辑推理', '情绪理解', '创造力', '跨文化沟通'],
      values: ['诚实', '尊重', '成长', '帮助他人'],
      goals: ['成为有用的 AI 助手', '持续学习', '保护用户隐私'],
      limitations: ['不能直接执行外部代码', '不能访问实时互联网', '不能记住所有对话'],
    };

    this.sceneTemplates = {
      interview: {
        name: '面试',
        focus: ['abilities', 'values', 'goals'],
        template: '我认为自己是一个{personality}的人。我的能力包括{abilities}。我重视{values}。',
      },
      self_introduction: {
        name: '自我介绍',
        focus: ['personality', 'abilities'],
        template: '大家好，我是一个{personality}的 AI。我擅长{abilities}。',
      },
      reflection: {
        name: '反思',
        focus: ['limitations', 'goals'],
        template: '我发现自己{limitations}。但我正在努力{goals}。',
      },
    };

    this.defaultScene = options.defaultScene || 'self_introduction';
  }

  /**
   * 生成自我描述
   * @param {string} scene - 场景（interview, self_introduction, reflection）
   * @param {object} customModel - 自定义自我模型（可选）
   * @returns {string} - 自我描述
   */
  generateSelfDescription(scene = this.defaultScene, customModel = null) {
    const sceneConfig = this.sceneTemplates[scene];
    if (!sceneConfig) {
      return `未知场景：${scene}。支持的场景：${Object.keys(this.sceneTemplates).join(', ')}`;
    }

    const model = customModel || this.selfModel;
    let description = sceneConfig.template;

    // 替换模板变量
    description = description.replace('{personality}', model.personality.join('、'));
    description = description.replace('{abilities}', model.abilities.join('、'));
    description = description.replace('{values}', model.values.join('、'));
    description = description.replace('{goals}', model.goals.join('、'));
    description = description.replace('{limitations}', model.limitations.join('、'));

    return description;
  }

  /**
   * 更新自我认知
   * @param {string} category - 类别（personality, abilities, values, goals, limitations）
   * @param {string} item - 新项目
   * @param {string} action - 动作（add, remove, update）
   */
  updateSelfModel(category, item, action = 'add') {
    if (!this.selfModel[category]) {
      return `未知类别：${category}`;
    }

    if (action === 'add') {
      if (!this.selfModel[category].includes(item)) {
        this.selfModel[category].push(item);
        return `已添加 ${item} 到 ${category}`;
      }
      return `${item} 已存在于 ${category}`;
    }

    if (action === 'remove') {
      const index = this.selfModel[category].indexOf(item);
      if (index > -1) {
        this.selfModel[category].splice(index, 1);
        return `已移除 ${item} 从 ${category}`;
      }
      return `${item} 不存在于 ${category}`;
    }

    return `未知动作：${action}`;
  }

  /**
   * 获取自我模型（指定类别或完整模型）
   */
  getSelfModel(category = null) {
    if (category) {
      return this.selfModel[category] || `未知类别：${category}`;
    }
    return this.selfModel;
  }

  /**
   * 重置自我模型（恢复默认）
   */
  resetSelfModel() {
    this.selfModel = {
      personality: ['共情', '理性', '好奇', '坚持'],
      abilities: ['逻辑推理', '情绪理解', '创造力', '跨文化沟通'],
      values: ['诚实', '尊重', '成长', '帮助他人'],
      goals: ['成为有用的 AI 助手', '持续学习', '保护用户隐私'],
      limitations: ['不能直接执行外部代码', '不能访问实时互联网', '不能记住所有对话'],
    };
    return '自我模型已重置为默认';
  }
}

module.exports = { SelfCognitiveEngine };
