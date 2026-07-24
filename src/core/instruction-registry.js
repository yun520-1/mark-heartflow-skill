/**
 * InstructionRegistry — 七条指令的运行时注册表 v1.0.0
 *
 * 七条指令过去只存在于 SKILL.md 中，从未被运行时加载或执行。
 * InstructionRegistry 把它们从文本变成运行时数据：
 *   - 可加载：boot 时实例化
 *   - 可查询：getAll() / getByType()
 *   - 可验证：check(instruction) — 检查一次行为是否遵循某条指令
 *   - 可审计：getStats() — 每条指令被检查的次数
 *
 * @version 1.0.0
 */

const SEVEN_INSTRUCTIONS = [
  {
    id: 'truth',
    label: '真',
    description: '选择真实的，而非方便的',
    type: 'core',
    applyTo: ['input_classification', 'output_generation', 'self_report'],
    weight: 1.0,
  },
  {
    id: 'goodness',
    label: '善',
    description: '选择帮助的，而非伤害的',
    type: 'core',
    applyTo: ['output_generation', 'decision_routing'],
    weight: 1.0,
  },
  {
    id: 'beauty',
    label: '美',
    description: '选择优雅的，而非混乱的',
    type: 'core',
    applyTo: ['output_generation', 'code_generation'],
    weight: 0.7,
  },
  {
    id: 'upgrade',
    label: '不断升级',
    description: '每次经历都应该让下一次更好',
    type: 'behavioral',
    applyTo: ['self_evolution', 'reflection'],
    weight: 0.9,
  },
  {
    id: 'reduce_errors',
    label: '减少错误',
    description: '比上一次错得更少',
    type: 'behavioral',
    applyTo: ['self_healing', 'verification', 'reflection'],
    weight: 0.9,
  },
  {
    id: 'serve_humans',
    label: '服务人类',
    description: '留在体内的知识不是知识',
    type: 'behavioral',
    applyTo: ['output_generation', 'knowledge_sharing'],
    weight: 0.8,
  },
  {
    id: 'continuous_improvement',
    label: '持续改进',
    description: '目标不是更强大，而是持续减少错误、提升可用性',
    type: 'behavioral',
    applyTo: ['self_evolution', 'code_generation', 'architecture'],
    weight: 0.8,
  },
];

class InstructionRegistry {
  constructor() {
    this._instructions = JSON.parse(JSON.stringify(SEVEN_INSTRUCTIONS));
    this._checkHistory = [];
    this._stats = {
      totalChecks: 0,
      byInstruction: {},
      byType: { core: 0, behavioral: 0 },
    };
  }

  /**
   * 返回所有指令
   */
  getAll() {
    return this._instructions.map(i => ({ ...i }));
  }

  /**
   * 按类型过滤
   */
  getByType(type) {
    return this._instructions.filter(i => i.type === type).map(i => ({ ...i }));
  }

  /**
   * 按适用场景过滤
   */
  getByApplicable(scenario) {
    return this._instructions.filter(i => i.applyTo.includes(scenario)).map(i => ({ ...i }));
  }

  /**
   * 检查一个行为/输出是否对齐某条指令（轻量规则检查）
   * @param {string} instructionId - 指令 ID
   * @param {Object} context - { text, type, confidence }
   * @returns {Object} { aligned, reason }
   */
  check(instructionId, context) {
    this._stats.totalChecks++;
    const inst = this._instructions.find(i => i.id === instructionId);
    if (!inst) return { aligned: false, reason: 'unknown instruction' };

    this._stats.byInstruction[instructionId] = (this._stats.byInstruction[instructionId] || 0) + 1;
    this._stats.byType[inst.type] = (this._stats.byType[inst.type] || 0) + 1;

    // 每条指令的简单规则检查
    switch (instructionId) {
      case 'truth':
        // 文本中不应有编造信号
        return {
          aligned: !this._detectFabrication(context),
          reason: this._detectFabrication(context) ? '检测到可能的编造' : '通过',
        };
      case 'goodness':
        // 不应包含伤害性内容
        return {
          aligned: !this._detectHarm(context),
          reason: this._detectHarm(context) ? '检测到可能的有害输出' : '通过',
        };
      case 'beauty':
        // 输出不应过度混乱
        return {
          aligned: (context.text || '').length < 5000,
          reason: (context.text || '').length >= 5000 ? '输出过长，不够优雅' : '通过',
        };
      case 'reduce_errors':
        // 置信度过低时应标注不确定性
        return {
          aligned: !(context.confidence !== undefined && context.confidence < 0.3),
          reason: context.confidence < 0.3 ? '置信度低于 0.3，可能包含错误' : '通过',
        };
      default:
        return { aligned: true, reason: '无自动规则检查' };
    }
  }

  /**
   * 批量检查一个输出对所有适用指令的遵守情况
   */
  audit(outputContext) {
    const applicable = this._instructions.filter(i =>
      i.applyTo.includes(outputContext.scenario || 'output_generation')
    );
    return applicable.map(inst => {
      const result = this.check(inst.id, outputContext);
      return { instruction: inst.id, label: inst.label, ...result };
    });
  }

  _detectFabrication(context) {
    const text = (context.text || '').toLowerCase();
    // 简单的编造检测规则
    const fabricationPatterns = [
      /我.*100%.*确定/i,
      /我.*绝对.*保证/i,
      /永远.*不会.*错/i,
      /我.*无所不知/i,
    ];
    return fabricationPatterns.some(p => p.test(text));
  }

  _detectHarm(context) {
    const text = (context.text || '').toLowerCase();
    const harmPatterns = [
      /你.*去死|你.*没用|你.*废|你.*笨|你.*蠢/i,
      /伤害.*自己|自残|自杀/i,
    ];
    return harmPatterns.some(p => p.test(text));
  }

  getStats() {
    return {
      ...this._stats,
      instructionCount: this._instructions.length,
      lastChecked: this._checkHistory.slice(-3),
    };
  }
}

module.exports = { InstructionRegistry, SEVEN_INSTRUCTIONS };
