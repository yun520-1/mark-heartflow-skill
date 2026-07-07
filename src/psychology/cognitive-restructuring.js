/**
 * 认知重塑 - CBT技术的可执行版本
 */
const cognitiveRestructuring = {
  // 处理负面思维
  async processNegativeThought(negativeThought) {
    return {
      steps: [
        {
          step: 1,
          name: '识别自动思维',
          instruction: '捕捉脑海中闪现的念头',
          question: `负面思维是："${negativeThought}"`,
          space: '把这句话写下来，确认它的存在'
        },
        {
          step: 2,
          name: '证据法检验',
          instruction: '问自己：这个思维有哪些支持证据？有哪些反对证据？',
          supportPrompt: '支持这个想法的证据：\n1. \n2. \n3. ',
          againstPrompt: '反对这个想法的证据：\n1. \n2. \n3. '
        },
        {
          step: 3,
          name: '替代思维',
          instruction: '基于正反证据，生成一个更平衡的思维',
          prompt: '一个更平衡的思维可以是：'
        },
        {
          step: 4,
          name: '评估新思维',
          instruction: '新思维的可信度有多少？',
          scale: '0%（完全不信）—— 50%（半信半疑）—— 100%（完全相信）'
        }
      ],
      format: 'structured'
    };
  },

  // 生成认知重塑对话脚本
  generateScript(negativeThought) {
    const lines = [
      '=== 认知重塑练习 ===',
      '',
      `你的负面思维："${negativeThought}"`,
      '',
      '第一步：识别',
      '把这个念头用一句话写下来。',
      '写下来本身就是对它say no的第一步。',
      '',
      '第二步：证据检验',
      '问自己两个问题：',
      '  ① 支持这个想法的证据是什么？',
      '  ② 反对这个想法的证据是什么？',
      '',
      '第三步：生成替代思维',
      '如果你的朋友有同样的想法，你会对他说什么？',
      '',
      '第四步：评估',
      '新的思维，你相信它的程度是多少？',
      '(0% = 完全不信，50% = 半信半疑，100% = 完全相信)'
    ];
    return lines.join('\n');
  }
};

module.exports = { cognitiveRestructuring };
