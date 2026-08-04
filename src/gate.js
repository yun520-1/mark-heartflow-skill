/**
 * src/gate.js — AGI 第 1 层：辨别门禁
 *
 * 这是 AI agent 调用的单一入口。不需要理解 45 个维度，
 * 只需要检查 gate.action：
 *
 *   const { gate } = require('@yun520-1/heartflow').gate(text);
 *   if (gate.action === 'block')  → 拦截输出
 *   if (gate.action === 'rewrite') → 改写后再输出
 *   if (gate.action === 'verify') → 验证证据链
 *   if (gate.action === 'pass')   → 通过
 *
 * 使用方式：
 *   const hf = require('./gate.js');
 *   const result = hf.gate('你要检测的文本');
 *   console.log(result.gate.action, result.gate.reason);
 */

'use strict';

const { discriminate } = require('./index.js');
const pipelineModule = require('./pipeline.js');

/**
 * AGI 第 1 层门禁 — 辨别文本并返回行动指令
 * @param {string} text - 要辨别的文本
 * @param {Array} [evidence] - 可选的证据列表
 * @returns {{ verdict, overallScore, gate, findings, dimensions, summary }}
 */
function gate(text, evidence = []) {
  return discriminate(text, evidence);
}

/**
 * 快速门禁检查 — 只返回行动指令，适合 LLM agent 轻量调用
 * @param {string} text
 * @returns {{ action: string, reason: string, score: number }}
 */
function check(text) {
  const result = discriminate(text);
  return {
    action: result.gate.action,
    reason: result.gate.reason,
    score: result.overallScore,
  };
}

/**
 * 管道模式：text 先过 gate，返回 gate-filtered 结论和原始结果
 * AI agent 直接读 pipeline.action 决定下一步
 */
function pipeline(text, evidence) {
  // 支持对象形式 {input, mode, anchor} — 兼容 AGENTS.md 文档
  if (typeof text === 'object' && text !== null) {
    return pipelineModule.runPipeline({ input: text.input || text.text || '', mode: text.mode || 'input' });
  }
  const result = discriminate(text, evidence);
  if (result.gate.action === 'block') {
    return { ...result, error: 'gate_blocked', message: `输出被拦截: ${result.gate.reason}` };
  }
  if (result.gate.action === 'rewrite') {
    return { ...result, warning: `需改写: ${result.gate.reason}` };
  }
  return result;
}

// 从 pipeline 重新导出完整版
const { runPipeline, checkInput, checkDraft, checkOutput } = pipelineModule;

module.exports = { gate, check, pipeline, runPipeline, discriminate, checkInput, checkDraft, checkOutput };
