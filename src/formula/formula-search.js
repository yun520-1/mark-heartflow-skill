/**
 * Formula Search — 公式搜索引擎
 * 
 * 功能: 根据关键词/领域/难度搜索公式
 * 支持: 中文/英文搜索、分类浏览、难度过滤
 */

const fs = require('fs');
const path = require('path');

class FormulaSearch {
  constructor(options = {}) {
    this.formulasFile = options.formulasFile || path.join(__dirname, '..', '..', 'formulas', 'formulas.json');
    this.formulas = this.loadFormulas();
  }

  /**
   * 加载公式库
   */
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
   * 搜索公式（关键词）
   */
  search(keyword, options = {}) {
    const {
      language = 'both',  // 'zh', 'en', 'both'
      category = null,
      difficulty = null,
      limit = 10
    } = options;

    let results = this.formulas;

    // 1. 关键词过滤
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      results = results.filter(formula => {
        const nameMatch = 
          (formula.name && formula.name.toLowerCase().includes(lowerKeyword)) ||
          (formula.name_en && formula.name_en.toLowerCase().includes(lowerKeyword));
        
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
        
        return nameMatch || descMatch || varMatch || appMatch;
      });
    }

    // 2. 分类过滤
    if (category) {
      results = results.filter(f => f.category === category);
    }

    // 3. 难度过滤
    if (difficulty) {
      results = results.filter(f => f.difficulty === difficulty);
    }

    // 4. 限制结果数
    if (limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    const categories = new Set();
    this.formulas.forEach(f => {
      categories.add(f.category);
      if (f.subcategory) {
        categories.add(`${f.category}/${f.subcategory}`);
      }
    });
    return Array.from(categories);
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
  getByCategory(category, subcategory = null) {
    let results = this.formulas.filter(f => f.category === category);
    if (subcategory) {
      results = results.filter(f => f.subcategory === subcategory);
    }
    return results;
  }

  /**
   * 获取公式详情（格式化输出）
   */
  getDetails(id, language = 'zh') {
    const formula = this.getById(id);
    if (!formula) {
      return { error: `公式 ${id} 未找到` };
    }

    const name = language === 'en' ? formula.name_en : formula.name;
    const description = language === 'en' ? formula.description_en : formula.description;

    let details = `# ${name}\n\n`;
    details += `**分类**: ${formula.category} / ${formula.subcategory}\n`;
    details += `**难度**: ${formula.difficulty}\n\n`;
    details += `## 公式\n\n`;
    details += `\`\`\`\n${formula.formula}\n\`\`\`\n\n`;
    details += `## LaTeX\n\n`;
    details += `\`\`\`latex\n${formula.latex}\n\`\`\`\n\n`;
    details += `## 变量\n\n`;
    for (const [key, variable] of Object.entries(formula.variables)) {
      const varName = language === 'en' ? variable.name_en : variable.name;
      const varDesc = language === 'en' ? variable.description_en : variable.description;
      details += `- **${key}**: ${varName} (${variable.unit}) — ${varDesc}\n`;
    }
    details += `\n## 说明\n\n${description}\n\n`;
    
    if (formula.examples && formula.examples.length > 0) {
      details += `## 示例\n\n`;
      formula.examples.forEach((example, index) => {
        details += `### 示例 ${index + 1}\n\n`;
        details += `**问题**: ${example.problem}\n\n`;
        details += `**解答**: ${example.solution}\n\n`;
      });
    }

    return { details };
  }
}

module.exports = { FormulaSearch };
