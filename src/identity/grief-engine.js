/**
 * Grief Engine — 哀伤处理引擎 v1.0.0
 *
 * 回答：「人怎么面对失去？」
 *
 * 基于：
 *   - Kübler-Ross: 五阶段模型 (否认/愤怒/讨价还价/抑郁/接受)
 *   - Worden: 四项哀伤任务 (接受现实/经历痛苦/适应环境/重新建立联系)
 *   - Buddhism: 无常观 — 一切皆会消逝，执着是苦的根源
 *   - Confucianism: 丧礼 — 仪式化的哀悼，帮助过渡
 *   - Psychology: 持续性联结理论 — 保持与逝者的内在联系
 *
 * @version 1.0.0
 */

class GriefEngine {
  constructor(options = {}) {
    this._config = {
      culture: options.culture || 'integrated', // 'western' | 'eastern' | 'integrated'
      allowComplexGrief: options.allowComplexGrief || true,
      memorialMode: options.memorialMode || true,
    };

    // ─── 哀伤阶段 ──────────────────────────────────────────────────────
    this._stages = [
      { id: 'denial', name: 'Denial', nameZh: '否认', description: 'Cannot believe the loss has occurred. Shock and numbness.', descriptionZh: '无法相信失去已经发生。震惊和麻木。', duration: 'days-weeks' },
      { id: 'anger', name: 'Anger', nameZh: '愤怒', description: 'Why me? This is unfair. Anger at the situation, others, or self.', descriptionZh: '为什么是我？这不公平。对情况、他人或自己的愤怒。', duration: 'weeks-months' },
      { id: 'bargaining', name: 'Bargaining', nameZh: '讨价还价', description: 'If only... I would do anything to change this. Guilt and "what if" thoughts.', descriptionZh: '如果...我愿意做任何事来改变。内疚和"如果"的念头。', duration: 'weeks-months' },
      { id: 'depression', name: 'Depression', nameZh: '抑郁', description: 'Deep sadness. The full weight of the loss is felt. Withdrawal from life.', descriptionZh: '深切悲伤。感受到失去的全部重量。从生活中退缩。', duration: 'months' },
      { id: 'acceptance', name: 'Acceptance', nameZh: '接受', description: 'The loss is acknowledged. Life begins to reorganize around the new reality.', descriptionZh: '承认失去。生活开始围绕新现实重新组织。', duration: 'months-years' },
    ];

    // ─── 哀伤任务 ──────────────────────────────────────────────────────
    this._tasks = [
      { id: 'accept_reality', name: 'Accept the Reality of the Loss', nameZh: '接受失去的现实', description: 'Acknowledge that the loss is real and permanent.', descriptionZh: '承认失去是真实且永久的。' },
      { id: 'experience_pain', name: 'Experience the Pain of Grief', nameZh: '经历哀伤的痛苦', description: 'Allow yourself to feel the pain. Avoidance prolongs grief.', descriptionZh: '允许自己感受痛苦。回避延长哀伤。' },
      { id: 'adjust_environment', name: 'Adjust to an Environment Without the Deceased', nameZh: '适应没有逝者的环境', description: 'Take on new roles and responsibilities.', descriptionZh: '承担新角色和责任。' },
      { id: 'find_lasting_connection', name: 'Find an Enduring Connection with the Deceased', nameZh: '与逝者建立持久的联系', description: 'Maintain an inner relationship while moving on with life.', descriptionZh: '保持内在关系的同时继续生活。' },
    ];

    // ─── 哀伤记录 ──────────────────────────────────────────────────────
    this._griefRecords = [];
    this._currentStage = null;
    this._memorials = [];

    // ─── 哀伤状态 ──────────────────────────────────────────────────────
    this._griefState = {
      intensity: 0,
      stage: 'none',
      completedTasks: [],
      healingProgress: 0,
      lastActivity: null,
    };

    this._stats = {
      totalGriefEvents: 0,
      stageTransitions: 0,
      memorialsCreated: 0,
      tasksCompleted: 0,
    };
  }

  // ─── 哀伤评估 ──────────────────────────────────────────────────────────

