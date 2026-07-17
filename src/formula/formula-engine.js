/**
 * Formula Engine — 公式引擎主模块
 * 
 * 功能: 整合公式搜索、计算、推导功能
 * 集成: 可作为 HeartFlow 的认知模块使用
 */

const { FormulaSearch } = require('./formula-search.js');
const { FormulaCalculator } = require('./formula-calculator.js');

class FormulaEngine {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
    this.calculator = new FormulaCalculator(options);
    this.initialized = false;
    this._cache = null;  // 公式缓存（ID → 公式）
  }

  /**
   * 初始化引擎（带缓存）
   */
  init() {
    if (this.initialized) {
      return;
    }

    const formulaCount = this.search.formulas.length;
    console.log(`[FormulaEngine] 初始化完成，加载了 ${formulaCount} 个公式`);
    
    // 构建缓存（ID → 公式）
    this._cache = {};
    this.search.formulas.forEach(f => {
      this._cache[f.id] = f;
    });
    console.log(`[FormulaEngine] 缓存已构建（${Object.keys(this._cache).length} 个公式）`);
    
    this.initialized = true;
  }

  /**
   * 搜索公式
   */
  searchFormulas(keyword, options = {}) {
    this.init();
    return this.search.search(keyword, options);
  }

  /**
   * 获取公式详情
   */
  getFormulaDetails(id, language = 'zh') {
    this.init();
    return this.search.getDetails(id, language);
  }

  /**
   * 计算公式
   */
  calculate(formulaId, values) {
    this.init();
    return this.calculator.calculate(formulaId, values);
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    this.init();
    return this.search.getCategories();
  }

  /**
   * 根据分类获取公式
   */
  getFormulasByCategory(category, subcategory = null) {
    this.init();
    return this.search.getByCategory(category, subcategory);
  }

  /**
   * 添加新公式（简化版）
   */
  addFormula(formulaData) {
    // 简化实现：只做基本验证，不实际写入文件
    if (!formulaData.id || !formulaData.formula || !formulaData.category) {
      throw new Error('公式数据不完整（需要 id, formula, category）');
    }
    console.log(`[FormulaEngine] 添加公式（简化版）：${formulaData.id}`);
    return { success: true, id: formulaData.id, note: '简化版：未实际写入文件' };
  }

  /**
   * 从 arXiv 论文提取公式（简化版）
   */
  async extractFromArxiv(paperId) {
    // 简化实现：只打印提示，不实际下载
    console.log(`[FormulaEngine] arXiv 公式提取（简化版）：paperId=${paperId}`);
    console.log('  提示：完整实现需要 arXiv API + PDF 解析');
    return { success: false, note: '简化版：未实际提取', paperId };
  }

  /**
   * 公式推导（简化版）
   */
  deriveFormula(baseFormulaId, targetVariable) {
    // 简化实现：只打印提示，不实际推导
    console.log(`[FormulaEngine] 公式推导（简化版）：base=${baseFormulaId}, target=${targetVariable}`);
    console.log('  提示：完整实现需要符号计算（如 sympy.js）');
    return { success: false, note: '简化版：未实际推导', baseFormulaId, targetVariable };
  }

  /**
   * 获取引擎状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      formulaCount: this.search.formulas.length,
      categories: this.getCategories(),
      version: '1.0.0'
    };
  }
}

module.exports = { FormulaEngine };
