'use strict';
/**
 * MetaCalibration — 元认知诚实外显层（新能力 v6.1.7）
 *
 * 论文基础：
 *  - Google ICML 2026《Hallucinations Undermine Trust; Metacognition is a Way Forward》
 *    核心：与其死磕"让AI全知全能"，不如教它学会说"我不确定"。元认知是破幻觉的全新解法。
 *  - 《The Two-Process Theory of Machine Self-Report》(arXiv)
 *    机器自我报告双过程：persona installation (B维) 与 attribution gating (A维)。
 *    本层只做"诚实标注"，不写 persona 内在生命感，符合心虫"不编造第一人称体验"边界。
 *
 * 职责：把 ConfidenceCalibrator 的内部校准结果，转成**调用方可读的诚实声明**：
 *  - 哪些结论置信度低
 *  - 为什么低（证据缺口 / 推断跨层 / 假设未证）
 *  - 明确说"我不确定"，不强行结论
 *
 * 设计原则（对齐用户 2026-07-23）：
 *  1. 缺事实就说不知道——不编造
 *  2. 反自欺——标注自己的盲区，而非假装全知
 *  3. 不站队——只标注确定性缺口，不做立场判断
 */

class MetaCalibration {
  constructor(opts = {}) {
    this.name = 'MetaCalibration';
    this.version = '6.1.7';
    // 诚实阈值：校准后置信度低于此值，显式声明不确定
    this.threshold = opts.threshold || 0.5;
  }

  /**
   * @param {object} ctx
   *   - calibration: think() 返回的 calibration 对象（含 calibratedConfidence / needsUncertaintyMarker / uncertaintyPhrase / subsystemCalibration）
   *   - topic: 议题文本（用于生成针对性声明）
   *   - blindSpot: 可选，盲点分析结果
   * @returns {object} { honest, level, gaps:[{what,why}], statement }
   */
  annotate(ctx = {}) {
    const cal = ctx.calibration || {};
    const raw = typeof cal.calibratedConfidence === 'number' ? cal.calibratedConfidence
      : (typeof cal.originalConfidence === 'number' ? cal.originalConfidence : 0.3);
    const needsMark = cal.needsUncertaintyMarker === true;
    const sub = cal.subsystemCalibration || null;

    const gaps = [];

    // 1. 总置信度低
    if (raw < this.threshold) {
      gaps.push({
        what: '整体结论',
        why: `校准后置信度 ${raw.toFixed(2)} 低于诚实阈值 ${this.threshold}，证据不足以强结论`,
      });
    }

    // 2. 子系统校准里被下调的项（证据缺口/一致性低）
    if (sub && typeof sub === 'object') {
      for (const k of Object.keys(sub)) {
        const s = sub[k];
        if (s && s.adjusted === true && typeof s.confidence === 'object' && s.confidence.calibrated < 0.5) {
          gaps.push({
            what: `子系统[${k}]`,
            why: `一致性/证据覆盖弱（校准置信 ${s.confidence.calibrated.toFixed(2)}），该部分结论易偏`,
          });
        }
      }
    }

    // 3. 显式不确定标记
    if (needsMark && gaps.length === 0) {
      gaps.push({
        what: '关键论断',
        why: cal.uncertaintyPhrase || '缺少关键信息，无法确认',
      });
    }

    const honest = gaps.length > 0;
    const level = raw >= 0.8 ? 'high' : raw >= this.threshold ? 'medium' : 'low';

    // 生成可读声明（不编造具体数据，只标确定性缺口）
    let statement = null;
    if (honest) {
      const parts = gaps.map(g => `「${g.what}」${g.why}`);
      statement = `我对此议题的置信度为 ${raw.toFixed(2)}，低于可靠阈值，故先说明不确定性：${parts.join('；')}。以上为结构化推演，非事实定论；具体数据需另查核实。`;
    }

    return {
      honest,
      level,
      calibratedConfidence: raw,
      gaps,
      statement,
      // 不站队、不写 persona：仅诚实标注
      note: 'MetaCalibration 只标注确定性缺口，不替代事实核查，不生成第一人称体验',
    };
  }
}

module.exports = MetaCalibration;