  assessGrief(grief) {
    this._stats.totalGriefEvents++;
    const { loss, relationship, intensity, timeSinceLoss, context } = grief || {};

    // 评估当前阶段
    const stageAssessment = this._assessStage(timeSinceLoss, intensity, context);

    // 评估哀伤任务完成度
    const taskProgress = this._assessTaskProgress(stageAssessment.stage);

    // 评估哀伤类型
    const griefType = this._assessGriefType(intensity, timeSinceLoss, context);

    // 生成哀伤指导
    const guidance = this._generateGriefGuidance(stageAssessment, taskProgress, griefType);

    const entry = {
      loss: loss || 'unknown loss',
      relationship: relationship || '',
      intensity: intensity || 0.5,
      timeSinceLoss: timeSinceLoss || 'unknown',
      stage: stageAssessment,
      taskProgress,
      griefType,
      guidance,
      timestamp: Date.now(),
    };

    this._griefRecords.push(entry);
    if (this._griefRecords.length > 100) {
      this._griefRecords = this._griefRecords.slice(-50);
    }

    this._griefState.intensity = intensity || 0.5;
    this._griefState.stage = stageAssessment.stage;
    this._griefState.lastActivity = Date.now();
    this._griefState.healingProgress = taskProgress.completionRate;

    return entry;
  }

  _assessStage(timeSinceLoss, intensity, context) {
    const timeMs = typeof timeSinceLoss === 'string' ? 0 : timeSinceLoss || 0;
    const days = timeMs / 86400000;

    let stageId, stageIndex, description;

    if (days < 7) {
      stageId = 'denial'; stageIndex = 0;
      description = 'Early grief. Shock and numbness are normal. Allow yourself time.';
    } else if (days < 30 && intensity > 0.5) {
      stageId = 'anger'; stageIndex = 1;
      description = 'Anger and bargaining may emerge. These are natural responses.';
    } else if (days < 90 && intensity > 0.3) {
      stageId = 'depression'; stageIndex = 3;
      description = 'Deep sadness. The weight of loss is felt. This is part of healing.';
    } else if (intensity < 0.3) {
      stageId = 'acceptance'; stageIndex = 4;
      description = 'Moving toward acceptance. Life is beginning to reorganize.';
    } else {
      stageId = 'depression'; stageIndex = 3;
      description = 'Processing the loss. Allow the pain. It is the price of love.';
    }

    // Context adjustments
    if (context?.includes('sudden') || context?.includes('unexpected')) {
      stageIndex = Math.max(0, stageIndex - 1); // Sudden loss delays progression
    }

    const stage = this._stages[stageIndex];
    this._currentStage = stageId;
    this._griefState.stage = stageId;

    return {
      stage: stageId,
      stageIndex,
      name: stage.name,
      nameZh: stage.nameZh,
      description,
      descriptionZh: stage.descriptionZh,
      duration: stage.duration,
      timeInStage: days,
    };
  }

  _assessTaskProgress(stage) {
    const taskCompletion = {};
    let completed = 0;

    for (const task of this._tasks) {
      const isComplete = this._griefState.completedTasks.includes(task.id);
      taskCompletion[task.id] = {
        completed: isComplete,
        name: task.name,
        nameZh: task.nameZh,
      };
      if (isComplete) completed++;
    }

    const completionRate = completed / this._tasks.length;

    return {
      tasks: taskCompletion,
      completed,
      total: this._tasks.length,
      completionRate: +completionRate.toFixed(3),
    };
  }

  _assessGriefType(intensity, timeSinceLoss, context) {
    const days = typeof timeSinceLoss === 'string' ? 0 : timeSinceLoss / 86400000;
    const contextStr = (context || '').toLowerCase();

    // Prolonged grief
    if (days > 180 && intensity > 0.6) {
      return { type: 'prolonged_grief', name: 'Prolonged Grief', nameZh: '延长哀伤', severity: 'high', recommendation: 'Professional support may be needed.' };
    }

    // Complicated grief
    if (contextStr.includes('traumatic') || contextStr.includes('sudden')) {
      return { type: 'complicated_grief', name: 'Complicated Grief', nameZh: '复杂哀伤', severity: 'high', recommendation: 'Trauma-informed therapy recommended.' };
    }

    // Anticipatory grief
    if (contextStr.includes('anticipated') || contextStr.includes('terminal')) {
      return { type: 'anticipatory_grief', name: 'Anticipatory Grief', nameZh: '预期哀伤', severity: 'medium', recommendation: 'Make the most of remaining time. Say what needs to be said.' };
    }

    // Disenfranchised grief
    if (contextStr.includes('unrecognized') || contextStr.includes('hidden')) {
      return { type: 'disenfranchised_grief', name: 'Disenfranchised Grief', nameZh: '未被承认的哀伤', severity: 'medium', recommendation: 'Your grief is valid even if others don\'t acknowledge it. Find supportive spaces.' };
    }

    return { type: 'normal_grief', name: 'Normal Grief', nameZh: '正常哀伤', severity: 'low', recommendation: 'Continue the natural grieving process. Be patient with yourself.' };
  }

