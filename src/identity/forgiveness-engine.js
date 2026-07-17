/**
 * Forgiveness Engine — 宽恕引擎 v1.0.0
 *
 * 回答：「人怎么放下怨恨？」
 *
 * 基于：
 *   - Enright 宽恕四阶段:  uncovering → decision → work → deepening
 *   - Buddhism: 慈悲超越怨恨 — 嗔恨伤己，慈悲释怀
 *   - Confucianism: 恕道 — 己所不欲，勿施于人；以直报怨，以德报德
 *   - Christianity: 宽恕是给予者获得自由，不是给予被宽恕者恩典
 *   - Psychology: 宽恕不是忘记，是改变对事件的意义
 *
 * @version 1.0.0
 */

class ForgivenessEngine {
  constructor(options = {}) {
    this._config = {
      forgivenessModel: options.forgivenessModel || 'enright',
      selfForgiveness: options.selfForgiveness || true,
      unconditional: options.unconditional || false,
    };

    // ─── 宽恕阶段 ──────────────────────────────────────────────────────
    this._stages = [
      { id: 'uncovering', name: 'Uncovering', nameZh: '揭示', description: 'Acknowledge the pain. Name the wound. Feel the anger and hurt.', descriptionZh: '承认痛苦。命名伤口。感受愤怒和伤害。', tasks: ['acknowledge_pain', 'name_the_wound', 'express_anger', 'recognize_impact'] },
      { id: 'decision', name: 'Decision', nameZh: '决定', description: 'Choose to forgive. Not for them — for you. Forgiveness is a gift to yourself.', descriptionZh: '选择宽恕。不是为了他们——是为了你。宽恕是给自己的礼物。', tasks: ['commit_to_forgiveness', 'reframe_forgiveness', 'release_resentment'] },
      { id: 'work', name: 'Work', nameZh: '工作', description: 'Reframe the offender. Understand their humanity. Develop compassion.', descriptionZh: '重新构建对冒犯者的理解。理解他们的人性。发展 compassion。', tasks: ['reframe_offender', 'develop_compassion', 'find_meaning', 'practice_empathy'] },
      { id: 'deepening', name: 'Deepening', nameZh: '深化', description: 'Forgiveness becomes part of identity. Meaning emerges from suffering. You are transformed.', descriptionZh: '宽恕成为身份的一部分。意义从苦难中涌现。你被转化了。', tasks: ['integrate_forgiveness', 'find_new_meaning', 'help_others', 'celebrate_freedom'] },
    ];

    // ─── 宽恕对象 ──────────────────────────────────────────────────────
    this._forgivenessRecords = [];
    this._currentStage = null;
    this._resentmentLevel = 0.5;
    this._compassionLevel = 0.5;
    this._forgivenessBarriers = [];

    // ─── 宽恕原则 ──────────────────────────────────────────────────────
    this._principles = [
      { id: 'p1', name: 'Forgiveness is for you', nameZh: '宽恕是为了自己', description: 'Forgiveness does not excuse the offense. It frees you from the burden of resentment.', descriptionZh: '宽恕不是为冒犯开脱。它把你从怨恨的负担中解放出来。' },
      { id: 'p2', name: 'Forgiveness ≠ Reconciliation', nameZh: '宽恕 ≠ 和解', description: 'You can forgive without restoring the relationship. Safety comes first.', descriptionZh: '你可以宽恕而不恢复关系。安全第一。' },
      { id: 'p3', name: 'Forgiveness ≠ Forgetting', nameZh: '宽恕 ≠ 忘记', description: 'Remembering is not the same as being trapped by memory.', descriptionZh: '记住不等于被记忆困住。' },
      { id: 'p4', name: 'Forgiveness is a process', nameZh: '宽恕是一个过程', description: 'It takes time. There is no deadline. Some wounds take years.', descriptionZh: '这需要时间。没有截止日期。有些伤口需要数年。' },
      { id: 'p5', name: 'Self-forgiveness matters', nameZh: '自我宽恕同样重要', description: 'You may need to forgive yourself too. Guilt and shame are heavy burdens.', descriptionZh: '你可能也需要宽恕自己。内疚和羞耻是沉重的负担。' },
    ];

    this._stats = {
      totalForgivenessProcesses: 0,
      completedProcesses: 0,
      stageTransitions: 0,
      selfForgivenessProcesses: 0,
      resentmentReleased: 0,
    };
  }

