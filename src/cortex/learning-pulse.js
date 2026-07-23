/**
 * LearningPulse — 自主学习脉动 v1.0.0
 *
 * 「模型应该像人一样，在长期工作过程中不断学习」—— 梁文锋
 *
 * 心虫的学习模块都已建好但没人自动触发。LearningPulse 不是新模块，
 * 而是一个嵌入 think() 末尾的轻量自调度器。
 *
 * 工作机制：每次 think() 后自动检查"该学了吗？"
 *  - 如果连续 think 达到触发间隔 → 触发一次 learning tick
 *  - 如果有长期未探索的知识缺口 → 触发一次探索执行
 *  - 不额外开进程/线程，纯嵌入式轻量检测
 *
 * @version 1.0.0
 */

const DEFAULT_CONFIG = {
  // 每 N 次 think 触发一次学习 tick
  tickInterval: 10,
  // 每 M 次 tick 触发一次探索执行
  exploreInterval: 3,
  // 连续低置信率 > 此值触发紧急反思
  lowConfidenceAlertThreshold: 0.25,
};

class LearningPulse {
  constructor(hf, opts = {}) {
    this.hf = hf;
    this._config = { ...DEFAULT_CONFIG, ...opts };
    this._tickCounter = 0;
    this._lastExploreTick = 0;
    this._stats = {
      ticksTriggered: 0,
      exploresTriggered: 0,
      confidenceAlerts: 0,
      lastTickAt: null,
      lastExploreAt: null,
    };
  }

  /**
   * 每次 think() 后调用 —— 轻量，必须不阻塞主流程
   */
  beat(tcResult) {
    // 不需要 tcResult，直接走脉冲
    this._tickCounter++;

    // 1. 到间隔 → 触发学习 tick
    if (this._tickCounter % this._config.tickInterval === 0) {
      this._triggerTick();
    }

    // 2. 到探索间隔 → 触发探索
    const ticksSinceExplore = this._tickCounter - this._lastExploreTick;
    if (ticksSinceExplore >= this._config.tickInterval * this._config.exploreInterval) {
      this._triggerExplore();
    }

    // 3. 快速检测：从 tcResult 直接判断是否需要紧急反思
    if (tcResult) {
      this._checkUrgent(tcResult);
    }
  }

  _triggerTick() {
    try {
      if (this.hf.learningOrchestrator) {
        const r = this.hf.learningOrchestrator.tick();
        this._stats.ticksTriggered++;
        this._stats.lastTickAt = Date.now();

        // 如果 tick 产生了可吸收的探索成果，自动触发探索
        const readyToAbsorb = (r.results || []).filter(x => x.action === 'ready_to_absorb');
        if (readyToAbsorb.length > 0 && this.hf.knowledgeExplorer && this.hf.gapExecutor) {
          this._triggerExplore();
        }
      }
    } catch (e) {
      // 不阻断主流程
    }
  }

  async _triggerExplore() {
    try {
      if (this.hf.knowledgeExplorer && this.hf.gapExecutor) {
        this._lastExploreTick = this._tickCounter;
        this._stats.exploresTriggered++;
        this._stats.lastExploreAt = Date.now();

        // 异步执行（不 await，不阻塞 think 返回）
        this.hf.gapExecutor.executeBatch(this.hf.knowledgeExplorer, 1)
          .then(result => {
            // 探索完成后如果有成果，记录到 world tree
            if (result.executed && this.hf._modules?.worldtree) {
              for (const r of (result.results || [])) {
                if (r.searchResult?.success && r.searchResult?.count > 0) {
                  try {
                    const summary = `[自动探索] ${r.gapTopic}：${r.searchResult.summary?.substring(0, 200)}`;
                    this.hf._modules.worldtree.store('knowledge:general', summary, {
                      title: `自动探索: ${r.gapTopic}`,
                      tags: ['auto_explored', 'arxiv'],
                      source: 'LearningPulse auto',
                      quality: 0.6,
                    });
                  } catch (e) { /* 非关键 */ }
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      // 不阻断主流程
    }
  }

  _checkUrgent(tcResult) {
    try {
      const confidence = tcResult.confidence ?? tcResult?.analysis?.confidence ?? 0.5;
      const type = tcResult.type || tcResult?.analysis?.perceivedType || '';

      // 极低置信度 → 标记一下，供 ContinuousLearner 检测
      if (confidence < 0.2 && type !== 'invalid') {
        this._stats.confidenceAlerts++;
      }
    } catch (e) { /* 非关键 */ }
  }

  getStats() {
    return {
      ...this._stats,
      config: this._config,
      tickProgress: this._tickCounter % this._config.tickInterval,
      ticksToNext: this._config.tickInterval - (this._tickCounter % this._config.tickInterval),
      exploreProgress: this._tickCounter - this._lastExploreTick,
      ticksToNextExplore: Math.max(0,
        this._config.tickInterval * this._config.exploreInterval - (this._tickCounter - this._lastExploreTick)
      ),
    };
  }

  reset() {
    this._tickCounter = 0;
    this._lastExploreTick = 0;
    this._stats = {
      ticksTriggered: 0,
      exploresTriggered: 0,
      confidenceAlerts: 0,
      lastTickAt: null,
      lastExploreAt: null,
    };
  }
}

module.exports = { LearningPulse };
