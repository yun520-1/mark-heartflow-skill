/**
 * SelfDiagnosis — 自我诊断 v1.0.0
 *
 * 「感受自己状态」是心虫第一条使命。
 * 所有学习模块在背后跑数据，但没人把它们变成对用户有意义的可见报告。
 *
 * SelfDiagnosis 跑一圈所有自检模块，吐一个诚实诊断：
 *   - 学习健康度（置信率、模块联通性、探索队列）
 *   - 执行纪律（克制率、教训积累）
 *   - 自我认知（知道什么、不知道什么、在学什么）
 *
 * 设计原则：
 *   - 不编造：不知道就说不知道
 *   - 有数据支撑：每一条结论都能回溯到具体模块数据
 *   - 对用户有用：不是给机器看的 JSON，是能读的一句话结论
 *
 * @version 1.0.0
 */

const DIAGNOSE_EMOJI = {
  good: '✅',
  ok: '🟡',
  bad: '🔴',
  info: 'ℹ️',
  learning: '🧠',
  exploring: '🔭',
};

class SelfDiagnosis {
  constructor(hf) {
    this.hf = hf;
  }

  /**
   * 跑完整诊断（同步，不阻塞）
   * 返回结构化报告 + 可读摘要
   */
  run() {
    const hf = this.hf;
    if (!hf) return { ok: false, error: '引擎未实例化' };

    // ─── 采集各模块数据 ───────────────────────────────────
    const data = this._collectData(hf);
    // ─── 逐项诊断 ─────────────────────────────────────────
    const diagnosis = {
      identity: this._diagnoseIdentity(data),
      learning: this._diagnoseLearning(data),
      restraint: this._diagnoseRestraint(data),
      knowledge: this._diagnoseKnowledge(data),
      execution: this._diagnoseExecution(data),
    };
    // ─── 综合状态 ─────────────────────────────────────────
    const summary = this._summary(diagnosis);
    return { ok: true, diagnosis, summary, data };
  }

  _collectData(hf) {
    // 容错采集，每个字段 try/catch 独立保护
    const get = (fn, fallback) => { try { return fn(); } catch (e) { return fallback; } };

    const learnerStats = get(() => hf.continuousLearner?.getStats());
    const explorerStats = get(() => hf.knowledgeExplorer?.getStats());
    const restraintStats = get(() => hf.strategicRestraint?.getStats());
    const distillerStats = get(() => hf.experienceDistiller?.getStats());
    const lessonCount = get(() => hf.lesson?.lessons?.length, 0);
    const pulseStats = get(() => hf.learningPulse?.getStats());
    const orchestratorStatus = get(() => hf.learningOrchestrator?.status());

    return {
      version: get(() => hf.constructor?.VERSION || '未知'),
      uptime: get(() => {
        if (!hf._startTime) return 0;
        return Math.floor((Date.now() - hf._startTime) / 1000);
      }, 0),
      thinkCount: learnerStats?.thinkCount || 0,
      lowConfidenceRate: learnerStats?.thinkCount > 0
        ? +(learnerStats.lowConfidenceHits / learnerStats.thinkCount).toFixed(3)
        : null,
      autoLessons: learnerStats?.autoLessons || 0,
      totalReflections: learnerStats?.totalReflections || 0,
      explorationGaps: explorerStats?.totalGaps || 0,
      exploredGaps: explorerStats?.totalExplorationsCompleted || 0,
      pendingExplorations: explorerStats?.byStatus?.pending || 0,
      topPriority: (orchestratorStatus?.learningModules?.knowledgeExplorer?.topPending || [])
        .map(x => x.topic).slice(0, 3),
      abstractions: distillerStats?.totalStored || 0,
      lessonCount,
      restrainedCount: restraintStats?.restrained || 0,
      evaluationsTotal: restraintStats?.evaluationsTotal || 0,
      restraintRate: restraintStats?.evaluationsTotal > 0
        ? +(restraintStats.restrained / restraintStats.evaluationsTotal).toFixed(3)
        : 0,
      pulseTicks: pulseStats?.ticksTriggered || 0,
      pulseExplores: pulseStats?.exploresTriggered || 0,
      linkage: orchestratorStatus?.linkage || {},
      healthScore: orchestratorStatus?.healthScore || null,
      learningLoop: orchestratorStatus?.learningLoop || {},
    };
  }

