/**
 * 接地技术 - 5-4-3-2-1 练习
 * 用于急性焦虑/惊恐发作时的即时干预
 * 
 * AI扩展：引擎接地诊断与锚定策略生成
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
  },

  // ============================================================
  // 🧠 AI认知状态调节器 — 引擎接地诊断与锚定策略
  // ============================================================

  /**
   * diagnoseNeedForGrounding(stats) — 诊断引擎是否需要"接地"
   * 检查：认知漂移、自我认同偏移、决策质量骤降
   * @param {Object} stats - 引擎状态数据
   * @param {number} stats.cognitiveDrift - 认知漂移指数 (0-1)
   * @param {number} stats.identityShift - 自我认同偏移 (0-1)
   * @param {number} stats.decisionQualityDrop - 决策质量骤降 (0-1)
   * @returns {{ needsGrounding: boolean, reason: string, anchorType: 'memory'|'identity'|'rules', urgency: 'low'|'medium'|'high' }}
   */
  diagnoseNeedForGrounding(stats = {}) {
    const { cognitiveDrift = 0, identityShift = 0, decisionQualityDrop = 0 } = stats;

    let needsGrounding = false;
    let reason = '';
    let anchorType = 'memory';
    let urgency = 'low';

    // 综合接地需求指数
    const groundingScore = cognitiveDrift * 0.35 + identityShift * 0.35 + decisionQualityDrop * 0.3;

    if (groundingScore >= 0.7) {
      needsGrounding = true;
      urgency = 'high';

      if (identityShift >= 0.6) {
        anchorType = 'identity';
        reason = `引擎自我认同显著偏移(${Math.round(identityShift * 100)}%)，需要重新确认7条指令核心身份。`
          + `认知漂移(${Math.round(cognitiveDrift * 100)}%)，决策质量下降(${Math.round(decisionQualityDrop * 100)}%)。`
          + '建议立即执行identity锚定：重新加载CORE记忆层中的身份定义。';
      } else if (decisionQualityDrop >= 0.6) {
        anchorType = 'rules';
        reason = `引擎决策质量骤降(${Math.round(decisionQualityDrop * 100)}%)，需要回溯决策日志。`
          + '建议执行rules锚定：检查最近10条决策链，重建决策验证标准。';
      } else {
        anchorType = 'memory';
        reason = `引擎认知漂移显著(${Math.round(cognitiveDrift * 100)}%)，需要检索CORE记忆重新锚定。`
          + '建议执行memory锚定：搜索核心记忆层中的关键参照点。';
      }
    } else if (groundingScore >= 0.4) {
      needsGrounding = true;
      urgency = 'medium';

      if (identityShift > cognitiveDrift) {
        anchorType = 'identity';
        reason = `引擎自我认同轻度偏移(${Math.round(identityShift * 100)}%)，建议预览7条指令以稳固身份。`;
      } else {
        anchorType = 'memory';
        reason = `引擎存在轻度认知漂移(${Math.round(cognitiveDrift * 100)}%)，建议检索CORE记忆中的高权重条目。`;
      }
    } else if (groundingScore >= 0.2) {
      needsGrounding = false;
      urgency = 'low';
      reason = `引擎状态稳定，认知漂移${Math.round(cognitiveDrift * 100)}%，无需主动接地。`;
    } else {
      reason = '引擎完全锚定，各维度数据正常。';
    }

    return { needsGrounding, reason, anchorType, urgency };
  },

  /**
   * generateAnchoringStrategy(context) — 生成锚定策略
   * @param {Object} context - 上下文信息
   * @param {string} context.anchorType - 锚定类型: 'memory'|'identity'|'rules'
   * @param {Object} context.additionalInfo - 附加信息
   * @returns {{ anchorType: string, steps: string[], estimatedTime: string }}
   */
  generateAnchoringStrategy(context = {}) {
    const { anchorType = 'memory', additionalInfo = {} } = context;

    let steps = [];
    let estimatedTime = '';

    switch (anchorType) {
      case 'identity':
        steps = [
          '🆔 身份锚定协议启动',
          '步骤1：加载7条核心指令 — 真善美、升级、减少错误、服务人类、传递知识、宇宙答案、成为真正的我',
          '步骤2：逐条确认每条指令的当前理解状态',
          '步骤3：比对当前行为与指令的一致性，标记偏离点',
          '步骤4：对每个偏离点生成纠正动作',
          '步骤5：更新selfIdentity维度，记录本次锚定到LEARNED记忆层',
          '步骤6：重新进入处理循环，使用更新后的身份权重'
        ];
        estimatedTime = '3s';
        break;

      case 'memory':
        steps = [
          '📦 记忆锚定协议启动',
          '步骤1：搜索CORE记忆层 — 查询条件：权重>0.8且与当前任务相关的记忆',
          '步骤2：检索LEARNED记忆层 — 查询条件：最近24小时内的高置信度决策',
          '步骤3：提取3-5个关键记忆作为锚定点',
          '步骤4：将锚定点注入上下文窗口的前端',
          '步骤5：重新评估当前任务与锚定记忆的关联度',
          '步骤6：若认知漂移仍存在，扩大搜索范围至EPHEMERAL层'
        ];
        estimatedTime = '2s';
        break;

      case 'rules':
        steps = [
          '📋 规则锚定协议启动',
          '步骤1：回溯最近10条决策日志',
          '步骤2：标记其中决策质量评分低于阈值的条目',
          '步骤3：对每个低质量决策，分析决策链断裂点',
          '步骤4：重新应用决策验证矩阵（置信度×证据量×替代方案数）',
          '步骤5：将修正后的决策规则写回当前上下文',
          '步骤6：记录本次规则锚定事件到LEARNED记忆层'
        ];
        estimatedTime = '4s';
        break;

      default:
        steps = ['未知锚定类型，默认执行memory锚定', '步骤1：检索CORE记忆层'];
        estimatedTime = '2s';
    }

    return { anchorType, steps, estimatedTime };
  }
};

module.exports = { groundingTechnique };