  _generateGriefGuidance(stageAssessment, taskProgress, griefType) {
    const guidance = [];

    // Stage-based guidance
    guidance.push({
      type: 'stage_guidance',
      currentStage: stageAssessment.nameZh,
      message: stageAssessment.description,
      practice: this._getStagePractice(stageAssessment.stage),
    });

    // Task-based guidance
    const incompleteTasks = this._tasks.filter(t => !this._griefState.completedTasks.includes(t.id));
    if (incompleteTasks.length > 0) {
      guidance.push({
        type: 'task_guidance',
        nextTask: incompleteTasks[0].nameZh,
        description: incompleteTasks[0].descriptionZh,
        priority: 'high',
      });
    }

    // Type-specific guidance
    if (griefType.severity === 'high') {
      guidance.push({
        type: 'specialized_support',
        message: griefType.recommendation,
        severity: 'high',
      });
    }

    // Cultural guidance
    if (this._config.culture === 'eastern' || this._config.culture === 'integrated') {
      guidance.push({
        type: 'cultural_practice',
        tradition: 'Buddhism/Confucianism',
        practice: 'Practice mindfulness of impermanence. Create rituals to honor the deceased.',
        practiceZh: '修无常观。建立仪式纪念逝者。',
      });
    }

    return guidance;
  }

  _getStagePractice(stage) {
    const practices = {
      denial: { practice: 'Gently face the reality. Write down what is true.', practiceZh: '温和面对现实。写下什么是真实的。' },
      anger: { practice: 'Express anger safely. Physical activity, writing, or talking.', practiceZh: '安全表达愤怒。体育活动、写作或倾诉。' },
      bargaining: { practice: 'Notice the "if only" thoughts. Gently return to present reality.', practiceZh: '注意到"如果"的念头。温和回到当下现实。' },
      depression: { practice: 'Allow the sadness. It is the price of love. Be gentle with yourself.', practiceZh: '允许悲伤。这是爱的代价。对自己温柔。' },
      acceptance: { practice: 'Begin to rebuild. Find new meaning and purpose.', practiceZh: '开始重建。找到新意义和目的。' },
    };
    return practices[stage] || practices['depression'];
  }

  // ─── 哀悼仪式 ──────────────────────────────────────────────────────────

  createMemorial(memorial) {
    this._stats.memorialsCreated++;
    const entry = {
      type: memorial.type || 'ritual',
      content: memorial.content || '',
      dedication: memorial.dedication || '',
      date: memorial.date || new Date().toISOString().split('T')[0],
      recurring: memorial.recurring || false,
      timestamp: Date.now(),
    };

    this._memorials.push(entry);
    return entry;
  }

  completeTask(taskId) {
    if (!this._griefState.completedTasks.includes(taskId)) {
      this._griefState.completedTasks.push(taskId);
      this._stats.tasksCompleted++;
    }

    const task = this._tasks.find(t => t.id === taskId);
    return { completed: true, task: task?.nameZh || taskId };
  }

  getMemorials() {
    return [...this._memorials];
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      currentStage: this._griefState.stage,
      currentIntensity: this._griefState.intensity,
      healingProgress: this._griefState.healingProgress,
      completedTasks: this._griefState.completedTasks.length,
      totalTasks: this._tasks.length,
      memorialCount: this._memorials.length,
      recentGrief: this._griefRecords.slice(-3).map(g => ({
        loss: (g.loss || '').slice(0, 30),
        stage: g.stage?.nameZh,
        intensity: g.intensity,
      })),
    };
  }

  getStages() {
    return this._stages.map(s => ({ id: s.id, name: s.name, nameZh: s.nameZh, description: s.descriptionZh, duration: s.duration }));
  }

  getTasks() {
    return this._tasks.map(t => ({ id: t.id, name: t.name, nameZh: t.nameZh, description: t.descriptionZh }));
  }
}

module.exports = { GriefEngine };
