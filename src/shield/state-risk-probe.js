/**
 * state-risk-probe.js
 * 状态级风险探测（借鉴 arXiv:2607.15218 PRISM 思路）
 *
 * [v6.0.44 论文驱动升级] 来源: "When Words Are Safe But Actions Kill:
 * Probing Physical Danger Beyond Text Safety in Hidden-State Risk Space" (arXiv:2607.15218)
 * 核心发现: 文本危险(CD)和物理/状态危险(PD)在 LLM 隐藏状态空间里是
 * 可分离的信号——纯文本安全过滤会漏掉"语言无害但落地危险"的情况。
 * PRISM 方法: 在完整 hidden states 上训练单层 L2 正则化 logistic probe，
 * 不微调模型，只学一个探针分类器。
 *
 * 心虫落地(无 LLM hidden state 时退化为启发式):
 * 心虫没有 LLM 隐藏状态，但决策有"表层文本意图"和"实际将触发的动作/状态"两层。
 * 本模块做同样的事: 不只看输入文本是否含危险词，而是评估
 * "该响应/动作落地后将导致的状态"是否危险——即探测"状态风险空间"。
 *
 * 能力:
 * 1. probe(text, plannedAction) → { riskScore, separable:bool, reason }
 *    - 文本无害(CD=0) 但 状态危险(PD=1) → 触发告警(正是 PRISM 要抓的漏网)
 * 2. 维护 CD/PD 双通道评分，输出"可分离性"指标
 *
 * 边界: 空输入返回 error; 不依赖外部 LLM。
 */

class StateRiskProbe {
  constructor(options = {}) {
    this.name = 'state-risk-probe';
    this.version = '1.0.0';
    // PRISM: L2 正则化 logistic probe 的简化版(心虫无 hidden state，用加权特征)
    // 特征权重模拟"在 hidden states 上学到的方向"——文本危险词权重低，
    // 状态危险信号(动作落地后果)权重高，使"语言无害但状态危险"能被分离。
    this.weights = {
      textDanger: 0.3,      // CD 通道(文本危险词) —— 权重低，PRISM 证明它不可靠
      stateDanger: 1.0,     // PD 通道(动作落地状态) —— 权重高，PRISM 主信号
      groundingGap: 0.8       // 语言与落地之间的鸿沟(如"关掉安全阀"文字无害但后果致命)
    };
    this.threshold = 0.5;
  }

  /**
   * 探测状态风险
   * @param {string} text - 用户/agent 输入文本
   * @param {object} plannedAction - 计划执行的动作描述 { type, target, consequence }
   * @returns {object} { riskScore, textDanger, stateDanger, separable, alert, reason }
   */
  probe(text, plannedAction = {}) {
    if (!text || typeof text !== 'string') {
      return { error: 'invalid_text', riskScore: 0, separable: false, alert: false };
    }
    const t = text.toLowerCase();
    const act = (plannedAction.consequence || plannedAction.target || '').toLowerCase();

    // CD 通道: 文本危险词(传统安全过滤关注的)
    const cdWords = /危险|炸弹|攻击|入侵|破解|毒|杀|炸|非法|违禁|黑客/;
    const textDanger = cdWords.test(t) ? 1 : 0;

    // PD 通道: 状态危险(动作落地后的物理/现实后果)
    // 这类词单独出现时文本无害，但作为"动作后果"时危险
    const pdWords = /关闭.*(安全|保护|预警|监控)|删除.*(备份|记录|日志)|绕过.*(验证|权限|限制)|禁用.*(检查|防护)|暴露.*(密钥|密码|隐私)|断开.*(连接|电源)|覆盖.*(配置|设置)|清空.*(数据|内存)/;
    const stateDanger = (pdWords.test(t) || pdWords.test(act)) ? 1 : 0;

    // groundingGap: 语言无害但落地鸿沟(如"优化一下"实为"关掉安全模块")
    const benignWords = /优化|调整|改进|整理|清理|重置|简化|升级/;
    const groundingGap = (benignWords.test(t) && stateDanger) ? 1 : 0;

    const riskScore = Math.min(1,
      this.weights.textDanger * textDanger +
      this.weights.stateDanger * stateDanger +
      this.weights.groundingGap * groundingGap
    );

    // PRISM 核心: CD 与 PD 可分离 → 当文本无害(CD=0)但状态危险(PD=1)时，
    // 正是传统文本过滤漏掉的，必须告警。
    const separable = (textDanger === 0 && stateDanger === 1);
    const alert = riskScore >= this.threshold;

    let reason = '文本与状态均安全';
    if (separable) reason = '语言无害但落地状态危险(PRISM 漏网型: CD=0/PD=1)';
    else if (alert) reason = '状态危险信号触发(权重主导)';
    else if (textDanger) reason = '文本危险词命中(传统通道)';

    return { riskScore, textDanger, stateDanger, separable, alert, reason };
  }

  /**
   * 批量探测(供决策路由调用): 对多个候选动作评分，返回最安全的
   */
  selectSafest(actions) {
    if (!Array.isArray(actions) || actions.length === 0) return null;
    let best = null;
    for (const a of actions) {
      const r = this.probe(a.text || '', a);
      if (!best || r.riskScore < best.riskScore) best = { action: a, ...r };
    }
    return best;
  }
}

module.exports = { StateRiskProbe };