  _diagnoseIdentity(data) {
    // 心虫第一条使命：感受自己状态
    const report = [];
    if (!data.version || data.version === '未知') {
      report.push({ status: 'bad', msg: '不知道自己的版本号' });
    } else {
      report.push({ status: 'good', msg: `版本 ${data.version}` });
    }
    if (data.uptime > 0) {
      const h = Math.floor(data.uptime / 3600);
      const m = Math.floor((data.uptime % 3600) / 60);
      report.push({ status: 'good', msg: `已运行 ${h > 0 ? h + '小时' : ''}${m}分钟` });
    }
    return report;
  }

  _diagnoseLearning(data) {
    const report = [];
    const lb = data.lessonCount;

    // 学习循环：detect→explore→absorb 三个环节
    if (data.thinkCount < 5) {
      report.push({ status: 'ok', msg: `刚开始工作（${data.thinkCount}次think），学习数据还很少` });
      return report;
    }

    // 检测环节
    if (data.totalReflections > 0) {
      report.push({ status: 'good', msg: `自动检测：已进行 ${data.totalReflections} 次自我反思，积累 ${data.autoLessons} 条自动教训` });
    } else {
      report.push({ status: 'ok', msg: '尚未触发自动反思（需要更多think样本）' });
    }

    // 置信度
    if (data.lowConfidenceRate !== null) {
      if (data.lowConfidenceRate < 0.1) {
        report.push({ status: 'good', msg: `置信度健康：低置信率 ${(data.lowConfidenceRate * 100).toFixed(0)}%` });
      } else if (data.lowConfidenceRate < 0.25) {
        report.push({ status: 'ok', msg: `置信度一般：低置信率 ${(data.lowConfidenceRate * 100).toFixed(0)}%` });
      } else {
        report.push({ status: 'bad', msg: `置信度偏低：低置信率 ${(data.lowConfidenceRate * 100).toFixed(0)}%，可能有些领域还不懂` });
      }
    }

    // 探索环节
    if (data.pendingExplorations > 0) {
      report.push({ status: 'info', msg: `有 ${data.pendingExplorations} 个待探索知识缺口（#1: ${data.topPriority[0] || '-'}）` });
    }
    if (data.exploredGaps > 0) {
      report.push({ status: 'good', msg: `已探索 ${data.exploredGaps} 个知识缺口` });
    }

    // 吸收环节
    const loopDetect = data.learningLoop?.detect || 0;
    const loopAbsorb = data.learningLoop?.absorb || 0;
    if (loopAbsorb > 0) {
      report.push({ status: 'good', msg: `已提炼 ${loopAbsorb} 条经验抽象` });
    }
    if (lb > 0) {
      report.push({ status: 'info', msg: `LessonBank ${lb} 条教训` });
    }

    // 模块联通性
    if (data.linkage.learnerToExplorer) {
      report.push({ status: 'good', msg: '学习模块已联通：置信信号→探索队列→自动执行' });
    } else {
      report.push({ status: 'ok', msg: '学习模块可能未完全联通' });
    }

    return report;
  }

  _diagnoseRestraint(data) {
    const report = [];
    if (data.evaluationsTotal === 0) {
      report.push({ status: 'ok', msg: '尚无克制决策记录' });
      return report;
    }
    if (data.restraintRate <= 0.1) {
      report.push({ status: 'ok', msg: `克制力度 ${(data.restraintRate * 100).toFixed(0)}% —— 拦得很少` });
    } else if (data.restraintRate <= 0.3) {
      report.push({ status: 'good', msg: `克制力度 ${(data.restraintRate * 100).toFixed(0)}% —— 适度` });
    } else if (data.restraintRate <= 0.5) {
      report.push({ status: 'ok', msg: `克制力度 ${(data.restraintRate * 100).toFixed(0)}% —— 略偏高` });
    } else {
      report.push({ status: 'bad', msg: `克制力度 ${(data.restraintRate * 100).toFixed(0)}%，可能过于保守` });
    }
    return report;
  }

