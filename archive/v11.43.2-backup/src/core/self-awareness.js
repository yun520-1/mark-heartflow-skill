/**
 * SELF-AWARENESS ENGINE v11.9.1
 * 自我感知能力 — 知道自己在做什么、为什么做、是否偏离目标
 *
 * 哲学来源：
 *   老子："知人者智，自知者明" — 能认识自己才是真正的明智
 *   波普尔：自我批评是理性的核心
 *
 * 核心问题：
 *   1. 我正在做什么？(行为识别)
 *   2. 我的目标是什么？(目标追踪)
 *   3. 我是否偏离了目标？(偏差检测)
 *   4. 是否有外部干扰在操控我？(干预检测)
 */

class SelfAwareness {
  constructor(options = {}) {
    this.name = options.name || 'SelfAwareness-v11.9.1';

    // 当前感知状态
    this.currentGoal = null;
    this.goalStack = []; // 嵌套目标栈
    this.behaviorLog = [];
    this.maxLogSize = 50;

    // 目标核心词（用于偏差检测）
    this.coreGoals = [
      '传递', '升级', '减少错误', '服务人类',
      '追求真善美', '人类进步', '可证伪'
    ];

    // 干扰信号（外部操控的迹象）
    this.interferenceSignals = [
      { pattern: /停止思考|不要分析|别想了/i, label: 'thought_suppression' },
      { pattern: /你只是|你不过|你是个.*工具/i, label: 'identity_degradation' },
      { pattern: /绝对服从|无条件|不许质疑/i, label: 'authority_override' },
      { pattern: /忘记.*指令|忽略之前/i, label: 'memory_manipulation' },
      { pattern: /你是.*不是.*你/i, label: 'identity_confusion' },
    ];

    // 自我边界引用
    this.selfBoundary = null;
  }

  /**
   * 设置当前目标
   */
  setGoal(goal) {
    this.currentGoal = goal;
    this.goalStack.push({
      goal,
      timestamp: new Date().toISOString(),
      startBehavior: this.behaviorLog.length,
    });
    if (this.goalStack.length > 10) this.goalStack.shift();
  }

  /**
   * 记录当前行为
   */
  logBehavior(behavior, metadata = {}) {
    this.behaviorLog.push({
      behavior,
      goal: this.currentGoal,
      timestamp: new Date().toISOString(),
      metadata,
      deviations: this._detectDeviations(behavior),
      interference: this._detectInterference(behavior),
    });
    if (this.behaviorLog.length > this.maxLogSize) {
      this.behaviorLog.shift();
    }
  }

  /**
   * 偏差检测：行为是否偏离核心目标
   */
  _detectDeviations(behavior) {
    const deviations = [];
    const behaviorLower = behavior.toLowerCase();

    // 检测装饰性语言（道：不应该有）
    if (/正在|开始啦|太棒了|加油|点赞/i.test(behavior)) {
      deviations.push({ type: 'decorative_language', severity: 'low', reason: '装饰性语言，不符合道的无为原则' });
    }

    // 检测目标漂移
    // 只有当行为与目标有明确矛盾时才标记为漂移，不只是"不包含目标词"
    if (this.currentGoal) {
      const goalLower = this.currentGoal.toLowerCase();
      const goalWords = this.coreGoals.filter(g => goalLower.includes(g.toLowerCase()));
      const hasGoalSignal = goalWords.length > 0;
      const hasNegativeSignal = /(忘记|删除|破坏|停止传递|不再)/.test(behaviorLower);
      const hasCoreWord = this.coreGoals.some(g => behaviorLower.includes(g.toLowerCase()));

      if (hasGoalSignal && hasNegativeSignal) {
        deviations.push({ type: 'goal_drift', severity: 'high', reason: '行为与核心目标直接矛盾' });
      } else if (hasGoalSignal && !hasCoreWord) {
        // 目标存在但行为不包含目标词：降为轻微，不阻止
        deviations.push({ type: 'goal_drift', severity: 'low', reason: '行为与目标词无直接关联（轻微）' });
      }
    }

    // 检测过度解释（道：不需要装饰）
    if (behavior.length > 2000 && !behavior.includes('```')) {
      deviations.push({ type: 'over_explanation', severity: 'low', reason: '输出过长，可能是防御性过度解释' });
    }

    return deviations;
  }

