/**
 * Formula Module — HeartFlow 公式模块适配器
 * 
 * 符合 HeartFlow 模块规范，可通过 dispatch('formula.search') 等方式调用
 * 集成 FormulaEngine，提供公式搜索、计算、浏览功能
 */

const { FormulaEngine } = require('./formula-engine.js');

class FormulaModule {
  constructor(options = {}) {
    this.engine = new FormulaEngine(options);
    this.initialized = false;
  }

  /**
   * 初始化模块
   */
  init() {
    if (this.initialized) return;
    this.engine.init();
    this.initialized = true;
    return this;
  }

  /**
   * 搜索公式
   * dispatch('formula.search', keyword, options)
   */
  search(keyword, options = {}) {
    this.init();
    const raw = this.engine.searchFormulas(keyword, options);
    // searchFormulas 可能返回 {success, results} 或直接数组
    const results = Array.isArray(raw) ? raw : (raw.results || []);
    return {
      success: true,
      matched: true,  // 跳过 decisionRouter 包装
      count: results.length,
      results: results.map(f => ({
        id: f.id,
        name: f.name,
        formula: f.formula,
        category: f.category
      }))
    };
  }

  /**
   * 获取公式详情
   * dispatch('formula.getDetails', id, language)
   */
  getDetails(id, language = 'zh') {
    this.init();
    const details = this.engine.getFormulaDetails(id, language);
    if (details.error) {
      return { success: false, error: details.error };
    }
    return { success: true, matched: true, details: details.details };
  }

  /**
   * 计算公式
   * dispatch('formula.calculate', formulaId, values)
   */
  calculate(formulaId, values = {}) {
    this.init();
    const result = this.engine.calculate(formulaId, values);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, matched: true, result };
  }

  /**
   * 获取所有分类
   * dispatch('formula.getCategories')
   */
  getCategories() {
    this.init();
    const categories = this.engine.getCategories();
    return { success: true, matched: true, categories };
  }

  /**
   * 根据分类获取公式
   * dispatch('formula.getByCategory', category, subcategory)
   */
  getByCategory(category, subcategory = null) {
    this.init();
    const results = this.engine.getFormulasByCategory(category, subcategory);
    return {
      success: true,
      matched: true,
      count: results.length,
      category,
      subcategory,
      results: results.map(f => ({
        id: f.id,
        name: f.name,
        formula: f.formula
      }))
    };
  }

  /**
   * 获取引擎状态
   * dispatch('formula.getStatus')
   */
  getStatus() {
    this.init();
    const status = this.engine.getStatus();
    return { success: true, matched: true, status };
  }

  /**
   * 模糊搜索（别名）
   * dispatch('formula.lookup', keyword)
   */
  lookup(keyword) {
    return this.search(keyword);
  }

  /**
   * 健康检查
   * dispatch('formula.healthCheck')
   */
  healthCheck() {
    try {
      this.init();
      const status = this.engine.getStatus();
      return {
        success: true,
        matched: true,
        healthy: true,
        formulaCount: status.formulaCount,
        version: status.version
      };
    } catch (e) {
      return { success: false, healthy: false, error: e.message };
    }
  }
}

module.exports = { FormulaModule };
