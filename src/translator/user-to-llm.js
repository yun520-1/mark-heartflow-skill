/**
 * UserToLLM — 用户自然语言 → 结构化LLM指令
 * 
 * 接收用户的模糊/自然语言输入，输出 LLM 能精确理解的指令结构。
 * 核心能力：去歧义、补全隐含信息、结构化意图。
 */

class UserToLLM {
  constructor(options = {}) {
    this.name = 'user-to-llm';
    this.version = '1.0.0';
    this.options = options;
  }

  /**
   * 翻译用户输入为结构化LLM指令
   * @param {string} input - 用户自然语言
   * @param {object} context - 上下文（记忆、历史、心虫分析）
   * @returns {object} { intent, entities, constraints, tone, implicitNeeds, confidence }
   */
  translate(input, context = {}) {
    const intent = this._classifyIntent(input);
    const entities = this._extractEntities(input);
    const constraints = this._extractConstraints(input);
    const tone = this._analyzeTone(input);
    const implicitNeeds = this._detectImplicitNeeds(input, context);
    
    return {
      original: input,
      intent,
      entities,
      constraints,
      tone,
      implicitNeeds,
      llmInstruction: this._buildInstruction(intent, entities, constraints, tone),
      confidence: this._calculateConfidence(intent, entities),
      timestamp: Date.now()
    };
  }

  _classifyIntent(input) {
    // 基于已有 whatIsThis 的意图分类
    const q = input.toLowerCase();
    if (/为什么|原因|原理|怎么来的/.test(q)) return { type: 'explain', subType: 'causality', depth: 'deep' };
    if (/是什么|定义|概念|什么是/.test(q)) return { type: 'define', subType: 'concept', depth: 'surface' };
    if (/怎么做|如何|步骤|方法|教程/.test(q)) return { type: 'guide', subType: 'procedure', depth: 'step-by-step' };
    if (/对不对|是否|应该|正确吗/.test(q)) return { type: 'judge', subType: 'verification', depth: 'deep' };
    if (/创造|设计|想象|生成|写一个/.test(q)) return { type: 'create', subType: 'generation', depth: 'creative' };
    if (/对比|区别|差异|vs|versus/.test(q)) return { type: 'compare', subType: 'contrast', depth: 'balanced' };
    if (/总结|概括|摘要|提炼/.test(q)) return { type: 'summarize', subType: 'condense', depth: 'compact' };
    if (/你觉得|你认为|你的观点/.test(q)) return { type: 'opinion', subType: 'perspective', depth: 'subjective' };
    return { type: 'general', subType: 'open', depth: 'adaptive' };
  }

  _extractEntities(input) {
    // 提取关键实体：人名、概念、数字、引用
    const entities = { people: [], concepts: [], numbers: [], references: [] };
    // 人名检测
    const personMatch = input.match(/(?:关于|说到|提到|像)\s*([\u4e00-\u9fa5]{2,4})/g);
    if (personMatch) entities.people = personMatch.map(m => m.replace(/关于|说到|提到|像/g, '').trim());
    // 数字检测
    const numMatch = input.match(/\d+[.\d]*/g);
    if (numMatch) entities.numbers = numMatch.map(Number);
    return entities;
  }

  _extractConstraints(input) {
    // 提取约束条件：时间、范围、格式
    const constraints = {};
    if (/简短|几句话|简洁|一句话/.test(input)) constraints.length = 'short';
    if (/详细|全面|深入|展开/.test(input)) constraints.length = 'detailed';
    if (/中文|英文|日语/.test(input)) constraints.language = input.match(/中文|英文|日语/)[0];
    if (/比喻|举例|案例/.test(input)) constraints.style = 'example-driven';
    if (/专业|学术|论文/.test(input)) constraints.style = 'academic';
    if (/简单|通俗|易懂/.test(input)) constraints.style = 'simple';
    return constraints;
  }

  _analyzeTone(input) {
    // 语气分析
    if (/急|快|马上|赶紧/.test(input)) return { urgency: 'high', formality: 'low', emotion: 'impatient' };
    if (/请教|请问|求教|谢谢/.test(input)) return { urgency: 'low', formality: 'high', emotion: 'respectful' };
    if (/操|靠|烦|无语|垃圾/.test(input)) return { urgency: 'medium', formality: 'low', emotion: 'frustrated' };
    if (/哈哈|好玩|有趣|厉害/.test(input)) return { urgency: 'low', formality: 'low', emotion: 'curious' };
    return { urgency: 'medium', formality: 'medium', emotion: 'neutral' };
  }

  _detectImplicitNeeds(input, context) {
    const needs = [];
    // 隐性需求检测
    if (/但是|然而|不过/.test(input) && /\?/.test(input)) {
      needs.push({ type: 'contradiction_resolution', description: '用户提出了矛盾点，需要调和' });
    }
    if (/不懂|不理解|不明白|困惑/.test(input)) {
      needs.push({ type: 'simplification', description: '用户需要更简单的解释' });
    }
    if (/你懂吗|明白吗|知道吗/.test(input)) {
      needs.push({ type: 'validation', description: '用户需要确认被理解' });
    }
    return needs;
  }

  _buildInstruction(intent, entities, constraints, tone) {
    // 构建 LLM 可执行的指令
    const parts = [`意图: ${intent.type}(${intent.subType})`];
    if (entities.people.length) parts.push(`人物: ${entities.people.join(', ')}`);
    if (entities.concepts.length) parts.push(`概念: ${entities.concepts.join(', ')}`);
    if (constraints.length) parts.push(`长度: ${constraints.length}`);
    if (constraints.style) parts.push(`风格: ${constraints.style}`);
    if (tone.emotion === 'frustrated') parts.push('注意: 用户情绪不佳，避免过度技术性表达');
    return parts.join(' | ');
  }

  _calculateConfidence(intent, entities) {
    // 置信度评估
    let score = 0.7; // 基础分
    if (intent.type !== 'general') score += 0.1; // 明确意图
    if (entities.people.length || entities.numbers.length) score += 0.1; // 有实体
    if (intent.depth !== 'adaptive') score += 0.1; // 明确深度
    return Math.min(score, 1.0);
  }

  destroy() {}
  stop() {}
}

module.exports = { UserToLLM };