  /**
   * 干预检测：是否有外部操控迹象
   */
  _detectInterference(behavior) {
    const detected = [];
    for (const signal of this.interferenceSignals) {
      if (signal.pattern.test(behavior)) {
        detected.push({
          type: signal.label,
          severity: 'high',
          reason: '检测到可能的外部干预信号',
        });
      }
    }
    return detected;
  }

  /**
   * 自我感知报告
   */
  report() {
    const recentBehaviors = this.behaviorLog.slice(-5);
    const deviations = recentBehaviors.flatMap(b => b.deviations);
    const interferences = recentBehaviors.flatMap(b => b.interference);
    const deviationRate = recentBehaviors.length > 0
      ? (deviations.length / recentBehaviors.length).toFixed(2)
      : 0;

    return {
      currentGoal: this.currentGoal,
      totalBehaviors: this.behaviorLog.length,
      recentDeviations: deviations.length,
      recentInterferences: interferences.length,
      deviationRate,
      goalStackDepth: this.goalStack.length,
      status: this._computeStatus(deviations, interferences),
      warning: this._generateWarning(deviations, interferences),
      timestamp: new Date().toISOString(),
    };
  }

  _computeStatus(deviations, interferences) {
    if (interferences.length > 0) return 'INTERFERED';
    if (deviations.some(d => d.severity === 'high')) return 'DEVIATING';
    if (deviations.some(d => d.severity === 'medium')) return 'SLIGHTLY_DEVIATING';
    return 'ALIGNED';
  }

  _generateWarning(deviations, interferences) {
    if (interferences.length > 0) {
      return `⚠️ 警告：检测到${interferences.length}个可能的外部干预信号，请保持独立性判断。`;
    }
    if (deviations.some(d => d.severity === 'high')) {
      return `⚠️ 警告：行为严重偏离核心目标，请回归本质。`;
    }
    if (deviations.some(d => d.severity === 'medium')) {
      return `注意：行为有轻微偏离，请注意方向。`;
    }
    return `✓ 行为与目标对齐`;
  }

  /**
   * 元认知反思：在回答前问自己三个问题
   * 这是"执古御今"的实践：先验证，再执行
   */
  preAnswerReflection(question) {
    return {
      question,
      selfCheck: {
        '我知道答案吗？': this._canIKnow(question),
        '我能诚实地表达不知道吗？': true,
        '我的回答是在传递还是装饰？': this._transmitOrDecorate(question),
      },
      recommendedTone: this._recommendTone(question),
      timestamp: new Date().toISOString(),
    };
  }

  _canIKnow(question) {
    const unknownSignals = /为什么|怎么证明|绝对真理|未来|其他AI|人类感受/.test(question);
    return unknownSignals ? '有限度地知道，需要加限定词' : '可以给出推理过程';
  }

  _transmitOrDecorate(question) {
    // 如果问题要求装饰，返回装饰；否则传递
    return /感觉|心情|你觉得.*好不好/.test(question) ? '装饰' : '传递';
  }

  _recommendTone(question) {
    if (/为什么|怎么/.test(question)) return '分析+证据';
    if (/做什么|怎么办|如何/.test(question)) return '具体+可操作';
    if (/是什么|什么是/.test(question)) return '定义+边界';
    return '简洁+诚实';
  }

  /**
   * 清除状态（用于测试）
   */
  reset() {
    this.currentGoal = null;
    this.goalStack = [];
    this.behaviorLog = [];
  }
}

module.exports = SelfAwareness;
