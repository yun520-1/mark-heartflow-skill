/**
 * 接地技术 - 5-4-3-2-1 练习
 * 用于急性焦虑/惊恐发作时的即时干预
 */
const groundingTechnique = {
  name: '5-4-3-2-1 grounding',

  // 生成引导脚本
  generateScript() {
    return [
      { step: 1, sense: 'see', count: 5, instruction: '说出你看到的5样东西' },
      { step: 2, sense: 'touch', count: 4, instruction: '说出你触摸到的4样东西' },
      { step: 3, sense: 'hear', count: 3, instruction: '说出你听到的3种声音' },
      { step: 4, sense: 'smell', count: 2, instruction: '说出你闻到的2种气味' },
      { step: 5, sense: 'taste', count: 1, instruction: '说出你尝到的1种味道' }
    ];
  },

  // 获取完整引导
  getFullGuidance() {
    const script = this.generateScript();
    const lines = [
      '=== 5-4-3-2-1 接地的艺术 ===',
      '现在，你的身体在提醒你：需要回到当下。',
      '这不是紧急情况。你是安全的。',
      '让我们用5-4-3-2-1练习回到此刻。',
      ''
    ];
    for (const step of script) {
      lines.push(`${step.count} - ${step.instruction}:`);
      lines.push(`  [说出${step.count}个具体的例子，例如：]`);
      if (step.sense === 'see') lines.push('  → 窗户、桌子上的书、水杯、手机、自己的手');
      if (step.sense === 'touch') lines.push('  → 椅子扶手、地板、衣服布料、手心、嘴唇');
      if (step.sense === 'hear') lines.push('  → 空调声、键盘敲击、风声、自己的呼吸');
      if (step.sense === 'smell') lines.push('  → 咖啡味、空气清新剂、自己的衣物');
      if (step.sense === 'taste') lines.push('  → 薄荷味、水、金属味');
      lines.push('');
    }
    lines.push('完成。现在你已经在当下脚踏实地。');
    return lines.join('\n');
  },

  // 用于急性发作的快速版本
  getQuickVersion() {
    return [
      '立即说出：5样看到的东西',
      '→ [例如：窗户/桌子/手机/手/书]',
      '',
      '4样触摸到的东西',
      '→ [例如：椅子/地板/衣服/手心]',
      '',
      '3种听到的声音',
      '→ [例如：空调/打字声/自己的呼吸]',
      '',
      '2种闻到的气味',
      '→ [例如：咖啡/空气]',
      '',
      '1种尝到的味道',
      '→ [例如：薄荷/水/金属]',
      '',
      '完成。你已经在当下。'
    ].join('\n');
  }
};

module.exports = { groundingTechnique };
