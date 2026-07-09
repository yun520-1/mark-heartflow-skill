/**
 * 语料库数学公式检索工具 (corpus-math-tool)
 *
 * v5.9.7 新增：把 formulas-corpus 里的特殊函数（DLMF）和推理公式（FormulaReasoning）
 * 暴露为"按需检索"工具，独立于心虫认知主链路。
 *
 * 设计原则（匹配心虫"不为了运用而运用"）：
 *  - 只做"检索"（按 id/关键词返回 LaTeX 公式文本 + 元数据），不做数值求解
 *  - 不并入主库、不接入 FormulaRegistry/Matcher（属硬科学参考）
 *  - 上层数学推理场景可按需调用，不增加认知引擎负担
 *  - 数据从 formulas-corpus 懒加载（第一次调用才读文件）
 */

const fs = require('fs');
const path = require('path');

const CORPUS_DIR = path.join(__dirname, '..', '..', 'formulas-corpus');

class CorpusMathTool {
  constructor() {
    this._dlmf = null;
    this._fr = null;
  }

  _loadDlmf() {
    if (this._dlmf) return this._dlmf;
    try {
      const p = path.join(CORPUS_DIR, 'dlmf', 'dlmf_formulas.json');
      this._dlmf = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { this._dlmf = []; }
    return this._dlmf;
  }

  _loadFormulareasoning() {
    if (this._fr) return this._fr;
    try {
      const p = path.join(CORPUS_DIR, 'formulareasoning', 'data', 'FormulaReasoning', 'formulas.json');
      this._fr = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { this._fr = []; }
    return this._fr;
  }

  /**
   * 按 id 或关键词检索公式
   * @param {string} query - 公式 id 或关键词（如 'gamma'、'bessel'、'dlmf_5_2_E1'）
   * @param {object} [opts] - { source: 'dlmf'|'fr'|'all', limit }
   * @returns {Array} [{ id, name, formula, source, category, subcategory }]
   */
  search(query, opts = {}) {
    const { source = 'all', limit = 10 } = opts;
    const q = (query || '').toLowerCase();
    let results = [];
    if (source === 'all' || source === 'dlmf') {
      results = results.concat(this._loadDlmf().map(f => ({ ...f, source: 'dlmf' })));
    }
    if (source === 'all' || source === 'fr') {
      results = results.concat(this._loadFormulareasoning().map(f => ({ ...f, source: 'formulareasoning' })));
    }
    if (!q) return results.slice(0, limit);
    return results.filter(f =>
      (f.id && f.id.toLowerCase().includes(q)) ||
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.formula && f.formula.toLowerCase().includes(q)) ||
      (f.subcategory && f.subcategory.toLowerCase().includes(q))
    ).slice(0, limit);
  }

  /**
   * 按 id 精确取一条公式
   */
  get(id) {
    const all = this._loadDlmf().concat(this._loadFormulareasoning());
    return all.find(f => f.id === id) || null;
  }

  getStats() {
    return {
      dlmf: this._loadDlmf().length,
      formulareasoning: this._loadFormulareasoning().length,
      note: '硬科学参考语料，独立于认知主链路；仅做检索，不做数值求解',
    };
  }
}

let _instance = null;
function getCorpusMathTool() {
  if (!_instance) _instance = new CorpusMathTool();
  return _instance;
}

module.exports = { CorpusMathTool, getCorpusMathTool };
