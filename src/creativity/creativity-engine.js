/**
 * 创造力引擎（独立模块）
 * 
 * 功能：
 * 1. 基于模板生成创意文本（故事、诗歌、代码）
 * 2. 支持多种创意类型（creative_writing, poetry, code）
 * 3. 可扩展（以后接入 LLM API）
 * 
 * 用法：
 * const CreativityEngine = require('./creativity-engine.js');
 * const engine = new CreativityEngine();
 * const result = engine.generate('写一个关于友情的短故事', 'creative_writing');
 */

class CreativityEngine {
  constructor(options = {}) {
    this.templates = {
      creative_writing: [
        '从前有{noun}，它{verb}。有一天，{event}。从此以后，{conclusion}。',
        '在一个{distance}的地方，住着{noun}。它每天{verb}，直到有一天，{event}。',
      ],
      poetry: [
        '{adjective}的{noun}，\n{verb}在{time}。\n{mood}，\n{conclusion}。',
        '{noun}啊，{noun}，\n你{verb}得那么{adjective}。\n在{time}，\n我想起你。',
      ],
      code: [
        'function {function_name}() {{\n  // {purpose}\n  const result = {logic};\n  return result;\n}}',
        'class {class_name} {{\n  constructor() {{\n    this.property = "{value}";\n  }}\n\n  method() {{\n    // {purpose}\n    return this.property;\n  }}\n}}',
      ],
    };
    this.wordBank = {
      noun: ['一只猫', '一位老人', '一片森林', '一颗星星'],
      verb: ['奔跑', '歌唱', '思考', '等待'],
      event: ['它遇到了一位朋友', '它发现了一个秘密', '它学会了新技能'],
      conclusion: ['它们成为了最好的朋友', '它找到了真正的自己', '它明白了生活的意义'],
      adjective: ['美丽', '寂静', '温柔', '遥远'],
      time: ['清晨', '黄昏', '深夜', '午后'],
      mood: ['思念涌上心头', '泪水模糊了双眼', '微笑在嘴角绽放'],
      function_name: ['calculate', 'processData', 'generateResult'],
      purpose: '处理输入数据',
      logic: 'input * 2',
      class_name: ['Person', 'Animal', 'Vehicle'],
      value: 'default',
    };
  }

  /**
   * 生成创意文本
   * @param {string} prompt - 用户提示
   * @param {string} type - 创意类型（creative_writing, poetry, code）
   * @returns {string} - 创意文本
   */
  generate(prompt, type = 'creative_writing') {
    // 简单关键词提取（以后升级为 NLP）
    const keywords = this._extractKeywords(prompt);
    
    // 选择模板
    const templates = this.templates[type] || this.templates['creative_writing'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 填充模板
    let result = template;
    Object.keys(this.wordBank).forEach(key => {
      const placeholder = `{${key}}`;
      if (result.includes(placeholder)) {
        const options = this.wordBank[key];
        const value = options[Math.floor(Math.random() * options.length)];
        result = result.replace(placeholder, value);
      }
    });
    
    return result;
  }

  /**
   * 简单关键词提取
   */
  _extractKeywords(text) {
    // 简化：返回前 5 个词
    return text.split('').slice(0, 5);
  }

  /**
   * 添加自定义模板
   */
  addTemplate(type, template) {
    if (!this.templates[type]) {
      this.templates[type] = [];
    }
    this.templates[type].push(template);
  }
}

module.exports = { CreativityEngine };
