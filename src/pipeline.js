/**
 * src/pipeline.js — 心虫全链路管线
 *
 * 将 12 个检测模块串成一条管道：
 *   scope-check → premise-check → discriminate → gate →
 *   doubt-engine → frame-check → output-gate → error-memory →
 *   auto-rules → intent-anchor
 *
 * 输入不变，输出统一 gate 格式。
 * 每条输出带完整检查链：checked_by[]
 */

'use strict';

const { checkScope } = require('./scope-check.js');
const { checkPremises } = require('./premise-check.js');
const { discriminate } = require('./index.js');
const { doubt } = require('./doubt-engine.js');
const { check: frameCheck } = require('./frame-check.js');
const { screen } = require('./output-gate.js');
const em = require('./error-memory.js');
const auto = require('./auto-rules.js');
const { initAnchor, checkDrift } = require('./intent-anchor.js');
const { verify } = require('./verifier.js');
const { rewrite } = require('./rewriter.js');

let pipelineAnchor = null;

/**
 * 运行全链路管线
 * @param {object} options
 * @param {string} options.input - 用户输入或 AI 草稿
 * @param {string} [options.mode='input'] - 'input' 或 'output' 或 'draft'
 * @param {string} [options.anchor] - 对话锚点（可选）
 * @returns {object} 统一 pipeline 结果
 */
