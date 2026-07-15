/**

 * HeartFlow — ReportGenerator（最小可用）
 *
 * 消除错误源：此前 cli.js / mcp-server-http.js / src/mcp-server.js 均
 * require('./src/report/report-generator.js') 的 ReportGenerator，但文件
 * 不存在，导致报告生成分支恒返回 { error: '报告生成失败' }。
 *
 * 本模块不引入新功能，仅补齐缺失的契约：
 *   - generate(input) 返回 { report }
 *   - report 含 cli.js 消费的三段：judgment / localization / suggestion
 *   - 兼容两种入参：
 *       (a) 完整 result 对象（cli.js 传 result）
 *       (b) thoughtChain 对象（mcp 传 thoughtChain）
 *   - 字段缺失时优雅降级，绝不抛异常（调用方已 try/catch，这里再兜底一次）
 *
 * 设计原则（项目 ROADMAP）：消除错误源，不建管理系统；不增加外部依赖。
 */

'use strict';

/**
 * 从输入中提取 thoughtChain 与原始 result。
 * 兼容 (a) result 包装 (b) 裸 thoughtChain 两种形态。
 */
function _extract(result) {
  if (!result) return { thoughtChain: null, raw: null };
  // 形态 (a)：完整 result，内部带 thoughtChain
  if (result.thoughtChain !== undefined) {
    return { thoughtChain: result.thoughtChain || null, raw: result };
  }
  // 形态 (b)：裸 thoughtChain（可能是 {stages, ...} 或数组）
  if (result.stages !== undefined || Array.isArray(result)) {
    return { thoughtChain: result, raw: { thoughtChain: result } };
  }
  // 其他：当作空
  return { thoughtChain: null, raw: result };
}

/**
 * 从 thoughtChain 抽取可读文本。thoughtChain 形态可能是：
 *   - { stages: [{name, output, conclusion, ...}, ...] }
 *   - [ {name, output, ...}, ... ]
 *   - { conclusion, text, output, ... }（单对象）
 */
function _extractConclusion(thoughtChain) {
  if (!thoughtChain) return '';
  if (typeof thoughtChain === 'string') return thoughtChain;
  if (Array.isArray(thoughtChain)) {
    return thoughtChain
      .map(s => _stageText(s))
      .filter(Boolean)
      .join('\n');
  }
  if (thoughtChain.stages && Array.isArray(thoughtChain.stages)) {
    return thoughtChain.stages
      .map(s => _stageText(s))
      .filter(Boolean)
      .join('\n');
  }
  return _stageText(thoughtChain);
}

function _stageText(stage) {
  if (!stage) return '';
  if (typeof stage === 'string') return stage;
  const name = stage.name ? `[${stage.name}] ` : '';
  const body =
    stage.conclusion ||
    stage.text ||
    stage.output ||
    (typeof stage.output === 'object' ? JSON.stringify(stage.output) : '');
  return body ? `${name}${body}` : '';
}

class ReportGenerator {
  /**
   * @param {object} input - result 或 thoughtChain
   * @returns {{ report: object }}
   */
  generate(input) {
    try {
      const { thoughtChain, raw } = _extract(input);
      const conclusion = _extractConclusion(thoughtChain);

      const output = (raw && raw.output) || (thoughtChain && thoughtChain.output) || {};
      const finalConclusion =
        conclusion ||
        output.conclusion ||
        output.text ||
        (raw && raw.conclusion) ||
        '(无可读结论)';

      const report = {
        judgment: {
          text: finalConclusion.slice(0, 600),
          explanation: thoughtChain ? '基于 thoughtChain 生成' : '未捕获思维链',
        },
        localization: {
          coreIssue: _inferCoreIssue(finalConclusion),
          domain: (raw && raw.type) || (thoughtChain && thoughtChain.type) || 'general',
          severity: _inferSeverity(raw, thoughtChain),
          details: _extractDetails(thoughtChain),
        },
        suggestion: {
          steps: _inferSteps(finalConclusion),
        },
      };

      return { report };
    } catch (e) {
      // 终极兜底：绝不抛异常，避免调用方再次落入"报告生成失败"
      return {
        report: {
          judgment: { text: '(报告生成降级)', explanation: String(e && e.message || e) },
          localization: { coreIssue: '未知', domain: 'general', severity: 'unknown', details: [] },
          suggestion: { steps: [] },
        },
      };
    }
  }
}

function _inferCoreIssue(text) {
  if (!text) return '未知';
  if (text.length <= 120) return text;
  return text.slice(0, 120) + '…';
}

function _inferSeverity(raw, thoughtChain) {
  const c = raw && typeof raw.confidence === 'number' ? raw.confidence : null;
  const tc = thoughtChain && typeof thoughtChain.confidence === 'number' ? thoughtChain.confidence : null;
  const conf = c !== null ? c : tc;
  if (conf === null) return 'unknown';
  if (conf >= 0.8) return 'low';
  if (conf >= 0.5) return 'medium';
  return 'high';
}

function _extractDetails(thoughtChain) {
  if (!thoughtChain) return [];
  const stages = Array.isArray(thoughtChain)
    ? thoughtChain
    : thoughtChain.stages && Array.isArray(thoughtChain.stages)
      ? thoughtChain.stages
      : null;
  if (!stages) return [];
  return stages
    .map(s => (s && (s.name || s.conclusion || s.text)) || null)
    .filter(Boolean)
    .slice(0, 8)
    .map(s => (typeof s === 'string' ? s : s.name || ''))
    .filter(Boolean);
}

function _inferSteps(text) {
  if (!text) return [];
  // 简单启发：按换行/句号切分，取非空短句作为建议步骤
  const lines = text
    .split(/[\n。.!?！？]/)
    .map(s => s.trim())
    .filter(s => s.length >= 4 && s.length <= 80);
  return lines.slice(0, 5);
}


module.exports = { ReportGenerator };