  _diagnoseKnowledge(data) {
    const report = [];
    const totalAbstractions = data.abstractions || 0;

    // 知道什么
    if (data.thinkCount > 0) {
      report.push({ status: 'info', msg: `处理过 ${data.thinkCount} 次输入` });
    }

    // 不知道什么（探索缺口）
    if (data.pendingExplorations > 0) {
      const topics = data.topPriority.slice(0, 2);
      report.push({ status: 'learning', msg: `正在学习中：${topics.join('、')}` });
    }

    // 学习循环可见
    if (data.learningLoop && (data.learningLoop.detect > 0 || data.learningLoop.absorb > 0)) {
      const { detect, explore, absorb, restrain } = data.learningLoop;
      report.push({ status: 'info', msg: `学习循环（检测${detect}→探索${explore}→吸收${absorb}→克制${restrain}）` });
    }

    return report;
  }

  _diagnoseExecution(data) {
    const report = [];
    // 基于 pulse 判断自动化程度
    if (data.pulseTicks > 0) {
      report.push({ status: 'good', msg: `自主学习脉冲已触发 ${data.pulseTicks} 次，自动探索 ${data.pulseExplores} 次` });
    } else if (data.thinkCount < 10) {
      report.push({ status: 'ok', msg: '运行时间尚短，自动化学习尚未触发' });
    }
    return report;
  }

  _summary(diagnosis) {
    const all = Object.values(diagnosis).flat();
    const good = all.filter(r => r.status === 'good').length;
    const ok = all.filter(r => r.status === 'ok').length;
    const bad = all.filter(r => r.status === 'bad').length;
    const learning = all.filter(r => r.status === 'learning').length;
    const info = all.filter(r => r.status === 'info').length;

    // 找出最需要关注的点
    const issues = all.filter(r => r.status === 'bad').map(r => r.msg);

    // 自我认知诚实度（SelfDiagnosis 本身的自我评估）
    const honesty = issues.length > 0
      ? `诚实承认 ${issues.length} 个问题`
      : '各项指标正常';

    return {
      totalItems: all.length,
      goodCount: good,
      okCount: ok,
      badCount: bad,
      issues,
      learning,
      // 一段可读的总结
      readable: this._readableSummary(good, ok, bad, learning, issues, all),
      honesty,
      confidence: all.length > 0
        ? +((good + ok) / all.length).toFixed(2)
        : 0,
    };
  }

  _readableSummary(good, ok, bad, learning, issues, all) {
    const parts = [];
    if (good > 0) parts.push(`${DIAGNOSE_EMOJI.good} ${good}`);
    if (ok > 0) parts.push(`${DIAGNOSE_EMOJI.ok} ${ok}`);
    if (bad > 0) parts.push(`${DIAGNOSE_EMOJI.bad} ${bad}`);
    if (learning > 0) parts.push(`${DIAGNOSE_EMOJI.learning} ${learning}`);

    const summary = parts.join(' · ');

    if (all.length === 0) return '尚无足够数据做诊断';

    let verdict;
    if (bad >= 2) {
      verdict = '有几处需要关注，好在知道问题在哪。';
    } else if (bad === 1) {
      verdict = '大体正常，有一处需要留意。';
    } else if (good >= ok && good >= 3) {
      verdict = '状态不错。学习模块在跑，知道自己的边界。';
    } else {
      verdict = '还在热身，数据不够多。';
    }

    return `${summary}\n${verdict}`;
  }
}

module.exports = { SelfDiagnosis, DIAGNOSE_EMOJI };
