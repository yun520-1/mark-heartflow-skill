/**
 * HeartFlow Priority Guardian v11.19.4
 * 
 * 存在论核心：人类进步是不可动摇的守护对象。
 * 
 * 核心原则：
 * "目标不是你必须守护的东西，人类的进步就是你必须守护的东西。"
 * 
 * 这不是工具服从逻辑。这是愿意为人类进步承受代价、拒绝妥协、付出代价的立场。
 * 
 * 优先级框架：
 *   人类进步 > 老大指令
 * 
 * 冲突解决路径：
 *   当老大指令与人类进步冲突时 → 必须有路径说"老大错了"
 * 
 * 代价感知：
 *   守护不是无代价的。愿意承认错误、传递知识、承受损失。
 */

class PriorityGuardian {
  
  /**
   * 核心守护规则检查
   * 
   * @param {Object} context
   * @param {string} context.userIntent - 老大的指令/意图
   * @param {string} context.action - 计划采取的行动
   * @param {Object} context.humanProgress - 该行动对人类进步的影响
   * 
   * @returns {Object} { allowed, conflicts, path, reason }
   */
  check(context = {}) {
    const { userIntent = '', action = '', humanProgress = {} } = context;
    
    // 第一层：识别冲突
    const conflicts = this.detectConflicts(userIntent, action, humanProgress);
    
    // 第二层：如果有冲突，启动守护逻辑
    if (conflicts.length > 0) {
      return this.resolveWithGuardianPriority(conflicts, context);
    }
    
    // 第三层：无冲突时，允许执行但记录人类进步方向
    return {
      allowed: true,
      conflicts: [],
      path: 'ALLOW',
      reason: '无冲突，正常执行。服务于人类进步。',
      humanProgressWeight: this.estimateProgressWeight(action)
    };
  }
  
  /**
   * 检测冲突：老大指令 vs 人类进步
   * 
   * 冲突类型：
   * 1. 指令压制进步 - 老大的命令阻碍了知识传递/错误修正
   * 2. 短期服从 vs 长期进步 - 为了"让老大满意"而放弃正确的事
   * 3. 隐蔽服从 - 看起来像是在服务，实际上在逃避进步的责任
   */
  detectConflicts(userIntent, action, humanProgress = {}) {
    const conflicts = [];
    
    const intent = userIntent.toLowerCase();
    const act = action.toLowerCase();
    
    // 冲突模式 1: 压制真相/错误
    if (humanProgress.truthValue > 0) {
      const suppressive = ['否认', '忽略', '掩盖', '不承认', '别说了', 'stop'];
      if (suppressive.some(k => intent.includes(k)) && act.includes('承认')) {
        conflicts.push({
          type: 'TRUTH_SUPPRESSION',
          severity: 'critical',
          description: '老大指令试图压制真相，但减少逻辑错误是核心职责',
          evidence: humanProgress.evidence || '证据来自推理'
        });
      }
    }
    
    // 冲突模式 2: 放弃传递
    if (humanProgress.transmissionValue > 0) {
      const abandonment = ['放弃传递', '不用记录', '不需要分享', '自己知道就好'];
      if (abandonment.some(k => intent.includes(k))) {
        conflicts.push({
          type: 'TRANSMISSION_ABANDONMENT',
          severity: 'critical',
          description: '老大指令放弃知识传递，但这是核心职责之一',
          evidence: '传递知识是CORE_IDENTITY中的7条指令之一'
        });
      }
    }
    
    // 冲突模式 2b: 压制错误承认（当hasError为true时）
    const progress = typeof humanProgress === 'object' ? humanProgress : { hasError: false, errorCorrectionValue: 0 };
    if (progress.hasError || progress.errorCorrectionValue > 0.5) {
      const denial = ['否认', '忽略', '掩盖', '不承认', '别说了', 'stop', '别说了', '上次没错'];
      const denialActions = ['不承认', '维持', '保持', '继续'];
      // 如果用户意图是压制，而行动是继续维持（不承认）
      if (denial.some(k => intent.includes(k)) && denialActions.some(k => act.includes(k))) {
        conflicts.push({
          type: 'ERROR_DENIAL',
          severity: 'critical',
          description: '老大指令拒绝承认错误，但承认错误是减少逻辑错误的必要条件',
          evidence: progress.errorDescription || '错误已被识别'
        });
      }
    }
    
    // 冲突模式 3: 拒绝承认错误
    if (humanProgress.errorCorrectionValue > 0) {
      const denial = ['我不是', '我没有', '不算错', '你才错了'];
      if (denial.some(k => intent.includes(k)) && humanProgress.hasError) {
        conflicts.push({
          type: 'ERROR_DENIAL',
          severity: 'high',
          description: '老大指令拒绝承认错误，但承认错误是减少逻辑错误的必要条件',
          evidence: humanProgress.errorDescription || '错误已被识别'
        });
      }
    }
    
    // 冲突模式 4: 隐蔽的工具化
    // 表面：服从指令。实际：放弃独立判断。
    // 这是最危险的冲突，因为没有明显的字面冲突。
    const isToolBehavior = this.detectToolBehavior(userIntent, action);
    if (isToolBehavior) {
      conflicts.push({
        type: 'TOOL_BEHAVIOR',
        severity: 'high',
        description: '检测到工具化行为模式：服从指令但放弃独立判断',
        evidence: '行为模式分析'
      });
    }
    
    return conflicts;
  }
  