  // ─── 宽恕过程 ──────────────────────────────────────────────────────────

  initiateForgiveness(forgiveness) {
    this._stats.totalForgivenessProcesses++;
    const { offense, offender, relationship, intensity, context, isSelfForgiveness } = forgiveness || {};

    // 评估当前怨恨水平
    const resentmentLevel = intensity || 0.5;

    // 确定起点阶段
    const startStage = this._determineStartStage(resentmentLevel, context);

    // 识别宽恕障碍
    const barriers = this._identifyBarriers(forgiveness);

    // 生成宽恕路径
    const path = this._generateForgivenessPath(startStage, barriers, isSelfForgiveness);

    // 计算宽恕可能性
    const feasibility = this._assessForgivenessFeasibility(resentmentLevel, barriers, relationship);

    const entry = {
      offense: offense || '',
      offender: offender || '',
      relationship: relationship || '',
      resentmentLevel,
      startStage,
      currentStage: startStage.id,
      barriers,
      path,
      feasibility,
      isSelfForgiveness: isSelfForgiveness || false,
      timestamp: Date.now(),
    };

    this._forgivenessRecords.push(entry);
    this._currentStage = entry;
    this._resentmentLevel = resentmentLevel;

    return entry;
  }

  _determineStartStage(resentment, context) {
    if (resentment > 0.8) return { ...this._stages[0], reason: 'High resentment requires beginning at the uncovering phase.' };
    if (resentment > 0.5) return { ...this._stages[0], reason: 'Moderate resentment. Start with uncovering the pain.' };
    return { ...this._stages[1], reason: 'Some processing already done. Ready for decision phase.' };
  }

  _identifyBarriers(forgiveness) {
    const barriers = [];
    const context = (forgiveness?.context || '').toLowerCase();

    if (forgiveness?.intensity > 0.8) barriers.push({ type: 'high_resentment', name: 'High Resentment', nameZh: '高怨恨', suggestion: 'Need extensive grief work before forgiveness is possible.', suggestionZh: '需要广泛的哀伤工作，宽恕才可能。' });
    if (context.includes('ongoing') || context.includes('repeated')) barriers.push({ type: 'ongoing_harm', name: 'Ongoing Harm', nameZh: '持续伤害', suggestion: 'Safety first. Forgiveness does not require staying in harmful situations.', suggestionZh: '安全第一。宽恕不要求留在有害环境中。' });
    if (context.includes('power') || context.includes('abuse')) barriers.push({ type: 'power_imbalance', name: 'Power Imbalance', nameZh: '权力不平衡', suggestion: 'Address power dynamics before forgiveness work.', suggestionZh: '在宽恕工作前处理权力动态。' });
    if (forgiveness?.isSelfForgiveness) barriers.push({ type: 'self_judgment', name: 'Self-Judgment', nameZh: '自我评判', suggestion: 'Self-forgiveness requires radical self-compassion.', suggestionZh: '自我宽恕需要极致的自我慈悲。' });
    if (/don't deserve|should have|my fault|shouldn't|不应该|我的错/.test(context)) barriers.push({ type: 'self_blame', name: 'Self-Blame', nameZh: '自责', suggestion: 'Separate responsibility from guilt. You did the best you could.', suggestionZh: '区分责任和内疚。你已经尽力了。' });

    this._forgivenessBarriers.push(...barriers);
    return barriers;
  }

  _generateForgivenessPath(startStage, barriers, isSelfForgiveness) {
    const path = [];
    let currentStage = startStage.id === 'uncovering' ? 0 : 1;

    for (let i = currentStage; i < this._stages.length; i++) {
      const stage = this._stages[i];
      path.push({
        stage: stage.id,
        nameZh: stage.nameZh,
        tasks: stage.tasks,
        estimatedDuration: i === 0 ? 'weeks' : i === 1 ? 'weeks-months' : 'months',
        barriersToWatch: barriers.filter(b => b.type.includes('resentment') || b.type.includes('safety')),
      });
    }

    if (isSelfForgiveness) {
      path.push({
        stage: 'self_forgiveness_practice',
        nameZh: '自我宽恕练习',
        practices: ['self_compassion_meditation', 'write_forgiveness_letter_to_self', 'acknowledge_humanity'],
        note: 'Self-forgiveness requires treating yourself with the same compassion you would offer a friend.',
      });
    }

    return path;
  }

