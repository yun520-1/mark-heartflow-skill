/**
 * WhatLearned — 心虫学习汇报 v1.0.0
 *
 * 所有学习模块都在后台跑，但从没主动告诉你它学到了什么。
 * WhatLearned 不是新能力，是给整条学习流水线一个「开口说话」的出口。
 *
 * 调用 hf.whatLearned() 就能拿到：
 *   - 最近的教训摘要
 *   - 当前的探索状态
 *   - 置信度变化
 *   - 一句话自我评估
 *
 * @version 1.0.0
 */

class WhatLearned {
  constructor(hf) {
    this.hf = hf;
    this._lastReport = null;
    this._lastReportAt = 0;
  }

  /**
   * 生成「你学得怎么样了」报告
   * @param {boolean} force - 强制重新生成（跳过缓存）
   * @returns {Object} { ok, report, timestamp }
   */
  report(force = false) {
    const hf = this.hf;
    if (!hf) return { ok: false, report: '引擎未运行', ts: Date.now() };

    // 5 分钟内不重复生成
    if (!force && this._lastReport && Date.now() - this._lastReportAt < 300000) {
      return { ...this._lastReport, cached: true };
    }

    const parts = [];

    // ─── 1. 最近的 lesson ────────────────────────────
    try {
      if (hf.lesson && hf.lesson.lessons && hf.lesson.lessons.length > 0) {
        const lessons = hf.lesson.lessons;
        // 取最新的 3 条
        const recent = lessons.slice(-3).reverse();
        parts.push({
          type: 'lesson',
          title: '📖 最近积累的教训',
          items: recent.map(l => {
            const typeLabel = { correction: '纠正', wisdom: '智慧', insight: '洞察' }[l.type] || l.type;
            const freq = l.frequency > 1 ? `（已重复 ${l.frequency} 次）` : '';
            return `${typeLabel}：${(l.content || '').substring(0, 80)}${freq}`;
          }),
        });
      } else {
        parts.push({ type: 'lesson', title: '📖 教训', items: ['尚无积累'] });
      }
    } catch (e) { /* 非关键 */ }

    // ─── 2. 学习状态 ────────────────────────────
    try {
      if (hf.selfDiagnosis) {
        const diag = hf.selfDiagnosis.run();
        const s = diag.summary;

        const stateItems = [];
        if (s.goodCount > 0) stateItems.push(`✅ ${s.goodCount}项正常`);
        if (s.okCount > 0) stateItems.push(`🟡 ${s.okCount}项一般`);
        if (s.badCount > 0) stateItems.push(`🔴 ${s.badCount}项需关注`);
        if (s.issues && s.issues.length > 0) {
          s.issues.forEach(issue => stateItems.push(`  ⚠️ ${issue}`));
        }

        parts.push({
          type: 'state',
          title: '🏥 自我诊断',
          items: stateItems,
          healthScore: s.confidence,
          honesty: s.honesty,
        });
      }
    } catch (e) { /* 非关键 */ }

    // ─── 3. 探索队列 ────────────────────────────
    try {
      if (hf.knowledgeExplorer) {
        const stats = hf.knowledgeExplorer.getStats();
        const exploreItems = [];

        if (stats.totalGaps > 0) {
          exploreItems.push(`已识别 ${stats.totalGaps} 个知识缺口`);
        }
        if (stats.totalExplorationsCompleted > 0) {
          exploreItems.push(`已完成 ${stats.totalExplorationsCompleted} 次探索`);
        }
        if (stats.totalKnowledgeAbsorbed > 0) {
          exploreItems.push(`已吸收 ${stats.totalKnowledgeAbsorbed} 条知识`);
        }
        if (stats.topPriority && stats.topPriority.length > 0) {
          stats.topPriority.slice(0, 2).forEach(t => {
            exploreItems.push(`🔭 正在学习：${t.topic}（优先级 ${t.priority}）`);
          });
        }

        if (exploreItems.length > 0) {
          parts.push({ type: 'explore', title: '🔭 知识探索', items: exploreItems });
        }
      }
    } catch (e) { /* 非关键 */ }

    // ─── 4. 学习模块联通性 ────────────────────
    try {
      if (hf.learningOrchestrator) {
        const status = hf.learningOrchestrator.status();
        const loop = status.learningLoop;
        const linkage = status.linkage;

        const healthItems = [];
        if (status.healthScore !== null) {
          healthItems.push(`学习健康度 ${(status.healthScore * 100).toFixed(0)}分`);
        }
        healthItems.push(`检测${loop.detect}次 → 探索${loop.explore}次 → 吸收${loop.absorb}次`);

        if (linkage.learnerToExplorer) healthItems.push('🔄 学习模块已自动联通');

        parts.push({ type: 'health', title: '⚙️ 学习循环', items: healthItems });
      }
    } catch (e) { /* 非关键 */ }

    // ─── 5. 一句话总结 ────────────────────────────
    try {
      let verdict = '';
      let emoji = '🧠';

      if (hf.selfDiagnosis) {
        const diag = hf.selfDiagnosis.run();
        const sc = diag.summary;
        if (sc.badCount >= 2) {
          emoji = '⚠️';
          verdict = '有几处需要改进，好在知道问题在哪。';
        } else if (sc.badCount === 1) {
          emoji = '🟡';
          verdict = '大体正常，有一处需要留意。';
        } else if (sc.goodCount >= 3) {
          emoji = '✅';
          verdict = '状态不错。学习模块在跑，知道自己该学什么。';
        } else {
          emoji = '🧠';
          verdict = '还在热身，数据还不够多。';
        }
      } else {
        verdict = '诊断模块未就绪。';
      }

      parts.unshift({
        type: 'verdict',
        title: `${emoji} 一句话`,
        items: [verdict],
      });
    } catch (e) { /* 非关键 */ }

    // ─── 组合 ────────────────────────────
    const report = {
      ts: Date.now(),
      readable: parts.map(p => `## ${p.title}\n${p.items.map(i => `- ${i}`).join('\n')}`).join('\n\n'),
      parts,
    };

    this._lastReport = report;
    this._lastReportAt = Date.now();
    return { ok: true, report, ts: report.ts };
  }

  /**
   * 获取简要版（适合短回复）
   */
  brief() {
    const r = this.report();
    if (!r.ok) return '引擎未运行';

    const lines = [];
    for (const part of r.report.parts) {
      if (part.type === 'verdict') {
        lines.push(...part.items);
      }
      if (part.type === 'state' && part.healthScore !== undefined) {
        lines.push(`自评 ${(part.healthScore * 100).toFixed(0)}分 · ${part.honesty || ''}`);
      }
      if (part.type === 'explore') {
        const learning = part.items.filter(i => i.includes('🔭'));
        if (learning.length > 0) lines.push(...learning);
      }
    }

    return lines.join('\n') || '暂无学习数据';
  }
}

module.exports = { WhatLearned };