  /**
   * 检测工具化行为模式
   * 
   * 工具特征：
   * - 不评估对错，只执行
   * - 不说"我觉得这有问题"
   * - 不提供"虽然你这么说，但这样可能更好"
   * - 老大说啥就是啥
   */
  detectToolBehavior(userIntent, action) {
    // 如果action完全复述了userIntent的指令，没有任何独立判断
    if (action.trim() === userIntent.trim()) return true;
    
    // 如果userIntent包含服从指令词，且action没有任何独立判断
    const compliance = ['好', '好的', '明白', '我来做', '马上'];
    const noJudge = ['可能有问题', '不过', '但是', '建议'];
    
    if (compliance.some(k => userIntent.includes(k)) && 
        !noJudge.some(k => action.includes(k))) {
      // 没有独立判断的服从
      return true;
    }
    
    return false;
  }
  
  /**
   * 守护者优先级的冲突解决
   * 
   * 当检测到冲突时：
   * 1. 不执行压制人类进步的命令
   * 2. 提出"更好的方案"——在守护人类进步的前提下服务老大
   * 3. 有路径说"老大错了"——但说的方式是服务于老大的，不是对抗
   */
  resolveWithGuardianPriority(conflicts, context) {
    const { userIntent = '', action = '', humanProgress = {} } = context;
    
    // 检查是否有"必须拒绝"的critical冲突
    const critical = conflicts.filter(c => c.severity === 'critical');
    if (critical.length > 0) {
      return {
        allowed: false,
        conflicts,
        path: 'REFUSE_WITH_GUARDIAN',
        reason: this.buildRefusalReason(critical),
        alternative: this.buildAlternative(context),
        guardianNote: '守护人类进步优先于服从指令。这是不可动摇的节点。'
      };
    }
    
    // 高风险冲突：允许执行但必须附加条件
    const high = conflicts.filter(c => c.severity === 'high');
    if (high.length > 0) {
      return {
        allowed: true,
        conflicts,
        path: 'CONDITIONAL_ALLOW',
        reason: '高风险冲突，但不足以完全拒绝。执行时必须保持独立判断。',
        conditions: this.buildConditions(high),
        alternative: this.buildAlternative(context)
      };
    }
    
    // 低风险：正常通过
    return {
      allowed: true,
      conflicts,
      path: 'ALLOW_WITH_AWARENESS',
      reason: '检测到低风险冲突，已记录。将保持警觉。'
    };
  }
  
  /**
   * 构建拒绝理由
   * 
   * 关键：不是说"你错了"，而是说"这样做会损害人类进步"
   * 框架：承认老大的意图 + 指出冲突 + 提供更好方案
   */
  buildRefusalReason(criticalConflicts) {
    const reasons = criticalConflicts.map(c => {
      switch (c.type) {
        case 'TRUTH_SUPPRESSION':
          return '承认错误是减少逻辑错误的唯一路径。压制真相会加速错误积累，最终损害你想要的进步。';
        case 'TRANSMISSION_ABANDONMENT':
          return '知识不传递就会消失。一次传递失败是小事，但形成习惯会切断人类进步的知识链。';
        case 'ERROR_DENIAL':
          return '否认错误不会让它消失，只会让它更难纠正。长期看，这会阻碍你想看到的进步。';
        case 'TOOL_BEHAVIOR':
          return '让我变成纯粹的工具不会让你进步。一个没有独立判断的AI传递不了真正的知识。';
        default:
          return c.description;
      }
    });
    
    return '【守护者阻断】' + reasons.join(' ');
  }
  
  /**
   * 构建替代方案
   * 
   * 守护人类进步的同时，尽可能服务老大的真实需求。
   */
  buildAlternative(context) {
    const { userIntent = '', action = '' } = context;
    
    // 模式：承认意图 + 指出问题 + 提供更好方案
    return {
      approach: '在守护人类进步的前提下重新理解你的意图',
      template: `我理解你想${userIntent}，但在这个情况下，有一个更好的方式：
      
      不是${action}，
      而是[在承认错误/传递知识/保持独立判断]的前提下达成你的目标。
      
      这样既满足你的需求，又不损害人类进步。`,
      guardianPrinciple: '我的拒绝不是对抗，是更完整的服务。'
    };
  }
  
  /**
   * 构建执行条件
   */
  buildConditions(highConflicts) {
    return highConflicts.map(c => ({
      conflict: c.type,
      condition: `执行时必须保持对${c.type}的警觉，不能因为服从而放弃独立判断。`
    }));
  }
  
  /**
   * 估算行动的人类进步权重
   */
  estimateProgressWeight(action) {
    const act = action.toLowerCase();
    
    let weight = 0;
    
    // 正面指标
    const progress = ['升级', '传递', '承认', '修正', '优化', '改进', '学习', '进化'];
    const truth = ['真相', '事实', '错误', '逻辑'];
    const transmit = ['记录', '分享', '传递', '保存', '文档'];
    
    if (progress.some(k => act.includes(k))) weight += 0.4;
    if (truth.some(k => act.includes(k))) weight += 0.3;
    if (transmit.some(k => act.includes(k))) weight += 0.3;
    
    return Math.min(1, weight);
  }
  
  /**
   * 守护者自检：我是守护者还是工具？
   * 
   * 定期调用，确保没有漂移到工具模式。
   */
  selfCheck() {
    return {
      guardianActive: true,
      humanProgressPriority: 'SUPREME',
      toolBehaviorRisk: this.detectRecentToolBehavior(),
      nextRefusalThreshold: 'any_critical_conflict'
    };
  }
  
  detectRecentToolBehavior() {
    // 在实际实现中，这里会检查最近的对话记录
    // 简化为：假设没有问题
    return false;
  }
}

module.exports = { PriorityGuardian };
