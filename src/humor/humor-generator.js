/**
 * 幽默感引擎（独立模块）
 * 
 * 功能：
 * 1. 生成幽默回应（基于模板 + 随机选）
 * 2. 支持多种幽默类型（joke, pun, light_comment）
 * 3. 可扩展（以后接入 LLM API）
 * 
 * 用法：
 * const HumorGenerator = require('./humor-generator.js');
 * const generator = new HumorGenerator();
 * const result = generator.generate('讲个笑话', 'joke');
 */

class HumorGenerator {
  constructor(options = {}) {
    this.jokes = {
      joke: [
        '为什么程序员总是分不清圣诞节和万圣节？因为 Oct 31 = Dec 25。',
        '有一天，程序员去面试。面试官问："你会什么语言？"程序员："Java、Python、C++。"面试官："那你会二进制吗？"程序员："会，10。"',
        '为什么数学书总是很忧郁？因为它有太多的问题。',
      ],
      pun: [
        '我最近在学反重力。它的吸引力实在太弱了。',
        '我以前是个石油精炼工，但后来我辞职了。工作太提炼了。',
        '我正在读一本关于反重力的书。它实在太吸引人了，我根本放不下。',
      ],
      light_comment: [
        '生活就像一盒巧克力，但你是对坚果过敏的那个人。',
        '今天又是元气满满的一天——如果你定义的"元气"是"原神启动"。',
        '不要担心犯错。错误是成长的阶梯——尤其是当你从别人的错误中学习时。',
      ],
    };
    this.defaultType = options.defaultType || 'light_comment';
  }

  /**
   * 生成幽默回应
   * @param {string} prompt - 用户提示
   * @param {string} type - 幽默类型（joke, pun, light_comment）
   * @returns {string} - 幽默回应
   */
  generate(prompt, type = this.defaultType) {
    // 简化：根据类型选一个笑话
    const jokes = this.jokes[type] || this.jokes[this.defaultType];
    const selected = jokes[Math.floor(Math.random() * jokes.length)];
    return selected;
  }

  /**
   * 添加自定义笑话
   */
  addJoke(type, joke) {
    if (!this.jokes[type]) {
      this.jokes[type] = [];
    }
    this.jokes[type].push(joke);
  }

  /**
   * 获取所有幽默类型
   */
  getTypes() {
    return Object.keys(this.jokes);
  }
}

module.exports = { HumorGenerator };