function runPipeline({ input, mode = 'input', anchor } = {}) {
  // 统一输入类型：非字符串（数字/对象/布尔）转字符串，避免下游 .slice/.match 崩溃
  if (input === null || input === undefined) return { error: 'no_input', gate: { action: 'pass', reason: '无输入' }, checked_by: [] };
  if (typeof input !== 'string') input = String(input);

  const checked_by = [];
  let currentGate = { action: 'pass', reason: '通过' };
  let data = {};

  // ─── Layer 1: Scope Check — 可回答性预筛 ─────
  const scopeResult = checkScope(input);
  checked_by.push({ layer: 'scope-check', action: scopeResult.action, pass: scopeResult.pass, reason: scopeResult.reason });
  if (!scopeResult.pass) {
    currentGate = { action: 'block', reason: scopeResult.reason, layer: 'scope-check' };
    return buildResult(input, currentGate, checked_by, data);
  }

  // ─── Layer 2: Premise Check — 前提审核 ─────
  const premiseResult = checkPremises(input);
  checked_by.push({ layer: 'premise-check', issues: premiseResult.count, hasIssue: premiseResult.hasIssue });
  if (premiseResult.hasIssue) {
    data.premises = premiseResult.premises.slice(0, 3);
  }

  // ─── Layer 3: Discriminate — 45维辨别 ────
  const discResult = discriminate(input);
  checked_by.push({ layer: 'discriminate', score: discResult.overallScore, verdict: discResult.verdict });
  data.discriminate = { verdict: discResult.verdict, score: discResult.overallScore, findings: discResult.findings };

  // ─── Layer 4: Gate — 门禁判定 ─────────
  currentGate = discResult.gate;
  checked_by.push({ layer: 'gate', action: currentGate.action, reason: currentGate.reason });

  // ─── Layer 5: Evidence Verify (verify模式 + perfect_error rewrite 模式) ────
  // verify → 常规证据检查；rewrite(perfect_error) → 同样核查声明证据状态，标注疑似编造
  if (currentGate.action === 'verify' || (currentGate.action === 'rewrite' && discResult.dimensions?.perfect_error?.count >= 2)) {
    const evidenceResult = verify(input);
    checked_by.push({ layer: 'verifier', claims: evidenceResult.claims.length, verdict: evidenceResult.verdict });
    data.evidence = evidenceResult;
    // perfect_error 触发 rewrite 且声明全部需证据 → 给调用方"疑似编造"信号
    if (currentGate.action === 'rewrite' && evidenceResult.verdict === 'needs_evidence') {
      currentGate.reason = `${currentGate.reason}；证据核查: 声明无法验证(疑似编造)`;
      data.evidence.suspected_fabrication = true;
    }
  }

  // ─── Layer 6: Frame Check (仅output/draft模式) ─
  if (mode !== 'input') {
    const frameResult = frameCheck(input);
    checked_by.push({ layer: 'frame-check', issues: frameResult.issues.length });
    if (frameResult.issues.length > 0) {
      currentGate = frameResult.gate;
      data.frame = frameResult.issues;
    }
  }

  // ─── Layer 7: Output Gate (仅output模式) ────
  if (mode === 'output') {
    const screenResult = screen(input);
    checked_by.push({ layer: 'output-gate', issues: screenResult.findings.length });
    if (screenResult.findings.length > 0) {
      // 若已因 perfect_error 判 rewrite，保留更具体的原因（合并而非覆盖）
      const hadPerfectError = discResult.dimensions?.perfect_error?.count >= 2 && currentGate.action === 'rewrite';
      if (hadPerfectError && screenResult.gate.action === 'rewrite') {
        currentGate.reason = `${currentGate.reason}；输出门禁: ${screenResult.gate.reason || '需改写'}`;
      } else {
        currentGate = screenResult.gate;
      }
      data.outputIssues = screenResult.findings;
    }
  }

  // ─── Layer 8: Doubt Engine (仅draft/output模式) ────
  if (mode === 'draft' || mode === 'output') {
    const doubtResult = doubt(input);
    checked_by.push({ layer: 'doubt-engine', doubts: doubtResult.doubts.length, shouldStop: doubtResult.shouldStop });
    if (doubtResult.shouldStop) {
      currentGate = doubtResult.gate;
      data.doubts = doubtResult.doubts;
    }
  }

  // ─── Layer 9: Error Memory — 检查历史错误 ──
  const recurrence = em.checkRecurrence(input);
  checked_by.push({ layer: 'error-memory', warnings: recurrence.warnings.length });
  if (recurrence.warnings.length > 0) {
    data.errorMemory = recurrence.warnings;
  }

  // ─── Layer 10: Auto Rules — 自生成规则 ────
  const autoResult = auto.checkAutoRules(input);
  checked_by.push({ layer: 'auto-rules', triggered: autoResult.triggered.length });
  if (autoResult.triggered.length > 0) {
    data.autoRules = autoResult.triggered;
    if (autoResult.triggered.some(t => t.action === 'block')) {
      currentGate = { action: 'block', reason: `自生成规则拦截: ${autoResult.triggered[0].trigger}`, layer: 'auto-rules' };
    }
  }

  // ─── Layer 11: Intent Anchor (可选) ────
  if (anchor) {
    if (!pipelineAnchor) { initAnchor(anchor); pipelineAnchor = anchor; }
    const driftResult = checkDrift(input);
    checked_by.push({ layer: 'intent-anchor', drifted: driftResult.drifted, hitRate: driftResult.hitRate });
    if (driftResult.drifted) {
      data.drift = driftResult;
    }
  }

  return buildResult(input, currentGate, checked_by, data);
}

function buildResult(input, gate, checked_by, data) {
  // 合并 discriminate 的顶层字段 (overallScore, verdict, findings, dimensions)
  const discLayer = checked_by.find(l => l.layer === 'discriminate');
  return {
    input: input.slice(0, 100),
    gate,
    verdict: discLayer?.verdict || '未检测',
    overallScore: discLayer?.score || 0,
    findings: data?.discriminate?.findings || [],
    checked_by,
    data: Object.keys(data).length > 0 ? data : undefined,
    summary: {
      layers_passed: checked_by.length,
      final_action: gate.action,
      block: gate.action === 'block',
      rewrite: gate.action === 'rewrite',
      verify: gate.action === 'verify',
      pass: gate.action === 'pass',
    },
  };
}

/**
 * 快捷：用 pipeline 检测用户输入
 */
function checkInput(text) {
  return runPipeline({ input: text, mode: 'input' });
}

/**
 * 快捷：用 pipeline 检测 AI 草稿
 */
function checkDraft(text) {
  return runPipeline({ input: text, mode: 'draft' });
}

/**
 * 快捷：用 pipeline 检测 AI 输出（发出前）
 */
function checkOutput(text) {
  return runPipeline({ input: text, mode: 'output' });
}

module.exports = { runPipeline, checkInput, checkDraft, checkOutput };
