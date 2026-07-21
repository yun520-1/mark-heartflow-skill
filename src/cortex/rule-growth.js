/**
 * RuleGrowth — 心虫判断生长引擎（v6.0.59）
 *
 * 背景：心虫的"做判断"能力长期是死的——19 条硬编码规则（decisionRouter）
 *        + thoughtChain._classifyTask 写死分类，遇到未见过的输入只能 hold/reflect，
 *        不会"长出新判断"。这违背了用户定义的"做判断"核心身份。
 *
 * 本模块让心虫能从对话反馈里归纳新判断规则，持久化到 data/learned-rules.json，
 * 下次启动自动加载进决策路由。判断从"写死"变为"可生长"。
 *
 * 设计原则：
 *  - 独立模块，不重写 think()/_classifyTask 主体（避免动大文件）
 *  - 规则格式兼容 DecisionRouter.addRule({id, match, decision})
 *  - 只学"高频、低冲突"的模式，防止噪声污染判断
 *  - match 用关键词/正则轻量匹配，不引入 LLM 依赖
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const LEARNED_RULES_FILE = 'data/learned-rules.json';
const MIN_OCCURRENCE = 3; // 同一模式出现 >=3 次才固化成规则（防噪声）

class RuleGrowth {

  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.rulesFile = path.join(projectRoot, LEARNED_RULES_FILE);
    this.rules = [];
    this._pending = {}; // patternKey -> { pattern, decision, rationale, count }
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.rulesFile)) {
        const data = JSON.parse(fs.readFileSync(this.rulesFile, 'utf8'));
        this.rules = Array.isArray(data.rules) ? data.rules : [];
      }
    } catch (e) {
      this.rules = [];
    }
  }

  _save() {
    try {
      const dir = path.dirname(this.rulesFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.rulesFile, JSON.stringify({ rules: this.rules, pending: this._pending }, null, 2));
    } catch (e) { /* 持久化失败不阻断主流程 */ }
  }

  /**
   * 观察一次"输入→心虫该做的决策"信号（来自用户反馈或自检）
   * @param {string} pattern 触发模式（关键词/正则字符串）
   * @param {string} decision 该做的决策（如 ANALYZE / SUMMARIZE / OUT_OF_SCOPE）
   * @param {string} rationale 理由
   * @param {string} [userFacing] 给用户看的直白一句话（不堆引擎术语），可选
   */
  observe(pattern, decision, rationale = '', userFacing = '') {
    if (!pattern || !decision) return false;
    const key = `${decision}::${pattern}`;
    if (!this._pending[key]) this._pending[key] = { pattern, decision, rationale, userFacing, count: 0 };
    this._pending[key].count++;
    // 达到阈值 → 固化为规则
    if (this._pending[key].count >= MIN_OCCURRENCE) {
      this._固化(key);
    }
    this._save();
    return true;
  }

  _固化(key) {
    const p = this._pending[key];
    if (!p) return;
    const rule = {
      id: `learned-${Date.now()}-${this.rules.length}`,
      pattern: p.pattern,
      decision: p.decision,
      rationale: p.rationale,
      userFacing: p.userFacing || '',
      learnedAt: Date.now(),
      source: 'rule-growth',
    };
    // 去重：同 decision+pattern 不重复加
    const exists = this.rules.some(r => r.pattern === p.pattern && r.decision === p.decision);
    if (!exists) this.rules.push(rule);
    delete this._pending[key];
  }

  /**
   * 评估输入：返回匹配到的已学规则（供 think() 主链路挂载 learned override）
   * @param {string} input
   * @returns {{decision:string, rationale:string, learned:boolean}|null}
   */
  evaluate(input) {
    if (typeof input !== 'string' || !input.trim()) return null;
    for (const r of this.rules) {
      try {
        const re = new RegExp(r.pattern, 'i');
        if (re.test(input)) {
          return { decision: r.decision, rationale: r.rationale, userFacing: r.userFacing || '', learned: true, ruleId: r.id };
        }
      } catch (e) { /* 非法正则跳过 */ }
    }
    return null;
  }

  /** 导出为 DecisionRouter 兼容的规则数组 */
  toDecisionRouterRules() {
    return this.rules.map(r => ({
      id: r.id,
      match: (res) => {
        // res 可能含 input 字段（think 路由结果）或原始字符串
        const text = (res && res.input) ? res.input : (typeof res === 'string' ? res : '');
        try { return new RegExp(r.pattern, 'i').test(text); } catch (e) { return false; }
      },
      decision: r.decision,
      rationale: () => r.rationale,
      confidence: () => 0.7,
      fallback: 'HOLD',
    }));
  }

  getStats() {
    return {
      learnedRules: this.rules.length,
      pendingPatterns: Object.keys(this._pending).length,
      version: '1.0.0',
    };
  }
}

module.exports = { RuleGrowth, MIN_OCCURRENCE };