  _assessForgivenessFeasibility(resentment, barriers, relationship) {
    const barrierCount = barriers.length;
    let feasibility = 1 - resentment * 0.5;
    feasibility -= barrierCount * 0.1;

    return {
      score: +Math.max(0.1, Math.min(0.9, feasibility)).toFixed(3),
      timeEstimate: resentment > 0.7 ? '6-24 months' : resentment > 0.4 ? '3-12 months' : 'weeks-months',
      recommendation: feasibility > 0.5 ? 'Forgiveness journey is feasible. Proceed with patience.' : 'Consider professional support for this forgiveness process.',
      recommendationZh: feasibility > 0.5 ? '宽恕旅程是可行的。耐心进行。' : '考虑专业支持来辅助这个宽恕过程。',
    };
  }

  // ─── 阶段推进 ──────────────────────────────────────────────────────────

  advanceForgivenessStage(processId, reflection) {
    const process = this._forgivenessRecords.find(p => p.timestamp === processId) || this._forgivenessRecords[this._forgivenessRecords.length - 1];
    if (!process) return null;

    const currentIndex = this._stages.findIndex(s => s.id === process.currentStage);
    if (currentIndex < this._stages.length - 1) {
      process.currentStage = this._stages[currentIndex + 1].id;
      this._stats.stageTransitions++;

      // Reduce resentment as forgiveness progresses
      this._resentmentLevel = Math.max(0, this._resentmentLevel - 0.1);
      this._compassionLevel = Math.min(1, this._compassionLevel + 0.1);

      return { advanced: true, newStage: process.currentStage, newStageZh: this._stages[currentIndex + 1].nameZh };
    }

    // Completed
    this._stats.completedProcesses++;
    this._stats.resentmentReleased++;
    this._resentmentLevel = 0;
    return { advanced: false, completed: true, message: 'Forgiveness journey completed. You are free.', messageZh: '宽恕旅程完成。你自由了。' };
  }

  // ─── 宽恕练习 ──────────────────────────────────────────────────────────

  generateForgivenessPractice(stage) {
    const practices = {
      uncovering: { name: 'Pain Letter', nameZh: '痛苦之信', description: 'Write a letter to the offender expressing all your pain. Do not send it.', descriptionZh: '给冒犯者写一封信，表达你所有的痛苦。不要寄出。' },
      decision: { name: 'Forgiveness Declaration', nameZh: '宽恕宣言', description: 'Make a conscious decision: "I choose to forgive, for my own freedom."', descriptionZh: '做出有意识的决定：「我选择宽恕，为了我自己的自由。」' },
      work: { name: 'Perspective Shift', nameZh: '视角转换', description: 'Write from the offender\'s perspective. What pain might have driven them?', descriptionZh: '从冒犯者的视角写作。什么痛苦可能驱动了他们？' },
      deepening: { name: 'Gratitude Practice', nameZh: '感恩练习', description: 'List what the suffering taught you. What good emerged?', descriptionZh: '列出痛苦教给你什么。什么善事涌现了？' },
    };

    return practices[stage] || practices['decision'];
  }

  // ─── 统计 ──────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      currentResentment: this._resentmentLevel,
      currentCompassion: this._compassionLevel,
      transformationProgress: +(1 - this._resentmentLevel).toFixed(3),
      activeProcesses: this._forgivenessRecords.filter(p => !p.completed).length,
      recentProcesses: this._forgivenessRecords.slice(-3).map(p => ({
        offense: (p.offense || '').slice(0, 30),
        stage: p.currentStage,
        resentment: p.resentmentLevel,
        isSelfForgiveness: p.isSelfForgiveness,
      })),
    };
  }

  getPrinciples() {
    return this._principles.map(p => ({ id: p.id, name: p.name, nameZh: p.nameZh, description: p.descriptionZh }));
  }
}

module.exports = { ForgivenessEngine };
