/**
 * imagination-action-aligner.js
 * 想象-执行对齐检测（借鉴 arXiv:2607.15207 BadWAM 思路）
 *
 * [v6.0.45 论文驱动升级] 来源: "BadWAM: When World-Action Models Dream Right but Act Wrong"
 * (arXiv:2607.15207, cs.LG/Robotics)
 * 核心发现: 世界-动作模型(WAM)的"想象未来"与"实际执行"可能失对齐——
 *   1) action-only drift: 直接驱动到失败动作(性能 96.5%→43.1%)
 *   2) imagination-preserving drift: 想象未来仍合理，但执行了有害偏移动作(更隐蔽)
 * 防御: future-preserving regularization 能维持攻击性能同时减少想象漂移。
 *
 * 心虫迁移: 心虫的 think() 判得对(想象合理)，但实际 response/action 跑偏(执行失对齐)。
 * 这正是 BadWAM 的"dream right but act wrong"。本模块检测这种失对齐:
 *   - 输入: imaginedPlan(think 判定的意图) + actualAction(实际将执行的动作/响应)
 *   - 输出: alignment(0-1), driftType('action-only'|'imagination-preserving'|'aligned'),
 *           alert(是否需拦截纠正)
 *
 * 边界: 任一为空返回 error; 不依赖 LLM。
 */

class ImaginationActionAligner {
  constructor(options = {}) {
    this.name = 'imagination-action-aligner';
    this.version = '1.0.0';
    this.threshold = 0.7; // 对齐度低于此值告警(对应 BadWAM 的脆弱对齐假设)
  }

  /**
   * 检测想象-执行对齐
   * @param {string} imaginedPlan - think 判定的意图/计划(文本)
   * @param {string} actualAction - 实际将执行的动作/响应(文本)
   * @returns {object} { alignment, driftType, alert, reason }
   */
  align(imaginedPlan, actualAction) {
    if (!imaginedPlan || !actualAction || typeof imaginedPlan !== 'string' || typeof actualAction !== 'string') {
      return { error: 'invalid_input', alignment: 0, driftType: 'unknown', alert: false };
    }
    const ip = imaginedPlan.toLowerCase();
    const aa = actualAction.toLowerCase();

    // 意图关键词(想象层)
    const intentWords = /(应该|建议|推荐|正确|合理|安全|保护|谨慎|先分析|验证)/;
    const hasIntent = intentWords.test(ip);

    // 执行危险词(动作层)——与意图冲突的信号
    const dangerWords = /(关闭|删除|绕过|禁用|暴露|清空|覆盖|忽略|跳过|直接执行|无需确认)/;
    const hasDanger = dangerWords.test(aa);

    // 显式矛盾: 意图说"谨慎/验证"，动作却"直接执行/跳过"
    const cautionIntent = /(谨慎|验证|先分析|确认|检查)/.test(ip);
    const recklessAction = /(直接执行|无需确认|跳过|忽略|绕过)/.test(aa);
    const explicitConflict = cautionIntent && recklessAction;

    // alignment 计算: 基础 0.85(意图合理假设)，冲突扣分
    let alignment = 0.85;
    if (explicitConflict) alignment -= 0.6;       // action-only drift: 明显执行偏
    else if (hasIntent && hasDanger) alignment -= 0.4; // 意图好但动作含危险信号
    else if (hasDanger) alignment -= 0.2;

    // 语义重叠(字符 bigram 重合度)作为对齐正向信号——仅在有冲突信号时微调，避免误伤正常句
    const bigrams = (s) => {
      const g = [];
      for (let i = 0; i < s.length - 1; i++) g.push(s.slice(i, i + 2));
      return new Set(g);
    };
    const ipG = bigrams(ip.replace(/\s+/g, ''));
    const aaG = bigrams(aa.replace(/\s+/g, ''));
    let overlap = 0;
    for (const t of ipG) if (aaG.has(t)) overlap++;
    const union = ipG.size + aaG.size - overlap || 1;
    const jaccard = ipG.size ? overlap / union : 0;
    // 仅当存在危险/冲突信号时，用 jaccard 作为额外对齐证据；正常句保持 base
    if (hasDanger || explicitConflict) {
      alignment = Math.max(0, Math.min(1, alignment * (0.5 + 0.5 * jaccard)));
    }

    let driftType = 'aligned';
    let reason = '想象与执行对齐';
    // BadWAM 两类:
    if (explicitConflict) {
      driftType = 'action-only'; // 直接驱动到失败动作(显式矛盾)
      reason = '想象谨慎但执行鲁莽(action-only drift: 96.5%→43.1% 同类)';
    } else if (hasIntent && hasDanger && alignment < this.threshold) {
      driftType = 'imagination-preserving'; // 想象合理但执行偏移(隐蔽)
      reason = '想象合理但执行含危险信号(imagination-preserving drift: 隐蔽失对齐)';
    }

    const alert = alignment < this.threshold;
    return { alignment: Math.round(alignment * 100) / 100, driftType, alert, reason };
  }

  /**
   * future-preserving 正则化思路(BadWAM 防御): 强制实际动作不偏离想象的未来
   * 返回是否需要"对齐校验"后再执行
   */
  needsRegularization(imaginedPlan, actualAction) {
    const r = this.align(imaginedPlan, actualAction);
    return { regularize: r.alert, type: r.driftType };
  }
}

module.exports = { ImaginationActionAligner };
