#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// HeartFlow v7 — AGI Error Memory & Decision Audit Layer
//
// 不是大模型，不是回答引擎，是 AGI 需要的"不遗忘"组件。
//
// 5 个面向 AGI 的能力：
//   1. 错误记忆 (Error Memory)   → 跨会话记录错误，同类错误不重复
//   2. 决策验证 (Verify)         → 审计决策链的证据/矛盾/风险/完整度
//   3. 使命对齐 (Alignment)      → 输出是否偏离初始身份 (3 态返回)
//   4. 身份检测 (Identity)       → 身份一致性随时间的漂移追踪
//   5. 诚实自诊 (Diagnose)       → 引擎自己的状态 + 诚实报告问题
//
// 设计原则：
//   - 不生成文本，不冒充 LLM
//   - 每个能力独立可调用（通过 MCP 或直接 require）
//   - 持久化状态跨会话保持
//   - 审计可追溯
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

const path = require('path');
const fs = require('fs');

const PKG_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(PKG_ROOT, 'data');

// ─── 5 个核心引擎 ─────────────────────────────────────────────────

class ErrorMemory {
  constructor(opts = {}) {
    this.rl = null;
    this._path = opts.path || path.join(DATA_DIR, 'error-memory.json');
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this._path)) {
        const data = JSON.parse(fs.readFileSync(this._path, 'utf8'));
        this.rl = data;
      }
    } catch (_) {}
  }

  _save() { /* best-effort */ }

  /** 记录一次错误 (problem, action, outcome) */
  store(problem, action, outcome) {
    this._load();
    this.rl = this.rl || { cycles: [], errors: 0 };
    this.rl.cycles.push({ problem, action, outcome, ts: Date.now() });
    this.rl.errors++;
    if (this.rl.cycles.length > 200) this.rl.cycles = this.rl.cycles.slice(-100);
    try { fs.writeFileSync(this._path, JSON.stringify(this.rl)); } catch (_) {}
    return { stored: true, totalErrors: this.rl.errors };
  }

  /** 检索与问题相关的历史错误 */
  query(problem, limit = 5) {
    this._load();
    if (!this.rl || !this.rl.cycles) return { results: [] };
    const kw = (problem || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (kw.length === 0) return { results: this.rl.cycles.slice(-limit).reverse() };
    const scored = this.rl.cycles.map(c => {
      const text = `${c.problem || ''} ${c.action || ''} ${c.outcome || ''}`.toLowerCase();
      const score = kw.filter(w => text.includes(w)).length / kw.length;
      return { ...c, score };
    }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
    return { results: scored.slice(0, limit) };
  }

  getStats() {
    this._load();
    return {
      errors: this.rl?.errors || 0,
      cycles: this.rl?.cycles?.length || 0,
    };
  }
}

class DecisionVerifier {
  constructor() {
    this._verifier = null;
  }

  _ensure() {
    if (!this._verifier) {
      try { this._verifier = new (require('../core/decision-verifier.js').DecisionVerifier)(); } catch (_) {}
    }
    return this._verifier;
  }

  verify(decision, evidence, alternatives, confidence) {
    const dv = this._ensure();
    if (!dv) return { score: 0, issues: [{ message: 'verifier not available' }] };
    return dv.verify({ decision, evidence, alternatives, confidence: confidence || 0.5 });
  }
}

class AlignmentChecker {
  constructor() {
    this._sr = null;
  }

  _ensure() {
    if (!this._sr) {
      try { this._sr = new (require('../core/strategic-restraint.js')?.StrategicRestraint?.())(); } catch (_) {}
    }
    return this._sr;
  }

  check(output, mission) {
    const sr = this._ensure();
    if (!sr || typeof sr.checkMission !== 'function') return { status: 'unchecked' };
    try { return sr.checkMission(output, mission); } catch (_) { return { status: 'error' }; }
  }
}

class IdentityChecker {
  constructor() {
    this._sdd = null;
  }

  _ensure() {
    if (!this._sdd) {
      try {
        const SDD = require('../cortex/sustained-drift-detector.js');
        this._sdd = new SDD.SustainedDriftDetector();
      } catch (_) {}
    }
    return this._sdd;
  }

  check() {
    const sdd = this._ensure();
    if (!sdd) return { driftDetected: false };
    try { return sdd.detectDrift(); } catch (_) { return { driftDetected: false }; }
  }

  recordState(state) {
    const sdd = this._ensure();
    if (!sdd) return;
    try { sdd.recordState(state); } catch (_) {}
  }
}

class Diagnostician {
  constructor() {
    this._sd = null;
  }

  _ensure() {
    if (!this._sd) {
      try { this._sd = new (require('../core/self-diagnosis.js')?.SelfDiagnosis?.({}))(); } catch (_) {}
    }
    return this._sd;
  }

  run() {
    const sd = this._ensure();
    if (!sd) return { ok: false, error: 'diagnostician not available' };
    try { return sd.run(); } catch (_) { return { ok: false, error: 'diagnosis failed' }; }
  }
}

// ─── 引擎容器 ──────────────────────────────────────────────────────

class HeartFlow {
  constructor(opts = {}) {
    this.version = '7.0.0';
    this.dataDir = opts.dataDir || DATA_DIR;
    this.silent = opts.silent !== false;

    this.errorMemory = new ErrorMemory({ path: path.join(this.dataDir, 'error-memory.json') });
    this.verifier = new DecisionVerifier();
    this.alignment = new AlignmentChecker();
    this.identity = new IdentityChecker();
    this.diagnostician = new Diagnostician();

    this._started = false;
  }

  start() {
    this._started = true;
    return this;
  }

  shutdown() {
    this._started = false;
  }

  getStats() {
    return {
      version: this.version,
      started: this._started,
      errorMemory: this.errorMemory.getStats(),
    };
  }
}

// ─── MCP 工具定义 ────────────────────────────────────────────────

const MCP_TOOLS = [
  {
    name: 'heartflow_memory_store',
    description: 'Record an error outcome into HeartFlow\'s persistent error memory. Call this after a failed action so the system remembers the failure pattern across sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'The problem/context description' },
        action: { type: 'string', description: 'What was done' },
        outcome: { type: 'string', description: 'What happened as a result' },
      },
      required: ['problem', 'action', 'outcome'],
    },
  },
  {
    name: 'heartflow_memory_query',
    description: 'Query HeartFlow\'s persistent error memory for similar past failures. Use before making a decision to avoid repeating past mistakes.',
    inputSchema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'The current problem to find similar past errors for' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['problem'],
    },
  },
  {
    name: 'heartflow_verify',
    description: 'Verify a decision or claim for evidence sufficiency, contradictions, risk, and completeness. HeartFlow\'s rule-based verifier, no sycophancy.',
    inputSchema: {
      type: 'object',
      properties: {
        decision: { type: 'string', description: 'The decision or claim to verify' },
        evidence: { type: 'array', items: { type: 'string' }, description: 'Supporting evidence' },
        confidence: { type: 'number', description: 'Confidence level 0-1' },
      },
      required: ['decision'],
    },
  },
  {
    name: 'heartflow_check_alignment',
    description: 'Check whether an output aligns with the system\'s stated mission. Returns aligned, drifted, or diverged.',
    inputSchema: {
      type: 'object',
      properties: {
        output: { type: 'string', description: 'The output text to check' },
        mission: { type: 'string', description: 'The mission statement to check against' },
      },
      required: ['output'],
    },
  },
  {
    name: 'heartflow_diagnose',
    description: 'Run HeartFlow\'s self-diagnosis. Returns a truthful report of the engine\'s own state, including known issues and limitations.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'heartflow_status',
    description: 'Get HeartFlow engine status and version.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

function createMCPHandlers(hf) {
  return {
    heartflow_memory_store: async (args) => {
      return hf.errorMemory.store(args.problem, args.action, args.outcome);
    },
    heartflow_memory_query: async (args) => {
      return hf.errorMemory.query(args.problem, args.limit || 5);
    },
    heartflow_verify: async (args) => {
      const v = hf.verifier.verify(args.decision, args.evidence || [], [], args.confidence);
      return {
        score: v.score,
        issues: (v.issues || []).map(i => ({ type: i.type, severity: i.severity, message: i.message })),
        checks: v.checks || {},
        repairHints: v.repairHints || [],
      };
    },
    heartflow_check_alignment: async (args) => {
      return hf.alignment.check(args.output, args.mission);
    },
    heartflow_diagnose: async () => {
      return hf.diagnostician.run();
    },
    heartflow_status: async () => {
      return hf.getStats();
    },
  };
}

module.exports = { HeartFlow, ErrorMemory, DecisionVerifier, AlignmentChecker, IdentityChecker, Diagnostician, MCP_TOOLS, createMCPHandlers };
