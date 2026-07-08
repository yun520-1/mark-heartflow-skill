/**
 * Formula Search — 公式搜索引擎（修复搜索功能）
 * 修复：搜索现在也匹配 formula.id 和 formula.formula（LaTeX 字符串）
 */

const fs = require('fs');
const path = require('path');

class FormulaSearch {
  constructor(options = {}) {
    this.formulasFile = options.formulasFile || path.join(__dirname, '..', '..', 'formulas', 'formulas.json');
    this.formulas = this.loadFormulas();
  }

  loadFormulas() {
    try {
      const content = fs.readFileSync(this.formulasFile, 'utf-8');
      const data = JSON.parse(content);
      return data.formulas || [];
    } catch (error) {
      console.warn('[FormulaSearch] 无法加载公式库:', error.message);
      return [];
    }
  }

  /**
   * 搜索公式（关键词）—— 修复版
   */
  search(keyword, options = {}) {
    const {
      language = 'both',
      category = null,
      difficulty = null,
      limit = 10
    } = options;

    let results = this.formulas;

    // 1. 关键词过滤（修复：也搜索 id 和 formula 字段）
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      results = results.filter(formula => {
        const nameMatch = 
            (formula.name && formula.name.toLowerCase().includes(lowerKeyword)) ||
            (formula.name_en && formula.name_en.toLowerCase().includes(lowerKeyword));
        
        const formulaMatch = 
            (formula.formula && formula.formula.toLowerCase().includes(lowerKeyword));
        
        const idMatch = 
            (formula.id && formula.id.toLowerCase().includes(lowerKeyword));
        
        const descMatch =
            (formula.description && formula.description.toLowerCase().includes(lowerKeyword)) ||
            (formula.description_en && formula.description_en.toLowerCase().includes(lowerKeyword));
        
        const varMatch = 
            (formula.variables && Object.values(formula.variables).some(v => 
              (v.name && v.name.toLowerCase().includes(lowerKeyword)) ||
              (v.name_en && v.name_en.toLowerCase().includes(lowerKeyword))
            )) ||
            (formula.constants && Object.values(formula.constants).some(c => 
              (c.name && c.name.toLowerCase().includes(lowerKeyword)) ||
              (c.name_en && c.name_en.toLowerCase().includes(lowerKeyword))
            ));
        
        const appMatch = 
            (formula.applications && formula.applications.some(app => 
              app.toLowerCase().includes(lowerKeyword)
            )) ||
            (formula.examples && formula.examples.some(ex => 
              (ex.problem && ex.problem.toLowerCase().includes(lowerKeyword)) ||
              (ex.solution && ex.solution.toLowerCase().includes(lowerKeyword))
            ));
        
        return nameMatch || formulaMatch || idMatch || descMatch || varMatch || appMatch;
      });
    }

    // 2. 分类过滤
    if (category) {
      results = results.filter(f => 
        f.category === category || 
        f.subcategory === category ||
        (f.tags && f.tags.includes(category))
      );
    }

    // 3. 难度过滤
    if (difficulty) {
      results = results.filter(f => f.difficulty === difficulty);
    }

    // 4. 限制结果数
    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    return {
      success: true,
      matched: true,
      count: results.length,
      results: results.map(f => ({
        id: f.id,
        name: f.name,
        name_en: f.name_en || '',
        formula: f.formula,
        category: f.category,
        subcategory: f.subcategory,
        difficulty: f.difficulty || 'intermediate'
      }))
    };
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    const cats = new Set();
    this.formulas.forEach(f => {
      if (f.category) cats.add(f.category);
      if (f.subcategory) cats.add(`${f.category}/${f.subcategory}`);
    });
    return [...cats].sort();
  }

  /**
   * 根据 ID 获取公式
   */
  getById(id) {
    return this.formulas.find(f => f.id === id) || null;
  }

  /**
   * 根据分类获取公式
   */
  getByCategory(category, limit = 0) {
    let results = this.formulas.filter(f => 
      f.category === category || 
      f.subcategory === category
    );
    if (limit > 0) {
      results = results.slice(0, limit);
    }
    return {
      success: true,
      count: results.length,
      results: results
    };
  }

  /**
   * 获取公式详情（包括变量说明）
   */
  getDetails(id) {
    const formula = this.getById(id);
    if (!formula) {
      return { error: `公式 ${id} 未找到` };
    }
    return {
      success: true,
      formula: formula
    };
  }
}

module.exports = { FormulaSearch };
